import React from "react";
import { Target } from "lucide-react";
import { type PlanningGoalProps } from "@/types/components/PlanningGoalProps";
import { PlanningProgressBar } from "./PlanningProgressBar";
import { usePlanningProgress } from "@/hooks/usePlanningProgress";

export function PlanningGoal({
  totalItems,
  todoItems,
  inProgressItems,
  doneItems,
  inExecutionItems,
  plannings = [],
}: PlanningGoalProps) {
  // Calculate smart progress using weighted algorithm
  const progress = usePlanningProgress(plannings);

  return (
    <div className="bg-muted/30 border border-border rounded-2xl p-6 mb-8 flex flex-col gap-6 shadow-sm">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
          <Target className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-text">Ringkasan Planning</h2>
            <span className="bg-status-in-progress/10 border border-status-in-progress/20 text-status-in-progress text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">
              Data Aktual
            </span>
          </div>
          <p className="text-sm text-text-muted max-w-2xl">
            {totalItems > 0
              ? `${totalItems} item aktif: ${todoItems} belum dimulai, ${inProgressItems} sedang berjalan, ${doneItems} selesai.`
              : "Belum ada item planning aktif untuk tim ini."}
            {inExecutionItems > 0 && (
              <span className="ml-1 text-status-done font-semibold">
                • {inExecutionItems} sudah dipromote ke Execution
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Smart Progress Bar */}
      {totalItems > 0 && (
        <div className="bg-background/50 border border-border/50 rounded-xl p-4">
          <PlanningProgressBar progress={progress} />
        </div>
      )}
    </div>
  );
}
