import React, { useState } from "react";

/*
 * Attention heatmap — baked fixture, no model in the browser.
 * The classic coreference example: "it" attends back to "cat".
 * Rows = query token (who is looking), columns = key token (what it looks at).
 * Each row is a softmax distribution (sums to ~1).
 */
const ACCENT = "#7c5cff";

const TOKENS = ["The", "cat", "sat", "because", "it", "was", "tired"];

// W[query][key] — hand-authored to look like a trained head doing coreference.
const W = [
  [0.52, 0.28, 0.08, 0.03, 0.03, 0.02, 0.04], // The
  [0.22, 0.40, 0.20, 0.04, 0.05, 0.03, 0.06], // cat
  [0.10, 0.34, 0.36, 0.06, 0.05, 0.04, 0.05], // sat
  [0.05, 0.14, 0.30, 0.26, 0.07, 0.06, 0.12], // because
  [0.10, 0.55, 0.08, 0.05, 0.16, 0.03, 0.03], // it   ← attends to "cat"
  [0.04, 0.10, 0.12, 0.10, 0.26, 0.26, 0.12], // was
  [0.05, 0.12, 0.12, 0.08, 0.20, 0.18, 0.25], // tired
];

function cell(accent, w) {
  // map weight 0..1 to an accent-tinted background
  return `color-mix(in srgb, ${accent} ${Math.round(w * 100)}%, transparent)`;
}

export default function AttentionViz() {
  const [q, setQ] = useState(4); // default: "it"
  const row = W[q];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="text-sm text-ink-dim mb-3">
        Pick a <span className="text-ink font-semibold">query</span> token — the row shows how
        much it attends to every other token. Watch <code className="font-mono text-ink">it</code>{" "}
        point back at <code className="font-mono text-ink">cat</code>.
      </div>

      {/* query selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TOKENS.map((t, i) => (
          <button
            key={i}
            onClick={() => setQ(i)}
            className="font-mono text-xs px-2.5 py-1 rounded-md border transition-colors"
            style={
              i === q
                ? { background: ACCENT, color: "#0c0e14", borderColor: ACCENT }
                : { borderColor: "rgba(255,255,255,0.16)", color: "#a8b0bf" }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* full matrix heatmap */}
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-1" />
              {TOKENS.map((t, j) => (
                <th
                  key={j}
                  className="font-mono text-[10px] text-ink-faint font-normal px-1 pb-1 text-center"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {W.map((r, i) => (
              <tr
                key={i}
                style={i === q ? { outline: `2px solid ${ACCENT}` } : undefined}
              >
                <td className="font-mono text-[10px] text-ink-faint pr-2 text-right whitespace-nowrap">
                  {TOKENS[i]}
                </td>
                {r.map((w, j) => (
                  <td key={j} className="p-0.5">
                    <div
                      title={`${TOKENS[i]} → ${TOKENS[j]}: ${w.toFixed(2)}`}
                      className="w-9 h-9 rounded flex items-center justify-center font-mono text-[10px]"
                      style={{
                        background: cell(ACCENT, w),
                        color: w > 0.4 ? "#fff" : "#6b7480",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      {w >= 0.15 ? w.toFixed(2) : ""}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* the selected row as bars */}
      <div className="mt-4 pt-4 border-t border-line">
        <div className="font-mono text-[11px] text-ink-faint mb-2">
          “{TOKENS[q]}” attends to →
        </div>
        <div className="space-y-1">
          {row.map((w, j) => (
            <div key={j} className="flex items-center gap-2">
              <span className="font-mono text-[11px] w-16 text-right text-ink-dim">
                {TOKENS[j]}
              </span>
              <div className="flex-1 h-3 rounded bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded"
                  style={{ width: `${w * 100}%`, background: ACCENT }}
                />
              </div>
              <span className="font-mono text-[10px] w-9 text-ink-faint">
                {w.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
