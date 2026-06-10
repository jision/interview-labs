import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag, ComplexityTag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import ConstraintDecoderViz from "./identifier/ConstraintDecoderViz.jsx";
import PatternSnifferViz from "./identifier/PatternSnifferViz.jsx";
import TricksVaultViz from "./identifier/TricksVaultViz.jsx";
import DisambiguationViz from "./identifier/DisambiguationViz.jsx";

const ACCENT = "#ffcf4a";

const TOPICS = [
  { id: "constraints", label: "Constraint Decoder", group: "Decode" },
  { id: "patterns", label: "Pattern Sniffer", group: "Decode" },
  { id: "budget", label: "Complexity Budget", group: "Decode" },
  { id: "tricks", label: "Tricks Vault", group: "Recall" },
  { id: "disambig", label: "Disambiguation", group: "Recall" },
];

/* Bind the tool accent once so <Block>/<Try> don't repeat it everywhere. */
const { Block, Try } = withAccent(ACCENT);

/* ── Constraint Decoder ───────────────────────────────────────── */
function Constraints() {
  return (
    <>
      <Lede>
        The input bound is a <em>spoiler</em>. Before you write a line of code, read{" "}
        <code className="text-ink font-mono">n ≤ ?</code> and back-solve the target Big-O: at roughly{" "}
        <strong>10⁸ operations per second</strong>, the largest <code className="text-ink font-mono">n</code> you
        can afford pins down which complexity class — and therefore which technique — has to fit.
      </Lede>

      <Try><ConstraintDecoderViz /></Try>

      <Block eyebrow="how to read it" title="Work backwards from n">
        <p className="text-ink-dim leading-relaxed mb-2">
          Pick the time budget (~10⁸ ops in a second is the standard envelope), then find the biggest{" "}
          complexity whose op-count stays under it for the given <code className="font-mono">n</code>. The
          jump from <code className="font-mono">n ≤ 5000</code> to <code className="font-mono">n ≤ 10⁵</code>{" "}
          is the single most important tell in interviews: it quietly forbids your O(n²) double loop and
          demands O(n log n) or O(n).
        </p>
        <Callout kind="tip" title="Interview line">
          "n is up to 10⁵, so an O(n²) solution would be ~10¹⁰ operations — too slow. That pushes me toward
          sorting or a hash map for O(n log n) / O(n)." Saying this out loud signals you read constraints
          like a senior engineer.
        </Callout>
        <Callout kind="trap" title="n is a value, not always a count">
          When you see <code className="font-mono">n ≤ 10¹⁸</code>, n is a <em>number</em> you can't
          enumerate — that's a hint for math, binary exponentiation, or digit DP over its ~18 digits, never
          a loop to n.
        </Callout>
      </Block>

      <Block eyebrow="quick reference" title="Bound → ceiling, at a glance">
        <OpTable
          cols={["Input bound", "Largest viable", "", "What it's telling you"]}
          rows={[
            { op: "n ≤ 10–12", avg: "O(n!)", avgTone: "bad", why: "Brute-force all orderings / backtracking — tiny by design." },
            { op: "n ≤ 18–22", avg: "O(2ⁿ)", avgTone: "bad", why: "Bitmask DP over subsets; 2²⁰ ≈ 10⁶." },
            { op: "n ≤ 100–500", avg: "O(n³)", avgTone: "bad", why: "Floyd–Warshall, interval DP, triple loops are fine." },
            { op: "n ≤ 2000–5000", avg: "O(n²)", avgTone: "bad", why: "Two nested loops / classic 2D DP (LCS, edit distance)." },
            { op: "n ≤ 10⁵–10⁶", avg: "O(n log n)", avgTone: "ok", why: "Sort / heap, or O(n) sliding window / hash — NOT O(n²)." },
            { op: "n ≤ 10⁷–10⁸", avg: "O(n)", avgTone: "ok", why: "Single linear pass, small constant; n log n gets risky." },
            { op: "n ≥ 10⁹", avg: "O(log n)", avgTone: "good", why: "Can't even read all input — math, binary search, closed form." },
          ]}
        />
      </Block>
    </>
  );
}

