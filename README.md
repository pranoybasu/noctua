# 🦉 Noctua — AI-Powered PR Intelligence Platform

> *Noctua watches your codebase while you sleep.*

Noctua is a GitHub-native pull request intelligence platform built with **Next.js + Node.js** on the frontend and a **Python FastAPI** AI engine on the backend. Every PR is automatically analyzed — summarized, security-scanned, Code DNA fingerprinted, and reviewed in the personality of your choice — all before a human opens the diff.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of Contents

- [What makes Noctua original](#what-makes-noctua-original)
- [System architecture](#system-architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [Review Persona guide](#review-persona-guide)
- [GitHub Pre-flight Action](#github-pre-flight-action)
- [Deploying to Vercel (free)](#deploying-to-vercel-free)
- [API reference](#api-reference)
- [Contributing](#contributing)

---

## What makes Noctua original

| Feature | What it does |
|---|---|
| **Review Persona engine** | Each repo picks a review personality: `strict`, `mentor`, `fast`, or `balanced`. The LLM system prompt AND quality score weighting change completely per persona. Not just tone — the actual scoring math changes. |
| **Code DNA fingerprinting** | Builds a per-author coding profile across every PR — avg nesting depth, comment ratio, type hint usage, naming consistency. Powers the Team Clarity Leaderboard radar charts. |
| **Pre-flight check** | A GitHub Action that calls `/preflight` *before* a PR is opened. Blocks pushes with critical security issues at commit time — not after review starts. |
| **Diff Timeline heatmap** | A proportional visual strip on each PR showing where changes cluster — green for safe additions, amber for complex zones, red for flagged lines. Scannable at a glance. |
| **Team Clarity Leaderboard** | Ranks every contributor by avg quality score, security catch rate, and Code DNA consistency. Each author gets a personal Recharts radar chart. |
| **Supabase Realtime feed** | The dashboard PR cards flip from `analyzing` to `done` live — no polling, no refresh. Python writes to Supabase, Supabase pushes to the browser. |

---

## System architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL ACTORS                          │
│  GitHub.com (webhooks)    Groq API (LLaMA-3)   Dev browser      │
└────────┬──────────────────────┬────────────────────┬────────────┘
         │ PR event             │ AI inference        │ HTTPS
         ▼                      │                     ▼
┌────────────────────────────────────────────────────────────────┐
│               NODE.JS / NEXT.JS LAYER  (Vercel)                │
│                                                                  │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │  Next.js UI  │  │ Webhook receiver │  │    NextAuth       │  │
│  │  App Router  │  │ HMAC-verified   │  │  GitHub OAuth     │  │
│  └──────────────┘  └────────┬────────┘  └───────────────────┘  │
│                              │ lpush                             │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │              Upstash Redis — job queue                   │   │
│  └──────────────────────────┬────────────────────────────── ┘   │
└─────────────────────────────┼──────────────────────────────────┘
                              │ brpop (pull)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              PYTHON FASTAPI ENGINE  (Vercel serverless)         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  /analyze    │  │  /preflight  │  │      /health         │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘  │
│         │                                                        │
│  ┌──────▼───────────────────────────────────────────────────┐   │
│  │  async pipeline (asyncio.gather — all run in parallel)   │   │
│  │                                                           │   │
│  │  ┌────────────────┐  ┌───────────────┐  ┌─────────────┐ │   │
│  │  │  AI Persona    │  │  AST Scanner  │  │  Code DNA   │ │   │
│  │  │  Groq LLaMA-3  │  │  security     │  │  fingerprint│ │   │
│  │  └────────┬───────┘  └───────┬───────┘  └──────┬──────┘ │   │
│  └───────────┼──────────────────┼─────────────────┼─────────┘   │
└──────────────┼──────────────────┼─────────────────┼─────────────┘
               │ write results    │                  │
               ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA & SERVICES (all free tiers)             │
│                                                                  │
│  Supabase Postgres   Supabase Realtime   Upstash Redis  Resend  │
│  (users, repos,      (live dashboard     (job queue)   (alerts) │
│   PRs, team_stats)    PR status push)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Data flow — what happens when a PR is opened

```
1.  Developer opens a PR on GitHub
2.  GitHub fires a pull_request webhook → POST /api/webhook/github
3.  Node.js verifies HMAC signature (sha256)
4.  Node.js pushes a job object into Upstash Redis queue (lpush)
5.  Python FastAPI worker pulls the job (brpop) 
6.  Python fetches the raw diff via GitHub API
7.  Python runs asyncio.gather():
      a. AI Persona service  → Groq LLaMA-3 → summary + score + suggestions
      b. AST Scanner         → scan added lines for secrets, SQLi, eval()
      c. Code DNA service    → build author fingerprint from diff
8.  Python writes all results to Supabase pull_requests row
9.  Python calls upsert_team_stats() stored procedure
10. Python posts a formatted review comment on the GitHub PR
11. Supabase Realtime fires a postgres_changes event
12. Next.js dashboard receives the event → PR card updates live (no refresh)
```

---

## Tech stack

| Layer | Technology | Free tier |
|---|---|---|
| Frontend | Next.js 14 (App Router + TypeScript) | Vercel hobby |
| Styling | Tailwind CSS + shadcn/ui | Open source |
| Charts | Recharts | Open source |
| Animation | Framer Motion | Open source |
| Tables | TanStack Table v8 | Open source |
| Auth | NextAuth v5 + GitHub OAuth | Free |
| Database | Supabase (Postgres) | 500MB free |
| Realtime | Supabase Realtime | Included in free |
| AI inference | Groq API (LLaMA-3 70B 8192) | 30 req/min free |
| Job queue | Upstash Redis | 10K cmd/day free |
| Email alerts | Resend | 3K emails/month free |
| Backend | Python 3.11 + FastAPI + Uvicorn | — |
| Deploy | Vercel (Next.js + Python serverless) | Hobby free |

**Total monthly cost: $0.00**

---

## Project structure

```
noctua/
├── apps/
│   ├── web/                               # Next.js 14 (Node.js)
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx             # Auth guard
│   │   │   │   ├── page.tsx               # Dashboard home — stat cards
│   │   │   │   ├── prs/
│   │   │   │   │   ├── page.tsx           # PR feed — TanStack Table
│   │   │   │   │   └── [id]/page.tsx      # PR detail — score + DNA + heatmap
│   │   │   │   ├── team/
│   │   │   │   │   └── page.tsx           # Team Clarity Leaderboard
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx           # Quality score trend (Recharts)
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx           # Persona selector per repo
│   │   │   ├── api/
│   │   │   │   ├── auth/
│   │   │   │   │   └── [...nextauth]/route.ts
│   │   │   │   ├── webhook/
│   │   │   │   │   └── github/route.ts    # HMAC-verified webhook receiver
│   │   │   │   └── repos/
│   │   │   │       ├── connect/route.ts   # Install webhook on repo
│   │   │   │       └── disconnect/route.ts
│   │   │   └── page.tsx                   # Landing page
│   │   ├── components/
│   │   │   ├── pr-card.tsx                # Animated PR row card
│   │   │   ├── score-gauge.tsx            # Radial score gauge
│   │   │   ├── diff-timeline.tsx          # Heatmap strip
│   │   │   ├── code-dna-radar.tsx         # Author radar chart
│   │   │   └── team-leaderboard.tsx       # Leaderboard table
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   └── github.ts                  # Octokit helpers
│   │   └── package.json
│   │
│   └── engine/                            # Python 3.11 FastAPI
│       ├── main.py                        # FastAPI app factory
│       ├── routers/
│       │   ├── analyze.py                 # POST /analyze
│       │   ├── preflight.py               # POST /preflight
│       │   └── health.py                  # GET /health
│       ├── services/
│       │   ├── pipeline.py                # Async orchestrator
│       │   ├── ai.py                      # Groq + persona prompts
│       │   ├── scanner.py                 # AST security scanner
│       │   ├── dna.py                     # Code DNA fingerprinting
│       │   └── diff.py                    # Diff fetcher + parser
│       ├── api/
│       │   └── index.py                   # Vercel entry point (Mangum)
│       ├── requirements.txt
│       └── runtime.txt                    # python-3.11
│
├── packages/
│   └── types/
│       └── index.ts                       # Shared TS types (PRPayload etc.)
│
├── .env.local
├── vercel.json
└── README.md
```

---

## Local setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- A GitHub account (for GitHub App registration)

### 1. Clone and install

```bash
git clone https://github.com/pranoybasu/noctua
cd noctua

# Install Next.js dependencies
cd apps/web && npm install && cd ../..

# Set up Python virtual environment
cd apps/engine
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

### 2. Register free services (allow ~30 minutes)

**GitHub App** (for OAuth + webhooks)
1. Go to github.com/settings/apps → New GitHub App
2. Set Homepage URL: `http://localhost:3000`
3. Set Webhook URL: paste your smee.io channel URL (created in step 5)
4. Permissions: Pull requests (read & write), Repository contents (read)
5. Subscribe to events: Pull request
6. Generate a private key → download the `.pem` file
7. Copy: App ID, Client ID, Client Secret, Webhook Secret

**Supabase**
1. supabase.com → New project
2. Copy: Project URL, anon key, service_role key
3. SQL Editor → paste the full contents of `schema.sql` → Run

**Groq**
1. console.groq.com → Create API key (free, no credit card)

**Upstash Redis**
1. upstash.com → Create database → REST API tab
2. Copy: REST URL + REST Token

**Resend**
1. resend.com → Create API key (free, 3K emails/month)

### 3. Set environment variables

Create `apps/web/.env.local`:

```env
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

UPSTASH_REDIS_URL=https://your-db.upstash.io
UPSTASH_TOKEN=your_upstash_token

ENGINE_URL=http://localhost:8000
```

Create `apps/engine/.env`:

```env
GROQ_API_KEY=gsk_your_groq_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_your_resend_key
```

### 4. Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### 5. Set up webhook tunnel for local dev

GitHub cannot reach `localhost`. Use smee.io as a free proxy:

```bash
# In a new terminal
npx smee -u https://smee.io/YOUR_UNIQUE_CHANNEL \
  --path /api/webhook/github \
  --port 3000
```

Go to smee.io → click "Start a new channel" → copy the URL → paste it as
the Webhook URL in your GitHub App settings.

### 6. Start all three servers

```bash
# Terminal 1 — Next.js
cd apps/web && npm run dev

# Terminal 2 — Python FastAPI
cd apps/engine
source .venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 3 — Webhook tunnel
npx smee -u https://smee.io/YOUR_CHANNEL --path /api/webhook/github --port 3000
```

Open http://localhost:3000 → sign in with GitHub → connect a repo → open a PR.

---

## Environment variables

### apps/web/.env.local — full reference

| Variable | Where to get it | Required |
|---|---|---|
| `GITHUB_APP_ID` | GitHub App settings page | Yes |
| `GITHUB_PRIVATE_KEY` | Downloaded `.pem` file (keep newlines as `\n`) | Yes |
| `GITHUB_CLIENT_ID` | GitHub App → OAuth credentials | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub App → OAuth credentials | Yes |
| `GITHUB_WEBHOOK_SECRET` | You set this when creating the GitHub App | Yes |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Yes |
| `NEXTAUTH_URL` | `http://localhost:3000` in dev, production URL in prod | Yes |
| `SUPABASE_URL` | Supabase dashboard → Settings → API | Yes |
| `SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API | Yes |
| `UPSTASH_REDIS_URL` | Upstash console → REST API tab | Yes |
| `UPSTASH_TOKEN` | Upstash console → REST API tab | Yes |
| `ENGINE_URL` | `http://localhost:8000` in dev, Vercel URL in prod | Yes |

### apps/engine/.env — full reference

| Variable | Where to get it | Required |
|---|---|---|
| `GROQ_API_KEY` | console.groq.com | Yes |
| `SUPABASE_URL` | Supabase dashboard → Settings → API | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API | Yes |
| `RESEND_API_KEY` | resend.com → API Keys | Optional (disables email alerts) |

---

## Database schema

See `schema.sql` for the full Supabase SQL migrations including:
- All 5 tables with correct foreign keys and indexes
- Row-Level Security policies (users only see their own data)
- Supabase Realtime enabled on `pull_requests` and `analysis_jobs`
- `upsert_team_stats()` stored procedure for atomic leaderboard updates

Run the entire file in Supabase → SQL Editor → New Query → Run.

---

## Review Persona guide

The Persona engine is what makes Noctua feel alive instead of robotic. The AI system prompt, score weighting multiplier, and GitHub comment emoji all change per persona.

| Persona | Tone | Score weight | Best for | Comment emoji |
|---|---|---|---|---|
| `strict` | Direct. Calls out everything. No encouragement. | ×0.6 (harder scorer) | Senior teams, production repos | 🔍 |
| `mentor` | Warm, explanatory, teaches the *why*. Ends with a genuine compliment. | ×1.1 (gentler scorer) | Onboarding juniors, open source | 🎓 |
| `fast` | Blocks only critical issues. Skips style nits. Max 5 bullet points. | ×0.9 | Fast startups, hotfix PRs | ⚡ |
| `balanced` | Thorough but pragmatic. Default if unset. | ×1.0 | Most teams | 🦉 |

Change a repo's persona at `/dashboard/settings` — effective immediately on the next PR.

---

## GitHub Pre-flight Action

Add this to any repo connected to Noctua to block critical security issues *before* a PR is even opened:

```yaml
# .github/workflows/noctua-preflight.yml
name: Noctua Pre-flight

on: [push]

jobs:
  preflight:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Extract diff
        run: git diff HEAD~1 --unified=0 > /tmp/diff.patch

      - name: Run Noctua pre-flight check
        run: |
          DIFF_B64=$(base64 -w 0 /tmp/diff.patch)
          RESULT=$(curl -sf -X POST \
            https://your-noctua.vercel.app/engine/preflight \
            -H "Content-Type: application/json" \
            -d "{\"diff_b64\": \"$DIFF_B64\", \"author\": \"$GITHUB_ACTOR\"}")
          
          echo "--- Noctua Pre-flight Result ---"
          echo $RESULT | python3 -m json.tool
          
          # Fail the action if pre-flight did not pass
          echo $RESULT | python3 -c \
            "import sys,json; d=json.load(sys.stdin); \
             sys.exit(0 if d['passed'] else 1)"
```

When a critical issue (hardcoded secret, SQL injection, `eval()` call) is detected, the action fails with a human-readable message and the push is blocked. Fix it, push again, Noctua clears it.

---

## Deploying to Vercel (free)

### vercel.json (place in repo root)

```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "functions": {
    "apps/engine/api/index.py": {
      "runtime": "vercel-python@3.0.7",
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/engine/:path*",
      "destination": "/apps/engine/api/index.py/:path*"
    }
  ]
}
```

### apps/engine/api/index.py (Vercel Python entry)

```python
from mangum import Mangum
from main import app

handler = Mangum(app, lifespan="off")
```

### Deployment checklist

- [ ] Push repo to GitHub
- [ ] Go to vercel.com → New Project → import your repo
- [ ] Vercel auto-detects Next.js — set root directory to `/` (not `/apps/web`)
- [ ] Add **all** environment variables from both `.env` files in Vercel → Settings → Environment Variables
- [ ] Set `NEXTAUTH_URL` to your Vercel production domain (e.g. `https://noctua.vercel.app`)
- [ ] Set `ENGINE_URL` to `https://noctua.vercel.app/engine`
- [ ] Update your GitHub App's Webhook URL to `https://noctua.vercel.app/api/webhook/github`
- [ ] Deploy → open a real PR on a connected repo → watch Noctua comment within ~10 seconds
- [ ] Verify dashboard PR card updates live (no refresh)

---

## API reference

### Python Engine endpoints

#### `POST /analyze`
Called internally by the Node.js webhook receiver via the Redis job queue.

```json
{
  "pr_number": 42,
  "repo": "pranoy-basu/noctua-demo",
  "diff_url": "https://github.com/.../pull/42.diff",
  "title": "feat: add Code DNA fingerprinting",
  "author": "pranoy-basu",
  "token": "ghs_installation_token",
  "persona": "strict"
}
```

Response:
```json
{
  "status": "ok",
  "quality_score": 84,
  "security_issues": [],
  "preflight_passed": true,
  "duration_ms": 3241
}
```

#### `POST /preflight`
Called by the GitHub Action on every push.

```json
{
  "diff_b64": "base64_encoded_unified_diff",
  "author": "pranoy-basu"
}
```

Response:
```json
{
  "passed": false,
  "critical_count": 1,
  "message": "Blocked: 1 critical issue found",
  "issues": [
    {
      "severity": "critical",
      "rule": "hardcoded-secret",
      "line": 47,
      "snippet": "api_key = \"sk-prod-abc123...\""
    }
  ]
}
```

#### `GET /health`
Returns `{ "status": "ok", "version": "1.0.0" }`. Used by Vercel health checks.

---

## Contributing

This is a portfolio solo project — but issues and PRs are welcome.

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feat/your-feature`
5. Open a PR — Noctua will review it automatically

---

## License

MIT — built by [Pranoy Basu](https://pranoys-portfolio.vercel.app). If Noctua catches a bug before your team lead does, consider starring the repo.
