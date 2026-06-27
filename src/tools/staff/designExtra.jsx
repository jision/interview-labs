import React from "react";
import { Callout, CodeBlock, Tag, ComplexityTag } from "../../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../../components/layout.jsx";
import InsertDeleteGetRandomViz from "./InsertDeleteGetRandomViz.jsx";
import BloomFilterViz from "./BloomFilterViz.jsx";

const ACCENT = "#d6a94c";
const { Block, Try } = withAccent(ACCENT);

/* ── LFU Cache ─────────────────────────────────────────────────── */
function Lfu() {
  return (
    <>
      <Lede>
        "Like LRU, but evict the <strong>least-frequently-used</strong> key, and break ties by
        recency." The hard part is keeping every operation O(1). The trick is a second layer of
        bookkeeping: a <code className="font-mono">key → node</code> map for lookup, one doubly
        linked list <em>per frequency</em>, and a <code className="font-mono">min_freq</code> pointer
        so you always know which bucket to evict from.
      </Lede>

      <Block eyebrow="under the hood" title="Freq buckets + a min-frequency pointer">
        <p className="text-ink-dim leading-relaxed mb-1">
          LRU only needs one ordering, recency. LFU needs <em>two</em>: primary by access count,
          secondary by recency within the same count. Model it as a map from each frequency to its
          own ordered list (least-recent → most-recent). Two more maps glue it together:{" "}
          <code className="font-mono">val[key]</code> and <code className="font-mono">freq[key]</code>.
          On a touch, you bump the key from its <code className="font-mono">f</code> list to the{" "}
          <code className="font-mono">f+1</code> list. The only subtlety is{" "}
          <code className="font-mono">min_freq</code>: it only ever <em>increases</em> when you
          promote the last key out of the <code className="font-mono">min_freq</code> bucket, and it
          resets to 1 on every insert. To evict, drop the least-recent key from the{" "}
          <code className="font-mono">min_freq</code> list.
        </p>
        <Callout kind="trap" title="Tie-break is recency, LFU contains an LRU">
          When several keys share the lowest frequency, you must evict the one used <em>longest
          ago</em>. That's why each frequency bucket is an <strong>ordered list</strong>, not a set:
          within a bucket it behaves exactly like an LRU. Forget the tie-break and you'll evict a
          freshly-promoted key while a stale one lingers.
        </Callout>
        <CodeBlock
          title="python · O(1) LFU with OrderedDict buckets"
          code={`from collections import defaultdict, OrderedDict

class LFUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.val = {}                         # key -> value
        self.freq = {}                        # key -> current frequency
        self.buckets = defaultdict(OrderedDict)  # freq -> {key: None}, recency-ordered
        self.min_freq = 0

    def _bump(self, key):                     # promote key from f to f+1
        f = self.freq[key]
        del self.buckets[f][key]              # remove from old bucket
        if not self.buckets[f]:               # bucket emptied
            del self.buckets[f]
            if self.min_freq == f:            # only then does min_freq rise
                self.min_freq += 1
        self.freq[key] = f + 1
        self.buckets[f + 1][key] = None       # newest at the end

    def get(self, key):
        if key not in self.val:
            return -1
        self._bump(key)                       # a read counts as a use
        return self.val[key]

    def put(self, key, value):
        if self.cap <= 0:
            return
        if key in self.val:                   # update + bump, no eviction
            self.val[key] = value
            self._bump(key)
            return
        if len(self.val) >= self.cap:         # evict LFU, ties broken by LRU
            old, _ = self.buckets[self.min_freq].popitem(last=False)
            del self.val[old]
            del self.freq[old]
        self.val[key] = value                 # new keys start at freq 1
        self.freq[key] = 1
        self.buckets[1][key] = None
        self.min_freq = 1`}
        />
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "get(key)", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Map lookup + move node between two ordered buckets." },
            { op: "put(key, val)", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Bump or insert; eviction is popitem(last=False) on the min bucket." },
            { op: "evict LFU", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "min_freq names the bucket; pop its least-recent (front) key." },
            { op: "space", avg: "O(capacity)", avgTone: "ok", worst: "O(capacity)", worstTone: "ok", why: "Three maps + bucket lists, one entry per cached key." },
          ]}
        />
      </Block>

      <Block eyebrow="judgment" title="LFU vs LRU, and where LFU bites back">
        <Callout kind="note" title="When each wins">
          <strong>LRU</strong> assumes recent = useful; one cold scan flushes it. <strong>LFU</strong>{" "}
          protects a few perennially-hot keys from being knocked out by a burst of one-off traffic,
          the exact scan-resistance LRU lacks. The catch is the mirror image:{" "}
          <strong>LFU never forgets</strong>. A key that was hot last week but is now dead keeps its
          high count and refuses to leave. Production caches fix this with <em>aging</em>, decaying
          counts over time, or the count-min-sketch + window of <strong>TinyLFU</strong> (used by
          Caffeine and Ristretto), which gets LFU's accuracy at LRU's memory cost.
        </Callout>
      </Block>
    </>
  );
}

