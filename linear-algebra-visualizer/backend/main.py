import asyncio
import json
import logging
import os
import shutil
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional

logger = logging.getLogger(__name__)

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

from backend.llm.parser import parse_request
from backend.llm.pdf_parser import extract_concepts_from_pdf
from backend.scene_registry import SCENE_REGISTRY

app = FastAPI(title="MathViz API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", "/app/output"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
PACKS_DIR = OUTPUT_DIR / "packs"
PACKS_DIR.mkdir(parents=True, exist_ok=True)
FRONTEND_DIR = Path(os.environ.get("FRONTEND_DIR", "/app/frontend"))

app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR), check_dir=False), name="output")

SUPPORTED_TOPICS_LIST = "\n".join(f"- {k}" for k in SCENE_REGISTRY.keys())

# job_id → asyncio.Queue used for SSE streaming
_job_queues: Dict[str, asyncio.Queue] = {}


# ── Pydantic models ──────────────────────────────────────────────────

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


class ConceptItem(BaseModel):
    id: str
    title: str
    description: str
    topic_id: str
    params: Dict[str, Any] = {}


class GenerateRequest(BaseModel):
    pack_id: str
    title: str
    source_file: str
    concepts: List[ConceptItem]


class AskRequest(BaseModel):
    question: str


# ── Pack JSON helpers ────────────────────────────────────────────────

def _load_pack(pack_id: str) -> Optional[Dict]:
    p = PACKS_DIR / pack_id / "pack.json"
    if not p.exists():
        return None
    return json.loads(p.read_text())


def _save_pack(pack: Dict) -> None:
    pack_dir = PACKS_DIR / pack["id"]
    pack_dir.mkdir(parents=True, exist_ok=True)
    (pack_dir / "pack.json").write_text(
        json.dumps(pack, ensure_ascii=False, indent=2)
    )


# ── Manim renderer ───────────────────────────────────────────────────

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


# ── Batch generation background task ────────────────────────────────

async def _run_batch_generate(pack_id: str, job_id: str) -> None:
    queue = _job_queues.get(job_id)
    pack = _load_pack(pack_id)
    if not pack or queue is None:
        return

    pack_dir = PACKS_DIR / pack_id
    total = len(pack["concepts"])

    for i, concept in enumerate(pack["concepts"]):
        topic_id = concept.get("topic_id", "eigenvalue")
        if topic_id not in SCENE_REGISTRY:
            topic_id = "eigenvalue"
        params = concept.get("params", {})

        await queue.put(json.dumps({
            "type": "progress",
            "concept_id": concept["id"],
            "index": i + 1,
            "total": total,
        }))

        video_path = await render_scene(topic_id, params)

        if video_path and video_path.exists():
            dest = pack_dir / f"{concept['id']}.mp4"
            shutil.move(str(video_path), str(dest))
            video_url = f"/output/packs/{pack_id}/{concept['id']}.mp4"
            concept["video_url"] = video_url
            concept["status"] = "done"
            await queue.put(json.dumps({
                "type": "done",
                "concept_id": concept["id"],
                "video_url": video_url,
                "index": i + 1,
                "total": total,
            }))
        else:
            concept["status"] = "error"
            await queue.put(json.dumps({
                "type": "error",
                "concept_id": concept["id"],
                "index": i + 1,
                "total": total,
            }))

        _save_pack(pack)

    pack["status"] = "complete"
    _save_pack(pack)

    await queue.put(json.dumps({"type": "complete", "pack_id": pack_id}))
    await queue.put(None)  # sentinel — tells SSE handler to close


# ── Existing chat endpoint ───────────────────────────────────────────

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    history = [{"role": h.role, "content": h.content} for h in request.history]

    try:
        parsed = await asyncio.get_running_loop().run_in_executor(
            None, parse_request, request.message, history
        )
    except Exception as e:
        logger.error("parse_request failed: %s", e, exc_info=True)
        return ChatResponse(explanation="서비스 오류가 발생했어요. 잠시 후 다시 시도해주세요.")

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


# ── Lecture pack endpoints ───────────────────────────────────────────

