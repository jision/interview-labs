import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag, ComplexityTag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import SlidingWindowViz from "./interview/SlidingWindowViz.jsx";
import TwoPointersViz from "./interview/TwoPointersViz.jsx";
import BinarySearchViz from "./interview/BinarySearchViz.jsx";
import MonotonicStackViz from "./interview/MonotonicStackViz.jsx";

const ACCENT = "#e8553b";

const TOPICS = [
  { id: "two-pointers", label: "Two Pointers", group: "Scan" },
  { id: "sliding-window", label: "Sliding Window", group: "Scan" },
  { id: "fast-slow", label: "Fast & Slow Pointers", group: "Scan" },
  { id: "binary-search", label: "Binary Search", group: "Search" },
  { id: "bfs", label: "BFS", group: "Traverse" },
  { id: "dfs", label: "DFS", group: "Traverse" },
  { id: "backtracking", label: "Backtracking", group: "Traverse" },
  { id: "dp", label: "Dynamic Programming", group: "Optimize" },
  { id: "greedy", label: "Greedy", group: "Optimize" },
  { id: "heap", label: "Heap / Top-K", group: "Structure-driven" },
  { id: "monotonic-stack", label: "Monotonic Stack", group: "Structure-driven" },
  { id: "intervals", label: "Intervals", group: "Structure-driven" },
];

const { Block, Try } = withAccent(ACCENT);

/* small helper so prose code reads cleanly */
function C({ children }) {
  return <code className="font-mono text-ink">{children}</code>;
}

/* ───────────────────────────── Two Pointers ─────────────────────────── */
function TwoPointers() {
  return (
    <>
      <Lede>
        Two indices walking the same array — usually from opposite ends, sometimes both forward at
        different speeds. The win is dropping a brute-force O(n²) pair search to a single O(n) pass by
        exploiting <em>order</em>: each move provably eliminates a candidate you never have to revisit.
      </Lede>

      <Try>
        <TwoPointersViz />
      </Try>

      <Block eyebrow="the template" title="Converging pointers on a sorted array">
        <p className="text-ink-dim leading-relaxed mb-1">
          The canonical shape: a sorted array, a left pointer at the start, a right pointer at the end,
          moving the one that brings the running quantity toward the target. The sortedness is what makes
          the &quot;which pointer do I move?&quot; decision unambiguous.
        </p>
        <CodeBlock
          title="python · pair sum in a sorted array"
          code={`def two_sum_sorted(nums, target):
    l, r = 0, len(nums) - 1
    while l < r:
        s = nums[l] + nums[r]
        if s == target:
            return [l, r]
        if s < target:      # too small -> need a bigger left value
            l += 1
        else:               # too big   -> need a smaller right value
            r -= 1
    return []               # pointers crossed: no pair`}
        />
        <CodeBlock
          title="python · in-place dedupe (fast/slow, same direction)"
          code={`def remove_dups(nums):            # sorted array, keep one of each
    slow = 0                      # write head
    for fast in range(len(nums)): # read head
        if fast == 0 or nums[fast] != nums[fast - 1]:
            nums[slow] = nums[fast]
            slow += 1
    return slow                   # new length`}
        />
        <Callout kind="tip" title="Reach for this when you see…">
          a <strong>sorted</strong> array (or one you can sort) and a need to find a{" "}
          <strong>pair / triplet</strong> with some property; &quot;is there a pair summing to X&quot;;
          partitioning in place; reversing or comparing from both ends (palindrome check); merging two
          sorted arrays; or &quot;remove/move elements in place with O(1) extra space&quot;.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "two-end scan (sorted in)", avg: "O(n)", avgTone: "ok", worst: "O(n)", worstTone: "ok", why: "Each pointer moves inward at most n times total." },
            { op: "+ sorting first", avg: "O(n log n)", avgTone: "bad", worst: "O(n log n)", worstTone: "bad", why: "The sort dominates the linear scan." },
            { op: "3-sum (outer loop + 2-ptr)", avg: "O(n²)", avgTone: "bad", worst: "O(n²)", worstTone: "bad", why: "n anchors, each an O(n) inner scan." },
            { op: "extra space", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Just two indices — the in-place selling point." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Two pointers needs ORDER">
          On an <em>unsorted</em> array, &quot;move the smaller one in&quot; is meaningless — you can skip
          the answer. If you can&apos;t sort (e.g. you must return original indices), use a hash map
          instead. Sorting also destroys original indices, so capture them first if you need them.
        </Callout>
        <Callout kind="trap" title="Skip duplicates in 3-sum">
          After fixing an anchor or finding a pair, advance past equal values
          (<C>while l &lt; r and nums[l] == nums[l-1]: l += 1</C>) or you&apos;ll emit duplicate triplets.
        </Callout>
      </Block>
    </>
  );
}

