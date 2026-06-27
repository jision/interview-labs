import React from "react";
import { Callout, CodeBlock } from "../../components/ui.jsx";
import { Lede, OpTable, withAccent } from "../../components/layout.jsx";

const ACCENT = "#d6a94c";
const { Block } = withAccent(ACCENT);

/* ── Worked: Capacity Estimate ─────────────────────────────────── */
function CapacityEstimation() {
  return (
    <>
      <Lede>
        "Estimate the capacity for a URL shortener." This is the same back-of-envelope drill as the{" "}
        <strong>Back-of-Envelope</strong> page, run end-to-end on one concrete system. We'll walk it in
        order: pin the assumptions, turn DAU into QPS (reads and writes <em>separately</em>), size a
        year of storage, size the bandwidth, then size the cache with the 80/20 rule. Every number below
        is one significant figure and every step shows its arithmetic, the goal is the right power of
        ten, not a precise answer.
      </Lede>

      <Block eyebrow="step 0" title="State the assumptions out loud">
        <p className="text-ink-dim leading-relaxed mb-1">
          Before any math, write down the inputs so the interviewer can correct them before you build on
          sand. For a URL shortener the load is dominated by <strong>redirects (reads)</strong>, not by
          creating new links (writes), people click short links far more often than they mint them. A{" "}
          <strong>100:1 read:write ratio</strong> is the standard assumption.
        </p>
        <CodeBlock
          title="text · assumptions (one sig-fig, rounded)"
          lang="text"
          code={`DAU                      = 100,000,000   = 1e8 users
New URLs (writes) / day  = 10,000,000    = 1e7   (each DAU mints ~0.1/day)
Redirects (reads) / day  = 1,000,000,000 = 1e9   (each DAU clicks ~10/day)
read : write ratio       = 1e9 : 1e7     = 100 : 1   ✓
bytes per stored record  ~ 500 bytes     (round up, see step 2)
seconds per day          ~ 86,400        ~ 1e5  (the key time anchor)
retention                = forever (size 1 year, then multiply)`}
        />
        <Callout kind="note" title="Why 100:1 and not 'about even'">
          A write happens once per link; reads happen every time anyone clicks it. Shared links fan out,
          one tweet, thousands of redirects. If you assume reads ≈ writes here you'll under-provision the
          read path by two orders of magnitude. Naming the ratio explicitly is the whole point of this
          step.
        </Callout>
      </Block>

      <Block eyebrow="step 1" title="DAU → QPS, reads and writes separately">
        <p className="text-ink-dim leading-relaxed mb-1">
          The conversion is the time anchor from the cheat sheet:{" "}
          <strong>QPS = events per day ÷ 10<sup>5</sup></strong> (since ~86,400 s/day ≈ 10<sup>5</sup>).
          Do it once for writes, once for reads, then multiply by ~2 for peak, daily traffic isn't flat,
          and you provision for the busy hour, not the average.
        </p>
        <CodeBlock
          title="text · events/day ÷ 1e5 = average QPS"
          lang="text"
          code={`WRITE QPS (avg)  = 1e7 writes/day ÷ 1e5 s/day = 100   QPS
READ  QPS (avg)  = 1e9 reads/day  ÷ 1e5 s/day = 10,000 QPS

peak ≈ 2× average (provision for the busy hour, not the mean):
  WRITE QPS (peak) ≈ 200
  READ  QPS (peak) ≈ 20,000`}
        />
        <OpTable
          cols={["Path", "Per day", "Avg QPS", "Peak (~2×)"]}
          rows={[
            { op: "Writes (mint URL)", avg: "1e7", avgTone: "good", worst: "100", worstTone: "good", why: "1e7 ÷ 1e5 = 100 average, ~200 at peak. Trivially one box." },
            { op: "Reads (redirect)", avg: "1e9", avgTone: "ok", worst: "10,000", worstTone: "ok", why: "1e9 ÷ 1e5 = 10,000 average, ~20,000 at peak. This is the path you scale." },
          ]}
        />
        <Callout kind="tip" title="The split is the insight">
          "200 writes/sec is nothing, a single Postgres box handles it. 20,000 reads/sec at peak is the
          real system: that's what I'll cache and replicate." Separating the two QPS numbers is what lets
          you say which side of the system actually needs engineering.
        </Callout>
      </Block>

      <Block eyebrow="step 2" title="Storage per year, bytes/record × records/year">
        <p className="text-ink-dim leading-relaxed mb-1">
          Storage is driven by <em>writes</em>, reads don't add rows. Size one record, multiply by
          records per year. A record is a short code, the long URL, and a little metadata; the real bytes
          are ~130, but round up to <strong>500 bytes</strong> to cover indexes, per-row overhead, and
          replication slack. Rounding up here is deliberate, not lazy.
        </p>
        <CodeBlock
          title="text · one record, then a year of them"
          lang="text"
          code={`bytes per record (round up to 500):
  short code   ~   7 B   (base62, 7 chars ⇒ 62^7 ≈ 3.5e12 codes, plenty)
  long URL     ~ 100 B
  metadata     ~  25 B   (created_at, owner id, click count)
  ----------------------------------
  raw          ~ 132 B  →  round to 500 B  (indexes + overhead + slack)

records / year = 1e7 writes/day × 365 days
              ≈ 1e7 × 4e2  = 4e9 records/year

storage / year = 4e9 records × 500 B/record
              = 2e12 bytes
              = 2 TB / year`}
        />
        <OpTable
          cols={["Quantity", "Computation", "", "Result"]}
          rows={[
            { op: "Records / year", avg: "1e7/day × 365", avgTone: "good", why: "≈ 1e7 × 4e2 = 4e9 records per year." },
            { op: "Bytes / record", avg: "round 132 → 500", avgTone: "good", why: "Round up to absorb indexes, row overhead, replication." },
            { op: "Storage / year", avg: "4e9 × 500 B", avgTone: "ok", why: "2e12 B = 2 TB/year. ~10 yrs ≈ 20 TB, fits on one beefy node's disk." },
          ]}
        />
        <Callout kind="note" title="Tie it back to powers of two">
          2 TB ≈ 2 × 2<sup>40</sup> bytes, and the arithmetic only works because 2<sup>40</sup> ≈ 10
          <sup>12</sup> (1 TB) and 365 ≈ 4 × 10<sup>2</sup>. The same 2<sup>10</sup> ≈ 10<sup>3</sup>{" "}
          trick from the cheat sheet carries KB → MB → GB → TB. Twenty years of data still fits one
          machine's disk, so this system is <em>not</em> storage-bound, it's read-QPS-bound.
        </Callout>
      </Block>

      <Block eyebrow="step 3" title="Bandwidth, QPS × payload size">
        <p className="text-ink-dim leading-relaxed mb-1">
          Bandwidth is just <strong>QPS × bytes per response</strong>, done on each path. A redirect
          returns a 301 carrying the long URL, call the payload ~500 B (same record size). Use{" "}
          <em>average</em> QPS for steady-state bandwidth, peak QPS to size the busy-hour pipe.
        </p>
        <CodeBlock
          title="text · throughput on each path"
          lang="text"
          code={`READ bandwidth (avg)  = 10,000 reads/s × 500 B = 5e6  B/s = 5 MB/s
READ bandwidth (peak) = 20,000 reads/s × 500 B = 1e7  B/s = 10 MB/s

WRITE bandwidth (avg) =    100 writes/s × 500 B = 5e4  B/s = 50 KB/s

→ ~5 MB/s steady, ~10 MB/s peak.  A single 1 Gbps NIC = 125 MB/s,
  so network is NOT the bottleneck, the bottleneck is read QPS / lookups.`}
        />
        <Callout kind="tip" title="Bandwidth rarely binds for tiny payloads">
          URL records are small, so even 20,000 reads/sec is only ~10 MB/s, a rounding error against a
          1 Gbps link (125 MB/s). The lesson generalizes: bandwidth binds when payloads are big (images,
          video), QPS binds when payloads are small (lookups, counters). Say which one you're up against.
        </Callout>
      </Block>

      <Block eyebrow="step 4" title="Cache size, the 80/20 rule">
        <p className="text-ink-dim leading-relaxed mb-1">
          You can't and shouldn't cache every URL. The <strong>80/20 (Pareto) rule</strong> says ~20% of
          links drive ~80% of redirects, hot links go viral, the long tail is cold. So size the cache to
          hold the hot 20% of a day's read volume; that absorbs ~80% of reads from memory and takes the
          load off the database.
        </p>
        <CodeBlock
          title="text · cache the hot 20% of daily reads"
          lang="text"
          code={`hot working set  = 20% of daily reads
                 = 0.2 × 1e9 reads/day  = 2e8 hot lookups/day

cache size       = 2e8 hot URLs × 500 B/record
                 = 1e11 bytes
                 = 100 GB

→ 100 GB fits in a small Redis/Memcached cluster (a few nodes, or
  one big-memory box). It serves ~80% of the 20,000-QPS read peak,
  leaving the DB to handle only ~4,000 QPS of cache misses.`}
        />
        <OpTable
          cols={["Quantity", "Computation", "", "Result"]}
          rows={[
            { op: "Hot working set", avg: "0.2 × 1e9", avgTone: "good", why: "20% of daily reads ⇒ 2e8 hot lookups/day." },
            { op: "Cache memory", avg: "2e8 × 500 B", avgTone: "ok", why: "1e11 B = 100 GB. A small in-memory cluster, easily provisioned." },
            { op: "DB read load", avg: "20% of 20k QPS", avgTone: "good", why: "Cache absorbs ~80%, so only ~4,000 QPS of misses hit the DB." },
          ]}
        />
        <Callout kind="trap" title="80/20 sizes the cache, it doesn't eliminate the DB">
          The cache serves the hot 80% of <em>traffic</em>; the cold 20% still hits the database, and so
          does every miss after an eviction or a cold start. A common slip is sizing the cache to the
          whole dataset (20 TB won't fit in RAM), you cache the hot working set, not the corpus. State
          the eviction policy too: an LRU cache fits this access pattern, since recently-clicked links are
          the ones likely to be clicked again.
        </Callout>
      </Block>

      <Block eyebrow="wrap-up" title="The one-paragraph readout">
        <Callout kind="tip" title="Say it back as a summary">
          "100M DAU at 100:1 reads:writes gives ~200 write-QPS and ~20,000 read-QPS at peak. Writes are
          trivial; the read path is the system. Storage is ~2 TB/year, even a decade fits one node, so
          we're not storage-bound. Bandwidth is ~10 MB/s peak, a rounding error on a 1 Gbps NIC. The
          binding constraint is read QPS, so I'd front the DB with a ~100 GB LRU cache holding the hot 20%
          of links, which serves ~80% of reads and drops the DB to ~4,000 QPS." That readout, numbers,
          then the <em>binding constraint</em>, then the design implication, is the staff-level finish.
        </Callout>
        <p className="text-ink-dim leading-relaxed mt-1">
          Every step reused exactly two memorized facts: <strong>seconds/day ≈ 10<sup>5</sup></strong>{" "}
          and <strong>2<sup>10</sup> ≈ 10<sup>3</sup></strong>. Memorize those, round to one significant
          figure at every step, and you can drive this whole estimate on a whiteboard in under five
          minutes. The next page lists the rest of the numbers worth keeping in your head.
        </p>
      </Block>
    </>
  );
}

/* ── Numbers to Memorize ───────────────────────────────────────── */
function NumbersToKnow() {
  return (
    <>
      <Lede>
        Back-of-envelope estimates are only fast if the raw numbers are already in your head. This is the
        compact reference: the <strong>latency ladder</strong> (how slow each tier is relative to the
        last), the <strong>powers of two</strong> (so 2<sup>n</sup> ↔ KB/MB/GB/TB is reflexive), the{" "}
        <strong>time anchors</strong>, and the <strong>QPS / ratio</strong> sanity numbers. Memorize the
        shape and the orders of magnitude, never the exact digits.
      </Lede>

      <Block eyebrow="latency ladder" title="How long things take, each tier ~10–100× the last">
        <OpTable
          cols={["Operation", "Latency", "", "Relative to the tier above"]}
          rows={[
            { op: "L1 cache reference", avg: "~1 ns", avgTone: "good", why: "The baseline. Everything else is a multiple of this." },
            { op: "L2 cache reference", avg: "~4 ns", avgTone: "good", why: "~4× L1. Still on-die, still effectively free." },
            { op: "Main memory (RAM)", avg: "~100 ns", avgTone: "ok", why: "~100× L1. A cache miss costs you ~100 ns, RAM is the slowest tier you still hit without leaving the box (off-chip, but no network)." },
            { op: "SSD random read", avg: "~16 µs", avgTone: "ok", why: "~150× RAM. Flash is fast, but not RAM-fast." },
            { op: "Intra-datacenter RTT", avg: "~0.5 ms", avgTone: "ok", why: "~500 µs ≈ 30× an SSD read. Same building, different machine, a network hop." },
            { op: "Disk (HDD) seek", avg: "~10 ms", avgTone: "bad", why: "~20× a DC round-trip, ~100,000× RAM. Spinning rust, avoid random disk I/O." },
            { op: "Inter-region RTT", avg: "~100 ms", avgTone: "bad", why: "~10× a disk seek, ~200× a DC hop. Speed of light is real, cross-continent dominates." },
          ]}
        />
        <Callout kind="tip" title="Use it fast: one question collapses most of this">
          You don't recall exact nanoseconds at the whiteboard, you ask "<strong>is this in L-cache, in
          RAM, on SSD, on disk, or over the network?</strong>" Each rung down is roughly 10–100× slower,
          so the tier alone gives you the order of magnitude. The killer gap is the last two: a local read
          is sub-millisecond, a cross-region hop is ~100 ms, so one synchronous inter-region call can
          cost more than a hundred local operations combined. Batch or cache across that boundary.
        </Callout>
      </Block>

      <Block eyebrow="powers of two" title="Sizes, and the 2^10 ≈ 10^3 bridge">
        <p className="text-ink-dim leading-relaxed mb-1">
          The one identity that makes byte math doable in your head:{" "}
          <strong>2<sup>10</sup> = 1024 ≈ 10<sup>3</sup></strong>. Every step of ten in the exponent moves
          you one unit up the KB → MB → GB → TB ladder, and lets you swap between binary and decimal sizes
          without a calculator.
        </p>
        <OpTable
          cols={["Power", "Value", "Approx", "Unit / use"]}
          rows={[
            { op: "2^10", avg: "1,024", avgTone: "good", worst: "~10^3", worstTone: "good", why: "1 KB. The bridge between binary and decimal that powers all of this." },
            { op: "2^20", avg: "1,048,576", avgTone: "good", worst: "~10^6", worstTone: "good", why: "1 MB. ≈ 1 million bytes." },
            { op: "2^30", avg: "~1.07e9", avgTone: "ok", worst: "~10^9", worstTone: "ok", why: "1 GB. ≈ 1 billion. (Signed 32-bit int maxes at 2^31−1 ≈ 2.1 billion.)" },
            { op: "2^32", avg: "~4.29e9", avgTone: "ok", worst: "~4 billion", worstTone: "ok", why: "4 GB of address space; the entire IPv4 address space." },
            { op: "2^40", avg: "~1.10e12", avgTone: "bad", worst: "~10^12", worstTone: "bad", why: "1 TB. ≈ 1 trillion bytes." },
          ]}
        />
        <Callout kind="note" title="Char/int sizes that round the estimate">
          Pair the powers with byte sizes you'll multiply by: ASCII char ≈ 1 B, int / float ≈ 4–8 B,
          UUID ≈ 16 B, a typical short text record (a tweet, a URL row) ≈ 100s of bytes, round to 500 B
          or 1 KB. "1 KB per record × 1 billion records = 1 TB" is the kind of one-line size estimate
          these numbers unlock.
        </Callout>
      </Block>

      <Block eyebrow="time anchors" title="Seconds, and turning volume into QPS">
        <OpTable
          cols={["Anchor", "Exact-ish", "Approx", "What it's for"]}
          rows={[
            { op: "Seconds / day", avg: "86,400", avgTone: "good", worst: "~10^5", worstTone: "good", why: "The master anchor. QPS = events-per-day ÷ 10^5." },
            { op: "Seconds / month", avg: "~2.6e6", avgTone: "good", worst: "~2.6e6", worstTone: "good", why: "86,400 × 30 ≈ 2.6 million. For monthly billing / volume math." },
            { op: "Seconds / year", avg: "~3.15e7", avgTone: "ok", worst: "~3e7", worstTone: "ok", why: "86,400 × 365 ≈ π × 10^7, a famous mnemonic (≈ 3.15e7)." },
            { op: "Days / year", avg: "365", avgTone: "good", worst: "~4×10^2", worstTone: "good", why: "Round to 4e2 for a year of storage: per-day × 365." },
          ]}
        />
        <Callout kind="tip" title="The single division you actually run">
          <strong>QPS = (events per day) ÷ 10<sup>5</sup>.</strong> So 1 million events/day ≈ 10 QPS,
          1 billion/day ≈ 10,000 QPS. Then multiply by ~2 (sometimes ~3) for the peak/busy-hour, since
          real traffic isn't flat across 24 hours. That one division plus the peak factor answers the
          "how many QPS?" part of almost every capacity question.
        </Callout>
      </Block>

      <Block eyebrow="sanity numbers" title="Ratios & defaults to assume when nobody tells you">
        <OpTable
          cols={["Quantity", "Assume", "", "Why / when to revise"]}
          rows={[
            { op: "Read : write ratio", avg: "~100 : 1", avgTone: "good", why: "Most consumer systems are read-heavy. Feeds/lookups skew higher; write logs/metrics skew the other way." },
            { op: "Peak : average QPS", avg: "~2–3 ×", avgTone: "good", why: "Provision for the busy hour, not the daily mean. Bursty/viral systems run higher." },
            { op: "Cache hit ratio (80/20)", avg: "~80% from 20%", avgTone: "good", why: "Pareto: ~20% of keys drive ~80% of reads. Size the cache to the hot working set, not the corpus." },
            { op: "Availability '9s'", avg: "99.9% ≈ 8.7h/yr", avgTone: "ok", why: "Three 9s ≈ 8.7 h down/yr; four 9s ≈ 52 min/yr; five 9s ≈ 5 min/yr. Each 9 ≈ 10× harder." },
            { op: "Replication factor", avg: "3", avgTone: "good", why: "The default for durability (quorum of 3). Multiplies raw storage, 2 TB data ⇒ ~6 TB on disk." },
          ]}
        />
        <Callout kind="trap" title="Always say which assumption you used">
          These are <em>defaults</em>, not facts, the interviewer may have a different system in mind. The
          right move is to state it and invite correction: "I'll assume 100:1 reads:writes and a 2× peak,
          stop me if those are off for your workload." A wrong-but-stated assumption is recoverable; a
          hidden one quietly poisons every number downstream.
        </Callout>
        <Callout kind="note" title="What to actually commit to memory">
          The short list, in priority order: <strong>seconds/day ≈ 10<sup>5</sup></strong>,{" "}
          <strong>2<sup>10</sup> ≈ 10<sup>3</sup></strong> (KB→MB→GB→TB), the latency tiers (
          <strong>RAM ~100 ns, SSD ~16 µs, DC RTT ~0.5 ms, disk seek ~10 ms, cross-region ~100 ms</strong>
          ), and the defaults above (100:1, 2× peak, 80/20, 3× replication). Those five things drive every
          estimate on the previous page.
        </Callout>
      </Block>
    </>
  );
}

export const JUDGMENT_EXTRA_TOPICS = [
  { id: "capacity-estimation", label: "Worked: Capacity Estimate", group: "Judgment" },
  { id: "numbers-to-know", label: "Numbers to Memorize", group: "Judgment" },
];

export const JUDGMENT_EXTRA_CONTENT = {
  "capacity-estimation": <CapacityEstimation />,
  "numbers-to-know": <NumbersToKnow />,
};
