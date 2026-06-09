"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { NavbarPublic } from "@/components/public/NavbarPublic";
import { CartDrawer } from "@/components/public/cart-drawer";
import { CustomerAuthModal } from "@/components/public/customer-auth-modal";

type LocaleItem = {
  address: string;
  phone: string;
};

type Props = {
  children: ReactNode;
  slug: string;
  basePath: string;
  brandName: string;
  footer: ReactNode;
  locales: LocaleItem[];
};

export function PublicLayoutShell({ children, slug, basePath, brandName, footer, locales }: Props) {
  const pathname = usePathname();
  const isLogin = pathname.endsWith("/login");

  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    if (locales.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIdx((prev) => (prev + 1) % locales.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [locales.length]);

  if (isLogin) {
    return <>{children}</>;
  }

  const currentLocale = locales.length > 0 ? locales[carouselIdx % locales.length] : null;
  const displayPhone = locales.length > 0 ? locales[0].phone : "";

  return (
    <>
      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div
        className="hidden sm:flex items-center justify-center px-4 sm:px-6"
        style={{
          background: "linear-gradient(135deg, #1a1a1a, #2d2d2d)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
          minHeight: "48px",
        }}
      >
        <div className="flex w-full max-w-[1400px] items-center justify-between text-white/85 text-sm font-medium tracking-wide">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="w-px h-4 bg-white/15" />
            <span className="hidden lg:inline text-white/70 tracking-[0.05em]">Estilo que define. Confianza que se nota.</span>
          </div>
          {/* Center — auto carrusel de direcciones */}
          <div className="flex items-center gap-3">
            {currentLocale && (
              <span className="hidden md:inline text-white/60 transition-opacity duration-500">
                {currentLocale.address}
              </span>
            )}
            <div className="hidden md:block w-[6px] h-[6px] rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] animate-pulse" />
          </div>
          {/* Right — teléfono estático + redes */}
          <div className="flex items-center gap-5">
            {displayPhone && (
              <a href={`tel:${displayPhone}`} className="flex items-center gap-2 hover:text-white transition-colors group">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" className="text-white/50 group-hover:text-white transition-colors"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span className="text-white/65 group-hover:text-white transition-colors">{displayPhone}</span>
              </a>
            )}
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/zonafade_barber/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform text-white/50 hover:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2"/></svg>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform text-white/50 hover:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform text-white/50 hover:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
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
