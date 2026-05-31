"""Live-Diagnose aus Freitext via OpenAI ChatGPT.

``diagnose(text)`` versucht, aus einer freien Problembeschreibung ein
vollständiges ``device``-Objekt zu erzeugen. Die Diagnose funktioniert
**ausschließlich** mit der OpenAI-Cloud — es gibt keine hinterlegten
Demo-/Seed-Geräte und keinen Keyword-Fallback mehr.

Backend (über Umgebungsvariablen):

  - **OpenAI-Cloud** — wenn ``OPENAI_API_KEY`` gesetzt ist.
    Modell aus ``OPENAI_MODEL`` → Default ``gpt-4o-mini``.

Ohne gesetzten Key oder bei einem Fehler (Netzwerk, ungültiges JSON,
Exception, leeres Ergebnis) liefert ``diagnose`` ein Fehler-Objekt
(``{"error": ..., "code": ...}``); ``app.py`` übersetzt das in einen passenden
HTTP-Status und das Frontend zeigt einen sauberen Hinweis. Es wird nie hart
gescheitert (kein Crash), aber auch nichts erfunden.
"""

from __future__ import annotations

import json
import logging
import os
import re

from . import config
from .schema import DeviceValidationError, normalize_device

log = logging.getLogger(__name__)

# Freitext fürs Log kürzen, damit sehr lange Eingaben das Log nicht fluten.
_LOG_TEXT_MAX = 200


def _kurz(text: str) -> str:
    text = (text or "").replace("\n", " ")
    if len(text) > _LOG_TEXT_MAX:
        return text[:_LOG_TEXT_MAX] + f"… [+{len(text) - _LOG_TEXT_MAX} Zeichen]"
    return text

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
# Der LLM-Timeout (LLM_TIMEOUT) wird zentral in repair/config.py verwaltet
# (config.DEFAULT_LLM_TIMEOUT) — kein zweiter Default hier (PROJ-30).

