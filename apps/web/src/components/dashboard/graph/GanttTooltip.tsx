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
import type { GraphNode } from "@/lib/core/scheduling.api";
import { STATUS_CONFIG, type IssueStatus } from "./GanttView";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TooltipData {
  node: GraphNode;
  // Posisi bar dalam viewport (dari getBoundingClientRect)
  barRect: {
    left: number;
    right: number;
    bottom: number;
    width: number;
    top: number;
  };
}

interface Props {
  data: TooltipData | null;
  visible: boolean;
}

// ─── Konstanta ────────────────────────────────────────────────────────────────

const TOOLTIP_WIDTH = 340; // px
const TOOLTIP_OFFSET = 8; // jarak dari bawah bar ke atas tooltip (px)
const VIEWPORT_MARGIN = 12; // jarak minimum dari tepi viewport (px)

// ─── Komponen ────────────────────────────────────────────────────────────────

export function GanttTooltip({ data, visible }: Props) {
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
    Math.min(left, viewportWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN)
  );

  const top = barRect.bottom + TOOLTIP_OFFSET;

  // ── Arrow position (di mana panah menunjuk ke bar) ──────────────────────
  // Posisi horizontal panah relatif terhadap tooltip
  const barCenterX = barRect.left + barRect.width / 2;
  const arrowLeftInBox = Math.max(
    16,
    Math.min(barCenterX - left, TOOLTIP_WIDTH - 16)
  );

  const content = (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="gantt-tooltip"
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: `${top}px`,
            left: `${left}px`,
            width: `${TOOLTIP_WIDTH}px`,
            zIndex: 9999,
            pointerEvents: "none", // tidak ganggu mouse event
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
              borderBottom: "6px solid #1e1e1e",
            }}
          />

          {/* ── Card ── */}
          <div
            style={{
              background: "#111",
              border: `1px solid ${cfg.dotColor}33`,
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: `0 8px 32px #00000088, 0 0 0 1px #ffffff08`,
            }}
          >
            {/* Header: nama + status */}
            <div
              style={{
                padding: "10px 14px 8px",
                borderBottom: "1px solid #1a1a1a",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#444",
                    marginBottom: "2px",
                    fontFamily: "monospace",
                  }}
                >
                  #{node.number}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#e8e8e8",
                    lineHeight: 1.3,
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
                  gap: "5px",
                  padding: "3px 8px",
                  borderRadius: "20px",
                  background: `${cfg.dotColor}18`,
                  border: `1px solid ${cfg.dotColor}44`,
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
                    fontSize: "10px",
                    color: cfg.dotColor,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
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
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              {[
                { icon: <Calendar className="w-3 h-3" />, label: "Tanggal Mulai", value: startStr },
                { icon: <Flag className="w-3 h-3" />, label: "Tenggat Waktu", value: endStr },
                {
                  icon: <Clock className="w-3 h-3" />,
                  label: "Estimasi Waktu",
                  value: calendarDays !== null ? `${calendarDays} hari` : "—",
                  sub:
                    businessDays !== null
                      ? `${businessDays} hari kerja`
                      : undefined,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "8px 12px",
                    borderRight: "1px solid #1a1a1a",
                  }}
                >
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#444",
                      marginBottom: "3px",
                      letterSpacing: "0.05em",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {item.icon} {item.label.toUpperCase()}
                  </div>
                  <div
                    style={{ fontSize: "11px", color: "#ccc", fontWeight: 600 }}
                  >
                    {item.value}
                  </div>
                  {item.sub && (
                    <div
                      style={{
                        fontSize: "9px",
                        color: "#444",
                        marginTop: "1px",
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
                  padding: "8px 14px",
                  borderBottom: "1px solid #1a1a1a",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "5px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#444",
                      letterSpacing: "0.05em",
                    }}
                  >
                    TINGKAT PENYELESAIAN
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: cfg.dotColor,
                      fontWeight: 700,
                    }}
                  >
                    {progress}%
                  </span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: "#1a1a1a",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                    style={{
                      height: "100%",
                      background: `linear-gradient(90deg, ${cfg.color}aa, ${cfg.dotColor})`,
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Assignee */}
            {node.assignee && (
              <div
                style={{
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: `${cfg.dotColor}22`,
                    border: `1px solid ${cfg.dotColor}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: 700,
                    color: cfg.dotColor,
                    flexShrink: 0,
                  }}
                >
                  {node.assignee.initials?.[0] ?? "?"}
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "#888" }}>
                    {node.assignee.name}
                  </div>
                  <div style={{ fontSize: "9px", color: "#444" }}>
                    Penanggung Jawab
                  </div>
                </div>
              </div>
            )}

            {/* Footer: hint drag */}
            <div
              style={{
                padding: "6px 14px",
                background: "#0d0d0d",
                borderTop: "1px solid #1a1a1a",
                fontSize: "9px",
                color: "#333",
              }}
            >
              Tahan dan geser untuk menjadwalkan ulang · Klik untuk melihat rincian
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
