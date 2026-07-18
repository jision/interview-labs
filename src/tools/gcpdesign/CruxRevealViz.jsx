import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * CruxRevealViz, a design-drill for the ten GCP System Design sheets.
 * Pick a design, then reveal three stages in order, requirements & scale,
 * the crux decisions, the failure modes, saying your own answer OUT LOUD
 * before each reveal. Switching designs resets the reveal. Self-contained,
 * hand-authored content, no external data.
 */
const ACCENT = "#EA4335";

const DESIGNS = [
  {
    id: "telemetry",
    label: "Telemetry (Monarch)",
    system: "Monarch",
    stages: [
      {
        label: "requirements & scale",
        body: "Planet-scale metrics: millions of time series written per second, sub-second dashboard and alert queries, and it must keep serving even when a whole region is gone. The number that drives the design is series cardinality (labels times tasks), not raw request QPS.",
      },
      {
        label: "the crux decisions",
        body: "Regionalized zonal leaves hold recent data in memory, with no Colossus or Spanner in the write path, so ingest survives dependency loss. Global query and config planes can fail while zones keep serving stale data. Hierarchical mixers push queries down root to zone to leaf. Per-tenant ingest and query quotas. Cardinality is the sizing variable.",
      },
      {
        label: "the failure modes",
        body: "Cardinality explosion is the number-one killer: one unbounded label multiplies the series count. Circular dependency: the monitoring system must not depend on what it monitors. A slow or unreachable zone triggers zone pruning and stale-replica reads instead of blocking the whole query.",
      },
    ],
  },
  {
    id: "ratelimiter",
    label: "Rate limiter (Doorman)",
    system: "Doorman + SRE overload handling",
    stages: [
      {
        label: "requirements & scale",
        body: "Enforce a global QPS cap across thousands of client tasks in many regions, adding almost no latency, fair across tenants, and still correct when the limiter itself is unreachable. The sizing variable is enforcement granularity: global versus local.",
      },
      {
        label: "the crux decisions",
        body: "Local per-task token buckets are cheap and add no network latency but cannot enforce a global cap. Doorman leases global capacity to clients; the common hybrid shards a global budget into local buckets and rebalances periodically. Token bucket (bursty) versus sliding window (precise) versus leaky bucket (smooth). Client-side adaptive throttling rejects locally before spending the network. Criticality classes give fairness.",
      },
      {
        label: "the failure modes",
        body: "The central counter is a hot SPOF: fail open to local caps rather than block all traffic. Window-boundary bursts and clock skew let roughly 2x through at the edges. Retry amplification multiplies offered load, so you need retry budgets and backoff.",
      },
    ],
  },
  {
    id: "logsearch",
    label: "Multi-tenant log search",
    system: "index + tiered storage",
    stages: [
      {
        label: "requirements & scale",
        body: "Multi-tenant log ingest and search: high-throughput append writes, interactive full-text and aggregation queries over time ranges, hard per-tenant isolation, and cheap long retention. Sizing variables: write throughput versus query fan-out, and field cardinality.",
      },
      {
        label: "the crux decisions",
        body: "Separate the append ingest path from the query path. Index strategy: inverted index for full-text, columnar for aggregations, index selected fields but keep the raw payload cheap. Time-partitioned segments so queries prune by time. Retention tiering hot to warm to cold (object store). Per-tenant quotas plus query admission and cost caps. Scatter-gather fan-out with time pruning.",
      },
      {
        label: "the failure modes",
        body: "A hot tenant causes ingest backpressure and head-of-line blocking: use per-tenant queues and load shedding. Unbounded expensive queries need admission control, timeouts, and cost caps. A high-cardinality field can blow up the index mapping.",
      },
    ],
  },
  {
    id: "scheduler",
    label: "Batch scheduler (Borg)",
    system: "Borg / Omega",
    stages: [
      {
        label: "requirements & scale",
        body: "Schedule millions of tasks across tens of thousands of machines: high scheduling throughput, high utilization, honor priority and quota, and survive master failover. Sizing variables: the size of the pending queue and how many machines you score per decision.",
      },
      {
        label: "the crux decisions",
        body: "Centralized versus two-level or optimistic (Omega). Throughput comes from score caching, equivalence classes, and relaxed randomized machine selection, do not score every machine. Bin-packing: pack for utilization versus spread for fault tolerance, multi-dimensional resources, over-commit plus reclamation. Priority, preemption, and quota (prod evicts batch). Backup or speculative tasks handle stragglers. A Paxos-replicated master store survives failover.",
      },
      {
        label: "the failure modes",
        body: "Scheduling-throughput collapse and head-of-line blocking when millions are pending: shard the scheduler and cache scores. Preemption storms and priority inversion. Resource fragmentation and stragglers that stall a job.",
      },
    ],
  },
  {
    id: "config",
    label: "Config service (Chubby)",
    system: "Chubby + Paxos",
    stages: [
      {
        label: "requirements & scale",
        body: "A service for small, critical, strongly-consistent state, locks, leader election, and config, that many clients read constantly and rarely write, and that must stay correct across failure domains. Sizing variable: the read-to-write ratio (reads dominate) and a deliberately small cell.",
      },
      {
        label: "the crux decisions",
        body: "Consensus for critical state: Paxos or Raft quorum, a small odd cell spread across failure domains, leader-based writes, reads scaled with leases and observers. Watch and notify plus client caching (invalidations, not polling), coarse-grained locks, and session leases. Fencing tokens or generation numbers so a paused ex-holder cannot corrupt state. Linearizable writes versus stale local reads; versioned, canaried, atomic config swaps. Keep the consensus group small; bulk data lives elsewhere.",
      },
      {
        label: "the failure modes",
        body: "Split-brain and dual leaders without fencing tokens. The config service becomes a global SPOF, with a watch-herd (thundering herd) on failover. Stale or partitioned reads returning old state.",
      },
    ],
  },
  {
    id: "objstore",
    label: "Object metadata (Colossus)",
    system: "Colossus (GFS successor)",
    stages: [
      {
        label: "requirements & scale",
        body: "The metadata and control plane for an exabyte object store: billions to trillions of objects, high metadata ops per second, durable and cheap, and no single metadata bottleneck (the GFS single-master limit). Sizing variable: objects and metadata ops per byte, the small-file problem.",
      },
      {
        label: "the crux decisions",
        body: "Split the control plane (curators) from the data plane: clients ask a curator to open, create, or delete, then stream bytes directly to D chunkservers, with no metadata server in the byte path. Metadata lives in a sharded LSM key-value store (BigTable-like), giving roughly 100x GFS scale. LSM (write-optimized, compaction) versus B-tree (read and update). Pack and batch small files and shard the namespace. Reed-Solomon erasure coding versus triple replication (cost versus recovery I/O). Background rebalancing and reconstruction.",
      },
      {
        label: "the failure modes",
        body: "A namespace or metadata hotspot from sequential-prefix keys or one hot directory. Small-file explosion overwhelming the metadata store. Correlated failures beyond the erasure stripe width, which lose data.",
      },
    ],
  },
  {
    id: "dataproc",
    label: "Petabyte processing (Dataflow)",
    system: "Dataflow / Beam, MillWheel",
    stages: [
      {
        label: "requirements & scale",
        body: "Petabyte batch plus low-latency streaming in one model: correct results on out-of-order data, exactly-once outputs, autoscaling, and straggler tolerance. Sizing variables: shuffle volume and key skew, and watermark and state size.",
      },
      {
        label: "the crux decisions",
        body: "Unified batch and stream via the what/where/when/how model: windowing, event-time versus processing-time, watermarks, triggers, accumulation. Exactly-once via idempotent writes plus dedup (MillWheel record IDs plus strongly-consistent state) and checkpointing. Late and out-of-order data via watermarks plus allowed lateness; dynamic work rebalancing for stragglers. Storage: Bigtable (LSM, wide-column, high-throughput, row-atomic) versus Spanner (TrueTime, external consistency, global transactions). Shuffle is the bottleneck, so fuse stages, lift combiners, and autoscale.",
      },
      {
        label: "the failure modes",
        body: "Data skew and hot keys in the shuffle, which make one straggler stall the stage. A stuck watermark or unbounded state (late data, session windows) that grows memory without bound. Duplicates or loss without idempotent sinks and aligned checkpoints.",
      },
    ],
  },
  {
    id: "migration",
    label: "Zero-downtime migration",
    system: "expand/contract, CDC",
    stages: [
      {
        label: "requirements & scale",
        body: "Move a live datastore, often cross-region, with zero downtime, zero data loss, and a working rollback. Sizing variables: the write rate during the migration and the replication lag at cutover.",
      },
      {
        label: "the crux decisions",
        body: "Expand/contract (parallel change): additive or nullable schema, then dual-write, then backfill, then verify, then contract. Dual-write (simple, non-atomic, diverges on partial failure) versus log-based CDC (atomic-ish, decouples apps, adds lag); often CDC for the bulk plus dual-write in the cutover window. Bounded-rate, chunked, idempotent, resumable backfill. Reconciliation on row counts, checksums, business invariants, and shadow reads; block cutover until mismatches are zero and lag goes to zero. A brief read-only freeze and a flag or route flip, keeping reverse replication for rollback.",
      },
      {
        label: "the failure modes",
        body: "Dual-write divergence on partial failure. Replication lag at cutover that loses writes or breaks read-after-write. No rollback path, and a backfill that overloads the source.",
      },
    ],
  },
  {
    id: "inference",
    label: "Multi-tenant LLM inference",
    system: "vLLM / Orca, JetStream on TPU",
    stages: [
      {
        label: "requirements & scale",
        body: "Multi-tenant LLM serving on scarce accelerators: meet TTFT and TPOT SLOs per tenant, keep GPU or TPU utilization high, isolate tenants fairly, and serve many models and adapters. The sizing variable is KV-cache memory (context length times concurrency), not CPU.",
      },
      {
        label: "the crux decisions",
        body: "Iteration-level continuous batching: new requests join the running batch each decode step, and the scheduler is the core of the system. KV-cache memory management: PagedAttention non-contiguous blocks (near-zero fragmentation), prefix and prompt caching to reuse shared system prompts, and chunked prefill. Admission control plus SLO classes: prefill is compute-bound (TTFT), decode is memory-bandwidth-bound (TPOT). Model routing by model, size, or LoRA adapter; disaggregated prefill and decode; multi-host sharding. Autoscale on KV-cache utilization, queue depth, and batch fullness, not CPU; warm pools cover cold-start.",
      },
      {
        label: "the failure modes",
        body: "KV-cache OOM and preemption thrash, with head-of-line blocking behind long generations. Noisy neighbor: one tenant's huge context starves the others. Cold-start and autoscale lag under accelerator scarcity, which blows the TTFT SLO.",
      },
    ],
  },
  {
    id: "residency",
    label: "Residency-aware alerting",
    system: "Assured Workloads, EU Data Boundary",
    stages: [
      {
        label: "requirements & scale",
        body: "Alerting for a regulated tenant, say EU: telemetry and PII must stay in-region, alerts must keep firing even if the global control plane is down, and failover must never leave the compliant boundary. Sizing variable: what data is residency-bound versus safe to aggregate globally.",
      },
      {
        label: "the crux decisions",
        body: "Split control-plane residency from data-plane residency: a global control and config plane, a regional data plane that keeps telemetry and PII in-region, enforced by org-policy and data-boundary constraints (Assured Workloads, EU Data Boundary). Regional isolation of storage, processing, and operator access (access justifications). Residency-safe failover: EU to EU only, never to a non-compliant region. Evaluate alert rules in-region; aggregate only non-residency metadata globally.",
      },
      {
        label: "the failure modes",
        body: "A residency violation or exfiltration during cross-region failover or global aggregation. A global control-plane outage that silences regional alerting unless regions alert autonomously. Cross-region split-brain producing duplicate or missed alerts.",
      },
    ],
  },
];

