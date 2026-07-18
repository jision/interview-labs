import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import RetryAmplificationViz from "./srecanon/RetryAmplificationViz.jsx";

const ACCENT = "#F9AB00";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "slo", label: "SLOs, SLIs & error budgets", group: "Targets" },
  { id: "overload", label: "Handling overload", group: "Overload & failure" },
  { id: "cascading", label: "Cascading failures", group: "Overload & failure" },
  { id: "consensus", label: "Managing critical state", group: "State & data" },
  { id: "integrity", label: "Data integrity", group: "State & data" },
  { id: "lb", label: "Load balancing", group: "State & data" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* ── SLOs, SLIs & error budgets ───────────────────────────────── */
function Slo() {
  return (
    <>
      <Lede>
        SRE turns reliability from a feeling into an engineering discipline by measuring it. An{" "}
        <strong>SLI</strong> is the measurement, an <strong>SLO</strong> is the target you hold yourself to,
        and an <strong>SLA</strong> is the contract that costs money when you miss it. The one idea that
        actually changes how a team behaves is the <strong>error budget</strong>, one minus the SLO, which
        turns "be reliable" into a currency you get to spend.
      </Lede>

      <Block eyebrow="the three terms" title="SLI, SLO, SLA, in order of who they are for">
        <OpTable
          cols={["Term", "Is", "", "Who it is for"]}
          rows={[
            { op: "SLI (indicator)", avg: "a measurement", avgTone: "good", why: "A ratio of good events to total: successful requests / all requests, or fast-enough requests / all. The raw signal, straight from monitoring." },
            { op: "SLO (objective)", avg: "an internal target", avgTone: "ok", why: "The line the SLI must stay above, e.g. 99.9% of requests succeed over 28 days. Engineering sets it; it defines the error budget." },
            { op: "SLA (agreement)", avg: "an external contract", avgTone: "bad", why: "A customer promise with teeth: credits or refunds if breached. Always set looser than the SLO so you breach the objective first and get warning." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you keep the three distinct, get the direction right (SLA loosest, SLO tighter, SLI is what
          you measure), and treat reliability as a budget to spend rather than an absolute. The Google-level
          signal is naming the error-budget policy and knowing why 100% is the wrong target.
        </Callout>
        <Callout kind="tip" title="The general version lives next door">
          For the vendor-neutral treatment of these terms and the nines table, open the{" "}
          <a href="#/architect-role" className="font-mono text-xs" style={{ color: ACCENT }}>Architect&apos;s Role</a>{" "}
          tool at the "SLA / SLO / SLI &amp; error budgets" topic. This sheet is the Google SRE depth on top.
        </Callout>
      </Block>

      <Block eyebrow="a forcing function" title="Keep SLOs few, on purpose">
        <p className="text-ink-dim leading-relaxed mb-2">
          The SRE instinct is to have <strong>as few SLOs as possible</strong>, and that scarcity is a
          feature. Every SLO you publish is a promise someone will hold you to and a slice of your error
          budget, so a small set forces the team to name what users actually feel, availability and tail
          latency on the critical journeys, instead of drowning the signal in fifty dashboards no one can
          defend. Pick indicators that track the user experience (success rate, p99 latency, freshness),
          not internal counters that happen to be easy to graph.
        </p>
        <Callout kind="trap" title="Do not set the SLO from current performance">
          If you set the target to whatever the system does today, you enshrine accidental behavior and lose
          the ability to argue it should change. Start from what users need and the business will fund, then
          hold the line, an unreachable SLO is as useless as no SLO.
        </Callout>
      </Block>

      <Block eyebrow="the key idea" title="Error budget: reliability you are allowed to spend">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>error budget</strong> is <code className="font-mono">1 - SLO</code>. A 99.9% objective
          leaves 0.1%, which over a million requests is a thousand failures you are <em>allowed</em> to
          spend. That reframes the endless fight between shipping features and staying up: launches,
          experiments, risky rollouts, and planned maintenance all draw down the same budget, so product and
          SRE are spending one shared pool instead of arguing about vibes.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`SLO           = 99.9% of requests succeed over 28 days
error budget  = 1 - SLO = 0.1%
              = 1,000 failures allowed per 1,000,000 requests

budget HEALTHY  ->  ship features, run experiments, take rollout risk
budget SPENT    ->  the error-budget POLICY fires:
                    freeze launches, redirect to reliability work
                    until the trailing window recovers

reliability is a budget, not an absolute. 100% is the WRONG target:
impossibly expensive, and it means you are shipping too slowly.`}
        />
        <Callout kind="tip" title="The policy is the point, not the number">
          The error-budget <strong>policy</strong> is agreed in advance and says exactly what happens when
          the budget is gone: feature freeze, all hands to reliability, and it applies to everyone including
          the people who own the launch. Deciding that rule ahead of time is what stops it being relitigated
          during an incident, and it is what makes the budget a real lever rather than a chart.
        </Callout>
      </Block>

      <Block eyebrow="two subtleties that read as senior" title="Measure it right, and do not over-achieve">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Request-based vs time-based.</strong> A globally distributed service is almost never fully
          "down," so counting good minutes understates and overstates by turns. Google prefers{" "}
          <strong>aggregate availability</strong>, good requests over total requests, because it weights the
          outage by how much traffic actually suffered.
        </p>
        <OpTable
          cols={["Availability as", "Formula", "", "Character"]}
          rows={[
            { op: "Time-based", avg: "good time / total time", avgTone: "ok", why: "Uptime in minutes. Intuitive for a single box, but a distributed system is never wholly down and this ignores how many requests were hit." },
            { op: "Request-based", avg: "good requests / total requests", avgTone: "good", why: "Aggregate availability, the fraction of requests served well. Google's default for request-driven services; tracks real user impact." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Do not over-achieve.</strong> If your SLO is 99.9% but you quietly run at 99.999%, every
          team that depends on you will build against the reliability they <em>observe</em>, not the number
          you promised, and your slack becomes their hard dependency. Google's counter-move is deliberate:
          it has intentionally taken services offline (the classic example is planned Chubby outages) to keep
          observed reliability near the SLO so consumers cannot over-depend on it.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you pick the SLO number in the first place?</strong> From what users actually need
            and what the business will fund, not a round number and not current performance. Measure for a
            few weeks, set the objective just above the level that keeps users happy, and only tighten if the
            data shows the pain is real.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Request-based or time-based availability?</strong> Request-based for a request-driven
            service, because it weights the outage by traffic hit rather than wall-clock, and a global
            service is rarely fully down. Time-based still fits a single-tenant box or a scheduled batch job
            where "up or not" is the honest question.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What happens the month you blow the budget?</strong> The pre-agreed policy fires: feature
            launches freeze and the team redirects to reliability, retries, capacity, error handling, tests,
            until the trailing window recovers. It is automatic precisely so it is not renegotiated under
            pressure by whoever wants to ship.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why is beating your SLO by a wide margin a problem?</strong> Because users depend on
            observed reliability, so over-achieving silently raises everyone's expectations and hides that
            you are probably shipping too slowly. Spend the budget deliberately, and if you keep it full,
            consider tightening the SLO or taking more launch risk.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "The SLI is the measurement, good events over total; the SLO is the internal target on it, say
          99.9% over 28 days; the SLA is the customer contract with penalties, set looser than the SLO so I
          breach my own objective first. The error budget is one minus the SLO, a thousand failures per
          million at three nines, and I spend it: ship freely while it is healthy, and when it is gone a
          pre-agreed policy freezes features and reliability work takes over. I keep SLOs few so each one
          matters, measure request-based availability, and I never over-achieve, because users come to
          depend on the reliability they observe."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I keep the three terms straight because they serve different people. The SLI is what monitoring
          computes, good requests over total or fast-enough requests over total. The SLO is the internal
          objective the SLI must hold over a window, and I keep the set small on purpose, each SLO is a
          promise and a slice of budget, so few SLOs force us to track what users actually feel instead of
          fifty vanity graphs. I set the target from user need and business appetite, never from current
          performance. The SLA is the external contract with financial teeth, always looser than the SLO so I
          get warning before customers are owed credits. The unlock is the error budget, one minus the SLO,
          about a thousand failures per million requests at three nines, and I treat it as a shared currency
          that launches, experiments, and incidents all spend. When it is healthy the team takes rollout
          risk; when it is exhausted, a policy agreed in advance freezes features and everyone turns to
          reliability, which is what ends the features-versus-stability argument and why 100% is the wrong
          target. Two details I would call out: I measure request-based aggregate availability because a
          global service is never cleanly down, and I do not over-achieve, if I run far above the SLO,
          dependents build on that observed number, so like Google with its planned Chubby outages I would
          rather spend the budget than let my slack become someone else's hard dependency."
        </Callout>
      </Block>
    </>
  );
}

/* ── Handling overload ────────────────────────────────────────── */
function Overload() {
  return (
    <>
      <Lede>
        When demand exceeds capacity, the goal is not to serve everyone, that is impossible, but to degrade
        gracefully and serve as much as you can while protecting the backend. The senior instincts: reason
        in resource <strong>utilization</strong>, not raw QPS; reject work as early and as cheaply as
        possible; and always count the retries as load.
      </Lede>

      <Block eyebrow="the right unit" title="Reason in utilization, not QPS">
        <p className="text-ink-dim leading-relaxed mb-2">
          Raw queries per second is a bad capacity signal because requests are not uniform: a cache hit and a
          giant scan both count as one QPS but cost wildly different CPU and memory, and that cost drifts as
          features and datasets change. Reason instead in the utilization of the <strong>constraining
          resource</strong>, usually CPU (sometimes memory or a connection pool), and express capacity and
          load-shedding thresholds against that. "We are at 85% provisioned CPU" survives a code change;
          "we can do 40K QPS" is stale the next week.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          That you separate load-shedding from just autoscaling, reason about a real constraining resource
          rather than QPS, and name the Google-canon moves: client-side adaptive throttling, criticality,
          shedding early, and counting retries as load. Saying "add more replicas" alone reads as junior; the
          question is what the system does when it cannot scale in time.
        </Callout>
      </Block>

      <Block eyebrow="reject before the network" title="Client-side adaptive throttling">
        <p className="text-ink-dim leading-relaxed mb-2">
          The cheapest request to serve is one the client never sends. In <strong>adaptive
          throttling</strong> each client keeps a short rolling history of its requests and how many the
          backend accepted; when the accept ratio drops, the client starts rejecting its own outgoing calls
          locally, shedding load <em>before</em> it touches the network or the overloaded server.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`over a rolling window, each client tracks:
  requests = calls the app tried to make
  accepts  = calls the backend actually accepted

client-side reject probability:
  p_reject = max(0, (requests - K * accepts) / (requests + 1))     # K ~ 2

backend healthy:  requests ~= accepts  ->  numerator negative  ->  p_reject = 0
backend shedding: accepts falls, requests keeps climbing
                  ->  p_reject rises  ->  client throttles ITSELF

K = 2 lets a client send up to 2x what the backend currently accepts
before it self-throttles, so a recovering backend is not starved.`}
        />
        <Callout kind="tip" title="This is how you stop a retry storm at the source">
          Adaptive throttling means an overloaded backend does not even pay the cost of receiving and
          rejecting doomed traffic, the clients back off on their own. It is the client-side complement to
          server-side load shedding, and the reason a hot dependency can recover instead of being pinned
          down by its own callers.
        </Callout>
      </Block>

      <Block eyebrow="not all requests are equal" title="Criticality: shed the low-priority work first">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every request carries a <strong>criticality</strong> label, and when you must shed, you drop the
          least critical first so a background refresh never crowds out a user-facing checkout. The four
          Google classes, in decreasing order:
        </p>
        <OpTable
          cols={["Criticality", "Means", "", "Shed order"]}
          rows={[
            { op: "CRITICAL_PLUS", avg: "the most important", avgTone: "good", why: "Failure is serious and user-visible. The last thing you ever shed; you provision to protect it." },
            { op: "CRITICAL", avg: "default for prod requests", avgTone: "ok", why: "User-visible but less severe than CRITICAL_PLUS. Shed only after the sheddable classes are gone." },
            { op: "SHEDDABLE_PLUS", avg: "partial loss tolerable", avgTone: "ok", why: "Retryable, batch-like work where some unavailability is expected. Shed before the critical classes." },
            { op: "SHEDDABLE", avg: "frequent loss is fine", avgTone: "bad", why: "Best-effort. Dropped first and freely; occasional full unavailability is acceptable." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Criticality <strong>propagates through the call tree</strong>: it rides on the RPC, so if a
          user-facing request is CRITICAL, the downstream calls it fans out into inherit that, and every
          layer sheds consistently. The same signal also drives adaptive throttling and per-customer limits,
          you keep a separate accounting per criticality so a flood of sheddable traffic never eats the
          critical budget.
        </p>
      </Block>

      <Block eyebrow="the two rules of shedding" title="Shed early, and shed including retries">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Shed early.</strong> If you are going to reject a request, reject it at the front door with
          a cheap 503 before it consumes CPU, memory, or a database connection. A request that gets deep into
          processing and <em>then</em> fails has already burned the resource you were trying to protect, so
          late rejection makes overload worse.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Shed including retries.</strong> When you compute how much load to drop, count retried
          attempts, not just first tries. A retry is a real request that costs real resource, and a client
          that retries three times during an overload is three times the load, so a shedding scheme that only
          looks at "new" requests undercounts and lets the storm through. Pair per-client limits (no single
          caller monopolizes capacity) with per-server limits, and for a hard global cap reach for a
          distributed limiter like Doorman where clients ask a central authority for capacity.
        </p>
        <Callout kind="trap" title="The load you forgot to count is the load that kills you">
          The classic overload failure is measuring first-attempt QPS while a retry storm quietly triples the
          real traffic. Utilization-based accounting that includes retries, plus early cheap rejection, is
          what keeps an overloaded service alive long enough to recover.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Why not just autoscale instead of shedding?</strong> Because scaling takes time, minutes
            to boot capacity, seconds to melt down, and some overloads (a dependency outage, a retry storm,
            a hot key) do not go away by adding replicas. Load shedding is the fast, local defense that keeps
            the service serving its most critical traffic while autoscaling catches up, if it can at all.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How does a client know to throttle before it gets rejections?</strong> It watches its own
            recent accept ratio, not a central signal. As the backend starts rejecting, accepts fall while
            the app keeps trying, so the local reject probability climbs and the client sheds its own
            outgoing calls, no coordination round trip required.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Where does criticality come from and can a client lie?</strong> It is set at the entry
            point by the product path and propagated on the RPC, and yes, everything wants to call itself
            CRITICAL_PLUS, so criticality is governed, budgeted per class, and enforced, not self-asserted
            per request. The point is a scarce label, not a free one.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Per-client limits or a global limiter?</strong> Both. Per-client and per-server limits
            are cheap, local, and stop any one caller monopolizing a backend; a global limiter like Doorman
            adds a hard aggregate cap when many clients share one scarce backend, at the cost of a central
            dependency. Start local, add global only where a true global limit matters.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Under overload I degrade gracefully rather than trying to serve everyone. I reason in resource
          utilization, usually CPU, not raw QPS, because requests are not uniform. Clients throttle
          themselves with adaptive throttling when their accept ratio drops, so doomed traffic never hits the
          network. I tag requests with criticality and shed the least critical first, and I shed early with a
          cheap 503 before I burn resource. Above all I count retries as load, per-client and per-server
          limits, with a global limiter like Doorman only where a hard aggregate cap is needed."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Overload is a capacity problem, so first I fix the unit: I express load and thresholds in the
          utilization of the constraining resource, typically CPU, because QPS lumps a cache hit and a giant
          scan together and drifts every time the code changes. Then I push the defense outward. Clients run
          adaptive throttling: each tracks its recent requests and accepts, and as the backend's accept ratio
          drops the client raises its own reject probability and sheds outgoing calls locally, so an
          overloaded server does not even pay to reject doomed traffic, which is how it gets room to recover.
          Every request carries a criticality, CRITICAL_PLUS, CRITICAL, SHEDDABLE_PLUS, SHEDDABLE, and it
          propagates down the call tree on the RPC, so when I must shed I drop the least critical first and a
          background job never starves a checkout. On the server I shed early, a cheap 503 at the front door
          before the request consumes a connection or CPU, because a request that dies deep in the stack has
          already spent what I was protecting. And the rule people forget: I count retries as load. A retry
          is a real request, so my shedding and my limits, per-client and per-server, are computed on total
          attempts including retries, and I reach for a distributed limiter like Doorman only when a true
          global cap across many clients is the actual requirement. That is the difference between an
          overload that degrades and one that cascades."
        </Callout>
      </Block>
    </>
  );
}

/* ── Cascading failures ───────────────────────────────────────── */
function Cascading() {
  return (
    <>
      <Lede>
        A cascading failure is a <strong>positive-feedback loop</strong>: one overloaded node fails, its
        traffic shifts to its neighbors, they tip over the edge, and the failure spreads faster than any
        single component actually broke. The amplifier that turns a blip into an outage is almost always{" "}
        <strong>retries</strong>, and taming them is the whole game.
      </Lede>

      <Block eyebrow="the mechanism" title="Failure that feeds itself">
        <p className="text-ink-dim leading-relaxed mb-2">
          The dangerous property is the feedback. A cluster runs near capacity; one node dies (a bad deploy,
          a GC death spiral, a slow dependency); its share of traffic redistributes onto the survivors, which
          are now over capacity, so they slow, fail health checks, and die too, dumping even more load onto
          an ever-smaller set. Nothing external got worse, the system is knocking itself down.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`healthy cluster, all nodes ~80% loaded
        |
   node A tips over (deploy / GC / slow dep)
        |
   A's traffic shifts onto B, C, D  ->  they hit 100%+
        |
   B slows, fails health checks, gets killed / restarts
        |
   even more load onto C, D  ->  they tip  ->  ...
        v
   whole cluster down, though nothing outside actually broke

it is a POSITIVE-FEEDBACK loop: each failure INCREASES the load
that caused it. it will not self-recover until you cut the load.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you name the feedback loop and the multiplicative amplifier (retries), not just "add
          redundancy." The Staff signal is the toolkit, retry budgets, backoff with jitter, deadline
          propagation, circuit breakers, plus knowing that to stop an active cascade you have to drop load
          below the tipping point, sometimes with a restart to clear the herd.
        </Callout>
      </Block>

      <Block eyebrow="the amplifier" title="Retry amplification is multiplicative">
        <p className="text-ink-dim leading-relaxed mb-2">
          Retries feel harmless at one layer and become lethal when they stack. If each layer of a call chain
          retries up to R times on failure and there are N layers, one user request can become{" "}
          <strong>R to the power of N</strong> requests at the deepest backend, exactly where capacity is
          already gone. Three attempts at each of three layers is about 27x. Watch it blow up, then watch a
          retry budget cap it:
        </p>
        <Try label="retry amplification">
          <RetryAmplificationViz />
        </Try>
      </Block>

      <Block eyebrow="the toolkit" title="How you keep retries from cascading">
        <OpTable
          cols={["Mechanism", "Does", "", "Why it stops a cascade"]}
          rows={[
            { op: "Retry budget", avg: "cap retries as a % of requests", avgTone: "good", why: "Hold retries under ~10% of a client's request rate, so amplification is bounded near 1.1x instead of exponential. The single biggest lever." },
            { op: "Backoff + jitter", avg: "wait longer, randomize", avgTone: "good", why: "Exponential backoff spaces retries out; jitter de-synchronizes them so a thundering herd does not all retry on the same tick." },
            { op: "Retry at one layer", avg: "do not stack retries", avgTone: "ok", why: "Retry at a single sensible layer, not every hop, and pass a do-not-retry signal up, so R^N collapses toward R." },
            { op: "Deadline propagation", avg: "pass the remaining deadline down", avgTone: "ok", why: "A request whose deadline is already blown is abandoned instead of doing doomed work deep in the stack. Frees capacity fast." },
            { op: "Circuit breaker", avg: "trip open, fail fast", avgTone: "ok", why: "When a dependency's error rate spikes, stop calling it and fail fast, giving it room to recover instead of pinning it down." },
            { op: "Load test to breaking", avg: "find the knee", avgTone: "good", why: "Test past capacity so you know where it tips and whether it degrades or collapses. You cannot defend a limit you have never measured." },
          ]}
        />
        <Callout kind="tip" title="Deadline propagation is the underrated one">
          Pass the caller's remaining time budget down the whole call tree. The moment the deadline is
          exceeded, every layer stops working on that request rather than computing a result no one is waiting
          for, which reclaims capacity precisely when you are short of it. For the vendor-neutral resilience
          set, see the{" "}
          <a href="#/patterns" className="font-mono text-xs" style={{ color: ACCENT }}>Architecture Patterns</a>{" "}
          tool, the "Resilience patterns" topic and its CircuitBreakerViz.
        </Callout>
      </Block>

      <Block eyebrow="it is already on fire" title="Breaking an active cascade">
        <p className="text-ink-dim leading-relaxed mb-2">
          Prevention aside, an interviewer will ask how you stop one in progress. The through-line: a cascade
          is self-sustaining, so it will not recover on its own until you push load back under the tipping
          point. The moves, roughly in order:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Drop traffic</strong>, the big lever: shed aggressively, block the worst offenders, enter a degraded mode. Get load under capacity so the survivors stop dying.</li>
          <li><strong>Stop the deaths</strong>, loosen or pause health checks that are killing overloaded-but-alive nodes, so you stop feeding the loop.</li>
          <li><strong>Restart to clear the herd</strong>, restarting servers dumps stuck queues, in-flight retries, and GC death spirals, letting them come back cold and empty rather than instantly re-saturated.</li>
          <li><strong>Add capacity, then ramp</strong>, bring resources back gradually; a big-bang re-enable just re-triggers the cascade as the herd of pending retries lands at once.</li>
        </ul>
        <Callout kind="trap" title="Turning it all back on at once re-lights the fire">
          The subtle failure is recovering too fast: flip everything back and the backlog of queued and
          retried requests slams the freshly-recovered cluster and it tips straight over again. Ramp traffic
          back slowly and keep shedding until utilization is safely under the knee.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Retries usually help reliability. When do they hurt?</strong> Under overload. When the
            failure is a slow or saturated dependency, retries add load exactly where there is none to spare
            and turn a blip into a cascade. That is why retries need a budget and backoff, and why you never
            retry into a backend that is already shedding.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why jitter and not just exponential backoff?</strong> Plain backoff still lets everyone
            retry on the same schedule, so the herd re-synchronizes and hits in waves. Jitter randomizes the
            wait so the retries smear out in time, converting a spiky thundering herd into a manageable
            trickle.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What does deadline propagation buy you during a cascade?</strong> It stops the system
            doing work nobody is waiting for. Once a request's deadline is blown, every downstream layer
            abandons it instead of finishing a doomed computation, so capacity is freed for requests that can
            still succeed, which is exactly what you are short of mid-cascade.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You restart the cluster and it falls over again immediately. Why?</strong> You recovered
            too fast. The backlog of queued and retried requests lands on the cold cluster all at once and
            re-saturates it. Keep shedding, ramp traffic back gradually, and let utilization settle under the
            knee before removing the brakes.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "A cascading failure is a positive-feedback loop: a node fails, its load shifts to its neighbors,
          they tip, and it spreads faster than anything actually broke. The amplifier is retries, which are
          multiplicative, three attempts across three layers is 27x load at the bottom. I bound that with a
          retry budget, exponential backoff with jitter, retrying at only one layer, deadline propagation,
          and circuit breakers, and I load-test to the breaking point. To stop one in progress I drop traffic
          below the tipping point, restart to clear the herd, and ramp back slowly so the backlog does not
          re-light it."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The thing that makes cascades scary is the feedback: each failure increases the load that caused
          it. A cluster near capacity loses a node to a bad deploy or a GC spiral, its traffic redistributes
          onto the survivors, they cross 100%, fail health checks, get killed, and dump even more load on an
          ever-smaller pool until the whole thing is down, though nothing outside ever changed. The usual
          accelerant is retry amplification. Retries look harmless per layer but stack multiplicatively, R
          attempts across N layers is R^N requests at the deepest backend, so three-by-three is about 27x
          hitting the exact place that has no capacity. So my toolkit is about bounding retries and shedding
          doomed work: a retry budget that caps retries near ten percent of the request rate, so amplification
          stays around 1.1x instead of exponential; exponential backoff with jitter so the herd does not
          re-synchronize; retrying at a single layer with a do-not-retry signal passed up; deadline
          propagation so any layer abandons a request whose deadline is already blown; and circuit breakers
          that trip open to give a failing dependency room. I also load-test past capacity so I actually know
          where the knee is and whether it degrades or collapses. If one is already burning, I stop treating
          it as a scaling problem and cut load: shed hard and enter degraded mode to get under the tipping
          point, pause the health checks that are killing alive-but-overloaded nodes, restart servers to
          clear stuck queues and in-flight retries, then ramp traffic back gradually, because the classic
          mistake is re-enabling everything at once and letting the backlog re-light the fire."
        </Callout>
      </Block>
    </>
  );
}

/* ── Managing critical state ──────────────────────────────────── */
function Consensus() {
  return (
    <>
      <Lede>
        Some state has to be correct: who is the leader, who holds the lock, what the replicated log says.
        The tempting shortcuts, heartbeat leader election and "whoever grabbed the lock wins," quietly
        produce <strong>split-brain</strong> and corruption under a partition. The real answer is formal{" "}
        <strong>distributed consensus</strong>, and knowing when to reach for it.
      </Lede>

      <Block eyebrow="the trap" title="Ad-hoc election causes split-brain">
        <p className="text-ink-dim leading-relaxed mb-2">
          Electing a leader with heartbeats seems fine until the network partitions. Now each side sees the
          other as dead, each promotes its own leader, and both accept writes. When the partition heals you
          have two divergent histories and no safe way to merge them, that is <strong>split-brain</strong>,
          and it corrupts exactly the state you most needed to protect.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`heartbeat election, then a partition:

   [ node A ] --x   x-- [ node B ]      network splits A | B
   A: "B is dead, I am leader"          B: "A is dead, I am leader"
   A accepts writes   ------------->    B accepts writes
        |                                    |
   partition heals: TWO leaders, TWO divergent write histories
        v
   SPLIT-BRAIN: state is corrupted, no safe automatic merge

heartbeats tell you "no recent message", which is NOT the same as
"the other node is down". you cannot tell a dead node from a slow link.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you distrust ad-hoc coordination, reach for a real consensus algorithm for critical state, and
          can explain the two things that actually make it safe: overlapping quorum majorities and fencing
          tokens. Naming CAP honestly (a consensus system chooses consistency and sheds availability under
          partition) is the Staff-level tell.
        </Callout>
      </Block>

      <Block eyebrow="the real answer" title="Consensus and the overlapping-majority guarantee">
        <p className="text-ink-dim leading-relaxed mb-2">
          A consensus algorithm (<strong>Paxos</strong> or <strong>Raft</strong>) lets a group of replicas
          agree on a single value even with failures and delays. Safety comes from{" "}
          <strong>quorum majorities</strong>: with 2f+1 replicas you tolerate f failures, and any two
          majorities of the group must share at least one member, so two conflicting decisions can never both
          be committed. That one overlapping node is the whole safety proof.
        </p>
        <OpTable
          cols={["Reach for consensus when you need", "Example", "", "Why not ad-hoc"]}
          rows={[
            { op: "Leader election", avg: "one primary at a time", avgTone: "good", why: "A quorum agrees on the leader, so a partition cannot mint a second one. Heartbeats alone cannot tell dead from slow." },
            { op: "Distributed locking", avg: "mutual exclusion across nodes", avgTone: "good", why: "The lock is granted by consensus and fenced, so a stalled holder cannot corrupt the resource on wake-up." },
            { op: "Replicated state / log", avg: "same ordered history everywhere", avgTone: "ok", why: "A replicated state machine applies the same commands in the same order; consensus is what agrees the order." },
            { op: "Config / metadata of record", avg: "one source of truth", avgTone: "ok", why: "Cluster membership, shard maps, and the like must be consistent; divergence here breaks everything downstream." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          You rarely build this yourself. In practice you lean on a consensus-backed coordination service,
          Google's <strong>Chubby</strong> (Paxos under the hood) for locks and leader election, or ZooKeeper
          and etcd elsewhere, and let it own the hard part.
        </p>
      </Block>

      <Block eyebrow="the pause that corrupts" title="Fencing tokens stop a stale leader">
        <p className="text-ink-dim leading-relaxed mb-2">
          Consensus picks a single leader, but a leader that suffers a long GC pause or a network stall can
          wake up still <em>believing</em> it holds the lock, after a new one has been elected, and issue a
          stale write. The fix is a <strong>fencing token</strong>: every lock grant carries a monotonically
          increasing number, the write to the protected resource must include it, and the resource remembers
          the highest token it has seen and rejects anything lower.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`lock service hands out a monotonic token with every grant:

   client 1 acquires lock   ->  token 33
   client 1 STALLS (GC pause)
   lease expires, client 2 acquires  ->  token 34
   client 2 writes with token 34     ->  storage accepts (34 >= high-water 34)
   client 1 wakes, writes token 33   ->  storage REJECTS (33 < 34)

the resource enforces "reject any token below the highest seen",
so a paused ex-leader's stale write is harmless, not corrupting.`}
        />
        <Callout kind="tip" title="A lock without fencing is not safe">
          The lock service alone cannot stop a client that pauses past its lease and resumes. Only the
          protected resource, checking a monotonic token on every write, makes the guarantee real. Chubby
          calls these sequencers; the idea is identical, and it is the answer whenever someone says "but what
          if the lock holder freezes?"
        </Callout>
      </Block>

      <Block eyebrow="be honest about the cost" title="CAP: consensus chooses consistency">
        <p className="text-ink-dim leading-relaxed mb-2">
          Consensus is not free, and the price is availability under partition. A quorum needs a majority to
          be reachable, so the minority side of a partition <strong>stops accepting writes</strong> rather
          than diverging, a consensus system is <strong>CP</strong>. Say that out loud: you are choosing
          safety over availability for this state precisely because correctness matters more than uptime
          here. It also costs latency, every committed write waits for a quorum round trip, which is why you
          reserve consensus for the small set of truly critical state and keep the bulk of traffic on cheaper
          paths.
        </p>
        <Callout kind="note" title="Where Spanner fits">
          Google's Spanner layers Paxos-replicated groups under <strong>TrueTime</strong>, a clock that
          exposes bounded uncertainty from GPS and atomic clocks, and waits out that uncertainty on commit to
          give globally-ordered, externally-consistent transactions. It is the existence proof that you can
          have strong consistency at global scale, by paying for it in coordination and a little latency.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Why can't heartbeats alone elect a leader safely?</strong> Because a missed heartbeat is
            ambiguous, you cannot distinguish a dead node from a slow network. Under a partition both sides
            declare the other dead and elect themselves, giving two leaders. Consensus resolves it with a
            quorum, so only the majority side can lead.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why an odd number of replicas?</strong> An odd count maximizes failure tolerance per node
            and avoids ties: five nodes tolerate two failures with a majority of three, whereas going to six
            still only tolerates two while costing more. Overlapping majorities need a clean majority, and odd
            sizes give it without waste.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The lock holder freezes for 30 seconds. How do you stay safe?</strong> Fencing tokens.
            The lease expires and a new holder gets a higher token; when the frozen one wakes and tries to
            write with its old token, the resource rejects it because the token is below the highest seen. The
            lock service cannot prevent the pause, but the resource makes the stale write harmless.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Isn't consensus too slow to put everywhere?</strong> Yes, deliberately. Every commit pays
            a quorum round trip and the minority loses availability under partition, so I use consensus only
            for the small critical core, leader, lock, membership, log, and keep the high-volume data path on
            cheaper replication with weaker guarantees where that is acceptable.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "For critical state, leader, lock, replicated log, ad-hoc heartbeat election causes split-brain
          under a partition: both sides elect themselves and corrupt the state. I use formal consensus, Paxos
          or Raft, where overlapping quorum majorities guarantee two conflicting decisions can't both commit,
          usually via Chubby, ZooKeeper, or etcd rather than rolling my own. I add fencing tokens so a paused
          ex-leader's stale write is rejected by the resource, and I'm explicit that consensus is CP: under
          partition the minority stops taking writes, which is the price of correctness."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The failure I am guarding against is split-brain. If I elect a leader with heartbeats, a partition
          makes each side think the other is dead, both promote a leader, both accept writes, and when the
          link heals I have two divergent histories and no safe merge, the state I most needed to protect is
          corrupted. The root cause is that a missed heartbeat cannot distinguish a dead node from a slow
          network. So for anything critical, leader election, distributed locking, a replicated state machine,
          or the metadata of record, I use a real consensus algorithm, Paxos or Raft, and in practice a
          consensus-backed service like Chubby, ZooKeeper, or etcd. Its safety rests on overlapping
          majorities: with 2f+1 replicas any two majorities share a node, so two conflicting values can never
          both commit. Consensus gives me one leader, but I still need fencing tokens, because a leader that
          GC-pauses past its lease can wake up thinking it is still in charge. Every grant carries a
          monotonically increasing token, the protected resource records the highest it has seen and rejects
          anything lower, so the stale write from the paused ex-leader is simply refused. And I am honest
          about the cost: a consensus system is CP, under partition the minority stops accepting writes to
          preserve consistency, and every commit pays a quorum round trip, so I reserve it for the small
          critical core and keep bulk traffic on cheaper paths. Spanner is the proof you can push strong
          consistency to global scale, Paxos groups under TrueTime, by paying in coordination and a little
          commit-wait latency."
        </Callout>
      </Block>
    </>
  );
}

/* ── Data integrity ───────────────────────────────────────────── */
function Integrity() {
  return (
    <>
      <Lede>
        The line that separates a Staff answer here is simple: <strong>replication is not
        recoverability</strong>. Redundancy protects you from losing a disk; it does nothing against a bug, a
        bad deploy, or a fat-fingered delete, because the corruption replicates too, instantly, to every
        copy. Real data integrity is <strong>defense in depth</strong>, and it is worthless until you have
        proven you can restore.
      </Lede>

      <Block eyebrow="the core insight" title="Redundancy replicates your mistakes too">
        <p className="text-ink-dim leading-relaxed mb-2">
          Replication and erasure coding buy you availability and durability against <em>hardware</em>
          {" "}failure: lose a node, a copy survives. But the threats that actually destroy data are logical,
          an application bug that writes garbage, an operator who runs the wrong DELETE, a migration that
          drops a column, and those propagate to all replicas the moment they commit. Three perfect copies of
          corrupted data is three copies of corrupted data. What you need is the ability to recover to a
          known-good state <em>in the past</em>, which redundancy alone never gives you.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          That you separate durability (do not lose bytes to hardware) from recoverability (get back to a
          correct past state after a logical fault), and that you propose layered defenses ending in tested
          restores. Answering "we replicate three ways" to a corruption question is the trap; the signal is
          soft deletes, tiered offsite backups, out-of-band validation, and "we continuously test restores."
        </Callout>
      </Block>

      <Block eyebrow="layered on purpose" title="Defense in depth: three lines that fail differently">
        <p className="text-ink-dim leading-relaxed mb-2">
          No single mechanism covers every failure, so you stack independent ones that fail in different
          ways. Google's canonical layering:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`line 1  SOFT DELETION            recover from user error + app bugs
        deletes mark a row / tombstone; a reaper purges only
        after a 30-60 day window, so "oops" is reversible

line 2  BACKUPS + OFFSITE ARCHIVE  recover from bad deploys + loss
        full + incremental, multiple tiers, different media and
        location; older archives survive a bug that hits recent data

line 3  OUT-OF-BAND VALIDATION     recover BEFORE it is too late
        independent jobs continuously scan for corruption and
        inconsistency and alert, so you catch it inside the backup
        window instead of discovering it after the archives age out

independent layers, different failure modes. no single fault,
human or software, should be able to defeat all three at once.`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The layers are ordered by how fast and cheap recovery is. <strong>Soft deletion</strong> makes the
          common case, someone deleted the wrong thing, a metadata flip instead of a restore.{" "}
          <strong>Tiered backups</strong> (fast local, then cloud, then cold offsite) trade recovery speed
          for protection against a fault that also reaches recent data. <strong>Validation</strong> is the
          smoke detector: it turns silent corruption into an alert while you still have a good copy to
          recover from.
        </p>
      </Block>

      <Block eyebrow="the part everyone skips" title="Backups are worthless unless restores are tested">
        <p className="text-ink-dim leading-relaxed mb-2">
          A backup you have never restored is a hope, not a plan. Backups rot silently, formats drift, a
          field gets excluded, permissions change, the tooling bit-rots, and you find out during the outage,
          which is the worst possible time. The discipline: <strong>continuously exercise restores</strong>,
          automatically, into a scratch environment, and measure the restore time against your recovery SLO.
          You only truly know you can recover if you actually do it, on a schedule, not once at setup.
        </p>
        <Callout kind="trap" title="Untested backups fail exactly when you need them">
          The famous saves (a data-wipe bug caught because an offline archive existed and could be restored)
          worked because the restore path was real and rehearsed. Treat "restore succeeds within the SLO" as
          a monitored SLI of its own, and alert when a restore test fails just like any other outage.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>We replicate across three zones. Isn't the data safe?</strong> Safe from hardware loss,
            not from corruption. A bad write or an errant delete replicates to all three zones instantly, so
            redundancy raises durability but does nothing for recoverability. For that I need point-in-time
            recovery: soft deletes, versioned backups, and offsite archives.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why soft deletion instead of just relying on backups?</strong> Because the common case is
            human error, and a full restore is slow, disruptive, and risks clobbering good newer data. A
            soft-delete window makes "undo that delete" a cheap metadata flip, and it also catches app bugs
            that delete more than intended, before the reaper ever purges.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you catch corruption that happened weeks ago?</strong> Continuous out-of-band
            validation: independent jobs that scan for consistency and integrity violations and alert. Without
            it, silent corruption ages past your backup retention and becomes unrecoverable, so validation is
            what keeps a good copy inside the window.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you know your backups actually work?</strong> By restoring them, on a schedule,
            into a scratch environment, and checking the result against the source. I treat restore success
            and restore time as monitored SLIs and page on a failed restore test, because a backup is only as
            good as the last restore you proved.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "The key line is replication is not recoverability. Redundancy protects against hardware loss, but a
          bug or a bad delete corrupts every replica at once, so I need defense in depth: soft deletion with a
          30-to-60-day window for user and app errors, tiered backups plus offsite archives for bad deploys,
          and continuous out-of-band validation to catch silent corruption while a good copy still exists. And
          none of it counts until restores are continuously tested, you only know you can recover if you
          actually do it, so I monitor restore success and time as SLIs of their own."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I start by separating two things people conflate: durability, not losing bytes to hardware, and
          recoverability, getting back to a correct past state after a logical fault. Replication and erasure
          coding give durability, but the failures that actually destroy data are logical, a buggy write, a
          wrong DELETE, a migration that drops a column, and those replicate to every copy the instant they
          commit, so three perfect replicas of corrupt data help me not at all. So I layer independent
          defenses that fail differently. First, soft deletion: deletes tombstone the record and a reaper only
          purges after a thirty-to-sixty-day window, which turns the common case of human error, and many app
          bugs, into a reversible metadata flip. Second, tiered backups and offsite archives, full plus
          incremental across different media and locations, so a fault that reaches recent data does not reach
          the older cold copies. Third, continuous out-of-band validation, independent jobs that scan for
          corruption and inconsistency and alert, so I discover a problem while a good copy is still inside my
          retention window rather than after it has aged out. And the discipline that ties it together is
          testing restores continuously: a backup I have never restored is a hope, formats drift and tooling
          rots, so I automate restores into a scratch environment, verify against source, and track restore
          success and restore time as monitored SLIs that page like any other outage. The principle is that no
          single fault, human or software, should defeat every layer, and you only know you can recover if you
          actually do."
        </Callout>
      </Block>
    </>
  );
}

/* ── Load balancing ───────────────────────────────────────────── */
function Lb() {
  return (
    <>
      <Lede>
        Serving traffic well is a multi-tier problem, and the theme is the same at every tier: route on real
        backend <strong>capacity and health</strong>, never on blind round-robin, and never retry into a
        backend that is already overloaded. Get those two instincts right and you have most of Google's
        load-balancing canon.
      </Lede>

      <Block eyebrow="not one box" title="Balance at multiple tiers">
        <p className="text-ink-dim leading-relaxed mb-2">
          Load balancing happens at several layers, each solving a different granularity of the problem, and
          a good answer names the stack rather than a single appliance:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`tier 1  DNS / geo            coarse: send the user to a nearby, healthy region
                            (slow to change, cached, so never your only defense)
        |
tier 2  VIP + anycast +     connection level: one virtual IP announced from many
        Maglev              sites; BGP routes to the closest; Maglev spreads
                            packets evenly with consistent hashing + conn tracking
        |
tier 3  datacenter / app    request level: the smart tier that knows each backend's
        load balancer       real load and health, and routes each request on it

each tier hands off to the next. the lower you go, the more the
balancer knows about actual backend state, and the smarter it routes.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you think in tiers (DNS to VIP/Maglev to datacenter LB), route on real backend load and health
          rather than plain round-robin, and know the datacenter techniques, subsetting, weighted round robin
          off backend-reported signals, lame-duck draining, and the rule that you never retry into an
          overloaded backend. That last one ties load balancing back to cascading failures.
        </Callout>
      </Block>

      <Block eyebrow="round-robin is not enough" title="Route on capacity, not request count">
        <p className="text-ink-dim leading-relaxed mb-2">
          Plain round-robin assumes every backend is identical and every request costs the same, and both are
          false: hardware differs, a backend mid-GC is briefly slow, and one query can be a hundred times
          another. Distributing by request count then piles work onto a struggling node. The fix is to route
          on the backend's <strong>real, reported state</strong>, utilization and error rate, so load tracks
          actual capacity.
        </p>
        <OpTable
          cols={["Technique", "Does", "", "Why it beats round-robin"]}
          rows={[
            { op: "Subsetting", avg: "each client talks to a subset", avgTone: "good", why: "A client connects to a limited subset of backends, not all N, bounding connection counts and overhead while keeping balance good. Essential at scale." },
            { op: "Weighted round robin", avg: "weight by reported load", avgTone: "good", why: "Backends report utilization and error rates; the LB shifts weight toward the healthy, underloaded ones, so load follows real capacity." },
            { op: "Least-loaded / least-request", avg: "prefer the idlest", avgTone: "ok", why: "Send to the backend with the fewest in-flight requests, but guard against the herd all picking the same 'idle' node at once." },
          ]}
        />
        <Callout kind="tip" title="Subsetting is the one people forget">
          At scale, a full mesh where every client connects to every backend is a connection explosion.
          Subsetting caps how many backends each client talks to, which keeps connection counts and
          health-checking sane while still balancing well, and it is a distinctly Google-canon answer. See the
          vendor-neutral treatment in the{" "}
          <a href="#/arch-fundamentals" className="font-mono text-xs" style={{ color: ACCENT }}>Architecture Fundamentals</a>{" "}
          tool at the "Load balancing" topic.
        </Callout>
      </Block>

      <Block eyebrow="dealing with sick backends" title="Health checks, lame-duck, and never retrying into overload">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Health checks</strong> pull dead or failing backends out of rotation automatically. But the
          graceful case is a backend that wants to leave on purpose, for a deploy or a restart, and that is
          what <strong>lame-duck</strong> handles: the backend announces "I am going away, send me no new
          requests, but I will finish what is in flight," so the balancer drains it cleanly with zero dropped
          traffic instead of yanking it and killing live requests.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          The rule that ties this topic to cascading failures: <strong>never retry into an overloaded
          backend</strong>. If a backend is shedding, a retry is more load landing exactly where there is
          none to spare, and it is how a hot node becomes a cascade. Retries respect a budget and backoff,
          check backend health first, and prefer a different, healthy backend, retrying the request, not
          hammering the sick node.
        </p>
        <Callout kind="trap" title="The load balancer can start the cascade it is meant to prevent">
          A balancer that reacts to a slow backend by retrying onto it, or by dog-piling the one node that
          currently looks idle, amplifies the very overload it should be smoothing. Route on capacity, drain
          with lame-duck, and treat retries as load-bearing, budgeted and health-aware, not free.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Why not just do DNS round-robin and be done?</strong> DNS is coarse and heavily cached, so
            it cannot react to a backend dying in seconds and it knows nothing about per-backend load. It is
            fine as the outer, geo tier, but you need connection-level (Maglev, anycast) and request-level
            datacenter balancing underneath it to route on real health.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What problem does subsetting actually solve?</strong> Connection and overhead explosion. If
            every one of thousands of clients connects to every backend, you drown in connections and health
            checks. Subsetting limits each client to a subset, keeping that overhead bounded while still
            spreading load evenly, provided the subset size is chosen well.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Least-loaded routing can misfire. How?</strong> If every balancer sees the same node as
            idlest, they can all send to it at once and instantly overload it, the herd effect. You damp it
            with the load signal plus randomization (pick among the few least-loaded) and by acting on
            backend-reported utilization rather than a single stale snapshot.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you deploy without dropping requests?</strong> Lame-duck draining: the backend
            signals it should get no new work while it finishes in-flight requests, the balancer stops routing
            to it, and only then does it restart. Combined with health checks for the ungraceful cases, that
            is how a rollout stays invisible to users.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Load balancing is multi-tier: DNS and geo for coarse region selection, VIP with anycast and Maglev
          for even connection-level spreading, and a datacenter load balancer that routes each request on real
          backend load and health, never plain round-robin. At the datacenter tier I use subsetting so each
          client talks to a subset of backends, and weighted round robin driven by backend-reported
          utilization and errors. I drain backends with lame-duck for clean deploys, pull dead ones with
          health checks, and I never retry into an overloaded backend, because that is how load balancing
          starts a cascade."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I think of it as a stack, because each tier balances at a different granularity. At the top, DNS
          and geo routing steer a user toward a nearby healthy region, but it is coarse and cached so it can
          never be my only defense. Below that, a virtual IP announced by anycast from many sites lets BGP
          pick the closest entry point, and a packet balancer like Maglev spreads connections evenly using
          consistent hashing with connection tracking so existing flows stay pinned. The interesting tier is
          the datacenter load balancer, which actually knows each backend's state and routes per request on
          it. There I lean on subsetting, each client connects to a subset of backends rather than the full
          mesh, which keeps connection counts and health-checking from exploding at scale, and weighted round
          robin driven by backend-reported utilization and error rates, so traffic follows real capacity
          instead of assuming every node and every request is identical, which is exactly where naive
          round-robin fails. For unhealthy backends I use health checks to eject dead ones automatically and
          lame-duck draining for the graceful case, a backend announces it wants no new requests but will
          finish in-flight work, so deploys and restarts drop nothing. And the rule I always state, because it
          links straight back to cascading failures, is never retry into an overloaded backend: a retry
          against a shedding node is more load where there is none to spare, so retries are budgeted,
          backed-off, health-aware, and prefer a different healthy backend. Route on capacity, drain
          gracefully, and treat retries as load, and the balancer smooths overload instead of starting it."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ───────────────────────────────────── */
const DECK = [
  {
    q: "SLI vs SLO vs SLA?",
    a: "SLI is the measurement (good events / total). SLO is the internal target on that SLI, e.g. 99.9% over 28 days. SLA is the external customer contract with financial penalties. Set the SLA looser than the SLO so you breach your own objective first and get warning.",
    tag: "targets",
  },
  {
    q: "What is the error budget and how is it computed?",
    a: "Error budget = 1 - SLO. At 99.9% that is 0.1%, which is 1,000 allowed failures per 1,000,000 requests. It is a shared currency: launches, experiments, and incidents all spend it, so it settles the features-versus-reliability fight.",
    tag: "targets",
  },
  {
    q: "What is an error-budget policy?",
    a: "A rule agreed in advance for when the budget is spent: freeze feature launches and redirect the team to reliability work until the trailing window recovers. It is automatic precisely so it is not relitigated during an incident.",
    tag: "targets",
  },
  {
    q: "Why is 100% reliability the wrong target, and why not over-achieve?",
    a: "100% is impossibly expensive and means you ship too slowly. And if you quietly run far above your SLO, dependents build on the reliability they observe, so your slack becomes their hard dependency, Google even takes services down deliberately to keep observed reliability near the SLO.",
    tag: "targets",
  },
  {
    q: "Why reason in utilization instead of raw QPS under overload?",
    a: "Requests are not uniform, a cache hit and a giant scan are both 1 QPS but cost wildly different resource, and the cost drifts as code changes. Utilization of the constraining resource (usually CPU) is a stable capacity signal; a QPS number is stale next week.",
    tag: "overload",
  },
  {
    q: "What is client-side adaptive throttling?",
    a: "Each client tracks its recent requests and accepts; as the backend's accept ratio drops, the client raises its own reject probability and sheds outgoing calls locally, before they hit the network. p_reject = max(0, (requests - K*accepts)/(requests+1)), K about 2.",
    tag: "overload",
  },
  {
    q: "What is request criticality and how is it used?",
    a: "A label (CRITICAL_PLUS, CRITICAL, SHEDDABLE_PLUS, SHEDDABLE) that propagates down the call tree on the RPC. When you must shed, you drop the least critical first, so a background job never starves a user-facing checkout. It is governed and budgeted, not self-asserted.",
    tag: "overload",
  },
  {
    q: "Two rules of load shedding?",
    a: "Shed early, reject with a cheap 503 at the front door before the request burns CPU or a connection; and shed including retries, count retried attempts as load, because a client retrying three times is three times the traffic and a scheme that ignores them undercounts.",
    tag: "overload",
  },
  {
    q: "Why is a cascading failure a positive-feedback loop?",
    a: "One node fails, its load shifts to neighbors, they cross capacity and fail too, dumping even more load on an ever-smaller pool. Each failure increases the load that caused it, so it accelerates and will not self-recover until you cut load below the tipping point.",
    tag: "failure",
  },
  {
    q: "What is retry amplification, and roughly how big?",
    a: "Retries stack multiplicatively across layers: R attempts at each of N layers is about R^N requests at the deepest backend. Three attempts across three layers is ~27x load landing exactly where capacity is already gone.",
    tag: "failure",
  },
  {
    q: "What is a retry budget?",
    a: "A cap that holds retries to a small fraction of a client's request rate, e.g. under ~10%, so amplification stays near 1.1x instead of exponential. It is the single biggest lever against retry-driven cascades; retrying at only one layer collapses it further.",
    tag: "failure",
  },
  {
    q: "Why exponential backoff PLUS jitter, not just backoff?",
    a: "Plain backoff still lets clients retry on the same schedule, so the herd re-synchronizes and hits in waves. Jitter randomizes the wait so retries smear out in time, turning a thundering herd into a manageable trickle.",
    tag: "failure",
  },
  {
    q: "What is deadline propagation and why does it help in a cascade?",
    a: "Pass the caller's remaining time budget down the whole call tree. Once the deadline is blown, every layer abandons the request instead of computing a result nobody is waiting for, which reclaims capacity exactly when you are short of it.",
    tag: "failure",
  },
  {
    q: "What is split-brain and what causes it?",
    a: "Two nodes both believing they are leader, each accepting writes, producing divergent histories that cannot be safely merged. Ad-hoc heartbeat election causes it: a partition makes each side declare the other dead, because a missed heartbeat cannot tell dead from slow.",
    tag: "state",
  },
  {
    q: "Why do quorum majorities make consensus safe?",
    a: "With 2f+1 replicas you tolerate f failures, and any two majorities of the group share at least one member. That overlap means two conflicting decisions can never both be committed, it is the whole safety guarantee behind Paxos and Raft.",
    tag: "state",
  },
  {
    q: "What are fencing tokens and what do they prevent?",
    a: "A monotonically increasing number handed out with each lock grant; writes must include it and the resource rejects any token below the highest it has seen. It stops a paused ex-leader (a GC stall past its lease) from corrupting state with a stale write on wake-up.",
    tag: "state",
  },
  {
    q: "Why is replication NOT recoverability?",
    a: "Replication protects against hardware loss, but a bug, bad deploy, or wrong DELETE corrupts every replica the instant it commits. You need to recover to a known-good PAST state, via soft deletes, versioned backups, and offsite archives, which redundancy alone never provides.",
    tag: "data",
  },
  {
    q: "How do you know your backups actually work?",
    a: "By restoring them, continuously and automatically, into a scratch environment and verifying against source. Backups rot silently, so you treat restore success and restore time as monitored SLIs and page on a failed restore test. You only know you can recover if you actually do.",
    tag: "data",
  },
  {
    q: "What is subsetting in datacenter load balancing?",
    a: "Each client connects to a limited subset of backends instead of the full mesh, bounding connection counts and health-check overhead at scale while still balancing well. Pair it with weighted round robin driven by backend-reported utilization and errors.",
    tag: "balancing",
  },
  {
    q: "What is lame-duck, and why never retry into an overloaded backend?",
    a: "Lame-duck: a backend announces it wants no new requests but will finish in-flight work, so the balancer drains it cleanly for a deploy with zero dropped traffic. And you never retry into a shedding backend, that is just more load where there is none to spare, which is how a balancer starts a cascade.",
    tag: "balancing",
  },
];

function Quickfire() {
  return (
    <>
      <Lede>
        Twenty cards spanning the whole canon, SLI/SLO/SLA and error budgets, overload and adaptive
        throttling, retry amplification and its fixes, consensus and fencing, data integrity, and load
        balancing. Read the prompt, answer out loud in a sentence or two, then reveal and grade yourself.
        Out loud is the rep.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  slo: <Slo />,
  overload: <Overload />,
  cascading: <Cascading />,
  consensus: <Consensus />,
  integrity: <Integrity />,
  lb: <Lb />,
  quickfire: <Quickfire />,
};

export default function SreCanon() {
  const [active, setActive] = useState("slo");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Reliability · THE GOOGLE EDGE"
      title="The SRE Canon"
      subtitle="The handful of Google SRE ideas that separate a Staff answer from a senior one: error budgets, overload, cascading failures, consensus, and data integrity."
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
