import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * FrameworkStepperViz, the 7-step design-round framework as a walkable
 * stepper. Prev/next through the steps, watch the cumulative minutes fill
 * the 45-minute budget, and read the SAY / DRAW / ASK script for each step.
 * Self-contained, no external data.
 */
const ACCENT = "#ff6b6b";
const TOTAL_MIN = 45;

const STEPS = [
  {
    name: "Requirements",
    min: 5,
    say: "Before I draw anything, I want to pin down who consumes this data, how fresh it has to be, and what the queries look like.",
    draw: "A requirements box in the top corner: consumers, use cases, freshness SLA, query patterns, compliance.",
    ask: "Who queries this, how fresh does it need to be, and is there PII or a retention rule in scope?",
  },
  {
    name: "Scale math",
    min: 5,
    say: "Let me size this out loud so every later decision has a number behind it.",
    draw: "A margin column: events/day -> bytes/event -> GB/day -> TB/year, rounded aggressively.",
    ask: "Does 50 million events a day sound like the right order of magnitude to you?",
  },
  {
    name: "Ingest",
    min: 5,
    say: "Now the front door: how events get from producers into the platform, and what happens at peak.",
    draw: "Producers on the far left, an ingest lane (stream or batch transfer), arrows labeled with volume and format.",
    ask: "Do we own the producers, or is this third-party data we pull on their schedule?",
  },
  {
    name: "Storage & layout",
    min: 8,
    say: "This is where most of the long-term cost and query performance gets decided, so I will spend real time here.",
    draw: "Bronze / silver / gold zones, the table format, and a partition key written on every table.",
    ask: "Want me to go deeper on the partitioning strategy, or on the table-format choice?",
  },
  {
    name: "Processing",
    min: 8,
    say: "Here is how raw becomes trustworthy: each transform, the engine that runs it, and its cadence.",
    draw: "Jobs as boxes between the zones, each labeled with engine, trigger cadence, and what it dedupes or joins.",
    ask: "Is minutes-fresh acceptable for this leg, or does anything genuinely need seconds?",
  },
  {
    name: "Serving",
    min: 6,
    say: "The platform only matters at the point of consumption, so here is who reads what, through which engine.",
    draw: "One serving box per consumer type: BI, ad-hoc SQL, APIs, ML features, with latency and concurrency notes.",
    ask: "What latency and concurrency do the dashboards actually need, internal analysts or end users?",
  },
  {
    name: "Operate",
    min: 5,
    say: "Finally, what makes this run for two years instead of two weeks: quality gates, SLOs, monitoring, and cost.",
    draw: "A quality gate on the write path, an SLO panel with the freshness target, and a monthly cost sketch.",
    ask: "We have a few minutes left, anything you would like me to go deeper on?",
  },
];

export default function FrameworkStepperViz() {
  const [idx, setIdx] = useState(0);
  const step = STEPS[idx];
  const spent = STEPS.slice(0, idx + 1).reduce((sum, s) => sum + s.min, 0);
  const pct = Math.round((spent / TOTAL_MIN) * 100);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* header: step position + time chip */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[11px] text-ink-faint">
          step <span className="text-ink font-semibold">{idx + 1}</span> / {STEPS.length}
        </span>
        <span
          className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
          style={{ color: ACCENT, borderColor: ACCENT }}
        >
          {step.min} min budget
        </span>
      </div>

      {/* cumulative-minutes progress bar */}
      <div className="flex justify-between font-mono text-[10px] text-ink-faint mb-1">
        <span>cumulative time</span>
        <span>
          <span style={{ color: ACCENT }}>{spent} min</span> / {TOTAL_MIN} min
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden mb-4">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${pct}%`, background: ACCENT }}
        />
      </div>

      {/* step panel */}
      <div className="mb-4">
        <div className="text-lg font-bold text-ink mb-3">
          {idx + 1}. {step.name}
        </div>
        <div className="space-y-2">
          {[
            ["say", step.say],
            ["draw", step.draw],
            ["ask", step.ask],
          ].map(([label, text]) => (
            <div key={label} className="rounded-lg border border-line bg-surface-2 p-3">
              <div
                className="font-mono text-[10px] uppercase tracking-wider mb-1"
                style={{ color: ACCENT }}
              >
                {label}
              </div>
              <div className="text-[13px] text-ink-dim leading-relaxed">{text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Btn tone={ACCENT} variant="ghost" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
          ← prev
        </Btn>
        <Btn tone={ACCENT} disabled={idx === STEPS.length - 1} onClick={() => setIdx((i) => Math.min(STEPS.length - 1, i + 1))}>
          next →
        </Btn>
        <Btn variant="ghost" onClick={() => setIdx(0)}>
          ↻ reset
        </Btn>
        <span className="font-mono text-[10px] text-ink-faint ml-auto">
          {idx === STEPS.length - 1 ? "42 min planned, 3 min buffer" : "walk it out loud, step by step"}
        </span>
      </div>
    </div>
  );
}
