// lib/constants.ts
import {
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  Circle,
  Timer,
  GitPullRequest,
  CheckCircle2,
  Archive,
  Ban,
} from "lucide-react";

export const STATUS_CONFIG = {
  backlog: {
    label: "Backlog",
    color: "status-backlog",
    icon: Archive,
  },
  todo: {
    label: "Perlu Dikerjakan",
    color: "status-todo",
    icon: Circle,
  },
  in_progress: {
    label: "Sedang Dikerjakan",
    color: "status-in-progress",
    icon: Timer,
  },
  in_review: {
    label: "Dalam Ulasan",
    color: "status-in-review",
    icon: GitPullRequest,
  },
  bug: {
    label: "Bug",
    color: "priority-urgent",
    icon: AlertTriangle,
  },
  done: {
    label: "Selesai",
    color: "status-done",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Dibatalkan",
    color: "status-cancelled",
    icon: Ban,
  },
} as const;

export const PRIORITY_CONFIG = {
  urgent: {
    label: "Mendesak",
    color: "priority-urgent",
    icon: AlertTriangle,
  },
  high: {
    label: "Tinggi",
    color: "priority-high",
    icon: ArrowUp,
  },
  medium: {
    label: "Sedang",
    color: "priority-medium",
    icon: Minus,
  },
  low: {
    label: "Rendah",
    color: "priority-low",
    icon: ArrowDown,
  },
} as const;

export const LABEL_COLORS: Record<string, string> = {
  Frontend: "#3b82f6",
  Backend: "#8b5cf6",
  Design: "#ec4899",
  Bug: "#ef4444",
  Feature: "#22c55e",
  Enhancement: "#f59e0b",
  Integrations: "#0ea5e9",
  "Web development": "#06b6d4",
};

export const SORT_OPTIONS = [
  { value: "priority", label: "Prioritas" },
  { value: "status", label: "Status" },
  { value: "updated_at", label: "Terakhir Diperbarui" },
  { value: "created_at", label: "Tanggal Dibuat" },
  { value: "title", label: "Judul" },
] as const;
