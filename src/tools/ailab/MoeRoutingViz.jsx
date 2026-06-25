import React, { useMemo, useState } from "react";

/*
 * Mixture-of-Experts router — baked fixture, no model in the browser.
 * Each token is sent to only its top-k experts (sparse activation), so the model
 * holds N experts' worth of capacity but runs only k of them per token.
 */
const ACCENT = "#7c5cff";

const TOKENS = ["The", "cat", "sat", "on", "mat"];
const N_EXPERTS = 8;

// router affinity (gating weights) per token × expert — hand-authored to look
// like a trained router with mild expert specialization.
const AFFINITY = [
  [0.05, 0.10, 0.40, 0.08, 0.07, 0.12, 0.10, 0.08], // The
  [0.35, 0.06, 0.05, 0.30, 0.04, 0.08, 0.07, 0.05], // cat
  [0.08, 0.30, 0.06, 0.05, 0.34, 0.05, 0.07, 0.05], // sat
  [0.06, 0.05, 0.10, 0.07, 0.06, 0.40, 0.08, 0.18], // on
  [0.40, 0.05, 0.06, 0.06, 0.05, 0.07, 0.06, 0.25], // mat
];

export default function MoeRoutingViz() {
  const [tok, setTok] = useState(1); // default "cat"
  const [k, setK] = useState(2);

  const row = AFFINITY[tok];
  // indices of the top-k experts for this token
  const topSet = useMemo(() => {
    const idx = row.map((w, i) => ({ i, w })).sort((a, b) => b.w - a.w).slice(0, k);
    return new Set(idx.map((x) => x.i));
  }, [row, k]);

  const activePct = Math.round((k / N_EXPERTS) * 100);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="text-sm text-ink-dim mb-3">
        Pick a token — the <span className="text-ink font-semibold">router</span> sends it to only its{" "}
        <span className="text-ink font-semibold">top-{k}</span> of {N_EXPERTS} experts. The rest stay dark.
      </div>

      {/* token selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TOKENS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTok(i)}
            className="font-mono text-xs px-2.5 py-1 rounded-md border transition-colors"
            style={
              i === tok
                ? { background: ACCENT, color: "#0c0e14", borderColor: ACCENT }
                : { borderColor: "rgba(255,255,255,0.16)", color: "#a8b0bf" }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* router → experts */}
      <div className="font-mono text-[11px] text-ink-faint mb-2">
        router gating for “{TOKENS[tok]}” → experts (lit = selected)
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {row.map((w, i) => {
          const on = topSet.has(i);
          return (
            <div
              key={i}
              className="rounded-lg p-2 border text-center transition-all"
              style={{
                borderColor: on ? ACCENT : "rgba(255,255,255,0.08)",
                background: on ? `color-mix(in srgb, ${ACCENT} ${Math.round(w * 60) + 12}%, transparent)` : "rgba(255,255,255,0.02)",
                opacity: on ? 1 : 0.4,
              }}
            >
              <div className="font-mono text-[11px]" style={{ color: on ? "#fff" : "#6b7480" }}>
                E{i}
              </div>
              <div className="font-mono text-[10px]" style={{ color: on ? ACCENT : "#6b7480" }}>
                {(w * 100).toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* top-k control */}
      <div className="mb-4">
        <div className="flex justify-between font-mono text-[11px] mb-1">
          <span className="text-ink-dim">experts per token (top-k)</span>
          <span style={{ color: ACCENT }}>{k}</span>
        </div>
        <input
          type="range" min={1} max={4} step={1} value={k}
          onChange={(e) => setK(parseInt(e.target.value, 10))}
          className="w-full" style={{ accentColor: ACCENT }}
        />
      </div>

      {/* the payoff */}
      <div className="rounded-lg bg-surface-2 p-3 grid grid-cols-3 gap-2 text-center">
        {[
          ["experts (capacity)", `${N_EXPERTS}× FFN`],
          ["active per token", `${k} (${activePct}%)`],
          ["params in VRAM", "100%"],
        ].map(([label, val]) => (
          <div key={label}>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-0.5">{label}</div>
            <div className="font-mono text-sm" style={{ color: ACCENT }}>{val}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 font-mono text-[11px] text-ink-faint leading-relaxed">
        {N_EXPERTS}× the feed-forward capacity, but only ~{activePct}% of it runs per token — that's how MoE
        scales knowledge without scaling per-token compute. The catch: all {N_EXPERTS} experts still sit in
        GPU memory, since the next token may route differently.
      </div>
    </div>
  );
}
