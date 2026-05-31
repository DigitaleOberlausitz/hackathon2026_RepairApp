"""Validierung & Normalisierung eines ``device``-Objekts.

``normalize_device(raw)`` macht aus einem (z. B. von der KI gelieferten,
potenziell lückenhaften) Roh-Dict ein vollständiges, schema-konformes
``device``-Objekt — oder wirft ``DeviceValidationError``, wenn der Input
unrettbar kaputt ist (kein Dict, keinerlei verwertbarer Inhalt).

Schema-Vertrag: ``webapp/SPEC.md`` + ``webapp/STUFE1.md`` §4.
"""

from __future__ import annotations

import re

LEVELS = {"gut", "mittel", "stop"}
ACCENT_PATHS = {"gut", "stop"}
RECOMMENDS = {"self", "local", "pro", "replace"}

# genau diese 4 Lights, in dieser Reihenfolge
LIGHT_KEYS = ["Sicherheit", "Aufwand", "Kosten", "Machbarkeit"]
LIGHT_ICONS = {
    "Sicherheit": "🛡️",
    "Aufwand": "🔧",
    "Kosten": "💶",
    "Machbarkeit": "📦",
}

# 4-Pfad-Compare (PROJ-5 / STUFE1.md §4)
_COMPARE_RECOMMEND_MAP = {
    "self": "repair",
    "local": "pro",
    "pro": "pro",
    "replace": "neu",
}
_DEFAULT_VERSTECKT = [
    "Neueinrichtung",
    "Transport/Logistik",
    "Bedienung neu lernen",
    "Verkabelung",
    "Ausfallzeit",
]


class DeviceValidationError(ValueError):
    """Input ist so kaputt, dass kein sinnvolles device daraus wird."""


def _s(value, default: str = "") -> str:
    """Robust zu String — None/Zahlen sauber abfangen."""
    if value is None:
        return default
    if isinstance(value, str):
        return value.strip()
    return str(value)


def _slug(text: str, default: str) -> str:
    text = _s(text)
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or default


def _coerce_level(value, default: str = "mittel") -> str:
    val = _s(value).lower()
    return val if val in LEVELS else default


def _normalize_triage(raw_triage) -> list:
    if not isinstance(raw_triage, list):
        return []
    out = []
    for entry in raw_triage:
        if not isinstance(entry, dict):
            continue
        q = _s(entry.get("q"))
        if not q:
            continue
        raw_opts = entry.get("options")
        options = []
        if isinstance(raw_opts, list):
            for opt in raw_opts:
                if not isinstance(opt, dict):
                    continue
                a = _s(opt.get("a"))
                if not a:
                    continue
                # tag ist Pflicht — aus a ableiten, falls fehlt
                tag = _s(opt.get("tag")) or (a[:24] if a else "")
                options.append({"a": a, "tag": tag})
        if not options:
            options = [{"a": "Frei beschreiben", "tag": "frei"}]
        out.append({"q": q, "hint": _s(entry.get("hint")), "options": options})
    return out


def _normalize_lights(raw_lights) -> list:
    """Erzwingt genau 4 Lights mit den festen Keys in fester Reihenfolge."""
    by_key: dict = {}
    if isinstance(raw_lights, list):
        for light in raw_lights:
            if not isinstance(light, dict):
                continue
            key = _s(light.get("key"))
            if key in LIGHT_KEYS and key not in by_key:
                by_key[key] = light

    out = []
    for key in LIGHT_KEYS:
        src = by_key.get(key, {})
        icon = _s(src.get("icon")) or LIGHT_ICONS[key]
        out.append({
            "key": key,
            "icon": icon,
            "level": _coerce_level(src.get("level")),
            "note": _s(src.get("note")),
        })
    return out


def _normalize_steps(raw_steps) -> list:
    if not isinstance(raw_steps, list):
        raw_steps = []
    out = []
    for step in raw_steps:
        if not isinstance(step, dict):
            continue
        title = _s(step.get("title"))
        if not title:
            continue
        beginner = _s(step.get("beginner"))
        pro = _s(step.get("pro")) or beginner
        if not beginner:
            beginner = pro
        out.append({
            "title": title,
            "safety": bool(step.get("safety", False)),
            "danger": bool(step.get("danger", False)),
            "handoff": bool(step.get("handoff", False)),
            "beginner": beginner,
            "pro": pro,
            "slot": _s(step.get("slot")) or title,
        })
    if not out:
        # Mindestens ein sicherer Schritt, damit der Flow nie leer ist
        out.append({
            "title": "Stecker ziehen",
            "safety": True,
            "danger": False,
            "handoff": False,
            "beginner": "Bevor du irgendetwas öffnest: zieh den Netzstecker komplett aus der Steckdose.",
            "pro": "Netzstecker ziehen.",
            "slot": "Hand zieht Netzstecker",
        })
    return out


