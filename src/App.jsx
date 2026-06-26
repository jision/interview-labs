import React from "react";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import DsaLab from "./tools/DsaLab.jsx";
import InterviewBench from "./tools/InterviewBench.jsx";
import Identifier from "./tools/Identifier.jsx";
import StaffBench from "./tools/StaffBench.jsx";
import AiLab from "./tools/AiLab.jsx";
import ModelBench from "./tools/ModelBench.jsx";
import Selector from "./tools/Selector.jsx";
import ArchitectBench from "./tools/ArchitectBench.jsx";
import Foundations from "./tools/Foundations.jsx";

export const TOOLS = [
  {
    path: "dsa-lab",
    track: "dsa",
    name: "DSA · LAB",
    tag: "Structures · the WHAT",
    desc: "Animated data structures with Python internals, see how a list grows, a hash collides, a tree balances.",
    accent: "#38e0d6",
    status: "ready",
    Comp: DsaLab,
  },
  {
    path: "interview-bench",
    track: "dsa",
    name: "Interview Bench",
    tag: "Patterns · the HOW",
    desc: "The ~10 interview patterns, reusable templates, and a dynamic-programming atlas.",
    accent: "#e8553b",
    status: "ready",
    Comp: InterviewBench,
  },
  {
    path: "identifier",
    track: "dsa",
    name: "The Identifier",
    tag: "Recognition · WHICH & WHEN",
    desc: "Constraint decoder, pattern sniffer, and the tricks vault, read a problem, name the approach.",
    accent: "#ffcf4a",
    status: "ready",
    Comp: Identifier,
  },
  {
    path: "staff-bench",
    track: "dsa",
    name: "The Staff Bench",
    tag: "Judgment · SHOULD WE",
    desc: "Data-structure design, concurrency, and articulating trade-offs under real constraints.",
    accent: "#d6a94c",
    status: "ready",
    Comp: StaffBench,
  },
  {
    path: "ai-lab",
    track: "ai",
    name: "AI · LAB",
    tag: "Mechanics · the WHAT",
    desc: "Attention, embeddings, sampling, and tokenization, the LLM internals you can watch work.",
    accent: "#7c5cff",
    status: "ready",
    Comp: AiLab,
  },
  {
    path: "model-bench",
    track: "ai",
    name: "Model Bench",
    tag: "Approaches · the HOW",
    desc: "RAG, agents, fine-tuning, evals, and the classic ML families, the recurring solution shapes.",
    accent: "#00b4d8",
    status: "ready",
    Comp: ModelBench,
  },
  {
    path: "selector",
    track: "ai",
    name: "The Selector",
    tag: "Decisions · WHICH & WHEN",
    desc: "Prompt vs RAG vs fine-tune, build vs buy, and a cost/latency/quality budget decoder.",
    accent: "#ffb703",
    status: "ready",
    Comp: Selector,
  },
  {
    path: "architect-bench",
    track: "ai",
    name: "The Architect's Bench",
    tag: "Systems · SHOULD WE",
    desc: "LLM system design, RAG, serving, evaluation, multi-agent, plus cost & capacity estimation.",
    accent: "#fb6f3c",
    status: "ready",
    Comp: ArchitectBench,
  },
  {
    path: "foundations",
    track: "ai",
    name: "Foundations",
    tag: "Fundamentals · the MATH",
    desc: "Probability, linear algebra, information theory, and the classic-ML toolkit the screens still gate on.",
    accent: "#2dd4bf",
    status: "ready",
    Comp: Foundations,
  },
];

const TRACKS = [
  {
    id: "dsa",
    label: "DSA · interview prep",
    blurb:
      "The full DSA interview surface, from the data structures themselves up to the staff-level judgment rounds.",
  },
  {
    id: "ai",
    label: "AI Architect · interview prep",
    blurb:
      "The GenAI/LLM-systems interview, mechanics, solution patterns, the right-tool decisions, and system design.",
  },
];

function ToolCard({ t }) {
  const ready = t.status === "ready";
  return (
    <Link
      to={`/${t.path}`}
      className={
        "block bg-surface border border-line rounded-xl p-6 transition-all " +
        (ready
          ? "hover:-translate-y-1 hover:border-line-strong"
          : "opacity-70 hover:opacity-100")
      }
      style={{ borderTopColor: t.accent, borderTopWidth: 3 }}
    >
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
    </Link>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-bg text-ink font-sans px-6 py-16 md:py-24">
      <div className="max-w-5xl mx-auto">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-faint mb-3">
          Interactive interview prep
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Interview Labs
        </h1>
        <p className="text-lg text-ink-dim max-w-2xl leading-relaxed mb-14">
          Two tracks of interactive tools, classic <span className="text-ink">DSA</span>{" "}
          and <span className="text-ink">AI architecture</span>, each built to{" "}
          <span className="text-ink">grasp the concept</span>, not just memorize it.
        </p>

        {TRACKS.map((track) => {
          const tools = TOOLS.filter((t) => t.track === track.id);
          if (tools.length === 0) return null;
          return (
            <section key={track.id} className="mb-14">
              <div className="flex items-baseline gap-3 mb-1">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink">
                  {track.label}
                </h2>
                <span className="h-px flex-1 bg-line" />
              </div>
              <p className="text-sm text-ink-faint leading-relaxed max-w-2xl mb-5">
                {track.blurb}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {tools.map((t) => (
                  <ToolCard key={t.path} t={t} />
                ))}
              </div>
            </section>
          );
        })}

        <div className="mt-4 text-sm text-ink-faint">
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
