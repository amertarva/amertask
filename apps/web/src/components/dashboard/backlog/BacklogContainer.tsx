"use client";

import React, { useState, useEffect } from "react";
import { BacklogHeader } from "@/components/header/BacklogHeader";
import { BacklogTabs } from "@/components/tabs/BacklogTabs";
import { BacklogTable } from "@/components/tables/BacklogTable";
import { BacklogModal } from "@/components/modals/BacklogModal";
import { useIssues } from "@/hooks/useIssues";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function getTargetUserValue(issue: any) {
  const rawValue = issue.planInfo ?? issue.plan_info ?? "";

  if (typeof rawValue !== "string") return "";

  const normalizedValue = rawValue.trim();
  if (!normalizedValue) return "";
  if (normalizedValue.toLowerCase() === "belum ditentukan") return "";

  return normalizedValue;
}

function mapPriorityLabelToIssuePriority(priorityLabel: unknown) {
  if (priorityLabel === "TINGGI") return "urgent";
  if (priorityLabel === "SEDANG") return "high";
  if (priorityLabel === "RENDAH") return "low";

  return undefined;
}

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
  } = useIssues(teamSlug, {});

  const [activeTab, setActiveTab] = useState<"product" | "priority">("product");
  const [products, setProducts] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [executionCandidates, setExecutionCandidates] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    right: 0,
    isBottom: false,
  });
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Transform issues from hook
  useEffect(() => {
    if (!teamSlug || issuesLoading) return;

    // Transform to product backlog (all backlog issues)
    const productData = allIssues
      .filter((issue: any) => issue.status === "backlog")
      .map((issue: any) => ({
        id: `${teamSlug}-${issue.number}`,
        issueId: issue.id,
        featureName: issue.title,
        description: issue.description || "Tidak ada deskripsi",
        targetUser: getTargetUserValue(issue),
      }));

    // Transform to priority backlog (urgent/high priority)
    const priorityData = allIssues
      .filter(
        (issue: any) =>
          issue.status === "backlog" &&
          ["urgent", "high"].includes(issue.priority),
      )
      .map((issue: any) => {
        const priorityClass =
          issue.priority === "urgent"
            ? "text-priority-urgent bg-priority-urgent/10 border-priority-urgent/20"
            : "text-priority-high bg-priority-high/10 border-priority-high/20";

        return {
          id: `${teamSlug}-${issue.number}`,
          issueId: issue.id,
          featureName: issue.title,
          priority: issue.priority === "urgent" ? "TINGGI" : "SEDANG",
          priorityClass,
          reason: issue.reason || "",
        };
      });

    setProducts(productData);
    setPriorities(priorityData);

    const candidates = allIssues
      .filter((issue: any) =>
        ["todo", "in_progress", "in_review", "done", "cancelled"].includes(
          issue.status,
        ),
      )
      .map((issue: any) => ({
        issueId: issue.id,
        id: `${teamSlug}-${issue.number}`,
        featureName: issue.title,
        description: issue.description || "Tidak ada deskripsi",
        targetUser: getTargetUserValue(issue),
        reason: issue.reason || "",
        priority: issue.priority,
        status: issue.status,
      }));

    setExecutionCandidates(candidates);
  }, [teamSlug, allIssues, issuesLoading]);

  const handleDelete = async (id: string) => {
    const item =
      activeTab === "product"
        ? products.find((p) => p.id === id)
        : priorities.find((p) => p.id === id);

    if (!item) return;

    try {
      await deleteIssue(item.issueId);

      if (activeTab === "product") {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        setPriorities(priorities.filter((p) => p.id !== id));
      }
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
      const targetUserValue =
        typeof editForm.targetUser === "string"
          ? editForm.targetUser.trim()
          : "";

      if (isCreating) {
        const selectedExecutionId = editForm.executionIssueId;
        if (!selectedExecutionId) {
          console.error("Execution issue belum dipilih");
          return;
        }

        await updateIssue(selectedExecutionId, {
          status: "backlog",
          priority:
            activeTab === "priority"
              ? mapPriorityLabelToIssuePriority(editForm.priority)
              : undefined,
          planInfo: activeTab === "product" ? targetUserValue : undefined,
        });

        setExecutionCandidates(
          executionCandidates.filter(
            (item) => item.issueId !== selectedExecutionId,
          ),
        );
      } else {
        // Update existing issue
        await updateIssue(editingItem.issueId, {
          title: editForm.featureName,
          description:
            activeTab === "product" ? editForm.description : editForm.reason,
          priority:
            activeTab === "priority"
              ? mapPriorityLabelToIssuePriority(editForm.priority)
              : undefined,
          planInfo: activeTab === "product" ? targetUserValue : undefined,
        });

        if (activeTab === "product") {
          setProducts(
            products.map((p) =>
              p.id === editingItem.id ? { ...p, ...editForm } : p,
            ),
          );
        } else {
          const priorityClass =
            editForm.priority === "TINGGI"
              ? "text-priority-urgent bg-priority-urgent/10 border-priority-urgent/20"
              : "text-priority-high bg-priority-high/10 border-priority-high/20";

          setPriorities(
            priorities.map((p) =>
              p.id === editingItem.id
                ? { ...p, ...editForm, priorityClass }
                : p,
            ),
          );
        }
      }
      setEditingItem(null);
      setIsCreating(false);
    } catch (error) {
      console.error("Error saving issue:", error);
    }
  };

  if (issuesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="h-full flex flex-col bg-background p-6 lg:p-8 animate-fade-in overflow-y-auto relative">
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
