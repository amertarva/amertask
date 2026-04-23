"use client";

import { useState } from "react";
import {
  Bell,
  Search,
  Layout,
  KanbanSquare,
  BarChart3,
  Users,
  Plus,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TaskCard from "../TaskCard";

type TabType = "board" | "backlog" | "analytics" | "team";

export default function MobileDashboardPreview() {
  const [activeTab, setActiveTab] = useState<TabType>("board");

  return (
    <div
      className="relative mx-auto w-full max-w-[340px] sm:max-w-[360px] flex items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 drop-shadow-2xl"
      style={{ animationDelay: "300ms" }}
    >
      {/* Device Mockup Image (Frame) */}
      <img
        src="/mock/ip14.png"
        alt="iPhone 14 Mockup"
        className="w-full h-auto relative z-20 pointer-events-none"
      />

      {/* Screen Content - Positioned absolutely to fit within the mockup's screen area */}
      <div
        className="absolute z-10 bg-background overflow-hidden flex flex-col"
        style={{
          top: "2.3%",
          bottom: "2.5%",
          left: "5.5%",
          right: "5.5%",
          borderRadius: "2.5rem",
        }}
      >
        {/* Status Bar Mock */}

        <div className="w-full h-10 flex justify-between items-center px-6 pt-1 text-[11px] font-medium text-text-muted bg-background/95 backdrop-blur-md z-30 absolute top-0 left-0 right-0">
          <span className="font-semibold tracking-wider text-text pl-1">
            9:41
          </span>
          <div className="flex gap-1.5 items-center pr-1">
            <div className="w-3.5 h-3.5 rounded-full border border-text text-[6px] flex items-center justify-center font-bold">
              5G
            </div>
            <div className="flex gap-[2px] items-end h-3">
              <div className="w-1 h-1.5 bg-text rounded-[1px]" />
              <div className="w-1 h-2 bg-text rounded-[1px]" />
              <div className="w-1 h-2.5 bg-text rounded-[1px]" />
              <div className="w-1 h-3 bg-text-muted/50 rounded-[1px]" />
            </div>
            <div className="w-5 h-2.5 rounded-[3px] border border-text/50 p-[1px] relative">
              <div className="bg-text h-full w-[80%] rounded-[1px]" />
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-[2px] h-1 bg-text/50 rounded-r-sm" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="pt-14 pb-5 px-5 bg-background/95 backdrop-blur-xl border-b border-border/50 sticky top-0 z-20">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-sm font-bold text-white shadow-md ring-2 ring-background relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                U
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium mb-0.5">
                  Selamat Pagi,
                </p>
                <p className="text-sm font-bold text-text leading-none">
                  Uta Kotobuki
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center text-text hover:bg-muted transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center text-text hover:bg-muted transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-destructive border-2 border-background" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border/40 shadow-sm">
            <div>
              <h1 className="text-base font-bold tracking-tight text-text">
                Sprint 42
              </h1>
              <p className="text-[11px] text-text-muted mt-0.5 font-medium">
                12 issues • 4 days remaining
              </p>
            </div>
            <button className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20 hover:bg-primary-hover transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background/40 px-4 py-4 pb-32 hide-scrollbar relative z-0">
          {activeTab === "board" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Horizontal Status Pills */}
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-1 -mx-1">
                <button className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold whitespace-nowrap shadow-sm shadow-primary/20 transition-transform active:scale-95">
                  All Issues (6)
                </button>
                <button className="px-4 py-1.5 rounded-full bg-card hover:bg-muted text-text-muted hover:text-text text-xs font-semibold whitespace-nowrap border border-border/50 transition-all active:scale-95">
                  To Do (2)
                </button>
                <button className="px-4 py-1.5 rounded-full bg-card hover:bg-muted text-text-muted hover:text-text text-xs font-semibold whitespace-nowrap border border-border/50 transition-all active:scale-95">
                  In Progress (1)
                </button>
                <button className="px-4 py-1.5 rounded-full bg-card hover:bg-muted text-text-muted hover:text-text text-xs font-semibold whitespace-nowrap border border-border/50 transition-all active:scale-95">
                  Done (3)
                </button>
              </div>

              {/* Tasks Feed */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold flex items-center gap-2 text-text uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.6)]" />
                    In Progress
                  </h3>
                  <button className="text-text-muted hover:text-text transition-colors">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="transform transition-all hover:-translate-y-1">
                  <TaskCard
                    id="AMK-104"
                    title="Design Landing Page"
                    tag="Frontend"
                    priority="high"
                    active
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold flex items-center gap-2 text-text uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                    To Do
                  </h3>
                  <button className="text-text-muted hover:text-text transition-colors">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="transform transition-all hover:-translate-y-1">
                    <TaskCard
                      id="AMK-101"
                      title="API Auth Setup"
                      tag="Backend"
                      priority="high"
                    />
                  </div>
                  <div className="transform transition-all hover:-translate-y-1">
                    <TaskCard
                      id="AMK-102"
                      title="Update Color Tokens"
                      tag="Design"
                      priority="medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 opacity-60">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold flex items-center gap-2 text-text uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-status-done" />
                    Done
                  </h3>
                </div>
                <div className="grayscale-[20%]">
                  <TaskCard
                    id="AMK-105"
                    title="Monorepo Init"
                    tag="DevOps"
                    priority="low"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "backlog" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold flex items-center gap-2 text-text uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-primary/20 border border-primary/50" />
                  Sprint 43{" "}
                  <span className="text-[9px] bg-primary/10 text-primary px-1.5 rounded-full border border-primary/20">
                    NEXT
                  </span>
                </h3>
                <span className="text-text-muted text-[10px]">8 issues</span>
              </div>
              <div className="space-y-3">
                <TaskCard
                  id="AMK-108"
                  title="Implement real-time updates"
                  tag="Backend"
                  priority="high"
                />
                <TaskCard
                  id="AMK-109"
                  title="Design system overhaul phase 2"
                  tag="Design"
                  priority="medium"
                />
              </div>

              <div className="flex items-center justify-between px-1 pt-2 opacity-70">
                <h3 className="text-xs font-bold flex items-center gap-2 text-text uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  Backlog
                </h3>
                <span className="text-text-muted text-[10px]">40 issues</span>
              </div>
              <div className="space-y-3 opacity-80 grayscale-[10%]">
                <TaskCard
                  id="AMK-110"
                  title="User profile settings redesign"
                  tag="Frontend"
                  priority="low"
                />
                <TaskCard
                  id="AMK-111"
                  title="Optimize database queries"
                  tag="Backend"
                  priority="medium"
                />
                <TaskCard
                  id="AMK-112"
                  title="Create onboarding flow"
                  tag="Design"
                  priority="high"
                />
                <TaskCard
                  id="AMK-113"
                  title="Fix navigation bug on mobile"
                  tag="Frontend"
                  priority="high"
                />
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-card border border-border/60 rounded-2xl shadow-sm">
                  <div className="text-[10px] font-medium text-text-muted mb-1">
                    Issues Completed
                  </div>
                  <div className="text-xl font-bold flex items-end gap-1.5 text-text">
                    124{" "}
                    <span className="text-[9px] text-status-done mb-1 font-semibold bg-status-done/10 px-1 py-0.5 rounded border border-status-done/20">
                      +14%
                    </span>
                  </div>
                </div>
                <div className="p-3.5 bg-card border border-border/60 rounded-2xl shadow-sm">
                  <div className="text-[10px] font-medium text-text-muted mb-1">
                    Cycle Time
                  </div>
                  <div className="text-xl font-bold flex items-end gap-1.5 text-text">
                    2.4d{" "}
                    <span className="text-[9px] text-primary mb-1 font-semibold bg-primary/10 px-1 py-0.5 rounded border border-primary/20">
                      -0.2d
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col shadow-sm h-48">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-semibold text-text">
                    Velocity
                  </div>
                  <div className="flex items-center gap-2 text-[9px]">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>{" "}
                      Done
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted border border-border"></span>{" "}
                      Plan
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex items-end gap-2 relative">
                  {[
                    { p: 40, c: 35 },
                    { p: 55, c: 50 },
                    { p: 30, c: 35 },
                    { p: 70, c: 65 },
                    { p: 45, c: 45 },
                    { p: 80, c: 75 },
                    { p: 60, c: 65 },
                  ].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-end h-full gap-1"
                    >
                      <div className="w-full flex justify-center gap-0.5 items-end h-full">
                        <div
                          className="w-1/2 bg-muted border border-border/50 rounded-t-sm"
                          style={{ height: `${v.p}%` }}
                        ></div>
                        <div
                          className="w-1/2 bg-primary/80 rounded-t-sm"
                          style={{ height: `${v.c}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {[
                {
                  name: "Uta Kotobuki",
                  role: "Lead Engineer",
                  status: "online",
                  initials: "UK",
                  color: "from-blue-500 to-indigo-600",
                  tasks: 4,
                },
                {
                  name: "Nanda Shuzie",
                  role: "Product Designer",
                  status: "offline",
                  initials: "NS",
                  color: "from-pink-500 to-rose-600",
                  tasks: 2,
                },
                {
                  name: "Rasendriya",
                  role: "Frontend Dev",
                  status: "online",
                  initials: "R",
                  color: "from-emerald-500 to-teal-600",
                  tasks: 5,
                },
                {
                  name: "Iamz",
                  role: "Backend Dev",
                  status: "busy",
                  initials: "I",
                  color: "from-orange-500 to-red-600",
                  tasks: 3,
                },
                {
                  name: "Golip",
                  role: "QA Engineer",
                  status: "online",
                  initials: "G",
                  color: "from-primary to-primary-hover",
                  tasks: 1,
                },
              ].map((member, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-card border border-border/60 rounded-2xl shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-background`}
                      >
                        {member.initials}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-card ${member.status === "online" ? "bg-[#27C93F]" : member.status === "busy" ? "bg-[#FFBD2E]" : "bg-muted"}`}
                      ></div>
                    </div>
                    <div>
                      <div className="font-bold text-[11px] text-text">
                        {member.name}
                      </div>
                      <div className="text-[10px] font-medium text-text-muted">
                        {member.role}
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] font-semibold bg-muted/50 text-text-muted px-2 py-1 rounded-md border border-border/50">
                    {member.tasks} tasks
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fade out gradient for content bottom */}
        <div className="absolute bottom-[90px] left-0 right-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />

        {/* Mobile Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 h-[90px] bg-card/90 backdrop-blur-xl border-t border-border/40 flex justify-around items-start pt-3 px-4 z-20 pb-4">
          <button
            onClick={() => setActiveTab("board")}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all min-w-[64px]",
              activeTab === "board"
                ? "text-primary scale-105"
                : "text-text-muted hover:text-text",
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                activeTab === "board"
                  ? "bg-primary/15 shadow-sm"
                  : "bg-transparent",
              )}
            >
              <Layout
                className={cn(
                  "w-[22px] h-[22px] transition-all",
                  activeTab === "board"
                    ? "fill-primary/20 stroke-primary"
                    : "stroke-text-muted",
                )}
              />
            </div>
            <span className="text-[10px] font-bold tracking-wide mt-0.5">
              Board
            </span>
          </button>

          <button
            onClick={() => setActiveTab("backlog")}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all min-w-[64px]",
              activeTab === "backlog"
                ? "text-primary scale-105"
                : "text-text-muted hover:text-text",
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                activeTab === "backlog"
                  ? "bg-primary/15 shadow-sm"
                  : "bg-transparent",
              )}
            >
              <KanbanSquare
                className={cn(
                  "w-[22px] h-[22px] transition-all",
                  activeTab === "backlog"
                    ? "fill-primary/20 stroke-primary"
                    : "stroke-text-muted",
                )}
              />
            </div>
            <span className="text-[10px] font-bold tracking-wide mt-0.5">
              Backlog
            </span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all min-w-[64px]",
              activeTab === "analytics"
                ? "text-primary scale-105"
                : "text-text-muted hover:text-text",
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                activeTab === "analytics"
                  ? "bg-primary/15 shadow-sm"
                  : "bg-transparent",
              )}
            >
              <BarChart3
                className={cn(
                  "w-[22px] h-[22px] transition-all",
                  activeTab === "analytics"
                    ? "fill-primary/20 stroke-primary"
                    : "stroke-text-muted",
                )}
              />
            </div>
            <span className="text-[10px] font-bold tracking-wide mt-0.5">
              Stats
            </span>
          </button>

          <button
            onClick={() => setActiveTab("team")}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all min-w-[64px]",
              activeTab === "team"
                ? "text-primary scale-105"
                : "text-text-muted hover:text-text",
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                activeTab === "team"
                  ? "bg-primary/15 shadow-sm"
                  : "bg-transparent",
              )}
            >
              <Users
                className={cn(
                  "w-[22px] h-[22px] transition-all",
                  activeTab === "team"
                    ? "fill-primary/20 stroke-primary"
                    : "stroke-text-muted",
                )}
              />
            </div>
            <span className="text-[10px] font-bold tracking-wide mt-0.5">
              Team
            </span>
          </button>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[5px] bg-text/40 rounded-full z-30" />
      </div>
    </div>
  );
}
