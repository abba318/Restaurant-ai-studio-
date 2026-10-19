'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Clock, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

function VerifyPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams?.get('reference') || searchParams?.get('trxref');

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>(() => (reference ? 'verifying' : 'failed'));
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => (reference ? null : 'No Paystack transaction reference provided.'));

  useEffect(() => {
    if (!reference) {
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        const res = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success && data.verified) {
          setStatus('success');
          setOrderId(data.order?.id);
          setOrderNumber(data.order?.orderNumber);

          // Auto-redirect to order tracking after 3 seconds
          setTimeout(() => {
            if (data.order?.id) {
              router.push(`/order/${data.order.id}`);
            }
          }, 3500);
        } else {
          setStatus('failed');
          setErrorMessage(data.error || 'Payment was not verified by Paystack.');
          if (data.orderId) setOrderId(data.orderId);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setStatus('failed');
        setErrorMessage(err instanceof Error ? err.message : 'Network error during verification.');
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [reference, router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl bg-zinc-950 border border-zinc-800 p-8 shadow-2xl text-center space-y-6">
        {status === 'verifying' && (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 text-zinc-300 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-white">Verifying Paystack Payment</h1>
            <p className="text-xs text-zinc-400">
              Validating transaction reference and secure bank authorization with Paystack servers...
            </p>
            <div className="text-[11px] text-zinc-500 font-mono">Ref: {reference}</div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto text-white shadow-xl">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Order {orderNumber}
              </span>
              <h1 className="text-2xl font-black text-white">Payment Confirmed!</h1>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Your payment was authenticated and accepted by Paystack. The kitchen has begun preparing your dishes.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Redirecting to live order tracking in 3 seconds...</span>
            </div>

            {orderId && (
              <div className="pt-2">
                <Link
                  href={`/order/${orderId}`}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-300 text-zinc-950 font-bold text-xs hover:from-white hover:to-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Go to Live Order Tracker Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-4 py-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-800 flex items-center justify-center mx-auto text-red-400">
              <XCircle className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-white">Payment Not Completed</h1>
              <p className="text-xs text-red-300 max-w-xs mx-auto leading-relaxed">
                {errorMessage || 'The payment could not be validated or was cancelled.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 text-left space-y-1">
              <p className="font-semibold text-white">What happened?</p>
              <p className="text-[11px] text-zinc-400">
                If funds were debited, Paystack webhooks will automatically verify and confirm your order shortly.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/"
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
              >
                Return to Menu & Try Again
              </Link>
              {orderId && (
                <Link
                  href={`/order/${orderId}`}
                  className="text-xs text-zinc-400 hover:text-white underline py-1"
                >
                  View Order Status
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-zinc-900 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Paystack Official Server-Side Verification Endpoint</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      }
    >
      <VerifyPaymentContent />
    </Suspense>
  );
}
