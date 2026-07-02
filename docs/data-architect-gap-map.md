# Gap Map: Data Architect Interview-Prep Site (AWS EMR + Spark)

Synthesized from 5 per-tool reviews + 3 landscape research reports. Deduplicated; tiering = reviewer priority × landscape frequency. Notably deduped out: Lambda/Kappa (flagged as missing in Lakehouse but already covered in Bench), DMS basics (covered conceptually in Lakehouse), service-limit numbers (folded into the streaming item below).

---

## TIER 1 — Close before any interview (highest conviction, offer-deciding)

| # | Gap | Why | Where it lives | Effort |
|---|-----|-----|----------------|--------|
| 1 | **Spark memory model + OOM/Spark UI debugging playbook** | Flagged high by SparkLab, Bench, and CloudStack reviewers independently; landscape calls OOM triage "the #1 senior scenario" and UI-reading its own high-frequency theme. Covers unified memory, memoryOverhead vs heap, driver-vs-executor-vs-YARN-kill bifurcation, spill metrics, max-vs-median task triage. *Build:* two new topics ("when Spark runs out of memory", "reading the Spark UI") plus a symptom→diagnosis→fix drill. | Spark LAB | M |
| 2 | **Live SQL coding practice set** | DataFoundations reviewer's top gap; landscape rates the SQL screen "near-universal and most predictable" with a named canon (gaps-and-islands, sessionization, top-N, dedup, recursive CTEs, SCD2 builds) plus NULL-trap tie-breakers. Zero worked problems exist in the track. *Build:* 10-12 worked problems with schema, expected output, solution, and the "now at 1B rows" follow-up. | Data Foundations (or new "SQL Gym" tool) | L |
| 3 | **End-to-end design case studies + repeatable answer framework** | All 5 reviewers flag zero end-to-end walkthroughs; landscape says the big-data design round is the senior/staff loop-decider. *Build:* 3-4 cases (clickstream lakehouse, CDC replication, metrics platform) run through requirements → volume math → ingest → store → process → serve → operate, plus the drilled framework skeleton. | Data Architect's Bench | L |
| 4 | **Live dimensional-modeling exercise + missing Kimball vocabulary** | Lakehouse reviewer's top 4 gaps (worked star schema, fact-table types, bridge/junk/degenerate/late-arriving dims, OBT-vs-star debate) all land in the landscape's high-frequency modeling round ("often the deciding round"). *Build:* one worked e-commerce/rideshare schema with grain-first walkthrough, escalating interviewer probes, and a fact-type/supporting-pattern topic. | Lakehouse & Modeling | M |
| 5 | **Behavioral / STAR / Leadership Principles layer** | Every reviewer notes zero behavioral prep anywhere; landscape: LPs thread every round, Bar Raiser has veto, loop is ~50% behavioral signal. *Build:* new tool with STAR templates, 6-8 quantified story scaffolds mined from existing technical content (OOM hunt = Dive Deep, cost cut = Frugality, incident = Ownership). | New tool ("Behavioral Bench") | M |
| 6 | **Migration playbook (on-prem Hadoop→EMR, Hive→Iceberg, warehouse→lakehouse)** | Flagged high by 4 of 5 reviewers as "the most probable staff prompt"; landscape confirms via ProServe/partner migration cases. *Build:* one topic with the de-risking vocabulary — inventory, dual-run/shadow reads, checksum reconciliation, tiered cutover, rollback, in-place vs rewrite Iceberg migration. | Data Architect's Bench | M |
| 7 | **AWS security + networking (IAM roles, KMS, VPC endpoints, encryption)** | CloudStack reviewer's two highest gaps; landscape: "how do you secure the lake" asked in virtually every AWS loop, NAT-vs-S3-gateway-endpoint is a stock cost war story. *Build:* two topics — the EMR role split + SSE-KMS gotchas, and private-subnet/S3-endpoint/security-group plumbing. | Cloud Data Stack | M |
| 8 | **dbt and the transformation layer** | Lakehouse reviewer: never mentioned once in the track; landscape rates dbt "table stakes alongside SQL and Spark" (high). *Build:* one topic — staging/intermediate/mart layering, incremental models + failure modes, tests, where dbt sits on medallion. | Lakehouse & Modeling | S |

