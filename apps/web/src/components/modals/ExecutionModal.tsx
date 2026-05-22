import React from "react";
import { Edit2, X, Save, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EXECUTION_STATUSES } from "@/types";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";

export function ExecutionModal({
  mounted,
  editingItem,
  editForm,
  setEditForm,
  onClose,
  onSave,
}: any) {
  const { colorTheme } = useThemeStore();
  const isDarkMode = mounted && (
    colorTheme === "amerta-night" ||
    (typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"))
  );

  if (!mounted || !editingItem) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-100 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in text-left",
        isDarkMode ? "bg-black/70" : "bg-black/40",
      )}
    >
      <div
        className={cn(
          "w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl transition-all duration-300",
          isDarkMode
            ? "bg-background-secondary border border-border/70"
            : "bg-white border border-slate-200",
        )}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-4">
          <div className="flex gap-4">
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm shrink-0 flex items-center justify-center">
              <Edit2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-2xl text-text tracking-tight">
                Edit Eksekusi
              </h3>
              <p className="text-text-muted text-sm mt-1 leading-relaxed">
                Perbarui aktivitas eksekusi ke-<span className="font-bold text-text">{editingItem.no}</span>
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

        {/* Modal Body */}
        <div className="px-8 py-5 flex flex-col gap-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-text ml-1">
                Aktivitas & Kaitan (ID)
              </label>
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={editForm.taskId || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, taskId: e.target.value })
                  }
                  className={cn(
                    "w-1/3 flex h-11 rounded-xl px-4 py-3 text-sm uppercase font-semibold placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:border-primary/60 transition-all hover:border-border-strong/50",
                    isDarkMode
                      ? "bg-background border border-input"
                      : "bg-white border border-slate-200",
                  )}
                  placeholder="Ref ID"
                />
                <input
                  type="text"
                  value={editForm.activity || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, activity: e.target.value })
                  }
                  className={cn(
                    "w-2/3 flex h-11 rounded-xl px-4 py-3 text-sm font-semibold placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:border-primary/60 transition-all hover:border-border-strong/50",
                    isDarkMode
                      ? "bg-background border border-input"
                      : "bg-white border border-slate-200",
                  )}
                  placeholder="Nama Aktivitas"
                />
              </div>
            </div>

            <Input
              label="Waktu / Tanggal"
              value={editForm.date || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, date: e.target.value })
              }
              className={cn(
                "rounded-xl h-11 font-medium focus-visible:ring-primary/30 focus-visible:border-primary/60",
                isDarkMode
                  ? "bg-background border-input hover:border-border-strong/50"
                  : "bg-white border-slate-200 hover:border-slate-300",
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-text ml-1">
                Status Eksekusi
              </label>
              <Dropdown
                className="w-full"
                trigger={
                  <div
                    className={cn(
                      "w-full h-11 flex items-center justify-between rounded-xl px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:border-primary/60 transition-all cursor-pointer shadow-sm border hover:border-primary/30 active:scale-[0.99]",
                      isDarkMode
                        ? "bg-background border-input hover:bg-muted/10"
                        : "bg-white border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <span>{editForm.status || "Pilih Status..."}</span>
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  </div>
                }
                items={EXECUTION_STATUSES.map((status) => ({
                  label: status,
                  value: status,
                  onClick: () => setEditForm({ ...editForm, status }),
                }))}
              />
            </div>
            <Input
              label="Penanggung Jawab"
              value={editForm.assignedUser || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, assignedUser: e.target.value })
              }
              className={cn(
                "rounded-xl h-11 font-medium focus-visible:ring-primary/30 focus-visible:border-primary/60",
                isDarkMode
                  ? "bg-background border-input hover:border-border-strong/50"
                  : "bg-white border-slate-200 hover:border-slate-300",
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-text ml-1">
              Catatan Eksekusi
            </label>
            <textarea
              value={editForm.notes || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
              rows={3}
              className={cn(
                "flex w-full rounded-xl px-4 py-3 text-sm font-medium placeholder:text-text-subtle/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:border-primary/60 resize-none transition-all duration-200",
                isDarkMode
                  ? "bg-background border border-input hover:border-border-strong/50"
                  : "bg-white border border-slate-200 hover:border-slate-300",
              )}
            />
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
            onClick={onSave}
            leftIcon={<Save className="w-4 h-4" />}
            className={cn(
              "px-6 h-11 font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-150 active:scale-95",
              isDarkMode ? "border border-primary/30" : "border border-primary/20"
            )}
          >
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
