'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, CreditCard, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function SimulatedCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reference = searchParams?.get('reference') || '';
  const amountKoboStr = searchParams?.get('amount') || '0';
  const orderId = searchParams?.get('orderId') || '';

  const amountKobo = parseInt(amountKoboStr, 10);
  const amountNaira = Math.round(amountKobo / 100);

  const [cardNumber] = useState('4084 0840 8408 4081');
  const [expiry] = useState('12/28');
  const [cvv] = useState('408');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  const handleAction = async (action: 'approve' | 'fail' | 'abandon') => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/paystack/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          action,
          cardLast4: '4081',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Simulation failed');
      }

      // Route through official verification callback to test the complete server verification pipeline
      router.push(`/order/verify?reference=${encodeURIComponent(reference)}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Simulation failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden">
        {/* Paystack Test Banner */}
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 p-4 border-b border-zinc-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-zinc-200 font-black text-xs">
              P
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wider">PAYSTACK CHECKOUT</span>
              <span className="block text-[10px] text-zinc-300">Sandbox Test Environment</span>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
            Test Mode
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Amount Display */}
          <div className="text-center space-y-1">
            <span className="text-xs text-zinc-400">Total Amount to Pay</span>
            <div className="text-3xl font-black text-white">{formatNaira(amountNaira)}</div>
            <p className="text-[11px] text-zinc-500 font-mono">Reference: {reference}</p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Test Card Preview */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-zinc-300" />
                Paystack Official Test Card
              </span>
              <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                VISA / VERVE
              </span>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 block uppercase">Card Number</label>
              <div className="font-mono text-sm tracking-wider text-white font-semibold">
                {cardNumber}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Expires</span>
                <span className="font-mono text-zinc-300">{expiry}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">CVV</span>
                <span className="font-mono text-zinc-300">{cvv}</span>
              </div>
            </div>
          </div>

          {/* Action Simulation Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => handleAction('approve')}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-300 text-zinc-950 font-bold text-xs hover:from-white hover:to-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Authorizing via Paystack...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                  <span>Simulate Successful Payment ({formatNaira(amountNaira)})</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleAction('fail')}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-red-300 font-semibold text-xs border border-zinc-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-red-400" />
              <span>Simulate Insufficient Funds / Decline</span>
            </button>

            <button
              onClick={() => handleAction('abandon')}
              disabled={isProcessing}
              className="w-full py-2 rounded-xl text-zinc-400 hover:text-white text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Customer Closing Window</span>
            </button>
          </div>

          <div className="pt-3 border-t border-zinc-800 text-center text-[10px] text-zinc-500 space-y-1">
            <div className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Paystack Sandboxed Simulation for Testing</span>
            </div>
            <p>Once live keys are provided in Admin Settings, this connects directly to Paystack live modal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimulatedCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      }
    >
      <SimulatedCheckoutContent />
    </Suspense>
  );
}
