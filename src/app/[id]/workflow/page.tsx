import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getObjectById,
  loadObjectData,
  getSpriteUrl,
  getAllObjects,
  buildNameMap,
} from "@/lib/data";
import { itemSlug, itemUrl, parseItemSlug } from "@/lib/slug";
import WorkflowGraph from "@/components/graph/WorkflowGraph";
import { ArrowLeft, GitBranch, Wrench } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: slug } = await params;
  const id = parseItemSlug(slug);
  const obj = await getObjectById(id);
  return {
    title: obj ? `${obj.name} Workflow - Two Hours One Life` : "Not Found",
  };
}

export default async function WorkflowPage({ params }: PageProps) {
  const { id: slug } = await params;
  const id = parseItemSlug(slug);
  const summary = await getObjectById(id);
  if (!summary) return notFound();

  const data = await loadObjectData(id);
  if (!data) return notFound();

  if (!data.recipe || data.recipe.steps.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <a
          href={itemUrl(id, data.name)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to item
        </a>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">{data.name}</h1>
          <p className="text-gray-500 dark:text-zinc-400">No crafting workflow available for this item.</p>
        </div>
      </div>
    );
  }

  const nameMap = await buildNameMap();
  const nameMapRecord: Record<string, string> = {};
  nameMap.forEach((name, key) => {
    nameMapRecord[key] = name;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <a
          href={itemUrl(id, data.name)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to item
        </a>
        <div className="flex flex-col items-end gap-2">
          <a
            href={`${itemUrl(id, data.name)}workflow/`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50"
          >
            <GitBranch className="w-4 h-4" />
            Workflow View
          </a>
          <a
            href={`${itemUrl(id, data.name)}craft-it/`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors text-xs font-semibold dark:bg-amber-600 dark:text-zinc-950 dark:hover:bg-amber-500"
          >
            <Wrench className="w-3.5 h-3.5" />
            CRAFT IT
          </a>
        </div>
      </div>

      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0">
          <img
            src={getSpriteUrl(id)}
            alt={data.name}
            className="w-9 h-9 sm:w-12 sm:h-12 object-contain"
            loading="lazy"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-zinc-100 truncate">{data.name}</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
            Crafting workflow • {data.recipe.steps.length} layers
            {data.recipe.ingredients && (
              <span> • {data.recipe.ingredients.length} ingredients</span>
            )}
          </p>
        </div>
      </div>

      <WorkflowGraph
        recipe={data.recipe}
        rootId={id}
        nameMap={nameMapRecord}
      />
    </div>
  );
}