/* ───────────────────────────── Sliding Window ───────────────────────── */
function SlidingWindow() {
  return (
    <>
      <Lede>
        A contiguous window <C>[l, r]</C> that slides across the array while you maintain a running
        aggregate (sum, count, a frequency map). Instead of recomputing each subarray from scratch
        (O(n²)), you update the aggregate incrementally as the window&apos;s edges move — one O(n) pass.
      </Lede>

      <Try>
        <SlidingWindowViz />
      </Try>

      <Block eyebrow="the template" title="Two shapes: fixed size and variable size">
        <CodeBlock
          title="python · fixed-size window (max sum of length k)"
          code={`def max_sum_k(nums, k):
    s = sum(nums[:k])                 # first window
    best = s
    for r in range(k, len(nums)):
        s += nums[r] - nums[r - k]    # add new, drop old: O(1) slide
        best = max(best, s)
    return best`}
        />
        <CodeBlock
          title="python · variable window (longest substring, no repeats)"
          code={`def longest_unique(s):
    seen = {}                  # char -> last index
    l = best = 0
    for r, ch in enumerate(s):
        if ch in seen and seen[ch] >= l:
            l = seen[ch] + 1   # shrink: jump left past the duplicate
        seen[ch] = r
        best = max(best, r - l + 1)
    return best`}
        />
        <p className="text-ink-dim leading-relaxed mb-1">
          The variable-size pattern is the more powerful one: <strong>extend</strong> the right edge
          greedily, and whenever the window violates a constraint, <strong>shrink</strong> from the left
          until it&apos;s valid again. Every index enters and leaves the window at most once → O(n) even
          though there&apos;s a nested loop.
        </p>
        <Callout kind="tip" title="Reach for this when you see…">
          &quot;contiguous subarray / substring&quot; plus &quot;longest / shortest / max / min / at
          most K / exactly K&quot;; &quot;sum / average of every length-k window&quot;; or anything where a
          brute-force answer enumerates all subarrays. The word <strong>contiguous</strong> is the tell —
          if order can be rearranged, it&apos;s probably not a window.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-2">
          <ComplexityTag tone="ok" label="time">O(n)</ComplexityTag>
          <ComplexityTag tone="good" label="space (sum/count)">O(1)</ComplexityTag>
          <ComplexityTag tone="ok" label="space (freq map)">O(k) distinct</ComplexityTag>
        </div>
        <p className="text-ink-dim leading-relaxed text-sm">
          Both edges only move forward, so the total work is 2n pointer steps, not n×n. The &quot;exactly
          K distinct&quot; variant is computed as <C>atMost(K) − atMost(K−1)</C>, two linear passes.
        </p>
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="The shrink condition is the whole problem">
          A <C>while</C> (shrink until valid), not an <C>if</C>, is usually what you need — one new right
          element can force several left moves. Getting the invariant (&quot;the window is always
          valid after the inner loop&quot;) precise is where bugs live.
        </Callout>
        <Callout kind="trap" title="Negative numbers break the monotonic assumption">
          &quot;Shortest subarray with sum ≥ target&quot; is a clean window <em>only</em> when all values
          are non-negative (growing the window grows the sum). With negatives, the sum isn&apos;t
          monotonic — you need a prefix-sum + monotonic deque instead.
        </Callout>
      </Block>
    </>
  );
}

/* ───────────────────────────── Fast & Slow ──────────────────────────── */
function FastSlow() {
  return (
    <>
      <Lede>
        Two pointers traversing a linked list (or implicit sequence) at different speeds — slow moves one
        step, fast moves two. Floyd&apos;s &quot;tortoise and hare&quot; detects cycles, finds the middle,
        and locates a cycle&apos;s entry, all in O(1) extra space.
      </Lede>

      <Block eyebrow="the template" title="Cycle detect, find middle, find cycle start">
        <CodeBlock
          title="python · cycle detection (Floyd)"
          code={`def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next          # +1
        fast = fast.next.next     # +2
        if slow is fast:          # they meet -> cycle
            return True
    return False                  # fast hit None -> no cycle`}
        />
        <CodeBlock
          title="python · find the middle node (slow lands at mid)"
          code={`def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow      # on even length, this is the 2nd of the two middles`}
        />
        <CodeBlock
          title="python · find cycle entry (Floyd, phase 2)"
          code={`def cycle_start(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:                  # meeting point inside the loop
            slow = head                   # reset one pointer to the head
            while slow is not fast:       # advance both at +1
                slow, fast = slow.next, fast.next
            return slow                   # entry node
    return None`}
        />
        <Callout kind="tip" title="Reach for this when you see…">
          a linked list and &quot;does it have a cycle&quot; / &quot;where does the cycle start&quot;;
          &quot;find the middle&quot; in one pass; &quot;nth from the end&quot; (gap of n, then walk
          together); &quot;happy number&quot; (cycle detection on a number sequence); or any
          O(1)-space requirement on a sequence you can only walk forward.
        </Callout>
      </Block>

      <Block eyebrow="why the math works" title="Phase 2 in one line">
        <p className="text-ink-dim leading-relaxed text-sm mb-1">
          Let the tail (head → cycle entry) have length <C>a</C>, and the meeting point be <C>b</C> steps
          into the loop of length <C>c</C>. When they meet, slow has walked <C>a + b</C> and fast{" "}
          <C>2(a + b)</C>, and fast is an integer number of loops ahead, so <C>a + b = k·c</C>. Therefore{" "}
          <C>a = k·c − b</C>: starting one pointer at the head and one at the meeting point, both at speed
          +1, they collide exactly at the entry after <C>a</C> steps.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <ComplexityTag tone="ok" label="time">O(n)</ComplexityTag>
          <ComplexityTag tone="good" label="space">O(1)</ComplexityTag>
        </div>
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Null-check fast AND fast.next">
          The loop guard must be <C>while fast and fast.next</C>. Skip either and a two-step jump
          dereferences <C>None</C> on an even-length or empty list.
        </Callout>
        <Callout kind="note" title="Hash-set works too — but loses the point">
          You can store visited nodes in a set for O(n) space. Interviewers reach for fast/slow because
          it&apos;s O(1) space; lead with that.
        </Callout>
      </Block>
    </>
  );
}

