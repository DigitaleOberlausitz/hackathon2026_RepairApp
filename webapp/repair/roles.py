# webapp/repair/roles.py
"""Rollen-Registry: liest docs/runtime-roles/*.md (Frontmatter + Body).

Katalog (Name/Description/Class) ist der stabile Prompt-Präfix; die Volltexte
werden on-demand via lade_rolle() in den Modell-Kontext gegeben (Progressive
Disclosure). Pfad ist paket-relativ abgeleitet (Layout, kein .env-Wert).
"""
from __future__ import annotations

import os
import re
import threading

# webapp/repair/roles.py -> ../../docs/runtime-roles
_ROLES_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "docs", "runtime-roles")
)
_FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)
_lock = threading.Lock()
_cache: dict[str, dict] = {}  # name -> {"meta": {...}, "body": str, "mtime": float}


def _parse(text: str) -> tuple[dict, str]:
    m = _FM_RE.match(text)
    if not m:
        return {}, text.strip()
    fm_raw, body = m.group(1), m.group(2)
    meta: dict[str, str] = {}
    for line in fm_raw.splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
    return meta, body.strip()


def _load_file(name: str) -> dict:
    path = os.path.join(_ROLES_DIR, f"{name}.md")
    mtime = os.path.getmtime(path)
    with open(path, encoding="utf-8") as fh:
        meta, body = _parse(fh.read())
    return {"meta": meta, "body": body, "mtime": mtime}


def _entry(name: str) -> dict:
    path = os.path.join(_ROLES_DIR, f"{name}.md")
    if not os.path.isfile(path):
        raise KeyError(name)
    with _lock:
        cached = _cache.get(name)
        if cached is None or os.path.getmtime(path) != cached["mtime"]:
            cached = _load_file(name)
            _cache[name] = cached
        return cached


def _alle_namen() -> list[str]:
    return sorted(
        f[:-3] for f in os.listdir(_ROLES_DIR)
        if f.endswith(".md") and f != "README.md"
    )


def katalog() -> list[dict]:
    out = []
    for name in _alle_namen():
        meta = _entry(name)["meta"]
        out.append({
            "name": meta.get("name", name),
            "description": meta.get("description", ""),
            "class": meta.get("class", ""),
        })
    return out


def lade_rolle(name: str) -> str:
    return _entry(name)["body"]
