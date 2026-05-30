"""Schwungrad-Mechanismus (PROJ-23) — anonymisierter Wissensbasis-Beitrag.

Öffentliche API:
    build_beitrag(vorgang)    → {beitragId, ausgeschlossen, ohneEinwilligung:bool}
    grob_gate()               → {einwilligung, anonymisierungText, anonymisierungFoto, tragfaehig, begruendung}

Prüft Consent zum Zeitpunkt des Aufrufs.
Anonymisiert Freitext, schließt nicht-anonymisierbare Fotos aus.
Legt Entwurf in Wissensbasis (nie geprueft → niemals als kuratiert ausgespielt).
Verändert den Original-Vorgang nicht.
"""

from __future__ import annotations

import secrets

from . import anonymisierung as _anon
from . import consent as _consent
from . import wissensbasis as _wb


def grob_gate() -> dict:
    """Dokumentiertes Grob-Gate-Ergebnis für den Schwungrad-Beitrag.

    Felder:
      einwilligung:bool          → Einwilligung technisch erforderlich (immer True)
      anonymisierungText:bool    → Freitext wird anonymisiert (immer True)
      anonymisierungFoto:str     → "teilweise" (Fotos aktuell ausgeschlossen)
      tragfaehig:bool            → Ob der Mechanismus tragfähig ist (True)
      begruendung:str            → Erklärung
    """
    return {
        "einwilligung": True,
        "anonymisierungText": True,
        "anonymisierungFoto": "teilweise",  # Fotos werden ausgeschlossen (Stub)
        "tragfaehig": True,
        "begruendung": (
            "Beiträge nur mit expliziter Einwilligung. "
            "Freitext wird automatisch anonymisiert (E-Mail, Telefon, IBAN, Namen entfernt). "
            "Fotos werden aktuell ausgeschlossen, bis eine Bild-Prüfung verfügbar ist. "
            "Alle Beiträge landen als Entwurf — nur nach menschlicher Freigabe kuratiert."
        ),
    }


def build_beitrag(vorgang: dict) -> dict:
    """Erzeugt einen anonymisierten Wissensbasis-Entwurf aus einem Vorgang.

    Prüft Consent zum Zeitpunkt des Aufrufs.
    Verändert den Original-Vorgang nicht.
    Beitrag bleibt Entwurf (status:"entwurf") — niemals kuratiert.
    """
    if not isinstance(vorgang, dict):
        return {"beitragId": "", "ausgeschlossen": [], "ohneEinwilligung": True}

    state = vorgang.get("state") or {}

    # Consent-Prüfung zum Zeitpunkt des Aufrufs
    if not _consent.ist_erteilt(state):
        return {"beitragId": "", "ausgeschlossen": [], "ohneEinwilligung": True}

    ausgeschlossen: list[str] = []

    # Freitext anonymisieren
    device = state.get("device") or {}
    blurb = str(device.get("blurb") or "")
    problem_text = str(state.get("problemText") or blurb or "")
    clean_text, entfernt_aus_text = _anon.anonymisiere_text(problem_text)
    if entfernt_aus_text:
        ausgeschlossen.extend([f"text:{e}" for e in entfernt_aus_text])

    # Medien prüfen — Fotos ausschließen (pruefe_foto ist Stub → False)
    medien = state.get("medien") if isinstance(state.get("medien"), list) else []
    medien_refs: list[str] = []
    for m in medien:
        if not isinstance(m, dict):
            continue
        art = str(m.get("art", "")).lower()
        if art in ("foto", "video"):
            # Fotos/Videos ausschließen (Stub: pruefe_foto immer False)
            ausgeschlossen.append(f"media:{m.get('id', 'unbekannt')}")
        else:
            # Audio/Text-Anhänge können ggf. einbezogen werden
            medien_refs.append(str(m.get("ref") or m.get("id") or ""))

    # Kategorie aus Gerät
    kategorie = str(device.get("kategorie") or "sonstige").lower()
    device_name = str(device.get("name") or "")

    # Symptom-Text für den Entwurf
    symptom = clean_text or device_name or "unbekannt"

    # Entwurf in Wissensbasis anlegen
    entwurf = _wb.entwurf_erzeugen(
        kat=kategorie,
        symptom=symptom[:200],
        lang=str(state.get("lang") or "de"),
    )
    beitrag_id = entwurf.get("id", "")

    return {
        "beitragId": beitrag_id,
        "ausgeschlossen": ausgeschlossen,
        "ohneEinwilligung": False,
    }
