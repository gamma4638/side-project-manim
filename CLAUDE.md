# CLAUDE.md - Linear Algebra Visualizer

이 파일은 Claude Code가 이 프로젝트에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 목표

Python manim(ManimCE)을 사용하여 **정확한 3Blue1Brown 스타일**의 선형대수 시각화를 구현합니다.

## 핵심 원칙

### 1. 3B1B 디자인 정확도가 최우선
- 색상, 애니메이션, 스타일 모두 manim 원본을 따름
- Three.js나 자체 구현으로 "비슷하게" 만들지 않음
- 항상 manim 소스 코드를 참조하여 정확한 수치 사용

### 2. 아키텍처: 서버 렌더링
```
브라우저 (UI) ←→ FastAPI (백엔드) ←→ Manim (렌더링)
                      ↓
              Docker Container
```

### 3. 인터랙션 철학
- 실시간 반응보다 정확한 렌더링 우선
- 서버 렌더링 지연(1-10초)은 허용됨
- 복잡한 애니메이션은 서버에서, UI 상태만 프론트에서 관리

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 렌더링 | Python ManimCE |
| 백엔드 | FastAPI |
| 프론트엔드 | HTML/CSS/JS (간단하게) |
| 환경 | Docker + docker-compose |

## 3B1B 색상 팔레트 (필수 참조)

```python
# ManimCE 색상 상수
BACKGROUND = "#0c1b33"      # 또는 config.background_color
GREEN = "#83c167"           # î-hat 기저벡터
RED = "#fc6255"             # ĵ-hat 기저벡터
YELLOW = "#ffff00"          # 고유벡터1, 하이라이트
BLUE = "#58c4dd"            # 고유벡터2
TEAL = "#5cd0b3"
PURPLE = "#9a72ac"
TEXT = "#ece6e2"            # 크림색 텍스트
```

## 주요 참고 자료

- [ManimCE 문서](https://docs.manim.community/)
- [ManimCE GitHub](https://github.com/ManimCommunity/manim)
- [3B1B 원본 manim](https://github.com/3b1b/manim) (스타일 참조)
- **요구사항 명세**: `requirements/manim-linear-algebra-visualizer.md`

## 디렉토리 구조

```
linear-algebra-visualizer/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── backend/
│   ├── main.py              # FastAPI 서버
│   ├── scenes/              # Manim Scene 정의
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── output/                   # 렌더링 결과
```

## 이전 시도에서 배운 점

### 실패한 접근법
1. **manim-web (Dart)**: Dart 2.x 필요, 현재 Dart 3.x와 호환 불가. 방치된 프로젝트.
2. **Three.js 직접 구현**: 3B1B 스타일 재현 실패. 색상/애니메이션이 원본과 다름.

### 성공 전략
- **실제 Python manim 사용** - 디자인 정확도 보장
- **Docker로 환경 격리** - 의존성 문제 해결
- **서버 렌더링 수용** - 실시간 포기하고 품질 우선

## 새 세션에서 시작할 때

1. 먼저 `requirements/manim-linear-algebra-visualizer.md` 읽기
2. 기존 `linear-algebra-visualizer/` 폴더의 Three.js 코드 삭제
3. Docker + ManimCE 환경부터 구축
4. 고유값/고유벡터 시각화 구현

## 명령어 예시

```bash
# Docker 빌드 및 실행
cd linear-algebra-visualizer
docker-compose up --build

# Manim 테스트 렌더링
docker exec -it manim-server manim -pql scenes/eigenvalue.py EigenvalueScene
```

## 금지 사항

- ❌ Three.js로 manim 스타일 "흉내내기"
- ❌ 색상값 임의 지정 (항상 manim 상수 참조)
- ❌ 프론트엔드에서 복잡한 그래픽 처리
- ❌ 실시간 인터랙션을 위해 품질 타협
