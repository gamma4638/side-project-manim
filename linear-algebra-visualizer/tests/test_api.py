import os
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Mock google.generativeai before any imports that might need it
import sys
if 'google.generativeai' not in sys.modules:
    sys.modules['google'] = MagicMock()
    sys.modules['google.generativeai'] = MagicMock()

os.environ.setdefault("OUTPUT_DIR", "/tmp/mathviz_test_output")
os.environ.setdefault("GOOGLE_API_KEY", "fake-key")


@pytest.fixture
def client():
    from backend.main import app
    return TestClient(app)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_chat_unknown_topic_returns_guidance(client):
    fake_parsed = {
        "topic_id": "unknown",
        "params": {},
        "explanation": "모르겠어요",
        "confidence": 0.2,
    }
    with patch("backend.main.parse_request", return_value=fake_parsed):
        r = client.post("/api/chat", json={"message": "오늘 주식", "history": []})

    assert r.status_code == 200
    data = r.json()
    assert data["video_url"] is None
    assert data["topic_id"] is None
    assert "지원하지 않는 주제" in data["explanation"]


def test_chat_known_topic_no_video_on_render_failure(client):
    fake_parsed = {
        "topic_id": "eigenvalue",
        "params": {"matrix_2x2": [[2, 1], [1, 2]]},
        "explanation": "고유값을 시각화합니다.",
        "confidence": 0.95,
    }
    with patch("backend.main.parse_request", return_value=fake_parsed), \
         patch("backend.main.render_scene", new=AsyncMock(return_value=None)):
        r = client.post("/api/chat", json={"message": "고유값 보여줘", "history": []})

    assert r.status_code == 200
    data = r.json()
    assert data["topic_id"] == "eigenvalue"
    assert data["explanation"] == "고유값을 시각화합니다."
    assert data["video_url"] is None


def test_chat_known_topic_returns_video_url(client, tmp_path):
    fake_video = tmp_path / "eigenvalue_abc.mp4"
    fake_video.write_bytes(b"fake")

    fake_parsed = {
        "topic_id": "fourier",
        "params": {"num_terms": 5},
        "explanation": "푸리에 급수를 시각화합니다.",
        "confidence": 0.9,
    }
    with patch("backend.main.parse_request", return_value=fake_parsed), \
         patch("backend.main.render_scene", new=AsyncMock(return_value=fake_video)), \
         patch("backend.main.OUTPUT_DIR", tmp_path):
        r = client.post("/api/chat", json={"message": "푸리에 보여줘", "history": []})

    assert r.status_code == 200
    data = r.json()
    assert data["video_url"] is not None
    assert "eigenvalue_abc.mp4" in data["video_url"]


def test_chat_gemini_error_returns_graceful_message(client):
    with patch("backend.main.parse_request", side_effect=Exception("API error")):
        r = client.post("/api/chat", json={"message": "test", "history": []})

    assert r.status_code == 200
    assert "오류" in r.json()["explanation"]
