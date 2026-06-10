import React, { useState, useMemo } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#38e0d6";

let uid = 0;

/* ── A plain trie of nested nodes ──────────────────────────────────
   node = { id, children: { ch -> node }, end: bool }                  */
function newNode() {
  return { id: ++uid, children: {}, end: false };
}

function insertWord(root, word) {
  let node = root;
  for (const ch of word) {
    if (!node.children[ch]) node.children[ch] = newNode();
    node = node.children[ch];
  }
  node.end = true;
}

function buildTrie(words) {
  const root = newNode();
  words.forEach((w) => insertWord(root, w));
  return root;
}

/* Walk down the path for `prefix`. Returns the node it ends on, or
   null if the prefix is not present. Records each char step. */
function descend(root, prefix) {
  let node = root;
  for (const ch of prefix) {
    if (!node.children[ch]) return null;
    node = node.children[ch];
  }
  return node;
}

/* All completed words at-or-below `node`, with `prefix` already typed. */
function collect(node, prefix, out) {
  if (node.end) out.push(prefix);
  // deterministic order: sort the child chars
  Object.keys(node.children)
    .sort()
    .forEach((ch) => collect(node.children[ch], prefix + ch, out));
  return out;
}

const SEED = ["cat", "car", "card", "dog"];
const POOL = ["care", "cart", "dot", "do", "dove", "cab", "bat", "bad", "an", "ant"];

export default function TrieViz() {
  const [words, setWords] = useState(SEED);
  const [prefix, setPrefix] = useState("ca");
  const [note, setNote] = useState(
    'Seeded with "cat", "car", "card", "dog". Type a prefix to light up its path and list completions.'
  );

  const root = useMemo(() => buildTrie(words), [words]);

  // Which node-ids are on the current prefix path (highlight green).
  const { pathIds, completions, prefixExists } = useMemo(() => {
    const ids = new Set([root.id]);
    let node = root;
    let ok = true;
    for (const ch of prefix) {
      if (node.children[ch]) {
        node = node.children[ch];
        ids.add(node.id);
      } else {
        ok = false;
        break;
      }
    }
    const comps = ok ? collect(node, prefix, []) : [];
    return { pathIds: ids, completions: comps, prefixExists: ok };
  }, [root, prefix]);

  function addWord(w) {
    if (words.includes(w)) {
      setNote(`"${w}" is already in the trie — insert is idempotent; it just re-walks the same O(L) path.`);
      return;
    }
    setWords((ws) => [...ws, w]);
    setNote(`insert("${w}"): walk/create one node per character → O(L) with L = ${w.length}. Shared prefixes reuse existing nodes (no duplication).`);
  }

  function typePrefix(p) {
    setPrefix(p);
    const ok = descend(root, p) !== null;
    if (!p) {
      setNote("Empty prefix → everything below the root matches. The whole word list is one autocomplete query away.");
    } else if (ok) {
      const comps = collect(descend(root, p), p, []);
      setNote(`prefix "${p}": followed ${p.length} edge${p.length > 1 ? "s" : ""} from the root → O(L). ${comps.length} completion${comps.length === 1 ? "" : "s"} live in that subtree.`);
    } else {
      setNote(`prefix "${p}": the path runs out before the last character → no word starts with "${p}". Search fails in O(L), never scanning unrelated branches.`);
    }
  }

  function reset() {
    setWords(SEED);
    setPrefix("ca");
    setNote("Reset to the seed words.");
  }

  // Words still available from the pool to add.
  const available = POOL.filter((w) => !words.includes(w));

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 font-mono text-xs">
        <span className="text-ink-faint">words <span className="text-ink font-semibold">{words.length}</span></span>
        <span className="text-ink-faint">nodes <span className="text-ink font-semibold">{countNodes(root)}</span></span>
        <span className="text-ink-faint">prefix <span className="text-ink font-semibold">"{prefix}"</span></span>
        <span className="text-ink-faint">completions <span className="text-ink font-semibold">{completions.length}</span></span>
      </div>

      {/* Tree as an indented nested node list */}
      <div className="rounded-lg bg-[#0e1018] border border-line p-3 mb-4 overflow-x-auto font-mono text-[13px] leading-relaxed">
        <TrieNodeRow node={root} ch="root" depth={0} pathIds={pathIds} />
      </div>

      {/* Prefix input + chips */}
      <div className="mb-3">
        <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1.5">
          prefix
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={prefix}
            onChange={(e) => typePrefix(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
            placeholder="type letters…"
            className="font-mono text-sm bg-[#11131a] text-ink border border-line-strong rounded-md px-2.5 py-1.5 w-36 outline-none focus:border-line-strong"
            style={{ borderColor: prefixExists ? ACCENT : undefined }}
          />
          {["", "ca", "car", "do", "z"].map((p) => (
            <Btn key={p || "empty"} variant="ghost" onClick={() => typePrefix(p)}>
              {p === "" ? "(all)" : p}
            </Btn>
          ))}
        </div>
      </div>

      {/* Autocomplete output */}
      <div className="mb-4">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1.5">
          autocomplete under "{prefix}"
        </div>
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {completions.length === 0 ? (
            <span className="text-ink-faint text-sm font-mono">— no matches —</span>
          ) : (
            completions.map((w) => (
              <span
                key={w}
                className="font-mono text-xs font-semibold px-2 py-1 rounded-md"
                style={{ background: "color-mix(in srgb,#38e0d6 16%,#15171f)", color: "#eef1f7", border: `1px solid ${ACCENT}` }}
              >
                {w}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Add-word controls */}
      <div className="mb-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1.5">
          insert a word
        </div>
        <div className="flex flex-wrap gap-2">
          {available.length === 0 ? (
            <span className="text-ink-faint text-sm font-mono">— pool exhausted —</span>
          ) : (
            available.map((w) => (
              <Btn key={w} tone={ACCENT} onClick={() => addWord(w)}>
                + {w}
              </Btn>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem]">{note}</p>
    </div>
  );
}

/* Recursive indented row. Children are sorted for deterministic order.
   A node on the current prefix path glows; a word-terminal shows a ●.  */
function TrieNodeRow({ node, ch, depth, pathIds }) {
  const onPath = pathIds.has(node.id);
  const kids = Object.keys(node.children).sort();
  const isRoot = depth === 0;
  return (
    <div>
      <div
        className="flex items-center gap-1.5 rounded px-1 transition-colors"
        style={{
          marginLeft: depth * 18,
          background: onPath ? "color-mix(in srgb,#38e0d6 14%,transparent)" : "transparent",
        }}
      >
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded text-[12px] font-semibold"
          style={
            isRoot
              ? { color: "#3a414d", border: "1px dashed rgba(255,255,255,0.18)" }
              : onPath
              ? { background: ACCENT, color: "#0c0e14" }
              : { background: "#1c1f2a", color: "#eef1f7", border: "1px solid rgba(255,255,255,0.14)" }
          }
        >
          {isRoot ? "•" : ch}
        </span>
        {node.end && (
          <span className="text-[10px]" style={{ color: ACCENT }} title="end of a word">
            ● word
          </span>
        )}
      </div>
      {kids.map((c) => (
        <TrieNodeRow key={node.children[c].id} node={node.children[c]} ch={c} depth={depth + 1} pathIds={pathIds} />
      ))}
    </div>
  );
}

function countNodes(node) {
  let n = 1;
  for (const ch of Object.keys(node.children)) n += countNodes(node.children[ch]);
  return n;
}
