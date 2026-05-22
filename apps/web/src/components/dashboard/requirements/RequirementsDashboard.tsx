"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Lightbulb, Wand2 } from "lucide-react";
import {
  requirementsApi,
  type Requirement,
  type RequirementPriority,
  type AiGenerateResult,
} from "@/lib/core/requirements.api";
import { useIssues } from "@/hooks/useIssues";
import { ExportToDocsButton } from "@/components/ui/ExportToDocsButton";
import Swal from "sweetalert2";
import type { Issue } from "@/types";

import { RequirementsSkeleton } from "./RequirementsSkeleton";
import { RequirementsSummary } from "./RequirementsSummary";
import { FrList } from "./FrList";
import { NfrList } from "./NfrList";
import { AiGenerateModal } from "./AiGenerateModal";
import { AiGenerateResultModal } from "./AiGenerateResultModal";

export function RequirementsDashboard() {
  const params = useParams();
  const teamSlug = String(params?.teamSlug || "");

  const [requirements, setRequirements] = useState<{
    fr: Requirement[];
    nfr: Requirement[];
  }>({ fr: [], nfr: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<AiGenerateResult | null>(
    null,
  );
  const [showResultModal, setShowResultModal] = useState(false);
  const [isSavingGenerate, setIsSavingGenerate] = useState(false);
  const [selectedIssueIdForAi, setSelectedIssueIdForAi] = useState<
    string | null
  >(null);

  // Fetch backlog issues for AI generation
  const { issues: backlogIssues } = useIssues(teamSlug, { status: "backlog" });

  const handleCopyToDocsSuccess = (documentUrl: string) => {
    Swal.fire({
      title: "Berhasil!",
      text: "Requirements berhasil disalin ke Google Docs.",
      icon: "success",
      confirmButtonText: "Buka Google Docs",
      showCancelButton: true,
      cancelButtonText: "Tutup",
      customClass: {
        popup: "bg-background text-text border border-border rounded-xl",
        title: "text-text",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(documentUrl, "_blank");
      }
    });
  };

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        setIsLoading(true);
        const data = await requirementsApi.list(teamSlug);
        setRequirements(data);
      } catch (err) {
        console.error("Error fetching requirements:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (teamSlug) {
      void fetchRequirements();
    }
  }, [teamSlug]);

  const handleAiGenerate = async (issueId: string) => {
    const issue = backlogIssues.find((i: Issue) => i.id === issueId);
    if (!issue) return;

    setIsGenerating(true);
    try {
      const result = await requirementsApi.aiGenerate(teamSlug, {
        issueTitle: issue.title,
        issueDescription: issue.description || "",
        role: "User",
      });

      setGenerateResult(result);
      setSelectedIssueIdForAi(issueId);
      setShowAiModal(false);
      setShowResultModal(true);
    } catch (error) {
      console.error("Error generating requirements:", error);
      Swal.fire({
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Gagal generate requirements",
        icon: "error",
        customClass: {
          popup: "bg-background text-text border border-border rounded-xl",
          title: "text-text",
        },
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAiGenerateResult = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    if (!generateResult || !selectedIssueIdForAi)
      return { success: false, message: "Data tidak lengkap" };

    setIsSavingGenerate(true);
    try {
      // Save all FR
      for (const fr of generateResult.fr) {
        await requirementsApi.create(teamSlug, {
          type: "FR",
          description: fr.description,
          priority: fr.priority as RequirementPriority,
          acceptanceCriteria: fr.acceptanceCriteria,
          issueId: selectedIssueIdForAi,
        });
      }

      // Save all NFR
      for (const nfr of generateResult.nfr) {
        await requirementsApi.create(teamSlug, {
          type: "NFR",
          description: nfr.description,
          priority: nfr.priority as RequirementPriority,
          nfrCategory: nfr.nfrCategory,
          acceptanceCriteria: nfr.acceptanceCriteria,
          issueId: selectedIssueIdForAi,
        });
      }

      // Refresh requirements list
      const updated = await requirementsApi.list(teamSlug);
      setRequirements(updated);

      return {
        success: true,
        message: `${generateResult.fr.length} FR dan ${generateResult.nfr.length} NFR berhasil disimpan.`,
      };
    } catch (error) {
      console.error("Error saving requirements:", error);
      return {
        success: false,
        message: "Gagal menyimpan requirements",
      };
    } finally {
      setIsSavingGenerate(false);
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    const result = await Swal.fire({
      title: "Hapus Requirement?",
      text: "Aksi ini tidak dapat dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      customClass: {
        popup: "bg-background text-text border border-border rounded-xl",
        title: "text-text",
      },
    });

    if (result.isConfirmed) {
      try {
        await requirementsApi.delete(teamSlug, id);
        const updated = await requirementsApi.list(teamSlug);
        setRequirements(updated);
        Swal.fire({
          title: "Terhapus",
          text: "Requirement berhasil dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: "bg-background text-text border border-border rounded-xl",
            title: "text-text",
          },
        });
      } catch (err) {
        console.error("Error deleting requirement:", err);
        Swal.fire({
          title: "Error",
          text: "Gagal menghapus requirement",
          icon: "error",
          customClass: {
            popup: "bg-background text-text border border-border rounded-xl",
            title: "text-text",
          },
        });
      }
    }
  };

  const totalRequirements = [...requirements.fr, ...requirements.nfr].length;

  if (isLoading) {
    return <RequirementsSkeleton />;
  }

  return (
    <div className="h-full flex flex-col bg-background p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto overflow-x-hidden w-full relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
            Requirements
          </h1>
          <p className="text-sm font-medium text-text-muted">
            Kelola Functional Requirements (FR) dan Non-Functional Requirements
            (NFR) proyek Anda.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover border border-primary-hover transition-all active:scale-[0.98]"
          >
            <Wand2 className="w-4 h-4" /> Auto-Draft dengan AI
          </button>
          <ExportToDocsButton
            teamSlug={teamSlug}
            type="requirements"
            onSuccess={handleCopyToDocsSuccess}
          />
        </div>
      </div>

      <RequirementsSummary
        frCount={requirements.fr.length}
        nfrCount={requirements.nfr.length}
        totalRequirements={totalRequirements}
      />

      {/* Info Box */}
      <div className="mb-6 sm:mb-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex gap-3 shadow-sm">
        <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">
            <strong>Tips:</strong> Gunakan fitur AI Generate untuk membuat draft
            FR dan NFR secara otomatis dari backlog item yang sudah ada.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 sm:gap-8">
        <FrList
          requirements={requirements.fr}
          onDelete={handleDeleteRequirement}
        />
        <NfrList
          requirements={requirements.nfr}
          onDelete={handleDeleteRequirement}
        />
      </div>

      <AiGenerateModal
        isOpen={showAiModal}
        isGenerating={isGenerating}
        backlogIssues={backlogIssues as Issue[]}
        onClose={() => setShowAiModal(false)}
        onGenerate={handleAiGenerate}
      />
      <AiGenerateResultModal
        isOpen={showResultModal}
        isSaving={isSavingGenerate}
        result={generateResult}
        onClose={() => {
          setShowResultModal(false);
          setGenerateResult(null);
          setSelectedIssueIdForAi(null);
        }}
        onSave={handleSaveAiGenerateResult}
      />
    </div>
  );
}
