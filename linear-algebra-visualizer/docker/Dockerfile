# manimcommunity/manim: pycairo, cairo, LaTeX, ffmpeg, manim 전부 사전 설치
FROM manimcommunity/manim:stable

USER root

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# 웹 프레임워크 의존성만 설치 (manim/pycairo는 base image 제공)
COPY pyproject.toml uv.lock ./
RUN UV_SYSTEM_PYTHON=1 uv sync --frozen --no-dev

COPY backend/ ./backend/
COPY frontend/ ./frontend/

RUN mkdir -p /app/output

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
