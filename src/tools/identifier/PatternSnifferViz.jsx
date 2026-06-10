import React, { useState } from "react";

const ACCENT = "#ffcf4a";

/* Problem phrasing → the pattern(s) it almost always implies, plus the one-line why. */
const PHRASES = [
  {
    chip: "contiguous subarray",
    patterns: ["Sliding window", "Prefix sums"],
    why: "Contiguous means a moving [left, right] range — grow/shrink a window, or diff two prefix sums.",
  },
  {
    chip: "kth largest / smallest",
    patterns: ["Heap (size k)", "Quickselect"],
    why: "Keep a heap of size k for O(n log k), or quickselect for average O(n) without full sorting.",
  },
  {
    chip: "shortest path (unweighted)",
    patterns: ["BFS"],
    why: "Unweighted ⇒ every edge costs 1, so the first time BFS reaches a node it is via a shortest path.",
  },
  {
    chip: "all permutations / subsets / combinations",
    patterns: ["Backtracking", "Bitmask (subsets)"],
    why: "You must ENUMERATE the search space — recurse, choose/unchoose. n is tiny by necessity.",
  },
  {
    chip: "input is sorted",
    patterns: ["Two pointers", "Binary search"],
    why: "Sorted order is a gift: converge two pointers, or halve the range with binary search.",
  },
  {
    chip: "in-place / O(1) space",
    patterns: ["Two pointers", "Index encoding", "Cyclic sort"],
    why: "No extra array allowed — overwrite as you go, or stash state in the sign/value of slots.",
  },
  {
    chip: "number of ways / count paths",
    patterns: ["Dynamic programming", "Combinatorics"],
    why: "'How many ways' = sum over sub-results ⇒ a DP recurrence, or a closed-form count.",
  },
  {
    chip: "min / max so far",
    patterns: ["Greedy (running extreme)", "Monotonic stack"],
    why: "Track one running value (Kadane, best-buy-sell), or a monotonic stack for next-greater queries.",
  },
  {
    chip: "detect a cycle",
    patterns: ["Fast & slow pointers", "Union-Find / DFS colors"],
    why: "Linked list: Floyd's tortoise & hare. Graph: union-find on edges, or DFS with gray/black coloring.",
  },
  {
    chip: "ranges / intervals",
    patterns: ["Sort by endpoint", "Sweep line", "Greedy"],
    why: "Sort intervals, then sweep left→right merging or counting overlaps — order is everything.",
  },
  {
    chip: "prefix / suffix sums",
    patterns: ["Prefix sums", "Difference array"],
    why: "Precompute cumulative totals ⇒ any range sum in O(1); range UPDATES ⇒ difference array.",
  },
  {
    chip: "merge two sorted",
    patterns: ["Two pointers", "Heap (k-way)"],
    why: "Walk both with two pointers taking the smaller head; for k lists, a min-heap of heads.",
  },
];

export default function PatternSnifferViz() {
  const [active, setActive] = useState(PHRASES[0].chip);
  const sel = PHRASES.find((p) => p.chip === active);

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-3">
        click a phrase you spot in the prompt
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PHRASES.map((p) => {
          const on = p.chip === active;
          return (
            <button
              key={p.chip}
              onClick={() => setActive(p.chip)}
              className="font-mono text-xs px-2.5 py-1.5 rounded-full border transition-all select-none"
              style={
                on
                  ? { background: ACCENT, color: "#0c0e14", borderColor: ACCENT, fontWeight: 600 }
                  : { background: "transparent", color: "#9aa3b2", borderColor: "rgba(255,255,255,0.14)" }
              }
            >
              "{p.chip}"
            </button>
          );
        })}
      </div>

      <div
        className="rounded-lg p-4"
        style={{ background: "color-mix(in srgb,#ffcf4a 9%,#15171f)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="font-mono text-sm text-ink-faint">likely pattern →</span>
          {sel.patterns.map((pat) => (
            <code
              key={pat}
              className="font-mono text-sm font-bold px-2 py-0.5 rounded"
              style={{ color: ACCENT, background: "color-mix(in srgb,#ffcf4a 16%,transparent)" }}
            >
              {pat}
            </code>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-ink-dim">{sel.why}</p>
      </div>
    </div>
  );
}
