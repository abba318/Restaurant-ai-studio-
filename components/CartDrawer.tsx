'use client';

import React from 'react';
import Image from 'next/image';
import { X, Trash2, ShoppingBag, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  freeDeliveryThreshold: number;
}

export function CartDrawer({ onProceedToCheckout, freeDeliveryThreshold = 25000 }: CartDrawerProps) {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, clearCart, subtotal, totalItemCount } = useCart();

  if (!isCartOpen) return null;

  const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-zinc-300" />
              <h2 className="text-lg font-bold text-white">Your Food Bag</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Bar */}
          <div className="px-6 py-3 bg-zinc-900/60 border-b border-zinc-800/80">
            {remainingForFreeDelivery === 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>You qualify for FREE Lekki/VI Delivery!</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Add {formatNaira(remainingForFreeDelivery)} more for Free Delivery</span>
                  <span className="font-bold text-zinc-300">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-zinc-400 to-zinc-100 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-zinc-300">Your bag is empty</h3>
                <p className="text-xs text-zinc-500 max-w-xs">
                  Browse our firewood Jollof, spicy Suya, and savory Nigerian soups to begin your order.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Explore Dishes
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 flex gap-3.5 items-center justify-between"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-900">
                    <Image
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.menuItem.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{formatNaira(item.menuItem.price)} each</p>
                    {item.specialInstructions && (
                      <p className="text-[10px] text-zinc-500 italic truncate mt-1">
                        Note: {item.specialInstructions}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 px-2 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                          className="text-zinc-400 hover:text-white px-1 font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                          className="text-zinc-400 hover:text-white px-1 font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.menuItem.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                        title="Remove dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-white">
                      {formatNaira(item.menuItem.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-zinc-800 bg-zinc-950 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Delivery & Packaging</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-900 flex justify-between items-baseline">
                <span className="text-sm font-bold text-zinc-300">Total Before Delivery</span>
                <span className="text-xl font-black text-white">{formatNaira(subtotal)}</span>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-300 text-zinc-950 font-bold text-sm hover:from-white hover:to-zinc-200 transition-all shadow-xl shadow-black/80 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-zinc-900" />
              </button>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Paystack Certified 256-Bit TLS</span>
                </div>
                <button
                  onClick={clearCart}
                  className="text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                >
                  Clear Bag
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
