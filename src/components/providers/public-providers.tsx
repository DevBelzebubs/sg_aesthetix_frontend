"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/contexts/cart-context";
import { CustomerAuthProvider } from "@/contexts/customer-auth-context";

export function PublicProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <CustomerAuthProvider>
        {children}
      </CustomerAuthProvider>
    </CartProvider>
  );
}
