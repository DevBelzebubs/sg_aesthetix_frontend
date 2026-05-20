"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/cart-context";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type Props = {
  slug: string;
  basePath: string;
  brandName: string;
};

export function NavbarPublic({ slug, basePath, brandName }: Props) {
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

  const panelHref = role === "admin" ? "/admin" : "/empleado";

  const isActive = (href: string) => {
    if (href === basePath) return pathname === basePath;
    return pathname.startsWith(href);
  };

  const navLinkClass = (href: string) =>
    `relative transition hover:text-black ${
      isActive(href)
        ? "text-black after:absolute after:-bottom-1 after:left-0 after:w-full after:h-px after:bg-black"
        : "text-[var(--tenant-muted)]"
    }`;

  const AccountButtonDesktop = () => {
    const customerPoints = customerSession?.puntosDisponibles;

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openCustomerModal}
          className="relative flex items-center justify-center border border-black/15 p-2.5 text-[var(--tenant-muted)] transition hover:border-black/40 hover:text-black"
          title={customerSession ? "Mis Puntos" : "Iniciar sesión"}
        >
          <UserIcon size={14} />
          {customerSession !== null && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center bg-[var(--tenant-primary)] text-white text-[9px] font-bold px-1">
              {customerPoints}
            </span>
          )}
        </button>

        {isReady && isAuthenticated && (
          <>
            <Link
              href={panelHref}
              className="flex items-center gap-2 border border-black/15 px-3 py-2 text-xs font-semibold tracking-widest uppercase text-black transition hover:border-black/40"
            >
              Panel
            </Link>
            <button
              onClick={logout}
              className="flex items-center justify-center border border-black/15 p-2.5 text-[var(--tenant-muted)] transition hover:border-red-400 hover:text-red-500"
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
        className="border-b border-black/10 bg-white"
      >
        <div
          className={`mx-auto flex w-full max-w-6xl items-center justify-between px-4 transition-all sm:px-6 ${
            scrolled ? "py-2 sm:py-2.5" : "py-3 sm:py-4"
          }`}
        >
          {/* Logo */}
          <Link href={basePath} className="flex shrink-0 items-center gap-3">
            <img
              src="https://res.cloudinary.com/dxuk9bogw/image/upload/v1778621784/833470fc-bdb3-4b85-bee7-6bce8cd42f5c.png"
              alt={brandName}
              className={`w-auto object-contain transition-all ${
                scrolled ? "h-9 sm:h-12" : "h-11 sm:h-16"
              }`}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center md:flex">
            <div className="flex items-center gap-8 text-xs font-semibold tracking-[0.14em] uppercase">
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

            <div className="mx-8 h-6 w-px bg-black/8" />

            <div className="flex items-center gap-5">
              <Link
                href={`${basePath}/reservar`}
                className={`bg-[var(--tenant-primary)] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-90 ${
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
                  className="relative flex items-center justify-center border border-black/15 p-2.5 text-[var(--tenant-muted)] transition hover:border-black/40 hover:text-black"
                  title="Carrito"
                >
                  <CartIcon size={14} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center bg-[var(--tenant-primary)] text-white text-[10px] font-bold">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </button>
              </div>

              <div className="h-6 w-px bg-black/8" />
              <AccountButtonDesktop />
            </div>
          </nav>

          {/* Mobile: carrito + hamburguesa */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={openCustomerModal}
              className="relative flex items-center justify-center border border-black/15 p-2 text-[var(--tenant-muted)] transition hover:border-black/40 hover:text-black"
              title={customerSession ? "Mis Puntos" : "Iniciar sesión"}
            >
              <UserIcon size={15} />
              {customerSession !== null && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center bg-[var(--tenant-primary)] text-white text-[9px] font-bold px-1">
                  {customerSession.puntosDisponibles}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={openCart}
              className="relative flex items-center justify-center border border-black/15 p-2 text-[var(--tenant-muted)] transition hover:border-black/40 hover:text-black"
              title="Carrito"
            >
              <CartIcon size={15} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center bg-[var(--tenant-primary)] text-white text-[10px] font-bold">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center border border-black/15 p-2 text-black transition hover:border-black/40"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {menuOpen ? <XIcon size={15} /> : <MenuIcon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — fuera del header para no romper el sticky */}
      {menuOpen && (
        <div className="fixed inset-0 z-20 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            style={{ top: headerRef.current?.getBoundingClientRect().bottom ?? 0 }}
            onClick={() => setMenuOpen(false)}
          />
          {/* Panel — se posiciona justo debajo del header usando getBoundingClientRect */}
          <div
            className="absolute right-0 w-full max-w-xs border-l border-black/10 bg-white shadow-xl"
            style={{ top: headerRef.current?.getBoundingClientRect().bottom ?? 0 }}
          >
            <nav className="flex flex-col divide-y divide-black/5">
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

              {/* Admin / Login */}
              <div className="px-5 py-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openCustomerModal();
                  }}
                  className="flex w-full items-center justify-center gap-2 border border-black/15 px-3 py-2.5 text-xs font-semibold tracking-widest uppercase text-[var(--tenant-muted)] transition hover:border-black/40 hover:text-black"
                >
                  <UserIcon size={13} /> Mis Puntos
                </button>
                {isReady && isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href={panelHref}
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 border border-black/15 px-3 py-2 text-center text-xs font-semibold tracking-widest uppercase text-black transition hover:border-black/40"
                    >
                      Panel
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="flex items-center justify-center border border-black/15 p-2.5 text-[var(--tenant-muted)] transition hover:border-red-400 hover:text-red-500"
                      title="Cerrar sesión"
                    >
                      <LogoutIcon size={14} />
                    </button>
                  </div>
                ) : (
                  <Link
                    href={`/${slug}/login`}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 border border-black/15 px-3 py-2.5 text-xs font-semibold tracking-widest uppercase text-[var(--tenant-muted)] transition hover:border-black/40 hover:text-black"
                  >
                    <LockIcon size={13} /> Admin
                  </Link>
                )}
              </div>
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
          ? "bg-neutral-50 text-black"
          : "text-[var(--tenant-muted)] hover:bg-neutral-50 hover:text-black"
      }`}
    >
      {children}
      {active && !highlight && <span className="h-1.5 w-1.5 rounded-full bg-black" />}
    </Link>
  );
}

// ── Iconos ────────────────────────────────────────────────────────

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