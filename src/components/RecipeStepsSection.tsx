"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Recipe, Transition } from "@/lib/types";
import ExpandableRecipeLayer from "@/components/ExpandableRecipeLayer";
import { recipeStations, getStationName } from "@/lib/tech-levels";

interface RecipeStepsSectionProps {
  recipe: Recipe;
  transitions: Transition[];
  nameMap: Map<string, string>;
  id: string;
}

export default function RecipeStepsSection({ recipe, transitions, nameMap, id }: RecipeStepsSectionProps) {
  const [availableStations, setAvailableStations] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("craft-it-stations");
      if (raw) return new Set(JSON.parse(raw));
    } catch { /* ignore */ }
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem("craft-it-stations", JSON.stringify(Array.from(availableStations)));
  }, [availableStations]);

  const toggleStation = useCallback((sid: string) => {
    setAvailableStations((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  }, []);

  const nameMapRecord = useMemo(() => {
    const record: Record<string, string> = {};
    nameMap.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }, [nameMap]);

  const requiredStations = useMemo(
    () => recipeStations(recipe, nameMapRecord),
    [recipe, nameMapRecord]
  );

  return (
    <div className="space-y-4">
      {requiredStations.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
            Stations:
          </span>
          {requiredStations.map((sid) => (
            <button
              key={sid}
              onClick={() => toggleStation(sid)}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 min-h-[44px] min-w-[44px] rounded-md text-xs font-medium border transition-colors ${
                availableStations.has(sid)
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${availableStations.has(sid) ? "bg-emerald-500" : "bg-gray-300 dark:bg-zinc-600"}`} />
              {getStationName(sid)}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-4">
        {recipe.steps.map((layer, layerIdx) => {
          const isLastLayer = layerIdx === recipe.steps.length - 1;
          const nextLayerMain = !isLastLayer
            ? (recipe.steps[layerIdx + 1].find((s) => s.mainBranch)?.id || recipe.steps[layerIdx + 1][0]?.id)
            : null;
          return (
            <ExpandableRecipeLayer
              key={layerIdx}
              layer={layer}
              nameMap={nameMap}
              layerIdx={layerIdx}
              transitions={transitions}
              resultId={isLastLayer ? id : nextLayerMain!}
              isLastLayer={isLastLayer}
              availableStations={availableStations}
            />
          );
        })}
      </div>
    </div>
  );
}
