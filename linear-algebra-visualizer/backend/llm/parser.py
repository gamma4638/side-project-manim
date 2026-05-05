import json
import os
import time
from typing import Any, Dict, List

from google import genai
from google.genai import types

SUPPORTED_TOPICS = [
    "eigenvalue", "linear_transform", "determinant", "basis_change",
    "taylor_series", "fourier", "derivative",
    "clt", "mle", "hypothesis_test", "standard_error",
]

SYSTEM_PROMPT = f"""You are a math visualization assistant. Classify the user's request into one of the supported topics and extract parameters.

Supported topics: {', '.join(SUPPORTED_TOPICS)}

Korean topic keywords (use these to match Korean queries):
- eigenvalue: 고유값, 고유벡터, 고유치
- linear_transform: 선형변환, 선형 변환, 행렬 변환
- determinant: 행렬식, 판별식, det
- basis_change: 기저변환, 기저 변환, 좌표계
- taylor_series: 테일러, 급수, 테일러 급수, 테일러 전개
- fourier: 푸리에, 푸리에 급수, 주파수
- derivative: 미분, 도함수, 접선
- clt: 중심극한정리, 중심 극한, CLT
- mle: 최대우도, MLE, 최대 우도 추정
- hypothesis_test: 가설검정, 가설 검정, p값, p-value, 유의수준
- standard_error: 표준오차, 표준 오차, 표본오차

Parameter schemas:
- eigenvalue, linear_transform, determinant, basis_change: matrix_2x2 ([[a,b],[c,d]] as list of 2 lists of 2 numbers)
- taylor_series: function (one of: sin, cos, exp, x^2), center (float), degree (int 1-7)
- fourier: num_terms (int 1-10)
- derivative: function (one of: sin, cos, x^2, x^3)
- clt: sample_size (int 5-100), dist_type (one of: uniform, exponential)
- mle: dist_type (one of: normal)
- hypothesis_test: alpha (float e.g. 0.05), test_type (one of: two-tailed, one-tailed)
- standard_error: sample_size (int 10-100)

Rules:
- If the request clearly matches a topic (including via Korean keywords above), set confidence >= 0.7
- If unsure or no match, set topic_id to "unknown" and confidence < 0.6
- explanation must be in Korean, 2-3 sentences describing what will be visualized
- Return ONLY valid JSON, no markdown fences, no extra text

JSON schema:
{{
  "topic_id": "<topic or unknown>",
  "params": {{}},
  "explanation": "<Korean explanation>",
  "confidence": <0.0 to 1.0>
}}"""


def _strip_markdown(text: str) -> str:
    import re
    text = text.strip()
    text = re.sub(r"```[\w]*\n?", "", text).strip()
    return text


def parse_request(message: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set")

    client = genai.Client(api_key=api_key)

    contents: List[types.Content] = []
    for h in history[-6:]:
        role = "user" if h.get("role") == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part(text=h.get("content", ""))]))
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    last_exc: Exception = RuntimeError("no attempts made")
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
            )
            text = _strip_markdown(response.text)
            return json.loads(text)
        except Exception as e:
            last_exc = e
            if attempt < 2:
                time.sleep(2 ** attempt)
    raise last_exc
