import React, { useState } from "react";
import { Btn } from "../../components/ui.jsx";

/*
 * Idempotency demo. Send a "charge card $50" request, then retry it (simulating
 * a network timeout where the client never saw the response). With no key each
 * retry re-applies the debit, double-charging. With an idempotency key the
 * server dedupes on the key and charges exactly once. ACCENT #8b7cff.
 */
const ACCENT = "#8b7cff";
const AMOUNT = 50;
const KEY = "idem_7f3a91";

export default function IdempotencyViz() {
  const [useKey, setUseKey] = useState(false);
  const [charged, setCharged] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [stored, setStored] = useState(false); // has KEY been recorded server-side
  const [log, setLog] = useState([]);

  function reset(nextUseKey) {
    setUseKey(nextUseKey);
    setCharged(0);
    setAttempts(0);
    setStored(false);
    setLog([]);
  }

  function attempt(label) {
    setAttempts((a) => a + 1);
    if (useKey) {
      if (stored) {
        setLog((l) => [
          ...l,
          `${label}: key ${KEY} already stored -> return saved result, NO new charge`,
        ]);
      } else {
        setStored(true);
        setCharged((c) => c + AMOUNT);
        setLog((l) => [...l, `${label}: new key ${KEY} -> debit $${AMOUNT}, store result`]);
      }
    } else {
      setCharged((c) => c + AMOUNT);
      setLog((l) => [...l, `${label}: no key -> debit $${AMOUNT} (applied every time)`]);
    }
  }

  const sent = attempts > 0;
  const doubled = charged > AMOUNT;

  let note;
  if (!sent) {
    note =
      "Send the charge, then hit retry to simulate a timeout where the client never saw the response and tries again.";
  } else if (!useKey && doubled) {
    note =
      "Double charged. Each retry re-applied the debit because nothing on the server deduplicated the request.";
  } else if (!useKey) {
    note = "One charge so far, but a retry will apply it again. Nothing is stopping a duplicate.";
  } else {
    note =
      "Charged exactly once. The server dedupes on the idempotency key, so every retry returns the stored result.";
  }

  const bigColor = charged === 0 ? "var(--color-ink-faint)" : doubled ? "#f87171" : "#4ade80";

  return (
    <div className="rounded-xl border border-line bg-surface p-4 md:p-5">
      {/* mode toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-mono text-[11px] text-ink-faint mr-1">mode</span>
        <Btn variant={!useKey ? "solid" : "ghost"} tone={ACCENT} onClick={() => reset(false)}>
          no idempotency key
        </Btn>
        <Btn variant={useKey ? "solid" : "ghost"} tone={ACCENT} onClick={() => reset(true)}>
          with idempotency key
        </Btn>
      </div>

      {/* ledger */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg border border-line bg-surface-2 p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">
            customer charged
          </div>
          <div className="font-mono text-2xl font-bold" style={{ color: bigColor }}>
            ${charged}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">
            attempts
          </div>
          <div className="font-mono text-2xl font-bold text-ink">{attempts}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface-2 p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1">
            request key
          </div>
          <div className="font-mono text-[12px] text-ink-dim break-all leading-tight pt-1">
            {useKey ? KEY : "none"}
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Btn tone={ACCENT} onClick={() => attempt("send")}>
          send charge ${AMOUNT}
        </Btn>
        <Btn tone={ACCENT} variant="ghost" disabled={!sent} onClick={() => attempt("retry")}>
          retry after timeout
        </Btn>
        <Btn tone="#f87171" variant="ghost" onClick={() => reset(useKey)}>
          reset
        </Btn>
      </div>

      {/* log */}
      {log.length > 0 && (
        <div className="rounded-lg border border-line bg-[#0e1018] p-3 mb-3 font-mono text-[11px] leading-relaxed space-y-1">
          {log.map((line, i) => (
            <div key={i} className="text-ink-dim">
              <span className="text-ink-faint mr-2">{i + 1}.</span>
              {line}
            </div>
          ))}
        </div>
      )}

      <div className="font-mono text-[11px] leading-relaxed" style={{ color: doubled ? "#f87171" : "var(--color-ink-faint)" }}>
        {note}
      </div>
    </div>
  );
}
