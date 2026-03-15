export const DEMO_PRS = [
  {
    id: "pr-001",
    repo_id: "repo-001",
    pr_number: 47,
    title: "feat: add rate limiting middleware to API routes",
    author: "sarahdev",
    author_avatar: "https://avatars.githubusercontent.com/u/583231?v=4",
    base_branch: "main",
    head_branch: "feature/rate-limit",
    status: "done" as const,
    quality_score: 88,
    ai_summary:
      "Well-structured rate limiting implementation using a sliding window algorithm. Token bucket pattern is correctly applied. Minor concern: the Redis fallback to in-memory could cause inconsistency across serverless instances.",
    security_issues: [
      {
        severity: "medium",
        rule: "cors-wildcard",
        line: 12,
        snippet: "Access-Control-Allow-Origin: *",
      },
    ],
    suggestions: [
      { line: 34, message: "Consider using a distributed cache (Redis) instead of in-memory Map for rate limit counters in production.", severity: "warning" },
      { line: 56, message: "The retry-after header value should be calculated from the window reset time, not hardcoded to 60.", severity: "warning" },
      { line: 78, message: "Good use of the sliding window pattern here. Clean implementation.", severity: "info" },
    ],
    code_dna: {
      avg_line_length: 42.3,
      comment_ratio: 0.18,
      avg_nesting_depth: 2.1,
      uses_type_hints: true,
      snake_case_score: 0.15,
    },
    diff_segments: [
      { pct: 40, color: "safe" as const },
      { pct: 25, color: "warn" as const },
      { pct: 20, color: "safe" as const },
      { pct: 15, color: "safe" as const },
    ],
    persona_used: "balanced",
    github_pr_url: "https://github.com/demo-org/noctua-demo/pull/47",
    repo_full_name: "demo-org/noctua-demo",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pr-002",
    repo_id: "repo-001",
    pr_number: 46,
    title: "fix: resolve SQL injection in user search endpoint",
    author: "alexcodes",
    author_avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
    base_branch: "main",
    head_branch: "fix/sql-injection",
    status: "done" as const,
    quality_score: 42,
    ai_summary:
      "Critical security fix addresses SQL injection vulnerability in the user search endpoint. However, the fix uses string concatenation with manual escaping instead of parameterized queries. This is still vulnerable to certain bypass techniques.",
    security_issues: [
      { severity: "critical", rule: "sql-injection", line: 23, snippet: "query = f\"SELECT * FROM users WHERE name LIKE '%{search}%'\"" },
      { severity: "high", rule: "missing-input-validation", line: 15, snippet: "const search = req.query.q" },
      { severity: "medium", rule: "no-rate-limit", line: 8, snippet: "router.get('/search', async (req, res) => {" },
    ],
    suggestions: [
      { line: 23, message: "Use parameterized queries ($1, $2) instead of string interpolation to prevent SQL injection.", severity: "warning" },
      { line: 15, message: "Validate and sanitize search input. Limit length to 100 chars and strip special SQL characters.", severity: "warning" },
      { line: 8, message: "Add rate limiting to the search endpoint to prevent abuse.", severity: "warning" },
      { line: 30, message: "Consider adding LIMIT clause to prevent returning unbounded result sets.", severity: "info" },
    ],
    code_dna: {
      avg_line_length: 55.1,
      comment_ratio: 0.05,
      avg_nesting_depth: 3.4,
      uses_type_hints: false,
      snake_case_score: 0.7,
    },
    diff_segments: [
      { pct: 60, color: "critical" as const },
      { pct: 25, color: "warn" as const },
      { pct: 15, color: "safe" as const },
    ],
    persona_used: "strict",
    github_pr_url: "https://github.com/demo-org/noctua-demo/pull/46",
    repo_full_name: "demo-org/noctua-demo",
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pr-003",
    repo_id: "repo-002",
    pr_number: 12,
    title: "feat: implement WebSocket real-time notifications",
    author: "mikalee",
    author_avatar: "https://avatars.githubusercontent.com/u/6154722?v=4",
    base_branch: "main",
    head_branch: "feature/ws-notifications",
    status: "done" as const,
    quality_score: 76,
    ai_summary:
      "Solid WebSocket implementation with proper connection lifecycle management. Heartbeat mechanism is well-designed. The reconnection logic with exponential backoff is a nice touch. Consider adding message queuing for offline clients.",
    security_issues: [],
    suggestions: [
      { line: 45, message: "Add message queue for notifications sent while client is disconnected.", severity: "warning" },
      { line: 12, message: "Good pattern: using heartbeat pings to detect stale connections.", severity: "info" },
    ],
    code_dna: {
      avg_line_length: 38.7,
      comment_ratio: 0.22,
      avg_nesting_depth: 1.8,
      uses_type_hints: true,
      snake_case_score: 0.05,
    },
    diff_segments: [
      { pct: 50, color: "safe" as const },
      { pct: 30, color: "safe" as const },
      { pct: 20, color: "safe" as const },
    ],
    persona_used: "mentor",
    github_pr_url: "https://github.com/demo-org/api-service/pull/12",
    repo_full_name: "demo-org/api-service",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pr-004",
    repo_id: "repo-001",
    pr_number: 45,
    title: "chore: upgrade dependencies and fix type errors",
    author: "sarahdev",
    author_avatar: "https://avatars.githubusercontent.com/u/583231?v=4",
    base_branch: "main",
    head_branch: "chore/dep-upgrade",
    status: "analyzing" as const,
    quality_score: null,
    ai_summary: null,
    security_issues: [],
    suggestions: [],
    code_dna: null,
    diff_segments: [],
    persona_used: "fast",
    github_pr_url: "https://github.com/demo-org/noctua-demo/pull/45",
    repo_full_name: "demo-org/noctua-demo",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "pr-005",
    repo_id: "repo-003",
    pr_number: 8,
    title: "feat: add dark mode support with system preference detection",
    author: "jpark",
    author_avatar: "https://avatars.githubusercontent.com/u/1024025?v=4",
    base_branch: "main",
    head_branch: "feature/dark-mode",
    status: "done" as const,
    quality_score: 92,
    ai_summary:
      "Excellent dark mode implementation that respects system preferences and persists user choice. CSS custom properties are used consistently. Transition animations are smooth. The ThemeProvider pattern is clean and reusable.",
    security_issues: [],
    suggestions: [
      { line: 0, message: "Consider adding a prefers-reduced-motion check to disable the theme transition animation for accessibility.", severity: "info" },
    ],
    code_dna: {
      avg_line_length: 35.2,
      comment_ratio: 0.14,
      avg_nesting_depth: 1.5,
      uses_type_hints: true,
      snake_case_score: 0.08,
    },
    diff_segments: [
      { pct: 35, color: "safe" as const },
      { pct: 35, color: "safe" as const },
      { pct: 30, color: "safe" as const },
    ],
    persona_used: "balanced",
    github_pr_url: "https://github.com/demo-org/landing-page/pull/8",
    repo_full_name: "demo-org/landing-page",
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pr-006",
    repo_id: "repo-002",
    pr_number: 11,
    title: "fix: patch auth bypass in admin panel",
    author: "alexcodes",
    author_avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
    base_branch: "main",
    head_branch: "fix/auth-bypass",
    status: "done" as const,
    quality_score: 61,
    ai_summary:
      "Patches an authentication bypass where admin routes were accessible without a valid session token. The fix adds middleware checks but the token validation logic still relies on client-side cookies without server verification.",
    security_issues: [
      { severity: "high", rule: "weak-auth-check", line: 18, snippet: "if (req.cookies.admin === 'true')" },
      { severity: "medium", rule: "missing-csrf", line: 5, snippet: "app.post('/admin/delete', ...)" },
    ],
    suggestions: [
      { line: 18, message: "Verify the session token server-side using your auth provider, not a client cookie.", severity: "warning" },
      { line: 5, message: "Add CSRF protection to state-changing admin endpoints.", severity: "warning" },
    ],
    code_dna: {
      avg_line_length: 48.9,
      comment_ratio: 0.08,
      avg_nesting_depth: 2.9,
      uses_type_hints: false,
      snake_case_score: 0.6,
    },
    diff_segments: [
      { pct: 50, color: "critical" as const },
      { pct: 35, color: "warn" as const },
      { pct: 15, color: "safe" as const },
    ],
    persona_used: "strict",
    github_pr_url: "https://github.com/demo-org/api-service/pull/11",
    repo_full_name: "demo-org/api-service",
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pr-007",
    repo_id: "repo-001",
    pr_number: 44,
    title: "feat: add CSV export for analytics data",
    author: "mikalee",
    author_avatar: "https://avatars.githubusercontent.com/u/6154722?v=4",
    base_branch: "main",
    head_branch: "feature/csv-export",
    status: "failed" as const,
    quality_score: null,
    ai_summary: null,
    security_issues: [],
    suggestions: [],
    code_dna: null,
    diff_segments: [],
    persona_used: "balanced",
    github_pr_url: "https://github.com/demo-org/noctua-demo/pull/44",
    repo_full_name: "demo-org/noctua-demo",
    created_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pr-008",
    repo_id: "repo-003",
    pr_number: 7,
    title: "refactor: extract shared UI components into design system package",
    author: "jpark",
    author_avatar: "https://avatars.githubusercontent.com/u/1024025?v=4",
    base_branch: "main",
    head_branch: "refactor/design-system",
    status: "done" as const,
    quality_score: 85,
    ai_summary:
      "Clean extraction of 12 shared components into a standalone design system package. Props interfaces are well-typed. The Storybook integration is a great addition for visual testing. Consider adding a changelog for version tracking.",
    security_issues: [],
    suggestions: [
      { line: 0, message: "Add a CHANGELOG.md to track component versions and breaking changes.", severity: "info" },
      { line: 15, message: "The Button component variants could use CVA (class-variance-authority) for cleaner variant management.", severity: "info" },
    ],
    code_dna: {
      avg_line_length: 32.1,
      comment_ratio: 0.2,
      avg_nesting_depth: 1.3,
      uses_type_hints: true,
      snake_case_score: 0.03,
    },
    diff_segments: [
      { pct: 25, color: "safe" as const },
      { pct: 20, color: "safe" as const },
      { pct: 20, color: "safe" as const },
      { pct: 15, color: "safe" as const },
      { pct: 20, color: "safe" as const },
    ],
    persona_used: "mentor",
    github_pr_url: "https://github.com/demo-org/landing-page/pull/7",
    repo_full_name: "demo-org/landing-page",
    created_at: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_TEAM = [
  {
    id: "ts-001", repo_id: "repo-001", author: "sarahdev",
    pr_count: 18, avg_quality_score: 84, total_security_issues: 3, preflight_pass_rate: 0.94,
    avg_line_length: 40.5, avg_comment_ratio: 0.16, avg_nesting_depth: 2.0, type_hints_ratio: 0.85, naming_score: 0.12,
  },
  {
    id: "ts-002", repo_id: "repo-001", author: "jpark",
    pr_count: 14, avg_quality_score: 89, total_security_issues: 0, preflight_pass_rate: 1.0,
    avg_line_length: 33.8, avg_comment_ratio: 0.17, avg_nesting_depth: 1.4, type_hints_ratio: 0.92, naming_score: 0.05,
  },
  {
    id: "ts-003", repo_id: "repo-002", author: "mikalee",
    pr_count: 11, avg_quality_score: 76, total_security_issues: 1, preflight_pass_rate: 0.91,
    avg_line_length: 38.7, avg_comment_ratio: 0.22, avg_nesting_depth: 1.8, type_hints_ratio: 0.78, naming_score: 0.06,
  },
  {
    id: "ts-004", repo_id: "repo-001", author: "alexcodes",
    pr_count: 9, avg_quality_score: 52, total_security_issues: 7, preflight_pass_rate: 0.67,
    avg_line_length: 52.0, avg_comment_ratio: 0.06, avg_nesting_depth: 3.1, type_hints_ratio: 0.15, naming_score: 0.65,
  },
  {
    id: "ts-005", repo_id: "repo-003", author: "tayloreng",
    pr_count: 6, avg_quality_score: 71, total_security_issues: 2, preflight_pass_rate: 0.83,
    avg_line_length: 45.2, avg_comment_ratio: 0.12, avg_nesting_depth: 2.3, type_hints_ratio: 0.72, naming_score: 0.3,
  },
];

function generateDateRange(days: number) {
  const dates: string[] = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dates.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  return dates;
}

const dates = generateDateRange(29);

export const DEMO_ANALYTICS = {
  scoreTrend: dates.map((date, i) => ({
    date,
    score: Math.round(65 + 20 * Math.sin(i / 4) + Math.random() * 10),
  })),
  securityTrend: dates.map((date) => ({
    date,
    issues: Math.floor(Math.random() * 5),
  })),
  prVolume: dates.map((date) => ({
    date,
    count: Math.floor(1 + Math.random() * 6),
  })),
};

export const DEMO_REPOS = [
  { id: 100001, full_name: "demo-org/noctua-demo", name: "noctua-demo", owner: "demo-org", default_branch: "main", connected: true, noctua_repo_id: "repo-001", review_persona: "balanced" as const },
  { id: 100002, full_name: "demo-org/api-service", name: "api-service", owner: "demo-org", default_branch: "main", connected: true, noctua_repo_id: "repo-002", review_persona: "strict" as const },
  { id: 100003, full_name: "demo-org/landing-page", name: "landing-page", owner: "demo-org", default_branch: "main", connected: true, noctua_repo_id: "repo-003", review_persona: "mentor" as const },
  { id: 100004, full_name: "demo-org/docs-site", name: "docs-site", owner: "demo-org", default_branch: "main", connected: false, noctua_repo_id: null, review_persona: "balanced" as const },
  { id: 100005, full_name: "demo-org/infra-config", name: "infra-config", owner: "demo-org", default_branch: "main", connected: false, noctua_repo_id: null, review_persona: "balanced" as const },
  { id: 100006, full_name: "demo-org/mobile-app", name: "mobile-app", owner: "demo-org", default_branch: "develop", connected: false, noctua_repo_id: null, review_persona: "balanced" as const },
];

export const DEMO_STATS = {
  total_prs: 58,
  avg_score: 78,
  security_catches: 13,
  repos_watched: 3,
  score_delta: 4,
  pr_delta: 7,
};
