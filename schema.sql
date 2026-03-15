-- ============================================================
-- NOCTUA — Complete Supabase SQL Schema
-- ============================================================
-- Run this entire file in:
--   Supabase Dashboard → SQL Editor → New Query → Run
--
-- Tables created:
--   1. users           (NextAuth managed + custom columns)
--   2. accounts        (NextAuth OAuth accounts)
--   3. sessions        (NextAuth sessions)
--   4. repos           (GitHub repos connected to Noctua)
--   5. pull_requests   (one row per PR event)
--   6. team_stats      (aggregated per-author stats — leaderboard)
--   7. analysis_jobs   (audit log of every engine run)
--
-- Extras:
--   - Row-Level Security (RLS) on all tables
--   - Supabase Realtime enabled on pull_requests + analysis_jobs
--   - upsert_team_stats() stored procedure
--   - Indexes on all FK and filter columns
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";


-- ============================================================
-- 1. USERS
-- ============================================================
-- NextAuth Supabase Adapter creates this table automatically.
-- We add github_id and login as custom columns for Noctua.
-- If the adapter already created it, run only the ALTER TABLE block.
-- ============================================================

create table if not exists users (
  id             uuid        primary key default gen_random_uuid(),
  name           text,
  email          text        unique,
  email_verified timestamptz,
  image          text,

  -- Noctua custom columns
  github_id      text        unique,
  login          text,                        -- GitHub username e.g. "pranoy-basu"
  avatar_url     text,

  created_at     timestamptz not null default now()
);

-- Add Noctua columns if the table was already created by NextAuth adapter
do $$ begin
  begin alter table users add column github_id  text unique; exception when duplicate_column then null; end;
  begin alter table users add column login      text;        exception when duplicate_column then null; end;
  begin alter table users add column avatar_url text;        exception when duplicate_column then null; end;
  begin alter table users add column created_at timestamptz not null default now(); exception when duplicate_column then null; end;
end $$;


-- ============================================================
-- 2. ACCOUNTS  (NextAuth — OAuth token storage)
-- ============================================================

create table if not exists accounts (
  id                    uuid  primary key default gen_random_uuid(),
  user_id               uuid  not null references users(id) on delete cascade,
  type                  text  not null,
  provider              text  not null,
  provider_account_id   text  not null,
  refresh_token         text,
  access_token          text,
  expires_at            bigint,
  token_type            text,
  scope                 text,
  id_token              text,
  session_state         text,
  unique (provider, provider_account_id)
);

create index if not exists accounts_user_id_idx on accounts(user_id);


-- ============================================================
-- 3. SESSIONS  (NextAuth — session management)
-- ============================================================

create table if not exists sessions (
  id            uuid        primary key default gen_random_uuid(),
  session_token text        not null unique,
  user_id       uuid        not null references users(id) on delete cascade,
  expires       timestamptz not null
);

create index if not exists sessions_user_id_idx on sessions(user_id);


-- ============================================================
-- 4. VERIFICATION_TOKENS  (NextAuth — magic link / email verify)
-- ============================================================

create table if not exists verification_tokens (
  identifier text        not null,
  token      text        not null unique,
  expires    timestamptz not null,
  primary key (identifier, token)
);


-- ============================================================
-- 5. REPOS
-- ============================================================
-- One row per GitHub repo connected to Noctua.
-- Stores the persona setting and webhook_id for cleanup on disconnect.
-- ============================================================

