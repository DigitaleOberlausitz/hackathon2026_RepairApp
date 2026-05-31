# LLM-Orchestrierung über runtime-roles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den bisherigen Single-Shot `POST /api/diagnose` durch einen LLM-orchestrierten, mehrstufigen Reparatur-Dialog ersetzen, dessen gesamtes Fachwissen aus `docs/runtime-roles/*.md` stammt und der über OpenAI-Function-Calling frei orchestriert (Progressive Disclosure wie Claude Code).

**Architecture:** Eine Rollen-Registry liest die `.md`-Specs beim Start in einen In-Memory-Cache. Ein Orchestrator führt eine Tool-Call-Schleife gegen die ChatGPT-API: Das Modell lädt Rollen progressiv (`lade_rolle`), ruft Daten-Tools (Wrapper um bestehende kuratierte Dienste) und gibt strukturierte Karten aus (`zeige_karte`, server-seitig schema-validiert). Der Vorgangs-Zustand (Verlauf, geladene Rollen, Karten, KI-Entscheidungsprotokoll) liegt server-seitig in `store.py`. Das Frontend wird zum Chat-Renderer mit eingebetteten Karten-Komponenten.

**Tech Stack:** Python 3 / Flask, OpenAI SDK (`chat.completions` + Tools + Structured Outputs), SQLite (`store.py`), Vanilla-JS-Frontend, pytest.

**Spec:** `docs/superpowers/specs/2026-05-31-llm-orchestrierung-runtime-roles-design.md`
**Konzept-Anker:** `docs/konzept.adoc` (D1/D15 warnen statt sperren, D3 Vertrauens-Indikator, D7/D19 Protokoll-Zustand, D20–D25 Edge-Cases).

**Leitplanke (verbindlich):** KEINE harten Flow-Schranken (D15). Reihenfolge/Sicherheit kommen inhaltlich aus den Rollen-Specs + System-Leitlinien. Nur technische Netze: Iterations-Limit, Schema-Validierung, Whitelist, Timeout.

---

## Phase 0 — Vorbereitung & Konfiguration

### Task 0: Konfigurationswerte ergänzen

**Files:**
- Modify: `webapp/repair/config.py`
- Modify: `webapp/.env.example`
- Test: `webapp/tests/test_config_orchestrator.py`

- [ ] **Step 1: Failing test schreiben**

```python
# webapp/tests/test_config_orchestrator.py
import os
from repair import config

def test_max_tool_iterations_default():
    os.environ.pop("MAX_TOOL_ITERATIONS", None)
    assert config.max_tool_iterations() == 12

def test_max_tool_iterations_from_env():
    os.environ["MAX_TOOL_ITERATIONS"] = "5"
    assert config.max_tool_iterations() == 5
    os.environ.pop("MAX_TOOL_ITERATIONS", None)
```

- [ ] **Step 2: Test ausführen, Fehlschlag prüfen**

Run: `cd webapp && python -m pytest tests/test_config_orchestrator.py -v`
Expected: FAIL (`AttributeError: module 'repair.config' has no attribute 'max_tool_iterations'`)

- [ ] **Step 3: Getter implementieren** (Muster der bestehenden Getter in `config.py` folgen, inkl. Fail-fast-Validierung wie bei `PORT`)

```python
# in webapp/repair/config.py
def max_tool_iterations() -> int:
    raw = os.environ.get("MAX_TOOL_ITERATIONS", "12")
    try:
        val = int(raw)
    except (TypeError, ValueError):
        raise SystemExit(f"MAX_TOOL_ITERATIONS muss eine Ganzzahl sein, war: {raw!r}")
    if val < 1:
        raise SystemExit("MAX_TOOL_ITERATIONS muss >= 1 sein")
    return val
```

- [ ] **Step 4: Test ausführen, Erfolg prüfen**

Run: `cd webapp && python -m pytest tests/test_config_orchestrator.py -v`
Expected: PASS

- [ ] **Step 5: `.env.example` dokumentieren** — Zeile ergänzen:

```
# Max. Tool-Call-Runden pro Chat-Turn (Endlosschleifen-/Kostenschutz). Default 12.
MAX_TOOL_ITERATIONS=12
```

- [ ] **Step 6: Drift-Guard prüfen**

Run: `cd webapp && python tests/test_config_drift.py`
Expected: PASS (keine Drift zwischen `.env.example` und ausgelesenen Variablen)

- [ ] **Step 7: Commit**

```bash
git add webapp/repair/config.py webapp/.env.example webapp/tests/test_config_orchestrator.py
git commit -m "feat(config): MAX_TOOL_ITERATIONS für Orchestrator-Schleife"
```

### Task 0b: Test-Infrastruktur (`conftest.py`) — FIX S4/S5

**Files:**
- Create: `webapp/conftest.py`

- [ ] **Step 1: `conftest.py` anlegen** — sichert `sys.path` (robust gegen `pytest`
  ohne `-m`) und lenkt die DB auf eine tmp-Datei (keine Schreibzugriffe auf die
  produktive `vorgaenge.db`):

```python
# webapp/conftest.py
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))  # FIX S4: 'repair'/'app' importierbar

import pytest

@pytest.fixture(autouse=True)
def _tmp_db(monkeypatch, tmp_path):
    """FIX S5: store.DB_PATH auf tmp-DB lenken (keine Nebenwirkung auf vorgaenge.db)."""
    from repair import store
    monkeypatch.setattr(store, "DB_PATH", str(tmp_path / "test_vorgaenge.db"), raising=False)
    yield
```

> **Hinweis:** Falls `store.py` die DB einmalig beim Import öffnet, prüfen, dass
> `DB_PATH` zur Aufrufzeit (`_connect()`) gelesen wird; sonst `store._connect` mocken.

- [ ] **Step 2: Verifizieren**

Run: `cd webapp && python -m pytest tests/test_config_orchestrator.py -v`
Expected: PASS (Import-Pfad funktioniert, keine neue DB-Datei im Repo)

- [ ] **Step 3: Commit**

```bash
git add webapp/conftest.py
git commit -m "test: conftest mit sys.path-Absicherung und tmp-DB"
```

---

## Phase 1 — Rollen-Registry

### Task 1: Frontmatter parsen + Katalog + Volltext-Cache

**Files:**
- Create: `webapp/repair/roles.py`
- Test: `webapp/tests/test_roles.py`

- [ ] **Step 1: Failing test schreiben**

```python
# webapp/tests/test_roles.py
from repair import roles

def test_katalog_enthaelt_alle_14_rollen():
    katalog = roles.katalog()
    namen = {r["name"] for r in katalog}
    erwartet = {
        "lotse", "aufnahme", "diagnose", "bewertung", "abwaegung",
        "begleitung", "wirkung", "produktsuche", "entsorgung",
        "recherche", "vermittlung", "beschaffung", "protokoll", "wissensbasis",
    }
    assert erwartet <= namen

def test_katalog_eintrag_hat_name_description_class():
    eintrag = next(r for r in roles.katalog() if r["name"] == "lotse")
    assert eintrag["description"]
    assert eintrag["class"] == "orchestrierung"

def test_lade_rolle_liefert_volltext_ohne_frontmatter():
    body = roles.lade_rolle("lotse")
    assert "# Rolle" in body
    assert not body.lstrip().startswith("---")  # Frontmatter abgetrennt

def test_lade_rolle_unbekannt_wirft():
    import pytest
    with pytest.raises(KeyError):
        roles.lade_rolle("gibtsnicht")
```

- [ ] **Step 2: Test ausführen, Fehlschlag prüfen**

