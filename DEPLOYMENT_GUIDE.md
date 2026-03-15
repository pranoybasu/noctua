# Noctua Deployment Guide

A step-by-step guide for deploying Noctua from scratch. Total cost: **$0/month**.

---

## Prerequisites

- A GitHub account
- Node.js 20+ installed locally
- Python 3.11+ installed locally
- A terminal (PowerShell, bash, or zsh)

---

## Step 1: Register Free Services (~30 minutes)

You need accounts on five services. All have free tiers, no credit card required.

### 1.1 GitHub OAuth App

1. Go to **github.com/settings/developers** → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - Application name: `Noctua`
   - Homepage URL: `http://localhost:3000` (update after deploy)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Click **Register application**
4. Copy the **Client ID**
5. Click **Generate a new client secret** → copy the **Client Secret**
6. Under **Webhook**, set a **Webhook secret** (any random string, 20+ chars) → save it

### 1.2 Supabase

1. Go to **supabase.com** → sign in → **New Project**
2. Pick a name (e.g., `noctua`) and set a database password
3. Wait for the project to be provisioned (~2 minutes)
4. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon public** key
   - **service_role secret** key
5. Go to **SQL Editor** → **New Query**
6. Paste the entire contents of `schema.sql` from the Noctua repo
7. Click **Run** — all tables, views, RLS policies, and the stored procedure are created

### 1.3 Groq

1. Go to **console.groq.com** → sign in
2. Go to **API Keys** → **Create API Key**
3. Copy the key (starts with `gsk_`)

### 1.4 Upstash Redis

1. Go to **upstash.com** → sign in → **Create Database**
2. Pick a region close to you
3. Go to the **REST API** tab and copy:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

### 1.5 Resend (optional — for email alerts)

1. Go to **resend.com** → sign in → **API Keys** → **Create API Key**
2. Copy the key (starts with `re_`)
3. Skip this if you don't need email alerts

---

## Step 2: Local Development Setup

### 2.1 Clone the repo

```bash
git clone https://github.com/pranoybasu/noctua.git
cd noctua
```

### 2.2 Install Next.js dependencies

```bash
cd apps/web
npm install
cd ../..
```

### 2.3 Set up Python virtual environment

```bash
cd apps/engine
python -m venv .venv

# Activate:
# macOS/Linux:  source .venv/bin/activate
# Windows:      .venv\Scripts\activate

pip install -r requirements.txt
cd ../..
```

### 2.4 Create environment files

Copy the example files and fill in your values:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/engine/.env.example apps/engine/.env
```

Fill in **apps/web/.env.local**:

```env
GITHUB_CLIENT_ID=<from step 1.1>
GITHUB_CLIENT_SECRET=<from step 1.1>
GITHUB_WEBHOOK_SECRET=<from step 1.1>
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
SUPABASE_URL=<from step 1.2>
SUPABASE_ANON_KEY=<from step 1.2>
SUPABASE_SERVICE_ROLE_KEY=<from step 1.2>
UPSTASH_REDIS_REST_URL=<from step 1.4>
UPSTASH_REDIS_REST_TOKEN=<from step 1.4>
ENGINE_URL=http://localhost:8000
```

Fill in **apps/engine/.env**:

```env
GROQ_API_KEY=<from step 1.3>
SUPABASE_URL=<from step 1.2>
SUPABASE_SERVICE_ROLE_KEY=<from step 1.2>
RESEND_API_KEY=<from step 1.5, or leave empty>
UPSTASH_REDIS_REST_URL=<from step 1.4>
UPSTASH_REDIS_REST_TOKEN=<from step 1.4>
ALLOWED_ORIGINS=http://localhost:3000
```

### 2.5 Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Paste the output into `NEXTAUTH_SECRET` in `.env.local`.

### 2.6 Start all servers

Open three terminal tabs:

**Terminal 1 — Next.js:**
```bash
cd apps/web
npm run dev
```

**Terminal 2 — Python engine:**
```bash
cd apps/engine
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
uvicorn main:app --reload --port 8000
```

**Terminal 3 — Webhook tunnel (for local dev only):**
```bash
npx smee -u https://smee.io/<YOUR_CHANNEL> --path /api/webhook/github --port 3000
```

Go to **smee.io** → click **Start a new channel** → copy the URL.
Update your GitHub OAuth App webhook URL to this smee URL.

### 2.7 Test locally

1. Open **http://localhost:3000**
2. Sign in with GitHub
3. Go to Settings → connect a test repo
4. Open a PR on that repo
5. Watch the dashboard update

---

## Step 3: Deploy Python Engine to Render

### 3.1 Push to GitHub

Make sure your repo is pushed to GitHub with all the Noctua code.

### 3.2 Create Render web service

1. Go to **render.com** → sign in → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `noctua-engine`
   - **Root Directory**: `apps/engine`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
4. Add environment variables (same as `apps/engine/.env`):
   - `GROQ_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `ALLOWED_ORIGINS` → set to your Vercel URL (e.g., `https://noctua.vercel.app`)
