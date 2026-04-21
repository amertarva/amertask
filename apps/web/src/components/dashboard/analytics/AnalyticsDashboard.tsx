"use client";

import React, { useMemo } from "react";
import {
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BarChart3,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";

function buildPolyline(values: number[], maxValue: number): string {
  if (values.length === 0) return "";

  const divisor = values.length === 1 ? 1 : values.length - 1;
  return values
    .map((value, index) => {
      const x = (index / divisor) * 100;
      const y = 100 - (value / Math.max(maxValue, 1)) * 90;
      return `${x},${y}`;
    })
    .join(" ");
}

function formatTrendDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

export function AnalyticsDashboard() {
  const params = useParams();
  const teamSlug = String(params?.teamSlug || "");
  const { data, isLoading, error, refetch } = useAnalytics(teamSlug, {});

  const recentTrend = useMemo(
    () => (data?.completionTrend ?? []).slice(-7),
    [data?.completionTrend],
  );

  const maxTrendValue = useMemo(
    () =>
      Math.max(
        ...recentTrend.map((point) => Math.max(point.completed, point.created)),
        1,
      ),
    [recentTrend],
  );

  const completedLine = useMemo(
    () =>
      buildPolyline(
        recentTrend.map((point) => point.completed),
        maxTrendValue,
      ),
    [maxTrendValue, recentTrend],
  );

  const createdLine = useMemo(
    () =>
      buildPolyline(
        recentTrend.map((point) => point.created),
        maxTrendValue,
      ),
    [maxTrendValue, recentTrend],
  );

  const summary = data?.summary ?? {
    totalIssues: 0,
    openIssues: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  };

  const topPriority = useMemo(
    () => [...(data?.byPriority ?? [])].sort((a, b) => b.count - a.count)[0],
    [data?.byPriority],
  );

  const topContributors = (data?.byAssignee ?? []).slice(0, 3);

  if (!teamSlug) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <p className="text-text-muted">Tim tidak ditemukan.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-muted">Memuat analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-priority-urgent mx-auto" />
          <p className="text-text-muted">{error}</p>
          <button
            onClick={() => void refetch()}
            className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background p-6 lg:p-8 animate-fade-in overflow-y-auto">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary" />
          Analytics Tim
        </h1>
        <p className="text-text-muted mt-2">
          Pantau kecepatan, efisiensi, dan kesehatan proyek secara real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Completion Trend */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text text-lg">Tren Penyelesaian</h3>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-text-muted">
              {recentTrend.length} hari terakhir
            </span>
          </div>

          {recentTrend.length === 0 ? (
            <div className="h-64 border border-dashed border-border rounded-xl flex items-center justify-center">
              <p className="text-sm text-text-muted">Belum ada data tren.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative h-64 border-l border-b border-border pl-4 pb-4">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <polyline
                    points={createdLine}
                    fill="none"
                    stroke="currentColor"
                    className="text-muted-foreground stroke-[1.5]"
                  />
                  <polyline
                    points={completedLine}
                    fill="none"
                    stroke="currentColor"
                    className="text-primary stroke-2"
                  />
                  {recentTrend.map((point, index) => {
                    const divisor =
                      recentTrend.length === 1 ? 1 : recentTrend.length - 1;
                    const x = (index / divisor) * 100;
                    const y = 100 - (point.completed / maxTrendValue) * 90;
                    return (
                      <circle
                        key={point.date}
                        cx={x}
                        cy={y}
                        r="1.8"
                        fill="currentColor"
                        className="text-primary"
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs text-text-muted">
                {recentTrend.map((point) => (
                  <span key={`label-${point.date}`}>
                    {formatTrendDate(point.date)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-6 mt-6 text-sm font-medium text-text-muted">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" /> Selesai
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-muted-foreground" />
              Dibuat
            </div>
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="flex flex-col gap-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest mb-3">
                <TrendingUp className="w-4 h-4" /> Total Isu
              </div>
              <div className="flex items-end gap-2">
                <h4 className="text-4xl font-extrabold text-text">
                  {summary.totalIssues}
                </h4>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest mb-3">
                <Calendar className="w-4 h-4" /> Sedang Dikerjakan
              </div>
              <div className="flex items-end gap-2">
                <h4 className="text-4xl font-extrabold text-text">
                  {summary.inProgress}
                </h4>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest mb-3">
                <CheckCircle2 className="w-4 h-4" /> Selesai
              </div>
              <div className="flex items-end gap-2">
                <h4 className="text-4xl font-extrabold text-text">
                  {summary.completed}
                </h4>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest mb-3">
                <AlertCircle className="w-4 h-4" /> Dibatalkan
              </div>
              <div className="flex items-end gap-2">
                <h4 className="text-4xl font-extrabold text-text">
                  {summary.cancelled}
                </h4>
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex-1">
            <h3 className="font-bold text-text text-lg mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-secondary" /> Peringatan
              Kesehatan
            </h3>
            <div className="space-y-4">
              {summary.openIssues > summary.completed ? (
                <div className="flex gap-4 p-4 rounded-xl bg-priority-urgent/10 border border-priority-urgent/20 text-priority-urgent">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">
                      Beban Isu Masih Tinggi
                    </h4>
                    <p className="text-xs opacity-80 mt-1 font-medium">
                      Isu terbuka ({summary.openIssues}) lebih banyak dari isu
                      selesai ({summary.completed}).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 p-4 rounded-xl bg-status-done/10 border border-status-done/20 text-status-done">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Tren Pengerjaan Sehat</h4>
                    <p className="text-xs opacity-80 mt-1 font-medium">
                      Isu selesai sudah menutup beban isu terbuka saat ini.
                    </p>
                  </div>
                </div>
              )}

              {topPriority && (
                <div className="flex gap-4 p-4 rounded-xl bg-muted/40 border border-border text-text-muted">
                  <TrendingUp className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Prioritas Dominan</h4>
                    <p className="text-xs opacity-80 mt-1 font-medium">
                      {topPriority.count} isu berada di prioritas{" "}
                      {topPriority.priority}.
                    </p>
                  </div>
                </div>
              )}

              {topContributors.length > 0 && (
                <div className="p-4 rounded-xl bg-background border border-border">
                  <h4 className="font-bold text-sm text-text mb-3">
                    Kontributor Aktif
                  </h4>
                  <div className="space-y-2">
                    {topContributors.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-text">
                          {member.name}
                        </span>
                        <span className="text-text-muted">
                          {member.count} isu
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
