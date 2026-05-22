import type {
  Requirement,
  AiGenerateResult,
} from "@/lib/core/requirements.api";
import type { Issue } from "../models/Issue";

export interface RequirementsHeaderProps {
  teamSlug: string;
  hasBacklog: boolean;
  onGenerateClick: () => void;
  onCopyToDocsClick: () => void;
}

export interface RequirementsSummaryProps {
  frCount: number;
  nfrCount: number;
  totalRequirements: number;
}

export interface FrListProps {
  requirements: Requirement[];
  onDelete: (id: string) => void;
}

export interface NfrListProps {
  requirements: Requirement[];
  onDelete: (id: string) => void;
}

export interface AiGenerateModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  backlogIssues: Issue[];
  onClose: () => void;
  onGenerate: (issueId: string) => void;
}

export interface AiGenerateResultModalProps {
  isOpen: boolean;
  isSaving: boolean;
  result: AiGenerateResult | null;
  onClose: () => void;
  onSave: () => Promise<{ success: boolean; message: string }>;
}
