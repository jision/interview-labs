import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * API-style selector. Toggle the requirements that describe the boundary and
 * see whether REST, gRPC, or GraphQL is the natural fit, plus a one-line why.
 * Illustrative only, real systems mix styles (REST at the edge, gRPC between
 * services). ACCENT #8b7cff.
 */
const ACCENT = "#8b7cff";

const REQS = [
  { id: "publicApi", label: "Public / partner API" },
  { id: "internal", label: "Internal service-to-service" },
  { id: "clientShaping", label: "Client shapes its own payload" },
  { id: "streaming", label: "Streaming / bidirectional" },
  { id: "polyglot", label: "Polyglot services" },
];

const STYLE_TONE = {
  REST: "#4ade80",
  gRPC: "#8b7cff",
  GraphQL: "#f472b6",
};

function recommend(s) {
  if (s.clientShaping)
    return {
      style: "GraphQL",
      why: "Many clients each need a different slice of one graph, so let each client request exactly the fields it wants and kill over- and under-fetching.",
    };
  if (s.streaming)
    return {
      style: "gRPC",
      why: "HTTP/2 gives real bidirectional streaming under a typed contract. For a browser edge, expose it through grpc-web, SSE, or WebSockets.",
    };
  if (s.internal)
    return {
      style: "gRPC",
      why: s.polyglot
        ? "East-west calls across languages: one protobuf contract generates a client for every service, with binary framing and low latency."
        : "Internal east-west calls want low latency, HTTP/2 multiplexing, and generated clients from a protobuf contract.",
    };
  if (s.publicApi)
    return {
      style: "REST",
      why: "The widest-reach boundary: ubiquitous tooling, HTTP caching and CDNs, browser-native, and self-describing with OpenAPI.",
    };
  return {
    style: "REST",
    why: "The safe default boundary, cacheable and browser-native. Reach for gRPC or GraphQL only when a requirement pushes you there.",
  };
}

export default function ApiStyleSelectorViz() {
  const [sel, setSel] = useState({
    publicApi: false,
    internal: false,
    clientShaping: false,
    streaming: false,
    polyglot: false,
  });

  const toggle = (id) => setSel((s) => ({ ...s, [id]: !s[id] }));
  const rec = recommend(sel);
  const tone = STYLE_TONE[rec.style];
  const conflict = sel.publicApi && sel.internal;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* requirement toggles */}
      <div className="font-mono text-[11px] text-ink-faint mb-2">
        toggle the requirements that describe this boundary
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {REQS.map((r) => (
          <Btn
            key={r.id}
            variant={sel[r.id] ? "solid" : "ghost"}
            tone={ACCENT}
            onClick={() => toggle(r.id)}
          >
            {r.label}
          </Btn>
        ))}
      </div>

      {/* recommendation */}
      <div
        className="rounded-lg border p-4"
        style={{
          borderColor: tone,
          background: `color-mix(in srgb, ${tone} 8%, transparent)`,
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            recommended
          </span>
          <span className="font-mono text-lg font-bold" style={{ color: tone }}>
            {rec.style}
          </span>
        </div>
        <p className="text-[13px] text-ink-dim leading-relaxed">{rec.why}</p>
      </div>

      {conflict && (
        <div className="mt-3 font-mono text-[11px] text-ink-faint leading-relaxed">
          You picked both a public boundary and internal calls. Real systems usually run REST at the edge
          and gRPC between services, one style per boundary, not one style for everything.
        </div>
      )}
      {!sel.publicApi && !sel.internal && !sel.clientShaping && !sel.streaming && !sel.polyglot && (
        <div className="mt-3 font-mono text-[11px] text-ink-faint leading-relaxed">
          Nothing selected yet. With no special pressure, REST is the boring-and-correct default.
        </div>
      )}
    </div>
  );
}
