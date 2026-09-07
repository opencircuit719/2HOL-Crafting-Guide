"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ObjectIndexEntry } from "@/lib/types";
import { itemUrl } from "@/lib/slug";
import SpriteImage from "@/components/SpriteImage";
import { Shirt, UtensilsCrossed, Wrench, Package, Flame, TreePine } from "lucide-react";

interface Category {
  key: string;
  name: string;
  ids: string[];
}

interface CategoryBarProps {
  categories: Category[];
  objects: ObjectIndexEntry[];
  query?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  clothing: <Shirt className="w-4 h-4" />,
  food: <UtensilsCrossed className="w-4 h-4" />,
  tools: <Wrench className="w-4 h-4" />,
  containers: <Package className="w-4 h-4" />,
  heat: <Flame className="w-4 h-4" />,
  natural: <TreePine className="w-4 h-4" />,
};

type SortField = "recent" | "difficulty" | "name" | "slots";
type SortOrder = "asc" | "desc";

export default function CategoryBar({ categories, objects, query = "" }: CategoryBarProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [onlyCraftable, setOnlyCraftable] = useState(false);

  const activeCategory = categories.find((c) => c.key === activeKey);
  const objectMap = useMemo(() => new Map(objects.map((o) => [o.id, o])), [objects]);

  const handleCategoryClick = useCallback((key: string) => {
    setActiveKey((prev) => (prev === key ? null : key));
  }, []);

  const [displayObjects, setDisplayObjects] = useState<ObjectIndexEntry[]>(() =>
    objects.slice(0, 24)
  );

  useEffect(() => {
    const shuffled = [...objects];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setDisplayObjects(shuffled.slice(0, 24));
  }, [objects]);

  const filteredObjects = useMemo(() => {
    let list: ObjectIndexEntry[];

    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      const lower = trimmed.toLowerCase();
      const terms = lower.split(/\s+/).filter(Boolean);
      list = objects.filter((o) =>
        terms.every((term) => o.name.toLowerCase().includes(term))
      );
    } else if (activeCategory) {
      list = activeCategory.ids
        .map((id) => objectMap.get(id))
        .filter(Boolean) as ObjectIndexEntry[];
    } else {
      list = displayObjects;
    }

    if (onlyCraftable) {
      list = list.filter((o) => o.craftable);
    }

    list = [...list].sort((a, b) => {
      // Push uncreatable items to the bottom when not explicitly filtering them out
      if (!onlyCraftable) {
        const craftableCmp = Number(b.craftable) - Number(a.craftable);
        if (craftableCmp !== 0) return craftableCmp;
      }

      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "difficulty":
          cmp = (a.difficulty ?? -1) - (b.difficulty ?? -1);
          break;
        case "slots":
          cmp = (a.numSlots ?? 0) - (b.numSlots ?? 0);
          break;
        case "recent":
          cmp = parseInt(b.id) - parseInt(a.id);
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return list;
  }, [activeCategory, objectMap, objects, onlyCraftable, sortField, sortOrder, query, displayObjects]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => handleCategoryClick(cat.key)}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-full text-sm font-medium transition-colors border touch-manipulation ${
              activeKey === cat.key
                ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/50"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
            }`}
          >
            {iconMap[cat.key] || null}
            {cat.name}
            <span className="text-xs text-gray-400 ml-0.5 dark:text-zinc-500">{cat.ids.length}</span>
          </button>
        ))}
      </div>

      {activeCategory && (
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            {activeCategory.name}
          </h2>
          <p className="text-sm text-gray-400 dark:text-zinc-500">
            {filteredObjects.length} items
          </p>
        </div>
      )}

      {/* Sort & Filter controls */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-zinc-400">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1 text-gray-700 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-amber-400"
          >
            <option value="recent">Recent</option>
            <option value="difficulty">Difficulty</option>
            <option value="name">Name</option>
            <option value="slots">Slots</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-zinc-400">Order:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1 text-gray-700 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-amber-400"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer dark:text-zinc-300">
          <input
            type="checkbox"
            checked={onlyCraftable}
            onChange={(e) => setOnlyCraftable(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
          Only craftable
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredObjects.map((obj) => (
          <a
            key={obj.id}
            href={itemUrl(obj.id, obj.name)}
            className={`group flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
              obj.craftable
                ? "border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-amber-400/50 dark:hover:bg-zinc-800/50"
                : "border-gray-100 bg-gray-50/50 opacity-60 hover:opacity-100 hover:border-amber-300 hover:bg-amber-50/30 dark:border-zinc-800/50 dark:bg-zinc-900/30 dark:hover:border-amber-500/30 dark:hover:bg-zinc-800/30"
            }`}
          >
            <div className="w-[108px] h-[108px] flex items-center justify-center">
              <SpriteImage
                src={`/sprites/obj_${obj.id}.png`}
                alt={obj.name}
                className="w-full h-full object-contain"
              />
            </div>
            <span className={`text-xs text-center line-clamp-2 leading-tight transition-colors ${
              obj.craftable
                ? "text-gray-600 group-hover:text-amber-700 dark:text-zinc-300 dark:group-hover:text-amber-300"
                : "text-gray-400 group-hover:text-amber-600 dark:text-zinc-500 dark:group-hover:text-amber-400"
            }`}>
              {obj.name}
            </span>
            {!obj.craftable && (
              <span className="text-[10px] text-red-400 dark:text-red-500">Uncreatable</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
