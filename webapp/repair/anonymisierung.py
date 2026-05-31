"""Anonymisierungs-Helfer (PROJ-23).

Öffentliche API:
    anonymisiere_text(text)   → (clean:str, entfernt:list[str])
    pruefe_foto(meta)         → ok:bool  (Stub: immer False — konservativ)

Regex-Heuristik für: E-Mail, Telefon, IBAN, Seriennummern,
PLZ+Ort, offensichtliche Namen-Muster.
"""

from __future__ import annotations

import re


# ─── Regex-Muster ────────────────────────────────────────────────────────────

_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("e-mail", re.compile(
        r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"
    )),
    ("telefon", re.compile(
        r"""(?x)
        (?:\+49|0049|0)               # Ländervorwahl oder führende 0
        [\s\-/()]*
        (?:\d[\s\-/()]*){7,14}
        """
    )),
    ("iban", re.compile(
        r"\b[A-Z]{2}\d{2}[\s\-]?(?:[0-9A-Z]{4}[\s\-]?){3,7}[0-9A-Z]{1,4}\b"
    )),
    ("seriennummer", re.compile(
        r"\b(?:SN|S/N|Serial|Nr\.|#)\s*:?\s*[A-Z0-9\-]{6,20}\b",
        re.IGNORECASE,
    )),
    ("plz-ort", re.compile(
        r"\b\d{5}\s+[A-ZÄÖÜ][a-zäöü]+(?:[\s\-][A-ZÄÖÜ][a-zäöü]+)*\b"
    )),
    ("name-heuristik", re.compile(
        # Typische Namens-Muster: "Vorname Nachname" am Anfang oder nach "von", "für"
        r"""(?x)
        (?:(?:^|(?<=\s))                 # Wortgrenze
        [A-ZÄÖÜ][a-zäöüß]{2,}           # Vorname (Großbuchstabe + min 2 Kleinbuchstaben)
        \s
        [A-ZÄÖÜ][a-zäöüß]{2,}           # Nachname
        (?:\s[A-ZÄÖÜ][a-zäöüß]{2,})?   # optionaler weiterer Teil
        (?=\s|$|,|\.))
        """
    )),
]

_PLACEHOLDER = "[entfernt]"


def anonymisiere_text(text: str) -> tuple[str, list[str]]:
    """Anonymisiert PII aus Text.

    Gibt (bereinigter_text, liste_der_entfernten_arten) zurück.
    Scheitert nie hart — bei Fehler Original-Text zurück.
    """
    if not text or not isinstance(text, str):
        return text or "", []

    clean = text
    entfernt: list[str] = []

    for label, pattern in _PATTERNS:
        try:
            matches = pattern.findall(clean)
            if matches:
                clean = pattern.sub(_PLACEHOLDER, clean)
                if label not in entfernt:
                    entfernt.append(label)
        except Exception:
            continue

    return clean, entfernt


def pruefe_foto(meta: dict | None = None) -> bool:
    """Prüft ob ein Foto anonymisierbar ist.

    STUB: Liefert immer False (konservativ).
    Fotos werden im Schwungrad-Beitrag ausgeschlossen,
    bis eine echte Bild-Prüfung (OCR/EXIF-Strip) existiert.
    """
    return False
