'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Clock, ShieldCheck, Flame } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

interface NavbarProps {
  onOpenTrackModal: () => void;
}

export function Navbar({ onOpenTrackModal }: NavbarProps) {
  const { totalItemCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-zinc-950/85 border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-700 p-0.5 shadow-lg shadow-black/50 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Flame className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              NAIJAGRILL
            </span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">
              Kitchen & Charcoal Bar
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <Link href="#menu" className="hover:text-white transition-colors">
            Our Menu
          </Link>
          <Link href="#specials" className="hover:text-white transition-colors">
            Chef Specials
          </Link>
          <button
            onClick={onOpenTrackModal}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 text-zinc-400" />
            Track Order
          </button>
          <Link href="#contact" className="hover:text-white transition-colors">
            Contact & Location
          </Link>
          <Link
            href="/admin"
            className="text-xs px-2.5 py-1 rounded border border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            Staff Portal
          </Link>
        </nav>

        {/* Right Action Icons: Status + Cart Trigger */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Kitchen Open • Lekki Delivery</span>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="View shopping bag"
            className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-900 border border-zinc-700/80 text-white hover:border-zinc-500 hover:bg-zinc-850 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 text-zinc-200" />
            <span className="hidden sm:inline text-sm font-semibold">Cart</span>
            {totalItemCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black shadow-sm">
                {totalItemCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white focus:outline-none"
            aria-label="Toggle navigation"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950/95 px-4 pt-3 pb-6 space-y-3 text-sm">
          <Link
            href="#menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-white"
          >
            Our Menu
          </Link>
          <Link
            href="#specials"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-white"
          >
            Chef Specials
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenTrackModal();
            }}
            className="block w-full text-left py-2 text-zinc-300 hover:text-white"
          >
            Track Order
          </button>
          <Link
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-white"
          >
            Contact & Location
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-400 hover:text-white"
          >
            Staff / Admin Portal
          </Link>
        </div>
      )}
    </header>
  );
}
