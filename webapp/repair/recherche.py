"""Recherche-Modul (PROJ-16): kuratiert → KI-Fallback → Online (SearXNG optional).

Öffentliche API:
    recherche(frage, kontext, lang) → {aussage, herkunft, quelle, konfidenz, widerspruch, online, nurDeutsch}

Reihenfolge (D2): kuratiert → KI-Fallback → online (SearXNG, nur wenn SEARXNG_URL gesetzt).
Sobald ein kuratierter Eintrag greift, wird der Online-Pfad NICHT betreten.
Trifft keine Ursachen-Einschätzung, Ampel-Bewertung oder Pfad-Empfehlung — nur belegtes Material.
Quelle + Konfidenz sind NIEMALS leer.
"""

from __future__ import annotations

import logging
import os
import re

from . import wissensbasis as _wb
from .i18n import t

log = logging.getLogger(__name__)


def recherche(
    frage: str,
    kontext: str | None = None,
    lang: str = "de",
) -> dict:
    """Recherche: kuratiert → KI-Fallback → Online.

    Gibt immer zurück:
      {aussage, herkunft:"kuratiert|ki-fallback|online", quelle, konfidenz,
       widerspruch:bool, online:bool, nurDeutsch:bool}
    """
    frage = (frage or "").strip()
    lang = (lang or "de").strip().lower()
    log.info("Recherche gestartet: lang=%s frage=%r", lang, frage[:120])

    # 1. Kuratierte Suche
    kuratiert = _suche_kuratiert(frage, kontext)
    if kuratiert:
        log.info("Recherche-Ergebnis: herkunft=kuratiert quelle=%s", kuratiert.get("quelle"))
        return {
            "aussage": kuratiert["aussage"],
            "herkunft": "kuratiert",
            "quelle": kuratiert["quelle"],
            "konfidenz": "hoch",
            "widerspruch": False,
            "online": False,
            "nurDeutsch": True,  # Seed-Inhalte nur Deutsch
        }

    # 2. Online (SearXNG), nur wenn konfiguriert
    searxng_url = (os.environ.get("SEARXNG_URL") or "").strip()
    if searxng_url:
        log.debug("Recherche: Online-Suche via SearXNG (%s)", searxng_url)
        online_result = _suche_online(frage, searxng_url, lang)
        if online_result:
            log.info("Recherche-Ergebnis: herkunft=online quelle=%s", online_result.get("quelle"))
            return online_result

    # 3. KI-Fallback (Heuristik, keine echte KI ohne Key)
    log.info("Recherche-Ergebnis: herkunft=ki-fallback (kein kuratierter/Online-Treffer)")
    return _ki_fallback(frage, lang)


# ─── Interne Helfer ───────────────────────────────────────────────────────────


def _keywords(text: str) -> set[str]:
    """Wörter > 3 Zeichen aus Text extrahieren."""
    return {w.lower().strip(".,;:!?") for w in re.split(r"\s+", text or "") if len(w) > 3}


def _suche_kuratiert(frage: str, kontext: str | None) -> dict | None:
    """Prüft die Wissensbasis auf relevante Einträge.

    Liefert aussage + quelle wenn ein geprueft-Eintrag passt.
    Keine Ampel-Bewertung, nur belegtes Material.
    """
    frage_kw = _keywords(frage)
    if kontext:
        frage_kw |= _keywords(kontext)
    if not frage_kw:
        return None

    best_score = 0
    best_entry: dict | None = None

    for entry in wissensbasis.list_fehlerzustaende("geprueft", None):
        syms = {s.lower() for s in entry.get("symptome", [])}
        ursache_kw = _keywords(entry.get("ursache", ""))
        entry_kw = syms | ursache_kw
        score = len(frage_kw & entry_kw)
        if score > best_score:
            best_score = score
            best_entry = entry

    if best_entry and best_score >= 1:
        ursache = best_entry.get("ursache", "Ursache aus Wissensbasis")
        anleitung = best_entry.get("anleitung") or ""
        aussage = ursache
        if anleitung:
            aussage += f". Empfehlung: {anleitung}"
        return {
            "aussage": aussage,
            "quelle": best_entry.get("quelle", "Kuratierte Wissensbasis"),
        }
    return None


# Zirkuläre Abhängigkeit vermeiden: Import nach Funktionsdefinition
import repair.wissensbasis as wissensbasis  # noqa: E402


def _suche_online(frage: str, searxng_url: str, lang: str) -> dict | None:
    """SearXNG-Suche, nur wenn SEARXNG_URL gesetzt.

    Bei widersprüchlichen Treffern: widerspruch:True + Konfidenz absenken.
    Scheitert nie hart — bei Fehler → None (→ Fallback).
    """
    try:
        import urllib.parse
        import urllib.request

        query = urllib.parse.urlencode({"q": frage, "format": "json", "language": lang})
        url = f"{searxng_url.rstrip('/')}/search?{query}"
        req = urllib.request.Request(url, headers={"User-Agent": "RepairApp/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            import json
            data = json.loads(resp.read().decode("utf-8", errors="replace"))

        results = data.get("results") or []
        if not results:
            return None

        # Erste 3 Snippets sammeln für Widerspruchs-Heuristik
        snippets = []
        for r in results[:3]:
            content = (r.get("content") or r.get("title") or "").strip()
            if content:
                snippets.append({"text": content, "url": r.get("url", "")})

        if not snippets:
            return None

        # Einfache Widerspruchs-Heuristik: sehr unterschiedliche Längen/Worte
        widerspruch = False
        if len(snippets) >= 2:
            kw0 = _keywords(snippets[0]["text"])
            kw1 = _keywords(snippets[1]["text"])
            jaccard = len(kw0 & kw1) / max(len(kw0 | kw1), 1)
            if jaccard < 0.15:
                widerspruch = True

        konfidenz = "niedrig" if widerspruch else "mittel"
        aussage = snippets[0]["text"][:400]

        return {
            "aussage": aussage,
            "herkunft": "online",
            "quelle": snippets[0]["url"] or searxng_url,
            "konfidenz": konfidenz,
            "widerspruch": widerspruch,
            "online": True,
            "nurDeutsch": False,
        }
    except Exception:
        return None


def _ki_fallback(frage: str, lang: str) -> dict:
    """KI-Fallback: ehrliche Nicht-Antwort mit niedrigerer Konfidenz."""
    aussage = t("recherche.kein_treffer", lang)
    return {
        "aussage": aussage,
        "herkunft": "ki-fallback",
        "quelle": "Reparatur-Helfer Wissensbasis (kein Treffer)",
        "konfidenz": "niedrig",
        "widerspruch": False,
        "online": False,
        "nurDeutsch": True,
    }
