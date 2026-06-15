import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * ReAct agent trace — a baked Thought → Action → Observation loop that ends in a
 * Final Answer. "next step" reveals one entry at a time; "reset" clears it.
 * Each revealed step is a full LLM call (the cost/latency multiplier note below).
 */
const ACCENT = "#00b4d8";

const TASK = "Should I bring an umbrella in Paris today?";

// kind: thought | action | observation | final
const TRACE = [
  { kind: "thought", text: "I need today's weather for Paris. I'll check the forecast tool." },
  { kind: "action", tool: 'get_weather(city="Paris")' },
  { kind: "observation", text: "Paris: 14°C, 70% chance of rain this afternoon, wind 12 km/h." },
  { kind: "thought", text: "70% rain is high. Let me confirm whether it's expected during the day or just overnight." },
  { kind: "action", tool: 'get_hourly_forecast(city="Paris", window="day")' },
  { kind: "observation", text: "Rain likely 14:00–18:00; mornings dry." },
  { kind: "thought", text: "Rain falls during the afternoon, which overlaps typical outings. An umbrella is worth it." },
  { kind: "final", text: "Yes — bring an umbrella. Paris has a 70% chance of rain this afternoon (roughly 2–6pm)." },
];

const STYLES = {
  thought: { label: "THOUGHT", color: "#a78bfa" },
  action: { label: "ACTION", color: ACCENT },
  observation: { label: "OBSERVATION", color: "#fbbf24" },
  final: { label: "FINAL ANSWER", color: "#4ade80" },
};

export default function AgentLoopViz() {
  const [shown, setShown] = useState(0);

  const done = shown >= TRACE.length;
  const llmCalls = TRACE.slice(0, shown).filter(
    (e) => e.kind === "thought" || e.kind === "final"
  ).length;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="font-mono text-xs text-ink-faint mb-1">task</div>
      <div className="font-medium text-ink mb-4">“{TASK}”</div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Btn tone={ACCENT} onClick={() => setShown((s) => Math.min(s + 1, TRACE.length))} disabled={done}>
          next step ▸
        </Btn>
        <Btn variant="ghost" tone={ACCENT} onClick={() => setShown(0)} disabled={shown === 0}>
          reset
        </Btn>
        <span className="font-mono text-[11px] text-ink-dim">
          step <span style={{ color: ACCENT }}>{shown}</span> / {TRACE.length}
        </span>
        <span className="font-mono text-[11px] text-ink-faint">
          LLM calls: <span style={{ color: ACCENT }}>{llmCalls}</span>
        </span>
      </div>

      {/* trace */}
      <div className="space-y-1.5 mb-4 min-h-[60px]">
        {shown === 0 && (
          <div className="font-mono text-[11px] text-ink-faint py-4">
            Press “next step” to run the agent loop one entry at a time.
          </div>
        )}
        {TRACE.slice(0, shown).map((e, i) => {
          const s = STYLES[e.kind];
          return (
            <div
              key={i}
              className="rounded-lg px-3 py-2 border"
              style={{
                borderColor: `color-mix(in srgb, ${s.color} 45%, transparent)`,
                background: `color-mix(in srgb, ${s.color} 8%, transparent)`,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-wider mt-0.5 w-[100px] shrink-0"
                  style={{ color: s.color }}
                >
                  {s.label}
                </span>
                <div className="flex-1 min-w-0">
                  {e.kind === "action" ? (
                    <div className="font-mono text-[12px]" style={{ color: ACCENT }}>
                      → tool call: {e.tool}
                    </div>
                  ) : (
                    <div className="text-[13px] text-ink-dim leading-snug">{e.text}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="font-mono text-[11px] text-ink-faint leading-relaxed">
        {done
          ? `Done in ${llmCalls} LLM calls + ${TRACE.filter((e) => e.kind === "action").length} tool calls. Each call re-sends the whole growing history, so total tokens climb faster than linearly — that's the real cost multiplier.`
          : "A Thought and the tool call it emits come from the SAME model turn; the Observation comes back from your tool, then re-enters the next call's context. So tokens grow with every step, not just the step count."}
      </div>
    </div>
  );
}
