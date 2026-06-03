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
      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div
        className="hidden sm:flex h-[42px] items-center justify-center px-4 sm:px-6"
        style={{
          background: "linear-gradient(135deg, #3a5a36, #3a5a36)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
      >
        <div className="flex w-full max-w-[1400px] items-center justify-between text-white/90 text-[11px] font-medium">
          {/* Left */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="text-white/70"><path d="M11.5 2L6 22"/><path d="M17.5 2L12 22"/><path d="M2 12h20"/></svg>
            <span className="hidden lg:inline">Estilo que define. Confianza que se nota.</span>
          </div>
          {/* Center */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="text-white/70"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="hidden md:inline">Av. Aviación 3464 · San Borja</span>
          </div>
          {/* Right */}
          <div className="flex items-center gap-4">
            <a href="tel:+51999999999" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span className="hidden xs:inline">+51 999 999 999</span>
            </a>
            <div className="flex items-center gap-2.5">
              <a href="https://www.instagram.com/zonafade_barber/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform text-white/80 hover:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2"/></svg>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform text-white/80 hover:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform text-white/80 hover:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <NavbarPublic slug={slug} basePath={basePath} brandName={brandName} />
      <main className="mx-auto w-full max-w-[1400px] px-6">
        {children}
      </main>
      {footer}
      <CartDrawer />
      <CustomerAuthModal />
    </>
  );
}
