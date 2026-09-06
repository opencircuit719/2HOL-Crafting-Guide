export interface StationDef {
  id: string;
  name: string;
  keywords: string[];
}

export const STATIONS: StationDef[] = [
  { id: "adobe-kiln", name: "Adobe Kiln", keywords: ["adobe kiln"] },
  { id: "adobe-oven", name: "Adobe Oven", keywords: ["adobe oven"] },
  { id: "adobe-forge", name: "Adobe Forge", keywords: ["adobe forge", "forged"] },
  { id: "stone-kiln", name: "Stone Kiln", keywords: ["stone kiln"] },
  { id: "stone-furnace", name: "Stone Furnace", keywords: ["stone furnace"] },
  { id: "brick-oven", name: "Brick Oven", keywords: ["brick oven"] },
  { id: "blast-furnace", name: "Blast Furnace", keywords: ["blast furnace"] },
  { id: "anvil", name: "Anvil", keywords: [" on anvil", "anvil "] },
  { id: "treadle-machine", name: "Treadle Machine", keywords: ["treadle machine", "treadle"] },
  { id: "electric-arc-furnace", name: "Electric Arc Furnace", keywords: ["electric arc furnace", "arc furnace"] },
  { id: "continuous-casting-machine", name: "Continuous Casting Machine", keywords: ["continuous casting machine", "casting machine"] },
  { id: "forging-press", name: "Forging Press", keywords: ["forging press", "press"] },
];

function matchStations(name: string | undefined): string[] {
  if (!name) return [];
  const lower = name.toLowerCase();
  const matched: string[] = [];
  for (const station of STATIONS) {
    for (const kw of station.keywords) {
      if (lower.includes(kw)) {
        matched.push(station.id);
        break;
      }
    }
  }
  return matched;
}

export function stepStations(
  step: {
    id?: string;
    actorID?: string;
    targetID?: string;
    subSteps?: { id?: string; actorID?: string; targetID?: string }[][];
  },
  nameMap: Record<string, string>
): string[] {
  const ids = [step.id, step.actorID, step.targetID].filter(Boolean) as string[];
  const matched = new Set<string>();
  for (const id of ids) {
    for (const sid of matchStations(nameMap[id])) {
      matched.add(sid);
    }
  }
  if (step.subSteps) {
    for (const layer of step.subSteps) {
      for (const sub of layer) {
        for (const sid of stepStations(sub, nameMap)) {
          matched.add(sid);
        }
      }
    }
  }
  return Array.from(matched);
}

export function recipeStations(
  recipe: { steps: { id?: string; actorID?: string; targetID?: string; subSteps?: any[][] }[][] },
  nameMap: Record<string, string>
): string[] {
  const matched = new Set<string>();
  for (const layer of recipe.steps) {
    for (const step of layer) {
      for (const sid of stepStations(step, nameMap)) {
        matched.add(sid);
      }
    }
  }
  // Also include higher-tier upgrade stations so users can toggle them on
  for (const sid of matched) {
    const upgrades = STATION_UPGRADES[sid];
    if (upgrades) {
      for (const up of upgrades) matched.add(up);
    }
  }
  return Array.from(matched);
}

export function getStationName(id: string): string {
  return STATIONS.find((s) => s.id === id)?.name || id;
}

// Direct upgrade chains: lower-tier -> higher-tier
export const STATION_UPGRADES: Record<string, string[]> = {
  "adobe-kiln": ["stone-kiln"],
  "adobe-oven": ["brick-oven"],
  "adobe-forge": ["blast-furnace"],
  "stone-furnace": ["blast-furnace"],
};

export interface UpgradeHint {
  id: string;
  name: string;
}

// Show upgrade hints when a higher-tier station is available but NOT yet toggled on.
// This lets users click the hint to enable the station.
export function getUpgradeHints(
  stepStations: string[],
  availableStations: Set<string>,
  requiredStations: string[]
): UpgradeHint[] {
  const hints: UpgradeHint[] = [];
  for (const sid of stepStations) {
    const upgrades = STATION_UPGRADES[sid];
    if (!upgrades) continue;
    for (const upId of upgrades) {
      // Only show hint if upgrade is relevant to this recipe,
      // the user hasn't toggled it on yet,
      // and we haven't already shown this hint
      if (
        requiredStations.includes(upId) &&
        !availableStations.has(upId) &&
        !hints.some((h) => h.id === upId)
      ) {
        hints.push({ id: upId, name: getStationName(upId) });
      }
    }
  }
  return hints;
}
