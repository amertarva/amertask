"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { ProgressResult } from "@/lib/utils/progress.utils";

interface Props {
  progress: ProgressResult;
  className?: string;
}

// Warna progress bar berdasarkan persentase
function getProgressColor(pct: number): string {
  if (pct >= 80) return "#10b981"; // hijau — hampir selesai
  if (pct >= 50) return "#3b82f6"; // biru — sudah setengah
  if (pct >= 20) return "#f59e0b"; // kuning — baru mulai
  return "#6b7280"; // abu-abu — awal sprint
}

export function PlanningProgressBar({ progress, className = "" }: Props) {
  const color = getProgressColor(progress.percentage);
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className={className}>
      {/* ── Header: angka + label ──────────────────────────── */}
      <div className="flex items-center justify-between mb-2 gap-3">
        {/* Progress besar di kiri */}
        <div className="flex items-baseline gap-2">
          <motion.span
            key={progress.percentage}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color,
              lineHeight: 1,
            }}
          >
            {progress.percentage}%
          </motion.span>
          <span className="text-[11px] text-text-muted">progress sprint</span>
        </div>

        {/* Counter di kanan */}
        <div className="flex gap-3 shrink-0">
          {[
            {
              label: "Selesai",
              value: progress.doneTasks,
              color: "#10b981",
              show: progress.doneTasks > 0,
            },
            {
              label: "Berjalan",
              value: progress.inProgressTasks,
              color: "#3b82f6",
              show: progress.inProgressTasks > 0,
            },
            {
              label: "Review",
              value: progress.inReviewTasks,
              color: "#8b5cf6",
              show: progress.inReviewTasks > 0,
            },
            {
              label: "Belum mulai",
              value: progress.todoTasks,
              color: "#6b7280",
              show: progress.todoTasks > 0,
            },
          ]
            .filter((item) => item.show)
            .map((item) => (
              <div key={item.label} className="text-center">
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: item.color,
                    lineHeight: 1,
                  }}
                >
                  {item.value}
                </div>
                <div className="text-[9px] text-text-muted/70 mt-0.5 whitespace-nowrap">
                  {item.label}
                </div>
              </div>
            ))}
          <div className="text-center">
            <div className="text-base font-bold text-text-muted leading-none">
              {progress.totalTasks}
            </div>
            <div className="text-[9px] text-text-muted/70 mt-0.5">Total</div>
          </div>
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden relative">
        {/* Animated weighted progress */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${color}dd, ${color})`,
            borderRadius: "9999px",
            boxShadow: `0 0 8px ${color}44`,
          }}
        />
      </div>

      {/* ── Method hint + breakdown toggle ────────────────────────────────────── */}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <div className="text-[9px] text-text-muted/60 flex items-center gap-1.5">
          <span>
            {progress.method === "weighted"
              ? "⚖ Dihitung berdasarkan durasi × status task"
              : "∑ Dihitung berdasarkan status task"}
          </span>
          {progress.cancelledTasks > 0 && (
            <span>
              · {progress.cancelledTasks} task dibatalkan (tidak dihitung)
            </span>
          )}
        </div>

        {/* Breakdown toggle button */}
        {progress.breakdown.length > 0 && (
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-[9px] text-primary/70 hover:text-primary transition-colors underline"
          >
            {showBreakdown ? "Sembunyikan detail" : "Lihat breakdown"}
          </button>
        )}
      </div>

      {/* ── Breakdown detail (collapsible) ────────────────────────────────────── */}
      {showBreakdown && progress.breakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3 pt-3 border-t border-border/50"
        >
          <div className="text-[10px] font-semibold text-text-muted mb-2">
            Kontribusi per Task:
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {progress.breakdown
              .sort((a, b) => b.contribution - a.contribution)
              .map((item) => (
                <div
                  key={item.taskId}
                  className="flex items-center justify-between text-[9px] text-text-muted/80 bg-muted/30 rounded px-2 py-1"
                >
                  <span className="truncate flex-1">
                    Task {item.taskId.slice(0, 8)}...
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-text-muted/60">
                      {item.durationDays}d
                    </span>
                    <span className="text-text-muted/60">×</span>
                    <span className="text-text-muted/60">{item.weight}%</span>
                    <span className="text-text-muted/60">=</span>
                    <span className="font-semibold text-primary">
                      {item.contribution.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
