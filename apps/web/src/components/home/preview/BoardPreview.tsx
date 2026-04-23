import React from "react";
import TaskCard from "../TaskCard";

const TEAM = {
  UK: { initials: "UK", color: "from-blue-500 to-indigo-600" },
  NS: { initials: "NS", color: "from-pink-500 to-rose-600" },
  R: { initials: "R", color: "from-emerald-500 to-teal-600" },
  I: { initials: "I", color: "from-orange-500 to-red-600" },
  G: { initials: "G", color: "from-primary to-primary-hover" },
};

export default function BoardPreview() {
  return (
    <div className="flex-1 p-6 md:p-8 bg-background/30 overflow-hidden flex flex-col gap-6 relative animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            Sprint 42
            <span className="text-xs px-2 py-1 bg-status-done/10 text-status-done rounded-full border border-status-done/20">
              Active
            </span>
          </h2>
          <p className="text-sm text-text-muted mt-1">
            12 issues • 4 days remaining
          </p>
        </div>
        <div className="flex -space-x-3 hover:-space-x-1 transition-all">
          {[TEAM.UK, TEAM.NS, TEAM.R, TEAM.G].map((member, i) => (
            <div
              key={member.initials}
              className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br shadow-sm ${member.color} hover:z-10 transition-transform hover:scale-110`}
              style={{ zIndex: 3 - i }}
            >
              {member.initials}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 h-full overflow-x-auto pb-4 hide-scrollbar snap-x px-1">
        <div className="flex-1 space-y-4 min-w-[280px] md:min-w-[160px] xl:min-w-[200px] snap-center">
          <div className="flex items-center justify-between text-sm font-semibold text-text pb-2 border-b border-border/50">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted" /> To Do
              <span className="ml-1 bg-muted px-2 rounded-full text-xs text-text-muted">
                2
              </span>
            </span>
          </div>
          <TaskCard
            id="AMK-101"
            title="API Auth Setup"
            tag="Backend"
            priority="high"
            assignee={TEAM.I}
          />
          <TaskCard
            id="AMK-102"
            title="Update Color Tokens"
            tag="Design"
            priority="medium"
            assignee={TEAM.UK}
          />
        </div>
        <div className="flex-1 space-y-4 min-w-[280px] md:min-w-[160px] xl:min-w-[200px] snap-center">
          <div className="flex items-center justify-between text-sm font-semibold text-text pb-2 border-b border-border/50">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.8)]" />
              In Progress
              <span className="ml-1 bg-muted px-2 rounded-full text-xs text-text-muted">
                1
              </span>
            </span>
          </div>
          <TaskCard
            id="AMK-104"
            title="Design Landing Page"
            tag="Frontend"
            priority="high"
            active
            assignee={TEAM.NS}
          />
        </div>
        <div className="flex-1 space-y-4 min-w-[280px] md:min-w-[160px] xl:min-w-[200px] snap-center md:hidden lg:block">
          <div className="flex items-center justify-between text-sm font-semibold text-text pb-2 border-b border-border/50">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-status-done" /> Done
              <span className="ml-1 bg-muted px-2 rounded-full text-xs text-text-muted">
                3
              </span>
            </span>
          </div>
          <TaskCard
            id="AMK-105"
            title="Monorepo Init"
            tag="DevOps"
            priority="low"
            assignee={TEAM.R}
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
    </div>
  );
}
