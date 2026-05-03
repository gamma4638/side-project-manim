"""
FastAPI server for Linear Algebra Visualizer
Renders manim scenes and serves the output
"""

import os
import subprocess
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app = FastAPI(
    title="Linear Algebra Visualizer API",
    description="3B1B-style linear algebra visualization using ManimCE",
    version="1.0.0"
)

# CORS configuration for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Output directory for rendered files
OUTPUT_DIR = Path("/app/output")
OUTPUT_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")


class Matrix2x2(BaseModel):
    """2x2 matrix input"""
    a: float = Field(..., description="Top-left element")
    b: float = Field(..., description="Top-right element")
    c: float = Field(..., description="Bottom-left element")
    d: float = Field(..., description="Bottom-right element")

    def to_list(self) -> List[List[float]]:
        return [[self.a, self.b], [self.c, self.d]]


class RenderOptions(BaseModel):
    """Rendering options"""
    quality: str = Field(default="m", description="Quality: l (low), m (medium), h (high)")
    format: str = Field(default="mp4", description="Output format: mp4 or png")


class RenderRequest(BaseModel):
    """Request body for rendering"""
    matrix: Matrix2x2
    options: Optional[RenderOptions] = None


class ComplexNumber(BaseModel):
    """Complex number representation"""
    re: float
    im: float


class RenderResponse(BaseModel):
    """Response with rendered file URLs"""
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    eigenvalues: List[ComplexNumber] = []
    eigenvectors: List[List[float]] = []
    message: str


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "manim-visualizer"}


@app.post("/render/eigenvalue", response_model=RenderResponse)
async def render_eigenvalue(request: RenderRequest):
    """
    Render eigenvalue/eigenvector visualization for a 2x2 matrix
    """
    import numpy as np

    matrix = request.matrix.to_list()
    options = request.options or RenderOptions()

    # Calculate eigenvalues and eigenvectors
    try:
        np_matrix = np.array(matrix)
        eigenvalues, eigenvectors = np.linalg.eig(np_matrix)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid matrix: {str(e)}")

    # Generate unique ID for this render
    render_id = str(uuid.uuid4())[:8]

    # Quality flag mapping
    quality_flags = {
        "l": "-ql",   # 480p
        "m": "-qm",   # 720p
        "h": "-qh",   # 1080p
    }
    quality_flag = quality_flags.get(options.quality, "-qm")

    # Prepare matrix string for scene
    matrix_str = f"{matrix[0][0]},{matrix[0][1]},{matrix[1][0]},{matrix[1][1]}"

    # Build manim command
    scene_path = "/app/backend/scenes/eigenvalue.py"
    output_file = f"eigenvalue_{render_id}"

    cmd = [
        "manim",
        quality_flag,
        scene_path,
        "EigenvalueScene",
        "-o", output_file,
        "--media_dir", str(OUTPUT_DIR),
    ]

    # Set environment variable for matrix values
    env = os.environ.copy()
    env["MATRIX_VALUES"] = matrix_str

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,  # 2 minute timeout
            env=env,
            cwd="/app"
        )

        if result.returncode != 0:
            error_msg = result.stderr or result.stdout
            raise HTTPException(
                status_code=500,
                detail=f"Manim rendering failed: {error_msg}"
            )

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Rendering timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rendering error: {str(e)}")

    # Find the output file
    video_url = None
    image_url = None

    # Search for output files
    for ext in [".mp4", ".png", ".gif"]:
        # Manim creates files in videos/{quality}/ or images/
        possible_paths = [
            OUTPUT_DIR / "videos" / "eigenvalue" / "720p30" / f"{output_file}{ext}",
            OUTPUT_DIR / "videos" / "eigenvalue" / "480p15" / f"{output_file}{ext}",
            OUTPUT_DIR / "videos" / "eigenvalue" / "1080p60" / f"{output_file}{ext}",
            OUTPUT_DIR / "images" / "eigenvalue" / f"{output_file}{ext}",
            OUTPUT_DIR / f"{output_file}{ext}",
        ]

        for path in possible_paths:
            if path.exists():
                rel_path = path.relative_to(OUTPUT_DIR)
                url = f"/output/{rel_path}"
                if ext == ".mp4":
                    video_url = url
                else:
                    image_url = url
                break

    # Convert complex eigenvalues to serializable format
    eigen_vals = [
        ComplexNumber(re=float(ev.real), im=float(ev.imag))
        for ev in eigenvalues
    ]
    # Handle complex eigenvectors (convert to real part only for display)
    eigen_vecs = []
    for vec in eigenvectors.T.tolist():
        if isinstance(vec[0], complex):
            eigen_vecs.append([float(x.real) for x in vec])
        else:
            eigen_vecs.append([float(x) for x in vec])

    return RenderResponse(
        video_url=video_url,
        image_url=image_url,
        eigenvalues=eigen_vals,
        eigenvectors=eigen_vecs,
        message="Rendering completed successfully"
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Linear Algebra Visualizer API",
        "version": "1.0.0",
        "docs": "/docs"
    }
