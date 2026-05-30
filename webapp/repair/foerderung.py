"""Kuratierte statische Liste deutscher Reparatur-Förderungen.

Status wird dynamisch gegen das aktuelle Datum berechnet:
  gueltigBis < heute               → "ausgelaufen"
  stand < (heute - 12 Monate)      → "veraltet"   (nur wenn nicht ausgelaufen)
  sonst                            → "aktuell"

Öffentliche API:
    list_foerderungen() -> list[dict]   # alle Einträge mit berechnetem status
"""

from __future__ import annotations

import datetime

# ─── Statischer Datensatz ────────────────────────────────────────────────────
# Für die Demo muss mindestens ein "ausgelaufen"- und ein "aktuell"-Eintrag
# enthalten sein (Zeitachse: heute = 2026-05-30).

_DATA: list[dict] = [
    {
        "bezeichnung": "Berliner Reparaturbonus",
        "traeger": "Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt Berlin",
        "region": "Berlin",
        "stand": "2026-02-01",
        "gueltigBis": "2027-06-30",
        "quelle": "https://www.berlin.de/foerderung/reparaturbonus",
        "beschreibung": (
            "Bis zu 50 % der Reparaturkosten, maximal 200 € pro Haushalt und Jahr, "
            "für Elektrogeräte die in einer zertifizierten Werkstatt oder einem Repair Café repariert werden. "
            "Antrag online über das Serviceportal Berlin."
        ),
    },
    {
        "bezeichnung": "Thüringen Reparatur-Bonus 2025",
        "traeger": "Thüringer Ministerium für Umwelt, Energie und Naturschutz",
        "region": "Thüringen",
        "stand": "2025-07-10",
        "gueltigBis": "2026-04-30",
        "quelle": "https://www.thueringen.de/foerderung/reparaturbonus-2025",
        "beschreibung": (
            "Erstattung von 50 % der Reparaturkosten für Elektrokleingeräte, bis maximal 150 € pro Antrag. "
            "Gilt für Reparaturen in anerkannten Thüringer Werkstätten. "
            "Programm ausgelaufen — Nachfolge-Programm in Planung."
        ),
    },
    {
        "bezeichnung": "Sachsen Reparaturfonds Elektrogeräte",
        "traeger": "Sächsisches Staatsministerium für Energie, Klimaschutz, Umwelt und Landwirtschaft",
        "region": "Sachsen",
        "stand": "2024-10-15",
        "gueltigBis": "2026-12-31",
        "quelle": "https://www.smekul.sachsen.de/foerderung/reparaturfonds",
        "beschreibung": (
            "Zuschuss bis 100 € je Reparatur für Haushaltsgeräte, bis 50 % der nachgewiesenen Kosten. "
            "Voraussetzung: Fachbetrieb mit Sachsen-Zertifizierung. "
            "Hinweis: Programmdetails seit Oktober 2024 nicht aktualisiert — bitte aktuelle Konditionen beim Träger erfragen."
        ),
    },
    {
        "bezeichnung": "Hamburg ReWaBo — Reparatur- und Wartungsbonus",
        "traeger": "Behörde für Umwelt, Klima, Energie und Agrarwirtschaft Hamburg",
        "region": "Hamburg",
        "stand": "2025-11-01",
        "gueltigBis": "2027-09-30",
        "quelle": "https://www.hamburg.de/foerderung/rewabo",
        "beschreibung": (
            "30 % Erstattung auf Reparatur und Wartung von Haushaltsgeräten und Fahrrädern, "
            "max. 100 € pro Haushalt im Kalenderjahr. Abwicklung per Online-Formular innerhalb von 6 Wochen "
            "nach der Reparatur. Keine Voranmeldung erforderlich."
        ),
    },
    {
        "bezeichnung": "Bundesweiter Energiegeräte-Reparaturbonus (Pilotprogramm)",
        "traeger": "Bundesministerium für Wirtschaft und Klimaschutz (BMWK)",
        "region": "bundesweit",
        "stand": "2025-06-15",
        "gueltigBis": "2026-03-31",
        "quelle": "https://www.bmwk.de/foerderung/reparaturbonus-pilot",
        "beschreibung": (
            "Pilotprogramm zur Förderung von Reparaturen an energieverbrauchsrelevanten Haushaltsgeräten "
            "(Waschmaschine, Kühlschrank, Spülmaschine). Erstattung 40 %, max. 250 € je Gerät. "
            "Programm abgelaufen — kein Folge-Programm bestätigt."
        ),
    },
]


def _compute_status(entry: dict, today: datetime.date | None = None) -> str:
    if today is None:
        today = datetime.date.today()
    veraltet_grenze = datetime.date(today.year - 1, today.month, today.day)

    try:
        gueltig_bis = datetime.date.fromisoformat(entry["gueltigBis"])
    except (KeyError, ValueError):
        gueltig_bis = None

    try:
        stand = datetime.date.fromisoformat(entry["stand"])
    except (KeyError, ValueError):
        stand = None

    if gueltig_bis is not None and gueltig_bis < today:
        return "ausgelaufen"
    if stand is not None and stand < veraltet_grenze:
        return "veraltet"
    return "aktuell"


def list_foerderungen(today: datetime.date | None = None) -> list[dict]:
    """Gibt alle Fördereinträge mit dynamisch berechnetem ``status`` zurück."""
    result = []
    for entry in _DATA:
        item = dict(entry)
        item["status"] = _compute_status(entry, today)
        result.append(item)
    return result
