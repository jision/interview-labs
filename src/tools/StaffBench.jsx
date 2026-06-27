import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import LruCacheViz from "./staff/LruCacheViz.jsx";
import TokenBucketViz from "./staff/TokenBucketViz.jsx";
import TrieViz from "./staff/TrieViz.jsx";
import RaceConditionViz from "./staff/RaceConditionViz.jsx";
import EstimatorViz from "./staff/EstimatorViz.jsx";
// Expansion modules, each exports a TOPICS array + a CONTENT map.
import { EXTRA_DESIGN_TOPICS, EXTRA_DESIGN_CONTENT } from "./staff/designExtra.jsx";
import { CONCURRENCY_EXTRA_TOPICS, CONCURRENCY_EXTRA_CONTENT } from "./staff/concurrencyExtra.jsx";
import { SYSTEM_TOPICS, SYSTEM_CONTENT } from "./staff/systemDesign.jsx";
import { JUDGMENT_EXTRA_TOPICS, JUDGMENT_EXTRA_CONTENT } from "./staff/judgmentExtra.jsx";

const ACCENT = "#d6a94c";

const TOPICS = [
  { id: "lru", label: "LRU Cache", group: "Design a DS" },
  { id: "rate-limiter", label: "Rate Limiter", group: "Design a DS" },
  { id: "trie", label: "Autocomplete / Trie", group: "Design a DS" },
  ...EXTRA_DESIGN_TOPICS,
  { id: "concurrency", label: "Primitives & Pitfalls", group: "Concurrency" },
  ...CONCURRENCY_EXTRA_TOPICS,
  ...SYSTEM_TOPICS,
  { id: "tradeoffs", label: "Trade-offs", group: "Judgment" },
  { id: "estimation", label: "Back-of-Envelope", group: "Judgment" },
  { id: "communicating", label: "Communicating", group: "Judgment" },
  ...JUDGMENT_EXTRA_TOPICS,
];

const { Block, Try } = withAccent(ACCENT);

/* ── LRU Cache ─────────────────────────────────────────────────── */
function Lru() {
  return (
    <>
      <Lede>
        "Design a cache that holds the N most-recently-used items and evicts the rest." (LeetCode 146) The classic
        answer is a <strong>hash map + doubly linked list</strong>: the map gives O(1) lookup, the
        list maintains recency order, and a node moves to the front on every touch. Get and put are
        both O(1).
      </Lede>

      <Try><LruCacheViz /></Try>

      <Block eyebrow="under the hood" title="Map for lookup, list for order">
        <p className="text-ink-dim leading-relaxed mb-1">
          The single hard requirement is <strong>O(1) get and put</strong>. A hash map alone can find
          a value fast but can't tell you what's least-recently-used. A list alone keeps order but
          searching it is O(n). Combine them: the map stores{" "}
          <code className="font-mono">key → node</code>, and the node lives in a doubly linked list
          ordered most-recent → least-recent. On a hit you unlink the node and splice it to the front,
          O(1) because a doubly linked node knows both neighbors. On overflow you drop the tail, the
          least-recently-used entry.
        </p>
        <Callout kind="trap" title="A get() is a use, refresh recency">
          The most common LRU bug: treating <code className="font-mono">get</code> as read-only. A
          successful read <em>counts as a use</em> and must move the key to most-recent. Otherwise you
          evict items people are actively reading. (And it's LRU, not MRU, you evict the{" "}
          <em>least</em> recently used, the tail.)
        </Callout>
        <CodeBlock
          title="python · the 10-line answer"
          code={`from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.cache = OrderedDict()       # ordered by insertion / use

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)      # a read is a use -> most recent
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)   # evict least-recently-used (head)`}
        />
        <Callout kind="tip" title="Know both versions">
          <code className="font-mono">OrderedDict</code> is the right interview answer in Python, its{" "}
          <code className="font-mono">move_to_end</code> and{" "}
          <code className="font-mono">popitem(last=False)</code> are exactly the LRU primitives. But be
          ready to hand-roll the <strong>dict + doubly linked list</strong> with a dummy head and tail
          when asked "how does that work underneath?" The dummy sentinels remove the head/tail edge
          cases.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "get(key)", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Map lookup + splice node to front." },
            { op: "put(key, val)", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Map write + insert at front (+ maybe drop tail)." },
            { op: "evict LRU", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Unlink the tail node, delete its map entry." },
            { op: "space", avg: "O(capacity)", avgTone: "ok", worst: "O(capacity)", worstTone: "ok", why: "One map entry + one list node per cached key." },
          ]}
        />
      </Block>

      <Block eyebrow="judgment" title="When LRU is the wrong policy">
        <Callout kind="note" title="Eviction policy is a real choice">
          LRU assumes the recent past predicts the near future, great for general workloads. But{" "}
          <strong>LFU</strong> (least-frequently-used; LeetCode 460) beats it when a few keys are hot forever, and a
          one-off scan of cold data will flush an LRU cache (cache pollution). Production caches like
          Redis offer LRU, LFU, and TTL. Naming the alternative, "I'd start with LRU, switch to LFU if
          the access pattern is skewed", is the staff-level signal.
        </Callout>
      </Block>
    </>
  );
}

