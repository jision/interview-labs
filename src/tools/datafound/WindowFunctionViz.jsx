import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Window-function visualizer. A small fixture of sales rows (region, month, sales).
 * Pick a function and watch a new computed column appear PER ROW, computed
 * OVER (PARTITION BY region ORDER BY month). The point: windows add a column
 * without collapsing rows, and the computation RESETS at every partition boundary.
 */
const ACCENT = "#b388ff";

// region color so the PARTITION BY groups read at a glance
const REGION_TONE = {
  East: "#60a5fa",
  West: "#f59e0b",
};

// fixture, already sorted by region then month so partitions are contiguous
const ROWS = [
  { region: "East", month: "2024-01", sales: 100 },
  { region: "East", month: "2024-02", sales: 140 },
  { region: "East", month: "2024-03", sales: 90 },
  { region: "East", month: "2024-04", sales: 140 },
  { region: "West", month: "2024-01", sales: 200 },
  { region: "West", month: "2024-02", sales: 120 },
  { region: "West", month: "2024-03", sales: 180 },
  { region: "West", month: "2024-04", sales: 180 },
];

const FUNCS = [
  { id: "row_number", label: "ROW_NUMBER()" },
  { id: "rank", label: "RANK()" },
  { id: "sum", label: "running SUM" },
  { id: "lag", label: "LAG(sales)" },
];

const META = {
  row_number: {
    col: "row_number",
    expr: "ROW_NUMBER() OVER (PARTITION BY region ORDER BY month)",
    note: "1, 2, 3, ... a unique sequence inside each partition. The classic dedup tool: keep WHERE row_number = 1.",
  },
  rank: {
    col: "rank",
    expr: "RANK() OVER (PARTITION BY region ORDER BY sales DESC)",
    note: "Ranks by sales within the region; ties share a rank and the next rank SKIPS (1, 1, 3). DENSE_RANK would not skip.",
  },
  sum: {
    col: "running_total",
    expr: "SUM(sales) OVER (PARTITION BY region ORDER BY month\n                  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)",
    note: "A running total: each row adds itself to everything before it in the partition, and it RESETS to 0 at the next region.",
  },
  lag: {
    col: "prev_sales",
    expr: "LAG(sales, 1) OVER (PARTITION BY region ORDER BY month)",
    note: "Pulls the previous row's value into this row, the basis for period-over-period deltas. The first row of each partition has no prior, so it is null.",
  },
};

// compute the derived column for a given function over the fixture
function computeColumn(funcId) {
  const out = ROWS.map((r) => ({ ...r, val: null }));

  if (funcId === "row_number") {
    let n = 0;
    let prev = null;
    out.forEach((r) => {
      if (r.region !== prev) {
        n = 0;
        prev = r.region;
      }
      r.val = ++n;
    });
  } else if (funcId === "rank") {
    // rank by sales DESC inside each region; ties share a rank, next rank skips
    const byRegion = {};
    out.forEach((r) => {
      (byRegion[r.region] = byRegion[r.region] || []).push(r);
    });
    Object.values(byRegion).forEach((group) => {
      const sorted = [...group].sort((a, b) => b.sales - a.sales);
      let rank = 0;
      let seen = 0;
      let lastSales = null;
      sorted.forEach((r) => {
        seen++;
        if (r.sales !== lastSales) {
          rank = seen;
          lastSales = r.sales;
        }
        r.val = rank;
      });
    });
  } else if (funcId === "sum") {
    let acc = 0;
    let prev = null;
    out.forEach((r) => {
      if (r.region !== prev) {
        acc = 0;
        prev = r.region;
      }
      acc += r.sales;
      r.val = acc;
    });
  } else if (funcId === "lag") {
    let prevRegion = null;
    let prevSales = null;
    out.forEach((r) => {
      if (r.region !== prevRegion) {
        r.val = null;
        prevRegion = r.region;
      } else {
        r.val = prevSales;
      }
      prevSales = r.sales;
    });
  }
  return out;
}

export default function WindowFunctionViz() {
  const [func, setFunc] = useState("row_number");
  const m = META[func];
  const rows = computeColumn(func);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* function picker */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-mono text-[11px] text-ink-faint mr-1">window fn</span>
        {FUNCS.map((f) => (
          <Btn key={f.id} variant={func === f.id ? "solid" : "ghost"} tone={ACCENT} onClick={() => setFunc(f.id)}>
            {f.label}
          </Btn>
        ))}
      </div>

      {/* the table, with a separator + tint per PARTITION BY region */}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-faint bg-surface-2">
              <th className="py-2 px-3 font-normal">region</th>
              <th className="py-2 px-3 font-normal">month</th>
              <th className="py-2 px-3 font-normal text-right">sales</th>
              <th className="py-2 px-3 font-normal text-right" style={{ color: ACCENT }}>
                {m.col}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const tone = REGION_TONE[r.region] || ACCENT;
              const firstOfPartition = i === 0 || rows[i - 1].region !== r.region;
              return (
                <tr
                  key={i}
                  className="align-top"
                  style={{
                    borderTop: firstOfPartition && i !== 0 ? "2px solid var(--color-line-strong)" : "1px solid var(--color-line)",
                    background: `color-mix(in srgb, ${tone} 6%, transparent)`,
                  }}
                >
                  <td className="py-2 px-3 font-mono">
                    {firstOfPartition ? (
                      <span style={{ color: tone }}>{r.region}</span>
                    ) : (
                      <span className="text-ink-faint">{r.region}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono text-ink-dim">{r.month}</td>
                  <td className="py-2 px-3 font-mono text-ink-dim text-right">{r.sales}</td>
                  <td className="py-2 px-3 font-mono text-right">
                    <span
                      className="inline-block px-2 py-0.5 rounded font-semibold"
                      style={{
                        color: r.val === null ? "var(--color-ink-faint)" : ACCENT,
                        background: r.val === null ? "transparent" : `color-mix(in srgb, ${ACCENT} 14%, transparent)`,
                      }}
                    >
                      {r.val === null ? "null" : r.val}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* partition legend */}
      <div className="flex flex-wrap gap-3 mt-2 font-mono text-[10px] text-ink-faint">
        <span>PARTITION BY region:</span>
        {Object.entries(REGION_TONE).map(([region, tone]) => (
          <span key={region} style={{ color: tone }}>
            <span aria-hidden>{"■"}</span> {region}
          </span>
        ))}
        <span className="text-ink-faint">(thick line = partition resets)</span>
      </div>

      {/* the SQL that produced the column, updates with the choice */}
      <div className="mt-4 rounded-lg overflow-hidden border border-line bg-[#0e1018]">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-line bg-surface-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">sql</span>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f87171]/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80]/60" />
          </div>
        </div>
        <pre className="overflow-x-auto p-3.5 text-[12px] leading-[1.65] font-mono text-ink whitespace-pre">
{`SELECT region, month, sales,
       ${m.expr} AS ${m.col}
FROM   sales;`}
        </pre>
      </div>

      <div className="mt-3 font-mono text-[11px] text-ink-faint leading-relaxed">{m.note}</div>
      <div className="mt-2 text-[12px] text-ink-dim leading-relaxed">
        Note the row count never changes: a window function ADDS a column, it does not collapse rows the way GROUP BY would.
      </div>
    </div>
  );
}
