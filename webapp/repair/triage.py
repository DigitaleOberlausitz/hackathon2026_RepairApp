"""Universelle, gerätunabhängige Triage-Fragen (PROJ-26).

Die 5 systematischen Fragen, die für jedes Problem sinnvoll sind — vom Toaster
bis zum unbekannten Gerät. Gleiches Antwort-Schema wie die geräte-spezifische
Triage (PROJ-2): jede Frage hat Optionen (``a`` + ``tag``) **und** erlaubt
zusätzlich Freitext (``freitext: True``).

Öffentliche API:
    universal_fragen() -> list[dict]
"""

from __future__ import annotations

_FRAGEN: list[dict] = [
    {
        "q": "Was genau ist das Symptom — was passiert (oder passiert nicht)?",
        "hint": "Beschreibe, was du beobachtest: kein Strom, ungewohntes Geräusch, Geruch, kein Ergebnis …",
        "options": [
            {"a": "Gerät reagiert gar nicht / kein Strom", "tag": "keine Reaktion"},
            {"a": "Läuft, tut aber nicht, was es soll", "tag": "Funktion fehlt"},
            {"a": "Ungewohntes Geräusch / Geruch / Rauch", "tag": "auffälliges Signal"},
            {"a": "Etwas ist sichtbar beschädigt", "tag": "sichtbarer Schaden"},
        ],
        "freitext": True,
    },
    {
        "q": "Tritt das Problem immer oder nur manchmal auf?",
        "hint": "Gibt es Bedingungen — bestimmte Programme, nach längerem Betrieb, bei Bewegung?",
        "options": [
            {"a": "Immer / reproduzierbar", "tag": "immer"},
            {"a": "Nur manchmal / sporadisch", "tag": "sporadisch"},
            {"a": "Nur unter bestimmten Bedingungen", "tag": "bedingungsabhängig"},
        ],
        "freitext": True,
    },
    {
        "q": "Seit wann ist das so — und ist vorher etwas passiert?",
        "hint": "Sturz, Wasser, Überlastung, Stromausfall, langsam schlechter geworden?",
        "options": [
            {"a": "Ganz plötzlich", "tag": "plötzlich"},
            {"a": "Schleichend schlechter geworden", "tag": "schleichend"},
            {"a": "Nach einem Ereignis (Sturz/Wasser/…)", "tag": "nach Ereignis"},
            {"a": "War schon immer so", "tag": "von Anfang an"},
        ],
        "freitext": True,
    },
    {
        "q": "Hast du schon etwas ausprobiert?",
        "hint": "Damit ich dir nichts doppelt vorschlage.",
        "options": [
            {"a": "Nein, noch nichts", "tag": "nichts probiert"},
            {"a": "Neu gestartet / Stecker gezogen", "tag": "Neustart probiert"},
            {"a": "Gereinigt / andere Steckdose getestet", "tag": "Basis-Checks"},
            {"a": "Anderes ausprobiert", "tag": "anderes probiert"},
        ],
        "freitext": True,
    },
    {
        "q": "Hast du eine eigene Vermutung, woran es liegt?",
        "hint": "Auch ein Bauchgefühl hilft — du kennst dein Gerät am besten.",
        "options": [
            {"a": "Ja, ich habe eine Vermutung", "tag": "eigene Vermutung"},
            {"a": "Nein, keine Idee", "tag": "keine Vermutung"},
        ],
        "freitext": True,
    },
]


def universal_fragen() -> list[dict]:
    """Liefert die 5 universellen Triage-Fragen (frische Kopie)."""
    return [
        {
            "q": f["q"],
            "hint": f["hint"],
            "options": [dict(o) for o in f["options"]],
            "freitext": f["freitext"],
        }
        for f in _FRAGEN
    ]
