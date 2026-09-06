import { promises as fs } from "fs";
import * as path from "path";
import { ObjectData, ObjectIndex, ObjectIndexEntry } from "./types";

const DATA_DIR = path.join(process.cwd(), "src", "lib", "data");

// In-memory caches (persist across requests in the same Worker instance)
let cachedIndex: ObjectIndex | null = null;
let cachedObjects: ObjectIndexEntry[] | null = null;
let cachedObjectsMap: Map<string, ObjectIndexEntry> | null = null;
let cachedCategories: { key: string; name: string; ids: string[] }[] | null = null;
let cachedNameMap: Map<string, string> | null = null;
const objectDataCache = new Map<string, ObjectData>();
const OBJECT_DATA_CACHE_MAX = 500; // LRU cap for individual object data

async function getDb() {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare/cloudflare-context");
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as { DB?: D1Database }).DB ?? null;
  } catch {
    return null;
  }
}

async function readObjectsJson(): Promise<ObjectIndex> {
  const raw = await fs.readFile(path.join(DATA_DIR, "objects.json"), "utf-8");
  return JSON.parse(raw) as ObjectIndex;
}

async function readObjectFile(id: string): Promise<ObjectData | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "objects", `${id}.json`), "utf-8");
    return JSON.parse(raw) as ObjectData;
  } catch {
    return null;
  }
}

function lruSet<K, V>(map: Map<K, V>, key: K, value: V, maxSize: number) {
  if (map.size >= maxSize && !map.has(key)) {
    const firstKey = map.keys().next().value;
    if (firstKey !== undefined) {
      map.delete(firstKey);
    }
  }
  map.set(key, value);
}

export async function loadObjectIndex(): Promise<ObjectIndex> {
  if (cachedIndex) return cachedIndex;

  const db = await getDb();
  if (!db) {
    cachedIndex = await readObjectsJson();
    return cachedIndex;
  }

  const indexResult = await db.prepare("SELECT id, name, difficulty, numSlots, craftable FROM object_index").all();
  const catResult = await db.prepare("SELECT key, name, ids FROM categories").all();

  const rows = indexResult.results as Array<{
    id: string;
    name: string;
    difficulty: number | null;
    numSlots: number;
    craftable: number;
  }>;

  const filters: Record<string, unknown> = {};
  for (const cat of catResult.results as Array<{ key: string; name: string; ids: string }>) {
    filters[cat.key] = {
      key: cat.key,
      name: cat.name,
      ids: JSON.parse(cat.ids),
    };
  }

  cachedIndex = {
    ids: rows.map((r) => r.id),
    names: rows.map((r) => r.name),
    difficulties: rows.map((r) => r.difficulty),
    numSlots: rows.map((r) => r.numSlots),
    craftable: rows.map((r) => r.craftable === 1),
    filters,
    badges: {},
    date: "",
    versions: [],
    biomeIds: [],
    biomeNames: [],
    foodEatBonus: 0,
  };

  return cachedIndex;
}

export async function getAllObjects(): Promise<ObjectIndexEntry[]> {
  if (cachedObjects) return cachedObjects;

  const db = await getDb();
  if (!db) {
    const index = await readObjectsJson();
    cachedObjects = index.ids.map((id, i) => ({
      id,
      name: index.names[i],
      difficulty: index.difficulties[i],
      numSlots: index.numSlots[i],
      craftable: index.craftable[i],
    }));
    cachedObjectsMap = new Map(cachedObjects.map((e) => [e.id, e]));
    return cachedObjects;
  }

  const result = await db.prepare("SELECT id, name, difficulty, numSlots, craftable FROM object_index").all();
  cachedObjects = (result.results as Array<{
    id: string;
    name: string;
    difficulty: number | null;
    numSlots: number;
    craftable: number;
  }>).map((r) => ({
    id: r.id,
    name: r.name,
    difficulty: r.difficulty,
    numSlots: r.numSlots,
    craftable: r.craftable === 1,
  }));

  cachedObjectsMap = new Map(cachedObjects.map((e) => [e.id, e]));
  return cachedObjects;
}

