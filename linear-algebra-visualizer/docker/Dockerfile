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
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
# pycairo는 no-build-isolation으로 빌드 (WSL2 clock skew 회피)
# meson 빌드 툴을 먼저 설치해야 함
RUN UV_SYSTEM_PYTHON=1 uv pip install meson meson-python ninja
RUN UV_SYSTEM_PYTHON=1 uv sync --frozen --no-dev

COPY backend/ ./backend/
COPY frontend/ ./frontend/

RUN mkdir -p /app/output

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
