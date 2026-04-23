"use client";

import React, { useState, useEffect } from "react";
import { ExecutionHeader } from "@/components/header/ExecutionHeader";
import { ExecutionTable } from "@/components/tables/ExecutionTable";
import { ExecutionModal } from "@/components/modals/ExecutionModal";
import { ExecutionBlockedModal } from "@/components/modals/ExecutionBlockedModal";
import { useIssues } from "@/hooks/useIssues";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui";

function mapIssueStatusToExecutionStatus(status: string) {
  switch (status) {
    case "backlog":
    case "todo":
      return "TO DO";
    case "in_progress":
      return "PROSES";
    case "in_review":
      return "REVIEW";
    case "bug":
      return "TERKENDALA";
    case "done":
      return "SELESAI";
    case "cancelled":
      return "CANCELLED";
    default:
      return "TO DO";
  }
}

function mapExecutionStatusToIssueStatus(status: string) {
  switch (status) {
    case "TO DO":
      return "todo";
    case "PROSES":
      return "in_progress";
    case "REVIEW":
      return "in_review";
    case "SELESAI":
      return "done";
    case "TERKENDALA":
      return "bug";
    case "CANCELLED":
      return "cancelled";
    default:
      return "todo";
  }
}

function resolveIssueTimestamp(issue: {
  updatedAt?: string;
  createdAt?: string;
}) {
  return issue.updatedAt || issue.createdAt || new Date().toISOString();
}

