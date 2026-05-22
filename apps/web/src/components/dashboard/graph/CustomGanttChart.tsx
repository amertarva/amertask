"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { GanttTooltip } from "./GanttTooltip";
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
import type { TooltipData } from "@/types/components/GanttTypes";

const STATUS_COLORS: Record<string, string> = {
  backlog: "#64748b", // slate gray
  todo: "#4f46e5", // indigo
  in_progress: "#f59e0b", // amber
  in_review: "#8b5cf6", // purple
  done: "#10b981", // emerald/sage
  cancelled: "#475569", // dark slate
  bug: "#ef4444", // red
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

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const rowsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headerScrollRef.current;
    const rows = rowsScrollRef.current;
    if (!header || !rows) return;

    let isSyncingHeader = false;
    let isSyncingRows = false;

    const handleHeaderScroll = () => {
      if (isSyncingRows) {
        isSyncingRows = false;
        return;
      }
      isSyncingHeader = true;
      rows.scrollLeft = header.scrollLeft;
    };

    const handleRowsScroll = () => {
      if (isSyncingHeader) {
        isSyncingHeader = false;
        return;
      }
      isSyncingRows = true;
      header.scrollLeft = rows.scrollLeft;
    };

    header.addEventListener("scroll", handleHeaderScroll);
    rows.addEventListener("scroll", handleRowsScroll);

    return () => {
      header.removeEventListener("scroll", handleHeaderScroll);
      rows.removeEventListener("scroll", handleRowsScroll);
    };
  }, []);

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    task: GraphNode,
  ) => {
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

  const columnWidth = useMemo(() => {
    return viewMode === "Month" ? 220 : viewMode === "Week" ? 160 : 100;
  }, [viewMode]);

  const totalWidth = useMemo(() => {
    return timelineUnits.length * columnWidth;
  }, [timelineUnits.length, columnWidth]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayOffsetPercent = useMemo(() => {
    if (today < timelineStart || today > timelineEnd) return null;
    const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
    const daysFromStart = differenceInDays(today, timelineStart);
    return (daysFromStart / totalDays) * 100;
  }, [timelineStart, timelineEnd, today]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-subtle text-sm bg-card/40 border border-border/60 rounded-xl shadow-inner animate-fade-in">
        Tidak ada task dengan jadwal
      </div>
    );
  }

  return (
    <div className="bg-card/40 rounded-xl border border-border/60 shadow-lg flex flex-col overflow-hidden animate-fade-in h-full">
      {/* Timeline Header */}
      <div className="flex border-b border-border/60 sticky top-0 bg-card/90 backdrop-blur-sm z-30">
        {/* Task names column */}
        <div 
          className="w-72 shrink-0 border-r border-border/60 p-4 flex items-center sticky left-0 z-40"
          style={{ backgroundColor: "hsl(var(--background-secondary))" }}
        >
          <div className="font-bold text-text text-xs tracking-wider uppercase">Nama Tugas</div>
        </div>

        {/* Timeline units */}
        <div ref={headerScrollRef} className="flex-1 overflow-x-hidden">
          <div className="flex" style={{ width: totalWidth }}>
            {timelineUnits.map((unit, i) => (
              <div
                key={i}
                className={`p-3 text-center border-r border-border/30 last:border-r-0 flex flex-col justify-center transition-colors shrink-0 relative ${
                  unit.isToday ? "bg-primary/[0.04]" : ""
                }`}
                style={{ width: columnWidth, minWidth: columnWidth }}
              >
                <div
                  className={`text-[11px] font-bold tracking-wide ${unit.isToday ? "text-primary font-extrabold" : "text-text-subtle"}`}
                >
                  {unit.label}
                </div>
                {unit.isToday && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task rows */}
      <div ref={rowsScrollRef} className="relative overflow-auto flex-1 custom-scrollbar min-h-0">
        {taskRows.map((row) => (
          <div
            key={row.task.id}
            className="flex w-fit min-w-full border-b border-border/30 last:border-b-0 hover:bg-muted/10 transition-colors group relative"
          >
            {/* Task name (sticky) */}
            <div 
              className="w-72 shrink-0 p-4 border-r border-border/60 flex flex-col justify-center sticky left-0 z-20 transition-colors group-hover:bg-[#232a27]"
              style={{ backgroundColor: "hsl(var(--background-secondary))" }}
            >
              <div className="text-sm text-text font-bold truncate flex items-center gap-2">
                <span className="text-text-subtle/70 font-mono text-[10px] bg-muted/30 px-1.5 py-0.5 rounded">
                  #{row.task.number}
                </span>
                <span className="truncate group-hover:text-primary transition-colors">{row.task.title}</span>
              </div>
              <div className="flex items-center gap-2.5 mt-2">
                {/* Assignee */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5.5 h-5.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {row.task.assignee?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <span className="text-xs text-text-subtle truncate font-medium">
                    {row.task.assignee?.name || "Unassigned"}
                  </span>
                </div>
                {/* Status Badge */}
                <span
                  className="text-[9px] px-2 py-0.5 rounded font-bold tracking-wide uppercase border whitespace-nowrap ml-auto shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: `${STATUS_COLORS[row.task.status]}10`,
                    color: STATUS_COLORS[row.task.status],
                    borderColor: `${STATUS_COLORS[row.task.status]}30`,
                  }}
                >
                  {row.task.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Timeline area */}
            <div className="relative z-10 h-18 p-3 shrink-0" style={{ width: totalWidth }}>
              {/* Grid lines */}
              <div className="absolute inset-y-0 left-0 right-0 flex pointer-events-none">
                {timelineUnits.map((unit, i) => (
                  <div
                    key={i}
                    className={`h-full border-r border-border/20 last:border-r-0 shrink-0 ${
                      unit.isToday ? "bg-primary/[0.02]" : ""
                    }`}
                    style={{ width: columnWidth, minWidth: columnWidth }}
                  />
                ))}
              </div>

              {/* Today Vertical Line */}
              {todayOffsetPercent !== null && (
                <div
                  className="absolute inset-y-0 w-[1.5px] bg-primary/40 z-10 pointer-events-none"
                  style={{ left: `${todayOffsetPercent}%` }}
                />
              )}

              {/* Task bar */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-7 rounded-full cursor-pointer hover:z-20 transition-all duration-300 group/bar overflow-visible border border-white/10 hover:border-white/30"
                style={{
                  left: `${row.left}%`,
                  width: `${row.width}%`,
                  backgroundColor: STATUS_COLORS[row.task.status] || "#64748b",
                  minWidth: "40px",
                  boxShadow: "none",
                }}
                onMouseEnter={(e) => handleMouseEnter(e, row.task)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Progress bar inside bar */}
                {row.progress > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-white/10 backdrop-blur-[0.5px] rounded-full transition-all duration-500"
                    style={{ width: `${row.progress}%` }}
                  />
                )}

                {/* Task label */}
                <div className="relative h-full flex items-center px-3.5 overflow-hidden">
                  <span className="text-[10px] font-bold text-white tracking-wide truncate">
                    {row.task.title}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="border-t border-border/60 p-4 bg-card/80">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-bold text-text-subtle tracking-wide">
            Total Proyek: {taskRows.length} Tugas Terjadwal
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full border shadow-sm shrink-0"
                  style={{ 
                    backgroundColor: color, 
                    borderColor: `${color}30`,
                  }}
                />
                <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider">
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
