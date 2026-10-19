'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, MapPin, Phone, Mail, Clock, ShieldCheck, CreditCard } from 'lucide-react';

export function Footer() {
  return (
    <footer id="contact" className="bg-zinc-950 text-zinc-400 border-t border-zinc-900 pt-16 pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-base font-extrabold text-white tracking-wider">
                NAIJAGRILL & KITCHEN
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Premium Nigerian culinary house specializing in firewood smokey Jollof rice, chargrilled beef suya, slow-roasted peppered asun, and heritage soups.
            </p>
            <div className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-zinc-300" />
              <span>Official Paystack Payment Gateway</span>
            </div>
          </div>

          {/* Location & Delivery Coverage */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Location & Coverage</h3>
            <div className="space-y-2.5 text-zinc-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                <span>14B Admiralty Way, Lekki Phase 1, Lagos State, Nigeria</span>
              </div>
              <p className="text-[11px] text-zinc-500 pl-6">
                Direct express delivery to Lekki 1, Ikoyi, Victoria Island, Marina, Ikeja, and surrounding areas.
              </p>
            </div>
          </div>

          {/* Hours & Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Hours & Direct Hotline</h3>
            <div className="space-y-2 text-zinc-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-300" />
                <span>Mon – Sun: 10:30 AM – 11:30 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-300" />
                <span>+234 803 555 0192</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-300" />
                <span>orders@naijagrill.ng</span>
              </div>
            </div>
          </div>

          {/* Secure Payment & Portal */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Security & Portal</h3>
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              Transactions are processed directly via Paystack with end-to-end encryption. No card details are stored on our servers.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                <span>Debit Card</span>
              </div>
              <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">
                Bank Transfer
              </div>
              <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">
                USSD
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white underline underline-offset-4"
              >
                <span>Restaurant Staff & Kitchen Admin Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} NaijaGrill & Kitchen. All rights reserved.</p>
          <p>Built with Next.js, Node.js, and Official Paystack Payments.</p>
        </div>
      </div>
    </footer>
  );
}
