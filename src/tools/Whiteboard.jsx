import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import FanoutViz from "./whiteboard/FanoutViz.jsx";
import CapacityEstimatorViz from "./whiteboard/CapacityEstimatorViz.jsx";

const ACCENT = "#4aa3ff";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "framework", label: "The design framework", group: "The method" },
  { id: "estimation", label: "Estimation & the numbers", group: "The method" },
  { id: "urlshortener", label: "Design: URL shortener", group: "The cases" },
  { id: "newsfeed", label: "Design: news feed", group: "The cases" },
  { id: "chat", label: "Design: chat / messaging", group: "The cases" },
  { id: "ridehail", label: "Design: ride-share & geo", group: "The cases" },
  { id: "notifications", label: "Design: notification system", group: "The cases" },
  { id: "ledger", label: "Design: payments & ledger", group: "The cases" },
  { id: "ratelimiter", label: "Design: distributed rate limiter", group: "The cases" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* ── The design framework ─────────────────────────────────────── */
const FRAMEWORK_STEPS = [
  {
    n: 1,
    name: "Clarify requirements",
    min: 5,
    say: "Before I draw anything, let me pin down what this system must do, what it must guarantee, and what it explicitly does not need to handle.",
    do: "Write three lists on the board: functional (the features), non-functional (scale, latency, availability, consistency), and out-of-scope.",
    trap: "Designing for requirements the interviewer never gave you. Scope is a negotiation, and cutting scope out loud scores as much as adding it.",
  },
  {
    n: 2,
    name: "Back-of-envelope estimate",
    min: 5,
    say: "Let me size this out loud so every later decision has a number behind it.",
    do: "DAU times actions gives writes/day; divide by 86,400 for QPS; times a peak factor; storage is rows times bytes times retention. Round hard.",
    trap: "Silent math or fake precision. Narrate the rounding: 86,400 seconds is about 100K, so 100M a day is roughly 1,000 a second.",
  },
  {
    n: 3,
    name: "Define the API",
    min: 3,
    say: "Here is the contract clients call, just the handful of endpoints that carry the core use cases.",
    do: "Sketch 3-5 endpoints with their key parameters and return shapes. The API pins down the nouns and verbs the rest of the design serves.",
    trap: "Skipping straight to boxes. The API forces you to name the actual operations before you argue about the storage behind them.",
  },
  {
    n: 4,
    name: "Data model",
    min: 4,
    say: "Now the core entities, their keys, and the access patterns that decide the store.",
    do: "List the main tables/entities, the primary and partition keys, and the top two or three query patterns each must serve.",
    trap: "Picking SQL or NoSQL before naming the access pattern. The query shape chooses the store, not the other way round.",
  },
  {
    n: 5,
    name: "High-level design",
    min: 10,
    say: "Let me draw the request path end to end, client to storage and back, then hang every component on it.",
    do: "Client, load balancer, service tier, cache, primary store, async workers, and a queue. Label each arrow with what flows and how much.",
    trap: "A blob of boxes with no request actually traced through it. Walk one read and one write across the diagram out loud.",
  },
  {
    n: 6,
    name: "Deep-dive 1-2 components",
    min: 10,
    say: "The interesting part of this problem lives in one or two places, so let me go deep exactly there.",
    do: "Pick the crux (the fan-out, the geo index, the ledger consistency) and go three layers down: algorithm, data structure, failure mode.",
    trap: "Spreading a thin layer over everything. Seniority shows in depth on the hard part, not breadth over the easy parts.",
  },
  {
    n: 7,
    name: "Find bottlenecks & scale",
    min: 4,
    say: "Where does this break first as traffic grows, and what is the next lever when it does?",
    do: "Name the hot spot (single DB, hot partition, hot key), then the fix: replicas, sharding, caching, async, back-pressure.",
    trap: "Claiming it scales infinitely. Every design has a next bottleneck; naming it before the interviewer does is the senior move.",
  },
  {
    n: 8,
    name: "State trade-offs",
    min: 4,
    say: "Let me close by naming what I traded away, because every choice here bought one thing at the cost of another.",
    do: "For the two or three biggest decisions, say the alternative and why you rejected it: consistency vs availability, cost vs latency, simple vs flexible.",
    trap: "Presenting the design as the one right answer. The rubric rewards you for knowing the alternatives you did not pick.",
  },
];

function Framework() {
  return (
    <>
      <Lede>
        The 45-minute design round rewards a rehearsed <em>shape</em>, not improvisation. Eight steps with
        explicit time budgets, 5 + 5 + 3 + 4 + 10 + 10 + 4 + 4 = 45 minutes, take you from a vague prompt to
        a labeled architecture with a trade-off story. The loop is the same every time; the requirements and
        the arithmetic are what make each run different.
      </Lede>

      <Block eyebrow="the eight steps" title="45 minutes of structure">
        <p className="text-ink-dim leading-relaxed mb-3">
          Each step has a spoken opener (SAY), a concrete action (DO), and the trap that sinks candidates
          there (TRAP). High-level design and the deep-dive get the biggest budgets because that is where the
          real trade-offs live.
        </p>
        <div className="space-y-3">
          {FRAMEWORK_STEPS.map((s) => (
            <div key={s.n} className="rounded-lg border border-line bg-surface-2 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[12px] font-semibold text-ink">
                  {s.n}. {s.name}
                </span>
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ color: ACCENT, borderColor: ACCENT }}
                >
                  {s.min} min
                </span>
              </div>
              <div className="space-y-1.5 text-[13px] leading-relaxed">
                <p className="text-ink-dim">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>say</span>
                  {s.say}
                </p>
                <p className="text-ink-dim">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>do</span>
                  {s.do}
                </p>
                <p className="text-ink-faint">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2 text-ink-faint">trap</span>
                  {s.trap}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Callout kind="note" title="What the interviewer is listening for">
          Structured decomposition and traceability: can every component on your board be traced back to a
          requirement or a number you computed out loud? Candidates who name technologies first and reasons
          second read as mid-level no matter how good the technologies are.
        </Callout>
      </Block>

      <Block eyebrow="first 30 seconds" title="A weak opening vs a strong opening">
        <Callout kind="trap" title="The weak opening (tech-first)">
          "OK, so I'd put an nginx load balancer in front, a stateless service tier, Postgres with read
          replicas, Redis for caching, and Kafka between the services..." Nothing here is wrong, and that is
          the problem: with no requirements on the board, none of it is <em>justified</em>, and the
          interviewer has already filed the round as mid-level.
        </Callout>
        <Callout kind="tip" title="The strong opening (requirements-first), say it verbatim">
          "Before touching technology, I want to nail down four things: the core features in scope, the
          read-vs-write ratio and scale, the latency and availability targets, and where we sit on the
          consistency spectrum. Then I'll size it with quick arithmetic, and only then pick components, so
          every choice traces back to a requirement or a number."
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>What if the interviewer gives you almost no requirements?</strong> Propose defaults out
            loud and label them as assumptions: "I'll assume 100 million users, read-heavy at 100 to 1, and
            an availability target over raw consistency, correct me if that's off," then design against them.
            Stated assumptions score; silent ones read as errors.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You're 25 minutes in and only halfway through. What now?</strong> Say it explicitly and
            offer a menu: "I can go deep on the storage layer or the fan-out path, which is more useful to
            you?" Then compress the remaining steps to their headline decision each.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How much does the framework change per problem?</strong> The loop holds; the time budget
            moves to wherever the risk lives. A ledger spends its deep-dive on consistency and idempotency; a
            feed spends it on fan-out; a rate limiter spends it on the counting algorithm. Same skeleton,
            different center of gravity.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Isn't a memorized framework robotic?</strong> It's scaffolding, not a script. The
            requirements dialogue and the arithmetic are different every time, and I move the budget to
            wherever the problem's real difficulty is; the framework just guarantees nothing gets skipped.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I run an eight-step loop with time budgets: requirements, back-of-envelope math, API, data model,
          high-level design, a deep-dive on one or two components, bottlenecks, and trade-offs, roughly
          5-5-3-4-10-10-4-4. The first ten minutes are scope and arithmetic done out loud, so every later
          component traces to a requirement or a number. The high-level design and the deep-dive get the
          biggest budgets because that's where the trade-offs are, and I always end by naming what I traded
          away."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "My design round has a fixed shape. Five minutes on requirements: the features in scope, the read
          and write ratio and scale, latency and availability targets, and where I sit on consistency, plus
          what's explicitly out of scope. Five on back-of-envelope math, narrated: DAU times actions gives
          writes per day, divided by 86,400 for QPS, times a peak factor, and storage is rows times bytes
          times retention, all rounded hard because those numbers pick my shard counts later. Three minutes
          to sketch the API, the handful of endpoints that carry the core use cases, then four on the data
          model, entities, keys, and the access patterns that choose the store. Then the two big budgets: ten
          minutes drawing the request path end to end with every arrow labeled, and ten going deep on the one
          or two components where the real problem lives. Four minutes naming the first bottleneck and its
          fix, and four stating the trade-offs I made and the alternatives I rejected. I checkpoint with the
          interviewer at the boundaries so the depth goes where they want it."
        </Callout>
      </Block>
    </>
  );
}

/* ── Estimation & the numbers ─────────────────────────────────── */
function Estimation() {
  return (
    <>
      <Lede>
        Estimation is five minutes that sets the tone for the other forty. The interviewer is not checking
        arithmetic; they are checking whether you turn a product number into an engineering constraint out
        loud, DAU into QPS, QPS into shard counts, retention into a storage bill. Round hard, narrate every
        step, and let the numbers pick the architecture.
      </Lede>

      <Block eyebrow="know these cold" title="The numbers to memorize">
        <p className="text-ink-dim leading-relaxed mb-2">
          Half of estimation is a few constants you should never have to derive under pressure:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Time:</strong> ~86,400 seconds/day, call it 100K. So 1M/day is ~12/s, 100M/day is ~1,150/s, 1B/day is ~11.5K/s.</li>
          <li><strong>Powers of two:</strong> 2^10 ~ 1 thousand (KB), 2^20 ~ 1 million (MB), 2^30 ~ 1 billion (GB), 2^40 ~ 1 trillion (TB).</li>
          <li><strong>Powers of ten:</strong> thousand, million, billion, trillion, K, M, B, T, each step is 1,000x.</li>
          <li><strong>Char/int sizes:</strong> ASCII char ~1 byte, a UUID ~16 bytes, a typical row of metadata ~0.5-1 KB.</li>
        </ul>
        <CodeBlock
          title="text"
          lang="text"
          code={`the latency ladder (order of magnitude, know the RATIOS):

  L1 / L2 cache      ~1 ns          reference point
  main memory (RAM)  ~100 ns        ~100x slower than cache
  SSD random read    ~100 us        ~1,000x slower than RAM
  network round-trip ~0.5 ms        within a datacenter
  disk (HDD) seek    ~10 ms         ~100x slower than SSD
  cross-region RTT   ~100 ms        physics: speed of light, coast to coast

  takeaway: memory is ns, SSD is us, network is ms, cross-region is ~100 ms.
  RAM (~100 ns) vs a cross-region call (~100 ms) is a MILLION-fold difference.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether your numbers drive the design. QPS should pick the shard count, GB/day should pick the
          partition key and the storage tier, and the latency ladder should justify every cache. Reciting
          constants with no consequence is trivia; using them to make a decision is the signal.
        </Callout>
      </Block>

      <Block eyebrow="the two formulas" title="QPS and storage, every time">
        <p className="text-ink-dim leading-relaxed mb-2">
          Almost every estimate is these two chains. Say them the same way every round:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`QPS from users:
  writes/day   = DAU x actions_per_user_per_day
  avg QPS      = writes/day / 86,400          (86,400 -> call it 100K)
  peak QPS     = avg QPS x peak_factor        (2x-10x; state your factor)
  read QPS     = write QPS x read:write ratio (feeds are 100:1, ledgers ~1:1)

storage:
  bytes/day    = writes/day x bytes_per_row
  storage/yr   = bytes/day x 365
  total        = storage/yr x retention_years
  (x a replication factor of ~3 for the real disk bill)

bandwidth:
  ingress      = write QPS x bytes_per_row
  egress       = read QPS  x bytes_per_response`}
        />
        <Callout kind="tip" title="Say the rounding out loud">
          "86,400 seconds in a day, call it 100K, so 100 million writes a day is about a thousand a second,
          ten thousand at a 10x peak." Narrated rounding signals fluency; silent calculator-grade precision
          signals memorization.
        </Callout>
      </Block>

      <Block eyebrow="a worked example" title="Size a photo-sharing service end to end">
        <p className="text-ink-dim leading-relaxed mb-2">
          Prompt numbers: 500M DAU, each uploads 2 photos/day at ~1.5 MB each, metadata ~1 KB/photo, viewed
          100x more than uploaded, kept 5 years. Walk it:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`uploads/day = 500M x 2         = 1B writes/day
avg write QPS = 1B / 86,400     = ~11,500 writes/s
peak (5x)                       = ~58,000 writes/s
read QPS = write x 100 (read-heavy):
  avg  = 11,500 x 100           = ~1.15M reads/s
  peak = 58,000 x 100           = ~5.8M reads/s

media storage/day = 1B x 1.5 MB = 1.5 PB/day (!)
media over 5 yr   = 1.5 PB x 365 x 5 = ~2.7 EB  -> object store + tiering, not a DB

metadata/day = 1B x 1 KB        = 1 TB/day
metadata/5yr = 1 TB x 365 x 5   = ~1.8 PB       -> sharded store, hot/cold split

conclusion said out loud: "media is exabytes, so it lives in blob storage
behind a CDN, and the DB only holds kilobyte metadata rows. The read path
is the whole game at a million QPS, so it is CDN-and-cache-first."`}
        />
        <p className="text-ink-dim leading-relaxed">
          The arithmetic did the architecture: petabytes/day of media forces object storage and a CDN, the
          100:1 read ratio forces cache-first serving, and the kilobyte metadata rows are the only thing that
          belongs in a database. That is the entire point of the estimate.
        </p>
      </Block>

      <Block eyebrow="drive the sliders" title="Turn product numbers into engineering numbers">
        <p className="text-ink-dim leading-relaxed mb-3">
          Move DAU, actions, payload, retention, and the peak factor and watch QPS, storage, and bandwidth
          fall out. Rehearse saying the chain out loud as you drag, the interviewer wants the narration, not
          the digits.
        </p>
        <Try label="capacity math">
          <CapacityEstimatorViz />
        </Try>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Why plan for peak and not average QPS?</strong> Because you provision for the worst
            second, not the mean one. Traffic is bursty, mornings, launches, time zones, so a 5x-10x peak
            factor over the daily average is what sizes the fleet and the rate limits; the average only sizes
            the storage bill.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your estimate is off by 3x. Does the design change?</strong> Usually not, and saying that
            is the senior move: these numbers pick an <em>order of magnitude</em>, one database versus a
            sharded fleet, a cache versus none. A 3x error rarely crosses an order-of-magnitude boundary, so
            the shape holds; I'd only re-derive if it flips a tier.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you estimate storage for something you keep forever?</strong> Growth is a running
            sum: bytes/day times 365 gives year one, and it compounds. Name the tiering plan, hot data on SSD,
            warm on cheaper disk, cold in object storage or glacier, because "keep forever" is a cost tier
            decision, not a capacity one.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>When does bandwidth become the constraint instead of QPS or storage?</strong> When the
            payload is large. Metadata at a kilobyte makes QPS the limit; video or images at megabytes make
            egress the limit, which is exactly why large-payload systems are CDN-first, you move the bytes to
            the edge so origin bandwidth never becomes the wall.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I anchor on a few constants, 86,400 seconds a day is about 100K, and the latency ladder where
          memory is nanoseconds, SSD microseconds, network milliseconds, cross-region about 100. Then two
          chains: QPS is DAU times actions over 86,400 times a peak factor, and storage is rows times bytes
          times retention. I round hard and narrate, because the goal is the order of magnitude that picks my
          shard count, my cache, and my storage tier, not six digits of precision."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Estimation is where the design gets its constraints, so I do it out loud. I keep a few numbers
          cold: 86,400 seconds a day rounded to 100K, the powers of two, 2^10 is a thousand up to 2^40 is a
          trillion, and the latency ladder, cache in nanoseconds, RAM around 100 nanoseconds, SSD in
          microseconds, a datacenter round-trip under a millisecond, and cross-region near 100 milliseconds.
          From there, QPS is daily active users times actions per user, divided by 86,400 for the average,
          times a peak factor of five to ten for the worst second, and reads are the write rate times the
          read-to-write ratio, which is a hundred to one for a feed and closer to one to one for a ledger.
          Storage is writes per day times bytes per row times 365 times retention, then times a replication
          factor of about three for the real disk bill. The whole exercise exists to make the architecture
          fall out of the numbers: petabytes a day of media means object storage and a CDN, a hundred-to-one
          read ratio means cache-first serving, and kilobyte rows are the only thing that belongs in the
          database. A three-x error rarely matters because I'm choosing an order of magnitude, not a capacity
          plan."
        </Callout>
      </Block>
    </>
  );
}

/* ── Design: URL shortener ────────────────────────────────────── */
function UrlShortener() {
  return (
    <>
      <Lede>
        "Design a URL shortener like Bitly, take a long URL and return a short one, and redirect on
        access." It sounds like a toy, and the trap is treating it like one. The whole round is decided on
        two crux calls: how you generate short keys without collisions, and how you serve reads at massive
        scale with a redirect. Here is the full loop.
      </Lede>

      <Block eyebrow="minutes 0-10" title="Requirements and the estimate">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional:</strong> shorten a long URL to a short code; redirect a short code to the
          original; optionally custom aliases, expiry, and click analytics. <strong>Non-functional:</strong>{" "}
          extremely read-heavy, redirects must be low-latency (single-digit ms), high availability (a dead
          shortener breaks every link that uses it), and short codes must never collide. <strong>Out of
          scope:</strong> we'll park analytics as an async side-path.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`writes: 100M new URLs/day  = 100M / 86,400 = ~1,150 writes/s  (peak ~5x = ~6K/s)
reads:  100:1 read ratio   = ~115K reads/s  (peak ~600K/s)   <- the real load

storage: 100M/day x 365 x 5 yr = ~180B URLs
         180B x ~500 bytes/row  = ~90 TB over 5 years        -> easily sharded

key space: base62 (a-z A-Z 0-9)
   62^6 = ~57 billion       62^7 = ~3.5 trillion       62^8 = ~218 trillion
   need ~180B over 5 yr -> 7 chars (3.5T) has ~20x headroom.  Use 7.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you recognize this as a read-heavy, cache-and-redirect problem, and that the key-space
          arithmetic (why 7 base62 chars) comes from the storage estimate, not from a memorized number.
          Candidates who skip the math and assert "6 characters is enough" have not sized it.
        </Callout>
      </Block>

      <Block eyebrow="minutes 10-14" title="API and data model">
        <CodeBlock
          title="text"
          lang="text"
          code={`API
  POST /urls            { long_url, custom_alias?, ttl? }  -> { short_url }
  GET  /{short_code}                                        -> 301/302 redirect

data model  (short_code is the primary/partition key)
  urls
    short_code   VARCHAR(7)  PK      <- hash-sharded on this key
    long_url     TEXT
    created_at   TIMESTAMP
    expires_at   TIMESTAMP NULL
    owner_id     BIGINT NULL

access patterns
  1. read  by short_code  (the redirect)  -> ~99% of traffic, must be O(1)
  2. write by short_code  (the create)    -> ~1% of traffic`}
        />
        <p className="text-ink-dim leading-relaxed">
          The access pattern is pure key-value lookup by <code className="font-mono">short_code</code>, so the
          store is a hash-partitioned KV or wide-column database (DynamoDB, Cassandra), not a relational one.
          There are no joins and no range scans on the hot path; say that out loud, it justifies the store.
        </p>
      </Block>

      <Block eyebrow="minutes 14-24" title="High-level design: the redirect path is the product">
        <CodeBlock
          title="text"
          lang="text"
          code={`WRITE path (rare):
  client -> [ LB ] -> [ write service ] -> key-gen -> [ KV store ] (short_code -> long_url)

READ path (99% of traffic):
  client -> [ CDN / edge ] --miss--> [ LB ] -> [ read service ] -> [ cache ] --miss--> [ KV store ]
              |                                                       |
              +--- hit: 301 redirect at the edge                     +-- hit: 302/301 redirect
                                                                     |
                                        async: fire a click event -> [ queue ] -> [ analytics ]

  cache: hot short_codes in Redis (LRU). Read-heavy + small rows = ~95%+ hit rate.
  replication: KV store replicated 3x across AZs; reads served from any replica.`}
        />
        <p className="text-ink-dim leading-relaxed">
          The design is deliberately boring on the write side and heavily optimized on the read side, because
          the estimate said reads outnumber writes 100 to 1. Analytics is fired asynchronously to a queue so
          a slow analytics write can never add latency to a redirect.
        </p>
      </Block>

      <Block eyebrow="deep-dive 1" title="Key generation: three approaches, one call">
        <p className="text-ink-dim leading-relaxed mb-2">
          This is the crux. You need a short, unique code per URL, and you must never hand out the same code
          twice under concurrency:
        </p>
        <OpTable
          cols={["Approach", "How", "", "Trade"]}
          rows={[
            { op: "Hash + truncate", avg: "MD5/SHA, take first 7 chars", avgTone: "ok", why: "Deterministic and stateless, but truncation collides; you must check-and-retry on write, and identical URLs map to one code unless you salt." },
            { op: "Random + check", avg: "random 7 base62, verify unused", avgTone: "ok", why: "Simple, but as the table fills, collision checks cost an extra read per write and retries climb. Fine at low fill, degrades late." },
            { op: "Counter + base62", avg: "global counter, encode to base62", avgTone: "good", why: "Zero collisions by construction: each id is unique, base62-encode it. Needs a distributed counter, and sequential ids are guessable." },
            { op: "Key-gen service (KGS)", avg: "pre-generate keys in ranges", avgTone: "good", why: "A KGS hands each app server a block of unused keys (e.g. Zookeeper/DB ranges). No per-write coordination, no collisions, keys look random." },
          ]}
        />
        <Callout kind="tip" title="The call">
          For a system of record, use a counter or a key-generation service. A distributed counter (a range
          allocator: each server leases a block of a billion ids and encodes them base62) gives collision-free
          keys with no per-write coordination. If guessability matters, XOR or feistel-permute the counter
          before encoding so codes look random but stay unique.
        </Callout>
        <Callout kind="trap" title="Do not hand-wave the concurrency">
          "I'll just hash the URL" collides under truncation, and "I'll generate a random string" needs a
          collision check that gets slower as the table fills. The senior answer names the coordination
          explicitly: a counter or a pre-allocated key range, so uniqueness is guaranteed, not hoped for.
        </Callout>
      </Block>

      <Block eyebrow="deep-dive 2" title="301 vs 302: the redirect status code matters">
        <p className="text-ink-dim leading-relaxed mb-2">
          A subtle question interviewers love, because it trades caching against control:
        </p>
        <OpTable
          cols={["Code", "Meaning", "", "Consequence"]}
          rows={[
            { op: "301 Moved Permanently", avg: "browsers + CDNs cache it", avgTone: "good", why: "The client caches the mapping and skips your server on repeat hits, less load, lower latency. But you lose per-click analytics and can never change or revoke the target." },
            { op: "302 Found (temporary)", avg: "not cached by default", avgTone: "ok", why: "Every hit comes back to your server, so you can count clicks, A/B the target, and honor expiry/revocation. The cost is that every redirect is a request you must serve." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed">
          Say the trade explicitly: <strong>302 by default</strong> if analytics, expiry, or revocation
          matter (they usually do for a Bitly-style product), accepting that every click hits your fleet;{" "}
          <strong>301</strong> only when you want the client and CDN to absorb the load and you truly never
          need to change the destination. The choice is a product decision wearing an HTTP-status costume.
        </p>
      </Block>

      <Block eyebrow="trade-offs" title="What each choice bought">
        <OpTable
          cols={["Decision", "Chose", "", "Alternative & why not"]}
          rows={[
            { op: "Store", avg: "hash-partitioned KV", avgTone: "good", why: "Pure key lookup, no joins; a relational DB adds cost and coordination this access pattern never uses." },
            { op: "Key gen", avg: "counter / KGS range", avgTone: "good", why: "Collision-free without per-write checks; hashing collides on truncation, random-and-check degrades as the table fills." },
            { op: "Redirect", avg: "302 (temporary)", avgTone: "ok", why: "Keeps analytics, expiry, and revocation; 301 offloads load to clients but blinds you and freezes the target." },
            { op: "Read path", avg: "CDN + Redis cache", avgTone: "good", why: "100:1 read ratio on tiny rows caches beautifully; serving every redirect from the origin DB wastes the easiest win in the system." },
          ]}
        />
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Two users shorten the same long URL. One code or two?</strong> A product call. Dedup
            (one code per URL) saves space and needs a reverse index on the long URL, but breaks per-owner
            analytics and custom expiry. The common answer is to <em>not</em> dedup by default, cheap storage
            beats the coupling, and only dedup within a single owner's account if asked.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do custom aliases coexist with generated codes?</strong> Same table, same key space,
            but a custom alias is an explicit insert that must fail if taken (a conditional write on the
            primary key). Reserve a namespace or length band for generated codes so a user's custom alias can
            never collide with one you'll later mint from the counter.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you expire and clean up old links?</strong> Store <code className="font-mono">expires_at</code>
            and check it on read (a hit past expiry returns 404/410, not a redirect). Reclaim space with a TTL
            in the KV store or a background sweeper; if codes are recycled, only recycle after a long quarantine
            so a stale bookmark never lands on someone else's URL.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A single short code goes viral, one key at a million QPS. What breaks?</strong> A hot
            partition: one shard and one cache key take all the traffic. Fix at the edge, this is exactly what
            CDNs are for, cache the redirect near users; within the origin, replicate the hot key across cache
            nodes or promote it to an in-process cache on every read server. The write path is untouched.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "It's a read-heavy key-value problem: 100 million writes a day but a hundred times the reads, so I
          optimize the redirect path. Codes are 7 base62 characters, sized from 180 billion URLs over five
          years, generated collision-free by a distributed counter or a key-gen service that leases id ranges,
          not by hashing, which collides on truncation. Storage is a hash-partitioned KV store keyed by the
          short code, fronted by a CDN and a Redis cache for a 95%-plus hit rate. I default to 302 redirects
          to keep analytics, expiry, and revocation, and fire click events asynchronously so they never slow
          a redirect."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Requirements first: shorten, redirect, optional custom alias and expiry, and it's overwhelmingly
          read-heavy with a hard low-latency and high-availability bar because a dead shortener breaks every
          link. The math: 100 million new URLs a day is about 1,150 writes a second, a hundred-to-one read
          ratio puts reads north of 100,000 a second, and 180 billion URLs over five years at 500 bytes is
          around 90 terabytes, easily sharded. That key count is why codes are seven base62 characters, since
          62 to the seventh is 3.5 trillion, roughly 20x headroom. The access pattern is pure lookup by short
          code, so I use a hash-partitioned KV store, no joins, no range scans. Key generation is the crux: I
          reject hashing because truncation collides, and random-and-check because it degrades as the table
          fills; instead a distributed counter or a key-gen service leases id ranges to each server and
          base62-encodes them, so codes are unique by construction with no per-write coordination, and I can
          permute the counter if I want them to look random. The read path is CDN plus a Redis LRU cache in
          front of replicated storage, which caches beautifully given tiny rows and a 100-to-1 ratio. I pick
          302 over 301 so I keep click analytics, expiry, and revocation, accepting that every click hits my
          fleet, and analytics events go to a queue off the hot path. The first thing that breaks at scale is
          a viral hot key, which the CDN and hot-key replication absorb."
        </Callout>
      </Block>
    </>
  );
}

/* ── Design: news feed ────────────────────────────────────────── */
function NewsFeed() {
  return (
    <>
      <Lede>
        "Design a home feed like Twitter or Instagram, users follow others and see a ranked timeline of
        recent posts." The entire round hinges on one decision: do you build each user's feed when authors{" "}
        <em>post</em> (fan-out on write) or when readers <em>load</em> (fan-out on read)? Get the celebrity
        problem and the hybrid answer right and the round is yours.
      </Lede>

      <Block eyebrow="minutes 0-10" title="Requirements and the estimate">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional:</strong> post; follow/unfollow; view a reverse-chronological (or ranked) feed
          of posts from people you follow; the feed paginates. <strong>Non-functional:</strong> read-heavy,
          feed load must feel instant (&lt;200 ms), high availability, and eventual consistency is fine, a
          post showing up a few seconds late is acceptable. <strong>Out of scope for now:</strong> the
          ranking model; assume reverse-chron and note ranking as a scoring layer.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`300M DAU, each opens the feed ~10x/day, posts ~0.3x/day

feed reads:  300M x 10 / 86,400  = ~35K reads/s   (peak ~5x = ~175K/s)
posts:       300M x 0.3 / 86,400 = ~1K writes/s    (peak ~5K/s)
read:write ~= 35:1, and feed reads must be FAST -> precompute where you can

fan-out cost is the real number:
  avg user ~ 300 followers  -> a post writes ~300 feed entries  (fine)
  celebrity ~ 50M followers -> a post writes 50M feed entries   (a write storm)`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you frame the whole design around fan-out and surface the celebrity problem <em>yourself</em>.
          The moment you say "a normal user is cheap to fan out but a celebrity with millions of followers is a
          write storm," you've shown you know where this design actually breaks.
        </Callout>
      </Block>

      <Block eyebrow="minutes 10-14" title="API and data model">
        <CodeBlock
          title="text"
          lang="text"
          code={`API
  POST /posts                { text, media? }        -> { post_id }
  POST /follow               { target_user_id }
  GET  /feed?cursor=...&limit=20                       -> [ posts ]

data model
  posts      (post_id PK, author_id, body, created_at)     -- source of truth, sharded by post_id
  follows    (follower_id, followee_id)                     -- the social graph, indexed both ways
  feed_cache (user_id, post_id, score/ts)                   -- materialized per-user timeline (push model)

access patterns
  1. append a post                    (write)
  2. read a user's followees          (graph read)
  3. read a user's feed, paginated    (the hot read)`}
        />
      </Block>

      <Block eyebrow="minutes 14-24" title="High-level design: the two models on one board">
        <CodeBlock
          title="text"
          lang="text"
          code={`FAN-OUT ON WRITE (push):
  post -> [ post service ] -> [ posts DB ]
                           -> [ fan-out worker ] -> for each follower: append to feed_cache
  read -> [ feed service ] -> read own feed_cache  (O(1), pre-materialized)  <- FAST reads

FAN-OUT ON READ (pull):
  post -> [ post service ] -> [ posts DB ]   (one write, no fan-out)
  read -> [ feed service ] -> get followees -> fetch each one's recent posts -> merge/rank  <- heavy reads

HYBRID (what you actually build):
  - push for normal authors  (followers under a threshold)
  - pull for celebrities     (followers over the threshold)
  - at read: read your precomputed feed_cache, then merge in the few celebs you follow, live`}
        />
        <p className="text-ink-dim leading-relaxed">
          Push makes reads O(1) at the cost of write amplification; pull makes writes O(1) at the cost of read
          amplification. Neither wins alone at Twitter scale, which is why the real answer is a hybrid keyed on
          follower count.
        </p>
      </Block>

      <Block eyebrow="deep-dive 1" title="Fan-out: write vs read, and the hybrid">
        <p className="text-ink-dim leading-relaxed mb-2">
          Toggle the model and the author type and watch where the work lands. A normal user is cheap to push;
          a celebrity is a write storm on push and a hot read on pull. The hybrid pushes for the many and
          pulls for the few.
        </p>
        <Try label="fan-out">
          <FanoutViz />
        </Try>
        <Callout kind="trap" title="Pure push dies on celebrities; pure pull dies on everyone">
          Pushing a celebrity's post to 50 million inboxes is a multi-minute write storm that starves every
          other writer. But pulling every feed load, gathering and merging hundreds of authors' posts on every
          refresh, wastes the easy win for the 99% of normal users whose feeds could have been precomputed.
          The hybrid is not a compromise; it is the correct answer to two different workloads.
        </Callout>
      </Block>

      <Block eyebrow="deep-dive 2" title="Serving the feed: cache, pagination, ranking">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Feed store:</strong> the per-user <code className="font-mono">feed_cache</code> is a capped list (say the newest ~800 post ids) in Redis or a wide-column store; you don't materialize infinite history, older pages fall back to pull.</li>
          <li><strong>Pagination:</strong> cursor-based, not offset. The cursor is the last-seen post id or timestamp, so new posts arriving at the top never shift the page and cause duplicates or skips.</li>
          <li><strong>Ranking:</strong> reverse-chron is the baseline; a ranked feed adds a scoring service that reorders the candidate set (recency, affinity, engagement) at read time, over the same precomputed candidates.</li>
          <li><strong>Cache-aside:</strong> the feed service reads the cache, and on a miss (cold user, evicted feed) rebuilds it by pulling followees, then writes it back. Pull is also the fallback path, not just the celebrity path.</li>
        </ul>
      </Block>

      <Block eyebrow="trade-offs" title="What each choice bought">
        <OpTable
          cols={["Decision", "Chose", "", "Alternative & why not"]}
          rows={[
            { op: "Feed build", avg: "hybrid push/pull", avgTone: "good", why: "Pure push is a celebrity write storm; pure pull wastes precompute for normal users. Hybrid pays each cost only where it's cheap." },
            { op: "Consistency", avg: "eventual", avgTone: "good", why: "A post appearing a few seconds late is fine; forcing strong consistency on a feed buys nothing and costs latency and availability." },
            { op: "Pagination", avg: "cursor", avgTone: "good", why: "Offset pagination duplicates and skips rows when the top of the feed shifts under the reader; cursors are stable." },
            { op: "Feed size", avg: "capped list", avgTone: "ok", why: "Materializing infinite history per user is unbounded storage; cap it and pull older pages on demand." },
          ]}
        />
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Where exactly do you set the celebrity threshold?</strong> Follower count is the knob,
            somewhere around the point where fan-out cost dominates, often tens of thousands to a hundred
            thousand followers. It's tunable and measured, not fixed: watch fan-out latency and feed-build
            cost, and move the line so the write-storm tail stays bounded.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A user follows 500 people including 3 celebrities. Walk the read.</strong> Read the
            precomputed <code className="font-mono">feed_cache</code>, which already holds posts from the ~497
            normal authors (pushed), then pull the 3 celebrities' recent posts live and merge them in by
            timestamp or score. Small live merge, mostly precomputed, that's the hybrid paying off on a real
            read.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do deletes and edits propagate through pushed feeds?</strong> The feed cache stores
            post <em>ids</em>, not post bodies, so the post DB stays the source of truth: a delete flips a flag
            there and the id is filtered at read (or lazily evicted). You never chase 50 million inbox copies
            to mutate them, storing ids, not content, is what makes push tolerable.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A celebrity with 50M followers posts. Trace the load spike.</strong> On the hybrid, that
            post is a <em>single</em> write to the posts DB, no fan-out, so there's no write storm. The cost
            moves to read time: their post is fetched and merged on their followers' feed loads, which is a hot
            read on one post row, absorbed by caching that post aggressively. Bounded work either way, which is
            the entire reason for the split.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "The whole design is fan-out. Push, fan-out on write, precomputes each user's feed when authors post,
          so reads are O(1) but a celebrity with millions of followers is a write storm. Pull, fan-out on read,
          keeps posting cheap but makes every feed load gather and merge hundreds of authors. So I build a
          hybrid: push for normal authors, pull for celebrities, and at read time I read the precomputed feed
          and merge in the few celebrities I follow live. Feeds are capped Redis lists of post ids, paginated
          by cursor, with eventual consistency because a post arriving a few seconds late is fine."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Requirements: post, follow, and view a recent timeline of people you follow, read-heavy, feed loads
          that feel instant, high availability, and eventual consistency is acceptable. The math: 300 million
          daily users opening the feed about ten times a day is roughly 35,000 reads a second against maybe a
          thousand posts a second, so about 35 to 1, and reads must be fast, which pushes me to precompute. But
          the number that decides the design is fan-out cost: a normal author has a few hundred followers, so a
          post writes a few hundred feed entries, fine, while a celebrity has tens of millions, so a naive push
          is a multi-minute write storm. So: fan-out on write precomputes feeds for cheap reads but amplifies
          writes; fan-out on read keeps writes cheap but makes reads gather and merge everything; and I build a
          hybrid keyed on follower count, push for the many normal authors, pull for the few celebrities. At
          read time a user reads their precomputed feed cache, then merges in the handful of celebrities they
          follow live. The feed cache stores post ids, not bodies, in a capped list in Redis, so the posts DB
          stays the source of truth and deletes or edits are just a flag flip filtered at read, no chasing
          millions of inbox copies. Pagination is cursor-based so the page stays stable as new posts arrive,
          and ranking, if asked, is a scoring service that reorders the precomputed candidates at read time."
        </Callout>
      </Block>
    </>
  );
}

/* ── Design: chat / messaging ─────────────────────────────────── */
function Chat() {
  return (
    <>
      <Lede>
        "Design a real-time chat like WhatsApp or Slack, one-to-one and group messages, delivered instantly,
        with delivery and read receipts and presence." The crux is the persistent connection: how do millions
        of clients stay reachable for server push, how do messages get ordered and delivered exactly once to
        each device, and what happens when a recipient is offline.
      </Lede>

      <Block eyebrow="minutes 0-10" title="Requirements and the estimate">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional:</strong> send/receive 1:1 and group messages in real time; delivery and read
          receipts; online/last-seen presence; message history and multi-device sync.{" "}
          <strong>Non-functional:</strong> low delivery latency, ordered per-conversation, no lost messages
          (durable), and availability. <strong>Out of scope:</strong> voice/video calls; we design the
          messaging plane.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`50M DAU, ~40 messages/user/day

messages:  50M x 40 / 86,400   = ~23K msg/s   (peak ~5x = ~115K/s)
storage:   50M x 40 x 365      = ~730B msg/yr
           730B x ~200 bytes    = ~145 TB/yr    -> sharded, time-partitioned

the number that shapes the design: CONCURRENT CONNECTIONS
  ~10M users online at once, each holding a live socket
  one server handles ~100K-1M sockets -> need a fleet of connection gateways
  plus a routing layer: which gateway currently holds user X's socket?`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you center the design on the persistent connection and its routing problem, not on the message
          table. The signal is naming "which gateway holds this user's live socket, and how do I route a message
          to it" as the hard part, plus honest delivery semantics.
        </Callout>
      </Block>

      <Block eyebrow="minutes 10-14" title="API and data model">
        <CodeBlock
          title="text"
          lang="text"
          code={`transport: a persistent WebSocket per client to a connection gateway
  client -> ws.send({ to, conversation_id, client_msg_id, body })
  server -> ws.push({ message })          -- server-initiated delivery
  plus: ACK frames for delivered/read receipts, presence heartbeats

data model
  messages     (conversation_id PK, message_id (time-sortable), sender_id, body, created_at)
               -- partitioned by conversation_id, clustered by message_id -> ordered history
  conversations(conversation_id, [member_ids], last_message_id)
  inbox/mailbox(user_id, conversation_id, last_read_id, unread_count)   -- per-user cursor
  presence     (user_id -> gateway_id, last_seen)   -- who is connected where (in Redis)`}
        />
        <p className="text-ink-dim leading-relaxed">
          Ordering comes from a <strong>time-sortable message id</strong> (a Snowflake-style id or a per-
          conversation sequence), so history sorts correctly and clients detect gaps. The{" "}
          <code className="font-mono">presence</code> map, user to gateway, is the routing table that makes
          server push possible.
        </p>
      </Block>

      <Block eyebrow="minutes 14-24" title="High-level design: gateways, routing, and durability">
        <CodeBlock
          title="text"
          lang="text"
          code={`         persistent WebSocket                        message flow, sender -> recipient
  client ============ [ connection ]      [ chat    ]      [ messages ]
   (A)               [ gateway 1   ] ---> [ service ] ---> [ store    ]  (durable first!)
                          |                   |                 |
  client ============ [ connection ]          | 1. persist message, assign message_id
   (B)               [ gateway 2   ] <--------+ 2. look up recipient in presence map (Redis)
                          ^                    3. route to the gateway holding B's socket
                          |                    4. push over B's WebSocket; await ACK
                     [ presence /            5. if B offline: enqueue + trigger push notification
                       routing (Redis) ]     6. on B reconnect: sync from B's last_read cursor

  a message broker (Kafka/queue) sits between chat service and gateways so delivery
  survives a gateway crash and can be retried; the store is written BEFORE the push.`}
        />
        <p className="text-ink-dim leading-relaxed">
          The ordering that matters: <strong>persist first, then deliver</strong>. A message is durably stored
          and assigned its id before any push, so a gateway crash mid-delivery loses nothing, the recipient
          syncs the missed message from their cursor on reconnect.
        </p>
      </Block>

      <Block eyebrow="deep-dive 1" title="Why WebSocket, and the connection-routing problem">
        <OpTable
          cols={["Transport", "Character", "", "Verdict"]}
          rows={[
            { op: "Short polling", avg: "client asks every N sec", avgTone: "bad", why: "Wasteful and laggy: mostly empty responses, and latency is bounded by the poll interval. Not for real-time chat." },
            { op: "Long polling", avg: "hold the request open", avgTone: "ok", why: "Server holds the request until a message or timeout. Workable fallback, but a new HTTP request per message and awkward for server push at scale." },
            { op: "WebSocket", avg: "full-duplex, persistent", avgTone: "good", why: "One upgraded TCP connection, server pushes instantly, low per-message overhead. The default for chat; SSE if you only need server->client." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mb-2">
          WebSocket wins, but it creates the real problem: connections are <strong>stateful</strong>. Each
          gateway holds a set of live sockets, so to deliver to user B you must know <em>which gateway</em>
          currently holds B's socket. That's the presence/routing map in Redis: on connect, a gateway writes{" "}
          <code className="font-mono">user_id -&gt; gateway_id</code>; the chat service reads it to route; on
          disconnect it's cleared. Gateways are otherwise stateless and horizontally scaled behind a
          connection-aware load balancer.
        </p>
        <Callout kind="trap" title="The stateful-connection trap">
          Chat's hard part isn't the message table, it's that a live socket pins a user to one server. A
          candidate who draws a stateless service tier and a database, with no routing layer for "who holds B's
          connection right now," has missed the actual problem. Name the presence map and the broker.
        </Callout>
      </Block>

      <Block eyebrow="deep-dive 2" title="Delivery semantics, ordering, and offline">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>No lost messages:</strong> persist to the store before acknowledging the sender, so an ACK means durable, not just received. The sender shows "sent" on the store ACK and "delivered" on the recipient's ACK.</li>
          <li><strong>Exactly-once to the reader:</strong> the client sends a <code className="font-mono">client_msg_id</code>; the server dedups on it (retries won't double-store), and the recipient dedups on <code className="font-mono">message_id</code>. At-least-once transport plus idempotent ids equals effectively-once display.</li>
          <li><strong>Ordering:</strong> per-conversation order from the monotonic message id; clients render by id and can detect a gap (missing id) and backfill.</li>
          <li><strong>Offline recipient:</strong> the message is already durable, so enqueue it against their mailbox and fire a push notification (APNs/FCM). On reconnect the client pulls everything after its <code className="font-mono">last_read</code> cursor, syncing all devices.</li>
        </ul>
      </Block>

      <Block eyebrow="trade-offs" title="What each choice bought">
        <OpTable
          cols={["Decision", "Chose", "", "Alternative & why not"]}
          rows={[
            { op: "Transport", avg: "WebSocket", avgTone: "good", why: "Full-duplex server push at low overhead; polling is laggy and wasteful, long-poll is a serviceable fallback only." },
            { op: "Delivery order", avg: "persist then push", avgTone: "good", why: "A durable-first write means a gateway crash loses nothing; push-then-persist can drop a message on failure." },
            { op: "Dedup", avg: "client + message ids", avgTone: "good", why: "Idempotent ids make at-least-once transport safe; trying to build true exactly-once transport across a broker is fragile." },
            { op: "Group fan-out", avg: "server-side per member", avgTone: "ok", why: "Fine for small/medium groups; very large broadcast groups need a fan-out worker like a feed, not per-socket loops." },
          ]}
        />
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How do group messages differ from 1:1?</strong> The message is stored once per
            conversation, then delivered to each online member by looking each up in the presence map and
            pushing to their gateway. Small groups fan out inline; large broadcast groups (thousands of
            members) get a fan-out worker so one send doesn't block on thousands of sequential pushes, the feed
            pattern, reused.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A user is on phone and laptop at once. How does multi-device work?</strong> Presence maps a
            user to a <em>set</em> of gateway connections, one per device, and delivery pushes to all of them.
            Each device keeps its own <code className="font-mono">last_read</code> cursor, so read state and
            history stay consistent by syncing every device from the durable store on connect.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How does presence (online / last-seen) scale?</strong> Presence is high-churn and
            ephemeral, so it lives in Redis with a heartbeat TTL, not in the durable DB: a client heartbeats
            every few seconds, absence past the TTL flips them offline. You broadcast presence changes only to
            interested parties (open conversations), not globally, or presence traffic dwarfs messages.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A gateway holding 500K live sockets crashes. What happens?</strong> Those clients detect
            the dropped socket and reconnect, landing on another gateway that re-registers them in the presence
            map. In-flight messages were persisted before the push, so nothing is lost, each reconnecting
            client syncs from its cursor. This is why gateways must stay stateless beyond the socket itself.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Clients hold a persistent WebSocket to a fleet of stateless connection gateways, and a Redis
          presence map records which gateway holds each user's live socket so the server can push. On send I
          persist the message and assign a time-sortable id first, then look up the recipient's gateway and
          push over their socket, awaiting an ACK; if they're offline I enqueue it and fire a push notification,
          and they sync from their last-read cursor on reconnect. Ordering comes from the monotonic message id,
          and at-least-once delivery plus client and message ids gives effectively-once display. The hard part
          isn't the message table, it's routing to a stateful connection."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Requirements: real-time 1:1 and group messages, delivery and read receipts, presence, durable
          history, and multi-device sync, with low latency and no lost messages. The math is about 23,000
          messages a second at 50 million daily users and roughly 145 terabytes a year, both routine when
          sharded, but the number that shapes everything is concurrent connections: around 10 million live
          sockets, so I need a fleet of connection gateways each holding a large batch of WebSockets, plus a
          routing layer. WebSocket is the transport because it's full-duplex and lets the server push instantly
          at low overhead; polling is laggy and long-poll is only a fallback. The catch is that a socket is
          stateful, it pins a user to one gateway, so I keep a presence map in Redis, user to gateway, written
          on connect and cleared on disconnect, and the chat service reads it to route each message. Delivery
          is persist-then-push: I durably store the message and assign a monotonic, time-sortable id before any
          delivery, so a gateway crash loses nothing and the recipient re-syncs from their last-read cursor.
          A client message id dedups retries at the store and the message id dedups at the recipient, so
          at-least-once transport becomes effectively-once display, and per-conversation ordering falls out of
          the id. Offline recipients get the message enqueued and a push notification, and reconnect to sync
          all devices. Groups reuse the same path, small ones fan out inline, huge broadcast groups get a
          fan-out worker like a feed."
        </Callout>
      </Block>
    </>
  );
}

/* ── Design: ride-share & geo ─────────────────────────────────── */
function RideHail() {
  return (
    <>
      <Lede>
        "Design the matching backend for Uber or Lyft, riders request a ride, and we find and dispatch a
        nearby driver." Two things make this its own problem: a firehose of driver location updates (hundreds
        of thousands a second), and the geospatial query at the center, "which drivers are near this rider
        right now?" The crux is how you index location so that query is fast.
      </Lede>

      <Block eyebrow="minutes 0-10" title="Requirements and the estimate">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional:</strong> drivers publish live location; a rider requests a ride and gets matched
          to a nearby available driver; both see each other's live position during the trip.{" "}
          <strong>Non-functional:</strong> matching in a couple of seconds, location freshness within seconds,
          high availability, and correctness under contention (two riders must not get the same driver).{" "}
          <strong>Out of scope:</strong> pricing, routing/ETA maps; assume a maps service exists.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`1M active drivers, each pings location every ~4 s

location writes: 1M / 4 s        = ~250K updates/s   <- the firehose, the real load
ride requests:   ~5K/s peak                          <- tiny by comparison
so: location ingestion + geo-index freshness dominates; matching QPS is small

location payload ~ 50 bytes (lat, lng, driver_id, ts) -> ~12 MB/s ingest
we do NOT durably store every ping in a DB; current location lives in an
in-memory geo-index (Redis geo / a sharded quadtree), history is sampled async.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you separate the 250K/s location firehose from the low-rate matching query, and that you reach
          for a spatial index rather than scanning a table. Naming geohash, quadtree, or S2/H3 and explaining
          why a B-tree on lat/lng can't answer "who's near me" is the signal.
        </Callout>
      </Block>

      <Block eyebrow="minutes 10-14" title="API and data model">
        <CodeBlock
          title="text"
          lang="text"
          code={`API
  POST /drivers/location   { driver_id, lat, lng }         -- ~250K/s, fire-and-forget
  POST /rides/request      { rider_id, pickup_lat, lng }   -> { ride_id, matched_driver }
  GET  /rides/{id}/track                                    -> live driver position

data model
  driver_location  (driver_id -> lat, lng, geo_cell, status, updated_at)   -- in-memory, Redis
  geo_index        cell_id -> { set of driver_ids in that cell }           -- the spatial index
  rides            (ride_id PK, rider_id, driver_id, state, ...)            -- durable, the trip record

access pattern that decides everything:
  "give me available drivers within radius R of (lat, lng)"  -> spatial range query`}
        />
        <p className="text-ink-dim leading-relaxed">
          A plain index on latitude and longitude cannot answer a radius query efficiently, a B-tree orders on
          one dimension, so "near me" degenerates into scanning a lat band and filtering by longitude. You need
          an index built for 2D proximity.
        </p>
      </Block>

      <Block eyebrow="minutes 14-24" title="High-level design: firehose in, matching out">
        <CodeBlock
          title="text"
          lang="text"
          code={`LOCATION path (250K/s):
  driver app --loc--> [ location gateway ] --> [ geo-index service ]
                                                  update driver's cell in the
                                                  in-memory spatial index (Redis geo)
                                              --> sample to [ history store ] async

MATCHING path (5K/s):
  rider app --request--> [ matching service ]
                            1. compute rider's geo-cell + neighbor cells
                            2. query geo-index for available drivers in those cells
                            3. rank by ETA/distance, pick candidate
                            4. offer to driver; on decline, next candidate
                            5. LOCK the driver (atomic) so no double-dispatch
                            6. write the ride, both parties now track live

  the geo-index is sharded by region so no single node holds the whole map.`}
        />
        <p className="text-ink-dim leading-relaxed">
          Two independent scaling stories on one board: the location path is a write-optimized firehose into an
          in-memory index, and the matching path is a low-rate read that runs a spatial query and an atomic
          driver lock. Keeping them separate is the design.
        </p>
      </Block>

      <Block eyebrow="deep-dive 1" title="The geospatial index: geohash vs quadtree vs S2/H3">
        <p className="text-ink-dim leading-relaxed mb-2">
          This is the crux. All of these turn 2D proximity into a 1D or hierarchical key you can index and
          shard:
        </p>
        <OpTable
          cols={["Index", "How it works", "", "Trade"]}
          rows={[
            { op: "Geohash", avg: "interleave lat/lng into a base32 prefix", avgTone: "good", why: "Nearby points share a prefix, so a radius query becomes a prefix match plus the 8 neighbor cells. Simple, Redis-native. Edge case: points across a cell boundary need neighbor checks." },
            { op: "Quadtree", avg: "recursively split space into 4", avgTone: "good", why: "Cells subdivide where density is high, so a dense city and an empty desert both stay balanced. Great for skew; more work to build and rebalance than a flat geohash." },
            { op: "S2 / H3", avg: "hierarchical cells on a sphere", avgTone: "good", why: "Google S2 (square cells) and Uber H3 (hexagons) handle the globe's curvature and give uniform neighbors; H3's hexagons avoid the corner-neighbor problem. The production choice at scale." },
          ]}
        />
        <Callout kind="tip" title="The call">
          A <strong>geohash grid in Redis</strong> is the clean interview default: bucket each driver into a
          cell, and a radius query reads the rider's cell plus its neighbors. Mention <strong>quadtrees</strong>
          for density skew (cities vs countryside) and <strong>H3</strong> as what Uber actually uses,
          hexagons give every cell six equidistant neighbors and dodge the geohash boundary problem. Picking
          cell size is the real tuning: too big and each query scans too many drivers, too small and one radius
          spans too many cells.
        </Callout>
      </Block>

      <Block eyebrow="deep-dive 2" title="The firehose and no double-dispatch">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Don't persist every ping:</strong> 250K writes/s to a durable DB is wasteful and pointless, only the <em>current</em> location matters for matching. Keep it in an in-memory geo-index; sample locations to a history store asynchronously for analytics and trip replay.</li>
          <li><strong>Update in place:</strong> a location update moves a driver from one cell to another in the index (remove from old set, add to new). Redis geo commands or a sharded in-memory quadtree do this in O(1)-ish per update.</li>
          <li><strong>Atomic driver lock:</strong> the correctness bug interviewers hunt for is two riders matched to one driver. Guard it with an atomic compare-and-set on driver status (available to reserved) in Redis or a conditional write, so exactly one matcher wins the driver.</li>
          <li><strong>Regional sharding:</strong> shard the index by geography so a metro's traffic stays on its own nodes; matching queries are always local to a region, so cross-shard queries are rare.</li>
        </ul>
        <Callout kind="trap" title="Two riders, one driver">
          The classic failure is a race where two matching services both read the same driver as available and
          both dispatch. The fix is an atomic reservation, compare-and-set the driver's status, so only one
          matcher can flip available to reserved; the loser moves to the next candidate. Say this unprompted.
        </Callout>
      </Block>

      <Block eyebrow="trade-offs" title="What each choice bought">
        <OpTable
          cols={["Decision", "Chose", "", "Alternative & why not"]}
          rows={[
            { op: "Location store", avg: "in-memory geo-index", avgTone: "good", why: "Only current position matters; durably writing 250K pings/s to a DB is cost with no benefit. History is sampled async." },
            { op: "Spatial index", avg: "geohash / H3 cells", avgTone: "good", why: "A B-tree on lat/lng can't do radius queries; grid/hex cells turn proximity into a cheap cell lookup." },
            { op: "Sharding", avg: "by geography", avgTone: "good", why: "Traffic is inherently local; regional shards keep queries on one node and match the real load distribution." },
            { op: "Dispatch safety", avg: "atomic reservation", avgTone: "good", why: "Optimistic reads double-dispatch under contention; a compare-and-set on driver status guarantees one winner." },
          ]}
        />
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you pick the geohash cell size?</strong> It's a density trade-off: the cell should
            hold enough drivers that a rider's cell plus neighbors yields candidates, but few enough that the
            query is cheap. Dense cities want smaller cells than rural areas, which is exactly the argument for
            a quadtree or a variable H3 resolution instead of one fixed grid.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A driver sits exactly on a cell boundary and the nearest driver is one cell over. Bug?</strong>
            No, and it's why you always query the rider's cell <em>plus its neighbors</em> (8 for geohash, 6 for
            H3), not just the single cell. The radius search spans a small neighborhood of cells and filters by
            true distance, so a boundary driver is still found.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What happens to the 250K/s firehose when a region's index node fails?</strong> Location is
            ephemeral and re-published every few seconds, so a failed node's drivers simply repopulate a
            replacement within one heartbeat cycle, no durable recovery needed. That's the upside of treating
            current location as disposable in-memory state, failure heals itself in seconds.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Where does CAP land here?</strong> Location and matching favor availability and freshness
            over strict consistency, a slightly stale driver position is fine. But the driver <em>reservation</em>
            is the one place you want strong consistency, an atomic single-key compare-and-set, so double-dispatch
            can't happen. Different consistency for different parts of one system.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "There are two workloads: a firehose of about 250,000 driver location updates a second, and a low-rate
          matching query. Current location lives in an in-memory geospatial index, not a durable DB, because
          only the latest position matters. I index location with a geohash grid, or H3 hexagons at scale, so
          'drivers near this rider' becomes a lookup of the rider's cell plus neighbors instead of a table scan.
          Matching queries that index, ranks candidates by ETA, and reserves the driver with an atomic
          compare-and-set so two riders can never get the same driver. The whole thing is sharded by geography."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Requirements: drivers stream location, riders request and get matched to a nearby available driver in
          a couple of seconds, both track each other live, and matching must be correct under contention. The
          math splits the problem: a million active drivers pinging every four seconds is about 250,000 location
          updates a second, the real load, while ride requests are only a few thousand a second. So I don't
          durably store every ping, only the current position matters, and it lives in an in-memory geospatial
          index; I sample to a history store asynchronously. The crux is that index: a B-tree on latitude and
          longitude can't answer a radius query, so I use a spatial index that turns 2D proximity into a cell
          key, a geohash grid where nearby points share a prefix, a quadtree if I want cells to subdivide with
          density, or H3 hexagons, which is what Uber uses, because hexagons give six equidistant neighbors and
          avoid the geohash boundary problem. A location update just moves a driver between cell sets. Matching
          computes the rider's cell plus neighbors, queries the index for available drivers, ranks by ETA, and
          then does the one thing that must be strongly consistent: an atomic compare-and-set on the driver's
          status from available to reserved, so two riders can't be dispatched the same driver. Everything is
          sharded by geography because traffic is local, and a failed index node self-heals within one heartbeat
          since locations are re-published constantly."
        </Callout>
      </Block>
    </>
  );
}

/* ── Design: notification system ──────────────────────────────── */
function Notifications() {
  return (
    <>
      <Lede>
        "Design a notification system that sends push, SMS, and email across the company, triggered by any
        service, at scale, reliably." It looks like glue, and that's the trap, the difficulty is all in the
        cross-cutting concerns: fan-out, deduplication and idempotency, per-user rate limiting, third-party
        gateway failure, and retries without spamming anyone.
      </Lede>

      <Block eyebrow="minutes 0-10" title="Requirements and the estimate">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional:</strong> any internal service can trigger a notification to a user across
          channels (push, SMS, email); users have preferences and quiet hours; templated content.{" "}
          <strong>Non-functional:</strong> reliable delivery (retry on transient failure), no duplicate spam,
          respect per-user rate limits, and handle third-party gateway outages gracefully.{" "}
          <strong>Out of scope:</strong> the content/ranking of what to send; we're the delivery pipe.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`500M notifications/day across channels

avg rate:  500M / 86,400   = ~5,800/s     peak (10x, campaigns) = ~58K/s
so it's bursty: a marketing blast or an incident can 10x the steady rate instantly
  -> a QUEUE between triggers and senders is mandatory (absorb bursts, smooth to
     gateway rate limits), not optional

fan-out: one "breaking news" trigger -> millions of recipients -> a fan-out worker,
same shape as the feed. per-channel senders throttle to each provider's limits.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you treat this as a reliability-and-idempotency problem, not a plumbing exercise. The signals
          are: a queue to absorb bursts, an idempotency key to kill duplicates, per-user rate limiting, and a
          retry-with-DLQ story for flaky third-party gateways.
        </Callout>
      </Block>

      <Block eyebrow="minutes 10-14" title="API and data model">
        <CodeBlock
          title="text"
          lang="text"
          code={`API
  POST /notify   { user_id, template_id, data, channels?, idempotency_key }  -> 202 Accepted

data model
  notifications  (id PK, user_id, template_id, channel, status, idempotency_key, created_at)
                 -- status: queued -> sent -> delivered / failed; unique(idempotency_key)
  preferences    (user_id, channel, enabled, quiet_hours, rate_limit)
  templates      (template_id, channel, body, locale)
  dedup          (idempotency_key -> notification_id)   -- fast existence check, TTL'd

access patterns
  1. accept + dedup a trigger (write, idempotent on key)
  2. resolve user prefs + template  (read)
  3. record status transitions      (write, for retries + audit)`}
        />
      </Block>

      <Block eyebrow="minutes 14-24" title="High-level design: queue, workers, per-channel senders">
        <CodeBlock
          title="text"
          lang="text"
          code={`any service --POST /notify--> [ ingest API ]
                                 | 1. idempotency check (seen this key? drop dup)
                                 | 2. enqueue
                                 v
                            [ message queue ]  (Kafka/SQS; absorbs 10x bursts)
                                 |
                                 v
                            [ processing workers ]
                                 | resolve preferences + quiet hours + rate limit
                                 | render template, split per channel
                                 v
             +----------------+----------------+----------------+
             v                v                v
     [ push sender ]   [ SMS sender ]   [ email sender ]     <- each rate-limited to its provider
             |                |                |
        [ APNs/FCM ]     [ Twilio ]       [ SES/SendGrid ]   <- third-party gateways
             |
      status callback -> update notification status; failures -> retry queue -> DLQ`}
        />
        <p className="text-ink-dim leading-relaxed">
          The queue is the backbone: it decouples the many trigger sources from the rate-limited senders and
          absorbs campaign bursts. Each channel has its own sender pool throttled to that provider's limits, so
          a slow SMS gateway never backs up email.
        </p>
      </Block>

      <Block eyebrow="deep-dive 1" title="Idempotency and dedup: never send the same thing twice">
        <p className="text-ink-dim leading-relaxed mb-2">
          At-least-once queues, retries, and buggy callers all cause duplicate triggers. The fix is an{" "}
          <strong>idempotency key</strong> supplied by the caller (or derived from event id + user + template):
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`on POST /notify:
  key = request.idempotency_key
  if EXISTS(dedup, key):           # atomic check-and-set (Redis SETNX / unique index)
      return 202 (already accepted, drop the duplicate)
  else:
      SETNX(dedup, key) with TTL
      enqueue notification

# the same key flowing through a retry hits the dedup store and is dropped,
# so an at-least-once pipeline delivers effectively-once to the user.`}
        />
        <Callout kind="trap" title="Dedup must be atomic, and it protects the whole path">
          A non-atomic "check then insert" races, two concurrent retries both pass the check and both send. Use
          an atomic SETNX or a unique constraint on the idempotency key. Also dedup close to the gateway, not
          only at ingest, so a retry after a sender crash doesn't re-send a message that already went out.
        </Callout>
      </Block>

      <Block eyebrow="deep-dive 2" title="Rate limiting, retries, and dead letters">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Per-user rate limiting:</strong> a token bucket per user (and per channel) so no one gets flooded, even if ten services all trigger at once. This is the rate-limiter design, reused as a component here.</li>
          <li><strong>Provider rate limiting:</strong> each sender pool is throttled to the gateway's quota (Twilio, SES have hard limits), so we shape our own outflow instead of getting 429'd and dropping.</li>
          <li><strong>Retries with backoff:</strong> transient gateway failures (timeouts, 5xx, 429) go to a retry queue with exponential backoff and jitter; permanent failures (invalid number, unsubscribed) fail fast, no retry.</li>
          <li><strong>Dead-letter queue:</strong> after N failed retries, park the message in a DLQ with the error, for inspection and manual replay, never an infinite retry loop that hammers a downed provider.</li>
          <li><strong>Quiet hours & preferences:</strong> checked at processing time; a notification outside a user's window is deferred or dropped per policy, before it ever reaches a sender.</li>
        </ul>
      </Block>

      <Block eyebrow="trade-offs" title="What each choice bought">
        <OpTable
          cols={["Decision", "Chose", "", "Alternative & why not"]}
          rows={[
            { op: "Ingest", avg: "queue-backed async", avgTone: "good", why: "Bursty 10x campaign traffic must be absorbed and smoothed to provider limits; synchronous sending would drop or block under load." },
            { op: "Dedup", avg: "idempotency key", avgTone: "good", why: "At-least-once delivery plus retries guarantee duplicate triggers; the key makes the whole path effectively-once." },
            { op: "Senders", avg: "per-channel pools", avgTone: "good", why: "Each provider has its own limits and failure modes; isolating them stops a slow SMS gateway from starving email." },
            { op: "Failure", avg: "retry + DLQ", avgTone: "good", why: "Backoff handles transient outages; a DLQ bounds retries so a downed provider can't create an infinite hammer loop." },
          ]}
        />
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A campaign fires 10 million notifications at once. What absorbs it?</strong> The queue,
            that's its whole purpose. Ingest accepts fast and returns 202; workers drain at a rate the
            providers can actually accept, throttled by the per-provider limiters. The blast is smoothed over
            minutes rather than dropped, and steady transactional traffic can ride a higher-priority queue so it
            isn't stuck behind the marketing blast.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A third-party gateway (say SMS) goes down for an hour. What happens?</strong> Transient
            failures retry with exponential backoff, so in-flight messages wait rather than fail; a circuit
            breaker on that sender stops hammering the dead provider and sheds to the retry queue. When it
            recovers, drain resumes; anything past its retry budget lands in the DLQ for replay. Email and push
            are unaffected because senders are isolated.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you guarantee a critical alert (2FA code) isn't stuck behind marketing?</strong>
            Priority queues or separate lanes by class: transactional and security notifications get their own
            high-priority path with tighter SLAs, marketing rides a bulk lane. Same infrastructure, different
            queues and rate budgets, so a 2FA code never waits behind a promo blast.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you know a notification was actually delivered, not just sent?</strong> Providers
            send delivery callbacks/webhooks, so status moves sent to delivered (or bounced) asynchronously.
            You track the state machine per notification, and delivery receipts feed both retries (a bounce may
            trigger a fallback channel) and analytics on channel health.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "It's a reliability and idempotency problem, not plumbing. Any service posts a trigger with an
          idempotency key; ingest dedups on that key atomically and enqueues. A queue absorbs 10x campaign
          bursts and decouples triggers from delivery. Workers resolve preferences, quiet hours, and per-user
          rate limits, render the template, and hand off to per-channel sender pools, each throttled to its
          provider's limit. Transient gateway failures retry with exponential backoff behind a circuit breaker;
          after N tries they go to a dead-letter queue. Critical notifications ride a priority lane so a 2FA
          code never waits behind a marketing blast."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Requirements: any internal service can notify a user across push, SMS, and email, respecting
          preferences and quiet hours, reliably and without duplicates. It's about 5,800 notifications a second
          on average but bursty, a campaign or incident can 10x it instantly, so a queue between triggers and
          senders is mandatory to absorb bursts and smooth outflow to provider rate limits. The pipeline: an
          ingest API takes a trigger with an idempotency key, does an atomic dedup check, SETNX or a unique
          index, and enqueues; a duplicate key is dropped, so an at-least-once pipeline becomes effectively-once
          to the user. Workers pull from the queue, resolve the user's preferences, quiet hours, and per-user
          token-bucket rate limit, render the template, and split per channel. Each channel has its own sender
          pool throttled to that gateway's quota, Twilio, SES, APNs, and FCM all have hard limits, so isolating
          them means a slow SMS provider never backs up email. Failures are handled honestly: transient errors
          retry with exponential backoff and jitter behind a circuit breaker, permanent errors like an invalid
          number fail fast, and anything exceeding its retry budget lands in a dead-letter queue for inspection
          and replay rather than looping forever. Delivery callbacks move status from sent to delivered.
          Critical traffic like 2FA rides a separate high-priority lane so it's never stuck behind a bulk
          campaign."
        </Callout>
      </Block>
    </>
  );
}

/* ── Design: payments & ledger ────────────────────────────────── */
function Ledger() {
  return (
    <>
      <Lede>
        "Design the ledger behind a payments or wallet system, move money between accounts, and never lose,
        duplicate, or invent a cent." This is the one design where availability yields to correctness. The
        round is won on three things said precisely: double-entry bookkeeping, idempotency to stop double
        charges, and honest consistency semantics instead of a hand-waved "exactly-once."
      </Lede>

      <Block eyebrow="minutes 0-10" title="Requirements and the estimate">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional:</strong> transfer funds between accounts; record every movement immutably;
          expose balances and statements; support refunds and reversals. <strong>Non-functional:</strong>{" "}
          strong consistency and durability (money is the definition of "must not lose"), auditability, and
          correctness under concurrency and retries. <strong>Out of scope:</strong> card-network integration
          and fraud scoring; we design the ledger of record.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`payments are LOW volume, HIGH stakes vs a feed

throughput:  ~10K transactions/s peak is already a very large processor
storage:     append-only; every entry kept forever (regulatory) -> grows linearly,
             but rows are tiny and volume is modest -> storage is not the problem

the constraints that matter are NOT scale:
  - a transfer must be atomic (both legs commit or neither)
  - a retried request must NOT double-charge  (idempotency)
  - the ledger must be immutable + auditable   (append-only, no updates in place)
  -> this is a consistency + correctness design, so I optimize for that, not QPS.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you flip the usual priority out loud: "this is low-volume and high-stakes, so I optimize for
          correctness and consistency, not throughput." Reaching for double-entry, idempotency keys, and a
          precise consistency model, rather than sharding tricks, is the entire signal.
        </Callout>
      </Block>

      <Block eyebrow="minutes 10-14" title="API and data model: double-entry">
        <CodeBlock
          title="text"
          lang="text"
          code={`API
  POST /transfers  { from_account, to_account, amount, currency, idempotency_key }
                   -> { transfer_id, status }     -- idempotency_key is REQUIRED

data model  (append-only; you never UPDATE a posted entry)
  accounts       (account_id PK, balance, currency, version)   -- balance is a cache of entries
  ledger_entries (entry_id PK, transfer_id, account_id, amount_signed, created_at)
                 -- DOUBLE ENTRY: every transfer writes 2+ rows that SUM TO ZERO
                 --   from_account: -100     to_account: +100      (sum = 0, invariant)
  transfers      (transfer_id PK, idempotency_key UNIQUE, state, ...)
  idempotency    (idempotency_key -> transfer_id, response)     -- replay returns same result

invariant checkable at any time: SUM(amount_signed) over all entries = 0`}
        />
        <p className="text-ink-dim leading-relaxed">
          <strong>Double-entry</strong> is the core: money is never created or destroyed, only moved, so every
          transaction writes matched debit and credit entries that sum to zero. The balance is derivable by
          summing entries, which makes the whole ledger auditable and self-checking, if the entries don't sum
          to zero, something is wrong.
        </p>
      </Block>

      <Block eyebrow="minutes 14-24" title="High-level design: the transfer path">
        <CodeBlock
          title="text"
          lang="text"
          code={`client --POST /transfer (idempotency_key)--> [ payment service ]
                                                  |
     1. idempotency check: seen this key?         |  yes -> return the STORED result (no re-charge)
                                                  |  no  -> proceed
     2. begin transaction (single DB, or saga across services)
          - validate: from_account has sufficient funds
          - append ledger_entries: -amount (from), +amount (to)   [sum to zero]
          - update cached balances (guarded by account.version, optimistic lock)
          - record transfer state
        commit atomically  (both legs or neither)
                                                  |
     3. store idempotency_key -> result           v
                                            [ ledger DB: strongly consistent,
                                              append-only, replicated synchronously ]

  same-DB transfers: one ACID transaction. cross-service transfers: a SAGA with
  compensating reversals + an outbox, because you can't hold a 2PC lock across services.`}
        />
        <p className="text-ink-dim leading-relaxed">
          Within one database the two legs are a single ACID transaction, atomic by construction. Across
          services (say the payer and payee live in different systems) you can't hold a distributed lock, so
          you use a saga: local transactions chained with compensating reversals, accepting visible
          intermediate states in exchange for availability.
        </p>
      </Block>

      <Block eyebrow="deep-dive 1" title="Idempotency: the anti-double-charge">
        <p className="text-ink-dim leading-relaxed mb-2">
          Networks retry. A client that times out and retries a transfer must not move money twice. The{" "}
          <strong>idempotency key</strong> makes a retry a no-op that returns the original result:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`POST /transfer  with  idempotency_key = "abc-123"

first time:   key not seen -> execute transfer -> STORE (key -> transfer_id, result)
retry:        key seen      -> DO NOT execute   -> return the stored result verbatim

enforcement: UNIQUE constraint on idempotency_key, or an atomic INSERT that fails
on the second attempt. the check and the transfer commit in the SAME transaction,
so a crash between "charged" and "recorded key" can't leave a charge without a key.`}
        />
        <Callout kind="trap" title="The idempotency key and the charge must commit together">
          If you charge, then separately record the key, a crash in between lets the retry charge again. Bind
          them in one transaction (or make the whole operation resumable from a durable request record), so the
          money movement and the dedup record are atomic. This is the single most important sentence in a
          payments design.
        </Callout>
      </Block>

      <Block eyebrow="deep-dive 2" title="Consistency: say it precisely, not 'exactly-once'">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Strong consistency on the ledger:</strong> balances and entries are read-your-writes and serializable enough that you never over-spend. This is a CP choice, if a partition forces it, refuse the write rather than risk a double-spend.</li>
          <li><strong>Atomicity of the two legs:</strong> single-DB uses an ACID transaction; cross-service uses a saga with compensations plus a transactional outbox so the "money moved" event is published exactly with the commit.</li>
          <li><strong>Effectively-once, not exactly-once:</strong> the network is at-least-once, so honestly it's at-least-once delivery plus idempotent apply equals effectively-once <em>results</em>. Never claim end-to-end exactly-once across services.</li>
          <li><strong>Concurrency on a balance:</strong> two transfers debiting the same account race, guard with optimistic locking (an account version) or a per-account serialized queue, so the balance can't go negative from a lost update.</li>
        </ul>
        <Callout kind="tip" title="The CAP sentence for money">
          "For a ledger I choose consistency over availability, it's a CP system. On a network partition I'd
          rather reject a transfer than allow a double-spend, because an unavailable payment is a retry, but a
          wrong balance is a lawsuit." Saying that trade explicitly is the senior marker.
        </Callout>
      </Block>

      <Block eyebrow="trade-offs" title="What each choice bought">
        <OpTable
          cols={["Decision", "Chose", "", "Alternative & why not"]}
          rows={[
            { op: "Model", avg: "double-entry, append-only", avgTone: "good", why: "Self-auditing (entries sum to zero) and immutable; a single mutable balance column loses history and hides bugs." },
            { op: "Consistency", avg: "strong / CP", avgTone: "good", why: "Money can't be eventually consistent; an unavailable transfer is a retry, a wrong balance is unrecoverable. Availability yields here." },
            { op: "Dedup", avg: "idempotency key", avgTone: "good", why: "Retries are inevitable; the key bound into the transaction makes double-charge impossible, not just unlikely." },
            { op: "Cross-service", avg: "saga + outbox", avgTone: "ok", why: "2PC blocks and holds locks across services; a saga trades isolation for availability with compensating reversals." },
          ]}
        />
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How do refunds and reversals work in an append-only ledger?</strong> You never edit or
            delete a posted entry, you append a compensating entry that reverses it, linked to the original.
            The balance nets out correctly and the audit trail shows both the charge and its reversal, which is
            exactly what regulators and disputes require.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Two transfers hit the same account at once and it has just enough for one. What stops an
            overdraft?</strong> Serialize per account, either optimistic locking on an account version (the
            second commit sees a stale version and retries against the new balance) or a per-account queue so
            debits apply one at a time. The funds check and the debit are in one transaction, so a lost update
            can't drive the balance negative.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Do you compute balance by summing entries every time?</strong> Summing all history is
            correct but slow, so you keep a cached balance updated in the same transaction as the entries, and
            periodically reconcile it against the sum of entries as a consistency check. The cached balance is
            fast; the entry sum is the source of truth that catches drift.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The payer and payee are in different services. How do you keep it atomic?</strong> You
            can't with a single transaction, so it's a saga: debit the payer locally, emit an event via a
            transactional outbox, credit the payee, and if any step fails, run compensating reversals. It's
            effectively-once via idempotency, and intermediate states (money "in flight") are visible and
            explicitly modeled, not hidden.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Money is low-volume and high-stakes, so I optimize for correctness, not throughput. The ledger is
          double-entry and append-only: every transfer writes matched debit and credit entries that sum to
          zero, so it's self-auditing and the balance is derivable. Every transfer carries a required
          idempotency key, and the dedup record commits in the same transaction as the money movement, so a
          retry can never double-charge. Same-DB transfers are one ACID transaction; cross-service uses a saga
          with compensating reversals and an outbox. It's a CP system, on a partition I reject the transfer
          rather than risk a double-spend, and I call the semantics effectively-once, not exactly-once."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Requirements: move money between accounts, record every movement immutably, expose balances and
          statements, support refunds, with strong consistency, durability, and auditability. I say up front
          that this is low-volume, high-stakes, even 10,000 transactions a second is a huge processor, and the
          rows are tiny, so scale isn't the problem; correctness is. The model is double-entry: money is never
          created or destroyed, only moved, so each transfer appends matched debit and credit entries that sum
          to zero, and the sum of all entries being zero is an invariant I can check anytime. Balances are a
          cached derivation of the entries, updated in the same transaction and periodically reconciled against
          the entry sum. Every transfer requires an idempotency key, and the crucial detail is that the dedup
          record and the money movement commit in one transaction, so a crash between charging and recording
          the key can't double-charge on retry. Within one database the two legs are a single ACID transaction;
          across services I use a saga with compensating reversals and a transactional outbox, because you
          can't hold a two-phase-commit lock across services, and I model money-in-flight as a visible
          intermediate state. On consistency I'm precise: it's a CP system, on a partition I'd rather reject a
          transfer than allow a double-spend, and I call the end-to-end semantics effectively-once, at-least-once
          delivery made safe by idempotent apply, rather than claiming true exactly-once. Refunds are
          compensating entries, never edits, and concurrent debits on one account are serialized by optimistic
          version locking so the balance can't go negative."
        </Callout>
      </Block>
    </>
  );
}

/* ── Design: distributed rate limiter ─────────────────────────── */
function RateLimiter() {
  return (
    <>
      <Lede>
        "Design a rate limiter that caps each client to N requests per window, works across a fleet of API
        servers, and adds almost no latency." The round turns on two crux calls: which counting algorithm
        (token bucket vs sliding window and friends), and where the shared counter lives so many servers agree
        without a round-trip on every request killing your latency.
      </Lede>

      <Block eyebrow="minutes 0-10" title="Requirements and the estimate">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Functional:</strong> limit each identity (user, API key, IP) to N requests per time window;
          allow reasonable bursts; return 429 with a <code className="font-mono">Retry-After</code> when
          exceeded; support different limits per tier/endpoint. <strong>Non-functional:</strong> the check
          must add sub-millisecond latency, be accurate enough, work across many servers, and fail open or
          closed by policy. <strong>Out of scope:</strong> the API business logic; we're the gate in front.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`fronting an API at ~1M requests/s across a fleet of, say, 1,000 servers

per request: one counter read+increment. at 1M/s that's 1M counter ops/s.
budget: the limiter can add at most ~1 ms, ideally microseconds -> a network
hop to a central store per request is borderline; caching + atomic ops matter.

memory: one counter per active client key. 10M active keys x ~50 bytes = ~500 MB
  -> fits in a single Redis node's memory; shard by key if it grows.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you can name and contrast the counting algorithms precisely (token bucket vs fixed vs sliding
          window) and that you confront the distributed-state problem: many servers, one shared count, done
          atomically without a per-request latency tax. Vague "just use Redis" without the atomicity and
          accuracy trade-offs is mid-level.
        </Callout>
      </Block>

      <Block eyebrow="minutes 10-14" title="The algorithms: pick with intent">
        <OpTable
          cols={["Algorithm", "How it works", "", "Trade"]}
          rows={[
            { op: "Token bucket", avg: "bucket refills at rate r, each request takes 1 token", avgTone: "good", why: "Allows bursts up to bucket size, then steady rate. Two numbers per key (tokens, last-refill). The common default, great for 'N/sec with bursts'." },
            { op: "Leaky bucket", avg: "requests queue, drain at fixed rate", avgTone: "ok", why: "Smooths output to a constant rate (no bursts). Good for shaping downstream load; needs a queue and adds latency when full." },
            { op: "Fixed window", avg: "count per aligned window (per minute)", avgTone: "ok", why: "Dead simple (one counter + TTL), but allows a 2x burst at the window boundary: N at :59 and N at :00." },
            { op: "Sliding window log", avg: "timestamp of every request, count last N", avgTone: "bad", why: "Exact, no boundary spike, but stores every timestamp per key, memory-heavy at scale." },
            { op: "Sliding window counter", avg: "weight current + previous window", avgTone: "good", why: "Approximates the sliding log with two counters and a weighted blend. Smooths the boundary spike cheaply. The scalable accurate choice." },
          ]}
        />
        <Callout kind="tip" title="The call">
          <strong>Token bucket</strong> for "N per second with bursts", it's simple, O(1) state, and matches how
          people think about limits. <strong>Sliding window counter</strong> when you need accuracy without the
          fixed-window boundary spike and can't afford the sliding-log's memory. Name fixed window's 2x
          boundary burst as the reason you'd upgrade to sliding.
        </Callout>
      </Block>

      <Block eyebrow="minutes 14-24" title="High-level design: where the counter lives">
        <CodeBlock
          title="text"
          lang="text"
          code={`client --> [ API server 1 ] --+
client --> [ API server 2 ] --+--> [ central counter store: Redis ]
client --> [ API server N ] --+       atomic INCR / token-bucket via a Lua script
                                      (check-and-decrement in ONE round-trip, no race)
              |
              +-- local token cache: each server holds a small local allowance and
                  syncs with Redis periodically, so not every request pays a hop.

decision per request:
  1. build key = {client_id}:{window}     (or just client_id for token bucket)
  2. atomically decrement/increment in Redis (Lua = check + mutate atomically)
  3. allow if under limit, else 429 + Retry-After
  4. fail-open (allow) or fail-closed (deny) if the store is unreachable -> a policy call`}
        />
        <p className="text-ink-dim leading-relaxed">
          The distributed crux: many servers must share one count. A <strong>central store (Redis)</strong>
          with an <strong>atomic</strong> check-and-decrement (a Lua script, so the read and the write can't
          race) is the standard answer. To dodge a network hop per request, servers hold a small local
          allowance and reconcile with Redis periodically, trading a little accuracy for a lot of latency.
        </p>
      </Block>

      <Block eyebrow="deep-dive 1" title="The distributed-counter problem and atomicity">
        <p className="text-ink-dim leading-relaxed mb-2">
          On one server a rate limiter is a local counter. Across a fleet, two servers reading-then-writing the
          same counter race and let traffic slip past the limit. Two ways to make the shared count correct:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Atomic op in a central store:</strong> Redis <code className="font-mono">INCR</code> with a TTL for fixed window, or a Lua script that refills and decrements a token bucket in one atomic step, so check-and-mutate is a single round-trip with no read-modify-write race.</li>
          <li><strong>Local buckets with periodic sync:</strong> each server enforces a share of the global limit locally (fast, no hop) and reconciles with the central store every so often. Approximate, but removes the per-request network cost, the right trade at 1M QPS.</li>
        </ul>
        <Callout kind="trap" title="Read-modify-write races blow the limit">
          "GET the counter, check it, then SET it +1" is a race: two servers both read 99, both allow, both
          write 100, and you've served 101. Use an atomic increment or a Lua script so the check and the update
          are indivisible. This is the whole reason people say "Redis" for this, it's the atomic op, not the
          storage.
        </Callout>
      </Block>

      <Block eyebrow="deep-dive 2" title="Placement, failure mode, and headers">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Where it runs:</strong> at the API gateway / edge as middleware, so a rejected request never touches your business services. A sidecar or gateway plugin is the usual home.</li>
          <li><strong>Fail-open vs fail-closed:</strong> if the counter store is unreachable, do you allow or deny? Fail-open (allow) protects availability and is common for a soft limiter; fail-closed (deny) protects a system that must not be overrun. State the policy, it's a deliberate choice.</li>
          <li><strong>Response contract:</strong> return 429 with <code className="font-mono">Retry-After</code> and <code className="font-mono">X-RateLimit-Remaining</code>/<code className="font-mono">Reset</code> headers so clients back off intelligently instead of hammering.</li>
          <li><strong>Key granularity:</strong> limit per API key, per user, per IP, or per endpoint, often several at once (a global limit and a per-endpoint limit), each its own counter.</li>
        </ul>
      </Block>

      <Block eyebrow="trade-offs" title="What each choice bought">
        <OpTable
          cols={["Decision", "Chose", "", "Alternative & why not"]}
          rows={[
            { op: "Algorithm", avg: "token bucket / sliding counter", avgTone: "good", why: "Token bucket allows bursts with O(1) state; sliding counter fixes the fixed-window 2x boundary spike cheaply." },
            { op: "State store", avg: "Redis, atomic op", avgTone: "good", why: "Fast in-memory shared counter with atomic INCR/Lua; a relational DB is too slow per request and a plain read-write races." },
            { op: "Latency", avg: "local cache + periodic sync", avgTone: "ok", why: "A hop per request at 1M QPS is costly; local allowances trade a little accuracy for sub-ms checks." },
            { op: "Failure", avg: "fail-open (policy)", avgTone: "ok", why: "Availability-first default; fail-closed instead when protecting a fragile downstream is worth rejecting traffic on an outage." },
          ]}
        />
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Why is the fixed-window counter dangerous at the boundary?</strong> A client can send N
            requests in the last second of one window and N in the first second of the next, 2x the intended
            limit across a 2-second span, because the counter resets on the boundary. The sliding window counter
            fixes it by weighting the previous window's count into the current one, smoothing the reset.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you avoid a Redis round-trip on every one of a million requests?</strong> Local
            token buckets: give each server a slice of the global budget to spend locally with no hop, and
            reconcile with the central store periodically. You lose exactness (the global limit is approximate
            for a sync interval) but gain sub-millisecond checks, which is the correct trade at that scale.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The Redis holding your counters goes down. Now what?</strong> A pre-declared policy, not a
            live decision: fail-open to protect availability (most public APIs) or fail-closed to protect a
            fragile backend. Either way, local buckets keep enforcing an approximate limit during the outage, so
            you're never fully unprotected, and the store recovering just re-tightens accuracy.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you support different limits per tier and per endpoint at once?</strong> Multiple
            keys checked together: a per-user key for the account's global quota and a per-user-per-endpoint key
            for the expensive route, each with its own bucket. A request must pass all applicable limiters; the
            tightest one that trips returns the 429.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Two decisions carry it: the algorithm and where the counter lives. I default to a token bucket, it
          allows bursts up to the bucket size then a steady rate, with O(1) state per key; I switch to a sliding
          window counter when I need to kill the fixed-window 2x boundary spike without the memory of a full
          request log. Across a fleet the counter is shared in Redis, mutated atomically with a Lua script so
          check-and-decrement can't race. To avoid a network hop on every request at a million QPS, each server
          holds a local allowance and syncs periodically, trading a little accuracy for sub-millisecond checks.
          I run it at the gateway, return 429 with Retry-After, and pre-declare fail-open or fail-closed."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Requirements: cap each identity to N requests per window across many servers, allow reasonable
          bursts, 429 with Retry-After when exceeded, and add almost no latency. At around a million requests a
          second that's a million counter operations a second, and the limiter can spend maybe a millisecond, so
          a network hop per request is borderline and atomicity is essential. On algorithms: fixed window is one
          counter with a TTL but allows a 2x burst at the boundary, N at the end of one window and N at the start
          of the next; the sliding window log is exact but stores every timestamp; the sliding window counter
          approximates it with two counters and a weighted blend, cheap and accurate; and the token bucket, my
          default, refills tokens at the target rate and lets each request take one, which naturally allows
          bursts up to the bucket size with just two numbers per key. The distributed crux is that many servers
          must agree on one count, and a naive get-check-set races, so I use an atomic operation, Redis INCR
          with a TTL or a Lua script that refills and decrements a token bucket in one indivisible step. To dodge
          the per-request round-trip at that scale, each server holds a local slice of the budget and reconciles
          with the central store periodically, approximate but sub-millisecond. It lives at the API gateway so
          rejected requests never reach business logic, it returns 429 with Retry-After and remaining/reset
          headers, and I pre-declare fail-open for availability or fail-closed to protect a fragile downstream."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ───────────────────────────────────── */
const DECK = [
  { q: "What are the first two steps of the design round, before any technology?", a: "Clarify requirements (functional, non-functional, and out-of-scope), then a back-of-envelope estimate. Every component you draw later should trace to a requirement or a number you computed out loud.", tag: "framework" },
  { q: "Turn 100M writes/day into QPS in your head.", a: "86,400 seconds/day, call it ~100K. So 100M / 100K = ~1,000 writes/s average, and ~5K-10K at a 5x-10x peak factor. Reads are that times the read:write ratio.", tag: "estimation" },
  { q: "Give the storage-per-year formula.", a: "writes/day x bytes/row x 365, times retention years, times a replication factor (~3) for the real disk bill. Round hard, you want the order of magnitude that picks the storage tier.", tag: "estimation" },
  { q: "Latency ladder: memory vs SSD vs network vs cross-region, order of magnitude?", a: "RAM ~100 ns, SSD ~100 us, intra-datacenter round-trip ~0.5 ms, cross-region ~100 ms. Memory is ns, SSD us, network ms, cross-region ~100 ms, so RAM vs a cross-region call differs about a million-fold.", tag: "estimation" },
  { q: "URL shortener: why not just hash the long URL to make the key?", a: "Truncating a hash to 7 chars collides, so you need check-and-retry, and identical URLs map to one code. Prefer a distributed counter or key-gen service that leases id ranges and base62-encodes them, unique by construction.", tag: "url" },
  { q: "How many base62 characters for ~180B URLs, and why?", a: "62^7 = ~3.5 trillion, which is ~20x headroom over 180B, so 7 chars. 62^6 is only ~57B, too tight. The length comes from the storage estimate, not a memorized number.", tag: "url" },
  { q: "301 vs 302 redirect for a URL shortener, what's the trade?", a: "301 (permanent) is cached by browsers and CDNs, so you offload load but lose click analytics and can't change or revoke the target. 302 (temporary) sends every hit to your server, so you keep analytics, expiry, and revocation. Usually 302.", tag: "url" },
  { q: "Fan-out on write vs fan-out on read for a feed?", a: "Write (push) precomputes each user's feed when authors post, so reads are O(1) but a celebrity is a write storm. Read (pull) keeps posts cheap but makes every feed load gather and merge many authors. Push amplifies writes, pull amplifies reads.", tag: "newsfeed" },
  { q: "What's the celebrity problem and the hybrid answer?", a: "Pushing a celebrity's post to 50M inboxes is a multi-minute write storm. Hybrid: push for normal authors (cheap O(1) reads), pull for celebrities, and at read time merge the few celebrities you follow into your precomputed feed. Threshold on follower count.", tag: "newsfeed" },
  { q: "Why store post ids, not post bodies, in a pushed feed cache?", a: "So the posts DB stays the source of truth. A delete or edit is a flag flip filtered at read; you never chase millions of inbox copies to mutate them. Ids make push tolerable.", tag: "newsfeed" },
  { q: "WebSocket vs long polling for chat, and why?", a: "WebSocket is a persistent full-duplex connection, so the server pushes instantly at low per-message overhead, the default for chat. Long polling holds a request open until a message or timeout, a serviceable fallback but a new request per message and awkward for server push.", tag: "chat" },
  { q: "In chat, what's the routing problem WebSockets create?", a: "Connections are stateful, a live socket pins a user to one gateway. To deliver to user B you need a presence map (in Redis) of user -> gateway, written on connect and cleared on disconnect, so the chat service knows which server holds B's socket.", tag: "chat" },
  { q: "How do you guarantee no lost messages in chat?", a: "Persist-then-push: durably store the message and assign a time-sortable id before any delivery. A gateway crash then loses nothing, the recipient re-syncs missed messages from their last-read cursor on reconnect.", tag: "chat" },
  { q: "Why can't a B-tree on lat/lng answer 'drivers near me'?", a: "A B-tree orders on one dimension, so a 2D radius query degenerates into scanning a latitude band and filtering longitude. You need a spatial index (geohash, quadtree, S2/H3) that maps 2D proximity to a cell key.", tag: "ridehail" },
  { q: "Geohash vs quadtree vs H3, one line each.", a: "Geohash interleaves lat/lng into a prefix so neighbors share a prefix, simple and Redis-native. Quadtree recursively splits space into 4, so cells subdivide with density. H3 uses hexagons on a sphere, six equidistant neighbors, no boundary problem, what Uber uses.", tag: "ridehail" },
  { q: "Ride-share: what stops two riders from getting the same driver?", a: "An atomic reservation: compare-and-set the driver's status from available to reserved (in Redis or a conditional write), so exactly one matcher wins and the loser moves to the next candidate. The reservation is the one strongly-consistent part.", tag: "ridehail" },
  { q: "Notifications: what does the idempotency key protect against?", a: "Duplicate sends. At-least-once queues, retries, and buggy callers cause duplicate triggers; an atomic dedup on the key (SETNX or a unique index) drops the duplicate, so an at-least-once pipeline delivers effectively-once to the user.", tag: "notifications" },
  { q: "How do you handle a third-party gateway (SMS) going down for an hour?", a: "Transient failures retry with exponential backoff behind a circuit breaker so you stop hammering the dead provider; after N tries messages go to a dead-letter queue for replay, not an infinite loop. Isolated per-channel senders keep email and push unaffected.", tag: "notifications" },
  { q: "Why is a ledger a consistency problem, not a scale problem?", a: "Payments are low-volume, high-stakes, even 10K txns/s is huge and rows are tiny. The hard parts are atomic two-leg transfers, no double-charge on retry, and immutable auditability, so you optimize for correctness and consistency, not QPS.", tag: "ledger" },
  { q: "What is double-entry, and what invariant does it give you?", a: "Money is never created or destroyed, only moved, so each transfer appends matched debit and credit entries that sum to zero. The invariant: the sum of all ledger entries is always zero, so the ledger is self-auditing and balances are derivable.", tag: "ledger" },
  { q: "Idempotency key + charge: what's the one atomicity rule?", a: "The dedup record and the money movement must commit in the SAME transaction. If you charge then separately record the key, a crash between them lets the retry charge again. Bind them so double-charge is impossible, not just unlikely.", tag: "ledger" },
  { q: "Token bucket vs sliding window, and the fixed-window trap?", a: "Token bucket refills tokens at rate r and each request takes one, allowing bursts up to bucket size with O(1) state. Fixed window is one counter per aligned window but allows a 2x burst across the boundary (N at :59, N at :00); the sliding window counter weights the previous window in to smooth that spike.", tag: "ratelimiter" },
];

function Quickfire() {
  return (
    <>
      <Lede>
        Twenty-two cards spanning the framework, estimation, and all seven designs, key generation, redirects,
        fan-out, WebSockets, geohashing, idempotency, and rate-limiting algorithms. The rep that works: read
        the question, answer <strong>out loud</strong> in one or two sentences before revealing, then grade
        yourself honestly. Shuffle between runs so you're drilling recall, not card order.
      </Lede>
      <Try label="rapid fire"><QuickFire accent={ACCENT} deck={DECK} /></Try>
    </>
  );
}

const CONTENT = {
  framework: <Framework />,
  estimation: <Estimation />,
  urlshortener: <UrlShortener />,
  newsfeed: <NewsFeed />,
  chat: <Chat />,
  ridehail: <RideHail />,
  notifications: <Notifications />,
  ledger: <Ledger />,
  ratelimiter: <RateLimiter />,
  quickfire: <Quickfire />,
};

export default function Whiteboard() {
  const [active, setActive] = useState("framework");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="The design round · LIVE"
      title="The Whiteboard"
      subtitle="The general system-design round, a repeatable framework and seven classic designs rehearsed end to end, out loud."
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
