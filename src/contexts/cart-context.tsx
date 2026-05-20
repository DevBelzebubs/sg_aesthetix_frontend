"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { CartItem } from "@/types/product";

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, cantidad: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "sg_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const hydrated = useRef(false);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  useEffect(() => {
    setItems(loadCart());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((current) => {
      const index = current.findIndex((i) => i.productId === newItem.productId);
      if (index >= 0) {
        const updated = [...current];
        updated[index] = {
          ...updated[index],
          cantidad: updated[index].cantidad + newItem.cantidad,
        };
        return updated;
      }
      return [...current, newItem];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, cantidad: number) => {
    if (cantidad < 1) return;
    setItems((current) =>
      current.map((i) => (i.productId === productId ? { ...i, cantidad } : i)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
