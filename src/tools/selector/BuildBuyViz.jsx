import React, { useState } from "react";

/*
 * Build vs buy — API (closed) vs self-host (open model) decider.
 * Live recommendation from volume, data sensitivity, latency need, and
 * whether the team has MLOps capacity. Pure decision logic; the volume
 * break-even is a baked rough threshold.
 */
const ACCENT = "#ffb703";

// Rough monthly-request break-even where amortized GPUs beat per-token API spend.
const BREAK_EVEN = 30_000_000; // ~30M req/mo of steady traffic

const RECS = {
  api: { title: "Hosted API", color: "#00b4d8" },
  self: { title: "Self-host open model", color: "#4ade80" },
  hybrid: { title: "Hybrid (API now, plan self-host)", color: "#fb6f3c" },
};

function decide({ volume, strict, latency, mlops }) {
  const reasons = [];

  // Strict data residency is a near-hard pull toward self-host.
  if (strict) {
    if (!mlops) {
      reasons.push("Strict data sensitivity wants self-host, but you have no MLOps capacity");
      reasons.push("Bridge with a VPC/zero-retention API tier or a private deployment while you build the team");
      return { rec: "hybrid", reasons };
    }
    reasons.push("Strict data sensitivity keeps inference in your VPC");
    reasons.push("You have MLOps capacity to own serving and upgrades");
    if (volume < BREAK_EVEN)
      reasons.push("Volume is below break-even, but compliance overrides the cost math");
    return { rec: "self", reasons };
  }

  // No MLOps → API, regardless of volume.
  if (!mlops) {
    reasons.push("No MLOps capacity — owning GPUs, scaling, and upgrades isn't realistic yet");
    reasons.push("Hosted API ships now with zero ops burden");
    if (volume >= BREAK_EVEN)
      reasons.push("Volume is past break-even — revisit self-host once you can staff the ops");
    return { rec: "api", reasons };
  }

  // Have MLOps, standard data — pivot on volume and latency.
  if (volume >= BREAK_EVEN) {
    reasons.push("High, steady volume past the break-even — amortized GPUs beat per-token API spend");
    reasons.push("You have the MLOps capacity to keep the fleet busy");
    if (latency === "tight")
      reasons.push("Self-host also lets you co-locate and shave network round-trips for the tight SLO");
    return { rec: "self", reasons };
  }

  reasons.push("Volume is below the self-host break-even — fixed GPU cost wouldn't pay off");
  reasons.push("Hosted API keeps cost variable and avoids idle-GPU loss");
  if (latency === "tight")
    reasons.push("Watch p95 from the network hop; cache and stream to hold the tight SLO");
  return { rec: "api", reasons };
}

function fmtVolume(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}

function Toggle({ label, on, onChange, offText, onText }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1.5">
        {label}
      </div>
      <div className="flex gap-1.5">
        {[
          { v: false, t: offText },
          { v: true, t: onText },
        ].map((o) => {
          const active = on === o.v;
          return (
            <button
              key={String(o.v)}
              onClick={() => onChange(o.v)}
              className="flex-1 font-mono text-xs font-semibold py-1.5 rounded-md border transition-colors"
              style={{
                borderColor: active ? ACCENT : "var(--color-line-strong)",
                color: active ? "var(--color-bg)" : "var(--color-ink-dim)",
                background: active ? ACCENT : "transparent",
              }}
            >
              {o.t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BuildBuyViz() {
  const [volume, setVolume] = useState(2_000_000);
  const [strict, setStrict] = useState(false);
  const [latency, setLatency] = useState("normal");
  const [mlops, setMlops] = useState(true);

  const { rec, reasons } = decide({ volume, strict, latency, mlops });
  const r = RECS[rec];
  const pctOfBreakEven = Math.min(100, (volume / BREAK_EVEN) * 100);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-3">
        your situation
      </div>

      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            monthly request volume
          </label>
          <span className="font-mono text-xs font-semibold" style={{ color: ACCENT }}>
            {fmtVolume(volume)} / mo
          </span>
        </div>
        <input
          type="range"
          min={10000}
          max={100_000_000}
          step={10000}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: ACCENT }}
        />
        <div className="relative h-1 mt-1">
          <div
            className="absolute top-0 h-1 border-l border-dashed"
            style={{ left: `${pctOfBreakEven}%`, borderColor: "var(--color-line-strong)" }}
          />
          <div
            className="absolute top-1 font-mono text-[10px] text-ink-faint"
            style={{ left: `${pctOfBreakEven}%`, transform: "translateX(-50%)" }}
          >
            break-even ~{fmtVolume(BREAK_EVEN)}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-5 mt-6">
        <Toggle
          label="data sensitivity"
          on={strict}
          onChange={setStrict}
          offText="standard"
          onText="strict"
        />
        <Toggle
          label="MLOps capacity"
          on={mlops}
          onChange={setMlops}
          offText="none"
          onText="have it"
        />
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1.5">
            latency need
          </div>
          <div className="flex gap-1.5">
            {[
              { v: "normal", t: "normal" },
              { v: "tight", t: "tight" },
            ].map((o) => {
              const active = latency === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setLatency(o.v)}
                  className="flex-1 font-mono text-xs font-semibold py-1.5 rounded-md border transition-colors"
                  style={{
                    borderColor: active ? ACCENT : "var(--color-line-strong)",
                    color: active ? "var(--color-bg)" : "var(--color-ink-dim)",
                    background: active ? ACCENT : "transparent",
                  }}
                >
                  {o.t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="rounded-lg border border-line p-4"
        style={{ borderLeft: `3px solid ${ACCENT}` }}
      >
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1">
          recommendation
        </div>
        <div className="text-xl font-bold mb-3" style={{ color: r.color }}>
          {r.title}
        </div>
        <ul className="space-y-1.5">
          {reasons.map((reason, i) => (
            <li key={i} className="text-[13px] text-ink-dim leading-relaxed flex gap-2">
              <span style={{ color: ACCENT }} aria-hidden>
                ›
              </span>
              <span>{reason}.</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
