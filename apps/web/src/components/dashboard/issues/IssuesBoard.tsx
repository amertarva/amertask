"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TaskCard } from "@/components/dashboard/issues/TaskCard";
import { useIssues } from "@/hooks/useIssues";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import type { Issue } from "@/types";
import { Skeleton } from "@/components/ui";

// Helper to get label color based on label name
const getLabelColor = (labels: string[] | undefined) => {
  if (!labels || labels.length === 0) return "bg-muted/10 text-text-muted";

  const label = labels[0].toLowerCase();
  const colorMap: Record<string, string> = {
    frontend:
      "bg-[hsl(var(--label-frontend))]/10 text-[hsl(var(--label-frontend))]",
    backend:
      "bg-[hsl(var(--label-backend))]/10 text-[hsl(var(--label-backend))]",
    design: "bg-[hsl(var(--label-design))]/10 text-[hsl(var(--label-design))]",
    bug: "bg-priority-urgent/10 text-priority-urgent",
    feature: "bg-primary/10 text-primary",
    docs: "bg-[hsl(var(--label-integrations))]/10 text-[hsl(var(--label-integrations))]",
  };

  return colorMap[label] || "bg-muted/10 text-text-muted";
};

// Helper to get priority color
const getPriorityColor = (priority: string) => {
  const colorMap: Record<string, string> = {
    urgent: "bg-priority-urgent",
    high: "bg-priority-high",
    medium: "bg-priority-medium",
    low: "bg-priority-low",
  };
  return colorMap[priority] || "bg-priority-medium";
};

// Helper to get avatar color based on user
const getAvatarColor = (index: number) => {
  const colors = [
    "bg-primary",
    "bg-secondary text-secondary-foreground",
    "bg-priority-high",
    "bg-status-in-progress",
    "bg-[hsl(var(--label-frontend))]",
  ];
  return colors[index % colors.length];
};

