import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#38e0d6";
let uid = 0;

export default function LinkedListViz() {
  const [nodes, setNodes] = useState(() =>
    [10, 20, 30].map((v) => ({ id: ++uid, v }))
  );
  const [hot, setHot] = useState([]); // ids being touched
  const [last, setLast] = useState("Singly linked list: each node holds a value and a pointer to the next.");

  function touch(ids, ms = 600) {
    setHot(ids);
    setTimeout(() => setHot([]), ms);
  }

  function prepend() {
    const v = Math.floor(Math.random() * 90 + 10);
    const node = { id: ++uid, v };
    setNodes((ns) => [node, ...ns]);
    touch([node.id, nodes[0]?.id].filter(Boolean));
    setLast(`prepend(${v}): point new node at old head, move head → O(1). No traversal needed.`);
  }

  function append() {
    const v = Math.floor(Math.random() * 90 + 10);
    const node = { id: ++uid, v };
    touch(nodes.map((n) => n.id));
    setNodes((ns) => [...ns, node]);
    setLast(
      `append(${v}): with only a head pointer you must walk all ${nodes.length} nodes to reach the tail → O(n). (Keep a tail pointer to make this O(1).)`
    );
  }

  function deleteHead() {
    if (!nodes.length) return;
    const removed = nodes[0];
    touch([removed.id, nodes[1]?.id].filter(Boolean));
    setTimeout(() => setNodes((ns) => ns.slice(1)), 200);
    setLast(`Delete head: move head to head.next → O(1). The old node is garbage-collected.`);
  }

  function deleteMiddle() {
    if (nodes.length < 2) return;
    const idx = Math.floor(nodes.length / 2);
    touch([nodes[idx - 1].id, nodes[idx].id, nodes[idx + 1]?.id].filter(Boolean));
    setTimeout(() => setNodes((ns) => ns.filter((_, i) => i !== idx)), 200);
    setLast(
      `Delete node at index ${idx}: rewire prev.next = node.next. The rewire is O(1), but finding the node first is O(n).`
    );
  }

  function reset() {
    setNodes([10, 20, 30].map((v) => ({ id: ++uid, v })));
    setLast("Reset.");
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-3 min-h-[5rem]">
        <Badge label="head" />
        {nodes.length === 0 && <span className="text-ink-faint font-mono text-sm ml-2">None (empty)</span>}
        {nodes.map((n, i) => {
          const active = hot.includes(n.id);
          return (
            <React.Fragment key={n.id}>
              <div
                className="flex-none flex rounded-md overflow-hidden font-mono text-sm transition-all duration-300"
                style={{
                  border: `1px solid ${active ? ACCENT : "rgba(255,255,255,0.16)"}`,
                  transform: active ? "translateY(-4px)" : "none",
                  boxShadow: active ? `0 0 0 2px color-mix(in srgb,${ACCENT} 35%,transparent)` : "none",
                }}
              >
                <span
                  className="px-3 py-2 font-semibold text-ink"
                  style={{ background: "color-mix(in srgb,#38e0d6 14%,#15171f)" }}
                >
                  {n.v}
                </span>
                <span className="px-2 py-2 text-ink-faint border-l border-line bg-surface">
                  {i === nodes.length - 1 ? "⌀" : "→"}
                </span>
              </div>
              {i < nodes.length - 1 && <span className="flex-none text-ink-faint px-0.5">→</span>}
            </React.Fragment>
          );
        })}
        {nodes.length > 0 && <span className="flex-none text-ink-faint font-mono text-xs ml-1">None</span>}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={prepend}>prepend · O(1)</Btn>
        <Btn tone="#fbbf24" onClick={append}>append · O(n)</Btn>
        <Btn variant="ghost" onClick={deleteHead}>delete head</Btn>
        <Btn variant="ghost" onClick={deleteMiddle}>delete middle</Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem]">{last}</p>
    </div>
  );
}

function Badge({ label }) {
  return (
    <span className="flex-none font-mono text-[10px] uppercase tracking-wider text-ink-faint border border-line-strong rounded px-1.5 py-1 mr-1">
      {label}
    </span>
  );
}
