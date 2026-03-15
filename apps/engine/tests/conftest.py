import sys
import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("GROQ_API_KEY", "test-key")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-key")
os.environ.setdefault("RESEND_API_KEY", "")
os.environ.setdefault("UPSTASH_REDIS_REST_URL", "https://test.upstash.io")
os.environ.setdefault("UPSTASH_REDIS_REST_TOKEN", "test-token")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")


@pytest.fixture
def sample_diff():
    path = os.path.join(os.path.dirname(__file__), "mock_data", "sample_diff.patch")
    with open(path) as f:
        return f.read()


@pytest.fixture
def sample_diff_with_secrets():
    path = os.path.join(
        os.path.dirname(__file__), "mock_data", "sample_diff_with_secrets.patch"
    )
    with open(path) as f:
        return f.read()


@pytest.fixture
def sample_python_code():
    path = os.path.join(
        os.path.dirname(__file__), "mock_data", "sample_python_code.py"
    )
    with open(path) as f:
        return f.read()


@pytest.fixture
def sample_typescript_code():
    path = os.path.join(
        os.path.dirname(__file__), "mock_data", "sample_typescript_code.ts"
    )
    with open(path) as f:
        return f.read()


@pytest.fixture
def mock_groq():
    mock_client = AsyncMock()
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(
            message=MagicMock(
                content='{"summary": "Clean PR with good patterns.", "quality_score": 85, "suggestions": [{"line": 12, "message": "Consider extracting this logic.", "severity": "warning"}]}'
            )
        )
    ]
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
    return mock_client


@pytest.fixture
def mock_supabase():
    mock = MagicMock()
    mock.table.return_value.update.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[{"id": "test-id"}])
    )
    mock.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "test-job-id"}]
    )
    mock.rpc.return_value.execute.return_value = MagicMock(data=[])
    return mock
