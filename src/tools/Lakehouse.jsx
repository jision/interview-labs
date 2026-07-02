import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import ScdViz from "./lakehouse/ScdViz.jsx";
import MedallionViz from "./lakehouse/MedallionViz.jsx";
import ModelingProbesViz from "./lakehouse/ModelingProbesViz.jsx";
import { QuickFire } from "../components/QuickFire.jsx";

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
  { id: "modelingdrill", label: "The live modeling exercise", group: "The modeling round" },
  { id: "facttypes", label: "Fact & dimension patterns", group: "The modeling round" },
  { id: "advmodeling", label: "Data Vault, OBT & semantic layer", group: "The modeling round" },
  { id: "dbt", label: "dbt & the transform layer", group: "Transform & evolve" },
  { id: "schemaevolution", label: "Schema evolution, contracts & WAP", group: "Transform & evolve" },
  { id: "gdpr", label: "Privacy & right to be forgotten", group: "Transform & evolve" },
  { id: "iceberginternals", label: "Iceberg internals", group: "Internals" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
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

/* ── The live modeling exercise ───────────────────────────────── */
function ModelingDrill() {
  return (
    <>
      <Lede>
        The modeling round is not a quiz on definitions, it is a live design session. The prompt is
        deliberately vague, "model order data for an e-commerce company," and the whole test is what you do
        in the first ninety seconds: do you interrogate the problem and declare a grain, or do you start
        drawing tables you will have to erase.
      </Lede>

      <Block eyebrow="the first move" title="Weak opening vs strong opening">
        <p className="text-ink-dim leading-relaxed mb-2">
          The fastest way to lose this round is to start naming columns. Watch the difference:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`WEAK candidate (loses the round):
  "Okay, I'll have an orders table with order_id, customer_name,
   product, price, quantity, order_date..."   <- drawing before asking,
                                                  no grain, no questions

STRONG candidate (wins it):
  "Before I model anything, five questions:
     1. business process?   which event are we measuring
     2. grain?              what does ONE fact row mean
     3. sources?            one OLTP db, or many systems
     4. history?            must we see the past-correct state
     5. volumes?            rows/day, cardinality, retention"`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Then commit to a grain <em>out loud</em> before you draw a single box: "I'll model one row per
          order line, so a five-item order is five fact rows." That one sentence is the highest-signal thing
          you say all round.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you drive the ambiguity out of the prompt and pin the grain before touching tables. A
          candidate who declares "one row per order line" up front is already scoring higher than one who
          drew a prettier diagram without it.
        </Callout>
      </Block>

      <Block eyebrow="the worked answer" title="A star at order-line grain">
        <p className="text-ink-dim leading-relaxed mb-2">
          With the grain fixed, the star writes itself: a central transaction fact surrounded by conformed
          dimensions, foreign keys as surrogate keys, the order number carried as a degenerate dimension.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`               dim_date  (role-playing dim; this fact uses order date)
                        |
  dim_customer ---  fct_order_line  --- dim_product
   (SCD2)                |
                   measures + keys

fct_order_line   (grain: one row per order line)
  order_id        <- degenerate dimension (no dim table)
  date_key        -> dim_date
  customer_key    -> dim_customer   (surrogate key, SCD2)
  product_key     -> dim_product
  quantity        (additive)
  unit_price      (per-unit, non-additive on its own)
  discount        (additive)
  extended_amount = quantity * unit_price - discount   (additive)

dim_customer  (SCD2: sk, customer_id, name, city,
               effective_from, effective_to, is_current)
dim_product   (sk, product_id, name, category, ...)
dim_date      (date_key, date, dow, month, is_holiday, ...)`}
        />
        <Callout kind="tip" title="Say why each choice, not just the shape">
          order_id is a degenerate dimension because it has no attributes worth a table. Amounts sit at line
          grain so they stay additive. dim_customer is SCD2 so a moved customer does not rewrite history.
          Narrating the <em>why</em> is what separates a modeler from someone who memorized a diagram.
        </Callout>
      </Block>

      <Try label="probe drill">
        <ModelingProbesViz />
      </Try>

      <Block eyebrow="then they push" title="The escalating probes">
        <p className="text-ink-dim leading-relaxed mb-2">
          Once the star is on the board, the interviewer stress-tests it. The strong answers:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-2 text-sm">
          <li>
            <strong>Returns and cancellations.</strong> Keep the transaction fact additive with
            negative-quantity rows in the same fct_order_line, so revenue nets in every rollup. If returns
            carry their own attributes (reason, condition, restock), split a fct_returns at return-line
            grain. To track the order through its stages, add an accumulating-snapshot fulfillment fact.
          </li>
          <li>
            <strong>Multi-currency.</strong> Store both at fact grain: the transaction amount plus its
            currency code, and a standardized amount converted at load time using the rate at order time.
            Never convert at query time with today's rate.
          </li>
          <li>
            <strong>Customer moves.</strong> dim_customer is SCD2: close the old row, insert a new one with a
            fresh surrogate key. Facts join on the surrogate that was current at order time, so old orders
            keep the old city, a point-in-time join.
          </li>
          <li>
            <strong>Late-arriving dimension (early-arriving fact).</strong> An order line lands before its
            product row exists: load the fact against an unknown-member placeholder now, then backfill or
            re-point when the real dimension arrives. Never drop the fact.
          </li>
          <li>
            <strong>Why not one big table.</strong> OBT is a fine consumption layer but a poor governed core:
            update anomalies, no conformance, expensive rebuilds. Keep the star as the core and generate an
            OBT on top for teams that want a flat read.
          </li>
        </ul>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"You said one row per order line. When would per-order grain be
            right instead?"</strong> When the business only ever reports on whole orders and line detail adds
            nothing. But it is a one-way door: you cannot recover line-level slices later, so I default to the
            finer grain unless volume forces otherwise.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"Where does order status (placed, shipped, delivered) live?"</strong>{" "}
            Not as a mutable column on the transaction fact. Statuses are milestones, so I model an
            accumulating-snapshot fulfillment fact, one row per order with a date key per milestone, updated
            in place as each completes.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"A product gets recategorized. Do past orders move
            categories?"</strong> That is a business policy question I would ask. SCD1 on category re-buckets
            history; SCD2 keeps past orders in the old category. Reporting usually wants SCD2 so last year's
            numbers do not silently change.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"How do you serve this to a team that hates joins?"</strong>{" "}
            Materialize a wide OBT or gold mart from the star, denormalized and pre-joined. The star stays the
            governed source of truth; the flat table is a derived serving layer, not the system of record.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "First I ask five questions, process, grain, sources, history, volumes, then I declare the grain
          out loud: one row per order line. From there it is a star, fct_order_line with the order number as
          a degenerate dimension and surrogate keys to dim_customer (SCD2), dim_product, and dim_date. Returns
          are negative rows, multi-currency stores both raw and standardized amounts, and I keep the star as
          the governed core rather than one big table."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The prompt is vague on purpose, so I open by driving out ambiguity: which business process, what is
          the grain, how many source systems, do we need point-in-time history, and what are the volumes. Then
          I commit to a grain before drawing, one row per order line, because every other choice depends on it.
          The model is a transaction star: fct_order_line holds quantity, unit_price, discount, and a derived
          extended_amount, all at line grain so they stay additive; order_id rides along as a degenerate
          dimension; and I join to dim_customer, dim_product, and dim_date on surrogate keys. dim_customer is
          SCD2 so a customer move closes the old row and inserts a new one, and facts pointing at the surrogate
          get correct point-in-time context. When they push, I keep the fact additive for returns with negative
          rows, add an accumulating-snapshot fact for fulfillment milestones, store both transaction and
          standardized currency amounts, handle late-arriving facts with an unknown member and backfill, and I
          justify the star over one big table on conformance and update anomalies, while offering an OBT as a
          derived serving layer."
        </Callout>
      </Block>
    </>
  );
}

