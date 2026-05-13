"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

type Props = {
  slug: string;
  basePath: string;
  brandName: string;
};

export function NavbarPublic({ slug, basePath, brandName }: Props) {
  const { isAuthenticated, isReady, role, logout } = useAuth();

  const panelHref = role === "admin" ? "/admin" : "/empleado";

  const AdminButtonDesktop = () => {
    if (!isReady) return <div className="h-9 w-9 border border-black/10 bg-neutral-100 animate-pulse" />;

    if (isAuthenticated) return (
      <div className="flex items-center gap-2">
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
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    );

    return (
      <Link
        href={`/${slug}/login`}
        className="flex items-center justify-center border border-black/15 p-2.5 text-[var(--tenant-muted)] transition hover:border-black/40 hover:text-black"
        title="Panel administrativo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </Link>
    );
  };

  const AdminButtonMobile = () => {
    if (!isReady) return <div className="h-8 w-8 border border-black/10 bg-neutral-100 animate-pulse" />;

    if (isAuthenticated) return (
      <div className="flex items-center gap-1">
        <Link
          href={panelHref}
          className="border border-black/15 px-3 py-2 text-xs font-semibold tracking-widest uppercase text-black transition hover:border-black/40"
        >
          Panel
        </Link>
        <button
          onClick={logout}
          className="flex items-center justify-center border border-black/15 p-2 text-[var(--tenant-muted)] transition hover:border-red-400 hover:text-red-500"
          title="Cerrar sesión"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    );

    return (
      <Link
        href={`/${slug}/login`}
        className="flex items-center justify-center border border-black/15 p-2 text-[var(--tenant-muted)] transition hover:border-black/40 hover:text-black"
        title="Panel administrativo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href={basePath} className="flex items-center gap-3">
          <img
            src="https://res.cloudinary.com/dxuk9bogw/image/upload/v1778621784/833470fc-bdb3-4b85-bee7-6bce8cd42f5c.png"
            alt={brandName}
            className="h-18 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-8 text-xs font-semibold tracking-[0.14em] uppercase text-[var(--tenant-muted)] md:flex">
          <Link href={basePath} className="transition hover:text-black">Inicio</Link>
          <Link href={`${basePath}/galeria`} className="transition hover:text-black">Galería</Link>
          <Link href={`${basePath}/productos`} className="transition hover:text-black">Productos</Link>
          <Link
            href={`${basePath}/reservar`}
            className="bg-[var(--tenant-primary)] px-5 py-2.5 text-white transition hover:opacity-90"
          >
            Reservar
          </Link>
          <AdminButtonDesktop />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <AdminButtonMobile />
          <Link
            href={`${basePath}/reservar`}
            className="bg-[var(--tenant-primary)] px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase text-white"
          >
            Reservar
          </Link>
        </div>
      </div>
    </header>
  );
}