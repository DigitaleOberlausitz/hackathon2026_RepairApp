"""Gesamt-Fazit für Mehrfachdefekte (PROJ-21).

Öffentliche API:
    gesamt_fazit(defekte) → dict | None

Logik: schwächstes Glied (Level-Rang: stop>mittel>gut, Empfehlungs-Rang: restriktivster gewinnt).
<2 Defekte → None.
knackpunktId: Defekt mit höchstem Sicherheits-Level, Tie-Break: höchste Kosten (heuristisch),
              dann deterministisch erster nach Eingabereihenfolge.
prioritaet: Defekt-ids nach Kritikalität sortiert.
"""

from __future__ import annotations

# Level-Rang (höher = kritischer)
_LEVEL_RANG: dict[str, int] = {"gut": 0, "mittel": 1, "stop": 2}
_LEVEL_DEFAULT = 0

# Empfehlungs-Rang (höher = restriktiver)
_EMPFEHLUNG_RANG: dict[str, int] = {"self": 0, "local": 1, "pro": 2, "replace": 3}
_EMPFEHLUNG_DEFAULT = 0


def gesamt_fazit(defekte: list[dict]) -> dict | None:
    """Berechnet das Gesamt-Fazit für eine Liste von Defekten.

    ``defekte`` = [{id, name, lights:[{key,icon,level,note}], recommend, verdictTitle?}]
    <2 Defekte → None.
    """
    if not isinstance(defekte, list) or len(defekte) < 2:
        return None

    # Level pro Defekt ermitteln (Sicherheits-Level ist maßgeblich)
    def defekt_sicherheitslevel(d: dict) -> int:
        lights = d.get("lights") if isinstance(d.get("lights"), list) else []
        for light in lights:
            if isinstance(light, dict) and light.get("key") == "Sicherheit":
                return _LEVEL_RANG.get(str(light.get("level", "gut")).lower(), _LEVEL_DEFAULT)
        return _LEVEL_DEFAULT

    def defekt_max_level(d: dict) -> int:
        """Höchster Level über alle 4 Lights."""
        lights = d.get("lights") if isinstance(d.get("lights"), list) else []
        max_l = 0
        for light in lights:
            if isinstance(light, dict):
                l = _LEVEL_RANG.get(str(light.get("level", "gut")).lower(), 0)
                if l > max_l:
                    max_l = l
        return max_l

    def empfehlung_rang(d: dict) -> int:
        return _EMPFEHLUNG_RANG.get(str(d.get("recommend", "self")).lower(), _EMPFEHLUNG_DEFAULT)

    # Schwächstes Glied: höchster Level gewinnt
    max_level_rank = max(defekt_max_level(d) for d in defekte)
    gesamt_level = _rang_zu_level(max_level_rank)

    # Restriktivste Empfehlung gewinnt
    max_empf_rank = max(empfehlung_rang(d) for d in defekte)
    gesamt_recommend = _rang_zu_empfehlung(max_empf_rank)

    # Knackpunkt: Defekt mit höchstem Sicherheits-Level
    sorted_by_kritisch = sorted(
        enumerate(defekte),
        key=lambda iv: (
            -defekt_sicherheitslevel(iv[1]),  # Sicherheits-Level (absteigend)
            -defekt_max_level(iv[1]),         # Max-Level Tie-Break
            iv[0],                            # Eingabereihenfolge
        ),
    )
    knackpunkt_idx, knackpunkt = sorted_by_kritisch[0]
    knackpunkt_id = str(knackpunkt.get("id", f"defekt-{knackpunkt_idx}"))

    # Begründung
    begruendung = _begruendung(gesamt_level, gesamt_recommend, knackpunkt, defekte)

    # Prioritäts-Liste (ids nach Kritikalität)
    prioritaet = [str(d.get("id", f"defekt-{i}")) for i, d in sorted_by_kritisch]

    # Einzel-Ergebnisse unverändert zurückgeben
    einzel = [_normalize_defekt(d) for d in defekte]

    return {
        "einzel": einzel,
        "gesamtFazit": {
            "recommend": gesamt_recommend,
            "level": gesamt_level,
            "knackpunktId": knackpunkt_id,
            "begruendung": begruendung,
            "prioritaet": prioritaet,
        },
    }


# ─── Hilfsfunktionen ──────────────────────────────────────────────────────────


def _rang_zu_level(rang: int) -> str:
    return {0: "gut", 1: "mittel", 2: "stop"}.get(rang, "mittel")


def _rang_zu_empfehlung(rang: int) -> str:
    return {0: "self", 1: "local", 2: "pro", 3: "replace"}.get(rang, "pro")


def _normalize_defekt(d: dict) -> dict:
    """Gibt den Defekt unverändert zurück (lights-Array ggf. normalisieren)."""
    lights = d.get("lights") if isinstance(d.get("lights"), list) else []
    # Sicherstellen, dass genau 4 Lichter vorhanden
    standard_lights = [
        {"key": "Sicherheit", "icon": "🛡️", "level": "gut", "note": ""},
        {"key": "Aufwand", "icon": "🔧", "level": "gut", "note": ""},
        {"key": "Kosten", "icon": "💶", "level": "gut", "note": ""},
        {"key": "Machbarkeit", "icon": "📦", "level": "gut", "note": ""},
    ]
    if len(lights) == 4:
        return dict(d)
    normalized = {**d, "lights": lights[:4] or standard_lights}
    return normalized


def _begruendung(level: str, recommend: str, knackpunkt: dict, alle: list[dict]) -> str:
    """Erzeugt eine kurze Begründung für das Gesamt-Fazit."""
    kn_name = knackpunkt.get("name") or knackpunkt.get("id") or "ein kritischer Defekt"
    empf_labels = {
        "self": "Selbst reparieren",
        "local": "Repair Café / Werkstatt",
        "pro": "Fachwerkstatt (Profi)",
        "replace": "Neuanschaffung",
    }
    empf_label = empf_labels.get(recommend, recommend)
    level_labels = {
        "gut": "unkritisch",
        "mittel": "mit Einschränkungen",
        "stop": "sicherheitskritisch",
    }
    level_label = level_labels.get(level, level)

    return (
        f"Gesamteinschätzung über {len(alle)} Defekte: {level_label}. "
        f"Knackpunkt ist \"{kn_name}\" — dieser Defekt bestimmt die Gesamt-Empfehlung. "
        f"Empfehlung: {empf_label}."
    )
