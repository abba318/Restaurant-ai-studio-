import crypto from 'crypto';
import { db } from './db';
import { PaymentStatus } from './types';

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
  isSimulated?: boolean;
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id?: number;
    domain?: string;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    reference: string;
    amount: number; // in kobo
    message?: string | null;
    gateway_response?: string;
    paid_at?: string;
    created_at?: string;
    channel?: string;
    currency: string;
    ip_address?: string;
    metadata?: Record<string, unknown>;
    customer?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
    };
  };
  isSimulated?: boolean;
}

/**
 * Resolves the active Paystack Secret Key from environment or database settings.
 */
export async function getPaystackSecretKey(): Promise<{ key: string; mode: 'test' | 'live'; isConfigured: boolean }> {
  const settings = await db.getSettings();
  const envSecret = process.env.PAYSTACK_SECRET_KEY;

  if (settings.paystackMode === 'live' && settings.paystackLiveSecretKey) {
    return { key: settings.paystackLiveSecretKey, mode: 'live', isConfigured: true };
  }

  const testKey = settings.paystackTestSecretKey || envSecret || '';
  const isRealTestKey = testKey.startsWith('sk_test_') && testKey !== 'sk_test_placeholder_key' && testKey !== 'sk_test_sample_key';

  return {
    key: testKey,
    mode: 'test',
    isConfigured: isRealTestKey,
  };
}

/**
 * Generates an unpredictable, unique Paystack reference tied to an order.
 */
export function generatePaystackReference(orderNumber: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const cleanNum = orderNumber.replace(/[^A-Za-z0-9]/g, '');
  return `PAY_${cleanNum}_${timestamp}_${random}`;
}

/**
 * Initializes a transaction with Paystack Official API.
 * If no live or valid test key is configured, falls back to a sandbox simulation URL
 * so developers can test the full roundtrip without broken requests.
 */
export async function initializePaystackTransaction(params: {
  email: string;
  amountKobo: number; // Kobo (1 Naira = 100 Kobo)
  reference: string;
  callbackUrl: string;
  metadata: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    phone: string;
    fulfillmentType: string;
  };
}): Promise<PaystackInitResponse> {
  const { key, isConfigured } = await getPaystackSecretKey();

  // If a valid Paystack secret key is provided, perform live API request
  if (isConfigured && key) {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          email: params.email,
          amount: params.amountKobo,
          reference: params.reference,
          currency: 'NGN',
          callback_url: params.callbackUrl,
          channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
          metadata: {
            ...params.metadata,
            custom_fields: [
              {
                display_name: 'Order Number',
                variable_name: 'order_number',
                value: params.metadata.orderNumber,
              },
              {
                display_name: 'Customer Phone',
                variable_name: 'customer_phone',
                value: params.metadata.phone,
              },
            ],
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        throw new Error(data.message || `Paystack initialization failed with status ${response.status}`);
      }

      return data as PaystackInitResponse;
    } catch (err) {
      console.error('[Paystack Init Error]:', err);
      // If external call failed (e.g. invalid key format in demo), return descriptive error
      throw err;
    }
  }

  // Developer Simulation Mode: Provides a high-fidelity checkout simulation URL
  // so testing can be performed seamlessly before entering real test keys
  const simulatedUrl = `/order/simulated-checkout?reference=${encodeURIComponent(params.reference)}&amount=${params.amountKobo}&orderId=${encodeURIComponent(params.metadata.orderId)}`;
  return {
    status: true,
    message: 'Simulation Authorization URL created (Test mode)',
    data: {
      authorization_url: simulatedUrl,
      access_code: `sim_access_${crypto.randomBytes(6).toString('hex')}`,
      reference: params.reference,
    },
    isSimulated: true,
  };
}

/**
 * Verifies a transaction with Paystack Official API.
 * Enforces server-side checks for reference, expected amount in Kobo, and currency.
 */
