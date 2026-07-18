import React, { useState, useEffect } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * StoryMatrixViz, a local planning aid for the Staff story matrix.
 * Eight story slots; for each, a one-line "which experience" and three
 * checks (metric? / a decision I owned? / a reflection?). The top bar is
 * the share of slots that are filled AND fully checked. State persists in
 * localStorage under "il-google-stories"; every access is wrapped in
 * try/catch so a blocked or unavailable store never crashes the widget.
 * The text you type stays on this device only.
 */
const ACCENT = "#A142F4";
const KEY = "il-google-stories";

const SLOTS = [
  { id: "noowner", label: "Ambiguous problem, no owner" },
  { id: "align", label: "Cross-team architectural alignment" },
  { id: "disagree", label: "Strong technical disagreement" },
  { id: "failure", label: "Production failure" },
  { id: "wrong", label: "A decision that proved wrong" },
  { id: "influence", label: "Influence without authority" },
  { id: "mentor", label: "Mentoring / raising the bar" },
  { id: "tradeoff", label: "Business-vs-technical trade-off" },
];

const CHECKS = [
  { key: "metric", label: "metric" },
  { key: "decision", label: "decision I owned" },
  { key: "reflection", label: "reflection" },
];

function emptyState() {
  const s = {};
  SLOTS.forEach((slot) => {
    s[slot.id] = { text: "", metric: false, decision: false, reflection: false };
  });
  return s;
}

/* Lazy loader: read once from storage, coercing every field so a corrupt or
   partial payload can never throw or poison the UI. */
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    const base = emptyState();
    SLOTS.forEach((slot) => {
      const row = parsed && parsed[slot.id];
      if (row && typeof row === "object") {
        base[slot.id] = {
          text: typeof row.text === "string" ? row.text : "",
          metric: !!row.metric,
          decision: !!row.decision,
          reflection: !!row.reflection,
        };
      }
    });
    return base;
  } catch {
    return emptyState();
  }
}

function slotComplete(row) {
  return !!row && row.text.trim() !== "" && row.metric && row.decision && row.reflection;
}

export default function StoryMatrixViz() {
  const [state, setState] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable, keep working in memory */
    }
  }, [state]);

  function setText(id, text) {
    setState((s) => ({ ...s, [id]: { ...s[id], text } }));
  }
  function toggle(id, key) {
    setState((s) => ({ ...s, [id]: { ...s[id], [key]: !s[id][key] } }));
  }
  function reset() {
    setState(emptyState());
  }

  const complete = SLOTS.filter((slot) => slotComplete(state[slot.id])).length;
  const pct = Math.round((complete / SLOTS.length) * 100);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* completeness bar */}
      <div className="flex items-center justify-between gap-3 mb-1.5 font-mono text-[11px] text-ink-faint">
        <span>
          interview-ready slots{" "}
          <span className="text-ink font-semibold">{complete}</span> / {SLOTS.length}
        </span>
        <span style={{ color: ACCENT }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mb-4">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${pct}%`, background: ACCENT }}
        />
      </div>

      <div className="space-y-2.5">
        {SLOTS.map((slot) => {
          const row = state[slot.id];
          const done = slotComplete(row);
          return (
            <div
              key={slot.id}
              className="rounded-lg border bg-surface-2 p-3"
              style={{ borderColor: done ? ACCENT : "var(--color-line)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="font-mono text-[11px]"
                  style={{ color: done ? ACCENT : "var(--color-ink-faint)" }}
                >
                  {done ? "✓" : "○"}
                </span>
                <span className="text-[13px] font-semibold text-ink">{slot.label}</span>
              </div>
              <input
                value={row.text}
                onChange={(e) => setText(slot.id, e.target.value)}
                placeholder="which experience? one line..."
                className="w-full bg-surface border border-line rounded-md px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-line-strong mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {CHECKS.map((c) => {
                  const on = row[c.key];
                  return (
                    <button
                      key={c.key}
                      onClick={() => toggle(slot.id, c.key)}
                      className="font-mono text-[10px] px-2 py-1 rounded border transition-all select-none"
                      style={
                        on
                          ? {
                              borderColor: ACCENT,
                              color: ACCENT,
                              background: "color-mix(in srgb, " + ACCENT + " 12%, transparent)",
                            }
                          : { borderColor: "var(--color-line)", color: "var(--color-ink-faint)" }
                      }
                    >
                      {on ? "✓ " : ""}
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-ink-faint leading-relaxed max-w-md">
          a slot counts only when it has a story, a metric, a decision you owned, and a reflection. saved on
          this device only.
        </span>
        <Btn variant="ghost" onClick={reset}>
          reset
        </Btn>
      </div>
    </div>
  );
}
