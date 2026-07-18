import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Retry-amplification visualizer. Stack N layers/hops that each retry up to R
 * times on a failure below them, and one user request becomes R^N requests at
 * the deepest layer, the multiplicative blow-up that turns a small overload into
 * a cascading failure. The "retry budget" toggle caps each hop to ~1 + budget
 * (retries held under a small fraction of requests), collapsing R^N back toward
 * ~1x. All arithmetic is exact: Math.pow(factor, layers). Self-contained.
 */
const ACCENT = "#F9AB00";
const HOT = "#f87171";
const BUDGET = 0.1; // 10% retry budget: a hop may spend retries up to 10% of its requests
const BASE_QPS = 1000; // user-facing request rate we trace down the stack

export default function RetryAmplificationViz() {
  const [retries, setRetries] = useState(3); // attempts each layer makes on failure (1 = no retries)
  const [layers, setLayers] = useState(3); // number of stacked retrying hops
  const [budgetOn, setBudgetOn] = useState(false);

  // per-hop amplification factor. Without a budget each hop multiplies by `retries`.
  // A retry budget caps a hop to 1 + BUDGET (you can never retry more than the
  // retry setting itself, so take the min for the R = 1 "no retries" edge).
  const factorOff = retries;
  const factorOn = Math.min(retries, 1 + BUDGET);
  const factor = budgetOn ? factorOn : factorOff;

  const multOff = Math.pow(factorOff, layers); // R ^ N, the headline blow-up
  const multOn = Math.pow(factorOn, layers); // (1 + budget) ^ N, the capped version
  const mult = budgetOn ? multOn : multOff;

  // attempts arriving at each depth d (0 = user, layers = deepest backend)
  const levels = [];
  for (let d = 0; d <= layers; d++) levels.push(Math.pow(factor, d));
  const bottom = levels[levels.length - 1];

  const reduction = multOn > 0 ? multOff / multOn : 1;

  const fmtMult = (m) => (Number.isInteger(m) ? String(m) : m.toFixed(2));
  const fmtQps = (n) => Math.round(n).toLocaleString("en-US");

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* sliders */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center justify-between font-mono text-[11px] mb-1.5">
            <span className="text-ink-dim">attempts per layer (R)</span>
            <span style={{ color: ACCENT }} className="font-semibold">{retries}</span>
          </div>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={retries}
            onChange={(e) => setRetries(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: ACCENT }}
          />
          <div className="font-mono text-[10px] text-ink-faint mt-1">1 = no retries (1 attempt)</div>
        </div>
        <div>
          <div className="flex items-center justify-between font-mono text-[11px] mb-1.5">
            <span className="text-ink-dim">stacked layers / hops (N)</span>
            <span style={{ color: ACCENT }} className="font-semibold">{layers}</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={layers}
            onChange={(e) => setLayers(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: ACCENT }}
          />
          <div className="font-mono text-[10px] text-ink-faint mt-1">each hop retries the one below it</div>
        </div>
      </div>

      {/* budget toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Btn tone={ACCENT} variant={budgetOn ? "solid" : "ghost"} onClick={() => setBudgetOn((b) => !b)}>
          retry budget {budgetOn ? "ON" : "OFF"}
        </Btn>
        <span className="font-mono text-[11px] text-ink-faint">
          caps each hop to 1 + {Math.round(BUDGET * 100)}% instead of x{retries}
        </span>
      </div>

      {/* headline numbers */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: budgetOn ? "var(--color-line)" : HOT,
            background: budgetOn ? "transparent" : "color-mix(in srgb, " + HOT + " 8%, transparent)",
          }}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: HOT }}>
            no retry budget: R ^ N
          </div>
          <div className="text-2xl font-bold text-ink">x{fmtMult(multOff)}</div>
          <div className="font-mono text-[11px] text-ink-faint mt-0.5">
            {retries} ^ {layers} = {fmtMult(multOff)}
          </div>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: budgetOn ? ACCENT : "var(--color-line)",
            background: budgetOn ? "color-mix(in srgb, " + ACCENT + " 10%, transparent)" : "transparent",
          }}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: ACCENT }}>
            retry budget on: (1 + {Math.round(BUDGET * 100)}%) ^ N
          </div>
          <div className="text-2xl font-bold text-ink">x{fmtMult(multOn)}</div>
          <div className="font-mono text-[11px] text-ink-faint mt-0.5">
            {factorOn.toFixed(2)} ^ {layers} = {fmtMult(multOn)}
          </div>
        </div>
      </div>

      {/* per-layer bars */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">
        requests arriving at each layer {budgetOn ? "(budget on)" : "(budget off)"}
      </div>
      <div className="space-y-1.5 mb-3">
        {levels.map((v, d) => {
          const isUser = d === 0;
          const isBottom = d === layers;
          const barColor = budgetOn ? ACCENT : d === 0 ? "var(--color-line-strong)" : HOT;
          const pct = bottom > 0 ? (v / bottom) * 100 : 0;
          return (
            <div key={d} className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-ink-faint w-16 flex-none">
                {isUser ? "user" : isBottom ? "backend" : "layer " + d}
              </span>
              <div className="flex-1 h-5 rounded bg-surface-2 overflow-hidden relative">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${Math.max(pct, 2)}%`, background: barColor }}
                />
              </div>
              <span className="font-mono text-[11px] text-ink w-24 flex-none text-right">
                {fmtQps(BASE_QPS * v)} req/s
              </span>
            </div>
          );
        })}
      </div>

      {/* verdict line */}
      <div className="rounded-lg bg-surface-2 p-3 font-mono text-[11px] text-ink-dim leading-relaxed">
        {budgetOn ? (
          <>
            A retry budget holds retries under {Math.round(BUDGET * 100)}% at every hop, so {fmtQps(BASE_QPS)} req/s
            reaches the backend as only {fmtQps(BASE_QPS * multOn)} req/s (x{fmtMult(multOn)}).{" "}
            {reduction > 1.05 ? (
              <>That is about <span style={{ color: ACCENT }}>{Math.round(reduction)}x less</span> load than the unbudgeted case. </>
            ) : (
              <>With no retries there is no amplification to cut. </>
            )}
            Retrying at just one layer instead of every layer collapses it further, toward ~1.1x total.
          </>
        ) : (
          <>
            With no budget, retries multiply: {fmtQps(BASE_QPS)} req/s from users becomes{" "}
            <span style={{ color: HOT }}>{fmtQps(BASE_QPS * multOff)} req/s</span> (x{fmtMult(multOff)}) at the
            backend, exactly where there is no spare capacity. This is how a brief blip tips into a cascading
            failure. Flip the budget on to see the fix.
          </>
        )}
      </div>
    </div>
  );
}