/* ── Fact & dimension patterns ────────────────────────────────── */
function FactTypes() {
  return (
    <>
      <Lede>
        Kimball gives you a small vocabulary that covers almost every modeling situation, and naming the
        right pattern out loud is a strong senior tell. There are exactly three fact-table types and a
        supporting cast of dimension tricks; knowing which one a situation calls for is the whole skill.
      </Lede>

      <Block eyebrow="the three fact types" title="Transaction, periodic snapshot, accumulating snapshot">
        <OpTable
          cols={["Fact type", "Grain & behavior", "", "What to know"]}
          rows={[
            { op: "Transaction", avg: "one row per event", avgTone: "good", why: "The most common and the largest. One row per measurable event (an order line, a click), inserted and never updated. Measures are fully additive. This is your default." },
            { op: "Periodic snapshot", avg: "one row per entity per period", avgTone: "ok", why: "A regular photo, one row per account per day/month, capturing balances and levels. Balances are semi-additive: you can sum across accounts but NOT across time (summing daily balances is nonsense; average or take end-of-period instead)." },
            { op: "Accumulating snapshot", avg: "one row per process instance", avgTone: "ok", why: "One row per pipeline instance (one order's fulfillment), with multiple date keys, and it is UPDATED in place as milestones complete: order_date, ship_date, deliver_date fill in over time. Built for lifecycle and lag analysis." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The order example uses all three: fct_order_line is a transaction fact, a daily inventory or
          account-balance table is a periodic snapshot, and order fulfillment (placed to delivered) is the
          textbook accumulating snapshot with a date key per milestone.
        </p>
        <Callout kind="trap" title="Semi-additive balances are the classic trap">
          On a periodic snapshot, SUM of a balance across time double-counts, an account with 100 dollars for
          three days is not 300 dollars. Balances sum across every dimension except time; over time you take
          the last value or an average. Get this wrong and every trend chart lies.
        </Callout>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you can name the fact type that fits and, for snapshots, whether you know the additivity
          rule. Saying "that is an accumulating snapshot with a date key per milestone" is exactly the phrase
          they are waiting for.
        </Callout>
      </Block>

      <Block eyebrow="the supporting cast" title="Dimension patterns that keep coming up">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-2 text-sm">
          <li>
            <strong>Factless fact.</strong> A fact with no measures, just keys, recording that an event or a
            coverage relationship happened. Event style: student attended class. Coverage style: which
            products were on promotion (so you can find what did <em>not</em> sell). You count rows instead of
            summing a measure.
          </li>
          <li>
            <strong>Degenerate dimension.</strong> A dimension key with no attributes, so it lives right on
            the fact with no dimension table, the order number or invoice number on fct_order_line. It groups
            lines into a transaction without needing its own table.
          </li>
          <li>
            <strong>Junk dimension.</strong> A grab-bag of low-cardinality flags and indicators (is_gift,
            channel, payment_type) consolidated into one small dimension of the observed combinations, instead
            of littering the fact with a dozen boolean columns.
          </li>
          <li>
            <strong>Role-playing dimension.</strong> One physical dimension viewed through several roles, a
            single dim_date joined as order date, ship date, and delivery date via three foreign keys
            (surfaced as views or aliases so each role reads cleanly).
          </li>
          <li>
            <strong>Bridge table.</strong> Resolves a many-to-many between a fact and a dimension (an account
            with several customers, a product in several categories), often carrying an allocation/weighting
            factor so measures can be split without double-counting.
          </li>
          <li>
            <strong>Late-arriving dimension.</strong> The fact arrives before its dimension row: insert an
            inferred placeholder member keyed by the natural key, load the fact now, then Type 2 backdate the
            real attributes when they arrive so history stays correct.
          </li>
        </ul>
        <Callout kind="tip" title="These names are the shorthand of the trade">
          When you say "that is a junk dimension" or "make dim_date role-play," you compress a paragraph of
          explanation into two words the interviewer recognizes instantly. That fluency is the signal the
          round is testing.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"You have order, ship, and delivery dates. Three date dimensions or
            one?"</strong> One physical dim_date, role-played through three foreign keys. I expose it as three
            views or aliases so a query can filter order_date and ship_date independently without three copies
            of the calendar.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"How do you report daily inventory on hand?"</strong> A periodic
            snapshot fact, one row per product per day. On-hand quantity is semi-additive, so I never sum it
            across days; I sum across products and take end-of-day or an average across time.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"Which promotions ran but drove no sales?"</strong> A factless
            coverage fact of promotion-product-day, then a left anti-join against the sales fact. The absence
            of a matching sales row is the answer, which is exactly what factless facts are for.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"A patient has multiple diagnoses on one visit. How do you avoid
            double-counting cost?"</strong> A bridge table between the visit fact and the diagnosis dimension
            with an allocation factor summing to one, so cost splits across diagnoses instead of multiplying by
            the fan-out.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "There are three fact types: transaction (one row per event, additive, the default), periodic
          snapshot (one row per entity per period, balances that are semi-additive so you can't sum across
          time), and accumulating snapshot (one row per process instance, updated as milestones complete, with
          a date key each). Plus dimension patterns, factless facts, degenerate dimensions, junk dims,
          role-playing dims, bridges, and late-arriving dimensions."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I anchor on the three fact types. A transaction fact is one row per event, fully additive, and the
          largest table, my default. A periodic snapshot is a regular photo, one row per account or product
          per period, and its balances are semi-additive, I can sum across accounts but not across time, so I
          take end-of-period or an average. An accumulating snapshot is one row per process instance with
          multiple date keys, updated in place as an order moves from placed to shipped to delivered, ideal for
          lag and lifecycle analysis. Around those I reach for the standard dimension patterns: a degenerate
          dimension for the order number on the fact, a junk dimension to fold a pile of flags into one small
          table, role-playing so a single dim_date serves order, ship, and delivery dates, a bridge table with
          an allocation factor for many-to-many, a factless fact for events or coverage like which promotions
          ran, and the late-arriving-dimension playbook of an inferred member plus a Type 2 backdate. Naming
          the right pattern is half the answer."
        </Callout>
      </Block>
    </>
  );
}

/* ── Data Vault, OBT & semantic layer ─────────────────────────── */
function AdvModeling() {
  return (
    <>
      <Lede>
        Beyond the Kimball star there are three modeling ideas a staff interviewer expects you to place
        correctly: Data Vault for auditable, source-heavy ingestion; One Big Table as a serving shape; and
        the semantic layer that defines a metric once. Each is a tool for a specific layer, not a religion.
      </Lede>

      <Block eyebrow="the auditable core" title="Data Vault 2.0: hubs, links, satellites">
        <p className="text-ink-dim leading-relaxed mb-2">
          Data Vault splits every entity into three insert-only pieces so ingestion is decoupled from
          modeling:
        </p>
        <OpTable
          cols={["Component", "Holds", "", "Purpose"]}
          rows={[
            { op: "Hub", avg: "business keys", avgTone: "good", why: "A distinct list of business keys (customer_id, order_id) with a hash key and load metadata. The stable spine, independent of source." },
            { op: "Link", avg: "relationships", avgTone: "ok", why: "Associations between hubs (this customer placed this order). Many-to-many by default, so new relationships never force a restructure." },
            { op: "Satellite", avg: "attributes + history", avgTone: "ok", why: "Descriptive, time-stamped attributes hanging off a hub or link, insert-only, so every change is a new dated row. This is where history lives." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Because everything is insert-only and hash-keyed, loads are <strong>parallelizable</strong> and
          fully <strong>auditable</strong>, you can prove what any source said at any time. The cost: the
          model is verbose and join-heavy to query, so you serve a Kimball <strong>star on top</strong> of the
          vault for consumption. Reach for it when you have many volatile sources and hard audit requirements
          (finance, healthcare, insurance), not for a two-source startup.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you match the pattern to the situation rather than reciting definitions. The senior answer
          is "Data Vault for auditable multi-source ingestion, star on top for consumption," not "Data Vault
          is better than Kimball."
        </Callout>
      </Block>

      <Block eyebrow="the flat serving shape" title="One Big Table (OBT)">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>One Big Table</strong> denormalizes everything into a single wide table, no joins at read
          time. On a columnar engine that is genuinely fast and analysts love it, so it is a legitimate
          <em> consumption or activation</em> layer, and a reasonable whole-model for a tiny team. As the
          governed core it is weak: attributes repeat across millions of rows so one change is a massive
          rewrite (update anomalies), there is no conformance so every team re-derives revenue differently,
          and each use case rebuilds from scratch. The right move is star (or vault) as the core, OBT
          generated on top as a view or mart.
        </p>
        <Callout kind="trap" title="OBT is a serving choice, not a substitute for modeling">
          "Just flatten it" is fine as the last mile and a trap as the foundation. If you offer OBT, say
          explicitly that the governed model still exists underneath and the flat table is derived from it.
        </Callout>
      </Block>

      <Block eyebrow="define it once" title="The semantic / metrics layer">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>semantic layer</strong> (also metrics layer) is where a metric is defined <em>once</em>,
          in code, and every downstream tool reads that definition, so three dashboards cannot ship three
          different "revenue" numbers. It centralizes the join paths, the grain, and the exact SQL for each
          metric. In practice this is dbt's semantic layer / MetricFlow, Cube, or LookML, and it is the answer
          to the classic complaint that finance and product disagree on the same KPI.
        </p>
        <Callout kind="tip" title="It kills the 'three revenues' problem">
          The value is one source of truth for definitions, not one more storage layer. When metric logic
          lives in the semantic layer, BI tools, notebooks, and embedded apps all compute the same number,
          which is the governance win executives actually feel.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"Would you put Data Vault in a three-person startup?"</strong> No.
            The audit and parallel-load benefits do not pay for the query complexity at that scale. I would run
            a plain Kimball star, or even OBT, until source sprawl and compliance actually demand a vault.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"Where do the star and the vault coexist?"</strong> The vault is the
            raw, auditable integration layer (roughly silver); the star is the consumption layer (gold) built
            from it. Data Vault explicitly expects a dimensional mart on top, they are not competitors.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"A semantic layer sounds like just views. What's the difference?"</strong>{" "}
            Views bind to one engine and one grain; a semantic layer defines metrics with their dimensions,
            join paths, and aggregation rules, then compiles correct SQL per query and per tool. It is metric
            definitions as governed code, not a frozen result set.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"How does OBT interact with SCD2?"</strong> Badly if you are not
            careful, flattening a Type 2 dimension multiplies fact rows by history. I flatten only the
            current-version attributes into the OBT, or snapshot it as-of a date, and keep the SCD2 dimension
            in the governed star for point-in-time queries.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Data Vault is hubs (business keys), links (relationships), and satellites (attributes plus
          history), insert-only, parallel-loadable, and auditable, great for many volatile sources and
          audit-heavy industries, but you serve a star on top because it is expensive to query. One Big Table
          is a fine flat serving layer, weak as the governed core. And a semantic layer defines each metric
          once so three dashboards don't ship three revenues."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "These are three tools for three layers. Data Vault 2.0 decomposes entities into hubs for business
          keys, links for relationships, and satellites for time-stamped attributes and history. Because it is
          insert-only and hash-keyed, loads parallelize and everything is auditable, which is why finance,
          healthcare, and insurance like it with many changing sources, but it is verbose to query so you
          always build a Kimball star on top for consumption. One Big Table is the opposite instinct,
          denormalize into one wide table for join-free reads, which is excellent as a consumption or
          activation layer and fine for a tiny team, but as the governed core it brings update anomalies, no
          conformance, and expensive rebuilds, so I derive it from the star rather than replacing the star. The
          semantic or metrics layer sits above all of it: define revenue, active users, or margin once in code,
          with dbt's semantic layer, Cube, or LookML, and every dashboard and notebook reads that one
          definition, which is how you stop shipping three different numbers for the same KPI."
        </Callout>
      </Block>
    </>
  );
}

/* ── dbt & the transform layer ────────────────────────────────── */
function Dbt() {
  return (
    <>
      <Lede>
        dbt is the T in ELT: it is how SQL transforms became software, with dependencies, tests, docs, and
        version control. It does not process data itself, it compiles SQL and hands it to the warehouse or
        engine to run, which is exactly why it fits the lakehouse gold layer.
      </Lede>

      <Block eyebrow="what it actually is" title="Templated SQL with a dependency DAG">
        <p className="text-ink-dim leading-relaxed mb-2">
          A dbt model is a <code className="font-mono">SELECT</code> in a file. dbt adds <strong>Jinja</strong>{" "}
          templating and, crucially, the <code className="font-mono">ref()</code> function: when model B does{" "}
          <code className="font-mono">ref('A')</code>, dbt learns B depends on A and builds a <strong>DAG</strong>,
          so it runs models in the right order and in parallel. It <strong>compiles and orchestrates</strong>{" "}
          SQL; the engine computes. Via adapters (<code className="font-mono">dbt-redshift</code>,{" "}
          <code className="font-mono">dbt-athena</code>, <code className="font-mono">dbt-spark</code>,{" "}
          <code className="font-mono">dbt-duckdb</code>) the same project targets different backends.
        </p>
        <CodeBlock
          title="sql"
          lang="text"
          code={`-- models/marts/fct_orders.sql
select
    o.order_id,
    o.customer_id,
    o.amount
from {{ ref('stg_orders') }} as o     -- ref() builds the DAG edge
where o.status = 'complete'

-- dbt compiles this to real SQL and runs it ON the warehouse/engine.
-- dbt moves no data itself; it sequences and templates the SQL.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you know dbt does not have a compute engine, it generates SQL that Redshift, Athena, Spark,
          or DuckDB executes. "dbt compiles, the engine computes" is the line that shows you understand where
          it sits.
        </Callout>
      </Block>

      <Block eyebrow="the convention" title="Staging, intermediate, marts">
        <p className="text-ink-dim leading-relaxed mb-2">
          dbt projects follow a layering convention that maps neatly onto the medallion:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Staging</strong>, one model per source table, 1:1, light cleanup (rename, cast, standardize). The only place that touches raw sources.</li>
          <li><strong>Intermediate</strong>, reusable building blocks: joins and reshaping that several marts share, not exposed to BI.</li>
          <li><strong>Marts</strong>, the business-facing facts and dimensions (fct_orders, dim_customer), the gold layer BI reads.</li>
        </ul>
        <Callout kind="tip" title="dbt lives in silver-to-gold, not in heavy compute">
          dbt shines on SQL-shaped transforms, joins, aggregates, dimensional modeling, the silver-to-gold
          hop. Heavy programmatic work (complex ML features, non-SQL parsing, huge shuffles) belongs in a Spark
          job. Knowing that boundary is the senior signal.
        </Callout>
      </Block>

      <Block eyebrow="how models build" title="Materializations & incremental models">
        <OpTable
          cols={["Materialization", "Becomes", "", "Use when"]}
          rows={[
            { op: "view", avg: "a database view", avgTone: "good", why: "No storage, always fresh, recomputed on read. Default for light staging models." },
            { op: "table", avg: "rebuilt each run", avgTone: "ok", why: "Full rebuild every run. Simple and correct, but expensive on large data." },
            { op: "incremental", avg: "appends/merges new rows", avgTone: "ok", why: "Only process new or changed rows since last run, essential at scale, but you own the correctness of the filter." },
            { op: "ephemeral", avg: "inlined as a CTE", avgTone: "good", why: "Not materialized at all, injected into downstream models as a CTE. For small reusable logic." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Incremental models are the powerful, dangerous one. You define <em>is_incremental()</em> logic to
          filter to recent rows and a strategy to apply them, <strong>merge</strong> (upsert on a unique key)
          or <strong>insert_overwrite</strong> (replace whole partitions), and the available strategies are
          adapter-dependent.
        </p>
        <Callout kind="trap" title="Incremental models fail in three well-known ways">
          Late data arriving beyond your lookback window is silently missed. A schema change often forces a
          <code className="font-mono"> --full-refresh</code>. And an unstable unique key duplicates rows. The
          fix is a generous lookback, on_schema_change handling, and periodic full refreshes to self-heal.
        </Callout>
      </Block>

      <Block eyebrow="the software parts" title="Tests, freshness, docs, snapshots">
        <p className="text-ink-dim leading-relaxed mb-2">
          What makes dbt more than a SQL runner is the engineering scaffolding:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Tests</strong>, built-in generic tests (<code className="font-mono">unique</code>, <code className="font-mono">not_null</code>, <code className="font-mono">relationships</code> for referential integrity, <code className="font-mono">accepted_values</code>) declared in YAML, plus <strong>singular tests</strong> that are just a SQL query returning the failing rows.</li>
          <li><strong>Source freshness</strong>, assert a source loaded within its SLA (warn/error thresholds) so stale upstream data fails loudly.</li>
          <li><strong>Docs + lineage</strong>, dbt generates a docs site with a model-level lineage graph (DAG) from the ref() dependencies, self-documenting by construction. Column-level lineage is a dbt Cloud / dbt Explorer feature, not the OSS docs site.</li>
          <li><strong>Snapshots</strong>, dbt snapshots <em>are</em> SCD Type 2: they watch a source table and record dated history rows as values change.</li>
        </ul>
        <Callout kind="note" title="dbt snapshots are SCD2, out of the box">
          If asked "how do you keep history of a mutable source in dbt," the answer is a snapshot, it closes
          the old version and opens a new dated one exactly like a Type 2 dimension, no hand-written MERGE.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"An incremental model missed yesterday's late-arriving orders. Why,
            and how do you fix it?"</strong> My filter only pulled rows newer than the last run, so events
            back-dated into an already-processed window were skipped. I widen the lookback to reprocess a
            trailing window, and run a periodic full refresh to self-heal.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"dbt or a Spark job for this transform?"</strong> If it is SQL-shaped
            (joins, aggregates, dimensional modeling on warehouse-scale data), dbt, for the testing, lineage,
            and version control. If it is heavy programmatic work or a massive shuffle, a Spark job. I place the
            work by its shape, not by preference.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"How do you catch a broken foreign key before it hits gold?"</strong>{" "}
            A <code className="font-mono">relationships</code> test on the fact's foreign key against the
            dimension's primary key, run in CI on every PR, so an orphaned key fails the build instead of
            reaching a dashboard.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"Where does dbt run on AWS?"</strong> dbt-athena or dbt-spark against
            Iceberg tables in the lakehouse, or dbt-redshift against the warehouse. dbt itself is just the
            orchestration and templating layer; EMR, Athena, or Redshift do the compute.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "dbt is templated SQL with a ref() dependency DAG, tests, and docs. It compiles and orchestrates SQL
          but the engine, Redshift, Athena, Spark, DuckDB via adapters, does the compute. Projects layer as
          staging, intermediate, marts; materializations are view, table, incremental, and ephemeral; and dbt
          snapshots are SCD2. It owns the silver-to-gold, SQL-shaped transforms; heavy programmatic work stays
          in Spark."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "dbt turned SQL transforms into software. A model is a SELECT in a file; ref() wires models into a
          DAG so dbt runs them in dependency order and in parallel, and Jinja templates the SQL. Critically dbt
          has no engine of its own, adapters push compiled SQL down to Redshift, Athena, Spark, or DuckDB, so
          dbt compiles and the warehouse computes. Projects follow staging (1:1 with sources), intermediate
          (shared building blocks), and marts (the facts and dims BI reads), which maps onto silver-to-gold.
          Materializations control how a model builds: view, table, incremental, or ephemeral, and incremental
          is the one to handle carefully because late data beyond the lookback is silently missed, schema
          changes can force a full refresh, and the merge versus insert_overwrite strategy is adapter-specific.
          The software scaffolding is the point: generic tests like unique, not_null, relationships, and
          accepted_values plus singular SQL tests, source-freshness SLAs, an auto-generated lineage graph, and
          snapshots that implement SCD2 for free. I use dbt for SQL-shaped silver-to-gold work and drop to a
          Spark job when the transform is heavy or non-SQL."
        </Callout>
      </Block>
    </>
  );
}

/* ── Schema evolution, contracts & WAP ────────────────────────── */
function SchemaEvolution() {
  return (
    <>
      <Lede>
        Schemas change, and the question is whether a change breaks the people reading your data. Getting
        compatibility right, enforcing it at the boundary, and using Write-Audit-Publish to gate bad batches
        is what keeps a producer's Tuesday deploy from silently corrupting the BI layer.
      </Lede>

      <Block eyebrow="the compatibility modes" title="Backward, forward, full, done right">
        <p className="text-ink-dim leading-relaxed mb-2">
          The words are easy to swap by accident, so pin them to <em>who reads what</em>:
        </p>
        <OpTable
          cols={["Mode", "Guarantees", "", "Safe change / upgrade order"]}
          rows={[
            { op: "Backward", avg: "new reader reads OLD data", avgTone: "good", why: "Consumers on the new schema can still read data written with the old one. Safe: add an optional/defaulted field, drop a field. Upgrade consumers first. The most common default." },
            { op: "Forward", avg: "old reader reads NEW data", avgTone: "ok", why: "Consumers still on the old schema can read data written with the new one. Safe: add a field, drop an optional field. Upgrade producers first." },
            { op: "Full", avg: "both directions", avgTone: "good", why: "Backward AND forward. Only add or remove optional fields that have defaults. The strictest and safest, order of upgrades no longer matters." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you can state backward vs forward without hedging, and connect the mode to who upgrades
          first. "Backward means consumers on the new schema read old data, so I upgrade consumers first" is
          the crisp signal.
        </Callout>
      </Block>

      <Block eyebrow="where it is enforced" title="Registry, ingest, and CI">
        <p className="text-ink-dim leading-relaxed mb-2">
          Compatibility is only real if something checks it before bad data lands:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Schema registry at produce time</strong>, Confluent or AWS Glue Schema Registry validates every message against the registered schema and the configured compatibility mode, rejecting an incompatible producer before it publishes.</li>
          <li><strong>Validation at ingest</strong>, the pipeline checks incoming batches against the expected schema and routes violations away rather than loading them.</li>
          <li><strong>Contract in CI</strong>, the data contract is a versioned artifact, and a producer's schema change runs compatibility checks in the pull request, so a breaking change fails the build, not production.</li>
          <li><strong>Evolution inside the table format</strong>, Iceberg tracks columns by a stable <strong>field ID</strong>, not by name or position, so add, rename, drop, reorder, and type-widen are metadata-only and safe. Incompatible narrowing means a new column or a rewrite.</li>
        </ul>
        <Callout kind="tip" title="Iceberg's field IDs are why rename is free">
          Because a column has an immutable ID, renaming it is a metadata edit, old files still map correctly.
          That is a genuine advantage over Hive-style tables where a rename or reorder could silently misread
          data.
        </Callout>
      </Block>

      <Block eyebrow="catching bad rows" title="DLQ / quarantine and the reason column">
        <p className="text-ink-dim leading-relaxed mb-2">
          When a row fails validation you do not drop it and you do not let it through. You route it to a{" "}
          <strong>dead-letter / quarantine</strong> table with a <strong>reason column</strong> explaining
          why it failed, alert on the volume, fix the upstream cause or the parsing, then <strong>replay</strong>{" "}
          the corrected rows. Bad data is contained and recoverable, never silently lost.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`validate batch:
  good rows  -> silver table
  bad rows   -> quarantine table  (payload + reason + ingest_ts + source)
                     |
             alert on volume -> fix upstream / parser -> REPLAY corrected rows

never: drop the bad rows (data loss) OR pass them through (poison silver).`}
        />
      </Block>

      <Block eyebrow="the modern gate" title="Write-Audit-Publish (WAP)">
        <p className="text-ink-dim leading-relaxed mb-2">
          WAP is the current best answer to "how do you stop a bad batch reaching BI." You{" "}
          <strong>write</strong> the new data to a staging branch or an unpublished snapshot, <strong>audit</strong>{" "}
          it with quality checks (row counts, nulls, referential integrity, business rules), and only on green
          do you <strong>publish</strong> with an atomic commit so readers flip from old to new in one step,
          never seeing a half-written table. <strong>Iceberg branches</strong> make this clean: write to a
          branch, run checks against it, then fast-forward the main ref, or discard the branch if it fails.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`WRITE   -> stage the batch on an Iceberg branch (not visible to readers)
AUDIT   -> run quality checks against the branch
              counts, null rates, PK uniqueness, FK integrity, business rules
PUBLISH -> checks pass  -> atomic fast-forward of main  (readers flip at once)
           checks fail   -> discard the branch          (BI never saw it)`}
        />
        <Callout kind="trap" title="Without WAP, readers see partial or bad state">
          Writing straight to the live table means a failed job leaves half a batch visible and a bad batch
          poisons dashboards until someone notices. WAP plus atomic publish makes the change all-or-nothing and
          auditable before anyone downstream is exposed.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"A producer needs to add a required field. Is that backward
            compatible?"</strong> No, a new required field breaks readers of old data that lacks it. I make it
            optional with a default (backward compatible), backfill, then tighten later, or I version the schema
            and migrate consumers deliberately.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"Consumer teams keep breaking when the source changes. What do you
            put in place?"</strong> A versioned data contract with a named owner and an SLA, enforced by a
            schema registry and CI compatibility checks, so a breaking change fails the producer's pull request
            instead of silently reaching downstream.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"How is WAP different from just running tests after the load?"</strong>{" "}
            Timing and visibility. WAP audits <em>before</em> the data is published, so readers never see a bad
            batch. Tests after a live load catch the problem only once it is already exposed to BI.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"Do quarantined rows ever come back?"</strong> Yes, that is the point.
            The reason column tells you what to fix; once the parser or upstream is corrected I replay the
            quarantine table through the same validation, so nothing is permanently lost.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Backward means consumers on the new schema can read old data, so I add optional or defaulted fields
          and upgrade consumers first; forward means old consumers read new data; full is both. I enforce it at
          a schema registry, at ingest, and in CI. Iceberg evolves by field ID so rename and widen are
          metadata-safe. Bad rows go to a quarantine table with a reason and get replayed. And I gate batches
          with Write-Audit-Publish on an Iceberg branch so nothing bad reaches BI."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I frame schema evolution by who reads what. Backward compatibility means a consumer on the new
          schema can still read data written with the old one, whose safe changes are adding optional or
          defaulted fields and dropping fields, and you upgrade consumers first, that is the usual default.
          Forward means old consumers can read new data, so producers can upgrade first. Full is both directions
          and only allows adding or removing optional fields with defaults. That is enforced in three places: a
          schema registry like Confluent or Glue at produce time, validation at ingest, and compatibility checks
          in CI on the data contract, which is a versioned artifact with an owner and an SLA so breaking changes
          fail fast. Inside the table, Iceberg tracks columns by immutable field IDs, so add, drop, rename,
          reorder, and type-widen are metadata-only; truly incompatible changes mean a new column or a rewrite.
          Operationally I quarantine failing rows to a dead-letter table with a reason column, alert, and replay
          after fixing, and I gate whole batches with Write-Audit-Publish: write to an Iceberg branch, audit it
          with quality checks, and atomically publish only on green, or discard the branch, so a bad batch never
          reaches the BI layer."
        </Callout>
      </Block>
    </>
  );
}

/* ── Privacy & right to be forgotten ──────────────────────────── */
function Gdpr() {
  return (
    <>
      <Lede>
        The GDPR/CCPA "right to be forgotten" collides head-on with how a lakehouse works, and the collision
        is the interview. A DELETE does not actually erase anyone, because time travel, snapshots, backups,
        dead-letter queues, and logs all still hold the data. Knowing the real erasure pipeline is the signal.
      </Lede>

      <Block eyebrow="the trap" title="A DELETE does not delete">
        <p className="text-ink-dim leading-relaxed mb-2">
          On an Iceberg or Delta table, a row-level <code className="font-mono">DELETE</code> just writes a new
          snapshot that no longer references the row. The data is <strong>still physically present</strong>,
          reachable by <strong>time travel</strong> to an older snapshot, until those snapshots expire and the
          files are rewritten. And even then it commonly survives in <strong>backups, dead-letter queues, raw
          bronze, and application logs</strong>. Answering "I'd run a DELETE" is the wrong answer.
        </p>
        <Callout kind="trap" title="Time travel is a compliance liability here">
          The same snapshots that make audits and rollback wonderful mean a deleted user is one
          <code className="font-mono"> AS OF</code> query away from resurrection. Erasure is not a single DELETE,
          it is a pipeline that ends with the data being physically unrecoverable.
        </Callout>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you know that logical deletion is not physical deletion in an immutable, snapshotted store,
          and can name the full path to actual erasure. Candidates who stop at "DELETE the row" miss the point.
        </Callout>
      </Block>

      <Block eyebrow="the real pipeline" title="Hard delete, end to end">
        <p className="text-ink-dim leading-relaxed mb-2">
          Physically erasing a user from a table format is a sequence, and you should be able to recite it:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`1. DELETE the rows            -> new snapshot no longer references them
2. compaction / rewrite       -> rewrite_data_files rewrites the affected
                                 files WITHOUT the deleted rows
3. expire_snapshots           -> drop old snapshots that still point at the
                                 old files (this removes time-travel access)
4. remove_orphan_files        -> physically delete the now-unreferenced files
   -> only now is the data actually gone from the table

then also: purge from backups, DLQs, bronze, and logs (out-of-table copies)`}
        />
        <Callout kind="tip" title="Erasure has an SLA, so batch it">
          Regulations give you days, not milliseconds, so most teams collect erasure requests and run the
          rewrite-and-expire pipeline on a schedule. The key point in the interview is that expiring snapshots
          and rewriting files is a required step, not an optional cleanup.
        </Callout>
      </Block>

      <Block eyebrow="the design-time answers" title="Crypto-shredding & tokenization">
        <p className="text-ink-dim leading-relaxed mb-2">
          For immutable or archival stores where rewriting files is impractical, you design erasure in from the
          start:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-2 text-sm">
          <li>
            <strong>Crypto-shredding.</strong> Encrypt each user's data with a per-user key. To "forget" them
            you delete the key, and the ciphertext, wherever it lives including backups, becomes permanently
            unreadable. This is the standard answer for immutable and archival data you cannot rewrite.
          </li>
          <li>
            <strong>Tokenization at ingest.</strong> Replace PII with tokens at the door and keep the real
            values in a separate <strong>PII vault</strong>. Everything downstream stores only tokens, so
            erasure becomes a single delete in the vault, no hunting across a hundred tables.
          </li>
        </ul>
        <Callout kind="note" title="Design erasure in, do not bolt it on">
          Crypto-shredding and tokenization turn "find and rewrite every copy" into "delete one key" or "delete
          one vault row." That is the difference between a compliant platform and a frantic quarterly
          fire-drill.
        </Callout>
      </Block>

      <Block eyebrow="the surrounding policy" title="PII zoning, retention, and DSARs">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-2 text-sm">
          <li>
            <strong>PII zoning across the medallion.</strong> Bronze holds raw PII and is locked down hardest
            (tight access, encryption, short retention); by silver, PII is masked, tokenized, or dropped so most
            analysts work on de-identified data.
          </li>
          <li>
            <strong>Retention policies as code.</strong> Expiry rules live in the pipeline, not in someone's
            head, so old raw data and expired snapshots are dropped on schedule automatically.
          </li>
          <li>
            <strong>DSAR practicality.</strong> A Data Subject Access Request ("give me everything you hold on
            me") is only tractable if you planned the layout: partition or index by a user key, or route
            everything through the tokenization vault, so you can actually find all of a person's data.
          </li>
        </ul>
        <Callout kind="tip" title="DSAR is a data-layout decision made months early">
          "Find all data for one user" is easy if you keyed for it and miserable if you did not. Designing the
          partitioning, indexing, or vault lookup up front is what makes both access and erasure requests
          feasible.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"You deleted the user's rows. Are you compliant?"</strong> Not yet.
            The rows are still reachable by time travel until I compact the files and expire the snapshots that
            reference them, and I still have to purge backups, DLQs, and logs. DELETE is step one of four.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"Backups are immutable, you cannot rewrite them. Now what?"</strong>{" "}
            Crypto-shredding. If each user's data was encrypted with a per-user key, deleting that key renders
            their ciphertext in the immutable backup permanently unreadable without touching the backup.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"How do you find every table that holds a given user?"</strong> I plan
            for it: route PII through a tokenization vault so the token maps back to one place, and key or index
            datasets by the user identifier. Then a DSAR is a lookup, not a full-lake scan.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"Doesn't erasure conflict with keeping audit history?"</strong> You
            reconcile them: crypto-shred or tokenize so the record structure and aggregates survive while the
            personal data becomes unreadable, and keep legally-required retention explicitly carved out of the
            erasure policy.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "The trap is that a DELETE does not erase anyone, time travel, snapshots, backups, DLQs, and logs
          still hold the data. Real erasure is DELETE, then compact and rewrite the files, then expire
          snapshots, then remove orphan files, plus purging out-of-table copies. For immutable stores I
          crypto-shred, delete the per-user key and the ciphertext is dead, and I tokenize PII into a vault at
          ingest so erasure is one delete. Bronze is locked down, silver is masked, retention is code."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Right to be forgotten fights the lakehouse's own strengths. A row-level DELETE on Iceberg or Delta
          just writes a snapshot that omits the row; the bytes remain and are reachable by time travel until the
          snapshots expire, and copies also live in backups, dead-letter queues, raw bronze, and logs. So hard
          deletion is a pipeline: delete the rows, run compaction to rewrite the affected files without them,
          expire the old snapshots so time travel can no longer reach them, remove the now-orphaned files, and
          separately purge the out-of-table copies. Because that is heavy and impossible on immutable stores, I
          prefer to design erasure in: crypto-shredding encrypts each user's data with a per-user key so
          deleting the key makes their data, even in backups, permanently unreadable; and tokenization at ingest
          keeps PII in a vault with only tokens downstream, so erasure is a single vault delete. Around that I
          zone PII, bronze locked down and encrypted, silver masked or tokenized, enforce retention as code, and
          plan the data layout, partitioning or indexing by user key, so a DSAR to find or delete everyone's
          data is actually feasible."
        </Callout>
      </Block>
    </>
  );
}

/* ── Iceberg internals ────────────────────────────────────────── */
function IcebergInternals() {
  return (
    <>
      <Lede>
        Under the SQL, Iceberg is a tree of metadata files over immutable Parquet, and understanding that
        tree explains everything: how a commit is atomic, how a query prunes files it never reads, and why
        maintenance jobs exist. This is the topic that separates "I've used Iceberg" from "I know Iceberg."
      </Lede>

      <Block eyebrow="the metadata tree" title="From catalog pointer to data files">
        <p className="text-ink-dim leading-relaxed mb-2">
          A read walks a layered tree, and pruning happens at every level using stored statistics, so a
          selective query opens only a handful of the data files:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`catalog  ->  points at the CURRENT metadata.json  (the atomic pointer)
   |
metadata.json  ->  schema, partition specs, snapshot history,
   |               and the current snapshot id
current snapshot
   |
manifest list  ->  the manifests for this snapshot,
   |               with per-manifest partition ranges (prune whole manifests)
manifests  ->  list of data files, each with column-level stats
   |            (min/max, null counts, row counts)  -> prune whole files
data files (Parquet)  ->  the actual rows

query planning: use stats at manifest + file level to SKIP files whose
min/max cannot match the predicate -> read only what's needed.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you can trace the tree and explain that column stats in the manifests drive file pruning.
          "The manifests carry min/max per file so the engine skips files that can't match" is the line that
          shows real understanding.
        </Callout>
      </Block>

      <Block eyebrow="how a write commits" title="Optimistic concurrency via the catalog">
        <p className="text-ink-dim leading-relaxed mb-2">
          A commit is <strong>optimistic concurrency</strong>: a writer builds new metadata (new data files,
          manifests, a new metadata.json) off to the side, then asks the <strong>catalog</strong> to atomically
          swap the current pointer from the old metadata to the new, only if it still points where the writer
          started. If a concurrent writer got there first, the swap fails and the writer <strong>retries</strong>{" "}
          on top of the winner's snapshot. There is no lock; the atomic pointer-swap is the whole mechanism.
        </p>
        <Callout kind="tip" title="This is why the catalog matters">
          Iceberg's atomicity comes from the catalog providing one atomic compare-and-swap on the table pointer
          (Glue, a REST catalog, Nessie, Hadoop). The data files are just immutable Parquet; correctness lives
          in that single atomic swap, which is why a serious catalog is not optional.
        </Callout>
      </Block>

      <Block eyebrow="updates without rewriting everything" title="Merge-on-read delete files">
        <p className="text-ink-dim leading-relaxed mb-2">
          Rather than rewrite a whole data file to change a few rows (copy-on-write), Iceberg can write small{" "}
          <strong>delete files</strong> and merge them at read time (merge-on-read):
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Position deletes</strong>, mark "file X, row 12" as deleted. Cheap to write, precise.</li>
          <li><strong>Equality deletes</strong>, mark "rows where id = 42" as deleted. Great for CDC, but costlier to apply at read time.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed mb-2">
          MoR makes writes cheap but reads pay a merge cost, and delete files accumulate, so{" "}
          <strong>compaction rewrites them away</strong>, folding deletes into fresh data files. The neighbors:{" "}
          <strong>Hudi</strong> offers copy-on-write vs merge-on-read tables explicitly, and <strong>Delta</strong>{" "}
          uses <strong>deletion vectors</strong> (a bitmap of deleted row positions) as its merge-on-read
          equivalent.
        </p>
        <Callout kind="trap" title="Merge-on-read trades write cost for read cost">
          Lots of small delete files make reads slow because every scan merges them. If a MoR table degrades,
          the fix is compaction to collapse the deletes, exactly the small-files story, now for delete files.
        </Callout>
      </Block>

      <Block eyebrow="partitioning as metadata" title="Hidden partitioning & partition evolution">
        <p className="text-ink-dim leading-relaxed mb-2">
          Iceberg partitions by a <strong>transform</strong> of a column, <code className="font-mono">days(ts)</code>,{" "}
          <code className="font-mono">bucket(16, id)</code>, <code className="font-mono">truncate(10, name)</code>,
          stored in the partition spec as metadata. Because the engine knows the transform, a query filtering{" "}
          <code className="font-mono">ts</code> gets pruned to the right partitions <strong>without a literal
          partition column in the SQL</strong>, and users cannot forget to filter the partition key.{" "}
          <strong>Partition evolution</strong> changes the spec going forward: the new spec applies to{" "}
          <em>new</em> files only, old data keeps its old layout, and no rewrite is required.
        </p>
        <Callout kind="tip" title="This kills two classic Hive foot-guns">
          No more deriving and writing a dt column by hand, and no more full rewrite to repartition a table.
          Hidden partitioning plus partition evolution is the concrete reason Iceberg is the AWS-favored open
          format.
        </Callout>
      </Block>

      <Block eyebrow="operating the table" title="Maintenance, branches, and the catalog world">
        <p className="text-ink-dim leading-relaxed mb-2">
          A healthy Iceberg table needs scheduled maintenance, and modern setups add branching and managed
          catalogs:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>rewrite_data_files</strong>, compaction: combine small files into right-sized ones, the number-one performance fix.</li>
          <li><strong>expire_snapshots</strong>, drop old snapshots to bound metadata and enable physical deletion (and, as seen, GDPR erasure).</li>
          <li><strong>remove_orphan_files</strong>, delete files no snapshot references, to reclaim storage.</li>
          <li><strong>rewrite_manifests</strong>, rebalance the manifest layer so planning stays fast.</li>
          <li><strong>Branches &amp; tags</strong>, named refs to snapshots. Branches are the Write-Audit-Publish mechanism (stage on a branch, audit, fast-forward main); tags pin a snapshot for reproducibility or audit.</li>
        </ul>
        <Callout kind="note" title="REST catalog and Amazon S3 Tables">
          The <strong>Iceberg REST catalog</strong> is a standard API so any engine talks to any catalog the
          same way. And <strong>Amazon S3 Tables</strong> is managed Iceberg, S3 stores the table as a
          first-class resource and runs compaction and snapshot expiry <em>for</em> you, which is where the
          AWS lakehouse is heading.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"Two Spark jobs write the same Iceberg table at once. What
            happens?"</strong> Both stage new metadata; the first to compare-and-swap the catalog pointer wins.
            The second's swap fails on the stale pointer, so it retries on top of the new snapshot. No lock, just
            optimistic concurrency at the catalog.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"A query filters on ts but the table is partitioned by days(ts). Does
            it prune?"</strong> Yes, that is the point of hidden partitioning. The spec records the days(ts)
            transform, so the planner prunes to the matching day partitions without a literal partition column in
            the SQL.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"Reads on a CDC table got slow. Why?"</strong> Equality delete files
            from the CDC upserts are piling up, and every scan merges them at read time. Compaction with
            rewrite_data_files folds the deletes into fresh files and restores read speed.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong className="text-ink">"You changed the partition spec. Do old files get rewritten?"</strong>{" "}
            No. Partition evolution applies the new spec to new writes only; existing files keep their old spec
            and are read correctly. You rewrite old data only if you explicitly choose to.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Iceberg is a metadata tree: catalog pointer, metadata.json, snapshot, manifest list, manifests with
          per-file min/max stats, then Parquet, and those stats prune files. A commit is optimistic concurrency,
          the catalog atomically swaps the pointer and conflicts retry. Merge-on-read writes position or equality
          delete files that compaction later folds away. Hidden partitioning prunes by a transform without a
          partition predicate, and partition evolution applies to new files only. Maintenance is compaction,
          expire_snapshots, remove_orphan_files, and rewrite_manifests, and branches drive WAP."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Iceberg layers metadata over immutable Parquet. The catalog points at the current metadata.json,
          which names the current snapshot; the snapshot points at a manifest list, which points at manifests,
          which list the data files with column-level min/max, null, and row-count stats. Query planning uses
          those stats at the manifest and file level to skip files that cannot match, so a selective query reads
          only a few. A write is optimistic concurrency: the writer builds new metadata and asks the catalog to
          atomically compare-and-swap the table pointer; if another writer won, it retries on the new snapshot,
          which is exactly why a real catalog, Glue, a REST catalog, or Nessie, provides the atomicity. For
          updates, merge-on-read writes delete files, position deletes by file-and-row or equality deletes by
          predicate for CDC, and reads merge them until compaction rewrites them away; Hudi exposes copy-on-write
          versus merge-on-read directly and Delta uses deletion vectors for the same idea. Partitioning is hidden:
          you partition by a transform like days(ts) or bucket(16, id) stored as metadata, so queries prune
          without a partition column in the SQL, and partition evolution changes the spec for new files only.
          Operationally I run rewrite_data_files, expire_snapshots, remove_orphan_files, and rewrite_manifests,
          use branches and tags for Write-Audit-Publish and reproducibility, and increasingly let the Iceberg
          REST catalog or Amazon S3 Tables manage catalog and maintenance for me."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire, self-test deck ───────────────────────────────── */
const DECK = [
  { q: "In one line, lake vs lakehouse?", a: "A lake is cheap schema-on-read files on object storage with no guarantees; a lakehouse adds an open table format and a catalog on top so you get ACID, time travel, and schema evolution on those same cheap files.", tag: "lake vs lakehouse" },
  { q: "Iceberg vs Delta vs Hudi, when each?", a: "Iceberg is the engine-neutral, AWS-favored default with hidden partitioning and partition evolution; Delta is the natural pick in Databricks with great Spark support; Hudi specializes in record-level upserts and CDC. Mostly pick by ecosystem.", tag: "table formats" },
  { q: "Define 'grain.'", a: "The grain is exactly what one fact row represents, one order line, one daily balance, one shipment. You declare it before choosing measures or dimensions, and you never mix grains in one fact table.", tag: "modeling" },
  { q: "Walk me through an SCD Type 2 change.", a: "Close the current row (set effective_to, is_current = false) and insert a new row with a fresh surrogate key, the new value, a new effective_from, and is_current = true. Facts join on the surrogate key, so history stays point-in-time correct.", tag: "SCD2" },
  { q: "Name the three fact types.", a: "Transaction (one row per event, additive), periodic snapshot (one row per entity per period, semi-additive balances you can't sum across time), and accumulating snapshot (one row per process instance, updated as milestones complete, multiple date keys).", tag: "fact types" },
  { q: "Backward vs forward compatibility?", a: "Backward: a consumer on the new schema can read old data, so add optional/defaulted fields and upgrade consumers first. Forward: an old consumer can read new data, so upgrade producers first. Full is both.", tag: "schema evolution" },
  { q: "What is Write-Audit-Publish?", a: "Write a batch to a staging branch or unpublished snapshot, audit it with quality checks, and only on green atomically publish so readers flip at once, or discard it. Iceberg branches make it the modern way to stop a bad batch reaching BI.", tag: "WAP" },
  { q: "Position deletes vs equality deletes?", a: "Merge-on-read delete files. Position deletes mark 'file X, row 12'; equality deletes mark 'rows where id = 42' (handy for CDC but costlier at read time). Compaction folds both back into data files.", tag: "MoR deletes" },
  { q: "How do you keep SCD2 history in dbt?", a: "A dbt snapshot. It is SCD Type 2 out of the box, watching a source and recording dated history rows as values change, no hand-written MERGE.", tag: "dbt" },
  { q: "How do you erase a user from immutable backups?", a: "Crypto-shredding: encrypt each user's data with a per-user key, then delete the key. The ciphertext, even in immutable backups, becomes permanently unreadable without touching the backup.", tag: "right to be forgotten" },
  { q: "What are the medallion layers?", a: "Bronze is raw, append-only, immutable landing; silver is cleaned, conformed, deduped, and validated; gold is business aggregates and star-schema marts. Bronze immutability is what makes silver and gold reprocessable.", tag: "medallion" },
  { q: "What does a watermark do in streaming?", a: "It sets how long to wait for late, out-of-order events by event time, then finalizes the window and drops its state. It bounds state and decides how late is too late.", tag: "streaming" },
  { q: "Why is a CDC MERGE idempotent?", a: "You reduce each batch to the latest version per key (by sequence or commit time) and MERGE with an 'only if newer' guard, so replaying the same batch is a no-op. At-least-once delivery plus that MERGE is effectively exactly-once.", tag: "CDC / MERGE" },
  { q: "Star vs snowflake schema?", a: "Star keeps dimensions denormalized for one-hop joins and fast aggregation; snowflake normalizes them into sub-tables, saving a little storage for more joins. For analytics, star usually wins.", tag: "modeling" },
  { q: "Why surrogate keys instead of natural keys?", a: "They decouple the warehouse from source systems, make joins fast, and let one business entity have multiple rows over time, which is exactly what SCD Type 2 needs.", tag: "keys" },
  { q: "What are hubs, links, and satellites?", a: "Data Vault's three pieces: hubs hold business keys, links hold relationships, satellites hold time-stamped attributes and history. All insert-only and parallel-loadable for auditability, with a star served on top for queries.", tag: "Data Vault" },
  { q: "When is One Big Table the right call?", a: "As a consumption or activation layer, or for a tiny team, where a fast join-free read matters. It is weak as the governed core because of update anomalies and no conformance, so derive it from a star.", tag: "OBT" },
  { q: "How does hidden partitioning help?", a: "You partition by a transform like days(ts) stored as metadata, so a query filtering ts gets pruned without a literal partition column in the SQL, and partition evolution changes the scheme for new files only, no rewrite.", tag: "Iceberg" },
  { q: "What problem does a semantic layer solve?", a: "It defines each metric once in code (dbt semantic layer, Cube, LookML) so every dashboard and notebook computes the same number, killing the 'three dashboards, three revenues' problem.", tag: "semantic layer" },
  { q: "Log-based CDC vs polling?", a: "Log-based CDC reads the database's binlog/WAL via DMS or Debezium, catching deletes and every intermediate change with low source load. Polling 'updated_at > last_run' misses hard deletes and hammers the source.", tag: "CDC" },
];

function QuickFireDeck() {
  return (
    <>
      <Lede>
        This deck spans the whole tool, lake vs lakehouse, the table formats, modeling, SCD, streaming, CDC,
        dbt, schema evolution, privacy, and Iceberg internals. The rep is simple: read the question, answer
        it OUT LOUD as if the interviewer just asked, then reveal and grade yourself honestly.
      </Lede>

      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
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
  modelingdrill: <ModelingDrill />,
  facttypes: <FactTypes />,
  advmodeling: <AdvModeling />,
  dbt: <Dbt />,
  schemaevolution: <SchemaEvolution />,
  gdpr: <Gdpr />,
  iceberginternals: <IcebergInternals />,
  quickfire: <QuickFireDeck />,
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
