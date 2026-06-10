import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#e8553b";

/* Variable-size sliding window over a fixed array.
   We track the window [l, r), its running sum, and the best (max) sum seen so far.
   - extend: r++  (add nums[r] to the window sum)
   - shrink: l++  (drop nums[l] from the window sum)
   This is the canonical "grow/shrink a window, keep a running aggregate" pattern. */
const NUMS = [2, 1, 5, 1, 3, 2, 4, 1];

export default function SlidingWindowViz() {
  const [l, setL] = useState(0);
  const [r, setR] = useState(0); // exclusive: window is nums[l..r-1]
  const [best, setBest] = useState(0);
  const [note, setNote] = useState(
    "Window is empty (l = r = 0). Extend to pull the right edge in, shrink to push the left edge forward."
  );

  const sum = NUMS.slice(l, r).reduce((a, b) => a + b, 0);
  const width = r - l;

  function extend() {
    if (r >= NUMS.length) {
      setNote("Right edge is already at the end — nothing left to pull in. Shrink, or reset.");
      return;
    }
    const nr = r + 1;
    const nsum = NUMS.slice(l, nr).reduce((a, b) => a + b, 0);
    const nbest = Math.max(best, nsum);
    setR(nr);
    if (nbest > best) {
      setBest(nbest);
      setNote(
        `extend: r → ${nr}. Added nums[${r}] = ${NUMS[r]}. Window sum = ${nsum} — new best so far!`
      );
    } else {
      setNote(
        `extend: r → ${nr}. Added nums[${r}] = ${NUMS[r]}. Window sum = ${nsum} (best stays ${nbest}).`
      );
    }
  }

  function shrink() {
    if (l >= r) {
      setNote("Window is empty — can't shrink past the right edge. Extend first.");
      return;
    }
    const dropped = NUMS[l];
    const nl = l + 1;
    const nsum = NUMS.slice(nl, r).reduce((a, b) => a + b, 0);
    setL(nl);
    setNote(
      `shrink: l → ${nl}. Dropped nums[${l}] = ${dropped}. Window sum = ${nsum}. (Best is sticky — it only ever rises: ${best}.)`
    );
  }

  function reset() {
    setL(0);
    setR(0);
    setBest(0);
    setNote("Reset. Window empty at l = r = 0.");
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 font-mono text-xs">
        <Stat label="l" value={l} tone={ACCENT} />
        <Stat label="r" value={r} tone={ACCENT} />
        <Stat label="width" value={width} />
        <Stat label="window sum" value={sum} />
        <Stat label="best sum" value={best} tone="#4ade80" />
      </div>

      {/* Array cells */}
      <div className="flex flex-wrap gap-2 pb-7 mb-3 min-h-[4rem]">
        {NUMS.map((v, i) => {
          const inWindow = i >= l && i < r;
          const isL = i === l && width > 0;
          const isR = i === r - 1 && width > 0;
          return (
            <div
              key={i}
              className="relative flex-none w-12 h-12 rounded-md flex items-center justify-center font-mono text-sm font-semibold transition-all duration-300"
              style={
                inWindow
                  ? {
                      background: "color-mix(in srgb,#e8553b 18%,#15171f)",
                      color: "#eef1f7",
                      border: `1px solid ${ACCENT}`,
                    }
                  : { background: "#11131a", color: "#6b7280", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {v}
              <span className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[10px] text-ink-faint/60">
                {i}
              </span>
              {(isL || isR) && (
                <span
                  className="absolute -top-5 left-0 right-0 text-center font-mono text-[10px] font-bold"
                  style={{ color: ACCENT }}
                >
                  {isL && isR ? "l,r" : isL ? "l" : "r"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={extend} disabled={r >= NUMS.length}>
          extend r++ (add)
        </Btn>
        <Btn tone="#fbbf24" onClick={shrink} disabled={l >= r}>
          shrink l++ (drop)
        </Btn>
        <Btn variant="ghost" onClick={reset}>
          reset
        </Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem]">{note}</p>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-ink-faint">{label}</span>
      <span className="font-semibold px-1.5 rounded" style={{ color: tone || "#eef1f7" }}>
        {value}
      </span>
    </span>
  );
}
