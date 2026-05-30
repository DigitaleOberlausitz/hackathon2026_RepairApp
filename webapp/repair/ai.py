"""Live-Diagnose aus Freitext via lokales LLM (Ollama) oder OpenAI ChatGPT.

``diagnose(text)`` versucht, aus einer freien Problembeschreibung ein
vollständiges ``device``-Objekt zu erzeugen. Es gilt strikt:

    NIE hart scheitern — die Demo muss laufen.

Backend-Auswahl (in dieser Prioritätsreihenfolge, über Umgebungsvariablen):

  1. **Lokaler Ollama** — wenn ``OLLAMA_BASE_URL`` gesetzt ist
     (OpenAI-kompatibel, z. B. ``http://localhost:11434/v1``).
     Modell aus ``DIAGNOSE_MODEL`` → ``OLLAMA_MODEL`` → ``qwen3:8b``.
  2. **OpenAI-Cloud** — wenn ``OPENAI_API_KEY`` gesetzt ist.
     Modell aus ``DIAGNOSE_MODEL`` → ``OPENAI_MODEL`` → ``gpt-4o-mini``.
  3. **Kein Backend** — sauberer Seed-Fallback.

Ohne Backend oder bei *jedem* Fehler (Netzwerk, ungültiges JSON, Exception,
leeres Ergebnis) gibt es den Fallback: das passendste Seed-Gerät per einfacher
Keyword-Heuristik, mit ``source: "fallback"``.
"""

from __future__ import annotations

import json
import os
import re

from . import data
from .schema import DeviceValidationError, normalize_device

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
DEFAULT_OLLAMA_MODEL = "qwen3:8b"
DEFAULT_TIMEOUT = 180.0  # s — CPU-Inferenz braucht länger als die Cloud

# Reasoning-Modelle (z. B. Qwen3) liefern teils <think>…</think>-Blöcke vor
# dem JSON. Die schneiden wir defensiv heraus, bevor wir parsen.
_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)
_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$", re.IGNORECASE)

# Wörter, die auf eine Mikrowelle (gefährlich) hindeuten
_MIKROWELLE_HINTS = (
    "mikrowelle", "mikro", "microwave", "magnetron", "hochspannung",
    "kondensator", "drehteller", "glasteller", "watt",
)

# Konfidenz-Score-Mapping (PROJ-4, STUFE1.md §2)
# "unklar" → 0.1 liegt bewusst unter der unclear-Schwelle (< 0.3),
# damit die KI durch level="unklar" diagnosis.status="unclear" auslösen kann (FIX F).
_CONFIDENCE_SCORE: dict[str, float] = {
    "hoch": 0.85,
    "mittel": 0.6,
    "niedrig": 0.35,
    "unklar": 0.1,
}
_CONFIDENCE_SCORE_DEFAULT = 0.5

# Status-Schwellen (STUFE1.md §2):
#   score < 0.30             → "unclear"
#   0.30 ≤ score < 0.55      → "low"   (Grenzwert 0.30 inklusiv unten → low)
#   score ≥ 0.55             → "ok"
_UNCLEAR_THRESHOLD = 0.3
_LOW_THRESHOLD = 0.55


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
  "confidence": { "level": "hoch|mittel|niedrig|unklar", "source": "Woher das Wissen kommt",
                  "note": "Unsicherheits-Hinweis" },
  "recommend": "self" | "local" | "pro" | "replace",
  "compare": {
    "repair":    {"geld":"...","zeit":"...","umwelt":"...","hinweis":""},
    "pro":       {"geld":"...","zeit":"...","umwelt":"...","hinweis":""},
    "neu":       {"geld":"...","zeit":"...","umwelt":"...",
                  "versteckt":["Neueinrichtung","Transport/Logistik","Bedienung neu lernen","Verkabelung","Ausfallzeit"]},
    "entsorgung":{"geld":"...","zeit":"...","umwelt":"...","hinweis":""},
    "empfehlung": "repair|pro|neu|entsorgung",
    "begruendung": "Text, der den Zielkonflikt transparent macht",
    "geschaetzt": true
  },
  "steps": [ { "title": "...", "safety": true, "danger": false, "handoff": false,
               "beginner": "ausführliche Erklärung", "pro": "knappe Version",
               "slot": "Bild-Platzhalter-Text" } ],
  "success": { "saved": "≈ X €", "co2": "≈ X kg CO₂", "line": "ein Mutmach-Satz" }
}

