#!/usr/bin/env python3
"""Import 2HOL object data into remote Cloudflare D1."""

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
            print(f"SQL error: {result.stdout[:200]} {result.stderr[:200]}")
            return False
        return True
    finally:
        os.unlink(tmp_path)

print("Loading objects.json...")
with open(os.path.join(DATA_DIR, "objects.json")) as f:
    index = json.load(f)

print("Building object_data rows...")
data_rows = []
for obj_id in index["ids"]:
    file_path = os.path.join(OBJECTS_DIR, f"{obj_id}.json")
    with open(file_path) as f:
        raw = f.read()
    data_rows.append((str(obj_id), raw))

print(f"Inserting {len(data_rows)} rows into object_data...")
for i, (obj_id, raw) in enumerate(data_rows):
    escaped = raw.replace("'", "''")
    sql = f"INSERT OR REPLACE INTO object_data (id, json) VALUES ('{obj_id}', '{escaped}');"
    if not run_sql(sql):
        print(f"Failed at row {i} ({obj_id})")
        sys.exit(1)
    if i % 500 == 0:
        print(f"  {i}/{len(data_rows)}")

print("Done!")
