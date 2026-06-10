import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#38e0d6";

/* A small deterministic string hash (FNV-1a-ish) so the demo is reproducible. */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const WORDS = ["cat", "dog", "bird", "fish", "ant", "bee", "owl", "fox", "elk", "cow", "hen", "ram", "jay", "yak"];

export default function HashTableViz() {
  const [numBuckets, setNumBuckets] = useState(4);
  const [pairs, setPairs] = useState([]); // {key, hash, bucket}
  const [hot, setHot] = useState(null); // bucket index
  const [note, setNote] = useState("Insert keys to watch them hash into buckets. Index = hash(key) % numBuckets.");

  const buckets = Array.from({ length: numBuckets }, () => []);
  pairs.forEach((p) => buckets[p.hash % numBuckets].push(p));
  const load = (pairs.length / numBuckets).toFixed(2);

  function resizeIfNeeded(nextCount, nb) {
    // CPython resizes a dict when it's ~2/3 full. We mirror the spirit: load > 0.75 → double.
    if (nextCount / nb > 0.75) return nb * 2;
    return nb;
  }

  function insert() {
    const used = new Set(pairs.map((p) => p.key));
    const avail = WORDS.filter((w) => !used.has(w));
    if (!avail.length) {
      setNote("Out of demo words — reset to keep going.");
      return;
    }
    const key = avail[Math.floor(Math.random() * avail.length)];
    const h = hashStr(key);
    const nextCount = pairs.length + 1;
    const nb = resizeIfNeeded(nextCount, numBuckets);
    const bucket = h % nb;
    const collided = buckets[h % numBuckets].length > 0 && nb === numBuckets;

    if (nb !== numBuckets) {
      setNumBuckets(nb);
      setNote(
        `insert("${key}"): load factor would exceed 0.75 → table resized to ${nb} buckets and every key is rehashed (amortized into O(1)).`
      );
    } else if (collided) {
      setNote(
        `insert("${key}"): hash%${nb} = bucket ${bucket}, already occupied → collision. Chained in the same bucket; lookups in it become O(k).`
      );
    } else {
      setNote(`insert("${key}"): hash%${nb} = bucket ${bucket}, empty → O(1).`);
    }
    setPairs((ps) => [...ps, { key, hash: h }]);
    setHot(bucket);
    setTimeout(() => setHot(null), 700);
  }

  function lookup() {
    if (!pairs.length) return;
    const p = pairs[Math.floor(Math.random() * pairs.length)];
    const bucket = p.hash % numBuckets;
    const chain = buckets[bucket];
    setHot(bucket);
    setTimeout(() => setHot(null), 900);
    setNote(
      `get("${p.key}"): jump straight to bucket ${bucket} (no scanning the whole table), then check ${chain.length} key${chain.length > 1 ? "s" : ""} in the chain. Average O(1).`
    );
  }

  function reset() {
    setPairs([]);
    setNumBuckets(4);
    setNote("Cleared.");
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 font-mono text-xs">
        <span className="text-ink-faint">keys <span className="text-ink font-semibold">{pairs.length}</span></span>
        <span className="text-ink-faint">buckets <span className="text-ink font-semibold">{numBuckets}</span></span>
        <span className="text-ink-faint">load factor <span className="font-semibold" style={{ color: load > 0.75 ? "#f87171" : ACCENT }}>{load}</span></span>
      </div>

      <div className="space-y-1.5 mb-4">
        {buckets.map((chain, i) => (
          <div key={i} className="flex items-stretch gap-2">
            <div
              className="flex-none w-10 rounded font-mono text-xs flex items-center justify-center transition-all duration-300"
              style={{
                background: hot === i ? ACCENT : "#11131a",
                color: hot === i ? "#0c0e14" : "#6b7480",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {i}
            </div>
            <div className="flex-1 flex flex-wrap gap-1.5 items-center min-h-[2.25rem] rounded bg-[#11131a] border border-line px-2 py-1">
              {chain.length === 0 && <span className="text-ink-faint/50 font-mono text-xs">empty</span>}
              {chain.map((p, j) => (
                <React.Fragment key={p.key}>
                  <span
                    className="font-mono text-xs px-2 py-1 rounded"
                    style={{ background: `color-mix(in srgb,${ACCENT} 18%,#15171f)`, color: "#eef1f7", border: `1px solid ${ACCENT}` }}
                  >
                    "{p.key}"
                  </span>
                  {j < chain.length - 1 && <span className="text-ink-faint text-xs">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={insert}>insert key</Btn>
        <Btn variant="ghost" onClick={lookup}>lookup random</Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem]">{note}</p>
    </div>
  );
}
