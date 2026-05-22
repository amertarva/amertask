"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";
import type { PromoteConfirmModalProps } from "@/types/components/PromoteConfirmModalProps";

export function PromoteConfirmModal({
  isOpen,
  onClose,
  item,
  onConfirm,
  teamSlug,
}: PromoteConfirmModalProps) {
  const [isPromoting, setIsPromoting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    issueNumber?: number;
  } | null>(null);

  const [mounted, setMounted] = useState(false);
  const { colorTheme } = useThemeStore();

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
      setResult(null);
      setIsPromoting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!item) return;

    setIsPromoting(true);
    try {
      const res = await onConfirm(item);
      setResult(res);
    } catch (error) {
      setResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan yang tidak terduga.",
      });
    } finally {
      setIsPromoting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in text-left",
        isDarkMode ? "bg-black/70" : "bg-black/40",
      )}
    >
      <div
        className={cn(
          "w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl relative",
          isDarkMode
            ? "bg-background-secondary border border-border/70"
            : "bg-white border border-slate-200",
        )}
      >
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="confirm-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col h-full"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between px-8 pt-8 pb-4">
                <div className="flex gap-4">
                  <div className="p-3.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm shrink-0 flex items-center justify-center">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-2xl text-text tracking-tight">
                      Mulai Eksekusi Fitur
                    </h3>
                    <p className="text-text-muted text-sm mt-1 leading-relaxed">
                      Planning akan dipindahkan ke fase Execution.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isPromoting ? () => {} : onClose}
                  disabled={isPromoting}
                  className="rounded-full text-text-muted hover:text-text hover:bg-muted/50 transition-all active:scale-95 disabled:opacity-50"
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
              <div className="px-8 py-6 flex flex-col gap-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div
                  className={cn(
                    "rounded-xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md",
                    isDarkMode
                      ? "bg-muted/30 border-border/80 hover:border-primary/30"
                      : "bg-slate-50 border-slate-200 hover:border-primary/20",
                  )}
                >
                  <div className="text-xs text-text-muted mb-1.5 uppercase tracking-wider font-bold">
                    Target Fitur
                  </div>
                  <div className="text-xl font-extrabold text-text mb-3 tracking-tight">
                    {item?.featureName}
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-3 mt-4 pt-4 border-t",
                      isDarkMode ? "border-border/50" : "border-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 border shadow-sm",
                        isDarkMode
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-primary/10 text-primary border-primary/20",
                      )}
                    >
                      {item?.avatar}
                    </div>
                    <span className="text-sm text-text-muted font-medium">
                      Dikerjakan oleh{" "}
                      <span className="font-bold text-text">
                        {item?.assignedUser}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 text-sm text-priority-high bg-priority-high/10 p-4 rounded-xl border border-priority-high/20 shadow-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    Setelah dimulai, status ini{" "}
                    <strong className="font-extrabold">tidak dapat diurungkan</strong> kembali ke tahap
                    Planning. Pastikan semua requirement sudah jelas.
                  </p>
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
                  disabled={isPromoting}
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
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={isPromoting}
                  className={cn(
                    "px-8 h-11 font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-150 active:scale-95",
                    isDarkMode ? "border border-primary/30" : "border border-primary/20"
                  )}
                  leftIcon={
                    isPromoting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )
                  }
                >
                  {isPromoting ? "Memproses..." : "Ya, Mulai Kerjakan!"}
                </Button>
              </div>
            </motion.div>
          ) : result.success ? (
            <motion.div
              key="success-view"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col h-full"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-end px-8 pt-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full text-text-muted hover:text-text hover:bg-muted/50 transition-all active:scale-95"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="px-8 pb-10 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  {/* Concentric ripple effects */}
                  <div className="absolute inset-0 rounded-full bg-status-done/10 animate-ping opacity-30 scale-150" />
                  <div className="absolute inset-0 rounded-full bg-status-done/15 animate-pulse opacity-40 scale-125" />
                  <div className="relative w-24 h-24 bg-status-done/10 text-status-done rounded-full flex items-center justify-center ring-8 ring-status-done/5 border border-status-done/20">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                </div>

                <h3 className="text-3xl font-extrabold text-text mb-3 tracking-tight">
                  Berhasil Dimulai!
                </h3>

                <div className="text-text-muted mb-6 max-w-md space-y-2 font-medium">
                  <p className="text-lg leading-relaxed">{result.message}</p>
                  {result.issueNumber && (
                    <div
                      className={cn(
                        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-mono mt-3 border font-extrabold shadow-sm transition-all duration-300 hover:scale-105",
                        isDarkMode
                          ? "bg-background border-border text-primary"
                          : "bg-slate-100 border-slate-200 text-primary",
                      )}
                    >
                      {teamSlug.toUpperCase()}-
                      {String(result.issueNumber).padStart(3, "0")}
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    "w-full p-5 rounded-xl border mb-8 max-w-md shadow-inner transition-all",
                    isDarkMode
                      ? "bg-background-tertiary/40 border-border/60"
                      : "bg-slate-50/50 border-slate-100",
                  )}
                >
                  <p className="text-sm text-text-muted leading-relaxed font-medium">
                    Planning sekarang berstatus{" "}
                    <strong className="text-primary font-bold">
                      In Execution
                    </strong>
                    . Anda dapat melihat progres detail teknis di tab Execution.
                  </p>
                </div>

                <Button
                  onClick={onClose}
                  className={cn(
                    "w-full sm:w-auto px-10 h-14 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-150 active:scale-95 rounded-xl",
                    isDarkMode ? "border border-primary/30" : "border border-primary/20"
                  )}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Lanjut Bekerja
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="error-view"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col h-full"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-end px-8 pt-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full text-text-muted hover:text-text hover:bg-muted/50 transition-all active:scale-95"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="px-8 pb-10 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-priority-urgent/10 animate-ping opacity-30 scale-150" />
                  <div className="relative w-24 h-24 bg-priority-urgent/10 text-priority-urgent rounded-full flex items-center justify-center ring-8 ring-priority-urgent/5 border border-priority-urgent/20">
                    <AlertTriangle className="w-12 h-12" />
                  </div>
                </div>

                <h3 className="text-3xl font-extrabold text-text mb-3 tracking-tight">
                  Gagal Memulai
                </h3>

                <p className="text-text-muted text-lg mb-8 max-w-md font-medium leading-relaxed">
                  {result.message}
                </p>

                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className={cn(
                      "px-8 h-11 text-text font-bold rounded-xl transition-all duration-150 active:scale-95",
                      isDarkMode
                        ? "bg-muted/70 hover:bg-muted"
                        : "bg-slate-100 hover:bg-slate-200",
                    )}
                  >
                    Tutup
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={isPromoting}
                    className={cn(
                      "px-8 h-11 font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-150 active:scale-95",
                      isDarkMode ? "border border-primary/30" : "border border-primary/20"
                    )}
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

