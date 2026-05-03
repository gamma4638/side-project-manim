# Manim 수학/공학 시각화 서비스 설계

**날짜:** 2026-05-03  
**목적:** 공모전 시연용 수학/공학 시각화 영상 생성 서비스  

---

## 개요

사용자가 자연어로 수학/공학 주제를 입력하면, Gemini API가 주제를 분류하고 파라미터를 추출해 ManimCE로 시각화 영상을 생성한다. 결과는 Perplexity/Claude 스타일의 채팅 UI에서 텍스트 설명 + 임베드 영상으로 제공된다.

---

## 아키텍처

```
브라우저 (Vanilla HTML/CSS/JS)
  │  POST /api/chat  { message, history }
  ▼
FastAPI (Railway, Docker)
  ├── llm/parser.py   → Gemini API로 주제 분류 + 파라미터 추출
  ├── scene_registry.py → topic_id → Scene 클래스 매핑
  ├── Manim subprocess → MP4 생성 → /output/ 저장
  └── JSON 응답: { explanation, video_url, topic_id }

StaticFiles
  ├── /output/*  → 생성된 MP4 서빙
  └── /          → 프론트엔드 index.html
```

**배포:**
- Railway 단일 컨테이너 (Docker)
- 공개 URL 하나로 프론트 + 백엔드 통합 서빙

---

## 파일 구조

```
linear-algebra-visualizer/
├── backend/
│   ├── main.py                  # FastAPI 앱, /api/chat 엔드포인트
│   ├── scene_registry.py        # topic_id → Scene 매핑 테이블
│   ├── llm/
│   │   └── parser.py            # Gemini API 호출 및 응답 파싱
│   ├── scenes/
│   │   ├── eigenvalue.py        # (기존) 고유값/고유벡터
│   │   ├── linear_transform.py  # 선형변환
│   │   ├── determinant.py       # 행렬식
│   │   ├── basis_change.py      # 기저변환
│   │   ├── taylor_series.py     # 테일러 급수
│   │   ├── fourier.py           # 푸리에 급수/변환
│   │   ├── derivative.py        # 극한/미분
│   │   ├── clt.py               # 중심극한정리
│   │   ├── mle.py               # 최대가능도추정
│   │   ├── hypothesis_test.py   # p-value / 가설검정
│   │   └── standard_error.py   # 표준오차
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── output/                      # 렌더링 결과 (gitignore)
└── .env                         # GOOGLE_API_KEY
```

---

## 지원 주제 목록 (Scene Registry)

| topic_id | Scene 클래스 | 파라미터 |
|---|---|---|
| `eigenvalue` | `EigenvalueScene` | `matrix_2x2` |
| `linear_transform` | `LinearTransformScene` | `matrix_2x2` |
| `determinant` | `DeterminantScene` | `matrix_2x2` |
| `basis_change` | `BasisChangeScene` | `matrix_2x2` |
| `taylor_series` | `TaylorSeriesScene` | `function`, `center`, `degree` |
| `fourier` | `FourierScene` | `num_terms` |
| `derivative` | `DerivativeScene` | `function` |
| `clt` | `CLTScene` | `sample_size`, `dist_type` |
| `mle` | `MLEScene` | `dist_type` |
| `hypothesis_test` | `HypothesisTestScene` | `alpha`, `test_type` |
| `standard_error` | `StandardErrorScene` | `sample_size` |

---

## API

### `POST /api/chat`

**Request:**
```json
{
  "message": "2x2 회전행렬의 고유값 시각화해줘",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response (성공):**
```json
{
  "explanation": "회전 행렬 [[0,-1],[1,0]]의 고유값은 허수(±i)입니다...",
  "video_url": "/output/videos/eigenvalue_abc123.mp4",
  "topic_id": "eigenvalue"
}
```

**Response (주제 미지원):**
```json
{
  "explanation": "지원하지 않는 주제예요. 아래 주제들을 시도해보세요:\n- 고유값/고유벡터\n- 선형변환\n...",
  "video_url": null,
  "topic_id": null
}
```

---

## LLM 파싱 (Gemini)

**모델:** `gemini-2.0-flash` (속도 우선)

**Gemini structured output 스키마:**
```python
{
  "topic_id": str,        # SCENE_REGISTRY 키 중 하나, 또는 "unknown"
  "params": dict,         # 해당 씬의 파라미터
  "explanation": str,     # 한국어 설명 (2-3문장)
  "confidence": float     # 0.0 ~ 1.0
}
```

**파싱 로직:**
- `confidence < 0.6` 또는 `topic_id == "unknown"` → 영상 없이 안내 메시지 반환
- 파라미터 미제공 시 각 씬의 기본값(default) 사용
- `history`를 Gemini 대화 컨텍스트로 전달해 "방금 그 행렬로 선형변환도 해줘" 같은 후속 요청 지원

---

## UI

**스타일:** 어두운 배경 (`#0c1b33`), Perplexity/Claude 스타일 채팅

**레이아웃:**
```
┌─────────────────────────────────────────────┐
│  MathViz                                    │  헤더
├─────────────────────────────────────────────┤
│  [유저 버블]  자연어 입력                    │
│  [AI 버블]   텍스트 설명                    │
│              ┌──────────────────────────┐   │
│              │  <video controls> MP4    │   │
│              └──────────────────────────┘   │
├─────────────────────────────────────────────┤
│  [ 수학 주제를 입력하세요... ]  [전송]       │  입력창
└─────────────────────────────────────────────┘
```

**로딩 상태:**
- 버블에 "● 주제 분석 중..." → "● 시각화 생성 중..." 텍스트 순차 표시
- 영상 생성 소요시간: 보통 5~15초

**세션:** 브라우저 메모리 내 히스토리 유지, 새로고침 시 초기화

---

## 에러 처리

| 상황 | 응답 |
|---|---|
| 주제 분류 실패 | 안내 메시지 + 지원 주제 목록 |
| Manim 렌더링 실패 | 텍스트 설명만 반환, 영상 없음 |
| Gemini API 오류 | "서비스 오류, 잠시 후 재시도" |
| 렌더링 타임아웃 (120초) | "렌더링 시간 초과" 메시지 |

---

## 환경변수 (.env)

```
GOOGLE_API_KEY=your_google_api_key_here
```

---

## 배포 (Railway)

```bash
# 로컬 개발
docker-compose up --build

# Railway 배포
railway up
```

- Railway가 `docker-compose.yml` 또는 `Dockerfile` 자동 감지
- 환경변수 Railway 대시보드에서 설정
- `/output` 볼륨은 임시 저장 (Railway ephemeral storage)

---

## 구현 순서 (Ralph Loop 대상)

1. 기존 코드베이스 정리 (frontend-interactive 제거, 디렉토리 재구성)
2. `scene_registry.py` 작성
3. `llm/parser.py` — Gemini API 연동
4. `main.py` — `/api/chat` 엔드포인트 교체
5. 나머지 Manim Scene 구현 (10개)
6. 프론트엔드 채팅 UI 구현
7. Docker 설정 업데이트
8. Railway 배포 설정