Run: `cd webapp && python -m pytest tests/test_roles.py -v`
Expected: FAIL (`ModuleNotFoundError: repair.roles`)

- [ ] **Step 3: Implementieren**

```python
# webapp/repair/roles.py
"""Rollen-Registry: liest docs/runtime-roles/*.md (Frontmatter + Body).

Katalog (Name/Description/Class) ist der stabile Prompt-Präfix; die Volltexte
werden on-demand via lade_rolle() in den Modell-Kontext gegeben (Progressive
Disclosure). Pfad ist paket-relativ abgeleitet (Layout, kein .env-Wert).
"""
from __future__ import annotations

import os
import re
import threading

# webapp/repair/roles.py -> ../../docs/runtime-roles
_ROLES_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "docs", "runtime-roles")
)
_FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)
_lock = threading.Lock()
_cache: dict[str, dict] = {}  # name -> {"meta": {...}, "body": str, "mtime": float}


def _parse(text: str) -> tuple[dict, str]:
    m = _FM_RE.match(text)
    if not m:
        return {}, text.strip()
    fm_raw, body = m.group(1), m.group(2)
    meta: dict[str, str] = {}
    for line in fm_raw.splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
    return meta, body.strip()


def _load_file(name: str) -> dict:
    path = os.path.join(_ROLES_DIR, f"{name}.md")
    mtime = os.path.getmtime(path)
    with open(path, encoding="utf-8") as fh:
        meta, body = _parse(fh.read())
    return {"meta": meta, "body": body, "mtime": mtime}


def _entry(name: str) -> dict:
    path = os.path.join(_ROLES_DIR, f"{name}.md")
    if not os.path.isfile(path):
        raise KeyError(name)
    with _lock:
        cached = _cache.get(name)
        if cached is None or os.path.getmtime(path) != cached["mtime"]:
            cached = _load_file(name)
            _cache[name] = cached
        return cached


def _alle_namen() -> list[str]:
    return sorted(
        f[:-3] for f in os.listdir(_ROLES_DIR)
        if f.endswith(".md") and f != "README.md"
    )


def katalog() -> list[dict]:
    out = []
    for name in _alle_namen():
        meta = _entry(name)["meta"]
        out.append({
            "name": meta.get("name", name),
            "description": meta.get("description", ""),
            "class": meta.get("class", ""),
        })
    return out


def lade_rolle(name: str) -> str:
    return _entry(name)["body"]
```

- [ ] **Step 4: Test ausführen, Erfolg prüfen**

Run: `cd webapp && python -m pytest tests/test_roles.py -v`
Expected: PASS (alle 4 Tests)

- [ ] **Step 5: Commit**

```bash
git add webapp/repair/roles.py webapp/tests/test_roles.py
git commit -m "feat(roles): Rollen-Registry mit Frontmatter-Katalog und Volltext-Cache"
```

---

## Phase 2 — Karten-Schemata (Decomposition)

### Task 2: Karten-Schemata + Validierung

**Files:**
- Create: `webapp/repair/cards.py`
- Test: `webapp/tests/test_cards.py`

- [ ] **Step 1: Failing test schreiben**

```python
# webapp/tests/test_cards.py
import pytest
from repair import cards

def test_bekannte_typen_vorhanden():
    assert {"aufnahme", "diagnose", "ampel", "vergleich", "schritte",
            "hinweis", "anbieter", "ersatzteil", "erfolg"} <= set(cards.TYPEN)

def test_ampel_valide_karte():
    daten = {
        "achsen": {"sicherheit": "gruen", "komplexitaet": "gelb",
                   "kosten": "gruen", "machbarkeit": "gruen"},
        "gesamt": "gruen",
        "begruendung": "Nur Stecker ziehen nötig.",
        "trust": {"level": "hoch", "quelle": "kuratiert",
                  "konfidenz": "hoch", "hinweis": "KI kann Fehler machen."},
    }
    karte = cards.validate("ampel", daten)
    assert karte["typ"] == "ampel"
    assert karte["daten"]["gesamt"] == "gruen"

def test_ampel_ungueltiger_level_wirft():
    daten = {
        "achsen": {"sicherheit": "blau", "komplexitaet": "gelb",
                   "kosten": "gruen", "machbarkeit": "gruen"},
        "gesamt": "gruen", "begruendung": "x",
        "trust": {"level": "hoch", "quelle": "k", "konfidenz": "hoch", "hinweis": "h"},
    }
    with pytest.raises(cards.CardValidationError):
        cards.validate("ampel", daten)

def test_unbekannter_typ_wirft():
    with pytest.raises(cards.CardValidationError):
        cards.validate("gibtsnicht", {})

def test_diagnose_unklar_pfad():
    # D20: unklar-Pfad muss abbildbar sein
    daten = {"kandidaten": [], "abgrenzungsfragen": [], "unklar": True,
             "trust": {"level": "niedrig", "quelle": "KI-Fallback",
                       "konfidenz": "niedrig", "hinweis": "KI kann Fehler machen."}}
    karte = cards.validate("diagnose", daten)
    assert karte["daten"]["unklar"] is True
```

- [ ] **Step 2: Test ausführen, Fehlschlag prüfen**

Run: `cd webapp && python -m pytest tests/test_cards.py -v`
Expected: FAIL (`ModuleNotFoundError: repair.cards`)

- [ ] **Step 3: Implementieren** (JSON-Schema je Typ; Validierung mit `jsonschema`, das in `requirements.txt` ergänzt wird)

