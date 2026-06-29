import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Slowly-changing-dimension visualizer. One customer dimension row (Ada, id 42)
 * starts in Paris. Pick SCD Type 1 / 2 / 3, then apply moves
 * (Paris -> Berlin -> Tokyo) and watch the dimension table evolve:
 *   Type 1 overwrites in place (history lost),
 *   Type 2 closes the old row and inserts a new one with a new surrogate key,
 *   Type 3 keeps a previous-value column (one step of history).
 * Pure illustration, no data.
 */
const ACCENT = "#2ee6a8";

const CITIES = ["Paris", "Berlin", "Tokyo", "Lagos", "Lima"];
const NK = 42; // natural / business key for Ada
const NAME = "Ada";

const TYPES = [
  { id: 1, label: "Type 1" },
  { id: 2, label: "Type 2" },
  { id: 3, label: "Type 3" },
];

const NOTES = {
  1: "Type 1 overwrites the attribute in place. One row, always current, no history. Cheap, but you can never answer 'where did Ada live last year?'",
  2: "Type 2 adds a new row per change with a fresh surrogate key, effective_from / effective_to dates, and an is_current flag. Full history, the interview default.",
  3: "Type 3 adds a previous-value column. You keep exactly one prior value (current plus previous), so it is limited history for an expected single change.",
};

// each Type starts from the same initial state and applies the move list
function buildType1(moves) {
  const city = moves.length ? moves[moves.length - 1] : "Paris";
  return [{ sk: 1, nk: NK, name: NAME, city }];
}

function buildType2(moves) {
  // start row, then one closed row per change plus one open current row
  const cities = ["Paris", ...moves];
  const dates = ["2021-01-01", "2023-04-01", "2024-09-01", "2025-12-01", "2026-06-01"];
  return cities.map((city, i) => {
    const isLast = i === cities.length - 1;
    return {
      sk: i + 1,
      nk: NK,
      name: NAME,
      city,
      from: dates[i] || "2026-01-01",
      to: isLast ? "9999-12-31" : dates[i + 1] || "2026-01-01",
      current: isLast,
    };
  });
}

function buildType3(moves) {
  const city = moves.length ? moves[moves.length - 1] : "Paris";
  const prev = moves.length > 1 ? moves[moves.length - 2] : "Paris";
  return [{ sk: 1, nk: NK, name: NAME, currentCity: city, previousCity: moves.length ? prev : null }];
}

function HeadRow({ cols }) {
  return (
    <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-ink-faint">
      {cols.map((c) => (
        <th key={c} className="py-1.5 pr-3 font-normal whitespace-nowrap">{c}</th>
      ))}
    </tr>
  );
}

function Cell({ children, hi }) {
  return (
    <td
      className="py-1.5 pr-3 font-mono text-[12px] whitespace-nowrap"
      style={hi ? { color: ACCENT } : undefined}
    >
      {children}
    </td>
  );
}

export default function ScdViz() {
  const [type, setType] = useState(2);
  const [moves, setMoves] = useState([]); // ordered list of new cities Ada moved to

  const nextCity = CITIES[(moves.length + 1) % CITIES.length]; // Berlin, Tokyo, ...
  const canMove = moves.length < CITIES.length - 1;

  const applyMove = () => {
    if (!canMove) return;
    setMoves((m) => [...m, nextCity]);
  };
  const reset = () => setMoves([]);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* type picker */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="font-mono text-[11px] text-ink-faint mr-1">SCD type</span>
        {TYPES.map((t) => (
          <Btn key={t.id} variant={type === t.id ? "solid" : "ghost"} tone={ACCENT} onClick={() => setType(t.id)}>
            {t.label}
          </Btn>
        ))}
      </div>

      {/* move controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Btn tone={ACCENT} onClick={applyMove} disabled={!canMove}>
          {`Ada moves to ${nextCity}`}
        </Btn>
        <Btn variant="ghost" tone={ACCENT} onClick={reset}>
          reset
        </Btn>
        <span className="font-mono text-[11px] text-ink-faint">
          {moves.length === 0
            ? "Ada lives in Paris (the base row)"
            : `path: Paris -> ${moves.join(" -> ")}`}
        </span>
      </div>

      {/* the resulting dimension table */}
      <div className="font-mono text-[11px] text-ink-faint mb-1">dim_customer</div>
      <div className="rounded-lg border border-line bg-surface-2 p-3 overflow-x-auto mb-3">
        <table className="w-full border-collapse">
          {type === 1 && (
            <>
              <thead>
                <HeadRow cols={["customer_sk", "customer_id", "name", "city"]} />
              </thead>
              <tbody>
                {buildType1(moves).map((r) => (
                  <tr key={r.sk} className="border-t border-line">
                    <Cell>{r.sk}</Cell>
                    <Cell>{r.nk}</Cell>
                    <Cell>{r.name}</Cell>
                    <Cell hi>{r.city}</Cell>
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {type === 2 && (
            <>
              <thead>
                <HeadRow cols={["customer_sk", "customer_id", "name", "city", "effective_from", "effective_to", "is_current"]} />
              </thead>
              <tbody>
                {buildType2(moves).map((r) => (
                  <tr key={r.sk} className="border-t border-line" style={r.current ? { background: `color-mix(in srgb, ${ACCENT} 7%, transparent)` } : undefined}>
                    <Cell hi={r.current}>{r.sk}</Cell>
                    <Cell>{r.nk}</Cell>
                    <Cell>{r.name}</Cell>
                    <Cell hi={r.current}>{r.city}</Cell>
                    <Cell>{r.from}</Cell>
                    <Cell>{r.to}</Cell>
                    <Cell hi={r.current}>{r.current ? "true" : "false"}</Cell>
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {type === 3 && (
            <>
              <thead>
                <HeadRow cols={["customer_sk", "customer_id", "name", "current_city", "previous_city"]} />
              </thead>
              <tbody>
                {buildType3(moves).map((r) => (
                  <tr key={r.sk} className="border-t border-line">
                    <Cell>{r.sk}</Cell>
                    <Cell>{r.nk}</Cell>
                    <Cell>{r.name}</Cell>
                    <Cell hi>{r.currentCity}</Cell>
                    <Cell>{r.previousCity ?? "(none)"}</Cell>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>

      {/* row count + behaviour note */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-ink-faint mb-2">
        <span>
          rows in dimension: <span style={{ color: ACCENT }}>{type === 2 ? buildType2(moves).length : 1}</span>
        </span>
        <span>moves applied: {moves.length}</span>
        {type === 2 && <span>(one closed row per change, plus the open current row)</span>}
      </div>
      <div className="text-[12px] text-ink-dim leading-snug">{NOTES[type]}</div>
    </div>
  );
}
