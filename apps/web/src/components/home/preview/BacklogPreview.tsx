import React from "react";

export default function BacklogPreview() {
  return (
    <div className="flex-1 p-6 md:p-8 bg-background/30 overflow-hidden flex flex-col gap-6 relative animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            Backlog
          </h2>
          <p className="text-sm text-text-muted mt-1">48 issues total</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
          Create Issue
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
        {/* Next Sprint */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm font-semibold text-text border-b border-border/50 pb-2">
            <span className="flex items-center gap-2">
              Sprint 43
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                Next
              </span>
            </span>
            <span className="text-text-muted font-normal text-xs">
              8 issues
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <BacklogRow
              id="AMK-108"
              title="Implement real-time updates for issue board"
              tag="Backend"
              priority="high"
            />
            <BacklogRow
              id="AMK-109"
              title="Design system overhaul phase 2"
              tag="Design"
              priority="medium"
            />
          </div>
        </div>

        {/* Backlog */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm font-semibold text-text border-b border-border/50 pb-2">
            <span>Backlog</span>
            <span className="text-text-muted font-normal text-xs">
              40 issues
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <BacklogRow
              id="AMK-110"
              title="User profile settings page redesign"
              tag="Frontend"
              priority="low"
            />
            <BacklogRow
              id="AMK-111"
              title="Optimize database queries for heavy loads"
              tag="Backend"
              priority="medium"
            />
            <BacklogRow
              id="AMK-112"
              title="Create onboarding flow for new workspaces"
              tag="Design"
              priority="high"
            />
            <BacklogRow
              id="AMK-113"
              title="Fix navigation bug on mobile Safari"
              tag="Frontend"
              priority="high"
            />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
    </div>
  );
}

function BacklogRow({ id, title, tag, priority }: any) {
  return (
    <div className="flex items-center gap-4 p-3 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors cursor-pointer group shadow-sm hover:shadow-md">
      <div className="flex items-center gap-3 w-32 shrink-0">
        <div
          className={`w-2 h-2 rounded-full shadow-sm ${priority === "high" ? "bg-[#FF5F56]" : priority === "medium" ? "bg-[#FFBD2E]" : "bg-[#27C93F]"}`}
        />
        <span className="text-xs font-semibold text-text-muted group-hover:text-text transition-colors">
          {id}
        </span>
      </div>
      <div className="flex-1 text-sm font-medium text-text group-hover:text-primary transition-colors truncate">
        {title}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${tag === "Backend" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : tag === "Frontend" ? "bg-primary/10 text-primary border-ring/20" : "bg-pink-500/10 text-pink-500 border-pink-500/20"}`}
        >
          {tag}
        </span>
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-border">
          U
        </div>
      </div>
    </div>
  );
}