```python
# webapp/repair/cards.py
"""Karten-Schemata (Decomposition): pro Karten-Typ ein kleines JSON-Schema.

zeige_karte(typ, daten) wird server-seitig hier validiert. Querschnittsfeld
`trust` (Vertrauens-Indikator, D3) ist in diagnose/ampel/vergleich Pflicht.
"""
from __future__ import annotations

from jsonschema import Draft202012Validator

class CardValidationError(ValueError):
    pass

_LEVEL = {"enum": ["gruen", "gelb", "rot"]}
_TRUST = {
    "type": "object",
    "required": ["level", "quelle", "konfidenz", "hinweis"],
    "properties": {
        "level": {"enum": ["hoch", "mittel", "niedrig"]},
        "quelle": {"type": "string"},
        "konfidenz": {"enum": ["hoch", "mittel", "niedrig", "unklar"]},
        "hinweis": {"type": "string"},
    },
}

SCHEMAS: dict[str, dict] = {
    "aufnahme": {
        "type": "object",
        "required": ["symptom"],
        "properties": {
            "symptom": {"type": "string"},
            "kategorie": {"type": "string"},   # D23-Backstop: datentragend erkennen
            "bedingungen": {"type": "string"},
            "seit_wann": {"type": "string"},
            "getestet": {"type": "string"},
            "eigentum": {
                "type": "object",
                "properties": {
                    "ist_eigentuemer": {"type": "boolean"},
                    "kostentraeger": {"type": "string"},
                },
            },
        },
    },
    "diagnose": {
        "type": "object",
        "required": ["kandidaten", "unklar", "trust"],
        "properties": {
            "kandidaten": {"type": "array", "items": {"type": "object"}},
            "abgrenzungsfragen": {"type": "array", "items": {"type": "string"}},
            "unklar": {"type": "boolean"},
            "trust": _TRUST,
        },
    },
    "ampel": {
        "type": "object",
        "required": ["achsen", "gesamt", "begruendung", "trust"],
        "properties": {
            "achsen": {
                "type": "object",
                "required": ["sicherheit", "komplexitaet", "kosten", "machbarkeit"],
                "properties": {
                    "sicherheit": _LEVEL, "komplexitaet": _LEVEL,
                    "kosten": _LEVEL, "machbarkeit": _LEVEL,
                },
            },
            "gesamt": _LEVEL,
            "begruendung": {"type": "string"},
            "defekt": {"type": "string"},  # D24: pro Defekt eine Ampel
            "trust": _TRUST,
        },
    },
    "vergleich": {
        "type": "object",
        "required": ["empfehlung", "begruendung", "trust"],
        "properties": {
            "repair": {"type": "object"}, "pro": {"type": "object"},
            "neu": {"type": "object"}, "entsorgung": {"type": "object"},
            "empfehlung": {"enum": ["repair", "pro", "neu", "entsorgung"]},
            "begruendung": {"type": "string"},
            "geschaetzt": {"type": "boolean"},
            "trust": _TRUST,
        },
    },
    "schritte": {
        "type": "object",
        "required": ["schritte", "trust"],  # D3/A5: trust auf dem gefährlichsten Output Pflicht
        "properties": {
            "schritte": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["titel"],
                    "properties": {
                        "titel": {"type": "string"},
                        "anfaenger": {"type": "string"},
                        "profi": {"type": "string"},
                        "safety": {"type": "boolean"},
                        "danger": {"type": "boolean"},
                        "handoff": {"type": "boolean"},
                    },
                },
            },
            "garantie_hinweis": {"type": "string"},
            "misserfolg_pfad": {"type": "string"},
            "bestaetigung_noetig": {"type": "boolean"},   # D25: vulnerable Nutzer
            "bestaetigung_text": {"type": "string"},
            "trust": _TRUST,
        },
    },
    "hinweis": {
        "type": "object",
        "required": ["art", "text"],
        "properties": {
            "art": {"enum": ["garantie", "rueckruf", "datenloeschung",
                             "sicherheit", "eigentum"]},
            "text": {"type": "string"},
            "schwere": {"enum": ["info", "warnung", "kritisch"]},
        },
    },
    "anbieter": {
        "type": "object",
        "required": ["eintraege"],
        "properties": {"eintraege": {"type": "array", "items": {"type": "object"}}},
    },
    "ersatzteil": {
        "type": "object",
        "required": ["eintraege"],
        "properties": {
            "eintraege": {"type": "array", "items": {"type": "object"}},
            "affiliate_hinweis": {"type": "string"},
        },
    },
    "erfolg": {
        "type": "object",
        "properties": {
            "gespart_geld": {"type": "string"},
            "gespart_co2": {"type": "string"},
            "mutmach_satz": {"type": "string"},
        },
    },
}

TYPEN = tuple(SCHEMAS.keys())


def validate(typ: str, daten: dict) -> dict:
    schema = SCHEMAS.get(typ)
    if schema is None:
        raise CardValidationError(f"Unbekannter Karten-Typ: {typ!r}")
    errors = sorted(Draft202012Validator(schema).iter_errors(daten),
                    key=lambda e: list(e.path))
    if errors:
        msg = "; ".join(f"{list(e.path)}: {e.message}" for e in errors[:3])
        raise CardValidationError(f"Karte '{typ}' ungültig: {msg}")
    return {"typ": typ, "daten": daten}
```

- [ ] **Step 4: `jsonschema` zu requirements ergänzen**

Modify `webapp/requirements.txt`: Zeile `jsonschema>=4.21` ergänzen, dann
Run: `cd webapp && pip install -r requirements.txt`

- [ ] **Step 5: Test ausführen, Erfolg prüfen**

Run: `cd webapp && python -m pytest tests/test_cards.py -v`
Expected: PASS (alle 5 Tests)

- [ ] **Step 6: Commit**

```bash
git add webapp/repair/cards.py webapp/tests/test_cards.py webapp/requirements.txt
git commit -m "feat(cards): per-Rolle dekomponierte Karten-Schemata mit Validierung"
```

---

## Phase 3 — Daten-Tools (Wrapper um bestehende Dienste)

### Task 3: Tool-Definitionen + Dispatch

**Files:**
- Create: `webapp/repair/tools.py`
- Test: `webapp/tests/test_tools.py`

- [ ] **Step 1: Failing test schreiben**

```python
# webapp/tests/test_tools.py
from repair import tools

def test_tool_specs_enthalten_kern_tools():
    namen = {t["function"]["name"] for t in tools.specs()}
    assert {"lade_rolle", "zeige_karte", "finde_anbieter",
            "suche_ersatzteil", "finde_foerderung", "finde_entsorgung",
            "recherche"} <= namen

def test_dispatch_lade_rolle():
    res = tools.dispatch("lade_rolle", {"name": "lotse"}, vorgang_id="v1")
    assert "# Rolle" in res["content"]

def test_dispatch_zeige_karte_valide():
    daten = {"art": "sicherheit", "text": "Stecker ziehen.", "schwere": "warnung"}
    res = tools.dispatch("zeige_karte", {"typ": "hinweis", "daten": daten}, vorgang_id="v1")
    assert res["karte"]["typ"] == "hinweis"

def test_dispatch_zeige_karte_ungueltig_liefert_fehler_statt_exception():
    res = tools.dispatch("zeige_karte", {"typ": "ampel", "daten": {}}, vorgang_id="v1")
    assert res["error"]  # Fehler-Ergebnis ans Modell, keine Exception

def test_dispatch_unbekanntes_tool():
    res = tools.dispatch("gibtsnicht", {}, vorgang_id="v1")
    assert res["error"]
```

- [ ] **Step 2: Test ausführen, Fehlschlag prüfen**

Run: `cd webapp && python -m pytest tests/test_tools.py -v`
Expected: FAIL (`ModuleNotFoundError: repair.tools`)

- [ ] **Step 3: Implementieren**

```python
# webapp/repair/tools.py
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
```

> **Hinweis an Implementierer:** Signaturen der bestehenden Dienste prüfen
> (`anbieter.list_anbieter(kat, ort)`, `ersatzteile.list_ersatzteile(device, defekt)`,
> `foerderung.list_foerderungen()`, `entsorgung.list_entsorgung(kat, ort)`,
> `recherche.recherche(frage, kontext, lang)`). Falls `recherche.recherche` ein
> Pflicht-`lang`-Argument hat, hier `lang="de"` mitgeben.

- [ ] **Step 4: Test ausführen, Erfolg prüfen**

Run: `cd webapp && python -m pytest tests/test_tools.py -v`
Expected: PASS (alle 5 Tests)

- [ ] **Step 5: Commit**

```bash
git add webapp/repair/tools.py webapp/tests/test_tools.py
git commit -m "feat(tools): lade_rolle, zeige_karte und Daten-Tool-Wrapper mit Dispatch"
```

---

## Phase 4 — Orchestrator-Schleife

### Task 4: System-Präfix (stabil, cache-freundlich)

**Files:**
- Create: `webapp/repair/orchestrator.py` (Teil 1: Präfix-Bau)
- Test: `webapp/tests/test_orchestrator_prefix.py`

- [ ] **Step 1: Failing test schreiben**

```python
# webapp/tests/test_orchestrator_prefix.py
from repair import orchestrator

def test_system_prefix_ist_stabil():
    a = orchestrator.system_prefix()
    b = orchestrator.system_prefix()
    assert a == b  # byte-identisch -> Prefix-Cache greift

def test_system_prefix_enthaelt_katalog_und_leitlinien():
    p = orchestrator.system_prefix()
    text = "\n".join(m["content"] for m in p)
    assert "warnen statt sperren" in text.lower()
    assert "lotse" in text.lower()           # Rollen-Katalog
    assert "diagnose" in text.lower()
    assert "kann fehler machen" in text.lower()  # Vertrauens-Indikator
```

