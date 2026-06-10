import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#38e0d6";

/* CPython's real over-allocation formula (listobject.c, list_resize):
   new_allocated = newsize + (newsize >> 3) + (newsize < 9 ? 3 : 6)   */
function cpythonCapacity(newsize) {
  if (newsize === 0) return 0;
  return newsize + (newsize >> 3) + (newsize < 9 ? 3 : 6);
}

let uid = 0;

export default function DynamicArrayViz() {
  const [items, setItems] = useState(() =>
    [3, 1, 4].map((v) => ({ id: ++uid, v }))
  );
  const [capacity, setCapacity] = useState(() => cpythonCapacity(3));
  const [reallocs, setReallocs] = useState(0);
  const [shifts, setShifts] = useState(0);
  const [flash, setFlash] = useState(null); // 'realloc' | 'shift'
  const [last, setLast] = useState("Initialized list [3, 1, 4].");

  const size = items.length;

  function bump(kind) {
    setFlash(kind);
    setTimeout(() => setFlash(null), 450);
  }

  function append() {
    const v = Math.floor(Math.random() * 90 + 10);
    const newSize = size + 1;
    if (newSize > capacity) {
      const cap = cpythonCapacity(newSize);
      setCapacity(cap);
      setReallocs((r) => r + 1);
      bump("realloc");
      setLast(
        `append(${v}): size ${size}→${newSize} exceeded capacity → reallocated to ${cap} slots. This costs O(n) once, but it's rare → amortized O(1).`
      );
    } else {
      setLast(`append(${v}): free slot available → O(1), no reallocation.`);
    }
    setItems((xs) => [...xs, { id: ++uid, v }]);
  }

  function prepend() {
    const v = Math.floor(Math.random() * 90 + 10);
    const newSize = size + 1;
    let note = `insert(0, ${v}): every existing element shifts right one slot → O(n).`;
    if (newSize > capacity) {
      const cap = cpythonCapacity(newSize);
      setCapacity(cap);
      setReallocs((r) => r + 1);
      note += ` Also triggered a reallocation to ${cap} slots.`;
    }
    setShifts((s) => s + size);
    bump("shift");
    setItems((xs) => [{ id: ++uid, v }, ...xs]);
    setLast(note);
  }

  function popEnd() {
    if (!size) return;
    setItems((xs) => xs.slice(0, -1));
    setLast(`pop(): removes the last element → O(1). Capacity stays ${capacity} (Python rarely shrinks).`);
  }

  function popFront() {
    if (!size) return;
    setShifts((s) => s + (size - 1));
    bump("shift");
    setItems((xs) => xs.slice(1));
    setLast(`pop(0): removes the first element, then shifts ${size - 1} elements left → O(n).`);
  }

  function reset() {
    setItems([3, 1, 4].map((v) => ({ id: ++uid, v })));
    setCapacity(cpythonCapacity(3));
    setReallocs(0);
    setShifts(0);
    setLast("Reset to [3, 1, 4].");
  }

  const slots = [];
  for (let i = 0; i < Math.max(capacity, size); i++) {
    const item = items[i];
    slots.push(
      <div
        key={item ? item.id : "empty" + i}
        className="relative flex-none w-12 h-12 rounded-md flex items-center justify-center font-mono text-sm font-semibold transition-all duration-300"
        style={
          item
            ? { background: "color-mix(in srgb,#38e0d6 16%,#15171f)", color: "#eef1f7", border: `1px solid ${ACCENT}` }
            : { background: "#11131a", color: "#3a414d", border: "1px dashed rgba(255,255,255,0.12)" }
        }
      >
        {item ? item.v : "·"}
        <span className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[10px] text-ink-faint/60">
          {i}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 font-mono text-xs">
        <Stat label="len" value={size} />
        <Stat
          label="capacity"
          value={capacity}
          highlight={flash === "realloc"}
          tone={ACCENT}
        />
        <Stat label="slack" value={capacity - size} />
        <Stat label="reallocations" value={reallocs} />
        <Stat label="elements shifted" value={shifts} highlight={flash === "shift"} tone="#fbbf24" />
      </div>

      {/* Slots */}
      <div className="flex flex-wrap gap-2 pb-7 mb-3 min-h-[4rem]">{slots}</div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={append}>append() · O(1)*</Btn>
        <Btn tone="#fbbf24" onClick={prepend}>insert(0) · O(n)</Btn>
        <Btn variant="ghost" onClick={popEnd}>pop()</Btn>
        <Btn variant="ghost" onClick={popFront}>pop(0)</Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem]">{last}</p>
    </div>
  );
}

function Stat({ label, value, highlight, tone }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-ink-faint">{label}</span>
      <span
        className="font-semibold px-1.5 rounded transition-all duration-300"
        style={
          highlight
            ? { color: "#0c0e14", background: tone || "#fff" }
            : { color: "#eef1f7" }
        }
      >
        {value}
      </span>
    </span>
  );
}