/* ── Rate Limiter ──────────────────────────────────────────────── */
function RateLimiter() {
  return (
    <>
      <Lede>
        "Allow at most R requests per second per user." The default answer is a{" "}
        <strong>token bucket</strong>: a bucket holds up to C tokens, refills at r tokens/second, and
        each request spends one token, or is denied if the bucket is empty. It allows short bursts (up
        to C) while bounding the long-run rate to r.
      </Lede>

      <Try><TokenBucketViz /></Try>

      <Block eyebrow="under the hood" title="Spend a token, refill on a clock">
        <p className="text-ink-dim leading-relaxed mb-1">
          The whole algorithm is two numbers and a timestamp: current{" "}
          <code className="font-mono">tokens</code> and the{" "}
          <code className="font-mono">last_refill</code> time. On each request you lazily add{" "}
          <code className="font-mono">elapsed × r</code> tokens (capped at C), then{" "}
          <strong>allow iff tokens ≥ 1</strong> and decrement. No background thread needed, you refill
          on read. Capacity C is your burst allowance; rate r is your steady-state limit.
        </p>
        <CodeBlock
          title="python · token bucket"
          code={`import time

class TokenBucket:
    def __init__(self, capacity, refill_per_sec):
        self.cap = capacity
        self.rate = refill_per_sec
        self.tokens = capacity
        self.ts = time.monotonic()

    def allow(self):
        now = time.monotonic()
        # lazily refill based on elapsed time, capped at capacity
        self.tokens = min(self.cap, self.tokens + (now - self.ts) * self.rate)
        self.ts = now
        if self.tokens >= 1:
            self.tokens -= 1     # spend one token
            return True
        return False             # rate limited`}
        />
        <Callout kind="tip" title="Interview line">
          "Token bucket: refill r tokens/sec up to a cap of C, allow a request iff a token is available
          then decrement. C controls burst size, r controls sustained rate, and I refill lazily on each
          call so there's no timer to manage."
        </Callout>
      </Block>

      <Block eyebrow="the menu" title="Four limiters, four trade-offs">
        <OpTable
          cols={["Algorithm", "Shape", "", "Behaviour"]}
          rows={[
            { op: "Token bucket", avg: "bursty", avgTone: "good", why: "Smooth long-run rate, lets bursts through up to C. The usual default." },
            { op: "Leaky bucket", avg: "smoothed", avgTone: "ok", why: "Requests drain at a fixed rate (a FIFO queue), output is perfectly even, but adds latency and can drop on overflow." },
            { op: "Fixed window", avg: "spiky", avgTone: "bad", why: "Count per clock-aligned window. Simple, but allows ~2× the limit at a window boundary." },
            { op: "Sliding window", avg: "accurate", avgTone: "good", why: "Sliding-log or weighted-window fixes the boundary spike, at higher memory / compute cost." },
          ]}
        />
        <Callout kind="trap" title="The fixed-window boundary bug">
          Fixed window counts requests in clock-aligned buckets (e.g. per minute). A client can fire R
          requests at 0:59 and another R at 1:00, <strong>2R requests in one second</strong>, straddling
          the boundary. Sliding-window log or a weighted sliding window closes this gap; that's the
          follow-up interviewers fish for.
        </Callout>
        <Callout kind="note" title="Token bucket vs leaky bucket">
          They look similar but differ in shape: <strong>token bucket allows bursts</strong> (tokens
          accumulate while idle), while <strong>leaky bucket enforces a steady output</strong> (a queue
          draining at fixed rate) and will buffer or drop spikes. Pick token bucket when bursts are
          fine; leaky bucket when downstream needs a smooth, even stream.
        </Callout>
      </Block>

      <Block eyebrow="judgment" title="Distributed gotchas">
        <Callout kind="warn" title="Per-node limiters don't compose">
          A token bucket in memory limits one process. Behind a load balancer with 10 nodes, each
          allowing R means the user gets up to 10R. Real systems centralize the counter (Redis with an
          atomic <code className="font-mono">INCR</code> / Lua script) or accept approximate limiting
          per node. Mention this, it's the difference between a toy and a system.
        </Callout>
      </Block>
    </>
  );
}

