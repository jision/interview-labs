import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import BatchStreamingDecoderViz from "./dataarch/BatchStreamingDecoderViz.jsx";
import ClusterSizingViz from "./dataarch/ClusterSizingViz.jsx";
import PipelineCostViz from "./dataarch/PipelineCostViz.jsx";

const ACCENT = "#f25f9c";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "archstyles", label: "Batch, streaming, Lambda & Kappa", group: "Pipeline design" },
  { id: "ingestiondesign", label: "Ingestion & the medallion flow", group: "Pipeline design" },
  { id: "idempotency", label: "Idempotency, backfills & reprocessing", group: "Pipeline design" },
  { id: "sizing", label: "Sizing an EMR / Spark cluster", group: "Sizing & cost" },
  { id: "cost", label: "Cost optimization", group: "Sizing & cost" },
  { id: "filelayout", label: "File layout & the small-files problem", group: "Sizing & cost" },
  { id: "buildbuy", label: "EMR vs Glue vs Databricks vs Snowflake", group: "Judgment" },
  { id: "governance", label: "Governance, lineage & Lake Formation", group: "Judgment" },
  { id: "numbers", label: "Numbers a data architect knows", group: "Judgment" },
];

/* ── Batch, streaming, Lambda & Kappa ─────────────────────────── */
function ArchStyles() {
  return (
    <>
      <Lede>
        The first senior call on any pipeline is its <em>shape</em>: bounded batch on a schedule, or an
        unbounded stream you process as it arrives. Everything downstream, the engine, the cost, the
        on-call load, follows from that choice. The interview wants you to default to batch and only buy
        the complexity of streaming when a real latency target forces it.
      </Lede>

      <Block eyebrow="the two primitives" title="Batch vs streaming">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Batch</strong> processes a <em>bounded</em> dataset, yesterday's files, last hour's
          partition, on a schedule. <strong>Streaming</strong> processes an <em>unbounded</em> sequence of
          events as they land, holding state across time. The trade is latency against simplicity.
        </p>
        <OpTable
          cols={["Property", "Batch", "", "Streaming"]}
          rows={[
            { op: "Data", avg: "bounded, finite", avgTone: "good", why: "Streaming is unbounded and never 'done', it runs forever." },
            { op: "Latency", avg: "minutes to hours", avgTone: "ok", why: "Streaming is sub-second to seconds, that is the whole reason to pay for it." },
            { op: "Throughput / cost", avg: "highest, cheapest", avgTone: "good", why: "Big sequential reads amortize well; streaming pays for an always-on engine." },
            { op: "Reprocessing", avg: "trivial, re-run the job", avgTone: "good", why: "Streaming reprocessing means replaying a log or carrying a parallel batch path." },
            { op: "Operational load", avg: "low, it is a cron", avgTone: "good", why: "Streaming is a 24/7 service with state, watermarks, and back-pressure to babysit." },
          ]}
        />
        <Callout kind="tip" title="Default to batch">
          Most 'real-time' requirements survive a 5 to 15 minute SLA, which a scheduled or micro-batch
          job serves at a fraction of the cost and on-call burden. Make streaming justify itself with a
          concrete latency number, not a vibe.
        </Callout>
      </Block>

      <Block eyebrow="micro-batch, the middle ground" title="Structured Streaming is batch in disguise">
        <p className="text-ink-dim leading-relaxed mb-2">
          Spark <strong>Structured Streaming</strong> is <em>micro-batch</em>: it runs tiny batches every
          few seconds over the new data since the last checkpoint. You get minutes-or-better latency on an
          unbounded source while reusing one engine, one codebase, and the same DataFrame API as your
          batch jobs. For genuine record-at-a-time, single-digit-millisecond work you reach for{" "}
          <strong>Flink</strong> instead.
        </p>
        <Callout kind="note" title="One engine, two modes">
          The pragmatic senior answer to 'do we need streaming?' is usually 'micro-batch'. It covers the
          vast middle ground, fresh-enough data without standing up a separate real-time stack.
        </Callout>
      </Block>

      <Block eyebrow="serving both at once" title="Lambda architecture">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Lambda</strong> runs two layers in parallel. A <strong>batch layer</strong> recomputes
          accurate, complete results over all history; a <strong>speed layer</strong> processes the recent
          stream for low latency. The serving layer <em>merges</em> them, fresh-but-approximate from the
          speed layer plus correct-but-delayed from the batch layer.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`               +-----------------------------+
events  ---->  | batch layer  (accurate, slow)| --+
   |           +-----------------------------+   |
   |                                             v
   +-------->  +-----------------------------+   merge  ->  serve / query
               | speed layer  (fast, approx) | --+
               +-----------------------------+

   downside: TWO codebases computing the same thing, kept in sync forever`}
        />
        <Callout kind="trap" title="The cost is two codebases">
          Lambda's accuracy-plus-latency is real, but you maintain batch and streaming implementations of
          the same logic and reconcile them. That duplication is the recurring complaint, and the reason
          Kappa exists.
        </Callout>
      </Block>

      <Block eyebrow="one pipeline, replay to fix" title="Kappa architecture">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Kappa</strong> drops the batch layer entirely: there is <em>one</em> streaming pipeline.
          To reprocess history, fix a bug, recompute a metric, you <strong>replay the log</strong> (Kafka,
          Kinesis) from the start through the same code. One codebase, but it leans on a durable,
          replayable log and on streaming infra you can actually operate.
        </p>
        <OpTable
          cols={["Architecture", "Codebases", "", "Reprocessing"]}
          rows={[
            { op: "Lambda", avg: "two (batch + speed)", avgTone: "bad", why: "Batch layer gives accuracy and easy recompute; price is duplicated logic." },
            { op: "Kappa", avg: "one (stream only)", avgTone: "good", why: "Reprocess by replaying the retained log through the same pipeline. Simpler, if you can run streaming well." },
          ]}
        />
        <Callout kind="tip" title="Kappa needs a durable log and streaming muscle">
          Kappa is cleaner on paper, but it assumes your event log is retained long enough to replay and
          that the team can run a streaming engine confidently. Without both, a batch path is the safer
          source of truth.
        </Callout>
      </Block>

      <Block eyebrow="pick one live" title="Decode the pipeline shape">
        <p className="text-ink-dim leading-relaxed mb-3">
          Walk the four levers, freshness, reprocessing, data shape, ops appetite, and watch the
          recommendation move. This is the reasoning you say out loud.
        </p>
        <Try label="batch vs streaming decoder">
          <BatchStreamingDecoderViz />
        </Try>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "I start by asking for a latency number. Batch is bounded, simplest, highest throughput, and
          reprocessing is just a re-run, so I default to it. Spark Structured Streaming gives me
          micro-batch in the same engine when I need minutes, and I only reach for Flink at
          record-at-a-time. When I genuinely need both low latency and a clean source of truth I'll
          consider Lambda, a batch layer for accuracy plus a speed layer merged at serve, but I call out
          its cost, two codebases. Kappa collapses that to one streaming pipeline and reprocesses by
          replaying the log, which I prefer when we have a durable log and can run streaming well."
        </Callout>
      </Block>
    </>
  );
}