---

## TIER 2 — Strong differentiators

| Gap | Why | Where | Effort |
|-----|-----|-------|--------|
| **Redshift internals (DISTKEY/DISTSTYLE, sort keys, WLM, RA3)** | Borderline Tier 1: CloudStack high + landscape's billion-row SQL optimization follow-ups name dist/sort keys explicitly; currently a one-line black box. | Cloud Data Stack | M |
| **Streaming depth: Kafka/Kinesis internals + Structured Streaming state/watermarks** | CloudStack (shard math, hot keys, Firehose buffering), landscape Kafka theme high (consumer groups, EOS chain, compaction) + watermark edge cases; includes the Kinesis limit numbers for the Bench Numbers table. | Cloud Data Stack + Spark LAB | L |
| **EMR ops playbook: logs, monitoring, named failure modes** | CloudStack high (BOOTSTRAPPING hangs, unhealthy nodes, FetchFailed spot storms, dead-cluster history server, S3 committers); landscape EMR-ops theme medium but "near-certain at AWS-stack companies". | Cloud Data Stack | M |
| **Iceberg internals (metadata tree, commit/concurrency, MoR deletes, compaction, partition design)** | Lakehouse high depth gap; landscape table-format theme high with exactly these probes ("walk through a concurrent commit"). | Lakehouse & Modeling | M |
| **Spark trap content: write path, coalesce(1), broadcast failure modes, cache vs checkpoint, UDF/serialization/PySpark internals** | SparkLab high (write path, UDFs, Kryo/Task-not-serializable) + landscape "conceptual traps" high and PySpark-internals medium; partially overlaps item T1-1, the rest is a trap-topic cluster. | Spark LAB | M |
| **Transactions, ACID & isolation levels** | DataFoundations high: track invokes "ACID" 8+ times via Iceberg without ever defining it; MVCC/snapshot isolation is a standard fundamentals screen. | Data Foundations | S |
| **SLA/SLO thinking + pipeline operations & incident response** | Bench high ("how do you know it's healthy?" follows every design); the operate leg of every case study in T1-3 needs it. | Data Architect's Bench | M |
| **Schema evolution + data contracts depth (registry, compatibility modes, DLQ/quarantine, WAP)** | Bench + Lakehouse high depth gaps; landscape data-contracts theme rising fast (medium), WAP now the standard "stop a bad batch" answer. | Lakehouse & Modeling + Bench | M |
| **Quorum/consensus/consistency-model follow-ups (2PC vs sagas, read-your-writes, sloppy quorum drills)** | DataFoundations medium-high; the CAP topic currently stops one follow-up short of where staff interviewers probe. | Data Foundations | S |
| **Snowflake/Databricks talking-point depth (micro-partitions, Unity Catalog, Photon)** | Landscape rates both high; Bench comparison topic exists but lacks the "why not everything in Snowflake" rebuttal and 2025 internals vocabulary. | Data Architect's Bench | S |

---

## TIER 3 — Nice-to-have

