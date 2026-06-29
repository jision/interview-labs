import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import WindowFunctionViz from "./datafound/WindowFunctionViz.jsx";
import CapPartitionViz from "./datafound/CapPartitionViz.jsx";

const ACCENT = "#b388ff";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "sqljoins", label: "Joins, grouping & query plans", group: "SQL" },
  { id: "windows", label: "Window functions", group: "SQL" },
  { id: "sqlperf", label: "Indexes, partitions & tuning", group: "SQL" },
  { id: "cap", label: "CAP, consistency & replication", group: "Distributed systems" },
  { id: "partitioning", label: "Partitioning, sharding & hashing", group: "Distributed systems" },
  { id: "mapreduce", label: "MapReduce & why Spark", group: "Distributed systems" },
  { id: "columnar", label: "Columnar storage & encoding", group: "Storage internals" },
  { id: "compression", label: "Compression & file sizing", group: "Storage internals" },
];

/* ── Joins, grouping & query plans ────────────────────────────── */
function SqlJoins() {
  return (
    <>
      <Lede>
        SQL is still the lingua franca of data, and the screen checks whether you can reason about it{" "}
        <em>precisely</em>: which rows a join keeps, why WHERE and HAVING are not interchangeable, the order
        the engine actually evaluates your clauses in, and what an EXPLAIN plan is telling you. Get the join
        fan-out trap right and you sound senior immediately.
      </Lede>

      <Block eyebrow="combining tables" title="The five joins and what rows each keeps">
        <p className="text-ink-dim leading-relaxed mb-2">
          A join matches rows from two tables on a <strong>join key</strong> (the condition in{" "}
          <code className="font-mono">ON</code>). The join <em>type</em> decides what happens to rows that
          have no match on the other side:
        </p>
        <OpTable
          cols={["Join", "Keeps", "", "What it does"]}
          rows={[
            { op: "INNER JOIN", avg: "matches only", avgTone: "good", why: "Only rows with a key on BOTH sides. Unmatched rows from either table are dropped." },
            { op: "LEFT JOIN", avg: "all left + matches", avgTone: "ok", why: "Every left row; right columns are NULL where there is no match. The everyday default for 'keep all customers, attach orders if any'." },
            { op: "RIGHT JOIN", avg: "all right + matches", avgTone: "ok", why: "Mirror of LEFT, every right row, NULLs on the left. Most people just rewrite it as a LEFT." },
            { op: "FULL OUTER JOIN", avg: "all rows, both sides", avgTone: "ok", why: "Every row from both tables; NULLs wherever a side has no match. Used to find rows present in one table but not the other." },
            { op: "CROSS JOIN", avg: "every pair", avgTone: "bad", why: "Cartesian product, every left row paired with every right row (N x M). Rarely intentional; usually an accidental missing ON." },
          ]}
        />
        <CodeBlock
          title="text"
          lang="text"
          code={`customers           orders                INNER          LEFT
+----+------+        +-----+--------+       keeps c1,c2   keeps c1,c2,c3
| id | name |        | cid | amount |       (c3 has no    (c3 -> amount
| c1 | A    |        | c1  |   10   |        order, so      is NULL)
| c2 | B    |        | c2  |   20   |        it drops)
| c3 | C    |        +-----+--------+`}
        />
        <Callout kind="note" title="The join key is everything">
          Join on a key that is unique on at least one side and you get clean, predictable matching. Join on
          a non-unique column on both sides and you get a fan-out (see the trap below), which is the single
          most common cause of "my numbers doubled."
        </Callout>
      </Block>

      <Block eyebrow="collapsing rows" title="GROUP BY, aggregates, and WHERE vs HAVING">
        <p className="text-ink-dim leading-relaxed mb-2">
          <code className="font-mono">GROUP BY</code> collapses many rows into one row per group, and the{" "}
          <strong>aggregates</strong> (<code className="font-mono">COUNT, SUM, AVG, MIN, MAX</code>) summarize
          each group. The classic confusion is <code className="font-mono">WHERE</code> versus{" "}
          <code className="font-mono">HAVING</code>:
        </p>
        <OpTable
          cols={["Filter", "Runs", "", "Can reference"]}
          rows={[
            { op: "WHERE", avg: "before grouping", avgTone: "good", why: "Filters individual rows on raw columns. Cannot use an aggregate, the groups do not exist yet." },
            { op: "HAVING", avg: "after grouping", avgTone: "ok", why: "Filters whole groups, AFTER aggregation. This is where conditions like COUNT(*) > 5 or SUM(amount) > 1000 go." },
          ]}
        />
        <CodeBlock
          title="sql"
          lang="text"
          code={`SELECT   region, SUM(amount) AS total
FROM     orders
WHERE    status = 'paid'      -- per-row filter, BEFORE grouping
GROUP BY region
HAVING   SUM(amount) > 1000   -- per-group filter, AFTER aggregation
ORDER BY total DESC;`}
        />
        <Callout kind="trap" title="WHERE filters rows; HAVING filters groups">
          Putting an aggregate in WHERE is an error (the aggregate is not computed yet), and putting a plain
          row filter in HAVING still works but scans more rows than it should, filter early with WHERE so
          fewer rows ever reach the GROUP BY.
        </Callout>
      </Block>

      <Block eyebrow="the order that actually runs" title="Logical order of evaluation">
        <p className="text-ink-dim leading-relaxed mb-2">
          You <em>write</em> SELECT first, but the engine <em>evaluates</em> it almost last. Knowing the real
          order explains why you cannot use a SELECT alias in WHERE, and why HAVING sees aggregates that WHERE
          cannot:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`written order:   SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... ORDER BY ... LIMIT

LOGICAL order the engine runs:

  1. FROM / JOIN   -> build the row set from the tables
  2. WHERE         -> filter individual rows
  3. GROUP BY      -> collapse rows into groups
  4. HAVING        -> filter the groups
  5. SELECT        -> compute expressions / aliases  (aliases born HERE)
  6. ORDER BY      -> sort the result
  7. LIMIT         -> take the top N`}
        />
        <Callout kind="note" title="Why aliases fail in WHERE but work in ORDER BY">
          A column alias is created in step 5 (SELECT). WHERE runs in step 2, before the alias exists, so it
          cannot see it. ORDER BY runs in step 6, after SELECT, so it can. This single ordering answers a
          surprising number of "why does this query error?" questions.
        </Callout>
      </Block>

      <Block eyebrow="reading the plan" title="EXPLAIN: scans, join algorithms, the optimizer">
        <p className="text-ink-dim leading-relaxed mb-2">
          You write <em>what</em> you want; the <strong>query optimizer</strong> decides <em>how</em> to get
          it, which indexes to use, the order to join tables, and which join algorithm to run.{" "}
          <code className="font-mono">EXPLAIN</code> shows that plan; <code className="font-mono">EXPLAIN
          ANALYZE</code> actually runs it and reports real timings and row counts.
        </p>
        <OpTable
          cols={["You will see", "Means", "", "Note"]}
          rows={[
            { op: "Seq / table scan", avg: "read every row", avgTone: "bad", why: "No usable index, the engine reads the whole table. Fine for analytics, a red flag for an OLTP point lookup." },
            { op: "Index scan / seek", avg: "jump via index", avgTone: "good", why: "Uses a B-tree to go straight to the rows, the fast path for selective filters and lookups." },
            { op: "Hash join", avg: "build hash, then probe", avgTone: "ok", why: "Builds a hash table on the smaller side, probes with the larger. The workhorse for big equi-joins with no sort order." },
            { op: "Merge join", avg: "both sides sorted", avgTone: "ok", why: "Walks two already-sorted inputs in lockstep. Great when data is sorted on the join key (or pre-sorted by an index)." },
            { op: "Nested loop", avg: "for each row, look up", avgTone: "ok", why: "For each row on one side, probe the other. Cheap on tiny inputs or a great index; catastrophic on two big unindexed tables." },
          ]}
        />
        <Callout kind="tip" title="The optimizer runs on statistics">
          The plan it picks depends on table statistics (row counts, value distributions). Stale stats lead to
          bad plans, the optimizer thinks a table is tiny and picks a nested loop over millions of rows. "Run
          ANALYZE to refresh stats" is a real answer to "the query suddenly got slow."
        </Callout>
      </Block>

      <Block eyebrow="the classic gotcha" title="Join fan-out: how one-to-many doubles your numbers">
        <p className="text-ink-dim leading-relaxed mb-2">
          When you join on a key that is <strong>not unique on the right side</strong>, each left row matches
          multiple right rows, so the left row is <em>duplicated</em> once per match. If you then SUM a
          left-side column, every duplicate is counted again and your total inflates:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`one order, three line items:

  orders                 order_items
  +----+--------+        +-----+------+
  | o1 | $100   |        | o1  | shoe |   <- joining orders to items
  +----+--------+        | o1  | sock |      duplicates the $100 order
                         | o1  | hat  |      THREE times

  SELECT SUM(o.amount)   -- WRONG: returns $300, not $100
  FROM orders o JOIN order_items i ON i.order_id = o.id;`}
        />
        <Callout kind="trap" title="Aggregate the many-side before you join">
          The fix: pre-aggregate the many-side to one row per key (a subquery / CTE that does{" "}
          <code className="font-mono">GROUP BY order_id</code>) and join that, or use{" "}
          <code className="font-mono">COUNT(DISTINCT ...)</code> / <code className="font-mono">SUM(DISTINCT ...)</code>{" "}
          carefully. The tell of a junior answer is a SUM that quietly multiplies because of a one-to-many join.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "A join matches rows on a key, and the type decides what to do with unmatched rows: INNER keeps only
          matches, LEFT keeps all left rows with NULLs on the right, FULL keeps everything, CROSS is the
          Cartesian product. GROUP BY collapses rows into aggregates, and the key distinction is WHERE filters
          individual rows before grouping while HAVING filters groups after. The engine evaluates FROM, WHERE,
          GROUP BY, HAVING, SELECT, ORDER BY, LIMIT in that logical order, which is why a SELECT alias works in
          ORDER BY but not WHERE. I read EXPLAIN to see scans versus index seeks and the join algorithm, hash,
          merge, or nested loop, and I always watch for join fan-out on one-to-many keys, which silently
          doubles aggregates."
        </Callout>
      </Block>
    </>
  );
}

