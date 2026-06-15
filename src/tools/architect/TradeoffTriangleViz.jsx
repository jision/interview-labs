import React, { useState } from "react";

/*
 * Cost / Latency / Quality — the "pick two" trade-off the architect round loves.
 * Select exactly two to optimize; the third is what gives. Baked guidance for all
 * three pairings — no computation, just the decision a senior engineer would name.
 */
const ACCENT = "#fb6f3c";

const VERTICES = [
  { id: "cost", label: "Cost" },
  { id: "latency", label: "Latency" },
  { id: "quality", label: "Quality" },
];

/* Guidance keyed by the sacrificed dimension (the one NOT picked). */
const GUIDANCE = {
  // picked: Cost + Latency  →  Quality gives
  quality: {
    pair: "Cost + Latency",
    sacrifices: "Quality",
    summary:
      "Cheap and fast means a smaller, simpler model. You accept lower answer quality to hold the bill and the SLO.",
    levers: [
      "Use a smaller / distilled model (e.g. 7B instead of 70B).",
      "Aggressive quantization (INT8/INT4) for cheaper, faster inference.",
      "Skip the reranker and extra context — fewer tokens, less latency.",
      "Cache common answers; route easy queries to the cheapest model.",
    ],
  },
  // picked: Cost + Quality  →  Latency gives
  latency: {
    pair: "Cost + Quality",
    sacrifices: "Latency",
    summary:
      "A big, accurate model on cheap hardware means you wait. Batch hard and accept slower, queued responses.",
    levers: [
      "Continuous batching — high throughput, but each request waits its turn.",
      "Run the large model on fewer / cheaper (non-over-provisioned) GPUs.",
      "Use async / offline jobs where users don't need instant replies.",
      "Add multi-step reasoning or a critic pass — better answers, more time.",
    ],
  },
  // picked: Latency + Quality  →  Cost gives
  cost: {
    pair: "Latency + Quality",
    sacrifices: "Cost",
    summary:
      "A big model answering fast means lots of GPU sitting idle for headroom. You buy capacity to guarantee both.",
    levers: [
      "Over-provision GPUs so there's always spare capacity for low latency.",
      "Run the largest model you can afford for top-tier quality.",
      "Speculative decoding + dedicated replicas — fast and accurate, not cheap.",
      "Keep context rich (more retrieval, reranking) — more tokens, more spend.",
    ],
  },
};

export default function TradeoffTriangleViz() {
  // selection is an ordered list; newest pushed to the end. Keep exactly two.
  const [picked, setPicked] = useState(["latency", "quality"]);

  function toggle(id) {
    if (picked.includes(id)) {
      // re-clicking a selected chip does nothing (must keep two)
      return;
    }
    // selecting a third deselects the OLDEST so exactly two stay active
    setPicked([picked[1], id]);
  }

  const sacrificed = VERTICES.find((v) => !picked.includes(v.id));
  const g = sacrificed ? GUIDANCE[sacrificed.id] : null;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="font-mono text-[11px] text-ink-dim mb-2">
        pick two to optimize — the third gives
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {VERTICES.map((v) => {
          const on = picked.includes(v.id);
          return (
            <button
              key={v.id}
              onClick={() => toggle(v.id)}
              className="font-mono text-sm font-semibold px-4 py-2 rounded-lg border transition-all select-none"
              style={
                on
                  ? {
                      borderColor: ACCENT,
                      color: ACCENT,
                      background: "color-mix(in srgb, " + ACCENT + " 12%, transparent)",
                    }
                  : { borderColor: "var(--color-line)", color: "var(--color-ink-faint)" }
              }
            >
              {on ? "✓ " : ""}
              {v.label}
            </button>
          );
        })}
      </div>

      {g && (
        <div className="rounded-lg bg-surface-2 p-4">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="font-mono text-[11px] text-ink-faint">
              optimizing <span style={{ color: ACCENT }}>{g.pair}</span>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px] text-ink-faint">what gives</div>
              <div className="text-2xl font-bold" style={{ color: "#f87171" }}>
                {g.sacrifices}
              </div>
            </div>
          </div>

          <p className="text-ink-dim leading-relaxed text-sm mb-3">{g.summary}</p>

          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">
            the levers
          </div>
          <ul className="space-y-1.5">
            {g.levers.map((lever, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-dim leading-relaxed">
                <span style={{ color: ACCENT }} className="font-mono">
                  ›
                </span>
                <span>{lever}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
