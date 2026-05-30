"""Live-Diagnose aus Freitext via OpenAI ChatGPT.

``diagnose(text)`` versucht, aus einer freien Problembeschreibung ein
vollständiges ``device``-Objekt zu erzeugen. Es gilt strikt:

    NIE hart scheitern — die Demo muss laufen.

Ohne ``OPENAI_API_KEY`` oder bei *jedem* Fehler (Netzwerk, ungültiges
JSON, Exception, leeres Ergebnis) gibt es einen sauberen Fallback:
das passendste Seed-Gerät per einfacher Keyword-Heuristik, mit
``source: "fallback"``.
"""

from __future__ import annotations

import json
import os

from . import data
from .schema import DeviceValidationError, normalize_device

DEFAULT_MODEL = "gpt-4o-mini"

# Wörter, die auf eine Mikrowelle (gefährlich) hindeuten
_MIKROWELLE_HINTS = (
    "mikrowelle", "mikro", "microwave", "magnetron", "hochspannung",
    "kondensator", "drehteller", "glasteller", "watt",
)


SYSTEM_PROMPT = """\
Du bist der „Reparatur-Helfer" — ein ruhiger, ehrlicher Freund, der sich mit \
Reparaturen auskennt. Du sprichst einfaches Deutsch, ohne Fachchinesisch, \
ermutigend aber nie schönfärberisch. Du sagst klar, wenn sich etwas nicht \
lohnt oder zu gefährlich ist.

Aus der Problembeschreibung des Nutzers erzeugst du GENAU EIN JSON-Objekt, \
das ein defektes Gerät beschreibt. Gib NICHTS außer diesem JSON aus.

Schema (alle Felder Pflicht, deutsche Texte):
{
  "id": "kurzer-slug",
  "name": "Gerätename",
  "emoji": "ein passendes Emoji",
  "blurb": "kurzer Defekt in einem Satz",
  "detail": "kurze Gerätebeschreibung (Typ/Alter falls bekannt, sonst leer)",
  "accentPath": "gut" | "stop",
  "triage": [ { "q": "Nachfrage?", "hint": "kurzer Tipp",
                "options": [ { "a": "Antworttext", "tag": "kurz-tag" } ] } ],
  "lights": [
    { "key": "Sicherheit",  "icon": "🛡️", "level": "...", "note": "..." },
    { "key": "Aufwand",     "icon": "🔧", "level": "...", "note": "..." },
    { "key": "Kosten",      "icon": "💶", "level": "...", "note": "..." },
    { "key": "Machbarkeit", "icon": "📦", "level": "...", "note": "..." }
  ],
  "verdictTitle": "Kernaussage in einem Satz",
  "verdictBody": "2-3 Sätze Begründung",
  "confidence": { "level": "hoch|mittel|niedrig", "source": "Woher das Wissen kommt",
                  "note": "Unsicherheits-Hinweis" },
  "recommend": "self" | "local" | "pro" | "replace",
  "compare": { "repair": {"geld":"...","zeit":"...","umwelt":"..."},
               "neu":    {"geld":"...","zeit":"...","umwelt":"..."} },
  "steps": [ { "title": "...", "safety": true, "danger": false, "handoff": false,
               "beginner": "ausführliche Erklärung", "pro": "knappe Version",
               "slot": "Bild-Platzhalter-Text" } ],
  "success": { "saved": "≈ X €", "co2": "≈ X kg CO₂", "line": "ein Mutmach-Satz" }
}

Regeln:
- "lights" enthält IMMER genau diese 4 Keys in dieser Reihenfolge.
- "level" ist immer "gut", "mittel" oder "stop".
- 3-4 triage-Fragen, jede mit 2-4 Antwort-Optionen (a + tag).
- 3-6 steps. Vor riskanten Schritten "safety": true bzw. "danger": true setzen.
- "compare" nur ausfüllen, wenn accentPath == "stop"; sonst weglassen.

SICHERHEITS-LEITPLANKE (zwingend):
Bei gefährlichen Geräten — Mikrowelle, alles mit Hochspannung, Gas, \
Innen-Strom, großen Kondensatoren, Akkus mit Brandgefahr — gilt IMMER:
  lights[Sicherheit].level = "stop",
  accentPath = "stop",
  recommend = "pro".
Dann führt der steps-Pfad nur sichere Außen-Checks durch und endet in einem \
Schritt mit "handoff": true (Übergabe an die Werkstatt).
"""


def _fallback(text: str) -> dict:
    """Bestes Seed-Gerät per Keyword-Heuristik."""
    low = (text or "").lower()
    if any(h in low for h in _MIKROWELLE_HINTS):
        device = data.get_device("mikrowelle")
    else:
        device = data.get_device("toaster")
    return {"device": device, "source": "fallback"}


def _build_client():
    """Erzeugt einen OpenAI-Client oder gibt None zurück (kein Key/Lib)."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI
    except Exception:
        return None
    try:
        return OpenAI(api_key=api_key)
    except Exception:
        return None


def diagnose(text: str) -> dict:
    """Diagnostiziert Freitext → ``{"device": {...}, "source": "ai"|"fallback"}``.

    Scheitert nie hart: bei jedem Problem sauberer Seed-Fallback.
    """
    text = (text or "").strip()
    if not text:
        return _fallback(text)

    client = _build_client()
    if client is None:
        return _fallback(text)

    model = os.environ.get("OPENAI_MODEL") or DEFAULT_MODEL

    try:
        response = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            temperature=0.4,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Problembeschreibung: {text}"},
            ],
        )
        content = response.choices[0].message.content
        if not content:
            return _fallback(text)

        raw = json.loads(content)
        device = normalize_device(raw)
        return {"device": device, "source": "ai"}
    except (json.JSONDecodeError, DeviceValidationError):
        return _fallback(text)
    except Exception:
        # Netzwerk, API-Fehler, alles andere — Demo muss laufen.
        return _fallback(text)
