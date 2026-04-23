import React from "react";
import TaskCard from "../TaskCard";

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
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-primary-foreground bg-gradient-to-br shadow-sm ${i === 1 ? "from-primary to-primary-hover" : i === 2 ? "from-accent to-accent" : "from-status-done to-status-done"} hover:z-10 transition-transform hover:scale-110`}
              style={{ zIndex: 3 - i }}
            >
              U{i}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 md:gap-6 h-full overflow-hidden">
        <div className="flex-1 space-y-4 min-w-[200px]">
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
          />
          <TaskCard
            id="AMK-102"
            title="Update Color Tokens"
            tag="Design"
            priority="medium"
          />
        </div>
        <div className="flex-1 space-y-4 min-w-[200px]">
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
            title="Redesign Landing Page"
            tag="Frontend"
            priority="high"
            active
          />
        </div>
        <div className="flex-1 space-y-4 min-w-[200px] hidden lg:block">
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
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-card to-transparent pointer-events-none" />
    </div>
  );
}
