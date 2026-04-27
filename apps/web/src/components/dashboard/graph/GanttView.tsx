"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { schedulingApi, type GraphNode } from "@/lib/core/scheduling.api";
import { CustomGanttChart } from "./CustomGanttChart";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { RefreshCw, AlertCircle, Loader2 } from "lucide-react";

// Konfigurasi visual per status

export type IssueStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "cancelled"
  | "bug";

interface StatusConfig {
  label: string;
  color: string;
  textColor: string;
  opacity: number;
  barStyle: "solid" | "outline" | "dashed";
  showByDefault: boolean;
  dotColor: string;
}

export const STATUS_CONFIG: Record<IssueStatus, StatusConfig> = {
  backlog: {
    label: "Backlog",
    color: "#4a4a4a",
    textColor: "#999",
    opacity: 0.45,
    barStyle: "dashed",
    showByDefault: false, // Backlog hanya informasi status, tetap tampil di Gantt jika ada di planning
    dotColor: "#6b7280",
  },
  todo: {
    label: "Todo",
    color: "#3b82f6",
    textColor: "#93c5fd",
    opacity: 0.65,
    barStyle: "outline",
    showByDefault: true,
    dotColor: "#3b82f6",
  },
  in_progress: {
    label: "In Progress",
    color: "#10b981",
    textColor: "#ffffff",
    opacity: 1.0,
    barStyle: "solid",
    showByDefault: true,
    dotColor: "#10b981",
  },
  in_review: {
    label: "In Review",
    color: "#8b5cf6",
    textColor: "#ffffff",
    opacity: 1.0,
    barStyle: "solid",
    showByDefault: false, // In Review tidak ditampilkan default
    dotColor: "#8b5cf6",
  },
  done: {
    label: "Done",
    color: "#065f46",
    textColor: "#6ee7b7",
    opacity: 0.55,
    barStyle: "solid",
    showByDefault: false, // Done tidak ditampilkan default
    dotColor: "#34d399",
  },
  cancelled: {
    label: "Cancelled",
    color: "#7f1d1d",
    textColor: "#fca5a5",
    opacity: 0.35,
    barStyle: "dashed",
    showByDefault: false,
    dotColor: "#ef4444",
  },
  bug: {
    label: "Bug",
    color: "#f59e0b",
    textColor: "#fbbf24",
    opacity: 0.85,
    barStyle: "solid",
    showByDefault: false, // Bug tidak ditampilkan default
    dotColor: "#f59e0b",
  },
};

// Progress per status (untuk progress bar)
export const STATUS_PROGRESS: Record<IssueStatus, number> = {
  backlog: 0,
  todo: 0,
  in_progress: 50,
  in_review: 80,
  done: 100,
  cancelled: 0,
  bug: 25,
};

// ─── Filter Toggle Bar ────────────────────────────────────────────────────────

interface FilterToggleProps {
  activeFilters: Set<IssueStatus>;
  onToggle: (status: IssueStatus) => void;
  counts: Partial<Record<IssueStatus, number>>;
}

function StatusFilterToggle({
  activeFilters,
  onToggle,
  counts,
}: FilterToggleProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-text-muted mr-1 whitespace-nowrap">
        Tampilkan:
      </span>

      {(Object.entries(STATUS_CONFIG) as [IssueStatus, StatusConfig][]).map(
        ([status, cfg]) => {
          const isActive = activeFilters.has(status);
          const count = counts[status] ?? 0;

          return (
            <button
              key={status}
              onClick={() => onToggle(status)}
              title={`${isActive ? "Sembunyikan" : "Tampilkan"} ${cfg.label}`}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all",
                "border",
                isActive ? "border-opacity-40" : "border-border bg-transparent",
                count === 0 && "opacity-40",
              )}
              style={{
                borderColor: isActive ? cfg.dotColor : undefined,
                backgroundColor: isActive ? `${cfg.dotColor}15` : undefined,
                color: isActive ? cfg.dotColor : "#666",
              }}
            >
              {/* Dot */}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: isActive ? cfg.dotColor : "#666",
                }}
              />

              {/* Label */}
              {cfg.label}

              {/* Count badge */}
              {count > 0 && (
                <span
                  className="rounded-full px-1.5 text-[10px] font-bold min-w-[16px] text-center"
                  style={{
                    backgroundColor: isActive
                      ? `${cfg.dotColor}30`
                      : "#ffffff0a",
                    color: isActive ? cfg.dotColor : "#555",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        },
      )}
    </div>
  );
}

