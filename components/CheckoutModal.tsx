'use client';

import React, { useState } from 'react';
import { X, Lock, ShieldCheck, MapPin, Truck, Store, AlertCircle, Loader2, Navigation, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { DeliveryZone, FulfillmentType } from '@/lib/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryZones: DeliveryZone[];
  freeDeliveryThreshold: number;
}

export function CheckoutModal({ isOpen, onClose, deliveryZones = [], freeDeliveryThreshold = 25000 }: CheckoutModalProps) {
  const { items, subtotal, clearCart } = useCart();

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(deliveryZones[0]?.id || '');
  const [orderNotes, setOrderNotes] = useState('');

  // Live GPS Location
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCaptureLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your device browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Acquiring precise GPS satellite signal...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIsLocating(false);
        setLocationStatus(`GPS Pin Saved (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus(`Could not acquire GPS: ${err.message}. You can still enter your address.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  if (!isOpen) return null;

  const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  // Estimate client-side delivery fee for display (real fee is strictly calculated on server)
  const selectedZone = deliveryZones.find((z) => z.id === selectedZoneId) || deliveryZones[0];
  const isFreeDelivery = fulfillmentType === 'delivery' && freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
  const estimatedDeliveryFee = fulfillmentType === 'pickup' ? 0 : isFreeDelivery ? 0 : selectedZone ? selectedZone.fee : 1500;
  const estimatedTotal = subtotal + estimatedDeliveryFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Frontend validations
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setErrorMessage('Please provide your name, valid email, and contact phone number.');
      return;
    }

    const cleanPhone = customerPhone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (cleanPhone.length < 5 || phoneDigits.length < 5) {
      setErrorMessage('Please provide a valid contact phone number (e.g. 0803 123 4567 or +234 803 123 4567).');
      return;
    }

    if (fulfillmentType === 'delivery' && (!deliveryAddress.trim() || deliveryAddress.trim().length < 5)) {
      setErrorMessage('Please enter your full delivery address and closest landmark.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your bag is empty.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Submit order to server endpoint for verified pricing and Paystack initialization
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: customerName.trim(),
            email: customerEmail.trim().toLowerCase(),
            phone: customerPhone.trim(),
            address: fulfillmentType === 'delivery' ? deliveryAddress.trim() : undefined,
          },
          fulfillmentType,
          deliveryZoneId: fulfillmentType === 'delivery' ? selectedZoneId : undefined,
          notes: orderNotes.trim() || undefined,
          location: gpsLocation || undefined,
          items: items.map((i) => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            specialInstructions: i.specialInstructions,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize order checkout.');
      }

      // 2. Clear local cart
      clearCart();

      // 3. Redirect to Paystack Checkout URL
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error('No Paystack authorization URL returned by server.');
      }
    } catch (err: unknown) {
      console.error('[Checkout Error]:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <Lock className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Order Checkout</h2>
              <p className="text-xs text-zinc-400">Direct Paystack Gateway • NGN Currency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmitOrder} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Fulfillment Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Fulfillment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentType('delivery')}
                className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  fulfillmentType === 'delivery'
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-md'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Express Delivery</span>
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentType('pickup')}
                className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  fulfillmentType === 'pickup'
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-md'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Pickup at Lekki Kitchen</span>
              </button>
            </div>
          </div>

          {/* Customer Contact Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              1. Customer Information (No Account Required)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Babatunde Adeleke"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Phone Number (Call & WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0803 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">Accepts standard or international numbers (e.g. 0803 123 4567 or +234...)</span>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-400 block mb-1">Email Address (For Paystack Receipt & Tracking) *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. babatunde@example.ng"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          {fulfillmentType === 'delivery' ? (
            <div className="space-y-3 border-t border-zinc-900 pt-4">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                2. Delivery Destination
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">Select Delivery Zone / Area *</label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-500"
                  >
                    {deliveryZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} — {isFreeDelivery ? 'FREE (Eligible)' : formatNaira(zone.fee)} ({zone.estimatedMinutes})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">Street Address & Landmark *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Plot 12, Admiralty Way, beside Prince Ebeano Supermarket, Lekki Phase 1"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500 resize-none"
                  />
                </div>

                {/* GPS Location Pin Attachment */}
                <div className="sm:col-span-2 pt-1">
                  <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Navigation className="w-3.5 h-3.5 text-amber-500" />
                        <span>Live Dispatch GPS Coordinates</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {gpsLocation
                          ? `Pin Attached: ${gpsLocation.latitude.toFixed(5)}, ${gpsLocation.longitude.toFixed(5)} (±${Math.round(gpsLocation.accuracy || 10)}m)`
                          : 'Allow dispatch riders to locate your exact gate or door.'}
                      </p>
                      {locationStatus && (
                        <p className="text-[10px] text-amber-400 italic">{locationStatus}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCaptureLocation}
                      disabled={isLocating}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                        gpsLocation
                          ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                          : 'bg-zinc-100 text-zinc-950 hover:bg-white'
                      }`}
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Acquiring GPS...</span>
                        </>
                      ) : gpsLocation ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Update GPS Pin</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Attach My GPS Pin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Pickup Location:</p>
                <p className="text-zinc-400">14B Admiralty Way, Lekki Phase 1, Lagos</p>
                <p className="text-zinc-500 mt-0.5">Estimated prep time: 20-25 minutes after payment confirmation.</p>
              </div>
            </div>
          )}

          {/* Kitchen / Delivery Notes */}
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 block">Delivery or Special Cooking Instructions (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Please ring doorbell twice, leave with security guard, extra serviette"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Pricing Summary */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Items Subtotal ({items.length} items)</span>
              <span className="font-semibold text-white">{formatNaira(subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Delivery Fee</span>
              <span className="font-semibold text-white">
                {fulfillmentType === 'pickup' ? (
                  'Free (Pickup)'
                ) : isFreeDelivery ? (
                  <span className="text-amber-400 font-bold">₦0 (Free Promo)</span>
                ) : (
                  formatNaira(estimatedDeliveryFee)
                )}
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Total Amount Due</span>
              <span className="text-xl font-black text-white">{formatNaira(estimatedTotal)}</span>
            </div>
            <p className="text-[10px] text-zinc-500 pt-1">
              * Official prices and delivery fees are validated server-side. Amounts are converted to Kobo for Paystack.
            </p>
          </div>

          {/* Paystack Submit Button */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || items.length === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-300 text-zinc-950 font-bold text-sm hover:from-white hover:to-zinc-200 transition-all shadow-xl shadow-black/80 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Connecting to Paystack Gateway...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-zinc-950" />
                  <span>Pay {formatNaira(estimatedTotal)} with Paystack</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Supports Debit Cards, Bank Transfer, USSD & Apple Pay via Paystack</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
