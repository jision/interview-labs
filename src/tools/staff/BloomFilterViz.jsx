import React, { useState, useRef, useEffect } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#d6a94c";
const M = 24; // number of bits in the array
const K = 3; // number of hash functions

/* Three DETERMINISTIC hash functions over the characters of a word.
   Same word always yields the same three indices — no randomness anywhere,
   which is exactly what a real Bloom filter needs (the hashes must agree
   between add() and query()). Each is a small rolling polynomial mod M. */
function hashes(word) {
  let h1 = 0;
  let h2 = 0;
  let h3 = 0;
  for (let i = 0; i < word.length; i++) {
    const c = word.charCodeAt(i);
    h1 = (h1 * 31 + c) % M;
    h2 = (h2 * 37 + c + 7) % M;
    h3 = (h3 * 41 + c * 3 + 13) % M;
  }
  return [h1, h2, h3];
}

/* Pool ordered so the default buttons tell a clean story:
   add cat, dog, cod  →  ant becomes a FALSE POSITIVE, fox stays a clean negative.
     cat → [6, 21, 7]   dog → [20, 23, 13]   cod → [16, 19, 1]
     ant → [23, 20, 16] — every bit already 1 (23,20 from dog; 16 from cod) → false positive
     fox → [15, 18, 22] — bit 15 is still 0 → definitely not in set            */
const POOL = ["cat", "dog", "cod", "ant", "fox", "bee", "elk", "ram"];

function emptyBits() {
  return new Array(M).fill(0);
}

