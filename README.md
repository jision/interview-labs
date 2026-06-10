# Interview Labs

Interactive data-structures & algorithms revision site. Four tools, one landing hub,
deployed as a single static site to GitHub Pages. Built with **Vite + React + Tailwind v4**.

The goal is to *grasp* concepts, not memorize them: every structure gets a live
visualization, its real Python internals, a complexity table, and tips/gotchas.

## Status

| Tool | What it covers | State |
|------|----------------|-------|
| **DSA · LAB** | Animated data structures + Python internals | ✅ built |
| **Interview Bench** | The ~10 interview patterns + DP atlas | ✅ built |
| **The Identifier** | Recognizing which approach a problem wants | ✅ built |
| **The Staff Bench** | DS design, concurrency, trade-off judgment | ✅ built |

All four tools are built and interactive. Highlights:

- **DSA Lab** — Dynamic Array, Linked List, Stack & Queue, Hash Table, BST, Heap, **Trie**, **Graph** (BFS/DFS), each with a live visualizer + Python internals.
- **Interview Bench** — Two Pointers, Sliding Window, Fast/Slow, Binary Search, BFS/DFS, Backtracking, DP atlas, Greedy, Heap/Top-K, Monotonic Stack, Intervals. Interactive demos for sliding window, two pointers, binary search, and monotonic stack.
- **The Identifier** — an interactive Constraint Decoder (input size → target Big-O), Pattern Sniffer, Complexity Budget, a filterable Tricks Vault, and Disambiguation flashcards.
- **The Staff Bench** — interactive LRU Cache, Token-Bucket rate limiter, and a race-condition demo (with/without lock), plus trade-offs and back-of-envelope estimation.

Every tool reuses the same design system (`src/components/`), so they look and behave consistently.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173/interview-labs/
npm run build        # production build → dist/
npm run preview      # serve the production build at :4173
```

## Deploy to GitHub Pages

This repo deploys to **https://jision.github.io/interview-labs/**. The `base` in
`vite.config.js` is already set to `/interview-labs/` to match.

Every push to `main` triggers `.github/workflows/deploy.yml`, which builds and deploys
automatically. One-time setup on GitHub: **Settings → Pages → Build and deployment →
Source → "GitHub Actions"**.

> If you ever rename the repo, update `base: "/<repo>/"` in `vite.config.js` to match,
> or assets will 404.

Routing uses `HashRouter`, so refreshing a deep link (e.g. `…/#/dsa-lab`) never 404s on Pages.

## Project layout

```
src/
├─ index.css              # design tokens (@theme) — colors, fonts, one source of truth
├─ App.jsx                # HashRouter hub + the TOOLS registry
├─ components/
│  ├─ ui.jsx              # Card, SectionTitle, Callout, CodeBlock, ComplexityTag, Btn, Tag
│  ├─ layout.jsx         # shared content primitives: Lede, Try, Block, OpTable, withAccent
│  ├─ ToolShell.jsx       # standard tool layout (header + sidebar nav + BackLink)
│  └─ ComingSoon.jsx      # (unused now — kept for future tools)
└─ tools/
   ├─ DsaLab.jsx          # topic registry + content; visualizers in dsa/
   │  └─ dsa/             DynamicArray, LinkedList, StackQueue, HashTable, BST, Heap, Trie, Graph
   ├─ InterviewBench.jsx  # visualizers in interview/  (SlidingWindow, TwoPointers, BinarySearch, MonotonicStack)
   ├─ Identifier.jsx      # widgets in identifier/    (ConstraintDecoder, PatternSniffer, TricksVault, Disambiguation)
   └─ StaffBench.jsx      # widgets in staff/         (LruCache, TokenBucket, RaceCondition, Estimator, Trie)
```

Every tool follows the same shape: a `TOPICS` array, a `CONTENT` map of topic → content
component, and `withAccent(ACCENT)` to bind the tool's color to `Block`/`Try`.

## Extending it

**Add a structure to DSA Lab:**
1. Build a visualizer in `src/tools/dsa/MyViz.jsx` (use `Btn` from `ui.jsx` for controls).
2. In `DsaLab.jsx`: add a `TOPICS` entry, write a content component
   (`<Lede>` → `<Try>` → `<Block>`s with `CodeBlock`/`OpTable`/`Callout`), and register it in `CONTENT`.

**Add a topic to any tool:** add a `TOPICS` entry, write its content component, and register
it in that tool's `CONTENT` map — same pattern in all four files.

**Change the look:** edit the tokens in `src/index.css` (`@theme { … }`). Colors, fonts,
and surfaces flow through every component from there.

> `deploy.md` is the original step-by-step deploy walkthrough, kept for reference.
> This README reflects what's actually in the repo.
