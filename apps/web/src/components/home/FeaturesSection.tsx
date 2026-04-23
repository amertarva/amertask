import { Clock, Command, GitMerge, KanbanSquare } from "lucide-react";

export default function FeaturesSection() {
  return (
    <div className="container mx-auto px-6 pb-24 md:pb-32">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Alat yang Didesain untuk Profesional
        </h2>
        <p className="text-text-muted text-lg">
          Setiap elemen Amertask dirancang dengan cermat untuk memberikan
          pengalaman pengguna yang cepat, intuitif, dan bebas gangguan.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="md:col-span-2 bg-card border border-border p-8 rounded-[2rem] hover:border-primary/40 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 transition-all group-hover:bg-primary/10"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <KanbanSquare className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Manajemen Task Visual</h3>
            <p className="text-text-muted leading-relaxed max-w-md">
              Board interaktif yang memungkinkan Anda melacak setiap tiket
              dengan detail yang presisi. Integrasikan dengan sistem custom
              Anda.
            </p>
          </div>
        </div>
        <div className="bg-card border border-border p-8 rounded-[2rem] hover:border-primary/40 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-ring/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Command className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Sangat Cepat</h3>
            <p className="text-text-muted">
              Navigasi tanpa mouse menggunakan command palette cerdas kami.
            </p>
          </div>
        </div>
        <div className="bg-card border border-border p-8 rounded-[2rem] hover:border-primary/40 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <GitMerge className="w-7 h-7 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Sync Sempurna</h3>
            <p className="text-text-muted">
              Terhubung langsung dengan GitHub, GitLab, atau Bitbucket.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 bg-card border border-border p-8 rounded-[2rem] hover:border-primary/40 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-status-done/5 rounded-full blur-[80px] -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center h-full">
            <div className="flex-1">
              <div className="w-14 h-14 rounded-2xl bg-status-done/10 border border-status-done/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7 text-status-done" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Perencanaan Sprint</h3>
              <p className="text-text-muted">
                Tentukan kapasitas tim, bagi beban kerja, dan ukur velocity
                dengan grafik burndown otomatis yang akurat.
              </p>
            </div>
            <div className="w-full md:w-1/2 h-44 bg-background/60 rounded-xl border border-border p-5 flex flex-col justify-end relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent"></div>
              <div className="flex items-end gap-3 h-28 mt-auto px-2 relative z-10">
                {[40, 70, 45, 90, 65, 100, 85].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-status-done/20 rounded-t-sm hover:bg-status-done/30 transition-colors cursor-pointer group/bar relative"
                    style={{ height: `${h}%` }}
                  >
                    <div
                      className="absolute top-0 w-full bg-status-done rounded-t-sm transition-all"
                      style={{ height: `${Math.max(10, h / 3)}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
