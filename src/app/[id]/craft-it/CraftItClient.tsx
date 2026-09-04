"use client";

import { useState, useEffect, useCallback } from "react";
import { Recipe } from "@/lib/types";
import { getSpriteUrl } from "@/lib/sprite";
import { itemUrl } from "@/lib/slug";
import SpriteImage from "@/components/SpriteImage";
import {
  ArrowLeft,
  Hand,
  Clock,
  Wrench,
  Check,
  ArrowRight,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";

interface CraftItClientProps {
  id: string;
  name: string;
  recipe: Recipe;
  nameMap: Record<string, string>;
}

function getStepKey(phaseIndex: number, stepIndex: number) {
  return `${phaseIndex}-${stepIndex}`;
}

export default function CraftItClient({
  id,
  name,
  recipe,
  nameMap,
}: CraftItClientProps) {
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`craft-it-${id}`);
      if (saved) {
        setCheckedSteps(JSON.parse(saved));
      }
      const savedPhase = localStorage.getItem(`craft-it-phase-${id}`);
      if (savedPhase) {
        const phase = parseInt(savedPhase, 10);
        if (!isNaN(phase) && phase >= 0 && phase < recipe.steps.length) {
          setCurrentPhase(phase);
        }
      }
    } catch {
      // ignore parse errors
    }
    setIsHydrated(true);
  }, [id, recipe.steps.length]);

  // Save to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(`craft-it-${id}`, JSON.stringify(checkedSteps));
    }
  }, [checkedSteps, isHydrated, id]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(`craft-it-phase-${id}`, String(currentPhase));
    }
  }, [currentPhase, isHydrated, id]);

  const totalSteps = recipe.steps.reduce((sum, layer) => sum + layer.length, 0);
  const completedSteps = Object.values(checkedSteps).filter(Boolean).length;
  const overallPercent =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const currentLayer = recipe.steps[currentPhase] || [];
  const currentPhaseCompleted = currentLayer.every(
    (_, stepIdx) => checkedSteps[getStepKey(currentPhase, stepIdx)]
  );
  const allPhasesComplete = totalSteps > 0 && completedSteps === totalSteps;

  const toggleStep = useCallback((phaseIndex: number, stepIndex: number) => {
    const key = getStepKey(phaseIndex, stepIndex);
    setCheckedSteps((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const handleReset = useCallback(() => {
    if (typeof window !== "undefined" && window.confirm("Reset all progress?")) {
      setCheckedSteps({});
      setCurrentPhase(0);
    }
  }, []);

  const handleNextPhase = useCallback(() => {
    if (currentPhase < recipe.steps.length - 1) {
      setCurrentPhase((p) => p + 1);
    }
  }, [currentPhase, recipe.steps.length]);

  const handlePrevPhase = useCallback(() => {
    if (currentPhase > 0) {
      setCurrentPhase((p) => p - 1);
    }
  }, [currentPhase]);

  if (!isHydrated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse" />
        <div className="h-24 bg-zinc-800 rounded animate-pulse" />
        <div className="h-96 bg-zinc-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Back link */}
      <a
        href={itemUrl(id, name)}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to item
      </a>

      {/* Header */}
      <div className="flex items-start gap-4 sm:gap-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-amber-700/50 bg-zinc-900 flex items-center justify-center shrink-0">
          <SpriteImage
            src={getSpriteUrl(id)}
            alt={name}
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
            Craft: {name}
          </h1>
          <p className="text-sm text-zinc-400">
            {recipe.steps.length} phases • {totalSteps} total steps
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-300 font-medium">
            Phase {currentPhase + 1} of {recipe.steps.length}
          </span>
          <span className="text-amber-400 font-semibold">
            {overallPercent}% complete
          </span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>
            {completedSteps} of {totalSteps} steps done
          </span>
          {allPhasesComplete && (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <Check className="w-3 h-3" />
              All done!
            </span>
          )}
        </div>
      </div>

      {/* Completion Banner */}
      {allPhasesComplete && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 p-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-emerald-300">
            <Check className="w-5 h-5" />
            <h2 className="text-xl font-bold">Crafting Complete!</h2>
          </div>
          <p className="text-zinc-300 text-sm">
            You have completed all steps to craft{" "}
            <span className="font-semibold text-zinc-100">{name}</span>.
          </p>
        </div>
      )}

      {/* Phase Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">
          Phase {currentPhase + 1}
          {currentLayer.length > 1 && (
            <span className="text-sm font-normal text-zinc-500 ml-2">
              ({currentLayer.length} parallel steps)
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPhase}
            disabled={currentPhase === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-800/50 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <button
            onClick={handleNextPhase}
            disabled={
              !currentPhaseCompleted || currentPhase === recipe.steps.length - 1
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-800/50 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentLayer.map((step, stepIdx) => {
          const key = getStepKey(currentPhase, stepIdx);
          const isChecked = !!checkedSteps[key];
          const stepName = nameMap[step.id] || `ID ${step.id}`;
          return (
            <div
              key={key}
              onClick={() => toggleStep(currentPhase, stepIdx)}
              className={`flex items-center gap-4 rounded-lg border px-4 py-4 text-left transition-all cursor-pointer group ${
                isChecked
                  ? "border-emerald-800 bg-emerald-900/20 opacity-75"
                  : "border-zinc-700 bg-zinc-800/50 hover:border-amber-400/50 hover:bg-zinc-800"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
                  isChecked
                    ? "bg-emerald-600 border-emerald-500"
                    : "border-zinc-600 bg-zinc-900 group-hover:border-amber-500/50"
                }`}
              >
                {isChecked && <Check className="w-5 h-5 text-white" />}
              </div>

              {/* Sprite */}
              <div className="shrink-0 w-16 h-16 flex items-center justify-center">
                <SpriteImage
                  src={getSpriteUrl(step.id)}
                  alt={stepName}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-base font-medium truncate ${
                      isChecked
                        ? "text-emerald-300 line-through"
                        : "text-zinc-100 group-hover:text-amber-300"
                    }`}
                  >
                    {stepName}
                  </p>
                  <a
                    href={itemUrl(step.id, stepName)}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-zinc-500 hover:text-amber-400 transition-colors"
                    title="View item"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {step.hand && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                      <Hand className="w-3 h-3" />
                      Hand
                    </span>
                  )}
                  {step.decay && (
                    <span className="inline-flex items-center gap-1 text-xs text-purple-300">
                      <Clock className="w-3 h-3" />
                      {step.decay}
                    </span>
                  )}
                  {step.tool && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-300">
                      <Wrench className="w-3 h-3" />
                      Tool
                    </span>
                  )}
                  {step.count && step.count > 1 && (
                    <span className="text-xs text-zinc-500">×{step.count}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty phase fallback */}
      {currentLayer.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <p>No steps in this phase.</p>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Progress
        </button>

        {currentPhaseCompleted && currentPhase < recipe.steps.length - 1 && (
          <button
            onClick={handleNextPhase}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-zinc-950 hover:bg-amber-500 transition-colors text-sm font-semibold"
          >
            Next Phase
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
