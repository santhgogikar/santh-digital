import type { CSSProperties, ReactNode } from "react";
import { themeCssVars, type ThemeOverride } from "@/lib/theme";

export function ThemeScope({
  theme,
  children,
}: {
  theme?: ThemeOverride | null;
  children: ReactNode;
}) {
  const vars = themeCssVars(theme);
  return (
    <div className="min-h-screen" style={vars as CSSProperties | undefined}>
      {children}
    </div>
  );
}