export async function verifyPaystackTransaction(
  reference: string,
  expectedAmountKobo: number
): Promise<{
  verified: boolean;
  status: PaymentStatus;
  gatewayResponse?: string;
  channel?: string;
  paidAt?: string;
  rawData?: Record<string, unknown>;
  error?: string;
}> {
  const { key, isConfigured } = await getPaystackSecretKey();

  // If a real key is present, verify directly against Paystack's endpoint
  if (isConfigured && key) {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      const result: PaystackVerifyResponse = await response.json();

      if (!response.ok || !result.status || !result.data) {
        return {
          verified: false,
          status: 'failed',
          error: result.message || 'Verification endpoint returned non-success status',
          rawData: (result as unknown) as Record<string, unknown>,
        };
      }

      const tx = result.data;

      // STRICT VALIDATION: Check transaction reference matches
      if (tx.reference !== reference) {
        return {
          verified: false,
          status: 'failed',
          error: `Transaction reference mismatch: expected ${reference}, got ${tx.reference}`,
          rawData: (result as unknown) as Record<string, unknown>,
        };
      }

      // STRICT VALIDATION: Check currency is NGN
      if (tx.currency !== 'NGN') {
        return {
          verified: false,
          status: 'failed',
          error: `Invalid currency: expected NGN, received ${tx.currency}`,
          rawData: (result as unknown) as Record<string, unknown>,
        };
      }

      // STRICT VALIDATION: Check amount in Kobo strictly matches expected order total
      if (tx.amount !== expectedAmountKobo) {
        return {
          verified: false,
          status: 'failed',
          error: `Payment amount mismatch: expected ${expectedAmountKobo} kobo, received ${tx.amount} kobo`,
          rawData: (result as unknown) as Record<string, unknown>,
        };
      }

      // Check payment status is strictly 'success'
      if (tx.status === 'success') {
        return {
          verified: true,
          status: 'success',
          gatewayResponse: tx.gateway_response || 'Approved',
          channel: tx.channel,
          paidAt: tx.paid_at || new Date().toISOString(),
          rawData: (result as unknown) as Record<string, unknown>,
        };
      }

      return {
        verified: false,
        status: tx.status,
        gatewayResponse: tx.gateway_response || tx.status,
        rawData: (result as unknown) as Record<string, unknown>,
      };
    } catch (err: unknown) {
      return {
        verified: false,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown verification failure',
      };
    }
  }

  // Simulation fallback: check existing payment record in DB
  const paymentRecord = await db.getPaymentByReference(reference);
  if (!paymentRecord) {
    return {
      verified: false,
      status: 'failed',
      error: 'Transaction reference not found in database',
    };
  }

  if (paymentRecord.amountKobo !== expectedAmountKobo) {
    return {
      verified: false,
      status: 'failed',
      error: `Amount mismatch: expected ${expectedAmountKobo} kobo, got ${paymentRecord.amountKobo} kobo`,
    };
  }

  if (paymentRecord.status === 'success') {
    return {
      verified: true,
      status: 'success',
      gatewayResponse: paymentRecord.gatewayResponse || 'Simulated Approval',
      channel: paymentRecord.channel || 'card',
      paidAt: paymentRecord.paidAt || new Date().toISOString(),
      rawData: { simulated: true, reference },
    };
  }

  return {
    verified: false,
    status: paymentRecord.status,
    gatewayResponse: paymentRecord.gatewayResponse || 'Pending simulated checkout',
  };
}

/**
 * Gets the secret key used for signing and verifying Paystack webhooks.
 */
export async function getWebhookSecret(): Promise<string> {
  if (process.env.PAYSTACK_WEBHOOK_SECRET) {
    return process.env.PAYSTACK_WEBHOOK_SECRET;
  }
  const { key } = await getPaystackSecretKey();
  return key || 'sk_test_sample_key';
}

/**
 * Verifies the Paystack webhook HMAC-SHA512 signature using constant-time comparison.
 */
export async function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!signatureHeader) return false;

  const secret = await getWebhookSecret();

  try {
    const computedHash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

    const signatureBuffer = Buffer.from(signatureHeader, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (signatureBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
  } catch {
    return false;
  }
}
