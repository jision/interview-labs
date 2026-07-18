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
import SparkLab from "./tools/SparkLab.jsx";
import CloudStack from "./tools/CloudStack.jsx";
import Lakehouse from "./tools/Lakehouse.jsx";
import DataArchitectBench from "./tools/DataArchitectBench.jsx";
import DataFoundations from "./tools/DataFoundations.jsx";
import SqlGym from "./tools/SqlGym.jsx";
import DesignRoom from "./tools/DesignRoom.jsx";
import BehavioralBench from "./tools/BehavioralBench.jsx";
import Whiteboard from "./tools/Whiteboard.jsx";
import PatternsBench from "./tools/PatternsBench.jsx";
import ApiIntegration from "./tools/ApiIntegration.jsx";
import ArchitectRole from "./tools/ArchitectRole.jsx";
import ArchFundamentals from "./tools/ArchFundamentals.jsx";
import MissionControl from "./tools/MissionControl.jsx";
import GcpDesign from "./tools/GcpDesign.jsx";
import SreCanon from "./tools/SreCanon.jsx";
import GoogleCoding from "./tools/GoogleCoding.jsx";
import Googleyness from "./tools/Googleyness.jsx";
import QuestionBank from "./tools/QuestionBank.jsx";
import MockDrills from "./tools/MockDrills.jsx";

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
  {
    path: "spark-lab",
    track: "data",
    name: "Spark · LAB",
    tag: "Engine internals · the WHAT",
    desc: "Partitions, shuffles, joins, and skew, the Spark execution model you can watch decide a stage's fate.",
    accent: "#ff8a3d",
    status: "ready",
    Comp: SparkLab,
  },
  {
    path: "cloud-stack",
    track: "data",
    name: "Cloud Data Stack",
    tag: "The platform · the HOW",
    desc: "EMR, S3, Parquet, the Glue catalog, and Athena, the AWS data plane that runs and stores it all.",
    accent: "#4d9fff",
    status: "ready",
    Comp: CloudStack,
  },
  {
    path: "lakehouse",
    track: "data",
    name: "Lakehouse & Modeling",
    tag: "The data · SHAPE IT",
    desc: "Iceberg vs Delta, the medallion layers, dimensional modeling, slowly changing dimensions, and streaming.",
    accent: "#2ee6a8",
    status: "ready",
    Comp: Lakehouse,
  },
  {
    path: "data-architect-bench",
    track: "data",
    name: "The Data Architect's Bench",
    tag: "Systems & judgment · SHOULD WE",
    desc: "Design the pipeline, size the cluster, pick batch vs streaming, control cost, and defend the trade-offs.",
    accent: "#f25f9c",
    status: "ready",
    Comp: DataArchitectBench,
  },
  {
    path: "data-foundations",
    track: "data",
    name: "Data Foundations",
    tag: "Fundamentals · the BEDROCK",
    desc: "Advanced SQL, the distributed-systems trade-offs, MapReduce, and how columnar storage actually works.",
    accent: "#b388ff",
    status: "ready",
    Comp: DataFoundations,
  },
  {
    path: "sql-gym",
    track: "data",
    name: "SQL Gym",
    tag: "Practice · the REPS",
    desc: "Twelve worked SQL-screen problems with hints, solutions, and the at-scale follow-up. Say your approach, then reveal.",
    accent: "#f7c948",
    status: "ready",
    Comp: SqlGym,
  },
  {
    path: "design-room",
    track: "data",
    name: "The Design Room",
    tag: "The design round · LIVE",
    desc: "The 45-minute data-system-design round: a repeatable framework, whiteboard choreography, and four cases rehearsed end to end.",
    accent: "#ff6b6b",
    status: "ready",
    Comp: DesignRoom,
  },
  {
    path: "behavioral-bench",
    track: "data",
    name: "Behavioral Bench",
    tag: "The human round · STAR",
    desc: "Bar-raiser mechanics, Leadership Principles mapped to data war stories, and story scaffolds to build yours before interview week.",
    accent: "#d97cf6",
    status: "ready",
    Comp: BehavioralBench,
  },
  {
    path: "whiteboard",
    track: "arch",
    name: "The Whiteboard",
    tag: "The design round · LIVE",
    desc: "Seven classic system designs (URL shortener, feed, chat, ride-share, notifications, payments, rate limiter) run end to end, plus the reusable framework.",
    accent: "#4aa3ff",
    status: "ready",
    Comp: Whiteboard,
  },
  {
    path: "patterns",
    track: "arch",
    name: "Architecture Patterns & Resilience",
    tag: "Styles & resilience · the HOW",
    desc: "Monolith to microservices, hexagonal, CQRS / event sourcing, saga, service mesh, and the resilience patterns that keep a system standing under failure.",
    accent: "#f26d9c",
    status: "ready",
    Comp: PatternsBench,
  },
  {
    path: "api-integration",
    track: "arch",
    name: "API & Integration",
    tag: "Contracts · the INTERFACES",
    desc: "REST vs gRPC vs GraphQL, versioning and backward-compat, idempotency keys, queue-vs-topic, and the outbox pattern for reliable integration.",
    accent: "#8b7cff",
    status: "ready",
    Comp: ApiIntegration,
  },
  {
    path: "architect-role",
    track: "arch",
    name: "Architect's Role & Decisions",
    tag: "Decisions & leadership · SHOULD WE",
    desc: "Quality attributes, SLOs, domain-driven design, cloud / Well-Architected, migration, ADRs, and architect-leadership STAR.",
    accent: "#2fbf8f",
    status: "ready",
    Comp: ArchitectRole,
  },
  {
    path: "arch-fundamentals",
    track: "arch",
    name: "Architecture Fundamentals",
    tag: "Building blocks · the BEDROCK",
    desc: "Load balancing, caching, sharding, replication, indexing, queues, and consistency, the pieces every design is assembled from.",
    accent: "#c9a23f",
    status: "ready",
    Comp: ArchFundamentals,
  },
  {
    path: "mission-control",
    track: "google",
    name: "Mission Control",
    tag: "The loop & 21-day plan · ORIENT",
    desc: "How the L6 loop actually works, the four attributes read across rounds, the hiring-committee packet, and the corrected 21-day operating plan with a progress tracker and mock scorecard.",
    accent: "#4285F4",
    status: "ready",
    Comp: MissionControl,
  },
  {
    path: "gcp-design",
    track: "google",
    name: "GCP System Design",
    tag: "The design rounds · DESIGN IT",
    desc: "The Google design framework plus ten worked one-page sheets on the real systems an L6 infra round expects you to name and reason about: Monarch, Doorman, Borg, Chubby, Colossus, Dataflow, and Spanner.",
    accent: "#EA4335",
    status: "ready",
    Comp: GcpDesign,
  },
  {
    path: "sre-canon",
    track: "google",
    name: "The SRE Canon",
    tag: "Reliability · THE GOOGLE EDGE",
    desc: "The handful of Google SRE ideas that separate a Staff answer from a senior one: error budgets, overload and load-shedding, cascading failures and retry amplification, consensus, and data integrity.",
    accent: "#F9AB00",
    status: "ready",
    Comp: SreCanon,
  },
  {
    path: "google-coding",
    track: "google",
    name: "Coding for Google",
    tag: "The coding bar · THE REPS",
    desc: "How Google scores coding, a reuse map into the DSA drills you already have, and the seven patterns worth adding: union-find, LCA, tree serialization, topological sort and Dijkstra, binary search on the answer, prefix and difference arrays, and data-structure design.",
    accent: "#34A853",
    status: "ready",
    Comp: GoogleCoding,
  },
  {
    path: "googleyness",
    track: "google",
    name: "Googleyness & Deep Dives",
    tag: "The human rounds · WHO YOU ARE",
    desc: "The project deep-dive and the combined Googleyness and Leadership round at Staff scope, with a story matrix and the I-vs-we discipline that keeps you from getting downleveled.",
    accent: "#A142F4",
    status: "ready",
    Comp: Googleyness,
  },
  {
    path: "question-bank",
    track: "google",
    name: "The Question Bank",
    tag: "Real questions · DRILL IT",
    desc: "Sixty-nine reported coding questions with worked solution ideas and complexity, twenty system-design prompts, thirty-one behavioral questions, and flashcard decks to drill them all to reflex.",
    accent: "#12B5CB",
    status: "ready",
    Comp: QuestionBank,
  },
  {
    path: "mock-drills",
    track: "google",
    name: "Mock Drills",
    tag: "Simulate it · UNDER THE CLOCK",
    desc: "Run the loop on yourself: timed coding, design, and behavioral mocks with a phase timer, scoring rubrics, and ready-to-run prompt banks.",
    accent: "#E37400",
    status: "ready",
    Comp: MockDrills,
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
  {
    id: "data",
    label: "Data Architect · interview prep",
    blurb:
      "The AWS data-platform interview end to end: Spark internals, the EMR and S3 stack, the lakehouse and modeling, the judgment calls, plus live SQL and modeling drills, the 45-minute design round, and behavioral prep.",
  },
  {
    id: "arch",
    label: "Software / Solutions Architect · interview prep",
    blurb:
      "The general architecture interview: the system-design round on classic products, the styles-and-resilience patterns, API and integration contracts, the role-level decisions and leadership, and the building blocks underneath.",
  },
  {
    id: "google",
    label: "Google Cloud Staff (L6) · interview prep",
    blurb:
      "The Staff Software Engineer, Google Cloud loop: how Google scores a coding round, a reuse map onto the DSA drills you already have, and the handful of patterns a Google interview leans on that a generic list under-teaches.",
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
          Five tracks of interactive tools, classic <span className="text-ink">DSA</span>,{" "}
          <span className="text-ink">AI architecture</span>,{" "}
          <span className="text-ink">data engineering</span>,{" "}
          <span className="text-ink">software architecture</span>, and a{" "}
          <span className="text-ink">Google Cloud Staff (L6)</span> loop, each built to{" "}
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
