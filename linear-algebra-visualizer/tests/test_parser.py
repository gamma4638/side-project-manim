import json
import os
import sys
from unittest.mock import MagicMock, patch

import pytest

# Mock google.genai if not installed locally
if 'google.genai' not in sys.modules:
    mock_google = MagicMock()
    sys.modules['google'] = mock_google
    sys.modules['google.genai'] = MagicMock()
    sys.modules['google.genai.types'] = MagicMock()


def make_mock_client(response_dict: dict):
    mock_response = MagicMock()
    mock_response.text = json.dumps(response_dict)
    mock_models = MagicMock()
    mock_models.generate_content.return_value = mock_response
    mock_client = MagicMock()
    mock_client.models = mock_models
    return mock_client


@pytest.fixture(autouse=True)
def set_fake_api_key(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "fake-key-for-tests")


def test_parse_returns_eigenvalue_topic():
    from backend.llm.parser import parse_request

    fake_response = {
        "topic_id": "eigenvalue",
        "params": {"matrix_2x2": [[2, 1], [1, 2]]},
        "explanation": "고유값과 고유벡터를 시각화합니다.",
        "confidence": 0.95,
    }

    with patch("backend.llm.parser.genai.Client", return_value=make_mock_client(fake_response)):
        result = parse_request("고유값 시각화해줘", [])

    assert result["topic_id"] == "eigenvalue"
    assert result["confidence"] == 0.95
    assert "matrix_2x2" in result["params"]


def test_parse_returns_unknown_for_unsupported():
    from backend.llm.parser import parse_request

    fake_response = {
        "topic_id": "unknown",
        "params": {},
        "explanation": "지원하지 않는 주제입니다.",
        "confidence": 0.2,
    }

    with patch("backend.llm.parser.genai.Client", return_value=make_mock_client(fake_response)):
        result = parse_request("오늘 날씨 알려줘", [])

    assert result["topic_id"] == "unknown"
    assert result["confidence"] < 0.6


def test_parse_strips_markdown_code_blocks():
    from backend.llm.parser import parse_request

    payload = {"topic_id": "fourier", "params": {"num_terms": 7}, "explanation": "푸리에", "confidence": 0.9}
    mock_response = MagicMock()
    mock_response.text = f"```json\n{json.dumps(payload)}\n```"
    mock_models = MagicMock()
    mock_models.generate_content.return_value = mock_response
    mock_client = MagicMock()
    mock_client.models = mock_models

    with patch("backend.llm.parser.genai.Client", return_value=mock_client):
        result = parse_request("푸리에 7개 항으로 보여줘", [])

    assert result["topic_id"] == "fourier"


def test_parse_missing_api_key_raises():
    from backend.llm.parser import parse_request

    with pytest.raises(ValueError, match="GOOGLE_API_KEY"):
        with patch.dict(os.environ, {}, clear=True):
            parse_request("test", [])
