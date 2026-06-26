import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Prompt patterns, pick Zero-shot / Few-shot / Chain-of-thought / Structured
 * output and two side-by-side panels update: the prompt template that pattern
 * produces and a representative model output (both baked per pattern), plus a
 * one-line "use when / cost" note.
 */
const ACCENT = "#00b4d8";

const PATTERNS = [
  {
    id: "zero",
    label: "Zero-shot",
    prompt: `Classify the sentiment of this review as positive or negative.

Review: "The battery dies in an hour."
Sentiment:`,
    output: `negative`,
    note: "Use when the task is simple and well-known. Cheapest, no examples, fewest tokens.",
  },
  {
    id: "few",
    label: "Few-shot",
    prompt: `Classify the sentiment as positive or negative.

Review: "Love it, works great!"   → positive
Review: "Stopped charging day two." → negative
Review: "The battery dies in an hour." →`,
    output: `negative`,
    note: "Use when format/edge cases are easier to show than describe. Costs the example tokens every call.",
  },
  {
    id: "cot",
    label: "Chain-of-thought",
    prompt: `Q: A shop sells pens at 3 for $2. How much for 12 pens?
Let's think step by step.`,
    output: `12 pens is 4 groups of 3.
Each group costs $2.
4 × $2 = $8.
Answer: $8`,
    note: "Use for multi-step reasoning / math. More tokens, slower, but big accuracy gains.",
  },
  {
    id: "structured",
    label: "Structured output",
    prompt: `Extract the order details as JSON matching:
{ "item": string, "qty": number, "rush": boolean }

Order: "Send me 3 blue mugs, rush it please."`,
    output: `{
  "item": "blue mug",
  "qty": 3,
  "rush": true
}`,
    note: "Use when downstream code must parse the output. Pair with schema/tool mode to enforce it.",
  },
  {
    id: "selfcons",
    label: "Self-consistency",
    prompt: `Sample the chain-of-thought prompt N times at temperature > 0,
then take the majority answer.

Q: A shop sells pens at 3 for $2. How much for 12 pens?
Let's think step by step.`,
    output: `sample 1 → $8
sample 2 → $8
sample 3 → $6   ✗
majority vote → $8`,
    note: "Use for hard reasoning where one sample is unreliable. Costs N×, you pay for every sample.",
  },
];

export default function PromptPatternsViz() {
  const [id, setId] = useState("zero");
  const p = PATTERNS.find((x) => x.id === id);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-mono text-[11px] text-ink-faint mr-1">pattern</span>
        {PATTERNS.map((x) => (
          <Btn
            key={x.id}
            variant={id === x.id ? "solid" : "ghost"}
            tone={ACCENT}
            onClick={() => setId(x.id)}
          >
            {x.label}
          </Btn>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg border border-line bg-[#0e1018] p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">
            prompt template
          </div>
          <pre className="font-mono text-[11px] text-ink-dim whitespace-pre-wrap leading-relaxed">
{p.prompt}
          </pre>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: `color-mix(in srgb, ${ACCENT} 45%, transparent)`,
            background: `color-mix(in srgb, ${ACCENT} 7%, transparent)`,
          }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-wider mb-2"
            style={{ color: ACCENT }}
          >
            model output
          </div>
          <pre className="font-mono text-[11px] text-ink whitespace-pre-wrap leading-relaxed">
{p.output}
          </pre>
        </div>
      </div>

      <div className="font-mono text-[11px] text-ink-faint leading-relaxed">
        <span style={{ color: ACCENT }}>{p.label}</span>, {p.note}
      </div>
    </div>
  );
}
