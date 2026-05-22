export type ColorTheme = "amerta-night";
export type VisualTheme = "default" | "school" | "work";

export function applyColorTheme(theme: ColorTheme) {
  if (typeof window === "undefined") return;
  document.documentElement.classList.add("dark");
  localStorage.setItem("color-theme", theme);
}

export function getStoredColorTheme(): ColorTheme {
  return "amerta-night";
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
