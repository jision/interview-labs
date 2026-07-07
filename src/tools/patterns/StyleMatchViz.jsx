import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Architecture-style matcher. Flip four requirement toggles and it recommends
 * a modular monolith, microservices, or an event-driven style, with a one-line
 * rationale tied to the inputs. A teaching aid for "what drives the topology",
 * not a substitute for judgment.
 */
const ACCENT = "#f26d9c";

const TOGGLES = [
  { id: "largeTeam", off: "One small team", on: "Many autonomous teams", label: "team shape" },
  { id: "independentDeploy", off: "One release train is fine", on: "Independent deploys needed", label: "deploy cadence" },
  { id: "isolatedScaling", off: "Load is fairly uniform", on: "Hot spots need isolated scaling", label: "scaling profile" },
  { id: "eventHeavy", off: "Request/response flows", on: "Event-heavy, many reactors", label: "interaction style" },
];

const REC = {
  monolith: {
    name: "Modular Monolith",
    color: "#4ade80",
    line: "One deployable, hard module boundaries inside. The default: keep the boundaries, skip the network.",
  },
  micro: {
    name: "Microservices",
    color: "#60a5fa",
    line: "Independent services per capability. Justified when team autonomy and independent scaling outweigh the distributed-systems tax.",
  },
  eventdriven: {
    name: "Event-driven",
    color: ACCENT,
    line: "Model the system around events. With many teams or consumers that means a broker; for a single small team, in-process or outbox domain events give the same decoupling without the distribution tax.",
  },
};

function recommend({ largeTeam, independentDeploy, isolatedScaling, eventHeavy }) {
  if (eventHeavy) return "eventdriven";
  const signals = [largeTeam, independentDeploy, isolatedScaling].filter(Boolean).length;
  return signals >= 2 ? "micro" : "monolith";
}

function rationale(id, s) {
  if (id === "eventdriven")
    return "The domain is event-heavy with many independent reactors, so events decouple producers from consumers better than direct calls, via a broker when it is distributed, or in-process events inside a modular monolith when it is not.";
  if (id === "micro") {
    const drivers = [];
    if (s.largeTeam) drivers.push("many teams needing autonomy");
    if (s.independentDeploy) drivers.push("independent deploy cadence");
    if (s.isolatedScaling) drivers.push("hot spots that must scale on their own");
    return `Two or more forces point past a monolith: ${drivers.join(", ")}. Those justify paying the operational tax of separate services.`;
  }
  return "Fewer than two split-driving forces are active yet. Start with a modular monolith and extract a service only when a real boundary earns it.";
}

export default function StyleMatchViz() {
  const [s, setS] = useState({
    largeTeam: false,
    independentDeploy: false,
    isolatedScaling: false,
    eventHeavy: false,
  });

  const recId = recommend(s);
  const rec = REC[recId];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* toggles */}
      <div className="space-y-2 mb-4">
        {TOGGLES.map((t) => {
          const on = s[t.id];
          return (
            <div key={t.id} className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint w-28 flex-none">
                {t.label}
              </span>
              <button
                onClick={() => setS((prev) => ({ ...prev, [t.id]: !prev[t.id] }))}
                className="flex-1 min-w-0 rounded-lg border px-3 py-2 text-left transition-all duration-200"
                style={{
                  borderColor: on ? ACCENT : "var(--color-line)",
                  background: on ? `color-mix(in srgb, ${ACCENT} 12%, transparent)` : "transparent",
                }}
              >
                <span className="text-[12px] text-ink-dim">
                  {on ? t.on : t.off}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* recommendation */}
      <div
        className="rounded-lg border p-3.5"
        style={{ borderColor: rec.color, background: `color-mix(in srgb, ${rec.color} 10%, transparent)` }}
      >
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">recommended style</div>
        <div className="text-[15px] font-bold mb-1.5" style={{ color: rec.color }}>{rec.name}</div>
        <div className="text-[12px] text-ink-dim leading-relaxed mb-2">{rec.line}</div>
        <div className="text-[12px] text-ink-dim leading-relaxed border-t border-line pt-2">
          <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: rec.color }}>why</span>
          {rationale(recId, s)}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Btn
          variant="ghost"
          onClick={() => setS({ largeTeam: false, independentDeploy: false, isolatedScaling: false, eventHeavy: false })}
        >
          reset toggles
        </Btn>
      </div>
    </div>
  );
}
