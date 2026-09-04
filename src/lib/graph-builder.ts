import { Recipe, RecipeStep, GraphNode, GraphEdge } from "./types";
import * as dagre from "dagre";

const NODE_WIDTH = 140;
const NODE_HEIGHT = 80;
const ACTION_NODE_WIDTH = 60;
const ACTION_NODE_HEIGHT = 40;

const TOOL_KEYWORDS = [
  "knife", "pick", "axe", "saw", "shears", "hammer", "chisel", "file",
  "tongs", "bowl", "needle", "spade", "adze", "scythe", "hoe", "loom",
  "wheel", "anvil", "forge", "oven", "furnace", "drill", "plane", "brush",
  "rod", "stone", "rock", "tool", "adobe", "clamp", "clamp", "bench",
  "table", "mallet", "crowbar", "shovel", "billhook", "plough", "yoke",
  "cart", "trap", "fence", "gate", "wall", "floor", "road", "well",
  "pump", "pipe", "tank", "basin", "pan", "pot", "kettle", "grinder",
  "mill", "press", "mold", "die", "stamp", "loom", "spindle", "distaff",
];

interface BuiltGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface FilterOptions {
  hideTools?: boolean;
  hideNatural?: boolean;
  mainBranchOnly?: boolean;
}

function collectActorIds(steps: RecipeStep[][]): Set<string> {
  const ids = new Set<string>();
  steps.forEach((layer) =>
    layer.forEach((step) => {
      if (step.actorID) ids.add(step.actorID);
      if (step.subSteps) {
        collectActorIds(step.subSteps).forEach((id) => ids.add(id));
      }
    })
  );
  return ids;
}

function collectTargetIds(steps: RecipeStep[][]): Set<string> {
  const ids = new Set<string>();
  steps.forEach((layer) =>
    layer.forEach((step) => {
      if (step.targetID) ids.add(step.targetID);
      if (step.subSteps) {
        collectTargetIds(step.subSteps).forEach((id) => ids.add(id));
      }
    })
  );
  return ids;
}

