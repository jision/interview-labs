import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Data skew and salting. Bars are task durations across 6 partitions. One
 * partition holds a hot key and is a tall straggler. A slider sets skew
 * severity (how dominant the hot key is). "salt the hot key" splits that key
 * across N partitions, lowering the max bar. Stage time = MAX task time, so we
 * show stage time before vs after. Pure illustration.
 */
const ACCENT = "#ff8a3d";
const HOT = "#f87171"; // straggler / hot key
const COOL = "#60a5fa"; // normal partitions
const SALTED = "#4ade80"; // hot key after salting

// 5 "normal" partitions plus 1 hot partition. Units are arbitrary "task seconds".
const BASE = [9, 11, 8, 10, 9];

export default function SkewSaltingViz() {
  const [severity, setSeverity] = useState(7); // multiplier on the hot key's load
  const [salted, setSalted] = useState(false);
  const [splitN, setSplitN] = useState(4);

  const baseHot = 10; // the hot key's load at severity 1
  const hotLoad = baseHot * severity; // total work on the hot key

  // Build the bar set.
  let bars;
  if (!salted) {
    bars = [...BASE.map((v) => ({ v, color: COOL })), { v: hotLoad, color: HOT }];
  } else {
    // split the hot key's load across splitN partitions (plus a little salt overhead)
    const per = Math.round((hotLoad / splitN) * 1.05);
    const salt = Array.from({ length: splitN }, () => ({ v: per, color: SALTED }));
    bars = [...BASE.map((v) => ({ v, color: COOL })), ...salt];
  }

  const maxV = Math.max(...bars.map((b) => b.v));
  const scaleMax = Math.max(maxV, baseHot * 12); // stable y-axis as severity changes

  // stage time = MAX task time
  const stageBefore = Math.max(...BASE, hotLoad);
  const stageAfter = salted
    ? Math.max(...BASE, Math.round((hotLoad / splitN) * 1.05))
    : null;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* severity slider */}
      <div className="flex justify-between font-mono text-[11px] mb-1">
        <span className="text-ink-dim">skew severity (hot key dominance)</span>
        <span style={{ color: HOT }}>{severity}x</span>
      </div>
      <input
        type="range"
        min={1}
        max={14}
        step={1}
        value={severity}
        onChange={(e) => {
          setSeverity(parseInt(e.target.value, 10));
          setSalted(false);
        }}
        className="w-full"
        style={{ accentColor: HOT }}
      />

      {/* bars */}
      <div className="flex items-end gap-2 h-40 mt-4 mb-1 border-b border-line pb-0">
        {bars.map((b, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <span className="font-mono text-[9px] mb-0.5" style={{ color: b.color }}>
              {b.v}
            </span>
            <div
              className="w-full rounded-t transition-all duration-300"
              style={{
                height: `${(b.v / scaleMax) * 100}%`,
                background: `color-mix(in srgb, ${b.color} 60%, transparent)`,
                border: `1px solid ${b.color}`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="font-mono text-[9px] text-ink-faint mb-3 text-center">
        each bar = one task (one partition). stage time = the TALLEST bar.
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="font-mono text-[11px] text-ink-faint mr-1">split into</span>
        {[2, 4, 8].map((n) => (
          <Btn
            key={n}
            variant={splitN === n ? "solid" : "ghost"}
            tone={ACCENT}
            onClick={() => setSplitN(n)}
          >
            N = {n}
          </Btn>
        ))}
        <Btn tone={SALTED} variant={salted ? "ghost" : "solid"} onClick={() => setSalted(true)} disabled={salted}>
          salt the hot key
        </Btn>
        <Btn
          tone={ACCENT}
          variant="ghost"
          onClick={() => {
            setSalted(false);
            setSeverity(7);
            setSplitN(4);
          }}
        >
          reset
        </Btn>
      </div>

      {/* before / after stage time */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg border border-line bg-surface-2 p-2.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">stage time, skewed</div>
          <div className="font-mono text-lg font-bold" style={{ color: HOT }}>
            {stageBefore}
          </div>
          <div className="text-[11px] text-ink-faint leading-snug">one straggler holds the whole stage hostage.</div>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-2.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">stage time, salted</div>
          <div className="font-mono text-lg font-bold" style={{ color: salted ? SALTED : "var(--color-ink-faint)" }}>
            {salted ? stageAfter : "-"}
          </div>
          <div className="text-[11px] text-ink-faint leading-snug">
            {salted ? `hot key spread over ${splitN} tasks, max bar drops.` : "salt the hot key to see the drop."}
          </div>
        </div>
      </div>

      <div className="font-mono text-[11px] text-ink-faint leading-relaxed">
        Salting appends a random suffix (0..N-1) to the hot key so its rows hash into N partitions instead of one, then
        you aggregate in two passes. Because stage time equals the MAX task time, flattening that one tall bar is what
        actually speeds up the stage.
      </div>
    </div>
  );
}
