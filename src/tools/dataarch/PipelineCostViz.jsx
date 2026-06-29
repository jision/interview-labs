import React, { useState } from "react";

/*
 * Pipeline cost estimator, the "flip CSV -> Parquet and watch the bill fall"
 * demo. Format saving is the headline: Parquet+Snappy is ~1/4 the bytes AND
 * columnar, so Athena prunes columns and scans far less. All arithmetic is
 * hand-authored back-of-envelope, no live pricing.
 */
const ACCENT = "#f25f9c";

const S3_GB_MONTH = 0.023; // S3 Standard, $ / GB-month
const ATHENA_TB = 5; // Athena, $ per TB scanned
const COMPUTE_PER_TB = 0.5; // rough Spark/EMR transform cost, $ per TB processed

/* Parquet+Snappy is typically ~1/4 the size of raw CSV/JSON. */
const PARQUET_RATIO = 0.25;
/* Columnar layout lets a typical analytic query read only the columns it needs,
 * so it scans a fraction of even the compressed footprint. CSV is row-based:
 * every query reads the whole file. */
const PARQUET_SCAN_FRACTION = 0.2;

function fmtMoney(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}
function fmtBytes(gb) {
  if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
  return `${gb.toFixed(1)} GB`;
}

export default function PipelineCostViz() {
  const [gbPerDay, setGbPerDay] = useState(200); // raw daily volume, CSV/JSON
  const [format, setFormat] = useState("parquet"); // "csv" | "parquet"
  const [scanPct, setScanPct] = useState(30); // % of stored data a day's queries touch

  // stored footprint per day, then a 30-day month of accumulation
  const dayFootprintGB = format === "parquet" ? gbPerDay * PARQUET_RATIO : gbPerDay;
  // average stored over the month (linear growth) ~ half of end-of-month total
  const storedGB = dayFootprintGB * 30 * 0.5;
  const storageCost = storedGB * S3_GB_MONTH;

  // bytes scanned per day: % of stored data the queries hit, times the columnar
  // pruning fraction for Parquet (CSV reads every row of what it touches).
  const scannedPerDayGB =
    storedGB * (scanPct / 100) * (format === "parquet" ? PARQUET_SCAN_FRACTION : 1);
  const scannedMonthTB = (scannedPerDayGB * 30) / 1000;
  const athenaCost = scannedMonthTB * ATHENA_TB;

  // transform compute: a month of raw input processed by Spark/EMR
  const processedMonthTB = (gbPerDay * 30) / 1000;
  const computeCost = processedMonthTB * COMPUTE_PER_TB;

  const total = storageCost + athenaCost + computeCost;

  // the headline: same workload, the OTHER format
  const altFootprintGB = format === "parquet" ? gbPerDay : gbPerDay * PARQUET_RATIO;
  const altStoredGB = altFootprintGB * 30 * 0.5;
  const altScanned =
    altStoredGB * (scanPct / 100) * (format === "parquet" ? 1 : PARQUET_SCAN_FRACTION);
  const altTotal =
    altStoredGB * S3_GB_MONTH +
    ((altScanned * 30) / 1000) * ATHENA_TB +
    computeCost;
  const csvTotal = format === "csv" ? total : altTotal;
  const parquetTotal = format === "parquet" ? total : altTotal;
  const saving = csvTotal > 0 ? ((csvTotal - parquetTotal) / csvTotal) * 100 : 0;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* daily volume */}
      <div className="mb-4">
        <div className="flex justify-between font-mono text-[11px] mb-1">
          <span className="text-ink-dim">raw daily volume (CSV/JSON)</span>
          <span style={{ color: ACCENT }}>{gbPerDay} GB/day</span>
        </div>
        <input
          type="range" min={1} max={2000} step={1} value={gbPerDay}
          onChange={(e) => setGbPerDay(parseInt(e.target.value, 10))}
          className="w-full" style={{ accentColor: ACCENT }}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* format toggle, the headline lever */}
        <div>
          <div className="font-mono text-[11px] text-ink-dim mb-1.5">storage format</div>
          <div className="flex gap-1.5">
            {[
              ["csv", "CSV / JSON (raw)"],
              ["parquet", "Parquet + Snappy"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFormat(id)}
                className="flex-1 font-mono text-xs px-2 py-1.5 rounded-md border transition-colors"
                style={
                  format === id
                    ? { borderColor: ACCENT, color: ACCENT, background: "color-mix(in srgb, " + ACCENT + " 10%, transparent)" }
                    : { borderColor: "var(--color-line)", color: "var(--color-ink-dim)" }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {/* scan pattern */}
        <div>
          <div className="flex justify-between font-mono text-[11px] mb-1.5">
            <span className="text-ink-dim">queries touch / day</span>
            <span style={{ color: ACCENT }}>{scanPct}% of data</span>
          </div>
          <input
            type="range" min={1} max={100} step={1} value={scanPct}
            onChange={(e) => setScanPct(parseInt(e.target.value, 10))}
            className="w-full" style={{ accentColor: ACCENT }}
          />
        </div>
      </div>

      {/* result block */}
      <div className="rounded-lg bg-surface-2 p-4">
        {/* headline: format saving */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="font-mono text-[11px] text-ink-faint">est. monthly cost</div>
            <div className="text-3xl font-bold" style={{ color: ACCENT }}>{fmtMoney(total)}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] text-ink-faint">Parquet vs raw CSV</div>
            <div className="font-mono text-lg" style={{ color: "#4ade80" }}>
              -{saving.toFixed(0)}% cheaper
            </div>
          </div>
        </div>

        {/* line items */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            ["S3 storage", fmtMoney(storageCost), `${fmtBytes(storedGB)} avg`],
            ["Athena scan", fmtMoney(athenaCost), `${scannedMonthTB.toFixed(2)} TB/mo`],
            ["EMR compute", fmtMoney(computeCost), `${processedMonthTB.toFixed(1)} TB/mo`],
          ].map(([k, v, sub]) => (
            <div key={k}>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{k}</div>
              <div className="text-lg font-bold text-ink">{v}</div>
              <div className="font-mono text-[10px] text-ink-faint">{sub}</div>
            </div>
          ))}
        </div>

        {/* before / after bar */}
        <div className="font-mono text-[10px] text-ink-faint mb-1">CSV vs Parquet monthly bill</div>
        <div className="space-y-1.5 mb-2">
          {[
            ["CSV / JSON", csvTotal, "#f87171"],
            ["Parquet + Snappy", parquetTotal, ACCENT],
          ].map(([label, val, color]) => {
            const max = Math.max(csvTotal, parquetTotal) || 1;
            return (
              <div key={label} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-ink-faint w-28 shrink-0">{label}</span>
                <div className="flex-1 h-4 rounded bg-surface overflow-hidden">
                  <div className="h-full transition-all duration-300" style={{ width: `${(val / max) * 100}%`, background: color }} />
                </div>
                <span className="font-mono text-[11px] text-ink w-14 text-right">{fmtMoney(val)}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-line font-mono text-[11px] text-ink-dim leading-relaxed">
          Parquet+Snappy is ~1/4 the bytes (cheaper storage) and columnar, so an analytic query reads
          only the columns it needs instead of every row. That double win, smaller footprint plus column
          pruning, is why the format switch dwarfs almost every other knob.
        </div>
      </div>
    </div>
  );
}
