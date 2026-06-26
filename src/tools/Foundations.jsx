import React, { useState } from "react";
import { ToolShell } from "../components/ToolShell.jsx";
import { Callout, CodeBlock, Tag } from "../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../components/layout.jsx";

const ACCENT = "#2dd4bf";
const { Block, Try } = withAccent(ACCENT);

const TOPICS = [
  { id: "probstats", label: "Probability & statistics", group: "Math" },
  { id: "linalg", label: "Linear algebra", group: "Math" },
  { id: "infotheory", label: "Information theory", group: "Math" },
  { id: "featureeng", label: "Feature engineering", group: "Applied ML" },
  { id: "timeseries", label: "Time series & forecasting", group: "Applied ML" },
  { id: "dimreduction", label: "Dimensionality reduction", group: "Applied ML" },
  { id: "anomaly", label: "Anomaly detection", group: "Applied ML" },
];

/* ── Probability & statistics ─────────────────────────────────── */
function ProbStats() {
  return (
    <>
      <Lede>
        Probability is the grammar of uncertainty, and statistics is how you reason backward from data to
        the process that made it. Almost every ML loss, eval, and experiment sits on this layer, so the
        screen checks whether you can <em>say</em> what a p-value means and why a model maximizes
        likelihood, not just name the words.
      </Lede>

      <Block eyebrow="the building blocks" title="Distributions, expectation, variance">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>distribution</strong> assigns probability over outcomes. Three carry most of the
          weight in interviews:
        </p>
        <OpTable
          cols={["Distribution", "Models", "", "Mean / variance"]}
          rows={[
            { op: "Bernoulli / Binomial", avg: "yes-no trials", avgTone: "good", why: "One coin flip (Bernoulli, mean p) or n of them (Binomial, mean np). Clicks, conversions, pass/fail." },
            { op: "Poisson", avg: "counts per interval", avgTone: "ok", why: "Rare events in fixed time/space, arrivals, defects, requests/sec. Mean = variance = λ." },
            { op: "Normal (Gaussian)", avg: "the bell curve", avgTone: "good", why: "Sums of many small effects. Defined by mean μ and variance σ²; the default for measurement noise." },
          ]}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          <strong>Expectation</strong> E[X] is the long-run average, the probability-weighted center of
          mass. <strong>Variance</strong> Var(X) = E[(X − μ)²] is how spread out it is; its square root is
          the <strong>standard deviation</strong>, in the same units as the data. These two numbers
          summarize a distribution before you know its exact shape.
        </p>
        <Callout kind="note" title="Why the normal is everywhere">
          The bell curve isn't an assumption people make for convenience, it's forced. The central limit
          theorem (below) says sums and averages of many independent things tend to normal regardless of
          the underlying shape, which is why so much of statistics is built on it.
        </Callout>
      </Block>

      <Block eyebrow="reasoning backward" title="Bayes' theorem: prior × likelihood → posterior">
        <p className="text-ink-dim leading-relaxed mb-2">
          Bayes' rule flips a conditional. You know P(data | hypothesis), how likely the evidence is{" "}
          <em>if</em> a hypothesis holds, and you want P(hypothesis | data): what to believe{" "}
          <em>after</em> seeing the evidence.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`P(H | D)   =   P(D | H)  ·  P(H)   /   P(D)

posterior  =  likelihood ·  prior  / evidence
(belief after) (fit to data)(belief before)(normalizer)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          The intuition that trips people up: a very accurate test for a very rare disease still produces
          mostly <em>false</em> positives, because the tiny prior (few people have it) overwhelms the
          test's accuracy. Plug in a 1%-prevalence disease and a 99%-accurate test and the probability
          you're actually sick given a positive is only ~50%, the base rate dominates.
        </p>
        <Callout kind="trap" title="The base-rate fallacy">
          People anchor on the test's accuracy and ignore the prior. Bayes forces you to multiply the
          likelihood by how common the hypothesis was to begin with, rare hypotheses need much stronger
          evidence to become probable.
        </Callout>
      </Block>

      <Block eyebrow="fitting parameters" title="MLE vs MAP, and the CLT">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Maximum likelihood (MLE)</strong> picks the parameters that make the observed data most
          probable, pure "fit the data." <strong>Maximum a posteriori (MAP)</strong> adds a prior and
          maximizes the posterior instead, so it pulls the estimate toward what you believed beforehand.
          The ML tie-in is direct: training a model by minimizing cross-entropy <em>is</em> MLE, and
          adding L2 regularization is exactly MAP with a Gaussian prior on the weights.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          The <strong>central limit theorem (CLT)</strong> is why we can do statistics at all: the{" "}
          <em>average</em> of many independent samples is approximately normal, centered on the true mean,
          with spread that shrinks as <code className="font-mono">1/√n</code>. That's where the{" "}
          <strong>standard error</strong> and confidence intervals come from, more samples, tighter
          estimate.
        </p>
        <Callout kind="note" title="Sampling is the whole game">
          You almost never see the population, only a sample. The CLT tells you how much your sample
          average can wobble around the truth, which is what makes A/B tests and hypothesis tests
          quantitative rather than vibes.
        </Callout>
      </Block>

      <Block eyebrow="testing a claim" title="Hypothesis testing & p-values">
        <p className="text-ink-dim leading-relaxed mb-2">
          You set up a <strong>null hypothesis</strong> H₀ (no effect, the boring default) and an{" "}
          <strong>alternative</strong> H₁ (there is an effect). The <strong>p-value</strong> is the part
          everyone misstates:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`p-value = P( data this extreme or more  |  H0 is true )

  small p  ->  the data would be surprising if there were no effect
              ->  reject H0   (effect is "statistically significant")

  it is NOT P(H0 is true) and NOT P(you made a mistake)`}
        />
        <OpTable
          cols={["Error", "You did", "", "Reality"]}
          rows={[
            { op: "Type I (false positive)", avg: "rejected H₀", avgTone: "bad", why: "...but there was no real effect. Rate = α, the significance level (usually 0.05)." },
            { op: "Type II (false negative)", avg: "kept H₀", avgTone: "bad", why: "...but there was a real effect you missed. Rate = β; power = 1 − β." },
          ]}
        />
        <Callout kind="trap" title="A p-value is not the probability you're right">
          It's P(data | null true), never P(null true | data), flipping those two is the single most
          common statistics mistake. And "not significant" means "not enough evidence," not "no effect."
        </Callout>
      </Block>

      <Block eyebrow="experiments in production" title="A/B testing & the peeking trap">
        <p className="text-ink-dim leading-relaxed mb-2">
          An A/B test is a hypothesis test on live traffic. Three numbers trade off and you fix them
          before you start:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Significance (α)</strong>, your tolerance for false positives, the bar a result must clear (commonly 0.05).</li>
          <li><strong>Power (1 − β)</strong>, the chance of detecting a real effect of a given size (commonly 80%). Underpowered tests miss real wins.</li>
          <li><strong>Sample size</strong>, falls out of α, power, and the minimum effect you care about. Smaller effects need far more users.</li>
        </ul>
        <Callout kind="trap" title="Peeking / p-hacking inflates false positives">
          If you watch the dashboard and stop the moment it crosses p &lt; 0.05, you've checked many times
          and will eventually cross by chance, your real false-positive rate balloons far past 5%.{" "}
          <strong>Fix the sample size up front</strong> (or use a sequential test designed for peeking),
          and never slice the data a dozen ways and report the one that "worked."
        </Callout>
        <Callout kind="note" title="Correlation ≠ causation">
          A/B testing earns its keep precisely because randomization breaks confounders. Observational
          "X correlates with Y" can always be a lurking third variable (or reverse causation); only a
          controlled experiment lets you claim X <em>caused</em> the change in Y.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Probability lets me model uncertainty; statistics lets me reason from a sample back to the
          truth. Bayes is prior times likelihood, normalized, and the base rate usually dominates, which
          is why a great test for a rare thing still throws false positives. Training a model is MLE
          (maximize the likelihood of the data), and adding a regularizer is MAP. A p-value is P(data
          this extreme | null true), not the probability I'm right, and I pre-register α, power, and
          sample size for an A/B test so I don't p-hack by peeking. And I never read causation off a
          correlation without a randomized experiment."
        </Callout>
      </Block>
    </>
  );
}

/* ── Linear algebra ───────────────────────────────────────────── */
function LinAlg() {
  return (
    <>
      <Lede>
        Linear algebra is the language a neural net actually speaks. Embeddings are vectors, a forward
        pass is matrix multiplication, attention is a dot product, and compression is SVD. You don't need
        to derive eigenvalues by hand, you need to say what each object <em>does</em> and where it shows
        up in a model.
      </Lede>

      <Block eyebrow="the atom" title="Vectors and the dot product">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>vector</strong> is a list of numbers that points somewhere in space, and in ML it's
          how you represent <em>everything</em>: a word, an image patch, a user. The single most useful
          operation on two vectors is the <strong>dot product</strong>:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`a · b  =  a1*b1 + a2*b2 + ... + an*bn  =  |a| |b| cos(theta)

   large & positive  ->  point the same way   (similar)
   near zero         ->  roughly orthogonal    (unrelated)
   negative          ->  point opposite ways    (dissimilar)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          So the dot product measures <strong>similarity</strong> (and is the heart of cosine similarity,
          which divides out length). Geometrically it's also a <strong>projection</strong>, how much of
          one vector lies along another. Every "find the nearest embedding" search is dot products at
          scale.
        </p>
        <Callout kind="note" title="Why this is the whole ballgame">
          Semantic search, recommendation, and attention all reduce to "which vectors point the same
          way?" Once data is vectors, similarity is a dot product, and that's cheap and parallel on a GPU.
        </Callout>
      </Block>

      <Block eyebrow="the verb" title="Matrices as transformations">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>matrix</strong> is a function: multiply a vector by a matrix and you{" "}
          <strong>transform</strong> it, rotate, scale, shear, or project it into a new space. A neural
          network layer is exactly this: <code className="font-mono">y = Wx + b</code>, a learned matrix W
          that maps inputs to a more useful representation, plus a nonlinearity so stacking them isn't
          just one big matrix.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`forward pass of one layer:

   x  (input vector)  --[ multiply by W ]-->  Wx  --[ +b, then activation ]-->  y

   stack N of these  ->  the entire network is matrix multiply, matrix multiply, ...`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          This is why GPUs matter: <strong>matrix multiplication is the core of a neural net's forward
          pass</strong>, and it's massively parallel. "The model is big" really means "the matrices are
          big," and most of training's compute is multiplying them.
        </p>
        <Callout kind="trap" title="Shapes have to line up">
          Matmul is only defined when inner dimensions match, (m×k)·(k×n) → (m×n). Half of all model-code
          bugs are shape mismatches, and reasoning about dimensions is genuinely the day-job skill behind
          this topic.
        </Callout>
      </Block>

      <Block eyebrow="measuring size & structure" title="Norms, eigenvalues, eigenvectors">
        <p className="text-ink-dim leading-relaxed mb-2">
          A <strong>norm</strong> measures a vector's length. The <strong>L2 norm</strong> (Euclidean,
          √Σx²) is the ordinary distance and gives smooth gradients, it's the default. The{" "}
          <strong>L1 norm</strong> (Σ|x|) sums absolute values and, used as a penalty, drives weights to
          exactly zero, producing <em>sparse</em> models. (That's the same L1-vs-L2 distinction as Lasso
          vs Ridge regularization.)
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Eigenvectors</strong> of a matrix are the special directions it doesn't rotate, it only
          stretches them, and the <strong>eigenvalue</strong> is how much it stretches each one. They
          expose a transformation's "natural axes," which is exactly what you want when you're looking for
          the directions in which data varies most.
        </p>
        <Callout kind="note" title="Eigen-intuition">
          Think of a matrix as a deformation of space. Most vectors get knocked off their original
          direction; eigenvectors are the few that survive pointing the same way, just longer or shorter.
          Those directions are what PCA hunts for.
        </Callout>
      </Block>

      <Block eyebrow="the workhorse decomposition" title="SVD, and why PCA rides on it">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Singular value decomposition (SVD)</strong> factors <em>any</em> matrix into{" "}
          <code className="font-mono">A = U Σ Vᵀ</code>, a rotation, a scaling by the{" "}
          <strong>singular values</strong> in Σ (ordered biggest-first), and another rotation. Keep only
          the top-k singular values and you get the best possible rank-k <em>compression</em> of the
          matrix: maximum information in minimum dimensions.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>PCA is SVD applied to centered data.</strong> The top singular directions are the
          principal components, the axes along which the data varies most, so PCA both compresses and{" "}
          <em>decorrelates</em>. (See Dimensionality reduction for the applied side.)
        </p>
        <Callout kind="tip" title="Tie it back to ML">
          Embeddings are vectors. Attention scores are <code className="font-mono">Q·Kᵀ</code>, a matrix
          of dot products asking "how relevant is each token to each other token?" PCA/SVD compress and
          denoise. Linear algebra isn't background math; it's the operations a model literally runs.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "I think of linear algebra as what a model actually computes. Data becomes vectors, and the dot
          product measures similarity, that's cosine search, recommendation, and attention's{" "}
          <code className="font-mono">Q·Kᵀ</code>. A matrix is a learned transformation, so a forward pass
          is just matmul after matmul, which is why GPUs win. Norms measure size, L2 for smooth distance,
          L1 for sparsity. Eigenvectors are the directions a matrix only stretches, and SVD generalizes
          that to factor any matrix and keep the top directions, which is exactly how PCA compresses and
          decorrelates data."
        </Callout>
      </Block>
    </>
  );
}

