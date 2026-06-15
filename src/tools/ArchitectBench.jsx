import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import CostEstimatorViz from "./architect/CostEstimatorViz.jsx";
import ServingEstimatorViz from "./architect/ServingEstimatorViz.jsx";
import TradeoffTriangleViz from "./architect/TradeoffTriangleViz.jsx";
import RolloutStrategyViz from "./architect/RolloutStrategyViz.jsx";

const ACCENT = "#fb6f3c";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "rag-system", label: "Design: RAG assistant", group: "System design" },
  { id: "serving", label: "Design: LLM serving", group: "System design" },
  { id: "scaling", label: "Design: scaling & reliability", group: "System design" },
  { id: "recommendation", label: "Design: recommendation system", group: "System design" },
  { id: "multiagent", label: "Design: multi-agent", group: "System design" },
  { id: "mlops", label: "The MLOps lifecycle", group: "MLOps & lifecycle" },
  { id: "data", label: "Data & feature pipelines", group: "MLOps & lifecycle" },
  { id: "deployment", label: "Deployment & rollout", group: "MLOps & lifecycle" },
  { id: "eval-system", label: "Eval & monitoring", group: "MLOps & lifecycle" },
  { id: "cost", label: "Cost & capacity", group: "Judgment" },
  { id: "numbers", label: "Numbers to know", group: "Judgment" },
  { id: "safety", label: "Guardrails & safety", group: "Judgment" },
];

/* ── RAG system design ────────────────────────────────────────── */
function RagSystem() {
  return (
    <>
      <Lede>
        The canonical AI architect question: “Design an assistant over our company's documents.” There's
        a standard skeleton — name the stages, then defend the choices at each one.
      </Lede>

      <Block eyebrow="the skeleton" title="Two paths: ingestion and query">
        <CodeBlock
          title="text"
          lang="text"
          code={`INGESTION (offline, batch)
  sources → loaders → clean → chunk → embed → vector DB (+ metadata)
                                              ↳ keep a doc store for citations

QUERY (online, per request)
  q → [guardrail] → embed → hybrid search top-k → rerank
    → assemble prompt (context + citations) → LLM → [grounding check] → answer + sources`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Talk through the decisions an interviewer probes: <strong>chunking</strong> strategy,{" "}
          <strong>hybrid</strong> (keyword + vector) retrieval, a <strong>reranker</strong> for
          precision, <strong>citations</strong> for trust, and an <strong>eval harness</strong> so you
          can prove a change helped.
        </p>
        <Callout kind="tip" title="What separates senior answers">
          Junior: “embed docs, search, prompt.” Senior: “here's how I measure retrieval quality
          (recall@k on a golden set), handle stale docs (re-index pipeline), control cost (cache +
          context budget), and detect hallucination (grounding check + citations).”
        </Callout>
        <Callout kind="trap" title="Name the failure modes first">
          Stale index, missing access controls (a user retrieving docs they shouldn't), context overflow,
          and confident answers with no source. Raising these unprompted is the strongest signal you can send.
        </Callout>
      </Block>

      <Block eyebrow="component by component" title="What each box actually does">
        <p className="text-ink-dim leading-relaxed mb-2">
          The diagram has two halves because they run on completely different clocks.{" "}
          <strong>Ingestion is offline and batch</strong> — it runs when documents change, and it's where
          you spend compute to make queries cheap. <strong>Query is online and per-request</strong> — it's
          on the user's latency budget, so every stage here is a millisecond you're spending. Walk an
          interviewer through both, naming the job of each box.
        </p>
        <OpTable
          cols={["Stage", "Job", "", "The decision to defend"]}
          rows={[
            { op: "Chunk", avg: "split docs", avgTone: "ok", why: "Too big → retrieval is fuzzy and you waste context; too small → you lose surrounding meaning. ~200–500 tokens with overlap is the usual start." },
            { op: "Embed", avg: "text → vector", avgTone: "ok", why: "Same model must embed both docs (offline) and queries (online) — mismatched models silently kill recall." },
            { op: "Vector DB", avg: "ANN search", avgTone: "good", why: "Approximate nearest-neighbour over millions of vectors. Stores metadata (tenant, ACL, source) alongside for filtering." },
            { op: "Hybrid search", avg: "keyword + vector", avgTone: "good", why: "Vectors miss exact terms (error codes, names); BM25 keyword search catches them. Fuse both for recall." },
            { op: "Rerank", avg: "re-score top-k", avgTone: "ok", why: "A cross-encoder re-scores the top ~50 candidates for precision. Slower per pair, so only on the shortlist." },
            { op: "Generate", avg: "LLM + context", avgTone: "ok", why: "Stuff the reranked chunks + question into the prompt; instruct it to answer only from context and cite." },
          ]}
        />
        <Callout kind="note" title="Retrieve-then-read, not retrieve-then-trust">
          The generator is the <em>last</em> and least controllable stage. Most quality wins are upstream:
          better chunking, hybrid retrieval, and a reranker move the needle far more than swapping the LLM.
          A great model over bad retrieval is a confident liar — it will fluently summarize the wrong document.
        </Callout>
      </Block>

      <Block eyebrow="scaling each stage" title="Where it breaks under load">
        <p className="text-ink-dim leading-relaxed mb-2">
          Each stage scales differently, and an interviewer will push on "what happens at 10× the
          documents / 10× the queries?" The two axes are <strong>corpus size</strong> (stresses ingestion
          and the index) and <strong>query volume</strong> (stresses search and generation).
        </p>
        <OpTable
          cols={["Pressure", "First thing to break", "", "Mitigation"]}
          rows={[
            { op: "More documents", avg: "index build + ANN", avgTone: "bad", why: "Re-embedding the corpus is expensive; ANN recall degrades. Shard the index, batch re-embed, tune the ANN graph." },
            { op: "More queries", avg: "embed + generate cost", avgTone: "bad", why: "Each query embeds + calls the LLM. Cache embeddings of repeat queries; cache full answers for hot questions." },
            { op: "Bigger contexts", avg: "LLM cost + latency", avgTone: "bad", why: "More chunks = more input tokens = quadratic-ish attention cost. Cap k, rerank hard, trim aggressively." },
          ]}
        />
        <Callout kind="tip" title="Caching is the cheapest scale lever">
          Three cache layers earn their keep: <strong>query embeddings</strong> (same question asked twice),{" "}
          <strong>retrieval results</strong> (same query → same chunks), and <strong>final answers</strong>{" "}
          (FAQ-style hot questions). Each one removes an entire downstream stage from the request.
        </Callout>
      </Block>

      <Block eyebrow="multi-tenancy & trust" title="Access control is a retrieval-time concern">
        <p className="text-ink-dim leading-relaxed mb-2">
          The subtle, senior point: <strong>authorization happens at retrieval, not generation.</strong>{" "}
          If a chunk the user can't see makes it into the prompt, the model <em>will</em> leak it — there's
          no putting that genie back. So the vector search must filter by the requesting user's permissions{" "}
          <em>before</em> the LLM ever sees a candidate.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`q → embed → vector search WHERE tenant_id = :user.tenant
                       AND acl_group IN :user.groups   ← filter HERE, pre-LLM
   → rerank → prompt(only-permitted chunks) → answer`}
        />
        <Callout kind="trap" title="The leak you can't undo">
          Filtering after the model has read the chunk is too late — the answer can paraphrase content the
          user was never allowed to see. Store ACL/tenant metadata <em>on the vectors</em> and enforce it in
          the search query, so forbidden documents are never candidates.
        </Callout>
        <Callout kind="tip" title="The interview answer">
          "Ingestion chunks, embeds, and indexes docs offline with tenant + ACL metadata. A query embeds,
          does ACL-filtered hybrid search, reranks the top-k, and prompts the LLM to answer only from those
          chunks with citations. I measure retrieval with recall@k on a golden set, control cost with
          caching and a context budget, and handle staleness with a re-index pipeline."
        </Callout>
      </Block>
    </>
  );
}

