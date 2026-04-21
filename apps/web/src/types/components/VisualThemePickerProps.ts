import type { VisualTheme } from "@/lib/theme";

export interface VisualThemePickerProps {
  current: VisualTheme;
  onChange: (theme: VisualTheme) => void;
}
