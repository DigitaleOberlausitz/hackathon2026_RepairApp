"""Kuratierte statische Liste von Entsorgungs-/Recyclingwegen (PROJ-12).

Kuratierter Demo-Seed, kein Scraping. Jeder Eintrag trägt ``quelle`` +
``kuratiert: True`` und einen **Rohstoff-Hinweis** (welche Wertstoffe im
Gerät stecken / zurückgewonnen werden).

Arten (``art``):
    wertstoffhof  — kommunaler Recyclinghof
    ruecknahme    — Händler-Rücknahme (ElektroG-Pflicht)
    sammelstelle  — Schadstoff-/Sondersammelstelle

Öffentliche API:
    list_entsorgung(kat=None, ort=None) -> list[dict]
"""

from __future__ import annotations

_DEMO_QUELLE = "Kuratierte Demodaten (Rechtsrahmen: ElektroG; Vorbild: kommunale Wertstoffhöfe)"

_DATA: list[dict] = [
    {
        "id": "wertstoffhof-sued",
        "art": "wertstoffhof",
        "name": "Kommunaler Wertstoffhof Süd",
        "adresse": "Recyclingweg 1",
        "ort": "Berlin",
        "plz": "12099",
        "annahmezeiten": "Mo–Fr 8–17 Uhr, Sa 8–13 Uhr",
        "hinweise": "Elektrokleingeräte werden kostenfrei angenommen, kein Termin nötig.",
        "kosten": "kostenlos für Haushaltsmengen",
        "rohstoff": "Rückgewinnung von Kupfer, Aluminium und Stahl; Platinen enthalten geringe Mengen Edelmetalle.",
        "kategorien": ["kleingeraet", "grossgeraet", "elektronik", "alle"],
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
    {
        "id": "haendler-ruecknahme",
        "art": "ruecknahme",
        "name": "Elektromarkt — Händler-Rücknahme (ElektroG)",
        "adresse": "Einkaufszentrum, Erdgeschoss",
        "ort": "Berlin",
        "plz": "10115",
        "annahmezeiten": "zu den Öffnungszeiten des Marktes",
        "hinweise": "Größere Händler nehmen Altgeräte kostenlos zurück — kleine Geräte (< 25 cm) auch ohne Neukauf.",
        "kosten": "kostenlos",
        "rohstoff": "Fachgerechtes Recycling; Schadstoffe (z.B. Kondensatoren) werden separat entfernt.",
        "kategorien": ["kleingeraet", "elektronik", "alle"],
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
    {
        "id": "schadstoff-sammelstelle",
        "art": "sammelstelle",
        "name": "Schadstoff- und Akku-Sammelstelle",
        "adresse": "Umweltmobil / Stadtteil-Sammelpunkt",
        "ort": "Berlin",
        "plz": "13347",
        "annahmezeiten": "1. Mittwoch im Monat, 15–18 Uhr",
        "hinweise": "Für Geräte mit Akku/Batterie oder Schadstoffen — niemals in den Hausmüll.",
        "kosten": "kostenlos",
        "rohstoff": "Lithium, Kobalt und Nickel aus Akkus werden zurückgewonnen; verhindert Brand-/Umweltrisiko.",
        "kategorien": ["elektronik", "mobilitaet", "alle"],
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
]


def _matches(entry: dict, kat: str | None, ort: str | None) -> bool:
    if kat:
        kat_low = kat.strip().lower()
        kats = [str(k).lower() for k in entry.get("kategorien", [])]
        if kat_low and "alle" not in kats and kat_low not in kats:
            return False
    if ort:
        ort_low = ort.strip().lower()
        if ort_low:
            hay = f"{entry.get('ort', '')} {entry.get('plz', '')}".lower()
            if ort_low not in hay:
                return False
    return True


def list_entsorgung(kat: str | None = None, ort: str | None = None) -> list[dict]:
    """Gefilterte Entsorgungswege (kuratierter Seed). Kann leer sein."""
    out = []
    for entry in _DATA:
        if _matches(entry, kat, ort):
            item = dict(entry)
            item.pop("kategorien", None)
            out.append(item)
    return out
