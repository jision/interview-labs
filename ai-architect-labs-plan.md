# AI Architect Labs, content & build plan

A companion track to **Interview Labs**, optimized for the **AI Architect (GenAI/LLM
systems)** interview. Same conceptual ladder, same architecture, same design system,
so it slots into this repo as four more tools on the landing hub.

> Scope decision: optimized for the **AI architect / applied LLM-systems** role.
> Classic-ML math is included only where it's screen table-stakes; the weight is on
> **system design, trade-off judgment, evaluation/production reliability, and cost
> economics**, which is where architect offers are actually won.

---

## The ladder (parallel to the DSA tools)

| DSA tool | → | AI tool | The question it answers |
|---|---|---|---|
| DSA·LAB (WHAT) | → | **AI·LAB** | *How does the mechanism actually work?* |
| Interview Bench (HOW) | → | **Model Bench** | *What are the recurring solution shapes?* |
| The Identifier (WHICH & WHEN) | → | **The Selector** | *Which approach does this problem want?* |
| The Staff Bench (SHOULD WE) | → | **The Architect's Bench** | *Should we build it this way? Trade-offs?* |

For an architect the center of gravity shifts **down the ladder**: The Selector and
The Architect's Bench carry the most interview signal, the reverse of where a new-grad
ML role would weight. Build accordingly (see Build order).

Suggested accent colors (to register in `App.jsx` `TOOLS`):
`AI·LAB #7c5cff` · `Model Bench #00b4d8` · `The Selector #ffb703` · `Architect's Bench #fb6f3c`

---

## Tool 1, `AI·LAB`, the WHAT (mechanics you can see)

Same content shape as DSA Lab: `<Lede>` → `<Try>` (the visualizer) → `<Block>`s with the
real math/code, an intuition note, and a "what interviewers probe" callout.

Build only the visualizers that get **asked about in screens**, skip the rest as text.

| Topic | Interactive piece, what you manipulate / what it teaches | Priority |
|---|---|---|
| **Attention** | Type a short sentence → see the Q·K·V softmax weight **heatmap**; hover a token to see what it attends to. Teaches the core of every transformer. | ★★★ |
| **Embeddings & vector space** | A 2D scatter of word/sentence vectors; pick a query → highlight cosine-nearest neighbors; drag the query around. Teaches semantic similarity + why retrieval works. | ★★★ |
| **Sampling: temperature / top-k / top-p** | A next-token probability bar chart; sliders reshape it live and a sampled token is drawn. Teaches determinism vs creativity, the #1 "why is my LLM flaky" question. | ★★★ |
| **Tokenization (BPE)** | Type text → watch it split into tokens with IDs + a running token/cost counter. Teaches context limits and why cost is per-token. | ★★ |
| **Gradient descent / backprop** | A ball descending a 1-D/2-D loss surface; learning-rate slider shows divergence vs slow convergence. | ★★ |
| **Bias–variance / overfitting** | Slider for model complexity; train vs validation error curves diverge. The classic fundamentals question. | ★★ |
| Transformer block (residual + LayerNorm + FFN) | Static assembled diagram, light interactivity. | ★ |
| Softmax / activations / normalization | Tiny mechanism demos, optional. | ★ |

**Reality check for architects:** this tool is the *most fun to build and the lowest
marginal interview value*, it's screened in ~15 min. Build the top 3 (★★★) well, treat
the rest as nice-to-have.

---

## Tool 2, `Model Bench`, the HOW (approaches & patterns)

The "interview patterns" equivalent: the recurring solution shapes, each with when-to-use,
a template/diagram, and the gotchas.