/* ── Ingestion & the medallion flow ───────────────────────────── */
function IngestionDesign() {
  return (
    <>
      <Lede>
        Asked to 'design a pipeline', you draw the same backbone every time: sources land raw, then get
        promoted through cleaning and conforming stages until they are query-ready. The medallion
        (bronze/silver/gold) flow is the vocabulary, and the senior signal is handling incremental loads,
        late data, and schema change at the boundaries rather than full-reloading everything.
      </Lede>

      <Block eyebrow="draw it first" title="The reference pipeline">
        <p className="text-ink-dim leading-relaxed mb-2">
          Whiteboard this left to right before saying anything else. Sources feed an ingest layer, which
          lands raw data on S3, and Spark on EMR promotes it through three zones to a serving surface.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`SOURCES        INGEST                 LAKE (S3)                  SERVE
+--------+   +-------------+   +--------+--------+--------+   +----------+
| apps   |   | Kinesis/MSK |   | BRONZE | SILVER | GOLD   |   | Athena   |
| DBs    |-->| Firehose    |-->|  raw   |  clean |  agg / |-->| Redshift |
| files  |   | DMS / batch |   |  append| conform| marts  |   | BI / ML  |
+--------+   +-------------+   +--------+--------+--------+   +----------+
                                   ^         Spark / EMR transforms
                                   |
                          land exactly as received (replayable)`}
        />
        <OpTable
          cols={["Zone", "Holds", "", "Rule"]}
          rows={[
            { op: "Bronze (raw)", avg: "source data, as-is", avgTone: "ok", why: "Append-only, immutable, partitioned by load date. Your replay source; never edit it." },
            { op: "Silver (clean)", avg: "deduped, typed, conformed", avgTone: "good", why: "Validated, schema-enforced, joined to reference data. The trustworthy base tables." },
            { op: "Gold (curated)", avg: "aggregates, marts, features", avgTone: "good", why: "Business-level tables shaped for BI, reporting, and ML. Fast to query." },
          ]}
        />
        <Callout kind="note" title="Why land raw first">
          Bronze is cheap insurance: if a transform has a bug, you reprocess from immutable raw instead of
          re-pulling from the source, which may not even keep history. Decoupling ingest from transform is
          the whole point.
        </Callout>
      </Block>

      <Block eyebrow="don't reload the world" title="Incremental loads & high-water marks">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>full reload</strong> re-reads the entire source every run, simple but it does not scale
          and it hammers the source. <strong>Incremental</strong> loads pull only what changed since last
          time, tracked by a <strong>high-water mark</strong>: the max{" "}
          <code className="font-mono">updated_at</code> or monotonic id you have ingested so far. Next run
          you ask the source for rows beyond that mark.
        </p>
        <OpTable
          cols={["Strategy", "Reads", "", "When"]}
          rows={[
            { op: "Full reload", avg: "everything, every run", avgTone: "bad", why: "Small/slowly-changing dimensions, or when there is no reliable change column. Easy, does not scale." },
            { op: "Incremental (watermark)", avg: "rows past the high-water mark", avgTone: "good", why: "Append-heavy fact tables with an updated_at / sequence. The default for large sources." },
            { op: "CDC (change data capture)", avg: "inserts/updates/deletes from the log", avgTone: "good", why: "Via DMS / Debezium off the DB transaction log. Captures deletes too, lowest source impact." },
          ]}
        />
        <Callout kind="tip" title="Push-down what you can">
          Filter at the source, a WHERE on the watermark, partition pruning, column projection, so you move
          less data over the wire and into Spark. The cheapest byte is the one you never read.
        </Callout>
      </Block>

      <Block eyebrow="time is messy" title="Late data & watermarks">
        <p className="text-ink-dim leading-relaxed mb-2">
          Events arrive out of order, a phone was offline, a batch was delayed, so a row stamped 2:59 can
          show up at 3:10, after you 'closed' the 2:00 window. You handle this with{" "}
          <strong>event-time</strong> processing and a <strong>watermark</strong>: a bound like 'accept
          stragglers up to 15 minutes late, then finalize'. Anything later is dropped or routed to a
          correction path.
        </p>
        <Callout kind="trap" title="Partition on event time, write on processing time">
          A row's <em>partition</em> should follow its event date (when it happened) so historical queries
          are correct, even though you are writing it today. Mixing the two, partitioning late data into
          today's folder, silently corrupts every date-filtered query.
        </Callout>
      </Block>

      <Block eyebrow="the schema will change" title="Schema evolution at the boundary">
        <p className="text-ink-dim leading-relaxed mb-2">
          A source adds a column, renames one, or changes a type, and a rigid pipeline shatters. Absorb
          change at the <strong>bronze boundary</strong>: land raw permissively, then enforce a contract on
          the way into silver. Table formats (Iceberg, Delta, Hudi) make additive changes, new columns,
          safe, and let old and new files coexist.
        </p>
        <Callout kind="note" title="Partition-on-write is a design decision">
          Choose the partition column where queries filter, usually event date, and at the right grain
          (date, not minute). It is baked into the physical layout, so getting it wrong is expensive to
          undo. See File layout for the small-files trap this can cause.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "I draw it: sources to an ingest layer, Kinesis or MSK for streams, DMS or Firehose or a batch
          pull otherwise, landing raw on S3 as immutable bronze, then Spark on EMR promotes it to silver
          (clean, typed, deduped) and gold (aggregates and marts) for Athena, Redshift, and BI. I land raw
          first so I can reprocess without re-hitting the source. I load incrementally off a high-water
          mark or CDC instead of full reloads, push filters down to the source, and handle late data with
          event-time partitioning and a watermark. And I absorb schema change at the bronze boundary using
          a table format so additive changes stay safe."
        </Callout>
      </Block>
    </>
  );
}

