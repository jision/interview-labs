import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import RevealSteps from "./sqlgym/RevealSteps.jsx";
import StoryMatrixViz from "./googleyness/StoryMatrixViz.jsx";

const ACCENT = "#A142F4";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "deepdive", label: "The project deep-dive", group: "The deep-dive" },
  { id: "stories", label: "The Staff story matrix", group: "The human round" },
  { id: "googleyness", label: "Googleyness & Leadership", group: "The human round" },
  { id: "hypotheticals", label: "Hypothetical & judgment drills", group: "The human round" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* ── The project deep-dive ────────────────────────────────────── */
const DEEPDIVE_STEPS = [
  { n: 1, name: "Context", say: "One or two sentences: what the project was, the business problem, and why it mattered enough to staff at all.", staff: "Frame the stakes at org or company level, not team level. 'The billing pipeline our whole cloud org depended on' beats 'a service my team owned.'" },
  { n: 2, name: "Scale & constraints", say: "The numbers that made it hard: traffic, data volume, latency and reliability targets, team size, timeline, the hard constraints.", staff: "Quantify. QPS, TB, the SLO, the headcount you influenced. Numbers are what the note-taker can quote back into the packet." },
  { n: 3, name: "Your role", say: "Exactly what you owned versus what the org executed: where you were the decision-maker, the reviewer, the escalation point.", staff: "This is the downlevel gate. Say 'I' for your decisions and interventions, 'we' for the org's delivery, and never blur the two." },
  { n: 4, name: "Architecture", say: "The shape of the system at the altitude the interviewer needs, and where the genuinely interesting complexity lived.", staff: "Draw the boundaries and the seams, not every box. Staff engineers talk in interfaces, failure domains, and blast radius." },
  { n: 5, name: "The 2 to 3 critical decisions", say: "The two or three forks that actually determined the outcome, each with its options and why you chose one.", staff: "Label each with 'I decided' and the trade-off you accepted. Decisions with named trade-offs are the role-related-knowledge signal." },
  { n: 6, name: "Alternatives rejected", say: "For each critical decision, the credible option you did not take, and the specific reason it lost.", staff: "Rejected alternatives prove you saw the whole space. 'We considered X, but its consistency cost broke our SLO' is the quotable line." },
  { n: 7, name: "Failure / near-failure", say: "The thing that went wrong or nearly did, what it cost, and how you responded in the moment.", staff: "Own it in 'I', keep it blameless, and land on the mechanism you added so it could not recur. A no-failure story reads as low-scope." },
  { n: 8, name: "How you aligned teams & leaders", say: "The mechanisms you used to get other teams and your leadership onto the plan without commanding them.", staff: "This is emergent leadership: the design doc, the one-on-ones, the prototype, the escalation. Name the mechanism, not just 'I convinced them.'" },
  { n: 9, name: "Measurable result", say: "The outcome in numbers: what moved, by how much, and how you know it held.", staff: "A metric plus durability. 'Cut p99 by 40% and it held through the next two quarters' beats 'it got much faster.'" },
  { n: 10, name: "Reflection", say: "What you would do differently, and what the experience changed about how you work now.", staff: "Self-correction is a Googleyness signal. A crisp 'here is what I got wrong and how I operate differently now' lifts the whole read." },
];

function DeepDive() {
  return (
    <>
      <Lede>
        The project deep-dive is where your <strong>role-related knowledge</strong> gets read from a real
        system you led, not a toy prompt. It can run as its own segment or be woven into a design or the
        behavioral round, but the test is always the same: depth, ownership, and decision-making at{" "}
        <em>Staff</em> scope. Rehearse it as ten beats you can enter at any point, open short, and let the
        interviewer pull you deeper.
      </Lede>

      <Block eyebrow="orient yourself" title="Where the deep-dive sits in the loop">
        <p className="text-ink-dim leading-relaxed mb-2">
          Before drilling the round, hold the whole loop in your head. The stages are stable; the onsite
          mix is a range, not a fixed count, so prepare for variance rather than a script.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`GHA online assessment  (~50 work-style items, mandatory)
   -> recruiter screen        (~30 min)
   -> 1-2 technical phone screens  (45 min coding)
   -> virtual onsite loop     (4-6 rounds)
   -> hiring committee        (decides from written notes)
   -> team matching           (separate, 2-8 weeks)
   -> offer

onsite mix at L6 (ranges, NOT fixed numbers):
   ~2-3 coding touchpoints total
   ~2 system design: one product/applied, one infra   <- biggest L5-to-L6 gate
   1 combined Googleyness & Leadership  (~45 min, 4-6 STAR)

variance: a real L6 loop ran 3 coding + 1 design + 1 behavioral,
so rehearse BOTH a two-design and a coding-heavy configuration.`}
        />
        <Callout kind="note" title="The committee decides, so impress the packet">
          Your interviewers do not make the call, the hiring committee does, from the written notes they
          compile into a packet. So force quotable signal: state complexity out loud, name trade-offs
          explicitly, and label decisions with "I" so the note-taker can write them down verbatim. And
          committee approval is not an offer, team matching is a separate phase that runs two to eight weeks
          after.
        </Callout>
        <Callout kind="note" title="Emerging in 2026, verify with your recruiter">
          Some loops are piloting AI-assisted coding and a "code comprehension" round, read, debug, and
          optimize existing code, sometimes with Gemini in the room. It has shown up mostly at junior and
          mid levels in the US and is not confirmed universal at L6, so confirm the format with your
          recruiter rather than rebuilding your prep around it.
        </Callout>
      </Block>

      <Block eyebrow="the structure" title="The 10-step deep-dive">
        <p className="text-ink-dim leading-relaxed mb-3">
          Each beat has what to SAY and the STAFF signal it must carry. The middle beats, the critical
          decisions and how you aligned people, are where the round is actually won, so weight your time
          there.
        </p>
        <div className="space-y-3">
          {DEEPDIVE_STEPS.map((s) => (
            <div key={s.n} className="rounded-lg border border-line bg-surface-2 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[12px] font-semibold text-ink">
                  {s.n}. {s.name}
                </span>
              </div>
              <div className="space-y-1.5 text-[13px] leading-relaxed">
                <p className="text-ink-dim">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>say</span>
                  {s.say}
                </p>
                <p className="text-ink-faint">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2 text-ink-faint">staff</span>
                  {s.staff}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Callout kind="note" title="What the interviewer is listening for">
          Ownership and decision quality at scope. Can they trace which decisions were <em>yours</em>, did
          each one carry a named trade-off and a rejected alternative, and did the impact cross team
          boundaries? A narrated tour of an impressive system with no visible personal decisions reads as a
          participant, not a leader.
        </Callout>
      </Block>

      <Block eyebrow="control the clock" title="The 2-minute, 10-minute, and 30-minute versions">
        <p className="text-ink-dim leading-relaxed mb-2">
          The same project has to compress and expand on demand. Rehearse three depths of the one story so
          you can open short and grow it exactly as far as the interviewer wants.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`2-min   beats 1-3 + 9: context, scale, your role, the result.
        the elevator version. open with this, then let them pull.

10-min  add 4, 5, 8: architecture, the critical decisions, and
        how you aligned people. the default deep-dive length.

30-min  the full ten beats, with 6 (alternatives) and 7 (failure)
        expanded, and a live back-and-forth on the decisions.

one story, three depths. never dump the 30-min version unprompted;
depth on demand reads as senior, a firehose reads as junior.`}
        />
        <Callout kind="tip" title="Open short, then follow the pulls">
          Lead with the two-minute version and stop. The interviewer's follow-ups tell you exactly where the
          depth belongs, and answering a pull is collaboration; pre-emptively narrating for ten minutes is a
          monologue. The ten beats are a checklist you can jump into at any point, not a script you must run
          start to finish.
        </Callout>
      </Block>

      <Block eyebrow="the downlevel gate" title="Staff scope, and the I-versus-we line">
        <p className="text-ink-dim leading-relaxed mb-2">
          At L6 the read is org-level impact. The same project told at team scope gets leveled at L5, no
          matter how clean the telling. So choose the project where your decisions had the widest blast
          radius, and scope the telling to the parts that crossed team boundaries: the alignment you drove,
          the standard you set, the decision other teams inherited.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          The grammar that protects your scope is disciplined pronouns. <strong>"I"</strong> for the
          decisions, judgments, and interventions that were yours; <strong>"we"</strong> for the org's
          execution. Blur them and the interviewer cannot separate what you drove from what merely happened
          around you, so they credit you with less. Precise "I" at real scope is the entire Staff signal.
        </p>
        <Callout kind="trap" title="Project scope gets you leveled at L5">
          The most common L6 miss is a technically excellent story that never leaves one team. If every
          decision, every stakeholder, and every metric lives inside your immediate team, the committee
          reads L5. Before you tell a story, ask: who outside my team did this move, and did I name how I
          moved them?
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>What if my most impactful project was really a team effort?</strong> Pick it anyway, but
            scope the telling to the slice you drove and the decisions that crossed team lines, and credit
            the rest to the team in "we". A precise slice at real scope beats an inflated claim that
            collapses on the first follow-up.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>They keep interrupting my structured story, am I losing?</strong> No, pulls are
            engagement. Answer the pull on that specific beat, then return to the thread. The ten beats are a
            checklist you can re-enter anywhere, so an interruption never derails you, it just tells you
            where the depth belongs.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How much architecture detail is too much?</strong> Match the interviewer and offer a
            menu: "I can go deep on the consistency model or the rollout, which is more useful?" Depth on
            demand reads senior; an unprompted firehose of internals reads as someone who cannot pick the
            altitude.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What if I was not the most senior engineer on it?</strong> Be exact about the decisions
            you owned and the influence you had upward and sideways, and credit the seniors in "we". Owning a
            clear, real slice is stronger than implying you ran the whole thing, overclaiming is caught fast
            and it sinks the trust read.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I run the deep-dive as ten beats: context and stakes at org level, the scale and constraints in
          numbers, exactly what I owned versus what we delivered, the architecture at the right altitude, the
          two or three critical decisions with their rejected alternatives, the failure and the mechanism I
          added, how I aligned other teams and leadership, the measurable result, and a reflection. I open
          with the two-minute version and let the interviewer pull me deeper, and I keep 'I' for my decisions
          and 'we' for the org's execution so the scope reads at Staff, not team."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The deep-dive is where they read role-related knowledge from a real system, so I rehearse a
          project with genuine org-level blast radius. I open with context and stakes in a sentence or two,
          then the scale and the hard constraints in actual numbers, because numbers are what the note-taker
          can quote into the packet. Then the downlevel gate: exactly what I owned, in 'I', versus what the
          org executed, in 'we'. I sketch the architecture at the altitude the interviewer needs, boundaries
          and failure domains, not every box, and I center the story on the two or three decisions that
          actually determined the outcome, each labeled 'I decided' with the trade-off I accepted and the
          credible alternative I rejected and why. I include a real failure or near-failure, owned and
          blameless, landing on the mechanism I added so it could not recur, and I spend real time on how I
          aligned other teams and leadership without commanding them, the design doc, the one-on-ones, the
          prototype, the escalation, because that is the emergent-leadership signal. I close on a measurable
          result that held and a reflection on what I would do differently. And I open at two minutes and
          follow the interviewer's pulls rather than dumping the whole thing, because depth on demand is the
          senior tell."
        </Callout>
      </Block>
    </>
  );
}

/* ── The Staff story matrix ───────────────────────────────────── */
const STORY_TYPES = [
  { slot: "Ambiguous problem, no owner", signal: "Bias to action, scoping under uncertainty", bar: "You defined the problem and mobilized people before it was assigned. Show the framing move, not just the fix." },
  { slot: "Cross-team architectural alignment", signal: "Emergent leadership across boundaries", bar: "Competing designs across teams, converged without authority. Name the mechanism: the doc, the review, the prototype." },
  { slot: "Strong technical disagreement", signal: "Intellectual humility plus backbone", bar: "A real disagreement argued on merits, where you changed your mind on data or disagreed-and-committed." },
  { slot: "Production failure", signal: "Ownership, blameless operation", bar: "You owned the incident, drove the mitigation, and installed the mechanism that stopped a recurrence." },
  { slot: "A decision that proved wrong", signal: "Self-correction over ego", bar: "You called it, it was wrong, you reversed it visibly and cheaply. The lesson is the point." },
  { slot: "Influence without authority", signal: "The core Staff signal", bar: "You moved a decision across people you did not command, through credibility, data, and coalition." },
  { slot: "Mentoring / raising the bar", signal: "Scaling yourself through others", bar: "You made other engineers better or raised a team's standard, and it outlasted you. Show the second-order impact." },
  { slot: "Business-vs-technical trade-off", signal: "Judgment beyond the code", bar: "You weighed engineering purity against a business reality, chose deliberately, and named what you traded." },
];

function Stories() {
  return (
    <>
      <Lede>
        You cannot pre-write an answer for every behavioral prompt, but you can bank eight stories that
        cover the space the Staff rubric probes. The matrix maps each story to the signal it demonstrates,
        so in the room you pick the one whose signal fits what they actually asked. Build it once, rehearse
        it, and no prompt catches you empty-handed.
      </Lede>

      <Block eyebrow="the eight stories" title="Each slot maps to a signal">
        <p className="text-ink-dim leading-relaxed mb-3">
          These eight cover the range a Staff behavioral round tests. For each, bank one real story with a
          number in it. The signal is what the interviewer is actually scoring; the bar is what makes the
          story land at L6 rather than L5.
        </p>
        <div className="space-y-2.5">
          {STORY_TYPES.map((s) => (
            <div key={s.slot} className="rounded-lg border border-line bg-surface-2 p-3.5">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-[12px] font-semibold text-ink">{s.slot}</span>
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ color: ACCENT, borderColor: ACCENT }}
                >
                  {s.signal}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-ink-dim">{s.bar}</p>
            </div>
          ))}
        </div>
        <Callout kind="note" title="What the interviewer is listening for">
          Range and specificity: that you have a real, metric-bearing story for each kind of signal, and
          that you pick the one that fits the question instead of forcing a favorite anecdote. A candidate
          who can only tell one kind of story reads as narrow, whatever the level.
        </Callout>
      </Block>

      <Block eyebrow="the bar" title="The Staff answer standard">
        <p className="text-ink-dim leading-relaxed mb-2">
          A behavioral answer clears the Staff bar only when it has all seven of these. Missing any one is
          the difference between an L6 read and an L5 one:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`1. scope across teams          (not contained to one team)
2. a real disagreement or hard constraint  (not a smooth story)
3. YOUR decision-making, visible           ("I decided X because Y")
4. the mechanisms you used to influence    (doc, prototype, 1:1s, escalation)
5. business AND technical trade-offs       (both named, out loud)
6. a measurable result                     (a number that held)
7. a learning or self-correction           (what you would do differently)`}
        />
        <Callout kind="trap" title="'We' everywhere, and naming traits instead of showing them">
          Two failure modes sink strong candidates. First, "we" for everything, so the interviewer cannot
          tell what you drove; use "I" for your decisions and "we" only for the org's execution. Second,
          naming the trait instead of demonstrating it: "I'm a strong collaborator" scores nothing, a story
          where you brought a resistant peer along and credited them by name scores the collaboration.
          Demonstrate, do not name.
        </Callout>
      </Block>

      <Block eyebrow="build yours" title="The story matrix planner">
        <p className="text-ink-dim leading-relaxed mb-2">
          Fill each slot with one real experience, then check it off only when it has a metric, a decision
          you owned, and a reflection, the three things that most often go missing. The bar fills as your
          matrix gets interview-ready. This reuses the STAR mechanics drilled in{" "}
          <a href="#/behavioral-bench" className="font-mono text-xs" style={{ color: ACCENT }}>Behavioral Bench</a>{" "}
          and the "Influence, comms & STAR" topic in{" "}
          <a href="#/architect-role" className="font-mono text-xs" style={{ color: ACCENT }}>Architect's Role & Decisions</a>.
        </p>
        <Try label="build your story matrix">
          <StoryMatrixViz />
        </Try>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>What if one story fits several prompts?</strong> Good, that is the point of banking
            flexible stories rather than one per question. Angle the same experience to the signal being
            asked: one cross-team project can demonstrate influence, alignment, or a trade-off depending on
            which beat you lead with.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>They ask for a second example of the same thing. Now what?</strong> This is why you bank
            eight, not four. Keep a backup for the high-frequency signals, influence, disagreement, failure,
            so "tell me about another time" does not empty the tank. Depth on one plus a credible second is
            the Staff read.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>My best stories are a few years old. Does that hurt?</strong> Recency helps but scope
            matters more. A three-year-old story with genuine org-level impact beats a recent team-scoped
            one. Where you can, refresh with a current example that shows the same signal at your present
            level.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do I avoid sounding rehearsed?</strong> Rehearse the structure and the numbers, not
            a script. Know the seven beats and the metric cold, then speak them fresh. The tell of
            over-rehearsal is a story that cannot survive an interruption; a well-structured one welcomes the
            pull.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I keep eight stories banked, one per signal the Staff rubric probes: an ambiguous problem with no
          owner, cross-team alignment, a strong technical disagreement, a production failure, a decision I
          got wrong, influence without authority, mentoring, and a business-versus-technical trade-off. Each
          has a number in it. In the room I pick the one whose signal fits the question, tell it in 'I' for
          my decisions and 'we' for the team's execution, and make sure it carries a real trade-off, a
          measurable result, and a reflection."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "My behavioral prep is a matrix, not a pile of anecdotes. I map the eight story types the Staff
          rubric tends to probe, the no-owner problem, cross-team architectural alignment, strong technical
          disagreement, production failure, a decision that proved wrong, influence without authority,
          mentoring and raising the bar, and a business-versus-technical trade-off, and I bank one real,
          metric-bearing story for each, plus a backup for the high-frequency ones. Every story is built to
          the same standard: it has to cross team boundaries, contain a real disagreement or hard
          constraint, show my decision-making explicitly in 'I', name the mechanisms I used to influence, the
          doc, the prototype, the one-on-ones, the escalation, weigh both a business and a technical
          trade-off, end on a number that held, and close with a self-correction. In the room I do not force
          a favorite anecdote; I pick the story whose signal matches what they asked, and I demonstrate the
          trait through how I behaved rather than naming it. That is what reads as L6 instead of L5, precise
          scope, precise pronouns, and a real lesson."
        </Callout>
      </Block>
    </>
  );
}

