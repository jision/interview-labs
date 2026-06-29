import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import ColumnarScanViz from "./cloud/ColumnarScanViz.jsx";
import PartitionPruningViz from "./cloud/PartitionPruningViz.jsx";

const ACCENT = "#4d9fff";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "emr", label: "EMR architecture & node roles", group: "EMR & compute" },
  { id: "emrflavors", label: "EMR on EC2 / EKS / Serverless", group: "EMR & compute" },
  { id: "scaling", label: "YARN, spot & managed scaling", group: "EMR & compute" },
  { id: "s3", label: "S3 as the data lake", group: "Storage & formats" },
  { id: "formats", label: "Parquet, ORC, Avro & columnar", group: "Storage & formats" },
  { id: "layout", label: "Partitioning, compression & small files", group: "Storage & formats" },
  { id: "catalog", label: "Glue Data Catalog & Hive metastore", group: "Catalog & query" },
  { id: "query", label: "Athena, Redshift & Spectrum", group: "Catalog & query" },
  { id: "ingest", label: "Kinesis, MSK & ingestion", group: "Ingest & orchestrate" },
  { id: "orchestrate", label: "Airflow / MWAA & Step Functions", group: "Ingest & orchestrate" },
];

/* ── EMR architecture & node roles ────────────────────────────── */
function Emr() {
  return (
    <>
      <Lede>
        EMR is AWS's managed Hadoop and Spark platform: you ask for a cluster, EMR provisions EC2 instances,
        installs the open-source stack (Spark, Hive, Trino, Flink, HBase), and wires up YARN and HDFS for
        you. The senior signal is knowing the three node roles cold, because that is what decides where the
        driver runs, where your data lives, and where it is safe to put cheap spot capacity.
      </Lede>

      <Block eyebrow="the three roles" title="Primary, core, and task nodes">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every EMR cluster has exactly one primary (master) node and one or more core nodes; task nodes are
          optional. The split matters because only some of them hold data:
        </p>
        <OpTable
          cols={["Node role", "Runs", "", "Holds HDFS data?"]}
          rows={[
            { op: "Primary / master", avg: "the brain", avgTone: "good", why: "YARN ResourceManager, the HDFS NameNode, and (in client-ish setups) the Spark driver / ApplicationMaster. Lose it and the cluster is gone, keep it on-demand." },
            { op: "Core", avg: "compute + storage", avgTone: "ok", why: "Run executors AND store HDFS blocks (the DataNodes). Scaling core down risks data, so keep them on-demand." },
            { op: "Task", avg: "compute only", avgTone: "good", why: "Run executors but store no HDFS data. Disposable, so this is the right home for spot instances." },
          ]}
        />
        <CodeBlock
          title="text"
          lang="text"
          code={`PRIMARY (1)            CORE (>=1)                 TASK (0..N)
+-----------------+    +-----------------+        +-----------------+
| ResourceManager |    | NodeManager     |        | NodeManager     |
| NameNode (HDFS) |    | DataNode (HDFS) |        | (no DataNode)   |
| driver / AM     |    | executors       |        | executors       |
+-----------------+    +-----------------+        +-----------------+
   on-demand              on-demand                 spot-friendly`}
        />
        <Callout kind="trap" title="Spot belongs on task nodes, not core">
          A reclaimed task node just loses some compute, the job recovers. A reclaimed core node can lose
          HDFS blocks and stall the cluster, and losing the primary kills the whole thing. So: primary and
          core on-demand, task on spot.
        </Callout>
      </Block>

      <Block eyebrow="getting work in" title="Bootstrap actions vs steps">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two different hooks people confuse. <strong>Bootstrap actions</strong> run once per node{" "}
          <em>before</em> the applications start, that is where you install extra libraries or write config.
          <strong> Steps</strong> are units of work submitted <em>to a running cluster</em>, a spark-submit,
          a Hive script, a JAR, and they run in sequence, which is how you build a transient pipeline cluster
          that spins up, runs N steps, and self-terminates.
        </p>
        <OpTable
          cols={["Hook", "When it runs", "", "Used for"]}
          rows={[
            { op: "Bootstrap action", avg: "node startup", avgTone: "good", why: "Once per instance before apps launch: pip/yum installs, agents, custom config. Cannot depend on the cluster being up yet." },
            { op: "Step", avg: "after cluster is ready", avgTone: "ok", why: "A job submitted to the live cluster (spark-submit, Hive, JAR), run one at a time, in order. The backbone of transient clusters." },
          ]}
        />
        <Callout kind="note" title="Transient vs long-running">
          A transient cluster runs its steps then terminates (cheap, per-job). A long-running cluster stays
          up for many interactive or streaming workloads. EMR supports both; pick transient for batch ETL.
        </Callout>
      </Block>

      <Block eyebrow="how you ask for capacity" title="Instance groups vs instance fleets">
        <p className="text-ink-dim leading-relaxed mb-2">
          When you define a cluster you choose how to express the hardware. <strong>Instance groups</strong>{" "}
          are simple: one instance type per role, scale by count. <strong>Instance fleets</strong> are the
          flexible, modern choice: per role you give a list of acceptable instance types and a target
          capacity in units, and EMR fills it from on-demand and spot pools using an allocation strategy.
        </p>
        <OpTable
          cols={["Provisioning", "Shape", "", "When to use"]}
          rows={[
            { op: "Instance groups", avg: "one type per role", avgTone: "ok", why: "Simple and predictable, but if that one spot pool is dry you do not get capacity. Fine for steady, simple clusters." },
            { op: "Instance fleets", avg: "mixed types + strategy", avgTone: "good", why: "List many types per role; EMR draws spot from the deepest pools (capacity-optimized) to cut interruptions. The default for cost + resilience." },
          ]}
        />
        <Callout kind="tip" title="Reach for fleets with capacity-optimized">
          Instance fleets plus the capacity-optimized allocation strategy let EMR pick the spot pools least
          likely to be reclaimed, which is the single biggest lever on spot interruption rate.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "EMR is managed Hadoop/Spark on EC2. There are three node roles: the primary runs the YARN
          ResourceManager and the HDFS NameNode (and the Spark driver itself only in client mode, like
          notebooks; the default cluster mode runs the driver in an ApplicationMaster on a core or task node);
          core nodes run executors and store HDFS data; task nodes are compute-only with no HDFS. That
          compute-only fact is why I put spot on task nodes and keep
          primary and core on-demand, a reclaimed task node just loses compute, a reclaimed core node can
          lose data. Bootstrap actions set up each node at startup, steps are the jobs I submit to a running
          cluster, and I provision with instance fleets and a capacity-optimized strategy so EMR pulls spot
          from the deepest pools."
        </Callout>
      </Block>
    </>
  );
}

