'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, Clock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrackOrderModal({ isOpen, onClose }: TrackOrderModalProps) {
  const router = useRouter();
  const [orderQuery, setOrderQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = orderQuery.trim().toUpperCase();

    if (!clean) {
      setError('Please enter your Order Number (e.g., NG-8492) or reference.');
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        setError('Order not found. Please double-check your Order Number (e.g. NG-8492) or check your receipt email.');
        setIsSearching(false);
        return;
      }

      onClose();
      router.push(`/order/${data.order.id}`);
    } catch {
      setError('Failed to look up order. Please check your connection.');
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Track Your Meal</h2>
              <p className="text-xs text-zinc-400">Live order & delivery status</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Order Number or Paystack Reference
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. NG-8492 or PAY_NG..."
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500 font-mono uppercase"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Found on your Paystack receipt and confirmation screen.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-300 text-zinc-950 font-bold text-xs hover:from-white hover:to-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Searching Kitchen Queue...</span>
              </>
            ) : (
              <>
                <span>Track Status</span>
                <ArrowRight className="w-4 h-4 text-zinc-950" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
