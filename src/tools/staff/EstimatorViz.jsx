import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#d6a94c";

/* A tiny QPS / storage estimator. Pick scale + per-write payload and read off
   the back-of-envelope numbers the way you would on a whiteboard. */

const USERS = [
  { label: "1 M users", n: 1e6 },
  { label: "10 M users", n: 1e7 },
  { label: "100 M users", n: 1e8 },
];
const WRITES_PER_USER_DAY = [
  { label: "1 write/day", n: 1 },
  { label: "10 writes/day", n: 10 },
  { label: "100 writes/day", n: 100 },
];
const PAYLOAD = [
  { label: "200 B (tweet)", n: 200 },
  { label: "1 KB (post)", n: 1e3 },
  { label: "1 MB (photo)", n: 1e6 },
];

const SECONDS_PER_DAY = 86400; // ~10^5

function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + " B";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + " M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + " K";
  return Math.round(n).toString();
}
function fmtBytes(n) {
  const u = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  while (n >= 1000 && i < u.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(n >= 100 || i === 0 ? 0 : 1) + " " + u[i];
}

export default function EstimatorViz() {
  const [ui, setUi] = useState(1); // 10 M
  const [wi, setWi] = useState(1); // 10 writes/day
  const [pi, setPi] = useState(1); // 1 KB

  const users = USERS[ui].n;
  const wpd = WRITES_PER_USER_DAY[wi].n;
  const bytes = PAYLOAD[pi].n;

  const writesDay = users * wpd;
  const writeQps = writesDay / SECONDS_PER_DAY;
  const peakQps = writeQps * 3; // crude peak factor
  const readQps = writeQps * 100; // typical read-heavy 100:1
  const bytesDay = writesDay * bytes;
  const bytesYear = bytesDay * 365;
  const bytes5yr = bytesYear * 5;

  function Picker({ options, idx, set }) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {options.map((o, i) => (
          <button
            key={o.label}
            onClick={() => set(i)}
            className="font-mono text-[11px] px-2 py-1 rounded-md border transition-colors"
            style={
              i === idx
                ? { borderColor: ACCENT, color: "#0c0e14", background: ACCENT }
                : { borderColor: "rgba(255,255,255,0.16)", color: "var(--color-ink-dim)" }
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">
            scale
          </div>
          <Picker options={USERS} idx={ui} set={setUi} />
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">
            activity
          </div>
          <Picker options={WRITES_PER_USER_DAY} idx={wi} set={setWi} />
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">
            payload / write
          </div>
          <Picker options={PAYLOAD} idx={pi} set={setPi} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 font-mono text-sm">
        <Row label="writes / day" value={fmtNum(writesDay)} />
        <Row label="write QPS (avg)" value={fmtNum(writeQps) + "/s"} hot />
        <Row label="write QPS (peak ≈ 3×)" value={fmtNum(peakQps) + "/s"} />
        <Row label="read QPS (≈ 100:1)" value={fmtNum(readQps) + "/s"} hot />
        <Row label="storage / day" value={fmtBytes(bytesDay)} />
        <Row label="storage / year" value={fmtBytes(bytesYear)} hot />
        <Row label="storage / 5 yr" value={fmtBytes(bytes5yr)} />
      </div>

      <p className="text-sm text-ink-dim leading-relaxed mt-4">
        Method: <span className="text-ink">QPS = daily events ÷ ~10⁵ s/day</span>. Reads usually
        dominate writes ~100:1, and peak traffic runs 2–3× average. Storage = events/day × payload ×
        days. Round aggressively, the goal is the right order of magnitude, not a precise figure.
      </p>
    </div>
  );
}

function Row({ label, value, hot }) {
  return (
    <div className="flex items-center justify-between border-b border-line/60 pb-1.5">
      <span className="text-ink-faint">{label}</span>
      <span
        className="font-semibold px-1.5 rounded"
        style={hot ? { color: "#0c0e14", background: ACCENT } : { color: "#eef1f7" }}
      >
        {value}
      </span>
    </div>
  );
}
