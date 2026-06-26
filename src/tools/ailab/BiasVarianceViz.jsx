import React, { useMemo, useState } from "react";

/*
 * Bias–variance, complexity slider, no model in the browser.
 * Two baked curves over polynomial degree 1..15:
 *   training error, monotonically decreasing (more capacity fits train better)
 *   validation error, U-shaped (underfit on the left, overfit on the right)
 * A marker tracks the current degree; we label the regime under it.
 * A tiny inline fit illustration is shown alongside the priority two-curve plot.
 */
const ACCENT = "#7c5cff";
const GOOD = "#4ade80";
const BAD = "#f87171";

const MIN_D = 1;
const MAX_D = 15;
const VAR_CENTER = 5; // where the variance penalty is centered in the formula

// Baked error curves (0..1). Train decreases monotonically; val is a U.
function trainErr(d) {
  // high at d=1, decays toward ~0 as capacity grows
  return 0.9 * Math.exp(-(d - 1) / 4.2) + 0.02;
}
function valErr(d) {
  // U-shape: bias term falls, variance term rises
  const bias = 0.85 * Math.exp(-(d - 1) / 3.0);
  const variance = 0.018 * (d - VAR_CENTER) * (d - VAR_CENTER);
  return Math.min(bias + variance + 0.12, 1);
}

const DEGREES = Array.from({ length: MAX_D - MIN_D + 1 }, (_, i) => MIN_D + i);

// The actual U-bottom (slowly-falling bias shifts it right of VAR_CENTER), computed
// so the marker / default / regime labels can never drift from the real minimum.
const SWEET = DEGREES.reduce((best, d) => (valErr(d) < valErr(best) ? d : best), MIN_D);

// SVG mapping (viewBox 0..100 both axes, y inverted so error grows upward).
const px = (d) => ((d - MIN_D) / (MAX_D - MIN_D)) * 92 + 4;
const py = (e) => 96 - e * 88;

function path(fn) {
  return "M" + DEGREES.map((d) => `${px(d).toFixed(2)},${py(fn(d)).toFixed(2)}`).join(" L");
}
const TRAIN_PATH = path(trainErr);
const VAL_PATH = path(valErr);

// Sample points for the tiny fit illustration (a noisy underlying line).
const SAMPLES = [
  { x: 8, y: 70 },
  { x: 24, y: 52 },
  { x: 38, y: 60 },
  { x: 54, y: 38 },
  { x: 70, y: 44 },
  { x: 86, y: 24 },
];

// Build a fit curve whose wiggliness scales with degree (illustration only).
function fitPath(d) {
  const pts = [];
  const wiggle = Math.max(0, d - 3) * 3.5; // higher degree → more wiggle
  for (let i = 0; i <= 40; i++) {
    const x = (i / 40) * 94 + 3;
    const base = 74 - (x / 94) * 50; // the underlying downward trend
    const noise = wiggle * Math.sin(x / 9 + d);
    pts.push(`${x.toFixed(1)},${(base + noise).toFixed(1)}`);
  }
  return "M" + pts.join(" L");
}

export default function BiasVarianceViz() {
  const [d, setD] = useState(SWEET);

  const regime = useMemo(() => {
    if (d < SWEET - 1) return { label: "underfit (high bias)", color: BAD };
    if (d > SWEET + 1) return { label: "overfit (high variance)", color: BAD };
    return { label: "good fit", color: GOOD };
  }, [d]);

  const te = trainErr(d);
  const ve = valErr(d);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="text-sm text-ink-dim mb-3">
        Slide model complexity. Training error always falls; validation error is{" "}
        <span className="text-ink font-semibold">U-shaped</span>. The bottom of that U is the sweet
        spot, too far right and the model memorizes noise.
      </div>

      <div className="grid md:grid-cols-[1.6fr_1fr] gap-4">
        {/* priority: the two-curve plot */}
        <div className="rounded-lg border border-line bg-[#0e1018] overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full" style={{ height: 240 }}>
            {/* axes */}
            <line x1={4} y1={96} x2={96} y2={96} stroke="#2a303c" strokeWidth={0.6} />
            <line x1={4} y1={8} x2={4} y2={96} stroke="#2a303c" strokeWidth={0.6} />
            {/* vertical marker at current degree */}
            <line x1={px(d)} y1={8} x2={px(d)} y2={96} stroke={ACCENT} strokeWidth={0.5} strokeDasharray="1.5 1.5" opacity={0.7} />
            {/* curves */}
            <path d={TRAIN_PATH} fill="none" stroke={ACCENT} strokeWidth={1} />
            <path d={VAL_PATH} fill="none" stroke="#fbbf24" strokeWidth={1} />
            {/* markers on each curve at current degree */}
            <circle cx={px(d)} cy={py(te)} r={1.8} fill={ACCENT} />
            <circle cx={px(d)} cy={py(ve)} r={1.8} fill="#fbbf24" />
          </svg>
        </div>

        {/* tiny inline fit illustration */}
        <div className="rounded-lg border border-line bg-[#0e1018] overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full" style={{ height: 240 }}>
            <path d={fitPath(d)} fill="none" stroke={regime.color} strokeWidth={1.1} />
            {SAMPLES.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={2} fill="#cdd3df" />
            ))}
          </svg>
        </div>
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-dim">
          <span className="w-3 h-0.5 rounded" style={{ background: ACCENT }} />
          training error
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-dim">
          <span className="w-3 h-0.5 rounded" style={{ background: "#fbbf24" }} />
          validation error
        </span>
      </div>

      {/* complexity slider */}
      <div className="mt-4">
        <div className="flex justify-between font-mono text-[11px] mb-1">
          <span className="text-ink-dim">model complexity, polynomial degree</span>
          <span style={{ color: ACCENT }}>{d}</span>
        </div>
        <input
          type="range"
          min={MIN_D}
          max={MAX_D}
          step={1}
          value={d}
          onChange={(e) => setD(parseInt(e.target.value, 10))}
          className="w-full"
          style={{ accentColor: ACCENT }}
        />
      </div>

      {/* regime + readouts */}
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <span
          className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md"
          style={{
            color: regime.color,
            background: `color-mix(in srgb, ${regime.color} 14%, transparent)`,
          }}
        >
          {regime.label}
        </span>
        <span className="ml-auto flex items-center gap-4 font-mono text-[11px]">
          <span className="text-ink-faint">
            train err <span style={{ color: ACCENT }}>{te.toFixed(3)}</span>
          </span>
          <span className="text-ink-faint">
            val err <span style={{ color: "#fbbf24" }}>{ve.toFixed(3)}</span>
          </span>
        </span>
      </div>
    </div>
  );
}
