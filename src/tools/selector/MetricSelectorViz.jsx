import React, { useState } from "react";

/*
 * Metric selector — task → metric picker.
 * Pick a task type, see the recommended metric(s), what each penalizes,
 * and the watch-out. Baked content per task; pure UI state.
 */
const ACCENT = "#ffb703";

const TASKS = [
  {
    id: "balanced",
    label: "Balanced classification",
    metrics: [
      { m: "Accuracy", what: "penalizes any wrong label equally" },
      { m: "F1", what: "balances precision and recall in one number" },
    ],
    watch: "Fine while classes are roughly even — the moment they aren't, accuracy starts lying.",
  },
  {
    id: "imbalanced",
    label: "Imbalanced / rare positive",
    metrics: [
      { m: "Precision & recall", what: "separates false alarms from misses" },
      { m: "AUC-PR", what: "summarizes the precision/recall trade-off across thresholds" },
    ],
    watch: "Accuracy is meaningless when 99% are negative — a model that always says 'no' scores 99%.",
  },
  {
    id: "ranking",
    label: "Ranking & retrieval",
    metrics: [
      { m: "Recall@k", what: "did the right items make the top k?" },
      { m: "MRR", what: "how high is the first relevant hit?" },
      { m: "nDCG", what: "rewards putting the most relevant items highest" },
    ],
    watch: "Order and top-k coverage are everything — raw accuracy ignores where a hit lands.",
  },
  {
    id: "regression",
    label: "Regression",
    metrics: [
      { m: "MAE", what: "average error in real units; robust to outliers" },
      { m: "RMSE", what: "squares errors, so it punishes big misses hard" },
    ],
    watch: "RMSE is sensitive to outliers — pick it only if large errors genuinely hurt more.",
  },
  {
    id: "generation",
    label: "Generation (LLM output)",
    metrics: [
      { m: "Golden set + exact/semantic match", what: "anchors regressions on known answers" },
      { m: "LLM-as-judge", what: "scores open-ended quality at scale" },
      { m: "Human eval + online signals", what: "ground truth for tone, helpfulness, harm" },
    ],
    watch: "No single number captures it — layer offline checks, a judge, and live signals together.",
  },
];

export default function MetricSelectorViz() {
  const [active, setActive] = useState("imbalanced");
  const task = TASKS.find((t) => t.id === active);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-2">
        task type
      </div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {TASKS.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="font-mono text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors"
              style={{
                borderColor: on ? ACCENT : "var(--color-line-strong)",
                color: on ? "var(--color-bg)" : "var(--color-ink-dim)",
                background: on ? ACCENT : "transparent",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        className="rounded-lg border border-line p-4 mb-3"
        style={{ borderLeft: `3px solid ${ACCENT}` }}
      >
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-2">
          reach for
        </div>
        <div className="space-y-2">
          {task.metrics.map((m, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
              <span
                className="font-mono text-sm font-semibold shrink-0"
                style={{ color: ACCENT }}
              >
                {m.m}
              </span>
              <span className="text-[13px] text-ink-dim leading-relaxed">{m.what}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg p-3.5 text-sm leading-relaxed"
        style={{
          background: "color-mix(in srgb, var(--color-warn) 8%, transparent)",
          borderLeft: "3px solid var(--color-warn)",
        }}
      >
        <div
          className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1"
          style={{ color: "var(--color-warn)" }}
        >
          watch out
        </div>
        <div className="text-ink-dim">{task.watch}</div>
      </div>
    </div>
  );
}
