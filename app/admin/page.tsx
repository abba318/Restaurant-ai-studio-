'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Lock,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  Settings,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  Store,
  DollarSign,
  Play,
  Key,
  Globe,
  ArrowLeft,
  Loader2,
  CreditCard,
  Flame,
} from 'lucide-react';
import { Order, MenuItem, RestaurantSettings, PaymentRecord, OrderStatus } from '@/lib/types';
import { TestResultItem } from '@/app/api/admin/run-tests/route';

type AdminTab = 'orders' | 'menu' | 'analytics' | 'settings' | 'payments' | 'tests';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalOrders: number;
    paidOrdersCount: number;
    totalRevenueNaira: number;
    todayOrdersCount: number;
    todayRevenueNaira: number;
    averageOrderValueNaira: number;
    statusCounts: Record<string, number>;
  } | null>(null);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Menu item modal state
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Rice & Grains');
  const [itemPrice, setItemPrice] = useState(5000);
  const [itemDesc, setItemDesc] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemSpicy, setItemSpicy] = useState<0 | 1 | 2 | 3>(0);
  const [itemPrep, setItemPrep] = useState(20);
  const [itemTags, setItemTags] = useState('Popular, Signature');
  const [itemFeatured, setItemFeatured] = useState(false);
  const [itemAvailable, setItemAvailable] = useState(true);

  // Test runner state
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Status update message
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const formatNaira = (amount: number) => `₦${(amount || 0).toLocaleString('en-NG')}`;

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const [ordersRes, menuRes, settingsRes, analyticsRes, paymentsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/menu?all=true'),
        fetch('/api/settings'),
        fetch('/api/admin/analytics'),
        fetch('/api/admin/payments'),
      ]);

      if (ordersRes.status === 401) {
        setIsAuthenticated(false);
        setIsLoadingData(false);
        return;
      }

      setIsAuthenticated(true);

      const [ordersData, menuData, settingsData, analyticsData, paymentsData] = await Promise.all([
        ordersRes.json(),
        menuRes.json(),
        settingsRes.json(),
        analyticsRes.json(),
        paymentsRes.json(),
      ]);

      if (ordersData.success) setOrders(ordersData.orders || []);
      if (menuData.success) setMenuItems(menuData.menuItems || []);
      if (settingsData.success) setSettings(settingsData.settings || null);
      if (analyticsData.success) setAnalytics(analyticsData.analytics || null);
      if (paymentsData.success) setPayments(paymentsData.payments || []);
    } catch (err) {
      console.error('[Dashboard fetch error]:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    async function loadInitial() {
      try {
        const [ordersRes, menuRes, settingsRes, analyticsRes, paymentsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/menu?all=true'),
          fetch('/api/settings'),
          fetch('/api/admin/analytics'),
          fetch('/api/admin/payments'),
        ]);

        if (ordersRes.status === 401) {
          setIsAuthenticated(false);
          setIsLoadingData(false);
          return;
        }

        setIsAuthenticated(true);

        const [ordersData, menuData, settingsData, analyticsData, paymentsData] = await Promise.all([
          ordersRes.json(),
          menuRes.json(),
          settingsRes.json(),
          analyticsRes.json(),
          paymentsRes.json(),
        ]);

        if (ordersData.success) setOrders(ordersData.orders || []);
        if (menuData.success) setMenuItems(menuData.menuItems || []);
        if (settingsData.success) setSettings(settingsData.settings || null);
        if (analyticsData.success) setAnalytics(analyticsData.analytics || null);
        if (paymentsData.success) setPayments(paymentsData.payments || []);
      } catch (err) {
        console.error('[Dashboard fetch error]:', err);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadInitial();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }

      setIsAuthenticated(true);
      fetchDashboardData();
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update order status');
      }

      setFeedbackMessage(`Order status updated to "${status.replace(/_/g, ' ')}"`);
      setTimeout(() => setFeedbackMessage(null), 3000);

      // Refresh orders
      fetchDashboardData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(data.order);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const handleToggleMenuAvailability = async (item: MenuItem) => {
    try {
      const res = await fetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Menu availability update failed', err);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this dish from the menu?')) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Menu delete failed', err);
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: itemName.trim(),
        category: itemCategory.trim(),
        price: Number(itemPrice),
        description: itemDesc.trim(),
        image: itemImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        spicyLevel: itemSpicy,
        preparationTimeMinutes: Number(itemPrep),
        tags: itemTags.split(',').map((t) => t.trim()).filter(Boolean),
        isFeatured: itemFeatured,
        isAvailable: itemAvailable,
      };

      if (editingItem) {
        await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setMenuModalOpen(false);
      setEditingItem(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Save item failed', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategory('Rice & Grains');
    setItemPrice(6500);
    setItemDesc('');
    setItemImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80');
    setItemSpicy(1);
    setItemPrep(20);
    setItemTags('Fresh, Authentic');
    setItemFeatured(false);
    setItemAvailable(true);
    setMenuModalOpen(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemPrice(item.price);
    setItemDesc(item.description);
    setItemImage(item.image);
    setItemSpicy(item.spicyLevel);
    setItemPrep(item.preparationTimeMinutes);
    setItemTags(item.tags.join(', '));
    setItemFeatured(item.isFeatured || false);
    setItemAvailable(item.isAvailable);
    setMenuModalOpen(true);
  };

  const handleRunAutomatedTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/admin/run-tests', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.results) {
        setTestResults(data.results);
      }
    } catch (err) {
      console.error('Test execution failed', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  // --- LOGIN SCREEN ---
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-zinc-950 border border-zinc-800 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-200">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white">Staff & Admin Portal</h1>
            <p className="text-xs text-zinc-400">
              Kitchen order manager, menu pricing, Paystack transactions & analytics
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-300 block mb-1 font-semibold">Admin Passphrase</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter secret passphrase..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-300 text-zinc-950 font-bold text-xs hover:from-white hover:to-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Access Management Console</span>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="pt-4 border-t border-zinc-900 text-center">
            <button
              type="button"
              onClick={() => setPasswordInput('naijagrill2025')}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
            >
              Fill Default Demo Password (naijagrill2025)
            </button>
            <div className="mt-4">
              <Link href="/" className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Restaurant Website</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Go to customer website"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white tracking-wider">
                  NAIJAGRILL DASHBOARD
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold uppercase">
                  Staff Console
                </span>
              </div>
              <p className="text-xs text-zinc-400">Lekki Kitchen Operations & Paystack Node</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => fetchDashboardData()}
              disabled={isLoadingData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>View Live Website</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto border-t border-zinc-900 pt-3">
          {[
            { id: 'orders', label: 'Orders & Dispatch', icon: ShoppingBag, count: orders.length },
            { id: 'menu', label: 'Menu Catalog & Prices', icon: UtensilsCrossed, count: menuItems.length },
            { id: 'analytics', label: 'Revenue & Analytics', icon: BarChart3 },
            { id: 'payments', label: 'Paystack Transactions', icon: CreditCard, count: payments.length },
            { id: 'settings', label: 'Delivery & Gateway Settings', icon: Settings },
            { id: 'tests', label: 'Automated Tests', icon: Play, badge: 'Quality & Paystack' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-zinc-100 text-zinc-950 shadow-md'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-850 border border-zinc-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      active ? 'bg-zinc-300 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {feedbackMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-zinc-300" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Live Kitchen & Delivery Orders</h2>
                <p className="text-xs text-zinc-400">
                  Update preparation status, dispatch riders, and track customer fulfillments
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-12 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-base font-bold text-zinc-300">No customer orders placed yet</h3>
                <p className="text-xs text-zinc-500">
                  Orders placed through the customer website will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl bg-zinc-950 border border-zinc-800/90 p-5 hover:border-zinc-700 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-black text-white px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-md font-bold uppercase ${
                            order.status === 'delivered'
                              ? 'bg-zinc-800 text-zinc-300'
                              : order.status === 'preparing'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                              : order.status === 'out_for_delivery'
                              ? 'bg-zinc-800 text-white border border-zinc-700'
                              : 'bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono ${
                            order.paymentStatus === 'success' ? 'text-zinc-300' : 'text-amber-400'
                          }`}
                        >
                          Payment: {order.paymentStatus}
                        </span>
                      </div>

                      <div className="text-sm font-black text-white">{formatNaira(order.total)}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 pt-2 border-t border-zinc-900">
                      <div>
                        <span className="text-zinc-500 block text-[11px]">Customer & Contact</span>
                        <p className="font-bold text-white">{order.customer.name}</p>
                        <p>{order.customer.phone}</p>
                        <p>{order.customer.email}</p>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[11px]">Fulfillment & Address</span>
                        <p className="text-white font-medium capitalize flex items-center gap-1.5">
                          {order.fulfillmentType === 'delivery' ? (
                            <Truck className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <Store className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                          <span>{order.fulfillmentType}</span>
                        </p>
                        {order.customer.address && <p className="line-clamp-2">{order.customer.address}</p>}
                        {order.customer.deliveryArea && (
                          <p className="text-zinc-500">Zone: {order.customer.deliveryArea}</p>
                        )}
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[11px]">Items ({order.items.length})</span>
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, i) => (
                            <p key={i} className="text-zinc-300 truncate">
                              {item.quantity}x {item.name}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-zinc-500 italic">+ {order.items.length - 2} more dishes</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="pt-3 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-zinc-500 font-semibold mr-1">Move Status:</span>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] font-semibold text-zinc-300 border border-zinc-800"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] font-semibold text-zinc-300 border border-zinc-800"
                        >
                          Cooking
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] font-semibold text-zinc-300 border border-zinc-800"
                        >
                          Out for Delivery
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] font-semibold text-zinc-300 border border-zinc-800"
                        >
                          Delivered
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white border border-zinc-700 flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Receipt Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MENU CATALOG */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Menu Catalog & Price Management</h2>
                <p className="text-xs text-zinc-400">
                  Update dish descriptions, set Nigerian Naira prices, and toggle in-stock availability
                </p>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-300 text-zinc-950 font-bold text-xs hover:from-white hover:to-zinc-200 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Nigerian Dish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-zinc-950 border border-zinc-800/90 overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative h-44 w-full bg-zinc-900">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-zinc-950/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-zinc-300 border border-zinc-800">
                      {item.category}
                    </div>
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleToggleMenuAvailability(item)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                          item.isAvailable
                            ? 'bg-zinc-900/90 text-zinc-200 border-zinc-700'
                            : 'bg-red-950/90 text-red-300 border-red-800'
                        }`}
                      >
                        {item.isAvailable ? 'In Stock' : 'Sold Out'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
                      <span className="text-base font-black text-white">{formatNaira(item.price)}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                          title="Edit Dish"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-800"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white">Sales Summaries & Kitchen Performance</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="text-xs text-zinc-400">Total Verified Revenue</span>
                <div className="text-2xl font-black text-white">
                  {formatNaira(analytics.totalRevenueNaira)}
                </div>
                <p className="text-[11px] text-zinc-500">From {analytics.paidOrdersCount} completed payments</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="text-xs text-zinc-400">Today&apos;s Sales</span>
                <div className="text-2xl font-black text-white">
                  {formatNaira(analytics.todayRevenueNaira)}
                </div>
                <p className="text-[11px] text-zinc-500">{analytics.todayOrdersCount} orders placed today</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="text-xs text-zinc-400">Average Order Value</span>
                <div className="text-2xl font-black text-white">
                  {formatNaira(analytics.averageOrderValueNaira)}
                </div>
                <p className="text-[11px] text-zinc-500">Per verified checkout</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="text-xs text-zinc-400">Total Orders Lifetime</span>
                <div className="text-2xl font-black text-white">{analytics.totalOrders}</div>
                <p className="text-[11px] text-zinc-500">Across pickup and delivery</p>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Kitchen Pipeline Distribution
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-2xl font-black text-white">{analytics.statusCounts.pending || 0}</span>
                  <p className="text-xs text-zinc-400 mt-1">Pending Orders</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-2xl font-black text-white">{analytics.statusCounts.preparing || 0}</span>
                  <p className="text-xs text-zinc-400 mt-1">Currently Cooking</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-2xl font-black text-white">
                    {analytics.statusCounts.out_for_delivery || 0}
                  </span>
                  <p className="text-xs text-zinc-400 mt-1">With Riders</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-2xl font-black text-white">{analytics.statusCounts.delivered || 0}</span>
                  <p className="text-xs text-zinc-400 mt-1">Completed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white">Paystack Transactions Log</h2>
            <p className="text-xs text-zinc-400">
              Audit trail of references, amounts in Kobo, channel, and verification timestamps
            </p>

            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Reference</th>
                    <th className="p-3.5">Order</th>
                    <th className="p-3.5">Amount (NGN)</th>
                    <th className="p-3.5">Amount (Kobo)</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-500">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-900/50">
                        <td className="p-3.5 font-mono text-[11px] text-white">{p.reference}</td>
                        <td className="p-3.5 font-bold">{p.orderNumber}</td>
                        <td className="p-3.5 font-black text-white">{formatNaira(p.amountNaira)}</td>
                        <td className="p-3.5 font-mono text-zinc-400">{p.amountKobo.toLocaleString()}</td>
                        <td className="p-3.5 capitalize">{p.channel || 'Card'}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.status === 'success'
                                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                : 'bg-red-950/60 text-red-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-500">
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && settings && (
          <div className="space-y-6 max-w-4xl">
            <h2 className="text-xl font-black text-white">Restaurant Profile & Paystack Configuration</h2>

            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-300" />
                <span>Paystack Gateway Configuration</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Active Paystack Mode</label>
                  <select
                    value={settings.paystackMode}
                    onChange={(e) => setSettings({ ...settings, paystackMode: e.target.value as 'test' | 'live' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                  >
                    <option value="test">Test Mode (sk_test_...)</option>
                    <option value="live">Live Mode (sk_live_...)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Test Secret Key (Server-Only)</label>
                  <input
                    type="password"
                    value={settings.paystackTestSecretKey || ''}
                    onChange={(e) => setSettings({ ...settings, paystackTestSecretKey: e.target.value })}
                    placeholder="sk_test_..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Test Public Key (Optional Client)</label>
                  <input
                    type="text"
                    value={settings.paystackTestPublicKey || ''}
                    onChange={(e) => setSettings({ ...settings, paystackTestPublicKey: e.target.value })}
                    placeholder="pk_test_..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Free Delivery Threshold (NGN)</label>
                  <input
                    type="number"
                    value={settings.freeDeliveryThreshold}
                    onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs"
                  />
                </div>
              </div>

              {/* Webhook Configuration Guide */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
                <span className="font-bold text-white block">Paystack Webhook Configuration URL</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  In your Paystack Dashboard (<strong>Settings → API Keys & Webhooks</strong>), paste this Webhook URL:
                </p>
                <div
                  suppressHydrationWarning
                  className="p-2.5 rounded-lg bg-black font-mono text-[11px] text-zinc-300 border border-zinc-800 select-all"
                >
                  {(typeof window !== 'undefined' ? window.location.origin : '') + '/api/paystack/webhook'}
                </div>
                <p className="text-zinc-500 text-[10px]">
                  Our webhook listener validates HMAC-SHA512 signatures and executes idempotent deduplication.
                </p>
              </div>

              <button
                onClick={async () => {
                  try {
                    await fetch('/api/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(settings),
                    });
                    setFeedbackMessage('Settings updated successfully.');
                    setTimeout(() => setFeedbackMessage(null), 3000);
                  } catch (err) {
                    alert('Failed to save settings');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 font-bold text-xs hover:bg-white transition-all cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: AUTOMATED TESTS */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Automated Integration & Security Test Suite</h2>
                <p className="text-xs text-zinc-400">
                  Runs tests against server-side price calculation, Paystack reference binding, HMAC SHA-512 signatures, duplicate webhook idempotency, and order state machine.
                </p>
              </div>

              <button
                onClick={handleRunAutomatedTests}
                disabled={isRunningTests}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-300 text-zinc-950 font-bold text-xs hover:from-white hover:to-zinc-200 shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isRunningTests ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Executing Test Runner...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-zinc-950" />
                    <span>Run Complete Test Suite Now</span>
                  </>
                )}
              </button>
            </div>

            {testResults.length === 0 ? (
              <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
                <Play className="w-8 h-8 text-zinc-500 mx-auto" />
                <h3 className="text-sm font-bold text-zinc-300">Test suite ready</h3>
                <p className="text-xs text-zinc-500">
                  Click the button above to run the 5 backend tests. You can also run them in the terminal via{' '}
                  <code className="text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded">npm test</code>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((t) => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                      t.passed
                        ? 'bg-zinc-950 border-zinc-800'
                        : 'bg-red-950/40 border-red-800'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {t.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{t.name}</h4>
                        <span className="text-[10px] text-zinc-400 font-mono">{t.durationMs}ms</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{t.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Menu Item Create / Edit Modal */}
      {menuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingItem ? 'Edit Nigerian Dish' : 'Add New Nigerian Dish'}
            </h3>

            <form onSubmit={handleSaveMenuItem} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Category *</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                  >
                    <option value="Rice & Grains">Rice & Grains</option>
                    <option value="Grill & Suya">Grill & Suya</option>
                    <option value="Soups & Swallows">Soups & Swallows</option>
                    <option value="Small Chops & Starters">Small Chops & Starters</option>
                    <option value="Drinks & Beverages">Drinks & Beverages</option>
                    <option value="Chef Platters">Chef Platters</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Price (NGN ₦) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white resize-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={itemImage}
                  onChange={(e) => setItemImage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Spice Level</label>
                  <select
                    value={itemSpicy}
                    onChange={(e) => setItemSpicy(Number(e.target.value) as 0 | 1 | 2 | 3)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                  >
                    <option value={0}>0 - Mild / None</option>
                    <option value={1}>1 - Gentle Warmth</option>
                    <option value={2}>2 - Standard Spicy</option>
                    <option value={3}>3 - Extra Hot (Ata Rodo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    value={itemPrep}
                    onChange={(e) => setItemPrep(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemFeatured}
                    onChange={(e) => setItemFeatured(e.target.checked)}
                    className="rounded bg-zinc-900"
                  />
                  <span>Chef Featured Pick</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemAvailable}
                    onChange={(e) => setItemAvailable(e.target.checked)}
                    className="rounded bg-zinc-900"
                  />
                  <span>In Stock</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setMenuModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-zinc-100 text-zinc-950 font-bold hover:bg-white"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Order Receipt: {selectedOrder.orderNumber}</h3>
                <p className="text-xs text-zinc-400">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-zinc-400 hover:text-white text-xs px-2.5 py-1 rounded bg-zinc-900"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900 space-y-1">
                <p><strong>Customer:</strong> {selectedOrder.customer.name} ({selectedOrder.customer.phone})</p>
                <p><strong>Email:</strong> {selectedOrder.customer.email}</p>
                {selectedOrder.customer.address && (
                  <p><strong>Address:</strong> {selectedOrder.customer.address}</p>
                )}
                <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus} (Ref: {selectedOrder.paymentReference || 'N/A'})</p>
              </div>

              <div className="divide-y divide-zinc-900">
                {selectedOrder.items.map((it, i) => (
                  <div key={i} className="py-2 flex justify-between">
                    <span>{it.quantity}x {it.name}</span>
                    <span className="font-bold text-white">{formatNaira(it.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-900 space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal:</span>
                  <span>{formatNaira(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery Fee:</span>
                  <span>{formatNaira(selectedOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-white text-sm pt-1">
                  <span>Total:</span>
                  <span>{formatNaira(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
