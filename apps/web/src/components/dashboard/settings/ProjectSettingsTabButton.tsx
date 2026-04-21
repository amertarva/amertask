import { type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ProjectSettingsTabButtonProps = {
  icon: ReactNode;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
};

export function ProjectSettingsTabButton({
  icon,
  label,
  description,
  active,
  onClick,
}: ProjectSettingsTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all text-left group overflow-hidden relative cursor-pointer",
        active
          ? "bg-primary/5 border-transparent shadow-sm"
          : "bg-transparent border-transparent hover:bg-muted/50",
      )}
    >
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></div>
      )}

      <div
        className={cn(
          "p-3 rounded-2xl transition-all shrink-0 z-10",
          active
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
            : "bg-card border border-border text-text-subtle group-hover:text-text group-hover:shadow-sm",
        )}
      >
        {icon}
      </div>

      <div className="z-10">
        <h4
          className={cn(
            "font-extrabold text-[16px]",
            active ? "text-primary" : "text-text",
          )}
        >
          {label}
        </h4>
        <p
          className={cn(
            "text-xs font-semibold mt-1",
            active ? "text-primary/70" : "text-text-muted",
          )}
        >
          {description}
        </p>
      </div>

      {active && (
        <CheckCircle2 className="w-5 h-5 text-primary ml-auto opacity-40 z-10" />
      )}
    </button>
  );
}