@app.post("/api/create/upload")
async def create_upload(file: UploadFile = File(...)):
    """PDF upload → Gemini multimodal parsing → concept list."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드할 수 있어요.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = Path(tmp.name)

    try:
        result = await asyncio.get_running_loop().run_in_executor(
            None, extract_concepts_from_pdf, tmp_path
        )
    except Exception as e:
        logger.error("PDF concept extraction failed: %s", e, exc_info=True)
        raise HTTPException(status_code=422, detail="PDF에서 수학 개념을 추출하지 못했어요.")
    finally:
        tmp_path.unlink(missing_ok=True)

    pack_id = str(uuid.uuid4())
    return {
        "pack_id": pack_id,
        "lecture_title": result.get("lecture_title", file.filename),
        "source_file": file.filename,
        "concepts": result.get("concepts", []),
    }


@app.post("/api/create/generate")
async def create_generate(request: GenerateRequest, background_tasks: BackgroundTasks):
    """Confirmed concept list → create pack JSON → start batch rendering."""
    pack_id = request.pack_id
    job_id = str(uuid.uuid4())

    pack = {
        "id": pack_id,
        "title": request.title,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source_file": request.source_file,
        "status": "generating",
        "concepts": [c.model_dump() for c in request.concepts],
        "qa_archive": [],
    }
    _save_pack(pack)

    _job_queues[job_id] = asyncio.Queue()
    background_tasks.add_task(_run_batch_generate, pack_id, job_id)

    return {"pack_id": pack_id, "job_id": job_id}


@app.get("/api/create/progress/{job_id}")
async def create_progress(job_id: str):
    """SSE stream — concept-by-concept progress updates."""
    queue = _job_queues.get(job_id)
    if queue is None:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            while True:
                item = await asyncio.wait_for(queue.get(), timeout=300)
                if item is None:
                    _job_queues.pop(job_id, None)
                    break
                yield f"data: {item}\n\n"
        except asyncio.TimeoutError:
            _job_queues.pop(job_id, None)
            yield f"data: {json.dumps({'type': 'timeout'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/pack/{pack_id}")
async def get_pack(pack_id: str):
    """Return pack metadata + video list."""
    pack = _load_pack(pack_id)
    if pack is None:
        raise HTTPException(status_code=404, detail="강의 팩을 찾을 수 없어요.")
    return pack


@app.post("/api/pack/{pack_id}/ask")
async def pack_ask(pack_id: str, request: AskRequest):
    """Student question → context-injected Gemini parse → render → append to Q&A archive."""
    pack = _load_pack(pack_id)
    if pack is None:
        raise HTTPException(status_code=404, detail="강의 팩을 찾을 수 없어요.")

    concept_titles = ", ".join(c["title"] for c in pack.get("concepts", []))
    context_msg = (
        f"[강의 팩: {pack['title']}. 이 강의의 핵심 개념: {concept_titles}]\n\n"
        f"학생 질문: {request.question}"
    )

    try:
        parsed = await asyncio.get_running_loop().run_in_executor(
            None, parse_request, context_msg, []
        )
    except Exception as e:
        logger.error("pack_ask parse failed: %s", e, exc_info=True)
        raise HTTPException(status_code=422, detail="서비스 오류가 발생했어요.")

    topic_id = parsed.get("topic_id", "unknown")
    confidence = float(parsed.get("confidence", 0))

    if topic_id == "unknown" or confidence < 0.5 or topic_id not in SCENE_REGISTRY:
        raise HTTPException(
            status_code=422,
            detail="이 강의 내용과 관련된 수학 질문을 입력해주세요.",
        )

    video_path = await render_scene(topic_id, parsed.get("params", {}))
    if not video_path or not video_path.exists():
        raise HTTPException(status_code=500, detail="영상 생성에 실패했어요. 다시 시도해주세요.")

    qa_id = f"qa-{uuid.uuid4().hex[:8]}"
    pack_dir = PACKS_DIR / pack_id
    pack_dir.mkdir(parents=True, exist_ok=True)
    dest = pack_dir / f"{qa_id}.mp4"
    shutil.move(str(video_path), str(dest))
    video_url = f"/output/packs/{pack_id}/{qa_id}.mp4"

    qa_entry = {
        "id": qa_id,
        "question": request.question,
        "description": parsed.get("explanation", ""),
        "video_url": video_url,
        "type": "student",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    pack.setdefault("qa_archive", []).append(qa_entry)
    _save_pack(pack)

    return qa_entry


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "mathviz"}


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
