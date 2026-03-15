# Noctua Testing Plan

## Overview

This document outlines the testing strategy for Noctua. Tests are split into three tiers:

1. **Unit tests** — isolated function-level tests for the Python engine services
2. **Integration tests** — endpoint-level tests for FastAPI routes with mocked external services
3. **Manual E2E** — full-flow tests using a target demo repo

---

## Python Engine Tests

Located in `apps/engine/tests/`. Run with:

```bash
cd apps/engine
pip install pytest pytest-asyncio httpx
python -m pytest tests/ -v
```

### Unit Tests

| File | What it tests |
|---|---|
| `test_scanner.py` | Security scanner pattern matching — critical (hardcoded secrets, eval), high (SQL injection, shell injection), medium (debug leaks, TODOs). Verifies deduplication and line numbers. |
| `test_dna.py` | Code DNA fingerprinting — avg line length, comment ratio, nesting depth (indentation-based), type hint detection (Python + TS), naming score (snake_case vs camelCase). |
| `test_ai.py` | AI persona service — verifies persona selection, system prompt mapping, score weight application (clamped 0-100), JSON parsing fallback on invalid responses. Uses mocked Groq client. |
| `test_preflight.py` | Preflight endpoint — base64 decoding, scanner integration, pass/fail logic, critical vs high severity distinction. |

### Integration Tests

| File | What it tests |
|---|---|
| `test_pipeline.py` | Full pipeline flow with all external services mocked (Groq, GitHub, Supabase). Verifies that asyncio.gather runs all three services in parallel, results are written to Supabase, GitHub comment is posted, and email is sent on critical issues. |

### Mock Data Files

| File | Purpose |
|---|---|
| `mock_data/sample_diff.patch` | Clean unified diff (no security issues) for positive-path testing |
| `mock_data/sample_diff_with_secrets.patch` | Diff containing hardcoded API keys and eval() calls |
| `mock_data/sample_python_code.py` | Python code with type hints, comments, snake_case — for DNA analysis |
| `mock_data/sample_typescript_code.ts` | TypeScript code with camelCase, JSDoc — for DNA analysis |

---

## Next.js Tests

Located in `apps/web/__tests__/`. Run with:

```bash
cd apps/web
npx vitest run
```

| File | What it tests |
|---|---|
| `webhook.test.ts` | HMAC signature verification — valid signature passes, tampered payload rejects, missing signature rejects, timing-safe comparison. |
| `mock_data/webhook_payloads.ts` | Sample GitHub webhook payloads for pull_request opened/synchronize events. |

---

## Manual E2E Testing

Use the `noctua-demo` target repo to test the full flow:

### Setup

1. Deploy Noctua (see DEPLOYMENT_GUIDE.md)
2. Fork or create `pranoybasu/noctua-demo`
3. Connect it via the Settings page

### Test Scenarios

| Scenario | Steps | Expected Result |
|---|---|---|
| **Happy path** | Open a clean PR (no security issues) | Noctua posts a review comment with score, summary, Code DNA. Dashboard shows PR as "done". |
| **Security catch** | Open a PR with `api_key = "sk-prod-abc123"` in a Python file | Scanner detects critical issue. Noctua comment shows security warning. Preflight would have blocked. Email alert sent. |
| **Persona switch** | Change repo persona to "strict" in Settings, then open a PR | Review tone is direct, score is lower (0.6x weight). Comment uses 🔍 emoji. |
| **Real-time update** | Open dashboard, then open a PR in another tab | Dashboard PR card should animate from "analyzing" to "done" without refresh. |
| **Preflight block** | Push a commit with a hardcoded secret on a branch (pre-flight action installed) | GitHub Action fails, blocking the push with a human-readable message. |
| **Duplicate dedup** | Rapidly push two commits to the same PR | Only one analysis runs (Redis dedup key prevents duplicate). |

---

## Coverage Goals

- **Python engine**: 85%+ on services/scanner.py, services/dna.py, services/ai.py
- **Next.js API routes**: Smoke test coverage on webhook signature verification
- **Manual E2E**: All 6 scenarios pass on a deployed instance
