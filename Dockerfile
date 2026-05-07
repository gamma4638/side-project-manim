FROM manimcommunity/manim:stable

USER root

WORKDIR /app

RUN /opt/venv/bin/pip install --no-cache-dir \
    "fastapi==0.109.2" \
    "uvicorn[standard]==0.27.1" \
    "python-multipart==0.0.9" \
    "google-genai>=1.0.0" \
    "python-dotenv>=1.0.0" \
    "httpx>=0.24.0"

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY linear-algebra-visualizer/backend/ ./backend/
COPY linear-algebra-visualizer/frontend/ ./frontend/

RUN mkdir -p /app/output

EXPOSE 8000

ENTRYPOINT []
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
