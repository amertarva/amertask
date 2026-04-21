import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyColorTheme,
  applyVisualTheme,
  ColorTheme,
  VisualTheme,
} from "@/lib/theme";

interface ThemeStore {
  colorTheme: ColorTheme;
  visualTheme: VisualTheme;
  setColorTheme: (theme: ColorTheme) => void;
  setVisualTheme: (theme: VisualTheme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      colorTheme: "amerta-day",
      visualTheme: "default",
      setColorTheme: (theme) => {
        applyColorTheme(theme);
        set({ colorTheme: theme });
      },
      setVisualTheme: (theme) => {
        applyVisualTheme(theme);
        set({ visualTheme: theme });
      },
    }),
    { name: "amerta-theme-storage" },
  ),
);
