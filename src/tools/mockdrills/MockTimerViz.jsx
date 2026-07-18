import React, { useEffect, useRef, useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * MockTimerViz, a phase-based countdown clock for running a self-mock under the
 * gun. One kind per instance ("coding" | "design" | "behavioral"). Each preset
 * is a list of phases whose seconds sum to the stated total (coding 45m,
 * design 60m, behavioral 45m across three story cycles).
 *
 * A single setInterval(1000) lives in a useEffect keyed on `running`; it is
 * cleaned up on unmount and whenever the clock pauses. Time is decremented one
 * second per tick (no target-timestamp math): refs hold the source of truth for
 * the ticking so the interval never reads stale state, and React state mirrors
 * them for rendering. On zero the clock auto-advances to the next phase and
 * stops when the last phase ends.
 */
const ACCENT = "#E37400";

const PRESETS = {
  coding: {
    title: "Coding mock",
    phases: [
      { name: "Clarify", sec: 5 * 60 },
      { name: "Approach", sec: 5 * 60 },
      { name: "Code", sec: 20 * 60 },
      { name: "Test", sec: 7 * 60 },
      { name: "Follow-ups", sec: 8 * 60 },
    ],
  },
  design: {
    title: "System-design mock",
    phases: [
      { name: "Requirements", sec: 6 * 60 },
      { name: "Estimate", sec: 5 * 60 },
      { name: "API + Data", sec: 8 * 60 },
      { name: "Architecture", sec: 12 * 60 },
      { name: "Deep-dive", sec: 18 * 60 },
      { name: "Failure + Ops", sec: 8 * 60 },
      { name: "Evolution", sec: 3 * 60 },
    ],
  },
  behavioral: {
    title: "Behavioral mock",
    phases: [
      { name: "Story 1 · pick", sec: 3 * 60 },
      { name: "Story 1 · STAR", sec: 7 * 60 },
      { name: "Story 1 · follow-ups", sec: 5 * 60 },
      { name: "Story 2 · pick", sec: 3 * 60 },
      { name: "Story 2 · STAR", sec: 7 * 60 },
      { name: "Story 2 · follow-ups", sec: 5 * 60 },
      { name: "Story 3 · pick", sec: 3 * 60 },
      { name: "Story 3 · STAR", sec: 7 * 60 },
      { name: "Story 3 · follow-ups", sec: 5 * 60 },
    ],
  },
};

function mmss(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function MockTimerViz({ kind = "coding" }) {
  const preset = PRESETS[kind] || PRESETS.coding;
  const phases = preset.phases;
  const totalSec = phases.reduce((s, p) => s + p.sec, 0);

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseLeft, setPhaseLeft] = useState(phases[0].sec);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  // Source of truth for the ticking, read by the interval to dodge stale closures.
  const idxRef = useRef(0);
  const leftRef = useRef(phases[0].sec);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      if (leftRef.current > 1) {
        leftRef.current -= 1;
        setPhaseLeft(leftRef.current);
        return;
      }
      // Current phase just hit zero.
      if (idxRef.current >= phases.length - 1) {
        leftRef.current = 0;
        setPhaseLeft(0);
        setRunning(false);
        setDone(true);
        return;
      }
      idxRef.current += 1;
      leftRef.current = phases[idxRef.current].sec;
      setPhaseIdx(idxRef.current);
      setPhaseLeft(leftRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [running, phases]);

  function resetCounters() {
    idxRef.current = 0;
    leftRef.current = phases[0].sec;
    setPhaseIdx(0);
    setPhaseLeft(phases[0].sec);
    setDone(false);
  }
  function reset() {
    setRunning(false);
    resetCounters();
  }
  function startPause() {
    if (running) {
      setRunning(false);
      return;
    }
    if (done) resetCounters();
    setRunning(true);
  }
  function skip() {
    if (idxRef.current >= phases.length - 1) {
      leftRef.current = 0;
      setPhaseLeft(0);
      setRunning(false);
      setDone(true);
      return;
    }
    idxRef.current += 1;
    leftRef.current = phases[idxRef.current].sec;
    setPhaseIdx(idxRef.current);
    setPhaseLeft(leftRef.current);
  }

  const phase = phases[phaseIdx];
  const wholeLeft =
    phaseLeft + phases.slice(phaseIdx + 1).reduce((s, p) => s + p.sec, 0);
  const phasePct = Math.round(((phase.sec - phaseLeft) / phase.sec) * 100);
  const atStart =
    phaseIdx === 0 && phaseLeft === phases[0].sec && !running && !done;
  const startLabel = running ? "pause" : done ? "restart" : atStart ? "start" : "resume";
  const phaseLabel = done
    ? "mock complete"
    : running
    ? "current phase"
    : atStart
    ? "first phase"
    : "paused on";

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="font-mono text-[11px] text-ink-faint">
          {preset.title} · <span className="text-ink">{totalSec / 60} min</span>
        </span>
        <span
          className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
          style={{ color: ACCENT, borderColor: ACCENT }}
        >
          phase {Math.min(phaseIdx + 1, phases.length)} / {phases.length}
        </span>
      </div>

      {/* current phase name + phase countdown */}
      <div className="flex items-end justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">
            {phaseLabel}
          </div>
          <div className="text-lg md:text-xl font-bold text-ink truncate">{phase.name}</div>
        </div>
        <div
          className="font-mono text-3xl md:text-4xl font-bold tabular-nums leading-none"
          style={{ color: done ? "var(--color-ink-faint)" : ACCENT }}
        >
          {mmss(phaseLeft)}
        </div>
      </div>

      {/* phase progress */}
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mb-4">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${phasePct}%`, background: ACCENT }}
        />
      </div>

      {/* whole-mock segmented timeline */}
      <div className="flex justify-between font-mono text-[10px] text-ink-faint mb-1">
        <span>whole mock</span>
        <span>
          <span className="text-ink">{mmss(wholeLeft)}</span> / {mmss(totalSec)} left
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-px mb-4">
        {phases.map((p, i) => {
          const fill = i < phaseIdx ? 100 : i === phaseIdx ? phasePct : 0;
          return (
            <div key={i} style={{ flexGrow: p.sec }} className="relative bg-surface-2 h-full">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-300"
                style={{ width: `${fill}%`, background: ACCENT, opacity: i === phaseIdx ? 1 : 0.5 }}
              />
            </div>
          );
        })}
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Btn tone={ACCENT} onClick={startPause}>{startLabel}</Btn>
        <Btn tone={ACCENT} variant="ghost" onClick={skip} disabled={done}>
          skip phase →
        </Btn>
        <Btn variant="ghost" onClick={reset}>↻ reset</Btn>
        <span className="font-mono text-[10px] text-ink-faint ml-auto">
          {done ? "score it against the rubric, then run it again" : "talk out loud the whole time"}
        </span>
      </div>
    </div>
  );
}