/* ── Googleyness & Leadership ─────────────────────────────────── */
function GoogleynessTopic() {
  return (
    <>
      <Lede>
        The onsite has one attribute-labeled round, and it now <strong>combines Googleyness and
        Leadership</strong>: roughly 45 minutes, about four to six STAR stories. "Leadership" here means{" "}
        <em>emergent</em> leadership, influence without authority, and Googleyness is not something you
        assert, it is inferred from how you behave in the round. The rubric is behavioral, so the whole game
        is to demonstrate, not describe.
      </Lede>

      <Block eyebrow="the real rubric" title="Googleyness is read from behavior">
        <p className="text-ink-dim leading-relaxed mb-2">
          The interviewer infers Googleyness from how you carry the conversation and the stories in it, not
          from adjectives you apply to yourself. These are the behaviors being read, and what each one
          actually sounds like in the room:
        </p>
        <OpTable
          cols={["Attribute", "Reads as", "", "In the round it sounds like"]}
          rows={[
            { op: "Intellectual humility", avg: "you can be wrong", avgTone: "good", why: "'I changed my mind once the benchmark disagreed with me.' Comfortably owning what you got wrong, not defending every past call." },
            { op: "Comfort with ambiguity", avg: "you act without a spec", avgTone: "good", why: "A story that starts from an undefined problem and shows you framing it, rather than waiting to be handed requirements." },
            { op: "Bias to action", avg: "you make progress", avgTone: "good", why: "You shipped a prototype to settle a debate instead of arguing longer. Movement over perfect certainty." },
            { op: "Collaboration", avg: "you include and credit", avgTone: "good", why: "'We' for the team's delivery, specific credit to named people, and how you brought a resistant peer along." },
            { op: "User-first", avg: "you anchor on impact", avgTone: "good", why: "Decisions justified by user or customer impact, not by technical elegance for its own sake." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          How you actually behave, not how polished your self-description is. Do you concede a good point,
          ask a clarifying question, credit your team, and stay collaborative under pushback? Those moments,
          inside your stories and in the live back-and-forth, are the Googleyness score.
        </Callout>
      </Block>

      <Block eyebrow="demonstrate, don't name" title="Show the trait, never claim it">
        <p className="text-ink-dim leading-relaxed mb-2">
          Because the score is behavioral, self-labeling is worthless at best and a negative signal at
          worst. "I'm humble and collaborative and I have great judgment" gives the interviewer nothing to
          score and reads as coached. The move is to build the behavior into the story so the interviewer
          reaches the conclusion themselves.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`naming (scores nothing):
   "I'm very collaborative and I always put the user first."

demonstrating (scores the trait):
   "The other team was blocking us, so I sat with their lead,
    reframed my proposal around their on-call load, and folded
    their two objections into the design. We shipped one service
    instead of two."   -> collaboration + user-first, shown

the interviewer should be able to WRITE DOWN the behavior,
not just your adjective for it.`}
        />
        <Callout kind="trap" title="How you handle the round is itself scored">
          Googleyness leaks from the meta-level: whether you get defensive when the interviewer pushes back,
          whether you say "I don't know, here is how I'd find out", whether you credit others unprompted. You
          are being read the entire time, not only when telling the story. Handle disagreement in the room
          the way your best stories say you handle it.
        </Callout>
      </Block>

      <Block eyebrow="two corrections" title="What not to do, and what people get wrong">
        <Callout kind="trap" title="The six-values trap">
          Google published six culture values in December 2024, but that is an internal leadership reframe,
          not the interview rubric, and reciting them at yourself reads as coached while missing the point
          that Googleyness is scored from behavior. Treat the values as background, demonstrate the behavior
          in your stories, and if you are unsure of the current format, confirm the behavioral rubric with
          your recruiter rather than building your answers around a values list.
        </Callout>
        <Callout kind="note" title="GCA is not a separate SWE round">
          There is no standalone General Cognitive Ability interview for SWE. GCA, structured
          problem-solving and how you reason, is read across your coding and design rounds, and role-related
          knowledge is read there too. The behavioral round is the only one labeled by attribute, and it is
          the combined Googleyness and Leadership round. So do not prepare a separate "GCA round", prepare to
          reason out loud everywhere.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How is "emergent leadership" different from managing?</strong> It is influence without a
            reporting line: you move decisions and people through credibility, data, and coalition rather
            than authority. At Staff you are rarely the manager of the teams you need, so the round tests
            whether you can lead sideways and upward, not whether you can direct reports.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What if I genuinely disagree with the interviewer mid-round?</strong> Disagree well, that
            is a positive signal. Engage the point on its merits, concede what is right, hold your ground
            with reasons where you still differ, and stay warm. Demonstrating disagree-and-commit live is
            worth more than a story about it.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Can strong technical rounds carry a weak behavioral one?</strong> Not reliably at L6. The
            attributes are read together by the committee, and a poor Googleyness or Leadership read can sink
            an otherwise strong packet. It is a real bar, not a formality, so it gets real rehearsal.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Is "user-first" relevant for an infrastructure engineer?</strong> Yes, the user is just
            whoever consumes your system, the internal teams on your platform, the on-call engineers, the
            downstream services. Anchoring decisions on their experience rather than on elegance is the same
            signal, one altitude down.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "The behavioral round combines Googleyness and Leadership, about 45 minutes and four to six STAR
          stories, and Leadership means emergent leadership, influence without authority. Googleyness is
          scored from how I behave, intellectual humility, comfort with ambiguity, bias to action,
          collaboration, user-first, so I demonstrate those in the stories rather than claiming them. I don't
          recite the 2024 culture values, that is an internal reframe not the rubric, and I know GCA is read
          across my coding and design rounds, not in a separate interview."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I treat the behavioral round as the one attribute-labeled interview in the loop, and it now reads
          both Googleyness and Leadership in roughly 45 minutes across four to six stories. Leadership here
          is emergent, influence without authority, because at Staff I rarely command the teams I need, so I
          come with stories where I moved decisions through credibility, data, and coalition. Googleyness I
          treat as strictly behavioral: the interviewer infers intellectual humility, comfort with
          ambiguity, bias to action, collaboration, and a user-first instinct from how I act, so I build
          those into the stories, owning what I got wrong, framing an ambiguous problem, shipping a prototype
          to settle a debate, crediting people by name, and I let the interviewer draw the conclusion instead
          of labeling myself. I am also careful about how I behave in the room itself, conceding good points,
          saying when I don't know and how I'd find out, disagreeing warmly, because that meta-level is
          scored too. And I avoid two traps: I don't recite Google's December 2024 six culture values, which
          are an internal reframe rather than the interview rubric, and I don't prep a standalone GCA round,
          because for SWE cognitive ability and role-related knowledge are read across the coding and design
          rounds, not in a separate interview."
        </Callout>
      </Block>
    </>
  );
}

/* ── Hypothetical & judgment drills ───────────────────────────── */
const HYPO_STEPS = [
  {
    label: "clarify the assumptions",
    body: (
      <>
        Pin the constraints out loud before answering. Who consumes this API, what are the latency and
        compatibility needs, is either team already committed, what is the deadline? "I'll assume both are
        internal services and we own both ends, correct me if not." Stated assumptions score; silent guessing
        does not.
      </>
    ),
  },
  {
    label: "lay out the options",
    body: (
      <>
        Name the credible choices without judging yet: standardize on one protocol, support both behind a
        gateway that translates, or let each team keep its own with a versioned contract at the seam. Three
        real options, each with a one-line character, shows you see the whole space.
      </>
    ),
  },
  {
    label: "state the decision criteria",
    body: (
      <>
        Say what you will decide <em>on</em> before you decide: total cost of ownership, the consumers' real
        needs, reversibility, and team velocity, not your personal taste. Naming the criteria first is what
        separates judgment from opinion.
      </>
    ),
  },
  {
    label: "recommend, commit to one",
    body: (
      <>
        Then commit, do not fence-sit. "I'd standardize on one, gRPC if the performance need is real, REST if
        reach and simplicity win." A clear recommendation beats a balanced non-answer.
      </>
    ),
  },
  {
    label: "name the trade-off, de-risk",
    body: (
      <>
        Own the cost and reduce the risk. "The trade-off: the other team eats a migration. To de-risk, I'd
        prototype the contract, run both behind the gateway for one release, and keep a rollback." An owned
        trade-off with a de-risking plan is the judgment signal.
      </>
    ),
  },
];

function Hypotheticals() {
  return (
    <>
      <Lede>
        A hypothetical ("what if two teams block on your API design?") is not testing whether you know the
        one right answer, there usually isn't one. It tests judgment under ambiguity: whether you clarify
        before you commit, reason from criteria, and own a recommendation with its trade-off. The structure
        is the signal, and it is the same every time.
      </Lede>

      <Block eyebrow="the structure" title="Five moves, every time">
        <p className="text-ink-dim leading-relaxed mb-2">
          Whatever the scenario, run the same five moves. It keeps you from blurting an answer that assumes
          facts you were never given, and it makes your judgment legible:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`1. clarify assumptions      surface the constraints you weren't given
2. lay out options          2-3 credible paths, no judgment yet
3. state decision criteria  what you'll decide ON (TCO, users, reversibility)
4. recommend                commit to one, don't fence-sit
5. name trade-off + de-risk own the cost, say how you'd reduce the risk

skipping straight to 4 is the junior move. the score is in
1 through 3: the reasoning, not the verdict.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Judgment under ambiguity: do you gather the missing constraints, reason from explicit criteria, and
          then actually commit to a recommendation while naming its cost? A confident answer with no
          clarifying and no trade-off reads as reckless; endless options with no recommendation reads as
          indecisive. They want both structure and a decision.
        </Callout>
      </Block>

      <Block eyebrow="worked example" title="Two teams block on your API design">
        <p className="text-ink-dim leading-relaxed mb-2">
          The scenario: you own a shared API contract, one team wants gRPC for performance, another wants
          REST for reach, and both are blocking on your decision. Say your answer out loud first, then reveal
          each move and compare.
        </p>
        <Try label="work the hypothetical">
          <RevealSteps accent={ACCENT} steps={HYPO_STEPS} />
        </Try>
      </Block>

      <Block eyebrow="two more drills" title="Run the same five moves">
        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-surface-2 p-3.5">
            <div className="font-mono text-[12px] font-semibold text-ink mb-1.5">
              A senior engineer refuses to adopt the standard you set
            </div>
            <p className="text-[13px] leading-relaxed text-ink-dim">
              Clarify the objection first, it is often a real risk you have not weighed. Options: adapt the
              standard, grant a scoped exception, or hold the line. Criteria: the cost of divergence versus
              the merit of their concern. Recommend the smallest experiment that resolves it with data; if the
              disagreement survives that, escalate transparently rather than steamroll, and disagree-and-commit
              whichever way it lands. The trade-off you name: some short-term friction to keep the standard
              credible.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface-2 p-3.5">
            <div className="font-mono text-[12px] font-semibold text-ink mb-1.5">
              You inherit a project a quarter behind, with a demoralized team
            </div>
            <p className="text-[13px] leading-relaxed text-ink-dim">
              Clarify the real constraint, is it scope, people, or a dependency? Options: cut scope to a
              credible milestone, add or reallocate people, or renegotiate the date. Criteria: what the
              business actually needs by when, and what the team can sustainably deliver. Recommend cutting
              scope to one visible win soon, then rebuild trust with an honest revised date. The trade-off you
              name: you ship less now to ship something real and restore momentum.
            </p>
          </div>
        </div>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>What if the interviewer keeps adding constraints?</strong> That is the actual test, they
            are pressure-testing whether your recommendation is reasoned or memorized. Absorb each new
            constraint out loud, localize which move it changes, and adjust just that, usually the
            recommendation or the de-risking, without throwing out the structure.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Is it OK to say "it depends"?</strong> Only if you immediately say what it depends on and
            then decide. "It depends" as a full stop is a non-answer; "it depends on whether the perf need is
            real, and assuming it is, I'd choose gRPC" is judgment. Always land on a recommendation.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What if I genuinely don't know the domain in the hypothetical?</strong> Say so and reason
            anyway from the constraints and criteria, that is exactly what they want to watch. "I haven't run
            this specific system, but the deciding factors are these, so here is how I'd choose" is stronger
            than bluffing domain facts.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How is this different from a system-design round?</strong> A hypothetical is usually about
            people and judgment, not just architecture, blocked teams, a resistant peer, a slipping deadline.
            The five moves are the same, but the criteria lean toward incentives, trust, and reversibility as
            much as latency and cost.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "For a hypothetical I never jump to the verdict. I clarify the assumptions I wasn't given, lay out
          two or three credible options, state the criteria I'll decide on, total cost of ownership, consumer
          needs, reversibility, then commit to a recommendation, name the trade-off it carries, and say how
          I'd de-risk it with a prototype, a parallel run, and a rollback. The score is in the reasoning, not
          the answer, so I make the structure visible and still land on a decision."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I treat a hypothetical as a judgment test, not a trivia question, because there usually isn't one
          right answer. Take 'two teams block on your API design, one wants gRPC, one wants REST.' First I
          clarify the assumptions I was never handed: who consumes the API, the real latency and
          compatibility needs, whether either team is already committed, the deadline, and I state them out
          loud so a wrong assumption gets corrected early. Then I lay out the credible options without judging
          yet, standardize on one, support both behind a translating gateway, or let each keep its own behind
          a versioned contract. Next I say what I'll decide on before deciding, total cost of ownership, the
          consumers' actual needs, reversibility, and team velocity, because naming criteria is what turns
          opinion into judgment. Then I commit: I'd standardize on one, gRPC if the performance need is real
          and REST if reach and simplicity win, and I name the cost honestly, the other team eats a migration.
          Finally I de-risk, prototype the contract, run both behind the gateway for a release, keep a
          rollback, so being wrong is cheap. The same five moves work for a resistant senior engineer or a
          project that's a quarter behind; only the criteria shift toward incentives and trust. What they are
          scoring is the first three moves, the reasoning, and that I still own a decision at the end."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ───────────────────────────────────── */
const DECK = [
  {
    q: "Name the eight stories in the Staff story matrix.",
    a: "Ambiguous problem with no owner; cross-team architectural alignment; strong technical disagreement; production failure; a decision that proved wrong; influence without authority; mentoring / raising the bar; business-vs-technical trade-off. Bank one real, metric-bearing story for each.",
    tag: "the matrix",
  },
  {
    q: "What does 'Staff scope or you get downleveled' mean for your stories?",
    a: "L6 wants org-level impact: decisions and influence that crossed team boundaries. A story scoped to one team, however well told, reads as L5. Pick the projects where your blast radius was widest and lead with the cross-team parts.",
    tag: "scope",
  },
  {
    q: "Why does 'I' vs 'we' decide your level?",
    a: "Use 'I' for your decisions, interventions, and judgment; 'we' for the org's execution. Blur them and the interviewer cannot tell what you actually drove, so they assume less, which downlevels you. Precise 'I' at real scope is the Staff signal.",
    tag: "I vs we",
  },
  {
    q: "What is 'demonstrate, don't name'?",
    a: "You show a trait through how you behave in the story and the room, not by claiming it. 'I'm collaborative' scores nothing; a story where you brought a resistant peer along, credited by name, scores the collaboration. Behavior is the evidence.",
    tag: "demonstrate",
  },
  {
    q: "How is Googleyness actually scored?",
    a: "From your behavior in the round, not your self-description: how you handle disagreement and pushback, whether you ask for help, whether you credit others, whether you anchor on the user. Intellectual humility, comfort with ambiguity, bias to action, collaboration, and user-first, all read from how you act.",
    tag: "googleyness",
  },
  {
    q: "What is the Googleyness & Leadership round now?",
    a: "A single combined behavioral round, roughly 45 minutes, about four to six STAR stories, that reads both Googleyness and Leadership (emergent leadership = influence without authority). It is the only attribute-labeled round in the SWE loop.",
    tag: "combined round",
  },
  {
    q: "Should you name-drop Google's 2024 six culture values?",
    a: "No. Those are an internal leadership reframe, not the interview rubric, and reciting them reads as coached. Googleyness is scored behaviorally. Treat the values as background, demonstrate the behavior, and confirm the current rubric with your recruiter if unsure.",
    tag: "six-values trap",
  },
  {
    q: "Is there a standalone GCA round for SWE?",
    a: "No. For SWE, General Cognitive Ability is read across your coding and design rounds, not in a dedicated interview. Only the behavioral round is attribute-labeled, and it combines Googleyness and Leadership. Role-related knowledge is read across the technical rounds too.",
    tag: "GCA",
  },
  {
    q: "How do you answer a hypothetical ('two teams block on your API')?",
    a: "Clarify the assumptions out loud, lay out two or three credible options, state the criteria you'll decide on (TCO, consumer needs, reversibility), then recommend one, name the trade-off it carries, and say how you'd de-risk it (prototype, parallel run, rollback). The structure is the signal.",
    tag: "hypothetical",
  },
  {
    q: "Story: ambiguous problem, no owner. What is the signal?",
    a: "Bias to action and scoping under uncertainty. The bar is that you defined the problem and mobilized people before it was assigned to you. Show the framing move, not just the eventual fix.",
    tag: "story",
  },
  {
    q: "Story: strong technical disagreement. What is the signal?",
    a: "Intellectual humility plus backbone. A real disagreement argued on merits where you either changed your mind on data or disagreed-and-committed. Not a story where you were simply right and everyone agreed.",
    tag: "story",
  },
  {
    q: "Story: a decision that proved wrong. What is the signal?",
    a: "Self-correction over ego. You made the call, it was wrong, and you reversed it visibly and cheaply. The learning is the whole point; a wrong-decision story with no lesson is just a loss.",
    tag: "story",
  },
  {
    q: "Story: influence without authority. What is the signal?",
    a: "The core Staff signal: moving a decision across people you don't command, through credibility, data, and coalition-building, not the org chart. Name the mechanism (a doc, a prototype, one-on-ones, an escalation), not just 'I convinced them.'",
    tag: "story",
  },
  {
    q: "Story: production failure. What is the signal?",
    a: "Ownership and blameless operation. You owned the incident, drove the mitigation, and installed the mechanism that stopped a recurrence. Own your part in 'I', keep it blameless, land on the systemic fix.",
    tag: "story",
  },
  {
    q: "Story: business-vs-technical trade-off. What is the signal?",
    a: "Judgment beyond the code. You weighed engineering purity against a business reality, chose deliberately, and named exactly what you traded and why. Shows you optimize for outcomes, not elegance.",
    tag: "story",
  },
  {
    q: "What is the 10-step project deep-dive?",
    a: "Context, scale and constraints, YOUR role, architecture, the 2 to 3 critical decisions, alternatives rejected, failure or near-failure, how you aligned teams and leaders, measurable result, reflection. Open at the 2-minute version and let the interviewer pull you deeper.",
    tag: "deep-dive",
  },
  {
    q: "Who decides the hire, and how do you 'impress the packet'?",
    a: "The hiring committee decides, not your interviewers, from the written notes they compile into a packet. So force quotable signal: state complexity out loud, name trade-offs explicitly, and label your decisions with 'I' so the note-taker can write them down verbatim.",
    tag: "hiring committee",
  },
  {
    q: "What is the shape of the L6 loop, and does committee approval mean an offer?",
    a: "GHA online assessment, recruiter screen, 1 to 2 coding phone screens, a 4 to 6 round virtual onsite (about 2 to 3 coding touchpoints, 2 system design, 1 combined behavioral), then hiring committee, then team matching. Committee approval is not an offer: team matching is a separate 2 to 8 week phase.",
    tag: "the loop",
  },
];

function Quickfire() {
  return (
    <>
      <Lede>
        Eighteen cards across the whole tool, the eight Staff stories and their signals, staff scope,
        I-versus-we, demonstrate-don't-name, how Googleyness is really scored, the combined round, the two
        corrections, the hypothetical structure, and the loop shape. Read the prompt, answer out loud in a
        sentence or two, then reveal and grade yourself. Out loud is the rep.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  deepdive: <DeepDive />,
  stories: <Stories />,
  googleyness: <GoogleynessTopic />,
  hypotheticals: <Hypotheticals />,
  quickfire: <Quickfire />,
};

export default function Googleyness() {
  const [active, setActive] = useState("deepdive");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="The human rounds · WHO YOU ARE"
      title="Googleyness & Deep Dives"
      subtitle="The project deep-dive and the Googleyness & Leadership round, at Staff scope, with the story matrix that keeps you from getting downleveled."
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
