import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";

const ACCENT = "#12B5CB";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "how", label: "How to drill the bank", group: "Method" },
  { id: "coding", label: "Coding questions", group: "The bank" },
  { id: "design", label: "System design prompts", group: "The bank" },
  { id: "behavioral", label: "Behavioral questions", group: "The bank" },
  { id: "qfcoding", label: "Flashcards · coding", group: "Flashcards" },
  { id: "qfdesign", label: "Flashcards · design & behavioral", group: "Flashcards" },
];

/* Small inline row of accent-styled cross-links to the teaching tools. */
function DrillLinks({ links, label = "drill this pattern" }) {
  return (
    <p className="text-sm text-ink-faint mt-3">
      {label}:{" "}
      {links.map((l, i) => (
        <React.Fragment key={l.href}>
          {i > 0 && " · "}
          <a href={l.href} className="font-mono text-xs" style={{ color: ACCENT }}>
            {l.label}
          </a>
        </React.Fragment>
      ))}
    </p>
  );
}

function toneFor(diff) {
  return diff === "Easy" ? "good" : diff === "Hard" ? "bad" : "ok";
}

/* ── How to drill the bank ────────────────────────────────────── */
function How() {
  return (
    <>
      <Lede>
        This is a bank of real Google L5/L6 questions, coding, system design, and Googleyness,
        each paired with a worked solution idea, the stated complexity, and the follow-up the
        interviewer actually asks next. A bank is only worth the reps you put through it, so drill
        it the way the round scores you: out loud, pattern first, and priced with trade-offs.
      </Lede>

      <Block eyebrow="rep one" title="Active recall: say the solution out loud first">
        <p className="text-ink-dim leading-relaxed mb-2">
          Read a question, then answer it OUT LOUD before you reveal anything, the approach, the
          data structure, and the complexity, as if the interviewer just fired it at you. Recognizing
          the answer when you see it is not the same skill as producing it cold under pressure, and
          only the second one is scored. The flashcard decks are built for exactly this: question
          on the front, your spoken answer, then the reveal to grade yourself honestly.
        </p>
        <Callout kind="tip" title="The reveal is the test, not the hint">
          If you peek before you have committed a spoken answer, you have practiced reading, not
          solving. Force the sentence out first, even a wrong one, every time.
        </Callout>
      </Block>

      <Block eyebrow="rep two" title="Spaced repetition: re-drill the misses">
        <p className="text-ink-dim leading-relaxed mb-2">
          Grade each card got-it or missed-it, and let the misses pile up. A question you missed
          today goes back on tomorrow's stack, and again the day after, until it comes out clean
          twice in a row. Shuffle the deck so you are recalling the answer, not the order. The bar
          is boring and simple: run a deck until it holds above 85%, then keep it warm with a
          weekly pass rather than a cram the night before.
        </p>
      </Block>

      <Block eyebrow="rep three" title="Pattern first: name it before you code it">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every coding question in the bank is filed under the pattern that cracks it, sliding
          window, binary search on the answer, monotonic stack, topological sort, interval DP.
          Train the reflex to name the pattern in one sentence before writing a line: "this is
          latest-row-per-key, so a ranking window," or "this is minimize-the-maximum, so binary
          search on the answer." Naming the pattern is what turns a scary Hard into a template you
          have already run, and it is the single loudest signal that you have seen the shape before.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Structured narration: restate the problem, name the pattern, state the complexity, then
          build. Silent typing that lands on a correct answer scores worse than a spoken plan that
          lands on a near-correct one.
        </Callout>
      </Block>

      <Block eyebrow="rep four" title="How this bank maps to the teaching tools">
        <p className="text-ink-dim leading-relaxed mb-2">
          The bank is the drill; the teaching tools are where each pattern gets worked end to end.
          When a card keeps missing, go read the method behind it, then come back and re-drill.
        </p>
        <ul className="text-ink-dim leading-relaxed mb-1 list-disc pl-5 space-y-1.5 text-sm">
          <li>
            Coding patterns and the live coding round:{" "}
            <a href="#/google-coding" className="font-mono text-xs" style={{ color: ACCENT }}>
              Google Coding
            </a>
            .
          </li>
          <li>
            System design method, scale math, and worked sheets:{" "}
            <a href="#/gcp-design" className="font-mono text-xs" style={{ color: ACCENT }}>
              GCP Design
            </a>
            .
          </li>
          <li>
            Behavioral and Googleyness framing, signal by signal:{" "}
            <a href="#/googleyness" className="font-mono text-xs" style={{ color: ACCENT }}>
              Googleyness
            </a>
            .
          </li>
        </ul>
      </Block>

      <Block eyebrow="the closing move" title="Impress the packet">
        <Callout kind="tip" title="State complexity and trade-offs so the interviewer can write them down">
          After every solution, hand the interviewer the line they need for their write-up:
          "that is O(n) time and O(n) space, and the trade is more memory for a single pass." The
          scorecard is filled in from what you said, not from what you meant. A worked answer that
          ends with an explicit complexity and one named trade-off is worth more than a slightly
          faster one delivered silently, so close every question by pricing it out loud.
        </Callout>
      </Block>
    </>
  );
}