/* ── EMR on EC2 / EKS / Serverless ────────────────────────────── */
function EmrFlavors() {
  return (
    <>
      <Lede>
        EMR comes in three deployment models, and they are a frequent design question. They are not three
        different engines, it is the same Spark/Hive/Trino, but where and how the cluster is provisioned
        changes the operational story and the bill. Pick by how much control you need versus how little you
        want to manage.
      </Lede>

      <Block eyebrow="the three flavors" title="EC2, EKS, and Serverless side by side">
        <OpTable
          cols={["Flavor", "You manage", "", "Best for"]}
          rows={[
            { op: "EMR on EC2", avg: "the cluster", avgTone: "ok", why: "Full control of instance types, bootstrap, YARN tuning. Long-running or transient clusters. The classic, most flexible option." },
            { op: "EMR on EKS", avg: "share a K8s cluster", avgTone: "good", why: "Run Spark as pods on an existing EKS cluster; container isolation, share capacity with other workloads, unify on Kubernetes." },
            { op: "EMR Serverless", avg: "nothing (no cluster)", avgTone: "good", why: "No nodes to size. It auto-provisions workers per job and you pay per vCPU-second and GB-second. Great for spiky, unpredictable load." },
          ]}
        />
        <CodeBlock
          title="text"
          lang="text"
          code={`EMR on EC2          EMR on EKS               EMR Serverless
you size cluster -> you run on shared K8s -> AWS sizes per job
+ max control       + container isolation     + zero cluster ops
+ tune everything   + share/pack capacity     + pay only while running
- you own ops       - need K8s expertise      - less low-level control`}
        />
      </Block>

      <Block eyebrow="when each wins" title="Choosing the model">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>EMR on EC2</strong> when you need deep control: specific instance types, custom AMIs,
          HBase, or steady long-running clusters you can right-size and reserve. <strong>EMR on EKS</strong>{" "}
          when the org has standardized on Kubernetes and wants Spark to share one fleet with services, with
          strong per-job container isolation. <strong>EMR Serverless</strong> when load is bursty or
          unpredictable and you would rather not pay for idle capacity or babysit autoscaling at all.
        </p>
        <Callout kind="note" title="Cost model is the tell">
          EC2 and EKS bill for provisioned capacity (idle nodes cost money). Serverless bills only for the
          vCPU and memory a job actually consumes while it runs, which is why spiky workloads love it and
          steady 24/7 workloads are often cheaper on reserved EC2.
        </Callout>
      </Block>

      <Block eyebrow="watch the edges" title="Trade-offs to name">
        <Callout kind="trap" title="Serverless is not a free lunch for everything">
          Serverless removes cluster ops but gives up some low-level control (no custom YARN knobs, fewer
          instance choices, cold-start latency on the first workers) and steady heavy usage can cost more
          than a reserved EC2 cluster. For predictable 24/7 pipelines, sized EC2 with reservations often
          wins; for unpredictable spikes, Serverless wins on both effort and idle cost.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Same Spark, three deployment models. EMR on EC2 gives me full control of the cluster, instance
          types, custom AMIs, tuning, and suits long-running or transient clusters. EMR on EKS runs Spark as
          pods on a shared Kubernetes cluster for container isolation and capacity packing when the org is
          already on K8s. EMR Serverless has no cluster to size at all, it auto-provisions workers per job
          and bills per vCPU-second and GB-second, which is ideal for spiky, unpredictable load. My rule:
          predictable 24/7 batch on reserved EC2, Kubernetes shop on EKS, and bursty or ad-hoc jobs on
          Serverless so I never pay for idle."
        </Callout>
      </Block>
    </>
  );
}