Regeln:
- "lights" enthält IMMER genau diese 4 Keys in dieser Reihenfolge.
- "level" der Lichter ist immer "gut", "mittel" oder "stop".
- confidence.level ist "hoch", "mittel", "niedrig" oder "unklar".
  Verwende "unklar", wenn die Ursache nicht seriös eingrenzbar ist (vage \
Beschreibung, widersprüchliche Symptome, zu wenig Information).
- 3-4 triage-Fragen, jede mit 2-4 Antwort-Optionen (a + tag).
- 3-6 steps. Vor riskanten Schritten "safety": true bzw. "danger": true setzen.
- "compare" IMMER ausfüllen (alle 4 Pfade: repair/pro/neu/entsorgung), \
empfehlung+begruendung setzen, geschaetzt:true. \
Wenn ein Pfad nicht sinnvoll machbar ist: geld/zeit/umwelt mit "— (nicht sinnvoll)".
- neu.versteckt ist eine Liste versteckter Folgekosten \
(die 5 Standard-Posten + ggf. gerätespezifische).

SICHERHEITS-LEITPLANKE (zwingend):
Bei gefährlichen Geräten — Mikrowelle, alles mit Hochspannung, Gas, \
Innen-Strom, großen Kondensatoren, Akkus mit Brandgefahr — gilt IMMER:
  lights[Sicherheit].level = "stop",
  accentPath = "stop",
  recommend = "pro".
