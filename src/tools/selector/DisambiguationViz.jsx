import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Disambiguation deck, a flashcard for each common fork.
 * Front = the fork; click to flip → the single pivot question + answer rule.
 * next / prev step through the deck; clicking the card flips it.
 */
const ACCENT = "#ffb703";

const CARDS = [
  {
    fork: "RAG vs fine-tune",
    pivot: "Do you need new knowledge or new behavior?",
    rule: "New facts (private, internal, recent) → RAG. New format, style, or policy → fine-tune. Need both → RAG first, light fine-tune only if behavior is still off.",
  },
  {
    fork: "Agent vs pipeline",
    pivot: "Is the path dynamic, or known in advance?",
    rule: "Fixed, predictable steps → a pipeline (cheaper, debuggable, reliable). Open-ended, tool-using, plan-as-you-go → an agent. Don't pay for agency you don't need.",
  },
  {
    fork: "Prompt vs fine-tune",
    pivot: "Can a few examples fix it?",
    rule: "Try few-shot prompting first, it's free and instant. Fine-tune only when the behavior won't stick across prompts or you need it baked in at scale.",
  },
  {
    fork: "API vs self-host",
    pivot: "Is volume high & steady, or is the data strict?",
    rule: "Low/spiky volume or no MLOps → hosted API. High steady volume with MLOps, or strict data residency → self-host. Start on API, revisit at the break-even.",
  },
  {
    fork: "Vector vs keyword",
    pivot: "Does the query match by meaning or by exact terms?",
    rule: "Paraphrase and semantics → vector search. Exact tokens, IDs, names, code → keyword (BM25). Most production systems run hybrid + a reranker.",
  },
  {
    fork: "Small vs large model",
    pivot: "Is the task actually hard?",
    rule: "Route easy queries to a small/cheap model, escalate hard ones to a large one. Don't pay frontier prices for capability the task never uses.",
  },
];

export default function DisambiguationViz() {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = CARDS[i];

  function go(delta) {
    setFlipped(false);
    setI((prev) => (prev + delta + CARDS.length) % CARDS.length);
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          {flipped ? "the pivot" : "the fork"}
        </div>
        <div className="font-mono text-[11px] text-ink-faint">
          {i + 1} / {CARDS.length}
        </div>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full text-left rounded-lg border border-line p-5 md:p-6 min-h-[180px] flex flex-col transition-colors hover:border-line-strong"
        style={{ borderLeft: `3px solid ${ACCENT}` }}
      >
        {!flipped ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <div className="text-2xl font-bold text-ink tracking-tight">{card.fork}</div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              tap to reveal the pivot question
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center gap-3">
            <div>
              <div
                className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: ACCENT }}
              >
                pivot question
              </div>
              <div className="text-lg font-semibold text-ink leading-snug">{card.pivot}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1 text-ink-faint">
                answer rule
              </div>
              <div className="text-[14px] text-ink-dim leading-relaxed">{card.rule}</div>
            </div>
          </div>
        )}
      </button>

      <div className="flex items-center justify-between mt-4">
        <Btn variant="ghost" onClick={() => go(-1)}>
          ← prev
        </Btn>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="font-mono text-[11px] text-ink-faint hover:text-ink"
        >
          {flipped ? "↺ show fork" : "↻ flip"}
        </button>
        <Btn variant="ghost" onClick={() => go(1)}>
          next →
        </Btn>
      </div>
    </div>
  );
}