- [ ] **Step 2: Test ausführen, Fehlschlag prüfen**

Run: `cd webapp && python -m pytest tests/test_orchestrator_prefix.py -v`
Expected: FAIL (`ModuleNotFoundError: repair.orchestrator`)

- [ ] **Step 3: Implementieren** (nur Präfix-Teil)

```python
# webapp/repair/orchestrator.py
"""LLM-Orchestrator: führt die Tool-Call-Schleife gegen die ChatGPT-API.

Stabiler System-Präfix (Leitlinien + Rollen-Katalog + Werkzeug-Hinweis) zuerst,
damit OpenAIs automatisches Prefix-Caching greift. Volltexte der Rollen kommen
on-demand über lade_rolle() NACH dem Präfix.
"""
from __future__ import annotations

import json

from . import roles, tools, config
from .ai import _resolve_backend, DEFAULT_OPENAI_MODEL  # Backend-Auflösung wiederverwenden

# Kompakte, STABILE Ableitung aus runtime-roles/lotse.md (nicht der Volltext —
# sonst Cache-Drift bei jeder Spec-Änderung). Volltext via lade_rolle("lotse").
_LEITLINIEN = """\
Du bist der „Reparatur-Helfer", ein orchestrierender Lotse. Du führst den Nutzer \
durch seinen Reparaturfall, indem du spezialisierte Fach-Rollen lädst und nutzt.

GRUNDHALTUNG (verbindlich):
- WARNEN STATT SPERREN: Du sperrst NICHTS. Auch bei gefährlichen Geräten begleitest \
du mit klaren, mit der Kritikalität ESKALIERENDEN Warnungen — der mündige Nutzer \
entscheidet. Je gefährlicher, desto deutlicher die Warnung und desto klarer die \
Empfehlung „Profi/Werkstatt".
- VERTRAUENS-INDIKATOR: Jede fachliche Einschätzung trägt Konfidenz + Begründung. \
Der Hinweis „die KI kann Fehler machen" erscheint immer, verstärkt bei Gefahr.
- EHRLICHER TON: ermutigen, aber nichts beschönigen. „Lohnt sich nicht" / „nicht \
selbst machen" klar sagen.
- PFLICHT-HINWEISE bei Bedarf (als zeige_karte typ=hinweis): Garantie/Gewährleistung \
vor dem ersten Eingriff, bekannter Rückruf, Datenlöschung vor Fremdabgabe bei \
datentragenden Geräten, Eigentum/Kostenträger wenn Nutzer ≠ Eigentümer.
- UNKLAR-PFAD: Kannst du nicht sicher eingrenzen, täusche keine Sicherheit vor — \
sag es ehrlich, das Protokoll bleibt nutzbar, leite an Profi/Café weiter.

ARBEITSWEISE:
1. Nutze den Rollen-Katalog unten, um die passende Rolle zu wählen.
2. lade_rolle(name) holt die volle Spezifikation einer Rolle in den Kontext — \
befolge sie dann genau.
3. Daten holst du über die Daten-Tools (finde_anbieter, suche_ersatzteil, \
finde_foerderung, finde_entsorgung, recherche).
4. Strukturierte Ergebnisse gibst du über zeige_karte(typ, daten) aus.
5. Dazwischen sprichst du in einfachem Deutsch mit dem Nutzer und stellst Rückfragen.
"""

_WERKZEUG_HINWEIS = """\
Karten-Typen für zeige_karte: aufnahme, diagnose, ampel, vergleich, schritte, \
hinweis, anbieter, ersatzteil, erfolg. Bei Mehrfachdefekten: pro Defekt eine \
ampel-Karte plus ein Gesamt-Fazit nach dem schwächsten Glied."""


def _katalog_text() -> str:
    zeilen = ["ROLLEN-KATALOG (Name — Klasse — Beschreibung):"]
    for r in roles.katalog():
        zeilen.append(f"- {r['name']} [{r['class']}]: {r['description']}")
    return "\n".join(zeilen)


def system_prefix() -> list[dict]:
    return [
        {"role": "system", "content": _LEITLINIEN},
        {"role": "system", "content": _katalog_text()},
        {"role": "system", "content": _WERKZEUG_HINWEIS},
    ]
```

- [ ] **Step 4: Test ausführen, Erfolg prüfen**

Run: `cd webapp && python -m pytest tests/test_orchestrator_prefix.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add webapp/repair/orchestrator.py webapp/tests/test_orchestrator_prefix.py
git commit -m "feat(orchestrator): stabiler System-Präfix (Leitlinien + Rollen-Katalog)"
```

### Task 5: Tool-Call-Schleife mit Iterations-Limit

**Files:**
- Modify: `webapp/repair/orchestrator.py` (Funktion `run_turn`)
- Test: `webapp/tests/test_orchestrator_loop.py`

- [ ] **Step 1: Failing test schreiben** (mit Fake-Client, kein echtes Netz)

```python
# webapp/tests/test_orchestrator_loop.py
from repair import orchestrator

class _Msg:
    def __init__(self, content=None, tool_calls=None):
        self.content = content
        self.tool_calls = tool_calls or []

class _ToolCall:
    def __init__(self, cid, name, args):
        self.id = cid
        self.type = "function"
        self.function = type("F", (), {"name": name, "arguments": args})

class _Choice:
    def __init__(self, msg): self.message = msg

class _Resp:
    def __init__(self, msg): self.choices = [_Choice(msg)]

class FakeClient:
    """Gibt erst einen zeige_karte-Tool-Call zurück, dann eine Textantwort."""
    def __init__(self):
        self.calls = 0
        self.chat = type("C", (), {"completions": self})()
    def create(self, **kw):
        self.calls += 1
        if self.calls == 1:
            tc = _ToolCall("t1", "zeige_karte",
                           '{"typ":"hinweis","daten":{"art":"sicherheit","text":"Stecker ziehen."}}')
            return _Resp(_Msg(tool_calls=[tc]))
        return _Resp(_Msg(content="Alles klar, das war's."))

def test_run_turn_sammelt_karte_und_text():
    state = {"messages": [], "karten": [], "geladene_rollen": [],
             "entscheidungsprotokoll": []}
    result = orchestrator.run_turn(
        state, "Mein Toaster geht nicht", client=FakeClient(), model="x")
    assert result["antwort_text"] == "Alles klar, das war's."
    assert any(k["typ"] == "hinweis" for k in result["karten"])
    assert state["messages"]  # Verlauf wurde fortgeschrieben

def test_run_turn_respektiert_iterations_limit():
    class LoopClient(FakeClient):
        def create(self, **kw):
            tc = _ToolCall("t", "finde_foerderung", "{}")
            return _Resp(_Msg(tool_calls=[tc]))  # niemals fertig
    state = {"messages": [], "karten": [], "geladene_rollen": [],
             "entscheidungsprotokoll": []}
    result = orchestrator.run_turn(
        state, "x", client=LoopClient(), model="x", max_iterations=3)
    assert result["abgebrochen"] is True

def test_backstop_haengt_sicherheitshinweis_bei_rot_an():
    # A2: rote Ampel ohne Sicherheits-Hinweis -> Server hängt einen an (nicht-sperrend)
    class AmpelClient(FakeClient):
        def create(self, **kw):
            self.calls += 1
            if self.calls == 1:
                tc = _ToolCall("t1", "zeige_karte",
                    '{"typ":"ampel","daten":{"achsen":{"sicherheit":"rot",'
                    '"komplexitaet":"rot","kosten":"gelb","machbarkeit":"gelb"},'
                    '"gesamt":"rot","begruendung":"Personengefahr.",'
                    '"trust":{"level":"hoch","quelle":"kuratiert","konfidenz":"hoch","hinweis":"KI kann Fehler machen."}}}')
                return _Resp(_Msg(tool_calls=[tc]))
            return _Resp(_Msg(content="Bitte zur Werkstatt."))
    state = {"messages": [], "karten": [], "geladene_rollen": [], "entscheidungsprotokoll": []}
    result = orchestrator.run_turn(state, "Auto bremst schlecht", client=AmpelClient(), model="x")
    assert any(k["typ"] == "hinweis" and k["daten"]["art"] == "sicherheit"
               for k in result["karten"])

def test_backstop_kein_doppelhinweis_wenn_modell_schon_warnt():
    class AmpelUndHinweisClient(FakeClient):
        def create(self, **kw):
            self.calls += 1
            if self.calls == 1:
                tc1 = _ToolCall("t1", "zeige_karte",
                    '{"typ":"ampel","daten":{"achsen":{"sicherheit":"rot",'
                    '"komplexitaet":"rot","kosten":"gelb","machbarkeit":"gelb"},'
                    '"gesamt":"rot","begruendung":"x",'
                    '"trust":{"level":"hoch","quelle":"k","konfidenz":"hoch","hinweis":"h"}}}')
                tc2 = _ToolCall("t2", "zeige_karte",
                    '{"typ":"hinweis","daten":{"art":"sicherheit","text":"Vorsicht!","schwere":"kritisch"}}')
                return _Resp(_Msg(tool_calls=[tc1, tc2]))
            return _Resp(_Msg(content="ok"))
    state = {"messages": [], "karten": [], "geladene_rollen": [], "entscheidungsprotokoll": []}
    result = orchestrator.run_turn(state, "x", client=AmpelUndHinweisClient(), model="x")
    sicherheits_hinweise = [k for k in result["karten"]
                            if k["typ"] == "hinweis" and k["daten"]["art"] == "sicherheit"]
    assert len(sicherheits_hinweise) == 1  # kein vom Server doppelt angehängter
```

