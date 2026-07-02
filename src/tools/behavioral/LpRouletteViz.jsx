import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * LP roulette, draw a random behavioral question and answer it OUT LOUD
 * before revealing which Leadership Principles it targets, what a strong
 * answer includes, and which story scaffold fits. Pure drill, no data.
 */
const ACCENT = "#d97cf6";

const BANK = [
  {
    q: "Tell me about a time you went unusually deep to find the root cause of a problem.",
    lps: ["Dive Deep", "Deliver Results"],
    strong: [
      "A layered investigation: symptom -> metric -> the exact key, config, or line that caused it",
      "The moment you rejected the easy surface explanation",
      "A quantified before and after, plus the monitoring you added so it never surprises you again",
    ],
    scaffold: "#1 the skewed-job rescue",
  },
  {
    q: "Tell me about a time you fixed a problem you didn't cause.",
    lps: ["Ownership"],
    strong: [
      "You acted before anyone assigned it to you",
      "You fixed the immediate issue AND the class of issue (gate, contract, runbook)",
      "Zero blame for the team that caused it",
    ],
    scaffold: "#3 the bad-data incident",
  },
  {
    q: "Tell me about a time you had to deliver under a deadline you didn't set.",
    lps: ["Deliver Results"],
    strong: [
      "The hard constraint stated up front: a date, an SLA, a budget",
      "What you descoped, and the trade-off you named to stakeholders when you did",
      "The outcome in numbers, on time, or an honest miss with the recovery",
    ],
    scaffold: "#1 the skewed-job rescue or #4 the migration",
  },
  {
    q: "Tell me about a time you simplified something complex.",
    lps: ["Invent and Simplify"],
    strong: [
      "A baseline count of the complexity: jobs, tables, hops, teams involved",
      "The insight that made most of it unnecessary",
      "What got deleted, and the maintenance cost that disappeared with it",
    ],
    scaffold: "#2 the cost cut or #5 the contracts adoption",
  },
  {
    q: "Tell me about a time you did more with less.",
    lps: ["Frugality"],
    strong: [
      "A real bill number before and after",
      "Where the money was actually going, the surprising line item",
      "Proof nothing regressed: SLA, freshness, and quality held",
    ],
    scaffold: "#2 the cost cut",
  },
  {
    q: "Tell me about a time you had to tell a stakeholder something they didn't want to hear.",
    lps: ["Earn Trust"],
    strong: [
      "You led with the bad news, early and in plain language",
      "You brought the correction plan in the same conversation",
      "What that honesty bought you later, in access or credibility",
    ],
    scaffold: "#3 the bad-data incident",
  },
  {
    q: "Tell me about a time you strongly disagreed with a decision and committed to it anyway.",
    lps: ["Have Backbone; Disagree and Commit"],
    strong: [
      "The data you brought to the disagreement, not just an opinion",
      "A visible, wholehearted commit after the call went the other way",
      "An honest read on who turned out to be right",
    ],
    scaffold: "#6 the batch-vs-streaming disagreement",
  },
  {
    q: "Tell me about a call you made with incomplete data that turned out well.",
    lps: ["Are Right, A Lot", "Bias for Action"],
    strong: [
      "What was known, what wasn't, and how you bounded the risk",
      "The cheap test or reversible step you used to validate before committing",
      "The result, and how fast you would have reversed if it went wrong",
    ],
    scaffold: "#6 the batch-vs-streaming disagreement",
  },
  {
    q: "Tell me about a time you failed.",
    lps: ["Earn Trust", "Ownership"],
    strong: [
      "A real failure with real cost, not a disguised win",
      "The specific decision of yours that caused it, owned in the first person",
      "A durable change in how you work, with evidence it stuck",
    ],
    scaffold: "#3 the bad-data incident",
  },
  {
    q: "Tell me about a time you raised the quality bar on your team.",
    lps: ["Hire and Develop the Best", "Insist on the Highest Standards"],
    strong: [
      "A named gap with a baseline: ramp time, repeat incidents, review depth",
      "Mechanisms, not vibes: runbooks, review checklists, onboarding paths",
      "A person or a metric that measurably improved",
    ],
    scaffold: "#7 raising the bar",
  },
  {
    q: "Tell me about the most complex project you have led end to end.",
    lps: ["Deliver Results", "Think Big"],
    strong: [
      "Scope in numbers: teams, systems, data volume, duration",
      "The riskiest dependency and how you de-risked it",
      "Delivery measured against the original success criteria",
    ],
    scaffold: "#4 the migration",
  },
  {
    q: "Tell me about a time you influenced a decision without having authority.",
    lps: ["Earn Trust", "Have Backbone; Disagree and Commit"],
    strong: [
      "Why the other teams had no obligation to listen to you",
      "The evidence and prototype work that did the persuading",
      "Adoption you can point at afterward",
    ],
    scaffold: "#5 the contracts adoption",
  },
  {
    q: "Tell me about a time you missed a deadline or an SLA.",
    lps: ["Deliver Results", "Earn Trust"],
    strong: [
      "The early warning you gave, or the lesson learned because you didn't",
      "The recovery plan and what you triaged first",
      "The mechanism that made the next deadline safe",
    ],
    scaffold: "#1 the skewed-job rescue",
  },
  {
    q: "Tell me about a time you pushed back on your whole team's consensus.",
    lps: ["Have Backbone; Disagree and Commit", "Are Right, A Lot"],
    strong: [
      "The specific data that made you dissent",
      "How you disagreed respectfully without softening the point",
      "The outcome, including honestly if you were wrong",
    ],
    scaffold: "#6 the batch-vs-streaming disagreement",
  },
  {
    q: "Tell me about a time you helped a struggling teammate succeed.",
    lps: ["Hire and Develop the Best"],
    strong: [
      "Diagnosis first: a skill gap, a context gap, or a confidence gap",
      "Concrete investment: pairing, scoped wins, honest feedback",
      "Where they are now, in their results or their words",
    ],
    scaffold: "#7 raising the bar",
  },
  {
    q: "Tell me about a trade-off you made between speed and quality.",
    lps: ["Bias for Action", "Insist on the Highest Standards"],
    strong: [
      "Both options costed honestly, not a strawman versus a winner",
      "Which corners were safe to cut, and which never are (data correctness)",
      "How you paid the debt back afterward",
    ],
    scaffold: "#4 the migration",
  },
  {
    q: "Tell me about a time you found a problem nobody else had noticed.",
    lps: ["Dive Deep", "Ownership"],
    strong: [
      "The anomaly everyone else scrolled past",
      "The verification you did before raising the alarm",
      "The blast radius you prevented, quantified",
    ],
    scaffold: "#3 the bad-data incident",
  },
  {
    q: "Tell me about a time you took over something failing and turned it around.",
    lps: ["Ownership", "Deliver Results"],
    strong: [
      "The state you inherited, in numbers",
      "The two or three highest-leverage moves you made first, and why those",
      "The trend line after, and what you institutionalized so it held",
    ],
    scaffold: "#4 the migration or #1 the skewed-job rescue",
  },
];

