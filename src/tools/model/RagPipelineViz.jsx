import React, { useMemo, useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * RAG pipeline builder — baked corpus with precomputed similarity to a fixed query.
 * Knobs: top-k and a reranker toggle. Shows which chunks reach the prompt.
 */
const ACCENT = "#00b4d8";

const QUERY = "How do I reset my password?";

// chunk: retrieval (embedding cosine) score + a sharper reranker (cross-encoder) score
const CHUNKS = [
  { id: "C1", text: "To reset your password, open Settings → Security → ‘Reset password’.", sim: 0.91, rerank: 0.98 },
  { id: "C2", text: "If you forgot your password, click ‘Forgot password’ on the login screen.", sim: 0.84, rerank: 0.95 },
  { id: "C3", text: "Passwords must be at least 12 characters with a number and symbol.", sim: 0.71, rerank: 0.42 },
  { id: "C4", text: "Two-factor authentication can be enabled under Settings → Security.", sim: 0.66, rerank: 0.30 },
  { id: "C5", text: "Reset your billing payment method in the Billing tab.", sim: 0.58, rerank: 0.08 },
  { id: "C6", text: "Our office reopens at 9am; support hours are listed on the contact page.", sim: 0.31, rerank: 0.03 },
];

export default function RagPipelineViz() {
  const [k, setK] = useState(3);
  const [rerank, setRerank] = useState(false);

  const ranked = useMemo(() => {
    const scored = CHUNKS.map((c) => ({ ...c, score: rerank ? c.rerank : c.sim }));
    return [...scored].sort((a, b) => b.score - a.score);
  }, [rerank]);

  const retrieved = ranked.slice(0, k);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="font-mono text-xs text-ink-faint mb-1">user query</div>
      <div className="font-medium text-ink mb-4">“{QUERY}”</div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-ink-dim">top-k</span>
          <input
            type="range" min={1} max={6} step={1} value={k}
            onChange={(e) => setK(parseInt(e.target.value))}
            style={{ accentColor: ACCENT }}
          />
          <span className="font-mono text-xs" style={{ color: ACCENT }}>{k}</span>
        </div>
        <Btn variant={rerank ? "solid" : "ghost"} tone={ACCENT} onClick={() => setRerank((v) => !v)}>
          reranker: {rerank ? "ON" : "off"}
        </Btn>
      </div>

      {/* ranked corpus */}
      <div className="font-mono text-[11px] text-ink-faint mb-2">
        corpus → {rerank ? "reranked (cross-encoder)" : "embedding similarity"}
      </div>
      <div className="space-y-1.5 mb-4">
        {ranked.map((c, i) => {
          const inCtx = i < k;
          return (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 border transition-colors"
              style={{
                borderColor: inCtx ? ACCENT : "rgba(255,255,255,0.08)",
                background: inCtx ? `color-mix(in srgb, ${ACCENT} 10%, transparent)` : "transparent",
                opacity: inCtx ? 1 : 0.5,
              }}
            >
              <span className="font-mono text-[10px] w-7 text-ink-faint">{c.id}</span>
              <span className="flex-1 text-[13px] text-ink-dim leading-snug">{c.text}</span>
              <span className="font-mono text-[11px] w-10 text-right" style={{ color: inCtx ? ACCENT : "#6b7480" }}>
                {c.score.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* assembled prompt */}
      <div className="rounded-lg border border-line bg-[#0e1018] p-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">
          → prompt sent to the LLM
        </div>
        <pre className="font-mono text-[11px] text-ink-dim whitespace-pre-wrap leading-relaxed">
{`Answer using ONLY the context below.

Context:
${retrieved.map((c) => `- ${c.text}`).join("\n")}

Question: ${QUERY}`}
        </pre>
      </div>

      <div className="mt-3 font-mono text-[11px] text-ink-faint leading-relaxed">
        {(() => {
          const distractorIn = retrieved.some((c) => c.id === "C3" || c.id === "C4");
          if (rerank) {
            return distractorIn
              ? "Even reranked, a close-but-wrong chunk (C3/C4) reaches the prompt at this k — lower k and the reranker's ordering keeps it out."
              : "Reranking pushes C3/C4 (about passwords, not resetting) below the cut, so only the answering chunks reach the prompt — precision up.";
          }
          return distractorIn
            ? "Raw similarity pulls in C3/C4: topically close, but not actually answering. Turn the reranker on, or lower k."
            : "At this k only the top chunk(s) make it — raise k and watch C3/C4 (close but wrong) sneak in under raw similarity.";
        })()}
      </div>
    </div>
  );
}
