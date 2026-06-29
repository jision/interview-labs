import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import PartitionShuffleViz from "./spark/PartitionShuffleViz.jsx";
import JoinStrategyViz from "./spark/JoinStrategyViz.jsx";
import SkewSaltingViz from "./spark/SkewSaltingViz.jsx";

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
