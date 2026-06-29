import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Narrow vs wide transformations. Three input partitions each hold a few
 * key-records (keys A/B/C, colored). map/filter (narrow) keeps every record in
 * its own partition, 1:1, nothing crosses a partition boundary. groupByKey
 * (wide) redistributes records by hash of the key so all same-key records land
 * in one output partition, records move across partitions, which IS a shuffle.
 * No data, pure illustration.
 */
const ACCENT = "#ff8a3d";

const KEY_COLOR = {
  A: "#60a5fa", // blue
  B: "#4ade80", // green
  C: "#f472b6", // pink
};

// Three input partitions, each a mixed bag of keyed records.
const INPUT = [
  ["A", "B", "A"],
  ["C", "A", "C"],
  ["B", "C", "B"],
];

// hash(key) -> output partition. Keep it simple and deterministic: A->0, B->1, C->2.
const KEY_TO_OUT = { A: 0, B: 1, C: 2 };

function Cell({ k }) {
  const c = KEY_COLOR[k];
  return (
    <span
      className="inline-flex items-center justify-center font-mono text-[11px] font-bold rounded w-6 h-6"
      style={{
        color: c,
        background: `color-mix(in srgb, ${c} 16%, transparent)`,
        border: `1px solid color-mix(in srgb, ${c} 45%, transparent)`,
      }}
    >
      {k}
    </span>
  );
}

function Partition({ idx, records, label }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">
        {label} {idx}
      </div>
      <div className="flex flex-wrap gap-1.5 min-h-[1.75rem]">
        {records.length === 0 ? (
          <span className="font-mono text-[10px] text-ink-faint">(empty)</span>
        ) : (
          records.map((k, i) => <Cell key={i} k={k} />)
        )}
      </div>
    </div>
  );
}

export default function PartitionShuffleViz() {
  const [mode, setMode] = useState("narrow"); // "narrow" | "wide"

  // narrow: filter out key C (map/filter), each input partition maps 1:1 to its output.
  // wide:   groupByKey, every record re-routed to KEY_TO_OUT[key].
  let output;
  if (mode === "narrow") {
    output = INPUT.map((p) => p.filter((k) => k !== "C"));
  } else {
    output = [[], [], []];
    INPUT.forEach((p) => p.forEach((k) => output[KEY_TO_OUT[k]].push(k)));
  }

  const note =
    mode === "narrow"
      ? "filter keeps each record inside its own partition. No record crosses a boundary, so Spark fuses this into the SAME stage. Cheap, no network, no disk."
      : "groupByKey re-routes every record by hash(key), so all the A's, B's, C's regroup across partitions. Records cross the network, that IS a shuffle, and it opens a NEW stage.";

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* mode picker */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-mono text-[11px] text-ink-faint mr-1">transformation</span>
        <Btn variant={mode === "narrow" ? "solid" : "ghost"} tone={ACCENT} onClick={() => setMode("narrow")}>
          map / filter (narrow)
        </Btn>
        <Btn variant={mode === "wide" ? "solid" : "ghost"} tone={ACCENT} onClick={() => setMode("wide")}>
          groupByKey (wide)
        </Btn>
      </div>

      {/* input partitions */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">input</div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {INPUT.map((p, i) => (
          <Partition key={i} idx={i} records={p} label="part" />
        ))}
      </div>

      {/* the boundary marker */}
      <div className="flex items-center gap-2 my-2">
        <div className="flex-1 border-t border-dashed" style={{ borderColor: mode === "wide" ? ACCENT : "var(--color-line)" }} />
        <span
          className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            color: mode === "wide" ? ACCENT : "var(--color-ink-faint)",
            border: `1px solid ${mode === "wide" ? ACCENT : "var(--color-line)"}`,
          }}
        >
          {mode === "wide" ? "SHUFFLE · stage boundary · network + disk" : "no shuffle · same stage"}
        </span>
        <div className="flex-1 border-t border-dashed" style={{ borderColor: mode === "wide" ? ACCENT : "var(--color-line)" }} />
      </div>

      {/* output partitions */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">output</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {output.map((p, i) => (
          <Partition key={i} idx={i} records={p} label={mode === "wide" ? "by-key" : "part"} />
        ))}
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-3 font-mono text-[10px] text-ink-faint mb-2">
        {Object.entries(KEY_COLOR).map(([k, c]) => (
          <span key={k}>
            <span style={{ color: c }}>■</span> key {k}
          </span>
        ))}
      </div>

      <div className="font-mono text-[11px] text-ink-faint leading-relaxed">{note}</div>
    </div>
  );
}
