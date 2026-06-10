import React from "react";
import { Card, SectionTitle, ComplexityTag } from "./ui.jsx";

/*
 * Shared content-layout primitives for every tool page.
 * Keeps DSA Lab, Interview Bench, Identifier, and Staff Bench visually identical.
 *
 *   <Lede>           one-paragraph intro under a topic title
 *   <Try accent>     wraps an interactive demo with a "▸ try it" label
 *   <Block eyebrow title accent>  a titled content card
 *   <OpTable rows>   a complexity / comparison table
 */

export function Lede({ children }) {
  return (
    <p className="text-ink-dim leading-relaxed text-[15px] mb-5 max-w-2xl">{children}</p>
  );
}

export function Try({ accent, label = "try it", children }) {
  return (
    <div className="mb-5">
      <div
        className="font-mono text-[11px] uppercase tracking-wider mb-2"
        style={{ color: accent || "var(--color-ink-faint)" }}
      >
        ▸ {label}
      </div>
      {children}
    </div>
  );
}

export function Block({ eyebrow, title, accent, children }) {
  return (
    <Card className="p-5 md:p-6 mb-5">
      <SectionTitle eyebrow={eyebrow} accent={accent}>
        {title}
      </SectionTitle>
      {children}
    </Card>
  );
}

/* rows: [{ op, avg, avgTone, worst, worstTone, why }]
   tones: "good" | "ok" | "bad". Omit worst to show a single-column table. */
export function OpTable({ rows, cols = ["Operation", "Average", "Worst", "Why"] }) {
  const showWorst = rows.some((r) => r.worst != null);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            <th className="py-2 pr-4 font-normal">{cols[0]}</th>
            <th className="py-2 pr-4 font-normal">{cols[1]}</th>
            {showWorst && <th className="py-2 pr-4 font-normal">{cols[2]}</th>}
            <th className="py-2 font-normal">{cols[3]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line align-top">
              <td className="py-2.5 pr-4 font-mono text-ink">{r.op}</td>
              <td className="py-2.5 pr-4">
                <ComplexityTag tone={r.avgTone}>{r.avg}</ComplexityTag>
              </td>
              {showWorst && (
                <td className="py-2.5 pr-4">
                  <ComplexityTag tone={r.worstTone}>{r.worst}</ComplexityTag>
                </td>
              )}
              <td className="py-2.5 text-ink-dim">{r.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Convenience: bind a tool's accent once so pages can use <Block>/<Try> without
   repeating accent on every call.  const { Block, Try } = withAccent("#e8553b"). */
export function withAccent(accent) {
  return {
    Block: (props) => <Block accent={accent} {...props} />,
    Try: (props) => <Try accent={accent} {...props} />,
  };
}
