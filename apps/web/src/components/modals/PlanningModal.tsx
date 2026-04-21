import React from "react";
import { Edit2, Plus, Save, X, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";

export function PlanningModal({
  mounted,
  editingItem,
  isCreating,
  editForm,
  teamMembers,
  isMembersLoading,
  setEditForm,
  onClose,
  onSave,
}: any) {
  const { colorTheme } = useThemeStore();
  const isDarkMode =
    mounted &&
    (colorTheme === "amerta-night" ||
      (typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")));
  const members = Array.isArray(teamMembers) ? teamMembers : [];
  const assigneeOptions = members.map((member: any) => ({
    value: member.id,
    label: `${member.name} (${member.role.toUpperCase()})`,
  }));

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
                {isCreating ? "Buat Planning Baru" : "Edit Sprint Planning"}
              </h3>
              <p className="text-text-muted text-sm mt-1">
                {isCreating
                  ? "Tambahkan rencana eksekusi dan kriteria penerimaannya"
                  : `Perbarui hasil ekspektasi untuk item ${editingItem?.id}`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="ID Backlog"
              value={editForm.id || ""}
              className={cn(
                "uppercase font-medium",
                isDarkMode
                  ? "bg-background border-input"
                  : "bg-white border-slate-200",
              )}
              disabled
            />
            <Input
              label="Fitur yang Dikerjakan"
              value={editForm.featureName || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, featureName: e.target.value })
              }
              className={cn(
                isDarkMode
                  ? "bg-background border-input"
                  : "bg-white border-slate-200",
              )}
              disabled={!isCreating}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Penanggung Jawab"
              value={editForm.assigneeId || ""}
              onChange={(assigneeId) => {
                const selectedMember = members.find(
                  (member: any) => member.id === assigneeId,
                );

                setEditForm({
                  ...editForm,
                  assigneeId,
                  assignedUser: selectedMember?.name || "",
                  avatar: selectedMember?.initials || "U",
                });
              }}
              options={assigneeOptions}
              placeholder={
                isMembersLoading ? "Memuat anggota tim..." : "Pilih anggota tim"
              }
              className={cn(
                isDarkMode
                  ? "bg-background border-input text-text"
                  : "bg-white border-slate-200 text-text",
              )}
            />
            <Input
              label="Status Pekerjaan"
              value="To Do"
              className={cn(
                isDarkMode
                  ? "bg-background border-input"
                  : "bg-white border-slate-200",
              )}
              disabled
            />
          </div>

          <div
            className={cn(
              "space-y-4 pt-2 border-t",
              isDarkMode ? "border-border/40" : "border-slate-200",
            )}
          >
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-text">
                Output yang Diharapkan (Acceptance Criteria)
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const current = Array.isArray(editForm.expectedOutput)
                    ? [...editForm.expectedOutput]
                    : [editForm.expectedOutput || ""];
                  setEditForm({
                    ...editForm,
                    expectedOutput: [...current, ""],
                  });
                }}
                className="h-8 px-2 text-primary hover:text-primary-hover hover:bg-primary/10"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Tambah Output
              </Button>
            </div>
            <div className="space-y-3">
              {(Array.isArray(editForm.expectedOutput)
                ? editForm.expectedOutput
                : [editForm.expectedOutput || ""]
              ).map((out: string, index: number) => (
                <div key={index} className="flex gap-2 items-start">
                  <textarea
                    value={out}
                    rows={2}
                    onChange={(e) => {
                      const newOut = Array.isArray(editForm.expectedOutput)
                        ? [...editForm.expectedOutput]
                        : [editForm.expectedOutput || ""];
                      newOut[index] = e.target.value;
                      setEditForm({ ...editForm, expectedOutput: newOut });
                    }}
                    className={cn(
                      "flex w-full rounded px-3 py-2 text-sm placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none",
                      isDarkMode
                        ? "bg-background border border-input"
                        : "bg-white border border-slate-200",
                    )}
                    placeholder={`Kriteria ${index + 1}...`}
                  />
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newOut = [...editForm.expectedOutput];
                        newOut.splice(index, 1);
                        setEditForm({ ...editForm, expectedOutput: newOut });
                      }}
                      className="h-9 w-9 text-priority-urgent hover:text-priority-urgent hover:bg-priority-urgent/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
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