/* ── Idempotency, backfills & reprocessing ────────────────────── */
function Idempotency() {
  return (
    <>
      <Lede>
        Jobs fail, get retried, and get re-run for backfills. The non-negotiable property is{" "}
        <strong>idempotency</strong>: running the same job twice produces the same result, never doubled
        counts. Senior candidates design for this from the start, because at scale a retry is not an
        edge case, it is Tuesday.
      </Lede>

      <Block eyebrow="the failure that bites" title="Why append-mode duplicates on retry">
        <p className="text-ink-dim leading-relaxed mb-2">
          The classic bug: a job appends its output, fails halfway through committing, and the orchestrator
          retries it. Now half the rows are written twice. <strong>Append mode is not idempotent</strong>,
          a re-run adds more rows on top of what is already there.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`append (NOT idempotent):
   run 1 -> writes rows for 2024-06-01           [ok]
   retry -> APPENDS the same rows again           [DOUBLE COUNT]

overwrite-by-partition (idempotent):
   run 1 -> replaces ALL of dt=2024-06-01         [ok]
   retry -> replaces dt=2024-06-01 again, same    [ok, no dup]`}
        />
        <Callout kind="trap" title="Retries are guaranteed, not hypothetical">
          Spot reclaim, a node death, a transient S3 error, any of these triggers a retry. If your write
          path is not idempotent, you ship wrong numbers the first time a task is re-attempted.
        </Callout>
      </Block>

      <Block eyebrow="three ways to be idempotent" title="Idempotent write patterns">
        <OpTable
          cols={["Pattern", "How it stays idempotent", "", "Use when"]}
          rows={[
            { op: "Overwrite a partition", avg: "replace the whole dt= partition", avgTone: "good", why: "Re-running a day fully rewrites that day. The simplest, strongest pattern for partitioned data." },
            { op: "MERGE / upsert by key", avg: "match on a business key", avgTone: "good", why: "Iceberg/Delta MERGE updates existing rows and inserts new ones; a re-run is a no-op on matched rows." },
            { op: "Deterministic output path", avg: "same input -> same path", avgTone: "ok", why: "Write to a path derived from the input partition so a re-run lands on, and replaces, the same files." },
          ]}
        />
        <Callout kind="tip" title="Dedupe with a stable key">
          Carry a deterministic dedupe key (a business id, or a hash of the natural keys) so even
          at-least-once delivery collapses duplicates. 'Exactly-once' in practice = idempotent sink +
          checkpoint, not magic.
        </Callout>
      </Block>

      <Block eyebrow="exactly-once, honestly" title="Checkpoint + idempotent sink">
        <p className="text-ink-dim leading-relaxed mb-2">
          True end-to-end exactly-once is hard. The practical recipe is{" "}
          <strong>at-least-once delivery + an idempotent sink</strong>: the source may re-deliver, but the
          sink (overwrite, MERGE, keyed upsert) makes a duplicate harmless. Structured Streaming adds a{" "}
          <strong>checkpoint</strong> that records exactly which offsets were processed, so on restart it
          resumes without reprocessing or skipping.
        </p>
        <Callout kind="note" title="Effectively-once is the real target">
          Most production systems aim for 'effectively once': delivery may double, but the write makes it
          idempotent, so the observable result is exactly-once. Saying that distinction out loud is the
          senior signal.
        </Callout>
      </Block>

      <Block eyebrow="history, two ways" title="Backfills vs reprocessing">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>backfill</strong> populates history that was never computed, new pipeline, new column,
          a gap. <strong>Reprocessing</strong> recomputes data you already had because the logic was wrong
          or the source was corrected. Both need the same foundation: jobs that are{" "}
          <strong>partitioned, replayable, and idempotent</strong>, so you can re-run any date range safely
          and in parallel.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`backfill / reprocess loop (safe because each day is idempotent):

   for dt in 2024-01-01 .. 2024-06-30:        # partition by date
       read raw(dt)        # bronze is immutable -> replayable
       transform           # same code as prod
       overwrite silver(dt)# overwrite -> re-runnable, no dup

   run days in parallel; re-run any failed day with zero side effects`}
        />
        <Callout kind="trap" title="If you can't replay, you can't fix bugs">
          A pipeline that is not idempotent and partitioned cannot be safely reprocessed, so the day a
          transform bug ships, you are stuck. Designing for replay is designing for your own future
          incident.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "I design every job to be idempotent, because retries and re-runs are guaranteed. Append mode is
          the trap, a retry double-counts, so I overwrite by partition, or MERGE/upsert on a business key,
          or write to a deterministic path. For streaming I lean on at-least-once delivery plus an
          idempotent sink and a checkpoint, which gives effectively-once. That same discipline is what
          makes backfills and reprocessing possible: keep raw immutable, partition by date, and make each
          partition independently re-runnable, so I can replay any date range in parallel with zero side
          effects when I need to fix a bug or fill a gap."
        </Callout>
      </Block>
    </>
  );
}

