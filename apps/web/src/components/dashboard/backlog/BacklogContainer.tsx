"use client";

import React, { useState, useEffect } from "react";
import { BacklogHeader } from "@/components/header/BacklogHeader";
import { BacklogTabs } from "@/components/tabs/BacklogTabs";
import { BacklogTable } from "@/components/tables/BacklogTable";
import { BacklogModal } from "@/components/modals/BacklogModal";
import { Skeleton, Button } from "@/components/ui";
import { useIssues } from "@/hooks/useIssues";
import { useParams } from "next/navigation";
import { tokenStorage } from "@/lib/core";
import type { Issue } from "@/types/models/Issue";
import type { BacklogItem } from "@/types/components/BacklogContainerTypes";

function getTargetUserValue(issue: Issue): string {
  // Read target_user from planning (separate from plan_info / Output yang Diharapkan)
  const targetUser = issue.planning?.target_user;

  if (typeof targetUser !== "string") return "";

  const normalizedValue = targetUser.trim();
  if (!normalizedValue) return "";
  if (normalizedValue.toLowerCase() === "belum ditentukan") return "";

  return normalizedValue;
}

function mapPriorityLabelToIssuePriority(
  priorityLabel: unknown,
): string | undefined {
  if (priorityLabel === "TINGGI") return "high";
  if (priorityLabel === "SEDANG") return "medium";
  if (priorityLabel === "RENDAH") return "low";

  return undefined;
}

const PRIORITY_DISPLAY_MAP: Record<
  string,
  { label: string; className: string }
> = {
  high: {
    label: "TINGGI",
    className:
      "text-priority-urgent bg-priority-urgent/10 border-priority-urgent/20",
  },
  medium: {
    label: "SEDANG",
    className: "text-priority-high bg-priority-high/10 border-priority-high/20",
  },
  low: {
    label: "RENDAH",
    className: "text-priority-low bg-priority-low/10 border-priority-low/20",
  },
};

