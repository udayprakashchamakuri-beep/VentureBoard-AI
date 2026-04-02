from __future__ import annotations

import re

_TRANSCRIPT_MESSAGE_RE = re.compile(
    r"Message\s+\d+(?:\s+to\s+[^:]+)?:\s*(.*?)(?=\nMessage\s+\d+(?:\s+to\s+[^:]+)?:|\n\nAdditional background:|\Z)",
    flags=re.IGNORECASE | re.DOTALL,
)


def extract_primary_prompt(text: str) -> str:
    raw_text = str(text or "").strip()
    if not raw_text:
        return ""

    messages = [
        re.sub(r"\s+", " ", match.group(1)).strip()
        for match in _TRANSCRIPT_MESSAGE_RE.finditer(raw_text)
        if match.group(1).strip()
    ]
    if messages:
        return messages[-1]

    return raw_text
