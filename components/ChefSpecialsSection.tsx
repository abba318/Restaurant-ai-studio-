'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, Plus, Flame, ArrowRight } from 'lucide-react';
import { MenuItem } from '@/lib/types';
import { useCart } from '@/lib/cart-context';

interface ChefSpecialsSectionProps {
  items: MenuItem[];
}

export function ChefSpecialsSection({ items }: ChefSpecialsSectionProps) {
  const { addItem } = useCart();
  const featured = items.filter((i) => i.isFeatured).slice(0, 3);

  const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  if (featured.length === 0) return null;

  return (
    <section id="specials" className="py-20 bg-black text-white border-t border-zinc-900 relative overflow-hidden">
      {/* Background flare */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-zinc-800/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-amber-400 font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Signature Masterpieces</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Chef&apos;s Signature Feasts
            </h2>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              Specially curated combos and platters crafted for family feasts, weekend gatherings, and celebrations.
            </p>
          </div>
          <a
            href="#menu"
            className="text-xs text-zinc-300 hover:text-white font-bold flex items-center gap-1 underline underline-offset-4"
          >
            <span>View Full 15-Item Menu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-black/80 group"
            >
              <div className="relative h-60 w-full rounded-2xl overflow-hidden mb-4 bg-zinc-900">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 bg-zinc-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chef Pick</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-700/80 text-sm font-black text-white">
                  {formatNaira(item.price)}
                </div>
              </div>

              <div className="space-y-2 mb-4 px-1">
                <h3 className="text-base font-bold text-white group-hover:text-zinc-200">{item.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{item.description}</p>
              </div>

              <button
                onClick={() => addItem(item, 1)}
                className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white font-bold text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-zinc-300" />
                <span>Add to Food Bag • {formatNaira(item.price)}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
