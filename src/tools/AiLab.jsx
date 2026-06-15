import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";
import AttentionViz from "./ailab/AttentionViz.jsx";
import SamplingViz from "./ailab/SamplingViz.jsx";
import EmbeddingsViz from "./ailab/EmbeddingsViz.jsx";
import TokenizerViz from "./ailab/TokenizerViz.jsx";
import GradientDescentViz from "./ailab/GradientDescentViz.jsx";
import BiasVarianceViz from "./ailab/BiasVarianceViz.jsx";

const ACCENT = "#7c5cff";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "attention", label: "Attention", group: "Transformer core" },
  { id: "embeddings", label: "Embeddings", group: "Transformer core" },
  { id: "tokenization", label: "Tokenization", group: "Transformer core" },
  { id: "sampling", label: "Sampling & decoding", group: "Generation" },
  { id: "gradient", label: "Gradient descent", group: "Training" },
  { id: "biasvar", label: "Bias–variance", group: "Training" },
  { id: "block", label: "The transformer block", group: "Architecture" },
];

/* ── Attention ────────────────────────────────────────────────── */
function Attention() {
  return (
    <>
      <Lede>
        Attention is the one mechanism worth being able to draw on a whiteboard. Every token
        emits a <strong>query</strong>, every token offers a <strong>key</strong>; their dot
        product (softmaxed) decides how much each token's <strong>value</strong> flows into the
        next representation. That's how “it” figures out it means “cat”.
      </Lede>

      <Try label="attention heatmap"><AttentionViz /></Try>

      <Block eyebrow="the formula" title="Scaled dot-product attention">
        <CodeBlock
          title="python"
          code={`# Q, K, V: (seq_len, d_k).  One head.
scores = Q @ K.T / sqrt(d_k)     # (seq, seq) similarity of every q to every k
weights = softmax(scores, axis=-1)  # each row sums to 1
out = weights @ V                # weighted blend of value vectors`}
        />
        <div className="rounded-lg border border-line bg-[#0e1018] p-3 my-3 overflow-x-auto">
          <div className="flex items-center gap-2 font-mono text-[11px] whitespace-nowrap">
            {[
              { t: "Q", s: "n×d", c: "#7c5cff" },
              { t: "·Kᵀ", s: "d×n", c: "#7c5cff" },
              { t: "→ scores", s: "n×n", c: "#fbbf24" },
              { t: "→ softmax", s: "n×n", c: "#fbbf24" },
              { t: "·V", s: "n×d", c: "#4ade80" },
              { t: "→ out", s: "n×d", c: "#4ade80" },
            ].map((b, i) => (
              <span key={i} className="inline-flex flex-col items-center px-2 py-1 rounded" style={{ background: `color-mix(in srgb, ${b.c} 12%, transparent)` }}>
                <span style={{ color: b.c }}>{b.t}</span>
                <span className="text-[9px] text-ink-faint">{b.s}</span>
              </span>
            ))}
          </div>
          <div className="font-mono text-[10px] text-ink-faint mt-2">
            the <span style={{ color: "#fbbf24" }}>n×n</span> scores matrix is why attention is{" "}
            <span className="text-ink">O(n²)</span> in sequence length — double the context, quadruple this block.
          </div>
        </div>
        <p className="text-ink-dim leading-relaxed mt-2">
          The <code className="font-mono">/ sqrt(d_k)</code> keeps dot products from exploding as
          dimensions grow, which would otherwise saturate the softmax into a hard argmax.{" "}
          <strong>Multi-head</strong> attention just runs this several times in parallel with
          different learned projections, so different heads specialize (syntax, coreference, position).
        </p>
        <Callout kind="tip" title="The interview answer">
          “Self-attention lets every token look at every other token in one step — O(n²) but fully
          parallel, unlike an RNN's sequential O(n). The softmax over Q·K scores is a soft, learned
          lookup; V carries the content that gets mixed.”
        </Callout>
        <Callout kind="trap" title="Why context length is expensive">
          The score matrix is <code className="font-mono">n × n</code>. Doubling context quadruples
          attention compute and memory — the entire reason long-context and tricks like FlashAttention,
          sliding-window, and KV-cache exist.
        </Callout>
      </Block>

      <Block eyebrow="the intuition" title="Query, key, value — a soft dictionary lookup">
        <p className="text-ink-dim leading-relaxed mb-2">
          Forget the matrices for a second. Each token produces three vectors. The{" "}
          <strong>query</strong> is "what am I looking for?", the <strong>key</strong> is "what do I
          offer?", and the <strong>value</strong> is "the content I'll hand over if you pick me." A
          token's query is compared (dot product) against every token's key; the better the match, the
          more of that token's value gets mixed into the output. It's a fuzzy, learned version of a
          Python dict lookup — except instead of one exact key match, you get a weighted blend of{" "}
          <em>all</em> values, weighted by relevance.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          Crucially, Q, K, and V are all derived from the same input by three separate learned weight
          matrices (<code className="font-mono">W_Q</code>, <code className="font-mono">W_K</code>,{" "}
          <code className="font-mono">W_V</code>). The model learns what to ask for, what to advertise,
          and what to pass along — these don't have to be the same thing.
        </p>
        <Callout kind="note" title="Self- vs cross-attention">
          In <strong>self-attention</strong>, Q, K, and V all come from the same sequence — tokens look
          at each other. In <strong>cross-attention</strong> (the decoder of a translation model, for
          example), the queries come from one sequence while the keys and values come from another — the
          output looks back at the encoded input. Same math, different source for Q vs K/V.
        </Callout>
      </Block>

      <Block eyebrow="why several at once" title="Multi-head: many relations in parallel">
        <p className="text-ink-dim leading-relaxed mb-2">
          A single attention pattern can only emphasize one kind of relationship at a time.{" "}
          <strong>Multi-head attention</strong> splits the vector into several lower-dimensional slices
          and runs attention independently on each, then concatenates the results. Because each head has
          its own <code className="font-mono">W_Q/W_K/W_V</code>, the heads specialize — one might track
          syntax, another coreference ("it" → "cat"), another nearby position. (This is the same
          multi-head idea you'll see in <em>The transformer block</em>; here we're zooming into one head.)
        </p>
        <Callout kind="tip" title="The interview answer">
          "Multi-head attention runs several attention computations in parallel on different learned
          projections of the input, so each head can capture a different type of relationship — then the
          results are concatenated and projected back. The total compute is roughly the same as one big
          head, but it's far more expressive."
        </Callout>
      </Block>

      <Block eyebrow="generation" title="Causal masking and the KV cache">
        <p className="text-ink-dim leading-relaxed mb-2">
          When a model <em>generates</em> text, a token must never attend to tokens that come after it —
          otherwise it would be cheating by peeking at the future during training.{" "}
          <strong>Causal (autoregressive) masking</strong> enforces this by setting the upper-triangular
          half of the score matrix to <code className="font-mono">−∞</code> before the softmax, so future
          positions get exactly zero weight. This single mask is the only structural difference between a
          GPT-style decoder and a BERT-style encoder.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`scores  = Q @ K.T / sqrt(d_k)
scores += mask              # mask[i, j] = -inf when j > i (future)
weights = softmax(scores)   # future positions -> 0 weight
out     = weights @ V`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Generation happens one token at a time, and each new token re-attends to <em>every</em>
          previous one. Recomputing all those keys and values every step would be wasteful, so the model{" "}
          <strong>caches the K and V vectors</strong> of past tokens — the <strong>KV cache</strong>. Each
          new step then only computes K/V for the single new token and reuses the rest.
        </p>
        <Callout kind="tip" title="Why the KV cache matters">
          It turns each decode step from O(n²) work (re-encoding the whole prefix every time) into roughly
          O(n) (the new token attends to n cached keys) — which is why streaming output is fast. The cost
          is memory: the cache grows linearly with context length × layers × heads, and
          at long contexts it can dwarf the model's own weights in GPU memory — which is why long-context
          serving is so expensive.
        </Callout>
      </Block>

      <Block eyebrow="the long-context problem" title="Taming O(n²)">
        <p className="text-ink-dim leading-relaxed mb-2">
          The quadratic cost is the central engineering headache of long context. The main mitigations
          attack it from two angles — make the exact computation cheaper, or approximate it.
        </p>
        <OpTable
          cols={["Technique", "Idea", "", "Trade-off"]}
          rows={[
            { op: "FlashAttention", avg: "exact, IO-aware", avgTone: "good", why: "Same result, but never writes the full n×n matrix to memory — tiles it in fast on-chip SRAM. A speed/memory win with no accuracy loss." },
            { op: "Sliding-window", avg: "local attention", avgTone: "ok", why: "Each token attends only to a fixed window of recent tokens → O(n·w). Cheap, but loses long-range links unless stacked." },
            { op: "Sparse attention", avg: "skip most pairs", avgTone: "ok", why: "Attend to a structured subset (strided, global tokens). Approximate; quality depends on the pattern matching the data." },
          ]}
        />
        <Callout kind="note" title="Exact vs approximate">
          FlashAttention is the one that's free — it computes the <em>same</em> attention, just smarter
          about memory traffic, and is now standard. Sliding-window and sparse attention change{" "}
          <em>what</em> gets attended to, trading some quality for sub-quadratic cost.
        </Callout>
      </Block>
    </>
  );
}

