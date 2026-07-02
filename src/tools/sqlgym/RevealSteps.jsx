import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * RevealSteps, the progressive-disclosure trainer for SQL Gym problems.
 * steps: [{ label, body }] where body is any JSX node. The rep: say your
 * answer OUT LOUD, then reveal the next step and compare. Revealed steps
 * stack as panels so the full worked solution reads top to bottom.
 */
export default function RevealSteps({ accent, steps }) {
  const [shown, setShown] = useState(0);
  const next = shown < steps.length ? steps[shown] : null;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {shown > 0 && (
        <div className="space-y-3 mb-4">
          {steps.slice(0, shown).map((s, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface-2 p-3.5">
              <div
                className="font-mono text-[10px] uppercase tracking-wider mb-1.5"
                style={{ color: accent }}
              >
                step {i + 1} · {s.label}
              </div>
              <div className="text-sm text-ink-dim leading-relaxed">{s.body}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {next ? (
          <Btn tone={accent} onClick={() => setShown((n) => n + 1)}>
            reveal {next.label}
          </Btn>
        ) : (
          <span className="font-mono text-[11px] text-ink-faint">
            all steps revealed, now say the whole solution out loud once
          </span>
        )}
        <Btn variant="ghost" disabled={shown >= steps.length} onClick={() => setShown(steps.length)}>
          reveal all
        </Btn>
        <Btn variant="ghost" disabled={shown === 0} onClick={() => setShown(0)}>
          reset
        </Btn>
      </div>
      {next && (
        <div className="mt-3 font-mono text-[10px] text-ink-faint">
          answer out loud before you reveal, that is the whole point of the gym
        </div>
      )}
    </div>
  );
}
