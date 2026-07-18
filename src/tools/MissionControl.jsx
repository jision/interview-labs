import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import PlanTrackerViz from "./google/PlanTrackerViz.jsx";
import ScorecardViz from "./google/ScorecardViz.jsx";

const ACCENT = "#4285F4";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "loop", label: "How the L6 loop really works", group: "Know the loop" },
  { id: "output", label: "The output that matters", group: "Know the loop" },
  { id: "plan", label: "The 21-day plan", group: "The plan" },
  { id: "notdo", label: "What NOT to spend time on", group: "The plan" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* small cross-link to an existing tool route */
function XLink({ to, children }) {
  return (
    <a href={to} className="font-mono text-xs" style={{ color: ACCENT }}>
      {children}
    </a>
  );
}

/* ── How the L6 loop really works ─────────────────────────────── */
function Loop() {
  return (
    <>
      <Lede>
        Google does not run a mysterious loop, it runs a specific pipeline, and most of what sinks strong
        candidates is misreading it. The technical bar is real, but so is the fact that a committee you never
        meet decides your fate from written notes. Here is exactly how the L6 Software Engineer loop works in
        2025-2026, stage by stage, so you prepare for the machine that actually exists rather than the one you
        imagine.
      </Lede>

      <Block eyebrow="the pipeline" title="Seven gates, each independent">
        <p className="text-ink-dim leading-relaxed mb-3">
          You clear one gate at a time, and each has a different owner and a different question. Losing sight
          of which gate you are in is how people over-prepare the coding and under-prepare the committee.
        </p>
        <OpTable
          cols={["Stage", "Format", "", "What it screens"]}
          rows={[
            { op: "GHA online assessment", avg: "mandatory gate", avgTone: "ok", why: "About 50 work-style and values items, no coding. A screen-out, not a differentiator; treat it as hygiene and move on." },
            { op: "Recruiter screen", avg: "~30 min", avgTone: "good", why: "Level calibration, timeline, and the scope of your leadership. Confirm you are being read at L6, not L5." },
            { op: "Technical phone screen", avg: "1-2 x 45m", avgTone: "ok", why: "A 45-minute coding round in a shared editor. One or two of them before the onsite; you must clear these to advance." },
            { op: "Virtual onsite loop", avg: "4-6 rounds", avgTone: "bad", why: "The core: a mix of coding, two system-design rounds, and one behavioral. Each interviewer writes structured notes." },
            { op: "Hiring committee", avg: "reads the packet", avgTone: "bad", why: "A committee of Googlers who never met you decides from the written packet, not the people who were in the room." },
            { op: "Team matching", avg: "2-8 weeks", avgTone: "ok", why: "A separate phase after approval: you and a team choose each other. Committee approval is not yet an offer." },
            { op: "Offer", avg: "comp + close", avgTone: "good", why: "Compensation is set by level and committee signal, then negotiated. Only now is the loop actually over." },
          ]}
        />
      </Block>

      <Block eyebrow="the onsite" title="The round mix, and the variance">
        <p className="text-ink-dim leading-relaxed mb-3">
          The onsite is typically five rounds (four to six). The single biggest change from L5 to L6 is that system design
          roughly doubles: one design round becomes two, at org-level scope. The behavioral round is now one
          combined session, not two.
        </p>
        <OpTable
          cols={["Onsite round", "Count at L6", "", "What it is"]}
          rows={[
            { op: "Coding", avg: "2-3 touchpoints", avgTone: "ok", why: "Data structures and algorithms in a shared editor. About 2-3 coding touchpoints across the onsite, on top of the one or two 45-minute phone screens; underperformance here still fails L6." },
            { op: "System design", avg: "typically 2", avgTone: "bad", why: "The biggest L5-to-L6 differentiator. Usually one product or applied design and one infra or architecture design, at org-level scope." },
            { op: "Googleyness & Leadership", avg: "1 combined", avgTone: "ok", why: "About 45 minutes, 4-6 STAR stories. Now a single combined round that reads both attributes, not two separate ones." },
          ]}
        />
        <Callout kind="warn" title="Prep for a range, not a fixed shape">
          Loops vary. A real L6 loop was reported as three coding, one design, one behavioral, the mirror
          image of the two-design default. So rehearse both configurations: enough design depth to carry two
          org-scope rounds, and enough coding stamina to carry three. Encode a range in your head, never a
          fixed round count you can be surprised out of.
        </Callout>
      </Block>

      <Block eyebrow="the four attributes" title="GCA, RRK, Googleyness, Leadership, read across the rounds">
        <p className="text-ink-dim leading-relaxed mb-3">
          Google scores four attributes, but for a Software Engineer they are not each their own round. This
          is the correction that reframes your whole prep:
        </p>
        <OpTable
          cols={["Attribute", "Weight", "", "Where it is read"]}
          rows={[
            { op: "GCA (general cognitive ability)", avg: "most weighted", avgTone: "bad", why: "How you decompose, handle ambiguity, and reason. Read ACROSS coding and design; there is NO standalone GCA round for SWE." },
            { op: "RRK (role-related knowledge)", avg: "high", avgTone: "ok", why: "The technical depth the role needs. Also inferred across the coding and design rounds, not tested in a separate one." },
            { op: "Googleyness", avg: "gate", avgTone: "ok", why: "Scored from BEHAVIOR in the room: how you handle disagreement, pushback, and asking for help. Not from how you describe yourself." },
            { op: "Leadership", avg: "emergent", avgTone: "ok", why: "Influence without authority, driving outcomes across teams you do not own. Combined with Googleyness in the one behavioral round." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Quotable signal, not correct answers alone. Because GCA and RRK are read across every technical
          round and a committee scores you from notes, your job is to force sentences worth writing down:
          state the complexity out loud, name the trade-off, and label your decisions with "I". A right answer
          that leaves no quotable line behind under-scores a slightly worse answer that did.
        </Callout>
      </Block>

      <Block eyebrow="who actually decides" title="Impress the packet, then survive team matching">
        <p className="text-ink-dim leading-relaxed mb-2">
          The interviewers do not hire you. Each writes a structured note, those notes are compiled into a
          <strong> packet</strong>, and a <strong>hiring committee</strong> of Googlers who never met you
          reads the packet and decides. This is the "impress the packet" rule: you are not performing for the
          person across the table, you are producing evidence for a reader who was never in the room. Vague
          rapport does not transcribe; "I chose the LSM tree because writes dominate at roughly 50K a second"
          does.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          Committee approval is still not an offer. <strong>Team matching</strong> is a separate phase that
          runs two to eight weeks afterward, where you and a hiring manager choose each other. You can be
          approved and still spend weeks matching, and the level you were approved at travels with you.
        </p>
        <Callout kind="tip" title="Downleveling comes from scope, not from a weak answer">
          L5 design is usually one subsystem-scope round; L6 is about two rounds at org-level scope. The
          fastest way to get downleveled to L5 is to tell project-scope stories, "I built this service", when
          the bar wants org-scope impact, "I aligned four teams onto one platform and owned the deprecation".
          Pitch your stories at the altitude of the level you want.
        </Callout>
      </Block>

      <Block eyebrow="emerging in 2026" title="The AI-assisted and code-comprehension change">
        <Callout kind="warn" title="Verify with your recruiter, do not rebuild around it">
          Google is piloting AI-assisted coding and a separate code-comprehension round, reading, debugging,
          and optimizing existing code, sometimes alongside Gemini. So far this has appeared mostly at junior
          and mid levels in the US and is not confirmed as universal at L6. Ask your recruiter what your
          specific loop includes, but keep your preparation on the fundamentals; they still decide the outcome,
          and an emerging format you cannot confirm is not worth reorganizing three weeks around.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How many rounds should I actually expect?</strong> Four to five onsite, on top of one or
            two 45-minute coding phone screens. Plan for two designs plus two-to-three coding and one
            behavioral, and stay ready if it skews coding-heavy instead.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>If GCA is the most weighted attribute, which round is the GCA round?</strong> There is not
            one for SWE. GCA and RRK are inferred from your coding and design rounds, so every technical round
            is quietly a GCA round, and only the behavioral round is explicitly attribute-labeled.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The interviewers liked me, so I am through, right?</strong> Not necessarily. Interviewers
            only write notes; a hiring committee that never met you decides from the packet. If the notes lack
            quotable signal, warmth in the room will not save the score.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>I passed the committee, when is my offer?</strong> After team matching, a separate
            two-to-eight-week phase. Approval sets your level; matching finds the team, and only then does an offer
            get built.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "The L6 loop is a GHA assessment, a recruiter screen, one or two 45-minute coding phone screens,
          then a four-to-five-round virtual onsite, roughly two or three coding touchpoints, two system-design
          rounds, and one combined Googleyness-and-Leadership behavioral. A hiring committee, not the
          interviewers, decides from written notes, and team matching is a separate phase before any offer.
          GCA and RRK are read across the technical rounds, there is no standalone GCA round for SWE, so my job
          is to leave quotable signal in every note."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I treat the loop as a pipeline of independent gates. First a GHA online assessment, about fifty
          work-style and values questions, which is a screen-out, not a differentiator. Then a thirty-minute
          recruiter screen where I confirm I am being read at L6. One or two forty-five-minute coding phone
          screens follow, and I have to clear them to reach the onsite. The onsite is typically five rounds, four to six: two
          or three coding touchpoints total, two system-design rounds, which are the real L5-to-L6
          differentiator, usually one product or applied design and one infrastructure design at org-level
          scope, and one combined behavioral of about forty-five minutes with four to six STAR stories. I prep
          for variance, though, because a real L6 loop has been reported as three coding, one design, one
          behavioral, so I keep both a two-design and a coding-heavy plan ready. The four attributes, GCA,
          which is the most weighted, RRK, Googleyness, and Leadership, are not each their own round: for SWE,
          GCA and RRK are read across the coding and design work, and only the behavioral round is
          attribute-labeled. Crucially, the interviewers do not decide, they write structured notes that become
          a packet, and a hiring committee of Googlers who never met me makes the call, so I force quotable
          signal into those notes, state complexity, name trade-offs, label decisions with 'I'. After approval
          there is still team matching, a separate two-to-eight-week phase, and approval is not an offer. And I
          would ask my recruiter whether my loop includes the emerging AI-assisted coding or code-comprehension
          round, since that is still being piloted and not confirmed at L6."
        </Callout>
      </Block>
    </>
  );
}

/* ── The output that matters ──────────────────────────────────── */
function Output() {
  return (
    <>
      <Lede>
        The most common preparation mistake is optimizing the wrong number. "I did 200 LeetCode problems" is
        an input, not an output, and the loop scores output. Measure yourself on what you can produce on
        demand, under time, in front of a stranger, because that is the only thing the packet can quote.
      </Lede>

      <Block eyebrow="the real deliverables" title="Five things you can produce on demand">
        <p className="text-ink-dim leading-relaxed mb-2">
          Prep is done when these exist, not when a problem counter hits a round number. This track is a lens
          over the existing tools, so each deliverable points at where you actually build it:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-2 text-sm">
          <li>
            <strong>Problems you can re-solve from a blank editor</strong>, without the answer in view. Not
            problems you have "seen", problems you can re-derive by pattern. The reps live in{" "}
            <XLink to="#/interview-bench">Interview Bench</XLink> (the patterns) and{" "}
            <XLink to="#/identifier">The Identifier</XLink> (the constraint decoder).
          </li>
          <li>
            <strong>Designs you can defend under pushback</strong>, not designs you can recite. Two of them, at
            org scope. Rehearse the choreography in <XLink to="#/whiteboard">Whiteboard</XLink>, the data cases
            in <XLink to="#/design-room">Design Room</XLink>, and LLM serving in{" "}
            <XLink to="#/architect-bench">Architect's Bench</XLink>.
          </li>
          <li>
            <strong>Failure modes that surface automatically</strong>, you name the network partition, the hot
            key, the retry storm, and the poison message before the interviewer asks. Unprompted is the signal.
          </li>
          <li>
            <strong>Project stories at 2, 10, and 30 minutes</strong>, the same project compressed or expanded
            on demand, each ending in a metric and a decision you owned in the first person. Build them in{" "}
            <XLink to="#/architect-role">Architect's Role</XLink> (Influence, comms & STAR).
          </li>
          <li>
            <strong>Mistakes that do not recur</strong>, tracked in an error log you actually re-read, so the
            same dropped invariant never costs you twice.
          </li>
        </ul>
      </Block>

      <Block eyebrow="grade every mock" title="The 10-point coding-mock scorecard">
        <p className="text-ink-dim leading-relaxed mb-2">
          A mock you do not grade is just anxiety with a timer. Score every coding mock against this rubric,
          and hold yourself to 8 out of 10 <strong>repeatedly</strong>, one good mock is variance, a streak is
          readiness.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`CODING-MOCK SCORECARD                              pts
  clarified the problem                             1
  valid initial approach before coding              1
  efficient solution (not the brute force)          1
  explained the invariant out loud                  1
  code correct                                      2   <- all or nothing
  readable, clean code                              1
  edge cases handled                                1
  complexity stated (time + space)                  1
  handled the follow-ups                            1
  ------------------------------------------------- ---
  TOTAL                                            10

  target: 8 / 10, REPEATEDLY, not once.
  any UNRESOLVED correctness bug = NOT a pass,
  no matter what the total adds up to.`}
        />
        <Callout kind="trap" title="A clever, broken solution is a fail">
          The two-point "code correct" item is all-or-nothing, and a single unresolved correctness bug fails
          the mock regardless of the other nine lines. At L6, correct-and-readable with a stated invariant
          beats clever-but-wrong every time. Optimize for the solution you can defend, not the trick.
        </Callout>
        <Try label="score a mock">
          <ScorecardViz />
        </Try>
        <Callout kind="note" title="What the interviewer is listening for">
          Interview-grade output on demand, a defensible design, a correct-and-readable solution with its
          complexity named, a metric-bearing story, rather than a large count of problems you once solved. The
          scored signal is repeatability under time pressure, not volume, and the packet can only quote what
          you actually produced in the room.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Why not just grind 300 LeetCode problems?</strong> Because the loop scores whether you can
            solve a fresh problem cleanly under time, not how many you have seen. Fifty problems you can
            re-derive by pattern beat three hundred you half-remember.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What counts as a pass on a coding mock?</strong> Eight out of ten on the rubric, hit
            repeatedly, with zero unresolved correctness bugs. A clever-but-broken solution fails;
            correct-and-readable with stated complexity passes.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you make failure modes come out automatically?</strong> Rehearse them into the
            design until naming the partition, the hot key, and the retry storm is reflex. If the interviewer
            has to ask, it did not land as your signal.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why the 2, 10, and 30-minute story lengths?</strong> Different rounds hand you different
            time. The same project must compress to a two-minute hook, a ten-minute walkthrough, and a
            thirty-minute deep dive without losing the metric or the decision you owned.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I measure output, not LeetCode count. My deliverables are concrete: problems I can re-solve from a
          blank editor, two designs I can defend under pushback, failure modes I name unprompted, project
          stories at two, ten, and thirty minutes, and an error log so mistakes do not recur. On coding mocks I
          grade against a ten-point rubric and hold eight out of ten repeatedly, with any unresolved
          correctness bug as an automatic fail."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I stopped counting problems and started measuring deliverables. First, coding: I want problems I can
          re-solve from an empty editor by recognizing the pattern, roughly fifty re-derivable ones beat
          hundreds half-remembered, and I grade every mock on a ten-point rubric, holding myself to eight or
          higher repeatedly, with any unresolved correctness bug as an automatic fail, because a clever, broken
          solution does not pass at L6. Second, design: two designs I can defend under pushback at org scope,
          where the failure modes, partitions, hot keys, retry storms, come out of my mouth before I am asked,
          because that unprompted instinct is what the notes quote. Third, stories: each key project compressed
          to a two-minute hook, a ten-minute walkthrough, and a thirty-minute deep dive, every version ending
          in a metric and a decision I owned in the first person. Fourth, an error log, so a mistake from week
          one, a missed edge case, a hand-waved watermark, does not recur in week three. If a study session did
          not move one of those four, it was activity, not output."
        </Callout>
      </Block>
    </>
  );
}

/* ── The 21-day plan ──────────────────────────────────────────── */
function Plan() {
  return (
    <>
      <Lede>
        Three weeks, four focused hours a day. The plan is built backward from what the packet rewards:
        repeatable coding output, two defensible org-scope designs, and metric-bearing leadership stories.
        Every day ends in one of those three, or it was study, not preparation. Track your 63 cells below and
        do not break the Day-18 rule.
      </Lede>

      <Block eyebrow="the daily shape" title="Normal day vs mock day">
        <p className="text-ink-dim leading-relaxed mb-2">
          Most days follow the normal split. At the end of each week, a mock day runs the real thing under
          time and then grades it, because an ungraded mock teaches nothing.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`NORMAL DAY  (4 hours)
  120m   coding      2 problems, or 1 hard problem + a full review
   90m   HLD         one design topic + one timed design exercise
   30m   lead/proj   one leadership or project-story rep

MOCK DAY  (4 hours, end of each week)
   45m   coding      timed, full interview conditions
   35m   review      grade it on the 10-point scorecard, log every miss
   60m   design      timed design round, spoken out loud
   40m   review      grade the design, write down the gaps
   40m   lead/proj   a project deep-dive or behavioral mock
   20m   error-log   update the running error log`}
        />
      </Block>

      <Block eyebrow="week 1" title="Foundations">
        <p className="text-ink-dim leading-relaxed mb-2">
          Learn the design framework, warm the core coding patterns, and pick two projects with eight stories.
          Coding reps map onto <XLink to="#/interview-bench">Interview Bench</XLink>; the Google-flavored design
          prompts (Monarch, Doorman, Borg, Colossus, Dataflow) are just realistic targets to rehearse against.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`Day  Coding (2h)                      HLD design (90m)                     Leadership / RRK (30m)
---- -------------------------------  ------------------------------------ ----------------------------
D1   baseline Medium + arrays/hashing learn the design framework           pick 2 projects + 8 stories
D2   prefix sums + hashmaps           telemetry ingestion (Monarch)        project-1 2-min overview
D3   sliding window + two pointers    global rate limiter (Doorman)        project-1 scale story
D4   binary search                    Borg cluster scheduler               ambiguity story
D5   trees + recursion                Colossus file-system metadata        production-failure story
D6   graph BFS / DFS                  petabyte processing (Dataflow)       project-1 critical decisions
D7   timed coding mock + correction   timed design mock (telemetry)        weekly error-log review`}
        />
      </Block>

      <Block eyebrow="week 2" title="Distributed depth">
        <p className="text-ink-dim leading-relaxed mb-2">
          Harder patterns and the distributed-systems core: consensus, multi-region, migration, and an LLM
          inference platform for the AI &amp; Infrastructure org. Second project comes online with its
          correctness-and-rollback story.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`Day  Coding (2h)                      HLD design (90m)                     Leadership / RRK (30m)
---- -------------------------------  ------------------------------------ ----------------------------
D8   topological sort + cycles        config service (Chubby)              disagreement story
D9   heaps + intervals                log-search platform                  influence-without-authority story
D10  union-find + shortest paths      multi-region + failover              project-2 overview
D11  tries + backtracking             zero-downtime migration              project-2 correctness + rollback
D12  DP 1-D                           data-residency alerting              cross-team alignment story
D13  DP sequences + grids             LLM inference platform               mentoring story
D14  timed coding mock + correction   timed design mock (rate limiter)     timed project-deep-dive mock`}
        />
      </Block>

      <Block eyebrow="week 3" title="Simulation">
        <p className="text-ink-dim leading-relaxed mb-2">
          Full-loop simulation under interview conditions, then targeted correction of your weakest coding
          pattern and weakest design area. The last days are retrieval, not new material.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`Day  Coding (2h)                      HLD design (90m)                     Leadership / RRK (30m)
---- -------------------------------  ------------------------------------ ----------------------------
D15  mixed graph / tree, timed        distributed alerting engine          decision-that-was-wrong story
D16  LRU + data-structure design      multi-tenant processing platform     business-vs-tech story
D17  mixed Medium + follow-ups        observability platform               full leadership-story review
D18  full 45m coding sim + review     full 60m design sim                  one project question
D19  correct weakest coding pattern   correct weakest design area          project follow-ups
D20  full coding sim + review         full design sim                      full leadership mock
D21  repeat only failed problems      recreate 3 designs from memory       review stories, metrics, Qs`}
        />
        <Callout kind="tip" title="The Day-18 rule">
          No new topics after Day 18. If you have not learned it by then, you cannot consolidate it in time,
          and half-learned material hurts more than a known gap. The final three days are pure retrieval speed,
          communication, correctness, and confidence, recreating designs from memory and re-solving only the
          problems you previously failed.
        </Callout>
      </Block>

      <Block eyebrow="track it" title="Your 21 days">
        <p className="text-ink-dim leading-relaxed mb-2">
          Check off coding, design, and leadership for each day, count your mocks, and log your errors. It
          persists in your browser, so close the tab and come back to the same board.
        </p>
        <Try label="track your 21 days">
          <PlanTrackerViz />
        </Try>
        <Callout kind="note" title="What the interviewer is listening for">
          The same thing the plan is built for: interview-grade output on demand. Structure every day so it
          ends in a re-solvable problem, a defensible design, or a metric-bearing story, the three things the
          packet is assembled from. A plan that merely moves through topics without producing those is study,
          not preparation.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Only four hours a day, is that enough?</strong> Yes, if it is focused: two hours coding,
            ninety minutes design, thirty minutes leadership, every day, with a graded mock each week. Depth and
            repetition beat marathon days you cannot sustain for three weeks.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What is the Day-18 rule?</strong> No new topics after Day 18. The last three days are pure
            retrieval speed, communication, correctness, and confidence, not fresh material you cannot
            consolidate in time.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Do the Google system names matter?</strong> No. Monarch, Borg, Colossus, Chubby, and
            Dataflow are just realistic prompts to rehearse against. The interviewer scores your reasoning and
            trade-offs, not whether you named an internal system.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "It is a three-week, four-hours-a-day operating system: two hours coding, ninety minutes on one
          high-level-design topic plus an exercise, and thirty minutes of leadership or project-story work,
          every day, with a timed and graded coding-plus-design mock at the end of each week. Week one is
          foundations, week two is distributed depth, week three is full simulation. After Day 18 I add no new
          topics, the final days are retrieval speed, communication, correctness, and confidence."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I run three weeks of four focused hours built backward from the packet. A normal day is a hundred
          and twenty minutes of coding, two problems or one hard problem plus a full review, ninety minutes on
          one design topic and a timed exercise, and thirty minutes of leadership or project-story reps. The
          last day of each week is a mock day, timed coding then a graded review on my ten-point scorecard, a
          timed design round spoken out loud then a graded review, a project or behavioral mock, and twenty
          minutes updating my error log. Week one is foundations, learning the design framework, warming the
          core coding patterns, and choosing two projects with eight stories. Week two goes to distributed
          depth, consensus, multi-region and failover, zero-downtime migration, and an LLM inference platform
          for the AI and Infrastructure org, while the second project comes online with its correctness and
          rollback story. Week three is simulation under interview conditions, then targeted correction of my
          weakest coding pattern and weakest design area. And I hold the Day-18 rule: no new topics after Day
          18, because the final three days are for retrieval speed, communication, correctness, and confidence,
          recreating designs from memory and re-solving only the problems I failed before."
        </Callout>
      </Block>
    </>
  );
}

