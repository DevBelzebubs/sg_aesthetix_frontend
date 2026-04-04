import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
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
    description: `Sitio público de ${theme.brandName}: servicios, equipo y reservas en línea.`,
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

  return (
    <div style={themeVariables} className="min-h-screen bg-[var(--tenant-background)] text-[var(--tenant-text)]">
      <header className="border-b border-black/10 bg-[var(--tenant-surface)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <p className="text-lg font-semibold tracking-tight">{theme.brandName}</p>
          <span className="rounded-full bg-[var(--tenant-primary)] px-3 py-1 text-xs font-medium text-white">
            /{tenant.slug}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>

      <footer className="mt-auto border-t border-black/10 bg-[var(--tenant-surface)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-4 text-sm text-[var(--tenant-muted)]">
          © {new Date().getFullYear()} {theme.brandName}
        </div>
      </footer>
    </div>
  );
}
