"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  LayoutList,
  Loader2,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useThemeStore } from "@/store/useThemeStore";
import { Skeleton } from "@/components/ui";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
import { StatCard } from "@/components/dashboard/overview/StatCard";
import { ActivityItem } from "@/components/dashboard/overview/ActivityItem";
import { useTeams } from "@/hooks/useTeams";
import { useIssues } from "@/hooks/useIssues";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { Issue } from "@/types";

type IssueWithLegacyDates = Issue & {
  updated_at?: string;
  created_at?: string;
};

function resolveIssueDate(issue: IssueWithLegacyDates): string {
  return (
    issue.updatedAt ||
    issue.updated_at ||
    issue.createdAt ||
    issue.created_at ||
    new Date().toISOString()
  );
}

export function TeamOverviewDashboard({ teamSlug }: { teamSlug: string }) {
  const { getTeamBySlug } = useTeams();
  const {
    issues,
    isLoading: issuesLoading,
    error: issuesError,
    refetch,
  } = useIssues(teamSlug, {});
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(
    teamSlug,
    {},
  );
  const [teamName, setTeamName] = useState(teamSlug);
  const [teamLoading, setTeamLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function fetchTeam() {
      if (!teamSlug) {
        setTeamLoading(false);
        return;
      }

      setTeamLoading(true);

      try {
        const teamData = await getTeamBySlug(teamSlug);
        if (!isCancelled) {
          setTeamName(teamData?.name || teamSlug);
        }
      } catch (teamError) {
        console.warn("Could not fetch team details:", teamError);
        if (!isCancelled) {
          setTeamName(teamSlug);
        }
      } finally {
        if (!isCancelled) {
          setTeamLoading(false);
        }
      }
    }

    void fetchTeam();

    return () => {
      isCancelled = true;
    };
  }, [teamSlug, getTeamBySlug]);

  const stats = useMemo(() => {
    if (analytics?.summary) {
      return {
        total: analytics.summary.totalIssues,
        inProgress: analytics.summary.inProgress,
        done: analytics.summary.completed,
        blocked: analytics.summary.cancelled,
      };
    }

    return {
      total: issues.length,
      inProgress: issues.filter((i) => i.status === "in_progress").length,
      done: issues.filter((i) => i.status === "done").length,
      blocked: issues.filter((i) => i.status === "cancelled").length,
    };
  }, [analytics?.summary, issues]);

  const completionTrend = useMemo(
    () => (analytics?.completionTrend ?? []).slice(-7),
    [analytics?.completionTrend],
  );

  const { colorTheme } = useThemeStore();
  const isDark = colorTheme === "amerta-night";
  const primaryColor = isDark ? "#4ade80" : "#16a34a";
  const primaryBg = isDark ? "rgba(74, 222, 128, 0.2)" : "rgba(22, 163, 74, 0.2)";
  const primaryHoverBg = isDark ? "rgba(74, 222, 128, 0.4)" : "rgba(22, 163, 74, 0.4)";

  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
  const textColor = isDark ? "#a1a1aa" : "#71717a";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipText = isDark ? "#ffffff" : "#000000";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";

  const chartData = useMemo(() => ({
    labels: completionTrend.map((point) => 
      new Date(point.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
    ),
    datasets: [
      {
        label: "Penyelesaian",
        data: completionTrend.map((point) => point.completed),
        backgroundColor: primaryBg,
        hoverBackgroundColor: primaryHoverBg,
        borderColor: primaryColor,
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  }), [completionTrend, primaryBg, primaryHoverBg, primaryColor]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: textColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textColor, precision: 0, stepSize: 1 },
        border: { display: false }
      },
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { size: 11 } },
        border: { display: false }
      }
    }
  }), [gridColor, textColor, tooltipBg, tooltipText, tooltipBorder]);

  const recentIssues = useMemo(
    () =>
      [...issues]
        .sort((a, b) => {
          const aDate = new Date(resolveIssueDate(a as IssueWithLegacyDates));
          const bDate = new Date(resolveIssueDate(b as IssueWithLegacyDates));
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 4),
    [issues],
  );

  if (teamLoading || issuesLoading || analyticsLoading) {
    return (
      <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 space-y-8 w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64 bg-muted/60" />
            <Skeleton className="h-4 w-48 bg-muted/60" />
          </div>
          <Skeleton className="h-10 w-full sm:w-40 rounded-xl bg-muted/60" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl bg-muted/60" />
          ))}
        </div>

        {/* Bottom Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[340px] rounded-2xl bg-muted/60" />
          <Skeleton className="h-[340px] rounded-2xl bg-muted/60" />
        </div>
      </div>
    );
  }

  if (issuesError) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-priority-urgent mx-auto" />
          <p className="text-text-muted">{issuesError}</p>
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
    <div className="h-full flex flex-col bg-background p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-center gap-2 break-words">
            Hai, Tim {teamName || teamSlug}!
          </h1>
          <p className="text-text-muted mt-2">
            Ini ringkasan aktivitas dan performa kerja Anda hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href={`/projects/${teamSlug}/issues`}
            className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-5 py-3 sm:py-2.5 rounded-xl transition-all shadow hover:shadow-lg text-center"
          >
            Ke Papan Aktif (Board)
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard
          title="Total Task"
          value={stats.total.toString()}
          icon={<LayoutList className="text-primary" />}
          trend={stats.total > 0 ? `${stats.total} tasks` : "Belum ada"}
          trendUp={stats.total > 0}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress.toString()}
          icon={<Clock className="text-status-in-progress" />}
          trend={stats.inProgress > 0 ? "Aktif" : "Tidak ada"}
        />
        <StatCard
          title="Selesai"
          value={stats.done.toString()}
          icon={<CheckCircle2 className="text-status-done" />}
          trend={stats.done > 0 ? `${stats.done} completed` : "Belum ada"}
          trendUp={stats.done > 0}
        />
        <StatCard
          title="Tertahan"
          value={stats.blocked.toString()}
          icon={<AlertCircle className="text-priority-urgent" />}
          trend={stats.blocked > 0 ? "Perlu perhatian" : "Tidak ada"}
          trendUp={false}
          isDanger={stats.blocked > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Tren Penyelesaian
            </h3>
          </div>

          {completionTrend.length === 0 ? (
            <div className="h-64 border border-dashed border-border rounded-xl flex items-center justify-center">
              <p className="text-sm text-text-muted">
                Belum ada data tren penyelesaian.
              </p>
            </div>
          ) : (
            <div className="h-64 sm:h-72 w-full relative">
              <Bar key={`chart-${colorTheme}`} data={chartData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-text text-lg mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Aktivitas Terkini
          </h3>
          <div className="space-y-5">
            {recentIssues.map((issue) => (
              <ActivityItem
                key={issue.id}
                user={issue.assignee?.name || "Unassigned"}
                action="mengerjakan"
                target={`${teamSlug}-${issue.number}`}
                time={new Date(
                  resolveIssueDate(issue as IssueWithLegacyDates),
                ).toLocaleDateString("id-ID")}
                dotColor={
                  issue.status === "done"
                    ? "bg-status-done"
                    : issue.status === "in_progress"
                      ? "bg-status-in-progress"
                      : "bg-status-todo"
                }
              />
            ))}
            {recentIssues.length === 0 && (
              <p className="text-text-muted text-sm text-center py-4">
                Belum ada aktivitas
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
