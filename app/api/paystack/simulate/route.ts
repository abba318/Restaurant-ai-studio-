import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference, action, cardLast4 } = body;

    if (!reference) {
      return NextResponse.json({ success: false, error: 'Reference is required' }, { status: 400 });
    }

    const payment = await db.getPaymentByReference(reference);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment reference not found' }, { status: 404 });
    }

    const order = await db.getOrderById(payment.orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      await db.updatePaymentRecord(reference, {
        status: 'success',
        gatewayResponse: 'Approved (Simulated Test Payment)',
        channel: 'card',
        paidAt: now,
        verifiedAt: now,
        rawVerificationData: {
          simulated: true,
          card_last4: cardLast4 || '4081',
          gateway: 'Paystack Test Simulation',
        },
      });

      await db.updateOrderPayment(order.id, 'success', reference, payment.id);

      return NextResponse.json({
        success: true,
        message: 'Payment simulation approved',
        status: 'success',
        orderId: order.id,
      });
    }

    if (action === 'fail') {
      await db.updatePaymentRecord(reference, {
        status: 'failed',
        gatewayResponse: 'Declined: Insufficient Funds (Simulated)',
        verifiedAt: now,
      });

      await db.updateOrderPayment(order.id, 'failed', reference, payment.id);

      return NextResponse.json({
        success: true,
        message: 'Payment simulation failed',
        status: 'failed',
        orderId: order.id,
      });
    }

    if (action === 'abandon') {
      await db.updatePaymentRecord(reference, {
        status: 'abandoned',
        gatewayResponse: 'Customer closed Paystack checkout modal',
      });

      await db.updateOrderPayment(order.id, 'abandoned', reference, payment.id);

      return NextResponse.json({
        success: true,
        message: 'Payment simulation abandoned',
        status: 'abandoned',
        orderId: order.id,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid simulation action' }, { status: 400 });
  } catch (error) {
    console.error('[API Paystack Simulate Error]:', error);
    return NextResponse.json({ success: false, error: 'Simulation execution failed' }, { status: 500 });
  }
}
