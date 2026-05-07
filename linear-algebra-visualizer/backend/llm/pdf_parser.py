import json
import os
import re
import time
from pathlib import Path
from typing import Any, Dict

from google import genai
from google.genai import types

SUPPORTED_TOPICS = [
    "eigenvalue", "linear_transform", "determinant", "basis_change",
    "taylor_series", "fourier", "derivative",
    "clt", "mle", "hypothesis_test", "standard_error",
]

EXTRACT_PROMPT = f"""You are a math lecture analyzer. Extract key mathematical concepts from the provided lecture PDF.

Available visualization scene IDs — use EXACTLY one of these for each concept's topic_id:
{', '.join(SUPPORTED_TOPICS)}

Scene parameter schemas (provide params matching the chosen scene):
- eigenvalue / linear_transform / determinant / basis_change: {{"matrix_2x2": [[2,1],[1,2]]}}
- taylor_series: {{"function": "sin", "center": 0, "degree": 5}}  (function: sin|cos|exp|x^2)
- fourier: {{"num_terms": 5}}
- derivative: {{"function": "x^2"}}  (function: sin|cos|x^2|x^3)
- clt: {{"sample_size": 30, "dist_type": "uniform"}}  (dist_type: uniform|exponential)
- mle: {{"dist_type": "normal"}}
- hypothesis_test: {{"alpha": 0.05, "test_type": "two-tailed"}}  (test_type: two-tailed|one-tailed)
- standard_error: {{"sample_size": 30}}

Instructions:
1. Read the lecture content and extract 3-5 key mathematical concepts
2. For each concept pick the BEST matching scene_id from the list above
3. Write a clear Korean title and 1-2 sentence Korean description
4. Infer a Korean lecture title from the content

Return ONLY valid JSON (no markdown fences, no extra text):
{{
  "lecture_title": "강의 제목 (Korean)",
  "concepts": [
    {{
      "id": "concept-1",
      "title": "개념 제목 (Korean)",
      "description": "설명 1-2문장 (Korean)",
      "topic_id": "<one scene_id from the list above>",
      "params": {{}}
    }}
  ]
}}"""


def _strip_markdown(text: str) -> str:
    text = text.strip()
    text = re.sub(r"```[\w]*\n?", "", text).strip()
    return text


def extract_concepts_from_pdf(pdf_path: Path) -> Dict[str, Any]:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set")

    client = genai.Client(api_key=api_key)

    uploaded = client.files.upload(file=str(pdf_path))

    last_exc: Exception = RuntimeError("no attempts made")
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Content(parts=[
                        types.Part(file_data=types.FileData(
                            file_uri=uploaded.uri,
                            mime_type="application/pdf",
                        )),
                        types.Part(text=EXTRACT_PROMPT),
                    ]),
                ],
            )
            text = _strip_markdown(response.text)
            return json.loads(text)
        except Exception as e:
            last_exc = e
            if attempt < 2:
                time.sleep(2 ** attempt)

    try:
        client.files.delete(name=uploaded.name)
    except Exception:
        pass

    raise last_exc
