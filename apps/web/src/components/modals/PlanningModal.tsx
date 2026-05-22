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
                {isCreating ? "Buat Planning Baru" : "Edit Sprint Planning"}
              </h3>
              <p className="text-text-muted text-sm mt-1 leading-relaxed">
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
            <Input
              label="ID Planning"
              value={
                isCreating
                  ? `${teamSlug?.toUpperCase()}-${String(nextPlanningNumber || 1).padStart(3, "0")}`
                  : editingItem?.number
                    ? `${teamSlug?.toUpperCase()}-${String(editingItem.number).padStart(3, "0")}`
                    : editForm.id || ""
              }
              className={cn(
                "uppercase font-medium rounded-xl h-11 border-dashed",
                isDarkMode
                  ? "bg-background-tertiary/40 border-border/80 text-text-muted"
                  : "bg-slate-50 border-slate-200 text-text-muted",
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
                "rounded-xl h-11 font-medium focus-visible:ring-primary/30 focus-visible:border-primary/60",
                isDarkMode
                  ? "bg-background border-input hover:border-border-strong/50"
                  : "bg-white border-slate-200 hover:border-slate-300",
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
                  trigger={
                    <button
                      type="button"
                      className={cn(
                        "flex h-11 w-full items-center justify-between bg-transparent border border-border rounded-xl px-4 text-sm font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/45 transition-all cursor-pointer shadow-sm hover:border-primary/30 active:scale-[0.99]",
                        isDarkMode ? "bg-background hover:bg-muted/10" : "bg-white hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={editForm.assigneeId ? "font-bold" : "text-text-muted"}
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
                  trigger={
                    <button
                      type="button"
                      className={cn(
                        "flex h-11 w-full items-center justify-between bg-transparent border border-border rounded-xl px-4 text-sm font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/45 transition-all cursor-pointer shadow-sm hover:border-primary/30 active:scale-[0.99]",
                        isDarkMode ? "bg-background hover:bg-muted/10" : "bg-white hover:bg-slate-50",
                      )}
                    >
                      <span className="font-bold">
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
              <div className="w-1.5 h-4.5 bg-primary rounded-full" />
              <label className="block text-xs font-extrabold uppercase tracking-wider text-text-muted">
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
                    "font-medium rounded-xl h-11 focus-visible:ring-primary/30 focus-visible:border-primary/60",
                    isDarkMode
                      ? "bg-background border-input hover:border-border-strong/50"
                      : "bg-white border-slate-200 hover:border-slate-300",
                  )}
                />
              </div>
            </div>

            {editForm.startDate && editForm.dueDate && (
              <div className={cn(
                "text-xs font-semibold px-4 py-2.5 rounded-xl border flex items-center justify-between transition-all",
                isDarkMode 
                  ? "bg-muted/20 border-border/40 text-text-muted" 
                  : "bg-slate-50 border-slate-200 text-text-muted"
              )}>
                <span>
                  Durasi Pelaksanaan:{" "}
                  <strong className="text-text">
                    {Math.ceil(
                      (new Date(editForm.dueDate).getTime() -
                        new Date(editForm.startDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    hari
                  </strong>
                </span>
                {editForm.estimatedHours && editForm.estimatedHours > 0 ? (
                  <span>
                    •{" "}
                    <strong className="text-primary">
                      {Math.ceil(editForm.estimatedHours / 8)} hari kerja
                    </strong>{" "}
                    (8 jam/hari)
                  </span>
                ) : null}
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
              <label className="block text-sm font-semibold text-text">
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
                className="h-8 px-3 text-primary hover:text-primary-hover hover:bg-primary/10 rounded-lg font-semibold text-xs transition-all duration-200"
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
                <div
                  key={index}
                  className={cn(
                    "flex gap-3 items-start p-3 rounded-xl border transition-all duration-200",
                    isDarkMode
                      ? "bg-background/25 border-border/60 focus-within:border-primary/40 focus-within:bg-background/40"
                      : "bg-slate-50/50 border-slate-200 focus-within:border-primary/40 focus-within:bg-white",
                  )}
                >
                  <div className="bg-primary/10 text-primary w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 mt-1">
                    {index + 1}
                  </div>
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
                    className="flex-1 bg-transparent text-sm placeholder:text-text-subtle/80 focus:outline-none resize-none border-none outline-none focus:ring-0 p-0 text-text leading-relaxed font-medium"
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
                      className="h-8 w-8 text-priority-urgent hover:text-priority-urgent hover:bg-priority-urgent/10 rounded-lg shrink-0 transition-colors mt-0.5"
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
