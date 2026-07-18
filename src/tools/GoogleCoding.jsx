import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import UnionFindViz from "./gcoding/UnionFindViz.jsx";

const ACCENT = "#34A853";
const { Block, Try } = withAccent(ACCENT);

/* plain hash-anchor cross-link into another tool on the site */
function XLink({ to, children }) {
  return (
    <a href={to} className="font-mono text-xs" style={{ color: ACCENT }}>
      {children}
    </a>
  );
}

const TOPICS = [
  { id: "bar", label: "How Google scores coding", group: "The bar" },
  { id: "map", label: "The curriculum map (reuse)", group: "The bar" },
  { id: "unionfind", label: "Union-Find / DSU", group: "Patterns to add" },
  { id: "lca", label: "Lowest Common Ancestor", group: "Patterns to add" },
  { id: "serialize", label: "Serialize / deserialize a tree", group: "Patterns to add" },
  { id: "graphkit", label: "Topological sort & Dijkstra", group: "Patterns to add" },
  { id: "bsanswer", label: "Binary search on the answer", group: "Patterns to add" },
  { id: "prefix", label: "Prefix sums & difference arrays", group: "Patterns to add" },
  { id: "dsdesign", label: "Data-structure design for Staff", group: "Patterns to add" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* ── How Google scores coding ─────────────────────────────────── */
const RUBRIC = [
  {
    n: 1,
    phase: "Clarify",
    do: "Restate the problem, pin down input size and types, ask about edge inputs (empty, one element, duplicates, negatives), and confirm the expected output. Two minutes, out loud.",
    signal: "Does not solve the wrong problem. First evidence of General Cognitive Ability.",
  },
  {
    n: 2,
    phase: "Approach first",
    do: "State the plan and its time and space complexity BEFORE writing a line. Name the brute force, then the better idea, and get a nod.",
    signal: "Structured problem solving, and that you can see the cost of a plan before committing to it.",
  },
  {
    n: 3,
    phase: "Code it",
    do: "Write correct, readable, idiomatic code. Real names, small helpers, no golf. Talk through each block as you write it.",
    signal: "Role-related knowledge: you actually write working code, not pseudocode that hand-waves the hard part.",
  },
  {
    n: 4,
    phase: "Invariants & complexity",
    do: "Name the loop or recursion invariant that makes it correct, then state the Big-O of time and space without being asked.",
    signal: "You reason about correctness and cost, not just about output on the happy path.",
  },
  {
    n: 5,
    phase: "Test & edges",
    do: "Dry-run a small example by hand, then walk the edges you asked about in step 1: empty, single, duplicate, overflow, cycle.",
    signal: "You verify your own work. Interviewers can write down the specific edges you caught.",
  },
  {
    n: 6,
    phase: "Optimize when pushed",
    do: "Only after a correct baseline exists: name the bottleneck, propose the improvement, and keep time for the planned follow-up.",
    signal: "Depth under pressure, and the judgment to optimize the real bottleneck rather than premature micro-tuning.",
  },
  {
    n: 7,
    phase: "Communicate throughout",
    do: "Narrate continuously, take hints gracefully, and think out loud so a silent interviewer still has something to score.",
    signal: "Collaborative and hireable. The single trait that separates a pass from a clever solo grind.",
  },
];

function Bar() {
  return (
    <>
      <Lede>
        Google does not score coding on whether you reach the optimal answer, it scores a sequence of{" "}
        <strong>signals an interviewer can write into your hiring packet</strong>: did you clarify, did you
        state complexity, did you handle edges, did you communicate. Clever, terse code with no narration
        reads as a risk. The arc below is the same every round, and at Staff (L6) the problems get harder
        while the communication bar rises.
      </Lede>

      <Block eyebrow="the arc" title="The seven phases of a strong 45 minutes">
        <p className="text-ink-dim leading-relaxed mb-3">
          Each phase produces a specific, writable signal. The order matters: approach and complexity come{" "}
          <em>before</em> code, edges and testing come after, and communication runs across all of it.
        </p>
        <div className="space-y-3">
          {RUBRIC.map((s) => (
            <div key={s.n} className="rounded-lg border border-line bg-surface-2 p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="font-mono text-[10px] w-5 h-5 rounded-full border flex items-center justify-center flex-none"
                  style={{ color: ACCENT, borderColor: ACCENT }}
                >
                  {s.n}
                </span>
                <span className="font-mono text-[12px] font-semibold text-ink">{s.phase}</span>
              </div>
              <div className="space-y-1.5 text-[13px] leading-relaxed">
                <p className="text-ink-dim">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>do</span>
                  {s.do}
                </p>
                <p className="text-ink-faint">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2 text-ink-faint">signal</span>
                  {s.signal}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Callout kind="note" title="What the interviewer is listening for">
          Writable signals, not vibes. The interviewer has to justify a score in the packet, so they are
          listening for the moments they can quote: "clarified the constraints," "stated O(n log n) up
          front," "caught the empty-input case," "took the hint and recovered." Terse code with a correct
          answer and no narration gives them almost nothing to write, and that reads as a no-hire.
        </Callout>
      </Block>

      <Block eyebrow="write it for the packet" title="Say the scoreable things out loud">
        <p className="text-ink-dim leading-relaxed mb-2">
          Google's decision is made by a hiring committee reading a written packet, not by the interviewer in
          the room. The committee weighs four attributes, and a coding round mostly feeds two of them:{" "}
          <strong>General Cognitive Ability</strong> (how you break down and reason) and{" "}
          <strong>Role-Related Knowledge</strong> (that you can actually build it). Every phase above exists
          to hand the interviewer a sentence they can paste into that packet.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`silent, correct solution        ->  packet: "solved it, unclear how they got there"
narrated solution               ->  packet: "clarified n up to 1e5, ruled out O(n^2),
                                     stated O(n log n) time / O(n) space, tested the
                                     empty and single-element cases, took one hint well"

same code. the second write-up is the one that clears the bar.`}
        />
        <Callout kind="tip" title="Make the invisible visible">
          If you did it in your head, the interviewer cannot score it. Say "I am ruling out the nested loop
          because n is up to a hundred thousand," say the Big-O the instant the code is written, and name
          each edge as you test it. You are not narrating for yourself, you are writing their packet for them.
        </Callout>
      </Block>

      <Block eyebrow="the L6 delta" title="What changes at Staff, and what does not">
        <p className="text-ink-dim leading-relaxed mb-2">
          At L6 the coding problems get genuinely harder, expect constrained dynamic programming, non-trivial
          graph work, and concurrency-safe or memory-bounded data structures rather than a single clean
          array pass. The communication and abstraction bar rises too: you are expected to factor the problem
          into named components, reason about invariants precisely, and discuss trade-offs like a tech lead,
          not just produce a function.
        </p>
        <Callout kind="trap" title="A strong design round does not rescue a weak coding round">
          The packet scores coding as its own signal. Underperformance on coding fails the loop regardless of
          level, a brilliant system-design conversation does not buy back a shaky implementation. Clear the
          coding bar first, then layer the Staff-level judgment on top. And leave real time for the planned
          follow-up: interviewers reserve the last chunk for it, and burning all 45 minutes on the base
          problem means the deepest signal never gets collected.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>You see the optimal solution instantly, do you just write it?</strong> No. State the
            brute force and its complexity, say you see a better approach and name its complexity, get a nod,
            then implement the better one. Skipping the reasoning throws away the exact cognitive-ability
            signal the round exists to collect.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You are stuck fifteen minutes in, what do you do?</strong> Say where you are stuck out
            loud, restate what you know is true, and try a smaller concrete example to surface the pattern.
            Take the hint when it comes, cleanly. Interviewers grade recovery, and a nudge taken well still
            scores well.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How much should you optimize?</strong> To a correct, clearly-stated baseline first, then
            optimize the named bottleneck only if pushed, and stop with time left for the follow-up.
            Micro-optimizing a solution that is not yet correct is the classic trap, and it reads as poor
            prioritization.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Is it about clever code?</strong> The opposite. Readable, idiomatic, well-named code that
            a teammate could maintain scores higher than a dense one-liner. Cleverness that the interviewer
            has to decode is a cost, not a flex, they are imagining you in a code review.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Google scores coding on signals an interviewer can write into the packet, so I make each one
          explicit: I clarify the problem and its constraints, state my approach and its time and space
          complexity before I code, write correct readable code rather than clever code, name my invariants
          and Big-O, then dry-run the edges, narrating the whole time. At Staff the problems get harder,
          graphs, constrained DP, concurrency-safe structures, and the communication bar is higher, but
          coding is still a gating signal on its own, a strong design round does not rescue a weak coding
          round."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "My model of a Google coding round is that the interviewer has to justify a score in a written
          packet that a hiring committee reads, and coding mostly feeds two attributes, general cognitive
          ability and role-related knowledge. So I run a fixed arc and I say the scoreable parts out loud.
          First I clarify: restate the problem, pin down n and the types, ask about empty, single, duplicate,
          and overflow inputs, and confirm the output. Then, before any code, I state the approach and its
          complexity, usually the brute force first, then the better idea, and I get a nod so I am not
          building the wrong thing. I write correct, readable, idiomatic code and talk through each block,
          because clever code the interviewer has to decode is a liability. The moment it is written I name
          the invariant that makes it correct and state the time and space Big-O without being asked. Then I
          test: a hand dry-run, then the specific edges I raised at the start. I only optimize once there is
          a correct baseline, I name the real bottleneck rather than micro-tuning, and I deliberately keep
          time for the follow-up the interviewer has planned. At L6 the problems are harder and I am expected
          to abstract and reason like a tech lead, but I never forget that coding is a gating signal, so I
          clear it cleanly first and layer the staff judgment on top."
        </Callout>
      </Block>
    </>
  );
}

/* ── The curriculum map (reuse) ───────────────────────────────── */
function Map() {
  return (
    <>
      <Lede>
        This track is a <strong>lens over the site you have already drilled</strong>, not a re-teach. Google's
        coding surface is eight algorithmic areas plus data-structure design, and every one of them has a home in
        the DSA tools. The map below points each area at the exact topic to open, then the "Patterns to add"
        group covers the seven shapes a Google loop leans on that are easy to under-drill elsewhere.
      </Lede>

      <Block eyebrow="the eight areas plus DS design" title="Google coding topic to where you drill it">
        <OpTable
          cols={["Coding area", "Where", "", "Open exactly this"]}
          rows={[
            {
              op: "Arrays & hashing",
              avg: "Lab + Bench",
              avgTone: "good",
              why: (
                <>
                  <XLink to="#/dsa-lab">DSA Lab</XLink> for "Dynamic Array" and "Hash Table" internals, then{" "}
                  <XLink to="#/interview-bench">Interview Bench</XLink> for the pattern drills.
                </>
              ),
            },
            {
              op: "Two-pointers / sliding window",
              avg: "Bench",
              avgTone: "good",
              why: (
                <>
                  <XLink to="#/interview-bench">Interview Bench</XLink>: "Two Pointers", "Sliding Window", and
                  "Fast & Slow Pointers".
                </>
              ),
            },
            {
              op: "Binary search",
              avg: "Bench",
              avgTone: "good",
              why: (
                <>
                  <XLink to="#/interview-bench">Interview Bench</XLink>: "Binary Search" for the array form
                  (see the "Binary search on the answer" topic here for the harder variant).
                </>
              ),
            },
            {
              op: "Stacks, queues, monotonic, intervals, heaps, top-K",
              avg: "Lab + Bench",
              avgTone: "good",
              why: (
                <>
                  <XLink to="#/dsa-lab">DSA Lab</XLink> for "Stack & Queue" and "Heap / Priority Queue", then{" "}
                  <XLink to="#/interview-bench">Interview Bench</XLink>: "Monotonic Stack", "Intervals",
                  "Heap / Top-K".
                </>
              ),
            },
            {
              op: "Trees (traversal, BST)",
              avg: "Lab + Bench",
              avgTone: "good",
              why: (
                <>
                  <XLink to="#/dsa-lab">DSA Lab</XLink> for "Binary Search Tree", then{" "}
                  <XLink to="#/interview-bench">Interview Bench</XLink>: "DFS" and "BFS".
                </>
              ),
            },
            {
              op: "Graphs (traversal, connectivity)",
              avg: "Lab + Bench",
              avgTone: "good",
              why: (
                <>
                  <XLink to="#/dsa-lab">DSA Lab</XLink> for "Graph", then{" "}
                  <XLink to="#/interview-bench">Interview Bench</XLink>: "BFS" and "DFS" (topological sort and
                  Dijkstra are added here).
                </>
              ),
            },
            {
              op: "Tries & backtracking",
              avg: "Lab + Bench + Staff",
              avgTone: "good",
              why: (
                <>
                  <XLink to="#/dsa-lab">DSA Lab</XLink> for "Trie (Prefix Tree)",{" "}
                  <XLink to="#/interview-bench">Interview Bench</XLink> for "Backtracking", and{" "}
                  <XLink to="#/staff-bench">Staff Bench</XLink> for "Autocomplete / Trie".
                </>
              ),
            },
            {
              op: "Dynamic programming",
              avg: "Bench",
              avgTone: "ok",
              why: (
                <>
                  <XLink to="#/interview-bench">Interview Bench</XLink>: "Dynamic Programming" and its atlas of
                  sub-shapes, the deepest single area in the loop.
                </>
              ),
            },
            {
              op: "Data-structure design",
              avg: "Staff + Identifier",
              avgTone: "good",
              why: (
                <>
                  <XLink to="#/staff-bench">Staff Bench</XLink>: "LRU Cache", "Rate Limiter", "Time-based
                  Key-Value", "Insert/Delete/GetRandom O(1)", and more; use{" "}
                  <XLink to="#/identifier">The Identifier</XLink> for pattern recognition.
                </>
              ),
            },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you name the pattern from the problem's shape in seconds and reach for a rep you have already
          banked, rather than re-deriving it cold. Pattern recognition is the difference between a
          twenty-minute solve with time to spare for the follow-up and a forty-minute scramble that never gets
          there.
        </Callout>
      </Block>

      <Block eyebrow="problem to pattern" title="The practice set, decoded">
        <p className="text-ink-dim leading-relaxed mb-2">
          A compact decoder for the classic Google-list problems: read the problem, name the pattern, open the
          matching topic. The last block of these, the ones marked below, are exactly the "Patterns to add"
          in this tool.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`Subarray Sum Equals K        -> prefix sum + hashmap of counts     [add]
Longest Consecutive Sequence -> hash set, expand each run start
Product of Array Except Self -> prefix * suffix products
Merge Intervals              -> sort by start, then sweep
Meeting Rooms II             -> min-heap of end times (or sweep line)
Number of Islands            -> BFS/DFS flood fill (or union-find)
Course Schedule              -> topological sort; a cycle = impossible [add]
Word Ladder                  -> BFS = shortest path on unweighted graph
Accounts Merge               -> union-find on the emails               [add]
Alien Dictionary             -> build a graph, then topological sort    [add]
Redundant Connection         -> union-find; first edge that closes a cycle [add]
Number of Provinces          -> union-find (or DFS on components)       [add]
Koko Eating Bananas          -> binary search on the answer             [add]
Serialize/Deserialize Tree   -> preorder + null markers                 [add]
Lowest Common Ancestor       -> recurse; return-value invariant         [add]
LRU Cache                    -> hashmap + doubly linked list, all O(1)  [add]`}
        />
        <Callout kind="tip" title="The gaps, in one place">
          Union-find, LCA, tree serialization, topological sort and Dijkstra, binary search on the answer,
          prefix and difference arrays, and data-structure design are the seven shapes most likely to be
          under-drilled if you came up through a generic array/DP list. That is precisely what the rest of
          this tool adds.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>The problem looks like two patterns at once, how do you choose?</strong> Name both out
            loud and pick by the constraint that dominates. "Number of Islands" is flood fill or union-find,
            I take BFS/DFS for a one-shot count and union-find when edges stream in and I need connectivity
            after each.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You cannot place the pattern at all, now what?</strong> Fall back to first principles:
            what is the search space, what makes a candidate valid, is there monotonicity or overlapping
            subproblems. Those questions route you to binary-search-on-the-answer or DP even when the surface
            problem is unfamiliar.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why map to existing reps instead of grinding a fresh list?</strong> Because recognition,
            not typing speed, is the bottleneck in a 45-minute round. Reusing a pattern you have already
            internalized frees the minutes you need for clarifying, testing, and the follow-up.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I do not relearn coding for Google, I map its eight algorithmic areas onto reps I have already banked, arrays
          and hashing, two-pointers and sliding window, binary search, stacks and heaps, trees, graphs, tries
          and backtracking, and DP, each with a home in the DSA Lab and Interview Bench. Then I add the seven
          shapes a Google loop leans on that are easy to under-drill: union-find, lowest common ancestor, tree
          serialization, topological sort and Dijkstra, binary search on the answer, prefix and difference
          arrays, and data-structure design."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The point of this track is reuse. Google's coding surface is eight algorithmic areas plus data-structure design,
          and I already have drilled homes for all of them: array and hash internals in the DSA Lab, the
          two-pointer, sliding-window, binary-search, monotonic-stack, interval, and heap patterns in the
          Interview Bench, trees and graphs across both, tries and backtracking in the Bench and Staff Bench,
          and the dynamic-programming atlas in the Bench. So my prep is not a fresh grind, it is fast pattern
          recognition, reading a problem and naming the shape in seconds. Where I invest new time is the set
          of patterns a Google loop over-indexes on that a generic list under-teaches: union-find for
          connectivity and cycle detection, lowest common ancestor with its return-value invariant, serializing
          a tree as an unambiguous grammar, topological sort and Dijkstra for ordering and weighted shortest
          paths, binary search on the answer when the search space is a candidate value, prefix and difference
          arrays for range queries and updates, and the Staff framing for data-structure design. I close the
          gap on those seven, keep the rest warm through the map, and spend the round on recognition and
          communication rather than re-derivation."
        </Callout>
      </Block>
    </>
  );
}

/* ── Union-Find / DSU ─────────────────────────────────────────── */
function UnionFind() {
  return (
    <>
      <Lede>
        Union-Find (disjoint-set union, DSU) answers one question fast: <strong>are these two things in the
        same group, and merge them if not</strong>. A parent array, a <em>find</em> with path compression, and
        a <em>union</em> by size or rank give you near-O(1) amortized operations, the inverse-Ackermann
        function, which is at most 4 for any input you will ever see. When a problem is about connectivity, it
        is almost always the right tool.
      </Lede>

      <Block eyebrow="the structure" title="Parent array, find with path compression, union by size">
        <p className="text-ink-dim leading-relaxed mb-2">
          Each element points at a parent; following parents to a self-pointing node gives the{" "}
          <strong>root</strong>, the id of its set. Two moves keep the trees flat: <strong>path compression</strong>{" "}
          repoints every node on a find directly at the root, and <strong>union by size</strong> always hangs
          the smaller tree under the larger root. Together they make every operation effectively constant time.
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`parent = list(range(n))      # every node starts as its own root
size   = [1] * n             # size of each tree, for union by size

def find(x):
    root = x
    while parent[root] != root:
        root = parent[root]
    while parent[x] != root:  # path compression: flatten x..root
        parent[x], x = root, parent[x]
    return root

def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb:
        return False          # already connected -> this edge closes a cycle
    if size[ra] < size[rb]:
        ra, rb = rb, ra       # attach the smaller tree under the larger
    parent[rb] = ra
    size[ra] += size[rb]
    return True               # a real merge happened`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you say "near constant time, inverse Ackermann" and can explain <em>why</em>, path compression
          plus union by size, rather than reciting O(1) as a magic word. Naming that union returns False on an
          already-connected pair, and that this <em>is</em> cycle detection, is the senior signal.
        </Callout>
      </Block>

      <Block eyebrow="when to reach for it" title="The triggers, and the wrong turn">
        <p className="text-ink-dim leading-relaxed mb-2">
          Reach for DSU the moment a problem is about <strong>grouping or connectivity</strong>:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Connected components / provinces</strong>, union every edge, then count distinct roots.</li>
          <li><strong>Cycle detection in an undirected graph</strong>, if union(a, b) finds a and b already share a root, this edge closes a cycle (that is "Redundant Connection").</li>
          <li><strong>Accounts Merge / groups by shared key</strong>, union accounts that share an email, then read off each component.</li>
          <li><strong>Incremental connectivity</strong>, edges arrive over time and you must answer "connected yet?" after each, DSU shines because it is online.</li>
        </ul>
        <Callout kind="trap" title="The wrong turn: re-scanning with BFS/DFS per query">
          Running a fresh BFS or DFS to test connectivity after every edge is O(V+E) <em>per query</em>, which
          is quadratic over a stream of edges. DSU folds all of that into one near-linear pass. Use BFS/DFS when
          you must enumerate or shortest-path a component; use DSU when you only need "same set?" and "merge."
          Cross-check the traversal side in{" "}
          <XLink to="#/interview-bench">Interview Bench</XLink> ("BFS", "DFS") and{" "}
          <XLink to="#/dsa-lab">DSA Lab</XLink> ("Graph").
        </Callout>
      </Block>

      <Block eyebrow="watch it work" title="Union, find, and path compression, live">
        <p className="text-ink-dim leading-relaxed mb-3">
          Union a few nodes and watch union-by-size keep the trees shallow, then run find on a deep node and
          watch path compression snap every node on the path straight to the root. The component count and the
          parent array update as you go.
        </p>
        <Try label="union-find">
          <UnionFindViz />
        </Try>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Why union by size or rank, isn't path compression enough?</strong> Compression alone can
            still build a tall tree before the first find flattens it. Union by size caps the height so the
            worst case is bounded even without compression, and together they give the inverse-Ackermann bound.
            Either union by size or union by rank works; do not skip both.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Does DSU detect cycles in a directed graph?</strong> Not directly, plain DSU is for
            undirected connectivity. Directed cycle detection is a DFS with a gray "in progress" set, or Kahn's
            topological sort leaving nodes behind. See the "Topological sort & Dijkstra" topic.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Can you delete an edge or split a set?</strong> Not in vanilla DSU, it is union-only.
            Deletions need a different structure (offline with rollback, link-cut trees, or recomputation). If
            the interviewer adds deletions, flag that the data structure has to change, which is itself a good
            signal.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you return which elements are grouped, not just the count?</strong> After all unions,
            bucket elements by find(x): a dict from root to the list of its members. One near-linear pass, and
            it is how Accounts Merge and Provinces assemble their output.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Union-Find is my go-to for connectivity: a parent array, find with path compression, and union by
          size, giving near-constant amortized operations, inverse Ackermann. I reach for it on connected
          components, cycle detection in an undirected graph, and merge-by-shared-key problems like Accounts
          Merge. The tell is that union returns false when the two nodes already share a root, which is exactly
          cycle detection, and it beats re-running BFS or DFS per query, which is quadratic over a stream of
          edges."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Disjoint-set union maintains a partition of elements into sets and supports two operations: find,
          which returns the representative root of an element's set, and union, which merges two sets. The
          implementation is a parent array where each node points at a parent and a root points at itself. Two
          optimizations make it fast: path compression, where a find repoints every node it visits straight at
          the root, and union by size or rank, where I always attach the smaller tree under the larger root so
          the trees stay shallow. With both, every operation is near constant amortized, the inverse-Ackermann
          function, at most about four for any real input. I reach for it whenever a problem is about grouping
          or connectivity: counting connected components or provinces by unioning every edge and counting
          distinct roots, detecting a cycle in an undirected graph because union of two already-connected nodes
          means this edge closes a loop, and merging records that share a key like Accounts Merge. It is also
          online, so when edges stream in and I must answer connectivity after each, DSU folds what would be a
          BFS or DFS per query, quadratic overall, into one near-linear pass. The limits I would name unprompted:
          it is union-only, so deletions need a different structure, and for directed cycle detection I switch
          to a DFS gray-set or a topological sort."
        </Callout>
      </Block>
    </>
  );
}

/* ── Lowest Common Ancestor ───────────────────────────────────── */
function Lca() {
  return (
    <>
      <Lede>
        Lowest common ancestor asks for the deepest node that has both <code className="font-mono">p</code> and{" "}
        <code className="font-mono">q</code> as descendants. The elegant recursive solution fits in five lines,
        but the whole thing turns on stating its <strong>return-value invariant</strong> precisely, that is the
        senior moment. A binary search tree gives a faster walk-down shortcut, and repeated queries call for
        binary lifting.
      </Lede>

      <Block eyebrow="the recursion" title="The five-line solution, and its invariant">
        <p className="text-ink-dim leading-relaxed mb-2">
          Recurse into both subtrees. If <code className="font-mono">p</code> and <code className="font-mono">q</code>{" "}
          come back from <em>different</em> sides, the current node is where they split, so it is the LCA. If
          both come back from one side, the answer is up that side.
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`def lca(root, p, q):
    if root is None or root is p or root is q:
        return root                 # base case: found one, or fell off
    left  = lca(root.left,  p, q)
    right = lca(root.right, p, q)
    if left and right:
        return root                 # p and q split here -> this node is the LCA
    return left or right            # both on one side (or neither): pass it up`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you can state the return-value invariant exactly: <em>lca(node) returns the LCA if both p and q
          are in node's subtree; otherwise it returns whichever of p or q is present, and None if neither is.</em>{" "}
          The whole algorithm is just that invariant applied bottom-up. Candidates who cannot articulate what
          the function returns in the one-sided case are pattern-matching, not reasoning.
        </Callout>
      </Block>

      <Block eyebrow="the BST shortcut" title="Walk down by value in O(h)">
        <p className="text-ink-dim leading-relaxed mb-2">
          In a <strong>binary search tree</strong> you do not need to search both subtrees. Because keys are
          ordered, the LCA is the first node where <code className="font-mono">p</code> and{" "}
          <code className="font-mono">q</code> fall on opposite sides (or one equals the node), so you walk down
          once in O(h) time and O(1) space.
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`def lca_bst(root, p, q):
    node = root
    while node:
        if p.val < node.val and q.val < node.val:
            node = node.left        # both smaller -> go left
        elif p.val > node.val and q.val > node.val:
            node = node.right       # both larger  -> go right
        else:
            return node             # they split here (or one equals node) -> LCA`}
        />
        <Callout kind="tip" title="Repeated queries: binary lifting">
          If the tree is fixed and you must answer many LCA queries, preprocess with{" "}
          <strong>binary lifting</strong>: build <code className="font-mono">up[k][v]</code>, the 2^k-th ancestor
          of v, in O(n log n). Then each query lifts the deeper node to the other's depth and jumps both up in
          powers of two until they meet, O(log n) per query. Mention Euler-tour plus sparse-table RMQ (Range Minimum Query) as the
          alternative O(1)-per-query approach.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>What if a node might not exist in the tree?</strong> The five-line version assumes both are
            present. If existence is not guaranteed, either verify both are found first, or augment the return
            to carry two booleans (found-p, found-q) up the recursion and only accept a node as the LCA once
            both flags are true.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Each node has a parent pointer, does that change anything?</strong> Yes, it becomes the
            "intersection of two linked lists" problem: walk both nodes up to the root collecting ancestors, or
            equalize depths and step up together until the pointers meet. O(h) time, O(1) space with the depth
            trick.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why is the recursive solution O(n) and can you do better for one query?</strong> It visits
            every node once, O(n) time and O(h) stack. For a single query on a general tree you cannot beat
            O(n) in the worst case, you may have to look everywhere. Binary lifting only wins when you amortize
            preprocessing across many queries.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "For a general binary tree I recurse: if the node is null or one of the targets, return it, else
          recurse both sides, and if both sides come back non-null the targets split at this node so it is the
          LCA, otherwise I pass up the non-null side. The key is the return-value invariant, the function
          returns the LCA if both targets are below, otherwise whichever target it found. In a BST I skip the
          double recursion and walk down by value to the first split point in O(h), and for many repeated
          queries I preprocess with binary lifting for O(log n) each."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The general-tree solution is a bottom-up recursion, and I would lead with its invariant because that
          is what makes it correct: a call on a node returns the lowest common ancestor if both p and q live in
          that node's subtree, otherwise it returns whichever of p or q is present there, and null if neither
          is. Given that, the code writes itself: the base case returns the node if it is null or equal to p or
          q, then I recurse left and right; if both return non-null then p and q were found on different sides,
          so this node is where they first meet and it is the answer, and if only one side is non-null I return
          that, propagating the found target upward. It is O(n) time and O(h) stack. For a binary search tree I
          exploit the ordering: starting at the root, if both keys are smaller I go left, if both are larger I
          go right, and the first node where they diverge, or where one equals the node, is the LCA, an O(h)
          walk with O(1) space. If the tree is static and queries are frequent I switch to binary lifting: I
          precompute each node's 2^k-th ancestors in O(n log n), then answer each query by lifting the deeper
          node to equal depth and jumping both up in powers of two until they coincide, O(log n) per query. And
          if nodes carry parent pointers, LCA degenerates into finding where two upward paths intersect."
        </Callout>
      </Block>
    </>
  );
}

/* ── Serialize / deserialize a tree ───────────────────────────── */
function Serialize() {
  return (
    <>
      <Lede>
        Serialize and deserialize is really one instruction: <strong>design an unambiguous grammar for the
        tree, then write the encoder and decoder as two halves of a single contract</strong>. Preorder with
        explicit null markers is the cleanest grammar, the decoder consumes the exact tokens the encoder
        produced, in the exact same order. Get the contract symmetric and the code is short.
      </Lede>

      <Block eyebrow="the grammar" title="Preorder with null markers">
        <p className="text-ink-dim leading-relaxed mb-2">
          Encode each node as its value followed by its left and right subtrees; encode a missing child as a
          sentinel like <code className="font-mono">#</code>. Decode by reading tokens in the same preorder: a
          value builds a node and recursively builds its two children, a sentinel returns null. The null markers
          are what make the string unambiguous, without them you cannot tell a leaf from an internal node.
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`def serialize(root):
    out = []
    def pre(node):
        if node is None:
            out.append("#")          # explicit null marker
            return
        out.append(str(node.val))
        pre(node.left)
        pre(node.right)              # preorder: root, left, right
    pre(root)
    return ",".join(out)

def deserialize(data):
    vals = iter(data.split(","))
    def build():
        v = next(vals)               # consume tokens in the SAME order
        if v == "#":
            return None
        node = TreeNode(int(v))
        node.left  = build()
        node.right = build()
        return node
    return build()`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you treat encode and decode as <em>one contract</em>: the same traversal order, the same null
          marker, the same delimiter on both sides. The signal is naming it as a grammar-design problem, "any
          unambiguous encoding works, I am choosing preorder with null sentinels," rather than hacking a
          format that only your encoder happens to understand.
        </Callout>
      </Block>

      <Block eyebrow="the alternative grammar" title="Level-order (BFS) with null markers">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>BFS level-order</strong> encoding is equally valid and is the format LeetCode prints: a
          queue emits each node's value and enqueues its children, pushing a null marker for absent children;
          decode by reading the level-order stream and attaching children from the queue. Same principle, a
          different unambiguous grammar. Preorder is usually less code because the recursion mirrors the tree.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`tree:        1
            / \\
           2   3
              / \\
             4   5

preorder + nulls:   1,2,#,#,3,4,#,#,5,#,#
level-order + nulls: 1,2,3,#,#,4,5,#,#,#,#

both round-trip exactly. the contract is: decoder consumes tokens
in the same order the encoder wrote them.`}
        />
        <Callout kind="tip" title="It generalizes past binary trees">
          For an N-ary tree, add a child-count (or an end-of-children sentinel) to the grammar so the decoder
          knows how many children to read. Same discipline: make the structure recoverable from the token
          stream alone.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Do you strictly need the null markers?</strong> For a general binary tree, yes, one
            traversal alone is ambiguous. The classic exception is a BST, where preorder alone is enough because
            the ordering lets you reconstruct structure by value ranges, no sentinels required.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What about values that contain your delimiter?</strong> Name it: if values can contain the
            comma, use a length-prefixed encoding or escape the delimiter. It is the same robustness concern as
            any serialization format, and flagging it is a positive signal.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Recursive decode risks a stack overflow on a skewed tree, alternative?</strong> Convert the
            preorder decode to an explicit stack, or use the level-order BFS form, which is naturally iterative.
            For very deep trees an iterative decoder is the safe choice.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I treat it as designing an unambiguous grammar and writing the encoder and decoder as one contract.
          I use preorder with explicit null markers: serialize emits value, then left, then right, with a
          sentinel for missing children; deserialize consumes the same tokens in the same order, building a node
          and its two children recursively, and returning null on a sentinel. The null markers are what remove
          the ambiguity. A BFS level-order encoding works identically, and for a BST you can even skip the
          markers because the ordering recovers the structure."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The framing I lead with is that serialization is grammar design: I need an encoding of the tree into
          a string such that the string determines the tree uniquely, and then encode and decode are two halves
          of that single contract. My default grammar is preorder with null markers. Serialize walks the tree
          root, left, right, appending each value, and appends a sentinel like a hash for every missing child so
          leaves and internal nodes are distinguishable. Deserialize reads the tokens as an iterator in the
          exact same preorder: the first token becomes the current node, then I recursively build its left
          subtree and its right subtree from the following tokens, and a sentinel returns null to terminate a
          branch. Because both sides agree on order, marker, and delimiter, it round-trips exactly. I would
          mention the level-order BFS variant, which is the format LeetCode prints, as an equally valid grammar,
          and note that preorder is usually less code because the recursion mirrors the structure. Then I would
          preempt the follow-ups: the null markers are essential for a general tree but unnecessary for a BST,
          where preorder alone reconstructs by value ranges; if values can contain the delimiter I length-prefix
          or escape them; and for a pathologically deep tree I make the decoder iterative to avoid blowing the
          stack."
        </Callout>
      </Block>
    </>
  );
}

/* ── Topological sort & Dijkstra ──────────────────────────────── */
function GraphKit() {
  return (
    <>
      <Lede>
        Two graph tools cover most of what a Google loop asks beyond plain traversal. <strong>Topological
        sort</strong> orders a directed acyclic graph so every edge points forward, and it doubles as a
        directed-cycle detector. <strong>Dijkstra</strong> finds shortest paths on non-negative weights with a
        min-heap. The meta-skill is picking the right one: ordering-under-dependencies is topo, weighted
        shortest path is Dijkstra, and unweighted shortest path is just BFS.
      </Lede>

      <Block eyebrow="ordering" title="Topological sort, two ways, plus cycle detection">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Kahn's algorithm (BFS on in-degrees)</strong> repeatedly removes a node with no remaining
          prerequisites: seed a queue with the in-degree-0 nodes, pop one into the order, decrement its
          neighbors, and enqueue any that reach in-degree 0. If the final order is missing nodes, those nodes
          are stuck in a <strong>cycle</strong>, so no valid ordering exists.
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`from collections import deque

def topo_sort(n, edges):             # edges: (u, v) means u must come before v
    indeg = [0] * n
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1            # one prerequisite of v satisfied
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []   # [] -> a cycle exists`}
        />
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>DFS variant</strong> pushes each node onto a stack <em>after</em> visiting all its
          descendants (post-order), then reverses the stack. Cycle detection there uses three colors: a node
          currently on the recursion stack is "gray," and an edge back to a gray node is a back edge, a cycle.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          That you connect topological sort to cycle detection without prompting, "if I cannot order all the
          nodes, the leftovers form a cycle, which is exactly why Course Schedule is solvable or not." Naming
          Kahn versus DFS and their respective cycle tests (leftover nodes versus a gray back edge) is the
          depth signal.
        </Callout>
      </Block>

      <Block eyebrow="weighted shortest path" title="Dijkstra with a min-heap">
        <p className="text-ink-dim leading-relaxed mb-2">
          Dijkstra grows a frontier of settled nodes, always expanding the closest unsettled one. A min-heap
          keyed by tentative distance gives the next node in O(log V), and each edge relaxation may push a new,
          shorter distance. The lazy-deletion trick, skip a popped entry whose distance is stale, keeps it
          simple. Total cost O((V+E) log V).
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`import heapq

def dijkstra(n, adj, src):           # adj[u] = list of (v, w) with w >= 0
    dist = [float("inf")] * n
    dist[src] = 0
    pq = [(0, src)]                  # (distance so far, node)
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue                 # stale entry, a shorter path already settled u
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd         # relax the edge
                heapq.heappush(pq, (nd, v))
    return dist`}
        />
        <Callout kind="trap" title="Dijkstra requires non-negative weights">
          A negative edge can make a longer path cheaper <em>after</em> a node is settled, which breaks
          Dijkstra's greedy assumption that the first time you pop a node you have its shortest distance. If
          weights can be negative, switch to Bellman-Ford (O(VE), and it detects negative cycles). And do not
          reach for Dijkstra on an <strong>unweighted</strong> graph, plain BFS already gives the shortest path
          there in O(V+E), which is why Word Ladder is a BFS, not a Dijkstra.
        </Callout>
      </Block>

      <Block eyebrow="picking one" title="Which tool, from the problem's shape">
        <OpTable
          cols={["The problem is about", "Reach for", "", "Why"]}
          rows={[
            { op: "Ordering under dependencies", avg: "Topological sort", avgTone: "good", why: "Build order, course schedule, task scheduling. Kahn's or DFS post-order; leftovers mean a cycle and no valid order." },
            { op: "Shortest path, weighted, non-negative", avg: "Dijkstra", avgTone: "good", why: "Min-heap by distance, relax edges. O((V+E) log V). The default weighted shortest-path tool." },
            { op: "Shortest path, unweighted", avg: "BFS", avgTone: "ok", why: "Every edge costs 1, so the first time BFS reaches a node is the shortest path. No heap needed, O(V+E)." },
            { op: "Shortest path with negative edges", avg: "Bellman-Ford", avgTone: "bad", why: "Dijkstra's greedy step is invalid with negatives. Bellman-Ford is O(VE) and flags negative cycles." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Drill the traversal foundations these build on in{" "}
          <XLink to="#/interview-bench">Interview Bench</XLink> ("BFS", "DFS") and{" "}
          <XLink to="#/dsa-lab">DSA Lab</XLink> ("Graph").
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Kahn's or DFS for topo sort, which do you pick?</strong> Kahn's if I also want easy cycle
            detection and a natural BFS layering, or to detect the cycle early. DFS post-order if recursion is
            cleaner for the problem or I need the finish-time ordering for something else. Both are O(V+E).
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why does the stale-entry check in Dijkstra matter?</strong> Because I push a new heap entry
            on every relaxation instead of decreasing a key, a node can sit in the heap multiple times. Skipping
            a pop whose distance exceeds the settled distance avoids reprocessing and keeps correctness and the
            O((V+E) log V) bound.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>All edge weights are equal, is Dijkstra wasteful?</strong> Yes, use BFS. And if weights are
            only 0 or 1, a 0-1 BFS with a deque (push 0-weight to the front, 1-weight to the back) beats a heap
            at O(V+E).
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How would you reconstruct the actual path, not just the distance?</strong> Keep a parent
            or previous-node array updated on each successful relaxation, then walk it backward from the target
            to the source and reverse. Same for BFS shortest path.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "For ordering under dependencies I use topological sort, Kahn's algorithm on in-degrees or a DFS
          post-order reversed, and if I cannot order every node the leftovers are a cycle, which is how Course
          Schedule decides feasibility. For weighted shortest paths with non-negative weights I use Dijkstra
          with a min-heap by distance, relaxing edges, at O((V+E) log V). I am careful about two things: Dijkstra
          needs non-negative weights or I switch to Bellman-Ford, and on an unweighted graph I just use BFS,
          which already gives the shortest path."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "These are my two graph workhorses beyond traversal. Topological sort orders a directed acyclic graph
          so every edge points forward. Kahn's algorithm is the BFS form: compute in-degrees, start from the
          in-degree-zero nodes, and repeatedly pop a node into the order while decrementing its neighbors,
          enqueuing any that hit zero; if the order ends up shorter than the node count, the remaining nodes are
          trapped in a cycle and no ordering exists, which is precisely the Course Schedule feasibility test.
          The DFS form pushes nodes in post-order and reverses, detecting cycles via a gray in-progress set and
          a back edge. Dijkstra is single-source shortest path on non-negative weights: I keep a distance array
          and a min-heap of (distance, node), and each time I pop the closest unsettled node I relax its edges,
          pushing improved distances; I skip stale heap entries whose distance is worse than the settled one.
          That is O((V+E) log V). The judgment I would voice is which tool fits: dependencies and ordering go to
          topo sort, weighted shortest paths to Dijkstra, unweighted shortest paths to plain BFS because every
          edge costs one, and anything with negative edges to Bellman-Ford, which also detects negative cycles.
          If asked for the path itself I keep a predecessor array and walk it back from the target."
        </Callout>
      </Block>
    </>
  );
}

/* ── Binary search on the answer ──────────────────────────────── */
function BsAnswer() {
  return (
    <>
      <Lede>
        The hardest binary searches are not on an array, they are on the <strong>answer itself</strong>. The
        frame: the search space is a candidate answer X, a predicate <code className="font-mono">ok(X)</code>{" "}
        becomes true past some threshold, and because the predicate is <strong>monotone</strong>, false then
        true, you can binary-search the boundary. Say that sentence out loud and problems like Koko and
        ship-in-D-days fall out immediately.
      </Lede>

      <Block eyebrow="the frame" title="Search space, monotone predicate, boundary">
        <p className="text-ink-dim leading-relaxed mb-2">
          Three questions unlock it: what is the range of candidate answers (the search space), what makes a
          candidate feasible (the predicate), and is the predicate monotone (once feasible, do all larger, or
          all smaller, candidates stay feasible). If yes, binary-search for the first feasible value.
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`def min_feasible(lo, hi, ok):
    # ok is monotone over [lo, hi]:  False, False, ..., True, True
    # returns the smallest x with ok(x) True
    while lo < hi:
        mid = lo + (hi - lo) // 2    # avoids overflow in fixed-width langs
        if ok(mid):
            hi = mid                 # mid feasible: it may be the answer, keep it
        else:
            lo = mid + 1             # mid infeasible: discard it and everything below
    return lo                        # lo == hi == the boundary`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you say the word "monotone" and justify it: "a bigger eating speed can only reduce the hours
          needed, so feasibility is monotone in speed, which is what lets me binary-search." Recognizing the
          answer space as the thing to search, rather than the input array, is the entire insight the problem
          is testing.
        </Callout>
      </Block>

      <Block eyebrow="worked" title="Koko, ship-in-D-days, split-array-largest-sum">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Koko eating bananas</strong>: find the minimum eating speed to finish all piles within{" "}
          <code className="font-mono">h</code> hours. The search space is speed from 1 to the largest pile;
          feasibility (hours needed at most h) is monotone in speed.
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`def min_eating_speed(piles, h):
    def ok(speed):
        hours = sum((p + speed - 1) // speed for p in piles)  # ceil-div per pile
        return hours <= h            # faster speed -> fewer hours -> monotone
    return min_feasible(1, max(piles), ok)`}
        />
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Capacity to ship in D days</strong> and <strong>split array largest sum</strong> are the same
          shape: the search space is the capacity or the max subarray sum (from the largest single element to
          the total), and the predicate is "can I stay within D groups at this cap." Every one of these is{" "}
          <code className="font-mono">min_feasible</code> with a different <code className="font-mono">ok</code>.
        </p>
        <Callout kind="trap" title="Loop termination and overflow">
          Use <code className="font-mono">while lo &lt; hi</code> with <code className="font-mono">hi = mid</code>{" "}
          on success and <code className="font-mono">lo = mid + 1</code> on failure, and the loop always
          terminates because the interval strictly shrinks. Compute mid as{" "}
          <code className="font-mono">lo + (hi - lo) // 2</code> to avoid integer overflow in fixed-width
          languages. Getting an off-by-one here (returning hi+1, or looping forever) is the most common way this
          pattern fails.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you set the lo and hi bounds?</strong> From the problem's physics: lo is the smallest
            answer that could ever work, hi is one that trivially works. For Koko, lo is 1 banana per hour and
            hi is the largest pile (eating any pile in an hour). Loose but valid bounds are fine, binary search
            eats the slack in log time.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What if you want the largest feasible value, not the smallest?</strong> Flip the template:
            search for the last true instead of the first true, moving lo up on success and hi down on failure,
            with the mid-rounding adjusted to avoid a stuck loop. Same idea, mirror image.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you know the predicate is really monotone?</strong> Argue it from the problem: more
            capacity never needs more days, more speed never needs more hours. If feasibility can flip back and
            forth, binary search does not apply and you likely need a different method entirely.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "When the answer is a number in a range and I can write a monotone feasibility check, I binary-search
          the answer instead of the array. I identify the search space, the smallest to largest candidate, write
          a predicate that is false then true across that range, and find the boundary. Koko's minimum eating
          speed, capacity to ship in D days, and split-array-largest-sum are all this one template with a
          different predicate. I keep the loop as while lo less than hi with hi equal to mid on success, and I
          compute mid without overflow."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The pattern I am recognizing is: the output is a single value in a known numeric range, and I can
          cheaply test whether a given candidate value works. If that feasibility test is monotone, meaning once
          a candidate is feasible every larger candidate is too, or every smaller one is, then the boundary
          between infeasible and feasible is exactly the answer and I can binary-search for it in log of the
          range times the cost of one test. I set lo and hi from the problem's physics: for Koko eating bananas,
          the eating speed ranges from one up to the largest pile, and the predicate computes the total hours at
          that speed with a ceiling division per pile and checks it is within the limit, which is monotone
          because a higher speed can only reduce the hours. Capacity to ship packages in D days and split array
          into K subarrays with minimized largest sum are the same shape: the search space is the capacity or
          the maximum group sum, from the largest single element up to the total, and the predicate greedily
          counts how many days or groups that cap forces and checks it fits. The implementation detail I am
          careful about is the loop: while lo is less than hi, set hi to mid when feasible so I keep a possibly
          optimal candidate, and lo to mid plus one when not, which strictly shrinks the interval so it always
          terminates on the boundary, and I compute mid as lo plus half the gap to avoid overflow. If the
          problem wants the largest feasible value instead I mirror the template."
        </Callout>
      </Block>
    </>
  );
}

/* ── Prefix sums & difference arrays ──────────────────────────── */
function Prefix() {
  return (
    <>
      <Lede>
        Prefix sums and difference arrays are duals: a <strong>prefix sum</strong> turns many range{" "}
        <em>queries</em> into O(1) lookups, and a <strong>difference array</strong> turns many range{" "}
        <em>updates</em> into O(1) writes. Recognizing which one a problem needs, and that Subarray Sum Equals K
        is a prefix sum plus a hashmap, is a fast, high-frequency win in a Google round.
      </Lede>

      <Block eyebrow="range queries" title="Prefix sums, and the Subarray-Sum-Equals-K trick">
        <p className="text-ink-dim leading-relaxed mb-2">
          Precompute a running total so any subarray sum is a difference of two prefixes,{" "}
          <code className="font-mono">sum(i..j) = P[j+1] - P[i]</code>, in O(1) after an O(n) build. The powerful
          variant: to count subarrays summing to <code className="font-mono">k</code>, keep a hashmap of how
          many times each running prefix has occurred, and at each step look for{" "}
          <code className="font-mono">running - k</code>, every earlier prefix at that value marks a subarray of
          sum k ending here.
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`def subarray_sum(nums, k):
    count = 0
    running = 0
    seen = {0: 1}                    # empty prefix: sum 0 seen once
    for x in nums:
        running += x
        count += seen.get(running - k, 0)   # earlier prefixes that leave a gap of k
        seen[running] = seen.get(running, 0) + 1
    return count`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you reach for a prefix sum the instant a problem has repeated range-sum questions, and that you
          know the hashmap-of-prefix-counts turns Subarray Sum Equals K from O(n^2) into a single O(n) pass. The
          "sum 0 seen once" seed is a detail interviewers notice, it handles subarrays that start at index 0.
        </Callout>
      </Block>

      <Block eyebrow="range updates" title="Difference arrays, the inverse trick">
        <p className="text-ink-dim leading-relaxed mb-2">
          To add <code className="font-mono">v</code> across a range <code className="font-mono">[l, r]</code>{" "}
          many times, do not touch every element. Record <code className="font-mono">+v</code> at{" "}
          <code className="font-mono">l</code> and <code className="font-mono">-v</code> just past{" "}
          <code className="font-mono">r</code> in a difference array; one prefix-sum pass at the end materializes
          the final array. Each update is O(1), and the whole thing is O(n + updates).
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`def range_add(n, updates):           # updates: (l, r, v) adds v to [l, r]
    diff = [0] * (n + 1)
    for l, r, v in updates:
        diff[l] += v
        diff[r + 1] -= v             # cancel the +v just past the range end
    out, running = [], 0
    for i in range(n):
        running += diff[i]           # prefix-sum pass materializes the array
        out.append(running)
    return out`}
        />
        <Callout kind="tip" title="Two dimensions, one formula">
          Both generalize to a grid. A 2-D prefix sum answers any rectangle sum by inclusion-exclusion:{" "}
          <code className="font-mono">S = P[r2][c2] - P[r1-1][c2] - P[r2][c1-1] + P[r1-1][c1-1]</code>. The 2-D
          difference array stamps a rectangle with four corner deltas, then one 2-D prefix pass materializes it.
          Product of Array Except Self is the same family too, prefix products times suffix products, no
          division, drill it in{" "}
          <XLink to="#/interview-bench">Interview Bench</XLink>.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>The array changes between queries, does prefix sum still work?</strong> No, a static prefix
            sum assumes the data is fixed. For interleaved updates and range queries you need a Fenwick tree
            (binary indexed tree) or a segment tree, both O(log n) per operation. Naming that upgrade is the
            senior move.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why a hashmap of counts, not a set, for Subarray Sum Equals K?</strong> Because the same
            prefix value can occur multiple times and each occurrence is a distinct valid start, so I need the
            count, not just presence. A set would undercount when prefixes repeat.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>When is the difference array the wrong choice?</strong> When updates and reads are
            interleaved rather than "all updates, then read once." The difference array is a batch trick, it
            only materializes at the end; live interleaving again wants a Fenwick or segment tree.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Prefix sums and difference arrays are duals. A prefix sum makes any range-sum query O(1) after an
          O(n) build, and with a hashmap of prefix counts it turns Subarray Sum Equals K into one O(n) pass by
          looking for running minus k. A difference array makes many range updates O(1) each, record plus v at
          the start and minus v past the end, then one prefix pass materializes the result. Both extend to 2-D
          by inclusion-exclusion. If updates and queries interleave, I upgrade to a Fenwick or segment tree."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I think of these as a matched pair. The prefix sum precomputes a running total so the sum of any
          subarray is the difference of two prefix values in constant time, after a linear build, which is the
          right tool the moment a problem asks repeated range-sum questions on static data. The variant worth
          having memorized is Subarray Sum Equals K: I keep a hashmap from each running prefix sum to how many
          times it has occurred, seeded with sum zero seen once so subarrays starting at index zero are counted,
          and at each element I add to the answer the number of earlier prefixes equal to running minus k,
          because each such prefix marks a subarray of sum k ending here. That is one linear pass instead of the
          quadratic double loop. The difference array is the inverse: to apply many range additions, I add v at
          the left index and subtract v just past the right index, and a single prefix-sum pass at the end
          reconstructs the final array, so each update is constant time and I never touch the interior during
          updates. Both generalize to two dimensions, rectangle sums by inclusion-exclusion with four corner
          terms, and rectangle stamping with four corner deltas. The limit I would state is that both assume a
          batch shape, all updates then read, or a static array then queries; the moment updates and queries
          interleave I move to a Fenwick tree or segment tree at log n per operation."
        </Callout>
      </Block>
    </>
  );
}

/* ── Data-structure design for Staff ──────────────────────────── */
const DS_CHECKLIST = [
  { k: "API & behavior", v: "Name every method, its arguments, its return, and what happens on the edge cases (missing key, full, empty). Pin the contract before touching internals." },
  { k: "Internal state", v: "Which primitive structures compose it, a hashmap for O(1) lookup, a linked list for O(1) reorder, a heap for the extreme. State the representation invariant that ties them together." },
  { k: "Complexity of EVERY operation", v: "Not just the headline. get, put, evict, peek, each gets a time and space bound, and you say them as you go." },
  { k: "Thread-safety assumptions", v: "Single-threaded, or concurrent? If concurrent, what is the locking strategy, and where is the contention? State the assumption even if the answer is single-threaded." },
  { k: "Cleanup & memory growth", v: "What bounds the memory? Eviction policy, TTL expiry, compaction. An unbounded cache is a leak, name what keeps it finite." },
  { k: "Handling time", v: "If behavior depends on time (rate limiters, TTL caches, time-based KV), how is 'now' supplied, is it monotonic, and how do you make it testable and deterministic?" },
];

function DsDesign() {
  return (
    <>
      <Lede>
        A data-structure design question ("build an LRU cache," "build a rate limiter") is not really a coding
        puzzle, it is a <strong>miniature system-design round</strong>. At Staff the interviewer expects you to
        define the API, name the internal representation and its invariant, state the complexity of{" "}
        <em>every</em> operation, and speak to thread-safety, memory growth, and time, before and while you
        code.
      </Lede>

      <Block eyebrow="the Staff framing" title="Six things to nail on every design question">
        <div className="space-y-2.5 mb-2">
          {DS_CHECKLIST.map((c) => (
            <div key={c.k} className="rounded-lg border border-line bg-surface-2 p-3">
              <div className="font-mono text-[12px] font-semibold text-ink mb-1">{c.k}</div>
              <div className="text-[13px] text-ink-dim leading-relaxed">{c.v}</div>
            </div>
          ))}
        </div>
        <Callout kind="note" title="What the interviewer is listening for">
          Engineering maturity, not just a working structure. At L6 they want the API pinned first, the
          representation invariant stated, a complexity for every operation, and unprompted mention of
          thread-safety, memory bounds, and how time is handled. A candidate who only builds the happy path
          reads as mid-level however clean the code is.
        </Callout>
      </Block>

      <Block eyebrow="worked example" title="LRU cache: hashmap + doubly linked list, all O(1)">
        <p className="text-ink-dim leading-relaxed mb-2">
          The canonical example. The API is <code className="font-mono">get(key)</code> and{" "}
          <code className="font-mono">put(key, value)</code>, both O(1). The representation: a{" "}
          <strong>hashmap</strong> from key to node for O(1) lookup, and a <strong>doubly linked list</strong>{" "}
          ordered most-to-least recently used so touching a node (unlink, move to front) and evicting the
          least-recent (drop the tail) are both O(1). The invariant: the map's keys are exactly the list's
          nodes, and list order is recency order.
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`class Node:
    __slots__ = ("key", "val", "prev", "next")
    def __init__(self, key, val):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}                     # key -> Node, O(1) lookup
        self.head = Node(0, 0)            # sentinel: most-recently-used end
        self.tail = Node(0, 0)            # sentinel: least-recently-used end
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, node):
        node.prev.next, node.next.prev = node.next, node.prev

    def _push_front(self, node):
        node.prev, node.next = self.head, self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        if key not in self.map:
            return -1
        node = self.map[key]
        self._remove(node)                # touch -> move to front
        self._push_front(node)
        return node.val

    def put(self, key, val):
        if key in self.map:
            self._remove(self.map[key])
        node = Node(key, val)
        self.map[key] = node
        self._push_front(node)
        if len(self.map) > self.cap:      # over capacity -> evict the tail
            lru = self.tail.prev
            self._remove(lru)
            del self.map[lru.key]`}
        />
        <Callout kind="tip" title="Sentinels remove the edge cases">
          The head and tail sentinel nodes mean <code className="font-mono">_remove</code> and{" "}
          <code className="font-mono">_push_front</code> never special-case an empty list or the ends, every
          node always has a real prev and next. Saying "I use sentinels to kill the boundary conditions" is a
          small but real senior signal.
        </Callout>
      </Block>

      <Block eyebrow="the full set" title="Then point to the worked bench">
        <p className="text-ink-dim leading-relaxed mb-2">
          LRU is the template; the same framing scales to the rest. The full worked set, with the state,
          per-operation complexity, and the trade-offs, lives in{" "}
          <XLink to="#/staff-bench">Staff Bench</XLink>: LRU Cache, LFU Cache, Rate Limiter, Time-based
          Key-Value, Insert/Delete/GetRandom O(1), Median of a Stream, and Bloom Filter. Use{" "}
          <XLink to="#/identifier">The Identifier</XLink> to practice mapping a prompt to the right composition
          of primitives.
        </p>
        <Callout kind="trap" title="The composition, not the primitive, is the answer">
          Almost every one of these is two primitives glued by an invariant: LRU is hashmap plus linked list,
          Insert/Delete/GetRandom is hashmap plus dynamic array, Median of a Stream is two heaps. The skill the
          question tests is choosing the pair whose strengths cover each operation's cost, and stating the
          invariant that keeps them consistent.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Make the LRU cache thread-safe.</strong> Wrap get and put in a single lock, since both
            mutate the shared map and list, the whole touch-and-move must be atomic. Then discuss the
            contention: a global lock serializes all access, so for high concurrency I would shard the cache by
            key hash into independently locked segments, trading strict global LRU for throughput.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Now make it LFU instead of LRU.</strong> The representation changes: a frequency-to-list
            map plus a min-frequency pointer, so I can evict from the least-frequently-used bucket in O(1). It
            is a good example of the API staying fixed while the internal invariant is redesigned.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you make a time-based structure testable?</strong> Inject the clock, pass a "now"
            function or timestamp rather than calling the system clock inside the structure. That makes expiry
            and rate-limit behavior deterministic in tests, and it is the detail that separates production-ready
            from whiteboard code.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What bounds the memory over time?</strong> State it explicitly per structure: the LRU is
            bounded by capacity, a TTL cache by expiry plus a sweep or lazy purge, a rate limiter by the number
            of distinct keys times the window. An unbounded structure is a leak, and naming the bound is
            expected at Staff.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I treat a data-structure design question as a mini system design: I pin the API and its edge behavior
          first, name the internal representation and the invariant that ties it together, and state the
          complexity of every operation, not just the headline. Then I speak to thread-safety, what bounds the
          memory, and how time is handled. LRU is the template, a hashmap for O(1) lookup plus a doubly linked
          list for O(1) recency reordering, and the same framing scales to LFU, rate limiters, time-based
          key-value, and median of a stream."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "My checklist for any 'design a data structure' prompt has six items and I run them out loud. First,
          the API and behavior: every method, its arguments and return, and what it does on the edge cases like
          a missing key or a full structure, pinned before I touch internals. Second, the internal state: which
          primitives compose it and the representation invariant that keeps them consistent, because almost
          every answer is two primitives glued by an invariant. Third, the complexity of every operation, stated
          as I implement each one. Fourth, thread-safety: single-threaded or concurrent, and if concurrent, the
          locking strategy and where the contention is. Fifth, cleanup and memory growth: what keeps it bounded,
          eviction, TTL, or compaction, since an unbounded cache is a leak. Sixth, time: if behavior depends on
          now, I inject the clock so it is deterministic and testable. LRU makes it concrete: the API is get and
          put, both O(1); the state is a hashmap from key to node for lookup plus a doubly linked list ordered by
          recency so touching a node and evicting the least-recent are O(1); the invariant is that the map's
          keys are exactly the list's nodes in recency order; sentinels remove the boundary conditions. For
          thread-safety I lock the whole touch-and-move, and shard by key for throughput; to turn it into LFU I
          swap the list for frequency buckets with a min-frequency pointer. The full worked set, LFU, rate
          limiter, time-based key-value, insert-delete-getRandom, median of a stream, and Bloom filter, is on
          the Staff Bench, and the recognition drill is in The Identifier."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ───────────────────────────────────── */
const DECK = [
  {
    q: "What two optimizations make Union-Find near O(1), and what is the bound?",
    a: "Path compression (a find repoints every node on the path straight at the root) and union by size or rank (attach the smaller tree under the larger root). Together they give near-constant amortized time, the inverse-Ackermann function, at most about 4 for any real input.",
    tag: "union-find",
  },
  {
    q: "When do you use Union-Find instead of BFS/DFS?",
    a: "When the problem only needs 'are these in the same set?' and 'merge them', especially with edges arriving over time. DSU is online and near-linear overall; re-running BFS/DFS per query is O(V+E) each, quadratic over a stream. Use BFS/DFS when you must enumerate or shortest-path a component.",
    tag: "union-find",
  },
  {
    q: "How does Union-Find detect a cycle in an undirected graph?",
    a: "When union(a, b) finds that a and b already share a root, this edge connects two already-connected nodes, so it closes a cycle. That is exactly Redundant Connection: the first edge whose union returns false is the cycle-closing edge.",
    tag: "union-find",
  },
  {
    q: "State the return-value invariant of the recursive LCA.",
    a: "lca(node) returns the lowest common ancestor if both p and q are in node's subtree; otherwise it returns whichever of p or q is present, and None if neither. The algorithm is just that invariant applied bottom-up: if both children return non-null, they split at this node, so it is the LCA.",
    tag: "trees",
  },
  {
    q: "What is the BST shortcut for LCA?",
    a: "Walk down from the root: if both keys are smaller go left, if both are larger go right, otherwise they split at this node (or one equals it), so it is the LCA. O(h) time, O(1) space, no double recursion needed.",
    tag: "trees",
  },
  {
    q: "How do you serialize a binary tree, and why the null markers?",
    a: "Preorder (root, left, right), emitting each value and a sentinel like '#' for a missing child; deserialize consumes the same tokens in the same order. The null markers make the encoding unambiguous, without them you cannot distinguish a leaf from an internal node.",
    tag: "trees",
  },
  {
    q: "Why is serialize/deserialize really a grammar problem?",
    a: "Because encode and decode are two halves of one contract: any encoding works as long as it is unambiguous and both sides agree on traversal order, null marker, and delimiter. The decoder must recover the tree from the token stream alone.",
    tag: "trees",
  },
  {
    q: "Kahn's algorithm vs DFS for topological sort?",
    a: "Kahn's is BFS on in-degrees: start from in-degree-0 nodes, pop into the order, decrement neighbors, enqueue new zeros. DFS pushes nodes in post-order and reverses. Both are O(V+E); Kahn's gives easy cycle detection and layering, DFS is cleaner when recursion fits.",
    tag: "graphs",
  },
  {
    q: "How do the two topo-sort methods detect a cycle?",
    a: "Kahn's: if the produced order is shorter than the node count, the leftover nodes are stuck in a cycle. DFS: a back edge to a node currently on the recursion stack (a 'gray' node) is a cycle. A cycle means no valid topological order exists.",
    tag: "graphs",
  },
  {
    q: "Why does Dijkstra require non-negative edge weights?",
    a: "Its greedy step assumes the first time you pop a node you have its final shortest distance. A negative edge could later make a longer-looking path cheaper, breaking that assumption. With negatives, use Bellman-Ford (O(VE)), which also detects negative cycles.",
    tag: "graphs",
  },
  {
    q: "What is Dijkstra's complexity, and what's the stale-entry trick?",
    a: "O((V+E) log V) with a binary min-heap. Because I push a new entry on each relaxation instead of decreasing a key, a node can appear multiple times, so on pop I skip any entry whose stored distance exceeds the settled distance.",
    tag: "graphs",
  },
  {
    q: "When is BFS the right shortest-path tool, not Dijkstra?",
    a: "On an unweighted graph (or all-equal weights): every edge costs 1, so the first time BFS reaches a node is its shortest path, O(V+E), no heap. That is why Word Ladder is a BFS. For 0/1 weights, a 0-1 BFS with a deque.",
    tag: "graphs",
  },
  {
    q: "What is 'binary search on the answer'?",
    a: "When the answer is a value in a numeric range and feasibility is monotone (false then true), binary-search the boundary instead of the array. Identify the search space, write a monotone predicate ok(x), and find the first x where ok is true.",
    tag: "binary search",
  },
  {
    q: "How do Koko and ship-in-D-days fit binary-search-on-the-answer?",
    a: "Koko: search eating speed from 1 to the max pile; the predicate 'hours needed at most h' is monotone because faster speed means fewer hours. Ship-in-D-days: search capacity; the predicate 'fits within D days' is monotone in capacity. Same template, different predicate.",
    tag: "binary search",
  },
  {
    q: "How does a prefix sum turn Subarray Sum Equals K into O(n)?",
    a: "Keep a hashmap of how many times each running prefix sum has occurred, seeded with {0: 1}. At each element, add the count of prefixes equal to (running - k), each marks a subarray of sum k ending here. One linear pass instead of the O(n^2) double loop.",
    tag: "prefix sums",
  },
  {
    q: "What does a difference array do, and when?",
    a: "It makes many range updates O(1) each: to add v across [l, r], record +v at l and -v at r+1, then one prefix-sum pass materializes the final array. It is a batch trick, all updates then read once; interleaved updates and reads want a Fenwick or segment tree.",
    tag: "prefix sums",
  },
  {
    q: "Prefix sum vs difference array, what's the relationship?",
    a: "They are duals. Prefix sums make range queries O(1) on static data; difference arrays make range updates O(1) before one materializing pass. Both extend to 2-D by inclusion-exclusion. If queries and updates interleave, upgrade to a Fenwick or segment tree.",
    tag: "prefix sums",
  },
  {
    q: "How is an LRU cache built for all-O(1) operations?",
    a: "A hashmap from key to node for O(1) lookup, plus a doubly linked list ordered most-to-least recently used so touching a node (unlink, move to front) and evicting the least-recent (drop the tail) are O(1). Sentinel head/tail nodes remove the boundary cases.",
    tag: "ds design",
  },
  {
    q: "What is Google's coding rubric, in order?",
    a: "Clarify the problem and constraints, state the approach and its complexity before coding, write correct readable code, name invariants and Big-O, test the edges, optimize only when pushed, and communicate continuously. Each step produces a signal the interviewer writes into the packet.",
    tag: "the bar",
  },
  {
    q: "Why 'not clever code', and does a strong design round rescue weak coding?",
    a: "Readable, idiomatic code a teammate could maintain scores higher than a dense one-liner the interviewer must decode, they are imagining you in code review. And no: the packet scores coding as its own gating signal, so a great design round does not buy back a shaky coding round, even at L6.",
    tag: "the bar",
  },
];

function Quickfire() {
  return (
    <>
      <Lede>
        Twenty cards spanning the whole tool, the seven patterns to add plus the coding bar itself: Union-Find,
        LCA, tree serialization, topological sort and Dijkstra, binary search on the answer, prefix and
        difference arrays, LRU internals, and how Google scores the round. Read the prompt, answer out loud in a
        sentence or two, then reveal and grade yourself. Out loud is the rep.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  bar: <Bar />,
  map: <Map />,
  unionfind: <UnionFind />,
  lca: <Lca />,
  serialize: <Serialize />,
  graphkit: <GraphKit />,
  bsanswer: <BsAnswer />,
  prefix: <Prefix />,
  dsdesign: <DsDesign />,
  quickfire: <Quickfire />,
};

export default function GoogleCoding() {
  const [active, setActive] = useState("bar");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="The coding bar · THE REPS"
      title="Coding for Google"
      subtitle="How Google scores coding, a map into the drills this site already has, and the seven patterns worth adding for a Google loop."
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