/* ── Information theory ───────────────────────────────────────── */
function InfoTheory() {
  return (
    <>
      <Lede>
        Here's the punchline most people miss: the standard training loss <em>is</em> information theory.
        Cross-entropy is how you train every classifier and every language model, KL divergence governs
        distillation and RLHF, and perplexity is the classic LM eval. Surprise, measured in bits, is the
        through-line.
      </Lede>

      <Block eyebrow="the foundation" title="Entropy: expected surprise">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Entropy</strong> H(p) is the average surprise of a distribution, how uncertain you are
          about the next outcome. A rare event carries more "surprise" (more bits); entropy is the
          probability-weighted average of that surprise:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`H(p) = - sum_x  p(x) log p(x)         (bits, if log base 2)

   fair coin (50/50)   ->  1 bit      (maximally uncertain)
   biased coin (99/1)  ->  ~0.08 bit  (almost no surprise)
   certain outcome     ->  0 bits     (no information)`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          High entropy = unpredictable = it takes more bits to encode. Low entropy = predictable = cheap
          to encode. This is the same quantity behind data compression: you can't compress below the
          entropy of the source.
        </p>
        <Callout kind="note" title="Surprise is the unit">
          Information is reduction in uncertainty. Learning the outcome of a fair coin gives you exactly 1
          bit; learning the outcome of a near-certain event tells you almost nothing. Entropy is just the
          average of that, weighted by how often each outcome happens.
        </Callout>
      </Block>

      <Block eyebrow="THE loss" title="Cross-entropy: the loss you already use">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Cross-entropy</strong> H(p, q) measures the cost, in bits, of encoding data that truly
          follows distribution <em>p</em> while you believe it follows <em>q</em>. Training a model
          minimizes exactly this: <em>p</em> is the true label (or true next token) and <em>q</em> is the
          model's predicted probabilities.
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`H(p, q) = - sum_x  p(x) log q(x)

  classification:  p = one-hot true label,  q = softmax outputs
  language model:  p = the actual next token, q = predicted token probs

  minimize cross-entropy  ==  maximize likelihood of the data  ==  MLE`}
        />
        <p className="text-ink-dim leading-relaxed mt-2">
          So next-token prediction in an LLM is one giant cross-entropy minimization over the vocabulary,
          token after token. The loss curve you stare at during training is measured in nats/bits of
          surprise.
        </p>
        <Callout kind="tip" title="The same loss, two names">
          "Minimize cross-entropy" and "maximize likelihood" are the same objective. That's the bridge
          between this topic and probability, MLE and cross-entropy are two descriptions of one training
          loop.
        </Callout>
      </Block>

      <Block eyebrow="distance between beliefs" title="KL divergence">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>KL divergence</strong> D(p ‖ q) is the <em>extra</em> bits you pay for using q when the
          truth is p, cross-entropy minus entropy. It's a "distance" between distributions, with one
          catch: it's <strong>asymmetric</strong>, D(p‖q) ≠ D(q‖p), so it's not a true metric.
        </p>
        <OpTable
          cols={["Shows up in", "Role of KL", "", "What it does"]}
          rows={[
            { op: "Knowledge distillation", avg: "match student to teacher", avgTone: "good", why: "Train a small model so its output distribution is KL-close to a big model's soft predictions." },
            { op: "RLHF / PPO", avg: "leash on the policy", avgTone: "ok", why: "A KL penalty keeps the fine-tuned model from drifting too far from the base model and degenerating." },
            { op: "VAEs", avg: "regularize the latent", avgTone: "ok", why: "A KL term pulls the learned latent distribution toward a standard normal prior." },
          ]}
        />
        <Callout kind="trap" title="KL is not symmetric and not a distance">
          D(p‖q) penalizes q for missing mass that p has; D(q‖p) penalizes the reverse. They give
          different answers, so always know which direction you're minimizing, it changes what the model
          is incentivized to do.
        </Callout>
      </Block>

      <Block eyebrow="the LM eval" title="Perplexity (and a word on mutual information)">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Perplexity</strong> is just the exponentiated cross-entropy:{" "}
          <code className="font-mono">perplexity = exp(cross-entropy)</code>. It reads as "on average, how
          many equally-likely choices is the model hesitating between for each token?" A perplexity of 10
          means the model is about as confused as if it were picking uniformly among 10 options, lower is
          better.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Mutual information</strong> I(X; Y) measures how much knowing one variable reduces
          uncertainty about another, shared information between two signals. It's the basis for feature
          relevance (does this feature actually tell you about the label?) and for some
          representation-learning objectives.
        </p>
        <Callout kind="note" title="One quantity, many faces">
          Entropy, cross-entropy, KL, and perplexity are all the same idea in different clothes,
          expected surprise, measured in bits. Recognizing that is the senior signal: "my loss is
          information theory" rather than "my loss is a number that goes down."
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Entropy is expected surprise, how uncertain a distribution is, in bits. Cross-entropy is{" "}
          <em>the</em> training loss: it's the cost of predicting q when the truth is p, and minimizing it
          is the same as maximum likelihood, that's how every classifier and every next-token LM is
          trained. KL divergence is the extra bits for using the wrong distribution; it's asymmetric and
          shows up as the leash in RLHF, the matching term in distillation, and the regularizer in VAEs.
          Perplexity is exp(cross-entropy), the classic LM eval, roughly how many options the model is
          torn between per token. So my loss isn't arbitrary; it's information theory."
        </Callout>
      </Block>
    </>
  );
}

