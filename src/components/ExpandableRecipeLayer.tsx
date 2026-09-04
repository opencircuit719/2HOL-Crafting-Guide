"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { RecipeStep, Transition } from "@/lib/types";
import SpriteImage from "@/components/SpriteImage";
import { itemUrl } from "@/lib/slug";
import { stepStations, getStationName, STATION_UPGRADES } from "@/lib/tech-levels";
import { Hand, Clock, Wrench } from "lucide-react";

interface ExpandableRecipeLayerProps {
  layer: RecipeStep[];
  nameMap: Map<string, string>;
  layerIdx: number;
  transitions: Transition[];
  resultId: string;
  isLastLayer: boolean;
  availableStations?: Set<string>;
}

function getSpriteUrl(objectId: string, variant?: "last"): string {
  const suffix = variant === "last" ? "_last" : "";
  return `/sprites/obj_${objectId}${suffix}.png`;
}

function StepCard({ step, nameMap, toolId, stationName }: { step: RecipeStep; nameMap: Map<string, string>; toolId?: string; stationName?: string }) {
  const name = nameMap.get(step.id) || `ID ${step.id}`;
  const toolName = toolId ? (nameMap.get(toolId) || `ID ${toolId}`) : null;
  return (
    <a
      href={itemUrl(step.id, name)}
      className="flex items-center gap-3 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 px-3 py-2.5 hover:border-amber-400 dark:hover:border-amber-400/50 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
    >
      {toolId && toolName && (
        <>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="w-12 h-12 flex items-center justify-center">
              <SpriteImage
                src={getSpriteUrl(toolId)}
                alt={toolName}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[10px] text-gray-500 dark:text-zinc-400 text-center leading-tight max-w-[48px] truncate">
              {toolName}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 dark:text-zinc-500 shrink-0" />
        </>
      )}
      {!toolId && stationName && (
        <>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="w-12 h-12 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-gray-400 dark:text-zinc-500" />
            </div>
            <span className="text-[10px] text-gray-500 dark:text-zinc-400 text-center leading-tight max-w-[48px] truncate">
              {stationName}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 dark:text-zinc-500 shrink-0" />
        </>
      )}
      <div className="w-16 h-16 flex items-center justify-center shrink-0">
        <SpriteImage
          src={getSpriteUrl(step.id)}
          alt={name}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
          {name}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
          {step.hand && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-300">
              <Hand className="w-3 h-3" />
              Hand
            </span>
          )}
          {step.decay && (
            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-300">
              <Clock className="w-3 h-3" />
              {step.decay}
            </span>
          )}
          {step.tool && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
              <Wrench className="w-3 h-3" />
              Tool
            </span>
          )}
          {step.count && step.count > 1 && (
            <span className="text-gray-400 dark:text-zinc-500">×{step.count}</span>
          )}
        </div>
      </div>
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
  const sizeClasses = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-12 h-12" };

  const ObjectLink = ({ id }: { id: string }) => {
    if (id === "0" || id === "-1") {
      return (
        <span className="text-gray-400 dark:text-zinc-500 italic">
          {id === "0" ? "Player" : "Ground"}
        </span>
      );
    }
    const name = nameMap.get(id) || `ID ${id}`;
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
  };

  return (
    <div className={`flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-3 py-2 flex-wrap ${textSizes[size]}`}>
      {transition.actorID && (
        <ObjectLink id={transition.actorID} />
      )}
      {transition.hand && (
        <Hand className={`${iconSizes[size]} text-amber-500 shrink-0 dark:text-amber-400`} />
      )}
      <span className="text-gray-400 dark:text-zinc-500">+</span>
      {transition.targetID && (
        <ObjectLink id={transition.targetID} />
      )}
      <span className="text-gray-400 dark:text-zinc-500">→</span>
      {transition.newActorID && transition.newActorID !== "0" && (
        <ObjectLink id={transition.newActorID} />
      )}
      {transition.newTargetID && (
        <ObjectLink id={transition.newTargetID} />
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

export default function ExpandableRecipeLayer({
  layer,
  nameMap,
  layerIdx,
  transitions,
  resultId,
  isLastLayer,
  availableStations = new Set(),
}: ExpandableRecipeLayerProps) {
  const [expanded, setExpanded] = useState(false);

  // Last layer: just show the result item as a card
  if (isLastLayer) {
    const mainStep = layer.find((s) => s.mainBranch) || layer[0];
    return (
      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
            Step {layerIdx + 1}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <StepCard step={mainStep} nameMap={nameMap} />
        </div>
      </div>
    );
  }

  // Ingredient layer
  const mainStep = layer.find((s) => s.mainBranch) || layer[0];
  const targetStep = layer.find((s) => s.id !== mainStep.id) || mainStep;

  // Find all transitions that produce the result using the same target
  const matchingTransitions = useMemo(() => {
    if (!targetStep) return [];
    return transitions.filter((t) =>
      t.targetID === targetStep.id &&
      (t.newTargetID === resultId || t.newActorID === resultId)
    );
  }, [transitions, targetStep, resultId]);

  const nameMapRecord = useMemo(() => {
    const record: Record<string, string> = {};
    nameMap.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }, [nameMap]);

  // Compute tool IDs and station names for each step, applying station upgrades
  const stepDisplayInfo = useMemo(() => {
    const tools = new Map<string, string>();
    const stations = new Map<string, string>();

    if (isLastLayer) return { tools, stations };

    for (const step of layer) {
      const transition = transitions.find((t) =>
        t.targetID === step.id &&
        (t.newTargetID === resultId || t.newActorID === resultId)
      );

      // Check explicit tool transition first
      if (transition?.actorID && transition.actorID !== "0" && transition.actorID !== "-1" && transition.tool) {
        const actorStations = stepStations({ id: transition.actorID }, nameMapRecord);
        if (actorStations.length > 0) {
          // Actor is a station - apply upgrade logic
          let selected = actorStations[0];
          for (const sid of actorStations) {
            const upgrades = STATION_UPGRADES[sid];
            if (upgrades) {
              for (const up of upgrades) {
                if (availableStations.has(up)) {
                  selected = up;
                }
              }
            }
          }
          stations.set(step.id, getStationName(selected));
          continue;
        } else {
          // Actor is not a station - show as tool sprite
          tools.set(step.id, transition.actorID);
          continue;
        }
      }

      // No tool transition - check object names for stations
      const stepStationIds = stepStations(step, nameMapRecord);
      if (stepStationIds.length > 0) {
        let selected = stepStationIds[0];
        for (const sid of stepStationIds) {
          const upgrades = STATION_UPGRADES[sid];
          if (upgrades) {
            for (const up of upgrades) {
              if (availableStations.has(up)) {
                selected = up;
              }
            }
          }
        }
        stations.set(step.id, getStationName(selected));
      }
    }

    return { tools, stations };
  }, [layer, transitions, resultId, isLastLayer, nameMapRecord, availableStations]);

  // If we found multiple transitions with the same target → same result,
  // show them as expandable transition rows
  if (matchingTransitions.length > 1) {
    const initialShow = 4;
    const visibleTransitions = expanded ? matchingTransitions : matchingTransitions.slice(0, initialShow);
    const hasMore = matchingTransitions.length > initialShow;

    return (
      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
            Step {layerIdx + 1}
          </span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            {matchingTransitions.length} options
          </span>
        </div>

        <div className="space-y-2">
          {visibleTransitions.map((t, i) => (
            <TransitionRow key={i} transition={t} nameMap={nameMap} size="lg" />
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {matchingTransitions.length - initialShow} more options
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  // Default: show step cards
  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          Step {layerIdx + 1}
        </span>
        {layer.length > 1 && (
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            {layer.length} parallel
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {layer.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            nameMap={nameMap}
            toolId={stepDisplayInfo.tools.get(step.id)}
            stationName={stepDisplayInfo.stations.get(step.id)}
          />
        ))}
      </div>
    </div>
  );
}
