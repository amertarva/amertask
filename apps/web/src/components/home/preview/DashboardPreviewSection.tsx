"use client";

import { useState } from "react";
import {
  BarChart3,
  KanbanSquare,
  Layout,
  Search,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BoardPreview from "./BoardPreview";
import BacklogPreview from "./BacklogPreview";
import AnalyticsPreview from "./AnalyticsPreview";
import TeamPreview from "./TeamPreview";
import { motion, AnimatePresence } from "motion/react";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div
      className={cn(
        embedded
          ? "w-full"
          : "container mx-auto px-6 pb-24 md:pb-32",
        className,
      )}
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

          <div className="flex h-[450px] md:h-[600px] w-full relative">
            <motion.div
              animate={{ width: isSidebarOpen ? 200 : 56 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "flex flex-col border-r border-border bg-card/50 p-3 lg:p-4 space-y-6 overflow-hidden",
              )}
            >
              <div
                className={cn(
                  "flex items-center mb-4 transition-all duration-300",
                  isSidebarOpen
                    ? "justify-between px-1"
                    : "flex-col gap-4 justify-center mt-2",
                )}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src="/company-logos/amertask.svg"
                    alt="Amertask Logo"
                    className="w-7 h-7 shrink-0"
                  />
                </div>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={cn(
                    "text-text-muted hover:text-text transition-colors",
                    !isSidebarOpen && "p-1.5 hover:bg-muted/50 rounded-lg",
                  )}
                  title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                  {isSidebarOpen ? (
                    <PanelLeftClose className="w-4 h-4" />
                  ) : (
                    <PanelLeftOpen className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="space-y-1">
                {[
                  { id: "board", icon: Layout, label: "Active Board" },
                  { id: "backlog", icon: KanbanSquare, label: "Backlog" },
                  { id: "analytics", icon: BarChart3, label: "Analytics" },
                  { id: "team", icon: Users, label: "Team Members" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as TabType)}
                    className={cn(
                      "w-full flex items-center gap-3 font-medium text-sm rounded-lg transition-all relative group",
                      isSidebarOpen ? "px-3 py-2" : "justify-center p-2",
                      activeTab === item.id
                        ? "text-text border border-border bg-card/50 shadow-sm"
                        : "text-text-muted hover:text-text hover:bg-muted/50",
                    )}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    {activeTab === item.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/5 rounded-lg -z-10"
                      />
                    )}
                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        activeTab === item.id ? "text-primary" : "group-hover:text-primary/70",
                      )}
                    />
                    {isSidebarOpen && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </button>
                ))}
              </div>
              {isSidebarOpen ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="pt-6 space-y-3"
                >
                  <div className="px-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Favorites
                  </div>
                  <motion.div 
                    whileHover={{ x: 4 }}
                    className="px-3 py-1.5 flex items-center gap-3 text-sm text-text-muted hover:text-text cursor-pointer"
                  >
                    <span className="w-2 h-2 shrink-0 rounded-full bg-primary" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                      Website Redesign
                    </span>
                  </motion.div>
                  <motion.div 
                    whileHover={{ x: 4 }}
                    className="px-3 py-1.5 flex items-center gap-3 text-sm text-text-muted hover:text-text cursor-pointer"
                  >
                    <span className="w-2 h-2 shrink-0 rounded-full bg-accent" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                      Mobile App Q3
                    </span>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="pt-6 space-y-3 flex flex-col items-center">
                  <div
                    className="w-full flex justify-center py-1.5 cursor-pointer"
                    title="Website Redesign"
                  >
                    <span className="w-2 h-2 shrink-0 rounded-full bg-primary" />
                  </div>
                  <div
                    className="w-full flex justify-center py-1.5 cursor-pointer"
                    title="Mobile App Q3"
                  >
                    <span className="w-2 h-2 shrink-0 rounded-full bg-accent" />
                  </div>
                </div>
              )}
            </motion.div>

            <div className="flex-1 flex flex-col overflow-hidden relative pb-0">
              <div className="flex-1 overflow-y-auto relative flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex-1"
                  >
                    {activeTab === "board" && <BoardPreview />}
                    {activeTab === "backlog" && <BacklogPreview />}
                    {activeTab === "analytics" && <AnalyticsPreview />}
                    {activeTab === "team" && <TeamPreview />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

