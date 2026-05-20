"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { CustomerAuthProvider } from "@/contexts/customer-auth-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <CustomerAuthProvider>
          {children}
        </CustomerAuthProvider>
      </CartProvider>
    </AuthProvider>
  );
}
