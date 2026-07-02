import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import FrameworkStepperViz from "./designroom/FrameworkStepperViz.jsx";

const ACCENT = "#ff6b6b";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "framework", label: "The repeatable framework", group: "The method" },
  { id: "whiteboard", label: "Whiteboard choreography", group: "The method" },
  { id: "caseclickstream", label: "Case: clickstream lakehouse", group: "The cases" },
  { id: "casecdc", label: "Case: CDC replication platform", group: "The cases" },
  { id: "casemetrics", label: "Case: metrics & reporting platform", group: "The cases" },
  { id: "casemigration", label: "Case: Hadoop to EMR migration", group: "The cases" },
];

/* ── The repeatable framework ─────────────────────────────────── */
const FRAMEWORK_STEPS = [
  {
    n: 1,
    name: "Requirements",
    min: 5,
    say: "Before I draw anything, I want to pin down who consumes this data, how fresh it has to be, and what the queries look like.",
    draw: "A requirements box in the top corner: consumers, use cases, freshness SLA, query patterns, compliance.",
    ask: "Who queries this, how fresh does it need to be, and is there PII or a retention rule in scope?",
    trap: "Naming a technology before a single requirement is on the board. The round is scored on requirements-to-decision traceability.",
  },
  {
    n: 2,
    name: "Scale math",
    min: 5,
    say: "Let me size this out loud so every later decision has a number behind it.",
    draw: "A margin column: events/day -> bytes/event -> GB/day -> TB/year, rounded aggressively.",
    ask: "Does 50 million events a day sound like the right order of magnitude to you?",
    trap: "Silent math, or fake precision. Round hard (86,400 seconds is 'about 100K'), and narrate every step.",
  },
  {
    n: 3,
    name: "Ingest",
    min: 5,
    say: "Now the front door: how events get from producers into the platform, and what happens at peak.",
    draw: "Producers on the far left, an ingest lane (stream or batch transfer), arrows labeled with volume and format.",
    ask: "Do we own the producers, or is this third-party data we pull on their schedule?",
    trap: "Reflexively reaching for Kafka when a daily file drop meets the SLA at a tenth of the cost.",
  },
  {
    n: 4,
    name: "Storage & layout",
    min: 8,
    say: "This is where most of the long-term cost and query performance gets decided, so I will spend real time here.",
    draw: "Bronze / silver / gold zones, the table format, and a partition key written on every table.",
    ask: "Want me to go deeper on the partitioning strategy, or on the table-format choice?",
    trap: "Saying 'Parquet on S3' with no partition or layout story. The layout IS the decision; the format is table stakes.",
  },
  {
    n: 5,
    name: "Processing",
    min: 8,
    say: "Here is how raw becomes trustworthy: each transform, the engine that runs it, and its cadence.",
    draw: "Jobs as boxes between the zones, each labeled with engine, trigger cadence, and what it dedupes or joins.",
    ask: "Is minutes-fresh acceptable for this leg, or does anything genuinely need seconds?",
    trap: "Hand-waving 'Spark handles it'. Name batch vs micro-batch, the dedupe key, the state, and the watermark.",
  },
  {
    n: 6,
    name: "Serving",
    min: 6,
    say: "The platform only matters at the point of consumption, so here is who reads what, through which engine.",
    draw: "One serving box per consumer type: BI, ad-hoc SQL, APIs, ML features, with latency and concurrency notes.",
    ask: "What latency and concurrency do the dashboards actually need, internal analysts or end users?",
    trap: "One serving layer for everything. Internal BI at 10 queries a minute and a user-facing API at 1,000 QPS are different systems.",
  },
  {
    n: 7,
    name: "Operate",
    min: 5,
    say: "Finally, what makes this run for two years instead of two weeks: quality gates, SLOs, monitoring, and cost.",
    draw: "A quality gate on the write path, an SLO panel with the freshness target, and a monthly cost sketch.",
    ask: "We have a few minutes left, anything you would like me to go deeper on?",
    trap: "Skipping operations because time ran out. Senior loops score day-2 thinking as heavily as the architecture.",
  },
];

