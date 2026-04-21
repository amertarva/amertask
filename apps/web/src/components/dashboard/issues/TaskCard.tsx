import React from "react";
import { cn } from "@/lib/utils";
import { TaskCardProps } from "@/types";

export function TaskCard({
  id,
  title,
  tag,
  tagColor,
  priority,
  avatar,
  avatarColor,
}: TaskCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-text-muted">{id}</span>
        <span
          className={cn(
            "text-[9px] font-extrabold px-2 py-0.5 rounded tracking-widest",
            tagColor,
          )}
        >
          {tag}
        </span>
      </div>

      <h3 className="font-bold text-text mb-6 text-sm">{title}</h3>

      <div className="flex justify-between items-end border-t border-border pt-3">
        <div
          className={cn("w-2.5 h-2.5 rounded-full shadow-sm", priority)}
        ></div>
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm ring-2 ring-background",
            avatarColor,
          )}
        >
          {avatar}
        </div>
      </div>
    </div>
  );
}
