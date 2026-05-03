# Manim 기반 선형대수 시각화 - 요구사항 명세

## 프로젝트 개요

Python manim을 서버에서 실행하여 **정확한 3Blue1Brown 스타일**의 선형대수 시각화를 구현한다.

## 배경

### 이전 시도와 실패 원인

1. **manim-web (Dart 기반)**: Dart SDK 2.x 필요, 최신 Dart 3.x와 호환 불가. 프로젝트 방치 상태.
2. **Three.js 직접 구현**: 3B1B 디자인을 정확히 재현하기 어려움. 색상/애니메이션이 원본과 다름.

### 선택된 접근법

**Python manim 서버 렌더링** - 실제 manim 라이브러리를 사용하여 정확한 3B1B 스타일 보장

---

## 아키텍처

```
┌─────────────────────┐              ┌─────────────────────┐
│      브라우저        │    HTTP API   │   Docker Container  │
│   (프론트엔드)       │ ────────────► │   (Python + Manim)  │
│                     │              │                     │
│  • HTML/CSS/JS      │ ◄──────────── │  • manim 렌더링      │
│  • UI 컨트롤         │   SVG/PNG/   │  • 애니메이션 생성    │
│  • 결과 표시         │   MP4        │  • 수학 계산          │
└─────────────────────┘              └─────────────────────┘
```

### 컴포넌트 역할

| 컴포넌트 | 역할 | 기술 |
|---------|------|------|
| 프론트엔드 | UI, 파라미터 입력, 결과 표시 | HTML/CSS/JS (또는 React) |
| 백엔드 API | 요청 처리, manim 호출 | FastAPI / Flask |
| Manim 렌더러 | 실제 시각화 생성 | Python manim (ManimCE) |
| Docker | 환경 격리, 의존성 관리 | Docker + docker-compose |

---

## 기술 스택

### 서버 (Docker)
- **Python 3.11+**
- **ManimCE** (Community Edition) - 공식 manim 포크
- **FastAPI** - REST API 서버
- **Cairo, FFmpeg, LaTeX** - manim 의존성

### 프론트엔드
- **Vanilla JS** 또는 **React** (선택)
- **KaTeX** - 수식 표시
- 기존 Three.js 코드는 **완전히 삭제**

### 인프라
- **Docker + docker-compose** - 로컬 개발 환경
- 향후 클라우드 배포 고려 가능

---

## 기능 요구사항

### Phase 1: 기반 구축

1. **Docker 환경 설정**
   - ManimCE가 동작하는 Docker 이미지 생성
   - FastAPI 서버 포함
   - 볼륨 마운트로 렌더링 결과 공유

2. **API 설계**
   ```
   POST /render/eigenvalue
   Body: { "matrix": [[a, b], [c, d]], "options": {...} }
   Response: { "svg_url": "...", "animation_url": "..." }
   ```

3. **기본 프론트엔드**
   - 행렬 입력 UI
   - 렌더링 결과 표시
   - 로딩 상태 표시

### Phase 2: 고유값/고유벡터 시각화

1. **Manim Scene 구현**
   - 2x2 행렬 입력 받음
   - 좌표 평면 + 격자 표시
   - 기저 벡터 (î, ĵ) 표시
   - 고유벡터 하이라이트
   - 선형 변환 애니메이션

2. **시각화 요소** (3B1B 스타일)
   - 배경: `#0c1b33` (깊은 네이비)
   - 기저 î: `#83c167` (연두)
   - 기저 ĵ: `#fc6255` (코랄)
   - 고유벡터1: `#ffff00` (노랑)
   - 고유벡터2: `#58c4dd` (청색)
   - 격자: 미묘한 청색, 낮은 불투명도

3. **인터랙션**
   - 슬라이더로 행렬 요소 조절
   - "Apply Transform" 버튼 → 서버에 렌더링 요청
   - 결과 애니메이션/이미지 표시

### Phase 3: 확장 (향후)

- 추가 선형대수 토픽 (행렬식, 역행렬, SVD 등)
- 애니메이션 캐싱
- 실시간 프리뷰 (간소화 버전)

---

## 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| 디자인 정확도 | 3B1B 영상과 동일한 색상/스타일 **(최우선)** |
| 응답 시간 | 단일 프레임: 1-2초, 애니메이션: 5-10초 허용 |
| 환경 | 로컬 Docker에서 개발 |
| 브라우저 | Chrome, Firefox 최신 버전 |

---

## 파일 구조 (예상)

```
linear-algebra-visualizer/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── backend/
│   ├── main.py              # FastAPI 서버
│   ├── scenes/
│   │   └── eigenvalue.py    # Manim Scene 정의
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── output/                   # 렌더링 결과 (볼륨 마운트)
└── README.md
```

---

## 성공 기준

1. ✅ Docker로 manim 서버가 실행됨
2. ✅ 브라우저에서 행렬 입력 시 manim이 렌더링한 결과가 표시됨
3. ✅ 색상/스타일이 3Blue1Brown 영상과 일치함
4. ✅ 고유벡터가 변환 시 방향을 유지하는 것을 시각적으로 확인 가능

---

## 참고 자료

- [ManimCE 공식 문서](https://docs.manim.community/)
- [ManimCE GitHub](https://github.com/ManimCommunity/manim)
- [3Blue1Brown manim 원본](https://github.com/3b1b/manim) (참고용)
- [Manim 색상 상수](https://docs.manim.community/en/stable/reference/manim.utils.color.Colors.html)

---

## 결정 사항 요약

| 질문 | 결정 |
|------|------|
| Manim 활용 방식 | Python manim 서버 렌더링 |
| 인터랙션 요구사항 | 서버 렌더링 지연 허용 |
| 서버 환경 | 로컬 Docker |
| 우선순위 | 3B1B 디자인 정확도 |
| 기존 Three.js 코드 | 완전히 삭제하고 새로 시작 |

---

*작성일: 2026-02-02*
