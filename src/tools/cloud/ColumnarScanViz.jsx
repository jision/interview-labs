import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Columnar vs row storage scan cost.
 * A 6-column table; the user picks which columns a query SELECTs and whether a
 * WHERE filter on a stats-bearing column (status) is on. CSV (row) always reads
 * every column of every row. Parquet (columnar) reads only selected columns and,
 * with the filter on, skips row groups whose min/max stats can't match (predicate
 * pushdown). Bytes scanned drive the Athena $5/TB cost so the saving is concrete.
 */
const ACCENT = "#4d9fff";
const ROW_TONE = "#f59e0b";

// 6 columns; bytesPerRow is the average on-disk bytes for that column.
const COLUMNS = [
  { id: "order_id", label: "order_id", bytes: 8 },
  { id: "customer", label: "customer", bytes: 24 },
  { id: "region", label: "region", bytes: 6 },
  { id: "ts", label: "ts", bytes: 8 },
  { id: "amount", label: "amount", bytes: 8 },
  { id: "status", label: "status", bytes: 6 },
];

const TOTAL_ROWS = 200_000_000; // 200M rows
// status takes 3 values across 8 row groups; only ~3 of 8 groups hold "shipped".
const ROW_GROUPS = 8;
const GROUPS_MATCHING_FILTER = 3; // row groups whose min/max can contain status="shipped"

const bytesPerRowAll = COLUMNS.reduce((s, c) => s + c.bytes, 0);

function fmtBytes(b) {
  if (b >= 1e12) return (b / 1e12).toFixed(2) + " TB";
  if (b >= 1e9) return (b / 1e9).toFixed(2) + " GB";
  if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB";
  return (b / 1e3).toFixed(0) + " KB";
}
function fmtCost(bytes) {
  const tb = bytes / 1e12;
  const cost = tb * 5; // Athena: $5 per TB scanned
  return "$" + cost.toFixed(2);
}

export default function ColumnarScanViz() {
  const [format, setFormat] = useState("parquet"); // "csv" | "parquet"
  const [selected, setSelected] = useState({ region: true, amount: true });
  const [filter, setFilter] = useState(true); // WHERE status = 'shipped'

  const toggleCol = (id) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  const selectedIds = COLUMNS.filter((c) => selected[c.id]).map((c) => c.id);
  // status is implicitly read by the engine when the filter is on.
  const readIds = new Set(selectedIds);
  if (filter) readIds.add("status");

  // CSV (row): must read EVERY column of EVERY row. No column pruning, no skipping.
  const csvBytes = bytesPerRowAll * TOTAL_ROWS;

  // Parquet (columnar): read only the columns touched, and with a stats-bearing
  // filter, skip row groups whose min/max can't match (predicate pushdown).
  const colBytesPerRow = COLUMNS
    .filter((c) => readIds.has(c.id))
    .reduce((s, c) => s + c.bytes, 0);
  const rowFraction = filter ? GROUPS_MATCHING_FILTER / ROW_GROUPS : 1;
  const parquetBytes = colBytesPerRow * TOTAL_ROWS * rowFraction;

  const active = format === "csv" ? csvBytes : parquetBytes;
  const tone = format === "csv" ? ROW_TONE : ACCENT;

  const selectList = selectedIds.length ? selectedIds.join(", ") : "(pick columns)";
  const query =
    "SELECT " + selectList + "\nFROM orders" + (filter ? "\nWHERE status = 'shipped'" : "");

  const saving =
    csvBytes > 0 ? (1 - parquetBytes / csvBytes) * 100 : 0;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* the query */}
      <div className="font-mono text-[11px] text-ink-faint mb-1">the query (200M-row orders table)</div>
      <pre className="rounded-lg border border-line bg-[#0e1018] p-3 font-mono text-[12px] text-ink mb-4 whitespace-pre-wrap">{query}</pre>

      {/* column picker */}
      <div className="font-mono text-[11px] text-ink-faint mb-1.5">SELECT columns</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {COLUMNS.map((c) => (
          <Btn
            key={c.id}
            variant={selected[c.id] ? "solid" : "ghost"}
            tone={ACCENT}
            onClick={() => toggleCol(c.id)}
          >
            {c.label}
          </Btn>
        ))}
      </div>

      {/* filter + format toggles */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-mono text-[11px] text-ink-faint mr-1">filter</span>
        <Btn variant={filter ? "solid" : "ghost"} tone={ACCENT} onClick={() => setFilter((v) => !v)}>
          {filter ? "WHERE status = 'shipped'  (on)" : "no WHERE  (off)"}
        </Btn>
        <span className="font-mono text-[11px] text-ink-faint mx-1 ml-3">format</span>
        <Btn variant={format === "csv" ? "solid" : "ghost"} tone={ROW_TONE} onClick={() => setFormat("csv")}>
          CSV (row)
        </Btn>
        <Btn variant={format === "parquet" ? "solid" : "ghost"} tone={ACCENT} onClick={() => setFormat("parquet")}>
          Parquet (columnar)
        </Btn>
      </div>

      {/* per-column lit/dim map for the active format */}
      <div className="font-mono text-[11px] text-ink-faint mb-1.5">columns actually scanned on disk</div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {COLUMNS.map((c) => {
          const read = format === "csv" ? true : readIds.has(c.id);
          return (
            <div
              key={c.id}
              className="rounded-md border px-2 py-1 font-mono text-[11px] transition-all"
              style={{
                borderColor: read ? tone : "var(--color-line)",
                color: read ? tone : "var(--color-ink-faint)",
                background: read ? `color-mix(in srgb, ${tone} 14%, transparent)` : "transparent",
                opacity: read ? 1 : 0.4,
              }}
            >
              {c.label}{read ? "" : " (skipped)"}
            </div>
          );
        })}
      </div>

      {/* row-group skipping note for parquet + filter */}
      {format === "parquet" && filter && (
        <div className="mb-3 font-mono text-[10px] text-ink-faint leading-relaxed">
          predicate pushdown: of {ROW_GROUPS} row groups, min/max stats let the engine skip{" "}
          {ROW_GROUPS - GROUPS_MATCHING_FILTER} and read only {GROUPS_MATCHING_FILTER} that can hold status = 'shipped'.
        </div>
      )}

      {/* the two cost cards, side by side */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {[
          { id: "csv", name: "CSV (row)", bytes: csvBytes, c: ROW_TONE },
          { id: "parquet", name: "Parquet (columnar)", bytes: parquetBytes, c: ACCENT },
        ].map((f) => (
          <div
            key={f.id}
            className="rounded-lg border p-3 transition-all"
            style={{
              borderColor: format === f.id ? f.c : "var(--color-line)",
              background: format === f.id ? `color-mix(in srgb, ${f.c} 8%, transparent)` : "var(--color-surface-2)",
            }}
          >
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">{f.name}</div>
            <div className="font-mono text-lg font-bold" style={{ color: f.c }}>{fmtBytes(f.bytes)}</div>
            <div className="font-mono text-[11px] text-ink-dim mt-0.5">scanned · {fmtCost(f.bytes)} on Athena</div>
          </div>
        ))}
      </div>

      <div className="mt-3 font-mono text-[11px] leading-relaxed" style={{ color: ACCENT }}>
        Parquet scans {fmtBytes(parquetBytes)} vs CSV's {fmtBytes(csvBytes)}, about {saving.toFixed(0)}% less,
        so the same query costs {fmtCost(parquetBytes)} instead of {fmtCost(csvBytes)}. Columnar reads only the
        columns you ask for; stats skip the rows you don't.
      </div>
    </div>
  );
}
