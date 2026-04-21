// components/ui/Badge.tsx
import React from "react";
import { cn } from "@/lib/utils";
import type { IssueStatus, IssuePriority, IssueLabel } from "@/types";
import { STATUS_CONFIG, PRIORITY_CONFIG, LABEL_COLORS } from "@/lib/constants";
import type { BadgeProps } from "@/types";

export const Badge: React.FC<BadgeProps> = ({
  variant,
  value,
  showIcon = true,
  className,
}) => {
  if (variant === "status") {
    const config = STATUS_CONFIG[value as IssueStatus];
    const Icon = config.icon;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          `bg-${config.color}/10 text-${config.color}`,
          className,
        )}
        style={{
          backgroundColor: `hsl(var(--${config.color}) / 0.1)`,
          color: `hsl(var(--${config.color}))`,
        }}
      >
        {showIcon && <Icon className="h-3 w-3" />}
        {config.label}
      </span>
    );
  }

  if (variant === "priority") {
    const config = PRIORITY_CONFIG[value as IssuePriority];
    const Icon = config.icon;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          className,
        )}
        style={{
          backgroundColor: `hsl(var(--${config.color}) / 0.1)`,
          color: `hsl(var(--${config.color}))`,
        }}
      >
        {showIcon && <Icon className="h-3 w-3" />}
        {config.label}
      </span>
    );
  }

  // Label variant
  const labelValue = value as IssueLabel;
  const color = LABEL_COLORS[labelValue] || "#6b7280";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        className,
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
      }}
    >
      {labelValue}
    </span>
  );
};
