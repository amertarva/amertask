"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { schedulingApi, type GraphNode } from "@/lib/core/scheduling.api";
import { format as formatFns } from "date-fns";
import { CustomGanttChart } from "./CustomGanttChart";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  AlertCircle,
  Loader2,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { toPng, toJpeg } from "html-to-image";
import type { IssueStatus } from "@/types";
import type {
  FilterToggleProps,
  StatusConfig,
} from "@/types/components/GanttTypes";

// Konfigurasi visual per status

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

// Filter Toggle Bar

function StatusFilterToggle({
  activeFilters,
  onToggle,
  counts,
}: FilterToggleProps) {
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <span className="text-[11px] font-semibold tracking-wider text-text-subtle uppercase mr-1 whitespace-nowrap">
        Filter Status:
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
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer select-none",
                "border shadow-sm",
                isActive 
                  ? "bg-card border-primary/20 text-text" 
                  : "bg-muted/10 border-border/40 text-text-subtle hover:text-text hover:bg-muted/20 hover:border-border/80",
                count === 0 && !isActive && "opacity-40 hover:opacity-70",
              )}
            >
              {/* Dot */}
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200",
                  isActive ? "scale-110" : "scale-100"
                )}
                style={{
                  backgroundColor: cfg.dotColor,
                }}
              />

              {/* Label */}
              <span className="tracking-wide">{cfg.label}</span>

              {/* Count badge */}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-bold min-w-[16px] text-center transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/40 text-text-subtle"
                  )}
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

  // Toggle filter

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

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(
    async (format: "png" | "jpg") => {
      const node = document.getElementById("gantt-capture-area");
      if (!node) return;

      try {
        setIsExporting(true);
        // Wait a bit to ensure UI is ready (if any loading states exist)
        await new Promise((resolve) => setTimeout(resolve, 100));

        const getThemeColor = () => {
          // Get current background color of the document body or card
          const cardBg = window.getComputedStyle(document.body).backgroundColor;
          return cardBg || "#ffffff";
        };

        const options = {
          backgroundColor: getThemeColor(),
          pixelRatio: 2, // Higher resolution
          style: {
            margin: "0",
            padding: "16px",
            borderRadius: "8px",
          },
        };

        const dataUrl = await (format === "png"
          ? toPng(node, options)
          : toJpeg(node, { ...options, quality: 0.95 }));

        const link = document.createElement("a");
        const dateStr = formatFns(new Date(), "yyyy-MM-dd-HHmm");
        link.download = `gantt-chart-${teamSlug}-${dateStr}.${format}`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to export Gantt Chart:", err);
        alert("Gagal mengekspor Gantt Chart. Silakan coba lagi.");
      } finally {
        setIsExporting(false);
      }
    },
    [teamSlug],
  );

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
    <div className="space-y-6 flex flex-col h-full overflow-hidden pr-2 custom-scrollbar animate-fade-in">
      {/* ─── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl p-5 shadow-lg shadow-black/20">
        {/* Info banner */}
        <div className="w-full xl:hidden mb-1 px-4 py-2.5 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-xs text-text-muted flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            Gantt Chart menampilkan task dari Planning yang sudah masuk Eksekusi.
          </p>
        </div>

        {/* Kiri: View mode toggle + filter */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 flex-wrap w-full xl:w-auto">
          {/* Day / Week / Month toggle */}
          <div className="flex bg-muted/20 p-1 rounded-lg border border-border/40 shadow-inner">
            {(["Day", "Week", "Month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer select-none",
                  viewMode === mode
                    ? "bg-card text-text shadow-md border border-border/50"
                    : "text-text-subtle hover:text-text hover:bg-muted/30",
                )}
              >
                {mode === "Day" ? "Hari" : mode === "Week" ? "Minggu" : "Bulan"}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-border/40" />

          {/* Status filter toggles */}
          <StatusFilterToggle
            activeFilters={activeFilters}
            onToggle={handleToggleFilter}
            counts={statusCounts}
          />
        </div>

        {/* Kanan: shortcut + info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto shrink-0">
          {/* Shortcut buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg border border-border/50 bg-muted/10 text-text-subtle hover:text-text hover:bg-muted/20 hover:border-border text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              Semua
            </button>
            <button
              onClick={handleClearToActive}
              className="px-3 py-1.5 rounded-lg border border-border/50 bg-muted/10 text-text-subtle hover:text-text hover:bg-muted/20 hover:border-border text-xs font-semibold transition-all duration-200 cursor-pointer"
              title="Tampilkan hanya Todo & In Progress"
            >
              Sedang Dikerjakan
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-4 bg-border/40" />

          {/* Counter info */}
          <span className="text-xs text-text-subtle whitespace-nowrap font-medium">
            <strong className="text-text font-semibold">{totalFiltered}</strong> / {totalWithDates} task terjadwal
            {totalAll - totalWithDates > 0 && (
              <span className="text-text-subtle/50 ml-1">
                ({totalAll - totalWithDates} draf)
              </span>
            )}
          </span>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("png")}
              disabled={isExporting || filteredTasks.length === 0}
              title="Download sebagai PNG"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/5 text-text-subtle hover:text-text hover:bg-muted/20 hover:border-border text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              PNG
            </button>
            <button
              onClick={() => handleExport("jpg")}
              disabled={isExporting || filteredTasks.length === 0}
              title="Download sebagai JPG"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/5 text-text-subtle hover:text-text hover:bg-muted/20 hover:border-border text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              JPG
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => {
              setLastUpdate(new Date());
              loadGantt();
            }}
            title="Refresh data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/5 text-text-subtle hover:text-text hover:bg-muted/20 hover:border-border text-xs font-semibold transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {formatFns(lastUpdate, "HH:mm")}
          </button>
        </div>
      </div>

      {/* ─── Empty state jika semua ter-filter ──────────────────────────── */}
      <AnimatePresence>
        {filteredTasks.length === 0 && tasks.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center min-h-[300px] bg-card/40 border border-border/60 rounded-xl p-8 text-center space-y-4 shadow-lg"
          >
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center border border-border/40 text-2xl shadow-inner">
              📭
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="text-base font-semibold text-text">Semua task disembunyikan</h4>
              <p className="text-xs text-text-subtle">
                Sesuaikan filter status Anda di atas untuk menampilkan kembali jadwal tugas pada timeline.
              </p>
            </div>
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all duration-200 cursor-pointer"
            >
              Aktifkan Semua Status
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Gantt Chart */}
      {filteredTasks.length > 0 && (
        <div id="gantt-capture-area" className="bg-card/30 border border-border/60 rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col min-h-0">
          <CustomGanttChart tasks={filteredTasks} viewMode={viewMode} />
        </div>
      )}

      {/* Tasks without dates warning */}
      {tasksWithoutDates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/[0.03] border border-yellow-500/20 rounded-xl p-5 shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-text mb-1">
                {tasksWithoutDates.length} Task Belum Memiliki Jadwal Waktu
              </h4>
              <p className="text-xs text-text-subtle mb-4 max-w-2xl leading-relaxed">
                Tugas di bawah ini terdaftar dalam rencana eksekusi tim tetapi tidak dapat dipetakan ke dalam timeline karena tidak memiliki tanggal mulai dan tenggat waktu.
              </p>
              <div className="flex flex-wrap gap-2">
                {tasksWithoutDates.slice(0, 5).map((task) => (
                  <span
                    key={task.id}
                    className="text-[11px] bg-card/80 text-text border border-border/80 px-2.5 py-1.5 rounded-lg font-medium shadow-sm transition-colors hover:border-border hover:bg-card"
                  >
                    <span className="text-text-subtle font-mono mr-1">#{task.number}</span>
                    {task.title}
                  </span>
                ))}
                {tasksWithoutDates.length > 5 && (
                  <span className="text-xs text-text-subtle bg-muted/10 border border-border/40 px-2.5 py-1.5 rounded-lg font-semibold flex items-center">
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
