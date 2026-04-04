import type { ThemeSettings } from "@/types/theme";

const DEFAULT_THEME: ThemeSettings = {
  brandName: "SG Aesthetix",
  primaryColor: "#111827",
  accentColor: "#d4af37",
  backgroundColor: "#f8fafc",
  surfaceColor: "#ffffff",
  textColor: "#0f172a",
  mutedTextColor: "#475569",
};

export async function getThemeSettingsByTenantId(
  tenantId: string,
): Promise<ThemeSettings> {
  // TODO: Replace with API call using tenantId.
  return {
    ...DEFAULT_THEME,
    brandName: tenantId
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  };
}
