# 2HOL Crafting Guide

A modern, community-enhanced crafting reference for [Two Hours One Life](https://twohoursonelife.com/).

> **Note:** This project is a friendly fork inspired by the original [twotech](https://github.com/twohoursonelife/twotech) crafting guide by the Two Hours One Life team. We are deeply grateful for their foundational work and the game data pipeline they built.

## Live Demo

**https://demo.twotech.workers.dev**

*(Domain will be updated to `2hol.guide` shortly)*

## What is this?

An interactive crafting guide for Two Hours One Life, rebuilt with modern web technologies to improve performance, search, and user experience.

## Key Features

- **"How to Make" / "How to Use" tabs** — Every item page shows both crafting instructions and everything that item can be used for
- **Station upgrade toggles** — Prefer Blast Furnace over Adobe Forge? Toggle your available stations and the recipe steps update automatically
- **Tool indicators on recipe steps** — See exactly which tool (stone, sharp stone, etc.) is needed for each step
- **Full search results page** — Search and hit Enter for a dedicated page with every matching item, not just the top 10
- **Interactive recipe graph** — Visual flowchart of crafting paths using ReactFlow
- **CRAFT IT guide** — Step-by-step crafting assistant with phase tracking and localStorage persistence
- **Light & dark mode** — Automatic theme switching
- **~9,871 items** — Complete object database with spawn chances, biomes, and categories

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) |
| Graph | [ReactFlow](https://reactflow.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Deployment | [Cloudflare Workers](https://workers.cloudflare.com/) via [@opennextjs/cloudflare](https://github.com/opennextjs/opennextjs-cloudflare) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) |

## Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open http://localhost:3456

### Build for production

```bash
npx opennextjs-cloudflare build
```

### Deploy

```bash
npx opennextjs-cloudflare deploy
```

## Contributing

We welcome issues and pull requests. A few guidelines:

- Open an issue before major changes
- Keep PRs focused and small when possible
- Follow the existing code style
- Test your changes locally with `npm run dev`

## Attribution

- **Original project:** [twotech](https://github.com/twohoursonelife/twotech) by the [Two Hours One Life](https://twohoursonelife.com/) team
- **Game data:** Two Hours One Life / One Life Data 7
- **This fork:** [opencircuit719](https://github.com/opencircuit719)

## License

MIT — see [LICENSE](./LICENSE)
