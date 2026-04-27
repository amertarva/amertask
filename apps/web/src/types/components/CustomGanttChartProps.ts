import type { GraphNode } from "@/lib/core/scheduling.api";

export interface CustomGanttChartProps {
  tasks: GraphNode[];
  viewMode: "Day" | "Week" | "Month";
}
