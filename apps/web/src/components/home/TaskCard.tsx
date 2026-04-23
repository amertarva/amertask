"use client";

import { motion } from "motion/react";

interface TaskCardProps {
  id: string;
  title: string;
  tag: string;
  priority: "high" | "medium" | "low";
  active?: boolean;
  assignee?: {
    initials: string;
    color: string;
  };
}

export default function TaskCard({
  id,
  title,
  tag,
  priority,
  active,
  assignee = { initials: "G", color: "from-primary to-primary-hover" },
}: TaskCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`p-4 bg-card rounded-xl border ${active ? "border-primary shadow-[0_0_15px_-3px_rgba(var(--color-primary),0.2)]" : "border-border"} hover:border-primary/50 transition-all cursor-pointer group relative`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <span className="text-xs font-medium text-text-muted">{id}</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                tag === "Backend"
                  ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                  : tag === "Frontend"
                    ? "bg-primary/10 text-primary border-ring/20"
                    : tag === "Design"
                      ? "bg-pink-500/10 text-pink-500 border-pink-500/20"
                      : "bg-muted/50 text-text-muted border-muted"
              }`}
            >
              {tag}
            </span>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-text text-sm group-hover:text-primary transition-colors pr-4 leading-tight">
            {title}
          </h4>
        </div>
        <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/50">
          <div
            className={`w-2.5 h-2.5 rounded-full shadow-sm ${priority === "high" ? "bg-[#FF5F56]" : priority === "medium" ? "bg-[#FFBD2E]" : "bg-[#27C93F]"}`}
          />
          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${assignee.color} flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-background`}>
            {assignee.initials}
          </div>
        </div>
      </div>
    </motion.div>
  );
}