/* ── Pattern Sniffer ──────────────────────────────────────────── */
function Patterns() {
  return (
    <>
      <Lede>
        Problem statements are written in a code of their own. Certain phrases map almost deterministically
        to a technique — once you've internalized the dictionary, half the problem is solved by the time you
        finish reading it.
      </Lede>

      <Try><PatternSnifferViz /></Try>

      <Block eyebrow="under the hood" title="Why these mappings hold">
        <p className="text-ink-dim leading-relaxed mb-2">
          They aren't superstition — each phrase encodes a structural property the technique exploits.{" "}
          <strong>"Contiguous subarray"</strong> guarantees a window has two moving ends, so you never
          rescan. <strong>"Sorted input"</strong> hands you an ordering invariant that two-pointer and binary
          search consume directly. <strong>"All permutations"</strong> forces enumeration, which is only
          tractable because <code className="font-mono">n</code> is small — tying right back to the
          Constraint Decoder.
        </p>
        <Callout kind="tip" title="Read constraints AND keywords together">
          The phrase narrows the family; the bound on <code className="font-mono">n</code> picks the member.
          "Number of ways" + <code className="font-mono">n ≤ 1000</code> ⇒ an O(n²) DP. The same phrase with{" "}
          <code className="font-mono">n ≤ 20</code> ⇒ a 2ⁿ bitmask. Same idea, different gear.
        </Callout>
        <Callout kind="warn" title="Keywords hint, they don't prove">
          "Sorted" usually means two-pointer — but if you also need order statistics or counts, it might be
          binary search on the answer. Use the chip as a first hypothesis, then confirm against the actual
          operation you must perform.
        </Callout>
      </Block>
    </>
  );
}

/* ── Complexity Budget ────────────────────────────────────────── */
function Budget() {
  return (
    <>
      <Lede>
        Every complexity class is a neighborhood with its own residents. Learn who lives where and you can
        translate a target Big-O straight into a shortlist of algorithms — and sanity-check any idea against
        the largest <code className="text-ink font-mono">n</code> it can survive.
      </Lede>

      <Block eyebrow="the map" title="Complexity class → who lives there">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                <th className="py-2 pr-4 font-normal">Class</th>
                <th className="py-2 pr-4 font-normal">Lives here</th>
                <th className="py-2 font-normal">Feasible n (~1s)</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  tone: "good",
                  cls: "O(1)",
                  who: "Hash lookup, array index, math formula, stack/queue push-pop, heap peek.",
                  n: "any",
                },
                {
                  tone: "good",
                  cls: "O(log n)",
                  who: "Binary search, balanced-BST op, heap push/pop, binary exponentiation.",
                  n: "≈ 10¹⁸",
                },
                {
                  tone: "ok",
                  cls: "O(n)",
                  who: "Single pass, two pointers, sliding window, prefix sums, BFS/DFS, counting sort.",
                  n: "≈ 10⁸",
                },
                {
                  tone: "bad",
                  cls: "O(n log n)",
                  who: "Comparison sort, heap-of-n, divide-and-conquer (merge sort), sweep line, BIT/segment tree.",
                  n: "≈ 10⁶–10⁷",
                },
                {
                  tone: "bad",
                  cls: "O(n²)",
                  who: "Two nested loops, classic 2D DP (LCS, edit distance), Dijkstra w/ adjacency matrix.",
                  n: "≈ 5000",
                },
                {
                  tone: "bad",
                  cls: "O(2ⁿ)",
                  who: "Subset enumeration, bitmask DP (TSP, assignment), meet-in-the-middle.",
                  n: "≈ 20–25",
                },
                {
                  tone: "bad",
                  cls: "O(n!)",
                  who: "Permutation backtracking, brute-force TSP, generating all orderings.",
                  n: "≈ 10–12",
                },
              ].map((r) => (
                <tr key={r.cls} className="border-t border-line align-top">
                  <td className="py-2.5 pr-4">
                    <ComplexityTag tone={r.tone}>{r.cls}</ComplexityTag>
                  </td>
                  <td className="py-2.5 pr-4 text-ink-dim">{r.who}</td>
                  <td className="py-2.5 font-mono text-ink-dim">{r.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>

      <Block eyebrow="the bridge" title="From budget to algorithm">
        <p className="text-ink-dim leading-relaxed mb-2">
          This table is the other half of the <strong>Constraint Decoder</strong>. The decoder tells you the
          target class; this tells you the candidate algorithms inside it. Together they turn "I have no idea"
          into a two-step lookup: bound → class → shortlist.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`n ≤ 1e5
  → budget allows O(n log n)          (Constraint Decoder)
  → residents: sort, heap, BIT,       (Complexity Budget)
               divide & conquer
  → keyword "kth largest"             (Pattern Sniffer)
  → pick: heap of size k  →  O(n log k)`}
        />
        <Callout kind="tip" title="Why log n ≈ constant in practice">
          For any n you'll ever see, log₂(n) ≤ 60. That's why O(n log n) and O(n) sit so close together, and
          why an extra log factor rarely breaks a solution that's otherwise linear.
        </Callout>
        <Callout kind="note" title="Constants and memory still matter">
          Big-O hides constant factors. An O(n) solution that allocates three arrays and chases pointers can
          lose to a cache-friendly O(n log n) in the real world — but in interviews, the asymptotic class is
          almost always what's being graded.
        </Callout>
      </Block>
    </>
  );
}