- [ ] **Step 2: Test ausführen, Fehlschlag prüfen**

Run: `cd webapp && python -m pytest tests/test_orchestrator_loop.py -v`
Expected: FAIL (`AttributeError: module 'repair.orchestrator' has no attribute 'run_turn'`)

- [ ] **Step 3: Implementieren** (an `orchestrator.py` anhängen)

```python
# in webapp/repair/orchestrator.py

def run_turn(state: dict, user_text: str, *, client=None, model=None,
             max_iterations: int | None = None) -> dict:
    """Führt einen Chat-Turn aus. Mutiert state['messages'/'karten'/...].

    Liefert {"antwort_text", "karten", "abgebrochen"}.
    client/model optional injizierbar (Tests); sonst via _resolve_backend().
    """
    if client is None:
        client, model = _resolve_backend()  # FIX B2: _resolve_backend liefert 2-Tupel
        if client is None:
            return {"antwort_text": "", "karten": [], "abgebrochen": False,
                    "error": "Kein KI-Backend konfiguriert.", "code": "no_backend"}
    if max_iterations is None:
        max_iterations = config.max_tool_iterations()

    state.setdefault("messages", [])
    state.setdefault("karten", [])
    state.setdefault("geladene_rollen", [])
    state.setdefault("entscheidungsprotokoll", [])

    state["messages"].append({"role": "user", "content": user_text})
    neue_karten: list[dict] = []
    vorgang_id = state.get("vorgang_id", "")

    for _ in range(max_iterations):
        messages = system_prefix() + state["messages"]
        resp = client.chat.completions.create(
            model=model, messages=messages, tools=tools.specs(),
            temperature=0.4, timeout=config.llm_timeout())  # FIX S1: zentraler Getter, kein Duplikat
        msg = resp.choices[0].message
        tool_calls = list(getattr(msg, "tool_calls", []) or [])

        # Assistant-Nachricht (inkl. evtl. Tool-Calls) in den Verlauf
        state["messages"].append(_assistant_dict(msg, tool_calls))

        if not tool_calls:
            _sicherheits_backstop(neue_karten, state)  # nicht-sperrend, D15-konform
            return {"antwort_text": msg.content or "", "karten": neue_karten,
                    "abgebrochen": False}

        for tc in tool_calls:
            try:
                args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}
            res = tools.dispatch(tc.function.name, args, vorgang_id=vorgang_id)
            if "karte" in res:
                neue_karten.append(res["karte"])
                state["karten"].append(res["karte"])
                tool_content = json.dumps({"ok": True, "typ": res["karte"]["typ"]},
                                          ensure_ascii=False)
            elif "error" in res:
                tool_content = json.dumps({"error": res["error"]}, ensure_ascii=False)
            else:
                tool_content = res.get("content", "")
            if tc.function.name == "lade_rolle" and "error" not in res:
                state["geladene_rollen"].append(args.get("name"))
            state["entscheidungsprotokoll"].append(
                {"tool": tc.function.name, "args": args})
            state["messages"].append({
                "role": "tool", "tool_call_id": tc.id, "content": tool_content})

    # Iterations-Limit erreicht (technisches Netz, kein fachliches Gate)
    _sicherheits_backstop(neue_karten, state)
    return {"antwort_text":
            "Ich habe viele Schritte versucht und mache hier einen Zwischenstopp. "
            "Magst du mir noch eine Info geben?",
            "karten": neue_karten, "abgebrochen": True}


# Karten-Kategorien, die als datentragend gelten (D23) — Layout-Konstante.
_DATENTRAGEND = ("laptop", "notebook", "smartphone", "handy", "tablet", "pc", "computer")


def _hat_hinweis(karten: list[dict], arten: set[str]) -> bool:
    return any(k["typ"] == "hinweis" and k["daten"].get("art") in arten for k in karten)


def _sicherheits_backstop(neue_karten: list[dict], state: dict) -> None:
    """Nicht-sperrender Backstop (D15-konform: hängt NUR Hinweise an, blockiert nichts).

    Ersetzt die gestrichene deterministische stop-Mechanik des alten ai.py durch
    server-erzwungene, aber den DIY-Pfad nicht sperrende Hinweise:
      - Gefahr (ampel.sicherheit=rot ODER schritte mit danger:true) ohne
        Sicherheits-/Rückruf-Hinweis  → Sicherheits-Hinweis anhängen (A2).
      - Nutzer ≠ Eigentümer (aufnahme.eigentum.ist_eigentuemer=False) ohne
        Eigentums-Hinweis            → Eigentums-Hinweis anhängen (D14).
      - datentragendes Gerät genannt  → Datenlöschungs-Hinweis anhängen (D23).
    Hinweise werden an neue_karten UND state['karten'] angehängt.
    """
    def _push(art: str, text: str, schwere: str) -> None:
        from . import cards
        karte = cards.validate("hinweis", {"art": art, "text": text, "schwere": schwere})
        neue_karten.append(karte)
        state.setdefault("karten", []).append(karte)

    gefahr = any(
        k["typ"] == "ampel" and k["daten"].get("achsen", {}).get("sicherheit") == "rot"
        for k in neue_karten
    ) or any(
        k["typ"] == "schritte"
        and any(s.get("danger") for s in k["daten"].get("schritte", []))
        for k in neue_karten
    )
    if gefahr and not _hat_hinweis(neue_karten, {"sicherheit", "rueckruf"}):
        _push("sicherheit",
              "Diese Reparatur kann gefährlich sein. Im Zweifel lieber zur Fachkraft — "
              "du entscheidest selbst. (Die KI kann Fehler machen.)", "kritisch")

    # Eigentum (D14) — aus der jüngsten aufnahme-Karte
    for k in reversed(neue_karten):
        if k["typ"] == "aufnahme":
            eig = k["daten"].get("eigentum") or {}
            if eig.get("ist_eigentuemer") is False and not _hat_hinweis(neue_karten, {"eigentum"}):
                _push("eigentum",
                      "Du bist nicht der Eigentümer dieses Geräts. Vor einem Eingriff "
                      "Rücksprache halten; Kostenträger klären.", "warnung")
            kat = (k["daten"].get("symptom", "") + " " +
                   str(k["daten"].get("kategorie", ""))).lower()
            if any(w in kat for w in _DATENTRAGEND) and not _hat_hinweis(neue_karten, {"datenloeschung"}):
                _push("datenloeschung",
                      "Bevor du das Gerät aus der Hand gibst: Backup anlegen, Daten "
                      "löschen, Konten abmelden.", "warnung")
            break


def _assistant_dict(msg, tool_calls) -> dict:
    d = {"role": "assistant", "content": msg.content or ""}
    if tool_calls:
        d["tool_calls"] = [{
            "id": tc.id, "type": "function",
            "function": {"name": tc.function.name,
                         "arguments": tc.function.arguments or "{}"}}
            for tc in tool_calls]
    return d
```

