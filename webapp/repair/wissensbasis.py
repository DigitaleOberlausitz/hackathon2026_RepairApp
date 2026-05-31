"""Kuratierte Fehlerzustands-Wissensbasis (PROJ-15) + Rückruf-Daten (PROJ-19).

Datenmodell je Fehlerzustand (exakt nach Konzept-Inhaltsmodell):
  {id, kategorie, modell?, symptome:[tags], ursache,
   abgrenzungsfragen:[{q, options:[{a, tag}]}],
   sicherheit:"gut|mittel|stop", komplexitaet:"gut|mittel|stop",
   teile:[], werkzeug:[],
   anleitung?, quelle, herkunft:"kuratiert|ki-ermittelt",
   status:"geprueft|entwurf", version:int, stand:"YYYY-MM-DD",
   sicherheitBestaetigt:bool,
   rueckruf?:{art, grund, quelle, stand, gueltigBis, vorgehen}}

Öffentliche API:
  list_fehlerzustaende(status, kat)      → Liste (nur geprueft oder nur entwurf)
  get(id)                                → einzelner Eintrag oder None
  find_by_symptom(kat, tags)             → geprueft-Kandidaten
  entwurf_erzeugen(kat, symptom, lang)   → neuer Entwurf in DB gespeichert
  freigeben(id, sicherheit, komplexitaet, sicherheitBestaetigt) → freigegebener Eintrag
  zurueckziehen(id)                      → Status zurück auf entwurf
  invalidiere_entwurf(id)                → Entwurf als ungültig markieren
  find_rueckruf(modell, kat)             → Rückruf-Treffer oder None

Seed-Daten: Toaster, Mikrowelle + 8 weitere + ≥2 mit rueckruf.
Entwürfe: SQLite webapp/wissensbasis.db (gitignored).
"""

from __future__ import annotations

import json
import logging
import os
import re
import secrets
import sqlite3
from datetime import datetime, timezone

log = logging.getLogger(__name__)

# DB liegt in webapp/ (eine Ebene über repair/)
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "wissensbasis.db"))

_SCHEMA = """
CREATE TABLE IF NOT EXISTS entwuerfe (
    id       TEXT PRIMARY KEY,
    data     TEXT NOT NULL,
    created  TEXT NOT NULL,
    updated  TEXT NOT NULL
);
"""

_TODAY = "2026-05-30"


# ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

