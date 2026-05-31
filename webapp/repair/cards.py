"""Karten-Schemata (Decomposition): pro Karten-Typ ein kleines JSON-Schema.

zeige_karte(typ, daten) wird server-seitig hier validiert. Querschnittsfeld
`trust` (Vertrauens-Indikator, D3) ist in diagnose/ampel/vergleich Pflicht.
"""
from __future__ import annotations

from jsonschema import Draft202012Validator

class CardValidationError(ValueError):
    pass

_LEVEL = {"enum": ["gruen", "gelb", "rot"]}
_TRUST = {
    "type": "object",
    "required": ["level", "quelle", "konfidenz", "hinweis"],
    "properties": {
        "level": {"enum": ["hoch", "mittel", "niedrig"]},
        "quelle": {"type": "string"},
        "konfidenz": {"enum": ["hoch", "mittel", "niedrig", "unklar"]},
        "hinweis": {"type": "string"},
    },
}

SCHEMAS: dict[str, dict] = {
    "aufnahme": {
        "type": "object",
        "required": ["symptom"],
        "properties": {
            "symptom": {"type": "string"},
            "kategorie": {"type": "string"},   # D23-Backstop: datentragend erkennen
            "bedingungen": {"type": "string"},
            "seit_wann": {"type": "string"},
            "getestet": {"type": "string"},
            "eigentum": {
                "type": "object",
                "properties": {
                    "ist_eigentuemer": {"type": "boolean"},
                    "kostentraeger": {"type": "string"},
                },
            },
        },
    },
    "diagnose": {
        "type": "object",
        "required": ["kandidaten", "unklar", "trust"],
        "properties": {
            "kandidaten": {"type": "array", "items": {"type": "object"}},
            "abgrenzungsfragen": {"type": "array", "items": {"type": "string"}},
            "unklar": {"type": "boolean"},
            "trust": _TRUST,
        },
    },
    "ampel": {
        "type": "object",
        "required": ["achsen", "gesamt", "begruendung", "trust"],
        "properties": {
            "achsen": {
                "type": "object",
                "required": ["sicherheit", "komplexitaet", "kosten", "machbarkeit"],
                "properties": {
                    "sicherheit": _LEVEL, "komplexitaet": _LEVEL,
                    "kosten": _LEVEL, "machbarkeit": _LEVEL,
                },
            },
            "gesamt": _LEVEL,
            "begruendung": {"type": "string"},
            "defekt": {"type": "string"},  # D24: pro Defekt eine Ampel
            "trust": _TRUST,
        },
    },
    "vergleich": {
        "type": "object",
        "required": ["empfehlung", "begruendung", "trust"],
        "properties": {
            "repair": {"type": "object"}, "pro": {"type": "object"},
            "neu": {"type": "object"}, "entsorgung": {"type": "object"},
            "empfehlung": {"enum": ["repair", "pro", "neu", "entsorgung"]},
            "begruendung": {"type": "string"},
            "geschaetzt": {"type": "boolean"},
            "trust": _TRUST,
        },
    },
    "schritte": {
        "type": "object",
        "required": ["schritte", "trust"],  # D3/A5: trust auf dem gefährlichsten Output Pflicht
        "properties": {
            "schritte": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["titel"],
                    "properties": {
                        "titel": {"type": "string"},
                        "anfaenger": {"type": "string"},
                        "profi": {"type": "string"},
                        "safety": {"type": "boolean"},
                        "danger": {"type": "boolean"},
                        "handoff": {"type": "boolean"},
                    },
                },
            },
            "garantie_hinweis": {"type": "string"},
            "misserfolg_pfad": {"type": "string"},
            "bestaetigung_noetig": {"type": "boolean"},   # D25: vulnerable Nutzer
            "bestaetigung_text": {"type": "string"},
            "trust": _TRUST,
        },
    },
    "hinweis": {
        "type": "object",
        "required": ["art", "text"],
        "properties": {
            "art": {"enum": ["garantie", "rueckruf", "datenloeschung",
                             "sicherheit", "eigentum"]},
            "text": {"type": "string"},
            "schwere": {"enum": ["info", "warnung", "kritisch"]},
        },
    },
    "anbieter": {
        "type": "object",
        "required": ["eintraege"],
        "properties": {"eintraege": {"type": "array", "items": {"type": "object"}}},
    },
    "ersatzteil": {
        "type": "object",
        "required": ["eintraege"],
        "properties": {
            "eintraege": {"type": "array", "items": {"type": "object"}},
            "affiliate_hinweis": {"type": "string"},
        },
    },
    "erfolg": {
        "type": "object",
        "properties": {
            "gespart_geld": {"type": "string"},
            "gespart_co2": {"type": "string"},
            "mutmach_satz": {"type": "string"},
        },
    },
}

TYPEN = tuple(SCHEMAS.keys())


def validate(typ: str, daten: dict) -> dict:
    schema = SCHEMAS.get(typ)
    if schema is None:
        raise CardValidationError(f"Unbekannter Karten-Typ: {typ!r}")
    errors = sorted(Draft202012Validator(schema).iter_errors(daten),
                    key=lambda e: list(e.path))
    if errors:
        msg = "; ".join(f"{list(e.path)}: {e.message}" for e in errors[:3])
        raise CardValidationError(f"Karte '{typ}' ungültig: {msg}")
    return {"typ": typ, "daten": daten}
