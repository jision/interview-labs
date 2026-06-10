import React, { useState, useRef, useEffect, useMemo } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#d6a94c";
const N = 3; // increments per thread
const T1 = "#5fb3f0";
const T2 = "#e879c9";

/* Model `count += 1` as three non-atomic steps:
     LOAD   reg <- count        (read shared into a thread-local register)
     ADD    reg <- reg + 1      (compute in the register)
     STORE  count <- reg        (write the register back)
   With NO lock, an unlucky interleave makes one thread overwrite the
   other's STORE -> a "lost update". With a lock, each thread's 3 steps
   run as one critical section, so the final value is always 2*N. */

const STEPS = ["LOAD", "ADD", "STORE"];

/* The order in which bytecode steps execute. */
function buildOps(useLock) {
  const a = [];
  const b = [];
  for (let k = 0; k < N; k++) {
    STEPS.forEach((step) => {
      a.push({ thread: 0, step, k });
      b.push({ thread: 1, step, k });
    });
  }
  if (useLock) {
    // mutual exclusion: every critical section runs start-to-finish. Order
    // doesn't matter for the result; we run all of A, then all of B.
    return [...a, ...b];
  }
  // A specific unlucky interleave that loses an update:
  // A:LOAD A:ADD  B:LOAD B:ADD  A:STORE B:STORE  then the rest cleanly.
  return [a[0], a[1], b[0], b[1], a[2], b[2], ...a.slice(3), ...b.slice(3)];
}

/* Precompute the full trace: trace[i] = state AFTER executing ops[0..i-1].
   trace[0] is the initial state. trace[ops.length] is the final state. */
function buildTrace(ops, useLock) {
  const trace = [{ count: 0, regA: null, regB: null, held: null, msg: null }];
  let count = 0;
  let regA = null;
  let regB = null;
  for (const op of ops) {
    const name = op.thread === 0 ? "A" : "B";
    let msg;
    let held = useLock ? op.thread : null;
    if (op.step === "LOAD") {
      if (op.thread === 0) regA = count;
      else regB = count;
      msg = `Thread ${name}: LOAD — read shared count (${count}) into its register.`;
    } else if (op.step === "ADD") {
      if (op.thread === 0) regA = (regA ?? 0) + 1;
      else regB = (regB ?? 0) + 1;
      const r = op.thread === 0 ? regA : regB;
      msg = `Thread ${name}: ADD — register = ${r - 1} + 1 = ${r} (local only; count untouched).`;
    } else {
      const r = op.thread === 0 ? regA : regB;
      const before = count;
      count = r ?? 0;
      const lost = before === count; // wrote a value already there → an update vanished
      msg =
        `Thread ${name}: STORE — write register (${r}) back → count = ${count}.` +
        (lost ? " ⚠ This re-wrote a value already present — an increment was LOST." : "");
    }
    trace.push({ count, regA, regB, held, msg });
  }
  return trace;
}

