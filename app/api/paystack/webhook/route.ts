import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    // 1. Read Raw Body as Text for Cryptographic Signature Verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // 2. Cryptographic HMAC SHA-512 Verification
    const isSignatureValid = await verifyWebhookSignature(rawBody, signature);

    // In production, reject if signature does not match
    // Note: If no real Paystack key is configured yet, we check if signature matches
    if (!isSignatureValid) {
      console.warn('[Paystack Webhook]: Invalid HMAC signature detected.');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const event = String(payload.event || '');
    const data = (payload.data || {}) as Record<string, unknown>;
    const reference = String(data.reference || '');

    if (!reference) {
      // Non-transaction webhook event, acknowledge safely
      return NextResponse.json({ status: 'ignored', message: 'No reference present in event' }, { status: 200 });
    }

    // 3. IDEMPOTENCY CHECK
    // Never process the exact same webhook event twice
    const alreadyProcessed = await db.isWebhookEventProcessed(reference, event);
    if (alreadyProcessed) {
      console.log(`[Paystack Webhook Idempotency]: Event ${event} for ref ${reference} already processed. Returning 200.`);
      return NextResponse.json({ status: 'duplicate', message: 'Event already processed' }, { status: 200 });
    }

    // 4. Handle Supported Paystack Events
    if (event === 'charge.success') {
      const payment = await db.getPaymentByReference(reference);

      if (payment) {
        const receivedKobo = Number(data.amount);
        const receivedCurrency = String(data.currency || 'NGN');

        // STRICT VALIDATION: Ensure currency is NGN and amount matches
        if (receivedCurrency === 'NGN' && receivedKobo === payment.amountKobo) {
          const now = new Date().toISOString();

          await db.updatePaymentRecord(reference, {
            status: 'success',
            gatewayResponse: String(data.gateway_response || 'Approved'),
            channel: String(data.channel || 'card'),
            paidAt: String(data.paid_at || now),
            webhookProcessedAt: now,
            rawVerificationData: data,
          });

          // Confirm the order if not already advanced
          await db.updateOrderPayment(payment.orderId, 'success', reference, payment.id);
        } else {
          console.error(
            `[Paystack Webhook Amount Tamper]: Expected ${payment.amountKobo} kobo, received ${receivedKobo} kobo.`
          );
        }
      } else {
        console.warn(`[Paystack Webhook]: No matching payment record found for ref ${reference}`);
      }
    } else if (event === 'charge.failed') {
      const payment = await db.getPaymentByReference(reference);
      if (payment) {
        await db.updatePaymentRecord(reference, {
          status: 'failed',
          gatewayResponse: String(data.gateway_response || 'Payment failed'),
          rawVerificationData: data,
        });
        await db.updateOrderPayment(payment.orderId, 'failed', reference, payment.id);
      }
    }

    // 5. Record Event in Idempotency Store
    await db.recordWebhookEvent(event, reference, {
      amount: data.amount,
      currency: data.currency,
      status: data.status,
    });

    return NextResponse.json({ status: 'success', message: 'Webhook processed' }, { status: 200 });
  } catch (error) {
    console.error('[API Paystack Webhook Error]:', error);
    // Return 200 or 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook error' },
      { status: 500 }
    );
  }
}
