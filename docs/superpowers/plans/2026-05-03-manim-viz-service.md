# Manim Math/Engineering Visualization Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing linear algebra visualizer into a chat-based math/engineering visualization service — natural language in, ManimCE video out.

**Architecture:** Vanilla JS chat UI + FastAPI backend in a single Docker container. Gemini 2.0 Flash parses user input into topic_id + params. Manim subprocess renders MP4s stored in `/app/output/`. FastAPI serves both the API and static frontend. Deployed on Railway.

**Tech Stack:** Python 3.11, FastAPI, ManimCE 0.18.1, google-generativeai, Vanilla JS/CSS/HTML, Docker, Railway.

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Delete | `frontend-interactive/` | Replaced by Vanilla JS frontend |
| Modify | `docker/docker-compose.yml` | Remove Node service, add env_file |
| Modify | `docker/Dockerfile` | Add frontend COPY, production CMD |
| Create | `Dockerfile` (project root) | Railway-compatible alias |
| Modify | `backend/requirements.txt` | Add google-generativeai, dotenv, pytest |
| Create | `backend/scene_registry.py` | topic_id → SceneConfig mapping |
| Create | `backend/llm/__init__.py` | Package marker |
| Create | `backend/llm/parser.py` | Gemini API: parse natural language → topic+params |
| Modify | `backend/main.py` | Replace with /api/chat endpoint |
| Modify | `backend/scenes/eigenvalue.py` | Switch MATRIX_VALUES → SCENE_PARAMS |
| Create | `backend/scenes/linear_transform.py` | Linear transformation scene |
| Create | `backend/scenes/determinant.py` | Determinant as area scene |
| Create | `backend/scenes/basis_change.py` | Basis change scene |
| Create | `backend/scenes/taylor_series.py` | Taylor series approximation scene |
| Create | `backend/scenes/fourier.py` | Fourier series square wave scene |
| Create | `backend/scenes/derivative.py` | Derivative as tangent line scene |
| Create | `backend/scenes/clt.py` | Central Limit Theorem scene |
| Create | `backend/scenes/standard_error.py` | Standard error vs n scene |
| Create | `backend/scenes/mle.py` | MLE likelihood surface scene |
| Create | `backend/scenes/hypothesis_test.py` | p-value / hypothesis testing scene |
| Create | `frontend/index.html` | Chat UI HTML |
| Create | `frontend/style.css` | Dark theme CSS |
| Create | `frontend/app.js` | Chat logic JS |
| Create | `railway.json` | Railway deployment config |
| Create | `.env.example` | Env var template |
| Create | `tests/conftest.py` | pytest sys.path setup |
| Create | `tests/test_registry.py` | Registry unit tests |
| Create | `tests/test_parser.py` | Parser unit tests (mocked Gemini) |
| Create | `tests/test_api.py` | API integration tests (mocked deps) |
| Create | `pytest.ini` | Test runner config |

All paths are relative to `linear-algebra-visualizer/`.

---

### Task 1: Cleanup & Project Restructure

**Files:**
- Delete: `linear-algebra-visualizer/frontend-interactive/` (entire directory)
- Create: `linear-algebra-visualizer/frontend/` (empty, populated in Task 11)
- Create: `linear-algebra-visualizer/tests/`
- Create: `linear-algebra-visualizer/.env.example`
- Create: `linear-algebra-visualizer/pytest.ini`
- Create: `linear-algebra-visualizer/tests/conftest.py`

- [ ] **Step 1: Remove the old React frontend**

```bash
cd linear-algebra-visualizer
rm -rf frontend-interactive
mkdir -p frontend tests
```

Expected: `frontend-interactive/` gone, `frontend/` and `tests/` created.

- [ ] **Step 2: Create `.env.example`**

Create `linear-algebra-visualizer/.env.example`:

```
GOOGLE_API_KEY=your_google_api_key_here
```

- [ ] **Step 3: Create `pytest.ini`**

Create `linear-algebra-visualizer/pytest.ini`:

```ini
[pytest]
pythonpath = .
testpaths = tests
asyncio_mode = auto
```

- [ ] **Step 4: Create `tests/conftest.py`**

Create `linear-algebra-visualizer/tests/conftest.py`:

```python
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old React frontend, scaffold new structure"
```

---

### Task 2: Docker & Requirements Update

**Files:**
- Modify: `linear-algebra-visualizer/backend/requirements.txt`
- Modify: `linear-algebra-visualizer/docker/Dockerfile`
- Modify: `linear-algebra-visualizer/docker/docker-compose.yml`
- Create: `linear-algebra-visualizer/Dockerfile` (Railway root alias)

- [ ] **Step 1: Update `backend/requirements.txt`**

```
manim==0.18.1
fastapi==0.109.2
uvicorn[standard]==0.27.1
python-multipart==0.0.9
numpy==1.26.4
pydantic==2.6.1
google-generativeai>=0.5.0
python-dotenv>=1.0.0
httpx>=0.24.0
pytest>=7.4.0
pytest-asyncio>=0.21.0
```

- [ ] **Step 2: Update `docker/Dockerfile`**

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    texlive \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-latex-recommended \
    texlive-science \
    tipa \
    libffi-dev \
    git \
    pkg-config \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY frontend/ ./frontend/

RUN mkdir -p /app/output

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 3: Update `docker/docker-compose.yml`**

```yaml
version: '3.8'

services:
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ../output:/app/output
    env_file:
      - ../.env
    environment:
      - PYTHONUNBUFFERED=1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

- [ ] **Step 4: Create root `Dockerfile` for Railway**

Create `linear-algebra-visualizer/Dockerfile`:

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    texlive \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-latex-recommended \
    texlive-science \
    tipa \
    libffi-dev \
    git \
    pkg-config \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY frontend/ ./frontend/

RUN mkdir -p /app/output

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "${PORT:-8000}"]
```

- [ ] **Step 5: Commit**

```bash
git add backend/requirements.txt docker/Dockerfile docker/docker-compose.yml Dockerfile
git commit -m "chore: update Docker setup for single-container deployment"
```

---

### Task 3: Scene Registry

**Files:**
- Create: `linear-algebra-visualizer/backend/scene_registry.py`
- Create: `linear-algebra-visualizer/tests/test_registry.py`

- [ ] **Step 1: Write the failing test first**

Create `linear-algebra-visualizer/tests/test_registry.py`:

```python
from backend.scene_registry import SCENE_REGISTRY, SceneConfig

REQUIRED_TOPICS = {
    "eigenvalue", "linear_transform", "determinant", "basis_change",
    "taylor_series", "fourier", "derivative",
    "clt", "mle", "hypothesis_test", "standard_error",
}


def test_all_required_topics_present():
    assert REQUIRED_TOPICS == set(SCENE_REGISTRY.keys())


def test_each_config_has_required_fields():
    for topic_id, config in SCENE_REGISTRY.items():
        assert isinstance(config, SceneConfig), f"{topic_id} must be a SceneConfig"
        assert config.module, f"{topic_id} missing module"
        assert config.class_name, f"{topic_id} missing class_name"
        assert isinstance(config.defaults, dict), f"{topic_id} defaults must be a dict"


def test_matrix_topics_have_matrix_default():
    matrix_topics = ["eigenvalue", "linear_transform", "determinant", "basis_change"]
    for topic in matrix_topics:
        defaults = SCENE_REGISTRY[topic].defaults
        assert "matrix_2x2" in defaults, f"{topic} must have matrix_2x2 default"
        m = defaults["matrix_2x2"]
        assert len(m) == 2 and len(m[0]) == 2, f"{topic} matrix_2x2 must be 2x2"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd linear-algebra-visualizer
python -m pytest tests/test_registry.py -v
```

Expected: `ModuleNotFoundError: No module named 'backend.scene_registry'`

- [ ] **Step 3: Create `backend/scene_registry.py`**