type ViewMode = "Day" | "Week" | "Month";

export function GanttView({ teamSlug }: { teamSlug: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [tasks, setTasks] = useState<GraphNode[]>([]);
  const [tasksWithoutDates, setTasksWithoutDates] = useState<GraphNode[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Filter state
  const [activeFilters, setActiveFilters] = useState<Set<IssueStatus>>(
    () =>
      new Set(
        (Object.entries(STATUS_CONFIG) as [IssueStatus, StatusConfig][])
          .filter(([, cfg]) => cfg.showByDefault)
          .map(([status]) => status),
      ),
  );

  // Hitung jumlah task per status (dari semua tasks, tidak peduli filter)
  const statusCounts = useMemo(() => {
    const counts: Partial<Record<IssueStatus, number>> = {};
    const allTasks = [...tasks, ...tasksWithoutDates];
    for (const task of allTasks) {
      const s = task.status as IssueStatus;
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [tasks, tasksWithoutDates]);

  // Task yang ditampilkan setelah filter (hanya yang punya tanggal)
  const filteredTasks = useMemo(
    () => tasks.filter((t) => activeFilters.has(t.status as IssueStatus)),
    [tasks, activeFilters],
  );

  const loadGantt = useCallback(async () => {
    try {
      console.log("[Gantt] Fetching data for team:", teamSlug);
      const { nodes } = await schedulingApi.getGraph(teamSlug);

      const tasksWithDates = nodes.filter((n) => n.start_date && n.due_date);
      const tasksWithoutDates = nodes.filter(
        (n) => !n.start_date || !n.due_date,
      );

      setTasks(tasksWithDates);
      setTasksWithoutDates(tasksWithoutDates);
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Gagal memuat Gantt Chart";
      console.error("[Gantt] Error:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [teamSlug]);

  useEffect(() => {
    loadGantt();
  }, [loadGantt]);

  // ─── Toggle filter ─────────────────────────────────────────────────────────

  const handleToggleFilter = useCallback((status: IssueStatus) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        // Jangan biarkan semua filter dimatikan
        if (next.size <= 1) return prev;
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  // ─── Select all / clear ────────────────────────────────────────────────────

  const handleSelectAll = useCallback(() => {
    setActiveFilters(new Set(Object.keys(STATUS_CONFIG) as IssueStatus[]));
  }, []);

  const handleClearToActive = useCallback(() => {
    setActiveFilters(new Set(["todo", "in_progress"] as IssueStatus[]));
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-text-muted space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-sm font-medium"
        >
          Memuat Timeline Projects...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 h-[500px] justify-center bg-card rounded-xl border border-border">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-text font-medium">{error}</p>
        <Button
          onClick={loadGantt}
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Coba lagi
        </Button>
      </div>
    );
  }

  if (filteredTasks.length === 0 && !isLoading && !error) {
    return (
      <div className="flex flex-col items-center gap-5 h-[500px] justify-center bg-card rounded-xl border border-border shadow-sm p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
          <AlertCircle className="w-8 h-8 text-yellow-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h3 className="text-lg font-bold text-text">
            {tasks.length === 0
              ? "Tidak ada task dengan jadwal"
              : "Tidak ada task yang cocok dengan filter aktif"}
          </h3>
          <p className="text-sm text-text-muted">
            {tasks.length === 0
              ? "Gantt Chart membutuhkan task yang memiliki tanggal mulai dan selesai. Silakan tambahkan jadwal pada fitur backlog sebelum memantau timeline di sini."
              : "Semua task dengan jadwal telah disembunyikan oleh filter. Aktifkan filter status untuk melihat task."}
          </p>
        </div>
        {tasksWithoutDates.length > 0 && (
          <div className="bg-muted/50 border border-border rounded-xl p-4 max-w-md w-full text-left mt-4">
            <p className="text-xs font-medium text-text-muted mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              {tasksWithoutDates.length} task belum dijadwalkan:
            </p>
            <div className="flex flex-wrap gap-2">
              {tasksWithoutDates.slice(0, 5).map((task) => (
                <span
                  key={task.id}
                  className="text-xs bg-card border border-border text-text px-2.5 py-1 rounded-md shadow-sm"
                >
                  #{task.number} {task.title}
                </span>
              ))}
              {tasksWithoutDates.length > 5 && (
                <span className="text-xs text-text-muted px-2 py-1">
                  +{tasksWithoutDates.length - 5} lainnya
                </span>
              )}
            </div>
          </div>
        )}
        {tasks.length > 0 && (
          <Button onClick={handleSelectAll} variant="secondary" size="sm">
            Tampilkan semua status
          </Button>
        )}
        <Button
          onClick={loadGantt}
          variant="primary"
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Segarkan Data
        </Button>
      </div>
    );
  }

  const totalFiltered = filteredTasks.length;
  const totalWithDates = tasks.length;
  const totalAll = tasks.length + tasksWithoutDates.length;

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* ─── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-card border border-border rounded-xl p-4 shadow-sm">
        {/* Info banner */}
        <div className="w-full lg:hidden mb-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            💡 Gantt Chart menampilkan task dari Planning yang sudah masuk
            Eksekusi. Status backlog hanya informasi, task tetap ditampilkan.
          </p>
        </div>

        {/* Kiri: View mode toggle + filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap w-full lg:w-auto">
          {/* Day / Week / Month toggle */}
          <div className="flex bg-muted/40 p-1 rounded-lg border border-border/50">
            {(["Day", "Week", "Month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-4 py-1.5 text-sm font-semibold rounded-md transition-all",
                  viewMode === mode
                    ? "bg-card text-text shadow-sm border border-border/50"
                    : "text-text-muted hover:text-text hover:bg-muted/60",
                )}
              >
                {mode === "Day" ? "Hari" : mode === "Week" ? "Minggu" : "Bulan"}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-border" />

          {/* Status filter toggles */}
          <StatusFilterToggle
            activeFilters={activeFilters}
            onToggle={handleToggleFilter}
            counts={statusCounts}
          />
        </div>

        {/* Kanan: shortcut + info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          {/* Shortcut buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg border border-border bg-transparent text-text-muted hover:text-text hover:bg-muted/30 text-xs font-medium transition-all"
            >
              Semua
            </button>
            <button
              onClick={handleClearToActive}
              className="px-3 py-1.5 rounded-lg border border-border bg-transparent text-text-muted hover:text-text hover:bg-muted/30 text-xs font-medium transition-all"
              title="Tampilkan hanya Todo & In Progress"
            >
              Sedang Dikerjakan
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-4 bg-border" />

          {/* Counter info */}
          <span className="text-xs text-text-muted whitespace-nowrap">
            {totalFiltered} / {totalWithDates} task terjadwal
            {totalAll - totalWithDates > 0 && (
              <span className="text-text-muted/60 ml-1">
                ({totalAll - totalWithDates} belum ada jadwal)
              </span>
            )}
          </span>

          {/* Refresh button */}
          <button
            onClick={() => {
              setLastUpdate(new Date());
              loadGantt();
            }}
            title="Refresh data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-transparent text-text-muted hover:text-text hover:bg-muted/30 text-xs font-medium transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {format(lastUpdate, "HH:mm")}
          </button>
        </div>
      </div>

      {/* ─── Empty state jika semua ter-filter ──────────────────────────── */}
      <AnimatePresence>
        {filteredTasks.length === 0 && tasks.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-[200px] bg-card rounded-xl border border-border p-6 text-center space-y-3"
          >
            <span className="text-4xl">📭</span>
            <p className="text-sm text-text-muted">
              Tidak ada task yang cocok dengan filter aktif
            </p>
            <button
              onClick={handleSelectAll}
              className="mt-2 px-4 py-2 rounded-lg border border-border bg-transparent text-text-muted hover:text-text hover:bg-muted/30 text-xs font-medium transition-all"
            >
              Tampilkan semua status
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Gantt Chart */}
      {filteredTasks.length > 0 && (
        <CustomGanttChart tasks={filteredTasks} viewMode={viewMode} />
      )}

      {/* Tasks without dates warning */}
      {tasksWithoutDates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                {tasksWithoutDates.length} task belum memiliki jadwal
              </h4>
              <p className="text-xs text-yellow-700/80 dark:text-yellow-500/80 mb-3">
                Task berikut tidak ditampilkan di Gantt Chart karena belum ada
                tanggal mulai/selesai:
              </p>
              <div className="flex flex-wrap gap-2">
                {tasksWithoutDates.slice(0, 5).map((task) => (
                  <span
                    key={task.id}
                    className="text-xs bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-2.5 py-1.5 rounded-md font-medium border border-yellow-500/20"
                  >
                    #{task.number} {task.title}
                  </span>
                ))}
                {tasksWithoutDates.length > 5 && (
                  <span className="text-xs text-yellow-700 dark:text-yellow-500 px-2 py-1.5 font-medium">
                    +{tasksWithoutDates.length - 5} lainnya
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
