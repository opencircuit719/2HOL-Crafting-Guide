import { Metadata } from "next";
import { searchObjects, getAllObjects } from "@/lib/data";
import SearchResultsClient from "./SearchResultsClient";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q} - Two Hours One Life` : "Search - Two Hours One Life",
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const allObjects = await getAllObjects();

  let results = allObjects;
  if (query.length >= 2) {
    const lower = query.toLowerCase();
    const terms = lower.split(/\s+/).filter(Boolean);
    results = allObjects
      .filter((o) => terms.every((term) => o.name.toLowerCase().includes(term)))
      .sort((a, b) => {
        const craftableCmp = Number(b.craftable) - Number(a.craftable);
        if (craftableCmp !== 0) return craftableCmp;
        return a.name.localeCompare(b.name);
      });
  } else if (query.length > 0) {
    results = [];
  }

  return <SearchResultsClient query={query} results={results} total={allObjects.length} />;
}
