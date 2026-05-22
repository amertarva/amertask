import React from "react";
import { Edit2, X, Save, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PRIORITY_LEVELS } from "@/types";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";

export function BacklogModal({
  mounted,
  editingItem,
  isCreating,
  editForm,
  executionCandidates,
  setEditForm,
  activeTab,
  onClose,
  onSave,
}: any) {
  const { colorTheme } = useThemeStore();
  const isDarkMode =
    mounted &&
    (colorTheme === "amerta-night" ||
      (typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")));
  const candidates = Array.isArray(executionCandidates)
    ? executionCandidates
    : [];
  const selectedExecution = candidates.find(
    (item: any) => item.issueId === editForm.executionIssueId,
  );
  const selectedExecutionLabel = selectedExecution
    ? `${selectedExecution.id} - ${selectedExecution.featureName}`
    : "Pilih data execution";

  if (!mounted || (!editingItem && !isCreating)) return null;

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
                {isCreating ? "Buat Backlog Baru" : "Edit Data Backlog"}
              </h3>
              <p className="text-text-muted text-sm mt-1 leading-relaxed">
                {isCreating
                  ? "Tambahkan entri pencatatan backlog baru ke sistem"
                  : `Perbarui informasi untuk ${editingItem?.id}`}
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
          {isCreating && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-text ml-1">
                Ambil Data dari Execution
              </label>
              <Dropdown
                align="left"
                className="w-full"
                trigger={
                  <button
                    type="button"
                    className={cn(
                      "flex w-full h-11 items-center justify-between rounded-xl px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:border-primary/60 transition-all cursor-pointer shadow-sm border active:scale-[0.99]",
                      isDarkMode
                        ? "bg-background border-input text-text hover:bg-muted/10"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span className="truncate text-left">
                      {selectedExecutionLabel}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 text-text-muted shrink-0" />
                  </button>
                }
                items={
                  candidates.length > 0
                    ? candidates.map((item: any) => ({
                        label: `${item.id} - ${item.featureName}`,
                        onClick: () => {
                          setEditForm({
                            ...editForm,
                            executionIssueId: item.issueId,
                            id: item.id,
                            featureName: item.featureName,
                            description: item.description,
                            targetUser: item.targetUser || "",
                            reason: "",
                            priority: "",
                          });
                        },
                      }))
                    : [
                        {
                          label: "Tidak ada data execution tersedia",
                          disabled: true,
                        },
                      ]
                }
              />
              <p className="text-xs font-medium text-text-muted ml-1 leading-relaxed">
                Data backlog akan otomatis mengikuti item execution yang
                dipilih.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="ID Backlog"
              value={editForm.id || ""}
              onChange={(e) => setEditForm({ ...editForm, id: e.target.value })}
              className={cn(
                "rounded-xl h-11 font-semibold uppercase focus-visible:ring-primary/30 focus-visible:border-primary/60",
                isDarkMode
                  ? "bg-background border-input hover:border-border-strong/50"
                  : "bg-white border-slate-200 hover:border-slate-300",
              )}
            />
            <Input
              label="Nama Fitur"
              value={editForm.featureName || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, featureName: e.target.value })
              }
              className={cn(
                "rounded-xl h-11 font-medium focus-visible:ring-primary/30 focus-visible:border-primary/60",
                isDarkMode
                  ? "bg-background border-input hover:border-border-strong/50"
                  : "bg-white border-slate-200 hover:border-slate-300",
              )}
            />
          </div>
          {activeTab === "product" ? (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-text ml-1">
                  Deskripsi Fitur
                </label>
                <textarea
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
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
              <div className="space-y-2">
                <Input
                  label="Pengguna Akhir / Target"
                  value={editForm.targetUser || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, targetUser: e.target.value })
                  }
                  placeholder="Contoh: Admin Operasional, User Mobile, Supervisor"
                  className={cn(
                    "rounded-xl h-11 font-medium focus-visible:ring-primary/30 focus-visible:border-primary/60",
                    isDarkMode
                      ? "bg-background border-input hover:border-border-strong/50"
                      : "bg-white border-slate-200 hover:border-slate-300",
                  )}
                />
                <p className="text-xs font-medium text-text-muted ml-1 leading-relaxed">
                  Isi peran pengguna akhir yang akan memakai fitur ini, bukan nama
                  penanggung jawab tiket.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-text ml-1">
                  Level Prioritas
                </label>
                <Dropdown
                  className="w-full"
                  trigger={
                    <div
                      className={cn(
                        "w-full h-11 flex items-center justify-between rounded-xl px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:border-primary/60 transition-all cursor-pointer shadow-sm border active:scale-[0.99]",
                        isDarkMode
                          ? "bg-background border-input hover:bg-muted/10"
                          : "bg-white border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      {editForm.priority === "TINGGI" ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-priority-urgent shadow-sm animate-pulse" />
                          <span className="text-priority-urgent font-extrabold text-xs tracking-wide">
                            TINGGI
                          </span>
                        </div>
                      ) : editForm.priority === "SEDANG" ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-priority-high shadow-sm" />
                          <span className="text-priority-high font-extrabold text-xs tracking-wide">
                            SEDANG
                          </span>
                        </div>
                      ) : editForm.priority === "RENDAH" ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-status-done shadow-sm" />
                          <span className="text-status-done font-extrabold text-xs tracking-wide">
                            RENDAH
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-muted font-semibold">Pilih Prioritas...</span>
                      )}
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    </div>
                  }
                  items={PRIORITY_LEVELS.map((level) => ({
                    label: (
                      <div className="flex items-center gap-2.5 py-1">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shadow-sm",
                            level === "TINGGI"
                              ? "bg-priority-urgent animate-pulse"
                              : level === "SEDANG"
                                ? "bg-priority-high"
                                : "bg-status-done"
                          )}
                        />
                        <span
                          className={cn(
                            "font-extrabold text-xs tracking-wider",
                            level === "TINGGI"
                              ? "text-priority-urgent"
                              : level === "SEDANG"
                                ? "text-priority-high"
                                : "text-status-done"
                          )}
                        >
                          {level}
                        </span>
                      </div>
                    ),
                    value: level,
                    onClick: () =>
                      setEditForm({ ...editForm, priority: level }),
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-text ml-1">
                  Alasan Prioritas
                </label>
                <textarea
                  value={editForm.reason || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reason: e.target.value })
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
            </>
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
            {isCreating ? "Buat Baru" : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