/* ── Min Stack ─────────────────────────────────────────────────── */
function MinStack() {
  return (
    <>
      <Lede>
        "Design a stack with <code className="font-mono">push</code>, <code className="font-mono">pop</code>,{" "}
        <code className="font-mono">top</code>, and <code className="font-mono">getMin</code>, all in
        O(1)." The naive <code className="font-mono">min(stack)</code> is O(n). The fix is to carry
        the minimum <em>along with</em> each element, so the answer is always sitting at the top.
      </Lede>

      <Block eyebrow="under the hood" title="Pair each value with the min-so-far">
        <p className="text-ink-dim leading-relaxed mb-1">
          The insight: the minimum of the whole stack at any moment is a property of the{" "}
          <em>current top</em>. So at push time, compute{" "}
          <code className="font-mono">min(new_val, current_min)</code> and store the pair{" "}
          <code className="font-mono">(val, running_min)</code>. <code className="font-mono">getMin</code>{" "}
          is then just the second field of the top, no scan. Pop discards the pair and the previous
          running-min is automatically exposed underneath. An equivalent design keeps a separate{" "}
          <em>auxiliary min-stack</em> that mirrors the main stack; the paired-tuple version is the
          same idea with one array.
        </p>
        <CodeBlock
          title="python · pair each value with the running min"
          code={`class MinStack:
    def __init__(self):
        self.stack = []                       # holds (value, min_so_far)

    def push(self, x):
        cur_min = x if not self.stack else min(x, self.stack[-1][1])
        self.stack.append((x, cur_min))       # running min travels with the value

    def pop(self):
        self.stack.pop()                      # previous running-min re-exposed below

    def top(self):
        return self.stack[-1][0]

    def getMin(self):
        return self.stack[-1][1]              # O(1): it's right there on top`}
        />
        <Callout kind="tip" title="Interview line">
          "I store <code className="font-mono">(value, min-so-far)</code> pairs so the current minimum
          rides on top of the stack, every operation is O(1) and O(n) space. If they ask to cut the
          space, I'd keep a separate min-stack and only push to it when a new value is{" "}
          <em>≤</em> the current min (use ≤, not &lt;, so duplicate minimums pop correctly)."
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "push(x)", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "One min() comparison + append the pair." },
            { op: "pop()", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Discard the top pair; min underneath is already correct." },
            { op: "top()", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Read the value field of the top pair." },
            { op: "getMin()", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Read the min field of the top pair, no scan." },
            { op: "space", avg: "O(n)", avgTone: "ok", worst: "O(n)", worstTone: "ok", why: "One extra integer (the running min) per element." },
          ]}
        />
        <Callout kind="note" title="getMax, or a min-queue?">
          <code className="font-mono">getMax</code> is the symmetric problem, store{" "}
          <code className="font-mono">max(x, prev_max)</code> instead. The harder cousin is a{" "}
          <strong>min-queue</strong> (O(1) min with FIFO order): you can't pair-and-pop because
          removal is at the far end. Build it from two min-stacks, or use a monotonic deque, the
          sliding-window-minimum trick.
        </Callout>
      </Block>
    </>
  );
}

