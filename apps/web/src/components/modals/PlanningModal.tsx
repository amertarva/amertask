import { Edit2, Plus, Save, X, Trash2, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/Calendar";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";
import { type PlanningModalProps } from "@/types/components/PlanningModalTypes";

export function PlanningModal({
  mounted,
  editingItem,
  isCreating,
  editForm,
  teamMembers,
  isMembersLoading,
  teamSlug,
  nextPlanningNumber,
  setEditForm,
  onClose,
  onSave,
}: PlanningModalProps) {
  const { colorTheme } = useThemeStore();
  const isDarkMode =
    mounted &&
    (colorTheme === "amerta-night" ||
      (typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")));
  const members = Array.isArray(teamMembers) ? teamMembers : [];
  const assigneeOptions = members.map((member) => ({
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
              value={
                isCreating
                  ? `${teamSlug?.toUpperCase()}-${String(nextPlanningNumber || 1).padStart(3, "0")}`
                  : editingItem?.number
                    ? `${teamSlug?.toUpperCase()}-P${String(editingItem.number).padStart(3, "0")}`
                    : editForm.id || ""
              }
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
            <div className="w-full relative z-50">
              <label className="mb-2 block text-sm font-bold text-text ml-1">
                Penanggung Jawab
              </label>
              <div className="relative w-full">
                <Dropdown
                  align="left"
                  className="w-full"
                  reserveSpaceWhenOpen
                  trigger={
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between bg-transparent border border-border rounded-xl px-4 py-3 text-sm font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer shadow-sm hover:bg-muted/30",
                        isDarkMode ? "bg-background" : "bg-white",
                      )}
                    >
                      <span
                        className={editForm.assigneeId ? "" : "text-text-muted"}
                      >
                        {isMembersLoading
                          ? "Memuat anggota tim..."
                          : assigneeOptions.find(
                              (opt) => opt.value === editForm.assigneeId,
                            )?.label || "Pilih anggota tim"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    </button>
                  }
                  items={members.map((member) => ({
                    label: `${member.name} (${member.role.toUpperCase()})`,
                    onClick: () => {
                      setEditForm({
                        ...editForm,
                        assigneeId: member.id,
                        assignedUser: member.name,
                        avatar: member.initials || "U",
                      });
                    },
                  }))}
                />
              </div>
            </div>
            <div className="w-full relative z-40">
              <label className="mb-2 block text-sm font-bold text-text ml-1">
                Priority
              </label>
              <div className="relative w-full">
                <Dropdown
                  align="left"
                  className="w-full"
                  reserveSpaceWhenOpen
                  trigger={
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between bg-transparent border border-border rounded-xl px-4 py-3 text-sm font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer shadow-sm hover:bg-muted/30",
                        isDarkMode ? "bg-background" : "bg-white",
                      )}
                    >
                      <span>
                        {[
                          { value: "urgent", label: "Penting" },
                          { value: "high", label: "Tinggi" },
                          { value: "medium", label: "Medium" },
                          { value: "low", label: "Rendah" },
                        ].find(
                          (p) => p.value === (editForm.priority || "medium"),
                        )?.label || "Medium"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    </button>
                  }
                  items={[
                    { value: "urgent", label: "Penting" },
                    { value: "high", label: "Tinggi" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Rendah" },
                  ].map((opt) => ({
                    label: opt.label,
                    onClick: () =>
                      setEditForm({ ...editForm, priority: opt.value }),
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Date & Estimation Fields */}
          <div
            className={cn(
              "space-y-4 pt-4 border-t",
              isDarkMode ? "border-border/40" : "border-slate-200",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <label className="block text-sm font-bold text-text">
                Jadwal & Estimasi Pengerjaan
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full relative z-30">
                <label className="block text-sm font-bold text-text ml-1 mb-2">
                  Tanggal Mulai
                </label>
                <div className="relative w-full">
                  <DatePicker
                    value={editForm.startDate || ""}
                    onChange={(date) =>
                      setEditForm({ ...editForm, startDate: date })
                    }
                    placeholder="Pilih tanggal mulai..."
                    className="w-full"
                    reserveSpaceWhenOpen
                    minDate={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <div className="w-full relative z-20">
                <label className="block text-sm font-bold text-text ml-1 mb-2">
                  Tanggal Selesai
                </label>
                <div className="relative w-full">
                  <DatePicker
                    value={editForm.dueDate || ""}
                    onChange={(date) =>
                      setEditForm({ ...editForm, dueDate: date })
                    }
                    placeholder="Pilih tanggal selesai..."
                    className="w-full"
                    disabled={!editForm.startDate}
                    reserveSpaceWhenOpen
                    minDate={
                      editForm.startDate ||
                      new Date().toISOString().split("T")[0]
                    }
                  />
                </div>
              </div>
              <div className="w-full relative z-10">
                <Input
                  label="Estimasi Jam (Opsional)"
                  type="number"
                  value={editForm.estimatedHours || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      estimatedHours: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  step={1}
                  placeholder="Kosongkan jika belum tahu"
                  className={cn(
                    "font-medium",
                    isDarkMode
                      ? "bg-background border-input"
                      : "bg-white border-slate-200",
                  )}
                />
              </div>
            </div>

            {editForm.startDate && editForm.dueDate && (
              <div className="text-xs text-text-muted bg-muted/30 border border-border/50 rounded-lg px-3 py-2">
                Durasi:{" "}
                {Math.ceil(
                  (new Date(editForm.dueDate).getTime() -
                    new Date(editForm.startDate).getTime()) /
                    (1000 * 60 * 60 * 24),
                )}{" "}
                hari
                {editForm.estimatedHours &&
                  editForm.estimatedHours > 0 &&
                  ` • ${Math.ceil(editForm.estimatedHours / 8)} hari kerja (8 jam/hari)`}
              </div>
            )}
          </div>

          <div
            className={cn(
              "space-y-4 pt-2 border-t",
              isDarkMode ? "border-border/40" : "border-slate-200",
            )}
          >
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-text">
                Output yang Diharapkan
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
                        const currentOutput = Array.isArray(
                          editForm.expectedOutput,
                        )
                          ? editForm.expectedOutput
                          : [editForm.expectedOutput || ""];
                        const newOut = [...currentOutput];
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
