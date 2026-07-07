import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Strangler-fig migration visualizer. A legacy monolith exposes six capabilities
 * behind a facade/proxy. "Migrate next" peels one capability out to its own service
 * and re-points the facade route at it; "rollback last" flips the most recent route
 * back to the monolith. The facade owning routing is what makes each cutover reversible.
 */
const ACCENT = "#2fbf8f";
const LEGACY = "#8b93a7";

const CAPS = [
  { id: "auth", label: "Users & Auth" },
  { id: "catalog", label: "Catalog" },
  { id: "orders", label: "Orders" },
  { id: "payments", label: "Payments" },
  { id: "search", label: "Search" },
  { id: "notify", label: "Notifications" },
];

export default function StranglerFigViz() {
  // stack of migrated capability ids, in the order they were peeled off
  const [done, setDone] = useState([]);

  const total = CAPS.length;
  const migrated = done.length;
  const pct = Math.round((migrated / total) * 100);

  function migrateNext() {
    const next = CAPS.find((c) => !done.includes(c.id));
    if (next) setDone([...done, next.id]);
  }
  function rollbackLast() {
    setDone(done.slice(0, -1));
  }
  function reset() {
    setDone([]);
  }

  const remaining = CAPS.filter((c) => !done.includes(c.id));
  const lastId = done[done.length - 1];

  let note;
  if (migrated === 0) {
    note = "Everything still runs in the monolith. The facade is in place but every route points at the legacy system, the safe starting state before you peel anything off.";
  } else if (migrated === total) {
    note = "Every capability has been strangled out. The monolith is now dead code, decommission it, and you can optionally retire the facade once callers point straight at the services.";
  } else {
    note = `${migrated} of ${total} capabilities now run as standalone services. The facade routes each caller to the right place; the rest still hit the monolith, and no caller had to change.`;
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Btn tone={ACCENT} onClick={migrateNext} disabled={migrated === total}>
          migrate next capability →
        </Btn>
        <Btn variant="ghost" onClick={rollbackLast} disabled={migrated === 0}>
          ↩ rollback last
        </Btn>
        <Btn variant="ghost" onClick={reset} disabled={migrated === 0}>
          reset
        </Btn>
      </div>

      {/* progress */}
      <div className="flex justify-between font-mono text-[11px] mb-1">
        <span className="text-ink-dim">migrated</span>
        <span style={{ color: ACCENT }}>{migrated} / {total} · {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden mb-4">
        <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, background: ACCENT }} />
      </div>

      {/* facade */}
      <div className="rounded-lg border border-line-strong bg-surface-2 p-3 mb-3 text-center">
        <div className="font-mono text-[11px] font-semibold text-ink">Facade / routing proxy</div>
        <div className="font-mono text-[10px] text-ink-faint mt-0.5">
          one stable interface, callers never learn what moved
        </div>
      </div>

      {/* routing table: where the facade sends each capability */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">facade routing table</div>
      <div className="space-y-1.5 mb-4">
        {CAPS.map((c) => {
          const isDone = done.includes(c.id);
          const isLast = c.id === lastId;
          const color = isDone ? ACCENT : LEGACY;
          return (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-md border px-3 py-1.5"
              style={{
                borderColor: isLast ? ACCENT : "var(--color-line)",
                background: isLast ? "color-mix(in srgb, " + ACCENT + " 8%, transparent)" : "transparent",
              }}
            >
              <span className="font-mono text-[12px] text-ink">{c.label}</span>
              <span className="font-mono text-[11px] flex items-center gap-1.5" style={{ color }}>
                →&nbsp;{isDone ? "new service" : "monolith"}
                {isLast && <span className="text-[9px] text-ink-faint">(last cutover)</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* the two homes */}
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg border p-3" style={{ borderColor: LEGACY }}>
          <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: LEGACY }}>
            legacy monolith
          </div>
          {remaining.length === 0 ? (
            <div className="font-mono text-[11px] text-ink-faint">empty, safe to decommission</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {remaining.map((c) => (
                <span key={c.id} className="font-mono text-[11px] rounded px-2 py-1" style={{ color: LEGACY, background: "color-mix(in srgb, " + LEGACY + " 12%, transparent)" }}>
                  {c.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: ACCENT }}>
          <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: ACCENT }}>
            extracted services
          </div>
          {done.length === 0 ? (
            <div className="font-mono text-[11px] text-ink-faint">none yet</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {done.map((id) => (
                <span key={id} className="font-mono text-[11px] rounded px-2 py-1" style={{ color: ACCENT, background: "color-mix(in srgb, " + ACCENT + " 12%, transparent)" }}>
                  {LABEL(id)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="font-mono text-[11px] text-ink-faint leading-relaxed">{note}</div>
    </div>
  );
}

function LABEL(id) {
  const c = CAPS.find((x) => x.id === id);
  return c ? c.label : id;
}
