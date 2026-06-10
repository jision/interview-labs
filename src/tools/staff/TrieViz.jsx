import React, { useState, useMemo } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#d6a94c";

const WORDS = ["cat", "car", "card", "care", "dog", "do", "dot", "cab"];

/* Build a trie from the word list. Each node: { children: {ch: node}, end: bool }. */
function buildTrie(words) {
  const root = { children: {}, end: false };
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      if (!node.children[ch]) node.children[ch] = { children: {}, end: false };
      node = node.children[ch];
    }
    node.end = true;
  }
  return root;
}

/* Collect all complete words under a node, given the prefix that reaches it. */
function collect(node, prefix, out) {
  if (node.end) out.push(prefix);
  for (const ch of Object.keys(node.children).sort()) {
    collect(node.children[ch], prefix + ch, out);
  }
}

export default function TrieViz() {
  const [prefix, setPrefix] = useState("ca");
  const root = useMemo(() => buildTrie(WORDS), []);

  // walk the prefix; report how far we got and the matching words
  const { node, depth } = useMemo(() => {
    let n = root;
    let d = 0;
    for (const ch of prefix) {
      if (!n.children[ch]) return { node: null, depth: d };
      n = n.children[ch];
      d += 1;
    }
    return { node: n, depth: d };
  }, [prefix, root]);

  const matches = useMemo(() => {
    if (!node) return [];
    const out = [];
    collect(node, prefix, out);
    return out;
  }, [node, prefix]);

  function addChar(ch) {
    setPrefix((p) => p + ch);
  }
  function backspace() {
    setPrefix((p) => p.slice(0, -1));
  }

  const dead = prefix.length > 0 && node === null;

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="font-mono text-xs text-ink-faint mb-2">
        dictionary: {WORDS.join(", ")}
      </div>

      {/* Prefix display */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs text-ink-faint">prefix</span>
        <span
          className="font-mono text-base font-bold px-2 py-1 rounded"
          style={{
            background: "#11131a",
            color: dead ? "#f87171" : ACCENT,
            minWidth: 60,
          }}
        >
          {prefix || "·"}
        </span>
        <span className="font-mono text-xs text-ink-faint">
          {dead
            ? "no node — dead end"
            : `walked ${depth} edge${depth === 1 ? "" : "s"} → O(L)`}
        </span>
      </div>

      {/* Letter buttons */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {"abcdegort".split("").map((ch) => (
          <Btn key={ch} tone={ACCENT} onClick={() => addChar(ch)}>
            {ch}
          </Btn>
        ))}
        <Btn variant="ghost" onClick={backspace} disabled={!prefix.length}>
          ⌫
        </Btn>
        <Btn variant="ghost" onClick={() => setPrefix("")} disabled={!prefix.length}>
          clear
        </Btn>
      </div>

      {/* Matches */}
      <div className="min-h-[2.25rem]">
        {matches.length ? (
          <div className="flex flex-wrap gap-2">
            {matches.map((w) => (
              <span
                key={w}
                className="font-mono text-xs px-2 py-1 rounded"
                style={{ background: "color-mix(in srgb,#d6a94c 14%,#15171f)", color: "#eef1f7" }}
              >
                {w}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-ink-faint">
            no words with this prefix — autocomplete shows nothing.
          </span>
        )}
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem] mt-3">
        Finding the prefix node costs <span className="text-ink">O(L)</span> in the prefix length L —
        independent of how many words are stored. Then a DFS under that node lists every completion.
      </p>
    </div>
  );
}
