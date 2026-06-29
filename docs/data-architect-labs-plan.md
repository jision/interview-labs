# Data Architect track, plan

A third track in Interview Labs, alongside DSA and AI Architect. Target role: senior /
staff **Data Architect / Data Engineer** centered on **AWS EMR + Apache Spark** and the
surrounding data platform. Same conventions as the other tracks: Vite + React + Tailwind v4,
HashRouter, hand-authored fixtures only (no model, no network), one combined hub with a third
labeled row.

## Tools (5)

| Tool | Slug | Role | Accent |
|------|------|------|--------|
| Spark - LAB | `spark-lab` | Engine internals, the WHAT | `#ff8a3d` |
| Cloud Data Stack | `cloud-stack` | The platform, the HOW | `#4d9fff` |
| Lakehouse & Modeling | `lakehouse` | The data, modeling & lakehouse | `#2ee6a8` |
| The Data Architect's Bench | `data-architect-bench` | Systems & judgment, SHOULD WE | `#f25f9c` |
| Data Foundations | `data-foundations` | CS bedrock, the BEDROCK | `#b388ff` |

## Topic coverage

- **Spark - LAB**: RDD/DataFrame/Dataset, lazy eval, driver/executors/jobs-stages-tasks,
  partitioning, the shuffle, join strategies, skew & spill, caching, Catalyst/Tungsten/AQE.
- **Cloud Data Stack**: EMR architecture & node roles, EMR on EC2/EKS/Serverless, YARN &
  spot & managed scaling, S3 as the lake (EMRFS vs HDFS), Parquet/ORC/Avro & columnar,
  partitioning/compression/small files, Glue Data Catalog, Athena/Redshift/Spectrum,
  Kinesis/MSK ingestion, Airflow(MWAA)/Step Functions.
- **Lakehouse & Modeling**: lake vs warehouse vs lakehouse, Iceberg/Delta/Hudi,
  medallion, dimensional modeling, slowly changing dimensions, normalize vs denormalize,
  batch vs streaming + Structured Streaming, CDC/upserts/MERGE, data quality & contracts.
- **Data Architect's Bench**: batch/streaming/Lambda/Kappa, ingestion design, idempotency &
  backfills, cluster sizing, cost optimization, file layout, EMR vs Glue vs Databricks vs
  Snowflake, governance/lineage/Lake Formation, the numbers to know.
- **Data Foundations**: SQL joins & query plans, window functions, index/partition tuning,
  CAP & consistency & replication, partitioning/sharding/hashing, MapReduce & why Spark,
  columnar storage & encoding, compression & file sizing.

## Interactive widgets (12)

- Spark: partition/shuffle (narrow vs wide), join-strategy selector (broadcast threshold),
  skew + salting (straggler task).
- Cloud: columnar scan (row vs Parquet, bytes scanned), partition pruning (date filter).
- Lakehouse: SCD type explorer (Type 1/2/3), medallion flow (bronze/silver/gold).
- Bench: cluster sizing, pipeline cost (format savings), batch-vs-streaming decoder.
- Foundations: window-function explorer, CAP-under-partition (CP vs AP).

All widgets are hand-authored illustrations: no data leaves the browser.
