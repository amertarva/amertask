import type { ColorTheme } from "@/lib/theme";

export interface ColorThemePickerProps {
  current: ColorTheme;
  onChange: (theme: ColorTheme) => void;
}
