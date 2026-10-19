import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPaystackTransaction } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference } = body;

    if (!reference || typeof reference !== 'string') {
      return NextResponse.json({ success: false, error: 'Payment reference is required' }, { status: 400 });
    }

    const cleanRef = reference.trim();

    // 1. Locate Payment Record and Associated Order
    const payment = await db.getPaymentByReference(cleanRef);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Transaction reference not found in database' }, { status: 404 });
    }

    const order = await db.getOrderById(payment.orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Associated order not found' }, { status: 404 });
    }

    // 2. Perform Strict Server-Side Verification against Paystack
    const verification = await verifyPaystackTransaction(cleanRef, payment.amountKobo);

    const now = new Date().toISOString();

    if (verification.verified && verification.status === 'success') {
      // Payment Successful
      await db.updatePaymentRecord(cleanRef, {
        status: 'success',
        gatewayResponse: verification.gatewayResponse,
        channel: verification.channel,
        paidAt: verification.paidAt || now,
        verifiedAt: now,
        rawVerificationData: verification.rawData,
      });

      // Update Order to Confirmed (only if not already advancing)
      await db.updateOrderPayment(order.id, 'success', cleanRef, payment.id);

      const updatedOrder = await db.getOrderById(order.id);

      return NextResponse.json({
        success: true,
        verified: true,
        status: 'success',
        message: 'Payment verified successfully and order confirmed.',
        order: updatedOrder,
      });
    }

    // Payment Failed or Abandoned
    const finalPaymentStatus = verification.status === 'abandoned' ? 'abandoned' : 'failed';
    await db.updatePaymentRecord(cleanRef, {
      status: finalPaymentStatus,
      gatewayResponse: verification.gatewayResponse || 'Payment unsuccessful',
      verifiedAt: now,
      rawVerificationData: verification.rawData,
    });

    await db.updateOrderPayment(order.id, finalPaymentStatus, cleanRef, payment.id);

    return NextResponse.json({
      success: false,
      verified: false,
      status: finalPaymentStatus,
      error: verification.error || `Payment status is ${verification.status}`,
      orderId: order.id,
    });
  } catch (error) {
    console.error('[API Paystack Verify Error]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Payment verification failed' },
      { status: 500 }
    );
  }
}
