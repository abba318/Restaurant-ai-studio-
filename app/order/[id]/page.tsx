'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Clock,
  Flame,
  Truck,
  Store,
  MapPin,
  Phone,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Navigation,
  QrCode,
  Bell,
  BellRing,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { requestNotificationPermission, triggerBrowserPushNotification, playNotificationChime } from '@/lib/push-notifications';

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; description: string }> = [
  { key: 'pending', label: 'Order Received', description: 'Awaiting payment confirmation' },
  { key: 'confirmed', label: 'Payment Confirmed', description: 'Verified via Paystack gateway' },
  { key: 'preparing', label: 'Kitchen Preparing', description: 'Chef is grilling and assembling meal' },
  { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Rider is on the way to your address' },
  { key: 'delivered', label: 'Delivered', description: 'Meal enjoyed hot and fresh' },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // QR Code State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  // GPS Location Attachment State
  const [isAttachingGps, setIsAttachingGps] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Push Notification State
  const [notificationsActive, setNotificationsActive] = useState(false);
  const previousStatusRef = useRef<OrderStatus | null>(null);

  const fetchOrder = React.useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.error || 'Order not found');
      }

      const freshOrder: Order = data.order;
      setOrder(freshOrder);
      setError(null);

      // Check if status changed for push notification
      if (previousStatusRef.current && previousStatusRef.current !== freshOrder.status) {
        triggerBrowserPushNotification(
          `NaijaGrill Order Update: ${freshOrder.orderNumber}`,
          {
            body: `Your order status changed to "${freshOrder.status.replace(/_/g, ' ').toUpperCase()}"!`,
          }
        );
      }
      previousStatusRef.current = freshOrder.status;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (!isMounted) return;
        if (!res.ok || !data.success || !data.order) {
          throw new Error(data.error || 'Order not found');
        }
        const freshOrder: Order = data.order;
        setOrder(freshOrder);
        previousStatusRef.current = freshOrder.status;
        setError(null);

        // Generate QR Code
        if (typeof window !== 'undefined') {
          const verifyUrl = `${window.location.origin}/order/${freshOrder.id}`;
          QRCode.toDataURL(verifyUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 220,
            color: { dark: '#000000', light: '#ffffff' },
          }).then((url) => {
            if (isMounted) setQrCodeDataUrl(url);
          });
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    const interval = setInterval(() => {
      fetchOrder(false);
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId, fetchOrder]);

  const handleToggleNotifications = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      setNotificationsActive(true);
      playNotificationChime();
      triggerBrowserPushNotification('Notifications Enabled', {
        body: `You will receive live sound and visual alerts as Order ${order?.orderNumber} progresses.`,
      });
    } else {
      alert('Notification permissions are blocked in your browser settings.');
    }
  };

  const handleAttachLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsMessage('Geolocation is not supported on this device.');
      return;
    }

    setIsAttachingGps(true);
    setGpsMessage('Acquiring live satellite coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/orders/${orderId}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          });
          const data = await res.json();
          if (data.success && data.location) {
            setOrder((prev) => (prev ? { ...prev, location: data.location } : prev));
            setGpsMessage('Live GPS pin attached to order for dispatch rider!');
          } else {
            setGpsMessage(data.error || 'Failed to save location.');
          }
        } catch {
          setGpsMessage('Network error saving GPS location.');
        } finally {
          setIsAttachingGps(false);
        }
      },
      (err) => {
        setIsAttachingGps(false);
        setGpsMessage(`GPS Error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const formatNaira = (amount: number) => `₦${(amount || 0).toLocaleString('en-NG')}`;

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'ready_for_pickup') return 3;
    if (status === 'out_for_delivery') return 3;
    if (status === 'delivered') return 4;
    if (status === 'preparing') return 2;
    if (status === 'confirmed') return 1;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-spin mb-4">
          <RefreshCw className="w-6 h-6 text-zinc-300" />
        </div>
        <p className="text-sm font-semibold text-zinc-400">Loading Order Details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">Order Lookup Failed</h1>
          <p className="text-xs text-zinc-400">{error || 'Unable to locate order'}</p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white pb-20">
      {/* Top Banner Navigation */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleToggleNotifications}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                notificationsActive
                  ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              {notificationsActive ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{notificationsActive ? 'Push Alerts Active' : 'Enable Push Alerts'}</span>
            </button>

            <button
              onClick={() => fetchOrder(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-10 space-y-8">
        {/* Order Header Glass Card */}
        <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono font-bold uppercase">
                  Order {order.orderNumber}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-bold uppercase ${
                    order.paymentStatus === 'success'
                      ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                  }`}
                >
                  Payment: {order.paymentStatus}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {order.status === 'delivered' ? 'Order Delivered!' : 'Tracking Your Meal'}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="text-left sm:text-right bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 shrink-0">
              <span className="text-xs text-zinc-400 block">Total Amount</span>
              <span className="text-2xl font-black text-white">{formatNaira(order.total)}</span>
              {order.paymentReference && (
                <span className="text-[10px] text-zinc-500 font-mono block mt-0.5 truncate max-w-[180px]">
                  Ref: {order.paymentReference}
                </span>
              )}
            </div>
          </div>

          {/* Stepper Visualizer */}
          <div className="mt-10 pt-8 border-t border-zinc-800">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-6">
              Live Order Progress
            </h2>

            <div className="relative">
              {/* Stepper Progress Bar */}
              <div className="hidden sm:block absolute top-5 left-6 right-6 h-1 bg-zinc-800 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-zinc-400 to-zinc-100 rounded-full transition-all duration-700"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>

              {/* Step Items */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative z-10">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                          isDone
                            ? 'bg-zinc-100 border-white text-zinc-950 shadow-lg'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                        } ${isCurrent ? 'ring-4 ring-zinc-700/60 scale-110' : ''}`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : idx === 2 ? (
                          <Flame className="w-4 h-4" />
                        ) : idx === 3 ? (
                          <Truck className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <p className={`text-xs font-bold ${isDone ? 'text-white' : 'text-zinc-500'}`}>
                          {step.label}
                        </p>
                        <p className="text-[11px] text-zinc-500 sm:line-clamp-2 mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Order Details, QR Receipt & Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Items Summary (2 Cols) */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Dishes in Your Order ({order.items.reduce((s, i) => s + i.quantity, 0)} items)
              </h3>

              <div className="divide-y divide-zinc-800">
                {order.items.map((item, index) => (
                  <div key={index} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                        <p className="text-[11px] text-zinc-400">
                          Qty: {item.quantity} × {formatNaira(item.unitPrice)}
                        </p>
                        {item.specialInstructions && (
                          <p className="text-[10px] text-zinc-500 italic">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-black text-white shrink-0">
                      {formatNaira(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-zinc-800 space-y-1.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">{formatNaira(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-white">
                    {order.deliveryFee === 0 ? '₦0 (Free Delivery)' : formatNaira(order.deliveryFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-white">Total</span>
                  <span className="text-lg font-black text-white">{formatNaira(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Live GPS Location Dispatch Card */}
            <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Dispatch Delivery Coordinates
                  </h3>
                </div>
                {order.location && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                    GPS Attached
                  </span>
                )}
              </div>

              {order.location ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <p className="text-zinc-300">
                      <strong>Coordinates:</strong> {order.location.latitude.toFixed(5)}, {order.location.longitude.toFixed(5)}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Captured at {new Date(order.location.capturedAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <a
                    href={order.location.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-zinc-700 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open in Google Maps / Navigation</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-zinc-400">
                  <p>
                    No precise GPS pin is currently attached. Attach your live phone location so the dispatch rider can navigate straight to your gate.
                  </p>
                  {gpsMessage && <p className="text-xs text-amber-400 italic">{gpsMessage}</p>}
                  <button
                    onClick={handleAttachLocation}
                    disabled={isAttachingGps}
                    className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-950 font-bold hover:bg-white transition-all flex items-center gap-2 text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isAttachingGps ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Acquiring Coordinates...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Attach My Current Live GPS Location</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: QR Code Receipt & Customer Details */}
          <div className="space-y-6">
            {/* Scannable QR Code Receipt */}
            <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                <QrCode className="w-4 h-4 text-amber-500" />
                <span>Verified QR Receipt</span>
              </div>

              {qrCodeDataUrl ? (
                <div className="bg-white p-3 rounded-2xl w-48 h-48 mx-auto shadow-xl flex items-center justify-center">
                  <img
                    src={qrCodeDataUrl}
                    alt={`Verification QR Code for order ${order.orderNumber}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-zinc-950 rounded-2xl mx-auto flex items-center justify-center text-zinc-600 text-xs">
                  Generating QR...
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Scan to Verify Order</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Present this QR code to the dispatch rider upon delivery or at the Lekki kitchen pickup station.
                </p>
              </div>
            </div>

            {/* Delivery & Customer Info */}
            <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-6 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {order.fulfillmentType === 'delivery' ? (
                  <>
                    <Truck className="w-4 h-4 text-zinc-300" />
                    <span>Delivery Details</span>
                  </>
                ) : (
                  <>
                    <Store className="w-4 h-4 text-zinc-300" />
                    <span>Pickup Information</span>
                  </>
                )}
              </h3>

              <div className="space-y-3 text-xs text-zinc-400">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Customer</span>
                  <p className="font-semibold text-white">{order.customer.name}</p>
                  <p>{order.customer.phone}</p>
                  <p>{order.customer.email}</p>
                </div>

                {order.fulfillmentType === 'delivery' && (
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Delivery Address</span>
                    <p className="text-white font-medium">{order.customer.address}</p>
                    {order.customer.deliveryArea && (
                      <p className="text-zinc-400 mt-0.5">Zone: {order.customer.deliveryArea}</p>
                    )}
                  </div>
                )}

                {order.customer.notes && (
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Instructions</span>
                    <p className="text-zinc-300 italic">{order.customer.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Kitchen Hotline Support Card */}
            <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-6 space-y-3 text-xs">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" />
                <span>Direct Kitchen Dispatch</span>
              </h4>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Quote your order number <strong>{order.orderNumber}</strong> for instant assistance.
              </p>
              <a
                href="tel:+2348035550192"
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Call Dispatch: +234 803 555 0192</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