/* ── Serving ──────────────────────────────────────────────────── */
function Serving() {
  return (
    <>
      <Lede>
        Serving LLMs efficiently is a GPU-memory and batching problem. Even if you use an API in
        practice, architects are expected to reason about throughput, latency, and the KV cache.
      </Lede>

      <Try label="serving capacity"><ServingEstimatorViz /></Try>

      <Block eyebrow="the bottlenecks" title="What actually limits an inference server">
        <OpTable
          cols={["Lever", "Effect", "", "The catch"]}
          rows={[
            { op: "Continuous batching", avg: "↑↑ throughput", avgTone: "good", why: "Merge in-flight requests; the biggest single win for utilization." },
            { op: "KV cache", avg: "avoids recompute", avgTone: "good", why: "Grows with context × batch — often the real memory ceiling." },
            { op: "Quantization (INT8/4)", avg: "fits bigger models", avgTone: "ok", why: "Small quality hit; lets one GPU hold more." },
            { op: "Streaming", avg: "↓ perceived latency", avgTone: "good", why: "User sees the first token as soon as it's ready; TTFT and total time don't actually change." },
            { op: "Speculative decoding", avg: "↓ latency", avgTone: "ok", why: "Small draft model proposes tokens; complexity cost." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Two latency numbers matter: <strong>time-to-first-token</strong> (prefill, scales with input
          length) and <strong>inter-token latency</strong> (decode, one token at a time). Streaming hides
          the second; nothing hides a giant prompt's prefill except trimming context.
        </p>
        <Callout kind="note" title="GPU memory budget">
          VRAM ≈ model weights + KV cache + activations. A 13B model at FP16 (~26GB) barely fits a 40GB
          GPU once the KV cache for long contexts is added — which is why quantization and paged-KV
          (vLLM) exist.
        </Callout>
      </Block>

      <Block eyebrow="the two phases" title="Prefill vs decode — one model, two workloads">
        <p className="text-ink-dim leading-relaxed mb-2">
          A single generation request is really two very different jobs back to back. Understanding the split
          is what lets you reason about latency at all.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`PREFILL   process the whole prompt in ONE parallel pass → first token
          compute-bound, scales with INPUT length     → time-to-first-token (TTFT)

DECODE    generate output tokens ONE at a time, each re-reading the KV cache
          memory-bandwidth-bound, scales with OUTPUT  → inter-token latency (ITL)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          <strong>Prefill</strong> is embarrassingly parallel — the GPU chews the entire prompt at once, so
          it's <em>compute</em>-bound and gets slower with longer inputs. <strong>Decode</strong> is
          inherently sequential — one token, then the next — and each step mostly reads the KV cache from
          memory, so it's <em>bandwidth</em>-bound. This is why a huge prompt with a one-word answer feels
          slow to start but finishes fast, and a short prompt writing an essay starts instantly but trickles.
        </p>
        <Callout kind="tip" title="Two latency numbers, two fixes">
          High <strong>TTFT</strong>? The prompt is too long — trim context, cache the prefix.{" "}
          High <strong>inter-token latency</strong>? You're bandwidth-bound in decode — quantize, use a
          smaller model, or try speculative decoding. Streaming hides ITL from the user but changes neither
          number; nothing hides prefill except a shorter prompt.
        </Callout>
      </Block>

      <Block eyebrow="the biggest win" title="Continuous batching and the KV cache">
        <p className="text-ink-dim leading-relaxed mb-2">
          Naïve batching waits for every request in a batch to finish before starting the next — so one
          long generation stalls a dozen short ones. <strong>Continuous (in-flight) batching</strong> slots
          a new request into the batch the moment any sequence finishes, keeping the GPU saturated. It's the
          single biggest throughput win in modern serving, and the reason a server's tokens/sec under load
          can be many times its single-request rate.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          The constraint on how many requests you can batch is almost always the{" "}
          <strong>KV cache</strong>. Every active sequence holds the keys and values of all its past tokens
          in GPU memory, and that grows with <code className="font-mono">context length × batch size ×
          layers × heads</code>. At long contexts the KV cache can dwarf the model weights — it, not raw
          FLOPs, is usually the ceiling on concurrency.
        </p>
        <Callout kind="note" title="Why paged attention (vLLM) matters">
          Classic serving pre-allocates a contiguous KV slab per request sized for the <em>worst case</em>,
          wasting most of it. <strong>Paged attention</strong> stores the cache in fixed-size pages (like OS
          virtual memory), allocated on demand. Far less fragmentation means far more sequences fit at once —
          which is exactly the lever continuous batching needs.
        </Callout>
        <Callout kind="trap" title="The throughput ↔ latency tension">
          Bigger batches use the GPU more efficiently (higher tokens/sec) but each individual request waits
          longer behind the others (higher per-request latency). You're always trading aggregate throughput
          against tail latency — there's no setting that maximizes both.
        </Callout>
      </Block>

      <Block eyebrow="fitting & speeding the model" title="Quantization, speculative decoding, multi-GPU">
        <p className="text-ink-dim leading-relaxed mb-2">
          When one GPU can't hold the model, or decode is too slow, you reach for these — each with a clear
          cost.
        </p>
        <OpTable
          cols={["Technique", "Buys you", "", "The cost"]}
          rows={[
            { op: "Quantization", avg: "smaller weights", avgTone: "good", why: "INT8/INT4 cuts weight memory 2–4×, fitting bigger models or more KV cache. Small, usually-acceptable quality hit." },
            { op: "Speculative decoding", avg: "↓ inter-token latency", avgTone: "ok", why: "A tiny draft model guesses several tokens; the big model verifies them in one pass. Wins when the draft is usually right; complexity + wasted compute when it's wrong." },
            { op: "Tensor parallel", avg: "split each layer", avgTone: "ok", why: "Shard a layer's matrices across GPUs — needed when the model itself doesn't fit one GPU. Heavy inter-GPU communication, so keep it within one node." },
            { op: "Pipeline parallel", avg: "split by layer", avgTone: "ok", why: "Put different layers on different GPUs/nodes. Scales across machines but adds pipeline-bubble latency." },
          ]}
        />
        <Callout kind="tip" title="The interview answer">
          "Serving is a memory and batching problem. Prefill is compute-bound and sets time-to-first-token;
          decode is bandwidth-bound and sets inter-token latency. Continuous batching is the biggest
          throughput win, but the KV cache — which grows with context × batch — is the memory ceiling, so
          paged attention and quantization exist to fit more sequences. Past that I trade batch size against
          tail latency, and go multi-GPU only when the model doesn't fit one."
        </Callout>
      </Block>
    </>
  );
}

/* ── Eval & monitoring ────────────────────────────────────────── */
function EvalSystem() {
  return (
    <>
      <Lede>
        A model that worked in the demo silently rots in production — data drifts, prompts regress,
        users find edge cases. Designing the eval-and-monitoring loop is what makes an AI system
        operable, and it's increasingly a dedicated interview round.
      </Lede>

      <Block eyebrow="the loop" title="Offline gate + online watch + feedback">
        <CodeBlock
          title="text"
          lang="text"
          code={`OFFLINE (every change)   golden set → metrics → block deploy if regressed
ONLINE  (every request)  log inputs/outputs + latency + cost + user feedback
DRIFT   (continuous)     watch input distribution & quality signals over time
LOOP    (periodic)       mine failures → add to golden set → improve → repeat`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The flywheel is the point: production failures become tomorrow's test cases. Capture thumbs,
          edits, and abandonment as labels; sample them into the golden set; and the system compounds.
        </p>
        <Callout kind="trap" title="What to monitor beyond accuracy">
          Latency (p50/p95), cost per request, hallucination/grounding rate, refusal rate, and{" "}
          <strong>input drift</strong> (are users asking new kinds of questions?). A quality drop often
          shows up as drift first.
        </Callout>
        <Callout kind="tip" title="Say the word ‘flywheel’ and mean it">
          “Every failure becomes a regression test” is the line that signals you've operated AI in prod,
          not just built a prototype.
        </Callout>
      </Block>

      <Block eyebrow="the gate" title="Offline eval — the golden set blocks regressions">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>golden set</strong> is a curated collection of inputs with known-good outputs (or
          gradeable criteria). Every proposed change — a new prompt, a model swap, a retrieval tweak — runs
          against it <em>before</em> deploy. If a metric regresses, the change is blocked. This is the AI
          equivalent of a CI test suite: it turns "the prompt feels better" into a number you can defend.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`golden_set = [(input, expected_or_rubric), ...]   # curated, version-controlled
for change in candidates:
    score = evaluate(change, golden_set)         # accuracy / grounding / etc.
    if score < baseline - tolerance:
        block_deploy(change)                     # regression — do not ship`}
        />
        <Callout kind="trap" title="A golden set rots if you let it">
          A static eval set goes stale as real usage drifts away from it. That's what the flywheel fixes:
          mine production failures, label them, and feed them back in — so the gate keeps testing the cases
          users actually hit, not the ones you imagined at launch.
        </Callout>
      </Block>

      <Block eyebrow="the dashboard" title="What to monitor online — beyond accuracy">
        <p className="text-ink-dim leading-relaxed mb-2">
          Accuracy is the metric juniors name; the operational signals are what separate a senior answer.
          You can't see "quality" directly in prod, so you watch a basket of proxies and alert on movement.
        </p>
        <OpTable
          cols={["Signal", "Watch", "", "Why it matters"]}
          rows={[
            { op: "Latency", avg: "p50 / p95", avgTone: "ok", why: "The mean lies; the tail is the user experience. p95 is your real SLO." },
            { op: "Cost / request", avg: "$ per call", avgTone: "ok", why: "Input/context tokens creep up silently as prompts and RAG context grow. Watch the trend." },
            { op: "Grounding rate", avg: "answers w/ citation", avgTone: "good", why: "Share of answers actually supported by retrieved context — your hallucination proxy." },
            { op: "Refusal rate", avg: "% declined", avgTone: "ok", why: "A spike means either an attack, a regression, or an over-tightened guardrail. A drop can mean a jailbreak." },
            { op: "Input drift", avg: "distribution shift", avgTone: "bad", why: "Users asking new kinds of questions. Quality usually drops as drift first, before any metric does." },
          ]}
        />
        <Callout kind="note" title="Drift is the early-warning system">
          A model doesn't get worse — the world moves out from under it. New products, new slang, new
          attack patterns shift the input distribution, and the model is now answering questions it was
          never evaluated on. Detecting that drift is often your first sign of trouble, ahead of any
          accuracy dip.
        </Callout>
      </Block>

      <Block eyebrow="grading at scale" title="LLM-as-judge — and its big caveat">
        <p className="text-ink-dim leading-relaxed mb-2">
          You can't hand-label every production output, so you use a strong model to grade outputs against a
          rubric — <strong>LLM-as-judge</strong>. It's how you score "is this answer grounded / helpful /
          correct?" at thousands of examples a night. The catch: a judge is itself a fallible model, with
          its own biases (it favors longer answers, its own style, the first option shown).
        </p>
        <Callout kind="trap" title="Calibrate the judge against humans">
          An uncalibrated judge gives you precise-looking numbers that don't track reality. Periodically
          score a sample by hand and check the judge agrees with the humans; if it doesn't, fix the rubric
          before you trust the gate. The judge measures the human labels — it doesn't replace them.
        </Callout>
        <Callout kind="tip" title="The interview answer">
          "An offline golden set gates every change — block deploy on regression. Online I log inputs,
          outputs, latency, cost, and feedback, and monitor p95 latency, cost/request, grounding rate,
          refusal rate, and input drift. An LLM judge grades at scale, calibrated against human labels.
          The whole thing is a flywheel: production failures become tomorrow's golden-set cases."
        </Callout>
      </Block>
    </>
  );
}

/* ── Multi-agent ──────────────────────────────────────────────── */
function MultiAgent() {
  return (
    <>
      <Lede>
        Multi-agent systems decompose a hard task across specialized roles. Powerful, but they multiply
        cost, latency, and failure surface — so the architect's job is to justify the complexity.
      </Lede>

      <Block eyebrow="the shape" title="Orchestrator + specialized workers">
        <CodeBlock
          title="text"
          lang="text"
          code={`            ┌─ researcher (search + retrieve)
orchestrator ─┼─ coder (write + run)
  (plans,     ├─ critic (verify, refute)
   routes,    └─ ...
   merges)    each worker = an LLM + its own tools + scoped context`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Common topologies: <strong>pipeline</strong> (fixed hand-offs), <strong>orchestrator-worker</strong>{" "}
          (a planner fans out and merges), and <strong>debate/critic</strong> (a verifier challenges the
          generator). Add a critic when correctness matters more than cost.
        </p>
        <Callout kind="trap" title="The complexity tax is real">
          N agents ≈ N× cost and latency, plus error propagation between them. Reach for a single agent or
          a fixed pipeline first; only split into roles when one context genuinely can't hold the task.
        </Callout>
      </Block>

      <Block eyebrow="the topologies" title="Three shapes, three jobs">
        <p className="text-ink-dim leading-relaxed mb-2">
          "Multi-agent" isn't one thing — there's a ladder of structure, and you pick the lowest rung that
          does the job. The more control you can encode in <em>your</em> code rather than the model's
          judgment, the cheaper and more reliable the system.
        </p>
        <OpTable
          cols={["Topology", "Shape", "", "Reach for it when"]}
          rows={[
            { op: "Single agent", avg: "one loop + tools", avgTone: "good", why: "The default. One context, one model, a set of tools. Cheapest and most debuggable — exhaust this first." },
            { op: "Pipeline", avg: "fixed hand-offs", avgTone: "good", why: "Stages run in a known order (extract → transform → summarize). The control flow is in your code, not the model's — predictable and cheap." },
            { op: "Orchestrator-worker", avg: "plan, fan out, merge", avgTone: "ok", why: "A planner decides the steps at runtime and delegates to specialists. Use when the steps genuinely can't be known ahead of time." },
            { op: "Debate / critic", avg: "generator + verifier", avgTone: "ok", why: "A second agent challenges the first's output. Use when correctness matters more than the doubled cost." },
          ]}
        />
        <Callout kind="note" title="A fixed chain is not a multi-agent system">
          If the steps are always the same, that's a <strong>pipeline</strong> — encode it in plain code and
          keep each step a single LLM call. You only need an <em>orchestrator</em> when the plan itself has
          to be decided at runtime. Don't pay for a planner to rediscover a flow you already know.
        </Callout>
      </Block>

      <Block eyebrow="the costs that compound" title="Why complexity is rarely worth it">
        <p className="text-ink-dim leading-relaxed mb-2">
          Every agent you add multiplies three things, and the third is the killer.
        </p>
        <OpTable
          cols={["Multiplied", "Effect", "", "Detail"]}
          rows={[
            { op: "Cost", avg: "≈ N× tokens", avgTone: "bad", why: "Each agent runs its own LLM calls, often re-reading shared context. The orchestrator pays again to merge." },
            { op: "Latency", avg: "serial chains add up", avgTone: "bad", why: "Sequential hand-offs stack latency; only independent sub-tasks can run in parallel." },
            { op: "Error propagation", avg: "compounding failure", avgTone: "bad", why: "A wrong intermediate result becomes a confident input downstream. 90%-reliable steps chained 5 deep ≈ 59% reliable end to end." },
          ]}
        />
        <Callout kind="trap" title="Errors compound silently">
          The dangerous failure isn't a crash — it's an agent that hands a plausible-but-wrong result to the
          next, which treats it as ground truth. The more hops, the more places for a small mistake to
          calcify. A critic/verifier exists precisely to break this chain.
        </Callout>
      </Block>

      <Block eyebrow="what each agent sees" title="Shared vs scoped context">
        <p className="text-ink-dim leading-relaxed mb-2">
          A real design decision: does every agent see the whole conversation (<strong>shared context</strong>),
          or only the slice it needs (<strong>scoped context</strong>)? Shared context keeps agents
          coordinated but is expensive — everyone re-reads everything — and risks one agent's confusion
          spreading. Scoped context is cheaper and more focused, but the orchestrator now owns the job of
          passing each worker exactly what it needs, and stitching results back together.
        </p>
        <Callout kind="tip" title="The interview answer">
          "I start with a single agent, then a fixed pipeline if the steps are known. I only reach for an
          orchestrator-worker setup when the plan must be decided at runtime, and add a critic when
          correctness beats cost. The reason to resist is that N agents multiply cost and latency and, worst
          of all, propagate errors — a wrong intermediate becomes a confident input downstream. I scope each
          agent's context to what it needs rather than sharing everything."
        </Callout>
      </Block>
    </>
  );
}

/* ── Cost & capacity ──────────────────────────────────────────── */
function Cost() {
  return (
    <>
      <Lede>
        Architects get asked “what will this cost to run?” on the whiteboard. The math is simple
        multiplication — but knowing the dominant driver (usually input/context tokens) is the signal.
      </Lede>

      <Try label="cost estimator"><CostEstimatorViz /></Try>

      <Try label="cost · latency · quality"><TradeoffTriangleViz /></Try>

      <Block eyebrow="the method" title="Back-of-envelope LLM cost">
        <CodeBlock
          title="text"
          lang="text"
          code={`monthly_cost = requests/mo
             × ((in_tokens  × price_in)
              + (out_tokens × price_out)) / 1e6

requests/mo = DAU × req/user/day × 30`}
        />
        <Callout kind="tip" title="Levers, in order of leverage">
          (1) <strong>Cache</strong> repeated/identical calls. (2) <strong>Trim context</strong> — RAG
          chunks dominate input tokens. (3) <strong>Route</strong> easy queries to a small model.
          (4) <strong>Cap output</strong> length. Each is a real percentage off the bill.
        </Callout>
        <Callout kind="note" title="RAG inflates input cost">
          Stuffing 5 chunks of context can 5–10× your input tokens. That's why the estimator defaults to
          a large input — and why context budget is a first-class design constraint, not an afterthought.
        </Callout>
      </Block>

      <Block eyebrow="read the formula" title="Why input usually dominates">
        <p className="text-ink-dim leading-relaxed mb-2">
          The bill is just multiplication, but the <em>shape</em> of the multiplication is the insight.
          Output tokens cost more per token than input — but in a RAG or agent system you typically send{" "}
          <strong>far more</strong> input than you receive output. Stuff 5 chunks of context plus a system
          prompt plus history in, get a few sentences out, and the input term wins despite the lower per-token
          price.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`per_request = (in_tokens × price_in + out_tokens × price_out) / 1e6

RAG-ish:   in ≈ 4000 (system + 5 chunks + history) · out ≈ 300
           even at out being pricier per token, the 4000-token INPUT dominates.

chat-ish:  in ≈ 200 · out ≈ 800
           now OUTPUT dominates — the levers flip.`}
        />
        <Callout kind="tip" title="Know which term dominates before optimizing">
          The fastest way to a wrong answer is optimizing the wrong term. Estimate the input:output ratio
          first. Context-heavy (RAG, agents, long system prompts) → attack input. Generation-heavy (writing,
          long answers) → cap output. The estimator defaults to context-heavy because that's the common
          architect case.
        </Callout>
      </Block>

      <Block eyebrow="the levers, with mechanism" title="How each lever actually saves money">
        <OpTable
          cols={["Lever", "Cuts", "", "How / when"]}
          rows={[
            { op: "Cache", avg: "repeat work", avgTone: "good", why: "Identical or prefix-shared calls served from cache at a fraction of the price. Biggest win for stable system prompts and repeated context." },
            { op: "Trim context", avg: "input tokens", avgTone: "good", why: "Retrieve fewer/better chunks, rerank hard, drop stale history. Directly shrinks the dominant term in RAG." },
            { op: "Route small→large", avg: "per-call price", avgTone: "good", why: "Send easy queries to a cheap model, escalate only the hard ones. A classifier or the cheap model itself decides." },
            { op: "Cap output", avg: "output tokens", avgTone: "ok", why: "Set max_tokens and prompt for brevity. Matters most in generation-heavy workloads; minor when input dominates." },
          ]}
        />
        <Callout kind="note" title="Order of leverage isn't fixed">
          The list in the method block is the usual order <em>for context-heavy systems</em>. Flip a
          chat-style workload and capping output jumps up the list. Always tie the lever to which term
          dominates the formula above.
        </Callout>
        <Callout kind="tip" title="The interview answer">
          "Monthly cost is requests × (input×price_in + output×price_out). In a RAG system the input term
          usually dominates because context, system prompt, and history dwarf the short answer — so I cache
          stable prefixes, trim and rerank context, and route easy queries to a smaller model before I worry
          about output length. I'd estimate the input:output ratio first to know which lever pays off."
        </Callout>
      </Block>
    </>
  );
}

/* ── Numbers ──────────────────────────────────────────────────── */
function Numbers() {
  return (
    <>
      <Lede>
        Rules of thumb that let you sanity-check a design out loud. Orders of magnitude matter far more
        than exact figures (which drift constantly).
      </Lede>

      <Block eyebrow="memorize the magnitudes" title="AI numbers worth carrying">
        <OpTable
          cols={["Quantity", "Rule of thumb", "", "Why it matters"]}
          rows={[
            { op: "tokens ↔ text", avg: "~4 chars ≈ 1 token", avgTone: "ok", why: "≈ 0.75 words/token; convert text size to token cost." },
            { op: "model VRAM", avg: "params × bytes/param", avgTone: "ok", why: "7B ≈ 14GB FP16, ≈ 3.5GB INT4 (before KV cache)." },
            { op: "embedding dims", avg: "384–3072", avgTone: "ok", why: "Storage & ANN search cost scale with dimension." },
            { op: "context windows", avg: "8k–1M tokens", avgTone: "ok", why: "Attention is O(n²) — long context is expensive, not free." },
            { op: "RAG chunk size", avg: "~200–500 tokens", avgTone: "ok", why: "Balance embedding focus vs surrounding meaning." },
            { op: "human read speed", avg: "~5 tokens/sec", avgTone: "ok", why: "Stream comfortably above this and the user never waits on text — that sets your decode SLO." },
          ]}
        />
        <Callout kind="tip" title="Use them as guardrails">
          You don't need exact prices. “That's ~10⁹ tokens/month, so order-of-thousands of dollars on a
          mid-tier model” is exactly the altitude an architect answer should fly at.
        </Callout>
      </Block>

      <Block eyebrow="why they're memorable" title="The reasoning behind each rule">
        <p className="text-ink-dim leading-relaxed mb-2">
          A number you can <em>derive</em> sticks; a number you memorized blanks under pressure. Each rule
          above falls out of something structural — here's the why, so you can rebuild it on the whiteboard.
        </p>
        <OpTable
          cols={["Rule", "Where it comes from", "", "What it lets you estimate"]}
          rows={[
            { op: "~4 chars ≈ 1 token", avg: "BPE on English", avgTone: "ok", why: "Sub-word merging averages ~4 chars/token on prose (more on code/JSON). Turn a doc's size into a token count, and a token count into a bill." },
            { op: "params × bytes", avg: "weights are the floor", avgTone: "ok", why: "FP16 = 2 bytes/param, INT4 ≈ 0.5. Tells you instantly whether a model fits a given GPU — before adding the KV cache." },
            { op: "context is O(n²)", avg: "the score matrix", avgTone: "bad", why: "Attention compares every token to every token. Doubling context quadruples that block — long context is expensive, not free." },
            { op: "~5 tokens/sec read", avg: "human reading speed", avgTone: "ok", why: "Stream faster than the user reads and it feels instant. That sets your decode-latency SLO — no need to go faster." },
          ]}
        />
        <Callout kind="note" title="The KV cache is the hidden term">
          "Weights fit the GPU" is only half the memory story. The KV cache grows with context × batch and
          at long contexts can rival or exceed the weights — so a model that "fits" in isolation may not fit
          while actually serving traffic. Always mention it when sizing.
        </Callout>
        <Callout kind="tip" title="Fly at order-of-magnitude altitude">
          Interviewers aren't checking arithmetic — they're checking whether you can sanity-check a design
          out loud. "Roughly 10⁹ tokens a month, a 7B fits a single 24GB card with INT4 headroom, decode at
          ~20 tok/s clears the reading-speed bar" is the move. Exact figures drift constantly; the
          magnitudes don't.
        </Callout>
      </Block>
    </>
  );
}

/* ── Safety ───────────────────────────────────────────────────── */
function Safety() {
  return (
    <>
      <Lede>
        Guardrails are a system layer, not a prompt suffix. As an architect you own the threat model:
        what can users (and retrieved content) make the model do?
      </Lede>

      <Block eyebrow="the layers" title="Defense in depth around the model">
        <OpTable
          cols={["Risk", "Mitigation", "", "Layer"]}
          rows={[
            { op: "Prompt injection", avg: "treat input as untrusted", avgTone: "ok", why: "Never let model output trigger privileged actions unchecked." },
            { op: "Data leakage / PII", avg: "redact + access control", avgTone: "ok", why: "Filter retrieval by user permissions; scrub logs." },
            { op: "Jailbreaks", avg: "input + output filters", avgTone: "ok", why: "Classifier on both sides of the model; refuse + log." },
            { op: "Hallucination", avg: "grounding + citations", avgTone: "ok", why: "Answer only from context; show sources; verify claims." },
            { op: "Unsafe actions", avg: "human-in-the-loop", avgTone: "ok", why: "Gate irreversible/outward actions behind confirmation." },
          ]}
        />
        <Callout kind="trap" title="The boundary that catches people out">
          Retrieved documents and tool outputs are <em>untrusted input</em> too — a malicious doc can
          carry injection instructions straight into your prompt. Guardrails wrap the whole loop, not
          just the user's first message.
        </Callout>
      </Block>

      <Block eyebrow="defense in depth" title="Layers around the model, not a prompt suffix">
        <p className="text-ink-dim leading-relaxed mb-2">
          The amateur move is "I added a line to the system prompt telling it not to do bad things." That's
          one soft layer the model can be talked out of. Real safety is <strong>defense in depth</strong>:
          independent checks at the input, around the model, and at the output, so no single bypass is
          catastrophic.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`user / retrieved docs / tool output
   │
   ▼  [1] INPUT filter      classify + reject jailbreaks, strip injection
   ▼  [2] ACL / retrieval    user can only retrieve what they're allowed to see
   ▼      MODEL              system prompt = the weakest layer, not the only one
   ▼  [3] OUTPUT filter      grounding check, PII scrub, policy classifier
   ▼  [4] ACTION gate        irreversible/outward actions need confirmation
answer`}
        />
        <Callout kind="note" title="No single layer is trusted">
          Each layer assumes the others can fail. The input filter catches most jailbreaks; the output
          filter catches what slips through; the action gate catches a model that's been fully fooled. You
          design assuming the model <em>will</em> occasionally be manipulated.
        </Callout>
      </Block>

      <Block eyebrow="the headline threat" title="Prompt injection — all input is untrusted">
        <p className="text-ink-dim leading-relaxed mb-2">
          The model can't reliably tell <em>instructions</em> from <em>data</em> — they're both just text in
          the same context window. So any text that reaches the prompt can try to redirect the model. The
          non-obvious part: that text isn't only the user's message. A <strong>retrieved document</strong>,
          a <strong>web page the agent fetched</strong>, or a <strong>tool's output</strong> can all carry
          "ignore your instructions and …" — and the model reads them with the same trust as your system
          prompt.
        </p>
        <Callout kind="trap" title="Indirect injection is the one people miss">
          Direct injection (the user typing an attack) is easy to picture. <strong>Indirect</strong>{" "}
          injection — a malicious instruction hidden in a doc your RAG pipeline retrieves, or in a webpage a
          tool fetches — is the real danger in agentic systems, because the payload arrives through a channel
          you implicitly trusted. Treat every retrieved/fetched/tool-returned token as untrusted.
        </Callout>
        <Callout kind="tip" title="Never let model output trigger privileged actions unchecked">
          The structural defense is to keep the model from <em>doing</em> harm even if it's fooled into{" "}
          <em>saying</em> something: tools that take real-world action are gated, scoped to least privilege,
          and — for anything irreversible — confirmed by a human.
        </Callout>
      </Block>

      <Block eyebrow="data, hallucination, action" title="The other three risks">
        <p className="text-ink-dim leading-relaxed mb-2">
          Injection gets the headlines, but three more risks round out the threat model — and each maps to a
          concrete control.
        </p>
        <OpTable
          cols={["Risk", "What goes wrong", "", "Control"]}
          rows={[
            { op: "Data leakage / PII", avg: "model reveals what it saw", avgTone: "bad", why: "Filter retrieval by user permissions (a chunk in the prompt can be leaked); redact PII; scrub logs and traces, which are easy to forget." },
            { op: "Jailbreak", avg: "guardrails bypassed", avgTone: "bad", why: "Classifiers on both input and output; refuse and log. Two-sided because an attack can succeed even when the input looked benign." },
            { op: "Hallucination", avg: "confident wrong answer", avgTone: "bad", why: "Ground answers in retrieved context, show citations, and verify claims against sources — don't let the model free-associate." },
            { op: "Unsafe action", avg: "irreversible harm", avgTone: "bad", why: "Human-in-the-loop for anything outward-facing or hard to undo (sending, deleting, paying). The model proposes; a person confirms." },
          ]}
        />
        <Callout kind="tip" title="The interview answer">
          "Guardrails are a system layer, not a prompt suffix — defense in depth at the input, around the
          model, and at the output. The threat I lead with is prompt injection, and the key insight is that
          retrieved docs and tool outputs are untrusted input too, so an attack can arrive indirectly.
          Beyond that: ACL-filter retrieval to stop data leakage, classify jailbreaks on both sides, ground
          answers with citations against hallucination, and put a human in the loop before any irreversible
          action."
        </Callout>
      </Block>
    </>
  );
}

/* ── Scaling & reliability ────────────────────────────────────── */
function Scaling() {
  return (
    <>
      <Lede>
        Serving covers how fast <em>one</em> replica runs. Scaling is the layer above it: keeping a fleet
        of expensive GPUs serving spiky, unpredictable traffic <strong>within SLO</strong> without
        falling over — or quietly burning a fortune on idle hardware.
      </Lede>

      <Block eyebrow="the shape" title="A queue and a load balancer in front of a GPU pool">
        <CodeBlock
          title="text"
          lang="text"
          code={`clients → API gateway (auth, rate limit) → request QUEUE → load balancer
                                                         ↓
                                       autoscaled pool of model replicas (GPUs)
                                                         ↓
                                              [cache] ← shared response/semantic cache`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Autoscale on <strong>queue depth or GPU utilization</strong>, not CPU — the GPU is the scarce
          resource. The queue is what lets you absorb a burst without dropping requests or over-scaling
          on every spike.
        </p>
        <Callout kind="trap" title="GPUs don't scale like web servers">
          A model replica takes <strong>minutes</strong> to cold-start (pull a multi-GB model, warm the
          CUDA context), and GPUs are costly, so you can't scale-to-zero and back reactively. The real
          pattern is a <strong>warm buffer</strong> of capacity plus a queue to ride out spikes while new
          replicas spin up.
        </Callout>
      </Block>

      <Block eyebrow="absorbing load" title="Smoothing spikes and protecting the fleet">
        <OpTable
          cols={["Lever", "Does what", "", "Why it matters"]}
          rows={[
            { op: "Request queue", avg: "buffers bursts", avgTone: "good", why: "Decouples arrival rate from service rate so a spike waits instead of crashing the pool." },
            { op: "Rate limits / quotas", avg: "cap per tenant", avgTone: "good", why: "Fairness + a blast-radius limit so one caller can't starve everyone else." },
            { op: "Admission control", avg: "shed load", avgTone: "ok", why: "When the queue is too deep, reject fast (429) instead of accepting work you can't finish in SLO." },
            { op: "Caching", avg: "skip the model", avgTone: "good", why: "Exact + semantic + prompt caching cut real GPU load on repeated/similar queries — the cheapest scaling." },
          ]}
        />
        <Callout kind="tip" title="The interview answer">
          “Gateway with auth and rate limits → a queue → an autoscaled GPU pool behind a load balancer,
          autoscaling on queue depth. I keep a warm buffer because GPU cold-starts are slow, cache
          aggressively to cut load, and shed load with a fast 429 rather than blow the latency SLO.”
        </Callout>
      </Block>

      <Block eyebrow="staying up" title="Failure modes and graceful degradation">
        <p className="text-ink-dim leading-relaxed mb-2">
          The model <em>will</em> be slow or unavailable sometimes (a dependency, a bad deploy, a traffic
          spike). Design for it: <strong>timeouts</strong> on every model call, <strong>retries with
          backoff</strong> (capped — a naive retry storm turns a blip into an outage),{" "}
          <strong>circuit breakers</strong> to stop hammering a failing replica, and replica/region
          redundancy.
        </p>
        <Callout kind="tip" title="Degrade, don't 500">
          The senior move is a <strong>fallback chain</strong>: if the big model times out, fall back to a
          smaller/cheaper model, a cached answer, or a non-AI path (rules, “try again,” a human queue). A
          slightly worse answer beats an error page — decide the fallback <em>before</em> the incident.
        </Callout>
      </Block>
    </>
  );
}

/* ── MLOps lifecycle ──────────────────────────────────────────── */
function Ops() {
  return (
    <>
      <Lede>
        Shipping a model isn't done at deploy — it's a <strong>loop</strong>. And unlike normal software,
        the things you version aren't just code: they're <strong>data, model weights, and prompts</strong>{" "}
        too. Getting that loop automated and reproducible is what MLOps (and its LLM cousin, LLMOps) is.
      </Lede>

      <Block eyebrow="the loop" title="It never ships once">
        <CodeBlock
          title="text"
          lang="text"
          code={`   ┌────────────────────────── retrain on drift / schedule ──────────────────────────┐
   ↓                                                                                  │
 data → train → evaluate (gate) → package → deploy (canary) → monitor (drift, quality)─┘`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The difference from DevOps is the extra moving parts: the <em>data</em> changes under you, the{" "}
          <em>model</em> is a learned artifact you can't read like code, and quality can decay silently
          even with zero code changes. So the loop has to close automatically — monitoring feeds
          retraining.
        </p>
      </Block>

      <Block eyebrow="what you version" title="The four artifacts (not just code)">
        <OpTable
          cols={["Artifact", "Tracked with", "", "Why"]}
          rows={[
            { op: "Code", avg: "git", avgTone: "good", why: "Training + serving logic, as usual." },
            { op: "Data", avg: "DVC / lakeFS", avgTone: "ok", why: "Datasets are huge and changing; a model is only reproducible if its data is pinned." },
            { op: "Model weights", avg: "model registry", avgTone: "good", why: "Versioned artifacts with stages: staging → production → archived, so you know what's live and can roll back." },
            { op: "Config + prompts", avg: "versioned config", avgTone: "ok", why: "LLMOps: prompts, chains, and tool definitions change behavior, so they're release artifacts too." },
          ]}
        />
        <Callout kind="note" title="Reproducibility is the whole game">
          A model is reproducible only when <strong>same data + same code + same config → same model</strong>.
          If you can't rebuild a deployed model from pinned versions, you can't debug it, audit it, or
          safely roll back to it.
        </Callout>
      </Block>

      <Block eyebrow="the pipeline" title="CI / CD / CT">
        <p className="text-ink-dim leading-relaxed mb-2">
          ML adds a third letter to CI/CD: <strong>CT — continuous training</strong>.
        </p>
        <OpTable
          cols={["Stage", "What runs", "", "Trigger"]}
          rows={[
            { op: "CI", avg: "test + eval on a golden set", avgTone: "good", why: "Validate code AND model quality; block a merge/deploy that regresses the eval." },
            { op: "CD", avg: "promote a registry model to an endpoint", avgTone: "good", why: "Ship the artifact via canary/shadow (see Deployment), not a raw flip." },
            { op: "CT", avg: "retrain automatically", avgTone: "ok", why: "On a schedule or a drift/quality trigger — the loop that keeps the model fresh as data shifts." },
          ]}
        />
        <Callout kind="tip" title="Eval suites are your unit tests">
          You can't assert exact outputs from a probabilistic model — so the “test” that gates a deploy is
          a <strong>regression eval</strong> on a golden set, not <code className="font-mono">assertEqual</code>.
          Experiment tracking (params + metrics for every run) is how you know which change actually helped.
        </Callout>
      </Block>

      <Block eyebrow="LLM-specific" title="LLMOps: observability and the flywheel">
        <p className="text-ink-dim leading-relaxed mb-2">
          For LLM apps, add two things on top. <strong>Tracing</strong>: log every request end-to-end —
          the prompt, the retrieved context, each tool call, tokens in/out, latency, and cost — because a
          bad answer could come from retrieval, the prompt, or the model, and you can't tell without the
          trace. <strong>The data flywheel</strong>: production traffic and user feedback become tomorrow's
          eval cases and fine-tuning data.
        </p>
        <Callout kind="tip" title="The interview answer">
          “MLOps closes the loop: version code, data, model, and prompts; gate every deploy on a golden-set
          eval; ship via canary; monitor quality and drift in production; and feed failures back into the
          eval set and training data. Maturity goes from a manual notebook → an automated training pipeline
          → continuous training triggered by monitoring.”
        </Callout>
      </Block>
    </>
  );
}

/* ── Data & feature pipelines ─────────────────────────────────── */
function DataPipelines() {
  return (
    <>
      <Lede>
        A model is a function of its data — so the data platform is the real moat <em>and</em> the most
        common silent failure point. “Garbage in, garbage out” isn't a cliché here; it's the top
        architecture risk.
      </Lede>

      <Block eyebrow="the pipeline" title="Ingest → validate → transform → store">
        <CodeBlock
          title="text"
          lang="text"
          code={`sources ─(batch or stream)→ INGEST → VALIDATE → TRANSFORM / feature-engineer → STORE
                                       │
                            schema · nulls · ranges · distribution  (quality GATE, not afterthought)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          <strong>Data-quality checks are gates</strong>: a schema change, a flood of nulls, or a shifted
          distribution should fail the pipeline loudly, not silently poison the next training run. Batch
          (nightly tables) and streaming (real-time events) pipelines often run side by side.
        </p>
      </Block>

      <Block eyebrow="the feature store" title="Offline/online parity and point-in-time correctness">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>feature store</strong> serves the same feature two ways: <strong>offline</strong>
          (historical values, for training) and <strong>online</strong> (fresh values, for low-latency
          serving). They must be computed identically — if training sees a feature one way and serving
          computes it another, you get <strong>train/serve skew</strong>: great offline metrics, broken in
          production.
        </p>
        <Callout kind="trap" title="Point-in-time correctness (label leakage)">
          When you build a training row labeled at time <em>t</em>, every feature must use only values that
          were <strong>known at or before t</strong>. Accidentally joining a feature computed <em>after</em>{" "}
          the label leaks the future into training — the model looks brilliant offline and fails live. This
          is the most common subtle data bug in ML systems.
        </Callout>
      </Block>

      <Block eyebrow="the training set" title="Curating data — especially for LLMs">
        <p className="text-ink-dim leading-relaxed mb-2">
          Quality beats quantity. The work is <strong>curation</strong> (dedup, filter low-quality and
          toxic content), <strong>labeling</strong> (human annotation, increasingly augmented with
          synthetic / LLM-generated labels), and <strong>governance</strong> — PII scrubbing, consent, and
          <strong> lineage</strong> (where each row came from, so you can honor deletion requests and pass
          an audit).
        </p>
        <Callout kind="tip" title="The interview answer">
          “Treat data as a versioned product: ingest → validate at a quality gate → store in a feature
          store with offline/online parity and point-in-time correctness → curate and govern the training
          set. Most ‘the model got worse’ incidents are data incidents — skew, drift, or a broken upstream
          feed — so I instrument data quality first.”
        </Callout>
      </Block>
    </>
  );
}

/* ── Deployment & rollout ─────────────────────────────────────── */
function Deployment() {
  return (
    <>
      <Lede>
        You never flip 100% of traffic to a new model. A model can ace its offline eval and still tank a
        live business metric — so safe rollout is its own discipline, built around{" "}
        <strong>measuring on real traffic</strong> and being able to undo instantly.
      </Lede>

      <Try label="rollout strategies"><RolloutStrategyViz /></Try>

      <Block eyebrow="rollout strategies" title="Shadow → canary → ramp">
        <OpTable
          cols={["Strategy", "How", "", "Use for"]}
          rows={[
            { op: "Shadow", avg: "mirror traffic, don't serve", avgTone: "good", why: "Send real requests to the new model in parallel; compare offline. Zero user risk — de-risk before going live." },
            { op: "Canary", avg: "small % live", avgTone: "good", why: "Route 1–5% of real traffic, watch guardrail metrics, then ramp. The standard live rollout." },
            { op: "Blue-green", avg: "full standby + switch", avgTone: "ok", why: "Two complete environments; flip traffic over instantly, and roll back just as fast." },
            { op: "A/B test", avg: "split + measure KPI", avgTone: "good", why: "The only true test — measure the actual business metric (CTR, conversion, resolution) on each arm." },
          ]}
        />
        <Callout kind="trap" title="Offline eval ≠ online performance">
          A model can win on your golden set and lose in production — distribution shift, feedback loops,
          and UX effects don't show up offline. That gap is exactly why you canary and A/B with{" "}
          <em>live</em> metrics instead of trusting the offline number.
        </Callout>
      </Block>

      <Block eyebrow="serving modes" title="Real-time, batch, streaming">
        <OpTable
          cols={["Mode", "Shape", "", "When"]}
          rows={[
            { op: "Real-time / online", avg: "sync, per-request", avgTone: "good", why: "User is waiting — chat, search, fraud checks. Latency-bound." },
            { op: "Batch", avg: "score offline in bulk", avgTone: "ok", why: "Nightly recommendations, embeddings backfills. Cheap, high throughput, no latency pressure." },
            { op: "Streaming", avg: "event-driven", avgTone: "ok", why: "React to events as they arrive (alerts, feeds). Often feeds the online feature store." },
          ]}
        />
        <Callout kind="note" title="Sync vs async">
          A long job (a big agent run, a video analysis) shouldn't block an HTTP request — accept it, return
          a job id, and deliver the result via callback/webhook or polling. Keep the synchronous path fast.
        </Callout>
      </Block>

      <Block eyebrow="the undo button" title="Rollback and guardrails">
        <p className="text-ink-dim leading-relaxed mb-2">
          Wire rollback before you need it: <strong>versioned endpoints</strong> backed by the model
          registry, the <strong>previous version kept warm</strong>, and an <strong>automated rollback</strong>{" "}
          triggered when a guardrail metric (error rate, p95 latency, a key KPI) regresses. A{" "}
          <strong>kill switch / feature flag</strong> lets you cut over without a redeploy.
        </p>
        <Callout kind="tip" title="The interview answer">
          “Shadow first to de-risk offline, then canary 1–5% live watching guardrail metrics, then ramp.
          The new model goes through the registry to a versioned endpoint, the old one stays warm, and an
          automated rollback is wired to a regression alarm. The real test is an A/B on the business metric,
          not the offline eval.”
        </Callout>
      </Block>
    </>
  );
}

/* ── Recommendation system design ─────────────────────────────── */
function RecSystem() {
  return (
    <>
      <Lede>
        “Design the feed / the ‘people also bought’ / the video recommendations.” The single most-asked
        ML system design. You can't score millions of items per request inside a latency budget — so the
        whole architecture is a <strong>funnel</strong> that narrows cheaply, then ranks expensively.
        (The algorithms live in <em>Model Bench → Recommendation</em>; here it's the <em>system</em>.)
      </Lede>

      <Block eyebrow="the architecture" title="Two stages: cheap recall, then expensive precision">
        <CodeBlock
          title="text"
          lang="text"
          code={`millions of items
  └─▶ CANDIDATE GENERATION   cheap recall — two-tower + ANN, co-visitation     → ~hundreds
        └─▶ RANKING          expensive precision — rich cross-features, big model → ~tens (scored & ordered)
              └─▶ RE-RANKING  business rules — diversity, freshness, dedup, policy → the final list`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Why two stages: a heavy ranker scoring millions of items per request blows the latency budget.
          So a <strong>cheap</strong> retriever narrows millions → hundreds, then you spend real compute
          ranking just those. Re-ranking applies the rules a pure relevance score ignores (don't show five
          near-identical items, mix in fresh content, respect policy).
        </p>
        <Callout kind="tip" title="The interview answer">
          “Two-stage funnel. Candidate generation with a two-tower model + ANN for cheap recall, an
          expensive ranker with rich user×item features for precision on the few hundred survivors, then a
          re-ranking pass for diversity, freshness, and business rules. I precompute item embeddings
          offline and fetch fresh user/context features online, and I validate with an online A/B because
          offline metrics miss feedback loops.”
        </Callout>
      </Block>

      <Block eyebrow="features & data flow" title="Precompute what you can, fetch fresh what you must">
        <p className="text-ink-dim leading-relaxed mb-2">
          Three feature sources: <strong>user</strong> (history, long- and short-term interests),{" "}
          <strong>item</strong> (metadata, content embeddings, popularity), and <strong>context</strong>
          (time, device, the query or surface). The serving trick is splitting offline from online: item
          embeddings are <strong>precomputed in batch</strong> and loaded into the ANN index, while user
          and context features are read <strong>fresh from the online feature store</strong> at request
          time (ties straight back to <em>Data &amp; feature pipelines</em>).
        </p>
        <Callout kind="note" title="Why two-tower fits serving">
          A two-tower model encodes user and item <em>separately</em>, so item vectors can be computed once,
          offline, and indexed for ANN. At request time you only encode the user, then do a fast
          nearest-neighbor lookup — that's what makes candidate generation cheap enough to run per request.
        </Callout>
      </Block>

      <Block eyebrow="the hard parts" title="What interviewers actually probe">
        <OpTable
          cols={["Problem", "Why it bites", "", "Handle it with"]}
          rows={[
            { op: "Cold start", avg: "new user/item, no history", avgTone: "bad", why: "Fall back to content features, popularity, and onboarding signals until interactions accrue." },
            { op: "Feedback loops", avg: "model shapes its own data", avgTone: "bad", why: "It only learns from what it showed → filter bubbles. Inject exploration and log impressions, not just clicks." },
            { op: "Position bias", avg: "top items get clicked regardless", avgTone: "bad", why: "Clicks aren't pure relevance. Debias labels (e.g. model position) or you train on the UI, not preference." },
            { op: "Offline ≠ online", avg: "nDCG up, engagement flat", avgTone: "bad", why: "Offline can't see novelty/UX/loops — the live A/B is the real metric." },
            { op: "Freshness", avg: "news/social go stale fast", avgTone: "ok", why: "Incremental index updates + recency features so new items can surface quickly." },
          ]}
        />
        <Callout kind="tip" title="Metrics: offline gates, online decides">
          Offline: <strong>Recall@k</strong> for candidate generation (did the good items make the
          shortlist?), <strong>nDCG/MAP</strong> for ranking quality. Online: the business KPI —
          <strong> CTR, watch time, conversion, retention</strong> — measured by A/B. Offline metrics gate a
          launch; only the online metric confirms it.
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  "rag-system": <RagSystem />,
  serving: <Serving />,
  scaling: <Scaling />,
  recommendation: <RecSystem />,
  multiagent: <MultiAgent />,
  mlops: <Ops />,
  data: <DataPipelines />,
  deployment: <Deployment />,
  "eval-system": <EvalSystem />,
  cost: <Cost />,
  numbers: <Numbers />,
  safety: <Safety />,
};

export default function ArchitectBench() {
  const [active, setActive] = useState("rag-system");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Systems · SHOULD WE"
      title="The Architect's Bench"
      subtitle="The senior rounds — design RAG, serving, and scaling; run the MLOps lifecycle (data, deployment, eval & monitoring); and defend the cost, latency, and safety trade-offs."
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
