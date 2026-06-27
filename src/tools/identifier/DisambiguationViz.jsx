import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#ffcf4a";

/* Flashcards: the fork, and the single deciding question that resolves it. */
const CARDS = [
  {
    q: "Greedy vs DP",
    decider: "Does a locally-best choice stay globally optimal?",
    answer:
      "Greedy only when a local optimum provably leads to the global one (exchange argument / matroid). If a choice now can hurt later, i.e. overlapping subproblems with a recurrence, it's DP. When unsure, write the DP; greedy is the optimization you prove afterward.",
  },
  {
    q: "BFS vs DFS",
    decider: "Do you need the SHORTEST path / nearest layer, or just reachability?",
    answer:
      "BFS for shortest path in an unweighted graph and anything level-by-level (it explores by distance). DFS for existence/connectivity, topological sort, cycle detection, and backtracking, it goes deep with less memory on wide graphs.",
  },
  {
    q: "Sort vs Heap",
    decider: "Do you need ALL elements ordered, or just the top-k / a stream?",
    answer:
      "Sort once (O(n log n)) if you need the whole thing ordered or will query many times. Heap when you only need the k best (size-k heap → O(n log k)), or the data ARRIVES as a stream and full sorting isn't possible.",
  },
  {
    q: "Recursion vs Iteration",
    decider: "Is the structure naturally nested, and is depth bounded?",
    answer:
      "Recursion reads cleanly for trees, divide-and-conquer, and backtracking. But Python's recursion limit (~1000) and call overhead bite on deep/linear inputs, convert to an explicit stack or a loop when depth can reach n.",
  },
  {
    q: "Hash map vs Array index",
    decider: "Are the keys small dense integers, or arbitrary / sparse?",
    answer:
      "Array indexing when keys are small contiguous ints (0..n), fastest, cache-friendly, O(1) with no hashing. Hash map when keys are strings, large, sparse, or unknown up front. Counting 'a'–'z'? An array of 26 beats a dict.",
  },
];

export default function DisambiguationViz() {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = CARDS[idx];

  function next(step) {
    setIdx((i) => (i + step + CARDS.length) % CARDS.length);
    setRevealed(false);
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          flashcard {idx + 1} / {CARDS.length}
        </span>
        <div className="flex gap-1.5">
          {CARDS.map((c, i) => (
            <span
              key={c.q}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === idx ? ACCENT : "rgba(255,255,255,0.2)" }}
            />
          ))}
        </div>
      </div>

      <div
        className="rounded-lg p-5 mb-4 min-h-[12rem] flex flex-col"
        style={{ background: "color-mix(in srgb,#ffcf4a 9%,#15171f)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <div className="text-2xl font-extrabold tracking-tight text-ink mb-1">{card.q}</div>
        <div className="text-sm leading-relaxed mb-3" style={{ color: ACCENT }}>
          ask: {card.decider}
        </div>

        {revealed ? (
          <p className="text-sm leading-relaxed text-ink-dim">{card.answer}</p>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="mt-auto self-start font-mono text-xs font-semibold px-3 py-2 rounded-md border transition-all hover:brightness-110"
            style={{ color: ACCENT, borderColor: "rgba(255,207,74,0.4)" }}
          >
            ▸ reveal the deciding factor
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn variant="ghost" onClick={() => next(-1)}>‹ prev</Btn>
        <Btn tone={ACCENT} onClick={() => next(1)}>next card ›</Btn>
        {revealed && (
          <Btn variant="ghost" onClick={() => setRevealed(false)}>
            hide
          </Btn>
        )}
      </div>
    </div>
  );
}
