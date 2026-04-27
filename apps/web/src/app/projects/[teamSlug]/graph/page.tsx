"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { TaskDependencyGraph } from "@/components/dashboard/graph/TaskDependencyGraph";
import { GanttView } from "@/components/dashboard/graph/GanttView";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Network, BarChartHorizontal } from "lucide-react";

type View = "graph" | "gantt";

export default function GraphPage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const [view, setView] = useState<View>("graph");

  return (
    <div className="h-full flex flex-col bg-background p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto overflow-x-hidden relative w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-border pb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Task Graph & Timeline
          </h1>
          <p className="text-text-muted mt-2">
            Visualisasi dependensi dan jadwal pengerjaan task
          </p>
        </div>

        {/* View toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={view === "graph" ? "primary" : "ghost"}
              className={cn(
                "flex-1 sm:flex-none shadow-sm",
                view !== "graph" && "border border-border bg-card text-text-muted hover:bg-muted"
              )}
              onClick={() => setView("graph")}
              leftIcon={<Network className="w-4 h-4" />}
            >
              Dependency Graph
            </Button>
            <Button
              variant={view === "gantt" ? "primary" : "ghost"}
              className={cn(
                "flex-1 sm:flex-none shadow-sm",
                view !== "gantt" && "border border-border bg-card text-text-muted hover:bg-muted"
              )}
              onClick={() => setView("gantt")}
              leftIcon={<BarChartHorizontal className="w-4 h-4" />}
            >
              Gantt Chart
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card rounded-xl border border-border overflow-hidden flex-1 flex flex-col relative min-h-[500px]">
        {view === "graph" ? (
          <TaskDependencyGraph teamSlug={teamSlug} />
        ) : (
          <GanttView teamSlug={teamSlug} />
        )}
      </div>
    </div>
  );
}
