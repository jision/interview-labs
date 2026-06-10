import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#ffcf4a";

/* ~1e8 simple operations per second is the standard interview/competitive
   back-of-envelope budget. For each input bound n we record the LARGEST time
   complexity whose op-count stays roughly within that budget, plus what the
   constraint is really hinting and which techniques are in / out. */
const ROWS = [
  {
    n: "n ≤ 10",
    nNum: 10,
    target: "O(n!) · O(2^n · n)",
    targetTone: "bad",
    hint: "Tiny. Brute force everything — try all orderings.",
    in: ["Backtracking / permutations", "Brute-force all subsets", "Bitmask over states"],
    out: [],
    ops: "10! ≈ 3.6e6",
  },
  {
    n: "n ≤ 20",
    nNum: 20,
    target: "O(2^n) · O(2^n · n)",
    targetTone: "bad",
    hint: "Subset / bitmask DP. 2^20 ≈ 1e6 — iterate over masks.",
    in: ["Bitmask DP (subset states)", "Meet-in-the-middle", "Enumerate all subsets"],
    out: ["O(n!) — 20! is astronomical"],
    ops: "2^20 ≈ 1.0e6",
  },
  {
    n: "n ≤ 100",
    nNum: 100,
    target: "O(n^3) · O(n^4)",
    targetTone: "bad",
    hint: "Cubic is fine. Floyd–Warshall, interval/Knapsack DP, triple loops.",
    in: ["O(n^3) DP (Floyd–Warshall, MCM)", "O(n^2) easily", "Interval DP"],
    out: ["O(2^n) — 2^100 impossible"],
    ops: "100^3 = 1e6",
  },
  {
    n: "n ≤ 500",
    nNum: 500,
    target: "O(n^3)",
    targetTone: "bad",
    hint: "Still cubic-ish (~1.25e8). n^2 with a log factor is comfortable.",
    in: ["O(n^3) (tight)", "O(n^2 log n)", "O(n^2) DP"],
    out: ["O(2^n), O(n!)"],
    ops: "500^3 = 1.25e8",
  },
  {
    n: "n ≤ 2000",
    nNum: 2000,
    target: "O(n^2)",
    targetTone: "bad",
    hint: "Quadratic. Two nested loops / classic 2D DP (LCS, edit distance).",
    in: ["O(n^2) DP", "Two nested loops", "O(n^2) all-pairs on small n"],
    out: ["O(n^3) — 8e9 too slow"],
    ops: "2000^2 = 4e6",
  },
  {
    n: "n ≤ 5000",
    nNum: 5000,
    target: "O(n^2)",
    targetTone: "bad",
    hint: "Upper edge of quadratic (2.5e7). Anything cubic dies here.",
    in: ["O(n^2) DP", "O(n^2) (still ~2.5e7)"],
    out: ["O(n^3) — 1.25e11 hopeless"],
    ops: "5000^2 = 2.5e7",
  },
  {
    n: "n ≤ 1e5",
    nNum: 1e5,
    target: "O(n log n)",
    targetTone: "ok",
    hint: "The classic line. Sort / heap / O(n) sliding-window — NOT O(n^2).",
    in: ["O(n log n) sort or heap", "O(n) two-pointer / sliding window", "Hash map O(n)"],
    out: ["O(n^2) — 1e10 too slow"],
    ops: "n log n ≈ 1.7e6",
  },
  {
    n: "n ≤ 1e6",
    nNum: 1e6,
    target: "O(n) · O(n log n)",
    targetTone: "ok",
    hint: "Linear or n log n, with a small constant. Be cache-aware.",
    in: ["O(n) single pass", "O(n log n) sort (tight)", "Counting / radix sort"],
    out: ["O(n^2) — 1e12"],
    ops: "n log n ≈ 2e7",
  },
  {
    n: "n ≤ 1e8",
    nNum: 1e8,
    target: "O(n)",
    targetTone: "ok",
    hint: "Strictly linear, tiny constant. Even O(n log n) is risky at ~2.6e9.",
    in: ["O(n) single pass", "Prefix sums / two pointers", "Sieve-style linear"],
    out: ["O(n log n) (borderline)", "O(n^2)"],
    ops: "n = 1e8 (at the budget)",
  },
  {
    n: "n ≥ 1e9",
    nNum: 1e9,
    target: "O(log n) · O(1)",
    targetTone: "good",
    hint: "You can't even READ n items. Answer with math / binary search / formula.",
    in: ["Closed-form math", "Binary search on the answer", "Matrix-exponent / O(log n)", "Greedy O(1)"],
    out: ["Anything O(n) — can't touch all input"],
    ops: "must avoid touching all n",
  },
  {
    n: "n ≤ 1e18",
    nNum: 1e18,
    target: "O(log n) · O(1)",
    targetTone: "good",
    hint: "n is a VALUE, not a count. Fast exponentiation, digit DP, number theory.",
    in: ["O(log n) binary exponentiation", "Digit DP (over ~18 digits)", "Number theory / gcd"],
    out: ["O(n) — 1e18 is not enumerable"],
    ops: "log2(1e18) ≈ 60",
  },
];

