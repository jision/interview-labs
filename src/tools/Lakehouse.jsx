import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import ScdViz from "./lakehouse/ScdViz.jsx";
import MedallionViz from "./lakehouse/MedallionViz.jsx";

const ACCENT = "#2ee6a8";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "lakewarehouse", label: "Lake vs warehouse vs lakehouse", group: "Lake & lakehouse" },
  { id: "tableformats", label: "Iceberg, Delta & Hudi", group: "Lake & lakehouse" },
  { id: "medallion", label: "Medallion architecture", group: "Lake & lakehouse" },
  { id: "dimensional", label: "Dimensional modeling", group: "Modeling" },
  { id: "scd", label: "Slowly changing dimensions", group: "Modeling" },
  { id: "normalization", label: "Normalize vs denormalize", group: "Modeling" },
  { id: "streaming", label: "Batch vs streaming", group: "Streaming & change" },
  { id: "cdc", label: "CDC, upserts & MERGE", group: "Streaming & change" },
  { id: "quality", label: "Data quality & contracts", group: "Streaming & change" },
];

/* ── Lake vs warehouse vs lakehouse ───────────────────────────── */
function LakeWarehouse() {
  return (
    <>
      <Lede>
        Three architectures, one tension: cheap, flexible storage versus fast, governed SQL. A data lake
        gives you the first and a warehouse the second; the lakehouse is the 2024-era bet that you can
        have both by putting an open table format and a catalog on top of plain files in object storage.
      </Lede>

      <Block eyebrow="the cheap, flexible end" title="Data lake: raw files on object storage">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>data lake</strong> is just files in object storage (S3, ADLS, GCS), usually Parquet,
          JSON, CSV, or Avro, organized by prefix. It is <strong>schema-on-read</strong>: you dump data in
          its native shape and impose structure only when you query it. That makes it cheap, infinitely
          scalable, and able to hold any data type (logs, images, clickstream, tables) without up-front
          modeling.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          The flip side is governance. With no transactions, no enforced schema, and no catalog, a lake
          quietly rots into a <strong>data swamp</strong>: nobody knows what is in it, whether it is
          correct, or whether two readers saw the same thing.
        </p>
        <Callout kind="trap" title="The swamp is a governance failure, not a storage one">
          Lakes do not fail because S3 is bad; they fail because nothing enforces schema, quality, or
          consistency. Half-written files, duplicate loads, and undocumented prefixes are what turn a lake
          into a swamp. The fixes are a catalog, table formats, and contracts, not more storage.
        </Callout>
      </Block>

      <Block eyebrow="the fast, governed end" title="Data warehouse: structured, schema-on-write">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>data warehouse</strong> (Redshift, Snowflake, BigQuery) is purpose-built for analytics.
          It is <strong>schema-on-write</strong>: data must conform to a defined schema before it lands, so
          everything inside is typed, validated, and governed. You get fast SQL, strong consistency,
          fine-grained access control, and a rich BI ecosystem.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          The costs are flexibility and money. Loading needs ETL up front, semi-structured and unstructured
          data are awkward, and proprietary storage plus coupled compute make it pricier at scale.
        </p>
        <OpTable
          cols={["Dimension", "Data lake", "", "Data warehouse"]}
          rows={[
            { op: "Schema", avg: "schema-on-read", avgTone: "good", why: "Lake imposes structure at query time; warehouse enforces it on write, before data lands." },
            { op: "Cost / scale", avg: "cheap object storage", avgTone: "good", why: "Lake scales cheaply on S3; warehouse storage and compute are pricier, often coupled and proprietary." },
            { op: "Query speed / BI", avg: "needs an engine", avgTone: "bad", why: "Warehouse is tuned for fast SQL and BI out of the box; raw lake needs Athena, Spark, or Trino on top." },
            { op: "Governance", avg: "DIY, can swamp", avgTone: "bad", why: "Warehouse has built-in ACID, access control, and quality; a bare lake has none of it." },
          ]}
        />
      </Block>

      <Block eyebrow="the synthesis" title="Lakehouse: warehouse reliability on lake storage">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>lakehouse</strong> keeps data in cheap open files but adds the three things a bare
          lake lacks: an <strong>open table format</strong> (Iceberg, Delta, Hudi) for ACID transactions,
          time travel, and schema evolution; a <strong>catalog</strong> (AWS Glue Data Catalog, Unity,
          Polaris) for discovery and governance; and engines (EMR Spark, Athena, Trino, Snowflake) that
          read those tables directly. You get warehouse-like reliability and SQL on lake-priced storage.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`                         engines (EMR Spark / Athena / Trino / Snowflake)
                                       |
   catalog (Glue / Unity / Polaris)  --+--  metadata, governance, discovery
                                       |
   open table format (Iceberg / Delta / Hudi)  ->  ACID log + schema + snapshots
                                       |
   open files (Parquet) on object storage (S3)  ->  cheap, decoupled, any engine`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The structural win is <strong>decoupled storage and compute</strong>. Data lives once in S3;
          many engines and many clusters read and write it independently, and you scale (or kill) compute
          without touching storage. That is the opposite of a classic warehouse where storage and compute
          are bought together.
        </p>
        <Callout kind="note" title="Open formats are the unlock">
          The lakehouse is not a product, it is a pattern. What makes it possible is that the table format
          is an open, on-disk spec, so Spark can write a table that Athena, Trino, and Snowflake all read
          without copying. No vendor owns the bytes.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "A data lake is cheap, flexible, schema-on-read files on S3, great for any data type but it can
          rot into a swamp with no governance. A warehouse is schema-on-write, structured, fast for SQL and
          BI, and governed, but pricier and rigid. A lakehouse puts an open table format like Iceberg or
          Delta plus a catalog on top of lake storage, so you get ACID, time travel, and schema evolution,
          warehouse-grade reliability, on cheap open files, with storage and compute decoupled so many
          engines read the same data without copies."
        </Callout>
      </Block>
    </>
  );
}

