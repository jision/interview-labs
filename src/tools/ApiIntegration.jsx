import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import ApiStyleSelectorViz from "./apiint/ApiStyleSelectorViz.jsx";
import IdempotencyViz from "./apiint/IdempotencyViz.jsx";

const ACCENT = "#8b7cff";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "apistyles", label: "REST vs gRPC vs GraphQL", group: "API design" },
  { id: "restdesign", label: "Resource, pagination & errors", group: "API design" },
  { id: "versioning", label: "Versioning & backward-compat", group: "Evolve safely" },
  { id: "idempotency", label: "Idempotency keys & retries", group: "Evolve safely" },
  { id: "schemaevo", label: "Event & schema evolution", group: "Evolve safely" },
  { id: "queuetopic", label: "Queue vs topic & delivery", group: "Integration" },
  { id: "outbox", label: "Outbox, CDC & dual-write", group: "Integration" },
  { id: "contracttest", label: "Contract testing", group: "Integration" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* ── REST vs gRPC vs GraphQL ───────────────────────────────────── */
function ApiStyles() {
  return (
    <>
      <Lede>
        The first integration question is which API style, and the honest answer is rarely "one for
        everything." REST is the default boundary for public and partner APIs, gRPC is the default for
        internal service-to-service traffic, and GraphQL earns its keep when many different clients each
        need a different slice of the same graph. Knowing the trade-offs, not just the names, is the senior
        signal.
      </Lede>

      <Block eyebrow="the three styles" title="REST, gRPC, and GraphQL at a glance">
        <OpTable
          cols={["Style", "Shape", "", "Where it wins"]}
          rows={[
            { op: "REST", avg: "resources + HTTP verbs", avgTone: "good", why: "Ubiquitous tooling, cacheable via HTTP, browser-native, self-describing with OpenAPI. The default public and partner boundary." },
            { op: "gRPC", avg: "contract-first RPC", avgTone: "good", why: "Binary protobuf over HTTP/2, multiplexing and streaming, codegen for polyglot services. The default internal east-west call." },
            { op: "GraphQL", avg: "client-shaped query", avgTone: "ok", why: "One typed endpoint, the client picks the exact fields, killing over- and under-fetch for many-client frontends. Caching and N+1 are the costs." },
          ]}
        />
      </Block>

      <Block eyebrow="the public default" title="REST: resources over plain HTTP">
        <p className="text-ink-dim leading-relaxed mb-2">
          REST models the domain as <strong>resources</strong> (nouns) addressed by URLs, with HTTP verbs
          expressing the action: GET reads, POST creates, PUT replaces, PATCH partially updates, DELETE
          removes. It rides on everything the web already gives you, so it wins on reach.
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Caching for free</strong>, GET responses cache in browsers, proxies, and CDNs via ETag and Cache-Control.</li>
          <li><strong>Universal clients</strong>, every language, every HTTP tool, curl and a browser tab. Lowest onboarding cost for external developers.</li>
          <li><strong>Self-describing</strong>, an OpenAPI spec generates docs, clients, and mocks.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          The weakness: <strong>over- and under-fetching</strong>. A fixed response shape means clients
          often get fields they do not need, or must make several round trips to assemble related
          resources.
        </p>
      </Block>

      <Block eyebrow="the internal default" title="gRPC: contract-first RPC over HTTP/2">
        <p className="text-ink-dim leading-relaxed mb-2">
          gRPC starts from a <strong>protobuf</strong> IDL: you declare the service and messages, and the
          toolchain generates strongly-typed clients and servers in every language. Payloads are compact
          binary, and it runs over HTTP/2, so it multiplexes many calls on one connection and supports four
          call shapes: unary, server-streaming, client-streaming, and bidirectional streaming.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          That makes it the natural choice for <strong>internal, high-volume, low-latency</strong> traffic
          between microservices, especially a polyglot fleet where one contract feeds every language.
        </p>
        <Callout kind="trap" title="gRPC is not browser-native">
          Browsers cannot speak raw gRPC (no direct access to HTTP/2 frames), so a public web client needs
          grpc-web plus a proxy. Binary payloads are also not human-readable, so it is a poor fit for an
          open public API where developers want to curl an endpoint and read JSON.
        </Callout>
      </Block>

      <Block eyebrow="the client-shaped option" title="GraphQL: one endpoint, the client picks the fields">
        <p className="text-ink-dim leading-relaxed mb-2">
          GraphQL exposes a single endpoint and a typed schema graph. The client sends a query naming
          exactly the fields it wants, across multiple related entities, and gets exactly that back in one
          round trip. It shines when you have <strong>many different clients</strong> (web, iOS, Android,
          partners) each needing a different shape of the same underlying data.
        </p>
        <OpTable
          cols={["Cost of GraphQL", "What breaks", "", "Mitigation"]}
          rows={[
            { op: "Caching", avg: "no HTTP cache", avgTone: "bad", why: "Queries are POSTed to one URL, so CDN and browser caching do not apply out of the box. You cache in the app layer or use persisted queries." },
            { op: "N+1 fetches", avg: "resolver fan-out", avgTone: "bad", why: "A naive resolver fires one DB query per item in a list (1 + N). Batch per request with a DataLoader so it becomes 1 + 1." },
            { op: "Query cost", avg: "unbounded queries", avgTone: "ok", why: "A client can ask for a deep, expensive graph. Add depth limits, complexity scoring, and timeouts." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you pick a style from the requirements rather than fashion: REST for a public boundary,
          gRPC for internal east-west calls, GraphQL for many clients shaping payloads, and whether you can
          name the cost of each (REST over-fetches, gRPC is not browser-native, GraphQL fights caching and
          N+1).
        </Callout>
      </Block>

      <Block eyebrow="decide it live" title="Pick a style from the requirements">
        <p className="text-ink-dim leading-relaxed mb-3">
          Toggle the requirements that describe the boundary and watch the recommendation move. The point
          is that real systems mix styles: REST at the public edge, gRPC between services, GraphQL where a
          frontend needs to shape its own payload.
        </p>
        <Try label="pick an API style">
          <ApiStyleSelectorViz />
        </Try>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Your public API over-fetches on mobile. Do you switch everything to GraphQL?</strong> No,
            that is a big blast radius. First try REST field selection (a sparse-fieldset param), a
            purpose-built endpoint, or a Backend-for-Frontend that composes calls. Adopt GraphQL only when
            the diversity of client shapes is the actual, recurring problem.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you version each style?</strong> REST versions in the URL or a media type; gRPC
            evolves the proto additively with reserved field numbers and only forks a new service package on
            a true break; GraphQL prefers no versions at all, you add fields and deprecate old ones with the
            @deprecated directive.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Internal calls need streaming. gRPC or something else?</strong> gRPC bidirectional
            streaming is the clean fit for service-to-service. If a browser is the client, that becomes
            Server-Sent Events or WebSockets at the edge, because the browser cannot hold a raw gRPC stream.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Can these coexist?</strong> Almost always yes, and that is the mature answer: REST or
            GraphQL at the public edge for reach, gRPC behind it for fast internal hops. The style is a
            per-boundary decision, not a company-wide religion.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I pick the API style per boundary. REST is my default for public and partner APIs because it is
          ubiquitous, cacheable, and self-describing with OpenAPI. gRPC is my default for internal
          service-to-service calls: protobuf contracts, HTTP/2 multiplexing and streaming, and generated
          clients for a polyglot fleet, though it is not browser-native. GraphQL is for when many clients
          each need a different slice of one graph, at the cost of harder caching and the N+1 resolver
          problem. Most real systems use more than one."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "REST models resources over HTTP verbs and inherits the whole web: HTTP caching through ETags and
          CDNs, universal client support, and OpenAPI for docs and codegen, which is why it is the right
          public and partner default. Its weakness is a fixed response shape, so clients over-fetch or make
          extra round trips. gRPC is contract-first: a protobuf IDL generates typed clients and servers,
          payloads are compact binary over HTTP/2 with real streaming, so it is the low-latency choice for
          internal east-west traffic across many languages, but browsers cannot speak it without grpc-web
          and a proxy, and binary is not human-readable, so it is a poor public API. GraphQL gives one typed
          endpoint where the client asks for exactly the fields it wants across related entities in a single
          round trip, which is ideal when web, mobile, and partners each need a different shape, but it
          fights HTTP caching, invites the N+1 resolver problem you fix with DataLoader batching, and needs
          depth and complexity limits so a client cannot ask for an unbounded graph. In practice I combine
          them: REST or GraphQL at the edge for reach, gRPC between services for speed."
        </Callout>
      </Block>
    </>
  );
}

/* ── Resource, pagination & errors ─────────────────────────────── */
function RestDesign() {
  return (
    <>
      <Lede>
        A REST API is judged on the boring parts: resource modeling, pagination, and error semantics. Get
        these right and the API feels obvious to integrate against; get them wrong and every consumer files
        a support ticket. The interview probes whether you know idempotent methods, why cursor pagination
        beats offset at scale, and how to return errors a client can act on.
      </Lede>

      <Block eyebrow="model the nouns" title="Resources, verbs, and status codes">
        <p className="text-ink-dim leading-relaxed mb-2">
          Resources are <strong>nouns</strong> in the path (<code className="font-mono">/orders/42/items</code>);
          the HTTP <strong>verb</strong> carries the action. Two properties do a lot of work: a method is{" "}
          <strong>safe</strong> if it has no side effect (GET, HEAD), and <strong>idempotent</strong> if
          repeating it lands the same state (GET, PUT, DELETE). POST is neither, which is exactly why POST
          needs idempotency keys and the others do not.
        </p>
        <OpTable
          cols={["Method", "Meaning", "", "Idempotent?"]}
          rows={[
            { op: "GET", avg: "read", avgTone: "good", why: "Safe and cacheable, no side effects. Repeating it changes nothing." },
            { op: "POST", avg: "create / do", avgTone: "bad", why: "Not idempotent: two POSTs create two rows. This is the method that needs an idempotency key." },
            { op: "PUT", avg: "full replace", avgTone: "good", why: "Idempotent: putting the same representation twice yields the same resource state." },
            { op: "PATCH", avg: "partial update", avgTone: "ok", why: "Not idempotent in general, but can be designed to be. DELETE is idempotent (gone stays gone)." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Return precise status codes: 201 with a Location header on create, 202 for accepted-but-async,
          204 for a body-less success, 400 for malformed input, 401 vs 403 for auth vs permission, 404 for
          missing, 409 for a conflict, 422 for a well-formed but invalid body, 429 for rate limits, and
          5xx only for genuine server faults.
        </p>
      </Block>

      <Block eyebrow="page the data" title="Cursor pagination beats offset at scale">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Offset pagination</strong> (<code className="font-mono">LIMIT 20 OFFSET 4000</code>) is
          trivial and lets you jump to any page, but it has two problems on large or live data: the database
          scans and discards every skipped row, so deep pages get slow, and if rows are inserted or deleted
          between requests, items <strong>shift</strong>, so a page repeats or skips records.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Cursor (keyset) pagination</strong> passes an opaque cursor that encodes the last-seen
          sort key; the next page seeks directly into the index. It stays fast at any depth and is stable
          under concurrent writes, at the cost of no random page jumps.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`OFFSET (slow + unstable on deep/live data):
  SELECT * FROM events ORDER BY created_at, id LIMIT 20 OFFSET 4000
  -> DB reads 4020 rows, throws away 4000. Inserts shift the window.

CURSOR / keyset (fast + stable):
  SELECT * FROM events
  WHERE (created_at, id) > (:last_ts, :last_id)   -- the cursor
  ORDER BY created_at, id
  LIMIT 20
  -> index seek, O(log n) to the start of the page, no drift.

response: { items: [...], next_cursor: "b64(last_ts,last_id)" }`}
        />
        <Callout kind="tip" title="Rule of thumb">
          Cursor pagination for feeds, infinite scroll, and anything large or changing. Offset is fine only
          for small, bounded, mostly-static lists where users genuinely jump to page numbers, like an admin
          table.
        </Callout>
      </Block>

      <Block eyebrow="fail usefully" title="Errors a client can act on">
        <p className="text-ink-dim leading-relaxed mb-2">
          An error response has one job: tell the caller what to do next. Use the status code as the
          category (4xx = fix your request, 5xx = our fault, retry), and put a machine-readable body under
          it. The modern standard is <strong>RFC 9457 Problem Details</strong>{" "}
          (<code className="font-mono">application/problem+json</code>), which replaced RFC 7807.
        </p>
        <CodeBlock
          title="application/problem+json"
          lang="text"
          code={`HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type":   "https://api.example.com/errors/insufficient-funds",
  "title":  "Insufficient funds",
  "status": 422,
  "detail": "Account 42 has balance $10, charge was $50.",
  "instance": "/accounts/42/charges",
  "trace_id": "b7c1e9..."   // correlation id for support
}`}
        />
        <ul className="text-ink-dim leading-relaxed mt-2 mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>400 vs 422 vs 409</strong>, malformed (cannot parse) vs well-formed-but-invalid (validation) vs conflict with current state (duplicate, stale version).</li>
          <li><strong>A stable machine code</strong>, clients branch on a <code className="font-mono">type</code> or error code, never on the human title string.</li>
          <li><strong>A correlation / trace id</strong>, so a user report maps to one request in your logs. Never leak stack traces or internal identifiers.</li>
        </ul>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you distinguish idempotent from non-idempotent methods, default to cursor pagination for
          scale, and return precise, machine-readable errors with a correlation id, the difference between
          an API that is a pleasure to integrate and one that generates tickets.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you filter and sort without inventing a query language?</strong> Query
            parameters with a documented allow-list: <code className="font-mono">?status=paid&amp;sort=-created_at</code>.
            Keep the sort key aligned with your cursor so pagination stays consistent, and reject unknown
            fields rather than silently ignoring them.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A client needs page 500 of a cursor-paginated list. What do you tell them?</strong> That
            random deep jumps are the one thing cursors trade away, and it is usually an XY problem, they
            actually want a filter or a date range, not literal page 500. If true random access is a hard
            requirement, offset with a sane max, or a search index, is the honest answer.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Should a validation failure be 400 or 422?</strong> 400 if the request is malformed and
            cannot even be parsed; 422 if it parsed fine but violates business rules. The distinction lets a
            client tell "my JSON is broken" from "my JSON is fine but the value is not allowed," which are
            different fixes.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you keep a list endpoint from becoming an accidental DoS?</strong> A default and
            maximum page size, cursor pagination so deep pages are cheap, rate limiting with 429 plus a
            Retry-After header, and timeouts. Never let a caller request an unbounded result set.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Resources are nouns, verbs carry the action, and I lean on safe and idempotent semantics, GET,
          PUT, and DELETE repeat cleanly, POST does not, which is why POST needs idempotency keys. I default
          to cursor pagination because offset scans and discards skipped rows and drifts under concurrent
          writes. And errors use precise status codes plus RFC 9457 problem+json with a stable machine code
          and a correlation id, so clients branch on the code, not the message."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I model the domain as resources in the path and use HTTP verbs for the action, and I am explicit
          about two properties: safe methods have no side effect, idempotent methods can be repeated with
          the same result. GET, PUT, and DELETE are idempotent; POST is not, which is precisely why creation
          endpoints take an idempotency key. Status codes are the first layer of the contract: 201 with
          Location on create, 202 for async, 204 for no body, 400 for malformed, 401 versus 403 for auth
          versus permission, 404, 409 for conflicts, 422 for valid-but-rejected, 429 for rate limits, and
          5xx only for real server faults. For pagination I default to cursor over offset: offset makes the
          database read and throw away every skipped row so deep pages are slow, and inserts between
          requests shift the window so pages repeat or skip; a keyset cursor seeks straight into the index,
          stays fast at any depth, and is stable under writes, giving up only random page jumps. Errors
          return RFC 9457 problem+json with a type URI, a stable machine code, a human detail, and a
          correlation id so a support ticket maps to one request, and I never leak internals. The theme is
          that the boring parts are the contract."
        </Callout>
      </Block>
    </>
  );
}

/* ── Versioning & backward-compat ──────────────────────────────── */
function Versioning() {
  return (
    <>
      <Lede>
        The real skill is not versioning, it is evolving without a v2. Most changes can be made additively,
        so existing callers never notice, and a new major version is the expensive last resort you reach for
        only on a true break. The interview signal is treating backward compatibility as the default and
        having a real deprecation plan for the rare time you cannot avoid it.
      </Lede>

      <Block eyebrow="two directions" title="Backward vs forward compatibility">
        <p className="text-ink-dim leading-relaxed mb-2">
          Compatibility has a direction, and mixing them up is a classic slip:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Backward compatible</strong>, a new server still accepts requests from old clients. This is what lets you deploy the server without coordinating every caller.</li>
          <li><strong>Forward compatible</strong>, an old reader tolerates data produced by a newer writer, typically by ignoring fields it does not recognize (the <em>tolerant reader</em> pattern).</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          You want both. Backward compatibility frees your deploys; forward compatibility (readers ignoring
          unknown fields) frees your producers to add fields without breaking anyone downstream.
        </p>
      </Block>

      <Block eyebrow="the golden rule" title="Additive-only changes stay compatible">
        <p className="text-ink-dim leading-relaxed mb-2">
          Within a major version, only <strong>add</strong>. Everything additive is safe; everything that
          removes, renames, retypes, or tightens is a break that forces a new version.
        </p>
        <OpTable
          cols={["Change", "Compatible?", "", "Why"]}
          rows={[
            { op: "Add an optional field", avg: "safe", avgTone: "good", why: "Old clients ignore it; new clients use it. The workhorse of API evolution." },
            { op: "Add a new endpoint", avg: "safe", avgTone: "good", why: "Nobody was calling it, so nobody breaks." },
            { op: "Relax a validation rule", avg: "safe", avgTone: "good", why: "Anything that was valid before is still valid; the accepted set only grows." },
            { op: "Remove or rename a field", avg: "breaking", avgTone: "bad", why: "Clients reading it get null or a parse error. This is a new major version." },
            { op: "Make an optional field required", avg: "breaking", avgTone: "bad", why: "Existing requests that omit it now fail. Tightening validation breaks callers." },
            { op: "Change a field's type", avg: "breaking", avgTone: "bad", why: "A string that becomes a number breaks every deserializer. Never retype in place." },
          ]}
        />
        <Callout kind="trap" title="Enums are a hidden break">
          Adding a value to an enum looks additive, but a client with an exhaustive switch on the old values
          crashes on the new one. Document that clients must tolerate unknown enum values, or treat new
          values as a compatibility concern from day one.
        </Callout>
      </Block>

      <Block eyebrow="when you must bump" title="Where the version lives">
        <p className="text-ink-dim leading-relaxed mb-2">
          When a break is unavoidable, you choose where the version marker goes. All of these work; pick one
          and be consistent.
        </p>
        <OpTable
          cols={["Strategy", "Looks like", "", "Trade"]}
          rows={[
            { op: "URI path", avg: "/v2/orders", avgTone: "good", why: "Most common: visible, trivially routable and cacheable, easy to test in a browser. Purists dislike it, pragmatists ship it." },
            { op: "Header / media type", avg: "Accept: ...v2+json", avgTone: "ok", why: "Clean URLs and true content negotiation, but harder to eyeball, test, and cache. Good when one URL must serve several versions." },
            { op: "Query param", avg: "?version=2", avgTone: "ok", why: "Simple to add, but muddies caching and can be forgotten. Occasionally handy, rarely the primary scheme." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Reserve the major bump for genuine breaks and keep the number small. Every live version is code
          you maintain, so the fewer concurrent versions, the better.
        </p>
      </Block>

      <Block eyebrow="retire gracefully" title="Deprecation without a 3am page">
        <p className="text-ink-dim leading-relaxed mb-2">
          Shipping v2 is the easy half; retiring v1 is where discipline shows. The playbook:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Signal it</strong>, mark responses with a <code className="font-mono">Deprecation</code> header and a <code className="font-mono">Sunset</code> date (RFC 8594), and update the docs and changelog.</li>
          <li><strong>Run both in parallel</strong>, v1 and v2 serve traffic through a migration window measured in months, not days, especially for partners.</li>
          <li><strong>Measure usage</strong>, instrument calls per version and per deprecated field so you know who is still on the old path and can reach out directly.</li>
          <li><strong>Then remove</strong>, only after usage drops to near zero and the sunset date has passed. Turning it off before that is how you take down a partner.</li>
        </ul>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you treat additive evolution as the default and a new major version as a real cost, and
          whether you have an actual deprecation plan, signaling, parallel-run, usage measurement, and a
          sunset, rather than "we will just cut over."
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>A partner cannot migrate off v1 by the sunset date. What now?</strong> This is a
            relationship problem with a technical fallback: negotiate an extension for that partner, keep v1
            behind a flag scoped to them, and set a hard final date. What you do not do is silently break
            them, and you do not hold the whole platform hostage to one laggard forever.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You must change a field's meaning, not just its shape. Is that additive?</strong> No, a
            semantic change is a break even if the type is identical, because clients relied on the old
            meaning. Add a new field with the new semantics and deprecate the old one; never quietly change
            what a field means underneath callers.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you avoid maintaining five live versions?</strong> Bias hard toward additive
            changes so most evolution needs no bump at all, and enforce a policy like "at most two supported
            versions." Each concurrent version is duplicated code paths and test surface, so the count is a
            cost you budget, not a freebie.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How is this different for internal gRPC or event schemas?</strong> The principle is
            identical, additive-only, but the mechanism differs: gRPC uses reserved protobuf field numbers,
            and events use a schema registry with a compatibility policy. Same rule, enforced by the tool
            instead of by convention.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "My goal is to evolve without a v2. I keep changes additive, new optional fields, new endpoints,
          relaxed validation, so existing callers never notice, because that is backward compatible and my
          readers ignore unknown fields for forward compatibility. Removing, renaming, retyping, or
          tightening is the only thing that forces a new major version, which I put in the URL path and keep
          rare. When I must deprecate, I signal with Deprecation and Sunset headers, run both versions in
          parallel, measure usage, and only then remove."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I separate two directions first: backward compatible means a new server still serves old clients,
          which frees my deploys; forward compatible means old readers tolerate new data by ignoring unknown
          fields, the tolerant-reader pattern, which frees my producers. Within a major version I only add.
          Adding an optional field, a new endpoint, or relaxing validation is safe because the accepted set
          only grows and old clients ignore what they do not know. Removing or renaming a field, making an
          optional field required, changing a type, or changing a field's meaning are all breaks, and even
          adding an enum value can break a client with an exhaustive switch, so I document that clients must
          tolerate unknown values. A true break earns a major version, usually in the URL path because it is
          visible, routable, and cacheable, and I keep the number of live versions small because each one is
          maintained code. The half people skip is deprecation: I signal with a Deprecation header (RFC 9745) and a
          Sunset date (RFC 8594), run old and new in parallel through a migration window, instrument usage per version
          and per deprecated field so I know exactly who to call, and only remove after usage is near zero
          and the sunset has passed. If a partner cannot make it, that is a negotiation, not a silent
          breakage."
        </Callout>
      </Block>
    </>
  );
}

/* ── Idempotency keys & retries ────────────────────────────────── */
function Idempotency() {
  return (
    <>
      <Lede>
        Networks fail after the server did the work but before the client saw the response. A timeout is
        ambiguous, the request may have succeeded, so clients must retry, and retries mean at-least-once. On
        a non-idempotent operation like "charge a card," a blind retry double-charges. The idempotency key
        is how the server makes retries safe.
      </Lede>

      <Block eyebrow="the ambiguity" title="A timeout does not tell you what happened">
        <p className="text-ink-dim leading-relaxed mb-2">
          When a request times out, the client is in the dark: the server may have completed the operation
          and only the response was lost, or it may never have run. The client cannot tell which, so the
          only safe behavior is to <strong>retry</strong>, and any system with retries has{" "}
          <strong>at-least-once</strong> delivery, meaning duplicates are guaranteed eventually. GET, PUT,
          and DELETE shrug this off because they are idempotent; POST-style "do something" operations do not.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you name that a timeout is ambiguous, so retries are mandatory, and that the dedup
          therefore has to live on the <em>server</em> keyed by a client-supplied key, not in hopeful
          client logic. That single sentence is the senior tell.
        </Callout>
      </Block>

      <Block eyebrow="the pattern" title="The idempotency-key sequence">
        <p className="text-ink-dim leading-relaxed mb-2">
          The client generates one unique key per <em>logical</em> operation (a UUID) and sends it, for
          example in an <code className="font-mono">Idempotency-Key</code> header. The server keeps a store
          of keys it has processed and their saved responses. First time it sees a key, it executes and
          stores the result; on any retry with the same key, it skips execution and returns the stored
          result.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`WITHOUT a key:
  client --charge $50-------------> server  [debit $50]  --X  (timeout, no response)
  client --charge $50 (retry)-----> server  [debit $50 AGAIN] --> 200 OK
  ledger: -$100   DOUBLE CHARGED

WITH an idempotency key:
  client --charge $50, key=abc----> server  [key abc new]  [debit $50]
                                             [store abc -> result]  --X (timeout)
  client --charge $50, key=abc----> server  [key abc SEEN] [return stored result] --> 200 OK
  ledger: -$50    CHARGED ONCE

  retries give at-least-once delivery; the key makes the RESULT effectively-once.`}
        />
      </Block>

      <Block eyebrow="see it happen" title="Retry with and without a key">
        <p className="text-ink-dim leading-relaxed mb-3">
          Send the charge, then hit retry to simulate the timeout. With no key each retry re-applies the
          debit; with a key the server dedupes and the customer is charged once no matter how many times the
          request is replayed.
        </p>
        <Try label="retry with a key">
          <IdempotencyViz />
        </Try>
      </Block>

      <Block eyebrow="the server side" title="Implementing dedup correctly">
        <p className="text-ink-dim leading-relaxed mb-2">
          The store maps <code className="font-mono">idempotency_key -&gt; saved response</code>. The
          details that separate a toy from production:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Atomic first-write</strong>, insert the key with a unique constraint (or a lock) so two concurrent retries cannot both pass the "is this new?" check and both execute. The loser waits or returns the in-flight result.</li>
          <li><strong>Store the response, not just the key</strong>, so a retry returns the identical status and body the original would have, not a fresh computation.</li>
          <li><strong>Scope and expire the key</strong>, scope it to the account and operation, and give it a TTL (Stripe uses 24 hours), because keys are for retrying a transient failure, not for dedup across all of time.</li>
          <li><strong>Bind the key to the request</strong>, if the same key arrives with a different payload, reject it (409), otherwise a bug could reuse a key for a different charge.</li>
        </ul>
        <Callout kind="trap" title="Idempotent processing, not exactly-once delivery">
          You cannot guarantee a message is delivered exactly once across a network. What you can do is make
          reprocessing harmless: at-least-once delivery plus idempotent handling equals effectively-once
          results. The idempotency key is how you buy that on a write API.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Two retries with the same key arrive at the exact same instant. What happens?</strong> A
            race: both could pass a naive "have I seen this key?" read and both execute. The fix is a unique
            constraint or lock on the key so the first insert wins and the second blocks or returns the
            first result. The dedup must be atomic with recording the key, not a check-then-act.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How long do you keep keys, and why not forever?</strong> A TTL of hours to a day: long
            enough to cover client retries and outages, short enough that the store does not grow without
            bound. Keys exist to neutralize a transient failure, not to guarantee a charge is unique across
            all history, that is a business-uniqueness concern with its own constraint.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The same key comes back with a different request body. Now what?</strong> Reject it, a
            409, because reusing a key for a different operation is a client bug, and silently returning the
            old result would hide it. Bind the stored result to a hash of the request so a mismatch is caught.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Who generates the key, and should GET use one?</strong> The client generates it per
            logical operation so a retry reuses the same value. Safe, already-idempotent methods, GET, PUT,
            DELETE, do not need one; the pattern is for non-idempotent writes, chiefly POST.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "A timeout is ambiguous, the write may have succeeded with only the response lost, so clients must
          retry, which makes delivery at-least-once and risks double-charging on a POST. The fix is an
          idempotency key: the client sends a unique key per logical operation, the server dedupes on it,
          executing and storing the result the first time and returning the stored result on every retry. I
          make the first write atomic with a unique constraint, store the response, and give keys a TTL. The
          result is effectively-once."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The root problem is that a network timeout tells the client nothing: the server may have charged
          the card and lost the response, or never run at all. Since the client cannot know, it has to
          retry, and any retrying system is at-least-once, so duplicates are inevitable. Idempotent methods
          like GET, PUT, and DELETE are fine, but a POST that charges a card is not, so a blind retry
          double-charges. The idempotency key solves it: the client generates a unique key per logical
          operation and sends it in a header; the server keeps a store from key to saved response. The first
          time it sees a key it executes and stores the result; on any retry with the same key it skips
          execution and replays the stored result. The production details matter: the first write must be
          atomic, a unique constraint or lock on the key, so two simultaneous retries cannot both execute; I
          store the actual response so retries are identical; I scope the key to the account and operation
          and expire it with a TTL like 24 hours; and I bind it to the request payload so the same key with
          a different body is rejected. I would frame the guarantee honestly: you cannot get exactly-once
          delivery across a network, but at-least-once plus idempotent processing gives effectively-once
          results, and the key is how you buy that on a write endpoint."
        </Callout>
      </Block>
    </>
  );
}

/* ── Event & schema evolution ──────────────────────────────────── */
function SchemaEvo() {
  return (
    <>
      <Lede>
        Events outlive the code that wrote them. A message sitting in a topic or a log may be read by a
        consumer you deploy next year, so an event is a contract just like a REST body. A schema registry
        with a compatibility policy is how you change that contract without paging every consumer at 3am.
      </Lede>

      <Block eyebrow="events are contracts" title="Producer and consumer are decoupled in time">
        <p className="text-ink-dim leading-relaxed mb-2">
          In a synchronous API the caller sees your change immediately. With events, the producer and
          consumers are decoupled: they deploy on different schedules, and old messages persist. That means
          you cannot assume everyone reads the new schema at once, so the schema itself must be governed for
          <strong> forward and backward compatibility</strong>, exactly the additive-only discipline from
          API versioning, now enforced by a registry.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you pick a compatibility mode that matches your deploy order, backward means consumers
          upgrade first, forward means producers upgrade first, and whether you know the concrete rule for
          your format (Avro fields need defaults; protobuf field numbers are never reused).
        </Callout>
      </Block>

      <Block eyebrow="the policy" title="Compatibility modes and who upgrades first">
        <p className="text-ink-dim leading-relaxed mb-2">
          A schema registry (Confluent and others) enforces a mode on every new schema version before it is
          allowed. The mode determines which side you can deploy first without breaking anyone.
        </p>
        <OpTable
          cols={["Mode", "Guarantees", "", "Deploy order it enables"]}
          rows={[
            { op: "Backward", avg: "new schema reads old data", avgTone: "good", why: "Upgrade consumers first. Allowed: add an optional field with a default, remove a field. The common default for consumer-driven systems." },
            { op: "Forward", avg: "old schema reads new data", avgTone: "ok", why: "Upgrade producers first. Allowed: add a field, remove an optional field. Consumers keep working on data they do not fully understand yet." },
            { op: "Full", avg: "both directions", avgTone: "good", why: "Deploy either side in any order. Only add or remove optional fields that have defaults. The safest, most restrictive policy." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The <strong>transitive</strong> variants check a new schema against <em>all</em> prior versions,
          not just the previous one, which is what you want when very old messages can still be replayed
          from a log.
        </p>
      </Block>

      <Block eyebrow="the concrete rules" title="Avro, Protobuf, and JSON Schema">
        <p className="text-ink-dim leading-relaxed mb-2">
          Each format encodes compatibility differently; know the one your stack uses.
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Avro</strong>, to add a field compatibly you must give it a <code className="font-mono">default</code>, so old readers substitute the default and new readers get the value. Removing a field also requires it had a default. Renames need <code className="font-mono">aliases</code>.</li>
          <li><strong>Protobuf</strong>, the <strong>field number is the contract</strong>. Never reuse or renumber a field; mark removed fields <code className="font-mono">reserved</code>. New fields are optional by design in proto3, and unknown fields are preserved on round-trip, which gives forward compatibility almost for free.</li>
          <li><strong>JSON Schema</strong>, the most flexible and the least enforced: additive properties are compatible, but "tolerant reader" behavior (ignore unknown keys) is a convention you must actually implement, not a guarantee.</li>
        </ul>
        <CodeBlock
          title="text"
          lang="text"
          code={`Avro, safe add (backward + forward compatible):
  { "name": "coupon_code", "type": ["null","string"], "default": null }
                                                        ^^^^^^^^^^^^^^^ the default is what makes it safe

Protobuf, safe add and safe remove:
  string coupon_code = 7;      // new field, new number -> fine
  reserved 4;                  // retired field number 4 -> NEVER reuse it
  // "int32 amount = 3" -> "int64 amount = 3" = SAFE (both varint, wire type 0)
  // "int32 amount = 3" -> "string amount = 3" = BREAK (wire type 0 -> 2)`}
        />
        <Callout kind="trap" title="Reusing a protobuf field number is silent corruption">
          If you delete field 4 and later assign number 4 to a new field, old messages on the wire will be
          decoded into the wrong field with no error. Always <code className="font-mono">reserved</code> the
          number (and the name) so it can never be recycled.
        </Callout>
      </Block>

      <Block eyebrow="operational glue" title="Registry, quarantine, and upcasting">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Registry as gatekeeper</strong>, producers register a schema and the registry rejects an incompatible one at publish time, so a breaking change fails in CI, not in a consumer at midnight.</li>
          <li><strong>Quarantine / dead-letter</strong>, messages that fail validation route to a dead-letter topic with alerting rather than poisoning the main stream, and a human decides what to do.</li>
          <li><strong>Upcasting</strong>, when you genuinely need a new shape, a transformation step reads old events and lifts them to the current schema, so consumers only ever see one version.</li>
        </ul>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>You must make a truly breaking event change. How, without a flag day?</strong> Publish a
            new schema subject or a v2 event type alongside the old one, dual-publish both for a migration
            window, move consumers over one at a time, and retire the old event only when its consumption
            drops to zero. Same additive-then-deprecate playbook as REST versioning.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Which compatibility mode do you default to and why?</strong> Backward (or full) for most
            systems, because you usually control and can upgrade consumers first, and backward lets you add
            fields and drop old ones safely. Forward is the pick when producers must move ahead of consumers
            you do not control.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A consumer needs a field that is null on all historical events. What do you do?</strong>{" "}
            Add it with a default so old events read cleanly, backfill or upcast history if the field is
            derivable, and have the consumer treat the default as "unknown" rather than a real value. Never
            retroactively rewrite the field's meaning.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Registry enforcement versus tolerant readers, which matters more?</strong> Both, at
            different layers: the registry stops incompatible schemas from ever being published, and tolerant
            readers (ignore unknown fields) protect consumers from producers that legitimately raced ahead.
            Belt and suspenders.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Events outlive their producer, so a schema is a contract, and I govern it with a registry and a
          compatibility mode. Backward means consumers upgrade first and I can add fields with defaults and
          drop old ones; forward means producers upgrade first; full allows either order. The concrete rules
          matter: Avro needs a default on any added field, and protobuf field numbers are the contract, I
          never reuse them, I mark them reserved. Truly breaking changes get a new event type, dual-published
          through a migration window."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The core idea is that producer and consumers are decoupled in time: they deploy on different
          schedules and old messages persist, so I cannot assume everyone reads the new schema at once. That
          makes an event a contract, governed by a schema registry that enforces a compatibility mode before
          a new version is allowed. Backward compatibility means a new schema can read old data, so I upgrade
          consumers first and I am allowed to add an optional field with a default or remove a field, this is
          my usual default. Forward compatibility means old readers can read new data, so producers can move
          first. Full is both and is the most restrictive, only add or remove optional fields with defaults,
          and the transitive variants check against every past version, which matters when a log can replay
          old events. The format-specific rules are where people slip: in Avro an added field must carry a
          default so old readers get the default and new readers get the value; in protobuf the field number
          is the contract, so I never reuse or renumber and I mark retired numbers reserved. I avoid retyping a
          field in place, because many changes (int32 to string, or int32 to fixed32) alter the wire encoding
          and silently corrupt old readers, though some (int32 to int64) are actually safe. Operationally the registry rejects incompatible
          schemas at publish time so breaks fail in CI, bad messages go to a dead-letter topic with alerting
          rather than poisoning the stream, and when I truly must break, I introduce a new event type,
          dual-publish through a migration window, and retire the old one only when its consumption hits
          zero."
        </Callout>
      </Block>
    </>
  );
}

/* ── Queue vs topic & delivery ─────────────────────────────────── */
function QueueTopic() {
  return (
    <>
      <Lede>
        Asynchronous integration comes down to two questions. First, queue or topic, is this work handed to
        one consumer, or an event broadcast to many? Second, what delivery guarantee, because at-least-once
        is the realistic default and it forces every consumer to be idempotent. Get these two right and most
        messaging designs fall out.
      </Lede>

      <Block eyebrow="point-to-point vs pub/sub" title="Queue vs topic">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>queue</strong> is point-to-point: many workers compete, but each message is delivered to
          exactly one of them. It is for distributing <em>work</em>, and you scale throughput by adding
          consumers. A <strong>topic</strong> is publish/subscribe: every subscriber receives its own copy
          of every message. It is for broadcasting <em>events</em> and decoupling a producer from N
          consumers who each do something different.
        </p>
        <OpTable
          cols={["Primitive", "Delivery", "", "Use it for"]}
          rows={[
            { op: "Queue", avg: "one consumer per message", avgTone: "good", why: "Competing consumers share the load; each message is processed once by one worker. Work distribution: SQS, RabbitMQ queue." },
            { op: "Topic", avg: "every subscriber gets a copy", avgTone: "good", why: "Fan-out: order-placed goes to billing, shipping, and analytics independently. Broadcasting events: SNS, Kafka topic." },
          ]}
        />
        <Callout kind="tip" title="Kafka consumer groups are both">
          A Kafka topic gives you both at once: within one consumer group each partition is handled by a
          single consumer (queue-like load sharing), while multiple groups each receive the full stream
          (topic-like fan-out). One primitive, both behaviors, chosen by how you assign groups.
        </Callout>
      </Block>

      <Block eyebrow="the guarantee" title="At-most, at-least, and exactly-once">
        <p className="text-ink-dim leading-relaxed mb-2">
          The delivery semantic is set by <em>when</em> you acknowledge a message relative to processing it.
        </p>
        <OpTable
          cols={["Semantic", "Behavior", "", "Cost / use"]}
          rows={[
            { op: "At-most-once", avg: "ack before processing", avgTone: "ok", why: "May lose messages, never duplicates. Fine for high-volume metrics or logs where a dropped sample does not matter." },
            { op: "At-least-once", avg: "ack after processing", avgTone: "good", why: "Redelivers on failure, so duplicates happen. The realistic default, and it forces consumers to be idempotent." },
            { op: "Exactly-once", avg: "delivered once, no dup, no loss", avgTone: "bad", why: "Extremely hard across a network; true exactly-once delivery is essentially a myth. Kafka offers exactly-once processing within its own boundary via idempotent producer and transactions." },
          ]}
        />
        <Callout kind="trap" title="Exactly-once delivery is (mostly) a myth">
          Across a network you cannot guarantee a message is delivered once and only once, that is the
          two-generals result. What you can achieve is effectively-once: at-least-once delivery plus
          idempotent consumers, so a redelivery is harmless. When someone says "exactly-once," check whether
          they mean delivery (usually no) or processing within one system's transactional boundary (Kafka
          can).
        </Callout>
      </Block>

      <Block eyebrow="ordering and failure" title="Partitions, redelivery, and dead letters">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Ordering is per-partition, not global</strong>, a broker only guarantees order within a partition or message group. Partition by a key (like user_id) so all events for one entity stay ordered, and never promise global ordering, you do not have it and rarely need it.</li>
          <li><strong>Redelivery and visibility</strong>, at-least-once works by redelivering unacked messages. In SQS a message becomes invisible for a visibility timeout while a worker processes it, and reappears if the worker dies before acking.</li>
          <li><strong>Dead-letter queue</strong>, a message that keeps failing (a poison pill) is moved to a DLQ after N attempts so it stops blocking the queue, with alerting so a human can inspect it.</li>
          <li><strong>Backpressure</strong>, when consumers fall behind, the queue depth grows; you autoscale consumers, shed load, or slow producers rather than letting memory blow up.</li>
        </ul>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you default to at-least-once and immediately say consumers must therefore be idempotent,
          and whether you know ordering is only guaranteed within a partition, the two facts that separate
          real messaging experience from a diagram.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Your consumer must not process a payment twice, but delivery is at-least-once. How?</strong>{" "}
            Idempotent processing: dedupe on a business key or event id in the consumer, so a redelivered
            message is recognized and skipped. You do not chase exactly-once delivery; you make reprocessing
            a no-op, which is the same idempotency-key idea applied to a message handler.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You need strict ordering across all events. Can the broker give it?</strong> Only within
            a partition. Global ordering means a single partition, which kills parallelism and throughput.
            The real move is to define the smallest ordering scope that is correct, usually per entity, and
            partition by that key so each entity is ordered while the whole system stays parallel.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A poison message is stuck at the head of the queue. What happens?</strong> With at-least-once
            it redelivers forever and can block the partition. A max-retry count sends it to a dead-letter
            queue with alerting so the pipeline keeps flowing and a human can inspect the bad message out of
            band.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>When do you choose at-most-once on purpose?</strong> When loss is cheaper than duplication
            or latency, high-volume telemetry, metrics, or logs where a dropped sample is invisible but
            reprocessing or buffering would cost more than it is worth. It is a deliberate trade, not a
            default.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "A queue is point-to-point, one consumer per message for work distribution; a topic is pub/sub,
          every subscriber gets a copy for event fan-out, and Kafka consumer groups give both. On delivery,
          at-least-once is my realistic default, which means consumers must be idempotent because
          redeliveries and duplicates are guaranteed. Exactly-once delivery across a network is basically a
          myth; effectively-once is at-least-once plus idempotency. And ordering is only guaranteed within a
          partition, so I partition by entity key."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "Two questions drive the design. First, queue or topic. A queue is point-to-point with competing
          consumers, each message handled once by one worker, so it distributes work and scales by adding
          consumers, SQS or a RabbitMQ queue. A topic is publish/subscribe, every subscriber gets its own
          copy, so it broadcasts events and decouples a producer from many independent consumers, SNS or a
          Kafka topic, and Kafka consumer groups actually give both: within a group partitions are shared
          queue-style, across groups the whole stream fans out. Second, the delivery guarantee, which is set
          by when you ack. Ack before processing is at-most-once, which can lose messages but never
          duplicates, fine for metrics. Ack after processing is at-least-once, which redelivers on failure
          so duplicates are guaranteed, and this is the realistic default, so I immediately make consumers
          idempotent by deduping on a business key. Exactly-once delivery across a network is essentially
          impossible, the two-generals problem, so I frame the achievable goal as effectively-once:
          at-least-once plus idempotent processing, and I note that Kafka's exactly-once is processing within
          its own transactional boundary, not magic end-to-end delivery. Finally, ordering is only guaranteed
          within a partition, so I partition by entity key to keep per-entity order while staying parallel,
          route poison messages to a dead-letter queue after N retries, and manage backpressure by scaling
          consumers rather than letting queues grow unbounded."
        </Callout>
      </Block>
    </>
  );
}

/* ── Outbox, CDC & dual-write ──────────────────────────────────── */
function Outbox() {
  return (
    <>
      <Lede>
        You updated the database and published an event. Those are two systems with no shared transaction,
        so a crash between them silently loses the event or emits a phantom. This is the dual-write problem,
        and the standard fix is the transactional outbox: make the event part of the same database
        transaction, then relay it out.
      </Lede>

      <Block eyebrow="the failure" title="Why dual-write silently corrupts">
        <p className="text-ink-dim leading-relaxed mb-2">
          The tempting code updates the row and then publishes an event. But the database and the message
          broker are separate systems, and there is no transaction spanning both, so whichever you do
          second can fail on its own:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`DUAL WRITE, order A (db then broker):
  BEGIN; UPDATE orders SET status='paid'; COMMIT;   -- committed to DB
  publish OrderPaid -> broker                        -- CRASH here
  => DB says paid, the event never went out. Downstream is WRONG. Lost event.

DUAL WRITE, order B (broker then db):
  publish OrderPaid -> broker                        -- event is out
  BEGIN; UPDATE orders SET status='paid'; COMMIT;    -- CRASH here
  => event fired, DB never updated. PHANTOM event for a state that does not exist.

No ordering saves you: there is no shared transaction across DB + broker.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you name the root cause, no atomic transaction across the database and the broker, rather
          than reaching for two-phase commit. 2PC is slow, often unsupported by the broker, and the outbox is
          the pattern the industry actually uses.
        </Callout>
      </Block>

      <Block eyebrow="the fix" title="Transactional outbox: one local transaction">
        <p className="text-ink-dim leading-relaxed mb-2">
          Instead of publishing to the broker inside your business logic, write the event into an{" "}
          <strong>outbox table in the same database</strong>, inside the same ACID transaction as the
          business change. Now the row update and the event are committed atomically, both or neither.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`BEGIN;
  UPDATE orders SET status = 'paid' WHERE id = 42;
  INSERT INTO outbox (id, aggregate, type, payload, created_at)
    VALUES (uuid(), 'order:42', 'OrderPaid', '{...}', now());
COMMIT;
-- one transaction: the state change and the event to emit are now inseparable.`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          A separate process, the <strong>relay</strong>, reads unsent rows from the outbox and publishes
          them to the broker, marking each sent (or deleting it) afterward. The atomic write already
          happened; the relay just moves committed intent out to the world.
        </p>
      </Block>

      <Block eyebrow="the relay" title="Polling publisher vs CDC">
        <p className="text-ink-dim leading-relaxed mb-2">
          There are two ways to drain the outbox, and the choice is a latency-versus-simplicity trade.
        </p>
        <OpTable
          cols={["Relay", "How it works", "", "Trade"]}
          rows={[
            { op: "Polling publisher", avg: "SELECT unsent, publish, mark", avgTone: "ok", why: "Dead simple, no extra infrastructure. Adds poll-interval latency and steady read load on the DB. Fine for modest volume." },
            { op: "CDC (log tailing)", avg: "Debezium reads the WAL/binlog", avgTone: "good", why: "A connector tails the database log and streams new outbox inserts in near-real-time, no polling load. The scalable option for high throughput." },
          ]}
        />
        <CodeBlock
          title="text"
          lang="text"
          code={`service
  |  ONE local ACID transaction
  v
[ orders table ]     [ outbox table ]      (same database)
                          |
                          |  relay: polling publisher OR Debezium CDC tailing the log
                          v
                   [ message broker ]  (at-least-once)
                          |
                          v
               consumers  (idempotent: dedupe on the outbox message id)`}
        />
        <Callout kind="trap" title="The relay is at-least-once, so consumers must dedupe">
          A relay can crash after publishing but before marking the row sent, so on restart it republishes,
          you get duplicates. That is fine on purpose: carry the outbox row's unique id as the message id and
          have consumers dedupe on it. At-least-once relay plus idempotent consumers equals effectively-once.
        </Callout>
      </Block>

      <Block eyebrow="neighbors" title="CDC directly, listen-to-yourself, event sourcing">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>CDC on the business table (no outbox)</strong>, tail the log of the orders table itself and turn row changes into events. Simpler, but the events mirror your table schema instead of a clean domain event, and you lose control over payload shape. The outbox lets you emit a proper, versioned event.</li>
          <li><strong>Listen-to-yourself</strong>, publish the event first and update your own state by consuming it. This inverts the problem rather than removing it, and the event becomes the source of truth for your write.</li>
          <li><strong>Event sourcing</strong>, the event log <em>is</em> the state; you never dual-write because there is only one write, appending the event, and current state is a projection. A bigger commitment, but the dual-write problem cannot occur.</li>
        </ul>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Why not just use two-phase commit across the DB and the broker?</strong> 2PC is a
            distributed transaction with a coordinator: it is slow, holds locks across systems, reduces
            availability (a coordinator stall blocks everyone), and many brokers do not support XA at all.
            The outbox keeps the atomic part local to one database, which is cheap and reliable, and accepts
            at-least-once downstream, which is the pragmatic industry choice.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Does the outbox preserve event ordering?</strong> Within an aggregate, yes, if you order
            by the outbox sequence and partition the broker by aggregate key, so all events for one order
            stay ordered. Global ordering is neither guaranteed nor usually needed, same rule as any
            partitioned stream.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The outbox table grows forever. What do you do?</strong> Prune it: delete or archive rows
            once they are confirmed published (and past any replay window). With CDC you often keep rows
            briefly for auditing, then a retention job reaps them so the table and its log footprint stay
            bounded.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>When would CDC directly on the business tables beat an outbox?</strong> When you want a
            faithful replica of the data rather than domain events, replicating a database into a lakehouse or
            search index, where the consumer wants the row shape. For meaningful domain events with a stable
            contract, the outbox wins because you control the payload.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Updating the database and publishing an event are two systems with no shared transaction, so a
          crash between them loses the event or emits a phantom, that is the dual-write problem. The fix is
          the transactional outbox: I write the event into an outbox table in the same ACID transaction as
          the business change, so they commit atomically, then a relay, a poller or Debezium CDC tailing the
          log, publishes it. The relay is at-least-once, so I carry the outbox id and make consumers
          idempotent. I avoid 2PC on purpose."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The dual-write problem is that a database update and an event publish are separate systems with no
          transaction spanning both, so whichever you do second can fail alone: commit the row then crash
          before publishing and you have lost the event; publish then crash before committing and you have a
          phantom event for a state that does not exist. No ordering fixes it, and I would explicitly not
          reach for two-phase commit, it is slow, holds cross-system locks, hurts availability, and most
          brokers do not support it. The transactional outbox keeps the atomic part local: inside the same
          transaction as the business change I insert a row into an outbox table, so the state change and the
          event to emit commit together or not at all. Then a separate relay drains the outbox to the broker.
          The relay is either a polling publisher, which is dead simple but adds latency and DB load, or
          change-data-capture with something like Debezium tailing the write-ahead log, which streams new
          outbox rows in near-real-time with no polling and scales better. The relay is at-least-once, since
          it can publish and then crash before marking the row sent, so I carry the outbox row's id as the
          message id and make consumers dedupe on it, giving effectively-once end to end. I would also
          mention the neighbors: CDC straight off the business tables when I want a data replica rather than
          domain events, listen-to-yourself, and event sourcing, where a single append-only log is the state
          so dual-write cannot happen at all. And I would prune the outbox once rows are confirmed published
          so it stays bounded."
        </Callout>
      </Block>
    </>
  );
}

/* ── Contract testing ──────────────────────────────────────────── */
function ContractTest() {
  return (
    <>
      <Lede>
        End-to-end tests that spin up every service to check one interface are slow, flaky, and expensive to
        run. Contract testing verifies the seam between two services without running both at once: the
        consumer's expectations become a contract, and the provider proves it satisfies them. It is how you
        catch breaking changes in CI instead of in production.
      </Lede>

      <Block eyebrow="the problem" title="Why integration and E2E do not scale">
        <p className="text-ink-dim leading-relaxed mb-2">
          As services multiply, verifying integrations by standing up the whole graph becomes combinatorial:
          slow pipelines, flaky environments, and failures that are hard to localize. The test pyramid says
          keep end-to-end tests few. Contract tests fill the gap, they check the interface between two
          services in isolation, fast and deterministic, so you rarely need the full stack just to catch a
          broken field.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you distinguish consumer-driven contracts (a known set of internal consumers) from
          provider or schema-first contracts (a public API with unknown consumers), and whether you position
          contract tests as the fast seam check that replaces most brittle end-to-end tests.
        </Callout>
      </Block>

      <Block eyebrow="consumer-driven" title="The consumer defines the contract (Pact)">
        <p className="text-ink-dim leading-relaxed mb-2">
          In <strong>consumer-driven contract testing</strong>, the consumer writes tests against a mock of
          the provider, and those interactions are recorded as a <strong>contract</strong> (a pact file).
          The provider then replays that contract against its real implementation to prove it still satisfies
          every consumer's expectations. Pact is the canonical tool.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`1. CONSUMER test runs against a mock provider:
     "GET /orders/42 -> 200 with { id, status }"     -> recorded as a contract

2. contract is published to a broker (e.g. Pact Broker)

3. PROVIDER replays the contract against its REAL implementation:
     does GET /orders/42 still return { id, status }?  -> pass / fail in the provider's CI

4. can-i-deploy gate: block a deploy on either side that would break a live contract`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The payoff: a provider that is about to remove a field the consumer relies on fails its own build,
          before it ever reaches an environment where a human notices the outage.
        </p>
      </Block>

      <Block eyebrow="provider-driven" title="Schema-first contracts for public APIs">
        <p className="text-ink-dim leading-relaxed mb-2">
          When you do not know your consumers, a public REST or gRPC API, you cannot collect their
          expectations, so the contract flows the other way: the provider publishes a{" "}
          <strong>schema</strong> (OpenAPI, protobuf) as the source of truth, and consumers generate clients
          and validate against it. Compatibility is enforced by checking that each new schema is a
          backward-compatible evolution of the last.
        </p>
        <OpTable
          cols={["Approach", "Who owns the contract", "", "Best when"]}
          rows={[
            { op: "Consumer-driven (Pact)", avg: "consumers, collectively", avgTone: "good", why: "A known, finite set of internal consumers. Catches exactly the breakages that matter to real callers." },
            { op: "Provider / schema-first", avg: "the provider's spec", avgTone: "good", why: "Public APIs with unknown or unbounded consumers. The published OpenAPI/protobuf is the contract everyone codes to." },
          ]}
        />
        <Callout kind="tip" title="Match the method to who the consumers are">
          Internal microservices with a handful of known callers: consumer-driven contracts. A public API
          with strangers integrating: schema-first with backward-compatibility checks in CI. Using the wrong
          one, trying to collect pacts from the open internet, is the tell of someone who has only read about
          it.
        </Callout>
      </Block>

      <Block eyebrow="where it fits" title="Contract tests in the pyramid">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Unit tests</strong>, the most numerous, verify internal logic in isolation.</li>
          <li><strong>Contract tests</strong>, verify the seam between two services without running both, fast, deterministic, run in each side's CI.</li>
          <li><strong>Integration / E2E</strong>, the fewest, verify real wiring and true end-to-end flows, slow and reserved for the highest-value paths.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed">
          Contract tests do not replace schema compatibility checks or a few real end-to-end tests; they
          sit between them, catching the interface breakages that would otherwise only surface when the whole
          system is assembled.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How does a contract test differ from validating against an OpenAPI schema?</strong> Schema
            validation checks shape, is the payload well-formed. A consumer-driven contract additionally
            captures the specific interactions a real consumer depends on, this endpoint, these fields, this
            status, so it catches removing a field that the schema still technically allows but a consumer
            actually uses.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The provider wants to deploy a change. How does contract testing gate it?</strong> The
            provider verifies all published consumer contracts in its CI, and a can-i-deploy check queries the
            broker: if the change would break any contract that is live in production, the deploy is blocked
            until consumers migrate or the change is made additive.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Contracts drift from reality over time. How do you prevent stale pacts?</strong> The
            consumer regenerates its contract from its own tests on every build and republishes, and the
            provider verifies the current set, not a snapshot. The broker tracks which versions are deployed
            where, so an unused contract ages out rather than silently rotting.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Do contract tests remove the need for any end-to-end tests?</strong> No, they shrink it.
            Contract tests prove each pairwise interface, but a few real end-to-end tests still cover
            cross-service flows, auth, and infrastructure wiring that no single contract sees. The win is
            going from many flaky E2E tests to a handful.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Standing up every service to test one interface is slow and flaky, so I use contract testing to
          verify the seam between two services in isolation. For known internal consumers I use consumer-driven
          contracts, Pact: the consumer records its expectations as a contract and the provider verifies its
          real implementation against it in CI, with a can-i-deploy gate. For public APIs with unknown
          consumers I go schema-first, an OpenAPI or protobuf spec with backward-compatibility checks. It
          replaces most brittle end-to-end tests."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The problem is that verifying integrations by spinning up the whole service graph is
          combinatorial, slow, flaky, and hard to localize, so the pyramid says keep end-to-end tests few.
          Contract testing fills the gap by checking the interface between two services without running both.
          In consumer-driven contract testing, which fits a known set of internal consumers, each consumer
          writes tests against a mock provider, and those interactions are recorded as a contract, a pact,
          and published to a broker. The provider then replays every consumer's contract against its real
          implementation in its own CI, so if it is about to remove or change a field a consumer depends on,
          its build fails before the change ever reaches an environment, and a can-i-deploy check blocks a
          deploy that would break a contract live in production. For a public API with unknown or unbounded
          consumers you cannot collect their expectations, so the contract flows the other way: the provider
          publishes an OpenAPI or protobuf schema as the source of truth, consumers generate clients from it,
          and CI enforces that each new schema is a backward-compatible evolution. Choosing between them is
          about who the consumers are, and using the wrong one is a red flag. In the pyramid, contract tests
          sit between many unit tests and a few end-to-end tests: they do not replace real end-to-end
          coverage of cross-service flows and infrastructure, but they turn dozens of flaky integration tests
          into fast, deterministic checks that catch interface breakages in CI."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ────────────────────────────────────── */
const DECK = [
  { q: "When do you reach for gRPC over REST?", a: "Internal service-to-service calls that want low latency, HTTP/2 multiplexing and streaming, and generated polyglot clients from a protobuf contract. REST stays the public and partner boundary.", tag: "api styles" },
  { q: "One endpoint, the client picks exactly the fields it needs, which style, and what is the catch?", a: "GraphQL. The catch is caching (queries are POSTed, so no HTTP cache out of the box) and the N+1 resolver problem, solved by batching with a DataLoader.", tag: "api styles" },
  { q: "What is the N+1 problem in GraphQL?", a: "A resolver fires one query per item in a list, so a list of N children costs 1 + N queries. Batch the child fetches per request with a DataLoader so it becomes 1 + 1.", tag: "graphql" },
  { q: "Why is REST the default for public and partner APIs?", a: "Ubiquitous tooling, HTTP caching and CDNs, browser-native, and self-describing via OpenAPI. Widest client reach and lowest onboarding cost.", tag: "api styles" },
  { q: "Offset vs cursor pagination, which scales and why?", a: "Cursor (keyset). Offset makes the DB scan and discard skipped rows so deep pages get slow, and it drifts under concurrent inserts. A cursor seeks the index by last-seen key: fast and stable, but no random page jumps.", tag: "pagination" },
  { q: "When is offset pagination actually fine?", a: "Small, bounded, mostly-static lists where users genuinely jump to page numbers, like an admin table. Not for feeds, infinite scroll, or large live datasets.", tag: "pagination" },
  { q: "Which HTTP methods are idempotent, and why does it matter?", a: "GET, PUT, DELETE (and HEAD); POST is not. It matters because a retried POST double-acts, which is exactly why creation endpoints need an idempotency key.", tag: "rest" },
  { q: "400 vs 422 vs 409?", a: "400 = malformed request (cannot parse), 422 = well-formed but semantically invalid (validation), 409 = conflict with current state (duplicate or stale version). Precise codes tell the caller what to fix.", tag: "rest errors" },
  { q: "What is the modern structured error format for HTTP APIs?", a: "RFC 9457 Problem Details (application/problem+json): type, title, status, detail, instance, plus a correlation id. It replaced RFC 7807.", tag: "rest errors" },
  { q: "What is the additive-only rule for versioning?", a: "Within a major version, only add: new optional fields, new endpoints, relaxed validation. Never remove, rename, retype, or tighten, those force a new major version.", tag: "versioning" },
  { q: "Backward vs forward compatibility?", a: "Backward: a new server reads old clients' requests (frees your deploys). Forward: an old reader tolerates new data by ignoring unknown fields, the tolerant-reader pattern (frees your producers). You want both.", tag: "compat" },
  { q: "Name safe vs breaking changes to a JSON response.", a: "Safe: add an optional field, relax validation. Breaking: remove or rename a field, change its type, make an optional field required. Even adding an enum value can break an exhaustive client.", tag: "versioning" },
  { q: "How do you retire an old API version responsibly?", a: "Deprecation and Sunset headers (RFC 8594), a published timeline, run old and new in parallel through a migration window, measure usage per version, then remove once usage is near zero.", tag: "versioning" },
  { q: "What does an idempotency key actually do?", a: "The client sends a unique key per logical operation; the server dedupes on it, executing and storing the result the first time and returning the stored result on every retry. No double charge.", tag: "idempotency" },
  { q: "Why is a network timeout ambiguous, and what follows?", a: "The request may have succeeded with only the response lost, so the client cannot tell and must retry (at-least-once). Therefore the dedup must live server-side, keyed by the client's idempotency key.", tag: "idempotency" },
  { q: "What does effectively-once mean?", a: "At-least-once delivery plus idempotent processing. You cannot get true exactly-once delivery across a network, so you make redeliveries harmless and the observable effect happens once.", tag: "delivery" },
  { q: "Queue vs topic?", a: "Queue = point-to-point, one consumer handles each message (work distribution). Topic = pub/sub, every subscriber gets a copy (event fan-out). Kafka consumer groups give both at once.", tag: "messaging" },
  { q: "At-least-once is your default, what does it force on consumers?", a: "Idempotent processing: messages get redelivered after a crash or ack timeout, so consumers must dedupe on a business or event id. Ordering also holds only within a partition or key.", tag: "delivery" },
  { q: "What is the dual-write problem, and the fix?", a: "Writing to the DB and publishing an event are two systems with no shared transaction, so a crash between them loses or phantoms events. Fix: the transactional outbox, write the event in the same DB transaction, then a relay (poller or CDC) publishes it.", tag: "outbox" },
  { q: "What are consumer-driven contract tests?", a: "The consumer records its expectations of a provider as a contract (e.g. Pact); the provider verifies its real implementation against every consumer's contract in CI, with a can-i-deploy gate. Catches breaking changes without full integration environments.", tag: "contract testing" },
];

function RapidFire() {
  return (
    <>
      <Lede>
        Twenty cards spanning the whole tool: API styles, pagination, versioning, idempotency, delivery
        semantics, the outbox, and contract testing. Read each question, answer out loud first, then reveal
        and grade yourself. Shuffle and re-run until you are clean.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  apistyles: <ApiStyles />,
  restdesign: <RestDesign />,
  versioning: <Versioning />,
  idempotency: <Idempotency />,
  schemaevo: <SchemaEvo />,
  queuetopic: <QueueTopic />,
  outbox: <Outbox />,
  contracttest: <ContractTest />,
  quickfire: <RapidFire />,
};

export default function ApiIntegration() {
  const [active, setActive] = useState("apistyles");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Contracts · the INTERFACES"
      title="API & Integration"
      subtitle="How services talk: choosing an API style, evolving it without breaking callers, and moving data between systems reliably."
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