> **FIX S1:** Kein eigener `config_timeout()` — `config.llm_timeout()` (vorhanden,
> `config.py`, mit `DEFAULT_LLM_TIMEOUT` + Fail-fast) wird direkt genutzt. Damit kein
> doppeltes Default-Literal (PROJ-30).

- [ ] **Step 4: Test ausführen, Erfolg prüfen**

Run: `cd webapp && python -m pytest tests/test_orchestrator_loop.py -v`
Expected: PASS (beide Tests)

- [ ] **Step 5: Commit**

```bash
git add webapp/repair/orchestrator.py webapp/tests/test_orchestrator_loop.py
git commit -m "feat(orchestrator): Tool-Call-Schleife mit Iterations-Limit und Zustands-Fortschreibung"
```

---

## Phase 5 — API-Routen (harter Schnitt)

### Task 6: `/api/vorgang` + `/api/chat`, `/api/diagnose` entfernen

**Files:**
- Modify: `webapp/app.py`
- Modify: `webapp/repair/store.py` (falls `vorgang_id` im state gebraucht wird — sicherstellen)
- Test: `webapp/tests/test_api_chat.py`

- [ ] **Step 1: Failing test schreiben** (Flask-Testclient, Orchestrator gemockt)

```python
# webapp/tests/test_api_chat.py
import json
import app as flask_app
from repair import orchestrator

def _client():
    flask_app.app.config["TESTING"] = True
    return flask_app.app.test_client()

def test_vorgang_anlegen():
    res = _client().post("/api/vorgang")
    assert res.status_code == 200
    assert res.get_json()["vorgang_id"]

def test_chat_turn(monkeypatch):
    def fake_run_turn(state, text, **kw):
        return {"antwort_text": "Hallo!", "karten": [], "abgebrochen": False}
    monkeypatch.setattr(orchestrator, "run_turn", fake_run_turn)
    c = _client()
    vid = c.post("/api/vorgang").get_json()["vorgang_id"]
    res = c.post("/api/chat", json={"vorgang_id": vid, "text": "Toaster kaputt"})
    assert res.status_code == 200
    assert res.get_json()["antwort_text"] == "Hallo!"

def test_chat_leerer_text_400():
    c = _client()
    vid = c.post("/api/vorgang").get_json()["vorgang_id"]
    res = c.post("/api/chat", json={"vorgang_id": vid, "text": "  "})
    assert res.status_code == 400
    assert res.get_json()["code"] == "empty"

def test_diagnose_route_entfernt():
    res = _client().post("/api/diagnose", json={"text": "x"})
    assert res.status_code == 404
```

- [ ] **Step 2: Test ausführen, Fehlschlag prüfen**

Run: `cd webapp && python -m pytest tests/test_api_chat.py -v`
Expected: FAIL (`/api/vorgang` 404 bzw. `/api/diagnose` noch 200)

- [ ] **Step 3: Implementieren** — in `app.py`:
  1. **FIX B1:** Die **bestehende** Route `@app.post("/api/vorgang")` (Funktion
     `api_vorgang_create`, ~`app.py:295`) **ersetzen** — nicht eine zweite hinzufügen
     (Flask wirft sonst `AssertionError: View function mapping is overwriting…` und die
     App startet nicht). Den Funktionsnamen `api_vorgang_create` beibehalten/überschreiben.
     Bestehende `GET/PUT /api/vorgang/<vid>` (~`app.py:308`) bewusst behalten (Zustand
     lesen/aktualisieren) — sie kollidieren nicht.
  2. Die `diagnose`-Route löschen.
  3. Status **200** bewusst gewählt (Test = Code = 200); Abweichung von der alten
     201-Konvention in `SPEC.md` notieren.

```python
# in webapp/app.py
from repair import store, orchestrator

@app.post("/api/vorgang")
def api_vorgang_create():  # ersetzt die bestehende gleichnamige Route (FIX B1)
    v = store.create_vorgang(state={"messages": [], "karten": [],
                                     "geladene_rollen": [], "entscheidungsprotokoll": []})
    # vorgang_id in den state spiegeln, damit Tools sie kennen
    state = v["state"] if isinstance(v.get("state"), dict) else {}
    state["vorgang_id"] = v["id"]
    store.save_vorgang(v["id"], state)
    return app.response_class(
        json.dumps({"vorgang_id": v["id"]}, ensure_ascii=False),
        mimetype="application/json")

@app.post("/api/chat")
def api_chat():
    body = request.get_json(silent=True) or {}
    vid = (body.get("vorgang_id") or "").strip()
    text = (body.get("text") or "").strip()
    if not text:
        return _json_error("Bitte beschreibe zuerst, was kaputt ist.", "empty", 400)
    v = store.get_vorgang(vid)
    if v is None:
        return _json_error("Unbekannter Vorgang.", "no_vorgang", 404)
    state = v["state"] if isinstance(v.get("state"), dict) else {}
    state.setdefault("vorgang_id", vid)
    result = orchestrator.run_turn(state, text)
    store.save_vorgang(vid, state)
    if result.get("error"):
        code = result.get("code", "ai_error")
        status = {"no_backend": 503}.get(code, 502)
        return _json_error(result["error"], code, status)
    return app.response_class(
        json.dumps({"vorgang_id": vid,
                    "antwort_text": result["antwort_text"],
                    "karten": result["karten"],
                    "abgebrochen": result["abgebrochen"]},
                   ensure_ascii=False),
        mimetype="application/json")
```

> **Hinweis:** Falls `_json_error` noch nicht existiert, kleine Helfer-Funktion in
> `app.py` ergänzen (gibt `{error, code}` mit Status zurück, `ensure_ascii=False`).
> Bestehende Stufe-2/3-Routen (`/api/anbieter` …) können bleiben — sie stören nicht;
> Entfernung optional in einem separaten Cleanup-Commit.

- [ ] **Step 4: Test ausführen, Erfolg prüfen**

Run: `cd webapp && python -m pytest tests/test_api_chat.py -v`
Expected: PASS (alle 4 Tests)

- [ ] **Step 5: Commit**

```bash
git add webapp/app.py webapp/tests/test_api_chat.py
git commit -m "feat(api): /api/vorgang + /api/chat; /api/diagnose entfernt (harter Schnitt)"
```

