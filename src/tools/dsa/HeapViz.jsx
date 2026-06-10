import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#38e0d6";

export default function HeapViz() {
  const [heap, setHeap] = useState([5, 8, 12, 19, 10, 14]);
  const [hot, setHot] = useState([]); // indices recently compared/swapped
  const [note, setNote] = useState("A min-heap is just an array with a rule: every parent ≤ its children. The smallest is always at index 0.");

  function flash(idxs) {
    setHot(idxs);
    setTimeout(() => setHot([]), 650);
  }

  function insert() {
    const v = Math.floor(Math.random() * 40 + 1);
    const a = [...heap, v];
    let i = a.length - 1;
    const touched = [i];
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (a[parent] <= a[i]) break;
      [a[parent], a[i]] = [a[i], a[parent]];
      i = parent;
      touched.push(i);
    }
    setHeap(a);
    flash(touched);
    setNote(
      `insert(${v}): add at the end, then "sift up" — swap with parent (index (i-1)//2) while smaller. ${touched.length - 1} swap${touched.length - 1 !== 1 ? "s" : ""} → O(log n).`
    );
  }

  function extractMin() {
    if (!heap.length) return;
    const min = heap[0];
    const a = [...heap];
    const last = a.pop();
    let swaps = 0;
    if (a.length) {
      a[0] = last;
      let i = 0;
      const touched = [0];
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let small = i;
        if (l < a.length && a[l] < a[small]) small = l;
        if (r < a.length && a[r] < a[small]) small = r;
        if (small === i) break;
        [a[i], a[small]] = [a[small], a[i]];
        i = small;
        swaps++;
        touched.push(i);
      }
      flash(touched);
    }
    setHeap(a);
    setNote(
      `extract_min() → ${min}: take root, move last element to the root, "sift down" swapping with the smaller child. ${swaps} swap${swaps !== 1 ? "s" : ""} → O(log n).`
    );
  }

  function reset() {
    setHeap([5, 8, 12, 19, 10, 14]);
    setNote("Reset.");
  }

  // tree layout by heap index
  const levels = [];
  heap.forEach((v, i) => {
    const depth = Math.floor(Math.log2(i + 1));
    (levels[depth] = levels[depth] || []).push({ v, i });
  });
  const H = Math.max(levels.length * 64, 80);
  const W = Math.max(Math.pow(2, levels.length - 1) * 52, 260);
  const nodePos = (i) => {
    const depth = Math.floor(Math.log2(i + 1));
    const idxInLevel = i - (Math.pow(2, depth) - 1);
    const slots = Math.pow(2, depth);
    const x = (W / slots) * (idxInLevel + 0.5);
    const y = 28 + depth * 60;
    return { x, y };
  };

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      {/* Tree view */}
      <div className="overflow-x-auto mb-4">
        <svg width={W} height={H} className="block mx-auto">
          {heap.map((v, i) => {
            if (i === 0) return null;
            const p = nodePos((i - 1) >> 1);
            const c = nodePos(i);
            return <line key={"e" + i} x1={p.x} y1={p.y} x2={c.x} y2={c.y} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />;
          })}
          {heap.map((v, i) => {
            const { x, y } = nodePos(i);
            const active = hot.includes(i);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="16"
                  fill={active ? ACCENT : i === 0 ? "color-mix(in srgb,#38e0d6 22%,#15171f)" : "#1c1f2a"}
                  stroke={i === 0 || active ? ACCENT : "rgba(255,255,255,0.2)"} strokeWidth={i === 0 || active ? 2 : 1}
                  style={{ transition: "fill .15s" }} />
                <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontFamily="ui-monospace,monospace"
                  fill={active ? "#0c0e14" : "#eef1f7"} fontWeight="600">{v}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Array view — the actual storage */}
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">backing array</div>
      <div className="flex flex-wrap gap-1.5 pb-6 mb-3">
        {heap.map((v, i) => (
          <div key={i} className="relative flex-none w-11 h-11 rounded-md flex items-center justify-center font-mono text-sm font-semibold transition-all duration-200"
            style={{
              background: hot.includes(i) ? ACCENT : "#11131a",
              color: hot.includes(i) ? "#0c0e14" : "#eef1f7",
              border: `1px solid ${hot.includes(i) ? ACCENT : "rgba(255,255,255,0.12)"}`,
            }}>
            {v}
            <span className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[10px] text-ink-faint/60">{i}</span>
          </div>
        ))}
        {!heap.length && <span className="text-ink-faint font-mono text-xs py-3">empty</span>}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={insert}>insert · O(log n)</Btn>
        <Btn variant="ghost" onClick={extractMin}>extract_min · O(log n)</Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem]">{note}</p>
    </div>
  );
}
