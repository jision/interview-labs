import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * ScorecardViz, the 10-point coding-mock rubric as toggleable line items.
 * Click a line to award its points; "code correct" is all-or-nothing 2.
 * A separate correctness-bug switch fails the mock regardless of the total,
 * because a broken solution is not a pass at L6 no matter how it scored.
 * Per-mock only, no persistence. Default export.
 */
const ACCENT = "#4285F4";

const ITEMS = [
  { id: "clarify", label: "Clarified the problem", pts: 1 },
  { id: "approach", label: "Valid initial approach before coding", pts: 1 },
  { id: "efficient", label: "Efficient solution (not the brute force)", pts: 1 },
  { id: "invariant", label: "Explained the invariant out loud", pts: 1 },
  { id: "correct", label: "Code correct", pts: 2 },
  { id: "readable", label: "Readable, clean code", pts: 1 },
  { id: "edges", label: "Edge cases handled", pts: 1 },
  { id: "complexity", label: "Complexity stated (time + space)", pts: 1 },
  { id: "followups", label: "Handled the follow-ups", pts: 1 },
];

const MAX = ITEMS.reduce((s, it) => s + it.pts, 0); // 10

export default function ScorecardViz() {
  const [earned, setEarned] = useState({});
  const [bug, setBug] = useState(false);

  const total = ITEMS.reduce((s, it) => s + (earned[it.id] ? it.pts : 0), 0);
  const pass = !bug && total >= 8;
  const color = pass ? "#4ade80" : "#f87171";

  function toggle(id) {
    setEarned((e) => ({ ...e, [id]: !e[id] }));
  }
  function reset() {
    setEarned({});
    setBug(false);
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="font-mono text-[11px] text-ink-dim">
          score the mock, tap each line you actually earned
        </span>
        <span className="font-mono text-[11px] text-ink-faint">target 8 / 10, repeatedly</span>
      </div>

      {/* line items */}
      <div className="space-y-1.5 mb-4">
        {ITEMS.map((it) => {
          const on = !!earned[it.id];
          return (
            <button
              key={it.id}
              onClick={() => toggle(it.id)}
              className="w-full flex items-center gap-3 text-left rounded-lg border px-3 py-2 transition-all select-none"
              style={
                on
                  ? {
                      borderColor: ACCENT,
                      background: "color-mix(in srgb, " + ACCENT + " 12%, transparent)",
                    }
                  : { borderColor: "var(--color-line)" }
              }
            >
              <span
                className="font-mono text-[12px] w-5 h-5 flex-none rounded flex items-center justify-center border"
                style={
                  on
                    ? { borderColor: ACCENT, color: ACCENT }
                    : { borderColor: "var(--color-line-strong)", color: "var(--color-ink-faint)" }
                }
              >
                {on ? "✓" : ""}
              </span>
              <span className="text-sm flex-1" style={{ color: on ? "var(--color-ink)" : "var(--color-ink-dim)" }}>
                {it.label}
              </span>
              <span
                className="font-mono text-[11px] px-1.5 py-0.5 rounded-full border flex-none"
                style={{ color: ACCENT, borderColor: ACCENT }}
              >
                {it.pts === 2 ? "2 pts, all or nothing" : "1 pt"}
              </span>
            </button>
          );
        })}
      </div>

      {/* correctness-bug switch: the hard gate */}
      <button
        onClick={() => setBug((b) => !b)}
        className="w-full flex items-center gap-3 text-left rounded-lg border px-3 py-2 mb-4 transition-all select-none"
        style={
          bug
            ? { borderColor: "#f87171", background: "color-mix(in srgb, #f87171 12%, transparent)" }
            : { borderColor: "var(--color-line)" }
        }
      >
        <span
          className="font-mono text-[12px] w-5 h-5 flex-none rounded flex items-center justify-center border"
          style={
            bug
              ? { borderColor: "#f87171", color: "#f87171" }
              : { borderColor: "var(--color-line-strong)", color: "var(--color-ink-faint)" }
          }
        >
          {bug ? "!" : ""}
        </span>
        <span className="text-sm flex-1" style={{ color: bug ? "#f87171" : "var(--color-ink-dim)" }}>
          An unresolved correctness bug remains
        </span>
        <span className="font-mono text-[11px] text-ink-faint flex-none">auto-fail</span>
      </button>

      {/* live total */}
      <div className="rounded-lg bg-surface-2 p-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">total</div>
          <div className="text-3xl font-bold" style={{ color }}>
            {total}
            <span className="text-ink-faint font-normal text-lg"> / {MAX}</span>
          </div>
        </div>
        <div className="text-right max-w-[60%]">
          <div className="font-mono text-sm font-bold mb-1" style={{ color }}>
            {bug ? "NOT A PASS, correctness bug" : pass ? "PASS, at bar" : "below bar"}
          </div>
          <div className="text-[12px] text-ink-dim leading-relaxed">
            {bug
              ? "A broken solution fails the mock no matter what the total says. Fix it, then re-score."
              : pass
              ? "Hold this repeatedly, not once. One good mock is variance, ten is readiness."
              : "8 or above is the bar. Log every dropped point and re-run the pattern."}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Btn variant="ghost" onClick={reset}>
          ↻ reset
        </Btn>
        <span className="font-mono text-[10px] text-ink-faint ml-auto">
          any unresolved correctness bug = not a pass, regardless of total
        </span>
      </div>
    </div>
  );
}