/* ── Window functions ─────────────────────────────────────────── */
function Windows() {
  return (
    <>
      <Lede>
        Window functions are the single highest-leverage SQL topic in a data interview. They compute over a{" "}
        <em>window</em> of related rows <strong>without collapsing them</strong>, the way GROUP BY does, so you
        can put a running total, a rank, or "yesterday's value" right next to every row. Master ROW_NUMBER,
        RANK, SUM OVER, and LAG and you can answer most analytical SQL questions on the spot.
      </Lede>

      <Block eyebrow="the core idea" title="OVER (): a window, not a collapse">
        <p className="text-ink-dim leading-relaxed mb-2">
          GROUP BY turns many rows into one row per group. A window function keeps <em>every</em> row and just
          adds a computed column alongside it. The magic is the <code className="font-mono">OVER</code> clause,
          which defines the window each row gets to see:
        </p>
        <CodeBlock
          title="sql"
          lang="text"
          code={`func() OVER (
   PARTITION BY region    -- split rows into groups (the computation RESETS per group)
   ORDER BY month         -- order rows inside each partition
   ROWS BETWEEN ...       -- optional frame: which rows count for THIS row
)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          <strong>PARTITION BY</strong> is "GROUP BY for the window", it slices rows into independent groups,
          and the function restarts at each partition boundary. <strong>ORDER BY</strong> sequences rows inside
          the partition (essential for ranks, running totals, and offsets). Leave out PARTITION BY and the whole
          result is one window.
        </p>
        <Callout kind="note" title="GROUP BY collapses, OVER does not">
          The mental model: GROUP BY answers "one number per group", window functions answer "a number per row,
          computed relative to its neighbors." If you need to keep the detail rows, you want a window function.
        </Callout>
      </Block>

      <Try label="window functions live"><WindowFunctionViz /></Try>

      <Block eyebrow="ranking" title="ROW_NUMBER vs RANK vs DENSE_RANK">
        <p className="text-ink-dim leading-relaxed mb-2">
          All three number rows within a partition in ORDER BY order; they differ only in how they handle{" "}
          <strong>ties</strong>:
        </p>
        <OpTable
          cols={["Function", "On a tie", "", "Sequence for values 10,10,9"]}
          rows={[
            { op: "ROW_NUMBER()", avg: "always unique", avgTone: "good", why: "1, 2, 3, ties are broken arbitrarily. The go-to for dedup: keep WHERE rn = 1." },
            { op: "RANK()", avg: "ties share, then skip", avgTone: "ok", why: "1, 1, 3, tied rows share a rank and the next rank jumps. Standard competition ranking." },
            { op: "DENSE_RANK()", avg: "ties share, no skip", avgTone: "ok", why: "1, 1, 2, tied rows share a rank but the next rank does NOT skip. Use for 'distinct rank levels'." },
          ]}
        />
        <Callout kind="tip" title="ROW_NUMBER is the dedup workhorse">
          To keep the latest row per key: number rows with{" "}
          <code className="font-mono">ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC)</code> and
          filter <code className="font-mono">WHERE rn = 1</code>. This "deduplicate by ranking" pattern shows up
          constantly in data pipelines.
        </Callout>
      </Block>

      <Block eyebrow="running aggregates" title="SUM / AVG OVER and frames (ROWS BETWEEN)">
        <p className="text-ink-dim leading-relaxed mb-2">
          Put an aggregate in an OVER clause with ORDER BY and you get a <strong>running</strong> aggregate, a
          cumulative total that grows row by row. The <strong>frame</strong> (<code className="font-mono">ROWS
          BETWEEN ...</code>) controls exactly which rows feed each calculation:
        </p>
        <CodeBlock
          title="sql"
          lang="text"
          code={`-- running total: everything from the start of the partition up to this row
SUM(sales) OVER (PARTITION BY region ORDER BY month
                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)

-- 3-row moving average: this row plus the two before it
AVG(sales) OVER (PARTITION BY region ORDER BY month
                 ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)`}
        />
        <Callout kind="trap" title="ORDER BY changes what an aggregate OVER means">
          With ORDER BY, the default frame is "start of partition to current row", a <em>running</em> total.
          Without ORDER BY, the aggregate applies to the <em>entire</em> partition (same value on every row).
          People accidentally get a running total when they wanted a partition-wide total, or vice versa.
        </Callout>
      </Block>

      <Block eyebrow="looking sideways" title="LAG / LEAD: period-over-period">
        <p className="text-ink-dim leading-relaxed mb-2">
          <code className="font-mono">LAG</code> pulls a value from a previous row into the current one;{" "}
          <code className="font-mono">LEAD</code> pulls from a following row. This is how you compute deltas,
          month-over-month growth, or "time since last event", all without a self-join:
        </p>
        <CodeBlock
          title="sql"
          lang="text"
          code={`SELECT month, sales,
       LAG(sales, 1) OVER (PARTITION BY region ORDER BY month) AS prev,
       sales - LAG(sales, 1) OVER (PARTITION BY region ORDER BY month) AS mom_change
FROM   monthly_sales;`}
        />
        <Callout kind="note" title="Classic uses, all one window away">
          Running totals (SUM OVER), dedup (ROW_NUMBER), top-N per group (rank then filter rn &lt;= N),
          period-over-period (LAG/LEAD), and moving averages (framed AVG). Recognizing which window function a
          question wants is most of the battle.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Window functions compute over a set of related rows without collapsing them, that is the difference
          from GROUP BY. The OVER clause defines the window: PARTITION BY slices rows into groups and resets the
          computation per group, ORDER BY sequences them, and a frame like ROWS BETWEEN picks exactly which rows
          count. ROW_NUMBER gives a unique sequence and is my dedup tool, RANK shares ties then skips,
          DENSE_RANK shares without skipping. SUM or AVG OVER with ORDER BY gives running totals and moving
          averages, and LAG/LEAD pull neighboring rows for period-over-period deltas. Top-N per group is just
          rank-then-filter."
        </Callout>
      </Block>
    </>
  );
}

/* ── Indexes, partitions & tuning ─────────────────────────────── */
function SqlPerf() {
  return (
    <>
      <Lede>
        Performance is where OLTP and OLAP split. Row stores speed point lookups with B-tree{" "}
        <em>indexes</em>; columnar analytic engines (Redshift, Parquet on Athena/Spark) deliberately do{" "}
        <strong>not</strong> use row indexes, they win by scanning fewer bytes through partition pruning, sort
        keys, and zone maps. Knowing which world you are tuning is the senior signal.
      </Lede>

      <Block eyebrow="the OLTP fast path" title="B-tree indexes: speed reads, tax writes">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>B-tree index</strong> is a sorted, balanced tree that lets the engine jump to a row (or a
          range of rows) in <code className="font-mono">O(log n)</code> instead of scanning the whole table. It
          is the backbone of fast equality and range lookups in a row-oriented OLTP database:
        </p>
        <OpTable
          cols={["Index helps", "Cost", "", "Why"]}
          rows={[
            { op: "Equality / range lookups", avg: "fast seeks", avgTone: "good", why: "WHERE id = 42 or created_at BETWEEN ... jumps straight to rows instead of a full scan." },
            { op: "ORDER BY / joins on the key", avg: "pre-sorted", avgTone: "good", why: "The index is already sorted, so the engine can skip a sort step or do a merge join." },
            { op: "Writes (INSERT/UPDATE/DELETE)", avg: "slower", avgTone: "bad", why: "Every index must also be updated on write. More indexes -> faster reads but slower writes and more storage." },
          ]}
        />
        <Callout kind="trap" title="Indexes are not free, and not always used">
          An index costs write throughput and storage, so you do not index everything. And a low-selectivity
          filter (a column that is mostly one value, or a function wrapped around the column like{" "}
          <code className="font-mono">WHERE UPPER(name) = ...</code>) makes the optimizer skip the index and scan
          anyway. Index the columns you actually filter and join on, and keep them sargable.
        </Callout>
      </Block>

      <Block eyebrow="the OLAP fast path" title="Why columnar engines skip row indexes">
        <p className="text-ink-dim leading-relaxed mb-2">
          Analytic queries scan huge fractions of a table to aggregate, so a per-row B-tree would be useless
          (you are not doing point lookups). Columnar engines win differently, they read fewer <em>bytes</em>:
        </p>
        <OpTable
          cols={["Mechanism", "What it does", "", "Replaces"]}
          rows={[
            { op: "Sort / distribution keys", avg: "physically order data", avgTone: "good", why: "Redshift sort keys cluster related rows so the engine can skip whole blocks, the columnar analog of an index." },
            { op: "Zone maps / min-max stats", avg: "per-block min/max", avgTone: "good", why: "Each block records its min/max; a filter outside that range skips the whole block without reading it." },
            { op: "Partition pruning", avg: "skip whole folders", avgTone: "good", why: "Data laid out by date=.../region=...; a WHERE on the partition column reads only the matching partitions." },
            { op: "Predicate pushdown", avg: "filter at the scan", avgTone: "good", why: "Push the WHERE into the file reader (Parquet/ORC) so rows are filtered before they are ever materialized." },
          ]}
        />
        <Callout kind="note" title="Skip bytes, do not seek rows">
          The whole OLAP tuning game is reading less: prune partitions, use zone maps to skip blocks, push
          predicates into the file format, and select only the columns you need. There is no row index because
          the access pattern is "scan a lot, but scan as little as possible."
        </Callout>
      </Block>

      <Block eyebrow="universal wins" title="SELECT only what you need, and help the optimizer">
        <p className="text-ink-dim leading-relaxed mb-2">
          A few habits pay off in both worlds:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Avoid SELECT *</strong>, in columnar storage, naming columns means the engine reads only those column chunks, often a massive I/O cut. In row storage it cuts network and memory.</li>
          <li><strong>Filter early and on partition/sort keys</strong>, the more you prune at the scan, the less every later step has to do.</li>
          <li><strong>Join order and join keys</strong>, the optimizer usually picks order, but join on indexed/sorted keys and filter before joining so fewer rows flow through.</li>
          <li><strong>Keep statistics fresh</strong>, run ANALYZE / collect stats so the optimizer estimates row counts correctly and picks good plans.</li>
        </ul>
        <Callout kind="tip" title="EXPLAIN / ANALYZE is your tuning loop">
          Read <code className="font-mono">EXPLAIN</code> for the plan and{" "}
          <code className="font-mono">EXPLAIN ANALYZE</code> for real timings. The tells: an unexpected full
          scan on a selective filter (missing or unusable index), a nested loop over big inputs (bad join
          choice), or estimated rows wildly off from actual (stale stats).
        </Callout>
      </Block>

      <Block eyebrow="two different worlds" title="OLTP vs OLAP tuning, side by side">
        <CodeBlock
          title="text"
          lang="text"
          code={`OLTP  (Postgres, MySQL)            OLAP  (Redshift, Athena/Spark on Parquet)
  many small point reads/writes      few huge scan + aggregate queries
  row-oriented storage               column-oriented storage
  B-tree indexes -> O(log n) seeks   sort keys + zone maps + partition pruning
  normalize to avoid update anomaly  denormalize / star schema to avoid joins
  tune: the right indexes            tune: read fewer bytes (prune, project, push down)`}
        />
        <Callout kind="trap" title="Do not bring OLTP instincts to OLAP">
          "Add an index" is the wrong reflex on Redshift or a Parquet lake, the lever is the partition/sort
          layout and reading fewer columns and blocks. Mixing up the two tuning models is a common
          mid-level mistake.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Tuning depends on whether I am in OLTP or OLAP. In a row store I use B-tree indexes for fast
          equality and range lookups, accepting that every index taxes writes and storage, and I keep filters
          sargable so the index is actually used. Analytic columnar engines deliberately do not use row indexes,
          they win by reading fewer bytes: partition pruning to skip whole folders, sort keys and zone maps to
          skip blocks, and predicate pushdown plus column projection so I never SELECT *. Across both I filter
          early, join on good keys, keep statistics fresh, and read EXPLAIN ANALYZE to catch unexpected scans,
          bad join types, or stale-stats estimates."
        </Callout>
      </Block>
    </>
  );
}

/* ── CAP, consistency & replication ───────────────────────────── */
function Cap() {
  return (
    <>
      <Lede>
        The moment you replicate data across machines, you inherit a hard trade-off. CAP says that during a
        network <strong>partition</strong> you must choose between <strong>consistency</strong> and{" "}
        <strong>availability</strong>, you cannot keep both. This is the conceptual core under every
        distributed store, and interviewers want to hear it stated correctly, not as the lazy "pick two."
      </Lede>

      <Block eyebrow="the theorem, stated correctly" title="CAP: under a partition, pick C or A">
        <p className="text-ink-dim leading-relaxed mb-2">
          The three letters: <strong>Consistency</strong> (every read sees the latest write),{" "}
          <strong>Availability</strong> (every request gets a non-error response), and{" "}
          <strong>Partition tolerance</strong> (the system keeps working when the network drops messages
          between nodes). The subtle part:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`In a distributed system, partitions WILL happen, so P is not optional.
That leaves a real choice only between C and A, and only DURING a partition:

   network is healthy   ->  you can have both C and A
   network PARTITIONS   ->  you must sacrifice one:

       CP : reject/block requests to stay consistent  (lose Availability)
       AP : answer anyway, allow divergence           (lose Consistency)

   "CA" is not a real option: it means "assume partitions never happen."`}
        />
        <Callout kind="trap" title="CAP is not 'pick two of three'">
          The popular "pick two" framing is wrong. P is forced in any real distributed system, so you are only
          ever choosing between C and A, and only while a partition is active. The rest of the time you can have
          both. Saying it this way is the difference between sounding senior and reciting a meme.
        </Callout>
      </Block>

      <Try label="CAP under a partition"><CapPartitionViz /></Try>

      <Block eyebrow="the two camps" title="CP vs AP systems">
        <OpTable
          cols={["Choice", "During a partition", "", "Examples"]}
          rows={[
            { op: "CP (consistency)", avg: "reject to stay correct", avgTone: "ok", why: "Refuse or block writes (and sometimes reads) on the side that cannot confirm it is current. Correct, but unavailable. HBase, ZooKeeper, etcd, a single-leader RDBMS with sync replication." },
            { op: "AP (availability)", avg: "stay up, diverge", avgTone: "ok", why: "Accept reads and writes on both sides; replicas diverge and reconcile later. Always up, possibly stale. Dynamo, Cassandra, Riak." },
          ]}
        />
        <Callout kind="note" title="It is per-operation, often tunable">
          Real systems are not purely one or the other. Cassandra and DynamoDB let you choose consistency per
          request (a quorum read for correctness, a fast local read for availability), so the CAP stance can be
          dialed per query rather than fixed for the whole database.
        </Callout>
      </Block>

      <Block eyebrow="the missing letter" title="PACELC: latency even when there is no partition">
        <p className="text-ink-dim leading-relaxed mb-2">
          CAP only describes the partition case. <strong>PACELC</strong> extends it: <em>if Partition (P)
          choose A or C; Else (E) choose Latency (L) or Consistency (C)</em>. Even on a healthy network, keeping
          replicas strongly consistent costs round-trips, so you trade latency against consistency all the time,
          not just during failures.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`PACELC:

   if (Partition)  ->  choose  A  or  C      (the CAP case)
   else            ->  choose  L  or  C      (the everyday case)

   Dynamo/Cassandra : PA / EL   (available + low latency, eventual consistency)
   strict RDBMS     : PC / EC   (consistent always, pay the latency)`}
        />
        <Callout kind="tip" title="PACELC is the more honest model">
          It captures the trade you actually live with daily: strong consistency means coordinating replicas on
          every write, which adds latency. Eventual consistency answers from the nearest replica fast and
          reconciles in the background. PACELC names that else-branch CAP forgets.
        </Callout>
      </Block>

      <Block eyebrow="how replicas agree" title="Replication and quorums (R + W > N)">
        <p className="text-ink-dim leading-relaxed mb-2">
          Data is replicated for durability and availability, and the <em>scheme</em> sets the consistency you
          get:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Leader / follower (primary-replica)</strong>, writes go to one leader and replicate out. Synchronous replication is consistent but slower; asynchronous is fast but a follower can serve stale reads.</li>
          <li><strong>Quorum (Dynamo-style)</strong>, with N replicas, require W to confirm a write and R to confirm a read. If <code className="font-mono">R + W &gt; N</code>, any read set overlaps any write set, so a read is guaranteed to see the latest write, strong consistency without a single leader.</li>
        </ul>
        <CodeBlock
          title="text"
          lang="text"
          code={`N = 3 replicas

  W=1, R=1  ->  R+W = 2  (< N)  fast, but reads can be STALE   (eventual)
  W=2, R=2  ->  R+W = 4  (> N)  read+write sets overlap        (strong)
  W=3, R=1  ->  fast reads, slow durable writes (every replica must ack)`}
        />
        <Callout kind="note" title="The read/write tuning knob">
          Tuning R and W trades read latency, write latency, and consistency. High W means durable but slow
          writes; high R means consistent but slower reads. <code className="font-mono">R + W &gt; N</code> buys
          strong consistency at the cost of latency, which is PACELC again, in concrete numbers.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "CAP is not pick-two-of-three. In any real distributed system partitions happen, so P is forced, and
          the real choice is only between consistency and availability, and only during a partition. A CP system
          rejects or blocks requests to stay correct, like HBase or ZooKeeper; an AP system stays up and lets
          replicas diverge, then reconciles, like Dynamo or Cassandra. PACELC adds the honest part CAP omits:
          even with no partition, you trade latency for consistency, because strong consistency costs
          coordination. Concretely that is the quorum knob, with N replicas, R + W &gt; N guarantees a read sees
          the latest write, and you tune R and W to trade latency against consistency."
        </Callout>
      </Block>
    </>
  );
}

/* ── Partitioning, sharding & hashing ─────────────────────────── */
function Partitioning() {
  return (
    <>
      <Lede>
        One machine eventually runs out of room or throughput, so you split data across many,{" "}
        <strong>horizontal partitioning</strong>, also called <strong>sharding</strong>. The whole game is
        choosing a partition <em>key</em> and a partitioning <em>scheme</em> that spread load evenly while
        keeping your common queries cheap. The same idea drives Spark partitions and Kafka/Kinesis shard keys.
      </Lede>

      <Block eyebrow="splitting to scale out" title="Horizontal partitioning (sharding)">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Horizontal partitioning</strong> splits rows across nodes (each shard holds a subset of rows,
          same schema), so you scale storage and throughput linearly with machines. Contrast{" "}
          <strong>vertical partitioning</strong>, which splits columns. The partition <strong>key</strong>
          decides which shard a row lands on, and that choice makes or breaks the design:
        </p>
        <OpTable
          cols={["Scheme", "Spread", "", "Range queries"]}
          rows={[
            { op: "Hash partitioning", avg: "even", avgTone: "good", why: "Shard = hash(key) mod N. Distributes load uniformly and avoids hotspots, but a range scan must hit EVERY shard (data for nearby keys is scattered)." },
            { op: "Range partitioning", avg: "uneven risk", avgTone: "ok", why: "Contiguous key ranges per shard (A-M, N-Z, or by date). Range queries hit one shard, but a hot range (today's date) creates a hotspot." },
            { op: "Round-robin / random", avg: "even", avgTone: "ok", why: "Spray rows across shards regardless of key. Perfectly balanced, but you lose all locality, every query is a scatter-gather." },
          ]}
        />
        <Callout kind="note" title="Hash for spread, range for locality">
          The core tension: hashing gives you even load but kills range locality; range gives you locality but
          risks hotspots on popular ranges. The right answer depends on whether your workload does point lookups
          (hash) or range scans (range), there is no universally correct choice.
        </Callout>
      </Block>

      <Block eyebrow="the hard part" title="Skew and hotspots: the key choice that hurts">
        <p className="text-ink-dim leading-relaxed mb-2">
          A bad partition key concentrates load on one shard, <strong>skew</strong> in storage,{" "}
          <strong>hotspots</strong> in traffic. Classic offenders: partitioning by a low-cardinality column
          (only a few values), by a monotonically increasing key (all new writes hit the newest shard), or by a
          field where one value dominates (a "whale" customer):
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`shard load with a SKEWED key (partition by country, US dominates):

   shard A (US)  ############################  90%   <- hotspot, this node melts
   shard B (EU)  #####                          7%
   shard C (APAC) ##                             3%

fix: pick a higher-cardinality / more uniform key, or add a salt/suffix
     so a hot value spreads across multiple shards.`}
        />
        <Callout kind="trap" title="Monotonic keys create a moving hotspot">
          Sharding by timestamp or auto-increment id means every new write targets the same newest shard while
          the rest sit idle. Hash the key, or prefix it with a salt, so writes spread. This is the same reason
          DynamoDB punishes hot partition keys and Kafka can get a lagging hot partition.
        </Callout>
      </Block>

      <Block eyebrow="adding and removing nodes" title="Consistent hashing: minimize reshuffling">
        <p className="text-ink-dim leading-relaxed mb-2">
          Plain <code className="font-mono">hash(key) mod N</code> has a fatal flaw: change N (add or lose a
          node) and almost <em>every</em> key remaps, a massive reshuffle. <strong>Consistent hashing</strong>
          fixes this by placing both keys and nodes on a hash <strong>ring</strong>; a key belongs to the next
          node clockwise. Add or remove a node and only the keys in that one arc move:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`the hash ring (keys + nodes hashed onto the same circle):

            [Node A]
          k1     \\        k2
         /         \\        \\
   [Node C]         \\     [Node B]
         \\           k3    /
          k4 ---------------

   each key -> the next node CLOCKWISE.
   add Node D -> only keys between D and the previous node move.
   (virtual nodes spread each physical node around the ring for balance.)`}
        />
        <Callout kind="tip" title="Why DBs and caches use the ring">
          Consistent hashing means scaling out (or losing a node) moves roughly 1/N of the keys instead of
          nearly all of them, no full reshuffle, far less data movement. It is why Cassandra, DynamoDB, and
          distributed caches like memcached/Redis clusters are built on a ring, often with virtual nodes for
          smoother balance.
        </Callout>
      </Block>

      <Block eyebrow="same idea, everywhere" title="It is the same key choice in Spark and Kafka">
        <p className="text-ink-dim leading-relaxed mb-2">
          Partitioning is not just a database concept, it is the unit of parallelism across the whole data
          stack, and the partition key choice has the same consequences:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Spark</strong>, an RDD/DataFrame is split into partitions processed in parallel; a skewed join/group key makes one task do all the work (the dreaded straggler), and a shuffle re-partitions data by key across the cluster.</li>
          <li><strong>Kafka / Kinesis</strong>, a topic/stream is split into partitions/shards; the message key picks the partition. A poor key (one value dominating) overloads a single partition and ruins ordering-per-key throughput.</li>
        </ul>
        <Callout kind="note" title="Skew is the universal enemy">
          Whether it is a database shard, a Spark task, or a Kafka partition, the failure mode is identical: an
          uneven key concentrates load on one unit while the rest idle. "Pick a high-cardinality, uniformly
          distributed key, and salt hot values" is the answer in all three.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Sharding is horizontal partitioning, splitting rows across nodes to scale out, and the whole design
          hinges on the partition key and scheme. Hash partitioning spreads load evenly but scatters ranges, so
          range scans hit every shard; range partitioning keeps locality but risks hotspots on popular ranges
          like today's date; round-robin is balanced but loses all locality. The danger is skew: a
          low-cardinality or monotonic key concentrates load on one shard, so I pick a high-cardinality uniform
          key and salt hot values. Consistent hashing puts keys and nodes on a ring so adding or removing a node
          moves only about 1/N of the keys instead of reshuffling everything. And it is the exact same key
          choice for Spark partitions and Kafka shard keys, skew is the universal enemy."
        </Callout>
      </Block>
    </>
  );
}

/* ── MapReduce & why Spark ────────────────────────────────────── */
function MapReduce() {
  return (
    <>
      <Lede>
        MapReduce is the mental ancestor of every modern big-data engine. Its model, <strong>map</strong>,
        then <strong>shuffle/sort</strong>, then <strong>reduce</strong>, is exactly how distributed
        aggregation works, and Spark stages are its direct descendants. Knowing why MapReduce was slow tells
        you precisely why Spark won, which is the question interviewers are really asking.
      </Lede>

      <Block eyebrow="the model" title="Map -> shuffle/sort -> reduce">
        <p className="text-ink-dim leading-relaxed mb-2">
          MapReduce expresses a computation as two functions the framework runs in parallel across a cluster,
          with a sort/shuffle in between that groups data by key:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`MAP        : each node turns its input split into (key, value) pairs, in parallel
SHUFFLE/SORT: the framework groups all values by key and routes them across nodes
REDUCE     : each node aggregates the values for its keys -> final output

  input -> [map] -> (k,v) pairs -> [shuffle: group by k] -> [reduce] -> output
            (parallel)              (network-heavy, sorted)   (parallel)`}
        />
        <Callout kind="note" title="Shuffle is the expensive middle">
          Map and reduce are embarrassingly parallel; the cost is the shuffle, sorting and moving data across
          the network so all values for a key land on one reducer. Every "why is my job slow / why does it spill
          to disk" question traces back to the shuffle.
        </Callout>
      </Block>

      <Block eyebrow="the canonical example" title="Word count, the 'hello world' of MapReduce">
        <CodeBlock
          title="text"
          lang="text"
          code={`input:  "the cat sat the mat"

MAP    -> (the,1) (cat,1) (sat,1) (the,1) (mat,1)

SHUFFLE/SORT (group by word):
        the -> [1,1]   cat -> [1]   sat -> [1]   mat -> [1]

REDUCE (sum each group):
        (the,2) (cat,1) (sat,1) (mat,1)`}
        />
        <Callout kind="tip" title="Data locality: move compute to data">
          MapReduce schedules each map task on the node that already holds that data block (on HDFS), so it
          processes data locally instead of pulling terabytes across the network. "Move the computation to the
          data, not the data to the computation" is the founding idea of big-data processing, and it still
          governs how Spark schedules tasks.
        </Callout>
      </Block>

      <Block eyebrow="the fatal cost" title="Why classic MapReduce is slow: disk between every stage">
        <p className="text-ink-dim leading-relaxed mb-2">
          Hadoop MapReduce writes the output of <em>every</em> stage to disk (HDFS) before the next stage reads
          it back. For a single map-reduce pass that is tolerable; for a multi-step or iterative job it is
          brutal, every iteration round-trips through disk:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`iterative job (e.g. ML training, graph algorithms) on MapReduce:

  read(disk) -> map/reduce -> WRITE(disk) -> read(disk) -> map/reduce -> WRITE(disk) -> ...
                              ^^^^^^^^^^^                    ^^^^^^^^^^^
                       full disk + network round-trip between EVERY step`}
        />
        <Callout kind="trap" title="The killer is materializing to disk each stage">
          Because intermediate results hit disk between stages, iterative and multi-pass workloads (most ML and
          graph work, interactive queries) pay a huge I/O tax. MapReduce was built for one-pass batch ETL, not
          for the iterate-and-explore workloads that came to dominate.
        </Callout>
      </Block>

      <Block eyebrow="why it won" title="Spark: in-memory DAG, lazy optimization">
        <p className="text-ink-dim leading-relaxed mb-2">
          Spark keeps the same map/shuffle/reduce skeleton but fixes the disk problem and the clumsy API:
        </p>
        <OpTable
          cols={["Spark advantage", "vs MapReduce", "", "Why it matters"]}
          rows={[
            { op: "In-memory between stages", avg: "no disk round-trip", avgTone: "good", why: "Keeps intermediate data in RAM across stages, so iterative jobs run far faster (often 10x+). Disk only on spill." },
            { op: "DAG of stages", avg: "not rigid 2-step", avgTone: "good", why: "A whole pipeline is one DAG of stages, not a chain of separate map-reduce jobs, fewer barriers, fewer materializations." },
            { op: "Lazy evaluation + optimizer", avg: "plan the whole job", avgTone: "good", why: "Transformations are lazy; Spark builds the DAG, then Catalyst optimizes the entire plan before running it." },
            { op: "Rich API + libraries", avg: "beyond raw map/reduce", avgTone: "good", why: "DataFrames/SQL, MLlib, streaming, and interactive use in one engine, not hand-written mappers and reducers." },
          ]}
        />
        <Callout kind="tip" title="The one-liner: in-memory across stages">
          MapReduce materializes every stage to disk; Spark keeps data in memory and chains stages into an
          optimized DAG, so multi-pass, iterative, and interactive jobs are dramatically faster. A Spark stage
          is essentially a map-or-reduce phase, the lineage is direct, Spark is MapReduce grown up.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "MapReduce models a job as map, then a shuffle that groups by key, then reduce, with word count as the
          canonical example, and it schedules map tasks where the data already lives, move compute to the data.
          Its weakness is that classic Hadoop MapReduce writes every stage's output to disk before the next
          stage, so iterative and multi-step jobs pay a huge I/O tax. Spark won because it keeps intermediate
          data in memory and chains stages into one lazily optimized DAG instead of separate disk-bound jobs, so
          it is far faster for multi-pass, iterative, and interactive work, and it adds DataFrames, SQL, and
          libraries on top. A Spark stage is basically a MapReduce phase, Spark is its in-memory successor."
        </Callout>
      </Block>
    </>
  );
}

/* ── Columnar storage & encoding ──────────────────────────────── */
function Columnar() {
  return (
    <>
      <Lede>
        The difference between a row store and a column store is the single biggest reason Athena, Redshift,
        and Spark are fast on analytics. Storing each column <em>contiguously</em> means you read only the
        columns you query, compress them brutally well, and skip whole chunks via statistics. Parquet and ORC
        are how this lands on disk, and it underpins every modern lakehouse query.
      </Lede>

      <Block eyebrow="the fundamental layout" title="Row-oriented vs column-oriented">
        <p className="text-ink-dim leading-relaxed mb-2">
          Same table, two physical layouts. Row stores keep each <em>record</em> together; column stores keep
          each <em>column</em> together:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`logical table:   id | name  | age | country

ROW-oriented (OLTP): records stored together
   [1,Ann,30,US][2,Bob,25,UK][3,Cy,41,US]...
   -> fetch/insert a whole row cheaply (point read/write)
   -> but "AVG(age)" must read every row to get one column

COLUMN-oriented (OLAP): each column stored together
   ids:      [1,2,3,...]
   names:    [Ann,Bob,Cy,...]
   ages:     [30,25,41,...]     <- AVG(age) reads ONLY this column
   countries:[US,UK,US,...]
   -> read only the columns a query touches; skip the rest entirely`}
        />
        <OpTable
          cols={["Layout", "Great at", "", "Bad at"]}
          rows={[
            { op: "Row-oriented", avg: "OLTP", avgTone: "good", why: "Point reads/writes of whole records, fetch or update one user fast. Weak for wide scans of a few columns." },
            { op: "Column-oriented", avg: "OLAP", avgTone: "good", why: "Scan-and-aggregate a few columns over billions of rows. Weak for single-row writes/updates (the row is scattered)." },
          ]}
        />
        <Callout kind="note" title="Read only what you query">
          A dashboard query touching 3 of 200 columns reads roughly 3/200 of the data in a column store, but
          would read entire rows in a row store. That column projection, plus compression below, is the core of
          the analytic speedup.
        </Callout>
      </Block>

      <Block eyebrow="why it compresses so well" title="Encoding: similar values, sitting together">
        <p className="text-ink-dim leading-relaxed mb-2">
          Because a column holds one data type with many repeated/similar values right next to each other,
          lightweight <strong>encodings</strong> shrink it far more than mixed-type rows ever could:
        </p>
        <OpTable
          cols={["Encoding", "Idea", "", "Wins on"]}
          rows={[
            { op: "Dictionary", avg: "map values -> small ids", avgTone: "good", why: "Store distinct values once, replace each cell with a tiny integer id. Huge on low-cardinality columns (country, status)." },
            { op: "Run-length (RLE)", avg: "store value x count", avgTone: "good", why: "'US x 10000' instead of US ten thousand times. Brilliant on sorted or repetitive columns." },
            { op: "Delta", avg: "store differences", avgTone: "ok", why: "Store gaps between values instead of full values, great for sorted ids, timestamps, sequences." },
            { op: "Bit-packing", avg: "minimal bits per value", avgTone: "ok", why: "Use just enough bits for the range (e.g. dictionary ids 0-7 fit in 3 bits), not a full int per value." },
          ]}
        />
        <Callout kind="tip" title="Encoding is data-aware; block compression is not">
          These encodings exploit the <em>structure</em> of the column (it is one type, often sorted or
          repetitive), which is why columnar compresses several times better than gzipping a row store. A
          general block codec like Snappy then runs <em>on top</em> of the already-encoded column for even more.
        </Callout>
      </Block>

      <Block eyebrow="skipping data you do not need" title="Vectorized execution and min/max stats">
        <p className="text-ink-dim leading-relaxed mb-2">
          Columnar storage enables two more speedups beyond just reading fewer columns:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Vectorized execution</strong>, a column is a tight array of one type, so the engine processes it in batches (SIMD-friendly), not row-by-row through a slow interpreter loop. Far better CPU throughput.</li>
          <li><strong>Min/max statistics per chunk</strong>, each storage chunk records the min and max of its values, so a filter like <code className="font-mono">WHERE age &gt; 90</code> skips any chunk whose max is &lt;= 90 without reading it. This is predicate pushdown at the file level.</li>
        </ul>
        <Callout kind="note" title="Same idea as zone maps">
          Per-chunk min/max in Parquet/ORC is the file-format version of a Redshift zone map: store a tiny
          summary, skip the block when the filter cannot match. Sorting the data on a common filter column makes
          this skipping dramatically more effective.
        </Callout>
      </Block>

      <Block eyebrow="how it lands on disk" title="Parquet / ORC layout: row groups -> column chunks -> pages">
        <p className="text-ink-dim leading-relaxed mb-2">
          Parquet (and ORC) are <em>hybrid</em>: they slice the table into horizontal <strong>row groups</strong>
          first, then store each column <em>within</em> a row group contiguously. This keeps related rows on one
          node while preserving columnar reads:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`Parquet file
+-------------------------------------------------------------+
| Row Group 1   (e.g. ~128 MB of rows)                        |
|   Column Chunk: id       -> pages (encoded + compressed)    |
|   Column Chunk: name     -> pages                           |
|   Column Chunk: age      -> pages   (+ min/max stats)       |
|   Column Chunk: country  -> pages                           |
| Row Group 2 ...                                             |
+-------------------------------------------------------------+
| Footer: schema + per-row-group, per-column statistics       |  <- read first
+-------------------------------------------------------------+

read path: footer -> pick columns + row groups whose stats can match -> read only those`}
        />
        <Callout kind="tip" title="The footer is the index">
          An engine reads the footer first to learn the schema and per-column min/max stats, then reads only the
          column chunks and row groups a query needs. That is how Athena/Spark scan a fraction of a huge file,
          column projection plus row-group skipping, all driven by metadata in the footer.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Row stores keep each record together, which is great for OLTP point reads and writes. Column stores
          keep each column together, which is what wins analytics: a query reads only the columns it touches,
          and because a column is one type with repetitive values, it compresses brutally well with dictionary,
          run-length, delta, and bit-packing encoding. Columnar also enables vectorized, batch execution and
          per-chunk min/max stats so the engine skips chunks a filter cannot match. Parquet and ORC put this on
          disk as a hybrid: row groups, then column chunks, then pages, with a footer holding the schema and
          statistics. The engine reads the footer, then only the columns and row groups it needs, which is the
          whole basis of Athena, Redshift, and Spark performance."
        </Callout>
      </Block>
    </>
  );
}

/* ── Compression & file sizing ────────────────────────────────── */
function Compression() {
  return (
    <>
      <Lede>
        Picking a codec and a file size is a real, recurring lakehouse decision. The trade is{" "}
        <strong>CPU versus I/O</strong>: compression shrinks bytes read off S3 but costs CPU to decode, and{" "}
        <strong>splittability</strong> decides whether a big file can be read by many tasks in parallel.
        Right-size your files and choose the codec deliberately and your Spark/Athena jobs get faster and
        cheaper at once.
      </Lede>

      <Block eyebrow="the codecs" title="Snappy vs Gzip vs Zstd, speed against ratio">
        <OpTable
          cols={["Codec", "Trade-off", "", "Use when"]}
          rows={[
            { op: "Snappy", avg: "fast, moderate ratio", avgTone: "good", why: "The long-time default inside Parquet. Very fast compress/decompress, modest size. Splittable within Parquet (each block is independent). Great default for hot analytic data." },
            { op: "Zstd", avg: "great ratio + good speed", avgTone: "good", why: "Better compression than Snappy at competitive speed, tunable levels. Increasingly the new default for Parquet, often the best all-round pick." },
            { op: "Gzip", avg: "small, slow", avgTone: "ok", why: "Higher ratio but slower, and as a RAW text codec it is NOT splittable, one gzipped CSV = one task. Fine inside Parquet per-block; painful on raw files." },
            { op: "LZO / BZIP2", avg: "niche", avgTone: "bad", why: "LZO is fast and splittable (with an index) but extra setup; BZIP2 compresses hard and IS splittable on raw text but is very slow. Rarely the right call today." },
          ]}
        />
        <Callout kind="tip" title="The default ladder">
          Reach for Snappy or Zstd inside Parquet for hot data (fast reads, splittable); use Gzip/Zstd at higher
          levels for cold archival data where you optimize for size and read it rarely. Zstd is increasingly the
          one-size-fits-most answer.
        </Callout>
      </Block>

      <Block eyebrow="the parallelism killer" title="Splittability: why a giant gzipped file ruins parallelism">
        <p className="text-ink-dim leading-relaxed mb-2">
          A file is <strong>splittable</strong> if the engine can start reading it from the middle, which lets
          many tasks read one file in parallel. Raw Gzip is <em>not</em> splittable, you must decompress from
          the start, so an entire huge .gz file is processed by a <strong>single task</strong> while the rest of
          the cluster sits idle:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`one 4 GB raw .gz file:                 same data as splittable Parquet (Snappy):

   [############ ONE TASK ############]    [task1][task2][task3][task4]...
    4 GB, single-threaded, slow             read in parallel across the cluster`}
        />
        <Callout kind="trap" title="Parquet sidesteps the gzip trap">
          Inside Parquet, compression is per-block (per column chunk/page), so the FILE stays splittable even if
          each block is gzip-compressed, the engine reads row groups in parallel and decompresses blocks
          independently. The splittability problem is specifically about <em>raw</em> compressed text/JSON/CSV,
          not columnar formats.
        </Callout>
      </Block>

      <Block eyebrow="two layers of shrinking" title="Columnar encoding vs block compression">
        <p className="text-ink-dim leading-relaxed mb-2">
          These are different and they stack. <strong>Columnar encoding</strong> (dictionary, RLE, delta,
          bit-packing) is data-aware, it exploits that a column is one type with repetitive values.{" "}
          <strong>Block compression</strong> (Snappy/Zstd/Gzip) is a general byte codec that then runs on the
          already-encoded bytes:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`raw column  --[ dictionary / RLE / delta / bit-pack ]-->  small encoded bytes
                          (data-aware, columnar)
            --[ Snappy / Zstd / Gzip block codec ]-->  even smaller on disk
                          (general byte compression)`}
        />
        <Callout kind="note" title="Encoding does most of the work">
          The big wins usually come from columnar encoding (similar values adjacent), and the block codec adds a
          further pass on top. That is why a well-encoded Parquet file is far smaller than a gzipped CSV of the
          same data, two complementary layers instead of one.
        </Callout>
      </Block>

      <Block eyebrow="the small-files problem" title="Right-size files: roughly 128-512 MB">
        <p className="text-ink-dim leading-relaxed mb-2">
          File size is its own performance lever. Too small and you drown in per-file overhead (the{" "}
          <strong>small-files problem</strong>); too large and you lose parallelism and pay to read more than
          you need. The sweet spot for Parquet on Spark/Athena is roughly <strong>128-512 MB</strong> per file:
        </p>
        <OpTable
          cols={["Size", "Problem", "", "Why"]}
          rows={[
            { op: "Too small (KBs-few MB)", avg: "overhead storm", avgTone: "bad", why: "Thousands of tiny files = huge task scheduling, S3 LIST/GET, and metadata overhead. Each file barely fills a task. The classic streaming-output failure mode." },
            { op: "~128-512 MB", avg: "the sweet spot", avgTone: "good", why: "Fills a task efficiently, amortizes overhead, stays splittable, and lines up well with block/row-group sizes. Compression and parallelism both win." },
            { op: "Too large (multi-GB)", avg: "lost parallelism", avgTone: "ok", why: "Fewer files than cores leaves the cluster idle; with non-splittable formats one task does it all. Read amplification on selective queries." },
          ]}
        />
        <Callout kind="tip" title="Compaction is the fix for small files">
          Streaming and frequent writes spew tiny files; the standard remedy is a compaction job that rewrites
          them into right-sized files (and table formats like Iceberg/Delta automate this). Sizing files well is
          where compression ratio AND read parallelism both pay off, the heart of the CPU-versus-I/O trade.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Codec choice is a CPU-versus-I/O trade. Snappy is the fast, moderate-ratio default inside Parquet;
          Zstd gives a better ratio at similar speed and is increasingly the new default; Gzip compresses
          smaller but is slower and, as a raw text codec, is NOT splittable, so one giant .gz is read by a
          single task. Parquet sidesteps that because it compresses per block, so the file stays splittable.
          Encoding and compression stack: columnar encoding like dictionary, RLE, delta, and bit-packing does
          the data-aware shrinking, then a block codec runs on top. And I right-size files to roughly 128 to
          512 MB, small files drown in overhead, oversized files lose parallelism, so compaction into well-sized
          files is where compression and parallel reads both win."
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  sqljoins: <SqlJoins />,
  windows: <Windows />,
  sqlperf: <SqlPerf />,
  cap: <Cap />,
  partitioning: <Partitioning />,
  mapreduce: <MapReduce />,
  columnar: <Columnar />,
  compression: <Compression />,
};

export default function DataFoundations() {
  const [active, setActive] = useState("sqljoins");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Fundamentals · the BEDROCK"
      title="Data Foundations"
      subtitle="The CS bedrock under every data platform, advanced SQL, the distributed-systems trade-offs, the MapReduce mental model, and how columnar storage and compression actually work."
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
