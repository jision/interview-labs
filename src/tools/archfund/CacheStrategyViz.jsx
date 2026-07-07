import React, { useState, useEffect } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * CacheStrategyViz, walk a read and a write through the four caching strategies
 * (cache-aside / read-through / write-through / write-back) and watch the order
 * of hops between App, Cache, and Database, plus where staleness or data-loss
 * risk lives. Self-contained, illustrative, no real data.
 */
const ACCENT = "#c9a23f";
const OUT = "#60a5fa"; // a hop leaving a node
const IN = "#4ade80"; // a hop arriving at a node

const NODES = [
  { id: "app", label: "App", sub: "client / service" },
  { id: "cache", label: "Cache", sub: "Redis / Memcached" },
  { id: "db", label: "Database", sub: "source of truth" },
];
const NIDX = { app: 0, cache: 1, db: 2 };

const STRATS = [
  { id: "aside", label: "Cache-aside" },
  { id: "read", label: "Read-through" },
  { id: "write", label: "Write-through" },
  { id: "back", label: "Write-back" },
];

const FLOWS = {
  aside: {
    read: {
      steps: [
        { from: "app", to: "cache", label: "GET key: check the cache first" },
        { from: "cache", to: "app", label: "MISS: the key is not present" },
        { from: "app", to: "db", label: "read the row from the database" },
        { from: "db", to: "app", label: "row returned to the app" },
        { from: "app", to: "cache", label: "SET key: populate the cache for next time" },
      ],
      risk: "On a hit, step 1 returns immediately and you are done. The cache can serve a stale value until its TTL expires or a write invalidates it. The app owns the load-on-miss logic.",
      riskKind: "note",
    },
    write: {
      steps: [
        { from: "app", to: "db", label: "write the new value to the database" },
        { from: "app", to: "cache", label: "DELETE key: invalidate, do not update in place" },
      ],
      risk: "Delete rather than update: a concurrent read can otherwise repopulate a stale value and pin it. A brief stale window exists between the DB write and the cache delete.",
      riskKind: "warn",
    },
  },
  read: {
    read: {
      steps: [
        { from: "app", to: "cache", label: "GET key: the app only ever talks to the cache" },
        { from: "cache", to: "db", label: "MISS: the cache layer itself loads from the DB" },
        { from: "db", to: "cache", label: "row returned into the cache" },
        { from: "cache", to: "app", label: "value returned to the app" },
      ],
      risk: "The load-on-miss logic lives in the cache layer, not the app, so callers stay simple. Staleness is the same as cache-aside: fresh only until TTL or invalidation.",
      riskKind: "note",
    },
    write: {
      steps: [
        { from: "app", to: "db", label: "write straight to the DB (write-around)" },
        { from: "app", to: "cache", label: "DELETE key: the next read repopulates it" },
      ],
      risk: "Read-through only governs reads, so it is paired with a write policy. Here writes go around the cache, so the next read of that key pays a miss.",
      riskKind: "note",
    },
  },
  write: {
    read: {
      steps: [
        { from: "app", to: "cache", label: "GET key: the cache is authoritative and fresh" },
        { from: "cache", to: "app", label: "HIT: every write already passed through the cache" },
      ],
      risk: "Reads are always fresh because every write went through the cache. Cold keys not yet written still miss and load from the DB.",
      riskKind: "note",
    },
    write: {
      steps: [
        { from: "app", to: "cache", label: "write to the cache" },
        { from: "cache", to: "db", label: "the cache writes through to the DB synchronously" },
        { from: "db", to: "cache", label: "the DB acknowledges the durable write" },
        { from: "cache", to: "app", label: "ack returned only after the DB is durable" },
      ],
      risk: "The cache is never stale and no data is lost, because the DB is written before the ack. The cost is that every write pays the full DB latency.",
      riskKind: "note",
    },
  },
  back: {
    read: {
      steps: [
        { from: "app", to: "cache", label: "GET key: read from the cache" },
        { from: "cache", to: "app", label: "HIT: value may not be flushed to the DB yet" },
      ],
      risk: "The cache holds the latest value, but the DB can lag by the flush interval. During that window the DB is not the source of truth.",
      riskKind: "warn",
    },
    write: {
      steps: [
        { from: "app", to: "cache", label: "write to the cache only" },
        { from: "cache", to: "app", label: "ACK immediately, before the DB is touched" },
        { from: "cache", to: "db", label: "async flush to the DB later, often batched" },
      ],
      risk: "Writes are fast because the ack does not wait for the DB. But if the cache node dies before the flush, those acked writes are LOST. This is where data-loss risk lives.",
      riskKind: "trap",
    },
  },
};

const RISK_STYLE = {
  note: { color: "var(--color-ink-dim)", label: "where the risk lives" },
  warn: { color: "#fbbf24", label: "staleness window" },
  trap: { color: "#f87171", label: "data-loss window" },
};

