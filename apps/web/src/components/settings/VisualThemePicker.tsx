import { VisualTheme } from "@/lib/theme";
import {
  Sparkles,
  BookOpen,
  Pencil,
  GraduationCap,
  Star,
  BookCheck,
  Briefcase,
  BarChart2,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VisualThemePickerProps } from "@/types";

const VISUAL_THEMES = [
  {
    id: "default" as VisualTheme,
    name: "Default",
    description: "Tampilan bersih tanpa ornamen tambahan",
    icon: Sparkles,
    ornamentIcons: [],
    accent: "Minimalis",
  },
  {
    id: "school" as VisualTheme,
    name: "School",
    description: "Ornamen bertema belajar dan akademik",
    icon: GraduationCap,
    ornamentIcons: [BookOpen, Pencil, BookCheck, Star, GraduationCap],
    accent: "Akademik",
  },
  {
    id: "work" as VisualTheme,
    name: "Work",
    description: "Ornamen bertema pekerjaan dan produktivitas",
    icon: Briefcase,
    ornamentIcons: [Briefcase, BarChart2, Target, TrendingUp, Trophy],
    accent: "Profesional",
  },
];

export function VisualThemePicker({
  current,
  onChange,
}: VisualThemePickerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {VISUAL_THEMES.map((theme) => {
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
            <div className="flex justify-between items-start mb-3">
              <div
                className={cn(
                  "p-2.5 rounded-xl transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "bg-muted text-text-subtle",
                )}
              >
                <Icon size={22} strokeWidth={2.5} />
              </div>
              <div className="text-xs font-bold px-2 py-1 rounded border border-border bg-background/50 text-text-subtle">
                {theme.accent}
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <h3
                className={cn(
                  "font-extrabold text-[15px]",
                  isActive ? "text-primary" : "text-text",
                )}
              >
                {theme.name}
              </h3>
              <p className="text-xs text-text-muted font-medium line-clamp-2 min-h-[32px]">
                {theme.description}
              </p>
            </div>

            <div className="flex gap-1.5 mt-4 text-text-subtle opacity-40">
              {theme.ornamentIcons.slice(0, 4).map((OrnIcon, j) => (
                <OrnIcon key={j} size={14} />
              ))}
              {theme.ornamentIcons.length === 0 && (
                <div className="h-3 w-3 rounded-full border border-dashed border-text-subtle"></div>
              )}
            </div>

            <div
              className={cn(
                "absolute top-5 right-5 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                isActive ? "border-primary" : "border-border/50 hidden",
              )}
            >
              {isActive && (
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              )}
            </div>

            {/* Background Decor */}
            {isActive && theme.ornamentIcons.length > 0 && (
              <div className="absolute right-0 bottom-0 opacity-[0.03] translate-x-1/4 translate-y-1/4 pointer-events-none">
                {(() => {
                  const FirstIcon = theme.ornamentIcons[0];
                  return <FirstIcon size={120} strokeWidth={1.5} />;
                })()}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
