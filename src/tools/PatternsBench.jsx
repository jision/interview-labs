import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import StyleMatchViz from "./patterns/StyleMatchViz.jsx";
import CircuitBreakerViz from "./patterns/CircuitBreakerViz.jsx";

const ACCENT = "#f26d9c";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "monolithmicro", label: "Monolith to microservices", group: "Styles" },
  { id: "layering", label: "Layered, hexagonal & clean", group: "Styles" },
  { id: "eventdriven", label: "Event-driven & messaging", group: "Styles" },
  { id: "cqrses", label: "CQRS & event sourcing", group: "Decomposition & data" },
  { id: "saga", label: "Saga: orchestration vs choreography", group: "Decomposition & data" },
  { id: "meshbff", label: "Gateway, BFF & service mesh", group: "Decomposition & data" },
  { id: "resilience", label: "Resilience patterns", group: "Resilience" },
  { id: "failover", label: "Failover, HA & multi-region", group: "Resilience" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* ── Monolith to microservices ────────────────────────────────── */
function MonolithMicro() {
  return (
    <>
      <Lede>
        "Would you use microservices here?" is a trap when you answer with a reflex. The senior answer names
        a <em>break-even</em>: microservices buy team autonomy and independent scaling at the price of a
        permanent distributed-systems tax, and below a certain org and domain size that trade loses. The
        strongest default in 2024-2026 is a modular monolith you can carve later, not a mesh of services you
        regret.
      </Lede>

      <Block eyebrow="the spectrum" title="Three points, not two">
        <p className="text-ink-dim leading-relaxed mb-2">
          It is not monolith versus microservices. There is a middle that wins most of the time:
        </p>
        <OpTable
          cols={["Style", "What it is", "", "Character"]}
          rows={[
            { op: "Big-ball-of-mud monolith", avg: "one deploy, no seams", avgTone: "bad", why: "One codebase with no internal boundaries. Fast at first, then every change risks everything. The thing people are fleeing when they say 'monolith'." },
            { op: "Modular monolith", avg: "one deploy, hard seams", avgTone: "good", why: "One deployable, but strict module boundaries (packages, enforced dependencies, separate schemas). Ships fast, and the seams become extraction points later." },
            { op: "Microservices", avg: "many deploys, network seams", avgTone: "ok", why: "Independent services per capability, each owning its data and deploy. Buys autonomy and independent scaling; pays a network, ops, and consistency tax on every call." },
          ]}
        />
        <Callout kind="tip" title="Modularity is free; distribution is not">
          A module boundary and a service boundary enforce the same discipline, but only the service
          boundary adds network latency, partial failure, and distributed data. Get the boundaries right in
          a monolith first; promote a module to a service only when a concrete force demands it.
        </Callout>
      </Block>

      <Block eyebrow="the economics" title="The break-even">
        <p className="text-ink-dim leading-relaxed mb-2">
          Microservices carry a large <strong>fixed cost</strong> that a monolith does not: service
          discovery, network calls, distributed tracing, per-service CI/CD, data consistency across stores,
          and the on-call surface of many moving parts. In return they lower the <strong>marginal cost</strong>{" "}
          of adding teams and scaling hot spots independently. The curves cross at a break-even that is about
          organization and domain size, not fashion.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`effort
  |                                   monolith (coordination cost
  |                                   climbs as teams pile onto
  |                              ..--  one codebase and deploy)
  |                        ..--''
  |  microservices    ..-''
  |  (high flat tax) -''----------------------
  |  ______________/
  +----------------|--------------------------> org size / domain complexity
                break-even
  left of it  -> monolith is cheaper and faster
  right of it -> the distributed tax pays for itself in autonomy`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you can name the trade instead of picking a side. Strong candidates say "microservices are
          an organizational scaling tool with a fixed operational tax" and then locate the specific team,
          scaling, or change-rate pressure that moves this system past the break-even.
        </Callout>
      </Block>

      <Block eyebrow="the anti-pattern" title="The distributed monolith">
        <p className="text-ink-dim leading-relaxed mb-2">
          The worst outcome is not a monolith, it is a <strong>distributed monolith</strong>: services split
          on the network but still coupled so tightly that you pay every distribution cost and get none of
          the independence. The tells are concrete, and interviewers probe for them:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Lock-step deploys</strong>, you cannot release service A without releasing B and C together.</li>
          <li><strong>A shared database</strong>, multiple services read and write the same tables, so no one owns their data and schema changes ripple everywhere.</li>
          <li><strong>Deep synchronous call chains</strong>, a request fans through five services in series, so latency adds up and any one being down fails the whole thing.</li>
          <li><strong>Chatty coupling</strong>, entities are so split that one use case needs a dozen cross-service round trips.</li>
        </ul>
        <Callout kind="trap" title="Splitting on the wrong seam builds this by accident">
          Slicing by technical layer (a "controller service," a "database service") instead of by business
          capability guarantees a distributed monolith. Each request has to traverse every service, so you
          get network hops without independence. Split along bounded contexts, where a slice owns its data
          and its decisions.
        </Callout>
      </Block>

      <Block eyebrow="the decision" title="When to actually split">
        <p className="text-ink-dim leading-relaxed mb-2">
          Extract a service when a module has a distinct <em>force</em> that a shared deploy cannot serve.
          The honest triggers:
        </p>
        <OpTable
          cols={["Force", "Signal", "", "Why a service, not a module"]}
          rows={[
            { op: "Team autonomy", avg: "many teams, one codebase", avgTone: "good", why: "Merge queues, coordinated releases, and blast radius across teams. A service gives a team its own deploy and on-call." },
            { op: "Independent scaling", avg: "one hot path, uniform rest", avgTone: "good", why: "One capability needs 20x the compute of the others. A service scales it alone instead of scaling the whole monolith." },
            { op: "Distinct availability", avg: "one part must never go down", avgTone: "ok", why: "Isolating a critical capability limits blast radius, though a bulkhead inside the monolith may suffice first." },
            { op: "Different rate of change", avg: "one area churns constantly", avgTone: "ok", why: "A fast-churning capability benefits from its own release cadence and tech choices." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-1">
          Use the toggles below to feel how team shape, deploy needs, scaling profile, and interaction style
          push toward a modular monolith, microservices, or an event-driven style.
        </p>
        <Try label="pick a style">
          <StyleMatchViz />
        </Try>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A team says microservices will make them faster. Do you believe it?</strong> Only past
            the break-even. For a small team on one product, microservices usually make them slower: they
            trade in-process calls for network calls and add ops they did not have. Faster comes from clear
            module boundaries first; services help when many teams are contending on one deploy.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you extract the first service from a monolith?</strong> Strangler-fig: pick a
            module that already has a clean seam and a distinct force, put a facade in front, route that
            capability to a new service, and move its data last with a migration and dual-write or CDC. Never
            a big-bang rewrite; extract one bounded context, prove the pattern, repeat.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your services share one database. What breaks and how do you fix it?</strong> That is a
            distributed monolith: schema changes couple every service and no one owns their data. Fix it by
            giving each service its own store (database-per-service), replacing cross-service reads with APIs
            or events, and accepting eventual consistency where a foreign key used to be.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>When would you merge microservices back into a monolith?</strong> When the split was
            premature: services always deploy together, the team is small, and cross-service debugging eats
            more time than it saves. Consolidating back to a modular monolith is a legitimate, senior move,
            not a failure.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Microservices are an organizational scaling tool with a fixed distributed-systems tax, network,
          ops, and data consistency. Below a break-even set by team count and domain complexity, a modular
          monolith ships faster and is cheaper to run. So my default is a modular monolith with hard internal
          seams, and I extract a service only when a module has a distinct force, a team that needs autonomy,
          a hot path that must scale alone, or a critical availability boundary. The failure mode I avoid is
          the distributed monolith: services that still deploy in lock-step and share a database."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I frame it as three points on a spectrum, not two. A big-ball-of-mud monolith has no seams and
          gets scary to change. A modular monolith is one deployable with strict module boundaries and
          separate schemas, and it is the strongest default because it ships fast and the seams become
          extraction points. Microservices sit past a break-even: they lower the marginal cost of adding
          teams and scaling hot spots, but they add a large fixed cost you pay on every call. The mistake I
          watch for is the distributed monolith, splitting on technical layers or over a shared database, so
          you get lock-step deploys, deep synchronous chains, and chatty coupling, all the costs of
          distribution and none of the independence. When I do split, I split along bounded contexts where a
          slice owns its data and decisions, and I do it with the strangler-fig pattern: facade, route one
          capability out, move its data last. And I am comfortable merging services back into a monolith when
          an early split turned out to be premature."
        </Callout>
      </Block>
    </>
  );
}

/* ── Layered, hexagonal & clean ───────────────────────────────── */
function Layering() {
  return (
    <>
      <Lede>
        These three are all answers to one question: where do the dependencies point? Classic layering lets
        them point downward into the database, so the schema ends up driving the domain. Hexagonal and clean
        architecture invert that, the domain sits at the center and depends on nothing, and everything else
        plugs into interfaces the domain owns. The payoff is testability and swappable infrastructure.
      </Lede>

      <Block eyebrow="the classic" title="Layered (n-tier), and why it drifts">
        <p className="text-ink-dim leading-relaxed mb-2">
          The traditional stack is presentation over business logic over data access over the database. Each
          layer calls the one below. It is simple and universally understood, and for a CRUD app it is
          genuinely fine. The problem is the direction of dependency: business logic depends on the data
          layer, which depends on the database, so over time the <strong>database schema becomes the center
          of gravity</strong> and domain rules leak into SQL and ORM entities.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`[ presentation ]   controllers, views
       |  (depends on)
       v
[ business logic ]   services, rules
       |  (depends on)
       v
[ data access ]      repositories, ORM
       |  (depends on)
       v
[  database  ]  <-- everything ultimately points here,
                    so the schema ends up shaping the domain`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you can state the dependency rule and its consequence, not just draw boxes. The signal is
          "in layering the domain depends on the database; in hexagonal and clean the database depends on the
          domain," followed by why that inversion buys testability.
        </Callout>
      </Block>

      <Block eyebrow="the inversion" title="Hexagonal: ports and adapters">
        <p className="text-ink-dim leading-relaxed mb-2">
          Alistair Cockburn's hexagonal architecture puts the <strong>domain at the center</strong>. The
          domain defines <strong>ports</strong>, interfaces it owns, and the outside world connects through{" "}
          <strong>adapters</strong> that implement or drive those ports. Two kinds: driving adapters (HTTP
          handlers, CLI, message consumers) call inbound ports; driven adapters (a Postgres repository, an
          email sender, a payment gateway) implement outbound ports. Every dependency points{" "}
          <em>inward</em>, so the domain has no idea whether it is talking to Postgres or an in-memory fake.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`        driving side (inbound)          driven side (outbound)
   HTTP  ->\\                                   /-> Postgres adapter
   CLI   -> [ inbound port ] DOMAIN [ outbound port ] -> email adapter
   queue ->/    (use cases + entities, depends on NOTHING outside)  \\-> payment adapter

  the domain OWNS the port interfaces; adapters implement them.
  dependencies point inward -> infra is a plug-in detail.`}
        />
        <Callout kind="tip" title="A port is an interface the domain owns; an adapter implements it">
          The one-liner that lands: "the repository interface lives in the domain, the Postgres
          implementation lives in infrastructure, and dependency injection wires them at the edge." That is
          the whole pattern, and it is why you can unit-test the domain with fakes and no database.
        </Callout>
      </Block>

      <Block eyebrow="the same idea, concentric" title="Clean & onion architecture">
        <p className="text-ink-dim leading-relaxed mb-2">
          Clean architecture (Robert Martin) and onion architecture are the same principle drawn as
          concentric rings. Entities at the core, use cases around them, interface adapters next, frameworks
          and drivers on the outside. The one law is the <strong>dependency rule</strong>: source-code
          dependencies point only inward, and inner rings know nothing about outer rings. Hexagonal, clean,
          and onion differ in vocabulary and how many rings they draw, but they all enforce dependency
          inversion so business rules never depend on a framework.
        </p>
        <OpTable
          cols={["Property", "Layered (n-tier)", "", "Hexagonal / clean"]}
          rows={[
            { op: "Dependency direction", avg: "domain -> database", avgTone: "bad", why: "Business logic depends on data access and the schema, so the database shapes the domain." },
            { op: "Testability", avg: "needs the real DB", avgTone: "ok", why: "Hexagonal tests the domain with fake adapters, no database, fast and deterministic unit tests." },
            { op: "Swapping infrastructure", avg: "invasive", avgTone: "bad", why: "In hexagonal you write a new adapter for the same port; the domain never changes." },
            { op: "Best fit", avg: "simple CRUD apps", avgTone: "ok", why: "Layering is fine for thin CRUD; hexagonal earns its complexity when the domain is rich and long-lived." },
          ]}
        />
        <Callout kind="trap" title="Do not cargo-cult the hexagon onto a CRUD app">
          Ports and adapters add indirection. For a thin CRUD service, plain layering is the right amount of
          structure. The pattern pays off when the domain has real rules worth isolating from frameworks and
          when you expect the infrastructure to change under you. Say that trade instead of defaulting to the
          most elaborate diagram.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Where does the repository interface live, domain or infrastructure?</strong> The
            interface lives in the domain (it is an outbound port the domain owns); the concrete Postgres or
            Mongo implementation lives in infrastructure. That single placement decision is what makes the
            dependency point inward and the domain testable.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How does this change your tests?</strong> The domain and use cases get fast unit tests
            against in-memory fake adapters, no database or network. Adapters get their own narrow
            integration tests against the real infrastructure. You stop needing a full environment to test a
            business rule, which is the practical reason teams adopt it.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Is hexagonal at odds with microservices?</strong> No, they are orthogonal. Hexagonal is
            the internal structure of one service or one modular monolith; microservices is how services are
            distributed. A good microservice is often hexagonal inside, and a modular monolith can be
            hexagonal per module.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Doesn't all this indirection slow the team down?</strong> On a rich domain it speeds them
            up, because changes stay local and tests are fast. On a thin CRUD app it is overhead, so I do not
            impose it there. The judgment call, not the dogma, is the senior signal.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "All three are about where dependencies point. Classic layering points the domain down into the
          data layer and the database, so the schema ends up driving the domain and you need the real
          database to test anything. Hexagonal, or ports and adapters, inverts that: the domain sits at the
          center and defines port interfaces it owns, and adapters for HTTP, Postgres, or a queue plug in
          from outside, with all dependencies pointing inward. Clean and onion architecture are the same
          dependency rule drawn as concentric rings. The payoff is fast domain tests with fakes and swappable
          infrastructure. I use plain layering for thin CRUD and reach for hexagonal when the domain is rich
          and long-lived."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Layered architecture, presentation, business, data access, database, is simple and fine for CRUD,
          but its dependencies point downward, so the domain depends on the data layer and the schema becomes
          the center of gravity. That makes business rules leak into the ORM and forces a real database into
          every test. Hexagonal architecture inverts the dependency: the domain owns port interfaces, driving
          adapters like HTTP handlers and message consumers call inbound ports, and driven adapters like a
          Postgres repository or an email sender implement outbound ports. The concrete rule is that the
          repository interface lives in the domain and the Postgres implementation lives in infrastructure,
          wired by dependency injection at the edge, so the domain has no compile-time knowledge of its
          infrastructure. Clean and onion architecture express the same dependency rule as rings with
          entities at the core. Practically this buys two things: I can unit-test the domain with in-memory
          fakes, fast and deterministic, and I can swap infrastructure by writing a new adapter without
          touching business logic. It is orthogonal to microservices, it is the inside of a service, and I
          only pay for it when the domain has rules worth protecting from frameworks."
        </Callout>
      </Block>
    </>
  );
}

/* ── Event-driven & messaging ─────────────────────────────────── */
function EventDriven() {
  return (
    <>
      <Lede>
        Event-driven architecture swaps synchronous "call and wait" for asynchronous "publish and react."
        It buys temporal decoupling, independent scaling, and easy fan-out, at the cost of eventual
        consistency and much harder debugging. The senior competencies are precise: what a broker guarantees,
        which delivery semantics you actually get, and why exactly-once end to end is a myth you engineer
        around with idempotency.
      </Lede>

      <Block eyebrow="the three flavors" title="What is actually in the message">
        <p className="text-ink-dim leading-relaxed mb-2">
          "Event-driven" hides three different contracts, and naming the right one is half the battle:
        </p>
        <OpTable
          cols={["Style", "Message says", "", "Trade"]}
          rows={[
            { op: "Event notification", avg: "'something happened'", avgTone: "good", why: "A thin event (OrderPlaced, id only). Consumers call back for details. Minimal coupling, but chatty and creates read dependencies." },
            { op: "Event-carried state transfer", avg: "'here is the new state'", avgTone: "ok", why: "The event carries the data consumers need, so they keep local copies and stop calling back. Decoupled and fast, at the cost of duplication and staleness." },
            { op: "Command", avg: "'do this'", avgTone: "ok", why: "A directed instruction to one handler (unlike an event, which is a fact broadcast to whoever cares). Use it when you mean to trigger a specific action." },
          ]}
        />
        <Callout kind="tip" title="Event vs command, in one line">
          An <strong>event</strong> is an immutable fact in the past tense, broadcast to zero or more
          consumers ("OrderPlaced"). A <strong>command</strong> is an instruction in the imperative, sent to
          exactly one handler ("PlaceOrder"). Confusing the two is how you accidentally couple a producer to
          a consumer it should not know about.
        </Callout>
      </Block>

      <Block eyebrow="the plumbing" title="Queue vs log, and the brokers">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two broker models, and the difference decides replay. A <strong>traditional queue</strong> deletes
          a message once a consumer acknowledges it: point-to-point, competing consumers, no history. A{" "}
          <strong>log</strong> keeps an ordered, replayable record and tracks each consumer's offset:
          multiple independent consumer groups, replay from any point, retention measured in days.
        </p>
        <OpTable
          cols={["Broker", "Model", "", "Reach for it when"]}
          rows={[
            { op: "Kafka / Redpanda", avg: "partitioned log", avgTone: "good", why: "High throughput, ordered per partition, retention and replay, many consumer groups. The default for event streaming and event sourcing." },
            { op: "RabbitMQ", avg: "queue + routing", avgTone: "ok", why: "Rich routing (exchanges, topics), per-message ack, priorities. Great for task queues and complex routing; not a replay log." },
            { op: "SQS + SNS", avg: "managed queue + fan-out", avgTone: "ok", why: "SQS is a managed queue, SNS fans out to many SQS/HTTP subscribers. Zero ops on AWS; ordering only via FIFO queues." },
            { op: "Pulsar", avg: "log + queue hybrid", avgTone: "ok", why: "Separates compute from storage (BookKeeper), supports both streaming and queue semantics and tiered storage." },
          ]}
        />
        <CodeBlock
          title="text"
          lang="text"
          code={`producer --> [ topic: 3 partitions ] --> consumer group A (offset 402)
                 p0 [....x....]        \\-> consumer group B (offset 118, replaying)
                 p1 [......x..]
                 p2 [...x.....]   ordering is per PARTITION, not global.
                                  key -> partition, so same key stays ordered.`}
        />
      </Block>

      <Block eyebrow="the hard guarantees" title="Delivery semantics and ordering">
        <p className="text-ink-dim leading-relaxed mb-2">
          This is where interviews are won. Three delivery semantics, and you almost always live with the
          middle one:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>At-most-once</strong>, fire and forget; a crash before processing loses the message. Cheap, lossy, rarely what you want.</li>
          <li><strong>At-least-once</strong>, retry until acknowledged, so a crash after processing but before ack redelivers. The practical default, and it means <em>duplicates are guaranteed</em>.</li>
          <li><strong>Exactly-once</strong>, no loss and no duplicates end to end. Real inside one system (Kafka transactions across topics), but a myth across a broker, your service, and an external database.</li>
        </ul>
        <Callout kind="trap" title="Exactly-once end to end is a myth; engineer effectively-once">
          You get at-least-once delivery plus an <strong>idempotent consumer</strong> (dedupe on a message
          id, or make the write naturally idempotent like an upsert), which yields effectively-once{" "}
          <em>results</em>. Say that sentence unprompted. Also: <strong>ordering is per partition</strong>,
          not global, so route by a key (order id) when order within an entity matters, and never claim
          global ordering.
        </Callout>
        <p className="text-ink-dim leading-relaxed mt-1">
          Round out the operational story: <strong>dead-letter queues</strong> for poison messages that keep
          failing, <strong>backpressure</strong> and consumer lag as the health signal, and a schema registry
          with backward-compatible evolution so a new producer field does not break old consumers.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Precision on guarantees. The signal is stating at-least-once as the practical default (so duplicates
          are guaranteed), calling exactly-once-across-systems a myth and reaching for idempotent consumers,
          and knowing ordering is per partition rather than global. Vague "the broker handles it" reads as
          having never operated one.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A consumer keeps crashing on one message. What happens to the rest?</strong> On a
            partitioned log the whole partition stalls behind the poison message, because offsets advance in
            order. The fix is a retry policy with a cap, then route the message to a dead-letter queue and
            advance, so one bad record does not block the partition forever.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You need strict ordering across an entire entity's events. How?</strong> Partition by the
            entity key, so every event for that order or user lands in the same partition and stays ordered.
            You give up cross-entity ordering, which you did not need, and you accept that one hot key can
            create a hot partition to tune.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Producer adds a field. Do consumers break?</strong> Not if you run a schema registry with
            a backward-compatible policy: new optional fields are ignored by old consumers, and required
            fields or type changes are rejected at publish time. Schema evolution is the governance that keeps
            an event bus from becoming a fragile integration.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you debug a flow that spans ten async hops?</strong> Distributed tracing with a
            correlation id propagated on every message, plus consumer-lag and dead-letter dashboards. The
            honest caveat is that async flows are genuinely harder to reason about than a call stack, which is
            part of the cost you are trading for decoupling.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Event-driven trades synchronous calls for publish and react, which buys temporal decoupling,
          fan-out, and independent scaling, and costs eventual consistency and harder debugging. I pick the
          message contract deliberately, thin event notification, event-carried state transfer, or a command,
          and I pick the broker by whether I need replay: a log like Kafka for replay and many consumers, a
          queue like RabbitMQ or SQS for task distribution. The guarantees I state precisely: at-least-once
          delivery in practice, so I make consumers idempotent for effectively-once results, and ordering is
          per partition, so I key by entity id. Exactly-once end to end is a myth I engineer around."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I start by naming what is in the message, because 'event-driven' hides three contracts. An event
          notification is a thin fact that says something happened and makes consumers call back, minimal
          coupling but chatty. Event-carried state transfer puts the data in the event so consumers keep local
          copies and stop calling back, more decoupled but duplicated and eventually stale. A command is a
          directed instruction to one handler, which is not an event at all. Then the plumbing: a traditional
          queue deletes on ack and gives point-to-point with competing consumers, while a log like Kafka keeps
          an ordered replayable record with per-consumer offsets, which is why it suits streaming and event
          sourcing. On guarantees I am precise: at-most-once loses on crash, at-least-once is the practical
          default and therefore produces duplicates, and exactly-once is real inside one system but a myth
          across a broker, my service, and an external database. So I engineer effectively-once with idempotent
          consumers that dedupe on a message id or use naturally idempotent upserts, and I remember ordering is
          per partition, so I partition by entity key when order matters. Operationally I add dead-letter queues
          for poison messages, watch consumer lag as the backpressure signal, and run a schema registry with
          backward-compatible evolution so producers and consumers can change independently."
        </Callout>
      </Block>
    </>
  );
}

/* ── CQRS & event sourcing ────────────────────────────────────── */
function CqrsEs() {
  return (
    <>
      <Lede>
        CQRS and event sourcing get bundled together and both get over-applied. They are separable ideas.
        CQRS splits the write model from the read model; event sourcing stores the log of changes as the
        source of truth instead of the current state. Each buys something specific and each adds real cost,
        so the senior move is knowing exactly when the cost is worth it, and admitting how often it is not.
      </Lede>

      <Block eyebrow="two independent ideas" title="They are not the same thing">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>CQRS</strong> (Command Query Responsibility Segregation) separates the model that handles
          writes from the model(s) that serve reads. It does not require two databases, a separate read
          schema or a materialized view is CQRS. <strong>Event sourcing</strong> persists an append-only log
          of events as the system of record; current state is a fold over that log. You can do either
          without the other: CQRS over a normal state-stored database is common, and event sourcing with a
          single combined read/write path exists too. They pair well because a projection is a natural read
          model, but conflating them is a mid-level tell.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you treat CQRS and event sourcing as separable and cost-bearing, or as a default. The
          signal is naming the specific pressure (a read/write shape mismatch, or a hard audit and temporal
          requirement) that justifies each, and volunteering the eventual-consistency and schema-evolution
          costs before being asked.
        </Callout>
      </Block>

      <Block eyebrow="CQRS" title="Split reads from writes, and pay for it">
        <p className="text-ink-dim leading-relaxed mb-2">
          CQRS earns its keep when reads and writes have genuinely different shapes and scaling: a normalized
          write model that protects invariants, and one or more denormalized read models tuned per query
          (a search index, a dashboard rollup, a document view). Writes update the write store and emit an
          event; a projector updates the read stores asynchronously. The cost is exactly that word{" "}
          <strong>asynchronously</strong>: the read side is <strong>eventually consistent</strong>, so a user
          can write then not see their own change for a moment, and you must design for it (read-your-writes
          via the write model, or a version check).
        </p>
        <OpTable
          cols={["", "Write model", "", "Read model(s)"]}
          rows={[
            { op: "Optimized for", avg: "invariants, consistency", avgTone: "good", why: "Normalized, transactional; enforces business rules on change." },
            { op: "Shape", avg: "one canonical model", avgTone: "ok", why: "Read side is many denormalized views, each shaped for a specific query pattern." },
            { op: "Consistency", avg: "strong on write", avgTone: "ok", why: "Read side lags: eventually consistent, updated by an async projector off the event stream." },
          ]}
        />
        <Callout kind="trap" title="CQRS is not a default; it is a targeted tool">
          For most CRUD, one model serving reads and writes is simpler and correct. Reach for CQRS when a
          read/write shape mismatch or wildly asymmetric read scaling forces it, and be honest that you are
          buying query performance with eventual consistency and more moving parts.
        </Callout>
      </Block>

      <Block eyebrow="event sourcing" title="Store the log, fold to state, replay to rebuild">
        <p className="text-ink-dim leading-relaxed mb-2">
          Instead of storing "balance = 40," event sourcing stores "Deposited 100, Withdrew 60," and current
          state is the fold. What that buys is unique: a perfect <strong>audit log</strong> by construction,{" "}
          <strong>temporal queries</strong> (what did this look like last Tuesday?), and the ability to{" "}
          <strong>rebuild any read model by replaying</strong> the event log through a new projection. That
          replay superpower is the headline: add a new view months later and populate it from history.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`command --> [ aggregate ] --validates--> emits events
                                            |
                                            v
                                 [ append-only event store ]  <- source of truth
                                            |
                    +-----------------------+------------------------+
                    v                        v                       v
             projection A             projection B            NEW projection C
             (balances table)         (search index)          (added later, built
                                                               by REPLAYING the log)`}
        />
        <p className="text-ink-dim leading-relaxed mb-2">
          The costs are equally concrete: <strong>schema evolution</strong> of events is forever (you can
          never delete history, so you version events and use upcasters), you need <strong>snapshots</strong>{" "}
          so folding a million events is not a per-read cost, querying current state needs a projection rather
          than a simple SELECT, and <strong>GDPR "right to be forgotten" fights an immutable log</strong>,
          usually solved by crypto-shredding (encrypt personal data per subject and throw away the key).
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A user updates their profile and immediately reloads to stale data. Why, and what do you
            do?</strong> The read model is eventually consistent behind the async projector. Options: serve
            that user's own reads from the write model (read-your-writes), return the new version id and have
            the client wait for the projection to catch up, or accept a sub-second lag where the UX allows.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You need to change an event's schema. How, given the log is immutable?</strong> You never
            rewrite history. Add a new event version and an upcaster that transforms old events into the new
            shape on read, or run a one-time migration that appends corrected events. Versioning events from
            day one is the discipline that keeps event sourcing maintainable.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you delete a user under GDPR if the log is append-only?</strong> Crypto-shredding:
            encrypt each subject's personal data with a per-subject key, keep the keys in a mutable store,
            and delete the key to render that person's events unreadable. The log stays immutable; the data
            becomes irrecoverable.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Would you event-source the whole system?</strong> No. I event-source the few aggregates
            where audit, temporal history, or replay genuinely matter, orders, payments, ledgers, and leave
            the rest state-stored. Event-sourcing everything multiplies the schema-evolution and projection
            cost across areas that never needed it.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "CQRS and event sourcing are separable. CQRS splits the write model from denormalized read models
          tuned per query, and its price is eventual consistency because a projector updates the read side
          asynchronously. Event sourcing stores an append-only log of events as the source of truth and folds
          them to state, which gives a free audit trail, temporal queries, and the ability to rebuild any read
          model by replaying the log. Its costs are event schema evolution forever, snapshots for
          performance, projections instead of simple queries, and GDPR deletes via crypto-shredding. Neither
          is a default; I apply them to the few aggregates where the specific benefit outweighs the cost."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I always separate the two ideas first, because bundling them is the common mistake. CQRS is just
          command-query responsibility segregation: one model optimized for writes and invariants, and one or
          more denormalized read models each shaped for a query pattern, a search index, a dashboard rollup, a
          document view. It does not require event sourcing or even two databases; a materialized view is
          CQRS. The cost is eventual consistency, because writes emit events and an async projector updates the
          read stores, so I have to design for read-your-writes. Event sourcing is the separate decision to
          store the log of events as the system of record and derive state by folding them. That buys three
          things I cannot get cheaply otherwise: an audit trail by construction, temporal queries about past
          state, and replay, meaning I can add a brand-new read model later and build it from history. The
          costs are real and I name them: events are immutable so schema evolution means versioning and
          upcasters, I need snapshots so I am not folding millions of events per read, current-state queries
          require a projection, and the right to be forgotten fights the immutable log, which I solve with
          crypto-shredding. So my rule is to event-source the aggregates where audit and history matter, like
          ledgers and payments, and leave everything else state-stored."
        </Callout>
      </Block>
    </>
  );
}

/* ── Saga: orchestration vs choreography ──────────────────────── */
function Saga() {
  return (
    <>
      <Lede>
        Once each service owns its own database, you cannot wrap a business transaction in one ACID
        commit, and two-phase commit across services couples them and does not scale. The saga is the
        answer: model a long-running transaction as a sequence of local transactions, each with a{" "}
        <em>compensating</em> action that semantically undoes it. The two ways to coordinate a saga,
        orchestration and choreography, are a classic senior trade-off.
      </Lede>

      <Block eyebrow="the problem" title="No distributed ACID, so compensate instead">
        <p className="text-ink-dim leading-relaxed mb-2">
          A saga breaks "place an order" into local steps, reserve inventory, charge payment, ship, each
          committing in its own service. If a later step fails, you cannot roll back the earlier commits, so
          you run <strong>compensating transactions</strong> that undo them semantically: release the
          reservation, refund the charge. Compensation is not a rollback; it is a new business action that
          reverses the effect, and it must be idempotent and, ideally, retriable.
        </p>
        <Callout kind="trap" title="Compensation is semantic, not a database rollback">
          You do not un-charge a card, you issue a refund; you do not un-send an email, you send a
          correction. That distinction matters because some effects are not fully reversible, and you design
          the step order so the hard-to-compensate step (payment capture) comes as late as possible, after
          the easily-reversible reservations.
        </Callout>
        <p className="text-ink-dim leading-relaxed">
          A useful framing: classify each step as <strong>compensatable</strong> (can be undone), a{" "}
          <strong>pivot</strong> (the point of no return that commits the saga), or <strong>retriable</strong>{" "}
          (must eventually succeed and comes after the pivot). Do the compensatable steps first, the pivot in
          the middle, retriable steps last.
        </p>
      </Block>

      <Block eyebrow="the two styles" title="Orchestration vs choreography">
        <OpTable
          cols={["Dimension", "Orchestration", "", "Choreography"]}
          rows={[
            { op: "Coordination", avg: "central orchestrator", avgTone: "good", why: "A coordinator tells each service what to do and drives compensation. Choreography has no center: services emit events and react to each other." },
            { op: "Visibility", avg: "flow in one place", avgTone: "good", why: "The saga logic is explicit and monitorable in the orchestrator. In choreography the flow is emergent and spread across services, hard to see." },
            { op: "Coupling", avg: "services know the orchestrator", avgTone: "ok", why: "Risk of a 'god' orchestrator with dumb services. Choreography is loosely coupled but can form hidden cyclic event dependencies." },
            { op: "Best for", avg: "complex, many-step flows", avgTone: "ok", why: "Orchestration for complex logic needing clear control and monitoring; choreography for simple flows among a few autonomous services." },
          ]}
        />
        <CodeBlock
          title="text"
          lang="text"
          code={`ORCHESTRATION (central brain)          CHOREOGRAPHY (react to events)

     [ Order Orchestrator ]              OrderPlaced
      |    |     |     |                      |
      v    v     v     v              +-------+--------+
   reserve charge ship notify        v                v
   (it calls each step and        Inventory        Payment
    runs compensation on          reserves ->      charges ->
    failure, in order)            InventoryReserved  Charged ...
                                  (each service listens and emits the next)`}
        />
      </Block>

      <Block eyebrow="making it correct" title="Idempotency, timeouts, and the saga log">
        <p className="text-ink-dim leading-relaxed mb-2">
          Either style needs the same correctness scaffolding. Every step and every compensation must be{" "}
          <strong>idempotent</strong>, because at-least-once messaging will redeliver. The orchestrator (or
          the event flow) needs <strong>timeouts</strong> so a step that never answers triggers compensation
          rather than hanging the saga forever. And you persist the <strong>saga state / log</strong> so a
          crashed coordinator resumes exactly where it left off. Note the tie to messaging: a saga is usually
          built on at-least-once delivery, so idempotent handlers give effectively-once execution.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Two things: that you say "compensation, not rollback" and design step order around reversibility,
          and that you can defend a coordination choice. Reaching for orchestration on a complex multi-step
          flow, or choreography among a couple of autonomous services, and naming why, is the signal.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A compensation itself fails. Now what?</strong> Retry it with backoff, because
            compensations are designed to be retriable and idempotent. If it exhausts retries, it becomes an
            operational event: alert, park the saga in a needs-intervention state, and expose it for a human
            or an automated remediation. You never silently drop a failed compensation.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why not just use two-phase commit?</strong> 2PC needs a coordinator holding locks across
            services for the whole transaction, which couples their availability (one slow participant blocks
            everyone) and does not scale, and many stores do not support it. Sagas trade atomicity for
            availability: eventual consistency with explicit compensation instead of distributed locks.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your choreographed saga has grown to eight services and no one understands the flow.
            What do you do?</strong> That is choreography's failure mode, emergent flow and cyclic event
            dependencies. Introduce an orchestrator for that saga so the sequence and compensation live in one
            monitorable place. It is a common and correct refactor as a flow gets complex.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you keep a saga from double-charging on redelivery?</strong> Idempotency keys:
            each step carries a unique saga-step id, the handler records it, and a redelivery is recognized and
            skipped. Combined with at-least-once delivery this gives effectively-once execution across the
            whole saga.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Once every service owns its data, there is no ACID transaction across them and 2PC does not scale,
          so I use a saga: a sequence of local transactions, each with a compensating action that semantically
          undoes it, a refund, not an un-charge. I order steps so the hard-to-reverse step, payment, comes
          late, after the easily-compensated reservations. Coordination is either orchestration, a central
          coordinator that drives steps and compensation with clear visibility, or choreography, services
          reacting to each other's events with looser coupling but an emergent, harder-to-trace flow. I use
          orchestration for complex multi-step flows and choreography for simple ones, and either way every
          step is idempotent with timeouts and a persisted saga log."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The saga exists because database-per-service kills the distributed ACID transaction, and two-phase
          commit holds cross-service locks that couple availability and do not scale. So a business
          transaction becomes a sequence of local commits, each with a compensating transaction that undoes it
          semantically. I stress that compensation is not a rollback: you issue a refund rather than
          un-charging a card, and because some effects are hard to reverse, I classify steps as compensatable,
          pivot, or retriable and order them so the compensatable steps run first, the pivot commits the saga,
          and retriable steps run after. Then the coordination choice. Orchestration puts a central
          coordinator in charge: it calls each step and runs compensation on failure, so the whole flow is
          explicit and monitorable, at the risk of a god orchestrator over dumb services. Choreography has no
          center, services emit events and react, which is loosely coupled and great for a simple flow among a
          few services, but the flow is emergent and can form cyclic event dependencies that get impossible to
          trace. My rule is orchestration for complex, many-step sagas that need visibility and control, and
          choreography for simple ones, and I will refactor a sprawling choreography to an orchestrator when
          it outgrows comprehension. Underneath either, correctness needs idempotent steps and compensations
          because messaging is at-least-once, timeouts so a dead step triggers compensation, and a persisted
          saga log so a crashed coordinator resumes."
        </Callout>
      </Block>
    </>
  );
}

/* ── Gateway, BFF & service mesh ──────────────────────────────── */
function MeshBff() {
  return (
    <>
      <Lede>
        Three pieces of infrastructure that people conflate because they all sit between callers and
        services. The clean mental model is direction of traffic: an API gateway and a BFF handle{" "}
        <em>north-south</em> traffic (clients into the system), while a service mesh handles{" "}
        <em>east-west</em> traffic (service to service). Knowing which concern each owns, and not
        duplicating them, is the whole topic.
      </Lede>

      <Block eyebrow="the edge" title="API gateway: one front door">
        <p className="text-ink-dim leading-relaxed mb-2">
          An <strong>API gateway</strong> is the single entry point for external clients. It owns edge
          concerns so individual services do not have to: TLS termination, authentication and token
          validation, rate limiting and quotas, routing, request/response transformation, and sometimes
          response aggregation across a few services. It is north-south: it faces the outside world. On
          Kubernetes the modern expression is the <strong>Gateway API</strong>, the role-oriented successor
          to Ingress.
        </p>
        <Callout kind="tip" title="Put cross-cutting edge concerns in one place">
          Auth, rate limiting, and TLS belong at the gateway rather than reimplemented in every service. The
          gateway is also where you enforce a coarse security perimeter and where external API versioning and
          quotas live.
        </Callout>
      </Block>

      <Block eyebrow="per-client tailoring" title="BFF: a gateway shaped for one frontend">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>Backend for Frontend</strong> is a gateway-like layer dedicated to one client type, a web
          BFF, a mobile BFF, a partner BFF. Each frontend has different needs: mobile wants fewer, smaller,
          aggregated payloads to save battery and round trips; web wants richer data. A single one-size API
          forces every client to over- or under-fetch, so the BFF aggregates and shapes downstream calls per
          client, owned by the team that owns that frontend.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`   web client  --> [ Web BFF ]    \\
   mobile app  --> [ Mobile BFF ]  >--> [ internal services ]
   partner     --> [ Partner BFF ] /

   each BFF aggregates + shapes responses for ITS client.
   (contrast: one shared gateway = every client over/under-fetches)`}
        />
        <p className="text-ink-dim leading-relaxed">
          A BFF is a specialization of the gateway idea, not a competitor to it. Many stacks run a thin edge
          gateway for TLS/auth/rate-limiting and then per-client BFFs behind it for aggregation and shaping.
        </p>
      </Block>

      <Block eyebrow="between services" title="Service mesh: east-west, out of the app">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>service mesh</strong> (Istio, Linkerd, Cilium) handles service-to-service traffic. It
          moves cross-cutting network concerns out of application code and into a <strong>data plane</strong>{" "}
          of proxies, historically a sidecar per service (an Envoy sidecar in Istio; Linkerd ships its own
          lightweight Rust proxy), governed by a{" "}
          <strong>control plane</strong>. The mesh gives you mutual TLS (encrypted, authenticated service
          identity), retries, timeouts, circuit breaking, load balancing, traffic splitting for canaries, and
          uniform telemetry, without every service reimplementing them.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          The 2024-2026 shift is <strong>away from a sidecar per pod</strong>: Istio's <em>ambient</em> mode
          splits into a per-node ztunnel for mTLS plus optional waypoint proxies, and Cilium uses eBPF in the
          kernel, both cutting the sidecar's per-pod memory and latency overhead. Worth naming, because "one
          Envoy per pod is heavy" is a real objection the newer designs answer.
        </p>
        <OpTable
          cols={["Concern", "Gateway / BFF", "", "Service mesh"]}
          rows={[
            { op: "Traffic direction", avg: "north-south (client -> system)", avgTone: "good", why: "Mesh is east-west: service -> service inside the cluster." },
            { op: "Owns", avg: "auth, rate limit, TLS, aggregation", avgTone: "good", why: "Mesh owns mTLS, retries, timeouts, circuit breaking, traffic shifting between services." },
            { op: "Lives", avg: "at the edge", avgTone: "ok", why: "Mesh lives beside every workload as a data-plane proxy (sidecar or per-node)." },
            { op: "Failure if you conflate", avg: "auth logic scattered", avgTone: "bad", why: "Doing edge concerns in the mesh, or retries at the gateway, duplicates responsibilities and hides where a behavior comes from." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          The north-south versus east-west distinction, cleanly. The tell of depth is refusing to conflate
          gateway and mesh, they are complementary, one at the edge and one between services, and knowing that
          resilience like retries and circuit breaking can live in the mesh so services do not each hand-roll
          it.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Gateway or mesh for retries and circuit breaking?</strong> Both can, but they cover
            different traffic. Client-facing retry/limit policy sits at the gateway; service-to-service
            retries, timeouts, and circuit breaking belong in the mesh so every internal call gets them
            uniformly without app code. Just do not configure the same behavior in both and fight yourself.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Do you need a service mesh at all?</strong> Often not. For a handful of services, a
            library or the gateway plus good client-side resilience is simpler than operating a mesh. A mesh
            pays off at scale: many services, a hard mTLS/zero-trust requirement, and a desire to standardize
            traffic policy and telemetry across teams.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Isn't a BFF just another service to maintain?</strong> Yes, and that is the trade: you
            accept a per-client layer in exchange for not forcing one API to serve mobile and web equally
            badly. If clients are similar enough, a single gateway is fine; BFFs earn their cost when client
            needs genuinely diverge.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How does mTLS actually help here?</strong> The mesh gives every service a cryptographic
            identity and encrypts and authenticates all service-to-service calls automatically, which is the
            backbone of zero-trust networking. Services stop trusting the network by location and start
            trusting verified identity, without each team implementing certificates.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I separate them by traffic direction. An API gateway is the north-south front door for external
          clients and owns edge concerns, TLS, auth, rate limiting, routing, some aggregation. A BFF is a
          gateway specialized per client type, so mobile and web each get payloads shaped for them instead of
          one API everyone over-fetches. A service mesh is east-west, service to service: it pushes mTLS,
          retries, timeouts, circuit breaking, and traffic shifting into data-plane proxies controlled by a
          control plane, so services do not hand-roll them. Gateway and mesh are complementary, not
          alternatives, and I do not duplicate a behavior across both."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The clean model is direction of traffic. North-south is clients coming into the system, and that
          is the gateway's and BFF's job. The API gateway is the single front door and centralizes edge
          concerns, TLS termination, authentication and token validation, rate limiting, routing, and
          sometimes aggregation, so individual services do not each reimplement them; on Kubernetes that is
          now the Gateway API rather than Ingress. A BFF is the same idea specialized for one frontend,
          because mobile wants small aggregated payloads and web wants richer ones, so a shared API makes
          everyone over- or under-fetch; each BFF is owned by the team that owns its client, and it usually
          sits behind a thin edge gateway. East-west is service-to-service traffic inside the cluster, and
          that is the service mesh. It moves network cross-cutting concerns out of app code into a data plane
          of proxies governed by a control plane, giving mutual TLS for zero-trust identity, plus retries,
          timeouts, circuit breaking, load balancing, canary traffic splitting, and uniform telemetry. The
          current shift is away from a sidecar per pod toward ambient or eBPF data planes like Istio ambient
          and Cilium to cut overhead. The senior point is that these are complementary layers, the gateway at
          the edge, the mesh between services, and I put each concern in exactly one of them rather than
          duplicating retries or auth across both. And I would only adopt a mesh at real scale, where many
          services and a zero-trust mTLS requirement justify operating it."
        </Callout>
      </Block>
    </>
  );
}

/* ── Resilience patterns ──────────────────────────────────────── */
function Resilience() {
  return (
    <>
      <Lede>
        Distributed systems fail partially: a dependency gets slow, not down, and slowness is more dangerous
        than an outage because it ties up your threads while you wait. Resilience patterns are a small,
        composable toolkit, timeout, retry with backoff and jitter, circuit breaker, bulkhead, load shedding,
        graceful degradation, and idempotency, that together stop one sick dependency from cascading into a
        full outage.
      </Lede>

      <Block eyebrow="start here" title="Timeouts: the pattern everything else depends on">
        <p className="text-ink-dim leading-relaxed mb-2">
          The single most common cause of a cascading failure is a <strong>missing or too-long timeout</strong>.
          A downstream call with no timeout, or a 60-second one, means a slow dependency holds your request
          thread hostage; enough of them and your whole thread pool is blocked waiting, so your service goes
          down because <em>someone else</em> got slow. Set aggressive, explicit timeouts on every network call
          (connect and read), budgeted so the total end-to-end deadline is respected. Everything below assumes
          timeouts exist.
        </p>
        <Callout kind="trap" title="Slow is worse than down">
          A dependency returning a fast error lets you fail fast and move on. A dependency that hangs consumes
          the scarcest resource you have, threads or connections, and takes you down with it. Timeouts convert
          "hangs forever" into "fails fast," which is what makes the circuit breaker and bulkhead able to do
          their jobs.
        </Callout>
      </Block>

      <Block eyebrow="retrying without a stampede" title="Retry + exponential backoff + jitter">
        <p className="text-ink-dim leading-relaxed mb-2">
          Retries handle <em>transient</em> failures, but naive retries cause two disasters. First, retrying a
          non-idempotent operation double-charges; only retry idempotent operations (or use an idempotency
          key). Second, retrying immediately, or on a fixed schedule, creates a <strong>thundering herd</strong>:
          every client retries in sync and hammers the recovering dependency back down. The fix is exponential
          backoff (wait 1s, 2s, 4s, ...) plus <strong>jitter</strong> (randomize the delay) so retries spread
          out instead of synchronizing.
        </p>
        <CodeBlock
          title="python"
          lang="python"
          code={`# full jitter: spread retries so they don't synchronize into a stampede
base, cap = 0.1, 10.0
for attempt in range(max_retries):
    try:
        return call()                     # only if the op is idempotent!
    except Transient:
        backoff = min(cap, base * 2 ** attempt)   # exponential: 0.1, 0.2, 0.4, ...
        sleep(random.uniform(0, backoff))         # full jitter: pick anywhere in [0, backoff]
raise Exhausted`}
        />
        <Callout kind="tip" title="Cap attempts and add a retry budget">
          Bound the number of retries and enforce a <strong>retry budget</strong> (for example, retries may
          be at most 10% of requests) so a widespread failure does not multiply load and cause a retry storm.
          Pair retries with the circuit breaker below: once the breaker is open, you stop retrying entirely.
        </Callout>
      </Block>

      <Block eyebrow="stop hammering a sick dependency" title="Circuit breaker: CLOSED, OPEN, HALF-OPEN">
        <p className="text-ink-dim leading-relaxed mb-2">
          A circuit breaker wraps a dependency and tracks failures. In <strong>CLOSED</strong> it lets calls
          through and counts consecutive failures; at a threshold it trips to <strong>OPEN</strong> and{" "}
          <em>fails fast</em> without calling the dependency at all, giving it room to recover and freeing your
          threads. After a cooldown it moves to <strong>HALF-OPEN</strong> and allows one trial request: if it
          succeeds the breaker closes, if it fails it re-opens and restarts the cooldown. This is the pattern
          that stops retries from turning a blip into a self-sustaining outage.
        </p>
        <Try label="circuit breaker">
          <CircuitBreakerViz />
        </Try>
        <Callout kind="note" title="What the interviewer is listening for">
          That you name the three states and the half-open probe precisely, and that you connect the breaker
          to retries and timeouts as one system: timeouts make failures fast, the breaker stops you from
          retrying into a downed dependency, and half-open is how it safely tests recovery. Reciting the
          states without the interplay reads as memorized.
        </Callout>
      </Block>

      <Block eyebrow="isolate and shed" title="Bulkhead, load shedding, graceful degradation">
        <p className="text-ink-dim leading-relaxed mb-2">
          The remaining three keep one problem from sinking everything:
        </p>
        <OpTable
          cols={["Pattern", "Idea", "", "Concretely"]}
          rows={[
            { op: "Bulkhead", avg: "isolate resource pools", avgTone: "good", why: "Named after a ship's watertight compartments: give each dependency its own thread/connection pool so one slow dependency exhausting its pool can't starve the rest of the service." },
            { op: "Load shedding", avg: "reject early under overload", avgTone: "ok", why: "When you're past capacity, return 429/503 to excess requests fast (admission control) to protect goodput. Shedding low-priority work keeps the system up for the important work." },
            { op: "Graceful degradation", avg: "reduced, not broken", avgTone: "good", why: "On dependency failure, serve a fallback: stale cache, defaults, a feature turned off, instead of erroring the whole response. The page loads without recommendations rather than not loading." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-1">
          These compose: a bulkhead contains the blast radius to one pool, the circuit breaker stops calls to
          the failing dependency, graceful degradation serves a fallback in its place, and load shedding
          protects the whole service if demand still exceeds capacity.
        </p>
      </Block>

      <Block eyebrow="the enabler" title="Idempotency: what makes retries safe at all">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every pattern above assumes you can retry safely, and that requires <strong>idempotency</strong>: an
          operation that produces the same result whether it runs once or five times. Reads are naturally
          idempotent; writes need help. The standard tool is an <strong>idempotency key</strong>: the client
          sends a unique key with the request, the server records it, and a retry with the same key returns the
          original result instead of doing the work again. This is exactly how payment APIs make "charge once"
          survive network retries, and it is the same effectively-once idea from messaging: at-least-once
          delivery plus idempotent handling.
        </p>
        <Callout kind="warn" title="Without idempotency, retries are a bug">
          Turning on retries in front of a non-idempotent write is how one timeout becomes three charges.
          Before you add any retry, make the target idempotent, via an idempotency key, a natural upsert, or a
          dedupe on a unique request id, or restrict retries to operations that are already safe.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Retries make outages worse sometimes. When, and how do you prevent it?</strong> During a
            broad failure, retries multiply load, a retry storm, and keep the dependency down. Prevent it with
            exponential backoff and jitter so retries do not synchronize, a strict attempt cap, a retry budget
            capping retries as a fraction of traffic, and a circuit breaker that halts retries once it opens.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Circuit breaker vs bulkhead, what's the difference?</strong> A breaker stops calling a
            dependency that is failing (a time-based trip); a bulkhead isolates the resources a dependency can
            consume (a capacity partition) so its slowness cannot exhaust shared threads. They compose: the
            bulkhead contains blast radius while the breaker cuts off the bad path.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You're over capacity. Do you queue or shed?</strong> Shed. Unbounded queues just move the
            failure and add latency until things time out anyway. Load shedding rejects excess work early with
            429/503, ideally dropping low-priority requests first, so the system stays up and serves its most
            important traffic instead of collapsing under all of it.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What does graceful degradation look like concretely?</strong> The recommendations service
            is down, so the product page renders with a generic "popular items" fallback from cache instead of
            failing to load. The core purchase path keeps working; the enhancement degrades. You decide these
            fallbacks per feature ahead of time, by criticality.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Distributed systems fail partially, and slow is worse than down because it ties up threads. So I
          start with aggressive timeouts on every call to turn hangs into fast failures. Retries handle
          transient errors, but only on idempotent operations and always with exponential backoff plus jitter
          and a retry budget, or you get a thundering-herd retry storm. A circuit breaker, CLOSED, OPEN,
          HALF-OPEN, stops you from hammering a sick dependency and probes for recovery. Bulkheads isolate
          resource pools so one slow dependency can't starve the rest, load shedding rejects excess work early
          to protect goodput, and graceful degradation serves a fallback instead of an error. Idempotency is
          what makes all the retrying safe."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I think of resilience as one composable system, not a checklist. It starts with timeouts, because
          the number-one cause of cascading failure is a missing or too-long timeout: a slow dependency holds
          your request thread until the whole pool is blocked and you go down because someone else got slow.
          Aggressive connect and read timeouts convert 'hangs forever' into 'fails fast.' On top of that,
          retries for transient failures, but with two guardrails: only retry idempotent operations, or the
          retry double-charges, and use exponential backoff with jitter plus a capped attempt count and a
          retry budget, so clients do not synchronize into a thundering herd that hammers a recovering
          dependency. The circuit breaker sits over the dependency: CLOSED counts failures and trips to OPEN at
          a threshold, where it fails fast without calling the dependency, then after a cooldown goes HALF-OPEN
          to let one probe test recovery, closing on success and re-opening on failure, which is what stops
          retries from sustaining an outage. Around that, bulkheads give each dependency its own thread or
          connection pool so one slow one cannot exhaust the whole service, load shedding rejects excess
          requests early with 429 or 503 to protect goodput under overload, ideally shedding low-priority work
          first, and graceful degradation serves a fallback, stale cache or defaults or a feature switched off,
          instead of failing the whole response. Underneath all of it is idempotency, usually an idempotency
          key, because none of the retrying is safe without it, and that is the same at-least-once plus
          idempotent-handling equals effectively-once idea from messaging."
        </Callout>
      </Block>
    </>
  );
}

/* ── Failover, HA & multi-region ──────────────────────────────── */
function Failover() {
  return (
    <>
      <Lede>
        High availability is redundancy plus automatic failover; disaster recovery is what you do when a
        whole region is gone. Both are pinned by two numbers you must never confuse: <strong>RPO</strong>,
        how much data you can afford to lose, and <strong>RTO</strong>, how long you can afford to be down.
        Those two numbers pick your topology and your bill, and multi-region done right is a data-replication
        problem, not a compute problem.
      </Lede>

      <Block eyebrow="the two numbers" title="RPO vs RTO">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>RPO (Recovery Point Objective)</strong> is the maximum acceptable <em>data loss</em>,
          measured as a time window: an RPO of 5 minutes means a disaster may lose up to the last 5 minutes of
          writes. It is set by your replication: synchronous replication gives RPO near zero, asynchronous
          gives RPO equal to the replication lag. <strong>RTO (Recovery Time Objective)</strong> is the
          maximum acceptable <em>downtime</em>: how long until service is restored. RPO is about the past
          (data), RTO is about the future (time to recover), and they drive different design choices.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`         <---- RPO ---->|  DISASTER  |<------ RTO ------>
   ...writes.........X            |......recovering......| service back
                     ^ last safe  ^ everything after     ^ down this whole
                       data point   X may be lost           window (RTO)

   RPO = how much DATA you can lose   (set by replication lag)
   RTO = how much TIME you can be down (set by failover speed)`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          That you define RPO and RTO precisely and separately, then let them drive the architecture rather
          than picking a topology first. "They want RPO near zero and RTO in minutes, so async replication is
          out and I need warm standby or active-active" is the reasoning they are grading.
        </Callout>
      </Block>

      <Block eyebrow="the DR strategies" title="Four topologies, priced by RPO/RTO">
        <OpTable
          cols={["Strategy", "RTO / RPO", "", "How it works"]}
          rows={[
            { op: "Backup & restore", avg: "hours / hours", avgTone: "bad", why: "Restore from backups into a rebuilt environment. Cheapest, slowest. Fine for non-critical systems that tolerate hours of loss." },
            { op: "Pilot light", avg: "tens of min / minutes", avgTone: "ok", why: "Core data replicated to a second region; minimal always-on footprint you scale up on disaster. Cheap standby, meaningful spin-up." },
            { op: "Warm standby", avg: "minutes / seconds-min", avgTone: "ok", why: "A scaled-down but running copy in the second region; failover scales it up and shifts traffic. More cost, much faster recovery." },
            { op: "Active-active (multi-site)", avg: "near-zero / near-zero", avgTone: "good", why: "Both regions serve live traffic. Highest cost and hardest data story, but a region loss is barely visible. For the most critical systems." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-1">
          You move down this list by spending more money to buy lower RTO and RPO. The senior answer picks the
          cheapest strategy that still meets the stated RPO and RTO, and says so out loud, rather than
          defaulting to active-active because it sounds impressive.
        </p>
      </Block>

      <Block eyebrow="active-passive vs active-active" title="Multi-region is a data problem">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Active-passive</strong> runs one region live and fails over to a standby: simpler, because
          only one region writes, so there is no write-conflict problem, at the cost of idle capacity and
          failover time. <strong>Active-active</strong> serves writes from multiple regions at once: no idle
          capacity and instant regional loss tolerance, but now you must solve <strong>data
          replication and conflict resolution</strong>, two regions can write the same record concurrently.
          That is the real difficulty, and it is a CAP-theorem trade: during a partition you choose consistency
          or availability.
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Conflict resolution</strong>, last-writer-wins (simple, lossy), CRDTs (merge without conflict, for suitable data types), or partition by geography so a given record is only written in one region.</li>
          <li><strong>Sync vs async replication</strong>, synchronous gives RPO 0 but adds cross-region write latency and couples availability; asynchronous keeps writes fast but accepts RPO greater than 0 and possible loss on failover.</li>
          <li><strong>Split-brain</strong>, the failure where both regions think they are primary and diverge. Prevented with quorum, leader election, and fencing so only one side can accept writes.</li>
          <li><strong>Traffic routing</strong>, health checks plus DNS or anycast (latency-based or geo routing) steer users to a healthy region and away from a failed one.</li>
        </ul>
        <Callout kind="trap" title="Don't say 'active-active' unless you can answer 'how do writes not conflict?'">
          Active-active is easy to name and hard to build. The moment you propose it, expect "how do you handle
          two regions writing the same row?" Have the answer ready, geo-partition writes, use CRDTs, or accept
          last-writer-wins, or scope back to active-passive, which sidesteps write conflicts entirely.
        </Callout>
      </Block>

      <Block eyebrow="within a region" title="HA building blocks and the availability math">
        <p className="text-ink-dim leading-relaxed mb-2">
          Before multi-region, single-region HA is redundancy across availability zones: no single point of
          failure, health checks, a load balancer routing around unhealthy instances, multi-AZ database
          replicas with automatic failover, and quorum-based systems that tolerate a node loss. The math is
          worth knowing: components <strong>in series multiply</strong> their availabilities (a chain of
          three 99.9% services is roughly 99.7%), while <strong>redundant copies in parallel</strong> raise it
          (two 99% instances give 1 minus 0.01 squared, about 99.99%). This is why redundancy and short
          dependency chains, not heroics, buy nines.
        </p>
        <Callout kind="tip" title="Nines, quickly">
          99.9% is about 8.7 hours of downtime a year, 99.99% about 52 minutes, 99.999% about 5 minutes. Each
          extra nine is roughly 10x the cost and difficulty, so match the target to the business need instead
          of chasing five nines everywhere.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>They want RPO 0 and RTO near zero. What does that force?</strong> RPO 0 rules out
            asynchronous replication, you need synchronous replication or a consensus store, which adds write
            latency and couples regions. RTO near zero rules out pilot light and backup/restore, pushing you to
            warm standby or active-active. So those two numbers alone eliminate most of the cheap options; I
            would confirm the business truly needs both before signing up for the cost.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you prevent split-brain during a failover?</strong> A quorum or consensus mechanism
            (an odd number of nodes, majority to elect a leader) plus fencing so a demoted primary cannot keep
            accepting writes. You never let two sides believe they are primary; a minority partition must
            refuse writes rather than diverge.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your failover mechanism has never been tested. Is it real?</strong> No. Untested failover
            is theater, DNS TTLs, replica promotion, and app reconnection all fail in ways you only find by
            practicing. Game days and chaos drills that actually kill a region or replica are how you learn
            your true RTO, which is usually worse than the diagram promises.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Do you replicate synchronously or asynchronously across regions?</strong> Async by default,
            because synchronous cross-region writes add tens of milliseconds and couple availability, one
            region's latency stalls the other. I only go synchronous when RPO 0 is a hard requirement, and
            then I accept the write-latency and coupling cost deliberately, or I geo-partition so most writes
            stay in-region.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I anchor on two numbers: RPO, how much data I can lose, set by replication lag, and RTO, how long I
          can be down, set by failover speed. Those pick the DR strategy along a cost curve, backup and restore
          for hours, pilot light for tens of minutes, warm standby for minutes, active-active for near-zero,
          and I choose the cheapest that meets the targets. Multi-region is really a data problem: active-passive
          is simpler because only one region writes, while active-active has to solve replication and
          write-conflict resolution and prevent split-brain with quorum and fencing. Within a region, HA is
          multi-AZ redundancy, health checks, and short dependency chains, because availability multiplies in
          series."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Everything hangs off RPO and RTO, and I keep them separate. RPO is the maximum data loss as a time
          window, and it is set by replication: synchronous gives RPO near zero, asynchronous gives RPO equal
          to the lag. RTO is the maximum downtime, set by how fast I can fail over. Those two numbers drive a
          four-point DR ladder: backup and restore is cheapest but hours of RTO and RPO; pilot light keeps core
          data replicated with a minimal footprint you scale up, tens of minutes; warm standby runs a
          scaled-down live copy for minutes; active-active runs both regions live for near-zero RTO and RPO at
          the highest cost. I pick the cheapest rung that meets the requirement instead of defaulting to
          active-active. The key insight for multi-region is that the hard part is data, not compute.
          Active-passive is simpler because only the primary writes, so there are no write conflicts, just idle
          standby and failover time. Active-active removes idle capacity and tolerates a region loss instantly,
          but now two regions can write the same record, so I need conflict resolution, last-writer-wins,
          CRDTs, or geo-partitioning writes, and I must prevent split-brain with quorum, leader election, and
          fencing so only one side accepts writes during a partition, which is a direct CAP trade. Traffic
          shifts via health checks and latency or geo DNS. Under all of it, single-region HA is multi-AZ
          redundancy with health checks and automatic database failover, and I remember the math: availabilities
          multiply in series and redundancy in parallel adds nines, so short dependency chains and redundancy
          buy reliability. And I always say failover has to be tested with game days, because untested failover
          is fiction and real RTO is usually worse than the diagram."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ───────────────────────────────────── */
const DECK = [
  { q: "What sets the monolith-to-microservices break-even?", a: "Organization and domain size, not fashion. Microservices carry a fixed distributed-systems tax (network, ops, data consistency) and lower the marginal cost of adding teams and scaling hot spots. Below the crossover, a modular monolith is cheaper and faster.", tag: "styles" },
  { q: "In hexagonal architecture, what is a port vs an adapter?", a: "A port is an interface the domain owns (e.g. a repository interface); an adapter implements or drives it (a Postgres repo, an HTTP handler). Dependencies point inward, so the domain has no knowledge of its infrastructure and is testable with fakes.", tag: "styles" },
  { q: "What is the one law of layered vs clean architecture?", a: "Dependency direction. In layered, the domain depends down on the data layer and database, so the schema drives the domain. In clean/hexagonal/onion, dependencies point inward to the domain, which depends on nothing outside.", tag: "styles" },
  { q: "Event vs command, in one line each.", a: "An event is an immutable past-tense fact broadcast to zero or more consumers (OrderPlaced). A command is an imperative instruction sent to exactly one handler (PlaceOrder). Confusing them couples a producer to a consumer it should not know about.", tag: "messaging" },
  { q: "Why is exactly-once delivery a myth, and what do you do?", a: "Across a broker, your service, and an external database you cannot guarantee no-loss and no-duplicate end to end. You engineer effectively-once: at-least-once delivery plus an idempotent consumer (dedupe on message id or a natural upsert).", tag: "messaging" },
  { q: "Queue vs log broker, what's the difference?", a: "A queue deletes a message on ack (point-to-point, competing consumers, no history). A log keeps an ordered, replayable record with per-consumer offsets (many consumer groups, replay, retention). Kafka is a log; RabbitMQ/SQS are queues.", tag: "messaging" },
  { q: "Are CQRS and event sourcing the same thing?", a: "No, they're separable. CQRS splits write model from denormalized read models (a materialized view is CQRS). Event sourcing stores the event log as the source of truth. They pair well but each is used independently.", tag: "data" },
  { q: "What's the headline cost of CQRS?", a: "Eventual consistency: an async projector updates the read models, so a user can write then not see their own change immediately. You design for read-your-writes, and accept more moving parts.", tag: "data" },
  { q: "What does event sourcing's replay superpower give you?", a: "You can add a brand-new read model months later and populate it entirely by replaying the event log through a new projection. Plus a free audit trail and temporal queries about past state.", tag: "data" },
  { q: "What is a saga's compensation, and how is it not a rollback?", a: "A compensating transaction is a new business action that semantically reverses a committed step (issue a refund, not un-charge). Because effects aren't truly reversible, you order steps so the hard-to-compensate one (payment) runs late.", tag: "data" },
  { q: "Orchestration vs choreography for sagas?", a: "Orchestration uses a central coordinator that drives steps and compensation, explicit and monitorable, best for complex flows. Choreography has services react to each other's events, loosely coupled but emergent and hard to trace, best for simple flows.", tag: "data" },
  { q: "Gateway vs service mesh, cleanest distinction?", a: "Direction of traffic. An API gateway handles north-south (clients into the system): TLS, auth, rate limiting, routing. A service mesh handles east-west (service to service): mTLS, retries, timeouts, circuit breaking. Complementary, not alternatives.", tag: "topology" },
  { q: "What is a BFF and why have one?", a: "A Backend for Frontend is a gateway specialized per client type. Mobile wants small aggregated payloads, web wants richer ones; a single API forces everyone to over- or under-fetch. Each BFF shapes responses for its client, owned by that client's team.", tag: "topology" },
  { q: "Walk the circuit breaker states, including half-open.", a: "CLOSED lets calls through and counts failures; at a threshold it trips to OPEN and fails fast without calling the dependency. After a cooldown it goes HALF-OPEN and allows one trial request: success closes it, a single failure re-opens it and restarts the cooldown.", tag: "resilience" },
  { q: "What is a bulkhead and how does it differ from a circuit breaker?", a: "A bulkhead isolates resource pools (a separate thread/connection pool per dependency) so one slow dependency can't exhaust shared threads. A breaker stops calling a failing dependency. Bulkhead is a capacity partition; breaker is a time-based trip. They compose.", tag: "resilience" },
  { q: "Why retry with backoff AND jitter, not just backoff?", a: "Exponential backoff alone still lets many clients retry in lockstep, a thundering herd that hammers a recovering dependency. Jitter randomizes the delay so retries spread out. Add a cap, a retry budget, and only retry idempotent operations.", tag: "resilience" },
  { q: "Over capacity: queue the excess or shed it?", a: "Shed it. Unbounded queues just defer the failure and add latency until things time out anyway. Load shedding rejects excess early with 429/503, ideally dropping low-priority work first, so the system stays up for its most important traffic.", tag: "resilience" },
  { q: "RPO vs RTO, precisely?", a: "RPO is the max acceptable data loss as a time window, set by replication lag (sync near 0, async equals the lag). RTO is the max acceptable downtime, set by failover speed. RPO is about the past (data), RTO about the future (recovery time). They pick your DR strategy.", tag: "ha" },
  { q: "Why is active-active a data problem, not a compute problem?", a: "Two regions serving writes can update the same record concurrently, so the hard part is replication and conflict resolution (last-writer-wins, CRDTs, or geo-partition writes) and preventing split-brain with quorum and fencing. Active-passive sidesteps it since only one region writes.", tag: "ha" },
  { q: "Name the four DR strategies from cheapest to fastest recovery.", a: "Backup & restore (hours), pilot light (tens of minutes, minimal always-on footprint scaled up on disaster), warm standby (minutes, a scaled-down running copy), and active-active (near-zero, both regions live). Pick the cheapest that still meets RPO and RTO.", tag: "ha" },
];

function QuickfireDrill() {
  return (
    <>
      <Lede>
        Twenty cards spanning the whole bench, architecture styles, decomposition and data patterns, and the
        resilience toolkit. The rep that works: read the card, answer <strong>out loud</strong> in a sentence
        or two before revealing, then grade yourself honestly. Shuffle between runs so you drill recall, not
        card order, and anything you miss twice, go re-read the topic behind it.
      </Lede>
      <Try label="rapid fire"><QuickFire accent={ACCENT} deck={DECK} /></Try>
    </>
  );
}

const CONTENT = {
  monolithmicro: <MonolithMicro />,
  layering: <Layering />,
  eventdriven: <EventDriven />,
  cqrses: <CqrsEs />,
  saga: <Saga />,
  meshbff: <MeshBff />,
  resilience: <Resilience />,
  failover: <Failover />,
  quickfire: <QuickfireDrill />,
};

export default function PatternsBench() {
  const [active, setActive] = useState("monolithmicro");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Styles & resilience · the HOW"
      title="Architecture Patterns & Resilience"
      subtitle="Choosing and defending a topology, and the patterns that keep it standing under failure."
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
