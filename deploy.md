# Deploying the 4 DSA tools to GitHub Pages

Your four artifact files are **React (JSX)** and the browser can't run them directly,
they must be **compiled to static HTML/CSS/JS** first. This guide wraps all four in one
small **Vite + React** site (a landing page that links to each tool) and deploys it to
GitHub Pages. **You don't need to edit the four files**, they're imported as-is.

There's a **ready-to-paste Claude Code prompt at the bottom** if you'd rather have it do
everything.

---

## What you need first

- **Node.js 18+** (check: `node -v`). Get it from nodejs.org if missing.
- **Git** + a **GitHub account**.
- Your four files:
  - `dsa-lab.jsx`
  - `dsa-interview-prep.jsx`
  - `dsa-identifier.jsx`
  - `dsa-staff-bench.jsx`

---

## Step 1, Scaffold the project

```bash
npm create vite@latest dsa-study-lab -- --template react
cd dsa-study-lab
npm install
npm install react-router-dom
```

> The `gh-pages` package is only needed for the *alternative* deploy method (Step 6B).
> The recommended method (6A, GitHub Actions) doesn't need it.

## Step 2, Add your four tools

Create a folder `src/tools/` and save the four files there with these names
(rename them, it keeps the imports clean):

| Your file                | Save as                       |
|--------------------------|-------------------------------|
| `dsa-lab.jsx`            | `src/tools/DsaLab.jsx`        |
| `dsa-interview-prep.jsx` | `src/tools/InterviewBench.jsx`|
| `dsa-identifier.jsx`     | `src/tools/Identifier.jsx`    |
| `dsa-staff-bench.jsx`    | `src/tools/StaffBench.jsx`    |

> Imports on the GitHub Actions runner (Linux) are **case-sensitive**, match the
> capitalization above exactly.

## Step 3, Replace `src/App.jsx` with the landing hub

Overwrite `src/App.jsx` with this. It shows a landing page and routes to each tool.
It uses `HashRouter`, so refreshing a tool page never 404s on GitHub Pages.

```jsx
import React from "react";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import DsaLab from "./tools/DsaLab.jsx";
import InterviewBench from "./tools/InterviewBench.jsx";
import Identifier from "./tools/Identifier.jsx";
import StaffBench from "./tools/StaffBench.jsx";

const TOOLS = [
  { path: "dsa-lab",         name: "DSA·LAB",         tag: "Structures · the WHAT",        desc: "Animated data structures with Python internals.",            accent: "#38e0d6", Comp: DsaLab },
  { path: "interview-bench", name: "Interview Bench", tag: "Patterns · the HOW",           desc: "The ~10 interview patterns, templates, and DP atlas.",       accent: "#e8553b", Comp: InterviewBench },
  { path: "identifier",      name: "The Identifier",  tag: "Recognition · WHICH & WHEN",   desc: "Constraint decoder, pattern sniffer, and the tricks vault.", accent: "#ffcf4a", Comp: Identifier },
  { path: "staff-bench",     name: "The Staff Bench", tag: "Judgment · SHOULD WE",         desc: "DS design, concurrency, and trade-off articulation.",        accent: "#d6a94c", Comp: StaffBench },
];

function BackLink() {
  return (
    <Link to="/" style={{
      position: "fixed", top: 14, right: 16, zIndex: 9999,
      fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 600,
      color: "#fff", background: "rgba(18,20,28,0.85)", backdropFilter: "blur(6px)",
      border: "1px solid rgba(255,255,255,0.28)", borderRadius: 6,
      padding: "8px 12px", textDecoration: "none",
    }}>← all tools</Link>
  );
}

function Landing() {
  return (
    <div style={{ minHeight: "100vh", background: "#0c0e14", color: "#eef1f7",
      fontFamily: "system-ui, -apple-system, sans-serif", padding: "64px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: 2,
          textTransform: "uppercase", color: "#8b97a7", marginBottom: 12 }}>
          Interactive DSA · interview prep
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, margin: "0 0 14px", letterSpacing: -1.2 }}>
          DSA Study Lab
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "#a8a097", maxWidth: 640, marginBottom: 44 }}>
          Four interactive tools covering the full interview surface, from the data structures
          themselves up to the staff-level judgment rounds.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
          {TOOLS.map((t) => (
            <Link key={t.path} to={`/${t.path}`} style={{
              textDecoration: "none", display: "block", background: "#15171f",
              border: "1px solid rgba(255,255,255,0.08)", borderTop: `3px solid ${t.accent}`,
              borderRadius: 10, padding: "22px 24px", transition: "transform .15s, border-color .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: 1,
                textTransform: "uppercase", color: t.accent, marginBottom: 8 }}>{t.tag}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{t.name}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "#a8a097" }}>{t.desc}</div>
            </Link>
          ))}
        </div>
        <div style={{ marginTop: 48, fontSize: 13, color: "#5f6875" }}>Built with React + Vite.</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        {TOOLS.map((t) => {
          const Comp = t.Comp;
          return (
            <Route key={t.path} path={`/${t.path}`} element={<><BackLink /><Comp /></>} />
          );
        })}
      </Routes>
    </HashRouter>
  );
}
```

