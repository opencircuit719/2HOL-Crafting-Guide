"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Hand, Wrench, Clock, Combine } from "lucide-react";

interface ActionNodeData {
  actionType: "hand" | "tool" | "decay" | "combine";
  decayTime?: string;
  depth: number;
  actorName?: string;
  targetName?: string;
}

const actionConfig = {
  hand: { icon: Hand, color: "text-amber-400", bg: "bg-amber-950/60", border: "border-amber-800" },
  tool: { icon: Wrench, color: "text-blue-400", bg: "bg-blue-950/60", border: "border-blue-800" },
  decay: { icon: Clock, color: "text-purple-400", bg: "bg-purple-950/60", border: "border-purple-800" },
  combine: { icon: Combine, color: "text-zinc-400", bg: "bg-zinc-800/60", border: "border-zinc-700" },
};

function ActionNode({ data }: { data: ActionNodeData }) {
  const config = actionConfig[data.actionType];
  const Icon = config.icon;

  const label = data.actionType === "decay" && data.decayTime
    ? data.decayTime
    : data.actionType;

  return (
    <div
      className={`rounded-md border px-2 py-1.5 flex flex-col items-center gap-0.5 min-w-[90px] max-w-[140px] ${config.bg} ${config.border}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-1.5 !h-1.5 !bg-zinc-500 !border-zinc-700"
      />
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className={`text-[10px] font-medium ${config.color}`}>
          {label}
        </span>
      </div>
      {(data.actorName || data.targetName) && (
        <div className="text-[9px] text-zinc-500 text-center leading-tight line-clamp-2">
          {data.actorName && data.targetName
            ? `${data.actorName} + ${data.targetName}`
            : data.targetName
            ? data.targetName
            : data.actorName}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-1.5 !h-1.5 !bg-zinc-500 !border-zinc-700"
      />
    </div>
  );
}

export default memo(ActionNode);
