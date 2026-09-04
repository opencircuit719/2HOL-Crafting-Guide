"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ObjectIndexEntry } from "@/lib/types";
import { itemUrl } from "@/lib/slug";
import { Search, X } from "lucide-react";

interface ObjectSearchProps {
  objects: ObjectIndexEntry[];
  compact?: boolean;
  onQueryChange?: (query: string) => void;
}

export default function ObjectSearch({ objects, compact = false, onQueryChange }: ObjectSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ObjectIndexEntry[]>([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      onQueryChange?.(value);
      if (value.trim().length < 2) {
        setResults([]);
        return;
      }
      const lower = value.toLowerCase();
      const terms = lower.split(/\s+/).filter(Boolean);
      const filtered = objects
        .filter((o) => terms.every((term) => o.name.toLowerCase().includes(term)))
        .sort((a, b) => {
          const craftableCmp = Number(b.craftable) - Number(a.craftable);
          if (craftableCmp !== 0) return craftableCmp;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 20);
      setResults(filtered);
    },
    [objects, onQueryChange]
  );

  const clear = () => {
    setQuery("");
    onQueryChange?.("");
    setResults([]);
    inputRef.current?.focus();
  };

  const goToSearchPage = () => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      window.location.href = `/search?q=${encodeURIComponent(trimmed)}`;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setFocused(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`relative ${compact ? "w-64 lg:w-80" : "w-full max-w-2xl mx-auto"}`}>
      <div
        className={`relative flex items-center gap-2 rounded-lg border bg-white transition-colors dark:bg-zinc-900 ${
          focused ? "border-amber-400 ring-1 ring-amber-400/30" : "border-gray-300 dark:border-zinc-700"
        } ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}
      >
        <Search className={`text-gray-400 shrink-0 dark:text-zinc-500 ${compact ? "w-4 h-4" : "w-5 h-5"}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              goToSearchPage();
            }
          }}
          placeholder={compact ? "Search..." : "Search items... (Ctrl+K)"}
          className="flex-1 bg-transparent outline-none placeholder:text-gray-400 text-gray-900 dark:placeholder:text-zinc-500 dark:text-zinc-100 min-w-0"
        />
        {query && (
          <button
            onClick={clear}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 dark:hover:bg-zinc-800 dark:text-zinc-400"
          >
            <X className={`${compact ? "w-3 h-3" : "w-4 h-4"}`} />
          </button>
        )}
        {!compact && (
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-gray-400 border border-gray-300 rounded px-1.5 py-0.5 dark:text-zinc-500 dark:border-zinc-700">
            Ctrl+K
          </kbd>
        )}
      </div>

      {focused && results.length > 0 && (
        <div className={`absolute z-50 mt-2 rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden dark:border-zinc-700 dark:bg-zinc-900 ${compact ? "w-72 lg:w-96 -left-2" : "w-full"}`}>
          <ul className="max-h-80 overflow-auto py-1">
            {results.map((obj) => (
              <li key={obj.id}>
                <a
                  href={itemUrl(obj.id, obj.name)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors dark:hover:bg-zinc-800"
                >
                  <img
                    src={`/sprites/obj_${obj.id}.png`}
                    alt=""
                    className="w-10 h-10 object-contain shrink-0"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-zinc-100">
                      {obj.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      ID: {obj.id}
                      {obj.craftable ? (
                        <span className="ml-2 text-emerald-600 dark:text-emerald-400">Craftable</span>
                      ) : (
                        <span className="ml-2 text-red-500 dark:text-red-400">Uncreatable</span>
                      )}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <button
            onClick={goToSearchPage}
            className="w-full px-4 py-2.5 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 border-t border-gray-200 dark:text-amber-400 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:border-zinc-700 transition-colors"
          >
            View all results
          </button>
        </div>
      )}

      {focused && query.length >= 2 && results.length === 0 && (
        <div className={`absolute z-50 mt-2 rounded-lg border border-gray-200 bg-white shadow-xl px-4 py-3 text-sm text-gray-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 ${compact ? "w-72 lg:w-96 -left-2" : "w-full"}`}>
          No items found.
        </div>
      )}
    </div>
  );
}
