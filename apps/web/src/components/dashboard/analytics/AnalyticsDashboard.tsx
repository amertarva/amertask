"use client";

import React, { useMemo, useState } from "react";
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
import { useThemeStore } from "@/store/useThemeStore";
import { Skeleton } from "@/components/ui";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);


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
  const { colorTheme } = useThemeStore();

  const [period, setPeriod] = useState<number>(7);

  const recentTrend = useMemo(
    () => (data?.completionTrend ?? []).slice(-period),
    [data?.completionTrend, period]
  );

  const isDark = colorTheme === "amerta-night";
  
  // Green for Selesai
  const primaryColor = isDark ? "#4ade80" : "#16a34a";
  const primaryBg = isDark ? "rgba(74, 222, 128, 0.1)" : "rgba(22, 163, 74, 0.1)";
  
  // Blue for Dibuat
  const secondaryColor = isDark ? "#60a5fa" : "#2563eb";
  const secondaryBg = isDark ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.1)";

  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
  const textColor = isDark ? "#a1a1aa" : "#71717a";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipText = isDark ? "#ffffff" : "#000000";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";

  const chartData = useMemo(() => {
    return {
      labels: recentTrend.map((point) => formatTrendDate(point.date)),
      datasets: [
        {
          label: "Dibuat",
          data: recentTrend.map((point) => point.created),
          borderColor: secondaryColor,
          backgroundColor: secondaryBg,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: "Selesai",
          data: recentTrend.map((point) => point.completed),
          borderColor: primaryColor,
          backgroundColor: primaryBg,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [recentTrend, primaryColor, secondaryColor, primaryBg, secondaryBg]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: textColor,
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 10,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: gridColor,
          },
          ticks: {
            color: textColor,
            precision: 0,
          },
          border: {
            display: false,
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: textColor,
            font: {
              size: 11,
            },
          },
          border: {
            display: false,
          },
        },
      },
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
      },
    }),
    [gridColor, textColor, tooltipBg, tooltipText, tooltipBorder]
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
      <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 space-y-8 w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-6 sm:mb-8 border-b border-border pb-4 sm:pb-6">
          <Skeleton className="h-8 w-64 bg-muted/60 mb-3" />
          <Skeleton className="h-4 w-96 bg-muted/60" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Chart Skeleton */}
          <Skeleton className="h-[380px] rounded-2xl bg-muted/60" />
          
          <div className="space-y-6 sm:space-y-8">
            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-[120px] rounded-2xl bg-muted/60" />
              <Skeleton className="h-[120px] rounded-2xl bg-muted/60" />
            </div>
            
            {/* Metric Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-[160px] rounded-2xl bg-muted/60" />
              <Skeleton className="h-[160px] rounded-2xl bg-muted/60" />
            </div>
          </div>
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
    <div className="h-full flex flex-col bg-background p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto overflow-x-hidden w-full">
      <div className="mb-6 sm:mb-8 border-b border-border pb-4 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-center gap-3 break-words">
          <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
          Analytics Tim
        </h1>
        <p className="text-text-muted mt-2">
          Pantau kecepatan, efisiensi, dan kesehatan proyek secara real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Completion Trend */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <h3 className="font-bold text-text text-lg">Tren Penyelesaian</h3>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="bg-muted/50 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text cursor-pointer outline-none focus:ring-1 focus:ring-primary shadow-sm transition-colors"
            >
              <option value={1}>1 hari terakhir</option>
              <option value={7}>1 minggu terakhir</option>
              <option value={30}>1 bulan terakhir</option>
              <option value={365}>1 tahun terakhir</option>
            </select>
          </div>

          {recentTrend.length === 0 ? (
            <div className="h-64 border border-dashed border-border rounded-xl flex items-center justify-center">
              <p className="text-sm text-text-muted">Belum ada data tren.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative h-64 sm:h-72 w-full">
                <Line key={`chart-${colorTheme}`} data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          <div className="flex justify-center gap-6 mt-6 text-sm font-medium text-text-muted">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: primaryColor }} /> Selesai
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: secondaryColor }} />
              Dibuat
            </div>
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="flex flex-col gap-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex-1">
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