/* ── Median of a Stream ────────────────────────────────────────── */
function MedianStream() {
  return (
    <>
      <Lede>
        "Numbers arrive one at a time; report the running median after each." Sorting on every query
        is O(n log n). The two-heap trick gives <strong>O(log n) insert</strong> and{" "}
        <strong>O(1) median</strong>: split the data into a low half and a high half, and the median
        sits right at the boundary between them.
      </Lede>

      <Block eyebrow="under the hood" title="A max-heap and a min-heap, kept balanced">
        <p className="text-ink-dim leading-relaxed mb-1">
          Keep the smaller half in a <strong>max-heap</strong> (<code className="font-mono">low</code>) so its
          largest element is on top, and the larger half in a <strong>min-heap</strong>{" "}
          (<code className="font-mono">high</code>) so its smallest is on top. The two tops straddle the
          median. Maintain the invariant{" "}
          <code className="font-mono">len(low) == len(high)</code> or{" "}
          <code className="font-mono">len(low) == len(high) + 1</code>. If the counts are equal the
          median is the average of the two tops; otherwise it's the top of{" "}
          <code className="font-mono">low</code>.
        </p>
        <Callout kind="trap" title="Python's heapq is a MIN-heap, negate for the max-heap">
          <code className="font-mono">heapq</code> only does min-heaps. Simulate a max-heap by storing{" "}
          <strong>negated</strong> values: the smallest negative is the largest original. Negate going
          in, negate coming out. Getting this backwards is the #1 bug in this problem.
        </Callout>
        <CodeBlock
          title="python · two heaps, push-to-other-then-rebalance"
          code={`import heapq

class MedianFinder:
    def __init__(self):
        self.low = []      # max-heap (store negatives): the smaller half
        self.high = []     # min-heap: the larger half

    def addNum(self, num):
        # Always push to low first, hand its max over to high, then rebalance.
        heapq.heappush(self.low, -num)
        heapq.heappush(self.high, -heapq.heappop(self.low))   # low's max -> high
        if len(self.high) > len(self.low):                    # keep low >= high
            heapq.heappush(self.low, -heapq.heappop(self.high))

    def findMedian(self):
        if len(self.low) > len(self.high):
            return -self.low[0]                               # odd count: low's top
        return (-self.low[0] + self.high[0]) / 2              # even: average the tops`}
        />
        <p className="text-ink-dim leading-relaxed mt-2 mb-0">
          The "push to <code className="font-mono">low</code>, pop its max into{" "}
          <code className="font-mono">high</code>, then rebalance if{" "}
          <code className="font-mono">high</code> grew bigger" dance guarantees both the size and the
          ordering invariants in three heap operations, no branchy "which heap does this belong in?"
          logic.
        </p>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "addNum(x)", avg: "O(log n)", avgTone: "good", worst: "O(log n)", worstTone: "good", why: "A constant number of heap push/pop, each O(log n)." },
            { op: "findMedian()", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Peek one or both heap tops, no removal." },
            { op: "space", avg: "O(n)", avgTone: "ok", worst: "O(n)", worstTone: "ok", why: "Every number is held in one of the two heaps." },
          ]}
        />
        <Callout kind="note" title="Sliding-window or bounded-range variants">
          If the stream is bounded to a small integer range, a <strong>counting / Fenwick tree</strong>{" "}
          finds the median by rank in O(log range) and supports removals, handy for a{" "}
          <em>sliding-window</em> median, where the two-heap version struggles because heaps can't
          delete an arbitrary middle element cheaply (you'd need lazy deletion with a removed-set). For a
          FIXED-size sliding-window median, the textbook approaches are two heaps with lazy deletion (a
          dict of to-be-removed elements + a running balance), or a multiset / Fenwick tree / SortedList.
        </Callout>
      </Block>
    </>
  );
}

