import React from "react";
import { AlertCircle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";

export function ExecutionBlockedModal({
  mounted,
  blockingItem,
  blockedReason,
  blockedReasonError,
  onReasonChange,
  onClose,
  onSubmit,
}: any) {
  const { colorTheme } = useThemeStore();
  const isDarkMode =
    mounted &&
    (colorTheme === "amerta-night" ||
      (typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")));

  if (!mounted || !blockingItem) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-100 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in text-left",
        isDarkMode ? "bg-black/70" : "bg-black/40",
      )}
    >
      <div
        className={cn(
          "w-full max-w-xl rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl",
          isDarkMode
            ? "bg-background-secondary border border-border/70"
            : "bg-white border border-slate-200",
        )}
      >
        <div className="flex items-start justify-between px-8 pt-8 pb-4">
          <div className="flex gap-4">
            <div className="p-3 rounded-full bg-priority-high/10 text-priority-high shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-2xl text-text">
                Tandai Terkendala
              </h3>
              <p className="text-text-muted text-sm mt-1">
                Isi alasan kendala untuk aktivitas {blockingItem.taskId}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-text-muted hover:text-text"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div
          className={cn(
            "mx-8 border-b",
            isDarkMode ? "border-border/60" : "border-slate-200",
          )}
        />

        <div className="px-8 py-5 space-y-2">
          <label className="block text-sm font-medium text-text">
            Alasan Terkendala
          </label>
          <textarea
            value={blockedReason}
            onChange={(event) => onReasonChange(event.target.value)}
            rows={4}
            placeholder="Contoh: Menunggu akses API produksi dari tim platform"
            className={cn(
              "flex w-full rounded px-3 py-2 text-sm placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none",
              isDarkMode
                ? "bg-background border border-input"
                : "bg-white border border-slate-200",
            )}
          />
          {blockedReasonError && (
            <p className="text-xs text-priority-urgent">{blockedReasonError}</p>
          )}
        </div>

        <div
          className={cn(
            "px-8 py-5 border-t flex justify-end gap-3 mt-auto rounded-b-2xl",
            isDarkMode
              ? "border-border/60 bg-background-tertiary/80"
              : "border-slate-200 bg-slate-50",
          )}
        >
          <Button
            variant="secondary"
            onClick={onClose}
            className={cn(
              "px-6 text-text font-semibold",
              isDarkMode
                ? "bg-muted hover:bg-muted/80"
                : "bg-slate-100 hover:bg-slate-200",
            )}
          >
            Batal
          </Button>
          <Button
            onClick={onSubmit}
            className="px-6 font-bold shadow-lg shadow-priority-high/20 bg-priority-high hover:bg-priority-high/90 text-primary-foreground"
          >
            Simpan Kendala
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
