import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#e8553b";

/* Next Greater Element via a monotonic (strictly decreasing) stack of INDICES.
   Scan left -> right. For each new value nums[i]:
     while stack not empty AND nums[i] > nums[stack.top]:
         j = stack.pop();  result[j] = nums[i]   # nums[i] is j's next-greater
     push i
   Anything left on the stack at the end has no greater element to its right (-1).
   Each index is pushed and popped at most once -> O(n) overall. */
const NUMS = [2, 1, 4, 3, 5];

export default function MonotonicStackViz() {
  const [i, setI] = useState(0); // current scan index (the element we're processing)
  const [stack, setStack] = useState([]); // indices, values strictly decreasing
  const [result, setResult] = useState(() => NUMS.map(() => null));
  const [phase, setPhase] = useState("start"); // start | popping | pushed | done
  const [flashPop, setFlashPop] = useState(null); // index just popped
  const [note, setNote] = useState(
    "Scan left → right keeping a strictly decreasing stack of indices. When a new value beats the stack top, that new value is the top's 'next greater'."
  );

  function step() {
    if (phase === "done") return;
    if (i >= NUMS.length) {
      // finalize: remaining stack -> -1
      setResult((res) => {
        const r = res.slice();
        stack.forEach((idx) => {
          if (r[idx] === null) r[idx] = -1;
        });
        return r;
      });
      setStack([]);
      setPhase("done");
      setFlashPop(null);
      setNote(
        "End of array. Every index still on the stack has nothing larger to its right → result = -1. Each index pushed and popped once: O(n)."
      );
      return;
    }

    const cur = NUMS[i];
    // Is there a pop to do?
    if (stack.length && cur > NUMS[stack[stack.length - 1]]) {
      const j = stack[stack.length - 1];
      setStack((s) => s.slice(0, -1));
      setResult((res) => {
        const r = res.slice();
        r[j] = cur;
        return r;
      });
      setFlashPop(j);
      setPhase("popping");
      setNote(
        `nums[${i}] = ${cur} > nums[${j}] = ${NUMS[j]} (stack top) → pop ${j}. Its next-greater is ${cur}. Keep popping while the new value still wins.`
      );
      return;
    }

    // No more pops: push i, advance.
    setStack((s) => [...s, i]);
    setFlashPop(null);
    setPhase("pushed");
    setNote(
      stack.length
        ? `nums[${i}] = ${cur} ≤ nums[${stack[stack.length - 1]}] = ${NUMS[stack[stack.length - 1]]} → stack stays decreasing. Push index ${i}, advance.`
        : `Stack empty → push index ${i}, advance. (It's waiting for a future bigger value.)`
    );
    setI(i + 1);
  }

  function reset() {
    setI(0);
    setStack([]);
    setResult(NUMS.map(() => null));
    setPhase("start");
    setFlashPop(null);
    setNote(
      "Scan left → right keeping a strictly decreasing stack of indices. When a new value beats the stack top, that new value is the top's 'next greater'."
    );
  }

  const done = phase === "done";

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 font-mono text-xs">
        <Stat label="i" value={i < NUMS.length ? i : "-"} tone={ACCENT} />
        <Stat label="stack depth" value={stack.length} />
        <Stat label="phase" value={phase} tone="#fbbf24" />
      </div>

      {/* Input array with the cursor */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">input</div>
      <div className="flex flex-wrap gap-2 pb-7 mb-4 min-h-[4rem]">
        {NUMS.map((v, idx) => {
          const isCur = idx === i && !done;
          const onStack = stack.includes(idx);
          const justPopped = idx === flashPop;
          let style;
          if (justPopped) {
            style = { background: "color-mix(in srgb,#4ade80 26%,#15171f)", color: "#eef1f7", border: "1px solid #4ade80" };
          } else if (isCur) {
            style = { background: ACCENT, color: "#0c0e14", border: `1px solid ${ACCENT}` };
          } else if (onStack) {
            style = { background: "color-mix(in srgb,#e8553b 16%,#15171f)", color: "#eef1f7", border: `1px solid ${ACCENT}` };
          } else {
            style = { background: "#11131a", color: "#7b8494", border: "1px solid rgba(255,255,255,0.07)" };
          }
          return (
            <div
              key={idx}
              className="relative flex-none w-12 h-12 rounded-md flex items-center justify-center font-mono text-sm font-semibold transition-all duration-300"
              style={style}
            >
              {v}
              <span className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[10px] text-ink-faint/60">
                {idx}
              </span>
              {isCur && (
                <span className="absolute -top-5 left-0 right-0 text-center font-mono text-[10px] font-bold" style={{ color: ACCENT }}>
                  i
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Stack (bottom -> top, left to right) */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">
        stack (decreasing, bottom → top)
      </div>
      <div className="flex flex-wrap gap-2 mb-4 min-h-[3rem] items-center">
        {stack.length === 0 ? (
          <span className="font-mono text-xs text-ink-faint">empty</span>
        ) : (
          stack.map((idx, k) => (
            <div
              key={`${idx}-${k}`}
              className="flex-none px-3 h-10 rounded-md flex items-center justify-center font-mono text-sm font-semibold"
              style={{
                background: "color-mix(in srgb,#e8553b 16%,#15171f)",
                color: "#eef1f7",
                border: `1px solid ${ACCENT}`,
              }}
            >
              {NUMS[idx]}
              <span className="ml-1 text-[10px] text-ink-faint/70">@{idx}</span>
            </div>
          ))
        )}
      </div>

      {/* Result array */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">
        next-greater result
      </div>
      <div className="flex flex-wrap gap-2 mb-4 min-h-[3rem]">
        {result.map((v, idx) => (
          <div
            key={idx}
            className="flex-none w-12 h-10 rounded-md flex items-center justify-center font-mono text-sm font-semibold"
            style={
              v === null
                ? { background: "#11131a", color: "#3a414d", border: "1px dashed rgba(255,255,255,0.12)" }
                : v === -1
                ? { background: "#1a1d27", color: "#9aa3b0", border: "1px solid rgba(255,255,255,0.12)" }
                : { background: "color-mix(in srgb,#4ade80 18%,#15171f)", color: "#eef1f7", border: "1px solid #4ade80" }
            }
          >
            {v === null ? "·" : v}
          </div>
        ))}
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
