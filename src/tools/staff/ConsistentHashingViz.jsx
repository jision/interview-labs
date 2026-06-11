import React, { useState, useRef, useEffect, useMemo } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#d6a94c";

/* ── Hash space ────────────────────────────────────────────────────
   The ring is a 16-bit hash space [0, 65536). A position is mapped to
   an angle around a circle: 0 sits at the top (12 o'clock) and the value
   increases CLOCKWISE. Each key is owned by the FIRST node found walking
   clockwise from the key (wrapping past the top back to position 0).      */
const RING = 65536;

/* A small deterministic string hash (FNV-1a) finished with a splitmix32
   avalanche step, folded into the ring. Same input → same position, every
   render, with no PRNG anywhere — that determinism is what makes consistent
   hashing *consistent*: a key's home is decided by identity, not chance. The
   avalanche step just spreads similar labels (node-N0, node-N1, …) far apart
   on the ring so the demo isn't a clump; a real ring uses MD5/SHA for this. */
function hash(str) {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  // splitmix32 finalizer → good avalanche / low correlation between inputs
  h >>>= 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x21f0aaad);
  h ^= h >>> 15;
  h = Math.imul(h, 0x735a2d97);
  h ^= h >>> 15;
  // fold the 32-bit value into [0, RING)
  return (h >>> 0) % RING;
}

/* A distinct hue per node so its keys are visually attributable. */
const NODE_COLORS = ["#5fb3f0", "#9ece6a", "#f7768e", "#bb9af7", "#e0af68", "#7dcfff"];

/* Geometry: hash position → (x, y) on a circle of radius r centered at (cx,cy).
   angle = pos/RING of a full turn, offset by -90° so 0 is at the top, and
   we negate the sweep direction so increasing position runs clockwise. */
const CX = 210;
const CY = 210;
const R_RING = 150; // ring radius (where nodes sit)
const R_KEY = 118; // keys sit just inside the ring

function pointAt(pos, radius) {
  const theta = (pos / RING) * 2 * Math.PI - Math.PI / 2;
  return { x: CX + radius * Math.cos(theta), y: CY + radius * Math.sin(theta) };
}

/* Clockwise distance from a → b around the ring (always in [0, RING)). */
function cwDist(a, b) {
  return (b - a + RING) % RING;
}

/* Owner of a key = the first node at/after the key's position, walking
   clockwise. With ties broken by "at or after", a key exactly on a node
   is owned by that node. */
