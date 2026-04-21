import React from "react";
import { cn } from "@/lib/utils";
import { StatCardProps } from "@/types";

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  isDanger,
}: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-muted rounded-xl">{icon}</div>
        {trend && (
          <span
            className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              trendUp === true
                ? "bg-status-done/10 text-status-done"
                : trendUp === false
                  ? "bg-priority-high/10 text-priority-high"
                  : "bg-muted text-text-muted",
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <div>
        <h4 className="text-3xl font-black text-text mb-1">{value}</h4>
        <p className="text-text-muted text-sm font-medium">{title}</p>
      </div>
    </div>
  );
}