def _now_str() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    """Verbindung öffnen + Tabelle anlegen (idempotent)."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute(_SCHEMA)
    conn.commit()
    return conn


# ─── Statischer Seed-Datensatz ────────────────────────────────────────────────

_SEED: list[dict] = [
    # ── Toaster ───────────────────────────────────────────────────────────────
    {
        "id": "toaster-auswurf",
        "kategorie": "küchengeräte",
        "modell": None,
        "symptome": ["hebel-hält-nicht", "wirft-nicht-aus", "brot-klemmt", "toaster"],
        "ursache": "Hebelmechanik blockiert durch Krümel oder ausgehängte Zugfeder",
        "abgrenzungsfragen": [
            {
                "q": "Was passiert, wenn du den Hebel runterdrückst?",
                "options": [
                    {"a": "Bleibt gar nicht erst unten", "tag": "hält-nicht"},
                    {"a": "Bleibt kurz, springt sofort hoch", "tag": "springt-sofort"},
                    {"a": "Bleibt unten, wirft nie aus", "tag": "wirft-nicht"},
                ],
            },
            {
                "q": "Wird der Toaster warm?",
                "options": [
                    {"a": "Ja, wird warm", "tag": "warm"},
                    {"a": "Nein, bleibt kalt", "tag": "kalt"},
                ],
            },
        ],
        "sicherheit": "gut",
        "komplexitaet": "gut",
        "teile": [],
        "werkzeug": ["Schraubendreher (PH1)", "Pinsel"],
        "anleitung": "Stecker ziehen → Boden abschrauben → Feder einhängen / Magnet säubern → zusammenbauen → testen.",
        "quelle": "Kuratierte Reparaturanleitung (Werkstattpraxis)",
        "herkunft": "kuratiert",
        "status": "geprueft",
        "version": 1,
        "stand": "2026-03-15",
        "sicherheitBestaetigt": True,
    },
    # ── Mikrowelle ────────────────────────────────────────────────────────────
    {
        "id": "mikrowelle-magnetron",
        "kategorie": "küchengeräte",
        "modell": None,
        "symptome": ["keine-wärme", "brummt-laut", "mikrowelle", "drehteller-dreht-nicht"],
        "ursache": "Defektes Magnetron oder Hochspannungsdiode",
        "abgrenzungsfragen": [
            {
                "q": "Dreht sich der Glasteller?",
                "options": [
                    {"a": "Ja, dreht sich", "tag": "teller-dreht"},
                    {"a": "Nein, steht still", "tag": "teller-still"},
                ],
            },
            {
                "q": "Hast du das Gehäuse schon geöffnet?",
                "options": [
                    {"a": "Nein, nichts geöffnet", "tag": "ungeöffnet"},
                    {"a": "Ja, habe ich geöffnet", "tag": "geöffnet"},
                ],
            },
        ],
        "sicherheit": "stop",
        "komplexitaet": "stop",
        "teile": ["Magnetron", "Hochspannungsdiode"],
        "werkzeug": [],
        "anleitung": "NICHT selbst öffnen — Hochspannungskondensator kann auch ausgesteckt tödlich sein. Fachwerkstatt kontaktieren.",
        "quelle": "Sicherheitshinweis VDE + Hersteller-Dokumentation",
        "herkunft": "kuratiert",
        "status": "geprueft",
        "version": 1,
        "stand": "2026-03-15",
        "sicherheitBestaetigt": True,
    },
    # ── Waschmaschine — Rückruf-Eintrag ───────────────────────────────────────
    {
        "id": "waschmaschine-heizung-rueckruf",
        "kategorie": "haushaltsgeräte",
        "modell": "SuperWash SWX-2000 (Baujahr 2022–2023)",
        "symptome": ["heizt-nicht", "überhitzung", "rauchentwicklung", "waschmaschine"],
        "ursache": "Defekte Heizungssteuerung — Brandgefahr (offizieller Rückruf)",
        "abgrenzungsfragen": [
            {
                "q": "Riechst du Rauch oder Kunststoff-Geruch beim Betrieb?",
                "options": [
                    {"a": "Ja, Rauch / Geruch", "tag": "rauch"},
                    {"a": "Nein", "tag": "kein-rauch"},
                ],
            },
        ],
        "sicherheit": "stop",
        "komplexitaet": "stop",
        "teile": [],
        "werkzeug": [],
        "anleitung": "Gerät SOFORT außer Betrieb nehmen. Hersteller kontaktieren für kostenlosen Austausch.",
        "quelle": "BfR Rückrufmeldung 2024-08-15 / Hersteller-Mitteilung",
        "herkunft": "kuratiert",
        "status": "geprueft",
        "version": 1,
        "stand": "2026-01-10",
        "sicherheitBestaetigt": True,
        "rueckruf": {
            "art": "rueckruf",
            "grund": "Brandgefahr durch defekte Heizungssteuerplatine — Überhitzung möglich",
            "quelle": "BfR Rückrufmeldung 2024-08-15",
            "stand": "2024-08-15",
            "gueltigBis": "2027-08-15",
            "vorgehen": (
                "Gerät sofort abstecken und nicht mehr verwenden. "
                "Hersteller-Hotline anrufen: 0800-123456 (kostenlos). "
                "Kostenloser Ersatz oder Rückerstattung."
            ),
        },
    },
    # ── Akku-Laptop — Rückruf (Brandgefahr) ──────────────────────────────────
    {
        "id": "laptop-akku-brandgefahr",
        "kategorie": "computer",
        "modell": "NoteBook Pro 15 (Akku-Serie BA-4500, 2021–2022)",
        "symptome": ["akku-heiß", "akku-bläht-sich", "laptop", "brandgefahr", "akkuprobleme"],
        "ursache": "Lithium-Akku mit Produktionsfehler — Überhitzung und Brandgefahr",
        "abgrenzungsfragen": [
            {
                "q": "Wölbt sich die Unterseite des Laptops oder des Akkus?",
                "options": [
                    {"a": "Ja, deutlich gewölbt", "tag": "akku-gebläht"},
                    {"a": "Nein, sieht normal aus", "tag": "normal"},
                ],
            },
            {
                "q": "Wird der Laptop ungewöhnlich heiß (auch bei leichter Nutzung)?",
                "options": [
                    {"a": "Ja, sehr heiß", "tag": "sehr-heiß"},
                    {"a": "Normal warm", "tag": "normal-warm"},
                ],
            },
        ],
        "sicherheit": "stop",
        "komplexitaet": "stop",
        "teile": ["Ersatzakku (vom Hersteller)"],
        "werkzeug": [],
        "anleitung": "NICHT laden. Gerät vom Stromnetz trennen. Hersteller-Support kontaktieren für kostenlosen Akku-Tausch.",
        "quelle": "Hersteller-Rückrufmeldung 2023-11-20 / EU Safety Gate",
        "herkunft": "kuratiert",
        "status": "geprueft",
        "version": 1,
        "stand": "2026-02-01",
        "sicherheitBestaetigt": True,
        "rueckruf": {
            "art": "rueckruf",
            "grund": "Li-Ion-Akku mit Produktionsfehler — Überhitzung, Schwellen und Brandgefahr",
            "quelle": "EU Safety Gate / Hersteller-Rückrufmeldung 2023-11-20",
            "stand": "2023-11-20",
            "gueltigBis": "2026-11-20",
            "vorgehen": (
                "Laptop sofort vom Stromnetz trennen und nicht mehr laden. "
                "Hersteller-Website für Rückruf-Registrierung aufrufen oder "
                "Support kontaktieren. Kostenloser Akku-Tausch wird angeboten."
            ),
        },
    },
    # ── Staubsauger — Saugkraft verloren ─────────────────────────────────────
    {
        "id": "staubsauger-keine-saugkraft",
        "kategorie": "haushaltsgeräte",
        "modell": None,
        "symptome": ["keine-saugkraft", "saugt-nicht", "schwach", "staubsauger"],
        "ursache": "Verstopfter Filter, voller Beutel oder blockierte Düse",
        "abgrenzungsfragen": [
            {
                "q": "Wann hast du zuletzt den Filter gereinigt oder gewechselt?",
                "options": [
                    {"a": "Vor weniger als 3 Monaten", "tag": "filter-neu"},
                    {"a": "Schon länger her / nie", "tag": "filter-alt"},
                    {"a": "Weiß ich nicht", "tag": "unklar"},
                ],
            },
            {
                "q": "Ist der Staubbeutel/-behälter voll?",
                "options": [
                    {"a": "Ja, voll oder fast voll", "tag": "behälter-voll"},
                    {"a": "Nein, noch Platz", "tag": "behälter-leer"},
                ],
            },
        ],
        "sicherheit": "gut",
        "komplexitaet": "gut",
        "teile": ["Staubfilter (HEPA oder Standard)", "Staubbeutel (falls nicht beutelfrei)"],
        "werkzeug": [],
        "anleitung": "Stecker ziehen → Beutel/Behälter leeren → Filter unter Wasser spülen (nur wenn waschbar) → trocknen → einsetzen → testen.",
        "quelle": "Allgemeine Reparaturpraxis / Herstelleranleitungen",
        "herkunft": "kuratiert",
        "status": "geprueft",
        "version": 1,
        "stand": "2026-01-20",
        "sicherheitBestaetigt": True,
    },
    # ── Smartphone — Display gebrochen ────────────────────────────────────────
    {
        "id": "smartphone-display",
        "kategorie": "mobilgeräte",
        "modell": None,
        "symptome": ["display-kaputt", "touchscreen-reagiert-nicht", "glas-gebrochen", "smartphone"],
        "ursache": "Gebrochenes Display-Glas oder defekter Touchscreen-Digitizer",
        "abgrenzungsfragen": [
            {
                "q": "Zeigt das Display noch etwas an (auch wenn Glas gebrochen)?",
                "options": [
                    {"a": "Ja, Bild ist noch sichtbar", "tag": "bild-vorhanden"},
                    {"a": "Nein, Display schwarz", "tag": "display-schwarz"},
                    {"a": "Streifen oder Flecken", "tag": "artefakte"},
                ],
            },
            {
                "q": "Reagiert der Touchscreen auf Eingaben?",
                "options": [
                    {"a": "Ja, funktioniert noch", "tag": "touch-ok"},
                    {"a": "Teilweise", "tag": "touch-teilweise"},
                    {"a": "Gar nicht", "tag": "touch-tot"},
                ],
            },
        ],
        "sicherheit": "mittel",
        "komplexitaet": "mittel",
        "teile": ["Display-Einheit (Display + Touchglas)", "Klebeband-Set"],
        "werkzeug": ["iSclack oder Saugnäpfe", "Öffnungswerkzeug-Set", "Haarföhn (optional)"],
        "anleitung": "Display-Tausch erfordert Fingerspitzengefühl. Tutorials zu deinem Modell auf iFixit.com empfehlenswert.",
        "quelle": "iFixit.com + Repair-Café-Erfahrungswerte",
        "herkunft": "kuratiert",
        "status": "geprueft",
        "version": 1,
        "stand": "2026-02-10",
        "sicherheitBestaetigt": True,
    },
    # ── Fahrrad — Schaltung schaltet schlecht ─────────────────────────────────
    {
        "id": "fahrrad-schaltung",
        "kategorie": "fahrrad",
        "modell": None,
        "symptome": ["schaltet-schlecht", "gang-springt", "kette-rutscht", "fahrrad"],
        "ursache": "Verschlissene Schalt-Zugspirale, dejustierter Umwerfer oder ausgeleiharkte Kette",
        "abgrenzungsfragen": [
            {
                "q": "Wann zuletzt Kette und Kassette gewechselt?",
                "options": [
                    {"a": "Noch nie / über 5000 km", "tag": "verschlissen"},
                    {"a": "Vor weniger als 2000 km", "tag": "relativ-neu"},
                    {"a": "Weiß ich nicht", "tag": "unklar"},
                ],
            },
            {
                "q": "Springt der Gang beim Treten unter Last?",
                "options": [
                    {"a": "Ja, besonders beim Anfahren", "tag": "springt-unter-last"},
                    {"a": "Zufällig / nur manchmal", "tag": "sporadisch"},
                    {"a": "Beim Schalten, nicht im Gang", "tag": "nur-beim-schalten"},
                ],
            },
        ],
        "sicherheit": "gut",
        "komplexitaet": "mittel",
        "teile": ["Schaltzug + Hülle", "Kette (bei Verschleiß)", "Kassette (bei Verschleiß)"],
        "werkzeug": ["Ketten-Verschleiß-Lehre", "Innensechskant-Set", "Kettennieter"],
        "anleitung": "Schalt-Zug wechseln + Umwerfer justieren: Park-Tool-Videotutorial auf YouTube. Kette messen → wenn >0,5% gestreckt → Kette + Kassette tauschen.",
        "quelle": "Park Tool Bike Repair Guides + Repair-Café-Erfahrungswerte",
        "herkunft": "kuratiert",
        "status": "geprueft",
        "version": 1,
        "stand": "2026-03-01",
        "sicherheitBestaetigt": True,
    },
    # ── Kaffeemaschine — tropft ────────────────────────────────────────────────
    {
        "id": "kaffeemaschine-tropft",
        "kategorie": "küchengeräte",
        "modell": None,
        "symptome": ["tropft", "wasser-läuft-durch", "dichtung-defekt", "kaffeemaschine"],
        "ursache": "Verschlissene Kanne-Dichtung oder defekte Ventil-Membran",
        "abgrenzungsfragen": [
            {
                "q": "Von wo genau tropft es?",
                "options": [
                    {"a": "Aus der Kanne / unten an der Maschine", "tag": "kanne-bereich"},
                    {"a": "Aus dem Brühkopf oben", "tag": "brühkopf"},
                    {"a": "Von der Seite", "tag": "seite"},
                ],
            },
        ],
        "sicherheit": "gut",
        "komplexitaet": "gut",
        "teile": ["Kanne-Dichtung (Universalteile 6–10 mm Durchmesser)", "Ventil-Membran"],
        "werkzeug": ["Schraubendreher", "Pinzette"],
        "anleitung": "Stecker ziehen → Kanne abnehmen → Dichtung prüfen und tauschen → bei Membran-Defekt Hersteller oder Repair Café kontaktieren.",
        "quelle": "Kuratierte Reparaturpraxis / Repair Café Erfahrungswerte",
        "herkunft": "kuratiert",
        "status": "geprueft",
        "version": 1,
        "stand": "2026-01-25",
        "sicherheitBestaetigt": True,
    },
    # ── Fernseher — kein Bild (Hintergrundbeleuchtung) ────────────────────────
    {
        "id": "fernseher-keine-hintergrundbeleuchtung",
        "kategorie": "unterhaltungselektronik",
        "modell": None,
        "symptome": ["kein-bild", "bild-sehr-dunkel", "hintergrundbeleuchtung", "fernseher"],
        "ursache": "Defekte LED-Hintergrundbeleuchtungsleiste oder Inverterschaltung",
        "abgrenzungsfragen": [
            {
                "q": "Ist mit einer Taschenlampe von vorne schräg hineinleuchten ein schwaches Bild erkennbar?",
                "options": [
                    {"a": "Ja, sehr schwaches Bild sichtbar", "tag": "bild-sichtbar"},
                    {"a": "Nein, gar kein Bild", "tag": "kein-bild"},
                ],
            },
            {
                "q": "Hört man den Ton noch?",
                "options": [
                    {"a": "Ja, Ton funktioniert", "tag": "ton-ok"},
                    {"a": "Nein, auch kein Ton", "tag": "kein-ton"},
                ],
            },
        ],
        "sicherheit": "mittel",
        "komplexitaet": "mittel",
        "teile": ["LED-Hintergrundbeleuchtungsleiste (modellspezifisch)", "Inverterkarte (bei älteren Modellen)"],
        "werkzeug": ["Schraubendreher-Set (T-Torx)", "Kunststoff-Öffner", "Multimeter (empfohlen)"],
        "anleitung": "Modellnummer notieren → LED-Leisten bei alibaba/amazon oder direkt beim Hersteller bestellen → iFixit-Anleitung für Modell suchen. Auf Entladung von Kondensatoren achten (10 min nach Ausstecken warten).",
        "quelle": "iFixit.com / Repair-Forum-Erfahrungswerte",
        "herkunft": "kuratiert",
        "status": "geprueft",
        "version": 1,
        "stand": "2026-02-20",
        "sicherheitBestaetigt": True,
    },
    # ── Elektroherd — Herdplatte heizt nicht ─────────────────────────────────
    {
        "id": "herd-herdplatte-heizt-nicht",
        "kategorie": "küchengeräte",
        "modell": None,
        "symptome": ["herdplatte-kalt", "heizt-nicht", "platte-funktioniert-nicht", "herd"],
        "ursache": "Defektes Heizelement (Kochzone) oder Schalter-/Regler-Defekt",
        "abgrenzungsfragen": [
            {
                "q": "Leuchtet die Kontroll-Lampe / zeigt das Display etwas an?",
                "options": [
                    {"a": "Ja, Display/Lampe aktiv", "tag": "elektronik-ok"},
                    {"a": "Nein, alles dunkel", "tag": "kein-strom"},
                ],
            },
            {
                "q": "Sind mehrere Platten betroffen oder nur eine?",
                "options": [
                    {"a": "Nur eine Platte", "tag": "einzelne-platte"},
                    {"a": "Mehrere / alle", "tag": "mehrere-platten"},
                ],
            },
        ],
        "sicherheit": "mittel",
        "komplexitaet": "mittel",
        "teile": ["Heizwendel / Kochzone (modellspezifisch)", "Schalter"],
        "werkzeug": ["Schraubendreher", "Multimeter"],
        "anleitung": "Sicherungskasten prüfen → Herd vom Strom trennen (Sicherung raus oder CEE-Stecker) → Fachmann empfohlen bei Innenverdrahtung.",
        "quelle": "VDE-Hinweise + Elektrofachkraft-Richtlinien",
        "herkunft": "kuratiert",
        "status": "geprueft",
        "version": 1,
        "stand": "2026-03-05",
        "sicherheitBestaetigt": True,
    },
]

# ─── Index-Aufbau ──────────────────────────────────────────────────────────────

_SEED_INDEX: dict[str, dict] = {e["id"]: e for e in _SEED}


# ─── Öffentliche API: Lesen ───────────────────────────────────────────────────


def list_fehlerzustaende(status: str | None = "geprueft", kat: str | None = None) -> list[dict]:
    """Liefert Fehlerzustände gefiltert nach Status und optionaler Kategorie.

    status: "geprueft" | "entwurf" | "alle" (Default: "geprueft")
    Nur "geprueft"-Einträge aus dem Seed; "entwurf" aus der DB.
    """
    status = (status or "geprueft").strip().lower()
    kat_filter = (kat or "").strip().lower()

    result: list[dict] = []

    # Seed-Einträge (immer geprueft)
    if status in ("geprueft", "alle"):
        for e in _SEED:
            if kat_filter and e["kategorie"].lower() != kat_filter:
                continue
            result.append(e)

    # DB-Entwürfe
    if status in ("entwurf", "alle"):
        result.extend(_list_entwuerfe(kat_filter))

    return result


def get(entry_id: str) -> dict | None:
    """Einzelner Eintrag: erst Seed, dann DB-Entwürfe."""
    entry_id = (entry_id or "").strip()
    if not entry_id:
        return None
    seed = _SEED_INDEX.get(entry_id)
    if seed:
        return seed
    return _get_entwurf(entry_id)


def find_by_symptom(kat: str | None = None, tags: list | None = None) -> list[dict]:
    """Symptom-Matching gegen **ausschließlich geprueft**-Einträge.

    Entwürfe werden NIE als kuratierte Kandidaten zurückgegeben.
    Einfaches Overlap-Scoring: je mehr Tags matchen, desto weiter vorne.
    """
    kat_filter = (kat or "").strip().lower()
    search_tags = {t.lower().strip() for t in (tags or []) if t} if tags else set()

    scored: list[tuple[int, dict]] = []
    for e in _SEED:
        if e.get("status") != "geprueft":
            continue
        if kat_filter and e["kategorie"].lower() != kat_filter:
            continue
        syms = {s.lower() for s in e.get("symptome", [])}
        overlap = len(syms & search_tags) if search_tags else 0
        if overlap > 0 or not search_tags:
            scored.append((overlap, e))

    scored.sort(key=lambda x: -x[0])
    return [e for _, e in scored]


def find_rueckruf(modell: str | None = None, kat: str | None = None) -> dict | None:
    """Rückruf-Check: Liefert den ersten passenden Rückruf-Eintrag oder None.

    Einfache Heuristik: Modell-Keyword in modell-Feld oder Symptomen.
    """
    modell_low = (modell or "").strip().lower()
    kat_low = (kat or "").strip().lower()

    for e in _SEED:
        if not e.get("rueckruf"):
            continue
        # Kategorie-Filter
        if kat_low and e["kategorie"].lower() != kat_low:
            continue
        # Modell-Match: leer → Eintrag hat kein Modell-Feld → kein harter Treffer
        e_modell = (e.get("modell") or "").lower()
        if modell_low and e_modell:
            # Beide gesetzt → Keyword-Overlap prüfen
            modell_words = set(re.split(r"[\s\-/]+", modell_low))
            e_words = set(re.split(r"[\s\-/]+", e_modell))
            if not modell_words & e_words:
                continue
        elif modell_low and not e_modell:
            # Modell angegeben, aber Eintrag hat kein Modell → modellUnsicher
            rueckruf = dict(e["rueckruf"])
            rueckruf["modellUnsicher"] = True
            return rueckruf
        rueckruf = dict(e["rueckruf"])
        rueckruf["modellUnsicher"] = False
        return rueckruf
    return None


# ─── DB-Entwürfe ──────────────────────────────────────────────────────────────


def _list_entwuerfe(kat_filter: str = "") -> list[dict]:
    try:
        conn = _connect()
        try:
            rows = conn.execute("SELECT id, data FROM entwuerfe").fetchall()
        finally:
            conn.close()
    except Exception:
        return []
    result = []
    for row in rows:
        try:
            e = json.loads(row[1])
            if kat_filter and str(e.get("kategorie", "")).lower() != kat_filter:
                continue
            result.append(e)
        except Exception:
            continue
    return result


def _get_entwurf(entry_id: str) -> dict | None:
    try:
        conn = _connect()
        try:
            row = conn.execute(
                "SELECT id, data FROM entwuerfe WHERE id = ?", (entry_id,)
            ).fetchone()
        finally:
            conn.close()
    except Exception:
        return None
    if not row:
        return None
    try:
        return json.loads(row[1])
    except Exception:
        return None


def _save_entwurf(entry: dict) -> None:
    """Speichert/überschreibt einen Entwurf in der DB."""
    conn = _connect()
    now = _now_str()
    try:
        existing = conn.execute(
            "SELECT id FROM entwuerfe WHERE id = ?", (entry["id"],)
        ).fetchone()
        data_json = json.dumps(entry, ensure_ascii=False)
        if existing:
            conn.execute(
                "UPDATE entwuerfe SET data = ?, updated = ? WHERE id = ?",
                (data_json, now, entry["id"]),
            )
        else:
            conn.execute(
                "INSERT INTO entwuerfe (id, data, created, updated) VALUES (?, ?, ?, ?)",
                (entry["id"], data_json, now, now),
            )
        conn.commit()
    finally:
        conn.close()


# ─── Öffentliche API: Schreiben ────────────────────────────────────────────────


def entwurf_erzeugen(kat: str, symptom: str, lang: str = "de") -> dict:
    """Erzeugt einen neuen Entwurf (KI-Heuristik-Fallback ohne Key).

    Speichert ihn in der DB und liefert den Eintrag zurück.
    """
    eid = "entwurf-" + secrets.token_urlsafe(8)
    # Einfache Heuristik aus Symptom-Text
    symptom_tags = [
        w.lower().replace(",", "").replace(".", "") for w in (symptom or "").split()
        if len(w) > 3
    ][:6]

    entry: dict = {
        "id": eid,
        "kategorie": (kat or "sonstige").strip().lower(),
        "modell": None,
        "symptome": symptom_tags or ["unbekannt"],
        "ursache": f"Mögliche Ursache zu: {symptom[:80]}" if symptom else "Ursache unbekannt",
        "abgrenzungsfragen": [
            {
                "q": "Wie lange besteht das Problem schon?",
                "options": [
                    {"a": "Ganz plötzlich", "tag": "plötzlich"},
                    {"a": "Schleichend", "tag": "schleichend"},
                    {"a": "Von Anfang an", "tag": "immer-so"},
                ],
            }
        ],
        "sicherheit": "mittel",  # konservativ
        "komplexitaet": "mittel",
        "teile": [],
        "werkzeug": [],
        "anleitung": None,
        "quelle": "KI-Entwurf (nicht geprüft)",
        "herkunft": "ki-ermittelt",
        "status": "entwurf",
        "version": 1,
        "stand": _TODAY,
        "sicherheitBestaetigt": False,
        "_lang": lang,
    }
    _save_entwurf(entry)
    log.info("Wissensbasis-Entwurf erzeugt: id=%s kategorie=%s", eid, entry["kategorie"])
    return entry


def freigeben(
    entry_id: str,
    sicherheit: str,
    komplexitaet: str | None = None,
    sicherheitBestaetigt: bool = False,
) -> dict | None:
    """Gibt einen Entwurf frei (setzt status="geprueft").

    Erfordert sicherheitBestaetigt==True — sonst None (Aufrufer → 409).
    Die übergebene sicherheit überschreibt den KI-Vorschlag verbindlich.
    Bei jeder inhaltlichen Änderung: version+1, stand aktualisiert.
    """
    if not sicherheitBestaetigt:
        log.warning("Freigabe abgelehnt (sicherheitBestaetigt fehlt): id=%s", entry_id)
        return None
    entry = _get_entwurf(entry_id)
    if not entry:
        log.warning("Freigabe: Entwurf nicht gefunden: id=%s", entry_id)
        return None
    entry["status"] = "geprueft"
    entry["sicherheit"] = sicherheit
    if komplexitaet:
        entry["komplexitaet"] = komplexitaet
    entry["sicherheitBestaetigt"] = True
    entry["version"] = int(entry.get("version", 1)) + 1
    entry["stand"] = _TODAY
    entry["herkunft"] = "kuratiert"
    _save_entwurf(entry)
    log.info("Wissensbasis-Eintrag freigegeben: id=%s sicherheit=%s version=%s",
             entry_id, sicherheit, entry["version"])
    return entry


def zurueckziehen(entry_id: str) -> dict | None:
    """Setzt Status eines Eintrags auf "entwurf" zurück (version+1, stand aktualisiert)."""
    entry = _get_entwurf(entry_id)
    if not entry:
        # Seed-Eintrag kann nicht in DB zurückgezogen werden — nur lesend
        seed = _SEED_INDEX.get(entry_id)
        if seed:
            return {**seed, "hinweis": "Seed-Einträge können nicht zurückgezogen werden."}
        return None
    entry["status"] = "entwurf"
    entry["version"] = int(entry.get("version", 1)) + 1
    entry["stand"] = _TODAY
    _save_entwurf(entry)
    log.info("Wissensbasis-Eintrag zurückgezogen: id=%s version=%s", entry_id, entry["version"])
    return entry


def invalidiere_entwurf(entry_id: str) -> bool:
    """Markiert einen noch ungeprüften Entwurf als ungültig (für PROJ-23 Widerruf).

    Löscht den Eintrag aus der DB (gelangt nicht in die kuratierte Sammlung).
    Gibt True zurück wenn erfolgreich.
    """
    try:
        conn = _connect()
        try:
            cursor = conn.execute("DELETE FROM entwuerfe WHERE id = ?", (entry_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()
    except Exception:
        return False


def counts() -> dict:
    """Anzahl geprueft + entwurf."""
    geprueft = sum(1 for e in _SEED if e.get("status") == "geprueft")
    entwurf = len(_list_entwuerfe())
    return {"geprueft": geprueft, "entwurf": entwurf}
