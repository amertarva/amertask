// components/ui/EmptyState.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import type { EmptyStateProps } from "@/types";

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-foreground-muted opacity-50">{icon}</div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-foreground-muted">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
};
