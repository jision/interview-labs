import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * UnionFindViz, an 8-node disjoint-set (DSU) playground.
 * union(a, b) merges two sets with union-by-size; find(x) walks x to its
 * root and applies full path compression, so you watch the parent pointers
 * snap straight to the root. Nodes are colored by their component root, and
 * the component count updates live. Correct DSU: near O(1) amortized.
 */
const ACCENT = "#34A853";
const N = 8;

/* one color per component root, so nodes in the same set share a color */
const PALETTE = [
  "#34A853", // green
  "#4285F4", // blue
  "#EA4335", // red
  "#FBBC04", // yellow
  "#A142F4", // purple
  "#24C1E0", // cyan
  "#FF6D01", // orange
  "#F538A0", // pink
];

/* pure find, no mutation, used only to color nodes and count components */
function rootOf(parent, x) {
  let cur = x;
  while (parent[cur] !== cur) cur = parent[cur];
  return cur;
}

/* find WITH full path compression: returns the root, a fresh parent array
   with every node on the path repointed straight at the root, and the path */
function findCompress(parent, x) {
  const p = parent.slice();
  const path = [];
  let cur = x;
  while (p[cur] !== cur) {
    path.push(cur);
    cur = p[cur];
  }
  const root = cur;
  for (const node of path) p[node] = root; // compress every node to the root
  return { root, parent: p, path: [...path, root] };
}

/* union by size on top of path-compressing finds */
function unionSets(parent, size, a, b) {
  let res = findCompress(parent, a);
  let ra = res.root;
  let p = res.parent;
  res = findCompress(p, b);
  const rb0 = res.root;
  p = res.parent;
  const s = size.slice();

  if (ra === rb0) return { parent: p, size: s, merged: false, root: ra };

  let hi = ra;
  let lo = rb0;
  if (s[hi] < s[lo]) [hi, lo] = [lo, hi]; // attach the smaller tree under the larger
  p[lo] = hi;
  s[hi] += s[lo];
  return { parent: p, size: s, merged: true, root: hi };
}

function Selector({ label, value, onChange }) {
  return (
    <label className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-surface-2 border border-line-strong rounded-md px-2 py-1 font-mono text-[12px] text-ink"
      >
        {Array.from({ length: N }, (_, i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function UnionFindViz() {
  const [parent, setParent] = useState(() => Array.from({ length: N }, (_, i) => i));
  const [size, setSize] = useState(() => Array(N).fill(1));
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const [x, setX] = useState(0);
  const [highlight, setHighlight] = useState({ path: [], root: null });
  const [note, setNote] = useState(
    "Every node is its own set, 8 components. Union a few, then run find to watch path compression flatten the tree."
  );

  function doUnion() {
    if (a === b) {
      setNote("Pick two different nodes to union.");
      return;
    }
    const res = unionSets(parent, size, a, b);
    setParent(res.parent);
    setSize(res.size);
    setHighlight({ path: [], root: null });
    if (!res.merged) {
      setNote(
        `${a} and ${b} are already in the same set. In an undirected graph this edge would close a cycle, and DSU catches it in near O(1), no re-traversal.`
      );
    } else {
      setNote(
        `union(${a}, ${b}): the smaller-or-equal tree was attached under root ${res.root} (union by size, ties broken toward a), keeping the tree shallow.`
      );
    }
  }

  function doFind() {
    const res = findCompress(parent, x);
    setParent(res.parent);
    setHighlight({ path: res.path, root: res.root });
    const walked = res.path.length > 1 ? res.path.join(" -> ") : `${x}`;
    setNote(
      `find(${x}) walked ${walked} and compressed the path: every node on it now points straight at root ${res.root}, so the next find is O(1).`
    );
  }

  function reset() {
    setParent(Array.from({ length: N }, (_, i) => i));
    setSize(Array(N).fill(1));
    setHighlight({ path: [], root: null });
    setNote("Reset. 8 singleton sets, 8 components.");
  }

  const roots = new Set();
  for (let i = 0; i < N; i++) roots.add(rootOf(parent, i));
  const componentCount = roots.size;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Selector label="a" value={a} onChange={setA} />
          <Selector label="b" value={b} onChange={setB} />
          <Btn tone={ACCENT} onClick={doUnion}>
            union(a, b)
          </Btn>
        </div>
        <div className="flex items-center gap-2">
          <Selector label="x" value={x} onChange={setX} />
          <Btn tone={ACCENT} variant="ghost" onClick={doFind}>
            find(x)
          </Btn>
        </div>
        <Btn variant="ghost" onClick={reset}>
          reset
        </Btn>
      </div>

      {/* component count */}
      <div className="flex justify-between font-mono text-[11px] mb-2">
        <span className="text-ink-dim">components</span>
        <span style={{ color: ACCENT }}>
          {componentCount} / {N}
        </span>
      </div>

      {/* nodes */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Array.from({ length: N }, (_, i) => {
          const r = rootOf(parent, i);
          const color = PALETTE[r % PALETTE.length];
          const isRoot = parent[i] === i;
          const onPath = highlight.path.includes(i);
          const isHiRoot = highlight.root === i;
          return (
            <div
              key={i}
              className="w-16 rounded-lg border p-2 text-center transition-all"
              style={{
                borderColor: color,
                background: "color-mix(in srgb, " + color + " 12%, transparent)",
                boxShadow: onPath || isHiRoot ? `0 0 0 2px ${ACCENT}` : "none",
              }}
            >
              <div className="text-lg font-bold leading-none text-ink">{i}</div>
              <div className="font-mono text-[10px] mt-1" style={{ color }}>
                {isRoot ? (isHiRoot ? "root ★" : "root") : `-> ${parent[i]}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* internal state readout */}
      <div className="rounded-lg border border-line bg-surface-2 p-2.5 mb-3 font-mono text-[10px] leading-relaxed overflow-x-auto">
        <div className="text-ink-dim whitespace-nowrap">
          parent = [{parent.join(", ")}]
        </div>
        <div className="text-ink-faint whitespace-nowrap">
          size&nbsp;&nbsp; = [{size.join(", ")}]
        </div>
      </div>

      <div className="font-mono text-[11px] text-ink-faint leading-relaxed">{note}</div>
    </div>
  );
}