```python
from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class SceneConfig:
    module: str
    class_name: str
    defaults: Dict[str, Any] = field(default_factory=dict)


SCENE_REGISTRY: Dict[str, SceneConfig] = {
    "eigenvalue": SceneConfig(
        module="backend.scenes.eigenvalue",
        class_name="EigenvalueScene",
        defaults={"matrix_2x2": [[2, 1], [1, 2]]},
    ),
    "linear_transform": SceneConfig(
        module="backend.scenes.linear_transform",
        class_name="LinearTransformScene",
        defaults={"matrix_2x2": [[2, 0], [0, 2]]},
    ),
    "determinant": SceneConfig(
        module="backend.scenes.determinant",
        class_name="DeterminantScene",
        defaults={"matrix_2x2": [[2, 1], [0, 2]]},
    ),
    "basis_change": SceneConfig(
        module="backend.scenes.basis_change",
        class_name="BasisChangeScene",
        defaults={"matrix_2x2": [[1, 1], [0, 1]]},
    ),
    "taylor_series": SceneConfig(
        module="backend.scenes.taylor_series",
        class_name="TaylorSeriesScene",
        defaults={"function": "sin", "center": 0, "degree": 5},
    ),
    "fourier": SceneConfig(
        module="backend.scenes.fourier",
        class_name="FourierScene",
        defaults={"num_terms": 5},
    ),
    "derivative": SceneConfig(
        module="backend.scenes.derivative",
        class_name="DerivativeScene",
        defaults={"function": "x^2"},
    ),
    "clt": SceneConfig(
        module="backend.scenes.clt",
        class_name="CLTScene",
        defaults={"sample_size": 30, "dist_type": "uniform"},
    ),
    "mle": SceneConfig(
        module="backend.scenes.mle",
        class_name="MLEScene",
        defaults={"dist_type": "normal"},
    ),
    "hypothesis_test": SceneConfig(
        module="backend.scenes.hypothesis_test",
        class_name="HypothesisTestScene",
        defaults={"alpha": 0.05, "test_type": "two-tailed"},
    ),
    "standard_error": SceneConfig(
        module="backend.scenes.standard_error",
        class_name="StandardErrorScene",
        defaults={"sample_size": 30},
    ),
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
python -m pytest tests/test_registry.py -v
```

Expected: 3 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add backend/scene_registry.py tests/test_registry.py pytest.ini tests/conftest.py
git commit -m "feat: add scene registry with 11 topics"
```

---

### Task 4: LLM Parser (Gemini)

**Files:**
- Create: `linear-algebra-visualizer/backend/llm/__init__.py`
- Create: `linear-algebra-visualizer/backend/llm/parser.py`
- Create: `linear-algebra-visualizer/tests/test_parser.py`

- [ ] **Step 1: Write the failing test**

Create `linear-algebra-visualizer/tests/test_parser.py`:

```python
import json
import os
from unittest.mock import MagicMock, patch

import pytest


def make_mock_gemini(response_dict: dict):
    mock_response = MagicMock()
    mock_response.text = json.dumps(response_dict)
    mock_chat = MagicMock()
    mock_chat.send_message.return_value = mock_response
    mock_model = MagicMock()
    mock_model.start_chat.return_value = mock_chat
    return mock_model


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

    with patch("backend.llm.parser.genai.GenerativeModel", return_value=make_mock_gemini(fake_response)):
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

    with patch("backend.llm.parser.genai.GenerativeModel", return_value=make_mock_gemini(fake_response)):
        result = parse_request("오늘 날씨 알려줘", [])

    assert result["topic_id"] == "unknown"
    assert result["confidence"] < 0.6


def test_parse_strips_markdown_code_blocks():
    from backend.llm.parser import parse_request

    payload = {"topic_id": "fourier", "params": {"num_terms": 7}, "explanation": "푸리에", "confidence": 0.9}
    mock_response = MagicMock()
    mock_response.text = f"```json\n{json.dumps(payload)}\n```"
    mock_chat = MagicMock()
    mock_chat.send_message.return_value = mock_response
    mock_model = MagicMock()
    mock_model.start_chat.return_value = mock_chat

    with patch("backend.llm.parser.genai.GenerativeModel", return_value=mock_model):
        result = parse_request("푸리에 7개 항으로 보여줘", [])

    assert result["topic_id"] == "fourier"


def test_parse_missing_api_key_raises():
    from backend.llm.parser import parse_request
    import os

    with pytest.raises(ValueError, match="GOOGLE_API_KEY"):
        with patch.dict(os.environ, {}, clear=True):
            parse_request("test", [])
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python -m pytest tests/test_parser.py -v
```

Expected: `ModuleNotFoundError: No module named 'backend.llm'`

- [ ] **Step 3: Create `backend/llm/__init__.py`**

```python
```
(empty file)

- [ ] **Step 4: Create `backend/llm/parser.py`**

```python
import json
import os
from typing import Any, Dict, List

import google.generativeai as genai

SUPPORTED_TOPICS = [
    "eigenvalue", "linear_transform", "determinant", "basis_change",
    "taylor_series", "fourier", "derivative",
    "clt", "mle", "hypothesis_test", "standard_error",
]

SYSTEM_PROMPT = f"""You are a math visualization assistant. Classify the user's request into one of the supported topics and extract parameters.

Supported topics: {', '.join(SUPPORTED_TOPICS)}

Parameter schemas:
- eigenvalue, linear_transform, determinant, basis_change: matrix_2x2 ([[a,b],[c,d]] as list of 2 lists of 2 numbers)
- taylor_series: function (one of: sin, cos, exp, x^2), center (float), degree (int 1-7)
- fourier: num_terms (int 1-10)
- derivative: function (one of: sin, cos, x^2, x^3)
- clt: sample_size (int 5-100), dist_type (one of: uniform, exponential)
- mle: dist_type (one of: normal)
- hypothesis_test: alpha (float e.g. 0.05), test_type (one of: two-tailed, one-tailed)
- standard_error: sample_size (int 10-100)

Rules:
- If the request clearly matches a topic, set confidence >= 0.7
- If unsure or no match, set topic_id to "unknown" and confidence < 0.6
- explanation must be in Korean, 2-3 sentences describing what will be visualized
- Return ONLY valid JSON, no markdown fences, no extra text

JSON schema:
{{
  "topic_id": "<topic or unknown>",
  "params": {{}},
  "explanation": "<Korean explanation>",
  "confidence": <0.0 to 1.0>
}}"""


