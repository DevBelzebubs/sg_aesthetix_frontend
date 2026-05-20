"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NavbarPublic } from "@/components/public/NavbarPublic";
import { CartDrawer } from "@/components/public/cart-drawer";
import { CustomerAuthModal } from "@/components/public/customer-auth-modal";

type Props = {
  children: ReactNode;
  slug: string;
  basePath: string;
  brandName: string;
  footer: ReactNode;
};

export function PublicLayoutShell({ children, slug, basePath, brandName, footer }: Props) {
  const pathname = usePathname();
  const isLogin = pathname.endsWith("/login");

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <>
      <NavbarPublic slug={slug} basePath={basePath} brandName={brandName} />
      <main className="mx-auto w-full max-w-6xl px-6">
        {children}
      </main>
      {footer}
      <CartDrawer />
      <CustomerAuthModal />
    </>
  );
}