/* ── Sizing an EMR / Spark cluster ────────────────────────────── */
function Sizing() {
  return (
    <>
      <Lede>
        'How big a cluster do you need?' is a back-of-envelope question, and the interviewer wants the{" "}
        <em>chain of reasoning</em>, not a guess. It runs: input size sets the partition count, ~5 cores
        per executor sets the executor shape, cores in flight set the parallelism, and work over
        parallelism sets the runtime. Recite that chain and the number falls out.
      </Lede>

      <Block eyebrow="step 1" title="Partitions from the input size">
        <p className="text-ink-dim leading-relaxed mb-2">
          Start from the data. You want each partition to be a sane chunk of work, roughly{" "}
          <strong>128 to 256 MB</strong>, the same range as a good output file. So the number of partitions
          is just input size divided by your target:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`#partitions  ~=  input size  /  target partition size

   1 TB input, 256 MB target  ->  1,048,576 MB / 256  ~=  4,096 partitions

   too few  -> each task huge -> memory pressure -> SPILL to disk (slow)
   too many -> tiny tasks     -> scheduling overhead dominates`}
        />
        <Callout kind="note" title="This sets spark.sql.shuffle.partitions too">
          The default 200 shuffle partitions is wrong for almost every real job. Size it from the data so
          each shuffle partition is also in that 128 to 256 MB band.
        </Callout>
      </Block>

      <Block eyebrow="step 2" title="Executor shape: ~5 cores each">
        <p className="text-ink-dim leading-relaxed mb-2">
          The well-worn heuristic is <strong>~5 cores per executor</strong>, the sweet spot for S3/HDFS
          read throughput: more cores per JVM and you bottleneck on shared I/O and garbage collection;
          fewer and you waste per-executor overhead. Then, per node:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`per worker node:
   leave 1 core  + ~1 GB        for the OS / NodeManager daemons
   executors/node = (node cores - 1) / 5 cores-per-executor
   executor memory = (node mem / executors-per-node) - overhead (~7-10%)

example: 16-core, 64 GB node
   (16 - 1) / 5            =  3 executors per node
   ~ (64 / 3) - overhead   ~= ~18 GB per executor`}
        />
        <Callout kind="tip" title="Reserve overhead or you OOM">
          Off-heap and container overhead is ~7 to 10% on top of executor memory, plus 1 core and ~1 GB
          per node for daemons. Forget that reservation and YARN kills your containers under load.
        </Callout>
      </Block>

      <Block eyebrow="steps 3 & 4" title="Parallelism and runtime">
        <p className="text-ink-dim leading-relaxed mb-2">
          Total <strong>cores in flight</strong> = executors x 5; that is how many partitions run at once
          (one wave). If you have more partitions than cores, you process them in several{" "}
          <strong>waves</strong>. The rough runtime is total work divided by parallelism:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`total cores   =  #executors  x  5
waves         =  ceil(#partitions / total cores)
runtime       ~=  total work  /  parallelism   ( x #waves )

aim: enough cores that #partitions runs in 1-3 waves.
1 wave with idle cores -> over-provisioned;  many waves -> too small.`}
        />
        <Callout kind="trap" title="Spill is the silent killer">
          Too-few partitions make each task too big to fit in executor memory, so Spark spills to local
          disk, often a 5 to 10x slowdown that no extra node fixes. The cure is more partitions, not more
          memory. Too-many partitions swing the other way into scheduling overhead.
        </Callout>
      </Block>

      <Block eyebrow="size it live" title="Cluster sizing estimator">
        <p className="text-ink-dim leading-relaxed mb-3">
          Slide the input size, pick a target partition and node, and watch the whole chain compute, with
          a caution when partitions get too few (spill) or absurdly many (overhead).
        </p>
        <Try label="cluster sizing estimator">
          <ClusterSizingViz />
        </Try>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "I size from the data. Partitions = input over a 128 to 256 MB target, so a 1 TB job is roughly
          four thousand partitions. I shape executors at ~5 cores each, the S3 throughput sweet spot,
          leaving one core and about a gig per node for daemons, and I reserve 7 to 10% memory overhead so
          YARN does not kill me. Total cores in flight is executors times five, that is my parallelism,
          and runtime is roughly total work over parallelism times the number of waves. I aim to clear the
          partitions in one to three waves. Too few partitions and I spill to disk, the silent killer; too
          many and scheduling overhead eats the gains."
        </Callout>
      </Block>
    </>
  );
}

