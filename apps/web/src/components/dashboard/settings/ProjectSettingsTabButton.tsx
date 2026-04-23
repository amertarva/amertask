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
        "w-full flex items-center gap-2 lg:gap-4 px-4 lg:px-5 py-3 lg:py-4 rounded-full lg:rounded-[20px] transition-all text-left group overflow-hidden relative cursor-pointer border",
        active
          ? "bg-primary text-primary-foreground border-primary lg:bg-primary/5 lg:border-transparent lg:shadow-sm"
          : "bg-card border-border hover:bg-muted/50 text-text-muted hover:text-text lg:bg-transparent lg:border-transparent"
      )}
    >
      {/* Desktop-only active border */}
      {active && (
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></div>
      )}

      {/* Icon Wrapper */}
      <div
        className={cn(
          "lg:p-3 rounded-full lg:rounded-2xl transition-all shrink-0 z-10",
          active
            ? "lg:bg-primary lg:text-primary-foreground lg:shadow-lg lg:shadow-primary/20 lg:scale-105"
            : "lg:bg-card lg:border lg:border-border lg:text-text-subtle lg:group-hover:text-text lg:group-hover:shadow-sm"
        )}
      >
        <div className="[&>svg]:w-4 [&>svg]:h-4 lg:[&>svg]:w-5 lg:[&>svg]:h-5">
          {icon}
        </div>
      </div>

      <div className="z-10 whitespace-nowrap lg:whitespace-normal pr-1 lg:pr-0">
        <h4
          className={cn(
            "font-bold lg:font-extrabold text-[13px] lg:text-[16px]",
            active ? "text-primary-foreground lg:text-primary" : "text-inherit lg:text-text",
          )}
        >
          {label}
        </h4>
        <p
          className={cn(
            "hidden lg:block text-xs font-semibold mt-1",
            active ? "text-primary/70" : "text-text-muted",
          )}
        >
          {description}
        </p>
      </div>

      {active && (
        <CheckCircle2 className="hidden lg:block w-5 h-5 text-primary ml-auto opacity-40 z-10" />
      )}
    </button>
  );
}