function Framework() {
  return (
    <>
      <Lede>
        The 45-minute design round rewards a rehearsed <em>shape</em>, not improvisation. Seven steps with
        explicit time budgets, 5 + 5 + 5 + 8 + 8 + 6 + 5 = 42 minutes plus a 3-minute buffer, take you
        from a vague prompt to a labeled architecture with an operations story. The framework is the same
        every time; the requirements and the arithmetic are what make each run different.
      </Lede>

      <Block eyebrow="the seven steps" title="42 minutes of structure, 3 of buffer">
        <p className="text-ink-dim leading-relaxed mb-3">
          Each step has a spoken opener (SAY), a whiteboard action (DRAW), a checkpoint question (ASK),
          and the trap that sinks candidates at that step (TRAP). Storage and processing get the biggest
          budgets because that is where the real trade-offs live.
        </p>
        <div className="space-y-3">
          {FRAMEWORK_STEPS.map((s) => (
            <div key={s.n} className="rounded-lg border border-line bg-surface-2 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[12px] font-semibold text-ink">
                  {s.n}. {s.name}
                </span>
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ color: ACCENT, borderColor: ACCENT }}
                >
                  {s.min} min
                </span>
              </div>
              <div className="space-y-1.5 text-[13px] leading-relaxed">
                <p className="text-ink-dim">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>say</span>
                  {s.say}
                </p>
                <p className="text-ink-dim">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>draw</span>
                  {s.draw}
                </p>
                <p className="text-ink-dim">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>ask</span>
                  {s.ask}
                </p>
                <p className="text-ink-faint">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2 text-ink-faint">trap</span>
                  {s.trap}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Callout kind="note" title="What the interviewer is listening for">
          Structured decomposition and traceability: can every component on your board be traced back to a
          requirement or a number you computed out loud? Candidates who name technologies first and reasons
          second read as mid-level no matter how good the technologies are.
        </Callout>
      </Block>

      <Block eyebrow="step 2 deserves its own drill" title="Do the arithmetic out loud">
        <p className="text-ink-dim leading-relaxed mb-2">
          Scale math is five minutes that sets the tone for the other forty. The chain is always the same:
          events per day, times bytes per event, gives GB per day, times 365 gives TB per year, then a
          compression factor for the columnar copy. Round aggressively at every step, the point is order
          of magnitude, not precision.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`50M events/day  x  ~1 KB/event   =  ~50 GB/day raw
50 GB/day       x  365           =  ~18 TB/year raw
~18 TB/year     /  ~4x (Parquet) =  ~4-5 TB/year columnar

events/sec avg  =  50M / 86,400  =  ~580 events/s
peak (plan 10x) =  ~6,000 events/s  =  ~6 MB/s at 1 KB each`}
        />
        <Callout kind="tip" title="Say the rounding, too">
          "86,400 seconds in a day, call it 100K, so 50 million a day is about 500-600 events a second."
          Narrated rounding signals fluency; silent calculator-grade precision signals memorization.
        </Callout>
      </Block>

      <Block eyebrow="first 30 seconds" title="A weak opening vs a strong opening">
        <Callout kind="trap" title="The weak opening (tech-first)">
          "OK, so I'd use Kafka for ingest, then Spark to process it, land everything in S3 as Parquet,
          and maybe put Redshift or Athena on top for queries..." Nothing here is wrong, and that is the
          problem: with no requirements on the board, none of it is <em>justified</em>, and the interviewer
          has already mentally filed the round as mid-level.
        </Callout>
        <Callout kind="tip" title="The strong opening (requirements-first), say it verbatim">
          "Before touching technology, I want to nail down four things: who consumes this data and for what
          decisions, how fresh it has to be, what the query patterns look like, and whether there is PII or
          compliance in scope. Then I'll size it with some quick arithmetic, and only then pick components,
          so every choice traces back to a requirement or a number."
        </Callout>
      </Block>

      <Block eyebrow="walk it" title="The framework, step by step">
        <p className="text-ink-dim leading-relaxed mb-3">
          Step through the seven stages and watch the time budget fill. Rehearse the SAY line out loud at
          each step until the transitions are automatic.
        </p>
        <Try label="walk the framework">
          <FrameworkStepperViz />
        </Try>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>What if the interviewer gives you almost no requirements?</strong> Propose defaults out
            loud and label them as assumptions: "I'll assume 50 million events a day and a minutes-fresh
            SLA, correct me if that's off," then design against them. Stated assumptions score; silent ones
            get treated as errors.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You're 25 minutes in and only halfway through. What now?</strong> Say it explicitly and
            offer the menu: "I can go deep on storage and layout or sketch the remaining legs at one level,
            which is more useful?" Then compress the remaining steps to their headline decision each.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How does the framework change for a streaming-first problem?</strong> The steps hold but
            the budget shifts: ingest and processing grow to cover watermarks, state, and delivery semantics,
            storage shrinks, and the scale math moves from GB per day to events per second and MB per second.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Isn't a memorized framework robotic?</strong> It's scaffolding, not a script. The
            requirements dialogue and the arithmetic are different every time, and I move the time budget to
            wherever the problem's actual risk lives; the framework just guarantees nothing gets skipped.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I run a seven-step loop with time budgets: requirements, scale math, ingest, storage and layout,
          processing, serving, and operations, roughly 5-5-5-8-8-6-5 with a small buffer. The first ten
          minutes are consumers, freshness, query patterns, and arithmetic done out loud, so every later
          component traces to a requirement or a number. Storage and processing get the biggest budgets
          because that's where the trade-offs are, and I always end on how the thing is operated."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "My design round has a fixed shape. Five minutes on requirements: who consumes this, for what
          decisions, how fresh, what query patterns, any compliance. Five on scale math, narrated: events
          per day to bytes to GB per day to TB per year, rounded hard, because those numbers pick my shard
          counts and partition keys later. Five on ingest: push or pull, stream or file drop, sized for
          peak not average. Then the two big budgets: eight minutes on storage and layout, zones, table
          format, and a partition key on every table, since that decides long-term cost and performance,
          and eight on processing, where I name the engine, the cadence, the dedupe key, and any state.
          Six minutes on serving, one box per consumer type because BI and user-facing APIs need different
          engines. Five on operations: quality gates on the write path, a freshness SLO, monitoring, and a
          cost sketch. That's 42 minutes with a 3-minute buffer, and I checkpoint with the interviewer at
          every boundary so the depth goes where they want it."
        </Callout>
      </Block>
    </>
  );
}

