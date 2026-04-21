"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { exportApi, type ExportType } from "@/lib/core";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ExportToDocsButtonProps {
  teamSlug: string;
  type: ExportType;
  label?: string;
  className?: string;
  onSuccess?: (documentUrl: string) => void;
}

type ExportState = "idle" | "loading" | "success" | "error";

const TYPE_LABEL: Record<ExportType, string> = {
  planning: "Planning",
  backlog: "Backlog",
  execution: "Execution",
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

  const baseLabel = label ?? `Copy ${TYPE_LABEL[type]} to Docs`;

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
      ? "Menyalin..."
      : state === "success"
        ? "Tersalin"
        : state === "error"
          ? "Gagal"
          : baseLabel;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        type="button"
        onClick={handleExport}
        disabled={!teamSlug || state === "loading"}
        className={cn(
          "border border-border bg-card text-text hover:bg-muted/70",
          state === "success" &&
            "border-green-500/40 bg-green-500/10 text-green-700",
          state === "error" &&
            "border-priority-urgent/40 bg-priority-urgent/10 text-priority-urgent",
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4",
            state === "loading" && "animate-spin",
            state === "success" && "text-green-700",
            state === "error" && "text-priority-urgent",
          )}
        />
        <span>{visibleLabel}</span>
      </Button>

      {message ? (
        <p
          className={cn(
            "text-xs font-medium",
            state === "success" && "text-green-700",
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
