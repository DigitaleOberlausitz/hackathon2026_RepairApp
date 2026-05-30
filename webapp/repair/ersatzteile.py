"""Kuratierte Ersatzteil-Liste (PROJ-14 / Beschaffung).

Kuratierter Demo-Seed, kein Live-Shop, kein Scraping. Jeder Eintrag trägt
``quelle`` + ``kuratiert: True``.

Affiliate-Leitplanke (D8): Die Liste ist **immer günstigste Quelle zuerst**
sortiert. Die Bestelloption ist **nachgelagert**, klar als „Partner-Link
(Provision)" gekennzeichnet und **nie** vorausgewählt. Mindestens ein Teil ist
„nicht lieferbar" und verweist ehrlich auf Alternative/Hersteller.

Öffentliche API:
    list_ersatzteile(device=None, defekt=None) -> list[dict]
"""

from __future__ import annotations

_DEMO_QUELLE = "Kuratierte Demodaten (Vorbild: Ersatzteil-Marktplätze, Hersteller-Shops)"

_AFFILIATE_HINWEIS = "Partner-Link (Provision) — wir empfehlen zuerst die günstigste/sinnvollste Quelle, die Bestellung ist optional."

# ``_preisWert`` ist nur zum Sortieren (günstigste zuerst). Nicht lieferbare
# Teile haben keinen Preis und werden ans Ende sortiert.
_DATA: list[dict] = [
    {
        "id": "teil-toaster-feder",
        "teil": "Zugfeder für Hebelmechanik",
        "passendFuer": "toaster",
        "_preisWert": 3.5,
        "preis": "ca. 3,50 €",
        "verfuegbarkeit": "lieferbar",
        "versand": "2–4 Werktage",
        "defekte": ["wirft nicht aus", "Hebel hält nicht", "mechanik"],
        "bestelloption": {
            "verfuegbar": True,
            "partner": "Ersatzteil-Marktplatz (Demo)",
            "affiliate": True,
            "hinweis": _AFFILIATE_HINWEIS,
        },
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
    {
        "id": "teil-toaster-kruemelschublade",
        "teil": "Krümelschublade (Ersatz)",
        "passendFuer": "toaster",
        "_preisWert": 6.9,
        "preis": "ca. 6,90 €",
        "verfuegbarkeit": "lieferbar",
        "versand": "3–5 Werktage",
        "defekte": ["wirft nicht aus", "reinigung"],
        "bestelloption": {
            "verfuegbar": True,
            "partner": "Hersteller-Shop (Demo)",
            "affiliate": True,
            "hinweis": _AFFILIATE_HINWEIS,
        },
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
    {
        "id": "teil-mikrowelle-tuerschalter",
        "teil": "Türschalter (Sicherheitsschalter)",
        "passendFuer": "mikrowelle",
        "_preisWert": 8.5,
        "preis": "ca. 8,50 €",
        "verfuegbarkeit": "lieferbar",
        "versand": "3–6 Werktage",
        "defekte": ["wird nicht warm", "tür"],
        "bestelloption": {
            "verfuegbar": True,
            "partner": "Ersatzteil-Marktplatz (Demo)",
            "affiliate": True,
            "hinweis": _AFFILIATE_HINWEIS + " Einbau nur durch Fachkraft (Hochspannung).",
        },
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
    {
        "id": "teil-mikrowelle-magnetron",
        "teil": "Magnetron (Hochspannungsbauteil)",
        "passendFuer": "mikrowelle",
        "_preisWert": None,
        "preis": "modellabhängig — derzeit nicht lieferbar",
        "verfuegbarkeit": "nicht lieferbar",
        "versand": "—",
        "defekte": ["wird nicht warm", "keine wärme", "brummen"],
        "alternativhinweis": (
            "Magnetron-Tausch gehört in eine Fachwerkstatt. Bitte über den Hersteller-Service "
            "anfragen oder einen Profi beauftragen — der Einbau ist lebensgefährlich für Laien."
        ),
        "bestelloption": {
            "verfuegbar": False,
            "partner": "",
            "affiliate": False,
            "hinweis": "Nicht lieferbar — keine Bestelloption. Hersteller-Service / Fachwerkstatt anfragen.",
        },
        "quelle": _DEMO_QUELLE,
        "kuratiert": True,
    },
]


def _sort_key(entry: dict):
    """Günstigste zuerst; ``None``-Preis (nicht lieferbar) ans Ende."""
    val = entry.get("_preisWert")
    if val is None:
        return (1, 0.0)
    return (0, float(val))


def list_ersatzteile(device: str | None = None, defekt: str | None = None) -> list[dict]:
    """Ersatzteile **günstigste zuerst** (kuratierter Seed). Kann leer sein.

    ``device`` filtert über ``passendFuer`` (z.B. "toaster", "mikrowelle").
    ``defekt`` filtert per Teilstring gegen die hinterlegten Defekt-Tags.
    """
    # 1. Harter Filter: device (echter Leertreffer, wenn device unbekannt).
    base = []
    for entry in _DATA:
        if device:
            dev_low = device.strip().lower()
            if dev_low and dev_low not in str(entry.get("passendFuer", "")).lower():
                continue
        base.append(entry)

    # 2. Weiche Verfeinerung: defekt. Der Symptomtext aus dem Frontend (z.B.
    #    „Funken im Inneren") matcht oft keinen Tag — dann darf er die Liste
    #    NICHT leeren. Nur anwenden, solange ≥1 Treffer übrig bleibt.
    selected = base
    if defekt:
        def_low = defekt.strip().lower()
        if def_low:
            refined = [
                e for e in base
                if any(
                    t in def_low or def_low in t
                    for t in (str(x).lower() for x in e.get("defekte", []))
                )
            ]
            if refined:
                selected = refined

    selected = list(selected)
    selected.sort(key=_sort_key)

    out = []
    for entry in selected:
        item = dict(entry)
        item.pop("_preisWert", None)
        item.pop("defekte", None)
        out.append(item)
    return out
