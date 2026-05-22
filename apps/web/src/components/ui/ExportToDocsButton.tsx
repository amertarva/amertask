"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { exportApi, type ExportType } from "@/lib/core";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type {
  ExportState,
  ExportToDocsButtonProps,
} from "@/types/components/ExportToDocsButtonProps";

const TYPE_LABEL: Record<ExportType, string> = {
  planning: "Perencanaan",
  backlog: "Backlog",
  execution: "Eksekusi",
  requirements: "Requirement",
  srs: "SRS",
};

export function ExportToDocsButton({
  teamSlug,
  type,
  label,
  className,
  onSuccess,
}: ExportToDocsButtonProps) {
  const [state, setState] = useState<ExportState>("idle");
  const [message, setMessage] = useState("");
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseLabel = label ?? `Ekspor ${TYPE_LABEL[type]} ke Google Docs`;

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const resetStateAfter = (milliseconds: number) => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = setTimeout(() => {
      setState("idle");
      setMessage("");
    }, milliseconds);
  };

  const handleExport = async () => {
    if (!teamSlug || state === "loading") return;

    setState("loading");
    setMessage("");

    try {
      const result = await exportApi.copyToDocs(teamSlug, type);
      setState("success");
      setMessage(`${result.totalItems} item berhasil disalin.`);
      onSuccess?.(result.documentUrl);
      resetStateAfter(3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal menyalin data ke Google Docs";

      setState("error");
      setMessage(errorMessage);
      resetStateAfter(5000);
    }
  };

  const Icon =
    state === "loading"
      ? Loader2
      : state === "success"
        ? CheckCircle2
        : state === "error"
          ? AlertCircle
          : Copy;

  const visibleLabel =
    state === "loading"
      ? "Mengekspor..."
      : state === "success"
        ? "Berhasil Diekspor"
        : state === "error"
          ? "Gagal"
          : baseLabel;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        type="button"
        onClick={handleExport}
        disabled={!teamSlug || state === "loading"}
        variant="ghost"
        className={cn(
          "border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary transition-all font-semibold shadow-sm active:scale-95",
          state === "success" &&
            "border-status-done/30 bg-status-done/10 text-status-done hover:bg-status-done/15 hover:text-status-done",
          state === "error" &&
            "border-priority-urgent/30 bg-priority-urgent/10 text-priority-urgent hover:bg-priority-urgent/15 hover:text-priority-urgent",
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4",
            state === "loading" && "animate-spin",
            state === "success" && "text-status-done",
            state === "error" && "text-priority-urgent",
          )}
        />
        <span>{visibleLabel}</span>
      </Button>

      {message ? (
        <p
          className={cn(
            "text-xs font-medium mt-1",
            state === "success" && "text-status-done",
            state === "error" && "text-priority-urgent",
            state === "loading" && "text-text-muted",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
