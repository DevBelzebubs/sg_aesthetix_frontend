import type { ThemeSettings } from "@/types/theme";

const DEFAULT_THEME: ThemeSettings = {
  brandName: "SG Aesthetix",
  primaryColor: "#3A5A36",
  accentColor: "#4A7A46",
  backgroundColor: "#161616",
  surfaceColor: "#1C1C1C",
  textColor: "#E5E2E1",
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
