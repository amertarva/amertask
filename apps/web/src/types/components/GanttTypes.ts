import type { GraphNode } from "@/lib/core/scheduling.api";
import type { IssueStatus } from "../constants/IssueStatus";

export interface StatusConfig {
  label: string;
  color: string;
  textColor: string;
  opacity: number;
  barStyle: "solid" | "outline" | "dashed";
  showByDefault: boolean;
  dotColor: string;
}

export interface FilterToggleProps {
  activeFilters: Set<IssueStatus>;
  onToggle: (status: IssueStatus) => void;
  counts: Partial<Record<IssueStatus, number>>;
}

export interface TooltipData {
  node: GraphNode;
  barRect: {
    left: number;
    right: number;
    bottom: number;
    width: number;
    top: number;
  };
}

export interface GanttTooltipProps {
  data: TooltipData | null;
  visible: boolean;
}