/* ── Coding bank ──────────────────────────────────────────────── */
const CODING_GROUPS = [
  {
    pattern: "Arrays, hashing, and prefix sums",
    links: [
      { href: "#/dsa-lab", label: "DSA Lab" },
      { href: "#/patterns", label: "Patterns Bench" },
    ],
    rows: [
      { name: "Two Sum (LC 1)", hf: true, diff: "Easy", idea: "One-pass hash map storing value->index; for each x look up target-x. Move past brute force immediately.", cx: "T: O(n), S: O(n)", followup: "Warm-up to gauge if you leave O(n^2) behind fast. Follow-up: sorted input -> two-pointer O(1) space; 3Sum/4Sum; count all pairs with dup handling." },
      { name: "Subarray Sum Equals K (LC 560)", hf: true, diff: "Medium", idea: "Running prefix sum + hash map of prefix-count; add count[prefix-k] to answer at each step.", cx: "T: O(n), S: O(n)", followup: "Tests the prefix-sum-with-hashmap insight and why sliding window FAILS with negatives. Follow-up: return the indices; longest such subarray (LC 325); at-most-K variants." },
      { name: "Product of Array Except Self (LC 238)", hf: true, diff: "Medium", idea: "Prefix products pass then suffix products pass; multiply into output. No division allowed.", cx: "T: O(n), S: O(1) extra", followup: "Google likes the no-division constraint and clean O(1)-extra implementation. Follow-up: handle zeros without division; make it work as a stream." },
      { name: "Group Anagrams (LC 49)", hf: false, diff: "Medium", idea: "Bucket strings by a canonical key = sorted chars or 26-length count signature; hash map key->list.", cx: "T: O(n*k) with count key, S: O(n*k)", followup: "Tests hashing/canonicalization design. Follow-up: streaming input; huge alphabet; memory-bounded key design." },
      { name: "Longest Consecutive Sequence (LC 128)", hf: false, diff: "Medium", idea: "Put all in a hash set; only start counting a run at x when x-1 is absent, then walk up. Each number visited O(1) amortized.", cx: "T: O(n), S: O(n)", followup: "Surprises candidates who reach for sorting; interviewer pushes for the O(n) argument. Follow-up: prove amortized bound." },
      { name: "Range Sum Query - Mutable (LC 307)", hf: false, diff: "Medium", idea: "Fenwick tree (BIT) or segment tree: point update + prefix query both O(log n).", cx: "T: O(log n) update/query, S: O(n)", followup: "Specifically reported in Google phone screens where the interviewer wanted a segment tree/BIT, not naive O(n). Follow-up: range update + range query (lazy propagation); 2D version." },
      { name: "Maximum Subarray / Kadane (LC 53)", hf: true, diff: "Medium", idea: "Track best sum ending here = max(x, best+x); keep global max. It is 1D DP in disguise.", cx: "T: O(n), S: O(1)", followup: "DP intuition primer and clean state design. Follow-up: return the actual indices; Maximum Sum Circular Subarray (LC 918); max product subarray (LC 152)." },
    ],
  },
  {
    pattern: "Two pointers and sliding window",
    links: [
      { href: "#/patterns", label: "Patterns Bench" },
      { href: "#/google-coding", label: "Google Coding" },
    ],
    rows: [
      { name: "Longest Substring Without Repeating Characters (LC 3)", hf: true, diff: "Medium", idea: "Expanding window with last-seen index map; jump left pointer to max(left, lastSeen+1) on repeat.", cx: "T: O(n), S: O(min(n, charset))", followup: "The canonical Google sliding-window screen; they grade how cleanly you manage the two pointers/map. Follow-up: at most K distinct chars (LC 340); return the substring; Unicode." },
      { name: "Minimum Window Substring (LC 76)", hf: true, diff: "Hard", idea: "Grow window to satisfy need-counts (have==required), then shrink from left while valid, tracking best.", cx: "T: O(n + m), S: O(charset)", followup: "Boundary/edge-case discipline under pressure; interviewers watch the shrink condition. Follow-up: multiple target sets; streaming text; duplicate requirements." },
      { name: "Trapping Rain Water (LC 42)", hf: true, diff: "Hard", idea: "Two pointers with running leftMax/rightMax; water at i bounded by the smaller side. (Or prefix/suffix max arrays.)", cx: "T: O(n), S: O(1)", followup: "A favorite Google phone-screen; multiple valid approaches reveal flexibility and prefix/suffix reasoning. Follow-up: Trapping Rain Water II 2D grid (LC 407) via min-heap boundary." },
      { name: "Container With Most Water (LC 11)", hf: false, diff: "Medium", idea: "Two pointers at ends; always move the shorter wall inward - moving the taller can never help.", cx: "T: O(n), S: O(1)", followup: "They want the correctness proof for why you move the shorter side. Follow-up: prove optimality; k-container variant." },
      { name: "Sliding Window Maximum (LC 239)", hf: false, diff: "Hard", idea: "Monotonic decreasing deque of indices; front is the window max; pop smaller tails and expired fronts.", cx: "T: O(n), S: O(k)", followup: "Tests the deque insight over a naive heap. Follow-up: as a data stream; sliding window median (two heaps + lazy deletion)." },
      { name: "3Sum (LC 15)", hf: true, diff: "Medium", idea: "Sort; fix i, two-pointer the rest for -nums[i]; skip duplicates at all three positions.", cx: "T: O(n^2), S: O(1) extra", followup: "The dedup logic is the whole game. Follow-up: 3Sum Closest (LC 16); 4Sum; count triplets < target." },
    ],
  },
  {
    pattern: "Binary search (including on the answer)",
    links: [{ href: "#/patterns", label: "Patterns Bench" }],
    rows: [
      { name: "Search in Rotated Sorted Array (LC 33)", hf: true, diff: "Medium", idea: "Standard binary search; at each mid decide which half is sorted, then test if target lies in that sorted half.", cx: "T: O(log n), S: O(1)", followup: "Constraint-aware binary search is a Google staple. Follow-up: with duplicates (LC 81) breaks O(log n) worst case; find minimum (LC 153)." },
      { name: "Koko Eating Bananas (LC 875)", hf: true, diff: "Medium", idea: "Binary search on the ANSWER (eating speed); feasibility check = hours needed at speed s is <= H. Monotonic predicate.", cx: "T: O(n log maxPile), S: O(1)", followup: "The archetype 'binary search on the answer' - once you see it, a whole class opens up. Follow-up: Capacity to Ship Packages in D Days (LC 1011); Minimum Days to Make Bouquets (LC 1482)." },
      { name: "Median of Two Sorted Arrays (LC 4)", hf: true, diff: "Hard", idea: "Binary search the partition of the smaller array so left halves <= right halves; median from the four boundary values.", cx: "T: O(log min(m,n)), S: O(1)", followup: "The hardest common binary search; interviewers probe the partition invariants and even/odd handling. Follow-up: kth element of two sorted arrays; streaming." },
      { name: "Find First and Last Position (LC 34)", hf: false, diff: "Medium", idea: "Two binary searches: lower_bound for first index, upper_bound for last. Generalize to bound-finding template.", cx: "T: O(log n), S: O(1)", followup: "Tests whether you own a reusable lower/upper-bound template rather than off-by-one guessing. Follow-up: count occurrences; search insert position." },
      { name: "Split Array Largest Sum (LC 410)", hf: false, diff: "Hard", idea: "Binary search on the answer (max allowed subarray sum); greedy feasibility = can we split into <= k parts under that cap.", cx: "T: O(n log(sum)), S: O(1)", followup: "[STAFF] Recognizing minimize-the-maximum as binary-search-on-answer (vs an O(n^2 k) DP) is the staff-level move. Same shape as Painters Partition / Book Allocation / Aggressive Cows." },
      { name: "Find Peak Element (LC 162)", hf: false, diff: "Medium", idea: "Binary search moving toward the higher neighbor; a peak must exist in that direction.", cx: "T: O(log n), S: O(1)", followup: "Binary search without a sorted array - tests the invariant, not the pattern. Follow-up: 2D peak (LC 1901)." },
    ],
  },
  {
    pattern: "Stacks, monotonic, intervals, heaps, and top-K",
    links: [
      { href: "#/patterns", label: "Patterns Bench" },
      { href: "#/interview-bench", label: "Interview Bench" },
    ],
    rows: [
      { name: "Merge Intervals (LC 56)", hf: true, diff: "Medium", idea: "Sort by start; sweep and extend current interval while overlap, else push and reset.", cx: "T: O(n log n), S: O(n)", followup: "Maps directly to real infra/scheduling and is heavily reported at Google. Follow-up: Insert Interval (LC 57); Interval List Intersections (LC 986); employee free time (LC 759)." },
      { name: "Meeting Rooms II (LC 253)", hf: true, diff: "Medium", idea: "Min-heap of end times (or sweep-line of +1/-1 events); heap size = rooms needed.", cx: "T: O(n log n), S: O(n)", followup: "Classic resource-allocation model, reported at L5. Follow-up: which meeting uses which room; Meeting Rooms III." },
      { name: "Meeting Rooms III (LC 2402)", hf: false, diff: "Hard", idea: "Sort meetings by start; two heaps: available rooms (by index) and busy rooms (by free-time, then index); if none free, fast-forward to earliest freeing and delay the meeting.", cx: "T: O(n log n + n log m), S: O(m)", followup: "Reported in recent L5 loops; the delay/tie-break bookkeeping is where people slip. n meetings, m rooms; the start-time sort dominates when meetings far outnumber rooms. Follow-up: return busiest room." },
      { name: "Largest Rectangle in Histogram (LC 84)", hf: false, diff: "Hard", idea: "Monotonic increasing stack of indices; when a shorter bar appears, pop and compute area with popped height * width span.", cx: "T: O(n), S: O(n)", followup: "The reference monotonic-stack problem. Follow-up: Maximal Rectangle in a binary matrix (LC 85) = histogram per row." },
      { name: "Daily Temperatures / Next Greater Element (LC 739 / 496)", hf: false, diff: "Medium", idea: "Monotonic decreasing stack of indices; pop when current value is greater, recording the distance/answer.", cx: "T: O(n), S: O(n)", followup: "Teaches the next-greater monotonic-stack template. Follow-up: circular array (LC 503); stock span." },
      { name: "Top K Frequent Elements (LC 347)", hf: true, diff: "Medium", idea: "Count with hash map, then size-k min-heap O(n log k), OR bucket sort by frequency O(n), OR quickselect on unique elems.", cx: "T: O(n log k) heap / O(n) bucket, S: O(n)", followup: "They grade the tradeoff reasoning (heap vs bucket vs quickselect), not just a working answer. Follow-up: streaming top-K; distributed top-K across shards." },
      { name: "Merge K Sorted Lists (LC 23)", hf: true, diff: "Hard", idea: "Min-heap holding one node per list, or divide-and-conquer pairwise merge.", cx: "T: O(N log k), S: O(k)", followup: "Data-structure selection + complexity tradeoffs; directly generalizes to the K-way stream merge staff question. Follow-up: merge k sorted streams with a memory cap / external merge." },
      { name: "Find Median from Data Stream (LC 295)", hf: true, diff: "Hard", idea: "Max-heap for lower half + min-heap for upper half, kept balanced; median from tops.", cx: "T: O(log n) add / O(1) query, S: O(n)", followup: "Running-statistics/stream design that shows up as a phone screen. Follow-up: sliding-window median; approximate median at scale (t-digest)." },
    ],
  },
  {
    pattern: "Trees: DFS, LCA, serialize, BST",
    links: [
      { href: "#/dsa-lab", label: "DSA Lab" },
      { href: "#/patterns", label: "Patterns Bench" },
    ],
    rows: [
      { name: "Lowest Common Ancestor (BST LC 235 / Binary Tree LC 236)", hf: true, diff: "Medium", idea: "BST: walk down, go left/right by comparing both values, split point is the LCA (O(h)). General tree: post-order recursion returning whether each subtree saw p or q; first node seeing both is LCA.", cx: "T: O(h) BST / O(n) general, S: O(h)", followup: "LCA is a perennial Google favorite testing recursive return-value design. Follow-up: with parent pointers (two-pointer intersection); LCA of deepest leaves (LC 1123); LCA of k nodes." },
      { name: "Serialize and Deserialize Binary Tree (LC 297)", hf: true, diff: "Hard", idea: "Preorder DFS emitting null markers; deserialize by consuming tokens in the same order via a queue/index.", cx: "T: O(n), S: O(n)", followup: "Blends algorithmic traversal with API/format design - a 'design-flavored coding' problem Google likes. Follow-up: serialize a BST compactly (no null markers); N-ary tree; versioned/back-compat format." },
      { name: "Binary Tree Level Order Traversal (LC 102)", hf: true, diff: "Medium", idea: "BFS with a queue, processing one level (queue-size snapshot) per outer iteration.", cx: "T: O(n), S: O(n)", followup: "Google expects this written without hesitation as a building block. Follow-up: zigzag (LC 103); right-side view (LC 199); vertical order (LC 987)." },
      { name: "Validate Binary Search Tree (LC 98)", hf: false, diff: "Medium", idea: "Recurse carrying (min,max) bounds, tightening on each side; or check that in-order traversal is strictly increasing.", cx: "T: O(n), S: O(h)", followup: "The classic bug is comparing only parent-child, not global bounds - they watch for it. Follow-up: recover a BST with two swapped nodes (LC 99)." },
      { name: "Binary Tree Maximum Path Sum (LC 124)", hf: false, diff: "Hard", idea: "Post-order DFS returning best single downward branch (clamped at 0); update a global max with left+node+right at each node.", cx: "T: O(n), S: O(h)", followup: "Distinguishes what you return (a branch) from what you record (a bent path) - a subtle staff-adjacent distinction. Follow-up: path between any two nodes; k-sum paths (LC 437)." },
      { name: "Diameter of Binary Tree (LC 543)", hf: false, diff: "Easy", idea: "DFS returning height while updating a global best = leftHeight + rightHeight.", cx: "T: O(n), S: O(h)", followup: "The template ('compute-and-bubble-up while tracking a global') underlies many harder tree questions. Follow-up: longest univalue path (LC 687)." },
      { name: "Count Complete Tree Nodes (LC 222)", hf: false, diff: "Medium", idea: "Compare left-spine vs right-spine height; if equal the subtree is perfect (2^h-1), else recurse - beating naive O(n).", cx: "T: O(log^2 n), S: O(log n)", followup: "Tests whether you exploit the completeness invariant instead of a plain count. Follow-up: prove the log^2 bound." },
    ],
  },
  {
    pattern: "Graphs: BFS, DFS, topo, union-find, shortest path",
    links: [
      { href: "#/patterns", label: "Patterns Bench" },
      { href: "#/whiteboard", label: "The Whiteboard" },
    ],
    rows: [
      { name: "Number of Islands (LC 200)", hf: true, diff: "Medium", idea: "Scan grid; on each unvisited land cell run DFS/BFS flood fill (or union-find) and increment count.", cx: "T: O(rows*cols), S: O(rows*cols)", followup: "The single most frequently reported Google problem across all levels. Follow-ups: Number of Islands II with union-find on a stream of adds (LC 305); Closed Islands (LC 1254); Max Area; count with diagonal adjacency; giant grid that does not fit in memory." },
      { name: "Course Schedule I / II (LC 207 / 210)", hf: true, diff: "Medium", idea: "Topological sort via Kahn's BFS (in-degree queue) or DFS with cycle detection; a cycle means impossible.", cx: "T: O(V+E), S: O(V+E)", followup: "Dependency resolution is something Google engineers do constantly, so it is asked constantly. Follow-up: return an order; detect the cycle; parallel course scheduling / min semesters (LC 1136)." },
      { name: "Word Ladder (LC 127)", hf: true, diff: "Hard", idea: "BFS over an implicit graph where edges connect words differing by one letter; use wildcard buckets (*ord) to build neighbors; bidirectional BFS to cut the frontier.", cx: "T: O(N * L^2), S: O(N * L)", followup: "Tests modeling a non-obvious graph and shortest-path intuition. Follow-up: Word Ladder II - enumerate ALL shortest transformation sequences (LC 126) via BFS layering + DFS backtracking." },
      { name: "Clone Graph (LC 133)", hf: true, diff: "Medium", idea: "DFS/BFS with a hash map old-node -> new-node to handle cycles and shared neighbors during the deep copy.", cx: "T: O(V+E), S: O(V)", followup: "Cycle handling + deep copy is a compact competence check. Follow-up: copy list with random pointer (LC 138); serialize instead of clone." },
      { name: "Alien Dictionary (LC 269)", hf: true, diff: "Hard", idea: "For each adjacent word pair find the first differing char -> a directed edge; topological sort the letters; detect invalid prefix case and cycles.", cx: "T: O(total chars), S: O(1) alphabet", followup: "[STAFF] Pure graph MODELING from constraints - reported directly in Google L6 loops. The traps (prefix like 'abc' before 'ab' is invalid; cycle = no order) are the discriminator." },
      { name: "Network Delay Time / Cheapest Flights K Stops (LC 743 / 787)", hf: false, diff: "Medium", idea: "Dijkstra with a min-heap for 743; for 787 use Bellman-Ford limited to k+1 relaxations (or Dijkstra augmented with stop count).", cx: "T: O(E log V) Dijkstra; O(K*E) Bellman-Ford, S: O(V+E)", followup: "Weighted shortest path with a twist (the k-stops constraint changes the algorithm). Follow-up: why plain Dijkstra fails under the stop cap; path reconstruction." },
      { name: "Union-Find family: Accounts Merge / Redundant Connection / Islands II (LC 721 / 684 / 305)", hf: false, diff: "Medium", idea: "Disjoint Set Union with path compression + union by rank/size; near-constant amortized per op for dynamic connectivity.", cx: "T: O(E * alpha(V)) ~ O(E), S: O(V)", followup: "Dynamic connectivity / grouping that DFS cannot do incrementally on a stream. The group spans Medium to Hard: Number of Islands II (LC 305) is rated Hard. Follow-up: number of connected components over a stream (LC 305); count components (LC 323); Kruskal MST." },
      { name: "All Shortest Paths in a Weighted DAG (Google onsite, reported)", hf: false, diff: "Hard", idea: "Topologically order the DAG; relax in topo order computing dist[] and a count/predecessor set; then DFS the predecessor DAG to enumerate all minimum-cost paths.", cx: "T: O(V+E) for distances (+ output size to enumerate), S: O(V+E)", followup: "[STAFF] Reported verbatim in an L6/Staff onsite. Combines shortest-path DP on a DAG with enumerating ALL optima and reasoning about output-sensitive complexity." },
    ],
  },
  {
    pattern: "Tries and backtracking",
    links: [
      { href: "#/patterns", label: "Patterns Bench" },
      { href: "#/google-coding", label: "Google Coding" },
    ],
    rows: [
      { name: "Implement Trie / Prefix Tree (LC 208)", hf: true, diff: "Medium", idea: "Node with children map/array[26] + isEnd flag; insert/search/startsWith all walk char by char.", cx: "T: O(L) per op, S: O(total chars)", followup: "The prerequisite building block for autocomplete/spellcheck questions. Follow-up: Add and Search Word with '.' wildcard (LC 211); memory-optimized nodes; radix/compressed trie." },
      { name: "Design Search Autocomplete / Typeahead (LC 642)", hf: true, diff: "Hard", idea: "Trie keyed by prefix; at each node cache the top-k highest-frequency completions (or store counts and heap on query). On input, walk to the node and return top-3 by frequency then lexicographic.", cx: "T: O(p + k log k) per query, S: O(total chars * k)", followup: "[STAFF] A real Google product surface, reported at L5/L6; the interview quickly turns into system design - ranking, updates, sharding the trie, edit-distance suggestions, and distributed serving." },
      { name: "Word Search II (LC 212)", hf: true, diff: "Hard", idea: "Build a trie of the dictionary; DFS/backtrack from each board cell walking the trie in lockstep, pruning dead prefixes and removing found words.", cx: "T: O(cells * 4^L), S: O(total chars)", followup: "The definitive trie + backtracking combo; the trie is what makes it tractable vs searching each word. Follow-up: prune the trie as words are found; huge board streaming." },
      { name: "Word Search (LC 79)", hf: false, diff: "Medium", idea: "DFS from each cell, marking visited in place, backtracking on failure.", cx: "T: O(cells * 4^L), S: O(L)", followup: "Backtracking fundamentals and in-place visited marking. Follow-up: reuse cells; count all matches; the LC 212 trie upgrade." },
      { name: "Generate Parentheses (LC 22)", hf: false, diff: "Medium", idea: "Backtrack adding '(' while open<n and ')' while close<open; record when length==2n.", cx: "T: O(4^n / sqrt(n)) Catalan, S: O(n)", followup: "Constraint-pruned backtracking with a clean validity invariant. Follow-up: count only (Catalan); valid parenthesis removal (LC 301)." },
      { name: "Combination Sum (LC 39)", hf: false, diff: "Medium", idea: "Backtrack with a start index; allow reuse by not advancing the index; prune when remaining target < 0.", cx: "T: O(N^(T/min)) exponential, S: O(T/min)", followup: "Recursion-with-pruning and dedup design. Follow-up: each number once (LC 40); Combination Sum III/IV; Subsets/Permutations family." },
      { name: "Palindrome Partitioning (LC 131)", hf: false, diff: "Medium", idea: "Backtrack over cut positions; only recurse when the prefix is a palindrome (optionally precompute an isPal DP table).", cx: "T: O(n * 2^n), S: O(n)", followup: "Backtracking + a memoization optimization opportunity. Follow-up: min cuts (LC 132) becomes pure DP." },
      { name: "N-Queens (LC 51)", hf: false, diff: "Hard", idea: "Place one queen per row; track occupied columns and both diagonals (r-c, r+c) in sets for O(1) conflict checks; backtrack.", cx: "T: O(n!), S: O(n)", followup: "The canonical constraint-satisfaction backtracking with clever conflict encoding. Follow-up: count solutions only (LC 52); Sudoku Solver (LC 37)." },
    ],
  },
  {
    pattern: "Dynamic programming",
    links: [
      { href: "#/patterns", label: "Patterns Bench" },
      { href: "#/staff-bench", label: "Staff Bench" },
    ],
    rows: [
      { name: "Coin Change (LC 322)", hf: true, diff: "Medium", idea: "1D DP: dp[a] = min over coins c of dp[a-c]+1 (unbounded knapsack). Bottom-up from 0..amount.", cx: "T: O(amount * coins), S: O(amount)", followup: "The canonical DP; a clean state definition demonstrates mastery. Follow-up: Coin Change II - count the number of ways (LC 518), where iteration order matters." },
      { name: "Longest Increasing Subsequence (LC 300)", hf: true, diff: "Medium", idea: "O(n^2) dp[i]=1+max(dp[j] for j<i, nums[j]<nums[i]); OR O(n log n) patience sorting - binary-search each value into a tails array.", cx: "T: O(n log n), S: O(n)", followup: "Google interviewers explicitly notice whether you know the O(n log n) upgrade over O(n^2). Follow-up: reconstruct the subsequence; number of LIS (LC 673); Russian Doll Envelopes (LC 354)." },
      { name: "Edit Distance (LC 72)", hf: true, diff: "Medium", idea: "2D DP over prefixes; dp[i][j] = match ? diag : 1 + min(insert, delete, replace).", cx: "T: O(m*n), S: O(min(m,n)) rolling", followup: "Connects to real search/spellcheck/NLP at Google scale; LC 72 was reclassified from Hard to Medium. Follow-up: One Edit Distance (LC 161); print the edit operations; weighted edit costs; DNA alignment." },
      { name: "Decode Ways (LC 91)", hf: false, diff: "Medium", idea: "1D DP like Fibonacci: dp[i] adds dp[i-1] if s[i-1] valid and dp[i-2] if s[i-2..i-1] in 10..26; handle leading zeros.", cx: "T: O(n), S: O(1)", followup: "The zero/edge cases reveal thoroughness - boundaries are exactly where candidates fail. Follow-up: Decode Ways II with '*' wildcard (LC 639)." },
      { name: "Longest Common Subsequence (LC 1143)", hf: false, diff: "Medium", idea: "2D DP; dp[i][j] = match ? diag+1 : max(up, left).", cx: "T: O(m*n), S: O(min(m,n)) rolling", followup: "Foundation of diff tooling; reported as a Google DP. Follow-up: reconstruct the LCS; shortest common supersequence; LCS of 3 strings." },
      { name: "Regular Expression / Wildcard Matching (LC 10 / 44)", hf: false, diff: "Hard", idea: "2D DP dp[i][j] over text/pattern; '*' either matches zero (dp[i][j-2] for regex) or extends (dp[i-1][j]); '.'/'?' match any single char.", cx: "T: O(m*n), S: O(m*n)", followup: "[STAFF] Reported in a Google L5 onsite; the '*' transition cases are a precision test that separates staff-level rigor from hand-waving. Follow-up: compile the pattern once for many texts." },
      { name: "Burst Balloons (LC 312)", hf: false, diff: "Hard", idea: "Interval DP: dp[l][r] = max over k of dp[l][k-1] + nums[l-1]*nums[k]*nums[r+1] + dp[k+1][r], choosing k as the LAST balloon burst in the range.", cx: "T: O(n^3), S: O(n^2)", followup: "[STAFF] Constrained/interval DP where the trick is defining k as last-to-burst so subranges stay independent. Follow-up: Remove Boxes (LC 546) adds a third state dimension." },
      { name: "Cat and Mouse (LC 913)", hf: false, diff: "Hard", idea: "Game-theory DP over states (mouse pos, cat pos, turn); backward induction / BFS coloring from terminal DRAW/WIN/LOSE states until fixpoint.", cx: "T: O(n^3), S: O(n^2)", followup: "[STAFF] Reported in a Google L6 loop. Multi-agent optimal-play DP with cycle/draw handling - well beyond single-sequence DP. Follow-up: Cat and Mouse II on a grid (LC 1728)." },
      { name: "Maximal Square / Minimum Path Sum (LC 221 / 64)", hf: false, diff: "Medium", idea: "Grid DP; Maximal Square dp[i][j]=min(top,left,diag)+1 on '1'; Min Path Sum dp[i][j]=grid+min(top,left).", cx: "T: O(m*n), S: O(n) rolling", followup: "2D grid DP fluency; common building block. Follow-up: Maximal Rectangle (LC 85); paths with obstacles (LC 63); dungeon game (LC 174) needs reverse DP." },
    ],
  },
  {
    pattern: "Data-structure design and concurrency",
    links: [
      { href: "#/interview-bench", label: "Interview Bench" },
      { href: "#/staff-bench", label: "Staff Bench" },
    ],
    rows: [
      { name: "LRU Cache (LC 146)", hf: true, diff: "Medium", idea: "Hash map key->node over a doubly linked list; move-to-front on access, evict from the tail on overflow. All O(1).", cx: "T: O(1) get/put, S: O(capacity)", followup: "The most commonly named Google design question across candidate reports. Follow-up: make it thread-safe (sharded locks / striping); upgrade to LFU; TTL expiry." },
      { name: "LFU Cache (LC 460)", hf: false, diff: "Hard", idea: "Hash map key->node; frequency buckets, each a doubly linked list; a minFreq pointer. On access bump the node to the next freq bucket; evict from minFreq bucket's tail. All O(1).", cx: "T: O(1) get/put, S: O(capacity)", followup: "[STAFF] Reported at L6; hitting true O(1) on every op (not O(log n)) with the minFreq bookkeeping is the bar. Follow-up: thread safety; approximate LFU (TinyLFU) at scale." },
      { name: "Time-Based Key-Value Store (LC 981)", hf: true, diff: "Medium", idea: "Hash map key -> list of (timestamp, value) appended in increasing time; get(key, t) binary-searches the largest timestamp <= t.", cx: "T: O(1) set / O(log n) get, S: O(n)", followup: "Versioned/temporal KV that mirrors real storage systems (MVCC). Follow-up: range/latest queries; deletes and tombstones; snapshot isolation; distributed." },
      { name: "Design a Token-Bucket Rate Limiter (Google onsite, reported)", hf: false, diff: "Hard", idea: "Store tokens + lastRefillTime per key; on each request lazily add rate*(now-last) tokens capped at burst, then allow iff tokens>=1 and decrement. No background thread needed.", cx: "T: O(1) per request, S: O(#keys)", followup: "[STAFF/concurrency] Directly reported in Google L6 loops. Follow-up: make it thread-safe (atomics/CAS or per-key lock); distributed rate limiting with Redis/lease tokens; sliding-window-log vs fixed-window-counter tradeoffs." },
      { name: "Logger Rate Limiter (LC 359)", hf: true, diff: "Easy", idea: "Hash map message -> next-allowed timestamp; print iff now >= stored time, then set now+window.", cx: "T: O(1), S: O(#messages)", followup: "A reported Google warm-up design. Follow-up: bound memory by evicting expired entries (queue + map); concurrent access." },
      { name: "Insert Delete GetRandom O(1) (LC 380)", hf: false, diff: "Medium", idea: "Dynamic array of values + hash map value->index; delete by swapping the target with the last element then popping. getRandom picks a random array index.", cx: "T: O(1) all ops, S: O(n)", followup: "The swap-with-last trick to keep the array dense is the insight. Follow-up: duplicates allowed (LC 381) needs a set of indices per value." },
      { name: "Design Twitter (LC 355)", hf: false, diff: "Medium", idea: "Per-user tweet lists with a global timestamp + follow set; getNewsFeed merges the user's and followees' recent tweets via a k-way min-heap for the 10 most recent.", cx: "T: O(k log k) feed, S: O(users + tweets)", followup: "A coding/system-design hybrid - object modeling plus a heap merge - fitting for L5/L6. Follow-up: fan-out on write vs read; celebrity problem; pagination." },
      { name: "Async Task Scheduler with Dependencies (Google L6, reported)", hf: false, diff: "Hard", idea: "Model tasks as a DAG; maintain in-degree counts and a ready queue; a worker pool pulls ready tasks and, on completion, decrements dependents and enqueues newly-ready ones. Detect cycles.", cx: "T: O(V+E), S: O(V+E)", followup: "[STAFF/concurrency] Reported at L6. It is topological sort turned into a concurrency-safe executor. Follow-up: thread-safe ready queue; priorities; failure/retry semantics; dynamic task addition." },
      { name: "Thread-Safe Job Queue with Delay + Cancellation (Google L6, reported)", hf: false, diff: "Hard", idea: "Min-heap/priority queue keyed by fire-time guarded by a lock + condition variable; consumers wait until the earliest job is due (timed wait); cancellation via a job-id set / lazy tombstones skipped on poll.", cx: "T: O(log n) add/poll, S: O(n)", followup: "[STAFF/concurrency] Reported at L6. Tests correct condition-variable usage (avoid busy-wait, handle spurious wakeups) and lazy deletion under concurrency. Follow-up: fairness; multiple consumers; at-least-once delivery." },
      { name: "Read-Write Lock Manager with Priority (Google L6, reported)", hf: false, diff: "Hard", idea: "Track active readers/writer + waiting queues; grant shared reads concurrently, exclusive writes alone; use condition variables and a fairness/priority policy to avoid writer starvation.", cx: "T: O(1) amortized per acquire/release, S: O(waiters)", followup: "[STAFF/concurrency] Reported at L6. Pure concurrency-primitive design - starvation-freedom and the priority policy are the discriminators. Follow-up: upgrade/downgrade locks; deadlock avoidance." },
    ],
  },
];