export async function getObjectById(id: string): Promise<ObjectIndexEntry | undefined> {
  if (cachedObjectsMap) return cachedObjectsMap.get(id);

  const db = await getDb();
  if (!db) {
    const objects = await getAllObjects();
    return objects.find((o) => o.id === id);
  }

  const result = await db.prepare("SELECT id, name, difficulty, numSlots, craftable FROM object_index WHERE id = ?").bind(id).first();
  if (!result) return undefined;
  const r = result as { id: string; name: string; difficulty: number | null; numSlots: number; craftable: number };
  return {
    id: r.id,
    name: r.name,
    difficulty: r.difficulty,
    numSlots: r.numSlots,
    craftable: r.craftable === 1,
  };
}

export async function searchObjects(query: string, limit = 50): Promise<ObjectIndexEntry[]> {
  const lower = query.toLowerCase();

  // If we have the full cache, filter in-memory
  if (cachedObjects) {
    return cachedObjects.filter((o) => o.name.toLowerCase().includes(lower)).slice(0, limit);
  }

  const db = await getDb();
  if (!db) {
    const objects = await getAllObjects();
    return objects.filter((o) => o.name.toLowerCase().includes(lower)).slice(0, limit);
  }

  const result = await db
    .prepare("SELECT id, name, difficulty, numSlots, craftable FROM object_index WHERE name LIKE ? LIMIT ?")
    .bind(`%${query}%`, limit)
    .all();

  return (result.results as Array<{ id: string; name: string; difficulty: number | null; numSlots: number; craftable: number }>).map((r) => ({
    id: r.id,
    name: r.name,
    difficulty: r.difficulty,
    numSlots: r.numSlots,
    craftable: r.craftable === 1,
  }));
}

export async function loadObjectData(id: string): Promise<ObjectData | null> {
  const cached = objectDataCache.get(id);
  if (cached) return cached;

  const db = await getDb();
  if (db) {
    const result = await db.prepare("SELECT json FROM object_data WHERE id = ?").bind(id).first();
    if (result) {
      const data = JSON.parse((result as { json: string }).json) as ObjectData;
      lruSet(objectDataCache, id, data, OBJECT_DATA_CACHE_MAX);
      return data;
    }
  }

  // Fallback to JSON files (local dev without D1 data, or D1 data not yet imported)
  const data = await readObjectFile(id);
  if (data) objectDataCache.set(id, data);
  return data;
}

export function getSpriteUrl(objectId: string, variant?: "last"): string {
  const suffix = variant === "last" ? "_last" : "";
  return `/sprites/obj_${objectId}${suffix}.png`;
}

export async function getCategories(): Promise<{ key: string; name: string; ids: string[] }[]> {
  if (cachedCategories) return cachedCategories;

  const db = await getDb();
  if (!db) {
    const index = await readObjectsJson();
    const filters = index.filters || {};
    cachedCategories = Object.entries(filters).map(([key, val]) => ({
      key,
      name: (val as { name: string; ids?: string[] }).name,
      ids: (val as { name: string; ids?: string[] }).ids || [],
    }));
    return cachedCategories;
  }

  const result = await db.prepare("SELECT key, name, ids FROM categories").all();
  cachedCategories = (result.results as Array<{ key: string; name: string; ids: string }>).map((r) => ({
    key: r.key,
    name: r.name,
    ids: JSON.parse(r.ids) as string[],
  }));
  return cachedCategories;
}

export async function buildNameMap(): Promise<Map<string, string>> {
  if (cachedNameMap) return cachedNameMap;

  const db = await getDb();
  if (!db) {
    const objects = await getAllObjects();
    cachedNameMap = new Map(objects.map((o) => [o.id, o.name]));
    return cachedNameMap;
  }

  const result = await db.prepare("SELECT id, name FROM object_index").all();
  cachedNameMap = new Map(
    (result.results as Array<{ id: string; name: string }>).map((r) => [r.id, r.name])
  );
  return cachedNameMap;
}
