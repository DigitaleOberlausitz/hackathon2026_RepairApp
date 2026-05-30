"""Einwilligungs-Management (PROJ-22).

Öffentliche API:
    consent_text(lang)         → {titel, body, trainingshinweis, verweisPROJ23, optionen}
    CONSENT_STATUS_*           → Status-Konstanten

Schreiben in Vorgang via store.save_vorgang (Read-Modify-Write).
"""

from __future__ import annotations

from datetime import datetime, timezone

from . import store as _store
from .i18n import t

# ─── Status-Konstanten ────────────────────────────────────────────────────────

CONSENT_STATUS_OFFEN = "offen"
CONSENT_STATUS_ERTEILT = "erteilt"
CONSENT_STATUS_ABGELEHNT = "abgelehnt"
CONSENT_STATUS_WIDERRUFEN = "widerrufen"

GUELTIGE_STATUSWERTE = frozenset([
    CONSENT_STATUS_ERTEILT,
    CONSENT_STATUS_ABGELEHNT,
    CONSENT_STATUS_WIDERRUFEN,
])


def consent_text(lang: str = "de") -> dict:
    """Liefert den Consent-Text für das Gate (PROJ-22).

    Enthält: titel, body, trainingshinweis, verweisPROJ23, optionen.
    Keine Vorauswahl — beide Optionen gleichwertig.
    """
    return {
        "titel": t("consent.titel", lang),
        "body": t("consent.body", lang),
        "trainingshinweis": t("consent.trainingshinweis", lang),
        "verweisPROJ23": t("consent.verweis_proj23", lang),
        "optionen": {
            "erteilen": t("consent.option.erteilen", lang),
            "ablehnen": t("consent.option.ablehnen", lang),
        },
    }


def setze_consent(vid: str, status: str) -> dict | None:
    """Setzt den Consent-Status im Vorgang (Read-Modify-Write).

    Nur gültige Status-Werte werden gespeichert.
    Gibt den aktualisierten Vorgang zurück oder None wenn nicht gefunden.
    """
    status = (status or "").strip().lower()
    if status not in GUELTIGE_STATUSWERTE:
        return None

    vorgang = _store.get_vorgang(vid)
    if vorgang is None:
        return None

    state = vorgang.get("state") or {}
    zeitpunkt = datetime.now(timezone.utc).isoformat()

    # Nur consent-Feld mergen, alles andere unberührt lassen
    state["consent"] = {
        "status": status,
        "zeitpunkt": zeitpunkt,
    }

    return _store.save_vorgang(vid, state)


def get_consent_status(state: dict) -> str:
    """Liest den Consent-Status sicher aus dem State."""
    consent = state.get("consent") if isinstance(state, dict) else {}
    if not isinstance(consent, dict):
        return CONSENT_STATUS_OFFEN
    return str(consent.get("status", CONSENT_STATUS_OFFEN)).strip().lower()


def ist_erteilt(state: dict) -> bool:
    """True wenn Consent erteilt wurde."""
    return get_consent_status(state) == CONSENT_STATUS_ERTEILT