/* ── Feature engineering ──────────────────────────────────────── */
function FeatureEng() {
  return (
    <>
      <Lede>
        On real tabular problems, feature engineering is usually the highest-leverage skill in the room,
        it moves the metric more than swapping models. The interview tests whether you can encode, scale,
        and create features <em>without</em> committing the two cardinal sins: data leakage and
        train/serve skew.
      </Lede>

      <Block eyebrow="categoricals" title="Encoding: turning categories into numbers">
        <p className="text-ink-dim leading-relaxed mb-2">
          Models eat numbers, so every category needs an encoding, and the right one depends on
          cardinality:
        </p>
        <OpTable
          cols={["Encoding", "Use when", "", "Watch out for"]}
          rows={[
            { op: "One-hot", avg: "low cardinality", avgTone: "good", why: "A column per category. Clean, but explodes to thousands of sparse columns at high cardinality." },
            { op: "Target / mean encoding", avg: "high cardinality", avgTone: "ok", why: "Replace a category with the mean target for it, powerful, but leaks the label unless you smooth + fit on train folds only." },
            { op: "Embeddings", avg: "very high cardinality", avgTone: "good", why: "Learn a dense vector per category (user IDs, products). Captures similarity, the deep-learning default." },
          ]}
        />
        <Callout kind="trap" title="Target encoding leaks if you're not careful">
          Computing a category's mean target over the <em>whole</em> dataset uses each row's own label to
          encode itself, straight leakage. Do it with cross-fold / out-of-fold encoding and smoothing, or
          your CV score will be a fantasy.
        </Callout>
      </Block>

      <Block eyebrow="scaling" title="Normalization, and which models even need it">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Standardization</strong> rescales a feature to mean 0, std 1 (z-score); <strong>min-max
          normalization</strong> squashes it to [0, 1]. Both put features on a comparable scale so one
          large-valued feature doesn't dominate. But not every model cares:
        </p>
        <OpTable
          cols={["Model family", "Needs scaling?", "", "Why"]}
          rows={[
            { op: "Distance-based (kNN, k-means, SVM)", avg: "yes", avgTone: "ok", why: "Distances are dominated by large-scale features; rescale or one feature drowns the rest." },
            { op: "Gradient-based (linear, NN)", avg: "yes", avgTone: "ok", why: "Helps optimization converge, unscaled features make the loss surface stretched and slow." },
            { op: "Tree-based (RF, XGBoost)", avg: "no", avgTone: "good", why: "Trees split on thresholds, which are invariant to monotonic rescaling. Don't bother." },
          ]}
        />
        <Callout kind="note" title="Trees don't care, distances do">
          The fast rule of thumb: if the model uses distances or gradients, scale; if it splits on
          thresholds (trees), scaling is a no-op. Memorize this, it's a frequent quick check.
        </Callout>
      </Block>

      <Block eyebrow="cleaning & creating" title="Missing values, outliers, and new features">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Missing values:</strong> impute (mean/median/mode, or a model-based fill), or, often
          better, add a "was-missing" flag, because the fact something is missing is frequently itself
          predictive. <strong>Outliers:</strong> clip/winsorize, log-transform skewed values, or leave
          them for robust models like trees.
        </p>
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>Feature creation</strong> is where domain knowledge pays off:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Interactions</strong>, combine features (price ÷ square-footage) the model can't easily learn alone.</li>
          <li><strong>Datetime decomposition</strong>, split a timestamp into hour, day-of-week, month, is-holiday; cyclical features often want sin/cos encoding.</li>
          <li><strong>Domain features</strong>, ratios, counts, and aggregates that encode how the business actually works.</li>
          <li><strong>Binning</strong>, bucket a continuous value into ranges when the relationship is non-linear or you want robustness.</li>
        </ul>
        <Callout kind="tip" title="Feature selection, briefly">
          Three families: <strong>filter</strong> (rank by a stat like correlation or mutual information),{" "}
          <strong>wrapper</strong> (search subsets by retraining, accurate, expensive), and{" "}
          <strong>embedded</strong> (selection baked into training, L1/Lasso, tree importance). Start
          with filters and embedded importance; reach for wrappers only when it matters.
        </Callout>
      </Block>

      <Block eyebrow="the cardinal sins" title="Data leakage & train/serve skew">
        <p className="text-ink-dim leading-relaxed mb-2">
          These two ruin more models than any algorithm choice, and interviewers probe for them
          specifically:
        </p>
        <OpTable
          cols={["Sin", "What goes wrong", "", "How it bites"]}
          rows={[
            { op: "Data leakage", avg: "future / target info in features", avgTone: "bad", why: "A feature secretly encodes the answer (a post-outcome field, label-leaking target encoding). Offline score is amazing, production fails." },
            { op: "Train/serve skew", avg: "features computed differently", avgTone: "bad", why: "The pipeline that builds features in training differs from serving, same model, different inputs, silent degradation." },
          ]}
        />
        <Callout kind="trap" title="The tell: 'too good to be true' offline">
          A 0.99 AUC that collapses in production is almost always leakage. The fixes: fit all
          transforms on the training fold only (inside CV), respect time order, and share one feature
          pipeline between training and serving so the inputs are guaranteed identical.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Feature engineering usually moves the metric more than the model choice. I encode categoricals
          by cardinality, one-hot for few, target encoding (carefully, out-of-fold) for many, embeddings
          for huge. I scale for distance- and gradient-based models but not for trees, which split on
          thresholds. I handle missing values with imputation plus a missingness flag, and I create
          interactions, datetime parts, and domain ratios. Above all I guard against the two sins: data
          leakage, no future or target-derived info in features, and train/serve skew, by fitting
          transforms on train folds only and sharing one feature pipeline across training and serving."
        </Callout>
      </Block>
    </>
  );
}