> `src/main.jsx` from the Vite template already renders `<App />`, leave it alone.

## Step 4, Set the base path in `vite.config.js`

**This is the #1 thing people get wrong.** Replace `vite.config.js` with this and set
the repo name (keep the leading and trailing slashes):

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // For a project site at https://USERNAME.github.io/REPO/  → use "/REPO/"
  // For a user site   at https://USERNAME.github.io/        → use "/"
  base: "/dsa-study-lab/",
  plugins: [react()],
});
```

## Step 5, Test locally, then push to GitHub

```bash
npm run dev                       # open the printed localhost URL, click through all 4 tools
npm run build && npm run preview  # verify the PRODUCTION build (served at localhost:4173)
```

Create an **empty** repo on GitHub named exactly to match your `base`
(e.g. `dsa-study-lab`), then:

```bash
git init
git add .
git commit -m "DSA study lab"
git branch -M main
git remote add origin https://github.com/USERNAME/dsa-study-lab.git
git push -u origin main
```

---

## Step 6A, Deploy via GitHub Actions  ★ recommended (official Vite method)

1. On GitHub: **Settings → Pages → Build and deployment → Source → "GitHub Actions"**.
2. Create `.github/workflows/deploy.yml` with the official Vite workflow below, commit, and push.
   Every push to `main` then rebuilds and redeploys automatically.

```yaml
# Simple workflow for deploying static content to GitHub Pages
name: Deploy static content to Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6
      - name: Set up Node
        uses: actions/setup-node@v6
        with:
          node-version: lts/*
          cache: "npm"
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v6
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: "./dist"
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

```bash
git add .
git commit -m "Add Pages deploy workflow"
git push
```

Watch the **Actions** tab. When it's green, your site is live at:

```
https://USERNAME.github.io/dsa-study-lab/
```

---

## Step 6B, Deploy via the `gh-pages` package  (simpler one-off alternative)

If you'd rather just run one command instead of using Actions:

```bash
npm install --save-dev gh-pages
```

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

Then:

```bash
npm run deploy
```

This builds and pushes `dist/` to a `gh-pages` branch. Finally, on GitHub:
**Settings → Pages → Source → "Deploy from a branch" → branch `gh-pages` / `(root)`**.
Re-run `npm run deploy` anytime you change something.

> Use **either** 6A **or** 6B, not both.

---

## Troubleshooting

- **Blank page / assets 404 / MIME errors** → `base` in `vite.config.js` doesn't match your
  repo name. It must be `"/REPO/"` with both slashes.
- **404 when refreshing a tool page** → you're not using `HashRouter`. The hub above uses it,
  so this shouldn't happen. (URLs look like `…/dsa-study-lab/#/identifier`.)
- **Build fails on "Cannot find module ./tools/DsaLab.jsx"** → filename case mismatch. Linux CI
  is case-sensitive; match Step 2 exactly.
- **Fonts look generic on the live site** → the tools load Google Fonts over the network; just
  needs internet. If you want them bundled/offline, that's a separate change.
- **Site doesn't update after a push (6A)** → check the **Actions** tab for a failed run; hard-refresh
  (Cmd/Ctrl-Shift-R) to bypass cache.

---

## Hand this to Claude Code

> I have four React artifact files (`dsa-lab.jsx`, `dsa-interview-prep.jsx`,
> `dsa-identifier.jsx`, `dsa-staff-bench.jsx`) in this folder. Each is a self-contained
> component with a `export default function App()` and uses only React + inline styles
> (no external libraries, no Tailwind, no browser storage). I want to deploy all four to
> GitHub Pages as one site with a landing page that links to each tool.
>
> Please:
> 1. Scaffold a Vite React app (`npm create vite@latest . -- --template react` in a new
>    subfolder, or set one up here) and `npm install react-router-dom`.
> 2. Move my four files into `src/tools/` renamed to `DsaLab.jsx`, `InterviewBench.jsx`,
>    `Identifier.jsx`, and `StaffBench.jsx` (match case exactly). Don't modify their contents.
> 3. Replace `src/App.jsx` with a `HashRouter` hub: a dark landing page with one card per
>    tool linking to `#/dsa-lab`, `#/interview-bench`, `#/identifier`, `#/staff-bench`, and a
>    fixed "← all tools" link on each tool route. (Use the accent colors #38e0d6, #e8553b,
>    #ffcf4a, #d6a94c respectively.)
> 4. Set `base: "/REPO_NAME/"` in `vite.config.js`, ask me for the exact repo name.
> 5. Run `npm run build` and fix any errors until it builds clean.
> 6. Add the official Vite GitHub Pages workflow at `.github/workflows/deploy.yml`
>    (checkout@v6, setup-node@v6 with node lts/*, configure-pages@v6,
>    upload-pages-artifact@v5 uploading `./dist`, deploy-pages@v5; triggers on push to main).
> 7. Initialize git, commit, and give me the exact `git remote add` + `git push` commands to
>    run, plus a reminder to set Settings → Pages → Source → GitHub Actions.
>
> Verify the production build locally with `npm run preview` before finishing.
