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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  schedulingApi,
  type GraphNode,
  type GraphEdge,
} from "@/lib/core/scheduling.api";

// ─── Konstanta warna per status ───────────────────────────────────────────────

const STATUS_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  backlog: { bg: "#1a1a1a", border: "#404040", text: "#888" },
  todo: { bg: "#1a2035", border: "#3b5bdb", text: "#748ffc" },
  in_progress: { bg: "#1a2a1a", border: "#2f9e44", text: "#69db7c" },
  in_review: { bg: "#2a1a2a", border: "#9c36b5", text: "#da77f2" },
  done: { bg: "#0a1a0a", border: "#1e6641", text: "#40c057" },
  cancelled: { bg: "#1a0a0a", border: "#c92a2a", text: "#ff6b6b" },
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: "#ff6b6b",
  high: "#ffa94d",
  medium: "#ffd43b",
  low: "#69db7c",
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
  return idx * 200;
}

// ─── Custom Node: Task Card ───────────────────────────────────────────────────

function TaskCardNode({
  data,
}: {
  data: GraphNode & { isCritical: boolean; isShifted: boolean };
}) {
  const colors = STATUS_COLORS[data.status] ?? STATUS_COLORS.backlog;
  const duration =
    data.start_date && data.due_date
      ? differenceInDays(new Date(data.due_date), new Date(data.start_date))
      : null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: data.isShifted ? [1, 1.05, 1] : 1,
        opacity: 1,
        boxShadow: data.isCritical
          ? ["0 0 0px #ff6b6b", "0 0 20px #ff6b6b66", "0 0 0px #ff6b6b"]
          : "none",
      }}
      transition={{
        duration: data.isShifted ? 0.6 : 0.3,
        boxShadow: { repeat: data.isCritical ? Infinity : 0, duration: 2 },
      }}
      style={{
        background: colors.bg,
        border: `1px solid ${data.isCritical ? "#ff6b6b" : colors.border}`,
        borderRadius: "8px",
        padding: "12px 14px",
        minWidth: "200px",
        maxWidth: "240px",
        cursor: "grab",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <span
          style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}
        >
          #{data.number}
        </span>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {data.isCritical && (
            <span
              style={{
                fontSize: "9px",
                background: "#ff6b6b22",
                color: "#ff6b6b",
                padding: "1px 5px",
                borderRadius: "3px",
              }}
            >
              CRITICAL
            </span>
          )}
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: PRIORITY_DOT[data.priority] ?? "#888",
            }}
          />
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#e8e8e8",
          marginBottom: "8px",
          lineHeight: 1.3,
        }}
      >
        {data.title}
      </div>

      {/* Dates */}
      {data.start_date && data.due_date ? (
        <div
          style={{ fontSize: "10px", color: colors.text, marginBottom: "6px" }}
        >
          {format(new Date(data.start_date), "d MMM", { locale: localeId })}
          {" → "}
          {format(new Date(data.due_date), "d MMM yyyy", { locale: localeId })}
          {duration !== null && (
            <span style={{ marginLeft: "4px", opacity: 0.7 }}>
              ({duration}h)
            </span>
          )}
        </div>
      ) : (
        <div
          style={{
            fontSize: "10px",
            color: "#444",
            marginBottom: "6px",
            fontStyle: "italic",
          }}
        >
          Belum ada jadwal
        </div>
      )}

      {/* Assignee */}
      {data.assignee && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#2d3748",
              border: `1px solid ${colors.border}`,
              fontSize: "8px",
              color: colors.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            {data.assignee.initials?.[0] ?? "?"}
          </div>
          <span style={{ fontSize: "10px", color: "#666" }}>
            {data.assignee.name}
          </span>
        </div>
      )}

      {/* Shifted indicator */}
      {data.isShifted && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: "6px",
            fontSize: "9px",
            color: "#ffd43b",
            background: "#ffd43b11",
            padding: "2px 6px",
            borderRadius: "3px",
          }}
        >
          ⚡ Jadwal digeser otomatis
        </motion.div>
      )}
    </motion.div>
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
          x: (levelMap.get(n.id) ?? 0) * 280,
          y: getYPosition(n.id, levelMap, rawNodes),
        },
        data: {
          ...n,
          isCritical: criticalIds.includes(n.id),
          isShifted: shiftedTaskIds.includes(n.id),
        },
      }));

      const flowEdges: Edge[] = rawEdges.map((e) => ({
        id: `${e.depends_on}-${e.issue_id}`,
        source: e.depends_on,
        target: e.issue_id,
        type: "smoothstep",
        animated:
          criticalIds.includes(e.issue_id) &&
          criticalIds.includes(e.depends_on),
        markerEnd: { type: MarkerType.ArrowClosed, color: "#555" },
        style: {
          stroke:
            criticalIds.includes(e.issue_id) &&
            criticalIds.includes(e.depends_on)
              ? "#ff6b6b"
              : "#333",
          strokeWidth: 1.5,
        },
        label: e.lag_days > 0 ? `+${e.lag_days}h` : undefined,
      }));

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
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: "#333", strokeWidth: 1.5 },
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
      <div className="flex items-center justify-center h-96 text-gray-500 text-sm">
        Memuat dependency graph...
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center gap-3 h-96 justify-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={loadGraph} className="text-xs underline text-gray-400">
          Coba lagi
        </button>
      </div>
    );

  return (
    <div
      className={`relative ${className}`}
      style={{
        height: "600px",
        background: "#0d0d0d",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
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
        <Background color="#1a1a1a" gap={20} />
        <Controls style={{ background: "#1a1a1a", border: "1px solid #333" }} />
        <MiniMap
          style={{ background: "#111", border: "1px solid #333" }}
          nodeColor={(n) => {
            const status = (n.data as Record<string, unknown>).status as string;
            return STATUS_COLORS[status]?.border ?? "#333";
          }}
        />
        <Panel position="top-right">
          <div
            style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "11px",
              color: "#666",
            }}
          >
            <div>Drag dari node → ke node untuk tambah dependency</div>
            <div>Klik edge → Delete untuk hapus dependency</div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
