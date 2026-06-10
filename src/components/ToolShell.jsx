import React from "react";
import { Link } from "react-router-dom";
import { cx } from "./ui.jsx";

/* Fixed "back to hub" pill, present on every tool route. */
export function BackLink() {
  return (
    <Link
      to="/"
      className="fixed top-3.5 right-4 z-50 font-mono text-xs font-semibold text-ink
                 bg-surface/85 backdrop-blur border border-line-strong rounded-md
                 px-3 py-2 hover:border-line-strong hover:bg-surface-2 transition-colors"
    >
      ← all tools
    </Link>
  );
}

/*
 * ToolShell — the standard tool layout.
 *  - sticky header with eyebrow / title / subtitle
 *  - left topic sidebar (becomes a horizontal scroller on small screens)
 *  - scrollable main content
 *
 * topics: [{ id, label, group?, icon? }]
 */
export function ToolShell({
  accent,
  eyebrow,
  title,
  subtitle,
  topics,
  activeId,
  onSelect,
  children,
}) {
  // group topics for the sidebar
  const groups = [];
  topics.forEach((t) => {
    const g = t.group || "";
    let bucket = groups.find((x) => x.name === g);
    if (!bucket) {
      bucket = { name: g, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(t);
  });

  return (
    <div className="min-h-screen bg-bg text-ink">
      <BackLink />

      {/* Header */}
      <header
        className="border-b border-line px-6 md:px-10 pt-12 pb-6"
        style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 10%, transparent), transparent)` }}
      >
        <div className="max-w-6xl mx-auto">
          <div
            className="font-mono text-[11px] uppercase tracking-[0.2em] mb-2"
            style={{ color: accent }}
          >
            {eyebrow}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-ink-dim max-w-2xl leading-relaxed">{subtitle}</p>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 md:px-10 py-6 md:flex md:gap-8 md:items-start">
        {/* Sidebar / topic switcher */}
        <nav
          className="md:w-56 md:flex-none md:sticky md:top-4 mb-4 md:mb-0
                     flex md:block gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0"
        >
          {groups.map((g) => (
            <div key={g.name} className="md:mb-5 flex md:block gap-2">
              {g.name && (
                <div className="hidden md:block font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2 px-2">
                  {g.name}
                </div>
              )}
              {g.items.map((t) => {
                const active = t.id === activeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className={cx(
                      "whitespace-nowrap md:w-full text-left font-medium text-sm rounded-lg px-3 py-2 mb-0 md:mb-0.5 transition-colors border md:border-0",
                      active
                        ? "text-ink bg-surface-2 border-line-strong"
                        : "text-ink-dim border-line hover:text-ink hover:bg-surface"
                    )}
                    style={active ? { boxShadow: `inset 3px 0 0 ${accent}` } : undefined}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