function Coding() {
  return (
    <>
      <Lede>
        Sixty-nine reported Google L5/L6 coding questions, grouped by the pattern that cracks each
        one. Every row carries the difficulty, the solution idea, the stated complexity, and the
        follow-up the interviewer reaches for next. HF marks the high-frequency questions, drill
        those to reflex first. Name the pattern out loud before you open any row.
      </Lede>

      {CODING_GROUPS.map((g) => (
        <Block key={g.pattern} eyebrow="coding pattern" title={g.pattern}>
          <OpTable
            cols={["Question", "Difficulty", "", "Solution idea + complexity + follow-up"]}
            rows={g.rows.map((r) => ({
              op: r.name + (r.hf ? "  ·  HF" : ""),
              avg: r.diff,
              avgTone: toneFor(r.diff),
              why: r.idea + " | " + r.cx + " | " + r.followup,
            }))}
          />
          <DrillLinks links={g.links} />
        </Block>
      ))}
    </>
  );
}

/* ── Design bank ──────────────────────────────────────────────── */
const DESIGN_PROMPTS = [
  {
    title: "Design a news feed / home timeline for a billion-user social product",
    tag: "product",
    asked: true,
    prompt:
      "Users follow others and publish posts (text/image/video); each user sees a ranked, near-real-time feed. Must handle very high-fanout celebrity accounts and a heavy read:write skew.",
    crux:
      "(1) Fan-out-on-write (push) vs fan-out-on-read (pull), and the HYBRID: precompute feeds for normal users but pull-and-merge for celebrity/high-fanout accounts. (2) Where ranking runs (write-time precompute vs read-time ML rerank) and chronological vs learned ranking. (3) Staleness/consistency budget: feeds are eventually consistent, so pick an acceptable lag SLO. (4) Hot-key / thundering-herd handling for viral posts.",
    outline: `REQ    follow graph, publish post, get ranked feed, freshness within seconds,
       read-heavy (~100:1), eventual consistency OK
SCALE  2B users / 500M DAU, avg ~200 follows, ~10K posts/s, >1M feed reads/s,
       celebrities up to 100M followers
API    publishPost(userId, content), getFeed(userId, cursor)
DATA   posts in wide-column store (Bigtable), media in blob store, per-user feed =
       sorted list of postIds (in-memory/Bigtable), social graph in its own
       adjacency store
ARCH   write path -> post service -> async fanout workers (via queue) append postId
       into each follower's feed row; read path -> feed service reads precomputed
       feed, hydrates posts, applies ranking, caches
HYBRID accounts above a follower threshold are NOT fanned out; their recent posts
       are pulled at read-time and merged
DEEP   ranking pipeline (candidate-gen -> feature fetch -> ML score -> rerank),
       feed schema + opaque pagination cursor, two-tier cache (per-user feed cache
       + global post cache), idempotent/dedup fanout keyed by (postId, followerId)
OPS    fanout-lag SLO + backpressure, backfill on new follow, celebrity
       write-amplification mitigation, hot-post protection, offline
       feed-rebuild job`,
    failures:
      "Celebrity write amplification (100M writes per post); feed staleness/lag spikes under load; hot-key on viral posts; duplicate or missing feed entries on fanout retries; unbounded feed-row growth; cache stampede on popular authors.",
    reference:
      "Bigtable (feed + post storage), Colossus (media blobs), Pub/Sub + Dataflow (async fanout/ranking features); no single named Google feed system.",
  },
  {
    title: "Design a photo & video sharing/backup service at Google Photos scale",
    tag: "product",
    asked: true,
    prompt:
      "Mobile clients upload (often over flaky networks), get durable storage plus thumbnails/transcodes, browse a timeline and albums, share with ACLs, and search photos by content. Handle multi-GB/day per user and offline-first clients.",
    crux:
      "(1) Resumable/chunked upload + client-side content-hash dedupe so duplicates are never re-uploaded and identical bytes are stored once (ref-counted). (2) Storage tiering + durability: erasure coding, hot/cold tiers, and an async thumbnail/transcode/ML-label pipeline. (3) Metadata store and index design for fast timeline/album queries AND content search. (4) Sharing/ACL model and the consistency of shared-album views.",
    outline: `REQ    upload photo/video, generate thumbnails + transcodes, timeline/album browse,
       share with ACLs, search-by-content, offline sync
SCALE  1B users, ~500M uploads/day @ ~4MB -> ~2PB/day ingest, exabytes total;
       thumbnail reads dominate
API    initUpload -> uploadChunk -> finalize (resumable, idempotency key),
       getTimeline(cursor), createShare(assetIds, acl)
DATA   originals + derived assets in blob store (Colossus), content-addressed by
       SHA-256 for dedupe; metadata (owner, EXIF, perceptual hash, ML labels) in
       Bigtable/Spanner; ACLs in an authz store
ARCH   client hashes + resumable-uploads to nearest ingest edge -> blob store;
       async pipeline (queue -> transcode/thumbnail/label workers) writes derived
       assets + labels; timeline service queries metadata index; CDN fronts
       thumbnails
DEEP   dedupe via content hash + reference counting, resumable-upload protocol with
       idempotent finalize, tiered storage + erasure coding, ML label index for
       search, offline sync/reconciliation with client change-log
OPS    orphaned-chunk GC, duplicate finalize, transcode backlog + backpressure,
       per-region durability, quota enforcement, delete/undelete + GDPR
       hard-erasure across derived copies`,
    failures:
      "Orphaned chunks from aborted uploads; duplicate finalization; transcode pipeline backlog; ref-count leaks blocking deletion; hot thumbnails; cross-region durability loss; runaway per-user quota; erasure of all derived copies on delete.",
    reference:
      "Colossus (blob storage + erasure coding), Bigtable/Spanner (metadata), Dataflow (transcode/label pipeline). 'Design Google Photos' and 'estimate Google Photos storage' are reported prompts.",
  },
  {
    title: "Design a global real-time chat/messaging service (WhatsApp/Google Chat scale)",
    tag: "product",
    asked: true,
    prompt:
      "1:1 and group messaging, multi-device delivery, presence/typing, read receipts, offline delivery, and message history sync across devices.",
    crux:
      "(1) Delivery model: persistent connections (WebSocket/QUIC) + a per-user routing/session layer, and how you route a message to the right gateway. (2) Multi-device fan-out and ordering: per-conversation sequence numbers and idempotent, exactly-once-perceived delivery with dedupe. (3) Storage: durable message log + per-device delivery cursors and history sync. (4) Group fanout and read receipts at scale (small groups vs mega-groups).",
    outline: `REQ    send/receive 1:1 + group, multi-device, presence, read receipts, offline
       store-and-forward, ordered per conversation
SCALE  2B users / 1B DAU, ~100B msgs/day (~1.2M msgs/s), tens of millions of
       concurrent connections
API    WebSocket send(convId, msg, clientMsgId); ack(seq); sync(convId, sinceSeq)
DATA   message log per conversation in Bigtable/Spanner keyed (convId, seq);
       per-(user, device) delivery cursor; connection registry mapping
       user -> gateway in a fast KV
ARCH   client <-> edge gateway (holds long-lived conn) <-> message service; on send,
       assign monotonic per-conv seq, persist, then fan out to recipients' online
       gateways via Pub/Sub, and store for offline devices; on reconnect, device
       syncs from last-acked seq
DEEP   per-conversation sequencing for ordering, idempotency via clientMsgId
       dedupe, presence via heartbeats + TTL, group fanout (fan-out-on-write for
       small, pull for mega-groups), E2E encryption boundary
OPS    gateway failover + connection re-establishment, at-least-once + client
       dedupe = exactly-once perceived, backpressure on slow devices, hot
       mega-group, message retention/TTL, multi-region routing + home-region
       for a conversation`,
    failures:
      "Duplicate delivery on retries; out-of-order messages across devices; connection-registry staleness after gateway crash; mega-group fanout amplification; presence flapping; lost messages if persisted-before-ack ordering is violated; cross-region split-brain on conversation ownership.",
    reference:
      "Spanner/Bigtable (durable message log), Pub/Sub (fan-out to gateways), Chubby/Slicer (gateway session ownership); connection layer akin to Google Front End.",
  },
  {
    title: "Design YouTube",
    tag: "product",
    asked: true,
    prompt:
      "Users upload videos that are transcoded into multiple renditions, stored durably, streamed globally with adaptive bitrate, searched, and recommended. Support view counting and creator analytics.",
    crux:
      "(1) Upload + async transcode pipeline (multiple codecs/resolutions, ABR segmenting) and how you decouple ingest from processing. (2) Storage + global delivery: blob storage for segments + a multi-tier CDN with cache-fill and popularity-based placement. (3) Metadata + search/recommendation split from the media path. (4) Accurate, scalable view counting (approximate real-time + exact batch reconciliation).",
    outline: `REQ    upload, transcode to ABR renditions, durable store, global low-latency
       streaming, search, recommend, view counts + analytics
SCALE  2B users, ~500 hours uploaded/min, billions of views/day, exabytes stored,
       egress-dominated
API    initUpload/resumable; getManifest(videoId) -> HLS/DASH manifest; segments
       served by CDN
DATA   raw + transcoded segments in blob store (Colossus); metadata (title, owner,
       renditions, ACL) in Bigtable/Vitess-style store; search index inverted;
       view events in a stream
ARCH   upload -> ingest -> queue -> transcode workers (chunked, parallel) ->
       segments to blob store + manifest; playback -> CDN edge (cache-fill from
       origin on miss) with ABR client selecting rendition; recommendation +
       search served separately
DEEP   chunked parallel transcode + priority for popular creators, CDN
       tiering/hot-content prepositioning, ABR manifest generation, view-count
       pipeline (streaming approximate counter + periodic exact batch reconcile
       to avoid double counting), thumbnail/preview generation
OPS    transcode retries/idempotency, CDN cache-fill storms on viral videos,
       origin offload, per-region capacity, DRM/geo-blocking, copyright/ContentID
       scan, cost of egress`,
    failures:
      "Transcode backlog for viral uploads; CDN cache-fill storm (thundering herd) on newly viral video; inflated/duplicated view counts; origin overload on cache miss; storage cost blowup from too many renditions; geo/DRM leakage.",
    reference:
      "Colossus (segment storage), Bigtable (metadata), Dataflow (transcode orchestration + view-count pipeline), Google Global Cache / edge CDN. 'Design YouTube' and 'increase YouTube users' are reported prompts.",
  },
  {
    title: "Design a real-time ride-hailing dispatch service (Uber/Lyft scale)",
    tag: "product",
    asked: true,
    prompt:
      "Drivers stream GPS location continuously; when a rider requests, match to the nearest suitable available driver within seconds; track the trip lifecycle.",
    crux:
      "(1) Geospatial indexing of moving drivers for fast nearest-neighbor queries (grid/geohash vs Google S2 cells vs quadtree) and how you keep it fresh under a firehose of updates. (2) High-write ingestion of driver location vs read for matching (in-memory index sharded by region). (3) Matching algorithm + avoiding double-dispatch of the same driver (locking/atomic claim). (4) Consistency of trip state (strong) vs location (best-effort).",
    outline: `REQ    ingest driver locations, nearest-available match in <~2s, trip lifecycle
       (request -> match -> pickup -> complete), surge/ETA
SCALE  ~10M active drivers, location every ~4s -> ~2.5M updates/s; peak request
       bursts by region
API    updateLocation(driverId, lat, lng); requestRide(riderId, loc) -> match;
       trip state transitions
DATA   live location in a sharded in-memory geo-index keyed by S2 cell / geohash;
       driver availability flag; trip records in a strongly-consistent store
       (Spanner)
ARCH   location firehose -> regional ingest -> per-region in-memory geo-index
       (sharded by cell); dispatch service queries index for candidates in nearby
       cells, ranks by ETA, then ATOMICALLY claims a driver (compare-and-set on
       availability) to prevent double-dispatch; trip service persists lifecycle
       transactionally
DEEP   S2/geohash cell indexing + neighbor cell search, sharding by geography +
       hot-cell handling (dense city center), atomic driver claim +
       timeout/reoffer, ETA via routing service, surge pricing signal
OPS    stale locations (TTL/last-seen), region failover, dispatch retry/timeout +
       re-offer to next candidate, idempotent request handling, thundering herd
       at event let-out, cross-region trips`,
    failures:
      "Double-dispatching one driver to two riders; hot geo-cell in dense areas overwhelming a shard; stale driver locations causing bad matches; matching latency spikes on request bursts; lost trip-state on failover; index rebuild after region crash.",
    reference:
      "S2 geometry library (geospatial cells), Spanner (transactional trip state), Bigtable/in-memory store (location), Maglev (LB). Reported as 'nearest-available-taxi' / 'global ride-hailing'.",
  },
  {
    title: "Design a search autocomplete / typeahead service",
    tag: "product",
    asked: true,
    prompt:
      "As a user types a prefix, return the top-k most-likely completions with sub-100ms latency at very high QPS, personalized and updated with fresh trends.",
    crux:
      "(1) Data structure for prefix -> top-k: precomputed trie with top-k cached at each node vs ternary/FST; serve from memory. (2) Offline build vs online freshness: batch-built index from query logs + a fast path for trending/new terms. (3) Ranking signals (frequency, recency, personalization, geo) and where they are applied. (4) Latency budget: sharding the trie + edge caching + debounce.",
    outline: `REQ    given prefix, return top-k completions, <100ms p99, very high QPS, fresh
       (minutes) + spellcorrect/personalize
SCALE  ~100K+ suggestion QPS, billions of historical queries, prefix space huge
API    suggest(prefix, userCtx, k) -> [completions]
DATA   trie/FST where each node stores precomputed top-k completions with scores;
       built offline from query-frequency logs; hot/trending overlay in a
       fast store
ARCH   offline pipeline aggregates query logs (Dataflow/MapReduce) -> builds
       sharded prefix index with per-node top-k -> pushed to in-memory serving
       replicas; online: request -> edge cache -> suggest service (routes to
       shard owning prefix) -> merge with trending overlay -> personalize/rerank
       -> return
DEEP   per-node top-k caching to avoid subtree scans, index sharding by prefix
       range + replication for hot prefixes, incremental/trending updates without
       full rebuild, personalization via user/session signal applied at rerank,
       typo tolerance (edit-distance/fuzzy)
OPS    index build lag, hot-prefix replication, stale-vs-fresh tradeoff, graceful
       degradation to non-personalized, poisoning/abuse filtering, memory
       footprint per replica`,
    failures:
      "Hot popular prefixes overloading a shard; index build lag making suggestions stale; memory blowup of top-k-at-every-node; trending terms not surfacing fast enough; abusive/offensive suggestions leaking; latency spikes from personalization lookups.",
    reference:
      "Bigtable/in-memory serving (index), Dataflow/MapReduce (offline build from logs); serving akin to Google Suggest. Reported as autocomplete/typeahead.",
  },
  {
    title: "Design a global multi-channel notification system",
    tag: "product",
    asked: true,
    prompt:
      "Internal services request notifications that must be delivered to users via push (APNs/FCM), email, and SMS. Support user preferences, rate limiting/quiet hours, templating, deduplication, and delivery tracking.",
    crux:
      "(1) Ingestion + queue design decoupling producers from per-channel delivery workers, with per-channel isolation so one slow provider does not block others. (2) Exactly-once-ish delivery: idempotency keys + dedupe so retries/duplicate events do not double-notify. (3) User preference + rate-limit/quiet-hours evaluation and priority classes. (4) Third-party provider failure handling: retries with backoff, DLQ, provider failover.",
    outline: `REQ    send(userId, template, channelPrefs), respect prefs/quiet-hours/rate-limits,
       dedupe, multi-provider, track delivery, prioritize (OTP > marketing)
SCALE  ~10B notifications/day (~120K/s), spiky, many providers
API    notify(userId, templateId, data, priority, idempotencyKey)
DATA   notification requests in a durable queue (Pub/Sub); user prefs + contact
       endpoints in a store; dedupe/idempotency keys in a fast KV with TTL;
       delivery status in Bigtable
ARCH   producers -> ingestion service (validate + dedupe by idempotencyKey) ->
       per-channel topic -> channel workers (render template, check
       prefs/rate-limit/quiet-hours) -> provider adapter (APNs/FCM/email/SMS) ->
       record status; retries via backoff queue + DLQ
DEEP   idempotency + dedupe window, per-user rate limiting + quiet hours (token
       bucket keyed by user+channel), priority queues (separate high-priority
       path for OTP), template rendering + localization, provider abstraction +
       failover
OPS    provider outage (circuit-break + failover), retry storms, DLQ + replay,
       delivery-receipt reconciliation, preference-change consistency,
       abuse/spam throttling, at-least-once + dedupe = no double sends`,
    failures:
      "Duplicate notifications from retries without dedupe; provider outage backing up one channel and starving others; retry storms; missed quiet-hours/rate-limits sending spam; lost high-priority OTP behind marketing backlog; stale preferences.",
    reference:
      "Pub/Sub (durable queue + fan-out), Bigtable (status/history), Spanner/KV (idempotency + prefs); rate limiting akin to Doorman. Reported as 'global real-time notification system' (Senior+).",
  },
  {
    title: "Design a payment processing / transaction system",
    tag: "product",
    asked: false,
    prompt:
      "Charge a payer, credit a payee, integrate external processors/PSPs, guarantee exactly-once money movement, maintain an auditable double-entry ledger, and handle refunds/disputes. Correctness and consistency dominate over raw scale.",
    crux:
      "(1) Exactly-once semantics with idempotency keys so a retried charge never double-charges. (2) Strong consistency + atomic ledger updates: double-entry bookkeeping in a transactional store, and how you avoid partial money movement. (3) Coordinating with external PSPs (non-transactional, async) via a saga/state machine + reconciliation. (4) Consistency vs availability: payments favor consistency (fail-closed).",
    outline: `REQ    authorize + capture, transfer between accounts, exactly-once, double-entry
       ledger, refunds/disputes, audit + reconciliation, idempotent
SCALE  modest QPS (~10K TPS) but zero tolerance for lost/duplicated money;
       multi-region
API    charge(idempotencyKey, payer, payee, amount, currency); refund(txnId)
DATA   accounts + immutable double-entry ledger (append-only, debits == credits)
       in a strongly-consistent store (Spanner); idempotency-key table; payment
       state machine
ARCH   request -> payment service checks idempotency key -> begins transaction ->
       writes pending ledger entries -> calls external PSP asynchronously (saga)
       -> on PSP confirm, commit ledger as settled; failures compensate. Money
       movement is an ACID transaction; external calls wrapped in a state machine
       with reconciliation
DEEP   idempotency key dedupe + returning original result on retry, double-entry
       invariant + balance derived from ledger, saga/compensation for PSP
       failures, TrueTime-backed cross-region transactions, exactly-once via
       unique constraint on (idempotencyKey)
OPS    PSP timeout ambiguity (unknown state -> reconcile, never assume), retries
       must be idempotent, ledger immutability + audit, daily reconciliation
       against PSP statements, dispute/chargeback flow, fraud checks, fail-closed
       on uncertainty`,
    failures:
      "Double-charge on retried request without idempotency; partial money movement (debit without credit) on crash mid-transaction; ambiguous PSP timeout treated as success; ledger drift vs external statements; refund applied twice; cross-region inconsistency.",
    reference:
      "Spanner / F1 (globally-consistent ACID ledger with TrueTime) - Google Ads billing runs on Spanner/F1; Pub/Sub for async PSP orchestration. Canonical, highly relevant to Google Cloud.",
  },
  {
    title: "Design the backend for a real-time collaborative document editor (Google Docs)",
    tag: "product",
    asked: true,
    prompt:
      "Many users edit the same document concurrently with sub-second convergence, offline edits that merge on reconnect, presence/cursors, and full version history.",
    crux:
      "(1) Concurrency-control model: Operational Transformation (OT, what Docs uses) vs CRDTs; how you guarantee all replicas converge to the same state. (2) Server as ordering authority: per-doc sequencing + transforming incoming ops against concurrent ones. (3) Offline edits + merge on reconnect (rebase op stream against server history). (4) Persistence: op log + periodic snapshots, and fanout to collaborators.",
    outline: `REQ    concurrent editing, <1s convergence, offline + merge, presence/cursors,
       history/undo, ACL sharing
SCALE  millions of concurrent docs, up to hundreds of editors on a hot doc,
       low-latency ops
API    WebSocket sendOp(docId, op, baseRevision); receiveOps; presence
DATA   per-doc ordered op log keyed (docId, revision) + periodic snapshots in
       blob/Spanner; session/presence in memory
ARCH   client connects to a doc session server that OWNS the doc (single-writer
       per doc via lock/lease); client sends op with baseRevision; server
       transforms it against ops since baseRevision (OT), assigns next revision,
       persists to op log, broadcasts to other collaborators; snapshots compact
       the log. Single-owner-per-doc avoids distributed consensus on ordering
DEEP   OT transform function correctness/convergence, per-doc single-writer
       ownership (lease via Chubby-like), offline reconnect = rebase local ops
       onto server head, snapshot + log compaction, presence/cursor broadcast,
       ACL checks
OPS    session-server failover (re-elect owner, replay log), op-log durability
       before ack, hot-doc scaling limits, undo/redo semantics, large-doc memory,
       convergence bugs from bad transforms`,
    failures:
      "Divergence/non-convergence from incorrect OT/CRDT transforms; lost ops if broadcast precedes durable persist; doc-owner failover replay gaps; hot-doc (hundreds of editors) overloading single owner; offline-merge conflicts; unbounded op-log without compaction.",
    reference:
      "Spanner/blob (op log + snapshots), Chubby/Slicer (per-doc single-writer lease), Pub/Sub (op broadcast). Real Google Docs uses OT. Reported as 'Google Docs real-time editing backend with offline + merge'.",
  },
  {
    title: "Design a connection-degree service for a professional network (LinkedIn-style)",
    tag: "product",
    asked: true,
    prompt:
      "Given millions of users each with hundreds of connections, when a viewer opens any profile, instantly show whether that person is a 1st-, 2nd-, or 3rd-degree connection. Sub-100ms at read time.",
    crux:
      "(1) Precompute vs on-the-fly graph traversal: full 3rd-degree materialization is O(connections^3) and explodes, so bound it (bidirectional BFS from viewer and target, meet in the middle). (2) Graph storage + sharding of adjacency lists, and caching 1st/2nd-degree sets for active users. (3) Freshness vs cost: new connections should reflect quickly without recomputing everyone. (4) Read latency budget: cap traversal, cache 2nd-degree, short-circuit.",
    outline: `REQ    degree(viewer, target) in {1, 2, 3, >3}, <100ms, billions of profile
       views/day, graph mutates
SCALE  ~1B users, avg ~500 connections -> 2nd-degree ~250K, 3rd-degree in the
       tens of millions (must bound)
API    getDegree(viewerId, targetId)
DATA   adjacency lists in a sharded graph/KV store (userId -> connectionIds);
       per-user 1st-degree set cached; optionally cached compressed 2nd-degree
       set (Bloom filter / roaring bitmap) for active users
ARCH   on profile open, compute via BIDIRECTIONAL BFS: expand viewer's neighbors
       (degree 1) and target's neighbors, check intersection for degree 2; extend
       one more hop for degree 3, but bound fanout and use the cached/Bloom
       2nd-degree set to answer in O(1)-ish. Precompute 1st + (approx) 2nd degree
       offline for active users; compute 3rd on demand with caps
DEEP   bidirectional search to avoid cubic blowup, Bloom filter for 2nd-degree
       membership (accept small false-positive), adjacency-list sharding +
       supernode (high-degree) handling, incremental update on new connection
       (invalidate/patch cached sets), consistency (slightly stale degree
       acceptable)
OPS    supernodes (users with 30K connections) blowing up traversal, cache
       invalidation on new connections, cross-shard fanout latency, graceful cap
       to 3rd+ = 'out of network', graph store hotspots`,
    failures:
      "Cubic blowup computing 3rd degree; supernode fanout latency; stale degree after new connection; Bloom-filter false positives mislabeling degree; cross-shard traversal latency; cache memory blowup for 2nd-degree sets.",
    reference:
      "Zanzibar (Google's global authorization system, whose relation-tuple model handles transitive membership checks, an analogous problem), Bigtable (adjacency), Pregel (offline graph compute). Reported verbatim on Exponent.",
  },
  {
    title: "Design a globally-distributed, strongly-consistent key-value / relational store (Spanner/Bigtable-class)",
    tag: "infra",
    asked: true,
    prompt:
      "Externally-consistent transactions across regions, horizontal scale to petabytes and millions of QPS, automatic sharding + rebalancing, and configurable replication.",
    crux:
      "(1) Consistency model: strong/external consistency (linearizable, Spanner-style) vs eventual (Dynamo-style) - and how you order transactions globally (Paxos per shard + TrueTime commit-wait vs vector clocks). (2) Sharding + rebalancing: how data is split into tablets/ranges and moved without downtime (hot-partition splits). (3) Replication + consensus: Paxos/Raft groups per shard, leader leases, quorum. (4) Cross-shard distributed transactions (2PC over Paxos groups).",
    outline: `REQ    get/put + range scans, cross-row/cross-shard ACID transactions, 5-9s
       availability, PB-EB scale, geo-replication, tunable consistency
SCALE  PB-EB data, millions QPS, cross-region RTT ~tens-hundreds ms
API    read(key)/write(key, val), begin/commit txn, range(startKey, endKey)
DATA   keyspace split into contiguous key ranges (tablets); each tablet replicated
       via a Paxos group (leader + followers across zones); a metadata/location
       service maps key -> tablet -> replicas
ARCH   client -> locate leader replica of the tablet -> leader serves reads from
       local + commits writes through Paxos quorum; for external consistency use
       TrueTime commit-wait (wait out clock uncertainty so timestamps order
       globally); cross-shard txn = 2PC where each participant is a Paxos group
       (coordinator logs decision). Auto-sharder splits/merges/moves tablets
       on load
DEEP   Paxos leader leases + reads, TrueTime bounded-uncertainty commit-wait for
       linearizability, tablet split on hot key + rebalancing, 2PC-over-Paxos for
       multi-shard atomicity, snapshot/MVCC reads at a timestamp
OPS    leader failover (lease expiry + re-elect), replica repair/re-replication,
       hot-tablet detection + split, clock-uncertainty spikes widening
       commit-wait, quorum loss (minority partition), backup/restore + PITR,
       schema change online`,
    failures:
      "Hot tablet / hot key overwhelming one Paxos leader; clock-skew (TrueTime uncertainty) inflating commit latency; leader-lease + split-brain under partition; 2PC coordinator failure blocking cross-shard txns; rebalancing thrash; quorum loss on multi-zone outage.",
    reference:
      "Spanner (TrueTime + Paxos + external consistency), Bigtable (tablet model, wide-column), Chubby (leader election/locks), Colossus (underlying storage). Reported as 'design a key-value store' / 'geographically distributed database'.",
  },
  {
    title: "Design a distributed blob / object store (GFS/Colossus-class)",
    tag: "infra",
    asked: true,
    prompt:
      "Store exabytes of immutable large objects durably, high aggregate read/write throughput, erasure coding for space-efficient durability, and metadata for billions of objects. Serve as the storage substrate for higher-level services.",
    crux:
      "(1) Metadata scaling: a single master is a bottleneck (GFS) - how you scale the metadata plane (sharded metadata service / Colossus's approach) separately from data. (2) Chunking + placement: split objects into chunks, replicate or erasure-code across failure domains (racks/zones). (3) Durability strategy: replication (3x) vs erasure coding (e.g., Reed-Solomon) tradeoff of cost vs recovery. (4) Consistency of writes + the read/repair path.",
    outline: `REQ    put/get/delete large immutable objects, durable (11+ 9s), high throughput,
       erasure-coded, exabyte scale, self-healing
SCALE  exabytes, chunk size ~MBs-64MB, billions of objects, thousands of
       storage nodes
API    createObject -> writeChunk(s) -> finalize; readObject(range)
DATA   metadata (object -> chunk list -> locations) in a scalable metadata store
       (Bigtable-like, NOT a single master); chunks on chunkservers' local disks
ARCH   client asks metadata service where to write -> streams chunks directly to
       chunkservers (data plane bypasses metadata) -> chunkservers store + the
       system erasure-codes across failure domains -> metadata records locations
       after durable write. Reads: client gets locations from metadata, reads
       chunks directly (+ reconstruct from parity on failure). Background:
       rebalancer + re-replication/re-encode on node loss
DEEP   separating control plane (metadata) from data plane, erasure coding vs
       replication (space 1.5x vs 3x, recovery cost), placement across
       racks/zones for correlated-failure isolation, write pipeline + checksums,
       garbage collection of orphaned chunks
OPS    chunkserver failure -> re-replicate/re-encode, metadata-service scaling +
       sharding, silent data corruption (checksums + scrubbing), rebalancing hot
       nodes, correlated failures (power/rack), slow-disk tail latency,
       deletion + GC lag`,
    failures:
      "Metadata-plane bottleneck/hotspot (the classic GFS single-master limit); correlated failures wiping multiple replicas in one domain; silent bit-rot without scrubbing; re-replication storms saturating network after a node loss; orphaned-chunk leakage; slow-disk tail latency.",
    reference:
      "Colossus (successor to GFS: distributed metadata + erasure coding), GFS (chunking, chunkservers). Reported as 'distributed file system'.",
  },
  {
    title: "Design a large-scale distributed rate limiter",
    tag: "infra",
    asked: true,
    prompt:
      "Enforce per-user / per-API-key / per-endpoint request limits across a globally-distributed fleet of servers, with minimal added latency, accurate-enough global counting, and graceful behavior under limiter failure.",
    crux:
      "(1) Algorithm: token bucket vs sliding-window-log vs sliding-window-counter - precision vs memory/cost. (2) Local vs global enforcement: purely local per-node limits are inaccurate at fleet scale; global shared counters add latency - the hybrid (local buckets that periodically sync/borrow from a global authority, Doorman-style). (3) Where counters live (in-memory shard/Redis) + hot-key sharding for popular keys. (4) Fail-open vs fail-closed when the limiter store is down.",
    outline: `REQ    allow/deny per key against a configured rate, <1ms overhead, distributed
       enforcement, near-accurate globally, dynamic limits
SCALE  ~10M+ rps across fleet, millions of distinct keys, hot keys
API    allow(key, cost) -> bool + retryAfter
DATA   token buckets keyed by (limitKey) in a fast shared store (in-memory/Redis)
       sharded by key; config of limits in a config service
ARCH   each server keeps a LOCAL token bucket for a key and periodically
       reconciles with a GLOBAL counter authority that allocates capacity across
       servers (cooperative distribution, Doorman-style): server requests a share
       of the global rate, enforces locally, renews. Alternatively, centralized
       atomic INCR with sliding window for strict cases
DEEP   token-bucket math + refill, cooperative global capacity allocation to
       bound cross-node chatter, hot-key sharding/replication,
       sliding-window-counter to smooth boundary bursts, dynamic limit push from
       config service
OPS    limiter store outage -> fail-open (availability) vs fail-closed
       (protection) per endpoint criticality, clock skew across nodes, hot-key
       contention, over/under-counting under races, graceful degradation to
       local-only limits, observability of throttle rate`,
    failures:
      "Inaccurate global counts from local-only enforcement; boundary bursts (2x limit at window edges) with fixed windows; hot-key contention on a single counter shard; limiter-store outage causing either outage (fail-closed) or overload (fail-open); clock skew corrupting windows.",
    reference:
      "Doorman (Google's cooperative global distributed rate limiter), Chubby/config service (limit config), in-memory counter store. Reported as 'large-scale distributed rate limiter' (Senior+).",
  },
  {
    title: "Design a distributed in-memory cache (Memcached/Redis-cluster class)",
    tag: "infra",
    asked: true,
    prompt:
      "Fronting a slower backing store: sub-millisecond reads at millions of QPS, TB-PB working sets across many nodes, consistent hashing for placement, and coherent behavior with the source of truth.",
    crux:
      "(1) Sharding/placement: consistent hashing (with virtual nodes) so adding/removing nodes moves minimal keys. (2) Cache-coherence with the backing store: write-through vs write-back vs cache-aside + invalidation, and staleness tolerance. (3) Hot-key + thundering-herd protection (replication of hot keys, request coalescing, TTL jitter). (4) Eviction policy (LRU/LFU/TTL) and handling cache-miss stampede on cold start.",
    outline: `REQ    get/set/delete, <1ms p99, high hit-rate, horizontal scale, resilient to
       node loss, bounded staleness
SCALE  millions QPS, TB-PB hot set, thousands of clients
API    get(key) / set(key, val, ttl) / delete(key)
DATA   key -> value in RAM sharded by consistent hash; optional replicas for
       hot keys
ARCH   client library hashes key -> routes to owning node (consistent hashing
       ring with virtual nodes); cache-aside pattern: on miss, client (or a
       coalescing layer) loads from backing store, populates cache; writes
       invalidate or update cache. Node add/remove remaps only ~1/N keys
DEEP   consistent hashing + virtual nodes for balanced/minimal-move rebalancing,
       thundering-herd mitigation (single-flight/request coalescing + lease on
       miss + TTL jitter), hot-key replication/fan-out, eviction (LRU/LFU) +
       memory accounting, invalidation coherence + stale-while-revalidate
OPS    node failure -> miss storm to backing store (protect with coalescing +
       backpressure), cold-cache warmup, cache/DB inconsistency window,
       big-key/hot-key imbalance, client-side vs proxy topology, monitoring
       hit-rate + eviction rate`,
    failures:
      "Cache stampede/miss storm to the backing store on node loss or cold start; hot-key overloading one shard; stale reads from invalidation races; unbalanced shards without virtual nodes; memory pressure causing thrash-eviction; big-key blowing a node.",
    reference:
      "No single named public Google system (internal caching tiers front Bigtable/Spanner); pattern akin to Memcached/Redis Cluster with consistent hashing. Reported verbatim as 'Distributed Cache System'.",
  },
  {
    title: "Design a distributed pub/sub messaging system (Kafka / Google Cloud Pub/Sub class)",
    tag: "infra",
    asked: true,
    prompt:
      "Producers publish to topics, many consumer groups subscribe, at-least-once delivery, ordered-per-key, durable retention with replay/seek-to-timestamp, and horizontal scale to millions of messages/sec.",
    crux:
      "(1) Partitioning + ordering: partition topics by key for parallelism while preserving per-key order; how many partitions and rebalancing consumers. (2) Delivery semantics: at-least-once (+ consumer idempotency) vs exactly-once, and ack/offset tracking. (3) Durable log storage + retention + replay (seek by offset/timestamp). (4) Consumer group rebalancing + offset management + backpressure for slow consumers.",
    outline: `REQ    publish(topic, key, msg), subscribe (consumer groups), at-least-once,
       per-key order, durable retention (days) + replay, millions msgs/s
SCALE  millions msgs/s, thousands of topics/partitions, TB-PB retained
API    publish(topic, key, payload); poll(subscription) -> batch; ack(offset);
       seek(timestamp)
DATA   each topic split into partitions; each partition = an append-only
       replicated log (offsets); consumer offsets stored durably
ARCH   producer hashes key -> partition -> append to that partition's leader
       (replicated to followers via quorum/ISR); consumers in a group each own a
       subset of partitions, read sequentially, commit offsets; brokers retain
       the log for the retention window enabling replay/seek. Decouples
       producers from consumers
DEEP   partition leader replication + ISR/quorum for durability, consumer-group
       rebalancing + sticky assignment, at-least-once + idempotent consumer (or
       exactly-once via idempotent producer + transactional commit), offset
       management + replay/seek-to-timestamp, retention/compaction
OPS    broker failure -> leader re-election + follower catch-up, hot partition /
       key skew, consumer lag + backpressure, rebalance storms, duplicate
       delivery on redelivery (consumer dedupe), poison messages -> DLQ,
       ordering violated if key repartitioned`,
    failures:
      "Hot partition from skewed keys; consumer lag blowing up under slow consumers; rebalance storms disrupting delivery; duplicate delivery without idempotent consumers; ordering loss when repartitioning; broker leader-election gaps; unbounded retention filling disk.",
    reference:
      "Google Cloud Pub/Sub (managed pub/sub), and log model akin to Kafka; Colossus (log storage), Chubby (leader election). Reported as 'pub-sub replay system' / 'distributed message queue service'.",
  },
  {
    title: "Design a logs + metrics ingestion and monitoring pipeline (Monarch/Prometheus + logging class)",
    tag: "infra",
    asked: true,
    prompt:
      "Thousands of services emit structured logs and time-series metrics; collect, process within ~1 minute, store time-series efficiently, serve dashboards/queries and alerting at massive cardinality.",
    crux:
      "(1) Push vs pull collection of metrics and how you shard the ingestion firehose; separate the metrics (time-series) path from the logs (high-volume text) path. (2) Time-series storage: in-memory recent + downsampled/rolled-up historical, and handling high cardinality (label explosion). (3) Freshness SLO (under 1 min) vs cost: streaming aggregation + approximate structures (HLL for cardinality). (4) Query + alerting engine over the TS store, and retention/downsampling tiers.",
    outline: `REQ    ingest metrics + logs, process/queryable within ~1 min, dashboards +
       ad-hoc queries + alerting, huge cardinality, multi-region
SCALE  trillions of points/day, ~100M+ active time series, PB of logs
API    write(metric, labels, value, ts); query(promql-like, range); logs search
DATA   metrics in a columnar/TS store sharded by (metric, label-set) with recent
       data in memory + rolled-up historical on disk; logs in an indexed store
       (inverted index + blob)
ARCH   agents on each host push metrics/logs -> regional ingestion/aggregation
       tier (Dataflow-style streaming) -> shard by series key, do streaming
       rollups (per-minute) -> write to TS store (hot in-mem, cold downsampled)
       + logs to index; query layer fans out to shards + merges; alerting engine
       evaluates rules on the stream/TS
DEEP   sharding TS by label hash + hot-series handling, cardinality control
       (label limits, HyperLogLog for distinct counts), downsampling/retention
       tiers (1s -> 1m -> 1h), streaming aggregation for <1min freshness, alert
       rule evaluation + dedupe/grouping
OPS    ingestion backpressure + sampling under overload, cardinality explosion
       protection, query fanout tail latency, region failover + local buffering,
       late/out-of-order data, retention cost, alert storms/flapping`,
    failures:
      "Cardinality explosion (unbounded labels) blowing up memory/index; ingestion backpressure dropping data under spikes; query fanout tail latency; late/out-of-order points corrupting rollups; alert storms/flapping; retention cost blowup; monitoring-of-monitoring circular dependency.",
    reference:
      "Monarch (Google's in-memory global time-series/metrics system), Dapper (tracing), Dataflow (streaming aggregation), Colossus (log storage). Reported as 'logs and metrics pipeline' / 'metrics and logging service' / 'server health monitoring'.",
  },
  {
    title: "Design a distributed batch/job scheduler and cluster manager (Borg/Kubernetes class) plus a reliable distributed cron",
    tag: "infra",
    asked: true,
    prompt:
      "Schedule millions of tasks with dependencies (DAGs) and recurring/cron jobs across hundreds of thousands of machines, bin-pack for utilization, respect priorities/quotas, and never miss or double-fire a job.",
    crux:
      "(1) Scheduling/placement: bin-packing tasks onto machines under resource constraints + priorities/preemption + quotas. (2) Reliable-exactly-once firing for cron: leader election (Paxos) + idempotent launches so a leader failover neither misses nor double-fires. (3) State + failure detection: heartbeats, fencing tokens, task restart/rescheduling on machine loss. (4) DAG/dependency execution + retries + backfill.",
    outline: `REQ    submit job (resources, priority, DAG deps, or cron spec), place
       efficiently, run to completion, retries, cron never-miss/never-double,
       quotas
SCALE  100Ks of machines, millions of tasks, high churn
API    submitJob(spec), cronSpec(schedule, cmd), status(jobId)
DATA   desired-state + task state in a replicated store; machine inventory +
       resource availability; cron schedule + next_run + last_launch in a
       consistent store
ARCH   a replicated master (leader via Paxos) holds cluster state; scheduler
       matches pending tasks to machines (bin-pack + priority + constraints),
       sends to per-machine agents that run + heartbeat; on machine/agent
       failure, tasks rescheduled. CRON: leader replica launches jobs; each
       launch is ANNOUNCED via Paxos before and CONFIRMED after (synchronization
       points) with an idempotent name (schedule timestamp) so a new leader can
       query downstream state and resubmit only truly-missed launches -
       fail-closed (skip) over double-fire
DEEP   bin-packing + preemption of low-priority, Paxos leader election + lease,
       idempotent cron launch + fencing token, heartbeat-based failure detection
       + reschedule, DAG dependency resolution + backfill, quota/fairness
OPS    leader failover within the cron period (1-min window), partial-launch
       ambiguity (query scheduler state), machine failures + task migration,
       straggler/stuck tasks, scheduling thundering herd, priority inversion,
       snapshot + log state recovery`,
    failures:
      "Double-firing a cron job across leader failover; missed job when leader dies mid-launch; scheduler hot spot / placement thrash; priority inversion + starvation of low-priority; stuck/straggler tasks holding resources; split-brain two leaders launching; state loss on master failover.",
    reference:
      "Borg (cluster manager/scheduler, bin-packing, priorities/quota), Google's distributed Cron (Paxos leader + idempotent launches, SRE book), Chubby (leader election), Kubernetes (open-source lineage). Reported as 'task scheduler with dependencies' / 'distributed job scheduler'.",
  },
  {
    title: "Design a distributed configuration + coordination / lock service (Chubby / ZooKeeper class) that also powers feature flags",
    tag: "infra",
    asked: true,
    prompt:
      "Strongly-consistent small-data store, distributed locks + leader election for clients, watch/notify on changes, and globally-consistent config/feature-flag rollout. High read volume, correctness-critical.",
    crux:
      "(1) Consensus for a strongly-consistent replicated store: Paxos/Raft group, leader handles writes, followers serve reads. (2) Locks + sessions: lease-based locks with fencing tokens (so a paused lock-holder cannot corrupt state after its lease expires) + client sessions/keepalives. (3) Read scalability: caching + watches/invalidation vs consistency (client caches with lease + invalidation on change). (4) Global consistency of config/flag rollout vs staged/percentage rollout.",
    outline: `REQ    read/write small config values, acquire/release locks, leader election,
       watch/notify, feature-flag targeting + staged rollout, strong consistency
SCALE  small data (MBs), very high read QPS, ~thousands-10Ks of client sessions,
       correctness > throughput
API    read(path) / write(path, val, version-CAS), acquireLock(path, session),
       watch(path), getFlag(name, ctx)
DATA   hierarchical namespace (files/dirs) replicated via Paxos; sessions +
       ephemeral lock nodes; flag definitions + targeting rules
ARCH   a small Paxos group (5 replicas) elects a master that serializes all
       writes; clients maintain sessions (keepalive) and CACHE reads locally,
       with the master invalidating caches on change (watches) to preserve
       consistency; locks are lease-based ephemeral nodes released on session
       loss; flags read via the same consistent config plane, with rollout done
       by targeting rules evaluated client-side
DEEP   Paxos write path + master lease, fencing tokens for locks (monotonic
       counter) to prevent stale-holder corruption, client cache + watch
       invalidation for read scale, session keepalive + ephemeral node cleanup,
       staged/percentage flag rollout + consistent snapshot
OPS    master failover (lease expiry + re-elect), session expiry semantics
       (clients must handle lock loss), watch delivery under partition,
       thundering-herd on mass cache invalidation, config-change blast radius
       (bad flag brings everyone down -> canary + fast rollback), quorum loss`,
    failures:
      "Stale lock-holder acting after lease expiry without fencing (data corruption); global bad-config/flag push causing fleet-wide outage (blast radius); thundering herd on mass watch invalidation; master-failover write unavailability; session-expiry surprises releasing locks; quorum loss on multi-zone failure.",
    reference:
      "Chubby (Google's Paxos-based lock + small-config service, coarse-grained locks, leader election), plus a feature-flag layer (the prompt is reported as 'globally consistent configuration management / FlagService' / 'distributed lock manager').",
  },
  {
    title: "Design a web-scale search index + crawler",
    tag: "infra",
    asked: true,
    prompt:
      "Continuously crawl a large fraction of the web, keep an inverted index fresh (incremental updates), and serve ranked full-text queries with sub-200ms latency at very high QPS.",
    crux:
      "(1) Crawler design: politeness/robots, URL frontier + dedupe (seen-set at billions scale, Bloom filters), freshness prioritization (recrawl scheduling). (2) Index build: batch (MapReduce) full rebuild vs INCREMENTAL indexing (Percolator/Caffeine) so new pages appear in minutes not days. (3) Index sharding + serving: document-partitioned shards, scatter-gather query, ranking. (4) Query latency: shard fanout + top-k merge + caching + tiered index (hot terms).",
    outline: `REQ    crawl + refresh, build inverted index (term -> postings), rank + serve
       full-text queries <200ms, incremental freshness, spam filtering
SCALE  100B+ pages, PB index, high query QPS, continuous crawl
API    query(text) -> ranked docs
DATA   crawled docs + metadata in blob/Bigtable; URL frontier + seen-set;
       inverted index (term -> posting list) sharded by document
ARCH   crawlers pull from a prioritized URL frontier (respect robots, dedupe via
       Bloom/seen-set), fetch, extract links + content -> store; indexing
       converts docs to postings - historically batch (MapReduce) but modern is
       INCREMENTAL (Percolator observers update the index per-doc for
       minute-level freshness); index is document-partitioned into shards; query
       serving scatters to all shards, each returns local top-k, a mixer merges
       + ranks globally, caches hot queries
DEEP   URL frontier prioritization + politeness + dedupe at scale, incremental
       indexing (Percolator/Caffeine) vs batch tradeoff, document-partition
       sharding + scatter-gather + top-k merge, ranking signals + tiered index
       (serve common terms from a hot tier), query + result caching
OPS    crawl traps/spider traps, near-duplicate detection (shingling),
       index-build lag, shard fanout tail latency (backup requests),
       spam/adversarial content, recrawl freshness vs cost, shard failure ->
       serve partial + replicate`,
    failures:
      "Crawl traps / infinite URL spaces exhausting the frontier; index-build lag making results stale; scatter-gather tail latency from one slow shard; near-duplicate/spam pollution; seen-set/Bloom false positives dropping pages; hot-term shard overload.",
    reference:
      "Caffeine + Percolator (incremental indexing), MapReduce (batch build), GFS/Colossus + Bigtable (crawl store), Google Search serving. Reported as 'web crawler' / 'large-scale search'.",
  },
  {
    title: "Design a high-scale API gateway / global edge front-end with a distributed denylist",
    tag: "infra",
    asked: true,
    prompt:
      "Terminate and route 10M+ requests/sec, authenticate + authorize, apply rate-limiting/throttling, and block requests from banned IPs/keys (denylist), all adding minimal latency, fronting many backend services.",
    crux:
      "(1) L4/L7 load balancing + routing: how you spread 10M rps across a fleet with connection affinity and consistent backend selection (Maglev-style consistent hashing) and health-aware routing. (2) Denylist distribution + lookup: a frequently-updated banned-set that every edge node checks in under 1ms (in-memory Bloom filter + backing store, fast propagation). (3) Auth + rate-limit at the edge without a central bottleneck (token validation + cooperative rate limiting). (4) Failure isolation: one bad backend/tenant must not take down the gateway (bulkheads, circuit breakers).",
    outline: `REQ    route + LB, authN/authZ, rate-limit/throttle, denylist banned IPs/keys,
       <10ms overhead, fronts many services, 10M+ rps
SCALE  10M+ rps, global, denylist up to millions of entries updated frequently
API    gateway transparently proxies; admin pushes denylist + routes + limits
DATA   routing/config in a config service (Chubby-like); denylist in-memory
       (Bloom filter + exact set) synced from a central store; rate-limit
       counters in a fast store; auth via token/cert validation
ARCH   anycast/DNS -> L4 LB (Maglev consistent hashing spreads flows, survives
       node changes) -> L7 gateway fleet: each request is checked against the
       in-memory denylist (Bloom filter first, exact confirm), authenticated
       (validate signed token/JWT/mTLS), rate-limited (cooperative global
       limiter), then routed to a healthy backend via consistent hashing +
       health checks. Denylist updates propagate via pub/sub to all edges
       within seconds
DEEP   Maglev consistent hashing for even, resilient backend selection; denylist
       as Bloom filter (accept tiny false-positive -> exact recheck) + fast
       fan-out propagation; edge-local token validation to avoid central auth
       bottleneck; cooperative rate limiting (Doorman-style); circuit breakers +
       outlier ejection per backend
OPS    config/denylist propagation lag, fail-open vs fail-closed on
       auth/denylist store outage, backend overload (load shedding + priority),
       retry storms + hedging, DDoS absorption at edge, per-tenant isolation,
       blast radius of a bad config push (canary)`,
    failures:
      "Denylist propagation lag letting banned traffic through (or a bad push blocking everyone); central auth/rate-limit becoming a bottleneck; one unhealthy backend cascading via retries; DDoS overwhelming the edge; bad config/route push (blast radius); consistent-hash remap storm on fleet change.",
    reference:
      "Maglev (Google's network load balancer, consistent hashing), Google Front End / GFE (edge termination + auth), Doorman (rate limiting), Chubby (config/denylist distribution). Reported as 'API gateway 10M+ rps with throttling and auth' / 'distributed blocking/denylist' / 'deny banned IPs'.",
  },
];