function ownerOf(keyPos, nodes) {
  if (nodes.length === 0) return null;
  let best = null;
  let bestDist = Infinity;
  for (const n of nodes) {
    const d = cwDist(keyPos, n.pos);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}

/* Deterministic seed data — labels chosen so their hashes spread out nicely
   around the ring. Positions are derived purely from hash(label). */
const SEED_NODES = ["host-B", "host-2", "host-H"];
const SEED_KEYS = ["img:42", "tag:88", "doc:17", "sess:64", "blob:1", "order:1"];

let uid = 0; // stable ids for repeated additions (see DynamicArrayViz)

function makeNode(label) {
  return { id: ++uid, label, pos: hash(label), color: null };
}
function makeKey(label) {
  return { id: ++uid, label, pos: hash(label) };
}

function buildSeed() {
  uid = 0;
  const nodes = SEED_NODES.map(makeNode);
  const keys = SEED_KEYS.map(makeKey);
  return { nodes, keys };
}

/* Assign each node its stable color by its sorted ring order, so colors
   stay legible as nodes come and go. */
function colorize(nodes) {
  const sorted = [...nodes].sort((a, b) => a.pos - b.pos);
  const colorById = {};
  sorted.forEach((n, i) => {
    colorById[n.id] = NODE_COLORS[i % NODE_COLORS.length];
  });
  return nodes.map((n) => ({ ...n, color: colorById[n.id] }));
}

export default function ConsistentHashingViz() {
  const seed = useMemo(buildSeed, []);
  const [nodes, setNodes] = useState(() => colorize(seed.nodes));
  const [keys, setKeys] = useState(seed.keys);
  const [moved, setMoved] = useState(new Set()); // key ids highlighted this op
  const [lastMoved, setLastMoved] = useState(null); // count for the stat strip
  const [note, setNote] = useState(
    "A consistent-hashing ring. The hash space wraps into a circle; each key (small dot) belongs to the first node (large dot) found walking clockwise. Add or remove a node and watch how few keys move."
  );
  const [nodeCounter, setNodeCounter] = useState(0); // drives deterministic new labels
  const [keyCounter, setKeyCounter] = useState(0);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function flash(ids, { countAsMoved = true } = {}) {
    const set = new Set(ids);
    setMoved(set);
    if (countAsMoved) setLastMoved(ids.length);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMoved(new Set()), 2200);
  }

  // owner lookup for the current node set
  const ownerByKey = useMemo(() => {
    const m = {};
    for (const k of keys) {
      const o = ownerOf(k.pos, nodes);
      m[k.id] = o ? o.id : null;
    }
    return m;
  }, [keys, nodes]);

  const colorByNodeId = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n.color])),
    [nodes]
  );

  function addNode() {
    if (nodes.length >= NODE_COLORS.length) {
      setNote(
        `Demo caps at ${NODE_COLORS.length} nodes so colors stay legible — remove one first. The math holds for any N.`
      );
      return;
    }
    // deterministic new label; bump the counter if its hash collides with a
    // node already on the ring so we always land on a fresh slot.
    let i = nodeCounter;
    let label, pos;
    do {
      label = `node-N${i}`;
      pos = hash(label);
      i++;
    } while (nodes.some((n) => n.pos === pos));
    setNodeCounter(i);

    const newNode = { id: ++uid, label, pos, color: null };
    const nextNodes = colorize([...nodes, newNode]);

    // Keys that REMAP onto the new node = keys whose owner *changes* to it.
    // Geometrically: keys in the arc from the previous (counter-clockwise)
    // node up to the new node — previously owned by the new node's clockwise
    // successor. We compute it by simply re-running ownership.
    const claimed = keys.filter((k) => {
      const before = ownerByKey[k.id];
      const after = ownerOf(k.pos, nextNodes);
      return after && after.id === newNode.id && before !== newNode.id;
    });

    setNodes(nextNodes);
    flash(claimed.map((k) => k.id));
    setNote(
      `add ${label} at position ${pos}. Only ${claimed.length} of ${keys.length} keys move — they hop off their old node onto ${label}. Every other key stays put. That ~K/N churn is the whole point: a classic hash-mod-N would have remapped almost all ${keys.length}.`
    );
  }

  function removeNode() {
    if (nodes.length <= 1) {
      setNote("Need at least one node to host the keys — can't remove the last one.");
      return;
    }
    // remove the most-recently-added node (highest id) for a predictable demo
    const victim = nodes.reduce((a, b) => (b.id > a.id ? b : a));
    const nextNodes = colorize(nodes.filter((n) => n.id !== victim.id));

    // Keys owned by the victim move to the NEXT node clockwise (their new owner).
    const orphaned = keys.filter((k) => ownerByKey[k.id] === victim.id);
    const targets = new Set(
      orphaned.map((k) => {
        const o = ownerOf(k.pos, nextNodes);
        return o ? o.label : "—";
      })
    );

    setNodes(nextNodes);
    flash(orphaned.map((k) => k.id));
    setNote(
      `remove ${victim.label}. Its ${orphaned.length} key${orphaned.length === 1 ? "" : "s"} fall through to the next node clockwise (${[...targets].join(", ") || "—"}). Keys on the other ${nextNodes.length} node${nextNodes.length === 1 ? "" : "s"} never moved — failure is local.`
    );
  }

  function addKey() {
    // deterministic new key label; skip positions already occupied by a key
    let i = keyCounter;
    let label, pos;
    do {
      label = `key:${i}`;
      pos = hash(label);
      i++;
    } while (keys.some((k) => k.pos === pos));
    setKeyCounter(i);

    const newKey = { id: ++uid, label, pos };
    const owner = ownerOf(pos, nodes);
    setKeys((ks) => [...ks, newKey]);
    // highlight the new key, but adding a key moves no EXISTING key, so don't
    // report it in the "keys moved" stat — remap-on-membership-change is a
    // node-set concept, not a key-set one.
    setLastMoved(0);
    flash([newKey.id], { countAsMoved: false });
    setNote(
      `add ${label} → hashes to position ${pos}, lands on the ring, and is claimed by the first node clockwise: ${owner ? owner.label : "—"}. No other key is touched.`
    );
  }

  function reset() {
    clearTimeout(timer.current);
    const fresh = buildSeed();
    setNodes(colorize(fresh.nodes));
    setKeys(fresh.keys);
    setMoved(new Set());
    setLastMoved(null);
    setNodeCounter(0);
    setKeyCounter(0);
    setNote(
      "Reset to 3 nodes and 6 keys. Each key belongs to the first node clockwise from it."
    );
  }

  // per-node key counts for the legend
  const countByNode = useMemo(() => {
    const c = {};
    nodes.forEach((n) => (c[n.id] = 0));
    keys.forEach((k) => {
      const o = ownerByKey[k.id];
      if (o != null && o in c) c[o] += 1;
    });
    return c;
  }, [nodes, keys, ownerByKey]);

  const SIZE = 420;

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 font-mono text-xs">
        <span className="text-ink-faint">
          nodes <span className="text-ink font-semibold">{nodes.length}</span>
        </span>
        <span className="text-ink-faint">
          keys <span className="text-ink font-semibold">{keys.length}</span>
        </span>
        <span className="text-ink-faint">
          ring <span className="text-ink font-semibold">0..{RING - 1}</span>
        </span>
        <span className="text-ink-faint">
          keys moved (last op){" "}
          <span className="font-semibold" style={{ color: lastMoved != null ? ACCENT : undefined }}>
            {lastMoved == null ? "—" : `${lastMoved} / ${keys.length}`}
          </span>
        </span>
      </div>

      <div className="md:flex md:gap-5 md:items-start mb-4">
        {/* Ring SVG */}
        <div className="overflow-x-auto">
          <svg width={SIZE} height={SIZE} className="block">
            {/* the ring */}
            <circle
              cx={CX}
              cy={CY}
              r={R_RING}
              fill="none"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1.5"
            />
            {/* "position 0" tick at the top */}
            <line
              x1={CX}
              y1={CY - R_RING - 7}
              x2={CX}
              y2={CY - R_RING + 7}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
            />
            <text
              x={CX}
              y={CY - R_RING - 12}
              textAnchor="middle"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              fill="rgba(255,255,255,0.45)"
            >
              0 / {RING}
            </text>
            <text
              x={CX}
              y={CY - 4}
              textAnchor="middle"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              fill="rgba(255,255,255,0.3)"
            >
              clockwise ⟳
            </text>

            {/* spokes from each key to its owning node (thin colored arc-ish line) */}
            {keys.map((k) => {
              const ownerId = ownerByKey[k.id];
              if (ownerId == null) return null;
              const owner = nodes.find((n) => n.id === ownerId);
              if (!owner) return null;
              const kp = pointAt(k.pos, R_KEY);
              const np = pointAt(owner.pos, R_RING);
              const isHot = moved.has(k.id);
              return (
                <line
                  key={"spoke-" + k.id}
                  x1={kp.x}
                  y1={kp.y}
                  x2={np.x}
                  y2={np.y}
                  stroke={isHot ? ACCENT : colorByNodeId[ownerId]}
                  strokeWidth={isHot ? 2 : 1}
                  strokeOpacity={isHot ? 0.95 : 0.35}
                  style={{ transition: "stroke .25s, stroke-opacity .25s" }}
                />
              );
            })}

            {/* nodes (large dots) */}
            {nodes.map((n) => {
              const p = pointAt(n.pos, R_RING);
              return (
                <g key={"node-" + n.id}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="11"
                    fill={n.color}
                    stroke="#0c0e14"
                    strokeWidth="2"
                  />
                  <text
                    x={p.x}
                    y={p.y - 16}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontFamily="ui-monospace, monospace"
                    fill="#eef1f7"
                    fontWeight="700"
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}

            {/* keys (small dots), colored by owner; highlighted ones ringed in accent */}
            {keys.map((k) => {
              const ownerId = ownerByKey[k.id];
              const p = pointAt(k.pos, R_KEY);
              const isHot = moved.has(k.id);
              const fill = ownerId != null ? colorByNodeId[ownerId] : "#5f6875";
              return (
                <g key={"key-" + k.id}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHot ? 6 : 4.5}
                    fill={fill}
                    stroke={isHot ? ACCENT : "#0c0e14"}
                    strokeWidth={isHot ? 2.5 : 1}
                    style={{ transition: "r .25s, stroke .25s" }}
                  />
                  {isHot && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="10"
                      fill="none"
                      stroke={ACCENT}
                      strokeWidth="1"
                      strokeOpacity="0.6"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend / ownership table */}
        <div className="mt-3 md:mt-0 md:flex-1 min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1.5">
            nodes (clockwise on the ring)
          </div>
          <div className="flex flex-col gap-1.5 mb-4">
            {[...nodes]
              .sort((a, b) => a.pos - b.pos)
              .map((n) => (
                <div key={"leg-" + n.id} className="flex items-center gap-2 font-mono text-xs">
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-none"
                    style={{ background: n.color, border: "1px solid #0c0e14" }}
                  />
                  <span className="text-ink font-semibold">{n.label}</span>
                  <span className="text-ink-faint">@{n.pos}</span>
                  <span className="text-ink-faint ml-auto">
                    {countByNode[n.id]} key{countByNode[n.id] === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
          </div>

          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1.5">
            keys → owner
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[...keys]
              .sort((a, b) => a.pos - b.pos)
              .map((k) => {
                const ownerId = ownerByKey[k.id];
                const isHot = moved.has(k.id);
                return (
                  <span
                    key={"chip-" + k.id}
                    className="font-mono text-[11px] px-2 py-0.5 rounded"
                    style={{
                      background: isHot
                        ? "color-mix(in srgb,#d6a94c 22%,#15171f)"
                        : "#15171f",
                      color: "#eef1f7",
                      border: `1px solid ${isHot ? ACCENT : colorByNodeId[ownerId] || "#2a2e3a"}`,
                    }}
                  >
                    {k.label}
                  </span>
                );
              })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={addNode}>add node</Btn>
        <Btn tone="#f87171" onClick={removeNode}>remove node</Btn>
        <Btn tone="#5fb3f0" onClick={addKey}>add key</Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[3.75rem]">{note}</p>
    </div>
  );
}
