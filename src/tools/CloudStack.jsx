import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import ColumnarScanViz from "./cloud/ColumnarScanViz.jsx";
import PartitionPruningViz from "./cloud/PartitionPruningViz.jsx";
import { QuickFire } from "../components/QuickFire.jsx";

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
  { id: "security", label: "IAM, KMS & lake security", group: "Security & network" },
  { id: "networking", label: "VPC & data-plane networking", group: "Security & network" },
  { id: "redshift", label: "Redshift internals & tuning", group: "Warehouse & streaming" },
  { id: "kafka", label: "Kafka & Kinesis internals", group: "Warehouse & streaming" },
  { id: "flink", label: "Flink essentials", group: "Warehouse & streaming" },
  { id: "emrops", label: "EMR ops & failure playbook", group: "Operations" },
  { id: "dr", label: "DR & multi-region", group: "Operations" },
  { id: "airflowdeep", label: "Airflow internals & backfills", group: "Operations" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
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

/* ── IAM, KMS & lake security ──────────────────────────────────── */
function Security() {
  return (
    <>
      <Lede>
        Security on EMR trips people up because there are several IAM roles doing different jobs and folks
        blur them together. The senior move is to name the role trio precisely, know that SSE-KMS buys you an
        audit trail at a real cost, and reach for bucket-level defaults (encryption, TLS-only) rather than
        trusting every job to do the right thing.
      </Lede>

      <Block eyebrow="the role trio" title="Service role, instance profile, runtime roles">
        <p className="text-ink-dim leading-relaxed mb-2">
          Three IAM identities show up on an EMR cluster, and mixing them up is the classic tell that
          someone has not actually operated one:
        </p>
        <OpTable
          cols={["Role", "Attached to", "", "What it actually does"]}
          rows={[
            { op: "EMR service role", avg: "the EMR service", avgTone: "ok", why: "Lets EMR provision infrastructure on your behalf, launch EC2, create security groups, manage the cluster. It is NOT what your job uses to read data." },
            { op: "EC2 instance profile", avg: "the cluster's EC2 nodes", avgTone: "good", why: "The role your Spark job's S3 access actually assumes at runtime. When code reads s3://, EMRFS uses these instance-profile credentials. This is the one that governs data access by default." },
            { op: "Runtime roles", avg: "a single submitted job", avgTone: "good", why: "Per-job identity: submit a step under a specific IAM role so different jobs on one cluster get different permissions, and it integrates with Lake Formation for fine-grained table and column access." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          They want to hear that the EC2 instance profile, not the service role, is what your Spark job uses
          for S3, and that runtime roles plus Lake Formation are how you get per-job identity on a shared
          cluster. Naming the trio correctly is the senior signal.
        </Callout>
      </Block>

      <Block eyebrow="encryption at rest" title="SSE-S3 vs SSE-KMS, and the Bucket Keys fix">
        <p className="text-ink-dim leading-relaxed mb-2">
          S3 server-side encryption comes in two common flavors, and the choice is about key control and
          auditing versus cost:
        </p>
        <OpTable
          cols={["Option", "Keys", "", "Trade-off"]}
          rows={[
            { op: "SSE-S3 (AES-256)", avg: "S3-managed", avgTone: "ok", why: "Free, zero config, but no per-key audit trail and no control over rotation or access. Fine when compliance does not demand key governance." },
            { op: "SSE-KMS", avg: "KMS-managed (CMK)", avgTone: "good", why: "CloudTrail audit of every key use, rotation, grants, and policy control. But every request costs a KMS call (GenerateDataKey / Decrypt) and KMS throttles at high request rates, which bites TB-scale Spark jobs." },
            { op: "Client-side (CSE)", avg: "you manage", avgTone: "ok", why: "Encrypt before upload; S3 never sees plaintext or keys. Rare, operationally heavy, used only under strict data-custody requirements." },
          ]}
        />
        <Callout kind="trap" title="SSE-KMS throttling and the Bucket Keys fix">
          A Spark job that reads millions of objects makes millions of KMS calls, which racks up cost and
          hits the per-key request-rate limit, throttling the job. Turn on S3 Bucket Keys: S3 uses a
          short-lived bucket-level data key so it calls KMS a tiny fraction as often, cutting KMS cost and
          throttling dramatically while keeping full key control (rotation, grants, policy). The one
          tradeoff to name: fewer KMS calls means CloudTrail logs them coarser, at the bucket level rather
          than per object.
        </Callout>
      </Block>

      <Block eyebrow="who can touch the bucket" title="Bucket policy vs IAM policy, and explicit deny">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two policy types govern S3 access from opposite ends. An <strong>IAM policy</strong> is
          principal-based, attached to a user or role, saying "this identity may do X." A{" "}
          <strong>bucket policy</strong> is resource-based, attached to the bucket, saying "these principals
          may do X to me." The effective permission is the <strong>union</strong> of what applies, with one
          override: an <strong>explicit Deny always wins</strong> over any Allow.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`effective access = (IAM allows)  UNION  (bucket policy allows)
   ... but any explicit DENY anywhere  ->  blocked, no matter the allows

TLS-only bucket policy (a standard baseline):
   Deny  s3:*  when  aws:SecureTransport = false
   -> refuses any request not over HTTPS`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The <code className="font-mono">aws:SecureTransport</code> condition is how you enforce in-transit
          encryption at the bucket: deny anything not on TLS. Pair it with a default-encryption setting so
          objects are always encrypted at rest even if a writer forgets to ask.
        </p>
      </Block>

      <Block eyebrow="secrets and cluster config" title="Secrets Manager and security configurations">
        <p className="text-ink-dim leading-relaxed mb-2">
          Never hardcode credentials in a <strong>bootstrap script</strong>: bootstrap actions and their
          arguments land in the cluster logs in S3, so a password in a bootstrap arg is a password in a log
          file. Pull secrets at runtime from <strong>Secrets Manager</strong> or <strong>SSM Parameter
          Store</strong> using the instance profile. For the cluster itself, an EMR{" "}
          <strong>security configuration</strong> is a reusable object that sets at-rest encryption (S3, EBS,
          local disk), in-transit encryption (TLS between nodes), and authentication (Kerberos) in one place,
          applied at cluster creation.
        </p>
        <Callout kind="note" title="Lake Formation is where fine-grained governance lives">
          For row, column, and table-level permissions across the lake, the answer is Lake Formation layered
          on the Glue catalog, tied to EMR runtime roles. That governance layer is a topic of its own; here
          the point is that IAM plus bucket policies are the coarse gate and Lake Formation is the fine one.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>My Spark job on EMR gets AccessDenied reading a bucket, but the service role has s3 access. Why?</strong>{" "}
            Because at runtime the job uses the EC2 instance profile, not the service role. Fix the instance
            profile's policy (or the bucket policy), not the service role.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Our KMS bill spiked and jobs started throttling. What happened?</strong>{" "}
            SSE-KMS makes a KMS API call per object; a large scan blows past the per-key request-rate limit.
            Enable S3 Bucket Keys to collapse those into far fewer calls, and consider batching or fewer,
            larger objects.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you give two teams on one shared long-running cluster different data access?</strong>{" "}
            EMR runtime roles: each job is submitted under its own IAM role, and Lake Formation enforces
            table and column grants per role, instead of everyone sharing the one instance profile.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you guarantee nothing writes plaintext or talks to S3 over plain HTTP?</strong>{" "}
            Bucket default encryption forces at-rest encryption on every write, and a bucket policy that
            denies requests where aws:SecureTransport is false forces TLS. Explicit denies win, so it is
            airtight.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Three roles: the EMR service role provisions infra, the EC2 instance profile is what my Spark job
          actually uses for S3, and runtime roles give per-job identity with Lake Formation. For encryption I
          default to SSE-KMS for the audit trail and key control, but I turn on S3 Bucket Keys so per-request
          KMS calls do not cost a fortune or throttle. IAM and bucket policies combine as a union with
          explicit deny winning, and I enforce TLS with aws:SecureTransport."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The role trio is the thing people fumble. The service role lets EMR launch and manage the cluster;
          the EC2 instance profile is attached to the nodes and is what EMRFS uses when my job reads s3://,
          so that is the role that governs data access by default; runtime roles let me submit a job under a
          specific identity so two teams on one cluster get different permissions, and that hooks into Lake
          Formation for column and row-level grants. On encryption, SSE-S3 is free but ungoverned, SSE-KMS
          gives me CloudTrail auditing and key control but charges a KMS call per object and throttles at
          high TPS, so on TB-scale jobs I enable S3 Bucket Keys to cut those calls dramatically. Access is
          the union of IAM (principal-based) and bucket policies (resource-based), with explicit deny always
          winning, and I use a TLS-only bucket policy plus default encryption so nothing writes plaintext or
          talks over plain HTTP. Secrets never go in bootstrap scripts because those land in logs, I pull
          them from Secrets Manager at runtime, and I set at-rest and in-transit encryption once via an EMR
          security configuration."
        </Callout>
      </Block>
    </>
  );
}

/* ── VPC & data-plane networking ───────────────────────────────── */
function Networking() {
  return (
    <>
      <Lede>
        The networking question is really a cost-and-egress question in disguise. EMR lives in a subnet, and
        the single biggest mistake is routing bulk S3 traffic through a NAT gateway and paying per gigabyte
        for data that could have gone through a free gateway endpoint. Knowing the endpoint story cold is how
        you avoid a five-figure surprise on the bill.
      </Lede>

      <Block eyebrow="where the cluster sits" title="Private subnets and the two ways out to S3">
        <p className="text-ink-dim leading-relaxed mb-2">
          Production EMR clusters run in <strong>private subnets</strong> (no public IPs), which means every
          call out to AWS services has to reach the service somehow. For S3 there are two paths, and they
          differ by an order of magnitude in cost:
        </p>
        <OpTable
          cols={["Path to S3", "Nature", "", "Cost"]}
          rows={[
            { op: "S3 gateway endpoint", avg: "route-table entry", avgTone: "good", why: "A VPC gateway endpoint (S3 and DynamoDB only) adds a prefix-list route so S3 traffic stays on the AWS network. No hourly and no per-GB charge, it is FREE. Always add it." },
            { op: "NAT gateway", avg: "general egress", avgTone: "bad", why: "Routes private-subnet traffic to the internet/AWS. Charges an hourly fee PLUS a per-GB data-processing charge. Sending TBs of S3 reads through it is the classic bill horror story." },
          ]}
        />
        <Callout kind="trap" title="The NAT gateway bill horror story">
          A Spark job in a private subnet reads terabytes from S3. Without the S3 gateway endpoint, every
          byte routes through the NAT gateway and gets billed at the per-GB data-processing rate, turning a
          routine job into a huge line item. The fix is one route-table entry: add the free S3 gateway
          endpoint so lake traffic never touches the NAT.
        </Callout>
      </Block>

      <Block eyebrow="the fully-private case" title="Interface endpoints (PrivateLink) for the control plane">
        <p className="text-ink-dim leading-relaxed mb-2">
          S3 and DynamoDB use gateway endpoints, but everything else, Glue, KMS, STS, CloudWatch Logs,
          Secrets Manager, uses <strong>interface endpoints</strong> (PrivateLink): an elastic network
          interface with a private IP inside your subnet that reaches the service API without any internet
          path. If you want a truly private cluster with no NAT at all, you provision an interface endpoint
          for each AWS API the job touches.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          The scoring signal is whether you reach for the free S3 gateway endpoint instead of paying NAT
          per-GB for lake traffic, and whether you know interface endpoints are what let a fully private
          cluster still reach Glue, KMS, and STS.
        </Callout>
      </Block>

      <Block eyebrow="the security groups and the wires" title="Managed security groups and network bandwidth">
        <p className="text-ink-dim leading-relaxed mb-2">
          EMR creates <strong>managed security groups</strong> for you: one for the primary and one shared by
          core and task nodes, with rules that allow the intra-cluster traffic the daemons need (and, in
          private subnets, an extra service-access group so the EMR service can reach the primary). You add
          your own rules for inbound access, but you let EMR own the intra-cluster ones.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          For <strong>shuffle-heavy jobs</strong>, instance network bandwidth is a real bottleneck. A wide
          join or aggregation moves huge volumes of shuffle data between executors over the network, and EC2
          network throughput is tiered by instance size, smaller instances get a burstable "up to" rate
          while larger ones get a sustained baseline. Undersize the instances and the shuffle stalls on the
          wire, not the CPU.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`VPC
+------------------- private subnet (single AZ) -------------------+
|   EMR cluster: primary / core / task   (no public IPs)           |
+------------------------------------------------------------------+
     |                       |                        |
     | S3 gateway endpoint   | interface endpoints    | interface
     | (route table, FREE)   | (ENIs, PrivateLink)    | endpoints
     v                       v                        v
  +--------+          +------------------+     +------------------+
  |  S3    |          | Glue / KMS / STS |     | CloudWatch Logs  |
  | (lake) |          +------------------+     | Secrets Manager  |
  +--------+                                   +------------------+

  NAT gateway = general internet egress, per-GB charge
  -> route bulk S3 through the GATEWAY endpoint, never the NAT`}
        />
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Our data-transfer cost tripled after we moved EMR into private subnets. Why?</strong>{" "}
            Almost certainly S3 reads are going through the NAT gateway and paying the per-GB processing fee.
            Add the S3 gateway endpoint and update the route table; the traffic becomes free.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The cluster is fully private with no NAT. How does it reach Glue and KMS?</strong>{" "}
            Interface endpoints (PrivateLink) for each service, Glue, KMS, STS, CloudWatch, Secrets Manager,
            each an ENI in the subnet. Miss one and jobs hang on that API call.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A shuffle-heavy join is slow but CPU sits idle. Where do you look?</strong>{" "}
            Network. Shuffle moves data between executors over the wire; check instance network bandwidth and
            move to larger, network-optimized instances, and reduce shuffle with better partitioning or
            broadcast joins.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Gateway endpoint or interface endpoint for S3?</strong>{" "}
            Gateway, it is the free S3/DynamoDB option and the default choice. Interface endpoints exist for
            S3 too, but you only pay for them when you specifically need private DNS/on-prem access.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "EMR runs in private subnets, so I always add the free S3 gateway endpoint, a route-table entry, so
          bulk lake reads never go through the NAT gateway and pay per-GB. For a fully private cluster I add
          interface endpoints for Glue, KMS, STS, and CloudWatch. EMR manages the intra-cluster security
          groups, and for shuffle-heavy jobs I size instances for network bandwidth, not just CPU."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The core fact is that S3 and DynamoDB get gateway endpoints, which are free route-table entries
          that keep traffic on the AWS network, while every other service gets interface endpoints over
          PrivateLink, an ENI in your subnet. The horror story I design against is a Spark job reading
          terabytes from S3 through a NAT gateway: NAT bills a per-GB data-processing charge, so that job
          silently costs a fortune when the fix is one gateway endpoint. If the cluster is fully private with
          no NAT, I have to provision interface endpoints for Glue, KMS, STS, CloudWatch Logs, and Secrets
          Manager, or those API calls hang. EMR creates managed security groups for the primary and the
          core/task nodes to allow intra-cluster traffic, plus a service-access group in private subnets. And
          for shuffle-heavy workloads I remember that EC2 network throughput is tiered by instance size, so a
          wide join can be bottlenecked on the wire, which means I pick larger or network-optimized instances
          and cut shuffle volume where I can."
        </Callout>
      </Block>
    </>
  );
}

/* ── Redshift internals & tuning ───────────────────────────────── */
function Redshift() {
  return (
    <>
      <Lede>
        Redshift is the MPP columnar warehouse in the AWS stack, and the tuning conversation is remarkably
        predictable: distribution keys to co-locate joins, sort keys for block pruning, and the rest is
        keeping stats and storage healthy. If you can say "DISTKEY on the join column, SORTKEY on the filter
        column" and explain the why, you have cleared the bar.
      </Lede>

      <Block eyebrow="the machine" title="MPP anatomy: leader, compute nodes, slices">
        <p className="text-ink-dim leading-relaxed mb-2">
          Redshift is massively parallel. The <strong>leader node</strong> parses SQL, builds the query plan,
          and aggregates the final result, but holds no user data. Each <strong>compute node</strong> is
          divided into <strong>slices</strong> (roughly one per core), and each slice owns a portion of every
          table's data and executes its share of the plan in parallel. Performance is about keeping all
          slices busy and evenly loaded.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`        +---------------------+
        |     Leader node     |  parse SQL, plan, aggregate (NO user data)
        +---------------------+
           |        |        |
      +--------+ +--------+ +--------+
      | compute| | compute| | compute|   each node split into slices
      | s0 s1  | | s2 s3  | | s4 s5  |   (about one per core)
      +--------+ +--------+ +--------+   slices scan their data in parallel`}
        />
      </Block>

      <Block eyebrow="placing the data" title="Distribution style: KEY, ALL, EVEN, AUTO">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>distribution style</strong> decides how rows spread across slices, and it is the single
          biggest lever on join performance because a join is cheap when both sides sit on the same slice and
          expensive when Redshift has to redistribute or broadcast rows across the network:
        </p>
        <OpTable
          cols={["DISTSTYLE", "Rows go", "", "Use when"]}
          rows={[
            { op: "KEY", avg: "by hash of a column", avgTone: "good", why: "Rows with the same key value land on the same slice. Set it to the big join column so both tables co-locate and the join needs no redistribution. The main tuning lever." },
            { op: "ALL", avg: "full copy on every node", avgTone: "ok", why: "Small dimension tables replicated everywhere, so any join to them is local. Costs storage; only for small tables." },
            { op: "EVEN", avg: "round-robin", avgTone: "ok", why: "Uniform spread with no join co-location. Fine for staging tables or when no column is a good distribution key." },
            { op: "AUTO", avg: "Redshift decides", avgTone: "good", why: "Starts ALL while a table is small and switches to KEY/EVEN as it grows. The sensible default when you are unsure." },
          ]}
        />
        <Callout kind="trap" title="Avoid a skewed distribution key">
          If the chosen key has a few values with enormous cardinality (a null-heavy column, one giant
          customer), those rows pile onto one slice and that slice becomes the bottleneck while the rest sit
          idle. Pick a high-cardinality, evenly-distributed join column, and watch for distribution skew.
        </Callout>
      </Block>

      <Block eyebrow="pruning blocks" title="Sort keys and zone maps">
        <p className="text-ink-dim leading-relaxed mb-2">
          Redshift stores data in 1 MB blocks and keeps a <strong>zone map</strong> (min/max per block) for
          each column, exactly like Parquet row-group stats. A <strong>sort key</strong> physically orders
          the data, so if you sort on the column you filter on, a <code className="font-mono">WHERE</code> on
          a date range skips every block whose min/max cannot match. That is block pruning, and it is why the
          filter column belongs in the sort key.
        </p>
        <OpTable
          cols={["Sort key type", "Orders by", "", "Verdict"]}
          rows={[
            { op: "Compound (default)", avg: "prefix of columns", avgTone: "good", why: "Sorts by the leading columns in order; great when queries filter on the leading column (usually date). The default and the right answer most of the time." },
            { op: "Interleaved", avg: "equal weight to many", avgTone: "ok", why: "Weights several columns equally, but has heavy VACUUM REINDEX maintenance cost and unpredictable gains. Rarely worth it now." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          They want "DISTKEY on the join column, SORTKEY on the filter column" and the reason: distribution
          co-locates the join to avoid redistribution, and the sort key drives zone-map block pruning. Saying
          both mechanisms by name is the signal.
        </Callout>
      </Block>

      <Block eyebrow="concurrency and storage" title="WLM, concurrency scaling, RA3, VACUUM/ANALYZE">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Workload management (WLM)</strong> splits queries into queues with memory and concurrency
          budgets; automatic WLM is the modern default, and <strong>concurrency scaling</strong> spins up
          transient clusters to absorb bursts of concurrent queries so BI dashboards do not queue.{" "}
          <strong>RA3 nodes</strong> decoupled compute from managed storage (Redshift Managed Storage, backed
          by S3), so you size and pay for compute and storage independently, the same storage-compute split
          that made the lake work. And housekeeping still matters: <strong>VACUUM</strong> reclaims space
          from deleted rows and re-sorts, <strong>ANALYZE</strong> refreshes the planner's statistics, though
          auto-vacuum and auto-analyze now handle most of it.
        </p>
        <Callout kind="tip" title="COPY loads in parallel across slices">
          Bulk-load with <code className="font-mono">COPY</code> from S3, never row-by-row INSERT. Split the
          input into many files (ideally a multiple of the slice count) or use a manifest, so every slice
          loads a file in parallel. One giant file means one slice does all the work while the rest idle.
        </Callout>
      </Block>

      <Block eyebrow="when to load vs query in place" title="Spectrum, and Redshift vs Athena">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Redshift Spectrum</strong> queries data still in S3 through the same Glue catalog, so you
          load hot, repeatedly-queried data into Redshift and leave cold history in S3, joining the two
          without a full load. The dividing line with <strong>Athena</strong>: Athena is serverless,
          pay-per-scan SQL for irregular ad-hoc queries over the lake; Redshift is provisioned MPP for fast,
          high-concurrency BI where many users hammer curated tables all day. Load into Redshift when the
          same tables are queried heavily and repeatedly; use Spectrum or Athena for the cold and
          exploratory tail.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A join between two large tables is slow. First thing you check?</strong>{" "}
            The distribution keys. If they are not both DISTKEY on the join column, Redshift is
            redistributing or broadcasting rows across the network. Co-locate them on the join key.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>One slice is at 100% while the others idle. What is going on?</strong>{" "}
            Distribution skew: the DISTKEY has a dominant value (often nulls) piling rows on one slice. Pick a
            more uniform key or use EVEN/AUTO.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why sort on the date column specifically?</strong>{" "}
            Because most queries filter on date. Sorting on it lets zone maps skip blocks outside the range,
            so a query for last week reads a fraction of the table instead of scanning it all.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Dashboards queue up at peak. How do you handle the concurrency without over-provisioning?</strong>{" "}
            Automatic WLM plus concurrency scaling, which adds transient clusters during bursts and bills only
            for the extra seconds, rather than sizing the base cluster for peak.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Redshift is MPP: a leader node plans, compute-node slices execute in parallel. Tuning is DISTKEY
          on the big join column so both tables co-locate and skip redistribution, and SORTKEY on the filter
          column so zone maps prune blocks. ALL for small dimensions, AUTO when unsure. RA3 decouples compute
          from S3-backed storage, COPY loads in parallel across slices, and automatic WLM plus concurrency
          scaling handle bursts."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The anatomy is a leader node that parses and plans but holds no data, and compute nodes split into
          slices, about one per core, that each own a slice of the data and run the plan in parallel. Two
          decisions dominate. Distribution style: DISTKEY hashes rows by a column so same-value rows share a
          slice, and I set it to the largest join's key so the join is local instead of redistributing rows
          over the network; ALL replicates small dimension tables everywhere; EVEN is round-robin; AUTO lets
          Redshift start with ALL and grow into KEY/EVEN. The trap is a skewed key that overloads one slice.
          Sort keys drive zone-map block pruning, Redshift keeps min/max per 1 MB block, so sorting on the
          filter column, usually date, lets it skip blocks a WHERE cannot match; compound is the default and
          almost always right, interleaved is rarely worth its maintenance cost now. On top of that, RA3
          nodes decouple compute from managed storage so I scale them independently, I bulk-load with COPY
          split across files so every slice loads in parallel, VACUUM and ANALYZE keep storage and stats
          healthy, and automatic WLM with concurrency scaling absorbs concurrent BI bursts. I load hot data
          into Redshift and use Spectrum or Athena for the cold lake tail."
        </Callout>
      </Block>
    </>
  );
}

/* ── Kafka & Kinesis internals ─────────────────────────────────── */
function Kafka() {
  return (
    <>
      <Lede>
        This is where interviewers separate people who have used a log from people who have only read about
        one. The probes are specific: how ordering works, what a rebalance actually does, and the exact chain
        that turns at-least-once into exactly-once. Kinesis gets the same treatment with its shard math. Know
        the mechanisms, not just the marketing.
      </Lede>

      <Block eyebrow="the log" title="Topics, partitions, offsets, ordering">
        <p className="text-ink-dim leading-relaxed mb-2">
          A Kafka <strong>topic</strong> is split into <strong>partitions</strong>; each record gets a
          monotonic <strong>offset</strong> within its partition. Ordering is guaranteed only{" "}
          <em>within</em> a partition, never across the topic, and the record <strong>key</strong> hashes to
          a partition, so all records for one key land on the same partition and stay ordered. Throughput
          scales with partition count.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`topic "orders" -> partition 0: [o0][o1][o2]   offsets increase per partition
                  partition 1: [o0][o1]       ordering guaranteed WITHIN a partition
   key hashes to a partition  ->  same key = same partition = ordered
   consumer group: each partition read by exactly ONE consumer in the group`}
        />
      </Block>

      <Block eyebrow="reading in parallel" title="Consumer groups and rebalancing">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>consumer group</strong> shares out the partitions so each partition is read by exactly one
          consumer in the group, which is how you scale reads up to the partition count. When membership
          changes (a consumer joins, dies, or restarts), Kafka <strong>rebalances</strong> partition
          assignments, and how it does that matters a lot:
        </p>
        <OpTable
          cols={["Rebalance mode", "Behavior", "", "Impact"]}
          rows={[
            { op: "Eager (classic)", avg: "stop-the-world", avgTone: "bad", why: "Every consumer revokes ALL its partitions and the group reassigns from scratch, so the whole group pauses during the rebalance. Painful with many consumers." },
            { op: "Cooperative sticky", avg: "incremental", avgTone: "good", why: "Only the partitions that must move are revoked; everyone else keeps processing. The protocol you should opt into: Kafka Streams uses it by default, but the plain consumer still defaults to eager RangeAssignor, so you set partition.assignment.strategy=CooperativeStickyAssignor explicitly." },
            { op: "Static membership", avg: "stable member id", avgTone: "good", why: "group.instance.id lets a consumer keep its assignment across a transient restart, so a rolling deploy does not trigger a rebalance at all." },
          ]}
        />
      </Block>

      <Block eyebrow="how many times" title="Delivery semantics and the exactly-once chain">
        <p className="text-ink-dim leading-relaxed mb-2">
          The default is <strong>at-least-once</strong>: on a retry a record can be delivered twice.
          Exactly-once within Kafka is a specific, three-part chain, not a single flag:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Idempotent producer</strong> (<code className="font-mono">enable.idempotence=true</code>), which tags records with a producer id and sequence number so the broker dedupes retries.</li>
          <li><strong>Transactions</strong>, so a read-process-write commits the output records and the consumer offsets atomically, all or nothing.</li>
          <li><strong>read_committed consumers</strong> (<code className="font-mono">isolation.level</code>), so downstream readers only see committed, non-aborted records.</li>
        </ul>
        <Callout kind="note" title="What the interviewer is listening for">
          The signal is that at-least-once is the default and exactly-once is that specific chain, idempotent
          producer plus transactions plus read_committed, and that ordering is per-partition, not global.
          Vague "Kafka does exactly-once" without the chain reads as surface knowledge.
        </Callout>
      </Block>

      <Block eyebrow="keep latest vs age out" title="Log compaction vs retention">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two cleanup policies. <strong>Retention</strong> deletes whole segments once they age past a time
          or size limit, regardless of content, the normal event-stream mode. <strong>Log compaction</strong>{" "}
          keeps at least the latest value per key and garbage-collects older values for that key, which turns
          a topic into a changelog of current state, perfect for keyed latest-state topics (a table
          materialized as a stream). A topic can be delete, compact, or both.
        </p>
      </Block>

      <Block eyebrow="the AWS-native log" title="Kinesis shards, resharding, KCL, Firehose">
        <p className="text-ink-dim leading-relaxed mb-2">
          Kinesis Data Streams is the same idea with hard per-shard numbers you should have memorized:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`per shard:  ingress  1 MB/s  OR  1000 records/s
            egress   2 MB/s  SHARED across standard consumers of that shard
enhanced fan-out (EFO):  each registered consumer gets its OWN 2 MB/s per shard
scale:  split shards (more throughput) / merge (less), OR on-demand auto-scales`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          <strong>Resharding</strong> is manual split/merge of shards; <strong>on-demand mode</strong>{" "}
          auto-scales shard count for you. The <strong>KCL</strong> (Kinesis Client Library) handles
          checkpointing progress into a DynamoDB table and coordinating leases across workers.{" "}
          <strong>Firehose</strong> buffers by size or time and flushes to S3/Redshift/OpenSearch, so a small
          buffer means frequent tiny flushes, which is a small-files risk on S3, tune the buffer to trade
          latency against file size.
        </p>
        <Callout kind="tip" title="Choosing MSK vs Kinesis">
          MSK (managed Kafka) for portability and the ecosystem, Connect, Streams, and off-AWS compatibility,
          and higher throughput ceilings. Kinesis for ops-light, AWS-native pipelines with tight Lambda and
          Firehose integration. Same log shape, different operational bargain.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>You need strict per-customer ordering. How do you get it?</strong>{" "}
            Use the customer id as the partition key so all of that customer's records land on one partition,
            where offsets guarantee order. There is no global ordering across partitions.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Every deploy causes a consumer-group stall. Fix?</strong>{" "}
            The eager rebalance is stop-the-world. Switch to cooperative sticky assignment and add static
            membership (group.instance.id) so rolling restarts do not trigger a full reassignment.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Marketing says the pipeline is exactly-once. What has to be true?</strong>{" "}
            Idempotent producer, transactional read-process-write committing offsets and output atomically,
            and read_committed consumers. Miss any leg and you are back to at-least-once, so build idempotent
            sinks anyway.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Two Kinesis consumers are starving each other. Why?</strong>{" "}
            Standard consumers share the 2 MB/s per-shard egress. Register them for enhanced fan-out so each
            gets its own dedicated 2 MB/s per shard.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "A topic is partitions of an ordered log; ordering holds within a partition and the key picks the
          partition, so same-key records stay ordered. Consumer groups split partitions one-per-consumer, and
          I use cooperative sticky rebalancing plus static membership to avoid stop-the-world stalls.
          Exactly-once is idempotent producer plus transactions plus read_committed, otherwise it is
          at-least-once. Kinesis is the same shape: 1 MB/s or 1000 records per shard in, 2 MB/s shared out,
          enhanced fan-out for dedicated egress."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Kafka is a partitioned commit log. Each partition is an ordered sequence of offsets, ordering is
          only guaranteed within a partition, and the record key hashes to a partition so all of one key's
          records stay ordered together, which is how I get per-entity ordering. A consumer group hands each
          partition to exactly one consumer so I scale reads up to the partition count, and the thing people
          fumble is rebalancing: the classic eager mode is stop-the-world, every consumer drops all
          partitions, so I use cooperative sticky rebalancing that only moves what must move, plus static
          membership so a rolling restart does not rebalance at all. Delivery is at-least-once by default;
          exactly-once is a chain, idempotent producer with producer-id and sequence numbers to dedupe
          retries, transactions to commit output and offsets atomically, and read_committed consumers so
          nobody reads aborted records. Compaction versus retention is the other knob: retention ages
          segments out by time or size, compaction keeps the latest value per key for changelog-style
          state topics. Kinesis is the AWS-native equivalent with hard shard limits, 1 MB/s or 1000
          records/s in and 2 MB/s shared out per shard, enhanced fan-out for a dedicated 2 MB/s per consumer,
          resharding or on-demand for scale, KCL checkpointing into DynamoDB, and Firehose buffering that I
          tune to avoid small files. I pick MSK for portability and ecosystem and Kinesis for ops-light
          AWS-native."
        </Callout>
      </Block>
    </>
  );
}

/* ── Flink essentials ──────────────────────────────────────────── */
function Flink() {
  return (
    <>
      <Lede>
        The Flink question is almost always framed as "why Flink over Spark Streaming," and a good answer
        names concrete mechanisms rather than buzzwords: true record-at-a-time processing, consistent state
        snapshots, and fine-grained event-time control. The senior touch is being honest that Flink costs
        more to operate and that Spark micro-batch is fine for most analytics.
      </Lede>

      <Block eyebrow="the core difference" title="True streaming vs micro-batch">
        <p className="text-ink-dim leading-relaxed mb-2">
          Spark Structured Streaming is <strong>micro-batch</strong> by default: it collects records for a
          short interval and processes them as a tiny batch, so latency floors out around that interval.
          Flink is a <strong>true streaming</strong> engine, it processes each record as it arrives, giving
          genuine sub-second, record-at-a-time latency. For most ETL and analytics the micro-batch delay is
          irrelevant; for low-latency event processing it is the whole point.
        </p>
      </Block>

      <Block eyebrow="consistent state" title="Checkpoint barriers and distributed snapshots">
        <p className="text-ink-dim leading-relaxed mb-2">
          Flink's superpower is fault-tolerant <strong>state</strong>. It periodically injects{" "}
          <strong>checkpoint barriers</strong> into the stream that flow through the operators; when an
          operator sees a barrier it snapshots its state, and because barriers align, the collection of
          snapshots forms a globally consistent cut, a distributed snapshot in the Chandy-Lamport lineage.
          State lives in a state backend (often RocksDB) and is checkpointed to durable storage like S3, so
          on failure Flink restores every operator to the same consistent point.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`source --[barrier]--> map --[barrier]--> window --[barrier]--> sink
   barriers flow along with the records
   when an operator sees a barrier -> it snapshots its state
   aligned barriers = one globally consistent cut (Chandy-Lamport lineage)
   checkpoint complete -> exactly-once STATE restored on failure`}
        />
      </Block>

      <Block eyebrow="exactly-once output" title="Two-phase commit sinks">
        <p className="text-ink-dim leading-relaxed mb-2">
          Consistent state gives exactly-once <em>state</em>, but exactly-once <em>output</em> to an external
          system needs more, because you cannot un-send a message. Flink uses a <strong>two-phase
          commit</strong> sink: it pre-commits output when a checkpoint is taken and only finalizes the commit
          once the checkpoint is confirmed complete, so a failure before confirmation rolls the pre-commit
          back. That is how a transactional Kafka or file sink achieves end-to-end exactly-once.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          They want a concrete reason Flink beats Spark Streaming, true record-at-a-time, consistent
          checkpoint snapshots, event-time watermarks, and they want you to admit when micro-batch Spark is
          simply fine. Naming the mechanism plus the honest trade-off is the signal.
        </Callout>
      </Block>

      <Block eyebrow="time and logic" title="Event-time watermarks, keyed state, CEP">
        <p className="text-ink-dim leading-relaxed mb-2">
          Flink processes by <strong>event time</strong> (when the event happened) rather than processing
          time, and <strong>watermarks</strong> track how far event-time has progressed so windows fire
          correctly and late data is handled explicitly, with fine-grained control over allowed lateness.
          Combined with <strong>keyed state and timers</strong>, per-key state you can register callbacks on,
          it supports complex event-driven logic like sessionization and pattern detection, and the{" "}
          <strong>CEP</strong> library adds declarative pattern matching over streams.
        </p>
      </Block>

      <Block eyebrow="the honest cost" title="Ops burden and the AWS option">
        <p className="text-ink-dim leading-relaxed mb-2">
          Flink is not free power. It is <strong>operationally heavier</strong>, state backends,
          checkpoint tuning, backpressure, and savepoint management, and the learning curve is steeper than
          Spark's. On AWS the managed answer is <strong>Amazon Managed Service for Apache Flink</strong> (the
          renamed Kinesis Data Analytics for Apache Flink), which runs and scales the Flink runtime for you.
        </p>
        <Callout kind="tip" title="When Spark micro-batch is simply fine">
          If latency in the seconds-to-minutes range is acceptable, which covers most analytics and ETL, and
          you are already on Spark, Structured Streaming micro-batch is simpler to build and run. Reach for
          Flink when you genuinely need sub-second latency, rich event-time semantics, or complex per-key
          state and pattern logic.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How does Flink recover state after a crash without reprocessing everything?</strong>{" "}
            Checkpoint barriers create a consistent distributed snapshot of all operator state to durable
            storage; on failure it restores every operator to that same cut and resumes from there.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Consistent state is one thing, but how do you get exactly-once into Kafka downstream?</strong>{" "}
            A two-phase-commit sink: pre-commit on checkpoint, finalize only when the checkpoint completes, so
            output is committed atomically with the state snapshot.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Events arrive out of order. How do you window them correctly?</strong>{" "}
            Event-time processing with watermarks: windows fire based on event timestamps and the watermark,
            with a configured allowed lateness so straggler events are still counted or routed to a
            side output.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>So should we always use Flink instead of Spark?</strong>{" "}
            No. Flink is operationally heavier. If seconds of latency are fine and the team is on Spark,
            micro-batch Structured Streaming is simpler; Flink earns its cost only when you need its latency
            or event-time and state features.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Flink is true record-at-a-time streaming, so sub-second latency, where Spark is micro-batch. Its
          state is fault-tolerant via checkpoint barriers that snapshot a globally consistent cut,
          Chandy-Lamport style, and two-phase-commit sinks extend that to exactly-once output. It has
          fine-grained event-time watermarks and keyed state with timers for complex logic. It costs more to
          operate, so for most analytics Spark micro-batch is fine; on AWS I run it as Amazon Managed Service
          for Apache Flink."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The honest framing is that Spark Structured Streaming is micro-batch, it processes small batches so
          latency floors at the batch interval, while Flink is a native streaming engine that handles each
          record as it arrives for genuine sub-second latency. The mechanism that makes Flink special is
          fault-tolerant state: it injects checkpoint barriers that flow through the operators, each operator
          snapshots its state when the barrier passes, and because the barriers align the snapshots form a
          globally consistent cut, a distributed snapshot in the Chandy-Lamport lineage, stored in a backend
          like RocksDB and checkpointed to S3. That gives exactly-once state; for exactly-once output to an
          external system it uses a two-phase-commit sink that pre-commits on a checkpoint and finalizes only
          once the checkpoint is confirmed. It processes on event time with watermarks so out-of-order and
          late data are handled precisely, and keyed state with timers plus the CEP library let me express
          sessionization and pattern detection. The trade-off I always name is ops cost, Flink is heavier to
          run and tune, so for most analytics where seconds of latency are fine I stay on Spark micro-batch,
          and I reach for Flink, via Amazon Managed Service for Apache Flink, when I truly need low latency or
          rich event-time state."
        </Callout>
      </Block>
    </>
  );
}

/* ── EMR ops & failure playbook ────────────────────────────────── */
function EmrOps() {
  return (
    <>
      <Lede>
        Operations questions reward a calm, specific playbook. Interviewers describe a symptom, a cluster
        stuck in BOOTSTRAPPING, nodes going UNHEALTHY, a storm of FetchFailedException, and watch whether you
        can map it to a root cause and say exactly which log on S3 you would open. Flailing is the failure
        mode here; a named playbook is the pass.
      </Lede>

      <Block eyebrow="the named failures" title="Symptom to root cause">
        <OpTable
          cols={["Failure mode", "Signature", "", "Root cause and fix"]}
          rows={[
            { op: "Stuck BOOTSTRAPPING", avg: "cluster never starts", avgTone: "bad", why: "A bootstrap action failed or hung. Read node/<id>/bootstrap-actions/ logs under the S3 LogUri; a bad script or a missing dependency blocks the whole cluster from launching." },
            { op: "Node UNHEALTHY", avg: "YARN disk threshold", avgTone: "bad", why: "local-dirs crossed the disk-utilization health threshold (default ~90%), usually shuffle spill filling EBS. Fix with bigger EBS volumes or less spill; MRUnhealthyNodes rises." },
            { op: "FetchFailedException storm", avg: "shuffle files vanished", avgTone: "bad", why: "A reclaimed spot node took its shuffle output with it, so downstream fetches fail. Spark stage retry recomputes the lost map outputs; mitigate with on-demand cores and fleet diversity." },
            { op: "Step failed, cluster alive", avg: "one job errored", avgTone: "ok", why: "A single spark-submit failed. Check steps/<step-id>/stderr; configure whether a failed step terminates the cluster or continues to the next." },
            { op: "Zombie cluster", avg: "IsIdle = 1 for hours", avgTone: "bad", why: "A cluster left running with no work, silently burning money. Auto-terminate idle transient clusters and alarm on the IsIdle metric." },
          ]}
        />
      </Block>

      <Block eyebrow="the disk and shuffle traps" title="UNHEALTHY nodes and FetchFailed, explained">
        <p className="text-ink-dim leading-relaxed mb-2">
          The two that catch people: a node goes <strong>UNHEALTHY</strong> not because it crashed but
          because YARN's disk health check tripped, the executor filled the local dirs with shuffle spill and
          crossed the utilization threshold, so YARN pulls the node out of scheduling. The fix is capacity
          (bigger EBS) or less spill (fewer partitions per task, more memory). And{" "}
          <strong>FetchFailedException</strong> after a spot reclaim is not a bug: shuffle files live on the
          producing executor's local disk, so when that node dies the files die with it, downstream tasks
          cannot fetch them, and Spark reruns the lost map stage. Diversify the fleet and keep enough
          on-demand cores that a reclaim does not cascade.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          The scoring signal is a calm failure playbook: you know where the logs live on S3 and can map a
          symptom to a root cause, disk for UNHEALTHY, lost shuffle for FetchFailed, a bad bootstrap for
          stuck BOOTSTRAPPING, without guessing.
        </Callout>
      </Block>

      <Block eyebrow="where the evidence lives" title="Log anatomy on S3 and the History Server">
        <p className="text-ink-dim leading-relaxed mb-2">
          EMR ships logs to the S3 <strong>LogUri</strong> you set at cluster creation, and knowing the tree
          is half the battle:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`s3://<LogUri>/<cluster-id>/
   containers/       YARN container logs  <- Spark stdout/stderr, the REAL errors
   node/<id>/        daemon logs + bootstrap-actions/  <- boot + node failures
   steps/<step-id>/  controller, stdout, stderr        <- step-level failures`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The <code className="font-mono">containers/</code> path holds the actual Spark executor and driver
          output, that is where the real stack trace is. And because logs and the{" "}
          <strong>persistent Spark History Server</strong> (the persistent application UI) outlive the
          cluster, you can debug a transient cluster's job long after the cluster itself is gone.
        </p>
      </Block>

      <Block eyebrow="watch these gauges" title="The CloudWatch metrics that matter">
        <p className="text-ink-dim leading-relaxed mb-2">
          A handful of EMR metrics carry most of the operational signal:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>IsIdle</strong>, catches zombie clusters, a value of 1 for hours means you are paying for nothing.</li>
          <li><strong>YARNMemoryAvailablePercentage</strong>, low values mean the cluster is memory-starved and jobs are queuing.</li>
          <li><strong>MRUnhealthyNodes</strong>, rising counts flag the disk-threshold problem above.</li>
          <li><strong>ContainerPending / AppsPending</strong>, work waiting on capacity, the trigger for scaling out.</li>
        </ul>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A cluster sits in BOOTSTRAPPING and never starts. Where do you look first?</strong>{" "}
            The node/&lt;id&gt;/bootstrap-actions logs under the S3 LogUri. A failing or hanging bootstrap
            script blocks the entire cluster from launching.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Half the task nodes went UNHEALTHY mid-job. Cause?</strong>{" "}
            YARN disk health: shuffle spill filled local-dirs past the utilization threshold, so YARN removed
            them from scheduling. Add EBS capacity or reduce spill.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You see repeated FetchFailedException right after a spot dip. Is the job broken?</strong>{" "}
            No. Reclaimed nodes took their shuffle files with them, so Spark recomputes the lost map stage.
            Diversify the fleet and keep enough on-demand cores so it does not cascade.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The cluster is gone but you still need to debug the job. How?</strong>{" "}
            The logs are in S3 under the LogUri (containers/ has the real stack trace) and the persistent
            Spark History Server outlives the cluster, so you replay the job UI after teardown.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I keep a symptom-to-cause playbook. Stuck BOOTSTRAPPING means a bad bootstrap action, I read the
          node bootstrap-actions logs on S3. UNHEALTHY nodes are YARN's disk threshold, usually shuffle spill
          filling EBS. FetchFailedException storms follow a spot reclaim taking shuffle files with it, and
          Spark stage retry recomputes. Logs live under the S3 LogUri in containers/, node/, and steps/, the
          History Server outlives the cluster, and I watch IsIdle for zombie clusters."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The three named failures come up constantly. A cluster stuck in BOOTSTRAPPING is a failed or
          hanging bootstrap action, and I go straight to the node/&lt;id&gt;/bootstrap-actions logs under the
          S3 LogUri. Nodes marked UNHEALTHY are almost always YARN's disk health check tripping because
          shuffle spill filled the local dirs past the utilization threshold, so I add EBS capacity or reduce
          spill and I watch MRUnhealthyNodes. FetchFailedException storms after a spot reclaim are expected,
          not a bug: shuffle files live on the producing executor's local disk, so a reclaimed node takes
          them with it, downstream fetches fail, and Spark's stage retry recomputes the lost map outputs, I
          mitigate by keeping on-demand cores for shuffle stability and diversifying the instance fleet. I
          also separate a step failure, one spark-submit erroring, which I debug in steps/&lt;id&gt;/stderr,
          from a cluster failure. The log tree on S3 is containers/ for the real Spark stack traces, node/ for
          daemon and bootstrap logs, and steps/ for step output, and the persistent Spark History Server plus
          those S3 logs let me debug a transient cluster after it is gone. On metrics I watch IsIdle to kill
          zombie clusters that burn money, YARNMemoryAvailablePercentage and pending containers for capacity,
          and MRUnhealthyNodes for the disk problem."
        </Callout>
      </Block>
    </>
  );
}

/* ── DR & multi-region ─────────────────────────────────────────── */
function Dr() {
  return (
    <>
      <Lede>
        The disaster-recovery question is a trap if you treat an EMR cluster like a highly-available service.
        It is not: a cluster lives in a single AZ and is disposable. The whole insight the interviewer is
        fishing for is that data-platform DR lives in S3 durability, infrastructure-as-code, and replayable
        idempotent pipelines, not in keeping compute alive.
      </Lede>

      <Block eyebrow="the fact they fish for" title="An EMR cluster is single-AZ">
        <p className="text-ink-dim leading-relaxed mb-2">
          An EMR cluster launches into <strong>one subnet, which is scoped to a single Availability Zone</strong>.
          There is no multi-AZ EMR cluster: if that AZ fails, the cluster is gone. But that is fine, because
          the cluster is cattle, not a pet. You relaunch it in another AZ or region from your{" "}
          <strong>infrastructure-as-code</strong> (CloudFormation or Terraform) and point it at the same
          durable data. Compute is disposable; the data is the precious part.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          They are fishing for the fact that an EMR cluster is single-AZ and disposable, so real DR is S3
          durability plus IaC plus replayable idempotent pipelines, not highly-available compute. Trying to
          make the cluster itself HA is the wrong instinct.
        </Callout>
      </Block>

      <Block eyebrow="the durable layer" title="S3, cross-region replication, and the regional catalog">
        <p className="text-ink-dim leading-relaxed mb-2">
          The data layer is where DR actually happens. <strong>S3</strong> gives eleven nines of durability
          within a region, and for region-level DR you add <strong>Cross-Region Replication</strong> (async,
          so a minutes-scale RPO) to copy objects to a second region. Two things to remember: the{" "}
          <strong>Glue Data Catalog is regional</strong>, so you replicate table definitions via IaC or
          re-run crawlers in the DR region, and <strong>Redshift</strong> automated snapshots can be
          configured to copy cross-region for warehouse recovery.
        </p>
        <OpTable
          cols={["Layer", "Regional or not", "", "DR approach"]}
          rows={[
            { op: "S3 data", avg: "durable in-region", avgTone: "good", why: "Eleven nines within a region; add Cross-Region Replication (async, minutes RPO) for region-level DR." },
            { op: "Glue catalog", avg: "regional", avgTone: "ok", why: "Not automatically cross-region. Re-create table/partition definitions in the DR region via IaC or a crawler re-run." },
            { op: "Redshift", avg: "regional cluster", avgTone: "ok", why: "Configure automated snapshots to copy cross-region, then restore in the DR region." },
            { op: "EMR compute", avg: "single-AZ, disposable", avgTone: "good", why: "No DR state to keep; relaunch from IaC in a healthy AZ/region and reprocess from S3." },
          ]}
        />
      </Block>

      <Block eyebrow="how much DR to buy" title="RTO/RPO tiering">
        <p className="text-ink-dim leading-relaxed mb-2">
          DR is a cost-versus-recovery-time dial, and you match the tier to what the business actually needs,
          measured as RTO (how fast you recover) and RPO (how much data you can lose):
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`backup & restore  -> cheapest, hours RTO   (relaunch from IaC, reprocess from S3)
pilot light       -> core data replicated, minimal standby, scale up on failover
warm standby      -> scaled-down live copy, faster failover
active-active     -> near-zero RTO, highest cost + complexity (rarely justified)`}
        />
        <Callout kind="tip" title="Active-active analytics is rarely worth it">
          For an analytics platform, active-active across regions is expensive and complex and seldom
          justified, analytics can usually tolerate hours of RTO. The honest architect answer is
          backup-restore or pilot light: S3 replication for the data, IaC to relaunch compute, and idempotent
          pipelines to reprocess, and reserve active-active for genuinely latency-critical online systems.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>The AZ hosting our EMR cluster fails mid-run. What is the recovery?</strong>{" "}
            The cluster is lost, it is single-AZ. Relaunch it from IaC in another AZ and re-run the pipeline
            from S3; because tasks are idempotent, reprocessing is safe.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>We replicate S3 to another region. Are we ready to fail over queries?</strong>{" "}
            Not yet. The Glue catalog is regional, so you also need the table and partition definitions in the
            DR region via IaC or a crawler, otherwise the replicated files are not queryable.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What is your RPO with Cross-Region Replication?</strong>{" "}
            Minutes, because CRR is asynchronous. If you need near-zero RPO you are into active-active
            territory, which for analytics is usually not worth the cost.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why not just run an active-active analytics platform to be safe?</strong>{" "}
            Cost and complexity. Analytics tolerates hours of RTO, so backup-restore or pilot light with S3
            replication, IaC, and replayable pipelines gives the right recovery at a fraction of the price.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "An EMR cluster is single-AZ and disposable, so I never try to make the compute HA, I relaunch it
          from IaC. DR lives in the data layer: S3 gives eleven nines in-region and Cross-Region Replication,
          async with minutes RPO, for region DR. The Glue catalog is regional so I recreate it via IaC or a
          crawler, and Redshift snapshots copy cross-region. Data-platform DR is S3 plus IaC plus replayable
          idempotent pipelines, and active-active analytics is rarely justified."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The fact people miss is that an EMR cluster lives in a single subnet, which is one Availability
          Zone, so there is no multi-AZ cluster, if the AZ dies the cluster dies. That is fine because compute
          is cattle: I relaunch from CloudFormation or Terraform in a healthy AZ or region and point it at the
          same data. The durable layer is where DR really happens. S3 is eleven nines within a region, and
          for region-level DR I add Cross-Region Replication, which is asynchronous, so my RPO is minutes.
          Two gotchas: the Glue Data Catalog is regional, so replicated files are not queryable until I
          recreate the table and partition definitions in the DR region via IaC or a crawler re-run, and
          Redshift needs its automated snapshots configured to copy cross-region. Then I size the DR tier to
          the business: backup-and-restore is cheapest with hours of RTO, pilot light keeps data replicated
          with a minimal standby, warm standby is a scaled-down live copy, and active-active is near-zero RTO
          at the highest cost. For an analytics platform I almost always land on backup-restore or pilot
          light, because the honest answer is that data-platform DR is S3 durability plus infrastructure-as-code
          plus replayable idempotent pipelines, and active-active analytics is rarely worth the money."
        </Callout>
      </Block>
    </>
  );
}

/* ── Airflow internals & backfills ─────────────────────────────── */
function AirflowDeep() {
  return (
    <>
      <Lede>
        Airflow depth questions zero in on the two things everyone gets slightly wrong: what a run's date
        actually means, and why backfills only work when tasks are idempotent. Get the logical_date semantics
        and the "day behind" question right, and pair them with light top-level DAG code, and you sound like
        someone who has actually run Airflow in anger.
      </Lede>

      <Block eyebrow="the moving parts" title="Architecture and executors">
        <p className="text-ink-dim leading-relaxed mb-2">
          Airflow has four core components: the <strong>scheduler</strong> (parses DAGs and decides which
          task instances are ready), the <strong>webserver</strong> (the UI), the <strong>metadata
          database</strong> (Postgres/MySQL, the source of truth for all state), and <strong>workers</strong>{" "}
          (which execute tasks). The <strong>executor</strong> connects the scheduler to the workers, and
          which one you pick shapes how it scales:
        </p>
        <OpTable
          cols={["Executor", "Runs tasks", "", "Trade-off"]}
          rows={[
            { op: "Local", avg: "subprocesses on one host", avgTone: "ok", why: "Simple, single-machine. Fine for small deployments; no horizontal scale." },
            { op: "Celery", avg: "distributed workers + broker", avgTone: "good", why: "Scales horizontally via a message broker (Redis/RabbitMQ). MWAA uses Celery. The common production choice." },
            { op: "Kubernetes", avg: "one pod per task", avgTone: "good", why: "Each task gets an isolated pod, dynamic scale, no idle workers, at the cost of per-task pod startup latency." },
          ]}
        />
      </Block>

      <Block eyebrow="DAGs are configuration" title="Keep top-level code light">
        <p className="text-ink-dim leading-relaxed mb-2">
          A DAG file is not run once, it is <strong>re-parsed constantly</strong> by the scheduler (the parse
          loop). So any heavy work at the top level of the file, a database query, an API call, a big import,
          runs on every parse and can slow or time out the scheduler. The rule: top-level code just{" "}
          <em>defines</em> the DAG cheaply; all real work goes inside task callables that run on workers.
        </p>
      </Block>

      <Block eyebrow="the semantics everyone fumbles" title="logical_date and the data interval">
        <p className="text-ink-dim leading-relaxed mb-2">
          A scheduled run is stamped with the <strong>start of the data interval it covers</strong>, not the
          wall-clock moment it runs. So a daily DAG processing 2026-01-15's data is stamped with 2026-01-15
          but actually fires at the <em>end</em> of that interval, around 2026-01-16 00:00. That is the whole
          "why is my run a day behind?" confusion: it is not behind, it runs after the interval it is
          responsible for has closed.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`daily DAG, data for 2026-01-15:
   data_interval_start = 2026-01-15 00:00   <- the run is STAMPED here (logical_date)
   data_interval_end   = 2026-01-16 00:00
   run actually FIRES at ~2026-01-16 00:00   (after the interval closes)
   {{ ds }} = 2026-01-15  ->  write to partition dt=2026-01-15`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          The signal is that you understand a run is stamped with the interval start and fires at its end, the
          "day behind" question, and that catchup and backfill only work because tasks are idempotent per
          interval. Templating the partition with {"{{ ds }}"} is the tell.
        </Callout>
      </Block>

      <Block eyebrow="reprocessing history" title="Catchup, backfill, and idempotency">
        <p className="text-ink-dim leading-relaxed mb-2">
          With <strong>catchup</strong> enabled, unpausing a DAG makes the scheduler create a run for every
          missed interval back to the start date; a <strong>backfill</strong> re-runs an explicit date range.
          Both only work safely if each task is <strong>idempotent per interval</strong>: it writes to the
          partition for its own interval (templated with <code className="font-mono">{"{{ ds }}"}</code> or{" "}
          <code className="font-mono">{"{{ data_interval_start }}"}</code>), so re-running that interval
          overwrites its own partition rather than appending duplicates. This is the same idempotency
          discipline the orchestration and Bench material insist on, an interval-scoped overwrite is what
          makes replays safe.
        </p>
        <Callout kind="trap" title="Non-idempotent tasks corrupt backfills">
          If a task appends rows instead of overwriting its interval's partition, every catchup run and every
          backfill double-writes history. Design each run to own and overwrite exactly its interval's
          partition, keyed on the templated date, so a re-run is a no-op on data.
        </Callout>
      </Block>

      <Block eyebrow="the hygiene knobs" title="Deferrable sensors, retries, XCom">
        <p className="text-ink-dim leading-relaxed mb-2">
          A few operational habits separate a healthy Airflow from a clogged one. A classic{" "}
          <strong>sensor</strong> that polls for a file <em>blocks a whole worker slot</em> the entire time
          it waits, so a handful of long waits can starve the pool, use <strong>deferrable operators</strong>{" "}
          (async, handled by the triggerer) that release the slot while waiting. Set <strong>retries and
          retry_delay</strong> so transient failures self-heal, attach <strong>SLAs and alerting</strong> so
          a late run pages before consumers notice, and remember <strong>XCom is for small metadata only</strong>,
          it goes through the metadata DB, so pass a pointer like an S3 path, never a big dataframe.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>My daily DAG scheduled for the 15th did not run until the 16th. Bug?</strong>{" "}
            No. The run is stamped with the interval start (the 15th) and fires when that interval closes, on
            the 16th. It is processing the 15th's data, working as intended.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The scheduler got slow and started missing schedules. First suspect?</strong>{" "}
            Heavy top-level DAG code, an API call or DB query at module scope that runs on every parse. Move
            it into task callables so the parse loop stays cheap.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A 90-day backfill produced duplicate rows. Why?</strong>{" "}
            The tasks are not idempotent per interval, they append instead of overwriting each interval's
            partition. Template the partition with the run date so each interval overwrites its own data.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Dozens of DAGs wait on external files and the worker pool is exhausted. Fix?</strong>{" "}
            Classic sensors hold a worker slot while polling. Switch to deferrable sensors so the wait is
            handled by the triggerer and the slot is freed.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Airflow is scheduler, webserver, metadata DB, and workers, with an executor, Local, Celery, or
          Kubernetes, and MWAA uses Celery. DAG files are re-parsed constantly, so I keep top-level code
          light. The key semantic is that a run is stamped with the interval start and fires at the interval
          end, which is the 'day behind' question, and catchup and backfill are only safe because tasks are
          idempotent per interval, templated with the run date. I use deferrable sensors so waits do not eat
          worker slots, and XCom only for small metadata."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The architecture is a scheduler that parses DAGs and schedules task instances, a webserver for the
          UI, a metadata database that is the source of truth for state, and workers that execute tasks, with
          an executor gluing scheduler to workers, LocalExecutor for a single host, CeleryExecutor for
          distributed workers over a broker, which is what MWAA runs, and KubernetesExecutor for one isolated
          pod per task. Because the DAG file is re-parsed on a loop, I keep top-level code cheap and push all
          real work into task callables, or I slow the whole scheduler. The semantics everyone fumbles: a
          scheduled run is stamped with the START of the data interval it covers, so a daily job for the 15th
          runs after the interval closes, around midnight on the 16th, that is the 'why is my run a day
          behind' question, and it is not behind, it runs once the interval it owns has completed. Catchup
          creates runs for all missed intervals when I unpause, and backfill re-runs a date range, but both
          only work because each task is idempotent per interval, it templates its output partition with
          {" {{ ds }} "} or data_interval_start and overwrites that partition, so a replay never duplicates
          data, the same idempotency discipline the rest of the pipeline relies on. Finally the hygiene:
          classic sensors block a worker slot while polling so I use deferrable operators that free the slot,
          I set retries, retry_delay, SLAs, and alerting, and I keep XCom to small metadata and pass S3
          pointers for anything large."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ────────────────────────────────────── */
const DECK = [
  { q: "In EMR, why does spot belong on task nodes but not core?", a: "Task nodes are compute-only with no HDFS data, so a reclaim just loses executors and Spark re-runs those tasks. Core nodes hold HDFS blocks and the primary holds the NameNode and ResourceManager, so both stay on-demand.", tag: "EMR nodes" },
  { q: "What spot allocation strategy cuts interruptions the most?", a: "Capacity-optimized with instance fleets: EMR draws spot from the deepest pools, which reduces reclaims far more than chasing the lowest price. Diversify across many instance types to deepen the pool.", tag: "spot" },
  { q: "Is S3 still eventually consistent?", a: "No. Since December 2020 S3 is strongly read-after-write consistent for all operations, so the old EMRFS consistent view is obsolete.", tag: "S3" },
  { q: "Avro or Parquet, and for what?", a: "Avro (row, binary, embedded schema) for streaming ingest and schema evolution; Parquet (columnar) for curated, query-served tables. Land raw as Avro, convert to Parquet.", tag: "formats" },
  { q: "What is the small-files problem and the fix?", a: "Thousands of tiny files blow up S3 listing and add per-file task overhead. Compact to roughly 128 to 512 MB files, and partition coarser so you do not create them.", tag: "layout" },
  { q: "When would you use partition projection?", a: "For tables with a predictable partition pattern like a date range. Athena computes partition locations from table properties instead of slowly listing or crawling them.", tag: "catalog" },
  { q: "What is the one lever on Athena cost?", a: "Bytes scanned. You cannot tune the hardware, so convert to Parquet, partition on filter columns, compress, and compact. It is about $5 per TB scanned.", tag: "Athena" },
  { q: "S3 gateway endpoint vs NAT gateway for a Spark job?", a: "Use the free S3 gateway endpoint, a route-table entry, so lake reads stay on the AWS network. Reading TBs through a NAT gateway racks up per-GB charges, the classic bill horror story.", tag: "networking" },
  { q: "The SSE-KMS gotcha at high throughput?", a: "Per-request KMS calls cost money and throttle at high TPS. Turn on S3 Bucket Keys to cut KMS calls dramatically while keeping full key control (CloudTrail logging just gets coarser, bucket-level not per-object).", tag: "security" },
  { q: "EMR service role vs EC2 instance profile?", a: "The service role lets EMR provision infrastructure on your behalf; the EC2 instance profile is what your Spark job's S3 access actually uses at runtime. Runtime roles add per-job identity.", tag: "IAM" },
  { q: "How do you choose a Redshift DISTKEY?", a: "Pick the join column of the biggest join so both tables co-locate on the same slice and skip redistribution, and avoid skewed keys that overload one slice.", tag: "Redshift" },
  { q: "What does a Redshift sort key buy you?", a: "Zone-map block pruning: Redshift keeps min/max per 1 MB block, so sorting on the filter column lets it skip blocks a WHERE cannot match, like Parquet predicate pushdown. Compound is the default; interleaved is rarely worth it now.", tag: "Redshift" },
  { q: "Kinesis shard throughput limits?", a: "1 MB/s or 1000 records/s ingress per shard, 2 MB/s egress shared across standard consumers. Enhanced fan-out gives each registered consumer its own 2 MB/s per shard.", tag: "Kinesis" },
  { q: "Cooperative sticky vs eager rebalancing in Kafka?", a: "Eager is stop-the-world: everyone revokes all partitions and reassigns. Cooperative sticky only moves the partitions that must move, so the rest keep processing; static membership avoids a rebalance on transient restarts.", tag: "Kafka" },
  { q: "The Kafka exactly-once chain?", a: "Idempotent producer (enable.idempotence), transactions for atomic write-plus-offset-commit, and read_committed consumers. Otherwise the default is at-least-once.", tag: "Kafka" },
  { q: "Why Flink over Spark Structured Streaming?", a: "True record-at-a-time sub-second latency, consistent state via checkpoint barriers, exactly-once output with two-phase-commit sinks, and fine-grained event-time watermarks. Spark micro-batch is simpler and fine for most analytics.", tag: "Flink" },
  { q: "An EMR node goes UNHEALTHY mid-job. First guess?", a: "YARN local-dirs disk crossed the health threshold, usually shuffle spill filling EBS. Add bigger EBS or reduce spill; the MRUnhealthyNodes metric rises.", tag: "EMR ops" },
  { q: "FetchFailedException storms after a spot reclaim: cause and fix?", a: "The reclaimed node's shuffle files died with it, so downstream fetches fail; Spark stage retry recomputes the lost map outputs. Mitigate with on-demand cores for shuffle and fleet diversification.", tag: "EMR ops" },
  { q: "Managed Scaling vs custom autoscaling on EMR?", a: "Managed Scaling reads YARN metrics and resizes core/task within min/max bounds you set, no rules to write. Custom autoscaling makes you author CloudWatch rules per group. Managed is the modern default.", tag: "scaling" },
  { q: "Where does the data live in the Glue Data Catalog?", a: "Nowhere. The catalog stores metadata only, schema, partitions, S3 location. The data stays in S3, and the catalog is regional, so DR means recreating it via IaC or crawlers.", tag: "catalog" },
  { q: "Why is my daily Airflow run 'a day behind'?", a: "A run is stamped with the START of the data interval it covers and fires at the interval's end, so yesterday's data runs today. Use data_interval_start / the templated run date.", tag: "Airflow" },
  { q: "What happens to an EMR cluster if its AZ fails?", a: "The cluster dies, it lives in a single subnet, which is AZ-scoped. You relaunch elsewhere from IaC; durability lives in S3, not the cluster.", tag: "DR" },
];

function RapidFire() {
  return (
    <>
      <Lede>
        This deck spans the whole tool, cluster shapes and storage layout through security, networking,
        Redshift, streaming internals, ops, and DR. Read each question, answer it OUT LOUD in a sentence or
        two as if the interviewer just asked it, then reveal and grade yourself honestly. Shuffle and re-run
        until you clear the deck cleanly two rounds in a row.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
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
  security: <Security />,
  networking: <Networking />,
  redshift: <Redshift />,
  kafka: <Kafka />,
  flink: <Flink />,
  emrops: <EmrOps />,
  dr: <Dr />,
  airflowdeep: <AirflowDeep />,
  quickfire: <RapidFire />,
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
