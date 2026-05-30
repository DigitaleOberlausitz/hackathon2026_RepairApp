"""Kuratierte Diagnose-Schleife (PROJ-17).

Öffentliche API:
    diagnose(text, kategorie, answers, lang)
      → {kandidaten, abgrenzung, unklar}

Kandidaten nur aus geprueft-Einträgen der Wissensbasis.
Abgrenzungsfragen aus dem kuratierten Eintrag (nicht frei erfunden).
Konfidenz/Herkunft je Kandidat niemals leer.
Stuft selbst KEINE Ampel ein — nur Ursachen-Kandidaten.

Wird von ai.diagnose() additiv aufgerufen (PROJ-17 additiv zu Stufe 1/2-Feldern).
"""

from __future__ import annotations

import re

from . import wissensbasis as _wb


def diagnose(
    text: str,
    kategorie: str = "",
    answers: list | None = None,
    lang: str = "de",
) -> dict:
    """Kuratierte Diagnose: Text + optionale Antworten → {kandidaten, abgrenzung, unklar}.

    Keine Ampel-Einstufung — liefert nur Ursachen-Kandidaten mit Herkunft/Konfidenz.
    """
    text = (text or "").strip()
    kategorie = (kategorie or "").strip().lower()
    answers = answers if isinstance(answers, list) else []

    # Symptom-Tags aus Text extrahieren
    tags = _extract_tags(text)
    if kategorie:
        tags.add(kategorie)

    # Antwort-Tags hinzufügen
    for ans in answers:
        if isinstance(ans, dict):
            tag = str(ans.get("tag") or "").strip().lower()
            if tag:
                tags.add(tag)
        elif isinstance(ans, str) and ans.strip():
            tags.add(ans.strip().lower())

    # Kandidaten aus Wissensbasis
    alle_kandidaten = _wb.find_by_symptom(kat=kategorie or None, tags=list(tags))

    # Antworte-basiertes Ausscheiden (Abgrenzungs-Logik)
    aktive, ausgeschieden = _abgrenzen(alle_kandidaten, answers)

    # Widersprüchliche Antworten oder kein Treffer → unklar
    unklar = False
    if not aktive:
        unklar = True
    elif _hat_widerspruch(aktive, answers):
        unklar = True

    # Kandidaten-Liste aufbauen
    kandidaten = []
    for entry in aktive[:5]:  # max 5 Kandidaten
        konfidenz = _konfidenz_aus_entry(entry, tags)
        kandidaten.append({
            "id": entry.get("id", ""),
            "ursache": entry.get("ursache", ""),
            "herkunft": "kuratiert" if entry.get("status") == "geprueft" else "ki-ermittelt",
            "konfidenz": konfidenz,
            "quelle": entry.get("quelle", "Kuratierte Wissensbasis"),
        })

    # Abgrenzungsfragen: aus den Top-Kandidaten zusammenstellen (keine Duplikate)
    offen: list[dict] = []
    gesehen: set[str] = set()
    for entry in aktive[:3]:
        for frage in entry.get("abgrenzungsfragen", []):
            q_text = frage.get("q", "").strip()
            if q_text and q_text not in gesehen:
                # Prüfen ob bereits beantwortet
                if not _ist_beantwortet(q_text, answers):
                    offen.append({
                        "q": q_text,
                        "options": frage.get("options", []),
                    })
                    gesehen.add(q_text)

    return {
        "kandidaten": kandidaten,
        "abgrenzung": {"offen": offen[:3]},  # max 3 offene Fragen
        "unklar": unklar,
    }


# ─── Interne Helfer ───────────────────────────────────────────────────────────


