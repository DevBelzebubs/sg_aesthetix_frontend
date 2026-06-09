"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/cart-context";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { useTheme } from "@/contexts/theme-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type Props = {
  slug: string;
  basePath: string;
  brandName: string;
  socialLinks?: {
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
  } | null;
};

export function NavbarPublic({ slug, basePath, brandName, socialLinks }: Props) {
  const { isAuthenticated, isReady, role, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Cierra el menú al cambiar de página
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Bloquea scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Detecta scroll para compactar navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { totalItems, openCart } = useCart();
  const { session: customerSession, openModal: openCustomerModal } = useCustomerAuth();
  const { theme, toggleTheme } = useTheme();

  const panelHref = role === "admin" ? "/admin" : "/empleado";

  const isActive = (href: string) => {
    if (href === basePath) return pathname === basePath;
    return pathname.startsWith(href);
  };

  const navLinkClass = (href: string) =>
    `relative transition hover:text-[var(--foreground)] ${
      isActive(href)
        ? "text-[var(--foreground)] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-px after:bg-[var(--hover)]"
        : "text-[var(--text-muted)]"
    }`;

  const AccountButtonDesktop = () => {
    const customerPoints = customerSession?.puntosDisponibles;

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openCustomerModal}
          className="relative flex items-center justify-center border border-transparent/10 p-3 text-[var(--text-muted)] transition hover:border-[var(--hover)]/40 hover:text-[var(--foreground)]"
          title={customerSession ? "Mis Puntos" : "Iniciar sesión"}
        >
          <UserIcon size={18} />
          {customerSession !== null && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center bg-[var(--tenant-primary)] text-white text-[10px] font-bold px-1">
              {customerPoints}
            </span>
          )}
        </button>

        {isReady && isAuthenticated && (
          <>
            <Link
              href={panelHref}
              className="flex items-center gap-2 border border-transparent/10 px-3 py-2 text-xs font-semibold tracking-widest uppercase text-[var(--foreground)] transition hover:border-[var(--hover)]/40"
            >
              Panel
            </Link>
            <button
              onClick={logout}
              className="flex items-center justify-center border border-transparent/10 p-2.5 text-[var(--text-muted)] transition hover:border-red-400 hover:text-red-500"
              title="Cerrar sesión"
            >
              <LogoutIcon size={14} />
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <header
        ref={headerRef}
        className="relative z-30 border-b border-transparent/5 bg-[var(--background-secondary)]"
      >
        <div
          className={`mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 transition-all sm:px-6 ${
            scrolled ? "py-2 sm:py-2.5" : "py-3 sm:py-4"
          }`}
        >
          {/* Logo */}
          <Link href={basePath} className="flex shrink-0 items-center gap-3">
            <img
              src={
                theme === "dark"
                  ? "https://res.cloudinary.com/dp1vgjhsq/image/upload/v1780970210/ChatGPT_Image_4_jun_2026_18_46_26_dlzo86.png"
                  : "https://res.cloudinary.com/dp1vgjhsq/image/upload/v1779981236/ZONA-FADE_nziudx.png"
              }
              alt={brandName}
              className={`w-auto max-w-[180px] object-contain transition-all ${
                scrolled ? "h-10 sm:h-12 md:h-14" : "h-12 sm:h-16 md:h-18"
              }`}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center md:flex">
            <div className="flex items-center gap-8 text-sm font-semibold tracking-[0.14em] uppercase">
              <Link href={basePath} className={navLinkClass(basePath)}>
                Inicio
              </Link>
              <Link href={`${basePath}/galeria`} className={navLinkClass(`${basePath}/galeria`)}>
                Galería
              </Link>
              <Link href={`${basePath}/productos`} className={navLinkClass(`${basePath}/productos`)}>
                Productos
              </Link>
              <Link href={`${basePath}/promocion`} className={navLinkClass(`${basePath}/promocion`)}>
                Recompensas
              </Link>
            </div>

            <div className="mx-8 h-6 w-px bg-transparent/5" />

            <div className="flex items-center gap-5">
              <Link
                href={`${basePath}/reservar`}
                className={`bg-[var(--tenant-primary)] px-7 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-90 ${
                  isActive(`${basePath}/reservar`)
                    ? "ring-2 ring-[var(--tenant-primary)] ring-offset-2"
                    : ""
                }`}
              >
                Reservar
              </Link>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={openCart}
                  className="relative flex items-center justify-center border border-transparent/10 p-3 text-[var(--text-muted)] transition hover:border-[var(--hover)]/40 hover:text-[var(--foreground)]"
                  title="Carrito"
                >
                  <CartIcon size={18} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center bg-[var(--tenant-primary)] text-white text-[10px] font-bold">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center border border-transparent/10 p-3 text-[var(--text-muted)] transition hover:border-[var(--hover)]/40 hover:text-[var(--foreground)]"
                title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
              >
                {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
              </button>

              <div className="h-6 w-px bg-transparent/5" />
              <AccountButtonDesktop />
            </div>
          </nav>

          {/* Mobile: carrito + hamburguesa */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={openCustomerModal}
              className="relative flex items-center justify-center border border-transparent/10 p-3 text-[var(--text-muted)] transition hover:border-[var(--hover)]/40 hover:text-[var(--foreground)]"
              title={customerSession ? "Mis Puntos" : "Iniciar sesión"}
            >
              <UserIcon size={20} />
              {customerSession !== null && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center bg-[var(--tenant-primary)] text-white text-[10px] font-bold px-1">
                  {customerSession.puntosDisponibles}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={openCart}
              className="relative flex items-center justify-center border border-transparent/10 p-3 text-[var(--text-muted)] transition hover:border-[var(--hover)]/40 hover:text-[var(--foreground)]"
              title="Carrito"
            >
              <CartIcon size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center bg-[var(--tenant-primary)] text-white text-[10px] font-bold">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center border border-transparent/10 p-3 text-[var(--text-muted)] transition hover:border-[var(--hover)]/40 hover:text-[var(--foreground)]"
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {theme === "dark" ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center border border-transparent/10 p-3 text-[var(--foreground)] transition hover:border-[var(--hover)]/40"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {menuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — fuera del header para no romper el sticky */}
      {menuOpen && (
        <div className="fixed inset-0 z-20 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            style={{ top: headerRef.current?.getBoundingClientRect().bottom ?? 0 }}
            onClick={() => setMenuOpen(false)}
          />
          {/* Panel — se posiciona justo debajo del header usando getBoundingClientRect */}
          <div
            className="absolute right-0 w-full max-w-xs border-l border-transparent/5 bg-[var(--background-secondary)] shadow-xl"
            style={{ top: headerRef.current?.getBoundingClientRect().bottom ?? 0 }}
          >
            <nav className="flex flex-col divide-y divide-transparent/5">
              <MobileNavLink
                href={basePath}
                active={isActive(basePath)}
                onClick={() => setMenuOpen(false)}
              >
                Inicio
              </MobileNavLink>
              <MobileNavLink
                href={`${basePath}/galeria`}
                active={isActive(`${basePath}/galeria`)}
                onClick={() => setMenuOpen(false)}
              >
                Galería
              </MobileNavLink>
              <MobileNavLink
                href={`${basePath}/productos`}
                active={isActive(`${basePath}/productos`)}
                onClick={() => setMenuOpen(false)}
              >
                Productos
              </MobileNavLink>
              <MobileNavLink
                href={`${basePath}/promocion`}
                active={isActive(`${basePath}/promocion`)}
                onClick={() => setMenuOpen(false)}
              >
                Recompensas
              </MobileNavLink>
              <MobileNavLink
                href={`${basePath}/reservar`}
                active={isActive(`${basePath}/reservar`)}
                onClick={() => setMenuOpen(false)}
                highlight
              >
                Reservar
              </MobileNavLink>
            </nav>


          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────

function MobileNavLink({
  href,
  active,
  highlight,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  highlight?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center justify-between px-5 py-4 text-sm font-semibold tracking-widest uppercase transition ${
        highlight
          ? "bg-[var(--tenant-primary)] text-white hover:opacity-90"
          : active
          ? "bg-[var(--background)] text-[var(--foreground)]"
          : "text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
      {active && !highlight && <span className="h-1.5 w-1.5 rounded-full bg-[var(--hover)]" />}
    </Link>
  );
}

// ── Iconos ────────────────────────────────────────────────────────

function SunIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function CartIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function UserIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function GridIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
    </svg>
  );
}

function LogoutIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function MenuIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function InstagramIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89 2.9 2.9 0 0 1 .78.11V9.4a6.29 6.29 0 0 0-.78-.05A6.25 6.25 0 0 0 2.74 15.6a6.25 6.25 0 0 0 6.25 6.25 6.25 6.25 0 0 0 6.25-6.25v-6.88a8.23 8.23 0 0 0 4.83 1.55V6.69h-.58z" />
    </svg>
  );
}