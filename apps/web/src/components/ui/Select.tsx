// components/ui/Select.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { SelectOption, SelectProps } from "@/types";

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  error,
  className,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          suppressHydrationWarning
          className={cn(
            "flex h-10 w-full appearance-none rounded border border-input bg-background px-3 py-2 pr-10 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-150 cursor-pointer",
            error &&
              "border-priority-urgent focus-visible:ring-priority-urgent",
            !value && "text-foreground-subtle",
            className,
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
      </div>
      {error && <p className="mt-1 text-sm text-priority-urgent">{error}</p>}
    </div>
  );
};
