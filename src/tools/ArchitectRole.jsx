import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import NfrRadarViz from "./archrole/NfrRadarViz.jsx";
import StranglerFigViz from "./archrole/StranglerFigViz.jsx";

const ACCENT = "#2fbf8f";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "nfr", label: "Quality attributes & the -ilities", group: "Quality & decisions" },
  { id: "slos", label: "SLA / SLO / SLI & error budgets", group: "Quality & decisions" },
  { id: "ddd", label: "Domain-driven design", group: "Quality & decisions" },
  { id: "cloud", label: "Cloud & Well-Architected", group: "Method & docs" },
  { id: "migration", label: "Migration: strangler fig & 6 R's", group: "Method & docs" },
  { id: "adr", label: "ADRs, C4 & design docs", group: "Method & docs" },
  { id: "buildbuy", label: "Build vs buy & tech strategy", group: "Leadership" },
  { id: "leadership", label: "Influence, comms & STAR", group: "Leadership" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* ── Quality attributes & the -ilities ────────────────────────── */
function Nfr() {
  return (
    <>
      <Lede>
        Functional requirements say what the system does; <strong>quality attributes</strong>, the
        "-ilities", say how well, and they are what actually drive an architecture. A senior candidate does
        not just list them, they name which two or three matter for <em>this</em> system, make each one
        measurable, and say out loud what the others pay for it. There is no free -ility.
      </Lede>

      <Block eyebrow="the vocabulary" title="The core -ilities">
        <p className="text-ink-dim leading-relaxed mb-2">
          These are the attributes an architecture round expects you to reach for by name. The ISO/IEC 25010
          quality model is the formal catalog; in practice a handful carry most interviews:
        </p>
        <OpTable
          cols={["Attribute", "What it means", "", "Where it bites"]}
          rows={[
            { op: "Performance / latency", avg: "fast enough", avgTone: "good", why: "Response time and throughput under load. Measured at the tail (p95/p99), not the average, because users feel the worst case." },
            { op: "Scalability", avg: "grows with load", avgTone: "good", why: "Handles more traffic or data by adding resources. Prefer horizontal (add nodes) over vertical (bigger box) for elasticity." },
            { op: "Availability", avg: "up when needed", avgTone: "good", why: "Fraction of time the system serves requests, expressed in nines. Redundancy and failover buy it; they cost money and complexity." },
            { op: "Reliability", avg: "behaves correctly", avgTone: "ok", why: "Does the right thing without failing; tracked by MTBF and MTTR. Availability is a consequence of reliability plus fast recovery." },
            { op: "Durability", avg: "does not lose data", avgTone: "ok", why: "Committed data survives failures (eleven nines is the storage benchmark). Distinct from availability, data can be safe but briefly unreachable." },
            { op: "Consistency", avg: "everyone sees the same", avgTone: "ok", why: "Reads reflect the latest write. Strong consistency needs coordination; under a partition it trades against availability (CAP)." },
            { op: "Security", avg: "confidential, integral", avgTone: "ok", why: "Confidentiality, integrity, availability, plus authn/authz and auditability. Often pulls against usability and simplicity." },
            { op: "Maintainability", avg: "cheap to change", avgTone: "good", why: "How fast and safely the system evolves: modularity, testability, and clear boundaries. This is where most lifetime cost lives." },
            { op: "Observability", avg: "you can see inside", avgTone: "good", why: "Logs, metrics, and traces let you ask new questions of a running system. A prerequisite for operating anything at scale." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you treat quality attributes as the <em>drivers</em> of the design rather than a checklist
          recited at the end. The signal is prioritization: naming the two or three that matter here and
          consciously sacrificing the rest.
        </Callout>
      </Block>

      <Block eyebrow="the trade-off pairs" title="They pull against each other, on purpose">
        <p className="text-ink-dim leading-relaxed mb-2">
          The reason architecture is hard is that the -ilities are not independent. Optimizing one taxes
          another, and the mature move is to name the tension explicitly:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Consistency vs availability</strong>, the CAP trade: during a network partition you either refuse writes (stay consistent) or serve possibly-stale data (stay available). You cannot have both while partitioned.</li>
          <li><strong>Latency vs cost</strong>, low latency wants caches, replicas, and edge capacity that sits idle for headroom, so the bill rises.</li>
          <li><strong>Availability vs cost</strong>, every extra nine roughly multiplies the redundancy, and therefore the spend and the operational surface.</li>
          <li><strong>Security vs usability</strong>, more auth steps, stricter policies, and least privilege add friction for users and developers.</li>
          <li><strong>Simplicity vs almost everything</strong>, the simplest design is cheapest to run and reason about, but rarely the fastest, most available, or most scalable.</li>
          <li><strong>Time-to-market vs quality</strong>, shipping now buys learning and revenue; it borrows against maintainability, and the interest is tech debt.</li>
        </ul>
        <Callout kind="trap" title="Do not say 'the system will be scalable, reliable, and secure'">
          Claiming to maximize everything is the classic mid-level tell. Real architecture is subtraction:
          you pick the dominant attributes and let the others degrade to a defined floor.
        </Callout>
        <Try label="weigh the -ilities">
          <NfrRadarViz />
        </Try>
      </Block>

      <Block eyebrow="the senior discipline" title="An -ility is not a requirement until it has a number">
        <p className="text-ink-dim leading-relaxed mb-2">
          "The system must be highly available" is not testable, so it is not yet a requirement. The
          architect's job is to turn each attribute into a <strong>quality-attribute scenario</strong>: a
          source, a stimulus, the environment, the expected response, and a <em>measure</em>.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`vague:      "it should be fast and reliable"

measurable (a quality-attribute scenario):
  source      a logged-in user
  stimulus    submits a search
  environment under normal peak load (~2x median)
  response    results returned
  measure     p99 latency under 300 ms, availability 99.9% monthly

now it is testable, and it forces the trade: 99.9% + p99 300ms
picks your replication, caching, and capacity, not the other way round.`}
        />
        <Callout kind="tip" title="Numbers turn opinions into design">
          Once availability is 99.9% and p99 is 300 ms, the architecture is half-decided: those numbers
          choose your redundancy, your caching, and your capacity headroom. Insisting on the number is the
          most senior thing you can do in the first ten minutes.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Which quality attributes dominate this design, and why those?</strong> Tie them to
            business impact: a payments path is availability and consistency first; an internal analytics
            tool is maintainability and cost first. The attributes fall out of what failure actually costs.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you handle a requirement to be both strongly consistent and highly available?</strong>{" "}
            Push back with CAP: during a partition you must choose. I would ask which matters per operation,
            often writes need consistency while reads can tolerate staleness, and split the guarantee by path
            rather than promising both everywhere.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Where do you write these down so they survive the project?</strong> As fitness functions
            and SLOs wired into CI and monitoring, not a slide. A quality attribute that is not continuously
            measured silently rots back into "it should be fast."
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A stakeholder wants five nines everywhere. How do you respond?</strong> Price it. Each
            extra nine multiplies redundancy, testing, and on-call. I show the cost curve and ask which
            journeys genuinely need it, usually a small critical core does and the rest is fine at three
            nines.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Quality attributes, the -ilities, are what actually drive the architecture: performance,
          availability, consistency, scalability, security, maintainability. They trade against each other,
          CAP, latency versus cost, security versus usability, so my job is to name the two or three that
          dominate this system and consciously let the others degrade to a floor. And I make each one
          measurable with a number and a scenario, because 'highly available' is not a requirement until it
          says 99.9% at p99 under 300 milliseconds."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I separate functional requirements, what the system does, from quality attributes, how well it
          does it, because the -ilities are what force the hard calls. I keep a working set: latency and
          throughput, availability and reliability, durability, consistency, scalability, security,
          maintainability, and observability. The point is not to list them, it is to prioritize: for a
          payments flow I lead with availability, consistency, and durability; for an internal reporting
          tool I lead with maintainability and cost. Then I name the tensions out loud, consistency versus
          availability under partition is CAP, low latency and high availability both cost money through
          replicas and redundancy, security taxes usability, and simplicity trades against nearly
          everything, so I pick and I sacrifice on purpose. Finally I make each attribute testable as a
          quality-attribute scenario, source, stimulus, environment, response, measure, so 'fast and
          reliable' becomes p99 under 300 milliseconds at 99.9 percent monthly. Those numbers then choose the
          replication, caching, and capacity, and I wire them into SLOs and CI so they keep being true."
        </Callout>
      </Block>
    </>
  );
}

/* ── SLA / SLO / SLI & error budgets ──────────────────────────── */
function Slos() {
  return (
    <>
      <Lede>
        Reliability only becomes engineering when it is measured. An <strong>SLI</strong> is the
        measurement, an <strong>SLO</strong> is the target you hold yourself to, and an <strong>SLA</strong>{" "}
        is the contract with a customer that has financial teeth. The error budget, one minus the SLO, is the
        insight that turns "be reliable" into a number you can spend.
      </Lede>

      <Block eyebrow="the three terms" title="SLI, SLO, SLA, in order of who they are for">
        <OpTable
          cols={["Term", "Is", "", "For whom"]}
          rows={[
            { op: "SLI (indicator)", avg: "a measurement", avgTone: "good", why: "A ratio of good events to total: successful requests / all requests, or requests under 300 ms / all. The raw signal, from monitoring." },
            { op: "SLO (objective)", avg: "an internal target", avgTone: "ok", why: "The line the SLI must stay above: 99.9% of requests succeed over 30 days. Set by engineering; it drives the error budget." },
            { op: "SLA (agreement)", avg: "an external contract", avgTone: "bad", why: "A promise to customers with penalties (refunds, credits) if missed. Always set looser than the SLO so you breach the SLO first and get warning." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you keep the three distinct and get the direction right: the SLA is the loosest, the SLO is
          tighter, and the SLI is what you actually measure. Candidates who use SLA and SLO interchangeably
          signal they have never operated a service.
        </Callout>
      </Block>

      <Block eyebrow="the currency" title="Nines, and what they cost in real downtime">
        <p className="text-ink-dim leading-relaxed mb-2">
          Availability is quoted in nines, and the jump between them is exponential in effort. The numbers
          worth having memorized:
        </p>
        <OpTable
          cols={["Availability", "Downtime / year", "", "Roughly per month"]}
          rows={[
            { op: "99% (two nines)", avg: "~3.65 days", avgTone: "bad", why: "About 7.2 hours a month. Fine for a back-office batch tool, nowhere near enough for a paid API." },
            { op: "99.9% (three nines)", avg: "~8.76 hours", avgTone: "ok", why: "About 43 minutes a month. The common baseline SLO for standard SaaS." },
            { op: "99.99% (four nines)", avg: "~52.6 minutes", avgTone: "good", why: "About 4.4 minutes a month. Needs multi-AZ redundancy and automated failover; the tier is where cost climbs sharply." },
            { op: "99.999% (five nines)", avg: "~5.26 minutes", avgTone: "good", why: "About 26 seconds a month. Multi-region, heavy automation, rehearsed failover, and a big bill. Reserve for the true critical core." },
          ]}
        />
        <Callout kind="trap" title="p99 latency, not the average">
          Average latency hides the pain: if 1% of requests take 5 seconds, the average may still look fine
          while a real fraction of users suffer. SLOs are written on the tail, p95 or p99, because that is
          what people actually experience, and one slow dependency can dominate it.
        </Callout>
      </Block>

      <Block eyebrow="the key idea" title="Error budget: reliability you are allowed to spend">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>error budget</strong> is <code className="font-mono">1 - SLO</code>. A 99.9% monthly SLO
          gives a budget of 0.1%, about 43 minutes of unreliability a month that you are <em>allowed</em> to
          spend. This reframes reliability from a moral absolute into a resource, and it settles the eternal
          fight between shipping features and staying up.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`SLO            = 99.9% success over 30 days
error budget   = 0.1%  ->  ~43 min/month of allowed failure

budget REMAINING (plenty)   ->  ship freely, take rollout risk
budget EXHAUSTED            ->  freeze feature launches,
                                reliability work preempts features
                                until the budget recovers

100% reliability is the WRONG target: it is impossibly expensive
and it means you are shipping too slowly.`}
        />
        <Callout kind="tip" title="The budget policy is the point">
          The number matters less than the pre-agreed policy: when the budget is healthy you take rollout
          risk, and when it is spent, feature work stops and reliability work takes over automatically. That
          rule, agreed in advance, is what stops the argument happening during an incident.
        </Callout>
      </Block>

      <Block eyebrow="composing them" title="Dependency math and the reliability floor">
        <p className="text-ink-dim leading-relaxed mb-2">
          Availability composes. A request that must call five services in series, each at 99.9%, is at best
          <code className="font-mono"> 0.999^5 ≈ 99.5%</code>, worse than any single dependency. That math
          drives real decisions: reduce the critical-path fan-out, add caching and graceful degradation so a
          slow dependency does not sink the whole request, and make non-critical calls asynchronous.
        </p>
        <p className="text-ink-dim leading-relaxed">
          Distinguish the two recovery numbers: <strong>MTBF</strong> (mean time between failures) is how
          often it breaks, <strong>MTTR</strong> (mean time to recover) is how fast you fix it. For
          availability, MTTR usually has more leverage, you cannot prevent every failure, but fast, automated
          recovery is what keeps the nines.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you choose the SLO number in the first place?</strong> Start from what users
            actually need and what the business will fund, not a round number. Measure current performance for
            a few weeks, set the SLO just above what keeps users happy, and tighten only if the data says the
            pain is real, an unreachable SLO is worse than none.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What happens the month you blow the budget?</strong> The pre-agreed policy fires: feature
            launches freeze, the team redirects to reliability, error handling, retries, capacity, tests,
            until the trailing window recovers. It is automatic precisely so it is not relitigated under
            pressure.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your SLA promises 99.9% but a dependency only offers 99.5%. Now what?</strong> You cannot
            promise more reliability than your critical path delivers. Either add redundancy or a fallback
            around that dependency, take it off the critical path, or renegotiate the SLA down. Promising past
            your dependencies is how you end up paying penalties.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Should the SLO be an average or a percentile?</strong> Percentile, and over a rolling
            window. Averages let a good hour hide a bad one; a 30-day rolling 99.9% at p99 reflects the
            sustained experience and is what the error-budget burn is computed against.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "An SLI is the measurement, the ratio of good events to total; an SLO is the internal target on
          that SLI, say 99.9% over 30 days; and an SLA is the customer contract with penalties, always set
          looser than the SLO so I breach the objective first and get warning. The error budget is one minus
          the SLO, roughly 43 minutes a month at three nines, and I spend it: ship freely while it is
          healthy, freeze features and fix reliability when it is gone. And I write SLOs on the p99 tail, not
          the average, because that is what users feel."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I keep the three terms straight because they are for different people. The SLI is what monitoring
          measures, good requests over total, or requests faster than 300 milliseconds over total. The SLO is
          the internal objective, the line the SLI must hold, 99.9 percent over a rolling 30 days. The SLA is
          the external contract with financial consequences, and I always set it looser than the SLO so I
          breach my own objective first and have room to react before customers are owed credits. The unlock
          is the error budget: one minus the SLO. Three nines is about 43 minutes a month of allowed failure,
          and I treat it as a currency, when the budget is healthy the team ships fast and takes rollout risk,
          and when it is exhausted, a pre-agreed policy freezes features and reliability work takes over. That
          is what ends the features-versus-stability fight, and it is why 100 percent is the wrong target, it
          is impossibly expensive and it means you are shipping too slowly. I write the objective on the
          tail, p95 or p99, because the average hides the slow one percent, and I remember that serial
          dependencies multiply, five services at three nines is only about 99.5, so I shorten the critical
          path and lean on MTTR, fast recovery, more than on preventing every failure."
        </Callout>
      </Block>
    </>
  );
}

/* ── Domain-driven design ─────────────────────────────────────── */
function Ddd() {
  return (
    <>
      <Lede>
        Domain-driven design is about two things: <strong>modeling the domain in the language of the
        business</strong>, and <strong>drawing boundaries</strong> so a large system stays comprehensible.
        The strategic half, bounded contexts and context maps, is where architects earn their keep; the
        tactical half, aggregates and value objects, is how the model holds together inside a boundary.
      </Lede>

      <Block eyebrow="the foundation" title="Ubiquitous language & the bounded context">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>ubiquitous language</strong> is a shared vocabulary, used identically by domain experts
          and in the code, so a "Customer" in conversation is the same "Customer" in the model. The catch is
          that the same word means different things in different parts of the business, and pretending
          otherwise produces a bloated god-model.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>bounded context</strong> is the boundary within which one model and one language are
          consistent. "Customer" in Sales (a lead with a pipeline stage) is genuinely a different model from
          "Customer" in Billing (an account with payment terms). Each gets its own context, its own model,
          and usually its own service and team.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`one word, three models, three bounded contexts:

  Sales context     Product = a thing with a price, a margin, a sales rep
  Catalog context   Product = a thing with photos, descriptions, categories
  Shipping context  Product = a thing with weight, dimensions, a warehouse

do NOT force one shared "Product" object across all three.
each context owns its own model; they exchange IDs and events.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you draw boundaries around <em>meaning</em> and not just around nouns. The senior signal is
          recognizing that one business concept legitimately becomes several models, and that the boundaries
          are where teams, services, and databases should split.
        </Callout>
      </Block>

      <Block eyebrow="inside a boundary" title="Aggregates, entities, value objects">
        <p className="text-ink-dim leading-relaxed mb-2">
          Within a context, DDD gives you tactical building blocks. The one that matters most in interviews is
          the aggregate:
        </p>
        <OpTable
          cols={["Pattern", "Is", "", "Rule of thumb"]}
          rows={[
            { op: "Entity", avg: "has identity over time", avgTone: "good", why: "Defined by an ID, not its attributes: an Order is the same Order even as its contents change." },
            { op: "Value object", avg: "defined by its values", avgTone: "good", why: "No identity, immutable, interchangeable: a Money(10, USD) or an Address. Compare by value, replace rather than mutate." },
            { op: "Aggregate", avg: "a consistency boundary", avgTone: "ok", why: "A cluster of entities and value objects treated as one unit for changes; invariants hold across the whole cluster." },
            { op: "Aggregate root", avg: "the one entry point", avgTone: "ok", why: "The single entity outsiders reference; all changes to the aggregate go through it, so it enforces the invariants." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The <strong>aggregate root</strong> is the enforcement point: outside code holds a reference to the
          root only, never to its internals, and every change goes through it so business invariants (an
          order total equals the sum of its lines, you cannot ship an unpaid order) can never be violated. The
          aggregate is also the natural <strong>transaction boundary</strong>, one aggregate, one transaction,
          and cross-aggregate consistency is reached asynchronously via <strong>domain events</strong>.
        </p>
        <Callout kind="trap" title="Big aggregates kill concurrency">
          Draw the aggregate too large and every change locks a huge object, throttling throughput. Keep
          aggregates small, reference other aggregates by ID, and let eventual consistency and domain events
          stitch them together, that boundary decision is the tactical DDD skill.
        </Callout>
      </Block>

      <Block eyebrow="wiring contexts together" title="Context mapping & the anti-corruption layer">
        <p className="text-ink-dim leading-relaxed mb-2">
          Bounded contexts still have to talk. A <strong>context map</strong> documents the relationships and
          who depends on whom. The patterns you should be able to name:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Anti-corruption layer (ACL)</strong>, a translation layer that converts another context's model into yours, so a messy legacy or third-party model cannot leak in and corrupt your clean one. The single most useful pattern when integrating with anything you do not control.</li>
          <li><strong>Open host service / published language</strong>, a context offers a stable, documented API and schema (an event format, a public contract) that many consumers integrate against.</li>
          <li><strong>Customer / supplier</strong>, a downstream context's needs get prioritized in the upstream's backlog; <strong>conformist</strong> is the weaker version where downstream just accepts whatever upstream provides.</li>
          <li><strong>Shared kernel</strong>, two contexts share a small common model on purpose, with the understanding that changing it requires coordinating both teams. Use sparingly.</li>
        </ul>
        <CodeBlock
          title="text"
          lang="text"
          code={`legacy CRM  --(ugly model)-->  [ Anti-Corruption Layer ]  -->  Orders context
                                    translate their "Acct"          our clean
                                    into our "Customer",            domain model
                                    absorb their quirks here

the ACL is a firewall for your model: their mess stops at the wall.`}
        />
        <Callout kind="tip" title="Bounded contexts map to services and teams">
          This is the through-line to microservices and to Conway's law: a bounded context is a strong
          candidate for a service boundary and an ownership boundary. Getting the contexts right is what keeps
          services loosely coupled instead of a distributed monolith.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you actually find the bounded contexts?</strong> Look for where the language
            changes: when the same word means different things, or different teams care about different
            attributes of the "same" thing, that is a seam. Event storming with domain experts surfaces them
            fast by mapping the flow of domain events.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Should every bounded context be its own microservice?</strong> A context is a candidate
            for a service, not a mandate. Start with contexts as modules in one deployable and split to
            services when a boundary needs independent scaling, deployment, or team ownership, premature
            splitting buys you a distributed monolith.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Two aggregates must change together atomically. What now?</strong> Reconsider the
            boundary first, maybe they are one aggregate. If they genuinely belong apart, do not span a
            transaction; use a domain event and a saga to reach consistency asynchronously, and design the
            compensating action for failure.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Where does an anti-corruption layer live, and what does it cost?</strong> On your side of
            the boundary, as adapter and translation code. It costs an extra hop and mapping to maintain, but
            it buys isolation, when the legacy system changes, only the ACL moves, not your domain model.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "DDD is model the domain in the business's own language and draw boundaries. A bounded context is
          where one model and one ubiquitous language stay consistent, and the same word, Customer, Product,
          becomes a different model in Sales versus Billing versus Shipping, so each gets its own context,
          service, and team. Inside a context, an aggregate is the consistency and transaction boundary and
          the aggregate root is the single entry point that enforces invariants. Contexts integrate through a
          context map, and I put an anti-corruption layer at any boundary with a system I do not control so
          its model cannot leak in."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I split DDD into strategic and tactical. Strategically, the ubiquitous language is a shared
          vocabulary used identically by experts and in code, and the bounded context is the boundary where
          that language stays consistent. The key insight is that one business word honestly means different
          things in different places, Customer in Sales is a lead with a pipeline stage, in Billing an account
          with payment terms, so I model them separately instead of building one bloated shared object, and
          those context boundaries become my service and team boundaries, which is the link to microservices
          and Conway's law. Tactically, inside a context I use entities, which have identity over time, value
          objects, which are immutable and compared by value like Money or Address, and aggregates. An
          aggregate is a cluster treated as one unit for changes, with an aggregate root as the only entry
          point so all invariants are enforced through it, and it is my transaction boundary, one aggregate
          per transaction. I keep aggregates small to protect concurrency and reach cross-aggregate
          consistency with domain events and sagas rather than distributed transactions. To wire contexts
          together I draw a context map and name the relationship, and at any integration with a legacy or
          third-party system I stand up an anti-corruption layer that translates their model into mine, so
          their mess stops at the wall and my domain stays clean."
        </Callout>
      </Block>
    </>
  );
}

/* ── Cloud & Well-Architected ─────────────────────────────────── */
function Cloud() {
  return (
    <>
      <Lede>
        The cloud is not "someone else's computers", it is a shift to <strong>elastic, on-demand,
        managed</strong> infrastructure that rewards a different set of design habits. The Well-Architected
        Framework is the shared checklist every major provider publishes; naming its pillars and the
        cloud-native principles behind them is table stakes in an architect round.
      </Lede>

      <Block eyebrow="the checklist" title="The six Well-Architected pillars">
        <p className="text-ink-dim leading-relaxed mb-2">
          AWS's Well-Architected Framework has six pillars (sustainability was added in 2021). Azure and
          Google publish close equivalents, Azure's has five and folds sustainability into a cross-cutting
          concern, so know the set and note the differences:
        </p>
        <OpTable
          cols={["Pillar", "Asks", "", "In practice"]}
          rows={[
            { op: "Operational excellence", avg: "can you run and improve it?", avgTone: "good", why: "IaC, automation, observability, small reversible changes, and blameless post-incident review. Operations as code." },
            { op: "Security", avg: "is it protected?", avgTone: "good", why: "Least privilege, defense in depth, encryption at rest and in transit, identity as the perimeter, and traceability." },
            { op: "Reliability", avg: "does it recover?", avgTone: "ok", why: "Design for failure: multi-AZ, health checks, automated recovery, backups, and tested disaster recovery (RTO/RPO)." },
            { op: "Performance efficiency", avg: "right resources, right size?", avgTone: "ok", why: "Pick the right service and instance types, use elasticity, and let managed services do undifferentiated heavy lifting." },
            { op: "Cost optimization", avg: "are you paying only for value?", avgTone: "ok", why: "Right-sizing, autoscaling, spot/reserved capacity, storage tiering, and attributing spend to owners (FinOps)." },
            { op: "Sustainability", avg: "minimizing impact?", avgTone: "good", why: "Efficient utilization, right-sizing, and region/architecture choices that cut energy and carbon per unit of work." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you use the pillars as active design lenses, "let me pressure-test this against reliability
          and cost", rather than reciting six words. The signal is applying them to trade-offs in the design
          on the board.
        </Callout>
      </Block>

      <Block eyebrow="who secures what" title="The shared responsibility model">
        <p className="text-ink-dim leading-relaxed mb-2">
          The provider secures the cloud; <em>you</em> secure what you put <em>in</em> it. The line moves with
          the service model, and getting it wrong is how data ends up in a public bucket:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`                     provider secures        you secure
IaaS (VMs)           hardware, hypervisor,   OS, patching, apps,
                     network, facilities     data, IAM, config
PaaS (managed DB)    + the OS and runtime    data, access, app config
SaaS                 + the application       your data, users, access

the more managed the service, the less you run, but you ALWAYS
own your data, your identities, and your access configuration.`}
        />
        <Callout kind="trap" title="The default is not the safe choice">
          Most cloud breaches are misconfiguration, an over-permissive IAM role, an open storage bucket, an
          unencrypted volume, not the provider being hacked. Least privilege and encryption-by-default are
          your side of the line, always.
        </Callout>
      </Block>

      <Block eyebrow="how the cloud wants you to build" title="Cloud-native design principles">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Design for failure</strong>, assume any component can die; use redundancy, health checks, retries with backoff, and automated recovery so a lost node is a non-event.</li>
          <li><strong>Scale horizontally and elastically</strong>, add stateless nodes behind a load balancer and autoscale to demand, rather than buying one ever-bigger box.</li>
          <li><strong>Prefer managed services</strong>, let the provider run the database, queue, and cache so your team spends its scarce time on what differentiates you.</li>
          <li><strong>Infrastructure as code and immutable infrastructure</strong>, define everything in code, and replace servers rather than patching them in place, so environments are reproducible and drift-free.</li>
          <li><strong>Loose coupling</strong>, connect components through queues, events, and APIs so they fail and scale independently.</li>
          <li><strong>Automate everything and right-size continuously</strong>, CI/CD, autoscaling, and cost/utilization reviews are ongoing, not one-time.</li>
        </ul>
        <Callout kind="tip" title="Managed-first is the default senior instinct">
          Unless a service is your core differentiator, rent it. Running your own database or message broker
          is a large, permanent operational tax; the cloud's real value is trading that undifferentiated work
          for engineering focus, and cost optimization is a continuous FinOps discipline, not a one-off.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Multi-cloud, or commit to one provider?</strong> Default to one and use its managed
            services fully; portability-for-its-own-sake taxes every decision. Go multi-cloud only for a real
            driver, regulatory, acquisition, or a specific best-of-breed service, and isolate the coupling
            behind abstractions where you do.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you keep cloud spend from running away?</strong> Make it visible and owned:
            tag-based cost attribution, budgets and alerts, right-sizing and autoscaling, reserved or savings
            plans for steady load, and spot for interruptible work. FinOps is a continuous review, not an
            annual panic.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What is your disaster-recovery posture?</strong> Set it from RTO and RPO, how fast you
            must recover and how much data you can lose. That picks the pattern, backup-and-restore, warm
            standby, or active-active multi-region, and I insist we actually rehearse the failover, an
            untested DR plan is a hope, not a plan.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Serverless or containers?</strong> Serverless for spiky, event-driven, low-ops workloads
            where per-request billing and zero idle cost win; containers for steady, high-throughput, or
            latency-sensitive services where you want control and predictable cost. It is a per-workload call,
            not a religion.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I pressure-test cloud designs against the six Well-Architected pillars, operational excellence,
          security, reliability, performance efficiency, cost optimization, and sustainability, as active
          lenses, not a checklist. I lean on cloud-native principles: design for failure, scale horizontally
          and elastically, prefer managed services so my team works on what differentiates us, and define
          everything as immutable infrastructure-as-code. And I keep the shared responsibility model
          straight, the provider secures the cloud, I secure what is in it, my data, identities, and config,
          because most breaches are misconfiguration, not the provider."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The cloud changes the defaults: infrastructure is elastic, on-demand, and mostly managed, so I
          design differently. I use the Well-Architected Framework as my review lens, six pillars in AWS,
          operational excellence, security, reliability, performance efficiency, cost optimization, and
          sustainability, and I note that Azure and Google publish close equivalents with slightly different
          groupings. Concretely that means: design for failure with multi-AZ redundancy, health checks, and
          automated recovery, because in the cloud any node can vanish; scale horizontally with stateless
          services behind a load balancer and autoscaling rather than buying a bigger machine; and prefer
          managed services for databases, queues, and caches so my scarce engineering time goes to the
          differentiating work, not to operating a broker. Everything is infrastructure as code and immutable,
          I replace rather than patch, so environments are reproducible and drift-free, and components are
          loosely coupled through queues, events, and APIs so they scale and fail independently. On security I
          hold the shared responsibility model firmly: the provider secures the underlying cloud, but I always
          own my data, my identities, and my access configuration, and I default to least privilege and
          encryption everywhere because the common failure is a misconfigured role or an open bucket, not a
          hacked hypervisor. Finally, cost is a continuous FinOps discipline, tagging, right-sizing,
          autoscaling, and reserved-versus-spot capacity, and disaster recovery is driven by explicit RTO and
          RPO targets that we actually rehearse."
        </Callout>
      </Block>
    </>
  );
}

/* ── Migration: strangler fig & 6 R's ─────────────────────────── */
function Migration() {
  return (
    <>
      <Lede>
        Migration is a <strong>risk-management</strong> exercise wearing a technology costume. The winning
        answer is almost never a big-bang rewrite; it is an incremental, reversible sequence, the strangler
        fig for the code, the 6 R's for deciding each workload's fate, and dual-write plus backfill plus
        parity for moving data with zero downtime.
      </Lede>

      <Block eyebrow="the pattern" title="The strangler fig: replace incrementally behind a facade">
        <p className="text-ink-dim leading-relaxed mb-2">
          Named after the vine that grows around a tree and gradually replaces it, the{" "}
          <strong>strangler fig</strong> puts a <strong>facade (a routing proxy)</strong> in front of the
          legacy system, then peels off one capability at a time into a new service and re-points its route.
          Callers never change, because they only ever see the facade, and each cutover is small and
          reversible. When the last capability is out, the monolith is dead code you can decommission.
        </p>
        <Try label="strangler fig">
          <StranglerFigViz />
        </Try>
        <Callout kind="trap" title="The big-bang rewrite is the anti-pattern">
          Rewriting everything and flipping over in one weekend fails for a knowable reason: you change the
          platform and the behavior at once, so every difference is ambiguous, and you have no cheap rollback.
          The strangler fig trades a dramatic launch for a boring, safe, months-long drip, which is exactly
          what senior loops reward.
        </Callout>
      </Block>

      <Block eyebrow="deciding each workload" title="The 6 R's of migration">
        <p className="text-ink-dim leading-relaxed mb-2">
          For a cloud or platform migration, every application gets one of six dispositions. Naming the frame
          and then applying it per workload is the signal of someone who has run a portfolio migration:
        </p>
        <OpTable
          cols={["Disposition", "Means", "", "When to choose it"]}
          rows={[
            { op: "Rehost", avg: "lift and shift", avgTone: "good", why: "Move as-is to the cloud, no code change. Fastest and lowest-risk; captures quick wins, you modernize later." },
            { op: "Replatform", avg: "lift, tinker, and shift", avgTone: "good", why: "Small optimizations en route, e.g. swap a self-managed DB for the managed equivalent, without rearchitecting." },
            { op: "Repurchase", avg: "drop and shop", avgTone: "ok", why: "Replace with a SaaS product (move off a homegrown CRM to a bought one). Retire the code entirely." },
            { op: "Refactor / re-architect", avg: "rebuild cloud-native", avgTone: "bad", why: "Significant redesign (monolith to services, serverless). Highest cost and risk; reserve for workloads that truly earn it." },
            { op: "Retire", avg: "turn it off", avgTone: "good", why: "Nobody uses it. Discovery always finds dead workloads; deletion after sign-off is the cheapest migration there is." },
            { op: "Retain", avg: "leave it, revisit later", avgTone: "ok", why: "Not worth moving now (recent investment, compliance, EOL soon). A deliberate 'not yet', not neglect." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Portfolio thinking and honesty about risk: that you triage workloads instead of refactoring
          everything, that you expect to <em>retire</em> a chunk, and that you sequence low-risk moves first
          to build confidence and tooling.
        </Callout>
      </Block>

      <Block eyebrow="moving the data live" title="Zero-downtime: dual-write, backfill, parity, cutover">
        <p className="text-ink-dim leading-relaxed mb-2">
          The hard part of most migrations is moving a live datastore without downtime or data loss. The
          canonical sequence:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`1. DUAL-WRITE   app writes to BOTH old and new store on every change
                (new store now stays current for all new writes)
2. BACKFILL     batch-copy the historical data old -> new
                (idempotent, resumable, runs while dual-write continues)
3. PARITY       continuously reconcile: row counts, checksums, sampled
                diffs.  do not proceed until old and new agree.
4. SHADOW READ  read from new, compare to old, serve old (still safe)
5. CUTOVER      flip reads to new; keep dual-write a while for rollback
6. DECOMMISSION stop writing old, retire it, after a clean soak

rollback at any step = flip reads back to old (old is still written).`}
        />
        <p className="text-ink-dim leading-relaxed mb-2">
          For schema changes on a single database, the same philosophy is the <strong>expand-contract
          (parallel change)</strong> pattern: add the new column or table (expand), write both and migrate
          readers, then remove the old (contract), so the schema is always compatible with the running code
          and every step is independently deployable and reversible.
        </p>
        <Callout kind="tip" title="Parity is the gate, rollback is the safety net">
          The two non-negotiables: an automated parity check (checksums and sampled diffs) that must pass
          before cutover, and dual-write kept live <em>after</em> cutover so rollback is a one-line route flip,
          not a restore from backup. If you can only say one thing, say "I never cut over until parity is
          green, and I keep the old path writable so rollback is instant."
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you decide the order to strangle capabilities?</strong> Low-risk, low-coupling,
            high-learning first: a leaf capability with few dependencies to shake out the facade and tooling,
            then work toward the core. Save the tightly-coupled, business-critical pieces for when the team
            has reps and confidence.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Dual-write means two writes that can diverge. How do you keep them consistent?</strong>{" "}
            Accept that dual-write is not atomic and lean on the parity job to catch drift, plus idempotent,
            replayable writes. Where correctness is critical I prefer log-based change data capture from the
            old store over application dual-write, one source of truth, fewer race conditions.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>When is a rewrite actually justified over a strangler fig?</strong> Rarely, and only when
            the old system genuinely cannot be extended, the domain is small and well-understood, and the
            business can tolerate a freeze. Even then I would carve it with a facade so I can still cut over
            piecewise and roll back.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The migration is stuck at 80% with a long tail of weird workloads. Now what?</strong>{" "}
            Expected, and I plan for it from day one: the last 20 percent, custom integrations, undocumented
            jobs, one-off dependencies, eats a disproportionate share of time. I staff a dedicated tail lane
            early rather than discovering it late, and I retire aggressively.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Migration is risk management, so I go incremental and reversible, never big-bang. For code, the
          strangler fig: a facade in front of the legacy system, peel off one capability at a time into a new
          service, re-point its route, and each cutover is small and rolls back cleanly until the monolith is
          dead code. For a portfolio I triage with the 6 R's, rehost, replatform, repurchase, refactor,
          retire, retain, cheapest and safest first, and I expect to retire a real chunk. For live data I
          dual-write, backfill history, gate on an automated parity check, then cut over while keeping the old
          path writable so rollback is instant."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I treat migration as a risk-management problem, and the whole strategy is to make every step small
          and reversible. On the code side I use the strangler fig: I put a facade, a routing proxy, in front
          of the legacy system so callers only ever see one stable interface, then I peel capabilities off one
          at a time into new services and re-point the facade's route for each. No caller changes, each
          cutover is tiny, and rollback is just flipping a route back, so when the last capability is out the
          monolith is dead code I can decommission. I avoid the big-bang rewrite because changing platform and
          behavior at once makes every diff ambiguous and leaves no cheap rollback. For a whole portfolio I
          apply the 6 R's per workload, rehost as a fast lift-and-shift, replatform with small optimizations
          like moving to a managed database, repurchase by switching to SaaS, refactor only where it truly
          earns the cost and risk, retire the dead workloads discovery always uncovers, and retain the ones
          not worth moving yet, and I sequence the low-risk moves first to build tooling and confidence. The
          hard part is usually the data, and there I dual-write to old and new stores, backfill history with
          an idempotent resumable job, and run a continuous parity check, row counts, checksums, sampled
          diffs, that must be green before I cut over. I flip reads to the new store but keep dual-write live
          for a soak so rollback is a one-line route flip, not a restore. For schema changes I use
          expand-contract so the database is always compatible with the running code, and I plan for the long
          tail of weird workloads with a dedicated lane from day one."
        </Callout>
      </Block>
    </>
  );
}

/* ── ADRs, C4 & design docs ───────────────────────────────────── */
function Adr() {
  return (
    <>
      <Lede>
        The senior deliverable is not a diagram, it is a <strong>decision that is written down with its
        reasoning</strong>. An ADR captures a single decision and why; C4 gives you diagrams at the right
        altitude for the audience; and a design doc or RFC socializes a proposal <em>before</em> the code
        exists, which is where an architect's real leverage lives.
      </Lede>

      <Block eyebrow="the unit of record" title="The Architecture Decision Record (ADR)">
        <p className="text-ink-dim leading-relaxed mb-2">
          An <strong>ADR</strong> is a short, immutable record of one significant decision, one file per
          decision, versioned in the repo next to the code. The Michael Nygard format is a few core sections
          (context, decision, status, consequences); most teams also add an explicit alternatives section, as
          popularized by MADR:
        </p>
        <OpTable
          cols={["Section", "Captures", "", "Why it matters"]}
          rows={[
            { op: "Title & status", avg: "what, and its state", avgTone: "good", why: "Status is proposed / accepted / deprecated / superseded. ADRs are never edited; a new one supersedes an old one, preserving history." },
            { op: "Context", avg: "the forces at play", avgTone: "good", why: "The problem, constraints, and requirements that made a decision necessary. The 'why now', written so a future reader understands the pressure." },
            { op: "Decision", avg: "what we chose", avgTone: "ok", why: "The choice, stated in the active voice: 'we will use X'. Precise and unambiguous." },
            { op: "Consequences", avg: "what it costs and buys", avgTone: "ok", why: "The results, good and bad: what becomes easier, what becomes harder, what new risk we accept. The honesty here is the signal." },
            { op: "Alternatives considered", avg: "the roads not taken", avgTone: "good", why: "The other options and why they lost. This is what stops the decision being relitigated every six months." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you value the <em>reasoning and the rejected alternatives</em>, not just the final choice. An
          ADR's job is to answer "why did they do it this way?" for the engineer who arrives in two years, and
          to stop settled debates from reopening.
        </Callout>
      </Block>

      <Block eyebrow="diagrams that scale down" title="C4: four levels of zoom">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>C4 model</strong> (Simon Brown) fixes the "our architecture diagram is an unreadable
          spaghetti of boxes" problem by giving you four levels, each for a different audience. You pick the
          altitude; you do not put everything on one page:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`Level 1  Context     the system as one box + its users + external systems
                     audience: everyone, including non-technical stakeholders
Level 2  Container   the deployable/running units inside it: web app, API,
                     database, queue.  audience: architects, senior engineers
Level 3  Component   the major parts inside one container and how they interact
                     audience: developers working in that container
Level 4  Code        classes/functions (usually skip: the IDE shows this)

zoom in only as far as the audience needs. most rounds live at
Context and Container; Component when a service gets interesting.`}
        />
        <Callout kind="tip" title="Match the diagram to the reader">
          The mistake is one diagram trying to serve everyone at once. A Context diagram aligns executives and
          product; a Container diagram is what you draw in a system-design round; a Component diagram is for
          the team building a specific service. Knowing which to show when is the skill.
        </Callout>
      </Block>

      <Block eyebrow="deciding before building" title="Design docs & RFCs">
        <p className="text-ink-dim leading-relaxed mb-2">
          For anything substantial, the highest-leverage artifact is a <strong>design doc (RFC)</strong>
          circulated for review before implementation. It forces the thinking, surfaces objections while they
          are cheap, and creates alignment. A solid structure:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Problem & context</strong>, what we are solving and why now, with the constraints.</li>
          <li><strong>Goals and explicit non-goals</strong>, non-goals are as important as goals; they bound the scope and prevent scope creep in review.</li>
          <li><strong>Proposed design</strong>, the approach, with a C4-style diagram at the right level.</li>
          <li><strong>Alternatives considered</strong>, other options and why they lost, the same discipline as an ADR.</li>
          <li><strong>Risks, trade-offs, and open questions</strong>, named honestly, this is what reviewers engage with.</li>
          <li><strong>Rollout, testing, and operability</strong>, how it ships safely and how it is run and observed.</li>
        </ul>
        <Callout kind="trap" title="Diagrams drift; decisions and prose endure">
          A beautiful diagram with no written reasoning ages badly, nobody remembers why. The durable
          artifacts are the ADR (the decision and its alternatives) and the design doc (the proposal and its
          trade-offs). Treat docs as code: in the repo, reviewed via pull request, and kept current.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>What actually warrants an ADR?</strong> Decisions that are costly to reverse or that
            constrain future work, the database, the sync-versus-async boundary, the auth model, a language or
            framework commitment. Not every choice; the significant, hard-to-undo ones. When in doubt, if
            someone will ask "why is it like this?" in a year, write it.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you keep these docs from going stale?</strong> ADRs are immutable by design, you
            supersede rather than edit, so they never lie, they just become history. Living docs and diagrams
            go in the repo and are updated via the same PR that changes the system, and I lean on
            diagrams-as-code so they are diffable and reviewable.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Someone wants to reverse a decision your ADR recorded. What happens?</strong> Good, that
            is the process working. We write a new ADR that supersedes the old one, referencing it, with the
            new context that changed the calculus. The history stays intact, and the next person sees both the
            original reasoning and why it was revisited.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why write a design doc instead of just building a prototype?</strong> They are
            complementary, but the doc scales the review: ten people can critique a doc in an afternoon and
            catch a fatal flaw before a line of code exists. The prototype answers feasibility questions the
            doc raises; the doc is what creates the alignment.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "My most valuable output is a decision written down with its reasoning. I use ADRs, one immutable
          file per significant decision with context, decision, consequences, and the alternatives considered,
          so nobody relitigates a settled choice and a new hire understands why. I diagram with C4 at four
          levels, context, container, component, code, and show only the altitude the audience needs. And for
          anything substantial I write a design doc or RFC with goals and explicit non-goals, the proposal,
          alternatives, and risks, and circulate it before building so objections surface while they are still
          cheap."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I think the senior deliverable is a decision and its rationale, not a picture. So I lean on three
          artifacts. First, Architecture Decision Records: one short, immutable file per significant decision,
          in the repo, with a fixed shape, title and status, the context and forces, the decision in the
          active voice, the consequences good and bad, and crucially the alternatives I considered and why
          they lost. ADRs are never edited; when a decision changes I write a new one that supersedes the old,
          so the history and the reasoning both survive and settled debates stop reopening. Second, C4 for
          diagrams, because the classic failure is one spaghetti diagram serving everyone. C4 gives four
          zoom levels: Context, the system as a box with its users and neighbors, for any audience; Container,
          the deployable units like the API, the database, the queue, which is what I draw in a design round;
          Component, the internals of one service for its team; and Code, which I usually skip. I show only as
          deep as the reader needs. Third, for anything substantial I write a design doc or RFC and circulate
          it before implementation, problem and context, goals and explicit non-goals, the proposed design
          with a C4 diagram, alternatives, risks and trade-offs, and the rollout and operability plan, because
          ten reviewers can find a fatal flaw in an afternoon, before any code exists. I treat all of it as
          code: in the repo, reviewed by pull request, diagrams generated from text so they stay diffable and
          current."
        </Callout>
      </Block>
    </>
  );
}

/* ── Build vs buy & tech strategy ─────────────────────────────── */
function BuildBuy() {
  return (
    <>
      <Lede>
        Build-versus-buy is really one question: <strong>is this core or context?</strong> Build what
        differentiates you and would be a competitive mistake to outsource; buy, rent, or adopt open source
        for everything else. The decision is made on total cost of ownership and opportunity cost, not the
        sticker price, and it is the most common strategy question in an architect loop.
      </Lede>

      <Block eyebrow="the framing" title="Core vs context">
        <p className="text-ink-dim leading-relaxed mb-2">
          Geoffrey Moore's distinction is the cleanest lens: <strong>core</strong> is the work that
          differentiates you and that customers value directly, your recommendation engine, your pricing
          model, your unique workflow. <strong>Context</strong> is everything necessary but undifferentiated,
          auth, email delivery, payments, observability, a CRM. The heuristic: <em>build the core, buy the
          context</em>, because engineering time spent on context is time not spent on what wins.
        </p>
        <OpTable
          cols={["Lean toward", "When", "", "Because"]}
          rows={[
            { op: "Build", avg: "it is core / differentiating", avgTone: "good", why: "No vendor can give you an edge in the thing that is your edge. Also build when no product fits or lock-in risk is unacceptable." },
            { op: "Buy (SaaS / commercial)", avg: "it is context, mature market", avgTone: "ok", why: "A vendor already solved it well; you get it now, maintained, for a predictable fee. Fastest time-to-value for undifferentiated work." },
            { op: "Adopt open source", avg: "context, but you want control", avgTone: "ok", why: "No license fee and no lock-in, but you own operating and patching it. 'Free' software still costs engineering time." },
            { op: "Partner / outsource", avg: "non-core, lacks in-house skill", avgTone: "ok", why: "Someone else's specialty, temporary or ongoing. Watch the knowledge staying outside your walls." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Business judgment, not a coding reflex. The tell of a strong architect is refusing to build
          undifferentiated plumbing, and reserving precious build capacity for the two or three things that
          actually make the company money.
        </Callout>
      </Block>

      <Block eyebrow="the real math" title="Total cost of ownership, not the sticker price">
        <p className="text-ink-dim leading-relaxed mb-2">
          "Building is free, we already have engineers" is the classic trap. Building has a large, permanent
          cost that never shows up on a purchase order:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`BUY  cost   = license/subscription + integration + vendor mgmt
             + switching risk (lock-in)

BUILD cost = initial build
           + MAINTENANCE FOREVER (the big, hidden line)
           + on-call, security patching, upgrades
           + opportunity cost (what those engineers did NOT build)
           + bus factor / knowledge concentration

the question is never "can we build it?" (usually yes) but
"is building it the best use of our scarcest resource, engineers?"`}
        />
        <Callout kind="trap" title="The sunk maintenance tax">
          Software you build is a liability you maintain for its entire life, patches, upgrades, on-call, the
          engineer who wrote it leaving. A one-month build can be a ten-year maintenance commitment. TCO and
          opportunity cost, not the up-front effort, are the honest comparison.
        </Callout>
      </Block>

      <Block eyebrow="zooming out" title="From one decision to a tech strategy">
        <p className="text-ink-dim leading-relaxed mb-2">
          Individual build-buy calls roll up into a technology strategy, which is the staff/principal layer of
          this topic:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Standardization vs autonomy</strong>, a small set of blessed, well-supported "golden paths" (languages, datastores, deploy tooling) reduces cognitive load and hiring friction; too much standardization starves teams of the right tool. Pave the common road, allow justified exceptions.</li>
          <li><strong>Manage the portfolio like debt</strong>, a tech radar (adopt / trial / assess / hold) makes the standards visible and evolving, and every technology has an end-of-life plan so nothing rots into an unsupported liability.</li>
          <li><strong>Tech debt as a deliberate ledger</strong>, debt is sometimes the right call to hit a market window, but it is tracked and paid down on purpose, not accreted by accident.</li>
          <li><strong>Reversibility over prediction</strong>, favor choices that are cheap to change (behind an abstraction, isolated by a boundary) so a wrong bet costs a refactor, not a rewrite. You will be wrong sometimes; make being wrong cheap.</li>
        </ul>
        <Callout kind="tip" title="Beware lock-in, but do not fear it into paralysis">
          Every buy decision has switching cost; the goal is to enter with eyes open, isolate the vendor
          behind an abstraction where the risk is high, and accept deeper coupling where the managed service's
          value clearly outweighs the lock-in. Portability-for-its-own-sake is its own expensive tax.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>The team wants to build it because it is more interesting. How do you handle that?</strong>{" "}
            Name the bias and redirect it to the business question: is this core? If it is context, I frame the
            opportunity cost, every week here is a week not spent on the differentiator, and channel the
            appetite toward the hard core problems that actually deserve custom engineering.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A bought vendor becomes a bottleneck or raises prices. What is your hedge?</strong> I
            planned for it at purchase: an abstraction layer around the vendor for the higher-risk cases, data
            export and portability checked up front, and a rough exit cost known. For truly critical context I
            might keep a second source or an open-source fallback identified.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What is 'core' can change. How do you revisit these decisions?</strong> Deliberately.
            Something built as a differentiator can commoditize, at which point buying is now right, and vice
            versa. I revisit the big build-buy calls periodically rather than treating them as permanent, and a
            tech radar makes that review a habit.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Open source is free, so why not always adopt it?</strong> Because free-as-in-license is not
            free-as-in-cost: you own operating, scaling, patching, and the security posture. I choose open
            source when I want control and no lock-in and have the capacity to run it; I choose managed or SaaS
            when I would rather rent the operational burden.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Build-versus-buy comes down to core versus context: I build what differentiates us and would be a
          mistake to outsource, and I buy, rent, or adopt open source for the undifferentiated rest, because
          engineering time on context is time not spent on what wins. I decide on total cost of ownership, not
          sticker price, since building means maintaining it forever, on-call, patching, upgrades, plus the
          opportunity cost. And I zoom out to strategy: golden paths for standardization, a tech radar and
          end-of-life plans, tech debt tracked deliberately, and a bias toward reversible choices so being
          wrong is cheap."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I frame build-versus-buy as core versus context. Core is the work that differentiates us and that
          customers value directly, our recommendation logic, our pricing model, the unique workflow, and no
          vendor can hand me an edge in the very thing that is supposed to be my edge, so I build it. Context
          is everything necessary but undifferentiated, auth, email, payments, observability, and there a
          mature vendor has already solved it better than I will, so I buy it, adopt open source if I want
          control without lock-in, or partner if we lack the skill. The decision is made on total cost of
          ownership, and the trap is 'building is free because we have engineers.' Building carries a large
          hidden cost forever: maintenance, on-call, security patching, upgrades, the bus-factor risk when the
          author leaves, and above all the opportunity cost, those engineers are not building the
          differentiator while they babysit undifferentiated plumbing. So the question is never 'can we build
          it,' which is usually yes, but 'is building it the best use of our scarcest resource.' Then I zoom
          out, because individual calls form a strategy: I pave a small set of golden paths so teams share
          blessed languages, datastores, and tooling, while allowing justified exceptions; I run a tech radar
          of adopt, trial, assess, and hold with an end-of-life plan for everything so nothing rots into an
          unsupported liability; I treat tech debt as a deliberate, tracked ledger, sometimes the right bet
          for a market window but paid down on purpose; and I bias toward reversible decisions isolated behind
          abstractions, so when I am wrong, and I will be, it costs a refactor, not a rewrite."
        </Callout>
      </Block>
    </>
  );
}

/* ── Influence, comms & STAR ──────────────────────────────────── */
function Leadership() {
  return (
    <>
      <Lede>
        At staff and principal level the job stops being "make the best decision" and becomes "get the
        organization to make and own a good decision". That is <strong>influence without authority</strong>:
        you rarely command the teams you need to align. The behavioral round tests it, and the way to answer
        is a rehearsed STAR story with a measurable result.
      </Lede>

      <Block eyebrow="the core skill" title="Leading without a org-chart lever">
        <p className="text-ink-dim leading-relaxed mb-2">
          An architect usually cannot order another team to change; you earn the change through credibility,
          data, and a story people can repeat. The moves that actually work:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Lead with the problem and the data</strong>, not your preferred solution. A prototype, a benchmark, or a cost model is more persuasive than authority, and it lets others arrive at the conclusion themselves.</li>
          <li><strong>Understand their incentives</strong>, frame your proposal in terms of what the other team is measured on, not what you want. Alignment beats being right.</li>
          <li><strong>Build coalitions before the meeting</strong>, socialize the idea one-on-one, absorb objections early, and walk into the room with support already in place. Decisions are made before the meeting.</li>
          <li><strong>Disagree and commit</strong>, argue hard, then, once the group decides against you, back the decision fully and publicly. Being a reliable loser of arguments is what earns you the next one.</li>
          <li><strong>Match altitude to audience</strong>, executives want the business outcome and the risk, engineers want the mechanism. The same decision needs two different tellings.</li>
        </ul>
        <Callout kind="note" title="What the interviewer is listening for">
          Evidence that you drive outcomes through people, not just diagrams: coalition-building, framing in
          others' terms, and the maturity to commit to a decision that went against you. "I was right and they
          eventually agreed" scores far lower than "here is how I brought them along."
        </Callout>
      </Block>

      <Block eyebrow="the format" title="STAR, and why the R carries the score">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>STAR</strong> keeps a behavioral answer tight: <strong>Situation</strong> (brief context),
          <strong> Task</strong> (your specific responsibility), <strong>Action</strong> (what <em>you</em>
          {" "}did, "I", not "we"), <strong>Result</strong> (the measurable outcome, plus what you learned).
          Most candidates over-spend on Situation and under-spend on Action and Result, invert that.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`weak:   long backstory, vague team "we did X", no number at the end
strong: 15s Situation -> 10s Task -> 60s Action (YOUR moves, in "I")
                                   -> 15s Result (a metric + a lesson)

keep 2-3 stories rehearsed that each flex to many prompts:
  - influence without authority
  - a decision you got wrong / reversed
  - setting a technical north star`}
        />
        <Callout kind="tip" title="Bank flexible stories, not one per question">
          You cannot pre-write an answer for every prompt, but two or three strong, metric-bearing stories can
          be angled to fit most of them. Rehearse the stories, then in the room pick the one whose lesson fits
          what they actually asked.
        </Callout>
      </Block>

      <Block eyebrow="three scaffolds" title="The stories every architect should have ready">
        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-surface-2 p-3.5">
            <div className="font-mono text-[12px] font-semibold text-ink mb-1.5">Influence without authority</div>
            <div className="space-y-1 text-[13px] leading-relaxed text-ink-dim">
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>S</span>Two teams were about to build overlapping, incompatible services and I owned neither.</p>
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>T</span>Get them onto one shared approach without the authority to mandate it.</p>
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>A</span>I built a quick prototype and a cost comparison, met each lead one-on-one to frame it in their own goals, folded their objections into the design, then brought an already-supported proposal to the group.</p>
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>R</span>One service shipped instead of two, cut an estimated quarter of duplicated effort, and became the template for how we align cross-team work now.</p>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface-2 p-3.5">
            <div className="font-mono text-[12px] font-semibold text-ink mb-1.5">A decision you reversed</div>
            <div className="space-y-1 text-[13px] leading-relaxed text-ink-dim">
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>S</span>I had championed a technology choice that, three months in, was clearly underperforming in production.</p>
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>T</span>Decide whether to keep defending it or change course, and own that publicly.</p>
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>A</span>I gathered the data honestly, wrote a new ADR superseding my own, presented the reversal with the evidence and the cost of switching, and led the migration.</p>
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>R</span>Latency dropped and the team trusted me more, not less, because I optimized for being right over having been right. The lesson: cheap reversibility and visible self-correction beat ego.</p>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface-2 p-3.5">
            <div className="font-mono text-[12px] font-semibold text-ink mb-1.5">Setting a technical north star</div>
            <div className="space-y-1 text-[13px] leading-relaxed text-ink-dim">
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>S</span>Several teams were drifting in different architectural directions with no shared target.</p>
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>T</span>Create a technical vision people would actually align to, without turning it into an ivory-tower mandate.</p>
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>A</span>I wrote a short north-star document with clear principles and golden paths, pressure-tested it with each team, and left room for justified exceptions so it read as enabling, not policing.</p>
              <p><span className="font-mono text-[10px] uppercase tracking-wider mr-2" style={{ color: ACCENT }}>R</span>New services converged on the shared patterns, onboarding got faster, and the document became the reference for design reviews. The lesson: a vision adopted voluntarily outlasts one imposed.</p>
            </div>
          </div>
        </div>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Tell me about a time you failed.</strong> Pick a real failure with a genuine lesson and
            own your part in "I", no hiding behind "we". The Result is what you changed afterward; a failure
            story with no learning is just a failure, and interviewers can tell the difference.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you handle a senior engineer who won't get on board?</strong> Understand the
            objection first, it is often a real risk I have not weighed. If it survives that, I find the
            smallest experiment that resolves the disagreement with data, and if we still differ, I escalate
            the decision transparently rather than steamrolling, then disagree-and-commit whichever way it
            lands.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your answers all worked out. Give me one where influence failed.</strong> Have one ready:
            a time I could not build the coalition and the decision went another way. The mature version owns
            what I misjudged, usually not understanding a stakeholder's real incentive early enough, and what I
            do differently now.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you communicate the same architecture to a CTO and to the implementing
            team?</strong> Two tellings. The CTO gets business outcome, cost, and risk in a one-page context
            view; the team gets the container and component detail and the trade-offs they will live with.
            Same decision, different altitude, and I never make an exec parse a component diagram.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "At this level the work is influence without authority: I rarely command the teams I need, so I lead
          with the problem and the data, frame it in the other team's incentives, build the coalition
          one-on-one before the meeting, and disagree-and-commit once we decide. In the behavioral round I
          tell that as a tight STAR story, mostly Action and a measured Result, in 'I' not 'we', and I keep
          two or three flexible stories banked: influence without authority, a decision I reversed, and
          setting a technical north star."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Here is how I would actually run a behavioral answer as an architect. First, I know the round is
          testing influence without authority, because at staff and principal I almost never own the teams I
          need to move, so my meta-script is: pick the story whose lesson fits the prompt, then deliver it in
          STAR with the weight on Action and Result. For influence, I would tell the time two teams were about
          to build overlapping services I did not own: the Situation and Task in about twenty seconds, then
          the Action in first person, I built a prototype and a cost model rather than pulling rank, met each
          lead one-on-one to frame the idea in what their team was measured on, folded their objections into
          the design, and walked into the group meeting with support already lined up, and I close on a
          measured Result, one service instead of two and roughly a quarter of the duplicated effort saved,
          plus the lesson that decisions are made before the meeting. I keep two more stories loaded and
          flexible: a decision I reversed, where I wrote a new ADR superseding my own and the team trusted me
          more for optimizing being right over having been right, and setting a technical north star, where a
          short principles-and-golden-paths document that I pressure-tested with each team got voluntary
          adoption because it enabled rather than policed. Throughout, I match altitude to audience, outcome
          and risk for executives, mechanism for engineers, and if the interviewer pushes on failure I give a
          real one in 'I' with what I changed afterward, because a failure with no learning is just a failure."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ───────────────────────────────────── */
const DECK = [
  {
    q: "What are 'quality attributes' (the -ilities), and how do they differ from functional requirements?",
    a: "Functional requirements say what the system does; quality attributes say how well: performance, availability, scalability, security, maintainability, and so on. They are the real architecture drivers because they trade against each other, and the senior move is prioritizing two or three and consciously sacrificing the rest.",
    tag: "quality attributes",
  },
  {
    q: "When is a quality attribute actually a requirement?",
    a: "Only when it is measurable, a number plus a scenario. 'Highly available' is not testable; '99.9% monthly at p99 under 300 ms' is. As a quality-attribute scenario: source, stimulus, environment, response, and a measure.",
    tag: "quality attributes",
  },
  {
    q: "Explain the consistency-vs-availability trade-off (CAP).",
    a: "During a network partition you must choose: stay consistent by refusing writes, or stay available by serving possibly-stale data. You cannot have both while partitioned. Outside a partition you can have both; CAP is about the partition case.",
    tag: "quality attributes",
  },
  {
    q: "SLI vs SLO vs SLA?",
    a: "SLI is the measurement (good events / total). SLO is the internal target on that SLI (e.g. 99.9% over 30 days). SLA is the external customer contract with penalties. Set the SLA looser than the SLO so you breach your own objective first and get warning.",
    tag: "reliability",
  },
  {
    q: "What is an error budget and how do you use it?",
    a: "Error budget = 1 - SLO, the amount of unreliability you are allowed. Three nines is about 43 minutes a month. Spend it: ship fast while it is healthy, and when it is exhausted a pre-agreed policy freezes features and reliability work takes over.",
    tag: "reliability",
  },
  {
    q: "Why measure latency at p99, not the average?",
    a: "The average hides the tail. If 1% of requests take 5 seconds, the average looks fine while real users suffer. SLOs are written on p95/p99 because that is what people actually experience, and one slow dependency can dominate it.",
    tag: "reliability",
  },
  {
    q: "How much downtime is 99.9% vs 99.99% per year?",
    a: "99.9% (three nines) is about 8.76 hours a year (~43 min/month). 99.99% (four nines) is about 52.6 minutes a year (~4.4 min/month). Each extra nine roughly multiplies the redundancy, cost, and operational effort.",
    tag: "reliability",
  },
  {
    q: "What is a bounded context?",
    a: "The boundary within which one domain model and one ubiquitous language stay consistent. The same word (Customer, Product) legitimately becomes a different model in different contexts, so each gets its own model, and usually its own service and team.",
    tag: "DDD",
  },
  {
    q: "What is an aggregate root?",
    a: "The single entry point to an aggregate (a cluster treated as one unit for changes). Outside code references only the root; all changes go through it so it enforces the aggregate's invariants. The aggregate is also the transaction boundary.",
    tag: "DDD",
  },
  {
    q: "What is an anti-corruption layer?",
    a: "A translation layer at a context boundary that converts another system's model into yours, so a messy legacy or third-party model cannot leak in and corrupt your clean domain. It is a firewall for your model when integrating with something you do not control.",
    tag: "DDD",
  },
  {
    q: "What is the ubiquitous language?",
    a: "A shared vocabulary used identically by domain experts and in the code, valid within one bounded context. It keeps the model and the business conversation in sync, and its boundaries reveal where contexts (and services) should split.",
    tag: "DDD",
  },
  {
    q: "Name the six Well-Architected pillars.",
    a: "Operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability (added by AWS in 2021). Azure and Google publish close equivalents. Use them as active review lenses on the design, not a recited checklist.",
    tag: "cloud",
  },
  {
    q: "What does the shared responsibility model say?",
    a: "The provider secures the cloud (hardware, hypervisor, network); you secure what you put in it (data, identities, access config, and more as you move from SaaS to IaaS). Most breaches are misconfiguration on your side, an open bucket or over-broad IAM, not the provider.",
    tag: "cloud",
  },
  {
    q: "Explain the strangler fig pattern.",
    a: "Put a facade/proxy in front of a legacy system, then peel off one capability at a time into a new service and re-point its route. Callers never change, each cutover is small and reversible, and when the last capability is out the monolith is dead code you decommission. The alternative to a risky big-bang rewrite.",
    tag: "migration",
  },
  {
    q: "What are the 6 R's of migration?",
    a: "Rehost (lift-and-shift), replatform (lift-tinker-shift), repurchase (move to SaaS), refactor/re-architect (rebuild cloud-native), retire (turn off the dead ones), retain (leave for now). You triage each workload; expect to retire a real chunk and sequence low-risk moves first.",
    tag: "migration",
  },
  {
    q: "How do you migrate a live datastore with zero downtime?",
    a: "Dual-write to old and new, backfill history with an idempotent resumable job, run a continuous parity check (counts, checksums, sampled diffs) that must be green, then cut reads over while keeping dual-write live so rollback is a one-line route flip. Parity is the gate; the old writable path is the safety net.",
    tag: "migration",
  },
  {
    q: "What sections make up an ADR?",
    a: "Title and status (proposed/accepted/deprecated/superseded), context (the forces), decision (what we chose, active voice), consequences (good and bad), and alternatives considered. ADRs are immutable, one per decision; a new one supersedes an old one so history and reasoning survive.",
    tag: "docs",
  },
  {
    q: "What are the four C4 levels?",
    a: "Context (the system as a box with users and neighbors), Container (the deployable units: app, API, database, queue), Component (the internals of one container), and Code (usually skipped). Zoom only as far as the audience needs; design rounds live at Context and Container.",
    tag: "docs",
  },
  {
    q: "How do you frame a build-vs-buy decision?",
    a: "Core vs context: build what differentiates you and would be a mistake to outsource; buy, rent, or adopt open source for the undifferentiated rest. Decide on total cost of ownership, not sticker price, building means maintaining it forever plus the opportunity cost of what those engineers did not build.",
    tag: "strategy",
  },
  {
    q: "What is 'influence without authority', and how do you show it?",
    a: "Driving decisions across teams you do not command: lead with the problem and data, frame it in the other team's incentives, build the coalition one-on-one before the meeting, and disagree-and-commit once decided. In a behavioral round you show it with a STAR story, heavy on Action and a measured Result.",
    tag: "leadership",
  },
];

function Quickfire() {
  return (
    <>
      <Lede>
        Twenty cards spanning the whole tool, the -ilities and their trade-offs, SLO/SLI/SLA and error
        budgets, DDD, the six pillars, migration patterns, ADRs and C4, and build-versus-buy. Read the
        prompt, answer out loud in a sentence or two, then reveal and grade yourself. Out loud is the rep.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  nfr: <Nfr />,
  slos: <Slos />,
  ddd: <Ddd />,
  cloud: <Cloud />,
  migration: <Migration />,
  adr: <Adr />,
  buildbuy: <BuildBuy />,
  leadership: <Leadership />,
  quickfire: <Quickfire />,
};

export default function ArchitectRole() {
  const [active, setActive] = useState("nfr");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Decisions & leadership · SHOULD WE"
      title="Architect's Role & Decisions"
      subtitle="The senior lens: name the quality attributes, model the domain, document the decision, and carry the room."
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
