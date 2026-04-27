"use client";

import { useState, useEffect, useCallback } from "react";
import { PlanningHeader } from "@/components/header/PlanningHeader";
import { PlanningGoal } from "./PlanningGoal";
import { PlanningTable } from "@/components/tables/PlanningTable";
import { PlanningModal } from "@/components/modals/PlanningModal";
import { useTeamMembers } from "@/hooks/useTeams";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui";
import {
  standalonePlanningApi,
  type StandalonePlanning,
} from "@/lib/core/standalone-planning.api";
import { type PlanningUIItem } from "@/types/components/PlanningContainerTypes";
import { type PlanningItem } from "@/types/components/PlanningTableTypes";
import { type EditForm } from "@/types/components/PlanningModalTypes";

export function PlanningContainer() {
  const params = useParams();
  const teamSlug = String(params?.teamSlug || "");
  const { members: teamMembers, isLoading: membersLoading } =
    useTeamMembers(teamSlug);

  const [plannings, setPlannings] = useState<PlanningUIItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<PlanningUIItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [nextPlanningNumber, setNextPlanningNumber] = useState<number>(1);
  const [editForm, setEditForm] = useState<EditForm>({
    expectedOutput: [""],
    assigneeId: "",
    priority: "medium",
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Transform API response to UI format
  const transformPlanningToUI = useCallback(
    (planning: StandalonePlanning): PlanningUIItem => {
      // Map status dari backend ke UI
      let uiStatus = "To Do";
      if (planning.status === "in_execution") {
        uiStatus = "In Execution";
      } else if (planning.status === "completed") {
        uiStatus = "Done";
      } else if (planning.status === "cancelled") {
        uiStatus = "Cancelled";
      }

      return {
        id: planning.id,
        planningId: planning.id,
        number: planning.number,
        taskName: planning.title,
        featureName: planning.title,
        description: planning.description || "",
        expectedOutput: planning.plan_info
          ? [planning.plan_info]
          : [planning.description || ""],
        assignedUser: planning.assignee?.name || "Unassigned",
        assigneeId: planning.assignee_id || "",
        avatar: planning.assignee?.initials || "U",
        status: uiStatus,
        priority: planning.priority,
        startDate: planning.start_date,
        dueDate: planning.due_date,
        estimatedHours: planning.estimated_hours,
      };
    },
    [],
  );

  // Fetch standalone plannings (belum masuk issues table)
  const fetchPlannings = useCallback(async () => {
    if (!teamSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch SEMUA planning dari issue_planning untuk keperluan laporan
      // Termasuk yang sudah dipromote (in_execution), completed, dan cancelled
      const response = await standalonePlanningApi.listPlannings(teamSlug, {
        // Tidak ada filter status = tampilkan semua
      });

      const planningData = response.plannings.map(transformPlanningToUI);
      setPlannings(planningData);

      // Calculate next planning number
      const maxNumber =
        planningData.length > 0
          ? Math.max(...planningData.map((p) => p.number))
          : 0;
      setNextPlanningNumber(maxNumber + 1);
    } catch (err) {
      console.error("Error fetching plannings:", err);
      setError(
        err instanceof Error ? err.message : "Gagal mengambil daftar planning",
      );
    } finally {
      setIsLoading(false);
    }
  }, [teamSlug, transformPlanningToUI]);

  useEffect(() => {
    void fetchPlannings();
  }, [fetchPlannings]);

  const handleDelete = async (id: string) => {
    const item = plannings.find((p) => p.id === id);
    if (!item) return;

    if (!confirm("Yakin ingin menghapus planning ini?")) {
      return;
    }

    try {
      await standalonePlanningApi.deletePlanning(teamSlug, item.planningId);
      setPlannings((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting planning:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Gagal menghapus planning. Silakan coba lagi.",
      );
    }
  };

  const handlePromote = async (item: PlanningItem) => {
    // Convert PlanningItem to PlanningUIItem for promotion
    const uiItem = plannings.find((p) => p.id === item.id);
    if (!uiItem) return;

    if (
      !confirm(
        `Mulai eksekusi "${uiItem.featureName}"?\n\nPlanning akan dipindahkan ke Execution dan tidak bisa diubah lagi.`,
      )
    ) {
      return;
    }

    try {
      const result = await standalonePlanningApi.promotePlanningToExecution(
        teamSlug,
        uiItem.planningId,
      );

      // Update status planning menjadi "In Execution" tanpa menghapus dari list
      setPlannings((prev) =>
        prev.map((p) =>
          p.id === uiItem.id ? { ...p, status: "In Execution" } : p,
        ),
      );

      alert(
        `✅ ${result.message}\n\nIssue ${teamSlug.toUpperCase()}-${result.issue.number} berhasil dibuat!\n\nPlanning tetap terlihat di tab Planning dengan status "Dipromote".\nLihat progress di tab Execution.`,
      );
    } catch (error) {
      console.error("Error promoting planning:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Gagal promote planning ke execution. Silakan coba lagi.",
      );
    }
  };

  const openEditModal = (item: PlanningItem) => {
    // Convert PlanningItem to PlanningUIItem for editing
    const uiItem = plannings.find((p) => p.id === item.id);
    if (!uiItem) return;

    const matchedAssigneeId =
      uiItem.assigneeId ||
      teamMembers.find((member) => member.name === item.assignedUser)?.id ||
      "";

    setEditingItem(uiItem);
    setEditForm({
      featureName: uiItem.featureName,
      assigneeId: matchedAssigneeId,
      priority: uiItem.priority,
      expectedOutput: Array.isArray(uiItem.expectedOutput)
        ? [...uiItem.expectedOutput]
        : [uiItem.expectedOutput],
      startDate: uiItem.startDate,
      dueDate: uiItem.dueDate,
      estimatedHours: uiItem.estimatedHours,
    });
  };

  const saveEdit = async () => {
    if (!teamSlug) {
      console.error("❌ teamSlug is undefined!");
      return;
    }

    const planningTitle = editForm.featureName || "New Planning";
    const assigneeId = editForm.assigneeId || undefined;
    const planInfo = Array.isArray(editForm.expectedOutput)
      ? editForm.expectedOutput.join("\n")
      : editForm.expectedOutput;

    try {
      if (isCreating) {
        // Create new standalone planning (belum masuk issues table)
        const newPlanning = await standalonePlanningApi.createPlanning(
          teamSlug,
          {
            title: planningTitle,
            description: planInfo,
            priority: editForm.priority || "medium",
            assigneeId,
            startDate: editForm.startDate,
            dueDate: editForm.dueDate,
            estimatedHours: editForm.estimatedHours || 0,
            planInfo,
          },
        );

        const newUIItem = transformPlanningToUI(newPlanning);
        setPlannings((prev) => [newUIItem, ...prev]);
      } else if (editingItem) {
        // Update existing planning
        const updatedPlanning = await standalonePlanningApi.updatePlanning(
          teamSlug,
          editingItem.planningId,
          {
            title: planningTitle,
            description: planInfo,
            priority: editForm.priority,
            assigneeId,
            startDate: editForm.startDate,
            dueDate: editForm.dueDate,
            estimatedHours: editForm.estimatedHours || 0,
            planInfo,
          },
        );

        const updatedUIItem = transformPlanningToUI(updatedPlanning);
        setPlannings((prev) =>
          prev.map((p) => (p.id === editingItem.id ? updatedUIItem : p)),
        );
      }

      setEditingItem(null);
      setIsCreating(false);
      setEditForm({
        expectedOutput: [""],
        assigneeId: "",
        priority: "medium",
      });
    } catch (error) {
      console.error("Error saving planning:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data. Silakan coba lagi.",
      );
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditForm({
      expectedOutput: [""],
      assigneeId: "",
      priority: "medium",
    });
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsCreating(false);
    setEditForm({
      expectedOutput: [""],
      assigneeId: "",
      priority: "medium",
    });
  };

  const todoItems = plannings.filter((item) => item.status === "To Do").length;
  const inProgressItems = plannings.filter(
    (item) => item.status === "In Progress",
  ).length;
  const doneItems = plannings.filter((item) => item.status === "Done").length;
  const inExecutionItems = plannings.filter(
    (item) => item.status === "In Execution",
  ).length;

  // Total planning yang masih aktif (belum dipromote)
  const activePlannings = plannings.filter(
    (item) => item.status !== "In Execution",
  ).length;

  if (isLoading) {
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
            onClick={() => void fetchPlannings()}
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
          totalItems={activePlannings}
          todoItems={todoItems}
          inProgressItems={inProgressItems}
          doneItems={doneItems}
          inExecutionItems={inExecutionItems}
          plannings={plannings}
        />
        <PlanningTable
          plannings={plannings}
          mounted={mounted}
          teamSlug={teamSlug}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onPromote={handlePromote}
        />
      </div>

      <PlanningModal
        mounted={mounted}
        editingItem={editingItem}
        isCreating={isCreating}
        editForm={editForm}
        teamMembers={teamMembers}
        isMembersLoading={membersLoading}
        teamSlug={teamSlug}
        nextPlanningNumber={nextPlanningNumber}
        setEditForm={setEditForm}
        onClose={handleCloseModal}
        onSave={saveEdit}
      />
    </div>
  );
}
