"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { PlanningUIItem } from "@/types/components/PlanningContainerTypes";

interface PromoteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PlanningUIItem | null;
  onConfirm: (
    item: PlanningUIItem,
  ) => Promise<{ success: boolean; message: string; issueNumber?: number }>;
  teamSlug: string;
}

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

  // Reset state when modal opens/closes
  React.useEffect(() => {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={isPromoting ? () => {} : onClose}
      size="md"
      className="p-0 overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="confirm-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col"
          >
            <div className="bg-primary/10 p-6 flex flex-col items-center text-center border-b border-primary/20">
              <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4 ring-8 ring-primary/5">
                <Play className="w-8 h-8 ml-1 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">
                Mulai Eksekusi Fitur
              </h3>
              <p className="text-sm text-text-muted max-w-sm">
                Anda akan memulai pengerjaan untuk fitur ini. Planning akan
                dipindahkan ke fase{" "}
                <strong className="text-text">Execution</strong>.
              </p>
            </div>

            <div className="p-6 bg-card">
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50 mb-6">
                <div className="text-xs text-text-muted mb-1 uppercase tracking-wider font-semibold">
                  Target Fitur
                </div>
                <div className="text-base font-semibold text-text mb-2">
                  {item?.featureName}
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                  <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary-foreground">
                    {item?.avatar}
                  </div>
                  <span className="text-sm text-text-muted">
                    Dikerjakan oleh{" "}
                    <span className="font-semibold text-text">
                      {item?.assignedUser}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-priority-high bg-priority-high/5 p-3 rounded-lg border border-priority-high/20 mb-6">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  Setelah dimulai, status ini{" "}
                  <strong>tidak dapat diurungkan</strong> kembali ke tahap
                  Planning. Pastikan semua requirement sudah jelas.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={isPromoting}
                  className="px-6"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isPromoting}
                  className="px-8 shadow-md shadow-primary/20"
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
            </div>
          </motion.div>
        ) : result.success ? (
          <motion.div
            key="success-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-status-done/10 text-status-done rounded-full flex items-center justify-center mb-6 ring-8 ring-status-done/5">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-bold text-text mb-2">
              Berhasil Dimulai!
            </h3>

            <div className="text-text-muted mb-6 max-w-sm space-y-2">
              <p>{result.message}</p>
              {result.issueNumber && (
                <div className="inline-flex items-center gap-2 bg-muted/80 px-3 py-1.5 rounded-md text-sm font-mono mt-2 border border-border">
                  {teamSlug.toUpperCase()}-
                  {String(result.issueNumber).padStart(3, "0")}
                </div>
              )}
            </div>

            <div className="bg-card w-full p-4 rounded-xl border border-border/50 mb-8 max-w-sm">
              <p className="text-sm text-text-muted leading-relaxed">
                Planning sekarang berstatus{" "}
                <strong className="text-primary">In Execution</strong>. Anda
                dapat melihat progres detail teknis di tab Execution.
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full sm:w-auto px-8"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Lanjut Bekerja
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="error-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-priority-urgent/10 text-priority-urgent rounded-full flex items-center justify-center mb-6 ring-8 ring-priority-urgent/5">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-bold text-text mb-2">Gagal Memulai</h3>

            <p className="text-text-muted mb-8 max-w-sm">{result.message}</p>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>
                Tutup
              </Button>
              <Button onClick={handleConfirm} disabled={isPromoting}>
                Coba Lagi
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
