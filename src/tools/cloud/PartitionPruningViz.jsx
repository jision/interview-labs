import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Partition pruning on an S3 dataset partitioned by dt over 30 days (~1 GB each).
 * A start day plus a range-width slider select a contiguous date window. Partitions
 * inside the window are SCANNED (lit); the rest are PRUNED (dimmed). Bytes scanned
 * and the Athena $5/TB cost update live, and an unpartitioned baseline (always the
 * full 30 GB) sits alongside for contrast. A note flags the over-partitioning risk.
 */
const ACCENT = "#4d9fff";
const PRUNED = "#3a4150";

const DAYS = 30;
const GB_PER_PARTITION = 1; // ~1 GB per dt= partition
const BYTES_PER_GB = 1e9;

function fmtBytes(gb) {
  return gb >= 1000 ? (gb / 1000).toFixed(2) + " TB" : gb.toFixed(0) + " GB";
}
function fmtCost(gb) {
  const tb = (gb * BYTES_PER_GB) / 1e12;
  return "$" + (tb * 5).toFixed(2); // Athena: $5 per TB scanned
}
function dayLabel(i) {
  // dt = 2026-01-DD
  const dd = String(i + 1).padStart(2, "0");
  return "2026-01-" + dd;
}

export default function PartitionPruningViz() {
  const [start, setStart] = useState(9); // 0-indexed day
  const [width, setWidth] = useState(3); // range width in days

  const clampedStart = Math.min(start, DAYS - width);
  const end = clampedStart + width - 1;

  const scannedCount = width;
  const scannedGb = scannedCount * GB_PER_PARTITION;
  const fullGb = DAYS * GB_PER_PARTITION;
  const saving = (1 - scannedGb / fullGb) * 100;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* the query */}
      <div className="font-mono text-[11px] text-ink-faint mb-1">the query (events table, partitioned by dt)</div>
      <pre className="rounded-lg border border-line bg-[#0e1018] p-3 font-mono text-[12px] text-ink mb-4 whitespace-pre-wrap">
{`SELECT * FROM events
WHERE dt BETWEEN '${dayLabel(clampedStart)}' AND '${dayLabel(end)}'`}
      </pre>

      {/* controls */}
      <div className="mb-2">
        <div className="flex justify-between font-mono text-[11px] mb-1">
          <span className="text-ink-dim">window start</span>
          <span style={{ color: ACCENT }}>{dayLabel(clampedStart)}</span>
        </div>
        <input
          type="range" min={0} max={DAYS - 1} step={1} value={clampedStart}
          onChange={(e) => setStart(parseInt(e.target.value, 10))}
          className="w-full" style={{ accentColor: ACCENT }}
        />
      </div>
      <div className="mb-4">
        <div className="flex justify-between font-mono text-[11px] mb-1">
          <span className="text-ink-dim">range width</span>
          <span style={{ color: ACCENT }}>{width} day{width > 1 ? "s" : ""}</span>
        </div>
        <input
          type="range" min={1} max={DAYS} step={1} value={width}
          onChange={(e) => setWidth(parseInt(e.target.value, 10))}
          className="w-full" style={{ accentColor: ACCENT }}
        />
      </div>

      {/* the 30 partition cells */}
      <div className="font-mono text-[11px] text-ink-faint mb-1.5">
        30 dt= partitions on S3 (~1 GB each), lit = scanned, dim = pruned
      </div>
      <div className="grid grid-cols-10 gap-1 mb-3">
        {Array.from({ length: DAYS }, (_, i) => {
          const lit = i >= clampedStart && i <= end;
          return (
            <div
              key={i}
              title={dayLabel(i)}
              className="h-7 rounded flex items-center justify-center font-mono text-[9px] transition-all"
              style={{
                background: lit ? `color-mix(in srgb, ${ACCENT} 30%, transparent)` : "transparent",
                border: `1px solid ${lit ? ACCENT : PRUNED}`,
                color: lit ? ACCENT : "var(--color-ink-faint)",
                opacity: lit ? 1 : 0.45,
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      {/* partitioned vs full-scan cost */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: ACCENT, background: `color-mix(in srgb, ${ACCENT} 8%, transparent)` }}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">partitioned (pruned)</div>
          <div className="font-mono text-lg font-bold" style={{ color: ACCENT }}>{fmtBytes(scannedGb)}</div>
          <div className="font-mono text-[11px] text-ink-dim mt-0.5">
            {scannedCount} of {DAYS} partitions · {fmtCost(scannedGb)} on Athena
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">unpartitioned (full scan)</div>
          <div className="font-mono text-lg font-bold text-ink-dim">{fmtBytes(fullGb)}</div>
          <div className="font-mono text-[11px] text-ink-faint mt-0.5">
            all {DAYS} partitions · {fmtCost(fullGb)} on Athena
          </div>
        </div>
      </div>

      <div className="mt-3 font-mono text-[11px] leading-relaxed" style={{ color: ACCENT }}>
        A {width}-day filter scans {fmtBytes(scannedGb)} instead of the full {fmtBytes(fullGb)}, about{" "}
        {saving.toFixed(0)}% less, paying {fmtCost(scannedGb)} not {fmtCost(fullGb)}. The WHERE on the
        partition key lets the engine skip whole prefixes before reading a byte.
      </div>
      <div className="mt-2 font-mono text-[10px] text-ink-faint leading-relaxed">
        counter-risk: partition too finely (dt + hour + customer) and each partition holds a sliver of data,
        so you trade clean pruning for thousands of tiny files and slow S3 listing. Balance partition count
        against file size (~128-512 MB per file).
      </div>
    </div>
  );
}
