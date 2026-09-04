#!/usr/bin/env node
/**
 * Import 2HOL object data into Cloudflare D1 via REST API.
 * Uses parameter binding + batching to avoid SQLITE_TOOBIG.
 */

const fs = require("fs");
const path = require("path");

const ACCOUNT_ID = "7405700d058f6df227243fac268d5021";
const DATABASE_ID = "1ac16478-3f90-4e26-9495-6f9b5f23067e";
const DATA_DIR = path.join(__dirname, "..", "src", "lib", "data");
const OBJECTS_DIR = path.join(DATA_DIR, "objects");
const BATCH_SIZE = 100;

// Read wrangler oauth token
const WRANGLER_CONFIG = path.join(
  require("os").homedir(),
  ".config",
  ".wrangler",
  "config",
  "default.toml"
);
const configText = fs.readFileSync(WRANGLER_CONFIG, "utf-8");
const tokenMatch = configText.match(/oauth_token = "([^"]+)"/);
if (!tokenMatch) {
  console.error("Could not find oauth token in wrangler config");
  process.exit(1);
}
const TOKEN = tokenMatch[1];

const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

async function d1Batch(batch) {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ batch }),
  });
  const data = await res.json();
  if (!data.success) {
    console.error("D1 batch failed:", JSON.stringify(data.errors, null, 2));
    throw new Error("D1 batch failed");
  }
  return data;
}

async function main() {
  console.log("Creating schema...");
  const schema = fs.readFileSync(path.join(__dirname, "d1-schema.sql"), "utf-8");
  await d1Batch([{ sql: schema, params: [] }]);

  console.log("Loading objects.json...");
  const index = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "objects.json"), "utf-8"));

  console.log("Inserting object_index rows...");
  const indexQueries = [];
  for (let i = 0; i < index.ids.length; i++) {
    indexQueries.push({
      sql: "INSERT OR REPLACE INTO object_index (id, name, difficulty, numSlots, craftable) VALUES (?, ?, ?, ?, ?)",
      params: [
        String(index.ids[i]),
        String(index.names[i]),
        index.difficulties[i] !== null ? index.difficulties[i] : null,
        index.numSlots[i] !== null ? index.numSlots[i] : 0,
        index.craftable[i] ? 1 : 0,
      ],
    });
  }

  for (let i = 0; i < indexQueries.length; i += BATCH_SIZE) {
    const batch = indexQueries.slice(i, i + BATCH_SIZE);
    await d1Batch(batch);
    console.log(`  Inserted ${Math.min(i + BATCH_SIZE, indexQueries.length)} / ${indexQueries.length} index rows`);
  }

  console.log("Inserting object_data rows...");
  const dataQueries = [];
  for (const objId of index.ids) {
    const raw = fs.readFileSync(path.join(OBJECTS_DIR, `${objId}.json`), "utf-8");
    dataQueries.push({
      sql: "INSERT OR REPLACE INTO object_data (id, json) VALUES (?, ?)",
      params: [String(objId), raw],
    });
  }

  for (let i = 0; i < dataQueries.length; i += BATCH_SIZE) {
    const batch = dataQueries.slice(i, i + BATCH_SIZE);
    await d1Batch(batch);
    console.log(`  Inserted ${Math.min(i + BATCH_SIZE, dataQueries.length)} / ${dataQueries.length} data rows`);
  }

  console.log("Inserting categories...");
  const catQueries = [];
  for (const [key, val] of Object.entries(index.filters || {})) {
    catQueries.push({
      sql: "INSERT OR REPLACE INTO categories (key, name, ids) VALUES (?, ?, ?)",
      params: [val.key, val.name, JSON.stringify(val.ids || [])],
    });
  }

  for (let i = 0; i < catQueries.length; i += BATCH_SIZE) {
    const batch = catQueries.slice(i, i + BATCH_SIZE);
    await d1Batch(batch);
    console.log(`  Inserted ${Math.min(i + BATCH_SIZE, catQueries.length)} / ${catQueries.length} category rows`);
  }

  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
