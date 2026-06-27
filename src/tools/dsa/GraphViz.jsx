import React, { useState, useRef } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#38e0d6";

let uid = 0;

/* ── Fixed undirected graph: 7 nodes (A–G) on a small canvas ───────
   Positions are hand-placed so edges don't overlap awkwardly.        */
const NODES = [
  { id: "A", x: 70, y: 60 },
  { id: "B", x: 200, y: 40 },
  { id: "C", x: 70, y: 180 },
  { id: "D", x: 200, y: 150 },
  { id: "E", x: 330, y: 70 },
  { id: "F", x: 330, y: 190 },
  { id: "G", x: 200, y: 250 },
];

const EDGES = [
  ["A", "B"],
  ["A", "C"],
  ["B", "D"],
  ["B", "E"],
  ["C", "D"],
  ["D", "G"],
  ["E", "F"],
  ["F", "G"],
];

/* Build an undirected adjacency list. Neighbours are sorted so BFS/DFS
   visitation order is deterministic. */
function buildAdj() {
  const adj = {};
  NODES.forEach((n) => (adj[n.id] = []));
  EDGES.forEach(([a, b]) => {
    adj[a].push(b);
    adj[b].push(a);
  });
  Object.keys(adj).forEach((k) => adj[k].sort());
  return adj;
}

const ADJ = buildAdj();
const POS = Object.fromEntries(NODES.map((n) => [n.id, n]));

/* Compute the full BFS step sequence from `start`.
   Each step records: the node just visited, the order list so far,
   and the queue contents (frontier) after that node was processed. */
function bfsSteps(start) {
  const visited = new Set([start]);
  const queue = [start];
  const steps = [];
  const order = [];
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const nb of ADJ[node]) {
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push(nb);
      }
    }
    steps.push({ node, order: [...order], frontier: [...queue] });
  }
  return steps;
}

/* Iterative DFS with an explicit stack. To make the visitation order
   match the natural recursion (smallest neighbour first), push
   neighbours in REVERSE-sorted order so the smallest is popped first. */
function dfsSteps(start) {
  const visited = new Set();
  const stack = [start];
  const steps = [];
  const order = [];
  while (stack.length) {
    const node = stack.pop();
    if (visited.has(node)) {
      steps.push({ node: null, order: [...order], frontier: [...stack] });
      continue;
    }
    visited.add(node);
    order.push(node);
    // push neighbours reversed so the smallest id is on top → popped next
    const nbs = ADJ[node].slice().reverse();
    for (const nb of nbs) {
      if (!visited.has(nb)) stack.push(nb);
    }
    steps.push({ node, order: [...order], frontier: [...stack] });
  }
  // drop the no-op (already-visited) frames for a clean narration
  return steps.filter((s) => s.node !== null);
}

