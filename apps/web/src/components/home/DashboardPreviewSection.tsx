import {
  BarChart3,
  KanbanSquare,
  Layout,
  Search,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TaskCard from "./TaskCard";

interface DashboardPreviewSectionProps {
  embedded?: boolean;
  className?: string;
}

export default function DashboardPreviewSection({
  embedded = false,
  className,
}: DashboardPreviewSectionProps) {
  return (
    <div
      className={cn(
        embedded
          ? "w-full animate-slide-up"
          : "container mx-auto px-6 pb-24 md:pb-32 animate-slide-up",
        className,
      )}
      style={{ animationDelay: "200ms" }}
    >
      <div
        className={cn(
          "relative mx-auto",
          embedded ? "max-w-none" : "max-w-5xl",
        )}
      >
        <div className="absolute -inset-1 bg-gradient-to-b from-primary/30 to-secondary/10 rounded-[2rem] blur-xl opacity-50" />
        <div className="relative rounded-2xl bg-card border border-border overflow-hidden shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-background/50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-md px-24 py-1.5 text-xs text-text-muted invisible md:visible">
              <Search className="w-3 h-3" /> Search amertask...
            </div>
            <div className="w-16"></div>
          </div>

          <div className="flex h-[450px] md:h-[600px] w-full">
            <div className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 p-4 space-y-6">
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg tracking-tight">
                  Amertask
                </span>
              </div>
              <div className="space-y-1">
                <div className="px-3 py-2 flex items-center gap-3 text-text bg-primary/10 rounded-lg font-medium text-sm border border-primary/20">
                  <Layout className="w-4 h-4 text-primary" /> Active Board
                </div>
                <div className="px-3 py-2 flex items-center gap-3 text-text-muted hover:text-text transition-colors text-sm hover:bg-muted/50 rounded-lg">
                  <KanbanSquare className="w-4 h-4" /> Backlog
                </div>
                <div className="px-3 py-2 flex items-center gap-3 text-text-muted hover:text-text transition-colors text-sm hover:bg-muted/50 rounded-lg">
                  <BarChart3 className="w-4 h-4" /> Analytics
                </div>
                <div className="px-3 py-2 flex items-center gap-3 text-text-muted hover:text-text transition-colors text-sm hover:bg-muted/50 rounded-lg">
                  <Users className="w-4 h-4" /> Team Members
                </div>
              </div>
              <div className="pt-6 space-y-3">
                <div className="px-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                  Favorites
                </div>
                <div className="px-3 py-1.5 flex items-center gap-3 text-sm text-text-muted hover:text-text cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Website
                  Redesign
                </div>
                <div className="px-3 py-1.5 flex items-center gap-3 text-sm text-text-muted hover:text-text cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-accent" /> Mobile App
                  Q3
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 md:p-8 bg-background/30 overflow-hidden flex flex-col gap-6 relative">
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
                      className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-primary-foreground bg-gradient-to-br shadow-sm ${i === 1 ? "from-primary to-primary-hover" : i === 2 ? "from-accent to-accent" : "from-status-done to-status-done"} hover:z-10 transition-transform hover:scale-110 z-[${3 - i}]`}
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
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
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
                      <div className="w-2 h-2 rounded-full bg-status-done" />{" "}
                      Done
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
          </div>
        </div>
      </div>
    </div>
  );
}
