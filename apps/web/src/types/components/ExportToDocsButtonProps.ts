import type { ExportType } from "@/lib/core";

export interface ExportToDocsButtonProps {
  teamSlug: string;
  type: ExportType;
  label?: string;
  className?: string;
  onSuccess?: (documentUrl: string) => void;
}

export type ExportState = "idle" | "loading" | "success" | "error";
