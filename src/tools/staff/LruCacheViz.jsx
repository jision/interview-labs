import React, { useState, useRef, useEffect } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#d6a94c";
const CAP = 4;

/* The recency list is stored most-recent-first (index 0 = MRU, last = LRU).
   A real implementation uses a hash map (key -> DLL node) + a doubly linked
   list so both get and put are O(1); here we model the *order* directly. */

export default function LruCacheViz() {
  // each entry: { key, val }, kept in MRU -> LRU order
  const [order, setOrder] = useState([
    { key: "A", val: 1 },
    { key: "B", val: 2 },
    { key: "C", val: 3 },
  ]);
  const [touched, setTouched] = useState(null); // key flashed this step
  const [evicted, setEvicted] = useState(null); // key just evicted
  const [note, setNote] = useState(
    "Cache holds 3 of 4 slots. Order is most-recent (left) → least-recent (right)."
  );
  const timer = useRef(null);

  // clear a pending flash timer if the component unmounts mid-animation
  useEffect(() => () => clearTimeout(timer.current), []);

  function flash(key, ev) {
    setTouched(key);
    setEvicted(ev ?? null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTouched(null);
      setEvicted(null);
    }, 650);
  }

  function get(key) {
    const idx = order.findIndex((e) => e.key === key);
    if (idx === -1) {
      flash(null, null);
      setNote(`get(${key}) → MISS. ${key} is not in the cache; nothing changes.`);
      return;
    }
    const entry = order[idx];
    // a hit counts as a use → move to front (MRU)
    const next = [entry, ...order.filter((e) => e.key !== key)];
    setOrder(next);
    flash(key, null);
    setNote(
      `get(${key}) → HIT, returns ${entry.val}. A read counts as a use, so ${key} jumps to most-recent. O(1).`
    );
  }

  function put(key, val) {
    const idx = order.findIndex((e) => e.key === key);
    if (idx !== -1) {
      // update existing → refresh recency
      const next = [{ key, val }, ...order.filter((e) => e.key !== key)];
      setOrder(next);
      flash(key, null);
      setNote(`put(${key}, ${val}) → key exists: updated value and moved to most-recent. O(1).`);
      return;
    }
    // new key
    let working = order;
    let ev = null;
    if (order.length >= CAP) {
      ev = order[order.length - 1].key; // LRU is at the tail
      working = order.slice(0, CAP - 1);
    }
    const next = [{ key, val }, ...working];
    setOrder(next);
    flash(key, ev);
    setNote(
      ev
        ? `put(${key}, ${val}) → cache FULL (${CAP}). Evict the least-recently-used key "${ev}", then insert ${key} at most-recent. O(1).`
        : `put(${key}, ${val}) → free slot, insert at most-recent. O(1).`
    );
  }

  function reset() {
    setOrder([
      { key: "A", val: 1 },
      { key: "B", val: 2 },
      { key: "C", val: 3 },
    ]);
    setTouched(null);
    setEvicted(null);
    setNote("Reset. Order is most-recent (left) → least-recent (right).");
  }

  // first letter from D..Z not currently in the cache → always a fresh insert
  const present = new Set(order.map((e) => e.key));
  let nextKey = "D";
  for (let c = 68; c <= 90; c++) {
    const ch = String.fromCharCode(c);
    if (!present.has(ch)) {
      nextKey = ch;
      break;
    }
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 font-mono text-xs">
        <span className="text-ink-faint">
          capacity <span className="text-ink font-semibold">{CAP}</span>
        </span>
        <span className="text-ink-faint">
          size <span className="text-ink font-semibold">{order.length}</span>
        </span>
        <span className="text-ink-faint">
          LRU (next evicted){" "}
          <span className="text-ink font-semibold">
            {order.length ? order[order.length - 1].key : "-"}
          </span>
        </span>
      </div>

      {/* Recency labels */}
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-ink-faint/70 mb-1 px-1">
        <span>◄ most recent</span>
        <span>least recent ►</span>
      </div>

      {/* Cards row */}
      <div className="flex flex-wrap gap-2 mb-1 min-h-[3.75rem]">
        {order.map((e, i) => {
          const isTail = i === order.length - 1;
          const isHot = touched === e.key;
          return (
            <div
              key={e.key}
              className="relative flex-none w-16 h-14 rounded-md flex flex-col items-center justify-center font-mono transition-all duration-300"
              style={
                isHot
                  ? { background: ACCENT, color: "#0c0e14", border: `1px solid ${ACCENT}` }
                  : {
                      background: "color-mix(in srgb,#d6a94c 14%,#15171f)",
                      color: "#eef1f7",
                      border: `1px solid ${isTail ? "#f87171" : "rgba(214,169,76,0.6)"}`,
                    }
              }
            >
              <span className="text-sm font-bold">{e.key}</span>
              <span className="text-[11px] opacity-80">= {e.val}</span>
              {isTail && (
                <span className="absolute -bottom-4 left-0 right-0 text-center text-[9px] text-[#f87171]">
                  LRU
                </span>
              )}
            </div>
          );
        })}
        {evicted && (
          <div
            className="flex-none w-16 h-14 rounded-md flex flex-col items-center justify-center font-mono opacity-60"
            style={{ background: "#11131a", color: "#f87171", border: "1px dashed #f87171" }}
          >
            <span className="text-sm font-bold line-through">{evicted}</span>
            <span className="text-[9px]">evicted</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-2 mt-5">
        <Btn tone={ACCENT} onClick={() => get("A")}>get(A)</Btn>
        <Btn tone={ACCENT} onClick={() => get("C")}>get(C)</Btn>
        <Btn tone="#5fb3f0" onClick={() => put(nextKey, order.length + 1)}>
          put({nextKey}) · may evict
        </Btn>
        <Btn variant="ghost" onClick={() => put("A", 9)}>put(A, 9) · update</Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem] mt-2">{note}</p>
    </div>
  );
}
