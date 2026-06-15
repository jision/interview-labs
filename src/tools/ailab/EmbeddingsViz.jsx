import React, { useMemo, useState } from "react";

/*
 * 2D embedding-space explorer — baked fixture, no model in the browser.
 * 16 words placed in 4 visible clusters (≥4 each) on a 0–100 plane.
 * Click a word to make it the query: we draw faint lines to its 3 nearest
 * neighbors by STRAIGHT-LINE (Euclidean) distance — the honest metric for a
 * position scatter — and show a closeness score. Closeness ≈ semantic similarity.
 * (Real high-dim embeddings rank by cosine; on a 2-D map distance is what the eye
 *  reads, and the two agree once vectors are length-normalized — see the topic text.)
 */
const ACCENT = "#7c5cff";

// Per-cluster colors (animals / royalty / food / tech).
const CLUSTERS = {
  animals: "#4ade80",
  royalty: "#fbbf24",
  food: "#f87171",
  tech: "#60a5fa",
};

// Hand-authored positions so each cluster sits tightly in its own region
// (≥4 words per cluster, so a query's 3 nearest are always clustermates).
const WORDS = [
  { w: "cat", x: 18, y: 22, c: "animals" },
  { w: "dog", x: 26, y: 16, c: "animals" },
  { w: "lion", x: 14, y: 32, c: "animals" },
  { w: "tiger", x: 24, y: 30, c: "animals" },
  { w: "king", x: 80, y: 20, c: "royalty" },
  { w: "queen", x: 86, y: 26, c: "royalty" },
  { w: "prince", x: 76, y: 30, c: "royalty" },
  { w: "duke", x: 82, y: 12, c: "royalty" },
  { w: "apple", x: 22, y: 78, c: "food" },
  { w: "bread", x: 30, y: 84, c: "food" },
  { w: "pizza", x: 16, y: 88, c: "food" },
  { w: "salad", x: 30, y: 74, c: "food" },
  { w: "python", x: 78, y: 76, c: "tech" },
  { w: "server", x: 86, y: 82, c: "tech" },
  { w: "code", x: 72, y: 86, c: "tech" },
  { w: "robot", x: 84, y: 70, c: "tech" },
];

// Straight-line (Euclidean) distance between two {x,y} points.
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
// Map a distance to a 0..1 "closeness" score for the bar (nearer = higher).
function closeness(d) {
  return Math.max(0, 1 - d / 100);
}

export default function EmbeddingsViz() {
  const [sel, setSel] = useState("king"); // default query word

  const query = WORDS.find((d) => d.w === sel);

  // Top-3 nearest neighbors of the query by distance (excludes itself).
  const neighbors = useMemo(() => {
    if (!query) return [];
    return WORDS.filter((d) => d.w !== query.w)
      .map((d) => ({ ...d, d: dist(query, d), score: closeness(dist(query, d)) }))
      .sort((a, b) => a.d - b.d) // nearest first
      .slice(0, 3);
  }, [query]);

  const nset = new Set(neighbors.map((n) => n.w));

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="text-sm text-ink-dim mb-3">
        Click any word to make it the <span className="text-ink font-semibold">query</span> — lines
        connect it to its <span className="text-ink font-semibold">3 nearest neighbors</span> on the
        map. Words that mean similar things sit near each other.
      </div>

      <div className="rounded-lg border border-line bg-[#0e1018] overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full" style={{ height: 360 }}>
          {/* faint connector lines from query to its neighbors */}
          {query &&
            neighbors.map((n) => (
              <line
                key={"l" + n.w}
                x1={query.x}
                y1={query.y}
                x2={n.x}
                y2={n.y}
                stroke={ACCENT}
                strokeWidth={0.5}
                strokeDasharray="1.5 1.5"
                opacity={0.55}
              />
            ))}

          {WORDS.map((d) => {
            const isQuery = query && d.w === query.w;
            const isNbr = nset.has(d.w);
            const fill = CLUSTERS[d.c];
            const r = isQuery ? 2.8 : isNbr ? 2.2 : 1.6;
            return (
              <g
                key={d.w}
                onClick={() => setSel(d.w)}
                style={{ cursor: "pointer" }}
              >
                {isQuery && (
                  <circle cx={d.x} cy={d.y} r={4.4} fill="none" stroke={ACCENT} strokeWidth={0.6} />
                )}
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={r}
                  fill={isQuery ? ACCENT : fill}
                  opacity={isQuery || isNbr ? 1 : 0.55}
                />
                <text
                  x={d.x}
                  y={d.y - 3.4}
                  textAnchor="middle"
                  fontSize={3}
                  fontFamily="ui-monospace, monospace"
                  fill={isQuery ? "#eef1f7" : isNbr ? "#cdd3df" : "#7c8696"}
                  style={{ pointerEvents: "none" }}
                >
                  {d.w}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {Object.entries(CLUSTERS).map(([name, color]) => (
          <span key={name} className="flex items-center gap-1.5 font-mono text-[11px] text-ink-dim">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {name}
          </span>
        ))}
      </div>

      {/* neighbor scores */}
      <div className="mt-4 pt-4 border-t border-line">
        <div className="font-mono text-[11px] text-ink-faint mb-2">
          “{sel}” nearest neighbors (closer = more similar) →
        </div>
        <div className="space-y-1">
          {neighbors.map((n) => (
            <div key={n.w} className="flex items-center gap-2">
              <span className="font-mono text-[11px] w-16 text-right text-ink-dim">{n.w}</span>
              <div className="flex-1 h-3 rounded bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-200"
                  style={{ width: `${n.score * 100}%`, background: ACCENT }}
                />
              </div>
              <span className="font-mono text-[10px] w-12 text-ink-faint">{n.score.toFixed(3)}</span>
            </div>
          ))}
        </div>
        <div className="font-mono text-[11px] text-ink-faint mt-3">
          closeness = semantic similarity — the 3 nearest all share the query's cluster.
        </div>
      </div>
    </div>
  );
}
