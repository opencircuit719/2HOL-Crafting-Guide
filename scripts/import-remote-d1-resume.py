#!/usr/bin/env python3
"""Resume importing 2HOL object data into remote Cloudflare D1."""

import json
import os
import subprocess
import sys
import tempfile

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "data")
OBJECTS_DIR = os.path.join(DATA_DIR, "objects")
DB_NAME = "2hol-objects"

def run_sql(sql: str) -> bool:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".sql", delete=False) as f:
        f.write(sql)
        f.flush()
        tmp_path = f.name
    try:
        result = subprocess.run(
            ["npx", "wrangler", "d1", "execute", DB_NAME, "--remote", "--file", tmp_path, "--json"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(__file__),
        )
        if result.returncode != 0:
            return False
        return True
    finally:
        os.unlink(tmp_path)

def get_existing_ids() -> set:
    result = subprocess.run(
        ["npx", "wrangler", "d1", "execute", DB_NAME, "--remote", "--json", "--command", "SELECT id FROM object_data;"],
        capture_output=True,
        text=True,
        cwd=os.path.dirname(__file__),
    )
    if result.returncode != 0:
        return set()
    try:
        data = json.loads(result.stdout)
        if not data.get("success"):
            return set()
        results = data["result"][0].get("results", [])
        return set(r["id"] for r in results)
    except:
        return set()

print("Checking existing IDs...")
existing = get_existing_ids()
print(f"Existing: {len(existing)}")

print("Loading index...")
with open(os.path.join(DATA_DIR, "objects.json")) as f:
    index = json.load(f)

missing = [obj_id for obj_id in index["ids"] if obj_id not in existing]
print(f"Missing: {len(missing)}")

for i, obj_id in enumerate(missing):
    file_path = os.path.join(OBJECTS_DIR, f"{obj_id}.json")
    with open(file_path) as f:
        raw = f.read()
    escaped = raw.replace("'", "''")
    sql = f"INSERT OR REPLACE INTO object_data (id, json) VALUES ('{obj_id}', '{escaped}');"
    if not run_sql(sql):
        print(f"Failed at {obj_id}")
        break
    if i % 100 == 0:
        print(f"  {i}/{len(missing)}")

print("Done!")
