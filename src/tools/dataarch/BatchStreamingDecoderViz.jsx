import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Batch vs streaming decoder, the "what shape of pipeline?" call.
 * Four button-group questions; the recommendation and one-line rationale
 * update live as you flip answers. Pure decision logic, no data.
 */
const ACCENT = "#f25f9c";

/* The four dimensions the senior call actually turns on. */
const QUESTIONS = [
  {
    id: "freshness",
    label: "freshness need",
    opts: [
      { v: "hours", label: "hours" },
      { v: "minutes", label: "minutes" },
      { v: "seconds", label: "seconds" },
    ],
  },
  {
    id: "reprocess",
    label: "easy reprocessing / backfills matter?",
    opts: [
      { v: "yes", label: "yes" },
      { v: "no", label: "no" },
    ],
  },
  {
    id: "volume",
    label: "data shape",
    opts: [
      { v: "huge", label: "huge bounded batch" },
      { v: "stream", label: "steady unbounded stream" },
    ],
  },
  {
    id: "ops",
    label: "team can run streaming infra 24/7?",
    opts: [
      { v: "yes", label: "yes" },
      { v: "no", label: "no" },
    ],
  },
];

const RESULTS = {
  batch: {
    title: "Batch",
    color: "#4ade80",
    why: "Hours of latency is fine, so run a bounded job on a schedule. Simplest to build, highest throughput, and reprocessing is just a re-run.",
  },
  microbatch: {
    title: "Micro-batch (Spark Structured Streaming)",
    color: "#38bdf8",
    why: "Small checkpointed batches on one engine. For an unbounded stream it delivers minutes-or-better freshness without a 24/7 record-at-a-time stack; for bounded data that must stay fresh, it is simply the same batch job re-run every few minutes.",
  },
  streaming: {
    title: "True streaming (Flink / Kappa)",
    color: "#f25f9c",
    why: "Seconds of latency per event needs a record-at-a-time engine. One streaming pipeline; reprocess by replaying the log. Costs real ops effort.",
  },
  lambda: {
    title: "Lambda (batch + speed layers)",
    color: "#fbbf24",
    why: "You need low latency AND a clean, reprocessable source of truth. A batch layer recomputes accurate results while a speed layer serves fresh ones, merged at query time. Price is two codebases.",
  },
};

/* Hand-authored decision rules, evaluated top-down, first match wins. */
function decide(a) {
  // Bounded data cannot be streamed; freshness only changes how often you re-run.
  if (a.volume === "huge") {
    return a.freshness === "hours" ? "batch" : "microbatch";
  }
  if (a.freshness === "seconds") {
    if (a.reprocess === "yes") return a.ops === "yes" ? "lambda" : "microbatch";
    return a.ops === "yes" ? "streaming" : "microbatch";
  }
  if (a.freshness === "minutes") return "microbatch";
  return "batch";
}

function Group({ q, value, onPick }) {
  return (
    <div className="mb-3">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1.5">
        {q.label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {q.opts.map((o) => (
          <Btn
            key={o.v}
            variant={value === o.v ? "solid" : "ghost"}
            tone={ACCENT}
            onClick={() => onPick(o.v)}
          >
            {o.label}
          </Btn>
        ))}
      </div>
    </div>
  );
}

export default function BatchStreamingDecoderViz() {
  const [ans, setAns] = useState({
    freshness: "hours",
    reprocess: "yes",
    volume: "huge",
    ops: "no",
  });

  const pick = (id, v) => setAns((p) => ({ ...p, [id]: v }));
  const r = RESULTS[decide(ans)];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="grid sm:grid-cols-2 gap-x-5">
        {QUESTIONS.map((q) => (
          <Group key={q.id} q={q} value={ans[q.id]} onPick={(v) => pick(q.id, v)} />
        ))}
      </div>

      <div
        className="rounded-lg border border-line p-4 mt-2"
        style={{ borderLeft: `3px solid ${r.color}` }}
      >
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1">
          recommended pipeline
        </div>
        <div className="text-2xl font-bold mb-2" style={{ color: r.color }}>
          {r.title}
        </div>
        <p className="text-[13px] text-ink-dim leading-relaxed">{r.why}</p>
      </div>

      <div className="mt-3 font-mono text-[11px] text-ink-faint leading-relaxed">
        Default to batch until a latency target forces your hand. Reach for true streaming or Lambda only
        when seconds matter and the team can carry the ops.
      </div>
    </div>
  );
}
