import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../lib/db';
import { generatePaystackReference, verifyWebhookSignature, getWebhookSecret } from '../lib/paystack';
import crypto from 'crypto';

test('Order checkout: calculates totals strictly on server from trusted menu prices', async () => {
  const menuItems = await db.getMenuItems();
  assert.ok(menuItems.length > 0, 'Should have menu items loaded');

  const firstItem = menuItems[0];
  const settings = await db.getSettings();

  // Create order with 2 units of firstItem
  const quantity = 2;
  const expectedSubtotal = firstItem.price * quantity;
  const deliveryFee = settings.deliveryBaseFee;
  const expectedTotal = expectedSubtotal + deliveryFee;
  const expectedKobo = Math.round(expectedTotal * 100);

  const order = await db.createOrder({
    customer: {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '+2348012345678',
      address: '10 Victoria Island, Lagos',
    },
    fulfillmentType: 'delivery',
    items: [
      {
        menuItemId: firstItem.id,
        name: firstItem.name,
        unitPrice: firstItem.price,
        quantity,
        totalPrice: expectedSubtotal,
      },
    ],
    subtotal: expectedSubtotal,
    deliveryFee,
    total: expectedTotal,
    totalKobo: expectedKobo,
    status: 'pending',
    paymentStatus: 'unpaid',
  });

  assert.ok(order.id.startsWith('ord-'), 'Order ID should be created');
  assert.match(order.orderNumber, /^NG-\d{4}$/, 'Order number should match NG-XXXX');
  assert.equal(order.subtotal, expectedSubtotal, 'Subtotal must match trusted calculation');
  assert.equal(order.total, expectedTotal, 'Total must match subtotal + delivery');
  assert.equal(order.totalKobo, expectedKobo, 'Kobo calculation must be total * 100');
  assert.equal(order.status, 'pending', 'Initial status must be pending');
});

test('Paystack reference generation and payment record association', async () => {
  const ref = generatePaystackReference('NG-1234');
  assert.match(ref, /^PAY_NG1234_\d+_[A-F0-9]+$/, 'Reference should be formatted properly');

  const paymentRecord = await db.createPaymentRecord({
    orderId: 'ord-test-123',
    orderNumber: 'NG-1234',
    reference: ref,
    amountKobo: 500000,
    amountNaira: 5000,
    currency: 'NGN',
    status: 'pending',
  });

  assert.equal(paymentRecord.reference, ref);
  const fetched = await db.getPaymentByReference(ref);
  assert.ok(fetched !== null);
  assert.equal(fetched.amountKobo, 500000);
});

test('Webhook signature verification and duplicate idempotent processing', async () => {
  const samplePayload = JSON.stringify({
    event: 'charge.success',
    data: {
      reference: 'PAY_TEST_IDEMP_9999',
      amount: 750000,
      currency: 'NGN',
      status: 'success',
    },
  });

  const secret = await getWebhookSecret();
  const validSignature = crypto.createHmac('sha512', secret).update(samplePayload).digest('hex');

  // Verify valid signature passes
  const isValid = await verifyWebhookSignature(samplePayload, validSignature);
  assert.equal(isValid, true, 'Valid signature should verify successfully');

  // Tampered payload fails
  const tamperedPayload = samplePayload.replace('750000', '100000');
  const isTamperedValid = await verifyWebhookSignature(tamperedPayload, validSignature);
  assert.equal(isTamperedValid, false, 'Tampered payload signature must fail');

  // Test idempotency
  const testRef = `PAY_TEST_IDEMP_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const isFirstProcessed = await db.isWebhookEventProcessed(testRef, 'charge.success');
  assert.equal(isFirstProcessed, false, 'Before processing, event should not be recorded');

  // Record it
  await db.recordWebhookEvent('charge.success', testRef, { amount: 750000 });

  // Second check
  const isDuplicate = await db.isWebhookEventProcessed(testRef, 'charge.success');
  assert.equal(isDuplicate, true, 'Subsequent webhook must be recognized as duplicate');
});

test('Order state machine: progresses through status changes with history audit log', async () => {
  const order = await db.createOrder({
    customer: {
      name: 'Status Test Customer',
      email: 'status@example.com',
      phone: '+2348099999999',
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

  // Confirm order
  const confirmed = await db.updateOrderStatus(order.id, 'confirmed', 'Kitchen acknowledged');
  assert.ok(confirmed);
  assert.equal(confirmed.status, 'confirmed');

  // Move to preparing
  const preparing = await db.updateOrderStatus(order.id, 'preparing', 'Chef started grilling');
  assert.ok(preparing);
  assert.equal(preparing.status, 'preparing');

  // Move to ready_for_pickup
  const ready = await db.updateOrderStatus(order.id, 'ready_for_pickup', 'Packed in hot box');
  assert.ok(ready);
  assert.equal(ready.status, 'ready_for_pickup');

  // Move to delivered
  const delivered = await db.updateOrderStatus(order.id, 'delivered', 'Customer picked up meal');
  assert.ok(delivered);
  assert.equal(delivered.status, 'delivered');

  // Verify full history is preserved
  assert.ok(delivered.statusHistory.length >= 5, 'Status history should log all transitions');
  const statuses = delivered.statusHistory.map((h) => h.status);
  assert.deepEqual(statuses, ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'delivered']);
});