/* ── Cost optimization ────────────────────────────────────────── */
function Cost() {
  return (
    <>
      <Lede>
        At staff level, cost <em>is</em> a design constraint, not an afterthought. The cloud bill splits
        into compute and storage, and you attack each with a known playbook: spot and transient clusters
        on compute, columnar formats and lifecycle policies on storage, and cutting the bytes you scan
        everywhere. The signal is naming the lever <em>and</em> its trade-off.
      </Lede>

      <Block eyebrow="compute, the big lever" title="Spot, transient & serverless">
        <p className="text-ink-dim leading-relaxed mb-2">
          Compute usually dominates an EMR bill, and most of it is avoidable:
        </p>
        <OpTable
          cols={["Lever", "Saves", "", "Trade-off / when"]}
          rows={[
            { op: "Spot on task nodes", avg: "up to ~90% off", avgTone: "good", why: "Task nodes hold no HDFS data, so reclamation just loses compute. Keep core/master on-demand for stability." },
            { op: "Transient clusters", avg: "pay only while running", avgTone: "good", why: "Spin up, run the job, terminate. No idle cluster overnight. Pairs perfectly with batch." },
            { op: "EMR Serverless", avg: "no idle, auto-scale", avgTone: "good", why: "Spiky or unpredictable loads: you pay per-job capacity, no cluster to size or leave running." },
            { op: "Reserved / Savings Plans", avg: "~30-60% off baseline", avgTone: "ok", why: "For the steady always-on baseline (a persistent cluster, Redshift). Commit only what you know you'll use." },
          ]}
        />
        <Callout kind="tip" title="Spot the task fleet, not the core fleet">
          Run task nodes on spot for the deep discount but keep master and core nodes on-demand, losing a
          core node loses HDFS shuffle data and can fail the whole job. That split is the standard,
          defensible answer.
        </Callout>
      </Block>

      <Block eyebrow="right-size the metal" title="Instance families & autoscaling">
        <p className="text-ink-dim leading-relaxed mb-2">
          Match the instance to the work: <strong>memory-optimized</strong> (r-family) for wide joins,
          caching, and shuffle-heavy jobs; <strong>compute-optimized</strong> (c-family) for CPU-bound
          transforms; general-purpose (m-family) when unsure. Then let the cluster{" "}
          <strong>autoscale</strong> so it is not sized for peak all day, and{" "}
          <strong>cache only data you actually reuse</strong>, caching a once-read DataFrame just wastes
          memory.
        </p>
        <Callout kind="note" title="Avoid wide shuffles">
          A shuffle moves data across the network and is the most expensive thing Spark does. Filter and
          aggregate early, broadcast small dimension tables instead of shuffle-joining them, and pick
          partition keys that minimize re-distribution. Less shuffle = less time = less money.
        </Callout>
      </Block>

      <Block eyebrow="storage & scan" title="Format, partition, lifecycle">
        <p className="text-ink-dim leading-relaxed mb-2">
          The single highest-leverage storage move is the file format. <strong>Columnar + compression +
          partitioning</strong> shrinks both your S3 footprint and the bytes every query scans, which on
          Athena is literally the bill (~$5 per TB scanned):
        </p>
        <OpTable
          cols={["Move", "Effect", "", "Why it pays"]}
          rows={[
            { op: "Parquet + Snappy", avg: "~1/4 the bytes", avgTone: "good", why: "Columnar + compression. Smaller storage AND column pruning means far less scanned per query." },
            { op: "Partition + predicate pushdown", avg: "skip whole files", avgTone: "good", why: "A WHERE on the partition column reads only matching folders. Less scan, less Spark I/O." },
            { op: "S3 lifecycle to IA / Glacier", avg: "cheaper cold storage", avgTone: "ok", why: "Age old partitions to Infrequent Access, then Glacier. Cuts storage on data you rarely read." },
            { op: "Compaction", avg: "kills small files", avgTone: "good", why: "Fewer, bigger files cut S3 list overhead and per-file task overhead. See File layout." },
          ]}
        />
        <Callout kind="tip" title="The cheapest byte is the one you never scan">
          Across compute and storage the unifying idea is the same: read fewer bytes. Columnar formats,
          partition pruning, compression, and compaction all cash out as 'scan less', which cuts Athena
          dollars and Spark runtime at the same time.
        </Callout>
      </Block>

      <Block eyebrow="prove the format win" title="Pipeline cost estimator">
        <p className="text-ink-dim leading-relaxed mb-3">
          Flip CSV to Parquet and watch storage and Athena scan collapse. The format switch is the
          headline because it is a double win, fewer bytes stored and columnar pruning on read.
        </p>
        <Try label="pipeline cost estimator">
          <PipelineCostViz />
        </Try>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Cost is a design constraint. On compute, I run task nodes on spot for up to ~90% off while
          keeping master and core on-demand, use transient clusters that terminate after the job, reach for
          EMR Serverless on spiky loads, and put Savings Plans only on the steady baseline. I right-size
          instance families, memory-optimized for shuffles, compute-optimized for CPU work, autoscale, and
          avoid wide shuffles. On storage, the big lever is Parquet+Snappy with partitioning and pushdown,
          which cuts both my S3 footprint and the bytes Athena scans at five dollars a terabyte, plus
          lifecycle to IA/Glacier and compaction. The through-line is read fewer bytes."
        </Callout>
      </Block>
    </>
  );
}