def _normalize_confidence(raw) -> dict:
    if not isinstance(raw, dict):
        raw = {}
    return {
        "level": _s(raw.get("level")) or "mittel",
        "source": _s(raw.get("source")) or "teils KI-Einschätzung",
        "note": _s(raw.get("note")) or "Einschätzung aus der Ferne — bitte mit Vorsicht behandeln.",
    }


def _compare_path(d, include_versteckt: bool = False) -> dict:
    """Normalisiert einen einzelnen Vergleichspfad (repair/pro/neu/entsorgung)."""
    d = d if isinstance(d, dict) else {}
    out = {
        "geld": _s(d.get("geld")) or "—",
        "zeit": _s(d.get("zeit")) or "—",
        "umwelt": _s(d.get("umwelt")) or "—",
    }
    if include_versteckt:
        raw_v = d.get("versteckt")
        if isinstance(raw_v, list) and raw_v:
            out["versteckt"] = [_s(v) for v in raw_v if _s(v)]
        else:
            out["versteckt"] = list(_DEFAULT_VERSTECKT)
    else:
        out["hinweis"] = _s(d.get("hinweis"))
    return out


def _normalize_compare(raw, recommend: str | None = None) -> dict:
    """Normalisiert compare IMMER auf 4-Pfad-Form (PROJ-5 / STUFE1.md §4).

    Toleriert alte 2-Pfad-Form (repair + neu) und hebt sie auf neue Form.
    Erzwingt empfehlung, begruendung, geschaetzt.
    """
    raw = raw if isinstance(raw, dict) else {}

    empfehlung = _s(raw.get("empfehlung"))
    if empfehlung not in ("repair", "pro", "neu", "entsorgung"):
        empfehlung = _COMPARE_RECOMMEND_MAP.get(recommend or "", "pro")

    return {
        "repair": _compare_path(raw.get("repair")),
        "pro": _compare_path(raw.get("pro")),
        "neu": _compare_path(raw.get("neu"), include_versteckt=True),
        "entsorgung": _compare_path(raw.get("entsorgung")),
        "empfehlung": empfehlung,
        "begruendung": _s(raw.get("begruendung")),
        "geschaetzt": bool(raw.get("geschaetzt", True)),
    }


def _normalize_success(raw) -> dict:
    if not isinstance(raw, dict):
        raw = {}
    return {
        "saved": _s(raw.get("saved")) or "—",
        "co2": _s(raw.get("co2")) or "—",
        "line": _s(raw.get("line")) or "Geschafft.",
    }


def normalize_device(raw: dict) -> dict:
    """Validiert/repariert ein device-Objekt.

    Raises:
        DeviceValidationError: wenn ``raw`` kein Dict ist oder weder Name
            noch verwertbarer Inhalt (triage/lights/steps) erkennbar ist.
    """
    if not isinstance(raw, dict):
        raise DeviceValidationError("device muss ein Objekt (dict) sein")

    name = _s(raw.get("name"))
    has_content = any(
        isinstance(raw.get(k), list) and raw.get(k)
        for k in ("triage", "lights", "steps")
    )
    if not name and not has_content:
        raise DeviceValidationError("device ohne Namen und ohne verwertbaren Inhalt")

    if not name:
        name = "Unbekanntes Gerät"

    device_id = _slug(raw.get("id") or name, "geraet")

    accent = _s(raw.get("accentPath")).lower()
    if accent not in ACCENT_PATHS:
        accent = "gut"

    recommend = _s(raw.get("recommend")).lower()
    if recommend not in RECOMMENDS:
        recommend = "self" if accent == "gut" else "pro"

    lights = _normalize_lights(raw.get("lights"))

    # Sicherheits-Leitplanke: wenn Sicherheit stop -> harte Konsequenzen
    sicherheit = next((lgt for lgt in lights if lgt["key"] == "Sicherheit"), None)
    if sicherheit and sicherheit["level"] == "stop":
        accent = "stop"
        recommend = "pro"

    device = {
        "id": device_id,
        "name": name,
        "emoji": _s(raw.get("emoji")) or "🔧",
        "blurb": _s(raw.get("blurb")) or name,
        "detail": _s(raw.get("detail")),
        "accentPath": accent,
        "triage": _normalize_triage(raw.get("triage")),
        "lights": lights,
        "verdictTitle": _s(raw.get("verdictTitle")) or "Hier ist meine Einschätzung.",
        "verdictBody": _s(raw.get("verdictBody")),
        "confidence": _normalize_confidence(raw.get("confidence")),
        "recommend": recommend,
        "steps": _normalize_steps(raw.get("steps")),
        "success": _normalize_success(raw.get("success")),
    }

    # compare IMMER erzeugen (auch bei accentPath=="gut"), 4-Pfad-Form (PROJ-5)
    device["compare"] = _normalize_compare(raw.get("compare"), recommend=recommend)

    return device
