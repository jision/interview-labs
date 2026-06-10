import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#38e0d6";
let uid = 0;
const rnd = () => Math.floor(Math.random() * 90 + 10);

export default function StackQueueViz() {
  const [stack, setStack] = useState(() => [1, 2, 3].map((v) => ({ id: ++uid, v })));
  const [queue, setQueue] = useState(() => [1, 2, 3].map((v) => ({ id: ++uid, v })));
  const [note, setNote] = useState("Same data, opposite removal order. Both use O(1) operations when implemented well.");

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Stack */}
      <div className="rounded-xl bg-surface-2 border border-line p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h4 className="font-bold text-ink">Stack — LIFO</h4>
          <span className="font-mono text-[11px] text-ink-faint">list: append / pop</span>
        </div>
        <div className="flex flex-col-reverse items-stretch gap-1.5 min-h-[8rem] justify-end mb-3">
          {stack.length === 0 && <div className="text-ink-faint font-mono text-xs text-center py-8">empty</div>}
          {stack.map((n, i) => (
            <div
              key={n.id}
              className="rounded-md py-2 text-center font-mono text-sm font-semibold transition-all duration-200"
              style={{
                background: i === stack.length - 1 ? `color-mix(in srgb,${ACCENT} 22%,#15171f)` : "#1c1f2a",
                border: `1px solid ${i === stack.length - 1 ? ACCENT : "rgba(255,255,255,0.1)"}`,
                color: "#eef1f7",
              }}
            >
              {n.v}
              {i === stack.length - 1 && (
                <span className="ml-2 text-[10px] font-normal" style={{ color: ACCENT }}>← top</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Btn tone={ACCENT} onClick={() => { setStack((s) => [...s, { id: ++uid, v: rnd() }]); setNote("push(): append to the end → O(1)."); }}>push</Btn>
          <Btn variant="ghost" onClick={() => { setStack((s) => s.slice(0, -1)); setNote("pop(): remove from the end → O(1). The most recently pushed item leaves first."); }}>pop</Btn>
        </div>
      </div>

      {/* Queue */}
      <div className="rounded-xl bg-surface-2 border border-line p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h4 className="font-bold text-ink">Queue — FIFO</h4>
          <span className="font-mono text-[11px] text-ink-faint">deque: append / popleft</span>
        </div>
        <div className="flex items-center gap-1.5 min-h-[8rem] overflow-x-auto mb-3">
          {queue.length === 0 && <div className="text-ink-faint font-mono text-xs py-8 mx-auto">empty</div>}
          {queue.map((n, i) => (
            <React.Fragment key={n.id}>
              <div
                className="flex-none rounded-md w-12 py-3 text-center font-mono text-sm font-semibold transition-all duration-200"
                style={{
                  background: i === 0 ? `color-mix(in srgb,${ACCENT} 22%,#15171f)` : "#1c1f2a",
                  border: `1px solid ${i === 0 ? ACCENT : "rgba(255,255,255,0.1)"}`,
                  color: "#eef1f7",
                }}
              >
                {n.v}
              </div>
              {i < queue.length - 1 && <span className="flex-none text-ink-faint">→</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center justify-between mb-3 font-mono text-[10px] text-ink-faint">
          <span>↑ front (next out)</span>
          <span>back (just in) ↑</span>
        </div>
        <div className="flex gap-2">
          <Btn tone={ACCENT} onClick={() => { setQueue((q) => [...q, { id: ++uid, v: rnd() }]); setNote("enqueue → deque.append(): O(1) at the back."); }}>enqueue</Btn>
          <Btn variant="ghost" onClick={() => { setQueue((q) => q.slice(1)); setNote("dequeue → deque.popleft(): O(1). On a plain list, pop(0) would be O(n) — that's the trap."); }}>dequeue</Btn>
        </div>
      </div>

      <p className="md:col-span-2 text-sm text-ink-dim leading-relaxed">{note}</p>
    </div>
  );
}
