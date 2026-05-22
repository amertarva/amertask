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
          "w-full max-w-xl rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl transition-all duration-300",
          isDarkMode
            ? "bg-background-secondary border border-border/70"
            : "bg-white border border-slate-200",
        )}
      >
        <div className="flex items-start justify-between px-8 pt-8 pb-4">
          <div className="flex gap-4">
            <div className="p-3.5 rounded-2xl bg-priority-urgent/10 text-priority-urgent border border-priority-urgent/20 shadow-sm shrink-0 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-2xl text-text tracking-tight">
                Tandai Terkendala
              </h3>
              <p className="text-text-muted text-sm mt-1 leading-relaxed">
                Isi alasan kendala untuk aktivitas <span className="font-bold text-text">{blockingItem.taskId}</span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-text-muted hover:text-text hover:bg-muted/50 transition-all active:scale-95"
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

        <div className="px-8 py-5 space-y-3">
          <label className="block text-sm font-semibold text-text ml-1">
            Alasan Terkendala
          </label>
          <textarea
            value={blockedReason}
            onChange={(event) => onReasonChange(event.target.value)}
            rows={4}
            placeholder="Contoh: Menunggu akses API produksi dari tim platform..."
            className={cn(
              "flex w-full rounded-xl px-4 py-3 text-sm placeholder:text-text-subtle/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-priority-urgent/30 focus-visible:border-priority-urgent/60 resize-none font-medium transition-all duration-200",
              isDarkMode
                ? "bg-background border border-input hover:border-border-strong/50"
                : "bg-white border border-slate-200 hover:border-slate-300",
            )}
          />
          {blockedReasonError && (
            <p className="text-xs text-priority-urgent font-bold ml-1">{blockedReasonError}</p>
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
              "px-6 h-11 text-text font-bold rounded-xl transition-all duration-150 active:scale-95",
              isDarkMode
                ? "bg-muted/70 hover:bg-muted"
                : "bg-slate-100 hover:bg-slate-200",
            )}
          >
            Batal
          </Button>
          <Button
            onClick={onSubmit}
            className={cn(
              "px-6 h-11 font-bold rounded-xl shadow-lg shadow-priority-urgent/25 bg-priority-urgent hover:bg-priority-urgent/90 text-primary-foreground transition-all duration-150 active:scale-95",
              isDarkMode ? "border border-priority-urgent/30" : "border border-priority-urgent/20"
            )}
          >
            Simpan Kendala
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
