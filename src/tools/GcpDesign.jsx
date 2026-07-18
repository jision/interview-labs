import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import CruxRevealViz from "./gcpdesign/CruxRevealViz.jsx";

const ACCENT = "#EA4335";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "framework", label: "The Google design framework", group: "The method" },
  { id: "telemetry", label: "Telemetry ingestion (Monarch)", group: "The 10 sheets" },
  { id: "ratelimiter", label: "Global rate limiter (Doorman)", group: "The 10 sheets" },
  { id: "logsearch", label: "Multi-tenant log search", group: "The 10 sheets" },
  { id: "scheduler", label: "Batch scheduler (Borg)", group: "The 10 sheets" },
  { id: "config", label: "Config service (Chubby)", group: "The 10 sheets" },
  { id: "objstore", label: "Object-storage metadata (Colossus)", group: "The 10 sheets" },
  { id: "dataproc", label: "Petabyte processing (Dataflow)", group: "The 10 sheets" },
  { id: "migration", label: "Zero-downtime migration", group: "The 10 sheets" },
  { id: "inference", label: "Multi-tenant LLM inference", group: "The 10 sheets" },
  { id: "residency", label: "Residency-aware alerting", group: "The 10 sheets" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* ── The Google design framework ──────────────────────────────── */
const GOOGLE_STEPS = [
  {
    n: 1,
    name: "Clarify requirements",
    what: "Pin the functional scope, then the non-functionals that gate the design: the user-facing SLO (availability, p99 latency, freshness, durability), the consistency model, security and multi-tenancy, and the scale envelope. Write the SLO on the board first, every later box has to defend it.",
  },
  {
    n: 2,
    name: "Scale estimate",
    what: "Do the arithmetic out loud, but only the numbers that change the design: the QPS or write rate that picks a shard count, the data volume that picks a storage engine, the cardinality or fan-out that picks an index. Round hard. Skip vanity math that moves no decision.",
  },
  {
    n: 3,
    name: "API + data model",
    what: "Name the read and write API and the core entities before drawing boxes. The access pattern, point lookup versus scan versus aggregation, and the read-to-write ratio, is what actually selects the datastore, so the model comes before the architecture.",
  },
  {
    n: 4,
    name: "High-level architecture",
    what: "Draw 5 to 8 boxes: clients, the front door, the control or metadata plane, the data plane, storage, and the async path. Split the control plane from the data plane early, that single move is what separates a senior infra design from a CRUD diagram.",
  },
  {
    n: 5,
    name: "Deep-dive the high-risk decisions",
    what: "Pick the two or three decisions that carry the most risk and go deep: the consistency model, the sharding and hot-key story, the failure-domain boundaries. Let the interviewer steer which one. This is where the round is scored.",
  },
  {
    n: 6,
    name: "Failure + operations",
    what: "For each major component, say what happens when it dies, when it is slow, and when it is partitioned. Name the blast radius, the degradation, and the recovery. Then observability, rollout, and quota. Day-2 thinking is a staff signal.",
  },
  {
    n: 7,
    name: "Evolution",
    what: "Close with the MVP, the scale path, and the migration: what you ship first, what breaks at 10x and how you shard or cache around it, and how you would get there with zero downtime. It shows you design for a trajectory, not a snapshot.",
  },
];

function Framework() {
  return (
    <>
      <Lede>
        The L6 infra design round rewards a rehearsed <em>shape</em>. Seven steps take you from a vague
        prompt to a labeled architecture with a failure and operations story, and the discipline that scores
        is <strong>traceability</strong>: every box on the board defends a requirement or a number you
        computed out loud. Below the loop sits the shared vocabulary, Google's Cloud Architecture Framework pillars, and
        the reliability spine that ties every choice back to a user-facing SLO.
      </Lede>

      <Block eyebrow="the loop" title="The seven-step design loop">
        <p className="text-ink-dim leading-relaxed mb-3">
          The order is deliberate: requirements and a little arithmetic first, then the API and model, then
          the architecture, and only then the deep-dives, failure story, and evolution. The two budgets that
          matter most are step 5 (the high-risk decisions) and step 6 (failure and operations).
        </p>
        <div className="space-y-3">
          {GOOGLE_STEPS.map((s) => (
            <div key={s.n} className="rounded-lg border border-line bg-surface-2 p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="font-mono text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full border"
                  style={{ color: ACCENT, borderColor: ACCENT }}
                >
                  {s.n}
                </span>
                <span className="font-mono text-[13px] font-semibold text-ink">{s.name}</span>
              </div>
              <p className="text-[13px] text-ink-dim leading-relaxed">{s.what}</p>
            </div>
          ))}
        </div>
        <Callout kind="note" title="What the interviewer is listening for">
          Requirements-to-decision traceability. Can every component you drew be traced back to a requirement
          or a number you computed? At L6 the tell is the control-plane / data-plane split and a real failure
          story, candidates who name Google systems as logos but cannot defend the reliability and blast-radius
          reasoning read as mid-level no matter how many names they drop.
        </Callout>
      </Block>

      <Block eyebrow="the vocabulary" title="The Cloud Architecture Framework pillars, used as review lenses">
        <p className="text-ink-dim leading-relaxed mb-2">
          Google's Cloud Architecture Framework gives five pillars. Use them as active lenses on the design,
          "let me pressure-test this against reliability and cost," not a checklist recited at the end.
        </p>
        <OpTable
          cols={["Pillar", "Asks", "", "In practice"]}
          rows={[
            { op: "Operational excellence", avg: "can you run and evolve it?", avgTone: "good", why: "Automation, safe progressive rollout, observability, and toil reduction. Operations as code, so day-2 is not an afterthought." },
            { op: "Security, privacy, compliance", avg: "is it protected and lawful?", avgTone: "good", why: "Least privilege, defense in depth, encryption in transit and at rest, tenant isolation, data residency, and auditability." },
            { op: "Reliability", avg: "does it recover?", avgTone: "ok", why: "Design for failure: redundancy across failure domains, graceful degradation, and tested recovery against an explicit SLO." },
            { op: "Cost optimization", avg: "paying only for value?", avgTone: "ok", why: "Right-size and tier storage, autoscale, erasure-code cold data, and put the dominant cost line on the board." },
            { op: "Performance", avg: "right resources, right layout?", avgTone: "ok", why: "Pick the right engine and data layout, push work down to the data, cache the hot path, and measure at the tail." },
          ]}
        />
      </Block>

      <Block eyebrow="the spine" title="Tie every choice to a user-facing SLO">
        <p className="text-ink-dim leading-relaxed mb-2">
          The reliability spine is the through-line an L6 infra round is really grading. Every significant
          decision should connect to three things:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>A user-facing SLO</strong>, the availability, latency, freshness, or durability number the design exists to hold. If you cannot name the SLO a component protects, you cannot justify the component.</li>
          <li><strong>Redundancy across failure domains</strong>, what is replicated, across which zones or regions, and what quorum or failover keeps it serving when a domain is lost.</li>
          <li><strong>Graceful degradation</strong>, what the system does when a dependency is slow or gone: serve stale, shed load, fail open, prune a zone, rather than hang or cascade.</li>
        </ul>
        <Callout kind="tip" title="Say the degradation, not just the happy path">
          Anyone can draw the working system. The senior move is narrating what happens when each box is slow
          or dead and showing the SLO still roughly holds. Reuse the deep reliability patterns in{" "}
          <a href="#/sre-canon" className="font-mono text-xs" style={{ color: ACCENT }}>The SRE Canon</a>{" "}
          (error budgets, graceful degradation, cascading-failure defenses) for those deep-dives.
        </Callout>
      </Block>

      <Block eyebrow="know the round" title="Product design vs infra design">
        <p className="text-ink-dim leading-relaxed mb-2">
          At L6 you typically get about two design rounds, and they are not the same interview. A{" "}
          <strong>product design</strong> round starts from a user-facing product (design Photos, design a
          feed) and rewards requirements dialogue, API shape, and data modeling. An <strong>infra design</strong>{" "}
          round starts from a systems primitive (a scheduler, a metrics backend, a lock service) and rewards
          the control-plane / data-plane split, consistency and consensus reasoning, and blast-radius control.
          The ten sheets here are the infra half.
        </p>
        <p className="text-ink-dim leading-relaxed">
          For the reusable building blocks and the product-style framework, cross over to{" "}
          <a href="#/whiteboard" className="font-mono text-xs" style={{ color: ACCENT }}>The Whiteboard</a>{" "}
          (open "The design framework") and{" "}
          <a href="#/arch-fundamentals" className="font-mono text-xs" style={{ color: ACCENT }}>Architecture Fundamentals</a>{" "}
          for load balancing, caching, sharding, replication, and consistency.
        </p>
      </Block>

      <Block eyebrow="drill it" title="Run a design end to end">
        <p className="text-ink-dim leading-relaxed mb-3">
          Pick one of the ten designs and reveal it in three stages, requirements and scale, the crux
          decisions, the failure modes, saying your own version out loud before each reveal.
        </p>
        <Try label="drill a design">
          <CruxRevealViz />
        </Try>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>The interviewer gives you almost no requirements. What do you do?</strong> State defaults
            out loud as assumptions and design against them: "I will assume a 99.9% availability SLO, p99 under
            a second, and minutes of freshness, correct me if that is off." Stated assumptions score; silent
            ones read as errors.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why do you keep splitting the control plane from the data plane?</strong> Because it lets
            the two scale and fail independently: the byte or request path stays cheap and available while
            metadata and coordination live in a smaller, consistent core. Colossus, Borg, and Monarch are all
            this split, and naming it early is the L6 tell.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Which Google systems should you actually be able to name?</strong> The ones that map to
            primitives: Monarch (metrics), Borg (scheduling), Chubby and Paxos (coordination), Colossus and
            Bigtable and Spanner (storage), Dataflow and MillWheel (processing). Name the system, then defend
            the one design decision it is famous for, not just the logo.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you decide where to spend the deep-dive time?</strong> On the highest-risk decision,
            usually consistency, the hot-key or cardinality story, or the failure-domain boundary, and I offer
            the interviewer a menu so they steer. Depth on the risky decision beats even coverage of easy ones.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I run a seven-step loop: clarify requirements and the SLO, do only the scale math that changes a
          decision, define the API and data model, draw the high-level architecture splitting control plane
          from data plane, deep-dive the two or three riskiest decisions, then failure and operations, then
          evolution. I review it against the five Cloud Architecture Framework pillars, and I keep a reliability spine
          through the whole thing: every choice ties to a user-facing SLO, redundancy across failure domains,
          and a graceful-degradation story. And I name the real Google system behind each primitive rather
          than hand-waving."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "My infra design has a fixed shape. First, requirements, and I write the user-facing SLO on the
          board immediately, availability, p99 latency, freshness, durability, plus the consistency model,
          multi-tenancy, and scale envelope, because every later box has to defend that SLO. Second, scale
          math, but only the numbers that change the design: the write rate that sets a shard count, the
          volume that picks a storage engine, the cardinality or fan-out that picks an index, rounded hard.
          Third, the API and data model, because the access pattern is what actually selects the datastore.
          Fourth, the architecture in five to eight boxes, and I split the control or metadata plane from the
          data plane straight away, that is the move behind Colossus, Borg, and Monarch. Fifth, I deep-dive
          the two or three riskiest decisions, consistency, hot keys, failure domains, and let the interviewer
          steer. Sixth, failure and operations: for each component, what happens when it is slow, dead, or
          partitioned, the blast radius and the degraded mode, then observability, rollout, and quota. Seventh,
          evolution: the MVP, what breaks at 10x, and a zero-downtime path to get there. Throughout I hold the
          reliability spine, every decision ties to an SLO, to redundancy across failure domains, and to a
          graceful-degradation story, and I review the whole thing against operational excellence, security
          and compliance, reliability, cost, and performance."
        </Callout>
      </Block>
    </>
  );
}

/* ── Telemetry ingestion (Monarch) ───────────────────────────── */
function Telemetry() {
  return (
    <>
      <Lede>
        "Design the metrics and monitoring backend for all of Google Cloud. Every service, VM, and managed
        product emits time series; SREs run dashboards and alerts on top. It has to stay up when the very
        thing it monitors is on fire. Build it." This is Monarch, a planet-scale, in-memory time-series
        database.
      </Lede>

      <Block eyebrow="requirements & scale" title="Size it on cardinality, not QPS">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional</strong>: ingest labeled time series, evaluate alerting rules, serve range and
          aggregation queries. <strong>NFR / SLO</strong>: dashboard queries p99 under a second, freshness in
          seconds, and availability strictly <em>higher</em> than the systems it watches. The multiplier that
          drives everything is <strong>series cardinality</strong> (labels times exporting tasks), not request
          bytes.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`one metric x 4 labels:
  service(500) x method(20) x zone(40) x status(5) = 2,000,000 series
x thousands of metrics and exporting tasks  ->  billions of active series
ingest: ~10M+ samples/sec  ->  must be in-memory, sharded by zone
retention: recent in RAM (hours), rolled to disk/Colossus for history only`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you size on cardinality, and that you state the availability paradox up front: the monitoring
          system must be more available than everything it monitors, which forces near-zero dependencies in
          the write path. Sizing on QPS and putting the metrics DB on Spanner both miss the point.
        </Callout>
      </Block>

      <Block eyebrow="API & data model" title="Push samples, query by label matchers">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Write</strong>: push <code className="font-mono">(metric, label-set, timestamp, value)</code>{" "}
          to the nearest zone. <strong>Read</strong>: a query language over metric name, label matchers, a
          time range, and a reduction (rate, sum, percentile). A series is keyed by metric plus its full label
          set, with target labels (the entity) separated from metric labels.
        </p>
        <p className="text-ink-dim leading-relaxed">
          Monarch is <strong>push-based</strong>: exporters send to the nearest zone, which scales ingest and
          removes the scrape-target discovery bottleneck of a pull model. The trade is you must defend against
          misbehaving pushers with authentication and quotas, which pull would get for free.
        </p>
      </Block>

      <Block eyebrow="architecture" title="Zonal in-memory leaves, global query and config planes">
        <CodeBlock
          title="text"
          lang="text"
          code={`exporters (push) --> [ zonal INGESTION ] --> [ zonal LEAVES: in-memory TSDB ]
   nearest zone          per-zone routers        recent data, NO Colossus/Spanner
                         quotas, cardinality      in the write path
                         limits                          ^
                                                         | query pushdown
  dashboards/alerts --> [ root MIXER ] -> [ zone MIXER ] -> leaves
                          global query plane      scatter-gather, reduce at
                          (can be DOWN)           each level (root->zone->leaf)
                             |
                       [ global CONFIG plane ] schemas, rules, downsampling
                          (can be DOWN; zones keep serving stale)`}
        />
      </Block>

      <Block eyebrow="the crux decisions" title="Minimize dependencies, regionalize, push queries down">
        <OpTable
          cols={["Decision", "Choice", "", "Why / trade"]}
          rows={[
            { op: "Leaf storage", avg: "in-memory, no write-path deps", avgTone: "good", why: "In-memory leaves hit sub-second queries and keep ingest alive when storage is down; the cost is RAM and a bounded recent window. Disk-first on Colossus is cheaper and deeper but couples monitoring to storage, wrong here." },
            { op: "Topology", avg: "regionalized zones", avgTone: "good", why: "Zones are independent and answer from local replicas; the global query and config planes are best-effort and may fail without blinding SREs. The cost is cross-zone views can be slightly inconsistent." },
            { op: "Query execution", avg: "pushdown via mixers", avgTone: "ok", why: "Hierarchical mixers (root -> zone -> leaf) aggregate near the data so only reduced results cross the network. More moving parts than a central query engine, but it is what scales." },
            { op: "Ingest", avg: "push + per-tenant quotas", avgTone: "ok", why: "Push scales and needs no scrape discovery; quotas and cardinality limits keep one tenant from OOMing a zone." },
          ]}
        />
      </Block>

      <Block eyebrow="reliability, security & observability" title="Break the circular dependency">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Reliability spine</strong>: the SLO is "SREs can always see and alert." It holds because the write path has almost no dependencies, and queries degrade by pruning slow zones and reading stale replicas rather than hanging.</li>
          <li><strong>Consistency</strong>: eventually consistent across zones; queries are best-effort and annotate which zones responded, so a partial answer is labeled, not silently wrong.</li>
          <li><strong>Security</strong>: per-tenant (per-project) isolation, authenticated ingest, and per-tenant query quotas.</li>
          <li><strong>Observability</strong>: it <em>is</em> the observability system, so it is monitored by a separate, smaller, independent instance to break the circular dependency.</li>
        </ul>
      </Block>

      <Block eyebrow="failure modes & the evolution path" title="Cardinality is the killer">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Cardinality explosion (number one)</strong>: one unbounded label (a user_id or request_id) multiplies the series count and OOMs leaves. Defend with per-target cardinality limits, reject or coarsen high-cardinality labels, and alert on series growth.</li>
          <li><strong>Circular dependency</strong>: the monitoring stack cannot depend on the monitored stack for naming, auth, or storage. Run a minimal bootstrap monitor that depends on nothing.</li>
          <li><strong>Slow or unreachable zone</strong>: zone pruning plus stale-replica reads keep queries answered under a deadline instead of blocking.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          <strong>Evolution</strong>: MVP is a single-zone in-memory TSDB with push ingest and a simple query
          API. Scale by adding zones and the mixer hierarchy, then a global config plane and downsampled
          long-term rollups to Colossus for history, kept strictly off the ingest critical path.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Why not just store everything in Bigtable or Colossus?</strong> Because monitoring must
            outlive its dependencies. Putting storage in the write path means a storage incident blinds you
            exactly when you need visibility. Recent data stays in memory; only cold history rolls to Colossus,
            off the critical path.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you stop one team's bad metric from taking down a zone?</strong> Per-target and
            per-tenant cardinality and ingest quotas enforced at the router: reject or coarsen the offending
            labels and alert the owner, so the blast radius is one tenant, not the zone.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A dashboard query spans 40 zones and three are slow. What happens?</strong> The root mixer
            fans out under a deadline and returns a partial result annotated with which zones were pruned,
            reading a stale leaf replica where it can. Partial-and-labeled beats hanging.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Push or pull, and why does Google push?</strong> Push removes scrape-target discovery and
            scales ingest horizontally; at planet scale a central scraper cannot keep a fresh target list. The
            trade is defending against misbehaving pushers with auth and quotas, which pull gets for free.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "This is Monarch: a push-based, in-memory, regionalized time-series database. I size it on
          cardinality, labels times tasks, not QPS. Zonal leaves hold recent data in RAM with no synchronous Colossus or
          Spanner dependency in the write path, so monitoring stays up when its dependencies are down. Queries push down
          through a root-then-zone mixer hierarchy so aggregation happens near the data, and the global query
          and config planes are best-effort, zones keep serving stale if they fail. The number-one failure is
          cardinality explosion, so I govern it with per-tenant quotas, and I break the circular dependency by
          monitoring the monitor with a separate minimal instance."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Requirements first, and the key non-functional is the availability paradox: this system must be
          more available than everything it watches, so the write path gets almost no dependencies. I size on
          cardinality, one metric with four labels is already ~2 million series, and across thousands of metrics
          and tasks that runs to billions of active series, ingesting ten-million-plus samples a second, which forces in-memory, zone-sharded
          leaves. Ingest is push to the nearest zone, with authentication, per-tenant quotas, and hard
          cardinality limits at the router. Storage is in-memory zonal leaves holding recent data, with no
          synchronous Colossus or Spanner dependency in the write path (recovery logs are best-effort); cold history downsamples to Colossus off the critical path.
          Queries push down through hierarchical mixers, root to zone to leaf, so each level reduces before
          sending up, and the global query and config planes are best-effort, if they are down, zones keep
          serving stale rather than going blind. The dominant failure is cardinality explosion from an
          unbounded label, so I govern it with quotas and growth alerts; the second is the circular
          dependency, so a separate minimal instance monitors the monitor; the third is a slow zone, handled
          by pruning it and reading a stale replica under a deadline. Everything ties to the SLO that an SRE
          can always see and alert."
        </Callout>
      </Block>
    </>
  );
}

/* ── Global rate limiter (Doorman) ───────────────────────────── */
function Ratelimiter() {
  return (
    <>
      <Lede>
        "A shared backend is getting hammered, some clients send 100x their fair share and take it down.
        Design a rate limiter that enforces a global quota across thousands of client tasks in every region,
        adds almost no latency, stays fair, and does the right thing when the limiter itself has an outage."
        This is Doorman, plus the SRE overload-handling playbook.
      </Lede>

      <Block eyebrow="requirements & scale" title="Global correctness, local latency">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional</strong>: enforce per-client and per-tenant QPS caps globally; stay fair; keep
          latency negligible. <strong>NFR</strong>: near-zero added latency on the hot path, correct behavior
          when the limiter is unreachable, and scale to thousands of clients across many regions. The sizing
          variable is <strong>enforcement granularity</strong>, global versus local.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`global cap = 10,000 QPS,  1,000 client tasks
naive: each task gets a static 10 QPS local bucket
  -> simple, no RPC, but WRONG when load is uneven:
     one hot task hits its 10 and rejects while 900 sit idle
the imbalance between local simplicity and global correctness
IS the whole design problem.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you separate global correctness from local latency, and whether you <strong>fail open</strong>.
          Putting a synchronous global counter on every request adds a SPOF and a round trip to a system whose
          job is to protect against overload, the cure worse than the disease.
        </Callout>
      </Block>

      <Block eyebrow="API & data model" title="Ask for capacity, enforce locally">
        <p className="text-ink-dim leading-relaxed mb-2">
          Hot-path call is a local <code className="font-mono">allow(client, cost)</code> against an in-process
          token bucket, no network on the common case. Out of band, the client asks the Doorman master for a
          share of the global capacity and caches a <strong>lease</strong>{" "}
          <code className="font-mono">(client, rate, expiry)</code>; the master rebalances shares toward where
          the load actually is.
        </p>
      </Block>

      <Block eyebrow="architecture" title="Doorman leases global capacity to clients">
        <CodeBlock
          title="text"
          lang="text"
          code={`client task --allow?--> [ local token bucket ] --(mostly local, no RPC)-->
                              ^  refilled from a
                              |  leased share
                        [ Doorman master ]  leases global capacity per client
                          (Paxos-replicated) rebalances shares periodically
                              |
                        global capacity config per {client, resource}
if master unreachable -> keep last lease / fall back to a safe static local cap
                         (FAIL OPEN: never turn a limiter outage into an outage)`}
        />
      </Block>

      <Block eyebrow="the crux decisions" title="Leases, bucket algorithm, and fail-open">
        <OpTable
          cols={["Decision", "Choice", "", "Why / trade"]}
          rows={[
            { op: "Where capacity lives", avg: "capacity leases (Doorman)", avgTone: "good", why: "A global atomic counter is precise but a hot SPOF and adds a round trip; local-only buckets are cheap but cannot enforce a global cap. Leases give global correctness with local latency and degrade to local caps." },
            { op: "Bucket algorithm", avg: "token bucket + adaptive", avgTone: "ok", why: "Token bucket allows bounded bursts and is cheap; sliding window is precise but heavier; leaky bucket smooths output. Most designs use per-client token buckets plus client-side adaptive throttling." },
            { op: "Failure stance", avg: "fail open for overload", avgTone: "good", why: "For overload protection, fail open to local caps so a limiter outage does not become a global outage. For abuse or security limits, fail closed. State which per use case." },
          ]}
        />
      </Block>

      <Block eyebrow="reliability, fairness & observability" title="Push back before the network">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Adaptive throttling</strong>: clients reject locally with a probability derived from their recent accept-to-request ratio, so they back off <em>before</em> spending the network, the SRE "client-side throttling" pattern.</li>
          <li><strong>Criticality classes</strong>: critical traffic gets guaranteed capacity and best-effort traffic is shed first, so fairness holds under contention.</li>
          <li><strong>Retry budgets + backoff</strong>: cap retries as a fraction of requests, with exponential backoff and jitter, so rejected load does not amplify.</li>
          <li><strong>Observe</strong>: accept and reject rates, lease age, and rebalance lag per client.</li>
        </ul>
      </Block>

      <Block eyebrow="failure modes & the evolution path" title="Hot counters, window edges, retry storms">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Hot counter / master SPOF</strong>: fail open to local caps, Paxos-replicate the master, and cache leases so a master blip does not stall traffic.</li>
          <li><strong>Window-boundary bursts + clock skew</strong>: a fixed window lets roughly 2x through at the boundary; use sliding or approximate windows and tolerate skew.</li>
          <li><strong>Retry amplification</strong>: rejected clients retry and multiply offered load; enforce retry budgets and backoff, and make rejection cheap.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          <strong>Evolution</strong>: MVP is per-task local token buckets, cheap and approximate. Add Doorman
          leases for global correctness, then adaptive throttling and criticality classes as abuse and
          overload grow. For the request-path building block, cross-link{" "}
          <a href="#/whiteboard" className="font-mono text-xs" style={{ color: ACCENT }}>The Whiteboard</a>{" "}
          (open "rate limiter").
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Local buckets cannot enforce a global cap, global counters are a SPOF. Which do you
            pick?</strong> The hybrid: a Doorman-style master leases a share of the global budget to each
            client, clients enforce locally against the lease, and the master rebalances shares toward the
            load. Global correctness with local latency, degrading to local caps if the master is gone.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your rate-limiter service has an outage. What happens to traffic?</strong> It fails open:
            clients keep their last lease or fall back to a conservative static local cap, so a limiter outage
            throttles slightly imprecisely instead of dropping everything. I never make the limiter a hard
            dependency on the request path.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Clients retry every rejected request. Now what?</strong> That is retry amplification and it
            can multiply load several-fold. I add per-client retry budgets, exponential backoff with jitter,
            and make rejection cheap so retries do not cost the backend.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you keep it fair between a noisy tenant and a critical one?</strong> Criticality
            classes and per-tenant shares: critical traffic gets guaranteed capacity, best-effort is shed
            first, and adaptive throttling pushes back on the noisy tenant at its own client before it reaches
            the shared backend.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "The tension is global correctness versus local latency. Local per-task token buckets are cheap but
          cannot cap globally; a global counter is precise but a hot SPOF. So I use Doorman-style capacity
          leases: the master leases each client a share of the global budget, clients enforce locally against
          the lease, and the master rebalances toward the load. It fails open to local caps so a limiter
          outage never becomes a global outage. I add client-side adaptive throttling and retry budgets to
          stop retry amplification, and criticality classes for fairness."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The requirement that shapes everything is near-zero added latency plus correctness when the limiter
          itself fails, which rules out a synchronous global counter on the request path. The hot path is a
          local token-bucket check with no network. Global correctness comes from Doorman: out of band, each
          client leases a share of the global capacity and caches it, and the master rebalances shares toward
          the clients actually seeing load, so a hot task is not stuck at a static tenth while others sit idle.
          If the master is unreachable, clients keep the last lease or fall back to a conservative static cap,
          fail open, because turning a limiter outage into a total outage is the classic self-inflicted wound.
          On top I add the SRE overload patterns: client-side adaptive throttling so clients reject locally
          based on their recent accept ratio before spending the network, retry budgets with backoff and
          jitter so rejected traffic does not amplify, and criticality classes so critical work keeps
          guaranteed capacity while best-effort is shed first. The failure modes I call out are the hot
          counter as a SPOF, mitigated by leases and a Paxos-replicated master; window-boundary bursts and
          clock skew, mitigated by sliding or approximate windows; and retry amplification, mitigated by
          budgets. I would start with plain local buckets and layer leases and adaptive throttling on as scale
          and abuse grow."
        </Callout>
      </Block>
    </>
  );
}

/* ── Multi-tenant log search ─────────────────────────────────── */
function Logsearch() {
  return (
    <>
      <Lede>
        "Design a multi-tenant log search platform, think Cloud Logging. Thousands of customer projects stream
        logs; users run full-text searches and time-range aggregations; one noisy tenant must not degrade the
        others; retention runs to years but has to stay cheap." Two workloads hide in one prompt, and the win
        is refusing to build them as one system.
      </Lede>

      <Block eyebrow="requirements & scale" title="Write-heavy ingest, read-heavy skewed queries">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional</strong>: append ingest, full-text and structured search, aggregations, hard
          per-tenant isolation, tiered retention. <strong>NFR</strong>: interactive latency on recent data,
          ingest that keeps up with bursts, isolation between tenants, and cheap cold storage. The sizing
          variables are <strong>write throughput</strong> per tenant and <strong>query fan-out</strong>, and
          field cardinality drives index cost.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you split the ingest path from the query path, and whether tenant isolation is a first-class
          constraint, per-tenant queues, quotas, and admission, rather than an afterthought bolted on at the
          end.
        </Callout>
      </Block>

      <Block eyebrow="API & data model" title="Time-partitioned segments, indexed fields plus raw">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Write</strong>: <code className="font-mono">append(tenant, record)</code>.{" "}
          <strong>Read</strong>: <code className="font-mono">query(tenant, text/filters, time range, agg)</code>.
          The model is time-partitioned segments per tenant, an inverted index for full-text fields, a
          columnar layout for the fields people aggregate, and the raw payload stored cheaply. You index a
          curated set of fields, not everything.
        </p>
      </Block>

      <Block eyebrow="architecture" title="Split ingest from query, tier the storage">
        <CodeBlock
          title="text"
          lang="text"
          code={`tenants --logs--> [ ingest tier ] --> [ per-tenant queues ] --> [ indexers ]
  (bursty)          admission,            isolation, shedding     inverted + columnar
                    per-tenant quota                              index, selected fields
                                                                        |
                                                        time-partitioned segments
  query --> [ query coordinator ] --scatter/gather--> [ segment servers ]
             admission, cost cap,     prune by time     hot(SSD) / warm / cold
             per-tenant timeout                          cold = object store (GCS)`}
        />
      </Block>

      <Block eyebrow="the crux decisions" title="Index shape, what to index, and isolation model">
        <OpTable
          cols={["Decision", "Choice", "", "Why / trade"]}
          rows={[
            { op: "Index structure", avg: "inverted + columnar", avgTone: "good", why: "Inverted index for full-text term lookup, columnar for aggregations and scans. Choose per field; a single structure serves one query type well and the other badly." },
            { op: "What to index", avg: "curated fields + raw", avgTone: "ok", why: "Indexing every field explodes cost and cardinality. Index a curated queryable set and keep the raw payload for grep-style fallback." },
            { op: "Isolation", avg: "shared infra, logical isolation", avgTone: "ok", why: "Full physical isolation per tenant is expensive; use shared infra with per-tenant queues, quotas, and admission, and hard-isolate only the largest tenants." },
            { op: "Retention", avg: "hot / warm / cold tiers", avgTone: "good", why: "Recent on SSD for interactive queries, older on cheaper disk, cold on object storage. Time pruning means cold tiers are rarely touched." },
          ]}
        />
      </Block>

      <Block eyebrow="reliability, security & observability" title="Time pruning and admission carry the load">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Time pruning</strong> is the main query optimization, most queries hit recent segments, so the coordinator prunes by time before fanning out.</li>
          <li><strong>Query admission</strong>: per-tenant timeouts, scan budgets, and cost caps stop one query from eating the cluster.</li>
          <li><strong>Security</strong>: tenant data encrypted and access-scoped per project; a tenant can never read across the boundary.</li>
          <li><strong>Observe</strong>: ingest lag per tenant, query cost distribution, and segment-tier hit rates.</li>
        </ul>
      </Block>

      <Block eyebrow="failure modes & the evolution path" title="Noisy tenants and runaway queries">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Hot-tenant ingest backpressure / head-of-line</strong>: one tenant's spike stalls the shared pipeline; per-tenant queues plus load shedding isolate it.</li>
          <li><strong>Unbounded expensive query</strong>: a term with no time filter over a year of logs; admission control, a default time bound, scan budgets, timeouts, and cost caps contain it.</li>
          <li><strong>High-cardinality field explosion</strong>: a field like request_id blows up the inverted index; cap indexed-field cardinality and spill offenders to the raw payload.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          <strong>Evolution</strong>: MVP is append to time-partitioned segments with a simple inverted index
          and scatter-gather. Add hot/warm/cold tiering for cheap retention, then per-tenant admission and
          cost caps as multi-tenancy starts to bite.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>One tenant sends 100x normal volume. How do the others stay fast?</strong> Per-tenant
            ingest queues and quotas isolate the spike, and load shedding drops that tenant's excess first. On
            the query side, per-tenant admission and cost caps mean their expensive searches cannot monopolize
            segment servers.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A user runs a bare term over a year of logs. What stops it?</strong> Query admission with a
            default time bound, a scan budget and timeout, and a cost cap. The coordinator prunes to recent
            segments first and refuses or samples the unbounded scan rather than reading petabytes.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why not index every field?</strong> Index cost and cardinality: a high-cardinality field
            makes the inverted index huge and slow. I index a curated set of queryable fields, keep the raw
            payload for fallback, and use columnar layout for the fields people aggregate.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you make years of retention cheap?</strong> Tier it: recent segments on SSD for
            interactive queries, older on cheaper disk, cold on object storage with slower access. Queries
            prune by time so cold tiers are rarely read, and lifecycle policies move segments automatically.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Two workloads hide here: write-heavy bursty ingest and read-heavy time-skewed queries, so I build
          them as separate paths. Ingest goes through per-tenant queues with quotas and admission into
          indexers that build an inverted index for text and a columnar layout for aggregations, indexing a
          curated set of fields and keeping raw payload cheap. Data lands in time-partitioned segments tiered
          hot, warm, and cold to object storage. Queries scatter-gather with time pruning first, under
          per-tenant admission, timeouts, and cost caps. The failures I design against are hot-tenant
          head-of-line blocking, unbounded queries, and high-cardinality index explosion."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I start by naming that this is two systems: ingest is write-heavy and bursty, queries are
          read-heavy and skewed toward recent time, and one design serving both serves both badly. Ingest runs
          through per-tenant queues with quotas and admission so a noisy tenant is isolated and its excess is
          shed, not allowed to block the pipeline. Indexers build an inverted index for full-text fields and a
          columnar layout for the fields people aggregate, and I index only a curated queryable set while
          keeping the raw payload cheaply for fallback, because indexing every field, especially a
          high-cardinality one, explodes cost. Data lands in time-partitioned segments so queries can prune by
          time, and segments are tiered hot on SSD, warm on cheap disk, cold on object storage, with lifecycle
          policies moving them automatically, which is what makes years of retention affordable. The query
          path is a coordinator that prunes by time then scatter-gathers across segment servers, all under
          per-tenant admission, timeouts, scan budgets, and cost caps, so a runaway query cannot eat the
          cluster. Isolation is logical on shared infra for most tenants and physical for the largest ones. My
          top failure modes are hot-tenant ingest backpressure, contained by per-tenant queues and shedding;
          unbounded expensive queries, contained by admission and cost caps; and index cardinality explosion,
          contained by capping indexed fields and spilling to raw."
        </Callout>
      </Block>
    </>
  );
}

/* ── Batch scheduler (Borg) ──────────────────────────────────── */
function Scheduler() {
  return (
    <>
      <Lede>
        "Design a cluster scheduler that packs millions of tasks onto a shared fleet of tens of thousands
        of machines (a Borg cell), keeps utilization high, honors priority and quota between production and batch, and
        survives its own master failing over." This is Borg, and the hard problem is scheduling
        <em> throughput</em>, not placement quality.
      </Lede>

      <Block eyebrow="requirements & scale" title="Do not score every machine">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional</strong>: place tasks on machines meeting resource and constraint requirements;
          enforce priority, quota, and preemption; reschedule on failure.{" "}
          <strong>NFR</strong>: high scheduling throughput (thousands of decisions per second), high
          utilization, fast failover, fairness. The sizing variables are the <strong>pending-queue depth</strong>{" "}
          and <strong>machines scored per decision</strong>.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`scoring EVERY machine for EVERY pending task:
  O(pending x machines) = O(millions x tens-of-thousands)
  -> does not survive.  The throughput trick is to NOT do that:
     score caching + equivalence classes + relaxed randomized
     machine selection (score a good-enough random subset)`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you treat scheduling <em>throughput</em> as the hard problem, not just placement quality, and
          whether you know priority plus preemption plus quota is how you run at high utilization safely. "Score
          every machine and pick the best" is the mid-level answer.
        </Callout>
      </Block>

      <Block eyebrow="API & data model" title="Job specs in, placements out, state replicated">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Submit</strong> a job spec (resource requirements, constraints, priority, quota). The
          scheduler assigns tasks to machines; per-machine agents (Borglets) run them and report state. The
          master's state, jobs, allocations, machine state, quota, is replicated so a failover loses nothing.
        </p>
      </Block>

      <Block eyebrow="architecture" title="Scheduler, agents, and a replicated master store">
        <CodeBlock
          title="text"
          lang="text"
          code={`users --job specs--> [ scheduler ] --scored placement--> machines (agents)
                        pending queue    |                    run tasks,
                        score cache      |                    report state
                        equivalence      +-- preempt lower-priority (batch)
                        classes              to admit higher-priority (prod)
                          |
                   [ Paxos-replicated master store ]  jobs, allocations, quota
                        survives leader failover; agents keep running meanwhile`}
        />
      </Block>

      <Block eyebrow="the crux decisions" title="Architecture, throughput, and packing">
        <OpTable
          cols={["Decision", "Choice", "", "Why / trade"]}
          rows={[
            { op: "Scheduler architecture", avg: "centralized -> optimistic (Omega)", avgTone: "ok", why: "One scheduler is simple but a throughput bottleneck; Omega uses optimistic concurrency over shared cell state so multiple schedulers run in parallel and resolve conflicts. Trade simplicity for throughput at scale." },
            { op: "Placement", avg: "relaxed randomized + caching", avgTone: "good", why: "Score a random subset, cache scores, and group identical requests into equivalence classes so one decision serves many tasks. Slightly worse placement, linear throughput." },
            { op: "Bin-packing", avg: "pack prod, spread replicas", avgTone: "ok", why: "Pack for utilization with over-commit and reclamation; spread a job's replicas across failure domains for fault tolerance. Multi-dimensional resources (CPU, RAM, disk) make it a vector packing problem." },
          ]}
        />
      </Block>

      <Block eyebrow="reliability, utilization & observability" title="Priority, preemption, and quota buy utilization">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Priority + preemption</strong>: production tasks preempt batch, so batch fills the gaps and yields on demand, which is how you run hot without starving prod.</li>
          <li><strong>Quota admission</strong>: you cannot schedule beyond your quota, which stops one team reserving the fleet.</li>
          <li><strong>Over-commit + reclamation</strong>: reserve on request but reclaim unused resources, pushing real utilization up.</li>
          <li><strong>Stragglers</strong>: backup or speculative tasks cover the slow tail; the replicated master survives failover. Observe scheduling latency, pending depth, preemption rate, utilization, and fragmentation.</li>
        </ul>
      </Block>

      <Block eyebrow="failure modes & the evolution path" title="Throughput collapse, preemption storms, fragmentation">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Scheduling-throughput collapse / head-of-line</strong>: with millions pending, a slow per-task decision blocks the queue; shard the scheduler (Omega-style) and cache scores so no single decision stalls the pipeline.</li>
          <li><strong>Preemption storms / priority inversion</strong>: aggressive preemption oscillates; rate-limit preemptions and respect graceful shutdown.</li>
          <li><strong>Fragmentation + stragglers</strong>: multi-dimensional packing leaves unusable holes; defragment by rescheduling, and use backup tasks for the slow tail.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          <strong>Evolution</strong>: MVP is a single centralized scheduler with priority and quota. Scale to
          optimistic or sharded scheduling with score caching and equivalence classes, then add over-commit and
          reclamation to push utilization higher.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Millions of tasks are pending. Why doesn't the scheduler melt?</strong> Because it does not
            score every machine for every task: it caches scores, groups identical requests into equivalence
            classes, and picks from a relaxed random subset that is good enough. Placement quality drops
            slightly; throughput stays roughly linear.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you run at high utilization without starving production?</strong> Priority plus
            preemption plus quota: batch fills the gaps and prod preempts it when needed, over-commit reclaims
            reserved-but-unused capacity, and quota admission stops anyone reserving beyond their share.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The scheduler master dies mid-decision. What happens?</strong> Its state is
            Paxos-replicated, so a new leader is elected and resumes from committed state and in-flight
            decisions are re-derived. Machines keep running their current tasks meanwhile, so a scheduler
            outage pauses new placement, not running work.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Two schedulers pick the same machine in Omega. Now what?</strong> Optimistic concurrency:
            they operate on shared cell state and commit transactionally; the loser detects the stale write and
            retries with fresh state. Conflicts are rare enough that parallel throughput wins.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "This is Borg, and the hard problem is scheduling throughput, not placement quality. Scoring every
          machine for every task is quadratic and dies at scale, so I cache scores, group identical requests
          into equivalence classes, and pick from a relaxed random subset. I run hot with priority, preemption,
          and quota, prod preempts batch, over-commit reclaims unused resources, and I bin-pack for utilization
          while spreading a job's replicas for fault tolerance. The master state is Paxos-replicated so
          failover loses nothing, and I scale from a centralized scheduler to an optimistic Omega-style sharded
          one."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The prompt looks like a placement problem but the real constraint is throughput: millions of pending
          tasks against tens of thousands of machines means scoring every machine for every task is
          quadratic and cannot keep up. So the core trick is to avoid that, cache scores, group identical
          requests into equivalence classes so one scoring decision serves many tasks, and select from a
          relaxed random subset of machines that is good enough rather than optimal. To run at high utilization
          safely I lean on priority, preemption, and quota: production tasks preempt batch so batch fills the
          gaps and yields on demand, quota admission stops any team from reserving the fleet, and over-commit
          with reclamation harvests reserved-but-unused capacity. Bin-packing is multi-dimensional across CPU,
          memory, and disk, and I pack production tightly for efficiency while spreading a single job's replicas
          across failure domains for fault tolerance. The master's state, jobs, allocations, quota, is
          Paxos-replicated, so a leader failover resumes from committed state while agents keep running their
          current tasks, meaning a scheduler outage pauses new scheduling, not running work. My top failure
          modes are throughput collapse and head-of-line blocking at millions pending, handled by sharding the
          scheduler Omega-style and caching; preemption storms and priority inversion, handled by rate-limiting
          preemptions; and fragmentation and stragglers, handled by defragmenting reschedules and backup tasks.
          I would start centralized and evolve to optimistic, sharded scheduling as the queue grows."
        </Callout>
      </Block>
    </>
  );
}

/* ── Config service (Chubby) ─────────────────────────────────── */
function Config() {
  return (
    <>
      <Lede>
        "Design a service that holds the small pieces of critical state a fleet depends on, leader election,
        distributed locks, and config that must never be inconsistent. Thousands of clients read it
        constantly; writes are rare but must be correct across data-center failures." This is Chubby, built on
        Paxos, and the senior signal is fencing tokens.
      </Lede>

      <Block eyebrow="requirements & scale" title="Reads dominate, keep the cell tiny">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional</strong>: a strongly-consistent small key-value store with locks, leader election,
          and watch/notify. <strong>NFR</strong>: linearizable writes, high read availability, correctness
          across failure domains, and a small blast radius. The sizing facts are that <strong>reads vastly
          dominate writes</strong> and the data is kilobytes, not gigabytes, so the consensus group stays small
          and bulk data lives elsewhere.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          That you reach for consensus (Paxos or Raft) for the critical state <em>and</em> know the operational
          traps: fencing tokens, the watch-herd on failover, and keeping the quorum small. Naming Paxos is
          table stakes; fencing tokens is the staff-level tell.
        </Callout>
      </Block>

      <Block eyebrow="API & data model" title="Small nodes, locks, watches, and fencing tokens">
        <p className="text-ink-dim leading-relaxed mb-2">
          Open, read, and write small nodes; acquire and release <strong>coarse-grained locks</strong>;{" "}
          <strong>watch</strong> a node to receive an invalidation instead of polling; hold a{" "}
          <strong>session</strong> with a lease. Every lock grant returns a monotonically increasing{" "}
          <strong>fencing token</strong> (a generation number) that the protected resource checks.
        </p>
      </Block>

      <Block eyebrow="architecture" title="A small Paxos cell with a leader">
        <CodeBlock
          title="text"
          lang="text"
          code={`clients --RPC--> [ Chubby cell: 5 replicas ]  Paxos consensus
   cache + watch      1 elected LEADER handles writes
   session leases     4 followers replicate the log
      ^                    |
      | invalidations      +-- reads served via master lease + client cache
      +--------------------+
writes: leader -> Paxos quorum -> commit (linearizable)
locks:  grant returns a FENCING TOKEN (generation number)
        the protected resource rejects any write with a stale token`}
        />
      </Block>

      <Block eyebrow="the crux decisions" title="Consensus, read scaling, and watches">
        <OpTable
          cols={["Decision", "Choice", "", "Why / trade"]}
          rows={[
            { op: "Durability of writes", avg: "Paxos / Raft quorum", avgTone: "good", why: "A quorum survives minority failure with no data loss and gives linearizability; async primary-backup is faster but can lose writes or split-brain. For critical state, consensus." },
            { op: "Read scaling", avg: "master lease + client cache", avgTone: "ok", why: "Routing all reads through the leader is simple but caps throughput; Chubby serves reads locally under the master lease plus aggressive client caching with invalidations. Trade a little staleness for scale." },
            { op: "Change delivery", avg: "watch/notify + client cache", avgTone: "good", why: "Polling for changes hammers the cell; watch plus client cache plus invalidation delivers updates with far less load. The trade is a watch-herd on failover." },
            { op: "Lock safety", avg: "fencing tokens", avgTone: "good", why: "A lock alone cannot stop a paused ex-holder from writing; a monotonically increasing generation number that the resource checks makes stale writes impossible." },
          ]}
        />
      </Block>

      <Block eyebrow="reliability, consistency & observability" title="Bound staleness, keep bulk data out">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Consistency</strong>: linearizable writes through the leader; reads may be leased-fresh or slightly stale, and clients verify session validity so a partitioned client does not act on old state.</li>
          <li><strong>Config swaps</strong>: versioned, canaried, and atomic, clients flip a single version pointer rather than reading a half-written config.</li>
          <li><strong>Keep it small</strong>: the consensus group holds only critical state and pointers; bulk config lives in a scalable store, so cell health does not degrade with data volume.</li>
          <li><strong>Observe</strong>: leader elections, session churn, watch counts, and quorum health.</li>
        </ul>
      </Block>

      <Block eyebrow="failure modes & the evolution path" title="Split-brain, watch-herds, stale reads">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Split-brain / dual leaders without fencing</strong>: two nodes each believe they hold the lock; fencing tokens make the protected resource reject the stale holder. Always pair a lock with a fence.</li>
          <li><strong>Global SPOF + watch-herd</strong>: everything depends on the cell, and on failover all watchers reconnect at once; stagger and jitter reconnects, cache aggressively, and use coarse locks and long leases.</li>
          <li><strong>Stale / partitioned reads</strong>: a partitioned client may read old state; leases bound the staleness and session checks catch it.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          <strong>Evolution</strong>: MVP is a single Raft group with a small key-value API and sessions. Add
          watch/notify with client caching, then wider client caching for read scale, keeping the cell small. For the
          underlying consistency and replication building blocks, cross-link{" "}
          <a href="#/arch-fundamentals" className="font-mono text-xs" style={{ color: ACCENT }}>Architecture Fundamentals</a>{" "}
          (open "replication" and "consistency").
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A client holds a lock, pauses for a 30-second GC, its lease expires, another client takes
            the lock, then the first wakes and writes. Corruption?</strong> Not with fencing tokens: each grant
            carries a monotonically increasing generation number, the protected resource remembers the highest
            it has seen and rejects the paused client's stale token. The lock alone is insufficient; the fence
            is what makes it safe.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Everything depends on this service. Isn't it a giant SPOF?</strong> It is, so it is a small
            Paxos cell spread across failure domains with aggressive client caching, so most reads never reach
            it, and coarse-grained locks so lock and write traffic is low. The blast radius is bounded by
            keeping the cell tiny.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The leader fails and 100k clients reconnect at once. What breaks?</strong> The watch-herd:
            all sessions and watches re-establish simultaneously and can overwhelm the new leader. Mitigate
            with staggered, jittered reconnects, cached state that survives the blip, and long session leases so
            a brief election does not expire everyone.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why not store the whole service config here too?</strong> Because consensus throughput and
            cell health degrade with data volume. Chubby holds small critical state and a version pointer; the
            bulk config lives in a scalable store, and you flip the pointer atomically.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "This is Chubby on Paxos: a small, strongly-consistent store for critical state, locks, leader
          election, and config. A five-node Paxos cell across failure domains gives linearizable writes through
          an elected leader, and I scale reads with the master lease and client caching. Clients watch and cache instead
          of polling. The senior detail is fencing tokens: every lock grant returns a generation number the
          protected resource checks, so a paused ex-holder cannot corrupt state. I keep the cell tiny, bulk data
          lives elsewhere, and I plan for the watch-herd on failover with jittered reconnects and long leases."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The workload is reads-dominated critical state measured in kilobytes, so the design keeps a small
          consensus cell and pushes reads to caches. Writes go through an elected leader and a Paxos quorum, so
          they are linearizable and survive a minority failure with no loss, which async primary-backup cannot
          promise. Reads scale through the master lease and client caching with invalidations, trading a little bounded staleness
          for throughput, and clients verify their session so a partitioned client does not act on stale state.
          Instead of polling, clients watch nodes and cache, receiving invalidations, which keeps load off the
          cell. The decision I make sure to name is fencing: a distributed lock alone does not prevent a client
          that paused past its lease from waking up and writing, so every grant returns a monotonically
          increasing generation number, and the protected resource rejects any write carrying a stale token,
          which is what actually prevents split-brain corruption. I keep the cell small and put only critical
          state and a version pointer in it, with bulk config in a scalable store that I swap atomically by
          flipping the pointer, canaried and versioned. My top failure modes are split-brain without fencing,
          the service as a global SPOF with a watch-herd on failover, mitigated by jittered reconnects, caching,
          coarse locks, and long leases, and stale partitioned reads, mitigated by leases and session checks. I
          start with one Raft group and add watches and client caching as read load grows."
        </Callout>
      </Block>
    </>
  );
}

/* ── Object-storage metadata (Colossus) ──────────────────────── */
function Objstore() {
  return (
    <>
      <Lede>
        "GFS had a single metadata master that capped it at tens of petabytes. Design its successor, the
        metadata and control plane for an exabyte-scale storage system serving billions of objects, with no
        single bottleneck." This is Colossus, and the two moves are splitting the control plane from the data
        plane and sharding metadata into a scalable store.
      </Lede>

      <Block eyebrow="requirements & scale" title="The GFS wall was metadata in one master's RAM">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional</strong>: create, open, delete, locate, and stream object chunks; keep data
          durable and cheap. <strong>NFR</strong>: no single metadata bottleneck, high durability, low cost,
          and high metadata ops per second. The sizing facts are object count in the billions to trillions and
          <strong> metadata ops per byte</strong>, which is the small-file problem.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`GFS single master: whole namespace in one machine's RAM
  -> caps scale at tens of PB and its memory / QPS
Colossus fix: shard metadata into a scalable KV store (BigTable-like LSM)
  -> namespace scales horizontally, ~100x GFS object count`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you split the control plane from the data plane, clients stream bytes <em>directly</em> to
          chunkservers, not through a metadata server, and whether you know the small-file problem and the
          erasure-coding versus replication trade.
        </Callout>
      </Block>

      <Block eyebrow="API & data model" title="Curators for metadata, direct byte path to D">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Open/create/delete</strong> go to a <strong>curator</strong>, which returns chunk handles and
          locations; the client then <strong>streams bytes directly</strong> to and from the D chunkservers,
          with no metadata server in the byte path. Metadata, the namespace and chunk map, lives in a sharded
          LSM key-value store (BigTable-like).
        </p>
      </Block>

      <Block eyebrow="architecture" title="Control plane and data plane, split">
        <CodeBlock
          title="text"
          lang="text"
          code={`client --open/create--> [ CURATORS ]  metadata / control plane
   |                         (sharded)
   |                            |
   |                     [ metadata store ]  sharded LSM KV (BigTable-like)
   |                      namespace + chunk map, ~100x GFS scale
   |
   +--stream bytes DIRECT--> [ D chunkservers ]  data plane
        (NO metadata server      Reed-Solomon erasure stripes
         in the byte path)       background rebalance + reconstruction`}
        />
      </Block>

      <Block eyebrow="the crux decisions" title="Shard metadata, pick LSM, erasure-code cold">
        <OpTable
          cols={["Decision", "Choice", "", "Why / trade"]}
          rows={[
            { op: "Metadata scale", avg: "sharded KV, not one master", avgTone: "good", why: "One master caps scale at its RAM; sharding metadata into a BigTable-like store removes the bottleneck at the cost of complexity. That shard is the whole point of Colossus over GFS." },
            { op: "Metadata engine", avg: "LSM tree", avgTone: "ok", why: "LSM is write-optimized (sequential writes, background compaction) and suits high metadata write rates; a B-tree favors reads and in-place updates. Metadata ops skew write-heavy, so LSM." },
            { op: "Durability", avg: "erasure coding for cold", avgTone: "good", why: "Triple replication is simple and fast to recover but 3x cost; Reed-Solomon is roughly 1.3 to 1.5x cost but heavier recovery I/O. Replicate hot data, erasure-code cold data." },
          ]}
        />
      </Block>

      <Block eyebrow="reliability, cost & observability" title="Keep the byte path off the metadata server">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Control/data-plane split</strong> means throughput scales with chunkservers, independent of metadata QPS, and a metadata hiccup does not stall in-flight byte streams.</li>
          <li><strong>Durability</strong>: erasure stripes placed across independent failure domains, with background reconstruction of lost shards.</li>
          <li><strong>Cost</strong>: erasure coding plus temperature tiering is the dominant lever; put it on the board.</li>
          <li><strong>Small files</strong>: pack and batch small objects and shard the namespace so no single range is hot. Observe metadata op latency, hot shards, and reconstruction backlog.</li>
        </ul>
      </Block>

      <Block eyebrow="failure modes & the evolution path" title="Hotspots, small files, correlated loss">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Namespace / metadata hotspot</strong>: sequential-prefix keys (timestamps) or one hot directory concentrate load on a single shard; hash or salt keys and split hot ranges.</li>
          <li><strong>Small-file explosion</strong>: millions of tiny objects blow up metadata ops per byte and make the metadata store, not the disks, the bottleneck; pack small files and batch metadata operations.</li>
          <li><strong>Correlated failures beyond the stripe</strong>: an (n, k) Reed-Solomon stripe survives n minus k losses; a correlated failure-domain event can exceed that, so place stripes across independent domains and monitor.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          <strong>Evolution</strong>: MVP is a GFS-style single master for a few petabytes. Scale by sharding
          metadata into a KV store fronted by curators, then add erasure coding and background reconstruction
          for cost and durability.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How does this beat GFS's single-master limit?</strong> GFS kept the whole namespace in one
            master's memory. Colossus shards metadata into a BigTable-like LSM store, so the namespace scales
            horizontally across many servers instead of one machine's RAM, roughly 100x the objects.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Does every read go through a metadata server?</strong> No, and that is the key: a client
            hits a curator once to resolve locations, then streams bytes directly to and from the chunkservers.
            Keeping the metadata plane off the byte path lets throughput scale independently of metadata QPS.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A customer stores a billion 1 KB files. What breaks?</strong> The small-file problem:
            metadata ops per byte go through the roof and the metadata store, not the disks, becomes the
            bottleneck. Defenses are packing small objects together, batching metadata operations, and sharding
            the namespace so no single range is hot.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Replication or erasure coding?</strong> Both, by temperature: triple replication for hot
            data where recovery speed and read fan-out matter, Reed-Solomon erasure coding for cold data to cut
            storage to roughly 1.3x, accepting heavier reconstruction I/O, with stripes across independent
            failure domains so a correlated outage cannot exceed the parity.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "This is Colossus, the GFS successor. Two moves. First, split the control plane from the data plane:
          clients hit a curator once to resolve chunk locations, then stream bytes directly to the D
          chunkservers, so throughput scales with chunkservers, not a metadata master. Second, shard metadata
          into a BigTable-like LSM key-value store instead of one master's RAM, which is what breaks the GFS
          scale wall for about 100x the objects. Cold data is Reed-Solomon erasure-coded across failure domains
          for roughly 1.3x cost. My top failures are metadata hotspots, the small-file problem, and correlated
          loss beyond the stripe."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "GFS was limited by a single master holding the whole namespace in memory, so it capped out at tens of
          petabytes. Colossus fixes that two ways. First, it splits the control plane from the data plane: a
          client asks a curator to open, create, or delete and gets back chunk handles and locations, then
          streams the actual bytes directly to and from the D chunkservers with no metadata server in the byte
          path, so data throughput scales with the number of chunkservers and is decoupled from metadata QPS.
          Second, it shards the metadata itself into a scalable BigTable-like LSM key-value store rather than one
          master's RAM, which is what lets the namespace grow horizontally to roughly a hundred times the object
          count, and I choose LSM because metadata operations are write-heavy and LSM is write-optimized with
          background compaction. For durability and cost I tier by temperature: hot data triple-replicated for
          fast recovery and read fan-out, cold data Reed-Solomon erasure-coded at roughly 1.3 to 1.5x storage,
          accepting heavier reconstruction I/O, and I place stripes across independent failure domains with
          background rebalancing and reconstruction. My top failure modes are namespace or metadata hotspots
          from sequential keys or a hot directory, fixed by salting keys and splitting ranges; the small-file
          problem where metadata ops per byte explode, fixed by packing and batching and namespace sharding; and
          correlated failures exceeding the erasure stripe, fixed by failure-domain-aware placement and
          monitoring. I would evolve from a GFS-style single master to sharded metadata behind curators, then add
          erasure coding."
        </Callout>
      </Block>
    </>
  );
}

/* ── Petabyte processing (Dataflow) ──────────────────────────── */
function Dataproc() {
  return (
    <>
      <Lede>
        "Design a system that processes petabytes as a batch job and the same logic as a low-latency stream,
        with correct results on late, out-of-order data and exactly-once outputs." This is Dataflow, on the
        Beam model, descended from FlumeJava and MillWheel, and the scaling bottleneck is the shuffle.
      </Lede>

      <Block eyebrow="requirements & scale" title="The shuffle is the bottleneck">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional</strong>: parallel transforms, grouping and joins, windowing, over both bounded
          (batch) and unbounded (stream) input. <strong>NFR</strong>: exactly-once outputs, correctness under
          out-of-order and late data, autoscaling, and straggler tolerance. The sizing variables are{" "}
          <strong>shuffle volume and key skew</strong>, and watermark and state size, everything about
          performance is reducing or balancing the all-to-all shuffle.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you can talk about the streaming model precisely, event-time versus processing-time,
          watermarks, and triggers, and how exactly-once is actually achieved, idempotence plus dedup plus
          checkpoints, rather than treated as a magic flag.
        </Callout>
      </Block>

      <Block eyebrow="API & data model" title="Transforms over collections, windowed by event time">
        <p className="text-ink-dim leading-relaxed mb-2">
          A pipeline is a graph of transforms over collections. The streaming model answers four questions:
          <strong> what</strong> is computed (the transforms), <strong>where</strong> in event time (windowing:
          fixed, sliding, session), <strong>when</strong> results fire (watermarks and triggers), and{" "}
          <strong>how</strong> refinements accumulate. Per-key state and timers plus record IDs give
          exactly-once.
        </p>
      </Block>

      <Block eyebrow="architecture" title="Read, fuse, shuffle, sink, all under watermarks">
        <CodeBlock
          title="text"
          lang="text"
          code={`sources --> [ read ] --> [ transforms, FUSED ] --> [ GroupByKey / shuffle ] --> [ sinks ]
 bounded or                parallel workers            the bottleneck               idempotent,
 unbounded                 dynamic work rebalance       combiner lifting             exactly-once
                                                        |
   event-time WINDOWING + WATERMARKS + TRIGGERS decide WHEN a window fires
   per-key state + timers;  MillWheel record IDs + checkpoints -> exactly-once`}
        />
      </Block>

      <Block eyebrow="the crux decisions" title="Event time, exactly-once, and the state store">
        <OpTable
          cols={["Decision", "Choice", "", "Why / trade"]}
          rows={[
            { op: "Time semantics", avg: "event-time + watermarks", avgTone: "good", why: "Processing-time is easy but wrong when data is late or out of order; event-time with watermarks gives correct windowing at the cost of buffering and watermark tracking." },
            { op: "Exactly-once", avg: "idempotent + dedup + checkpoint", avgTone: "ok", why: "Not magic: record IDs plus strongly-consistent state dedupe replays, checkpoints make it resumable, and the sink must be idempotent. Otherwise you get at-least-once." },
            { op: "State / output store", avg: "Bigtable vs Spanner", avgTone: "ok", why: "Bigtable (LSM, wide-column, high write throughput, single-row atomic) for high-volume keyed state; Spanner (TrueTime, external consistency, multi-row global transactions) when you need cross-row atomicity. Pick per consistency need." },
          ]}
        />
      </Block>

      <Block eyebrow="reliability, correctness & observability" title="Watermarks bound state, rebalancing beats stragglers">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Late data</strong>: watermarks estimate event-time progress and fire windows; allowed lateness defines a bounded grace period after which state is garbage-collected, a tunable correctness-versus-state trade.</li>
          <li><strong>Stragglers</strong>: dynamic work rebalancing splits an oversized bundle across idle workers instead of waiting on the slow one.</li>
          <li><strong>Autoscale</strong> on backlog and throughput; checkpoints make the pipeline resumable.</li>
          <li><strong>Observe</strong>: watermark lag, backlog, hot keys, and duplicate counts.</li>
        </ul>
      </Block>

      <Block eyebrow="failure modes & the evolution path" title="Skew, stuck watermarks, duplicates">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Data skew / hot keys in shuffle</strong>: one key gets most of the data and its worker stalls the stage; lift combiners to pre-aggregate before the shuffle, salt or split the hot key, and rebalance.</li>
          <li><strong>Stuck watermark / unbounded state</strong>: late data or open session windows keep state growing without bound; set allowed lateness, garbage-collect, and alert on watermark lag.</li>
          <li><strong>Duplicates or loss</strong>: at-least-once delivery into a non-idempotent sink double-counts; require idempotent sinks and aligned checkpoints.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          <strong>Evolution</strong>: MVP is a batch pipeline over bounded input, no watermarks. Add streaming
          with event-time windowing and watermarks, then exactly-once sinks and autoscaling as latency and
          correctness needs grow. For hands-on watermark and sessionization practice, cross-link{" "}
          <a href="#/design-room" className="font-mono text-xs" style={{ color: ACCENT }}>The Design Room</a>{" "}
          (open "clickstream lakehouse").
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How is exactly-once actually achieved?</strong> Idempotence plus deduplication plus
            checkpointing, not a flag. Each record carries an ID (MillWheel-style), state is strongly consistent
            so replays are deduped, checkpoints make the pipeline resumable, and crucially the sink must be
            idempotent, otherwise you get at-least-once.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Data arrives hours late. Drop it or wait forever?</strong> Neither: watermarks estimate
            event-time progress and fire windows, and allowed lateness sets a bounded grace period during which
            late data updates results, after which state is garbage-collected. It is a tunable trade between
            correctness and unbounded state.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>One key has 90% of the traffic. What happens?</strong> Shuffle skew: that key's worker
            becomes a straggler and stalls the stage. I lift combiners to pre-aggregate before the shuffle, salt
            or split the hot key, and rely on dynamic work rebalancing to break up the oversized bundle.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Bigtable or Spanner for the output?</strong> Depends on the consistency need: Bigtable for
            high-throughput, single-row-atomic keyed writes, which covers most streaming aggregates; Spanner
            when I need multi-row transactions with external consistency, paying TrueTime commit latency for it.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "This is Dataflow on the Beam model: one pipeline that runs as batch or stream. The model is
          what/where/when/how, transforms, event-time windowing, watermarks and triggers, and accumulation, so
          late and out-of-order data are handled correctly with allowed lateness bounding state. Exactly-once is
          idempotence plus dedup by record ID plus checkpoints, and the sink must be idempotent. The scaling
          bottleneck is the shuffle, so I fuse stages, lift combiners, and rebalance stragglers dynamically, and
          I pick Bigtable or Spanner for state by whether I need multi-row transactions."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The prompt is unify batch and streaming, and the Beam model does it by separating four questions:
          what is computed, where in event time via windowing, when results fire via watermarks and triggers,
          and how refinements accumulate. Using event-time rather than processing-time is what makes results
          correct when data is late or out of order, and watermarks estimate how far event time has progressed
          so windows can fire, with allowed lateness giving a bounded grace period before state is
          garbage-collected, which is the knob between correctness and unbounded state. Exactly-once is not a
          magic flag: each record carries an ID in the MillWheel lineage, strongly-consistent per-key state
          dedupes replays, checkpoints make the pipeline resumable, and the sink itself must be idempotent,
          otherwise you fall back to at-least-once and double-count. Performance is dominated by the shuffle,
          the all-to-all movement in a group-by or join, so I fuse adjacent transforms, lift combiners to
          pre-aggregate before the shuffle, and use dynamic work rebalancing to split an oversized straggler
          bundle across idle workers. For state and outputs I choose Bigtable when I need high-throughput,
          single-row-atomic keyed writes, and Spanner when I genuinely need multi-row external-consistency
          transactions and can pay the TrueTime commit latency. My top failure modes are data skew and hot keys
          stalling the shuffle, a stuck watermark growing state without bound, and duplicates or loss without
          idempotent sinks and aligned checkpoints. I would start batch and layer streaming, exactly-once, and
          autoscaling on."
        </Callout>
      </Block>
    </>
  );
}

/* ── Zero-downtime migration ─────────────────────────────────── */
function Migration() {
  return (
    <>
      <Lede>
        "We are moving a live, high-write datastore to a new backend in another region. We cannot take
        downtime, we cannot lose a write, and we need a rollback if it goes wrong. Walk me through it." The
        whole answer is an incremental, reversible sequence with a hard verification gate.
      </Lede>

      <Block eyebrow="requirements & scale" title="The risk lives in two numbers">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional</strong>: migrate schema, data, and traffic with no downtime; verify correctness;
          roll back on failure. <strong>NFR</strong>: zero data loss, read-after-write preserved, bounded
          source load, and instant rollback. The sizing variables are the <strong>write rate</strong> you must
          keep mirroring and the <strong>replication lag at cutover</strong>, cutover is safe only when lag goes
          to zero and reconciliation mismatches are zero.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you make it incremental and reversible with a hard verification gate, and whether you keep a
          rollback path live <em>after</em> cutover. Big-bang and "we will verify later" are the fails; the
          senior answer is expand/contract with reconciliation.
        </Callout>
      </Block>

      <Block eyebrow="API & data model" title="Parallel change: expand, then contract">
        <p className="text-ink-dim leading-relaxed mb-2">
          Schema changes use <strong>expand/contract (parallel change)</strong>: make additive, nullable
          changes so the schema is always compatible with the running code, migrate, then remove the old shape.
          Data moves by <strong>dual-write</strong> or <strong>log-based CDC</strong>, backfilled and
          reconciled before any traffic flips.
        </p>
      </Block>

      <Block eyebrow="architecture" title="The six-step sequence with a rollback net">
        <CodeBlock
          title="text"
          lang="text"
          code={`1 EXPAND     add new store + additive/nullable schema (compatible with old code)
2 DUAL-WRITE app writes BOTH  (or log-based CDC tails the old store's WAL)
3 BACKFILL   chunked, rate-limited, idempotent, resumable copy old -> new
4 VERIFY     reconcile: row counts + checksums + invariants + shadow reads
                (block cutover until mismatches = 0 AND replication lag -> 0)
5 CUTOVER    brief read-only freeze -> flip read flag/route to new
6 CONTRACT   keep REVERSE replication for rollback, then retire old
rollback at any step = flip reads back (old still written and replicated)`}
        />
      </Block>

      <Block eyebrow="the crux decisions" title="Dual-write vs CDC, and the cutover gate">
        <OpTable
          cols={["Decision", "Choice", "", "Why / trade"]}
          rows={[
            { op: "Mirroring method", avg: "CDC for bulk, dual-write at cutover", avgTone: "ok", why: "Dual-write is simple but non-atomic and diverges on partial failure; log-based CDC tails the source log, atomic-ish and app-decoupled, but adds lag. Common answer: CDC for the bulk plus dual-write in the tight cutover window." },
            { op: "Schema change", avg: "expand/contract", avgTone: "good", why: "Big-bang flips everything with no cheap rollback; expand/contract keeps the schema compatible with running code so every step is independently deployable and reversible." },
            { op: "When to cut over", avg: "the verification gate decides", avgTone: "good", why: "Cut over only when reconciliation mismatches are zero and replication lag is near zero. The gate, not the calendar, sets the date, and I would rather slip than flip while behind." },
          ]}
        />
      </Block>

      <Block eyebrow="reliability, verification & observability" title="Reconcile hard, keep the old path writable">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Backfill</strong> is bounded-rate, chunked, idempotent, and resumable, so it neither overloads the source nor restarts from scratch.</li>
          <li><strong>Reconciliation</strong> compares row counts, column checksums, business invariants, and shadow reads (read new, compare to old, still serve old).</li>
          <li><strong>Cutover</strong> is a brief read-only freeze then a flag or route flip, so no write is lost at the moment of the switch.</li>
          <li><strong>Rollback</strong>: reverse replication keeps the old store current after cutover, so rollback is a one-line read flip. Observe lag, mismatch count, and backfill progress.</li>
        </ul>
      </Block>

      <Block eyebrow="failure modes & the evolution path" title="Divergence, lag, and no way back">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Dual-write divergence</strong>: one write succeeds and the other fails, silently splitting the stores; reconcile continuously and prefer CDC where correctness is critical.</li>
          <li><strong>Replication lag at cutover</strong>: flipping while behind loses recent writes and breaks read-after-write; gate the cutover on lag reaching zero.</li>
          <li><strong>No rollback + backfill overload</strong>: keep reverse replication so rollback is a flag flip, and rate-limit the backfill so it does not knock over the source.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          <strong>Evolution</strong>: for a small store, a maintenance-window copy is fine; for zero downtime,
          run the full expand, dual-write or CDC, backfill, reconcile, cutover, contract sequence with reverse
          replication, applied per table or shard. For the strangler-fig and 6 R's framing, cross-link{" "}
          <a href="#/architect-role" className="font-mono text-xs" style={{ color: ACCENT }}>Architect's Role &amp; Decisions</a>{" "}
          (open "Migration: strangler fig &amp; 6 R's").
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Dual-write means two writes that can diverge. How do you stay consistent?</strong> Accept
            that dual-write is not atomic and lean on continuous reconciliation to catch drift, with idempotent,
            replayable writes. Where correctness is critical I prefer log-based CDC from the source, one source
            of truth, fewer races, and use dual-write only in the short cutover window.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>When exactly is it safe to cut over?</strong> When the verification gate is green:
            reconciliation mismatches are zero across counts, checksums, and business invariants, and
            replication lag has fallen to near zero. The date is decided by the gate, not the calendar.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>It goes wrong an hour after cutover. Can you roll back?</strong> Yes, because I kept reverse
            replication running from new back to old and never stopped writing the old path during the soak, so
            rollback is a single read-flag flip, not a restore from backup. Cheap, instant rollback is the whole
            point of the parallel-change shape.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The backfill is hammering the production source. Now what?</strong> It is rate-limited,
            chunked, idempotent, and resumable by design, so I throttle it further or pause and resume without
            restarting, and I run it against a read replica where possible so the live source is not the one
            being scanned.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Migration is risk management, so I go incremental and reversible with a hard verification gate. Schema
          uses expand/contract so it is always compatible with running code. Data mirrors via log-based CDC for
          the bulk plus dual-write in the cutover window, backfilled with a rate-limited, idempotent, resumable
          job. I reconcile on counts, checksums, invariants, and shadow reads, and I only cut over when
          mismatches are zero and replication lag is near zero. Cutover is a brief read-only freeze and a flag
          flip, and I keep reverse replication live so rollback is a one-line read flip, not a restore."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I treat this as a risk-management problem where every step must be small and reversible. Schema
          changes go through expand/contract, I make additive, nullable changes so the database is always
          compatible with the running code, migrate readers, then contract away the old shape, so each step is
          independently deployable and reversible. For the data, I mirror the live store: dual-write is simple
          but not atomic and diverges on a partial failure, while log-based CDC tails the source's write-ahead
          log, is atomic-ish, and decouples the apps at the cost of some lag, so the common shape is CDC for the
          bulk historical and steady-state plus dual-write in the tight cutover window. I backfill history with a
          job that is bounded-rate, chunked, idempotent, and resumable so it neither overloads the source nor
          restarts from scratch, and I run it against a replica where I can. The gate before any traffic moves is
          reconciliation, row counts, column checksums, business invariants, and shadow reads where I read the
          new store and compare to the old while still serving the old, and I do not cut over until mismatches
          are zero and replication lag is near zero, the gate decides the date, not the calendar. Cutover is a
          brief read-only freeze and then a flag or route flip so no write is lost at the switch, and crucially I
          keep reverse replication running from the new store back to the old during the soak, so if anything
          goes wrong rollback is a single read-flag flip rather than a restore from backup. My top failure modes
          are dual-write divergence, replication lag at cutover, and having no rollback path, and the design
          answers each."
        </Callout>
      </Block>
    </>
  );
}

/* ── Multi-tenant LLM inference ──────────────────────────────── */
function Inference() {
  return (
    <>
      <Lede>
        "Design a multi-tenant LLM inference service on a fixed pool of accelerators. Tenants have per-request
        TTFT and TPOT SLOs, you have to keep the expensive GPUs or TPUs busy, and no tenant can starve
        another." The constraint is KV-cache memory, and the scheduler doing continuous batching is the core.
      </Lede>

      <Block eyebrow="requirements & scale" title="Schedule on KV-cache memory, not CPU">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional</strong>: serve token generation for many models and tenants; meet latency SLOs;
          isolate tenants. <strong>NFR</strong>: high accelerator utilization, per-class TTFT (time to first
          token) and TPOT (time per output token) SLOs, fairness, and many models and adapters. The sizing
          variable is <strong>KV-cache memory</strong>, which grows with context length times concurrency, not
          CPU.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you know continuous (iteration-level) batching and KV-cache management are the core, and that
          you autoscale on KV-cache utilization and queue depth, not CPU. CPU-based autoscaling for LLM serving
          is a red flag, the box can be CPU-idle while accelerator memory is saturated.
        </Callout>
      </Block>

      <Block eyebrow="API & data model" title="Token stream out, paged KV-cache per sequence">
        <p className="text-ink-dim leading-relaxed mb-2">
          <code className="font-mono">generate(tenant, model, prompt, params)</code> returns a token stream.
          The scheduler maintains a <strong>running batch</strong> and per-sequence KV-cache blocks. Prefill
          processes the whole prompt in parallel (compute-bound, sets TTFT); decode emits one token per step
          (memory-bandwidth-bound, sets TPOT).
        </p>
      </Block>

      <Block eyebrow="architecture" title="Router, continuous-batching scheduler, paged KV">
        <CodeBlock
          title="text"
          lang="text"
          code={`requests --> [ admission + router ]  by model / size / LoRA adapter, SLO class
                    |
            [ CONTINUOUS-BATCHING scheduler ]  new requests join the running
                    |                            batch each DECODE step
            [ accelerator workers ]  PagedAttention KV-cache (paged blocks),
                    |                 prefix/prompt cache, chunked prefill
            prefill (compute-bound, TTFT) | decode (mem-bandwidth-bound, TPOT)
                    |  (optionally DISAGGREGATED prefill / decode pools)
   autoscale on KV-cache utilization / queue depth / batch fullness (NOT CPU)`}
        />
      </Block>

      <Block eyebrow="the crux decisions" title="Batching, KV memory, and the autoscale signal">
        <OpTable
          cols={["Decision", "Choice", "", "Why / trade"]}
          rows={[
            { op: "Batching", avg: "continuous (iteration-level)", avgTone: "good", why: "Static batching waits to fill a batch and blocks on the slowest sequence; continuous batching lets new requests join and finished ones leave every decode step, hugely raising utilization. This scheduler is the core of the system." },
            { op: "KV-cache memory", avg: "PagedAttention + prefix cache", avgTone: "good", why: "Contiguous KV allocation fragments and wastes memory; paged non-contiguous blocks give near-zero fragmentation, and prefix/prompt caching reuses shared system prompts. Chunked prefill stops a huge prompt monopolizing a step." },
            { op: "Autoscale signal", avg: "KV-cache / queue depth", avgTone: "ok", why: "CPU is the wrong signal; scale on KV-cache utilization, queue depth, and batch fullness, with warm pools for cold-start. Scaling on CPU both over- and under-provisions and misses SLOs." },
          ]}
        />
      </Block>

      <Block eyebrow="reliability, fairness & observability" title="Two SLO classes, per-tenant budgets">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>SLO classes</strong>: prefill is compute-bound and sets TTFT; decode is memory-bandwidth-bound and sets TPOT. Some designs disaggregate prefill and decode into separate pools sized independently.</li>
          <li><strong>Fairness</strong>: per-tenant KV-cache budgets and admission stop one tenant's huge context from consuming all memory.</li>
          <li><strong>Routing</strong>: by model, size, or LoRA adapter, with multi-host sharding for models too big for one accelerator.</li>
          <li><strong>Observe</strong>: KV-cache utilization, queue depth, TTFT and TPOT per tenant, and preemption rate.</li>
        </ul>
      </Block>

      <Block eyebrow="failure modes & the evolution path" title="OOM thrash, noisy neighbors, cold starts">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>KV-cache OOM / preemption thrash + head-of-line</strong>: a long generation holds cache and blocks others; preempt or swap paged blocks with care, cap max output tokens, and schedule to avoid head-of-line blocking.</li>
          <li><strong>Noisy neighbor</strong>: one tenant's huge context starves the rest; enforce per-tenant memory budgets and admission.</li>
          <li><strong>Cold-start / autoscale lag under scarcity</strong>: accelerators are slow to spin up and scarce; keep warm pools and scale on the right signal early so TTFT SLOs hold.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          <strong>Evolution</strong>: MVP is single-model continuous batching with paged KV on one node. Add
          prefix caching, chunked prefill, multi-model and LoRA routing, then disaggregated prefill/decode and
          multi-host sharding at scale. For the deeper LLM-serving system design, cross-link{" "}
          <a href="#/architect-bench" className="font-mono text-xs" style={{ color: ACCENT }}>The Architect's Bench</a>{" "}
          (open "Design: LLM serving").
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>What do you autoscale on, if not CPU?</strong> KV-cache utilization, queue depth, and batch
            fullness. An inference box can be CPU-idle while its accelerator memory is saturated, so CPU-based
            autoscaling both over- and under-provisions. The memory pressure of the KV cache is the true load
            signal.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>One request wants 100k tokens of context and 50 small requests are waiting. How do the
            small ones stay fast?</strong> Continuous batching lets the small requests join and finish across
            decode steps rather than waiting behind the big one, per-tenant KV-cache budgets stop the big
            context from consuming all memory, and chunked prefill breaks the huge prompt so it does not
            monopolize a step.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why is prefill different from decode?</strong> Prefill processes the whole prompt in
            parallel and is compute-bound, it sets TTFT; decode generates one token at a time and is
            memory-bandwidth-bound, it sets TPOT. Different bottlenecks, which is why some designs disaggregate
            them into separately sized pools.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The KV cache fills up mid-generation. What happens?</strong> Without care, OOM or preemption
            thrash. The scheduler preempts or swaps a sequence's paged KV blocks cheaply, caps max output
            tokens, and admits new work only when memory allows, so the system degrades by queueing rather than
            crashing.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "The constraint is KV-cache memory, not CPU, so the scheduler is the whole design. I use continuous,
          iteration-level batching so new requests join the running batch each decode step and finished ones
          leave, which keeps the accelerators busy. KV-cache is managed with PagedAttention for near-zero
          fragmentation plus prefix caching for shared prompts and chunked prefill. I separate prefill, which is
          compute-bound and sets TTFT, from decode, which is memory-bandwidth-bound and sets TPOT, enforce
          per-tenant memory budgets for fairness, and autoscale on KV-cache utilization and queue depth with
          warm pools, never on CPU."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The first thing I establish is that the scheduling resource is accelerator memory, specifically the
          KV cache, which grows with context length times concurrency, so I schedule and autoscale on that, not
          CPU, because a serving box can be CPU-idle while its accelerator memory is full. The core of the design
          is continuous, iteration-level batching: instead of forming a fixed batch and blocking on the slowest
          sequence, new requests join the running batch every decode step and completed ones leave immediately,
          which is what keeps expensive accelerators utilized. KV-cache management is the other half: I use
          PagedAttention so cache lives in non-contiguous blocks with near-zero fragmentation, prefix and prompt
          caching so shared system prompts are computed once, and chunked prefill so a giant prompt does not
          monopolize a step. I treat prefill and decode as different regimes, prefill is compute-bound and
          determines time to first token, decode is memory-bandwidth-bound and determines time per output token,
          so I run SLO classes and, at scale, disaggregate prefill and decode into separately sized pools. For
          multi-tenancy I route by model, size, or LoRA adapter, shard large models across hosts, and enforce
          per-tenant KV-cache budgets and admission so one tenant's huge context cannot starve others. Autoscale
          is on KV-cache utilization, queue depth, and batch fullness, with warm pools because accelerators are
          scarce and slow to start. My top failure modes are KV-cache OOM and preemption thrash with head-of-line
          blocking behind long generations, the noisy-neighbor starvation, and cold-start lag blowing the TTFT
          SLO, and the paged memory, budgets, and warm pools answer each."
        </Callout>
      </Block>
    </>
  );
}

/* ── Residency-aware alerting ────────────────────────────────── */
function Residency() {
  return (
    <>
      <Lede>
        "An EU customer under a data-residency mandate needs monitoring and alerting where telemetry and PII
        never leave the region, alerts keep firing even if your global control plane is down, and failover
        never moves data to a non-compliant region. Design it." The design is a data-classification problem
        wearing a systems costume.
      </Lede>

      <Block eyebrow="requirements & scale" title="Draw the residency line first">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional</strong>: ingest regional telemetry, evaluate alert rules, notify, all
          residency-compliant. <strong>NFR</strong>: data stays in-region, alerting survives a global outage,
          failover stays in-boundary, and operator access is auditable. The sizing decision is a{" "}
          <strong>data classification</strong>: which data is residency-bound (telemetry, PII) versus safe to
          aggregate globally (non-residency metadata).
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you split the control plane from the data plane on residency lines, and whether regions can
          alert <em>autonomously</em> so a global-plane outage does not silence them. Compliance plus autonomy is
          the signal; a single global pipeline that "keeps EU data in EU" by policy alone is the fail.
        </Callout>
      </Block>

      <Block eyebrow="API & data model" title="Global config, regional data and evaluation">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>global control plane</strong> authors rules and config and aggregates only non-residency
          metadata. Each <strong>regional data plane</strong> ingests telemetry, stores it in-region, evaluates
          alert rules in-region, and notifies. Placement is enforced by org-policy and data-boundary constraints
          (Assured Workloads, EU Data Boundary), not by convention.
        </p>
      </Block>

      <Block eyebrow="architecture" title="Split control and data planes on the boundary">
        <CodeBlock
          title="text"
          lang="text"
          code={`GLOBAL control plane (config, rule authoring, non-residency rollups)
   |  pushes rules DOWN                 ^ pulls only NON-residency metadata UP
   v                                    |
[ EU regional data plane ]  telemetry + PII stay in-region
   ingest -> regional store -> IN-REGION rule evaluation -> notify
   operator access via ACCESS JUSTIFICATIONS, encrypted, audited
   enforced by org-policy / EU Data Boundary / Assured Workloads
failover: EU -> EU only, NEVER to a non-compliant region
if global control plane is DOWN -> region keeps evaluating rules AUTONOMOUSLY`}
        />
      </Block>

      <Block eyebrow="the crux decisions" title="Split planes, evaluate in-region, fail over in-boundary">
        <OpTable
          cols={["Decision", "Choice", "", "Why / trade"]}
          rows={[
            { op: "Plane boundary", avg: "split control / data on residency", avgTone: "good", why: "A fully global design leaks residency data into aggregation and cross-region failover; splitting keeps config global but telemetry and PII regional. Mandatory for compliance." },
            { op: "Alert evaluation", avg: "autonomous, in-region", avgTone: "good", why: "Evaluating rules centrally means a global outage silences alerts; evaluating in-region keeps alerting alive when the control plane is down. Autonomy over central, at the cost of some duplicated rule engines." },
            { op: "Failover", avg: "in-boundary only (EU -> EU)", avgTone: "ok", why: "Normal DR fails over to the nearest healthy region; residency requires in-boundary only, accepting less failover headroom to stay compliant." },
          ]}
        />
      </Block>

      <Block eyebrow="reliability, compliance & observability" title="Enforce placement technically, aggregate only metadata">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Technical enforcement</strong>: org-policy and data-boundary constraints make the platform refuse to place residency-bound resources or route traffic outside the boundary, policy on paper is not a control.</li>
          <li><strong>Operator access</strong>: via access justifications, encrypted and audited, so support does not become an exfiltration path.</li>
          <li><strong>Global aggregation</strong>: only non-residency metadata, rule health and aggregate counts, crosses the boundary, classified and stripped or hashed first.</li>
          <li><strong>Observe</strong>: per-region rule health, boundary-policy violations, and failover targets.</li>
        </ul>
      </Block>

      <Block eyebrow="failure modes & the evolution path" title="Leaks, silence, and split-brain">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Residency violation during failover or aggregation</strong>: a cross-region failover or a global rollup pulls PII out of region; constrain failover to in-boundary and classify and strip data before any global aggregation.</li>
          <li><strong>Global control-plane outage silences alerting</strong>: if rules only run centrally, an outage blinds the region; run evaluation in-region so it is autonomous.</li>
          <li><strong>Cross-region split-brain</strong>: regions and the global plane disagree and produce duplicate or missed alerts; use clear ownership and idempotent notification.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          <strong>Evolution</strong>: MVP is a single-region compliant stack with everything in-region. Add a
          global control plane that handles only config and non-residency rollups, then in-boundary failover and
          autonomous in-region evaluation as availability needs grow.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>What actually keeps the data in region, a policy doc?</strong> No, technical enforcement:
            org-policy and data-boundary constraints (Assured Workloads, EU Data Boundary) that make the platform
            refuse to place residency-bound resources or route outside the boundary, plus encryption and access
            justifications for operator access. Policy on paper is not a control.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your global control plane has an outage. Do EU alerts stop?</strong> No, and that is the
            design point: alert-rule evaluation runs in-region, so regions keep ingesting, evaluating, and
            notifying autonomously. The global plane only authors config and aggregates non-residency metadata,
            so losing it degrades management, not alerting.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The EU region goes down. Where do you fail over?</strong> To another in-boundary EU region
            only, never to a non-compliant region, even if that means less capacity. Residency constrains the
            failover set; I would rather run degraded in-boundary than restore availability by violating the
            mandate.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What can you still aggregate globally?</strong> Only non-residency metadata: rule health,
            aggregate counts, and system telemetry with no PII or regulated content. Raw telemetry and PII stay
            regional; I classify data explicitly and strip or hash before anything crosses the boundary.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "This is a data-classification problem first: I split residency-bound telemetry and PII, which stay
          regional, from non-residency metadata, which can aggregate globally. So I split a global control plane
          that authors rules and config from regional data planes that ingest, store, and evaluate alert rules
          in-region. Placement is enforced technically by org-policy and data-boundary constraints, not by
          convention. Regions evaluate autonomously, so a global-plane outage does not silence alerting, and
          failover is EU to EU only, never to a non-compliant region. My top risk is a residency leak during
          failover or global aggregation, which the boundary constraints and classification prevent."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I start by drawing the residency line, because this is really a data-classification problem:
          telemetry and PII are residency-bound and must stay in region, while non-residency metadata like rule
          health and aggregate counts can move globally. That split maps onto the architecture: a global control
          plane authors alert rules and config and does only non-residency rollups, and each regional data plane
          ingests telemetry, stores it in region, evaluates the alert rules in region, and sends notifications.
          Crucially, placement is enforced technically, org-policy and data-boundary constraints such as Assured
          Workloads and the EU Data Boundary make the platform refuse to place residency-bound resources or
          route traffic out of the boundary, because a policy document is not a control, and operator access goes
          through access justifications, encrypted and audited, so support is not an exfiltration path. I make
          alert evaluation autonomous in each region so that if the global control plane has an outage, regions
          keep ingesting, evaluating, and alerting on their own, and losing the global plane degrades management
          rather than blinding the region. Failover is constrained to in-boundary regions only, EU to EU, even
          when that means less headroom, because restoring availability by moving data to a non-compliant region
          is not an option. My top failure modes are a residency violation during cross-region failover or
          global aggregation, prevented by in-boundary failover and classifying and stripping data before any
          rollup; a global outage silencing alerting, prevented by autonomous in-region evaluation; and
          cross-region split-brain producing duplicate or missed alerts, handled with clear ownership and
          idempotent notification."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ──────────────────────────────────── */
const DECK = [
  {
    q: "What is the seven-step Google design loop?",
    a: "Clarify requirements (with the SLO), scale-estimate only the numbers that change a decision, define the API and data model, draw the high-level architecture splitting control plane from data plane, deep-dive the two or three riskiest decisions, then failure and operations, then evolution (MVP to scale to migration).",
    tag: "framework",
  },
  {
    q: "What is the 'reliability spine' every choice should tie to?",
    a: "A user-facing SLO (availability, latency, freshness, durability), redundancy across failure domains, and a graceful-degradation story (serve stale, shed load, fail open, prune a zone). If you cannot name the SLO a component protects, you cannot justify the component.",
    tag: "framework",
  },
  {
    q: "Name Google's five Cloud Architecture Framework pillars.",
    a: "Operational excellence, security/privacy/compliance, reliability, cost optimization, and performance. Use them as active review lenses on the design, not a checklist recited at the end.",
    tag: "framework",
  },
  {
    q: "Telemetry backend: which Google system, and the crux decision?",
    a: "Monarch, a push-based, in-memory, regionalized time-series database. The crux: zonal leaves hold recent data in RAM with no synchronous Colossus or Spanner dependency in the write path, so monitoring stays more available than what it monitors; queries push down through root-then-zone mixers.",
    tag: "telemetry",
  },
  {
    q: "What is the number-one failure mode of a metrics system like Monarch?",
    a: "Cardinality explosion: one unbounded label (user_id, request_id) multiplies the series count and OOMs the leaves. Defend with per-tenant cardinality and ingest quotas and alerts on series growth. Plus the circular dependency: monitor the monitor with a separate minimal instance.",
    tag: "telemetry",
  },
  {
    q: "Global rate limiter: local buckets vs global counter vs Doorman?",
    a: "Local per-task buckets are cheap but cannot cap globally; a global counter is precise but a hot SPOF and adds a round trip. Doorman leases each client a share of the global budget, enforced locally and rebalanced, global correctness with local latency, degrading to local caps.",
    tag: "ratelimiter",
  },
  {
    q: "A rate limiter should fail open or closed, and what is retry amplification?",
    a: "Fail open for overload protection, so a limiter outage does not become a total outage (fail closed for abuse/security limits). Retry amplification is rejected clients retrying and multiplying load; contain it with per-client retry budgets, backoff with jitter, and cheap rejection.",
    tag: "ratelimiter",
  },
  {
    q: "Multi-tenant log search: the core structural decision?",
    a: "Split the write-heavy ingest path from the read-heavy query path. Index a curated set of fields (inverted index for text, columnar for aggregations) and keep raw payload cheap; store time-partitioned segments tiered hot/warm/cold to object storage; queries prune by time then scatter-gather.",
    tag: "logsearch",
  },
  {
    q: "How do you keep one noisy tenant from degrading log search for everyone?",
    a: "Per-tenant ingest queues with quotas and load shedding for the write path, and per-tenant query admission with timeouts, scan budgets, and cost caps for the read path. Isolation is a first-class constraint, not an afterthought.",
    tag: "logsearch",
  },
  {
    q: "Batch scheduler (Borg): why not score every machine, and how do you run hot?",
    a: "Scoring every machine per task is O(pending x machines) and dies at scale; instead cache scores, use equivalence classes, and pick from a relaxed random subset. Run at high utilization with priority, preemption, and quota (prod preempts batch) plus over-commit and reclamation.",
    tag: "scheduler",
  },
  {
    q: "What is the top scaling failure of a cluster scheduler?",
    a: "Scheduling-throughput collapse and head-of-line blocking when millions of tasks are pending, a single slow decision stalls the queue. Fix by sharding the scheduler (optimistic, Omega-style) and caching scores. The Paxos-replicated master survives failover without losing state.",
    tag: "scheduler",
  },
  {
    q: "Config/lock service (Chubby): what makes it correct, and what is a fencing token?",
    a: "A small Paxos/Raft cell across failure domains gives linearizable writes; reads scale via the master lease and client caching with invalidations. A fencing token is a monotonically increasing generation number returned on a lock grant; the protected resource rejects any write with a stale token, preventing a paused ex-holder from corrupting state.",
    tag: "config",
  },
  {
    q: "What goes wrong with distributed locks without fencing tokens?",
    a: "Split-brain: a client pauses past its lease, another takes the lock, the first wakes and writes, and both believe they hold it. The lock alone cannot stop the stale writer; only a fencing token the resource checks makes it safe.",
    tag: "config",
  },
  {
    q: "Object-storage metadata (Colossus): the two moves that beat GFS?",
    a: "First, split control plane from data plane, clients hit a curator once to resolve locations then stream bytes directly to D chunkservers, no metadata server in the byte path. Second, shard metadata into a BigTable-like LSM store instead of one master's RAM, roughly 100x the objects.",
    tag: "objstore",
  },
  {
    q: "What is the small-file problem in object storage?",
    a: "Millions of tiny objects make metadata ops per byte explode, so the metadata store, not the disks, becomes the bottleneck. Defenses: pack and batch small objects and shard the namespace so no single range is hot. Cold data uses Reed-Solomon erasure coding at ~1.3x versus 3x replication.",
    tag: "objstore",
  },
  {
    q: "Petabyte processing (Dataflow): how is exactly-once actually achieved?",
    a: "Idempotence plus deduplication plus checkpointing, not a magic flag: records carry IDs (MillWheel), strongly-consistent per-key state dedupes replays, checkpoints make it resumable, and the sink must be idempotent, otherwise you get at-least-once and double-count.",
    tag: "dataproc",
  },
  {
    q: "What is a watermark, and what problem does it solve?",
    a: "A watermark is an estimate of how far event-time has progressed, used to decide when a window can fire on out-of-order data. Allowed lateness gives a bounded grace period during which late data updates results before state is garbage-collected, the knob between correctness and unbounded state.",
    tag: "dataproc",
  },
  {
    q: "What is the scaling bottleneck in a Dataflow-style pipeline?",
    a: "The shuffle, the all-to-all data movement in a group-by or join, especially under key skew where one hot key stalls a worker. Reduce it with stage fusion and combiner lifting (pre-aggregate before the shuffle), salt hot keys, and use dynamic work rebalancing for stragglers.",
    tag: "dataproc",
  },
  {
    q: "Zero-downtime migration: what is expand/contract, and when do you cut over?",
    a: "Expand/contract (parallel change): make additive/nullable schema changes so it is always compatible with running code, dual-write or CDC, backfill, then contract away the old shape. Cut over only when reconciliation mismatches are zero and replication lag is near zero, keeping reverse replication so rollback is a read-flag flip.",
    tag: "migration",
  },
  {
    q: "Multi-tenant LLM inference: the core technique, and what do you autoscale on?",
    a: "Continuous (iteration-level) batching: new requests join the running batch each decode step, and the scheduler is the core. KV-cache uses PagedAttention (near-zero fragmentation) plus prefix caching. Autoscale on KV-cache utilization and queue depth, NOT CPU, the box can be CPU-idle while accelerator memory is full.",
    tag: "inference",
  },
  {
    q: "What is the top failure mode of an LLM serving system?",
    a: "KV-cache OOM and preemption thrash, with head-of-line blocking behind long generations, and the noisy-neighbor case where one tenant's huge context starves others. Defend with paged KV memory, per-tenant memory budgets and admission, chunked prefill, and warm pools for cold-start.",
    tag: "inference",
  },
  {
    q: "Residency-aware alerting: the two decisions that make it compliant and available?",
    a: "Split a global control plane (config, non-residency rollups) from regional data planes that keep telemetry and PII in-region and evaluate alert rules autonomously in-region, so a global outage does not silence alerting. Enforce placement with org-policy/data-boundary constraints, and fail over EU to EU only, never to a non-compliant region.",
    tag: "residency",
  },
];

function Quickfire() {
  return (
    <>
      <Lede>
        Twenty-two cards spanning the framework and all ten designs: name the Google system, its crux decision,
        and its top failure mode, plus the reliability spine, watermarks, fencing tokens, continuous batching,
        and expand/contract. Read the prompt, answer out loud in a sentence or two, then reveal and grade
        yourself. Out loud is the rep.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  framework: <Framework />,
  telemetry: <Telemetry />,
  ratelimiter: <Ratelimiter />,
  logsearch: <Logsearch />,
  scheduler: <Scheduler />,
  config: <Config />,
  objstore: <Objstore />,
  dataproc: <Dataproc />,
  migration: <Migration />,
  inference: <Inference />,
  residency: <Residency />,
  quickfire: <Quickfire />,
};

export default function GcpDesign() {
  const [active, setActive] = useState("framework");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="The design rounds · DESIGN IT"
      title="GCP System Design"
      subtitle="The Google design framework plus ten worked design sheets built on the real systems - Monarch, Doorman, Borg, Chubby, Colossus, Dataflow, Spanner - that an L6 infra round expects you to name and reason about."
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
