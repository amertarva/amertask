"use client";

import { Clock, Command, GitMerge, KanbanSquare } from "lucide-react";
import { motion, type Variants } from "motion/react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};


export default function FeaturesSection() {
  return (
    <div className="container mx-auto px-6 pb-24 md:pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 max-w-3xl mx-auto"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Alat yang Didesain untuk Profesional
        </h2>
        <p className="text-text-muted text-lg">
          Setiap elemen Amertask dirancang dengan cermat untuk memberikan
          pengalaman pengguna yang cepat, intuitif, dan bebas gangguan.
        </p>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
      >
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -5, borderColor: "rgba(var(--color-primary), 0.4)" }}
          className="md:col-span-2 bg-card border border-border p-8 rounded-[2rem] transition-colors group relative overflow-hidden"
        >
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
        </motion.div>

        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -5, borderColor: "rgba(var(--color-primary), 0.4)" }}
          className="bg-card border border-border p-8 rounded-[2rem] transition-colors group relative overflow-hidden"
        >
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
        </motion.div>

        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -5, borderColor: "rgba(var(--color-primary), 0.4)" }}
          className="bg-card border border-border p-8 rounded-[2rem] transition-colors group relative overflow-hidden"
        >
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
        </motion.div>

        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -5, borderColor: "rgba(var(--color-primary), 0.4)" }}
          className="md:col-span-2 bg-card border border-border p-8 rounded-[2rem] transition-colors group relative overflow-hidden"
        >
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
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.05, ease: "easeOut" }}
                    className="flex-1 bg-status-done/20 rounded-t-sm hover:bg-status-done/30 transition-colors cursor-pointer group/bar relative"
                  >
                    <div
                      className="absolute top-0 w-full bg-status-done rounded-t-sm transition-all"
                      style={{ height: `${Math.max(10, h / 3)}%` }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