/* ── File layout & the small-files problem ────────────────────── */
function FileLayout() {
  return (
    <>
      <Lede>
        File layout is where elegant pipelines quietly die. Thousands of tiny files, the{" "}
        <strong>small-files problem</strong>, wreck performance on every engine that touches them. A
        senior data architect recognizes the symptom, names the cause, and fixes it with compaction and
        sane partition grain, all of which the interview probes for.
      </Lede>

      <Block eyebrow="the symptom" title="Why small files hurt">
        <p className="text-ink-dim leading-relaxed mb-2">
          When a table is thousands of files of a few MB each, three things go wrong at once:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>S3 list/GET overhead</strong>, listing and opening each object has fixed latency; a million tiny files means a million round trips before any real work.</li>
          <li><strong>One task per file</strong>, Spark spins up a task per input file, so you get a flood of tiny tasks where scheduling overhead dwarfs the actual read.</li>
          <li><strong>Driver / NameNode pressure</strong>, tracking metadata for millions of files strains the driver (and, on HDFS, the NameNode), which can OOM or crawl.</li>
        </ul>
        <CodeBlock
          title="text"
          lang="text"
          code={`bad:   dt=2024-06-01/ -> 8,000 files x 0.5 MB   (one task each, tiny reads)
good:  dt=2024-06-01/ -> 8 files x 256 MB        (one task each, full reads)

   same data, ~1000x fewer files -> far less list overhead and task churn`}
        />
        <Callout kind="trap" title="It looks fine until it doesn't">
          A small-files table can run for months, then a query that should take seconds takes twenty
          minutes once the file count crosses a threshold. The data volume barely changed; the file{" "}
          <em>count</em> did.
        </Callout>
      </Block>

      <Block eyebrow="where they come from" title="The usual causes">
        <OpTable
          cols={["Cause", "Mechanism", "", "Tell"]}
          rows={[
            { op: "Over-partitioning", avg: "partition grain too fine", avgTone: "bad", why: "Partitioning by minute or by high-cardinality id splits data into countless near-empty folders." },
            { op: "Streaming micro-batches", avg: "a file per micro-batch", avgTone: "bad", why: "Each trigger writes a small file; over a day that is tens of thousands of tiny objects." },
            { op: "High write parallelism", avg: "too many output partitions", avgTone: "ok", why: "200+ shuffle partitions each write a file per output folder, multiplying small files on write." },
          ]}
        />
        <Callout kind="note" title="Right grain beats every fix">
          Partition by date, not minute; by country, not user-id. The grain should leave each partition in
          the hundreds-of-MB range. Get the grain right and you rarely need to compact in the first place.
        </Callout>
      </Block>

      <Block eyebrow="the fixes" title="Compaction & repartition-on-write">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two complementary fixes: control file size <em>when you write</em>, and compact what already
          exists.
        </p>
        <OpTable
          cols={["Fix", "What it does", "", "Target"]}
          rows={[
            { op: "coalesce / repartition before write", avg: "fewer, bigger output files", avgTone: "good", why: "repartition(n) or coalesce(n) so each task writes a ~128-512 MB file instead of many tiny ones." },
            { op: "Compaction / OPTIMIZE", avg: "rewrite small -> big", avgTone: "good", why: "A scheduled job (or Iceberg/Delta OPTIMIZE, Delta auto-compaction) rewrites tiny files into large ones." },
            { op: "Bucketing", avg: "fixed file count per key", avgTone: "ok", why: "Pre-shuffle into a set number of buckets so joins skip a shuffle and file counts stay bounded." },
          ]}
        />
        <Callout kind="tip" title="Target 128 to 512 MB files">
          Aim output files at roughly 128 to 512 MB, big enough that read and task overhead amortize, small
          enough to parallelize and not blow up memory. Iceberg and Delta give you compaction as a
          first-class maintenance operation, run it on a schedule for streaming sinks.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "The small-files problem is thousands of tiny files killing performance: S3 list and open
          overhead, one Spark task per file so scheduling dwarfs the read, and driver or NameNode pressure
          from the metadata. It comes from over-partitioning, streaming micro-batches, and too many write
          partitions. I fix it by partitioning at the right grain, date not minute, coalescing or
          repartitioning before write to hit 128 to 512 MB files, and running compaction, OPTIMIZE on
          Iceberg or Delta, on a schedule for streaming sinks. Bucketing helps bound file counts and skip
          join shuffles. Right grain on write means I rarely have to compact at all."
        </Callout>
      </Block>
    </>
  );
}

/* ── EMR vs Glue vs Databricks vs Snowflake ──────────────────── */
function BuildBuy() {
  return (
    <>
      <Lede>
        'Should we run EMR, use Glue, buy Databricks, or just put it in Snowflake?' is the build-vs-buy
        question of data platforms. There is no single right answer, only the right trade-off for this
        team, this workload, and this ops appetite. The senior move is to frame the axes and defend a
        choice, not to name a favorite.
      </Lede>

      <Block eyebrow="the four options" title="What each one actually is">
        <OpTable
          cols={["Platform", "What it is", "", "Cost model"]}
          rows={[
            { op: "EMR", avg: "self-run open-source Spark/Hive/Trino", avgTone: "good", why: "Max control and the cheapest at scale IF you operate it. You own tuning, scaling, and upgrades." },
            { op: "Glue", avg: "serverless Spark ETL, Glue Catalog-native", avgTone: "ok", why: "Less ops than EMR; per-DPU pricing. Great for moderate, AWS-native ETL and catalog-driven pipelines." },
            { op: "Databricks", avg: "managed Spark + Delta + notebooks + Unity Catalog", avgTone: "ok", why: "Premium, fast to build, multi-cloud, strong governance. You pay for the productivity and the platform." },
            { op: "Snowflake", avg: "managed cloud warehouse (SQL/BI)", avgTone: "ok", why: "Elastic compute, superb SQL/BI/sharing. It is a warehouse, not your Spark engine, different job." },
          ]}
        />
        <Callout kind="trap" title="Snowflake is not a Spark replacement">
          Snowflake is a brilliant warehouse for SQL analytics, BI, and data sharing, but it is not where
          you run heavy custom Spark transforms or ML feature pipelines. Conflating 'warehouse' with
          'processing engine' is a common interview slip.
        </Callout>
      </Block>

      <Block eyebrow="how to choose" title="The axes that decide it">
        <p className="text-ink-dim leading-relaxed mb-2">
          Map the decision to a few axes and the answer usually picks itself:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Ops appetite / team size</strong>, a small team without platform engineers should not run EMR by hand; lean serverless (Glue, EMR Serverless) or managed (Databricks).</li>
          <li><strong>Workload</strong>, heavy custom ETL and ML favor Spark (EMR/Glue/Databricks); SQL analytics and BI favor a warehouse (Snowflake/Redshift).</li>
          <li><strong>Control vs speed</strong>, EMR gives the most control and lowest unit cost at scale; managed platforms trade some of that for faster delivery.</li>
          <li><strong>Cost model</strong>, EMR rewards steady, large, well-tuned workloads; serverless and managed reward spiky or smaller ones where idle clusters would waste money.</li>
        </ul>
        <Callout kind="note" title="Cheapest-at-scale assumes you operate it well">
          EMR's low unit cost is real only if you have the people to tune, autoscale, and run it. Factor
          the engineering salary, an under-operated EMR cluster can cost more, in money and incidents, than
          a managed platform.
        </Callout>
      </Block>

      <Block eyebrow="the defensible call" title="A reasonable default by situation">
        <OpTable
          cols={["Situation", "Lean toward", "", "Because"]}
          rows={[
            { op: "Large, steady Spark, strong platform team", avg: "EMR", avgTone: "good", why: "Lowest unit cost at scale and full control; the team can carry the ops." },
            { op: "Moderate AWS-native ETL, small team", avg: "Glue / EMR Serverless", avgTone: "good", why: "Serverless removes cluster ops; Glue Catalog integration is built in." },
            { op: "Fast delivery, mixed SQL + ML, governance", avg: "Databricks", avgTone: "ok", why: "Managed Spark + Delta + Unity Catalog; productive, multi-cloud, premium price." },
            { op: "SQL analytics, BI, data sharing", avg: "Snowflake / Redshift", avgTone: "ok", why: "Warehouse strengths: elastic SQL compute, sharing, BI tooling. Pair with Spark for ETL." },
          ]}
        />
        <Callout kind="tip" title="Many shops run two of these together">
          A common real architecture is Spark (EMR or Glue) doing the heavy ETL into a lake, then Snowflake
          or Redshift serving SQL/BI on top. 'EMR vs Snowflake' is often a false choice, they do different
          jobs, and the senior answer says so.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "I frame it on axes, not favorites. EMR is self-run open-source Spark: max control and cheapest
          at scale, but only if I have a team to operate it. Glue is serverless Spark ETL, less ops,
          per-DPU, great for AWS-native catalog-driven pipelines. Databricks is managed Spark plus Delta
          plus Unity Catalog, premium and fast to build, multi-cloud. Snowflake is a warehouse, elastic
          SQL, BI, and sharing, not my Spark engine. So I choose on team size and ops appetite, workload
          (ETL/ML vs SQL/BI), control versus delivery speed, and cost model, and I'll often run Spark for
          ETL into the lake with Snowflake or Redshift serving BI on top, since they do different jobs."
        </Callout>
      </Block>
    </>
  );
}