export default function CacheStrategyViz() {
  const [strat, setStrat] = useState("aside");
  const [op, setOp] = useState("read");
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const flow = FLOWS[strat][op];
  const steps = flow.steps;
  // clamp: a scenario change shrinks the step list before the reset effect runs,
  // so guard against stepIdx briefly pointing past the end.
  const idx = Math.min(stepIdx, steps.length - 1);
  const active = steps[idx];
  const atEnd = idx >= steps.length - 1;

  // reset when the scenario changes
  useEffect(() => {
    setStepIdx(0);
    setPlaying(false);
  }, [strat, op]);

  // auto-play advances one hop at a time, then stops at the end
  useEffect(() => {
    if (!playing) return undefined;
    if (atEnd) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setStepIdx((i) => Math.min(steps.length - 1, i + 1)), 950);
    return () => clearTimeout(t);
  }, [playing, stepIdx, atEnd, steps.length]);

  const fromIdx = NIDX[active.from];
  const toIdx = NIDX[active.to];
  const lo = Math.min(fromIdx, toIdx);
  const hi = Math.max(fromIdx, toIdx);
  const dirRight = toIdx > fromIdx;
  const gapActive = [lo <= 0 && hi >= 1, lo <= 1 && hi >= 2];

  function nodeRole(i) {
    if (i === fromIdx && i === toIdx) return "both";
    if (i === fromIdx) return "from";
    if (i === toIdx) return "to";
    return "idle";
  }
  const rStyle = RISK_STYLE[flow.riskKind];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* strategy picker */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="font-mono text-[11px] text-ink-faint mr-1">strategy</span>
        {STRATS.map((s) => (
          <Btn key={s.id} variant={strat === s.id ? "solid" : "ghost"} tone={ACCENT} onClick={() => setStrat(s.id)}>
            {s.label}
          </Btn>
        ))}
      </div>

      {/* operation toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-mono text-[11px] text-ink-faint mr-1">operation</span>
        <Btn variant={op === "read" ? "solid" : "ghost"} tone={ACCENT} onClick={() => setOp("read")}>a read</Btn>
        <Btn variant={op === "write" ? "solid" : "ghost"} tone={ACCENT} onClick={() => setOp("write")}>a write</Btn>
      </div>

      {/* node diagram */}
      <div className="flex items-stretch gap-1 mb-4">
        {NODES.map((n, i) => {
          const role = nodeRole(i);
          const border =
            role === "from" ? OUT : role === "to" ? IN : role === "both" ? ACCENT : "var(--color-line)";
          const glow =
            role === "idle" ? "transparent" : `color-mix(in srgb, ${border} 12%, transparent)`;
          return (
            <React.Fragment key={n.id}>
              <div
                className="flex-1 rounded-lg border p-2.5 text-center transition-all duration-300"
                style={{ borderColor: border, background: glow }}
              >
                <div className="font-mono text-[12px] font-semibold text-ink">{n.label}</div>
                <div className="font-mono text-[9px] text-ink-faint mt-0.5">{n.sub}</div>
                {role !== "idle" && (
                  <div className="font-mono text-[9px] mt-1" style={{ color: border }}>
                    {role === "from" ? "sends" : role === "to" ? "receives" : "self"}
                  </div>
                )}
              </div>
              {i < NODES.length - 1 && (
                <div className="w-6 flex items-center justify-center">
                  <span
                    className="font-mono text-[15px] transition-colors duration-300"
                    style={{ color: gapActive[i] ? ACCENT : "var(--color-line-strong)" }}
                  >
                    {gapActive[i] ? (dirRight ? "→" : "←") : "·"}
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ordered hop list */}
      <div className="font-mono text-[11px] text-ink-faint mb-1">
        hop sequence, {op === "read" ? "a read" : "a write"}
      </div>
      <div className="space-y-1.5 mb-4">
        {steps.map((s, i) => {
          const isActive = i === idx;
          const isDone = i < idx;
          return (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border px-2.5 py-2 transition-all duration-200"
              style={{
                borderColor: isActive ? ACCENT : "var(--color-line)",
                background: isActive ? `color-mix(in srgb, ${ACCENT} 9%, transparent)` : "transparent",
                opacity: isActive || isDone ? 1 : 0.4,
              }}
            >
              <span
                className="font-mono text-[10px] font-semibold rounded px-1.5 py-0.5 mt-0.5"
                style={{ color: isActive ? "#0e1018" : ACCENT, background: isActive ? ACCENT : "transparent" }}
              >
                {i + 1}
              </span>
              <span className="text-[12.5px] text-ink-dim leading-snug">
                <span className="font-mono text-ink">
                  {NODES[NIDX[s.from]].label} {s.from === s.to ? "" : (NIDX[s.to] > NIDX[s.from] ? "→" : "←")} {s.from === s.to ? "" : NODES[NIDX[s.to]].label}
                </span>{" "}
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Btn tone={ACCENT} variant="ghost" disabled={idx === 0} onClick={() => setStepIdx(Math.max(0, idx - 1))}>
          {"←"} prev
        </Btn>
        <Btn tone={ACCENT} disabled={atEnd} onClick={() => setStepIdx(Math.min(steps.length - 1, idx + 1))}>
          next {"→"}
        </Btn>
        <Btn tone={ACCENT} variant={playing ? "ghost" : "solid"} onClick={() => { if (atEnd) setStepIdx(0); setPlaying((p) => !p); }}>
          {playing ? "∥ pause" : "▶ play"}
        </Btn>
        <Btn variant="ghost" onClick={() => { setStepIdx(0); setPlaying(false); }}>
          {"↻"} reset
        </Btn>
        <span className="font-mono text-[10px] text-ink-faint ml-auto">
          step {idx + 1} / {steps.length}
        </span>
      </div>

      {/* risk banner */}
      <div
        className="rounded-lg p-3 text-sm leading-relaxed"
        style={{
          background: `color-mix(in srgb, ${rStyle.color} 8%, transparent)`,
          borderLeft: `3px solid ${rStyle.color}`,
        }}
      >
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: rStyle.color }}>
          {rStyle.label}
        </div>
        <div className="text-ink-dim text-[12.5px]">{flow.risk}</div>
      </div>
    </div>
  );
}
