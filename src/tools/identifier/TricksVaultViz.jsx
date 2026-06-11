import React, { useState } from "react";

const ACCENT = "#ffcf4a";

const CATS = ["All", "Arrays", "Lists", "Hashing", "Heap", "Math/Bits", "Graph", "DP", "Strings"];

/* High-leverage tricks. tell = the signal that should make you reach for it. */
const TRICKS = [
  {
    name: "Prefix sums",
    cat: "Arrays",
    tell: "Many range-sum / range-average queries over a fixed array.",
    how: "1-indexed: pre[i] = pre[i-1] + a[i]; any range sum = pre[r] − pre[l-1] in O(1).",
  },
  {
    name: "Difference array",
    cat: "Arrays",
    tell: "Many range UPDATES (add x to [l, r]), one final read.",
    how: "diff[l] += x; diff[r+1] −= x; prefix-sum diff once at the end → O(1) per update.",
  },
  {
    name: "Hash for O(1) lookup",
    cat: "Hashing",
    tell: "'Have I seen…?', complements (two-sum), dedup, counting.",
    how: "Trade O(n) space for O(1) membership — collapses an O(n²) nested scan to O(n).",
  },
  {
    name: "Coordinate compression",
    cat: "Hashing",
    tell: "Values are huge / sparse but only their RELATIVE order matters.",
    how: "Sort the distinct values, map each to its rank → indices fit in a small array / BIT.",
  },
  {
    name: "Two heaps (running median)",
    cat: "Heap",
    tell: "Median or balanced split of a STREAM you can't re-sort.",
    how: "Max-heap of the lower half + min-heap of the upper half, kept balanced → median in O(1).",
  },
  {
    name: "Monotonic deque / stack",
    cat: "Arrays",
    tell: "Sliding-window max/min, or 'next greater/smaller element'.",
    how: "Maintain a deque whose values stay monotonic; pop from the back before pushing → O(n) total.",
  },
  {
    name: "Union-Find (DSU)",
    cat: "Graph",
    tell: "Connectivity / grouping / cycle detection on an undirected graph.",
    how: "find + union with path compression & rank → ~O(α(n)) ≈ O(1) amortized per query.",
  },
  {
    name: "Binary lifting",
    cat: "Graph",
    tell: "Repeated 'k-th ancestor' or LCA queries on a static tree.",
    how: "Precompute up[v][2^j] ancestors; jump in O(log n) by decomposing k into bits.",
  },
  {
    name: "Bitmask state",
    cat: "DP",
    tell: "Subset / visited-set is part of the DP state and n ≤ ~20.",
    how: "Encode the chosen set as an int; dp[mask] iterates 2^n states (TSP, assignment).",
  },
  {
    name: "Sentinel / dummy node",
    cat: "Lists",
    tell: "Linked-list edits where the head/tail might change.",
    how: "dummy = Node(0); dummy.next = head; return dummy.next — kills head-deletion edge cases.",
  },
  {
    name: "Fast & slow pointers",
    cat: "Lists",
    tell: "Cycle detection, middle of a list, or n-th-from-end in one pass.",
    how: "Slow moves 1, fast moves 2; they meet iff there's a cycle (Floyd) — O(1) space.",
  },
  {
    name: "Rabin–Karp rolling hash",
    cat: "Strings",
    tell: "Substring search / comparing many fixed-length windows of a string.",
    how: "Hash a window, then roll: subtract the leaving char, add the entering char → O(1) per slide.",
  },
  {
    name: "Sieve of Eratosthenes",
    cat: "Math/Bits",
    tell: "All primes / smallest prime factor up to N.",
    how: "Mark multiples of each prime; O(N log log N), then factorize anything ≤ N in O(log x).",
  },
  {
    name: "XOR cancellation",
    cat: "Math/Bits",
    tell: "Find the single unpaired element, or toggle a flag.",
    how: "a ^ a = 0 and XOR is commutative ⇒ XOR everything; duplicates cancel, the loner survives.",
  },
];

export default function TricksVaultViz() {
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? TRICKS : TRICKS.filter((t) => t.cat === cat);

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-3">
        filter by category
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {CATS.map((c) => {
          const on = c === cat;
          const count = c === "All" ? TRICKS.length : TRICKS.filter((t) => t.cat === c).length;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="font-mono text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-all select-none"
              style={
                on
                  ? { background: ACCENT, color: "#0c0e14", borderColor: ACCENT }
                  : { background: "transparent", color: "#9aa3b2", borderColor: "rgba(255,255,255,0.14)" }
              }
            >
              {c} <span style={{ opacity: 0.6 }}>· {count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {shown.map((t) => (
          <div
            key={t.name}
            className="rounded-lg p-3.5"
            style={{ background: "#15171f", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <span className="font-semibold text-ink text-sm">{t.name}</span>
              <span
                className="font-mono text-[10px] px-1.5 py-0.5 rounded-full flex-none"
                style={{ color: ACCENT, border: "1px solid rgba(255,207,74,0.4)" }}
              >
                {t.cat}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed mb-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider mr-1.5" style={{ color: ACCENT }}>
                tell
              </span>
              <span className="text-ink-dim">{t.tell}</span>
            </p>
            <p className="text-[13px] leading-relaxed text-ink-faint">
              <span className="font-mono text-[10px] uppercase tracking-wider mr-1.5 text-ink-faint">how</span>
              {t.how}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