def _extract_tags(text: str) -> set[str]:
    """Einfache Keyword-Extraktion aus Freitext."""
    # Geräte-Keywords
    geraete = {
        "toaster", "mikrowelle", "microwave", "waschmaschine", "staubsauger",
        "smartphone", "laptop", "fahrrad", "kaffeemaschine", "fernseher", "herd",
        "kühlschrank", "geschirrspüler", "trockner", "föhn", "wasserkocher",
    }
    # Symptom-Keywords
    symptome = {
        "heizt nicht", "kalt", "warm", "tropft", "brummt", "kein bild",
        "display", "akku", "springt", "schaltet", "saugt nicht", "keine kraft",
        "raucht", "riecht", "Überhitzung", "funktioniert nicht",
    }
    text_low = text.lower()
    tags: set[str] = set()
    for g in geraete:
        if g in text_low:
            tags.add(g)
    for s in symptome:
        if s in text_low:
            tags.add(s.replace(" ", "-"))
    # Einzelwörter > 4 Zeichen
    words = re.split(r"\s+", text_low)
    for w in words:
        clean = w.strip(".,;:!?()\"'")
        if len(clean) > 4:
            tags.add(clean)
    return tags


def _abgrenzen(kandidaten: list[dict], answers: list) -> tuple[list[dict], list[str]]:
    """Scheidet Kandidaten durch Antwort-Tags aus.

    Einfache Heuristik: Wenn ein Kandidat eine Abgrenzungsfrage hat, deren
    Antwort-Tags alle vom Nutzer verneint wurden, wird er ausgeschieden.
    """
    if not answers:
        return kandidaten, []

    # Tags der Antworten sammeln
    answer_tags = set()
    for ans in answers:
        if isinstance(ans, dict):
            tag = str(ans.get("tag") or "").strip().lower()
            if tag:
                answer_tags.add(tag)

    aktive = []
    ausgeschieden = []

    for entry in kandidaten:
        ausscheiden = False
        for frage in entry.get("abgrenzungsfragen", []):
            options = frage.get("options", [])
            # Tags dieser Frage
            frage_tags = {str(o.get("tag", "")).lower() for o in options if o.get("tag")}
            matched = frage_tags & answer_tags
            # Wenn genau ein Tag matcht und dieser Tag auf Ausschluss hindeutet:
            # (Heuristik: wenn keine Überlappung mit Symptomen des Eintrags)
            if matched:
                syms = {s.lower() for s in entry.get("symptome", [])}
                # Wenn alle gematchten Tags nicht zu den Symptomen passen → ausscheiden
                if matched.isdisjoint(syms) and len(matched) >= 1:
                    ausscheiden = True
                    break
        if ausscheiden:
            ausgeschieden.append(entry.get("id", ""))
        else:
            aktive.append(entry)

    return aktive, ausgeschieden


def _hat_widerspruch(kandidaten: list[dict], answers: list) -> bool:
    """Prüft ob Antworten widersprüchlich zu den verbleibenden Kandidaten sind.

    Konservativ: False wenn unklar — nur offensichtliche Widersprüche.
    """
    if len(kandidaten) < 2 or not answers:
        return False
    # Vereinfachte Heuristik: mehr als 3 Kandidaten mit entgegengesetzten Sicherheitsstufen
    stufen = {entry.get("sicherheit") for entry in kandidaten}
    return "gut" in stufen and "stop" in stufen and len(stufen) >= 3


def _ist_beantwortet(q_text: str, answers: list) -> bool:
    """Prüft ob eine Frage bereits in den Antworten vorkommt."""
    q_low = q_text.lower().strip()
    for ans in answers:
        if isinstance(ans, dict):
            existing_q = str(ans.get("q") or "").lower().strip()
            if existing_q and existing_q == q_low:
                return True
    return False


def _konfidenz_aus_entry(entry: dict, matched_tags: set) -> str:
    """Konfidenz eines Kandidaten basierend auf Tag-Übereinstimmung.

    Liefert NIEMALS leer ('niedrig' als unterste Stufe).
    """
    syms = {s.lower() for s in entry.get("symptome", [])}
    overlap = len(syms & matched_tags)
    if overlap >= 3:
        return "hoch"
    if overlap >= 1:
        return "mittel"
    return "niedrig"
