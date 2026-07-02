import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
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
  { id: "slaops", label: "SLOs, freshness & incidents", group: "Operate" },
  { id: "snowbricks", label: "Snowflake & Databricks, deep answers", group: "Platforms" },
  { id: "rtolap", label: "Real-time OLAP engines", group: "Platforms" },
  { id: "featurestores", label: "Feature stores & AI pipelines", group: "Platforms" },
  { id: "datamesh", label: "Data mesh vs central platform", group: "Org & strategy" },
  { id: "wellarch", label: "Well-Architected & consulting mode", group: "Org & strategy" },
  { id: "trapbank", label: "The trap bank", group: "The gauntlet" },
  { id: "redflags", label: "The red-flag cram sheet", group: "The gauntlet" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
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

/* ── SLOs, freshness & incidents ──────────────────────────────── */
function SlaOps() {
  return (
    <>
      <Lede>
        Operating a platform is where "it works on my laptop" dies. A senior data architect runs pipelines
        like a service: named SLIs, an SLO with an error budget, freshness you can actually measure, an
        alert policy that does not cry wolf, and an incident runbook that ends in an idempotent backfill
        and a blameless postmortem. "How do you KNOW it's healthy?" is the whole topic.
      </Lede>

      <Block eyebrow="the four signals" title="Pipeline SLIs, borrowed from SRE">
        <p className="text-ink-dim leading-relaxed mb-2">
          You cannot manage what you do not measure. Name the service-level indicators for a data pipeline
          before you promise anything about it.
        </p>
        <OpTable
          cols={["SLI", "Measures", "", "Failure it catches"]}
          rows={[
            { op: "Freshness / latency", avg: "how old the newest data is", avgTone: "good", why: "Gold table is 40 min past its 06:00 target. The single most common data incident." },
            { op: "Completeness vs source", avg: "rows landed / rows at source", avgTone: "good", why: "Silver has 4.1M of the source's 4.3M rows, a dropped batch or a stalled CDC stream." },
            { op: "Quality-pass rate", avg: "% rows passing checks", avgTone: "good", why: "Null-rate, range, and referential checks (dbt tests, DLT expectations). Catches bad data before consumers do." },
            { op: "Serving availability", avg: "can queries actually run", avgTone: "ok", why: "Athena / Redshift / serving-API uptime. A fresh, correct table nobody can query is still an outage." },
          ]}
        />
        <Callout kind="note" title="Four signals, the data analog of the golden signals">
          Freshness, completeness, quality, and serving availability are the pipeline version of SRE's
          latency, traffic, errors, and saturation. Naming them as measurable SLIs, not vibes, is the first
          senior tell.
        </Callout>
      </Block>

      <Block eyebrow="the promise, with a budget" title="An SLO with an error budget">
        <p className="text-ink-dim leading-relaxed mb-2">
          An SLI is a measurement; an <strong>SLO</strong> is the promise you make about it, and the{" "}
          <strong>error budget</strong> is the slack that keeps the promise realistic.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`SLI  : freshness of the gold.orders table
SLO  : "fresh by 06:00 on 99% of business days, measured quarterly"

error budget = 1% of ~63 business days  ~=  at most one allowed miss per quarter
   inside budget  -> ship features, take risk
   budget burned  -> freeze changes, fix reliability first`}
        />
        <Callout kind="tip" title="The error budget is a decision tool">
          100% freshness is infinitely expensive and never the goal. The budget turns reliability into a
          number both sides agree on: while there is budget you move fast, when it is spent you stop and
          harden. That framing is what separates an SLO from a wish.
        </Callout>
      </Block>

      <Block eyebrow="how you actually measure it" title="Measuring freshness for real">
        <p className="text-ink-dim leading-relaxed mb-2">
          "How do you know a table is fresh?" has concrete answers, not "we check the dashboard". Measure
          against <strong>event-time</strong> and a declared deadline:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Watermark / last-updated tables</strong>, each pipeline writes (table, partition, max event-time, load-time) to an audit table; freshness = now minus max event-time.</li>
          <li><strong>dbt source freshness</strong>, <code className="font-mono">dbt source freshness</code> compares a loaded-at column against warn/error thresholds you declare per source.</li>
          <li><strong>Airflow SLAs / dataset schedules</strong>, an SLA miss fires when a task or DAG runs past its deadline; data-aware scheduling triggers on dataset updates.</li>
          <li><strong>Table-format metadata</strong>, Iceberg / Delta snapshot commit timestamps give you a last-write time for free.</li>
        </ul>
        <Callout kind="note" title="What the interviewer is listening for">
          The signal is that you measure freshness against event-time and a declared deadline, not against
          wall-clock arrival. "Last-updated watermark plus a 06:00 SLO" scores; "we'd notice if it broke"
          is an instant junior tell.
        </Callout>
      </Block>

      <Block eyebrow="page a human, or not" title="Alert philosophy">
        <p className="text-ink-dim leading-relaxed mb-2">
          The fastest way to make on-call ignore your alerts is to page them for things that do not matter.
        </p>
        <OpTable
          cols={["Severity", "Route", "", "Rule"]}
          rows={[
            { op: "Consumer-impacting", avg: "page a human", avgTone: "bad", why: "SLO breached, downstream is serving stale or wrong data. Wake someone." },
            { op: "Degraded but absorbed", avg: "file a ticket", avgTone: "ok", why: "A retry succeeded, a source was slow but caught up. Fix in hours, do not page." },
            { op: "Informational", avg: "log / dashboard", avgTone: "good", why: "Volume drifted 5%, a partition ran long. Trend it, never alert on it." },
          ]}
        />
        <Callout kind="trap" title="Alert fatigue kills trust">
          Every page that turns out to be nothing trains on-call to swipe it away, and the one real
          incident gets swiped too. Page only on consumer impact (a breached SLO), ticket the rest, and
          delete alerts nobody acts on. A noisy alert is worse than no alert.
        </Callout>
      </Block>

      <Block eyebrow="when it breaks" title="The incident runbook">
        <p className="text-ink-dim leading-relaxed mb-2">
          When an SLO breaks you run a rehearsed sequence, not a scramble.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`data incident runbook:
  1. DECLARE      -> open an incident, assign a lead, start a timeline
  2. COMMUNICATE  -> tell consumers WITH an impact statement:
                     "gold.orders is 2h stale; revenue dashboards low until 09:00"
  3. STOP BLEEDING-> pause downstream OR serve last-good with a STALE flag
  4. FIX          -> root-cause and correct the pipeline / source
  5. BACKFILL     -> idempotent replay of the affected partitions
  6. POSTMORTEM   -> blameless: what failed, why, what guardrail prevents it`}
        />
        <Callout kind="tip" title="'Data downtime' is the vocabulary">
          Borrow the observability term: data downtime is any period where data is missing, late, or wrong.
          The lifecycle mirrors an app outage, declare, communicate impact, stop the bleeding, fix,
          backfill, learn, and the backfill is safe only because the pipeline was built idempotent and
          partitioned.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A consumer says the dashboard looks wrong. Is that an incident?</strong> Not yet, I
            reproduce it against the SLIs first: is it a freshness miss, a completeness gap, or a failed
            quality check? If an SLO is breached I declare; if the data is correct and the consumer
            misread it, I fix the confusion, not the pipeline.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your freshness alert fires every morning but the data is fine. What do you do?</strong>{" "}
            That is alert fatigue in the making. I check whether the threshold is tighter than the SLO,
            wall-clock vs event-time, or a flaky upstream, then fix the measurement, loosen it to match the
            real SLO, or downgrade it to a ticket. An alert nobody acts on gets deleted.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The 06:00 SLO was missed because a source landed three hours late. Whose error budget?</strong>{" "}
            It still burns gold's budget, the consumer does not care whose fault it was. But the postmortem
            action is upstream: a source-freshness SLA and a completeness check that pages before 06:00, so
            next time I detect and communicate before the deadline, not after.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you backfill the lost hours without double-counting?</strong> I replay by
            partition into an idempotent sink, overwrite the affected event-time partitions or MERGE on a
            key, so re-running the window converges to the correct state instead of appending duplicates.
            That property is designed in up front, not improvised during the incident.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I run pipelines like a service. I define SLIs, freshness, completeness versus source,
          quality-pass rate, and serving availability, and turn the key one into an SLO with an error
          budget, like 'gold fresh by 06:00 on 99% of days'. I measure freshness off a last-updated
          watermark against event-time, not wall-clock. I page only on consumer impact and ticket the
          rest so I do not burn out on-call, and when something breaks I declare, communicate impact, stop
          the bleeding, fix, run an idempotent backfill, and write a blameless postmortem."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I borrow SRE discipline. The four SLIs are the data analog of the golden signals, and I attach
          an error budget to the one that matters so reliability is a shared number: inside budget we ship,
          once it is burned we freeze and harden. Freshness is measured concretely, a watermark or audit
          table holding max event-time per partition, dbt source freshness, Airflow SLAs, or table-format
          commit timestamps, always against event-time and a declared deadline. Alerting is tiered: page
          only on a breached SLO with real consumer impact, ticket the degraded-but-absorbed cases, and log
          the informational drift, because a noisy alert nobody trusts is worse than none. When an SLO
          breaks I run the runbook: declare with a lead, communicate an impact statement, stop the bleeding
          by pausing downstream or serving last-good behind a stale flag, fix the root cause, then replay
          the affected partitions idempotently and close with a blameless postmortem. The whole 'data
          downtime' loop only works because idempotency and partitioning were designed in, so the backfill
          is routine rather than terrifying."
        </Callout>
      </Block>
    </>
  );
}