5. Click **Create Web Service**
6. Wait for the build (~3 minutes)
7. Copy the Render URL (e.g., `https://noctua-engine.onrender.com`)
8. Test: visit `https://noctua-engine.onrender.com/health` — should return `{"status": "ok"}`

Note: Render free tier spins down after 15 minutes of inactivity.
The first request after a cold start takes ~30 seconds.

---

## Step 4: Deploy Next.js to Vercel

### 4.1 Create Vercel project

1. Go to **vercel.com** → sign in → **New Project**
2. Import your GitHub repo
3. Configure:
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `apps/web`
4. Add environment variables (same as `apps/web/.env.local`), with these changes:
   - `NEXTAUTH_URL` → `https://noctua.vercel.app` (your Vercel domain)
   - `ENGINE_URL` → the Render URL from step 3.7
   - Add `NEXT_PUBLIC_SUPABASE_URL` → same as `SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` → same as `SUPABASE_ANON_KEY`
5. Click **Deploy**
6. Wait for the build (~2 minutes)

### 4.2 Update GitHub OAuth App

Go back to **github.com/settings/developers** → your OAuth App:

1. Change **Homepage URL** to your Vercel URL
2. Change **Authorization callback URL** to `https://noctua.vercel.app/api/auth/callback/github`
3. Change **Webhook URL** to `https://noctua.vercel.app/api/webhook/github`
4. Save

---

## Step 5: Verify the Full Flow

1. Open your Vercel URL in a browser
2. Sign in with GitHub
3. Go to **Settings** → connect a test repo (or use `noctua-demo`)
4. Open a PR on that repo
5. Wait ~10-15 seconds
6. Check:
   - The PR gets a Noctua review comment on GitHub
   - The dashboard shows the PR with a quality score
   - The PR card animated from "analyzing" to "done"

---

## Step 6: Add Pre-flight Action (Optional)

To enable the pre-flight check on your repos:

1. Copy `.github/workflows/noctua-preflight.yml` to the target repo
2. In the target repo, go to **Settings → Variables → Actions**
3. Add a variable `NOCTUA_ENGINE_URL` with your Render engine URL
4. Push a commit — the Action will call `/preflight` on every push

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Unauthorized" on sign-in | Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in Vercel env vars |
| Webhook not firing | Check GitHub App webhook URL matches your Vercel URL. Check delivery logs at github.com/settings/apps → your app → Advanced → Recent Deliveries |
| Engine timeout | Render free tier cold start takes ~30s. Open `/health` to warm it up. |
| "Failed to fetch repos" | Make sure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly |
| PR stuck on "analyzing" | Check Render logs for engine errors. Verify `ENGINE_URL` in Vercel matches the Render URL. |
| Realtime not working | Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel |
| CORS errors | Set `ALLOWED_ORIGINS` in Render env vars to your Vercel URL |

---

## Architecture Recap

```
GitHub (webhooks) → Vercel (Next.js) → Render (Python FastAPI)
                                              ↓
                                        Supabase (Postgres)
                                              ↓
                                        Supabase Realtime → Dashboard
```

Total monthly cost: **$0.00**
