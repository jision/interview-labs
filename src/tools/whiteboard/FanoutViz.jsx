import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Fan-out on write vs fan-out on read for a social feed. Flip the delivery
 * model and the author type (normal user vs celebrity) and watch where the
 * work lands: write amplification at publish time, or read amplification at
 * feed-load time. Ends on the hybrid answer. Pure illustration, no live data.
 */
const ACCENT = "#4aa3ff";
const WRITE = "#4aa3ff"; // work paid at publish
const READ_TONE = "#f5a623"; // work paid at read

const AUTHORS = {
  normal: { label: "Normal user", followers: 300 },
  celeb: { label: "Celebrity", followers: 50000000 },
};

function fmtCount(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "K";
  return String(Math.round(n));
}

function Tile({ label, value, tone, sub }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">{label}</div>
      <div className="text-lg font-bold leading-none mb-1" style={{ color: tone }}>
        {value}
      </div>
      <div className="font-mono text-[10px] text-ink-faint leading-snug">{sub}</div>
    </div>
  );
}

export default function FanoutViz() {
  const [mode, setMode] = useState("write"); // "write" | "read"
  const [who, setWho] = useState("normal"); // "normal" | "celeb"

  const followers = AUTHORS[who].followers;
  const onWrite = mode === "write";

  // work to get ONE post in front of ALL followers
  const publishWork = onWrite ? followers : 1; // copies written now
  const serveWork = onWrite ? 1 : followers; // reads recomputed per feed load

  const bottleneck = onWrite ? "write amplification" : "read amplification";
  const bottleneckTone = onWrite ? WRITE : READ_TONE;

  // one inbox cell per follower, capped for the eyes
  const CELLS = 28;
  const filled = Math.min(followers, CELLS);
  const overflow = followers - filled;

  const note = onWrite
    ? who === "celeb"
      ? "Push model, celebrity: one post fans out to 50M inboxes, a write storm that can take minutes and starves every other writer. This is the case push must never handle."
      : "Push model, normal user: 300 cheap copies at publish, then every feed load is O(1), just read your own materialized inbox. Great when writes are rare and reads are hot."
    : who === "celeb"
      ? "Pull model, celebrity: publishing is a single append, no storm. But the post is re-fetched on every one of 50M followers' feed loads, so the read side never stops recomputing."
      : "Pull model, normal user: publishing is one write, and each feed load merges recent posts from everyone you follow. Fine at small scale, but nothing is cached between loads.";

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-mono text-[11px] text-ink-faint mr-1">model</span>
        <Btn variant={onWrite ? "solid" : "ghost"} tone={ACCENT} onClick={() => setMode("write")}>fan-out on write</Btn>
        <Btn variant={!onWrite ? "solid" : "ghost"} tone={ACCENT} onClick={() => setMode("read")}>fan-out on read</Btn>
        <span className="font-mono text-[11px] text-ink-faint mx-1 ml-3">author</span>
        <Btn variant={who === "normal" ? "solid" : "ghost"} tone={ACCENT} onClick={() => setWho("normal")}>normal user</Btn>
        <Btn variant={who === "celeb" ? "solid" : "ghost"} tone={ACCENT} onClick={() => setWho("celeb")}>celebrity</Btn>
      </div>

      {/* the diagram: author -> follower inboxes */}
      <div className="rounded-lg border border-line bg-surface-2 p-3 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-md border px-2.5 py-1.5 font-mono text-[11px]" style={{ borderColor: ACCENT, color: ACCENT }}>
            author posts
          </div>
          <div className="font-mono text-[10px] text-ink-faint">
            {onWrite ? "-> copy into each follower inbox (now)" : "-> append once; readers pull it later"}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: filled }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-sm border transition-all duration-300"
              style={{
                borderColor: "var(--color-line-strong)",
                background: `color-mix(in srgb, ${onWrite ? WRITE : READ_TONE} 45%, transparent)`,
              }}
              title="follower inbox"
            />
          ))}
          {overflow > 0 && (
            <div className="font-mono text-[11px] px-2 self-center" style={{ color: onWrite ? WRITE : READ_TONE }}>
              + {fmtCount(overflow)} more follower inboxes
            </div>
          )}
        </div>
        <div className="font-mono text-[10px] text-ink-faint mt-2">
          {fmtCount(followers)} followers · shown capped at {CELLS} for the eyes
        </div>
      </div>

      {/* the numbers */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Tile
          label="work at publish"
          value={onWrite ? fmtCount(publishWork) + " writes" : "1 write"}
          tone={onWrite ? WRITE : "var(--color-ink-dim)"}
          sub={onWrite ? "one copy per follower inbox" : "single append to author timeline"}
        />
        <Tile
          label="work to serve all followers"
          value={onWrite ? "O(1) / read" : fmtCount(serveWork) + " reads"}
          tone={onWrite ? "var(--color-ink-dim)" : READ_TONE}
          sub={onWrite ? "read your own materialized feed" : "post re-fetched on every feed load"}
        />
      </div>

      <div className="rounded-lg border p-2.5 mb-3" style={{ borderColor: bottleneckTone, background: `color-mix(in srgb, ${bottleneckTone} 8%, transparent)` }}>
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: bottleneckTone }}>bottleneck · </span>
        <span className="font-mono text-[11px] text-ink-dim">{bottleneck}</span>
      </div>

      <div className="font-mono text-[11px] text-ink-faint leading-relaxed mb-3">{note}</div>

      {/* the hybrid answer, always visible */}
      <div className="rounded-lg border border-dashed p-3" style={{ borderColor: ACCENT, background: `color-mix(in srgb, ${ACCENT} 7%, transparent)` }}>
        <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: ACCENT }}>the hybrid answer</div>
        <div className="text-[12px] text-ink-dim leading-relaxed">
          Push for the ~99% of authors with normal follower counts, so their followers get cheap O(1) feeds. Do
          not fan out the handful of celebrities; pull their posts at read time and merge them into the
          precomputed feed. That caps write amplification and keeps reads mostly materialized. Threshold on
          follower count is the tunable knob.
        </div>
      </div>
    </div>
  );
}
