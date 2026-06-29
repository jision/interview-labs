import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Medallion-architecture visualizer. Three clickable stages bronze -> silver ->
 * gold flow left to right. Selecting a stage updates an info panel (what it
 * holds, format, transformations applied entering it, consumer) and shows the
 * sample order record as it transforms: raw JSON -> typed/cleaned row ->
 * aggregated metric. Pure illustration, no data.
 */
const ACCENT = "#2ee6a8";

const STAGES = [
  {
    id: "bronze",
    label: "Bronze",
    tone: "#c08457",
    holds: "Raw, append-only, immutable landing. Source data as it arrived, schema-on-read, nothing dropped.",
    format: "Often the source's native form (JSON, CSV, Avro) or Parquet, landed under a dated S3 prefix.",
    transforms: "Ingest only. No business logic, just add load metadata (ingest time, source file, batch id).",
    consumer: "Data engineers and reprocessing jobs. Replay source-of-truth, never queried by analysts directly.",
    prefix: "s3://lake/bronze/orders/dt=2026-06-19/",
    sample: `{ "ord": "A-1001", "amt": "49.90 ",
  "cust": "42", "ts": "1718800000",
  "ccy": null }`,
    sampleLabel: "raw event, strings, nulls, no types",
  },
  {
    id: "silver",
    label: "Silver",
    tone: "#9fb4c4",
    holds: "Cleaned, conformed, deduped, validated, and joined. Typed columns, one row per real event, enriched with reference data.",
    format: "An open table format (Iceberg, Delta, or Hudi) over Parquet, partitioned, with ACID and upserts.",
    transforms: "Cast types, trim and standardize, drop duplicates, apply quality rules, quarantine bad rows, join to dimensions.",
    consumer: "Analysts and ML. The trustworthy, query-ready layer most downstream work builds on.",
    prefix: "s3://lake/silver/fct_orders/",
    sample: `order_id  = "A-1001"
amount    = 49.90   (decimal)
customer  = 42
ordered_at= 2026-06-19 14:00:00
currency  = "USD"   (defaulted)`,
    sampleLabel: "typed, cleaned, conformed row",
  },
  {
    id: "gold",
    label: "Gold",
    tone: ACCENT,
    holds: "Business-level aggregates and marts. Star-schema facts and dimensions, KPIs, and curated metrics ready to serve.",
    format: "Aggregated tables / materialized marts (Iceberg or Delta), or loaded into a warehouse for fast BI.",
    transforms: "Aggregate, roll up to the reporting grain, compute metrics, build the dimensional model and SLAs.",
    consumer: "BI dashboards, executives, and reverse-ETL. The numbers leadership actually reads.",
    prefix: "s3://lake/gold/daily_revenue/",
    sample: `date        = 2026-06-19
revenue_usd = 18,420.55
orders      = 312
avg_order   = 59.04`,
    sampleLabel: "aggregated business metric",
  },
];

export default function MedallionViz() {
  const [active, setActive] = useState("bronze");
  const stage = STAGES.find((s) => s.id === active);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* left-to-right flow of clickable stages */}
      <div className="flex items-stretch gap-2 mb-4">
        {STAGES.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              onClick={() => setActive(s.id)}
              className="flex-1 rounded-lg border p-3 text-left transition-all"
              style={{
                borderColor: active === s.id ? s.tone : "var(--color-line)",
                background:
                  active === s.id
                    ? `color-mix(in srgb, ${s.tone} 12%, transparent)`
                    : "var(--color-surface-2)",
              }}
            >
              <div className="font-mono text-[12px] font-bold mb-1" style={{ color: s.tone }}>
                {s.label}
              </div>
              <div className="font-mono text-[10px] text-ink-faint leading-snug">
                {s.id === "bronze" ? "raw landing" : s.id === "silver" ? "clean + conform" : "aggregate + serve"}
              </div>
            </button>
            {i < STAGES.length - 1 && (
              <div className="flex items-center font-mono text-ink-faint select-none" aria-hidden>
                →
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* the sample record at this stage */}
      <div className="font-mono text-[11px] text-ink-faint mb-1">
        sample order record · {stage.sampleLabel}
      </div>
      <div
        className="rounded-lg border bg-[#0e1018] p-3 mb-4 font-mono text-[12px] leading-relaxed whitespace-pre overflow-x-auto"
        style={{ borderColor: stage.tone, color: "var(--color-ink)" }}
      >
        {stage.sample}
      </div>

      {/* info panel that updates on selection */}
      <div className="grid sm:grid-cols-2 gap-2 mb-2">
        {[
          ["holds", stage.holds],
          ["format", stage.format],
          ["transformations applied", stage.transforms],
          ["consumer", stage.consumer],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-surface-2 p-2.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">{k}</div>
            <div className="text-[12px] text-ink-dim leading-snug">{v}</div>
          </div>
        ))}
      </div>

      <div className="font-mono text-[10px] text-ink-faint mt-3">
        maps to storage: <span style={{ color: stage.tone }}>{stage.prefix}</span>
      </div>
    </div>
  );
}