/* ── Snowflake & Databricks, deep answers ─────────────────────── */
function SnowBricks() {
  return (
    <>
      <Lede>
        "Why not just buy Snowflake?" and "Why not standardize on Databricks?" are the two platform
        questions a data architect gets every cycle. Answering well means knowing what each actually is
        under the marketing, micro-partitions and virtual warehouses on one side, the lakehouse and Photon
        on the other, and being able to say when the honest answer is "run both".
      </Lede>

      <Block eyebrow="the warehouse, internally" title="Snowflake mechanics">
        <p className="text-ink-dim leading-relaxed mb-2">
          Snowflake is a managed cloud warehouse whose entire design separates storage from compute.
        </p>
        <OpTable
          cols={["Mechanism", "What it is", "", "Why it matters"]}
          rows={[
            { op: "Micro-partitions", avg: "50-500 MB uncompressed, columnar", avgTone: "good", why: "Immutable units auto-created on load with per-column min/max, so Snowflake prunes partitions without you managing files. The 50-500 MB is the uncompressed size; on disk it is smaller." },
            { op: "Clustering keys", avg: "a sort key for huge tables", avgTone: "ok", why: "Improves pruning, but auto-reclustering burns credits continuously, only cluster when scan cost justifies it." },
            { op: "Virtual warehouses", avg: "isolated compute, per-second credits", avgTone: "good", why: "Size and suspend independently; give ETL and BI separate warehouses so one never starves another." },
            { op: "Multi-cluster warehouses", avg: "add clusters under concurrency", avgTone: "ok", why: "Fan out to more clusters as the query queue grows, for high-concurrency BI. Scales out, costs more." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Three headline features fall out of the same split: <strong>Time Travel</strong> (query or
          restore a table as-of a timestamp within the retention window), <strong>zero-copy clone</strong>{" "}
          (an instant, metadata-only copy of a table, schema, or database for dev and test, no data
          duplicated), and <strong>Secure Data Sharing</strong> (grant another account live read access
          with no copy, the base of the Marketplace).
        </p>
        <Callout kind="note" title="Storage/compute split is the whole model">
          Every Snowflake talking point, per-second warehouses, workload isolation, zero-copy clone,
          sharing, falls out of one choice: data lives once in cloud storage and compute is elastic,
          stateless, and billed by the second on top. Say that and the features stop being a laundry list.
        </Callout>
      </Block>

      <Block eyebrow="the lakehouse, internally" title="Databricks mechanics">
        <p className="text-ink-dim leading-relaxed mb-2">
          Databricks is the managed Spark + Delta Lake platform, sitting on open storage rather than a
          proprietary warehouse.
        </p>
        <OpTable
          cols={["Mechanism", "What it is", "", "Why it matters"]}
          rows={[
            { op: "Unity Catalog", avg: "central governance + lineage", avgTone: "good", why: "One permission model, column/row policy, and automatic column-level lineage over all data and AI assets." },
            { op: "Delta Live Tables", avg: "declarative pipelines + expectations", avgTone: "good", why: "Declare the transform and data-quality expectations; DLT manages orchestration, retries, and incremental processing." },
            { op: "Photon", avg: "vectorized C++ execution engine", avgTone: "ok", why: "Spark-API compatible but proprietary; native vectorized execution for big SQL/DataFrame speedups. Not open source." },
            { op: "Serverless SQL warehouses", avg: "managed SQL compute", avgTone: "ok", why: "Fast-starting, auto-scaling SQL endpoints for BI on the lakehouse, the warehouse-style serving surface." },
          ]}
        />
        <Callout kind="tip" title="Open format is the pitch">
          Databricks' core argument is that your data stays in open Delta / Parquet on your own storage, so
          you are not locked into a proprietary internal format, while Photon and Unity Catalog give
          warehouse-grade speed and governance on top. That "open lake, warehouse experience" is the
          lakehouse claim.
        </Callout>
      </Block>

      <Block eyebrow="the two rebuttals" title="Why not everything on one of them">
        <p className="text-ink-dim leading-relaxed mb-2">
          The interview wants you to argue both directions without dogma.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>"Why not put everything in Snowflake?"</strong> Snowflake is superb for SQL and BI, but
          heavy programmatic and ML workloads want Spark's DataFrame/Python surface, not SQL; teams that
          value open-format neutrality do not want data trapped in a proprietary format; streaming and
          always-on serving fit a lake better; and at large always-on scale, warehouse compute gets
          expensive. Often the real answer is both: a lake/Spark layer for engineering and ML, Snowflake
          for BI on top.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>"Why not standardize everything on Databricks?"</strong> The mirror: pure SQL/BI analysts
          and dashboards are frequently faster and cheaper on a warehouse with no cluster concept;
          Snowflake's per-second warehouses, sharing, and marketplace are best-in-class for that; and a
          Spark-centric platform carries operational and skill overhead a SQL-only shop does not need. Same
          "both" answer: use each where it is strongest.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          The scoring signal is whether you can argue both rebuttals fairly and land on a workload-based
          split. Reciting one vendor's feature list is easy; explaining why a Spark/ML shop keeps an open
          lake and a BI-heavy shop leans on warehouse compute, and why many run both, is the staff answer.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>What is a micro-partition, and why does Snowflake not need you to manage files?</strong>{" "}
            A 50 to 500 MB (uncompressed) immutable columnar unit Snowflake creates automatically on load, carrying
            per-column min/max. Pruning happens on that metadata, so there is no small-files problem to
            hand-tune, the platform owns file layout, unlike a raw S3 lake.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>When is a clustering key worth it, given it costs credits?</strong> Only on very large
            tables where queries filter on a column that is not naturally ordered, and where the scan
            savings beat the continuous auto-reclustering credit burn. On small or well-ordered tables it
            is a waste.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A team wants Databricks for ML but finance loves Snowflake's bill predictability. Reconcile it.</strong>{" "}
            I do not force one. Spark/ML and heavy ETL go on Databricks over an open Delta lake, BI serving
            stays on Snowflake, and I govern the boundary so data is not copied endlessly. Each tool does
            what it is best at, and I show the combined cost, not one line item.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What does "open format" actually buy me if I am happy with Snowflake today?</strong>{" "}
            Optionality: with Delta / Iceberg / Parquet on your own storage, another engine, Spark, Trino,
            DuckDB, even Snowflake via Iceberg tables, can read the same data with no migration. It is
            insurance against lock-in and lets specialized engines share one copy.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Snowflake is a managed warehouse built on separating storage from compute: immutable
          micro-partitions with min/max pruning, per-second virtual warehouses you isolate per workload,
          plus Time Travel, zero-copy clone, and data sharing. Databricks is managed Spark on an open Delta
          lake, with Unity Catalog for governance and lineage, Delta Live Tables, and the Photon engine. I
          do not crown one, Spark/ML and open formats favor the lakehouse, SQL and BI favor the warehouse,
          and most serious stacks run both."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The unifying idea for Snowflake is the storage/compute split: micro-partitions are 50 to 500 MB
          uncompressed immutable columnar units with min/max metadata, so pruning is automatic and there is no
          small-files tuning; virtual warehouses are per-second, suspendable, and isolated so ETL never
          starves BI, with multi-cluster fan-out for concurrency; and Time Travel, zero-copy clone, and
          sharing all follow from data living once and compute being elastic. Clustering keys help pruning
          on huge tables but auto-recluster on credits, so I use them only when scan savings justify it.
          Databricks is the open-lakehouse counterpart: Spark on Delta over your own storage, Unity Catalog
          for one governance and lineage model, Delta Live Tables for declarative pipelines with quality
          expectations, Photon as a proprietary-but-Spark-compatible vectorized engine, and serverless SQL
          warehouses for BI. Then I argue both rebuttals: not everything in Snowflake because Spark/ML,
          open formats, streaming, and always-on cost push toward a lake; not everything in Databricks
          because pure SQL/BI is often cheaper on a warehouse. The senior landing is a workload-based
          split, lake for engineering, warehouse for serving, not a favorite."
        </Callout>
      </Block>
    </>
  );
}

/* ── Real-time OLAP engines ───────────────────────────────────── */
function RtOlap() {
  return (
    <>
      <Lede>
        Athena and Spark are built for flexibility over huge, cold data; they are not built to answer a
        dashboard in 200 milliseconds at hundreds of queries a second. That job belongs to a real-time
        OLAP engine, Druid, Pinot, or ClickHouse, and the senior skill is knowing exactly when that extra
        system earns its keep and when it is a shiny liability.
      </Lede>

      <Block eyebrow="the three engines" title="Druid, Pinot, ClickHouse">
        <p className="text-ink-dim leading-relaxed mb-2">
          All three do the same core thing, sub-second aggregations over fresh, high-cardinality event data
          at high query concurrency. The flavors differ.
        </p>
        <OpTable
          cols={["Engine", "One-line flavor", "", "Sweet spot"]}
          rows={[
            { op: "Apache Druid", avg: "the real-time OLAP pioneer", avgTone: "good", why: "Ingests from Kafka and serves time-sliced aggregations; the original streaming-analytics workhorse." },
            { op: "Apache Pinot", avg: "user-facing analytics at scale", avgTone: "good", why: "Built at LinkedIn for member-facing analytics (Who viewed your profile); designed for very high QPS." },
            { op: "ClickHouse", avg: "the fast column store you self-host", avgTone: "ok", why: "Blazing columnar SQL, easy to run yourself; popular for logs, product analytics, and observability." },
          ]}
        />
        <Callout kind="note" title="One capability, three packagings">
          Druid, Pinot, and ClickHouse all deliver seconds-fresh aggregations at high concurrency; you pick
          on operational taste, Kafka-native time-series (Druid), extreme user-facing QPS (Pinot), or
          self-hosted SQL simplicity (ClickHouse). Knowing they solve the same problem stops you treating
          them as exotic.
        </Callout>
      </Block>

      <Block eyebrow="when it earns the system" title="When they are worth it">
        <p className="text-ink-dim leading-relaxed mb-2">
          A dedicated OLAP store is another cluster to run. It earns that cost only for a specific shape of
          workload:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>User-facing analytics widgets</strong>, a "views over the last 7 days" chart embedded in your product, hit by every user.</li>
          <li><strong>Operational dashboards</strong> needing seconds-fresh data plus hundreds of QPS, fraud, logistics, live ops.</li>
          <li><strong>High-concurrency slice-and-dice</strong> over recent events where p99 latency is a product requirement.</li>
        </ul>
        <Callout kind="trap" title="It is NOT for ad-hoc lake queries">
          If the workload is a handful of analysts running exploratory queries over cold history, that is
          Athena or the warehouse, flexibility and pennies-per-query beat sub-second latency. Standing up
          Druid or Pinot for occasional big scans is paying a 24/7 serving-cluster tax for a batch job.
        </Callout>
      </Block>

      <Block eyebrow="where it sits" title="The architecture slot">
        <p className="text-ink-dim leading-relaxed mb-2">
          The real-time OLAP engine is a serving layer on the hot path, never the system of record.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`events -> Kafka --+--> real-time OLAP (Druid/Pinot/CH)  -> product / dashboards
                  |         (hot serving path: seconds-fresh, high QPS)
                  |
                  +--> lakehouse (S3 + Iceberg/Delta)   -> SYSTEM OF RECORD
                            ^                                (batch, ML, history)
                            |
                     backfill / re-load the OLAP store FROM the lake`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The lake stays the source of truth; the OLAP store is a derived, rebuildable view of the recent
          window. If it is lost or its schema changes, you backfill it from the lake.
        </p>
        <Callout kind="tip" title="Derived, not authoritative">
          Treat the OLAP engine as a cache you can rebuild, not a database you cannot lose. Keeping the
          lakehouse as system of record makes the fast layer disposable, which is exactly what you want for
          something optimized for speed over durability.
        </Callout>
      </Block>

      <Block eyebrow="vs the tools you already have" title="Against Athena and Redshift">
        <OpTable
          cols={["Dimension", "Real-time OLAP", "", "Athena / Redshift"]}
          rows={[
            { op: "Latency", avg: "sub-second, consistent", avgTone: "good", why: "Athena is seconds-to-minutes; great for analysts, wrong for a per-user widget." },
            { op: "Concurrency", avg: "hundreds to thousands QPS", avgTone: "good", why: "Athena has low concurrent-query limits; Redshift scales further but not to user-facing QPS cheaply." },
            { op: "Freshness", avg: "seconds from the stream", avgTone: "good", why: "Athena / Redshift are as fresh as the last batch load unless you engineer streaming ingest." },
            { op: "Flexibility / cost", avg: "narrower, always-on cost", avgTone: "bad", why: "Athena is pay-per-scan and endlessly flexible; the OLAP store trades that for speed and runs 24/7." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          The signal is restraint. Reaching for Druid or Pinot by default reads as over-engineering; the
          senior answer names the exact trigger, user-facing widgets or ops dashboards needing seconds-fresh
          data at high QPS, and otherwise stays on Athena or the warehouse.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A PM wants a live "trending now" widget on the homepage. Athena or Druid?</strong> That
            is a user-facing, high-QPS, seconds-fresh widget, exactly the case Druid or Pinot earns.
            Athena's concurrency limits and per-scan cost make it wrong for something every visitor hits.
            It goes on a real-time OLAP store fed from Kafka.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The same company's analysts want to explore two years of history. Same engine?</strong>{" "}
            No, that is ad-hoc, low-concurrency, cold data, Athena or the warehouse over the lake. Forcing
            it into the OLAP store wastes an always-on cluster on queries that do not need sub-second
            latency.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your Pinot cluster's schema needs to change, or it got corrupted. Now what?</strong>{" "}
            Because it is a derived view, I rebuild it from the lakehouse system of record, replay the
            relevant window from Kafka or batch-load from Iceberg. I never treat the OLAP store as the only
            copy, so a rebuild is routine, not a data-loss event.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What is the honest cost of adding one of these?</strong> A new 24/7 distributed system
            to size, monitor, and carry on-call, plus ingestion plumbing and a second data model. That
            operational tax is why I add it only when a real latency-and-concurrency SLO forces it, not
            because "real-time" sounds good.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Druid, Pinot, and ClickHouse all serve sub-second aggregations over fresh event streams at high
          concurrency, Druid the Kafka-native pioneer, Pinot for user-facing analytics at LinkedIn scale,
          ClickHouse the fast self-hosted column store. I add one only for user-facing widgets or ops
          dashboards that need seconds-fresh data at hundreds of QPS, never for ad-hoc history. It sits on
          the hot path off Kafka as a rebuildable, derived view, while the lakehouse stays system of record
          and backfills it."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "These are OLAP serving engines, not lakes. They solve one shape of problem, sub-second
          aggregations over fresh, high-cardinality events at high concurrency, and the flavor differences
          are operational: Druid is the Kafka-native real-time pioneer, Pinot targets extreme user-facing
          QPS, ClickHouse is the fast self-hosted columnar SQL store. The trigger to add one is a product
          requirement, an embedded analytics widget every user hits, or an ops dashboard needing
          seconds-fresh data at hundreds of QPS with a hard p99. It is emphatically not for ad-hoc
          exploration over cold history, that stays on Athena or the warehouse, where flexibility and
          pay-per-scan win. Architecturally it is a hot-path serving layer off Kafka, and the lakehouse
          remains the system of record, so the OLAP store is a derived view I can rebuild by replaying the
          stream or batch-loading from Iceberg. Versus Athena and Redshift it trades flexibility and
          per-scan cost for latency, concurrency, and freshness. And the honest caveat is the operational
          cost of a whole new 24/7 distributed system, which is why I only reach for it when the latency
          and concurrency SLO genuinely forces it."
        </Callout>
      </Block>
    </>
  );
}

/* ── Feature stores & AI pipelines ────────────────────────────── */
function FeatureStores() {
  return (
    <>
      <Lede>
        When the interview turns to ML platforms, the data architect's lane is clear: feature stores and
        RAG pipelines are ETL with stricter correctness rules. Nail two ideas, why a feature store exists
        (killing train/serve skew and point-in-time leakage), and that a RAG ingestion pipeline is just a
        new ETL surface with the same SLOs, idempotency, and backfills you already run.
      </Lede>

      <Block eyebrow="why it exists" title="Train/serve skew and point-in-time correctness">
        <p className="text-ink-dim leading-relaxed mb-2">
          A feature store solves two specific, expensive failures:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Train/serve skew</strong>, the feature computed in a training notebook and the one computed in the serving path drift apart because they are two implementations. Same model, different inputs, silent accuracy loss. The store makes both read one feature definition.</li>
          <li><strong>Point-in-time correctness</strong>, when you build a training set, each label must join to feature values as they were at that moment, not as they are now. Joining to current values leaks future information into the past and inflates offline scores.</li>
        </ul>
        <Callout kind="note" title="It is the data-leakage story, again">
          Point-in-time-correct joins are the feature-store version of the leakage sin: if a training row
          sees a value that only existed after the label event, your offline metric is a fantasy that
          collapses in production. The store enforces as-of joins so the past cannot see the future.
        </Callout>
      </Block>

      <Block eyebrow="the anatomy" title="What is inside a feature store">
        <OpTable
          cols={["Component", "What it holds", "", "Role"]}
          rows={[
            { op: "Feature registry", avg: "named, versioned definitions", avgTone: "good", why: "One source of truth for how each feature is computed, shared by training and serving." },
            { op: "Offline store", avg: "full history on the lake", avgTone: "good", why: "Columnar tables (S3 / Parquet) for building training sets with point-in-time joins. Big, cheap, batch." },
            { op: "Online store", avg: "latest value, low latency", avgTone: "ok", why: "A fast KV store (DynamoDB / Redis) serving single-digit-ms lookups at inference time." },
            { op: "Materialization jobs", avg: "keep the two consistent", avgTone: "good", why: "Pipelines that compute features and write both stores, so offline and online never disagree." },
          ]}
        />
        <Callout kind="tip" title="Offline for training, online for serving">
          The split is the whole design: a big cheap columnar store for point-in-time training joins, a
          fast KV store for inference lookups, and materialization jobs keeping them in sync. Consistency
          between the two is what actually kills train/serve skew.
        </Callout>
      </Block>

      <Block eyebrow="the tools" title="SageMaker Feature Store and Feast">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two names worth carrying:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Amazon SageMaker Feature Store</strong>, managed AWS feature store with an offline store on S3 and an online store for low-latency serving, integrated with the SageMaker training and inference stack.</li>
          <li><strong>Feast</strong>, the popular open-source feature store; a thin layer that defines features and orchestrates an offline store (warehouse / lake) plus an online store (Redis / DynamoDB) you bring.</li>
        </ul>
        <Callout kind="note" title="What the interviewer is listening for">
          The signal is that you frame a feature store as a data-engineering problem, not ML magic:
          definitions, an offline/online split, and materialization jobs with consistency guarantees.
          Naming SageMaker Feature Store or Feast is fine, but the points are for the architecture and the
          point-in-time join.
        </Callout>
      </Block>

      <Block eyebrow="the new ETL surface" title="RAG pipelines are ETL in a new costume">
        <p className="text-ink-dim leading-relaxed mb-2">
          Retrieval-augmented generation put a new pipeline on the data team's plate, and it is ETL with an
          embedding model in the transform.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`RAG ingestion pipeline (this is ETL):
  ingest docs -> chunk -> embed (model) -> write vectors + metadata -> vector store
                                                        |
  query time: embed the question -> ANN search + metadata filter -> top-k -> LLM`}
        />
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Freshness / re-embedding</strong>, when a source doc changes you must re-chunk and re-embed it; stale vectors return wrong answers. This is a freshness SLO like any table.</li>
          <li><strong>Metadata filtering</strong>, store tenant, ACL, date, and source alongside each vector so retrieval respects permissions and recency, not just similarity.</li>
          <li><strong>Retrieval evaluation</strong>, measure retrieval quality (recall@k, groundedness), because a bad retriever silently degrades the whole system.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed mb-2">
          Vector storage is an ops-and-scale choice, not a correctness one: <strong>OpenSearch</strong>{" "}
          (k-NN), Postgres via <strong>pgvector</strong>, or a dedicated vector store.
        </p>
        <Callout kind="tip" title="RAG ingestion is a pipeline with SLOs">
          Chunk-embed-store is extract-transform-load. It needs the same discipline as everything else:
          idempotent writes (re-embedding a doc replaces its vectors, keyed by doc id, not duplicates),
          backfills (re-embed the corpus when you change models), and a freshness SLO. The data architect
          owns that surface.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How does a feature store actually prevent train/serve skew?</strong> Both training and
            serving read features from one definition and one materialization pipeline, so the value is
            computed once and reused, not re-implemented on each side. The offline and online stores are
            kept consistent by the same job, so the model sees identical inputs in both worlds.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Walk me through a point-in-time join.</strong> For each training row with a label at
            time t, I join feature values as of t, the latest value with a timestamp &lt;= t, rather than the
            current value. That as-of semantics is why the offline store keeps full history with event
            timestamps, and it is what prevents leaking post-label information.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A source document changed. What has to happen in your RAG pipeline?</strong> I re-chunk
            and re-embed that document and overwrite its vectors idempotently, keyed by doc id, so retrieval
            reflects the new content with no stale or duplicate vectors. If I changed the embedding model
            instead, that is a full-corpus backfill.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You swapped embedding models. Why is that a backfill?</strong> Vectors from different
            models are not comparable, so the whole corpus must be re-embedded and the index rebuilt before
            queries are valid. It is a reprocessing job, partitioned, idempotent, re-runnable, which is why
            I treat the vector store as a derived, rebuildable asset over the lake.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "A feature store exists to kill two failures: train/serve skew, by making training and serving
          read one feature definition, and point-in-time leakage, by joining labels to feature values as-of
          the label time. Its anatomy is a registry, an offline store on the lake for training, a
          low-latency online store for inference, and materialization jobs keeping them consistent,
          SageMaker Feature Store or Feast. RAG ingestion, ingest, chunk, embed, store, is just new ETL
          with the same SLOs, idempotency, and backfills."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Feature stores are a data-engineering answer to two ML failures. Train/serve skew is two
          implementations of the same feature drifting apart; the store fixes it by having training and
          serving read one versioned definition materialized by one pipeline. Point-in-time correctness is
          the leakage story: each training label joins to feature values as they were at the label's
          timestamp, an as-of join, so the past never sees the future, which is why the offline store keeps
          full history with event times. The architecture is an offline store on the lake for cheap
          point-in-time training joins, a fast KV online store for single-digit-millisecond inference
          lookups, and materialization jobs that keep the two consistent, SageMaker Feature Store and Feast
          being the reference implementations. RAG is the newer surface but the same discipline: ingest,
          chunk, embed, and write vectors plus metadata is ETL with an embedding model in the transform. It
          has freshness (re-embed changed docs), metadata filtering for permissions and recency, and
          retrieval evaluation, and the vector store, OpenSearch, pgvector, or a dedicated store, is a
          derived, rebuildable asset. So I treat both as pipelines with SLOs, idempotent writes, and
          backfills, exactly like the rest of the platform."
        </Callout>
      </Block>
    </>
  );
}

/* ── Data mesh vs central platform ────────────────────────────── */
function DataMesh() {
  return (
    <>
      <Lede>
        "Should we adopt data mesh?" is an org-design question wearing a technology costume. The senior
        move is to define the four principles precisely, say what a data product actually is, name when
        mesh is right and the ways it fails, and lead with Conway's law rather than any tool.
      </Lede>

      <Block eyebrow="the four principles" title="Data mesh, precisely">
        <OpTable
          cols={["Principle", "Means", "", "In practice"]}
          rows={[
            { op: "Domain ownership", avg: "producers own their data", avgTone: "good", why: "Decentralize from a central team to the teams closest to the source, they understand it best." },
            { op: "Data as a product", avg: "datasets have consumers", avgTone: "good", why: "Discoverable, documented, SLO-backed; a product-manager mindset, not a dumped table." },
            { op: "Self-serve platform", avg: "a platform team enables domains", avgTone: "good", why: "Central paved-road tooling so domains ship products without reinventing infra." },
            { op: "Federated governance", avg: "global rules, enforced as code", avgTone: "ok", why: "Interoperability and compliance standards set centrally, enforced automatically, not by a review board." },
          ]}
        />
        <Callout kind="note" title="Decentralize ownership, centralize the platform">
          The four principles pull in tension on purpose: push data ownership OUT to domains, but keep a
          central self-serve platform and global governance so you get autonomy without chaos. Miss either
          half and mesh degrades into silos or a bottleneck.
        </Callout>
      </Block>

      <Block eyebrow="the load-bearing term" title="What a data product actually is">
        <p className="text-ink-dim leading-relaxed mb-2">
          "Data product" is the term everything hinges on, and it has a specific checklist. A data product
          is:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Discoverable and addressable</strong>, findable in a catalog with a stable address to query.</li>
          <li><strong>Trustworthy</strong>, SLO-backed freshness and quality, with documented lineage.</li>
          <li><strong>Interoperable</strong>, standard formats and shared identifiers so products join across domains.</li>
          <li><strong>Owned</strong>, a named domain team accountable for it, not orphaned.</li>
        </ul>
        <Callout kind="tip" title="Product, not a table dump">
          The test is whether a consumer can find it, trust its freshness, join it to other domains' data,
          and know who to page. If not, it is a table someone threw over the wall, and calling it a "data
          product" is the rebrand trap below.
        </Callout>
      </Block>

      <Block eyebrow="when it fits, how it breaks" title="Right for scale, wrong for everyone else">
        <OpTable
          cols={["Signal", "Reading", "", "So"]}
          rows={[
            { op: "Central team is the bottleneck", avg: "many domains, one overloaded team", avgTone: "good", why: "The classic trigger for mesh: the central data team cannot keep up with every request." },
            { op: "Strong platform maturity", avg: "paved-road self-serve exists", avgTone: "good", why: "Domains can build on real tooling. Mesh needs this substrate to stand on." },
            { op: "Tiny org, few domains", avg: "no bottleneck to solve", avgTone: "bad", why: "One small team has nothing to decentralize; mesh adds coordination overhead for nothing." },
            { op: "No platform, just a reorg", avg: "ownership without tooling", avgTone: "bad", why: "Declaring mesh with no self-serve platform pushes work onto domains that cannot handle it, silos." },
            { op: "Rebrand without ownership", avg: "same dumps, new name", avgTone: "bad", why: "Renaming existing tables 'data products' with no owner or SLO is mesh in name only." },
          ]}
        />
      </Block>

      <Block eyebrow="the middle most land on" title="Central platform + embedded ownership + contracts">
        <p className="text-ink-dim leading-relaxed mb-2">
          Most companies need neither full mesh nor a pure central lake; they land in between. A central
          platform team owns shared infra and paved roads, domains own their own pipelines and data
          products on top, and <strong>data contracts</strong> define the interfaces between them. You get
          domain accountability without every team running its own stack, and central leverage without
          being the bottleneck.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          The signal is that you treat this as organizational design, not a product to install. Leading
          with Conway's law, your data architecture will mirror your team boundaries, and landing on
          "central platform plus embedded domain ownership plus contracts" beats reciting the four
          principles off a slide.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>We have three engineers. Should we do data mesh?</strong> No. Mesh solves a scaling
            bottleneck you do not have yet, with three engineers a central platform is faster and cheaper.
            I would revisit mesh when many domains are queuing behind one overloaded data team.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Our teams renamed their exports "data products." Are we doing mesh?</strong> That is the
            rebrand trap, not mesh. A data product needs an owner, an SLO, discoverability, and
            interoperability. Without ownership and a self-serve platform underneath, you have silos with
            nicer names.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you stop domains from drifting into incompatible silos?</strong> Federated
            computational governance: global standards for identifiers, formats, and compliance, enforced
            as code on the shared platform, plus data contracts between producers and consumers. Autonomy
            inside the guardrails, not instead of them.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why do you keep bringing up Conway's law?</strong> Because architecture follows org
            structure whether you plan it or not. Mesh is fundamentally a decision about who owns what, so I
            design the team boundaries and ownership first and let the technical topology follow, rather
            than imposing a topology the org cannot staff.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Data mesh is four principles: domain ownership of data, data as a product, a self-serve
          platform, and federated computational governance. A data product is discoverable, trustworthy,
          interoperable, and owned, not a dumped table. Mesh fits when a central team has become the
          bottleneck across many domains and the platform is mature; it fails in small orgs, without a
          platform, or as a rebrand with no ownership. Most companies land in the middle: central platform,
          embedded domain ownership, contracts between them. It is org design, so I lead with Conway's law."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Mesh is a response to the central-team bottleneck at organizational scale. The four principles
          are domain ownership (the teams that produce data own it), data as a product (built for
          consumers, not dumped), a self-serve platform (central paved-road tooling so domains do not
          reinvent infra), and federated computational governance (global rules for interoperability and
          compliance, enforced as code). They deliberately pull both ways: decentralize ownership but
          centralize the platform and the rules. The load-bearing idea is the data product, which must be
          discoverable, trustworthy with SLOs and lineage, interoperable, and owned, otherwise it is just a
          renamed export, which is the most common failure mode. Mesh is right when many domains queue
          behind one overloaded team and there is a mature platform to build on; it is wrong for a small
          org with no bottleneck, or as a reorg with no self-serve tooling, or as a pure rebrand. In
          practice most companies land in a pragmatic middle: a central platform team, domain-embedded
          ownership of pipelines and products, and data contracts defining the interfaces. And I frame the
          whole thing with Conway's law, because the architecture will mirror the org chart, so I decide
          ownership and team boundaries first and let the topology follow."
        </Callout>
      </Block>
    </>
  );
}

/* ── Well-Architected & consulting mode ───────────────────────── */
function WellArch() {
  return (
    <>
      <Lede>
        Asked to review or design a platform, the AWS Well-Architected Framework is the checklist that
        keeps the answer complete and the consulting posture that keeps it credible. Name the six pillars,
        map each to a concrete data decision, and lead with discovery questions instead of a favorite
        architecture.
      </Lede>

      <Block eyebrow="the six pillars" title="Mapped to data-platform decisions">
        <OpTable
          cols={["Pillar", "Data-platform decision", "", "Concretely"]}
          rows={[
            { op: "Operational excellence", avg: "run it as code, observe it", avgTone: "good", why: "IaC (Terraform / CDK), runbooks, pipeline SLIs and dashboards. Deploy and recover repeatably." },
            { op: "Security", avg: "least privilege, encrypt, govern", avgTone: "good", why: "Lake Formation fine-grained access, KMS encryption, IAM least privilege, PII classification and masking." },
            { op: "Reliability", avg: "survive failure, recover data", avgTone: "good", why: "Idempotent replay, partitioned backfills, cross-region DR, immutable raw so you can reprocess." },
            { op: "Performance efficiency", avg: "right engine, right layout", avgTone: "ok", why: "Columnar formats, partition pruning, right-sized compute, the sizing chain, spill avoidance." },
            { op: "Cost optimization", avg: "pay for what you use", avgTone: "good", why: "Spot on task fleets, transient / serverless clusters, S3 lifecycle to IA / Glacier, scan reduction." },
            { op: "Sustainability", avg: "minimize resources burned", avgTone: "ok", why: "Right-sizing, retention policies, and efficient formats cut carbon: less compute and storage per result." },
          ]}
        />
        <Callout kind="tip" title="The pillars are a completeness checklist">
          Under pressure you forget an angle, usually security or reliability. Walking the six pillars
          guarantees your platform answer covers ops, security, reliability, performance, cost, and
          sustainability instead of over-indexing on the one you find fun.
        </Callout>
      </Block>

      <Block eyebrow="the specialization" title="The Analytics Lens">
        <p className="text-ink-dim leading-relaxed mb-2">
          AWS publishes domain <strong>Lenses</strong> that specialize the framework, and the{" "}
          <strong>Analytics Lens</strong> applies the six pillars specifically to data lakes, warehouses,
          and streaming, covering ingestion, cataloging, and the medallion-style layout you already draw.
          Knowing it exists signals you review platforms against a published standard, not just intuition.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          The signal is structured completeness plus judgment: the six pillars as a checklist, mapped to
          real data decisions, not recited as trivia. Bonus points for naming the Analytics Lens and for
          refusing to give an architecture before asking what problem it must solve.
        </Callout>
      </Block>

      <Block eyebrow="consulting mode" title="Discovery questions before architecture">
        <p className="text-ink-dim leading-relaxed mb-2">
          The other half of this topic is posture. A ProServe or partner-style architect does not open with
          an architecture; they open with discovery questions, then reason to a recommendation.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`before proposing anything, ask:
  WORKLOADS   -> batch or streaming? SQL/BI or Spark/ML? what latency SLA?
  SCALE       -> data volume, growth, query concurrency?
  TEAM        -> platform engineers? Spark skills? or SQL-only?
  COST        -> budget envelope? steady or spiky spend?
  COMPLIANCE  -> PII, GDPR/CCPA, residency, audit needs?
then: decision tree over dogma -> recommendation -> stakeholder alignment`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          With those answers the choice usually makes itself: a SQL-only team with spiky BI leans
          warehouse-and-serverless; a Spark-heavy ML shop with a platform team leans open lakehouse. The
          deliverable is "it depends, and here is exactly what it depends on", said confidently, not as a
          dodge.
        </p>
        <Callout kind="trap" title="'It depends' must come with the axes">
          Saying "it depends" and stopping reads as evasion. The consulting version names the dependencies
          out loud, workload, scale, team, cost, compliance, then commits to a recommendation for the
          stated constraints. Confidence plus contingency, not one or the other.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Review this platform for me.</strong> I would not free-associate; I walk the six
            pillars, operational excellence, security, reliability, performance, cost, sustainability, and
            check each against the design, which surfaces the gap people skip, usually reliability (no DR,
            non-idempotent jobs) or security (PII wide open). Structured beats clever here.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A client asks which warehouse to buy. What is your first move?</strong> Questions, not
            an answer: workloads and latency SLAs, scale and concurrency, team skills, cost envelope, and
            compliance. The right platform falls out of those; recommending one before asking is how
            consultants lose credibility.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Isn't "it depends" just avoiding the question?</strong> Only if you stop there. I name
            exactly what it depends on, the five discovery axes, then commit to a recommendation for the
            constraints as stated, and flag what would change my mind. That is judgment, not evasion.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Where do most data platforms fail Well-Architected?</strong> Reliability and cost:
            jobs that are not idempotent so they cannot be safely replayed, no DR or backfill story, and
            compute left always-on with no spot or lifecycle. Security's PII exposure is the other common
            miss. The pillars exist precisely to catch those blind spots.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I review platforms against the six Well-Architected pillars, operational excellence, security,
          reliability, performance efficiency, cost optimization, and sustainability, mapped to concrete
          data decisions: IaC and runbooks, Lake Formation and KMS, idempotent replay and DR, columnar
          layout and right-sized compute, spot and lifecycle, and retention. The Analytics Lens
          specializes it for data. And I work in consulting mode: discovery questions first, workloads,
          scale, team, cost, compliance, then a decision tree to a recommendation, not a favorite
          architecture."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Well-Architected gives me a completeness checklist so I do not over-index on the fun pillar and
          forget security or reliability. I map each pillar to a data decision: operational excellence is
          IaC, runbooks, and pipeline SLIs; security is Lake Formation fine-grained access, KMS, least
          privilege, and PII masking; reliability is idempotent replay, partitioned backfills, DR, and
          immutable raw; performance efficiency is columnar formats, pruning, and right-sized compute from
          the sizing chain; cost optimization is spot on task fleets, transient and serverless clusters,
          lifecycle, and scan reduction; and sustainability is right-sizing and retention, which also cut
          carbon. The Analytics Lens specializes all of that for lakes, warehouses, and streaming. The
          second half is posture: in consulting mode I never lead with an architecture. I run discovery
          first, workloads and latency SLAs, scale and concurrency, team skills, cost envelope, and
          compliance, then use a decision tree rather than dogma and align stakeholders. So my answer to
          almost any design question is a disciplined 'it depends', where I name the axes it depends on and
          still commit to a recommendation for the constraints as stated."
        </Callout>
      </Block>
    </>
  );
}

/* ── The trap bank ────────────────────────────────────────────── */
function TrapCard({ n, quote, bait, dodge, signal }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3.5 mb-3">
      <div className="flex items-start gap-2.5 mb-2.5">
        <span className="font-mono text-[11px] leading-5" style={{ color: ACCENT }}>
          {n}
        </span>
        <p className="text-ink font-medium leading-snug">&ldquo;{quote}&rdquo;</p>
      </div>
      <div className="space-y-1.5 text-sm text-ink-dim leading-relaxed pl-6">
        <p>
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mr-1.5">the bait</span>
          {bait}
        </p>
        <p>
          <span className="font-mono text-[10px] uppercase tracking-wider mr-1.5" style={{ color: ACCENT }}>the dodge</span>
          {dodge}
        </p>
        <p>
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mr-1.5">the signal</span>
          {signal}
        </p>
      </div>
    </div>
  );
}

function TrapBank() {
  return (
    <>
      <Lede>
        Some interviewer lines are bait. They sound like innocent questions but reward the junior reflex,
        agree, over-build, or over-promise. This is a bank of ten, each with the bait that makes candidates
        faceplant, the dodge that scores, and the signal the interviewer is quietly grading.
      </Lede>

      <Block eyebrow="traps 1-5" title="The over-build and over-promise baits">
        <TrapCard
          n="1"
          quote="We need real-time."
          bait="Candidates jump straight to Kafka and Flink to sound impressive."
          dodge="'What end-to-end latency does the business actually need? Most real-time asks are satisfied by a 5 to 15 minute micro-batch at a fraction of the cost and on-call load. I reserve true streaming for a stated sub-minute SLA.'"
          signal="Do you interrogate the requirement and default to batch, or buy complexity on a vibe?"
        />
        <TrapCard
          n="2"
          quote="Isn't the lakehouse just marketing?"
          bait="Agree cynically, or gush that it replaces everything."
          dodge="'There is a real core: ACID table formats, Iceberg, Delta, Hudi, bring transactions, schema evolution, and row-level deletes to open files on object storage, which raw Parquet cannot do. The marketing is the totalizing claims; the table format is genuine.'"
          signal="Can you separate the substantive capability from the hype?"
        />
        <TrapCard
          n="3"
          quote="Why not just put everything in Snowflake?"
          bait="Cave and agree, or reflexively bash Snowflake."
          dodge="'Snowflake is excellent for SQL and BI. But heavy Spark/ML wants a programmatic engine, open formats avoid lock-in, streaming and serving fit a lake, and warehouse compute is pricey always-on. Usually the answer is both: lake for engineering, warehouse for BI.'"
          signal="Do you know a warehouse is not a processing engine, and can you argue it without dogma?"
        />
        <TrapCard
          n="4"
          quote="Can you guarantee exactly-once?"
          bait="Say 'yes' confidently."
          dodge="'End-to-end exactly-once is largely a myth. What I engineer is effectively-once: at-least-once delivery plus an idempotent sink and a checkpoint, so duplicates are harmless. That is the honest, robust guarantee.'"
          signal="Do you understand delivery semantics, or promise magic?"
        />
        <TrapCard
          n="5"
          quote="Should we adopt data mesh?"
          bait="'Yes, it is the modern way.'"
          dodge="'It depends on org scale. Mesh solves a central-team bottleneck across many domains and needs a mature self-serve platform. In a small org, or without that platform, it adds overhead or becomes a rebrand. It is an org-design decision, not a tool.'"
          signal="Do you treat mesh as organizational, and resist cargo-culting?"
        />
      </Block>

      <Block eyebrow="traps 6-10" title="The false-simplicity baits">
        <TrapCard
          n="6"
          quote="Just add more nodes, right?"
          bait="'Sure, scale horizontally.'"
          dodge="'Not if the bottleneck is skew or spill. If one key holds most of the data, or partitions are too big and spilling to disk, more nodes do not help, I fix the data distribution and partition count first, then scale.'"
          signal="Do you diagnose before scaling, or throw hardware at a design problem?"
        />
        <TrapCard
          n="7"
          quote="Kafka or Kinesis, quick."
          bait="Blurt a favorite."
          dodge="'Depends on the team. Kinesis is managed, AWS-native, and fast to stand up with less to operate; Kafka or MSK is more powerful, portable, and higher-throughput but heavier to run. Small AWS-native team, Kinesis; high scale or multi-cloud with platform muscle, Kafka.'"
          signal="Do you choose on constraints, or on brand loyalty?"
        />
        <TrapCard
          n="8"
          quote="It's only a WHERE clause, why is it slow?"
          bait="Shrug and blame the engine."
          dodge="'Because the filter is not being pushed down or pruned. If the column is not partitioned or the format is not columnar, the engine scans everything. I check partition pruning, predicate pushdown, and file layout before touching the query text.'"
          signal="Do you reason about scan and pruning, or treat SQL as opaque?"
        />
        <TrapCard
          n="9"
          quote="We'll save money by running everything on spot."
          bait="Agree, spot is cheap."
          dodge="'Spot on task nodes, yes, up to about 90% off. But core and master on spot risk losing HDFS and shuffle data mid-job and failing the whole run. I keep those on-demand and put the discount where reclamation is safe.'"
          signal="Do you know where spot is safe versus catastrophic?"
        />
        <TrapCard
          n="10"
          quote="Schema-on-read means we can skip modeling."
          bait="'Yes, just dump JSON and figure it out later.'"
          dodge="'Schema-on-read defers enforcement, it does not remove modeling. Skip it and you get a swamp: undocumented grain, no contracts, unusable joins. I still declare grain, keys, and contracts at the silver boundary, I just enforce them later than a warehouse would.'"
          signal="Do you understand that flexibility is not an excuse to skip data modeling?"
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Across all ten the meta-signal is the same: do you buy complexity on a vibe, or reason from the
          constraint? Every dodge interrogates the requirement, defaults to the simpler system, and stays
          honest about guarantees. That reflex is what they are really scoring.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>You keep saying "it depends." Just pick one.</strong> Fine: for a small AWS-native team
            with spiky BI I would run Glue plus a warehouse and skip streaming. I name the constraints, then
            commit. The dodge is not refusing to answer, it is refusing to answer before I know the
            constraints, then answering.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The business insists it needs real-time. Are you going to keep pushing back?</strong>{" "}
            Once, to get a number, end-to-end latency and the cost of being a few minutes stale. If they
            truly need sub-minute, I build streaming without complaint. Pushing back is to right-size, not
            to win an argument.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You said exactly-once is a myth. My last engineer promised it. Were they lying?</strong>{" "}
            Probably describing effectively-once, idempotent sink plus checkpoint, which is the achievable
            version, or a single-system guarantee like Kafka transactions. End-to-end across heterogeneous
            systems, the honest word is effectively-once.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Which of these do candidates fail most?</strong> "We need real-time" and "exactly-once",
            both reward over-promising. The fix is the same reflex: ask for the number, then engineer to it
            honestly rather than agreeing to sound impressive.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Most of these are bait for the junior reflex, agree, over-build, or over-promise. The through-line
          dodge is: interrogate the requirement, default to the simpler system, and be honest about
          guarantees. So 'real-time' gets 'what latency, exactly?', 'exactly-once' gets 'effectively-once',
          'everything in Snowflake' gets 'warehouse plus lake', and 'just add nodes' gets 'diagnose skew
          and spill first'. I commit once I know the constraints, not before."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The traps split into two families. The over-promise baits, real-time, exactly-once, data mesh,
          everything-in-Snowflake, tempt you to agree or claim more than is true; the dodge is to ask for
          the number or the org context and then give the honest, right-sized answer, effectively-once
          instead of exactly-once, batch by default, mesh only at a real bottleneck, lake-plus-warehouse
          instead of one. The false-simplicity baits, just add nodes, Kafka-or-Kinesis, a slow WHERE, spot
          everything, schema-on-read, tempt you to skip diagnosis; the dodge is to name the real mechanism,
          skew and spill before scaling, constraints before a streaming vendor, pruning and pushdown before
          the query text, spot only where reclamation is safe, and modeling that is deferred, not skipped.
          Underneath all ten is one instinct interviewers are grading: reason from the constraint, do not
          buy complexity or promise magic to sound senior. And 'it depends' is a strong answer only when I
          name the axes and then commit."
        </Callout>
      </Block>
    </>
  );
}

/* ── The red-flag cram sheet ──────────────────────────────────── */
function RedFlags() {
  return (
    <>
      <Lede>
        Some answers do not just lose points, they end the interview, because they signal the candidate has
        never run a real platform. Here are ten phrases that read as instant disqualifiers, why each lands
        so badly, and the sentence that fixes it.
      </Lede>

      <Block eyebrow="the cram sheet" title="Ten disqualifiers and their fixes">
        <OpTable
          cols={["Red-flag phrase", "Why it ends the interview", "", "The fix phrase"]}
          rows={[
            { op: "'We'll stream it' (no freshness SLA)", avg: "buys 24/7 complexity on a vibe", avgTone: "bad", why: "'What end-to-end latency do we need? If minutes are fine, micro-batch.'" },
            { op: "'coalesce(1) to fix small files'", avg: "funnels all data through one task", avgTone: "bad", why: "'Compact to 128 to 512 MB target files, or repartition, never collapse to one.'" },
            { op: "'SELECT * in the pipeline'", avg: "scans every column, breaks on schema change", avgTone: "bad", why: "'Project only the columns I need so pruning and pushdown work.'" },
            { op: "'We'll just rerun it' (no idempotency)", avg: "a rerun double-counts and corrupts", avgTone: "bad", why: "'Overwrite by partition or MERGE on a key so a rerun converges.'" },
            { op: "Modeling without declaring grain", avg: "ambiguous grain fans out joins", avgTone: "bad", why: "'One row per what? I state the grain before I model.'" },
            { op: "Treating S3 like a filesystem", avg: "expects cheap renames and appends", avgTone: "bad", why: "'S3 is object storage, no in-place edit; a table format handles updates and deletes.'" },
            { op: "'Kappa everywhere'", avg: "forces streaming on batch-shaped jobs", avgTone: "bad", why: "'Default batch; stream only where a latency SLA demands it.'" },
            { op: "Ignoring scan economics", avg: "unaware Athena bills ~$5/TB scanned", avgTone: "bad", why: "'Columnar plus partition pruning, I optimize the bytes scanned.'" },
            { op: "A migration with no rollback", avg: "no way back when the cutover breaks", avgTone: "bad", why: "'Dual-run old and new, verify parity, keep a rollback path before cutover.'" },
            { op: "'PII lands wide-open in bronze'", avg: "raw PII with no controls is a breach", avgTone: "bad", why: "'Classify and restrict PII at ingest, Lake Formation, encryption, tokenization.'" },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Each fix shares one instinct: name the constraint, latency, grain, scan cost, blast radius,
          sensitivity, before proposing the mechanism. The red flags all skip that step; the fixes all lead
          with it, which is precisely the operator-versus-tourist signal.
        </Callout>
      </Block>

      <Block eyebrow="the pattern behind them" title="Four reflexes to internalize">
        <p className="text-ink-dim leading-relaxed mb-2">
          These ten are not random; they cluster into a few reflexes worth carrying:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>No stated SLA / requirement</strong>, streaming with no freshness number, Kappa everywhere: buying complexity before naming the need.</li>
          <li><strong>No idempotency / replay</strong>, "just rerun it", no rollback: not designing for the retry that is guaranteed.</li>
          <li><strong>No scan / layout discipline</strong>, coalesce(1), SELECT *, ignoring $5/TB: not respecting how bytes cost money.</li>
          <li><strong>No modeling / governance rigor</strong>, no grain, S3-as-filesystem, PII wide open: skipping the boring correctness and safety work.</li>
        </ul>
        <Callout kind="tip" title="One fix reflex behind all ten">
          Every fix is "state the constraint, then choose the mechanism". Lead with the latency SLA, the
          grain, the scanned bytes, the rollback plan, or the PII classification, and you cannot say any of
          the ten red flags, because each one is what you get when you skip that sentence.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A candidate says "we'll just rerun the job if it fails." Your follow-up?</strong> I ask
            what happens to already-written rows on the rerun. If they cannot say "nothing, it overwrites
            the partition or MERGEs on a key", the pipeline double-counts on every retry, and retries are
            guaranteed. That one answer tells me whether they have run production.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why is coalesce(1) such a specific tell?</strong> It fixes the symptom (many files) by
            destroying parallelism, one task writes everything, so a big job crawls or OOMs. Someone who
            has hit it in production reaches for compaction or repartition to a target file size, never a
            funnel to one.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>PII in bronze, isn't raw supposed to be untouched?</strong> Raw immutability is about
            not editing data, not about leaving it unprotected. PII needs classification, encryption, and
            access restriction from the moment it lands; wide-open raw PII is a breach and a GDPR/CCPA
            failure regardless of the medallion story.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>If you had to keep just one of these fixes, which?</strong> Idempotency. A pipeline you
            cannot safely rerun cannot be backfilled or reprocessed, so the first real incident traps you.
            Everything else costs money or elegance; non-idempotency costs correctness.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "The disqualifiers all share one flaw: proposing a mechanism before naming the constraint.
          Streaming with no freshness SLA, coalesce(1) for small files, SELECT * in production, 'we'll just
          rerun it' with no idempotency, modeling without a grain, treating S3 like a filesystem, Kappa
          everywhere, ignoring the $5-per-terabyte scan bill, a migration with no rollback, and PII landing
          wide-open in bronze. The fix for every one is to lead with the constraint, latency, grain, bytes,
          blast radius, sensitivity, then choose the tool."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I group the red flags into four reflexes. No stated requirement: streaming with no freshness SLA
          or 'Kappa everywhere' buys 24/7 complexity before anyone named a latency need; the fix is 'what
          end-to-end latency do we need, and if minutes are fine, micro-batch'. No idempotency or replay:
          'we'll just rerun it' and a migration with no rollback ignore that retries and failed cutovers
          are guaranteed; the fix is overwrite-by-partition or MERGE, and dual-run with parity checks and a
          rollback path. No scan or layout discipline: coalesce(1), SELECT *, and ignoring five dollars a
          terabyte all waste bytes; the fix is compaction to target file sizes, column projection, and
          columnar plus pruning. And no modeling or governance rigor: no declared grain, treating S3 as a
          POSIX filesystem, and PII wide open in bronze; the fix is to state the grain, use a table format
          for updates and deletes, and classify and restrict PII at ingest. The single instinct behind all
          of them is state the constraint before the mechanism, and if I could keep only one fix it would
          be idempotency, because a pipeline you cannot safely replay fails you at the first incident."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ───────────────────────────────────── */
const DECK = [
  { q: "S3 Standard storage, dollars per GB-month?", a: "About $0.023 per GB-month, roughly $23 per TB-month. Storage is cheap; scan and compute dominate the bill.", tag: "numbers" },
  { q: "Athena pricing model and the number?", a: "About $5 per TB scanned, you pay per byte read, so columnar formats and partition pruning are direct dollars saved.", tag: "numbers" },
  { q: "Target file size and target Spark partition size?", a: "Output files 128 to 512 MB; Spark partitions 128 to 256 MB. Big enough to amortize task and list overhead, small enough to parallelize.", tag: "numbers" },
  { q: "Spot discount, and where is it safe on EMR?", a: "Up to about 90% off on-demand. Safe on task nodes (no HDFS data); keep master and core on-demand so reclamation does not lose shuffle data and fail the job.", tag: "numbers" },
  { q: "Kinesis Data Streams shard limits?", a: "Per shard: 1 MB/s or 1000 records/s ingress, and 2 MB/s egress. You scale throughput by adding shards.", tag: "numbers" },
  { q: "Parquet+Snappy vs raw CSV, size ratio?", a: "Roughly one third to one fifth of raw. Columnar plus compression, smaller storage and less scanned, the double win.", tag: "numbers" },
  { q: "Lambda vs Kappa in one breath.", a: "Lambda runs two layers, batch for accuracy, speed for latency, merged at serve, so two codebases. Kappa keeps one streaming pipeline and reprocesses by replaying the log; simpler if you have a durable log and streaming muscle.", tag: "judgment" },
  { q: "The cluster-sizing chain, start to finish.", a: "Input over a 128 to 256 MB target sets partitions; ~5 cores per executor sets shape; executors times 5 sets cores in flight (parallelism); total work over parallelism times waves sets runtime.", tag: "sizing" },
  { q: "Name the three idempotent write patterns.", a: "Overwrite the whole partition, MERGE/upsert on a business key, or write to a deterministic path derived from the input. All make a rerun converge instead of double-count.", tag: "judgment" },
  { q: "What is write-audit-publish (WAP)?", a: "Write data to a staged or hidden snapshot, run quality audits against it, and only publish (flip the pointer) if it passes, so consumers never see bad data. A table-format-friendly quality gate.", tag: "quality" },
  { q: "State a data SLO with an error budget.", a: "'gold.orders fresh by 06:00 on 99% of business days, measured monthly.' The 1% is the error budget: inside it you ship, once it is burned you freeze and harden.", tag: "operate" },
  { q: "Snowflake micro-partition size, and why it matters?", a: "50 to 500 MB uncompressed, immutable, columnar, with per-column min/max metadata. Snowflake prunes on that metadata, so there is no small-files problem to hand-tune.", tag: "platforms" },
  { q: "The four data-mesh principles.", a: "Domain ownership of data, data as a product, self-serve data platform, and federated computational governance. Decentralize ownership, centralize the platform and global rules.", tag: "org" },
  { q: "The six Well-Architected pillars.", a: "Operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability. Walk them as a completeness checklist on any platform review.", tag: "org" },
  { q: "Default batch or streaming, and what flips it?", a: "Default batch, bounded, cheapest, reprocessing is a rerun. A concrete sub-minute latency SLA flips it to streaming; most 'real-time' asks survive a 5 to 15 minute micro-batch.", tag: "judgment" },
  { q: "The medallion zones and the rule for each.", a: "Bronze: raw, immutable, append-only (your replay source). Silver: cleaned, typed, deduped, conformed. Gold: business aggregates and marts for BI and ML.", tag: "pipeline" },
  { q: "Honest answer to 'can you guarantee exactly-once?'", a: "End-to-end exactly-once is largely a myth. I engineer effectively-once: at-least-once delivery plus an idempotent sink and a checkpoint, so duplicates are harmless.", tag: "judgment" },
  { q: "Three causes of the small-files problem.", a: "Over-partitioning (grain too fine), streaming micro-batches (a file per trigger), and too many write/shuffle partitions. Fix with right grain, repartition-on-write, and compaction/OPTIMIZE.", tag: "layout" },
  { q: "Why can't a raw S3 lake honor GDPR's right to be forgotten?", a: "Objects are immutable, there is no row-level delete. A table format (Iceberg/Delta/Hudi) supports DELETE ... WHERE and handles compaction, which is why a serious lake uses one.", tag: "governance" },
  { q: "Druid vs Pinot vs ClickHouse, one line each.", a: "Druid: Kafka-native real-time OLAP pioneer. Pinot: user-facing analytics at LinkedIn-scale QPS. ClickHouse: fast self-hosted columnar SQL. All serve sub-second aggregations on fresh streams.", tag: "platforms" },
  { q: "What two failures does a feature store prevent?", a: "Train/serve skew, training and serving read one feature definition instead of two implementations, and point-in-time leakage, via as-of joins so a training row never sees post-label values.", tag: "platforms" },
  { q: "Why not just put everything in Snowflake?", a: "Heavy Spark/ML wants a programmatic engine, open formats avoid lock-in, streaming and always-on serving fit a lake, and warehouse compute is pricey always-on. Usually run both: lake for engineering, warehouse for BI.", tag: "platforms" },
  { q: "How do you actually measure table freshness?", a: "Against event-time, not wall-clock: a last-updated watermark or audit table, dbt source freshness, Airflow SLAs, or table-format commit timestamps, compared to a declared deadline.", tag: "operate" },
  { q: "'EMR vs Snowflake', what is wrong with the question?", a: "It is often a false choice: EMR/Spark is a processing engine for heavy ETL and ML, Snowflake is a warehouse for SQL and BI. Many stacks run Spark into the lake and Snowflake serving on top, different jobs.", tag: "judgment" },
];

function QuickfireDrill() {
  return (
    <>
      <Lede>
        Twenty-four cards spanning the whole bench, the dollar and shape anchors, the pipeline-design
        judgment calls, the platform trade-offs, and the org questions. The rep that works: read the card,
        answer <strong>out loud</strong> in a sentence or two before revealing, then grade yourself
        honestly. Shuffle between runs so you drill recall, not card order, and anything you miss twice, go
        re-read the topic behind it.
      </Lede>
      <Try label="rapid fire"><QuickFire accent={ACCENT} deck={DECK} /></Try>
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
  slaops: <SlaOps />,
  snowbricks: <SnowBricks />,
  rtolap: <RtOlap />,
  featurestores: <FeatureStores />,
  datamesh: <DataMesh />,
  wellarch: <WellArch />,
  trapbank: <TrapBank />,
  redflags: <RedFlags />,
  quickfire: <QuickfireDrill />,
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
