import React, { useMemo, useState } from "react";
import { Callout } from "../../components/ui.jsx";

/*
 * Live tokenizer — deterministic APPROXIMATION, not real BPE.
 * No vocab/model in the browser. The rules below just *mimic* how a sub-word
 * tokenizer behaves so the counts and chips feel right:
 *   1) split text into whitespace / word / punctuation runs (whitespace kept)
 *   2) common short words stay whole (one token)
 *   3) long/rare words get sliced into ~3–4 char sub-pieces
 * Real BPE merges frequent byte pairs from a fixed vocabulary — this is a
 * teaching stand-in tuned to the ~4-chars-≈-1-token rule of thumb.
 */
const ACCENT = "#7c5cff";

const DEFAULT_TEXT = "Tokenization isn't magic — it's sub-words!";

// A small "stays whole" list of common short words (kept as single tokens).
const COMMON = new Set([
  "the", "a", "an", "is", "it", "to", "of", "in", "on", "and", "or", "but",
  "for", "as", "at", "by", "be", "are", "was", "if", "so", "no", "not", "its",
  "this", "that", "i", "you", "we", "they", "he", "she", "do", "did", "has",
]);

// Chip palette — cycle through a few accent-friendly hues per token.
const CHIP = ["#7c5cff", "#60a5fa", "#4ade80", "#fbbf24", "#f87171", "#22d3ee"];

// Slice a long word into ~5/4 char sub-pieces (mimics sub-word fragmentation).
function sliceWord(word) {
  const out = [];
  let i = 0;
  while (i < word.length) {
    // alternate 5 / 4 char pieces so it looks like uneven BPE merges
    const len = (out.length % 2 === 0) ? 5 : 4;
    out.push(word.slice(i, i + len));
    i += len;
  }
  return out;
}

function tokenize(text) {
  // Split into runs of letters/digits, single punctuation chars, and whitespace.
  const runs = text.match(/[A-Za-z0-9]+|\s+|[^\sA-Za-z0-9]/g) || [];
  const tokens = [];
  // Real BPE encodes a leading space WITH the following word (" magic" is one token),
  // so we don't emit whitespace as its own token — we hang it onto the next unit.
  let lead = "";
  for (const run of runs) {
    if (/^\s+$/.test(run)) {
      lead += run;
      continue;
    }
    if (/^[^\sA-Za-z0-9]$/.test(run)) {
      tokens.push(lead + run); // punctuation → one token (carries any leading space)
      lead = "";
      continue;
    }
    const lower = run.toLowerCase();
    // most words (≤7 chars) or known common words stay whole — one token
    if (run.length <= 7 || COMMON.has(lower)) {
      tokens.push(lead + run);
    } else {
      // long/rare word → sub-word pieces; the leading space rides on the first piece
      const pieces = sliceWord(run);
      pieces[0] = lead + pieces[0];
      for (const piece of pieces) tokens.push(piece);
    }
    lead = "";
  }
  if (lead) tokens.push(lead); // trailing whitespace, if any
  return tokens;
}

export default function TokenizerViz() {
  const [text, setText] = useState(DEFAULT_TEXT);

  const tokens = useMemo(() => tokenize(text), [text]);

  const charCount = text.length;
  const tokenCount = tokens.length;
  const charsPerTok = tokenCount ? (charCount / tokenCount).toFixed(2) : "0";
  // Rough cost line at $3 / 1M input tokens (a typical input rate).
  const cost = (tokenCount / 1_000_000) * 3;

  // Render whitespace tokens visibly with a middle-dot.
  const display = (t) => (/^\s+$/.test(t) ? t.replace(/ /g, "·").replace(/\t/g, "→") : t);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="text-sm text-ink-dim mb-3">
        Type below — each <span className="text-ink font-semibold">chip is one token</span>. Long or
        rare words fragment into sub-word pieces; common words stay whole; and a leading space rides
        on the next word (the <span className="font-mono text-ink">·</span> shows it), just like real BPE.
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        spellCheck={false}
        className="w-full rounded-lg border border-line bg-[#0e1018] text-ink font-mono text-sm p-3 mb-4 resize-y focus:outline-none"
        style={{ caretColor: ACCENT }}
      />

      {/* token chips */}
      <div className="rounded-lg border border-line bg-surface-2 p-3 mb-4 min-h-[3rem]">
        {tokenCount === 0 ? (
          <span className="font-mono text-[11px] text-ink-faint">— empty —</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {tokens.map((t, i) => {
              const ws = /^\s+$/.test(t);
              const color = CHIP[i % CHIP.length];
              return (
                <span
                  key={i}
                  className="inline-flex items-baseline gap-1 rounded px-1.5 py-0.5 font-mono text-xs"
                  style={{
                    background: `color-mix(in srgb, ${color} 16%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
                    color: ws ? "#6b7480" : "#eef1f7",
                  }}
                  title={`token ${i}`}
                >
                  <span className="text-[9px] text-ink-faint">{i}</span>
                  <span style={{ whiteSpace: "pre" }}>{display(t)}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* readouts */}
      <div className="grid grid-cols-3 gap-3 mb-2">
        {[
          ["tokens", tokenCount],
          ["chars/token", charsPerTok],
          ["chars", charCount],
        ].map(([label, val]) => (
          <div key={label} className="rounded-lg border border-line bg-surface-2 p-2.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-0.5">
              {label}
            </div>
            <div className="font-mono text-lg" style={{ color: ACCENT }}>
              {val}
            </div>
          </div>
        ))}
      </div>

      <div className="font-mono text-[11px] text-ink-faint mb-1">
        ≈ {tokenCount} tokens · at $3/1M input ≈{" "}
        <span style={{ color: ACCENT }}>${cost.toFixed(6)}</span>
      </div>

      <Callout kind="note" title="Rule of thumb">
        Roughly <strong>~4 characters ≈ 1 token</strong> for English prose. Numbers, code, and
        whitespace tokenize <em>less</em> efficiently (more tokens per character), so they cost more
        and eat context faster. This widget is a deterministic approximation — real BPE merges
        frequent byte pairs from a fixed vocabulary.
      </Callout>
    </div>
  );
}