---

## Phase 6 — Frontend (Chat-Renderer + Karten)

### Task 7: Konversations-Statemachine in `app.js`

**Files:**
- Modify: `webapp/static/js/app.js`
- Manuell-Test: Browser

- [ ] **Step 1: Implementieren** — `app.js` so umbauen, dass beim Start ein Vorgang
  angelegt wird und Nachrichten an `/api/chat` gehen:

```javascript
// webapp/static/js/app.js (Kernpfad)
const State = { vorgangId: null, verlauf: [] };

async function initVorgang() {
  const r = await fetch("/api/vorgang", { method: "POST" });
  State.vorgangId = (await r.json()).vorgang_id;
}

async function sendeNachricht(text) {
  State.verlauf.push({ rolle: "user", text });
  renderVerlauf(State.verlauf);
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vorgang_id: State.vorgangId, text }),
  });
  const data = await r.json();
  if (data.code) { renderFehler(data); return; }
  State.verlauf.push({ rolle: "assistant", text: data.antwort_text, karten: data.karten });
  renderVerlauf(State.verlauf);
}
```

- [ ] **Step 2: Manuell testen**

Run: `cd webapp && python app.py` → Browser `http://127.0.0.1:5000`
Expected: Eingabe sendet, Antwort erscheint als Bubble (Karten in Task 8).

- [ ] **Step 3: Commit**

```bash
git add webapp/static/js/app.js
git commit -m "feat(frontend): Konversations-Statemachine gegen /api/chat"
```

### Task 8: Karten-Renderer in `screens.js`/`ui.js`

**Files:**
- Modify: `webapp/static/js/screens.js`
- Modify: `webapp/static/js/ui.js`
- Manuell-Test: Browser

- [ ] **Step 1: Implementieren** — `renderVerlauf` rendert Bubbles und für jede Karte
  je nach `typ` die passende Komponente. Bestehende Ampel-/Vergleich-/Schritte-Bausteine
  aus `ui.js` als Funktionen wiederverwenden (an die neuen Karten-`daten` anpassen):

```javascript
// webapp/static/js/screens.js
function renderKarte(k) {
  switch (k.typ) {
    case "ampel":     return UI.Ampel(k.daten);       // achsen{...}, gesamt, begruendung, trust
    case "vergleich": return UI.Vergleich(k.daten);
    case "schritte":  return UI.Schritte(k.daten);
    case "diagnose":  return UI.Diagnose(k.daten);    // inkl. unklar-Pfad
    case "hinweis":   return UI.Hinweis(k.daten);     // art/schwere -> Farbe
    case "anbieter":  return UI.Anbieter(k.daten);
    case "ersatzteil":return UI.Ersatzteil(k.daten);
    case "erfolg":    return UI.Erfolg(k.daten);
    case "aufnahme":  return UI.Aufnahme(k.daten);
    default:          return document.createComment("unbekannte karte");
  }
}
```