export function IssuesBoard() {
  const params = useParams();
  const teamSlug = String(params?.teamSlug || "");
  const { issues, isLoading, error } = useIssues(teamSlug, {});
  const [mobileTab, setMobileTab] = useState<"todo" | "in_progress" | "done">("todo");

  // Transform issues to task cards
  const { todoTasks, inProgressTasks, doneTasks } = useMemo(() => {
    const normalizeStatus = (status: string) =>
      status
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const isTodoStatus = (status: string) => {
      const normalized = normalizeStatus(status);
      return ["todo", "to_do", "perlu_dikerjakan", "backlog"].includes(
        normalized,
      );
    };

    const transformIssue = (issue: Issue, index: number) => ({
      id: `${teamSlug}-${issue.number}`,
      title: issue.title,
      tag:
        issue.labels && issue.labels.length > 0
          ? issue.labels[0].toUpperCase()
          : "TASK",
      tagColor: getLabelColor(issue.labels),
      priority: getPriorityColor(issue.priority),
      avatar: issue.assignee?.initials || "?",
      avatarColor: getAvatarColor(index),
    });

    const todo = issues
      .filter((issue) => isTodoStatus(issue.status))
      .map(transformIssue);

    const inProgress = issues
      .filter((issue) => issue.status === "in_progress")
      .map(transformIssue);

    const done = issues
      .filter((issue) => issue.status === "done")
      .map(transformIssue);

    return { todoTasks: todo, inProgressTasks: inProgress, doneTasks: done };
  }, [issues, teamSlug]);

  if (!teamSlug) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-priority-urgent mx-auto" />
          <p className="text-text-muted">Tim tidak ditemukan</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 space-y-8 w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6 mb-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-48 bg-muted/60" />
            <Skeleton className="h-4 w-64 bg-muted/60" />
          </div>
          <Skeleton className="h-10 w-full sm:w-32 rounded-xl bg-muted/60" />
        </div>

        {/* Board Skeleton */}
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar h-[calc(100vh-250px)]">
          {/* Column 1 */}
          <div className="w-[300px] shrink-0 bg-muted/20 rounded-2xl p-4 flex flex-col gap-3">
            <Skeleton className="h-6 w-32 bg-muted/60 mb-2" />
            <Skeleton className="h-[120px] w-full rounded-xl bg-muted/60" />
            <Skeleton className="h-[120px] w-full rounded-xl bg-muted/60" />
            <Skeleton className="h-[120px] w-full rounded-xl bg-muted/60" />
          </div>
          {/* Column 2 */}
          <div className="w-[300px] shrink-0 bg-muted/20 rounded-2xl p-4 flex flex-col gap-3">
            <Skeleton className="h-6 w-32 bg-muted/60 mb-2" />
            <Skeleton className="h-[120px] w-full rounded-xl bg-muted/60" />
            <Skeleton className="h-[120px] w-full rounded-xl bg-muted/60" />
          </div>
          {/* Column 3 */}
          <div className="w-[300px] shrink-0 bg-muted/20 rounded-2xl p-4 flex flex-col gap-3">
            <Skeleton className="h-6 w-32 bg-muted/60 mb-2" />
            <Skeleton className="h-[120px] w-full rounded-xl bg-muted/60" />
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
        </div>
      </div>
    );
  }

  const totalIssues =
    todoTasks.length + inProgressTasks.length + doneTasks.length;

  return (
    <div className="h-full flex flex-col bg-background p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 sm:pb-8 pt-0">
        <div className="w-full">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text flex items-center gap-3 break-words">
            Active Board
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-status-done/10 text-status-done shrink-0 mt-1">
              {totalIssues} Issues
            </span>
          </h1>
          <p className="text-sm font-medium text-text-muted mt-1">
            {totalIssues} issues • {teamSlug} Team
          </p>
        </div>
      </div>

      {/* Empty State */}
      {totalIssues === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-text-muted mx-auto" />
            <h3 className="text-xl font-bold text-text">Belum Ada Issues</h3>
            <p className="text-text-muted">
              Mulai buat issue pertama untuk tim ini
            </p>
          </div>
        </div>
      )}

      {/* Mobile Column Tabs */}
      {totalIssues > 0 && (
        <div className="flex md:hidden bg-muted/40 p-1 rounded-xl mb-6 shadow-sm border border-border">
          <button
            onClick={() => setMobileTab("todo")}
            className={cn(
              "flex-1 py-2.5 text-[13px] sm:text-sm font-bold rounded-lg transition-all",
              mobileTab === "todo"
                ? "bg-background text-text shadow-sm ring-1 ring-border"
                : "text-text-muted hover:text-text",
            )}
          >
            To Do <span className="ml-1 opacity-70">({todoTasks.length})</span>
          </button>
          <button
            onClick={() => setMobileTab("in_progress")}
            className={cn(
              "flex-1 py-2.5 text-[13px] sm:text-sm font-bold rounded-lg transition-all",
              mobileTab === "in_progress"
                ? "bg-background text-status-in-progress shadow-sm ring-1 ring-border"
                : "text-text-muted hover:text-text",
            )}
          >
            Proses <span className="ml-1 opacity-70">({inProgressTasks.length})</span>
          </button>
          <button
            onClick={() => setMobileTab("done")}
            className={cn(
              "flex-1 py-2.5 text-[13px] sm:text-sm font-bold rounded-lg transition-all",
              mobileTab === "done"
                ? "bg-background text-status-done shadow-sm ring-1 ring-border"
                : "text-text-muted hover:text-text",
            )}
          >
            Selesai <span className="ml-1 opacity-70">({doneTasks.length})</span>
          </button>
        </div>
      )}

      {/* Board Layout */}
      {totalIssues > 0 && (
        <div className="flex flex-1 gap-4 md:gap-6 pb-6">
          {/* To Do Column */}
          <div
            className={cn(
              "flex-1 min-w-[280px] sm:min-w-0 flex-col gap-4",
              mobileTab === "todo" ? "flex" : "hidden md:flex",
            )}
          >
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="w-2 h-2 rounded-full bg-status-todo"></div>
              <h2 className="font-bold text-text-muted tracking-wide text-sm">
                To Do
              </h2>
              <span className="text-sm font-bold text-text-muted ml-1">
                {todoTasks.length}
              </span>
            </div>
            <div className="space-y-4">
              {todoTasks.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">
                  Tidak ada task
                </p>
              ) : (
                todoTasks.map((task) => <TaskCard key={task.id} {...task} />)
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div
            className={cn(
              "flex-1 min-w-[280px] sm:min-w-0 flex-col gap-4",
              mobileTab === "in_progress" ? "flex" : "hidden md:flex",
            )}
          >
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="w-2 h-2 rounded-full bg-status-in-progress shadow-[0_0_8px_hsl(var(--status-in-progress)/0.5)]"></div>
              <h2 className="font-bold text-text-muted tracking-wide text-sm">
                In Progress
              </h2>
              <span className="text-sm font-bold text-text-muted ml-1">
                {inProgressTasks.length}
              </span>
            </div>
            <div className="space-y-4">
              {inProgressTasks.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">
                  Tidak ada task
                </p>
              ) : (
                inProgressTasks.map((task) => (
                  <TaskCard key={task.id} {...task} />
                ))
              )}
            </div>
          </div>

          {/* Done Column */}
          <div
            className={cn(
              "flex-1 min-w-[280px] sm:min-w-0 flex-col gap-4",
              mobileTab === "done" ? "flex" : "hidden md:flex",
            )}
          >
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="w-2 h-2 rounded-full bg-status-done"></div>
              <h2 className="font-bold text-text-muted tracking-wide text-sm">
                Done
              </h2>
              <span className="text-sm font-bold text-text-muted ml-1">
                {doneTasks.length}
              </span>
            </div>
            <div className="space-y-4">
              {doneTasks.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">
                  Tidak ada task
                </p>
              ) : (
                doneTasks.map((task) => <TaskCard key={task.id} {...task} />)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