export default function CruxRevealViz() {
  const [designId, setDesignId] = useState(DESIGNS[0].id);
  const [shown, setShown] = useState(0);

  const design = DESIGNS.find((d) => d.id === designId) || DESIGNS[0];
  const next = shown < design.stages.length ? design.stages[shown] : null;

  function pick(id) {
    setDesignId(id);
    setShown(0);
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* design picker */}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">
        pick a design, then reveal the three stages
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {DESIGNS.map((d) => {
          const on = d.id === designId;
          return (
            <button
              key={d.id}
              onClick={() => pick(d.id)}
              className="font-mono text-[11px] font-semibold px-2.5 py-1.5 rounded-md border transition-all select-none"
              style={
                on
                  ? {
                      borderColor: ACCENT,
                      color: ACCENT,
                      background: "color-mix(in srgb, " + ACCENT + " 12%, transparent)",
                    }
                  : { borderColor: "var(--color-line)", color: "var(--color-ink-faint)" }
              }
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* selected design header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <span className="text-sm font-semibold text-ink">{design.label}</span>
        <span className="font-mono text-[10px] text-ink-faint">
          reference system: <span style={{ color: ACCENT }}>{design.system}</span>
        </span>
      </div>

      {/* revealed stages */}
      {shown > 0 && (
        <div className="space-y-3 mb-4">
          {design.stages.slice(0, shown).map((s, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface-2 p-3.5">
              <div
                className="font-mono text-[10px] uppercase tracking-wider mb-1.5"
                style={{ color: ACCENT }}
              >
                stage {i + 1} · {s.label}
              </div>
              <div className="text-sm text-ink-dim leading-relaxed">{s.body}</div>
            </div>
          ))}
        </div>
      )}

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2">
        {next ? (
          <Btn tone={ACCENT} onClick={() => setShown((n) => n + 1)}>
            reveal {next.label}
          </Btn>
        ) : (
          <span className="font-mono text-[11px] text-ink-faint">
            all three stages revealed, now say the whole sheet out loud once
          </span>
        )}
        <Btn variant="ghost" disabled={shown >= design.stages.length} onClick={() => setShown(design.stages.length)}>
          reveal all
        </Btn>
        <Btn variant="ghost" disabled={shown === 0} onClick={() => setShown(0)}>
          reset
        </Btn>
      </div>
      {next && (
        <div className="mt-3 font-mono text-[10px] text-ink-faint">
          say your answer out loud before you reveal, that is the whole drill
        </div>
      )}
    </div>
  );
}
