"use client";

import React, { useState } from "react";
import {
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTriage } from "@/hooks/useTriage";
import { Skeleton } from "@/components/ui";

export function TriageView() {
  const params = useParams();
  const teamSlug = String(params?.teamSlug || "");
  const {
    issues,
    total,
    isLoading,
    error,
    acceptIssue,
    declineIssue,
    deleteIssue,
    refetch,
  } = useTriage(teamSlug);
  const [actionIssueId, setActionIssueId] = useState<string | null>(null);

  const handleAccept = async (issueId: string) => {
    setActionIssueId(issueId);
    try {
      await acceptIssue(issueId);
    } catch (acceptError) {
      console.error("Gagal menerima issue triage:", acceptError);
    } finally {
      setActionIssueId(null);
    }
  };

  const handleDecline = async (issueId: string) => {
    setActionIssueId(issueId);
    try {
      await declineIssue(issueId, {
        reason: "Dibatalkan dari dashboard triage",
      });
    } catch (declineError) {
      console.error("Gagal membatalkan issue triage:", declineError);
    } finally {
      setActionIssueId(null);
    }
  };

  const handleDelete = async (issueId: string) => {
    const isConfirmed = window.confirm(
      "Yakin ingin menghapus issue ini secara permanen dari database?",
    );
    if (!isConfirmed) {
      return;
    }

    setActionIssueId(issueId);
    try {
      await deleteIssue(issueId);
    } catch (deleteError) {
      console.error("Gagal menghapus issue dari database:", deleteError);
    } finally {
      setActionIssueId(null);
    }
  };

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
      <div className="h-full flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 w-full animate-pulse">
        {/* Sidebar Skeleton */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <Skeleton className="h-10 w-full rounded-2xl bg-muted/60" />
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
            <Skeleton className="h-20 min-w-[240px] lg:min-w-0 lg:w-full rounded-2xl bg-muted/60 shrink-0" />
            <Skeleton className="h-20 min-w-[240px] lg:min-w-0 lg:w-full rounded-2xl bg-muted/60 shrink-0" />
            <Skeleton className="h-20 min-w-[240px] lg:min-w-0 lg:w-full rounded-2xl bg-muted/60 shrink-0 hidden lg:block" />
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="flex-1 min-w-0 space-y-6 hidden lg:block">
          <Skeleton className="h-[400px] w-full rounded-3xl bg-muted/60" />
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
    <div className="h-full flex flex-col bg-background p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 sm:pb-8 pt-0 border-b border-border mb-6 sm:mb-8">
        <div className="w-full">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text flex items-center justify-between sm:justify-start gap-3 tracking-tight">
            Bug Triage
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-text-muted sm:hidden">
              {total} Isu
            </span>
          </h1>
          <p className="text-sm font-medium text-text-muted mt-2">
            Kelola dan sortir tiket masuk acak (*inbox*) dari Slack, email, dan
            integrasi eksternal lainnya.
          </p>
        </div>
        <span className="hidden sm:inline-block text-xs font-bold px-3 py-1 rounded-full bg-muted text-text-muted">
          {total} Isu
        </span>
      </div>

      {issues.length === 0 ? (
        <div className="flex-1 rounded-3xl border border-border bg-card shadow-sm flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted))_1px,transparent_1px)] bg-size-[40px_40px] opacity-10 pointer-events-none"></div>

          <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-sm z-10 relative">
            <Filter className="w-10 h-10 text-primary" strokeWidth={1.5} />
            <span className="absolute top-0 right-0 w-6 h-6 bg-background rounded-full border border-border flex items-center justify-center">
              <span className="w-2 h-2 bg-status-done rounded-full"></span>
            </span>
          </div>
          <h2 className="text-2xl font-bold text-text mb-3 tracking-tight z-10">
            Tidak Ada Isu Mengantre
          </h2>
          <p className="text-text-muted font-medium max-w-md z-10 leading-relaxed">
            Belum ada bug baru yang masuk ke antrean triage.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-text-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold">Issue</th>
                  <th className="px-6 py-4 font-bold">Alasan</th>
                  <th className="px-6 py-4 font-bold w-64">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {issues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-text">{issue.title}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {teamSlug}-{issue.number}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {issue.triageReason?.trim() ||
                        issue.reason?.trim() ||
                        issue.source ||
                        "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void handleAccept(issue.id)}
                          disabled={actionIssueId === issue.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-status-done hover:bg-status-done/90 text-primary-foreground text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ditangani
                        </button>
                        <button
                          onClick={() => void handleDecline(issue.id)}
                          disabled={actionIssueId === issue.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-priority-urgent hover:bg-priority-urgent/90 text-primary-foreground text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Dibatalkan
                        </button>
                        <button
                          onClick={() => void handleDelete(issue.id)}
                          disabled={actionIssueId === issue.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4 pb-8">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-text text-base leading-snug">{issue.title}</p>
                </div>
                <p className="text-[11px] font-bold tracking-wider text-text-muted bg-muted/50 inline-block px-2.5 py-1 rounded-md uppercase">
                  {teamSlug}-{issue.number}
                </p>
              </div>
              
              <div className="bg-muted/20 p-3 rounded-xl border border-border/50">
                <p className="text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Alasan / Sumber</p>
                <p className="text-sm font-medium text-text">
                  {issue.triageReason?.trim() || issue.reason?.trim() || issue.source || "-"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => void handleAccept(issue.id)}
                  disabled={actionIssueId === issue.id}
                  className="flex-1 justify-center inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-status-done hover:bg-status-done/90 text-primary-foreground text-[13px] font-bold transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Terima
                </button>
                <button
                  onClick={() => void handleDecline(issue.id)}
                  disabled={actionIssueId === issue.id}
                  className="flex-1 justify-center inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-priority-urgent hover:bg-priority-urgent/90 text-primary-foreground text-[13px] font-bold transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" />
                  Tolak
                </button>
                <button
                  onClick={() => void handleDelete(issue.id)}
                  disabled={actionIssueId === issue.id}
                  className="w-full justify-center inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 text-[13px] font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Permanen
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
      )}
    </div>
  );
}
