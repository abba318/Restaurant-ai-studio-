'use client';

import React, { useState, useEffect } from 'react';
import { CartProvider } from '@/lib/cart-context';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { ChefSpecialsSection } from '@/components/ChefSpecialsSection';
import { MenuSection } from '@/components/MenuSection';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { TrackOrderModal } from '@/components/TrackOrderModal';
import { Footer } from '@/components/Footer';
import { MenuItem, RestaurantSettings } from '@/lib/types';
import { Flame, ShieldCheck, Truck, Clock, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  useEffect(() => {
    // Fetch initial menu items and settings
    async function loadData() {
      try {
        const [menuRes, settingsRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/settings'),
        ]);

        const [menuData, settingsData] = await Promise.all([
          menuRes.json(),
          settingsRes.json(),
        ]);

        if (menuData.success) {
          setMenuItems(menuData.menuItems || []);
        }
        if (settingsData.success) {
          setSettings(settingsData.settings || null);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }

    loadData();
  }, []);

  return (
    <CartProvider>
      <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-zinc-700 selection:text-white">
        {/* Navigation Bar */}
        <Navbar onOpenTrackModal={() => setIsTrackModalOpen(true)} />

        {/* Hero Section */}
        <Hero onOpenTrackModal={() => setIsTrackModalOpen(true)} />

        {/* Chef Specials & Feasts */}
        <ChefSpecialsSection items={menuItems} />

        {/* Full Interactive Menu */}
        <MenuSection initialItems={menuItems} />

        {/* Experience & Quality Pillars Banner */}
        <section className="py-16 bg-zinc-950 border-t border-b border-zinc-900 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>The NaijaGrill Difference</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Authentic Nigerian Soul, Modern Standards
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-sm font-bold text-white">Hardwood Firewood Flavor</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Real smokey firewood jollof and white-coal charring that electric cookers can never replicate.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-zinc-300" />
                </div>
                <h3 className="text-sm font-bold text-white">Thermal Dispatch Packaging</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every order is packed in insulated thermal foil retainers so your plantains and suya arrive piping hot.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-zinc-300" />
                </div>
                <h3 className="text-sm font-bold text-white">Server-Verified Paystack</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Instant secure payment verification with bank transfers, cards, and USSD. Zero card storage on our servers.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-zinc-300" />
                </div>
                <h3 className="text-sm font-bold text-white">Live Tracking & Support</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Real-time status updates from order receipt to kitchen prep to dispatch rider arrival with direct hotline.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />

        {/* Shopping Cart Drawer */}
        <CartDrawer
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
          freeDeliveryThreshold={settings?.freeDeliveryThreshold || 25000}
        />

        {/* Checkout Modal */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          deliveryZones={settings?.deliveryZones || []}
          freeDeliveryThreshold={settings?.freeDeliveryThreshold || 25000}
        />

        {/* Track Order Lookup Modal */}
        <TrackOrderModal
          isOpen={isTrackModalOpen}
          onClose={() => setIsTrackModalOpen(false)}
        />
      </div>
    </CartProvider>
  );
}
