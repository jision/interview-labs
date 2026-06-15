import React, { useMemo, useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Quantization trade-off — pick a precision (FP16/INT8/INT4) and a model preset
 * (7B/13B/70B). Bars update for memory (params × bytes/param), relative quality
 * (small drop per step down), and relative latency/throughput.
 * Rule of thumb baked in: 7B ≈ 14GB FP16, ≈ 3.5GB INT4 (before KV cache).
 */
const ACCENT = "#00b4d8";

const PRESETS = [
  { id: "7B", params: 7 },
  { id: "13B", params: 13 },
  { id: "70B", params: 70 },
];

// bytesPerParam drives VRAM; quality is a baked relative score; speed is a
// rough relative throughput multiplier (lower precision → faster).
const PRECISIONS = [
  { id: "FP16", bytes: 2, quality: 100, speed: 1.0 },
  { id: "INT8", bytes: 1, quality: 98, speed: 1.6 },
  { id: "INT4", bytes: 0.5, quality: 93, speed: 2.4 },
];

function Bar({ label, value, display, fillPct, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[11px] text-ink-dim">{label}</span>
        <span className="font-mono text-[12px]" style={{ color }}>{display}</span>
      </div>
      <div className="h-3 rounded-full bg-[#0e1018] border border-line overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(2, Math.min(100, fillPct))}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function QuantizationViz() {
  const [presetId, setPresetId] = useState("7B");
  const [precId, setPrecId] = useState("FP16");

  const preset = PRESETS.find((p) => p.id === presetId);
  const prec = PRECISIONS.find((p) => p.id === precId);

  const stats = useMemo(() => {
    const vramGb = preset.params * prec.bytes; // 7B × 2B = 14GB FP16
    const maxVram = 70 * 2; // 70B FP16 = 140GB, used to scale the memory bar
    return {
      vramGb,
      memPct: (vramGb / maxVram) * 100,
      quality: prec.quality,
      speed: prec.speed,
      speedPct: (prec.speed / 2.4) * 100,
    };
  }, [preset, prec]);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-5 mb-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-ink-faint">model</span>
          {PRESETS.map((p) => (
            <Btn
              key={p.id}
              variant={presetId === p.id ? "solid" : "ghost"}
              tone={ACCENT}
              onClick={() => setPresetId(p.id)}
            >
              {p.id}
            </Btn>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-ink-faint">precision</span>
          {PRECISIONS.map((p) => (
            <Btn
              key={p.id}
              variant={precId === p.id ? "solid" : "ghost"}
              tone={ACCENT}
              onClick={() => setPrecId(p.id)}
            >
              {p.id}
            </Btn>
          ))}
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <Bar
          label="VRAM (weights)"
          value={stats.vramGb}
          display={`${stats.vramGb.toFixed(1)} GB`}
          fillPct={stats.memPct}
          color={ACCENT}
        />
        <Bar
          label="relative quality"
          value={stats.quality}
          display={`${stats.quality}%`}
          fillPct={stats.quality}
          color="#4ade80"
        />
        <Bar
          label="relative throughput"
          value={stats.speed}
          display={`${stats.speed.toFixed(1)}×`}
          fillPct={stats.speedPct}
          color="#fbbf24"
        />
      </div>

      <div className="rounded-lg border border-line bg-[#0e1018] p-3 mb-3">
        <div className="font-mono text-[11px] text-ink-dim leading-relaxed">
          {preset.params}B params × {prec.bytes} byte{prec.bytes === 1 ? "" : "s"}/param ={" "}
          <span style={{ color: ACCENT }}>{stats.vramGb.toFixed(1)} GB</span> of weights
          {precId !== "FP16" && (
            <>
              {" "}
              — that's <span style={{ color: ACCENT }}>{(prec.bytes / 2).toFixed(2)}×</span> the FP16
              footprint.
            </>
          )}
        </div>
      </div>

      <div className="font-mono text-[11px] text-ink-faint leading-relaxed">
        Rule of thumb: 7B ≈ 14GB at FP16, ≈ 3.5GB at INT4 — before the KV cache, which grows with
        context length and batch size. Each step down roughly halves memory for a small quality hit.
      </div>
    </div>
  );
}
