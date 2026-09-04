"use client";

import { useState, useCallback, useMemo } from "react";
import { ObjectIndexEntry } from "@/lib/types";
import { itemUrl } from "@/lib/slug";
import SpriteImage from "@/components/SpriteImage";
import { Search, X, Filter, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SearchResultsClientProps {
  query: string;
  results: ObjectIndexEntry[];
  total: number;
}

export default function SearchResultsClient({ query, results, total }: SearchResultsClientProps) {
  const [searchQuery, setSearchQuery] = useState(query);
  const [onlyCraftable, setOnlyCraftable] = useState(false);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      const params = new URLSearchParams({ q: value.trim() });
      window.history.replaceState(null, "", `/search?${params.toString()}`);
    }
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      const params = new URLSearchParams({ q: searchQuery.trim() });
      window.location.href = `/search?${params.toString()}`;
    }
  }, [searchQuery]);

  const filteredResults = useMemo(() => {
    let filtered = results;
    if (onlyCraftable) {
      filtered = filtered.filter((o) => o.craftable);
    }
    return filtered;
  }, [results, onlyCraftable]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 transition-colors dark:text-zinc-400 dark:hover:text-amber-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Link>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
        <div className="relative flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 transition-colors dark:bg-zinc-900 dark:border-zinc-700 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/30">
          <Search className="w-5 h-5 text-gray-400 shrink-0 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search items..."
            className="flex-1 bg-transparent outline-none placeholder:text-gray-400 text-gray-900 dark:placeholder:text-zinc-500 dark:text-zinc-100 min-w-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 dark:hover:bg-zinc-800 dark:text-zinc-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            {query ? `Results for "${query}"` : "All Items"}
          </h1>
          <span className="text-sm text-gray-400 dark:text-zinc-500">
            {filteredResults.length} {filteredResults.length === 1 ? "item" : "items"}
            {onlyCraftable && " (craftable only)"}
          </span>
        </div>
        <button
          onClick={() => setOnlyCraftable((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            onlyCraftable
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          <Filter className="w-3 h-3" />
          Only Craftable
        </button>
      </div>

      {/* Results grid */}
      {filteredResults.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-zinc-500">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No items found</p>
          {query && (
            <p className="text-sm mt-1">Try a different search term or check your spelling.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredResults.map((obj) => (
            <a
              key={obj.id}
              href={itemUrl(obj.id, obj.name)}
              className="group flex flex-col items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 px-3 py-4 hover:border-amber-400 dark:hover:border-amber-400/50 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="w-16 h-16 flex items-center justify-center">
                <SpriteImage
                  src={`/sprites/obj_${obj.id}.png`}
                  alt={obj.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-center min-w-0 w-full">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                  {obj.name}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  ID: {obj.id}
                </p>
              </div>
              {obj.craftable && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
                  Craftable
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
