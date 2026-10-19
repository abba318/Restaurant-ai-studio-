import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { generatePaystackReference, initializePaystackTransaction } from '@/lib/paystack';
import { OrderItem } from '@/lib/types';
import { sendOrderReceiptEmail } from '@/lib/mailer';

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const orders = await db.getOrders(limit);
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('[API Orders GET Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, fulfillmentType, items, deliveryZoneId, notes, location } = body;

    // 1. Basic Input Validation & Sanitization
    if (!customer || !customer.name || !customer.phone || !customer.email) {
      return NextResponse.json(
        { success: false, error: 'Customer name, phone number, and email are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email.trim())) {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const cleanPhone = String(customer.phone || '').trim();
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (cleanPhone.length < 5 || phoneDigits.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid contact phone number (e.g. 0803 123 4567 or +234 803 123 4567).' },
        { status: 400 }
      );
    }

    if (fulfillmentType !== 'delivery' && fulfillmentType !== 'pickup') {
      return NextResponse.json({ success: false, error: 'Invalid fulfillment type. Choose delivery or pickup.' }, { status: 400 });
    }

    if (fulfillmentType === 'delivery' && (!customer.address || customer.address.trim().length < 5)) {
      return NextResponse.json({ success: false, error: 'Delivery address is required for delivery orders.' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Your cart is empty. Please add items before checkout.' }, { status: 400 });
    }

    // 2. Fetch Restaurant Settings & Check if ordering is open
    const settings = await db.getSettings();
    if (!settings.isOnlineOrderingOpen) {
      return NextResponse.json(
        { success: false, error: 'Online ordering is currently paused. Please contact the kitchen directly.' },
        { status: 400 }
      );
    }

    // 3. SERVER-SIDE TRUSTED PRICE CALCULATION
    // We NEVER trust client-submitted unit prices or line-item totals!
    const validatedItems: OrderItem[] = [];
    let calculatedSubtotal = 0;

    for (const itemInput of items) {
      const quantity = Math.max(1, Math.min(50, Math.floor(Number(itemInput.quantity) || 1)));
      const menuItem = await db.getMenuItemById(itemInput.menuItemId);

      if (!menuItem) {
        return NextResponse.json(
          { success: false, error: `Menu item with ID ${itemInput.menuItemId} is no longer available.` },
          { status: 400 }
        );
      }

      if (!menuItem.isAvailable) {
        return NextResponse.json(
          { success: false, error: `Sorry, "${menuItem.name}" is currently sold out.` },
          { status: 400 }
        );
      }

      // Exact server-verified unit price
      const unitPrice = menuItem.price;
      const lineTotal = unitPrice * quantity;
      calculatedSubtotal += lineTotal;

      validatedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        unitPrice,
        quantity,
        totalPrice: lineTotal,
        specialInstructions: itemInput.specialInstructions ? String(itemInput.specialInstructions).slice(0, 200).trim() : undefined,
        image: menuItem.image,
      });
    }

    // 4. Calculate Delivery Fee
    let calculatedDeliveryFee = 0;
    let selectedDeliveryAreaName = '';

    if (fulfillmentType === 'delivery') {
      let zoneFee = settings.deliveryBaseFee;
      if (deliveryZoneId && settings.deliveryZones) {
        const foundZone = settings.deliveryZones.find((z) => z.id === deliveryZoneId);
        if (foundZone) {
          zoneFee = foundZone.fee;
          selectedDeliveryAreaName = foundZone.name;
        }
      }

      // Check if eligible for free delivery promotion
      if (settings.freeDeliveryThreshold > 0 && calculatedSubtotal >= settings.freeDeliveryThreshold) {
        calculatedDeliveryFee = 0;
      } else {
        calculatedDeliveryFee = zoneFee;
      }
    }

    const calculatedTotal = calculatedSubtotal + calculatedDeliveryFee;
    const totalKobo = Math.round(calculatedTotal * 100);

    // 5. Create Order in Persistent Database
    const newOrder = await db.createOrder({
      customer: {
        name: String(customer.name).trim().slice(0, 100),
        email: String(customer.email).trim().toLowerCase().slice(0, 100),
        phone: String(customer.phone).trim().slice(0, 30),
        address: fulfillmentType === 'delivery' ? String(customer.address || '').trim().slice(0, 250) : undefined,
        deliveryArea: selectedDeliveryAreaName || undefined,
        notes: notes ? String(notes).trim().slice(0, 300) : undefined,
      },
      fulfillmentType,
      items: validatedItems,
      subtotal: calculatedSubtotal,
      deliveryFee: calculatedDeliveryFee,
      total: calculatedTotal,
      totalKobo,
      status: 'pending',
      paymentStatus: 'unpaid',
      location:
        location && typeof location.latitude === 'number' && typeof location.longitude === 'number'
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              mapUrl: `https://maps.google.com/?q=${location.latitude},${location.longitude}`,
              capturedAt: new Date().toISOString(),
            }
          : undefined,
    });

    // 6. Generate Unique Paystack Reference
    const paystackRef = generatePaystackReference(newOrder.orderNumber);

    // 7. Create Payment Record in Database
    const paymentRecord = await db.createPaymentRecord({
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      reference: paystackRef,
      amountKobo: totalKobo,
      amountNaira: calculatedTotal,
      currency: 'NGN',
      status: 'pending',
    });

    // Link payment to order
    await db.updateOrderPayment(newOrder.id, 'pending', paystackRef, paymentRecord.id);

    // 8. Initialize Paystack Transaction on Server
    const appBaseUrl = process.env.APP_URL || (req.headers.get('origin') ?? 'http://localhost:3000');
    const callbackUrl = `${appBaseUrl}/order/verify?reference=${encodeURIComponent(paystackRef)}`;

    // Send customer order email in background
    sendOrderReceiptEmail(newOrder, appBaseUrl).catch((mailErr) => {
      console.warn('[Gmail Order Confirmation Warning]:', mailErr);
    });

    const paystackInit = await initializePaystackTransaction({
      email: newOrder.customer.email,
      amountKobo: totalKobo,
      reference: paystackRef,
      callbackUrl,
      metadata: {
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customer.name,
        phone: newOrder.customer.phone,
        fulfillmentType: newOrder.fulfillmentType,
      },
    });

    // Update payment record with access code & authorization URL
    await db.updatePaymentRecord(paystackRef, {
      paystackAccessCode: paystackInit.data.access_code,
      authorizationUrl: paystackInit.data.authorization_url,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        reference: paystackRef,
        authorizationUrl: paystackInit.data.authorization_url,
        accessCode: paystackInit.data.access_code,
        isSimulated: paystackInit.isSimulated || false,
        subtotal: calculatedSubtotal,
        deliveryFee: calculatedDeliveryFee,
        total: calculatedTotal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Orders POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
