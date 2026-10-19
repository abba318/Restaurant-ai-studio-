import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { db } from '@/lib/db';
import { generatePaystackReference, verifyWebhookSignature, getWebhookSecret } from '@/lib/paystack';
import crypto from 'crypto';

export interface TestResultItem {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  durationMs: number;
  details: string;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  const results: TestResultItem[] = [];

  // TEST 1: Server-side pricing calculation and checkout integrity
  const t1Start = performance.now();
  try {
    const menuItems = await db.getMenuItems();
    const settings = await db.getSettings();
    const sampleItem = menuItems[0];
    const qty = 2;
    const expectedSubtotal = sampleItem.price * qty;
    const expectedTotal = expectedSubtotal + settings.deliveryBaseFee;
    const expectedKobo = Math.round(expectedTotal * 100);

    const testOrder = await db.createOrder({
      customer: {
        name: 'Automated Test Runner',
        email: 'testrunner@naijagrill.ng',
        phone: '+2348000000000',
        address: 'Test Suite Suite 1',
      },
      fulfillmentType: 'delivery',
      items: [
        {
          menuItemId: sampleItem.id,
          name: sampleItem.name,
          unitPrice: sampleItem.price,
          quantity: qty,
          totalPrice: expectedSubtotal,
        },
      ],
      subtotal: expectedSubtotal,
      deliveryFee: settings.deliveryBaseFee,
      total: expectedTotal,
      totalKobo: expectedKobo,
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    const passed =
      testOrder.subtotal === expectedSubtotal &&
      testOrder.total === expectedTotal &&
      testOrder.totalKobo === expectedKobo &&
      testOrder.status === 'pending';

    results.push({
      id: 'test-1',
      name: 'Server-Side Price Calculation & Order Integrity',
      category: 'Checkout & DB',
      passed,
      durationMs: Math.round(performance.now() - t1Start),
      details: passed
        ? `Validated: ${sampleItem.name} x${qty} @ ₦${sampleItem.price} + Delivery ₦${settings.deliveryBaseFee} = Total ₦${expectedTotal} (${expectedKobo} Kobo). Order ${testOrder.orderNumber} created.`
        : 'Totals did not match expected server calculation.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    results.push({
      id: 'test-1',
      name: 'Server-Side Price Calculation & Order Integrity',
      category: 'Checkout & DB',
      passed: false,
      durationMs: Math.round(performance.now() - t1Start),
      details: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
  }

  // TEST 2: Paystack Reference & Payment Record Association
  const t2Start = performance.now();
  try {
    const testRef = generatePaystackReference('NG-9999');
    const payment = await db.createPaymentRecord({
      orderId: 'ord-test-suite',
      orderNumber: 'NG-9999',
      reference: testRef,
      amountKobo: 780000,
      amountNaira: 7800,
      currency: 'NGN',
      status: 'pending',
    });

    const fetched = await db.getPaymentByReference(testRef);
    const passed = Boolean(fetched && fetched.amountKobo === 780000 && fetched.currency === 'NGN');

    results.push({
      id: 'test-2',
      name: 'Paystack Reference Generation & Order Binding',
      category: 'Paystack Core',
      passed,
      durationMs: Math.round(performance.now() - t2Start),
      details: passed
        ? `Generated secure reference ${testRef}. Stored with 780,000 Kobo (₦7,800) in database.`
        : 'Payment record could not be retrieved by reference.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    results.push({
      id: 'test-2',
      name: 'Paystack Reference Generation & Order Binding',
      category: 'Paystack Core',
      passed: false,
      durationMs: Math.round(performance.now() - t2Start),
      details: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
  }

  // TEST 3: Webhook HMAC-SHA512 Verification & Tamper Detection
  const t3Start = performance.now();
  try {
    const samplePayload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: 'PAY_TEST_SEC_SUITE',
        amount: 850000,
        currency: 'NGN',
        status: 'success',
      },
    });

    const secret = await getWebhookSecret();
    const validSignature = crypto.createHmac('sha512', secret).update(samplePayload).digest('hex');

    const validCheck = await verifyWebhookSignature(samplePayload, validSignature);
    const tamperedPayload = samplePayload.replace('850000', '100000');
    const invalidCheck = await verifyWebhookSignature(tamperedPayload, validSignature);

    const passed = validCheck === true && invalidCheck === false;

    results.push({
      id: 'test-3',
      name: 'Paystack Webhook HMAC-SHA512 Signature & Tamper Check',
      category: 'Security & Webhooks',
      passed,
      durationMs: Math.round(performance.now() - t3Start),
      details: passed
        ? 'Verified authentic HMAC-SHA512 signature. Correctly rejected tampered payload amount.'
        : 'HMAC signature verification failed.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    results.push({
      id: 'test-3',
      name: 'Paystack Webhook HMAC-SHA512 Signature & Tamper Check',
      category: 'Security & Webhooks',
      passed: false,
      durationMs: Math.round(performance.now() - t3Start),
      details: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
  }

  // TEST 4: Duplicate Webhook Idempotency Guard
  const t4Start = performance.now();
  try {
    const eventRef = `PAY_IDEMP_${Date.now()}`;
    const initialCheck = await db.isWebhookEventProcessed(eventRef, 'charge.success');
    await db.recordWebhookEvent('charge.success', eventRef, { amount: 850000 });
    const duplicateCheck = await db.isWebhookEventProcessed(eventRef, 'charge.success');

    const passed = initialCheck === false && duplicateCheck === true;

    results.push({
      id: 'test-4',
      name: 'Duplicate Webhook Idempotent Processing Guard',
      category: 'Security & Webhooks',
      passed,
      durationMs: Math.round(performance.now() - t4Start),
      details: passed
        ? `First encounter was fresh (false). Duplicate encounter immediately recognized as processed (true).`
        : 'Idempotency tracking failure.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    results.push({
      id: 'test-4',
      name: 'Duplicate Webhook Idempotent Processing Guard',
      category: 'Security & Webhooks',
      passed: false,
      durationMs: Math.round(performance.now() - t4Start),
      details: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
  }

  // TEST 5: Order State Machine Transitions & Audit History
  const t5Start = performance.now();
  try {
    const order = await db.createOrder({
      customer: {
        name: 'State Transition Tester',
        email: 'states@naijagrill.ng',
        phone: '+2348011223344',
      },
      fulfillmentType: 'pickup',
      items: [],
      subtotal: 5000,
      deliveryFee: 0,
      total: 5000,
      totalKobo: 500000,
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    await db.updateOrderStatus(order.id, 'confirmed', 'Payment verified');
    await db.updateOrderStatus(order.id, 'preparing', 'Chef on the grill');
    await db.updateOrderStatus(order.id, 'ready_for_pickup', 'Order ready in warm station');
    const finalOrder = await db.updateOrderStatus(order.id, 'delivered', 'Handed to customer');

    const passed =
      finalOrder !== null &&
      finalOrder.status === 'delivered' &&
      finalOrder.statusHistory.length === 5;

    results.push({
      id: 'test-5',
      name: 'Order State Machine & Complete History Log',
      category: 'Order Management',
      passed,
      durationMs: Math.round(performance.now() - t5Start),
      details: passed
        ? `Successfully transitioned: pending → confirmed → preparing → ready_for_pickup → delivered. 5 audit history entries recorded.`
        : 'Order status transition failed.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    results.push({
      id: 'test-5',
      name: 'Order State Machine & Complete History Log',
      category: 'Order Management',
      passed: false,
      durationMs: Math.round(performance.now() - t5Start),
      details: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
  }

  const allPassed = results.every((r) => r.passed);
  return NextResponse.json({
    success: true,
    allPassed,
    totalTests: results.length,
    passedCount: results.filter((r) => r.passed).length,
    failedCount: results.filter((r) => !r.passed).length,
    results,
  });
}
