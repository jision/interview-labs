import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Back-of-envelope capacity estimator. Turn a handful of product numbers
 * (DAU, actions, payload, retention, peak factor) into the four numbers an
 * interviewer wants to hear out loud: average QPS, peak QPS, storage per year,
 * and read bandwidth. Hand arithmetic only, every formula shown. No live data.
 */
const ACCENT = "#4aa3ff";
const SEC_PER_DAY = 86400; // ~= 100K, the number to memorize
const READ_WRITE = 10; // stated assumption: read-heavy feed, reads ~ 10x writes

// payload choices in bytes, so the slider snaps to friendly powers of two
const PAYLOADS = [64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];

function fmtCount(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(n >= 1e13 ? 0 : 1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "K";
  return String(Math.round(n));
}

function fmtBytes(b) {
  const u = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  let i = 0;
  let v = b;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return v.toFixed(v >= 100 || i === 0 ? 0 : 1) + " " + u[i];
}

function fmtQps(n) {
  if (n >= 1e6) return fmtCount(n);
  if (n >= 1000) return fmtCount(n);
  return n < 10 ? n.toFixed(1) : String(Math.round(n));
}

function Slider({ label, value, min, max, step, onChange, display }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[11px] mb-1">
        <span className="text-ink-dim">{label}</span>
        <span style={{ color: ACCENT }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full"
        style={{ accentColor: ACCENT }}
      />
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">{label}</div>
      <div className="text-lg font-bold text-ink leading-none mb-1" style={{ color: ACCENT }}>
        {value}
      </div>
      <div className="font-mono text-[10px] text-ink-faint leading-snug">{sub}</div>
    </div>
  );
}

export default function CapacityEstimatorViz() {
  const [dauM, setDauM] = useState(100); // DAU in millions
  const [actions, setActions] = useState(10); // write actions / user / day
  const [payIdx, setPayIdx] = useState(4); // index into PAYLOADS -> 1024 B
  const [retention, setRetention] = useState(3); // years
  const [peak, setPeak] = useState(5); // peak / average factor

  const dau = dauM * 1e6;
  const payload = PAYLOADS[payIdx];

  const writesPerDay = dau * actions;
  const avgQps = writesPerDay / SEC_PER_DAY;
  const peakQps = avgQps * peak;
  const storagePerYear = writesPerDay * payload * 365;
  const totalStorage = storagePerYear * retention;
  const readQpsPeak = peakQps * READ_WRITE;
  const readBwPeak = readQpsPeak * payload; // bytes / sec at peak

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* inputs */}
      <div className="grid sm:grid-cols-2 gap-x-5 gap-y-3 mb-4">
        <Slider
          label="daily active users"
          value={dauM}
          min={1}
          max={1000}
          step={1}
          onChange={setDauM}
          display={fmtCount(dau)}
        />
        <Slider
          label="write actions / user / day"
          value={actions}
          min={1}
          max={100}
          step={1}
          onChange={setActions}
          display={actions + " / day"}
        />
        <Slider
          label="avg payload / write"
          value={payIdx}
          min={0}
          max={PAYLOADS.length - 1}
          step={1}
          onChange={setPayIdx}
          display={fmtBytes(payload)}
        />
        <Slider
          label="retention"
          value={retention}
          min={1}
          max={10}
          step={1}
          onChange={setRetention}
          display={retention + (retention === 1 ? " year" : " years")}
        />
        <Slider
          label="peak / average factor"
          value={peak}
          min={1}
          max={20}
          step={1}
          onChange={setPeak}
          display={peak + "x"}
        />
        <div className="flex items-end">
          <Btn variant="ghost" tone={ACCENT} onClick={() => { setDauM(100); setActions(10); setPayIdx(4); setRetention(3); setPeak(5); }}>
            reset to 100M DAU
          </Btn>
        </div>
      </div>

      {/* outputs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <Stat label="avg write QPS" value={fmtQps(avgQps)} sub={fmtCount(writesPerDay) + " writes/day / 86.4K s"} />
        <Stat label="peak write QPS" value={fmtQps(peakQps)} sub={"avg x " + peak + " peak factor"} />
        <Stat label="storage / year" value={fmtBytes(storagePerYear)} sub={fmtBytes(totalStorage) + " over " + retention + "y"} />
        <Stat label="peak read bandwidth" value={fmtBytes(readBwPeak) + "/s"} sub={"reads ~" + READ_WRITE + "x writes"} />
      </div>

      {/* the arithmetic, shown */}
      <div className="rounded-lg border border-line bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-ink-dim overflow-x-auto">
        <div className="text-ink-faint uppercase tracking-wider text-[10px] mb-1.5">the hand arithmetic</div>
        <div>writes/day = {fmtCount(dau)} DAU x {actions} = <span className="text-ink">{fmtCount(writesPerDay)}</span></div>
        <div>avg QPS = writes/day / 86,400 = <span className="text-ink">{fmtQps(avgQps)}</span></div>
        <div>peak QPS = avg x {peak} = <span className="text-ink">{fmtQps(peakQps)}</span></div>
        <div>storage/yr = writes/day x {fmtBytes(payload)} x 365 = <span className="text-ink">{fmtBytes(storagePerYear)}</span></div>
        <div>read BW = peak QPS x {READ_WRITE} x {fmtBytes(payload)} = <span className="text-ink">{fmtBytes(readBwPeak)}/s</span></div>
      </div>

      <div className="mt-3 font-mono text-[11px] text-ink-faint leading-relaxed">
        Round hard and narrate every step. The point is the order of magnitude that picks your shard count and
        partition key, not a number with six digits of fake precision.
      </div>
    </div>
  );
}
