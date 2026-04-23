// components/ui/Input.tsx
import React from "react";
import { cn } from "@/lib/utils";
import type { InputProps } from "@/types";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, leftIcon, rightIcon, type = "text", ...props },
    ref,
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            suppressHydrationWarning
            className={cn(
              "flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm",
              "placeholder:text-foreground-subtle",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors duration-150 cursor-pointer",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error &&
                "border-priority-urgent focus-visible:ring-priority-urgent",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-priority-urgent">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
