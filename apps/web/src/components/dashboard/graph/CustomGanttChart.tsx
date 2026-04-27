"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { GanttTooltip, type TooltipData } from "./GanttTooltip";
import {
  format,
  differenceInDays,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { GraphNode } from "@/lib/core/scheduling.api";
import { type CustomGanttChartProps } from "@/types/components/CustomGanttChartProps";

const STATUS_COLORS: Record<string, string> = {
  backlog: "#6b7280",
  todo: "#3b82f6",
  in_progress: "#10b981",
  in_review: "#8b5cf6",
  done: "#059669",
  cancelled: "#ef4444",
  bug: "#f59e0b",
};

export function CustomGanttChart({ tasks, viewMode }: CustomGanttChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, task: GraphNode) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ node: task, barRect: rect });
    setTooltipVisible(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setTooltipVisible(false);
      setTimeout(() => setTooltip(null), 200);
    }, 80);
  };

  const { timelineStart, timelineEnd, timelineUnits, taskRows } =
    useMemo(() => {
      if (tasks.length === 0) {
        return {
          timelineStart: new Date(),
          timelineEnd: new Date(),
          timelineUnits: [],
          taskRows: [],
        };
      }

      // Find min and max dates
      const dates = tasks
        .flatMap((t) => [
          t.start_date ? new Date(t.start_date) : null,
          t.due_date ? new Date(t.due_date) : null,
        ])
        .filter(Boolean) as Date[];

      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

      // Add padding based on view mode
      let start: Date, end: Date;

      if (viewMode === "Month") {
        start = startOfMonth(addDays(minDate, -30));
        end = endOfMonth(addDays(maxDate, 30));
      } else if (viewMode === "Week") {
        start = startOfWeek(addDays(minDate, -14), { weekStartsOn: 1 });
        end = endOfWeek(addDays(maxDate, 14), { weekStartsOn: 1 });
      } else {
        start = startOfWeek(addDays(minDate, -7), { weekStartsOn: 1 });
        end = endOfWeek(addDays(maxDate, 7), { weekStartsOn: 1 });
      }

      // Generate timeline units based on view mode
      let units: { label: string; date: Date; isToday?: boolean }[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (viewMode === "Month") {
        const months = eachMonthOfInterval({ start, end });
        units = months.map((date) => ({
          label: format(date, "MMM yyyy", { locale: localeId }),
          date,
          isToday:
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear(),
        }));
      } else if (viewMode === "Week") {
        const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        units = weeks.map((date) => {
          const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
          return {
            label: `${format(date, "d MMM", { locale: localeId })} - ${format(weekEnd, "d MMM", { locale: localeId })}`,
            date,
            isToday: today >= date && today <= weekEnd,
          };
        });
      } else {
        // Day view
        const days = eachDayOfInterval({ start, end });
        units = days.map((date) => ({
          label: format(date, "EEE d", { locale: localeId }),
          date,
          isToday: date.getTime() === today.getTime(),
        }));
      }

      // Calculate task positions
      const totalDays = differenceInDays(end, start) + 1;
      const rows = tasks
        .map((task) => {
          if (!task.start_date || !task.due_date) return null;

          const taskStart = new Date(task.start_date);
          const taskEnd = new Date(task.due_date);
          const startOffset = differenceInDays(taskStart, start);
          const duration = differenceInDays(taskEnd, taskStart) + 1;

          // Calculate progress percentage
          let progress = 0;
          if (task.status === "done") progress = 100;
          else if (task.status === "in_review") progress = 75;
          else if (task.status === "in_progress") progress = 50;

          return {
            task,
            left: Math.max(0, (startOffset / totalDays) * 100),
            width: Math.max(1, (duration / totalDays) * 100),
            progress,
          };
        })
        .filter(Boolean);

      return {
        timelineStart: start,
        timelineEnd: end,
        timelineUnits: units,
        taskRows: rows as {
          task: GraphNode;
          left: number;
          width: number;
          progress: number;
        }[],
      };
    }, [tasks, viewMode]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted text-sm bg-card border border-border rounded-xl shadow-sm">
        Tidak ada task dengan jadwal
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
      {/* Timeline Header */}
      <div className="flex border-b border-border sticky top-0 bg-muted/30 z-10">
        {/* Task names column */}
        <div className="w-72 shrink-0 border-r border-border p-3 flex items-center">
          <div className="font-semibold text-text text-sm">Task</div>
        </div>

        {/* Timeline units */}
        <div className="flex-1 flex overflow-x-auto">
          {timelineUnits.map((unit, i) => (
            <div
              key={i}
              className={`flex-1 min-w-[80px] p-2 text-center border-r border-border/50 last:border-r-0 ${
                unit.isToday ? "bg-primary/5" : ""
              }`}
            >
              <div
                className={`text-[11px] font-semibold ${unit.isToday ? "text-primary" : "text-text-muted"}`}
              >
                {unit.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task rows */}
      <div className="relative overflow-x-auto">
        {taskRows.map((row) => (
          <div
            key={row.task.id}
            className="flex border-b border-border/50 hover:bg-muted/30 transition-colors group"
          >
            {/* Task name */}
            <div className="w-72 shrink-0 p-3 border-r border-border flex flex-col justify-center bg-card group-hover:bg-muted/30 transition-colors relative z-10">
              <div className="text-sm text-text font-semibold truncate flex items-center gap-1.5">
                <span className="text-text-muted font-normal text-xs">
                  #{row.task.number}
                </span>
                <span className="truncate">{row.task.title}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                {/* Assignee */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {row.task.assignee?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <span className="text-xs text-text-muted truncate">
                    {row.task.assignee?.name || "Unassigned"}
                  </span>
                </div>
                {/* Status Badge */}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap ml-auto shrink-0"
                  style={{
                    backgroundColor: `${STATUS_COLORS[row.task.status]}15`,
                    color: STATUS_COLORS[row.task.status],
                    borderColor: `${STATUS_COLORS[row.task.status]}30`,
                  }}
                >
                  {row.task.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Timeline area */}
            <div className="flex-1 relative h-16 p-2">
              {/* Grid lines */}
              <div className="absolute inset-0 flex">
                {timelineUnits.map((unit, i) => (
                  <div
                    key={i}
                    className={`flex-1 min-w-[80px] border-r border-border/30 last:border-r-0 ${
                      unit.isToday ? "bg-primary/5" : ""
                    }`}
                  />
                ))}
              </div>

              {/* Task bar */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md shadow-sm cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-offset-card hover:z-20 transition-all group/bar overflow-visible"
                style={{
                  left: `${row.left}%`,
                  width: `${row.width}%`,
                  backgroundColor: STATUS_COLORS[row.task.status] || "#6b7280",
                  minWidth: "40px",
                }}
                onMouseEnter={(e) => handleMouseEnter(e, row.task)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Progress bar */}
                {row.progress > 0 && row.progress < 100 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-white/20"
                    style={{ width: `${row.progress}%` }}
                  />
                )}

                {/* Task label */}
                <div className="relative h-full flex items-center px-2.5 overflow-hidden">
                  <div className="text-[11px] font-medium text-white/95 truncate drop-shadow-sm">
                    {row.task.title}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="border-t border-border p-3 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-text-muted">
            Total: {taskRows.length} task
          </div>
          <div className="flex flex-wrap gap-4">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] font-medium text-text-muted capitalize">
                  {status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GanttTooltip data={tooltip} visible={tooltipVisible} />
    </div>
  );
}