function Design() {
  return (
    <>
      <Lede>
        Twenty system-design prompts reported from Google Staff loops, ten product-scale and ten
        pure infrastructure. Each card gives you the crux (the two or three decisions the round is
        actually about), the requirements-to-deep-dive outline, the failure modes an interviewer
        will probe, and the real Google system to name as your reference. Say the crux before you
        draw anything.
      </Lede>

      {DESIGN_PROMPTS.map((p) => (
        <Block key={p.title} eyebrow="design prompt" title={p.title}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Tag color={ACCENT}>{p.tag}</Tag>
            {p.asked && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                asked @ Google
              </span>
            )}
          </div>
          <p className="text-ink-dim leading-relaxed text-sm mb-3">{p.prompt}</p>
          <p className="text-ink-dim leading-relaxed text-sm mb-1">
            <span
              className="font-mono text-[10px] uppercase tracking-wider mr-2"
              style={{ color: ACCENT }}
            >
              crux
            </span>
            {p.crux}
          </p>
          <CodeBlock title="text" lang="text" code={p.outline} />
          <p className="text-ink-dim leading-relaxed text-sm mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider mr-2 text-ink-faint">
              failure modes
            </span>
            {p.failures}
          </p>
          <p className="text-ink-dim leading-relaxed text-sm">
            <span className="font-mono text-[10px] uppercase tracking-wider mr-2 text-ink-faint">
              reference system
            </span>
            {p.reference}
          </p>
        </Block>
      ))}

      <Callout kind="tip" title="Where the method behind these outlines lives">
        The requirements, scale-math, and deep-dive craft that these outlines compress is worked
        end to end in{" "}
        <a href="#/gcp-design" className="font-mono text-xs" style={{ color: ACCENT }}>
          GCP Design
        </a>
        , and the reliability vocabulary of every failure-modes line (SLOs, error budgets,
        cascading failure, load shedding) is drilled in{" "}
        <a href="#/sre-canon" className="font-mono text-xs" style={{ color: ACCENT }}>
          SRE Canon
        </a>
        . Drill the prompt here, then rehearse the full 45 minutes there.
      </Callout>
    </>
  );
}