export function ExecutionContainer() {
  const params = useParams();
  const teamSlug = String(params?.teamSlug || "");
  const {
    issues: allIssues,
    isLoading: issuesLoading,
    error,
    refetch,
    updateIssue,
    deleteIssue,
  } = useIssues(teamSlug, {});

  const [executions, setExecutions] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    right: 0,
    isBottom: false,
  });
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [blockingItem, setBlockingItem] = useState<any | null>(null);
  const [blockedReason, setBlockedReason] = useState("");
  const [blockedReasonError, setBlockedReasonError] = useState<string | null>(
    null,
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Transform issues from hook
  useEffect(() => {
    if (!teamSlug || issuesLoading) return;

    // Transform issues to execution format
    const executionData = allIssues
      .filter((issue: any) =>
        [
          "backlog",
          "todo",
          "in_progress",
          "in_review",
          "done",
          "cancelled",
        ].includes(issue.status),
      )
      .map((issue: any, idx: number) => ({
        no: idx + 1,
        issueId: issue.id,
        issueStatus: issue.status,
        activity: issue.title,
        taskId: `${teamSlug}-${issue.number}`,
        date: new Date(
          issue.updatedAt || issue.updated_at || issue.createdAt,
        ).toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        assignedUser: issue.assignee?.name || "Unassigned",
        avatar: issue.assignee?.initials || "U",
        status: mapIssueStatusToExecutionStatus(issue.status),
        notes: issue.description || "Tidak ada catatan",
      }));

    setExecutions(executionData);
  }, [teamSlug, allIssues, issuesLoading]);

  const handleDelete = async (no: number) => {
    const item = executions.find((e) => e.no === no);
    if (!item) return;

    try {
      await deleteIssue(item.issueId);
      setExecutions(executions.filter((e) => e.no !== no));
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error deleting issue:", error);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditForm({ ...item });
    setOpenMenuId(null);
  };

  const saveEdit = async () => {
    try {
      const issueStatus = mapExecutionStatusToIssueStatus(editForm.status);

      const updatedIssue = await updateIssue(editingItem.issueId, {
        title: editForm.activity,
        description: editForm.notes,
        status: issueStatus,
        ...(issueStatus === "bug" ? { isTriaged: false } : {}),
        ...(issueStatus === "cancelled" ? { isTriaged: true } : {}),
      });

      setExecutions(
        executions.map((e) =>
          e.no === editingItem.no
            ? {
                ...e,
                ...editForm,
                status: mapIssueStatusToExecutionStatus(updatedIssue.status),
                issueStatus: updatedIssue.status,
                date: new Date(
                  resolveIssueTimestamp(updatedIssue),
                ).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : e,
        ),
      );
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating issue:", error);
    }
  };

  const handleAdvanceStatus = async (no: number, currentStatus: string) => {
    const item = executions.find((e) => e.no === no);
    if (!item) return;

    let nextStatus = currentStatus;
    if (currentStatus === "TO DO") {
      nextStatus = "PROSES";
    } else if (["PROSES", "REVIEW"].includes(currentStatus)) {
      nextStatus = "SELESAI";
    } else {
      return;
    }

    try {
      // Persist status transition to backend first.
      const updatedIssue = await updateIssue(item.issueId, {
        status: mapExecutionStatusToIssueStatus(nextStatus),
      });

      setExecutions(
        executions.map((e) =>
          e.no === no
            ? {
                ...e,
                status: mapIssueStatusToExecutionStatus(updatedIssue.status),
                issueStatus: updatedIssue.status,
                date: new Date(
                  resolveIssueTimestamp(updatedIssue),
                ).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : e,
        ),
      );
      setOpenMenuId(null);

      // Re-sync from DB to guarantee UI reflects persisted status.
      await refetch();
    } catch (error) {
      console.error("Error updating execution status:", error);
    }
  };

  const handleMarkBlocked = async (no: number) => {
    const item = executions.find((e) => e.no === no);
    if (!item || item.status === "TERKENDALA") return;

    setBlockingItem(item);
    setBlockedReason("");
    setBlockedReasonError(null);
  };

  const closeBlockedModal = () => {
    setBlockingItem(null);
    setBlockedReason("");
    setBlockedReasonError(null);
  };

  const submitBlockedReason = async () => {
    if (!blockingItem) return;

    const reasonValue = blockedReason.trim();
    if (!reasonValue) {
      setBlockedReasonError("Alasan terkendala wajib diisi.");
      return;
    }

    try {
      const updatedIssue = await updateIssue(blockingItem.issueId, {
        status: "bug",
        isTriaged: false,
        triageReason: reasonValue,
      });

      setExecutions(
        executions.map((e) =>
          e.no === blockingItem.no
            ? {
                ...e,
                status: mapIssueStatusToExecutionStatus(updatedIssue.status),
                issueStatus: updatedIssue.status,
                triageReason: reasonValue,
                date: new Date(
                  resolveIssueTimestamp(updatedIssue),
                ).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : e,
        ),
      );
      setOpenMenuId(null);
      closeBlockedModal();

      await refetch();
    } catch (error) {
      console.error("Error marking execution as blocked:", error);
    }
  };

  const handleMarkCancelled = async (no: number) => {
    const item = executions.find((e) => e.no === no);
    if (!item || item.status === "CANCELLED") return;

    try {
      const updatedIssue = await updateIssue(item.issueId, {
        status: "cancelled",
        isTriaged: true,
      });

      setExecutions(
        executions.map((e) =>
          e.no === no
            ? {
                ...e,
                status: mapIssueStatusToExecutionStatus(updatedIssue.status),
                issueStatus: updatedIssue.status,
                date: new Date(
                  resolveIssueTimestamp(updatedIssue),
                ).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : e,
        ),
      );
      setOpenMenuId(null);

      await refetch();
    } catch (error) {
      console.error("Error marking execution as cancelled:", error);
    }
  };

  if (issuesLoading) {
    return (
      <div className="h-full flex flex-col w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-50 bg-[hsl(var(--background))] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex justify-between items-center border-b border-border shadow-sm">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-muted/60" />
            <Skeleton className="h-4 w-64 bg-muted/60" />
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl bg-muted/60" />
          <Skeleton className="h-[400px] w-full rounded-2xl bg-muted/60" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-priority-urgent">{error}</p>
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
    <div className="h-full flex flex-col bg-background animate-fade-in overflow-y-auto overflow-x-hidden w-full">
      <ExecutionHeader teamSlug={teamSlug} />

      <div className="p-4 sm:p-6 lg:p-8 flex flex-col overflow-x-hidden">
        <ExecutionTable
          executions={executions}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          menuPosition={menuPosition}
          setMenuPosition={setMenuPosition}
          onEdit={openEditModal}
          onMarkBlocked={handleMarkBlocked}
          onMarkCancelled={handleMarkCancelled}
          onDelete={handleDelete}
          onAdvanceStatus={handleAdvanceStatus}
          mounted={mounted}
        />
      </div>

      {openMenuId && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpenMenuId(null)}
        ></div>
      )}

      <ExecutionModal
        mounted={mounted}
        editingItem={editingItem}
        editForm={editForm}
        setEditForm={setEditForm}
        onClose={() => setEditingItem(null)}
        onSave={saveEdit}
      />

      <ExecutionBlockedModal
        mounted={mounted}
        blockingItem={blockingItem}
        blockedReason={blockedReason}
        blockedReasonError={blockedReasonError}
        onReasonChange={(value: string) => {
          setBlockedReason(value);
          if (blockedReasonError) {
            setBlockedReasonError(null);
          }
        }}
        onClose={closeBlockedModal}
        onSubmit={submitBlockedReason}
      />
    </div>
  );
}
