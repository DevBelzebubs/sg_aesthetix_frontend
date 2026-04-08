import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getThemeSettingsByTenantId } from "@/lib/theme/get-theme-settings";
import { resolveTenantBySlug } from "@/lib/tenant/resolve-tenant";

type PublicLandingLayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: Omit<PublicLandingLayoutProps, "children">): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await resolveTenantBySlug(slug);
  const theme = await getThemeSettingsByTenantId(tenant.tenantId);
  return {
    title: `${theme.brandName} | Barbería`,
    description: `Sitio público de ${theme.brandName}: información, servicios, equipo y reservas en línea.`,
  };
}

export default async function PublicLandingLayout({
  children,
  params,
}: PublicLandingLayoutProps) {
  const { slug } = await params;
  const tenant = await resolveTenantBySlug(slug);
  const theme = await getThemeSettingsByTenantId(tenant.tenantId);

  const themeVariables: CSSProperties = {
    ["--tenant-primary" as string]: theme.primaryColor,
    ["--tenant-accent" as string]: theme.accentColor,
    ["--tenant-background" as string]: theme.backgroundColor,
    ["--tenant-surface" as string]: theme.surfaceColor,
    ["--tenant-text" as string]: theme.textColor,
    ["--tenant-muted" as string]: theme.mutedTextColor,
  };

  const basePath = `/${tenant.slug}`;

  return (
    <div
      style={themeVariables}
      className="relative min-h-screen overflow-x-hidden bg-[var(--tenant-background)] text-[var(--tenant-text)]"
    >
      {/* Navbar — full width, cuadrado, minimalista */}
      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href={basePath} className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-[var(--tenant-primary)] text-xs font-bold text-white">
              SG
            </span>
            <span className="text-sm font-semibold tracking-[0.06em] uppercase">
              {theme.brandName}
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-8 text-xs font-semibold tracking-[0.14em] uppercase text-[var(--tenant-muted)] md:flex">
            <Link href={basePath} className="transition hover:text-black">
              Inicio
            </Link>
            <Link href={`${basePath}/galeria`} className="transition hover:text-black">
              Galería
            </Link>
            <Link href={`${basePath}/galeria`} className="transition hover:text-black">
              Productos
            </Link>
            <Link
              href={`${basePath}/reservar`}
              className="bg-[var(--tenant-primary)] px-5 py-2.5 text-white transition hover:opacity-90"
            >
              Reservar
            </Link>
          </nav>

          {/* Nav mobile */}
          <Link
            href={`${basePath}/reservar`}
            className="bg-[var(--tenant-primary)] px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase text-white md:hidden"
          >
            Reservar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        {children}
      </main>

      <footer className="mt-auto border-t border-black/10 bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6 text-xs tracking-[0.1em] uppercase text-[var(--tenant-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {theme.brandName}</p>
          <p>Barbería · Reservas online · Atención personalizada</p>
        </div>
      </footer>
    </div>
  );
}