| Pattern | Interactive piece | Priority |
|---|---|---|
| **RAG pipeline** | A pipeline builder: chunk size / overlap / top-k / reranker toggles → see which chunks get retrieved and fed to the prompt. Teaches the whole retrieval stack. | ★★★ |
| **Agentic loop (ReAct / tool-use)** | A stepped trace: thought → action → observation → … with a tool-call panel. Teaches planning, tool selection, loop termination. | ★★★ |
| **Evaluation patterns** | Side-by-side: offline metric vs **LLM-as-judge** vs golden set on a sample; show where each agrees/disagrees. | ★★★ |
| **Fine-tune vs LoRA/PEFT vs full** | Diagram of which weights move + a params/cost/VRAM comparison. | ★★ |
| **Prompt patterns** | Few-shot / CoT / structured-output / self-consistency, with before/after examples. | ★★ |
| Quantization / distillation | Size vs quality vs latency trade-off table + a bit-width slider. | ★★ |
| Classic ML families | linear/logistic, trees, **GBM/XGBoost**, kNN, clustering, when each wins. | ★★ |
| Transformer variants | encoder / decoder-only / encoder-decoder, what each is for. | ★ |
| Recommendation | collaborative filtering, **two-tower**, ranking. | ★ |
| Diffusion / multimodal | light conceptual treatment. | ★ |

---

## Tool 3, `The Selector`, WHICH & WHEN (recognition & decisions) ⭐

Your Identifier reborn for AI. **Most architect-flavored tool**, interviews test whether
you reach for the right tool, not whether you can derive backprop. Cheap to build (mostly
decision logic + flashcards), high differentiation.

| Widget | What it does | Priority |
|---|---|---|
| **Prompt → RAG → fine-tune → pretrain decision tree** | Answer a few questions about the problem → it lands you on the right approach with the reasoning. The signature widget. | ★★★ |
| **Cost / latency / quality budget decoder** | Direct analog of your DSA "constraint decoder": enter req/s, latency SLO, budget → it ranges the feasible model/serving choices. | ★★★ |
| **Build vs buy decoder** | API vs self-host: volume, data sensitivity, latency, team → recommendation + the break-even logic. | ★★ |
| **Metric selector** | Task type → the right eval metric(s) and their failure modes. | ★★ |
| Retrieval selector | vector vs keyword vs hybrid vs no-retrieval. | ★★ |
| Open vs closed model selector | data residency, cost, control, capability. | ★ |
| **Disambiguation flashcards** | "They said _X_, is this a RAG problem or a fine-tune problem?" Same format as your DSA disambiguation deck. | ★★ |

---

## Tool 4, `The Architect's Bench`, SHOULD WE (system design & judgment) ⭐⭐ headline

Your Staff Bench equivalent and **the single most important tool for this role**, system
design + trade-off articulation is 60–70% of the actual architect interview. Each topic =
a structured design walkthrough (requirements → components → data flow → bottlenecks →
trade-offs), a few backed by interactive estimators.

### Design walkthroughs
| Topic | Why it matters |
|---|---|
| **Design a RAG / enterprise knowledge assistant** | The canonical 2026 architect question. |
| **Design an LLM serving stack** | Batching, **KV cache**, GPU memory, throughput vs latency. |
| **Design ML monitoring & evaluation** | Drift, hallucination detection, feedback loops, online vs offline eval. |
| **Design a multi-agent system** | Orchestration, tool routing, failure/loop control, cost blowups. |
| **Design a recommendation / ranking system** | Candidate gen → ranking → re-ranking. |
| Feature store / training pipeline | Offline/online parity, point-in-time correctness. |
| Content moderation / classification at scale | Latency, human-in-the-loop, threshold tuning. |
| Guardrails / safety / responsible AI | Prompt injection, PII, jailbreaks, output filtering. |

### Judgment + estimators
| Topic | Interactive piece | Priority |
|---|---|---|
| **AI capacity & cost estimation** | A calculator: users × req × tokens × $/token (+ GPU $/hr for self-host) → monthly cost + the dominant cost driver. The AI version of your DSA estimator. | ★★★ |
| **LLM serving capacity** | Tokens/s, batch size, KV-cache memory → concurrent users a GPU can hold. | ★★★ |
| **Trade-off triangle: cost vs latency vs quality** | The "CAP theorem" of AI, drag one corner, see the others give. | ★★ |
| "Numbers to memorize" | Token costs, GPU memory rules of thumb, embedding dims, context limits, latency budgets. | ★★ |

---

## Priority tiers (impact × engineering value × interactive payoff)

