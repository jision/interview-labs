import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Full fine-tune vs LoRA — a stacked transformer-layer diagram. In Full mode all
 * weights are trainable (highlighted). In LoRA mode the base is frozen (dimmed)
 * with small adapter blocks highlighted. Trainable-params % and a rough VRAM/cost
 * comparison update with the toggle.
 */
const ACCENT = "#00b4d8";

const LAYERS = ["Layer 4", "Layer 3", "Layer 2", "Layer 1"];

const MODES = {
  full: {
    trainablePct: "100%",
    vram: "~8× the FP16 size",
    cost: "$$$$",
    note: "Every weight needs gradients + Adam optimizer states (~16 bytes/param vs 2 for inference) — huge VRAM, one frozen artifact per task.",
  },
  lora: {
    trainablePct: "<1%",
    vram: "~1–2× the FP16 size",
    cost: "$$",
    note: "Base weights frozen (no optimizer states for them); you train tiny low-rank adapters. Fits modest GPUs and you hot-swap adapters per task.",
  },
};

export default function FineTuneViz() {
  const [mode, setMode] = useState("lora");
  const isFull = mode === "full";
  const m = MODES[mode];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="font-mono text-[11px] text-ink-faint mr-1">approach</span>
        <Btn variant={isFull ? "solid" : "ghost"} tone={ACCENT} onClick={() => setMode("full")}>
          Full fine-tune
        </Btn>
        <Btn variant={!isFull ? "solid" : "ghost"} tone={ACCENT} onClick={() => setMode("lora")}>
          LoRA
        </Btn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* layer diagram */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">
            transformer stack
          </div>
          <div className="space-y-2">
            {LAYERS.map((name) => (
              <div key={name} className="flex items-center gap-2">
                {/* base weight block */}
                <div
                  className="flex-1 rounded-lg px-3 py-2.5 border transition-all duration-300"
                  style={{
                    borderColor: isFull ? ACCENT : "rgba(255,255,255,0.10)",
                    background: isFull
                      ? `color-mix(in srgb, ${ACCENT} 14%, transparent)`
                      : "rgba(255,255,255,0.02)",
                    opacity: isFull ? 1 : 0.45,
                  }}
                >
                  <div className="font-mono text-[12px] text-ink">{name}</div>
                  <div className="font-mono text-[10px] text-ink-faint">
                    base weights {isFull ? "· trainable" : "· frozen ❄"}
                  </div>
                </div>
                {/* LoRA adapter block */}
                <div
                  className="rounded-lg px-2.5 py-2.5 border transition-all duration-300 w-[88px] text-center"
                  style={{
                    borderColor: isFull ? "rgba(255,255,255,0.08)" : ACCENT,
                    background: isFull
                      ? "transparent"
                      : `color-mix(in srgb, ${ACCENT} 22%, transparent)`,
                    opacity: isFull ? 0.25 : 1,
                  }}
                >
                  <div
                    className="font-mono text-[10px] font-bold"
                    style={{ color: isFull ? "#6b7480" : ACCENT }}
                  >
                    adapter
                  </div>
                  <div className="font-mono text-[9px] text-ink-faint">A·B (rank r)</div>
                </div>
              </div>
            ))}
          </div>
          <div className="font-mono text-[10px] text-ink-faint mt-2">
            {isFull
              ? "All base weights highlighted = trainable."
              : "Base dimmed (frozen); small adapters highlighted = trainable."}
          </div>
        </div>

        {/* stats */}
        <div className="space-y-3">
          {[
            { k: "trainable params", v: m.trainablePct },
            { k: "training VRAM", v: m.vram },
            { k: "relative cost", v: m.cost },
          ].map((s) => (
            <div
              key={s.k}
              className="rounded-lg border border-line bg-[#0e1018] px-3 py-2.5 flex items-center justify-between"
            >
              <span className="font-mono text-[11px] text-ink-dim">{s.k}</span>
              <span className="font-mono text-[14px] font-semibold" style={{ color: ACCENT }}>
                {s.v}
              </span>
            </div>
          ))}
          <div className="font-mono text-[11px] text-ink-faint leading-relaxed pt-1">
            {m.note}
          </div>
        </div>
      </div>

      <div className="mt-4 font-mono text-[11px] text-ink-faint leading-relaxed">
        LoRA trains &lt;1% of the parameters by injecting low-rank matrices into the model's linear
        layers (attention projections, often the MLP too) — same quality for most narrow tasks at a
        fraction of the VRAM and cost. QLoRA goes further, training adapters on a 4-bit base.
      </div>
    </div>
  );
}
