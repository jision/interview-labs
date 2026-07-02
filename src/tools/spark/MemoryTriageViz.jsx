import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * OOM triage drill. Pick a symptom, then progressively reveal three panels:
 *   1. where to look  -> the exact Spark UI page / metric
 *   2. likely causes  -> ranked, most common first
 *   3. the fix ladder -> ordered remedies to try in sequence
 * Symptom-driven so the rep is "I saw X, so I look at Y, suspect Z, and try W".
 * Self-contained, pure illustration.
 */
const ACCENT = "#ff8a3d";

const SYMPTOMS = [
  { id: "driver", label: "Driver OOM" },
  { id: "heap", label: "Executor heap OOM" },
  { id: "exit137", label: "Container killed (exit 137)" },
  { id: "spill", label: "Massive spill, job crawls" },
  { id: "straggler", label: "One task never finishes" },
];

const TRIAGE = {
  driver: {
    look: [
      "Driver stderr / the failed action: OutOfMemoryError on the driver, not an executor.",
      "Spark UI SQL tab: a Collect / CollectLimit node, or a huge BroadcastExchange feeding the driver.",
      "Environment tab: check spark.driver.memory and the broadcast threshold.",
    ],
    causes: [
      "collect() / toPandas() pulling a large result back to one JVM.",
      "A broadcast whose real size blew past the estimate, materialized on the driver first.",
      "Too many task results returned (spark.driver.maxResultSize) from a wide action.",
    ],
    fixes: [
      "Stop collecting: use write, show(n), or take(n) instead of collect() / toPandas().",
      "Lower spark.sql.autoBroadcastJoinThreshold or drop the explicit broadcast() on a not-small table.",
      "Aggregate or sample before pulling to the driver so the returned result is genuinely small.",
      "Only then raise spark.driver.memory - it is the last resort, not the first.",
    ],
  },
  heap: {
    look: [
      "Stages tab: the failed stage's task table, sorted by input / shuffle-read size.",
      "Task summary metrics: compare MAX vs MEDIAN shuffle read - a huge max means one fat partition.",
      "GC time column: high GC right before the OOM confirms heap pressure, not overhead.",
    ],
    causes: [
      "A skewed partition: one key's rows all landed on one task (max >> median).",
      "Too few partitions, so each task's slice is simply too big for the heap.",
      "Wide aggregation / window state, or genuinely giant rows (exploded arrays, huge strings).",
    ],
    fixes: [
      "More partitions: raise spark.sql.shuffle.partitions or repartition so each task shrinks.",
      "Salt the skewed key (or lean on AQE skew-join) so the hot partition is split.",
      "Fewer cores per executor: same heap divided among fewer concurrent tasks = more memory each.",
      "Trim the rows early - project only needed columns, filter before the wide op.",
    ],
  },
  exit137: {
    look: [
      "YARN / K8s: the container was killed for exceeding PHYSICAL memory, exit code 137 (SIGKILL).",
      "Not a JVM OutOfMemoryError - the heap was fine, the whole container overran its limit.",
      "Executors tab shows the executor lost / replaced, not an in-JVM stack trace.",
    ],
    causes: [
      "Off-heap growth outside the heap: PySpark / pandas-UDF Python workers, Arrow buffers, netty.",
      "spark.executor.memoryOverhead too small for that off-heap footprint (default max(384MB, 10%)).",
      "Off-heap execution memory or native libraries pushing the container past its ceiling.",
    ],
    fixes: [
      "RAISE spark.executor.memoryOverhead - this is the classic exit-137 fix, NOT raising heap.",
      "For heavy PySpark / pandas UDFs, give more overhead headroom or fewer cores per executor.",
      "Confirm container = heap + overhead + off-heap fits the node; shrink one side if not.",
      "Only raise executor heap if the failure is truly an in-heap OOM, which 137 usually is not.",
    ],
  },
  spill: {
    look: [
      "Stages tab: the Spill (memory) and Spill (disk) columns are non-zero and large.",
      "Task summary: spill appears well before any OOM - it is the pressure valve doing its job.",
      "Shuffle read size vs partition count: big reads over few partitions force the spill.",
    ],
    causes: [
      "Too few partitions, so each task's working set exceeds execution memory and overflows to disk.",
      "A wide aggregation / sort / join whose in-memory build does not fit.",
      "Mild skew: some tasks are big enough to spill while others do not.",
    ],
    fixes: [
      "Increase partitions (shuffle.partitions / repartition) so each task's slice fits in memory.",
      "Raise spark.memory.fraction headroom by giving the executor more memory or fewer cores.",
      "Reduce data early: filter / project / pre-aggregate before the wide op.",
      "Spill is survivable - fix it for speed, but it is a warning that OOM is one step away.",
    ],
  },
  straggler: {
    look: [
      "Stages tab: one task's duration is far above the median (MAX >> MEDIAN) while the stage waits.",
      "That task's shuffle-read is much larger than its peers - the tell for a hot key.",
      "Event timeline: 199 tasks done, the stage stuck on task 200 for the bulk of the runtime.",
    ],
    causes: [
      "Data skew: one join / groupBy key holds most of the rows, so one task does most of the work.",
      "Stage time = MAX task time, so a single straggler holds the whole stage hostage.",
      "The fat task may also spill or OOM as it grinds through its oversized partition.",
    ],
    fixes: [
      "Enable / trust AQE skew-join handling - it splits the oversized partition at runtime for free.",
      "Salt the hot key so its rows spread across N partitions, then aggregate in two passes.",
      "Broadcast the small side so the skewed side is never shuffled by that key.",
      "Isolate the handful of hot keys, process them separately, and union the result back.",
    ],
  },
};

