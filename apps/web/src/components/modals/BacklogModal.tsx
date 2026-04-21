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
              <Edit2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-2xl text-text">
                {isCreating ? "Buat Backlog Baru" : "Edit Data Backlog"}
              </h3>
              <p className="text-text-muted text-sm mt-1">
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

        {/* Modal Body */}
        <div className="px-8 py-4 flex flex-col gap-6 overflow-y-auto max-h-[60vh]">
          {isCreating && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text">
                Ambil Data dari Execution
              </label>
              <Dropdown
                align="left"
                className="w-full"
                reserveSpaceWhenOpen
                trigger={
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded px-3 py-2 text-sm font-medium outline-none transition-all cursor-pointer",
                      isDarkMode
                        ? "bg-background border border-input text-text hover:bg-muted/30"
                        : "bg-white border border-slate-200 text-text hover:bg-muted/30",
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
              <p className="text-xs text-text-muted">
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
                "uppercase font-medium",
                isDarkMode
                  ? "bg-background border-input"
                  : "bg-white border-slate-200",
              )}
              disabled={isCreating}
            />
            <Input
              label="Nama Fitur"
              value={editForm.featureName || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, featureName: e.target.value })
              }
              className={cn(
                isDarkMode
                  ? "bg-background border-input"
                  : "bg-white border-slate-200",
              )}
              disabled={isCreating}
            />
          </div>
          {activeTab === "product" ? (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">
                  Deskripsi Fitur
                </label>
                <textarea
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={3}
                  className={cn(
                    "flex w-full rounded px-3 py-2 text-sm placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none",
                    isDarkMode
                      ? "bg-background border border-input"
                      : "bg-white border border-slate-200",
                  )}
                  disabled={isCreating}
                />
              </div>
              <Input
                label="Pengguna Akhir / Target"
                value={editForm.targetUser || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, targetUser: e.target.value })
                }
                placeholder="Contoh: Admin Operasional, User Mobile, Supervisor"
                className={cn(
                  isDarkMode
                    ? "bg-background border-input"
                    : "bg-white border-slate-200",
                )}
              />
              <p className="-mt-3 text-xs text-text-muted">
                Isi peran pengguna akhir yang akan memakai fitur ini, bukan nama
                penanggung jawab tiket.
              </p>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">
                  Level Prioritas
                </label>
                <Dropdown
                  className="w-full"
                  reserveSpaceWhenOpen
                  trigger={
                    <div
                      className={cn(
                        "w-full h-10 flex items-center justify-between rounded px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer shadow-sm",
                        isDarkMode
                          ? "bg-background border border-input"
                          : "bg-white border border-slate-200",
                      )}
                    >
                      {editForm.priority === "TINGGI" ? (
                        <span className="text-priority-urgent font-bold">
                          TINGGI
                        </span>
                      ) : editForm.priority === "SEDANG" ? (
                        <span className="text-priority-high font-bold">
                          SEDANG
                        </span>
                      ) : editForm.priority === "RENDAH" ? (
                        <span className="text-status-done font-bold">
                          RENDAH
                        </span>
                      ) : (
                        "Pilih Prioritas..."
                      )}
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    </div>
                  }
                  items={PRIORITY_LEVELS.map((level) => ({
                    label: (
                      <span
                        className={
                          level === "TINGGI"
                            ? "text-priority-urgent font-bold"
                            : level === "SEDANG"
                              ? "text-priority-high font-bold"
                              : "text-status-done font-bold"
                        }
                      >
                        {level}
                      </span>
                    ),
                    value: level,
                    onClick: () =>
                      setEditForm({ ...editForm, priority: level }),
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">
                  Alasan Prioritas
                </label>
                <textarea
                  value={editForm.reason || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reason: e.target.value })
                  }
                  rows={3}
                  className={cn(
                    "flex w-full rounded px-3 py-2 text-sm placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none",
                    isDarkMode
                      ? "bg-background border border-input"
                      : "bg-white border border-slate-200",
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
              "px-6 text-text font-semibold",
              isDarkMode
                ? "bg-muted hover:bg-muted/80"
                : "bg-slate-100 hover:bg-slate-200",
            )}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            disabled={isCreating && !editForm.executionIssueId}
            leftIcon={<Save className="w-4 h-4" />}
            className="px-6 font-bold shadow-lg shadow-primary/20"
          >
            {isCreating ? "Buat Baru" : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
