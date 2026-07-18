import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import MockTimerViz from "./mockdrills/MockTimerViz.jsx";

const ACCENT = "#E37400";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "how", label: "How to run a self-mock", group: "Method" },
  { id: "coding", label: "Coding mock (45 min)", group: "The drills" },
  { id: "design", label: "System-design mock (60 min)", group: "The drills" },
  { id: "behavioral", label: "Behavioral mock (45 min)", group: "The drills" },
  { id: "mistakes", label: "Top mistakes & self-correction", group: "The drills" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* Shared renderer for a bank of ready-to-run prompts. Fields are all optional
   so one component serves coding, design, and behavioral banks. */
function PromptBank({ items }) {
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-line bg-surface-2 p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
            <span className="font-mono text-[12px] font-semibold text-ink">{it.name}</span>
            {it.ref && (
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap"
                style={{ color: ACCENT, borderColor: ACCENT }}
              >
                {it.ref}
              </span>
            )}
          </div>
          {it.pattern && (
            <p className="font-mono text-[11px] text-ink-faint mb-1.5">pattern: {it.pattern}</p>
          )}
          {it.signal && (
            <p className="text-[13px] leading-relaxed mb-1.5">
              <span
                className="font-mono text-[10px] uppercase tracking-wider mr-2"
                style={{ color: ACCENT }}
              >
                signal
              </span>
              <span className="text-ink-dim">{it.signal}</span>
            </p>
          )}
          {it.prompt && (
            <p className="text-[13px] text-ink-dim leading-relaxed mb-2">{it.prompt}</p>
          )}
          {it.approach && (
            <p className="text-[13px] leading-relaxed mb-2">
              <span
                className="font-mono text-[10px] uppercase tracking-wider mr-2"
                style={{ color: ACCENT }}
              >
                approach
              </span>
              <span className="text-ink-dim">{it.approach}</span>
            </p>
          )}
          {it.spring && (
            <p className="text-[13px] leading-relaxed">
              <span className="font-mono text-[10px] uppercase tracking-wider mr-2 text-ink-faint">
                spring on yourself
              </span>
              <span className="text-ink-dim">{it.spring}</span>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* Shared renderer for a top-mistakes-and-fix list. */
function MistakeList({ items }) {
  return (
    <ol className="space-y-3">
      {items.map((m, i) => (
        <li key={i} className="rounded-lg border border-line bg-surface-2 p-3.5">
          <div className="text-[13px] text-ink font-medium leading-relaxed mb-1">
            {i + 1}. {m.mistake}
          </div>
          <div className="text-[13px] text-ink-dim leading-relaxed">
            <span
              className="font-mono text-[10px] uppercase tracking-wider mr-2"
              style={{ color: ACCENT }}
            >
              fix
            </span>
            {m.fix}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── How to run a self-mock ───────────────────────────────────── */
function How() {
  return (
    <>
      <Lede>
        You do not rise to the occasion in an interview, you fall to the level of your practice. A
        self-mock turns passive study into a rehearsed performance: start a real clock, talk out
        loud the whole time, record it, and score yourself against the same rubric the committee
        uses. The point is not to solve the problem. It is to manufacture quotable signal that a
        room full of strangers can argue for on your behalf.
      </Lede>

      <Block eyebrow="why timed mocks" title="Reading solutions is not practice">
        <p className="text-ink-dim leading-relaxed mb-2">
          Recognizing an answer on a page and producing it out loud under a running clock are
          different skills, and only the second one gets tested. The interview is a performance with
          a time budget, an audience, and a script you have to narrate live. You rehearse a
          performance by performing it: full length, full pressure, no pausing to peek. Everything
          here is built to be run end to end with a timer going, then reviewed on the tape.
        </p>
        <p className="text-ink-dim leading-relaxed">
          The three rounds fail for different reasons, so they drill differently. Coding fails on
          silence and untested code. Design fails on staying at boxes-and-arrows altitude.
          Behavioral fails on team-scope stories and the word "we." Each drill targets its own
          failure mode, and the phase timer keeps you honest about pacing, the skill no amount of
          reading builds.
        </p>
      </Block>

      <Block eyebrow="the rules" title="Five rules that make a mock count">
        <CodeBlock
          title="text"
          lang="text"
          code={`1. START THE CLOCK. A real countdown, not a vague sense of time.
   Pacing is a scored skill; an untimed rep does not train it.
2. TALK OUT LOUD. Narrate every decision, every trade, every doubt.
   Silent-but-correct still fails: a silent candidate cannot be scored.
3. NO CRUTCHES (coding). A plain doc: no IDE autocomplete, no syntax
   help, no AI. Google's editor gives you none of it, so neither do you.
4. RECORD YOURSELF. Screen plus audio. On playback, flag every silence
   over 20 seconds and every step you did in your head but never said.
5. SCORE WITH THE RUBRIC. Afterward, not during. Grade each dimension
   1 to 4 and obey the self-score caps: a capped round gets redone.`}
        />
        <Callout kind="tip" title="The recording is the whole trick">
          You cannot feel your own silent gaps in the moment, adrenaline hides them. The tape does
          not. One honest replay of a mock, flagging every pause and every unspoken decision, is
          worth ten problems solved in your head.
        </Callout>
      </Block>

      <Block eyebrow="the framing" title="Impress the packet, not the interviewer">
        <p className="text-ink-dim leading-relaxed mb-2">
          The person across the table is not the decision-maker. They write up a packet, and a
          hiring committee that never met you decides from it. So your real job is to hand the
          interviewer sentences worth quoting: the pattern you named, the trade you weighed, the
          edge case you caught, the number you attached to the result. If it never left your head,
          it never makes the packet.
        </p>
        <Callout kind="note" title="If you did not say it, it did not happen">
          Treat every rep as generating evidence. When you finish a mock, ask the packet question:
          what are the three quotable sentences a committee could argue for? If you cannot name
          them, the round produced no signal no matter how well it "went."
        </Callout>
      </Block>

      <Block eyebrow="the instrument" title="The phase timer">
        <p className="text-ink-dim leading-relaxed mb-2">
          Each drill below is wired to a phase-based clock. It breaks the round into its real phases,
          counts each phase down and the whole mock down at once, auto-advances when a phase hits
          zero, and lets you skip ahead when you finish early. Run it live: when the phase name
          changes, change what you are doing. The moved-goalpost follow-up is baked into the last
          phase of each mock, so budget to reach it done and tested with time to spare.
        </p>
        <p className="text-ink-dim leading-relaxed">
          Fold these reps into a schedule and score them over time in{" "}
          <a href="#/mission-control" className="font-mono text-xs" style={{ color: ACCENT }}>
            Mission Control
          </a>{" "}
          , the 21-day plan and scorecard for the whole loop.
        </p>
      </Block>
    </>
  );
}

/* ── Coding mock ──────────────────────────────────────────────── */
const CODING_PROMPTS = [
  {
    name: "Alien Dictionary",
    ref: "LeetCode 269",
    pattern: "Topological sort (Kahn's BFS or DFS)",
    prompt:
      "Given a sorted dictionary of an alien language, derive a valid order of its letters. For each adjacent word pair the first differing character gives a directed edge u to v; guard the invalid case where a longer word precedes its own prefix (return empty). Build in-degrees, run Kahn's; if you cannot output every character there is a cycle.",
    spring:
      "Return ALL valid orderings (backtrack over the zero-in-degree choices), or: the constraints may be contradictory, detect and report the offending pair.",
  },
  {
    name: "LFU Cache with O(1) get / put",
    ref: "LeetCode 460",
    pattern: "Two hash maps + per-frequency doubly-linked lists",
    prompt:
      "Implement an LFU cache with O(1) operations. keyMap key to node{value, freq}; freqMap freq to a DLL of nodes in LRU order within that freq; track minFreq. On access, move the node up a freq bucket; on insert-over-capacity, evict the tail of the minFreq bucket.",
    spring:
      "Make it thread-safe under high concurrency (single lock vs per-bucket locks vs sharded LFU, discuss contention), or: add per-entry TTL expiry.",
  },
  {
    name: "Merge K sorted streams under a memory budget",
    ref: "LeetCode 23 variant",
    pattern: "K-way merge with a min-heap",
    prompt:
      "Merge K sorted streams into one sorted output when you cannot hold them all in memory. Min-heap of (value, streamId, cursor); pop the smallest, emit it, push the next element from that same stream; only K elements are resident at once.",
    spring:
      "Streams live on remote machines with network latency (prefetching iterators, read-ahead windows, backpressure), or: streams are unbounded, produce the merged result lazily.",
  },
  {
    name: "Async task scheduler with dependency resolution",
    ref: "concurrency",
    pattern: "DAG topological scheduling + ready-queue + worker pool",
    prompt:
      "Given tasks with dependencies, schedule execution respecting order and a max concurrency K. Model tasks as a DAG, compute in-degrees, feed a ready set (in-degree zero) to a K-sized worker pool; on completion decrement dependents and enqueue the newly ready. If tasks remain but nothing is ready, there is a cycle.",
    spring:
      "Tasks can fail and must retry with exponential backoff, and a permanently failed task blocks its dependents, surface or skip them, or: add task priorities within the ready set.",
  },
  {
    name: "Thread-safe delayed job queue with cancellation",
    ref: "design a DelayQueue",
    pattern: "Min-heap by ready-time + lock + condition variable",
    prompt:
      "Build a queue where jobs become available only after a delay and can be canceled before they run. Min-heap keyed on executeAt; a mutex plus a condition variable; consumers do a timed wait until the head's delay elapses; producers signal on insert; cancellation marks the job (lazy skip on poll). Handle spurious wakeups and fairness.",
    spring:
      "A worker crashes mid-job, give at-least-once vs at-most-once semantics, or: make cancellation O(log n) with a handle-to-index map and sift-down.",
  },
  {
    name: "Read-write lock manager with priority",
    ref: "design a monitor",
    pattern: "Concurrency primitives + condition variables",
    prompt:
      "Implement a reader-writer lock with a policy that prevents writer starvation. Track activeReaders, writerActive, waitingWriters; readers block while a writer is active or (writer-priority) writers are waiting; writers block while readers remain or a writer is active; signal the right condition on release.",
    spring:
      "Support lock upgrade (read to write) without deadlock, or: make it reentrant per thread.",
  },
  {
    name: "Number of Closed Islands",
    ref: "LeetCode 1254",
    pattern: "Grid flood-fill (DFS/BFS) with border elimination",
    prompt:
      "Count islands of land fully enclosed by water (not touching the grid border). First flood-fill from every border land cell to disqualify edge-touching islands, then DFS-count the remaining connected land components.",
    spring:
      "The grid is streamed row by row and too large for memory (union-find over two rolling rows), or: return the area of the largest closed island.",
  },
  {
    name: "Minimum Window Substring",
    ref: "LeetCode 76",
    pattern: "Sliding window + frequency counts (a Google favorite)",
    prompt:
      "Find the smallest substring of s containing all characters of t with multiplicity. need[] counts for t plus a missing counter; expand right, decrement missing when a needed char is covered; when missing is zero, contract left to shrink the window while recording the best.",
    spring:
      "t has millions of distinct or Unicode chars (hash-map counts, memory), or: return all minimum-length windows, or: stream s so you cannot revisit, bound the buffer.",
  },
];

function Coding() {
  return (
    <>
      <Lede>
        Forty-five minutes in a plain doc with no autocomplete and no AI, one problem, narrated end
        to end. At L6 the base problem should be solved and tested with time to spare, so the
        moved-goalpost follow-up actually lands. The round is won on the mouth as much as the hands:
        a spoken plan beats silent typing every time.
      </Lede>

      <Block eyebrow="the structure" title="Coding self-mock, minute by minute">
        <CodeBlock
          title="text"
          lang="text"
          code={`0-3   min | Frame & clarify: restate in your own words; confirm inputs,
            outputs, constraints, edge cases OUT LOUD; write the I/O
            contract at the top. This is the quotable packet material.
3-8   min | Example + brute force: hand-trace a concrete example; state a
            brute force with its Big-O; NAME the pattern; get buy-in.
8-10  min | Optimal plan: state the optimal approach + target time/space;
            sketch the data structures; sanity-check the idea aloud.
10-30 min | Code: implement cleanly while narrating; helper functions and
            meaningful names; no hand-waving, no pseudo-gaps.
30-37 min | Self-test: dry-run the example AND an edge case (empty / null /
            single / duplicate / overflow); trace state; fix bugs first.
37-42 min | Complexity + follow-up: state final time/space; take the sprung
            follow-up (a relaxed assumption or moved goalpost) and adapt.
42-45 min | Extensions: productionization, testing strategy, alternatives.`}
        />
        <p className="text-ink-dim leading-relaxed text-sm mt-2">
          The clock below groups the same ritual into five phases (Clarify, Approach, Code, Test,
          Follow-ups) so the transitions are automatic. Replay the tape afterward and flag every
          silence over 20 seconds and every step you did in your head but never said aloud.
        </p>
      </Block>

      <Block eyebrow="the rubric" title="Score each dimension 1 to 4">
        <p className="text-ink-dim leading-relaxed text-sm mb-2">
          1 No-Hire, 2 Hire, 3 Strong-Hire, 4 exceptional. The L6 bar is roughly correct plus tested
          plus optimal plus the follow-up handled largely unaided.
        </p>
        <OpTable
          cols={["Dimension", "Weight", "", "What it looks like"]}
          rows={[
            { op: "Communication / think-aloud", avg: "highest", avgTone: "good", why: "Restated the problem, narrated the approach, no long silences. Silent-but-correct still fails the packet, this makes your problem-solving visible." },
            { op: "Problem-solving / GCA", avg: "high", avgTone: "good", why: "Recognized the pattern, reached the optimal approach, adapted to the goalpost-move follow-up rather than freezing." },
            { op: "Coding quality / RRK", avg: "high", avgTone: "good", why: "Compiles-in-head correct, clean structure, good names, modular, no gaps left to hand-wave over." },
            { op: "Testing rigor", avg: "high", avgTone: "good", why: "Self-tested with example plus edge cases and found your own bugs. Untested code is treated as incomplete." },
            { op: "Complexity & trade-offs", avg: "medium", avgTone: "ok", why: "Correct final time/space and can say why this approach over the alternatives." },
            { op: "Altitude / speed", avg: "medium", avgTone: "ok", why: "The L6 signal: finished with room for the follow-up, needed few or no hints, took hints gracefully." },
          ]}
        />
        <Callout kind="trap" title="The self-score cap">
          Any long silence, any untested submission, or needing a hint just to reach the pattern
          caps the round at 2. A capped round gets redone, that is the whole discipline.
        </Callout>
      </Block>

      <Block eyebrow="run it" title="A 45-minute coding clock">
        <Try label="run a 45-min coding mock">
          <MockTimerViz kind="coding" />
        </Try>
      </Block>

      <Block eyebrow="the bank" title="Ready coding prompts, each with a follow-up to spring">
        <p className="text-ink-dim leading-relaxed text-sm mb-3">
          Pick one, start the clock, and do not read past the prompt line. When you finish the base
          problem, spring the follow-up on yourself and adapt live, that is the L6 moment.
        </p>
        <PromptBank items={CODING_PROMPTS} />
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "My coding loop is fixed: two or three minutes to restate, clarify, and write the I/O
          contract; name the pattern and a brute force with its Big-O; state the optimal plan; then
          code while narrating and self-test the example plus an edge case before anyone asks. I aim
          to be done and tested by the thirty-minute mark so the moved-goalpost follow-up has room
          to land, and I take hints gracefully."
        </Callout>
      </Block>
    </>
  );
}

/* ── System-design mock ───────────────────────────────────────── */
const DESIGN_PRODUCT = [
  {
    name: "Real-time collaborative editor with offline (Google Docs)",
    prompt: "Design a real-time collaborative document editor with offline support.",
    approach:
      "Persistent edit channel; concurrency control via Operational Transform (a central server assigns a global order and transforms concurrent ops) OR CRDT (peer-mergeable, better offline, larger metadata), state the trade. Doc as an ordered sequence of char ops with version vectors; op log plus periodic snapshots for recovery; presence and cursors; offline buffers local ops and merges on reconnect.",
    spring:
      "Two users edit offline for an hour then reconnect, converge without losing intent; and scale to 1,000 concurrent editors on one document.",
  },
  {
    name: "Global multi-device chat / messaging platform",
    prompt: "Design a global multi-device chat platform.",
    approach:
      "A gateway holds a persistent connection per device (presence); the message service persists to a per-conversation store partitioned by conversation_id with per-conversation sequence numbers for ordering; fan-out to connected devices; per-device delivery cursor for sync and read receipts; offline delivery via push; dedup via client idempotency keys.",
    spring:
      "Guarantee ordering and zero loss across a user's 5 devices when one is offline for days; and a 100k-member group, fan-out on write vs on read.",
  },
  {
    name: "News feed at billion-user scale",
    prompt: "Design a news feed at billion-user scale.",
    approach:
      "Hybrid fan-out: fan-out-on-write into per-user timeline caches for normal users, fan-out-on-read for celebrities and hot accounts to avoid write storms; posts in a sharded store; a ranking service (recency plus ML score); cursor pagination; a Redis timeline cache.",
    spring:
      "A celebrity with 100M followers posts, avoid a write storm (pull plus merge at read for hot authors); and blend ML ordering while keeping freshness and dedup.",
  },
  {
    name: "Connection-degree system (1st / 2nd / 3rd instantly)",
    prompt: "Show a viewer their 1st, 2nd, and 3rd-degree connection to any profile instantly.",
    approach:
      "Social graph sharded by user; 1st degree is direct adjacency; 2nd and 3rd are a bounded bidirectional BFS (depth at most 3) intersecting the viewer's and target's neighbor sets; precompute and cache each active user's 2nd-degree set (or a Bloom filter of it); trade precompute and storage against read latency.",
    spring:
      "Render in under 100ms on profile-open for 1B users; and reflect newly formed connections in near-real-time.",
  },
  {
    name: "Ride-share dispatch / matching system",
    prompt: "Design a ride-share dispatch and matching system.",
    approach:
      "Drivers publish location every few seconds to a service indexed by geohash or S2 cells; a rider request queries the rider's cell plus neighbors, ranks candidates by ETA and rating, and dispatches with a soft-lock or lease on the chosen driver to prevent double-booking; per-trip state machine; surge computed per cell from supply and demand.",
    spring:
      "Two riders match the same driver at once, no double-dispatch (atomic compare-and-set lease); and a stadium empties, handle the hot cell.",
  },
  {
    name: "URL shortener at global scale",
    prompt: "Design a URL shortener at global scale (the classic warm-up).",
    approach:
      "Key generation via base62 of a distributed counter or Snowflake ID (or hash plus collision check); a KV store short to long, sharded and read-heavy so cache aggressively at the edge and CDN; 301/302 redirect; analytics via an async event pipeline.",
    spring:
      "Custom aliases with collision handling; and 100:1 read:write, 99.99% availability, sub-10ms redirect worldwide.",
  },
];

const DESIGN_INFRA = [
  {
    name: "Distributed cache (Redis Cluster / memcached)",
    prompt: "Design a distributed cache.",
    approach:
      "Partition the keyspace with consistent hashing plus virtual nodes to minimize reshuffle on membership change; per-node eviction (LRU/LFU); primary plus replicas for availability; write policy (write-through vs write-back) and invalidation; client-side routing or a proxy; hot keys via replication or local caching; gossip-based membership plus failure detection.",
    spring:
      "A node dies, minimize the cache-miss storm and rebalancing (consistent hashing plus replica promotion plus request coalescing against a thundering herd); and add read-your-writes for a subset of keys.",
  },
  {
    name: "Distributed rate limiter for a 10M+ rps gateway",
    prompt: "Design a distributed rate limiter for a 10M+ rps API gateway.",
    approach:
      "Choose the algorithm (token bucket for bursts vs sliding-window log or counter for accuracy); enforce at the edge; central atomic counters in Redis (Lua) vs local per-node token buckets reconciled asynchronously, trade accuracy against coordination and latency; per-key buckets (user, API key, IP); return 429 plus Retry-After.",
    spring:
      "Central Redis is a bottleneck and SPOF at 10M rps, remove it (local buckets plus async reconciliation); and enforce one GLOBAL limit across 12 regions under eventual consistency.",
  },
  {
    name: "Globally consistent configuration management",
    prompt: "Design a globally consistent configuration management system (a real Google prompt).",
    approach:
      "A versioned, immutable config store; a strongly-consistent control plane (Raft/Paxos or Spanner-like) for writes; wide read replication plus client caching with watch or subscribe for push; staged rollout (canary percent, per-region) with instant rollback; schema validation plus audit log. Config needs read-your-writes and monotonic reads.",
    spring:
      "Push a change to 1M servers in under a minute without a thundering herd (hierarchical pub/sub fan-out tree plus jittered pull); and stop a bad config from taking down the fleet (health-gated rollout plus auto-rollback).",
  },
  {
    name: "Logs & metrics pipeline (serve within one minute)",
    prompt: "Design a logs and metrics pipeline that processes within a minute and serves downstream.",
    approach:
      "Host agents buffer and ship to a durable ingest log (Kafka/PubSub) partitioned by source; stream processors (Flink/Beam) parse, aggregate, and roll up within the one-minute SLO; metrics to a time-series store with downsampled rollups, logs to columnar storage plus an inverted index; at-least-once with dedup plus backpressure; tiered retention.",
    spring:
      "A 10x log spike, do not drop critical logs or miss the SLO (elastic consumers, level-based sampling, a durable spill buffer); and exactly-once metric counts despite retries.",
  },
  {
    name: "Distributed denylist enforced at the edge",
    prompt: "Design a distributed denylist enforced at the edge.",
    approach:
      "An authoritative versioned store of blocked entities; push a compact representation (Bloom filter plus delta updates) to edge nodes for O(1) local checks with periodic sync; Bloom false positives resolved by an authoritative recheck; a tight propagation SLA for new blocks.",
    spring:
      "A newly blocked entity must be denied everywhere within seconds (delta push via pub/sub plus versioned filters); and billions of entries, keep membership memory-efficient.",
  },
];

function Design() {
  return (
    <>
      <Lede>
        Sixty minutes on a whiteboard or in Excalidraw, recording on. At L6 you must drive the deep
        dives unprompted and think at global or org scale. The single biggest downlevel cause is
        staying at senior boxes-and-arrows altitude and only naming managed services; the fix is to
        explain how each piece works from first principles.
      </Lede>

      <Block eyebrow="the structure" title="System-design self-mock, minute by minute">
        <CodeBlock
          title="text"
          lang="text"
          code={`0-8   min | Requirements: top-3 functional reqs ("users can...") and
            non-functional (QPS, latency SLO, availability, consistency,
            durability). Ask the one linchpin question Google plants;
            ask MORE questions than you think you need. State assumptions.
8-10  min | Core entities + API: name the key data objects; define the
            interface contract (REST/RPC endpoints).
10-25 min | High-level design: components + end-to-end data flow for the
            core flows; get buy-in; reach a WORKING system before you
            optimize (no caches or queues yet).
25-45 min | Deep dives (drive 1-2 yourself): sharding + hot partitions;
            replication + consistency (CAP, read-your-writes); caching +
            invalidation; fault tolerance + recovery; idempotency. Explain
            HOW from first principles; name the alternative you rejected.
45-55 min | Scale, bottlenecks & ops: multi-region, tail latency,
            monitoring/SLOs, rollout/migration, cost, security. Absorb a
            new constraint added mid-flight.
55-60 min | Wrap-up: recap; state the design's weaknesses (never say it
            is perfect); what you would do with more time.`}
        />
      </Block>

      <Block eyebrow="the rubric" title="Score each dimension 1 to 4">
        <p className="text-ink-dim leading-relaxed text-sm mb-2">
          The L6 bar is driving deep dives unprompted, global scale, and quantified trade-offs.
          Senior-only boxes-and-arrows depth downlevels to L5.
        </p>
        <OpTable
          cols={["Dimension", "Weight", "", "What it looks like"]}
          rows={[
            { op: "Requirements & scoping", avg: "high", avgTone: "good", why: "Turned the vague prompt into concrete FR/NFR plus SLOs; asked the linchpin question; estimates that actually drive decisions." },
            { op: "Distributed-systems depth", avg: "highest", avgTone: "good", why: "The L6 differentiator: sharding, hot partitions, CAP, replication, recovery, idempotency, from first principles, not logo-naming." },
            { op: "High-level architecture", avg: "high", avgTone: "good", why: "A coherent end-to-end design meeting the stated scale; clean component boundaries; correct data model and API." },
            { op: "Trade-offs & judgment", avg: "high", avgTone: "good", why: "Names rejected alternatives, defends choices, and knows where the design breaks at scale." },
            { op: "Drive & communication", avg: "medium", avgTone: "ok", why: "Leads the session, structured, adapts to new constraints, and leaves the interviewer room instead of monologuing." },
            { op: "Operational maturity", avg: "medium", avgTone: "ok", why: "Monitoring and SLOs, rollout and migration, failure modes, and cost, the day-2 story." },
          ]}
        />
        <Callout kind="trap" title="The self-score cap">
          If you never left boxes-and-arrows, never quantified a trade-off, or waited to be told
          where to go deep, cap the round at 2 and redo it.
        </Callout>
      </Block>

      <Block eyebrow="run it" title="A 60-minute design clock">
        <Try label="run a 60-min design mock">
          <MockTimerViz kind="design" />
        </Try>
        <p className="text-ink-dim leading-relaxed text-sm">
          Rehearse the full framework and four worked cases in{" "}
          <a href="#/gcp-design" className="font-mono text-xs" style={{ color: ACCENT }}>
            GCP Design
          </a>{" "}
          , then run the clock here against a cold prompt.
        </p>
      </Block>

      <Block eyebrow="the bank · product" title="Product design prompts">
        <PromptBank items={DESIGN_PRODUCT} />
      </Block>

      <Block eyebrow="the bank · infrastructure" title="Infra design prompts">
        <PromptBank items={DESIGN_INFRA} />
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I spend the first eight minutes turning the prompt into FR, NFR, and SLOs and asking the
          one linchpin question, then reach a working end-to-end design before I optimize anything.
          The last thirty-five are mine to drive: one or two deep dives explained from first
          principles, every major choice paired with the alternative I rejected, and I close on
          failure modes, monitoring, and cost. I never say the design is perfect."
        </Callout>
      </Block>
    </>
  );
}

/* ── Behavioral mock ──────────────────────────────────────────── */
const BEHAVIORAL_PROMPTS = [
  {
    name: "\"Tell me about a time you shifted the technical direction of your org, not just your team.\"",
    signal: "Direction-setting + scope (the L6 gate).",
    approach:
      "Pick a story where you identified an unowned org-level problem, built the case with data, aligned multiple teams and leadership, and the org's roadmap or architecture actually changed. Quantify teams affected, systems migrated, latency or cost delta. Avoid any project-scope framing.",
  },
  {
    name: "\"Describe a time you drove alignment on a technical decision when other senior or staff engineers initially disagreed.\"",
    signal: "Influence without authority + direct-and-respectful.",
    approach:
      "Frame the right-vs-right tension, your data-driven case, how you listened and converted skeptics rather than overruling them, the decision, and its durable outcome. Use 'I' for your moves and show you preserved the relationship.",
  },
  {
    name: "\"Tell me about a major technical decision you or your org got wrong, and how you recovered.\"",
    signal: "Ownership + failure/recovery + judgment.",
    approach:
      "Own it plainly (blameless on people, honest on the mistake), state the blast radius, the recovery you led, and the systemic fix so it cannot recur; end with the lesson. No scapegoating.",
  },
  {
    name: "\"Tell me about a high-stakes decision you made with incomplete data or under ambiguity.\"",
    signal: "Navigating ambiguity + calibrated risk.",
    approach:
      "Frame two-way vs one-way door, the data you did gather, the reversible bet you made, how you de-risked it (canary, guardrails, metrics), and the outcome. Show calibrated risk, not recklessness.",
  },
  {
    name: "\"Describe how you convinced leadership to invest in long-term or tech-debt work over near-term features.\"",
    signal: "Long-term impact + influencing up.",
    approach:
      "Quantify the compounding cost of the debt (velocity, incidents, dollars), tie it to business outcomes, propose a staged plan, and show the payoff. Use the Impact = value x lifespan framing.",
  },
  {
    name: "\"Tell me about a time you grew or multiplied other engineers.\"",
    signal: "Multiplier / mentorship (a Staff differentiator).",
    approach:
      "Go beyond 1:1 mentoring: a program, standard, design-review culture, or tool you created that leveled up many engineers; name outcomes (engineers promoted, adoption across teams). Emphasize leverage.",
  },
  {
    name: "\"Tell me about a time you predicted and prevented a problem before it became an emergency.\"",
    signal: "Vision and strategy + operational excellence (live in the future).",
    approach:
      "Show how you read the data and trends, the bottleneck others missed, the pre-emptive re-architecture, and the incident you avoided. Emphasize non-linear impact.",
  },
  {
    name: "\"Tell me about a cross-org project you led end to end, from an ambiguous problem to delivery.\"",
    signal: "Scope + direction + delivery.",
    approach:
      "Describe the ambiguous mandate, how you scoped and sequenced it, coordinated multiple teams, handled a mid-flight setback, and shipped with measured impact. Emphasize leadership across org boundaries.",
  },
];

function Behavioral() {
  return (
    <>
      <Lede>
        Forty-five minutes of Google's Googleyness and Leadership round, audio recording on and a
        written story matrix beside you. Usually three to four questions, and every answer must land
        at org scope. The gate is scope: "shifted the org's technical direction" is in range,
        "shaped my team's roadmap" is below bar and triggers a downlevel.
      </Lede>

      <Block eyebrow="the structure" title="Behavioral self-mock, minute by minute">
        <CodeBlock
          title="text"
          lang="text"
          code={`0-3   min | Warm-up / rapport; the interviewer frames the round.
3-5   min | Self-intro: state your current scope in ORG terms (teams and
            systems you influence) to set altitude from the first minute.
5-40  min | 3-4 questions, ~8-12 min each. Run EXTENDED STAR per answer:
              Situation = strategic / business context        (~20%)
              Task      = the L6 tension: ambiguity, cross-org,
                          right-vs-right                       (~15%)
              Action    = YOUR decisions, how you drove
                          alignment and influence, first-person 'I' (~50%)
              Result    = quantified impact + durability /
                          second-order effects                 (~15%)
            Close each answer with the leverage line
            ('did X once -> 10x org value').
40-45 min | Your questions for the interviewer.`}
        />
        <p className="text-ink-dim leading-relaxed text-sm mt-2">
          Keep 8 to 10 stories in a matrix tagged by signal (direction-setting, influence, ambiguity,
          conflict, failure/recovery, multiplier, delivery-under-pressure, long-term). Record each
          answer, cap it at four to five minutes, play it back, and score it. Rehearse SELECTING the
          right story per prompt, not memorizing one script. The clock runs three story cycles of
          pick, STAR answer, follow-ups.
        </p>
      </Block>

      <Block eyebrow="the rubric" title="Score each dimension 1 to 4">
        <p className="text-ink-dim leading-relaxed text-sm mb-2">
          Scored against Google's leadership and Googleyness signals. The L6 GATE is scope.
        </p>
        <OpTable
          cols={["Dimension", "Weight", "", "What it looks like"]}
          rows={[
            { op: "Scope / altitude (GATE)", avg: "gate", avgTone: "good", why: "Org or multi-team, not project or single-team. 'Shaped my team's roadmap' is below bar and triggers downleveling." },
            { op: "Direction-setting", avg: "high", avgTone: "good", why: "Identified which problems were worth solving; defined the technical strategy or roadmap." },
            { op: "Influence without authority", avg: "high", avgTone: "good", why: "Aligned other teams, PMs, or leadership when they disagreed; data over opinion; converted skeptics rather than overruling them." },
            { op: "Navigating ambiguity", avg: "high", avgTone: "good", why: "Turned vague goals into concrete strategy; acted with incomplete data (two-way-door reasoning), not recklessly." },
            { op: "Multiplier / mentorship", avg: "medium", avgTone: "ok", why: "Grew engineers and raised the bar via a program, standard, or tool, with named outcomes. The Staff leverage signal." },
            { op: "Ownership & result", avg: "medium", avgTone: "ok", why: "Quantified impact, 'I' not 'we', durable and second-order effects; concise and quotable for the packet." },
          ]}
        />
        <Callout kind="trap" title="The self-score cap">
          Any team-scope story, any "we"-heavy answer, or any Result without a number caps the story
          at 2, reselect and run it again.
        </Callout>
      </Block>

      <Block eyebrow="run it" title="A 45-minute behavioral clock">
        <Try label="run a behavioral mock">
          <MockTimerViz kind="behavioral" />
        </Try>
        <p className="text-ink-dim leading-relaxed text-sm">
          Build the story matrix and drill the signals in{" "}
          <a href="#/googleyness" className="font-mono text-xs" style={{ color: ACCENT }}>
            Googleyness
          </a>{" "}
          , then run the clock and grade the tape.
        </p>
      </Block>

      <Block eyebrow="the bank" title="Behavioral prompts, tagged by the signal they probe">
        <p className="text-ink-dim leading-relaxed text-sm mb-3">
          Draw a prompt, start the clock, and practice the hardest part first: selecting the right
          story from your matrix in the three-minute pick phase, then telling it in extended STAR.
        </p>
        <PromptBank items={BEHAVIORAL_PROMPTS} />
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I keep eight to ten org-scope stories in a matrix tagged by signal and rehearse selecting,
          not scripting. Every answer runs extended STAR with the Action at about half and told in
          first person, opens with a one-sentence headline, and closes on a quantified, durable
          result. If a story is team-scope or the result has no number, I do not use it, that is an
          automatic downlevel."
        </Callout>
      </Block>
    </>
  );
}

/* ── Top mistakes & self-correction ───────────────────────────── */
const CODING_MISTAKES = [
  { mistake: "Silent coding. Not narrating is invisible to you but costs the most offers, a silent candidate cannot be calibrated.", fix: "Think aloud every rep. If you go quiet for more than 20 seconds, verbalize the decision you are weighing. On playback, hunt down and eliminate the silent gaps." },
  { mistake: "Jumping to code before confirming the problem and the contract.", fix: "Force a 2-3 minute restate, clarify, and example ritual. Write the I/O contract and edge cases first, that is your quotable packet material." },
  { mistake: "Not testing or self-correcting. Interviewers treat untested code as incomplete.", fix: "Always dry-run the example plus one edge case (empty, null, single, duplicate, overflow) and trace state line by line. Find your own bug before they point at it." },
  { mistake: "Happy-path only, ignoring edge cases.", fix: "Enumerate edge cases aloud during clarification and add input validation. Boundary thinking is the senior signal." },
  { mistake: "Not finishing in time, so the follow-up never lands, and L6 must clear fast.", fix: "Practice under a 30-minute cap so you are done and tested with room for the moved-goalpost follow-up. State complexity crisply and take hints gracefully." },
];

const DESIGN_MISTAKES = [
  { mistake: "Diving in without clarifying requirements, missing the linchpin question.", fix: "Spend 5 to 8 minutes on FR, NFR, scale, and the one critical question. State assumptions and convert the vague prompt into concrete SLOs." },
  { mistake: "Staying at senior boxes-and-arrows altitude and only naming managed services, the number-one L6 downlevel cause.", fix: "Drive one or two deep dives unprompted with first-principles how-it-works: sharding and hot partitions, consistency and CAP, replication, recovery. Rehearse internals, not logos." },
  { mistake: "Premature optimization, over-engineering before a working baseline exists.", fix: "Reach a correct end-to-end design first, then optimize only where the numbers demand it." },
  { mistake: "No trade-off reasoning, no rejected alternatives.", fix: "For every major choice, name the alternative and why you rejected it. Quantify QPS or storage only where it changes the decision." },
  { mistake: "Poor time management, so you never reach depth or operations.", fix: "Time-box: roughly requirements 8, HLD 15, deep dive 20, scale and ops 10, wrap 5. Reserve the last 10 minutes for scale, failure, monitoring, and cost. Never say it is perfect, and checkpoint for buy-in instead of monologuing." },
];

const BEHAVIORAL_MISTAKES = [
  { mistake: "Project-scope stories, the single biggest downleveler: 'my team' instead of 'my org'.", fix: "Audit every story. If it is team-scope, find the org-level version or reframe around your cross-team influence, and tag each story by scope in your matrix." },
  { mistake: "Saying 'we' instead of 'I'.", fix: "Record and count. Rewrite the Action in first person and state your specific decision even inside team stories. If they cannot tell what you did, they cannot score you." },
  { mistake: "No metrics, vague results like 'it went well'.", fix: "Attach a number to every Result: latency, dollars, teams, incidents, promotions. Rehearse the one-line quantified outcome." },
  { mistake: "Rambling, no structure, burying the point.", fix: "Cap answers at 4 to 5 minutes, lead with a one-sentence headline, keep the Action at about half, and time yourself on playback." },
  { mistake: "Generic or hypothetical answers ('I always...') with no real conflict or failure.", fix: "Start every answer with 'There was a specific time when...'. Pre-pick real incidents including a genuine failure, and practice the blameless, data-over-opinion framing." },
];

function Mistakes() {
  return (
    <>
      <Lede>
        Each round fails in its own way, and the failures are predictable enough to drill out. Score
        your recordings against these, and when one shows up, redo the round with the fix in place.
        The pattern is always the same: the mistake is invisible in the moment and obvious on the
        tape.
      </Lede>

      <Block eyebrow="coding round" title="Top 5 coding mistakes, with the self-correction">
        <MistakeList items={CODING_MISTAKES} />
      </Block>

      <Block eyebrow="design round" title="Top 5 system-design mistakes, with the self-correction">
        <MistakeList items={DESIGN_MISTAKES} />
      </Block>

      <Block eyebrow="behavioral round" title="Top 5 behavioral mistakes, with the self-correction">
        <MistakeList items={BEHAVIORAL_MISTAKES} />
      </Block>

      <Block eyebrow="graduate to live reps" title="Where to run real mocks">
        <p className="text-ink-dim leading-relaxed mb-2">
          Self-mocks build the reps and drain the obvious mistakes; live mocks calibrate you against
          a real interviewer and kill the nerves. Once the tape stops flagging the mistakes above,
          book a few of these:
        </p>
        <ul className="text-ink-dim leading-relaxed list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>interviewing.io</strong>: anonymous live mocks with senior FAANG (including current Google) engineers for coding and system design, plus a free AI interviewer for volume. The best single tool for real calibration.</li>
          <li><strong>Pramp (now part of Exponent)</strong>: free peer-to-peer live mocks for coding, system design, and behavioral. Best for high-volume reps and beating nerves before you pay for expert sessions.</li>
          <li><strong>Exponent</strong>: peer and AI mock practice plus structured system-design and behavioral courses and a large question bank, strong for learning the answer structure.</li>
          <li><strong>meetapro and Prepfully</strong>: marketplaces of FAANG or target-company interviewers for paid 1:1 mocks with detailed feedback, best for level-specific calibration on a weak round.</li>
          <li><strong>Peers at Staff+ level</strong>: the highest-fidelity behavioral and design mock, and free. Have them plant red herrings, move the goalposts, and score you against the rubric.</li>
        </ul>
      </Block>
    </>
  );
}

/* ── Rapid fire ───────────────────────────────────────────────── */
const DECK = [
  { q: "The one rule that makes a self-mock actually work.", a: "Start a real clock and talk out loud the whole time, then record it. If you did it silently, the packet cannot quote you: if you did not say it, it did not happen.", tag: "discipline" },
  { q: "Why no IDE autocomplete or AI help on a coding mock?", a: "Google's editor is a plain doc with no syntax help. Practicing with crutches trains a skill you will not have in the room.", tag: "discipline" },
  { q: "What do you do with the recording afterward?", a: "Replay it and flag every silence over 20 seconds and every step you did in your head but never said aloud. Those gaps are where the offer leaks out.", tag: "discipline" },
  { q: "The coding-rubric dimension weighted most heavily.", a: "Communication and think-aloud. Silent-but-correct still fails the packet, because a silent candidate cannot be calibrated.", tag: "coding rubric" },
  { q: "The L6 coding bar in one line.", a: "Correct plus tested plus optimal plus the follow-up handled largely unaided, and finished with time to spare.", tag: "coding rubric" },
  { q: "Why write the I/O contract and edge cases before coding?", a: "It is the quotable packet material and it stops you jumping to code before the problem is confirmed. Boundary thinking is the senior signal.", tag: "coding rubric" },
  { q: "When do you cap a coding round at 2 and redo it?", a: "Any long silence, any untested submission, or needing a hint just to reach the pattern.", tag: "self-score" },
  { q: "The number-one reason L6 design candidates get downleveled.", a: "Staying at senior boxes-and-arrows altitude and only naming managed services instead of explaining how they work from first principles.", tag: "design rubric" },
  { q: "The L6 differentiator on the design rubric.", a: "Distributed-systems depth: sharding and hot partitions, CAP and consistency, replication, fault tolerance, idempotency, driven unprompted and from first principles.", tag: "design rubric" },
  { q: "Before you optimize a design, what must exist?", a: "A working end-to-end design that meets the stated scale. Adding caches and queues before a baseline exists is a top mistake.", tag: "design rubric" },
  { q: "What is the linchpin question in a design round?", a: "The one critical clarifying question Google plants. Ask more questions than you think you need and state your assumptions aloud.", tag: "design rubric" },
  { q: "When do you cap a design round at 2?", a: "If you never left boxes-and-arrows, never quantified a trade-off, or waited to be told where to go deep.", tag: "self-score" },
  { q: "The L6 GATE on the behavioral rubric.", a: "Scope. Org or multi-team, not project or single-team. 'Shaped my team's roadmap' is below bar and triggers a downlevel.", tag: "behavioral rubric" },
  { q: "The extended-STAR weighting for an L6 story.", a: "Situation about 20 percent, Task (the L6 tension) about 15, Action (your decisions, first-person I) about 50, Result (quantified and durable) about 15.", tag: "behavioral rubric" },
  { q: "How do you rehearse behavioral stories?", a: "Keep 8 to 10 stories in a matrix tagged by signal and rehearse SELECTING the right one per prompt, not memorizing one script.", tag: "behavioral rubric" },
  { q: "When do you cap a behavioral story at 2 and reselect?", a: "Any team-scope story, any 'we'-heavy answer, or any Result without a number.", tag: "self-score" },
  { q: "What makes an answer packet-able?", a: "Concise and quotable, so a committee that never met you can argue for you. Lead every answer with a one-sentence headline.", tag: "discipline" },
  { q: "The point of springing a follow-up on yourself.", a: "L6 rounds move the goalpost. The base problem has to be done and tested early so you can adapt to a relaxed assumption or a new constraint.", tag: "discipline" },
];

function RapidFire() {
  return (
    <>
      <Lede>
        Eighteen cards on mock discipline and what each rubric actually rewards. Answer out loud
        first, then reveal and grade yourself. These are the sentences that should be automatic
        before you sit down for the real loop.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  how: <How />,
  coding: <Coding />,
  design: <Design />,
  behavioral: <Behavioral />,
  mistakes: <Mistakes />,
  quickfire: <RapidFire />,
};

export default function MockDrills() {
  const [active, setActive] = useState("how");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Simulate it · UNDER THE CLOCK"
      title="Mock Drills"
      subtitle="Run the loop on yourself: timed coding, design, and behavioral mocks with a phase timer, rubrics, and ready-to-run prompt banks."
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
