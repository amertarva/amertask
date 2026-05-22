"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  ConnectionMode,
  Panel,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Calendar,
  Zap,
  AlertTriangle,
  HelpCircle,
  PlayCircle,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { STATUS_CONFIG } from "./GanttView";
import type { IssueStatus } from "@/types";
import {
  schedulingApi,
  type GraphNode,
  type GraphEdge,
} from "@/lib/core/scheduling.api";

// ─── Konstanta warna prioritas ────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  urgent: {
    label: "Urgent",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    dot: "bg-red-500",
  },
  high: {
    label: "High",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    dot: "bg-yellow-500",
  },
  low: {
    label: "Low",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
  },
};

// ─── Layout Helpers ───────────────────────────────────────────────────────────

function computeLevels(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, number> {
  const levelMap = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    adj.get(e.depends_on)?.push(e.issue_id);
    inDegree.set(e.issue_id, (inDegree.get(e.issue_id) ?? 0) + 1);
  }

  const queue = nodes
    .filter((n) => (inDegree.get(n.id) ?? 0) === 0)
    .map((n) => n.id);
  queue.forEach((id) => levelMap.set(id, 0));

  while (queue.length) {
    const curr = queue.shift()!;
    const currLevel = levelMap.get(curr) ?? 0;
    for (const next of adj.get(curr) ?? []) {
      const newLevel = Math.max(levelMap.get(next) ?? 0, currLevel + 1);
      levelMap.set(next, newLevel);
      inDegree.set(next, (inDegree.get(next) ?? 0) - 1);
      if ((inDegree.get(next) ?? 0) <= 0) queue.push(next);
    }
  }

  return levelMap;
}

function getYPosition(
  id: string,
  levelMap: Map<string, number>,
  nodes: GraphNode[],
): number {
  const level = levelMap.get(id) ?? 0;
  const nodesAtLevel = nodes.filter((n) => levelMap.get(n.id) === level);
  const idx = nodesAtLevel.findIndex((n) => n.id === id);
  return idx * 240; // Spasi baris sedikit diperbesar untuk kartu yang lebih tinggi
}

// Helper status icon
function getStatusIcon(status: string) {
  switch (status) {
    case "backlog":
      return <HelpCircle className="w-3.5 h-3.5 text-gray-500" />;
    case "todo":
      return <PlayCircle className="w-3.5 h-3.5 text-blue-500" />;
    case "in_progress":
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-3.5 h-3.5 text-emerald-500" />
        </motion.div>
      );
    case "in_review":
      return <Eye className="w-3.5 h-3.5 text-purple-400" />;
    case "done":
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case "cancelled":
      return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
    default:
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
  }
}

// ─── Custom Node: Task Card ───────────────────────────────────────────────────

