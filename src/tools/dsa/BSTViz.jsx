import React, { useState, useMemo } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#38e0d6";

function insert(root, val) {
  if (!root) return { val, left: null, right: null };
  if (val === root.val) return root; // ignore dupes
  if (val < root.val) root.left = insert(root.left, val);
  else root.right = insert(root.right, val);
  return root;
}
function clone(node) {
  return node ? { val: node.val, left: clone(node.left), right: clone(node.right) } : null;
}
function height(node) {
  return node ? 1 + Math.max(height(node.left), height(node.right)) : 0;
}

/* Assign x by in-order index, y by depth → clean, non-overlapping layout. */
function layout(root) {
  const nodes = [];
  const edges = [];
  let i = 0;
  (function walk(node, depth, parent) {
    if (!node) return;
    walk(node.left, depth + 1, node);
    const cur = { val: node.val, x: i++, y: depth, parent: parent ? parent.val : null };
    nodes.push(cur);
    walk(node.right, depth + 1, node);
  })(root, 0, null);
  const byVal = Object.fromEntries(nodes.map((n) => [n.val, n]));
  nodes.forEach((n) => {
    if (n.parent != null) edges.push({ from: byVal[n.parent], to: n });
  });
  return { nodes, edges, cols: i };
}

export default function BSTViz() {
  const [root, setRoot] = useState(() => {
    let r = null;
    [50, 30, 70, 20, 40, 60, 80].forEach((v) => (r = insert(r, v)));
    return r;
  });
  const [path, setPath] = useState([]); // vals on the current search path
  const [found, setFound] = useState(null);
  const [note, setNote] = useState("A balanced BST: left < node < right. Search halves the problem at each step.");

  const { nodes, edges, cols } = useMemo(() => layout(root), [root]);
  const h = height(root);
  const W = Math.max(cols * 56, 280);
  const H = Math.max(h * 70, 120);
  const px = (x) => 28 + x * 56;
  const py = (y) => 32 + y * 70;
  const byVal = Object.fromEntries(nodes.map((n) => [n.val, n]));

  function doInsert(sorted) {
    const v = sorted
      ? Math.max(0, ...nodes.map((n) => n.val)) + Math.floor(Math.random() * 9 + 1)
      : Math.floor(Math.random() * 99 + 1);
    const r = clone(root);
    setRoot(insert(r, v));
    setPath([]);
    setFound(null);
    setNote(
      sorted
        ? `Inserted ${v} (always larger) → the tree only grows right. Insert sorted data and a BST degrades into a linked list: O(n).`
        : `insert(${v}): walk down comparing, attach as a leaf → O(h). Balanced ⇒ h ≈ log₂(n).`
    );
  }

  function search() {
    if (!nodes.length) return;
    const target = nodes[Math.floor(Math.random() * nodes.length)].val;
    const steps = [];
    let cur = root;
    while (cur) {
      steps.push(cur.val);
      if (target === cur.val) break;
      cur = target < cur.val ? cur.left : cur.right;
    }
    setFound(null);
    setPath([]);
    steps.forEach((val, k) => {
      setTimeout(() => {
        setPath(steps.slice(0, k + 1));
        if (k === steps.length - 1) setFound(target);
      }, k * 420);
    });
    setNote(
      `search(${target}): visited ${steps.length} node${steps.length > 1 ? "s" : ""} out of ${nodes.length}. Each comparison discards a whole subtree.`
    );
  }

  function reset() {
    let r = null;
    [50, 30, 70, 20, 40, 60, 80].forEach((v) => (r = insert(r, v)));
    setRoot(r);
    setPath([]);
    setFound(null);
    setNote("Reset to a balanced tree.");
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 font-mono text-xs">
        <span className="text-ink-faint">nodes <span className="text-ink font-semibold">{nodes.length}</span></span>
        <span className="text-ink-faint">height <span className="text-ink font-semibold">{h}</span></span>
        <span className="text-ink-faint">log₂(n) ≈ <span className="text-ink font-semibold">{nodes.length ? Math.ceil(Math.log2(nodes.length + 1)) : 0}</span></span>
      </div>

      <div className="overflow-x-auto mb-4">
        <svg width={W} height={H} className="block">
          {edges.map((e, i) => (
            <line
              key={i}
              x1={px(e.from.x)} y1={py(e.from.y)}
              x2={px(e.to.x)} y2={py(e.to.y)}
              stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"
            />
          ))}
          {nodes.map((n) => {
            const onPath = path.includes(n.val);
            const isFound = found === n.val;
            return (
              <g key={n.val}>
                <circle
                  cx={px(n.x)} cy={py(n.y)} r="16"
                  fill={isFound ? ACCENT : onPath ? "color-mix(in srgb,#38e0d6 30%,#15171f)" : "#1c1f2a"}
                  stroke={onPath || isFound ? ACCENT : "rgba(255,255,255,0.2)"}
                  strokeWidth={onPath || isFound ? 2 : 1}
                  style={{ transition: "fill .2s, stroke .2s" }}
                />
                <text
                  x={px(n.x)} y={py(n.y) + 4} textAnchor="middle"
                  fontSize="12" fontFamily="ui-monospace, monospace"
                  fill={isFound ? "#0c0e14" : "#eef1f7"} fontWeight="600"
                >
                  {n.val}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={() => doInsert(false)}>insert random</Btn>
        <Btn tone="#f87171" onClick={() => doInsert(true)}>insert sorted (skew!)</Btn>
        <Btn variant="ghost" onClick={search}>search · O(h)</Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem]">{note}</p>
    </div>
  );
}
