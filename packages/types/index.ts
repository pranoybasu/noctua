export type ReviewPersona = "strict" | "mentor" | "fast" | "balanced";

export type PRStatus = "pending" | "analyzing" | "done" | "failed";

export type IssueSeverity = "critical" | "high" | "medium";

export interface SecurityIssue {
  severity: IssueSeverity;
  rule: string;
  line: number;
  snippet: string;
}

export interface DiffSegment {
  pct: number;
  color: "safe" | "warn" | "critical";
}

export interface CodeDNA {
  avg_line_length: number;
  comment_ratio: number;
  avg_nesting_depth: number;
  uses_type_hints: boolean;
  snake_case_score: number;
}

export interface Suggestion {
  line: number;
  message: string;
  severity: "warning" | "info";
}

export interface PRPayload {
  pr_number: number;
  repo: string;
  repo_id: string;
  diff_url: string;
  title: string;
  author: string;
  author_avatar?: string;
  base_branch?: string;
  head_branch?: string;
  github_pr_url?: string;
  token: string;
  persona: ReviewPersona;
}

export interface AnalysisResult {
  status: "ok" | "error";
  quality_score: number;
  ai_summary: string;
  suggestions: Suggestion[];
  security_issues: SecurityIssue[];
  preflight_passed: boolean;
  code_dna: CodeDNA;
  diff_segments: DiffSegment[];
  duration_ms: number;
}

export interface PreflightRequest {
  diff_b64: string;
  author: string;
}

export interface PreflightResult {
  passed: boolean;
  critical_count: number;
  message: string;
  issues: SecurityIssue[];
}

export interface TeamMember {
  id: string;
  repo_id: string;
  author: string;
  pr_count: number;
  avg_quality_score: number;
  total_security_issues: number;
  preflight_pass_rate: number;
  avg_line_length: number;
  avg_comment_ratio: number;
  avg_nesting_depth: number;
  type_hints_ratio: number;
  naming_score: number;
  rank?: number;
  repo_full_name?: string;
}

export interface PRFeedItem {
  id: string;
  pr_number: number;
  title: string;
  author: string;
  author_avatar: string | null;
  status: PRStatus;
  quality_score: number | null;
  security_issues: SecurityIssue[];
  preflight_passed: boolean | null;
  persona_used: ReviewPersona | null;
  diff_segments: DiffSegment[];
  ai_summary: string | null;
  suggestions: Suggestion[];
  code_dna: CodeDNA | null;
  analyzed_at: string | null;
  created_at: string;
  repo_full_name: string;
  review_persona: ReviewPersona;
  github_pr_url: string | null;
  base_branch: string | null;
  head_branch: string | null;
  github_comment_id: number | null;
}

export interface RepoInfo {
  id: string;
  full_name: string;
  github_repo_id: number;
  webhook_id: number | null;
  default_branch: string;
  review_persona: ReviewPersona;
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_prs: number;
  avg_score: number;
  security_catches: number;
  repos_watched: number;
  score_delta: number;
  pr_delta: number;
}
