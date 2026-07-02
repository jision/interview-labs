import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import LpRouletteViz from "./behavioral/LpRouletteViz.jsx";

const ACCENT = "#d97cf6";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "loop", label: "How the loop scores you", group: "The loop" },
  { id: "star", label: "STAR that doesn't sound canned", group: "The method" },
  { id: "lps", label: "The LP map for data people", group: "The method" },
  { id: "stories", label: "Story scaffolds to fill in", group: "Your stories" },
  { id: "questions", label: "Question bank & roulette", group: "Your stories" },
];

/* ── How the loop scores you ──────────────────────────────────── */
function TheLoop() {
  return (
    <>
      <Lede>
        The behavioral round is not a warm-up, it is half the loop, and for a senior or staff data
        architect it is often the half that decides the level. The mistake candidates make is treating it
        as vibes. It is a structured, evidence-based evaluation, and once you see how the machine scores
        you, you can feed it exactly the evidence it is built to reward.
      </Lede>

      <Block eyebrow="the machine" title="The onsite anatomy">
        <p className="text-ink-dim leading-relaxed mb-2">
          A full onsite is typically four to six rounds. In Amazon-style loops each interviewer is
          assigned two or three Leadership Principles to probe, and their job is to leave with{" "}
          <em>evidence</em>, specific things you did and said, not an overall gut feeling. They write that
          feedback up against the principles they owned, and then a <strong>debrief</strong> puts every
          interviewer in a room to reconcile the written notes into a hire or no-hire at a level.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`ONE STANDARD LOOP  (typical of Amazon-style loops)

  round 1  ->  hiring manager      LPs: Ownership, Deliver Results
  round 2  ->  peer / IC           LPs: Dive Deep, Invent and Simplify
  round 3  ->  cross-team          LPs: Earn Trust, Have Backbone
  round 4  ->  Bar Raiser          LPs: rotating, plus the bar itself
  round 5  ->  skip / director     LPs: scope, ambiguity, influence

  each writes evidence-based notes  ->  DEBRIEF reconciles them  ->  decision`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Because the notes are written and then compared, the currency of the whole process is{" "}
          <strong>specific, quotable evidence</strong>. A story that gives the interviewer a number, a
          decision, and a trade-off they can transcribe is worth ten stories that leave them with an
          impression.
        </p>
      </Block>

      <Block eyebrow="the gatekeeper" title="The Bar Raiser">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>Bar Raiser</strong> is a trained interviewer pulled from <em>outside</em> the hiring
          team, with no stake in filling this particular role. Their mandate is to guard the long-term
          hiring bar: is this candidate better than the median person already in the role at this level. In
          practice a no from the Bar Raiser is very hard to override, so it is fair to frame it as{" "}
          <strong>effectively a veto</strong> even where it is not written down as one.
        </p>
        <Callout kind="warn" title="You cannot spot the Bar Raiser by the questions">
          They probe the same principles everyone else does, just more insistently on depth and honesty.
          The tell is the follow-up: they will not accept the surface answer and will keep asking "and then
          what did you specifically do" until they hit either the real detail or the bottom of your story.
          Prepare as if every interviewer is the Bar Raiser.
        </Callout>
      </Block>

      <Block eyebrow="what level looks like" title="Senior and staff behavioral signal">
        <p className="text-ink-dim leading-relaxed mb-2">
          The behavioral round is where level is calibrated, so the stories have to demonstrate a scope
          that matches the title. Four signals separate a senior or staff data architect from a strong
          mid-level engineer:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Scope beyond your own team</strong>, you changed how multiple teams or an org built data, not just how one pipeline ran.</li>
          <li><strong>Decisions under ambiguity</strong>, you moved with incomplete information, bounded the risk, and did not wait to be told what to do.</li>
          <li><strong>Influence without authority</strong>, you got teams that did not report to you to adopt a contract, a standard, or a migration.</li>
          <li><strong>Developing others</strong>, you raised the bar on people, through runbooks, review culture, mentoring, not just on systems.</li>
        </ul>
        <Callout kind="note" title="What the interviewer is listening for">
          At senior and staff, they are scoring the <em>blast radius of your judgment</em>: did your
          decisions ripple past your own keyboard, and did you own the outcome when they did. A great
          individual-contributor story with no organizational reach reads as a strong hire one level down.
        </Callout>
      </Block>

      <Block eyebrow="the culture tell" title="Data-point culture: say 'I', bring numbers, expect the probe">
        <p className="text-ink-dim leading-relaxed mb-2">
          These loops run on specific, first-person, quantified stories. Three habits map directly onto how
          you are scored:
        </p>
        <OpTable
          cols={["Habit", "Do this", "", "Because"]}
          rows={[
            { op: "First person", avg: "say 'I', not 'we'", avgTone: "good", why: "'We did X' reads as a red flag: the interviewer cannot tell what YOU did, so they cannot score you. Reserve 'we' for genuine collaboration, then immediately name your part." },
            { op: "Quantify", avg: "baseline and outcome in numbers", avgTone: "good", why: "A story without a before-number and an after-number is unfalsifiable. Numbers are the evidence the debrief runs on." },
            { op: "Expect depth", avg: "the 3-deep probe", avgTone: "ok", why: "They will ask 'why' and 'what exactly did you do' three layers down. Have the real details ready: baseline, dates, the trade-off you weighed, what you would change." },
          ]}
        />
        <Callout kind="trap" title="Do not reuse one story across rounds">
          Interviewers compare notes in the debrief, so the same story told twice covers only one set of
          principles and signals a thin track record. Walk in with a <strong>story matrix</strong>, five to
          seven distinct stories, each mapped to multiple principles, so you can always reach for a fresh
          one.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>You keep saying "we", what did you personally do?</strong> Name your specific
            decisions and actions: "I profiled the stage, I found the skewed key, I chose salting over a
            broadcast join because the dimension was too big." Reserve "we" only for the parts that truly
            were shared.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What were the actual numbers?</strong> Give the baseline and the outcome, "the job ran
            90 minutes and missed a 6am SLA; after the fix it ran 22 minutes with headroom." If you do not
            remember exact figures, give an honest, bounded estimate rather than a vague "much faster."
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What would you do differently?</strong> Offer a real, specific change, "I would have
            added the skew monitor before the incident, not after." A candidate with no reflection reads as
            someone who has not actually learned from the work.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Give me another example of that.</strong> This is why the matrix matters: reach for a
            different story, not a variation of the same one. Running dry here caps your level.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          Here is what I actually do. I walk in with five to seven distinct stories, each pre-mapped to two
          or three Leadership Principles and rehearsed at both 30 seconds and two minutes. I speak in "I", I
          open each story with a baseline number, and I never reuse a story across rounds because the panel
          reconciles written notes in the debrief.
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          I treat the behavioral round as a structured evidence hunt, not a chat. The loop is four to six
          interviewers, each assigned a couple of principles, each writing quotable notes that a debrief
          reconciles into a leveled decision, and one of them is a Bar Raiser from outside the team whose no
          is effectively a veto. So I prepare to feed the machine what it scores on: first-person decisions,
          a baseline and an outcome in numbers, and a named trade-off, all ready to survive a three-deep
          probe. Because I am interviewing for senior or staff, I choose stories that show scope past my own
          team, judgment under ambiguity, influence without authority, and developing other people. And I
          bring a story matrix so that when an interviewer asks for "another example", I have a fresh,
          distinct one instead of re-skinning the last.
        </Callout>
      </Block>
    </>
  );
}