**Tier 1, build first (architect offers are won here):**
1. The Architect's Bench, RAG design, serving stack, eval/monitoring + the two estimators.
2. The Selector, the approach decision tree + cost/latency/quality decoder.
3. From AI·LAB / Model Bench: **Attention**, **Embeddings**, **RAG pipeline** visualizers
   (the "explain attention / explain RAG" screen questions everyone gets).

**Tier 2, backs up Tier 1:** sampling/temperature, tokenizer, agentic loop, evaluation
patterns, fine-tune/LoRA, build-vs-buy.

**Tier 3, depth & breadth:** classic ML families, bias-variance, gradient descent,
recommendation internals, diffusion, distributed training.

---

## Build status, ALL MILESTONES COMPLETE ✅

Every tool, topic, and interactive widget below is built, wired into the hub, builds clean
(`npm run build`, 91 modules), and was browser-verified (all 28 topics render, zero console
errors, widgets respond). **20 interactive widgets** across the four tools.

1. **M0, scaffold.** ✅ 4 tools registered in `App.jsx`; hub split into two labeled tracks.
2. **M1, The Architect's Bench.** ✅ RAG/serving/eval/multi-agent design walkthroughs +
   `CostEstimatorViz`, `ServingEstimatorViz`, `TradeoffTriangleViz`.
3. **M2, The Selector.** ✅ `ApproachDecoderViz`, `BudgetDecoderViz`, `BuildBuyViz`,
   `MetricSelectorViz`, `DisambiguationViz`.
4. **M3, Tier-1 visualizers.** ✅ `AttentionViz`, `EmbeddingsViz` (AI·LAB), `RagPipelineViz`.
5. **M4, Tier 2 fill-in.** ✅ `SamplingViz`, `TokenizerViz`, `AgentLoopViz`,
   `EvalPatternsViz`, `FineTuneViz`, `PromptPatternsViz`.
6. **M5, Tier 3 breadth.** ✅ Classic ML families, `BiasVarianceViz`, `GradientDescentViz`,
   recommendation, quantization.

> Next: review pass (correctness of the baked fixtures/numbers, copy, visual polish).

---

## How it slots into the existing repo

- **Architecture:** identical to the current tools, a `TOPICS` array, a `CONTENT` map of
  `topic → component`, and `withAccent(ACCENT)` binding the tool color to `Block`/`Try`.
  Visualizers live in a per-tool subfolder (`src/tools/ailab/`, `src/tools/architect/`, …).
- **Design system:** reuse `src/components/` as-is (`Card`, `SectionTitle`, `Callout`,
  `CodeBlock`, `ComplexityTag`, `Btn`, `Tag`, `Lede`, `Try`, `Block`, `OpTable`,
  `ToolShell`). New accent colors go in `App.jsx`; global tokens stay in `index.css`.
- **Constraints to keep:** React + inline styles / Tailwind v4 tokens only, **no new
  heavy deps**. The AI visualizers (heatmaps, 2-D scatter, bar charts, pipeline diagrams)
  are all doable with hand-drawn SVG/canvas + React state, same as the DSA visualizers.
  Embeddings/attention use small **precomputed** fixtures (a fixed vocab + vectors baked
  into the file), no model runs in the browser, no network calls.
- **Landing hub:** add a section divider or a second row of cards so "Interview Labs"
  cleanly hosts both the DSA track and the AI Architect track.

---

## Decisions (locked)

- **Hub:** one combined "Interview Labs" hub with **two labeled rows**, a *DSA* track
  (the existing four tools) and an *AI Architect* track (these four). Least friction, one
  deploy. ✅
- **Classic ML:** include as a **small Tier-3 section**, but written to actually *teach*,
  each topic gets enough intuition + a worked example that a reader grasps it, not just a
  name-drop list. ✅
- **Embedding/attention data:** **bake a small precomputed fixture** (tiny hand-curated
  vocab + vectors/weights stored in the file) so the visualizers feel genuinely interactive
 , hover, query, re-rank against real-looking numbers, with zero deps and no model in the
  browser. ✅