Dann führt der steps-Pfad nur sichere Außen-Checks durch und endet in einem \
Schritt mit "handoff": true (Übergabe an die Werkstatt).
"""


def _is_dangerous(device: dict) -> bool:
    """True, wenn das device als gefährlich (stop) eingestuft ist."""
    if not isinstance(device, dict):
        return False
    if str(device.get("accentPath", "")).lower() == "stop":
        return True
    lights = device.get("lights") if isinstance(device.get("lights"), list) else []
    for light in lights:
        if isinstance(light, dict) and light.get("key") == "Sicherheit" \
                and str(light.get("level", "")).lower() == "stop":
            return True
    return False


def _build_trust(source: str, score: float, device: dict | None = None) -> dict:
    """Vertrauens-Indikator (PROJ-25 / D3) — {level, source, reason}.

    Reproduzierbares Mapping (STUFE2.md §2):
      source == "fallback"        → level="niedrig", source="KI-Fallback"
      source in {"seed","kuratiert"} → level="hoch", source="kuratiert"
      source == "tech_error"      → level="niedrig", source="KI-Fallback"
      KI-Antwort, score >= 0.8    → "hoch"
      KI-Antwort, 0.5 <= score    → "mittel"
      sonst                       → "niedrig"
    Bei gefährlichen Geräten (stop) wird die Begründung verschärft.
    """
    s = (source or "").strip().lower()

    if s == "fallback":
        trust = {
            "level": "niedrig",
            "source": "KI-Fallback",
            "reason": "Kein KI-Backend erreichbar — passendstes Beispielgerät als Näherung. Bitte selbst prüfen.",
        }
    elif s in ("seed", "kuratiert"):
        trust = {
            "level": "hoch",
            "source": "kuratiert",
            "reason": "Kuratierte, geprüfte Beispieldaten.",
        }
    elif s == "tech_error":
        trust = {
            "level": "niedrig",
            "source": "KI-Fallback",
            "reason": "Technischer Fehler bei der Diagnose — Einschätzung nicht belastbar.",
        }
    else:  # "ai"
        if score >= 0.8:
            level = "hoch"
        elif score >= 0.5:
            level = "mittel"
        else:
            level = "niedrig"
        trust = {
            "level": level,
            "source": "KI-Einschätzung",
            "reason": "Einschätzung aus der Ferne durch die KI — bitte mit Vorsicht behandeln.",
        }

    if _is_dangerous(device):
        trust["reason"] = (
            "⚠ Gefahr erkannt (Hochspannung/Strom/Gas) — nicht selbst öffnen. " + trust["reason"]
        )

    return trust


def _build_diagnosis(device: dict, source: str, is_tech_error: bool = False) -> dict:
    """Erzeugt das diagnosis-Objekt (PROJ-4 + PROJ-25) aus device.confidence.level.

    Score-Mapping: hoch=0.85, mittel=0.6, niedrig=0.35, unklar=0.1, sonst 0.5.
    Status-Schwellen (STUFE1.md §2):
      score < 0.30        → "unclear"
      0.30 ≤ score < 0.55 → "low"   (Grenzwert 0.30 inklusiv unten → low)
      score ≥ 0.55        → "ok"
      technischer Fehler  → "tech_error"
    Zusätzlich (PROJ-25): ``trust`` = {level, source, reason}.
    """
    if is_tech_error:
        return {
            "status": "tech_error",
            "score": 0.0,
            "reason": "Technischer Fehler bei der Diagnose — bitte erneut versuchen.",
            "trust": _build_trust("tech_error", 0.0, device),
        }

    conf = device.get("confidence") if isinstance(device, dict) else {}
    conf = conf if isinstance(conf, dict) else {}
    level = str(conf.get("level", "")).strip().lower()
    score = _CONFIDENCE_SCORE.get(level, _CONFIDENCE_SCORE_DEFAULT)

    if score < _UNCLEAR_THRESHOLD:
        status = "unclear"
        reason = (
            "Keine verlässliche Eingrenzung möglich — "
            "Symptome oder Beschreibung reichen fuer eine sichere Diagnose nicht aus."
        )
    elif score < _LOW_THRESHOLD:
        status = "low"
        note = str(conf.get("note", "")).strip()
        reason = ("Diagnose mit eingeschraenkter Sicherheit. " + note).strip()
    else:
        status = "ok"
        src = str(conf.get("source", "")).strip()
        reason = ("Diagnose verlässlich — " + src).strip(" —")

    return {
        "status": status,
        "score": round(score, 4),
        "reason": reason,
        "trust": _build_trust(source, score, device),
    }


def seed_diagnosis(device: dict) -> dict:
    """Diagnosis-Objekt für ein direkt gewähltes Seed-Gerät (kuratiert).

    Setzt ``trust`` über den Seed-Zweig (level="hoch", source="kuratiert").
    Status/Score folgen der hinterlegten ``device.confidence`` wie sonst auch.
    Damit ist ein direkt geöffnetes Seed-Gerät backend-seitig korrekt als
    hoch/kuratiert markiert (PROJ-25 / DoD-4).
    """
    return _build_diagnosis(device, "seed")


def _fallback(text: str) -> dict:
    """Bestes Seed-Gerät per Keyword-Heuristik + diagnosis-Objekt."""
    low = (text or "").lower()
    if any(h in low for h in _MIKROWELLE_HINTS):
        device = data.get_device("mikrowelle")
    else:
        device = data.get_device("toaster")
    diagnosis = _build_diagnosis(device, "fallback")
    return {"device": device, "source": "fallback", "diagnosis": diagnosis}


def _clean_json_text(content: str) -> str:
    """Entfernt <think>-Blöcke und ```json-Fences vor dem Parsen."""
    content = _THINK_RE.sub("", content or "").strip()
    content = _FENCE_RE.sub("", content).strip()
    return content


def _resolve_backend():
    """Liefert ``(client, model, is_local)`` — oder ``(None, None, False)``.

    Reihenfolge: lokaler Ollama (``OLLAMA_BASE_URL``) vor OpenAI-Cloud
    (``OPENAI_API_KEY``). ``is_local`` ist True für Ollama (→ Thinking aus).
    Gibt ``(None, None, False)`` zurück, wenn weder Backend konfiguriert ist
    noch die ``openai``-Lib verfügbar ist → Fallback.

    ``max_retries=0``: Auf der langsamen CPU darf ein Timeout sich nicht durch
    SDK-Retries verdreifachen — lieber einmal sauber scheitern → Fallback.
    """
    try:
        from openai import OpenAI
    except Exception:
        return None, None, False

    base_url = (os.environ.get("OLLAMA_BASE_URL") or "").strip()
    api_key = os.environ.get("OPENAI_API_KEY")

    # 1. Lokaler Ollama (OpenAI-kompatibel) — kein echter Key nötig
    if base_url:
        model = (
            os.environ.get("DIAGNOSE_MODEL")
            or os.environ.get("OLLAMA_MODEL")
            or DEFAULT_OLLAMA_MODEL
        )
        try:
            client = OpenAI(
                base_url=base_url, api_key=api_key or "ollama", max_retries=0
            )
            return client, model, True
        except Exception:
            return None, None, False

    # 2. OpenAI-Cloud
    if api_key:
        model = (
            os.environ.get("DIAGNOSE_MODEL")
            or os.environ.get("OPENAI_MODEL")
            or DEFAULT_OPENAI_MODEL
        )
        try:
            client = OpenAI(api_key=api_key, max_retries=0)
            return client, model, False
        except Exception:
            return None, None, False

    # 3. Kein Backend
    return None, None, False


def diagnose(
    text: str,
    kategorie: str = "",
    answers: list | None = None,
    lang: str = "de",
) -> dict:
    """Diagnostiziert Freitext → ``{"device": {...}, "source": "ai"|"fallback", "diagnosis": {...}}``.

    Scheitert nie hart: bei jedem Problem sauberer Seed-Fallback.
    diagnosis enthält {status, score, reason, trust} (PROJ-4/25) und additiv:
    {kandidaten, abgrenzung, unklar} (PROJ-17).

    Signatur additiv erweitert: bestehende Aufrufe ``diagnose(text)`` bleiben gültig.
    """
    text = (text or "").strip()
    if not text:
        result = _fallback(text)
        result["diagnosis"] = _add_kuratierte_felder(result["diagnosis"], text, kategorie, answers, lang)
        return result

    client, model, is_local = _resolve_backend()
    if client is None:
        result = _fallback(text)
        result["diagnosis"] = _add_kuratierte_felder(result["diagnosis"], text, kategorie, answers, lang)
        return result

    try:
        timeout = float(os.environ.get("LLM_TIMEOUT") or DEFAULT_TIMEOUT)
    except (TypeError, ValueError):
        timeout = DEFAULT_TIMEOUT

    # Qwen3 & Co. erzeugen sonst lange <think>-Ketten vor dem JSON — auf der CPU
    # zu teuer. "/no_think" schaltet das für lokale Modelle ab (harmlos für
    # andere); für die Cloud bleibt der Prompt unverändert.
    # Sprachdirektive (PROJ-24): KI antwortet in der gewählten Sprache.
    from .i18n import lang_directive, ist_falsche_sprache
    lang_hint = lang_directive(lang)
    system_prompt = SYSTEM_PROMPT + f"\n\n{lang_hint}"
    if is_local:
        system_prompt += "\n\n/no_think"

    try:
        response = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            temperature=0.4,
            timeout=timeout,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Problembeschreibung: {text}"},
            ],
        )
        content = response.choices[0].message.content
        if not content:
            result = _fallback(text)
            result["diagnosis"] = _add_kuratierte_felder(result["diagnosis"], text, kategorie, answers, lang)
            return result

        # Sprach-Prüfung (heuristisch) — bei falscher Sprache einmalig wiederholen
        if ist_falsche_sprache(content, lang):
            try:
                response2 = client.chat.completions.create(
                    model=model,
                    response_format={"type": "json_object"},
                    temperature=0.4,
                    timeout=timeout,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Problembeschreibung: {text}"},
                    ],
                )
                content2 = response2.choices[0].message.content
                if content2:
                    content = content2
            except Exception:
                pass  # Ersten Versuch behalten

        raw = json.loads(_clean_json_text(content))
        device = normalize_device(raw)
        diagnosis = _build_diagnosis(device, "ai")
        diagnosis = _add_kuratierte_felder(diagnosis, text, kategorie, answers, lang)
        return {"device": device, "source": "ai", "diagnosis": diagnosis}
    except (json.JSONDecodeError, DeviceValidationError):
        result = _fallback(text)
        result["diagnosis"] = _add_kuratierte_felder(result["diagnosis"], text, kategorie, answers, lang)
        return result
    except Exception:
        # Netzwerk, API-Fehler, alles andere — Demo muss laufen.
        result = _fallback(text)
        result["diagnosis"] = _add_kuratierte_felder(result["diagnosis"], text, kategorie, answers, lang)
        return result


def _add_kuratierte_felder(
    diagnosis: dict,
    text: str,
    kategorie: str,
    answers: list | None,
    lang: str,
) -> dict:
    """Ergänzt die kuratierte Diagnose-Felder additiv (PROJ-17).

    Bestehende Felder (status, score, reason, trust) bleiben UNVERÄNDERT.
    Fügt hinzu: kandidaten, abgrenzung, unklar.
    """
    try:
        from . import diagnose_kuratiert
        kuratiert = diagnose_kuratiert.diagnose(
            text=text,
            kategorie=kategorie or "",
            answers=answers,
            lang=lang,
        )
        diagnosis["kandidaten"] = kuratiert.get("kandidaten", [])
        diagnosis["abgrenzung"] = kuratiert.get("abgrenzung", {"offen": []})
        diagnosis["unklar"] = kuratiert.get("unklar", False)
    except Exception:
        # Niemals hart scheitern — Felder mit sicheren Defaults auffüllen
        diagnosis.setdefault("kandidaten", [])
        diagnosis.setdefault("abgrenzung", {"offen": []})
        diagnosis.setdefault("unklar", False)
    return diagnosis