/* ── Time series & forecasting ────────────────────────────────── */
function TimeSeries() {
  return (
    <>
      <Lede>
        Time series breaks the IID assumption that the rest of ML quietly relies on: the order matters,
        today depends on yesterday, and you can never train on the future. Get the validation scheme wrong
        and every number you report is a lie, which is exactly what the interview is checking.
      </Lede>

      <Block eyebrow="what's special" title="Why time series isn't ordinary tabular data">
        <p className="text-ink-dim leading-relaxed mb-2">
          Four properties make it its own thing:
        </p>
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Temporal order</strong>, rows aren't independent; sequence carries meaning, so you can't shuffle.</li>
          <li><strong>Autocorrelation</strong>, a value correlates with its own recent past (today ≈ yesterday). That's signal you exploit with lag features.</li>
          <li><strong>Trend + seasonality</strong>, a long-run drift (trend) plus repeating cycles (daily, weekly, yearly seasonality).</li>
          <li><strong>Stationarity</strong>, many classical methods assume the statistical properties (mean, variance) don't drift over time; if they do, you difference or detrend first to make it stationary.</li>
        </ul>
        <Callout kind="note" title="Autocorrelation is the free lunch">
          Because the recent past predicts the near future, simple lag and rolling-window features
          (yesterday's value, last week's average) are often shockingly strong baselines, beat them
          before reaching for anything fancy.
        </Callout>
      </Block>

      <Block eyebrow="the methods" title="Classical, ML, and deep learning">
        <OpTable
          cols={["Approach", "Examples", "", "Best for"]}
          rows={[
            { op: "Classical statistical", avg: "ARIMA, ETS / exp. smoothing", avgTone: "good", why: "Strong on single series with clear trend/seasonality; interpretable, few parameters, great baselines." },
            { op: "ML on engineered features", avg: "gradient-boosted trees", avgTone: "good", why: "Build lag/rolling/datetime features and let XGBoost/LightGBM rip, often the practical winner on real, messy, multi-series data." },
            { op: "Deep learning", avg: "RNN/LSTM, temporal transformers", avgTone: "ok", why: "Pays off for complex, long-range, multivariate problems with lots of data, otherwise overkill." },
          ]}
        />
        <Callout kind="tip" title="GBTs are the workhorse">
          The honest answer for most business forecasting: engineer lag and rolling features, throw them
          at gradient-boosted trees, and you'll beat ARIMA and DL on effort-adjusted accuracy. Reach for
          DL only when the problem is genuinely complex and data-rich.
        </Callout>
      </Block>

      <Block eyebrow="the one rule you can't break" title="Never random-split a time series">
        <p className="text-ink-dim leading-relaxed mb-2">
          A random train/test split lets the model peek at the future to predict the past, a textbook
          leak that inflates your score and means nothing in production. You must validate{" "}
          <strong>forward in time</strong>:
        </p>
        <CodeBlock
          title="text"
          lang="text"
          code={`WRONG (random split):   train and test rows are interleaved in time -> leakage

RIGHT (walk-forward / time-based split):

  fold 1:  train [=====]         test [==]
  fold 2:  train [========]      test [==]
  fold 3:  train [===========]   test [==]
            (always train on the PAST, test on the FUTURE)`}
        />
        <Callout kind="trap" title="This is the most common time-series mistake">
          If a candidate random-splits a forecasting problem, the whole evaluation is invalid. Time-based
          or walk-forward (rolling-origin) validation is non-negotiable, and watch out for leaky
          features too, like a rolling mean computed over the test window.
        </Callout>
      </Block>

      <Block eyebrow="scoring it" title="Forecast metrics">
        <OpTable
          cols={["Metric", "Measures", "", "When to use"]}
          rows={[
            { op: "MAE", avg: "mean absolute error", avgTone: "good", why: "Average miss in plain units; robust to outliers and easy to explain to stakeholders." },
            { op: "RMSE", avg: "root mean sq. error", avgTone: "ok", why: "Squares errors, so it punishes big misses, use when one large error really hurts." },
            { op: "MAPE", avg: "mean abs. % error", avgTone: "ok", why: "Scale-free percentage, good for comparing across series, but blows up near zero and is asymmetric." },
          ]}
        />
        <Callout kind="note" title="Always beat a naive baseline">
          Compare against the dumbest forecast, "tomorrow = today" (or "= same day last week"). A model
          that can't beat that isn't learning anything, and MAPE on a near-zero series will mislead you,
          so report against the naive benchmark.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Time series breaks IID: order matters, values autocorrelate, and there's trend, seasonality,
          and stationarity to handle. For methods I start with classical models like ARIMA or exponential
          smoothing as baselines, but in practice gradient-boosted trees on lag and rolling features are
          often the winner, and I only reach for deep sequence models on complex multivariate problems.
          The rule I never break is no random split, I validate forward in time with walk-forward / a
          time-based split so I never train on the future, and I score with MAE/RMSE/MAPE against a naive
          baseline."
        </Callout>
      </Block>
    </>
  );
}

