import React, { useState } from "react";
import { Btn } from "./ui.jsx";

/* QuickFire, the shared rapid-fire self-test deck used by the "Rapid fire"
   topic in each tool. deck: [{ q, a, tag? }].
   The rep: read the question, answer OUT LOUD, reveal, grade yourself.
   Tally is per-session; shuffle deals a fresh order. */
export function QuickFire({ accent, deck }) {
  const [order, setOrder] = useState(() => deck.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [got, setGot] = useState(0);
  const [missed, setMissed] = useState(0);

  const total = order.length;
  const done = pos >= total;
  const card = done ? null : deck[order[pos]];

  function shuffle() {
    const next = deck.map((_, i) => i);
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setOrder(next);
    setPos(0);
    setRevealed(false);
    setGot(0);
    setMissed(0);
  }

  function grade(hit) {
    if (hit) setGot((g) => g + 1);
    else setMissed((m) => m + 1);
    setRevealed(false);
    setPos((p) => p + 1);
  }

  function restart() {
    setPos(0);
    setRevealed(false);
    setGot(0);
    setMissed(0);
  }

  const graded = got + missed;
  const pct = graded > 0 ? Math.round((got / graded) * 100) : 0;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* progress + tally */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 font-mono text-[11px] text-ink-faint">
        <span>
          card <span className="text-ink font-semibold">{Math.min(pos + 1, total)}</span> / {total}
        </span>
        <span className="flex items-center gap-3">
          <span style={{ color: "#4ade80" }}>✓ {got}</span>
          <span style={{ color: "#f87171" }}>✗ {missed}</span>
        </span>
      </div>
      <div className="h-1 rounded-full bg-surface-2 overflow-hidden mb-4">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${(Math.min(pos, total) / total) * 100}%`, background: accent }}
        />
      </div>

      {done ? (
        <div className="py-2">
          <div className="text-xl font-bold text-ink mb-1">
            {got} / {total}{" "}
            <span className="text-ink-faint font-normal text-sm">({pct}%)</span>
          </div>
          <p className="text-sm text-ink-dim leading-relaxed mb-4">
            {pct >= 85
              ? "Interview-ready on this deck. Shuffle and re-run tomorrow to keep it warm."
              : pct >= 60
              ? "Close. Re-run the deck and say the missed answers out loud twice."
              : "Rough round, that is what the reps are for. Re-read the topics behind the misses, then go again."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Btn tone={accent} onClick={restart}>run it again</Btn>
            <Btn variant="ghost" onClick={shuffle}>shuffle & restart</Btn>
          </div>
        </div>
      ) : (
        <div>
          {card.tag && (
            <div
              className="font-mono text-[10px] uppercase tracking-wider mb-2"
              style={{ color: accent }}
            >
              {card.tag}
            </div>
          )}
          <p className="text-[15px] text-ink font-medium leading-relaxed mb-4 min-h-[3rem]">
            {card.q}
          </p>
          {!revealed ? (
            <div className="flex flex-wrap items-center gap-3">
              <Btn tone={accent} onClick={() => setRevealed(true)}>reveal answer</Btn>
              <span className="font-mono text-[11px] text-ink-faint">
                answer OUT LOUD first, that is the rep
              </span>
            </div>
          ) : (
            <div>
              <div className="rounded-lg border border-line bg-surface-2 p-3.5 text-sm text-ink-dim leading-relaxed mb-3">
                {card.a}
              </div>
              <div className="flex gap-2">
                <Btn tone="#4ade80" onClick={() => grade(true)}>✓ got it</Btn>
                <Btn tone="#f87171" onClick={() => grade(false)}>✗ missed it</Btn>
              </div>
            </div>
          )}
          <div className="mt-4">
            <button
              onClick={shuffle}
              className="font-mono text-[10px] uppercase tracking-wider text-ink-faint hover:text-ink transition-colors"
            >
              ↻ shuffle deck
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