/* ── Trie / Autocomplete ───────────────────────────────────────── */
function TrieTopic() {
  return (
    <>
      <Lede>
        "Build autocomplete for a search box." (LeetCode 208; 211 for wildcard search) A <strong>trie</strong> (prefix tree) stores words by
        shared prefixes: each edge is a character, each path from the root spells a prefix. Finding all
        completions of a prefix is <strong>O(L)</strong> to walk the prefix plus the cost of listing the
        matches, independent of how many words you've stored.
      </Lede>

      <Try><TrieViz /></Try>

      <Block eyebrow="under the hood" title="One node per prefix, not per word">
        <p className="text-ink-dim leading-relaxed mb-1">
          "car", "card", and "care" share the path <code className="font-mono">c → a → r</code>; the
          trie stores that path once. To check a prefix you walk one edge per character, O(L), where L
          is the prefix length, with <em>no dependence on the dictionary size</em>. An{" "}
          <code className="font-mono">is_end</code> flag marks where a complete word ends, so "do" and
          "dot" can both live on the same branch. To autocomplete, walk to the prefix node, then DFS
          everything beneath it.
        </p>
        <CodeBlock
          title="python · trie with prefix search"
          code={`class TrieNode:
    def __init__(self):
        self.children = {}      # char -> TrieNode
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):                 # O(len(word))
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_end = True

    def _walk(self, prefix):                # node for a prefix, or None
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node

    def starts_with(self, prefix):          # O(L)
        return self._walk(prefix) is not None

    def autocomplete(self, prefix):         # O(L + size of subtree)
        node = self._walk(prefix)
        out = []
        def dfs(n, path):
            if n.is_end:
                out.append(prefix + path)
            for ch, child in n.children.items():
                dfs(child, path + ch)
        if node:
            dfs(node, "")
        return out`}
        />
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "insert(word)", avg: "O(L)", avgTone: "good", worst: "O(L)", worstTone: "good", why: "One node per character; L = word length." },
            { op: "search(word)", avg: "O(L)", avgTone: "good", worst: "O(L)", worstTone: "good", why: "Walk the path; no scan of other words." },
            { op: "starts_with(prefix)", avg: "O(L)", avgTone: "good", worst: "O(L)", worstTone: "good", why: "The trie's whole reason to exist." },
            { op: "autocomplete(prefix)", avg: "O(L + total length of all completions)", avgTone: "ok", worst: "O(L + total length of all completions)", worstTone: "ok", why: "Walk the prefix (O(L)), then DFS emits every character of every completion, O(total length of all matches), not the match count." },
          ]}
        />
      </Block>

      <Block eyebrow="judgment" title="Trie vs hash set, and when not to bother">
        <Callout kind="tip" title="Reach for a trie when prefixes matter">
          A hash set gives O(1) <em>exact</em> membership but knows nothing about prefixes, "all words
          starting with 'ca'" would be a full scan. Use a trie for prefix search, autocomplete, longest
          common prefix, and word-break style problems.
        </Callout>
        <Callout kind="warn" title="Memory is the catch">
          A trie can use a lot of pointers, one node per character of unshared prefix. At scale,
          production systems compress it (a radix / Patricia trie merges single-child chains) or rank
          completions by popularity. For ranked autocomplete you'd store the top-k under each node, not
          a raw DFS.
        </Callout>
      </Block>
    </>
  );
}