/* ── Insert / Delete / GetRandom O(1) ──────────────────────────── */
function InsertDelRandom() {
  return (
    <>
      <Lede>
        "Build a set with <code className="font-mono">insert</code>, <code className="font-mono">remove</code>,
        and <code className="font-mono">getRandom</code>, all average O(1)." A dict alone nails
        insert/remove but can't pick a uniform random element in O(1); an array gives O(1) random
        indexing but O(n) removal. Combine them.
      </Lede>

      <Try><InsertDeleteGetRandomViz /></Try>

      <Block eyebrow="under the hood" title="Array for random, dict for the index, swap-with-last to delete">
        <p className="text-ink-dim leading-relaxed mb-1">
          Store the values in a dense array <code className="font-mono">vals</code> so{" "}
          <code className="font-mono">getRandom</code> is just{" "}
          <code className="font-mono">vals[randint(0, n-1)]</code>. Keep a dict{" "}
          <code className="font-mono">pos[val] → index</code> so you can find any value's slot in O(1).
          The whole problem is the <strong>delete</strong>: you can't pop from the middle of an array
          in O(1). So <em>swap the doomed element with the last one</em>, fix the moved element's index
          in the dict, then pop the tail, which <em>is</em> O(1). That one trick keeps the array dense
          and every operation constant-time.
        </p>
        <Callout kind="trap" title="Update the moved element's index before you pop">
          The classic bug: you overwrite <code className="font-mono">vals[idx]</code> with the last
          value but forget to set <code className="font-mono">pos[last_val] = idx</code>. Now the dict
          points the moved value at a stale slot and the structure silently corrupts. Update the dict{" "}
          <em>first</em>, then pop. (Also guard the edge case where the element to remove already{" "}
          <em>is</em> the last one.)
        </Callout>
        <CodeBlock
          title="python · array + dict, delete by swap-with-last"
          code={`import random

class RandomizedSet:
    def __init__(self):
        self.vals = []          # dense array of values
        self.pos = {}           # value -> its index in vals

    def insert(self, val):
        if val in self.pos:
            return False
        self.pos[val] = len(self.vals)
        self.vals.append(val)   # always append at the end
        return True

    def remove(self, val):
        if val not in self.pos:
            return False
        idx = self.pos[val]
        last = self.vals[-1]
        self.vals[idx] = last       # move last value into the hole
        self.pos[last] = idx        # fix the moved value's index FIRST
        self.vals.pop()             # now drop the (duplicate) tail in O(1)
        del self.pos[val]
        return True

    def getRandom(self):
        return random.choice(self.vals)   # uniform O(1) over a dense array`}
        />
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "insert(val)", avg: "O(1)", avgTone: "good", worst: "O(n)", worstTone: "ok", why: "Dict write + amortized append; rare array growth is the worst case." },
            { op: "remove(val)", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Swap target with last, fix one index, pop the tail." },
            { op: "getRandom()", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "One random index into a dense array." },
            { op: "space", avg: "O(n)", avgTone: "ok", worst: "O(n)", worstTone: "ok", why: "The array plus one dict entry per value." },
          ]}
        />
        <Callout kind="note" title="The follow-up: allow duplicates">
          <code className="font-mono">RandomizedCollection</code> permits the same value many times.
          Change the dict to <code className="font-mono">val → set of indices</code>. Removal pops{" "}
          <em>any</em> index from that set, swaps with last, and updates the moved value's set, same
          swap-with-last idea, just bookkeeping a set of positions instead of one.
        </Callout>
      </Block>
    </>
  );
}

