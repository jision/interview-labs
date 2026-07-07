import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Circuit-breaker state machine, CLOSED / OPEN / HALF-OPEN.
 * Drive it by hand: send successes and failures, watch the failure counter
 * trip the breaker at the threshold, let the cooldown elapse into a trial
 * probe, and see the probe promote back to CLOSED or demote to OPEN.
 * No data, pure illustration of the pattern.
 */
const ACCENT = "#f26d9c";
const THRESHOLD = 3;

const STATE_META = {
  CLOSED: {
    color: "#4ade80",
    blurb: "Traffic flows to the dependency. Consecutive failures are counted; a success resets the count.",
  },
  OPEN: {
    color: "#f87171",
    blurb: "The breaker is tripped. Calls fail fast without touching the dependency, giving it room to recover.",
  },
  "HALF-OPEN": {
    color: "#fbbf24",
    blurb: "One trial request is allowed through. Success closes the breaker; a single failure re-opens it.",
  },
};

export default function CircuitBreakerViz() {
  const [state, setState] = useState("CLOSED");
  const [failures, setFailures] = useState(0);
  const [trips, setTrips] = useState(0);
  const [msg, setMsg] = useState("Breaker starts CLOSED. Send a few failures to trip it.");

  function onSuccess() {
    if (state === "CLOSED") {
      setFailures(0);
      setMsg("Success in CLOSED. Failure counter reset to 0, traffic keeps flowing.");
    } else if (state === "HALF-OPEN") {
      setState("CLOSED");
      setFailures(0);
      setMsg("Trial request succeeded in HALF-OPEN -> promote to CLOSED. Dependency looks healthy again.");
    }
  }

  function onFailure() {
    if (state === "CLOSED") {
      const next = failures + 1;
      if (next >= THRESHOLD) {
        setState("OPEN");
        setFailures(next);
        setTrips((t) => t + 1);
        setMsg(`Failure ${next} of ${THRESHOLD} in CLOSED -> threshold hit, breaker TRIPS to OPEN. Calls now fail fast.`);
      } else {
        setFailures(next);
        setMsg(`Failure ${next} of ${THRESHOLD} in CLOSED. One more and the breaker trips.`);
      }
    } else if (state === "HALF-OPEN") {
      setState("OPEN");
      setMsg("Trial request failed in HALF-OPEN -> demote straight back to OPEN. Restart the cooldown.");
    }
  }

  function onCooldown() {
    if (state === "OPEN") {
      setState("HALF-OPEN");
      setFailures(0);
      setMsg("Cooldown elapsed -> OPEN moves to HALF-OPEN. One probe request is allowed through.");
    }
  }

  const requestsBlocked = state === "OPEN";
  const cooldownReady = state === "OPEN";

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* state track */}
      <div className="font-mono text-[11px] text-ink-faint mb-2">breaker state</div>
      <div className="flex items-center gap-2 mb-4">
        {["CLOSED", "OPEN", "HALF-OPEN"].map((s, i) => {
          const active = state === s;
          const meta = STATE_META[s];
          return (
            <React.Fragment key={s}>
              <div
                className="flex-1 text-center rounded-lg border py-2.5 transition-all duration-200"
                style={{
                  borderColor: active ? meta.color : "var(--color-line)",
                  background: active ? `color-mix(in srgb, ${meta.color} 16%, transparent)` : "transparent",
                }}
              >
                <div
                  className="font-mono text-[12px] font-semibold"
                  style={{ color: active ? meta.color : "var(--color-ink-faint)" }}
                >
                  {s}
                </div>
              </div>
              {i < 2 && <span className="font-mono text-[11px] text-ink-faint">-&gt;</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* counters */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          ["failure count", `${failures} / ${THRESHOLD}`, failures >= THRESHOLD ? "#f87171" : "var(--color-ink)"],
          ["times tripped", `${trips}`, "var(--color-ink)"],
          ["calls to dep", requestsBlocked ? "blocked" : "flowing", requestsBlocked ? "#f87171" : "#4ade80"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-lg border border-line bg-surface-2 p-2.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">{k}</div>
            <div className="font-mono text-[13px] font-semibold" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Btn tone="#4ade80" onClick={onSuccess} disabled={requestsBlocked}>request succeeds</Btn>
        <Btn tone="#f87171" onClick={onFailure} disabled={requestsBlocked}>request fails</Btn>
        <Btn tone={ACCENT} variant={cooldownReady ? "solid" : "ghost"} onClick={onCooldown} disabled={!cooldownReady}>
          cooldown elapses
        </Btn>
      </div>

      {/* live explanation */}
      <div
        className="rounded-lg p-3 text-[12px] leading-relaxed text-ink-dim border-l-2"
        style={{ borderColor: STATE_META[state].color, background: `color-mix(in srgb, ${STATE_META[state].color} 7%, transparent)` }}
      >
        {msg}
      </div>
      <div className="mt-2 font-mono text-[10px] text-ink-faint leading-relaxed">
        {STATE_META[state].blurb}
      </div>
    </div>
  );
}