/* ── Concurrency ───────────────────────────────────────────────── */
function Concurrency() {
  return (
    <>
      <Lede>
        Concurrency rounds test whether you can reason about <em>shared mutable state</em>. The core
        problem: when two threads touch the same data without coordination, operations interleave and
        results become non-deterministic, a <strong>race condition</strong>. Below, watch two threads
        each do <code className="text-ink font-mono">count += 1</code> three times.
      </Lede>

      <Try><RaceConditionViz /></Try>

      <Block eyebrow="why it breaks" title="count += 1 is not atomic">
        <p className="text-ink-dim leading-relaxed mb-1">
          That innocent line is three operations: <strong>read</strong> count into a register,{" "}
          <strong>add</strong> one, <strong>write</strong> it back. If thread A reads 0, thread B reads
          0, both add one, both write 1, two increments produced a single +1. That's a{" "}
          <strong>lost update</strong>. A <strong>mutex</strong> (lock) makes the read-add-write a single
          atomic critical section, so the final value is always correct. Toggle the lock in the demo and
          run it.
        </p>
        <CodeBlock
          title="python · the fix is a lock"
          code={`import threading

count = 0
lock = threading.Lock()

def worker():
    global count
    for _ in range(100_000):
        with lock:          # critical section, only one thread inside
            count += 1      # now atomic: read-add-write can't interleave
# without the lock, the final count is < 200_000 (lost updates)`}
        />
      </Block>

      <Block eyebrow="the toolbox" title="Synchronization primitives">
        <OpTable
          cols={["Primitive", "Guarantees", "", "Use it for"]}
          rows={[
            { op: "Mutex / Lock", avg: "exclusive", avgTone: "good", why: "One thread in the critical section at a time. The default for protecting shared state." },
            { op: "Semaphore(k)", avg: "≤ k holders", avgTone: "good", why: "A counter allowing up to k concurrent holders, e.g. a pool of k DB connections." },
            { op: "RW lock", avg: "many R / one W", avgTone: "ok", why: "Multiple readers OR one writer. Wins on read-heavy data; risks writer starvation." },
            { op: "Condition var", avg: "wait / notify", avgTone: "ok", why: "Sleep until a predicate holds (queue non-empty). Backs producer–consumer." },
          ]}
        />
        <Callout kind="note" title="Producer–consumer">
          The canonical pattern: producers put items on a bounded queue, consumers take them off, a
          condition variable (or a blocking <code className="font-mono">queue.Queue</code>) parks
          threads when the queue is empty or full. Decouples fast producers from slow consumers without
          busy-waiting.
        </Callout>
      </Block>

      <Block eyebrow="the classic failure" title="Deadlock & the 4 Coffman conditions">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>deadlock</strong> is two-or-more threads each waiting on a lock the other holds,
          forever. It needs <em>all four</em> Coffman conditions at once; break any one and deadlock is
          impossible:
        </p>
        <div className="grid sm:grid-cols-2 gap-2.5 mb-2">
          {[
            ["1. Mutual exclusion", "a resource is held exclusively, only one thread at a time."],
            ["2. Hold and wait", "a thread holds one resource while waiting for another."],
            ["3. No preemption", "a resource can't be forcibly taken; only the holder releases it."],
            ["4. Circular wait", "a cycle of threads, each waiting on the next's resource."],
          ].map(([t, d]) => (
            <div
              key={t}
              className="rounded-lg p-3 border border-line"
              style={{ background: "color-mix(in srgb,#d6a94c 6%,transparent)" }}
            >
              <div className="font-mono text-xs font-semibold text-ink mb-1">{t}</div>
              <div className="text-sm text-ink-dim leading-snug">{d}</div>
            </div>
          ))}
        </div>
        <Callout kind="tip" title="The standard fix: kill circular wait">
          Impose a <strong>global lock ordering</strong>, every thread acquires locks in the same total
          order (e.g. always lock the lower-id account first). No cycle can form, so no deadlock. This is
          the answer to <strong>dining philosophers</strong>: make one philosopher pick up forks in the
          opposite order (or use a waiter / semaphore that admits at most N−1 diners).
        </Callout>
      </Block>

      <Block eyebrow="python specifics" title="The GIL, what it does and does NOT protect">
        <p className="text-ink-dim leading-relaxed mb-1">
          CPython's <strong>Global Interpreter Lock</strong> ensures only one thread executes Python
          bytecode at a time. People wrongly conclude "so Python threads are safe." They aren't.
        </p>
        <Callout kind="trap" title="The GIL does NOT make += 1 atomic">
          The GIL can be released at bytecode boundaries, since CPython 3.2 the interpreter switches
          threads on a time interval (<code className="font-mono">sys.setswitchinterval</code>, ~5 ms by
          default), not after every bytecode. Because{" "}
          <code className="font-mono">count += 1</code> compiles to several bytecodes (LOAD, ADD, STORE),
          a thread switch can land mid-update and lose a write. You still need a lock for
          read-modify-write on shared state.
        </Callout>
        <Callout kind="note" title="What the GIL actually means">
          It prevents true parallelism for CPU-bound Python code (threads time-slice one core), so for
          CPU work use <code className="font-mono">multiprocessing</code>. Threads still help with{" "}
          <strong>I/O-bound</strong> work, since the GIL is released during blocking I/O. (A single
          bytecode is atomic, so an isolated <code className="font-mono">list.append</code> is safe, but
          compound operations are not. Python 3.13+ ships an experimental no-GIL build.)
        </Callout>
      </Block>
    </>
  );
}

