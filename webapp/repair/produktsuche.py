"""Kuratierte Alternativgeräte / Neukauf-Optionen (PROJ-13 / Produktsuche).

Kuratierter Demo-Seed, kein Live-Shop, kein Scraping. Jeder Eintrag trägt
``quelle`` + ``kuratiert: True``. Die Darstellung ist bewusst **vergleichbar
zur compare-Optik** (Geld / Zeit / Umwelt) plus Einrichtungsaufwand (0–3) und
einem ehrlichen Öko-/Wirtschaftlichkeits-``breakEven``.

Öffentliche API:
    list_alternativen(kat=None) -> list[dict]
    breakeven_text(kat=None) -> str
"""

from __future__ import annotations

_DEMO_QUELLE = "Kuratierte Demodaten (Vorbild: EU-Energielabel, Hersteller-Datenblätter)"

# Einrichtungsaufwand: 0 = quasi sofort nutzbar … 3 = aufwändige Neueinrichtung
_DATA: list[dict] = [
    {
        "id": "alt-toaster-basis",
        "kat": "kleingeraet",
        "modell": "Basis-Toaster (2 Scheiben)",
        "preis": "ca. 25 €",
        "ausstattung": "2 Scheiben, 6 Bräunungsstufen, Krümelschublade",
        "energieklasse": "—",
        "lieferzeit": "sofort lieferbar",
        "einrichtung": 0,
        "vergleich": {
            "geld": "≈ 25 € neu — Reparatur meist 0–5 €; Neukauf lohnt erst ab ca. 12 € Reparaturkosten",
            "zeit": "sofort einsatzbereit",
            "umwelt": "≈ 8 kg CO₂ Herstellung + Altgerät wird Elektroschrott",
        },
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
    {
        "id": "alt-toaster-langlebig",
        "kat": "kleingeraet",
        "modell": "Langlebig-Toaster (reparierbar)",
        "preis": "ca. 55 €",
        "ausstattung": "Metallgehäuse, verfügbare Ersatzteile, 5 Jahre Garantie",
        "energieklasse": "—",
        "lieferzeit": "2–3 Tage",
        "einrichtung": 0,
        "vergleich": {
            "geld": "≈ 55 € neu — Reparatur des Altgeräts meist günstiger; lohnt als Neukauf v.a. bei wiederholten Defekten",
            "zeit": "wenige Tage Lieferung",
            "umwelt": "Höhere Reparierbarkeit senkt Lebenszyklus-CO₂",
        },
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
    {
        "id": "alt-mikrowelle-basis",
        "kat": "kleingeraet",
        "modell": "Mikrowelle Solo 800 W",
        "preis": "ca. 80 €",
        "ausstattung": "20 l, 800 W, Drehteller, mechanische Bedienung",
        "energieklasse": "B (Demo-Wert)",
        "lieferzeit": "sofort lieferbar",
        "einrichtung": 1,
        "vergleich": {
            "geld": "≈ 80 € neu — Profi-Reparatur 60–110 €; Neukauf lohnt erst, wenn die Reparatur > ca. 70 € kostet",
            "zeit": "sofort einsatzbereit",
            "umwelt": "≈ 35 kg CO₂ Herstellung + Altgerät wird Elektroschrott",
        },
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
    {
        "id": "alt-elektronik-tablet",
        "kat": "elektronik",
        "modell": "Einsteiger-Tablet 10\"",
        "preis": "ca. 180 €",
        "ausstattung": "10 Zoll, 64 GB, aktuelle Updates für 4 Jahre zugesagt",
        "energieklasse": "A (Demo-Wert)",
        "lieferzeit": "2–4 Tage",
        "einrichtung": 3,
        "vergleich": {
            "geld": "≈ 180 € neu — Display-/Akku-Reparatur oft 60–90 €; Neukauf lohnt erst, wenn die Reparatur > ca. 120 € kostet",
            "zeit": "Lieferung + Daten-/Konten-Übertragung nötig",
            "umwelt": "Hoher Herstellungsaufwand; Reparatur des Altgeräts oft günstiger fürs Klima",
        },
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
]

# Ehrlicher Break-Even-Text je Kategorie (Default-Fallback inklusive).
_BREAKEVEN: dict[str, str] = {
    "kleingeraet": (
        "Ein Neukauf lohnt ökologisch erst, wenn die Reparatur teurer als rund die Hälfte "
        "des Neupreises wäre — und das Altgerät tatsächlich nicht mehr zu retten ist. "
        "Bei Kleingeräten ist Reparieren fast immer die klimafreundlichere Wahl."
    ),
    "elektronik": (
        "Bei Elektronik steckt der größte CO₂-Anteil in der Herstellung. Ein Neugerät "
        "amortisiert sich ökologisch oft erst nach mehreren Jahren Nutzung — eine "
        "Reparatur ist meist die nachhaltigere Option."
    ),
    "mobilitaet": (
        "Bei Fahrrädern/Pedelecs lohnt der Austausch selten: Rahmen und viele Teile sind "
        "langlebig. Reparatur und Wartung sind fast immer günstiger und klimafreundlicher."
    ),
}
_BREAKEVEN_DEFAULT = (
    "Ein Neukauf lohnt sich ehrlich gerechnet erst, wenn die Reparaturkosten einen großen "
    "Teil des Neupreises erreichen und die Restlebensdauer gering ist. Beziehe versteckte "
    "Folgekosten (Einrichtung, Transport, Eingewöhnung) und die graue Energie mit ein."
)


def breakeven_text(kat: str | None = None) -> str:
    if kat:
        return _BREAKEVEN.get(kat.strip().lower(), _BREAKEVEN_DEFAULT)
    return _BREAKEVEN_DEFAULT


def list_alternativen(kat: str | None = None) -> list[dict]:
    """Gefilterte Alternativgeräte (kuratierter Seed). Kann leer sein."""
    out = []
    for entry in _DATA:
        if kat:
            kat_low = kat.strip().lower()
            if kat_low and str(entry.get("kat", "")).lower() != kat_low:
                continue
        item = dict(entry)
        item.pop("kat", None)
        out.append(item)
    return out
