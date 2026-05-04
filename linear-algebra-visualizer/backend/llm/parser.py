import json
import os
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
- If the request clearly matches a topic, set confidence >= 0.7
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

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
    )

    text = _strip_markdown(response.text)
    return json.loads(text)
