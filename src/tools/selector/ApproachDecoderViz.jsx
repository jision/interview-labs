import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Approach decoder, the signature Selector widget.
 * A short branching Q&A that lands on prompt / RAG / fine-tune / pretrain
 * with the reasoning and watch-outs. Pure decision logic, no data needed.
 */
const ACCENT = "#ffb703";

const RESULTS = {
  prompt: {
    title: "Prompt engineering",
    color: "#4ade80",
    why: "A strong base model already has the capability, you just need to elicit it. Cheapest, fastest, no infra.",
    watch: "Invest in few-shot examples and structured output before assuming you need anything heavier.",
  },
  rag: {
    title: "RAG (retrieval-augmented)",
    color: "#00b4d8",
    why: "The gap is knowledge, not behavior. Retrieve the facts at query time so answers stay current and grounded.",
    watch: "Quality lives in chunking + embeddings + reranking. Updates are instant; no retraining needed.",
  },
  finetune: {
    title: "Fine-tune (LoRA first)",
    color: "#ffb703",
    why: "The model knows enough but won't reliably follow your format, style, or policy. Bake the behavior into weights.",
    watch: "Start with LoRA on a small curated set. You re-tune on every base-model upgrade, it's a maintenance cost.",
  },
  hybrid: {
    title: "RAG + fine-tune (hybrid)",
    color: "#fb6f3c",
    why: "You need both fresh knowledge and consistent behavior. RAG supplies facts; a light fine-tune fixes the style/format.",
    watch: "Build RAG first, measure, and only add fine-tuning if behavior is still off. Don't do both on day one.",
  },
  pretrain: {
    title: "Continued pretraining / train from scratch",
    color: "#f87171",
    why: "A whole domain language or capability is missing (rare). Needs large data, real budget, and a team.",
    watch: "Almost never the answer in an interview. Exhaust prompt → RAG → fine-tune first and say so out loud.",
  },
  descope: {
    title: "Re-scope (prompt + RAG for now)",
    color: "#00b4d8",
    why: "Closing a genuine capability gap needs lots of data and real budget, which you don't have here. The pragmatic move is to re-scope to what a strong base model + RAG/few-shot can already do well.",
    watch: "Ship the achievable version, gather real usage data, and revisit fine-tuning or pretraining only once the gap (and the budget to close it) is proven.",
  },
};

// Tree: each node is either a question (with options → next node id) or a result.
const TREE = {
  start: {
    q: "What fails when you send a plain prompt to a strong base model?",
    opts: [
      { label: "Nothing, it basically works", to: "prompt" },
      { label: "It lacks facts (private / internal / recent data)", to: "knowledge" },
      { label: "It has the facts but won't follow our format / style / policy", to: "finetune" },
      { label: "It lacks a whole skill or domain entirely", to: "scratch" },
    ],
  },
  knowledge: {
    q: "Does it ALSO need to follow a strict format / style / policy?",
    opts: [
      { label: "No, just needs the right facts", to: "rag" },
      { label: "Yes, facts AND consistent behavior", to: "hybrid" },
    ],
  },
  scratch: {
    q: "How much labeled domain data and budget do you have?",
    opts: [
      { label: "A lot of data + real budget + a team", to: "pretrain" },
      { label: "Little data / small budget", to: "descope" },
    ],
  },
  prompt: { result: "prompt" },
  rag: { result: "rag" },
  finetune: { result: "finetune" },
  hybrid: { result: "hybrid" },
  pretrain: { result: "pretrain" },
  descope: { result: "descope" },
};

export default function ApproachDecoderViz() {
  const [path, setPath] = useState(["start"]);
  const nodeId = path[path.length - 1];
  const node = TREE[nodeId];

  function choose(to) {
    setPath((p) => [...p, to]);
  }
  function reset() {
    setPath(["start"]);
  }

  if (node.result) {
    const r = RESULTS[node.result];
    return (
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-2">
          recommended approach
        </div>
        <div className="text-2xl font-bold mb-3" style={{ color: r.color }}>
          {r.title}
        </div>
        <p className="text-ink-dim leading-relaxed mb-2">
          <span className="text-ink font-semibold">Why: </span>{r.why}
        </p>
        <p className="text-ink-dim leading-relaxed mb-4">
          <span className="text-ink font-semibold">Watch: </span>{r.watch}
        </p>
        <Btn variant="ghost" onClick={reset}>↺ start over</Btn>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-3">
        step {path.length}
      </div>
      <div className="text-lg font-semibold text-ink mb-4">{node.q}</div>
      <div className="space-y-2">
        {node.opts.map((o, i) => (
          <button
            key={i}
            onClick={() => choose(o.to)}
            className="w-full text-left rounded-lg border border-line px-4 py-3 text-sm text-ink-dim
                       hover:text-ink hover:border-line-strong transition-colors"
            style={{ borderLeft: `3px solid ${ACCENT}` }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {path.length > 1 && (
        <button
          onClick={() => setPath((p) => p.slice(0, -1))}
          className="mt-4 font-mono text-[11px] text-ink-faint hover:text-ink"
        >
          ← back
        </button>
      )}
    </div>
  );
}
