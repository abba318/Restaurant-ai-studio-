'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Flame, Sparkles, ShieldCheck, MapPin, Star } from 'lucide-react';

interface HeroProps {
  onOpenTrackModal: () => void;
}

export function Hero({ onOpenTrackModal }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-black to-zinc-950 pt-10 pb-20 border-b border-zinc-800/60">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-amber-500/10 via-zinc-700/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -top-10 right-10 w-96 h-96 bg-zinc-800/20 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 text-xs font-medium shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Authentic Lagos Firewood Kitchen</span>
              <span className="w-1 h-1 rounded-full bg-zinc-500" />
              <span className="text-zinc-400">Lekki Phase 1</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Smoky Firewood Jollof,{' '}
              <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent underline decoration-amber-500/50 decoration-4 underline-offset-8">
                Chargrilled Suya
              </span>{' '}
              & Soulful Soups.
            </h1>

            <p className="text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Experience the heritage of genuine Nigerian firewood cooking. From tender slow-braised peppered Asun to
              rich Egusi with pounded yam, every meal is prepared fresh with ancestral spices and delivered hot to your door.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="#menu"
                className="flex items-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-300 text-zinc-950 font-bold text-base hover:from-white hover:to-zinc-200 transition-all shadow-xl shadow-black/60 hover:shadow-zinc-700/20 active:scale-95"
              >
                <span>Order Now</span>
                <ArrowRight className="w-5 h-5 text-zinc-900" />
              </Link>

              <button
                onClick={onOpenTrackModal}
                className="flex items-center gap-2 px-6 py-4 rounded-xl bg-zinc-900/90 border border-zinc-700 hover:border-zinc-500 text-white font-semibold text-base hover:bg-zinc-800/90 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <span>Track Existing Order</span>
              </button>
            </div>

            {/* Feature Badges */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-zinc-800/80 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">100% Firewood</p>
                  <p className="text-zinc-500">Traditional Smokiness</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-zinc-300" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">Paystack Secured</p>
                  <p className="text-zinc-500">Instant Verification</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-zinc-300" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">35-50 Mins</p>
                  <p className="text-zinc-500">Lagos Island & VI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Glass Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer Metallic Frame */}
              <div className="relative rounded-3xl bg-gradient-to-b from-zinc-700/50 via-zinc-800/40 to-zinc-900/60 p-2 shadow-2xl backdrop-blur-2xl border border-zinc-700/60">
                <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-inner">
                  <Image
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
                    alt="Authentic Nigerian Firewood Jollof Rice with Fried Plantain and Suya Meat"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                  {/* Floating Price Tag */}
                  <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/80 backdrop-blur-md border border-zinc-700/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Today&apos;s Chef Favorite</span>
                      </div>
                      <h2 className="text-sm font-bold text-white">Firewood Jollof Royale</h2>
                      <p className="text-xs text-zinc-400">With tender goat meat & sweet dodo</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-white">₦7,800</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Pill Badge */}
              <div className="absolute -top-4 -left-4 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold text-zinc-200">Daily Fresh Grills</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