/* ── Behavioral bank ──────────────────────────────────────────── */
const BEHAVIORAL_GROUPS = [
  {
    signal: "Leadership and emergent leadership",
    rows: [
      { q: "Have you ever had to demonstrate leadership even though you weren't technically in charge?", framework: "Pick a situation where no one owned a problem and you stepped in before being asked - the 'emergent' part is that leadership was created by the vacuum, not assigned by the org chart. A Staff answer names org-scope stakes (multiple teams, a program at risk), shows you set direction with an artifact others rallied around (a written proposal/design doc), and ends with a durable outcome the org now operates by. Use 'I' for the specific moves (I wrote the design, I convened the leads) and 'we' for the shared win.", scored: "Emergent leadership: did you fill a vacuum through initiative and direction-setting, or wait to be told?" },
      { q: "Tell me about a time you created something from nothing / built something from scratch.", framework: "Choose a zero-to-one effort where you defined the problem worth solving, not just executed a handed-down spec - at Staff the signal is direction-setting (which problems matter) plus getting others to commit. Show the ambiguity at the start, the structure you imposed to make progress, and an org-level result (a system, team, or practice that outlived the project).", scored: "Direction-setting and initiative: can you identify and drive high-value work in a vacuum?" },
      { q: "Tell me about a time you made a bold and difficult decision.", framework: "Pick a decision with real downside and incomplete information where you owned both the call and its consequences. Make the tradeoff explicit (what you gave up, the data you had, why it looked reasonable then), show you brought stakeholders along rather than acting unilaterally, and report the outcome honestly including what you would revisit.", scored: "Judgment under uncertainty and willingness to own consequences." },
      { q: "What project are you most proud of? / Describe your most impactful project.", framework: "Choose the story with the widest blast radius (multi-team, org-level, or company-visible), not the most technically clever one. Lead with the impact and what changed, then your specific leadership role, quantify the result, and make clear the scope reached beyond your immediate team.", scored: "Scope and impact: is your proudest work org-scale or single-team?" },
    ],
  },
  {
    signal: "Ambiguity and ownership",
    rows: [
      { q: "Tell me about a time you had to work on something with significant ambiguity. How did you make progress?", framework: "Show you got curious, not anxious - the exact tell interviewers grade on. Describe how you created structure (broke the problem into knowable pieces, aligned stakeholders on a framework, defined milestones with incomplete data) and iterated as signal arrived, rather than waiting for requirements, and own the outcome not just the tasks.", scored: "Do you thrive in ambiguity by building structure, or freeze waiting for clarity?" },
      { q: "Tell me about a time you solved a problem with completely unclear or incomplete requirements.", framework: "Emphasize the framework you imposed on chaos and the high-judgment calls you made with gaps, then how you validated and course-corrected as data came in. At Staff, show proactive decisions and outcome-ownership across choices others executed under your guidance.", scored: "Comfort with ambiguity plus decision-making frameworks and a bias for action." },
      { q: "Tell me about an inefficient process outside your scope that you improved.", framework: "The 'outside your scope' phrase is the point - pick something no one asked you to fix, showing ownership beyond your lane. Quantify before/after, show root-cause analysis, and describe how you got other teams to adopt the change through influence rather than mandate.", scored: "Ownership beyond assigned tasks and systems thinking." },
      { q: "Tell me about a time you owned a project from beginning to end (did you take responsibility for outcomes, or just tasks?).", framework: "Explicitly distinguish outcome-ownership from task-ownership: own decisions you merely influenced, and own results even when factors you didn't control went wrong. A Staff answer shows accountability across team decisions, not a clean, self-contained personal deliverable.", scored: "Outcome ownership vs task ownership - a primary down-leveling axis at L6." },
    ],
  },
  {
    signal: "Cross-team influence without authority",
    rows: [
      { q: "Tell me about a time you led a project or initiative without having formal authority over the people involved.", framework: "Center the mechanism of influence, not the outcome: a written proposal, a shared metric, a POC, pre-alignment 1:1s with skeptics. Show you moved two or three teams because of how you reasoned and communicated, name the specific objections you overcame, and make the evidence survive follow-ups ('I showed the p99 latency graph,' not 'I convinced them').", scored: "Influence without authority: did the org move because of your persuasion or your position?" },
      { q: "Describe a cross-org project you led from design to delivery.", framework: "Show scope beyond a single team and the full arc - you set the technical direction, aligned PMs and leads across boundaries, and drove execution to a shipped result. Quantify org-level impact and be specific about how you handled the teams that initially disagreed.", scored: "Cross-boundary scope and end-to-end drive at org scale." },
      { q: "How have you influenced your team's or org's direction without a leadership title?", framework: "Build the evidence/business case first, then the relationships and consensus that shifted direction. Show bottom-up change: you reframed the problem, socialized a proposal, and the roadmap moved - with named skeptics you won over via data and active listening, not authority.", scored: "Emergent leadership and consensus-building that actually changes strategy." },
      { q: "Tell me about a time you had to get many stakeholders on the same page.", framework: "Show the alignment method - surfacing each stakeholder's real underlying interest, finding a shared metric, and driving to a decision everyone commits to. At Staff, emphasize the number and seniority of stakeholders and that you created the alignment mechanism (a decision doc, a framework, a forum) rather than just attending meetings.", scored: "Driving alignment across many and senior stakeholders." },
    ],
  },
  {
    signal: "Technical disagreement and conflict",
    rows: [
      { q: "Describe a time you strongly disagreed with a tech lead or manager (someone more senior than you).", framework: "The signal is how you investigate the disagreement, not how you 'won.' Show curiosity over confrontation - you steel-manned their view, brought evidence (a benchmark, a prototype, a graph), disagreed respectfully, and, crucially, committed fully once the decision was made even when it went against you. Staff-level: navigate disagreement with engineers more senior than you.", scored: "Intellectual courage plus disagree-and-commit; investigation over winning." },
      { q: "Tell me about a time you had a conflict with a coworker. How did you resolve it and what did you learn?", framework: "Describe behavior, not personality - avoid any character judgment of the other person. Show empathy-based diagnosis of the root cause, the direct conversation you had, a resolution that repaired the working relationship, and the durable lesson that changed how you operate.", scored: "Constructive conflict resolution and self-awareness, with no blame-shifting." },
      { q: "Give an example of when you pushed back on a popular idea, or challenged the status quo, because you thought it was wrong.", framework: "Explain the popular idea fairly, give your data-supported reason for dissent, and describe your respectful escalation path - then the outcome and lesson, including where you were partly wrong. Show principled dissent backed by evidence and org-level stakes, not contrarianism.", scored: "Principled dissent: challenging the status quo with evidence, not deference or reflex." },
      { q: "Tell me about a time you had to change your approach or your mind based on new information.", framework: "Show you were genuinely invested in a position, then abandoned it when data pointed elsewhere - intellectual humility is the whole signal. Detail the contradicting evidence, your pivot rationale, and the better outcome; this pairs with disagree-and-commit to prove you are principled, not stubborn.", scored: "Intellectual humility and responsiveness to evidence." },
    ],
  },
  {
    signal: "Failure and learning",
    rows: [
      { q: "Tell me about the last time you failed / your biggest professional failure and what you learned.", framework: "Pick a real mistake with visible consequences - not a humblebrag, and not a disaster so severe the learning isn't credible. Explain why the decision seemed reasonable at the time, the signal you missed, and - the core of the answer - the concrete change to your operating method (a design-review gate, rollout criteria, better failure testing) that has held since.", scored: "Accountability and genuine growth: did your method actually change?" },
      { q: "Tell me about a significant mistake that impacted production or your team.", framework: "Own it cleanly with zero deflection, walk the root cause honestly, and show the systemic fix you drove so it can't recur - at Staff the fix should be org-level (a guardrail or process others now use), not 'I was more careful.' Include how you communicated the failure transparently to stakeholders.", scored: "Ownership, blameless root-causing, and systemic rather than personal remediation." },
      { q: "Tell me about a time you recovered a technical decision or architecture that had gone wrong.", framework: "Show you made or inherited a bad architectural bet, diagnosed it without blame, and led the recovery (phased migration or rollback) while managing risk and stakeholder confidence. The recovery narrative only counts if you demonstrate the systemic change that followed, not just the lesson.", scored: "Recovery leadership and risk management on high-stakes technical calls." },
    ],
  },
  {
    signal: "Mentoring and raising the bar",
    rows: [
      { q: "Tell me about a time you helped someone on your team get better at a task, or mentored an engineer.", framework: "Name a specific person and their concrete outcome (promoted, took on staff-level work, unblocked their career) - vague 'I mentor juniors' fails at Staff. Show your diagnosis of what they actually needed, the tailored coaching (guiding, not doing it for them), and the multiplier effect on the team.", scored: "Are you a force multiplier who grows other engineers, with named outcomes?" },
      { q: "How do you scale your influence or impact as the org grows?", framework: "Show a multiplier mindset - you raise the bar through mechanisms (design-review standards, tech talks, a mentoring pipeline, docs) that outlast your direct involvement, not through personal heroics. Name L4s you grew toward L5/L6 and standards you set that other teams adopted.", scored: "Scaling through mechanisms and mentorship rather than personal throughput." },
      { q: "Tell me about a time you raised the technical bar or improved engineering quality across teams.", framework: "Pick a standard you drove beyond your own team - a testing practice, a review norm, an architectural guideline - and show how you won adoption through influence and demonstrated value, then the measurable quality improvement. This is 'raising the bar' at org scope, not just cleaning up your own code.", scored: "Setting and spreading engineering standards beyond your own team." },
    ],
  },
  {
    signal: "User-first and Googleyness",
    rows: [
      { q: "Describe a time you pushed back on a feature or launch because it wasn't right for the user.", framework: "Show you weighed long-term user trust over short-term velocity or business pressure - delayed a launch for a quality/security/accessibility bar, or killed a dark pattern. Bring data on the user harm, describe the pushback you navigated with PM and leadership, and land the principled outcome even when it was costly.", scored: "Putting the user first and 'doing the right thing' over short-term pressure." },
      { q: "Tell me about a time you did the right thing even though it was hard or unpopular.", framework: "Choose an integrity moment - flagging a risk leadership didn't want to hear, or refusing a shortcut that hurt users or security. Show the personal cost you accepted, that you escalated constructively rather than grandstanding, and that principle beat convenience.", scored: "Integrity: 'does the right thing' under pressure." },
      { q: "Tell me about a time you went above and beyond, or solved a problem in a creative way.", framework: "Demonstrate Googleyness through behavior, never by naming the trait - show curiosity, bias for action, and user obsession in what you actually did. Pick a moment you took initiative no one required because it was right for the user or team, and quantify the impact.", scored: "Googleyness demonstrated through behavior (curiosity, bias for action, user focus), not asserted." },
    ],
  },
  {
    signal: "Business-vs-technical trade-off",
    rows: [
      { q: "Tell me about a time you had to make short-term sacrifices for long-term gains (or the reverse).", framework: "Frame an explicit tradeoff between a velocity/business ask and technical health (tech debt, scalability); outline a small set of options with clear tradeoffs and pick one with reasoning, then align business stakeholders on the cost. The Staff signal is that you speak the business's language - cost, risk, time-to-market - not just the technical one.", scored: "Communicating and owning tradeoffs across both business and technical dimensions." },
      { q: "How have you handled misalignment between engineering and product priorities?", framework: "Navigate the conflict by surfacing the underlying business goal, reframing the technical concern in terms of business risk and cost, and finding a principled path (phasing, a quality gate) both sides commit to - while preserving the relationship. Avoid an 'engineering vs product' framing; show partnership.", scored: "Principled navigation of business-technical conflict without damaging relationships." },
      { q: "Tell me about a time you overhauled a legacy system. How did you manage risk and justify it to the business?", framework: "Show phased delivery and concrete risk mitigation, plus the business case you built for the investment (why now, what it de-risks, the ROI) and how you kept stakeholders confident through the migration. This is where technical judgment meets business justification at Staff scope.", scored: "Risk-managed execution plus a business justification for technical investment." },
    ],
  },
  {
    signal: "Dealing with difficult people",
    rows: [
      { q: "Tell me about a time you worked with a difficult teammate or stakeholder.", framework: "Describe the behavior objectively (not 'they were toxic'), lead with empathy to find the root cause, and show the communication approach that produced a working relationship and a shared outcome. Never blame - the difficulty is a test of your EQ, not a referendum on theirs.", scored: "Emotional intelligence and relationship repair under friction." },
      { q: "How would you handle an engineer who creates conflict with team members but is still performing well? (hypothetical)", framework: "For hypotheticals, reason across the category rather than a single anecdote: diagnose privately first (understand the why), give direct behavioral feedback tied to concrete team impact, set clear expectations, and balance the person's value against team health. Staff-level: protect team health without discarding talent, and partner with or escalate to their manager appropriately.", scored: "Judgment on balancing individual performance vs team health - how you think, not just what you once did." },
      { q: "You have a coworker who isn't comfortable on the team or isn't being a team player. What steps would you take? (hypothetical)", framework: "Reason through the category: seek to understand the cause (are they blocked, excluded, overloaded?), create psychological safety, give them real ownership, and adjust the environment before judging the person. Pair genuine empathy with a concrete, structured plan.", scored: "Empathy plus structured problem-solving applied to a people situation." },
    ],
  },
];

