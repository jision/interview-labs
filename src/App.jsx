import React from "react";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import DsaLab from "./tools/DsaLab.jsx";
import InterviewBench from "./tools/InterviewBench.jsx";
import Identifier from "./tools/Identifier.jsx";
import StaffBench from "./tools/StaffBench.jsx";

export const TOOLS = [
  {
    path: "dsa-lab",
    name: "DSA · LAB",
    tag: "Structures · the WHAT",
    desc: "Animated data structures with Python internals — see how a list grows, a hash collides, a tree balances.",
    accent: "#38e0d6",
    status: "ready",
    Comp: DsaLab,
  },
  {
    path: "interview-bench",
    name: "Interview Bench",
    tag: "Patterns · the HOW",
    desc: "The ~10 interview patterns, reusable templates, and a dynamic-programming atlas.",
    accent: "#e8553b",
    status: "ready",
    Comp: InterviewBench,
  },
  {
    path: "identifier",
    name: "The Identifier",
    tag: "Recognition · WHICH & WHEN",
    desc: "Constraint decoder, pattern sniffer, and the tricks vault — read a problem, name the approach.",
    accent: "#ffcf4a",
    status: "ready",
    Comp: Identifier,
  },
  {
    path: "staff-bench",
    name: "The Staff Bench",
    tag: "Judgment · SHOULD WE",
    desc: "Data-structure design, concurrency, and articulating trade-offs under real constraints.",
    accent: "#d6a94c",
    status: "ready",
    Comp: StaffBench,
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-bg text-ink font-sans px-6 py-16 md:py-24">
      <div className="max-w-5xl mx-auto">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-faint mb-3">
          Interactive DSA · interview prep
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Interview Labs
        </h1>
        <p className="text-lg text-ink-dim max-w-2xl leading-relaxed mb-12">
          Four interactive tools covering the full interview surface — from the data
          structures themselves up to the staff-level judgment rounds. Built to{" "}
          <span className="text-ink">grasp the concept</span>, not just memorize it.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => {
            const ready = t.status === "ready";
            const inner = (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="font-mono text-[11px] uppercase tracking-wider"
                    style={{ color: t.accent }}
                  >
                    {t.tag}
                  </div>
                  {!ready && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint border border-line-strong rounded-full px-2 py-0.5">
                      soon
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-ink mb-2">{t.name}</div>
                <div className="text-sm text-ink-dim leading-relaxed">{t.desc}</div>
                {ready && (
                  <div
                    className="mt-4 font-mono text-xs font-semibold"
                    style={{ color: t.accent }}
                  >
                    open lab →
                  </div>
                )}
              </>
            );
            const cardClass =
              "block bg-surface border border-line rounded-xl p-6 transition-all";
            const style = { borderTopColor: t.accent, borderTopWidth: 3 };
            return ready ? (
              <Link
                key={t.path}
                to={`/${t.path}`}
                className={cardClass + " hover:-translate-y-1 hover:border-line-strong"}
                style={style}
              >
                {inner}
              </Link>
            ) : (
              <Link
                key={t.path}
                to={`/${t.path}`}
                className={cardClass + " opacity-70 hover:opacity-100"}
                style={style}
              >
                {inner}
              </Link>
            );
          })}
        </div>

        <div className="mt-14 text-sm text-ink-faint">
          Built with React + Vite + Tailwind · keyboard-friendly · works offline once loaded.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        {TOOLS.map((t) => {
          const Comp = t.Comp;
          return <Route key={t.path} path={`/${t.path}`} element={<Comp />} />;
        })}
        <Route path="*" element={<Landing />} />
      </Routes>
    </HashRouter>
  );
}
