import React, { useState } from "react";

/*
 * Quality-attribute trade-off picker. Choose your top two -ilities to optimize,
 * and the widget names the honest tensions those two create, both with each other
 * and with the three you did not pick. No computation, hand-authored trade-offs.
 */
const ACCENT = "#2fbf8f";

const ATTRS = [
  { id: "latency", label: "Low latency" },
  { id: "availability", label: "High availability" },
  { id: "consistency", label: "Strong consistency" },
  { id: "cost", label: "Low cost" },
  { id: "simplicity", label: "Operational simplicity" },
];

const LABEL = Object.fromEntries(ATTRS.map((a) => [a.id, a.label]));

/* For each prioritized attribute, the others it tends to push down. */
const COSTS = {
  latency: ["cost", "simplicity"],
  availability: ["cost", "simplicity", "consistency"],
  consistency: ["availability", "latency", "simplicity"],
  cost: ["latency", "availability"],
  simplicity: ["latency", "availability"],
};

/* Directed note: prioritizing FROM tends to hurt TO, and why. */
const NOTE = {
  "latency>cost": "Low latency wants caches, read replicas, and edge points of presence. That capacity sits idle for headroom, so the bill climbs.",
  "latency>simplicity": "Fast paths mean cache layers and geo-replication, more moving parts to keep coherent.",
  "availability>cost": "High availability means redundant, standby capacity across zones or regions that you pay for whether or not it is used.",
  "availability>simplicity": "Redundancy and automated failover add components and failure modes: health checks, quorum, replication lag.",
  "availability>consistency": "Under a network partition you can stay available or stay consistent, not both. Choosing availability means sometimes serving stale data (CAP).",
  "consistency>availability": "Strong consistency needs a quorum to agree. If too many nodes are unreachable, writes are refused rather than allowed to diverge (CAP).",
  "consistency>latency": "Every strongly consistent write waits for coordination, a quorum ack or a cross-region round trip, which raises tail latency.",
  "consistency>simplicity": "Consensus, leader election, and conflict handling are some of the hardest distributed-systems machinery to operate.",
  "cost>latency": "Trimming replicas and cache tiers to save money means more cache misses and farther reads, so p99 rises.",
  "cost>availability": "Cutting redundancy to the minimum removes the standby capacity that absorbs a node or zone failure.",
  "simplicity>latency": "One boring region with no cache is easy to reason about, but distant users and cold reads pay for it.",
  "simplicity>availability": "A single deployment with few moving parts has fewer ways to fail, and no way to survive losing the one thing it runs on.",
};

export default function NfrRadarViz() {
  // ordered list, newest pushed last; always keep exactly two
  const [picked, setPicked] = useState(["availability", "consistency"]);

  function toggle(id) {
    if (picked.includes(id)) return; // must keep two
    setPicked([picked[1], id]); // drop the oldest
  }

  const [a, b] = picked;

  // tension BETWEEN the two picks (either direction)
  const inner = [];
  if (NOTE[`${a}>${b}`]) inner.push({ from: a, to: b, text: NOTE[`${a}>${b}`] });
  if (NOTE[`${b}>${a}`]) inner.push({ from: b, to: a, text: NOTE[`${b}>${a}`] });

  // what the picks cost among the three you did NOT pick
  const outward = [];
  const seenTo = new Set();
  picked.forEach((p) => {
    COSTS[p].forEach((t) => {
      if (!picked.includes(t) && !seenTo.has(t)) {
        seenTo.add(t);
        outward.push({ from: p, to: t, text: NOTE[`${p}>${t}`] });
      }
    });
  });

  const synergy = picked.includes("cost") && picked.includes("simplicity");

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="font-mono text-[11px] text-ink-dim mb-2">
        pick your top two quality attributes, the widget names what they cost
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {ATTRS.map((v) => {
          const on = picked.includes(v.id);
          return (
            <button
              key={v.id}
              onClick={() => toggle(v.id)}
              className="font-mono text-sm font-semibold px-3.5 py-2 rounded-lg border transition-all select-none"
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

      <div className="rounded-lg bg-surface-2 p-4">
        <div className="font-mono text-[11px] text-ink-faint mb-3">
          prioritizing <span style={{ color: ACCENT }}>{LABEL[a]}</span> +{" "}
          <span style={{ color: ACCENT }}>{LABEL[b]}</span>
        </div>

        {inner.length > 0 && (
          <div
            className="rounded-lg p-3 mb-3"
            style={{ background: "color-mix(in srgb, #f87171 8%, transparent)", borderLeft: "3px solid #f87171" }}
          >
            <div className="font-mono text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "#f87171" }}>
              even your two picks fight each other
            </div>
            <ul className="space-y-1.5">
              {inner.map((n, i) => (
                <li key={i} className="text-sm text-ink-dim leading-relaxed">
                  <span className="font-mono text-[11px] text-ink">{LABEL[n.from]} vs {LABEL[n.to]}:</span> {n.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {synergy && inner.length === 0 && (
          <div
            className="rounded-lg p-3 mb-3"
            style={{ background: "color-mix(in srgb, " + ACCENT + " 10%, transparent)", borderLeft: "3px solid " + ACCENT }}
          >
            <div className="font-mono text-[10px] uppercase tracking-wider mb-1.5" style={{ color: ACCENT }}>
              these two reinforce each other
            </div>
            <p className="text-sm text-ink-dim leading-relaxed">
              Low cost and simplicity usually pull together, the plainest design is often the cheapest to run. Your
              tension lives entirely with the things that need scale: latency, availability, and consistency.
            </p>
          </div>
        )}

        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">
          what you trade away
        </div>
        <ul className="space-y-2">
          {outward.map((n, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-dim leading-relaxed">
              <span style={{ color: ACCENT }} className="font-mono">
                ›
              </span>
              <span>
                <span className="font-mono text-[11px] text-ink">You give up {LABEL[n.to]}:</span> {n.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 font-mono text-[11px] text-ink-faint leading-relaxed">
        There is no free -ility. Naming which two you optimize, and saying out loud what the other three pay, is the
        senior move.
      </div>
    </div>
  );
}
