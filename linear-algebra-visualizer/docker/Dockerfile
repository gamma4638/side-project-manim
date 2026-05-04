FROM manimcommunity/manim:stable

USER root

WORKDIR /app

# manim, pycairo, cairo, LaTeX, ffmpeg는 /opt/venv에 이미 설치되어 있음
# 웹 프레임워크 패키지만 /opt/venv에 추가 설치 (전부 binary wheel)
RUN /opt/venv/bin/pip install --no-cache-dir \
    "fastapi==0.109.2" \
    "uvicorn[standard]==0.27.1" \
    "python-multipart==0.0.9" \
    "google-genai>=1.0.0" \
    "python-dotenv>=1.0.0" \
    "httpx>=0.24.0"

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY backend/ ./backend/
COPY frontend/ ./frontend/

RUN mkdir -p /app/output

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
