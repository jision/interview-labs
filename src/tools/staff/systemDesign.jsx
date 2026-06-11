import React from "react";
import { Callout, CodeBlock, Tag } from "../../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../../components/layout.jsx";
import ConsistentHashingViz from "./ConsistentHashingViz.jsx";

const ACCENT = "#d6a94c";
const { Block, Try } = withAccent(ACCENT);

/* Small reusable two-column "concept grid" matching the StaffBench card style. */
function ConceptGrid({ items }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2.5 mb-2">
      {items.map(([t, d]) => (
        <div
          key={t}
          className="rounded-lg p-3 border border-line"
          style={{ background: "color-mix(in srgb,#d6a94c 6%,transparent)" }}
        >
          <div className="font-mono text-xs font-semibold mb-1" style={{ color: ACCENT }}>
            {t}
          </div>
          <div className="text-sm text-ink-dim leading-snug">{d}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Scaling a Service ─────────────────────────────────────────── */
function Scaling() {
  return (
    <>
      <Lede>
        "Traffic 10×'d — how do you keep up?" Two directions:{" "}
        <strong>vertical</strong> (a bigger box) buys you time with zero code change but hits a hard
        ceiling and a single point of failure; <strong>horizontal</strong> (more boxes behind a load
        balancer) scales nearly without bound — but only if the service is{" "}
        <strong>stateless</strong>. The whole game is making each box interchangeable, then adding
        boxes.
      </Lede>

      <Block eyebrow="the two axes" title="Scale up vs scale out">
        <ConceptGrid
          items={[
            [
              "Vertical (scale up)",
              "Add CPU / RAM to one machine. Trivial — no architecture change. But you hit a hardware ceiling, pay a premium for the top SKU, and still have one box that can die.",
            ],
            [
              "Horizontal (scale out)",
              "Add identical machines behind a load balancer. Effectively unbounded, fault-tolerant (lose one of N), and uses cheap commodity boxes — at the cost of distributed-systems complexity.",
            ],
          ]}
        />
        <Callout kind="tip" title="The order of operations">
          Vertical first for the easy wins, then go horizontal once you need fault tolerance or have
          out-scaled a single box. The catch is that horizontal scaling{" "}
          <strong>only works if the service is stateless</strong> — so that's the real first step.
        </Callout>
      </Block>

      <Block eyebrow="the precondition" title="Make it stateless: externalize the state">
        <p className="text-ink-dim leading-relaxed mb-1">
          A server is <strong>stateless</strong> when any request can land on any box and get the same
          answer. The enemy is anything kept in process memory between requests —{" "}
          <strong>session data</strong>, file uploads on local disk, an in-memory cache, a counter.
          Move each of those to a <em>shared</em> store so the boxes hold nothing unique:
        </p>
        <OpTable
          cols={["In-process state", "Where it should live", "—", "Why"]}
          rows={[
            { op: "User session", avg: "Redis / signed cookie / JWT", avgTone: "good", why: "Any box can validate the request; no sticky routing needed." },
            { op: "Uploaded files", avg: "Object store (S3/GCS)", avgTone: "good", why: "Local disk on box A is invisible to box B." },
            { op: "Cache", avg: "Shared cache (Redis/Memcached)", avgTone: "ok", why: "Per-box caches diverge and waste memory; share one." },
            { op: "Counters / locks", avg: "Database / Redis atomic op", avgTone: "ok", why: "An in-memory counter on one box is wrong the moment there are two boxes." },
          ]}
        />
        <Callout kind="trap" title="Sticky sessions are a smell, not a fix">
          "Just pin each user to the same box" (sticky sessions / session affinity) keeps in-memory
          state working, but it defeats the point: load gets uneven, and when that box dies its users
          all lose their sessions. Prefer a shared session store and keep the boxes truly
          interchangeable. Sticky sessions are a stopgap, not the design.
        </Callout>
      </Block>

      <Block eyebrow="the front door" title="Load balancing: L4 vs L7, and how to spread">
        <p className="text-ink-dim leading-relaxed mb-1">
          A load balancer sits in front of the fleet and distributes connections. It operates at one of
          two layers:
        </p>
        <ConceptGrid
          items={[
            [
              "L4 (transport)",
              "Routes by IP + port only — it never reads the request body. Fast, cheap, protocol-agnostic (TCP/UDP). Can't make per-URL or per-header decisions.",
            ],
            [
              "L7 (application)",
              "Terminates the connection and reads HTTP — can route by path, host, header, or cookie, do TLS termination, retries, and sticky sessions. More work per request, far more flexible.",
            ],
          ]}
        />
        <OpTable
          cols={["Algorithm", "Behaviour", "—", "When"]}
          rows={[
            { op: "Round-robin", avg: "even rotation", avgTone: "good", why: "Default. Great when all boxes and all requests are roughly equal." },
            { op: "Least-connections", avg: "fewest in-flight", avgTone: "good", why: "Sends to the least-busy box. Wins when request durations vary a lot." },
            { op: "Consistent hash", avg: "key → box", avgTone: "ok", why: "Same key (user/session) lands on the same box → good cache locality, minimal churn when the fleet changes (see Sharding)." },
            { op: "Weighted", avg: "by capacity", avgTone: "ok", why: "Bigger boxes (or warmer caches) get a larger share. Used during canary rollouts too." },
          ]}
        />
        <Callout kind="note" title="Health checks make it fault-tolerant">
          The load balancer pings each box and pulls a failing one out of rotation automatically —
          that's how horizontal scaling buys availability, not just throughput. And the LB itself must
          not be a single point of failure: run it redundantly (e.g. a floating VIP / multiple LBs
          behind DNS).
        </Callout>
      </Block>
    </>
  );
}

/* ── Caching Strategies ────────────────────────────────────────── */
function Caching() {
  return (
    <>
      <Lede>
        A cache trades <strong>staleness for speed</strong>: keep hot data in a fast tier (RAM, Redis)
        so most reads never touch the slow source of truth. The interesting questions aren't "is it
        faster" — it always is — but <em>who writes the cache</em>, <em>when entries die</em>, and{" "}
        <em>what happens the instant a popular key expires</em>.
      </Lede>

      <Block eyebrow="who fills it" title="Four caching patterns">
        <OpTable
          cols={["Pattern", "Read path", "Write path", "Trade-off"]}
          rows={[
            { op: "Cache-aside", avg: "app checks cache, on miss loads DB + populates", avgTone: "good", worst: "app writes DB, invalidates cache", worstTone: "ok", why: "Most common. Cache only holds what's been read; resilient (a cache outage just means slow). App owns the logic." },
            { op: "Read-through", avg: "app asks cache; cache loads DB on miss itself", avgTone: "good", worst: "(same as cache-aside for writes)", worstTone: "ok", why: "Like cache-aside but the load logic lives in the cache layer/library, not the app. Cleaner app code." },
            { op: "Write-through", avg: "read from cache", avgTone: "good", worst: "write hits cache AND DB synchronously", worstTone: "bad", why: "Cache is never stale, but every write pays both latencies. Good for read-heavy data you can't serve stale." },
            { op: "Write-back", avg: "read from cache", avgTone: "good", worst: "write cache now, flush to DB later (async)", worstTone: "ok", why: "Fastest writes, absorbs bursts — but a crash before flush loses data. Use only where some loss is tolerable." },
          ]}
        />
        <Callout kind="tip" title="Default to cache-aside">
          "I'd start with cache-aside + a TTL — the app reads the cache, falls back to the DB on a
          miss, and populates the cache. It's the most robust: if the cache is down the system is just
          slow, not broken." That's the line. Reach for write-through when stale reads are unacceptable
          and reads dominate; write-back only when you can afford to lose the un-flushed tail on a
          crash.
        </Callout>
        <Callout kind="trap" title="Invalidation is the hard part">
          "There are only two hard things in computer science: cache invalidation and naming things."
          On a write you must either update or delete the cached entry — forget it and you serve stale
          data forever (until TTL). Deleting on write (and lazily repopulating on the next read) is
          usually safer than trying to update the cache in place, because it avoids a write-write race.
        </Callout>
      </Block>

      <Block eyebrow="when it dies" title="TTL & eviction">
        <p className="text-ink-dim leading-relaxed mb-1">
          Entries leave a cache two ways. A <strong>TTL</strong> (time-to-live) expires an entry after
          N seconds regardless of memory — your knob for staleness. <strong>Eviction</strong> kicks in
          when the cache is full and must make room; the policy decides <em>who</em> gets dropped.
          That's exactly the LRU vs LFU question from the{" "}
          <Tag color={ACCENT}>LRU Cache</Tag> topic — LRU evicts the least-recently-touched, LFU the
          least-frequently-used, and a one-off scan of cold data can pollute an LRU cache.
        </p>
        <Callout kind="note" title="TTL and eviction are different jobs">
          TTL bounds <em>staleness</em> (how wrong an entry may be); eviction bounds <em>size</em> (how
          much you keep). You usually want both: a TTL so data refreshes, and an eviction policy
          (LRU/LFU) for when memory fills before the TTL fires. Redis combines them
          (<code className="font-mono">maxmemory-policy</code> + per-key <code className="font-mono">EXPIRE</code>).
        </Callout>
      </Block>

      <Block eyebrow="the dangerous moment" title="Cache stampede / thundering herd">
        <p className="text-ink-dim leading-relaxed mb-1">
          A <strong>stampede</strong> (thundering herd): a hot key expires, and in the gap before it's
          repopulated, <em>thousands</em> of concurrent requests all miss and all hammer the database
          at once — often enough to take it down. Worse, if many keys share one expiry time they all
          expire together. Mitigations, roughly in order of reach:
        </p>
        <ConceptGrid
          items={[
            [
              "Request coalescing / lock",
              "On a miss, the first request takes a lock and recomputes; the rest wait for its result instead of all hitting the DB. (a.k.a. single-flight.) The single highest-leverage fix.",
            ],
            [
              "Jittered TTL",
              "Add randomness to each TTL (e.g. 300s ± 60s) so a batch of keys cached together don't all expire on the same tick — spreads the misses out.",
            ],
            [
              "Early / async refresh",
              "Refresh a hot key in the background just before it expires (probabilistic early expiration), so the cache is never actually empty for a popular key.",
            ],
            [
              "Serve stale on miss",
              "Return the just-expired value while one request recomputes in the background. Bounds latency at the cost of a brief window of staleness.",
            ],
          ]}
        />
        <Callout kind="warn" title="What NOT to cache">
          Caching isn't free judgment-wise. Skip it for: data that's written far more than read (the
          cache is always cold/stale), data that <em>must</em> be exact (auth tokens, account
          balances, inventory at checkout), per-request unique data (the hit rate is ~0), and anything
          where serving a stale value is a correctness or security bug. A cache with a low hit rate is
          pure overhead — measure the hit rate before you keep it.
        </Callout>
      </Block>
    </>
  );
}

/* ── Sharding & Partitioning ───────────────────────────────────── */
function Sharding() {
  return (
    <>
      <Lede>
        When one database can't hold the data or serve the writes, you <strong>shard</strong>: split
        the data across N machines, each owning a slice. The whole problem is the{" "}
        <strong>partition key</strong> — choose it well and load spreads evenly and queries hit one
        shard; choose it badly and you get hot spots, or you've signed up for the rebalancing
        nightmare of <code className="font-mono">hash % N</code>.
      </Lede>

      <Try><ConsistentHashingViz /></Try>

      <Block eyebrow="two ways to split" title="Hash vs range partitioning">
        <OpTable
          cols={["Scheme", "How", "—", "Trade-off"]}
          rows={[
            { op: "Hash partitioning", avg: "shard = hash(key) % N", avgTone: "good", why: "Spreads load evenly and randomly — great for point lookups by key. But range scans ('all users A–C') must hit every shard." },
            { op: "Range partitioning", avg: "shard owns a key range", avgTone: "ok", why: "Range scans hit one shard and stay sorted. But sequential keys (timestamps, auto-increment IDs) all land on the newest shard → a hot spot." },
          ]}
        />
        <Callout kind="trap" title="Hot keys & the celebrity problem">
          Even a perfect hash can't save you from a single <em>key</em> that's far hotter than the
          rest — a celebrity's follower list, a viral post, one mega-tenant. All its traffic lands on
          one shard. Fixes: <strong>split that key</strong> (shard a celebrity's data sub-keyed by
          region/bucket), cache it hard in front of the DB, or give the whale its own dedicated shard.
          Naming the hot-key case is the staff-level signal here.
        </Callout>
      </Block>

      <Block eyebrow="the pain" title="Why hash % N hurts, and consistent hashing as the fix">
        <p className="text-ink-dim leading-relaxed mb-1">
          The naive scheme <code className="font-mono">shard = hash(key) % N</code> works until you add
          or remove a machine. Change N and the modulus changes for{" "}
          <strong>nearly every key</strong> — going from 4 shards to 5 remaps roughly{" "}
          <strong>80%</strong> of keys, so almost all your data has to move and every cache is invalid
          at once. That's unworkable at scale.
        </p>
        <p className="text-ink-dim leading-relaxed mb-1">
          <strong>Consistent hashing</strong> fixes it. Hash both the keys and the nodes onto the same
          circular space (a "ring", e.g. 0…2³²). A key is owned by the first node clockwise from it.
          Now adding or removing a node re-homes only the keys in <em>that node's arc</em> — on average{" "}
          <strong>K/N of the keys</strong>, where N is the resulting node count (going 4 → 5, that's
          ~K/5 = 20%, matching the table), not 80% of them. The visualizer above adds and removes nodes
          so you can watch only a slice re-home.
        </p>
        <CodeBlock
          title="text · the K/N property"
          lang="text"
          code={`hash % N           : add the (N+1)th node → ~ N/(N+1) of K keys move   (catastrophic)
consistent hashing : add/remove a node → ~ K/N        of K keys move   (just one arc)

  K = total keys, N = nodes.
  Going 4 → 5 shards:
    hash % N           remaps ~80% of keys
    consistent hashing remaps ~K/5 = ~20% (only the new node's arc)`}
        />
        <Callout kind="warn" title="Virtual nodes fix the uneven-ring problem">
          With few nodes, random placement on the ring gives each node an <em>uneven</em> arc — one box
          owns half the keys. The fix is <strong>virtual nodes</strong>: place each physical node at
          many points on the ring (e.g. 100–200 vnodes each). Averaging over many small arcs evens out
          the load, and it lets you weight bigger boxes (give them more vnodes). When a node leaves, its
          many small arcs scatter to <em>many</em> successors instead of dumping everything on one
          neighbor. Consistent hashing without virtual nodes is usually a mistake.
        </Callout>
      </Block>
    </>
  );
}

/* ── Replication & Consistency ─────────────────────────────────── */
function Replication() {
  return (
    <>
      <Lede>
        <strong>Replication</strong> keeps copies of the data on multiple machines — for availability
        (lose one, keep serving), read throughput (read from any replica), and latency (a replica near
        the user). The cost is the central tension of distributed data: the copies can{" "}
        <em>disagree</em>, and you must decide how hard you fight to keep them in sync.
      </Lede>

      <Block eyebrow="topology" title="Leader/follower, multi-leader, and sync vs async">
        <ConceptGrid
          items={[
            [
              "Leader / follower",
              "One leader takes all writes and streams them to read-only followers. Simple, no write conflicts. But the leader is a write bottleneck and a failover point (who's the new leader?).",
            ],
            [
              "Multi-leader",
              "Several leaders accept writes (e.g. one per region). Great for write latency and surviving a region outage — but two leaders can edit the same row → write conflicts you must resolve.",
            ],
          ]}
        />
        <OpTable
          cols={["Replication", "Behaviour", "—", "Trade-off"]}
          rows={[
            { op: "Synchronous", avg: "wait for replica ack", avgTone: "bad", why: "A write isn't done until the replica confirms → no data loss on leader failure, but slower writes, and a slow/dead replica stalls you." },
            { op: "Asynchronous", avg: "ack immediately, replicate later", avgTone: "good", why: "Fast writes, replica lag is fine for reads. But if the leader dies before replicating, those acked writes are lost (and reads can be stale)." },
          ]}
        />
        <Callout kind="note" title="Replication lag is where 'eventual' lives">
          With async replication a follower trails the leader by some lag. Read your own write off a
          lagging follower and it's <em>missing</em> — the classic "I posted a comment and it
          vanished." That's the gap quorums and read-your-writes guarantees close.
        </Callout>
      </Block>

      <Block eyebrow="the math" title="Quorums: W + R > N gives you read-your-writes">
        <p className="text-ink-dim leading-relaxed mb-1">
          In a leaderless / Dynamo-style system you write to <strong>W</strong> replicas and read from{" "}
          <strong>R</strong> of <strong>N</strong> total. The guarantee comes from the read and write
          sets <em>overlapping</em> (<strong>W + R &gt; N</strong>), not from any majority. The
          guarantee: if <strong>W + R &gt; N</strong>, the read set and the write set must{" "}
          <em>overlap</em> in at least one replica — so any read is guaranteed to see at least one copy
          of the latest write. That overlap is the whole trick.
        </p>
        <CodeBlock
          title="text · tuning the quorum (N = 3)"
          lang="text"
          code={`N = 3 replicas total

W=3, R=1  →  W+R=4 > 3   reads cheap & always fresh, but writes need ALL replicas up
W=1, R=3  →  W+R=4 > 3   writes cheap, reads must hit all replicas
W=2, R=2  →  W+R=4 > 3   the balanced default: tolerate 1 node down for both reads & writes

W=1, R=1  →  W+R=2 < 3   FAST but NO overlap → a read can miss the latest write (eventual)`}
        />
        <Callout kind="tip" title="W + R > N is the line to remember">
          "With N replicas, W + R &gt; N forces the read and write quorums to overlap, so any read sees
          the latest acknowledged (successfully completed) write — that buys read-your-writes. W=R=2 of
          N=3 is the usual balanced choice:
          it survives one node down on both paths. Drop below the line (W=R=1) and you've chosen
          eventual consistency for lower latency." Get the inequality direction right — it's the most
          common factual slip in this topic.
        </Callout>
      </Block>

      <Block eyebrow="the famous one" title="CAP, stated correctly — and PACELC">
        <p className="text-ink-dim leading-relaxed mb-1">
          <strong>Strong consistency</strong> means every read sees the most recent write (one logical
          copy); <strong>eventual consistency</strong> means replicas converge <em>given enough time
          with no new writes</em>, but a read may be momentarily stale. CAP is about which one you can
          promise during a failure:
        </p>
        <Callout kind="trap" title="CAP is not 'pick 2 of 3'">
          The precise statement: <strong>only when a network partition occurs</strong> must you choose
          between <strong>C</strong>onsistency and <strong>A</strong>vailability — you can't have both
          while nodes can't talk. With no partition you get both C and A. Since networks{" "}
          <em>will</em> partition, P is a given, so the real choice is <strong>CP</strong> (refuse to
          answer rather than serve stale — e.g. a leader store, ZooKeeper, etcd) vs <strong>AP</strong>{" "}
          (stay up and reconcile later — e.g. Dynamo, Cassandra). Never say "pick 2 of 3."
        </Callout>
        <Callout kind="note" title="PACELC: the part CAP leaves out">
          CAP only describes behaviour <em>during</em> a partition. <strong>PACELC</strong> adds the
          common case: <strong>if Partition, choose A or C; Else, choose Latency or Consistency.</strong>{" "}
          Even with a healthy network, synchronous replication for strong consistency costs latency, and
          you'll often trade a little consistency for speed. That "else" branch is where systems live
          99.9% of the time.
        </Callout>
      </Block>
    </>
  );
}

/* ── Queues & Async Processing ─────────────────────────────────── */
function Queues() {
  return (
    <>
      <Lede>
        A queue lets a producer hand off work and move on, instead of blocking on a slow consumer.
        That single move — <strong>decoupling</strong> — buys you spike absorption, independent
        scaling, and resilience (the consumer can be down and work just waits). The price is a pile of
        delivery-semantics questions: messages get duplicated, reordered, and retried, and you have to
        design for it.
      </Lede>

      <Block eyebrow="the shapes" title="Queues, pub/sub, decoupling & backpressure">
        <ConceptGrid
          items={[
            [
              "Work queue",
              "Each message is processed by exactly one consumer from a pool (competing consumers). Scale throughput by adding consumers. Used for task offload — thumbnails, emails, billing jobs.",
            ],
            [
              "Pub / sub",
              "Each message is fan-out to every subscriber (topics). One event ('order placed') drives many independent reactions (email, analytics, inventory) with no coupling between them.",
            ],
            [
              "Decoupling",
              "Producer and consumer don't know each other and don't share a deploy/scale schedule. Either can be down or slow without taking the other with it.",
            ],
            [
              "Backpressure",
              "When consumers fall behind, the queue depth grows — that depth IS the signal to scale consumers, shed load, or slow producers. A bounded queue makes overload visible instead of silent.",
            ],
          ]}
        />
        <Callout kind="warn" title="A queue isn't infinite — watch the depth">
          Treat queue depth and consumer lag as first-class metrics. An unbounded, growing backlog
          means consumers can't keep up — left alone it turns latency into hours and eventually runs the
          broker out of memory. Backpressure (bounded queues, rate limits, autoscaling on lag) is how
          you keep a temporary spike from becoming an outage.
        </Callout>
      </Block>

      <Block eyebrow="delivery semantics" title="At-least-once, exactly-once, and idempotency">
        <p className="text-ink-dim leading-relaxed mb-1">
          Networks drop acks, so a consumer can process a message and crash before acking — the broker
          redelivers it. That's <strong>at-least-once</strong>: every message is delivered, some more
          than once. <strong>At-most-once</strong> (ack first, then process) never duplicates but{" "}
          <em>loses</em> messages on a crash. You almost always want at-least-once.
        </p>
        <Callout kind="trap" title="'Exactly-once' is at-least-once + idempotency">
          True exactly-once delivery over an unreliable network is impossible — the sender can never
          know if a lost ack meant "not delivered" or "delivered, ack lost," so it must choose to
          re-send (duplicates) or not (drops). What people call "exactly-once" is really{" "}
          <strong>at-least-once delivery plus idempotent processing</strong>: accept duplicates, but
          make handling one twice equal handling it once. (Some systems, e.g. Kafka, offer exactly-once
          <em>within their own boundary</em> via transactions — but the moment you touch an external
          system, you're back to idempotency.)
        </Callout>
        <p className="text-ink-dim leading-relaxed mb-1">
          The mechanism is an <strong>idempotency key</strong>: attach a unique id to each operation,
          record processed ids, and skip a message whose id you've already seen. "Charge card" becomes
          safe to retry.
        </p>
        <CodeBlock
          title="python · idempotent consumer"
          code={`def handle(message):
    key = message.idempotency_key          # unique per logical operation
    if seen.contains(key):                 # already processed this exact op?
        return                             # no-op — safe on a duplicate delivery
    with db.transaction():
        apply_effect(message)              # the real work (charge, write, send)
        seen.add(key)                      # commit effect + key together, atomically
    ack(message)                           # only now tell the broker we're done`}
        />
      </Block>

      <Block eyebrow="failure handling" title="Retries, backoff + jitter, and dead-letter queues">
        <p className="text-ink-dim leading-relaxed mb-1">
          A failed message should be retried — but a tight retry loop becomes a self-inflicted DDoS,
          and synchronized retries from many clients form a <strong>thundering herd</strong>. The
          standard answer is <strong>exponential backoff with jitter</strong>: wait 1s, 2s, 4s, 8s…
          (back off), and add randomness so a thousand clients don't all retry on the same tick (jitter
          de-synchronizes them).
        </p>
        <CodeBlock
          title="python · exponential backoff with jitter"
          code={`import random, time

def with_retry(do_work, max_attempts=5, base=0.5, cap=30.0):
    for attempt in range(max_attempts):
        try:
            return do_work()
        except TransientError:
            if attempt == max_attempts - 1:
                raise                      # give up -> route to dead-letter queue
            backoff = min(cap, base * 2 ** attempt)   # 0.5, 1, 2, 4, ... capped
            time.sleep(random.uniform(0, backoff))    # full jitter: pick in [0, backoff]`}
        />
        <Callout kind="note" title="Dead-letter queue: the off-ramp">
          After N failed retries a message goes to a <strong>dead-letter queue</strong> instead of
          looping forever. The DLQ isolates poison messages (a malformed payload that will{" "}
          <em>never</em> succeed) so they don't block the pipeline, and gives you a place to inspect,
          fix, and replay them. Always alert on DLQ growth — it's where bugs go to hide.
        </Callout>
        <Callout kind="tip" title="Interview line">
          "I'd make the consumer idempotent with an idempotency key so at-least-once delivery is safe,
          retry transient failures with exponential backoff plus jitter, and after a retry budget route
          to a dead-letter queue for inspection. 'Exactly-once' I'd implement as at-least-once plus
          idempotency — true exactly-once delivery isn't achievable over an unreliable network."
        </Callout>
      </Block>
    </>
  );
}

/* ── SQL vs NoSQL ──────────────────────────────────────────────── */
function SqlNoSql() {
  return (
    <>
      <Lede>
        "SQL or NoSQL?" is a trap if you answer with a religion. The honest framing is a trade-off:
        relational databases give you <strong>ACID guarantees, joins, and a flexible query language</strong>{" "}
        over a fixed schema; NoSQL stores drop some of that to win on <strong>scale, write throughput,
        or a data shape</strong> that relational tables model awkwardly. Pick by access pattern and the
        consistency you actually need.
      </Lede>

      <Block eyebrow="the families" title="Relational vs the NoSQL shapes">
        <OpTable
          cols={["Family", "Model", "—", "Fits"]}
          rows={[
            { op: "Relational (SQL)", avg: "tables + rows, joins, schema", avgTone: "good", why: "ACID transactions, ad-hoc queries, foreign keys. The default until a specific limit forces you off it. (Postgres, MySQL.)" },
            { op: "Document", avg: "JSON-ish documents", avgTone: "ok", why: "Self-contained, nested objects with a flexible schema. Great when one entity = one read. (MongoDB.)" },
            { op: "Key-value", avg: "key → blob", avgTone: "good", why: "Dead-simple O(1) get/put at huge scale. Sessions, caches, feature flags. (Redis, DynamoDB.)" },
            { op: "Wide-column", avg: "rows with dynamic columns", avgTone: "ok", why: "Massive write throughput, time-series & event data, tunable consistency. (Cassandra, Bigtable.)" },
            { op: "Graph", avg: "nodes + edges", avgTone: "ok", why: "Relationship-heavy queries — social graphs, fraud rings, recommendations — where joins would explode. (Neo4j.)" },
          ]}
        />
      </Block>

      <Block eyebrow="the guarantees" title="ACID vs BASE">
        <ConceptGrid
          items={[
            [
              "ACID (most SQL)",
              "Atomic, Consistent, Isolated, Durable. A transaction is all-or-nothing and the DB enforces invariants. You reason about data as if you were the only user. The reason banks use SQL.",
            ],
            [
              "BASE (many NoSQL)",
              "Basically Available, Soft-state, Eventually consistent. Trades strict guarantees for availability and scale — replicas converge over time. You handle conflicts and stale reads in the app.",
            ],
          ]}
        />
        <Callout kind="note" title="The line is blurrier than it used to be">
          The ACID/BASE split isn't strict by product anymore: Postgres scales further than people
          assume and adds JSONB document support; DynamoDB and Mongo offer transactions and tunable
          consistency; "NewSQL" stores (Spanner, CockroachDB) deliver distributed ACID. Argue from the
          guarantee you need, not the brand on the box.
        </Callout>
      </Block>

      <Block eyebrow="how to decide" title="A decision table, not a dogma">
        <OpTable
          cols={["If you need…", "Reach for", "—", "Because"]}
          rows={[
            { op: "Multi-row transactions / strong consistency", avg: "Relational (SQL)", avgTone: "good", why: "ACID + foreign keys enforce invariants the app would otherwise hand-roll. Money, inventory, anything that must reconcile." },
            { op: "Ad-hoc queries & joins across entities", avg: "Relational (SQL)", avgTone: "good", why: "SQL + a query planner; you don't have to know every access pattern up front." },
            { op: "Extreme write throughput / horizontal scale", avg: "Wide-column / KV", avgTone: "ok", why: "Built to shard across many nodes; trades joins and strong consistency for raw scale." },
            { op: "Flexible / evolving schema, one-entity reads", avg: "Document", avgTone: "ok", why: "Store the whole object together; no migrations to add a field. Catalogs, user profiles, CMS." },
            { op: "Relationship-heavy traversals", avg: "Graph", avgTone: "ok", why: "'Friends of friends who liked X' is cheap on edges, a join-bomb in SQL." },
            { op: "Simple, blazing-fast lookups by key", avg: "Key-value", avgTone: "good", why: "Sessions, caches, rate-limit counters — no query language needed." },
          ]}
        />
        <Callout kind="tip" title="The default and the tell">
          "I'd default to a relational database — it's flexible, ACID, and Postgres scales further than
          most people expect — and only move a specific workload off it when a real limit forces the
          issue: write volume one box can't take, a data shape SQL models badly, or scale that needs
          horizontal sharding. And it's rarely all-or-nothing — polyglot persistence (SQL for orders,
          Redis for sessions, a search index for full-text) is normal." Naming the <em>specific</em>{" "}
          trigger that would move you, rather than defaulting to "NoSQL because scale," is the staff
          signal.
        </Callout>
      </Block>
    </>
  );
}

export const SYSTEM_TOPICS = [
  { id: "scaling", label: "Scaling a Service", group: "System Design" },
  { id: "caching", label: "Caching Strategies", group: "System Design" },
  { id: "sharding", label: "Sharding & Partitioning", group: "System Design" },
  { id: "replication", label: "Replication & Consistency", group: "System Design" },
  { id: "queues", label: "Queues & Async Processing", group: "System Design" },
  { id: "sql-nosql", label: "SQL vs NoSQL", group: "System Design" },
];

export const SYSTEM_CONTENT = {
  scaling: <Scaling />,
  caching: <Caching />,
  sharding: <Sharding />,
  replication: <Replication />,
  queues: <Queues />,
  "sql-nosql": <SqlNoSql />,
};
