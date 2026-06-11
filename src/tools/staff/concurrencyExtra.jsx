import React from "react";
import { Callout, CodeBlock } from "../../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../../components/layout.jsx";
import ProducerConsumerViz from "./ProducerConsumerViz.jsx";

const ACCENT = "#d6a94c";
const { Block, Try } = withAccent(ACCENT);

/* ── Classic Threading Problems ────────────────────────────────── */
function ClassicProblems() {
  return (
    <>
      <Lede>
        A handful of threading puzzles show up again and again: <strong>print-in-order</strong>,{" "}
        <strong>multithreaded FizzBuzz</strong>, and a <strong>bounded blocking queue</strong>. They're
        not really about the puzzle — they test whether you reach for the <em>right primitive</em> and
        can say why. The tell at staff level is naming the invariant each primitive enforces, not just
        getting the output to come out ordered.
      </Lede>

      <Block eyebrow="problem 1" title="Print in order — gate threads with Events">
        <p className="text-ink-dim leading-relaxed mb-1">
          Three threads call <code className="font-mono">first()</code>,{" "}
          <code className="font-mono">second()</code>, <code className="font-mono">third()</code> in
          arbitrary order; the output must always be <code className="font-mono">"firstsecondthird"</code>.
          The clean tool is a <strong>one-shot gate</strong>:{" "}
          <code className="font-mono">threading.Event</code>. <code className="font-mono">first</code>{" "}
          runs freely then <em>sets</em> a gate; <code className="font-mono">second</code>{" "}
          <em>waits</em> on that gate before running and sets the next; and so on. An Event is the right
          primitive because the requirement is "block until a thing has happened once" — exactly what{" "}
          <code className="font-mono">set()</code>/<code className="font-mono">wait()</code> model.
        </p>
        <CodeBlock
          title="python · print in order with Events"
          code={`import threading

class Foo:
    def __init__(self):
        self.done_first = threading.Event()   # one-shot gates
        self.done_second = threading.Event()

    def first(self, printFirst):
        printFirst()                # "first"
        self.done_first.set()       # open gate for second()

    def second(self, printSecond):
        self.done_first.wait()      # block until first() finished
        printSecond()               # "second"
        self.done_second.set()      # open gate for third()

    def third(self, printThird):
        self.done_second.wait()     # block until second() finished
        printThird()                # "third"`}
        />
        <Callout kind="tip" title="Why Event and not Lock here">
          A <code className="font-mono">Lock</code> models <em>mutual exclusion</em> ("one at a time"),
          but here we want <em>signalling</em> ("wait until X happened"). An{" "}
          <code className="font-mono">Event</code> is a latch: once <code className="font-mono">set()</code>{" "}
          it stays set, so a late <code className="font-mono">wait()</code> returns immediately — no risk
          of missing the signal. That edge — set before the waiter even arrives — is exactly where naive
          lock/condition solutions deadlock.
        </Callout>
      </Block>

      <Block eyebrow="problem 2" title="Multithreaded FizzBuzz — Condition variables">
        <p className="text-ink-dim leading-relaxed mb-1">
          Four threads share a counter 1…n: one prints "fizz" (÷3), one "buzz" (÷5), one "fizzbuzz"
          (÷15), one prints the number otherwise. Only the thread whose turn it is may print. This is a{" "}
          <strong>turn-taking</strong> problem, so reach for a{" "}
          <code className="font-mono">threading.Condition</code>: each thread loops, and inside the lock{" "}
          <code className="font-mono">wait_for</code>s its predicate, prints, advances the counter, and{" "}
          <code className="font-mono">notify_all</code>s the others to re-check.
        </p>
        <CodeBlock
          title="python · multithreaded FizzBuzz with a Condition"
          code={`import threading

class FizzBuzz:
    def __init__(self, n):
        self.n = n
        self.i = 1
        self.cv = threading.Condition()

    def _run(self, divisible, label_fn):
        while True:
            with self.cv:
                # wait until it's our turn (or we're past the end)
                self.cv.wait_for(lambda: self.i > self.n or divisible(self.i))
                if self.i > self.n:
                    self.cv.notify_all()   # let other threads exit too
                    return
                label_fn(self.i)           # print our token
                self.i += 1
                self.cv.notify_all()       # wake everyone to re-check

    def fizz(self, printFizz):
        self._run(lambda x: x % 3 == 0 and x % 5 != 0, lambda i: printFizz())

    def buzz(self, printBuzz):
        self._run(lambda x: x % 5 == 0 and x % 3 != 0, lambda i: printBuzz())

    def fizzbuzz(self, printFizzBuzz):
        self._run(lambda x: x % 15 == 0, lambda i: printFizzBuzz())

    def number(self, printNumber):
        self._run(lambda x: x % 3 != 0 and x % 5 != 0, lambda i: printNumber(i))`}
        />
        <Callout kind="trap" title="Always wait in a while/wait_for loop, never a bare if">
          A Condition can suffer <strong>spurious wakeups</strong>, and{" "}
          <code className="font-mono">notify_all</code> wakes <em>every</em> waiter — but only one
          predicate is true. Each thread must <em>re-check</em> its condition after waking, which is what{" "}
          <code className="font-mono">wait_for(pred)</code> does (it loops on{" "}
          <code className="font-mono">while not pred(): wait()</code> for you). Replacing it with a single{" "}
          <code className="font-mono">if</code> + <code className="font-mono">wait()</code> is the bug
          interviewers hunt for. Use <code className="font-mono">notify_all</code>, not{" "}
          <code className="font-mono">notify</code>, since you don't know which one waiter is the right
          next printer.
        </Callout>
      </Block>

      <Block eyebrow="problem 3" title="Bounded blocking queue — the building block">
        <p className="text-ink-dim leading-relaxed mb-1">
          Implement a thread-safe queue with a fixed capacity:{" "}
          <code className="font-mono">enqueue</code> blocks when full,{" "}
          <code className="font-mono">dequeue</code> blocks when empty. One{" "}
          <code className="font-mono">Condition</code> over a single lock, with two predicates, is the
          textbook answer. This is the backbone of producer/consumer and thread pools.
        </p>
        <CodeBlock
          title="python · bounded blocking queue"
          code={`import threading
from collections import deque

class BoundedBlockingQueue:
    def __init__(self, capacity):
        self.cap = capacity
        self.q = deque()
        self.cv = threading.Condition()

    def enqueue(self, element):
        with self.cv:
            self.cv.wait_for(lambda: len(self.q) < self.cap)  # block while full
            self.q.append(element)
            self.cv.notify_all()        # a waiting dequeue can now proceed

    def dequeue(self):
        with self.cv:
            self.cv.wait_for(lambda: len(self.q) > 0)         # block while empty
            element = self.q.popleft()
            self.cv.notify_all()        # a waiting enqueue can now proceed
            return element

    def size(self):
        with self.cv:
            return len(self.q)`}
        />
        <Callout kind="note" title="In real Python, you'd just use queue.Queue">
          The standard library's <code className="font-mono">queue.Queue(maxsize=cap)</code> already is a
          bounded blocking queue — <code className="font-mono">put()</code> blocks when full,{" "}
          <code className="font-mono">get()</code> blocks when empty, all locking handled. Hand-rolling it
          with a Condition is the <em>interview</em> exercise; in production you import it. Knowing both —
          "I'd use <code className="font-mono">queue.Queue</code>, but here's how it works underneath" — is
          the staff signal.
        </Callout>
      </Block>

      <Block eyebrow="cheat sheet" title="Which primitive for which shape">
        <OpTable
          cols={["Problem shape", "Primitive", "—", "Why it fits"]}
          rows={[
            { op: "Run X only after Y happened once", avg: "Event", avgTone: "good", why: "A latch: set() once, every present-or-future wait() passes. No missed-signal race." },
            { op: "Take turns / wait on a predicate", avg: "Condition", avgTone: "good", why: "wait_for(pred) sleeps until a shared predicate holds, re-checking on every notify." },
            { op: "Protect shared mutable state", avg: "Lock", avgTone: "good", why: "Mutual exclusion — exactly one thread in the critical section." },
            { op: "Cap concurrent holders to k", avg: "Semaphore(k)", avgTone: "ok", why: "A counter that blocks the (k+1)th acquirer until someone releases." },
          ]}
        />
      </Block>
    </>
  );
}

