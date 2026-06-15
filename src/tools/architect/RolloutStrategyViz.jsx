import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Rollout-strategy selector — pick shadow / canary / blue-green / A·B and see
 * how live traffic splits between the current model (v1) and the new one (v2),
 * plus the risk / rollback / what-it-measures trade-offs. No data — pure illustration.
 */
const ACCENT = "#fb6f3c";
const V1 = "#60a5fa"; // current model
const V2 = ACCENT; // new model

const STRATS = [
  { id: "shadow", label: "Shadow" },
  { id: "canary", label: "Canary" },
  { id: "bluegreen", label: "Blue-green" },
  { id: "ab", label: "A/B test" },
];

const META = {
  shadow: {
    risk: "none — users never see v2",
    rollback: "n/a (nothing is live)",
    measures: "offline diff vs the current model",
    use: "De-risk a new model on real traffic before a single user is served by it.",
  },
  canary: {
    risk: "low — small blast radius",
    rollback: "fast — drop the % back to 0",
    measures: "live guardrail metrics (errors, p95, KPI)",
    use: "The standard live rollout: ramp 1% → 100%, watching metrics at each step.",
  },
  bluegreen: {
    risk: "medium — everyone flips at once",
    rollback: "instant — flip back to blue",
    measures: "post-switch health",
    use: "Two full environments; cut all traffic over at once, flip back instantly on trouble.",
  },
  ab: {
    risk: "low–medium — half are on v2",
    rollback: "fast — end the test",
    measures: "the business KPI per arm, with statistics",
    use: "The only true test — compare the real business metric (CTR, conversion) across arms.",
  },
};

export default function RolloutStrategyViz() {
  const [strat, setStrat] = useState("canary");
  const [canaryPct, setCanaryPct] = useState(5);
  const [switched, setSwitched] = useState(false);

  // % of live user traffic actually SERVED by the new model (v2)
  const served =
    strat === "shadow" ? 0 :
    strat === "canary" ? canaryPct :
    strat === "bluegreen" ? (switched ? 100 : 0) :
    /* ab */ 50;
  const m = META[strat];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* strategy picker */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-mono text-[11px] text-ink-faint mr-1">strategy</span>
        {STRATS.map((s) => (
          <Btn key={s.id} variant={strat === s.id ? "solid" : "ghost"} tone={ACCENT} onClick={() => setStrat(s.id)}>
            {s.label}
          </Btn>
        ))}
      </div>

      {/* live traffic split */}
      <div className="font-mono text-[11px] text-ink-faint mb-1">live user traffic</div>
      <div className="h-7 rounded-lg overflow-hidden flex border border-line mb-1">
        <div className="flex items-center justify-center transition-all duration-300" style={{ width: `${100 - served}%`, background: `color-mix(in srgb, ${V1} 30%, transparent)` }}>
          {100 - served >= 12 && <span className="font-mono text-[10px]" style={{ color: V1 }}>v1 · {100 - served}%</span>}
        </div>
        <div className="flex items-center justify-center transition-all duration-300" style={{ width: `${served}%`, background: `color-mix(in srgb, ${V2} 35%, transparent)` }}>
          {served >= 12 && <span className="font-mono text-[10px]" style={{ color: V2 }}>v2 · {served}%</span>}
        </div>
      </div>
      <div className="flex justify-between font-mono text-[10px] text-ink-faint mb-3">
        <span><span style={{ color: V1 }}>■</span> v1 current</span>
        <span>v2 new <span style={{ color: V2 }}>■</span></span>
      </div>

      {/* shadow: show the mirrored-but-not-served lane */}
      {strat === "shadow" && (
        <div className="mb-3">
          <div className="font-mono text-[11px] text-ink-faint mb-1">v2 receives a mirrored copy — responses discarded</div>
          <div className="h-4 rounded-lg border border-dashed mb-1" style={{ borderColor: V2, background: `color-mix(in srgb, ${V2} 10%, transparent)` }} />
          <div className="font-mono text-[10px] text-ink-faint">100% mirrored · 0% served — compare v2's answers to v1 offline, zero user risk.</div>
        </div>
      )}

      {/* canary: ramp control */}
      {strat === "canary" && (
        <div className="mb-3">
          <div className="flex justify-between font-mono text-[11px] mb-1">
            <span className="text-ink-dim">canary traffic to v2</span>
            <span style={{ color: ACCENT }}>{canaryPct}%</span>
          </div>
          <input type="range" min={1} max={100} step={1} value={canaryPct}
            onChange={(e) => setCanaryPct(parseInt(e.target.value, 10))}
            className="w-full" style={{ accentColor: ACCENT }} />
          <div className="font-mono text-[10px] text-ink-faint mt-1">Ramp up only while the guardrail metrics stay green — pull it back to 0 the moment they don't.</div>
        </div>
      )}

      {/* blue-green: the switch */}
      {strat === "bluegreen" && (
        <div className="mb-3 flex items-center gap-3">
          <Btn tone={ACCENT} variant={switched ? "ghost" : "solid"} onClick={() => setSwitched((v) => !v)}>
            {switched ? "↩ flip back to blue (v1)" : "⇄ flip traffic to green (v2)"}
          </Btn>
          <span className="font-mono text-[11px] text-ink-faint">
            {switched ? "all traffic on v2 — rollback is one flip away" : "all traffic on v1; v2 is warm and ready"}
          </span>
        </div>
      )}

      {/* trade-off stats */}
      <div className="grid sm:grid-cols-3 gap-2 mt-3">
        {[
          ["user risk", m.risk],
          ["rollback", m.rollback],
          ["measures", m.measures],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-surface-2 p-2.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">{k}</div>
            <div className="text-[12px] text-ink-dim leading-snug">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 font-mono text-[11px] text-ink-faint leading-relaxed">{m.use}</div>
    </div>
  );
}
