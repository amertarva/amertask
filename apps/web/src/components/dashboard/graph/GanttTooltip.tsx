"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Flag, Clock } from "lucide-react";
import {
  differenceInCalendarDays,
  differenceInBusinessDays,
  format,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { STATUS_CONFIG } from "./GanttView";
import type { IssueStatus } from "@/types";
import type { GanttTooltipProps } from "@/types/components/GanttTypes";

// ─── Konstanta ────────────────────────────────────────────────────────────────

const TOOLTIP_WIDTH = 340; // px
const TOOLTIP_OFFSET = 8; // jarak dari bawah bar ke atas tooltip (px)
const VIEWPORT_MARGIN = 12; // jarak minimum dari tepi viewport (px)

// ─── Komponen ────────────────────────────────────────────────────────────────

export function GanttTooltip({ data, visible }: GanttTooltipProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!data || !mounted) return null;

  const { node, barRect } = data;
  const cfg =
    STATUS_CONFIG[node.status as IssueStatus] ?? STATUS_CONFIG.backlog;

  // ── Hitung tanggal & durasi ─────────────────────────────────────────────
  const startDate = node.start_date ? new Date(node.start_date) : null;
  const endDate = node.due_date ? new Date(node.due_date) : null;

  const calendarDays =
    startDate && endDate ? differenceInCalendarDays(endDate, startDate) : null;

  const businessDays =
    startDate && endDate ? differenceInBusinessDays(endDate, startDate) : null;

  const startStr = startDate
    ? format(startDate, "d MMM yyyy", { locale: localeId })
    : "—";

  const endStr = endDate
    ? format(endDate, "d MMM yyyy", { locale: localeId })
    : "—";

  // ── Hitung progress bar ─────────────────────────────────────────────────
  const progressMap: Record<string, number> = {
    backlog: 0,
    todo: 0,
    in_progress: 50,
    in_review: 80,
    done: 100,
    cancelled: 0,
    bug: 25,
  };
  const progress = progressMap[node.status] ?? 0;

  // ── Posisi tooltip ──────────────────────────────────────────────────────
  // Tengahkan di bawah bar, tapi jangan sampai keluar dari viewport
  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 1200;

  let left = barRect.left + barRect.width / 2 - TOOLTIP_WIDTH / 2;
  // Clamp agar tidak keluar kiri/kanan
  left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, viewportWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN),
  );

  const top = barRect.bottom + TOOLTIP_OFFSET;

  // ── Arrow position (di mana panah menunjuk ke bar) ──────────────────────
  // Posisi horizontal panah relatif terhadap tooltip
  const barCenterX = barRect.left + barRect.width / 2;
  const arrowLeftInBox = Math.max(
    16,
    Math.min(barCenterX - left, TOOLTIP_WIDTH - 16),
  );

  const content = (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="gantt-tooltip"
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: `${top}px`,
            left: `${left}px`,
            width: `${TOOLTIP_WIDTH}px`,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          {/* ── Arrow (segitiga di atas tooltip) ── */}
          <div
            style={{
              position: "absolute",
              top: "-6px",
              left: `${arrowLeftInBox}px`,
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "6px solid rgba(22, 28, 25, 0.98)",
            }}
          />

          {/* ── Card ── */}
          <div
            style={{
              background: "rgba(22, 28, 25, 0.98)",
              backdropFilter: "blur(12px)",
              border: `1px solid rgba(136, 169, 155, 0.15)`,
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: `0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)`,
            }}
          >
            {/* Header: nama + status */}
            <div
              style={{
                padding: "14px 16px 10px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#64748b",
                    fontWeight: "bold",
                    marginBottom: "3px",
                    fontFamily: "monospace",
                    letterSpacing: "0.05em"
                  }}
                >
                  #{node.number}
                </div>
                <div
                  style={{
                    fontSize: "13.5px",
                    fontWeight: "700",
                    color: "#f1f5f9",
                    lineHeight: 1.4,
                    maxWidth: "200px",
                    wordBreak: "break-word",
                  }}
                >
                  {node.title}
                </div>
              </div>

              {/* Status badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: `${cfg.dotColor}12`,
                  border: `1px solid ${cfg.dotColor}30`,
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: cfg.dotColor,
                  }}
                />
                <span
                  style={{
                    fontSize: "9px",
                    color: cfg.dotColor,
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Tanggal & durasi */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
              }}
            >
              {[
                {
                  icon: <Calendar className="w-3 h-3 text-primary" />,
                  label: "Mulai",
                  value: startStr,
                },
                {
                  icon: <Flag className="w-3 h-3 text-primary" />,
                  label: "Tenggat",
                  value: endStr,
                },
                {
                  icon: <Clock className="w-3 h-3 text-primary" />,
                  label: "Durasi",
                  value: calendarDays !== null ? `${calendarDays} hari` : "—",
                  sub:
                    businessDays !== null
                      ? `${businessDays} hari kerja`
                      : undefined,
                },
              ].map((item, idx) => (
                <div
                  key={item.label}
                  style={{
                    padding: "10px 14px",
                    borderRight: idx < 2 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: "8.5px",
                      color: "#88a99b",
                      fontWeight: "bold",
                      marginBottom: "4px",
                      letterSpacing: "0.05em",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {item.icon} {item.label.toUpperCase()}
                  </div>
                  <div
                    style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: "600" }}
                  >
                    {item.value}
                  </div>
                  {item.sub && (
                    <div
                      style={{
                        fontSize: "9px",
                        color: "#475569",
                        fontWeight: "500",
                        marginTop: "2px",
                      }}
                    >
                      {item.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {progress > 0 && (
              <div
                style={{
                  padding: "10px 16px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "8.5px",
                      color: "#88a99b",
                      fontWeight: "bold",
                      letterSpacing: "0.05em",
                    }}
                  >
                    TINGKAT PENYELESAIAN
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: cfg.dotColor,
                      fontWeight: "800",
                    }}
                  >
                    {progress}%
                  </span>
                </div>
                <div
                  style={{
                    height: "5px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "9999px",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                    style={{
                      height: "100%",
                      backgroundColor: cfg.dotColor,
                      borderRadius: "9999px",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Assignee */}
            {node.assignee && (
              <div
                style={{
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: `${cfg.dotColor}15`,
                    border: `1px solid ${cfg.dotColor}35`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: cfg.dotColor,
                    flexShrink: 0,
                  }}
                >
                  {node.assignee.initials?.[0] ?? "?"}
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: "600" }}>
                    {node.assignee.name}
                  </div>
                  <div style={{ fontSize: "9px", color: "#475569", fontWeight: "bold" }}>
                    Penanggung Jawab
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                padding: "8px 16px",
                background: "rgba(0, 0, 0, 0.2)",
                borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                fontSize: "9px",
                color: "#475569",
                fontWeight: "500",
                letterSpacing: "0.02em",
              }}
            >
              Jadwal Waktu Tugas · Tahan dan geser untuk menjadwalkan ulang
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
