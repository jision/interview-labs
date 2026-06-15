import React, { useEffect, useRef, useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * 1-D gradient descent — animated, no model in the browser.
 * Loss surface: f(x) = (x - c)^2 + a small sine bump so it's not a clean parabola.
 * step:  x -= lr * f'(x)
 * run:   animate steps via setInterval until near the min or it diverges.
 * High lr → the ball overshoots and diverges; we flag it.
 */
const ACCENT = "#7c5cff";

const C = 3.2; // location of the main minimum
const X_MIN = -6;
const X_MAX = 9;
const Y_MAX = 30; // clamp for plotting / divergence detection

// f(x) = (x-c)^2 + a gentle bump
function f(x) {
  return (x - C) * (x - C) + 2.2 * Math.sin(1.5 * x);
}
// f'(x)
function df(x) {
  return 2 * (x - C) + 2.2 * 1.5 * Math.cos(1.5 * x);
}

// SVG viewBox is 0..100 wide, 0..100 tall. Map world coords into it.
const sx = (x) => ((x - X_MIN) / (X_MAX - X_MIN)) * 100;
const sy = (y) => 100 - (Math.min(Math.max(y, -2), Y_MAX) / Y_MAX) * 96 - 2;

// Precompute the curve path once.
const CURVE = (() => {
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const x = X_MIN + (i / 120) * (X_MAX - X_MIN);
    pts.push(`${sx(x).toFixed(2)},${sy(f(x)).toFixed(2)}`);
  }
  return "M" + pts.join(" L");
})();

const START_X = -1.5; // on the visible part of the curve (loss < Y_MAX), left of the min

export default function GradientDescentViz() {
  const [x, setX] = useState(START_X);
  const [lr, setLr] = useState(0.08);
  const [running, setRunning] = useState(false);
  const [diverged, setDiverged] = useState(false);
  const [steps, setSteps] = useState(0);

  const timer = useRef(null);
  const xRef = useRef(x);
  xRef.current = x;
  const lrRef = useRef(lr);
  lrRef.current = lr;

  function doStep() {
    const cur = xRef.current;
    const next = cur - lrRef.current * df(cur);
    setSteps((s) => s + 1);
    // diverging: the step overshot and flew off the chart (lr too big), or went non-finite.
    // (We deliberately do NOT flag "loss still high" — a healthy step downhill can start above
    // the plot clamp; only an out-of-range or exploding x is true divergence.)
    if (!Number.isFinite(next) || next < X_MIN - 4 || next > X_MAX + 4) {
      setDiverged(true);
      setRunning(false);
      // clamp so the ball stays renderable at the edge
      setX(Math.min(Math.max(next, X_MIN - 1), X_MAX + 1));
      return false;
    }
    setX(next);
    // converged: gradient is ~flat
    if (Math.abs(df(next)) < 0.01) {
      setRunning(false);
      return false;
    }
    return true;
  }

  // run loop
  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      const keepGoing = doStep();
      if (!keepGoing && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }, 120);
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function reset() {
    setRunning(false);
    setDiverged(false);
    setSteps(0);
    setX(START_X);
  }

  const loss = f(x);
  const bx = sx(x);
  const by = sy(loss);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="text-sm text-ink-dim mb-3">
        The ball rolls downhill: <code className="font-mono text-ink">x −= lr · f′(x)</code>. Nudge
        the learning rate and watch it converge — or, if it's too big,{" "}
        <span className="text-ink font-semibold">overshoot and diverge</span>.
      </div>

      <div className="rounded-lg border border-line bg-[#0e1018] overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full" style={{ height: 300 }}>
          {/* loss curve */}
          <path d={CURVE} fill="none" stroke="#3a4150" strokeWidth={0.8} />
          {/* gradient direction tick at the ball */}
          {!diverged && (
            <line
              x1={bx}
              y1={by}
              x2={sx(x - Math.sign(df(x)) * 0.9)}
              y2={by}
              stroke={ACCENT}
              strokeWidth={0.6}
              opacity={0.6}
            />
          )}
          {/* the ball */}
          <circle cx={bx} cy={by} r={2.4} fill={diverged ? "#f87171" : ACCENT} />
          <circle cx={bx} cy={by} r={2.4} fill="none" stroke="#0e1018" strokeWidth={0.5} />
        </svg>
      </div>

      {/* learning-rate slider */}
      <div className="mt-4">
        <div className="flex justify-between font-mono text-[11px] mb-1">
          <span className="text-ink-dim">learning rate</span>
          <span style={{ color: ACCENT }}>{lr.toFixed(3)}</span>
        </div>
        <input
          type="range"
          min={0.005}
          max={1.5}
          step={0.005}
          value={lr}
          onChange={(e) => {
            setLr(parseFloat(e.target.value));
            setDiverged(false);
          }}
          className="w-full"
          style={{ accentColor: ACCENT }}
        />
      </div>

      {/* controls */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <Btn onClick={doStep} tone={ACCENT} disabled={running}>
          ▸ step
        </Btn>
        {running ? (
          <Btn onClick={() => setRunning(false)} tone={ACCENT} variant="ghost">
            ❚❚ pause
          </Btn>
        ) : (
          <Btn onClick={() => { setDiverged(false); setRunning(true); }} tone={ACCENT}>
            ▸ run
          </Btn>
        )}
        <Btn onClick={reset} variant="ghost">
          ↺ reset
        </Btn>

        <div className="ml-auto flex items-center gap-4 font-mono text-[11px]">
          <span className="text-ink-faint">
            x <span className="text-ink">{x.toFixed(3)}</span>
          </span>
          <span className="text-ink-faint">
            loss <span className="text-ink">{Number.isFinite(loss) ? loss.toFixed(3) : "∞"}</span>
          </span>
          <span className="text-ink-faint">
            steps <span className="text-ink">{steps}</span>
          </span>
        </div>
      </div>

      {diverged && (
        <div
          className="mt-3 rounded-md px-3 py-2 font-mono text-[11px]"
          style={{
            background: "color-mix(in srgb, #f87171 12%, transparent)",
            color: "#f87171",
          }}
        >
          ⚠ diverging — the step jumped past the minimum. Lower the learning rate.
        </div>
      )}
    </div>
  );
}
