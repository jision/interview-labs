import React, { useState, useRef, useEffect } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#d6a94c";

/* RandomizedSet: average O(1) insert / remove / getRandom.
   The trick is keeping TWO structures in sync:
     vals  — a dense array of the values (no holes)
     idx   — a dict  val -> position of that value in `vals`
   Insert appends and records the position. The hard one is remove:
   to delete from the middle of an array in O(1) you can't shift, so you
   SWAP the doomed element with the last element, fix the moved element's
   recorded index, then pop the tail. getRandom is just vals[random index]. */

export default function InsertDeleteGetRandomViz() {
  // dense array of values
  const [vals, setVals] = useState([10, 20, 30]);
  // val -> index in `vals`
  const [idx, setIdx] = useState({ 10: 0, 20: 1, 30: 2 });
  // counter so "insert" always produces a fresh, not-yet-present value
  const next = useRef(40);

  // transient highlight state for the animation
  const [hot, setHot] = useState([]); // indices flashed this step
  const [swapPair, setSwapPair] = useState(null); // [i, lastIdx] during a remove-swap
  const [randHit, setRandHit] = useState(null); // index lit by getRandom
  const [note, setNote] = useState(
    "Two structures kept in sync: a dense array of values + a dict val→index. All three ops are average O(1)."
  );
  const timer = useRef(null);

  // clear any pending flash timer if we unmount mid-animation
  useEffect(() => () => clearTimeout(timer.current), []);

  function clearFlash(ms = 750) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setHot([]);
      setSwapPair(null);
      setRandHit(null);
    }, ms);
  }

  function insert() {
    // pick a fresh value not already present (counter guarantees uniqueness)
    let v = next.current;
    while (idx[v] !== undefined) v += 10;
    next.current = v + 10;

    const pos = vals.length;
    setVals((xs) => [...xs, v]);
    setIdx((m) => ({ ...m, [v]: pos }));
    setHot([pos]);
    setSwapPair(null);
    setRandHit(null);
    setNote(
      `insert(${v}): append at the end (index ${pos}), then record idx[${v}] = ${pos}. No shifting, no search → O(1).`
    );
    clearFlash();
  }

  function remove(x) {
    if (vals.length === 0) return;
    const i = idx[x];
    if (i === undefined) return;
    const lastIdx = vals.length - 1;
    const lastVal = vals[lastIdx];

    if (i === lastIdx) {
      // removing the tail itself — no swap needed
      setVals((xs) => xs.slice(0, -1));
      setIdx((m) => {
        const n = { ...m };
        delete n[x];
        return n;
      });
      setHot(lastIdx > 0 ? [lastIdx - 1] : []);
      setSwapPair(null);
      setRandHit(null);
      setNote(
        `remove(${x}): ${x} is already the last element (index ${lastIdx}) → just pop the tail and delete idx[${x}]. No swap needed. O(1).`
      );
      clearFlash();
      return;
    }

    // THE TRICK: overwrite slot i with the last value, fix that value's index, pop the tail.
    setVals((xs) => {
      const n = [...xs];
      n[i] = lastVal; // move last value into the hole left by x
      n.pop(); // drop the now-duplicate tail
      return n;
    });
    setIdx((m) => {
      const n = { ...m };
      n[lastVal] = i; // the moved value now lives at index i
      delete n[x]; // x is gone
      return n;
    });
    setHot([i]);
    setSwapPair([i, lastIdx]);
    setRandHit(null);
    setNote(
      `remove(${x}): x sits at index ${i}. Move the LAST value ${lastVal} into slot ${i}, update idx[${lastVal}] = ${i}, then pop the tail and delete idx[${x}]. Swap-with-last avoids an O(n) shift → O(1).`
    );
    clearFlash(1100);
  }

  function getRandom() {
    if (vals.length === 0) return;
    const r = Math.floor(Math.random() * vals.length);
    setRandHit(r);
    setHot([]);
    setSwapPair(null);
    setNote(
      `getRandom(): pick a uniform index in [0, ${vals.length}) → got ${r}, return vals[${r}] = ${vals[r]}. A dense array makes uniform sampling a single index lookup → O(1).`
    );
    clearFlash();
  }

  function reset() {
    setVals([10, 20, 30]);
    setIdx({ 10: 0, 20: 1, 30: 2 });
    next.current = 40;
    setHot([]);
    setSwapPair(null);
    setRandHit(null);
    setNote(
      "Reset to [10, 20, 30]. Two structures in sync: a dense array of values + a dict val→index."
    );
    clearTimeout(timer.current);
  }

  const lastIdx = vals.length - 1;
  // entries for the dict view, ordered by value for stable reading
  const entries = Object.keys(idx)
    .map(Number)
    .sort((a, b) => a - b);

  // remove targets: head and a middle element so the swap is visible
  const removeHead = vals.length ? vals[0] : null;
  const removeMid =
    vals.length > 1 ? vals[Math.floor((vals.length - 1) / 2)] : null;

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 font-mono text-xs">
        <span className="text-ink-faint">
          size <span className="text-ink font-semibold">{vals.length}</span>
        </span>
        <span className="text-ink-faint">
          last index{" "}
          <span className="text-ink font-semibold">
            {vals.length ? lastIdx : "—"}
          </span>
        </span>
      </div>

      {/* The dense values array */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint/70 mb-1.5">
        vals — dense array (no holes)
      </div>
      <div className="flex flex-wrap gap-2 pb-7 mb-2 min-h-[3.5rem]">
        {vals.length === 0 && (
          <span className="text-ink-faint text-sm font-mono py-3">empty</span>
        )}
        {vals.map((v, i) => {
          const isHot = hot.includes(i);
          const isRand = randHit === i;
          const inSwap = swapPair && (i === swapPair[0] || i === swapPair[1]);
          const isTail = i === lastIdx;
          let style;
          if (isRand) {
            style = { background: "#5fb3f0", color: "#0c0e14", border: "1px solid #5fb3f0" };
          } else if (isHot) {
            style = { background: ACCENT, color: "#0c0e14", border: `1px solid ${ACCENT}` };
          } else if (inSwap) {
            style = {
              background: "color-mix(in srgb,#d6a94c 14%,#15171f)",
              color: "#eef1f7",
              border: "1px dashed #d6a94c",
            };
          } else {
            style = {
              background: "color-mix(in srgb,#d6a94c 14%,#15171f)",
              color: "#eef1f7",
              border: `1px solid ${isTail ? "rgba(95,179,240,0.7)" : "rgba(214,169,76,0.6)"}`,
            };
          }
          return (
            <div
              key={`cell-${i}`}
              className="relative flex-none w-14 h-12 rounded-md flex items-center justify-center font-mono text-sm font-bold transition-all duration-300"
              style={style}
            >
              {v}
              <span className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[10px] text-ink-faint/60">
                {i}
                {isTail && <span className="text-[#5fb3f0]"> · last</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* The val -> index dict */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint/70 mb-1.5 mt-3">
        idx — dict val → index
      </div>
      <div className="flex flex-wrap gap-2 mb-1 min-h-[2.5rem]">
        {entries.length === 0 && (
          <span className="text-ink-faint text-sm font-mono py-2">{`{}`}</span>
        )}
        {entries.map((v) => {
          const pos = idx[v];
          const isHot = hot.includes(pos) || (swapPair && pos === swapPair[0]);
          return (
            <div
              key={`kv-${v}`}
              className="flex-none h-9 px-2.5 rounded-md flex items-center gap-1 font-mono text-xs transition-all duration-300"
              style={
                isHot
                  ? { background: ACCENT, color: "#0c0e14", border: `1px solid ${ACCENT}` }
                  : {
                      background: "#11131a",
                      color: "#eef1f7",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }
              }
            >
              <span className="font-bold">{v}</span>
              <span className="opacity-60">→</span>
              <span className="font-bold">{pos}</span>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-2 mt-5">
        <Btn tone={ACCENT} onClick={insert}>insert() · O(1)</Btn>
        <Btn
          tone="#fbbf24"
          onClick={() => remove(removeMid)}
          disabled={removeMid === null}
        >
          {removeMid !== null ? `remove(${removeMid}) · swap-with-last` : "remove · swap"}
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => remove(removeHead)}
          disabled={removeHead === null}
        >
          {removeHead !== null ? `remove(${removeHead})` : "remove"}
        </Btn>
        <Btn
          tone="#5fb3f0"
          onClick={getRandom}
          disabled={vals.length === 0}
        >
          getRandom() · O(1)
        </Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[3.25rem] mt-2">{note}</p>
    </div>
  );
}
