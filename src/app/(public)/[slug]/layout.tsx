import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getThemeSettingsByTenantId } from "@/lib/theme/get-theme-settings";
import { resolveTenantBySlug } from "@/lib/tenant/resolve-tenant";
import { TapeDecor } from "@/components/tape-decor";
import { NavbarPublic } from "@/components/public/NavbarPublic";

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
      <NavbarPublic
        slug={tenant.slug}
        basePath={basePath}
        brandName={theme.brandName}
      />

      <main className="mx-auto w-full max-w-6xl px-6 pt-10 sm:pt-2">
        {children}
      </main>

      <footer className="mt-auto px-6 pb-8 max-w-6xl mx-auto w-full">
        {/* Tarjeta principal */}
        <div className="relative bg-white border border-black/8 rounded-3xl px-8 py-10 flex flex-col md:flex-row justify-between items-start gap-8 overflow-visible">
          <div className="hidden md:block absolute -top-5 -left-6 w-[80px] scale-75 opacity-80">
            <TapeDecor />
          </div>
          <div className="hidden md:block absolute -top-5 -right-6 rotate-90 w-[80px] scale-75 opacity-80">
            <TapeDecor />
          </div>

          {/* Marca + tagline */}
          <div className="flex flex-col gap-3 max-w-xs">
            <Link href={basePath} className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/dxuk9bogw/image/upload/v1777198980/Dise%C3%B1o_sin_t%C3%ADtulo_3_o2ipsz.png"
                alt={theme.brandName}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Cortes de precisión, ambiente cuidado y reserva online sin
              esperas.
            </p>
          </div>

          {/* Columnas de links */}
          <div className="flex flex-col sm:flex-row gap-8 md:gap-16">
            {/* Navegar */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Navegar
              </h4>
              <div className="flex flex-col gap-2 text-xs text-neutral-500">
                <Link
                  href={basePath}
                  className="hover:text-black transition-colors"
                >
                  Inicio
                </Link>
                <Link
                  href={`${basePath}#servicios`}
                  className="hover:text-black transition-colors"
                >
                  Servicios
                </Link>
                <Link
                  href={`${basePath}#equipo`}
                  className="hover:text-black transition-colors"
                >
                  Equipo
                </Link>
                <Link
                  href={`${basePath}/galeria`}
                  className="hover:text-black transition-colors"
                >
                  Galería
                </Link>
                <Link
                  href={`${basePath}/productos`}
                  className="hover:text-black transition-colors"
                >
                  Productos
                </Link>
              </div>
            </div>

            {/* Reservas */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Reservas
              </h4>
              <div className="flex flex-col gap-2 text-xs text-neutral-500">
                <Link
                  href={`${basePath}/reservar`}
                  className="hover:text-black transition-colors"
                >
                  Reservar turno
                </Link>
                <Link
                  href={`${basePath}#reservas`}
                  className="hover:text-black transition-colors"
                >
                  Horarios disponibles
                </Link>
                <span className="text-neutral-300 cursor-default">
                  App móvil{" "}
                  <span className="inline-flex ml-1 py-0.5 px-2 bg-neutral-100 text-[9px] rounded-full -rotate-1">
                    pronto
                  </span>
                </span>
              </div>
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Legal
              </h4>
              <div className="flex flex-col gap-2 text-xs text-neutral-500">
                <Link
                  href={`${basePath}/privacidad`}
                  className="hover:text-black transition-colors"
                >
                  Política de privacidad
                </Link>
                <Link
                  href={`${basePath}/terminos`}
                  className="hover:text-black transition-colors"
                >
                  Términos de uso
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="mt-4 px-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[10px] tracking-[0.08em] uppercase text-neutral-400">
          <p>
            © {new Date().getFullYear()} {theme.brandName} · Todos los derechos
            reservados
          </p>
          <div className="flex items-center gap-4">
            <p>Barbería · Reservas online · Atención personalizada</p>
            <Link
              href={`${basePath}/libro-reclamaciones`}
              className="flex-shrink-0"
            >
              <img
                src="https://res.cloudinary.com/dxuk9bogw/image/upload/v1776155530/7f85d794-58b5-47d0-850d-d06179563fb2.png"
                alt="Libro de Reclamaciones"
                className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
