"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  X,
  ListTodo,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";
import { motion, AnimatePresence } from "motion/react";
import type { AiGenerateResultModalProps } from "@/types/components/RequirementsTypes";

export function AiGenerateResultModal({
  isOpen,
  isSaving,
  result,
  onClose,
  onSave,
}: AiGenerateResultModalProps) {
  const [mounted, setMounted] = useState(false);
  const { colorTheme } = useThemeStore();
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSavingLocal, setIsSavingLocal] = useState(false);

  const isDarkMode =
    mounted &&
    (colorTheme === "amerta-night" ||
      (typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSaveResult(null);
      setIsSavingLocal(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSavingLocal(true);
    try {
      const res = await onSave();
      setSaveResult(res);
    } catch (error) {
      setSaveResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan yang tidak terduga.",
      });
    } finally {
      setIsSavingLocal(false);
    }
  };

  if (!isOpen || !mounted || !result) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in text-left",
        isDarkMode ? "bg-black/70" : "bg-black/40",
      )}
    >
      <div
        className={cn(
          "w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl relative",
          isDarkMode
            ? "bg-background-secondary border border-border/70"
            : "bg-white border border-slate-200",
        )}
      >
        <AnimatePresence mode="wait">
          {!saveResult ? (
            <motion.div
              key="preview-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-full"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between px-8 pt-8 pb-4">
                <div className="flex gap-4 items-center">
                  <div className="p-3 rounded-full bg-green-500/10 text-green-500 shrink-0">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-2xl text-text">
                      Generate Selesai
                    </h3>
                    <p className="text-text-muted text-sm mt-1">
                      Silakan tinjau hasil generate sebelum menyimpan ke proyek.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  disabled={isSavingLocal || isSaving}
                  className="rounded-full text-text-muted hover:text-text disabled:opacity-50"
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

              {/* Modal Body */}
              <div className="px-8 py-4 flex flex-col gap-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {/* Functional Requirements */}
                <div>
                  <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                    <ListTodo className="w-4 h-4" />
                    Functional Requirements ({result.fr.length})
                  </h4>
                  <div className="space-y-3">
                    {result.fr.map((fr, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-4 rounded-xl border transition-all",
                          isDarkMode
                            ? "bg-blue-900/10 border-blue-900/30"
                            : "bg-blue-50/50 border-blue-100",
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-text">
                            FR-{idx + 1}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border",
                              isDarkMode
                                ? "bg-muted border-border text-text-muted"
                                : "bg-white border-slate-200 text-slate-500",
                            )}
                          >
                            {fr.priority}
                          </span>
                        </div>
                        <div className="text-sm text-text mb-2 font-medium">
                          {fr.description}
                        </div>
                        <div className="text-xs text-text-muted flex items-start gap-1.5 bg-background/50 p-2 rounded-lg border border-border/50">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span className="leading-relaxed">
                            {fr.acceptanceCriteria}
                          </span>
                        </div>
                      </div>
                    ))}
                    {result.fr.length === 0 && (
                      <p className="text-sm text-text-muted italic">
                        Tidak ada Functional Requirements yang dihasilkan.
                      </p>
                    )}
                  </div>
                </div>

                {/* Non-Functional Requirements */}
                <div>
                  <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                    <ListTodo className="w-4 h-4" />
                    Non-Functional Requirements ({result.nfr.length})
                  </h4>
                  <div className="space-y-3">
                    {result.nfr.map((nfr, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-4 rounded-xl border transition-all",
                          isDarkMode
                            ? "bg-purple-900/10 border-purple-900/30"
                            : "bg-purple-50/50 border-purple-100",
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-text">
                              NFR-{idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md">
                              {nfr.nfrCategory}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border",
                              isDarkMode
                                ? "bg-muted border-border text-text-muted"
                                : "bg-white border-slate-200 text-slate-500",
                            )}
                          >
                            {nfr.priority}
                          </span>
                        </div>
                        <div className="text-sm text-text mb-2 font-medium">
                          {nfr.description}
                        </div>
                        <div className="text-xs text-text-muted flex items-start gap-1.5 bg-background/50 p-2 rounded-lg border border-border/50">
                          <span className="text-purple-500 mt-0.5">•</span>
                          <span className="leading-relaxed">
                            {nfr.acceptanceCriteria}
                          </span>
                        </div>
                      </div>
                    ))}
                    {result.nfr.length === 0 && (
                      <p className="text-sm text-text-muted italic">
                        Tidak ada Non-Functional Requirements yang dihasilkan.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
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
                  disabled={isSavingLocal || isSaving}
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
                  onClick={handleSave}
                  disabled={isSavingLocal || isSaving}
                  className="px-6 font-semibold"
                  leftIcon={
                    isSavingLocal || isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : undefined
                  }
                >
                  {isSavingLocal || isSaving ? "Menyimpan..." : "Simpan Semua"}
                </Button>
              </div>
            </motion.div>
          ) : saveResult.success ? (
            <motion.div
              key="success-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col h-full"
            >
              {/* Header Close Button */}
              <div className="flex items-start justify-end px-8 pt-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full text-text-muted hover:text-text"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="px-8 pb-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-status-done/10 text-status-done rounded-full flex items-center justify-center mb-6 ring-8 ring-status-done/5">
                  <CheckCircle2 className="w-12 h-12" />
                </div>

                <h3 className="text-3xl font-extrabold text-text mb-3">
                  Berhasil Disimpan!
                </h3>

                <div className="text-text-muted mb-8 max-w-md space-y-2">
                  <p className="text-lg">{saveResult.message}</p>
                </div>

                <div
                  className={cn(
                    "w-full p-5 rounded-xl border mb-8 max-w-md shadow-sm",
                    isDarkMode
                      ? "bg-muted/30 border-border"
                      : "bg-slate-50 border-slate-200",
                  )}
                >
                  <p className="text-sm text-text-muted leading-relaxed">
                    Draft requirement Anda telah berhasil disimpan dan sekarang
                    tersedia di dashboard. Anda dapat meninjau dan mengeditnya
                    lebih lanjut.
                  </p>
                </div>

                <Button
                  onClick={onClose}
                  className="w-full sm:w-auto px-10 py-6 text-lg font-bold shadow-lg shadow-primary/20"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Selesai
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="error-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col h-full"
            >
              <div className="flex items-start justify-end px-8 pt-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full text-text-muted hover:text-text"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="px-8 pb-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-priority-urgent/10 text-priority-urgent rounded-full flex items-center justify-center mb-6 ring-8 ring-priority-urgent/5">
                  <AlertTriangle className="w-12 h-12" />
                </div>

                <h3 className="text-3xl font-extrabold text-text mb-3">
                  Gagal Menyimpan
                </h3>

                <p className="text-text-muted text-lg mb-8 max-w-md">
                  {saveResult.message}
                </p>

                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className={cn(
                      "px-8 font-semibold",
                      isDarkMode
                        ? "bg-muted hover:bg-muted/80"
                        : "bg-slate-100 hover:bg-slate-200",
                    )}
                  >
                    Tutup
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSavingLocal || isSaving}
                    className="px-8 font-bold shadow-lg shadow-primary/20"
                  >
                    Coba Lagi
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  );
}
