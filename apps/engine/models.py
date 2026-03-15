from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class ReviewPersona(str, Enum):
    strict = "strict"
    mentor = "mentor"
    fast = "fast"
    balanced = "balanced"


class IssueSeverity(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"


class SecurityIssue(BaseModel):
    severity: IssueSeverity
    rule: str
    line: int
    snippet: str


class DiffSegment(BaseModel):
    pct: int
    color: str  # "safe" | "warn" | "critical"


class CodeDNA(BaseModel):
    avg_line_length: float = 0.0
    comment_ratio: float = 0.0
    avg_nesting_depth: float = 0.0
    uses_type_hints: bool = False
    snake_case_score: float = 0.0


class Suggestion(BaseModel):
    line: int = 0
    message: str = ""
    severity: str = "warning"


class AnalyzeRequest(BaseModel):
    pr_id: str
    pr_number: int
    repo: str
    repo_id: str
    diff_url: str
    title: str
    author: str
    author_avatar: Optional[str] = None
    base_branch: Optional[str] = None
    head_branch: Optional[str] = None
    github_pr_url: Optional[str] = None
    token: str = ""
    persona: ReviewPersona = ReviewPersona.balanced


class PreflightRequest(BaseModel):
    diff_b64: str
    author: str = ""


class AnalysisResult(BaseModel):
    status: str = "ok"
    quality_score: int = 70
    ai_summary: str = ""
    suggestions: list[Suggestion] = Field(default_factory=list)
    security_issues: list[SecurityIssue] = Field(default_factory=list)
    preflight_passed: bool = True
    code_dna: CodeDNA = Field(default_factory=CodeDNA)
    diff_segments: list[DiffSegment] = Field(default_factory=list)
    duration_ms: int = 0


class PreflightResult(BaseModel):
    passed: bool = True
    critical_count: int = 0
    message: str = "All clear"
    issues: list[SecurityIssue] = Field(default_factory=list)
