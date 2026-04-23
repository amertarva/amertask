"use client";

import React, { useState, useEffect } from "react";
import { PlanningHeader } from "@/components/header/PlanningHeader";
import { PlanningGoal } from "./PlanningGoal";
import { PlanningTable } from "@/components/tables/PlanningTable";
import { PlanningModal } from "@/components/modals/PlanningModal";
import { useIssues } from "@/hooks/useIssues";
import { useTeamMembers } from "@/hooks/useTeams";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui";

export function PlanningContainer() {
  const params = useParams();
  const teamSlug = String(params?.teamSlug || "");
  const { members: teamMembers, isLoading: membersLoading } =
    useTeamMembers(teamSlug);
  const {
    issues: allIssues,
    isLoading: issuesLoading,
    error,
    refetch,
    createIssue,
    updateIssue,
    deleteIssue,
  } = useIssues(teamSlug, {});

  const [plannings, setPlannings] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    right: 0,
    isBottom: false,
  });
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Transform issues from hook to planning format
  useEffect(() => {
    if (!teamSlug || issuesLoading) return;

    // Transform issues to planning format
    const planningData = allIssues
      .filter((issue: any) => issue.status === "backlog")
      .map((issue: any) => ({
        id: `${teamSlug}-${issue.number}`,
        issueId: issue.id,
        number: issue.number,
        taskName: issue.title,
        featureName: issue.title,
        description: issue.description || "",
        expectedOutput: issue.description ? [issue.description] : [""],
        assignedUser: issue.assignee?.name || "Unassigned",
        assigneeId: issue.assignee?.id || issue.assigneeId || "",
        avatar: issue.assignee?.initials || "U",
        status: "To Do",
        priority: issue.priority,
      }));

    setPlannings(planningData);
  }, [teamSlug, allIssues, issuesLoading]);

  const handleDelete = async (id: string) => {
    const item = plannings.find((p) => p.id === id);
    if (!item) return;

    try {
      await deleteIssue(item.issueId);
      setPlannings(plannings.filter((p) => p.id !== id));
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error deleting issue:", error);
    }
  };

  const openEditModal = (item: any) => {
    const matchedAssigneeId =
      item.assigneeId ||
      teamMembers.find((member) => member.name === item.assignedUser)?.id ||
      "";

    setEditingItem(item);
    setEditForm({
      ...item,
      assigneeId: matchedAssigneeId,
      expectedOutput: Array.isArray(item.expectedOutput)
        ? [...item.expectedOutput]
        : [item.expectedOutput],
    });
    setOpenMenuId(null);
  };

  const saveEdit = async () => {
    if (!teamSlug) {
      console.error("❌ teamSlug is undefined!");
      return;
    }

    const issueTitle = editForm.featureName || editForm.taskName || "New Task";
    const assigneeId = editForm.assigneeId || undefined;

    try {
      if (isCreating) {
        // Create new issue
        const newIssue = await createIssue({
          title: issueTitle,
          description: Array.isArray(editForm.expectedOutput)
            ? editForm.expectedOutput.join("\n")
            : editForm.expectedOutput,
          status: "backlog",
          priority: editForm.priority || "medium",
          assigneeId,
        });

        setPlannings([
          {
            id: `${teamSlug}-${newIssue.number}`,
            issueId: newIssue.id,
            number: newIssue.number,
            taskName: newIssue.title,
            featureName: newIssue.title,
            description: newIssue.description || "",
            expectedOutput: [newIssue.description || ""],
            assignedUser: newIssue.assignee?.name || "Unassigned",
            assigneeId: newIssue.assignee?.id || newIssue.assigneeId || "",
            avatar: newIssue.assignee?.initials || "U",
            status: "To Do",
            priority: newIssue.priority,
          },
          ...plannings,
        ]);
      } else {
        // Update existing issue
        const updatedIssue = await updateIssue(editingItem.issueId, {
          title: issueTitle,
          description: Array.isArray(editForm.expectedOutput)
            ? editForm.expectedOutput.join("\n")
            : editForm.expectedOutput,
          priority: editForm.priority,
          assigneeId,
        });

        setPlannings(
          plannings.map((p) =>
            p.id === editingItem?.id
              ? {
                  ...p,
                  ...editForm,
                  taskName: updatedIssue.title,
                  featureName: updatedIssue.title,
                  description: updatedIssue.description || "",
                  assigneeId:
                    updatedIssue.assignee?.id || updatedIssue.assigneeId || "",
                  assignedUser: updatedIssue.assignee?.name || "Unassigned",
                  avatar: updatedIssue.assignee?.initials || "U",
                }
              : p,
          ),
        );
      }
      setEditingItem(null);
      setIsCreating(false);
    } catch (error) {
      console.error("Error saving issue:", error);
    }
  };

  const handleCreateNew = () => {
    const highestIssueNumber = allIssues.reduce((max: number, issue: any) => {
      const issueNumber = Number(issue?.number ?? 0);
      return Number.isFinite(issueNumber) ? Math.max(max, issueNumber) : max;
    }, 0);
    const nextIssueNumber = highestIssueNumber + 1;

    setIsCreating(true);
    setEditForm({
      id: `${teamSlug}-${nextIssueNumber}`,
      status: "To Do",
      expectedOutput: [""],
      assigneeId: "",
    });
    setOpenMenuId(null);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsCreating(false);
  };

  const todoItems = plannings.filter((item) => item.status === "To Do").length;
  const inProgressItems = plannings.filter(
    (item) => item.status === "In Progress",
  ).length;
  const doneItems = plannings.filter((item) => item.status === "Done").length;

  if (issuesLoading) {
    return (
      <div className="h-full flex flex-col w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-50 bg-[hsl(var(--background))] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex justify-between items-center border-b border-border shadow-sm">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-muted/60" />
            <Skeleton className="h-4 w-64 bg-muted/60" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl bg-muted/60" />
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
      <PlanningHeader onCreateClick={handleCreateNew} teamSlug={teamSlug} />
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col">
        <PlanningGoal
          totalItems={plannings.length}
          todoItems={todoItems}
          inProgressItems={inProgressItems}
          doneItems={doneItems}
        />
        <PlanningTable
          plannings={plannings}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          setMenuPosition={setMenuPosition}
          menuPosition={menuPosition}
          mounted={mounted}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      </div>

      {openMenuId && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpenMenuId(null)}
        ></div>
      )}

      <PlanningModal
        mounted={mounted}
        editingItem={editingItem}
        isCreating={isCreating}
        editForm={editForm}
        teamMembers={teamMembers}
        isMembersLoading={membersLoading}
        setEditForm={setEditForm}
        onClose={handleCloseModal}
        onSave={saveEdit}
      />
    </div>
  );
}
