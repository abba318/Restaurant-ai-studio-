import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await db.getSettings();
    // Sanitize secrets before sending to public client
    const publicSettings = {
      restaurantName: settings.restaurantName,
      tagline: settings.tagline,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      deliveryBaseFee: settings.deliveryBaseFee,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      isOnlineOrderingOpen: settings.isOnlineOrderingOpen,
      estimatedDeliveryTime: settings.estimatedDeliveryTime,
      estimatedPickupTime: settings.estimatedPickupTime,
      deliveryZones: settings.deliveryZones,
      paystackMode: settings.paystackMode,
      paystackPublicKey: settings.paystackMode === 'live' ? settings.paystackLivePublicKey : settings.paystackTestPublicKey,
    };
    return NextResponse.json({ success: true, settings: publicSettings });
  } catch (error) {
    console.error('[API Settings GET Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.restaurantName) updates.restaurantName = String(body.restaurantName).trim();
    if (body.tagline) updates.tagline = String(body.tagline).trim();
    if (body.phone) updates.phone = String(body.phone).trim();
    if (body.email) updates.email = String(body.email).trim();
    if (body.address) updates.address = String(body.address).trim();
    if (typeof body.deliveryBaseFee === 'number') updates.deliveryBaseFee = Math.max(0, Math.round(body.deliveryBaseFee));
    if (typeof body.freeDeliveryThreshold === 'number') updates.freeDeliveryThreshold = Math.max(0, Math.round(body.freeDeliveryThreshold));
    if (typeof body.isOnlineOrderingOpen === 'boolean') updates.isOnlineOrderingOpen = body.isOnlineOrderingOpen;
    if (body.estimatedDeliveryTime) updates.estimatedDeliveryTime = String(body.estimatedDeliveryTime);
    if (body.estimatedPickupTime) updates.estimatedPickupTime = String(body.estimatedPickupTime);

    // Paystack settings
    if (body.paystackMode === 'test' || body.paystackMode === 'live') {
      updates.paystackMode = body.paystackMode;
    }
    if (typeof body.paystackTestPublicKey === 'string') updates.paystackTestPublicKey = body.paystackTestPublicKey.trim();
    if (typeof body.paystackTestSecretKey === 'string') updates.paystackTestSecretKey = body.paystackTestSecretKey.trim();
    if (typeof body.paystackLivePublicKey === 'string') updates.paystackLivePublicKey = body.paystackLivePublicKey.trim();
    if (typeof body.paystackLiveSecretKey === 'string') updates.paystackLiveSecretKey = body.paystackLiveSecretKey.trim();

    // Delivery zones
    if (Array.isArray(body.deliveryZones)) {
      updates.deliveryZones = body.deliveryZones;
    }

    // Admin password update
    if (body.newAdminPassword && typeof body.newAdminPassword === 'string' && body.newAdminPassword.length >= 6) {
      updates.adminPasswordHash = hashPassword(body.newAdminPassword);
    }

    const saved = await db.updateSettings(updates);
    return NextResponse.json({ success: true, settings: saved });
  } catch (error) {
    console.error('[API Settings PUT Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