function TaskCardNode({
  data,
}: {
  data: GraphNode & { isCritical: boolean; isShifted: boolean };
}) {
  const cfg =
    STATUS_CONFIG[data.status as IssueStatus] ?? STATUS_CONFIG.backlog;
  const statusColor = cfg.dotColor || "#6b7280";

  const duration =
    data.start_date && data.due_date
      ? differenceInDays(new Date(data.due_date), new Date(data.start_date))
      : null;

  const pri = PRIORITY_CONFIG[data.priority] ?? {
    label: data.priority,
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    text: "text-gray-400",
    dot: "bg-gray-500",
  };

  return (
    <div className="relative group">
      {/* Target Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          width: "10px",
          height: "10px",
          left: "-5px",
          background: "#1a1f1d",
          border: `2px solid ${statusColor}`,
          zIndex: 50,
        }}
        className="hover:!scale-125 !transition-all"
      />

      {/* Main Node Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{
          scale: data.isShifted ? [1, 1.02, 1] : 1,
          opacity: 1,
          boxShadow: data.isCritical
            ? [
                "0 0 4px rgba(239, 68, 68, 0.4), 0 10px 25px -5px rgba(0, 0, 0, 0.6)",
                "0 0 16px rgba(239, 68, 68, 0.65), 0 10px 25px -5px rgba(0, 0, 0, 0.6)",
                "0 0 4px rgba(239, 68, 68, 0.4), 0 10px 25px -5px rgba(0, 0, 0, 0.6)",
              ]
            : "0 10px 20px -5px rgba(0, 0, 0, 0.5)",
        }}
        transition={{
          duration: data.isShifted ? 0.6 : 0.3,
          boxShadow: {
            repeat: data.isCritical ? Infinity : 0,
            duration: 2.5,
            ease: "easeInOut",
          },
        }}
        className={`w-[230px] rounded-xl relative overflow-hidden backdrop-blur-md transition-all duration-300 border bg-card/85 group-hover:bg-card/95 select-none ${
          data.isCritical
            ? "border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
            : "border-border/60 hover:border-border"
        }`}
      >
        {/* Left Status Accent Bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ backgroundColor: statusColor }}
        />

        <div className="p-3.5 pl-5 flex flex-col gap-2.5">
          {/* Top metadata row */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-muted-foreground/60 font-medium">
              #{data.number}
            </span>
            <div className="flex items-center gap-1.5">
              {data.isCritical && (
                <span className="text-[8px] bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-extrabold tracking-wider">
                  CRITICAL
                </span>
              )}
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold tracking-wide uppercase ${pri.bg} ${pri.border} ${pri.text}`}
              >
                <span className={`w-1 h-1 rounded-full ${pri.dot}`} />
                {pri.label}
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-xs text-text leading-snug tracking-tight text-left line-clamp-2 pr-1">
            {data.title}
          </h3>

          {/* Status & Date row */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border/20">
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
              {getStatusIcon(data.status)}
              <span
                className="font-semibold capitalize text-[10px]"
                style={{ color: statusColor }}
              >
                {cfg.label}
              </span>
            </div>

            {data.start_date && data.due_date ? (
              <div className="flex items-center gap-1.5 text-[9.5px] text-text-subtle font-medium">
                <Calendar className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                <span className="truncate">
                  {format(new Date(data.start_date), "d MMM", {
                    locale: localeId,
                  })}
                  {" → "}
                  {format(new Date(data.due_date), "d MMM yyyy", {
                    locale: localeId,
                  })}
                </span>
                {duration !== null && (
                  <span className="text-[8.5px] text-primary bg-primary/10 px-1 py-0.2 rounded font-bold shrink-0">
                    {duration}d
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[9.5px] text-text-subtle italic">
                <Calendar className="w-3.5 h-3.5 text-primary/30 shrink-0" />
                <span>Belum dijadwalkan</span>
              </div>
            )}
          </div>

          {/* Assignee & Shifted section */}
          {(data.assignee || data.isShifted) && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border/20">
              {data.assignee && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border"
                    style={{
                      background: `${statusColor}12`,
                      borderColor: `${statusColor}35`,
                      color: statusColor,
                    }}
                  >
                    {data.assignee.initials?.[0] ?? "?"}
                  </div>
                  <span className="text-[10px] text-text-muted font-medium truncate">
                    {data.assignee.name}
                  </span>
                </div>
              )}

              {data.isShifted && (
                <motion.div
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 text-[9px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                  <span className="font-semibold">Jadwal digeser otomatis</span>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Source Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          width: "10px",
          height: "10px",
          right: "-5px",
          background: "#1a1f1d",
          border: `2px solid ${statusColor}`,
          zIndex: 50,
        }}
        className="hover:!scale-125 !transition-all"
      />
    </div>
  );
}

// Main Component

const nodeTypes = { taskCard: TaskCardNode };

import { type TaskDependencyGraphProps } from "@/types/components/TaskDependencyGraphProps";

export function TaskDependencyGraph({
  teamSlug,
  className = "",
}: TaskDependencyGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rawNodesRef = useRef<GraphNode[]>([]);

  // Build React Flow nodes & edges dari raw data
  const buildGraph = useCallback(
    (
      rawNodes: GraphNode[],
      rawEdges: GraphEdge[],
      criticalIds: string[],
      shiftedTaskIds: string[],
    ) => {
      // Auto-layout: posisikan node dalam grid berdasarkan dependency level
      const levelMap = computeLevels(rawNodes, rawEdges);

      const flowNodes: Node[] = rawNodes.map((n) => ({
        id: n.id,
        type: "taskCard",
        position: {
          x: (levelMap.get(n.id) ?? 0) * 310, // Lebar spasi horizontal sedikit diperbesar agar koneksi tidak menumpuk
          y: getYPosition(n.id, levelMap, rawNodes),
        },
        data: {
          ...n,
          isCritical: criticalIds.includes(n.id),
          isShifted: shiftedTaskIds.includes(n.id),
        },
      }));

      const flowEdges: Edge[] = rawEdges.map((e) => {
        const isCriticalEdge =
          criticalIds.includes(e.issue_id) &&
          criticalIds.includes(e.depends_on);
        return {
          id: `${e.depends_on}-${e.issue_id}`,
          source: e.depends_on,
          target: e.issue_id,
          type: "smoothstep",
          animated: isCriticalEdge,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCriticalEdge ? "#ef4444" : "rgba(136, 169, 155, 0.4)",
          },
          style: {
            stroke: isCriticalEdge ? "#ef4444" : "rgba(136, 169, 155, 0.25)",
            strokeWidth: isCriticalEdge ? 2.5 : 1.5,
          },
          label: e.lag_days > 0 ? `+${e.lag_days}d` : undefined,
          labelStyle: { fill: "#88a99b", fontSize: 10, fontWeight: 600 },
          labelBgStyle: {
            fill: "rgba(22, 28, 25, 0.95)",
            stroke: "rgba(136, 169, 155, 0.15)",
            strokeWidth: 1,
            rx: 4,
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    },
    [setNodes, setEdges],
  );

  // Load graph data
  const loadGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[Graph] Fetching graph data for team:", teamSlug);
      const { nodes: rawNodes, edges: rawEdges } =
        await schedulingApi.getGraph(teamSlug);
      console.log("[Graph] Received data:", {
        nodes: rawNodes.length,
        edges: rawEdges.length,
      });
      rawNodesRef.current = rawNodes;
      buildGraph(rawNodes, rawEdges, [], []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Gagal memuat graph";
      console.error("[Graph] Error:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [teamSlug, buildGraph]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // Handle new connection (user drag edge)
  const onConnect = useCallback(
    async (connection: Connection) => {
      try {
        await schedulingApi.addDependency(teamSlug, {
          issueId: connection.target!,
          dependsOnId: connection.source!,
        });
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: "smoothstep",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "rgba(136, 169, 155, 0.4)",
              },
              style: { stroke: "rgba(136, 169, 155, 0.25)", strokeWidth: 1.5 },
            },
            eds,
          ),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Gagal menambahkan dependency";
        alert(errorMessage);
      }
    },
    [teamSlug, setEdges],
  );

  // Handle edge delete (click X pada edge)
  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        try {
          await schedulingApi.removeDependency(teamSlug, {
            issueId: edge.target,
            dependsOnId: edge.source,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Gagal hapus dependency";
          console.error("Gagal hapus dependency:", errorMessage);
        }
      }
    },
    [teamSlug],
  );

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-card/30 border border-border/40 rounded-xl backdrop-blur-sm gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-text-muted text-sm font-medium">
          Memuat dependency graph...
        </span>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-card/30 border border-border/40 rounded-xl backdrop-blur-sm gap-4 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text">Gagal Memuat Graph</h3>
          <p className="text-xs text-text-subtle max-w-sm">{error}</p>
        </div>
        <Button
          onClick={loadGraph}
          variant="secondary"
          className="text-xs gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Coba Lagi
        </Button>
      </div>
    );

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-border/60 bg-card/25 backdrop-blur-sm shadow-xl ${className}`}
      style={{
        height: "100%",
      }}
    >
      <style>{`
        .react-flow__controls {
          background: rgba(22, 28, 25, 0.95) !important;
          border: 1px solid rgba(136, 169, 155, 0.15) !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
          overflow: hidden;
          padding: 2px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 2px !important;
        }
        .react-flow__controls-button {
          background: transparent !important;
          border-bottom: 1px solid rgba(136, 169, 155, 0.08) !important;
          color: #88a99b !important;
          fill: #88a99b !important;
          transition: all 0.2s ease !important;
          width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 4px !important;
        }
        .react-flow__controls-button:last-child {
          border-bottom: none !important;
        }
        .react-flow__controls-button:hover {
          background: rgba(136, 169, 155, 0.12) !important;
          color: #e8edea !important;
        }
        .react-flow__controls-button svg {
          max-width: 14px !important;
          max-height: 14px !important;
        }
        .react-flow__minimap {
          background: rgba(22, 28, 25, 0.95) !important;
          border: 1px solid rgba(136, 169, 155, 0.15) !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
          overflow: hidden !important;
          margin: 16px !important;
        }
        .react-flow__minimap-mask {
          fill: rgba(0, 0, 0, 0.55) !important;
        }
        .react-flow__edge-path {
          transition: stroke-width 0.2s ease, stroke 0.2s ease;
        }
        .react-flow__edge:hover .react-flow__edge-path {
          stroke-width: 3px !important;
          stroke: #88a99b !important;
        }
        .react-flow__handle {
          width: 8px !important;
          height: 8px !important;
          background: #1a1f1d !important;
          border: 2px solid #88a99b !important;
          transition: all 0.2s ease !important;
        }
        .react-flow__handle:hover {
          transform: scale(1.3) !important;
          background: #88a99b !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background color="#161c19" gap={24} style={{ opacity: 0.4 }} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as unknown as GraphNode;
            if (!data || !data.status) return "#333";
            const cfg = STATUS_CONFIG[data.status as IssueStatus];
            return cfg?.dotColor ?? "#333";
          }}
        />
        <Panel position="top-right" className="m-4">
          <div
            className="backdrop-blur-md bg-[#161c19]/90 border border-[#88a99b]/15 rounded-lg p-3 shadow-xl max-w-xs transition-all duration-300"
            style={{
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.7)",
            }}
          >
            <h4 className="text-[11px] font-bold text-primary tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Petunjuk Dependency
            </h4>
            <ul className="space-y-1 text-[10px] text-text-muted font-medium list-none pl-0">
              <li className="flex items-start gap-1.5">
                <span className="text-primary/70 shrink-0">→</span>
                <span>
                  Tarik garis dari titik kanan node ke titik kiri node lain
                  untuk menambah ketergantungan.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400/80 shrink-0">×</span>
                <span>
                  Pilih garis koneksi lalu tekan{" "}
                  <kbd className="px-1 py-0.2 bg-white/10 rounded font-mono text-[9px] text-text">
                    Delete
                  </kbd>{" "}
                  untuk menghapus.
                </span>
              </li>
            </ul>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