export default function LpRouletteViz() {
  const [idx, setIdx] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [drawn, setDrawn] = useState(0);

  function draw() {
    let next = Math.floor(Math.random() * BANK.length);
    while (idx !== null && next === idx) {
      next = Math.floor(Math.random() * BANK.length);
    }
    setIdx(next);
    setRevealed(false);
    setDrawn((d) => d + 1);
  }

  function reset() {
    setIdx(null);
    setRevealed(false);
    setDrawn(0);
  }

  const card = idx === null ? null : BANK[idx];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* controls + session counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Btn tone={ACCENT} onClick={draw}>
            {card ? "draw another" : "draw a question"}
          </Btn>
          <Btn variant="ghost" tone={ACCENT} onClick={reset} disabled={drawn === 0}>
            reset
          </Btn>
        </div>
        <span className="font-mono text-[11px] text-ink-faint">
          drawn this session: <span className="text-ink font-semibold">{drawn}</span> · bank of {BANK.length}
        </span>
      </div>

      {!card ? (
        <p className="text-sm text-ink-dim leading-relaxed">
          Draw a question, then answer it OUT LOUD in STARR form for about two minutes before revealing
          anything. The reveal shows which Leadership Principles the question is fishing for, what a
          strong answer includes, and which story scaffold from the Stories topic fits it.
        </p>
      ) : (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: ACCENT }}>
            the interviewer asks
          </div>
          <p className="text-[15px] text-ink font-medium leading-relaxed mb-4 min-h-[3rem]">{card.q}</p>

          {!revealed ? (
            <div className="flex flex-wrap items-center gap-3">
              <Btn tone={ACCENT} onClick={() => setRevealed(true)}>
                reveal what it targets
              </Btn>
              <span className="font-mono text-[11px] text-ink-faint">
                answer out loud first, roughly 2 minutes, that is the rep
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">
                  target principles
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {card.lps.map((lp) => (
                    <span
                      key={lp}
                      className="rounded-full border px-2.5 py-0.5 font-mono text-[10px]"
                      style={{
                        borderColor: `color-mix(in srgb, ${ACCENT} 45%, transparent)`,
                        color: ACCENT,
                        background: `color-mix(in srgb, ${ACCENT} 10%, transparent)`,
                      }}
                    >
                      {lp}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface-2 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">
                  a strong answer includes
                </div>
                <ul className="text-[12px] text-ink-dim leading-relaxed list-disc pl-4 space-y-1">
                  {card.strong.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="font-mono text-[11px] text-ink-faint">
                suggested scaffold: <span className="text-ink-dim">{card.scaffold}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
