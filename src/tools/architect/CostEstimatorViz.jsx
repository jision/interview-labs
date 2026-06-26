import React, { useState } from "react";

/*
 * LLM cost estimator, the "back-of-envelope" the architect round always wants.
 * All inputs editable; shows monthly cost and the dominant driver. No live pricing.
 */
const ACCENT = "#fb6f3c";

function Field({ label, value, set, step = 1, min = 0, suffix }) {
  return (
    <label className="block">
      <div className="font-mono text-[11px] text-ink-dim mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(e) => set(Math.max(min, parseFloat(e.target.value) || 0))}
          className="w-full bg-surface-2 border border-line rounded-md px-2.5 py-1.5 font-mono text-sm text-ink
                     focus:outline-none focus:border-line-strong"
        />
        {suffix && <span className="font-mono text-[11px] text-ink-faint whitespace-nowrap">{suffix}</span>}
      </div>
    </label>
  );
}

function fmtMoney(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

export default function CostEstimatorViz() {
  const [dau, setDau] = useState(10000);
  const [reqPerUser, setReqPerUser] = useState(8);
  const [inTok, setInTok] = useState(4000); // includes RAG context (a few retrieved chunks + system prompt)
  const [outTok, setOutTok] = useState(400);
  const [priceIn, setPriceIn] = useState(3); // $ per 1M input tokens
  const [priceOut, setPriceOut] = useState(15); // $ per 1M output tokens

  const reqPerDay = dau * reqPerUser;
  const reqPerMonth = reqPerDay * 30;
  const inCostMo = (reqPerMonth * inTok * priceIn) / 1_000_000;
  const outCostMo = (reqPerMonth * outTok * priceOut) / 1_000_000;
  const totalMo = inCostMo + outCostMo;
  const costPerReq = reqPerMonth > 0 ? totalMo / reqPerMonth : 0;
  const inShare = totalMo > 0 ? (inCostMo / totalMo) * 100 : 0;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <Field label="daily active users" value={dau} set={setDau} step={1000} />
        <Field label="requests / user / day" value={reqPerUser} set={setReqPerUser} />
        <Field label="input tokens / req (incl. context)" value={inTok} set={setInTok} step={100} />
        <Field label="output tokens / req" value={outTok} set={setOutTok} step={50} />
        <Field label="input price" value={priceIn} set={setPriceIn} step={0.5} suffix="$ / 1M" />
        <Field label="output price" value={priceOut} set={setPriceOut} step={0.5} suffix="$ / 1M" />
      </div>

      <div className="rounded-lg bg-surface-2 p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="font-mono text-[11px] text-ink-faint">est. monthly cost</div>
            <div className="text-3xl font-bold" style={{ color: ACCENT }}>{fmtMoney(totalMo)}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] text-ink-faint">per request</div>
            <div className="font-mono text-lg text-ink">${costPerReq.toFixed(4)}</div>
          </div>
        </div>

        {/* input vs output split */}
        <div className="h-3 rounded-full overflow-hidden flex mb-2">
          <div style={{ width: `${inShare}%`, background: "#00b4d8" }} />
          <div style={{ width: `${100 - inShare}%`, background: ACCENT }} />
        </div>
        <div className="flex justify-between font-mono text-[10px] text-ink-faint">
          <span><span style={{ color: "#00b4d8" }}>■</span> input {fmtMoney(inCostMo)} ({inShare.toFixed(0)}%)</span>
          <span>output {fmtMoney(outCostMo)} <span style={{ color: ACCENT }}>■</span></span>
        </div>

        <div className="mt-3 pt-3 border-t border-line font-mono text-[11px] text-ink-dim leading-relaxed">
          {(reqPerMonth / 1_000_000).toFixed(1)}M requests/mo · dominant driver:{" "}
          <span className="text-ink">{inShare > 60 ? "input/context tokens, trim the prompt & RAG context" : outShareNote(inShare)}</span>
        </div>
      </div>
    </div>
  );
}

function outShareNote(inShare) {
  if (inShare < 40) return "output tokens, shorten responses or cap max_tokens";
  return "balanced, both input and output matter";
}