export default function BloomFilterViz() {
  const [bits, setBits] = useState(emptyBits);
  const [added, setAdded] = useState([]); // words truly inserted
  const [hot, setHot] = useState([]); // indices flashed this step
  const [verdict, setVerdict] = useState(null); // 'in' | 'fp' | 'out' | 'set'
  const [note, setNote] = useState(
    `Empty filter: ${M} bits, all 0. Each add() flips ${K} bits to 1; query() checks those same ${K} bits.`
  );
  const timer = useRef(null);

  // clear a pending highlight timer if the component unmounts mid-flash
  useEffect(() => () => clearTimeout(timer.current), []);

  function flash(idxs, kind) {
    setHot(idxs);
    setVerdict(kind);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setHot([]);
      setVerdict(null);
    }, 1100);
  }

  function add(word) {
    const idx = hashes(word);
    if (added.includes(word)) {
      flash(idx, "set");
      setNote(
        `add("${word}") again → bits [${idx.join(", ")}] are already 1. Adding is idempotent; nothing new is set.`
      );
      return;
    }
    setBits((prev) => {
      const next = prev.slice();
      idx.forEach((i) => (next[i] = 1));
      return next;
    });
    setAdded((prev) => [...prev, word]);
    flash(idx, "set");
    setNote(
      `add("${word}") → hashes to bits [${idx.join(", ")}]. Set all ${K} to 1. "${word}" is now truly in the set.`
    );
  }

  function query(word) {
    const idx = hashes(word);
    const zero = idx.find((i) => bits[i] === 0);
    if (zero !== undefined) {
      // at least one bit is 0 → the word was certainly never added.
      flash(idx, "out");
      setNote(
        `query("${word}") → bits [${idx.join(", ")}]; bit ${zero} is 0. A 0 can only mean it was never added → DEFINITELY NOT in the set. Bloom filters never give a false negative.`
      );
      return;
    }
    // all K bits are 1 → "possibly in set". Distinguish a real member from a lie.
    const truly = added.includes(word);
    flash(idx, truly ? "in" : "fp");
    setNote(
      truly
        ? `query("${word}") → bits [${idx.join(", ")}] all 1, and "${word}" was added → POSSIBLY in set (here, truly present). A member always reads "possibly in set" — no false negatives.`
        : `query("${word}") → bits [${idx.join(", ")}] all 1, so it reads POSSIBLY in set — but "${word}" was never added. This is a FALSE POSITIVE: other words' bits collided to cover all ${K} of its bits.`
    );
  }

  function reset() {
    setBits(emptyBits());
    setAdded([]);
    setHot([]);
    setVerdict(null);
    setNote(`Reset. ${M} bits, all 0.`);
  }

  const setCount = bits.reduce((a, b) => a + b, 0);
  const n = added.length;
  // Estimated false-positive rate: (1 - e^(-k*n/m))^k
  const fpRate = n === 0 ? 0 : Math.pow(1 - Math.exp((-K * n) / M), K);

  // verdict banner styling
  const banner =
    verdict === "in"
      ? { color: "#4ade80", text: "✓ POSSIBLY IN SET" }
      : verdict === "fp"
        ? { color: "#fbbf24", text: "✓ POSSIBLY IN SET — FALSE POSITIVE" }
        : verdict === "out"
          ? { color: "#f87171", text: "✕ DEFINITELY NOT IN SET" }
          : verdict === "set"
            ? { color: ACCENT, text: "● BITS SET" }
            : null;

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 font-mono text-xs">
        <span className="text-ink-faint">
          k (hashes) <span className="text-ink font-semibold">{K}</span>
        </span>
        <span className="text-ink-faint">
          words added <span className="text-ink font-semibold">{n}</span>
        </span>
        <span className="text-ink-faint">
          bits set{" "}
          <span className="text-ink font-semibold">
            {setCount}/{M}
          </span>
        </span>
        <span className="text-ink-faint">
          est. FP rate{" "}
          <span style={{ color: ACCENT }} className="font-semibold">
            {(fpRate * 100).toFixed(1)}%
          </span>
        </span>
      </div>

      {/* Bit array */}
      <div className="flex flex-wrap gap-1.5 mb-1 pb-6">
        {bits.map((b, i) => {
          const isHot = hot.includes(i);
          const on = b === 1;
          let style;
          if (isHot && verdict === "out") {
            // negative verdict: don't flatter the set bits green. Tint all the
            // queried bits neutral amber and flag only the deciding 0 bit(s) red.
            style = on
              ? {
                  background: "#fbbf24",
                  color: "#0c0e14",
                  border: "1px solid #fbbf24",
                }
              : {
                  background: "#f87171",
                  color: "#0c0e14",
                  border: "1px solid #f87171",
                };
          } else if (isHot) {
            // positive/set verdict: all checked bits are 1 → green highlight.
            style = {
              background: "#4ade80",
              color: "#0c0e14",
              border: `1px solid #4ade80`,
            };
          } else if (on) {
            style = {
              background: "color-mix(in srgb,#d6a94c 22%,#15171f)",
              color: "#eef1f7",
              border: `1px solid ${ACCENT}`,
            };
          } else {
            style = {
              background: "#11131a",
              color: "#3a414d",
              border: "1px dashed rgba(255,255,255,0.12)",
            };
          }
          return (
            <div
              key={i}
              className="relative flex-none w-8 h-9 rounded-md flex items-center justify-center font-mono text-sm font-semibold transition-all duration-300"
              style={style}
            >
              {b}
              <span className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[9px] text-ink-faint/60">
                {i}
              </span>
            </div>
          );
        })}
      </div>

      {/* Verdict banner */}
      <div className="min-h-[1.5rem] mb-3">
        {banner && (
          <span
            className="font-mono text-xs font-bold tracking-wide transition-opacity duration-200"
            style={{ color: banner.color }}
          >
            {banner.text}
          </span>
        )}
      </div>

      {/* Truly-added set */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 font-mono text-[11px] min-h-[1.5rem]">
        <span className="text-ink-faint uppercase tracking-wider">truly added:</span>
        {added.length === 0 ? (
          <span className="text-ink-faint/60">∅ (empty)</span>
        ) : (
          added.map((w) => (
            <span
              key={w}
              className="px-1.5 py-0.5 rounded"
              style={{
                background: "color-mix(in srgb,#d6a94c 16%,#15171f)",
                color: "#eef1f7",
                border: `1px solid rgba(214,169,76,0.5)`,
              }}
            >
              {w}
            </span>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-2">
        <Btn tone={ACCENT} onClick={() => add("cat")}>add("cat")</Btn>
        <Btn tone={ACCENT} onClick={() => add("dog")}>add("dog")</Btn>
        <Btn tone={ACCENT} onClick={() => add("cod")}>add("cod")</Btn>
        <Btn tone="#fbbf24" onClick={() => query("ant")}>
          query("ant") · false positive
        </Btn>
        <Btn tone="#5fb3f0" onClick={() => query("fox")}>
          query("fox") · clean miss
        </Btn>
        <Btn variant="ghost" onClick={() => query("cat")}>query("cat")</Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[3rem] mt-1">{note}</p>
    </div>
  );
}
