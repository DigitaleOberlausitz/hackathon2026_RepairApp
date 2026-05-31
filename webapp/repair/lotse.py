"""Lotse (PROJ-18) — prozedurales Routing ohne inhaltliche Sicherheits-Entscheidung.

HANDOFF_GRAPH: aufnahme → diagnose → bewertung → abwaegung →
               {begleitung|produktsuche|entsorgung} → wirkung
Querschnitt: recherche, vermittlung, beschaffung, protokoll, consent-station.

Öffentliche API:
    naechste_rolle(state)                  → str (Rollenname)
    steueroptionen(state)                  → list[dict]
    routing_log_eintrag(state, ereignis, ziel) → dict (Log-Eintrag)
    HANDOFF_GRAPH                          → dict (für API-Antwort)

Nur prozedural — keine inhaltliche Pfad-/Sicherheits-Entscheidung.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

log = logging.getLogger(__name__)

# ─── Handoff-Graph (explizit, geschlossen) ────────────────────────────────────

HANDOFF_GRAPH: dict = {
    "aufnahme": {
        "beschreibung": "Problemaufnahme (Gerät + Symptom)",
        "weiter": "diagnose",
        "querschnitt": ["recherche", "protokoll"],
    },
    "diagnose": {
        "beschreibung": "Ursachen-Eingrenzung (kuratiert + KI)",
        "weiter": "bewertung",
        "querschnitt": ["recherche", "protokoll"],
    },
    "bewertung": {
        "beschreibung": "Warn-Ampel (Sicherheit, Aufwand, Kosten, Machbarkeit)",
        "weiter": "abwaegung",
        "querschnitt": ["protokoll"],
    },
    "abwaegung": {
        "beschreibung": "Pfad-Empfehlung (Reparieren/Profi/Austausch/Entsorgung)",
        "weiter_self": "begleitung",
        "weiter_local": "produktsuche",
        "weiter_pro": "vermittlung",
        "weiter_replace": "produktsuche",
        "weiter_entsorgung": "entsorgung",
        "weiter_default": "begleitung",
        "querschnitt": ["recherche", "protokoll", "consent-station"],
    },
    "begleitung": {
        "beschreibung": "Schritt-für-Schritt-Anleitung (DIY)",
        "weiter": "wirkung",
        "querschnitt": ["protokoll", "beschaffung"],
    },
    "produktsuche": {
        "beschreibung": "Ersatz-/Neukauf-Suche",
        "weiter": "wirkung",
        "querschnitt": ["beschaffung", "protokoll"],
    },
    "entsorgung": {
        "beschreibung": "Entsorgungsweg",
        "weiter": "wirkung",
        "querschnitt": ["protokoll"],
    },
    "vermittlung": {
        "beschreibung": "Werkstatt/Profi-Vermittlung",
        "weiter": "wirkung",
        "querschnitt": ["protokoll"],
    },
    "wirkung": {
        "beschreibung": "Reflexion / Wirksamkeit",
        "weiter": None,  # Ende des Flows
        "querschnitt": ["protokoll"],
    },
}

# Rollen-Reihenfolge für Stage-Mapping
_ROLLEN_REIHENFOLGE = [
    "aufnahme", "diagnose", "bewertung", "abwaegung",
    "begleitung", "produktsuche", "entsorgung", "vermittlung", "wirkung",
]

# Stage → Rolle Mapping (Frontend-Stage → Lotsen-Rolle)
_STAGE_ZU_ROLLE: dict[str, str] = {
    "start": "aufnahme",
    "triage": "diagnose",
    "ampel": "bewertung",
    "decision": "abwaegung",
    "repair": "begleitung",
    "result": "wirkung",
    "path": "vermittlung",
    "": "aufnahme",
}


def naechste_rolle(state: dict) -> str:
    """Ermittelt die nächste Rolle deterministisch aus dem State.

    Consent-Gate vor Datenverarbeitung:
      → "consent-gate" wenn consent.status=="offen" und Datenverarbeitung ansteht.
    """
    if not isinstance(state, dict):
        return "aufnahme"

    # Consent-Gate prüfen (PROJ-18/22)
    consent = state.get("consent") or {}
    if isinstance(consent, dict) and consent.get("status", "offen") == "offen":
        # Datenverarbeitung anstehend wenn schon eine Stage >= diagnose
        stage = str(state.get("stage", "")).strip().lower()
        if stage in ("triage", "diagnose", "ampel", "bewertung", "decision", "abwaegung",
                     "repair", "begleitung", "result", "path", "wirkung"):
            return "consent-gate"

    # Aktuelle Rolle aus Stage
    stage = str(state.get("stage", "")).strip().lower()
    aktuelle_rolle = _STAGE_ZU_ROLLE.get(stage, "aufnahme")

    # Nächste Rolle aus Graph
    graph_node = HANDOFF_GRAPH.get(aktuelle_rolle, {})
    path = str(state.get("path", "")).strip().lower()
    recommend = ""
    device = state.get("device")
    if isinstance(device, dict):
        recommend = str(device.get("recommend", "")).strip().lower()

    if aktuelle_rolle == "abwaegung":
        # Pfad-spezifisches Routing
        if path == "self" or recommend == "self":
            return "begleitung"
        if path in ("local", "repaircafe"):
            return "produktsuche"
        if path in ("pro", "profi") or recommend == "pro":
            return "vermittlung"
        if path in ("replace", "neu"):
            return "produktsuche"
        if path == "entsorgung":
            return "entsorgung"
        return graph_node.get("weiter_default", "begleitung")

    return graph_node.get("weiter") or "wirkung"


def steueroptionen(state: dict, lang: str = "de") -> list[dict]:
    """Liefert die kontextuellen Steuer-Optionen für den aktuellen State.

    Immer: weiter (primär) + profi/café + austausch + entsorgen + abbrechen.
    """
    return [
        {
            "label": "Weiter",
            "ereignis": "weiter",
            "ziel": naechste_rolle(state),
            "primaer": True,
        },
        {
            "label": "Profi / Repair-Café",
            "ereignis": "wechsel",
            "ziel": "vermittlung",
            "primaer": False,
        },
        {
            "label": "Gerät ersetzen",
            "ereignis": "wechsel",
            "ziel": "produktsuche",
            "primaer": False,
        },
        {
            "label": "Entsorgen",
            "ereignis": "wechsel",
            "ziel": "entsorgung",
            "primaer": False,
        },
        {
            "label": "Abbrechen",
            "ereignis": "abbruch",
            "ziel": None,
            "primaer": False,
        },
    ]


def routing_log_eintrag(state: dict, ereignis: str, ziel: str | None = None) -> dict:
    """Erzeugt einen Log-Eintrag für das Routing-/Abbruch-Ereignis."""
    stage = str((state or {}).get("stage", "")).strip()
    aktuelle_rolle = _STAGE_ZU_ROLLE.get(stage.lower(), "aufnahme")
    ts = datetime.now(timezone.utc).isoformat()
    log.info("Lotse-Routing: ereignis=%s von=%s ziel=%s", ereignis, aktuelle_rolle, ziel or "(abbruch)")
    return {
        "ts": ts,
        "kind": "lotse",
        "ereignis": ereignis,
        "von": aktuelle_rolle,
        "ziel": ziel or "",
        "note": f"Lotse: {ereignis} → {ziel or '(abbruch)'}",
    }


def abschnitt_aus_state(state: dict) -> str:
    """Liefert den aktuellen Abschnitt im Handoff-Graph (für Route-Response)."""
    stage = str((state or {}).get("stage", "")).strip().lower()
    rolle = _STAGE_ZU_ROLLE.get(stage, "aufnahme")
    if rolle not in HANDOFF_GRAPH:
        return "aufnahme"
    return rolle
