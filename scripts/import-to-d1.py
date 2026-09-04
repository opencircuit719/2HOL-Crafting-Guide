#!/usr/bin/env python3
"""Import 2HOL object data into Cloudflare D1."""

import json
import os
import subprocess
import sys
import tempfile

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "data")
OBJECTS_DIR = os.path.join(DATA_DIR, "objects")
DB_NAME = "2hol-objects"
BATCH_SIZE = 500
DATA_BATCH_SIZE = 25  # Smaller batches for large JSON blobs


def run_sql(sql: str) -> None:
    """Execute SQL via wrangler d1 execute."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".sql", delete=False) as f:
        f.write(sql)
        f.flush()
        tmp_path = f.name
    try:
        result = subprocess.run(
            ["npx", "wrangler", "d1", "execute", DB_NAME, "--file", tmp_path, "--json"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(__file__),
        )
        if result.returncode != 0:
            print(f"SQL error:\n{result.stdout}\n{result.stderr}")
            sys.exit(1)
    finally:
        os.unlink(tmp_path)


def batch_insert(table: str, columns: list[str], rows: list[tuple], batch_size: int = BATCH_SIZE) -> None:
    """Insert rows in batches."""
    placeholders = "(" + ",".join(["?"] * len(columns)) + ")"
    cols = ",".join(columns)
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        values = ",".join([placeholders] * len(batch))
        sql = f"INSERT INTO {table} ({cols}) VALUES {values};"
        # Flatten params
        params = []
        for row in batch:
            params.extend(row)
        # Replace ? with actual values (D1 execute via file doesn't support params)
        # So we need to inline the values properly
        inlined = []
        for row in batch:
            vals = []
            for v in row:
                if v is None:
                    vals.append("NULL")
                elif isinstance(v, (int, float)):
                    vals.append(str(v))
                else:
                    escaped = str(v).replace("'", "''")
                    vals.append(f"'{escaped}'")
            inlined.append("(" + ",".join(vals) + ")")
        sql = f"INSERT OR REPLACE INTO {table} ({cols}) VALUES {','.join(inlined)};"
        run_sql(sql)
        print(f"  Inserted {len(batch)} rows into {table}")


def main():
    print("Creating schema...")
    schema_path = os.path.join(os.path.dirname(__file__), "d1-schema.sql")
    with open(schema_path) as f:
        run_sql(f.read())

    print("Loading objects.json...")
    with open(os.path.join(DATA_DIR, "objects.json")) as f:
        index = json.load(f)

    print("Building object_index rows...")
    index_rows = []
    for i, obj_id in enumerate(index["ids"]):
        index_rows.append(
            (
                str(obj_id),
                str(index["names"][i]),
                float(index["difficulties"][i]) if index["difficulties"][i] is not None else None,
                int(index["numSlots"][i]) if index["numSlots"][i] is not None else 0,
                1 if index["craftable"][i] else 0,
            )
        )
    print(f"Inserting {len(index_rows)} rows into object_index...")
    batch_insert("object_index", ["id", "name", "difficulty", "numSlots", "craftable"], index_rows)

    print("Building object_data rows...")
    data_rows = []
    for obj_id in index["ids"]:
        file_path = os.path.join(OBJECTS_DIR, f"{obj_id}.json")
        with open(file_path) as f:
            raw = f.read()
        data_rows.append((str(obj_id), raw))
    print(f"Inserting {len(data_rows)} rows into object_data...")
    batch_insert("object_data", ["id", "json"], data_rows, batch_size=DATA_BATCH_SIZE)

    print("Building categories rows...")
    cat_rows = []
    for key, val in index.get("filters", {}).items():
        cat_rows.append(
            (
                str(val["key"]),
                str(val["name"]),
                json.dumps(val.get("ids", [])),
            )
        )
    print(f"Inserting {len(cat_rows)} rows into categories...")
    batch_insert("categories", ["key", "name", "ids"], cat_rows)

    print("Done!")


if __name__ == "__main__":
    main()
