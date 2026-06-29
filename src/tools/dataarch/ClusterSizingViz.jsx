import React, { useState } from "react";

/*
 * EMR / Spark cluster sizing, the heuristic chain the architect round wants
 * you to recite out loud. All numbers below are hand-authored rules of thumb,
 * no live cluster probing. The reasoning is shown inline, not just the result.
 */
const ACCENT = "#f25f9c";

/* ~5 cores per executor is the HDFS/S3 throughput sweet spot: enough
 * parallelism per JVM without thrashing the throughput per executor. */
const CORES_PER_EXECUTOR = 5;

/* throughput assumption for the rough runtime band: one core chews through
 * input at roughly this rate (read + light transform), order-of-magnitude. */
const MB_PER_CORE_SEC = 40;

const TARGETS = [128, 256]; // target partition size, MB
const NODE_CORES = [8, 16, 32, 48]; // vCPUs per worker node

function fmtGB(gb) {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  return `${gb} GB`;
}
function fmtTime(sec) {
  if (sec < 90) return `~${Math.round(sec)} s`;
  if (sec < 5400) return `~${Math.round(sec / 60)} min`;
  return `~${(sec / 3600).toFixed(1)} h`;
}

export default function ClusterSizingViz() {
  const [inputGB, setInputGB] = useState(500);
  const [targetMB, setTargetMB] = useState(256);
  const [nodeCores, setNodeCores] = useState(16);

  // 1) partitions = input / target partition size
  const inputMB = inputGB * 1024;
  const partitions = Math.max(1, Math.round(inputMB / targetMB));

  // 2) executors per node = floor((node cores - 1 for OS/daemons) / cores-per-executor)
  const usableCores = Math.max(0, nodeCores - 1); // leave 1 core for OS + daemons
  const execPerNode = Math.max(1, Math.floor(usableCores / CORES_PER_EXECUTOR));

  // 3) pick a node count so total running cores ~= partitions we want in flight,
  //    capped so we never spin up an absurd cluster for a tiny job.
  const coresPerNode = execPerNode * CORES_PER_EXECUTOR;
  const idealNodes = Math.ceil(partitions / coresPerNode);
  const nodes = Math.min(Math.max(1, idealNodes), 50);

  const executors = nodes * execPerNode;
  const totalCores = executors * CORES_PER_EXECUTOR;

  // 4) rough runtime = total work / parallelism (one wave estimate, then scaled
  //    by how many waves of partitions we have to push through the cores).
  const waves = Math.ceil(partitions / totalCores);
  const runtimeSec = (inputMB / (totalCores * MB_PER_CORE_SEC)) || 0;

  // cautions
  const tooFew = partitions < totalCores; // not even one full wave -> idle cores
  const tooMany = partitions > 12000; // thousands of tiny tasks -> scheduling overhead + many waves

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* input size slider */}
      <div className="mb-4">
        <div className="flex justify-between font-mono text-[11px] mb-1">
          <span className="text-ink-dim">input data size</span>
          <span style={{ color: ACCENT }}>{fmtGB(inputGB)}</span>
        </div>
        <input
          type="range" min={1} max={2000} step={1} value={inputGB}
          onChange={(e) => setInputGB(parseInt(e.target.value, 10))}
          className="w-full" style={{ accentColor: ACCENT }}
        />
      </div>

      {/* target partition size */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="font-mono text-[11px] text-ink-dim mb-1.5">target partition size</div>
          <div className="flex gap-1.5">
            {TARGETS.map((t) => (
              <button
                key={t}
                onClick={() => setTargetMB(t)}
                className="flex-1 font-mono text-xs px-2 py-1.5 rounded-md border transition-colors"
                style={
                  targetMB === t
                    ? { borderColor: ACCENT, color: ACCENT, background: "color-mix(in srgb, " + ACCENT + " 10%, transparent)" }
                    : { borderColor: "var(--color-line)", color: "var(--color-ink-dim)" }
                }
              >
                {t} MB
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-mono text-[11px] text-ink-dim mb-1.5">cores per worker node</div>
          <div className="flex gap-1.5">
            {NODE_CORES.map((c) => (
              <button
                key={c}
                onClick={() => setNodeCores(c)}
                className="flex-1 font-mono text-xs px-2 py-1.5 rounded-md border transition-colors"
                style={
                  nodeCores === c
                    ? { borderColor: ACCENT, color: ACCENT, background: "color-mix(in srgb, " + ACCENT + " 10%, transparent)" }
                    : { borderColor: "var(--color-line)", color: "var(--color-ink-dim)" }
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* result block */}
      <div className="rounded-lg bg-surface-2 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {[
            ["partitions", partitions.toLocaleString(), `${fmtGB(inputGB)} / ${targetMB}MB`],
            ["executors", `${executors}`, `${execPerNode}/node x ${nodes} nodes`],
            ["total cores", `${totalCores}`, `${CORES_PER_EXECUTOR} cores/executor`],
            ["rough runtime", fmtTime(runtimeSec), `${waves} wave${waves === 1 ? "" : "s"}`],
          ].map(([k, v, sub]) => (
            <div key={k}>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{k}</div>
              <div className="text-xl font-bold" style={{ color: ACCENT }}>{v}</div>
              <div className="font-mono text-[10px] text-ink-faint">{sub}</div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-line font-mono text-[11px] text-ink-dim leading-relaxed">
          partitions = input / target, then ~5 cores/executor, 1 core/node held back for the OS and
          daemons, and enough nodes to run roughly {totalCores} tasks at once. Runtime ~= total work /
          parallelism.
        </div>

        {tooFew && (
          <div
            className="mt-2 rounded-md p-2.5 text-[12px] leading-snug"
            style={{ background: "color-mix(in srgb, var(--color-warn) 10%, transparent)", borderLeft: "3px solid var(--color-warn)" }}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--color-warn)" }}>caution</span>
            <div className="text-ink-dim mt-0.5">
              Only {partitions} partitions for {totalCores} cores: cores sit idle and each task is large,
              risking spill. Drop the cluster size or lower the target partition size.
            </div>
          </div>
        )}
        {tooMany && (
          <div
            className="mt-2 rounded-md p-2.5 text-[12px] leading-snug"
            style={{ background: "color-mix(in srgb, var(--color-trap) 10%, transparent)", borderLeft: "3px solid var(--color-trap)" }}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--color-trap)" }}>caution</span>
            <div className="text-ink-dim mt-0.5">
              {partitions.toLocaleString()} partitions is a lot of tiny tasks: scheduling overhead and a
              flood of small output files start to dominate. Raise the target partition size.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