def _strip_markdown(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        text = "\n".join(lines).strip()
    return text


def parse_request(message: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=SYSTEM_PROMPT,
    )

    chat_history = []
    for h in history[-6:]:
        role = "user" if h.get("role") == "user" else "model"
        chat_history.append({"role": role, "parts": [h.get("content", "")]})

    chat = model.start_chat(history=chat_history)
    response = chat.send_message(message)
    text = _strip_markdown(response.text)
    return json.loads(text)
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
python -m pytest tests/test_parser.py -v
```

Expected: 4 tests PASSED.

- [ ] **Step 6: Commit**

```bash
git add backend/llm/ tests/test_parser.py
git commit -m "feat: add Gemini LLM parser for topic classification"
```

---

### Task 5: FastAPI `/api/chat` Endpoint

**Files:**
- Modify: `linear-algebra-visualizer/backend/main.py`
- Create: `linear-algebra-visualizer/tests/test_api.py`

- [ ] **Step 1: Write the failing tests**

Create `linear-algebra-visualizer/tests/test_api.py`:

```python
import os
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python -m pytest tests/test_api.py -v
```

Expected: failures due to missing endpoint / old main.py structure.

- [ ] **Step 3: Rewrite `backend/main.py`**

```python
import asyncio
import json
import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

from backend.llm.parser import parse_request
from backend.scene_registry import SCENE_REGISTRY

app = FastAPI(title="MathViz API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", "/app/output"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FRONTEND_DIR = Path(os.environ.get("FRONTEND_DIR", "/app/frontend"))

app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

SUPPORTED_TOPICS_LIST = "\n".join(f"- {k}" for k in SCENE_REGISTRY.keys())


class HistoryItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[HistoryItem] = []


class ChatResponse(BaseModel):
    explanation: str
    video_url: Optional[str] = None
    topic_id: Optional[str] = None


async def render_scene(topic_id: str, params: Dict[str, Any]) -> Optional[Path]:
    config = SCENE_REGISTRY[topic_id]
    merged = {**config.defaults, **params}
    render_id = str(uuid.uuid4())[:8]
    output_name = f"{topic_id}_{render_id}"
    module_path = config.module.replace(".", "/")
    scene_file = f"/app/{module_path}.py"

    env = os.environ.copy()
    env["SCENE_PARAMS"] = json.dumps(merged)

    cmd = [
        "manim", "-qm",
        scene_file,
        config.class_name,
        "-o", output_name,
        "--media_dir", str(OUTPUT_DIR),
    ]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd="/app",
        )
        await asyncio.wait_for(proc.communicate(), timeout=120)
        if proc.returncode != 0:
            return None
    except (asyncio.TimeoutError, Exception):
        return None

    for path in OUTPUT_DIR.rglob(f"{output_name}.mp4"):
        return path
    return None


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    history = [{"role": h.role, "content": h.content} for h in request.history]

    try:
        parsed = await asyncio.get_event_loop().run_in_executor(
            None, parse_request, request.message, history
        )
    except Exception:
        return ChatResponse(
            explanation="서비스 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
        )

    topic_id = parsed.get("topic_id", "unknown")
    confidence = float(parsed.get("confidence", 0))

    if topic_id == "unknown" or confidence < 0.6 or topic_id not in SCENE_REGISTRY:
        return ChatResponse(
            explanation=f"지원하지 않는 주제예요. 아래 주제들을 시도해보세요:\n{SUPPORTED_TOPICS_LIST}",
        )

    video_path = await render_scene(topic_id, parsed.get("params", {}))

    video_url = None
    if video_path and video_path.exists():
        try:
            rel = video_path.relative_to(OUTPUT_DIR)
            video_url = f"/output/{rel}"
        except ValueError:
            video_url = f"/output/{video_path.name}"

    return ChatResponse(
        explanation=parsed.get("explanation", ""),
        video_url=video_url,
        topic_id=topic_id,
    )


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "mathviz"}


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
python -m pytest tests/test_api.py -v
```

Expected: 5 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add backend/main.py tests/test_api.py
git commit -m "feat: add /api/chat endpoint with Gemini routing and Manim rendering"
```

---

### Task 6: Update `eigenvalue.py` to Use `SCENE_PARAMS`

**Files:**
- Modify: `linear-algebra-visualizer/backend/scenes/eigenvalue.py` (lines 41-43)

- [ ] **Step 1: Write a smoke-import test**

Add to `tests/test_registry.py`:

```python
def test_eigenvalue_scene_importable():
    from backend.scenes.eigenvalue import EigenvalueScene
    assert EigenvalueScene is not None
```

- [ ] **Step 2: Run test — should already pass**

```bash
python -m pytest tests/test_registry.py::test_eigenvalue_scene_importable -v
```

Expected: PASSED (module already exists).

- [ ] **Step 3: Update the env var read in `eigenvalue.py`**

In `backend/scenes/eigenvalue.py`, replace lines 41–43:

Old:
```python
matrix_str = os.environ.get("MATRIX_VALUES", "2,1,1,2")
values = [float(x) for x in matrix_str.split(",")]
matrix = np.array([[values[0], values[1]], [values[2], values[3]]])
```

New:
```python
import json
params = json.loads(os.environ.get("SCENE_PARAMS", '{"matrix_2x2": [[2, 1], [1, 2]]}'))
m = params["matrix_2x2"]
matrix = np.array([[m[0][0], m[0][1]], [m[1][0], m[1][1]]])
```

- [ ] **Step 4: Run import test again**

```bash
python -m pytest tests/test_registry.py -v
```

Expected: all PASSED.

- [ ] **Step 5: Commit**

```bash
git add backend/scenes/eigenvalue.py
git commit -m "fix: update eigenvalue scene to read SCENE_PARAMS JSON"
```

---

### Task 7: Linear Algebra Scenes (linear_transform, determinant, basis_change)

**Files:**
- Create: `linear-algebra-visualizer/backend/scenes/linear_transform.py`
- Create: `linear-algebra-visualizer/backend/scenes/determinant.py`
- Create: `linear-algebra-visualizer/backend/scenes/basis_change.py`

Add to `tests/test_registry.py` before running:

```python
def test_linear_algebra_scenes_importable():
    from backend.scenes.linear_transform import LinearTransformScene
    from backend.scenes.determinant import DeterminantScene
    from backend.scenes.basis_change import BasisChangeScene
    assert LinearTransformScene and DeterminantScene and BasisChangeScene
```

- [ ] **Step 1: Run the new import test — verify it fails**

```bash
python -m pytest tests/test_registry.py::test_linear_algebra_scenes_importable -v
```

Expected: `ModuleNotFoundError`

- [ ] **Step 2: Create `backend/scenes/linear_transform.py`**

```python
import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
I_COLOR = "#83c167"
J_COLOR = "#fc6255"
TEXT = "#ece6e2"
GRID = "#4a5568"


class LinearTransformScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"matrix_2x2": [[2, 0], [0, 2]]}'))
        m = params["matrix_2x2"]
        matrix = np.array([[m[0][0], m[0][1]], [m[1][0], m[1][1]]])

        plane = NumberPlane(
            x_range=[-6, 6, 1], y_range=[-6, 6, 1],
            background_line_style={"stroke_color": GRID, "stroke_width": 1, "stroke_opacity": 0.4},
        )
        i_hat = Arrow(ORIGIN, RIGHT, buff=0, color=I_COLOR, stroke_width=6)
        j_hat = Arrow(ORIGIN, UP, buff=0, color=J_COLOR, stroke_width=6)
        i_label = MathTex(r"\hat{\imath}", color=I_COLOR, font_size=32).next_to(RIGHT, DR, buff=0.1)
        j_label = MathTex(r"\hat{\jmath}", color=J_COLOR, font_size=32).next_to(UP, UL, buff=0.1)

        title = Text("Linear Transformation", color=TEXT, font_size=34).to_edge(UP)
        mat_tex = MathTex(
            r"M = \begin{bmatrix}" + f"{matrix[0,0]} & {matrix[0,1]}\\\\ {matrix[1,0]} & {matrix[1,1]}" + r"\end{bmatrix}",
            color=TEXT, font_size=30,
        ).to_corner(UL, buff=0.5)
        bg = BackgroundRectangle(mat_tex, fill_opacity=0.8, buff=0.2)

        self.play(Create(plane), FadeIn(title))
        self.play(GrowArrow(i_hat), GrowArrow(j_hat), Write(i_label), Write(j_label))
        self.play(FadeIn(bg), Write(mat_tex))
        self.wait(0.5)

        self.play(
            ApplyMatrix(matrix, plane),
            ApplyMatrix(matrix, i_hat),
            ApplyMatrix(matrix, j_hat),
            run_time=2,
        )
        self.wait(2)
```

- [ ] **Step 3: Create `backend/scenes/determinant.py`**