function Behavioral() {
  return (
    <>
      <Lede>
        Thirty-one Googleyness and Leadership questions grouped by the signal each one scores,
        with the strong-answer framework and the exact axis the interviewer grades. These are the
        real wordings from reported loops, including the hypotheticals Google mixes in. The full
        method behind every framework is taught in{" "}
        <a href="#/googleyness" className="font-mono text-xs" style={{ color: ACCENT }}>
          Googleyness
        </a>
        .
      </Lede>

      <Callout kind="warn" title="The meta-rules that apply to every answer in this bank">
        <span className="block mb-1.5">
          <strong>Staff-scope or downlevel.</strong> The dominant filter: every story should be
          org-scope ("three teams aligned because I drove the proposal"), not "my team's project."
          Single-team projects, IC heroics, and vague "I was involved" narratives are explicit
          down-leveling triggers; show outcome-ownership and influence-without-authority.
        </span>
        <span className="block mb-1.5">
          <strong>"I" vs "we" discipline.</strong> Use "I" for the decisions and actions you owned
          (I proposed, I decided, I wrote the design) and "we" for shared outcomes and credit. A
          contribution buried in "we" cannot be scored; pure "I" with no team reads as a lone
          wolf. Aim for an Action section that is 50-60 percent of the answer, mostly "I."
        </span>
        <span className="block mb-1.5">
          <strong>Demonstrate, don't name.</strong> Never say "I'm a strong leader" or "I'm very
          Googley." Googleyness is rated from your behavior in EVERY round, coding and design
          included; how you handle being wrong or stuck is itself the signal.
        </span>
        <span className="block mb-1.5">
          <strong>Evidence that survives follow-ups.</strong> Interviewers probe the Action
          relentlessly: "I showed the p99 latency regression graph" survives, "I convinced them"
          collapses. Every assertion needs an artifact behind it.
        </span>
        <span className="block">
          <strong>Structure and red flags.</strong> STAR plus an explicit Learning, 2-3 minutes,
          quantified Result. Avoid: negativity about past employers, humblebrags, no metrics,
          blaming others, and describing difficult people by character instead of behavior. On
          hypotheticals, reason out loud across the category; on lost decisions,
          disagree-and-commit.
        </span>
      </Callout>

      {BEHAVIORAL_GROUPS.map((g) => (
        <Block key={g.signal} eyebrow="behavioral signal" title={g.signal}>
          <div className="flex flex-col gap-4">
            {g.rows.map((r, i) => (
              <div
                key={i}
                className="border-t border-line pt-3 first:border-t-0 first:pt-0"
              >
                <div className="font-mono text-[13px] text-ink mb-2 leading-snug">
                  {r.q}
                </div>
                <div className="text-ink-dim text-sm leading-relaxed mb-2">
                  {r.framework}
                </div>
                <div className="text-sm leading-relaxed">
                  <span
                    className="font-mono text-[10px] uppercase tracking-wider mr-1.5"
                    style={{ color: ACCENT }}
                  >
                    scored
                  </span>
                  <span className="text-ink-dim">{r.scored}</span>
                </div>
              </div>
            ))}
          </div>
        </Block>
      ))}
    </>
  );
}

