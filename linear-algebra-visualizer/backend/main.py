import asyncio
import json
import logging
import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

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

app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR), check_dir=False), name="output")

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
    scene_file = f"{module_path}.py"

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
        _, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        if proc.returncode != 0:
            logger.warning("Manim render failed for %s: %s", topic_id, stderr.decode(errors="replace"))
            return None
    except asyncio.TimeoutError:
        logger.warning("Manim render timed out for %s", topic_id)
        return None
    except Exception as e:
        logger.warning("Manim render error for %s: %s", topic_id, e)
        return None

    for path in OUTPUT_DIR.rglob(f"{output_name}.mp4"):
        return path
    return None


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    history = [{"role": h.role, "content": h.content} for h in request.history]

    try:
        parsed = await asyncio.get_running_loop().run_in_executor(
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