/* ── Iceberg, Delta & Hudi ────────────────────────────────────── */
function TableFormats() {
  return (
    <>
      <Lede>
        Plain Parquet is a great file format and a terrible table. It cannot do a transaction, an update,
        or a safe concurrent write. Open <em>table</em> formats fix that by layering a transaction log and
        metadata over the same Parquet files, which is what turns a folder of files into something that
        behaves like a database table.
      </Lede>

      <Block eyebrow="the problem they solve" title="Why a pile of Parquet is not a table">
        <p className="text-ink-dim leading-relaxed mb-2">
          Reading a Parquet directory means listing files and unioning them. There is no atomic commit, so
          a half-finished job leaves partial files a reader can see. There is no row-level update, so
          "change one customer's email" means rewriting whole files by hand. Two writers clobber each other.
          A table format adds a <strong>metadata layer</strong> that tracks which files make up the table
          right now, giving you database semantics on top of immutable files.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`plain parquet:   /orders/  ->  part-000.parquet, part-001.parquet, ...
                 (just files; reader unions whatever it finds)

table format:    transaction log + manifests  ->  "the table = these N files
                 as of snapshot S"   ->  ACID commit, time travel, row-level ops`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          That one idea buys you the whole list: <strong>ACID</strong> transactions, <strong>time travel</strong>{" "}
          and snapshots (query the table as of an earlier version), <strong>schema evolution</strong> (add,
          drop, rename columns safely), row-level <strong>upserts / MERGE / deletes</strong>, and{" "}
          <strong>concurrent writers</strong> via optimistic concurrency.
        </p>
      </Block>

      <Block eyebrow="the three formats" title="Iceberg, Delta, and Hudi">
        <OpTable
          cols={["Format", "Origin / strength", "", "What to know"]}
          rows={[
            { op: "Apache Iceberg", avg: "engine-neutral, AWS-favored", avgTone: "good", why: "Hidden partitioning and partition evolution (change the partition scheme without rewriting). Strong on Athena, EMR, and Glue. The default open choice on AWS." },
            { op: "Delta Lake", avg: "Databricks origin", avgTone: "good", why: "A _delta_log transaction log over Parquet. Best-in-class Spark integration, mature, and now broadly readable. The natural pick in a Databricks shop." },
            { op: "Apache Hudi", avg: "record-level upserts / CDC", avgTone: "ok", why: "Built for incremental upserts and CDC. Copy-on-write vs merge-on-read tables, indexes for fast lookups. AWS-supported on EMR; strong for streaming mutation." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          They overlap heavily; the honest framing is "pick by ecosystem." On open AWS, Iceberg is the
          safe default. In Databricks, Delta. For heavy record-level mutation and CDC, Hudi's{" "}
          <strong>merge-on-read</strong> (write small delta files, merge at read time) shines, versus{" "}
          <strong>copy-on-write</strong> (rewrite files on update, cheaper reads, pricier writes).
        </p>
        <Callout kind="note" title="Hidden partitioning is Iceberg's party trick">
          With Iceberg you partition by a transform of a column (say day(ts)) and the engine applies it
          automatically, so queries do not need a literal partition column in the filter, and you can
          evolve the partition scheme later without rewriting old data. That removes a whole class of Hive
          partitioning foot-guns.
        </Callout>
      </Block>

      <Block eyebrow="keeping it fast" title="Compaction, snapshots, and maintenance">
        <p className="text-ink-dim leading-relaxed mb-2">
          Frequent writes (especially streaming and CDC) create many small files and pile up old snapshots.
          Two maintenance jobs keep a table healthy: <strong>compaction</strong> rewrites many small files
          into fewer big ones (the small-files problem kills scan performance), and{" "}
          <strong>snapshot expiration / vacuum</strong> drops old versions and orphaned files to reclaim
          storage. Time travel is wonderful, but unbounded history is not free.
        </p>
        <Callout kind="trap" title="Small files and snapshot bloat are the real-world pain">
          A table that gets thousands of tiny appends will scan slowly and accumulate huge metadata.
          Schedule compaction and snapshot expiry as part of operating any lakehouse table; "it is slow"
          is usually "it was never compacted."
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Plain Parquet is files with no transactions and no row-level updates. Open table formats put a
          transaction log and metadata over those Parquet files to get ACID, time travel, schema evolution,
          MERGE/upserts, and concurrent writers. Iceberg is the engine-neutral, AWS-favored default with
          hidden partitioning and partition evolution; Delta is Databricks-origin with a _delta_log and
          great Spark support; Hudi specializes in record-level upserts and CDC with copy-on-write versus
          merge-on-read. And I always schedule compaction and snapshot expiry so small files and old
          snapshots do not wreck performance."
        </Callout>
      </Block>
    </>
  );
}

/* ── Medallion architecture ───────────────────────────────────── */
function Medallion() {
  return (
    <>
      <Lede>
        The medallion (or bronze / silver / gold) architecture is how you turn a chaotic lake into a
        trustworthy one. Each layer has a single job and a defined quality bar, so data gets progressively
        cleaner and more business-ready as it flows, and you always have a raw copy to reprocess from.
      </Lede>

      <Try label="explore the layers">
        <MedallionViz />
      </Try>

      <Block eyebrow="the three layers" title="Bronze, silver, gold">
        <OpTable
          cols={["Layer", "Holds", "", "Consumer"]}
          rows={[
            { op: "Bronze", avg: "raw, append-only", avgTone: "ok", why: "Immutable landing of source data exactly as it arrived, schema-on-read, plus ingest metadata. The replayable source of truth." },
            { op: "Silver", avg: "cleaned + conformed", avgTone: "good", why: "Typed, deduped, validated, and joined to reference data. One row per real event. The trustworthy query-ready layer." },
            { op: "Gold", avg: "business aggregates", avgTone: "good", why: "Marts, KPIs, and star-schema facts/dims aggregated to the reporting grain. Serves BI dashboards and execs." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The transformations between layers are the work: bronze to silver is{" "}
          <strong>cleaning and conforming</strong> (cast types, dedupe, validate, quarantine bad rows,
          enrich), and silver to gold is <strong>aggregating and modeling</strong> (roll up to the grain,
          compute metrics, build the dimensional model).
        </p>
      </Block>

      <Block eyebrow="why layer at all" title="Reprocessability, isolation, lineage">
        <p className="text-ink-dim leading-relaxed mb-2">
          Layering is not bureaucracy, it buys three concrete things:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Reprocessability</strong>, because bronze is immutable raw, you can rebuild silver and gold from scratch when logic changes or a bug is found. You never lose the original.</li>
          <li><strong>Isolation of concerns</strong>, ingestion bugs stay in bronze, cleaning logic lives in silver, business definitions live in gold. A change in one layer does not ripple uncontrollably.</li>
          <li><strong>Lineage and trust</strong>, every gold number traces back through silver to a raw bronze record, which is exactly what auditors and debugging both need.</li>
        </ul>
        <Callout kind="tip" title="Bronze is immutable for a reason">
          Never clean in place in bronze. Its whole value is being the faithful, replayable copy of the
          source. The moment you mutate it, you lose the ability to reprocess, which is the main reason the
          architecture exists.
        </Callout>
      </Block>

      <Block eyebrow="on AWS" title="Mapping layers to S3">
        <p className="text-ink-dim leading-relaxed mb-2">
          In practice the layers are S3 prefixes (or separate buckets), each a set of tables in the
          catalog. EMR Spark jobs read one layer and write the next, and silver/gold are usually open table
          format tables so they get ACID and upserts.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`s3://lake/bronze/orders/dt=2026-06-19/...   ->  raw json/parquet, append-only
s3://lake/silver/fct_orders/                ->  Iceberg/Delta, typed + deduped
s3://lake/gold/daily_revenue/               ->  aggregated mart for BI

   EMR Spark:  bronze --clean/conform-->  silver --aggregate/model-->  gold`}
        />
        <Callout kind="note" title="Layers are a contract, not a folder convention">
          The value is the quality guarantee at each boundary (raw / trustworthy / business-ready), not the
          literal three names. Some teams add a platinum or feature layer; the principle is the same,
          progressive refinement with a replayable raw base.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Medallion is bronze, silver, gold. Bronze is raw, append-only, immutable landing, the replayable
          source of truth. Silver is cleaned, conformed, deduped, validated, and joined, the trustworthy
          query-ready layer. Gold is business aggregates and star-schema marts for BI and execs. I layer it
          for reprocessability, since I can rebuild silver and gold from immutable bronze; for isolation of
          concerns; and for lineage. On AWS those are S3 prefixes with EMR Spark moving data between them,
          and silver and gold are Iceberg or Delta tables so I get ACID and upserts."
        </Callout>
      </Block>
    </>
  );
}

/* ── Dimensional modeling ─────────────────────────────────────── */
function Dimensional() {
  return (
    <>
      <Lede>
        Dimensional modeling (Kimball) is the analytics-side counterweight to normalized OLTP design. You
        split the world into <em>facts</em> (the measurable events) and <em>dimensions</em> (the
        descriptive context), arrange them in a star, and get a model that is simple to query and fast to
        aggregate, which is exactly what BI needs.
      </Lede>

      <Block eyebrow="facts vs dimensions" title="The two kinds of table">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>fact table</strong> holds measurements of a business process, one row per event, with
          numeric <strong>measures</strong> plus foreign keys to dimensions. A{" "}
          <strong>dimension table</strong> holds the descriptive attributes you slice and filter by
          (customer, product, date, store), wide and denormalized.
        </p>
        <OpTable
          cols={["Measure type", "Meaning", "", "Example"]}
          rows={[
            { op: "Additive", avg: "sums across all dims", avgTone: "good", why: "Can be summed over any dimension, including time. Revenue, quantity sold." },
            { op: "Semi-additive", avg: "sums across some dims", avgTone: "ok", why: "Sums across most dimensions but not time, you average or snapshot instead. Account balance, inventory on hand." },
            { op: "Non-additive", avg: "cannot be summed", avgTone: "bad", why: "Ratios and percentages do not add up. Store the components (numerator, denominator) and compute on the fly." },
          ]}
        />
        <Callout kind="trap" title="Declare the grain first, before anything else">
          The grain is "what one fact row means" (one order line, one daily snapshot, one shipment). Pin it
          down before you pick measures or dimensions; mixing grains in one fact table is the classic
          modeling bug that makes every aggregate wrong.
        </Callout>
      </Block>

      <Block eyebrow="the shape" title="Star vs snowflake schema">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>star schema</strong> puts one fact table in the center surrounded by{" "}
          <em>denormalized</em> dimension tables, a single join from fact to each dimension. A{" "}
          <strong>snowflake schema</strong> normalizes those dimensions into sub-tables (product to
          category to department), which saves a little storage at the cost of more joins.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`STAR (denormalized dims, one hop each):

     dim_date     dim_customer
          \\          /
           fct_sales            <- central fact: measures + FKs
          /          \\
   dim_product     dim_store

SNOWFLAKE: dim_product -> dim_category -> dim_department  (more joins, less redundancy)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          For analytics, <strong>star usually wins</strong>: fewer joins means simpler SQL and faster
          aggregation, and storage on a lake is cheap. Snowflake is occasionally justified for very large,
          frequently-changing dimensions, but it is the exception.
        </p>
      </Block>

      <Block eyebrow="the keys and the glue" title="Surrogate keys and conformed dimensions">
        <p className="text-ink-dim leading-relaxed mb-2">
          Dimensions use a <strong>surrogate key</strong>, a meaningless integer the warehouse generates,
          rather than the source's natural/business key. Surrogate keys decouple you from source systems,
          make joins fast, and (crucially) let one business entity have multiple rows over time, which is
          what makes Type 2 slowly-changing dimensions possible.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>conformed dimension</strong> is one shared, consistent dimension (a single dim_date or
          dim_customer) reused across multiple fact tables, so "customer" means the same thing in sales and
          in support. Conformed dimensions are what let you compare and combine facts across the business.
        </p>
        <Callout kind="note" title="Why dimensional for analytics">
          It maps to how people ask questions: "revenue (a measure) by region and month (dimensions)."
          Simple star joins, fast group-bys, and BI-tool friendliness all fall out of that structure, which
          is why it has outlasted decades of warehouse churn.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Dimensional modeling splits data into facts, the measurable events with numeric measures and
          foreign keys, and dimensions, the descriptive attributes you slice by. I declare the grain first,
          then pick measures (additive, semi-additive, non-additive) and dimensions. A star schema keeps
          dimensions denormalized for one-hop joins and fast aggregation; snowflake normalizes them at the
          cost of more joins, and star usually wins for analytics. I use surrogate keys so dimensions
          decouple from source systems and can carry history, and conformed dimensions so customer or date
          means the same thing across every fact table."
        </Callout>
      </Block>
    </>
  );
}

/* ── Slowly changing dimensions ───────────────────────────────── */
function Scd() {
  return (
    <>
      <Lede>
        Dimension attributes change: a customer moves, a product gets recategorized, a rep changes
        territory. Slowly changing dimensions (SCD) are the patterns for handling those changes, and the
        real question an interviewer is asking is "do you keep history, and how?" Type 2 is the one to know
        cold.
      </Lede>

      <Try label="apply a change and watch the dimension table">
        <ScdViz />
      </Try>

      <Block eyebrow="the catalog" title="The SCD types">
        <OpTable
          cols={["Type", "On change", "", "History kept"]}
          rows={[
            { op: "Type 0", avg: "retain / ignore", avgTone: "ok", why: "The attribute is fixed and never updated (original signup date, date of birth). Changes are simply not applied." },
            { op: "Type 1", avg: "overwrite in place", avgTone: "bad", why: "Update the value, lose the old one. One row, always current. Use when history does not matter or to fix errors." },
            { op: "Type 2", avg: "add a new row", avgTone: "good", why: "Close the old row, insert a new one with a new surrogate key. Full history. The most common and the interview favorite." },
            { op: "Type 3", avg: "add a prior-value column", avgTone: "ok", why: "Keep current plus one previous value in a second column. Limited history, for a known single change." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          There are also hybrids: <strong>Type 4</strong> moves history into a separate history table
          (keeping the main dimension current and lean), and <strong>Type 6</strong> (1 + 2 + 3 combined)
          carries both a current-value column and full Type 2 row history for flexible reporting.
        </p>
      </Block>

      <Block eyebrow="the one to know" title="Type 2 in detail">
        <p className="text-ink-dim leading-relaxed mb-2">
          Type 2 is the default for "I need full history." When an attribute changes, you do not update,
          you <strong>close the current row</strong> (set effective_to and is_current = false) and{" "}
          <strong>insert a brand-new row</strong> with a fresh surrogate key, the new value, a new
          effective_from, and is_current = true. The business key stays the same; the surrogate key is new.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`Ada (customer_id 42) moves Paris -> Berlin under Type 2:

 sk | cust_id | city   | effective_from | effective_to | is_current
----+---------+--------+----------------+--------------+-----------
  1 |   42    | Paris  | 2021-01-01     | 2024-09-01   | false   <- closed
  2 |   42    | Berlin | 2024-09-01     | 9999-12-31   | true    <- new row

facts joined on the surrogate key see the city that was correct at event time.`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Because facts join on the <em>surrogate</em> key, an old order stays attached to "Paris" and a
          new one to "Berlin." That is the entire point: you get correct point-in-time history without
          touching the fact table.
        </p>
        <Callout kind="trap" title="Type 2 needs surrogate keys, not natural keys">
          You cannot do Type 2 if the fact table joins on the business key, because one business key now
          maps to many rows. Surrogate keys are what let a single customer have a Paris row and a Berlin
          row that facts can point at unambiguously.
        </Callout>
      </Block>

      <Block eyebrow="picking one" title="When to use which">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Type 0</strong>, immutable attributes that must never change (original cohort, birth date).</li>
          <li><strong>Type 1</strong>, corrections and attributes where only "now" matters (a fixed typo, a current phone number nobody reports on historically).</li>
          <li><strong>Type 2</strong>, the default whenever point-in-time accuracy matters, which in analytics is most of the time.</li>
          <li><strong>Type 3</strong>, a known one-off change you want to compare across (old vs new sales region during a reorg).</li>
        </ul>
        <Callout kind="note" title="On a lakehouse, Type 2 is a MERGE">
          Implementing Type 2 means upserting: close matched current rows and insert new ones, which is a
          single MERGE INTO on an Iceberg/Delta/Hudi table. That ties this topic directly to CDC and the
          table formats, plain Parquet could not do it.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "SCD is how I track dimension attribute changes over time. Type 0 ignores changes, Type 1
          overwrites and loses history, Type 2 adds a new row per change with a new surrogate key,
          effective_from/effective_to, and an is_current flag for full history, and Type 3 keeps a
          previous-value column for limited history. There are hybrids like Type 4 history tables and Type
          6. Type 2 is the default and the one to know: facts join on the surrogate key so an old order
          stays tied to the old value, which is why it needs surrogate keys, and on a lakehouse I implement
          it as a MERGE on an Iceberg or Delta table."
        </Callout>
      </Block>
    </>
  );
}

/* ── Normalize vs denormalize ─────────────────────────────────── */
function Normalization() {
  return (
    <>
      <Lede>
        Normalization and denormalization are the two ends of a single trade: write integrity versus read
        speed. OLTP systems normalize to keep writes safe and non-redundant; analytics deliberately
        denormalizes to make reads fast. Knowing which side a workload sits on is the whole skill.
      </Lede>

      <Block eyebrow="the integrity end" title="Normalization (3NF) for OLTP">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Normalization</strong> organizes data to eliminate redundancy: every fact lives in
          exactly one place. By <strong>third normal form (3NF)</strong> there are no duplicated values and
          no derived columns, so an update happens once and cannot leave the database inconsistent. That is
          ideal for <strong>OLTP</strong>, where you do many small, concurrent writes and integrity is
          everything.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          The cost shows up at read time: answering a real question means joining many small tables, which
          is slow and complex for analytics that scan and aggregate millions of rows.
        </p>
        <Callout kind="note" title="Normalize for writes, denormalize for reads">
          The fast rule: if the workload is lots of small transactional writes that must stay consistent,
          normalize. If it is big analytical reads and aggregations, denormalize. The same data is modeled
          differently on the write side and the read side, and that is fine.
        </Callout>
      </Block>

      <Block eyebrow="the speed end" title="Denormalization for OLAP">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Denormalization</strong> deliberately duplicates data and pre-joins tables so reads avoid
          joins. Wide tables and pre-joined marts trade some redundancy and write complexity for far faster
          queries, which is the right call for <strong>OLAP</strong>, where reads vastly outnumber writes
          and data is often loaded in bulk rather than mutated row-by-row.
        </p>
        <OpTable
          cols={["Aspect", "Normalized (OLTP)", "", "Denormalized (OLAP)"]}
          rows={[
            { op: "Redundancy", avg: "none", avgTone: "good", why: "Normalized stores each fact once; denormalized duplicates it to avoid joins at read time." },
            { op: "Reads", avg: "many joins, slower", avgTone: "bad", why: "Denormalized wide/pre-joined tables scan and aggregate fast; normalized needs lots of joins." },
            { op: "Writes", avg: "simple, consistent", avgTone: "good", why: "Normalized updates one place; denormalized must update every copy, so writes are more complex." },
            { op: "Best for", avg: "transactional apps", avgTone: "ok", why: "Normalized fits OLTP; denormalized fits analytics, dashboards, and ML feature tables." },
          ]}
        />
      </Block>

      <Block eyebrow="the connection" title="A star schema is deliberate denormalization">
        <p className="text-ink-dim leading-relaxed mb-2">
          This is the link back to dimensional modeling: a <strong>star schema is a denormalization on
          purpose</strong>. Dimension tables are intentionally wide and redundant so a query is one hop
          from fact to dimension. Snowflaking re-normalizes them and you pay it back in joins. On a
          lakehouse, gold-layer marts and ML feature tables are usually heavily denormalized, pre-joined,
          and pre-aggregated, trading write effort for read speed.
        </p>
        <Callout kind="tip" title="It is a spectrum, not a religion">
          You are not 'a normalizer' or 'a denormalizer.' You normalize the OLTP source, then denormalize
          into a star or wide tables for analytics. The senior signal is naming the trade out loud (write
          integrity vs read speed) and placing the workload, not dogma.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Normalization, up to 3NF, removes redundancy so every fact lives in one place. That keeps writes
          simple and consistent, which is why OLTP systems normalize, but reads need many joins.
          Denormalization duplicates and pre-joins data so reads avoid joins, which is what analytics and
          OLAP want, at the cost of redundancy and more complex writes. A star schema is deliberate
          denormalization, and gold-layer marts and ML feature tables are wide and pre-joined. So I
          normalize the transactional source and denormalize on the read side: write integrity versus read
          speed, placed to the workload."
        </Callout>
      </Block>
    </>
  );
}

/* ── Batch vs streaming ───────────────────────────────────────── */
function Streaming() {
  return (
    <>
      <Lede>
        Batch processes a bounded chunk of data on a schedule; streaming processes an unbounded flow
        continuously. The interview depth here is Spark Structured Streaming specifically: its micro-batch
        model, why watermarks exist, and how checkpointing plus an idempotent sink give you exactly-once.
      </Lede>

      <Block eyebrow="the core split" title="Bounded vs unbounded">
        <OpTable
          cols={["Property", "Batch", "", "Streaming"]}
          rows={[
            { op: "Data", avg: "bounded chunk", avgTone: "good", why: "Batch runs over a finite dataset (yesterday's files); streaming runs over an unbounded, never-ending flow." },
            { op: "Latency", avg: "minutes to hours", avgTone: "ok", why: "Batch trades latency for simplicity and throughput; streaming targets seconds for fresh results." },
            { op: "Complexity", avg: "simple, restartable", avgTone: "good", why: "Batch jobs just rerun; streaming must manage state, late data, and exactly-once, which is harder." },
            { op: "Throughput", avg: "very high", avgTone: "good", why: "Batch is efficient on huge volumes; streaming optimizes for freshness over peak throughput." },
          ]}
        />
        <Callout kind="note" title="Most pipelines are still batch">
          Streaming is not automatically better, it is more complex and only worth it when freshness has
          real value (fraud, monitoring, live dashboards). Plenty of analytics is perfectly served by an
          hourly or nightly batch, and "do you actually need streaming?" is a fair senior question.
        </Callout>
      </Block>

      <Block eyebrow="how Spark streams" title="Structured Streaming: micro-batch, same API">
        <p className="text-ink-dim leading-relaxed mb-2">
          Spark <strong>Structured Streaming</strong> treats a stream as an unbounded table and processes
          it in small <strong>micro-batches</strong>, so you write the <em>same</em> DataFrame/SQL code as
          batch and Spark runs it incrementally. Sources are Kafka, Kinesis, files, or a table format;
          sinks are tables, Kafka, or files. <strong>Checkpointing</strong> persists offsets and state to
          durable storage so a failed job resumes exactly where it left off.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`source (Kafka/Kinesis) -> micro-batch -> same DataFrame logic -> sink (table)
                              |                                       |
                          checkpoint  (offsets + state)  ----  resume on failure

output modes:  append   (new rows only, for event streams)
               update   (changed aggregate rows)
               complete (whole result table each batch, small aggregates)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The three <strong>output modes</strong> matter: append for pure event streams, update for
          changing aggregates, complete to rewrite the whole result each batch (only for small results).
        </p>
      </Block>

      <Block eyebrow="time and late data" title="Event time, watermarks, and exactly-once">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Event time</strong> (when the event actually happened) is what you usually want to
          aggregate by, not <strong>processing time</strong> (when Spark saw it), because events arrive out
          of order and late. To aggregate by event time without holding state forever, you set a{" "}
          <strong>watermark</strong>: "I will wait up to N minutes for late data, then finalize the window
          and drop its state." Watermarks bound state and decide how late is too late.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`withWatermark("event_time", "10 minutes")   ->  wait 10 min for stragglers
                                                  then close the window, free state

  exactly-once  =  replayable source (offsets)
                 +  checkpoint (offsets + state)
                 +  idempotent / transactional sink  (no double-apply on retry)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          <strong>Exactly-once</strong> is not magic: it comes from a replayable source, checkpointed
          offsets and state, and an idempotent or transactional sink so a retried micro-batch does not
          double-write. Writing to an Iceberg/Delta table gives you that transactional sink.
        </p>
        <Callout kind="tip" title="Mention Flink as the true-streaming alternative">
          Spark is micro-batch, which is great for throughput but adds a little latency. Apache Flink is a
          true record-at-a-time streaming engine with richer event-time and state handling, the pick when
          you need genuinely low-latency, event-driven processing rather than small batches.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Batch processes a bounded dataset on a schedule, high throughput and simple; streaming processes
          an unbounded flow continuously for low latency, at the cost of complexity. In Spark Structured
          Streaming a stream is an unbounded table processed in micro-batches with the same DataFrame API;
          checkpointing offsets and state lets it resume on failure, and there are append, update, and
          complete output modes. I aggregate by event time, not processing time, and set a watermark to
          bound state and handle late data. Exactly-once comes from a replayable source, checkpoints, and
          an idempotent or transactional sink like an Iceberg table. For true low-latency streaming I would
          reach for Flink."
        </Callout>
      </Block>
    </>
  );
}

/* ── CDC, upserts & MERGE ─────────────────────────────────────── */
function Cdc() {
  return (
    <>
      <Lede>
        Change Data Capture is how you keep a lakehouse table in sync with a source database without
        re-extracting the whole thing every night. You capture the inserts, updates, and deletes from the
        source and apply them downstream with a MERGE, which is precisely the operation plain Parquet
        cannot do.
      </Lede>

      <Block eyebrow="capturing change" title="What CDC is and how you get it">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Change Data Capture (CDC)</strong> captures row-level changes (inserts, updates, deletes)
          from a source database as they happen. The robust way is <strong>log-based</strong> CDC, reading
          the database's transaction log (the binlog/WAL) rather than polling, via tools like{" "}
          <strong>AWS DMS</strong> or <strong>Debezium</strong>. Log-based CDC catches deletes and every
          intermediate change with low load on the source, which query-based polling cannot reliably do.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`source DB  --(binlog / WAL)-->  DMS / Debezium  --(change events)-->  stream/files
                                                                            |
                              MERGE INTO lakehouse table  <-----------------+
                              (apply inserts / updates / deletes downstream)`}
        />
        <Callout kind="note" title="Log-based beats polling">
          Polling 'rows where updated_at &gt; last_run' misses hard deletes and intermediate states, and
          hammers the source. Log-based CDC reads the commit log, so it sees every change including
          deletes, with minimal source impact. It is the senior default.
        </Callout>
      </Block>

      <Block eyebrow="applying change" title="Upserts and MERGE INTO">
        <p className="text-ink-dim leading-relaxed mb-2">
          To keep a mirror table current you <strong>upsert</strong>: update rows that exist, insert ones
          that do not, delete ones the source removed. SQL expresses this as <strong>MERGE INTO</strong>,
          and an open table format executes it atomically on the lake.
        </p>
        <CodeBlock
          title="sql"
          lang="text"
          code={`MERGE INTO orders t
USING changes s
   ON t.order_id = s.order_id
WHEN MATCHED AND s.op = 'D' THEN DELETE
WHEN MATCHED                THEN UPDATE SET *
WHEN NOT MATCHED            THEN INSERT *;`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          This same MERGE is how you apply CDC, implement Type 2 SCDs, and dedupe, all on an
          Iceberg / Delta / Hudi table.
        </p>
        <Callout kind="trap" title="Plain Parquet cannot do row-level upserts">
          A Parquet directory has no update or delete, you would have to rewrite whole files by hand and
          risk partial writes. Row-level MERGE needs the transaction log of Iceberg, Delta, or Hudi (Hudi
          was literally built for record-level upserts). This is the most concrete reason the lakehouse
          needs a table format.
        </Callout>
      </Block>

      <Block eyebrow="the hard parts" title="Ordering, late events, and idempotency">
        <p className="text-ink-dim leading-relaxed mb-2">
          Applying changes correctly is where CDC gets subtle:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Ordering</strong>, two updates to the same key must apply in source order. Use a version/sequence/commit-LSN column and, in the MERGE, only apply a change if it is newer than what is already there.</li>
          <li><strong>Out-of-order / late events</strong>, events can arrive shuffled, so you dedupe to the latest version per key before merging rather than blindly applying the last one to land.</li>
          <li><strong>Deletes</strong>, decide hard delete vs <strong>soft delete</strong> (an is_deleted flag), which preserves history and is often safer for analytics.</li>
          <li><strong>Idempotency</strong>, applying the same change batch twice must not corrupt the table, which the version check plus a transactional MERGE guarantees, so retries are safe.</li>
        </ul>
        <Callout kind="tip" title="Always merge by latest-version-per-key">
          The reliable recipe: collect changes, reduce to the latest record per primary key (by sequence or
          commit time), then MERGE with a 'only if newer' guard. That handles out-of-order delivery,
          duplicates, and retries in one shot.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "CDC captures inserts, updates, and deletes from a source database, ideally log-based via DMS or
          Debezium reading the binlog/WAL, so it catches deletes and every change with low source load. I
          apply those changes downstream with MERGE INTO on a lakehouse table to keep a current mirror, the
          same MERGE that does Type 2 SCDs. Plain Parquet cannot do row-level upserts, you need Iceberg,
          Delta, or Hudi. The tricky parts are ordering and late events, which I handle by reducing to the
          latest version per key with a sequence or commit time and only applying changes that are newer,
          plus soft deletes and idempotent apply so retries are safe."
        </Callout>
      </Block>
    </>
  );
}

/* ── Data quality & contracts ─────────────────────────────────── */
function Quality() {
  return (
    <>
      <Lede>
        Trustworthy tables are the whole point of the lakehouse, and trust is engineered, not hoped for.
        You measure quality along well-known dimensions, assert it with tooling in the pipeline, and push
        the responsibility upstream with data contracts so bad data fails fast instead of silently
        poisoning a dashboard.
      </Lede>

      <Block eyebrow="what 'quality' means" title="The dimensions of data quality">
        <OpTable
          cols={["Dimension", "Asks", "", "Example check"]}
          rows={[
            { op: "Completeness", avg: "is anything missing?", avgTone: "good", why: "Required columns are non-null; expected volume of rows arrived." },
            { op: "Uniqueness", avg: "any duplicates?", avgTone: "good", why: "Primary key is unique; no double-counted events." },
            { op: "Validity", avg: "in the allowed shape?", avgTone: "ok", why: "Values match type, range, regex, or allowed set (status in {new, paid, shipped})." },
            { op: "Consistency", avg: "agrees across sources?", avgTone: "ok", why: "Totals reconcile; the same entity matches between systems." },
            { op: "Accuracy", avg: "matches reality?", avgTone: "ok", why: "Values reflect the true state of the world, the hardest to verify automatically." },
            { op: "Timeliness", avg: "fresh enough?", avgTone: "ok", why: "Data arrived within its SLA; the latest partition is recent." },
          ]}
        />
        <Callout kind="note" title="Freshness, volume, and schema are the cheap wins">
          Even before deep checks, three monitors catch most incidents: freshness (did today's data
          arrive?), volume (is the row count in the normal range?), and schema (did a column type or name
          change?). Anomaly detection on those metrics flags 'something broke upstream' early.
        </Callout>
      </Block>

      <Block eyebrow="enforcing it" title="Checks in the pipeline">
        <p className="text-ink-dim leading-relaxed mb-2">
          You codify expectations as assertions that run as part of the pipeline. Common tooling:{" "}
          <strong>Deequ / PyDeequ</strong> (Amazon's Spark-native data quality library, ideal on EMR) and{" "}
          <strong>Great Expectations</strong> (Python, expectation suites with rich reporting). The pattern
          is the same: define constraints, run them on each batch, and route failures somewhere safe.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`Deequ-style constraints on a batch:

  .isComplete("order_id")              -> no nulls in the key
  .isUnique("order_id")                -> no duplicate orders
  .isContainedIn("status", allowed)    -> only valid statuses
  .hasMin("amount", 0)                 -> no negative amounts

  on failure -> QUARANTINE the bad rows (write to a side table),
                let the good rows through, and alert. Do not poison silver.`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The <strong>quarantine</strong> pattern is key: rather than failing the whole job or letting bad
          rows into silver, you divert them to a side table for inspection and pass the clean rows on. Bad
          data is contained, not propagated, and not lost.
        </p>
      </Block>

      <Block eyebrow="shifting it upstream" title="Data contracts">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>data contract</strong> is an explicit, versioned agreement between a data{" "}
          <em>producer</em> and its <em>consumers</em>: the schema, semantics, allowed values, and an SLA
          (freshness, volume, quality guarantees). It moves accountability to the source, so a producer
          cannot silently rename a column or change a type and break every downstream job.
        </p>
        <Callout kind="tip" title="Fail fast on breach, do not silently degrade">
          The contract's power is enforcement: if an incoming batch violates the agreed schema or SLA, the
          pipeline rejects it loudly at the boundary instead of letting subtly wrong data flow into gold and
          surface as a wrong number on an exec dashboard weeks later. Catch it at the door.
        </Callout>
        <p className="text-ink-dim leading-relaxed mt-2">
          Underneath both checks and contracts is <strong>observability and lineage</strong>: tracking
          freshness/volume/schema metrics over time, detecting anomalies, and knowing which downstream
          tables a broken source feeds, so when something breaks you can see it and trace its blast radius.
        </p>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "I treat data quality as engineered, not assumed. I measure it along completeness, uniqueness,
          validity, consistency, accuracy, and timeliness, and the cheap high-value monitors are freshness,
          volume, and schema with anomaly detection on those metrics. I enforce expectations in the
          pipeline with Deequ/PyDeequ or Great Expectations, asserting constraints per batch and
          quarantining bad rows to a side table so they do not poison silver. Above that I push data
          contracts, a versioned producer-consumer agreement on schema and SLA, and fail fast on breach so
          a bad upstream change is caught at the boundary, backed by lineage and observability to trace the
          blast radius."
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  lakewarehouse: <LakeWarehouse />,
  tableformats: <TableFormats />,
  medallion: <Medallion />,
  dimensional: <Dimensional />,
  scd: <Scd />,
  normalization: <Normalization />,
  streaming: <Streaming />,
  cdc: <Cdc />,
  quality: <Quality />,
};

export default function Lakehouse() {
  const [active, setActive] = useState("lakewarehouse");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="The data · modeling & lakehouse"
      title="Lakehouse & Modeling"
      subtitle="From raw files to trustworthy tables, lake vs warehouse vs lakehouse, the open table formats, dimensional modeling, slowly changing dimensions, and streaming."
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