| Gap | Why | Where | Effort |
|-----|-----|-------|--------|
| Data mesh vs central platform (org design, data products) | 3 reviewers medium; landscape medium, staff-discussion staple | Bench or Lakehouse | S |
| Feature stores / RAG / vector pipelines | Bench medium; landscape medium, fastest-growing | Data Architect's Bench | M |
| DR/multi-region + EMR single-AZ fact | CloudStack + Bench medium; frequent filter question | Cloud Data Stack | S |
| GDPR / right-to-be-forgotten deep answers (crypto-shredding, tokenize-at-ingest) | Lakehouse + Bench medium; favorite trap inverting time-travel selling points | Lakehouse + Bench | S |
| Spark 3/4 currency (DPP, hints, Spark Connect, ANSI mode) | SparkLab medium; standard freshness check | Spark LAB | S |
| Broadcast variables/accumulators, bucketing, dynamic allocation | SparkLab medium rapid-fire screeners | Spark LAB | S |
| Airflow internals (executors, backfill semantics, scheduler ops) | Landscape high but MWAA basics exist; internals are the delta | Cloud Data Stack | S |
| Well-Architected framework + consulting/client-scenario mode | Landscape medium (ProServe/partner loops only) | Data Architect's Bench | S |
| Real-time OLAP serving (Druid/Pinot/ClickHouse) | Bench low + landscape low; one short "when it earns its keep" topic | Data Architect's Bench | S |
| Data Vault 2.0, semantic/metrics layer, S3 Tables freshness check | Lakehouse medium/low; 30-second answers suffice | Lakehouse & Modeling | S |
| Flink checkpointing/watermarks | Landscape medium, streaming-first shops only | Cloud Data Stack | S |

---

## FORMAT / INTERVIEW-CRAFT GAPS (how the material teaches)

Prioritized; these apply track-wide unless noted.

1. **No active-recall layer anywhere** — all 5 reviewers flag zero practice questions, flashcards, quizzes, or self-tests; every topic ends in one read-only monologue. Highest-leverage single change: a rapid-fire/flashcard mode per tool (the Bench "Numbers" topic is begging to be a deck). *Effort: M (shared component, reused 5x).*
2. **No follow-up chains** — real interviews probe 3 levels deep; add 3-4 canonical follow-ups with one-line answers per topic (flagged by SparkLab, CloudStack, DataFoundations reviewers). *Effort: M.*
3. **No scenario/debugging drills** — the "your job OOMs at 2am, walk me through it" rehearsal format is absent track-wide; pairs directly with Tier 1 items 1-4. *Effort: M.*
4. **No trap-question bank with bait phrasing + dodge scripts** — inline trap callouts exist but never as interviewer-voiced questions ("we need real-time", "isn't the lakehouse just marketing?"); 4 reviewers. *Effort: S.*
5. **No "what the interviewer is listening for" rubrics** — one scoring-signal line per topic; all 5 reviewers. *Effort: S.*
6. **No answer-length variants** — every canned answer is a 120-180-word monologue; add 30-second skeleton + 2-minute expansion (CloudStack, DataFoundations). *Effort: S.*
7. **No whiteboard choreography/drills** — draw-the-DAG exercises, grain-first modeling script, 45-minute timeboxing (4 reviewers). *Effort: M.*
8. **No weak-vs-strong graded answer pairs** for calibration (Lakehouse, Bench). *Effort: S.*
9. **Widget bug**: `BatchStreamingDecoderViz.jsx` `decide()` (line 72) never reads the volume answer, silently teaching that data shape is irrelevant — fix or remove the question. *Effort: S.*
10. **No consolidated red-flag cram sheet** — one page of the ten classic disqualifying answers (CloudStack). *Effort: S.*

---

## Executive summary

The site is a strong explainer and a weak rehearsal space: it teaches candidates to *describe* every component fluently, but the five rounds that actually decide a 2025-2026 senior/staff loop — live SQL, live modeling, 45-minute system design, "walk me through the failure" debugging, and LP-mapped behavioral — are never once practiced, and three of them (SQL screen, STAR stories, security probing) have literally zero supporting content. Reviewer consensus and landscape research converge on the same eight Tier 1 gaps, so conviction is high. The cheapest structural win is a shared active-recall/drill layer retrofitted onto all five tools; the biggest content wins are the Spark OOM/UI playbook, the SQL problem set, and the design case studies. Everything else is refinement; those close the offer-losing holes.
