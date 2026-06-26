import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Budget decoder, the signature Selector widget.
 * Take cost / latency / quality constraints and score a baked menu of
 * architectures against them. Marks each feasible / tight / infeasible
 * with a one-line reason, then sorts feasible-first.
 * Pure decision logic, no network, no model, baked rough numbers.
 */
const ACCENT = "#ffb703";

// Baked rough profiles. lat = typical p95 ms, cpr = $/request, q = quality 1–5.
const OPTIONS = [
  {
    id: "small-self",
    name: "Small open model, self-hosted",
    lat: 250,
    cpr: 0.00008,
    q: 2,
    note: "cheap + fast once GPUs are busy; weakest reasoning",
  },
  {
    id: "distilled",
    name: "Distilled / quantized self-host",
    lat: 180,
    cpr: 0.00012,
    q: 3,
    note: "tuned for latency; near-mid quality at low cost",
  },
  {
    id: "mid-cache",
    name: "Mid-tier API + caching",
    lat: 600,
    cpr: 0.0015,
    q: 4,
    note: "the pragmatic default; cache absorbs repeat traffic",
  },
  {
    id: "router",
    name: "Router (small → large)",
    lat: 700,
    cpr: 0.0012,
    q: 4,
    note: "easy queries go small, hard ones escalate; best $/quality",
  },
  {
    id: "frontier",
    name: "Frontier API model",
    lat: 1400,
    cpr: 0.012,
    q: 5,
    note: "top capability; slowest and most expensive per call",
  },
];

const QUALITY_FLOOR = { low: 2, medium: 3, high: 4 };
const QUALITY_LABEL = { low: "low", medium: "medium", high: "high" };

const STATUS = {
  feasible: { label: "feasible", color: "#4ade80", rank: 0 },
  tight: { label: "tight", color: "#fbbf24", rank: 1 },
  infeasible: { label: "infeasible", color: "#f87171", rank: 2 },
};

function fmtMoney(n) {
  if (n >= 1) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 0.01) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(5)}`;
}

function evaluate(opt, { reqPerDay, sloMs, budget, quality }) {
  const floor = QUALITY_FLOOR[quality];
  const monthly = opt.cpr * reqPerDay * 30;
  const reasons = [];
  let status = "feasible";

  // Quality gate (hard).
  if (opt.q < floor) {
    status = "infeasible";
    reasons.push(`quality ${opt.q}/5 below your ${QUALITY_LABEL[quality]} need`);
  } else if (opt.q === floor) {
    if (status === "feasible") status = "tight";
    reasons.push(`quality just meets the ${QUALITY_LABEL[quality]} bar`);
  }

  // Latency gate.
  if (opt.lat > sloMs) {
    status = "infeasible";
    reasons.push(`~${opt.lat}ms p95 blows the ${sloMs}ms SLO`);
  } else if (opt.lat > sloMs * 0.8) {
    if (status === "feasible") status = "tight";
    reasons.push(`~${opt.lat}ms p95 close to the ${sloMs}ms SLO`);
  }

  // Budget gate.
  if (monthly > budget) {
    status = "infeasible";
    reasons.push(`~${fmtMoney(monthly)}/mo exceeds your ${fmtMoney(budget)} budget`);
  } else if (monthly > budget * 0.8) {
    if (status === "feasible") status = "tight";
    reasons.push(`~${fmtMoney(monthly)}/mo eats most of the ${fmtMoney(budget)} budget`);
  }

  if (status === "feasible") {
    reasons.push(`fits all three: ~${opt.lat}ms, ~${fmtMoney(monthly)}/mo, quality ${opt.q}/5`);
  }

  return { ...opt, status, monthly, reason: reasons.join("; ") };
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          {label}
        </label>
        <span className="font-mono text-xs font-semibold" style={{ color: ACCENT }}>
          {hint}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function BudgetDecoderViz() {
  const [reqPerDay, setReqPerDay] = useState(100000);
  const [sloMs, setSloMs] = useState(800);
  const [budget, setBudget] = useState(2000);
  const [quality, setQuality] = useState("medium");

  const constraints = { reqPerDay, sloMs, budget, quality };
  const scored = OPTIONS.map((o) => evaluate(o, constraints)).sort(
    (a, b) => STATUS[a.status].rank - STATUS[b.status].rank
  );
  const reqPerSec = (reqPerDay / 86400).toFixed(reqPerDay / 86400 < 10 ? 2 : 0);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-3">
        your constraints
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mb-5">
        <Field label="requests / day" hint={`${reqPerDay.toLocaleString()} · ~${reqPerSec}/s`}>
          <input
            type="range"
            min={1000}
            max={5000000}
            step={1000}
            value={reqPerDay}
            onChange={(e) => setReqPerDay(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: ACCENT }}
          />
        </Field>

        <Field label="p95 latency SLO" hint={`${sloMs} ms`}>
          <input
            type="range"
            min={100}
            max={3000}
            step={50}
            value={sloMs}
            onChange={(e) => setSloMs(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: ACCENT }}
          />
        </Field>

        <Field label="monthly budget" hint={fmtMoney(budget)}>
          <input
            type="range"
            min={100}
            max={50000}
            step={100}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: ACCENT }}
          />
        </Field>

        <Field label="quality need" hint={QUALITY_LABEL[quality]}>
          <div className="flex gap-1.5">
            {["low", "medium", "high"].map((q) => {
              const on = quality === q;
              return (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className="flex-1 font-mono text-xs font-semibold py-1.5 rounded-md border transition-colors capitalize"
                  style={{
                    borderColor: on ? ACCENT : "var(--color-line-strong)",
                    color: on ? "var(--color-bg)" : "var(--color-ink-dim)",
                    background: on ? ACCENT : "transparent",
                  }}
                >
                  {q}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-2">
        architecture menu · feasible first
      </div>
      <div className="space-y-2">
        {scored.map((o) => {
          const s = STATUS[o.status];
          return (
            <div
              key={o.id}
              className="rounded-lg border border-line px-4 py-3"
              style={{
                borderLeft: `3px solid ${o.status === "infeasible" ? "var(--color-line-strong)" : ACCENT}`,
                opacity: o.status === "infeasible" ? 0.6 : 1,
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-sm font-semibold text-ink">{o.name}</span>
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    color: s.color,
                    background: `color-mix(in srgb, ${s.color} 14%, transparent)`,
                  }}
                >
                  {s.label}
                </span>
              </div>
              <div className="text-[13px] text-ink-dim leading-relaxed">{o.reason}.</div>
              <div className="font-mono text-[11px] text-ink-faint mt-1">{o.note}</div>
            </div>
          );
        })}
      </div>

      <p className="text-[13px] text-ink-faint leading-relaxed mt-4">
        Numbers are rough order-of-magnitude anchors, not quotes, the point is the reasoning: every
        constraint you tighten knocks options off the menu.
      </p>
    </div>
  );
}
