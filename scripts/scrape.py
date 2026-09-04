#!/usr/bin/env python3
"""
2HOL Crafting Workflows - Data Scraper

Downloads all object data and sprites from twotech.twohoursonelife.com.
Data is open source (GPL) via the Two Hours One Life project.

Usage:
    python scripts/scrape.py           # Download everything
    python scripts/scrape.py --json    # Download only JSON data
    python scripts/scrape.py --sprites # Download only sprites
    python scripts/scrape.py --quick   # Skip existing files (resume mode)
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

import aiohttp

BASE_URL = "https://twotech.twohoursonelife.com/static"
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "src" / "lib" / "data"
SPRITES_DIR = PROJECT_ROOT / "public" / "sprites"

# Concurrency limits to be respectful to the server
JSON_CONCURRENCY = 20
SPRITE_CONCURRENCY = 30


def ensure_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "objects").mkdir(parents=True, exist_ok=True)
    SPRITES_DIR.mkdir(parents=True, exist_ok=True)


async def fetch_json(session: aiohttp.ClientSession, url: str) -> dict | None:
    try:
        async with session.get(url) as resp:
            if resp.status == 200:
                return await resp.json()
            return None
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None


async def fetch_binary(session: aiohttp.ClientSession, url: str) -> bytes | None:
    try:
        async with session.get(url) as resp:
            if resp.status == 200:
                return await resp.read()
            return None
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None


async def download_object_json(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
    obj_id: str,
    skip_existing: bool,
) -> bool:
    dest = DATA_DIR / "objects" / f"{obj_id}.json"
    if skip_existing and dest.exists():
        return True

    async with sem:
        data = await fetch_json(session, f"{BASE_URL}/objects/{obj_id}.json")
        if data is None:
            print(f"  [FAIL] objects/{obj_id}.json")
            return False
        dest.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
        return True


async def download_sprite(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
    obj_id: str,
    suffix: str,
    skip_existing: bool,
) -> bool:
    filename = f"obj_{obj_id}{suffix}.png"
    dest = SPRITES_DIR / filename
    if skip_existing and dest.exists():
        return True

    async with sem:
        data = await fetch_binary(session, f"{BASE_URL}/sprites/{filename}")
        if data is None:
            return False
        dest.write_bytes(data)
        return True


async def download_all_jsons(
    session: aiohttp.ClientSession,
    obj_ids: list[str],
    skip_existing: bool,
) -> tuple[int, int]:
    sem = asyncio.Semaphore(JSON_CONCURRENCY)
    tasks = [
        download_object_json(session, sem, obj_id, skip_existing)
        for obj_id in obj_ids
    ]
    results = await asyncio.gather(*tasks)
    success = sum(results)
    return success, len(results) - success


async def download_all_sprites(
    session: aiohttp.ClientSession,
    obj_ids: list[str],
    skip_existing: bool,
) -> tuple[int, int, int]:
    sem = asyncio.Semaphore(SPRITE_CONCURRENCY)
    tasks = []
    for obj_id in obj_ids:
        tasks.append(download_sprite(session, sem, obj_id, "", skip_existing))
        tasks.append(download_sprite(session, sem, obj_id, "_last", skip_existing))

    results = await asyncio.gather(*tasks)
    success = sum(results)
    failed = len(results) - success
    # Many "_last" sprites don't exist, so filter out expected 404s
    return success, failed, len(tasks)


async def main():
    parser = argparse.ArgumentParser(description="Scrape 2HOL crafting data")
    parser.add_argument("--json", action="store_true", help="Download only JSON data")
    parser.add_argument("--sprites", action="store_true", help="Download only sprites")
    parser.add_argument("--quick", action="store_true", help="Skip existing files")
    args = parser.parse_args()

    do_json = not args.sprites or args.json
    do_sprites = not args.json or args.sprites
    skip_existing = args.quick

    ensure_dirs()

    # Step 1: Download objects.json (the index)
    print("=" * 60)
    print("2HOL Crafting Workflows - Data Scraper")
    print("=" * 60)

    index_path = DATA_DIR / "objects.json"
    if not skip_existing or not index_path.exists():
        print("\n[1/3] Downloading objects.json (index)...")
        async with aiohttp.ClientSession() as session:
            data = await fetch_json(session, f"{BASE_URL}/objects.json")
            if data is None:
                print("Failed to download objects.json. Aborting.")
                sys.exit(1)
            index_path.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
            print(f"  Saved {index_path}")
    else:
        print("\n[1/3] objects.json already exists, loading...")
        data = json.loads(index_path.read_text(encoding="utf-8"))

    obj_ids = data.get("ids", [])
    print(f"  Total objects in index: {len(obj_ids)}")

    async with aiohttp.ClientSession() as session:
        if do_json:
            print("\n[2/3] Downloading individual object JSONs...")
            success, failed = await download_all_jsons(session, obj_ids, skip_existing)
            print(f"  Success: {success}, Failed: {failed}")

        if do_sprites:
            print("\n[3/3] Downloading sprites...")
            success, failed, total = await download_all_sprites(
                session, obj_ids, skip_existing
            )
            print(f"  Success: {success}, Failed: {failed} (many _last variants don't exist)")
            print(f"  Total requests: {total}")

    print("\n" + "=" * 60)
    print("Scraping complete!")
    print(f"Data directory:  {DATA_DIR}")
    print(f"Sprite directory: {SPRITES_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
