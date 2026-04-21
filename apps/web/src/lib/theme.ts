export type ColorTheme = "amerta-day" | "amerta-night";
export type VisualTheme = "default" | "school" | "work";

export function applyColorTheme(theme: ColorTheme) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (theme === "amerta-night") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("color-theme", theme);
}

export function getStoredColorTheme(): ColorTheme {
  if (typeof window === "undefined") return "amerta-day";
  return (localStorage.getItem("color-theme") as ColorTheme) ?? "amerta-day";
}

export function applyVisualTheme(theme: VisualTheme) {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("visual-theme", theme);
}

export function getStoredVisualTheme(): VisualTheme {
  if (typeof window === "undefined") return "default";
  return (localStorage.getItem("visual-theme") as VisualTheme) ?? "default";
}
