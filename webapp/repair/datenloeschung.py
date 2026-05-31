"""Datenlöschungs-Hilfsmodul (PROJ-20).

Öffentliche API:
    ist_datentragend(kategorie)  → True | False | None
    checkliste(lang)             → {backup, loeschen, abmelden} Texte

None = unklar → Frontend fragt einmalig nach.
"""

from __future__ import annotations

from .i18n import t

# Kategorien, die definitiv datentragend sind
_DATENTRAGEND_JA: frozenset[str] = frozenset([
    "computer", "laptop", "notebook",
    "mobilgeräte", "smartphone", "handy", "tablet", "ipad",
    "pc", "desktop", "server",
    "spielkonsole", "gaming", "nas", "festplatte", "usb",
])

# Kategorien, die definitiv NICHT datentragend sind
_DATENTRAGEND_NEIN: frozenset[str] = frozenset([
    "fahrrad", "küchengeräte", "haushaltsgeräte", "handwerkzeug",
    "unterhaltungselektronik", "fernseher", "waschmaschine",
    "kühlschrank", "herd", "geschirrspüler",
])


def ist_datentragend(kategorie: str | None) -> bool | None:
    """Gibt True zurück wenn die Kategorie datentragend ist, False wenn nicht, None wenn unklar.

    None → Frontend soll einmalig rückfragen.
    """
    kat = (kategorie or "").strip().lower()
    if not kat:
        return None
    # Direkt-Match
    if kat in _DATENTRAGEND_JA:
        return True
    if kat in _DATENTRAGEND_NEIN:
        return False
    # Substring-Match (z. B. "mobilgeräte-samsung" → enthält "mobilgeräte")
    for k in _DATENTRAGEND_JA:
        if k in kat or kat in k:
            return True
    for k in _DATENTRAGEND_NEIN:
        if k in kat or kat in k:
            return False
    return None  # unklar


def checkliste(lang: str = "de") -> dict:
    """Liefert die Datenlöschungs-Checkliste in der gewählten Sprache.

    Felder: backup, loeschen, abmelden — je {label, hinweis}.
    """
    return {
        "backup": {
            "label": t("datenloeschung.backup.label", lang),
            "hinweis": t("datenloeschung.backup.hinweis", lang),
        },
        "loeschen": {
            "label": t("datenloeschung.loeschen.label", lang),
            "hinweis": t("datenloeschung.loeschen.hinweis", lang),
        },
        "abmelden": {
            "label": t("datenloeschung.abmelden.label", lang),
            "hinweis": t("datenloeschung.abmelden.hinweis", lang),
        },
    }