/* ── Tricks Vault ─────────────────────────────────────────────── */
function Tricks() {
  return (
    <>
      <Lede>
        A small set of reusable tricks shows up across a huge fraction of problems. Each one has a{" "}
        <em>tell</em> — the phrase or structure that should make you reach for it — and a one-line mechanism.
        Filter by category and drill the tell until it's reflexive.
      </Lede>

      <Try><TricksVaultViz /></Try>

      <Block eyebrow="how to use this" title="Memorize the tell, not just the trick">
        <p className="text-ink-dim leading-relaxed mb-2">
          Knowing <em>what</em> a prefix sum is buys you nothing under interview pressure. Knowing that{" "}
          <strong>"many range-sum queries"</strong> ⇒ prefix sums, and{" "}
          <strong>"many range updates"</strong> ⇒ a difference array, is what actually fires. The vault is
          organized around the trigger, not the definition.
        </p>
        <CodeBlock
          title="python"
          code={`# Prefix sums: O(1) range-sum after O(n) precompute
pre = [0]
for x in nums:
    pre.append(pre[-1] + x)          # pre[i] = sum of first i
range_sum = pre[r + 1] - pre[l]      # sum of nums[l..r], O(1)

# Difference array: O(1) range-UPDATE, read once at the end
diff = [0] * (n + 1)
diff[l] += val                       # add val to [l, r]
diff[r + 1] -= val
# prefix-sum diff once -> the final array`}
        />
        <Callout kind="tip" title="The two most common interview saves">
          A <strong>hash map</strong> to drop an O(n²) scan to O(n), and a <strong>sentinel / dummy node</strong>{" "}
          to erase head-edge cases in linked lists. If you reach for nothing else, reach for these.
        </Callout>
      </Block>
    </>
  );
}

/* ── Disambiguation ───────────────────────────────────────────── */
function Disambig() {
  return (
    <>
      <Lede>
        The hardest calls aren't "do I know this technique" — they're "which of these two do I use here."
        Each fork below collapses to a single deciding question. Memorize the question, not a table of cases.
      </Lede>

      <Try><DisambiguationViz /></Try>

      <Block eyebrow="the meta-skill" title="Every fork has one pivot question">
        <p className="text-ink-dim leading-relaxed mb-2">
          You don't need to recall five differences between BFS and DFS. You need the one that decides:{" "}
          <strong>do I need the shortest path?</strong> If yes, BFS; if I only need reachability or a deep
          search, DFS. Reducing each choice to its pivot is what lets you decide in seconds instead of
          second-guessing.
        </p>
        <Callout kind="tip" title="When unsure, default safe">
          Greedy vs DP? Write the DP — it's never <em>wrong</em>, only sometimes overkill, and you can prove
          the greedy shortcut afterward. Recursion vs iteration with depth near n? Default to an explicit
          stack to dodge Python's recursion limit.
        </Callout>
        <Callout kind="note" title="These compound with the rest of the lab">
          The decision often comes straight from the constraints and keywords you already decoded:{" "}
          "unweighted shortest path" ⇒ BFS; "keys are 0..n" ⇒ array index over hash map. Recognition feeds
          disambiguation.
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  constraints: <Constraints />,
  patterns: <Patterns />,
  budget: <Budget />,
  tricks: <Tricks />,
  disambig: <Disambig />,
};

export default function Identifier() {
  const [active, setActive] = useState("constraints");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Recognition · WHICH & WHEN"
      title="The Identifier"
      subtitle="Reading a problem and naming the approach is its own skill — decode the constraints, sniff the pattern, recall the trick."
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
