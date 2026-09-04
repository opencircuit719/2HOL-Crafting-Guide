# 2HOL Crafting Workflows — Development Plan

## Executive Summary

Build a modern, interactive crafting workflow visualizer for **Two Hours One Life (2HOL)** that improves upon the existing [twotech.twohoursonelife.com](https://twotech.twohoursonelife.com) by providing:

- **Zoomable/pannable workflow graphs** showing the full dependency tree from raw resources to final item
- **Clear visual distinction** between actions (hand use, ground placement, machine interaction, timed decay)
- **Modern Web2.0 UX** with search, filters, permalink sharing, and responsive design
- **Easy maintainability** via automated data pipeline from the official game data repo

---

## Research Findings

### Data Sources (All Public & Free)

| Source | URL | Content |
|--------|-----|---------|
| Object index | `https://twotech.twohoursonelife.com/static/objects.json` | 9,871 objects with IDs, names, difficulty, craftable flags, filters |
| Individual object | `https://twotech.twohoursonelife.com/static/objects/{id}.json` | Transitions, recipes (step arrays), tech trees, metadata |
| Item sprites | `https://twotech.twohoursonelife.com/static/sprites/obj_{id}.png` | 128x128-ish PNGs |
| Used/last sprites | `https://twotech.twohoursonelife.com/static/sprites/obj_{id}_last.png` | Alternative state sprites |
| Raw game data | `https://github.com/twohoursonelife/OneLifeData7` | objects/, transitions/, sprites/ directories |

### Data Model

Each object has:
- `transitionsToward[]` — how to create this item (actor + target → result)
- `transitionsAway[]` — what this item can be used for
- `transitionsTimed[]` — auto-decay transitions
- `recipe.steps[][]` — pre-computed dependency steps with depth, count, sub-steps
- `techTree[]` — hierarchical tree of prerequisites

**Recipe Steps Format:**
- Array of "layers" (steps at the same depth can be done in parallel)
- Each step has: `id`, `depth`, `actorID`, `targetID`, `hand` (empty hand), `decay` (timed), `tool`, `count`
- Sub-steps exist for complex dependencies (e.g., making a component that itself has components)

### Existing Site Weaknesses to Exploit

1. **No zoom/pan** — large recipes (200+ steps) become an unreadable vertical scroll
2. **Linear step list** — parallelizable steps are shown sequentially, hiding workflow efficiency
3. **No visual graph** — dependencies are text-based, hard to see "what do I need first?"
4. **Cluttered UI** — dense tables, small text, no responsive mobile support
5. **No action semantics** — hard to distinguish "put on ground" vs "use on object" vs "wait for decay"

---

## Recommended Stack

### Frontend

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 15 (App Router)** | SSR for SEO, static export for cheap hosting, React ecosystem |
| Language | **TypeScript** | Type safety for complex graph data |
| Styling | **Tailwind CSS v4** | Rapid UI, consistent design system |
| Graph Rendering | **React Flow** or **Cytoscape.js** | Purpose-built for interactive node graphs, zoom/pan, custom nodes |
| State | **Zustand** | Lightweight, handles search/filter/graph state |
| Data Fetching | **SWR** or **TanStack Query** | Cache object JSONs client-side, reduce network load |
| Animation | **Framer Motion** | Smooth transitions, node entrance animations |
| Icons | **Lucide React** | Clean, consistent iconography |

**Graph Library Decision:**
- **React Flow** (recommended) — React-native, easy custom nodes, great zoom/pan, handles 500+ nodes well with virtualization
- **Cytoscape.js** — Better for 2000+ nodes, but harder to style custom nodes with React

### Data Pipeline

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Scraper | **Python + asyncio + aiohttp** | Fast concurrent fetching of 9,871 JSONs + images |
| Data Transform | **Python (Pydantic models)** | Validate, normalize, build adjacency lists for graph rendering |
| Storage | **SQLite** (dev) → **PostgreSQL** (prod) or **static JSON** | Start static; add DB if we need user features later |
| Build Step | **Next.js `generateStaticParams`** | Pre-render all object pages at build time for instant load |
| Image Pipeline | **Python PIL** + **Next.js Image Optimization** | Batch download sprites, generate WebP variants |

### Hosting

| Tier | Option | Cost |
|------|--------|------|
| Dev / MVP | **Vercel** (free tier) | $0 |
| Prod | **Vercel Pro** or **Cloudflare Pages** | $20/mo or $0 |
| API/Images (if needed) | **Cloudflare R2** | ~$5/mo for 10GB |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Search Page │  │ Object Page │  │ Workflow Graph View │  │
│  │  (static)   │  │  (static)   │  │   (client hydr.)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         └────────────────┴────────────────────┘              │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │  Zustand    │                            │
│                   │   Store     │                            │
│                   └──────┬──────┘                            │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │  SWR Cache  │                            │
│                   │ (obj JSONs) │                            │
│                   └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼──────┐   ┌───────▼──────┐
            │ Static JSON  │   │  Sprite CDN  │
            │   (Vercel)   │   │  (Vercel/   │
            │              │   │   Cloudflare)│
            └──────────────┘   └──────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Data Pipeline   │
                    │  (Python scripts) │
                    │                   │
                    │ 1. Scrape twotech │
                    │ 2. Build graphs   │
                    │ 3. Generate static│
                    └───────────────────┘
```

---

## Development Phases

### Phase 1: Foundation & Data (Week 1)
- Set up Next.js 15 + TypeScript + Tailwind project
- Build Python scraper: download `objects.json`, all `objects/{id}.json`, all `obj_{id}.png`
- Transform scraped data into graph-friendly adjacency format
- Set up static JSON asset pipeline (commit processed data to repo or host separately)

### Phase 2: Core UI (Week 2)
- Search page with autocomplete (search 9,871 object names)
- Object detail page (basic info, transitions list)
- Integrate React Flow for graph visualization
- Build custom node components: ItemNode, ActionNode, DecayNode

### Phase 3: Workflow Visualization (Week 3)
- Parse recipe steps into directed acyclic graph (DAG)
- Render full workflow graph with zoom/pan/mini-map
- Handle sub-steps (nested recipes) via expand/collapse or drill-down
- Add filters: hide tools, hide natural resources, show only main branch

### Phase 4: Polish & Interaction (Week 4)
- Click any node to "re-root" the graph (show how to make that item)
- Add color coding: natural (green), crafted (blue), tool (orange), decay (purple)
- Mobile responsive layout
- Keyboard shortcuts (Ctrl+K search, +/- zoom)
- SEO: meta tags, Open Graph images, sitemap

### Phase 5: Data Freshness & Automation (Week 5)
- GitHub Action to re-scrape data weekly
- Diff detection: alert when new game version changes recipes
- Version selector (browse by game version)

---

## Key Technical Challenges

1. **Graph Layout for 200+ Step Recipes**
   - Use **layered graph layout** (Sugiyama) via React Flow's `dagre` integration
   - Group parallel steps into "swimlanes"
   - Virtualize off-screen nodes for performance

2. **Data Freshness**
   - 2HOL updates frequently. The scraper needs to be re-runnable.
   - Store data version hash; only rebuild changed objects.

3. **Image Licensing**
   - Game is open source (GPL). Sprites are part of the game data.
   - Safe to redistribute with attribution.

4. **Client-Side Performance**
   - Don't load all 9,871 object JSONs upfront.
   - Load object detail + recipe on-demand via SWR.
   - Pre-compute graph layout server-side to avoid client-side DAG layout jank.

---

## File Structure

```
2hol-crafting-workflows/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Search home
│   ├── [id]/page.tsx             # Object detail
│   ├── [id]/workflow/page.tsx    # Full workflow graph
│   └── layout.tsx
├── components/
│   ├── graph/
│   │   ├── WorkflowGraph.tsx     # React Flow canvas
│   │   ├── ItemNode.tsx          # Object sprite + name
│   │   ├── ActionNode.tsx        # Hand / tool / combine icon
│   │   └── DecayNode.tsx         # Clock icon + time
│   ├── search/
│   │   └── ObjectSearch.tsx
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── data/
│   │   ├── objects.json          # Index (9,871 entries)
│   │   └── objects/              # Individual JSONs
│   ├── graph-builder.ts          # Recipe → React Flow nodes/edges
│   └── api.ts                    # Data fetching helpers
├── scripts/
│   ├── scrape.py                 # Download from twotech
│   ├── build-graphs.py           # Pre-compute layouts
│   └── download-sprites.py       # Batch image fetch
├── public/
│   └── sprites/                  # obj_*.png files
├── next.config.js
└── package.json
```

---

## Token Cost Estimates

### Assumptions
- **Kimi-k2.6** (current): ~$3 per 1M input tokens, ~$6 per 1M output tokens
- **Kimi-k3** (future): Estimated ~$6 per 1M input tokens, ~$15 per 1M output tokens (based on typical "pro" model pricing; actual may vary)
- Average turn: 8k input + 2k output
- Coding tasks average 15-25 turns per feature

### Phase Breakdown

| Phase | Complexity | Est. Turns | k2.6 Cost | k3 Cost |
|-------|-----------|------------|-----------|---------|
| Phase 1: Foundation + Scraper | Medium | 30 turns | ~$0.50 | ~$1.20 |
| Phase 2: Core UI + Search | Medium | 40 turns | ~$0.70 | ~$1.60 |
| Phase 3: Graph Visualization | **High** | 80-120 turns | ~$1.50 | ~$3.50 |
| Phase 4: Polish + Mobile | Medium | 50 turns | ~$0.80 | ~$1.80 |
| Phase 5: Automation | Low | 20 turns | ~$0.30 | ~$0.70 |
| **Bug Fixes & Iteration** | — | +40% buffer | +$2.00 | +$4.00 |
| **TOTAL** | | | **~$6-8** | **~$13-18** |

### Cost Drivers
- **Phase 3 (Graph Viz)** will consume the most tokens. DAG layout algorithms, React Flow edge cases, and performance tuning for large recipes require many iteration loops.
- **Image handling** (sprite display, WebP conversion) is straightforward and low-token.
- **Data scraping** is mostly Python scripting — low token cost, mostly deterministic.

### Recommendation
- Use **Kimi-k2.6** for Phases 1, 2, and 5 (scaffolding, UI, automation)
- Use **Kimi-k3** for Phase 3 (complex graph algorithms, React Flow optimization) and tricky Phase 4 bugs
- This hybrid approach keeps total cost under **$10** while leveraging the stronger model where it matters most.

---

## Competitive Advantages Over Twotech

| Feature | Twotech | 2HOL Crafting Workflows |
|---------|---------|------------------------|
| Workflow view | Linear step list | **Interactive zoomable graph** |
| Parallel steps | Shown sequentially | **Grouped in swimlanes** |
| Mobile UX | Desktop-only | **Fully responsive** |
| Action clarity | Text-only | **Visual icons + color coding** |
| Search | Basic text | **Fuzzy + category filters** |
| Deep linking | Object pages only | **Any node can be re-rooted** |
| Performance | Loads all data | **On-demand + static pre-render** |

---

## Next Steps

1. **Approve stack** — confirm Next.js + React Flow + Python scraper
2. **Initialize repo** — scaffold Next.js 15 project with TypeScript
3. **Build scraper** — download all 9,871 objects + sprites (~30 min runtime)
4. **First milestone** — Searchable object list with detail pages
5. **Second milestone** — Single-item workflow graph rendering
6. **Third milestone** — Full feature parity + UX polish