/* ───────────────────────────── Binary Search ────────────────────────── */
function BinarySearch() {
  return (
    <>
      <Lede>
        Halve the search space every step. Obvious on a sorted array (O(log n) lookup), but the real
        interview skill is <strong>binary search on the answer</strong>: when the answer is a number with
        a monotonic feasibility check, search the value range instead of the array.
      </Lede>

      <Try>
        <BinarySearchViz />
      </Try>

      <Block eyebrow="the template" title="Three forms you should have memorized">
        <CodeBlock
          title="python · exact match (inclusive bounds)"
          code={`def search(nums, target):
    lo, hi = 0, len(nums) - 1     # hi is INCLUSIVE
    while lo <= hi:               # <=, because lo==hi is a real candidate
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1          # +1 / -1 guarantees progress -> no infinite loop
        else:
            hi = mid - 1
    return -1`}
        />
        <CodeBlock
          title="python · leftmost insertion point (bisect_left)"
          code={`def lower_bound(nums, target):    # first index with nums[i] >= target
    lo, hi = 0, len(nums)         # hi EXCLUSIVE; half-open [lo, hi)
    while lo < hi:                # <, not <=
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid              # NOT mid-1: keep mid as a candidate
    return lo                     # == len(nums) if target exceeds every element`}
        />
        <CodeBlock
          title="python · binary search on the answer (min feasible value)"
          code={`def min_feasible(lo, hi, feasible):
    # feasible(x) is monotonic: False...False True...True
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid              # mid works; maybe smaller does too
        else:
            lo = mid + 1          # mid too small; go higher
    return lo                     # smallest x with feasible(x) == True`}
        />
        <p className="text-ink-dim leading-relaxed mb-1">
          The trickiest variant: a <strong>rotated</strong> sorted array. The array isn&apos;t globally
          ordered, but after any split at least one half still is — so compare against the{" "}
          <em>sorted</em> half to decide whether the target lives there, and recurse into the right side.
        </p>
        <CodeBlock
          title="python · search in a rotated sorted array"
          code={`def search_rotated(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:          # left half is sorted
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                              # right half is sorted
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1`}
        />
        <Callout kind="tip" title="Reach for this when you see…">
          a <strong>sorted</strong> array; &quot;find / insert position&quot;; &quot;first / last
          element satisfying P&quot;; a rotated sorted array; or — the high-value tell —{" "}
          &quot;minimize the maximum&quot; / &quot;maximize the minimum&quot; / &quot;smallest capacity,
          speed, or days such that it works&quot;. If you can write a monotonic <C>feasible(x)</C>, binary
          search the answer in O(log range) checks.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "search sorted array", avg: "O(log n)", avgTone: "good", worst: "O(log n)", worstTone: "good", why: "Range halves each iteration." },
            { op: "search on the answer", avg: "O(log R · C)", avgTone: "good", worst: "O(log R · C)", worstTone: "good", why: "R = value range, C = cost of one feasibility check." },
            { op: "rotated array search", avg: "O(log n)", avgTone: "good", worst: "O(log n)", worstTone: "good", why: "One half is always sorted; decide which." },
            { op: "space", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Iterative — no recursion stack." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Off-by-one = infinite loop or missed element">
          Pick a convention and stay consistent. Inclusive <C>hi = len-1</C> pairs with{" "}
          <C>while lo &lt;= hi</C> and <C>mid ± 1</C>. Half-open <C>hi = len</C> pairs with{" "}
          <C>while lo &lt; hi</C> and <C>hi = mid</C> (no −1). Mixing them loops forever or skips the
          target. The <C>+1</C> on the <C>lo</C> side is what guarantees the range strictly shrinks.
        </Callout>
        <Callout kind="trap" title="Just use bisect when you can">
          Python&apos;s <C>bisect_left</C> / <C>bisect_right</C> are battle-tested. Hand-roll only when the
          predicate isn&apos;t a plain comparison (rotated arrays, search-on-answer).
        </Callout>
        <Callout kind="note" title="Overflow note (not Python)">
          <C>(lo + hi) // 2</C> can overflow in fixed-width languages; the idiom there is{" "}
          <C>lo + (hi - lo) // 2</C>. Python ints are arbitrary precision, so it&apos;s moot — but say it
          if asked.
        </Callout>
      </Block>
    </>
  );
}

/* ───────────────────────────── BFS ──────────────────────────────────── */
function BFS() {
  return (
    <>
      <Lede>
        Explore level by level with a <strong>queue</strong>. On an <em>unweighted</em> graph, the first
        time BFS reaches a node it has found a <strong>shortest path</strong> there — that&apos;s its
        superpower over DFS. Mark nodes visited <em>when you enqueue them</em>, not when you dequeue.
      </Lede>

      <Block eyebrow="the template" title="Grid / graph BFS with level tracking">
        <CodeBlock
          title="python · shortest path in an unweighted graph"
          code={`from collections import deque

def bfs_shortest(start, target, neighbors):
    q = deque([start])
    dist = {start: 0}                 # visited set + distance in one dict
    while q:
        node = q.popleft()
        if node == target:
            return dist[node]
        for nxt in neighbors(node):
            if nxt not in dist:       # mark on ENQUEUE -> no double-visits
                dist[nxt] = dist[node] + 1
                q.append(nxt)
    return -1                         # unreachable`}
        />
        <CodeBlock
          title="python · level-by-level (e.g. tree level order)"
          code={`def level_order(root):
    if not root:
        return []
    q, out = deque([root]), []
    while q:
        level = []
        for _ in range(len(q)):       # snapshot this level's size
            node = q.popleft()
            level.append(node.val)
            for c in (node.left, node.right):
                if c:
                    q.append(c)
        out.append(level)
    return out`}
        />
        <Callout kind="tip" title="Reach for this when you see…">
          &quot;shortest path&quot; / &quot;fewest steps / moves&quot; in an <strong>unweighted</strong>{" "}
          graph or grid; &quot;minimum number of … &quot;; &quot;level order&quot; / &quot;by depth&quot;;
          &quot;nearest&quot; or multi-source spread (rotting oranges, walls-and-gates — seed the queue
          with all sources at once); or word-ladder style state graphs.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "BFS over graph", avg: "O(V + E)", avgTone: "ok", worst: "O(V + E)", worstTone: "ok", why: "Each vertex dequeued once, each edge scanned once." },
            { op: "BFS over m×n grid", avg: "O(m·n)", avgTone: "ok", worst: "O(m·n)", worstTone: "ok", why: "Each cell visited once; 4 (or 8) neighbors each." },
            { op: "queue space", avg: "O(V)", avgTone: "ok", worst: "O(V)", worstTone: "ok", why: "Worst case a whole level is in the queue." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Mark visited on enqueue, not dequeue">
          If you only mark when popping, a node can be added to the queue many times before it&apos;s
          processed → blowup and wrong distances. Set <C>dist[nxt]</C> (or <C>visited.add</C>) the moment
          you push it.
        </Callout>
        <Callout kind="trap" title="BFS shortest path needs UNIT weights">
          With varying edge weights, plain BFS is wrong — use Dijkstra (a heap). With weights in{" "}
          <C>{"{0, 1}"}</C> only, use <strong>0-1 BFS</strong> with a deque (push-front for 0, push-back
          for 1).
        </Callout>
      </Block>
    </>
  );
}

