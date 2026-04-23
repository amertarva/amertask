import { Users } from "lucide-react";

export function ProjectAccessSection() {
  return (
    <div className="animate-fade-in">
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-extrabold text-text mb-2">Akses dan Role</h2>
        <p className="text-sm font-medium text-text-muted mb-8">
          Pengaturan role member proyek sedang dalam tahap pengembangan.
        </p>

        <div className="flex flex-col items-center justify-center py-14 text-text-muted border-2 border-dashed border-border rounded-3xl bg-muted/20">
          <div className="w-20 h-20 bg-background border border-border rounded-3xl flex items-center justify-center shadow-lg mb-5">
            <Users className="w-9 h-9 text-primary" />
          </div>
          <h3 className="text-xl font-extrabold text-text mb-2">Segera Hadir</h3>
          <p className="text-sm font-semibold max-w-sm text-center">
            Modul akses tim dan pengaturan permission project sedang dalam
            proses pengembangan.
          </p>
        </div>
      </div>
    </div>
  );
}
