import React from "react";
import { BackLink } from "./ToolShell.jsx";

export function ComingSoon({ accent, eyebrow, title, blurb, planned = [] }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <BackLink />
      <div className="max-w-2xl mx-auto px-6 py-24">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.2em] mb-2"
          style={{ color: accent }}
        >
          {eyebrow}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">{title}</h1>
        <p className="text-ink-dim leading-relaxed mb-8">{blurb}</p>

        <div className="rounded-xl bg-surface border border-line p-6">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-4">
            Planned for this lab
          </div>
          <ul className="space-y-2.5">
            {planned.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm text-ink-dim">
                <span style={{ color: accent }}>›</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-sm text-ink-faint">
          DSA · LAB is the flagship and is built first — the rest follow the same design
          system, so they'll come together fast.
        </p>
      </div>
    </div>
  );
}
