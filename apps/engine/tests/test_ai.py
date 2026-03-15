import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from services.ai import ai_review, PERSONAS
from models import ReviewPersona


@pytest.mark.asyncio
class TestAIReview:
    async def test_balanced_persona_returns_result(self, mock_groq):
        with patch("services.ai.AsyncGroq", return_value=mock_groq):
            result = await ai_review(
                diff="+ x = 1",
                title="test PR",
                author="test-author",
                persona=ReviewPersona.balanced,
            )
        assert "summary" in result
        assert "quality_score" in result
        assert isinstance(result["quality_score"], int)
        assert 0 <= result["quality_score"] <= 100

    async def test_strict_persona_lowers_score(self, mock_groq):
        with patch("services.ai.AsyncGroq", return_value=mock_groq):
            result = await ai_review(
                diff="+ x = 1",
                title="test PR",
                author="test-author",
                persona=ReviewPersona.strict,
            )
        # strict weight is 0.6, so 85 * 0.6 = 51
        assert result["quality_score"] == 51

    async def test_mentor_persona_raises_score(self, mock_groq):
        with patch("services.ai.AsyncGroq", return_value=mock_groq):
            result = await ai_review(
                diff="+ x = 1",
                title="test PR",
                author="test-author",
                persona=ReviewPersona.mentor,
            )
        # mentor weight is 1.1, so 85 * 1.1 = 93
        assert result["quality_score"] == 93

    async def test_score_clamped_to_100(self):
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content='{"summary": "Perfect.", "quality_score": 99, "suggestions": []}'
                )
            )
        ]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("services.ai.AsyncGroq", return_value=mock_client):
            result = await ai_review(
                diff="+ x = 1",
                title="test PR",
                author="test-author",
                persona=ReviewPersona.mentor,  # 1.1x weight
            )
        assert result["quality_score"] <= 100

    async def test_fallback_on_groq_error(self):
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(
            side_effect=Exception("API unavailable")
        )

        with patch("services.ai.AsyncGroq", return_value=mock_client):
            with patch("services.ai.RETRY_DELAY", 0):
                result = await ai_review(
                    diff="+ x = 1",
                    title="test PR",
                    author="test-author",
                )
        assert result["quality_score"] == 70
        assert "unavailable" in result["summary"].lower()

    async def test_all_personas_have_system_prompt(self):
        for persona in ReviewPersona:
            assert persona in PERSONAS
            assert "system" in PERSONAS[persona]
            assert "score_weight" in PERSONAS[persona]
            assert len(PERSONAS[persona]["system"]) > 20
