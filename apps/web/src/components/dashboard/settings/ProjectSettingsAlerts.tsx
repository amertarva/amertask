import { AlertCircle, CheckCircle2 } from "lucide-react";
import { type ProjectSettingsAlertsProps } from "@/types/components/ProjectSettingsTypes";

export function ProjectSettingsAlerts({
  error,
  saveError,
  saveSuccess,
  errorTitle,
}: ProjectSettingsAlertsProps) {
  return (
    <>
      {(error || saveError) && (
        <div className="bg-priority-urgent/10 border border-priority-urgent/30 p-4 rounded-2xl flex gap-3 text-priority-urgent">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold mb-1">
              {saveError ? errorTitle : "Terjadi Kesalahan"}
            </h4>
            <p className="text-sm font-medium">{saveError || error}</p>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-status-done/10 border border-status-done/30 p-4 rounded-2xl flex gap-3 text-status-done">
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold mb-1">Pengaturan Berhasil Disimpan</h4>
            <p className="text-sm font-medium">
              Perubahan konfigurasi proyek telah tersimpan.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
