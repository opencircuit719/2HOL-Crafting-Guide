"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Recipe } from "@/lib/types";
import { itemSlug } from "@/lib/slug";
import { buildRecipeGraph } from "@/lib/graph-builder";
import ItemNode from "./ItemNode";
import ActionNode from "./ActionNode";
import { GitBranch, Pickaxe, TreePine, Maximize2, Minimize2, Lock, Unlock } from "lucide-react";

const nodeTypes = {
  item: ItemNode,
  root: ItemNode,
  action: ActionNode,
};

interface WorkflowGraphProps {
  recipe: Recipe;
  rootId: string;
  nameMap: Record<string, string>;
}

export default function WorkflowGraph({
  recipe,
  rootId,
  nameMap,
}: WorkflowGraphProps) {
  const [hideTools, setHideTools] = useState(false);
  const [hideNatural, setHideNatural] = useState(false);
  const [mainBranchOnly, setMainBranchOnly] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [locked, setLocked] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const map = useMemo(() => new Map(Object.entries(nameMap)), [nameMap]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const graph = buildRecipeGraph(recipe, rootId, map, {
      hideTools,
      hideNatural,
      mainBranchOnly,
    });
    return {
      initialNodes: graph.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      initialEdges: graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        ...(e.animated ? { animated: true } : {}),
      })),
    };
  }, [recipe, rootId, map, hideTools, hideNatural, mainBranchOnly]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.data?.objectId && node.type !== "action") {
      const name = nameMap[node.data.objectId];
      window.location.href = `/${itemSlug(node.data.objectId, name || `ID ${node.data.objectId}`)}/workflow/`;
    }
  }, [nameMap]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg border border-gray-200 bg-zinc-950 relative dark:border-zinc-800 ${
        isFullscreen ? "h-screen fixed inset-0 z-[9999] rounded-none border-none" : "h-[65vh] sm:h-[70vh]"
      }`}
    >
      {/* Filter toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2 justify-center sm:justify-start pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap gap-2 bg-white/90 border border-gray-200 rounded-lg px-3 py-2 backdrop-blur-sm dark:bg-zinc-900/90 dark:border-zinc-700">
          <button
            onClick={() => setMainBranchOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
              mainBranchOnly
                ? "bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700"
            }`}
            title="Show only the main crafting branch"
          >
            <GitBranch className="w-3 h-3" />
            Main branch
          </button>
          <button
            onClick={() => setHideTools((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
              hideTools
                ? "bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-700"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700"
            }`}
            title="Hide tool items"
          >
            <Pickaxe className="w-3 h-3" />
            {hideTools ? "Tools hidden" : "Hide tools"}
          </button>
          <button
            onClick={() => setHideNatural((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
              hideNatural
                ? "bg-green-50 text-green-700 border border-green-300 dark:bg-green-900/60 dark:text-green-300 dark:border-green-700"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700"
            }`}
            title="Hide natural resource items"
          >
            <TreePine className="w-3 h-3" />
            {hideNatural ? "Natural hidden" : "Hide natural"}
          </button>
          <button
            onClick={() => setLocked((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
              locked
                ? "bg-red-50 text-red-700 border border-red-300 dark:bg-red-900/60 dark:text-red-300 dark:border-red-700"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700"
            }`}
            title={locked ? "Unlock graph to drag nodes" : "Lock graph"}
          >
            {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {locked ? "Locked" : "Unlocked"}
          </button>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={2}
        nodesDraggable={!locked}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#3f3f46" gap={20} size={1} />

        <MiniMap
          className="!bg-white !border-gray-200 hidden sm:block dark:!bg-zinc-900 dark:!border-zinc-700"
          nodeColor={(node) => {
            if (node.type === "root") return "#f59e0b";
            if (node.type === "action") return "#3b82f6";
            return "#22c55e";
          }}
          maskColor="rgba(9, 9, 11, 0.7)"
        />
        {/* Fullscreen toggle - top right */}
        <Panel
          position="top-right"
          className="hidden sm:block mt-3 mr-3"
        >
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 text-xs px-4 py-2.5 rounded transition-colors bg-white/90 text-gray-600 border border-gray-200 hover:bg-gray-100 backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
        </Panel>

        {/* Legend - bottom right, left of minimap */}
        <Panel
          position="bottom-right"
          style={{ transform: "translateX(-210px)" }}
          className="bg-white/80 border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-600 hidden sm:block mb-3 space-y-2 z-10 dark:bg-zinc-900/80 dark:border-zinc-700 dark:text-zinc-300"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              Crafted Item
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              Action
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              Final Item
            </div>
          </div>
          <p className="text-gray-400 italic dark:text-zinc-500">Click any item to re-root</p>
        </Panel>
      </ReactFlow>
    </div>
  );
}
