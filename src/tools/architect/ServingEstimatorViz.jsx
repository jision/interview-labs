import React, { useState } from "react";

/*
 * LLM serving-capacity estimator — the "will it fit, and how many at once?" math
 * the serving round always wants. All inputs editable; shows max concurrent
 * requests and a stacked GPU-memory budget bar. No real hardware probing —
 * everything below is a back-of-envelope rule of thumb (commented inline).
 */
const ACCENT = "#fb6f3c";

/* bytes per parameter by precision — the standard quantization ladder */
const PRECISIONS = [
  { id: "fp16", label: "FP16", bytes: 2 },
  { id: "int8", label: "INT8", bytes: 1 },
  { id: "int4", label: "INT4", bytes: 0.5 },
];

/* VRAM presets for common datacenter GPUs (GB) */
const GPU_PRESETS = [24, 40, 80, 141];

/*
 * KV-cache rule of thumb. Per token, KV bytes ≈ 2 (K and V) × n_layers ×
 * n_kv_heads × head_dim × 2 bytes (FP16). For a GQA 13B-class model that's
 * ~0.2 MB/token ⇒ ~200 MB per 1k tokens. (A dense-attention model with no
 * grouped-query KV sharing would be several× larger, ~0.8 MB/token.) Scales
 * linearly with context length. We keep the KV cache at FP16 regardless of the
 * *weight* precision — in real serving (vLLM/AWQ) KV precision is set
 * independently, so INT4 weights do NOT automatically shrink the KV cache.
 */
const KV_MB_PER_1K_TOKENS = 200;

/* fixed activation/CUDA/framework overhead we reserve off the top (GB) */
const OVERHEAD_GB = 2;

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

export default function ServingEstimatorViz() {
  const [vram, setVram] = useState(80); // GB of GPU memory
  const [params, setParams] = useState(13); // billions of parameters
  const [precId, setPrecId] = useState("fp16");
  const [ctx, setCtx] = useState(4096); // context length in tokens

  const prec = PRECISIONS.find((p) => p.id === precId) || PRECISIONS[0];

  // weights memory (GB) = params(B) × bytes/param.  params are in billions, and
  // 1e9 bytes ≈ 1 GB here (decimal GB — fine for an envelope), so it cancels out.
  const weightsGB = params * prec.bytes;

  // KV cache per concurrent request (GB): the per-1k-token rule × context length.
  // Independent of weight precision (KV stays FP16 even with INT4 weights).
  const kvPerReqGB = ((ctx / 1000) * KV_MB_PER_1K_TOKENS) / 1000;

  // memory left for KV caches after weights + fixed overhead
  const freeForKV = vram - weightsGB - OVERHEAD_GB;
  const fits = freeForKV > 0 && weightsGB < vram;

  // max concurrent requests that fit
  const maxConcurrent =
    fits && kvPerReqGB > 0 ? Math.floor(freeForKV / kvPerReqGB) : 0;

  // stacked-bar widths (% of total VRAM)
  const weightsPct = vram > 0 ? Math.min(100, (weightsGB / vram) * 100) : 0;
  const overheadPct = vram > 0 ? Math.min(100 - weightsPct, (OVERHEAD_GB / vram) * 100) : 0;
  const kvUsedGB = fits ? maxConcurrent * kvPerReqGB : 0;
  const kvPct = vram > 0 ? Math.max(0, (kvUsedGB / vram) * 100) : 0;
  const freePct = Math.max(0, 100 - weightsPct - overheadPct - kvPct);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <Field label="GPU VRAM" value={vram} set={setVram} step={8} suffix="GB" />
          <div className="flex gap-1.5 mt-1.5">
            {GPU_PRESETS.map((g) => (
              <button
                key={g}
                onClick={() => setVram(g)}
                className="font-mono text-[10px] px-2 py-0.5 rounded border transition-colors"
                style={
                  vram === g
                    ? { borderColor: ACCENT, color: ACCENT }
                    : { borderColor: "var(--color-line-strong)", color: "var(--color-ink-faint)" }
                }
              >
                {g}GB
              </button>
            ))}
          </div>
        </div>
        <Field label="model size" value={params} set={setParams} suffix="B params" />
        <div>
          <div className="font-mono text-[11px] text-ink-dim mb-1">precision (bytes / param)</div>
          <div className="flex gap-1.5">
            {PRECISIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPrecId(p.id)}
                className="flex-1 font-mono text-xs px-2 py-1.5 rounded-md border transition-colors"
                style={
                  precId === p.id
                    ? { borderColor: ACCENT, color: ACCENT, background: "color-mix(in srgb, " + ACCENT + " 10%, transparent)" }
                    : { borderColor: "var(--color-line)", color: "var(--color-ink-dim)" }
                }
              >
                {p.label}
                <span className="block text-[9px] text-ink-faint">{p.bytes} B</span>
              </button>
            ))}
          </div>
        </div>
        <Field label="context length" value={ctx} set={setCtx} step={1024} suffix="tokens" />
      </div>

      <div className="rounded-lg bg-surface-2 p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="font-mono text-[11px] text-ink-faint">max concurrent requests</div>
            <div className="text-3xl font-bold" style={{ color: fits ? ACCENT : "#f87171" }}>
              {fits ? maxConcurrent.toLocaleString() : "0"}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] text-ink-faint">KV / request</div>
            <div className="font-mono text-lg text-ink">
              {kvPerReqGB >= 1 ? `${kvPerReqGB.toFixed(2)} GB` : `${(kvPerReqGB * 1000).toFixed(0)} MB`}
            </div>
          </div>
        </div>

        {/* stacked GPU memory budget bar: weights + overhead + KV(N) + free */}
        <div className="h-3 rounded-full overflow-hidden flex mb-2">
          <div style={{ width: `${weightsPct}%`, background: ACCENT }} />
          <div style={{ width: `${overheadPct}%`, background: "#a78bfa" }} />
          <div style={{ width: `${kvPct}%`, background: "#00b4d8" }} />
          <div style={{ width: `${freePct}%`, background: "var(--color-line-strong)" }} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-ink-faint">
          <span><span style={{ color: ACCENT }}>■</span> weights {weightsGB.toFixed(1)}GB</span>
          <span><span style={{ color: "#a78bfa" }}>■</span> overhead {OVERHEAD_GB}GB</span>
          <span><span style={{ color: "#00b4d8" }}>■</span> KV ×{fits ? maxConcurrent : 0} {kvUsedGB.toFixed(1)}GB</span>
          <span><span style={{ color: "var(--color-line-strong)" }}>■</span> free {(vram * freePct / 100).toFixed(1)}GB</span>
        </div>

        <div className="mt-3 pt-3 border-t border-line font-mono text-[11px] text-ink-dim leading-relaxed">
          {!fits ? (
            <span style={{ color: "#f87171" }}>
              ⚠ model doesn't fit: weights ({weightsGB.toFixed(1)}GB) + overhead exceed {vram}GB VRAM —
              quantize (try INT8/INT4) or shard across GPUs.
            </span>
          ) : (
            <>
              weights {weightsGB.toFixed(1)}GB at {prec.label} · {(freeForKV).toFixed(1)}GB left for KV cache ·
              each request reserves {kvPerReqGB >= 1 ? `${kvPerReqGB.toFixed(2)}GB` : `${(kvPerReqGB * 1000).toFixed(0)}MB`} for{" "}
              {ctx.toLocaleString()} tokens of context.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
