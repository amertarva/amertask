import { ColorTheme } from "@/lib/theme";
import { Sun, Moon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColorThemePickerProps } from "@/types";

const COLOR_THEMES = [
  {
    id: "amerta-day" as ColorTheme,
    name: "Amerta-Day",
    description: "Tampilan terang, nyaman untuk siang hari",
    icon: Sun,
    previewBg: "#ffffff",
    previewText: "#0f172a",
    previewAccent: "#3b82f6",
  },
  {
    id: "amerta-night" as ColorTheme,
    name: "Amerta-Night",
    description: "Tampilan gelap, nyaman untuk malam hari",
    icon: Moon,
    previewBg: "#0f172a",
    previewText: "#f1f5f9",
    previewAccent: "#60a5fa",
  },
];

export function ColorThemePicker({ current, onChange }: ColorThemePickerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {COLOR_THEMES.map((theme) => {
        const isActive = current === theme.id;
        const Icon = theme.icon;

        return (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id)}
            className={cn(
              "relative flex flex-col text-left p-5 border rounded-2xl transition-all cursor-pointer overflow-hidden",
              isActive
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                : "border-border bg-card hover:bg-muted/30",
            )}
          >
            {/* Preview Box */}
            <div
              className="w-full h-24 rounded-lg mb-4 border border-black/10 overflow-hidden relative shadow-inner"
              style={{ backgroundColor: theme.previewBg }}
            >
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md opacity-20"
                  style={{ backgroundColor: theme.previewText }}
                ></div>
                <div
                  className="w-16 h-2 rounded-full opacity-10"
                  style={{ backgroundColor: theme.previewText }}
                ></div>
              </div>
              <div className="absolute bottom-3 left-3 w-3/4 space-y-2">
                <div
                  className="w-full h-1.5 rounded-full opacity-10"
                  style={{ backgroundColor: theme.previewText }}
                ></div>
                <div
                  className="w-2/3 h-1.5 rounded-full opacity-10"
                  style={{ backgroundColor: theme.previewText }}
                ></div>
              </div>
              <div
                className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center opacity-90 shadow-sm"
                style={{ backgroundColor: theme.previewAccent }}
              >
                <Icon size={12} className="text-primary-foreground" />
              </div>
            </div>

            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="font-extrabold text-text flex items-center gap-2">
                  <Icon
                    size={18}
                    className={isActive ? "text-primary" : "text-text-muted"}
                  />
                  {theme.name}
                </h3>
                <p className="text-xs text-text-muted font-medium mt-1">
                  {theme.description}
                </p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                  isActive ? "border-primary text-primary" : "border-muted",
                )}
              >
                {isActive && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                )}
              </div>
            </div>
            {isActive && (
              <div className="absolute -right-6 -bottom-6 opacity-5">
                <Icon size={100} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
