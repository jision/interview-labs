import React, { useMemo, useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Decoding playground — baked next-token logits, live temperature / top-k / top-p.
 * Teaches why the same prompt gives different answers, and what each knob does.
 */
const ACCENT = "#7c5cff";

// "The weather today is ___" — hand-authored logits.
const BASE = [
  { tok: "sunny", logit: 2.6 },
  { tok: "cloudy", logit: 1.9 },
  { tok: "rainy", logit: 1.3 },
  { tok: "warm", logit: 1.0 },
  { tok: "cold", logit: 0.6 },
  { tok: "nice", logit: 0.3 },
  { tok: "fine", logit: 0.0 },
  { tok: "terrible", logit: -0.4 },
];

function softmax(logits, T) {
  const t = Math.max(T, 0.01);
  const m = Math.max(...logits);
  const exps = logits.map((l) => Math.exp((l - m) / t));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export default function SamplingViz() {
  const [temp, setTemp] = useState(0.8);
  const [topK, setTopK] = useState(8);
  const [topP, setTopP] = useState(1.0);
  const [picked, setPicked] = useState(null);

  const dist = useMemo(() => {
    // 1) temperature-scaled softmax over all tokens
    let probs = softmax(BASE.map((b) => b.logit), temp);
    let items = BASE.map((b, i) => ({ ...b, p: probs[i] }));

    // 2) top-k: keep the k highest, zero the rest
    const byProb = [...items].sort((a, b) => b.p - a.p);
    const keepK = new Set(byProb.slice(0, topK).map((x) => x.tok));

    // 3) top-p (nucleus): smallest set whose cumulative prob ≥ p
    let cum = 0;
    const keepP = new Set();
    for (const x of byProb) {
      keepP.add(x.tok);
      cum += x.p;
      if (cum >= topP) break;
    }

    // mask + renormalize
    items = items.map((x) => ({
      ...x,
      kept: keepK.has(x.tok) && keepP.has(x.tok),
    }));
    const keptSum = items.reduce((a, x) => a + (x.kept ? x.p : 0), 0) || 1;
    return items.map((x) => ({ ...x, final: x.kept ? x.p / keptSum : 0 }));
  }, [temp, topK, topP]);

  function sample() {
    const r = Math.random();
    let acc = 0;
    for (const x of dist) {
      acc += x.final;
      if (r <= acc) {
        setPicked(x.tok);
        return;
      }
    }
    setPicked(dist.find((x) => x.kept)?.tok ?? null);
  }

  const Slider = ({ label, value, min, max, step, set, fmt }) => (
    <div>
      <div className="flex justify-between font-mono text-[11px] mb-1">
        <span className="text-ink-dim">{label}</span>
        <span style={{ color: ACCENT }}>{fmt ? fmt(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          set(parseFloat(e.target.value));
          setPicked(null);
        }}
        className="w-full"
        style={{ accentColor: ACCENT }}
      />
    </div>
  );

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="font-mono text-xs text-ink-faint mb-3">
        prompt: <span className="text-ink">“The weather today is ___”</span>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <Slider label="temperature" value={temp} min={0} max={2} step={0.05} set={setTemp} fmt={(v) => v.toFixed(2)} />
        <Slider label="top-k" value={topK} min={1} max={8} step={1} set={setTopK} />
        <Slider label="top-p" value={topP} min={0.1} max={1} step={0.05} set={setTopP} fmt={(v) => v.toFixed(2)} />
      </div>

      <div className="space-y-1.5 mb-4">
        {dist.map((x) => (
          <div key={x.tok} className="flex items-center gap-2">
            <span
              className="font-mono text-xs w-20 text-right"
              style={{ color: x.kept ? "#eef1f7" : "#6b7480" }}
            >
              {x.tok}
            </span>
            <div className="flex-1 h-4 rounded bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded transition-all duration-200"
                style={{
                  width: `${x.final * 100}%`,
                  background: picked === x.tok ? "#4ade80" : ACCENT,
                  opacity: x.kept ? 1 : 0.25,
                }}
              />
            </div>
            <span className="font-mono text-[10px] w-12 text-ink-faint">
              {(x.final * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Btn onClick={sample} tone={ACCENT}>
          ▸ sample a token
        </Btn>
        {picked && (
          <span className="font-mono text-sm">
            <span className="text-ink-faint">picked → </span>
            <span style={{ color: "#4ade80" }}>{picked}</span>
          </span>
        )}
        {temp <= 0.05 && (
          <span className="font-mono text-[11px] text-ink-faint">
            T≈0 → greedy, always the top token
          </span>
        )}
      </div>
    </div>
  );
}