/* ── Producer / Consumer ───────────────────────────────────────── */
function ProducerConsumer() {
  return (
    <>
      <Lede>
        Producer/consumer is the canonical decoupling pattern: producers put items into a{" "}
        <strong>bounded buffer</strong>, consumers take them out, and the buffer absorbs the mismatch in
        their speeds. The textbook solution uses <strong>two counting semaphores plus a mutex</strong>:{" "}
        <code className="font-mono">empty</code> (starts at N, the free slots) and{" "}
        <code className="font-mono">full</code> (starts at 0, the filled slots). The semaphores supply{" "}
        <strong>backpressure</strong> for free — block instead of busy-wait when there's nothing to do.
      </Lede>

      <Try><ProducerConsumerViz /></Try>

      <Block eyebrow="under the hood" title="empty=N, full=0, and a mutex for the buffer">
        <p className="text-ink-dim leading-relaxed mb-1">
          Two counting semaphores track the two resources a bounded buffer has:{" "}
          <strong>free slots</strong> and <strong>filled slots</strong>. A producer{" "}
          <code className="font-mono">acquire</code>s an <code className="font-mono">empty</code> slot
          (blocking if the buffer is full), writes under the mutex, then{" "}
          <code className="font-mono">release</code>s a <code className="font-mono">full</code> slot. A
          consumer does the mirror image: acquire <code className="font-mono">full</code> (blocking if
          empty), read under the mutex, release <code className="font-mono">empty</code>. The two
          semaphores hand slots back and forth; the mutex only guards the actual buffer mutation.
        </p>
        <CodeBlock
          title="python · producer/consumer with two semaphores + a lock"
          code={`import threading
from collections import deque

N = 5
buffer = deque()
empty = threading.Semaphore(N)   # free slots — starts full of permits
full  = threading.Semaphore(0)   # filled slots — starts empty
mutex = threading.Lock()         # guards the buffer itself

def producer(items):
    for item in items:
        empty.acquire()          # wait for a free slot (BLOCKS if buffer full)
        with mutex:              # exclusive access to the shared buffer
            buffer.append(item)
        full.release()           # signal: one more item available

def consumer():
    while True:
        full.acquire()           # wait for an item (BLOCKS if buffer empty)
        with mutex:
            item = buffer.popleft()
        empty.release()          # signal: one more free slot
        handle(item)`}
        />
        <Callout kind="trap" title="Acquire the semaphore BEFORE the mutex — never the reverse">
          If a thread grabs <code className="font-mono">mutex</code> first and <em>then</em> blocks on a
          full <code className="font-mono">empty.acquire()</code>, it holds the lock while asleep — no one
          can drain the buffer, and you've deadlocked. The order is always{" "}
          <strong>count semaphore → mutex → release</strong>. The semaphore is the wait; the mutex is the
          brief mutation. Hold the mutex for as little as possible.
        </Callout>
      </Block>

      <Block eyebrow="the easy version" title="queue.Queue gives you all of this">
        <p className="text-ink-dim leading-relaxed mb-1">
          In real Python you don't wire semaphores by hand —{" "}
          <code className="font-mono">queue.Queue(maxsize=N)</code> <em>is</em> a bounded buffer with the
          locking baked in. <code className="font-mono">put()</code> blocks on a full queue,{" "}
          <code className="font-mono">get()</code> blocks on an empty one, and{" "}
          <code className="font-mono">task_done()</code>/<code className="font-mono">join()</code> let you
          wait for drain. A <code className="font-mono">None</code> sentinel is the usual shutdown signal.
        </p>
        <CodeBlock
          title="python · the production version"
          code={`import queue, threading

q = queue.Queue(maxsize=5)       # bounded -> built-in backpressure

def producer(items):
    for item in items:
        q.put(item)              # BLOCKS when the queue is full
    q.put(None)                  # sentinel: tell the consumer to stop

def consumer():
    while True:
        item = q.get()           # BLOCKS when the queue is empty
        if item is None:         # saw the sentinel -> shut down
            q.task_done()
            break
        handle(item)
        q.task_done()            # mark this item processed

t = threading.Thread(target=consumer)
t.start()
producer(range(20))
q.join()                         # wait until every item is task_done()`}
        />
      </Block>

      <Block eyebrow="judgment" title="Backpressure is the whole point">
        <Callout kind="tip" title="What backpressure buys you">
          A <strong>bounded</strong> buffer makes a fast producer <em>wait</em> when consumers fall
          behind, instead of allocating unbounded memory until the process OOMs. That blocking{" "}
          <code className="font-mono">put()</code> is backpressure — it propagates "slow down" upstream
          for free. The reflexive interview answer of an <em>unbounded</em> queue quietly removes the
          safety valve: under sustained overload it grows without limit and the whole service falls over.
        </Callout>
        <Callout kind="note" title="When the buffer is full vs empty">
          <strong>Full</strong> → producers block on <code className="font-mono">empty.acquire()</code> /{" "}
          <code className="font-mono">put()</code>; the system is consumer-bound, and you scale consumers
          or shed load. <strong>Empty</strong> → consumers block on{" "}
          <code className="font-mono">full.acquire()</code> / <code className="font-mono">get()</code>;
          they sleep cheaply instead of spinning, so idle consumers cost nothing. The blocking is a
          feature, not a stall.
        </Callout>
      </Block>
    </>
  );
}

