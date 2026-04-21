import React from "react";
import { cn } from "@/lib/utils";
import { ActivityItemProps } from "@/types";

export function ActivityItem({
  user,
  action,
  target,
  time,
  dotColor,
}: ActivityItemProps) {
  return (
    <div className="flex gap-4 relative">
      <div className="absolute top-8 left-4 bottom-[-1.25rem] w-0.5 bg-border -ml-[1px] last:hidden" />
      <div className="w-8 h-8 shrink-0 rounded-full bg-secondary/20 border border-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground z-10 relative">
        {user}
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm text-text-muted leading-tight">
          <span className="font-bold text-text">{user}</span> {action}{" "}
          <span className="font-bold text-primary cursor-pointer hover:underline">
            {target}
          </span>
        </p>
        <p className="text-xs text-text-subtle mt-1.5 flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
          {time}
        </p>
      </div>
    </div>
  );
}