class RecipeGraphBuilder {
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];
  private edgeIds = new Set<string>();
  private itemNodeIds = new Set<string>();
  private g: dagre.graphlib.Graph;
  private nameMap: Map<string, string>;
  private rootId: string;
  private filters: FilterOptions;
  private hiddenItemIds: Set<string>;

  constructor(
    rootId: string,
    nameMap: Map<string, string>,
    filters: FilterOptions = {},
    hiddenItemIds: Set<string> = new Set()
  ) {
    this.rootId = rootId;
    this.nameMap = nameMap;
    this.filters = filters;
    this.hiddenItemIds = hiddenItemIds;

    this.g = new dagre.graphlib.Graph();
    this.g.setGraph({
      rankdir: "LR" as const,
      ranksep: 120,
      nodesep: 30,
      edgesep: 20,
    });
    this.g.setDefaultEdgeLabel(() => ({}));
  }

  private getName(id: string): string {
    return this.nameMap.get(id) || `ID ${id}`;
  }

  private addEdge(edge: GraphEdge) {
    if (this.edgeIds.has(edge.id)) return;
    this.edgeIds.add(edge.id);
    this.edges.push(edge);
    this.g.setEdge(edge.source, edge.target);
  }

  ensureItemNode(objectId: string, depth: number) {
    const nodeId = `item-${objectId}`;
    if (this.itemNodeIds.has(nodeId)) return nodeId;
    this.itemNodeIds.add(nodeId);

    this.g.setNode(nodeId, { width: NODE_WIDTH, height: NODE_HEIGHT });

    this.nodes.push({
      id: nodeId,
      type: objectId === this.rootId ? "root" : "item",
      data: {
        objectId,
        objectName: this.getName(objectId),
        depth,
      },
      position: { x: 0, y: 0 },
    });
    return nodeId;
  }

  private addActionNode(step: RecipeStep, prefix: string, index: number): string {
    const actionId = prefix
      ? `${prefix}action-${step.id}-${index}`
      : `action-${step.id}-${index}`;
    this.g.setNode(actionId, { width: ACTION_NODE_WIDTH, height: ACTION_NODE_HEIGHT });

    const actionType = step.decay
      ? "decay"
      : step.tool
      ? "tool"
      : step.hand
      ? "hand"
      : "combine";

    this.nodes.push({
      id: actionId,
      type: "action",
      data: {
        objectId: step.id,
        objectName: this.getName(step.id),
        step,
        actionType,
        decayTime: step.decay,
        depth: step.depth,
        hasSubSteps: !!(step.subSteps && step.subSteps.length > 0),
        actorName: step.actorID ? this.getName(step.actorID) : undefined,
        targetName: step.targetID ? this.getName(step.targetID) : undefined,
      },
      position: { x: 0, y: 0 },
    });
    return actionId;
  }

  private shouldSkipStep(step: RecipeStep): boolean {
    if (this.filters.mainBranchOnly && !step.mainBranch) return true;
    return false;
  }

  private isHiddenItem(id: string): boolean {
    return this.hiddenItemIds.has(id);
  }

  processSteps(steps: RecipeStep[][], prefix: string = "") {
    steps.forEach((layer, layerIdx) => {
      layer.forEach((step, stepIdx) => {
        if (this.shouldSkipStep(step)) return;

        // If step has subSteps, expand them instead of creating a summary action node
        if (step.subSteps && step.subSteps.length > 0) {
          const subPrefix = prefix
            ? `${prefix}sub-${step.id}-`
            : `sub-${step.id}-`;
          this.processSteps(step.subSteps, subPrefix);
          return;
        }

        const actionId = this.addActionNode(step, prefix, layerIdx * 100 + stepIdx);
        const outputNodeId = this.ensureItemNode(step.id, step.depth);

        this.addEdge({
          id: `e-${actionId}-${outputNodeId}`,
          source: actionId,
          target: outputNodeId,
          type: "smoothstep",
          animated: step.mainBranch ?? false,
        });

        if (step.actorID && !this.isHiddenItem(step.actorID)) {
          const actorNodeId = this.ensureItemNode(step.actorID, step.depth + 1);
          this.addEdge({
            id: `e-${actorNodeId}-${actionId}`,
            source: actorNodeId,
            target: actionId,
            type: "smoothstep",
          });
        }

        if (step.targetID && !this.isHiddenItem(step.targetID)) {
          const targetNodeId = this.ensureItemNode(step.targetID, step.depth + 1);
          this.addEdge({
            id: `e-${targetNodeId}-${actionId}`,
            source: targetNodeId,
            target: actionId,
            type: "smoothstep",
          });
        }
      });
    });
  }

  layout(): BuiltGraph {
    dagre.layout(this.g);

    this.nodes.forEach((node) => {
      const dagreNode = this.g.node(node.id);
      if (dagreNode) {
        node.position = {
          x: dagreNode.x - dagreNode.width / 2,
          y: dagreNode.y - dagreNode.height / 2,
        };
      }
    });

    return { nodes: this.nodes, edges: this.edges };
  }
}

function computeHiddenItems(
  recipe: Recipe,
  nameMap: Map<string, string>,
  filters: FilterOptions
): Set<string> {
  const hidden = new Set<string>();

  if (filters.hideNatural) {
    // Natural = ingredients (raw resources) + very deep items
    if (recipe.ingredients) {
      recipe.ingredients.forEach((id) => hidden.add(id));
    }
  }

  if (filters.hideTools) {
    const actorIds = collectActorIds(recipe.steps);
    actorIds.forEach((id) => {
      const name = nameMap.get(id);
      if (!name) return;
      const lower = name.toLowerCase();
      if (TOOL_KEYWORDS.some((kw) => lower.includes(kw))) {
        hidden.add(id);
      }
    });
  }

  return hidden;
}

export function buildRecipeGraph(
  recipe: Recipe,
  rootId: string,
  nameMap: Map<string, string>,
  filters: FilterOptions = {}
): BuiltGraph {
  const hiddenItemIds = computeHiddenItems(recipe, nameMap, filters);
  const builder = new RecipeGraphBuilder(rootId, nameMap, filters, hiddenItemIds);

  builder.processSteps(recipe.steps);

  if (recipe.ingredients && !filters.hideNatural) {
    recipe.ingredients.forEach((ingId) => {
      if (!hiddenItemIds.has(ingId)) {
        builder.ensureItemNode(ingId, 999);
      }
    });
  }

  return builder.layout();
}
