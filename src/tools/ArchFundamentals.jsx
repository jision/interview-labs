import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import { QuickFire } from "../components/QuickFire.jsx";
import LoadBalancerViz from "./archfund/LoadBalancerViz.jsx";
import CacheStrategyViz from "./archfund/CacheStrategyViz.jsx";

const ACCENT = "#c9a23f";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "loadbalancing", label: "Load balancing & stateless services", group: "Traffic & compute" },
  { id: "caching", label: "Caching & CDNs", group: "Traffic & compute" },
  { id: "apigateway", label: "API gateway & reverse proxy", group: "Traffic & compute" },
  { id: "sqlnosql", label: "SQL vs NoSQL & data stores", group: "Data" },
  { id: "sharding", label: "Sharding & replication", group: "Data" },
  { id: "indexing", label: "Indexing & query paths", group: "Data" },
  { id: "queues", label: "Queues, streams & backpressure", group: "Coordination" },
  { id: "consistency", label: "Consistency, CAP & consensus", group: "Coordination" },
  { id: "quickfire", label: "Rapid fire · self-test", group: "Drill" },
];

/* ── Load balancing & stateless services ──────────────────────── */
function LoadBalancing() {
  return (
    <>
      <Lede>
        A load balancer is the spine of every horizontally-scaled system: one address the world talks to,
        many identical backends behind it. Get it right and you can add capacity, survive a dead node, and
        deploy without downtime. The whole thing rests on one requirement most candidates forget to say out
        loud: the services behind it have to be stateless.
      </Lede>

      <Block eyebrow="the two layers" title="L4 vs L7: what the balancer can see">
        <p className="text-ink-dim leading-relaxed mb-2">
          Where a balancer sits in the network stack decides what it can route on. An <strong>L4</strong>{" "}
          balancer moves packets by IP and port and never opens the payload; an <strong>L7</strong> balancer
          parses the HTTP (or gRPC) request and can route on its contents.
        </p>
        <OpTable
          cols={["Layer", "Routes on", "", "Character"]}
          rows={[
            { op: "L4 (transport)", avg: "IP : port, TCP/UDP", avgTone: "good", why: "No payload inspection, so it is fast and cheap and protocol-agnostic. Cannot do path-based routing or read a cookie. AWS NLB, IPVS, HAProxy in TCP mode." },
            { op: "L7 (application)", avg: "host, path, header, cookie", avgTone: "ok", why: "Parses HTTP, so it can terminate TLS, do content-based routing, retries, rewrites, compression, and WAF. More CPU per request. AWS ALB, NGINX, Envoy." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you separate two decisions cleanly: which layer the balancer operates at (L4 vs L7) and
          which algorithm it uses to pick a backend. Candidates who blur routing intelligence with
          distribution policy read as having never operated one.
        </Callout>
      </Block>

      <Block eyebrow="picking a backend" title="Distribution algorithms">
        <p className="text-ink-dim leading-relaxed mb-2">
          Once a request arrives, the balancer chooses a healthy backend. The right algorithm depends on
          whether your requests are uniform or spiky and whether you need a client to stick to a server.
        </p>
        <OpTable
          cols={["Algorithm", "How it picks", "", "Use when"]}
          rows={[
            { op: "Round-robin", avg: "rotate evenly", avgTone: "good", why: "Even rotation, ignores load. Fine when requests cost about the same and backends are identical. Weighted variant biases toward bigger instances." },
            { op: "Least-connections", avg: "fewest in-flight", avgTone: "good", why: "Sends to the backend holding the fewest open connections. Self-corrects for uneven request durations, the safer default under mixed load." },
            { op: "Least response time / EWMA", avg: "lowest observed latency", avgTone: "ok", why: "Tracks a moving latency average per backend and favors the fastest. Reacts to a slow or degraded node before connection counts do." },
            { op: "Hash / consistent hash", avg: "key maps to a backend", avgTone: "ok", why: "Same client or key always lands on the same backend, useful for cache locality. Consistent hashing minimizes remapping when the pool changes." },
          ]}
        />
        <Callout kind="tip" title="Power of two choices">
          A cheap trick worth naming: pick two backends at random and send to the less loaded one. It gets
          almost all the benefit of full least-connections without the balancer tracking global state, which
          is why Finagle defaults to it and Envoy's least-request policy uses it (Envoy's own default is
          round-robin).
        </Callout>
        <Try label="balance traffic">
          <LoadBalancerViz />
        </Try>
      </Block>

      <Block eyebrow="knowing who is alive" title="Health checks and draining">
        <p className="text-ink-dim leading-relaxed mb-2">
          A balancer is only as good as its view of which backends are healthy. Two mechanisms, and you want
          both:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Active checks</strong>, the balancer probes a <code className="font-mono">/healthz</code> endpoint on an interval and ejects a backend after N consecutive failures. Prefer a shallow check (is the process serving?) so a shared dependency blip does not eject the whole fleet at once.</li>
          <li><strong>Passive checks / outlier detection</strong>, watch real traffic and eject a backend that starts returning 5xx or timing out, even though its health probe still passes. Envoy calls this outlier detection.</li>
          <li><strong>Connection draining</strong>, on deploy or scale-in, stop sending new requests but let in-flight ones finish before the instance goes away, so no user sees a reset.</li>
          <li><strong>Slow start</strong>, ramp a freshly-added backend up gradually rather than hitting a cold instance with a full share, which avoids a thundering herd onto empty caches and connection pools.</li>
        </ul>
        <Callout kind="trap" title="A passing health check is not a working backend">
          The classic outage: instances answer <code className="font-mono">/healthz</code> with 200 while
          failing every real request because a downstream dependency is down. Active checks alone miss this;
          passive outlier detection on actual error rates is what catches it.
        </Callout>
      </Block>

      <Block eyebrow="the hidden requirement" title="Why the backends must be stateless">
        <p className="text-ink-dim leading-relaxed mb-2">
          A service is <strong>stateless</strong> when it keeps no per-client state in memory between
          requests, so any instance can serve any request. That property is what makes load balancing and
          horizontal scaling work at all: you can add instances, remove them, or lose one, and every request
          still routes anywhere.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`STATELESS (scales freely)
  request --> [ LB ] --> any of S1..Sn --> reads session/state from Redis or a token
  lose S2? the next request just goes to S3, nobody notices.

STICKY SESSIONS (the crutch)
  request from client A --> [ LB pins A to S2 ] --> in-memory session on S2
  lose S2? every pinned client's session is gone. deploys and scale-in hurt.`}
        />
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Session affinity</strong> (sticky sessions) pins a client to one backend via a cookie or
          IP hash. It is a smell: it breaks even distribution, loses state when an instance dies, and
          complicates every deploy. The fix is to externalize state, put session data in Redis or a
          database, or carry it in a signed token (JWT), so the service itself holds nothing.
        </p>
        <Callout kind="tip" title="Say the externalization, not the stickiness">
          When an interviewer asks how you keep users logged in across many servers, the senior answer is
          "sessions live in a shared store or a signed token, so the service stays stateless," not "I turn
          on sticky sessions."
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>The load balancer itself is a single point of failure. How do you make it HA?</strong>{" "}
            Run several balancer nodes behind one virtual IP using Anycast or a floating IP with
            VRRP/keepalived, and health-check them at the DNS layer. Managed cloud balancers (ALB, NLB) are
            already multi-AZ and redundant, so the SPOF is handled for you.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A backend passes its health check but errors on real traffic. What catches it?</strong>{" "}
            Passive outlier detection: eject a node whose live 5xx or timeout rate crosses a threshold,
            independent of the probe. Pair it with deep-enough checks and a canary so a bad deploy is caught
            before it takes the fleet.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>L4 or L7 for gRPC?</strong> L7. gRPC rides HTTP/2, which multiplexes many streams over
            one long-lived TCP connection, so a plain L4 balancer pins every stream from a client to one
            backend and the pool goes lopsided. You need a gRPC-aware L7 balancer that balances per-request,
            or client-side load balancing.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Least-connections looks strictly better. Why ever use round-robin?</strong> When
            requests are cheap and uniform, round-robin is simpler, needs no per-backend state, and gives an
            identical distribution at lower cost. Least-connections earns its keep only when request
            durations vary widely.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "A load balancer fronts a pool of identical backends. L4 routes on IP and port and is fast; L7
          parses HTTP so it can route on path or header and terminate TLS. For distribution I default to
          least-connections under mixed load and round-robin when requests are uniform, with hashing when I
          need cache locality. Active health checks plus passive outlier detection decide who is in
          rotation, and draining protects in-flight requests on deploy. All of it only works because the
          backends are stateless, so I keep session state in Redis or a token and treat sticky sessions as a
          smell."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I think about it in three decisions. First the layer: an L4 balancer forwards packets by IP and
          port with no payload inspection, so it is cheap and protocol-agnostic; an L7 balancer parses the
          request and can route by host, path, or cookie, terminate TLS, retry, and run a WAF, at more CPU
          per request. Second the algorithm: round-robin for uniform requests, least-connections or
          power-of-two-choices for uneven ones, EWMA to react to a slow node, and consistent hashing when a
          client needs to stick to a backend for cache locality. Third, membership: active probes catch a
          dead process and passive outlier detection catches a backend that passes its probe but fails real
          requests, while connection draining and slow-start make deploys and scale-in invisible. The load
          balancer is itself made HA behind a virtual IP or by using a managed multi-AZ balancer. And the
          precondition under all of it is statelessness: any instance must be able to serve any request, so
          I externalize session state to a shared store or a signed token rather than reaching for sticky
          sessions, which break distribution and lose state when a node dies."
        </Callout>
      </Block>
    </>
  );
}

/* ── Caching & CDNs ───────────────────────────────────────────── */
function Caching() {
  return (
    <>
      <Lede>
        A cache trades a little staleness and a consistency headache for a large drop in latency and load.
        The senior skill is not "add Redis"; it is naming which of the four strategies you are using, where
        that leaves a stale or lossy window, and how you keep a hot key from taking down your database when
        it expires.
      </Lede>

      <Block eyebrow="the four strategies" title="Where the read and the write flow">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every caching pattern is a choice about the order of hops between the app, the cache, and the
          database, and each choice leaves risk in a different place.
        </p>
        <OpTable
          cols={["Strategy", "Write path", "", "The risk it leaves"]}
          rows={[
            { op: "Cache-aside (lazy)", avg: "app writes DB, invalidates key", avgTone: "good", why: "The default. App loads on miss and populates. Stale until TTL or invalidation; a brief window between the DB write and the cache delete." },
            { op: "Read-through", avg: "paired write policy", avgTone: "ok", why: "Same as cache-aside but the load-on-miss logic lives in the cache layer, so callers stay simple. Reads only; needs a write policy alongside." },
            { op: "Write-through", avg: "write cache then DB, sync", avgTone: "ok", why: "Cache is never stale and nothing is lost, because the DB is written before the ack. Every write pays full DB latency." },
            { op: "Write-back (write-behind)", avg: "write cache, ack, flush later", avgTone: "bad", why: "Fastest writes, but acked data is LOST if the cache dies before the async flush. Only where some loss is tolerable." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you can point at the exact window where the cache and the database disagree for each
          strategy, and whether you invalidate rather than update on a write. "I would cache it" without
          naming the strategy and its stale or lossy window reads as junior.
        </Callout>
        <Try label="cache strategies">
          <CacheStrategyViz />
        </Try>
      </Block>

      <Block eyebrow="making room" title="Eviction: what gets thrown out">
        <p className="text-ink-dim leading-relaxed mb-2">
          A cache is bounded, so it must evict. The policy decides what survives under pressure:
        </p>
        <OpTable
          cols={["Policy", "Evicts", "", "Best for"]}
          rows={[
            { op: "LRU", avg: "least recently used", avgTone: "good", why: "The sensible default: recency tracks reuse well for most access patterns. Redis allkeys-lru." },
            { op: "LFU", avg: "least frequently used", avgTone: "ok", why: "Keeps genuinely hot keys over one-off spikes; needs decay so old popularity fades. Redis allkeys-lfu; Caffeine uses W-TinyLFU." },
            { op: "TTL / expiry", avg: "whatever has passed its TTL", avgTone: "ok", why: "Evicts keys past their expiry (Redis volatile-ttl drops the shortest remaining TTL first). Bounds staleness directly. Usually layered on top of LRU/LFU, not used alone." },
            { op: "FIFO / random", avg: "insertion order / any", avgTone: "bad", why: "Cheap but ignores usage; random is a surprisingly-ok low-overhead fallback, FIFO evicts hot keys." },
          ]}
        />
      </Block>

      <Block eyebrow="the failure that pages you" title="Cache stampede (thundering herd)">
        <p className="text-ink-dim leading-relaxed mb-2">
          A single hot key expires. In the same instant, thousands of concurrent requests all miss and all
          hit the database at once, a self-inflicted DDoS the moment a TTL rolls over. This is the failure
          mode interviewers probe for, so know the mitigations by name.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`hot key TTL expires at t=0
   1000 requests arrive at t=0..t=5ms
      -> all MISS
      -> all 1000 stampede the DB for the SAME row
      -> DB saturates, latency spikes, cascade

mitigations:
  request coalescing / single-flight : one loader fetches, the rest wait on it
  probabilistic early expiration      : refresh a bit BEFORE expiry, spread over time
  TTL jitter                          : randomize TTLs so keys do not expire in lockstep
  serve-stale + async refresh         : return the old value, refresh in the background`}
        />
        <Callout kind="tip" title="Single-flight is the one to lead with">
          If you name one fix, name request coalescing: the first miss takes a lock and loads the value, and
          every concurrent miss for that key waits for that single load instead of piling onto the database.
          Add TTL jitter so keys never expire in lockstep in the first place.
        </Callout>
      </Block>

      <Block eyebrow="pushing content to the edge" title="CDNs">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>CDN</strong> is a globally-distributed cache that serves content from an edge close to
          the user, cutting round-trip latency and shielding your origin from load. It is the highest-leverage
          cache you own for static assets, and increasingly for dynamic content too.
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Pull vs push</strong>, pull CDNs fetch from your origin on the first miss and cache it; push CDNs have you upload assets ahead of time. Pull is the common default.</li>
          <li><strong>Cache headers</strong>, <code className="font-mono">Cache-Control: max-age</code> tells browsers how long to cache, <code className="font-mono">s-maxage</code> targets the CDN, and <code className="font-mono">ETag</code> enables cheap revalidation.</li>
          <li><strong>Resilience directives</strong>, <code className="font-mono">stale-while-revalidate</code> serves the cached copy while refreshing in the background, and <code className="font-mono">stale-if-error</code> serves stale content when the origin is down.</li>
          <li><strong>Edge compute</strong>, Cloudflare Workers and Lambda@Edge run logic at the edge; an origin shield adds a mid-tier cache so a cold edge does not hammer your origin.</li>
        </ul>
      </Block>

      <Block eyebrow="the genuinely hard part" title="Invalidation">
        <p className="text-ink-dim leading-relaxed mb-2">
          Naming things and cache invalidation are the two hard problems for a reason: the moment underlying
          data changes, every cached copy is a potential lie. Three approaches, usually combined:
        </p>
        <OpTable
          cols={["Approach", "How", "", "Trade"]}
          rows={[
            { op: "TTL expiry", avg: "let it go stale then reload", avgTone: "good", why: "Dead simple, no coordination. You accept staleness up to the TTL. The right default for most reads." },
            { op: "Explicit purge", avg: "delete/bust the key on write", avgTone: "ok", why: "Fresh fast, but you must reliably find every place the data is cached; a missed purge is a silent stale bug." },
            { op: "Versioned keys / URLs", avg: "content hash in the name", avgTone: "good", why: "app.a1b2c3.js never needs invalidation, a new build is a new URL. The standard for static assets and immutable content." },
          ]}
        />
        <Callout kind="trap" title="Update-on-write invites a race">
          On a write, delete the key rather than overwriting it. If you update in place, a slow read that
          started earlier can land its stale value after your write and pin it. Delete-and-repopulate-on-next-read
          sidesteps the race; for stronger guarantees reach for write-through or a change-data-capture feed
          that invalidates on commit.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you keep the cache and the DB consistent on a write?</strong> There is no perfect
            answer with cache-aside; the standard is invalidate-on-write (delete, not update) and accept a
            small stale window. If the business cannot tolerate it, move to write-through so the cache is
            written in the same path, or drive invalidation from a CDC stream on the DB's commit log.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>One celebrity key takes 100k QPS. What breaks and how do you fix it?</strong> That key
            maps to a single cache node, which becomes a hotspot. Fix it with a small in-process cache in
            front of the shared cache, replicate the hot key across nodes, and coalesce concurrent misses so
            only one load hits the backend.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Your cache node dies and everything hits the DB. How do you survive?</strong> That is the
            cold-cache stampede at fleet scale. Shard with consistent hashing so a lost node only moves its
            share of keys, keep replicas, and add load-shedding so the database degrades gracefully instead
            of falling over while the cache refills.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>When should you NOT add a cache?</strong> When the workload is write-heavy with little
            re-reading, when it demands strong consistency, or when the hit rate would be low. A cache with a
            poor hit ratio just adds a network hop and a consistency bug for no latency win, measure the hit
            rate before you commit.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I pick a strategy and name where it leaves risk. Cache-aside is my default: load on miss, and on
          a write I invalidate the key rather than update it, accepting a small stale window; write-through
          when I need freshness, write-back only where some loss is fine. Eviction is usually LRU with a TTL.
          The failure I plan for is a stampede when a hot key expires, so I use single-flight coalescing and
          TTL jitter. A CDN handles static content at the edge, and I lean on TTLs and versioned URLs before
          explicit purges because invalidation is the hard part."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "A cache buys latency and load reduction in exchange for staleness and a consistency problem, so I
          start by naming the strategy. Cache-aside: the app checks the cache, loads from the DB on a miss,
          and populates it, and on a write it deletes the key rather than updating in place to avoid a
          read-write race, which leaves a bounded stale window. Read-through moves that load logic into the
          cache layer; write-through writes cache and DB synchronously so nothing is stale or lost at the
          cost of write latency; write-back acks from the cache and flushes later, which is fast but loses
          acked data if the cache dies first. Eviction is LRU by default, LFU with decay when I want to
          protect genuinely hot keys, layered with TTLs. The failure I design against is the stampede: a hot
          key expires and thousands of misses hit the DB at once, which I mitigate with single-flight
          coalescing, TTL jitter, probabilistic early refresh, and serve-stale-while-revalidating. At the
          edge, a CDN serves static and cacheable dynamic content close to users with Cache-Control and
          stale-while-revalidate, backed by an origin shield. And invalidation is the genuinely hard part, so
          I prefer TTL expiry and versioned URLs, which never need busting, over explicit purges that fail
          silently when you miss one."
        </Callout>
      </Block>
    </>
  );
}

/* ── API gateway & reverse proxy ──────────────────────────────── */
function ApiGateway() {
  return (
    <>
      <Lede>
        A reverse proxy is the front door; an API gateway is that front door with the cross-cutting concerns
        of an API platform bolted on. The interview signal is knowing exactly which concerns belong at the
        gateway, which belong in the service, and where a gateway stops and a service mesh begins.
      </Lede>

      <Block eyebrow="the base primitive" title="Reverse proxy vs forward proxy">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>reverse proxy</strong> sits in front of your servers and answers on their behalf; clients
          think they are talking to it. A <strong>forward proxy</strong> sits in front of clients and mediates
          their outbound traffic. Same machinery, opposite direction.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`FORWARD PROXY (guards egress, faces the clients)
   clients --> [ forward proxy ] --> the internet
   corporate egress filter, outbound cache

REVERSE PROXY (guards ingress, faces the servers)
   the internet --> [ reverse proxy ] --> your servers
   TLS termination, load balancing, response caching, routing, compression`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          A reverse proxy already does TLS termination, load balancing, caching, compression, and path
          routing. NGINX, Envoy, and HAProxy are the workhorses. An API gateway is a reverse proxy
          specialized for API traffic.
        </p>
      </Block>

      <Block eyebrow="the platform layer" title="What an API gateway adds">
        <p className="text-ink-dim leading-relaxed mb-2">
          A gateway is the single entry point for a fleet of services, and it owns the concerns you do not
          want reimplemented in every service:
        </p>
        <OpTable
          cols={["Concern", "At the gateway", "", "Why here"]}
          rows={[
            { op: "AuthN", avg: "validate the token / API key", avgTone: "good", why: "Reject unauthenticated traffic at the edge before it reaches any service. Coarse-grained only; services still enforce fine-grained authZ." },
            { op: "Rate limiting / quotas", avg: "throttle per client or key", avgTone: "good", why: "Protect the whole fleet from a noisy or abusive caller in one place, with per-tenant quotas." },
            { op: "Routing & versioning", avg: "path/host to a backend", avgTone: "good", why: "Route v1 and v2 to different services, canary by header, and hide the internal topology from clients." },
            { op: "Protocol translation", avg: "REST at edge, gRPC inside", avgTone: "ok", why: "Expose a clean external protocol while services speak something else internally. Also request/response shaping." },
            { op: "Aggregation", avg: "fan out, compose one response", avgTone: "ok", why: "Compose several backend calls into one client response. Powerful but easy to overuse, keep real logic out." },
            { op: "Observability", avg: "logs, metrics, tracing, IDs", avgTone: "good", why: "A natural chokepoint to stamp a correlation ID and emit consistent telemetry for every request." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you keep the gateway thin. The strong answer puts cross-cutting concerns at the gateway but
          insists business logic and fine-grained authorization stay in the services; a gateway that grows
          domain logic becomes a distributed monolith with one owner and a bottleneck.
        </Callout>
      </Block>

      <Block eyebrow="one gateway per client" title="Backend-for-frontend (BFF)">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>BFF</strong> is a gateway tailored to one client type. A web app and a mobile app want
          different payload shapes, different aggregation, and different chattiness, so you give each its own
          gateway that composes the underlying services for that specific consumer, instead of one bloated
          general-purpose API trying to serve everyone.
        </p>
        <Callout kind="tip" title="BFF is owned by the frontend team">
          The point of a BFF is ownership: the team building the mobile app owns the mobile BFF, so they can
          shape the API to their screens without a cross-team change to a shared gateway. That autonomy is
          the reason to split it.
        </Callout>
      </Block>

      <Block eyebrow="north-south vs east-west" title="Gateway vs service mesh">
        <p className="text-ink-dim leading-relaxed mb-2">
          Both move traffic and do cross-cutting concerns, but they cover different axes and are complementary,
          not competing.
        </p>
        <OpTable
          cols={["Dimension", "API gateway", "", "Service mesh"]}
          rows={[
            { op: "Traffic axis", avg: "north-south (ingress)", avgTone: "good", why: "Client-to-service, at the edge of the system. The mesh handles east-west, service-to-service traffic inside." },
            { op: "Deployment", avg: "a shared edge tier", avgTone: "ok", why: "A centralized fleet of proxies. The mesh runs a sidecar proxy next to every service instance (Istio, Linkerd)." },
            { op: "Owns", avg: "auth, quotas, external routing", avgTone: "ok", why: "The mesh owns mTLS, retries, timeouts, and traffic policy between internal services, plus fine-grained telemetry." },
          ]}
        />
        <Callout kind="trap" title="Do not route internal calls through the public gateway">
          Sending service-to-service traffic out to the edge gateway and back adds latency, a hop, and a
          shared failure domain. East-west traffic belongs in the mesh (or direct calls); the gateway is for
          traffic entering the system from outside.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Isn't the gateway a single point of failure and a bottleneck?</strong> It is on the hot
            path, so I run it stateless and horizontally scaled behind a load balancer across zones, keep it
            thin so per-request cost stays low, and budget its latency explicitly. The failure domain is real,
            which is exactly why it does not hold business logic.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Where does authorization belong, gateway or service?</strong> Both, at different grains.
            The gateway does coarse authentication (is this token valid?) and coarse rate limits at the edge;
            the service enforces fine-grained authorization (can this user touch this resource?) because you
            never trust the network. Defense in depth.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Gateway or mesh for a service calling another service?</strong> The mesh, or a direct
            call. North-south traffic (from clients) goes through the gateway; east-west traffic (between your
            services) goes through the mesh sidecars, which handle mTLS, retries, and timeouts without a trip
            to the edge.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you version and deprecate an API at the gateway?</strong> Route by URI, header, or
            media type to different backends, canary a new version to a slice of traffic by header, and
            signal end-of-life with a <code className="font-mono">Sunset</code> header and a deprecation window
            so clients migrate before v1 is removed.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "A reverse proxy fronts my servers and does TLS termination, load balancing, caching, and routing.
          An API gateway is that proxy specialized for APIs: a single entry point that owns authentication,
          rate limiting, routing and versioning, protocol translation, and observability, so services do not
          each reinvent them. I keep it thin, business logic and fine-grained authorization stay in the
          services. It handles north-south traffic; east-west service-to-service traffic belongs in a service
          mesh, and a BFF is a per-client gateway owned by that client's team."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I start from the reverse proxy: it faces the servers, terminates TLS, load-balances, caches
          responses, compresses, and routes by path, with NGINX or Envoy doing the work. An API gateway is
          that same primitive plus the platform concerns for a fleet of services behind one entry point:
          authenticate the caller and reject bad traffic at the edge, enforce per-tenant rate limits and
          quotas, route and version so clients never see the internal topology, translate protocols like REST
          at the edge to gRPC inside, and stamp a correlation ID for consistent tracing. The discipline is
          keeping it thin: coarse auth and routing live at the gateway, but fine-grained authorization and all
          business logic stay in the services, because a gateway that grows domain logic becomes a distributed
          monolith and a bottleneck. I make it highly available by running it stateless and horizontally scaled
          across zones behind a load balancer. It covers north-south traffic, clients into the system; for
          east-west traffic between services I use a service mesh with sidecars handling mTLS, retries, and
          timeouts, and I never route internal calls back out through the public gateway. When different clients
          need different shapes, I give each a backend-for-frontend that its own team owns."
        </Callout>
      </Block>
    </>
  );
}

/* ── SQL vs NoSQL & data stores ───────────────────────────────── */
function SqlNoSql() {
  return (
    <>
      <Lede>
        "SQL or NoSQL" is the wrong framing; the real question is which access patterns, consistency, and
        scale you need, and which store's trade-offs match. The senior move is to default to a relational
        engine, reach for a NoSQL family only when a concrete requirement demands it, and know that
        distributed SQL now blurs the old either-or.
      </Lede>

      <Block eyebrow="the default" title="Relational: schema, joins, transactions">
        <p className="text-ink-dim leading-relaxed mb-2">
          A relational database stores structured rows in typed tables, enforces a schema on write, joins
          across tables, and gives you ACID transactions and strong consistency. That combination is why
          Postgres or MySQL is the right first answer for most systems: integrity and flexible querying out
          of the box.
        </p>
        <Callout kind="tip" title="Postgres does more than people remember">
          Before reaching for a specialized store, note that modern Postgres handles JSON documents,
          full-text search, geospatial queries, and time-series partitioning. A lot of "we need a NoSQL
          store" is really "we have not scaled Postgres yet."
        </Callout>
      </Block>

      <Block eyebrow="the families" title="NoSQL is five different tools">
        <p className="text-ink-dim leading-relaxed mb-2">
          "NoSQL" is not one thing; it is several data models, each optimized for a shape of access. Naming
          the family and its access pattern is what separates a real answer from a buzzword.
        </p>
        <OpTable
          cols={["Family", "Model", "", "Fits"]}
          rows={[
            { op: "Key-value", avg: "get/put by key", avgTone: "good", why: "O(1) lookups at massive scale, no query flexibility. Sessions, caches, feature flags. Redis, DynamoDB." },
            { op: "Document", avg: "self-contained JSON docs", avgTone: "good", why: "Flexible schema, query by fields, one document per aggregate. Catalogs, profiles, content. MongoDB, DynamoDB." },
            { op: "Wide-column", avg: "rows keyed by partition", avgTone: "ok", why: "Huge write throughput and horizontal scale, query by partition key. Time-series, event logs. Cassandra, Bigtable." },
            { op: "Graph", avg: "nodes and edges", avgTone: "ok", why: "Relationship traversal without expensive joins. Social graphs, fraud rings, recommendations. Neo4j, Neptune." },
            { op: "Search", avg: "inverted index", avgTone: "ok", why: "Full-text relevance ranking and faceting. A read-side index fed from a system of record. Elasticsearch, OpenSearch." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether your store choice follows from access patterns and a scale requirement, not from a logo.
          "DynamoDB because we need single-digit-millisecond key lookups at very high write volume" scores;
          "NoSQL because it is web-scale" does not.
        </Callout>
      </Block>

      <Block eyebrow="the consistency contract" title="ACID vs BASE">
        <p className="text-ink-dim leading-relaxed mb-2">
          The old dividing line between relational and NoSQL was the consistency guarantee, though it has
          softened a lot since.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`ACID  (classic relational)
  Atomicity   : all of a transaction or none
  Consistency : constraints hold before and after
  Isolation   : concurrent txns do not corrupt each other
  Durability  : committed data survives a crash
  -> correctness first; historically harder to scale horizontally

BASE  (classic distributed NoSQL)
  Basically Available : answers even under partial failure
  Soft state          : replicas may temporarily disagree
  Eventual consistency: replicas converge given time
  -> availability and scale first; the app tolerates staleness`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The line has blurred: DynamoDB offers transactions, MongoDB has multi-document ACID since 4.0, and
          <strong> distributed SQL</strong> (Spanner, CockroachDB, YugabyteDB) delivers horizontal
          scale with strong ACID and SQL, at the cost of higher write latency from cross-node coordination.
          (Vitess scales MySQL by sharding but does not give you strong cross-shard ACID, so it is a sharding
          layer, not distributed SQL in this sense.)
        </p>
      </Block>

      <Block eyebrow="modeling for the store" title="Access-pattern design and polyglot persistence">
        <p className="text-ink-dim leading-relaxed mb-2">
          Relational modeling starts from the data and normalizes; NoSQL modeling starts from the{" "}
          <em>queries</em> and denormalizes to serve them. In DynamoDB, single-table design packs related
          items under shared partition keys precisely because you designed the keys around the read patterns
          up front. There is no free ad-hoc join later, so if you do not know the access patterns, you are
          not ready for NoSQL.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Polyglot persistence</strong> is the honest end state: use the right store per workload,
          Postgres as the system of record, Redis for the hot cache, Elasticsearch for search, a warehouse
          for analytics, kept in sync by change-data-capture. The skill is drawing the seams, not forcing
          everything into one engine.
        </p>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>You picked NoSQL for scale, now you need an ad-hoc join. What now?</strong> NoSQL traded
            query flexibility for scale, so you either denormalize and precompute the view the query needs, or
            stream the data via CDC into a system built for it, a search index or an analytics warehouse.
            What you do not do is bolt joins onto a store that was modeled around fixed access patterns.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Does NoSQL mean no transactions?</strong> No. DynamoDB has transactions, MongoDB has
            multi-document ACID since 4.0, but they are more limited and costlier than a relational engine's,
            and distributed SQL gives you both scale and ACID by paying cross-node coordination latency. It is
            a spectrum, not a binary.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What is your default for a new service?</strong> Postgres, unless a concrete requirement
            rules it out, because it handles JSON, full-text, and geo, and one boring, well-understood store
            beats a premature zoo of specialized ones. Scale it first; reach for NoSQL when a real limit
            appears.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you scale Postgres before sharding it?</strong> Add read replicas for read-heavy
            load, put a connection pooler like PgBouncer in front, partition large tables, cache hot reads,
            and size the box up. Only then reach for horizontal sharding via Citus or Vitess, or move to a
            distributed SQL engine.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "I do not start from SQL versus NoSQL; I start from access patterns, consistency, and scale. My
          default is Postgres, because relational gives me schema, joins, and ACID, and it also does JSON,
          full-text, and geo. I reach for a NoSQL family when a concrete requirement demands it: key-value or
          document for O(1) lookups at huge scale, wide-column for write-heavy time-series, graph for
          traversals, search for full-text. NoSQL means modeling around queries and denormalizing, and ACID
          versus BASE has blurred now that distributed SQL gives scale plus transactions."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "The framing I avoid is treating this as a binary. A relational database is my default because it
          enforces a schema, joins across tables, and gives ACID transactions with strong consistency, and
          modern Postgres also covers JSON documents, full-text search, geospatial, and partitioned
          time-series, so a lot of 'we need NoSQL' is really 'we have not scaled Postgres.' When a real
          requirement pushes me off it, I pick a NoSQL family by access pattern: key-value like Redis or
          DynamoDB for O(1) lookups at scale, document for flexible per-aggregate reads, wide-column like
          Cassandra for very high write throughput on time-series, graph like Neo4j for relationship
          traversal, and a search engine as a read-side index fed from the system of record. The consistency
          contract used to divide them, ACID for correctness first versus BASE for availability and eventual
          consistency, but that has softened: DynamoDB and MongoDB both do transactions now, and distributed
          SQL like Spanner or CockroachDB gives horizontal scale with ACID and SQL for the price of cross-node
          write latency. NoSQL forces you to model around your queries and denormalize, so if I cannot name the
          access patterns I am not ready to choose it. And at real scale the answer is usually polyglot
          persistence: Postgres as the record, Redis for the hot path, a search index and a warehouse fed by
          CDC, with the skill being where I draw the seams."
        </Callout>
      </Block>
    </>
  );
}

/* ── Sharding & replication ───────────────────────────────────── */
function Sharding() {
  return (
    <>
      <Lede>
        Replication makes copies of the same data for availability and read scale; sharding splits different
        data across nodes for write and storage scale. They are orthogonal and you usually need both. The two
        traps interviewers reach for are the sync-versus-async data-loss window and the hot shard from a bad
        key.
      </Lede>

      <Block eyebrow="copies for safety" title="Replication topologies">
        <p className="text-ink-dim leading-relaxed mb-2">
          Replication keeps N copies of the same dataset so a node can die without data loss and reads can
          fan out. Three topologies, in rising order of write flexibility and conflict pain:
        </p>
        <OpTable
          cols={["Topology", "Writes go to", "", "Character"]}
          rows={[
            { op: "Leader-follower", avg: "one leader", avgTone: "good", why: "The default. Writes to the leader, reads from followers. Simple and consistent; the leader is a write bottleneck and a failover point." },
            { op: "Multi-leader", avg: "several leaders", avgTone: "ok", why: "Writes accepted in multiple regions for locality, but concurrent edits create conflicts you must resolve (last-write-wins, CRDTs)." },
            { op: "Leaderless (quorum)", avg: "any replica", avgTone: "ok", why: "Dynamo-style: clients write to and read from quorums, with R + W > N for overlap. Highly available; read-repair reconciles." },
          ]}
        />
      </Block>

      <Block eyebrow="the data-loss dial" title="Synchronous vs asynchronous replication">
        <p className="text-ink-dim leading-relaxed mb-2">
          The single most important replication decision: does the leader wait for a replica to acknowledge
          before it acks the client? That choice is a direct trade between write latency and how much data you
          can lose on failover.
        </p>
        <OpTable
          cols={["Mode", "Leader acks", "", "Trade"]}
          rows={[
            { op: "Synchronous", avg: "after replica confirms", avgTone: "ok", why: "No data loss on failover (RPO 0), but every write pays the replica round-trip, and a slow or dead replica stalls writes." },
            { op: "Asynchronous", avg: "immediately", avgTone: "good", why: "Low write latency and no coupling to replica health, but writes not yet shipped are LOST if the leader dies. Nonzero RPO." },
            { op: "Semi-synchronous", avg: "after at least one replica", avgTone: "good", why: "Wait for one replica, not all. The common middle: bounded loss without the full latency and availability cost of sync." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you tie the sync/async choice to a recovery point objective and the data's value. "Payments
          cannot lose an acked write, so semi-sync within the region; async cross-region" shows you reason
          from RPO, not from a default.
        </Callout>
      </Block>

      <Block eyebrow="splitting the data" title="Sharding strategies">
        <p className="text-ink-dim leading-relaxed mb-2">
          When one machine cannot hold the data or absorb the writes, you shard: partition different rows
          across nodes by a shard key. How you choose the key is the whole game.
        </p>
        <OpTable
          cols={["Strategy", "Key maps by", "", "Trade"]}
          rows={[
            { op: "Hash", avg: "hash(key) to a shard", avgTone: "good", why: "Even distribution, no hotspots on sequential inserts. But range scans must hit every shard, and naive modulo remaps everything when node count changes." },
            { op: "Range", avg: "contiguous key ranges", avgTone: "ok", why: "Efficient range scans and ordered access. But sequential keys (timestamps, auto-increment IDs) pile onto the newest shard, a hotspot." },
            { op: "Directory / lookup", avg: "an explicit key-to-shard map", avgTone: "ok", why: "Maximum flexibility, move any key anywhere. The lookup table becomes a dependency and a potential bottleneck to keep available." },
          ]}
        />
        <Callout kind="tip" title="Consistent hashing tames resharding">
          Plain hash-mod-N remaps most keys when you add or remove a node. Consistent hashing places nodes and
          keys on a ring so adding a node only moves the keys between it and its neighbor, roughly 1/N of them.
          Virtual nodes even out the spread. It is why Cassandra and DynamoDB reshard without a full reshuffle.
        </Callout>
      </Block>

      <Block eyebrow="when one shard runs hot" title="The hot shard problem">
        <p className="text-ink-dim leading-relaxed mb-2">
          A hot shard is the failure mode of a bad shard key: skewed access concentrates load on one node
          while the rest sit idle, so you have all the complexity of sharding and none of the scale.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`shard key = customer_id, but one tenant is 40% of traffic
   shard A [ mega-tenant ]  ->  saturated, high latency, the bottleneck
   shard B [ ........... ]  ->  idle
   shard C [ ........... ]  ->  idle

fixes:
  compound key        : (customer_id, bucket) spreads one tenant over many shards
  salting             : prefix a hash so a monotonic key stops landing on one shard
  dedicated shard     : isolate the whale onto its own node(s)
  split the hot shard : range-split the overloaded partition in two`}
        />
        <Callout kind="trap" title="Monotonic keys are a hidden hot shard">
          Sharding by an auto-increment ID or a timestamp under range partitioning sends every new write to
          the last shard, so your write throughput is capped at one node no matter how many you add. Hash the
          key, or add a bucketing prefix, so inserts spread.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Your shard key is customer_id and one customer is 40% of traffic. What now?</strong> That
            is a hot shard. Split the whale across sub-shards with a compound key like (customer_id, bucket),
            or isolate them onto dedicated shards so their load does not starve everyone else. The shard key
            has to reflect the actual access distribution, not just look unique.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Sync or async replication for a payments database?</strong> The recovery point objective
            decides it. Payments cannot lose an acknowledged write, so I run semi-synchronous within a region,
            wait for at least one replica, and accept the small latency cost; cross-region stays async because
            paying a transcontinental round-trip on every write is not worth it.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you reshard a live system without downtime?</strong> Use consistent hashing or
            fixed logical partitions so only a fraction of keys move, dual-write or drive a CDC stream to the
            new topology in the background, backfill and verify, then cut reads over, then writes. The move is
            gradual and reversible, never a big-bang copy.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The leader fails, how do you avoid split-brain?</strong> Elect the new leader through a
            majority quorum with consensus (Raft), so a partitioned old leader cannot keep accepting writes
            without the majority, and use fencing tokens so stale writes from a demoted leader are rejected
            downstream.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Replication copies the same data for availability and read scale; sharding splits different data
          for write and storage scale, and I usually need both. The replication dial I always call out is
          sync versus async: synchronous means no data loss on failover but slower writes, async is fast but
          loses un-shipped writes, and semi-sync waiting for one replica is the common middle, chosen from the
          RPO. For sharding I hash the key for even spread, use consistent hashing so resharding only moves a
          fraction of keys, and watch for a hot shard from a skewed or monotonic key, which I fix with a
          compound or salted key."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I keep the two ideas separate. Replication is N copies of the same dataset: leader-follower by
          default with writes to the leader and reads from followers, multi-leader when I need regional write
          locality and can handle conflict resolution, and leaderless quorum reads and writes with R plus W
          greater than N for Dynamo-style availability. The decision I always surface is synchronous versus
          asynchronous replication, because it is a direct trade between write latency and data loss:
          synchronous waits for a replica so failover loses nothing but every write pays a round-trip and a
          dead replica stalls writes; asynchronous acks immediately but loses whatever had not shipped if the
          leader dies; semi-synchronous waits for at least one replica as the bounded-loss middle, and I pick
          based on the recovery point objective and how much the data is worth. Sharding is splitting different
          rows across nodes: hash sharding spreads evenly but breaks range scans, range sharding serves ordered
          scans but hotspots on sequential keys, and directory sharding is flexible at the cost of a lookup
          dependency. I lean on consistent hashing with virtual nodes so adding a node only moves about one
          over N of the keys instead of reshuffling everything. The trap is the hot shard, where a skewed key
          like a dominant tenant or a monotonic timestamp concentrates load on one node, which I fix with a
          compound or salted key, a dedicated shard for the whale, or splitting the hot partition. And on
          failover I avoid split-brain with quorum-based election and fencing tokens."
        </Callout>
      </Block>
    </>
  );
}

/* ── Indexing & query paths ───────────────────────────────────── */
function Indexing() {
  return (
    <>
      <Lede>
        An index turns a full-table scan into a targeted lookup, at the cost of write amplification and
        storage. The senior signal is not "add an index"; it is knowing which structure fits the query, why
        column order in a composite index decides whether it is used at all, and when the planner will ignore
        your index and scan anyway.
      </Lede>

      <Block eyebrow="what an index is" title="A secondary structure over your data">
        <p className="text-ink-dim leading-relaxed mb-2">
          An index is a separate, sorted structure mapping column values to row locations. It turns an O(n)
          scan into an O(log n) lookup for the queries it covers, and in return every write must update it,
          it consumes storage, and the planner may still decide not to use it. Indexing is a trade, never
          free.
        </p>
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you reason about the query path and the write cost together. Naming a covering index for a
          hot read, or explaining why the planner skipped an index on a low-selectivity predicate, signals you
          have actually read a query plan, not just added indexes hopefully.
        </Callout>
      </Block>

      <Block eyebrow="the structures" title="B-tree, hash, LSM, and specialized indexes">
        <OpTable
          cols={["Structure", "Good at", "", "Character"]}
          rows={[
            { op: "B-tree / B+tree", avg: "equality, range, prefix, sort", avgTone: "good", why: "The default. Sorted, so it serves =, <, >, BETWEEN, ORDER BY, and prefix matches. Balanced reads and writes. The relational workhorse." },
            { op: "Hash", avg: "equality only", avgTone: "ok", why: "O(1) point lookups, but no ranges and no ordering. Useful where you only ever look up by exact key." },
            { op: "LSM-tree", avg: "very high write volume", avgTone: "ok", why: "Buffers writes in memory, flushes sorted files, compacts in the background. Write-optimized (Cassandra, RocksDB); reads pay to merge, and compaction costs I/O." },
            { op: "Inverted / GIN", avg: "full-text, arrays, JSON", avgTone: "ok", why: "Maps each term to the rows containing it. Powers search and containment queries. Elasticsearch, Postgres GIN." },
          ]}
        />
        <Callout kind="tip" title="LSM vs B-tree in one line">
          B-trees update in place, so reads are cheap and writes do random I/O; LSM-trees append and compact,
          so writes are cheap and sequential but reads may touch several files. Pick LSM for write-heavy
          ingest, B-tree for balanced or read-heavy workloads.
        </Callout>
      </Block>

      <Block eyebrow="order is everything" title="Composite indexes and the leftmost-prefix rule">
        <p className="text-ink-dim leading-relaxed mb-2">
          A composite index on (a, b, c) is sorted by a, then b, then c, so it can serve a query only if the
          query uses a <strong>leftmost prefix</strong> of those columns. That makes column order a design
          decision, not an afterthought.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`index on (tenant_id, created_at)

  WHERE tenant_id = ?                          -> uses the index (prefix)
  WHERE tenant_id = ? AND created_at > ?       -> uses the index (full)
  WHERE tenant_id = ? ORDER BY created_at      -> uses the index (sorted)
  WHERE created_at > ?                         -> CANNOT use it (skips the prefix)

rule of thumb: equality columns first, then the range/sort column last.`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Put the columns you filter by equality first and the range or sort column last, so the index both
          narrows and orders in one pass.
        </p>
      </Block>

      <Block eyebrow="the big read win" title="Covering indexes">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>covering index</strong> contains every column a query needs, in the key or in an{" "}
          <code className="font-mono">INCLUDE</code> clause, so the engine answers entirely from the index and
          never touches the table heap. That "index-only scan" skips the second lookup per row, which is a
          large win on wide tables and hot queries.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`query:  SELECT status FROM orders WHERE tenant_id = ? AND created_at > ?

non-covering: index finds the rows, then a heap fetch per row for 'status'
covering:     CREATE INDEX ... ON orders (tenant_id, created_at) INCLUDE (status)
              -> everything the query needs is in the index -> index-only scan`}
        />
        <Callout kind="tip" title="Covering is a targeted optimization">
          You do not make every index covering; you make the one hot query index-only by adding its selected
          columns to INCLUDE. The trade is a larger index and more write cost, worth it for a read that runs
          constantly.
        </Callout>
      </Block>

      <Block eyebrow="when indexes do not help" title="Selectivity and the cost of over-indexing">
        <p className="text-ink-dim leading-relaxed mb-2">
          The planner uses an index only when it is <strong>selective</strong>, when the predicate matches few
          rows. On a low-selectivity predicate (a boolean that is true for half the table), a sequential scan
          is genuinely cheaper than jumping back and forth between an index and the heap, so the planner
          ignores the index. Other reasons it is skipped: stale statistics, a function wrapped around the
          column (non-sargable), or a type mismatch.
        </p>
        <Callout kind="trap" title="Every index taxes every write">
          Indexes are not free insurance. Each one is another structure to maintain on every insert, update,
          and delete, so over-indexing quietly kills write throughput and wastes storage. Index the columns
          your queries actually filter and sort on, and drop the indexes nothing uses.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Your query filters on a and b but the index is (b, a). Does it help?</strong> For a
            predicate on a alone, no, an index on (b, a) is sorted by b first, so a is not a usable prefix.
            It serves queries on b or on (b, a) together. Column order has to match the access pattern, which
            is why you design it around the real queries.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>The index exists but the planner ignores it. Why?</strong> Usually low selectivity: the
            predicate matches too many rows, so a full scan beats bouncing between index and heap. It can also
            be stale table statistics, a function on the column making it non-sargable, or a type mismatch in
            the comparison. I would read the EXPLAIN plan rather than guess.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>What is a covering index and when is it a big win?</strong> One that includes every column
            a query touches, so it runs index-only with no heap fetch. It shines on a read-heavy hot query
            over a wide table: put the filter and sort columns in the key and the selected columns in INCLUDE,
            and you cut the per-row second lookup entirely.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Write throughput drops as you add indexes. What is the trade?</strong> Every index is
            write amplification, one more structure updated per row change, so more indexes mean slower writes
            and more storage. The fix is discipline: index only what queries filter and sort on, drop unused
            indexes, and for write-heavy ingest lean on an LSM store that is built for it.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "An index is a sorted secondary structure that turns a scan into a lookup, paid for in write cost
          and storage. B-trees are the default because they serve equality, range, and sort; hash indexes do
          equality only; LSM-trees are write-optimized. Composite index order follows the leftmost-prefix
          rule, so equality columns first, range or sort column last. A covering index includes every column
          the query needs so it runs index-only, a big win on hot reads. And the planner ignores an index on a
          low-selectivity predicate, so I do not over-index, since every index taxes every write."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "An index is a separate sorted structure mapping values to row locations; it turns an O(n) scan into
          an O(log n) lookup for the queries it covers, in exchange for maintaining it on every write and the
          storage it takes, so it is always a trade. I match the structure to the query: a B-tree is the
          default because being sorted it serves equality, ranges, prefixes, and ORDER BY; a hash index does
          only exact-match lookups; an LSM-tree buffers and compacts so it is write-optimized for high ingest
          like Cassandra, at the cost of read amplification; and inverted or GIN indexes handle full-text and
          JSON. For composite indexes, column order is a real decision because of the leftmost-prefix rule, an
          index on (tenant_id, created_at) serves filters on tenant_id and on both together, but not created_at
          alone, so I put equality columns first and the range or sort column last. A covering index includes
          every column a query needs, in the key or via INCLUDE, so the engine answers from the index alone
          with no heap fetch, which is a large win on a wide, read-heavy hot query. And I stay disciplined
          about when indexes do not help: the planner ignores an index on a low-selectivity predicate because
          a sequential scan is cheaper, and it will also skip one on stale statistics, a non-sargable function,
          or a type mismatch, so I read the plan. Above all I do not over-index, because each index is write
          amplification that quietly caps throughput."
        </Callout>
      </Block>
    </>
  );
}

/* ── Queues, streams & backpressure ───────────────────────────── */
function Queues() {
  return (
    <>
      <Lede>
        Async messaging decouples producers from consumers, absorbs traffic spikes, and makes retries safe,
        which is why it sits under nearly every resilient system. The senior distinctions are queue versus
        log, the delivery semantics you can actually promise, and what your system does when consumers cannot
        keep up.
      </Lede>

      <Block eyebrow="why go async" title="What a message system buys you">
        <p className="text-ink-dim leading-relaxed mb-2">
          Putting a broker between producer and consumer decouples them in time and space: the producer does
          not wait for the consumer, a spike is buffered instead of dropped, failed work retries, and one
          event can fan out to many consumers. The cost is a new component to operate and the end of simple
          synchronous reasoning.
        </p>
      </Block>

      <Block eyebrow="the core distinction" title="Queue vs log (stream)">
        <p className="text-ink-dim leading-relaxed mb-2">
          These get conflated constantly, and the difference drives most design choices downstream.
        </p>
        <OpTable
          cols={["Property", "Queue", "", "Log / stream"]}
          rows={[
            { op: "Consumption", avg: "message removed once handled", avgTone: "good", why: "Log keeps an append-only, retained history; consumers track their own offset and can replay. SQS/RabbitMQ vs Kafka/Kinesis." },
            { op: "Consumers", avg: "compete for each message", avgTone: "ok", why: "In a queue each message goes to one worker. A log lets many independent consumer groups each read the whole stream." },
            { op: "Replay", avg: "gone after ack", avgTone: "bad", why: "A queue cannot replay a consumed message; a log can rewind to any retained offset, which is what enables reprocessing and new consumers." },
            { op: "Ordering", avg: "best-effort / per-group", avgTone: "ok", why: "A log guarantees order within a partition; a queue is generally unordered unless you use FIFO/message groups." },
          ]}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you pick queue versus log from the requirement, not habit. "I need replay and multiple
          independent consumers, so a log" or "I just need to distribute work across workers, so a queue"
          shows you know the difference costs something.
        </Callout>
      </Block>

      <Block eyebrow="what you can actually promise" title="Delivery semantics">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every candidate wants to say "exactly-once." The precise, senior answer is that end-to-end
          exactly-once <em>delivery</em> is effectively impossible across systems, and you engineer
          effectively-once <em>results</em> instead.
        </p>
        <OpTable
          cols={["Semantic", "Means", "", "Reality"]}
          rows={[
            { op: "At-most-once", avg: "fire and forget", avgTone: "ok", why: "No retries, so a lost message stays lost. Fine only when dropping the occasional event is acceptable (some metrics)." },
            { op: "At-least-once", avg: "retry until acked", avgTone: "good", why: "The common default. Nothing is lost, but a redelivery can duplicate, so the consumer must be idempotent." },
            { op: "Effectively-once", avg: "at-least-once + idempotency", avgTone: "good", why: "At-least-once delivery made safe by a dedupe key, upsert, or transactional outbox. Kafka EOS gives it within Kafka." },
          ]}
        />
        <Callout kind="tip" title="Idempotency is the real deliverable">
          Since you will get duplicates under at-least-once, the durable fix is an idempotent consumer: a
          dedupe key you have seen before is a no-op, and writes are upserts. That turns redelivery from a bug
          into a non-event, which is what "exactly-once" means in practice.
        </Callout>
      </Block>

      <Block eyebrow="scaling and surviving consumers" title="Competing consumers, ordering, and dead letters">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Competing consumers</strong>, run many workers against one queue and each message goes to exactly one of them, so throughput scales with worker count. The cost is that global ordering is gone.</li>
          <li><strong>Ordering at scale</strong>, global order does not scale, so you partition by a key (Kafka partitions, SQS FIFO message groups); order holds per key while different keys process in parallel.</li>
          <li><strong>Dead-letter queue</strong>, after N failed retries a poison message is routed to a DLQ instead of blocking the queue or retrying forever. Alert on it and inspect out of band.</li>
        </ul>
        <CodeBlock
          title="text"
          lang="text"
          code={`competing consumers (scale throughput, lose global order)
   [ queue ] --> worker 1
             --> worker 2     each message to exactly ONE worker
             --> worker 3

ordering by key (parallel across keys, ordered within a key)
   partition = hash(key) % N
   key "user-42" always -> partition 3 -> one consumer, in order

poison message (do not retry forever)
   msg fails N times -> route to DEAD-LETTER queue -> alert + inspect`}
        />
      </Block>

      <Block eyebrow="the pressure valve" title="Backpressure">
        <p className="text-ink-dim leading-relaxed mb-2">
          When producers outrun consumers, the queue grows. Without a limit it grows until something runs out
          of memory, so the buffer just relocates the failure. <strong>Backpressure</strong> is the system
          pushing back, slowing or shedding work rather than letting an unbounded buffer swallow the outage.
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Bounded buffers</strong>, cap the queue and block or reject producers when it is full, so pressure propagates back to the source instead of piling up.</li>
          <li><strong>Pull-based consumption</strong>, Kafka consumers pull at their own pace, which is backpressure by construction, the consumer never receives faster than it asks.</li>
          <li><strong>Load shedding and rate limits</strong>, drop or sample low-value work under overload so high-value work still completes, and rate-limit producers.</li>
          <li><strong>Autoscale on lag</strong>, consumer lag (queue depth, offset lag) is the signal to add consumers before the backlog becomes an outage.</li>
        </ul>
        <Callout kind="trap" title="An unbounded queue is deferred failure">
          "Just buffer it" feels safe but only moves the OOM downstream and hides the overload until it is
          catastrophic. Bound the queue, make lag observable, and decide deliberately whether to block, shed,
          or scale.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Producers outrun consumers and the queue grows unbounded. What do you do?</strong> Apply
            backpressure: bound the buffer so producers block or get rejected, autoscale consumers on lag, and
            shed or sample low-value messages under overload. Unbounded buffering just relocates the OOM
            downstream and hides the problem until it is severe.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>You need exactly-once. Is that real?</strong> Not as end-to-end delivery across systems.
            What is real is effectively-once: at-least-once delivery plus an idempotent consumer, a dedupe
            key, an upsert, or a transactional outbox. Kafka's exactly-once semantics give it within Kafka,
            but the moment you write to an external system, idempotency is the mechanism.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>How do you preserve order but still scale out?</strong> Partition by the ordering key.
            Order is guaranteed within a partition, and parallelism comes from having many partitions with one
            consumer each. Global ordering forces a single consumer and does not scale, so you order only
            where it matters, per key.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>A poison message keeps crashing the consumer. Now what?</strong> Bounded retries with
            backoff, then route it to a dead-letter queue, alert, and keep processing the rest of the stream.
            Never let one bad message retry forever in line, that stalls the whole partition behind it.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Async messaging decouples producers and consumers, absorbs spikes, and makes retries safe. I pick a
          queue when I just need to distribute work across competing consumers, and a log like Kafka when I
          need replay and multiple independent consumer groups. I promise at-least-once delivery and make the
          consumer idempotent, which is effectively-once in practice, because true end-to-end exactly-once
          across systems is not real. I order by key so partitions parallelize, dead-letter poison messages,
          and apply backpressure with bounded buffers and lag-based autoscaling rather than letting a queue
          grow unbounded."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "A broker between producer and consumer decouples them in time, buffers spikes instead of dropping
          them, and lets work retry and fan out. The first distinction I draw is queue versus log: a queue
          like SQS or RabbitMQ deletes a message once it is handled and has competing consumers each taking one
          message, great for distributing work but with no replay; a log like Kafka or Kinesis is append-only
          and retained, so many consumer groups each read the whole stream at their own offset and can rewind,
          which is what you need for reprocessing and adding new consumers. On semantics I am precise:
          at-most-once can lose messages, at-least-once is the default and can duplicate on redelivery, and
          exactly-once end-to-end across systems is effectively impossible, so I build effectively-once by
          making the consumer idempotent with a dedupe key or an upsert or a transactional outbox, with Kafka
          EOS covering the in-Kafka case. To scale I use competing consumers and accept losing global order,
          recovering the order I actually need by partitioning on a key so each key is ordered while different
          keys run in parallel. Poison messages go to a dead-letter queue after bounded retries so one bad
          record does not stall a partition. And the piece people forget is backpressure: an unbounded queue
          just moves the out-of-memory downstream, so I bound the buffer and block or reject producers, prefer
          pull-based consumption, shed low-value work under overload, and autoscale consumers on lag before the
          backlog becomes an outage."
        </Callout>
      </Block>
    </>
  );
}

/* ── Consistency, CAP & consensus ─────────────────────────────── */
function Consistency() {
  return (
    <>
      <Lede>
        Distributed systems force a choice the moment the network splits: stay consistent or stay available,
        you cannot have both under a partition. CAP names that choice, PACELC extends it to the everyday
        latency trade, quorums and consensus are how you build guarantees on top, and split-brain is what goes
        wrong when you get it lazy.
      </Lede>

      <Block eyebrow="the theorem, stated correctly" title="CAP: consistency or availability under a partition">
        <p className="text-ink-dim leading-relaxed mb-2">
          CAP is not "pick two of three." Network partitions (P) are a fact of distributed life, not something
          you opt out of, so the real statement is: <strong>when a partition happens, you must choose between
          Consistency and Availability.</strong> When the network is healthy you can have both.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`a partition splits the cluster; a write cannot reach every replica.

CP  choose consistency : refuse the request rather than return stale/divergent data
                         (a bank ledger: better to error than double-spend)

AP  choose availability: answer anyway, reconcile later
                         (a shopping cart: never block "add to cart", merge conflicts after)

no partition -> you get both C and A. the choice only bites during P.`}
        />
        <Callout kind="note" title="What the interviewer is listening for">
          Whether you map the CAP choice to the business, not recite the letters. "A cart is AP because we
          never block adds and merge later; a ledger is CP because we refuse rather than double-spend" is the
          answer that lands; "CA database" is a red flag, because you cannot give up partition tolerance.
        </Callout>
      </Block>

      <Block eyebrow="the everyday trade" title="PACELC: latency even when there is no partition">
        <p className="text-ink-dim leading-relaxed mb-2">
          CAP only speaks to the partition case, but the trade shows up every day even when the network is
          fine. <strong>PACELC</strong> completes it: if Partition, choose Availability or Consistency; Else,
          choose Latency or Consistency. Keeping replicas strongly consistent costs a round-trip on every
          operation, so the real question most of the time is how much latency you will pay for how much
          consistency.
        </p>
      </Block>

      <Block eyebrow="a spectrum, not a switch" title="Consistency models">
        <OpTable
          cols={["Model", "Guarantee", "", "Cost / use"]}
          rows={[
            { op: "Strong / linearizable", avg: "every read sees the latest write", avgTone: "ok", why: "Behaves like one copy. The strongest and most intuitive, but needs coordination on every op, so highest latency. Ledgers, locks." },
            { op: "Causal", avg: "cause is seen before effect", avgTone: "good", why: "Related events stay ordered without global coordination. A strong, affordable middle for messaging and collaboration." },
            { op: "Read-your-writes", avg: "you see your own updates", avgTone: "good", why: "A session guarantee: after you post, you see your post, even if others do not yet. Cheap and high-value for UX." },
            { op: "Eventual", avg: "replicas converge given time", avgTone: "good", why: "No ordering promise, just eventual agreement. Cheapest and most available. Fine for likes, counters, caches." },
          ]}
        />
      </Block>

      <Block eyebrow="tuning the overlap" title="Quorums: R + W > N">
        <p className="text-ink-dim leading-relaxed mb-2">
          In a leaderless system with N replicas, you require W replicas to ack a write and R to answer a read.
          If <strong>R + W &gt; N</strong>, the read set and the write set must overlap in at least one replica,
          so a read is guaranteed to see the most recent acknowledged write. Tuning R and W trades read
          availability against write availability.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`N = 3 replicas
  W = 2, R = 2  -> R + W = 4 > 3  : read and write sets overlap -> strong-ish reads
  W = 1, R = 1  -> R + W = 2 <= 3 : fast but a read can miss the latest write
  W = 3, R = 1  -> writes need all 3 (slow, fragile), reads are cheap`}
        />
        <Callout kind="trap" title="R + W > N is not full linearizability">
          The overlap guarantees a read sees the latest acked write, but without read-repair and care around
          concurrent writes you can still observe anomalies. It is much stronger than eventual, not the same as
          a linearizable single-copy system.
        </Callout>
      </Block>

      <Block eyebrow="agreeing on one truth" title="Consensus and split-brain">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Consensus</strong> protocols (Raft, Paxos) let a cluster agree on a single ordered log of
          decisions even as nodes fail. They power leader election and the metadata stores everything else
          leans on, etcd, ZooKeeper, Consul. The key property is that they need a <strong>majority quorum</strong>
          to make progress, which is exactly what prevents split-brain.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Split-brain</strong> is two nodes both believing they are the leader after a partition, each
          accepting writes, diverging the data. A majority quorum stops it: at most one side of a partition can
          hold the majority, so the minority side cannot elect a leader or accept writes. Fencing tokens add a
          second guard by making a demoted leader's late writes get rejected downstream.
        </p>
        <Callout kind="tip" title="Run an odd number of nodes">
          Majority quorum is why consensus clusters are sized 3, 5, or 7. An even number wastes a node (4
          tolerates the same one failure as 3) and risks a tie, so odd sizing gives the best failure tolerance
          per node.
        </Callout>
      </Block>

      <Block eyebrow="crossing service boundaries" title="Distributed transactions: 2PC vs saga">
        <p className="text-ink-dim leading-relaxed mb-2">
          When one logical operation spans several services or databases, you need a way to keep them
          consistent. Two shapes, and the industry default across microservices is the saga.
        </p>
        <OpTable
          cols={["Approach", "How", "", "Trade"]}
          rows={[
            { op: "Two-phase commit (2PC)", avg: "prepare, then commit", avgTone: "ok", why: "Atomic across participants, but blocking: a coordinator crash can leave participants locked, and it couples everyone's availability. Rare across services." },
            { op: "Saga", avg: "local txns + compensations", avgTone: "good", why: "Each step commits locally; a failure triggers compensating actions to undo prior steps. Eventually consistent, needs idempotency, but resilient." },
          ]}
        />
        <Callout kind="tip" title="Pair a saga with a transactional outbox">
          To emit the saga's events reliably, write the event to an outbox table in the same local transaction
          as the state change, then a relay ships it. That closes the gap where a service commits but crashes
          before publishing, which is the classic dual-write bug.
        </Callout>
      </Block>

      <Block eyebrow="probe deeper" title="The follow-up chain">
        <div className="space-y-3 text-sm">
          <p className="text-ink-dim leading-relaxed">
            <strong>Give me the CAP choice for a shopping cart versus a bank ledger.</strong> The cart is AP:
            never block adding an item, accept a divergent replica, and merge carts later, because a lost add
            annoys but a blocked one loses the sale. The ledger is CP: under a partition, refuse the write
            rather than risk a double-spend. Business tolerance for staleness picks the side.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>R + W &gt; N gives strong consistency, right?</strong> It guarantees the read and write
            quorums overlap, so a read sees the latest acknowledged write, which is much stronger than
            eventual. But without read-repair and handling of concurrent writes you can still see anomalies, so
            I would not call it full linearizability.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>Why does consensus need a majority instead of all nodes?</strong> Requiring all nodes
            destroys availability, one node down and you are stuck. A majority quorum tolerates a minority
            failure and, because any two majorities overlap, guarantees a single source of truth. Even-sized
            clusters risk ties, so I run an odd number.
          </p>
          <p className="text-ink-dim leading-relaxed">
            <strong>2PC or saga for a multi-service checkout?</strong> A saga. 2PC is atomic but blocking and
            couples the availability of every participant, which is a poor fit across services. I model
            checkout as local transactions with compensating actions, make each step idempotent, and use a
            transactional outbox to publish events reliably, accepting eventual consistency.
          </p>
        </div>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The 30-second version">
          "Under a network partition you must choose consistency or availability, that is CAP, and PACELC adds
          that even without a partition you trade latency for consistency. So I map it to the business: a cart
          is AP and merges later, a ledger is CP and refuses rather than double-spend. Consistency is a
          spectrum from strong to causal to eventual, quorums with R plus W greater than N give read-your-write
          overlap, and consensus like Raft uses a majority quorum to elect one leader and prevent split-brain.
          Across services I use sagas with compensations and an outbox, not 2PC."
        </Callout>
        <Callout kind="note" title="The 2-minute expansion">
          "I state CAP carefully: partitions are a given, so the theorem is that during a partition you choose
          between consistency and availability, and when the network is healthy you get both. CP means
          refusing a request rather than returning divergent data, AP means answering and reconciling later,
          and I pick from the business, a bank ledger is CP because a double-spend is unacceptable, a shopping
          cart is AP because we never block an add. PACELC completes the picture: else, when there is no
          partition, you still trade latency for consistency, because keeping replicas strongly consistent
          costs a round-trip per operation. Consistency itself is a spectrum, linearizable where every read
          sees the latest write but coordination makes it slow, causal where cause precedes effect without
          global ordering, read-your-writes as a cheap session guarantee, and eventual where replicas just
          converge. In leaderless systems I tune quorums: with N replicas, R plus W greater than N forces the
          read and write sets to overlap so a read sees the latest acked write, and I move R and W to trade read
          against write availability, while being honest that it is stronger than eventual but not full
          linearizability. For a single source of truth I rely on consensus, Raft or Paxos, which needs a
          majority quorum to make progress, and that majority is exactly what prevents split-brain, since only
          one side of a partition can hold it, backed by fencing tokens against a demoted leader. I size those
          clusters odd, 3, 5, or 7. And when an operation crosses service boundaries I avoid blocking 2PC in
          favor of a saga with compensating transactions, idempotent steps, and a transactional outbox for
          reliable event publication, accepting eventual consistency."
        </Callout>
      </Block>
    </>
  );
}

/* ── Rapid fire · self-test ───────────────────────────────────── */
const DECK = [
  { q: "L4 vs L7 load balancing, in one line each.", a: "L4 forwards packets by IP and port with no payload inspection, so it is fast and protocol-agnostic. L7 parses HTTP, so it can route by host, path, or cookie, terminate TLS, and retry, at more CPU per request.", tag: "load balancing" },
  { q: "Round-robin vs least-connections, when does the difference matter?", a: "Round-robin rotates evenly, ignoring load; least-connections sends to the backend with the fewest in-flight connections. They are identical for uniform requests; least-connections wins when request durations vary widely.", tag: "load balancing" },
  { q: "Why must load-balanced services be stateless, and what smell do sticky sessions signal?", a: "Statelessness lets any instance serve any request, so you can add, remove, or lose nodes freely. Sticky sessions pin a client to one backend, breaking distribution and losing state when it dies. Externalize state to Redis or a signed token instead.", tag: "stateless" },
  { q: "Cache-aside vs write-through: where does each leave risk?", a: "Cache-aside loads on miss and invalidates on write, leaving a brief stale window between the DB write and the cache delete. Write-through writes cache and DB synchronously, so it is never stale and loses nothing, but every write pays full DB latency.", tag: "caching" },
  { q: "What is the risk in write-back (write-behind) caching?", a: "The cache acks the write and flushes to the DB asynchronously, so writes are fast, but any acknowledged write is lost if the cache node dies before the flush. Use it only where some data loss is tolerable.", tag: "caching" },
  { q: "What is a cache stampede (thundering herd) and how do you stop it?", a: "A hot key expires and thousands of concurrent misses hit the DB at once. Stop it with single-flight request coalescing so one load serves all waiters, TTL jitter so keys do not expire in lockstep, and serve-stale-while-revalidating.", tag: "caching" },
  { q: "What is a CDN and which header controls its caching?", a: "A globally-distributed edge cache that serves content close to the user and shields the origin. Cache-Control with max-age controls browser caching and s-maxage targets the CDN; stale-while-revalidate keeps serving while it refreshes.", tag: "CDN" },
  { q: "API gateway vs reverse proxy, what is the difference?", a: "A reverse proxy fronts servers and does TLS termination, load balancing, caching, and routing. An API gateway is that proxy specialized for APIs, adding authentication, rate limiting, versioning, protocol translation, and observability as a single entry point.", tag: "API gateway" },
  { q: "SQL vs NoSQL, how do you actually choose?", a: "From access patterns, consistency, and scale, not the label. Default to relational for schema, joins, and ACID; reach for a NoSQL family when a concrete requirement demands it, key-value for O(1) scale, document for flexible reads, wide-column for write-heavy, graph for traversals.", tag: "data stores" },
  { q: "ACID vs BASE?", a: "ACID (atomicity, consistency, isolation, durability) puts correctness first, classic relational. BASE (basically available, soft state, eventual consistency) puts availability and scale first, classic distributed NoSQL. The line has blurred with transactional NoSQL and distributed SQL.", tag: "data stores" },
  { q: "Hash vs range sharding, and the trade of each?", a: "Hash sharding spreads keys evenly and avoids insert hotspots but cannot do range scans without hitting every shard. Range sharding serves ordered scans efficiently but hotspots when keys are sequential, like timestamps or auto-increment IDs.", tag: "sharding" },
  { q: "What is a hot shard and how do you fix it?", a: "A skewed shard key concentrates load on one node, a dominant tenant or a monotonic key, so you get sharding's complexity without its scale. Fix it with a compound or salted key to spread the load, a dedicated shard for the whale, or by splitting the hot partition.", tag: "sharding" },
  { q: "Synchronous vs asynchronous replication, what is the trade?", a: "Synchronous waits for a replica to ack before acking the client, so no data is lost on failover but writes are slower and a dead replica stalls them. Asynchronous acks immediately, fast but loses un-shipped writes if the leader dies. Semi-sync waits for one replica as the middle.", tag: "replication" },
  { q: "What does consistent hashing solve?", a: "Plain hash-mod-N remaps most keys when the node count changes. Consistent hashing places nodes and keys on a ring so adding or removing a node only moves that node's share, roughly 1/N of the keys. Virtual nodes even out the distribution.", tag: "sharding" },
  { q: "What is a covering index and why is it fast?", a: "An index that contains every column a query needs, in the key or via INCLUDE, so the engine answers entirely from the index with no heap fetch, an index-only scan. It is a big win on read-heavy hot queries over wide tables.", tag: "indexing" },
  { q: "LSM-tree vs B-tree, which for what?", a: "B-trees update in place, giving cheap reads and random-I/O writes, best for balanced or read-heavy workloads. LSM-trees append and compact, giving cheap sequential writes but read amplification, best for write-heavy ingest like Cassandra or RocksDB.", tag: "indexing" },
  { q: "What is the competing consumers pattern, and what does it cost?", a: "Many workers read one queue and each message goes to exactly one worker, so throughput scales with worker count. The cost is that global ordering is lost; you recover per-key order by partitioning on a key.", tag: "queues" },
  { q: "What is backpressure and why does an unbounded queue not fix overload?", a: "Backpressure is the system pushing back when consumers cannot keep up, via bounded buffers, pull-based consumption, load shedding, or autoscaling on lag. An unbounded queue just relocates the out-of-memory downstream and hides the overload until it is catastrophic.", tag: "queues" },
  { q: "What is split-brain and how does a quorum prevent it?", a: "Split-brain is two nodes both acting as leader after a partition, each accepting writes and diverging the data. A majority quorum prevents it: at most one side of a partition can hold the majority, so the minority cannot elect a leader or accept writes. Fencing tokens add a second guard.", tag: "consistency" },
  { q: "State CAP in one clean sentence.", a: "During a network partition you must choose between consistency (refuse rather than return divergent data) and availability (answer and reconcile later); when the network is healthy you get both, and a CA distributed store is not a real option.", tag: "consistency" },
];

function RapidFire() {
  return (
    <>
      <Lede>
        Twenty cards across the whole toolkit, load balancing, caching, gateways, data stores, sharding,
        replication, indexing, queues, and consistency. Read the question, answer out loud in a sentence or
        two, then reveal and grade yourself. The reps are what turn "I sort of know this" into a clean spoken
        answer under pressure.
      </Lede>
      <Try label="rapid fire">
        <QuickFire accent={ACCENT} deck={DECK} />
      </Try>
    </>
  );
}

const CONTENT = {
  loadbalancing: <LoadBalancing />,
  caching: <Caching />,
  apigateway: <ApiGateway />,
  sqlnosql: <SqlNoSql />,
  sharding: <Sharding />,
  indexing: <Indexing />,
  queues: <Queues />,
  consistency: <Consistency />,
  quickfire: <RapidFire />,
};

export default function ArchFundamentals() {
  const [active, setActive] = useState("loadbalancing");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Building blocks · the BEDROCK"
      title="Architecture Fundamentals"
      subtitle="The reusable pieces every design is assembled from, and the trade-off each one hides."
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
