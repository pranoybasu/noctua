# noctua-demo

Test target repository for Noctua PR intelligence.

## Purpose

This repo exists for you to open PRs against and see Noctua in action.
Connect it via your Noctua dashboard (Settings page), then open PRs
to trigger automated analysis.

## Test Scenarios

### 1. Clean PR (should pass)

Create a file like `src/helpers.py`:

```python
from typing import List

def calculate_average(values: List[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)
```

Open a PR. Expected: score 80+, no security issues, clean DNA.

### 2. Security Issue (should flag critical)

Create a file like `src/config.py`:

```python
api_key = "sk-prod-abc123def456ghi789jkl012mno345pqr678"

def process(user_input):
    return eval(user_input)
```

Open a PR. Expected: critical security issues flagged, score < 60.

### 3. Persona Test

Switch your repo persona to "strict" in Settings, then open a PR.
The review tone should be direct, score lower (0.6x weight).

### 4. Pre-flight Test

Add the `.github/workflows/noctua-preflight.yml` action to this repo.
Set the `NOCTUA_ENGINE_URL` repository variable to your engine URL.
Push a commit with a hardcoded secret — the Action should fail.

## Setup

1. Fork this repo or create your own test repo
2. Go to your Noctua dashboard → Settings
3. Click the "+" button next to this repo
4. Open a PR and watch Noctua work
