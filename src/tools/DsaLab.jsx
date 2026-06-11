import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import DynamicArrayViz from "./dsa/DynamicArrayViz.jsx";
import LinkedListViz from "./dsa/LinkedListViz.jsx";
import StackQueueViz from "./dsa/StackQueueViz.jsx";
import HashTableViz from "./dsa/HashTableViz.jsx";
import BSTViz from "./dsa/BSTViz.jsx";
import HeapViz from "./dsa/HeapViz.jsx";
import TrieViz from "./dsa/TrieViz.jsx";
import GraphViz from "./dsa/GraphViz.jsx";

const ACCENT = "#38e0d6";

const TOPICS = [
  { id: "dynamic-array", label: "Dynamic Array", group: "Linear" },
  { id: "linked-list", label: "Linked List", group: "Linear" },
  { id: "stack-queue", label: "Stack & Queue", group: "Linear" },
  { id: "hash-table", label: "Hash Table", group: "Associative" },
  { id: "bst", label: "Binary Search Tree", group: "Hierarchical" },
  { id: "heap", label: "Heap / Priority Queue", group: "Hierarchical" },
  { id: "trie", label: "Trie (Prefix Tree)", group: "String" },
  { id: "graph", label: "Graph", group: "Graph" },
];

/* Bind the lab accent once so <Block>/<Try> don't repeat it everywhere. */
const { Block, Try } = withAccent(ACCENT);

