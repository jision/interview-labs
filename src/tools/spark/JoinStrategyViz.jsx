import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Join strategy picker. A slider sets the SMALL table size in MB against a
 * fixed 50 GB big table. Below the broadcast threshold (10 MB, the default
 * spark.sql.autoBroadcastJoinThreshold) Spark picks a BROADCAST HASH JOIN:
 * ship the small table to every executor, NO shuffle of the big table. Above
 * it, a SORT-MERGE JOIN: both sides shuffled + sorted by key. Pure illustration.
 */
const ACCENT = "#ff8a3d";
const BROADCAST = "#4ade80";
const SORTMERGE = "#f472b6";

const THRESHOLD = 10; // MB, spark.sql.autoBroadcastJoinThreshold default
const BIG = "50 GB";

export default function JoinStrategyViz() {
  const [smallMb, setSmallMb] = useState(8);
  const isBroadcast = smallMb <= THRESHOLD;
  const tone = isBroadcast ? BROADCAST : SORTMERGE;

  const diagram = isBroadcast
    ? `small table (${smallMb} MB)
   |
   +-- copy --> executor 1   [ build hash table, probe big partition ]
   +-- copy --> executor 2   [ build hash table, probe big partition ]
   +-- copy --> executor 3   [ build hash table, probe big partition ]

big table (${BIG})  stays put, NO shuffle. Each executor joins its
own partitions locally against the broadcast copy.`
    : `small table (${smallMb} MB)            big table (${BIG})
   |  shuffle by key                  |  shuffle by key
   v                                  v
 +-----------+   sort by key   +-----------+
 | repart'd  | --------------> | repart'd  |   then merge matching
 | + sorted  |                 | + sorted  |   keys side by side
 +-----------+                 +-----------+

BOTH sides cross the network and sort. The expensive path.`;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* slider */}
      <div className="flex justify-between font-mono text-[11px] mb-1">
        <span className="text-ink-dim">small table size</span>
        <span style={{ color: tone }}>{smallMb} MB</span>
      </div>
      <input
        type="range"
        min={1}
        max={200}
        step={1}
        value={smallMb}
        onChange={(e) => setSmallMb(parseInt(e.target.value, 10))}
        className="w-full"
        style={{ accentColor: tone }}
      />
      <div className="flex justify-between font-mono text-[10px] text-ink-faint mt-1 mb-3">
        <span>1 MB</span>
        <span style={{ color: ACCENT }}>threshold = {THRESHOLD} MB</span>
        <span>200 MB</span>
      </div>

      {/* chosen strategy banner */}
      <div
        className="rounded-lg p-3 mb-3"
        style={{
          background: `color-mix(in srgb, ${tone} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${tone} 45%, transparent)`,
        }}
      >
        <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: tone }}>
          Spark picks
        </div>
        <div className="text-sm font-bold" style={{ color: tone }}>
          {isBroadcast ? "BROADCAST HASH JOIN" : "SORT-MERGE JOIN"}
        </div>
        <div className="text-[12px] text-ink-dim leading-snug mt-1">
          {isBroadcast
            ? `small side (${smallMb} MB) <= ${THRESHOLD} MB threshold, so ship it to every executor and skip shuffling the ${BIG} table entirely.`
            : `small side (${smallMb} MB) > ${THRESHOLD} MB threshold, so both tables are shuffled and sorted by the join key.`}
        </div>
      </div>

      {/* what moves */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">what moves</div>
      <pre className="rounded-lg border border-line bg-[#0e1018] p-3 overflow-x-auto text-[11px] leading-[1.6] font-mono text-ink-dim mb-3">
        {diagram}
      </pre>

      {/* cost grid */}
      <div className="grid sm:grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg border border-line bg-surface-2 p-2.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">network cost</div>
          <div className="text-[12px] text-ink-dim leading-snug">
            {isBroadcast
              ? `~${smallMb} MB sent to each executor. The ${BIG} never moves.`
              : `the full ${BIG} plus the small side both cross the network.`}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-2.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">stages</div>
          <div className="text-[12px] text-ink-dim leading-snug">
            {isBroadcast
              ? "no shuffle stage on the big side, fastest when one side is small."
              : "a shuffle + sort stage on both sides, the default for two large tables."}
          </div>
        </div>
      </div>

      <div className="font-mono text-[11px] text-ink-faint leading-relaxed">
        AQE can also flip a planned sort-merge join to a broadcast at runtime if the actual shuffled side turns out
        small enough, you do not always have to pick this up front.
      </div>
    </div>
  );
}
