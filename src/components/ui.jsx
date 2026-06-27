import React from "react";

/* Tiny classnames joiner, no dependency needed. */
export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/* ── Card ─────────────────────────────────────────────────────── */
export function Card({ accent, className, children, ...rest }) {
  return (
    <div
      className={cx(
        "rounded-xl bg-surface border border-line",
        accent && "border-t-3",
        className
      )}
      style={accent ? { borderTopColor: accent, borderTopWidth: 3 } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── Section heading with an eyebrow label ────────────────────── */
export function SectionTitle({ eyebrow, children, accent }) {
  return (
    <div className="mb-4">
      {eyebrow && (
        <div
          className="font-mono text-[11px] uppercase tracking-[0.15em] mb-1.5"
          style={{ color: accent || "var(--color-ink-faint)" }}
        >
          {eyebrow}
        </div>
      )}
      <h2 className="text-xl font-bold text-ink tracking-tight">{children}</h2>
    </div>
  );
}

/* ── Tag / pill ───────────────────────────────────────────────── */
export function Tag({ children, color }) {
  return (
    <span
      className="inline-block font-mono text-[11px] px-2 py-0.5 rounded-full border border-line-strong"
      style={{ color: color || "var(--color-ink-dim)" }}
    >
      {children}
    </span>
  );
}

/* ── Complexity badge, colored by how good the Big-O is ──────── */
const COMPLEXITY_TONE = {
  good: "#4ade80", // O(1), O(log n)
  ok: "#fbbf24", // O(n)
  bad: "#f87171", // O(n log n)+, O(n^2)
};
export function ComplexityTag({ children, tone = "ok", label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label && <span className="text-ink-faint text-xs">{label}</span>}
      <code
        className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded"
        style={{
          color: COMPLEXITY_TONE[tone],
          background: "color-mix(in srgb, " + COMPLEXITY_TONE[tone] + " 14%, transparent)",
        }}
      >
        {children}
      </code>
    </span>
  );
}

/* ── Callout, tip / warn / trap ──────────────────────────────── */
const CALLOUT = {
  tip: { color: "var(--color-tip)", label: "TIP", icon: "💡" },
  warn: { color: "var(--color-warn)", label: "WATCH OUT", icon: "⚠️" },
  trap: { color: "var(--color-trap)", label: "GOTCHA", icon: "🪤" },
  note: { color: "var(--color-ink-dim)", label: "NOTE", icon: "›" },
};
export function Callout({ kind = "tip", title, children }) {
  const c = CALLOUT[kind] || CALLOUT.note;
  return (
    <div
      className="rounded-lg p-3.5 my-3 text-sm leading-relaxed"
      style={{
        background: "color-mix(in srgb, " + c.color + " 8%, transparent)",
        borderLeft: `3px solid ${c.color}`,
      }}
    >
      <div
        className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"
        style={{ color: c.color }}
      >
        <span aria-hidden>{c.icon}</span>
        {title || c.label}
      </div>
      <div className="text-ink-dim">{children}</div>
    </div>
  );
}

/* ── Code block, monospace with light Python token coloring ──── */
const PY_KEYWORDS =
  /\b(def|return|if|elif|else|for|while|in|not|and|or|None|True|False|class|self|import|from|as|with|try|except|raise|yield|lambda|is|break|continue|pass|global)\b/g;

function highlightPython(line) {
  // Order matters: comments first, then strings, then keywords/numbers.
  const out = [];
  let rest = line;
  // Comment
  const ci = rest.indexOf("#");
  let comment = null;
  if (ci !== -1) {
    comment = rest.slice(ci);
    rest = rest.slice(0, ci);
  }
  // Split on string literals so we don't highlight inside them
  const parts = rest.split(/(".*?"|'.*?')/g);
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      out.push(
        <span key={"s" + i} style={{ color: "#9ece6a" }}>
          {part}
        </span>
      );
      return;
    }
    // keywords + numbers in the non-string part
    const sub = part.split(PY_KEYWORDS);
    sub.forEach((tok, j) => {
      if (PY_KEYWORDS.test(tok)) {
        PY_KEYWORDS.lastIndex = 0;
        out.push(
          <span key={`k${i}-${j}`} style={{ color: "#bb9af7" }}>
            {tok}
          </span>
        );
      } else {
        const numSplit = tok.split(/(\b\d+\b)/g);
        numSplit.forEach((n, k) =>
          out.push(
            /^\d+$/.test(n) ? (
              <span key={`n${i}-${j}-${k}`} style={{ color: "#ff9e64" }}>
                {n}
              </span>
            ) : (
              <span key={`t${i}-${j}-${k}`}>{n}</span>
            )
          )
        );
      }
    });
  });
  if (comment)
    out.push(
      <span key="c" style={{ color: "#5f6875", fontStyle: "italic" }}>
        {comment}
      </span>
    );
  return out;
}

export function CodeBlock({ code, lang = "python", title }) {
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <div className="rounded-lg overflow-hidden border border-line bg-[#0e1018] my-3">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-line bg-surface-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          {title || lang}
        </span>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f87171]/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80]/60" />
        </div>
      </div>
      <pre className="overflow-x-auto p-3.5 text-[13px] leading-[1.65] font-mono text-ink">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="table-row">
              <span className="table-cell pr-4 select-none text-right text-ink-faint/50 w-8">
                {i + 1}
              </span>
              <span className="table-cell whitespace-pre">
                {lang === "python" ? highlightPython(line) : line}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

/* ── Control button used by interactive visualizers ───────────── */
export function Btn({ children, onClick, disabled, tone, variant = "solid" }) {
  const accent = tone || "var(--color-ink)";
  const base =
    "font-mono text-xs font-semibold px-3 py-1.5 rounded-md transition-all disabled:opacity-35 disabled:cursor-not-allowed select-none";
  if (variant === "ghost") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cx(base, "border border-line-strong text-ink-dim hover:text-ink hover:border-line-strong")}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(base, "text-bg hover:brightness-110 active:brightness-95")}
      style={{ background: accent }}
    >
      {children}
    </button>
  );
}
