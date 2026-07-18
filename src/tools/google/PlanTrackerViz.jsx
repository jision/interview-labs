import React, { useEffect, useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * PlanTrackerViz, a persistent tracker for the 21-day plan.
 * 21 days x 3 dimensions (coding / design / leadership) = 63 cells, plus a
 * mocks-scored counter and an error-log-entries counter. State persists under
 * "il-google-plan"; every storage access is wrapped in try/catch and the
 * initial state is lazy-loaded, so the widget never crashes if storage is
 * unavailable. Default export.
 */
const ACCENT = "#4285F4";
const KEY = "il-google-plan";

const WEEKS = [
  { label: "Week 1 · foundations", days: [1, 2, 3, 4, 5, 6, 7] },
  { label: "Week 2 · distributed depth", days: [8, 9, 10, 11, 12, 13, 14] },
  { label: "Week 3 · simulation", days: [15, 16, 17, 18, 19, 20, 21] },
];
const DIMS = [
  { id: "coding", short: "C", label: "coding" },
  { id: "design", short: "D", label: "design" },
  { id: "leadership", short: "L", label: "leadership" },
];
const TOTAL_CELLS = 21 * DIMS.length; // 63

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        checks: p && typeof p.checks === "object" && p.checks ? p.checks : {},
        mocks: Number.isFinite(p && p.mocks) ? p.mocks : 0,
        errors: Number.isFinite(p && p.errors) ? p.errors : 0,
      };
    }
  } catch (e) {
    /* storage unavailable or corrupt, fall through to defaults */
  }
  return { checks: {}, mocks: 0, errors: 0 };
}

export default function PlanTrackerViz() {
  const [state, setState] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore write failures, tracker still works in-session */
    }
  }, [state]);

  const { checks, mocks, errors } = state;
  const doneCount = Object.keys(checks).filter((k) => checks[k]).length;
  const pct = Math.round((doneCount / TOTAL_CELLS) * 100);

  function toggle(day, dim) {
    const k = `${day}-${dim}`;
    setState((s) => {
      const next = { ...s.checks };
      if (next[k]) delete next[k];
      else next[k] = true;
      return { ...s, checks: next };
    });
  }
  function bump(field, delta) {
    setState((s) => ({ ...s, [field]: Math.max(0, (s[field] || 0) + delta) }));
  }
  function reset() {
    setState({ checks: {}, mocks: 0, errors: 0 });
  }

  function dayDone(day) {
    return DIMS.every((d) => checks[`${day}-${d.id}`]);
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* summary bar */}
      <div className="flex justify-between font-mono text-[11px] text-ink-faint mb-1">
        <span>plan complete</span>
        <span>
          <span style={{ color: ACCENT }}>{doneCount}</span> / {TOTAL_CELLS} cells ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden mb-4">
        <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, background: ACCENT }} />
      </div>

      {/* counters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {[
          { field: "mocks", label: "mocks scored", value: mocks },
          { field: "errors", label: "error-log entries", value: errors },
        ].map((c) => (
          <div key={c.field} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2">
            <span className="font-mono text-[11px] text-ink-dim">{c.label}</span>
            <button
              onClick={() => bump(c.field, -1)}
              className="font-mono text-sm w-6 h-6 rounded border border-line-strong text-ink-dim hover:text-ink transition-colors"
            >
              -
            </button>
            <span className="font-mono text-sm font-bold w-6 text-center" style={{ color: ACCENT }}>
              {c.value}
            </span>
            <button
              onClick={() => bump(c.field, 1)}
              className="font-mono text-sm w-6 h-6 rounded border border-line-strong text-ink-dim hover:text-ink transition-colors"
            >
              +
            </button>
          </div>
        ))}
      </div>

      {/* weeks */}
      <div className="space-y-4">
        {WEEKS.map((w) => (
          <div key={w.label}>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">{w.label}</div>
            <div className="space-y-1.5">
              {w.days.map((day) => {
                const done = dayDone(day);
                return (
                  <div key={day} className="flex items-center gap-2">
                    <span
                      className="font-mono text-[11px] w-9 flex-none"
                      style={{ color: done ? ACCENT : "var(--color-ink-faint)" }}
                    >
                      {done ? "✓" : ""} D{day}
                    </span>
                    <div className="flex gap-1.5">
                      {DIMS.map((d) => {
                        const on = !!checks[`${day}-${d.id}`];
                        return (
                          <button
                            key={d.id}
                            onClick={() => toggle(day, d.id)}
                            title={d.label}
                            className="font-mono text-[11px] font-semibold w-7 h-7 rounded border transition-all select-none"
                            style={
                              on
                                ? {
                                    borderColor: ACCENT,
                                    color: ACCENT,
                                    background: "color-mix(in srgb, " + ACCENT + " 14%, transparent)",
                                  }
                                : { borderColor: "var(--color-line)", color: "var(--color-ink-faint)" }
                            }
                          >
                            {d.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Btn variant="ghost" onClick={reset}>
          ↻ reset tracker
        </Btn>
        <span className="font-mono text-[10px] text-ink-faint ml-auto">
          C coding · D design · L leadership, a day is done when all three are green
        </span>
      </div>
    </div>
  );
}