```python
import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
GRID = "#4a5568"
FILL = "#ffff00"


class DeterminantScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"matrix_2x2": [[2, 1], [0, 2]]}'))
        m = params["matrix_2x2"]
        matrix = np.array([[m[0][0], m[0][1]], [m[1][0], m[1][1]]])
        det = float(np.linalg.det(matrix))

        plane = NumberPlane(
            x_range=[-5, 5, 1], y_range=[-5, 5, 1],
            background_line_style={"stroke_color": GRID, "stroke_width": 1, "stroke_opacity": 0.4},
        )

        unit_sq = Polygon(
            plane.c2p(0, 0), plane.c2p(1, 0), plane.c2p(1, 1), plane.c2p(0, 1),
            color=FILL, fill_opacity=0.35, stroke_width=2,
        )
        area_label = MathTex(r"\text{Area} = 1", color=TEXT, font_size=28).to_corner(UR, buff=0.5)
        title = Text("Determinant = Area Scale Factor", color=TEXT, font_size=30).to_edge(UP)
        mat_tex = MathTex(
            r"M = \begin{bmatrix}" + f"{matrix[0,0]} & {matrix[0,1]}\\\\ {matrix[1,0]} & {matrix[1,1]}" + r"\end{bmatrix}",
            color=TEXT, font_size=28,
        ).to_corner(UL, buff=0.5)
        bg = BackgroundRectangle(mat_tex, fill_opacity=0.8, buff=0.2)

        self.play(Create(plane), FadeIn(title))
        self.play(Create(unit_sq), Write(area_label))
        self.play(FadeIn(bg), Write(mat_tex))
        self.wait(0.5)

        transformed_sq = Polygon(
            plane.c2p(0, 0),
            plane.c2p(matrix[0, 0], matrix[1, 0]),
            plane.c2p(matrix[0, 0] + matrix[0, 1], matrix[1, 0] + matrix[1, 1]),
            plane.c2p(matrix[0, 1], matrix[1, 1]),
            color=FILL, fill_opacity=0.35, stroke_width=2,
        )
        new_area = MathTex(rf"\text{{Area}} = |\det M| = {abs(det):.2f}", color=TEXT, font_size=28).to_corner(UR, buff=0.5)

        self.play(
            ApplyMatrix(matrix, plane),
            Transform(unit_sq, transformed_sq),
            Transform(area_label, new_area),
            run_time=2,
        )
        self.wait(2)
```

- [ ] **Step 4: Create `backend/scenes/basis_change.py`**

```python
import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
GRID = "#4a5568"
STD_COLOR = "#83c167"
NEW_COLOR = "#fc6255"


class BasisChangeScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"matrix_2x2": [[1, 1], [0, 1]]}'))
        m = params["matrix_2x2"]
        matrix = np.array([[m[0][0], m[0][1]], [m[1][0], m[1][1]]])

        plane = NumberPlane(
            x_range=[-5, 5, 1], y_range=[-5, 5, 1],
            background_line_style={"stroke_color": GRID, "stroke_width": 1, "stroke_opacity": 0.4},
        )

        e1 = Arrow(ORIGIN, RIGHT, buff=0, color=STD_COLOR, stroke_width=6)
        e2 = Arrow(ORIGIN, UP, buff=0, color=STD_COLOR, stroke_width=6)
        e1_lbl = MathTex(r"\mathbf{e}_1", color=STD_COLOR, font_size=30).next_to(e1.get_end(), DR, buff=0.1)
        e2_lbl = MathTex(r"\mathbf{e}_2", color=STD_COLOR, font_size=30).next_to(e2.get_end(), UL, buff=0.1)

        b1 = Arrow(ORIGIN, plane.c2p(matrix[0, 0], matrix[1, 0]), buff=0, color=NEW_COLOR, stroke_width=6)
        b2 = Arrow(ORIGIN, plane.c2p(matrix[0, 1], matrix[1, 1]), buff=0, color=NEW_COLOR, stroke_width=6)
        b1_lbl = MathTex(r"\mathbf{b}_1", color=NEW_COLOR, font_size=30).next_to(b1.get_end(), DR, buff=0.1)
        b2_lbl = MathTex(r"\mathbf{b}_2", color=NEW_COLOR, font_size=30).next_to(b2.get_end(), UL, buff=0.1)

        title = Text("Change of Basis", color=TEXT, font_size=36).to_edge(UP)
        new_basis_label = Text("New basis vectors:", color=TEXT, font_size=26).to_corner(UL, buff=0.5)

        self.play(Create(plane), FadeIn(title))
        self.play(GrowArrow(e1), GrowArrow(e2), Write(e1_lbl), Write(e2_lbl))
        self.wait(0.5)
        self.play(FadeIn(new_basis_label), GrowArrow(b1), GrowArrow(b2), Write(b1_lbl), Write(b2_lbl))
        self.wait(1)

        self.play(
            ApplyMatrix(matrix, plane),
            ApplyMatrix(matrix, e1),
            ApplyMatrix(matrix, e2),
            run_time=2,
        )
        self.wait(2)
```

- [ ] **Step 5: Run the import test**

```bash
python -m pytest tests/test_registry.py::test_linear_algebra_scenes_importable -v
```

Expected: PASSED.

- [ ] **Step 6: Commit**

```bash
git add backend/scenes/linear_transform.py backend/scenes/determinant.py backend/scenes/basis_change.py
git commit -m "feat: add linear algebra scenes (linear_transform, determinant, basis_change)"
```

---

### Task 8: Calculus Scenes (taylor_series, fourier, derivative)

**Files:**
- Create: `linear-algebra-visualizer/backend/scenes/taylor_series.py`
- Create: `linear-algebra-visualizer/backend/scenes/fourier.py`
- Create: `linear-algebra-visualizer/backend/scenes/derivative.py`

Add to `tests/test_registry.py`:

```python
def test_calculus_scenes_importable():
    from backend.scenes.taylor_series import TaylorSeriesScene
    from backend.scenes.fourier import FourierScene
    from backend.scenes.derivative import DerivativeScene
    assert TaylorSeriesScene and FourierScene and DerivativeScene
```

- [ ] **Step 1: Run new import test — verify it fails**

```bash
python -m pytest tests/test_registry.py::test_calculus_scenes_importable -v
```

Expected: `ModuleNotFoundError`

- [ ] **Step 2: Create `backend/scenes/taylor_series.py`**

```python
import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
FUNC_COLOR = "#58c4dd"
APPROX_COLORS = ["#ffff00", "#fc6255", "#83c167", "#9a72ac", "#5cd0b3", "#ff8c00", "#ff69b4"]

FUNCTIONS = {
    "sin":  (np.sin,            r"\sin(x)",  [-3.5, 3.5]),
    "cos":  (np.cos,            r"\cos(x)",  [-3.5, 3.5]),
    "exp":  (np.exp,            r"e^x",      [-2.0, 2.0]),
    "x^2":  (lambda x: x ** 2, r"x^2",      [-2.5, 2.5]),
}

TAYLOR_COEFFS = {
    "sin":  [0, 1, 0, -1/6, 0, 1/120, 0, -1/5040],
    "cos":  [1, 0, -0.5, 0, 1/24, 0, -1/720],
    "exp":  [1, 1, 0.5, 1/6, 1/24, 1/120, 1/720],
    "x^2":  [0, 0, 1],
}


class TaylorSeriesScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"function": "sin", "center": 0, "degree": 5}'))

        func_name = params.get("function", "sin")
        if func_name not in FUNCTIONS:
            func_name = "sin"
        center = float(params.get("center", 0))
        max_degree = min(int(params.get("degree", 5)), 7)

        func, func_label, x_range = FUNCTIONS[func_name]
        coeffs = TAYLOR_COEFFS[func_name]

        axes = Axes(
            x_range=[x_range[0] - 0.3, x_range[1] + 0.3, 1],
            y_range=[-2.5, 2.5, 1],
            x_length=10, y_length=6,
            axis_config={"color": WHITE, "stroke_width": 2},
        )

        true_graph = axes.plot(func, x_range=x_range, color=FUNC_COLOR, stroke_width=3)
        func_tex = MathTex(f"f(x) = {func_label}", color=FUNC_COLOR, font_size=30).to_corner(UL, buff=0.5)
        title = Text("Taylor Series", color=TEXT, font_size=36).to_edge(UP)

        self.play(Create(axes), FadeIn(title))
        self.play(Create(true_graph), Write(func_tex))
        self.wait(0.5)

        prev_approx = None
        prev_label = None
        for n in range(1, max_degree + 1):
            c = coeffs[: n + 1] if n + 1 <= len(coeffs) else coeffs

            def make_poly(c_=c, center_=center):
                return lambda x: sum(ci * (x - center_) ** i for i, ci in enumerate(c_))

            color = APPROX_COLORS[(n - 1) % len(APPROX_COLORS)]
            approx = axes.plot(make_poly(), x_range=x_range, color=color, stroke_width=2)
            degree_label = MathTex(f"n = {n}", color=color, font_size=28).to_corner(UR, buff=0.5)

            if prev_approx is None:
                self.play(Create(approx), Write(degree_label))
            else:
                self.play(Transform(prev_approx, approx), Transform(prev_label, degree_label))

            prev_approx = approx
            prev_label = degree_label
            self.wait(0.6)

        self.wait(1.5)
```

