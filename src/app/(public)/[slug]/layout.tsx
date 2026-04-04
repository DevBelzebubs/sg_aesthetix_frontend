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
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_32%),radial-gradient(circle_at_left,rgba(17,24,39,0.10),transparent_40%)]" />

      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href={basePath} className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--tenant-primary)] text-sm font-bold text-white shadow-lg shadow-black/15">
              SG
            </span>
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              {theme.brandName}
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-[var(--tenant-muted)] md:flex">
            <Link href={basePath} className="transition hover:text-[var(--tenant-text)]">
              Inicio
            </Link>
            <Link
              href={`${basePath}/galeria`}
              className="transition hover:text-[var(--tenant-text)]"
            >
              Galería
            </Link>
            <Link
              href={`${basePath}/reservar`}
              className="rounded-full bg-[var(--tenant-primary)] px-5 py-2.5 text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:opacity-95"
            >
              Reservar
            </Link>
          </nav>

          <Link
            href={`${basePath}/reservar`}
            className="rounded-full bg-[var(--tenant-primary)] px-4 py-2 text-sm font-semibold text-white md:hidden"
          >
            Reservar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">{children}</main>

      <footer className="mt-auto border-t border-black/10 bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-[var(--tenant-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {theme.brandName}</p>
          <p>Barbería premium · Reservas online · Atención personalizada</p>
        </div>
      </footer>
    </div>
  );
}