/* ── YARN, spot & managed scaling ─────────────────────────────── */
function Scaling() {
  return (
    <>
      <Lede>
        Scaling EMR well is mostly about two things: understanding that YARN hands out containers of CPU and
        memory to your executors, and being deliberate about where spot capacity goes. Get the spot placement
        wrong and a reclamation kills your driver or your data; get it right and you run the same job at a
        fraction of the cost.
      </Lede>

      <Block eyebrow="the resource layer" title="YARN: containers, not magic">
        <p className="text-ink-dim leading-relaxed mb-2">
          On EMR, Spark runs on <strong>YARN</strong>. YARN's ResourceManager (on the primary) tracks the
          cluster's total vCPU and memory; each NodeManager (on core/task nodes) offers its slice. When Spark
          asks for executors, YARN allocates <strong>containers</strong>, fixed bundles of vCPU + memory, and
          the driver schedules tasks onto them. "My executor was killed" usually means a container exceeded
          its memory and YARN reaped it.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`Spark driver  --asks YARN for-->  executors
YARN RM       --grants------------>  containers (e.g. 4 vCPU + 16 GB each)
each executor runs inside one container; tasks are scheduled onto its cores

OOM in a container  ->  YARN kills it  ->  Spark retries the tasks elsewhere`}
        />
      </Block>

      <Block eyebrow="cheap but reclaimable" title="Spot instances and where they belong">
        <p className="text-ink-dim leading-relaxed mb-2">
          Spot capacity is spare EC2 sold at up to ~90% off on-demand, with the catch that AWS can reclaim it
          on a two-minute notice. That makes spot perfect for stateless compute and dangerous for anything
          stateful:
        </p>
        <OpTable
          cols={["Node role", "On-demand or spot?", "", "Why"]}
          rows={[
            { op: "Primary", avg: "on-demand", avgTone: "good", why: "Single point of failure (NameNode, RM, driver). Never put it on spot." },
            { op: "Core", avg: "on-demand", avgTone: "ok", why: "Holds HDFS data; reclaiming it risks data loss and re-replication storms. Keep on-demand." },
            { op: "Task", avg: "spot", avgTone: "good", why: "Stateless compute, no HDFS. Reclamation just loses some executors; Spark reruns those tasks. Big savings live here." },
          ]}
        />
        <Callout kind="trap" title="Two-minute warning, not zero">
          A spot reclaim gives a 2-minute notice, and EMR drains the node gracefully where it can. Still,
          design jobs to be resilient to losing task nodes mid-run (idempotent tasks, replayable shuffles),
          and never lean on spot for the driver or HDFS.
        </Callout>
      </Block>

      <Block eyebrow="auto-resize" title="EMR Managed Scaling vs custom autoscaling">
        <p className="text-ink-dim leading-relaxed mb-2">
          You can let EMR resize the cluster for you. <strong>EMR Managed Scaling</strong> watches YARN
          metrics (pending containers, utilization) and adds or removes core/task capacity within min/max
          bounds you set, no rules to write. The older <strong>custom autoscaling</strong> made you author
          CloudWatch-based scale-out/scale-in rules per group. Managed Scaling is the modern default; pair it
          with instance fleets and a capacity-optimized strategy so the capacity it adds is the spot pool
          least likely to be reclaimed.
        </p>
        <OpTable
          cols={["Approach", "How it decides", "", "Effort"]}
          rows={[
            { op: "Managed Scaling", avg: "EMR reads YARN metrics", avgTone: "good", why: "Set min/max units; EMR scales core and task automatically. The recommended option." },
            { op: "Custom autoscaling", avg: "your CloudWatch rules", avgTone: "ok", why: "You write per-group scale rules. More control, more to maintain and tune." },
          ]}
        />
        <Callout kind="tip" title="Capacity-optimized cuts interruptions">
          With instance fleets, the capacity-optimized allocation strategy provisions spot from the pools
          with the most spare capacity, which empirically reduces interruption rate far more than chasing the
          absolute lowest price. Diversify across many instance types to deepen the pool.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Spark on EMR runs on YARN: the ResourceManager grants containers of vCPU and memory, executors
          live in those containers, and the driver schedules tasks onto them, an OOM is just a container YARN
          reaped. For cost I lean on spot, but only on task nodes, primary and core stay on-demand because
          spot can be reclaimed on a two-minute notice and I will not risk the driver or HDFS. I use EMR
          Managed Scaling rather than hand-written CloudWatch rules, and I provision with instance fleets and
          a capacity-optimized strategy across many instance types so the spot capacity it adds is the least
          likely to be interrupted."
        </Callout>
      </Block>
    </>
  );
}

/* ── S3 as the data lake ──────────────────────────────────────── */
function S3() {
  return (
    <>
      <Lede>
        The big architectural shift behind modern EMR is that S3, not HDFS, is the lake. S3 gives you eleven
        nines of durability and, crucially, decouples storage from compute: you can resize or kill the
        cluster and the data just sits there. HDFS on the core nodes is now mostly scratch space for shuffle.
        Knowing why, and where S3's object-store nature bites, is the core of this topic.
      </Lede>

      <Block eyebrow="the decoupling" title="Storage and compute pulled apart">
        <p className="text-ink-dim leading-relaxed mb-2">
          In classic Hadoop, data lived on the same nodes that computed it (HDFS), so you could not turn the
          cluster off without losing data. On S3, the data is durable and independent: spin up a cluster,
          process, tear it down, the bytes persist. That is what makes transient clusters and per-job
          Serverless viable, and it is why you can point Athena, Redshift Spectrum, and EMR at the{" "}
          <em>same</em> S3 data at once.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`CLASSIC HADOOP                  EMR + S3 (decoupled)
+----------------+              +------------------+
| compute + HDFS |              | compute (EMR)    |  <- resize / kill freely
| same machines  |              +------------------+
+----------------+                       |  EMRFS
 kill it = lose data              +------------------+
                                  | S3 (the lake)    |  <- durable, 11 nines
                                  +------------------+`}
        />
        <Callout kind="note" title="EMRFS is the connector">
          EMRFS is the S3 filesystem implementation EMR uses, so a path like s3://bucket/path reads and writes
          straight to S3. HDFS still exists on core nodes but is now mostly fast local scratch for shuffle and
          spill, not the system of record.
        </Callout>
      </Block>

      <Block eyebrow="the object-store gotchas" title="S3 is not a filesystem">
        <p className="text-ink-dim leading-relaxed mb-2">
          S3 is object storage with a flat key namespace; "directories" are just shared key prefixes. Two
          consequences bite data jobs:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Listing is slow at scale.</strong> Enumerating millions of tiny objects under a prefix is a real cost; this is half of the small-files problem.</li>
          <li><strong>Rename is copy + delete.</strong> There is no atomic directory rename, so the naive "write to temp, rename into place" commit copies every object. That is why S3-optimized committers (the EMRFS/S3A optimized committers) exist.</li>
        </ul>
        <Callout kind="trap" title="Use an S3-optimized committer">
          The default file-rename commit protocol is slow and not safe on S3's semantics. Use the EMR
          S3-optimized committer (or the S3A magic committer) so partitioned writes do not pay the
          rename-as-copy tax and do not leave partial output on failure.
        </Callout>
        <Callout kind="note" title="Consistency is no longer a worry">
          Since December 2020, S3 is strongly read-after-write consistent for all operations, so the old
          "EMRFS consistent view" workaround is obsolete. A write is immediately visible to the next read.
        </Callout>
      </Block>

      <Block eyebrow="paying for storage" title="Storage classes and lifecycle">
        <p className="text-ink-dim leading-relaxed mb-2">
          S3 has tiers for hot vs cold data, and lifecycle rules move objects between them automatically as
          they age:
        </p>
        <OpTable
          cols={["Storage class", "For", "", "Trade-off"]}
          rows={[
            { op: "S3 Standard", avg: "hot, frequent reads", avgTone: "good", why: "Lowest latency, highest storage price. Active lake partitions live here." },
            { op: "S3 Standard-IA", avg: "warm, infrequent", avgTone: "ok", why: "Cheaper storage, per-GB retrieval fee. Good for data read a few times a month." },
            { op: "S3 Glacier / Deep Archive", avg: "cold archive", avgTone: "ok", why: "Cheapest storage, retrieval takes minutes to hours. Compliance and rarely-touched history." },
          ]}
        />
        <Callout kind="tip" title="Lifecycle rules are free savings">
          Aging old partitions to Standard-IA and then Glacier with a lifecycle policy can cut storage cost
          dramatically with no code change, just make sure query engines are not still scanning the archived
          prefixes.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "S3 is the durable lake, eleven nines, and it decouples storage from compute, so I can resize or
          kill the EMR cluster and the data persists, which is exactly what makes transient clusters and
          Serverless work, and lets Athena, Redshift Spectrum, and EMR all read the same data. EMRFS is the
          S3 connector; HDFS on core nodes is now just scratch for shuffle. The catch is that S3 is object
          storage: listing millions of small objects is slow and rename is copy-and-delete, so I use an
          S3-optimized committer for partitioned writes. S3 has been strongly read-after-write consistent
          since 2020, and I use storage classes plus lifecycle rules to tier cold data down to Glacier."
        </Callout>
      </Block>
    </>
  );
}

