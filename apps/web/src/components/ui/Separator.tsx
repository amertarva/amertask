// components/ui/Separator.tsx
import React from "react";
import { cn } from "@/lib/utils";
import type { SeparatorProps } from "@/types";

export const Separator: React.FC<SeparatorProps> = ({
  orientation = "horizontal",
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  );
};