# Manche Modelle stellen dem JSON <think>…</think>-Blöcke voran. Die schneiden
# wir defensiv heraus, bevor wir parsen.
_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)
_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$", re.IGNORECASE)

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

    Reproduzierbares Mapping:
      source == "tech_error"      → level="niedrig", source="KI-Fallback"
      KI-Antwort, score >= 0.8    → "hoch"
      KI-Antwort, 0.5 <= score    → "mittel"
      sonst                       → "niedrig"
    Bei gefährlichen Geräten (stop) wird die Begründung verschärft.
    """
    s = (source or "").strip().lower()

    if s == "tech_error":
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


def _error(message: str, code: str) -> dict:
    """Einheitliches Fehler-Objekt für den Aufrufer (app.py)."""
    return {"error": message, "code": code}


def _clean_json_text(content: str) -> str:
    """Entfernt <think>-Blöcke und ```json-Fences vor dem Parsen."""
    content = _THINK_RE.sub("", content or "").strip()
    content = _FENCE_RE.sub("", content).strip()
    return content


def _resolve_backend():
    """Liefert ``(client, model)`` — oder ``(None, None)``.

    OpenAI-Cloud via ``OPENAI_API_KEY``; Modell aus ``OPENAI_MODEL`` (Default
    ``gpt-4o-mini``). Gibt ``(None, None)`` zurück, wenn kein Key gesetzt ist
    oder die ``openai``-Lib fehlt → Fehler-Objekt (``no_backend``).

    ``max_retries=0``: Ein Timeout soll sich nicht durch SDK-Retries
    vervielfachen — lieber einmal sauber scheitern.
    """
    try:
        from openai import OpenAI
    except Exception:
        return None, None

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None, None

    model = os.environ.get("OPENAI_MODEL") or DEFAULT_OPENAI_MODEL
    try:
        client = OpenAI(api_key=api_key, max_retries=0)
        return client, model
    except Exception:
        return None, None


def diagnose(
    text: str,
    kategorie: str = "",
    answers: list | None = None,
    lang: str = "de",
    extraktion: dict | None = None,
    bilder: list | None = None,
) -> dict:
    """Diagnostiziert Freitext → ``{"device": {...}, "source": "ai", "diagnosis": {...}}``.

    Ohne konfiguriertes LLM-Backend oder bei einem Fehler ein Fehler-Objekt
    ``{"error": ..., "code": ...}`` (siehe Modul-Docstring). diagnosis enthält bei
    Erfolg {status, score, reason, trust} (PROJ-4/25) und additiv:
    {kandidaten, abgrenzung, unklar} (PROJ-17).

    PROJ-31 (additiv): ``extraktion`` (vom Nutzer bestätigte Felder aus Fotos/
    Dokumenten) wird in den Prompt eingespeist; ``bilder`` (Liste von Bild-Data-URLs)
    fließt als Bild-Evidenz in einen multimodalen Vision-Call. Sind beide leer/None,
    verhält sich die Funktion **exakt wie zuvor** (reine Text-Diagnose, gleiches
    Schema, gleiches Fehlerverhalten). Schlägt die Bildauswertung fehl bzw. ist kein
    Vision-Backend da, läuft die Text-Diagnose weiter und ``diagnosis.vision`` vermerkt
    das (kein hartes Scheitern, D15). Backend ist durchgehend OpenAI (gpt-4o-… kann
    Vision); ``VISION_MODEL`` kann das Vision-Modell übersteuern.

    Signatur additiv erweitert: bestehende Aufrufe ``diagnose(text)`` bleiben gültig.
    """
    text = (text or "").strip()
    bilder = [b for b in (bilder or []) if isinstance(b, str) and b.startswith("data:")]
    log.debug("Diagnose-Anfrage: kategorie=%r lang=%s bilder=%d text=%r",
              kategorie, lang, len(bilder), _kurz(text))

    # PROJ-31: bestätigte Extraktionsfelder als verbindlichen Kontext einspeisen.
    vision_kontext = ""
    if extraktion:
        try:
            from . import vision
            vision_kontext = vision.baue_vision_kontext(extraktion)
        except Exception:
            vision_kontext = ""

    if not text and not bilder and not vision_kontext:
        log.info("Diagnose ohne Freitext/Bild → Fehler (empty).")
        return _error("Bitte beschreibe zuerst, was kaputt ist.", "empty")

    # Backend-Wahl: mit Bildern zuerst das Vision-Modell (OpenAI), sonst Text-Modell.
    client = model = None
    vision_aktiv = False
    vision_hinweis = ""
    if bilder:
        try:
            from . import vision
            client, model = vision._resolve_vision_backend()
        except Exception:
            client = None
        if client is not None:
            vision_aktiv = True
        else:
            vision_hinweis = (
                "Kein Vision-Backend verfügbar — das Bild wurde nicht ausgewertet; "
                "die Diagnose nutzt nur Text und deine Angaben."
            )
    if client is None:
        client, model = _resolve_backend()
    if client is None:
        log.info("Kein OpenAI-Key konfiguriert/verfügbar → Fehler (no_backend).")
        return _error(
            "Es ist kein OpenAI-Key konfiguriert (OPENAI_API_KEY) — die "
            "Diagnose ist deshalb nicht verfügbar.",
            "no_backend",
        )
    log.debug("KI-Backend: OpenAI-Cloud, Modell=%s, Vision=%s", model, vision_aktiv)

    # PROJ-30: Timeout aus .env (LLM_TIMEOUT), zentral validiert; Default 180 s.
    timeout = config.llm_timeout()

    # Sprachdirektive (PROJ-24): KI antwortet in der gewählten Sprache.
    from .i18n import lang_directive, ist_falsche_sprache
    lang_hint = lang_directive(lang)
    system_prompt = SYSTEM_PROMPT + f"\n\n{lang_hint}"

    # Benutzer-Nachricht: Text-only bleibt bit-identisch zu früher; nur mit
    # Extraktions-Kontext und/oder Bildern weicht der Aufbau ab (PROJ-31).
    user_text = f"Problembeschreibung: {text}"
    if vision_kontext:
        user_text += "\n\n" + vision_kontext
    if vision_aktiv and bilder:
        user_content = [{"type": "text", "text": user_text}]
        for url in bilder:
            user_content.append({"type": "image_url", "image_url": {"url": url}})
    else:
        user_content = user_text

    def _vision_marker(diag: dict) -> dict:
        # Additiver Vermerk nur, wenn Bild/Extraktion im Spiel war (sonst Schema
        # exakt wie zuvor).
        if bilder or extraktion:
            diag["vision"] = {
                "einbezogen": bool(vision_aktiv and bilder),
                "medienAnzahl": len(bilder),
                "hinweis": vision_hinweis,
            }
        return diag

    try:
        response = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            temperature=0.4,
            timeout=timeout,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        )
        # PROJ-28: Token-Usage des echten KI-Calls fürs Anfrage-Protokoll melden.
        try:
            from . import protokoll_log
            protokoll_log.merke_usage(model, getattr(response, "usage", None))
        except Exception:
            pass
        content = response.choices[0].message.content
        if not content:
            return _error("Die KI hat keine Antwort geliefert. Bitte versuch es noch einmal.", "ai_error")

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
                        {"role": "user", "content": user_content},
                    ],
                )
                content2 = response2.choices[0].message.content
                if content2:
                    content = content2
                    try:
                        from . import protokoll_log
                        protokoll_log.merke_usage(model, getattr(response2, "usage", None))
                    except Exception:
                        pass
            except Exception:
                pass  # Ersten Versuch behalten

        raw = json.loads(_clean_json_text(content))
        device = normalize_device(raw)
        diagnosis = _build_diagnosis(device, "ai")
        diagnosis = _add_kuratierte_felder(diagnosis, text, kategorie, answers, lang)
        diagnosis = _vision_marker(diagnosis)
        log.info("Diagnose-Quelle=ai — Modell=%s, Gerät=%r, gefährlich=%s, vision=%s.",
                 model, (device or {}).get("id"), _is_dangerous(device), vision_aktiv)
        return {"device": device, "source": "ai", "diagnosis": diagnosis}
    except (json.JSONDecodeError, DeviceValidationError) as exc:
        log.warning("KI-Antwort unbrauchbar (%s: %s) → Fehler (ai_error).", type(exc).__name__, exc)
        return _error("Die KI-Antwort war unbrauchbar. Bitte versuch es noch einmal.", "ai_error")
    except Exception as exc:
        # Netzwerk, API-Fehler, alles andere — kein Crash, aber ehrlicher Fehler.
        log.warning("KI-Call fehlgeschlagen (%s: %s) → Fehler (ai_error).", type(exc).__name__, exc)
        return _error("Die Diagnose ist fehlgeschlagen. Bitte versuch es später noch einmal.", "ai_error")


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
