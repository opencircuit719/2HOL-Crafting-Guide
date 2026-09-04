import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getObjectById,
  loadObjectData,
  getSpriteUrl,
  getAllObjects,
} from "@/lib/data";
import { itemSlug, itemUrl, parseItemSlug } from "@/lib/slug";
import CraftItGuide from "@/components/craft-it/CraftItGuide";
import { ArrowLeft, GitBranch } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: slug } = await params;
  const id = parseItemSlug(slug);
  const obj = await getObjectById(id);
  return {
    title: obj ? `${obj.name} - Craft It - Two Hours One Life` : "Not Found",
  };
}

export default async function CraftItPage({ params }: PageProps) {
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
          <p className="text-gray-500 dark:text-zinc-400">No crafting recipe available for this item.</p>
        </div>
      </div>
    );
  }

  const objects = await getAllObjects();
  const nameMap: Record<string, string> = {};
  objects.forEach((o) => {
    nameMap[o.id] = o.name;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <a
          href={itemUrl(id, data.name)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to item
        </a>
        <a
          href={`${itemUrl(id, data.name)}workflow/`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium hover:bg-amber-100 transition-colors dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50 dark:hover:bg-amber-900/60"
        >
          <GitBranch className="w-4 h-4" />
          View Workflow
        </a>
      </div>

      <CraftItGuide
        recipe={data.recipe}
        rootId={id}
        rootName={data.name}
        rootSpriteUrl={getSpriteUrl(id)}
        nameMap={nameMap}
      />
    </div>
  );
}