/* ── Parquet, ORC, Avro & columnar ────────────────────────────── */
function Formats() {
  return (
    <>
      <Lede>
        File format is one of the highest-leverage decisions in a lake, and it comes down to row versus
        columnar. Row formats (CSV, JSON, Avro) store a record at a time; columnar formats (Parquet, ORC)
        store a column at a time, which is what makes analytic scans cheap. For Spark and Athena the default
        answer is Parquet with Snappy, and you should be able to say exactly why.
      </Lede>

      <Block eyebrow="row vs columnar" title="The fundamental split">
        <p className="text-ink-dim leading-relaxed mb-2">
          A query like <code className="font-mono">SELECT region, amount ...</code> touches two columns. A row
          format has to read every field of every record to get them; a columnar format reads just those two
          column chunks. That is the whole game for analytics.
        </p>
        <OpTable
          cols={["Format", "Layout", "", "Where it fits"]}
          rows={[
            { op: "CSV / JSON", avg: "row, text", avgTone: "bad", why: "Human-readable, no schema, no stats, must scan everything. Fine for tiny files and interchange, bad for analytics at scale." },
            { op: "Avro", avg: "row, binary", avgTone: "ok", why: "Compact binary with the schema embedded; excellent for streaming/ingest and schema evolution. Row layout, so still scans whole records on read." },
            { op: "Parquet", avg: "columnar, binary", avgTone: "good", why: "The analytics default for Spark/Athena. Column pruning, per-column compression/encoding, and row-group min/max stats for predicate pushdown." },
            { op: "ORC", avg: "columnar, binary", avgTone: "good", why: "Same columnar benefits; pairs especially well with Hive and has strong lightweight indexes. Parquet and ORC are close cousins." },
          ]}
        />
        <CodeBlock
          title="text"
          lang="text"
          code={`ROW (CSV/Avro):    [r1: a b c][r2: a b c][r3: a b c]  -> read all to get column b
COLUMNAR (Parquet): [a a a][b b b][c c c]              -> read only the b chunk

Parquet file = row groups, each row group splits into column chunks,
each column chunk carries min/max stats  ->  skip groups that cannot match`}
        />
      </Block>

      <Block eyebrow="why columnar is cheap" title="Pruning, encoding, and pushdown">
        <p className="text-ink-dim leading-relaxed mb-2">
          Columnar formats win three ways at once. <strong>Column pruning</strong>: read only the columns the
          query selects. <strong>Encoding and compression</strong>: a column holds similar values, so
          dictionary encoding and run-length encoding (RLE) plus a codec shrink it hard. <strong>Predicate
          pushdown</strong>: each row group stores per-column min/max statistics, so a{" "}
          <code className="font-mono">WHERE amount &gt; 1000</code> can skip whole row groups whose max is
          below 1000 without reading them.
        </p>
        <Callout kind="note" title="Stats are what make filters fast">
          The min/max (and sometimes bloom filters) per row group are why a selective WHERE on a sorted or
          clustered column reads a fraction of the file. Sorting data on the columns you filter on amplifies
          this skipping dramatically.
        </Callout>
      </Block>

      <Try label="columnar vs row, watch the bytes scanned">
        <ColumnarScanViz />
      </Try>

      <Block eyebrow="choosing" title="Avro for the pipe, Parquet for the table">
        <p className="text-ink-dim leading-relaxed mb-2">
          A common, defensible architecture: land streaming/ingest data as <strong>Avro</strong> (row format,
          embedded schema, friendly to schema evolution and record-at-a-time writes), then compact and convert
          to <strong>Parquet</strong> for the curated, query-served tables. Use <strong>ORC</strong> if your
          stack is Hive-centric. For Spark and Athena, Parquet + Snappy is the safe default.
        </p>
        <Callout kind="tip" title="Schema evolution lives in the format">
          Avro and Parquet both support schema evolution (adding columns, etc.), but Avro's embedded,
          per-record schema makes it the friendlier choice on the ingest side where producers change
          frequently. Convert to Parquet once the schema is stable and the data is read often.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "It is row versus columnar. CSV and JSON are row, text, no stats, so you scan everything, fine for
          interchange, bad at scale. Avro is row but compact binary with an embedded schema, great for
          streaming ingest and schema evolution. Parquet and ORC are columnar and the analytics default: they
          let me prune to just the columns I select, compress hard with dictionary and run-length encoding,
          and skip row groups using per-group min/max stats, that is predicate pushdown. For Spark and Athena
          I default to Parquet with Snappy; I will land raw ingest as Avro and convert to Parquet for the
          curated tables, and use ORC when the stack is Hive-heavy."
        </Callout>
      </Block>
    </>
  );
}

