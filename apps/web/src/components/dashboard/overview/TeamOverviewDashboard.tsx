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

  const maxCompletionValue = useMemo(
    () => Math.max(...completionTrend.map((point) => point.completed), 1),
    [completionTrend],
  );

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
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="h-full flex flex-col bg-background p-6 lg:p-8 animate-fade-in overflow-y-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-2">
            Hai, Tim {teamName || teamSlug}!
          </h1>
          <p className="text-text-muted mt-2">
            Ini ringkasan aktivitas dan performa kerja Anda hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${teamSlug}/issues`}
            className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-5 py-2.5 rounded-xl transition-all shadow hover:shadow-lg"
          >
            Ke Papan Aktif (Board)
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <div className="h-64 flex items-end justify-between gap-2 border-b border-border pb-4">
              {completionTrend.map((point) => {
                const normalized = Math.round(
                  (point.completed / maxCompletionValue) * 100,
                );
                const barHeight = Math.max(normalized, 8);

                return (
                  <div
                    key={point.date}
                    className="flex-1 flex flex-col items-center gap-2 group"
                  >
                    <div
                      className="w-full bg-primary/20 rounded-t-lg relative group-hover:bg-primary/30 transition-all cursor-pointer"
                      style={{ height: `${barHeight}%` }}
                    >
                      <div
                        className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all"
                        style={{ height: `${Math.max(20, barHeight - 30)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-text-muted font-medium">
                      {new Date(point.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                );
              })}
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
