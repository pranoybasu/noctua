import base64
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
class TestPreflightEndpoint:
    async def test_clean_code_passes(self):
        code = "def hello():\n    return 'world'"
        diff = f"+{code}"
        b64 = base64.b64encode(diff.encode()).decode()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/preflight",
                json={"diff_b64": b64, "author": "test"},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["passed"] is True
        assert data["critical_count"] == 0

    async def test_secret_blocks(self):
        code = '+api_key = "sk-prod-verylongsecretkey12345678"'
        b64 = base64.b64encode(code.encode()).decode()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/preflight",
                json={"diff_b64": b64, "author": "test"},
            )

        data = resp.json()
        assert data["passed"] is False
        assert data["critical_count"] >= 1
        assert "Blocked" in data["message"]

    async def test_eval_blocks(self):
        code = "+result = eval(user_input)"
        b64 = base64.b64encode(code.encode()).decode()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/preflight",
                json={"diff_b64": b64, "author": "test"},
            )

        data = resp.json()
        assert data["passed"] is False

    async def test_invalid_base64_fails_gracefully(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/preflight",
                json={"diff_b64": "not-valid-base64!!!", "author": "test"},
            )

        data = resp.json()
        assert data["passed"] is False
        assert "decode" in data["message"].lower()

    async def test_high_severity_passes_with_warning(self):
        code = '+db.execute("SELECT * FROM users WHERE id = %s" % user_id)'
        b64 = base64.b64encode(code.encode()).decode()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/preflight",
                json={"diff_b64": b64, "author": "test"},
            )

        data = resp.json()
        assert data["passed"] is True
        assert "warning" in data["message"].lower() or "Passed" in data["message"]
