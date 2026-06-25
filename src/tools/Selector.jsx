import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import ApproachDecoderViz from "./selector/ApproachDecoderViz.jsx";
import BudgetDecoderViz from "./selector/BudgetDecoderViz.jsx";
import BuildBuyViz from "./selector/BuildBuyViz.jsx";
import MetricSelectorViz from "./selector/MetricSelectorViz.jsx";
import DisambiguationViz from "./selector/DisambiguationViz.jsx";

const ACCENT = "#ffb703";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "framing", label: "Problem framing", group: "Decide" },
  { id: "approach", label: "Approach decoder", group: "Decide" },
  { id: "buildbuy", label: "Build vs buy", group: "Decide" },
  { id: "budget", label: "Cost / latency / quality", group: "Decide" },
  { id: "retrieval", label: "Retrieval selector", group: "Decide" },
  { id: "metric", label: "Metric selector", group: "Recall" },
  { id: "disambig", label: "Disambiguation", group: "Recall" },
];

/* ── Problem framing ──────────────────────────────────────────── */
function Framing() {
  return (
    <>
      <Lede>
        The meta-skill interviewers reward most: turning a vague business goal into a{" "}
        <strong>well-posed ML problem</strong>. Before any architecture, you scope it — what success
        means, whether ML is even the right tool, the task and label, the metric, and the constraints.
        In 2026 ML-system-design rounds this scoping <em>is</em> the differentiator.
      </Lede>

      <Block eyebrow="start here" title="The goal, not the model">
        <p className="text-ink-dim leading-relaxed mb-2">
          The first move is to <strong>resist jumping to architectures</strong>. Before "I'd use a
          two-tower retriever…", clarify the <strong>business objective</strong> and exactly{" "}
          <strong>how success is measured</strong> — the business KPI. "Reduce churn," "lift
          add-to-cart," "cut fraud loss by 20%." Everything downstream — the task, the label, the
          metric, the constraints — is derived from that one sentence, so getting it precise is the
          highest-leverage thing you do in the whole round.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          A goal stated as a model ("we need a recommender") hides the actual objective and quietly
          decides the design for you. Restate it as an outcome ("we want users to find relevant items
          faster, measured by click-through and session length") and the design space reopens —
          maybe ranking, maybe better search, maybe no ML at all.
        </p>
        <Callout kind="tip" title="Anchor every round to the KPI">
          "What business metric are we trying to move, and how will we know it moved?" Pin that first.
          It turns a vague prompt into a target you can actually design against — and it's the
          question that separates a scoped answer from a pile of boxes.
        </Callout>
      </Block>

      <Block eyebrow="the honest first question" title="Should this even be ML?">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>rules / heuristic baseline</strong> often wins, and proposing it first is a senior
          signal, not a junior one. ML earns its complexity only when the pattern is{" "}
          <strong>hard to specify by hand</strong> <em>and</em> you have the <strong>data</strong> plus
          a <strong>feedback signal</strong> to learn and keep learning from it. If a dozen
          if-statements get you 90% of the value, ship those and revisit ML when they plateau.
        </p>
        <OpTable
          cols={["Signal", "Points toward", "", "Why"]}
          rows={[
            { op: "Pattern is easy to write down", avg: "rules / heuristics", avgTone: "good", why: "If you can specify it, code it. No data, no training, fully debuggable." },
            { op: "Pattern is hard to specify, data exists", avg: "ML", avgTone: "ok", why: "Learning from examples beats hand-tuning when the rule is fuzzy or high-dimensional." },
            { op: "No labels / no feedback loop", avg: "not ML (yet)", avgTone: "bad", why: "Without a signal to learn from and measure against, ML can't earn its keep." },
            { op: "Real cost of being wrong is tiny", avg: "rules / heuristics", avgTone: "good", why: "Don't spend a model where a default value or simple rule is good enough." },
          ]}
        />
        <Callout kind="note" title="Always propose the simple baseline first">
          Even when ML is clearly right, name the heuristic baseline out loud — it sets the bar the
          model has to beat, gives you a fallback for cold start, and shows you optimize for impact,
          not for getting to use a model.
        </Callout>
      </Block>

      <Block eyebrow="make it well-posed" title="Frame the task, define the label and data">
        <p className="text-ink-dim leading-relaxed mb-2">
          Once ML is justified, map the goal to a <strong>task type</strong>, then nail down the{" "}
          <strong>label</strong> (what you predict) and the <strong>data</strong> (what you have, and
          how feedback flows back). This is the step that turns a goal into a problem a model can
          actually be trained on.
        </p>
        <OpTable
          cols={["Goal sounds like…", "Task type", "", "Label / target"]}
          rows={[
            { op: "Will this user churn / convert?", avg: "binary classification", avgTone: "good", why: "Did the event happen in the window? A 0/1 label from logged outcomes." },
            { op: "Which category does this belong to?", avg: "multiclass classification", avgTone: "good", why: "One label out of K classes — topic, intent, product category." },
            { op: "How much / how many?", avg: "regression", avgTone: "good", why: "A continuous target — price, demand, time-to-event." },
            { op: "What should we show, in what order?", avg: "ranking / recommendation", avgTone: "ok", why: "Relevance/engagement per item; learn an ordering, not a single class." },
            { op: "Write / summarize / answer this", avg: "generation", avgTone: "ok", why: "Open-ended output; the 'label' is reference text or human/judge preference." },
            { op: "Is this weird / unexpected?", avg: "anomaly detection", avgTone: "ok", why: "Few or no positive labels; model the normal, flag the outliers." },
          ]}
        />
        <Callout kind="trap" title="The label and feedback loop are where it gets real">
          "Predict churn" sounds clean until you define it: churn within how many days? Measured how?
          And does the outcome flow back as a label to retrain on? A goal you can't turn into a
          concrete label and a feedback signal isn't a well-posed ML problem yet — that's the gap
          interviewers probe.
        </Callout>
      </Block>

      <Block eyebrow="tie it to the goal" title="Pick the metric, then name the constraints">
        <p className="text-ink-dim leading-relaxed mb-2">
          Choose an <strong>offline metric</strong> (precision/recall, nDCG, RMSE, …) that{" "}
          <em>correlates with the online business metric</em> — the offline number is a proxy you can
          iterate on fast, but it only matters insofar as it moves the KPI. And name the{" "}
          <strong>cost of each error type</strong>: a false positive and a false negative almost never
          cost the same, so <strong>precision vs recall is a business call</strong>, not a default.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          Then surface the <strong>constraints early</strong>, because they prune the design space
          before you draw a single box:
        </p>
        <OpTable
          cols={["Constraint", "Ask", "", "What it prunes"]}
          rows={[
            { op: "Latency SLO", avg: "p95 budget?", avgTone: "ok", why: "Rules out heavy models / long reasoning if it's a tight online path." },
            { op: "Cost ceiling", avg: "$/request?", avgTone: "ok", why: "Caps model size, sampling, and how much retrieval you can afford." },
            { op: "Interpretability / regulatory", avg: "must we explain it?", avgTone: "ok", why: "Finance/health/gov may force simpler, auditable models over black boxes." },
            { op: "Data freshness", avg: "how stale is OK?", avgTone: "ok", why: "Decides batch vs streaming features and retrain cadence." },
            { op: "Scale", avg: "QPS / # items?", avgTone: "ok", why: "Shapes serving, indexing, and whether candidate generation is even needed." },
          ]}
        />
        <Callout kind="note" title="Constraints are scoping, not afterthoughts">
          A latency SLO or a 'must be explainable' requirement can eliminate most of the model menu in
          one sentence. Asking for them up front is what makes the rest of the design fast and
          defensible.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The standard skeleton, out loud">
        <p className="text-ink-dim leading-relaxed mb-2">
          Frame the whole round as a roadmap and <em>say it first</em>:{" "}
          <strong>requirements → data → model/baseline → evaluation (offline + online) → serving →
          monitoring</strong>. Naming the skeleton up front signals you've done this before and gives
          the interviewer a map to follow — then you walk each box deliberately instead of
          free-associating.
        </p>
        <Callout kind="trap" title="A diagram with no requirements is the classic fail">
          The most common way candidates lose this round is a confident architecture diagram with no
          objective, no metric, and no constraints behind it. Interviewers are grading the scoping —
          the goal, the task, the label, the metric, the trade-offs — not the boxes. Boxes without
          framing read as memorized; framing without perfect boxes reads as senior.
        </Callout>
        <Callout kind="tip" title="The interview answer">
          "Before I design anything I scope it. First the business goal and the KPI we're moving. Then
          the honest question — does this even need ML, or does a heuristic baseline win? If ML earns
          it, I frame the task (classification, ranking, regression, generation, anomaly…), define the
          label and the data and feedback loop, and pick an offline metric that correlates with the
          online KPI — naming which error is more expensive, because precision-vs-recall is a business
          call. I surface constraints early — latency, cost, interpretability, freshness, scale —
          because they prune the design space. Then I walk the skeleton: requirements → data →
          model/baseline → evaluation → serving → monitoring. The scoping is the answer; the diagram
          is just the last step."
        </Callout>
      </Block>
    </>
  );
}

/* ── Approach decoder ─────────────────────────────────────────── */
function Approach() {
  return (
    <>
      <Lede>
        The single most architect-flavored skill: given a problem, reach for the right tool instead of
        defaulting to the heaviest one. Walk the tree — most real problems land on{" "}
        <strong>prompt</strong> or <strong>RAG</strong> long before fine-tuning.
      </Lede>

      <Try label="walk the decision tree"><ApproachDecoderViz /></Try>

      <Block eyebrow="the mental model" title="Knowledge vs behavior">
        <p className="text-ink-dim leading-relaxed mb-2">
          Almost every “which approach” call collapses to one axis: do you need the model to{" "}
          <strong>know something new</strong> (→ RAG) or to <strong>behave differently</strong> (→
          fine-tune)? Prompting is the free first try for both; pretraining is the rare, expensive last
          resort. Saying this distinction out loud is the senior signal.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          The reason the two split so cleanly is <em>where</em> each one acts. RAG works at{" "}
          <strong>inference time</strong>: you retrieve relevant text and paste it into the prompt, so the
          model reads the facts fresh on every call. Nothing about the model changes — you've just handed
          it a better open-book. Fine-tuning works at <strong>training time</strong>: you nudge the{" "}
          <strong>weights</strong> with gradient steps, so the new tone, format, or skill is baked into the
          model itself and shows up even with no special prompt. That's why "the answer changes when our
          docs change" points at RAG, while "the model should always reply in this exact JSON shape /
          house style" points at fine-tuning.
        </p>
        <Callout kind="tip" title="The escalation ladder">
          Prompt → few-shot → RAG → LoRA → full fine-tune → pretrain. Climb only as far as the metric
          forces you to, and justify each rung by what the cheaper one couldn't do.{" "}
          <em>One caveat:</em> RAG and fine-tune aren't really sequential — they fix different axes
          (knowledge vs behavior), so climb the one your gap is actually on.
        </Callout>
        <Callout kind="note" title="They compose">
          These aren't either/or. A mature system often fine-tunes for <em>behavior</em> (consistent
          format, domain tone, tool-calling style) <em>and</em> uses RAG for <em>knowledge</em> (current,
          private facts). The decision tree isn't picking one branch forever — it's asking which gap to
          close <em>next</em>.
        </Callout>
      </Block>

      <Block eyebrow="the rungs" title="What each tool actually buys you">
        <OpTable
          cols={["Approach", "Changes", "", "Reach for it when"]}
          rows={[
            { op: "Prompt / instructions", avg: "nothing — just input", avgTone: "good", why: "The free first try. Clear instructions + a good system prompt solve more than people expect." },
            { op: "Few-shot examples", avg: "nothing — just input", avgTone: "good", why: "Show 2–5 examples of the format/behavior you want. Often beats fine-tuning for cheap." },
            { op: "RAG", avg: "what's in context", avgTone: "ok", why: "Inject current/private facts at inference. The fix when the gap is KNOWLEDGE the model never saw." },
            { op: "Fine-tune (LoRA / full)", avg: "the weights", avgTone: "ok", why: "Bake in a consistent BEHAVIOR — format, tone, a narrow skill — that prompting can't make stick." },
            { op: "Continued pretraining", avg: "the weights, deeply", avgTone: "bad", why: "Rare. Only for a genuinely new domain/language the base model fundamentally lacks." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The ladder is also a <strong>cost-and-effort escalation</strong>. Prompting is minutes and
          pennies. RAG adds a retrieval pipeline (chunking, an index, an embedding model) but no training
          run. Fine-tuning needs a labeled dataset, a training job, and an eval harness to prove it didn't
          regress. Continued pretraining needs a corpus and a serious compute budget. Each rung roughly an
          order of magnitude more work than the last — so you climb only when the metric refuses to move
          otherwise.
        </p>
        <Callout kind="note" title="The rare case for pretraining">
          Continued (or "domain-adaptive") pretraining earns its keep only when the base model is missing
          something <em>foundational</em> — a low-resource language, a specialized notation (think
          proteins, chip layouts, niche legal code) — that no amount of retrieved context or behavioral
          tuning can supply. If you can express the gap as "it doesn't know X" → try RAG first; pretraining
          is for "it doesn't even speak this dialect of the problem."
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "First I ask whether the gap is <em>knowledge</em> or <em>behavior</em>. Missing facts → RAG,
          because it injects the right context at inference without touching the model. Wrong format, tone,
          or a narrow skill → fine-tune, because that's a weight-level behavior change. I always start at
          prompting and few-shot — they're free and solve a surprising amount — and only climb the ladder
          when an eval forces me to, justifying each rung by what the cheaper one couldn't do. The two also
          compose: fine-tune for behavior, RAG for knowledge."
        </Callout>
        <Callout kind="trap" title="The honest re-scope move">
          Sometimes the real gap is a <em>capability</em> the base model just doesn't have, and you can't
          fund closing it (no data, no compute, no team to maintain a fine-tune). The senior move isn't to
          force the heaviest tool — it's to say so and <strong>re-scope</strong>: narrow the problem to what
          today's models do reliably, or pick a stronger off-the-shelf model. "We can't afford a true
          capability gap here, so let's reshape the requirement" is a better answer than a fine-tune that
          quietly underperforms.
        </Callout>
      </Block>
    </>
  );
}

/* ── Build vs buy ─────────────────────────────────────────────── */
function BuildBuy() {
  return (
    <>
      <Lede>
        API (closed model) or self-host (open model)? This is a cost, control, and risk decision, and
        the break-even moves as your volume grows.
      </Lede>

      <Try label="build vs buy"><BuildBuyViz /></Try>

      <Block eyebrow="the trade-off" title="Hosted API vs self-hosted open model">
        <OpTable
          cols={["Dimension", "Hosted API", "", "Self-hosted open"]}
          rows={[
            { op: "Time to ship", avg: "minutes", avgTone: "good", worst: "weeks", worstTone: "bad", why: "API wins early; self-host needs infra + MLOps." },
            { op: "Unit cost at scale", avg: "per-token", avgTone: "ok", worst: "GPU-amortized", worstTone: "good", why: "Self-host wins past a high, steady volume." },
            { op: "Data control / privacy", avg: "leaves your VPC", avgTone: "ok", worst: "stays in VPC", worstTone: "good", why: "Self-host for strict residency / sensitivity." },
            { op: "Frontier capability", avg: "best models", avgTone: "good", worst: "trails frontier", worstTone: "ok", why: "Closed models usually lead on raw capability." },
            { op: "Ops burden", avg: "none", avgTone: "good", worst: "you own GPUs", worstTone: "bad", why: "Serving, scaling, upgrades all become yours." },
          ]}
        />
        <Callout kind="tip" title="The default path">
          Start on an API to validate the product, instrument cost and latency, then revisit self-host
          only when volume is high and steady, or when data/compliance forces it. Premature self-hosting
          burns months.
        </Callout>
        <Callout kind="note" title="The honest break-even">
          Self-hosting trades variable per-token cost for fixed GPU + engineering cost. It only pays off
          above a volume threshold and assumes you can keep the GPUs busy — idle GPUs are pure loss. And
          the threshold is really about <em>token throughput</em>, not request count: 1M long-context RAG
          calls cost far more than 1M one-line completions.
        </Callout>
      </Block>

      <Block eyebrow="the cost structure" title="Variable per-token vs fixed GPU + engineering">
        <p className="text-ink-dim leading-relaxed mb-2">
          The whole decision is really a <strong>cost-curve</strong> question. An API is{" "}
          <strong>pure variable cost</strong>: you pay per token, so the line starts at zero and slopes up
          with usage — cheap when you're small, painful when you're huge. Self-hosting is mostly{" "}
          <strong>fixed cost</strong>: rented or owned GPUs plus the engineers to run them, paid whether or
          not a single request comes in — a flat (high) line that barely moves with usage.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          Those two lines <strong>cross</strong> at a break-even. Below it the API is cheaper; above it the
          amortized GPU wins. But the x-axis is <strong>token throughput, not request count</strong> — what
          fills a GPU is tokens processed per second, so a million long-context RAG calls cost far more than
          a million one-line completions. Size the decision in tokens/day, not requests/day.
        </p>
        <Callout kind="trap" title="Idle GPUs are the hidden killer">
          Fixed cost only pays off if the hardware stays <strong>busy</strong>. Spiky or low traffic means a
          GPU you've already paid for sits idle — utilization, not list price, decides whether self-hosting
          actually beats the API. A 40%-utilized cluster can be more expensive per token than the API you
          left.
        </Callout>
      </Block>

      <Block eyebrow="beyond cost" title="The axes that override the math">
        <p className="text-ink-dim leading-relaxed mb-2">
          Cost is only one axis, and several others can decide it before the curves even cross:
        </p>
        <OpTable
          cols={["Axis", "Pushes toward", "", "Why"]}
          rows={[
            { op: "Data residency / privacy", avg: "self-host", avgTone: "ok", why: "Strict compliance (health, finance, gov) may forbid data leaving your VPC at all." },
            { op: "Latency control", avg: "self-host", avgTone: "ok", why: "You own the queue, the hardware, and tail latency — no shared-tenant variability or rate limits." },
            { op: "Frontier capability", avg: "API", avgTone: "good", why: "Closed models usually lead on raw quality; the best open model often trails by a generation." },
            { op: "Ops / MLOps burden", avg: "API", avgTone: "good", why: "Serving, autoscaling, GPU upgrades, model updates, on-call — all become your team's job when you self-host." },
          ]}
        />
        <Callout kind="note" title="Privacy isn't always a wall">
          "Data can't leave our VPC" is a real constraint, but check the actual policy first — many API
          providers offer no-retention / no-training terms and regional hosting. Sometimes the compliance
          box is checkable without standing up GPUs.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "I default to a hosted API to validate the product fast, and I instrument cost and latency from
          day one. Self-hosting only makes sense once token throughput is high and steady enough to clear
          the break-even — and that break-even is about tokens, not requests — and I can actually keep the
          GPUs busy. I'd jump to self-host earlier only if data residency, latency control, or a hard
          privacy requirement forces my hand. Otherwise I'm trading variable per-token cost for fixed
          GPU-plus-engineering cost and a real ops burden, so I want the volume to justify it."
        </Callout>
      </Block>
    </>
  );
}

/* ── Budget decoder ───────────────────────────────────────────── */
function Budget() {
  return (
    <>
      <Lede>
        You can have it cheap, fast, or smart — pick two. Every LLM design lives inside this triangle,
        and naming the corner you're optimizing (and what you're trading away) is the architect move.
      </Lede>

      <Try label="budget decoder"><BudgetDecoderViz /></Try>

      <Block eyebrow="the triangle" title="Cost ↔ latency ↔ quality">
        <OpTable
          cols={["If you optimize…", "You typically…", "", "At the cost of"]}
          rows={[
            { op: "Quality", avg: "bigger model, CoT, N-sampling, reranking", avgTone: "good", why: "Higher latency and token cost per request." },
            { op: "Latency", avg: "smaller/distilled model, stream, cache, shorter context", avgTone: "ok", why: "Some quality, and more eng to tune." },
            { op: "Cost", avg: "smaller model, cache, batch, trim prompts", avgTone: "ok", why: "Quality, and sometimes latency under load." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The levers that buy you <em>two corners at once</em>: <strong>caching</strong> (cheaper +
          faster), <strong>semantic routing</strong> (small model for easy queries, big for hard), and
          <strong> streaming</strong> (perceived latency without changing real cost).
        </p>
        <Callout kind="tip" title="Always anchor to the SLO">
          “What's the p95 latency budget and the per-request cost ceiling?” Pin those first; they
          eliminate most of the model/architecture menu before you debate it.
        </Callout>
      </Block>

      <Block eyebrow="define the corners" title="What each axis actually means">
        <p className="text-ink-dim leading-relaxed mb-2">
          Before trading them off, be precise about each corner — interviewers probe whether you can
          measure them, not just name them:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li>
            <strong>Cost</strong> — money per unit of work, usually <code className="font-mono">$/request</code>{" "}
            or <code className="font-mono">$/1k tokens</code>. Driven by model size and total tokens (prompt
            + output), so long context and verbose outputs both inflate it.
          </li>
          <li>
            <strong>Latency</strong> — wall-clock time the user waits. Split it: <strong>time-to-first-token</strong>{" "}
            (how fast something appears) vs <strong>total completion time</strong>. Track the tail
            (<code className="font-mono">p95/p99</code>), not the average — the average hides the slow
            requests users actually complain about.
          </li>
          <li>
            <strong>Quality</strong> — does the output do the job? Defined by your eval, not a vibe. Bigger
            models, reasoning/chain-of-thought, sampling several answers, and reranking all buy quality —
            and all cost tokens and time.
          </li>
        </ul>
        <Callout kind="note" title="Why it's a triangle, not three dials">
          The axes fight each other. The levers that raise quality (bigger model, more reasoning tokens,
          N-sampling) directly add latency and cost; the levers that cut cost/latency (smaller model,
          shorter context) usually shave quality. You rarely improve one for free — you move along an edge.
        </Callout>
      </Block>

      <Block eyebrow="the cheats" title="Levers that buy two corners at once">
        <p className="text-ink-dim leading-relaxed mb-2">
          A few moves dodge the usual trade and grab two corners together — these are the ones worth naming
          in an interview:
        </p>
        <OpTable
          cols={["Lever", "Buys you", "", "The catch"]}
          rows={[
            { op: "Caching", avg: "cheaper + faster", avgTone: "good", why: "Repeated/prefix-shared prompts skip recompute. Needs cacheable, repeating traffic to pay off." },
            { op: "Semantic routing", avg: "cheaper + (often) faster", avgTone: "good", why: "Send easy queries to a small model, hard ones to a large one. Needs a reliable difficulty classifier." },
            { op: "Streaming", avg: "better perceived latency", avgTone: "good", why: "Tokens appear immediately — real cost is unchanged, but the user feels it as fast." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Note the difference: caching and routing change <em>real</em> cost and latency; streaming only
          changes <em>perceived</em> latency. Both are legitimate — sometimes the win you need is how fast
          it <em>feels</em>, not how fast it is.
        </p>
        <Callout kind="trap" title="Every optimization trades something">
          A smaller model trades a little quality. Aggressive caching trades freshness (and risks serving
          stale answers). Routing trades engineering complexity and adds a classifier you now have to keep
          accurate. There's no free corner — name what each move gives up.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "I anchor to the SLOs first — what's the p95 latency budget and the per-request cost ceiling? —
          because those eliminate most of the menu before we debate models. Then I pick the corner the
          product actually needs and name what I'm trading. If I can, I reach for the two-corner levers:
          caching for cheaper-and-faster, semantic routing to send easy queries to a small model, and
          streaming so it <em>feels</em> fast even when total time is unchanged. The point is to optimize
          deliberately against a budget, not chase the biggest model by default."
        </Callout>
      </Block>
    </>
  );
}

/* ── Retrieval selector ───────────────────────────────────────── */
function Retrieval() {
  return (
    <>
      <Lede>
        “Add a vector DB” is a reflex, not an answer. Pick retrieval by what the query actually needs —
        often the best system is hybrid.
      </Lede>

      <Block eyebrow="the options" title="Keyword vs vector vs hybrid">
        <OpTable
          cols={["Method", "Strength", "", "Weakness"]}
          rows={[
            { op: "Keyword (BM25)", avg: "exact terms, IDs, code", avgTone: "good", why: "Misses synonyms & paraphrase; no semantic match." },
            { op: "Vector (embeddings)", avg: "meaning, paraphrase", avgTone: "good", why: "Misses exact tokens, rare names, acronyms." },
            { op: "Hybrid + rerank", avg: "best of both", avgTone: "good", why: "More moving parts; the usual production answer." },
            { op: "No retrieval", avg: "model knows it", avgTone: "ok", why: "Only if knowledge fits in context / the base model." },
          ]}
        />
        <Callout kind="tip" title="The senior instinct">
          Start with keyword (cheap, debuggable), add vectors when paraphrase recall matters, then a
          reranker to fix precision. Don't reach for a vector DB until keyword search demonstrably falls
          short.
        </Callout>
      </Block>

      <Block eyebrow="how each works" title="Lexical match vs semantic match">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Keyword / BM25</strong> matches the actual tokens in the query against the actual tokens
          in the documents, weighting rare words more. It's exact, cheap, and fully debuggable — if a
          result shows up you can point at the word that matched. That's exactly why it's unbeatable for{" "}
          <strong>exact terms, product IDs, error codes, and code</strong>, where the literal string is the
          intent. Its blind spot is meaning: ask for "car" and it won't find "automobile."
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Dense vectors</strong> embed query and documents into a shared space where{" "}
          <strong>closeness = meaning</strong>, so a paraphrase lands near the original even with zero words
          in common. That's the strength — and the weakness: it matches the <em>gist</em>, so it can sail
          right past a rare acronym, a SKU, or an exact name because those carry little semantic signal.
        </p>
        <Callout kind="note" title="Why hybrid is the usual production answer">
          Real queries mix both needs — "what's the refund policy for SKU-4471?" wants the <em>meaning</em>{" "}
          of "refund policy" and the <em>exact</em> "SKU-4471." <strong>Hybrid</strong> runs both and fuses
          the scores, so you stop choosing between paraphrase recall and exact-match precision. The extra
          moving parts are usually worth it, which is why hybrid is the default for serious systems.
        </Callout>
      </Block>

      <Block eyebrow="the two-stage shape" title="Recall first, then precision (the reranker)">
        <p className="text-ink-dim leading-relaxed mb-2">
          Production retrieval is almost always <strong>two stages</strong>, and the reason is the{" "}
          <strong>recall-vs-precision split</strong>. The first stage (BM25 + vectors) optimizes{" "}
          <strong>recall</strong>: cast a wide, cheap net to pull back, say, the top 50 candidates — you'd
          rather over-fetch than miss the right doc, because nothing downstream can recover a document you
          never retrieved.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          The second stage optimizes <strong>precision</strong>: a <strong>reranker</strong> (a heavier
          cross-encoder that reads the query and each candidate <em>together</em>) re-scores those 50 and
          keeps the best 3–5 to put in the prompt. It's too slow to run over the whole corpus, but perfect
          over a small candidate set — so the cheap recall stage feeds the expensive precision stage. That's
          where the reranker fits: it fixes the ordering the first stage was too blunt to get right.
        </p>
        <Callout kind="trap" title="Chunking and the embedding model do the heavy lifting">
          Retrieval quality lives upstream of the search method. <strong>Chunking</strong> (too big →
          diluted, noisy matches; too small → fragments that lose context) and your <strong>embedding
          model</strong> (domain fit, dimensionality, what it was trained on) decide more than which index
          you pick. A great reranker can't rescue chunks that split the answer across two pieces, and dense
          search is only as good as the embedder behind it.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "I pick retrieval by what the query needs. Exact terms, IDs, or code → keyword/BM25. Paraphrase
          and meaning → dense vectors. Since real queries need both, the production default is hybrid: fuse
          lexical and semantic, then add a reranker. I think of it as two stages — a cheap wide net for
          recall, then a heavier reranker for precision over the small candidate set. And I'd flag that
          chunking and the embedding model drive quality more than the index choice, and that 'no retrieval'
          is fine when the knowledge already fits in context or the base model knows it."
        </Callout>
      </Block>
    </>
  );
}

/* ── Metric selector ──────────────────────────────────────────── */
function Metric() {
  return (
    <>
      <Lede>
        Picking the wrong metric quietly optimizes the wrong thing. Match the metric to the task and to
        the <em>cost of each error type</em>.
      </Lede>

      <Try label="pick the metric"><MetricSelectorViz /></Try>

      <Block eyebrow="task → metric" title="What to measure, and when">
        <OpTable
          cols={["Task", "Reach for", "", "Because"]}
          rows={[
            { op: "Balanced classification", avg: "accuracy, F1", avgTone: "good", why: "Classes roughly even; F1 balances precision & recall." },
            { op: "Imbalanced / rare positive", avg: "precision, recall, AUC-PR", avgTone: "ok", why: "Accuracy is meaningless when 99% are negative." },
            { op: "Ranking / retrieval", avg: "Recall@k, MRR, nDCG", avgTone: "ok", why: "Order and top-k coverage matter, not raw accuracy." },
            { op: "Regression", avg: "MAE / RMSE", avgTone: "good", why: "RMSE punishes big misses; MAE is robust to outliers." },
            { op: "Generation (LLM)", avg: "golden set + LLM-judge + human", avgTone: "ok", why: "No single number; layer offline, judge, and online signals." },
          ]}
        />
        <Callout kind="trap" title="Precision vs recall is a business call">
          Spam filter → favor precision (don't trash real mail). Cancer screen → favor recall (don't
          miss a case). The metric encodes which mistake is worse — decide that with the stakeholder.
        </Callout>
      </Block>

      <Block eyebrow="define the terms" title="What each metric actually says">
        <p className="text-ink-dim leading-relaxed mb-2">
          The classification family all comes from the confusion matrix (true/false × positive/negative):
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Accuracy</strong> — fraction of all predictions that were right. Intuitive, but lies on imbalanced data (see the trap below).</li>
          <li><strong>Precision</strong> — of everything you <em>flagged positive</em>, how much really was. "When I raise the alarm, am I right?" High precision = few false alarms.</li>
          <li><strong>Recall</strong> — of everything that <em>actually was positive</em>, how much you caught. "Did I miss any?" High recall = few misses.</li>
          <li><strong>F1</strong> — the harmonic mean of precision and recall, a single number when you care about both and want one knob.</li>
          <li><strong>AUC-ROC vs AUC-PR</strong> — both summarize a classifier across all thresholds. ROC plots true-positive vs false-positive rate; <strong>PR</strong> (precision vs recall) is the honest one on <em>imbalanced</em> data, because ROC can look great while precision is actually terrible.</li>
        </ul>
        <p className="text-ink-dim leading-relaxed mb-2">
          For <strong>ranking / retrieval</strong>, position matters: <strong>Recall@k</strong> (did a
          relevant item make the top k?), <strong>MRR</strong> (how high was the <em>first</em> right
          answer — great when there's one correct hit), and <strong>nDCG</strong> (rewards putting the most
          relevant items highest, with graded relevance). For <strong>regression</strong>:{" "}
          <strong>MAE</strong> is the average miss in plain units and shrugs off outliers; <strong>RMSE</strong>{" "}
          squares errors first, so it <em>punishes large misses</em> hard — pick it when one big error is
          much worse than several small ones.
        </p>
        <Callout kind="trap" title="Accuracy lies on imbalanced data">
          If 99% of transactions are legitimate, a model that predicts "legit" every time scores 99%
          accuracy and catches zero fraud. The metric looks brilliant and the system is useless. With a
          rare positive class, drop accuracy and reach for precision, recall, F1, or AUC-PR.
        </Callout>
      </Block>

      <Block eyebrow="the real decision" title="Precision vs recall is a cost-of-error call">
        <p className="text-ink-dim leading-relaxed mb-2">
          Choosing precision vs recall isn't a math preference — it's a <strong>business</strong> question:{" "}
          <em>which error is more expensive?</em> A false positive (you flagged something that was fine) and
          a false negative (you missed something that mattered) almost never cost the same, and the metric
          should encode that asymmetry.
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>False positive is costly → favor precision.</strong> Spam filter: throwing away a real email is worse than letting one spam through.</li>
          <li><strong>False negative is costly → favor recall.</strong> Cancer screen or fraud catch: a miss is dangerous; a false alarm just triggers a cheap second look.</li>
        </ul>
        <Callout kind="note" title="You're really picking a threshold">
          Precision and recall trade off along the decision threshold — tighten it for precision, loosen it
          for recall. So the deliverable is often "where do we set the threshold?", and that's a conversation
          with the stakeholder about the cost of each mistake, not something the model decides for you.
        </Callout>
      </Block>

      <Block eyebrow="the special case" title="Why generation needs layered eval">
        <p className="text-ink-dim leading-relaxed mb-2">
          Open-ended generation breaks single-number metrics: there's no one "correct" string, so accuracy
          and F1 don't apply, and old overlap scores (BLEU/ROUGE) only check word overlap, not whether the
          answer is <em>right</em>. The accepted answer is to <strong>layer</strong> the evaluation instead
          of hunting for one score.
        </p>
        <OpTable
          cols={["Layer", "What it catches", "", "Trade-off"]}
          rows={[
            { op: "Golden set (offline)", avg: "regressions on known cases", avgTone: "good", why: "Fast, cheap, repeatable — but only covers cases you thought to write down." },
            { op: "LLM-as-judge", avg: "quality at scale", avgTone: "ok", why: "Scores open-ended outputs cheaply; needs a rubric and calibration, and can be biased." },
            { op: "Human review", avg: "the truth", avgTone: "ok", why: "Gold standard for nuance, but slow and expensive — sample it, don't run it on everything." },
            { op: "Online (A/B, prod signals)", avg: "real-world impact", avgTone: "good", why: "Thumbs, edits, task success on live traffic — the only metric that reflects actual users." },
          ]}
        />
        <Callout kind="tip" title="The interview answer">
          "Match the metric to the task and to the cost of each error type. Balanced classification →
          accuracy/F1; imbalanced → precision, recall, AUC-PR, because accuracy lies when one class is rare.
          Ranking → Recall@k, MRR, nDCG. Regression → MAE if outliers are noise, RMSE if big misses really
          hurt. Precision-vs-recall is a business call about which mistake is worse. And generation has no
          single number — I layer a golden set, an LLM judge, sampled human review, and online signals."
        </Callout>
      </Block>
    </>
  );
}

/* ── Disambiguation ───────────────────────────────────────────── */
function Disambig() {
  return (
    <>
      <Lede>
        The interview rarely asks “what is RAG” — it asks “is <em>this</em> a RAG problem or a
        fine-tune problem?” Each fork below reduces to one deciding question.
      </Lede>

      <Try label="flip the cards"><DisambiguationViz /></Try>

      <Block eyebrow="the forks" title="One pivot question each">
        <OpTable
          cols={["The fork", "Pivot question", "", "Answer"]}
          rows={[
            { op: "RAG vs fine-tune", avg: "knowledge or behavior?", avgTone: "ok", why: "New facts → RAG. New format/style → fine-tune." },
            { op: "Agent vs pipeline", avg: "is the path dynamic?", avgTone: "ok", why: "Fixed steps → pipeline. Open-ended → agent." },
            { op: "Prompt vs fine-tune", avg: "can examples fix it?", avgTone: "ok", why: "Few-shot first; fine-tune only if it won't stick." },
            { op: "API vs self-host", avg: "is volume high & steady?", avgTone: "ok", why: "No → API. Yes / strict privacy → self-host." },
            { op: "Vector vs keyword", avg: "paraphrase or exact?", avgTone: "ok", why: "Meaning → vector. Exact terms/IDs → keyword." },
            { op: "Small vs large model", avg: "is the task hard?", avgTone: "ok", why: "Route easy → small, hard → large. Don't pay for capability you don't use." },
          ]}
        />
        <Callout kind="tip" title="Memorize the pivot, not the table">
          You won't recall five differences under pressure. You will recall one question. Reduce every
          fork to its pivot and you decide in seconds.
        </Callout>
      </Block>

      <Block eyebrow="why each pivot decides it" title="The one question behind each fork">
        <p className="text-ink-dim leading-relaxed mb-2">
          A pivot question works because it isolates the <em>single axis</em> the whole fork turns on —
          answer it and the rest follows. Here's why each one is load-bearing:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-2 text-sm">
          <li>
            <strong>RAG vs fine-tune → "knowledge or behavior?"</strong> The two act in different places:
            RAG injects facts at inference, fine-tuning changes weights/behavior. So the only thing that
            matters is which kind of gap you have — new facts vs a new way of acting.
          </li>
          <li>
            <strong>Agent vs pipeline → "is the path dynamic?"</strong> If you can draw the steps in advance,
            a fixed pipeline is cheaper, faster, and far easier to debug. You only pay for an agent's
            planning loop when the path genuinely can't be known ahead of time — letting the model decide
            the next step is the entire reason to accept the extra cost and unpredictability.
          </li>
          <li>
            <strong>Prompt vs fine-tune → "can examples fix it?"</strong> Few-shot examples are free and
            instant. If showing a handful of examples makes the behavior stick, you're done — you'd only
            fine-tune when the behavior won't generalize from prompting, or you have too many examples to fit
            in context.
          </li>
          <li>
            <strong>API vs self-host → "is volume high &amp; steady?"</strong> This is the break-even: fixed
            GPU cost only beats variable per-token cost above a high, steady <em>throughput</em> (or when
            privacy/residency forces your hand). Below that line, the API wins on cost and effort both.
          </li>
          <li>
            <strong>Vector vs keyword → "paraphrase or exact?"</strong> Embeddings match meaning; keyword
            matches literal tokens. The query's nature decides it — IDs and code want exact match, "find me
            something like…" wants semantic. (In production the honest answer is usually both: hybrid.)
          </li>
          <li>
            <strong>Small vs large model → "is the task hard?"</strong> Capability you don't use is just cost
            and latency you're paying for nothing. Route easy queries to a small model and reserve the large
            one for the genuinely hard cases — difficulty is the only thing that justifies the bigger bill.
          </li>
        </ul>
        <Callout kind="note" title="The forks aren't independent">
          Notice how they rhyme. "Knowledge vs behavior," "high &amp; steady volume," and "hard vs easy
          task" are the same axes from the earlier tools — Approach decoder, Build vs buy, and the budget
          triangle — compressed into a single sayable question. Disambiguation is those decisions under
          time pressure.
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  framing: <Framing />,
  approach: <Approach />,
  buildbuy: <BuildBuy />,
  budget: <Budget />,
  retrieval: <Retrieval />,
  metric: <Metric />,
  disambig: <Disambig />,
};

export default function Selector() {
  const [active, setActive] = useState("approach");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Decisions · WHICH & WHEN"
      title="The Selector"
      subtitle="Reach for the right tool, not the heaviest one — decode the approach, the build-vs-buy call, and the cost/latency/quality budget."
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
