import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import RagPipelineViz from "./model/RagPipelineViz.jsx";
import AgentLoopViz from "./model/AgentLoopViz.jsx";
import EvalPatternsViz from "./model/EvalPatternsViz.jsx";
import QuantizationViz from "./model/QuantizationViz.jsx";
import FineTuneViz from "./model/FineTuneViz.jsx";
import PromptPatternsViz from "./model/PromptPatternsViz.jsx";

const ACCENT = "#00b4d8";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "rag", label: "RAG", group: "LLM patterns" },
  { id: "agents", label: "Agents & tool use", group: "LLM patterns" },
  { id: "finetune", label: "Fine-tuning & LoRA", group: "LLM patterns" },
  { id: "prompt", label: "Prompt patterns", group: "LLM patterns" },
  { id: "evals", label: "Evaluation", group: "LLM patterns" },
  { id: "compress", label: "Quantization & distillation", group: "Efficiency" },
  { id: "classic", label: "Classic ML families", group: "Foundations" },
  { id: "recsys", label: "Recommendation", group: "Foundations" },
];

/* ── RAG ──────────────────────────────────────────────────────── */
function Rag() {
  return (
    <>
      <Lede>
        Retrieval-Augmented Generation is the default way to ground an LLM in private or fresh data:
        retrieve relevant chunks, stuff them into the prompt, and let the model answer{" "}
        <em>from the context</em> instead of its memory. It's cheaper and faster to ship than
        fine-tuning, and it's the most-asked architect pattern.
      </Lede>

      <Try label="RAG pipeline"><RagPipelineViz /></Try>

      <Block eyebrow="the pipeline" title="Ingest once, retrieve per query">
        <CodeBlock
          title="text"
          lang="text"
          code={`INGEST (offline):  docs → chunk → embed → store in vector DB
QUERY  (online):   q → embed → ANN search top-k → [rerank] → prompt → LLM → answer`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The quality levers, roughly in order of how often they're the bottleneck:{" "}
          <strong>chunking</strong> (size/overlap/structure), the <strong>embedding model</strong>, a{" "}
          <strong>reranker</strong> to fix the recall-vs-precision gap, and only then the generator.
          Most “the LLM is dumb” bugs are actually retrieval bugs.
        </p>
        <Callout kind="tip" title="Always cite & ground">
          Instruct the model to answer only from context and return source IDs. It makes hallucination
          visible and gives users something to click — table stakes for enterprise.
        </Callout>
        <Callout kind="trap" title="Chunking is where RAG lives or dies">
          Too-big chunks dilute the embedding and waste context; too-small chunks lose the surrounding
          meaning. Respect document structure (headings, tables) instead of blind fixed-size splits.
        </Callout>
      </Block>

      <Block eyebrow="ingest path" title="Load → clean → chunk → embed → index">
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>ingest path</strong> runs offline, once per document (or whenever a doc changes).
          You <strong>load</strong> the raw source (PDF, HTML, Confluence), <strong>clean</strong> it
          (strip boilerplate, fix encoding, pull out tables), <strong>chunk</strong> it into passages,
          <strong> embed</strong> each chunk into a vector, and <strong>index</strong> those vectors so
          they're searchable. The <strong>query path</strong> is the mirror image at request time: embed
          the question with the <em>same</em> model, search the index, assemble context, and generate.
        </p>
        <Callout kind="trap" title="The embedding model must match on both paths">
          Query and documents have to be embedded by the same model into the same space — mix two models
          and cosine similarity is meaningless. Re-embedding the whole corpus is the real cost of
          switching embedding models later, so choose deliberately up front.
        </Callout>
      </Block>

      <Block eyebrow="chunking" title="Why chunking dominates quality">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>chunk</strong> is the unit you embed and retrieve — so it's also the unit of meaning
          the model sees. Get it wrong and nothing downstream can recover. The usual strategies, in rough
          order of sophistication:
        </p>
        <OpTable
          cols={["Strategy", "How", "", "Trade-off"]}
          rows={[
            { op: "Fixed-size", avg: "N tokens + overlap", avgTone: "ok", why: "Simple and fast; overlap (e.g. 10–20%) keeps a fact from being split across a boundary. Ignores structure." },
            { op: "Structure-aware", avg: "split on headings", avgTone: "good", why: "Chunk on Markdown headings / sections so each chunk is one coherent idea. Usually the best default." },
            { op: "Semantic", avg: "split on topic shift", avgTone: "good", why: "Break where embedding similarity drops. Higher quality, more compute at ingest." },
            { op: "Parent–child", avg: "embed small, return big", avgTone: "good", why: "Retrieve on a tight sentence-level chunk but feed the LLM the larger parent for context." },
          ]}
        />
        <Callout kind="note" title="Why it dominates">
          Retrieval can only return chunks that exist. If the answer spans two chunks, or a chunk mixes
          three unrelated facts, no embedding model or reranker can fix that — the information was lost at
          ingest. This is why chunking is the lever people tune first.
        </Callout>
      </Block>

      <Block eyebrow="the index" title="Vector DB + approximate nearest neighbors">
        <p className="text-ink-dim leading-relaxed mb-2">
          Comparing a query against millions of vectors one-by-one (exact / brute-force search) is
          O(n) per query — too slow at scale. A <strong>vector database</strong> instead builds an{" "}
          <strong>approximate-nearest-neighbor (ANN)</strong> index that trades a tiny bit of recall for
          <em> sub-linear</em> search. The two families you should be able to name:
        </p>
        <OpTable
          cols={["Index", "Idea", "", "Profile"]}
          rows={[
            { op: "HNSW", avg: "navigable graph", avgTone: "good", why: "A multi-layer proximity graph you greedily walk. Fast, high recall, memory-hungry. The common default." },
            { op: "IVF", avg: "cluster + probe", avgTone: "good", why: "Partition vectors into clusters; search only the nearest few. Lower memory, tune nprobe for recall vs speed." },
          ]}
        />
        <Callout kind="tip" title="Hybrid retrieval beats either alone">
          Dense (vector) search captures meaning but misses exact tokens — product codes, names, rare
          jargon. <strong>Keyword search</strong> (BM25 / sparse) nails those but misses paraphrase. Run
          both and fuse the rankings (e.g. reciprocal rank fusion); this <strong>hybrid</strong> retrieval
          is the production default.
        </Callout>
      </Block>

      <Block eyebrow="precision" title="Reranking and context assembly">
        <p className="text-ink-dim leading-relaxed mb-2">
          ANN search optimizes <strong>recall</strong> — get the right chunk somewhere in the top-k. A{" "}
          <strong>cross-encoder reranker</strong> then optimizes <strong>precision</strong>: it reads the
          query and each candidate chunk <em>together</em> and scores true relevance, reordering the top-k
          so the best few land at the top. It's slower per pair (no precomputed vectors), so you only run
          it on the handful of candidates retrieval already surfaced.
        </p>
        <Callout kind="trap" title="Lost in the middle">
          LLMs attend most to the start and end of a long context and can skim what's in the{" "}
          <strong>middle</strong>. After reranking, put the strongest chunks at the <em>edges</em> of the
          context, keep the count tight, and always attach source IDs so the answer is grounded and
          citable.
        </Callout>
      </Block>

      <Block eyebrow="when & how good" title="Failure modes, the alternatives, and eval">
        <p className="text-ink-dim leading-relaxed mb-2">
          Common production failures: a <strong>stale index</strong> (docs changed, vectors didn't),{" "}
          <strong>missing access control</strong> (retrieval returns chunks a user shouldn't see — apply
          permission filters <em>during</em> search, not after), and the lost-in-the-middle effect above.
        </p>
        <OpTable
          cols={["Approach", "Best when", "", "Why"]}
          rows={[
            { op: "RAG", avg: "fresh / private facts", avgTone: "good", why: "Knowledge changes or is too large to fit; you want citations and instant updates." },
            { op: "Long context", avg: "small, bounded corpus", avgTone: "ok", why: "Just paste the docs. Simple, but costs scale with every token and ignores lost-in-the-middle." },
            { op: "Fine-tuning", avg: "new behavior/format", avgTone: "ok", why: "Bakes in style or skill, not facts. Frozen at ship; pairs with RAG for knowledge." },
          ]}
        />
        <Callout kind="tip" title="The interview answer">
          “RAG has two paths: an offline ingest path — load, clean, chunk, embed, index — and an online
          query path that embeds the question, does hybrid ANN search, reranks for precision, and feeds
          cited chunks to the model. I'd evaluate <strong>retrieval</strong> with recall@k and{" "}
          <strong>generation</strong> with faithfulness/groundedness, because most ‘the LLM is wrong’ bugs
          are actually retrieval bugs.”
        </Callout>
      </Block>
    </>
  );
}

/* ── Agents ───────────────────────────────────────────────────── */
function Agents() {
  return (
    <>
      <Lede>
        An agent is an LLM in a loop with <strong>tools</strong>: it reasons, calls a tool, observes
        the result, and repeats until done. The power is open-ended task completion; the danger is
        cost, latency, and loops that never terminate.
      </Lede>

      <Try label="agentic loop"><AgentLoopViz /></Try>

      <Block eyebrow="the loop" title="Reason → Act → Observe (ReAct)">
        <CodeBlock
          title="text"
          lang="text"
          code={`while not done and steps < MAX:
    thought = llm(history)              # plan the next move
    if thought.is_final: return answer
    result = call_tool(thought.action)  # search / db / code / API
    history += (thought, result)        # observe, then loop`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Tools are exposed as typed function schemas; the model emits a structured call, your runtime
          executes it, and the result re-enters the context. Multi-agent systems split this across
          specialized roles (planner, researcher, critic) with an orchestrator.
        </p>
        <Callout kind="trap" title="The three agent failure modes">
          (1) <strong>Loops</strong> — always cap steps and budget. (2) <strong>Tool errors</strong> —
          feed failures back as observations so it can recover. (3) <strong>Cost blowup</strong> — each
          step is a full LLM call; a 10-step agent is 10× the latency and tokens.
        </Callout>
        <Callout kind="tip" title="Architect instinct">
          Don't reach for an agent when a fixed pipeline works. Agents earn their cost only when the
          path is genuinely dynamic. “Could this be a deterministic chain?” is the senior question.
        </Callout>
      </Block>

      <Block eyebrow="tool calling" title="How the model actually 'uses' a tool">
        <p className="text-ink-dim leading-relaxed mb-2">
          The model can't run code or hit an API itself. <strong>Function (tool) calling</strong> is a
          contract: you give the model a <strong>typed schema</strong> for each tool (name, description,
          JSON parameters), the model <em>emits a structured call</em> — “call <code className="font-mono">search</code>{" "}
          with <code className="font-mono">{`{query: "..."}`}</code>” — and <strong>your runtime</strong>{" "}
          executes it and feeds the result back into the context. The model decides <em>which</em> tool
          and <em>with what arguments</em>; you decide what actually happens.
        </p>
        <CodeBlock
          title="json"
          lang="text"
          code={`{ "name": "get_weather",
  "description": "Current weather for a city",
  "parameters": { "type": "object",
    "properties": { "city": { "type": "string" } },
    "required": ["city"] } }

// model emits ->  get_weather(city="Tokyo")
// your runtime runs it, returns  {"temp_c": 22}  as the observation`}
        />
        <Callout kind="warn" title="A tool call is untrusted output">
          Validate arguments before executing — clamp ranges, check permissions, never pass them straight
          into a shell or SQL string. The model proposes; your code disposes. (This is the same security
          boundary as prompt injection.)
        </Callout>
      </Block>

      <Block eyebrow="what makes it 'agentic'" title="Planning, memory, reflection">
        <p className="text-ink-dim leading-relaxed mb-2">
          The bare loop gets smarter with three additions. <strong>Planning</strong>: have the model lay
          out steps up front (or decompose the goal) instead of improvising one action at a time.{" "}
          <strong>Memory</strong>: short-term is the running history in context; long-term is an external
          store (often a vector DB) it can write to and retrieve from across steps or sessions.{" "}
          <strong>Reflection</strong>: let the agent critique its own output — “does this actually answer
          the question?” — and retry. A separate <em>critic</em> step catches errors the actor misses.
        </p>
        <Callout kind="note" title="Multi-agent orchestration">
          When one prompt juggles too many roles, split them: an <strong>orchestrator</strong> decomposes
          the task and delegates to specialized <strong>workers</strong> (researcher, coder, critic), then
          synthesizes. It buys clearer prompts and parallelism — at the cost of more calls, more latency,
          and coordination bugs. Reach for it only when a single agent visibly struggles.
        </Callout>
      </Block>

      <Block eyebrow="control" title="Keeping agents from going off the rails">
        <p className="text-ink-dim leading-relaxed mb-2">
          Agents fail in characteristic ways, and each has a standard mitigation — interviewers want to
          hear that you build the guardrails <em>in</em>, not bolt them on after.
        </p>
        <OpTable
          cols={["Failure", "Looks like", "", "Mitigation"]}
          rows={[
            { op: "Loops", avg: "repeats a step", avgTone: "bad", why: "Hard step cap; detect repeated actions; force a 'give up and report' branch." },
            { op: "Cost blowup", avg: "tokens explode", avgTone: "bad", why: "Token/dollar budget per task; cheaper model for routine steps; cache tool results." },
            { op: "Error cascade", avg: "one bad step poisons rest", avgTone: "bad", why: "Feed errors back as observations so it can recover; validate tool I/O at each hop." },
          ]}
        />
        <Callout kind="tip" title="The interview answer">
          “An agent is an LLM in a ReAct loop — reason, act via a typed tool call, observe the result,
          repeat. Tools are typed schemas the model fills in and my runtime executes. I always add step
          caps, a budget, and error-feedback so it can't loop or cascade — and I'd ask first whether a
          fixed pipeline could do the job, because an agent costs one full LLM call per step.”
        </Callout>
      </Block>
    </>
  );
}

/* ── Fine-tuning ──────────────────────────────────────────────── */
function FineTune() {
  return (
    <>
      <Lede>
        Fine-tuning changes the model's <em>weights</em> to bake in behavior, format, or style that
        prompting can't reliably get. For most teams that means <strong>LoRA</strong> — train a tiny
        set of adapter weights, freeze the rest — not a full-parameter retrain.
      </Lede>

      <Try label="full vs LoRA"><FineTuneViz /></Try>

      <Block eyebrow="the options" title="Prompt vs LoRA vs full fine-tune">
        <OpTable
          cols={["Approach", "Cost", "", "Use when"]}
          rows={[
            { op: "Prompt / few-shot", avg: "$", avgTone: "good", why: "First resort. No training. Iterate in minutes." },
            { op: "RAG", avg: "$$", avgTone: "good", why: "You need facts/knowledge, not new behavior." },
            { op: "LoRA / PEFT", avg: "$$", avgTone: "ok", why: "Consistent format/style/policy; narrow domain. Small data, cheap." },
            { op: "Full fine-tune", avg: "$$$$", avgTone: "bad", why: "Rarely. Deep new capability + lots of data + real budget." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          LoRA injects low-rank matrices into the model's linear layers (attention projections, often
          the MLP too); you train &lt;1% of the parameters, so it fits on modest GPUs and you can
          hot-swap adapters per use case.{" "}
          <strong>Quantized</strong> LoRA (QLoRA) goes further by training adapters on a 4-bit base.
        </p>
        <Callout kind="tip" title="The decision rule">
          Fine-tune for <em>behavior</em> (how it responds), RAG for <em>knowledge</em> (what it knows).
          They compose — a fine-tuned model over a RAG pipeline is common.
        </Callout>
        <Callout kind="trap" title="Fine-tuning is a maintenance commitment">
          Every base-model upgrade means re-tuning and re-evaluating. RAG data updates instantly; a
          fine-tune is frozen the moment you ship it.
        </Callout>
      </Block>

      <Block eyebrow="what actually changes" title="Weights (fine-tune) vs context (RAG)">
        <p className="text-ink-dim leading-relaxed mb-2">
          The crisp distinction: <strong>fine-tuning edits the model's weights</strong> — the learned
          parameters — so the new behavior is baked in and costs nothing extra at inference.{" "}
          <strong>RAG</strong> leaves the weights untouched and instead changes <em>what you put in the
          context</em> at query time. That's why the rule of thumb is behavior → fine-tune, knowledge →
          RAG: weights are good at <em>how</em> to respond, context is good at <em>what</em> is currently
          true.
        </p>
        <Callout kind="note" title="Full vs PEFT, in one line">
          <strong>Full fine-tune</strong> updates every weight (huge memory, a fresh copy of the model).{" "}
          <strong>PEFT</strong> (parameter-efficient fine-tuning) freezes the base and trains a small add-on
          — LoRA is the most common PEFT method, and <strong>QLoRA</strong> is LoRA on a 4-bit-quantized
          base so it fits on a single consumer GPU.
        </Callout>
      </Block>

      <Block eyebrow="two kinds of tuning" title="SFT (teach the task) vs preference tuning (teach taste)">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>SFT — supervised / instruction tuning</strong> — shows the model input→output pairs of
          the behavior you want; it learns to imitate. That gets you a model that <em>does the task</em>,
          but not necessarily in the tone or with the judgment you'd prefer. <strong>Preference tuning</strong>{" "}
          then teaches <em>which of two answers is better</em> using human (or AI) comparisons:
        </p>
        <OpTable
          cols={["Stage", "Data", "", "What it does"]}
          rows={[
            { op: "SFT", avg: "input→output pairs", avgTone: "good", why: "Imitate demonstrated answers. The workhorse — most teams stop here." },
            { op: "RLHF", avg: "ranked answers + reward model", avgTone: "ok", why: "Train a reward model on preferences, then RL the model to maximize it. Powerful, complex, unstable." },
            { op: "DPO", avg: "chosen vs rejected pairs", avgTone: "good", why: "Optimizes the same preference signal directly, no separate reward model or RL loop. Simpler, popular." },
          ]}
        />
        <Callout kind="note" title="Data: quality over quantity">
          LoRA/SFT can move behavior with hundreds to a few thousand <em>clean, consistent</em> examples —
          a small set of high-quality demonstrations beats a large noisy one. The labels <em>are</em> the
          product; garbage examples teach garbage confidently.
        </Callout>
      </Block>

      <Block eyebrow="the risks & the mechanics" title="Forgetting, adapters, and the decision rule">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Catastrophic forgetting</strong> is the central risk: push too hard on a narrow dataset
          (too many epochs, too high a learning rate) and the model overfits your data and loses general
          ability. The guardrails are the same as classic overfitting — small learning rate, few epochs,
          early stopping — and PEFT helps because the frozen base preserves most of what it knew.
        </p>
        <Callout kind="tip" title="Hot-swapping adapters">
          A LoRA adapter is tiny (megabytes), so you can serve <strong>one base model</strong> and swap in
          a different adapter per customer or task at request time — a big serving-cost win versus hosting
          a full fine-tuned copy of the model for each.
        </Callout>
        <Callout kind="tip" title="The interview answer">
          “Fine-tuning changes weights, RAG changes context — so I fine-tune for <em>behavior</em> and
          format, and use RAG for <em>knowledge</em>. In practice that's LoRA (PEFT), not a full retrain:
          SFT to teach the task, optionally DPO to align to preferences. I watch for catastrophic
          forgetting, and the two compose — a fine-tuned model over a RAG pipeline is common.”
        </Callout>
      </Block>
    </>
  );
}

/* ── Prompt patterns ──────────────────────────────────────────── */
function Prompt() {
  return (
    <>
      <Lede>
        Prompting is the cheapest, fastest lever — and a real engineering surface, not vibes. A handful
        of patterns cover most production needs.
      </Lede>

      <Try label="prompt patterns"><PromptPatternsViz /></Try>

      <Block eyebrow="the toolkit" title="Patterns worth knowing by name">
        <OpTable
          cols={["Pattern", "What it does", "", "Use when"]}
          rows={[
            { op: "Zero-shot", avg: "just ask", avgTone: "good", why: "Simple, well-known tasks. No examples — cheapest, fewest tokens." },
            { op: "Few-shot", avg: "show examples", avgTone: "good", why: "Format/edge cases are hard to describe but easy to demonstrate." },
            { op: "Chain-of-thought", avg: "‘think step by step’", avgTone: "good", why: "Multi-step reasoning, math, logic. Costs more tokens." },
            { op: "Structured output", avg: "force JSON/schema", avgTone: "good", why: "Anything downstream code must parse. Use schema/tool mode." },
            { op: "Self-consistency", avg: "sample N, vote", avgTone: "ok", why: "Hard reasoning where one sample is unreliable. N× cost." },
          ]}
        />
        <Callout kind="tip" title="Order of operations">
          Clear instructions → few-shot examples → structured output → CoT → self-consistency. Stop as
          soon as quality is good enough; each step up costs latency and tokens.
        </Callout>
        <Callout kind="warn" title="Prompt injection is a security boundary">
          Anything retrieved or user-supplied can contain instructions. Never let model output trigger
          privileged actions without validation — treat the prompt like untrusted input.
        </Callout>
      </Block>

      <Block eyebrow="the three roles" title="System, user, assistant">
        <p className="text-ink-dim leading-relaxed mb-2">
          A chat prompt is a list of messages with <strong>roles</strong>. The <strong>system</strong>{" "}
          message sets persistent rules, persona, and constraints — it's the highest-priority instruction.
          The <strong>user</strong> message is the request. The <strong>assistant</strong> message is the
          model's reply, and prior assistant turns become part of the context for the next one.
        </p>
        <CodeBlock
          title="json"
          lang="text"
          code={`system:    "You are a terse SQL assistant. Output only SQL, no prose."
user:      "users who signed up last week"
assistant: "SELECT * FROM users WHERE created_at >= ..."`}
        />
        <Callout kind="note" title="Put durable rules in the system message">
          Format requirements, tone, and guardrails belong in <strong>system</strong> so they hold across
          turns. Stuffing them into every user message wastes tokens and is easier for later turns to
          override.
        </Callout>
      </Block>

      <Block eyebrow="why CoT works" title="Chain-of-thought and self-consistency">
        <p className="text-ink-dim leading-relaxed mb-2">
          A model produces each token from the ones before it, so it has no scratchpad unless you give it
          one. <strong>Chain-of-thought</strong> (“think step by step”) makes the model write the
          intermediate steps <em>as tokens</em>, and those tokens then condition the final answer — it's
          literally giving the model room to compute. That's why CoT helps most on multi-step math and
          logic and barely helps on lookups.
        </p>
        <Callout kind="tip" title="Self-consistency: sample, then vote">
          For hard reasoning, sample several CoT answers at a non-zero temperature and take the{" "}
          <strong>majority answer</strong>. Different reasoning paths that converge on the same result are
          more trustworthy than one shot — at N× the cost, so reserve it for genuinely hard problems.
        </Callout>
        <Callout kind="note" title="Hide the scratchpad, keep the answer">
          When you use CoT in production, ask for the reasoning in a field you can strip (or use a model's
          built-in reasoning) and return only the final structured answer to downstream code.
        </Callout>
      </Block>

      <Block eyebrow="picking a pattern" title="The escalation ladder">
        <p className="text-ink-dim leading-relaxed mb-2">
          Treat these patterns as an <strong>escalation ladder</strong>: start with the cheapest thing
          that could work and climb only when quality falls short, because every rung adds latency, tokens,
          or both. Most production tasks settle on the second or third rung.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`zero-shot  →  + few-shot  →  + structured output  →  + CoT  →  + self-consistency  →  agent/tools
 cheapest                                                                          most expensive`}
        />
        <Callout kind="tip" title="The interview answer">
          “There are three roles — system for durable rules, user for the request, assistant for replies.
          I climb an escalation ladder: zero-shot, then few-shot for tricky formats, structured output for
          anything code must parse, chain-of-thought for multi-step reasoning, self-consistency when one
          sample is unreliable. I stop at the cheapest rung that's good enough, and I treat every retrieved
          or user string as untrusted because of prompt injection.”
        </Callout>
      </Block>
    </>
  );
}

/* ── Evals ────────────────────────────────────────────────────── */
function Evals() {
  return (
    <>
      <Lede>
        “How do you know it works?” is the question that separates a demo from a product. Evaluation is
        the hardest and most under-built part of LLM systems — and the part architects are expected to
        have an opinion on.
      </Lede>

      <Try label="eval methods compared"><EvalPatternsViz /></Try>

      <Block eyebrow="the ladder" title="From offline metrics to LLM-as-judge">
        <OpTable
          cols={["Method", "Good for", "", "Watch out"]}
          rows={[
            { op: "Golden set", avg: "regression", avgTone: "good", why: "Curated Q→expected pairs; run on every change. Build this first." },
            { op: "Exact / rule match", avg: "extraction, classify", avgTone: "good", why: "Cheap and objective — when there's one right answer." },
            { op: "LLM-as-judge", avg: "open-ended quality", avgTone: "ok", why: "Scales, but biased & noisy; calibrate against human labels." },
            { op: "Human review", avg: "ground truth", avgTone: "ok", why: "Gold standard, doesn't scale; sample it, don't skip it." },
            { op: "Online (A/B, feedback)", avg: "real impact", avgTone: "ok", why: "Thumbs, edits, task success — the only metric that truly counts." },
          ]}
        />
        <Callout kind="tip" title="The architect framing">
          “Offline golden set gates every deploy; LLM-as-judge gives a cheap quality signal calibrated
          to human labels; online feedback closes the loop.” Name all three layers.
        </Callout>
        <Callout kind="trap" title="Don't let the judge grade itself">
          Using the same model family to both generate and judge inflates scores. Cross-check with a
          different model and a human-labeled sample.
        </Callout>
      </Block>

      <Block eyebrow="why it's hard" title="The golden set is the foundation">
        <p className="text-ink-dim leading-relaxed mb-2">
          Eval is the hard part because LLM outputs are open-ended — there's rarely one right string, so
          you can't just diff against an expected answer the way you would in a unit test. The fix is a{" "}
          <strong>golden set</strong> (also called a regression set): a curated, version-controlled
          collection of representative inputs with known-good outputs. You run it on <em>every</em> change
          so you catch regressions before users do. Build this first — it's the single highest-leverage
          eval artifact.
        </p>
        <Callout kind="note" title="Match the metric to the task">
          When there's a single correct answer — classification, extraction, structured fields — use{" "}
          <strong>exact match</strong> or rule-based checks: cheap, objective, no model needed. Save the
          fuzzy, expensive methods for genuinely open-ended outputs.
        </Callout>
      </Block>

      <Block eyebrow="LLM-as-judge" title="Scales, but it's biased">
        <p className="text-ink-dim leading-relaxed mb-2">
          For open-ended quality you can have a strong model <strong>grade</strong> outputs — cheap and
          scalable, but it carries known biases you must control for. Naming them is what separates a
          junior answer from a senior one:
        </p>
        <OpTable
          cols={["Bias", "What happens", "", "Mitigation"]}
          rows={[
            { op: "Self-preference", avg: "favors its own family", avgTone: "bad", why: "Judge with a different model than the one that generated; sanity-check against humans." },
            { op: "Position", avg: "favors first (or last)", avgTone: "bad", why: "In pairwise scoring, swap the order and average both runs." },
            { op: "Verbosity", avg: "prefers longer answers", avgTone: "bad", why: "Pin the rubric to correctness; penalize padding explicitly." },
          ]}
        />
        <Callout kind="tip" title="Calibrate the judge">
          A judge is only trustworthy once you've shown it agrees with a <strong>human-labeled sample</strong>.
          Measure that agreement, then trust the judge to scale — and re-check it periodically. An
          uncalibrated judge is a confident number with no ground truth behind it.
        </Callout>
      </Block>

      <Block eyebrow="online & RAG-specific" title="Real impact and grounding metrics">
        <p className="text-ink-dim leading-relaxed mb-2">
          Offline eval predicts; <strong>online eval</strong> measures. An <strong>A/B test</strong> with{" "}
          <strong>implicit feedback</strong> — thumbs, edits, copy/accept rate, task success, retention —
          is the only signal that reflects real value. For RAG specifically you decompose quality so you
          know <em>which stage</em> to fix:
        </p>
        <OpTable
          cols={["Metric", "Measures", "", "Catches"]}
          rows={[
            { op: "Context precision/recall", avg: "retrieval", avgTone: "good", why: "Did we fetch the right chunks (recall@k), and is the top of the list relevant (precision)?" },
            { op: "Faithfulness", avg: "grounding", avgTone: "good", why: "Is every claim in the answer supported by the retrieved context? Catches hallucination." },
            { op: "Answer relevance", avg: "generation", avgTone: "good", why: "Does the answer actually address the question, vs. being true-but-off-topic?" },
          ]}
        />
        <Callout kind="tip" title="The interview answer">
          “Eval is the hard part because outputs are open-ended. I build a golden regression set first and
          gate every deploy on it; exact-match where there's one answer, LLM-as-judge — calibrated to a
          human sample and de-biased for position and verbosity — for open-ended quality; and online A/B
          with implicit feedback as the real measure. For RAG I split faithfulness, answer relevance, and
          context precision so I know which stage failed.”
        </Callout>
        <Callout kind="note" title="The data flywheel">
          Online feedback and human corrections feed straight back into the golden set and fine-tuning
          data. Each release makes the next eval sharper and the next model better — the flywheel that
          compounds over time.
        </Callout>
      </Block>
    </>
  );
}

/* ── Compression ──────────────────────────────────────────────── */
function Compress() {
  return (
    <>
      <Lede>
        Quantization and distillation trade a little quality for big wins in cost, latency, and memory
        — the levers that make self-hosting viable.
      </Lede>

      <Try label="quantization trade-off"><QuantizationViz /></Try>

      <Block eyebrow="two techniques" title="Smaller weights, or a smaller student">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Quantization</strong> stores weights at lower precision (FP16 → INT8 → INT4). It
          roughly halves memory per step down with modest quality loss — a 4-bit 70B model fits where
          the full model never would. <strong>Distillation</strong> trains a small “student” to mimic a
          large “teacher”, giving a permanently cheaper model for a fixed task.
        </p>
        <OpTable
          cols={["Precision", "Rel. memory", "", "Typical use"]}
          rows={[
            { op: "FP16 / BF16", avg: "1×", avgTone: "ok", why: "Training & high-fidelity serving." },
            { op: "INT8", avg: "~0.5×", avgTone: "good", why: "Common serving sweet spot; small quality hit." },
            { op: "INT4", avg: "~0.25×", avgTone: "good", why: "Fits big models on small GPUs; noticeable but often acceptable loss." },
          ]}
        />
        <Callout kind="note" title="Rule of thumb for VRAM">
          Weights ≈ params × bytes/param. A 7B model ≈ 14GB at FP16, ≈ 3.5GB at INT4 — before the KV
          cache, which grows with context length and batch size.
        </Callout>
      </Block>

      <Block eyebrow="the precision ladder" title="Bytes per parameter is the whole story">
        <p className="text-ink-dim leading-relaxed mb-2">
          Quantization is just storing each weight in fewer bits. The math is direct:{" "}
          <strong>FP16/BF16 = 2 bytes</strong>, <strong>INT8 = 1 byte</strong>, <strong>INT4 = 0.5
          bytes</strong> per parameter. Going down the ladder roughly halves memory and bandwidth at each
          step, and since LLM serving is largely memory-bandwidth-bound, smaller weights are also{" "}
          <em>faster</em>. The cost is precision: each weight can represent fewer distinct values, so
          quality erodes — gently at INT8, more noticeably at INT4.
        </p>
        <Callout kind="note" title="Two ways to quantize">
          <strong>Post-training quantization (PTQ)</strong> takes a finished model and rounds its weights
          down — fast, no retraining, the common path. <strong>Quantization-aware training (QAT)</strong>{" "}
          simulates the rounding <em>during</em> training so the model learns to tolerate it — more work,
          better low-bit quality. Most teams start with PTQ.
        </Callout>
      </Block>

      <Block eyebrow="the named methods" title="GPTQ and AWQ">
        <p className="text-ink-dim leading-relaxed mb-2">
          Naive rounding ignores that some weights matter far more than others. The two PTQ methods worth
          knowing by name both fix this with a small <strong>calibration</strong> dataset:{" "}
          <strong>GPTQ</strong> quantizes weights one group at a time and adjusts the rest to compensate
          for the error it just introduced; <strong>AWQ</strong> (activation-aware) protects the small
          fraction of <em>salient</em> weights that drive the largest activations, quantizing the rest
          harder. Both let INT4 land much closer to full quality than blind rounding would.
        </p>
        <Callout kind="trap" title="The KV-cache caveat">
          Quantizing <strong>weights</strong> shrinks the model on disk, but at long context the{" "}
          <strong>KV cache</strong> (the stored keys/values for every prior token) can dominate memory and
          it isn't touched by weight quantization. Budget for it separately — or quantize the KV cache too.
        </Callout>
      </Block>

      <Block eyebrow="other shrink levers" title="Distillation, pruning, speculative decoding">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Distillation</strong> is a different axis: instead of shrinking weights, you train a
          small <em>student</em> to mimic a large <em>teacher</em>. Crucially the student learns from the
          teacher's full output distribution (its <strong>logits</strong> / soft probabilities), not just
          the final label — those “soft targets” carry far more information than a one-hot answer, which is
          why a distilled student can punch above its size on the teacher's task.
        </p>
        <OpTable
          cols={["Technique", "Shrinks", "", "Trade-off"]}
          rows={[
            { op: "Quantization", avg: "bits per weight", avgTone: "good", why: "Same architecture, lower precision. Fast PTQ; small quality hit." },
            { op: "Distillation", avg: "parameter count", avgTone: "good", why: "Smaller student model. Needs training + a teacher; permanently cheaper for a fixed task." },
            { op: "Pruning", avg: "removes weights", avgTone: "ok", why: "Zero out unimportant weights/structures. Structured pruning helps real hardware; often needs fine-tuning after." },
          ]}
        />
        <Callout kind="tip" title="Speculative decoding (a freebie)">
          A small <em>draft</em> model proposes several tokens, the big model verifies them in one pass and
          keeps the prefix that matches. Same output distribution, fewer big-model steps — pure latency win,
          no quality loss, no retraining.
        </Callout>
        <Callout kind="tip" title="The interview answer">
          “Quantization stores weights in fewer bits — the precision ladder is FP16 at 2 bytes, INT8 at 1,
          INT4 at half — using methods like GPTQ or AWQ to keep quality at 4-bit. Distillation is the other
          lever: a small student mimics a big teacher's logits. I'd remember the KV cache isn't covered by
          weight quantization, and reach for speculative decoding when I just want lower latency for free.”
        </Callout>
      </Block>
    </>
  );
}

/* ── Classic ML ───────────────────────────────────────────────── */
function Classic() {
  return (
    <>
      <Lede>
        Not everything is an LLM. For tabular data, structured prediction, and latency-critical
        scoring, classic ML is faster, cheaper, and more interpretable — and it still shows up in
        screens. Here's enough to actually <em>reach for the right one</em>.
      </Lede>

      <Block eyebrow="the families" title="Which model for which problem">
        <OpTable
          cols={["Family", "Best at", "", "The intuition"]}
          rows={[
            { op: "Linear / Logistic", avg: "baselines", avgTone: "good", why: "Fit a weighted sum; logistic squashes it to a probability. Always start here." },
            { op: "Decision tree", avg: "rules", avgTone: "ok", why: "Greedy splits on the most informative feature; interpretable, overfits alone." },
            { op: "Random forest", avg: "robust tabular", avgTone: "good", why: "Many de-correlated trees, averaged — variance drops, little tuning." },
            { op: "Gradient boosting", avg: "tabular winner", avgTone: "good", why: "Trees that each fix the prior's errors. XGBoost/LightGBM win most tabular tasks." },
            { op: "k-NN", avg: "lazy similarity", avgTone: "ok", why: "Predict from nearest neighbors; no training, slow at query time." },
            { op: "k-means", avg: "clustering", avgTone: "ok", why: "Unsupervised grouping into k centroids; pick k, mind scaling." },
          ]}
        />
        <Callout kind="tip" title="The default that wins">
          On structured/tabular data, <strong>gradient-boosted trees</strong> (XGBoost, LightGBM) beat
          deep nets the vast majority of the time, with less data and less tuning. Deep learning earns
          its keep on unstructured data — text, images, audio.
        </Callout>
        <Callout kind="note" title="Metrics decide the model, not just accuracy">
          On imbalanced data, accuracy lies (99% “not fraud” by predicting never). Reach for
          precision/recall, F1, or AUC depending on the cost of false positives vs false negatives.
        </Callout>
      </Block>

      <Block eyebrow="the first split" title="Supervised vs unsupervised">
        <p className="text-ink-dim leading-relaxed mb-2">
          The top-level divide: <strong>supervised</strong> learning has labeled examples (input → known
          answer) and learns to predict the label — that's classification and regression.{" "}
          <strong>Unsupervised</strong> learning has no labels and finds structure on its own —{" "}
          clustering (k-means), dimensionality reduction (PCA), anomaly detection. Most production ML is
          supervised; unsupervised often shows up as a preprocessing or exploration step.
        </p>
        <Callout kind="note" title="What logistic regression actually outputs">
          Despite the name, logistic regression is a <strong>classifier</strong>. It fits a weighted sum
          like linear regression, then passes it through a <strong>sigmoid</strong> to squash the result
          into a <strong>probability</strong> in [0, 1]; you threshold that (usually at 0.5) to get a
          class. So its output is a calibrated-ish probability, not a raw score — which is why it's a
          great, interpretable baseline.
        </Callout>
      </Block>

      <Block eyebrow="why trees win tabular" title="Trees → forests → boosting">
        <p className="text-ink-dim leading-relaxed mb-2">
          A single <strong>decision tree</strong> splits the data greedily on the most informative
          feature — interpretable, but it overfits badly alone. The two ways to fix that define the most
          important family in tabular ML:
        </p>
        <OpTable
          cols={["Method", "Combines trees by", "", "Effect"]}
          rows={[
            { op: "Random forest (bagging)", avg: "averaging independent trees", avgTone: "good", why: "Train many de-correlated trees on random data/feature subsets, average them. Cuts variance; robust with little tuning." },
            { op: "Gradient boosting", avg: "trees that fix prior errors", avgTone: "good", why: "Each new tree predicts the residual error of the ensemble so far. Cuts bias; the tabular state of the art." },
          ]}
        />
        <Callout kind="tip" title="Bagging vs boosting in one line">
          <strong>Bagging</strong> (forests) builds trees in <em>parallel</em> and averages to reduce{" "}
          <strong>variance</strong>; <strong>boosting</strong> (XGBoost, LightGBM) builds them{" "}
          <em>sequentially</em>, each correcting the last, to reduce <strong>bias</strong>. Boosting
          usually wins accuracy; forests are more forgiving to tune.
        </Callout>
      </Block>

      <Block eyebrow="the rest, in a line each" title="SVM, kNN, k-means, naive Bayes">
        <OpTable
          cols={["Model", "Idea", "", "Reach for it when"]}
          rows={[
            { op: "SVM", avg: "max-margin boundary", avgTone: "ok", why: "Find the separating line with the widest gap; kernels handle non-linear. Small/medium clean datasets." },
            { op: "k-NN", avg: "ask the neighbors", avgTone: "ok", why: "No training — predict from the k closest points at query time. Simple baseline; slow and memory-heavy at scale." },
            { op: "k-means", avg: "k centroids", avgTone: "ok", why: "Unsupervised grouping into k clusters. Pick k, scale features first; the clustering default." },
            { op: "Naive Bayes", avg: "feature independence", avgTone: "ok", why: "Probabilistic, assumes features are independent. Fast, strong on text/spam despite the naive assumption." },
          ]}
        />
        <Callout kind="note" title="Feature engineering is the real work">
          On tabular data the model often matters less than the <strong>features</strong>: encoding
          categoricals, scaling, handling missing values, and crafting informative combinations. Good
          features in a simple model beat raw columns in a fancy one — and avoid <em>leakage</em>
          (sneaking the answer into a feature), the classic silent killer of tabular pipelines.
        </Callout>
      </Block>

      <Block eyebrow="putting it together" title="Why classic still wins, and what to optimize">
        <p className="text-ink-dim leading-relaxed mb-2">
          Deep nets shine on <em>unstructured</em> data (text, images, audio) where they learn features
          from raw signal. On <strong>tabular</strong> data the features are already meaningful columns,
          datasets are smaller, and gradient-boosted trees handle mixed types and interactions with little
          tuning — so they keep winning. It all ties back to <strong>bias–variance</strong>: forests
          attack variance, boosting attacks bias, regularization buys a little bias to kill variance.
        </p>
        <Callout kind="tip" title="The interview answer">
          “I split supervised vs unsupervised, then start with a linear/logistic baseline — logistic
          outputs a probability via a sigmoid. For tabular I go to gradient-boosted trees (XGBoost,
          LightGBM): boosting reduces bias, bagging reduces variance, and they beat deep nets on structured
          data most of the time. Then I pick the metric for the cost structure — precision/recall/AUC, not
          raw accuracy on imbalanced data.”
        </Callout>
      </Block>
    </>
  );
}

/* ── Recsys ───────────────────────────────────────────────────── */
function RecSys() {
  return (
    <>
      <Lede>
        Recommendation is the highest-revenue ML pattern in industry. The architecture is almost always
        a <strong>two-stage funnel</strong>: cheaply generate candidates, then expensively rank them.
      </Lede>

      <Block eyebrow="the funnel" title="Candidate generation → ranking">
        <CodeBlock
          title="text"
          lang="text"
          code={`millions of items
   └─> candidate generation  (cheap recall: embeddings / two-tower / co-occurrence)  -> ~hundreds
        └─> ranking          (expensive precision: rich features, GBT or deep model)  -> top N
             └─> re-rank      (business rules: diversity, freshness, dedup)           -> shown`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          <strong>Collaborative filtering</strong> uses “users like you liked X”;{" "}
          <strong>content-based</strong> uses item features; the modern default is a{" "}
          <strong>two-tower</strong> model — separate user and item encoders trained so a dot product
          approximates relevance, enabling fast ANN retrieval.
        </p>
        <Callout kind="trap" title="The cold-start problem">
          New users and new items have no interaction history. Fall back to content features,
          popularity, or onboarding signals — interviewers will always probe this.
        </Callout>
      </Block>

      <Block eyebrow="the signal" title="Explicit vs implicit feedback">
        <p className="text-ink-dim leading-relaxed mb-2">
          What you train on matters as much as the model. <strong>Explicit feedback</strong> — star
          ratings, thumbs — is clean but rare and biased (people rate the extremes). <strong>Implicit
          feedback</strong> — clicks, watch time, purchases, dwell — is abundant but noisy and{" "}
          <em>one-sided</em>: a non-click might mean “disliked” or just “never saw it.” Most real systems
          run on implicit signals and have to model that missing-not-at-random problem carefully.
        </p>
        <Callout kind="note" title="Absence isn't a negative">
          You can't treat every un-clicked item as a dislike — the user only saw a sliver of the catalog.
          Techniques like negative sampling (treat a <em>random</em> unseen item as a soft negative) exist
          precisely to handle this.
        </Callout>
      </Block>

      <Block eyebrow="the classic approaches" title="Collaborative filtering and matrix factorization">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Collaborative filtering</strong> recommends from interaction patterns alone, no item
          features needed. <strong>User–user</strong> CF: “people similar to you liked X.”{" "}
          <strong>Item–item</strong> CF: “people who liked this item also liked X” — more stable, since
          items change slower than tastes, and what powers most “related items” rails.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Matrix factorization</strong> is the workhorse formalization: the huge, sparse
          user×item interaction matrix is approximated as the product of two skinny matrices — a{" "}
          <strong>latent vector</strong> per user and per item. A user's predicted affinity for an item is
          just the <strong>dot product</strong> of their vectors. <strong>Content-based</strong>{" "}
          filtering instead uses item features directly, which is its key advantage at cold-start.
        </p>
        <Callout kind="note" title="Latent factors are learned, not labeled">
          MF discovers dimensions on its own — one might end up encoding “action vs. drama,” another
          “mainstream vs. niche” — without anyone defining them. It's embeddings for recommendation.
        </Callout>
      </Block>

      <Block eyebrow="the modern retrieval model" title="The two-tower architecture">
        <p className="text-ink-dim leading-relaxed mb-2">
          The modern default for candidate generation is the <strong>two-tower</strong> model: one neural
          encoder for the user (and context), a separate one for the item, trained so that{" "}
          <strong>dot product ≈ relevance</strong>. The payoff is serving: because the towers are
          independent, you precompute every item vector offline and index them for{" "}
          <strong>ANN</strong> search — at request time you embed only the user and pull the nearest items
          in milliseconds, out of millions.
        </p>
        <OpTable
          cols={["Stage", "Job", "", "Tech"]}
          rows={[
            { op: "Candidate gen", avg: "recall, cheap", avgTone: "good", why: "Millions → hundreds. Two-tower + ANN, co-occurrence. Optimize for not missing good items." },
            { op: "Ranking", avg: "precision, rich", avgTone: "good", why: "Hundreds → ordered. Heavy model with many features (GBT or deep). Predict click/conversion." },
            { op: "Re-rank", avg: "business rules", avgTone: "ok", why: "Diversity, freshness, dedup, policy. The funnel's final shaping before display." },
          ]}
        />
        <Callout kind="note" title="Why split recall and precision">
          A precise model is too expensive to run on millions of items, and a cheap model is too blunt to
          order the final list well. The funnel lets each stage specialize — cheap recall narrows the
          field, expensive precision sorts what's left.
        </Callout>
      </Block>

      <Block eyebrow="measuring & risks" title="Ranking metrics and feedback loops">
        <p className="text-ink-dim leading-relaxed mb-2">
          Recommendation eval is about <em>ranking</em>, not single-answer accuracy. <strong>Recall@k</strong>{" "}
          asks whether the relevant items made the top k at all (the candidate-gen metric).{" "}
          <strong>nDCG</strong> rewards putting the <em>most</em> relevant items <em>highest</em>, with a
          discount that fades down the list — the ranking metric, since position is what users actually
          see.
        </p>
        <Callout kind="trap" title="Feedback loops and filter bubbles">
          The model is trained on what it previously showed, so it reinforces its own past choices —{" "}
          <strong>filter bubbles</strong> narrow what users ever see, and the training data drifts toward
          the model's biases. Inject exploration (show some novel/diverse items), log{" "}
          <em>impressions</em> not just clicks, and watch diversity metrics, not just engagement.
        </Callout>
        <Callout kind="tip" title="The interview answer">
          “Recommendation is a two-stage funnel: cheap candidate generation — usually a two-tower model
          with ANN retrieval — then an expensive ranker, then re-ranking for diversity and freshness. It
          runs mostly on implicit feedback, so I'm careful that a non-click isn't a true negative. I'd
          evaluate with Recall@k for retrieval and nDCG for ranking, plan for cold-start with content
          features, and guard against feedback loops with exploration.”
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  rag: <Rag />,
  agents: <Agents />,
  finetune: <FineTune />,
  prompt: <Prompt />,
  evals: <Evals />,
  compress: <Compress />,
  classic: <Classic />,
  recsys: <RecSys />,
};

export default function ModelBench() {
  const [active, setActive] = useState("rag");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Approaches · the HOW"
      title="Model Bench"
      subtitle="The recurring solution shapes — RAG, agents, fine-tuning, evals — plus the classic ML families that still win on tabular data."
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