/* ── Time-based Key-Value ──────────────────────────────────────── */
function TimeKV() {
  return (
    <>
      <Lede>
        "Store versioned values: <code className="font-mono">set(key, val, ts)</code> records a value
        at timestamp <code className="font-mono">ts</code>, and{" "}
        <code className="font-mono">get(key, ts)</code> returns the value whose timestamp is the{" "}
        <strong>largest one ≤ ts</strong>." Because timestamps for a key arrive non-decreasing, each
        key's history is already sorted, so <code className="font-mono">get</code> is a binary search.
      </Lede>

      <Block eyebrow="under the hood" title="Per-key sorted log + binary search for ≤ ts">
        <p className="text-ink-dim leading-relaxed mb-1">
          Keep <code className="font-mono">store[key]</code> as an append-only list of{" "}
          <code className="font-mono">(ts, val)</code> pairs. Since calls to{" "}
          <code className="font-mono">set</code> arrive with non-decreasing timestamps, that list stays
          sorted by <code className="font-mono">ts</code> for free, no insertion sort needed. For{" "}
          <code className="font-mono">get</code>, find the rightmost entry with{" "}
          <code className="font-mono">ts ≤ query</code>. That's a textbook{" "}
          <strong>predecessor search</strong>: <code className="font-mono">bisect_right</code> on the
          timestamps gives the insertion point, and the entry just before it is your answer (index 0
          means nothing was set early enough).
        </p>
        <Callout kind="trap" title="bisect_right, then step back one, and beware index 0">
          You want the <em>last</em> ts that is <code className="font-mono">≤ query</code>.{" "}
          <code className="font-mono">bisect_right(times, query)</code> returns the count of entries{" "}
          <code className="font-mono">≤ query</code>, so the target is at index{" "}
          <code className="font-mono">i - 1</code>. If <code className="font-mono">i == 0</code>, every
          stored timestamp is strictly greater than the query, return the empty answer, don't index{" "}
          <code className="font-mono">[-1]</code> (that would wrap to the newest value, a silent bug).
        </Callout>
        <CodeBlock
          title="python · bisect for the latest version at-or-before ts"
          code={`from collections import defaultdict
import bisect

class TimeMap:
    def __init__(self):
        self.store = defaultdict(list)   # key -> [(ts, val), ...] sorted by ts

    def set(self, key, value, timestamp):
        # timestamps arrive non-decreasing, so appending keeps the list sorted.
        self.store[key].append((timestamp, value))

    def get(self, key, timestamp):
        arr = self.store.get(key)
        if not arr:
            return ""
        # bisect on (ts, val): (timestamp, chr(255)) sorts AFTER any (timestamp, *)
        i = bisect.bisect_right(arr, (timestamp, chr(0x10FFFF)))
        if i == 0:
            return ""                    # no version at-or-before this ts
        return arr[i - 1][1]             # value of the largest ts <= query`}
        />
        <p className="text-ink-dim leading-relaxed mt-2 mb-0">
          Pairing the sentinel <code className="font-mono">chr(0x10FFFF)</code> (the max code point)
          makes <code className="font-mono">(timestamp, sentinel)</code> sort strictly after any real{" "}
          <code className="font-mono">(timestamp, value)</code>, so{" "}
          <code className="font-mono">bisect_right</code> lands just past the last matching timestamp,
          no need to maintain a separate parallel list of just the timestamps.
        </p>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "set(k, v, ts)", avg: "O(1)", avgTone: "good", worst: "O(n)", worstTone: "ok", why: "Append to the key's list; amortized O(1), rare array growth aside." },
            { op: "get(k, ts)", avg: "O(log m)", avgTone: "good", worst: "O(log m)", worstTone: "good", why: "Binary search over the m versions stored for that key." },
            { op: "space", avg: "O(n)", avgTone: "ok", worst: "O(n)", worstTone: "ok", why: "One (ts, val) entry per set call across all keys." },
          ]}
        />
        <Callout kind="note" title="If timestamps can arrive out of order">
          The append-stays-sorted shortcut assumes non-decreasing <code className="font-mono">ts</code>.
          If <code className="font-mono">set</code> can backfill the past, insert with{" "}
          <code className="font-mono">bisect.insort</code> (O(m) per write) to keep the list sorted, or
          switch to a sorted-container / balanced BST keyed by timestamp for O(log m) writes too.
        </Callout>
      </Block>
    </>
  );
}