export function BacklogContainer() {
  const params = useParams();
  const teamSlug = String(params?.teamSlug || "");
  const {
    issues: allIssues,
    isLoading: issuesLoading,
    error,
    refetch,
    updateIssue,
    deleteIssue,
    createIssue,
  } = useIssues(teamSlug, {});

  const [activeTab, setActiveTab] = useState<"product" | "priority">("product");
  const [mounted, setMounted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    right: 0,
    isBottom: false,
  });
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<Partial<BacklogItem>>({});

  // Set mounted state - this is a common pattern for client-side only rendering
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Compute derived state from issues - no need to store in state
  const products: BacklogItem[] = React.useMemo(() => {
    if (!teamSlug || issuesLoading) return [];

    return allIssues
      .filter((issue: Issue) => issue.status === "backlog")
      .map((issue: Issue) => ({
        id: `${teamSlug}-${issue.number}`,
        issueId: issue.id,
        featureName: issue.title,
        description: issue.description || "Tidak ada deskripsi",
        targetUser: getTargetUserValue(issue),
      }));
  }, [teamSlug, allIssues, issuesLoading]);

  const priorities: BacklogItem[] = React.useMemo(() => {
    if (!teamSlug || issuesLoading) return [];

    return allIssues
      .filter(
        (issue: Issue) =>
          issue.status === "backlog" &&
          ["high", "medium", "low"].includes(issue.priority),
      )
      .map((issue: Issue) => {
        const display = PRIORITY_DISPLAY_MAP[issue.priority];
        const priorityClass = display?.className ?? "";
        const triageReason =
          (issue as any).triage?.reason ?? issue.reason ?? "";

        return {
          id: `${teamSlug}-${issue.number}`,
          issueId: issue.id,
          featureName: issue.title,
          priority: display?.label ?? "",
          priorityClass,
          reason: triageReason,
        };
      });
  }, [teamSlug, allIssues, issuesLoading]);

  const executionCandidates: BacklogItem[] = React.useMemo(() => {
    if (!teamSlug || issuesLoading) return [];

    return allIssues
      .filter((issue: Issue) =>
        ["todo", "in_progress", "in_review", "done", "cancelled"].includes(
          issue.status,
        ),
      )
      .map((issue: Issue) => ({
        issueId: issue.id,
        id: `${teamSlug}-${issue.number}`,
        featureName: issue.title,
        description: issue.description || "Tidak ada deskripsi",
        targetUser: getTargetUserValue(issue),
        reason: (issue as any).triage?.reason ?? issue.reason ?? "",
        priority: issue.priority,
        status: issue.status,
      }));
  }, [teamSlug, allIssues, issuesLoading]);

  const handleDelete = async (id: string) => {
    const item =
      activeTab === "product"
        ? products.find((p) => p.id === id)
        : priorities.find((p) => p.id === id);

    if (!item) return;

    try {
      await updateIssue(item.issueId, { status: "todo" });
      // Data will be automatically updated via refetch in useIssues hook
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error reverting issue to execution:", error);
    }
  };

  const openEditModal = (item: BacklogItem) => {
    setEditingItem(item);
    setEditForm({ ...item });
    setOpenMenuId(null);
  };

  const saveEdit = async () => {
    if (!editingItem && !isCreating) return;

    try {
      const priorityReason =
        typeof editForm.reason === "string" ? editForm.reason.trim() : "";
      const targetUserValue =
        typeof editForm.targetUser === "string"
          ? editForm.targetUser.trim()
          : "";

      if (isCreating) {
        let finalIssueId = editForm.executionIssueId;

        if (!finalIssueId) {
          if (!editForm.featureName) {
            console.error("Nama Fitur harus diisi");
            return;
          }
          // Manual creation without picking execution item
          const newIssue = await createIssue({
            title: editForm.featureName,
            description:
              activeTab === "product" ? editForm.description : undefined,
            status: "backlog",
            priority:
              activeTab === "priority"
                ? mapPriorityLabelToIssuePriority(editForm.priority)
                : undefined,
            reason:
              activeTab === "priority"
                ? priorityReason || undefined
                : undefined,
          });
          finalIssueId = newIssue.id;
        } else {
          // Update the selected execution item
          await updateIssue(finalIssueId, {
            title: editForm.featureName,
            description:
              activeTab === "product" ? editForm.description : undefined,
            status: "backlog",
            priority:
              activeTab === "priority"
                ? mapPriorityLabelToIssuePriority(editForm.priority)
                : undefined,
            reason:
              activeTab === "priority"
                ? priorityReason || undefined
                : undefined,
          });
        }

        // Update planInfo via issue_planning table
        if (activeTab === "product" && targetUserValue && finalIssueId) {
          const token = tokenStorage.getAccess();
          await fetch(`/api/issues/${finalIssueId}/planning`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              target_user: targetUserValue,
            }),
          });
        }
      } else if (editingItem) {
        // Update existing issue
        await updateIssue(editingItem.issueId, {
          title: editForm.featureName,
          description:
            activeTab === "product" ? editForm.description : undefined,
          priority:
            activeTab === "priority"
              ? mapPriorityLabelToIssuePriority(editForm.priority)
              : undefined,
          reason:
            activeTab === "priority" ? priorityReason || undefined : undefined,
        });

        // Update planInfo via issue_planning table
        if (activeTab === "product") {
          const token = tokenStorage.getAccess();
          await fetch(`/api/issues/${editingItem.issueId}/planning`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              target_user: targetUserValue || null,
            }),
          });
        }
      }

      // Refetch data to get updated planInfo
      await refetch();

      setEditingItem(null);
      setIsCreating(false);
    } catch (error) {
      console.error("Error saving issue:", error);
    }
  };

  if (issuesLoading) {
    return (
      <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 space-y-8 w-full animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-muted/60" />
            <Skeleton className="h-4 w-64 bg-muted/60" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl bg-muted/60" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg bg-muted/60" />
          <Skeleton className="h-10 w-24 rounded-lg bg-muted/60" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-priority-urgent">{error}</p>
          <Button
            onClick={() => void refetch()}
            variant="secondary"
            size="sm"
            className="font-semibold shadow-sm active:scale-95"
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto overflow-x-hidden relative w-full">
      <BacklogHeader
        teamSlug={teamSlug}
        onCreateClick={setIsCreating}
        onSetEditForm={setEditForm}
        onSetOpenMenuId={setOpenMenuId}
      />

      <BacklogTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <BacklogTable
        activeTab={activeTab}
        products={products}
        priorities={priorities}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        menuPosition={menuPosition}
        setMenuPosition={setMenuPosition}
        onEdit={openEditModal}
        onDelete={handleDelete}
        mounted={mounted}
      />

      {openMenuId && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpenMenuId(null)}
        ></div>
      )}

      <BacklogModal
        mounted={mounted}
        editingItem={editingItem}
        isCreating={isCreating}
        editForm={editForm}
        executionCandidates={executionCandidates}
        setEditForm={setEditForm}
        activeTab={activeTab}
        onClose={() => {
          setEditingItem(null);
          setIsCreating(false);
        }}
        onSave={saveEdit}
      />
    </div>
  );
}
