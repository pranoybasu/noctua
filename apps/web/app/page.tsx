import Link from "next/link";
import {
  GitPullRequest,
  Shield,
  Fingerprint,
  Users,
  Zap,
  BarChart3,
} from "lucide-react";

const FEATURES = [
  {
    icon: GitPullRequest,
    title: "Review Persona Engine",
    desc: "Each repo picks a review personality — strict, mentor, fast, or balanced. The AI prompt and scoring math change completely per persona.",
  },
  {
    icon: Fingerprint,
    title: "Code DNA Fingerprinting",
    desc: "Builds a per-author coding profile across every PR — line length, comment ratio, nesting depth, type hints, naming consistency.",
  },
  {
    icon: Shield,
    title: "Pre-flight Check",
    desc: "A GitHub Action calls /preflight before a PR is opened. Blocks pushes with critical security issues at commit time.",
  },
  {
    icon: BarChart3,
    title: "Diff Timeline Heatmap",
    desc: "A proportional visual strip showing where changes cluster — green for safe, amber for complex, red for flagged.",
  },
  {
    icon: Users,
    title: "Team Clarity Leaderboard",
    desc: "Ranks contributors by quality score, security catch rate, and Code DNA consistency with personal radar charts.",
  },
  {
    icon: Zap,
    title: "Live Dashboard",
    desc: "PR cards flip from analyzing to done in real-time via Supabase Realtime — no polling, no refresh.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-noctua-purple flex items-center justify-center text-sm">
              🦉
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Noctua
            </span>
          </div>
          <Link
            href="/login"
            className="text-xs px-4 py-2 rounded-md bg-noctua-purple text-white hover:bg-noctua-purple/90 transition-colors"
          >
            Sign in with GitHub
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border mb-6 text-muted-foreground">
          100% free to deploy
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          AI-powered PR intelligence
          <br />
          <span className="text-noctua-purple">
            that watches while you sleep
          </span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Every pull request automatically summarized, security-scanned, Code
          DNA fingerprinted, and reviewed in the personality of your choice —
          all before a human opens the diff.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-md bg-noctua-purple text-white hover:bg-noctua-purple/90 transition-colors text-sm font-medium"
          >
            Get Started — Free
          </Link>
          <a
            href="https://github.com/pranoybasu/noctua"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
          >
            View Source
          </a>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-xl font-semibold text-center mb-8">
          What makes Noctua original
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border bg-card p-5 space-y-2"
            >
              <f.icon className="w-5 h-5 text-noctua-purple" />
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-xl font-semibold text-center mb-8">
            Tech Stack — $0/month
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              ["Next.js 14", "Frontend + API"],
              ["Python FastAPI", "AI Engine"],
              ["Supabase", "Database + Realtime"],
              ["Groq LLaMA-3", "AI Inference"],
              ["Tailwind CSS", "UI Components"],
              ["Recharts", "Charts + Radar"],
              ["Upstash Redis", "Job Queue"],
              ["Vercel + Render", "Deploy (free)"],
            ].map(([name, desc]) => (
              <div key={name} className="rounded-lg border bg-card p-3">
                <p className="text-xs font-medium">{name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Built by{" "}
        <a
          href="https://pranoys-portfolio.vercel.app"
          className="underline hover:text-foreground"
        >
          Pranoy Basu
        </a>
        . MIT License.
      </footer>
    </div>
  );
}