create table if not exists repos (
  id              uuid    primary key default gen_random_uuid(),
  user_id         uuid    not null references users(id) on delete cascade,

  -- GitHub repo identity
  full_name       text    not null,            -- e.g. "pranoy-basu/noctua-demo"
  github_repo_id  bigint  unique,
  webhook_id      bigint,                      -- stored so we can DELETE the webhook on disconnect
  default_branch  text    default 'main',

  -- Noctua settings
  review_persona  text    not null default 'balanced'
                  check (review_persona in ('strict', 'mentor', 'fast', 'balanced')),
  is_active       boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists repos_user_id_idx       on repos(user_id);
create index if not exists repos_full_name_idx     on repos(full_name);
create index if not exists repos_github_repo_id_idx on repos(github_repo_id);


-- ============================================================
-- 6. PULL_REQUESTS
-- ============================================================
-- One row per PR event (opened / synchronize / reopened).
-- Python engine writes all analysis results back to this table.
-- Supabase Realtime fires on UPDATE → Next.js dashboard updates live.
-- ============================================================

create table if not exists pull_requests (
  id                uuid    primary key default gen_random_uuid(),
  repo_id           uuid    not null references repos(id) on delete cascade,

  -- GitHub PR metadata
  pr_number         int     not null,
  title             text,
  author            text,
  author_avatar     text,
  base_branch       text,
  head_branch       text,
  diff_url          text,
  github_pr_url     text,

  -- Pipeline status
  status            text    not null default 'pending'
                    check (status in ('pending', 'analyzing', 'done', 'failed')),

  -- Core analysis results (written by Python engine)
  quality_score     int     check (quality_score between 0 and 100),
  ai_summary        text,
  security_issues   jsonb   not null default '[]',
  -- security_issues schema: [{ "severity": "critical|high|medium", "rule": "hardcoded-secret", "line": 47, "snippet": "..." }]
  suggestions       jsonb   not null default '[]',
  -- suggestions schema: [{ "line": 12, "message": "Consider extracting...", "severity": "warning" }]

  -- Noctua-unique fields
  preflight_passed  boolean,
  persona_used      text    check (persona_used in ('strict', 'mentor', 'fast', 'balanced')),

  code_dna          jsonb   not null default '{}',
  -- code_dna schema: {
  --   "avg_line_length": 52.3,
  --   "comment_ratio": 0.12,
  --   "avg_nesting_depth": 2.4,
  --   "uses_type_hints": true,
  --   "snake_case_score": 0.94
  -- }

  diff_segments     jsonb   not null default '[]',
  -- diff_segments schema: [{ "pct": 60, "color": "safe" }, { "pct": 30, "color": "warn" }, { "pct": 10, "color": "critical" }]
  -- Used by the Diff Timeline heatmap component in the dashboard

  -- GitHub integration
  github_comment_id bigint,                   -- ID of the Noctua review comment posted on the PR

  analyzed_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists prs_repo_id_idx  on pull_requests(repo_id);
create index if not exists prs_author_idx   on pull_requests(author);
create index if not exists prs_status_idx   on pull_requests(status);
create index if not exists prs_created_idx  on pull_requests(created_at desc);

-- Prevent duplicate rows for the same PR number in the same repo
create unique index if not exists prs_unique_pr
  on pull_requests(repo_id, pr_number);


-- ============================================================
-- 7. TEAM_STATS
-- ============================================================
-- Aggregated per-author stats per repo.
-- Updated atomically by upsert_team_stats() after every analysis.
-- Powers the Team Clarity Leaderboard and Code DNA radar charts.
-- ============================================================

create table if not exists team_stats (
  id                    uuid    primary key default gen_random_uuid(),
  repo_id               uuid    not null references repos(id) on delete cascade,
  author                text    not null,

  -- Aggregated review metrics
  pr_count              int     not null default 0,
  avg_quality_score     numeric(5,2) not null default 0,
  total_security_issues int     not null default 0,
  preflight_pass_rate   numeric(5,2) not null default 0,  -- 0.0–1.0

  -- Aggregated Code DNA metrics (rolling averages — used for radar chart)
  avg_line_length       numeric(6,2) not null default 0,
  avg_comment_ratio     numeric(5,2) not null default 0,  -- 0.0–1.0
  avg_nesting_depth     numeric(5,2) not null default 0,
  type_hints_ratio      numeric(5,2) not null default 0,  -- % of PRs using type hints
  naming_score          numeric(5,2) not null default 0,  -- 0.0–1.0 snake_case consistency

  updated_at            timestamptz not null default now(),

  unique (repo_id, author)
);

create index if not exists team_stats_repo_id_idx on team_stats(repo_id);
create index if not exists team_stats_author_idx  on team_stats(author);


-- ============================================================
-- 8. ANALYSIS_JOBS
-- ============================================================
-- Audit log of every engine analysis run.
-- Useful for debugging failures, measuring p50/p99 latency,
-- and surfacing retry logic.
-- ============================================================

create table if not exists analysis_jobs (
  id            uuid    primary key default gen_random_uuid(),
  pr_id         uuid    not null references pull_requests(id) on delete cascade,

  status        text    not null default 'queued'
                check (status in ('queued', 'running', 'done', 'failed')),
  error_msg     text,                          -- populated only on failure
  retry_count   int     not null default 0,

  started_at    timestamptz,
  completed_at  timestamptz,
  duration_ms   int,                           -- computed on completion: extract(epoch...)

  created_at    timestamptz not null default now()
);

create index if not exists jobs_pr_id_idx  on analysis_jobs(pr_id);
create index if not exists jobs_status_idx on analysis_jobs(status);
create index if not exists jobs_created_idx on analysis_jobs(created_at desc);


-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================
-- Architecture note: This app uses NextAuth (not Supabase Auth),
-- so auth.uid() is NOT available. All server-side writes use the
-- service_role key which bypasses RLS entirely.
--
-- RLS is enabled with permissive SELECT policies for the anon role
-- so that Supabase Realtime can push postgres_changes events to
-- the browser client (which connects with the anon key).
--
-- Security is enforced at the application layer: all queries go
-- through authenticated Next.js API routes that filter by userId.
-- ============================================================

alter table repos          enable row level security;
alter table pull_requests  enable row level security;
alter table team_stats     enable row level security;
alter table analysis_jobs  enable row level security;

-- Drop policies if they already exist (idempotent re-runs)
drop policy if exists "owner can manage repos"       on repos;
drop policy if exists "user can read their prs"      on pull_requests;
drop policy if exists "user can read their stats"    on team_stats;
drop policy if exists "user can read their jobs"     on analysis_jobs;
drop policy if exists "anon can read prs"            on pull_requests;
drop policy if exists "anon can read analysis_jobs"  on analysis_jobs;
drop policy if exists "service role full access repos"         on repos;
drop policy if exists "service role full access prs"           on pull_requests;
drop policy if exists "service role full access team_stats"    on team_stats;
drop policy if exists "service role full access analysis_jobs" on analysis_jobs;

-- SERVICE ROLE: full access on all tables (used by Next.js API routes + Python engine)
create policy "service role full access repos"
  on repos for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service role full access prs"
  on pull_requests for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service role full access team_stats"
  on team_stats for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service role full access analysis_jobs"
  on analysis_jobs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ANON: read-only on pull_requests and analysis_jobs (for Supabase Realtime)
create policy "anon can read prs"
  on pull_requests
  for select
  using (auth.role() = 'anon');

create policy "anon can read analysis_jobs"
  on analysis_jobs
  for select
  using (auth.role() = 'anon');


-- ============================================================
-- SUPABASE REALTIME
-- ============================================================
-- Enables the Next.js dashboard to receive live postgres_changes
-- events when Python writes analysis results.
-- The PR card flips from "analyzing" → "done" without a refresh.
-- ============================================================

alter publication supabase_realtime add table pull_requests;
alter publication supabase_realtime add table analysis_jobs;


-- ============================================================
-- STORED PROCEDURE: upsert_team_stats
-- ============================================================
-- Called by the Python engine after every successful analysis.
-- Uses an UPSERT with incremental rolling average math so the
-- leaderboard stays accurate without recomputing all PRs.
--
-- Called from Python:
--   supabase.rpc("upsert_team_stats", {
--     "p_repo_id":       str(repo_id),
--     "p_author":        "pranoy-basu",
--     "p_quality_score": 84,
--     "p_sec_issues":    0,
--     "p_preflight_ok":  True,
--     "p_dna": {
--       "avg_line_length": 52.3,
--       "comment_ratio":   0.12,
--       "avg_nesting_depth": 2.1,
--       "uses_type_hints": True,
--       "snake_case_score": 0.94
--     }
--   }).execute()
-- ============================================================

create or replace function upsert_team_stats(
  p_repo_id       uuid,
  p_author        text,
  p_quality_score int,
  p_sec_issues    int,
  p_preflight_ok  boolean,
  p_dna           jsonb
)
returns void
language plpgsql
security definer                -- runs with elevated privileges (bypasses RLS)
as $$
declare
  v_line_length    numeric := coalesce((p_dna->>'avg_line_length')::numeric,    0);
  v_comment_ratio  numeric := coalesce((p_dna->>'comment_ratio')::numeric,      0);
  v_nesting_depth  numeric := coalesce((p_dna->>'avg_nesting_depth')::numeric,  0);
  v_type_hints     numeric := case when (p_dna->>'uses_type_hints')::boolean then 1 else 0 end;
  v_naming_score   numeric := coalesce((p_dna->>'snake_case_score')::numeric,   0);
  v_preflight_num  numeric := case when p_preflight_ok then 1 else 0 end;
begin
  insert into team_stats (
    repo_id, author,
    pr_count,
    avg_quality_score,
    total_security_issues,
    preflight_pass_rate,
    avg_line_length,
    avg_comment_ratio,
    avg_nesting_depth,
    type_hints_ratio,
    naming_score,
    updated_at
  )
  values (
    p_repo_id, p_author,
    1,
    p_quality_score,
    p_sec_issues,
    v_preflight_num,
    v_line_length,
    v_comment_ratio,
    v_nesting_depth,
    v_type_hints,
    v_naming_score,
    now()
  )
  on conflict (repo_id, author) do update set
    pr_count              = team_stats.pr_count + 1,
    -- Incremental rolling average: new_avg = (old_avg * old_n + new_val) / (old_n + 1)
    avg_quality_score     = (team_stats.avg_quality_score * team_stats.pr_count + p_quality_score)
                             / (team_stats.pr_count + 1),
    total_security_issues = team_stats.total_security_issues + p_sec_issues,
    preflight_pass_rate   = (team_stats.preflight_pass_rate * team_stats.pr_count + v_preflight_num)
                             / (team_stats.pr_count + 1),
    avg_line_length       = (team_stats.avg_line_length * team_stats.pr_count + v_line_length)
                             / (team_stats.pr_count + 1),
    avg_comment_ratio     = (team_stats.avg_comment_ratio * team_stats.pr_count + v_comment_ratio)
                             / (team_stats.pr_count + 1),
    avg_nesting_depth     = (team_stats.avg_nesting_depth * team_stats.pr_count + v_nesting_depth)
                             / (team_stats.pr_count + 1),
    type_hints_ratio      = (team_stats.type_hints_ratio * team_stats.pr_count + v_type_hints)
                             / (team_stats.pr_count + 1),
    naming_score          = (team_stats.naming_score * team_stats.pr_count + v_naming_score)
                             / (team_stats.pr_count + 1),
    updated_at            = now();
end;
$$;


-- ============================================================
-- HELPER VIEW: pr_feed
-- ============================================================
-- Joins pull_requests with repos for the dashboard PR feed.
-- Includes repo full_name and persona so the UI doesn't need
-- a separate query.
-- ============================================================

create or replace view pr_feed as
  select
    pr.id,
    pr.pr_number,
    pr.title,
    pr.author,
    pr.author_avatar,
    pr.status,
    pr.quality_score,
    pr.security_issues,
    pr.preflight_passed,
    pr.persona_used,
    pr.diff_segments,
    pr.ai_summary,
    pr.analyzed_at,
    pr.created_at,
    r.full_name   as repo_full_name,
    r.review_persona,
    r.user_id
  from pull_requests pr
  join repos r on r.id = pr.repo_id
  order by pr.created_at desc;


-- ============================================================
-- HELPER VIEW: leaderboard
-- ============================================================
-- Ranked author leaderboard per repo, ordered by avg quality score.
-- Used directly by the Team Clarity Leaderboard page.
-- ============================================================

create or replace view leaderboard as
  select
    ts.*,
    rank() over (
      partition by ts.repo_id
      order by ts.avg_quality_score desc
    ) as rank,
    r.full_name as repo_full_name,
    r.user_id
  from team_stats ts
  join repos r on r.id = ts.repo_id;


-- ============================================================
-- SEED DATA (optional — for local dev and demo)
-- ============================================================
-- Uncomment and run to seed demo data for testing the dashboard
-- without needing to open real PRs.
-- ============================================================

/*
-- Seed a demo repo (replace with your real user id)
insert into repos (user_id, full_name, github_repo_id, review_persona)
values (
  'YOUR_USER_UUID_HERE',
  'pranoy-basu/noctua-demo',
  123456789,
  'balanced'
);

-- Seed 5 demo pull requests
with demo_repo as (select id from repos where full_name = 'pranoy-basu/noctua-demo' limit 1)
insert into pull_requests (
  repo_id, pr_number, title, author, status,
  quality_score, ai_summary, security_issues, persona_used,
  preflight_passed, diff_segments, analyzed_at
)
select
  (select id from demo_repo),
  pr.pr_number,
  pr.title,
  pr.author,
  'done',
  pr.score,
  pr.summary,
  pr.sec_issues::jsonb,
  'balanced',
  pr.preflight_ok,
  pr.segments::jsonb,
  now() - (pr.pr_number * interval '2 hours')
from (values
  (1, 'feat: add Code DNA fingerprinting to analysis pipeline', 'pranoy-basu', 91,
   'Strong type hints and consistent naming throughout. Minor nesting complexity in compute_dna().',
   '[]', true,
   '[{"pct":60,"color":"safe"},{"pct":30,"color":"warn"},{"pct":10,"color":"safe"}]'),
  (2, 'fix: resolve race condition in webhook processing queue', 'pranoy-basu', 78,
   'Correct fix for the race condition. Missing error handling on the Redis brpop timeout path.',
   '[]', true,
   '[{"pct":70,"color":"safe"},{"pct":20,"color":"warn"},{"pct":10,"color":"safe"}]'),
  (3, 'chore: update API client config and add retry logic', 'amita-mehta', 62,
   'Retry logic is solid but a hardcoded API key was detected on line 47. Rotate immediately.',
   '[{"severity":"critical","rule":"hardcoded-secret","line":47,"snippet":"api_key = \"sk-prod-...\""}]',
   false,
   '[{"pct":30,"color":"safe"},{"pct":40,"color":"warn"},{"pct":30,"color":"critical"}]'),
  (4, 'refactor: extract ETL transform logic into service layer', 'siddharth-p', 84,
   'Clean separation of concerns. Add unit tests for transform_batch() — currently 0% coverage on this path.',
   '[]', true,
   '[{"pct":70,"color":"safe"},{"pct":30,"color":"warn"}]'),
  (5, 'docs: update API reference with OpenAPI schema annotations', 'nikhil-k', 71,
   'Docs are accurate but naming is inconsistent between analyze_pr and run_analysis. Standardise before merge.',
   '[]', true,
   '[{"pct":50,"color":"safe"},{"pct":30,"color":"warn"},{"pct":20,"color":"safe"}]')
) as pr(pr_number, title, author, score, summary, sec_issues, preflight_ok, segments);
*/


-- ============================================================
-- DONE
-- ============================================================
-- Schema is fully installed. Verify with:
--   select table_name from information_schema.tables
--   where table_schema = 'public'
--   order by table_name;
--
-- Expected tables:
--   accounts, analysis_jobs, pull_requests, repos,
--   sessions, team_stats, users, verification_tokens
-- ============================================================
