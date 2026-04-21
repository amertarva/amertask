import React from "react";
import { Target, CalendarDays } from "lucide-react";

interface PlanningGoalProps {
  totalItems: number;
  todoItems: number;
  inProgressItems: number;
  doneItems: number;
}

export function PlanningGoal({
  totalItems,
  todoItems,
  inProgressItems,
  doneItems,
}: PlanningGoalProps) {
  const completionPercent =
    totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="bg-muted/30 border border-border rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-text">Ringkasan Planning</h2>
            <span className="bg-status-in-progress/10 border border-status-in-progress/20 text-status-in-progress text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">
              Data Aktual
            </span>
          </div>
          <p className="text-sm text-text-muted max-w-2xl">
            {totalItems > 0
              ? `${totalItems} item terdaftar: ${todoItems} belum dimulai, ${inProgressItems} sedang berjalan, ${doneItems} selesai.`
              : "Belum ada item planning aktif untuk tim ini."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm font-semibold text-text-muted shrink-0 bg-background border border-border px-4 py-3 rounded-xl shadow-sm">
        <CalendarDays className="w-5 h-5 text-primary" />
        <span>Progress: {completionPercent}%</span>
      </div>
    </div>
  );
}