/* ───────────────────────────── DFS ──────────────────────────────────── */
function DFS() {
  return (
    <>
      <Lede>
        Go deep before wide, via recursion or an explicit stack. DFS shines for &quot;does a path
        exist&quot;, exhaustive exploration, connected components, topological sort, and cycle detection.
        It does <em>not</em> give shortest paths on its own — that&apos;s BFS&apos;s job.
      </Lede>

      <Block eyebrow="the template" title="Recursive DFS with a visited set">
        <CodeBlock
          title="python · graph DFS (recursive)"
          code={`def dfs(node, graph, visited):
    visited.add(node)
    # ... process node here (pre-order)
    for nxt in graph[node]:
        if nxt not in visited:
            dfs(nxt, graph, visited)

def count_components(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b); graph[b].append(a)
    visited, comps = set(), 0
    for v in range(n):
        if v not in visited:
            comps += 1
            dfs(v, graph, visited)
    return comps`}
        />
        <CodeBlock
          title="python · grid DFS (flood fill) + iterative form"
          code={`def num_islands(grid):
    R, C = len(grid), len(grid[0])
    def sink(r, c):
        if 0 <= r < R and 0 <= c < C and grid[r][c] == '1':
            grid[r][c] = '0'                  # mark visited in place
            sink(r+1, c); sink(r-1, c)
            sink(r, c+1); sink(r, c-1)
    count = 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == '1':
                count += 1; sink(r, c)
    return count

# iterative DFS — avoids recursion-depth limits on big inputs:
def dfs_iter(start, graph):
    stack, seen = [start], {start}
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt); stack.append(nxt)`}
        />
        <Callout kind="tip" title="Reach for this when you see…">
          &quot;does a path exist&quot;; &quot;number of connected components / islands&quot;; &quot;all
          paths from A to B&quot;; topological sort / course-schedule (cycle detection via 3-color or
          in-degree); tree traversals (pre/in/post-order); or any problem where you must fully explore one
          branch before backing out.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "DFS over graph", avg: "O(V + E)", avgTone: "ok", worst: "O(V + E)", worstTone: "ok", why: "Visit each vertex and edge once." },
            { op: "recursion stack", avg: "O(V)", avgTone: "ok", worst: "O(V)", worstTone: "ok", why: "Depth of the deepest path — a skewed graph is O(V)." },
            { op: "topological sort", avg: "O(V + E)", avgTone: "ok", worst: "O(V + E)", worstTone: "ok", why: "DFS post-order reversed, or Kahn's in-degree BFS." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Python recursion limit is ~1000">
          Deep grids / chains hit <C>RecursionError</C>. Either <C>sys.setrecursionlimit(...)</C> or
          convert to the iterative stack form for large inputs.
        </Callout>
        <Callout kind="trap" title="Directed-cycle detection needs three states">
          A plain visited set finds cycles in <em>undirected</em> graphs, but for directed graphs you need
          white / gray / black (unvisited / in-progress / done): a back-edge to a <em>gray</em> node is a
          cycle. Revisiting a <em>black</em> node is fine.
        </Callout>
      </Block>
    </>
  );
}