/* ── Topic content ────────────────────────────────────────────── */
function DynamicArray() {
  return (
    <>
      <Lede>
        The workhorse — Python's <code className="text-ink font-mono">list</code>, Java's{" "}
        <code className="text-ink font-mono">ArrayList</code>, C++'s <code className="text-ink font-mono">vector</code>.
        It's a contiguous block of memory that <em>pretends</em> to be infinitely growable by quietly
        reallocating to a bigger block when it fills up.
      </Lede>

      <Try><DynamicArrayViz /></Try>

      <Block eyebrow="under the hood" title="Why append is O(1) — on average">
        <p className="text-ink-dim leading-relaxed mb-2">
          The array keeps spare slots (<em>capacity</em> ≥ <em>length</em>). Most appends just drop a
          value into a free slot — genuinely O(1). Occasionally the block is full, so it allocates a
          larger one and copies everything over — that one append is O(n).
        </p>
        <p className="text-ink-dim leading-relaxed mb-1">
          Because capacity grows <em>geometrically</em>, those expensive copies get rarer as the list
          grows. Spread the cost across all appends and each one averages out to O(1) — this is called{" "}
          <span className="text-ink">amortized</span> O(1). CPython's actual growth rule:
        </p>
        <CodeBlock
          title="CPython · listobject.c (list_resize)"
          code={`# new capacity when the array is full:
new_allocated = newsize + (newsize >> 3) + (3 if newsize < 9 else 6)
# growth sequence: 0, 4, 8, 16, 25, 35, 46, 58, 72, 88, ...
# ~1.125x each time — gentler than the "double it" you may have learned`}
        />
        <Callout kind="tip" title="Interview line">
          "Append is amortized O(1) because the array over-allocates and grows geometrically, so the
          O(n) resize happens only O(log n) times across n appends — the copies sum to O(n) total."
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "x[i] (index)", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Direct address: base + i × itemsize." },
            { op: "append(x)", avg: "O(1)", avgTone: "good", worst: "O(n)", worstTone: "bad", why: "Amortized O(1); worst case is the resize+copy." },
            { op: "pop()", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Just drop the last slot." },
            { op: "insert(0, x) / pop(0)", avg: "O(n)", avgTone: "bad", worst: "O(n)", worstTone: "bad", why: "Every later element shifts by one." },
            { op: "x in list", avg: "O(n)", avgTone: "bad", worst: "O(n)", worstTone: "bad", why: "Linear scan — no ordering to exploit." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Front operations are silently O(n)">
          <code className="font-mono">list.insert(0, x)</code> and <code className="font-mono">list.pop(0)</code>{" "}
          look innocent but shift the whole array. Need a fast front? Use{" "}
          <code className="font-mono">collections.deque</code>.
        </Callout>
        <Callout kind="warn" title="Slicing copies">
          <code className="font-mono">a[1:]</code> builds a brand-new list — O(n) time and memory. In a
          loop that's a hidden O(n²). Pass indices around instead.
        </Callout>
        <Callout kind="tip" title="Pre-size when you can">
          If you know the size, <code className="font-mono">[None] * n</code> avoids repeated growth.
          Building a result list with append + <code className="font-mono">"".join</code> beats string
          concatenation in a loop.
        </Callout>
      </Block>
    </>
  );
}

function LinkedList() {
  return (
    <>
      <Lede>
        Nodes scattered in memory, each pointing to the next. You trade the array's instant indexing
        for O(1) insert/delete <em>once you're holding the right node</em> — no shifting required.
      </Lede>

      <Try><LinkedListViz /></Try>

      <Block eyebrow="under the hood" title="It's pointers all the way down">
        <p className="text-ink-dim leading-relaxed mb-1">
          There's no contiguous block and no index arithmetic. To reach the 5th node you must follow 5
          pointers — that's why random access is O(n). The payoff: splicing a node in or out is just a
          couple of pointer reassignments.
        </p>
        <CodeBlock
          title="python"
          code={`class Node:
    def __init__(self, val, nxt=None):
        self.val = val
        self.next = nxt

# insert 'node' after 'prev' — O(1), no shifting:
node.next = prev.next
prev.next = node

# delete the node after 'prev' — O(1):
prev.next = prev.next.next`}
        />
        <Callout kind="tip" title="The sentinel / dummy-head trick">
          Start with <code className="font-mono">dummy = Node(0); dummy.next = head</code> and return{" "}
          <code className="font-mono">dummy.next</code>. It removes the "what if I delete the head?"
          special case from almost every list problem. Staff-level interviewers love seeing this.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "prepend (push front)", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Repoint head — no traversal." },
            { op: "append (no tail ptr)", avg: "O(n)", avgTone: "bad", worst: "O(n)", worstTone: "bad", why: "Must walk to the end. Keep a tail ptr → O(1)." },
            { op: "access by index", avg: "O(n)", avgTone: "bad", worst: "O(n)", worstTone: "bad", why: "Follow pointers one by one." },
            { op: "insert / delete at node", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Rewire pointers — but O(n) to find the spot." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Lost-pointer bugs">
          When rewiring, grab <code className="font-mono">node.next</code> into a temp <em>before</em> you
          overwrite it, or you'll orphan the rest of the list.
        </Callout>
        <Callout kind="tip" title="Two-pointer toolkit">
          Reversing, cycle detection (Floyd's tortoise & hare), and finding the middle are all
          fast/slow pointer patterns. If a list problem feels stuck, reach for two pointers first.
        </Callout>
        <Callout kind="note" title="Reality check">
          In practice arrays win most of the time — cache locality makes contiguous memory far faster
          than chasing pointers. Linked lists shine in interview <em>logic</em>, less in real perf.
        </Callout>
      </Block>
    </>
  );
}

function StackQueue() {
  return (
    <>
      <Lede>
        Two restricted views over a sequence. A <strong>stack</strong> only touches one end (LIFO — last
        in, first out); a <strong>queue</strong> adds at one end and removes from the other (FIFO). The
        restriction <em>is</em> the feature — it makes the right algorithm obvious.
      </Lede>

      <Try><StackQueueViz /></Try>

      <Block eyebrow="under the hood" title="Pick the right backing store">
        <p className="text-ink-dim leading-relaxed mb-1">
          A Python <code className="font-mono">list</code> is a perfect stack — <code className="font-mono">append</code>{" "}
          and <code className="font-mono">pop</code> are both O(1) at the end. But it's a <em>terrible</em>{" "}
          queue, because <code className="font-mono">pop(0)</code> shifts everything (O(n)). For a queue,
          use a doubly-ended deque:
        </p>
        <CodeBlock
          title="python"
          code={`# Stack — just a list
stack = []
stack.append(x)      # push, O(1)
top = stack.pop()    # pop,  O(1)

# Queue — use a deque, NOT list.pop(0)
from collections import deque
q = deque()
q.append(x)          # enqueue, O(1)
front = q.popleft()  # dequeue, O(1)  ← the whole point`}
        />
        <Callout kind="trap" title="The #1 queue mistake">
          Using <code className="font-mono">list.pop(0)</code> as a dequeue. It's O(n), turning an O(n)
          BFS into O(n²). Always reach for <code className="font-mono">deque</code> for FIFO.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "stack push (list)", avg: "O(1)", avgTone: "good", worst: "O(n)", worstTone: "bad", why: "Amortized O(1); the worst case is the backing-array resize + copy." },
            { op: "stack pop (list)", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Just drops the last slot." },
            { op: "queue enqueue/dequeue (deque)", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Deque is O(1) at both ends." },
            { op: "queue via list.pop(0)", avg: "O(n)", avgTone: "bad", worst: "O(n)", worstTone: "bad", why: "Shifts every element — avoid." },
            { op: "peek (either)", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Look at one end, no removal." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="Where each one shows up">
        <Callout kind="tip" title="Stack = 'undo' / 'most recent'">
          Matching brackets, DFS, function call frames, expression evaluation, monotonic-stack problems
          (next greater element). If you hear "most recent" or "nesting", think stack.
        </Callout>
        <Callout kind="tip" title="Queue = 'fair order' / 'levels'">
          BFS, level-order traversal, task scheduling, sliding-window with a deque. If you hear "shortest
          path in an unweighted graph" or "process in order", think queue.
        </Callout>
      </Block>
    </>
  );
}

function HashTable() {
  return (
    <>
      <Lede>
        Python's <code className="text-ink font-mono">dict</code> and <code className="text-ink font-mono">set</code>.
        It turns a key into an array index via a hash function, giving you average <strong>O(1)</strong>{" "}
        lookup, insert, and delete. This single structure unlocks a huge share of interview problems.
      </Lede>

      <Try><HashTableViz /></Try>

      <Block eyebrow="under the hood" title="Hash → index → bucket">
        <p className="text-ink-dim leading-relaxed mb-1">
          Computing <code className="font-mono">hash(key) % num_buckets</code> jumps you straight to a slot
          — no scanning. Two keys can land in the same slot (a <em>collision</em>); the table resolves
          that, and when it gets too full it resizes and rehashes everything (amortized into O(1)).
        </p>
        <Callout kind="note" title="Chaining vs open addressing">
          The visualizer shows <strong>separate chaining</strong> (a list per bucket) because it's the
          clearest mental model. CPython actually uses <strong>open addressing</strong> with probing and a
          compact entry array — same Big-O, different mechanics.
        </Callout>
        <CodeBlock
          title="python"
          code={`seen = {}                 # dict: key -> value
seen[key] = value         # insert / update, O(1) avg
if key in seen: ...       # membership, O(1) avg
value = seen.get(key, 0)  # safe read with default

# the two-sum pattern — the canonical "hash map saves the day"
def two_sum(nums, target):
    seen = {}                       # value -> index
    for i, x in enumerate(nums):
        if target - x in seen:      # O(1) lookup
            return [seen[target - x], i]
        seen[x] = i`}
        />
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "insert / get / delete", avg: "O(1)", avgTone: "good", worst: "O(n)", worstTone: "bad", why: "Worst case = everything collides into one bucket." },
            { op: "x in dict / set", avg: "O(1)", avgTone: "good", worst: "O(n)", worstTone: "bad", why: "Same — average O(1), pathological O(n)." },
            { op: "iterate all keys", avg: "O(n)", avgTone: "ok", worst: "O(n)", worstTone: "ok", why: "Visit every entry once." },
            { op: "resize (rehash)", avg: "O(n)", avgTone: "bad", worst: "O(n)", worstTone: "bad", why: "Rare; amortized away across inserts." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="tip" title="Reach for it on 'have I seen…?'">
          Deduplication, counting (<code className="font-mono">collections.Counter</code>), grouping
          (<code className="font-mono">defaultdict(list)</code>), and trading space for time to drop an
          O(n²) nested loop down to O(n). This is the most common optimization in interviews.
        </Callout>
        <Callout kind="trap" title="Keys must be hashable & immutable">
          You can't key on a <code className="font-mono">list</code> or <code className="font-mono">dict</code>.
          Use a <code className="font-mono">tuple</code> (e.g. for grid coordinates{" "}
          <code className="font-mono">(r, c)</code>) or <code className="font-mono">frozenset</code>.
        </Callout>
        <Callout kind="warn" title="'O(1)' assumes a good hash">
          Average-case O(1) relies on keys spreading evenly. Adversarial inputs can force collisions and
          O(n) — relevant in security contexts, rarely in interviews.
        </Callout>
      </Block>
    </>
  );
}

function BST() {
  return (
    <>
      <Lede>
        A tree that keeps order: for every node, everything on the left is smaller and everything on the
        right is larger. That invariant lets you discard half the remaining nodes at each step — search,
        insert, and delete are all O(height).
      </Lede>

      <Try><BSTViz /></Try>

      <Block eyebrow="under the hood" title="The invariant does the work">
        <p className="text-ink-dim leading-relaxed mb-1">
          Searching compares the target to the current node and walks left or right — never both. If the
          tree is <em>balanced</em>, height ≈ log₂(n), so you touch only a handful of nodes. An{" "}
          <strong>in-order traversal</strong> visits values in sorted order — a defining property.
        </p>
        <CodeBlock
          title="python"
          code={`def search(node, target):
    while node:
        if target == node.val:
            return node
        node = node.left if target < node.val else node.right
    return None          # O(h): h ≈ log n balanced, n if skewed

def inorder(node):       # yields values in SORTED order
    if node:
        yield from inorder(node.left)
        yield node.val
        yield from inorder(node.right)`}
        />
        <Callout kind="tip" title="Deletion: the case everyone fumbles">
          Search and insert are easy; <strong>delete</strong> has three cases. A <em>leaf</em>: just remove
          it. <em>One child</em>: splice the child up into its place. <em>Two children</em>: you can't just
          yank the node — replace its value with its <strong>in-order successor</strong> (the minimum of the
          right subtree), then delete that successor, which by definition has at most one child.
        </Callout>
        <CodeBlock
          title="python · BST delete"
          code={`def delete(root, key):
    if not root:
        return None
    if key < root.val:
        root.left = delete(root.left, key)
    elif key > root.val:
        root.right = delete(root.right, key)
    else:                                # found it
        if not root.left:  return root.right   # leaf or right-only
        if not root.right: return root.left    # left-only
        succ = root.right
        while succ.left:                 # in-order successor = min of right subtree
            succ = succ.left
        root.val = succ.val
        root.right = delete(root.right, succ.val)
    return root`}
        />
        <Callout kind="trap" title="Unbalanced = degenerate">
          Insert already-sorted data and the BST becomes a straight line — a linked list in disguise, with
          O(n) operations. Press <strong>"insert sorted"</strong> in the demo to watch it skew. Production
          code uses <em>self-balancing</em> trees (red-black, AVL) to guarantee O(log n).
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "search / insert / delete", avg: "O(log n)", avgTone: "good", worst: "O(n)", worstTone: "bad", why: "O(h); balanced ⇒ log n, skewed ⇒ n." },
            { op: "min / max", avg: "O(log n)", avgTone: "good", worst: "O(n)", worstTone: "bad", why: "Walk all the way left / right." },
            { op: "in-order traversal", avg: "O(n)", avgTone: "ok", worst: "O(n)", worstTone: "ok", why: "Visit every node; yields sorted order." },
            { op: "predecessor / successor", avg: "O(log n)", avgTone: "good", worst: "O(n)", worstTone: "bad", why: "One step in the ordering." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="tip" title="Python rarely needs a hand-rolled BST">
          For "sorted + fast lookup" reach for <code className="font-mono">sortedcontainers.SortedList</code>{" "}
          (O(log n) insert/search). Use a real BST mainly when the interviewer asks for tree mechanics.
        </Callout>
        <Callout kind="tip" title="BST vs hash table">
          Hash table: faster (O(1)) but unordered. BST: O(log n) but gives you sorted order, range
          queries, and nearest-smaller/larger. Choose based on whether you need <em>ordering</em>.
        </Callout>
      </Block>
    </>
  );
}

function Heap() {
  return (
    <>
      <Lede>
        A heap answers one question fast: "what's the smallest (or largest) thing right now?" It's a
        binary tree with a simple rule — every parent beats its children — cleverly packed into a flat
        array with no pointers at all.
      </Lede>

      <Try><HeapViz /></Try>

      <Block eyebrow="under the hood" title="A tree stored as an array">
        <p className="text-ink-dim leading-relaxed mb-1">
          Index math replaces pointers: node <code className="font-mono">i</code>'s children are{" "}
          <code className="font-mono">2i+1</code> and <code className="font-mono">2i+2</code>, its parent is{" "}
          <code className="font-mono">(i-1)//2</code>. Insert appends then <em>sifts up</em>; extract moves
          the last element into the root then <em>sifts down</em> — each O(log n) because the tree is
          always balanced.
        </p>
        <CodeBlock
          title="python · heapq (min-heap)"
          code={`import heapq
h = []
heapq.heappush(h, 5)        # O(log n)
heapq.heappush(h, 2)
smallest = heapq.heappop(h) # O(log n) -> 2
peek = h[0]                 # smallest, O(1), no removal

# max-heap trick: negate the values
heapq.heappush(h, -x)
largest = -heapq.heappop(h)

# top-K largest in O(n log k):
heapq.nlargest(k, nums)`}
        />
        <Callout kind="tip" title="Build a heap in O(n), not O(n log n)">
          <code className="font-mono">heapq.heapify(arr)</code> turns a list into a heap in <strong>O(n)</strong>{" "}
          — faster than n individual pushes. A classic "did you know the tighter bound?" follow-up.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "peek min/max (h[0])", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Always at the root / index 0." },
            { op: "push", avg: "O(log n)", avgTone: "good", worst: "O(log n)", worstTone: "good", why: "Sift up at most the tree's height." },
            { op: "pop (extract)", avg: "O(log n)", avgTone: "good", worst: "O(log n)", worstTone: "good", why: "Sift down at most the height." },
            { op: "heapify(list)", avg: "O(n)", avgTone: "ok", worst: "O(n)", worstTone: "ok", why: "Bottom-up build beats n pushes." },
            { op: "search arbitrary value", avg: "O(n)", avgTone: "bad", worst: "O(n)", worstTone: "bad", why: "No ordering between siblings — scan all." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="When to reach for a heap">
        <Callout kind="tip" title="The 'top-K' / 'K-th' signal">
          "K largest", "K closest", "median of a stream", "merge K sorted lists", Dijkstra's shortest
          path — all heaps. Keep a heap of size K to solve top-K in O(n log k) and O(k) space.
        </Callout>
        <Callout kind="trap" title="heapq is a MIN-heap only">
          Python has no max-heap. Negate values (or wrap in a tuple with a negated key). Forgetting this
          is the most common heap bug in interviews.
        </Callout>
        <Callout kind="warn" title="Don't index into a heap expecting order">
          Only <code className="font-mono">h[0]</code> is meaningful. The rest of the array is{" "}
          <em>partially</em> ordered — it is not sorted.
        </Callout>
      </Block>
    </>
  );
}

function Trie() {
  return (
    <>
      <Lede>
        A tree keyed on <em>characters</em>, not whole values. Each path from the root spells out a prefix,
        and every word shares the nodes for its prefix with every other word that starts the same way. That
        sharing is the whole point: lookup and prefix queries cost <strong>O(L)</strong> — the length of the
        word — completely independent of how many words you've stored.
      </Lede>

      <Try><TrieViz /></Try>

      <Block eyebrow="under the hood" title="One node per character, prefixes are shared">
        <p className="text-ink-dim leading-relaxed mb-1">
          Insert walks down from the root following one edge per character, creating nodes that don't exist
          yet, and marks the final node as the <em>end of a word</em>. Searching does the same walk: if any
          edge is missing, the word (or prefix) isn't there. Because <code className="font-mono">"car"</code>,{" "}
          <code className="font-mono">"card"</code>, and <code className="font-mono">"care"</code> reuse the
          shared <code className="font-mono">c → a → r</code> spine, a trie is also a natural compressor of
          common prefixes. The <code className="font-mono">end</code> flag is essential — without it you can't
          tell a stored word from a mere prefix of a longer one (<code className="font-mono">"car"</code> vs.
          the prefix inside <code className="font-mono">"card"</code>).
        </p>
        <CodeBlock
          title="python"
          code={`class TrieNode:
    def __init__(self):
        self.children = {}     # char -> TrieNode
        self.end = False       # is a complete word ending here?

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):          # O(L)
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.end = True

    def search(self, word):          # exact word — O(L)
        node = self._walk(word)
        return node is not None and node.end

    def starts_with(self, prefix):   # any word with this prefix — O(L)
        return self._walk(prefix) is not None

    def _walk(self, s):
        node = self.root
        for ch in s:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node`}
        />
        <Callout kind="trap" title="search vs. starts_with">
          They walk identically, but <code className="font-mono">search</code> must additionally check{" "}
          <code className="font-mono">node.end</code>. Returning <code className="font-mono">True</code> for{" "}
          <code className="font-mono">"car"</code> just because the path exists (it's a prefix of{" "}
          <code className="font-mono">"card"</code>) is the classic trie bug.
        </Callout>
      </Block>

      <Block eyebrow="autocomplete" title="Collecting completions under a prefix">
        <p className="text-ink-dim leading-relaxed mb-1">
          The reason tries power autocomplete: once you've walked to the prefix node in O(L), every word that
          starts with that prefix lives in the subtree beneath it. A DFS that gathers nodes marked{" "}
          <code className="font-mono">end</code> yields exactly the completions — and never touches an
          unrelated branch.
        </p>
        <CodeBlock
          title="python"
          code={`def completions(self, prefix):
    node = self._walk(prefix)
    if node is None:
        return []
    out = []
    def dfs(node, path):
        if node.end:
            out.append(prefix + path)
        for ch in sorted(node.children):     # deterministic order
            dfs(node.children[ch], path + ch)
    dfs(node, "")
    return out

# completions("ca") on {cat, car, card, dog} -> ["car", "card", "cat"]`}
        />
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "insert(word)", avg: "O(L)", avgTone: "good", worst: "O(L)", worstTone: "good", why: "One step per character; L = word length, independent of word count." },
            { op: "search(word)", avg: "O(L)", avgTone: "good", worst: "O(L)", worstTone: "good", why: "Same walk; then check the end flag." },
            { op: "starts_with(prefix)", avg: "O(L)", avgTone: "good", worst: "O(L)", worstTone: "good", why: "Walk the prefix; existence of the node is the answer." },
            { op: "completions(prefix)", avg: "O(L + m)", avgTone: "ok", worst: "O(L + m)", worstTone: "ok", why: "Walk to the node (L), then emit m = total characters emitted across all matches." },
            { op: "space", avg: "O(N·L)", avgTone: "ok", worst: "O(N·L)", worstTone: "ok", why: "Up to N×L nodes (one per character, shared across common prefixes); the dict per node stores only real children. A fixed Σ-sized array per node would add a ×Σ factor." },
          ]}
          cols={["Operation", "Average", "Worst", "Why"]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="When to reach for a trie">
        <Callout kind="tip" title="The 'prefix' / 'dictionary' signal">
          Autocomplete, longest-common-prefix, word-search / Boggle, spell-check, IP routing (bitwise tries),
          and "given a stream of words, answer prefix queries" all scream trie. If the question is about{" "}
          <em>prefixes</em> rather than whole-key equality, a hash set won't help — a trie will.
        </Callout>
        <Callout kind="warn" title="Memory is the real cost">
          A hash set of words is far more compact when prefixes rarely overlap. The trie wins only when you
          need prefix operations or the shared-prefix compression actually pays off. Trade space for the O(L)
          prefix superpower deliberately.
        </Callout>
        <Callout kind="note" title="Interview line">
          "A trie gives O(L) insert/search/prefix where L is the word length — independent of the number of
          stored words — by sharing one node per character along common prefixes. The cost is O(N·L) space."
        </Callout>
      </Block>
    </>
  );
}

function Graph() {
  return (
    <>
      <Lede>
        Nodes (vertices) connected by edges — the most general structure here, and the one most interview
        problems quietly reduce to (grids, dependencies, networks, states). The two questions that unlock
        almost everything: <em>how do I store it</em>, and <em>how do I traverse it</em> — breadth-first or
        depth-first.
      </Lede>

      <Try><GraphViz /></Try>

      <Block eyebrow="representation" title="Adjacency list vs. adjacency matrix">
        <p className="text-ink-dim leading-relaxed mb-1">
          An <strong>adjacency list</strong> maps each node to its neighbours — compact for the sparse graphs
          you see in practice, and the default for traversals. An <strong>adjacency matrix</strong> is a
          V×V grid of booleans: O(1) "is there an edge u→v?" but O(V²) memory whether or not the graph is
          dense. Use a list for sparse graphs and traversals; a matrix when the graph is dense or you need
          constant-time edge lookups.
        </p>
        <CodeBlock
          title="python"
          code={`from collections import defaultdict, deque

# Adjacency list — the workhorse. Build once: O(V + E).
adj = defaultdict(list)
for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)     # omit this line for a DIRECTED graph

# Adjacency matrix — O(V^2) space, O(1) edge test.
M = [[0] * V for _ in range(V)]
for u, v in edges:
    M[u][v] = M[v][u] = 1`}
        />
        <OpTable
          rows={[
            { op: "space", avg: "O(V + E)", avgTone: "ok", worst: "O(V²)", worstTone: "bad", why: "List grows with edges; matrix is always V×V." },
            { op: "has edge u→v?", avg: "O(deg u)", avgTone: "ok", worst: "O(1)", worstTone: "good", why: "List scans u's neighbours; matrix is a direct lookup." },
            { op: "iterate u's neighbours", avg: "O(deg u)", avgTone: "good", worst: "O(V)", worstTone: "ok", why: "List gives exactly the neighbours; matrix scans a whole row." },
          ]}
          cols={["Operation", "Adjacency list", "Adjacency matrix", "Why"]}
        />
      </Block>

      <Block eyebrow="traversal" title="BFS = queue = shortest path (unweighted)">
        <p className="text-ink-dim leading-relaxed mb-1">
          BFS explores in rings of increasing distance using a <strong>FIFO queue</strong>. The moment you
          first dequeue the target, you've reached it by the fewest edges — so BFS is <em>the</em> shortest-path
          algorithm for unweighted graphs. The critical detail: mark a node <strong>visited when you enqueue
          it</strong>, not when you dequeue it, or you'll add the same node to the queue many times.
        </p>
        <CodeBlock
          title="python · BFS"
          code={`def bfs(adj, start):
    visited = {start}
    queue = deque([start])
    order = []
    while queue:
        node = queue.popleft()      # FIFO
        order.append(node)
        for nb in adj[node]:
            if nb not in visited:
                visited.add(nb)     # mark on ENQUEUE — key detail
                queue.append(nb)
    return order

# Shortest #edges from start to every node, same loop:
def shortest_layers(adj, start):
    dist = {start: 0}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for nb in adj[node]:
            if nb not in dist:
                dist[nb] = dist[node] + 1
                queue.append(nb)
    return dist`}
        />
        <Callout kind="trap" title="Mark visited on enqueue, not dequeue">
          If you only mark a node visited when you pop it, it can be enqueued multiple times before it's first
          processed — blowing up to O(V²) and even breaking the shortest-distance guarantee. Add to{" "}
          <code className="font-mono">visited</code> the instant you push.
        </Callout>
      </Block>

      <Block eyebrow="traversal" title="DFS = stack / recursion">
        <p className="text-ink-dim leading-relaxed mb-1">
          DFS dives down one branch as far as it can, then backtracks. The call stack <em>is</em> the data
          structure — or make it explicit with a list-as-stack to avoid Python's recursion limit on deep
          graphs. DFS doesn't find shortest paths, but it's the tool for cycle detection, topological sort,
          connected components, and "explore every reachable state".
        </p>
        <CodeBlock
          title="python · DFS"
          code={`# Recursive — the call stack does the bookkeeping.
def dfs(adj, node, visited, order):
    visited.add(node)
    order.append(node)
    for nb in adj[node]:
        if nb not in visited:
            dfs(adj, nb, visited, order)
    return order

# Iterative — explicit stack, safe on deep graphs.
def dfs_iter(adj, start):
    visited, order = set(), []
    stack = [start]
    while stack:
        node = stack.pop()          # LIFO
        if node in visited:
            continue
        visited.add(node)
        order.append(node)
        for nb in reversed(adj[node]):  # reversed → matches recursion order
            if nb not in visited:
                stack.append(nb)
    return order`}
        />
        <Callout kind="note" title="Iterative DFS visitation order">
          With an explicit stack you push neighbours and pop LIFO, so to visit them in the same order as the
          recursive version you push them <em>reversed</em>. A node can sit on the stack twice via different
          paths — that's why the loop re-checks <code className="font-mono">visited</code> after popping.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "BFS (adjacency list)", avg: "O(V + E)", avgTone: "ok", worst: "O(V + E)", worstTone: "ok", why: "Each vertex enqueued once, each edge examined once." },
            { op: "DFS (adjacency list)", avg: "O(V + E)", avgTone: "ok", worst: "O(V + E)", worstTone: "ok", why: "Visit every vertex once, traverse every edge once." },
            { op: "BFS / DFS (matrix)", avg: "O(V²)", avgTone: "bad", worst: "O(V²)", worstTone: "bad", why: "Scanning a full row per vertex costs V per node." },
            { op: "shortest path (unweighted)", avg: "O(V + E)", avgTone: "ok", worst: "O(V + E)", worstTone: "ok", why: "Plain BFS — first dequeue of the target is optimal." },
          ]}
          cols={["Operation", "Average", "Worst", "Why"]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="Picking the right traversal">
        <Callout kind="tip" title="BFS when distance matters">
          Shortest path in an unweighted graph, level-order, "minimum number of steps/moves", flood fill by
          rings. If you hear "fewest" or "nearest", reach for BFS and a queue. For <em>weighted</em> shortest
          paths, BFS isn't enough — that's Dijkstra (BFS with a heap).
        </Callout>
        <Callout kind="tip" title="DFS when structure matters">
          Cycle detection, topological sort (DAGs), connected components, "does a path exist", backtracking
          over a state graph. The recursion stack often makes the logic shorter than an explicit queue.
        </Callout>
        <Callout kind="trap" title="Always track visited">
          Most interview graphs have cycles. Forget the <code className="font-mono">visited</code> set and BFS
          or DFS loops forever. Grids count too: treat each cell as a node with up/down/left/right edges.
        </Callout>
        <Callout kind="note" title="Interview line">
          "Both BFS and DFS are O(V+E) on an adjacency list — every vertex and edge is touched once. BFS uses a
          queue and gives shortest paths in unweighted graphs; DFS uses a stack/recursion and suits cycle
          detection and topological sort."
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  "dynamic-array": <DynamicArray />,
  "linked-list": <LinkedList />,
  "stack-queue": <StackQueue />,
  "hash-table": <HashTable />,
  bst: <BST />,
  heap: <Heap />,
  trie: <Trie />,
  graph: <Graph />,
};

export default function DsaLab() {
  const [active, setActive] = useState("dynamic-array");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Structures · the WHAT"
      title="DSA · LAB"
      subtitle="Animated data structures with their real Python internals. Poke each one until the cost model feels obvious — then the interview questions about them stop being scary."
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
