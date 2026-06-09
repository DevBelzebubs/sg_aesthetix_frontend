import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getThemeSettingsByTenantId } from "@/lib/theme/get-theme-settings";
import { resolveTenantBySlug } from "@/lib/tenant/resolve-tenant";
import { TapeDecor } from "@/components/tape-decor";
import { PublicLayoutShell } from "@/components/public/public-layout-shell";
import { FooterLogo } from "@/components/public/footer-logo";
import { createClient } from "@/lib/supabase/client";

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
  };

  const basePath = `/${tenant.slug}`;

  const supabase = createClient();
  const { data: localesData } = await supabase
    .from("locales")
    .select("direccion, telefono")
    .order("orden", { ascending: true });
  const locales = (localesData ?? []).map((l) => ({
    address: l.direccion,
    phone: l.telefono,
  }));

  const footer = (
    <footer className="mt-auto px-6 pb-8 max-w-[1400px] mx-auto w-full">
      {/* Tarjeta principal */}
      <div className="relative bg-[var(--background-secondary)] border border-transparent/10 rounded-3xl px-8 py-12 flex flex-col md:flex-row justify-between items-start gap-8 overflow-visible">
        <div className="hidden md:block absolute -top-5 -left-6 w-[80px] scale-75 opacity-80 dark:invert dark:opacity-60">
          <TapeDecor />
        </div>
        <div className="hidden md:block absolute -top-5 -right-6 rotate-90 w-[80px] scale-75 opacity-80 dark:invert dark:opacity-60">
          <TapeDecor />
        </div>

        {/* Marca + tagline */}
        <div className="flex flex-col gap-3 max-w-xs">
          <Link href={basePath} className="flex items-center gap-3">
            <FooterLogo brandName={theme.brandName} />
          </Link>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Cortes de precisión, ambiente cuidado y reserva online sin
            esperas.
          </p>
        </div>

        {/* Columnas de links */}
        <div className="flex flex-col sm:flex-row gap-8 md:gap-16">
          {/* Navegar */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Navegar
            </h4>
            <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
              <Link
                href={basePath}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Inicio
              </Link>
              <Link
                href={`${basePath}#servicios`}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Servicios
              </Link>
              <Link
                href={`${basePath}#equipo`}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Equipo
              </Link>
              <Link
                href={`${basePath}/galeria`}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Galería
              </Link>
              <Link
                href={`${basePath}/productos`}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Productos
              </Link>
            </div>
          </div>

          {/* Reservas */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Reservas
            </h4>
            <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
              <Link
                href={`${basePath}/reservar`}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Reservar turno
              </Link>
              <Link
                href={`${basePath}#reservas`}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Horarios disponibles
              </Link>
    
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Legal
            </h4>
            <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
              <Link
                href={`${basePath}/privacidad`}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Política de privacidad
              </Link>
              <Link
                href={`${basePath}/terminos`}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Términos de uso
              </Link>
              <Link
                href={`${basePath}/libro-reclamaciones`}
                className="flex-shrink-0 mt-2"
              >
                <img
                  src="https://res.cloudinary.com/dxuk9bogw/image/upload/v1776155530/7f85d794-58b5-47d0-850d-d06179563fb2.png"
                  alt="Libro de Reclamaciones"
                  className="h-14 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

{/* Barra inferior */}
<div className="mt-4 px-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[11px] tracking-[0.08em] uppercase text-[var(--text-muted)]">
  <p>
    © {new Date().getFullYear()} {theme.brandName} · Todos los derechos reservados
  </p>

  <p>Barbería · Reservas online · Atención personalizada</p>
</div>

<div className="mt-8 flex justify-center">
  <a
    href="https://www.instagram.com/solvegrades.com_/"
    target="_blank"
    rel="noopener noreferrer"
    className="opacity-40 hover:opacity-80 transition-opacity"
  >
    <img
      src="https://res.cloudinary.com/dp1vgjhsq/image/upload/v1778834655/WhatsApp_Image_2026-05-15_at_3.21.36_AM-removebg-preview_wtgmkr.png"
      alt="Designed & Built by SolveGrades"
      className="h-14 w-auto object-contain invert"
    />
  </a>
</div>
    </footer>
  );

  return (
    <div
      style={themeVariables}
      className="relative min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]"
    >
      <PublicLayoutShell
        slug={tenant.slug}
        basePath={basePath}
        brandName={theme.brandName}
        footer={footer}
        locales={locales}
      >
        {children}
      </PublicLayoutShell>
    </div>
  );
}
