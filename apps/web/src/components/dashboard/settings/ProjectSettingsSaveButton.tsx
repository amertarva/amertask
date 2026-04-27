import { Loader2, Save } from "lucide-react";
import { type ProjectSettingsSaveButtonProps } from "@/types/components/ProjectSettingsTypes";

export function ProjectSettingsSaveButton({
  isSaving,
  onSave,
}: ProjectSettingsSaveButtonProps) {
  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-muted cursor-pointer disabled:cursor-not-allowed text-primary-foreground font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-primary/30"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...
        </>
      ) : (
        <>
          <Save className="w-5 h-5" /> Simpan Pengaturan
        </>
      )}
    </button>
  );
}
