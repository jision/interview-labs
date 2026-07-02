import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * ModelingProbesViz, a probe-drill stepper for the live e-commerce modeling
 * exercise. Six interviewer probes; for each one you think out loud first,
 * then reveal the strong answer plus the signal it sends. Pure drill, no data.
 */
const ACCENT = "#2ee6a8";

const PROBES = [
  {
    id: "returns",
    label: "returns",
    probe:
      "“Customers return items and sometimes cancel whole orders. Where does that live in your model?”",
    answer:
      "Two defensible designs, and I would name both. Simple reversals can be negative-quantity rows in the same transaction fact, same grain, so revenue nets out naturally in every rollup. If returns are their own process with their own attributes (reason, condition, restock decision), they deserve a separate fct_returns at the return-line grain. And for tracking an order through its lifecycle I would add an accumulating-snapshot fulfillment fact: one row per order, milestone date keys updated as each stage completes.",
    signals:
      "You extend the model under pressure by reasoning from grain and process, instead of bolting columns onto the first diagram.",
  },
  {
    id: "currency",
    label: "currency",
    probe:
      "“We sell in 14 currencies. What amount do you store in the fact table?”",
    answer:
      "Both, at the fact grain: the transaction amount with its currency code, and a standardized amount (say USD) converted at load time using the rate effective at order time. The transaction amount is the audit and reconciliation truth; the standardized amount makes cross-region rollups additive. Never convert at query time with today's rate, that silently rewrites history every time the rate moves.",
    signals:
      "You know fact measures must be additive and comparable while the source truth is preserved, and that conversion is a load-time decision.",
  },
  {
    id: "move",
    label: "address change",
    probe:
      "“A customer moves from Paris to Berlin. Old orders should still report under Paris. How?”",
    answer:
      "dim_customer is SCD Type 2. On the change I close the Paris row (set effective_to and is_current = false) and insert a Berlin row with a new surrogate key and a new effective_from. Facts join on the surrogate key, so every old order stays attached to the Paris-era row and new orders pick up Berlin. Point-in-time truth, and I never touch the fact table.",
    signals:
      "You can state SCD2 mechanics precisely, including why the surrogate key, not the business key, is what makes point-in-time joins work.",
  },
  {
    id: "latefact",
    label: "late-arriving dimension",
    probe:
      "“An order line arrives tonight for a product that does not exist in dim_product yet. What happens?”",
    answer:
      "That is an early-arriving fact, i.e. a late-arriving dimension. I insert a placeholder unknown-member row into dim_product, or an inferred member keyed by the natural key, load the fact against it now, and backfill: when the real product record lands, I update the placeholder or re-point the fact to the proper row. The one thing I never do is drop or block the fact load waiting for the dimension.",
    signals:
      "You have operated a real warehouse: loads are messy, and you have a standard playbook instead of an awkward pause.",
  },
  {
    id: "obt",
    label: "one big table",
    probe:
      "“Why model at all? Why not one big denormalized table with everything in it?”",
    answer:
      "One Big Table is a fine consumption layer, columnar engines scan it fast and analysts love it. As the governed core it fails three ways: customer attributes repeat across millions of rows, so one SCD change becomes a massive rewrite; there is no conformance, so every team re-derives customer or revenue slightly differently; and each new use case rebuilds from scratch. So: star schema as the governed core, and generate OBTs from it as views or marts.",
    signals:
      "Judgment over dogma: you can argue both sides, then place each pattern in the layer where it belongs.",
  },
  {
    id: "dupes",
    label: "duplicate orders",
    probe:
      "“Your pipeline delivers the same order twice. What does your revenue number do?”",
    answer:
      "Unprotected, it double-counts. I make the load idempotent: in staging I dedupe to the latest version per natural key (order_id plus line number, by sequence or commit timestamp), then MERGE INTO the fact keyed on that, so a re-delivery updates the row to the same values instead of inserting a second one. At-least-once delivery plus an idempotent MERGE is effectively exactly-once.",
    signals:
      "You connect the model to ingestion reality: a schema is only as trustworthy as the load that fills it.",
  },
];

export default function ModelingProbesViz() {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(() => PROBES.map(() => false));

  const probe = PROBES[idx];
  const isRevealed = revealed[idx];
  const revealedCount = revealed.filter(Boolean).length;

  function reveal() {
    setRevealed((r) => r.map((v, i) => (i === idx ? true : v)));
  }
  function go(next) {
    setIdx(Math.max(0, Math.min(PROBES.length - 1, next)));
  }
  function reset() {
    setIdx(0);
    setRevealed(PROBES.map(() => false));
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* header: counter + progress dots */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="font-mono text-[11px] text-ink-faint">
          probe <span className="text-ink font-semibold">{idx + 1}</span> / {PROBES.length}
          <span className="ml-3">{revealedCount} revealed</span>
        </span>
        <div className="flex items-center gap-1.5">
          {PROBES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => go(i)}
              title={p.label}
              className="h-2.5 w-2.5 rounded-full transition-all"
              style={{
                background:
                  i === idx
                    ? ACCENT
                    : revealed[i]
                    ? `color-mix(in srgb, ${ACCENT} 45%, transparent)`
                    : "var(--color-surface-2, #222)",
                outline: i === idx ? `1px solid ${ACCENT}` : "1px solid transparent",
              }}
            />
          ))}
        </div>
      </div>

      {/* the interviewer speaks */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">
        interviewer · {probe.label}
      </div>
      <p className="text-[15px] text-ink font-medium leading-relaxed mb-4">{probe.probe}</p>

      {!isRevealed ? (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Btn tone={ACCENT} onClick={reveal}>think, then reveal</Btn>
          <span className="font-mono text-[11px] text-ink-faint">
            say your answer OUT LOUD first, that is the drill
          </span>
        </div>
      ) : (
        <div className="mb-4">
          <div className="rounded-lg border border-line bg-surface-2 p-3.5 text-sm text-ink-dim leading-relaxed mb-2">
            <div className="font-mono text-[10px] uppercase tracking-wider mb-1.5" style={{ color: ACCENT }}>
              the strong answer
            </div>
            {probe.answer}
          </div>
          <div
            className="rounded-lg border p-2.5 text-[12px] leading-snug text-ink-dim"
            style={{
              borderColor: `color-mix(in srgb, ${ACCENT} 35%, transparent)`,
              background: `color-mix(in srgb, ${ACCENT} 8%, transparent)`,
            }}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider mr-1.5" style={{ color: ACCENT }}>
              what it signals
            </span>
            {probe.signals}
          </div>
        </div>
      )}

      {/* nav */}
      <div className="flex flex-wrap items-center gap-2">
        <Btn variant="ghost" tone={ACCENT} disabled={idx === 0} onClick={() => go(idx - 1)}>
          prev
        </Btn>
        <Btn
          variant={isRevealed ? "solid" : "ghost"}
          tone={ACCENT}
          disabled={idx === PROBES.length - 1}
          onClick={() => go(idx + 1)}
        >
          next probe
        </Btn>
        <Btn variant="ghost" tone={ACCENT} onClick={reset}>
          reset
        </Btn>
      </div>
    </div>
  );
}
