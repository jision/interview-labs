import React, { useState, useRef, useEffect } from "react";
import { Btn } from "../../components/ui.jsx";

const ACCENT = "#d6a94c";
const CAP = 5; // bucket capacity
const REFILL = 1; // tokens added per tick

export default function TokenBucketViz() {
  const [tokens, setTokens] = useState(CAP);
  const [allowed, setAllowed] = useState(0);
  const [denied, setDenied] = useState(0);
  const [flash, setFlash] = useState(null); // 'allow' | 'deny' | 'refill'
  const [note, setNote] = useState(
    `Bucket starts full: ${CAP} tokens. Each request spends 1 token; the bucket refills ${REFILL}/tick up to ${CAP}.`
  );
  const timers = useRef([]);

  // clean up any pending flash timers when the component unmounts
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  function doFlash(kind) {
    setFlash(kind);
    const t = setTimeout(() => {
      setFlash(null);
      timers.current = timers.current.filter((x) => x !== t);
    }, 450);
    timers.current.push(t);
  }

  // Decide from committed state in the handler (not inside the updater) so the
  // counters/flash fire exactly once, even with React StrictMode double-invoking updaters.
  function request() {
    if (tokens > 0) {
      setTokens(tokens - 1);
      setAllowed((a) => a + 1);
      doFlash("allow");
      setNote(`allow_request() → tokens (${tokens} > 0): ALLOWED. Spend 1 token, ${tokens - 1} left.`);
    } else {
      setDenied((d) => d + 1);
      doFlash("deny");
      setNote("allow_request() → tokens == 0: DENIED (rate limited). No token to spend.");
    }
  }

  function tick() {
    const next = Math.min(CAP, tokens + REFILL);
    setTokens(next);
    doFlash("refill");
    setNote(
      next === tokens
        ? `tick: bucket already full at ${CAP}, refill is capped, extra tokens are discarded (this is the burst limit).`
        : `tick: refilled +${REFILL} → ${next} tokens. Refill is steady; the bucket caps at ${CAP}.`
    );
  }

  function reset() {
    setTokens(CAP);
    setAllowed(0);
    setDenied(0);
    setFlash(null);
    setNote(`Reset. Bucket full at ${CAP} tokens.`);
  }

  const cells = [];
  for (let i = 0; i < CAP; i++) {
    const filled = i < tokens;
    cells.push(
      <div
        key={i}
        className="flex-none w-9 h-12 rounded-md transition-all duration-300 flex items-center justify-center"
        style={
          filled
            ? {
                background:
                  flash === "refill" && i === tokens - 1
                    ? ACCENT
                    : "color-mix(in srgb,#d6a94c 22%,#15171f)",
                border: `1px solid ${ACCENT}`,
              }
            : { background: "#11131a", border: "1px dashed rgba(255,255,255,0.12)" }
        }
      >
        {filled && <span className="w-3 h-3 rounded-full" style={{ background: ACCENT }} />}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-line p-5">
      <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 font-mono text-xs">
        <span className="text-ink-faint">
          tokens{" "}
          <span className="text-ink font-semibold">
            {tokens}/{CAP}
          </span>
        </span>
        <span className="text-ink-faint">
          refill <span className="text-ink font-semibold">{REFILL}/tick</span>
        </span>
        <span className="text-ink-faint">
          allowed <span style={{ color: "#4ade80" }} className="font-semibold">{allowed}</span>
        </span>
        <span className="text-ink-faint">
          denied <span style={{ color: "#f87171" }} className="font-semibold">{denied}</span>
        </span>
      </div>

      {/* Bucket */}
      <div className="flex items-end gap-2 mb-3 min-h-[3.5rem]">
        {cells}
        <div
          className="ml-3 font-mono text-sm font-bold transition-opacity duration-200"
          style={{
            opacity: flash === "allow" || flash === "deny" ? 1 : 0.25,
            color: flash === "deny" ? "#f87171" : "#4ade80",
          }}
        >
          {flash === "allow" ? "✓ ALLOW" : flash === "deny" ? "✕ DENY" : ""}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Btn tone={ACCENT} onClick={request}>allow_request()</Btn>
        <Btn tone="#5fb3f0" onClick={tick}>tick (refill +{REFILL})</Btn>
        <Btn variant="ghost" onClick={reset}>reset</Btn>
      </div>

      <p className="text-sm text-ink-dim leading-relaxed min-h-[2.5rem]">{note}</p>
    </div>
  );
}