const TONE = { good: "#4ade80", ok: "#fbbf24", bad: "#f87171" };

export default function ConstraintDecoderViz() {
  const [idx, setIdx] = useState(6); // default: n ≤ 1e5, the famous one
  const row = ROWS[idx];

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-2">
        pick the input bound the problem gives you
      </div>

      {/* n selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ROWS.map((r, i) => {
          const active = i === idx;
          return (
            <button
              key={r.n}
              onClick={() => setIdx(i)}
              className="font-mono text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-all select-none"
              style={
                active
                  ? { background: ACCENT, color: "#0c0e14", borderColor: ACCENT }
                  : { background: "transparent", color: "#9aa3b2", borderColor: "rgba(255,255,255,0.14)" }
              }
            >
              {r.n}
            </button>
          );
        })}
      </div>

      {/* Verdict card */}
      <div
        className="rounded-lg p-4 mb-4"
        style={{ background: "color-mix(in srgb,#ffcf4a 9%,#15171f)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
          <span className="font-mono text-sm text-ink-faint">largest viable complexity →</span>
          <code
            className="font-mono text-lg font-bold px-2 py-0.5 rounded"
            style={{ color: TONE[row.targetTone], background: "color-mix(in srgb," + TONE[row.targetTone] + " 14%,transparent)" }}
          >
            {row.target}
          </code>
          <span className="font-mono text-[11px] text-ink-faint">≈ {row.ops}</span>
        </div>
        <div className="text-sm leading-relaxed" style={{ color: "#eef1f7" }}>
          <span className="font-mono text-[11px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>
            interviewer is hinting
          </span>
          {row.hint}
        </div>
      </div>

      {/* In / Out columns */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-lg p-3" style={{ background: "color-mix(in srgb,#4ade80 7%,transparent)", border: "1px solid rgba(74,222,128,0.25)" }}>
          <div className="font-mono text-[10px] uppercase tracking-wider mb-2 font-bold" style={{ color: "#4ade80" }}>
            in budget — reach for
          </div>
          <ul className="space-y-1.5">
            {row.in.map((t) => (
              <li key={t} className="text-sm text-ink-dim flex gap-2">
                <span style={{ color: "#4ade80" }}>✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg p-3" style={{ background: "color-mix(in srgb,#f87171 7%,transparent)", border: "1px solid rgba(248,113,113,0.25)" }}>
          <div className="font-mono text-[10px] uppercase tracking-wider mb-2 font-bold" style={{ color: "#f87171" }}>
            too slow — ruled out
          </div>
          {row.out.length ? (
            <ul className="space-y-1.5">
              {row.out.map((t) => (
                <li key={t} className="text-sm text-ink-dim flex gap-2">
                  <span style={{ color: "#f87171" }}>✕</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-faint italic">Nothing — n is so small even O(n!) clears the budget.</p>
          )}
        </div>
      </div>
    </div>
  );
}
