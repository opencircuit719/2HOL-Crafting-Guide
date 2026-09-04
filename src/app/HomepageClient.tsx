"use client";

import { useState } from "react";
import { ObjectIndexEntry } from "@/lib/types";
import ObjectSearch from "@/components/search/ObjectSearch";
import CategoryBar from "@/components/CategoryBar";

interface Category {
  key: string;
  name: string;
  ids: string[];
}

interface HomepageClientProps {
  objects: ObjectIndexEntry[];
  categories: Category[];
}

export default function HomepageClient({ objects, categories }: HomepageClientProps) {
  const [query, setQuery] = useState("");

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
          Two Hours One Life
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto dark:text-zinc-400">
          Interactive crafting guide for{" "}
          <a
            href="https://twohoursonelife.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:underline dark:text-amber-400"
          >
            Two Hours One Life
          </a>
        </p>
        <p className="text-base text-gray-400 dark:text-zinc-500">
          Search any item to see how it is made.
        </p>
      </div>

      <ObjectSearch objects={objects} onQueryChange={setQuery} />
      <CategoryBar categories={categories} objects={objects} query={query} />
    </div>
  );
}
