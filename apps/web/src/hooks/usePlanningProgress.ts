"use client";

import { useMemo } from "react";
import {
  calculateProgress,
  type ProgressResult,
  type ProgressTask,
} from "@/lib/utils/progress.utils";

interface PlanningItem {
  id: string;
  status: string;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours?: number;
}

export function usePlanningProgress(items: PlanningItem[]): ProgressResult {
  return useMemo(() => {
    const tasks: ProgressTask[] = items.map((i) => ({
      id: i.id,
      status: i.status,
      startDate: i.startDate ?? null,
      dueDate: i.dueDate ?? null,
      estimatedHours: i.estimatedHours,
    }));
    return calculateProgress(tasks);
  }, [items]);
}
