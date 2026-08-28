export const DEFAULT_THEME = {
  brand: "#FF4F00",
  brandHover: "#E04600",
  brandDeep: "#000000",
  paper: "#F4F4F4",
  ink: "#0A0A0A",
  inkSoft: "#4A4A4A",
  line: "#E4E4E4",
  surface: "#FFFFFF",
  ok: "#1F7A4D",
} as const;

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

export function darkenHex(hex: string, amount = 0.12) {
  const n = hex.slice(1);
  const channel = (start: number) => {
    const value = parseInt(n.slice(start, start + 2), 16);
    return Math.max(0, Math.round(value * (1 - amount)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

export type ThemeOverride = {
  brand_primary?: string | null;
  brand_deep?: string | null;
  brand_paper?: string | null;
  logo_url?: string | null;
};

export function resolveTheme(override?: ThemeOverride | null) {
  const brand = isHexColor(override?.brand_primary) ? override.brand_primary : DEFAULT_THEME.brand;
  const brandDeep = isHexColor(override?.brand_deep) ? override.brand_deep : DEFAULT_THEME.brandDeep;
  const paper = isHexColor(override?.brand_paper) ? override.brand_paper : DEFAULT_THEME.paper;
  return {
    brand,
    brandHover: darkenHex(brand),
    brandDeep,
    paper,
    custom: Boolean(override?.brand_primary && isHexColor(override.brand_primary)),
    logoUrl: override?.logo_url || null,
  };
}

export function themeCssVars(override?: ThemeOverride | null): Record<string, string> | undefined {
  const theme = resolveTheme(override);
  if (!theme.custom && !override?.brand_deep && !override?.brand_paper) {
    return undefined;
  }
  const vars: Record<string, string> = {
    "--brand": theme.brand,
    "--brand-hover": theme.brandHover,
  };
  if (isHexColor(override?.brand_deep)) vars["--brand-deep"] = theme.brandDeep;
  if (isHexColor(override?.brand_paper)) vars["--paper"] = theme.paper;
  return vars;
}