/* ── Governance, lineage & Lake Formation ─────────────────────── */
function Governance() {
  return (
    <>
      <Lede>
        Past a certain scale, a data lake without governance becomes a 'data swamp', untrusted,
        unsearchable, and a compliance liability. Governance is access control, lineage, cataloging, and
        PII handling that make the lake usable and lawful. On AWS the centerpiece is{" "}
        <strong>Lake Formation</strong>, and the interview wants you to connect it to real obligations
        like GDPR.
      </Lede>

      <Block eyebrow="central access control" title="Lake Formation over the Glue Catalog">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>Glue Data Catalog</strong> is the metastore, it knows your tables, columns, and
          partitions. <strong>Lake Formation</strong> layers <em>fine-grained access control</em> on top:
          instead of coarse S3 bucket policies, you grant permissions at the table, column, row, and tag
          level, enforced consistently across Athena, Redshift Spectrum, EMR, and Glue.
        </p>
        <OpTable
          cols={["Control", "Granularity", "", "Use"]}
          rows={[
            { op: "Column-level", avg: "hide specific columns", avgTone: "good", why: "Analysts see the table but not the salary or SSN column. Enforced at query time." },
            { op: "Row-level (filters)", avg: "restrict which rows", avgTone: "good", why: "A regional team sees only its region's rows from the same physical table." },
            { op: "Tag-based (LF-Tags)", avg: "policy by attribute", avgTone: "ok", why: "Tag tables/columns (e.g. pii=true) and grant on the tag, so policy scales without per-table grants." },
          ]}
        />
        <Callout kind="note" title="One policy, many engines">
          The win is consistency: define access once in Lake Formation and Athena, EMR, Glue, and Redshift
          Spectrum all honor it. No more re-implementing column masking in every query tool.
        </Callout>
      </Block>

      <Block eyebrow="where did this come from?" title="Lineage, catalog & discovery">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Data lineage</strong> traces a column back through every transform to its source, so when
          a number looks wrong, or an auditor asks, you can show exactly where it came from.{" "}
          <strong>Cataloging and discovery</strong> (Glue Catalog, plus tools like DataHub or AWS DataZone)
          let people <em>find</em> trustworthy data instead of rebuilding it. Together they turn a lake
          into a navigable, trusted asset.
        </p>
        <Callout kind="tip" title="Lineage is an incident tool">
          When a downstream metric breaks, lineage tells you which upstream change caused it and what else
          it touches. It is not paperwork, it is how you scope a data incident in minutes instead of days.
        </Callout>
      </Block>

      <Block eyebrow="the legal obligations" title="PII, GDPR & the right to be forgotten">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>PII handling</strong> means classifying sensitive columns and{" "}
          <strong>masking or tokenizing</strong> them so analysts work with safe values. The hard one is
          GDPR's <strong>right to be forgotten</strong>: you must delete one person's rows on request, and
          a plain append-only S3 lake cannot do a row-level delete.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`raw append-only S3:   DELETE WHERE user_id = 42   ->  not possible
                      (objects are immutable; no row-level delete)

table format (Iceberg/Delta/Hudi):
   DELETE FROM users WHERE user_id = 42   ->  supported
   (the format tracks row-level deletes + handles compaction)`}
        />
        <Callout kind="trap" title="Right-to-be-forgotten is why you need a table format">
          A classic interview point: GDPR/CCPA deletion is the concrete reason a serious lake uses Iceberg,
          Delta, or Hudi rather than raw Parquet, only a table format supports compliant row-level deletes
          and updates over immutable object storage.
        </Callout>
      </Block>

      <Block eyebrow="who owns it & who pays" title="Stewardship, auditing & cost tags">
        <p className="text-ink-dim leading-relaxed mb-2">
          Governance is also organizational. <strong>Data ownership and stewardship</strong> assign a
          named owner to each domain so quality and access decisions have a home.{" "}
          <strong>Auditing</strong> (CloudTrail, Lake Formation access logs) records who read what, for
          compliance and breach investigation. And <strong>cost-allocation tags</strong> attribute spend
          to teams and pipelines so the bill is accountable, not a mystery.
        </p>
        <Callout kind="note" title="Governance is what keeps a lake from rotting">
          Access control, lineage, catalog, PII handling, ownership, auditing, and cost tags are the
          difference between a trusted data platform and a swamp nobody believes. Naming that full set is
          the staff-level signal.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Governance is what keeps a lake from becoming a swamp. On AWS, Lake Formation sits on top of the
          Glue Catalog and gives me fine-grained access control, column, row, and tag-based, enforced
          consistently across Athena, EMR, Glue, and Redshift Spectrum. I add lineage to trace a column
          back to its source (which is also how I scope incidents), cataloging for discovery, and PII
          handling via masking or tokenization. The sharp one is GDPR's right to be forgotten: raw S3 can't
          do row-level deletes, so I use a table format like Iceberg or Delta to delete a person's rows
          compliantly. Then ownership, audit logs, and cost-allocation tags close the loop."
        </Callout>
      </Block>
    </>
  );
}

