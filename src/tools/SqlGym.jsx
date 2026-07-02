import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import RevealSteps from "./sqlgym/RevealSteps.jsx";

const ACCENT = "#f7c948";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "screen", label: "How the SQL screen works", group: "Warm-up" },
  { id: "dedup", label: "1 · Latest row per key", group: "Core reps" },
  { id: "topn", label: "2 · Top-N per group", group: "Core reps" },
  { id: "runningtotal", label: "3 · Running totals & frames", group: "Core reps" },
  { id: "lagdeltas", label: "4 · Month-over-month deltas", group: "Core reps" },
  { id: "gapsislands", label: "5 · Gaps & islands", group: "Core reps" },
  { id: "sessionization", label: "6 · Sessionize a clickstream", group: "Core reps" },
  { id: "pivot", label: "7 · Pivot & conditional aggregates", group: "Advanced reps" },
  { id: "selfjoin", label: "8 · Self-joins & pairs", group: "Advanced reps" },
  { id: "datespine", label: "9 · Date spine & missing days", group: "Advanced reps" },
  { id: "recursive", label: "10 · Recursive CTE hierarchy", group: "Advanced reps" },
  { id: "scd2build", label: "11 · Build SCD2 from snapshots", group: "Advanced reps" },
  { id: "funnel", label: "12 · Funnel conversion", group: "Advanced reps" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* Compact mono table for schemas, sample rows, and expected outputs. */
function DataTable({ cols, rows }) {
  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr className="text-left">
            {cols.map((c, i) => (
              <th
                key={i}
                className="py-1.5 pr-4 font-normal text-ink-faint uppercase text-[10px] tracking-wider border-b border-line"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line">
              {r.map((cell, j) => (
                <td key={j} className="py-1.5 pr-4 text-ink-dim whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── How the SQL screen works ─────────────────────────────────── */
function Screen() {
  return (
    <>
      <Lede>
        The live SQL screen is 30-45 minutes of shared-editor coding: usually 2-4 problems that
        escalate from a filtered aggregate to windows and a scale follow-up. It is not a syntax
        quiz. The interviewer is watching how you clarify the data, structure your reasoning, and
        talk while you type, so the gym trains the mouth as much as the hands.
      </Lede>

      <Block eyebrow="the round's shape" title="What actually happens in the room">
        <p className="text-ink-dim leading-relaxed mb-2">
          You get a schema (often pasted, sometimes described verbally) and a business question.
          The first problem is a warm-up; each follow-up removes a crutch: add ties, add NULLs,
          add ordering in time, then finish with "now imagine this table has a billion rows."
          The single highest-leverage habit: <strong>state your approach in one sentence before
          you type anything</strong>. It converts the round from silent debugging into a guided
          conversation, and it lets the interviewer redirect you before you burn ten minutes.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          Before writing a single line, clarify three things out loud: can the table contain{" "}
          <strong>duplicates</strong> (one row per what, exactly?), which columns can be{" "}
          <strong>NULL</strong>, and how should <strong>ties</strong> break. Half the hidden edge
          cases in screen problems live in those three questions, and asking them is itself
          scored.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Structured narration: restate the problem, name the pattern ("this is latest-row-per-key,
          so ROW_NUMBER"), then build in named CTE steps. Silent typing followed by a correct
          answer scores worse than a spoken plan followed by a near-correct one.
        </Callout>
      </Block>

      <Block eyebrow="the grading rubric" title="What the scorecard actually says">
        <OpTable
          cols={["Signal", "Weight", "", "What it looks like in the round"]}
          rows={[
            { op: "Correctness + edges", avg: "highest", avgTone: "good", why: "The happy path AND the tie, the empty group, the first row. Interviewers seed the data with exactly these." },
            { op: "NULL handling", avg: "high", avgTone: "good", why: "You mention NULL behavior unprompted: NOT IN vs NOT EXISTS, COUNT(col), comparisons that go unknown." },
            { op: "Window fluency", avg: "high", avgTone: "good", why: "PARTITION BY / ORDER BY / frame come out fluently; you can say why ROW_NUMBER vs DENSE_RANK." },
            { op: "Readable CTEs", avg: "medium", avgTone: "ok", why: "Named steps that read top to bottom, not one nested subquery pyramid. The interviewer must follow live." },
            { op: "Performance awareness", avg: "medium", avgTone: "ok", why: "You can answer 'what changes at a billion rows' with pruning, pre-aggregation, and shuffle/skew talk." },
          ]}
        />
      </Block>

      <Block eyebrow="memorize this" title="The NULL trap set">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every SQL screen hides at least one NULL trap. This is the complete set; know each cold
          because these five lines fail candidates more than any window function does:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`NULL = NULL            -> not TRUE (it is unknown), the row is filtered out
x NOT IN (subquery)    -> if the subquery returns even ONE NULL: zero rows, always
                          prefer NOT EXISTS, it is NULL-safe and anti-joins cleanly
COUNT(*)               -> counts rows;  COUNT(col) counts only non-NULL values
SUM/AVG/MIN/MAX(col)   -> silently skip NULLs (AVG divides by the non-NULL count)
GROUP BY col           -> all the NULLs land together in one single group`}
        />
        <Callout kind="trap" title="The NOT IN bomb is the classic screen killer">
          A correct-looking anti-join query that returns zero rows because one subquery value is
          NULL. If you say "I use NOT EXISTS because NOT IN returns nothing when the subquery
          contains a NULL" you have banked the strongest single sentence of the round.
        </Callout>
      </Block>

      <Block eyebrow="the method" title="The five-step script for every problem">
        <CodeBlock
          title="text"
          lang="text"
          code={`1. READ the prompt twice, restate it in one sentence back to them
2. CLARIFY out loud: duplicates? NULLs? ties? "one row per what?"
3. HAND-SIMULATE 3 rows of input -> the exact expected output rows
4. BUILD in CTE steps, naming each CTE for what it produces
5. TEST edges OUT LOUD: the tie, the NULL, the first row, the empty group`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Step 3 is the one people skip and the one that saves you. Hand-simulating three rows
          catches "wait, I need one row per user, not per event" before you have written a wrong
          GROUP BY, and it hands you test cases for step 5 for free. Every problem in this gym is
          built so you can practice exactly that loop.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Why a CTE chain instead of nested subqueries?</strong> Readability under time
            pressure: each step is named, testable on its own, and reads top to bottom. Modern
            optimizers inline CTEs, so it is style, not a performance tax; Postgres lets you force
            materialization with the MATERIALIZED keyword when you want it.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your query is correct but slow. What do you look at first?</strong> The plan:
            am I scanning far more rows than I return, is a window or sort forcing the whole table
            through one operation, and can I filter or pre-aggregate earlier so the expensive step
            sees fewer rows. Row reduction before the join or window beats any micro-rewrite.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What NULL bug would slip past your tests?</strong> A NOT IN subquery that picks
            up a single NULL and silently returns zero rows, or a value <span className="font-mono">&lt;&gt;</span>{" "}
            comparison that drops NULL-to-value changes. I test with a NULL seeded in every
            nullable column and reach for NOT EXISTS and IS DISTINCT FROM.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How does your answer change on Spark SQL over a data lake?</strong> Same query
            text, different physics: I care about partition pruning on the date column, the shuffle
            caused by PARTITION BY, skew on hot keys, and I never ORDER BY the whole table, that
            collapses parallelism into a single sort.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "My method on a SQL screen is fixed: restate the problem in one sentence, clarify
          duplicates, NULLs, and ties, hand-simulate three rows to pin the expected output, then
          build in named CTE steps and test the edges out loud. I say the approach before I type,
          so the interviewer can steer me early."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I treat the round as a conversation, not a typing test. First I restate the ask, 'one
          row per user with their latest plan', because most wrong answers are wrong at the grain,
          not the syntax. Then three clarifying questions: can there be duplicates, which columns
          are nullable, and how do ties break. Those three questions are where interviewers hide
          the edge cases. I hand-simulate a few rows so I know the exact output shape, then build
          the query as a CTE pipeline where each CTE is named for what it produces, deduped,
          ranked, flagged, so my reasoning is visible. I narrate NULL behavior unprompted, NOT
          EXISTS over NOT IN, COUNT(col) versus COUNT(*), because that is the classic trap set.
          And when the scale follow-up comes, I switch registers: partition pruning, pre-aggregate
          before the window, watch skew on the partition key, and never sort the whole table just
          to rank within groups."
        </Callout>
      </Block>
    </>
  );
}

/* ── 1 · Latest row per key ───────────────────────────────────── */
function Dedup() {
  return (
    <>
      <Lede>
        "Here is a table of profile updates, users change their email over time and every change
        is a new row. Give me each user's current email, one row per user." The bread-and-butter
        opener: latest row per key, with a same-day tie hidden in the data.
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE profile_updates (
  update_id   INT,          -- unique, monotonically increasing
  user_id     INT,
  email       VARCHAR(50),
  updated_at  DATE
);`}
        />
        <DataTable
          cols={["update_id", "user_id", "email", "updated_at"]}
          rows={[
            ["1", "101", "ana@old.com", "2024-01-05"],
            ["2", "102", "bo@only.com", "2024-01-20"],
            ["3", "101", "ana@mid.com", "2024-02-11"],
            ["4", "103", "cy@old.com", "2024-02-01"],
            ["5", "101", "ana@new.com", "2024-03-10"],
            ["6", "103", "cy@new.com", "2024-04-02"],
            ["7", "104", "di@a.com", "2024-03-15"],
            ["8", "104", "di@b.com", "2024-03-15"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          Note user 104: two updates on the <em>same day</em>. Ask about ties out loud; here the
          rule is "higher update_id wins", which becomes your tiebreaker column.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <DataTable
          cols={["user_id", "email", "updated_at"]}
          rows={[
            ["101", "ana@new.com", "2024-03-10"],
            ["102", "bo@only.com", "2024-01-20"],
            ["103", "cy@new.com", "2024-04-02"],
            ["104", "di@b.com", "2024-03-15"],
          ]}
        />
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  "One row per user, the newest" is the signature of a ranking window: number the
                  rows within each user, newest first, and keep rank 1. What breaks the tie for
                  user 104?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  ROW_NUMBER() partitioned by user_id, ordered by updated_at DESC with update_id
                  DESC as a deterministic tiebreaker. Wrap it in a CTE and filter rn = 1 outside,
                  because you cannot put a window function in WHERE.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <>
                  <CodeBlock
                    title="sql"
                    lang="text"
                    code={`WITH ranked AS (
  SELECT
    user_id, email, updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY updated_at DESC, update_id DESC
    ) AS rn
  FROM profile_updates
)
SELECT user_id, email, updated_at
FROM ranked
WHERE rn = 1
ORDER BY user_id;`}
                  />
                  <CodeBlock
                    title="sql · Snowflake / BigQuery / DuckDB"
                    lang="text"
                    code={`SELECT user_id, email, updated_at
FROM profile_updates
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY user_id
  ORDER BY updated_at DESC, update_id DESC
) = 1
ORDER BY user_id;`}
                  />
                </>
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  ROW_NUMBER assigns exactly one 1 per partition, and the two-column ORDER BY makes
                  the tie deterministic (user 104 resolves to update_id 8, di@b.com). The classic
                  wrong answer is GROUP BY user_id with MAX(updated_at), then a join back on
                  (user_id, updated_at): on the same-day tie it returns <em>both</em> rows for user
                  104, and selecting email next to MAX(updated_at) without the join is invalid SQL
                  anyway. QUALIFY is the same plan with less ceremony, but it is dialect sugar, say
                  the portable CTE form first.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  The window forces a shuffle by user_id, so a hot key (one user with millions of
                  rows) skews a partition. Cheaper paths: prune first (if "current" only needs the
                  last 90 days of a date-partitioned table, read only those partitions), or
                  pre-aggregate the latest (updated_at, update_id) per user and join back, which pushes a
                  partial aggregate before the shuffle. In Spark, max_by(email, update_id) per user
                  does it in one aggregation with no window at all.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        That you ask about ties before writing, choose ROW_NUMBER over the GROUP-BY-and-join-back
        hack, and can name QUALIFY as the modern shortcut while knowing it is not portable.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "This is latest-row-per-key: ROW_NUMBER partitioned by user, ordered newest first with
        update_id as the tiebreaker, keep rank 1."
      </Callout>
    </>
  );
}

/* ── 2 · Top-N per group ──────────────────────────────────────── */
function TopN() {
  return (
    <>
      <Lede>
        "Here are product revenues by category. Give me the top two products per category by
        revenue, and if products tie, keep them all." The follow-up to problem 1: same window
        shape, but now the ranking function choice IS the answer.
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE product_sales (
  category  VARCHAR(20),
  product   VARCHAR(20),
  revenue   INT
);`}
        />
        <DataTable
          cols={["category", "product", "revenue"]}
          rows={[
            ["electronics", "laptop", "900"],
            ["electronics", "monitor", "900"],
            ["electronics", "phone", "700"],
            ["electronics", "cable", "100"],
            ["grocery", "coffee", "300"],
            ["grocery", "tea", "200"],
            ["grocery", "rice", "150"],
            ["toys", "blocks", "120"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          The trap is planted at the top: laptop and monitor tie at 900 in electronics. And toys
          has only one product, groups smaller than N must still work.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <DataTable
          cols={["category", "product", "revenue", "rnk"]}
          rows={[
            ["electronics", "laptop", "900", "1"],
            ["electronics", "monitor", "900", "1"],
            ["electronics", "phone", "700", "2"],
            ["grocery", "coffee", "300", "1"],
            ["grocery", "tea", "200", "2"],
            ["toys", "blocks", "120", "1"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          Electronics returns three rows: both 900s at rank 1 and phone at rank 2. That is the
          "keep ties" semantics the prompt asked for.
        </p>
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  Rank within each category, keep rank at most 2. But three functions can rank:
                  ROW_NUMBER, RANK, DENSE_RANK. Only one gives "top two revenue levels, ties kept".
                  Which, and what would the other two return for electronics?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  DENSE_RANK() partitioned by category ordered by revenue DESC, filter rnk at most
                  2 in an outer query. DENSE_RANK gives ties the same rank with no gap after, so
                  "rank 2" still means "second revenue level" even after a tie at 1.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <CodeBlock
                  title="sql"
                  lang="text"
                  code={`WITH ranked AS (
  SELECT
    category, product, revenue,
    DENSE_RANK() OVER (
      PARTITION BY category
      ORDER BY revenue DESC
    ) AS rnk
  FROM product_sales
)
SELECT category, product, revenue, rnk
FROM ranked
WHERE rnk <= 2
ORDER BY category, revenue DESC, product;`}
                />
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  Tie semantics decide everything. On electronics (900, 900, 700, 100): ROW_NUMBER
                  gives 1, 2, 3, 4, so it arbitrarily drops one of the tied 900s AND drops phone.
                  RANK gives 1, 1, 3, so "rnk &lt;= 2" keeps only the two 900s, phone is rank 3.
                  DENSE_RANK gives 1, 1, 2, exactly "top two revenue levels with ties kept". The
                  classic wrong answer is reaching for ROW_NUMBER by reflex; the senior move is
                  asking "how do you want ties handled?" and letting the answer pick the function.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  Same shuffle-by-category story as problem 1, but with few categories the
                  partitions are huge: a handful of category keys means a handful of reducers doing
                  all the work. Fixes: pre-aggregate to (category, product) totals first so the
                  window ranks thousands of rows instead of billions, or compute a per-file/partial
                  top-N and re-rank the survivors. Never ORDER BY revenue over the whole table to
                  take the top rows, that serializes into one global sort.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        Whether you ask about tie semantics unprompted and can state the ROW_NUMBER / RANK /
        DENSE_RANK difference on concrete numbers, 1-2-3-4 vs 1-1-3 vs 1-1-2, without hesitation.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "Top-N per group with ties kept, so DENSE_RANK partitioned by category ordered by revenue
        descending, filter rank at most 2 in an outer select."
      </Callout>
    </>
  );
}

/* ── 3 · Running totals & frames ──────────────────────────────── */
function RunningTotal() {
  return (
    <>
      <Lede>
        "Here is an order ledger. Add a running total of revenue in date order." Sounds like a
        one-liner, and that is the trap: two orders share a date, and the default window frame
        will quietly lump them together.
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE orders (
  order_id    INT,       -- unique
  order_date  DATE,
  amount      INT
);`}
        />
        <DataTable
          cols={["order_id", "order_date", "amount"]}
          rows={[
            ["1", "2024-05-01", "100"],
            ["2", "2024-05-02", "50"],
            ["3", "2024-05-02", "30"],
            ["4", "2024-05-03", "20"],
            ["5", "2024-05-05", "60"],
            ["6", "2024-05-05", "40"],
            ["7", "2024-05-06", "10"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          Orders 2 and 3 share 2024-05-02, and orders 5 and 6 share 2024-05-05. Duplicate ORDER BY
          keys are exactly where ROWS and RANGE diverge.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <p className="text-ink-dim leading-relaxed text-sm mb-1">
          Both columns shown so the trap is visible: run_rows is the correct per-row running
          total; run_range is what the default frame produces on the same data.
        </p>
        <DataTable
          cols={["order_id", "order_date", "amount", "run_rows", "run_range"]}
          rows={[
            ["1", "2024-05-01", "100", "100", "100"],
            ["2", "2024-05-02", "50", "150", "180"],
            ["3", "2024-05-02", "30", "180", "180"],
            ["4", "2024-05-03", "20", "200", "200"],
            ["5", "2024-05-05", "60", "260", "300"],
            ["6", "2024-05-05", "40", "300", "300"],
            ["7", "2024-05-06", "10", "310", "310"],
          ]}
        />
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  SUM(amount) OVER (ORDER BY ...) is the shape. But what frame does that default
                  to, and what does it do to the two rows that share 2024-05-02?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  A running SUM window ordered by date plus a unique tiebreaker, with an explicit
                  ROWS frame. The default frame when you write only ORDER BY is RANGE BETWEEN
                  UNBOUNDED PRECEDING AND CURRENT ROW, which treats peer rows (equal dates) as one
                  unit, so both peers get the same total.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <CodeBlock
                  title="sql"
                  lang="text"
                  code={`SELECT
  order_id,
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date, order_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS run_rows,
  SUM(amount) OVER (
    ORDER BY order_date       -- default frame = RANGE ... CURRENT ROW
  ) AS run_range
FROM orders
ORDER BY order_date, order_id;`}
                />
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  ROWS counts physical rows, so with the order_id tiebreaker each row gets its own
                  cumulative value: order 2 shows 150, order 3 shows 180. RANGE groups peers by the
                  ORDER BY value, so both 2024-05-02 rows show 180 (100+50+30) and both 2024-05-05
                  rows show 300. The classic wrong answer is writing SUM() OVER (ORDER BY
                  order_date) alone, believing it is row-by-row, it silently produces run_range.
                  Same machinery gives moving averages: ROWS BETWEEN 2 PRECEDING AND CURRENT ROW is
                  a 3-row window.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  A global running total has no PARTITION BY, so every row flows through one sorted
                  stream, a single-node bottleneck in any MPP engine or Spark. Fixes: partition the
                  cumulative sum by a natural key (per account, per store), or pre-aggregate to day
                  grain first and run the cumulative window over a few thousand daily rows instead
                  of a billion order rows. A whole-table ORDER BY is the enemy; aggregate first,
                  window late.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        The word "frame". Saying "the default is RANGE, which lumps equal keys, so I write ROWS
        explicitly with a unique tiebreaker" is the exact fluency signal this problem exists to
        test.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "Running SUM window ordered by date plus order_id, with an explicit ROWS frame, because
        the RANGE default would give tied dates the same total."
      </Callout>
    </>
  );
}

/* ── 4 · Month-over-month deltas ──────────────────────────────── */
function LagDeltas() {
  return (
    <>
      <Lede>
        "Monthly revenue, one row per month. Add the change versus the previous month, absolute
        and percent." A LAG one-two with two mines in the data: the first month has no previous
        row, and one month's revenue is exactly zero.
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE monthly_revenue (
  month    DATE,     -- first of month, one row per month
  revenue  INT
);`}
        />
        <DataTable
          cols={["month", "revenue"]}
          rows={[
            ["2024-01-01", "100"],
            ["2024-02-01", "120"],
            ["2024-03-01", "90"],
            ["2024-04-01", "0"],
            ["2024-05-01", "60"],
            ["2024-06-01", "60"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          April is a zero-revenue month, so May's percent change divides by zero unless you defuse
          it. June repeats May exactly, a 0.0% change, which is different from NULL.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <DataTable
          cols={["month", "revenue", "delta", "pct_change"]}
          rows={[
            ["2024-01-01", "100", "NULL", "NULL"],
            ["2024-02-01", "120", "20", "20.0"],
            ["2024-03-01", "90", "-30", "-25.0"],
            ["2024-04-01", "0", "-90", "-100.0"],
            ["2024-05-01", "60", "60", "NULL"],
            ["2024-06-01", "60", "0", "0.0"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          January is NULL by design (no prior month). May's delta is +60 but its percent change is
          NULL, you cannot express growth from a zero base.
        </p>
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  LAG(revenue) OVER (ORDER BY month) fetches last month onto this row. Two
                  questions before typing: what does LAG return on the first row, and what happens
                  when last month's revenue is 0 and you divide by it?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  One LAG window reused three times: delta is revenue minus LAG, percent change is
                  100.0 times delta over NULLIF(LAG, 0). NULLIF turns a zero denominator into NULL
                  so the division yields NULL instead of an error, and the first row's NULL LAG
                  propagates naturally.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <CodeBlock
                  title="sql"
                  lang="text"
                  code={`SELECT
  month,
  revenue,
  revenue - LAG(revenue) OVER (ORDER BY month) AS delta,
  ROUND(
    100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
          / NULLIF(LAG(revenue) OVER (ORDER BY month), 0),
    1
  ) AS pct_change
FROM monthly_revenue
ORDER BY month;`}
                />
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  LAG on the first row returns NULL (you can override with LAG(revenue, 1, 0), but
                  a fake 0 baseline would report January as infinite growth, so leaving NULL is
                  correct here). NULLIF(x, 0) returns NULL when x is 0, so May's divide-by-zero
                  becomes NULL cleanly. The classic wrong answers: multiplying by 100 (integer) instead
                  of 100.0 and getting integer-division truncation, and "fixing" the zero
                  denominator with COALESCE(LAG(...), 1), which invents numbers. Note 0.0 in June
                  versus NULL in May, they mean different things and the data proves the query
                  distinguishes them.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  Never LAG over raw events. Pre-aggregate to month grain first, a GROUP BY that
                  parallelizes perfectly and leaves you tens or hundreds of rows, then the
                  unpartitioned LAG over that tiny result is free. If it is per-customer
                  month-over-month, PARTITION BY customer_id so the shuffle spreads across keys;
                  the anti-pattern is a global ORDER BY month over billions of raw rows.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        Whether you name the first-row NULL and the divide-by-zero before running anything, and
        whether NULLIF comes out as the idiom rather than a CASE workaround.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "LAG ordered by month for the previous value; first row stays NULL, and I divide by
        NULLIF(previous, 0) so a zero month gives NULL percent instead of an error."
      </Callout>
    </>
  );
}

/* ── 5 · Gaps & islands ───────────────────────────────────────── */
function GapsIslands() {
  return (
    <>
      <Lede>
        "Here are daily login records. Find each user's longest streak of consecutive days." The
        classic gaps-and-islands problem, and the one where interviewers watch for the
        row-number-difference trick.
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE logins (
  user_id     INT,
  login_date  DATE      -- NOT unique: a user can log in twice in a day
);`}
        />
        <DataTable
          cols={["user_id", "login_date"]}
          rows={[
            ["1", "2024-03-01"],
            ["1", "2024-03-02"],
            ["1", "2024-03-02"],
            ["1", "2024-03-03"],
            ["1", "2024-03-06"],
            ["1", "2024-03-07"],
            ["2", "2024-03-02"],
            ["2", "2024-03-04"],
            ["2", "2024-03-05"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          User 1 logged in twice on 2024-03-02, the duplicate is planted to break naive row
          numbering. User 1 has streaks of 3 (Mar 1-3) and 2 (Mar 6-7); user 2 has streaks of 1
          and 2.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <DataTable
          cols={["user_id", "longest_streak"]}
          rows={[
            ["1", "3"],
            ["2", "2"],
          ]}
        />
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  Number each user's distinct dates 1, 2, 3... in date order. On consecutive days,
                  the date advances by one AND the row number advances by one, so what stays
                  constant inside a streak?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  Dedupe to one row per (user, date) first. Then login_date minus rn days is the
                  same value for every row of a consecutive run, that value is the island key.
                  GROUP BY user and island key to get streak lengths, then MAX per user.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <CodeBlock
                  title="sql"
                  lang="text"
                  code={`WITH dedup AS (
  SELECT DISTINCT user_id, login_date
  FROM logins
),
numbered AS (
  SELECT
    user_id, login_date,
    ROW_NUMBER() OVER (
      PARTITION BY user_id ORDER BY login_date
    ) AS rn
  FROM dedup
),
islands AS (
  SELECT
    user_id,
    login_date - rn * INTERVAL '1' DAY AS grp   -- constant per streak (Postgres/ANSI; MySQL: DATE_SUB)
  FROM numbered
),
streaks AS (
  SELECT user_id, grp, COUNT(*) AS streak_len
  FROM islands
  GROUP BY user_id, grp
)
SELECT user_id, MAX(streak_len) AS longest_streak
FROM streaks
GROUP BY user_id
ORDER BY user_id;`}
                />
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  Walk user 1: dates Mar 1, 2, 3 get rn 1, 2, 3, and date minus rn days is Feb 29
                  for all three, one island. Mar 6, 7 get rn 4, 5, and date minus rn is Mar 2 for
                  both, a second island. Counting rows per island gives 3 and 2. The classic wrong
                  answers: skipping the DISTINCT (the duplicate Mar 2 row shifts every later rn and
                  splinters the streak), and the LAG-based "gap flag" approach that flags breaks
                  but then still needs the running-sum step, which is fine, but people forget the
                  second half and try to count flags directly.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  Dedupe cheaply first: GROUP BY user_id, login_date is a partial-aggregate-friendly
                  shrink that can cut event-grain data by orders of magnitude before any window
                  runs. The window shuffles by user_id, fine when keys are many; watch bot accounts
                  with years of daily logins for skew. If the table is date-partitioned, a "streaks
                  in the last 90 days" question should prune to 90 partitions, say that out loud.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        The sentence "date minus row number is constant within an island". Interviewers also check
        you dedupe before numbering, the planted duplicate row exists to catch that.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "Gaps and islands: dedupe per user per day, then date minus ROW_NUMBER days is constant
        per streak, group on that and take the max count per user."
      </Callout>
    </>
  );
}

/* ── 6 · Sessionize a clickstream ─────────────────────────────── */
function Sessionization() {
  return (
    <>
      <Lede>
        "Raw click events, user and timestamp. Group them into sessions: a new session starts
        when a user is idle for more than 30 minutes. Give me each session's start, end, and event
        count." The two-window classic: flag the breaks, then running-sum the flags into ids.
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE events (
  user_id   INT,
  event_ts  TIMESTAMP
);
-- all sample rows fall on 2024-06-01`}
        />
        <DataTable
          cols={["user_id", "event_ts"]}
          rows={[
            ["1", "2024-06-01 10:00"],
            ["1", "2024-06-01 10:10"],
            ["1", "2024-06-01 10:35"],
            ["1", "2024-06-01 11:30"],
            ["1", "2024-06-01 11:40"],
            ["2", "2024-06-01 10:00"],
            ["2", "2024-06-01 10:30"],
            ["2", "2024-06-01 11:01"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          User 2's second event is exactly 30 minutes after the first, exactly-30 is NOT a break
          under "more than 30". The third is 31 minutes later, which is. Clarify the boundary out
          loud.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <DataTable
          cols={["user_id", "session_id", "session_start", "session_end", "events"]}
          rows={[
            ["1", "1", "2024-06-01 10:00", "2024-06-01 10:35", "3"],
            ["1", "2", "2024-06-01 11:30", "2024-06-01 11:40", "2"],
            ["2", "1", "2024-06-01 10:00", "2024-06-01 10:30", "2"],
            ["2", "2", "2024-06-01 11:01", "2024-06-01 11:01", "1"],
          ]}
        />
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  LAG gives you the previous event's timestamp per user. A gap over 30 minutes is a
                  session <em>boundary</em>, a 0/1 flag. How do you turn a sequence of boundary
                  flags into a session number every row can share?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  Two windows, both partitioned by user and ordered by time. First: flag new_session
                  = 1 when event_ts minus LAG(event_ts) exceeds 30 minutes, else 0 (the first event's
                  NULL comparison falls to 0). Second: a running SUM of the flags plus 1 is the
                  session id. Then plain GROUP BY user and session id.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <CodeBlock
                  title="sql"
                  lang="text"
                  code={`WITH flagged AS (
  SELECT
    user_id, event_ts,
    CASE
      WHEN event_ts - LAG(event_ts) OVER (
             PARTITION BY user_id ORDER BY event_ts
           ) > INTERVAL '30' MINUTE
      THEN 1 ELSE 0
    END AS new_session
  FROM events
),
numbered AS (
  SELECT
    user_id, event_ts,
    1 + SUM(new_session) OVER (
      PARTITION BY user_id
      ORDER BY event_ts
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS session_id
  FROM flagged
)
SELECT
  user_id,
  session_id,
  MIN(event_ts) AS session_start,
  MAX(event_ts) AS session_end,
  COUNT(*)      AS events
FROM numbered
GROUP BY user_id, session_id
ORDER BY user_id, session_id;`}
                />
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  The running sum only increments where a boundary flag is 1, so every event
                  between two boundaries shares a session_id, that is the whole trick. The first
                  event per user works for free: LAG is NULL, NULL &gt; interval is unknown, CASE
                  falls to ELSE 0, session 1. Note the exactly-30-minute edge: user 2's 10:30 event
                  is not flagged because the rule is strictly greater. The classic wrong answer is
                  trying to sessionize with a self-join on "events within 30 minutes", which
                  chains incorrectly and explodes quadratically; the flag-then-cumsum pattern is
                  linear and reads clean.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  Shuffle by user_id, and clickstreams are skew city: bots and logged-out sentinel
                  ids (user_id 0 or NULL) can hold half the events. Filter or salt hot keys, and
                  prune by date partition first. The real production wrinkle is incremental
                  sessionization: sessions straddle the daily batch boundary, so you must carry
                  open sessions from yesterday's run into today's (or run on event-time windows in
                  streaming). Saying "session windows in Spark Structured Streaming or Flink do
                  this natively" is a strong close.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        The two-pass shape stated up front, flag boundaries, running-sum into ids, plus the free
        handling of the first row's NULL. This problem is the purest test of window-function
        composition.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "Flag a new session where the LAG gap exceeds 30 minutes, running-SUM the flags per user
        to get session ids, then group by user and session id."
      </Callout>
    </>
  );
}

/* ── 7 · Pivot & conditional aggregates ───────────────────────── */
function Pivot() {
  return (
    <>
      <Lede>
        "Sales by region and quarter, long format. Give me one row per region with a column per
        quarter." The pivot rep: no PIVOT keyword needed, just conditional aggregation, and the
        edge case is regions with nothing in a quarter.
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE sales (
  region   VARCHAR(10),
  quarter  VARCHAR(2),    -- 'Q1'..'Q4'
  amount   INT
);`}
        />
        <DataTable
          cols={["region", "quarter", "amount"]}
          rows={[
            ["east", "Q1", "100"],
            ["east", "Q1", "50"],
            ["east", "Q2", "70"],
            ["west", "Q1", "80"],
            ["west", "Q3", "90"],
            ["west", "Q3", "10"],
            ["south", "Q4", "40"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          South sold only in Q4 and east never sold in Q3 or Q4, empty cells must come out as 0,
          not NULL, and not as missing rows.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <DataTable
          cols={["region", "q1", "q2", "q3", "q4"]}
          rows={[
            ["east", "150", "70", "0", "0"],
            ["south", "0", "0", "0", "40"],
            ["west", "80", "0", "100", "0"],
          ]}
        />
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  One GROUP BY region, four output columns. Each column is a SUM that only "sees"
                  the rows of its quarter. What construct makes an aggregate conditional per row?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  SUM(CASE WHEN quarter = 'Qn' THEN amount ELSE 0 END) once per target column,
                  grouped by region. The ELSE 0 makes empty cells 0; with ELSE omitted (NULL) the
                  SUM of an empty set is NULL instead.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <>
                  <CodeBlock
                    title="sql"
                    lang="text"
                    code={`SELECT
  region,
  SUM(CASE WHEN quarter = 'Q1' THEN amount ELSE 0 END) AS q1,
  SUM(CASE WHEN quarter = 'Q2' THEN amount ELSE 0 END) AS q2,
  SUM(CASE WHEN quarter = 'Q3' THEN amount ELSE 0 END) AS q3,
  SUM(CASE WHEN quarter = 'Q4' THEN amount ELSE 0 END) AS q4
FROM sales
GROUP BY region
ORDER BY region;`}
                  />
                  <CodeBlock
                    title="sql · Postgres / DuckDB FILTER clause"
                    lang="text"
                    code={`SELECT
  region,
  COALESCE(SUM(amount) FILTER (WHERE quarter = 'Q1'), 0) AS q1,
  COALESCE(SUM(amount) FILTER (WHERE quarter = 'Q2'), 0) AS q2,
  COALESCE(SUM(amount) FILTER (WHERE quarter = 'Q3'), 0) AS q3,
  COALESCE(SUM(amount) FILTER (WHERE quarter = 'Q4'), 0) AS q4
FROM sales
GROUP BY region
ORDER BY region;`}
                  />
                </>
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  Each CASE emits the amount only for its quarter and 0 otherwise, so one scan and
                  one GROUP BY produce all four columns, east's two Q1 rows sum to 150, and east Q3
                  is a sum of zeros, 0. With FILTER (the cleaner standard-SQL form Postgres and
                  DuckDB support), an empty group sums to NULL, hence the COALESCE. The classic
                  wrong answers: four separate subqueries joined together (four scans, and regions
                  missing a quarter drop out of inner joins), and reaching for a vendor PIVOT
                  keyword you half-remember, conditional aggregation works everywhere and the
                  interviewer knows it.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  Conditional aggregation is a single pass with partial aggregates, it scales as
                  well as any GROUP BY and beats multi-scan approaches by construction. The scale
                  trap is pivot <em>width</em>, not depth: pivoting to thousands of columns (one
                  per product) bloats the plan and breaks column limits. Keep storage in long
                  format, pivot as late as possible, ideally in the BI layer, and only for
                  human-width column counts.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        That "pivot" instantly translates to SUM(CASE WHEN) in your head, one scan, no joins, and
        that you can say what FILTER buys and why ELSE 0 versus NULL matters for the empty cells.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "Conditional aggregation: one GROUP BY region, and each quarter column is SUM(CASE WHEN
        quarter matches THEN amount ELSE 0 END)."
      </Callout>
    </>
  );
}

/* ── 8 · Self-joins & pairs ───────────────────────────────────── */
function SelfJoin() {
  return (
    <>
      <Lede>
        "One employees table with a manager_id pointing back into it. First: who earns more than
        their own manager? Then: find pairs of employees with the same salary, each pair once."
        Two reps on the same table: the row-to-row self-join, then the dedup-pairs idiom.
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE employees (
  emp_id      INT,
  name        VARCHAR(10),
  salary      INT,
  manager_id  INT       -- NULL for the CEO
);`}
        />
        <DataTable
          cols={["emp_id", "name", "salary", "manager_id"]}
          rows={[
            ["1", "Ava", "120", "NULL"],
            ["2", "Ben", "90", "1"],
            ["3", "Cal", "130", "1"],
            ["4", "Dee", "95", "2"],
            ["5", "Eli", "80", "2"],
            ["6", "Fay", "95", "3"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          Ava is the CEO with a NULL manager_id, she must drop out of query A without any special
          casing. Dee and Fay share salary 95, exactly one pair should come back in query B.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <p className="text-ink-dim leading-relaxed text-sm mb-1">Query A, earns more than manager:</p>
        <DataTable
          cols={["employee", "salary", "manager", "manager_salary"]}
          rows={[
            ["Cal", "130", "Ava", "120"],
            ["Dee", "95", "Ben", "90"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm mb-1">Query B, same-salary pairs, each once:</p>
        <DataTable
          cols={["emp_a", "emp_b", "salary"]}
          rows={[["Dee", "Fay", "95"]]}
        />
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  A self-join is just the same table under two aliases playing two roles: e for the
                  employee row, m for the manager row. For pairs: joining a table to itself on
                  salary gives you (Dee, Fay) AND (Fay, Dee) AND (Dee, Dee). What predicate kills
                  both problems at once?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  Query A: inner join employees e to employees m on m.emp_id = e.manager_id, filter
                  e.salary greater than m.salary; the CEO's NULL manager_id never matches, so she
                  drops out for free. Query B: self-join on equal salary with a.emp_id strictly
                  less than b.emp_id, which removes self-pairs and keeps exactly one ordering of
                  each pair.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <CodeBlock
                  title="sql"
                  lang="text"
                  code={`-- A: employees who out-earn their manager
SELECT
  e.name   AS employee,
  e.salary,
  m.name   AS manager,
  m.salary AS manager_salary
FROM employees e
JOIN employees m ON m.emp_id = e.manager_id
WHERE e.salary > m.salary
ORDER BY e.name;

-- B: same-salary pairs, each pair exactly once
SELECT
  a.name AS emp_a,
  b.name AS emp_b,
  a.salary
FROM employees a
JOIN employees b
  ON  a.salary = b.salary
  AND a.emp_id < b.emp_id
ORDER BY a.salary;`}
                />
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  In A, each employee row finds its manager row by key, and the WHERE compares the
                  two salaries on the joined row; NULL manager_id fails the inner join predicate,
                  which is the correct semantics, not an accident to apologize for, say so. In B,
                  a.emp_id &lt; b.emp_id is the canonical pair-dedup idiom: it eliminates (x, x)
                  self-pairs and keeps only the ordering where the smaller id is first. The classic
                  wrong answer is using &lt;&gt; instead of &lt;, which drops self-pairs but keeps
                  both (Dee, Fay) and (Fay, Dee), doubling every pair.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  The manager join is a key-to-key join on a dimension-sized table, in a warehouse
                  it broadcasts and is cheap. The pairs join is the dangerous one: joining on a
                  low-cardinality value like salary is a hidden cross-join, 10,000 rows sharing one
                  salary produce ~50 million pairs. At scale you pre-filter to salaries HAVING
                  COUNT(*) &gt; 1, cap group sizes, or rephrase the question as an aggregation
                  (COUNT per salary) instead of materializing pairs at all.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        Clean role-naming of the aliases ("e is the employee, m is their manager row") and the
        a.id &lt; b.id idiom produced instantly, plus noticing that equality joins on
        low-cardinality values can explode quadratically.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "Self-join under two aliases: employee row to manager row on manager_id, compare salaries;
        for the pairs I join on equal salary with a.emp_id &lt; b.emp_id so each pair appears
        once."
      </Callout>
    </>
  );
}

/* ── 9 · Date spine & missing days ────────────────────────────── */
function DateSpine() {
  return (
    <>
      <Lede>
        "Daily sales totals for the first week of July, including the days with no sales at all,
        those should show zero." The report-query rep: the days that do not exist in your fact
        table are exactly the ones the business wants to see, so you need a spine.
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE sales (
  sale_date  DATE,
  amount     INT
);

CREATE TABLE calendar (        -- the spine: one row per date, prebuilt
  cal_date   DATE              -- covers 2024-07-01 .. 2024-07-06 here
);`}
        />
        <DataTable
          cols={["sale_date", "amount"]}
          rows={[
            ["2024-07-01", "50"],
            ["2024-07-01", "30"],
            ["2024-07-02", "20"],
            ["2024-07-04", "10"],
            ["2024-07-06", "60"],
            ["2024-07-06", "40"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          No rows exist for 2024-07-03 or 2024-07-05. You cannot GROUP BY your way to a row that
          is not there, that is the whole problem.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <DataTable
          cols={["cal_date", "daily_total"]}
          rows={[
            ["2024-07-01", "80"],
            ["2024-07-02", "20"],
            ["2024-07-03", "0"],
            ["2024-07-04", "10"],
            ["2024-07-05", "0"],
            ["2024-07-06", "100"],
          ]}
        />
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  You need a driving table that already has every date, then attach sales to it.
                  Which join direction keeps the empty days, and what turns their NULL into 0?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  LEFT JOIN <em>from</em> the calendar spine to sales, group by the spine date, and
                  COALESCE the SUM to 0. The spine drives, so July 3 and 5 survive with no matching
                  sales rows; an inner join would silently delete them.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <>
                  <CodeBlock
                    title="sql"
                    lang="text"
                    code={`SELECT
  c.cal_date,
  COALESCE(SUM(s.amount), 0) AS daily_total
FROM calendar c
LEFT JOIN sales s ON s.sale_date = c.cal_date
WHERE c.cal_date BETWEEN DATE '2024-07-01' AND DATE '2024-07-06'
GROUP BY c.cal_date
ORDER BY c.cal_date;

-- zero-sale days only: append  HAVING SUM(s.amount) IS NULL`}
                  />
                  <CodeBlock
                    title="sql · Postgres generate_series"
                    lang="text"
                    code={`SELECT
  g.d::date AS cal_date,
  COALESCE(SUM(s.amount), 0) AS daily_total
FROM generate_series(
       DATE '2024-07-01', DATE '2024-07-06', INTERVAL '1 day'
     ) AS g(d)
LEFT JOIN sales s ON s.sale_date = g.d::date
GROUP BY 1
ORDER BY 1;`}
                  />
                </>
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  The spine guarantees a row per day, and LEFT JOIN preserves spine rows with no
                  match, their s.amount is NULL, SUM of all-NULL is NULL, COALESCE makes it 0. Two
                  classic wrong answers: the inner join (or grouping the sales table directly),
                  which cannot produce July 3 and 5 at all, and counting with COUNT(*), which
                  returns 1 for empty days because the spine row itself is counted, COUNT(s.amount)
                  or COUNT(s.sale_date) is the NULL-aware count. Also put the date filter on the
                  spine, not the sales side of a LEFT JOIN's WHERE, or you quietly turn it back
                  into an inner join.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  The spine is tiny (a few thousand rows for a decade), so it broadcasts to every
                  node for free. The win is pre-aggregating sales to day grain <em>before</em> the
                  join: GROUP BY sale_date first, then join a few hundred aggregate rows to the
                  spine, instead of LEFT JOINing raw billion-row facts. Every serious warehouse
                  keeps a persistent dim_date exactly so this pattern (and fiscal calendars,
                  holidays) is a lookup, not a generate_series per query.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        The instinct that missing rows require a driving spine plus LEFT JOIN, and the COUNT(*)
        versus COUNT(col) distinction on the empty days, that is a NULL-semantics check disguised
        as a reporting query.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "I need a date spine to drive: calendar LEFT JOIN sales on date, group by the spine date,
        COALESCE the sum to zero so empty days show 0."
      </Callout>
    </>
  );
}

/* ── 10 · Recursive CTE hierarchy ─────────────────────────────── */
function Recursive() {
  return (
    <>
      <Lede>
        "Here is an org chart, employees pointing at managers. Give me every employee with their
        depth in the tree and the path from the CEO down." Arbitrary-depth hierarchies cannot be
        done with a fixed number of joins, this is the recursive CTE rep.
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE org_chart (
  emp_id      INT,
  name        VARCHAR(10),
  manager_id  INT       -- NULL for the CEO
);`}
        />
        <DataTable
          cols={["emp_id", "name", "manager_id"]}
          rows={[
            ["1", "Ava", "NULL"],
            ["2", "Ben", "1"],
            ["3", "Cal", "1"],
            ["4", "Dee", "2"],
            ["5", "Eli", "2"],
            ["6", "Fay", "4"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          Four levels: Ava manages Ben and Cal; Ben manages Dee and Eli; Dee manages Fay. Depth
          must be computed, not hardcoded, next quarter the tree may be seven levels deep.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <DataTable
          cols={["emp_id", "name", "depth", "path"]}
          rows={[
            ["1", "Ava", "1", "Ava"],
            ["2", "Ben", "2", "Ava > Ben"],
            ["3", "Cal", "2", "Ava > Cal"],
            ["4", "Dee", "3", "Ava > Ben > Dee"],
            ["5", "Eli", "3", "Ava > Ben > Eli"],
            ["6", "Fay", "4", "Ava > Ben > Dee > Fay"],
          ]}
        />
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  A recursive CTE has three parts: an anchor query (where does the tree start?),
                  UNION ALL, and a recursive member that joins the base table to the CTE itself.
                  Who is the anchor here, and what makes the recursion stop?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  Anchor: the CEO (manager_id IS NULL) at depth 1 with path = her own name.
                  Recursive step: join org_chart to the CTE on e.manager_id = o.emp_id, adding 1 to
                  depth and appending the name to the path. Iterate until the join finds no new
                  reports.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <CodeBlock
                  title="sql"
                  lang="text"
                  code={`WITH RECURSIVE org AS (
  -- anchor: the root of the tree
  SELECT
    emp_id, name, manager_id,
    1 AS depth,
    name AS path
  FROM org_chart
  WHERE manager_id IS NULL

  UNION ALL

  -- recursive member: attach direct reports of the previous level
  SELECT
    e.emp_id, e.name, e.manager_id,
    o.depth + 1,
    o.path || ' > ' || e.name
  FROM org_chart e
  JOIN org o ON e.manager_id = o.emp_id
)
SELECT emp_id, name, depth, path
FROM org
ORDER BY depth, emp_id;`}
                />
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  Each iteration joins the base table against only the rows produced by the
                  previous iteration: level 1 yields Ava, level 2 yields Ben and Cal, and so on.
                  Termination is structural: when a level has no reports, the recursive member
                  returns zero rows and the engine stops. That reasoning only holds for a true
                  tree, a cycle (A manages B manages A) recurses forever, so in dirty data you add
                  a depth cap (WHERE o.depth &lt; 20) or a cycle check on the path. The classic
                  wrong answer is a fixed ladder of 3-4 self-joins, it silently truncates deeper
                  trees and the interviewer will just add a level. For a budget rollup, recurse
                  downward carrying the root of each subtree, then SUM by subtree root.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  Iterations serialize: each level is a join that cannot start until the previous
                  finishes, so runtime scales with tree depth. Org charts are shallow and tiny, so
                  this is a correctness rep, not a scale one, but say what changes elsewhere:
                  Spark SQL had no recursive CTE until Spark 4.0 (2025) added WITH RECURSIVE, so on
                  3.x you loop in code or reach for GraphFrames; and for truly deep or hot hierarchies
                  you precompute a closure table or materialized path column so reads stop recursing at all.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        Naming the three parts, anchor, UNION ALL, recursive member, and giving the termination
        argument unprompted, including what a cycle would do. That is the difference between
        recalling syntax and understanding the iteration model.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "Recursive CTE: anchor on the CEO at depth 1, then repeatedly join reports onto the
        previous level, incrementing depth and extending the path, it stops when a level has no
        reports."
      </Callout>
    </>
  );
}

/* ── 11 · Build SCD2 from snapshots ───────────────────────────── */
function Scd2Build() {
  return (
    <>
      <Lede>
        "We take a full daily snapshot of customer tiers. Collapse the snapshots into an SCD
        Type 2 dimension: one row per version, with effective_from, effective_to, and an
        is_current flag." The data-architect signature problem: it fuses windows with
        dimensional-modeling judgment.
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE snap (
  snap_date    DATE,
  customer_id  INT,
  tier         VARCHAR(10)
);
-- one row per customer per day (full snapshot)`}
        />
        <DataTable
          cols={["snap_date", "customer_id", "tier"]}
          rows={[
            ["2024-01-01", "1", "gold"],
            ["2024-01-02", "1", "gold"],
            ["2024-01-03", "1", "silver"],
            ["2024-01-04", "1", "silver"],
            ["2024-01-05", "1", "gold"],
            ["2024-01-01", "2", "bronze"],
            ["2024-01-02", "2", "bronze"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          Customer 1 goes gold, then silver, then <em>back to gold</em>. The return to a previous
          value is planted to kill the GROUP BY shortcut. Customer 2 never changes.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <p className="text-ink-dim leading-relaxed text-sm mb-1">
          Exclusive-end convention: effective_to equals the next version's effective_from, and the
          open current version ends at the 9999-12-31 sentinel.
        </p>
        <DataTable
          cols={["customer_id", "tier", "effective_from", "effective_to", "is_current"]}
          rows={[
            ["1", "gold", "2024-01-01", "2024-01-03", "0"],
            ["1", "silver", "2024-01-03", "2024-01-05", "0"],
            ["1", "gold", "2024-01-05", "9999-12-31", "1"],
            ["2", "bronze", "2024-01-01", "9999-12-31", "1"],
          ]}
        />
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  A version starts on any snapshot day where the tier differs from the previous
                  day's tier, plus the very first snapshot. LAG detects the starts; what fills in
                  each version's end date?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  Pass 1: LAG(tier) per customer by snap_date, keep rows where the previous tier is
                  NULL (first ever) or differs, those are version starts with effective_from =
                  snap_date. Pass 2: LEAD(effective_from) over the surviving rows gives each
                  version its end; COALESCE to 9999-12-31, and a NULL LEAD also marks is_current.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <CodeBlock
                  title="sql"
                  lang="text"
                  code={`WITH changes AS (
  SELECT
    customer_id, snap_date, tier,
    LAG(tier) OVER (
      PARTITION BY customer_id ORDER BY snap_date
    ) AS prev_tier
  FROM snap
),
version_starts AS (
  SELECT customer_id, snap_date AS effective_from, tier
  FROM changes
  WHERE prev_tier IS NULL          -- first ever snapshot
     OR tier <> prev_tier          -- value changed that day
)
SELECT
  customer_id,
  tier,
  effective_from,
  COALESCE(
    LEAD(effective_from) OVER (
      PARTITION BY customer_id ORDER BY effective_from
    ),
    DATE '9999-12-31'
  ) AS effective_to,
  CASE
    WHEN LEAD(effective_from) OVER (
           PARTITION BY customer_id ORDER BY effective_from
         ) IS NULL
    THEN 1 ELSE 0
  END AS is_current
FROM version_starts
ORDER BY customer_id, effective_from;`}
                />
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  LAG turns "compare each day to the day before" into a per-row predicate, so
                  no-change days (Jan 2, Jan 4) vanish and only version starts survive: Jan 1 gold,
                  Jan 3 silver, Jan 5 gold for customer 1. LEAD then stitches consecutive starts
                  into [from, to) ranges. The classic wrong answer is GROUP BY customer_id, tier
                  with MIN and MAX of snap_date, it merges the two separate gold eras into one
                  false row spanning Jan 1 to Jan 5. One refinement to volunteer: if tier can be
                  NULL, the &lt;&gt; comparison misses NULL-to-value transitions, use IS DISTINCT
                  FROM for NULL-safe change detection.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  Full-history rebuilds window over every (customer, day) pair, a huge shuffle by
                  customer_id, you do it once as a backfill, not nightly. The production pattern is
                  incremental: compare only today's snapshot against the dimension's current rows
                  and MERGE INTO (Delta/Iceberg): close the changed rows by setting effective_to
                  and is_current = 0, insert the new versions. Storing snapshots date-partitioned
                  makes "read yesterday + today" a two-partition scan instead of a table scan.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        Whether the gold-silver-gold sequence survives as two separate gold versions, that single
        detail separates window-based change detection from the broken GROUP BY shortcut, and
        whether you name the sentinel-date and is_current conventions like someone who has
        maintained a real dimension.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "LAG per customer to keep only days where the tier changed, those are version starts, then
        LEAD stitches each start to the next one for effective_to, with 9999-12-31 and is_current
        on the open row."
      </Callout>
    </>
  );
}

/* ── 12 · Funnel conversion ───────────────────────────────────── */
function Funnel() {
  return (
    <>
      <Lede>
        "Product events: signup, activate, purchase. Build the funnel, how many users completed
        each step in order, and the conversion rate between steps." The rep that tests
        conditional aggregation, NULL-aware counting, and the word "in order".
      </Lede>

      <Block eyebrow="the setup" title="Schema and sample rows">
        <CodeBlock
          title="sql"
          lang="text"
          code={`CREATE TABLE events (
  user_id     INT,
  event_type  VARCHAR(10),   -- 'signup' | 'activate' | 'purchase'
  event_ts    TIMESTAMP
);`}
        />
        <DataTable
          cols={["user_id", "event_type", "event_ts"]}
          rows={[
            ["1", "signup", "2024-01-01 09:00"],
            ["1", "activate", "2024-01-01 10:00"],
            ["1", "purchase", "2024-01-02 12:00"],
            ["2", "signup", "2024-01-01 09:00"],
            ["2", "activate", "2024-01-03 09:00"],
            ["3", "signup", "2024-01-02 08:00"],
            ["4", "activate", "2024-01-01 09:00"],
            ["4", "signup", "2024-01-01 11:00"],
            ["4", "purchase", "2024-01-01 12:00"],
          ]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          User 4 is the plant: they activated <em>before</em> signing up, so their activation (and
          therefore their purchase) must not count as funnel progress, order matters.
        </p>
      </Block>

      <Block eyebrow="your target" title="Expected output">
        <DataTable
          cols={["signed_up", "activated", "purchased", "signup_to_activate_pct", "activate_to_purchase_pct"]}
          rows={[["4", "2", "1", "50.0", "50.0"]]}
        />
        <p className="text-ink-dim leading-relaxed text-sm">
          Four signups (users 1-4); two in-order activations (users 1 and 2); one in-order
          purchase (user 1). Each step converts at 50.0% from the one before.
        </p>
      </Block>

      <Try label="work it, then reveal">
        <RevealSteps
          accent={ACCENT}
          steps={[
            {
              label: "hint",
              body: (
                <p>
                  Collapse to one row per user first: the earliest timestamp of each step, via
                  MIN(CASE WHEN ...). Then "in order" becomes simple timestamp comparisons between
                  those three columns. What do the comparisons return when a step is missing?
                </p>
              ),
            },
            {
              label: "approach",
              body: (
                <p>
                  Step 1: per user, MIN each step's timestamp with conditional aggregation. Step 2:
                  keep a step only if it happened after the previous valid step (activate after
                  signup; purchase after a valid activate). Step 3: COUNT the non-NULL step columns,
                  NULL comparisons drop missing or out-of-order steps automatically, and divide
                  counts for the rates.
                </p>
              ),
            },
            {
              label: "solution",
              body: (
                <CodeBlock
                  title="sql"
                  lang="text"
                  code={`WITH steps AS (
  SELECT
    user_id,
    MIN(CASE WHEN event_type = 'signup'   THEN event_ts END) AS signup_ts,
    MIN(CASE WHEN event_type = 'activate' THEN event_ts END) AS activate_ts,
    MIN(CASE WHEN event_type = 'purchase' THEN event_ts END) AS purchase_ts
  FROM events
  GROUP BY user_id
),
sequenced AS (
  SELECT
    user_id,
    signup_ts,
    CASE WHEN activate_ts > signup_ts
         THEN activate_ts END AS activate_ok,
    CASE WHEN purchase_ts > activate_ts
          AND activate_ts > signup_ts
         THEN purchase_ts END AS purchase_ok
  FROM steps
  WHERE signup_ts IS NOT NULL
)
SELECT
  COUNT(*)            AS signed_up,
  COUNT(activate_ok)  AS activated,
  COUNT(purchase_ok)  AS purchased,
  ROUND(100.0 * COUNT(activate_ok) / COUNT(*), 1)
    AS signup_to_activate_pct,
  ROUND(100.0 * COUNT(purchase_ok) / NULLIF(COUNT(activate_ok), 0), 1)
    AS activate_to_purchase_pct
FROM sequenced;`}
                />
              ),
            },
            {
              label: "why it works",
              body: (
                <p>
                  The MIN(CASE ...) trick pivots the event stream to one row per user with three
                  step timestamps (missing steps are NULL, since MIN over nothing is NULL). NULL
                  logic then does the sequencing for free: for user 4, activate_ts &gt; signup_ts
                  is false (09:00 is not after 11:00), so activate_ok is NULL and the purchase
                  check fails too; for user 3, NULL &gt; signup_ts is unknown, also dropped.
                  COUNT(col) skipping NULLs is what makes the final counts right, the classic
                  wrong answers are COUNT(*) on those columns, and counting each step
                  independently without the order check, which would credit user 4 with a full
                  funnel.
                </p>
              ),
            },
            {
              label: "at a billion rows",
              body: (
                <p>
                  The shape is already the scalable one: a single GROUP BY user_id shuffle, no
                  multi-way self-joins of the event stream per step (the naive three-table join
                  explodes on chatty users). Prune the event table by date partition and event_type
                  before aggregating, pre-filter to the three funnel events. For dashboards over
                  huge user counts, funnels move to approximate sketches (theta/HLL) or dedicated
                  window functions like BigQuery's, but the MIN-per-step aggregate stays the
                  canonical batch answer.
                </p>
              ),
            },
          ]}
        />
      </Try>

      <Callout kind="note" title="What the interviewer is listening for">
        Whether "in order" registers, the out-of-order user must not convert, and whether you can
        explain that NULL comparisons plus COUNT(col) are doing the sequencing work, not a pile of
        joins.
      </Callout>
      <Callout kind="tip" title="Say this before you type">
        "Pivot to one row per user with MIN timestamp per step, keep each step only if it is after
        the previous valid step, then COUNT the non-NULL columns and divide for the rates."
      </Callout>
    </>
  );
}

/* ── Rapid fire · self-test ───────────────────────────────────── */
const DECK = [
  {
    q: "RANK, DENSE_RANK, ROW_NUMBER: two rows tie for first. What does each assign to the row after the tie?",
    a: "ROW_NUMBER gives the ties 1 and 2 arbitrarily, next row 3. RANK gives both ties 1 and skips to 3. DENSE_RANK gives both ties 1 and the next row 2, no gap.",
    tag: "windows",
  },
  {
    q: "WHERE x NOT IN (SELECT y FROM t), and one y is NULL. What comes back?",
    a: "Zero rows, always. x compared to NULL is unknown, so the NOT IN predicate can never evaluate true. This is the classic screen killer.",
    tag: "null traps",
  },
  {
    q: "Why prefer NOT EXISTS over NOT IN?",
    a: "NOT EXISTS is NULL-safe and optimizes into an anti-join. NOT IN silently returns zero rows if the subquery yields even one NULL.",
    tag: "null traps",
  },
  {
    q: "WHERE vs HAVING, one breath.",
    a: "WHERE filters rows before grouping and cannot see aggregates. HAVING filters groups after aggregation. Push what you can into WHERE, it shrinks the data earlier.",
    tag: "fundamentals",
  },
  {
    q: "You wrote SUM(x) OVER (ORDER BY d) and two rows share the same d. What happens?",
    a: "The default frame is RANGE, which treats peer rows as one unit, so both rows get the same running total. Write ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW plus a unique tiebreaker in the ORDER BY.",
    tag: "windows",
  },
  {
    q: "COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col)?",
    a: "COUNT(*) counts rows. COUNT(col) counts rows where col is not NULL. COUNT(DISTINCT col) counts unique non-NULL values.",
    tag: "null traps",
  },
  {
    q: "What does LAG(x) return on the first row of a partition?",
    a: "NULL, unless you pass the default argument, LAG(x, 1, 0). Any arithmetic on that NULL is NULL too, so month-over-month deltas start blank by design.",
    tag: "windows",
  },
  {
    q: "Is QUALIFY portable SQL?",
    a: "No. It is Snowflake, BigQuery, DuckDB, and Teradata sugar for filtering on a window function. The portable form is a CTE with ROW_NUMBER, then WHERE rn = 1 outside.",
    tag: "dialects",
  },
  {
    q: "Name the parts of a recursive CTE and what stops it.",
    a: "Anchor member, UNION ALL, recursive member that references the CTE. It stops when the recursive step returns zero rows; a cycle never stops, so guard dirty data with a depth cap.",
    tag: "recursion",
  },
  {
    q: "Window function vs GROUP BY, one line.",
    a: "GROUP BY collapses rows to one per group; a window function computes the group value but keeps every row. Need detail rows plus a group number? Window.",
    tag: "windows",
  },
  {
    q: "Latest row per key, the pattern?",
    a: "ROW_NUMBER() OVER (PARTITION BY key ORDER BY ts DESC, id DESC), keep rn = 1. The GROUP BY MAX plus join-back version returns duplicate rows on timestamp ties.",
    tag: "patterns",
  },
  {
    q: "Gaps and islands, what is the trick?",
    a: "Date minus ROW_NUMBER() days is constant within a run of consecutive dates, so it becomes the island's group key. Dedupe to one row per day first or the numbering drifts.",
    tag: "patterns",
  },
  {
    q: "Sessionize a clickstream in two window passes?",
    a: "LAG the timestamp per user and flag gaps over 30 minutes as 1, then a running SUM of the flags is the session id. Group by user and session id for the aggregates.",
    tag: "patterns",
  },
  {
    q: "Pivot rows to columns without a PIVOT keyword?",
    a: "Conditional aggregation: SUM(CASE WHEN quarter = 'Q1' THEN amount ELSE 0 END) per output column, one scan. Postgres and DuckDB also have SUM(amount) FILTER (WHERE ...).",
    tag: "patterns",
  },
  {
    q: "Why does a date spine report need a LEFT JOIN and COALESCE?",
    a: "An inner join drops days with no rows, which are exactly the days the report exists to show. LEFT JOIN from the spine keeps them, and COALESCE(SUM(x), 0) turns the NULL into a zero.",
    tag: "patterns",
  },
  {
    q: "In SCD2, what marks the current version, and what is the NULL-safe change test?",
    a: "An open effective_to, NULL or a 9999-12-31 sentinel, plus an is_current flag. Detect changes with IS DISTINCT FROM; a plain not-equals comparison misses NULL-to-value transitions.",
    tag: "modeling",
  },
  {
    q: "Division might hit a zero denominator. The idiom?",
    a: "Divide by NULLIF(denominator, 0). NULLIF returns NULL when the two arguments are equal, so the division yields NULL instead of an error.",
    tag: "null traps",
  },
  {
    q: "Pairing a table with itself gives (A,B), (B,A), and (A,A). The fix?",
    a: "Join with a.id < b.id. Strictly less-than removes self-pairs and keeps exactly one ordering of each pair; using not-equals keeps both directions and doubles every pair.",
    tag: "patterns",
  },
];

function Quickfire() {
  return (
    <>
      <Lede>
        Eighteen cards covering the whole gym: NULL traps, window semantics, and the pattern
        one-liners from all twelve problems. The rep is spoken, not silent, read the question,
        answer out loud in one or two sentences as if the interviewer just fired it at you, then
        reveal and grade yourself honestly. Shuffle daily until the deck runs above 85%.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  screen: <Screen />,
  dedup: <Dedup />,
  topn: <TopN />,
  runningtotal: <RunningTotal />,
  lagdeltas: <LagDeltas />,
  gapsislands: <GapsIslands />,
  sessionization: <Sessionization />,
  pivot: <Pivot />,
  selfjoin: <SelfJoin />,
  datespine: <DateSpine />,
  recursive: <Recursive />,
  scd2build: <Scd2Build />,
  funnel: <Funnel />,
  quickfire: <Quickfire />,
};

export default function SqlGym() {
  const [active, setActive] = useState("screen");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Practice · the REPS"
      title="SQL Gym"
      subtitle="The live SQL screen, twelve worked problems with hints, solutions, and the at-scale follow-up. Say your approach out loud, then reveal."
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
