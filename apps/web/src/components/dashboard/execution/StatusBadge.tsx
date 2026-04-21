import React from "react";
import { CheckCircle2, PlayCircle, AlertCircle } from "lucide-react";
import { StatusBadgeProps } from "@/types";

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "SELESAI":
      return (
        <span className="flex items-center gap-1.5 w-fit bg-status-done/15 text-status-done border border-status-done/30 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest">
          <CheckCircle2 className="w-3 h-3" /> SELESAI
        </span>
      );
    case "PROSES":
      return (
        <span className="flex items-center gap-1.5 w-fit bg-status-in-progress/15 text-status-in-progress border border-status-in-progress/30 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest">
          <PlayCircle className="w-3 h-3" /> PROSES
        </span>
      );
    case "TERKENDALA":
      return (
        <span className="flex items-center gap-1.5 w-fit bg-priority-high/15 text-priority-high border border-priority-high/30 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest animate-pulse">
          <AlertCircle className="w-3 h-3" /> BLOCKED
        </span>
      );
    default:
      return (
        <span className="bg-muted text-text-muted px-2 py-0.5 rounded-md text-[10px] font-bold">
          UNKNOWN
        </span>
      );
  }
}