export default function GraphViz() {
  const [start, setStart] = useState("A");
  const [mode, setMode] = useState(null); // 'BFS' | 'DFS' | null
  const [order, setOrder] = useState([]); // node ids visited so far
  const [current, setCurrent] = useState(null);
  const [frontier, setFrontier] = useState([]);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState(
    "An undirected graph stored as an adjacency list. Pick a start node, then run BFS or DFS to watch the visitation order."
  );
  const timers = useRef([]);

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  function run(kind) {
    clearTimers();
    const steps = kind === "BFS" ? bfsSteps(start) : dfsSteps(start);
    setMode(kind);
    setRunning(true);
    setOrder([]);
    setCurrent(null);
    setFrontier(kind === "BFS" ? [start] : [start]);
    setNote(
      kind === "BFS"
        ? `BFS(${start}): a QUEUE (FIFO) explores level by level, in an unweighted graph this finds the shortest path in edges.`
        : `DFS(${start}): a STACK (LIFO) dives as deep as possible before backtracking.`
    );

    steps.forEach((step, k) => {
      const t = setTimeout(() => {
        setCurrent(step.node);
        setOrder(step.order);
        setFrontier(step.frontier);
        const queueWord = kind === "BFS" ? "queue" : "stack";
        setNote(
          `${kind}(${start}) · step ${k + 1}/${steps.length}: visit ${step.node}. ${queueWord} now [${step.frontier.join(", ") || "∅"}]. order so far: ${step.order.join(" → ")}.`
        );
        if (k === steps.length - 1) {
          setRunning(false);
          setCurrent(null);
          setNote(
            `${kind}(${start}) done in ${steps.length} steps → O(V+E). Visitation order: ${step.order.join(" → ")}. ${
              kind === "BFS"
                ? "Because BFS expands the nearest frontier first, the order is by increasing distance from the start."
                : "DFS follows one branch to its end, then unwinds the stack to the next unexplored neighbour."
            }`
          );
        }
      }, k * 650);
      timers.current.push(t);
    });
  }

  function reset() {
    clearTimers();
    setMode(null);
    setOrder([]);
    setCurrent(null);
    setFrontier([]);
    setRunning(false);
    setNote("Reset. Pick a start node, then run BFS or DFS.");
  }

  const visitedIdx = Object.fromEntries(order.map((id, i) => [id, i]));
  const adjText = NODES.map((n) => `${n.id}: [${ADJ[n.id].join(", ")}]`).join("\n");

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 font-mono text-xs">
        <span className="text-ink-faint">V <span className="text-ink font-semibold">{NODES.length}</span></span>
        <span className="text-ink-faint">E <span className="text-ink font-semibold">{EDGES.length}</span></span>
        <span className="text-ink-faint">start <span className="text-ink font-semibold">{start}</span></span>
        <span className="text-ink-faint">
          {mode === "BFS" ? "queue" : mode === "DFS" ? "stack" : "frontier"}{" "}
          <span className="text-ink font-semibold">[{frontier.join(", ") || "∅"}]</span>
        </span>
      </div>

      <div className="md:flex md:gap-4 md:items-start mb-4">
        {/* Graph SVG */}
        <div className="overflow-x-auto">
          <svg width={400} height={300} className="block">
            {EDGES.map(([a, b]) => (
              <line
                key={a + b}
                x1={POS[a].x} y1={POS[a].y}
                x2={POS[b].x} y2={POS[b].y}
                stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"
              />
            ))}
            {NODES.map((n) => {
              const visited = n.id in visitedIdx;
              const isCurrent = current === n.id;
              const inFrontier = frontier.includes(n.id);
              const isStart = n.id === start;
              let fill = "#1c1f2a";
              let strokeC = "rgba(255,255,255,0.22)";
              if (isCurrent) {
                fill = ACCENT;
                strokeC = ACCENT;
              } else if (visited) {
                fill = "color-mix(in srgb,#38e0d6 30%,#15171f)";
                strokeC = ACCENT;
              } else if (inFrontier) {
                fill = "color-mix(in srgb,#fbbf24 22%,#15171f)";
                strokeC = "#fbbf24";
              } else if (isStart) {
                strokeC = "rgba(255,255,255,0.5)";
              }
              return (
                <g key={n.id} style={{ cursor: running ? "default" : "pointer" }}
                   onClick={() => !running && setStart(n.id)}>
                  <circle
                    cx={n.x} cy={n.y} r="18"
                    fill={fill} stroke={strokeC}
                    strokeWidth={isCurrent || visited ? 2 : 1.5}
                    style={{ transition: "fill .25s, stroke .25s" }}
                  />
                  <text
                    x={n.x} y={n.y + 4} textAnchor="middle"
                    fontSize="13" fontFamily="ui-monospace, monospace"
                    fill={isCurrent ? "#0c0e14" : "#eef1f7"} fontWeight="600"
                  >
                    {n.id}
                  </text>
                  {visited && (
                    <text
                      x={n.x + 16} y={n.y - 14} textAnchor="middle"
                      fontSize="10" fontFamily="ui-monospace, monospace"
                      fill={ACCENT} fontWeight="700"
                    >
                      {visitedIdx[n.id] + 1}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Adjacency list */}
        <div className="mt-3 md:mt-0 md:flex-1 min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1.5">
            adjacency list
          </div>
          <pre className="rounded-lg bg-[#0e1018] border border-line p-3 text-[12px] leading-relaxed font-mono text-ink overflow-x-auto whitespace-pre">
{adjText}
          </pre>
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mt-3 mb-1.5">
            visitation order
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[1.75rem]">
            {order.length === 0 ? (
              <span className="text-ink-faint text-sm font-mono">not started</span>
            ) : (
              order.map((id, i) => (
                <span
                  key={id}
                  className="font-mono text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ background: "color-mix(in srgb,#38e0d6 16%,#15171f)", color: "#eef1f7", border: `1px solid ${ACCENT}` }}
                >
                  {i + 1}. {id}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Start picker */}
      <div className="mb-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1.5">
          start node (click a node or pick here)
        </div>
        <div className="flex flex-wrap gap-2">
          {NODES.map((n) => (
            <button
              key={n.id}
              onClick={() => !running && setStart(n.id)}
              disabled={running}
              className="font-mono text-xs font-semibold w-8 h-8 rounded-md border transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
              style={
                start === n.id
                  ? { background: ACCENT, color: "#0c0e14", borderColor: ACCENT }
                  : { background: "transparent", color: "#aeb4c0", borderColor: "rgba(255,255,255,0.18)" }
              }
            >
              {n.id}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={() => run("BFS")} disabled={running}>BFS (queue) · O(V+E)</Btn>
        <Btn tone="#fbbf24" onClick={() => run("DFS")} disabled={running}>DFS (stack) · O(V+E)</Btn>
        <Btn variant="ghost" onClick={reset} disabled={running}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem]">{note}</p>
    </div>
  );
}