const STAGES = [
  { id: "look", label: "1 · where to look", tone: "#60a5fa", heading: "The Spark UI page / metric" },
  { id: "causes", label: "2 · likely causes", tone: "#fbbf24", heading: "Ranked, most common first" },
  { id: "fixes", label: "3 · the fix ladder", tone: "#4ade80", heading: "Try these in order" },
];

export default function MemoryTriageViz() {
  const [symptom, setSymptom] = useState(null);
  const [shown, setShown] = useState({ look: false, causes: false, fixes: false });

  function pick(id) {
    setSymptom(id);
    setShown({ look: false, causes: false, fixes: false });
  }
  function reset() {
    setSymptom(null);
    setShown({ look: false, causes: false, fixes: false });
  }

  const data = symptom ? TRIAGE[symptom] : null;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* symptom picker */}
      <div className="font-mono text-[11px] text-ink-faint mb-2">the symptom you actually saw</div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {SYMPTOMS.map((s) => (
          <Btn
            key={s.id}
            variant={symptom === s.id ? "solid" : "ghost"}
            tone={ACCENT}
            onClick={() => pick(s.id)}
          >
            {s.label}
          </Btn>
        ))}
      </div>

      {!symptom ? (
        <div className="rounded-lg border border-dashed border-line bg-surface-2 p-4 text-center">
          <div className="font-mono text-[11px] text-ink-faint leading-relaxed">
            Pick a symptom to walk the triage: where to look, then likely causes, then the fix ladder.
          </div>
        </div>
      ) : (
        <>
          {/* progressive reveal buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {STAGES.map((st) => (
              <Btn
                key={st.id}
                variant={shown[st.id] ? "ghost" : "solid"}
                tone={st.tone}
                disabled={shown[st.id]}
                onClick={() => setShown((prev) => ({ ...prev, [st.id]: true }))}
              >
                {st.label}
              </Btn>
            ))}
            <Btn tone={ACCENT} variant="ghost" onClick={reset}>
              reset
            </Btn>
          </div>

          {/* revealed panels */}
          <div className="space-y-2">
            {STAGES.map((st) =>
              shown[st.id] ? (
                <div
                  key={st.id}
                  className="rounded-lg border border-line bg-surface-2 p-3"
                  style={{ borderLeft: `3px solid ${st.tone}` }}
                >
                  <div
                    className="font-mono text-[10px] uppercase tracking-wider mb-2"
                    style={{ color: st.tone }}
                  >
                    {st.label} · {st.heading}
                  </div>
                  <ul className="space-y-1.5">
                    {data[st.id].map((line, i) => (
                      <li key={i} className="text-[12.5px] text-ink-dim leading-snug flex gap-2">
                        <span className="font-mono select-none" style={{ color: st.tone }}>
                          {st.id === "fixes" ? `${i + 1}.` : "-"}
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </div>
        </>
      )}
    </div>
  );
}
