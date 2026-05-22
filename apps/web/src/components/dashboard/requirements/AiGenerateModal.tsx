"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Wand2, X, Loader2, ArrowRight, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";
import type { AiGenerateModalProps } from "@/types/components/RequirementsTypes";

export function AiGenerateModal({
  isOpen,
  isGenerating,
  backlogIssues,
  onClose,
  onGenerate,
}: AiGenerateModalProps) {
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
          "w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl",
          isDarkMode
            ? "bg-background-secondary border border-border/70"
            : "bg-white border border-slate-200",
        )}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-4">
          <div className="flex gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary shrink-0">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-2xl text-text">
                Auto-Draft dengan AI
              </h3>
              <p className="text-text-muted text-sm mt-1">
                AI akan menganalisis backlog item dan membuat draft FR dan NFR
                secara otomatis.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isGenerating}
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
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="animate-spin w-12 h-12 text-primary mb-4" />
              <p className="text-sm font-bold text-text">
                Menganalisis dan membuat requirements...
              </p>
              <p className="text-xs text-text-muted mt-1 font-medium">
                Ini mungkin memerlukan waktu beberapa detik.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-text mb-2 ml-1">
                Pilih Item Backlog untuk Analisis AI
              </label>
              <div className="space-y-3">
                {backlogIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => onGenerate(issue.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all group shadow-sm flex items-center justify-between gap-4",
                      isDarkMode
                        ? "bg-background border-border hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary hover:bg-muted/30"
                        : "bg-slate-50 border-slate-200 hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary hover:bg-slate-100",
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-bold text-text mb-1.5 group-hover:text-primary transition-colors flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border",
                            isDarkMode
                              ? "bg-muted border-border text-text-muted"
                              : "bg-white border-slate-200 text-slate-500",
                          )}
                        >
                          #{issue.number}
                        </span>
                        {issue.title}
                      </div>
                      {issue.description ? (
                        <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">
                          {issue.description}
                        </p>
                      ) : (
                        <p className="text-sm text-text-muted italic opacity-70">
                          Tidak ada deskripsi
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        isDarkMode
                          ? "bg-muted group-hover:bg-primary/10"
                          : "bg-white border border-slate-200 group-hover:bg-primary/10 group-hover:border-primary/20",
                      )}
                    >
                      <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
                {backlogIssues.length === 0 && (
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl",
                      isDarkMode
                        ? "border-border bg-muted/30"
                        : "border-slate-200 bg-slate-50",
                    )}
                  >
                    <ListTodo className="w-10 h-10 text-text-muted opacity-30 mb-3" />
                    <p className="text-text font-bold">
                      Tidak ada backlog item
                    </p>
                    <p className="text-sm text-text-muted mt-1 max-w-sm">
                      Buat backlog item terlebih dahulu untuk menggunakan fitur
                      ini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
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
            disabled={isGenerating}
            className={cn(
              "px-6 text-text font-semibold",
              isDarkMode
                ? "bg-muted hover:bg-muted/80"
                : "bg-slate-100 hover:bg-slate-200",
            )}
          >
            Batal
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