- [ ] **Step 3: Create `backend/scenes/fourier.py`**

```python
import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
SQUARE_COLOR = "#58c4dd"
APPROX_COLOR = "#ffff00"


class FourierScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"num_terms": 5}'))
        num_terms = max(1, min(int(params.get("num_terms", 5)), 10))

        axes = Axes(
            x_range=[-np.pi - 0.3, np.pi + 0.3, 1],
            y_range=[-1.8, 1.8, 1],
            x_length=10, y_length=5.5,
            axis_config={"color": WHITE, "stroke_width": 2},
        )

        def square_wave(x):
            return 1.0 if np.sin(x) >= 0 else -1.0

        def fourier_approx(x, n):
            return sum((4 / (np.pi * k)) * np.sin(k * x) for k in range(1, 2 * n, 2))

        title = Text("Fourier Series", color=TEXT, font_size=36).to_edge(UP)
        square = axes.plot(square_wave, x_range=[-np.pi, np.pi, 0.005], color=SQUARE_COLOR, stroke_width=2, use_smoothing=False)
        sq_label = MathTex(r"\text{Square wave}", color=SQUARE_COLOR, font_size=28).to_corner(UL, buff=0.5)

        self.play(Create(axes), FadeIn(title))
        self.play(Create(square), Write(sq_label))
        self.wait(0.5)

        prev_approx = None
        prev_label = None
        for n in range(1, num_terms + 1):
            approx = axes.plot(
                lambda x, n=n: fourier_approx(x, n),
                x_range=[-np.pi, np.pi, 0.005],
                color=APPROX_COLOR, stroke_width=2, use_smoothing=False,
            )
            terms_label = MathTex(f"n = {n}", color=APPROX_COLOR, font_size=28).to_corner(UR, buff=0.5)

            if prev_approx is None:
                self.play(Create(approx), Write(terms_label))
            else:
                self.play(Transform(prev_approx, approx), Transform(prev_label, terms_label))

            prev_approx = approx
            prev_label = terms_label
            self.wait(0.8)

        self.wait(1.5)
```

- [ ] **Step 4: Create `backend/scenes/derivative.py`**

```python
import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
FUNC_COLOR = "#58c4dd"
TANGENT_COLOR = "#fc6255"
POINT_COLOR = "#ffff00"

FUNCTIONS = {
    "sin":  (np.sin,             r"\sin(x)", np.cos,                [-3.0, 3.0]),
    "cos":  (np.cos,             r"\cos(x)", lambda x: -np.sin(x),  [-3.0, 3.0]),
    "x^2":  (lambda x: x ** 2,  r"x^2",     lambda x: 2 * x,       [-2.5, 2.5]),
    "x^3":  (lambda x: x ** 3,  r"x^3",     lambda x: 3 * x ** 2,  [-1.8, 1.8]),
}


class DerivativeScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"function": "x^2"}'))
        func_name = params.get("function", "x^2")
        if func_name not in FUNCTIONS:
            func_name = "x^2"

        func, label, deriv, x_range = FUNCTIONS[func_name]

        axes = Axes(
            x_range=[x_range[0] - 0.3, x_range[1] + 0.3, 1],
            y_range=[-3.5, 3.5, 1],
            x_length=10, y_length=6,
            axis_config={"color": WHITE, "stroke_width": 2},
        )

        graph = axes.plot(func, x_range=x_range, color=FUNC_COLOR, stroke_width=3)
        func_tex = MathTex(f"f(x) = {label}", color=FUNC_COLOR, font_size=32).to_corner(UL, buff=0.5)
        title = Text("Derivative as Tangent Line", color=TEXT, font_size=32).to_edge(UP)

        self.play(Create(axes), FadeIn(title))
        self.play(Create(graph), Write(func_tex))

        x_tracker = ValueTracker(x_range[0] + 0.5)

        def get_tangent():
            x0 = x_tracker.get_value()
            y0 = func(x0)
            slope = deriv(x0)
            dx = 1.5 / max(np.sqrt(1 + slope ** 2), 0.01)
            return Line(
                axes.c2p(x0 - dx, y0 - slope * dx),
                axes.c2p(x0 + dx, y0 + slope * dx),
                color=TANGENT_COLOR, stroke_width=3,
            )

        dot = always_redraw(lambda: Dot(axes.c2p(x_tracker.get_value(), func(x_tracker.get_value())), color=POINT_COLOR, radius=0.08))
        tangent = always_redraw(get_tangent)
        slope_label = always_redraw(lambda: MathTex(
            rf"f'({x_tracker.get_value():.1f}) = {deriv(x_tracker.get_value()):.2f}",
            color=TANGENT_COLOR, font_size=28,
        ).to_corner(UR, buff=0.5))

        self.play(FadeIn(dot), Create(tangent), Write(slope_label))
        self.play(x_tracker.animate.set_value(x_range[1] - 0.5), run_time=4, rate_func=linear)
        self.wait(1)
```

- [ ] **Step 5: Run the import test**

```bash
python -m pytest tests/test_registry.py::test_calculus_scenes_importable -v
```

Expected: PASSED.

- [ ] **Step 6: Commit**

```bash
git add backend/scenes/taylor_series.py backend/scenes/fourier.py backend/scenes/derivative.py
git commit -m "feat: add calculus scenes (taylor_series, fourier, derivative)"
```

---

### Task 9: Statistics Scenes Part 1 (clt, standard_error)

**Files:**
- Create: `linear-algebra-visualizer/backend/scenes/clt.py`
- Create: `linear-algebra-visualizer/backend/scenes/standard_error.py`

Add to `tests/test_registry.py`:

```python
def test_stats_scenes_part1_importable():
    from backend.scenes.clt import CLTScene
    from backend.scenes.standard_error import StandardErrorScene
    assert CLTScene and StandardErrorScene
```

- [ ] **Step 1: Run new test — verify it fails**

```bash
python -m pytest tests/test_registry.py::test_stats_scenes_part1_importable -v
```

Expected: `ModuleNotFoundError`

- [ ] **Step 2: Create `backend/scenes/clt.py`**