/* ── Deadlock & Dining Philosophers ────────────────────────────── */
function Deadlock() {
  return (
    <>
      <Lede>
        A <strong>deadlock</strong> is a set of threads each waiting forever on a resource another holds —
        nobody makes progress. It can only occur when <em>all four</em> Coffman conditions hold at once,
        which is the gift in disguise: <strong>break any single one and deadlock becomes impossible</strong>.
        Dining philosophers is the canonical demonstration, and the fix is almost always to destroy{" "}
        <em>circular wait</em>.
      </Lede>

      <Block eyebrow="the necessary conditions" title="The 4 Coffman conditions">
        <p className="text-ink-dim leading-relaxed mb-2">
          All four must hold simultaneously for a deadlock to be possible. Every deadlock-prevention
          strategy works by guaranteeing one of them can never hold:
        </p>
        <div className="grid sm:grid-cols-2 gap-2.5 mb-2">
          {[
            ["1 · Mutual exclusion", "a resource is held exclusively — only one thread can own it at a time."],
            ["2 · Hold and wait", "a thread keeps the resources it has while blocking to acquire more."],
            ["3 · No preemption", "a resource can't be forcibly taken away; only its holder may release it."],
            ["4 · Circular wait", "a cycle of threads exists, each waiting on a resource the next one holds."],
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
        <Callout kind="note" title="Which one do you actually attack">
          You rarely break mutual exclusion (the resource needs exclusivity) and preemption is hard for
          locks. So in practice you kill <strong>hold-and-wait</strong> (acquire all locks at once, or
          none) or, far more commonly, <strong>circular wait</strong> via a global lock ordering. That's
          the answer to deliver.
        </Callout>
      </Block>

      <Block eyebrow="the setup" title="Dining philosophers — how it deadlocks">
        <p className="text-ink-dim leading-relaxed mb-1">
          Five philosophers sit around a table with five forks between them; each needs <em>both</em>{" "}
          adjacent forks to eat. The naive rule "pick up your left fork, then your right" deadlocks the
          instant <strong>every philosopher grabs their left fork simultaneously</strong> — now all five
          hold one fork and wait forever for a right fork that will never be freed. That's all four Coffman
          conditions at once, with a perfect circular wait around the table.
        </p>
        <CodeBlock
          title="python · the BROKEN version (deadlocks)"
          code={`import threading

forks = [threading.Lock() for _ in range(5)]

def philosopher(i):
    left, right = forks[i], forks[(i + 1) % 5]
    while True:
        left.acquire()      # everyone grabs their LEFT first...
        right.acquire()     # ...then all block here forever -> deadlock
        eat()
        right.release()
        left.release()`}
        />
      </Block>

      <Block eyebrow="the fix" title="Resource hierarchy — a global lock order">
        <p className="text-ink-dim leading-relaxed mb-1">
          Number the forks 0–4 and require every philosopher to acquire the{" "}
          <strong>lower-numbered fork first</strong>. Now the last philosopher (between fork 4 and fork 0)
          reaches for fork 0 before fork 4 — reversed from everyone else. With a consistent global order,{" "}
          <strong>no cycle can form</strong>, so circular wait is impossible and the table never
          deadlocks. This is the same trick as "always lock the lower-id account first" in a bank
          transfer.
        </p>
        <CodeBlock
          title="python · the FIXED version (lock ordering)"
          code={`import threading

forks = [threading.Lock() for _ in range(5)]

def philosopher(i):
    a, b = i, (i + 1) % 5
    first, second = min(a, b), max(a, b)   # ALWAYS lower-numbered fork first
    while True:
        forks[first].acquire()
        forks[second].acquire()            # global order -> no cycle possible
        eat()
        forks[second].release()
        forks[first].release()`}
        />
        <Callout kind="tip" title="The alternative fix: an arbitrator / limit to N−1">
          A <code className="font-mono">Semaphore(4)</code> that admits at most four philosophers to the
          table at once also works: with five forks and only four eaters competing, at least one can
          always get both forks, so the cycle can't close. This prevents the circular wait from ever closing
          instead of imposing an order. Lock ordering is usually cleaner; the semaphore/arbitrator is
          the answer when you can't impose a global order on resources.
        </Callout>
      </Block>

      <Block eyebrow="don't confuse them" title="Deadlock vs livelock vs starvation">
        <OpTable
          cols={["Failure", "What happens", "—", "Tell / fix"]}
          rows={[
            { op: "Deadlock", avg: "frozen", avgTone: "bad", why: "Threads block forever waiting on each other; CPU idle. Fix: break a Coffman condition (lock ordering)." },
            { op: "Livelock", avg: "busy, no progress", avgTone: "bad", why: "Threads keep reacting to each other and retrying — like two people sidestepping in a hallway. CPU busy, nothing done. Fix: add randomized backoff." },
            { op: "Starvation", avg: "one thread blocked", avgTone: "ok", why: "The system progresses but one thread never gets the resource (e.g. a writer starved by constant readers). Fix: fairness / aging / a fair lock." },
          ]}
        />
        <Callout kind="trap" title="Livelock isn't deadlock">
          In a deadlock everyone is <em>blocked</em> (asleep, CPU idle). In a livelock everyone is{" "}
          <em>running</em> — retrying, backing off, retrying — burning CPU while making zero progress.
          Detection differs: a deadlock shows threads parked on locks; a livelock shows 100% CPU and no
          forward movement. The classic livelock fix is the same one Ethernet uses for collisions —{" "}
          <strong>randomized exponential backoff</strong> so the symmetry breaks.
        </Callout>
      </Block>
    </>
  );
}

/* ── Threads vs Async vs Processes ─────────────────────────────── */
function AsyncModels() {
  return (
    <>
      <Lede>
        "Make this faster — threads, async, or processes?" The right answer hinges on one question:{" "}
        <strong>is the work CPU-bound or I/O-bound?</strong> In CPython the{" "}
        <strong>GIL serializes Python bytecode</strong>, so threads give you <em>no</em> speedup on
        CPU-bound work — but they shine for I/O, asyncio shines harder for high-concurrency I/O, and only{" "}
        <code className="font-mono">multiprocessing</code> gives true CPU parallelism.
      </Lede>

      <Block eyebrow="the deciding axis" title="CPU-bound vs I/O-bound">
        <p className="text-ink-dim leading-relaxed mb-1">
          <strong>CPU-bound</strong> work keeps a core busy computing — hashing, image resizing, number
          crunching. The bottleneck is cycles, so the only way to go faster is to use{" "}
          <em>more cores</em>. <strong>I/O-bound</strong> work spends most of its time <em>waiting</em> —
          for a network response, a disk read, a database query. The bottleneck is latency, not the CPU,
          so the win is overlapping many waits, which needs concurrency but not parallelism.
        </p>
        <Callout kind="note" title="The GIL, stated correctly">
          CPython's Global Interpreter Lock lets only one thread execute Python bytecode at a time. So for
          <strong> CPU-bound Python, threads run effectively serially</strong> — no speedup, just
          time-slicing one core (plus switch overhead). Crucially, the GIL is{" "}
          <em>released during blocking I/O</em> (and inside many C extensions like NumPy), so threads{" "}
          <strong>do</strong> help I/O-bound work — one thread waits on the socket while another runs.
          Python 3.13+ ships an experimental free-threaded (no-GIL) build, but the GIL is still the
          default to reason about in an interview.
        </Callout>
      </Block>

      <Block eyebrow="the three models" title="Threads, asyncio, multiprocessing">
        <OpTable
          cols={["Model", "Parallelism?", "Best for", "Cost / catch"]}
          rows={[
            { op: "threading", avg: "no (GIL)", avgTone: "ok", worst: "I/O-bound", worstTone: "good", why: "Pre-emptive OS threads, shared memory. GIL blocks CPU parallelism; great for blocking I/O. Needs locks — race conditions are easy." },
            { op: "asyncio", avg: "no (1 thread)", avgTone: "ok", worst: "high-concurrency I/O", worstTone: "good", why: "Cooperative event loop, single thread. Scales to tens of thousands of sockets cheaply. Needs async-aware libs; one blocking call stalls everything." },
            { op: "multiprocessing", avg: "YES (N cores)", avgTone: "good", worst: "CPU-bound", worstTone: "good", why: "Separate processes, separate memory, own GIL each → true parallelism. Cost: IPC/pickling overhead, no shared state, heavier to spawn." },
          ]}
        />
        <Callout kind="tip" title="The decision rule in one line">
          <strong>CPU-bound → multiprocessing</strong> (or a C extension / native code that drops the
          GIL). <strong>I/O-bound, modest concurrency → threading.</strong>{" "}
          <strong>I/O-bound, massive concurrency (10k+ connections) → asyncio.</strong> If you say "use
          threads to speed up a tight numeric loop," that's the wrong answer — the GIL means it won't go
          faster.
        </Callout>
      </Block>

      <Block eyebrow="cooperative vs pre-emptive" title="Why asyncio is single-threaded and still fast">
        <p className="text-ink-dim leading-relaxed mb-1">
          <code className="font-mono">asyncio</code> runs one thread with an <strong>event loop</strong>.
          A coroutine runs until it hits <code className="font-mono">await</code> on something that would
          block (a socket, a sleep); it <em>yields control</em> back to the loop, which runs another ready
          coroutine. No OS thread per connection, no lock contention, no GIL fight — just one thread
          juggling thousands of paused waits. It's <strong>cooperative</strong>: a coroutine that never{" "}
          <code className="font-mono">await</code>s hogs the loop.
        </p>
        <CodeBlock
          title="python · asyncio overlaps I/O on one thread"
          code={`import asyncio

async def fetch(name, delay):
    await asyncio.sleep(delay)     # yields the loop while "I/O" is pending
    return f"{name} done"

async def main():
    # all three "requests" overlap on ONE thread — total ~3s, not 6s
    results = await asyncio.gather(
        fetch("a", 3),
        fetch("b", 2),
        fetch("c", 1),
    )
    print(results)

asyncio.run(main())`}
        />
        <Callout kind="trap" title="Never block the event loop">
          The cardinal asyncio sin is calling a <em>blocking</em> function — a synchronous{" "}
          <code className="font-mono">requests.get()</code>, a CPU-heavy loop,{" "}
          <code className="font-mono">time.sleep()</code> — inside a coroutine. There's only one thread,
          so it freezes <em>every</em> other task. Use async-native libraries (e.g.{" "}
          <code className="font-mono">aiohttp</code>), or offload blocking/CPU work to a thread or process
          pool via <code className="font-mono">loop.run_in_executor</code> /{" "}
          <code className="font-mono">asyncio.to_thread</code>.
        </Callout>
      </Block>

      <Block eyebrow="the trap" title="multiprocessing — true parallelism, separate memory">
        <p className="text-ink-dim leading-relaxed mb-1">
          Each process has its <em>own</em> Python interpreter and its <em>own</em> GIL, so N processes
          genuinely run on N cores — the only way to parallelize CPU-bound Python. The price is{" "}
          <strong>no shared memory</strong>: arguments and results are <code className="font-mono">pickle</code>d
          across the process boundary, spawning is heavier than a thread, and you coordinate through
          queues/pipes rather than shared variables.
        </p>
        <CodeBlock
          title="python · multiprocessing for CPU-bound work"
          code={`from multiprocessing import Pool

def heavy(n):                 # CPU-bound: pure computation
    return sum(i * i for i in range(n))

if __name__ == "__main__":    # required guard on spawn-based platforms
    with Pool(processes=4) as pool:
        # runs across 4 cores in parallel — real speedup, GIL not in the way
        results = pool.map(heavy, [10**6] * 8)
    print(sum(results))`}
        />
        <Callout kind="warn" title="Picklability and the __main__ guard">
          Anything passed to a worker must be <strong>picklable</strong> (no lambdas, no open sockets,
          no local closures), and on spawn-based platforms (Windows, and macOS by default) you{" "}
          <em>must</em> guard the entry point with{" "}
          <code className="font-mono">if __name__ == "__main__":</code> or each child re-imports and
          re-spawns recursively. These are the two gotchas that bite people the first time.
        </Callout>
      </Block>
    </>
  );
}

export const CONCURRENCY_EXTRA_TOPICS = [
  { id: "conc-classics", label: "Classic Threading Problems", group: "Concurrency" },
  { id: "producer-consumer", label: "Producer / Consumer", group: "Concurrency" },
  { id: "deadlock", label: "Deadlock & Dining Philosophers", group: "Concurrency" },
  { id: "async-models", label: "Threads vs Async vs Processes", group: "Concurrency" },
];

export const CONCURRENCY_EXTRA_CONTENT = {
  "conc-classics": <ClassicProblems />,
  "producer-consumer": <ProducerConsumer />,
  deadlock: <Deadlock />,
  "async-models": <AsyncModels />,
};