/* ── Embeddings ───────────────────────────────────────────────── */
function Embeddings() {
  return (
    <>
      <Lede>
        An embedding turns a token, sentence, or image into a vector where{" "}
        <strong>geometric closeness = semantic closeness</strong>. This is the substrate of
        retrieval, clustering, recommendation, and classification — get the embedding right and half
        the system designs itself.
      </Lede>

      <Try label="embedding space"><EmbeddingsViz /></Try>

      <Block eyebrow="the core idea" title="Meaning becomes geometry">
        <p className="text-ink-dim leading-relaxed mb-2">
          “king − man + woman ≈ queen” is the cliché, but the useful version is: documents about the
          same thing land near each other, so a query vector's <strong>nearest neighbors</strong> are
          its best matches. Similarity is almost always <strong>cosine</strong> (angle), not
          Euclidean distance, because magnitude often just encodes length/frequency.
        </p>
        <CodeBlock
          title="python"
          code={`import numpy as np
def cosine(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))
# retrieval = embed(query) -> top-k nearest doc vectors by cosine`}
        />
        <Callout kind="tip" title="Architect-level point">
          The embedding model and the chunking strategy decide retrieval quality far more than the LLM
          does. A great generator over bad retrieval is a confident liar.
        </Callout>
        <Callout kind="note" title="Dimensions & cost">
          Typical text embeddings are 384–3072 dims. Higher isn't always better — it costs more to
          store and search, and a well-trained 768-dim model often beats a generic 3072-dim one.
        </Callout>
      </Block>

      <Block eyebrow="how it's learned" title="A training objective places related things nearby">
        <p className="text-ink-dim leading-relaxed mb-2">
          Embeddings aren't designed by hand — the geometry <em>emerges</em> from a training objective.
          Historically, <strong>word2vec</strong> learned word vectors by predicting which words appear in
          the same context ("you shall know a word by the company it keeps"); words used in similar
          contexts ended up with similar vectors. Modern sentence and document embeddings are trained with{" "}
          <strong>contrastive learning</strong>: the model is shown pairs that <em>should</em> be close
          (a question and its answer, two paraphrases) and pairs that should be far apart, and it's
          pushed to pull positives together and shove negatives away.
        </p>
        <Callout kind="note" title="Why contrastive learning won">
          It directly optimizes the thing you actually use embeddings for — relative distance. A model
          trained to make matching pairs closer than mismatched ones produces a space where nearest-
          neighbor search just works, which is exactly what retrieval needs.
        </Callout>
      </Block>

      <Block eyebrow="what gets embedded" title="Token, sentence, and document embeddings">
        <p className="text-ink-dim leading-relaxed mb-2">
          The word "embedding" covers a few different things. <strong>Token embeddings</strong> are the
          lookup vectors inside a model — one per vocab entry — that are the model's <em>input</em>.{" "}
          <strong>Sentence/passage embeddings</strong> collapse a whole chunk of text into one vector
          (often by pooling token vectors), and these are what you store in a vector database for search.{" "}
          <strong>Document embeddings</strong> represent a longer unit, usually by chunking the document
          and embedding each chunk. The same word gets a different sentence-level vector depending on
          context — "bank" near "river" lands far from "bank" near "loan."
        </p>
        <Callout kind="trap" title="Token embeddings ≠ what you search with">
          A common mix-up: the embeddings you call an embedding API for (sentence-level, contextual) are
          not the raw token-lookup table inside the model. For retrieval you almost always want a model
          trained specifically to produce good <em>whole-text</em> vectors.
        </Callout>
      </Block>

      <Block eyebrow="comparing vectors" title="Cosine, dot product, Euclidean — and why normalization matters">
        <OpTable
          cols={["Metric", "Measures", "", "When it's used"]}
          rows={[
            { op: "Cosine", avg: "angle only", avgTone: "good", why: "Ignores magnitude — pure direction/meaning. The default for text similarity." },
            { op: "Dot product", avg: "angle × magnitude", avgTone: "ok", why: "Cheaper, but magnitude leaks in. Equals cosine only when vectors are unit-normalized." },
            { op: "Euclidean (L2)", avg: "straight-line distance", avgTone: "ok", why: "On normalized vectors it's monotonic with cosine, so it ranks the same. Common in some indexes." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The punchline: if you <strong>L2-normalize</strong> every vector to unit length first, cosine,
          dot product, and Euclidean all rank neighbors identically — so the choice becomes about speed and
          what your index supports. Magnitude often just encodes nuisance signal like text length or word
          frequency, which is exactly why cosine (angle-only) is the safe default.
        </p>
        <Callout kind="warn" title="Match the metric to the model">
          Use the similarity metric the embedding model was <em>trained</em> with. A model trained for
          cosine and queried with raw dot product (without normalizing) can return subtly worse results.
          When in doubt, normalize and use cosine.
        </Callout>
      </Block>

      <Block eyebrow="what they're for" title="The analogy, its limits, and real uses">
        <p className="text-ink-dim leading-relaxed mb-2">
          "king − man + woman ≈ queen" is the famous demo: relationships show up as consistent
          <em> directions</em> in the space. But treat it as a party trick, not a guarantee — the analogy
          is fragile, often only works for cherry-picked words, and modern contextual embeddings don't
          cleanly support this kind of vector arithmetic. The <em>useful</em> property is simpler: similar
          things are near each other.
        </p>
        <OpTable
          cols={["Use", "What you do", "", "Why embeddings fit"]}
          rows={[
            { op: "Semantic search / RAG", avg: "embed query, find nearest docs", avgTone: "good", why: "Matches on meaning, not keywords — retrieves the context an LLM then answers from." },
            { op: "Clustering", avg: "group nearby vectors", avgTone: "good", why: "Discover topics/themes with no labels (k-means, HDBSCAN over the vectors)." },
            { op: "Classification", avg: "train a small head on vectors", avgTone: "good", why: "Embeddings are strong features; a tiny classifier on top often beats hand-tuned text features." },
            { op: "Recommendation", avg: "nearest items to what you liked", avgTone: "ok", why: "Embed items/users into one space; 'more like this' is a neighbor lookup." },
            { op: "Dedup / near-dup", avg: "flag pairs above a threshold", avgTone: "ok", why: "Catches paraphrases and reworded copies that exact-match would miss." },
          ]}
        />
        <Callout kind="tip" title="Architect-level point (worth repeating)">
          In a RAG system, the embedding model and the chunking strategy set the ceiling on quality —
          the best generator can't answer from context it was never given. Pick/evaluate the embedding
          model on <em>your</em> data and tune chunk size before you reach for a bigger LLM.
        </Callout>
      </Block>
    </>
  );
}

/* ── Tokenization ─────────────────────────────────────────────── */
function Tokenization() {
  return (
    <>
      <Lede>
        Models don't see characters or words — they see <strong>tokens</strong>, sub-word chunks from
        a fixed vocabulary (BPE). This is why you're billed per token, why context limits exist, and
        why models miscount letters in “strawberry”.
      </Lede>

      <Try label="tokenizer"><TokenizerViz /></Try>

      <Block eyebrow="how BPE works" title="Frequent byte pairs become single tokens">
        <p className="text-ink-dim leading-relaxed mb-2">
          Byte-Pair Encoding starts from raw bytes and greedily merges the most frequent adjacent pair,
          over and over, until it hits a target vocab size. Common words become one token; rare words
          fragment. A rough rule: <strong>~4 characters ≈ 1 token</strong>, or ~0.75 words/token in
          English.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`"tokenization"   -> ["token", "ization"]      (2 tokens)
"strawberry"     -> ["str", "aw", "berry"]      (model can't "see" the r's)
"  GPT-4"        -> [" G", "PT", "-", "4"]      (spaces & casing matter)`}
        />
        <Callout kind="trap" title="Practical consequences">
          Numbers, code, and non-English text tokenize less efficiently (more tokens per character) —
          which inflates cost and eats context budget. JSON and whitespace are surprisingly expensive.
        </Callout>
      </Block>

      <Block eyebrow="why not words or characters" title="The vocab-size vs sequence-length trade-off">
        <p className="text-ink-dim leading-relaxed mb-2">
          Why sub-words at all? It's a balancing act between two bad extremes.{" "}
          <strong>Word-level</strong> tokens keep sequences short but need a gigantic vocabulary and choke
          on any word they've never seen — every typo, name, or new term becomes an{" "}
          <strong>out-of-vocabulary (OOV)</strong> blank. <strong>Character-level</strong> tokens have a
          tiny vocabulary and never hit OOV, but sequences get enormously long, so the O(n²) attention
          cost explodes and the model wastes capacity relearning how letters form words.
        </p>
        <OpTable
          cols={["Granularity", "Vocab size", "", "Problem"]}
          rows={[
            { op: "Word", avg: "huge (100k+)", avgTone: "bad", why: "OOV on anything unseen; can't handle typos, new names, or morphology." },
            { op: "Character", avg: "tiny (~100)", avgTone: "bad", why: "Sequences 4–5× longer → quadratic attention blows up; weak signal per token." },
            { op: "Sub-word (BPE)", avg: "~30k–100k", avgTone: "good", why: "Common words = 1 token, rare words split into pieces. No OOV, manageable length." },
          ]}
        />
        <Callout kind="note" title="No-OOV is the quiet superpower">
          Because BPE can always fall back to bytes/characters, it can encode <em>any</em> string —
          emoji, code, a made-up word — without an "unknown" token. That robustness is a big reason
          sub-word tokenization became universal.
        </Callout>
      </Block>

      <Block eyebrow="bpe step by step" title="How the merges are learned">
        <p className="text-ink-dim leading-relaxed mb-2">
          BPE is trained once, before the model, on a big text corpus. In plain steps:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`1. Start: every character (or byte) is its own token.
2. Count all adjacent token pairs in the corpus.
3. Merge the single most frequent pair into one new token.
4. Repeat 2–3 until you hit the target vocab size (e.g. 50k).

  "low low lower"  ->  l o w _ l o w _ l o w e r
  most frequent pair "l o"  -> merge to "lo"
  next "lo w"               -> merge to "low"   ... and so on`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The learned merge list <em>is</em> the tokenizer. At inference time it applies the same merges
          in the same order, so frequent words collapse to one token and rare ones stay fragmented. The
          vocabulary is frozen — the model never invents new tokens later.
        </p>
        <Callout kind="note" title="Special tokens">
          Beyond text pieces, tokenizers reserve a few <strong>special tokens</strong> the model treats as
          control signals: <code className="font-mono">BOS</code>/<code className="font-mono">EOS</code>{" "}
          (beginning/end of sequence — EOS is how the model says "I'm done"),{" "}
          <code className="font-mono">PAD</code> (filler to make a batch rectangular), and chat-template
          markers that delimit system/user/assistant turns. Mismatched special tokens are a common,
          maddening source of garbage output.
        </Callout>
      </Block>

      <Block eyebrow="the famous failure" title="Why models miscount the r's in strawberry">
        <p className="text-ink-dim leading-relaxed mb-2">
          The model never sees the letters s-t-r-a-w-b-e-r-r-y. It sees something like{" "}
          <code className="font-mono">["str", "aw", "berry"]</code> — three opaque IDs. Asking it to count
          the r's is like asking you to count the strokes in a character you only recognize as a whole
          shape. It's not a reasoning failure so much as a <strong>perception</strong> failure: the
          relevant detail was destroyed at the tokenizer before the model ever looked.
        </p>
        <Callout kind="trap" title="The interview answer">
          "Character-level tasks — counting letters, reversing strings, spelling — are hard because the
          model operates on sub-word tokens, not characters. The information is gone before inference
          starts. It's a tokenization artifact, not a sign the model 'can't reason'."
        </Callout>
        <Callout kind="trap" title="Why numbers and code are awkward too">
          Numbers often split in inconsistent ways (<code className="font-mono">1234</code> might be one
          token while <code className="font-mono">1235</code> splits into two), which makes exact
          arithmetic brittle. Code and non-English scripts also fragment into many tokens, raising cost
          and burning context. Modern tokenizers special-case digits to help, but it's still a known
          rough edge.
        </Callout>
      </Block>

      <Block eyebrow="why you should care" title="Tokens are your budget and your bill">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two practical truths follow from everything above. First, the <strong>context window</strong> is
          measured in tokens, not words or characters — so verbose formats (JSON, heavy whitespace,
          non-English text) eat into how much you can actually fit. Second, you're <strong>billed per
          token</strong>, input and output, so the same idea costs more if it tokenizes inefficiently.
        </p>
        <Callout kind="tip" title="Rule of thumb (English)">
          Roughly <strong>~4 characters ≈ 1 token</strong>, or about <strong>0.75 words per token</strong>.
          Useful for back-of-envelope cost and context-budget estimates — but it's only a rule of thumb;
          actual counts vary by language and content. When it matters, count with the model's real
          tokenizer.
        </Callout>
      </Block>
    </>
  );
}

/* ── Sampling ─────────────────────────────────────────────────── */
function Sampling() {
  return (
    <>
      <Lede>
        A model outputs a probability over the whole vocabulary for the <em>next</em> token. How you
        pick from that distribution — greedy, temperature, top-k, top-p — is what makes output
        deterministic vs creative, and is the first knob to reach for when generations misbehave.
      </Lede>

      <Try label="decoding playground"><SamplingViz /></Try>

      <Block eyebrow="the knobs" title="Temperature, top-k, top-p">
        <OpTable
          cols={["Knob", "Effect", "", "When to use"]}
          rows={[
            { op: "temperature", avg: "flatten/sharpen", avgTone: "ok", why: "↑ = more random/creative, ↓ = focused. 0 = greedy/deterministic." },
            { op: "top-k", avg: "keep k best", avgTone: "ok", why: "Hard cap on candidates; blunt but predictable." },
            { op: "top-p", avg: "keep mass p", avgTone: "ok", why: "Nucleus — adapts the cutoff to the distribution's shape. Usually preferred." },
          ]}
        />
        <Callout kind="tip" title="Defaults that work">
          Classification / extraction / code → temperature 0 (you want the same answer every time).
          Brainstorming / writing → 0.7–1.0. Combine top-p ≈ 0.9 with a moderate temperature; rarely
          touch top-k if you have top-p.
        </Callout>
        <Callout kind="warn" title="Determinism is not guaranteed">
          Even at temperature 0, batching, hardware, and floating-point can produce tiny variations.
          For reproducibility set a seed where the API supports it, and don't promise bit-exact output.
        </Callout>
      </Block>

      <Block eyebrow="the pipeline" title="Logits → softmax → a distribution over the vocab">
        <p className="text-ink-dim leading-relaxed mb-2">
          For every step, the model outputs one raw score — a <strong>logit</strong> — for each token in
          the vocabulary. Logits are unbounded real numbers, not probabilities.{" "}
          <strong>Softmax</strong> turns them into a probability distribution: exponentiate each, then
          normalize so they sum to 1. <em>How</em> you then pick a token from that distribution is
          "decoding," and it's a choice made <em>outside</em> the model — the same weights can be
          deterministic or wildly creative depending on these knobs.
        </p>
        <CodeBlock
          title="python"
          code={`logits = model(context)          # one raw score per vocab token, e.g. shape (50000,)
probs  = softmax(logits / T)     # T = temperature; -> probabilities summing to 1
# greedy:   next = argmax(probs)            (always the single most likely)
# sample:   next = random_choice(probs)     (draw proportional to probability)`}
        />
        <Callout kind="note" title="Greedy vs sampling">
          <strong>Greedy / argmax</strong> always takes the single highest-probability token —
          repeatable, but prone to dull, looping text. <strong>Sampling</strong> draws randomly in
          proportion to the probabilities, which is what gives output variety. Temperature, top-k, and
          top-p all just <em>reshape the distribution before you sample</em>.
        </Callout>
      </Block>

      <Block eyebrow="the math intuition" title="Temperature is logit scaling">
        <p className="text-ink-dim leading-relaxed mb-2">
          Temperature <code className="font-mono">T</code> divides the logits before softmax. Dividing by
          a small <code className="font-mono">T</code> (&lt; 1) magnifies the gaps between logits, so the
          softmax gets <strong>peakier</strong> — the top token dominates. Dividing by a large{" "}
          <code className="font-mono">T</code> (&gt; 1) shrinks the gaps, so probabilities <strong>flatten</strong>{" "}
          toward uniform and rare tokens get a real chance. In the limit, <code className="font-mono">T → 0</code>{" "}
          becomes pure argmax (greedy); <code className="font-mono">T → ∞</code> becomes a uniform random pick.
        </p>
        <Callout kind="note" title="Temperature changes odds, not order">
          Scaling all logits by the same factor never re-ranks the tokens — the most likely token stays
          most likely. Temperature only changes <em>how much</em> probability mass sits on the leaders vs
          the long tail. That's why T=0 is exactly greedy.
        </Callout>
      </Block>

      <Block eyebrow="trimming the tail" title="top-k and top-p (nucleus)">
        <p className="text-ink-dim leading-relaxed mb-2">
          Even after temperature, the long tail of barely-plausible tokens can occasionally get picked and
          derail a generation. <strong>top-k</strong> and <strong>top-p</strong> are truncation filters
          that discard that tail <em>before</em> sampling, then re-normalize the survivors.
        </p>
        <OpTable
          cols={["Filter", "Keeps", "", "Behavior"]}
          rows={[
            { op: "top-k", avg: "the k highest tokens", avgTone: "ok", why: "Fixed count. Blunt: keeps too few when the model is unsure, too many when it's confident." },
            { op: "top-p (nucleus)", avg: "smallest set summing to p", avgTone: "good", why: "Adapts to the distribution's shape — few tokens when confident, more when uncertain. Usually preferred." },
          ]}
        />
        <Callout kind="note" title="Why top-p usually wins">
          top-k uses the same cutoff whether the model is certain or torn; top-p (e.g. 0.9 = "keep tokens
          covering 90% of the probability mass") lets the cutoff breathe with the model's confidence. They
          can be combined, but top-p alone is a sensible default.
        </Callout>
      </Block>

      <Block eyebrow="anti-repetition" title="Frequency, presence, and repetition penalties">
        <p className="text-ink-dim leading-relaxed mb-2">
          LLMs can fall into loops ("...and that's great. And that's great. And..."). Penalties fight this
          by docking the logits of tokens the model has already produced.{" "}
          <strong>Frequency penalty</strong> scales with how <em>often</em> a token has appeared (the more
          you've said it, the harder it's pushed down). <strong>Presence penalty</strong> applies a flat
          dock the moment a token has appeared at all, nudging toward new topics. A combined{" "}
          <strong>repetition penalty</strong> (a multiplicative variant) is common in open-source stacks.
        </p>
        <Callout kind="warn" title="A little goes a long way">
          High penalties cause their own failure: the model avoids necessary words (articles, a subject's
          name, required code tokens) and the text degrades. These are blunt instruments — reach for them
          only when you actually see looping, and keep the values small.
        </Callout>
      </Block>

      <Block eyebrow="picking values & beam search" title="What to set, and why chat models skip beams">
        <p className="text-ink-dim leading-relaxed mb-2">
          The single biggest decision is temperature, and it follows the task. For{" "}
          <strong>extraction, classification, and code</strong>, use <strong>temperature 0</strong> — you
          want the most likely answer and reproducibility (as much as the hardware allows). For{" "}
          <strong>creative writing or brainstorming</strong>, raise it (≈ 0.7–1.0) so the model explores.
        </p>
        <Callout kind="tip" title="The interview answer">
          "Logits go through softmax to a probability distribution; decoding chooses from it. Temperature
          scales the logits — low for deterministic tasks like extraction and code, higher for creative
          work. top-p (nucleus) trims the unlikely tail adaptively, and penalties curb repetition. Even at
          temperature 0, output isn't guaranteed bit-exact across hardware."
        </Callout>
        <Callout kind="note" title="Why not beam search?">
          <strong>Beam search</strong> keeps several candidate sequences alive and expands the best by
          total probability — great for tasks with one "correct" output like translation. Chat LLMs
          mostly avoid it: it's slower, tends to produce bland, repetitive, "high-probability" text, and
          for open-ended generation diversity matters more than squeezing out the single likeliest
          sequence. Sampling with top-p is the norm instead.
        </Callout>
      </Block>
    </>
  );
}

/* ── Gradient descent ─────────────────────────────────────────── */
function Gradient() {
  return (
    <>
      <Lede>
        Training is just rolling downhill on a loss surface. <strong>Backprop</strong> computes the
        gradient — the direction of steepest <em>ascent</em> for every weight — and the optimizer steps
        the opposite way. The <strong>learning rate</strong> sets the step size, and it's the single
        knob that most often blows training up.
      </Lede>

      <Try label="gradient descent"><GradientDescentViz /></Try>

      <Block eyebrow="the loop" title="Forward → loss → backward → step">
        <CodeBlock
          title="python"
          code={`for batch in data:
    pred = model(batch.x)            # forward:  compute predictions
    loss = loss_fn(pred, batch.y)    # loss:     how wrong are we
    loss.backward()                  # backward: dLoss/dW for every weight (backprop)
    optimizer.step()                 # step:     W -= lr * grad
    optimizer.zero_grad()            # clear grads so they don't accumulate`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Four phases repeat over the data. The catch is that <code className="font-mono">.backward()</code>{" "}
          <em>accumulates</em> gradients, so you must <code className="font-mono">zero_grad()</code> each
          step or last step's gradient leaks into this one — a classic silent bug.
        </p>
        <Callout kind="trap" title="Learning-rate intuition">
          Too high → loss oscillates or explodes to NaN (the demo's “diverging”). Too low → it crawls or
          stalls on a flat spot. This is the single most common training failure — and why nobody ships a
          fixed learning rate (see schedules below).
        </Callout>
      </Block>

      <Block eyebrow="under the hood" title="What backprop actually computes">
        <p className="text-ink-dim leading-relaxed mb-2">
          Backprop is the <strong>chain rule</strong> run in reverse. A network is a chain of functions;
          to get the gradient for a weight buried deep in the stack, you multiply the local derivatives
          along the path from the loss back to that weight. Doing it <em>backward</em> (reverse-mode
          autodiff) gets <strong>every</strong> weight's gradient in one pass — which is the whole reason
          training scales to billions of parameters.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`loss = f3( f2( f1(x, W1), W2 ), W3 )

dLoss/dW1 = dLoss/df3 · df3/df2 · df2/df1 · df1/dW1   (multiply right → left, reuse shared terms)`}
        />
        <Callout kind="note" title="A gradient is a direction, not a destination">
          It only says which way is downhill <em>right here</em> and how steep — not how far the minimum
          is. That's why you take many small steps instead of one big jump, and why step size (the LR)
          matters so much.
        </Callout>
      </Block>

      <Block eyebrow="how much data per step" title="Batch, mini-batch, stochastic">
        <OpTable
          cols={["Variant", "Gradient from", "", "Trade-off"]}
          rows={[
            { op: "Full-batch", avg: "all data", avgTone: "ok", why: "Most accurate gradient, but slow and memory-heavy — one step needs the whole dataset." },
            { op: "Stochastic (SGD)", avg: "1 example", avgTone: "ok", why: "Very noisy but cheap; the noise can bounce it out of bad spots." },
            { op: "Mini-batch", avg: "~32–1024", avgTone: "good", why: "The practical default — parallelizes on the GPU, and the noise actually helps generalization." },
          ]}
        />
        <Callout kind="tip" title="Batch size and LR move together">
          A bigger batch gives a smoother gradient, so you can (and should) raise the learning rate to
          match — the rough rule is to scale LR with batch size. One full pass over the data is an{" "}
          <strong>epoch</strong>.
        </Callout>
      </Block>

      <Block eyebrow="the optimizers" title="From SGD to AdamW">
        <OpTable
          cols={["Optimizer", "Adds", "", "Why it helps"]}
          rows={[
            { op: "SGD", avg: "—", avgTone: "ok", why: "Raw gradient step. Simple, but needs careful LR tuning and crawls in long ravines." },
            { op: "+ Momentum", avg: "velocity", avgTone: "good", why: "Accumulates past gradients — rolls through small bumps and accelerates along consistent directions." },
            { op: "RMSprop", avg: "per-weight scale", avgTone: "good", why: "Divides by a running gradient magnitude — tames weights whose scales differ wildly." },
            { op: "Adam", avg: "momentum + scale", avgTone: "good", why: "Both at once: a per-weight effective step size. The robust default for deep nets." },
            { op: "AdamW", avg: "decoupled decay", avgTone: "good", why: "Adam with weight decay done correctly — the standard for training transformers." },
          ]}
        />
        <Callout kind="note" title="Why not just plain SGD?">
          On the ill-conditioned, high-dimensional loss surfaces of deep nets, a single global LR is too
          blunt. Adam/AdamW give each weight its own adaptive step from running gradient statistics — far
          more forgiving, which is why they dominate LLM training.
        </Callout>
      </Block>

      <Block eyebrow="why it's hard" title="Why deep nets are hard to train">
        <p className="text-ink-dim leading-relaxed mb-2">
          A deep net's loss surface is <strong>non-convex</strong> — no single guaranteed bowl. In high
          dimensions the real obstacle isn't bad local minima (those are rare) but{" "}
          <strong>saddle points</strong> and long, near-flat ravines where the gradient almost vanishes
          and progress stalls.
        </p>
        <Callout kind="trap" title="Vanishing & exploding gradients">
          Chain many small derivatives through a deep stack and the gradient decays toward 0 (early layers
          stop learning); many large ones and it blows up to NaN. The fixes are structural:{" "}
          <strong>residual connections</strong> (a gradient highway), <strong>normalization</strong>{" "}
          (LayerNorm/BatchNorm), sane weight init, and <strong>gradient clipping</strong>.
        </Callout>
        <Callout kind="tip" title="Learning-rate schedules">
          Real runs rarely use a fixed LR: <strong>warm up</strong> from near-zero (a cold start at full
          LR diverges), then <strong>decay</strong> (often cosine) so early steps explore and later steps
          settle into the minimum. That's the divergence-vs-crawl trade-off from the demo, automated.
        </Callout>
      </Block>
    </>
  );
}

/* ── Bias–variance ────────────────────────────────────────────── */
function BiasVar() {
  return (
    <>
      <Lede>
        Every model lands somewhere on the <strong>underfit ↔ overfit</strong> axis.{" "}
        <strong>Bias</strong> is error from being too simple to capture the real pattern;{" "}
        <strong>variance</strong> is error from being so flexible it fits the noise in <em>this</em>{" "}
        particular training set. The job is to find the bottom of the total-error U.
      </Lede>

      <Try label="bias–variance"><BiasVarianceViz /></Try>

      <Block eyebrow="the decomposition" title="Where test error actually comes from">
        <p className="text-ink-dim leading-relaxed mb-2">
          For squared error, a model's expected error on unseen data splits into exactly three pieces —
          this is the whole reason the trade-off exists:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`expected test error  =   Bias²        +      Variance       +     σ²
                       (too simple)     (too sensitive)     (irreducible noise)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          Add capacity and <strong>bias²</strong> falls but <strong>variance</strong> rises; the sum is
          the U. <strong>σ²</strong> is noise inherent in the data — label errors, missing features —
          that no model can remove.
        </p>
        <Callout kind="note" title="Irreducible error is the floor">
          Nothing beats σ². If the labels are noisy or the features don't contain the answer, driving
          training error to zero just means fitting noise. Knowing the floor exists stops you from
          over-engineering past it.
        </Callout>
      </Block>

      <Block eyebrow="the diagnosis" title="Read train vs validation error">
        <OpTable
          cols={["Symptom", "Diagnosis", "", "Fix"]}
          rows={[
            { op: "train ↑  val ↑", avg: "underfit (bias)", avgTone: "bad", why: "Bigger model, more/better features, train longer, less regularization." },
            { op: "train ↓  val ↑", avg: "overfit (variance)", avgTone: "bad", why: "More data, regularization/dropout, early stopping, simpler model." },
            { op: "train ↓  val ↓", avg: "good fit", avgTone: "good", why: "The gap is small and both are low — ship it." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The <strong>gap</strong> between training and validation error <em>is</em> the variance; how
          high they both sit is the bias. That one plot tells you which way to move.
        </p>
        <Callout kind="tip" title="The one-line framing">
          “Is my error coming from the model being too dumb, or from it memorizing the training set?”
          The train/val gap answers it — and points straight at the fix.
        </Callout>
      </Block>

      <Block eyebrow="the toolkit" title="Regularization: buy a little bias to kill variance">
        <OpTable
          cols={["Technique", "What it does", "", "Effect"]}
          rows={[
            { op: "L2 / weight decay", avg: "penalize large weights", avgTone: "good", why: "Smoother function → lower variance. The default regularizer." },
            { op: "L1", avg: "penalize |weights|", avgTone: "ok", why: "Sum of absolute weights → drives many to exactly zero → sparse models, feature selection." },
            { op: "Dropout", avg: "randomly zero activations", avgTone: "good", why: "Stops neurons co-adapting → ensemble-like robustness (NN-specific)." },
            { op: "Early stopping", avg: "stop when val rises", avgTone: "good", why: "Caps effective capacity before the model starts memorizing." },
            { op: "More data / augmentation", avg: "more, varied examples", avgTone: "good", why: "The cleanest fix — lowers variance directly, with no bias cost." },
          ]}
        />
        <Callout kind="tip" title="More data is the only free lunch">
          Every other knob trades a little bias for less variance. More <em>representative</em> data
          lowers variance <strong>without</strong> adding bias — which is exactly why scale wins when you
          can afford it.
        </Callout>
        <Callout kind="note" title="LLM-era echo">
          The same axis reappears in fine-tuning: too few examples or too many epochs → the model
          overfits your tiny dataset and forgets its general ability (catastrophic forgetting). Early
          stopping and a small learning rate are the usual guardrails.
        </Callout>
      </Block>

      <Block eyebrow="the modern twist" title="Double descent — why huge models break the U">
        <p className="text-ink-dim leading-relaxed mb-2">
          The classic U says “past the sweet spot, a bigger model overfits and gets worse.” Modern
          over-parameterized networks (LLMs included) show <strong>double descent</strong>: test error
          climbs to a peak right where the model can <em>just barely</em> memorize the training set (the{" "}
          <strong>interpolation threshold</strong>), then <em>falls again</em> as the model grows even
          larger.
        </p>
        <Callout kind="tip" title="Why this matters for LLMs">
          It's part of why scaling up keeps helping. Vastly over-parameterized nets trained with SGD tend
          to settle on “simple” solutions that still generalize — so the old “smaller is always safer”
          instinct doesn't transfer cleanly to frontier-scale models.
        </Callout>
        <Callout kind="trap" title="But you can't skip the basics">
          Double descent needs lots of data and the right training regime. On small or tabular datasets
          the classic U absolutely still rules — which is exactly why gradient-boosted trees beat giant
          nets there.
        </Callout>
      </Block>
    </>
  );
}

/* ── Transformer block ────────────────────────────────────────── */
function TBlock() {
  return (
    <>
      <Lede>
        A transformer is just the same block stacked N times (GPT-3 has 96). Each token starts as its
        embedding and, layer by layer, gets <em>refined</em> into a richer representation. One block does
        two things: <strong>mix information between tokens</strong> (attention), then{" "}
        <strong>think about each token on its own</strong> (a small MLP). Everything else — residuals,
        normalization — is there to make a deep stack of these actually trainable.
      </Lede>

      <Block eyebrow="anatomy" title="The two sublayers">
        <CodeBlock
          title="text"
          lang="text"
          code={`x ─┬─> LayerNorm ─> Multi-Head Attention ─┐
   └──────────────(+ residual)──────────────┘   ← mix ACROSS tokens
   ─┬─> LayerNorm ─> Feed-Forward (MLP) ─────┐
   └──────────────(+ residual)──────────────┘ ─> out   ← process EACH token`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          <strong>Attention</strong> is the only place tokens see each other — it pulls in context from
          the rest of the sequence ("it" looks back at "cat"). The{" "}
          <strong>feed-forward MLP</strong> then runs on each token position independently; it's where
          most of the model's parameters live (~⅔ of the block) and is widely believed to be where
          learned facts are stored.
        </p>
        <Callout kind="note" title="Why two different sublayers?">
          They're complementary: attention <em>moves</em> information between positions but does little
          computation; the MLP <em>computes</em> on a position but can't see other tokens. Alternating
          them lets the model gather context, then reason about it, over and over.
        </Callout>
      </Block>

      <Block eyebrow="the key idea" title="The residual stream">
        <p className="text-ink-dim leading-relaxed mb-2">
          Notice each sublayer's output is <em>added</em> back (<code className="font-mono">+ residual</code>),
          not replaced. So picture a <strong>shared “residual stream”</strong> running straight through
          the model: every block <em>reads</em> from it, computes something, and <em>writes its result
          back by addition</em>. A token's vector is the running sum of every edit made to it so far.
        </p>
        <Callout kind="tip" title="Why this design wins">
          Two payoffs. (1) <strong>Trainability</strong>: addition gives gradients a clean “highway” back
          through dozens of layers, dodging the vanishing-gradient problem that killed deep nets before
          residuals. (2) <strong>Incremental refinement</strong>: a block only has to add a small
          correction, not rebuild the representation from scratch — so depth composes gracefully.
        </Callout>
      </Block>

      <Block eyebrow="what keeps it stable & ordered" title="Normalization and position">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>LayerNorm</strong> re-centers and re-scales each token's vector before a sublayer so
          activations don't drift to extremes as they accumulate down the stack — the modern default is{" "}
          <em>pre-norm</em> (normalize <em>inside</em> the residual branch, as drawn above), which trains
          far more stably than the original post-norm design.
        </p>
        <Callout kind="trap" title="Attention is blind to order">
          Self-attention is a weighted sum — it has <strong>no built-in notion of position</strong>, so
          "dog bites man" and "man bites dog" look identical to it. The fix is to inject position
          explicitly: <strong>positional encodings</strong> (original sinusoidal), learned position
          embeddings (BERT/GPT-2), or <strong>RoPE</strong> (rotary, the current standard). Without them a
          transformer is just a bag of words.
        </Callout>
        <Callout kind="note" title="Multi-head, briefly">
          “Multi-head” just runs attention several times in parallel with different learned projections,
          each on a slice of the vector, then concatenates. Different heads specialize — one tracks
          syntax, another coreference, another nearby position — so the block captures several kinds of
          relationship at once.
        </Callout>
      </Block>

      <Block eyebrow="the three families" title="Encoder, decoder, encoder–decoder">
        <OpTable
          cols={["Family", "Attention", "", "Built for"]}
          rows={[
            { op: "Encoder-only (BERT)", avg: "bidirectional", avgTone: "ok", why: "Every token sees the whole input. Great for understanding: classification, embeddings, retrieval." },
            { op: "Decoder-only (GPT)", avg: "causal (masked)", avgTone: "good", why: "A token sees only earlier tokens; trained to predict the next one. The modern default for generation." },
            { op: "Encoder–decoder (T5)", avg: "both", avgTone: "ok", why: "Encode an input, decode an output. Natural for translation / summarization (seq-in → seq-out)." },
          ]}
        />
        <Callout kind="tip" title="Same block, one switch">
          The three families are the <em>same</em> block; what changes is the attention mask.{" "}
          <strong>Causal masking</strong> (hiding future tokens) is the only real difference between a
          GPT decoder layer and a BERT encoder layer — and it's what makes next-token generation possible.
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  attention: <Attention />,
  embeddings: <Embeddings />,
  tokenization: <Tokenization />,
  sampling: <Sampling />,
  gradient: <Gradient />,
  biasvar: <BiasVar />,
  block: <TBlock />,
};

export default function AiLab() {
  const [active, setActive] = useState("attention");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Mechanics · the WHAT"
      title="AI · LAB"
      subtitle="The LLM internals you can watch work — attention, embeddings, sampling, and the training loop. Grasp the mechanism, not the buzzword."
      topics={TOPICS}
      activeId={active}
      onSelect={setActive}
    >
      <div className="flex items-center gap-2 mb-5">
        <Tag color={ACCENT}>{TOPICS.find((t) => t.id === active)?.group}</Tag>
        <Tag>fixtures, no model in browser</Tag>
      </div>
      {CONTENT[active]}
    </ToolShell>
  );
}
