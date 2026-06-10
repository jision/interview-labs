import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#e8553b";

/* Two-pointer search on a SORTED array for a pair summing to TARGET.
   - sum < target  -> move LEFT pointer right (need a bigger value)
   - sum > target  -> move RIGHT pointer left (need a smaller value)
   - sum == target -> done.
   Because the array is sorted, each move provably can't skip the answer. */
const NUMS = [1, 3, 4, 6, 8, 11, 15];
const TARGET = 14;

export default function TwoPointersViz() {
  const [l, setL] = useState(0);
  const [r, setR] = useState(NUMS.length - 1);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState(
    `Looking for two numbers that sum to ${TARGET}. Pointers start at the two ends of the sorted array.`
  );

  const sum = NUMS[l] + NUMS[r];

  function step() {
    if (done) return;
    if (l >= r) {
      setNote("Pointers crossed without a match — no such pair exists. O(n), single pass.");
      setDone(true);
      return;
    }
    const s = NUMS[l] + NUMS[r];
    if (s === TARGET) {
      setNote(
        `nums[${l}] + nums[${r}] = ${NUMS[l]} + ${NUMS[r]} = ${TARGET} ✓ Found it. Whole search was one linear pass.`
      );
      setDone(true);
    } else if (s < TARGET) {
      const nl = l + 1;
      setL(nl);
      setNote(
        `sum ${s} < ${TARGET}: too small → move LEFT in (l → ${nl}). nums[${l}] was the smallest still in play, so it can't be in any valid pair — discard it.`
      );
    } else {
      const nr = r - 1;
      setR(nr);
      setNote(
        `sum ${s} > ${TARGET}: too big → move RIGHT in (r → ${nr}). nums[${r}] was the largest still in play, so it can't pair with anything smaller — discard it.`
      );
    }
  }

  function reset() {
    setL(0);
    setR(NUMS.length - 1);
    setDone(false);
    setNote(
      `Looking for two numbers that sum to ${TARGET}. Pointers start at the two ends of the sorted array.`
    );
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 font-mono text-xs">
        <Stat label="target" value={TARGET} tone="#4ade80" />
        <Stat label="l" value={l} tone={ACCENT} />
        <Stat label="r" value={r} tone={ACCENT} />
        <Stat
          label="nums[l]+nums[r]"
          value={l <= r ? sum : "—"}
          tone={done ? "#4ade80" : sum === TARGET ? "#4ade80" : "#fbbf24"}
        />
      </div>

      <div className="flex flex-wrap gap-2 pb-7 mb-3 min-h-[4rem]">
        {NUMS.map((v, i) => {
          const active = i === l || i === r;
          const between = i > l && i < r;
          return (
            <div
              key={i}
              className="relative flex-none w-12 h-12 rounded-md flex items-center justify-center font-mono text-sm font-semibold transition-all duration-300"
              style={
                active
                  ? {
                      background: done && sum === TARGET ? ACCENT : "color-mix(in srgb,#e8553b 22%,#15171f)",
                      color: done && sum === TARGET ? "#0c0e14" : "#eef1f7",
                      border: `1px solid ${ACCENT}`,
                    }
                  : between
                  ? { background: "#1a1d27", color: "#aeb6c2", border: "1px solid rgba(255,255,255,0.10)" }
                  : { background: "#11131a", color: "#4b5563", border: "1px solid rgba(255,255,255,0.06)" }
              }
            >
              {v}
              <span className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[10px] text-ink-faint/60">
                {i}
              </span>
              {active && (
                <span
                  className="absolute -top-5 left-0 right-0 text-center font-mono text-[10px] font-bold"
                  style={{ color: ACCENT }}
                >
                  {i === l && i === r ? "l,r" : i === l ? "l" : "r"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={step} disabled={done}>
          step
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
