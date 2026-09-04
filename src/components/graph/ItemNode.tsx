"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import { getSpriteUrl } from "@/lib/sprite";

interface ItemNodeData {
  objectId: string;
  objectName: string;
  depth: number;
}

function ItemNode({ data }: { data: ItemNodeData }) {
  const isRoot = data.depth === 0;

  return (
    <div
      className={`rounded-lg border px-3 py-2 flex flex-col items-center gap-1 min-w-[120px] max-w-[160px] transition-shadow hover:shadow-lg ${
        isRoot
          ? "bg-amber-950/80 border-amber-400/60 shadow-amber-900/30"
          : "bg-zinc-900/90 border-zinc-700 hover:border-zinc-500"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-zinc-500 !border-zinc-700"
      />
      <img
        src={getSpriteUrl(data.objectId)}
        alt={data.objectName}
        className="w-10 h-10 object-contain"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <span
        className={`text-[10px] text-center leading-tight line-clamp-2 font-medium ${
          isRoot ? "text-amber-300" : "text-zinc-300"
        }`}
      >
        {data.objectName}
      </span>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-zinc-500 !border-zinc-700"
      />
    </div>
  );
}

export default memo(ItemNode);
