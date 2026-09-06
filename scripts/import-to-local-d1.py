#!/usr/bin/env python3
"""Import 2HOL object data directly into local D1 SQLite file."""

import json
import os
import sqlite3
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "data")
OBJECTS_DIR = os.path.join(DATA_DIR, "objects")
DB_PATH = "/home/opencircuit/2hol-crafting-workflows/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/cbe1c9b146a535e96b9e191b70eae1364573c0714753023c766f1c45180fe8d1.sqlite"

def main():
    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Creating schema...")
    schema_path = os.path.join(os.path.dirname(__file__), "d1-schema.sql")
    with open(schema_path) as f:
        cur.executescript(f.read())
    conn.commit()

    print("Loading objects.json...")
    with open(os.path.join(DATA_DIR, "objects.json")) as f:
        index = json.load(f)

    print("Inserting object_index rows...")
    index_rows = []
    for i, obj_id in enumerate(index["ids"]):
        index_rows.append((
            str(obj_id),
            str(index["names"][i]),
            float(index["difficulties"][i]) if index["difficulties"][i] is not None else None,
            int(index["numSlots"][i]) if index["numSlots"][i] is not None else 0,
            1 if index["craftable"][i] else 0,
        ))
    cur.executemany(
        "INSERT OR REPLACE INTO object_index (id, name, difficulty, numSlots, craftable) VALUES (?, ?, ?, ?, ?)",
        index_rows
    )
    conn.commit()
    print(f"  Inserted {len(index_rows)} rows into object_index")

    print("Inserting object_data rows...")
    data_rows = []
    for obj_id in index["ids"]:
        file_path = os.path.join(OBJECTS_DIR, f"{obj_id}.json")
        with open(file_path) as f:
            raw = f.read()
        data_rows.append((str(obj_id), raw))
    cur.executemany(
        "INSERT OR REPLACE INTO object_data (id, json) VALUES (?, ?)",
        data_rows
    )
    conn.commit()
    print(f"  Inserted {len(data_rows)} rows into object_data")

    print("Inserting categories rows...")
    cat_rows = []
    for key, val in index.get("filters", {}).items():
        cat_rows.append((
            str(val["key"]),
            str(val["name"]),
            json.dumps(val.get("ids", [])),
        ))
    cur.executemany(
        "INSERT OR REPLACE INTO categories (key, name, ids) VALUES (?, ?, ?)",
        cat_rows
    )
    conn.commit()
    print(f"  Inserted {len(cat_rows)} rows into categories")

    conn.close()
    print("Done!")

if __name__ == "__main__":
    main()
