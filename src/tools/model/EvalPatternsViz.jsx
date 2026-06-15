import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Eval methods compared on ~5 baked rows. Each row has an exact-match verdict
 * (string-equal to golden) and a baked LLM-judge score (1–5). Toggle "reveal
 * judgments" to show verdicts and highlight where the two layers disagree.
 * Rows are designed so exact-match alone is misleading.
 */
const ACCENT = "#00b4d8";

const PASS = "#4ade80";
const FAIL = "#f87171";

// exact: string-equality of modelAnswer vs goldenAnswer (computed below).
// judge: baked LLM-as-judge score 1–5 (≥4 = pass). note: why they (dis)agree.
const ROWS = [
  {
    question: "What's the capital of France?",
    modelAnswer: "Paris",
    goldenAnswer: "Paris",
    judge: 5,
    note: "Both agree — exact match and judge pass.",
  },
  {
    question: "Capital of Australia?",
    modelAnswer: "It's Canberra.",
    goldenAnswer: "Canberra",
    judge: 5,
    note: "Correct but reworded — exact-match FAILS, judge passes.",
  },
  {
    question: "Sum of 17 and 26?",
    modelAnswer: "forty-three",
    goldenAnswer: "43",
    judge: 5,
    note: "Right answer, wrong format — exact-match can't see it.",
  },
  {
    question: "Who wrote 'Pride and Prejudice'?",
    modelAnswer: "Charles Dickens",
    goldenAnswer: "Jane Austen",
    judge: 1,
    note: "Confidently wrong — both fail. This is the dangerous case.",
  },
  {
    question: "Largest planet in the solar system?",
    modelAnswer: "Jupiter",
    goldenAnswer: "Jupiter",
    judge: 5,
    note: "Both agree — clean pass.",
  },
];

function Badge({ pass, children }) {
  const c = pass ? PASS : FAIL;
  return (
    <span
      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ color: c, background: `color-mix(in srgb, ${c} 16%, transparent)` }}
    >
      {children}
    </span>
  );
}

export default function EvalPatternsViz() {
  const [reveal, setReveal] = useState(false);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Btn variant={reveal ? "solid" : "ghost"} tone={ACCENT} onClick={() => setReveal((v) => !v)}>
          reveal judgments: {reveal ? "ON" : "off"}
        </Btn>
        <span className="font-mono text-[11px] text-ink-faint">
          exact-match vs LLM-judge (golden = expected answer)
        </span>
      </div>

      <div className="space-y-2">
        {ROWS.map((r, i) => {
          const exactPass = r.modelAnswer.trim().toLowerCase() === r.goldenAnswer.trim().toLowerCase();
          const judgePass = r.judge >= 4;
          const disagree = exactPass !== judgePass;
          return (
            <div
              key={i}
              className="rounded-lg px-3 py-2.5 border"
              style={{
                borderColor:
                  reveal && disagree ? ACCENT : "rgba(255,255,255,0.08)",
                background:
                  reveal && disagree
                    ? `color-mix(in srgb, ${ACCENT} 9%, transparent)`
                    : "transparent",
              }}
            >
              <div className="text-[13px] text-ink mb-1.5 font-medium">{r.question}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[12px] mb-2">
                <div className="text-ink-dim">
                  <span className="font-mono text-[10px] text-ink-faint mr-1.5">model</span>
                  {r.modelAnswer}
                </div>
                <div className="text-ink-dim">
                  <span className="font-mono text-[10px] text-ink-faint mr-1.5">golden</span>
                  {r.goldenAnswer}
                </div>
              </div>
              {reveal ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge pass={exactPass}>EXACT {exactPass ? "PASS" : "FAIL"}</Badge>
                  <Badge pass={judgePass}>JUDGE {judgePass ? "PASS" : "FAIL"} ({r.judge}/5)</Badge>
                  {disagree && (
                    <span className="font-mono text-[10px]" style={{ color: ACCENT }}>
                      ⚠ disagreement
                    </span>
                  )}
                  <span className="text-[11px] text-ink-faint">{r.note}</span>
                </div>
              ) : (
                <div className="font-mono text-[10px] text-ink-faint">verdicts hidden</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 font-mono text-[11px] text-ink-faint leading-relaxed">
        Exact-match is cheap and objective but brittle: it fails “Canberra” reworded and “forty-three”
        formatted. An LLM-judge catches those — yet both miss the confidently-wrong Dickens row. That's
        why you layer evals: rules where there's one right answer, a judge for open-ended quality, and a
        human-labeled sample to catch the rest.
      </div>
    </div>
  );
}