/* ── Partitioning, compression & small files ──────────────────── */
function Layout() {
  return (
    <>
      <Lede>
        Format chooses how a file is laid out; this topic chooses how files are laid out across S3. Three
        levers dominate cost and speed: Hive-style partitioning so engines can prune whole prefixes,
        compression codec choice, and the small-files problem, which quietly wrecks more pipelines than any
        of them. Senior candidates talk about all three together because over-partitioning to win pruning is
        exactly how you create the small-files problem.
      </Lede>

      <Block eyebrow="prune whole prefixes" title="Hive-style partitioning">
        <p className="text-ink-dim leading-relaxed mb-2">
          Writing data under partition-key directories, <code className="font-mono">s3://lake/events/dt=2026-01-15/</code>,
          lets an engine read a <code className="font-mono">WHERE dt = '2026-01-15'</code> and skip every
          other date's prefix entirely, before reading a byte. That is partition pruning, and it is the
          biggest single win on a date-partitioned table. <strong>Bucketing</strong> goes further by hashing a
          column (say customer_id) into a fixed number of files so joins and aggregations on that key get
          locality and avoid a shuffle.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`s3://lake/events/
   dt=2026-01-14/  part-0000.snappy.parquet
   dt=2026-01-15/  part-0000.snappy.parquet   <- WHERE dt='2026-01-15'
   dt=2026-01-16/  part-0000.snappy.parquet      reads only this prefix`}
        />
      </Block>

      <Try label="narrow the date filter, watch partitions get pruned">
        <PartitionPruningViz />
      </Try>

      <Block eyebrow="the silent killer" title="The small-files problem">
        <p className="text-ink-dim leading-relaxed mb-2">
          Thousands of tiny files (a few KB each) are death by a thousand cuts: S3 listing balloons, every
          file is a separate task with fixed overhead, and you read tiny scattered chunks instead of big
          sequential ones. Streaming writes and over-partitioning both produce them. The fix is{" "}
          <strong>compaction</strong>: rewrite many small files into fewer large ones, targeting roughly
          128-512 MB per file, which lines up with how Spark sizes splits.
        </p>
        <OpTable
          cols={["Symptom", "Cause", "", "Fix"]}
          rows={[
            { op: "Slow listing + scheduling", avg: "too many tiny files", avgTone: "bad", why: "Each object is a list entry and a task. Compact to ~128-512 MB files; coalesce/repartition before writing." },
            { op: "Tiny files appearing", avg: "over-partitioning", avgTone: "bad", why: "dt + hour + customer splits data so fine each partition is a sliver. Partition coarser; bucket instead of partitioning high-cardinality keys." },
          ]}
        />
        <Callout kind="trap" title="Over-partitioning trades one problem for another">
          Finer partitions prune better but shrink each partition toward the small-files cliff. Balance:
          partition on low-cardinality, commonly-filtered keys (date, region), and use bucketing for
          high-cardinality keys you join on, not partitioning.
        </Callout>
      </Block>

      <Block eyebrow="squeeze the bytes" title="Compression codecs">
        <OpTable
          cols={["Codec", "Profile", "", "Use when"]}
          rows={[
            { op: "Snappy", avg: "fast, splittable in Parquet", avgTone: "good", why: "Moderate ratio, very fast, the default for Parquet on Spark/Athena. Splittable inside Parquet row groups so parallelism is preserved." },
            { op: "Zstd", avg: "great ratio + speed", avgTone: "good", why: "Better compression than Snappy at comparable speed; increasingly the modern default where supported." },
            { op: "Gzip", avg: "small but slow", avgTone: "ok", why: "Higher ratio, slower, and NOT splittable as raw text, one giant gzip CSV is read by a single task. Avoid for big text inputs." },
          ]}
        />
        <Callout kind="note" title="Splittability matters more than ratio">
          Inside Parquet, compression is per column chunk so the file stays splittable regardless of codec.
          The splittability trap is raw text: a single large gzip .csv cannot be split, so one task reads it
          all. Prefer Snappy or Zstd inside Parquet, and avoid huge non-splittable gzip text files.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Three levers. Hive-style partitioning, writing under dt= directories, lets the engine prune whole
          prefixes from a WHERE before reading anything, and bucketing hashes a join key into fixed files to
          avoid shuffles. Compression: Snappy is the fast splittable default in Parquet, Zstd gives a better
          ratio at similar speed, and I avoid raw gzip text because it is not splittable so one task reads the
          whole file. And the small-files problem, thousands of tiny files blow up S3 listing and task
          overhead, so I compact to roughly 128 to 512 MB files. The tension to call out is that
          over-partitioning is what creates small files, so I partition coarsely on date or region and bucket
          high-cardinality keys instead."
        </Callout>
      </Block>
    </>
  );
}

