"use client";

import Link from "next/link";
import { ArrowRight, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import DashboardPreviewSection from "@/components/home/preview/DashboardPreviewSection";
import MobileDashboardPreview from "@/components/home/mobile/MobileDashboardPreview";
import { motion, type Variants } from "motion/react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, x: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1] as const,
      delay: 0.4,
    },
  },
};


export default function HeroSection() {
  return (
    <div className="mx-auto w-full max-w-450 px-4 sm:px-6 lg:px-8 pt-20 pb-20 md:pt-24 md:pb-28 overflow-hidden">
      <div className="grid items-center gap-10 lg:gap-12 lg:grid-cols-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 text-center lg:text-left space-y-8"
        >
          <motion.div variants={itemVariants} className="space-y-5">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-7xl font-extrabold tracking-tight pb-2 leading-[1.1]">
              Kendalikan
              <br className="hidden lg:block" /> Setiap Sprint.
            </h1>
          </motion.div>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            Kelola proyek enterprise secara terstruktur dan cepat melalui
            kolaborasi tim tanpa batas!
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 pt-4"
          >
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="group w-full rounded-2xl !bg-[#e9c46a] dark:!bg-[#F4D35E] hover:!bg-[#e9c46a] dark:hover:!bg-[#F4D35E] hover:brightness-95 px-8 py-7 text-xl font-medium !text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-none"
                rightIcon={
                  <MoveRight className="w-7 h-7 ml-2 transition-transform duration-300 group-hover:translate-x-2" strokeWidth={2.5} />
                }
              >
                Mulai Eksplorasi
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="group w-full sm:w-auto rounded-2xl border border-border/80 bg-background/50 backdrop-blur-md px-8 py-6 text-lg font-semibold shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-muted hover:border-border hover:shadow-md"
            >
              Pelajari Selengkapnya
            </Button>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-10 flex flex-col items-center lg:items-start gap-8">
            <div className="flex flex-col xl:flex-row items-center lg:items-start xl:items-center gap-6 xl:gap-8">
              {/* Avatar Stack */}
              <div className="inline-flex items-center gap-3.5 bg-card/50 border border-border/60 rounded-full pr-5 p-1.5 shadow-sm backdrop-blur-md hover:border-primary/30 transition-colors duration-300 group cursor-default">
                <div className="flex -space-x-3">
                  <motion.img
                    whileHover={{ scale: 1.1, zIndex: 50 }}
                    src="/partnership/freelinkd.svg"
                    alt="Freelinkd"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-background object-contain bg-white p-1 relative z-10"
                  />
                  <motion.img
                    whileHover={{ scale: 1.1, zIndex: 50 }}
                    src="/partnership/smkn31jkt.svg"
                    alt="SMKN 31 Jakarta"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-background object-contain bg-white p-1.5 relative z-20"
                  />
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-background bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center text-[11px] sm:text-xs font-bold text-white relative z-40 shadow-sm group-hover:bg-primary transition-colors duration-300">
                    +2
                  </div>
                </div>
                <div className="text-[11px] sm:text-xs font-medium text-text-muted text-left leading-tight">
                  Dipercaya oleh <span className="text-text font-bold">10.000+</span><br/>
                  pengguna aktif
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={imageVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 w-full"
        >
          {/* Desktop Preview */}
          <div className="hidden md:block relative">
            <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full opacity-50 animate-pulse"></div>
            <div className="relative">
              <DashboardPreviewSection embedded />
            </div>
          </div>
          {/* Mobile Phone Mockup Preview */}
          <div className="flex md:hidden w-full justify-center px-4 mt-12 mb-8">
            <MobileDashboardPreview />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