export default function RaceConditionViz() {
  const [useLock, setUseLock] = useState(false);
  const [pc, setPc] = useState(0); // how many ops executed
  const timers = useRef([]);

  const ops = useMemo(() => buildOps(useLock), [useLock]);
  const trace = useMemo(() => buildTrace(ops, useLock), [ops, useLock]);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const expected = 2 * N;
  const done = pc >= ops.length;
  const state = trace[pc];
  const cur = !done ? ops[pc] : null;

  const initialMsg = useLock
    ? "count = 0, one lock guards count. Each increment runs as an atomic critical section — no interleaving."
    : "count = 0. Each thread runs count += 1 three times. Without a lock, += 1 is THREE steps and can interleave.";
  const note = state.msg || initialMsg;

  function step() {
    if (pc < ops.length) setPc(pc + 1);
  }

  function run() {
    let i = pc;
    const tick = () => {
      i += 1;
      setPc(i);
      if (i < ops.length) {
        const t = setTimeout(tick, 520);
        timers.current.push(t);
      }
    };
    if (i < ops.length) {
      const t = setTimeout(tick, 0);
      timers.current.push(t);
    }
  }

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function toggleLock() {
    clearTimers();
    setUseLock((v) => !v);
    setPc(0);
  }

  function reset() {
    clearTimers();
    setPc(0);
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      {/* Mode toggle + counters */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 font-mono text-xs">
        <button
          onClick={toggleLock}
          className="font-mono text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors"
          style={{
            borderColor: useLock ? "#4ade80" : "#f87171",
            color: useLock ? "#4ade80" : "#f87171",
            background: useLock
              ? "color-mix(in srgb,#4ade80 12%,transparent)"
              : "color-mix(in srgb,#f87171 12%,transparent)",
          }}
        >
          {useLock ? "🔒 with lock" : "🔓 without lock"}
        </button>
        <span className="text-ink-faint">
          shared count{" "}
          <span
            className="text-ink font-bold text-sm px-1.5 rounded"
            style={{ background: "#11131a" }}
          >
            {state.count}
          </span>
        </span>
        <span className="text-ink-faint">
          expected <span className="text-ink font-semibold">{expected}</span>
        </span>
      </div>

      {/* Registers */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Lane
          label="Thread A"
          color={T1}
          reg={state.regA}
          active={cur && cur.thread === 0}
          holds={state.held === 0 && useLock}
          step={cur && cur.thread === 0 ? cur.step : null}
        />
        <Lane
          label="Thread B"
          color={T2}
          reg={state.regB}
          active={cur && cur.thread === 1}
          holds={state.held === 1 && useLock}
          step={cur && cur.thread === 1 ? cur.step : null}
        />
      </div>

      {/* Progress dots */}
      <div className="flex flex-wrap gap-1 mb-4">
        {ops.map((op, i) => (
          <span
            key={i}
            title={`${op.thread === 0 ? "A" : "B"} ${op.step}`}
            className="w-2.5 h-2.5 rounded-full transition-all duration-200"
            style={{
              background:
                i < pc
                  ? op.thread === 0
                    ? T1
                    : T2
                  : i === pc
                  ? "#fff"
                  : "rgba(255,255,255,0.14)",
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={step} disabled={done}>
          step ▸
        </Btn>
        <Btn tone="#5fb3f0" onClick={run} disabled={done}>
          run to end
        </Btn>
        <Btn variant="ghost" onClick={reset}>
          reset
        </Btn>
      </div>

      {/* Result banner */}
      {done && (
        <div
          className="rounded-md px-3 py-2 mb-2 font-mono text-xs font-semibold"
          style={{
            background:
              state.count === expected
                ? "color-mix(in srgb,#4ade80 14%,transparent)"
                : "color-mix(in srgb,#f87171 16%,transparent)",
            color: state.count === expected ? "#4ade80" : "#f87171",
          }}
        >
          {state.count === expected
            ? `✓ count = ${state.count} = ${expected}. The lock made each += 1 atomic — no lost updates.`
            : `✕ count = ${state.count}, expected ${expected}. ${expected - state.count} update(s) lost: two threads read the same value and one STORE clobbered the other.`}
        </div>
      )}

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem]">{note}</p>
    </div>
  );
}

function Lane({ label, color, reg, active, holds, step }) {
  return (
    <div
      className="rounded-lg p-3 border transition-all duration-200"
      style={{
        borderColor: active ? color : "rgba(255,255,255,0.12)",
        background: active ? `color-mix(in srgb,${color} 10%,transparent)` : "transparent",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-xs font-semibold" style={{ color }}>
          {label}
        </span>
        {holds && (
          <span className="font-mono text-[10px]" style={{ color: "#4ade80" }}>
            🔒 holds lock
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="text-ink-faint">reg</span>
        <span
          className="px-1.5 py-0.5 rounded text-ink font-semibold"
          style={{ background: "#11131a", minWidth: 24, textAlign: "center" }}
        >
          {reg == null ? "—" : reg}
        </span>
        {step && (
          <span
            className="ml-auto px-1.5 py-0.5 rounded font-bold"
            style={{ color, background: "#11131a" }}
          >
            {step}
          </span>
        )}
      </div>
    </div>
  );
}