/* ── Glue Data Catalog & Hive metastore ───────────────────────── */
function Catalog() {
  return (
    <>
      <Lede>
        Files in S3 are not a table until something records their schema, partitions, and location. That
        something is a metastore, and on AWS the standard answer is the Glue Data Catalog, a managed,
        serverless Hive metastore shared across Athena, EMR, Redshift Spectrum, and Glue ETL. The key mental
        model: the catalog is metadata only, the data never leaves S3.
      </Lede>

      <Block eyebrow="metadata, not data" title="What the catalog actually stores">
        <p className="text-ink-dim leading-relaxed mb-2">
          The Glue Data Catalog is a drop-in Hive metastore. Per table it records the schema (columns and
          types), the S3 location, the file format/SerDe, and the list of partitions and their locations.
          Engines look up that metadata to know how to read the bytes; the bytes themselves stay in S3. One
          catalog, many engines:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`            +---------------------------+
            |   Glue Data Catalog       |  schema, partitions, location
            |   (managed Hive metastore)|  (METADATA ONLY)
            +---------------------------+
              ^      ^        ^       ^
            Athena  EMR   Redshift   Glue ETL    <- all share one catalog
              |      |    Spectrum     |
              +------+-----+-----------+
                          v
                  +----------------+
                  |   S3 (data)    |   <- the actual files
                  +----------------+`}
        />
        <Callout kind="note" title="Hive metastore compatibility">
          Because it speaks the Hive metastore API, EMR's Spark/Hive can use the Glue catalog directly instead
          of running a self-managed metastore on the cluster, so table definitions survive cluster teardown
          and are shared with Athena and Redshift.
        </Callout>
      </Block>

      <Block eyebrow="discovering schema" title="Crawlers and partitions">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>Glue crawler</strong> points at an S3 prefix, samples the files, infers the schema and the
          partition structure (the dt= directories), and writes table definitions into the catalog. It is the
          easy on-ramp, but for high-partition tables, listing every partition is slow and crawlers can be
          costly to run constantly.
        </p>
        <Callout kind="tip" title="Partition projection beats slow partition listing">
          For tables partitioned on a predictable pattern (like a date range), Athena's partition projection
          lets you describe the partition scheme in table properties so the engine computes partition
          locations on the fly instead of listing or crawling them. For large, regularly-shaped tables this is
          much faster and cheaper than maintaining partitions via a crawler.
        </Callout>
      </Block>

      <Block eyebrow="watch the edges" title="Partitions can drift">
        <Callout kind="trap" title="New partitions are invisible until registered">
          Drop new dt= folders in S3 and a query will not see them until the catalog knows: run the crawler,
          MSCK REPAIR / ALTER TABLE ADD PARTITION, or use partition projection. A frequent "where did my new
          data go?" bug is simply unregistered partitions, the files are there, the metadata is not.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Files in S3 are not a table until a metastore records their schema, location, and partitions. On
          AWS that is the Glue Data Catalog, a managed, serverless Hive metastore shared across Athena, EMR,
          Redshift Spectrum, and Glue ETL, so one table definition serves every engine and survives cluster
          teardown. It is metadata only, the data stays in S3. Crawlers infer schema and partitions
          automatically, but for big regularly-partitioned tables I prefer partition projection so the engine
          computes partition locations instead of slowly listing them. And the classic gotcha is that new S3
          partitions are invisible until they are registered in the catalog."
        </Callout>
      </Block>
    </>
  );
}

/* ── Athena, Redshift & Spectrum ──────────────────────────────── */
function Query() {
  return (
    <>
      <Lede>
        Once the lake and catalog exist, you query them, and the two AWS workhorses split cleanly. Athena is
        serverless SQL straight over S3, billed per terabyte scanned, so the layout decisions from the storage
        topics translate directly into dollars. Redshift is an MPP warehouse for fast, high-concurrency BI on
        loaded data, and Spectrum is the bridge that lets Redshift reach back into S3.
      </Lede>

      <Block eyebrow="serverless SQL on the lake" title="Athena: pay per byte scanned">
        <p className="text-ink-dim leading-relaxed mb-2">
          Athena is managed Trino/Presto: no cluster, you point SQL at S3 tables in the Glue catalog and pay{" "}
          <strong>$5 per terabyte scanned</strong>. That pricing model is why everything from the storage
          topics matters, columnar Parquet, partition pruning, and compression each cut the bytes scanned,
          and therefore the bill, directly.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`Athena cost  =  (bytes scanned / 1 TB) * $5

  CSV, no partitions, full scan   ->  scans everything    -> $$$$
  Parquet + partition pruning     ->  scans a sliver       -> $
  same query, same data, different layout = 10-100x cost gap`}
        />
        <Callout kind="tip" title="Layout is the cost lever">
          You cannot tune Athena's hardware, you only control how much it has to read. Convert to Parquet,
          partition on your filter columns, compress, and compact small files, and a query that scanned 1 TB
          now scans tens of GB for a fraction of the cost. This is the single most repeated Athena lesson.
        </Callout>
      </Block>

      <Block eyebrow="the warehouse" title="Redshift and Redshift Spectrum">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Redshift</strong> is a massively-parallel (MPP) columnar data warehouse: you load curated
          data into it and get very fast, high-concurrency SQL, ideal for dashboards and repeated BI where
          many users hit the same tables all day. <strong>Redshift Spectrum</strong> lets a Redshift cluster
          query data that is still in S3, via the same Glue catalog, so you can join loaded warehouse tables
          to cold lake data without loading it first.
        </p>
        <OpTable
          cols={["Engine", "Data lives", "", "Sweet spot"]}
          rows={[
            { op: "Athena", avg: "in S3 (the lake)", avgTone: "good", why: "Serverless, ad-hoc and exploratory SQL over the lake, pay per scan. No infra to run; great for irregular query load." },
            { op: "Redshift", avg: "loaded into the cluster", avgTone: "good", why: "MPP warehouse for fast, high-concurrency curated BI. Best when the same tables are queried heavily and repeatedly." },
            { op: "Redshift Spectrum", avg: "in S3, queried from Redshift", avgTone: "ok", why: "Extend Redshift to lake data via the catalog; join hot warehouse tables to cold S3 history without loading." },
          ]}
        />
        <Callout kind="note" title="Athena for ad-hoc, Redshift for curated BI">
          The clean dividing line: Athena when load is irregular and you want zero infra over the lake;
          Redshift when many users hammer curated tables and you need consistent low latency and high
          concurrency. Spectrum and federated queries blur them into one lakehouse picture.
        </Callout>
      </Block>

      <Block eyebrow="the bigger pattern" title="Federation and the lakehouse">
        <p className="text-ink-dim leading-relaxed mb-2">
          Both engines support <strong>federated queries</strong>, reaching into other stores (RDS, DynamoDB,
          etc.) and joining them to lake data. Combined with the shared Glue catalog and open table formats
          (Iceberg, Hudi, Delta) on S3, this is the <strong>lakehouse</strong> pattern: one open copy of the
          data in S3, queried by many engines, with warehouse-grade features (ACID, time travel, upserts)
          layered on via the table format.
        </p>
        <Callout kind="tip" title="Open table formats are the modern lakehouse layer">
          Iceberg (and Hudi/Delta) add transactions, schema evolution, and row-level updates on top of
          Parquet in S3, so you get warehouse semantics without leaving the lake. Athena, EMR Spark, and
          Redshift can all read them through the catalog, which is where staff-level lake design is heading.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Athena is serverless Trino over S3, billed at about $5 per terabyte scanned, so columnar Parquet,
          partition pruning, and compression cut the bill directly, layout is the only lever I have. Redshift
          is an MPP columnar warehouse for fast, high-concurrency BI on data I have loaded, and Redshift
          Spectrum lets Redshift query S3 through the same Glue catalog so I can join hot warehouse tables to
          cold lake data without loading it. Rule of thumb: Athena for ad-hoc and irregular queries over the
          lake, Redshift for heavy repeated curated BI. With open table formats like Iceberg on S3, both
          converge into one lakehouse, one open copy of the data, many engines."
        </Callout>
      </Block>
    </>
  );
}