```python
import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
HIST_COLOR = "#58c4dd"
NORMAL_COLOR = "#ffff00"


class CLTScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"sample_size": 30, "dist_type": "uniform"}'))
        n = max(5, min(int(params.get("sample_size", 30)), 100))
        dist_type = params.get("dist_type", "uniform")

        title = Text("Central Limit Theorem", color=TEXT, font_size=34).to_edge(UP)
        self.play(FadeIn(title))

        # Original distribution (left panel)
        axes1 = Axes(x_range=[-0.2, 1.5, 0.5], y_range=[0, 2.5, 0.5], x_length=4.5, y_length=3.2).shift(LEFT * 3.2 + DOWN * 0.3)

        if dist_type == "uniform":
            orig = axes1.plot(lambda x: 1.0 if 0 <= x <= 1 else 0, x_range=[0, 1, 0.001], color=HIST_COLOR, stroke_width=3, use_smoothing=False)
            orig_lbl = Text("Uniform[0,1]", color=TEXT, font_size=20).next_to(axes1, DOWN, buff=0.15)
            mu, sigma = 0.5, 1 / np.sqrt(12 * n)
            np.random.seed(42)
            samples = np.random.uniform(0, 1, (2000, n)).mean(axis=1)
        else:
            orig = axes1.plot(lambda x: np.exp(-x) if x >= 0 else 0, x_range=[0, 4, 0.01], color=HIST_COLOR, stroke_width=3)
            orig_lbl = Text("Exponential(1)", color=TEXT, font_size=20).next_to(axes1, DOWN, buff=0.15)
            mu, sigma = 1.0, 1 / np.sqrt(n)
            np.random.seed(42)
            samples = np.random.exponential(1, (2000, n)).mean(axis=1)

        self.play(Create(axes1), Create(orig), Write(orig_lbl))
        self.wait(0.5)

        # Sampling distribution (right panel)
        x_lo, x_hi = mu - 4 * sigma, mu + 4 * sigma
        axes2 = Axes(x_range=[x_lo, x_hi, sigma * 2], y_range=[0, 500, 100], x_length=4.5, y_length=3.2).shift(RIGHT * 2.8 + DOWN * 0.3)
        samp_lbl = Text(f"Sample means (n={n})", color=TEXT, font_size=20).next_to(axes2, DOWN, buff=0.15)

        hist_vals, bins = np.histogram(samples, bins=25, range=(x_lo, x_hi))
        bar_w = (bins[1] - bins[0]) * axes2.x_length / (x_hi - x_lo)
        bars = VGroup()
        for i, count in enumerate(hist_vals):
            h = count / 500 * axes2.y_length
            bar = Rectangle(width=bar_w, height=h, fill_color=HIST_COLOR, fill_opacity=0.65, stroke_width=0.5, stroke_color=WHITE)
            bar.move_to(axes2.c2p((bins[i] + bins[i + 1]) / 2, count / 2))
            bars.add(bar)

        normal_curve = axes2.plot(
            lambda x: 2000 * (bins[1] - bins[0]) / (sigma * np.sqrt(2 * np.pi)) * np.exp(-0.5 * ((x - mu) / sigma) ** 2),
            x_range=[x_lo, x_hi, sigma * 0.05],
            color=NORMAL_COLOR, stroke_width=3,
        )
        clt_text = Text("→ Normal!", color=NORMAL_COLOR, font_size=26).to_corner(DR, buff=0.5)

        self.play(Create(axes2), Write(samp_lbl))
        self.play(Create(bars))
        self.play(Create(normal_curve))
        self.play(FadeIn(clt_text))
        self.wait(2)
```

- [ ] **Step 3: Create `backend/scenes/standard_error.py`**

```python
import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
CURVE_COLOR = "#58c4dd"
DOT_COLOR = "#ffff00"


class StandardErrorScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"sample_size": 30}'))
        max_n = max(10, min(int(params.get("sample_size", 30)), 100))

        title = Text("Standard Error", color=TEXT, font_size=36).to_edge(UP)
        self.play(FadeIn(title))

        axes = Axes(
            x_range=[0, max_n + 5, max(max_n // 5, 1)],
            y_range=[0, 1.6, 0.4],
            x_length=10, y_length=5,
            axis_config={"color": WHITE, "stroke_width": 2},
        ).shift(DOWN * 0.3)
        x_lbl = axes.get_x_axis_label(MathTex("n"), edge=RIGHT, direction=RIGHT)
        y_lbl = axes.get_y_axis_label(MathTex(r"SE"), edge=UP, direction=UP)

        se_curve = axes.plot(
            lambda n: 1 / np.sqrt(n) if n > 0 else 1.5,
            x_range=[1, max_n + 4, 0.2],
            color=CURVE_COLOR, stroke_width=3,
        )
        formula = MathTex(r"SE = \frac{\sigma}{\sqrt{n}}", color=CURVE_COLOR, font_size=34).to_corner(UR, buff=0.5)

        self.play(Create(axes), Write(x_lbl), Write(y_lbl))
        self.play(Create(se_curve), Write(formula))

        x_tracker = ValueTracker(1.0)
        dot = always_redraw(lambda: Dot(
            axes.c2p(x_tracker.get_value(), 1 / np.sqrt(x_tracker.get_value())),
            color=DOT_COLOR, radius=0.1,
        ))
        n_label = always_redraw(lambda: MathTex(
            rf"n={int(x_tracker.get_value())},\; SE={1/np.sqrt(x_tracker.get_value()):.3f}",
            color=DOT_COLOR, font_size=26,
        ).to_corner(UL, buff=0.5))

        self.play(FadeIn(dot), Write(n_label))
        self.play(x_tracker.animate.set_value(float(max_n)), run_time=4, rate_func=linear)
        self.wait(2)
```

- [ ] **Step 4: Run the import test**

```bash
python -m pytest tests/test_registry.py::test_stats_scenes_part1_importable -v
```

Expected: PASSED.

- [ ] **Step 5: Commit**

```bash
git add backend/scenes/clt.py backend/scenes/standard_error.py
git commit -m "feat: add statistics scenes (clt, standard_error)"
```

---

### Task 10: Statistics Scenes Part 2 (mle, hypothesis_test)

**Files:**
- Create: `linear-algebra-visualizer/backend/scenes/mle.py`
- Create: `linear-algebra-visualizer/backend/scenes/hypothesis_test.py`

Add to `tests/test_registry.py`:

```python
def test_stats_scenes_part2_importable():
    from backend.scenes.mle import MLEScene
    from backend.scenes.hypothesis_test import HypothesisTestScene
    assert MLEScene and HypothesisTestScene
```

- [ ] **Step 1: Run new test — verify it fails**

```bash
python -m pytest tests/test_registry.py::test_stats_scenes_part2_importable -v
```

Expected: `ModuleNotFoundError`

- [ ] **Step 2: Create `backend/scenes/mle.py`**

```python
import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
DATA_COLOR = "#ffff00"
LIKE_COLOR = "#58c4dd"
MLE_COLOR = "#fc6255"


class MLEScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"dist_type": "normal"}'))

        title = Text("Maximum Likelihood Estimation", color=TEXT, font_size=30).to_edge(UP)
        self.play(FadeIn(title))

        np.random.seed(42)
        true_mu = 2.0
        data = np.random.normal(true_mu, 1.0, 20)
        x_bar = float(np.mean(data))

        axes = Axes(
            x_range=[-1, 5, 1], y_range=[0, 0.65, 0.1],
            x_length=10, y_length=5,
            axis_config={"color": WHITE, "stroke_width": 2},
        ).shift(DOWN * 0.3)

        data_dots = VGroup(*[
            Dot(axes.c2p(float(x), 0.02), color=DATA_COLOR, radius=0.05)
            for x in data
        ])
        data_label = Text("Observed data", color=DATA_COLOR, font_size=24).to_corner(UL, buff=0.5)

        self.play(Create(axes), Create(data_dots), Write(data_label))
        self.wait(0.5)

        mu_tracker = ValueTracker(-0.8)

        likelihood_curve = always_redraw(lambda: axes.plot(
            lambda x: np.exp(-0.5 * (x - mu_tracker.get_value()) ** 2) / np.sqrt(2 * np.pi),
            x_range=[-1, 5, 0.05], color=LIKE_COLOR, stroke_width=3,
        ))
        mu_label = always_redraw(lambda: MathTex(
            rf"\mu = {mu_tracker.get_value():.2f}", color=LIKE_COLOR, font_size=28,
        ).to_corner(UR, buff=0.5))

        self.play(Create(likelihood_curve), Write(mu_label))
        self.play(mu_tracker.animate.set_value(x_bar), run_time=3.5, rate_func=smooth)

        mle_result = MathTex(
            rf"\hat{{\mu}}_{{MLE}} = \bar{{x}} = {x_bar:.2f}", color=MLE_COLOR, font_size=30,
        ).to_corner(DR, buff=0.5)
        self.play(Write(mle_result))
        self.wait(2)
```

