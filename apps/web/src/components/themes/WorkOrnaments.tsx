"use client";

import {
  Briefcase,
  BarChart2,
  Target,
  TrendingUp,
  Trophy,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";

export function WorkSidebarOrnament() {
  return (
    <div className="absolute bottom-4 left-0 w-full pointer-events-none overflow-hidden z-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative h-32"
      >
        <Briefcase
          size={68}
          className="absolute bottom-2 left-3 text-text-subtle opacity-[0.07] rotate-[-8deg]"
        />
        <BarChart2
          size={44}
          className="absolute bottom-12 left-14 text-text-subtle opacity-[0.05] rotate-[5deg]"
        />
        <Target
          size={32}
          className="absolute bottom-1 right-5 text-text-subtle opacity-[0.06] rotate-[10deg]"
        />
        <TrendingUp
          size={36}
          className="absolute bottom-8 right-6 text-text-subtle opacity-[0.06] rotate-[-5deg]"
        />
      </motion.div>
    </div>
  );
}

export function WorkEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-text-muted">
      <div className="relative">
        <Briefcase size={56} className="opacity-30" />
        <Trophy
          size={20}
          className="absolute -top-1 -right-1 opacity-40 text-priority-medium"
        />
      </div>
      <p className="text-sm font-medium flex items-center gap-1.5">
        Tidak ada isu. Semua pekerjaan beres! <Trophy size={16} />
      </p>
    </div>
  );
}

export function WorkHeaderAccent() {
  return <Briefcase size={18} className="text-text-subtle opacity-50 mr-1.5" />;
}

export function WorkKanbanColumnAccent({ status }: { status: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    backlog: <Clock size={13} className="opacity-30" />,
    in_progress: <TrendingUp size={13} className="opacity-30" />,
    done: <Trophy size={13} className="opacity-30" />,
  };
  return iconMap[status] ?? null;
}

export function WorkNavbarOrnament() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-[0]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative w-full h-full"
      >
        <Briefcase
          size={32}
          className="absolute top-2 right-[35%] text-text-subtle opacity-[0.04] rotate-[-8deg]"
        />
        <TrendingUp
          size={24}
          className="absolute top-6 right-[45%] text-text-subtle opacity-[0.03] rotate-[15deg]"
        />
        <Target
          size={28}
          className="absolute top-3 right-[18%] text-text-subtle opacity-[0.02] rotate-[10deg]"
        />
        <BarChart2
          size={22}
          className="absolute top-2 right-[25%] text-text-subtle opacity-[0.03] rotate-[-5deg]"
        />
      </motion.div>
    </div>
  );
}