/* ── Kinesis, MSK & ingestion ─────────────────────────────────── */
function Ingest() {
  return (
    <>
      <Lede>
        Before anything reaches the lake it has to be ingested, and the two streaming backbones on AWS are
        Kinesis Data Streams and Amazon MSK (managed Kafka). They share the same shape, an ordered, sharded,
        replayable log, and the choice is mostly AWS-native simplicity versus open-source portability. The
        senior part is the delivery-semantics conversation: at-least-once by default, exactly-once only with
        idempotency.
      </Lede>

      <Block eyebrow="the two backbones" title="Kinesis Data Streams vs Amazon MSK">
        <p className="text-ink-dim leading-relaxed mb-2">
          Both are partitioned, append-only logs: producers write records, the stream splits into{" "}
          <strong>shards</strong> (Kinesis) or <strong>partitions</strong> (Kafka), ordering is guaranteed{" "}
          <em>within</em> a shard/partition (keyed by partition key), and consumers read at their own offset
          within a retention window. The difference is who runs it.
        </p>
        <OpTable
          cols={["System", "Nature", "", "Pick when"]}
          rows={[
            { op: "Kinesis Data Streams", avg: "AWS-native, sharded", avgTone: "good", why: "Fully managed, tight IAM/Lambda/Firehose integration, scale by shard count. Least ops; the default for AWS-only stacks." },
            { op: "Amazon MSK", avg: "managed Apache Kafka", avgTone: "good", why: "Real Kafka API and ecosystem (Connect, Streams), portable off AWS, higher throughput ceilings. Pick for Kafka compatibility or existing Kafka tooling." },
            { op: "Kinesis Firehose", avg: "load, not a log", avgTone: "ok", why: "Not a stream you consume from, a delivery pipe that batches and loads straight to S3/Redshift/OpenSearch, with optional format conversion. Easiest lake landing." },
          ]}
        />
        <Callout kind="note" title="Firehose is for loading, not consuming">
          Do not confuse Firehose with Data Streams. Data Streams is a durable, replayable log many consumers
          read. Firehose is a fire-and-forget delivery service that buffers and writes to a destination, you
          do not read back from it.
        </Callout>
      </Block>

      <Block eyebrow="ordering and replay" title="Shards, keys, and retention">
        <p className="text-ink-dim leading-relaxed mb-2">
          Throughput scales with shard/partition count, and the <strong>partition key</strong> decides which
          shard a record lands on, so all records for one key stay ordered together. Data is retained for a
          window (hours to days, configurable), which is what makes streams <strong>replayable</strong>:
          consumers can rewind and reprocess. There is no global ordering across shards, only per-shard.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`producer --(partition key)--> shard chooses by key
   key "user-42" -> shard 2 : [e1][e2][e3]  ordered within the shard
   key "user-99" -> shard 5 : [e1][e2]      ordered within the shard
                              ^ no ordering ACROSS shards
consumers track an offset; within retention they can replay from any point`}
        />
      </Block>

      <Block eyebrow="how often, exactly" title="Delivery semantics and batch ingest">
        <p className="text-ink-dim leading-relaxed mb-2">
          Streaming systems are <strong>at-least-once</strong> by default: on retry a record can be delivered
          twice. <strong>Exactly-once</strong> end to end is achieved by making consumers{" "}
          <strong>idempotent</strong>, dedupe on a record id or use idempotent upserts, so a replay is
          harmless. Not everything streams: <strong>batch ingest</strong> uses AWS DMS for database
          replication/CDC, or Glue/Spark jobs to bulk-load files.
        </p>
        <Callout kind="trap" title="Design for duplicates, do not assume exactly-once">
          Assuming the stream gives you exactly-once is the classic mistake. Default is at-least-once, so build
          consumers that dedupe (idempotent writes keyed by a unique record id). That single design choice is
          what makes reprocessing and replays safe.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "The two streaming backbones are Kinesis Data Streams and Amazon MSK. Both are partitioned,
          replayable logs, ordering is per shard or partition by the partition key, and consumers track their
          own offset within a retention window. Kinesis is AWS-native and lowest-ops with tight Lambda and
          Firehose integration; MSK is managed Kafka, so I pick it for the Kafka API, ecosystem, and
          portability. Firehose is a delivery pipe straight into S3 or Redshift, not a log you consume from.
          For batch I use DMS for database CDC or Glue/Spark for bulk loads. And I always design for
          at-least-once, exactly-once only comes from idempotent, deduping consumers."
        </Callout>
      </Block>
    </>
  );
}

