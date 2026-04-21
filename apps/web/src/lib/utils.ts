// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { IssueFilters } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildQuery(filters?: IssueFilters): string {
  if (!filters) return "";

  const params = new URLSearchParams();

  if (filters.status?.length) {
    params.append("status", filters.status.join(","));
  }
  if (filters.priority?.length) {
    params.append("priority", filters.priority.join(","));
  }
  if (filters.labels?.length) {
    params.append("labels", filters.labels.join(","));
  }
  if (filters.assigneeId) {
    params.append("assigneeId", filters.assigneeId);
  }
  if (filters.search) {
    params.append("search", filters.search);
  }

  return params.toString();
}

export function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
  return `${Math.floor(days / 365)} tahun lalu`;
}

export function formatIssueNumber(teamSlug: string, number: number): string {
  return `${teamSlug}-${number}`;
}
