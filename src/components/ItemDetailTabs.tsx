"use client";

import { useState } from "react";
import { Recipe, Transition } from "@/lib/types";
import RecipeStepsSection from "@/components/RecipeStepsSection";
import SpriteImage from "@/components/SpriteImage";
import { itemUrl } from "@/lib/slug";
import { Hand, Clock, Wrench } from "lucide-react";

interface ItemDetailTabsProps {
  recipe: Recipe;
  transitions: Transition[];
  transitionsAway: Transition[];
  nameMap: Map<string, string>;
  id: string;
  prevId: string | null;
  nextId: string | null;
}

function getSpriteUrl(objectId: string): string {
  return `/sprites/obj_${objectId}.png`;
}

function ObjectLink({ id, nameMap, size = "md" }: { id: string; nameMap: Map<string, string>; size?: "sm" | "md" | "lg" }) {
  if (id === "0" || id === "-1") {
    return (
      <span className="text-gray-400 dark:text-zinc-500 italic">
        {id === "0" ? "Player" : "Ground"}
      </span>
    );
  }
  const name = nameMap.get(id) || `ID ${id}`;
  const sizeClasses = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-12 h-12" };
  return (
    <a
      href={itemUrl(id, name)}
      className="flex items-center gap-1 text-gray-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors min-w-0"
      title={name}
    >
      <SpriteImage
        src={getSpriteUrl(id)}
        alt={name}
        className={`${sizeClasses[size]} object-contain shrink-0`}
      />
      <span className="font-medium truncate">{name}</span>
    </a>
  );
}

function TransitionRow({
  transition,
  nameMap,
  size = "md",
}: {
  transition: Transition;
  nameMap: Map<string, string>;
  size?: "sm" | "md" | "lg";
}) {
  const iconSizes = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" };
  const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  return (
    <div className={`flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-3 py-2 flex-wrap ${textSizes[size]}`}>
      {transition.actorID && (
        <ObjectLink id={transition.actorID} nameMap={nameMap} size={size} />
      )}
      {transition.hand && (
        <Hand className={`${iconSizes[size]} text-amber-500 shrink-0 dark:text-amber-400`} />
      )}
      <span className="text-gray-400 dark:text-zinc-500">+</span>
      {transition.targetID && (
        <ObjectLink id={transition.targetID} nameMap={nameMap} size={size} />
      )}
      <span className="text-gray-400 dark:text-zinc-500">→</span>
      {transition.newActorID && transition.newActorID !== "0" && (
        <ObjectLink id={transition.newActorID} nameMap={nameMap} size={size} />
      )}
      {transition.newTargetID && (
        <ObjectLink id={transition.newTargetID} nameMap={nameMap} size={size} />
      )}
      {transition.decay && (
        <span className={`flex items-center gap-1 text-purple-600 dark:text-purple-300 ${textSizes[size]}`}>
          <Clock className={iconSizes[size]} />
          {transition.decay}
        </span>
      )}
    </div>
  );
}

export default function ItemDetailTabs({
  recipe,
  transitions,
  transitionsAway,
  nameMap,
  id,
  prevId,
  nextId,
}: ItemDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<"make" | "use">("make");

  // Group transitions away by the resulting item
  const groupedUses = new Map<string, Transition[]>();
  for (const t of transitionsAway) {
    const resultId = t.newTargetID || t.newActorID;
    if (!resultId) continue;
    const existing = groupedUses.get(resultId) || [];
    existing.push(t);
    groupedUses.set(resultId, existing);
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("make")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "make"
                ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            How to Make
          </button>
          <button
            onClick={() => setActiveTab("use")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "use"
                ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            How to Use
          </button>
        </div>

        <div className="flex items-center gap-2">
          {prevId && (
            <a
              href={itemUrl(prevId, nameMap.get(prevId) || prevId)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-xs text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              title={nameMap.get(prevId) || prevId}
            >
              <Wrench className="w-3 h-3" />
              <span className="hidden sm:inline">{nameMap.get(prevId) || prevId}</span>
            </a>
          )}
          {nextId && (
            <a
              href={itemUrl(nextId, nameMap.get(nextId) || nextId)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-xs text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              title={nameMap.get(nextId) || nextId}
            >
              <span className="hidden sm:inline">{nameMap.get(nextId) || nextId}</span>
              <Wrench className="w-3 h-3" />
            </a>
          )}
          <span className="text-sm text-gray-400 dark:text-zinc-500 ml-2">
            {recipe.steps.length} layer
            {recipe.steps.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "make" ? (
        <RecipeStepsSection
          recipe={recipe}
          transitions={transitions}
          nameMap={nameMap}
          id={id}
        />
      ) : (
        <div className="space-y-4">
          {groupedUses.size === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-zinc-500">
              No known uses for this item.
            </div>
          ) : (
            Array.from(groupedUses.entries()).map(([resultId, group]) => (
              <div key={resultId} className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <ObjectLink id={resultId} nameMap={nameMap} size="sm" />
                  <span className="text-xs text-gray-400 dark:text-zinc-500">({group.length} way{group.length > 1 ? "s" : ""})</span>
                </div>
                <div className="space-y-2">
                  {group.map((t, i) => (
                    <TransitionRow key={i} transition={t} nameMap={nameMap} size="md" />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
