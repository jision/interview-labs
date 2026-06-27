import React, { useState, useRef, useEffect } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#d6a94c";
const N = 5; // bounded buffer capacity (number of slots)

/* Two counting semaphores enforce backpressure on a bounded queue:
     empty, counts free slots, starts at N. produce() waits on it.
     full, counts ready items, starts at 0. consume() waits on it.
   Invariant at rest: empty + full == N, and neither is ever negative.
   A real implementation also needs a mutex around the buffer itself so
   two producers (or two consumers) don't corrupt it; here we step one
   thread at a time, so the mutex is implicit. */

let uid = 0; // stable ids so repeated values still animate correctly

export default function ProducerConsumerViz() {
  // buffer holds items in FIFO order: index 0 = oldest (next consumed)
  const [buffer, setBuffer] = useState([]);
  const [empty, setEmpty] = useState(N); // free-slot semaphore
  const [full, setFull] = useState(0); // ready-item semaphore
  const [blocked, setBlocked] = useState(null); // 'producer' | 'consumer' | null
  const [flash, setFlash] = useState(null); // { kind: 'put'|'take', id }
  const [seq, setSeq] = useState(1); // next item label, increments per produce
  const [note, setNote] = useState(
    `Empty buffer. empty=${N} (all slots free), full=0 (nothing to consume). Producers wait on "empty", consumers wait on "full".`
  );
  const timer = useRef(null);

  // clear a pending flash if we unmount mid-animation
  useEffect(() => () => clearTimeout(timer.current), []);

  function doFlash(kind, id) {
    setFlash({ kind, id });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(null), 550);
  }

  function produce() {
    // wait(empty): if no free slot, the producer blocks
    if (empty === 0) {
      setBlocked("producer");
      setNote(
        `produce(): buffer FULL (full=${N}, empty=0) → producer waits on the "empty" semaphore. It will not run until a consumer frees a slot and signals empty. This is backpressure, the fast producer is throttled to the consumer's pace.`
      );
      return;
    }
    const id = ++uid;
    const label = seq;
    setBuffer((b) => [...b, { id, label }]); // enqueue at the tail (FIFO)
    setEmpty((e) => e - 1); // wait(empty): one fewer free slot
    setFull((f) => f + 1); // signal(full): one more ready item
    setSeq((s) => s + 1);
    setBlocked(null);
    doFlash("put", id);
    setNote(
      `produce(): wait(empty) took a slot (empty ${empty}→${empty - 1}), wrote item #${label} at the tail, signal(full) (full ${full}→${full + 1}). A blocked consumer would wake now.`
    );
  }

  function consume() {
    // wait(full): if no item is ready, the consumer blocks
    if (full === 0) {
      setBlocked("consumer");
      setNote(
        `consume(): buffer EMPTY (full=0, empty=${N}) → consumer waits on the "full" semaphore. It sleeps until a producer enqueues an item and signals full, no busy-waiting, no CPU burned spinning.`
      );
      return;
    }
    const head = buffer[0]; // oldest item (FIFO)
    setBuffer((b) => b.slice(1)); // dequeue from the head
    setFull((f) => f - 1); // wait(full): one fewer ready item
    setEmpty((e) => e + 1); // signal(empty): one more free slot
    setBlocked(null);
    doFlash("take", head.id);
    setNote(
      `consume(): wait(full) took item #${head.label} from the head (full ${full}→${full - 1}), signal(empty) freed its slot (empty ${empty}→${empty + 1}). A blocked producer would wake now.`
    );
  }

  function reset() {
    setBuffer([]);
    setEmpty(N);
    setFull(0);
    setBlocked(null);
    setFlash(null);
    setSeq(1);
    clearTimeout(timer.current);
    setNote(
      `Reset. empty=${N}, full=0. Invariant: empty + full == ${N} at rest, neither ever negative.`
    );
  }

  // render N fixed slots; fill the first `buffer.length` from the head
  const slots = [];
  for (let i = 0; i < N; i++) {
    const item = buffer[i];
    const isHead = i === 0 && buffer.length > 0; // next to be consumed
    const isTail = item && i === buffer.length - 1; // most recently produced
    const isHot = item && flash && flash.id === item.id;
    slots.push(
      <div
        key={item ? item.id : "empty" + i}
        className="relative flex-none w-14 h-14 rounded-md flex items-center justify-center font-mono text-sm font-semibold transition-all duration-300"
        style={
          item
            ? isHot
              ? { background: ACCENT, color: "#0c0e14", border: `1px solid ${ACCENT}` }
              : {
                  background: "color-mix(in srgb,#d6a94c 18%,#15171f)",
                  color: "#eef1f7",
                  border: `1px solid ${ACCENT}`,
                }
            : { background: "#11131a", color: "#3a414d", border: "1px dashed rgba(255,255,255,0.12)" }
        }
      >
        {item ? `#${item.label}` : "·"}
        {isHead && (
          <span className="absolute -bottom-5 left-0 right-0 text-center text-[9px] uppercase tracking-wider text-[#4ade80]">
            head
          </span>
        )}
        {isTail && !isHead && (
          <span className="absolute -bottom-5 left-0 right-0 text-center text-[9px] uppercase tracking-wider text-ink-faint/70">
            tail
          </span>
        )}
      </div>
    );
  }

  const invariantOk = empty + full === N && empty >= 0 && full >= 0;

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      {/* Semaphore counters + invariant */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-3 font-mono text-xs">
        <span className="text-ink-faint">
          capacity <span className="text-ink font-semibold">{N}</span>
        </span>
        <span className="text-ink-faint">
          sem empty{" "}
          <span style={{ color: "#5fb3f0" }} className="font-semibold">
            {empty}
          </span>
        </span>
        <span className="text-ink-faint">
          sem full{" "}
          <span style={{ color: "#4ade80" }} className="font-semibold">
            {full}
          </span>
        </span>
        <span className="text-ink-faint">
          empty + full ={" "}
          <span
            className="font-semibold px-1.5 rounded"
            style={
              invariantOk
                ? { color: "#4ade80", background: "color-mix(in srgb,#4ade80 12%,transparent)" }
                : { color: "#f87171", background: "color-mix(in srgb,#f87171 14%,transparent)" }
            }
          >
            {empty + full}
          </span>
          <span className="text-ink-faint/70"> {invariantOk ? `== ${N} ✓` : "✕"}</span>
        </span>
      </div>

      {/* FIFO direction labels */}
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-ink-faint/70 mb-1 px-1">
        <span>◄ consume (head)</span>
        <span>produce (tail) ►</span>
      </div>

      {/* Buffer slots */}
      <div className="flex flex-wrap gap-2 pb-7 mb-2 min-h-[4rem]">{slots}</div>

      {/* Blocked-thread indicators */}
      <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
        <div
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 font-mono text-[11px] transition-all duration-200"
          style={
            blocked === "producer"
              ? { background: "color-mix(in srgb,#f87171 16%,#15171f)", border: "1px solid #f87171", color: "#f87171" }
              : { background: "#11131a", border: "1px solid rgba(255,255,255,0.08)", color: "#3a414d" }
          }
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: blocked === "producer" ? "#f87171" : "#3a414d" }}
          />
          producer{" "}
          {blocked === "producer" ? "BLOCKED · waits on empty" : "ready"}
        </div>
        <div
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 font-mono text-[11px] transition-all duration-200"
          style={
            blocked === "consumer"
              ? { background: "color-mix(in srgb,#f87171 16%,#15171f)", border: "1px solid #f87171", color: "#f87171" }
              : { background: "#11131a", border: "1px solid rgba(255,255,255,0.08)", color: "#3a414d" }
          }
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: blocked === "consumer" ? "#f87171" : "#3a414d" }}
          />
          consumer{" "}
          {blocked === "consumer" ? "BLOCKED · waits on full" : "ready"}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-2">
        <Btn tone={ACCENT} onClick={produce}>produce()</Btn>
        <Btn tone="#5fb3f0" onClick={consume}>consume()</Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[3.5rem] mt-2">{note}</p>
    </div>
  );
}