- [ ] **Step 3: Create `backend/scenes/hypothesis_test.py`**

Uses `math.erfinv` to avoid requiring scipy.

```python
import json
import math
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
DIST_COLOR = "#58c4dd"
REJECT_COLOR = "#fc6255"
ACCEPT_COLOR = "#83c167"
PVAL_COLOR = "#ffff00"


def norm_ppf(p: float) -> float:
    return math.sqrt(2) * math.erfinv(2 * p - 1)


def norm_cdf(x: float) -> float:
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


class HypothesisTestScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"alpha": 0.05, "test_type": "two-tailed"}'))
        alpha = float(params.get("alpha", 0.05))
        test_type = params.get("test_type", "two-tailed")

        title = Text("Hypothesis Testing & p-value", color=TEXT, font_size=30).to_edge(UP)
        self.play(FadeIn(title))

        axes = Axes(
            x_range=[-4, 4, 1], y_range=[0, 0.48, 0.1],
            x_length=10, y_length=4.8,
            axis_config={"color": WHITE, "stroke_width": 2},
        ).shift(DOWN * 0.3)

        normal = axes.plot(
            lambda x: np.exp(-x ** 2 / 2) / np.sqrt(2 * np.pi),
            x_range=[-4, 4, 0.05], color=DIST_COLOR, stroke_width=3,
        )
        h0_label = MathTex(r"H_0: \mu = 0", color=TEXT, font_size=28).to_corner(UL, buff=0.5)

        self.play(Create(axes), Create(normal), Write(h0_label))
        self.wait(0.5)

        if test_type == "two-tailed":
            z_crit = norm_ppf(1 - alpha / 2)
            left_area = axes.get_area(normal, x_range=[-4, -z_crit], color=REJECT_COLOR, opacity=0.4)
            right_area = axes.get_area(normal, x_range=[z_crit, 4], color=REJECT_COLOR, opacity=0.4)
            crit_label = MathTex(rf"z_{{crit}} = \pm {z_crit:.2f}", color=REJECT_COLOR, font_size=26).to_corner(UR, buff=0.5)
            alpha_lbl = MathTex(rf"\alpha = {alpha}", color=REJECT_COLOR, font_size=24).next_to(crit_label, DOWN)
            self.play(Create(left_area), Create(right_area), Write(crit_label), Write(alpha_lbl))
            z_obs = 2.1
            p_val = 2 * (1 - norm_cdf(abs(z_obs)))
        else:
            z_crit = norm_ppf(1 - alpha)
            right_area = axes.get_area(normal, x_range=[z_crit, 4], color=REJECT_COLOR, opacity=0.4)
            crit_label = MathTex(rf"z_{{crit}} = {z_crit:.2f}", color=REJECT_COLOR, font_size=26).to_corner(UR, buff=0.5)
            self.play(Create(right_area), Write(crit_label))
            z_obs = 2.1
            p_val = 1 - norm_cdf(z_obs)

        z_line = axes.get_vertical_line(axes.c2p(z_obs, 0.43), color=PVAL_COLOR, stroke_width=3)
        z_label = MathTex(rf"z_{{obs}} = {z_obs}", color=PVAL_COLOR, font_size=26).next_to(axes.c2p(z_obs, 0.43), RIGHT, buff=0.1)
        p_label = MathTex(rf"p\text{{-value}} = {p_val:.4f}", color=PVAL_COLOR, font_size=28).to_corner(DR, buff=0.5)
        decision = Text(
            "Reject H₀" if p_val < alpha else "Fail to Reject H₀",
            color=REJECT_COLOR if p_val < alpha else ACCEPT_COLOR,
            font_size=26,
        ).next_to(p_label, UP)

        self.play(Create(z_line), Write(z_label))
        self.play(Write(p_label), FadeIn(decision))
        self.wait(2)
```

- [ ] **Step 4: Run the import test**

```bash
python -m pytest tests/test_registry.py::test_stats_scenes_part2_importable -v
```

Expected: PASSED.

- [ ] **Step 5: Run all tests**

```bash
python -m pytest tests/ -v
```

Expected: all PASSED (12+ tests).

- [ ] **Step 6: Commit**

```bash
git add backend/scenes/mle.py backend/scenes/hypothesis_test.py tests/test_registry.py
git commit -m "feat: add statistics scenes (mle, hypothesis_test)"
```

---

### Task 11: Frontend Chat UI

**Files:**
- Create: `linear-algebra-visualizer/frontend/index.html`
- Create: `linear-algebra-visualizer/frontend/style.css`
- Create: `linear-algebra-visualizer/frontend/app.js`

- [ ] **Step 1: Create `frontend/index.html`**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MathViz</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <div class="header-inner">
      <span class="logo">∑ MathViz</span>
      <span class="tagline">수학/공학 시각화 AI</span>
    </div>
  </header>

  <main id="chat-container">
    <div id="messages"></div>
  </main>

  <footer>
    <div class="input-wrap">
      <textarea id="user-input" placeholder="수학 주제를 입력하세요... (예: 2x2 회전행렬의 고유값 시각화해줘)" rows="1"></textarea>
      <button id="send-btn" onclick="sendMessage()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
    <p class="hints">
      고유값 · 선형변환 · 행렬식 · 기저변환 · 테일러 급수 · 푸리에 급수 · 미분 · 중심극한정리 · MLE · 가설검정 · 표준오차
    </p>
  </footer>

  <script src="/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `frontend/style.css`**

```css
:root {
  --bg: #0c1b33;
  --bg2: #111f3e;
  --bubble-ai: #1a2d52;
  --bubble-user: #1e3a5f;
  --accent: #58c4dd;
  --text: #ece6e2;
  --muted: #8899bb;
  --border: #2a4070;
  --green: #83c167;
  --red: #fc6255;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body { height: 100%; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; }

body { display: flex; flex-direction: column; height: 100vh; }

header { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 14px 24px; flex-shrink: 0; }

.header-inner { max-width: 820px; margin: 0 auto; display: flex; align-items: baseline; gap: 12px; }

.logo { font-size: 22px; font-weight: 700; color: var(--accent); }

.tagline { font-size: 13px; color: var(--muted); }

main { flex: 1; overflow-y: auto; padding: 28px 16px; scroll-behavior: smooth; }

main::-webkit-scrollbar { width: 6px; }
main::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

#messages { max-width: 820px; margin: 0 auto; display: flex; flex-direction: column; gap: 22px; }

#messages:empty::after {
  content: "수학 주제를 자연어로 입력하면 AI가 시각화 영상을 생성해드립니다.";
  display: block; text-align: center; color: var(--muted); margin-top: 100px; font-size: 16px; line-height: 1.8;
}

.msg { display: flex; gap: 12px; animation: fadeUp .3s ease; }
.msg.user { flex-direction: row-reverse; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 2px; font-weight: 700; }

.msg.user .avatar { background: var(--accent); color: var(--bg); }
.msg.ai .avatar { background: var(--bubble-ai); border: 1px solid var(--border); color: var(--accent); }

.bubble { max-width: 78%; padding: 14px 18px; border-radius: 16px; line-height: 1.65; }

.msg.user .bubble { background: var(--bubble-user); border-radius: 16px 4px 16px 16px; }

.msg.ai .bubble { background: var(--bubble-ai); border: 1px solid var(--border); border-radius: 4px 16px 16px 16px; }

.topic-badge { display: inline-block; background: rgba(88,196,221,.15); border: 1px solid rgba(88,196,221,.3); color: var(--accent); font-size: 11px; padding: 2px 9px; border-radius: 12px; margin-bottom: 10px; font-weight: 600; }

.explanation { white-space: pre-line; font-size: 14.5px; }

.video-wrap { margin-top: 14px; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); background: #000; }

.video-wrap video { width: 100%; max-height: 380px; display: block; }

.status { color: var(--muted); font-size: 13px; }

.status .step { display: flex; align-items: center; gap: 8px; margin: 5px 0; }

.status .step.done { color: var(--green); }
.status .step.active { color: var(--accent); }

.dots span { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: currentColor; margin: 0 2px; animation: blink 1.2s infinite; }
.dots span:nth-child(2) { animation-delay: .2s; }
.dots span:nth-child(3) { animation-delay: .4s; }

@keyframes blink { 0%,80%,100% { transform: scale(.5); opacity:.3; } 40% { transform: scale(1); opacity:1; } }

footer { background: var(--bg2); border-top: 1px solid var(--border); padding: 16px 24px 18px; flex-shrink: 0; }

.input-wrap { max-width: 820px; margin: 0 auto; display: flex; gap: 10px; align-items: flex-end; background: var(--bg); border: 1.5px solid var(--border); border-radius: 14px; padding: 10px 12px 10px 16px; transition: border-color .2s; }

.input-wrap:focus-within { border-color: var(--accent); }

#user-input { flex: 1; background: none; border: none; outline: none; color: var(--text); font-size: 15px; resize: none; max-height: 120px; line-height: 1.5; }

#user-input::placeholder { color: var(--muted); }

#send-btn { background: var(--accent); color: var(--bg); border: none; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: opacity .2s; }

#send-btn:hover { opacity: .85; }
#send-btn:disabled { opacity: .35; cursor: not-allowed; }

.hints { max-width: 820px; margin: 8px auto 0; font-size: 12px; color: var(--muted); text-align: center; }
```