/* ── Flashcards · coding ──────────────────────────────────────── */
const CODING_DECK = [
  { q: "Arrays/hashing, Two Sum: approach and complexity?", a: "One-pass hash map storing value->index; for each x look up target-x. O(n) time, O(n) space. Sorted input follow-up: two pointers at O(1) space.", tag: "arrays & hashing" },
  { q: "Arrays/hashing, Subarray Sum Equals K: approach, and why not sliding window?", a: "Running prefix sum plus a hash map of prefix counts; add count[prefix-k] to the answer at each step. O(n) time, O(n) space. Sliding window fails because negatives break the monotonic-growth assumption.", tag: "arrays & hashing" },
  { q: "Arrays/hashing, Product of Array Except Self with no division: approach and complexity?", a: "Prefix products pass, then suffix products pass, multiplied into the output. O(n) time, O(1) extra space.", tag: "arrays & hashing" },
  { q: "Arrays/hashing, Maximum Subarray (Kadane): approach and complexity?", a: "Track best sum ending here = max(x, best+x) and keep a global max; it is 1D DP in disguise. O(n) time, O(1) space.", tag: "arrays & hashing" },
  { q: "Sliding window, Longest Substring Without Repeating Characters: approach and complexity?", a: "Expanding window with a last-seen index map; on a repeat, jump the left pointer to max(left, lastSeen+1). O(n) time, O(min(n, charset)) space.", tag: "sliding window" },
  { q: "Sliding window, Minimum Window Substring: approach and complexity?", a: "Grow the window until need-counts are satisfied (have == required), then shrink from the left while still valid, tracking the best. O(n + m) time, O(charset) space. The shrink condition is what they watch.", tag: "sliding window" },
  { q: "Two pointers, Trapping Rain Water: approach and complexity?", a: "Two pointers with running leftMax/rightMax; water at i is bounded by the smaller side, so advance the shorter side. O(n) time, O(1) space.", tag: "two pointers" },
  { q: "Two pointers, 3Sum: approach, complexity, and the real trap?", a: "Sort; fix i and two-pointer the rest for -nums[i]. O(n^2) time, O(1) extra. The trap is duplicate handling: skip dups at all three positions.", tag: "two pointers" },
  { q: "Binary search, Search in Rotated Sorted Array: approach and complexity?", a: "Standard binary search; at each mid decide which half is sorted, then test whether the target lies in that sorted half. O(log n) time, O(1) space. Duplicates (LC 81) break the O(log n) worst case.", tag: "binary search" },
  { q: "Binary search, Koko Eating Bananas: what makes it the archetype pattern?", a: "Binary search on the ANSWER (eating speed) with a monotonic feasibility predicate: hours needed at speed s is at most H. O(n log maxPile) time, O(1) space. Same shape as ship-packages and bouquets.", tag: "binary search" },
  { q: "Binary search, Median of Two Sorted Arrays: approach and complexity?", a: "Binary search the partition of the smaller array so both left halves are at most both right halves; read the median from the four boundary values. O(log min(m,n)) time, O(1) space.", tag: "binary search" },
  { q: "Intervals, Merge Intervals: approach and complexity?", a: "Sort by start; sweep, extending the current interval while it overlaps, else push and reset. O(n log n) time, O(n) space.", tag: "intervals" },
  { q: "Heaps, Meeting Rooms II: approach and complexity?", a: "Min-heap of end times (or a sweep line of +1/-1 events); the max heap size is the rooms needed. O(n log n) time, O(n) space.", tag: "heaps & top-K" },
  { q: "Top-K, Top K Frequent Elements: name the three approaches and their costs.", a: "Count with a hash map, then: size-k min-heap at O(n log k), bucket sort by frequency at O(n), or quickselect on the uniques. They grade the trade-off reasoning, not just one working answer.", tag: "heaps & top-K" },
  { q: "Heaps, Merge K Sorted Lists: approach and complexity?", a: "Min-heap holding one node per list (or divide-and-conquer pairwise merge). O(N log k) time, O(k) space. Generalizes to the k-way stream merge with a memory cap.", tag: "heaps & top-K" },
  { q: "Monotonic stack, Largest Rectangle in Histogram: approach and complexity?", a: "Monotonic increasing stack of indices; when a shorter bar appears, pop and compute area = popped height times the width span. O(n) time, O(n) space. Maximal Rectangle is this per row.", tag: "monotonic stack" },
  { q: "Trees, Lowest Common Ancestor: BST version vs general binary tree?", a: "BST: walk down comparing both values, the split point is the LCA, O(h). General: post-order recursion returning whether each subtree saw p or q; the first node seeing both is the LCA, O(n) time, O(h) space.", tag: "trees" },
  { q: "Trees, Serialize and Deserialize Binary Tree: approach and complexity?", a: "Preorder DFS emitting null markers; deserialize by consuming tokens in the same order via a queue or index. O(n) time, O(n) space. BST follow-up: no null markers needed.", tag: "trees" },
  { q: "Graphs, Number of Islands: approach, complexity, and the famous follow-up?", a: "Scan the grid; on each unvisited land cell run DFS/BFS flood fill (or union-find) and increment the count. O(rows*cols). Follow-up: Islands II, a stream of adds, needs union-find.", tag: "graphs" },
  { q: "Graphs, Course Schedule: approach and complexity?", a: "Topological sort via Kahn's BFS on an in-degree queue, or DFS with cycle detection; a cycle means impossible. O(V+E) time and space.", tag: "graphs" },
  { q: "Graphs, Word Ladder: what is the graph and the search?", a: "An implicit graph where edges connect words differing by one letter; build neighbors with wildcard buckets (*ord) and BFS for shortest path, bidirectional BFS to cut the frontier. O(N * L^2) time.", tag: "graphs" },
  { q: "Graphs, Alien Dictionary: approach and the two traps?", a: "For each adjacent word pair, the first differing char gives a directed edge; topologically sort the letters. O(total chars). Traps: a word before its own prefix ('abc' before 'ab') is invalid, and a cycle means no order.", tag: "graphs" },
  { q: "Tries, Design Search Autocomplete: approach and per-query complexity?", a: "Trie keyed by prefix with the top-k highest-frequency completions cached at each node; walk to the prefix node and return top-3 by frequency then lexicographic. O(p + k log k) per query. It escalates into sharding and ranking design.", tag: "tries" },
  { q: "DP, Coin Change: state and complexity?", a: "1D DP, unbounded knapsack: dp[a] = min over coins c of dp[a-c]+1, bottom-up from 0 to amount. O(amount * coins) time, O(amount) space. Counting ways (LC 518) makes the iteration order matter.", tag: "dynamic programming" },
  { q: "DP, Longest Increasing Subsequence: the O(n log n) upgrade?", a: "Patience sorting: binary-search each value into a tails array where tails[i] is the smallest tail of an increasing subsequence of length i+1. O(n log n) time, O(n) space. Interviewers notice if you only know the O(n^2) DP.", tag: "dynamic programming" },
  { q: "DP, Edit Distance: recurrence and complexity?", a: "2D DP over prefixes: dp[i][j] = diag on a match, else 1 + min(insert, delete, replace). O(m*n) time, O(min(m,n)) space with a rolling row.", tag: "dynamic programming" },
  { q: "Design, LRU Cache: structure for O(1) get and put?", a: "Hash map key->node over a doubly linked list; move-to-front on access, evict from the tail on overflow. O(1) get/put, O(capacity) space. Follow-ups: thread safety via sharded locks, LFU, TTL.", tag: "ds design" },
  { q: "Design, Token-Bucket Rate Limiter: how does the lazy refill work?", a: "Store tokens + lastRefillTime per key; on each request add rate*(now-last) tokens capped at burst, then allow iff tokens are at least 1 and decrement. O(1) per request, no background thread. Follow-up: CAS or per-key locks, then distributed limiting.", tag: "ds design" },
];

