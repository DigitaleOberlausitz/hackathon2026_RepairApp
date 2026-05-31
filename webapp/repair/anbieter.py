"""Kuratierte statische Liste von Reparatur-Anbietern (PROJ-11 / Vermittlung).

Keine echten Geschäftsdaten, keine Live-Abfrage, kein Scraping — **kuratierter
Demo-Seed**. Jeder Eintrag trägt ``quelle`` + ``kuratiert: True`` und einen
sichtbaren Demo-/Quellenhinweis.

Typen (``typ``):
    repaircafe   — kostenlos / ehrenamtlich (Spendenbasis)
    werkstatt    — lokale Fachwerkstatt (kostenpflichtig)
    profi        — Hersteller-/Profi-Service (kostenpflichtig)

Öffentliche API:
    list_anbieter(kat=None, ort=None) -> list[dict]

``kat``  filtert über die Geräte-Kategorie (z.B. "kleingeraet", "elektronik",
         "grossgeraet", "mobilitaet"); Einträge mit "alle" passen immer.
``ort``  filtert per Teilstring gegen Ort **oder** PLZ (case-insensitive).

Beide Filter sind optional. Ist die gefilterte Liste leer, ist das ein
ehrlicher Leertreffer (vom Endpunkt als ``fallback`` gekennzeichnet) — die
Funktion erfindet nichts dazu.
"""

from __future__ import annotations

_DEMO_QUELLE = "Kuratierte Demodaten (Vorbild: reparatur-initiativen.de, OpenStreetMap)"

# ─── Statischer Datensatz ────────────────────────────────────────────────────

_DATA: list[dict] = [
    {
        "id": "repaircafe-kreuzberg",
        "name": "Repair Café Kreuzberg",
        "typ": "repaircafe",
        "adresse": "Nachbarschaftshaus, Musterstraße 12",
        "ort": "Berlin",
        "plz": "10999",
        "entfernung": "ca. 1,2 km",
        "kontakt": "kontakt@repaircafe-kreuzberg.example",
        "oeffnungszeiten": "jeden 2. Samstag, 14–18 Uhr",
        "spezialisierung": "Kleingeräte, Elektronik, gemeinsames Reparieren mit Ehrenamtlichen",
        "kostenhinweis": "kostenlos · Spendenbasis (ehrenamtlich)",
        "kategorien": ["kleingeraet", "elektronik", "alle"],
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
    {
        "id": "werkstatt-elektro-mueller",
        "name": "Elektro Müller — Reparaturwerkstatt",
        "typ": "werkstatt",
        "adresse": "Handwerkerhof 3",
        "ort": "Berlin",
        "plz": "10827",
        "entfernung": "ca. 3,5 km",
        "kontakt": "030 / 555 0000",
        "oeffnungszeiten": "Mo–Fr 9–18 Uhr",
        "spezialisierung": "Haushaltskleingeräte, Küchengeräte, Diagnose mit Messgerät",
        "kostenhinweis": "kostenpflichtig · Diagnosepauschale ab ca. 25 €",
        "kategorien": ["kleingeraet", "grossgeraet", "elektronik"],
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
    {
        "id": "profi-hersteller-service",
        "name": "Hersteller-Servicepartner (bundesweit, Versand)",
        "typ": "profi",
        "adresse": "Service-Center, Versandannahme",
        "ort": "bundesweit",
        "plz": "",
        "entfernung": "Versand / überregional",
        "kontakt": "service@hersteller.example",
        "oeffnungszeiten": "Annahme rund um die Uhr (online)",
        "spezialisierung": "Hochspannungs- und Sicherheitsreparaturen (z.B. Mikrowelle, Magnetron)",
        "kostenhinweis": "kostenpflichtig · Kostenvoranschlag vor Reparatur",
        "kategorien": ["kleingeraet", "grossgeraet", "elektronik", "alle"],
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
    {
        "id": "radwerkstatt-buergerinitiative",
        "name": "Rad-Selbsthilfewerkstatt",
        "typ": "repaircafe",
        "adresse": "Hof am Stadtpark 7",
        "ort": "Hamburg",
        "plz": "20357",
        "entfernung": "ca. 0,8 km",
        "kontakt": "info@radwerkstatt.example",
        "oeffnungszeiten": "Di + Do 16–20 Uhr",
        "spezialisierung": "Fahrräder, Pedelecs — Hilfe zur Selbsthilfe mit Werkzeug vor Ort",
        "kostenhinweis": "kostenlos · Spendenbasis (Material gegen Selbstkosten)",
        "kategorien": ["mobilitaet"],
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


def list_anbieter(kat: str | None = None, ort: str | None = None) -> list[dict]:
    """Gefilterte Anbieterliste (kuratierter Seed).

    Ohne Filter: alle Einträge. Mit Filter: nur passende. Kann leer sein
    (ehrlicher Leertreffer) — z.B. ``ort="Kleinkleckersdorf"``.
    """
    out = []
    for entry in _DATA:
        if _matches(entry, kat, ort):
            item = dict(entry)
            item.pop("kategorien", None)
            out.append(item)
    return out
