/**
 * Type definitions for 2HOL crafting data
 * Matches the JSON schema from twotech.twohoursonelife.com
 */

export interface Transition {
  actorID?: string;
  targetID?: string;
  newActorID?: string;
  newTargetID?: string;
  newExtraTargetID?: string;
  hand?: boolean;
  tool?: boolean;
  targetRemains?: boolean;
  decay?: string;
  move?: number;
  weight?: number;
  targetUses?: string;
  newTargetUses?: string;
  actorUses?: string;
  newActorUses?: string;
  newActorWeight?: number;
}

export interface RecipeStep {
  id: string;
  depth: number;
  mainBranch?: boolean;
  count?: number;
  uses?: string;
  actorID?: string;
  targetID?: string;
  hand?: boolean;
  decay?: string;
  tool?: boolean;
  weight?: number;
  targetUses?: string;
  subSteps?: RecipeStep[][];
}

export interface Recipe {
  steps: RecipeStep[][];
  ingredients?: string[];
  uncraftables?: string[];
}

export interface TechTreeNode {
  id?: string;
  decay?: string;
  nodes?: TechTreeNode[] | null;
}

export interface ObjectData {
  id: string;
  name: string;
  transitionsToward: Transition[];
  transitionsAway: Transition[];
  transitionsTimed: Transition[];
  version: string;
  foodValue?: number[];
  craftable: boolean;
  depth: number;
  size: number;
  minPickupAge: number;
  sounds?: number[];
  techTree: TechTreeNode[];
  recipe?: Recipe;
  mapChance?: number;
  biomes?: { id: string; spawnChance: number }[];
}

export interface ObjectIndexEntry {
  id: string;
  name: string;
  difficulty: number | null;
  numSlots: number;
  craftable: boolean;
}

export interface ObjectIndex {
  ids: string[];
  names: string[];
  difficulties: (number | null)[];
  numSlots: number[];
  craftable: boolean[];
  filters: Record<string, unknown>;
  badges: Record<string, unknown>;
  date: string;
  versions: string[];
  biomeIds: string[];
  biomeNames: string[];
  foodEatBonus: number;
}

export interface GraphNode {
  id: string;
  type: "item" | "action" | "decay" | "root";
  data: {
    objectId: string;
    objectName: string;
    step?: RecipeStep;
    actionType?: "hand" | "tool" | "combine" | "decay";
    decayTime?: string;
    count?: number;
    depth: number;
    hasSubSteps?: boolean;
    actorName?: string;
    targetName?: string;
  };
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  label?: string;
}