/* ── Dimensionality reduction ─────────────────────────────────── */
function DimReduction() {
  return (
    <>
      <Lede>
        High-dimensional data is sparse, slow, and noisy, the <em>curse of dimensionality</em>. Reducing
        dimensions compresses, decorrelates, denoises, and visualizes. The interview trap is conflating
        the tools: PCA is for compression you feed downstream; t-SNE/UMAP are for <em>looking</em>, and
        their output should never go into a model.
      </Lede>

      <Block eyebrow="the motivation" title="The curse of dimensionality">
        <p className="text-ink-dim leading-relaxed mb-2">
          As you add features, volume explodes and your data gets <strong>sparse</strong>, points spread
          so thin that everything is roughly equidistant, which guts distance-based methods (kNN,
          clustering). You need exponentially more data to fill the space, models overfit easily, and
          compute balloons. Reducing dimensions fights all of that at once.
        </p>
        <Callout kind="note" title="Why distances stop meaning anything">
          In very high dimensions the nearest and farthest neighbors of a point are almost the same
          distance away, so "nearest" loses its meaning. That's the core reason similarity-based methods
          degrade and why we compress before clustering or searching.
        </Callout>
      </Block>

      <Block eyebrow="the linear workhorse" title="PCA: variance-maximizing compression">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>PCA</strong> finds the orthogonal directions (principal components) along which the data
          varies most, then keeps the top few, a <strong>linear</strong>, SVD-based projection. Because
          the components are ordered by variance, dropping the small ones discards mostly noise.
        </p>
        <OpTable
          cols={["PCA is good for", "Because", "", "Limit"]}
          rows={[
            { op: "Compression", avg: "fewer dims, most variance kept", avgTone: "good", why: "Keep enough components to retain, say, 95% of variance." },
            { op: "Decorrelation", avg: "components are orthogonal", avgTone: "good", why: "Removes redundancy between correlated features." },
            { op: "Denoising / speed-up", avg: "drop low-variance axes", avgTone: "ok", why: "Small components are often noise; downstream models train faster on fewer dims." },
          ]}
        />
        <Callout kind="trap" title="PCA is linear and variance-driven">
          It can only capture linear structure, and it assumes high variance = important, which fails if
          the signal you care about lives in a low-variance direction. For nonlinear structure you need
          the tools below.
        </Callout>
      </Block>

      <Block eyebrow="for the eyes only" title="t-SNE and UMAP: visualization, not features">
        <p className="text-ink-dim leading-relaxed mb-2">
          <strong>t-SNE</strong> and <strong>UMAP</strong> are <strong>nonlinear</strong> methods that
          squash data to 2D/3D so you can <em>see</em> cluster structure. They're brilliant for
          exploration and terrible as a preprocessing step, and knowing why is the whole point of this
          topic.
        </p>
        <OpTable
          cols={["Property", "t-SNE", "", "UMAP"]}
          rows={[
            { op: "Speed", avg: "slow", avgTone: "bad", why: "UMAP is much faster and scales to larger datasets." },
            { op: "Global structure", avg: "preserves little", avgTone: "bad", why: "UMAP preserves more global structure; t-SNE focuses on local neighborhoods only." },
            { op: "Best use", avg: "visualization", avgTone: "ok", why: "Both: 2D/3D plots to spot clusters, not as model inputs." },
          ]}
        />
        <Callout kind="trap" title="Don't trust distances or cluster sizes, and never feed coords to a model">
          In a t-SNE/UMAP plot, the <em>sizes</em> of clusters and the <em>distances between</em> them are
          not meaningful, they're artifacts of the embedding, and they change with the perplexity /
          n-neighbors setting. So the cardinal sin is piping t-SNE coordinates into a downstream
          classifier: the axes don't mean anything stable. Use PCA or an autoencoder for that.
        </Callout>
      </Block>

      <Block eyebrow="the learned option" title="Autoencoders & learned embeddings">
        <p className="text-ink-dim leading-relaxed mb-2">
          An <strong>autoencoder</strong> is a neural net that squeezes input through a narrow{" "}
          <em>bottleneck</em> and reconstructs it; the bottleneck is a learned, <strong>nonlinear</strong>{" "}
          compression, PCA's flexible cousin. More broadly, the <strong>embeddings</strong> a model
          learns (word, image, user vectors) <em>are</em> low-dimensional representations of
          high-dimensional things, the same idea, learned end-to-end rather than imposed.
        </p>
        <Callout kind="tip" title="Link to AI · LAB">
          Embeddings tie this whole topic back to representation learning: a good embedding is a learned
          dimensionality reduction that downstream tasks can actually use, unlike a t-SNE plot, which is
          only for your eyes. See the Embeddings topic in AI · LAB.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "High-dimensional data is sparse and distance-based methods break, the curse of
          dimensionality, so I reduce dimensions to compress, decorrelate, and denoise. PCA is my linear,
          SVD-based workhorse for compression I'll feed downstream, since its components are ordered by
          variance. t-SNE and UMAP are nonlinear and for <em>visualization only</em>, UMAP keeps more
          global structure and is faster, and crucially their distances and cluster sizes aren't
          trustworthy, so I never feed those coordinates into a model. For learned nonlinear compression I
          use an autoencoder, and really, embeddings are just learned low-dimensional representations."
        </Callout>
      </Block>
    </>
  );
}

