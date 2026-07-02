import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import PartitionShuffleViz from "./spark/PartitionShuffleViz.jsx";
import JoinStrategyViz from "./spark/JoinStrategyViz.jsx";
import SkewSaltingViz from "./spark/SkewSaltingViz.jsx";
import MemoryTriageViz from "./spark/MemoryTriageViz.jsx";
import { QuickFire } from "../components/QuickFire.jsx";

const ACCENT = "#ff8a3d";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "abstractions", label: "RDD, DataFrame, Dataset", group: "Core model" },
  { id: "lazy", label: "Transformations, actions, lazy eval", group: "Core model" },
  { id: "execution", label: "Driver, executors, jobs/stages/tasks", group: "Execution" },
  { id: "partitions", label: "Partitioning & parallelism", group: "Execution" },
  { id: "shuffle", label: "The shuffle", group: "Execution" },
  { id: "joins", label: "Join strategies", group: "Performance" },
  { id: "skew", label: "Data skew & spill", group: "Performance" },
  { id: "caching", label: "Caching & persistence", group: "Performance" },
  { id: "catalyst", label: "Catalyst, Tungsten & AQE", group: "Performance" },
  { id: "memory", label: "Memory model & OOM triage", group: "Debugging" },
  { id: "sparkui", label: "Reading the Spark UI", group: "Debugging" },
  { id: "writepath", label: "The write path & output tuning", group: "Deep cuts" },
  { id: "traps", label: "Traps & internals rapid-round", group: "Deep cuts" },
  { id: "streamstate", label: "Streaming state & watermarks", group: "Deep cuts" },
  { id: "spark4", label: "Staying current: Spark 3.x to 4", group: "Deep cuts" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* ── RDD, DataFrame, Dataset ──────────────────────────────────── */
function Abstractions() {
  return (
    <>
      <Lede>
        Spark gives you three ways to hold a distributed collection, and they are layers, not rivals. RDDs
        are the low-level bedrock; DataFrames put a schema and a query optimizer on top and are the default
        you should reach for; Datasets add compile-time types but only on the JVM. The senior answer is
        knowing why DataFrame/Spark SQL wins almost every time and when you would ever drop down to an RDD.
      </Lede>

      <Block eyebrow="the three abstractions" title="RDD vs DataFrame vs Dataset">
        <p className="text-ink-dim leading-relaxed mb-2">
          All three sit on the <strong>same unified engine</strong>, the same scheduler, the same executors,
          the same shuffle. What differs is how much Spark <em>understands</em> about your data and therefore
          how much it can optimize for you:
        </p>
        <OpTable
          cols={["Abstraction", "What it is", "", "Trade-off"]}
          rows={[
            { op: "RDD", avg: "low-level, no schema", avgTone: "bad", why: "An opaque collection of JVM/Python objects. No schema, so Catalyst can't see inside it and won't optimize. You hand-write the how. Maximum control, minimum help." },
            { op: "DataFrame", avg: "rows + schema", avgTone: "good", why: "A distributed table with named, typed columns. Catalyst optimizes it, Tungsten lays it out efficiently. The default in every language including PySpark." },
            { op: "Dataset", avg: "typed, JVM only", avgTone: "ok", why: "A DataFrame plus compile-time type safety (Dataset[Person]). Scala/Java only, there is no Dataset in PySpark. Nice types, some optimizer cost from lambdas." },
          ]}
        />
        <Callout kind="note" title="A DataFrame is a Dataset[Row]">
          On the JVM, DataFrame is literally an alias for Dataset[Row], the untyped member of the same family.
          In PySpark there is only the DataFrame API, so the practical choice for most data engineers is
          DataFrame vs RDD, not DataFrame vs Dataset.
        </Callout>
      </Block>

      <Block eyebrow="why the schema matters" title="Catalyst can only optimize what it can see">
        <p className="text-ink-dim leading-relaxed mb-2">
          The whole reason DataFrames are faster is that a named, typed schema lets the Catalyst optimizer
          rewrite your query: push filters down to the scan, prune columns you never select, reorder joins,
          and generate tight bytecode. An RDD of objects is opaque, your <code className="font-mono">map</code>{" "}
          is a black-box lambda, so Spark has to run it exactly as written.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`# DataFrame: declarative, Catalyst rewrites it (pushdown, pruning, codegen)
df.filter(df.country == "US").select("user_id", "amount")

# RDD: imperative, Spark runs your lambda as-is, no insight, no pushdown
rdd.filter(lambda r: r.country == "US").map(lambda r: (r.user_id, r.amount))`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Same logic, but the DataFrame version can skip reading columns and rows it doesn't need at the file
          level, while the RDD version reads everything and filters in your code.
        </p>
      </Block>

      <Block eyebrow="picking one" title="What to reach for, and the rare RDD case">
        <p className="text-ink-dim leading-relaxed mb-2">
          The default is <strong>DataFrame / Spark SQL for everything</strong>. You drop to an RDD only for
          niche control the higher APIs don't expose:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Custom partitioning</strong> or fine-grained control over how records are physically laid out.</li>
          <li><strong>Unstructured data</strong> that has no natural schema (raw text, custom binary) before you impose one.</li>
          <li><strong>Legacy code</strong> or a library that only speaks RDD.</li>
        </ul>
        <Callout kind="trap" title="Don't reach for RDDs to 'go faster'">
          A hand-written RDD job is almost always slower than the equivalent DataFrame, because you give up
          Catalyst and Tungsten. The instinct "RDD is lower-level so it must be faster" is backwards in modern
          Spark. Stay on DataFrames and let the optimizer work.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Three abstractions on one engine. RDD is the low-level layer, no schema, so Catalyst can't see
          inside it and won't optimize, maximum control but you write the how. DataFrame is rows plus a
          schema, so Catalyst and Tungsten optimize it for you, and it's my default in every language
          including PySpark. Dataset is a typed DataFrame for compile-time safety, but it's JVM only, there's
          no Dataset in PySpark. I build everything on DataFrames and Spark SQL and only drop to an RDD for
          niche things like custom partitioning or truly unstructured data, never to 'go faster,' because
          dropping the optimizer usually makes it slower."
        </Callout>
      </Block>
    </>
  );
}

/* ── Transformations, actions, lazy eval ──────────────────────── */
function Lazy() {
  return (
    <>
      <Lede>
        Spark is lazy on purpose. Transformations don't run, they just record what you want as a logical
        plan; nothing happens until an action asks for a result. That deferral is what lets Catalyst see the
        whole pipeline and optimize it, and the lineage it builds is also how Spark recovers from a lost
        executor without checkpointing everything.
      </Lede>

      <Block eyebrow="the two kinds of call" title="Transformations build a plan, actions trigger it">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every operation is one of two things. <strong>Transformations</strong> (
          <code className="font-mono">map, filter, select, groupBy, join</code>) are lazy: each one returns a
          new DataFrame and adds a node to a logical plan, the lineage DAG. <strong>Actions</strong> (
          <code className="font-mono">count, collect, save, show</code>) are what force Spark to actually
          execute the accumulated plan and produce a value or write output.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`df2 = df.filter(...)      # lazy -> nothing runs, just records intent
df3 = df2.select(...)     # lazy -> still nothing
df4 = df3.groupBy(...).count()   # lazy -> plan keeps growing

df4.show()                # ACTION -> NOW Spark plans, optimizes, and runs it all`}
        />
        <Callout kind="note" title="Laziness is what makes optimization possible">
          Because nothing runs until the action, Catalyst gets to see the entire chain at once and can fuse
          steps, push filters to the source, and prune columns. If each transformation ran eagerly, there'd
          be nothing left to optimize across.
        </Callout>
      </Block>

      <Block eyebrow="narrow vs wide" title="The split that decides whether a shuffle happens">
        <p className="text-ink-dim leading-relaxed mb-2">
          Transformations come in two flavors, and the difference is whether data has to cross partition
          boundaries:
        </p>
        <OpTable
          cols={["Kind", "Examples", "", "What it costs"]}
          rows={[
            { op: "Narrow", avg: "map, filter, select", avgTone: "good", why: "Each output partition depends on exactly one input partition. No data moves between partitions, so Spark fuses these into one stage. Cheap." },
            { op: "Wide", avg: "groupBy, join, distinct", avgTone: "bad", why: "Output partitions pull from many input partitions, data is redistributed by key. That's a shuffle, and it ends one stage and starts another. Expensive." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          This is the single most useful lens in Spark performance: narrow is free-ish and stays in place,
          wide means a shuffle and a stage boundary.
        </p>
      </Block>

      <Block eyebrow="fault recovery for free" title="Lineage: recompute, don't replicate">
        <p className="text-ink-dim leading-relaxed mb-2">
          Because Spark records the full chain of transformations, it knows exactly how every partition was
          derived. If an executor dies and takes some partitions with it, Spark doesn't need a replicated
          backup, it just <strong>recomputes the lost partitions</strong> from their lineage, re-running only
          the steps needed to rebuild them.
        </p>
        <Callout kind="tip" title="This is why RDDs were called 'resilient'">
          The 'R' in RDD is lineage-based resilience. The plan is a recipe, so a lost result can always be
          rebuilt by re-running the recipe for just that partition, no full re-execution and no expensive
          replication of data.
        </Callout>
      </Block>

      <Block eyebrow="the classic OOM" title="collect() pulls everything to one machine">
        <p className="text-ink-dim leading-relaxed mb-2">
          An action like <code className="font-mono">collect()</code> brings the <em>entire</em> result back
          to the driver's memory. On a multi-terabyte DataFrame that instantly OOMs the driver. It is the
          most common beginner crash in Spark.
        </p>
        <Callout kind="trap" title="Never collect() a big DataFrame">
          Use <code className="font-mono">show()</code> or <code className="font-mono">take(n)</code> to peek,
          <code className="font-mono"> count()</code> for a size, and <code className="font-mono">write</code>{" "}
          to persist results in parallel across executors. Reserve <code className="font-mono">collect()</code>{" "}
          for genuinely small results you know will fit in the driver.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Spark is lazy. Transformations like map, filter, select, groupBy and join don't run, they just
          build a logical plan, the lineage DAG. Actions like count, collect, save and show trigger
          execution. That laziness is what lets Catalyst optimize the whole pipeline at once. Transformations
          are narrow (one-to-one, no data movement, fused into a stage) or wide (redistribute by key, which is
          a shuffle and a stage boundary). Lineage also gives fault recovery for free, a lost partition is
          just recomputed from its recipe rather than replicated. The classic trap is collect(), which pulls
          the whole result to the driver and OOMs it, so I use show, take, count, or write instead."
        </Callout>
      </Block>
    </>
  );
}

/* ── Driver, executors, jobs/stages/tasks ─────────────────────── */
function Execution() {
  return (
    <>
      <Lede>
        When you call an action, Spark turns your plan into a hierarchy of work, jobs split into stages split
        into tasks, and hands it to a cluster of executors. On EMR that cluster is managed by YARN. Knowing
        exactly what runs where, and that one core runs one task on one partition, is what lets you reason
        about parallelism and read a stuck job.
      </Lede>

      <Block eyebrow="the two roles" title="Driver vs executors">
        <p className="text-ink-dim leading-relaxed mb-2">
          A Spark application has one <strong>driver</strong> and many <strong>executors</strong>. They do
          completely different jobs:
        </p>
        <OpTable
          cols={["Process", "What it does", "", "Holds"]}
          rows={[
            { op: "Driver", avg: "the brain, one per app", avgTone: "ok", why: "Builds the plan, runs Catalyst, breaks work into stages and tasks, schedules them, and tracks progress. Holds the SparkContext / SparkSession." },
            { op: "Executor", avg: "the muscle, many per app", avgTone: "good", why: "JVM processes on worker nodes that actually run tasks and hold cached data in memory. Each has a fixed number of cores and a memory budget." },
          ]}
        />
        <CodeBlock
          title="text"
          lang="text"
          code={`            +----------------+
            |     DRIVER     |   plans, schedules, holds SparkSession
            +----------------+
                    |  tasks
        +-----------+-----------+
        v           v           v
   +--------+  +--------+  +--------+
   |executor|  |executor|  |executor|   run tasks, hold cache
   | 4 cores|  | 4 cores|  | 4 cores|   (4 tasks each in parallel)
   +--------+  +--------+  +--------+`}
        />
        <Callout kind="note" title="On EMR, YARN is the cluster manager">
          The driver doesn't grab machines itself, it asks a <strong>cluster manager</strong> for executor
          containers. On Amazon EMR that manager is <strong>YARN</strong>, which allocates executors across
          the core and task nodes (standalone and Kubernetes are the other managers you'll see elsewhere).
        </Callout>
      </Block>

      <Block eyebrow="the work hierarchy" title="Job -> stages -> tasks">
        <p className="text-ink-dim leading-relaxed mb-2">
          Each <strong>action</strong> kicks off one <strong>job</strong>. The scheduler splits that job into{" "}
          <strong>stages</strong> at every shuffle boundary, all the narrow transformations between two
          shuffles collapse into a single stage. Each stage is then split into <strong>tasks</strong>, one
          task per partition, and tasks are the actual unit of execution sent to executors.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`action (e.g. df.write)         ->  1 JOB

  read + filter + select        ->  STAGE 0   (narrow, fused)
            | shuffle (groupBy) |  <-- stage boundary
  aggregate                     ->  STAGE 1

  each stage:  one TASK per partition  (200 partitions -> 200 tasks)`}
        />
        <Callout kind="trap" title="Stage boundaries are exactly the shuffles">
          Count the wide transformations and you've counted the stage boundaries. A job with two shuffles has
          three stages. When a job is slow, find the slow stage first, then look at whether it's a shuffle.
        </Callout>
      </Block>

      <Block eyebrow="where parallelism comes from" title="One core runs one task">
        <p className="text-ink-dim leading-relaxed mb-2">
          A task is the smallest unit of work and it processes exactly one partition. An executor core runs
          exactly one task at a time, so your real parallelism is the <strong>total number of cores across all
          executors</strong>, and you keep them all busy only if you have at least that many partitions.
        </p>
        <Callout kind="tip" title="The arithmetic that matters">
          10 executors x 4 cores = 40 tasks running at once. If a stage has 200 partitions it runs in roughly
          5 waves of 40. If it has only 8 partitions, 32 of your 40 cores sit idle. Matching partitions to
          cores is the core tuning instinct, and it leads straight into the next topic.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "The driver is the brain, it holds the SparkSession, runs Catalyst, and breaks the work into stages
          and tasks, then schedules them. Executors are the muscle, JVM processes that run tasks and hold
          cache. On EMR the driver asks YARN for those executor containers. Each action is a job, the job
          splits into stages at every shuffle boundary, and each stage splits into one task per partition.
          One core runs one task on one partition at a time, so my parallelism is the total core count, and I
          want enough partitions to keep every core busy. When something's slow I find the slow stage and
          check whether it's a shuffle."
        </Callout>
      </Block>
    </>
  );
}

/* ── Partitioning & parallelism ───────────────────────────────── */
function Partitions() {
  return (
    <>
      <Lede>
        A partition is the unit of parallelism: one task per partition, one core per task. So the number and
        size of partitions decides whether your cluster is fully used or mostly idle, and whether tasks fit in
        memory or spill to disk. Most real Spark tuning is, underneath, just getting partition count and size
        right, and knowing that the default of 200 is usually wrong.
      </Lede>

      <Block eyebrow="the goldilocks problem" title="Too few vs too many partitions">
        <p className="text-ink-dim leading-relaxed mb-2">
          Partition count is a balance, and both extremes hurt:
        </p>
        <OpTable
          cols={["Situation", "Symptom", "", "What happens"]}
          rows={[
            { op: "Too few partitions", avg: "under-parallelized", avgTone: "bad", why: "Fewer tasks than cores, so cores sit idle. Each task is huge, runs long, and may not fit in executor memory, so it spills to disk." },
            { op: "Too many partitions", avg: "scheduling overhead", avgTone: "bad", why: "Thousands of tiny tasks, the per-task scheduling and shuffle bookkeeping overhead dominates the actual work. Lots of small files on write." },
            { op: "About right", avg: "~128-256 MB each", avgTone: "good", why: "Each task is a comfortable chunk, all cores stay busy, little to no spill. The target for most workloads." },
          ]}
        />
        <Callout kind="note" title="Aim for ~128-256 MB per partition">
          A good rule of thumb is to size partitions so each task processes roughly 128 to 256 MB. Then set
          the partition count so you have at least as many partitions as total cores, usually a small multiple
          so waves stay even.
        </Callout>
      </Block>

      <Block eyebrow="the knobs" title="Default parallelism and shuffle partitions">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two settings control how many partitions you end up with. <code className="font-mono">spark.default.parallelism</code>{" "}
          governs RDD operations and defaults to your total core count.{" "}
          <code className="font-mono">spark.sql.shuffle.partitions</code> governs how many partitions a{" "}
          <em>shuffle</em> produces for DataFrames/SQL, and it defaults to <strong>200</strong> regardless of
          your data size or cluster.
        </p>
        <Callout kind="trap" title="200 is a guess, not a good default">
          The 200 default is almost never right for your job. On a small dataset it makes 200 tiny tasks; on a
          huge one it makes 200 enormous tasks that spill. Set it to match your data and cluster, or let AQE
          coalesce it for you (see Catalyst, Tungsten and AQE). Treating 200 as sacred is a classic
          mistuning.
        </Callout>
      </Block>

      <Block eyebrow="changing partition count" title="repartition vs coalesce">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two ways to change the partition count, and they are not interchangeable:
        </p>
        <OpTable
          cols={["Operation", "What it does", "", "Cost"]}
          rows={[
            { op: "repartition(n)", avg: "full shuffle", avgTone: "ok", why: "Reshuffles all data into n evenly-sized partitions. Can increase or decrease count and rebalances skew, but pays a full shuffle." },
            { op: "coalesce(n)", avg: "narrow merge", avgTone: "good", why: "Merges existing partitions together without a shuffle, only to DECREASE count. Cheap, but can leave uneven partitions." },
          ]}
        />
        <CodeBlock
          title="text"
          lang="text"
          code={`# shrinking output before a write:
df.coalesce(10).write...      # cheap, no shuffle, but may be uneven

# rebalancing skewed data or increasing partitions:
df.repartition(200, "key").write...   # full shuffle, even sizes`}
        />
        <Callout kind="tip" title="The rule">
          To <em>reduce</em> partitions cheaply (e.g. fewer output files), use{" "}
          <code className="font-mono">coalesce</code>. To <em>increase</em> partitions, or to evenly
          rebalance skewed data, use <code className="font-mono">repartition</code> and accept the shuffle.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "A partition is the unit of parallelism, one task per partition, one core per task, so the count and
          size of partitions decide everything. Too few and cores idle while huge tasks spill to disk; too
          many and tiny-task scheduling overhead dominates. I target roughly 128 to 256 MB per partition and
          at least as many partitions as cores. The big gotcha is spark.sql.shuffle.partitions defaulting to
          200 regardless of data size, that's almost always wrong, so I tune it or let AQE coalesce. And I use
          coalesce to cheaply shrink partitions with no shuffle, repartition to increase them or rebalance
          skew at the cost of a full shuffle."
        </Callout>
      </Block>
    </>
  );
}

/* ── The shuffle ──────────────────────────────────────────────── */
function Shuffle() {
  return (
    <>
      <Lede>
        The shuffle is the all-to-all redistribution of data by key across the cluster, and it is the single
        most expensive thing Spark does, disk writes, network transfer, and serialization all at once. Every
        wide transformation triggers one, every shuffle is a stage boundary, and most of your tuning effort
        goes into avoiding shuffles or making them smaller.
      </Lede>

      <Block eyebrow="what actually happens" title="Map side writes, reduce side fetches">
        <p className="text-ink-dim leading-relaxed mb-2">
          A shuffle has two halves. On the <strong>map side</strong>, each task partitions its output by the
          hash of the key and writes those pieces to local disk as <em>shuffle files</em>. On the{" "}
          <strong>reduce side</strong>, each task in the next stage <em>fetches</em> the pieces meant for it
          from every map task across the network, then processes them. Data for the same key from everywhere
          converges on one reducer.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`MAP SIDE (stage N)                     REDUCE SIDE (stage N+1)

 task 0  --[write by hash(key)]-->  shuffle files on disk
 task 1  --[write by hash(key)]-->  shuffle files on disk   --fetch over net-->  task A (all key%3==0)
 task 2  --[write by hash(key)]-->  shuffle files on disk   --fetch over net-->  task B (all key%3==1)
                                                            --fetch over net-->  task C (all key%3==2)

 cost = serialize + write to disk + transfer over network + read + deserialize`}
        />
        <Callout kind="trap" title="Why it's the expensive operation">
          A shuffle pays disk I/O (writing and reading shuffle files), network I/O (every reducer pulls from
          every mapper, an N x M pattern), and serialization on both ends. Compared to a narrow transformation
          that stays in memory in place, a shuffle is orders of magnitude more costly. Minimizing shuffles is
          most of Spark performance work.
        </Callout>
      </Block>

      <Block eyebrow="what triggers one" title="Wide transformations cause shuffles">
        <p className="text-ink-dim leading-relaxed mb-2">
          Any operation that needs to bring together records by key triggers a shuffle:{" "}
          <code className="font-mono">groupByKey</code>, <code className="font-mono">reduceByKey</code>,{" "}
          <code className="font-mono">join</code>, <code className="font-mono">distinct</code>, and{" "}
          <code className="font-mono">repartition</code>. Each one ends the current stage and starts a new one.
          Narrow operations (<code className="font-mono">map</code>, <code className="font-mono">filter</code>)
          never shuffle.
        </p>
        <Try label="narrow vs wide, watch the records move">
          <PartitionShuffleViz />
        </Try>
      </Block>

      <Block eyebrow="the famous optimization" title="reduceByKey beats groupByKey">
        <p className="text-ink-dim leading-relaxed mb-2">
          The classic Spark lesson: <code className="font-mono">reduceByKey</code> and{" "}
          <code className="font-mono">aggregateByKey</code> <strong>combine on the map side</strong> before
          the shuffle, so each partition pre-aggregates its keys and ships only the partial results.{" "}
          <code className="font-mono">groupByKey</code> ships <em>every raw record</em> across the network and
          aggregates only on the reduce side.
        </p>
        <OpTable
          cols={["Operation", "Map-side combine?", "", "Network cost"]}
          rows={[
            { op: "reduceByKey / aggregateByKey", avg: "yes, pre-aggregates", avgTone: "good", why: "Each partition reduces its keys locally first, so only one partial value per key crosses the network. Much less shuffle data." },
            { op: "groupByKey", avg: "no, ships everything", avgTone: "bad", why: "Every raw record for a key is shuffled to the reducer, then grouped. Far more network and a risk of one reducer OOM on a hot key." },
          ]}
        />
        <Callout kind="tip" title="On DataFrames you mostly get this for free">
          With DataFrame aggregations (<code className="font-mono">groupBy(...).agg(...)</code>) Catalyst
          already applies partial (map-side) aggregation for you. The reduceByKey-vs-groupByKey lesson is
          sharpest in the RDD API, but the principle, combine before you shuffle, is what to say.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "A shuffle is the all-to-all redistribution of data by key across the cluster. The map side writes
          shuffle files to local disk partitioned by hash of the key, the reduce side fetches its pieces from
          every map task over the network. It's the most expensive thing in Spark because it pays disk,
          network, and serialization all at once, and every wide op, groupByKey, join, distinct, repartition,
          triggers one and starts a new stage. So I minimize shuffles, and when I must shuffle I prefer
          reduceByKey or aggregateByKey, which combine map-side and ship only partial results, over
          groupByKey, which ships every raw record and can OOM a reducer on a hot key."
        </Callout>
      </Block>
    </>
  );
}

/* ── Join strategies ──────────────────────────────────────────── */
function Joins() {
  return (
    <>
      <Lede>
        How Spark joins two tables decides whether the stage takes seconds or hours. The big lever is whether
        one side is small enough to broadcast, which skips shuffling the large table entirely. The senior
        skill is reading the chosen strategy in the plan, knowing the broadcast threshold, and recognizing
        that join-key skew is the thing that quietly wrecks a sort-merge join.
      </Lede>

      <Block eyebrow="the three strategies" title="Broadcast, sort-merge, shuffle hash">
        <OpTable
          cols={["Strategy", "When Spark picks it", "", "What happens"]}
          rows={[
            { op: "Broadcast hash join", avg: "one side <= ~10 MB", avgTone: "good", why: "The small table is shipped whole to every executor; the big table is NOT shuffled, each executor joins its local partitions against the broadcast copy. Fastest when one side is small." },
            { op: "Shuffle sort-merge join", avg: "two large tables", avgTone: "ok", why: "The default for big-by-big. Both sides are shuffled by key, sorted, then merged. Robust and scalable, but pays two full shuffles plus sorts." },
            { op: "Shuffle hash join", avg: "less common", avgTone: "ok", why: "Both sides shuffled; one side is built into a hash table in memory instead of sorting. Used in narrower cases, no sort but needs the build side to fit in memory." },
          ]}
        />
        <Callout kind="note" title="The threshold is a real knob">
          A side is broadcast when its estimated size is at or below{" "}
          <code className="font-mono">spark.sql.autoBroadcastJoinThreshold</code>, default{" "}
          <strong>10 MB</strong>. You can raise it (or call <code className="font-mono">broadcast(df)</code>{" "}
          explicitly) when you know a dimension table is small enough, that turns a two-shuffle sort-merge into
          a no-shuffle broadcast.
        </Callout>
      </Block>

      <Block eyebrow="why broadcast wins" title="No shuffle of the big table">
        <p className="text-ink-dim leading-relaxed mb-2">
          The reason a broadcast join is so much faster is that the expensive table never moves. Shipping a
          few megabytes to every executor is cheap; shuffling 50 GB by key is not. So the moment one side fits
          under the threshold, you avoid the dominant cost of the join entirely.
        </p>
        <Try label="slide the small table size across the broadcast threshold">
          <JoinStrategyViz />
        </Try>
      </Block>

      <Block eyebrow="the runtime save" title="AQE can switch to broadcast on the fly">
        <p className="text-ink-dim leading-relaxed mb-2">
          Sometimes Spark's compile-time size estimate is wrong, after filtering, a side that looked big is
          actually tiny. <strong>Adaptive Query Execution</strong> measures the real size of each side after
          the first shuffle and can <strong>convert a planned sort-merge join into a broadcast join at
          runtime</strong>, so you get the fast path even when the optimizer couldn't have known up front.
        </p>
        <Callout kind="trap" title="The real killer is join-key skew">
          A sort-merge join shuffles both sides by the join key. If one key holds a huge share of the rows,
          all those rows land on one reducer, one task runs far longer than the rest and the whole stage waits
          on it. Skew, not strategy, is the usual reason a join is mysteriously slow, which is the next topic.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Three strategies. Broadcast hash join when one side is small, under the 10 MB
          autoBroadcastJoinThreshold by default, it ships the small table to every executor and never
          shuffles the big one, so it's the fastest path. Shuffle sort-merge join is the default for two large
          tables, both sides shuffled and sorted by key, robust but two full shuffles. Shuffle hash join is
          the less common in-memory-build variant. AQE can also flip a planned sort-merge to a broadcast at
          runtime once it sees the real sizes. And the thing that quietly wrecks a join is key skew, one hot
          key sends most rows to a single reducer, so I watch for that and salt or broadcast around it."
        </Callout>
      </Block>
    </>
  );
}

/* ── Data skew & spill ────────────────────────────────────────── */
function Skew() {
  return (
    <>
      <Lede>
        Skew is when one or a few keys hold most of the rows, so after a shuffle one task gets a giant
        partition and runs far longer than the rest. Because a stage finishes only when its slowest task does,
        that one straggler holds the whole stage hostage, and may spill to disk or OOM. Recognizing skew and
        knowing the fixes, salting, AQE, broadcast, is core senior tuning.
      </Lede>

      <Block eyebrow="the mechanism" title="One hot key, one straggler, a stalled stage">
        <p className="text-ink-dim leading-relaxed mb-2">
          Stage time equals the <strong>maximum</strong> task time, not the average. So if 199 tasks finish in
          a minute and one skewed task takes an hour because it got the hot key's rows, the stage takes an
          hour. The cluster is mostly idle while one core grinds. That straggler can also overflow its
          executor's memory and spill, or OOM outright.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`after a shuffle on a skewed key:

  task 0  [#####]                 done in 1 min
  task 1  [####]                  done in 1 min
  task 2  [#####]                 done in 1 min
  task 3  [###############################################]  HOT key, 1 hour
                                                             ^ stage waits on THIS`}
        />
        <Callout kind="note" title="Spill is the gentler failure">
          <strong>Spill</strong> is when a task's data is too big for its executor memory, so Spark writes the
          overflow to local disk. It's slow but the job survives. A skewed task spills first, and if even disk
          plus memory can't hold it, you get an OOM. Spill in the metrics is a strong skew/under-partitioning
          tell.
        </Callout>
      </Block>

      <Block eyebrow="the fixes" title="Salting, AQE, broadcast, isolate">
        <OpTable
          cols={["Remedy", "How it works", "", "When"]}
          rows={[
            { op: "Salting the hot key", avg: "spread one key over N", avgTone: "good", why: "Append a random 0..N-1 suffix so the hot key hashes into N partitions instead of one, then aggregate in two passes. The general-purpose fix." },
            { op: "AQE skew-join handling", avg: "auto-split skewed partitions", avgTone: "good", why: "Adaptive Query Execution detects an oversized shuffle partition and splits it into several sub-tasks at runtime. Often fixes skew with zero code." },
            { op: "Broadcast the small side", avg: "no shuffle, no skew", avgTone: "ok", why: "If the other table is small enough, a broadcast join avoids shuffling the skewed side at all, so the skew never bites." },
            { op: "Filter / separate the hot key", avg: "handle it on its own", avgTone: "ok", why: "Pull the few hot keys out, process them separately, and union the result. Crude but effective when a handful of keys dominate." },
          ]}
        />
        <Try label="crank the skew, then salt the hot key">
          <SkewSaltingViz />
        </Try>
      </Block>

      <Block eyebrow="reach for AQE first" title="Often it's already handled">
        <p className="text-ink-dim leading-relaxed mb-2">
          In Spark 3+ with AQE on (the default), skew-join handling will frequently split the oversized
          partition for you automatically, so the first move is to confirm AQE is enabled and watch the plan.
          Salting is the manual fallback when AQE can't fully handle it or the skew is in a groupBy rather than
          a join.
        </p>
        <Callout kind="tip" title="How you spot skew in practice">
          In the Spark UI, look at a stage's task duration distribution: if the max is wildly larger than the
          median (and the slow tasks show large shuffle-read or spill), you have skew. One giant task next to
          many small ones is the signature.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Skew is when a few keys hold most of the rows, so after a shuffle one task gets a giant partition.
          Since stage time is the max task time, that one straggler stalls the whole stage while everything
          else sits idle, and it can spill to disk or OOM. To fix it I first lean on AQE skew-join handling,
          which splits oversized partitions at runtime for free in Spark 3+. Beyond that I salt the hot key,
          add a random suffix so it spreads over N partitions and aggregate in two passes, or broadcast the
          small side so the skewed side never shuffles, or pull the handful of hot keys out and handle them
          separately. Spill in the metrics is my tell that a task is too big."
        </Callout>
      </Block>
    </>
  );
}

/* ── Caching & persistence ────────────────────────────────────── */
function Caching() {
  return (
    <>
      <Lede>
        Spark recomputes a DataFrame from its lineage every time you use it, which is wasteful when you reuse
        the same intermediate result down several branches or across iterations. Caching materializes it once
        so the branches reuse it. The senior nuance is that caching only pays off when there's genuine reuse,
        and caching a single-use DataFrame just wastes memory.
      </Lede>

      <Block eyebrow="why cache at all" title="Lineage means recompute by default">
        <p className="text-ink-dim leading-relaxed mb-2">
          Because transformations are lazy and Spark tracks lineage, each action recomputes the whole chain
          from the source. If you derive <code className="font-mono">df_clean</code> and then run three
          separate aggregations off it, that cleaning runs <em>three times</em>.{" "}
          <code className="font-mono">cache()</code> or <code className="font-mono">persist()</code> tells
          Spark to keep the materialized result after the first computation so the other branches reuse it.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`df_clean = df.filter(...).withColumn(...)   # expensive
df_clean.cache()                            # mark it to materialize on first action

a = df_clean.groupBy("x").count()   # computes df_clean, caches it
b = df_clean.groupBy("y").sum("z")  # REUSES the cache, no recompute
c = df_clean.filter(...).count()    # REUSES the cache again`}
        />
        <Callout kind="note" title="cache() is lazy too">
          <code className="font-mono">cache()</code> only marks the DataFrame; it isn't actually stored until
          the first action materializes it. After that, subsequent actions hit the cache instead of
          recomputing.
        </Callout>
      </Block>

      <Block eyebrow="how it's stored" title="Storage levels">
        <p className="text-ink-dim leading-relaxed mb-2">
          <code className="font-mono">persist()</code> takes a <strong>storage level</strong> that trades
          memory for resilience; <code className="font-mono">cache()</code> is just persist at the default
          level:
        </p>
        <OpTable
          cols={["Storage level", "Where", "", "Trade-off"]}
          rows={[
            { op: "MEMORY_ONLY", avg: "RAM, the cache() default for RDDs", avgTone: "ok", why: "Fastest, but partitions that don't fit are simply recomputed on demand. Pure speed, no disk fallback." },
            { op: "MEMORY_AND_DISK", avg: "RAM, spill to disk", avgTone: "good", why: "Keeps what fits in memory and spills the rest to disk instead of recomputing. The DataFrame cache() default and the safe general choice." },
            { op: "with _SER / replication", avg: "serialized / copied", avgTone: "ok", why: "Serialized levels save memory at CPU cost; replicated levels keep a second copy for fault tolerance. Niche tuning." },
          ]}
        />
      </Block>

      <Block eyebrow="the discipline" title="Only cache real reuse, and unpersist">
        <p className="text-ink-dim leading-relaxed mb-2">
          Caching is worth it specifically when a DataFrame is <strong>reused</strong>, branching pipelines
          and iterative algorithms (ML loops) are the classic wins. If you use a DataFrame exactly once,
          caching it adds materialization cost and consumes memory for nothing.
        </p>
        <Callout kind="trap" title="Caching the wrong things is a real cost">
          Two traps: caching a DataFrame that's used only once (pure waste), and never calling{" "}
          <code className="font-mono">unpersist()</code> when you're done, so cached blocks linger and evict
          things that are actually being reused, pushing other work to spill or recompute. Cache only on
          genuine reuse, and unpersist when the reuse is over.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "By default Spark recomputes a DataFrame from its lineage every time it's used, so when I reuse an
          expensive intermediate down several branches or across iterations, I cache or persist it to
          materialize it once. cache() is persist at the default level, and persist() lets me pick a storage
          level, MEMORY_ONLY for pure speed or MEMORY_AND_DISK to spill instead of recompute. The discipline
          is that caching only pays off with real reuse, branching or iterative work, caching a single-use
          DataFrame just wastes memory, and I unpersist when I'm done so stale blocks don't evict things that
          are still being reused."
        </Callout>
      </Block>
    </>
  );
}

/* ── Catalyst, Tungsten & AQE ─────────────────────────────────── */
function Catalyst() {
  return (
    <>
      <Lede>
        Three pieces make modern Spark fast. Catalyst is the query optimizer that rewrites your declarative
        plan; Tungsten is the execution engine that runs the result on tight, off-heap memory with generated
        code; and AQE re-optimizes at runtime using the actual data it sees. The senior skill is reading an
        explain() plan and knowing which of these three did what.
      </Lede>

      <Block eyebrow="the optimizer" title="Catalyst: from your query to a physical plan">
        <p className="text-ink-dim leading-relaxed mb-2">
          Catalyst turns a DataFrame/SQL query into an executable plan through a pipeline of stages, each one
          rewriting the plan to be cheaper:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`SQL / DataFrame
   |
   v  PARSE      -> unresolved logical plan
   v  ANALYZE    -> resolve columns/tables against the catalog
   v  OPTIMIZE   -> logical rewrites: predicate pushdown, column pruning,
   |               constant folding, join reordering
   v  PHYSICAL   -> generate candidate physical plans
   v  COST PICK  -> choose one (e.g. broadcast vs sort-merge join)
   v  CODEGEN    -> Tungsten whole-stage codegen -> JVM bytecode`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The two rewrites worth naming are <strong>predicate pushdown</strong> (push filters down to the data
          source so you read fewer rows) and <strong>projection / column pruning</strong> (only read the
          columns you actually select). On columnar formats like Parquet these alone can cut I/O dramatically.
        </p>
        <Callout kind="note" title="This is why DataFrames beat RDDs">
          All of Catalyst depends on understanding your query's structure, which only the schema-aware
          DataFrame/SQL API provides. An RDD lambda is opaque, so none of these rewrites can fire. That's the
          concrete payoff of staying on DataFrames.
        </Callout>
      </Block>

      <Block eyebrow="the engine" title="Tungsten: off-heap memory and whole-stage codegen">
        <p className="text-ink-dim leading-relaxed mb-2">
          Where Catalyst decides <em>what</em> to run, <strong>Tungsten</strong> makes the running fast. It
          manages memory <strong>off-heap</strong> in compact binary layouts to dodge JVM object overhead and
          garbage-collection pressure, and it does <strong>whole-stage code generation</strong>: instead of
          interpreting your operators one row at a time, it fuses an entire stage into a single tight loop of
          generated JVM bytecode.
        </p>
        <Callout kind="tip" title="Whole-stage codegen, in one line">
          Rather than a chain of virtual function calls per row, Tungsten emits one specialized function for
          the whole stage, so filter, project, and aggregate run as a single compiled loop over the data. That
          is a large part of why DataFrame execution is fast.
        </Callout>
      </Block>

      <Block eyebrow="the runtime brain" title="AQE: re-optimize using real statistics">
        <p className="text-ink-dim leading-relaxed mb-2">
          Catalyst plans before any data flows, using estimates that can be wrong. <strong>Adaptive Query
          Execution</strong> (on by default in Spark 3+) waits for the first shuffle to finish, reads the{" "}
          <em>actual</em> partition sizes and row counts, and re-optimizes the rest of the plan with the truth:
        </p>
        <OpTable
          cols={["AQE does", "Using", "", "Result"]}
          rows={[
            { op: "Coalesce shuffle partitions", avg: "real post-shuffle sizes", avgTone: "good", why: "Merges the many tiny partitions left by the 200 default into a sensible number, fixing the over-partitioning problem automatically." },
            { op: "Switch to broadcast join", avg: "real measured side size", avgTone: "good", why: "If a side turns out small after filtering, converts a planned sort-merge join into a broadcast join at runtime." },
            { op: "Split skewed partitions", avg: "detected oversized partition", avgTone: "good", why: "Breaks a giant skewed shuffle partition into several sub-tasks so one straggler no longer stalls the stage." },
          ]}
        />
        <Callout kind="note" title="AQE makes the 200 default less painful">
          Because AQE coalesces shuffle partitions using real sizes, the old spark.sql.shuffle.partitions = 200
          footgun stings less, AQE merges the tiny ones for you. It's still good to set a sane value, but AQE
          is the safety net.
        </Callout>
      </Block>

      <Block eyebrow="the senior skill" title="Read the plan with explain()">
        <p className="text-ink-dim leading-relaxed mb-2">
          The thing that separates a senior from a button-pusher is reading{" "}
          <code className="font-mono">df.explain()</code> (or the SQL tab in the Spark UI). You're checking the
          physical plan: which join strategy was chosen, whether a filter was pushed down to the scan, whether
          AQE kicked in (you'll see <code className="font-mono">AdaptiveSparkPlan</code> nodes), and whether
          there's an unexpected extra <code className="font-mono">Exchange</code> (a shuffle).
        </p>
        <Callout kind="tip" title="What to look for in a plan">
          Scan for <code className="font-mono">BroadcastHashJoin</code> vs{" "}
          <code className="font-mono">SortMergeJoin</code>, for <code className="font-mono">Exchange</code>{" "}
          nodes (each is a shuffle), and for <code className="font-mono">PushedFilters</code> on the file scan.
          A surprise Exchange or a sort-merge join where you expected a broadcast is usually where your time is
          going.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Three pieces. Catalyst is the query optimizer, it parses, analyzes against the catalog, applies
          logical rewrites like predicate pushdown and column pruning, generates physical plans, and
          cost-picks one, then hands off to codegen. Tungsten is the execution engine, off-heap binary memory
          to dodge GC, plus whole-stage codegen that fuses a stage into one compiled loop. AQE, on by default
          in Spark 3, re-optimizes at runtime from real shuffle stats, it coalesces shuffle partitions,
          flips sort-merge to broadcast, and splits skewed partitions. And the skill I lean on is reading
          explain(): checking the join strategy, whether filters were pushed down, and whether there's an
          unexpected Exchange."
        </Callout>
      </Block>
    </>
  );
}

/* ── Memory model & OOM triage ────────────────────────────────── */
function Memory() {
  return (
    <>
      <Lede>
        This is the senior gauntlet. Anyone can raise <code className="font-mono">--executor-memory</code>{" "}
        until the error goes away; the signal an interviewer wants is that you can name <em>which</em> memory
        ran out, why, and the fix that actually matches. An executor's container is a JVM heap plus an
        off-heap overhead, and the three OOMs, driver, executor heap, and container-kill, have completely
        different causes and completely different fixes.
      </Lede>

      <Block eyebrow="the anatomy" title="What lives inside an executor container">
        <p className="text-ink-dim leading-relaxed mb-2">
          The YARN or Kubernetes container Spark asks for is not just the heap. It's the JVM heap (
          <code className="font-mono">spark.executor.memory</code>) <em>plus</em> the off-heap overhead (
          <code className="font-mono">spark.executor.memoryOverhead</code>). Inside the heap, Spark carves out
          reserved space, then a unified execution/storage region, then leaves the rest as user memory:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`YARN / K8s container = executor JVM heap + memoryOverhead
                       (spark.executor.memory)   (off-heap)

+------------------- executor JVM heap -----------------------+
|                                                             |
|  Reserved 300 MB        Spark's own bookkeeping, fixed      |
|                                                             |
|  Spark memory = (heap - 300MB) * spark.memory.fraction 0.6  |
|   +---------------------+----------------------------+      |
|   | Execution memory    | Storage memory (cache)     |      |
|   | shuffle/join/sort/  | EVICTABLE, soft boundary   |      |
|   | agg buffers          |                           |      |
|   +---------------------+----------------------------+      |
|      (storageFraction 0.5 = initial split, not a wall)      |
|                                                             |
|  User memory = (heap - 300MB) * 0.4                         |
|   your objects, UDF state, RDD-side data structures         |
+-------------------------------------------------------------+

+---- memoryOverhead = max(384MB, 10% of executor mem) -------+
|  Python / PySpark workers, pandas-UDF Arrow buffers,        |
|  netty shuffle buffers, other off-heap. OUTSIDE the heap.   |
+-------------------------------------------------------------+`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The one nuance to say out loud: execution and storage share one pool and the boundary is{" "}
          <strong>soft</strong>. Cached blocks (storage) can be evicted to make room for a shuffle or sort
          (execution), but not the other way around, execution memory is never given up mid-task. That is
          the "unified memory management" model from Spark 1.6 onward.
        </p>
      </Block>

      <Block eyebrow="the bifurcation" title="Three OOMs, three different fixes">
        <p className="text-ink-dim leading-relaxed mb-2">
          When someone says "my job OOM'd," the first job is to figure out <em>which</em> memory died,
          because the fixes point in opposite directions:
        </p>
        <OpTable
          cols={["Which OOM", "The tell", "", "Cause and the fix that matches"]}
          rows={[
            { op: "Driver OOM", avg: "OOM on the driver JVM", avgTone: "bad", why: "collect() / toPandas() pulling a big result to one JVM, an oversized broadcast materialized on the driver, or too many task results (spark.driver.maxResultSize). The fix is almost never 'more driver memory', it's stop pulling data to the driver." },
            { op: "Executor heap OOM", avg: "OutOfMemoryError in a task", avgTone: "bad", why: "A skewed partition, too few partitions, wide aggregation / window state, or giant rows overflow the heap. Fix by shrinking each task: more partitions, salt the skew, fewer cores per executor." },
            { op: "Container kill, exit 137", avg: "SIGKILL, over physical limit", avgTone: "bad", why: "YARN/K8s kills the container for exceeding its PHYSICAL memory; the heap itself was fine. It's off-heap growth (Python workers, netty, Arrow). Classic fix is RAISING memoryOverhead, or moving PySpark memory off-heap, NOT raising the heap." },
          ]}
        />
        <Callout kind="trap" title="Exit 137 is the one everyone gets wrong">
          A container killed with exit code 137 was SIGKILL'd by the resource manager for exceeding physical
          memory, it is <em>not</em> a JVM OutOfMemoryError, so there's no heap stack trace. The instinct to
          bump <code className="font-mono">spark.executor.memory</code> makes it worse by leaving even less
          room for the off-heap overhead. The right lever is{" "}
          <code className="font-mono">spark.executor.memoryOverhead</code>, especially for PySpark and pandas
          UDFs whose Python workers live entirely outside the heap.
        </Callout>
        <Callout kind="note" title="What the interviewer is listening for">
          They want to hear you <em>localize</em> the failure before you touch a knob, driver vs executor
          heap vs container-kill, and then propose the fix that matches that specific memory rather than
          reflexively raising executor memory.
        </Callout>
      </Block>

      <Block eyebrow="the early warning" title="Spill is the pressure valve, not the failure">
        <p className="text-ink-dim leading-relaxed mb-2">
          Before an executor OOMs, it usually <strong>spills</strong>: when a task's working set outgrows its
          execution memory, Spark writes the overflow to local disk and keeps going. Spill is slow but
          survivable, it's the pressure valve. The senior move is to watch the spill metrics as the{" "}
          <em>early warning</em>, because a task that spills heavily is one bad partition away from an OOM.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`working set fits in execution memory   ->  fast, no spill
working set slightly too big           ->  SPILL to disk (slow, but survives)
working set way too big / one fat row  ->  OOM (task dies)

so: spill in the Stages metrics  =  read it BEFORE the OOM, it's the tell`}
        />
        <Callout kind="tip" title="Spill (memory) vs Spill (disk)">
          The UI shows two spill numbers. Spill (memory) is the in-memory size of the data that had to be
          evicted; Spill (disk) is its serialized on-disk size. Large, lopsided spill on a few tasks (not
          all) is the classic skew signature, not a global under-partitioning problem.
        </Callout>
      </Block>

      <Block eyebrow="the drill" title="Symptom-driven triage">
        <p className="text-ink-dim leading-relaxed mb-2">
          Put it together as a ladder you climb in order, cheapest and most-likely first. Pick the symptom
          you actually saw, then work the fixes top to bottom:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`the fix ladder (stop when it's green):

  1. more partitions        -> shrink every task's slice
  2. salt / AQE skew-join   -> break up the one hot partition
  3. raise memoryOverhead   -> for exit-137 / PySpark off-heap
  4. fewer cores/executor   -> same heap split among fewer tasks
  5. avoid collect()        -> for driver OOM specifically
  6. lower broadcast thresh -> if a broadcast is the culprit`}
        />
        <Try label="OOM triage drill">
          <MemoryTriageViz />
        </Try>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Your executor keeps dying with exit 137 and you already gave it 16 GB of heap. Now
            what?</strong> Exit 137 is a physical-memory kill, not a heap OOM, so more heap is the wrong
            direction. I'd raise <code className="font-mono">spark.executor.memoryOverhead</code> (or reduce
            cores per executor for PySpark) so the off-heap Python/netty footprint fits under the container
            limit.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why would lowering cores-per-executor ever <em>help</em> a heap OOM?</strong> Because the
            heap is shared across the tasks running concurrently in that executor. Four cores means four tasks
            splitting the same execution memory; drop to two and each task gets roughly double the room,
            often enough to stop the spill-then-OOM.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You see heavy spill but no OOM, is that a problem?</strong> It's a performance problem and
            a warning, not a crash. Spill means tasks are overflowing execution memory to disk. I'd add
            partitions or reduce per-task data so the working set fits, both to speed it up and to buy safety
            margin before a skewed batch tips it into an OOM.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The default 0.6 memory fraction, when would you change it?</strong> Rarely, and only with
            evidence. If a job caches almost nothing but does huge shuffles/sorts, storage memory is wasted
            headroom, so nudging <code className="font-mono">spark.memory.fraction</code> up (or
            storageFraction down) can help. But the boundary is already soft, so most of the time repartition
            and skew fixes move the needle far more than tuning these ratios.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "First I figure out which memory died. Driver OOM is almost always collect() or an oversized
          broadcast, so I stop pulling data to the driver. Executor heap OOM is skew or too-few partitions,
          so I add partitions, salt the hot key, or cut cores per executor. Exit 137 is a container kill for
          physical memory, off-heap growth from PySpark, so I raise memoryOverhead, not the heap. And spill
          is the pressure valve I watch before any of them."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "An executor container is a JVM heap plus off-heap overhead. Inside the heap there's a fixed 300 MB
          reserved, then spark.memory.fraction, 0.6 by default, splits into a unified execution and storage
          pool where cached storage is evictable but execution isn't, and the remaining 0.4 is user memory.
          Overhead defaults to max(384 MB, 10%) and holds Python workers, Arrow buffers, and netty. The three
          OOMs need three different fixes: driver OOM means I stop collecting or drop an oversized broadcast;
          executor heap OOM means I shrink each task with more partitions, salting, or fewer cores per
          executor; and a container kill at exit 137 is physical memory, so I raise memoryOverhead or move
          PySpark memory off-heap, never the heap. Before any OOM I read the spill metrics, spill is
          survivable but it's the early warning, and lopsided spill on a few tasks is the skew tell. My fix
          ladder is: more partitions, salt or AQE skew-join, raise overhead, fewer cores per executor, avoid
          collect, lower the broadcast threshold."
        </Callout>
      </Block>
    </>
  );
}

/* ── Reading the Spark UI ─────────────────────────────────────── */
function SparkUI() {
  return (
    <>
      <Lede>
        "How would you debug a slow Spark job?" is a near-universal question, and the wrong answer is a list
        of configs. The right answer is a <em>navigation script</em> through the Spark UI: Jobs to find the
        slow stage, Stages to read the task metrics, the SQL tab to read the physical plan, and Executors for
        health. On EMR the same UI survives cluster termination through the persistent History Server.
      </Lede>

      <Block eyebrow="step 1" title="Jobs page: find the stage that hurts">
        <p className="text-ink-dim leading-relaxed mb-2">
          Start at the <strong>Jobs</strong> tab. Each action is a job; the slow or failed job is usually
          obvious from its duration. Drill in and look at its stages, one stage almost always dominates the
          wall-clock time or shows the failure. That's your target; everything after this is about
          understanding that one stage.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          They want a repeatable method, not a lucky guess. Naming the exact tab and the exact metric at each
          step (max vs median task time, shuffle read, spill) is the signal that you've actually debugged
          Spark in production, not just read about it.
        </Callout>
      </Block>

      <Block eyebrow="step 2" title="Stages page: the summary metrics table">
        <p className="text-ink-dim leading-relaxed mb-2">
          Open the slow stage and read its <strong>summary metrics</strong> table, the distribution of task
          metrics across percentiles. This one table answers most performance questions:
        </p>
        <OpTable
          cols={["Read this", "Compare", "", "What it tells you"]}
          rows={[
            { op: "Task duration", avg: "MAX vs MEDIAN", avgTone: "ok", why: "If max is many times the median, you have skew: one straggler task holds the stage hostage while the rest finished." },
            { op: "Shuffle read / write", avg: "size per task", avgTone: "ok", why: "Large shuffle read on the slow task confirms the straggler is processing a fat, skewed partition. Big totals mean a wide, expensive shuffle." },
            { op: "Spill (memory/disk)", avg: "non-zero?", avgTone: "bad", why: "Any spill means tasks overflowed execution memory to disk. Lopsided spill = skew; global spill = too-few partitions." },
            { op: "GC time", avg: "% of task time", avgTone: "bad", why: "High GC means heap pressure, tasks are churning garbage and are close to an OOM. Points at memory, not compute." },
          ]}
        />
        <Callout kind="tip" title="Max vs median is the whole skew diagnosis">
          If you learn to read one number, read the ratio of the max task time to the median. A healthy stage
          has them close; a 40x gap is skew, and the fix is salting, AQE skew-join, or broadcast, not a
          bigger cluster.
        </Callout>
      </Block>

      <Block eyebrow="step 3" title="SQL / DataFrame tab: read the physical plan DAG">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>SQL / DataFrame</strong> tab draws your query as a DAG of physical operators. This is
          where you confirm <em>why</em> the stage looks the way it does. Learn to read the node names:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`Scan parquet         -> the file read; check PushedFilters + pruned columns
   |
Exchange             -> a SHUFFLE (every Exchange is a stage boundary)
   |
SortMergeJoin        -> big-by-big join, both sides shuffled + sorted
BroadcastExchange    -> the small side being broadcast (the fast path)
   |
AdaptiveSparkPlan    -> AQE is on; the "final plan" shows runtime rewrites
   |
ReusedExchange       -> a shuffle result reused, not recomputed (good)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          A surprise <code className="font-mono">Exchange</code> you didn't expect, or a{" "}
          <code className="font-mono">SortMergeJoin</code> where you assumed a broadcast, is usually exactly
          where the time went. Under AQE, click into the final plan, the plan that ran can differ from the one
          Catalyst first produced.
        </p>
      </Block>

      <Block eyebrow="step 4" title="Executors tab, and the 5-step script">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>Executors</strong> tab shows per-executor health: dead/lost executors (a sign of OOM or
          container kills), the GC-time share, task failures, and how much RAM is used for storage. Dead
          executors plus exit-137 in the logs is the container-kill story from the memory topic. Put the
          whole thing together as a script you can recite:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`the 5-step triage script:

  1. Jobs      -> which job/stage dominates the time (or failed)?
  2. Stages    -> summary metrics: MAX vs MEDIAN task, shuffle, spill, GC
  3. SQL tab   -> physical plan: unexpected Exchange? SMJ vs broadcast?
  4. Executors -> dead executors, GC %, storage pressure
  5. Logs      -> the actual exception (OOM? exit 137? serialization?)`}
        />
        <Callout kind="tip" title="On EMR the UI outlives the cluster">
          A transient EMR cluster tears down when the job finishes, taking the live UI with it. Enable the{" "}
          <strong>persistent Spark History Server</strong> (EMR writes event logs to S3 and serves them from
          the console), so you can open the exact same Jobs / Stages / SQL views for a job that ran and
          terminated hours ago. Debugging a dead cluster is a real interview scenario.
        </Callout>
      </Block>

      <Block eyebrow="worked example" title="'Stage 7 is 40x slower than the rest'">
        <p className="text-ink-dim leading-relaxed mb-2">
          Walk the script on a concrete symptom. Stage 7 takes 40 minutes; every other stage takes about a
          minute. Here's the reasoning end to end:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`1. Jobs      -> stage 7 owns ~95% of the job's runtime. Target it.
2. Stages    -> summary metrics for stage 7:
                  median task = 8s,  MAX task = 38 min   <- max ~285x median, skew!
                  slow task shuffle-read = 24 GB vs 60 MB median
                  slow task Spill (disk) = 12 GB
3. SQL tab   -> stage 7 is a SortMergeJoin on user_id
4. diagnosis -> one user_id (a null / bot / mega-account) holds most rows;
                after the shuffle it all lands on one reducer task
5. fix       -> AQE skew-join to auto-split it, or salt user_id,
                or broadcast the dimension side if it's small enough`}
        />
        <Callout kind="note" title="The pattern to internalize">
          One stage dominating + one task's max far above median + huge shuffle-read and spill on that task =
          join/groupBy key skew, every time. The UI hands you the diagnosis; you just have to read it in that
          order.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>The cluster already terminated, how do you debug it now?</strong> Through the persistent
            Spark History Server. EMR writes event logs to S3, so the History Server replays the exact Jobs,
            Stages, and SQL views for a job that's long gone, no live cluster needed.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You see the max task at 40x the median but shuffle-read is uniform. Still skew?</strong>{" "}
            Probably not key skew then. Uniform shuffle-read with one slow task points at a bad node (slow
            disk, noisy neighbor) or a GC storm on one executor, check the Executors tab's GC time and whether
            that task landed on a repeatedly-slow host.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Two Exchanges in a plan you expected one, where'd the extra shuffle come from?</strong>{" "}
            Usually a repartition you didn't need, a join and a following groupBy on different keys, or a
            window function. Each needs its own partitioning, so aligning keys (or bucketing) can collapse two
            shuffles into one.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you know AQE actually did something?</strong> The SQL tab's final plan shows{" "}
            <code className="font-mono">AdaptiveSparkPlan isFinalPlan=true</code> and you can see coalesced
            partition counts or a join that flipped to broadcast versus the initial plan. If the numbers match
            the initial estimate, AQE had nothing to change.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I don't guess at configs, I walk the UI. Jobs to find the stage that owns the runtime, Stages to
          read the summary metrics, max versus median task time for skew, plus shuffle, spill, and GC. Then
          the SQL tab to read the physical plan for an unexpected Exchange or the wrong join. Executors for
          dead executors and GC pressure, and the logs for the actual exception. On EMR the History Server
          lets me do all of that after the cluster is gone."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "My debugging script has five steps. One, the Jobs page to find which stage dominates the wall-clock
          or failed. Two, that stage's summary metrics table, I compare the max task duration to the median,
          because a large gap is skew, and I read shuffle read/write, spill in memory and disk, and GC
          percentage. Three, the SQL/DataFrame tab to read the physical plan DAG: every Exchange is a shuffle,
          I check for a surprise one, whether a join is SortMergeJoin or BroadcastExchange, and under AQE I
          read the final plan for runtime rewrites and reused exchanges. Four, the Executors tab for dead
          executors, GC share, and storage pressure. Five, the logs for the real exception. Concretely, if
          stage 7 is 40x slower, I'll find its max task is 40x the median with a 24 GB shuffle-read and heavy
          spill on that one task, and the SQL tab shows a SortMergeJoin, that's key skew, which I fix with AQE
          skew-join, salting, or a broadcast. And on EMR I lean on the persistent Spark History Server so I
          can do this even after the cluster terminates."
        </Callout>
      </Block>
    </>
  );
}

/* ── The write path & output tuning ───────────────────────────── */
function WritePath() {
  return (
    <>
      <Lede>
        Reads get all the attention, but writes are where jobs quietly go wrong: the small-files explosion,
        the <code className="font-mono">coalesce(1)</code> that turns a 20-minute job into an all-nighter, and
        the S3 rename problem that makes commits slow and, historically, unsafe. Knowing how many files a
        write produces, and why, is a real senior tell.
      </Lede>

      <Block eyebrow="save modes" title="How Spark decides what to do with existing data">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every write has a <strong>save mode</strong> that controls behavior when the target already exists:
        </p>
        <OpTable
          cols={["Mode", "If the path exists", "", "Note"]}
          rows={[
            { op: "errorIfExists (default)", avg: "throw", avgTone: "ok", why: "The safe default, refuses to touch existing data. Forces you to be explicit." },
            { op: "append", avg: "add new files", avgTone: "good", why: "Adds files alongside the existing ones. Watch for duplicates on re-run, append is not idempotent by itself." },
            { op: "overwrite", avg: "replace", avgTone: "ok", why: "Deletes then writes. Scope depends on partitionOverwriteMode below, this is the subtle one." },
            { op: "ignore", avg: "do nothing", avgTone: "ok", why: "Silently skips the write if the path exists. Rarely what you actually want." },
          ]}
        />
        <Callout kind="trap" title="static vs dynamic partitionOverwriteMode">
          With <code className="font-mono">overwrite</code> on a partitioned table, the default{" "}
          <strong>static</strong> mode wipes the <em>entire</em> table (or all partitions matched by the
          path) before writing, easy to blow away last year's data by accident. Setting{" "}
          <code className="font-mono">spark.sql.sources.partitionOverwriteMode=dynamic</code> overwrites{" "}
          <em>only</em> the partitions your DataFrame actually produced, leaving the rest intact. For
          incremental partitioned writes, dynamic is almost always what you mean.
        </Callout>
      </Block>

      <Block eyebrow="the file-count math" title="partitionBy and the small-files explosion">
        <p className="text-ink-dim leading-relaxed mb-2">
          <code className="font-mono">partitionBy</code> lays data out in directories by column value (great
          for partition pruning on read). But the number of output files is not magic, it's arithmetic. Every
          task writes one file per output partition-directory it touches:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`files written  ~=  (# tasks in the final stage) x (# distinct partition values a task touches)

example:
  200 shuffle partitions (tasks)  x  writing a date-partitioned table
  each task holds rows for ~all 30 days it saw
  ->  200 x 30  =  6,000 files, many tiny

the fix: repartition by the SAME columns you partitionBy, so each
partition value is concentrated into few tasks:

  df.repartition("date").write.partitionBy("date")...
  ->  ~1 task per date  ->  ~30 files, one per day`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Tiny files are a triple tax: slow writes (commit overhead per file), slow reads (per-file open
          cost), and pressure on the metastore/namenode. Aligning the write's partitioning with{" "}
          <code className="font-mono">partitionBy</code> is the single highest-leverage output fix.
        </p>
      </Block>

      <Block eyebrow="the classic disaster" title="coalesce(1), and what to do instead">
        <p className="text-ink-dim leading-relaxed mb-2">
          The instinct "I want one output file, so I'll <code className="font-mono">coalesce(1)</code>" is a
          trap. <code className="font-mono">coalesce(1)</code> collapses all data into a{" "}
          <strong>single partition</strong>, which means a <strong>single task on a single core</strong>
          writes the entire dataset, no parallelism, and often a spill or OOM on any non-trivial volume. A
          job that ran in 20 minutes across 200 cores now runs for hours on one.
        </p>
        <OpTable
          cols={["Goal", "Wrong", "", "Right"]}
          rows={[
            { op: "One / few output files", avg: "coalesce(1)", avgTone: "bad", why: "Serializes the whole write onto one core; slow, and OOMs on large data. Only ever safe for genuinely tiny results." },
            { op: "Fewer, evenly-sized files", avg: "-", avgTone: "good", why: "repartition(n) for even sizes (accepts a shuffle), or coalesce(n) with n well above 1 to shrink cheaply without one giant task." },
            { op: "Cap rows per file", avg: "-", avgTone: "good", why: "maxRecordsPerFile bounds file size directly, so tasks split their output into multiple right-sized files instead of one huge one." },
          ]}
        />
        <Callout kind="tip" title="repartition before partitionBy, and cap with maxRecordsPerFile">
          The two-part recipe: <code className="font-mono">repartition</code> by your partition columns so
          tasks align with output directories, and set{" "}
          <code className="font-mono">maxRecordsPerFile</code> so a hot partition doesn't produce one giant
          file. That gives you a small, even file count without the coalesce(1) serialization.
        </Callout>
      </Block>

      <Block eyebrow="the S3 gotcha" title="Why commits are slow on S3, and the committer answer">
        <p className="text-ink-dim leading-relaxed mb-2">
          Spark's default (Hadoop) commit protocol writes each task's output to a temp location and then{" "}
          <strong>renames</strong> it into place on success. On HDFS a rename is a cheap metadata flip. On{" "}
          <strong>S3 there is no rename</strong>, it's a copy-then-delete of every object, which is slow, and
          because S3 was historically eventually consistent, the rename dance could also lose or duplicate
          data on failures.
        </p>
        <OpTable
          cols={["Approach", "How it commits", "", "On S3"]}
          rows={[
            { op: "Default FileOutputCommitter", avg: "rename temp -> final", avgTone: "bad", why: "Rename = copy + delete per file on S3. Slow, and v1/v2 have correctness pitfalls on failures. Avoid for big S3 writes." },
            { op: "EMRFS S3-optimized committer", avg: "multipart upload, no rename", avgTone: "good", why: "AWS EMR's committer uses S3 multipart uploads finalized at commit, no renames. The default answer on EMR." },
            { op: "S3A magic committer", avg: "delayed-complete multipart", avgTone: "good", why: "The open-source Hadoop S3A equivalent (for non-EMR / OSS Spark). Same idea: commit via multipart completion, not rename." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you know object storage is not a filesystem, rename is O(size), not O(1), and that the fix is a
          purpose-built committer (EMRFS S3-optimized on EMR, S3A magic elsewhere), or a table format like
          Iceberg/Delta whose commit is an atomic metadata operation rather than a rename.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Your date-partitioned nightly write makes 50,000 tiny files. Fix it.</strong> Repartition
            by the partition column(s) before writing so each date lands in one or a few tasks, and cap file
            size with <code className="font-mono">maxRecordsPerFile</code>. That turns 50,000 tiny files into a
            handful of right-sized ones per date.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Won't repartition("date") cause its own skew if one date is huge?</strong> Yes, a mega-day
            becomes one fat task. So I'd repartition on the partition column plus a salt or a secondary
            high-cardinality column, or just rely on <code className="font-mono">maxRecordsPerFile</code> to
            split that day across several files while keeping the task count reasonable.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Overwrite blew away the whole table when you only reran one day. What happened?</strong>{" "}
            Static partitionOverwriteMode. In static mode, overwrite truncates the entire table before
            writing. Switching to <code className="font-mono">dynamic</code> overwrites only the partitions the
            DataFrame produced, so rerunning one day replaces just that day.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why is a rename on S3 dangerous, not just slow?</strong> Because it's a non-atomic
            copy-then-delete over many objects. A failure mid-commit can leave partial or duplicated output,
            and historically S3's eventual consistency could hide freshly written files. A multipart-based
            committer or an Iceberg/Delta atomic commit removes the rename entirely.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Writes fail in three predictable ways. Save mode: with partitioned overwrite I set dynamic mode so
          I only replace the partitions I produced, not the whole table. File count: files equal tasks times
          the partition values each task touches, so I repartition by the same columns I partitionBy and cap
          with maxRecordsPerFile instead of exploding into tiny files. And I never coalesce(1) big data, it's
          one core writing everything. On S3 I use the EMRFS S3-optimized committer because rename-based
          commits are slow and unsafe."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Start with save modes: errorIfExists, append, overwrite, ignore, and the trap is that overwrite on
          a partitioned table is static by default, it wipes the whole table, so for incremental writes I set
          partitionOverwriteMode to dynamic to touch only the partitions I generated. Then the file-count
          math: the number of output files is roughly the number of final-stage tasks times the distinct
          partition values each task holds, so a 200-task job writing a 30-day partitioned table can make
          thousands of tiny files. The fix is to repartition by the same columns as partitionBy so each
          partition value concentrates into few tasks, plus maxRecordsPerFile to bound file size. I avoid
          coalesce(1) because it collapses everything to a single task on a single core, no parallelism and
          frequent OOM; if I want fewer files I repartition to a sensible n or coalesce to n greater than one.
          Finally, on S3, the default commit protocol renames temp files into place, and since S3 has no
          rename it's a slow copy-plus-delete that's historically unsafe on failures, so on EMR I use the
          EMRFS S3-optimized committer, or the S3A magic committer on OSS Spark, or a table format like
          Iceberg or Delta whose commit is an atomic metadata operation."
        </Callout>
      </Block>
    </>
  );
}

/* ── Traps & internals rapid-round ────────────────────────────── */
function Traps() {
  return (
    <>
      <Lede>
        Senior Spark rounds love the rapid-fire gotcha: cache vs checkpoint, why a broadcast still failed,
        "Task not serializable," what a UDF really costs, when an accumulator lies. None of these need a
        five-minute answer, they need one crisp sentence that proves you've hit the wall in production. Here's
        the whole armory.
      </Lede>

      <Block eyebrow="state & serialization" title="cache/checkpoint, Task not serializable, Kryo">
        <OpTable
          cols={["Gotcha", "The crisp answer", "", "Detail"]}
          rows={[
            { op: "cache() vs checkpoint()", avg: "lineage kept vs truncated", avgTone: "ok", why: "cache/persist stores the result but KEEPS the lineage (recomputed if a block is lost). checkpoint writes to reliable storage and TRUNCATES lineage, use it to cut a lineage that's grown too long in an iterative job." },
            { op: "Task not serializable", avg: "closure captured the wrong thing", avgTone: "bad", why: "A lambda captured a non-serializable object (a DB client, the enclosing class). Fixes: pull out a local val, use mapPartitions to build the object inside the task, or mark the field @transient." },
            { op: "Kryo vs Java serialization", avg: "Kryo is smaller/faster", avgTone: "good", why: "Java serialization is the default but bulky and slow. Kryo is much more compact and faster; register your classes for the best size. Matters for shuffle and cache footprint." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          For each trap they want the one-line cause and the specific fix, not hand-waving. "It's a closure
          capturing the outer class; I hoist a local val or move construction into mapPartitions" beats "I'd
          add serialization" every time.
        </Callout>
      </Block>

      <Block eyebrow="the broadcast that betrays you" title="Why a broadcast join is still slow or dies">
        <p className="text-ink-dim leading-relaxed mb-2">
          Broadcast joins are the fast path, until they aren't. Three ways they turn on you:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Stale statistics.</strong> Catalyst broadcast a table it <em>estimated</em> was small, but stats were stale (no ANALYZE, or post-filter size guessed wrong), so it broadcasts something huge.</li>
          <li><strong>Driver collect pressure.</strong> The broadcast side is first collected to the driver, then shipped to every executor. A "small" table that's actually 4 GB OOMs the driver on the way out.</li>
          <li><strong>The hard limit.</strong> A broadcast cannot exceed roughly <strong>8 GB</strong>, it's an internal block-size ceiling. Past that the broadcast fails outright, regardless of how much driver memory you have.</li>
        </ul>
        <Callout kind="trap" title="'Just broadcast it' has a ceiling">
          Forcing <code className="font-mono">broadcast(df)</code> on a table that isn't genuinely small
          backfires: driver OOM on the way out, or an outright failure past the ~8 GB limit. Broadcast is for
          dimension-sized tables, not fact-sized ones.
        </Callout>
      </Block>

      <Block eyebrow="the cost of a UDF" title="Why UDFs are slow, and what to use instead">
        <p className="text-ink-dim leading-relaxed mb-2">
          A UDF is a black box to Catalyst. It can't see inside your function, so it <strong>can't push down
          filters, prune columns, or fold your logic into whole-stage codegen</strong> across it, the
          optimizer just runs it. In PySpark it's worse: a plain row-at-a-time Python UDF serializes each row
          out to a Python worker and back, a per-row round trip.
        </p>
        <OpTable
          cols={["Option", "Cost", "", "When"]}
          rows={[
            { op: "Built-in / SQL functions", avg: "codegen, pushdown", avgTone: "good", why: "Always prefer these. Catalyst optimizes them and Tungsten codegens them. No serialization boundary." },
            { op: "pandas UDF (vectorized)", avg: "batched via Arrow", avgTone: "ok", why: "If you must write custom logic in PySpark, a pandas/vectorized UDF ships batches over Arrow instead of row-by-row, far cheaper than a plain Python UDF." },
            { op: "Plain Python UDF", avg: "per-row Python round trip", avgTone: "bad", why: "Serializes every row to a Python worker and back, opaque to Catalyst. The slowest option; last resort." },
          ]}
        />
        <Callout kind="tip" title="mapPartitions for per-partition setup">
          When you need an expensive object (a model, a DB connection) inside a transformation, don't build it
          per row. <code className="font-mono">mapPartitions</code> runs your function once per partition, so
          you construct the object once and reuse it across every row in that partition, and it dodges the
          Task-not-serializable trap because the object is created inside the task.
        </Callout>
      </Block>

      <Block eyebrow="correctness & scaling" title="Accumulators, bucketing, dynamic allocation, broadcast vars">
        <OpTable
          cols={["Feature", "The gotcha / win", "", "Detail"]}
          rows={[
            { op: "Accumulators", avg: "exactly-once only in ACTIONS", avgTone: "bad", why: "A task that's retried or run speculatively re-executes the transformation, so accumulator updates inside transformations can DOUBLE-COUNT. They're only reliable for accumulators updated inside an action." },
            { op: "Broadcast variables vs closure capture", avg: "ship once, not per task", avgTone: "good", why: "A broadcast variable ships a read-only value to each executor ONCE and caches it; capturing the same object in a closure re-serializes and re-ships it with every task. Use broadcast vars for big lookup maps." },
            { op: "Bucketing", avg: "pre-shuffled joins", avgTone: "good", why: "Writing a table bucketed by the join key stores it pre-partitioned, so repeated joins/aggregations on that key skip the shuffle entirely. Pays off for tables joined the same way over and over." },
            { op: "Dynamic allocation", avg: "scale executors to load", avgTone: "ok", why: "Spark adds/removes executors based on pending tasks. Needs external shuffle service or shuffle tracking so removing an executor doesn't lose its shuffle files. Great for bursty, multi-tenant clusters." },
          ]}
        />
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Your iterative job gets slower every iteration and the plan is enormous. Why?</strong>{" "}
            Lineage keeps growing, each iteration appends to the DAG, so recomputation and planning cost
            balloon. <code className="font-mono">checkpoint()</code> writes the current result to reliable
            storage and truncates the lineage, resetting the plan.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You broadcast a lookup table and the driver OOM'd. But it was 'small'.</strong> A broadcast
            is collected to the driver before being shipped out, and "small" was an estimate. If it's really a
            few GB it exceeds driver memory on the way out, or blows the ~8 GB broadcast ceiling. I'd verify
            its true size and fall back to a sort-merge or shuffle-hash join.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your row-count accumulator reports more than the actual rows. Bug?</strong> Not a bug, a
            double-count. The accumulator lives in a transformation that got retried or run speculatively, so
            its updates fired more than once. Accumulators are only exactly-once inside an action; for a
            trustworthy count I'd use a proper aggregation.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Two big tables are joined the same way in a dozen jobs. How do you kill the repeated
            shuffle?</strong> Bucket both tables by the join key on write. Bucketing stores them
            pre-partitioned, so the join reads co-located buckets and skips the shuffle every time after that.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "cache keeps lineage, checkpoint truncates it. 'Task not serializable' is a closure capturing
          something non-serializable, fixed with a local val or mapPartitions. Broadcasts still die from
          stale stats, driver collect pressure, or the ~8 GB ceiling. UDFs are opaque to Catalyst, so I prefer
          built-ins, then vectorized pandas UDFs over row-at-a-time Python. And accumulators only count
          exactly once inside an action, in a retried transformation they double-count."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Run down the classics. cache/persist stores a result but keeps the lineage; checkpoint writes to
          reliable storage and truncates it, which is how you tame a runaway lineage in an iterative job.
          'Task not serializable' means a closure captured a non-serializable object like a DB client or the
          enclosing class, fixed by hoisting a local val, moving construction into mapPartitions, or marking
          the field transient. Kryo beats Java serialization on size and speed if you register classes. A
          broadcast join can still be slow or fail three ways: stale stats broadcasting something big, the
          driver OOMing because the broadcast is collected there first, or the roughly 8 GB hard limit. UDFs
          are opaque to Catalyst so they break pushdown and codegen, and a plain PySpark UDF is a per-row
          Python round trip, so I use built-ins first and vectorized pandas UDFs via Arrow when I must, and
          mapPartitions for expensive per-partition setup. Accumulators are only exactly-once in actions,
          retried transformations double-count. Broadcast variables ship a read-only value once per executor
          instead of per task. Bucketing pre-shuffles tables for repeated joins. And dynamic allocation scales
          executors to load, as long as shuffle tracking or the external shuffle service protects the shuffle
          files."
        </Callout>
      </Block>
    </>
  );
}

/* ── Streaming state & watermarks ─────────────────────────────── */
function StreamState() {
  return (
    <>
      <Lede>
        Structured Streaming is "run this batch query continuously," and the hard part is <em>state</em>:
        anything that aggregates or joins over time has to remember rows across micro-batches. The number one
        way streaming jobs die in production is unbounded state, and the watermark is the mechanism that keeps
        it bounded. If you can explain the watermark precisely, you've cleared the bar.
      </Lede>

      <Block eyebrow="where state lives" title="The state store: HDFS-backed vs RocksDB">
        <p className="text-ink-dim leading-relaxed mb-2">
          Stateful operators (windowed aggregations, dedup, stream-stream joins) keep their working state in a{" "}
          <strong>state store</strong>, checkpointed so the job can recover exactly-once after a failure. Two
          backends:
        </p>
        <OpTable
          cols={["Backend", "State on the executor", "", "Use when"]}
          rows={[
            { op: "HDFS-backed (default)", avg: "in JVM heap", avgTone: "ok", why: "The default store keeps state as in-memory maps on the executor heap, backed by checkpoint files. Fine for modest state, but large state means heavy GC and heap pressure." },
            { op: "RocksDB (since 3.2)", avg: "off-heap, on local disk", avgTone: "good", why: "Keeps state in a native RocksDB instance off-heap with local-disk spill, so millions of keys don't blow the JVM heap. The answer for large-state jobs." },
          ]}
        />
        <Callout kind="tip" title="RocksDB is the large-state answer">
          If someone describes a streaming job with huge state (long windows, high-cardinality keys) hitting
          GC pauses or OOM, switching the state store to RocksDB is the standard move, it moves state off the
          heap onto local disk so the heap stays small.
        </Callout>
      </Block>

      <Block eyebrow="the mechanism that bounds state" title="How a watermark actually works">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>watermark</strong> is the engine's notion of "how far along in event time we are." It's
          defined as the <strong>maximum event time seen so far, minus an allowed-lateness delay</strong>, and
          it advances at the end of each micro-batch:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`withWatermark("event_time", "10 minutes")

  watermark  =  max(event_time seen)  -  10 min

each micro-batch:
  1. advance the watermark from the batch's max event time
  2. EVICT window/aggregation state older than the watermark (frees memory)
  3. DROP incoming rows whose event time is behind the watermark (too late)

  so the delay is the trade: bigger delay = more late data kept
                              = more state retained = more memory`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          That eviction is the whole point: without a watermark, a windowed aggregation must keep{" "}
          <em>every</em> window open forever in case a late row arrives, state grows without bound. The
          watermark says "past this point I'll never see data this old," so Spark can finalize and drop old
          windows. In append output mode, a windowed result is only emitted once the watermark has passed the
          window's end.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          The precise definition, max event time minus delay, advanced per batch, plus the consequence: it
          both evicts old state and drops late rows. Saying "it handles late data" without the
          state-eviction/memory link misses the point of why watermarks exist.
        </Callout>
      </Block>

      <Block eyebrow="joins & sinks" title="Stream-stream joins and foreachBatch">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two things trip people up. A <strong>stream-stream join</strong> has to buffer both sides as state,
          so it requires <strong>watermarks on both streams plus a time-range condition</strong> on the join
          (e.g. clicks within 30 minutes of an impression). Without those bounds the buffered state is
          infinite. And <code className="font-mono">foreachBatch</code> is the escape hatch for sinks:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Idempotent by batchId.</strong> foreachBatch hands you a batch DataFrame and a monotonic batchId; using the id to make writes idempotent is how you get exactly-once into sinks that don't support it natively.</li>
          <li><strong>MERGE into a lakehouse table.</strong> It's the standard way to upsert a micro-batch into Iceberg or Delta with a MERGE, which the built-in sinks can't express.</li>
          <li><strong>Reuse batch writers.</strong> Any sink that only has a batch API (a JDBC bulk write, a custom connector) can be driven per micro-batch from foreachBatch.</li>
        </ul>
        <Callout kind="tip" title="foreachBatch = 'treat each micro-batch as a normal DataFrame'">
          It converts the streaming problem back into a batch write you already know how to do, which is why
          MERGE-into-Delta/Iceberg and exactly-once upserts almost always go through foreachBatch.
        </Callout>
      </Block>

      <Block eyebrow="pacing the stream" title="Triggers and backpressure">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Triggers</strong> control when each micro-batch fires, and <strong>backpressure</strong>{" "}
          controls how much it ingests:
        </p>
        <OpTable
          cols={["Control", "Setting", "", "What it does"]}
          rows={[
            { op: "Default trigger", avg: "micro-batch ASAP", avgTone: "good", why: "Processes a batch, then immediately starts the next. The standard continuous-ish streaming mode." },
            { op: "Trigger.AvailableNow", avg: "drain then stop", avgTone: "good", why: "Processes all currently-available data in one or more batches, then stops. The modern way to run a streaming pipeline as a scheduled catch-up batch job." },
            { op: "Continuous (experimental)", avg: "low-latency, rare", avgTone: "bad", why: "A millisecond-latency mode that bypasses micro-batching. Experimental, limited operator support, rarely used in production." },
            { op: "Backpressure limits", avg: "maxOffsetsPerTrigger / maxFilesPerTrigger", avgTone: "ok", why: "Cap how much a single batch pulls (Kafka offsets, or files for file sources), so a backlog doesn't create one giant batch that OOMs. Essential when catching up from a lag." },
          ]}
        />
      </Block>

      <Block eyebrow="the number one killer" title="Unbounded state">
        <p className="text-ink-dim leading-relaxed mb-2">
          Almost every streaming production incident traces back to one thing: <strong>state that grows
          without bound</strong>. Two causes dominate, a missing or too-generous watermark (so old windows
          never evict), and <strong>high-cardinality keys</strong> (a groupBy on user_id or session_id where
          keys keep arriving and never expire). State climbs, GC pauses grow, and eventually the job OOMs or
          falls hopelessly behind.
        </p>
        <Callout kind="trap" title="Every stateful stream needs a bound">
          If you aggregate or join over time, ask "what evicts this state?" The answer must be a watermark (or
          a state timeout). No eviction plus keys that never stop arriving equals a job that dies slowly. This
          is the single most common streaming failure, and naming it unprompted is a strong senior signal.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Your streaming job's memory climbs forever until it OOMs. Diagnose it.</strong> Unbounded
            state. Either there's no watermark so windowed state never evicts, or the grouping key is
            high-cardinality and keys never expire. I'd add/tighten a watermark, and for large legitimate
            state move the state store to RocksDB.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You set a 10-minute watermark and legitimate late data is being dropped. Trade-off?</strong>{" "}
            The watermark delay is exactly that trade: a longer delay keeps more late data but retains more
            state and more memory. I'd widen it to the real lateness the business needs and accept the extra
            state, or route dropped-late rows to a side path for reconciliation.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you get exactly-once upserts into a Delta/Iceberg table from a stream?</strong>{" "}
            <code className="font-mono">foreachBatch</code>: it gives me a batch DataFrame and a batchId, so I
            run a MERGE into the table and use the batchId (or a dedup key) to make the write idempotent across
            retries.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A backlog built up and the next batch is enormous. How do you keep it from OOMing?</strong>{" "}
            Cap the intake per trigger, <code className="font-mono">maxOffsetsPerTrigger</code> for Kafka or{" "}
            <code className="font-mono">maxFilesPerTrigger</code> for file sources, so the catch-up is spread
            over many bounded batches instead of one giant one, or use Trigger.AvailableNow to drain in
            controlled steps.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Stateful streaming keeps working state in a state store, HDFS-backed on the heap by default, or
          RocksDB off-heap since 3.2 for large state. A watermark is max event time minus an allowed delay,
          advanced each micro-batch; it evicts state older than that and drops later rows, which is what keeps
          state bounded. Stream-stream joins need watermarks and a time condition on both sides, foreachBatch
          handles exactly-once MERGE into Delta/Iceberg, and the number one killer is unbounded state from a
          missing watermark or high-cardinality keys."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Structured Streaming runs a batch query continuously, and the hard part is state. Stateful
          operators, windowed aggregations, dedup, stream-stream joins, keep state in a checkpointed state
          store; the default is HDFS-backed in the JVM heap, and since Spark 3.2 you can use RocksDB to hold
          large state off-heap on local disk and avoid GC blowups. The watermark is the key concept: it's the
          max event time seen minus a configured delay, and it advances at the end of each micro-batch. Each
          batch it does two things, evicts window and aggregation state older than the watermark, freeing
          memory, and drops incoming rows whose event time is behind it, that's the late-data policy, and in
          append mode a window only emits once the watermark passes its end. Stream-stream joins buffer both
          sides, so they require watermarks on both plus a time-range join condition or the state is infinite.
          foreachBatch turns each micro-batch into a normal DataFrame, which is how I do idempotent
          exactly-once writes keyed by batchId and MERGE upserts into Iceberg or Delta. Triggers pace it,
          default micro-batch, AvailableNow to drain and stop as a scheduled catch-up, continuous is
          experimental, and maxOffsetsPerTrigger or maxFilesPerTrigger cap intake so a backlog doesn't create
          one OOMing batch. The thing I watch hardest is unbounded state, a missing watermark or
          high-cardinality keys, because that's the number one way these jobs die."
        </Callout>
      </Block>
    </>
  );
}

/* ── Staying current: Spark 3.x to 4 ──────────────────────────── */
function Spark4() {
  return (
    <>
      <Lede>
        Interviewers use "what's changed recently in Spark?" to sort people who ran Spark 2 five years ago
        from people who track it. The headline arc: Spark 3.0 made the optimizer adaptive and runtime-aware,
        and Spark 4.0 (2025) tightened correctness with ANSI-by-default and added first-class semi-structured
        support. Know the milestones and one behavioral change worth naming.
      </Lede>

      <Block eyebrow="the 3.x milestones" title="What Spark 3 actually added">
        <OpTable
          cols={["Feature (Spark 3.x)", "One-liner", "", "Why it matters"]}
          rows={[
            { op: "Adaptive Query Execution", avg: "re-optimize at runtime", avgTone: "good", why: "Covered in this tool: coalesces shuffle partitions, flips sort-merge to broadcast, and splits skewed partitions using real post-shuffle stats. On by default in 3.2+." },
            { op: "Dynamic partition pruning", avg: "prune scans at runtime", avgTone: "good", why: "In a star-schema join, DPP uses the filtered dimension table to prune which fact-table partitions get scanned at RUNTIME, huge I/O savings on big fact tables." },
            { op: "Join hints", avg: "override the planner", avgTone: "ok", why: "BROADCAST, MERGE, SHUFFLE_HASH, SHUFFLE_REPLICATE_NL hints let you force a join strategy when you know better than the cost estimate." },
          ]}
        />
        <Callout kind="tip" title="DPP is the 3.0 crowd-pleaser">
          Dynamic partition pruning is the most quotable 3.0 feature: filter the small dimension, and Spark
          skips reading the fact-table partitions that can't match, at runtime, after the filter is known.
          On a partitioned fact table it can turn a full scan into a tiny one.
        </Callout>
      </Block>

      <Block eyebrow="the 4.0 headline" title="ANSI mode by default, and VARIANT">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Spark 4.0 (2025) makes ANSI SQL mode the default.</strong> This is the behavioral change
          worth naming out loud: operations that used to <em>silently</em> return null or wrap around, a bad
          cast, integer overflow, divide-by-zero, now <strong>raise an error</strong> instead. It's safer and
          matches standard SQL, but it can break pipelines that quietly relied on the old null-on-failure
          behavior, so a migration has to expect it.
        </p>
        <OpTable
          cols={["Spark 4.0 change", "What it is", "", "Interview angle"]}
          rows={[
            { op: "ANSI mode default", avg: "errors, not silent nulls", avgTone: "good", why: "Bad casts / overflow / div-by-zero now throw. Correctness win, but a migration risk worth flagging, name it as THE behavioral change." },
            { op: "VARIANT type", avg: "native semi-structured", avgTone: "good", why: "A first-class type for JSON-like semi-structured data with efficient binary storage and path access, no more parsing JSON into strings and re-casting." },
            { op: "Spark Connect (GA)", avg: "thin client / server split", avgTone: "good", why: "Introduced in 3.4, GA in 3.5, further matured in 4.0: a decoupled client that talks to the driver over gRPC, so apps and notebooks connect remotely without embedding a full Spark driver." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          One sharp, current fact, not a changelog. Naming ANSI-by-default in Spark 4.0 as a behavioral change
          that can break silent-null pipelines shows you actually track releases and think about migration
          risk.
        </Callout>
      </Block>

      <Block eyebrow="architecture & APIs" title="Spark Connect and pandas API on Spark">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Spark Connect</strong> (3.4+, matured through 4.0) decouples the client from the driver: the
          client builds an unresolved logical plan and sends it over gRPC to a remote Spark server, so a thin
          application, notebook, or IDE can drive Spark without embedding the whole JVM driver. It's how Spark
          gets a stable, language-agnostic client/server boundary and easier upgrades.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>The pandas API on Spark</strong> (the former Koalas, merged in since 3.2) lets you write
          pandas-style code that executes on Spark's distributed engine, an on-ramp for pandas users to scale
          out without rewriting to the DataFrame API.
        </p>
        <Callout kind="tip" title="Spark Connect in one line">
          "The client sends a logical plan over gRPC to a remote driver," that's the whole idea, and it's why
          thin clients, better multi-tenancy, and independent client/server upgrades became possible.
        </Callout>
      </Block>

      <Block eyebrow="don't get baited" title="Photon is not open-source Spark">
        <p className="text-ink-dim leading-relaxed mb-2">
          A common trap: someone mentions <strong>Photon</strong> as if it were a Spark feature. Photon is{" "}
          <strong>Databricks-proprietary</strong>, a C++ vectorized execution engine that accelerates Spark
          SQL on the Databricks platform. It's real and fast, but it is <em>not</em> part of open-source
          Apache Spark, so on EMR or vanilla Spark you don't have it. Naming that boundary correctly signals
          you know the difference between the OSS engine and vendor add-ons.
        </p>
        <Callout kind="trap" title="Know the OSS / vendor line">
          Photon (Databricks) and, say, EMR's own runtime optimizations are vendor layers on top of Apache
          Spark, not OSS features. If a question assumes Photon, clarify the platform, on EMR the equivalent
          conversation is the EMR Spark runtime and committers, not Photon.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>You upgrade to Spark 4.0 and a previously-passing job starts throwing on a cast. Why?</strong>{" "}
            ANSI mode is now the default. A cast or arithmetic that used to return null on failure now raises.
            I'd audit for silent-null reliance, fix the data or use try_cast, or, as a temporary bridge,
            disable ANSI while migrating.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A star-schema query scans the whole 2 TB fact table despite a tight filter on the dim.
            Fix?</strong> That's what dynamic partition pruning solves. If the fact table is partitioned on the
            join key and DPP is enabled, Spark prunes the fact partitions at runtime using the filtered
            dimension, so it reads a fraction of the data.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why would you run Spark behind Spark Connect instead of embedding the driver?</strong> To
            decouple the client from the cluster: thin clients and notebooks connect over gRPC, multiple users
            share a server, and you can upgrade the Spark server independently of client apps. It removes the
            "every client is a full JVM driver" coupling.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your teammate says 'just turn on Photon on EMR.' Response?</strong> Photon is
            Databricks-only; it isn't part of Apache Spark and isn't available on EMR. On EMR the levers are
            the EMR-optimized Spark runtime, AQE, and the S3 committers, not Photon.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Spark 3 made the optimizer runtime-aware: AQE, plus dynamic partition pruning that prunes fact-table
          scans at runtime, and join hints. Spark 4.0 in 2025 makes ANSI mode the default, so bad casts and
          overflow now error instead of silently returning null, that's the behavioral change to flag on any
          migration, and it adds a VARIANT type for semi-structured data. Spark Connect gives a thin gRPC
          client/server split. And Photon is Databricks-proprietary, not open-source Spark, so it's not on
          EMR."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The arc is optimizer-gets-smarter then correctness-gets-stricter. Spark 3.0 introduced Adaptive
          Query Execution, which re-optimizes from real shuffle stats to coalesce partitions, flip to
          broadcast, and split skew, and dynamic partition pruning, which in a star-schema join uses the
          filtered dimension to prune which fact-table partitions get scanned at runtime, a massive I/O win.
          It also added join hints to override the planner. Spark 4.0, in 2025, makes ANSI SQL mode the
          default: bad casts, integer overflow, and divide-by-zero now raise errors instead of silently
          producing null, which is the behavioral change I'd call out on any upgrade because pipelines that
          leaned on null-on-failure will break. It also adds a first-class VARIANT type for semi-structured
          JSON-like data with efficient binary storage. On the architecture side, Spark Connect, from 3.4 and
          matured in 4.0, decouples the client from the driver by sending an unresolved logical plan over gRPC,
          so thin clients and notebooks connect remotely, and the pandas API on Spark, formerly Koalas, lets
          pandas users run distributed. One clarification I'd make: Photon is a Databricks-proprietary C++
          vectorized engine, not part of Apache Spark, so on EMR the equivalent levers are the EMR Spark
          runtime, AQE, and the S3-optimized committers."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ───────────────────────────────────── */
const DECK = [
  { q: "Why is DataFrame the default over RDD?", a: "A DataFrame has a named, typed schema, so Catalyst can see the query and optimize it (pushdown, pruning, codegen). An RDD lambda is opaque, so Spark runs it as-is. DataFrame is faster despite being 'higher level'.", tag: "abstractions" },
  { q: "Transformation vs action?", a: "Transformations (map, filter, join) are lazy, they just build the logical plan. Actions (count, collect, save, show) trigger execution of the whole plan.", tag: "lazy eval" },
  { q: "Narrow vs wide transformation?", a: "Narrow: each output partition depends on one input partition, no data movement, fused into a stage (map, filter). Wide: data is redistributed by key, that's a shuffle and a stage boundary (groupBy, join).", tag: "narrow / wide" },
  { q: "What creates a stage boundary?", a: "A shuffle, i.e. a wide transformation. Count the wide ops and you've counted the boundaries: N shuffles means N+1 stages.", tag: "stages" },
  { q: "How many tasks does one core run at once?", a: "Exactly one, on exactly one partition. So real parallelism is the total number of cores across all executors, and you want at least that many partitions.", tag: "execution" },
  { q: "Default spark.sql.shuffle.partitions, and why it's often wrong?", a: "200, fixed regardless of data size or cluster. On small data it makes 200 tiny tasks; on huge data, 200 giant tasks that spill. Tune it or let AQE coalesce.", tag: "partitions" },
  { q: "coalesce vs repartition?", a: "coalesce narrow-merges partitions to DECREASE count with no shuffle (can be uneven). repartition does a full shuffle to increase count or evenly rebalance skew.", tag: "partitions" },
  { q: "groupByKey vs reduceByKey?", a: "reduceByKey combines map-side and ships only partial results per key. groupByKey ships every raw record over the network and can OOM a reducer on a hot key. Prefer reduceByKey.", tag: "shuffle" },
  { q: "When does Spark pick a broadcast join, and the default threshold?", a: "When one side's estimated size is at or below spark.sql.autoBroadcastJoinThreshold, default 10 MB. It ships the small table to every executor and never shuffles the big one.", tag: "joins" },
  { q: "What's the hard limit on a broadcast?", a: "Roughly 8 GB. The broadcast side is collected to the driver and shipped as blocks, so beyond ~8 GB it fails outright, no matter how much driver memory you have.", tag: "joins" },
  { q: "How do you spot skew in the Spark UI?", a: "In the stage's summary metrics, the MAX task duration is far above the MEDIAN, and the slow task shows large shuffle-read and spill. One giant task next to many small ones.", tag: "skew" },
  { q: "What is salting?", a: "Append a random 0..N-1 suffix to a hot key so its rows hash into N partitions instead of one, then aggregate in two passes. It flattens the straggler task.", tag: "skew" },
  { q: "cache vs checkpoint in one line?", a: "cache/persist stores the result but keeps the lineage (recomputed if lost). checkpoint writes to reliable storage and truncates the lineage, used to cut a runaway lineage in iterative jobs.", tag: "caching" },
  { q: "AQE's three powers?", a: "Coalesce shuffle partitions using real post-shuffle sizes, switch a sort-merge join to broadcast when a side turns out small, and split a skewed partition into sub-tasks.", tag: "AQE" },
  { q: "What is predicate pushdown?", a: "Catalyst pushes filters down to the data source so fewer rows/files are read. On columnar formats like Parquet, combined with column pruning, it can cut I/O dramatically.", tag: "Catalyst" },
  { q: "Exit 137 means what, and the classic fix?", a: "The container was killed for exceeding PHYSICAL memory (a SIGKILL), not a heap OOM. The fix is raising spark.executor.memoryOverhead (off-heap: Python workers, netty), NOT the heap.", tag: "memory / OOM" },
  { q: "Most common driver OOM cause?", a: "collect() or toPandas() pulling a big result back to the single driver JVM, or an oversized broadcast materialized on the driver. Fix: don't pull data to the driver; write it instead.", tag: "memory / OOM" },
  { q: "First place to look when a Spark job is slow?", a: "The Jobs page to find the stage that owns the runtime, then that stage's summary metrics: max vs median task time, shuffle read/write, spill, and GC.", tag: "Spark UI" },
  { q: "What's wrong with coalesce(1) before a write?", a: "It collapses all data into one partition, so a single task on a single core writes everything, no parallelism, hours of runtime, often an OOM. Use repartition(n) or maxRecordsPerFile instead.", tag: "write path" },
  { q: "Why can an accumulator over-count?", a: "In a transformation, a retried or speculative task re-runs and re-applies its updates, so it double-counts. Accumulators are only exactly-once when updated inside an action.", tag: "traps" },
  { q: "Define a watermark.", a: "Max event time seen so far minus an allowed-lateness delay. It advances each micro-batch, evicts window/aggregation state older than it (bounding memory), and drops rows that arrive behind it.", tag: "streaming" },
  { q: "What behavioral change did Spark 4.0 make by default?", a: "ANSI SQL mode is on by default, so bad casts, integer overflow, and divide-by-zero now raise errors instead of silently returning null. Flag it as a migration risk.", tag: "Spark 4" },
];

function QuickFireTopic() {
  return (
    <>
      <Lede>
        Everything in this tool, distilled to one-breath answers. Read each question, say your answer OUT
        LOUD before revealing, then grade yourself honestly, the speaking rep is the point. Twenty-two cards
        span all fifteen topics; shuffle and re-run until every one is automatic.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  abstractions: <Abstractions />,
  lazy: <Lazy />,
  execution: <Execution />,
  partitions: <Partitions />,
  shuffle: <Shuffle />,
  joins: <Joins />,
  skew: <Skew />,
  caching: <Caching />,
  catalyst: <Catalyst />,
  memory: <Memory />,
  sparkui: <SparkUI />,
  writepath: <WritePath />,
  traps: <Traps />,
  streamstate: <StreamState />,
  spark4: <Spark4 />,
  quickfire: <QuickFireTopic />,
};

export default function SparkLab() {
  const [active, setActive] = useState("abstractions");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Engine internals · the WHAT"
      title="Spark · LAB"
      subtitle="How Spark actually runs your job, the execution model, partitions, shuffles, joins, and the tuning levers that decide whether a stage takes minutes or hours."
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
