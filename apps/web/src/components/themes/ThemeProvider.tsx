"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { applyColorTheme, applyVisualTheme } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorTheme, visualTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Apply themes on mount
    applyColorTheme(colorTheme);
    applyVisualTheme(visualTheme);
    setMounted(true);
  }, [colorTheme, visualTheme]);

  // Optionally avoid rendering children until mounted to prevent hydration errors,
  // but usually it's fine if the `apply*` runs synchronously before render if possible.
  // NextJS handles suppressHydrationWarning on html element so just return children.
  return <>{children}</>;
}