/* ── What NOT to spend time on ────────────────────────────────── */
function NotDo() {
  return (
    <>
      <Lede>
        A three-week runway is won as much by what you refuse to do as by what you drill. Most generic prep
        advice is built for a loop that does not match Google in 2025-2026, and following it burns days you do
        not have. Here is the waste to cut, and the specific corrections to the advice you will read elsewhere.
      </Lede>

      <Block eyebrow="waste vs work" title="The seven anti-patterns">
        <p className="text-ink-dim leading-relaxed mb-2">
          Each of these feels productive and is not. The "instead" column is where the same hours pay off.
        </p>
        <OpTable
          cols={["Do not spend time on", "Verdict", "", "Do this instead"]}
          rows={[
            { op: "DDIA cover to cover", avg: "skip", avgTone: "bad", why: "Read the 3-4 chapters your weak designs actually need, partitioning, replication, consistency, on demand. Front to back is a month you do not have." },
            { op: "Hundreds of random LeetCode", avg: "skip", avgTone: "bad", why: "Volume is not the signal. About 50 problems you can re-derive by pattern beat 300 you half-remember. Drill the patterns, not the count." },
            { op: "Memorizing GCP product catalogs", avg: "skip", avgTone: "bad", why: "Nobody scores you on naming a managed service. They score the reasoning behind the component; a generic queue or KV store is fine when justified." },
            { op: "Five-database, ten-queue designs", avg: "skip", avgTone: "bad", why: "Sprawl reads as junior. One well-justified datastore and one messaging choice, with the trade-offs named, beat a zoo of logos." },
            { op: "Only success stories", avg: "skip", avgTone: "bad", why: "The behavioral round probes failure, disagreement, and being wrong. Prep the reversal and the conflict story, not just the wins." },
            { op: "Perfecting capacity arithmetic", avg: "skip", avgTone: "bad", why: "Order-of-magnitude, narrated, is the bar. Rounding 86,400 to 100K out loud beats a silent exact figure. Do not drill precision." },
            { op: "AI infra as prompts + vector DBs", avg: "skip", avgTone: "bad", why: "For the AI & Infrastructure org, know serving: batching, KV cache, throughput vs latency, autoscaling GPUs. Prompts and a vector DB are not the system." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-3">
          Where the real reps live: coding patterns in <XLink to="#/interview-bench">Interview Bench</XLink> and{" "}
          <XLink to="#/identifier">The Identifier</XLink>, design choreography in{" "}
          <XLink to="#/whiteboard">Whiteboard</XLink> and the data cases in{" "}
          <XLink to="#/design-room">Design Room</XLink>, LLM serving in{" "}
          <XLink to="#/architect-bench">Architect's Bench</XLink>, and STAR stories in{" "}
          <XLink to="#/architect-role">Architect's Role</XLink>. This track is a lens over those, not a
          replacement for them.
        </p>
      </Block>

      <Block eyebrow="correct the generic advice" title="Five myths that will cost you">
        <p className="text-ink-dim leading-relaxed mb-2">
          The generic "how to pass Google" guides are usually a loop or two out of date. Overwrite these five:
        </p>
        <Callout kind="trap" title="Myth: there is a separate GCA round">
          For SWE there is no standalone GCA round. GCA and RRK are read across your coding and design rounds,
          so you demonstrate cognitive ability by how you decompose and reason in those, not in a dedicated
          session you can prepare as a set piece.
        </Callout>
        <Callout kind="trap" title="Myth: name-drop the six 2024 culture values">
          Do not recite Google's December-2024 culture values in the room. That set is an internal reframe, not
          the interview rubric. Googleyness is scored from how you actually behave, handling disagreement,
          taking pushback, asking for help, not from self-description.
        </Callout>
        <Callout kind="trap" title="Myth: L6 is one design round">
          At L6 it is usually two design rounds at org-level scope, not the single subsystem round of L5.
          Preparing for one design round is how strong candidates get downleveled.
        </Callout>
        <Callout kind="trap" title="Myth: you are performing for the interviewer">
          You impress the packet, not the person across the table. The interviewer writes notes; a committee
          that never met you decides from them. Rapport that does not transcribe into a quotable line is not
          scored.
        </Callout>
        <Callout kind="trap" title="Myth: committee approval is the offer">
          It is not. Team matching is a separate two-to-eight-week phase after approval, and only then is an
          offer built. Plan your timeline and your energy for the gap.
        </Callout>
        <Callout kind="note" title="What the interviewer is listening for">
          Judgment about where effort goes. A candidate who clearly prepared the two org-scope designs and the
          three metric-bearing stories the packet is built from reads as senior. One who memorized a product
          catalog and a values list reads as someone who never understood the loop, and that impression leaks
          into the notes.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Should I read DDIA at all?</strong> Yes, but as a reference, not a syllabus. Pull the
            chapters a specific weak design exposes, partitioning when your sharding is shaky, consistency when
            your replication story wobbles, and read those deeply rather than grinding all twelve.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>If product names do not matter, why rehearse Google-flavored prompts?</strong> Because the
            prompts are realistic shapes to reason against, not names to recite. Designing "telemetry ingestion"
            is practice; saying "Monarch" earns nothing. The reasoning is the score.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Is capacity math worthless then?</strong> No, order-of-magnitude math is essential, it
            sizes your shards and partitions. What is worthless is chasing exact figures; narrate the rounding
            and move on, precision theater wastes the clock.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How much AI-infra depth do I really need?</strong> Enough to design a serving system:
            batching, the KV cache, throughput versus latency trade-offs, and GPU autoscaling. Treating AI as
            just prompts and a vector database is exactly the gap this org will probe.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "The fastest way to waste an L6 runway is the wrong work: DDIA front to back, hundreds of random
          LeetCode, memorizing GCP product names, and sprawling five-database designs. I also correct the stale
          advice: there is no standalone GCA round for SWE, I do not name-drop Google's internal culture values,
          L6 is usually two design rounds not one, the hiring committee and its packet decide rather than the
          interviewer, and an offer is a separate team-matching phase after approval. I spend the time on
          defensible designs, re-solvable problems, and metric-bearing stories instead."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I am deliberate about what I refuse to do, because three weeks is short. I do not read DDIA cover to
          cover, I pull the three or four chapters a weak design exposes. I do not grind hundreds of random
          problems, fifty I can re-derive by pattern beat three hundred I half-remember. I do not memorize GCP
          catalogs, because the score is the reasoning behind a component, not the brand name, and a generic
          queue or KV store is fine when justified. I do not build five-database, ten-queue designs, sprawl
          reads as junior, so one justified datastore and one messaging choice with the trade-offs named is
          stronger. I do not prep only success stories, the behavioral round probes failure and disagreement,
          and I do not chase exact capacity arithmetic, narrated order-of-magnitude is the bar. And I do not
          treat AI infrastructure as prompts and a vector database, I know serving, batching, KV cache,
          throughput versus latency, GPU autoscaling. Then I overwrite the stale guidance: no separate GCA
          round for SWE, GCA and RRK are read across the technical rounds; I never recite the December-2024
          culture values, because Googleyness is scored from behavior; L6 is two org-scope design rounds, not
          one, so I do not get downleveled by preparing for one; I impress the packet, not the interviewer,
          because a committee decides from written notes; and committee approval is not an offer, team matching
          is a separate two-to-eight-week phase. Cutting the waste is what frees the hours for the output that
          actually scores."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ───────────────────────────────────── */
const DECK = [
  {
    q: "What are the stages of the L6 SWE loop, in order?",
    a: "GHA online assessment -> recruiter screen -> one or two 45-minute coding phone screens -> a 4-6 round virtual onsite -> hiring committee -> team matching -> offer. Seven independent gates, each with a different owner.",
    tag: "the pipeline",
  },
  {
    q: "What is the GHA, and does it gate you?",
    a: "A mandatory online assessment of about 50 work-style and values items, no coding. It is a screen-out gate, not a differentiator, so treat it as hygiene and spend no real prep time on it.",
    tag: "stages",
  },
  {
    q: "How many technical phone screens, and in what format?",
    a: "One or two, each about 45 minutes of coding in a shared editor. You must clear them to reach the onsite; they are the same coding bar as the onsite, just earlier.",
    tag: "stages",
  },
  {
    q: "How many onsite rounds, and what is the typical mix?",
    a: "Four to five rounds: about 2-3 coding touchpoints total, two system-design rounds, and one combined Googleyness-and-Leadership behavioral.",
    tag: "the onsite",
  },
  {
    q: "How many system-design rounds at L6, and what is the variance?",
    a: "Typically two, at org-level scope, the biggest L5-to-L6 differentiator. But a real L6 loop was reported as three coding, one design, one behavioral, so prep both a two-design and a coding-heavy configuration.",
    tag: "the onsite",
  },
  {
    q: "What are the two flavors of the design rounds?",
    a: "Usually one product or applied design and one infrastructure or architecture design. Both are pitched at org-level scope, not a single subsystem.",
    tag: "the onsite",
  },
  {
    q: "Is there a standalone GCA round for a Software Engineer?",
    a: "No. GCA and RRK are read ACROSS the coding and design rounds. Only the behavioral round is explicitly attribute-labeled, and it combines Googleyness and Leadership.",
    tag: "attributes",
  },
  {
    q: "What are the four attributes, and which is most weighted?",
    a: "GCA (general cognitive ability, most weighted), RRK (role-related knowledge), Googleyness, and Leadership. For SWE they are read across the rounds rather than each getting its own.",
    tag: "attributes",
  },
  {
    q: "How is Googleyness scored?",
    a: "From your behavior in the room, how you handle disagreement, take pushback, and ask for help, not from how you describe yourself. You cannot self-report your way to it.",
    tag: "attributes",
  },
  {
    q: "What is the behavioral round now?",
    a: "One combined Googleyness-and-Leadership session, about 45 minutes, with 4-6 STAR stories. It is a single round that reads both attributes, not two separate ones.",
    tag: "attributes",
  },
  {
    q: "Who actually decides whether you are hired?",
    a: "A hiring committee of Googlers who never met you, from a written packet of the interviewers' structured notes. The interviewers recommend; the committee decides.",
    tag: "the decision",
  },
  {
    q: "What does 'impress the packet' mean?",
    a: "You are producing quotable written evidence for a committee that was not in the room, not performing for the interviewer. Force signal: state complexity, name trade-offs, and label decisions with 'I'.",
    tag: "the decision",
  },
  {
    q: "Is committee approval the same as an offer?",
    a: "No. Team matching is a separate phase that runs two to eight weeks after approval, where you and a team choose each other. Your approved level travels with you into matching.",
    tag: "the decision",
  },
  {
    q: "How does design scope differ between L5 and L6, and what causes downleveling?",
    a: "L5 is about one subsystem-scope design round; L6 is about two at org-level scope. Telling project-scope stories when the bar wants org-scope impact is the classic cause of downleveling to L5.",
    tag: "leveling",
  },
  {
    q: "What is the coding bar sequence?",
    a: "Clarify -> outline the approach before coding -> correct and readable code -> state invariants and complexity -> optimize -> edge cases -> communicate throughout. It rewards defensible, not clever, code.",
    tag: "coding",
  },
  {
    q: "Does coding still matter at L6, or is it all design?",
    a: "It still matters. Coding underperformance fails an L6 loop regardless of strong design. The two design rounds are the differentiator, but coding is a hard gate, not an afterthought.",
    tag: "coding",
  },
  {
    q: "What is the Day-18 rule?",
    a: "No new topics after Day 18. The final three days are pure retrieval speed, communication, correctness, and confidence, recreating designs from memory and re-solving only problems you previously failed.",
    tag: "the plan",
  },
  {
    q: "What should you measure instead of LeetCode count, and what is the mock target?",
    a: "Measure output: re-solvable problems, defensible designs, unprompted failure modes, and metric-bearing stories. On coding mocks, hit 8/10 on the rubric repeatedly, and any unresolved correctness bug is an automatic fail.",
    tag: "output",
  },
  {
    q: "Should you name-drop Google's December-2024 culture values?",
    a: "No. That set is an internal reframe, not the interview rubric. Googleyness is scored from behavior in the round, so reciting values reads as missing the point.",
    tag: "traps",
  },
  {
    q: "What is the emerging 2026 change to the coding rounds?",
    a: "AI-assisted coding and a separate code-comprehension round, reading, debugging, and optimizing existing code, sometimes with Gemini. Piloted at junior and mid levels in the US, not confirmed universal at L6, so verify with your recruiter and do not rebuild prep around it.",
    tag: "emerging",
  },
];

function Quickfire() {
  return (
    <>
      <Lede>
        Twenty cards spanning the whole tool: the stages, the onsite mix and its variance, the four attributes
        and how they are read, the committee and the packet, team matching, the coding bar, the Day-18 rule,
        output over count, and the traps. Read the prompt, answer out loud in a sentence or two, then reveal
        and grade yourself. Out loud is the rep.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  loop: <Loop />,
  output: <Output />,
  plan: <Plan />,
  notdo: <NotDo />,
  quickfire: <Quickfire />,
};

export default function MissionControl() {
  const [active, setActive] = useState("loop");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="The operating system · YOUR 21 DAYS"
      title="Mission Control"
      subtitle="How the L6 loop really works, what to produce, and the 21-day plan that gets you there, corrected for how Google actually hires in 2025-2026."
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
