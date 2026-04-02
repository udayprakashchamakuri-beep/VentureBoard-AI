from __future__ import annotations

import json
import os
from typing import List, Sequence, Tuple
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend.config.env import load_local_env
from backend.services.brightdata_client import BrightDataHit, BrightDataResearch


class FirecrawlClient:
    def __init__(self) -> None:
        load_local_env()
        self.api_key = os.getenv("FIRECRAWL_API_KEY", "")
        self.base_url = os.getenv("FIRECRAWL_BASE_URL", "http://localhost:3002").rstrip("/")
        self.timeout = float(os.getenv("FIRECRAWL_TIMEOUT", "4"))
        self.limit = max(1, min(10, int(os.getenv("FIRECRAWL_SEARCH_LIMIT", "3"))))

    def is_configured(self) -> bool:
        return bool(self.api_key and self.base_url)

    def fetch_market_research(self, query_specs: Sequence[Tuple[str, str]]) -> BrightDataResearch:
        if not self.is_configured():
            return BrightDataResearch()

        research = BrightDataResearch()
        seen: set[tuple[str, str]] = set()

        for topic, query in query_specs:
            clean_topic = str(topic or "general").strip().lower()
            clean_query = str(query or "").strip()
            if not clean_query:
                continue
            key = (clean_topic, clean_query.lower())
            if key in seen:
                continue
            seen.add(key)
            research.add_hits(clean_topic, self._run_search(clean_topic, clean_query))

        return research

    def _run_search(self, topic: str, query: str) -> List[BrightDataHit]:
        request = Request(
            url=f"{self.base_url}/v2/search",
            data=json.dumps({"query": query, "limit": self.limit}).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urlopen(request, timeout=self.timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
            return []

        items = self._extract_items(payload)
        hits: List[BrightDataHit] = []
        seen_signatures: set[tuple[str, str]] = set()

        for rank, item in enumerate(items, start=1):
            title = self._clean_text(item.get("title") or item.get("metadata", {}).get("title") or item.get("url"))
            snippet = self._clean_text(
                item.get("markdown")
                or item.get("description")
                or item.get("snippet")
                or item.get("content")
                or item.get("summary")
            )
            url = self._clean_text(item.get("url") or item.get("sourceURL") or item.get("source_url"))
            if not title and not snippet:
                continue

            signature = (title.lower(), snippet.lower())
            if signature in seen_signatures:
                continue
            seen_signatures.add(signature)
            hits.append(
                BrightDataHit(
                    topic=topic,
                    query=query,
                    title=title,
                    snippet=snippet,
                    url=url,
                    rank=rank,
                )
            )

        return hits[: self.limit]

    def _extract_items(self, payload: object) -> List[dict]:
        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]

        if not isinstance(payload, dict):
            return []

        for key in ("data", "results", "items"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]

        if isinstance(payload.get("success"), bool) and isinstance(payload.get("data"), dict):
            data = payload["data"]
            for key in ("results", "data", "items"):
                value = data.get(key)
                if isinstance(value, list):
                    return [item for item in value if isinstance(item, dict)]

        return []

    def _clean_text(self, value: object) -> str:
        if not isinstance(value, str):
            return ""
        return " ".join(value.split())[:320]
