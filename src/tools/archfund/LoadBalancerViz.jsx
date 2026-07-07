import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * LoadBalancerViz, send requests across a pool of backends under three
 * algorithms (round-robin / least-connections / hash) and watch how the
 * distribution changes. Click a server to mark it unhealthy and see it drop
 * out of rotation. Self-contained, illustrative, no real data.
 */
const ACCENT = "#c9a23f";
const HIT = "#4ade80";

const ALGOS = [
  { id: "rr", label: "Round-robin" },
  { id: "lc", label: "Least-connections" },
  { id: "hash", label: "Hash (by client)" },
];

const ALGO_NOTE = {
  rr: "Rotate evenly through healthy backends, ignoring load. Simple and fair when every request costs about the same and every server is identical.",
  lc: "Send each request to the healthy backend holding the fewest in-flight connections. Self-corrects for uneven request durations, the safer default under mixed load.",
  hash: "Hash the client key to a backend so the same client keeps landing on the same server, useful for cache locality. Plain modulo remaps many keys when a server drops; consistent hashing moves only its share.",
};

const CLIENTS = ["c1", "c2", "c3", "c4", "c5"];
const INIT = [
  { id: "S1", healthy: true, handled: 0, load: 0 },
  { id: "S2", healthy: true, handled: 0, load: 0 },
  { id: "S3", healthy: true, handled: 0, load: 0 },
  { id: "S4", healthy: true, handled: 0, load: 0 },
];

function hashKey(k) {
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return h;
}

