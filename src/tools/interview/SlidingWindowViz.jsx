import React, { useState, useRef, useEffect, useMemo } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#e8553b";
const NUMS = [2, 1, 5, 1, 3, 2, 4, 1];

/* The REAL variable-window pattern: "longest subarray with sum <= K".
   Extend the right edge one element at a time; whenever the window breaks
   the constraint (sum > K), AUTO-SHRINK from the left until it's valid
   again, tracking the best (longest) valid window seen.
   Works because the values are positive, so the window sum is monotonic. */

function buildTrace(K) {
  // states[i] = state after i right-edge steps. states[0] = empty window.
  const initial = `Goal: the LONGEST window with sum ≤ ${K}. Step to pull in the next element — if it breaks the budget, the window auto-shrinks from the left.`;
  const states = [{ l: 0, r: -1, sum: 0, len: 0, best: { len: 0, l: 0, r: -1 }, dropped: [], msg: initial }];
  let l = 0;
  let best = { len: 0, l: 0, r: -1 };
  for (let r = 0; r < NUMS.length; r++) {
    let s = 0;
    for (let i = l; i <= r; i++) s += NUMS[i];
    const dropped = [];
    while (s > K && l <= r) {
      s -= NUMS[l];
      dropped.push(l);
      l += 1;
    }
    const len = l <= r ? r - l + 1 : 0;
    if (len > best.len) best = { len, l, r };
    const head = `include nums[${r}] = ${NUMS[r]}`;
    const tail = len > states[states.length - 1].best.len ? " ← new best!" : ` (best stays ${best.len}).`;
    const msg =
      dropped.length === 0
        ? `${head} → sum = ${s} ≤ ${K}. Window [${l}..${r}], length ${len}.${tail}`
        : `${head} pushed sum over ${K} → drop ${dropped.length} from the left (idx ${dropped.join(", ")}) until sum = ${s} ≤ ${K}. Window [${l}..${r}], length ${len}.${tail}`;
    states.push({ l, r, sum: s, len, best: { ...best }, dropped, msg });
  }
  return states;
}

export default function SlidingWindowViz() {
  const [K, setK] = useState(7);
  const [pc, setPc] = useState(0); // right-edge steps taken
  const timers = useRef([]);

  const states = useMemo(() => buildTrace(K), [K]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const s = states[pc];
  const finished = pc >= states.length - 1;

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  function step() {
    if (!finished) setPc(pc + 1);
  }
  function run() {
    let i = pc;
    const tick = () => {
      i += 1;
      setPc(i);
      if (i < states.length - 1) timers.current.push(setTimeout(tick, 680));
    };
    if (i < states.length - 1) timers.current.push(setTimeout(tick, 0));
  }
  function reset() {
    clearTimers();
    setPc(0);
  }
  function changeK(delta) {
    clearTimers();
    setPc(0);
    setK((k) => Math.max(4, Math.min(14, k + delta)));
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      {/* Stats + K control */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 font-mono text-xs">
        <span className="flex items-center gap-1.5">
          <span className="text-ink-faint">K (max sum)</span>
          <button onClick={() => changeK(-1)} className="px-1.5 rounded border border-line-strong text-ink-dim hover:text-ink" disabled={K <= 4}>−</button>
          <span className="font-bold px-1.5 rounded" style={{ color: ACCENT, background: "#11131a" }}>{K}</span>
          <button onClick={() => changeK(1)} className="px-1.5 rounded border border-line-strong text-ink-dim hover:text-ink" disabled={K >= 14}>+</button>
        </span>
        <Stat label="window sum" value={s.sum} tone={s.sum > K ? "#f87171" : "#eef1f7"} />
        <Stat label="length" value={s.len} tone={ACCENT} />
        <Stat label="best length" value={s.best.len} tone="#4ade80" />
      </div>

      {/* Array cells */}
      <div className="flex flex-wrap gap-2 pt-5 pb-7 mb-3 min-h-[4rem]">
        {NUMS.map((v, i) => {
          const inWindow = s.len > 0 && i >= s.l && i <= s.r;
          const isBest = s.best.len > 0 && i >= s.best.l && i <= s.best.r;
          const isDropped = s.dropped.includes(i);
          const isL = inWindow && i === s.l;
          const isR = inWindow && i === s.r;
          let style;
          if (isDropped) {
            style = { background: "color-mix(in srgb,#fbbf24 18%,#15171f)", color: "#eef1f7", border: "1px solid #fbbf24" };
          } else if (inWindow) {
            style = { background: "color-mix(in srgb,#e8553b 20%,#15171f)", color: "#eef1f7", border: `1px solid ${ACCENT}` };
          } else {
            style = { background: "#11131a", color: "#6b7280", border: "1px solid rgba(255,255,255,0.08)" };
          }
          return (
            <div
              key={i}
              className="relative flex-none w-12 h-12 rounded-md flex items-center justify-center font-mono text-sm font-semibold transition-all duration-300"
              style={style}
            >
              {v}
              {/* best-window marker */}
              {isBest && (
                <span className="absolute -bottom-1.5 left-1 right-1 h-1 rounded-full" style={{ background: "#4ade80" }} />
              )}
              <span className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[10px] text-ink-faint/60">{i}</span>
              {(isL || isR) && (
                <span className="absolute -top-5 left-0 right-0 text-center font-mono text-[10px] font-bold" style={{ color: ACCENT }}>
                  {isL && isR ? "l,r" : isL ? "l" : "r"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mb-3 font-mono text-[10px] text-ink-faint">
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm" style={{ background: ACCENT }} /> current window</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full" style={{ background: "#4ade80" }} /> best so far</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm" style={{ background: "#fbbf24" }} /> just dropped</span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={step} disabled={finished}>step ▸ (extend + auto-shrink)</Btn>
        <Btn tone="#5fb3f0" onClick={run} disabled={finished}>run to end</Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      {finished && (
        <div className="rounded-md px-3 py-2 mb-2 font-mono text-xs font-semibold" style={{ background: "color-mix(in srgb,#4ade80 14%,transparent)", color: "#4ade80" }}>
          ✓ Done. Longest subarray with sum ≤ {K} has length {s.best.len} (indices {s.best.l}..{s.best.r}). Every index entered and left the window at most once → O(n).
        </div>
      )}

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem]">{s.msg}</p>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-ink-faint">{label}</span>
      <span className="font-semibold px-1.5 rounded" style={{ color: tone || "#eef1f7" }}>{value}</span>
    </span>
  );
}