/* ── Whiteboard choreography ──────────────────────────────────── */
function Whiteboard() {
  return (
    <>
      <Lede>
        The board is half the interview. A candidate who draws a clean left-to-right skeleton in the first
        minutes, labels arrows with volumes, and checkpoints every ten minutes <em>looks</em> senior before
        a single technology is named. Choreography is learnable: skeleton first, hang decisions on it,
        never redraw.
      </Lede>

      <Block eyebrow="minute one" title="Draw the skeleton before you decide anything">
        <p className="text-ink-dim leading-relaxed mb-2">
          In the first minutes, put the generic dataflow spine on the board: sources on the left,
          consumers on the right, the platform in between. Every decision for the next forty minutes gets
          <em> hung on</em> this skeleton, you fill boxes in, you never restructure the drawing. That is
          what keeps the board legible under pressure.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`sources -> [ ingest ] -> [ storage / lake ] -> [ processing ] -> [ serving ] -> consumers

draw THIS in minute one, generic and empty.
then every decision fills in a box or labels an arrow:

apps ----> [ Kinesis   ] -> [ S3 bronze     ] -> [ Spark       ] -> [ Athena  ] -> analysts
 ~1 KB      8 shards        Iceberg, silver     micro-batch        + BI tool
 JSON       ~6 MB/s peak    part. event_date    1-min trigger      minutes-fresh`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether they can follow your design without you narrating chaos. A stable skeleton with labeled
          arrows shows systems thinking; a board that gets erased and redrawn twice reads as a candidate
          who designs by trial and error.
        </Callout>
      </Block>

      <Block eyebrow="label as you go" title="Volumes and formats live on the arrows">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every arrow gets a volume and a format the moment you draw it: "~50 GB/day, JSON," "~6 MB/s
          peak," "~5 TB/year, Parquet." This does two jobs: it gives your scale math a permanent home on
          the board, and it makes later decisions self-justifying, when you say "6 MB/s peak, so 6 to 8
          shards," the number is already sitting on the arrow you're pointing at.
        </p>
        <Callout kind="tip" title="The board is your evidence locker">
          When a follow-up lands twenty minutes later ("why Kinesis over SQS?"), you point at the arrow:
          "ordered replayable stream at 6 MB/s with multiple consumers." Labels turn every answer into a
          two-second gesture instead of a rebuild from memory.
        </Callout>
      </Block>

      <Block eyebrow="every ~10 minutes" title="The checkpoint">
        <p className="text-ink-dim leading-relaxed mb-2">
          Roughly every ten minutes, stop and hand the steering wheel over. The script:
          "Does this match what you had in mind so far? Would you rather I go deeper on the streaming leg
          or on the serving layer?" Checkpoints catch misalignment while it is still cheap, and they turn a
          monologue into the collaborative session the rubric actually rewards.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          Pair it with the <strong>depth-vs-breadth menu</strong>: name two or three areas where you can go
          deep and let the interviewer pick. "I can do partitioning strategy, the sessionization state, or
          cost, your call." Offering the menu shows you have depth in all of them; the interviewer picking
          one is them designing the loop for you.
        </p>
      </Block>

      <Block eyebrow="requirement changes mid-round" title="The curveball protocol">
        <p className="text-ink-dim leading-relaxed mb-2">
          Interviewers change a requirement on purpose ("now legal says we need GDPR deletes," "now the
          dashboards must be real-time") to watch how you absorb change. The protocol has three moves:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Acknowledge</strong>, out loud: "Good curveball, that changes the freshness requirement from minutes to seconds."</li>
          <li><strong>Localize the blast radius</strong>, point at the board: "That touches these two boxes, ingest buffering and the serving engine. Everything else survives."</li>
          <li><strong>Adjust one component</strong>, swap or modify the affected box. Never erase the diagram and never restart, the skeleton was designed to absorb exactly this.</li>
        </ul>
        <Callout kind="trap" title="The restart is the failure">
          Candidates who respond to a curveball by starting a new drawing signal that their design was a
          memorized artifact, not a reasoned structure. If the skeleton is right, no curveball should cost
          you more than one or two boxes.
        </Callout>
      </Block>

      <Block eyebrow="control the clock" title="Parking, and handling unknowns honestly">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Explicit parking</strong> keeps side quests from eating your budget: "I'll note compaction
          as an ops task and return to it if time allows," then literally write it in a parking-lot corner
          of the board. The interviewer sees the topic was recognized, not missed, and you keep the thread.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Unknowns</strong>: name the uncertainty and how you would validate it. "I don't remember
          Firehose's exact buffer ceiling off-hand; I'd check the quota page, and the design holds at
          either end of the plausible range." That is strictly stronger than bluffing a number, senior
          engineers are calibrated about what they don't know.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Calibration and control of the room: do you know what you don't know, and do you spend the 45
          minutes on what matters? Parking and honest unknowns are direct evidence of both.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>The interviewer keeps interrupting with questions. Are you derailed?</strong> No,
            interruptions are engagement. Answer on the diagram by pointing at the affected box, then
            restore the thread out loud: "good question, and picking the main thread back up at serving."
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You realize a component you drew ten minutes ago is wrong. Now what?</strong> Say it
            plainly, cross out the one box, and replace it: "actually, Firehose's buffering fights our
            freshness SLA, swapping this for a direct streaming write." Visible self-correction scores
            higher than quietly defending a bad choice.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How does this change on a virtual whiteboard?</strong> Same skeleton, simpler shapes:
            boxes and arrows only, typed labels, a numbered assumptions list in one corner, and more
            frequent checkpoints because you cannot read the room through a webcam.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What if the interviewer stays silent the whole round?</strong> Run the checkpoints
            anyway, on a timer if needed. A silent interviewer is still grading structure, and the
            checkpoints prove it exists; close explicitly with the operate step and a one-minute summary of
            the decisions and their reasons.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I draw the left-to-right dataflow skeleton in the first minute and hang every decision on it,
          labeling arrows with volumes and formats as I go. I checkpoint every ten minutes and offer a
          depth-versus-breadth menu. When a requirement changes, I acknowledge it, localize the blast
          radius to one or two boxes, and adjust just those, never restart the drawing. Side topics get
          parked explicitly, and unknowns get named with how I'd validate them."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "My board discipline: minute one, the generic spine, sources, ingest, storage, processing,
          serving, consumers, drawn empty. Then the round is just filling boxes and labeling arrows. Every
          arrow gets a volume and format, so when I later say 'six megabytes a second peak means six to
          eight shards,' the evidence is already on the board. Every ten minutes I checkpoint: 'does this
          match what you had in mind, and would you rather go deeper on the streaming leg or the serving
          layer?' That catches misalignment early and lets the interviewer steer the depth. Curveballs get
          a three-move protocol: acknowledge, point at the one or two boxes affected, adjust those and
          nothing else, the skeleton exists precisely so change is local. Anything that threatens the
          clock gets parked visibly, 'noting compaction as an ops task, back to it if time allows,' and
          anything I genuinely don't know gets named with a validation plan rather than a bluffed number.
          The result is a round that feels like a working session with a colleague, which is the actual
          rubric."
        </Callout>
      </Block>
    </>
  );
}

/* ── Case: clickstream lakehouse ──────────────────────────────── */
function CaseClickstream() {
  return (
    <>
      <Lede>
        The most common data-design prompt there is: "design product analytics for our consumer app."
        You win it with narrated arithmetic, one clean freshness call (micro-batch, minutes), and a
        sessionization story with a defensible watermark. Here is the full 45 minutes, every number shown.
      </Lede>

      <Block eyebrow="minutes 0-5" title="The requirements dialogue">
        <p className="text-ink-dim leading-relaxed mb-2">
          The questions to ask, and the answers this case assumes: consumers are PMs and analysts on
          dashboards plus ad-hoc SQL (self-serve). Freshness: <strong>minutes</strong>, not seconds, nobody
          is making sub-minute decisions on product analytics. Query patterns: time-windowed aggregates,
          funnels, and <strong>sessionization is required</strong>. Compliance: device and user IDs are
          pseudonymous PII, so GDPR deletion must be possible. Volume from the interviewer:{" "}
          <strong>50M events/day at roughly 1 KB each</strong>.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether your numbers drive the design: events per second should pick the shard count, GB per day
          should pick the partition key, and the sessionization requirement should surface state and
          watermark talk unprompted. Logos without arithmetic score as mid-level.
        </Callout>
      </Block>

      <Block eyebrow="minutes 5-10" title="Scale math, narrated">
        <CodeBlock
          title="text"
          lang="text"
          code={`50M events/day x ~1 KB        = ~50 GB/day raw
50 GB/day x 365               = ~18 TB/year raw (JSON in bronze)
~18 TB/year at ~4x (Parquet)  = ~4-5 TB/year columnar

average rate:  50M / 86,400s  = ~580 events/s
peak planning: 10x average    = ~6,000 events/s = ~6 MB/s at 1 KB`}
        />
        <p className="text-ink-dim leading-relaxed">
          Say the conclusion as you write it: "this is a <em>small-to-medium</em> platform, tens of GB a
          day, single-digit TB a year columnar. Nothing here needs exotic infrastructure; the design should
          optimize for simplicity and cost."
        </p>
      </Block>

      <Block eyebrow="minutes 10-15" title="Ingest: Kinesis, sized from the math">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Kinesis Data Streams</strong>: each shard ingests 1 MB/s or 1,000 records/s. Peak is
          ~6,000 events/s and ~6 MB/s, so both limits land on <strong>6 shards minimum; provision 6-8</strong>{" "}
          for headroom (or use on-demand mode and let it scale). Justification: an ordered, replayable
          buffer that decouples producers from the platform and absorbs the 10x peak.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>MSK instead</strong> when the org already runs Kafka, needs the connector ecosystem, or
          wants long log retention for Kappa-style replay. For a greenfield AWS-native team, Kinesis is
          less to operate. Say the trade, then pick one.
        </p>
        <OpTable
          cols={["Landing option", "Character", "", "Trade"]}
          rows={[
            { op: "Firehose -> S3 bronze", avg: "zero-code, buffered", avgTone: "good", why: "Buffers by size/time (e.g. 128 MB or 60-300 s) into large files. Adds minutes of latency, which our SLA tolerates." },
            { op: "Spark streaming writes bronze", avg: "one engine end to end", avgTone: "ok", why: "More control, exactly-once into Iceberg, but you now operate the landing job too. Pick when bronze itself must be a real table." },
          ]}
        />
        <Callout kind="tip" title="The call">
          Firehose lands bronze; Spark reads the stream directly for silver. Bronze stays a cheap immutable
          audit trail and replay source; the streaming job carries the actual logic.
        </Callout>
      </Block>

      <Block eyebrow="minutes 15-23" title="Silver: dedupe and sessionize with Structured Streaming">
        <p className="text-ink-dim leading-relaxed mb-2">
          Spark Structured Streaming in micro-batch mode, ~1-minute triggers, reading the stream. Two jobs
          of work: <strong>dedupe by event_id</strong> (SDKs retry, so at-least-once delivery is a
          guarantee of duplicates) and <strong>sessionize with a 30-minute inactivity gap</strong>.
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`sessions = (
    events
      .withWatermark("event_ts", "2 hours")          # late-event bound
      .dropDuplicatesWithinWatermark(["event_id"])    # SDK retries; state bounded by watermark
      .groupBy(F.session_window("event_ts", "30 minutes"), "user_id")
      .agg(F.count("*").alias("events"),
           F.min("event_ts").alias("session_start"),
           F.max("event_ts").alias("session_end"))
)`}
        />
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>watermark choice is the senior moment</strong>: 2 hours means events up to 2 hours
          late still join their session; anything later is dropped from streaming state and handled by the
          batch late-lane instead. The cost is state: open sessions and dedupe keys are held for the
          watermark window (dropDuplicatesWithinWatermark, added in Spark 3.5, is what lets the dedupe
          state expire instead of growing forever, since the dedupe key is event_id, not the event-time
          column), so state scales with active users in a ~2.5-hour horizon, at 50M events/day
          that is comfortably in the low GB, fine for a small cluster with RocksDB state store.
        </p>
        <Callout kind="trap" title="Watermark too long, state explodes; too short, sessions fragment">
          Say the trade explicitly: a 24-hour watermark holds a day of state for stragglers that mostly
          never come; a 10-minute watermark splits real sessions when a phone loses signal. 2 hours is a
          reasoned middle, and late events beyond it are reconciled in batch, not lost.
        </Callout>
      </Block>

      <Block eyebrow="minutes 23-31" title="Gold and table layout: Iceberg, partitioned by date">
        <p className="text-ink-dim leading-relaxed mb-2">
          Gold is hourly and daily aggregates plus star-ish marts: <code className="font-mono">fact_events</code>,{" "}
          <code className="font-mono">fact_sessions</code>, <code className="font-mono">dim_user</code>. All
          tables are <strong>Iceberg</strong>, partitioned by <code className="font-mono">event_date</code>{" "}
          (hidden partitioning on <code className="font-mono">days(event_ts)</code>), because every query
          pattern we collected is time-windowed. Mention <strong>bucketing by user_id</strong> on
          fact tables: it prunes user-level lookups and makes GDPR deletes cheaper by clustering each
          user's rows.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`apps/SDKs ---> [ Kinesis        ] ---> [ Firehose ] ---> [ S3 bronze        ]
 ~1 KB JSON     6-8 shards                buffered           raw JSON, immutable
 ~580/s avg     ~6 MB/s peak                                    |
                    |                                           | (replay/backfill path)
                    v                                           v
              [ Spark Structured Streaming ] ----------> [ Iceberg silver    ]
                1-min micro-batch                          events deduped,
                dedupe event_id                            sessions (30-min gap)
                watermark 2h                               part. by event_date
                                                                |
                                                                v
                                                         [ Iceberg gold      ]
                                                           hourly/daily aggs,
                                                           fact/dim marts
                                                                |
                                              +-----------------+----------------+
                                              v                                  v
                                        [ Athena + BI ]                  [ OLAP engine ]
                                        analysts, PMs                    only if user-facing`}
        />
      </Block>

      <Block eyebrow="minutes 31-37" title="Serving: Athena until someone proves otherwise">
        <p className="text-ink-dim leading-relaxed mb-2">
          Analysts and dashboards read gold through <strong>Athena</strong> plus the BI tool, minutes-fresh
          data, low concurrency, pay-per-query on single-digit TB. An always-on OLAP engine (ClickHouse,
          Druid, Pinot) enters only if the requirement becomes <em>user-facing</em> analytics, thousands of
          concurrent queries at sub-second latency. Say that boundary out loud; adding an OLAP store for
          internal dashboards is the classic over-build.
        </p>
      </Block>

      <Block eyebrow="minutes 37-42" title="Operate: late events, backfills, WAP, cost">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Late events policy</strong>: beyond the 2-hour watermark, events land in a late lane; a daily batch job folds them into silver and re-aggregates the affected hours. Loudly state: late data is <em>reconciled</em>, not dropped.</li>
          <li><strong>Backfill path</strong>: bronze is the replay source. The same transform code runs as a batch job over a bronze date range, writes to a staging branch, and swaps in. One codebase, two triggers.</li>
          <li><strong>WAP quality gate</strong>: gold publishes via write-audit-publish, stage the day's aggregates, audit (row counts vs silver, null checks, metric sanity bounds), then publish atomically. Dashboards never see a half-written day.</li>
          <li><strong>Cost sketch</strong>: 8 shards is roughly $90-100/month, ~5 TB in S3 about $115/month, a small always-on EMR streaming cluster (3-5 nodes) is the dominant line at maybe $500-800/month, Athena is per-query on small data. Order of $1-2K a month, and say that the streaming cluster is the lever.</li>
        </ul>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you handle bots and duplicate events at the edge?</strong> Cheap filters at
            ingest (known bot user agents, impossible client clocks), dedupe by event_id at silver, and bot
            <em> scoring</em> as a separate enrichment column rather than a hard drop, bronze keeps
            everything raw so bot rules can be re-run retroactively as they improve.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>GDPR delete requests?</strong> Row-level DELETE/MERGE on the Iceberg tables keyed by
            user_id, which the user_id bucketing makes targeted instead of full-scan; compaction rewrites
            the underlying files, and a scheduled job propagates deletes to derived marts within the legal
            SLA. Bronze either expires on a short retention or stores user IDs pseudonymized with a
            deletable key map.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The mobile SDK ships a new event schema, what breaks?</strong> Nothing, if events carry
            a schema version against a registry with additive-only compatibility: unknown new fields flow
            into a variant/JSON column in silver until promoted, and events that fail validation quarantine
            to a dead-letter table with alerting instead of poisoning the stream.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Now make it real-time.</strong> First push back: which decision needs seconds? If one
            truly does, shorten triggers toward seconds, skip the Firehose hop for that leg, and serve the
            hot aggregates from an OLAP store fed directly by the stream, while the lakehouse path stays as
            the correct, complete record. Real-time becomes an <em>additional hot path</em>, not a rebuild.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "50 million events a day at a kilobyte is 50 GB a day, about 580 events a second average, 6K at
          10x peak, so 6 to 8 Kinesis shards. Firehose lands immutable bronze; Spark Structured Streaming
          in one-minute micro-batches dedupes by event_id and sessionizes with a 30-minute gap under a
          2-hour watermark; gold is hourly and daily Iceberg marts partitioned by event_date, served
          through Athena and BI. Late events reconcile in batch, gold publishes through write-audit-publish,
          and the whole thing runs for one to two thousand a month."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Requirements first: PMs and analysts, minutes-fresh dashboards, time-windowed queries plus
          funnels, sessionization required, pseudonymous PII so deletes must work. The math: 50M a day at
          a kilobyte is 50 GB a day raw, about 18 TB a year, 4 to 5 TB columnar at Parquet compression;
          580 events a second average and I plan for 10x, so 6 MB a second peak, which sizes Kinesis at
          six to eight shards. Firehose buffers into an S3 bronze that stays immutable, the audit trail
          and replay source. Silver is Spark Structured Streaming, one-minute triggers: dropDuplicatesWithinWatermark on
          event_id, session_window with a 30-minute gap, and a 2-hour watermark, which I'd defend as the
          balance between state size and session fragmentation; later events go to a late lane that a
          daily job reconciles. Gold is hourly and daily aggregates in star-ish Iceberg marts, hidden
          partitioning on event_date since every query is time-windowed, bucketed by user_id for user
          lookups and GDPR deletes. Serving is Athena plus the BI tool; I'd only add an OLAP engine if
          this becomes user-facing. Operationally: write-audit-publish gates gold, backfills re-run the
          same transform code over bronze, and cost lands around one to two thousand a month dominated by
          the streaming cluster."
        </Callout>
      </Block>
    </>
  );
}

/* ── Case: CDC replication platform ───────────────────────────── */
function CaseCdc() {
  return (
    <>
      <Lede>
        "Mirror our 20 OLTP databases into the lakehouse, under 15 minutes of lag, and you may not touch
        the sources." This case is won or lost on one thing most candidates hand-wave: the initial
        snapshot to streaming handoff. Get that sequence right, out loud, and the round is yours.
      </Lede>

      <Block eyebrow="the constraints decide the approach" title="Log-based CDC, not polling">
        <p className="text-ink-dim leading-relaxed mb-2">
          "Zero source impact" eliminates query-based polling (SELECT-based diffs load the source and miss
          deletes). <strong>Log-based CDC</strong> tails the database's own write-ahead log (Postgres WAL,
          MySQL binlog), which the database writes anyway: near-zero overhead, captures every insert,
          update, and delete, in commit order, with an LSN (log sequence number) on each change.
        </p>
        <OpTable
          cols={["Capture option", "Character", "", "When"]}
          rows={[
            { op: "AWS DMS", avg: "managed, fast to start", avgTone: "ok", why: "Fine for a modest fleet on AWS with a small team. Weaker observability and schema-evolution story; per-task tuning gets fiddly at scale." },
            { op: "Debezium on MSK Connect", avg: "the platform play", avgTone: "good", why: "Standard change envelope (before/after/op/LSN), Kafka ecosystem, per-table topics, strong schema-registry integration. More to operate." },
          ]}
        />
        <Callout kind="tip" title="The call for 20 databases">
          At 20 databases with ongoing schema drift, this is a platform, not a task: Debezium on MSK
          Connect with a schema registry. Say when you'd choose DMS instead, a handful of sources, an
          AWS-native team, speed over control.
        </Callout>
        <Callout kind="note" title="What the interviewer is listening for">
          The snapshot-to-stream handoff and the delivery-semantics framing. Candidates who say "then CDC
          streams the changes" without explaining how the initial load and the stream stitch together
          without loss or duplication have not run one of these in production.
        </Callout>
      </Block>

      <Block eyebrow="ordering" title="Per-key ordering via partition-by-PK">
        <p className="text-ink-dim leading-relaxed mb-2">
          Correctness requires that changes to <em>the same row</em> apply in order. Kafka guarantees order
          within a partition, so each table gets its own topic, <strong>partitioned by primary key</strong>:
          every change to a given row lands in the same partition, in log order. Do not promise global or
          cross-table ordering, you don't have it, you don't need it, and claiming it is a red flag.
        </p>
      </Block>

      <Block eyebrow="the hard part" title="Initial snapshot, then streaming, stitched correctly">
        <p className="text-ink-dim leading-relaxed mb-2">
          A new table starts with a bulk snapshot, but the source keeps changing during the hours that
          takes. The sequence that makes it lossless:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`1. BOOKMARK the log position (LSN / binlog offset) BEFORE the snapshot starts
2. run the bulk snapshot load into the lake        (source keeps changing)
3. start streaming FROM THE BOOKMARK               (replays everything since step 1)
4. the overlap window (changes during the snapshot) arrives twice:
      once inside the snapshot, once from the stream
   -> dedupe by (PK, LSN): latest LSN wins, applied idempotently

wrong order (snapshot first, bookmark after) = changes during the
snapshot are LOST. This sequencing is the whole question.`}
        />
        <p className="text-ink-dim leading-relaxed">
          The overlap is not a bug, it is the design: replaying from a bookmark taken <em>before</em> the
          snapshot guarantees at-least-once coverage, and idempotent apply squeezes the duplicates out.
        </p>
      </Block>

      <Block eyebrow="the apply side" title="Spark foreachBatch MERGE into Iceberg">
        <p className="text-ink-dim leading-relaxed mb-2">
          A Structured Streaming job per table group reads the topics and applies each micro-batch with a
          MERGE. Two-step apply: first collapse the batch to the <strong>latest LSN per primary key</strong>{" "}
          (a batch can hold ten updates to one row; only the last matters), then merge.
        </p>
        <CodeBlock
          title="sql"
          lang="text"
          code={`-- inside foreachBatch: 'ranked' = batch collapsed to latest LSN per PK
MERGE INTO lake.orders t
USING ranked s
  ON t.order_id = s.order_id
WHEN MATCHED AND s.op = 'd'            THEN DELETE
WHEN MATCHED AND s.lsn > t.last_lsn    THEN UPDATE SET *
WHEN NOT MATCHED AND s.op != 'd'       THEN INSERT *

-- 's.lsn > t.last_lsn' makes replays harmless: an older or
-- already-applied change never overwrites a newer row state.`}
        />
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Deletes</strong>: the MERGE above applies hard deletes. Offer the soft-delete option,
          keep the row with <code className="font-mono">is_deleted = true</code> and{" "}
          <code className="font-mono">deleted_at</code>, when downstream consumers need history or when
          compliance wants tombstoned audit trails; a view filters them out for normal reads.
        </p>
      </Block>

      <Block eyebrow="semantics, said precisely" title="Effectively-once, not exactly-once">
        <p className="text-ink-dim leading-relaxed mb-2">
          Do not claim end-to-end exactly-once across a source database, Kafka, Spark, and Iceberg. The
          honest framing: <strong>at-least-once delivery plus idempotent apply equals effectively-once
          results</strong>. Checkpoints make the stream resumable (replays happen); the LSN-guarded MERGE
          makes replays harmless. That sentence, said unprompted, is a strong senior signal.
        </p>
      </Block>

      <Block eyebrow="drift and repair" title="Schema drift, and fixing one table without stopping 19 databases">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Schema drift</strong>: schema registry with a compatibility policy. Backward-compatible changes (new nullable column) auto-apply through Iceberg schema evolution. Breaking changes (type change, column drop) route that table's events to a <strong>quarantine lane</strong> and page the owning team; a human promotes the change deliberately.</li>
          <li><strong>Per-table backfill/repair</strong>: when one table is corrupted or was misconfigured, re-snapshot <em>that table</em> into a staging table alongside the still-running stream (same bookmark-then-snapshot dance), validate, then swap it in. The other 19 databases never notice. Fleet-wide stops for single-table repair is the anti-pattern to name.</li>
        </ul>
        <CodeBlock
          title="text"
          lang="text"
          code={`20 OLTP DBs        [ Debezium on MSK Connect ]        [ Spark Structured   ]
 Postgres/MySQL --> reads WAL / binlog        --MSK--> Streaming, per group
 (zero queries      per-table topics,          topics  foreachBatch:
  against source)   partitioned by PK                  collapse to latest LSN/PK
                        |                              MERGE into Iceberg
                        |                                   |
                  [ schema registry ]                       v
                    compat policy,                  [ Iceberg mirror tables ]
                    quarantine lane                   soft/hard deletes,
                                                      last_lsn column
                                                            |
                                                            v
                                                    lag monitor: max source
                                                    commit_ts applied, per table
                                                    alert 10 min, page 15 min`}
        />
      </Block>

      <Block eyebrow="the SLO" title="Lag: measured per table, alarmed before it breaches">
        <p className="text-ink-dim leading-relaxed mb-2">
          Lag = now minus the max source commit timestamp applied to the lake, <strong>per table</strong>.
          SLO under 15 minutes: alert at 10, page at 15. Also watch connector task health, MSK consumer
          lag by partition (a hot partition shows up here first), and MERGE duration trend, when the merge
          time approaches the trigger interval, the pipeline is about to fall behind. Publish the lag on a
          dashboard consumers can see; half the value of the SLO is downstream teams trusting the mirror.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>What are tombstones and how do you handle them?</strong> After a delete, Debezium emits
            the delete event and then a null-value tombstone so Kafka log compaction can drop the key.
            Apply the op = 'd' event, then filter the null-value tombstones out of the apply path, they are
            log hygiene, not data.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Large or TOAST columns in Postgres?</strong> Unchanged TOASTed values are not written
            to WAL on update, so the event carries a placeholder instead of the value. Either set REPLICA
            IDENTITY FULL (real write amplification at the source, may violate 'zero impact') or handle it
            in the MERGE: coalesce the placeholder to the existing column value in the lake.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>One hot table dominates the fleet, what breaks?</strong> Its partitions saturate and its
            MERGE time swamps the shared apply job, dragging every table's lag. Isolate it: dedicated
            topic with more partitions, its own connector task and its own Spark apply job, so the fleet
            SLO holds while the hot table gets tuned (or its consumers move to an append-log pattern).
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What about DDL events?</strong> Debezium emits schema-change events on a separate
            topic. Additive DDL flows through the registry and applies via Iceberg schema evolution;
            destructive DDL (drop, type change) pauses that table's apply, quarantines its events, and
            pages the table owner, automated for the safe cases, human-gated for the dangerous ones.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Zero source impact means log-based CDC: Debezium on MSK Connect tailing WAL and binlog, per-table
          topics partitioned by primary key for per-row ordering. The critical sequence is bookmark the LSN
          before the snapshot, bulk load, then stream from the bookmark, and dedupe the overlap by primary
          key plus LSN. Apply is Spark foreachBatch doing an LSN-guarded MERGE into Iceberg, so semantics
          are effectively-once: at-least-once delivery made harmless by idempotent apply. Lag is measured
          per table with an alert at 10 minutes against the 15-minute SLO."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The constraints do the choosing: zero source impact rules out polling, so we tail the write-ahead
          log. At 20 databases with schema drift this is a platform, so Debezium on MSK Connect with a
          schema registry over DMS, though I'd take DMS for a handful of sources with a small team. Each
          table gets a topic partitioned by primary key, which gives the only ordering that matters,
          per row. The hard part is bootstrap: bookmark the log position before the snapshot begins, run
          the bulk load, then replay the stream from the bookmark; changes made during the snapshot arrive
          twice, and that's by design, because the apply side is idempotent. Apply is Structured Streaming
          with foreachBatch: collapse each micro-batch to the latest LSN per key, then MERGE into Iceberg,
          update only when the incoming LSN is newer, delete on op = 'd' with a soft-delete variant when
          downstream needs history. I frame semantics as effectively-once, at-least-once delivery plus
          idempotent MERGE, rather than claiming exactly-once across four systems. Schema drift goes
          through the registry: additive changes auto-evolve the Iceberg schema, breaking changes quarantine
          that table and page its owner. Repairing one table means re-snapshotting it alongside the running
          stream and swapping it in, never stopping the fleet. And the SLO is per-table lag, now minus max
          applied commit timestamp, alerting at 10 minutes so the page at 15 never comes as a surprise."
        </Callout>
      </Block>
    </>
  );
}

/* ── Case: metrics & reporting platform ───────────────────────── */
function CaseMetrics() {
  return (
    <>
      <Lede>
        "Company KPIs, on the exec dashboard by 06:00 daily, finance-grade correctness, self-serve BI."
        The twist, and say it in the first five minutes: this round is won on <em>correctness process</em>,
        not exotic tech. The compute is small; the hard part is that the CFO has to trust every number.
      </Lede>

      <Block eyebrow="name the game" title="Small data, high stakes">
        <p className="text-ink-dim leading-relaxed mb-2">
          Scale math takes thirty seconds: daily extracts from a handful of business systems, GBs per
          night, not TBs. Announce the implication: "the interesting constraints here are the 06:00
          deadline and finance-grade correctness, so I'm going to spend my time on SLA machinery, quality
          gates, and change governance rather than on throughput." That sentence reframes the whole round
          in your favor.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Process maturity. Do you reach for reconciliation, atomic publication, and governed change, or do
          you decorate a trivially small pipeline with big-data machinery? Naming the twist early is the
          scoring moment.
        </Callout>
      </Block>

      <Block eyebrow="the pipeline" title="Nightly ELT into conformed marts and a semantic layer">
        <p className="text-ink-dim leading-relaxed mb-2">
          Nightly extracts (or CDC-lite incremental pulls) land in <strong>bronze</strong> untouched. The
          transform layer, <strong>dbt on the warehouse</strong> if the org is warehouse-centric, Spark on
          EMR if the lakehouse is the standard, builds <strong>conformed dimensions and facts</strong>{" "}
          (Kimball-style: one dim_customer every mart shares, facts at declared grains). On top, a{" "}
          <strong>semantic layer</strong> defines each metric once, revenue has exactly one definition,
          with owners, so every dashboard and every self-serve query inherits the same number.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`ERP / CRM / billing --nightly extracts--> [ bronze: raw, immutable ]
                                                    |
                                                    v
                                     [ transform: dbt or Spark ]
                                       staged in a WAP schema
                                                    |
                    audit: row counts vs source, revenue reconciles
                    to billing to the cent, null/uniqueness tests
                                                    |
                                          publish (atomic swap)
                                                    v
                                 [ conformed dims + facts (gold) ]
                                                    |
                                                    v
                                 [ semantic layer: metrics defined ONCE ]
                                                    |
                                        +-----------+-----------+
                                        v                       v
                                 exec dashboards           self-serve BI
                                 by 06:00                  same definitions`}
        />
      </Block>

      <Block eyebrow="the 06:00 machinery" title="SLA: scheduled, checked, and honest about failure">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Airflow with data_interval semantics</strong>: each run is pinned to its logical date, so reruns and backfills are unambiguous. The DAG's critical path is budgeted backward from 06:00 with slack.</li>
          <li><strong>Freshness checks at the front</strong>: sources must land by ~02:00; a missing extract alerts the source owner then, not at 05:55.</li>
          <li><strong>On failure, communicate</strong>: dashboards get a visible <strong>stale-data flag</strong> ("showing yesterday's close, refresh in progress") plus a stakeholder notice. Stale-and-labeled beats silently wrong, that is a core principle of finance-grade reporting.</li>
          <li><strong>Error budget</strong>: track SLA hits like an SRE, if 06:00 is missed more than the budget allows, reliability work preempts feature work.</li>
        </ul>
      </Block>

      <Block eyebrow="finance-grade" title="Quality gates: write, audit, publish">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every night builds into a <strong>staging schema</strong> first. The audit step is where
          finance-grade lives: row counts against source, uniqueness and null contracts on keys, and the
          decisive one, <strong>reconciliation</strong>: total revenue in the marts must match the billing
          system to the cent, or the run does not publish. Publication is <strong>atomic</strong>, a view
          flip or an Iceberg branch fast-forward, so consumers see the old complete state or the new
          complete state, never a torn read.
        </p>
        <Callout kind="trap" title="Tests that check shape but not truth">
          Null checks and schema tests catch breakage, not wrongness. The senior move is reconciliation
          against an independent source of truth (billing, the GL). If you only remember one audit, make
          it "revenue ties out to the cent."
        </Callout>
      </Block>

      <Block eyebrow="change without chaos" title="Governed change and restatements">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Contracts on source extracts</strong>: schema, semantics, and delivery time agreed with each source team; breaking a contract is the source team's page, not silent corruption downstream.</li>
          <li><strong>Metric changes ship like code</strong>: PR, tests, review by the metric's business owner (finance signs off on revenue), then deploy. No direct edits to definitions.</li>
          <li><strong>Restatement policy</strong>: when logic was wrong, rebuild the affected history as a <em>versioned</em> rebuild, announce the restatement with effect size, and keep the old version queryable (time travel / versioned marts) so every past report remains reproducible.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          <strong>Cost note</strong>: the compute bill is small, nightly batch over GBs. The expensive part
          is trust: reconciliation development, review cycles, and on-call. Budget accordingly and say so;
          it shows you know where the effort actually goes.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Two teams report different revenue numbers. Whose is right?</strong> Neither team gets
            to own the answer; the semantic layer does. One canonical definition with a named owner;
            legitimate variants get distinct names ("bookings" vs "recognized revenue") in the definition
            repo. The dispute is resolved in a PR against the definition, never in dueling dashboards.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You find a logic bug affecting three months of a KPI. Walk the backfill.</strong> Fix
            the logic in a PR, recompute the affected range into a staging version, reconcile it against
            source, atomically swap, then announce the restatement with the size of the change and keep the
            prior version queryable. The order matters: validated, then swapped, then communicated.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>An upstream source lands late at 05:50. Publish or hold?</strong> Predeclared policy,
            not a 05:50 debate: finance-grade marts hold and flag stale with an ETA; operationally tolerant
            dashboards publish with the affected mart flagged. Either way the source owner is paged and the
            miss is logged against the error budget.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why not stream this and be done with deadlines?</strong> Streaming does not remove the
            deadline, it hides it: finance closes on daily boundaries, reconciliation needs a stable
            cut-off, and intraday numbers invite decisions on unreconciled data. A nightly batch with a
            hard audit is the correctness-first shape; add intraday views only as clearly-labeled
            provisional numbers.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "This is small data with high stakes, so I optimize for correctness process. Nightly ELT into
          conformed dims and facts, a semantic layer so revenue is defined exactly once, and
          write-audit-publish where the audit is reconciliation, revenue ties out to billing to the cent
          or nothing publishes, with atomic publication. Airflow with data-interval runs budgets backward
          from 06:00, failures flag dashboards stale rather than wrong, and metric changes ship like code
          with a restatement policy for fixes."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "First, name the game: extracts from a handful of business systems are GBs a night, so the
          constraints that matter are the 06:00 deadline and finance-grade trust. Pipeline: nightly
          extracts or CDC-lite land in an immutable bronze; dbt or Spark builds conformed dimensions and
          facts, one shared dim_customer, facts at declared grains; a semantic layer defines each metric
          once with a named owner so self-serve BI and the exec dashboard read the same number. The 06:00
          machinery: Airflow with data-interval semantics so reruns are unambiguous, freshness checks that
          page the source owner at 02:00 rather than surprising us at 05:55, and an honest failure mode,
          dashboards carry a stale flag and stakeholders get a note, because stale-and-labeled beats
          silently wrong. Correctness is write-audit-publish: build into staging, audit row counts and key
          contracts, and reconcile, revenue must match the billing system to the cent, then publish
          atomically with a view flip or Iceberg branch fast-forward. Change is governed: contracts on
          source extracts, metric changes through PR with business-owner review, and restatements as
          versioned rebuilds that are announced and keep history reproducible. Compute cost is trivial
          here; the real spend is trust, reconciliation and review, and I'd budget the team's time that
          way."
        </Callout>
      </Block>
    </>
  );
}

/* ── Case: Hadoop to EMR migration ────────────────────────────── */
function CaseMigration() {
  return (
    <>
      <Lede>
        "800 jobs on a dying on-prem Hadoop estate. Move it to EMR and Iceberg in 12 months." This case
        is a risk-management interview wearing a technology costume: the score comes from dual-run,
        reconciliation, and rollback, plus the honesty to say that a third of the jobs are probably dead
        and the weird ones will eat the last quarter.
      </Lede>

      <Block eyebrow="month zero" title="Discovery before anything moves">
        <p className="text-ink-dim leading-relaxed mb-2">
          Inventory first, automated, not by survey: scrape the Hive metastore for tables and formats, the
          schedulers (Oozie, cron) for jobs and cadences, and query logs for lineage and actual
          consumers. For each job: owner, SLA, engine (Hive, MapReduce, Spark), inputs and outputs,
          criticality. Then say the number out loud: <strong>expect roughly 30% of the 800 jobs to be
          dead</strong>, no consumer reads their output, and the cheapest migration is deletion after an
          owner sign-off. Saying this unprompted is a credibility marker; every real estate audit finds it.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Risk machinery and honesty. Dual-run, reconciliation, tiered cutover, and rollback are the
          scoring spine; claiming a clean 12-month straight line with no dead jobs and no long tail reads
          as someone who has never done one.
        </Callout>
      </Block>

      <Block eyebrow="the strategy call" title="Lift-and-shift first, modernize second">
        <p className="text-ink-dim leading-relaxed mb-2">
          Big-bang re-architecture fails for a knowable reason: changing the platform <em>and</em> the
          logic at once makes every output diff ambiguous, is it EMR, or your rewrite? So: first make each
          job run <strong>the same</strong> on EMR (same engine version where possible, same logic,
          HDFS-to-S3 path mapping), prove equivalence with reconciliation, and only then modernize,
          Hive-to-Spark rewrites, Iceberg table conversion, as a separate, per-table decision with its own
          validation.
        </p>
      </Block>

      <Block eyebrow="the de-risking machinery" title="Waves, dual-run, reconciliation, tiered cutover">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Waves by domain</strong>: migrate a business domain's jobs and tables together (finance, marketing, ...) so lineage stays inside a wave and cross-system joins are rare. Early waves are low-criticality domains to shake out tooling.</li>
          <li><strong>Dual-run</strong>: the wave's jobs execute on EMR in shadow while production stays on-prem. Same inputs, both outputs retained.</li>
          <li><strong>Reconciliation</strong>: automated daily comparison of the two outputs, row counts, column checksums (hash of sorted key columns), and sampled row-level diffs, published as a report per job. Green streak required before anyone cuts over.</li>
          <li><strong>Tiered cutover</strong>: read-only consumers (dashboards, extracts) move to EMR outputs first; writers and downstream producers move last, once readers have soaked.</li>
          <li><strong>Rollback</strong>: because dual-running continues through cutover, rollback is just flipping consumers back to the on-prem output. Cheap rollback is the entire reason to pay for dual-run compute.</li>
        </ul>
        <CodeBlock
          title="text"
          lang="text"
          code={`per wave (repeat ~8-10x over 12 months):

  on-prem (PROD) ----jobs----> outputs ----+---> consumers (all)
                                           |
  EMR (SHADOW)  ----same jobs--> outputs --+--> reconciliation:
                                                 row counts, checksums,
                                                 sampled diffs, daily report
  after N green days:
     tier 1: read-only consumers  -> EMR outputs
     tier 2: writers/producers    -> EMR
     rollback at any point = flip consumers back (dual-run still live)
  decommission: green streak + all consumers moved + owner sign-off`}
        />
      </Block>

      <Block eyebrow="table mechanics" title="Hive to Iceberg without rewriting the world">
        <OpTable
          cols={["Path", "Mechanism", "", "When"]}
          rows={[
            { op: "In-place migrate", avg: "migrate / add_files", avgTone: "good", why: "Parquet-backed Hive tables adopt existing data files into Iceberg metadata, no data rewrite. The default path for most of the estate." },
            { op: "CTAS rewrite", avg: "full rewrite", avgTone: "ok", why: "Format changes (text/ORC to Parquet), layout changes, or partition redesign. Costs a full copy; reserve it for tables that earn it." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Catalog cutover</strong> is the consumer-facing trick: keep old table names working via
          aliases/views over the new Iceberg tables in Glue, so hundreds of queries and jobs cut over
          without SQL edits, then retire aliases per wave.
        </p>
        <p className="text-ink-dim leading-relaxed">
          <strong>Security remap</strong>: export Ranger/Sentry policies, translate to Lake Formation
          grants and IAM roles, and run an access-parity audit per wave, same principals, same effective
          permissions, before cutover. Security drift discovered after decommission is unrecoverable.
        </p>
      </Block>

      <Block eyebrow="the honest timeline" title="The long tail dominates, plan for it">
        <p className="text-ink-dim leading-relaxed mb-2">
          The first ~60% of jobs move fast, they are ordinary Hive and Spark on ordinary tables. The last
          quarter of the timeline belongs to the weird ones: custom UDFs, jobs shelling out to local
          scripts, undocumented dependencies, the MapReduce job nobody has touched since 2016. Staff a
          dedicated <strong>weird-jobs lane</strong> from month one so the tail is being drained in
          parallel, not discovered in month ten. <strong>Decommission criteria per wave</strong>: N clean
          dual-run days, all consumers cut over, rollback window expired, owner sign-off, then, and only
          then, on-prem capacity is reclaimed (which is where the business case's savings actually appear).
        </p>
        <p className="text-ink-dim leading-relaxed">
          <strong>Stakeholder cadence</strong>: weekly wave report (jobs moved, reconciliation pass rate,
          blockers), monthly steering with the burn-down and risk register, and cutover notices per
          consumer team. Migrations die of surprise, not of technology.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Jobs run slower on EMR than on-prem. Now what?</strong> Expected, and usually it is
            S3-vs-HDFS behavior, not the engine: small files, rename-heavy outputs, listing-heavy reads.
            Fix with the S3-optimized committer, compaction to bigger files, and right-sized instance
            families; budget a tuning pass into every wave instead of treating regressions as surprises.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Finance is shocked by month one's AWS bill. Explain.</strong> Dual-run doubles compute
            by design, that is the insurance premium for cheap rollback, and month one runs on-demand
            before Savings Plans and autoscaling are tuned. The correct move is forecasting it in the
            business case up front, with the crossover date when decommissioned on-prem capacity flips the
            curve.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you handle custom UDF portability?</strong> Inventory UDFs in discovery, most
            Hive UDFs run on Spark SQL unchanged; the rest get rewritten behind the same interface and
            validated with recorded input/output pairs harvested from production runs, so equivalence is a
            test suite, not an opinion.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The two systems drift during a long dual-run. Who wins?</strong> Prevent it rather than
            adjudicate it: per-wave change freeze on migrating jobs, or one repo and CI that deploys logic
            changes to both systems simultaneously. Reconciliation is the drift alarm; if it fires, on-prem
            remains the system of record until the diff is explained.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Discovery first: automated inventory of all 800 jobs with owners and SLAs, expecting about 30%
          to be dead. Strategy is lift-and-shift then modernize, because changing platform and logic at
          once makes every diff ambiguous. I migrate in domain waves with dual-run on EMR, automated
          reconciliation, row counts, checksums, sampled diffs, tiered cutover with read-only consumers
          first, and rollback as a consumer flip while dual-run continues. Parquet-backed Hive tables adopt
          into Iceberg in place; the long tail of weird jobs gets a dedicated lane from month one."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Month zero is discovery, scripted against the metastore, schedulers, and query logs: jobs,
          tables, SLAs, owners, lineage. I'd say out loud that roughly a third of the 800 jobs will turn
          out to be dead, and deletion after sign-off is the cheapest migration. The strategy call is
          lift-and-shift first, modernize second: make each job run identically on EMR, prove it, then
          convert tables and rewrite engines as separate decisions. Execution is waves by business domain.
          Each wave dual-runs on EMR in shadow while on-prem stays production, with automated daily
          reconciliation, row counts, column checksums, sampled row diffs, published per job. After a green
          streak, cutover is tiered: read-only consumers first, writers last, and rollback is just flipping
          consumers back since dual-run continues through the soak, cheap rollback is what the doubled
          compute buys. Tables: in-place migrate or add_files for Parquet-backed Hive tables, CTAS rewrite
          only where format or layout must change, and catalog aliases so consumers cut over without SQL
          edits. Security remaps from Ranger or Sentry to Lake Formation and IAM with a parity audit per
          wave. Decommission per wave needs the green streak, consumers moved, and owner sign-off, that is
          where the savings actually start. And I'd be honest about the timeline: the last months belong to
          the long tail of weird jobs, so a dedicated lane drains it from month one, with weekly wave
          reports and monthly steering so nobody is surprised."
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  framework: <Framework />,
  whiteboard: <Whiteboard />,
  caseclickstream: <CaseClickstream />,
  casecdc: <CaseCdc />,
  casemetrics: <CaseMetrics />,
  casemigration: <CaseMigration />,
};

export default function DesignRoom() {
  const [active, setActive] = useState("framework");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="The design round · LIVE"
      title="The Design Room"
      subtitle="The 45-minute data-system-design round: a repeatable framework, whiteboard choreography, and four cases rehearsed end to end, out loud."
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