/* ── Numbers a data architect knows ───────────────────────────── */
function Numbers() {
  return (
    <>
      <Lede>
        Senior estimation is not memorizing a price list, it is carrying a handful of round numbers so you
        can sanity-check a design out loud: 'that is roughly a few hundred dollars a month, dominated by
        scan'. The move is to <em>estimate, then justify</em>. These figures are order-of-magnitude
        anchors, current to 2024 to 2026 list pricing, not exact quotes.
      </Lede>

      <Block eyebrow="storage & query" title="The dollar anchors">
        <OpTable
          cols={["Anchor", "Rough value", "", "Use it to"]}
          rows={[
            { op: "S3 Standard", avg: "~$0.023 / GB-month", avgTone: "good", why: "~$23/TB-month. Storage is usually cheap; scan and compute dominate the bill." },
            { op: "Athena scan", avg: "~$5 / TB scanned", avgTone: "ok", why: "You pay per byte scanned, so columnar + partition pruning is direct money saved." },
            { op: "Spot discount", avg: "up to ~90% off on-demand", avgTone: "good", why: "The headline compute saving; size task fleets around it." },
            { op: "EC2 compute", avg: "~$0.04-0.10 / vCPU-hour on-demand", avgTone: "ok", why: "Order-of-magnitude for sizing a transient cluster's cost. Spot cuts it sharply." },
          ]}
        />
        <Callout kind="tip" title="Storage cheap, scan expensive">
          The reflex to internalize: storing a terabyte is roughly twenty-something dollars a month, but
          scanning a terabyte on Athena is about five dollars <em>per query pattern</em>. That asymmetry is
          why format and partitioning beat almost every other optimization.
        </Callout>
      </Block>

      <Block eyebrow="throughput & shape" title="Bytes, files & partitions">
        <OpTable
          cols={["Anchor", "Rough value", "", "Why it matters"]}
          rows={[
            { op: "Per-core S3 read", avg: "~tens to low-100s MB/s", avgTone: "ok", why: "One executor core reads at this rate; it sets the runtime in cluster sizing." },
            { op: "Target file size", avg: "128 to 512 MB", avgTone: "good", why: "Big enough to amortize task/list overhead, small enough to parallelize. Avoids small files." },
            { op: "Target partition size", avg: "128 to 256 MB", avgTone: "good", why: "The chunk of work per Spark task; sets your partition count from input size." },
            { op: "Parquet+Snappy vs raw", avg: "~1/3 to 1/5 the size", avgTone: "good", why: "Columnar + compression. Smaller storage AND less scanned, the double win." },
          ]}
        />
        <Callout kind="note" title="These chain into the sizing math">
          Per-core read rate, target partition size, and the Parquet ratio are exactly the constants the
          cluster-sizing and cost estimators run on. Carrying them lets you size a cluster on a whiteboard
          without a calculator.
        </Callout>
      </Block>

      <Block eyebrow="how to use them" title="Estimate, then justify">
        <p className="text-ink-dim leading-relaxed mb-2">
          The technique is not the numbers themselves but the habit: state an order-of-magnitude estimate,
          then immediately say what drives it and where you would refine.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`worked example: 1 TB/day, queried as Parquet, ~30% scanned/day

   storage:  ~15 TB avg/mo (Parquet ~1/4 of raw)  x $23/TB   ~=  ~$350/mo
   scan:     ~30% x column-pruning  ->  ~0.9 TB/mo  x $5/TB   ~=  ~$5/mo
   compute:  1 TB/day transform on transient + spot           ~=  modest

   -> "a few hundred a month, storage-dominated; raw CSV would
       multiply both storage and scan several-fold."`}
        />
        <Callout kind="tip" title="Round, reason, refine">
          Interviewers do not want a precise bill, they want to see you reach a defensible
          order-of-magnitude and name the dominant driver. Round aggressively, reason from the anchors, and
          flag what you would measure to firm it up.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "I keep round anchors so I can estimate out loud. S3 is about two cents a gigabyte-month, roughly
          twenty-three dollars a terabyte; Athena is about five dollars per terabyte scanned; spot is up to
          ninety percent off on-demand. For shape: target 128 to 512 MB files, 128 to 256 MB partitions, a
          core reads tens to low-hundreds of MB/s from S3, and Parquet+Snappy is about a third to a fifth
          of raw CSV. The reflex is storage cheap, scan expensive, which is why format and partitioning
          win. I estimate to an order of magnitude, name the dominant driver, and say what I'd measure to
          refine it."
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  archstyles: <ArchStyles />,
  ingestiondesign: <IngestionDesign />,
  idempotency: <Idempotency />,
  sizing: <Sizing />,
  cost: <Cost />,
  filelayout: <FileLayout />,
  buildbuy: <BuildBuy />,
  governance: <Governance />,
  numbers: <Numbers />,
};

export default function DataArchitectBench() {
  const [active, setActive] = useState("archstyles");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Systems & judgment · SHOULD WE"
      title="The Data Architect's Bench"
      subtitle="The senior call, design a pipeline, size the cluster, pick batch vs streaming, control cost, and defend the trade-offs out loud under real constraints."
      topics={TOPICS}
      activeId={active}
      onSelect={setActive}
    >
      <div className="flex items-center gap-2 mb-5">
        <Tag color={ACCENT}>{TOPICS.find((t) => t.id === active)?.group}</Tag>
      </div>
      {CONTENT[active]}
    </ToolShell>
  );
}