function QfCoding() {
  return (
    <>
      <Lede>
        Twenty-eight cards spanning every pattern group in the coding bank, arrays through
        concurrency-flavored design. Each front names the pattern and the question; your spoken
        answer is the approach in one or two sentences plus the complexity, exactly the sentence
        you would say before typing in the real round. Reveal, grade honestly, re-run the misses.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={CODING_DECK} />
      </Try>
    </>
  );
}

/* ── Flashcards · design & behavioral ─────────────────────────── */
const DESIGN_BEHAVIORAL_DECK = [
  { q: "Design a news feed / home timeline for a billion users. The crux?", a: "Hybrid fanout: precompute (push) feeds for normal users, pull-and-merge at read time for celebrity accounts; eventually consistent with a lag SLO. Reference: Bigtable feeds with Pub/Sub + Dataflow fanout. Top failure mode: celebrity write amplification, 100M writes per post.", tag: "design" },
  { q: "Design Google Photos. The crux?", a: "Resumable chunked upload with client-side content-hash dedupe (identical bytes stored once, ref-counted), an async transcode/thumbnail/label pipeline, and tiered erasure-coded storage. Reference: Colossus + Bigtable/Spanner + Dataflow. Top failure mode: orphaned chunks from aborted uploads.", tag: "design" },
  { q: "Design a global real-time chat service. The crux?", a: "Persistent connections behind a gateway routing layer; per-conversation sequence numbers plus clientMsgId dedupe give exactly-once-perceived delivery. Reference: Spanner/Bigtable message log, Pub/Sub fanout. Top failure mode: lost messages if the persist-before-ack ordering is violated.", tag: "design" },
  { q: "Design YouTube. The crux?", a: "Decouple ingest from the async chunked transcode pipeline; blob segments behind a multi-tier CDN; view counts via streaming approximate counters reconciled by exact batch. Reference: Colossus + Dataflow + Google Global Cache. Top failure mode: CDN cache-fill storm on a newly viral video.", tag: "design" },
  { q: "Design a ride-hailing dispatch service. The crux?", a: "Sharded in-memory S2/geohash index over the location firehose; rank nearby candidates by ETA, then ATOMICALLY claim the driver (compare-and-set) to prevent double-dispatch; trip state strong, location best-effort. Reference: S2 + Spanner. Top failure mode: double-dispatching one driver to two riders.", tag: "design" },
  { q: "Design search autocomplete / typeahead. The crux?", a: "Precomputed trie/FST with top-k completions cached at every node, served from memory; offline batch build from query logs plus a trending overlay for freshness. Reference: Dataflow/MapReduce build, serving akin to Google Suggest. Top failure mode: hot prefixes overloading one shard.", tag: "design" },
  { q: "Design a global multi-channel notification system. The crux?", a: "Durable queue with per-channel isolation so one slow provider cannot starve the rest; idempotency-key dedupe so retries never double-notify; a separate high-priority path for OTP. Reference: Pub/Sub + Bigtable, Doorman-style limits. Top failure mode: a provider outage backing up one channel and starving others.", tag: "design" },
  { q: "Design a payment processing system. The crux?", a: "Idempotency keys for exactly-once money movement, a double-entry append-only ledger in an ACID store, and a saga plus reconciliation around non-transactional PSPs; fail-closed on uncertainty. Reference: Spanner/F1, which runs Google Ads billing. Top failure mode: an ambiguous PSP timeout treated as success.", tag: "design" },
  { q: "Design the Google Docs real-time editing backend. The crux?", a: "Operational Transformation with the server as per-doc ordering authority via a single-writer lease; offline edits rebase against server history on reconnect; op log plus snapshots. Reference: Spanner op log, Chubby-style lease. Top failure mode: divergence from incorrect transforms.", tag: "design" },
  { q: "Design a Spanner-class globally-consistent KV store. The crux?", a: "Paxos group per tablet, TrueTime commit-wait for external consistency, 2PC over Paxos groups for cross-shard transactions, and auto-splitting tablets on load. Reference: Spanner + Bigtable + Chubby. Top failure mode: a hot tablet overwhelming one Paxos leader.", tag: "design" },
  { q: "Design a large-scale distributed rate limiter. The crux?", a: "Token buckets enforced locally, with a cooperative global authority allocating each server a share of the rate (Doorman-style); choose fail-open vs fail-closed per endpoint. Reference: Doorman. Top failure mode: boundary bursts, 2x the limit at fixed-window edges.", tag: "design" },
  { q: "Design a distributed pub/sub system. The crux?", a: "Topics split into partition-by-key append-only replicated logs for per-key ordering; at-least-once delivery plus idempotent consumers; durable retention with replay/seek-to-timestamp. Reference: Cloud Pub/Sub, Kafka-style log, Colossus storage. Top failure mode: a hot partition from skewed keys.", tag: "design" },
  { q: "Design a Borg-class cluster manager plus a reliable distributed cron. The crux?", a: "Bin-packing with priorities, preemption, and quotas; cron fires via a Paxos leader that announces before and confirms after each idempotent launch, fail-closed (skip) over double-fire. Reference: Borg + Google's distributed Cron (SRE book) + Chubby. Top failure mode: double-firing across leader failover.", tag: "design" },
  { q: "Have you ever had to demonstrate leadership even though you weren't technically in charge?", a: "Fill the vacuum before being asked: org-scope stakes, an artifact others rallied around (a written proposal or design doc), and a durable outcome the org now operates by. Use 'I' for the specific moves, 'we' for the shared win.", tag: "behavioral" },
  { q: "Tell me about a time you worked on something with significant ambiguity.", a: "Show you got curious, not anxious: create structure (break the problem into knowable pieces, align stakeholders on a framework, set milestones with incomplete data), iterate as signal arrives, and own the outcome, not just the tasks.", tag: "behavioral" },
  { q: "Tell me about a time you led without formal authority.", a: "Center the mechanism of influence: a written proposal, a shared metric, a POC, pre-alignment 1:1s with skeptics. Evidence must survive follow-ups: 'I showed the p99 latency graph,' not 'I convinced them.'", tag: "behavioral" },
  { q: "Describe a time you strongly disagreed with someone more senior.", a: "Investigation over winning: steel-man their view, bring evidence (a benchmark, a prototype, a graph), disagree respectfully, and commit fully once the decision is made, even when it goes against you.", tag: "behavioral" },
  { q: "Tell me about your biggest professional failure.", a: "A real mistake with visible consequences, no humblebrag: why the decision seemed reasonable then, the signal you missed, and the concrete change to your operating method (a design-review gate, rollout criteria) that has held since.", tag: "behavioral" },
  { q: "Tell me about a time you mentored an engineer.", a: "Name a specific person and their concrete outcome (promoted, took on staff-level work). Show your diagnosis of what they needed, coaching that guided rather than did it for them, and the multiplier effect on the team.", tag: "behavioral" },
  { q: "Describe a time you pushed back on a launch because it wasn't right for the user.", a: "Long-term user trust over short-term velocity: bring data on the user harm, describe the pushback navigated with PM and leadership, and land the principled outcome even when it was costly.", tag: "behavioral" },
  { q: "Tell me about a short-term sacrifice for long-term gain (or the reverse).", a: "Make the tradeoff explicit, lay out a small option set with reasoning, and align business stakeholders on the cost. The Staff signal: speak the business's language, cost, risk, and time-to-market, not just the technical one.", tag: "behavioral" },
  { q: "Tell me about a difficult teammate or stakeholder.", a: "Describe the behavior objectively, never their character; lead with empathy to find the root cause, and show the communication approach that repaired the relationship. The difficulty is a test of your EQ, not a referendum on theirs.", tag: "behavioral" },
  { q: "Hypothetical: an engineer performs well but creates conflict. What do you do?", a: "Reason across the category, not one anecdote: diagnose privately first, give direct behavioral feedback tied to concrete team impact, set clear expectations, and balance their value against team health, partnering with their manager as needed.", tag: "behavioral" },
  { q: "Tell me about an inefficient process outside your scope that you improved.", a: "Ownership beyond your lane: nobody asked you to fix it. Quantify before and after, show the root-cause analysis, and win adoption from other teams through influence rather than mandate.", tag: "behavioral" },
];

function QfDesign() {
  return (
    <>
      <Lede>
        Twenty-four mixed cards: thirteen design prompts where the spoken answer is the crux, the
        reference Google system, and the top failure mode, and eleven behavioral questions where
        the answer is the strong-answer framework. This is the deck for the night before the
        onsite, one pass warms up every non-coding round at once.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DESIGN_BEHAVIORAL_DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  how: <How />,
  coding: <Coding />,
  design: <Design />,
  behavioral: <Behavioral />,
  qfcoding: <QfCoding />,
  qfdesign: <QfDesign />,
};

export default function QuestionBank() {
  const [active, setActive] = useState("how");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="The bank · DRILL IT"
      title="The Question Bank"
      subtitle="Real Google questions with worked solution ideas, coding, system design, and Googleyness, plus flashcard decks to drill them to reflex."
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