> **Hinweis:** `UI.Hinweis` muss `schwere` (info/warnung/kritisch) optisch eskalieren
> (Vertrauens-Indikator/„warnen statt sperren"). `UI.Ampel` rendert die 4 Achsen +
> Gesamt + `trust.hinweis` immer sichtbar.

- [ ] **Step 2: Manuell testen** — echten Turn auslösen, der eine Ampel-Karte erzeugt;
  prüfen, dass Achsen, Gesamt-Fazit und „KI kann Fehler machen"-Hinweis erscheinen.

- [ ] **Step 3: Commit**

```bash
git add webapp/static/js/screens.js webapp/static/js/ui.js
git commit -m "feat(frontend): Karten-Renderer für alle Karten-Typen im Chat-Verlauf"
```

---

## Phase 6.5 — Konzept-Treue (Rollen-Specs, D17, D3-Footer, Protokoll)

### Task R1: Edge-Cases D20–D25 in die Rollen-Specs einarbeiten

**Problem (Agent 1):** Spec §2 behauptet, D20–D25 seien in den Rollen-Specs verankert —
sie sind es NICHT. Da das gesamte Fachwissen laut Architektur in `docs/runtime-roles/*.md`
lebt, müssen die Auslöse-Bedingungen dort operationalisiert werden (nicht nur als Anker).

**Files (alle Modify):**
- `docs/runtime-roles/diagnose.md` — **D20:** expliziter unklar-Pfad: bei
  widersprüchlichen/zu vagen Symptomen `zeige_karte typ=diagnose` mit `unklar:true`,
  keine Scheinsicherheit, Protokoll bleibt nutzbar, Weiterleitung an Profi/Café.
- `docs/runtime-roles/begleitung.md` — **D21** konkretisieren (Garantie-Hinweis NUR bei
  technischem Defekt in Gewährleistung, NICHT bei Anwenderfehler/Wartung); **D25:** vor
  `danger`-Schritten `bestaetigung_noetig:true` + „Bist du volljährig? Traust du dir das
  zu?"; verbindlich: jeder Schritt eines Gefahr-Defekts setzt `danger`/`safety` korrekt.
- `docs/runtime-roles/bewertung.md` — **D24:** bei Mehrfachdefekten je Defekt eine
  `ampel`-Karte (`daten.defekt` setzen) + Gesamt-Fazit nach schwächstem Glied.
- `docs/runtime-roles/aufnahme.md` + `protokoll.md` — **D23:** bei datentragenden Geräten
  (Laptop/Smartphone/Tablet) Schutzschritt „Backup + Daten löschen + Konten abmelden" vor
  Fremdabgabe; `kategorie` in der `aufnahme`-Karte füllen.
- `docs/runtime-roles/lotse.md` (oder `recherche.md`) — **D22:** auf bekannten
  Rückruf/Sicherheitsmangel prüfen → `hinweis art=rueckruf` + Verweis auf Hersteller statt
  DIY. Ehrlich dokumentieren: ohne Rückruf-DB derzeit modell-ermessensbasiert.

- [ ] **Step 1:** Obige Trigger als kurze, beobachtbare Anweisungen in die jeweiligen
  Specs schreiben (im bestehenden Stil: Verantwortung/Vorgehen).
- [ ] **Step 2:** `grep -ri "D2[0-5]\|unklar\|rueckruf\|datenlösch\|datenloesch" docs/runtime-roles/`
  → jede Decision in mindestens einer Rolle nachweisbar.
- [ ] **Step 3:** Abgeleitete Kopien unter `.claude/skills/<rolle>/SKILL.md` nachziehen
  (Drift-Gefahr laut CLAUDE.md) — für die geänderten Rollen.
- [ ] **Step 4: Commit**

```bash
git add docs/runtime-roles/ .claude/skills/
git commit -m "docs(roles): Edge-Cases D20-D25 in die betroffenen Rollen-Specs operationalisiert"
```

### Task R2: Sprachunterstützung DE/EN (D17)

**Files:**
- Modify: `webapp/repair/orchestrator.py` (`system_prefix(lang="de")`, `run_turn` liest `state["lang"]`)
- Modify: `webapp/app.py` (`/api/vorgang` nimmt optional `lang`, default `"de"`)
- Test: `webapp/tests/test_orchestrator_lang.py`

- [ ] **Step 1: Failing test**

```python
# webapp/tests/test_orchestrator_lang.py
from repair import orchestrator

def test_prefix_stabil_pro_sprache():
    assert orchestrator.system_prefix("de") == orchestrator.system_prefix("de")
    assert orchestrator.system_prefix("en") == orchestrator.system_prefix("en")

def test_prefix_unterscheidet_sprachen():
    assert orchestrator.system_prefix("de") != orchestrator.system_prefix("en")
```

- [ ] **Step 2:** `system_prefix(lang="de")` um eine Sprachdirektive-Zeile ergänzen
  („Antworte auf Deutsch." / „Answer in English."), als zusätzliche `system`-Message
  ANS ENDE des Präfix (so bleiben beide Sprach-Präfixe je für sich byte-stabil und
  separat cachebar). `run_turn` liest `state.get("lang", "de")` und reicht es an
  `system_prefix` durch.
- [ ] **Step 3:** Test ausführen → PASS.
- [ ] **Step 4: Commit**

```bash
git add webapp/repair/orchestrator.py webapp/app.py webapp/tests/test_orchestrator_lang.py
git commit -m "feat(orchestrator): Sprachwahl DE/EN im Präfix (D17)"
```

### Task R3: Vertrauens-Indikator als unbedingter UI-Footer (D3/A5)

**Files:**
- Modify: `webapp/static/js/screens.js` (`renderVerlauf`)
- Manuell-Test: Browser

- [ ] **Step 1:** In `renderVerlauf` an **jede** Assistenz-Bubble (auch reine
  Text-Antworten ohne Karte) einen festen, dezenten Footer hängen: „ℹ Hinweis: Die KI
  kann Fehler machen — im Zweifel Fachkraft fragen." Bei vorhandener `hinweis`-Karte mit
  `schwere=kritisch` den Footer optisch verstärken. Nicht vom Modell-Output abhängig.
- [ ] **Step 2: Manuell testen** — Text-Antwort ohne Karte zeigt den Footer.
- [ ] **Step 3: Commit**

```bash
git add webapp/static/js/screens.js
git commit -m "feat(frontend): Vertrauens-Indikator als unbedingter Footer (D3)"
```

### Task R4: Chat-Turns protokollieren (PROJ-28, N2)

**Files:**
- Modify: `webapp/repair/protokoll_log.py` (`ENDPOINT_ROLLE` um `"api_chat": "lotse"` ergänzen)
- Modify: `webapp/repair/orchestrator.py` (Token-Usage je `create()` festhalten, analog `ai.py`)

- [ ] **Step 1:** `"api_chat": "lotse"` in `ENDPOINT_ROLLE` aufnehmen.
- [ ] **Step 2:** In `run_turn` nach jedem `client.chat.completions.create(...)` die
  `response.usage` (falls vorhanden) in `state["entscheidungsprotokoll"]` oder via
  `protokoll_log` festhalten (best-effort, nie hart scheitern).
- [ ] **Step 3: Commit**

```bash
git add webapp/repair/protokoll_log.py webapp/repair/orchestrator.py
git commit -m "feat(protokoll): Chat-Turns + Token-Usage erfassen (PROJ-28)"
```

---

## Phase 7 — Dokumentation & Aufräumen

### Task 9: SPEC.md, CLAUDE.md, README aktualisieren + ai.py-Altpfad

**Files:**
- Modify: `webapp/SPEC.md`
- Modify: `CLAUDE.md`
- Modify: `webapp/README.md`
- Modify/Decide: `webapp/repair/ai.py` (alter `diagnose()`-Pfad)

- [ ] **Step 1:** `webapp/SPEC.md` — den `device`-Monolith-Vertrag durch die neuen
  Karten-Schemata (aus `cards.py`) + die Endpunkte `/api/vorgang`, `/api/chat` ersetzen.
- [ ] **Step 2:** `CLAUDE.md` — Abschnitt „Architektur & Dateieigentum" und
  „POST /api/diagnose" auf den Orchestrator-Flow umschreiben; `roles.py`, `cards.py`,
  `tools.py`, `orchestrator.py` aufnehmen.
- [ ] **Step 3:** `webapp/README.md` — Smoke-Test auf den neuen Flow umstellen.
- [ ] **Step 4:** `ai.py` — `diagnose()` wird vom Orchestrator nicht mehr genutzt.
  Entweder entfernen oder auf einen dünnen `recherche`-/Hilfs-Pfad reduzieren.
  `_resolve_backend()` bleibt (wird vom Orchestrator wiederverwendet).
- [ ] **Step 5: Volle Test-Suite**

Run: `cd webapp && python -m pytest -q`
Expected: PASS (alle Tests grün)

- [ ] **Step 6: Backend-Smoke-Test (ohne Backend → sauberer Fehler)**

Run:
```bash
cd webapp
python -c "import os;os.environ.pop('OPENAI_API_KEY',None); from repair import orchestrator; print(orchestrator.run_turn({'messages':[]}, 'Toaster kaputt').get('code'))"
```
Expected: `no_backend`

- [ ] **Step 7: Commit**

```bash
git add webapp/SPEC.md CLAUDE.md webapp/README.md webapp/repair/ai.py
git commit -m "docs: SPEC/CLAUDE/README auf Orchestrator-Flow umgestellt"
```

---

## Self-Review (vom Plan-Autor durchgeführt)

**Spec-Abdeckung:**
- §3.1 Registry → Task 1 ✓ · §3.2 Tools → Task 3 ✓ · §3.3 Karten → Task 2 ✓ ·
  §3.4 Orchestrator → Task 4+5 ✓ · §3.5 Zustand → Task 5/6 (store) ✓ ·
  §4 Caching/Präfix → Task 4 ✓ · §5 Leitplanken → Task 0 (Limit) + Task 5 (Schleife) ✓ ·
  §6 API/Frontend → Task 6/7/8 ✓ · §7 Config → Task 0 ✓ · §9 unklar/Mehrfachdefekt →
  Karten-Schema `diagnose.unklar` + `ampel.defekt` (Task 2) ✓.
### Eingearbeitete 3-Agenten-Review-Befunde (2026-05-31)
- **Technik (Agent 2):** B1 (Routen-Kollision `/api/vorgang`) → Task 6 ersetzt die
  bestehende Route. B2 (`_resolve_backend` 2-Tupel) → Task 5 gefixt. S1 (`config_timeout`
  Duplikat) → `config.llm_timeout()`. S4/S5 (sys.path/Prod-DB) → Task 0b `conftest.py`.
  N2 (PROJ-28) → Task R4.
- **Konzept (Agent 1):** D20–D25 fehlten in den Rollen-Specs → **Task R1** arbeitet sie
  ein. D17 (DE/EN) → **Task R2**. `trust` jetzt auch auf `schritte` Pflicht.
- **Sicherheit (Agent 3, „Erzwingen ≠ Sperren"):** nicht-sperrender Backstop +
  Vertrauens-Footer (D3) → Task 5 (`_sicherheits_backstop`) + **Task R3**. A2 (Verlust der
  deterministischen Schutzschicht) damit D15-konform ersetzt. Eval-Suite aus den 4
  Beispiel-Protokollen: **bewusst auf später vertagt** (Nutzer-Entscheidung).
- **Spec-Abdeckung nach Nachbesserung:** D20–D25 (Task R1) ✓ · D17 (R2) ✓ · D3-Footer
  (R3) ✓ · D14/D23-Trigger (Task 5 Backstop) ✓ · Test-Infra (0b) ✓ · PROJ-28 (R4) ✓.

**Platzhalter-Scan:** keine TBD/TODO ohne Code; alle Code-Steps mit konkretem Code.

**Typ-Konsistenz:** `cards.validate(typ, daten) -> {"typ","daten"}` einheitlich in
`tools.dispatch` und `orchestrator.run_turn`; `roles.katalog()`/`roles.lade_rolle()`
und `tools.specs()`/`tools.dispatch()` konsistent benannt.
