"use client";

import { useState } from "react";
import {
  BarChart3,
  KanbanSquare,
  Layout,
  Search,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BoardPreview from "./BoardPreview";
import BacklogPreview from "./BacklogPreview";
import AnalyticsPreview from "./AnalyticsPreview";
import TeamPreview from "./TeamPreview";

type TabType = "board" | "backlog" | "analytics" | "team";

interface DashboardPreviewSectionProps {
  embedded?: boolean;
  className?: string;
}

export default function DashboardPreviewSection({
  embedded = false,
  className,
}: DashboardPreviewSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("board");

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
                <button
                  onClick={() => setActiveTab("board")}
                  className={cn(
                    "w-full px-3 py-2 flex items-center gap-3 font-medium text-sm rounded-lg transition-all",
                    activeTab === "board"
                      ? "text-text border border-border bg-card/50 shadow-sm"
                      : "text-text-muted hover:text-text hover:bg-muted/50",
                  )}
                >
                  <Layout
                    className={cn(
                      "w-4 h-4",
                      activeTab === "board" ? "text-primary" : "",
                    )}
                  />{" "}
                  Active Board
                </button>
                <button
                  onClick={() => setActiveTab("backlog")}
                  className={cn(
                    "w-full px-3 py-2 flex items-center gap-3 font-medium text-sm rounded-lg transition-all",
                    activeTab === "backlog"
                      ? "text-text border border-border bg-card/50 shadow-sm"
                      : "text-text-muted hover:text-text hover:bg-muted/50",
                  )}
                >
                  <KanbanSquare
                    className={cn(
                      "w-4 h-4",
                      activeTab === "backlog" ? "text-primary" : "",
                    )}
                  />{" "}
                  Backlog
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={cn(
                    "w-full px-3 py-2 flex items-center gap-3 font-medium text-sm rounded-lg transition-all",
                    activeTab === "analytics"
                      ? "text-text border border-border bg-card/50 shadow-sm"
                      : "text-text-muted hover:text-text hover:bg-muted/50",
                  )}
                >
                  <BarChart3
                    className={cn(
                      "w-4 h-4",
                      activeTab === "analytics" ? "text-primary" : "",
                    )}
                  />{" "}
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab("team")}
                  className={cn(
                    "w-full px-3 py-2 flex items-center gap-3 font-medium text-sm rounded-lg transition-all",
                    activeTab === "team"
                      ? "text-text border border-border bg-card/50 shadow-sm"
                      : "text-text-muted hover:text-text hover:bg-muted/50",
                  )}
                >
                  <Users
                    className={cn(
                      "w-4 h-4",
                      activeTab === "team" ? "text-primary" : "",
                    )}
                  />{" "}
                  Team Members
                </button>
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

            {activeTab === "board" && <BoardPreview />}
            {activeTab === "backlog" && <BacklogPreview />}
            {activeTab === "analytics" && <AnalyticsPreview />}
            {activeTab === "team" && <TeamPreview />}
          </div>
        </div>
      </div>
    </div>
  );
}
