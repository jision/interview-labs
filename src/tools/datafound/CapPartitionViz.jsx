import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * CAP-under-partition visualizer. Two replicas (Node A, Node B) hold the same
 * value (balance = 100). A button cuts the network link. Then a write arrives at
 * Node A and you choose how the system reacts:
 *   CP -> reject the write to stay consistent (unavailable for writes)
 *   AP -> accept the write, replicas DIVERGE, reconcile after healing
 * The point: under a partition you must choose Consistency OR Availability.
 */
const ACCENT = "#b388ff";
const OK = "#4ade80";
const BAD = "#f87171";
const WARN = "#fbbf24";

const INITIAL = 100;
const WRITE_VALUE = 120;

export default function CapPartitionViz() {
  // phase: "linked" -> "partitioned" -> "cp" | "ap"
  const [phase, setPhase] = useState("linked");

  const partitioned = phase !== "linked";
  const choseCP = phase === "cp";
  const choseAP = phase === "ap";

  // Node A value: AP accepts the write, everything else stays at 100.
  const valueA = choseAP ? WRITE_VALUE : INITIAL;
  // Node B never sees the write while partitioned, so it stays at 100.
  const valueB = INITIAL;
  const diverged = choseAP && valueA !== valueB;

  const linkState = !partitioned
    ? { label: "replication link: healthy", color: OK, dash: false }
    : { label: "replication link: CUT", color: BAD, dash: true };

  const reset = () => setPhase("linked");

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Btn
          tone={BAD}
          variant={partitioned ? "ghost" : "solid"}
          disabled={partitioned}
          onClick={() => setPhase("partitioned")}
        >
          {"⚡"} network partition
        </Btn>
        <Btn
          tone={OK}
          variant={choseCP ? "solid" : "ghost"}
          disabled={!partitioned || choseCP}
          onClick={() => setPhase("cp")}
        >
          CP: stay consistent
        </Btn>
        <Btn
          tone={WARN}
          variant={choseAP ? "solid" : "ghost"}
          disabled={!partitioned || choseAP}
          onClick={() => setPhase("ap")}
        >
          AP: stay available
        </Btn>
        <Btn tone={ACCENT} variant="ghost" onClick={reset}>
          {"↻"} heal / reset
        </Btn>
      </div>

      {/* the two nodes + the link between them */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
        {/* Node A, the one taking the write */}
        <NodeCard
          name="Node A"
          sub="write arrives here"
          value={valueA}
          tone={diverged ? WARN : ACCENT}
          highlight={partitioned}
        />

        {/* the link */}
        <div className="flex flex-col items-center justify-center min-w-[80px]">
          <div
            className="w-full h-0 border-t-2 mb-1"
            style={{
              borderColor: linkState.color,
              borderStyle: linkState.dash ? "dashed" : "solid",
            }}
          />
          {partitioned && (
            <div className="font-mono text-[18px] leading-none" style={{ color: BAD }} aria-hidden>
              {"✂"}
            </div>
          )}
          <div className="font-mono text-[9px] mt-1 text-center" style={{ color: linkState.color }}>
            {partitioned ? "CUT" : "replicating"}
          </div>
        </div>

        {/* Node B, the replica being read */}
        <NodeCard
          name="Node B"
          sub="a client reads here"
          value={valueB}
          tone={ACCENT}
          highlight={false}
        />
      </div>

      {/* the write attempt + outcome */}
      <div className="mt-4 rounded-lg border border-line bg-surface-2 p-3">
        <div className="font-mono text-[11px] text-ink-faint mb-1">
          while partitioned: write balance = {WRITE_VALUE} hits Node A
        </div>

        {!partitioned && (
          <div className="text-[13px] text-ink-dim leading-relaxed">
            Both replicas agree at {INITIAL}. Cut the link to force the CAP choice, you cannot have
            Consistency AND Availability once a partition happens.
          </div>
        )}

        {partitioned && !choseCP && !choseAP && (
          <div className="text-[13px] leading-relaxed" style={{ color: WARN }}>
            Partition is active. The write is in flight. Choose: reject it to stay consistent (CP), or
            accept it and let the replicas diverge (AP)?
          </div>
        )}

        {choseCP && (
          <div className="text-[13px] leading-relaxed">
            <span className="font-mono font-semibold" style={{ color: OK }}>
              CP, consistency over availability.
            </span>{" "}
            Node A <span style={{ color: BAD }}>REJECTS</span> the write (it cannot safely replicate, so it
            refuses to diverge). Writes are <span style={{ color: BAD }}>unavailable</span> during the
            partition, but a read on Node B is still correct at {INITIAL}. Think HBase, ZooKeeper, a single
            quorum RDBMS.
          </div>
        )}

        {choseAP && (
          <div className="text-[13px] leading-relaxed">
            <span className="font-mono font-semibold" style={{ color: WARN }}>
              AP, availability over consistency.
            </span>{" "}
            Node A <span style={{ color: OK }}>ACCEPTS</span> the write and now reads {WRITE_VALUE}, but
            Node B still reads {INITIAL}: the replicas have{" "}
            <span style={{ color: WARN }}>DIVERGED</span>. The system stayed up, but a read is now stale.
            After the link heals they must reconcile (last-write-wins, vector clocks, CRDTs). Think
            Dynamo, Cassandra, Riak.
          </div>
        )}
      </div>

      {/* the trade summary */}
      <div className="mt-3 font-mono text-[11px] text-ink-faint leading-relaxed">
        {diverged
          ? "Diverged replicas -> eventual consistency: available now, correct later, after reconciliation."
          : choseCP
          ? "Consistent but unavailable for writes -> strong consistency at the cost of uptime during the split."
          : "CA is not a real option in a distributed system: partitions happen, so you are always picking CP or AP."}
      </div>
    </div>
  );
}

function NodeCard({ name, sub, value, tone, highlight }) {
  return (
    <div
      className="rounded-lg border p-3 text-center transition-all"
      style={{
        borderColor: highlight ? tone : "var(--color-line)",
        background: `color-mix(in srgb, ${tone} ${highlight ? 10 : 5}%, transparent)`,
      }}
    >
      <div className="font-mono text-[12px] font-semibold" style={{ color: tone }}>
        {name}
      </div>
      <div className="font-mono text-[9px] text-ink-faint mb-2">{sub}</div>
      <div className="font-mono text-2xl font-bold" style={{ color: tone }}>
        {value}
      </div>
      <div className="font-mono text-[9px] text-ink-faint mt-0.5">balance</div>
    </div>
  );
}