/* ───────────────────────────── Backtracking ─────────────────────────── */
function Backtracking() {
  return (
    <>
      <Lede>
        DFS over a tree of <em>choices</em>: pick an option, recurse, then <strong>undo the pick</strong>{" "}
        and try the next. It enumerates permutations, combinations, subsets, and constraint puzzles — and
        the difference between &quot;times out&quot; and &quot;passes&quot; is almost always{" "}
        <strong>pruning</strong> dead branches early.
      </Lede>

      <Block eyebrow="the template" title="The choose / explore / un-choose skeleton">
        <CodeBlock
          title="python · the universal backtracking shape"
          code={`def backtrack(path, choices, result):
    if is_complete(path):           # base case: a full solution
        result.append(path[:])      # COPY — path is mutated after this
        return
    for choice in choices:
        if not valid(path, choice): # prune: skip illegal / redundant branches
            continue
        path.append(choice)         # choose
        backtrack(path, next_choices(choices, choice), result)
        path.pop()                  # un-choose (backtrack)`}
        />
        <CodeBlock
          title="python · subsets, permutations, combinations"
          code={`def subsets(nums):                  # 2^n subsets
    res = []
    def bt(start, path):
        res.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            bt(i + 1, path)         # i+1: don't reuse earlier elements
            path.pop()
    bt(0, []); return res

def permutations(nums):             # n! orderings
    res, used = [], [False] * len(nums)
    def bt(path):
        if len(path) == len(nums):
            res.append(path[:]); return
        for i in range(len(nums)):
            if used[i]: continue
            used[i] = True;  path.append(nums[i])
            bt(path)
            path.pop();      used[i] = False
    bt([]); return res`}
        />
        <Callout kind="tip" title="Reach for this when you see…">
          &quot;generate / find <strong>all</strong>&quot; subsets, permutations, combinations, or
          partitions; constraint puzzles (N-queens, Sudoku, word search); &quot;does any arrangement
          satisfy …&quot;; or anything where the answer is a <em>set of sequences</em> and n is small
          (often n ≤ ~15–20, because the count is exponential).
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity — exponential, by design">
        <OpTable
          rows={[
            { op: "subsets", avg: "O(n · 2ⁿ)", avgTone: "bad", worst: "O(n · 2ⁿ)", worstTone: "bad", why: "2ⁿ subsets, O(n) to copy each." },
            { op: "permutations", avg: "O(n · n!)", avgTone: "bad", worst: "O(n · n!)", worstTone: "bad", why: "n! orderings, O(n) to copy each." },
            { op: "combinations C(n,k)", avg: "O(k · C(n,k))", avgTone: "bad", worst: "O(k · C(n,k))", worstTone: "bad", why: "One copy per chosen combination." },
            { op: "N-queens", avg: "—", avgTone: "bad", worst: "O(n!)", worstTone: "bad", why: "Pruning cuts the constant massively, not the class." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Append a COPY, not the live list">
          <C>result.append(path)</C> stores a reference that you then mutate with <C>path.pop()</C> —
          every entry ends up identical (usually empty). Use <C>path[:]</C> or <C>list(path)</C>.
        </Callout>
        <Callout kind="trap" title="Deduping needs sort + skip-equal-siblings">
          With duplicate inputs, sort first, then <C>if i &gt; start and nums[i] == nums[i-1]: continue</C>{" "}
          to skip generating the same branch twice. Forgetting this yields duplicate results.
        </Callout>
        <Callout kind="tip" title="Prune as early as possible">
          Check feasibility <em>before</em> recursing, not after. Constraint propagation (column/diagonal
          sets in N-queens, candidate elimination in Sudoku) is what turns &quot;TLE&quot; into
          &quot;accepted&quot;.
        </Callout>
      </Block>
    </>
  );
}

/* ───────────────────────────── Dynamic Programming ──────────────────── */
function DP() {
  return (
    <>
      <Lede>
        When a problem has <strong>overlapping subproblems</strong> and <strong>optimal
        substructure</strong>, cache subproblem answers so you solve each once. Every DP is three things:{" "}
        <strong>state</strong> (what uniquely describes a subproblem), <strong>transition</strong> (how
        states combine), and <strong>base case</strong>. Nail those three and the code writes itself.
      </Lede>

      <Block eyebrow="the framing" title="State · Transition · Base case">
        <p className="text-ink-dim leading-relaxed mb-1">
          Memoization (top-down): write the recurrence, slap <C>@lru_cache</C> on it. Tabulation
          (bottom-up): fill a table in dependency order. Same recurrence, same Big-O — tabulation avoids
          recursion overhead and lets you shrink space by keeping only the last row/few values.
        </p>
        <CodeBlock
          title="python · memoization is the fastest way to a correct DP"
          code={`from functools import lru_cache

@lru_cache(maxsize=None)
def solve(state):
    if base_case(state):
        return base_value
    return best(solve(next_state) ... for each choice)`}
        />
        <Callout kind="tip" title="Reach for this when you see…">
          &quot;count the number of ways&quot;; &quot;min / max cost / length / profit&quot;; &quot;can you
          reach / make / partition&quot;; choices that <em>compound</em> over steps; or a brute-force
          recursion that recomputes the same arguments. If subproblems repeat → memoize.
        </Callout>
      </Block>

      <Block eyebrow="DP atlas · 1D" title="Linear DP — one moving index">
        <CodeBlock
          title="python · climbing stairs  &  house robber"
          code={`# Climbing stairs: ways to reach step n taking 1 or 2 at a time.
#   state:  dp[i] = ways to reach step i
#   transition:  dp[i] = dp[i-1] + dp[i-2]   (it's Fibonacci)
#   base:  dp[0] = 1, dp[1] = 1
def climb(n):
    a, b = 1, 1                       # dp[i-2], dp[i-1]
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b                          # O(n) time, O(1) space

# House robber: max sum, no two ADJACENT houses.
#   state:  dp[i] = best loot using houses 0..i
#   transition:  dp[i] = max(dp[i-1],        # skip house i
#                            dp[i-2] + nums[i])  # rob house i
#   base:  dp[-1] = 0, dp[0] = nums[0]
def rob(nums):
    skip, take = 0, 0                 # best excluding / including prev house
    for x in nums:
        skip, take = max(skip, take), skip + x
    return max(skip, take)`}
        />
      </Block>

      <Block eyebrow="DP atlas · 2D grid" title="Grid DP — unique paths">
        <CodeBlock
          title="python · unique paths (right / down only)"
          code={`# state:  dp[r][c] = number of paths from (0,0) to (r,c)
# transition:  dp[r][c] = dp[r-1][c] + dp[r][c-1]
# base:  first row and first column = 1 (only one straight-line path)
def unique_paths(m, n):
    dp = [1] * n                      # one row, rolled
    for _ in range(1, m):
        for c in range(1, n):
            dp[c] += dp[c - 1]        # dp[c]=from above, dp[c-1]=from left
    return dp[-1]                     # O(m·n) time, O(n) space
# (closed form is C(m+n-2, m-1), but the DP generalizes to obstacles)`}
        />
      </Block>

      <Block eyebrow="DP atlas · knapsack" title="0/1 vs unbounded — the iteration direction is the whole trick">
        <CodeBlock
          title="python · 0/1 knapsack (each item at most once)"
          code={`# state:  dp[w] = best value achievable with capacity w
# transition:  dp[w] = max(dp[w], dp[w - wt] + val)
# base:  dp[0..W] = 0
def knapsack01(weights, values, W):
    dp = [0] * (W + 1)
    for wt, val in zip(weights, values):
        for w in range(W, wt - 1, -1):   # DESCENDING: each item used once
            dp[w] = max(dp[w], dp[w - wt] + val)
    return dp[W]                          # O(n·W)`}
        />
        <CodeBlock
          title="python · unbounded knapsack / coin change (reuse allowed)"
          code={`# Coin change — fewest coins to make 'amount' (unlimited supply).
# state:  dp[a] = min coins to make amount a
# transition:  dp[a] = min(dp[a], dp[a - coin] + 1)
# base:  dp[0] = 0 ;  dp[a>0] = +inf  (unreachable)
def coin_change(coins, amount):
    dp = [0] + [float('inf')] * amount
    for coin in coins:
        for a in range(coin, amount + 1):  # ASCENDING: reuse the same coin
            dp[a] = min(dp[a], dp[a - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`}
        />
        <Callout kind="trap" title="Loop direction = 0/1 vs unbounded">
          Same recurrence, opposite inner loop. <strong>Descending</strong> capacity ⇒ each item used at
          most once (0/1). <strong>Ascending</strong> ⇒ the item can be reused (unbounded). Swapping them
          by accident silently solves the wrong problem.
        </Callout>
        <Callout kind="note" title="Count ways vs min coins">
          For <em>number of ways</em> to make change (order-independent), put the <C>coins</C> loop{" "}
          <strong>outside</strong> the amount loop and use <C>dp[a] += dp[a-coin]</C>. Swapping the loop
          order there counts ordered sequences instead — a classic subtle bug.
        </Callout>
      </Block>

      <Block eyebrow="DP atlas · subsequence" title="LIS — and the O(n log n) patience trick">
        <CodeBlock
          title="python · longest increasing subsequence"
          code={`# O(n^2) DP:
#   state:  dp[i] = length of the longest increasing subseq ENDING at i
#   transition:  dp[i] = 1 + max(dp[j] for j < i if nums[j] < nums[i])
#   base:  dp[i] = 1 (the element alone)
def lis_n2(nums):
    if not nums: return 0
    dp = [1] * len(nums)
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)

# O(n log n) — "patience sorting": tails[k] = smallest tail of an
# increasing subseq of length k+1. Binary-search each value into place.
from bisect import bisect_left
def lis_nlogn(nums):
    tails = []
    for x in nums:
        i = bisect_left(tails, x)     # leftmost tail >= x
        if i == len(tails):
            tails.append(x)           # x extends the longest run
        else:
            tails[i] = x              # x makes a length-(i+1) run end smaller
    return len(tails)                 # NOTE: len is the LIS; tails isn't the LIS`}
        />
        <Callout kind="trap" title="tails is NOT the actual subsequence">
          The <C>tails</C> array&apos;s <em>length</em> is the LIS length, but its contents are not a valid
          increasing subsequence. Reconstructing the actual sequence needs parent pointers recorded during
          the binary search.
        </Callout>
      </Block>

      <Block eyebrow="DP atlas · interval" title="Interval DP — solve by length, split on a midpoint">
        <p className="text-ink-dim leading-relaxed mb-1">
          State is a range <C>dp[i][j]</C>; you iterate over increasing range <strong>length</strong> and,
          inside each range, try every split / last-action point <C>k</C>. Matrix-chain multiplication and
          burst-balloons share this shape — O(n³): O(n²) ranges × O(n) splits.
        </p>
        <CodeBlock
          title="python · matrix-chain multiplication (min scalar mults)"
          code={`# dims p: matrix i is p[i-1] x p[i].
# state:  dp[i][j] = min cost to multiply matrices i..j
# transition:  dp[i][j] = min over k in [i, j-1] of
#                 dp[i][k] + dp[k+1][j] + p[i-1]*p[k]*p[j]
# base:  dp[i][i] = 0  (a single matrix costs nothing)
def matrix_chain(p):
    n = len(p) - 1
    dp = [[0] * (n + 1) for _ in range(n + 1)]
    for length in range(2, n + 1):          # iterate by chain length
        for i in range(1, n - length + 2):
            j = i + length - 1
            dp[i][j] = min(
                dp[i][k] + dp[k+1][j] + p[i-1]*p[k]*p[j]
                for k in range(i, j)
            )
    return dp[1][n]`}
        />
        <CodeBlock
          title="python · burst balloons (DP on the LAST balloon to pop)"
          code={`# Pad with 1s; dp[i][j] = max coins bursting balloons strictly inside (i, j).
# Choosing k as the LAST to pop in (i, j): its neighbors are then i and j.
# transition:  dp[i][j] = max over k in (i, j) of
#                 dp[i][k] + nums[i]*nums[k]*nums[j] + dp[k][j]
def max_coins(nums):
    a = [1] + nums + [1]
    n = len(a)
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n):              # gap between i and j
        for i in range(0, n - length):
            j = i + length
            dp[i][j] = max(
                dp[i][k] + a[i]*a[k]*a[j] + dp[k][j]
                for k in range(i + 1, j)
            )
    return dp[0][n - 1]`}
        />
        <Callout kind="tip" title="Interview line">
          &quot;It&apos;s interval DP — state is a sub-range, I iterate by length so smaller ranges are
          ready, and for each range I try every split point. O(n³).&quot; For burst balloons, the insight
          is to pick the balloon popped <em>last</em>, not first, so the two sides become independent.
        </Callout>
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Wrong fill order in tabulation">
          A cell must be filled only after its dependencies. 2D grids: top-left to bottom-right. Interval
          DP: by increasing length. Knapsack: mind the loop direction. If a value is still 0/∞ when you
          read it, your order is wrong.
        </Callout>
        <Callout kind="trap" title="Base cases and unreachable states">
          Distinguish &quot;0 ways / cost 0&quot; from &quot;impossible&quot;. Coin change seeds
          <C> dp[0] = 0</C> and everything else <C>+inf</C>; conflating impossible with 0 gives wrong
          answers and lets bad transitions slip through.
        </Callout>
        <Callout kind="note" title="Start top-down, optimize later">
          The fastest path to a correct solution: write the plain recursion, confirm it&apos;s right, add
          <C> @lru_cache</C>. Convert to bottom-up and roll the array only if you need the constant-factor
          speed or O(1)-row space.
        </Callout>
      </Block>
    </>
  );
}

/* ───────────────────────────── Greedy ───────────────────────────────── */
function Greedy() {
  return (
    <>
      <Lede>
        Make the locally optimal choice at each step and never reconsider. It&apos;s faster and simpler
        than DP — <em>when it&apos;s valid</em>. The hard part isn&apos;t the code; it&apos;s proving the
        greedy choice can&apos;t paint you into a corner (an exchange argument or a matroid structure).
      </Lede>

      <Block eyebrow="the template" title="Sort by the right key, then sweep once">
        <CodeBlock
          title="python · interval scheduling (max non-overlapping)"
          code={`# Greedy: always keep the interval that FINISHES earliest -> leaves the
# most room for the rest. Proof is a clean exchange argument.
def max_meetings(intervals):
    intervals.sort(key=lambda iv: iv[1])   # sort by END time
    count, end = 0, float('-inf')
    for s, e in intervals:
        if s >= end:                       # doesn't overlap the last kept
            count += 1
            end = e
    return count`}
        />
        <CodeBlock
          title="python · jump game (furthest reach so far)"
          code={`def can_jump(nums):
    reach = 0
    for i, n in enumerate(nums):
        if i > reach:           # stuck: can't even get to i
            return False
        reach = max(reach, i + n)
    return True                 # O(n), no DP table needed`}
        />
        <Callout kind="tip" title="Reach for this when you see…">
          &quot;maximum number of non-overlapping …&quot;; &quot;minimum number of … to cover&quot;;
          activity / interval selection; Huffman-style merge-cheapest-first; &quot;can you reach the
          end&quot;; or problems where sorting by one key makes a one-pass choice obviously safe. Many are
          interval problems wearing a greedy hat.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-2">
          <ComplexityTag tone="bad" label="with a sort">O(n log n)</ComplexityTag>
          <ComplexityTag tone="ok" label="single sweep">O(n)</ComplexityTag>
          <ComplexityTag tone="good" label="space">O(1)</ComplexityTag>
        </div>
        <p className="text-ink-dim leading-relaxed text-sm">
          Usually the sort dominates. When the data is already ordered (or you use a heap to pull the next
          best in O(log n)), the sweep itself is linear.
        </p>
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Greedy is often WRONG — prove it or use DP">
          Coin change with arbitrary denominations breaks greedy (it works for canonical systems like US
          coins, not for, say, <C>{"[1, 3, 4]"}</C> making 6). 0/1 knapsack breaks greedy. If you can&apos;t
          give an exchange-argument proof, default to DP and mention you considered greedy.
        </Callout>
        <Callout kind="trap" title="Sort key matters — finish vs start">
          Interval scheduling sorts by <strong>end</strong> time; sorting by start (or by length) gives
          wrong answers. The correct key is the heart of the proof, not an afterthought.
        </Callout>
      </Block>
    </>
  );
}

/* ───────────────────────────── Heap / Top-K ─────────────────────────── */
function Heap() {
  return (
    <>
      <Lede>
        When you repeatedly need the current min or max — but not a fully sorted order — a heap gives O(1)
        peek and O(log n) push/pop. For <strong>top-K</strong>, keep a heap of size K and you get O(n log
        k) time and O(k) space, beating a full O(n log n) sort.
      </Lede>

      <Block eyebrow="the template" title="Size-K heap, two-heap median, merge-K">
        <CodeBlock
          title="python · K largest with a size-K MIN-heap"
          code={`import heapq

def k_largest(nums, k):
    heap = []                     # min-heap of the k biggest seen so far
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)   # evict the smallest -> heap holds top k
    return heap                   # heap[0] is the k-th largest
    # O(n log k) time, O(k) space  (heapq.nlargest(k, nums) does this for you)`}
        />
        <CodeBlock
          title="python · merge K sorted lists"
          code={`def merge_k(lists):
    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
    heapq.heapify(heap)           # O(k)
    out = []
    while heap:
        val, li, idx = heapq.heappop(heap)
        out.append(val)
        if idx + 1 < len(lists[li]):
            heapq.heappush(heap, (lists[li][idx + 1], li, idx + 1))
    return out                    # O(N log k), N = total elements`}
        />
        <CodeBlock
          title="python · running median with two heaps"
          code={`# max-heap 'lo' (smaller half, negated) | min-heap 'hi' (larger half)
lo, hi = [], []                   # keep len(lo) >= len(hi), differ by <= 1
def add(x):
    heapq.heappush(lo, -heapq.heappushpop(hi, x))
    if len(lo) > len(hi) + 1:
        heapq.heappush(hi, -heapq.heappop(lo))
def median():
    return -lo[0] if len(lo) > len(hi) else (-lo[0] + hi[0]) / 2`}
        />
        <Callout kind="tip" title="Reach for this when you see…">
          &quot;top / K largest / smallest&quot;, &quot;K closest&quot;, &quot;K-th element&quot;;
          &quot;median of a data stream&quot; (two heaps); &quot;merge K sorted …&quot;; &quot;schedule by
          priority&quot; / Dijkstra / Prim; or any &quot;repeatedly grab the current best&quot; loop.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "peek min/max", avg: "O(1)", avgTone: "good", worst: "O(1)", worstTone: "good", why: "Root is always heap[0]." },
            { op: "push / pop", avg: "O(log n)", avgTone: "good", worst: "O(log n)", worstTone: "good", why: "Sift up / down by the tree height." },
            { op: "heapify(list)", avg: "O(n)", avgTone: "ok", worst: "O(n)", worstTone: "ok", why: "Bottom-up build beats n pushes." },
            { op: "top-K (size-k heap)", avg: "O(n log k)", avgTone: "ok", worst: "O(n log k)", worstTone: "ok", why: "n pushes against a heap capped at k." },
            { op: "K-th via quickselect", avg: "O(n)", avgTone: "ok", worst: "O(n²)", worstTone: "bad", why: "Partition-based; faster average, bad pivots hurt." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="heapq is MIN-only — and K-largest wants a MIN-heap">
          Python has no max-heap; negate values for one. Counter-intuitively, the <em>K largest</em> are
          held in a <strong>min</strong>-heap of size k, so you can cheaply evict the smallest survivor.
          For K smallest, use a max-heap (negate).
        </Callout>
        <Callout kind="trap" title="Tuples in a heap compare element-by-element">
          Pushing <C>(priority, item)</C> works only if ties never force Python to compare the items. If
          <C> item</C> isn&apos;t comparable (e.g. a dict or a custom node), add a unique tiebreaker:{" "}
          <C>(priority, count, item)</C> with a monotonic <C>count</C>.
        </Callout>
        <Callout kind="note" title="Quickselect when you don't need them sorted">
          Just the K-th element (not the top K in order)? Quickselect averages O(n). But it&apos;s O(n²)
          worst case and mutates the array — heaps are the safer interview default.
        </Callout>
      </Block>
    </>
  );
}

/* ───────────────────────────── Monotonic Stack ──────────────────────── */
function MonotonicStack() {
  return (
    <>
      <Lede>
        A stack you keep sorted (increasing or decreasing) by popping elements that violate the order
        before pushing. It answers &quot;next / previous greater / smaller element&quot; for every index in
        a single O(n) pass — each element is pushed and popped at most once.
      </Lede>

      <Try>
        <MonotonicStackViz />
      </Try>

      <Block eyebrow="the template" title="Next greater element — decreasing stack of indices">
        <CodeBlock
          title="python · next greater element to the right"
          code={`def next_greater(nums):
    res = [-1] * len(nums)         # default: nothing greater to the right
    stack = []                     # holds INDICES; values strictly decreasing
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            j = stack.pop()        # x is the answer for index j
            res[j] = x
        stack.append(i)
    return res                     # leftovers keep -1`}
        />
        <CodeBlock
          title="python · largest rectangle in a histogram"
          code={`def largest_rectangle(heights):
    heights.append(0)              # sentinel flushes the stack at the end
    stack, best = [], 0            # stack of indices, increasing heights
    for i, h in enumerate(heights):
        while stack and heights[stack[-1]] > h:
            top = stack.pop()
            left = stack[-1] if stack else -1
            width = i - left - 1   # bounded by the now-shorter neighbors
            best = max(best, heights[top] * width)
        stack.append(i)
    return best                    # O(n)`}
        />
        <Callout kind="tip" title="Reach for this when you see…">
          &quot;next / previous greater or smaller element&quot;; &quot;daily temperatures&quot;;
          &quot;largest rectangle&quot; / &quot;maximal rectangle&quot;; &quot;trapping rain water&quot;;
          &quot;stock span&quot;; or any &quot;for each element, how far until something bigger/smaller&quot;.
          The tell: you want a <em>nearer</em> qualifying neighbor on one side.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-2">
          <ComplexityTag tone="ok" label="time">O(n)</ComplexityTag>
          <ComplexityTag tone="ok" label="space">O(n)</ComplexityTag>
        </div>
        <p className="text-ink-dim leading-relaxed text-sm">
          It <em>looks</em> like O(n²) because of the inner <C>while</C>, but each index is pushed once and
          popped once across the whole run, so the total pop work is O(n) — amortized linear.
        </p>
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Decreasing vs increasing — and strict vs non-strict">
          &quot;Next greater&quot; ⇒ pop while <C>top &lt; x</C> (a <em>decreasing</em> stack). &quot;Next
          greater-or-equal&quot; flips the comparator to <C>&lt;=</C>. Choose the wrong direction or
          strictness and you solve a different problem. Store <strong>indices</strong>, not values, so you
          can compute distances and reach back to neighbors.
        </Callout>
        <Callout kind="trap" title="Circular arrays: iterate twice">
          For &quot;next greater in a circular array&quot;, loop <C>i</C> over <C>range(2*n)</C> and index
          with <C>i % n</C>, pushing only on the first pass — that lets wrap-around elements find answers.
        </Callout>
        <Callout kind="note" title="A sentinel flushes the stack">
          Appending a 0 (or ∞) at the end forces every remaining stack item to pop and be finalized, so you
          don&apos;t need a separate post-loop cleanup. Standard in the histogram problem.
        </Callout>
      </Block>
    </>
  );
}

/* ───────────────────────────── Intervals ────────────────────────────── */
function Intervals() {
  return (
    <>
      <Lede>
        Problems on ranges <C>[start, end]</C>: merge overlaps, count concurrency, insert, find free gaps.
        The unlock is almost always the same — <strong>sort by start</strong> (or process start/end events
        in time order) — after which a single sweep does the work.
      </Lede>

      <Block eyebrow="the template" title="Merge overlaps · max concurrency · insert">
        <CodeBlock
          title="python · merge overlapping intervals"
          code={`def merge(intervals):
    intervals.sort(key=lambda iv: iv[0])      # sort by START
    out = []
    for s, e in intervals:
        if out and s <= out[-1][1]:           # overlaps the last merged one
            out[-1][1] = max(out[-1][1], e)   # extend its end
        else:
            out.append([s, e])                # disjoint -> new interval
    return out                                # O(n log n) from the sort`}
        />
        <CodeBlock
          title="python · max concurrent intervals (meeting rooms II)"
          code={`def min_rooms(intervals):
    starts = sorted(s for s, e in intervals)
    ends   = sorted(e for s, e in intervals)
    rooms = best = 0
    i = j = 0
    while i < len(starts):
        if starts[i] < ends[j]:    # a meeting starts before the next ends
            rooms += 1; i += 1     # need another room
            best = max(best, rooms)
        else:
            rooms -= 1; j += 1     # a meeting freed up a room
    return best                    # = peak overlap`}
        />
        <CodeBlock
          title="python · sweep line with +1 / -1 events"
          code={`def max_overlap(intervals):
    events = []
    for s, e in intervals:
        events.append((s, 1))      # interval opens
        events.append((e, -1))     # interval closes
    events.sort()                  # ties: close (-1) before open (+1) at same t
    cur = best = 0
    for _, delta in events:
        cur += delta
        best = max(best, cur)
    return best`}
        />
        <Callout kind="tip" title="Reach for this when you see…">
          &quot;merge / insert intervals&quot;; &quot;do any overlap&quot;; &quot;minimum meeting
          rooms&quot; / max concurrency; &quot;free time&quot; / gaps; &quot;remove the fewest to make
          non-overlapping&quot; (greedy by end time); or anything with <C>[start, end]</C> ranges and time.
        </Callout>
      </Block>

      <Block eyebrow="cost model" title="Complexity">
        <OpTable
          rows={[
            { op: "sort", avg: "O(n log n)", avgTone: "bad", worst: "O(n log n)", worstTone: "bad", why: "Dominates everything — the unavoidable cost." },
            { op: "merge sweep", avg: "O(n)", avgTone: "ok", worst: "O(n)", worstTone: "ok", why: "One pass after sorting." },
            { op: "max concurrency", avg: "O(n log n)", avgTone: "bad", worst: "O(n log n)", worstTone: "bad", why: "Sort starts & ends (or a heap), then sweep." },
            { op: "space", avg: "O(n)", avgTone: "ok", worst: "O(n)", worstTone: "ok", why: "Output / event list." },
          ]}
        />
      </Block>

      <Block eyebrow="tips & traps" title="What trips people up">
        <Callout kind="trap" title="Decide whether touching = overlapping">
          Is <C>[1, 2]</C> and <C>[2, 3]</C> an overlap? Closed intervals say yes (<C>s &lt;= prev_end</C>);
          half-open say no (<C>s &lt; prev_end</C>). Pin this down with the interviewer before coding — it
          flips your comparison.
        </Callout>
        <Callout kind="trap" title="Event ordering at equal timestamps">
          In a sweep line, when a start and an end share a timestamp, process the <strong>end</strong>
          first if endpoints are exclusive (a room frees before the next meeting), but the <strong>start
          </strong> first if you&apos;re counting touching as overlap. Getting tie-breaking wrong is the
          classic off-by-one here.
        </Callout>
        <Callout kind="tip" title="Sort by END for selection, START for merging">
          Merging and concurrency sort by start. &quot;Maximum non-overlapping&quot; / &quot;fewest
          removals&quot; is the greedy that sorts by <strong>end</strong> — keep the earliest finisher.
          Knowing which key to use is the whole problem.
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  "two-pointers": <TwoPointers />,
  "sliding-window": <SlidingWindow />,
  "fast-slow": <FastSlow />,
  "binary-search": <BinarySearch />,
  bfs: <BFS />,
  dfs: <DFS />,
  backtracking: <Backtracking />,
  dp: <DP />,
  greedy: <Greedy />,
  heap: <Heap />,
  "monotonic-stack": <MonotonicStack />,
  intervals: <Intervals />,
};

export default function InterviewBench() {
  const [active, setActive] = useState("two-pointers");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Patterns · the HOW"
      title="Interview Bench"
      subtitle="The handful of patterns that crack most interview problems — each with the tells that point to it, a copy-paste template, and the cost."
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