/* ── Trade-offs ────────────────────────────────────────────────── */
function Tradeoffs() {
  return (
    <>
      <Lede>
        Staff interviews aren't graded on the answer, they're graded on whether you can <em>see the
        axis you're trading on</em> and defend your pick. Almost every system decision is a tension
        between two goods. Name the tension, state the binding constraint, choose, and say what you gave
        up.
      </Lede>

      <Block eyebrow="the framework" title="A reusable way to articulate any trade-off">
        <div className="grid sm:grid-cols-2 gap-2.5 mb-3">
          {[
            ["1 · Name the axis", "“This is a latency-vs-throughput call.” Make the tension explicit."],
            ["2 · State the binding constraint", "What actually matters here? “The SLA is p99 < 100 ms,” or “we're memory-bound on this box.”"],
            ["3 · Pick a side", "Choose, grounded in that constraint, not by reflex."],
            ["4 · Name what you gave up", "“…at the cost of throughput, which is fine because we're far from saturating the box.”"],
          ].map(([t, d]) => (
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
        <Callout kind="tip" title="The tell">
          Junior answers pick a side. Senior answers name the axis and the constraint <em>before</em>{" "}
          picking. "It depends" is a weak answer alone, "it depends{" "}
          <strong>on X, and here X is Y, so I'd choose Z</strong>" is the staff-level version.
        </Callout>
      </Block>

      <Block eyebrow="the big six" title="The trade-off axes you'll actually argue">
        <OpTable
          cols={["Axis", "One side", "Other side", "How to choose"]}
          rows={[
            { op: "Latency vs throughput", avg: "fast per-request", avgTone: "good", worst: "high total volume", worstTone: "ok", why: "Batching / queuing raises throughput but adds latency. Pick by the SLA: interactive → latency; bulk pipeline → throughput." },
            { op: "Memory vs speed", avg: "less memory", avgTone: "ok", worst: "more speed", worstTone: "good", why: "Caching, precompute, indexes, memoization trade RAM for time. Choose by which resource is scarce." },
            { op: "Read vs write optimized", avg: "fast reads", avgTone: "good", worst: "fast writes", worstTone: "ok", why: "B-trees & indexes favor reads; LSM-trees favor writes. Profile the read:write ratio first." },
            { op: "Consistency vs availability", avg: "always correct", avgTone: "good", worst: "always answers", worstTone: "ok", why: "CAP: under a partition you pick one. Bank balance → C; shopping cart → A." },
            { op: "Normalize vs denormalize", avg: "no duplication", avgTone: "good", worst: "fewer joins", worstTone: "ok", why: "Normalized = clean writes; denormalized = fast reads, duplicated data to keep in sync." },
            { op: "Sync vs async", avg: "simple, immediate", avgTone: "good", worst: "decoupled, scalable", worstTone: "ok", why: "Async (queues, events) absorbs spikes and decouples services, at the cost of complexity and eventual consistency." },
          ]}
        />
      </Block>

      <Block eyebrow="the one they push on" title="CAP, state it correctly">
        <p className="text-ink-dim leading-relaxed mb-1">
          CAP is constantly misquoted as "pick 2 of 3." The precise statement:{" "}
          <strong>when a network partition happens, you must choose between consistency and
          availability</strong>, you cannot have both. With no partition you can have both C and A; the
          trade-off only bites <em>during</em> a partition.
        </p>
        <Callout kind="trap" title="Don't say 'pick 2 of 3'">
          Partition tolerance isn't optional in a distributed system, networks <em>will</em> partition.
          So the real choice is <strong>CP</strong> (refuse to answer rather than serve stale data,
          e.g. a leader-based store, ZooKeeper) vs <strong>AP</strong> (stay up and reconcile later,
          e.g. Dynamo / Cassandra). The right framing: "P is given, so I'm choosing C or A under a
          partition, based on whether stale reads are tolerable."
        </Callout>
      </Block>
    </>
  );
}

/* ── Back-of-Envelope ──────────────────────────────────────────── */
function Estimation() {
  return (
    <>
      <Lede>
        "How much storage? How many servers?" Back-of-envelope math gets you to the right order of
        magnitude in 60 seconds. The trick is a handful of memorized numbers and aggressive rounding,
        precision is not the point; <em>the right power of ten is</em>.
      </Lede>

      <Block eyebrow="the cheat sheet" title="Latency numbers every programmer should know">
        <OpTable
          cols={["Operation", "Latency", "", "Mental model"]}
          rows={[
            { op: "L1 cache reference", avg: "~1 ns", avgTone: "good", why: "The baseline. Everything else is a multiple of this." },
            { op: "Branch mispredict", avg: "~3 ns", avgTone: "good", why: "A wrong guess by the CPU's predictor." },
            { op: "L2 cache reference", avg: "~4 ns", avgTone: "good", why: "Roughly 4× L1." },
            { op: "Mutex lock / unlock", avg: "~17 ns", avgTone: "good", why: "An uncontended lock is cheap." },
            { op: "Main memory (RAM)", avg: "~100 ns", avgTone: "ok", why: "~100× L1, a cache miss is expensive." },
            { op: "SSD random read", avg: "~16 µs", avgTone: "ok", why: "~160× RAM. Flash is fast but not RAM-fast." },
            { op: "Network RT in datacenter", avg: "~0.5 ms", avgTone: "ok", why: "~500 µs. Same building, different machine." },
            { op: "Disk (HDD) seek", avg: "~10 ms", avgTone: "bad", why: "Spinning rust. ~100,000× RAM, avoid random disk I/O." },
            { op: "Network RT CA↔Netherlands", avg: "~150 ms", avgTone: "bad", why: "Speed of light is real. Cross-continent dominates everything." },
          ]}
        />
        <Callout kind="tip" title="The one ratio to internalize">
          Memory ~100 ns, SSD ~16 µs (~160×), disk seek ~10 ms (~100,000×), cross-continent ~150 ms.
          Each tier is roughly 100–1000× slower than the one above. "Is this in RAM, on SSD, on disk, or
          over the network?" answers most performance questions.
        </Callout>
      </Block>

      <Block eyebrow="powers of two" title="Sizes & the 2^10 ≈ 10^3 trick">
        <OpTable
          cols={["Power", "Approx", "", "Name / use"]}
          rows={[
            { op: "2^10", avg: "~1 thousand", avgTone: "good", why: "1 KB. 2^10 = 1024 ≈ 10^3, the conversion that powers all of this." },
            { op: "2^20", avg: "~1 million", avgTone: "good", why: "1 MB. ≈ 10^6." },
            { op: "2^30", avg: "~1 billion", avgTone: "ok", why: "1 GB. ≈ 10^9. Also: a signed 32-bit int maxes near 2^31 ≈ 2.1 B." },
            { op: "2^32", avg: "~4 billion", avgTone: "ok", why: "4 GB address space; the full IPv4 space." },
            { op: "2^40", avg: "~1 trillion", avgTone: "bad", why: "1 TB. ≈ 10^12." },
          ]}
        />
        <Callout kind="note" title="Time anchors too">
          There are ~86,400 s/day ≈ <strong>10^5 s/day</strong>, and ~2.6M s/month. Memorize the day
          figure: QPS = (events per day) ÷ 10^5. One million events/day ≈ 10 QPS. That single division
          handles most capacity questions.
        </Callout>
      </Block>

      <Block eyebrow="try it" title="A QPS / storage estimator">
        <Try label="estimate"><EstimatorViz /></Try>
      </Block>

      <Block eyebrow="the method" title="How to drive an estimate">
        <Callout kind="tip" title="The worked recipe">
          <span className="block mb-1">1. <strong>Users → events/day.</strong> DAU × actions per user.</span>
          <span className="block mb-1">2. <strong>Events/day → QPS.</strong> Divide by 10^5. Then ×2–3 for peak.</span>
          <span className="block mb-1">3. <strong>Reads vs writes.</strong> Most systems are read-heavy, assume ~100:1 unless told otherwise.</span>
          <span className="block mb-1">4. <strong>Storage.</strong> writes/day × bytes/write × retention (days). Multiply out to GB / TB.</span>
          <span className="block">5. <strong>Sanity-check.</strong> Does it fit in RAM? One machine, or a fleet? State the implication.</span>
        </Callout>
        <Callout kind="warn" title="Round early, round often">
          Carrying 3 significant figures through mental math is how you make arithmetic errors on a
          whiteboard. Round to one significant figure at every step. The interviewer wants to see the
          method and the order of magnitude, not a calculator.
        </Callout>
      </Block>
    </>
  );
}

/* ── Communicating ─────────────────────────────────────────────── */
function Communicating() {
  return (
    <>
      <Lede>
        Half of a senior interview is graded on how you <em>talk</em>, not what you type. The
        interviewer is simulating a teammate: can you make your thinking legible, surface assumptions,
        and drive toward a decision out loud? Silence and a perfect final answer scores worse than a
        narrated, slightly-rough one.
      </Lede>

      <Block eyebrow="the loop" title="Propose → critique → refine, out loud">
        <p className="text-ink-dim leading-relaxed mb-2">
          Don't reach for the optimal solution in silence. Externalize a simple one, name its flaw
          yourself, then improve it. This shows judgment in motion and lets the interviewer steer.
        </p>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {[
            ["State assumptions first", "“I'll assume ~10M DAU, reads dominate writes, and we can tolerate eventual consistency. Stop me if any of those are wrong.” This invites correction before you've built on sand."],
            ["Think aloud", "Narrate the search, not just the result: “A hash map gives O(1) lookup but loses order; I need order for eviction, so I'll add a linked list.” The reasoning is the signal."],
            ["Name the trade-off", "“This is faster but uses more memory, given we're latency-bound, I'll take it.” Show you see the cost, not just the win."],
            ["Propose, then refine", "“Brute force is O(n²); let me get it working, then optimize.” A correct-then-faster path beats a stuck search for the perfect answer."],
          ].map(([t, d]) => (
            <div
              key={t}
              className="rounded-lg p-3.5 border border-line"
              style={{ background: "color-mix(in srgb,#d6a94c 6%,transparent)" }}
            >
              <div className="font-mono text-xs font-semibold mb-1.5" style={{ color: ACCENT }}>
                {t}
              </div>
              <div className="text-sm text-ink-dim leading-snug">{d}</div>
            </div>
          ))}
        </div>
      </Block>

      <Block eyebrow="explaining complexity" title="Talk about Big-O like a teammate">
        <p className="text-ink-dim leading-relaxed mb-1">
          When you state a complexity, anchor it to <em>why</em>, in one breath: name the bound, name
          the cause, name the cost you accept. "It's O(n log n), the sort dominates; the linear scan
          after is free by comparison." That sentence tells the interviewer you understand the bound, not
          that you memorized it.
        </p>
        <Callout kind="tip" title="A clean complexity sentence">
          "This is <strong>O(n)</strong> time and <strong>O(n)</strong> space, I'm trading memory for a
          single pass, using a hash map to drop the nested loop. If memory were the constraint, I'd sort
          first and go O(n log n) time, O(1) extra space instead." One sentence, both options, the
          deciding constraint named.
        </Callout>
      </Block>

      <Block eyebrow="tips & traps" title="What separates a hire from a no-hire">
        <Callout kind="trap" title="The silent-genius failure">
          Going quiet for five minutes and producing perfect code reads as "can't collaborate." The
          interviewer can't tell whether you reasoned or guessed. Narrate continuously, even when stuck:
          "I'm trying X… that doesn't handle the empty case… let me reconsider."
        </Callout>
        <Callout kind="tip" title="Drive, don't wait">
          Senior signal is owning the conversation: lay out the plan, ask clarifying questions, propose
          the next step ("shall I code the happy path first?"). You're auditioning as a peer, so behave
          like one, lead the discussion rather than waiting to be quizzed.
        </Callout>
        <Callout kind="note" title="Handle hints gracefully">
          A nudge isn't a failure, it's data. "Good point, that breaks on duplicates, let me guard
          that" shows you integrate feedback, which is exactly the day-job skill being tested.
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  lru: <Lru />,
  "rate-limiter": <RateLimiter />,
  trie: <TrieTopic />,
  ...EXTRA_DESIGN_CONTENT,
  concurrency: <Concurrency />,
  ...CONCURRENCY_EXTRA_CONTENT,
  ...SYSTEM_CONTENT,
  tradeoffs: <Tradeoffs />,
  estimation: <Estimation />,
  communicating: <Communicating />,
  ...JUDGMENT_EXTRA_CONTENT,
};

export default function StaffBench() {
  const [active, setActive] = useState("lru");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Judgment · SHOULD WE"
      title="The Staff Bench"
      subtitle="Senior rounds test judgment, not one more algorithm, designing a structure for a use case, reasoning about concurrency, and articulating trade-offs out loud."
      topics={TOPICS}
      activeId={active}
      onSelect={setActive}
    >
      <div className="flex items-center gap-2 mb-5">
        <Tag color={ACCENT}>{TOPICS.find((t) => t.id === active)?.group}</Tag>
        <Tag>Python 3</Tag>
      </div>
      {CONTENT[active]}
    </ToolShell>
  );
}
