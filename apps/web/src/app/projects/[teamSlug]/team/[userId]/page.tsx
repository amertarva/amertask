"use client";

import { useMemo } from "react";
import {
  ArrowLeft,
  Mail,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTeamMemberDetail } from "@/hooks/useTeams";
import { useIssues } from "@/hooks/useIssues";

type IssueRecord = {
  id: string;
  number: number;
  title: string;
  status: string;
  assignee?: { id?: string } | null;
  assigneeId?: string;
  assignee_id?: string;
  teamSlug?: string;
  team_slug?: string;
  updatedAt?: string;
  updated_at?: string;
  createdAt?: string;
  created_at?: string;
  resolvedAt?: string;
  resolved_at?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getIssueTimestamp(issue: {
  updatedAt?: string;
  updated_at?: string;
  createdAt?: string;
  created_at?: string;
  resolvedAt?: string;
  resolved_at?: string;
}) {
  return (
    issue.updatedAt ||
    issue.updated_at ||
    issue.resolvedAt ||
    issue.resolved_at ||
    issue.createdAt ||
    issue.created_at ||
    ""
  );
}

function getIssueDisplayCode(issue: IssueRecord, fallbackTeamSlug: string) {
  const normalizedSlug = String(
    issue.teamSlug || issue.team_slug || fallbackTeamSlug || "",
  ).toUpperCase();

  if (!normalizedSlug) {
    return `#${issue.number}`;
  }

  return `${normalizedSlug}-${issue.number}`;
}

export default function UserProfilePage() {
  const params = useParams();
  const teamSlug = String(params?.teamSlug || "");
  const userId = String(params?.userId || "");

  const {
    member: user,
    isLoading: memberLoading,
    error: memberError,
    refetch: refetchMember,
  } = useTeamMemberDetail(teamSlug, userId);
  const {
    issues,
    isLoading: issuesLoading,
    error: issuesError,
    refetch: refetchIssues,
  } = useIssues(teamSlug, {});

  const resolvedUserId = user?.id || userId;

  const userIssues = useMemo(
    () =>
      issues.filter((issue) => {
        const record = issue as IssueRecord;

        return (
          record.assignee?.id === resolvedUserId ||
          record.assigneeId === resolvedUserId ||
          record.assignee_id === resolvedUserId
        );
      }),
    [issues, resolvedUserId],
  );

  const stats = useMemo(() => {
    const total = userIssues.length;
    const done = userIssues.filter((i) => i.status === "done").length;
    const inProgress = userIssues.filter(
      (i) => i.status === "in_progress",
    ).length;
    const todo = userIssues.filter((i) => i.status === "todo").length;
    const doneRate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, todo, doneRate };
  }, [userIssues]);

  const recentIssues = useMemo(
    () =>
      [...userIssues]
        .sort(
          (a, b) =>
            new Date(getIssueTimestamp(b)).getTime() -
            new Date(getIssueTimestamp(a)).getTime(),
        )
        .slice(0, 8),
    [userIssues],
  );

  const isLoading = memberLoading || issuesLoading;
  const error = memberError || issuesError;

  if (!teamSlug || !userId) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <p className="text-text-muted">Anggota tim tidak ditemukan.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-muted">Memuat profil anggota tim...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-priority-urgent/10 border border-priority-urgent/30 p-6 rounded-xl text-priority-urgent space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={() => {
              void Promise.all([refetchMember(), refetchIssues()]);
            }}
            className="bg-priority-urgent text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-text font-semibold">Anggota tidak ditemukan.</p>
          <Link
            href={`/projects/${teamSlug}/team`}
            className="text-primary hover:underline"
          >
            Kembali ke daftar anggota
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background animate-fade-in overflow-y-auto">
      <div className="sticky top-0 z-50 bg-[hsl(var(--background))] border-b border-border px-6 py-4">
        <Link
          href={`/projects/${teamSlug}/team`}
          className="flex items-center gap-2 text-text-muted hover:text-text font-semibold transition-colors text-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Anggota Tim
        </Link>
      </div>

      <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-text">
                {user.name}
              </h1>
              <p className="text-text-muted mt-1">
                {user.role || "Anggota Tim"}
              </p>
            </div>
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                {(user.initials || user.name || "?").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-2 text-text-muted">
              <Mail className="w-4 h-4" />
              <span>{user.email || "-"}</span>
            </div>
            <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-2 text-text-muted">
              <Calendar className="w-4 h-4" />
              <span>Bergabung: {formatDate(user.joinedAt)}</span>
            </div>
            <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-2 text-text-muted">
              <Clock3 className="w-4 h-4" />
              <span>Peran: {user.role || "member"}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Issue" value={stats.total} />
          <StatCard label="Done" value={stats.done} accent="text-status-done" />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            accent="text-status-in-progress"
          />
          <StatCard label="Todo" value={stats.todo} accent="text-status-todo" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text">
              Progress Penyelesaian
            </h2>
            <span className="text-sm font-semibold text-text-muted">
              {stats.doneRate}% selesai
            </span>
          </div>

          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-status-done transition-all"
              style={{ width: `${stats.doneRate}%` }}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-text">Aktivitas Terbaru</h2>

          {recentIssues.length === 0 ? (
            <div className="text-sm text-text-muted py-8 text-center border border-dashed border-border rounded-xl">
              Belum ada aktivitas issue untuk anggota ini.
            </div>
          ) : (
            <div className="space-y-3">
              {recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border border-border rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-text">{issue.title}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {getIssueDisplayCode(issue as IssueRecord, teamSlug)} •
                      Update:{" "}
                      {formatDate(getIssueTimestamp(issue as IssueRecord))}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-md bg-muted text-text-muted uppercase">
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-2 ${accent || "text-text"}`}>
        {value}
      </p>
      {label === "Done" && value > 0 ? (
        <div className="mt-2 flex items-center gap-1 text-status-done text-xs">
          <CheckCircle2 className="w-3 h-3" /> Ada issue yang selesai
        </div>
      ) : null}
    </div>
  );
}
