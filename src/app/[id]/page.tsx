import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getObjectById, loadObjectData, getSpriteUrl, getAllObjects, loadObjectIndex } from "@/lib/data";
import { itemSlug, itemUrl, parseItemSlug } from "@/lib/slug";
import SpriteImage from "@/components/SpriteImage";
import { ArrowLeft, Hand, Clock, Wrench, ChefHat, GitBranch, Box, Baby, Gauge, Layers, Tag, Leaf } from "lucide-react";
import SoundPlayer from "@/components/SoundPlayer";
import ExpandableTransitions from "@/components/ExpandableTransitions";
import ItemDetailTabs from "@/components/ItemDetailTabs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: slug } = await params;
  const id = parseItemSlug(slug);
  const obj = await getObjectById(id);
  return {
    title: obj ? `${obj.name} - Two Hours One Life` : "Not Found",
  };
}

export default async function ObjectPage({ params }: PageProps) {
  const { id: slug } = await params;
  const id = parseItemSlug(slug);
  const summary = await getObjectById(id);
  if (!summary) return notFound();

  const data = await loadObjectData(id);
  if (!data) return notFound();

  const objects = await getAllObjects();
  const nameMap = new Map(objects.map((o) => [o.id, o.name]));

  const index = await loadObjectIndex();
  const biomeNameMap = new Map(index.biomeIds.map((id, i) => [id, index.biomeNames[i]]));

  const spriteUrl = getSpriteUrl(id);

  const recipeChain: string[] = [];
  if (data.recipe) {
    for (const layer of data.recipe.steps) {
      const main = layer.find((s) => s.mainBranch) || layer[0];
      if (main) recipeChain.push(main.id);
    }
  }
  const currentIndex = recipeChain.findIndex((itemId) => itemId === id);
  const prevId = currentIndex > 0 ? recipeChain[currentIndex - 1] : null;
  const nextId = currentIndex >= 0 && currentIndex < recipeChain.length - 1 ? recipeChain[currentIndex + 1] : null;

  const hasRecipe = data.recipe && data.recipe.steps.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <a
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 transition-colors dark:text-zinc-400 dark:hover:text-amber-400"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to search
      </a>

      <div className={`grid grid-cols-1 gap-8 ${hasRecipe ? "lg:grid-cols-3" : ""}`}>
        {/* Left sidebar */}
        <div className={`space-y-6 ${hasRecipe ? "lg:col-span-1" : ""}`}>
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0">
              <SpriteImage
                src={spriteUrl}
                alt={data.name}
                className="w-20 h-20 object-contain"
              />
            </div>
            <div className="space-y-2 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{data.name}</h1>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 font-mono text-xs">
                  ID: {data.id}
                </span>
                {data.craftable && (
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800">
                    Craftable
                  </span>
                )}
                {data.foodValue && (
                  <span className="px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1 text-xs dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800">
                    <ChefHat className="w-3 h-3" />
                    Food
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Properties
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
                <Box className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                <span className="text-gray-400 dark:text-zinc-500">Size:</span>
                <span>{data.size}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
                <Baby className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                <span className="text-gray-400 dark:text-zinc-500">Pickup:</span>
                <span>{data.minPickupAge}y</span>
              </div>
              {summary.difficulty !== null && typeof summary.difficulty === 'number' && summary.difficulty > 0 && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
                  <Gauge className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                  <span className="text-gray-400 dark:text-zinc-500">Difficulty:</span>
                  <span>{summary.difficulty.toFixed(2)}</span>
                </div>
              )}
              {summary.numSlots > 0 && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
                  <Layers className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                  <span className="text-gray-400 dark:text-zinc-500">Slots:</span>
                  <span>{summary.numSlots}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
                <Tag className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                <span className="text-gray-400 dark:text-zinc-500">Version:</span>
                <span>{data.version}</span>
              </div>
              {data.foodValue && (
                <div className="flex items-center gap-1.5 text-orange-600 col-span-2 dark:text-orange-300">
                  <ChefHat className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-gray-400 dark:text-zinc-500">Food:</span>
                  <span>{data.foodValue[0]} pips</span>
                  {data.foodValue[1] > 0 && (
                    <span>+ {data.foodValue[1]} bonus</span>
                  )}
                </div>
              )}
            </div>
            {data.sounds && data.sounds.length > 0 && (
              <SoundPlayer soundIds={data.sounds} />
            )}
          </div>

          {data.recipe && data.recipe.steps.length > 0 && (
            <>
              <a
                href={`${itemUrl(id, data.name)}workflow/`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors text-sm font-medium dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50 dark:hover:bg-amber-900/60"
              >
                <GitBranch className="w-4 h-4" />
                View Workflow
              </a>
              <a
                href={`${itemUrl(id, data.name)}craft-it/`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors text-sm font-semibold dark:bg-amber-600 dark:text-zinc-950 dark:hover:bg-amber-500"
              >
                <Wrench className="w-4 h-4" />
                CRAFT IT
              </a>
            </>
          )}

          {/* Spawn Chance */}
          {data.mapChance && data.mapChance > 0 && data.biomes && data.biomes.length > 0 && (
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5" />
                Spawn Chance
              </h3>
              <div className="space-y-2">
                {data.biomes
                  .sort((a, b) => b.spawnChance - a.spawnChance)
                  .map((b) => {
                    const biomeName = biomeNameMap.get(b.id) || `Biome ${b.id}`;
                    const pct = (b.spawnChance * 100).toFixed(1);
                    return (
                      <div key={b.id} className="flex items-center gap-3">
                        <img
                          src={`/ground/ground_${b.id}.png`}
                          alt={biomeName}
                          className="w-10 h-10 rounded border border-gray-200 dark:border-zinc-700 shrink-0"
                          width={40}
                          height={40}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700 dark:text-zinc-300">{biomeName}</div>
                        </div>
                        <span className="font-mono text-sm text-gray-500 dark:text-zinc-400">{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Transitions Toward */}
          {data.transitionsToward.length > 0 && (
            <ExpandableTransitions title="How to Create" initialShow={5}>
              {data.transitionsToward.map((t, i) => (
                <TransitionRow key={i} transition={t} nameMap={nameMap} size={hasRecipe ? "md" : "lg"} />
              ))}
            </ExpandableTransitions>
          )}

          {/* Transitions Away */}
          {data.transitionsAway.length > 0 && (
            <ExpandableTransitions title="What This Can Make" initialShow={5}>
              {data.transitionsAway.map((t, i) => (
                <TransitionRow key={i} transition={t} nameMap={nameMap} size={hasRecipe ? "md" : "lg"} />
              ))}
            </ExpandableTransitions>
          )}
        </div>

        {/* Right main - only show for craftable items */}
        {hasRecipe && (
          <div className="lg:col-span-2">
            <ItemDetailTabs
              recipe={data.recipe!}
              transitions={data.transitionsToward}
              transitionsAway={data.transitionsAway}
              nameMap={nameMap}
              id={id}
              prevId={prevId}
              nextId={nextId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TransitionRow({
  transition,
  nameMap,
  size = "md",
}: {
  transition: import("@/lib/types").Transition;
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

function ObjectLink({ id, nameMap, size = "md" }: { id: string; nameMap: Map<string, string>; size?: "sm" | "md" | "lg" }) {
  if (id === "0" || id === "-1") {
    return (
      <span className="text-gray-400 dark:text-zinc-500 italic">
        {id === "0" ? "Player" : "Ground"}
      </span>
    );
  }
  const name = nameMap.get(id) || `ID ${id}`;
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };
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
