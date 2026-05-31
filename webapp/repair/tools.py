"""Tool-Layer für den Orchestrator: lade_rolle, Daten-Tools, zeige_karte.

specs() -> OpenAI-Tool-Definitionen. dispatch() führt einen Tool-Call aus und
liefert IMMER ein dict zurück (nie Exception): {"content": str} für Modell-Text,
{"karte": {...}} für eine Karte oder {"error": str} bei Problemen.
"""
from __future__ import annotations

import json

from . import roles, cards
from . import anbieter, ersatzteile, foerderung, entsorgung
from . import recherche as recherche_mod

# Rollennamen für die lade_rolle-Whitelist (enum) aus dem Katalog ableiten:
def _rollen_enum() -> list[str]:
    return [r["name"] for r in roles.katalog()]


def specs() -> list[dict]:
    return [
        {"type": "function", "function": {
            "name": "lade_rolle",
            "description": "Lädt die vollständige Spezifikation einer Fach-Rolle "
                           "in den Kontext. Vorher den Rollen-Katalog nutzen.",
            "parameters": {"type": "object", "required": ["name"], "properties": {
                "name": {"type": "string", "enum": _rollen_enum()}}}}},
        {"type": "function", "function": {
            "name": "zeige_karte",
            "description": "Gibt dem Nutzer eine strukturierte Karte aus (Ampel, "
                           "Vergleich, Schritte, …). Wird server-seitig validiert.",
            "parameters": {"type": "object", "required": ["typ", "daten"], "properties": {
                "typ": {"type": "string", "enum": list(cards.TYPEN)},
                "daten": {"type": "object"}}}}},
        {"type": "function", "function": {
            "name": "finde_anbieter",
            "description": "Repair-Cafés/Werkstätten nach Kategorie/Ort.",
            "parameters": {"type": "object", "properties": {
                "kat": {"type": "string"}, "ort": {"type": "string"}}}}},
        {"type": "function", "function": {
            "name": "suche_ersatzteil",
            "description": "Ersatzteile nach Gerät/Defekt.",
            "parameters": {"type": "object", "properties": {
                "device": {"type": "string"}, "defekt": {"type": "string"}}}}},
        {"type": "function", "function": {
            "name": "finde_foerderung",
            "description": "Aktuelle Förderprogramme (Reparatur-Bonus o. ä.).",
            "parameters": {"type": "object", "properties": {}}}},
        {"type": "function", "function": {
            "name": "finde_entsorgung",
            "description": "Fachgerechte Entsorgungs-/Recyclingwege nach Kategorie/Ort.",
            "parameters": {"type": "object", "properties": {
                "kat": {"type": "string"}, "ort": {"type": "string"}}}}},
        {"type": "function", "function": {
            "name": "recherche",
            "description": "Belegtes Wissen: kuratiert → online → KI-Fallback, "
                           "mit Quelle und Konfidenz.",
            "parameters": {"type": "object", "required": ["frage"], "properties": {
                "frage": {"type": "string"}, "kontext": {"type": "string"}}}}},
    ]


def dispatch(name: str, args: dict, vorgang_id: str) -> dict:
    try:
        if name == "lade_rolle":
            return {"content": roles.lade_rolle(args["name"])}
        if name == "zeige_karte":
            karte = cards.validate(args["typ"], args.get("daten", {}))
            return {"karte": karte}
        if name == "finde_anbieter":
            return {"content": json.dumps(
                anbieter.list_anbieter(args.get("kat"), args.get("ort")),
                ensure_ascii=False)}
        if name == "suche_ersatzteil":
            return {"content": json.dumps(
                ersatzteile.list_ersatzteile(args.get("device"), args.get("defekt")),
                ensure_ascii=False)}
        if name == "finde_foerderung":
            return {"content": json.dumps(
                foerderung.list_foerderungen(), ensure_ascii=False)}
        if name == "finde_entsorgung":
            return {"content": json.dumps(
                entsorgung.list_entsorgung(args.get("kat"), args.get("ort")),
                ensure_ascii=False)}
        if name == "recherche":
            return {"content": json.dumps(
                recherche_mod.recherche(args["frage"], args.get("kontext")),
                ensure_ascii=False)}
        return {"error": f"Unbekanntes Tool: {name}"}
    except cards.CardValidationError as exc:
        return {"error": str(exc)}
    except KeyError as exc:
        return {"error": f"Unbekanntes Argument/Rolle: {exc}"}
    except Exception as exc:  # nie hart scheitern — Fehler ans Modell
        return {"error": f"Tool '{name}' fehlgeschlagen: {exc}"}
