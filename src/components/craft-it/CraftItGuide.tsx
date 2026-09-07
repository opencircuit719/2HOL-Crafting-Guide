"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Recipe, RecipeStep } from "@/lib/types";
import { getSpriteUrl } from "@/lib/sprites";
import { itemUrl } from "@/lib/slug";
import SpriteImage from "@/components/SpriteImage";
import { recipeStations, stepStations, getStationName, getUpgradeHints, type UpgradeHint } from "@/lib/tech-levels";
import {
  Check,
  Circle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Hand,
  Clock,
  Wrench,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CraftItGuideProps {
  recipe: Recipe;
  rootId: string;
  rootName: string;
  rootSpriteUrl: string;
  nameMap: Record<string, string>;
}

function countAllSteps(steps: RecipeStep[][]): number {
  let count = 0;
  for (const layer of steps) {
    for (const step of layer) {
      count++;
      if (step.subSteps) {
        count += countAllSteps(step.subSteps);
      }
    }
  }
  return count;
}

function collectSubStepKeys(step: RecipeStep, prefix: string): string[] {
  const keys: string[] = [];
  if (step.subSteps) {
    step.subSteps.forEach((subLayer, sli) => {
      subLayer.forEach((ss) => {
        const key = `${prefix}-sub-${sli}-${ss.id}`;
        keys.push(key);
        keys.push(...collectSubStepKeys(ss, key));
      });
    });
  }
  return keys;
}

export default function CraftItGuide({
  recipe,
  rootId,
  rootName,
  rootSpriteUrl,
  nameMap,
}: CraftItGuideProps) {
  const storageKey = `craft-it-${rootId}`;

  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [currentPhase, setCurrentPhase] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const requiredStations = useMemo(
    () => recipeStations(recipe, nameMap),
    [recipe, nameMap]
  );

  const [availableStations, setAvailableStations] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("craft-it-stations");
      if (raw) return new Set(JSON.parse(raw));
    } catch { /* ignore */ }
    return new Set();
  });

  const toggleStation = useCallback((sid: string) => {
    setAvailableStations((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("craft-it-stations", JSON.stringify(Array.from(availableStations)));
  }, [availableStations]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.checkedSteps) {
          setCheckedSteps(new Set(parsed.checkedSteps));
        }
        if (parsed.expandedSubs) {
          setExpandedSubs(new Set(parsed.expandedSubs));
        }
        if (typeof parsed.currentPhase === "number") {
          setCurrentPhase(parsed.currentPhase);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        checkedSteps: Array.from(checkedSteps),
        expandedSubs: Array.from(expandedSubs),
        currentPhase,
      })
    );
  }, [checkedSteps, expandedSubs, currentPhase, loaded, storageKey]);

  const totalSteps = useMemo(() => countAllSteps(recipe.steps), [recipe.steps]);

  const progressPercent = useMemo(() => {
    if (totalSteps === 0) return 0;
    return Math.round((checkedSteps.size / totalSteps) * 100);
  }, [checkedSteps, totalSteps]);

  const isComplete = checkedSteps.size === totalSteps && totalSteps > 0;

  const toggleStep = useCallback((stepKey: string, step?: RecipeStep) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      const isChecking = !next.has(stepKey);
      if (isChecking) {
        next.add(stepKey);
      } else {
        next.delete(stepKey);
      }
      if (step) {
        const subKeys = collectSubStepKeys(step, stepKey);
        subKeys.forEach((k) => {
          if (isChecking) next.add(k);
          else next.delete(k);
        });
      }
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((stepKey: string) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(stepKey)) {
        next.delete(stepKey);
      } else {
        next.add(stepKey);
      }
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setCheckedSteps(new Set());
    setExpandedSubs(new Set());
    setCurrentPhase(0);
  }, []);

  const goToNextPhase = useCallback(() => {
    if (currentPhase < recipe.steps.length - 1) {
      setCurrentPhase((p) => p + 1);
    }
  }, [currentPhase, recipe.steps.length]);

  const goToPrevPhase = useCallback(() => {
    if (currentPhase > 0) {
      setCurrentPhase((p) => p - 1);
    }
  }, [currentPhase]);

  const currentLayer = recipe.steps[currentPhase] || [];
  const allCurrentChecked = currentLayer.every((step) => {
    const key = `${currentPhase}-${step.id}`;
    if (!checkedSteps.has(key)) return false;
    if (step.subSteps) {
      return step.subSteps.every((subLayer, sli) =>
        subLayer.every((ss) => checkedSteps.has(`${key}-sub-${sli}-${ss.id}`))
      );
    }
    return true;
  });

  // Phase progression is manual only - no auto-advance

  const renderStep = (
    step: RecipeStep,
    stepKey: string,
    nested: boolean,
    subLayerLabel?: string
  ) => {
    const isChecked = checkedSteps.has(stepKey);
    const name = nameMap[step.id] || `ID ${step.id}`;
    const stations = stepStations(step, nameMap);
    const missingStations = stations.filter((s) => !availableStations.has(s));
    const isUnavailable = missingStations.length > 0 && !isChecked;
    const hasSubs = !!step.subSteps && step.subSteps.length > 0;
    const isExpanded = expandedSubs.has(stepKey);
    const upgradeHints = getUpgradeHints(stations, availableStations, requiredStations);

    return (
      <div key={stepKey} className={nested ? "ml-6 border-l-2 border-gray-200 dark:border-zinc-700 pl-3" : ""}>
        <button
          onClick={() => toggleStep(stepKey, step)}
          className={`w-full flex items-center gap-4 rounded-lg border px-4 py-3 text-left transition-all ${
            isChecked
              ? "border-emerald-800/60 bg-emerald-900/20 opacity-70 dark:border-emerald-800/60 dark:bg-emerald-900/20"
              : isUnavailable
              ? "border-gray-200 bg-white opacity-50 hover:opacity-75 dark:border-zinc-700 dark:bg-zinc-900/50"
              : "border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50/30 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-amber-400/50 dark:hover:bg-zinc-800/50"
          }`}
        >
          {/* Checkbox */}
          <div
            className={`shrink-0 w-9 h-9 rounded-md border-2 flex items-center justify-center transition-colors ${
              isChecked
                ? "bg-emerald-600 border-emerald-600"
                : "border-gray-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
            }`}
          >
            {isChecked && <Check className="w-5 h-5 text-white" />}
          </div>

          {/* Sprite */}
          <div className="w-20 h-20 flex items-center justify-center shrink-0">
            <SpriteImage
              src={getSpriteUrl(step.id)}
              alt={name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={`text-base font-medium truncate ${
                  isChecked ? "text-gray-400 line-through dark:text-zinc-600" : "text-gray-900 dark:text-zinc-100"
                }`}
              >
                {name}
              </p>
              {subLayerLabel && (
                <span className="text-xs text-gray-400 dark:text-zinc-500">({subLayerLabel})</span>
              )}
            </div>
            {(step.actorID || step.targetID) && (
              <p className="text-sm text-gray-500 mt-0.5 truncate dark:text-zinc-400">
                {step.actorID && step.targetID ? (
                  <span className="inline-flex items-center gap-2 flex-wrap">
                    <span>Use</span>
                    <a
                      href={itemUrl(step.actorID, nameMap[step.actorID] || `ID ${step.actorID}`)}
                      className="inline-flex items-center gap-1.5 align-middle text-amber-600 hover:underline dark:text-amber-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={getSpriteUrl(step.actorID)}
                        alt=""
                        className="w-10 h-10 object-contain"
                        loading="lazy"
                      />
                      <span className="leading-none">{nameMap[step.actorID] || `ID ${step.actorID}`}</span>
                    </a>
                    <span>on</span>
                    <a
                      href={itemUrl(step.targetID, nameMap[step.targetID] || `ID ${step.targetID}`)}
                      className="inline-flex items-center gap-1.5 align-middle text-amber-600 hover:underline dark:text-amber-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={getSpriteUrl(step.targetID)}
                        alt=""
                        className="w-10 h-10 object-contain"
                        loading="lazy"
                      />
                      <span className="leading-none">{nameMap[step.targetID] || `ID ${step.targetID}`}</span>
                    </a>
                  </span>
                ) : step.actorID ? (
                  <span className="inline-flex items-center gap-2 flex-wrap">
                    <span>Use</span>
                    <a
                      href={itemUrl(step.actorID, nameMap[step.actorID] || `ID ${step.actorID}`)}
                      className="inline-flex items-center gap-1.5 align-middle text-amber-600 hover:underline dark:text-amber-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={getSpriteUrl(step.actorID)}
                        alt=""
                        className="w-10 h-10 object-contain"
                        loading="lazy"
                      />
                      <span className="leading-none">{nameMap[step.actorID] || `ID ${step.actorID}`}</span>
                    </a>
                  </span>
                ) : step.targetID ? (
                  <span className="inline-flex items-center gap-2 flex-wrap">
                    <span>Use on</span>
                    <a
                      href={itemUrl(step.targetID, nameMap[step.targetID] || `ID ${step.targetID}`)}
                      className="inline-flex items-center gap-1.5 align-middle text-amber-600 hover:underline dark:text-amber-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={getSpriteUrl(step.targetID)}
                        alt=""
                        className="w-10 h-10 object-contain"
                        loading="lazy"
                      />
                      <span className="leading-none">{nameMap[step.targetID] || `ID ${step.targetID}`}</span>
                    </a>
                  </span>
                ) : null}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm mt-1 flex-wrap">
              {stations.length > 0 && (
                <>
                  {stations.map((sid) => {
                    const hasIt = availableStations.has(sid);
                    return (
                      <span
                        key={sid}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${
                          hasIt
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50"
                            : "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50"
                        }`}
                      >
                        {!hasIt && <Circle className="w-2.5 h-2.5" />}
                        {hasIt && <Check className="w-2.5 h-2.5" />}
                        {getStationName(sid)}
                      </span>
                    );
                  })}
                </>
              )}
              {upgradeHints.map((hint) => (
                <button
                  key={hint.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStation(hint.id);
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 dark:hover:bg-amber-900/50 cursor-pointer"
                >
                  <Wrench className="w-2.5 h-2.5" />
                  {hint.name} method available
                </button>
              ))}
              {step.hand && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-300">
                  <Hand className="w-4 h-4" />
                  Hand
                </span>
              )}
              {step.decay && (
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-300">
                  <Clock className="w-4 h-4" />
                  {step.decay}
                </span>
              )}
              {step.tool && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
                  <Wrench className="w-4 h-4" />
                  Tool
                </span>
              )}
              {step.count && step.count > 1 && (
                <span className="text-gray-400 dark:text-zinc-500">×{step.count}</span>
              )}
              {step.mainBranch && (
                <span className="text-amber-600 text-xs uppercase tracking-wider font-semibold dark:text-amber-400">
                  Main
                </span>
              )}
              {!hasSubs && (
                <a
                  href={`${itemUrl(step.id, name)}craft-it/`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-blue-600 hover:text-blue-700 underline underline-offset-2 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Craft guide →
                </a>
              )}
              {hasSubs && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(stepKey);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {isExpanded ? "Hide steps" : "Show steps"}
                </button>
              )}
            </div>
          </div>

          {/* Check indicator on right */}
          <div className="shrink-0">
            {isChecked ? (
              <Check className="w-7 h-7 text-emerald-500" />
            ) : (
              <Circle className="w-7 h-7 text-gray-300 dark:text-zinc-600" />
            )}
          </div>
        </button>

        {/* Sub-steps */}
        {hasSubs && isExpanded && (
          <div className="mt-2 space-y-2">
            {step.subSteps!.map((subLayer, sli) => (
              <div key={`${stepKey}-sub-${sli}`}>
                {subLayer.map((ss, ssi) =>
                  renderStep(ss, `${stepKey}-sub-${sli}-${ss.id}`, true, `step ${sli + 1}.${ssi + 1}`)
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0">
          <SpriteImage
            src={rootSpriteUrl}
            alt={rootName}
            className="w-16 h-16 object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{rootName}</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Step-by-step crafting guide
          </p>
        </div>
      </div>

      {/* "You should have" card */}
      {(() => {
        const lastCompletedPhase = recipe.steps
          .map((layer, idx) => ({ layer, idx }))
          .filter(({ layer, idx }) =>
            layer.every((step) => {
              const key = `${idx}-${step.id}`;
              if (!checkedSteps.has(key)) return false;
              if (step.subSteps) {
                return step.subSteps.every((subLayer, sli) =>
                  subLayer.every((ss) => checkedSteps.has(`${key}-sub-${sli}-${ss.id}`))
                );
              }
              return true;
            })
          )
          .pop();

        if (isComplete) {
          return (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-5 dark:border-emerald-800 dark:bg-emerald-900/20">
              <div className="w-24 h-24 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0">
                <SpriteImage src={rootSpriteUrl} alt={rootName} className="w-20 h-20 object-contain" />
              </div>
              <div>
                <p className="text-sm text-emerald-700 font-medium dark:text-emerald-400">All done!</p>
                <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">You crafted {rootName}</p>
              </div>
            </div>
          );
        }

        if (lastCompletedPhase) {
          const mainStep = lastCompletedPhase.layer.find((s) => s.mainBranch) || lastCompletedPhase.layer[0];
          const itemName = nameMap[mainStep.id] || `ID ${mainStep.id}`;
          return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-center gap-5 dark:border-amber-800/50 dark:bg-zinc-900/80">
              <div className="w-24 h-24 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 flex items-center justify-center shrink-0">
                <SpriteImage src={getSpriteUrl(mainStep.id)} alt={itemName} className="w-20 h-20 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-700 font-medium dark:text-amber-400">You should have this now</p>
                <p className="text-xl font-bold text-gray-900 truncate dark:text-zinc-100">{itemName}</p>
                <div className="flex items-center gap-3 text-xs mt-1.5">
                  {mainStep.count && mainStep.count > 1 && (
                    <span className="text-gray-500 dark:text-zinc-400">×{mainStep.count}</span>
                  )}
                  {mainStep.hand && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-300">
                      <Hand className="w-3 h-3" /> Hand use
                    </span>
                  )}
                  {mainStep.decay && (
                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-300">
                      <Clock className="w-3 h-3" /> {mainStep.decay}
                    </span>
                  )}
                  {mainStep.tool && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
                      <Wrench className="w-3 h-3" /> Tool
                    </span>
                  )}
                  <a href={itemUrl(mainStep.id, itemName)} className="text-gray-500 hover:text-amber-600 transition-colors underline underline-offset-2 dark:text-zinc-500 dark:hover:text-amber-400">
                    View item
                  </a>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center gap-5 dark:border-zinc-700 dark:bg-zinc-900/50">
            <div className="w-24 h-24 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 flex items-center justify-center shrink-0">
              <SpriteImage src={rootSpriteUrl} alt={rootName} className="w-20 h-20 object-contain opacity-40" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium dark:text-zinc-500">Let&apos;s get started</p>
              <p className="text-xl font-bold text-gray-600 dark:text-zinc-300">Gather the first items</p>
            </div>
          </div>
        );
      })()}

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-zinc-400">
            Phase {currentPhase + 1} of {recipe.steps.length}
          </span>
          <span className="text-gray-500 dark:text-zinc-400">
            {checkedSteps.size} / {totalSteps} steps
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-zinc-800">
          <div
            className="h-full bg-amber-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {isComplete && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium dark:text-emerald-400">
            <Trophy className="w-4 h-4" />
            All steps complete! You crafted it!
          </div>
        )}
      </div>

      {/* Station toggles */}
      {requiredStations.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-3 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-zinc-400">
            Stations Available
          </p>
          <div className="flex flex-wrap gap-2">
            {requiredStations.map((sid) => {
              const isOn = availableStations.has(sid);
              return (
                <button
                  key={sid}
                  onClick={() => toggleStation(sid)}
                  className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 min-h-[44px] min-w-[44px] rounded-full text-xs font-medium border transition-colors ${
                    isOn
                      ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                  title={isOn ? "Click to mark unavailable" : "Click to mark available"}
                >
                  {isOn ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                  {getStationName(sid)}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">
            Toggle the stations you have access to. Steps requiring unavailable stations will be dimmed.
          </p>
        </div>
      )}

      {/* Phase nav dots */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {recipe.steps.map((_, idx) => {
          const isDone = recipe.steps[idx].every((step) => {
            const key = `${idx}-${step.id}`;
            if (!checkedSteps.has(key)) return false;
            if (step.subSteps) {
              return step.subSteps.every((subLayer, sli) =>
                subLayer.every((ss) => checkedSteps.has(`${key}-sub-${sli}-${ss.id}`))
              );
            }
            return true;
          });
          const isCurrent = idx === currentPhase;
          return (
            <button
              key={idx}
              onClick={() => setCurrentPhase(idx)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                isCurrent
                  ? "bg-amber-600 text-white"
                  : isDone
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-white text-gray-400 border border-gray-200 hover:bg-gray-100 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700 dark:hover:bg-zinc-700"
              }`}
              title={`Phase ${idx + 1}`}
            >
              {isDone ? <Check className="w-4 h-4 mx-auto" /> : idx + 1}
            </button>
          );
        })}
      </div>

      {/* Step list */}
      <div className="space-y-3">
        {currentLayer.map((step) => renderStep(step, `${currentPhase}-${step.id}`, false))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={goToPrevPhase}
          disabled={currentPhase === 0}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentPhase === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-zinc-900 dark:text-zinc-600"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:border-zinc-700"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Phase
        </button>

        {allCurrentChecked && currentPhase < recipe.steps.length - 1 && (
          <button
            onClick={goToNextPhase}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors dark:bg-amber-600 dark:text-zinc-950 dark:hover:bg-amber-500"
          >
            Next Phase
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {currentPhase === recipe.steps.length - 1 && !allCurrentChecked && (
          <span className="text-sm text-gray-400 dark:text-zinc-500">
            Check all steps to finish
          </span>
        )}
      </div>

      {/* Reset */}
      <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
        <button
          onClick={resetProgress}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors dark:text-zinc-500 dark:hover:text-red-400"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Progress
        </button>
      </div>
    </div>
  );
}
