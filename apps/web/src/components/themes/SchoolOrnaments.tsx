"use client";

import { BookOpen, Pencil, GraduationCap, Star, BookCheck } from "lucide-react";
import { motion } from "motion/react";

export function SchoolSidebarOrnament() {
  return (
    <div className="absolute bottom-4 left-0 w-full pointer-events-none overflow-hidden z-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative h-32"
      >
        <BookOpen
          size={72}
          className="absolute bottom-2 left-3 text-text-subtle opacity-[0.07] rotate-[-12deg]"
        />
        <GraduationCap
          size={48}
          className="absolute bottom-10 left-12 text-text-subtle opacity-[0.05] rotate-[8deg]"
        />
        <Star
          size={28}
          className="absolute bottom-0 right-4 text-text-subtle opacity-[0.06] rotate-[15deg]"
        />
        <Pencil
          size={36}
          className="absolute bottom-6 right-8 text-text-subtle opacity-[0.06] rotate-[-25deg]"
        />
      </motion.div>
    </div>
  );
}

export function SchoolEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-text-muted">
      <div className="relative">
        <BookOpen size={56} className="opacity-30" />
        <Star
          size={20}
          className="absolute -top-1 -right-1 opacity-40 text-priority-medium"
        />
      </div>
      <p className="text-sm font-medium flex items-center gap-1.5">
        Tidak ada isu. Waktunya belajar! <GraduationCap size={16} />
      </p>
    </div>
  );
}

export function SchoolHeaderAccent() {
  return <BookCheck size={18} className="text-text-subtle opacity-50 mr-1.5" />;
}

export function SchoolNavbarOrnament() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-[0]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative w-full h-full"
      >
        <BookOpen
          size={36}
          className="absolute top-1 right-[35%] text-text-subtle opacity-[0.04] rotate-[-12deg]"
        />
        <Pencil
          size={24}
          className="absolute top-6 right-[45%] text-text-subtle opacity-[0.03] rotate-[25deg]"
        />
        <GraduationCap
          size={28}
          className="absolute top-3 right-[18%] text-text-subtle opacity-[0.02] rotate-[8deg]"
        />
        <Star
          size={18}
          className="absolute top-2 right-[25%] text-text-subtle opacity-[0.03] rotate-[-15deg]"
        />
      </motion.div>
    </div>
  );
}
