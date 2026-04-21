// components/ui/Textarea.tsx
import React from "react";
import { cn } from "@/lib/utils";
import type { TextareaProps } from "@/types";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          suppressHydrationWarning
          className={cn(
            "flex min-h-[80px] w-full rounded border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-foreground-subtle",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-150",
            error &&
              "border-priority-urgent focus-visible:ring-priority-urgent",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-priority-urgent">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