export default function LoadBalancerViz() {
  const [algo, setAlgo] = useState("rr");
  // one state object so a burst of sends threads state correctly through each hop
  const [sim, setSim] = useState(() => ({
    servers: INIT.map((s) => ({ ...s })),
    rrPtr: 0,
    reqNo: 0,
    last: null,
  }));
  const { servers, last, reqNo } = sim;

  const maxHandled = Math.max(1, ...servers.map((s) => s.handled));
  const maxLoad = Math.max(1, ...servers.map((s) => s.load));

  // pure: given the previous sim, route one request and return the next sim
  function routeOnce(prev) {
    const healthy = prev.servers.filter((s) => s.healthy);
    if (healthy.length === 0) {
      return { ...prev, last: { dropped: true } };
    }
    const n = prev.reqNo + 1;
    const client = CLIENTS[n % CLIENTS.length];
    const weight = 1 + Math.floor(Math.random() * 3); // request holds 1-3 connections

    let targetId;
    let nextPtr = prev.rrPtr;
    let reason;
    if (algo === "rr") {
      // advance from the pointer to the next healthy server
      for (let step = 0; step < prev.servers.length; step++) {
        const cand = prev.servers[(prev.rrPtr + step) % prev.servers.length];
        if (cand.healthy) {
          targetId = cand.id;
          nextPtr = (prev.rrPtr + step + 1) % prev.servers.length;
          break;
        }
      }
      reason = "next in rotation";
    } else if (algo === "lc") {
      let best = healthy[0];
      for (const s of healthy) if (s.load < best.load) best = s;
      targetId = best.id;
      reason = `fewest in-flight (${best.load})`;
    } else {
      const h = hashKey(client);
      targetId = healthy[h % healthy.length].id;
      reason = `hash(${client})`;
    }

    const servers = prev.servers.map((s) => {
      // every backend drains one connection per tick, so load stays dynamic
      let load = s.load > 0 ? s.load - 1 : 0;
      let handled = s.handled;
      if (s.id === targetId) {
        load += weight;
        handled += 1;
      }
      return { ...s, load, handled };
    });
    return {
      servers,
      rrPtr: nextPtr,
      reqNo: n,
      last: { dropped: false, reqNo: n, client, target: targetId, weight, reason, algo },
    };
  }

  function route() {
    setSim((prev) => routeOnce(prev));
  }

  function burst() {
    setSim((prev) => {
      let next = prev;
      for (let i = 0; i < 8; i++) next = routeOnce(next);
      return next;
    });
  }

  function toggle(id) {
    setSim((prev) => ({
      ...prev,
      servers: prev.servers.map((s) => (s.id === id ? { ...s, healthy: !s.healthy } : s)),
    }));
  }

  function reset() {
    setSim({ servers: INIT.map((s) => ({ ...s })), rrPtr: 0, reqNo: 0, last: null });
  }

  const healthyCount = servers.filter((s) => s.healthy).length;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* algorithm picker */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-mono text-[11px] text-ink-faint mr-1">algorithm</span>
        {ALGOS.map((a) => (
          <Btn key={a.id} variant={algo === a.id ? "solid" : "ghost"} tone={ACCENT} onClick={() => setAlgo(a.id)}>
            {a.label}
          </Btn>
        ))}
      </div>

      {/* the load balancer node */}
      <div className="rounded-lg border border-line-strong bg-surface-2 px-3 py-2 text-center mb-1">
        <span className="font-mono text-[12px] font-semibold" style={{ color: ACCENT }}>load balancer</span>
        <span className="font-mono text-[10px] text-ink-faint ml-2">
          {healthyCount} / {servers.length} healthy backends in rotation
        </span>
      </div>
      <div className="flex justify-center mb-1">
        <span className="font-mono text-[13px]" style={{ color: "var(--color-line-strong)" }}>│</span>
      </div>

      {/* backend pool */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {servers.map((s) => {
          const isTarget = last && !last.dropped && last.target === s.id;
          const border = !s.healthy ? "var(--color-line)" : isTarget ? HIT : "var(--color-line-strong)";
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className="rounded-lg border p-2.5 text-left transition-all duration-200"
              style={{
                borderColor: border,
                background: isTarget ? `color-mix(in srgb, ${HIT} 12%, transparent)` : "transparent",
                opacity: s.healthy ? 1 : 0.45,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[12px] font-semibold text-ink">{s.id}</span>
                <span
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded-full border"
                  style={{ color: s.healthy ? HIT : "#f87171", borderColor: s.healthy ? HIT : "#f87171" }}
                >
                  {s.healthy ? "UP" : "OUT"}
                </span>
              </div>
              {/* handled count bar */}
              <div className="font-mono text-[9px] text-ink-faint">handled {s.handled}</div>
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mt-0.5 mb-1.5">
                <div className="h-full transition-all duration-300" style={{ width: `${(s.handled / maxHandled) * 100}%`, background: ACCENT }} />
              </div>
              {/* active-load bar */}
              <div className="font-mono text-[9px] text-ink-faint">active load {s.load}</div>
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mt-0.5">
                <div className="h-full transition-all duration-300" style={{ width: `${(s.load / maxLoad) * 100}%`, background: "#60a5fa" }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="font-mono text-[9px] text-ink-faint mb-3">click any backend to flip it healthy or unhealthy</div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Btn tone={ACCENT} onClick={route}>send request</Btn>
        <Btn tone={ACCENT} variant="ghost" onClick={burst}>send 8</Btn>
        <Btn variant="ghost" onClick={reset}>{"↻"} reset</Btn>
        <span className="font-mono text-[10px] text-ink-faint ml-auto">{reqNo} sent</span>
      </div>

      {/* last routing decision */}
      <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 mb-3 min-h-[2.4rem] flex items-center">
        {!last ? (
          <span className="font-mono text-[11px] text-ink-faint">send a request to see where it lands</span>
        ) : last.dropped ? (
          <span className="font-mono text-[11px]" style={{ color: "#f87171" }}>
            no healthy backends: the request is dropped (the pool is down)
          </span>
        ) : (
          <span className="font-mono text-[11px] text-ink-dim">
            req #{last.reqNo} from <span style={{ color: ACCENT }}>{last.client}</span> {"→"}{" "}
            <span style={{ color: HIT }}>{last.target}</span>{" "}
            <span className="text-ink-faint">({last.reason}, weight {last.weight})</span>
          </span>
        )}
      </div>

      {/* algorithm explainer */}
      <div className="font-mono text-[11px] text-ink-faint leading-relaxed">{ALGO_NOTE[algo]}</div>
    </div>
  );
}