/* ── Anomaly detection ────────────────────────────────────────── */
function Anomaly() {
  return (
    <>
      <Lede>
        Anomaly detection is the imbalanced, often <em>unsupervised</em> problem: you have few or zero
        labeled anomalies, so you mostly model "normal" and flag whatever doesn't fit. The interview
        signal is knowing that accuracy is useless here and that you evaluate with precision/recall and
        PR-AUC instead.
      </Lede>

      <Block eyebrow="the shape of the problem" title="Why anomalies are hard">
        <p className="text-ink-dim leading-relaxed mb-2">
          Two things make this its own discipline. First, it's <strong>extremely imbalanced</strong>,
          anomalies are often well under 1% of the data. Second, it's frequently{" "}
          <strong>unsupervised or semi-supervised</strong>: you rarely have labeled examples of every
          failure mode (you can't enumerate all the ways fraud will look next month), so you learn what{" "}
          <em>normal</em> looks like and treat outliers as anomalies.
        </p>
        <Callout kind="note" title="Model 'normal,' flag the rest">
          Because you can't enumerate anomalies, the standard framing flips: fit a model of normal
          behavior (a density, a boundary, a reconstruction), then score how poorly each new point fits.
          Big misfit = anomaly.
        </Callout>
      </Block>

      <Block eyebrow="the toolkit" title="Methods, from simple to learned">
        <OpTable
          cols={["Method", "How it flags anomalies", "", "Note"]}
          rows={[
            { op: "Statistical (z-score / IQR)", avg: "far from mean / outside whiskers", avgTone: "good", why: "Cheap, interpretable first pass; assumes a roughly known distribution per feature." },
            { op: "Isolation Forest", avg: "easy to isolate with random splits", avgTone: "good", why: "Outliers get separated in few random splits. Fast, scalable, the strong tabular default." },
            { op: "One-class SVM", avg: "outside a learned boundary", avgTone: "ok", why: "Learns a tight frontier around normal data; flags points that fall outside it." },
            { op: "Autoencoder", avg: "high reconstruction error", avgTone: "ok", why: "Trained only on normal data; anomalies reconstruct badly. Good for high-dimensional / complex data." },
            { op: "Density / LOF", avg: "lower local density than neighbors", avgTone: "ok", why: "Local Outlier Factor catches points in sparse regions relative to their neighborhood." },
            { op: "Clustering distance", avg: "far from any cluster", avgTone: "ok", why: "Points that don't belong to a dense cluster (e.g. DBSCAN noise) are candidate anomalies." },
          ]}
        />
        <Callout kind="tip" title="Isolation Forest is the easy default">
          For tabular anomaly detection, Isolation Forest is usually the best first reach: it's fast,
          needs little tuning, scales well, and rests on a clean intuition, anomalies are <em>easy to
          isolate</em>, so they get cut off in just a few random splits.
        </Callout>
      </Block>

      <Block eyebrow="where it's used" title="Use cases">
        <ul className="text-ink-dim leading-relaxed mb-2 list-disc pl-5 space-y-1.5 text-sm">
          <li><strong>Fraud detection</strong>, flag transactions that don't match a user's normal pattern.</li>
          <li><strong>Intrusion detection</strong>, spot network traffic or access patterns that deviate from baseline.</li>
          <li><strong>Monitoring & drift</strong>, alert when metrics, logs, or input distributions stray from normal, including data/model drift in production.</li>
        </ul>
        <Callout kind="note" title="It's the same idea as drift detection">
          Watching for "this input distribution no longer looks like training data" is anomaly detection
          on your features, which is why this topic shows up in MLOps monitoring as much as in fraud.
        </Callout>
      </Block>

      <Block eyebrow="scoring it honestly" title="Evaluation: why accuracy is a trap">
        <p className="text-ink-dim leading-relaxed mb-2">
          With anomalies under 1%, a model that flags nothing scores &gt;99% accuracy and catches{" "}
          <em>zero</em> anomalies. Accuracy is worse than useless, it actively rewards the broken model.
          You evaluate at a chosen threshold with:
        </p>
        <OpTable
          cols={["Metric", "Answers", "", "Why it fits"]}
          rows={[
            { op: "Precision", avg: "of my alerts, how many were real?", avgTone: "good", why: "Controls alert fatigue, too many false alarms and humans stop trusting the system." },
            { op: "Recall", avg: "of real anomalies, how many did I catch?", avgTone: "good", why: "Controls misses, in fraud or intrusion a miss is the expensive failure." },
            { op: "PR-AUC", avg: "precision–recall across thresholds", avgTone: "good", why: "The honest summary on heavy imbalance, where ROC-AUC looks deceptively rosy." },
          ]}
        />
        <Callout kind="trap" title="Accuracy lies, and ROC flatters">
          On &lt;1% positives, drop accuracy entirely and prefer the precision–recall curve over ROC,
          ROC-AUC can look great while precision is terrible. Pick the operating threshold by the business
          cost of a false alarm vs a miss, exactly like the precision/recall trade everywhere else.
        </Callout>
      </Block>

      <Block eyebrow="say it cleanly" title="The interview answer">
        <Callout kind="tip" title="The interview answer">
          "Anomaly detection is the imbalanced, usually unsupervised problem, few or no labels, so I
          model what 'normal' looks like and flag whatever doesn't fit. My default toolkit is z-score/IQR
          for a quick statistical pass, Isolation Forest as the strong tabular default (anomalies are easy
          to isolate), one-class SVM or autoencoder reconstruction error for boundaries and complex data,
          and density/LOF or clustering distance for local outliers. It powers fraud, intrusion, and
          monitoring/drift. And I never use accuracy, when anomalies are under 1% it's meaningless, I
          use precision, recall, and PR-AUC, and set the threshold by the cost of a false alarm versus a
          miss."
        </Callout>
      </Block>
    </>
  );
}

const CONTENT = {
  probstats: <ProbStats />,
  linalg: <LinAlg />,
  infotheory: <InfoTheory />,
  featureeng: <FeatureEng />,
  timeseries: <TimeSeries />,
  dimreduction: <DimReduction />,
  anomaly: <Anomaly />,
};

export default function Foundations() {
  const [active, setActive] = useState("probstats");
  return (
    <ToolShell
      accent={ACCENT}
      eyebrow="Fundamentals · the MATH"
      title="Foundations"
      subtitle="The math and classic-ML bedrock the screens still gate on, probability, linear algebra, information theory, and the applied-ML toolkit."
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