/* ── Design Twitter Feed ───────────────────────────────────────── */
function TwitterFeed() {
  return (
    <>
      <Lede>
        "Design Twitter: <code className="font-mono">postTweet</code>,{" "}
        <code className="font-mono">follow</code>/<code className="font-mono">unfollow</code>, and{" "}
        <code className="font-mono">getNewsFeed</code> returning the <strong>10 most recent</strong>{" "}
        tweets across the people a user follows (plus themself)." Each user's own tweets are already
        in time order, so the feed is a <strong>merge-K-sorted-lists</strong> problem, and a heap
        does it without touching every tweet.
      </Lede>

      <Block eyebrow="under the hood" title="Per-user tweet logs, merged top-10 by a heap">
        <p className="text-ink-dim leading-relaxed mb-1">
          Give each user an append-only list of <code className="font-mono">(time, tweet_id)</code>,
          where <code className="font-mono">time</code> is a single global, monotonically increasing
          counter (so it orders tweets across all users). Track follows as{" "}
          <code className="font-mono">user → set of followees</code>. For the feed, you don't need to
          sort everyone's tweets, you only need the top 10. Seed a max-heap with the{" "}
          <em>newest</em> tweet from each followee, then pop 10 times; each pop pushes that user's{" "}
          <em>next-newest</em> tweet back in. That's the K-way merge, stopped after 10 elements.
        </p>
        <CodeBlock
          title="python · K-way merge of followees' tweet logs"
          code={`from collections import defaultdict
import heapq

class Twitter:
    def __init__(self):
        self.time = 0
        self.tweets = defaultdict(list)       # user -> [(time, tweet_id), ...]
        self.following = defaultdict(set)     # user -> set of followee ids

    def postTweet(self, user, tweet_id):
        self.tweets[user].append((self.time, tweet_id))
        self.time += 1                        # global clock orders all tweets

    def getNewsFeed(self, user):
        # A user always sees their own tweets.
        sources = self.following[user] | {user}
        heap = []                             # max-heap via negated time
        for u in sources:
            log = self.tweets[u]
            if log:
                t, tid = log[-1]              # that user's newest tweet
                # store the index so we can walk backwards on pop
                heapq.heappush(heap, (-t, tid, u, len(log) - 1))

        feed = []
        while heap and len(feed) < 10:
            _, tid, u, i = heapq.heappop(heap)
            feed.append(tid)
            if i > 0:                         # push that user's next-older tweet
                t2, tid2 = self.tweets[u][i - 1]
                heapq.heappush(heap, (-t2, tid2, u, i - 1))
        return feed

    def follow(self, follower, followee):
        if follower != followee:
            self.following[follower].add(followee)

    def unfollow(self, follower, followee):
        self.following[follower].discard(followee)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2 mb-0">
          The heap never holds more than one entry per followee, so it stays small. Seeding is{" "}
          <code className="font-mono">O(f)</code> for <code className="font-mono">f</code> followees,
          and each of the ~10 pops does <code className="font-mono">O(log f)</code> work, the whole
          feed feels like <strong>O(f + 10 log f)</strong>, independent of how many thousands of
          tweets each person has posted.
        </p>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "postTweet", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Append (time, id) and bump the global counter." },
            { op: "getNewsFeed", avg: "O(f + 10·log f)", avgTone: "ok", worst: "O(f + 10·log f)", worstTone: "ok", why: "Seed one tweet per f followees, then 10 heap pops." },
            { op: "follow / unfollow", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Add to / discard from a hash set." },
            { op: "space", avg: "O(users + tweets)", avgTone: "ok", worst: "O(users + tweets)", worstTone: "ok", why: "Follow sets plus every tweet ever posted." },
          ]}
        />
        <Callout kind="note" title="Push vs pull at real scale, the fan-out question">
          This is the <strong>pull (fan-out-on-read)</strong> model: cheap writes, do the merge work at
          read time. The opposite is <strong>push (fan-out-on-write)</strong>: when you tweet, fan the
          tweet into a precomputed feed cache for each follower, feeds become an O(1) read, but a
          celebrity with 100M followers triggers 100M writes. Real systems go <em>hybrid</em>: push for
          ordinary users, pull for celebrities, then merge the two at read time.
        </Callout>
      </Block>
    </>
  );
}

/* ── Bloom Filter ──────────────────────────────────────────────── */
function Bloom() {
  return (
    <>
      <Lede>
        "Answer <em>is x in the set?</em> using a fraction of the memory a real set would need,
        accepting that the answer is <strong>'maybe'</strong>, never a certain yes." A Bloom filter is
        a bit array plus <em>k</em> hash functions. It can produce <strong>false positives</strong> but{" "}
        <strong>never false negatives</strong>: if it says "no", the item is definitely absent.
      </Lede>

      <Try><BloomFilterViz /></Try>

      <Block eyebrow="under the hood" title="k hashes flip k bits; all-set means 'maybe'">
        <p className="text-ink-dim leading-relaxed mb-1">
          Start with <em>m</em> bits, all zero. To <code className="font-mono">add(x)</code>, run{" "}
          <em>k</em> independent hashes of <code className="font-mono">x</code>, each into{" "}
          <code className="font-mono">[0, m)</code>, and set those <em>k</em> bits to 1. To test{" "}
          <code className="font-mono">contains(x)</code>, hash again and check those same <em>k</em>{" "}
          positions: if <strong>any</strong> is 0 the item was never added, a guaranteed{" "}
          <strong>no false negatives</strong>. If <strong>all k</strong> are 1, it's <em>probably</em>{" "}
          present, but those bits might have been set by a mix of <em>other</em> insertions, which is
          exactly a false positive. You never remove bits, which is why a plain Bloom filter has no{" "}
          <code className="font-mono">delete</code>.
        </p>
        <Callout kind="tip" title="Why the false-positive rate is what it is">
          Insert <em>n</em> items into <em>m</em> bits with <em>k</em> hashes. One specific bit is left
          at 0 with probability <code className="font-mono">(1 − 1/m)^(kn) ≈ e^(−kn/m)</code>, so it's
          set with probability <code className="font-mono">1 − e^(−kn/m)</code>. A false positive needs
          all <em>k</em> of a query's bits set, giving the rate{" "}
          <code className="font-mono">(1 − e^(−kn/m))^k</code>. Minimizing that over <em>k</em> yields
          the optimal <code className="font-mono">k = (m/n)·ln 2</code>, at which point about{" "}
          <strong>half the bits are set</strong> and each extra bit per element drops the false-positive
          rate by ~40% (the rate is <code className="font-mono">0.6185^(m/n)</code>, so one more bit
          multiplies it by ~0.62).
        </Callout>
        <CodeBlock
          title="python · bit array + k derived hashes"
          code={`import math
from hashlib import sha256

class BloomFilter:
    def __init__(self, n, false_positive_rate=0.01):
        # size m and hash count k from the target n and error rate p:
        #   m = -n ln p / (ln 2)^2,  k = (m/n) ln 2
        self.m = max(1, math.ceil(-n * math.log(false_positive_rate) / (math.log(2) ** 2)))
        self.k = max(1, round((self.m / n) * math.log(2)))
        self.bits = bytearray((self.m + 7) // 8)     # m bits packed into bytes

    def _indices(self, item):
        # Kirsch-Mitzenmacher double hashing: g_i(x) = h1 + i*h2  (deterministic)
        d = sha256(str(item).encode()).digest()
        h1 = int.from_bytes(d[:8], "big")
        h2 = int.from_bytes(d[8:16], "big") | 1      # h2 made odd so the stride is never 0 (keeps the k indices from collapsing onto one bit)
        for i in range(self.k):
            yield (h1 + i * h2) % self.m

    def add(self, item):
        for idx in self._indices(item):
            self.bits[idx >> 3] |= (1 << (idx & 7))  # set the bit

    def contains(self, item):
        return all(
            self.bits[idx >> 3] & (1 << (idx & 7))   # every one of the k bits set?
            for idx in self._indices(item)
        )   # all set -> "maybe"; any clear -> definitely absent (no false negatives)`}
        />
        <Callout kind="note" title="One hash, k indices, the double-hashing trick">
          You don't need <em>k</em> separate hash functions. Kirsch &amp; Mitzenmacher showed that{" "}
          <code className="font-mono">g_i(x) = h1(x) + i·h2(x) mod m</code>, built from two halves of a
          single hash, has the same asymptotic false-positive rate. Keeping <code className="font-mono">h2</code>{" "}
          odd guarantees a nonzero stride so the <em>k</em> positions don't collapse onto one bit.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "add(item)", avg: "O(k)", avgTone: "good", worst: "O(k)", worstTone: "good", why: "Compute k indices, set k bits, independent of n." },
            { op: "contains(item)", avg: "O(k)", avgTone: "good", worst: "O(k)", worstTone: "good", why: "Check up to k bits; short-circuits on the first 0." },
            { op: "delete(item)", avg: "n/a", avgTone: "bad", worst: "n/a", worstTone: "bad", why: "Unsupported: clearing bits could erase other items. Use a counting Bloom filter." },
            { op: "space", avg: "O(m) bits", avgTone: "good", worst: "O(m) bits", worstTone: "good", why: "≈ 1.44·log2(1/p) bits per item, far below storing the keys." },
          ]}
        />
        <Callout kind="warn" title="Where it earns its keep, and the variants">
          Reach for a Bloom filter when a <em>definite no</em> lets you skip expensive work: "is this
          URL in the malware set?", "might this key be on disk before I hit the SSD?" (Cassandra,
          BigTable, and most LSM stores guard every SSTable this way). Two variants worth naming: a{" "}
          <strong>counting Bloom filter</strong> swaps bits for small counters to support deletion, and
          a <strong>cuckoo filter</strong> supports deletion with a better space/false-positive
          trade-off at high load. The fixed-size catch: you must size <em>m</em> for the expected{" "}
          <em>n</em> up front, overfill it and the false-positive rate climbs toward 1.
        </Callout>
      </Block>
    </>
  );
}

export const EXTRA_DESIGN_TOPICS = [
  { id: "lfu", label: "LFU Cache", group: "Design a DS" },
  { id: "min-stack", label: "Min Stack", group: "Design a DS" },
  { id: "median-stream", label: "Median of a Stream", group: "Design a DS" },
  { id: "insert-del-random", label: "Insert/Delete/GetRandom O(1)", group: "Design a DS" },
  { id: "time-kv", label: "Time-based Key-Value", group: "Design a DS" },
  { id: "twitter-feed", label: "Design Twitter Feed", group: "Design a DS" },
  { id: "bloom", label: "Bloom Filter", group: "Design a DS" },
];

export const EXTRA_DESIGN_CONTENT = {
  lfu: <Lfu />,
  "min-stack": <MinStack />,
  "median-stream": <MedianStream />,
  "insert-del-random": <InsertDelRandom />,
  "time-kv": <TimeKV />,
  "twitter-feed": <TwitterFeed />,
  bloom: <Bloom />,
};
