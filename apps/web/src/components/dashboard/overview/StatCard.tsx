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
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between">
      <div className="flex flex-col xl:flex-row justify-between items-start mb-3 sm:mb-4 gap-2">
        <div className="p-2.5 sm:p-3 bg-muted rounded-xl w-max [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              "text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap",
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
        <h4 className="text-2xl sm:text-3xl font-black text-text mb-0.5 sm:mb-1">{value}</h4>
        <p className="text-text-muted text-[11px] sm:text-sm font-medium leading-tight">{title}</p>
      </div>
    </div>
  );
}