- [ ] **Step 3: Create `frontend/app.js`**

```javascript
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let history = [];
let busy = false;

const TOPIC_KR = {
  eigenvalue: '고유값/고유벡터', linear_transform: '선형변환', determinant: '행렬식',
  basis_change: '기저변환', taylor_series: '테일러 급수', fourier: '푸리에 급수',
  derivative: '미분', clt: '중심극한정리', mle: 'MLE',
  hypothesis_test: '가설검정', standard_error: '표준오차',
};

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function scrollEnd() {
  document.getElementById('chat-container').scrollTop = 99999;
}

function addUserMsg(text) {
  const d = document.createElement('div');
  d.className = 'msg user';
  d.innerHTML = `<div class="avatar">U</div><div class="bubble">${esc(text)}</div>`;
  messagesEl.appendChild(d);
  scrollEnd();
}

function addLoadingMsg() {
  const d = document.createElement('div');
  d.className = 'msg ai';
  d.id = 'loading';
  d.innerHTML = `
    <div class="avatar">∑</div>
    <div class="bubble">
      <div class="status">
        <div class="step active" id="s1"><span class="dots"><span></span><span></span><span></span></span> 주제 분석 중...</div>
      </div>
    </div>`;
  messagesEl.appendChild(d);
  scrollEnd();
}

function stepToRendering() {
  const s1 = document.getElementById('s1');
  if (!s1) return;
  s1.className = 'step done';
  s1.textContent = '✓ 주제 분석 완료';
  const s2 = document.createElement('div');
  s2.className = 'step active';
  s2.id = 's2';
  s2.innerHTML = `<span class="dots"><span></span><span></span><span></span></span> 시각화 생성 중... (5~15초)`;
  s1.parentElement.appendChild(s2);
  scrollEnd();
}

function resolveLoading(explanation, videoUrl, topicId) {
  const el = document.getElementById('loading');
  if (!el) return;

  const badge = topicId && TOPIC_KR[topicId]
    ? `<div class="topic-badge">${TOPIC_KR[topicId]}</div>`
    : '';

  const video = videoUrl
    ? `<div class="video-wrap"><video controls preload="metadata"><source src="${videoUrl}" type="video/mp4"></video></div>`
    : '';

  el.querySelector('.bubble').innerHTML = `${badge}<div class="explanation">${esc(explanation)}</div>${video}`;
  el.removeAttribute('id');
  scrollEnd();
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || busy) return;

  busy = true;
  sendBtn.disabled = true;
  inputEl.value = '';
  inputEl.style.height = 'auto';

  addUserMsg(text);
  addLoadingMsg();

  const renderTimer = setTimeout(stepToRendering, 1600);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history }),
    });

    clearTimeout(renderTimer);
    stepToRendering();

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    history.push({ role: 'user', content: text });
    history.push({ role: 'assistant', content: data.explanation });

    resolveLoading(data.explanation, data.video_url, data.topic_id);
  } catch {
    clearTimeout(renderTimer);
    resolveLoading('오류가 발생했어요. 잠시 후 다시 시도해주세요.', null, null);
  } finally {
    busy = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
});

inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
```

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: add Perplexity-style chat UI (HTML/CSS/JS)"
```

---

### Task 12: Railway Deployment Config

**Files:**
- Create: `linear-algebra-visualizer/railway.json`

- [ ] **Step 1: Create `railway.json`**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn backend.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

- [ ] **Step 2: Update root `Dockerfile` CMD to use `$PORT`**

The root `Dockerfile` already uses `${PORT:-8000}` from Task 2 Step 4. Verify:

```bash
grep PORT linear-algebra-visualizer/Dockerfile
```

Expected: `CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "${PORT:-8000}"]`

If not present, update the CMD line to:
```dockerfile
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

- [ ] **Step 3: Update `.gitignore`**

Add to `linear-algebra-visualizer/.gitignore`:

```
.env
output/
__pycache__/
*.pyc
.pytest_cache/
```

- [ ] **Step 4: Commit**

```bash
git add railway.json Dockerfile .gitignore
git commit -m "chore: add Railway deployment config"
```

---

### Task 13: End-to-End Local Smoke Test

- [ ] **Step 1: Ensure `.env` exists with your key**

```bash
# In linear-algebra-visualizer/
ls .env   # should show the file
cat .env  # should show GOOGLE_API_KEY=...
```

If missing, copy from example:
```bash
cp .env.example .env
# then edit .env and add your real GOOGLE_API_KEY
```

- [ ] **Step 2: Build and start Docker**

```bash
cd linear-algebra-visualizer
docker-compose -f docker/docker-compose.yml up --build
```

Expected: build completes, server starts, `"Application startup complete"` in logs.

- [ ] **Step 3: Test health endpoint**

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"healthy","service":"mathviz"}`

- [ ] **Step 4: Test chat endpoint — unknown topic**

```bash
curl -s -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "오늘 날씨 알려줘", "history": []}' | python3 -m json.tool
```

Expected: `video_url` is null, `explanation` contains "지원하지 않는 주제".

- [ ] **Step 5: Test chat endpoint — known topic (eigenvalue)**

```bash
curl -s -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "2x2 단위행렬의 고유값 시각화해줘", "history": []}' | python3 -m json.tool
```

Expected: `topic_id` = `"eigenvalue"`, `video_url` is non-null (may take 10–30 seconds).

- [ ] **Step 6: Open browser and verify UI**

Visit `http://localhost:8000` in a browser.

Expected: dark chat UI with "∑ MathViz" header, input bar at bottom.

Send a message and verify: loading dots → "주제 분석 완료" → "시각화 생성 중" → video appears in AI bubble.

- [ ] **Step 7: Run all unit tests**

```bash
docker exec <container_name> python -m pytest /app/tests/ -v
```

Or locally (no Manim needed for unit tests):

```bash
cd linear-algebra-visualizer
python -m pytest tests/ -v
```

Expected: all PASSED.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete Manim math visualization chat service"
```

---

## Railway Deployment (After Local Test Passes)

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. In `linear-algebra-visualizer/`: `railway init`
4. Set root directory to `linear-algebra-visualizer` in Railway dashboard → Settings → Source
5. Add env var: `GOOGLE_API_KEY=<your_key>` in Railway dashboard → Variables
6. Deploy: `railway up`
7. Get URL from Railway dashboard — share this for the competition demo
