import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#e8553b";

/* Classic inclusive-bounds binary search: lo <= hi, mid = (lo+hi)//2.
   Each step compares nums[mid] to target and discards HALF the range:
   - nums[mid] == target -> found
   - nums[mid] <  target -> lo = mid + 1   (mid+1, not mid: that's why it terminates)
   - nums[mid] >  target -> hi = mid - 1
   The range always shrinks by at least one, so no infinite loop. */
const NUMS = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const TARGET = 23;

export default function BinarySearchViz() {
  const [lo, setLo] = useState(0);
  const [hi, setHi] = useState(NUMS.length - 1);
  const [mid, setMid] = useState(Math.floor((0 + NUMS.length - 1) / 2));
  const [done, setDone] = useState(false);
  const [foundIdx, setFoundIdx] = useState(null);
  const [note, setNote] = useState(
    `Searching a sorted array for ${TARGET}. lo = 0, hi = ${NUMS.length - 1}, mid = ${Math.floor(
      (NUMS.length - 1) / 2
    )}.`
  );

  function step() {
    if (done) return;
    if (lo > hi) {
      setNote(`lo (${lo}) > hi (${hi}): range is empty → ${TARGET} is not present. O(log n) comparisons.`);
      setDone(true);
      return;
    }
    const m = Math.floor((lo + hi) / 2);
    const v = NUMS[m];
    if (v === TARGET) {
      setMid(m);
      setFoundIdx(m);
      setDone(true);
      setNote(`nums[${m}] = ${v} = target ✓ Found at index ${m}.`);
      return;
    }
    if (v < TARGET) {
      const nlo = m + 1;
      setLo(nlo);
      const nm = nlo <= hi ? Math.floor((nlo + hi) / 2) : nlo;
      setMid(nm);
      setNote(
        `nums[${m}] = ${v} < ${TARGET}: target is to the RIGHT → lo = mid + 1 = ${nlo}. Lower half (indices ${0}..${m}) discarded.`
      );
    } else {
      const nhi = m - 1;
      setHi(nhi);
      const nm = lo <= nhi ? Math.floor((lo + nhi) / 2) : lo;
      setMid(nm);
      setNote(
        `nums[${m}] = ${v} > ${TARGET}: target is to the LEFT → hi = mid - 1 = ${nhi}. Upper half (indices ${m}..${NUMS.length - 1}) discarded.`
      );
    }
  }

  function reset() {
    setLo(0);
    setHi(NUMS.length - 1);
    setMid(Math.floor((NUMS.length - 1) / 2));
    setDone(false);
    setFoundIdx(null);
    setNote(
      `Searching a sorted array for ${TARGET}. lo = 0, hi = ${NUMS.length - 1}, mid = ${Math.floor(
        (NUMS.length - 1) / 2
      )}.`
    );
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 font-mono text-xs">
        <Stat label="target" value={TARGET} tone="#4ade80" />
        <Stat label="lo" value={lo} tone={ACCENT} />
        <Stat label="mid" value={lo <= hi ? mid : "—"} tone="#fbbf24" />
        <Stat label="hi" value={hi} tone={ACCENT} />
        <Stat label="range size" value={Math.max(0, hi - lo + 1)} />
      </div>

      <div className="flex flex-wrap gap-2 pb-7 mb-3 min-h-[4rem]">
        {NUMS.map((v, i) => {
          const inRange = i >= lo && i <= hi && !done;
          const isMid = i === mid && lo <= hi && !done && foundIdx === null;
          const isFound = i === foundIdx;
          let style;
          if (isFound) {
            style = { background: ACCENT, color: "#0c0e14", border: `1px solid ${ACCENT}` };
          } else if (isMid) {
            style = { background: "color-mix(in srgb,#fbbf24 28%,#15171f)", color: "#eef1f7", border: "1px solid #fbbf24" };
          } else if (inRange) {
            style = { background: "color-mix(in srgb,#e8553b 14%,#15171f)", color: "#eef1f7", border: `1px solid ${ACCENT}` };
          } else {
            style = { background: "#11131a", color: "#4b5563", border: "1px solid rgba(255,255,255,0.06)" };
          }
          return (
            <div
              key={i}
              className="relative flex-none w-12 h-12 rounded-md flex items-center justify-center font-mono text-sm font-semibold transition-all duration-300"
              style={style}
            >
              {v}
              <span className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[10px] text-ink-faint/60">
                {i}
              </span>
              {isMid && (
                <span className="absolute -top-5 left-0 right-0 text-center font-mono text-[10px] font-bold" style={{ color: "#fbbf24" }}>
                  mid
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={step} disabled={done}>
          step (halve)
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