/* ── Airflow / MWAA & Step Functions ──────────────────────────── */
function Orchestrate() {
  return (
    <>
      <Lede>
        A pipeline is a set of jobs with dependencies, schedules, retries, and SLAs, and something has to
        drive that. The two AWS answers are Airflow (managed as MWAA) for code-first DAGs with rich
        dependencies and backfills, and Step Functions for serverless state-machine orchestration wired
        tightly into AWS services. The interview wants the trade-off and the discipline: idempotent,
        retryable tasks.
      </Lede>

      <Block eyebrow="the two orchestrators" title="Airflow / MWAA vs Step Functions">
        <OpTable
          cols={["Orchestrator", "Model", "", "Best for"]}
          rows={[
            { op: "Airflow (MWAA)", avg: "code-first Python DAGs", avgTone: "good", why: "Rich dependencies, scheduling, backfills, a huge operator/provider ecosystem. MWAA is managed Airflow. The default for complex, evolving data pipelines." },
            { op: "Step Functions", avg: "serverless state machine", avgTone: "good", why: "JSON/ASL states, no servers, deep native integration (EMR steps, Glue, Lambda, ECS), pay per transition. Great for serverless, event-driven, AWS-centric flows." },
            { op: "EMR Steps", avg: "in-cluster sequencing", avgTone: "ok", why: "Run an ordered list of jobs on one cluster. Fine for a self-contained transient cluster, not a cross-service scheduler." },
          ]}
        />
        <CodeBlock
          title="text"
          lang="text"
          code={`AIRFLOW / MWAA                     STEP FUNCTIONS
ingest >> transform >> publish     [Ingest]->[Transform]->[Publish]
  code-first Python DAG              JSON state machine, serverless
  backfills, complex deps           native AWS service integrations
  you run/scale workers (MWAA mgs)  pay per state transition`}
        />
      </Block>

      <Block eyebrow="when each wins" title="Choosing the driver">
        <p className="text-ink-dim leading-relaxed mb-2">
          Reach for <strong>Airflow/MWAA</strong> when the pipeline is complex and evolving, lots of
          inter-task dependencies, backfills over historical dates, dynamic DAGs, and you want everything in
          version-controlled Python with a mature ecosystem. Reach for <strong>Step Functions</strong> when
          the workflow is serverless and event-driven, you want no infrastructure to run, and the steps are
          mostly native AWS services (kick off an EMR step, run a Glue job, call a Lambda) with built-in retry
          and error handling. Use <strong>EMR Steps</strong> only to sequence jobs inside a single cluster.
        </p>
        <Callout kind="note" title="Backfills are the Airflow tell">
          If the requirement says "reprocess the last 90 days" or "complex branching dependencies that change
          often," that is Airflow's home turf. If it says "serverless, event-triggered, chain a few AWS
          services with retries," that is Step Functions.
        </Callout>
      </Block>

      <Block eyebrow="the discipline" title="Idempotent, retryable, with SLAs">
        <p className="text-ink-dim leading-relaxed mb-2">
          Whatever the orchestrator, the tasks must be <strong>idempotent and retryable</strong>: rerunning a
          task (after a failure, a retry, or a backfill) must produce the same result, not duplicates. That is
          what lets the orchestrator retry safely and lets you backfill without corrupting data. Layer on{" "}
          <strong>SLAs and alerting</strong> so a late or failed run pages someone before downstream consumers
          notice.
        </p>
        <Callout kind="trap" title="Non-idempotent tasks make retries dangerous">
          If a task appends rows instead of overwriting a partition, every retry double-writes. Design tasks
          to overwrite the partition they own (or upsert by key) so a retry is a no-op on data, that is the
          property that makes the whole pipeline safe to re-run.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Two orchestrators. Airflow, managed as MWAA, is code-first Python DAGs, and I reach for it when the
          pipeline is complex, dependencies evolve, and I need backfills and a rich operator ecosystem. Step
          Functions is a serverless state machine with deep native integration, EMR steps, Glue, Lambda, so I
          use it for event-driven, AWS-centric flows with no infra to run, paying per transition. EMR Steps
          just sequence jobs inside one cluster. The non-negotiable across all of them is that every task is
          idempotent and retryable, overwrite the partition it owns or upsert by key, so retries and backfills
          never duplicate data, and I attach SLAs and alerting so late or failed runs page before consumers
          notice."
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  emr: <Emr />,
  emrflavors: <EmrFlavors />,
  scaling: <Scaling />,
  s3: <S3 />,
  formats: <Formats />,
  layout: <Layout />,
  catalog: <Catalog />,
  query: <Query />,
  ingest: <Ingest />,
  orchestrate: <Orchestrate />,
};

export default function CloudStack() {
  const [active, setActive] = useState("emr");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="The platform · the HOW"
      title="Cloud Data Stack"
      subtitle="EMR and the AWS data plane around Spark, cluster shapes, S3 as the lake, file formats and compression, the Glue catalog, and the query engines that read it all."
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
