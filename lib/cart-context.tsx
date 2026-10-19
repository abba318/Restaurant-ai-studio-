'use client';

import React, { createContext, useContext, useState, useSyncExternalStore } from 'react';
import { MenuItem } from './types';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number, instructions?: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  totalItemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'naija_grill_cart_v1';
const CART_UPDATE_EVENT = 'naija_grill_cart_updated';

let cachedItems: CartItem[] = [];
let cachedRaw: string | null = null;
const SERVER_CART: CartItem[] = [];

function subscribeCart(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(CART_UPDATE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CART_UPDATE_EVENT, callback);
  };
}

function getCartSnapshot(): CartItem[] {
  if (typeof window === 'undefined') return SERVER_CART;
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedItems;
    }
    cachedRaw = raw;
    cachedItems = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(cachedItems)) {
      cachedItems = [];
    }
    return cachedItems;
  } catch {
    return cachedItems;
  }
}

function getCartServerSnapshot(): CartItem[] {
  return SERVER_CART;
}

function persistCart(newItems: CartItem[]) {
  try {
    cachedItems = newItems;
    cachedRaw = JSON.stringify(newItems);
    localStorage.setItem(CART_STORAGE_KEY, cachedRaw);
  } catch {
    // Ignore storage errors
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_UPDATE_EVENT));
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addItem = (menuItem: MenuItem, quantity = 1, instructions = '') => {
    const current = [...items];
    const existingIndex = current.findIndex((i) => i.menuItem.id === menuItem.id);
    if (existingIndex > -1) {
      current[existingIndex] = {
        ...current[existingIndex],
        quantity: current[existingIndex].quantity + quantity,
        specialInstructions: instructions || current[existingIndex].specialInstructions,
      };
    } else {
      current.push({ menuItem, quantity, specialInstructions: instructions });
    }
    persistCart(current);
    setIsCartOpen(true);
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    const updated = items.map((i) =>
      i.menuItem.id === menuItemId ? { ...i, quantity: Math.min(50, quantity) } : i
    );
    persistCart(updated);
  };

  const removeItem = (menuItemId: string) => {
    const filtered = items.filter((i) => i.menuItem.id !== menuItemId);
    persistCart(filtered);
  };

  const clearCart = () => {
    persistCart([]);
  };

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItemCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