/* ── STAR that doesn't sound canned ───────────────────────────── */
function StarMethod() {
  return (
    <>
      <Lede>
        STAR is not a script, it is a time budget. The candidates who sound canned spend two minutes on the
        situation and ten seconds on what they actually did. The ones who get the offer invert that, and
        they add a final beat, the reflection, that quietly signals seniority. Here is how to run it so it
        sounds like a person, not a template.
      </Lede>

      <Block eyebrow="the budget" title="STAR by proportion: Action is the point">
        <p className="text-ink-dim leading-relaxed mb-2">
          The whole answer is roughly two minutes. Spend it where the evidence is:
        </p>
        <OpTable
          cols={["Part", "Budget", "", "What goes here"]}
          rows={[
            { op: "Situation", avg: "~15%", avgTone: "ok", why: "The context in two or three sentences, including the baseline number. Enough for the stakes to land, no more." },
            { op: "Task", avg: "~10%", avgTone: "ok", why: "What you specifically owned and the constraint: the date, the SLA, the budget you were on the hook for." },
            { op: "Action", avg: "~60%", avgTone: "good", why: "The heart of it: your first-person decisions, including one named trade-off. This is what they score, so this is where the time goes." },
            { op: "Result", avg: "~15%", avgTone: "ok", why: "The quantified outcome against the baseline, plus what stuck: the monitor, the runbook, the standard." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          They are listening for <em>your</em> decisions in the Action, not your team's activity. The
          single strongest signal in the whole answer is a sentence that starts "I chose X over Y
          because...", a named trade-off proves you were the one steering, not along for the ride.
        </Callout>
      </Block>

      <Block eyebrow="the senior tell" title="STARR: add the second R, Reflection">
        <p className="text-ink-dim leading-relaxed mb-2">
          Bolt a fifth beat onto the end: <strong>Reflection</strong>, what you would do differently. It is
          short, one or two sentences, but it is the clearest seniority signal in the format. A junior
          candidate narrates a win. A senior one shows they have a running feedback loop on their own
          judgment.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`S  situation   ~15%   context + BASELINE number
T  task        ~10%   what I owned + the hard constraint
A  action      ~60%   my decisions, incl. one NAMED trade-off
R  result      ~15%   OUTCOME vs baseline + what stuck
R  reflection   +     what I would do differently  <- the senior tell`}
        />
        <Callout kind="tip" title="Reflection is not self-flagellation">
          "What I would do differently" is a design critique, not an apology. "I would have added the
          contract test before the migration, not during it" shows judgment. "I guess I could have worked
          harder" shows nothing.
        </Callout>
      </Block>

      <Block eyebrow="compress without gutting" title="The same story at 30 seconds and 3 minutes">
        <p className="text-ink-dim leading-relaxed mb-2">
          You need every story at two lengths: a 30-second version for rapid-fire or "give me another
          example", and a full three-minute version for the anchor story of a round. The rule for
          compressing: <strong>cut the Situation, never the Action</strong>. The context is the
          compressible part; your decisions and the trade-off are the load-bearing part.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`FULL (3 min):   long situation -> task -> 3 actions + trade-off -> result -> reflection

30-SEC:         one-line situation
                -> the ONE decision that mattered + the trade-off
                -> the number

  compress by dropping context, NOT by dropping your decisions`}
        />
      </Block>

      <Block eyebrow="graded pair" title="Weak vs strong on 'tell me about a production incident'">
        <Callout kind="warn" title="WEAK - vague, 'we'-heavy, no evidence">
          "We had a pipeline break once. The data was wrong and stakeholders were upset, so we all jumped on
          it and worked really hard to figure out what was going on. Eventually we found the issue and fixed
          it, and after that things were a lot better. It was a good learning experience for the team about
          being more careful."
        </Callout>
        <Callout kind="tip" title="STRONG - baseline, single owner, quantified, prevention, reflection">
          "Our daily revenue table fed three exec dashboards, and one morning it showed revenue up 40%,
          which was wrong. I owned it. I first froze the downstream refresh so no one made a call on bad
          numbers, then I traced it: an upstream team's refunds change had started emitting duplicate order
          rows without notice, and our join fanned out on them, double-counting revenue for that slice. I
          chose to backfill the seven affected days
          rather than just fix forward, because finance needed a corrected history, and I accepted a
          half-day delay on a lower-priority job to free the cluster for the backfill. Numbers were correct
          within four hours. Then I added a schema-contract check and a row-count anomaly alert so a silent
          upstream change like that gets caught before it lands. Looking back, I would have had that
          contract in place already, we had discussed it and deprioritized it, and this was the cost of
          that."
        </Callout>
        <p className="text-ink-dim leading-relaxed mb-1 mt-3">Why the strong one wins, line by line:</p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Baseline and stakes</strong>, "three exec dashboards", "revenue up 40% which was wrong" give the interviewer a number to write down.</li>
          <li><strong>Single owner</strong>, "I owned it", "I froze", "I traced", "I chose", every action is a first-person decision.</li>
          <li><strong>A named trade-off</strong>, backfill over fix-forward, and accepting a delay on another job, proves judgment under a real constraint.</li>
          <li><strong>Quantified recovery</strong>, "correct within four hours", not "things got better".</li>
          <li><strong>Prevention that stuck</strong>, the contract check and anomaly alert show you fixed the class of problem, not just the instance.</li>
          <li><strong>Honest reflection</strong>, owning that the contract had been deprioritized shows a feedback loop, not a humblebrag.</li>
        </ul>
      </Block>

      <Block eyebrow="delivery" title="How to actually say it">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Pause after the result.</strong> Land the number, then stop. The silence invites the follow-up you have prepped, and it signals you are done rather than rambling.</li>
          <li><strong>Do not monologue past about three minutes.</strong> A four-minute answer buries the evidence and reads as poor prioritization. Give the anchor version, then hand the wheel back.</li>
          <li><strong>Invite the probe.</strong> Ending with "happy to go deeper on the contract design if useful" shows you have depth in reserve and are comfortable being pushed.</li>
        </ul>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>That trade-off, why not just fix forward and move on?</strong> Because finance needed a
            corrected history for the seven days, not just a right number going forward, so a backfill was
            the only option that actually solved the stakeholder's problem. Fixing forward would have left
            wrong data in reports people had already acted on.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Walk me through exactly how you traced it.</strong> I diffed the day's row counts and
            per-column aggregates against the trailing week, saw both the row count and revenue jump for one
            order segment while the rest stayed flat, isolated it to duplicated rows, and confirmed the
            upstream commit that introduced them. Concrete, layered, no hand-waving.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You said you would have had the contract already, so was this your fault?</strong> I
            owned the call to deprioritize it, so yes, I share responsibility, and that is exactly why I
            made it non-negotiable afterward. Owning the miss without deflecting is the point of the
            reflection.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          I run STAR by time budget, roughly 15% situation, 10% task, 60% action, 15% result, and I add a
          reflection at the end. I quantify the baseline and the outcome, I keep the action in first-person
          decisions with one named trade-off, then I pause on the number and invite the probe.
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          The reason canned answers fail is a bad time budget: too much situation, too little action. So I
          spend most of the two minutes on my own decisions, and I always name at least one trade-off,
          "I chose X over Y because", because that one sentence is what proves I was steering. I open with a
          baseline number and I close with a quantified outcome plus what stuck, the monitor or contract I
          left behind. Then I add the second R, reflection: one honest sentence on what I would do
          differently, which is the clearest seniority tell in the format. I keep a 30-second and a
          three-minute cut of every story and compress by dropping context, never my decisions. And on
          delivery I pause after the result, stay under about three minutes, and leave a thread dangling so
          the interviewer can pull me deeper.
        </Callout>
      </Block>
    </>
  );
}

/* ── The LP map for data people ───────────────────────────────── */
function LpMap() {
  return (
    <>
      <Lede>
        Amazon publishes 16 Leadership Principles, but data loops lean hardest on about eight of them, and
        many other companies clone LP-style values, so this mapping transfers well beyond Amazon. The move
        is not to memorize all sixteen, it is to attach one strong, numeric data war story to each of the
        eight that actually come up, and to practice re-pointing a story at whichever principle the question
        is fishing for.
      </Lede>

      <Block eyebrow="the eight that matter" title="Principle → question → your data war story">
        <p className="text-ink-dim leading-relaxed mb-2">
          Each row is one principle, the classic way it gets phrased, and the data-flavored story angle that
          answers it. These are the eight a data-architect loop returns to again and again:
        </p>
        <OpTable
          cols={["Principle", "Classic phrasing", "", "Your data war story"]}
          rows={[
            { op: "Dive Deep", avg: "went deep to find a root cause", avgTone: "good", why: "The OOM / skew hunt: symptom to executor logs to the one hot key, salting fixed it, and you added a skew monitor so it never surprises you again." },
            { op: "Ownership", avg: "fixed something that wasn't yours", avgTone: "good", why: "The 2am pipeline incident you did not cause: you fixed the immediate break AND the class, idempotent retries plus an alert, with zero blame for the upstream team." },
            { op: "Deliver Results", avg: "delivered under a hard constraint", avgTone: "good", why: "The SLA rescue against a fixed date: what you descoped, the trade-off you named to stakeholders, and the outcome in numbers, on time." },
            { op: "Invent and Simplify", avg: "simplified something complex", avgTone: "good", why: "Collapsed dozens of bespoke jobs into one config-driven framework and killed about 30% of them, deleting the maintenance cost with them." },
            { op: "Frugality", avg: "did more with less", avgTone: "ok", why: "The bill fix: a NAT-gateway egress line, or the CSV-to-Parquet change that cut scan volume ~80%, or spot-instance adoption, with proof nothing regressed." },
            { op: "Earn Trust", avg: "told a stakeholder bad news", avgTone: "ok", why: "Openly restating to execs that a headline metric was double-counted, leading with the correction and what it bought you in credibility afterward." },
            { op: "Are Right, A Lot", avg: "a call against consensus", avgTone: "ok", why: "A data-backed decision the room disagreed with, and how you validated it cheaply, a backtest or a bounded pilot, before committing." },
            { op: "Have Backbone; Disagree and Commit", avg: "disagreed, then committed", avgTone: "ok", why: "The batch-vs-streaming fight you lost: you argued it with data, then committed wholeheartedly and made the chosen path work, with an honest read on who was right." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          They are checking whether your story actually <em>demonstrates</em> the principle they own, not
          just name-drops it. "Dive Deep" is not "I looked into it", it is a layered investigation where you
          visibly rejected the easy surface explanation. Match the story's structure to the principle's
          verb.
        </Callout>
      </Block>

      <Block eyebrow="one story, many principles" title="Re-point, don't re-tell">
        <p className="text-ink-dim leading-relaxed mb-2">
          The same war story usually covers several principles depending on where you put the emphasis. The
          skew-rescue is Dive Deep if you foreground the investigation, Deliver Results if you foreground the
          SLA you saved, and Invent and Simplify if you foreground the reusable fix. Practice steering one
          story toward whichever principle the question targets, that is what lets a matrix of five to seven
          stories cover a loop of thirty questions.
        </p>
        <Callout kind="tip" title="The mapping transfers">
          Google, Meta, Stripe, and most large data orgs run values-based behavioral rounds that rhyme with
          the LPs, ownership, dealing with ambiguity, cross-team influence, raising the bar. Prep against
          the eight here and you are prepped for almost any structured behavioral loop, just relabel.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Which principle do you think you are weakest on?</strong> Name a real one and show you
            are working on it, "Think Big, I am strongest on execution, so I have started framing my roadmap
            proposals around the three-year data platform, not just the next quarter." Honesty here reads as
            self-awareness.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Give me a Frugality example that is not just cutting cloud spend.</strong> Frugality is
            also doing more with the headcount and time you have: reusing an existing framework instead of
            building a new service, or automating a manual reconciliation so a person is freed for higher
            work.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your Ownership story, was that really yours or the team's?</strong> Separate the two
            cleanly: "The team responded, but I was the one who declared the incident, made the
            backfill-versus-fix-forward call, and drove the prevention item to done." Own the decisions,
            credit the collaboration.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          I do not memorize sixteen principles. I prep the eight that data loops actually lean on, Dive
          Deep, Ownership, Deliver Results, Invent and Simplify, Frugality, Earn Trust, Are Right A Lot, and
          Disagree and Commit, and I attach one strong, numeric story to each, then practice re-pointing a
          story at whichever principle the question targets.
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          The trap is trying to hold all sixteen in your head. Data-architect loops return to about eight,
          so I build a story for each: the skew hunt for Dive Deep, the 2am incident I did not cause for
          Ownership, the SLA rescue for Deliver Results, the framework that killed a third of our jobs for
          Invent and Simplify, the CSV-to-Parquet scan cut for Frugality, telling execs a headline metric
          was double-counted for Earn Trust, a data-backed call against consensus for Are Right A Lot, and
          the batch-versus-streaming fight I lost but made work for Disagree and Commit. Because one story
          usually touches several principles, I practice steering emphasis rather than telling a new story,
          which is how a handful of stories covers an entire loop. And since most large data orgs run
          values rounds that rhyme with the LPs, this same prep transfers, I just relabel it to their
          values.
        </Callout>
      </Block>
    </>
  );
}

/* ── Story scaffolds to fill in ───────────────────────────────── */
const SCAFFOLDS = [
  {
    n: 1,
    title: "The skewed-job rescue",
    lps: "Dive Deep, Deliver Results",
    prompt: "a time you went unusually deep to hit a hard deadline",
    skeleton: `S  baseline: a key job ran ______ min and was about to blow the ______ SLA
T  I owned: get it under ______ by ______ (date)
A  I did (2-3):
     1. profiled the stage, found ______ (skew on key ______)
     2. chose ______ (salting / broadcast / repartition) OVER ______, because ______
     3. ______
R  result: ______ min -> ______ min, SLA held, cost ______
R  reflection: I would have added ______ (the skew monitor) before, not after`,
    follow: "why that fix over the alternative; how you confirmed the hot key; what you monitor now.",
  },
  {
    n: 2,
    title: "The cost cut",
    lps: "Frugality, Invent and Simplify",
    prompt: "a time you did significantly more with less",
    skeleton: `S  baseline: monthly bill was $______ , and ______ % was going to ______ (the surprise line)
T  I owned: cut spend without touching SLA or freshness
A  I did (2-3):
     1. ______ (CSV -> Parquet, cut scan ~80% / killed a NAT egress path / spot adoption)
     2. ______
     3. ______
R  result: $______ -> $______ per month, SLA + quality held (proof: ______)
R  reflection: ______`,
    follow: "where the money was actually going; how you proved nothing regressed; what you would attack next.",
  },
  {
    n: 3,
    title: "The bad-data incident",
    lps: "Ownership, Earn Trust",
    prompt: "a time you owned a problem you did not cause",
    skeleton: `S  baseline: ______ table fed ______ dashboards; one morning it showed ______ (wrong)
T  I owned it, even though the root cause was upstream
A  I did (2-3):
     1. froze downstream so no one acted on bad numbers
     2. traced it to ______ (silent upstream schema/units change)
     3. chose backfill OVER fix-forward because ______ ; told stakeholders early
R  result: correct within ______ hours; added ______ (contract check + anomaly alert)
R  reflection: I would have had the ______ contract in place already`,
    follow: "why backfill not fix-forward; exactly how you traced it; how you handled the upstream team without blame.",
  },
  {
    n: 4,
    title: "The migration you led",
    lps: "Deliver Results, Earn Trust",
    prompt: "the most complex project you led end to end",
    skeleton: `S  scope: moved ______ (pipelines / tables / TB) across ______ teams, over ______ months
T  I owned delivery against ______ (a cutover date / a decommission deadline)
A  I did (2-3):
     1. dual-ran old and new, with ______ reconciliation (row counts / checksums / KPI parity)
     2. ______ (staged cutover per domain, rollback plan per stage)
     3. ______
R  result: cut over with ______ discrepancy, on ______ (date), decommissioned ______
R  reflection: ______`,
    follow: "how you built trust in the new numbers; the riskiest dependency and how you de-risked it; what you would sequence differently.",
  },
  {
    n: 5,
    title: "The schema-break war and contracts",
    lps: "Ownership, Invent and Simplify",
    prompt: "a time you influenced teams that did not report to you",
    skeleton: `S  baseline: upstream schema changes broke ______ jobs about ______ times per ______
T  no authority over the producing teams; I still owned the breakage downstream
A  I did (2-3):
     1. quantified the breakage cost so it was undeniable: ______
     2. proposed and prototyped ______ (schema contracts / a compatibility check in CI)
     3. got ______ teams to adopt it by ______ (prototype + evidence, not mandate)
R  result: breakages ______ -> ______ ; adoption across ______ teams
R  reflection: ______`,
    follow: "why teams with no obligation listened to you; how you handled a hold-out; what the contract actually checks.",
  },
  {
    n: 6,
    title: "The batch-vs-streaming disagreement",
    lps: "Have Backbone; Disagree and Commit",
    prompt: "a time you disagreed with a decision and committed anyway",
    skeleton: `S  the call: the team wanted ______ (streaming / batch); I argued for ______
T  I brought data, not just an opinion: ______ (cost / latency need / complexity)
A  I did (2-3):
     1. made the case with ______ (a costed comparison, a latency-requirement check)
     2. lost the call; committed visibly and wholeheartedly
     3. made the chosen path work: ______
R  result: ______ ; honest read on who was right: ______
R  reflection: ______`,
    follow: "how you disagreed without softening the point; how you committed for real; whether you turned out right.",
  },
  {
    n: 7,
    title: "Raising the bar on the team",
    lps: "Hire and Develop the Best",
    prompt: "a time you raised the quality bar on your team",
    skeleton: `S  baseline gap: ______ (ramp time / repeat incidents / shallow reviews), measured at ______
T  I owned making the team better, not just shipping my own work
A  I did (2-3):
     1. built ______ (runbooks / an on-call review culture / an onboarding path)
     2. ______ (a review checklist, pairing, honest feedback)
     3. ______
R  result: ______ improved from ______ to ______ (ramp time / incident rate)
R  reflection: ______`,
    follow: "a specific person or metric that improved; how you made it stick after you moved on; the mechanism, not the vibe.",
  },
];

function Stories() {
  return (
    <>
      <Lede>
        Do not walk into the loop with raw memories, walk in with filled-in scaffolds. Below are seven
        skeletons mined from this site's own technical tracks, the skew rescue, the cost cut, the bad-data
        incident, the migration, the contracts war, the batch-vs-streaming fight, and raising the bar. Fill
        the blanks with your real numbers, rehearse each aloud, and you have a story matrix that covers a
        whole behavioral loop.
      </Lede>

      <Block eyebrow="how to use these" title="Fill every blank with a real number">
        <p className="text-ink-dim leading-relaxed mb-2">
          Each scaffold has the prompt it answers, a skeleton with explicit blanks, the principles it
          covers, and the follow-ups to prep. The blanks are load-bearing: a scaffold with the numbers
          filled in is an interview answer, a scaffold with "much faster" in the blanks is a red flag. Every{" "}
          <code className="font-mono">______</code> is a place you must supply a concrete figure, date, or
          decision.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Across all seven, the scored elements are identical: a quantified baseline, two or three
          first-person actions with a named trade-off, a quantified result, and a reflection. If a story is
          missing one of those four, the interviewer cannot fully score it, fill the gap before interview
          week.
        </Callout>
      </Block>

      <Block eyebrow="the seven scaffolds" title="Fill these in with your own history">
        <div className="space-y-4">
          {SCAFFOLDS.map((s) => (
            <div key={s.n} className="rounded-lg border border-line bg-surface-2 p-4">
              <div
                className="font-mono text-[11px] uppercase tracking-wider mb-1"
                style={{ color: ACCENT }}
              >
                scaffold {s.n} · {s.lps}
              </div>
              <div className="text-sm font-semibold text-ink mb-1">{s.title}</div>
              <p className="text-ink-dim text-sm mb-2">
                <strong>Prompt it answers:</strong> "{s.prompt}"
              </p>
              <CodeBlock title="text" lang="text" code={s.skeleton} />
              <p className="text-ink-dim text-sm mt-2">
                <strong>Follow-ups to prep:</strong> {s.follow}
              </p>
            </div>
          ))}
        </div>
      </Block>

      <Block eyebrow="the grid" title="The story matrix">
        <p className="text-ink-dim leading-relaxed mb-2">
          Lay your five to seven stories down one axis and the eight principles across the other, then check
          the boxes each story can cover. A good matrix has every principle hit by at least one story, and
          your strongest stories, the skew rescue and the migration, hitting three or four each. That grid,
          not raw recall, is what lets a handful of stories answer thirty questions.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`STORY MATRIX  (rows = your stories, cols = principles they cover)

                        Dive  Own  Deliv  I&S  Frug  Trust  Right  Backbone
  1 skew rescue          X          X
  2 cost cut                              X    X
  3 bad-data incident          X                     X
  4 migration                        X                X
  5 contracts war              X          X
  6 batch-vs-streaming                                       X      X
  7 raising the bar   (Hire & Develop)  ->  ramp time, review culture

  goal: every column covered; top stories cover 3-4 columns each`}
        />
        <Callout kind="tip" title="Rehearse aloud, at both lengths">
          A story you have only thought about is not ready. Say each one out loud, at 30 seconds and at
          three minutes, until the numbers come without hunting for them. Reading it in your head hides
          exactly the hesitations the Bar Raiser is listening for.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Do you have another example of that?</strong> This is the exact question the matrix
            exists to survive. Reach across to a different row, "yes, a different one", not a variation of
            the story you just told. Running dry caps your level.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What was the hardest part of that, really?</strong> Go to the genuine difficulty, the
            trade-off or the ambiguity, not a safe answer. "Convincing three teams to adopt a contract they
            saw as friction" beats "it was a lot of work."
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>If you ran it again with what you know now?</strong> This is the reflection blank made
            into a question. Have a specific, credible change ready for every scaffold, that is why the
            reflection line is in each skeleton.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          I build a five-to-seven story by eight-principle grid so every likely question has a story. I fill
          each scaffold with a real baseline, two or three first-person actions with a named trade-off, a
          quantified result, and a reflection, and I rehearse each aloud at 30 seconds and three minutes
          until the numbers come without hunting.
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          Rather than trust raw memory, I convert my history into filled-in scaffolds: the skew rescue, the
          cost cut, the bad-data incident, the migration, the contracts war, the batch-versus-streaming
          disagreement, and raising the bar on the team. Each one gets a concrete baseline number, my two or
          three decisions including a trade-off, a quantified outcome, and one honest line on what I would do
          differently, because those four elements are exactly what the interviewer scores. Then I lay them
          on a matrix against the eight principles and make sure every column is covered, with my strongest
          stories covering three or four each. Finally I rehearse every story out loud at both lengths, so
          when I get "give me another example" I reach for a fresh row instead of re-skinning the last one.
        </Callout>
      </Block>
    </>
  );
}

/* ── Question bank & roulette ─────────────────────────────────── */
function Questions() {
  return (
    <>
      <Lede>
        You have the stories and the method, now drill delivery under a cold question. This topic is the
        gym: a few habits that keep you composed when a prompt lands, the two classic traps to defuse, and a
        roulette that fires a random behavioral question so you can practice answering out loud before you
        ever see which principle it targets.
      </Lede>

      <Block eyebrow="composure" title="It is fine to take a beat, and to ask">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two habits that read as senior, not slow:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Take five seconds before answering.</strong> A short, deliberate pause to pick the right story reads as thoughtful. Blurting the first memory that surfaces and backtracking reads as unprepared. Silence is cheaper than a false start.</li>
          <li><strong>Ask a clarifying question if the prompt is ambiguous.</strong> "Do you want a technical conflict or a people conflict?" is a strong move, it shows you calibrate to the actual ask instead of guessing, and it buys you a moment to choose the best-matched story.</li>
        </ul>
        <Callout kind="note" title="What the interviewer is listening for">
          They are reading composure under an open-ended prompt: do you steer to a specific, relevant story
          on purpose, or do you wander. A deliberate pause and a sharp clarifying question both signal
          control. Rambling to fill silence signals the opposite.
        </Callout>
      </Block>

      <Block eyebrow="the two traps" title="The 'failure' question and the 'why us' question">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two prompts sink more candidates than any technical follow-up because people try to dodge them:
        </p>
        <OpTable
          cols={["Prompt", "The trap", "", "What actually wins"]}
          rows={[
            { op: "Tell me about a failure", avg: "the humblebrag", avgTone: "bad", why: "'I worked too hard' or a disguised win fails instantly. They want a REAL failure with real cost, owned in the first person, followed by a durable change in how you work and evidence it stuck. The learning arc is the whole point." },
            { op: "Why are you leaving / why us", avg: "trashing the current job", avgTone: "bad", why: "Never disparage a current employer, it reads as risk. Have a crisp, forward-looking one-liner: what you are growing toward and why this role and team is the place to do it. Positive, specific, short." },
          ]}
        />
        <Callout kind="trap" title="A failure story with no learning is just a confession">
          The arc matters more than the failure. State the real miss and its cost, own the specific decision
          of yours that caused it, then show the mechanism you changed and proof it held. A candidate who
          cannot name a genuine failure reads as someone with no self-awareness or no track record of hard
          calls.
        </Callout>
      </Block>

      <Block eyebrow="drill it" title="LP roulette">
        <p className="text-ink-dim leading-relaxed mb-3">
          Draw a random question and answer it out loud in STARR form for about two minutes{" "}
          <em>before</em> revealing anything. The reveal shows which principles the question targets, what a
          strong answer includes, and which scaffold from the Stories topic fits. Cold reps under a random
          prompt are the closest practice to the real thing.
        </p>
        <Try label="draw a question">
          <LpRouletteViz />
        </Try>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>You paused for a while there, everything okay?</strong> "Just picking the sharpest
            example, one second", said calmly, is a fine answer. The pause only hurts if you apologize for
            it or fill it with filler. Own the beat.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>That failure, whose fault was it really?</strong> Resist deflecting. Name your specific
            contributing decision even if others also erred, "I share it, and my part was deprioritizing the
            contract." Ownership of the miss is what the question is actually scoring.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Do you have any questions for me?</strong> Always yes, and make them specific to the
            team's data work: on-call load, how they handle schema evolution, what "staff" means here.
            Generic questions waste your last signal; sharp ones extend it.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          Micro-habits win the human round. I take a beat before answering, ask one clarifying question if
          the prompt is ambiguous, keep a real failure with a genuine learning arc ready instead of a
          humblebrag, and have crisp, positive one-liners for "why are you leaving" and "why us".
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          When a cold prompt lands, I do not blurt, I take about five seconds to choose the best-matched
          story, and if the prompt is ambiguous I ask a sharp clarifying question, which both calibrates my
          answer and buys a moment. I defuse the two classic traps deliberately: the failure question wants
          a real failure with real cost, owned in the first person, with a durable change and proof it
          stuck, never a disguised win, and the why-are-you-leaving question wants a forward-looking
          one-liner about what I am growing toward, never a word against my current employer. I keep those
          one-liners rehearsed so they come out crisp. And I close every round with specific questions about
          the team's data work, because that is the last piece of signal I control. Then I just keep
          drilling cold reps on the roulette until delivery is automatic.
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  loop: <TheLoop />,
  star: <StarMethod />,
  lps: <LpMap />,
  stories: <Stories />,
  questions: <Questions />,
};

export default function BehavioralBench() {
  const [active, setActive] = useState("loop");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="The human round · STAR"
      title="Behavioral Bench"
      subtitle="Half the loop is behavioral signal. Bar-raiser mechanics, Leadership Principles mapped to data war stories, and scaffolds to build yours before interview week."
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
