"""Seed-Geräte für den Reparatur-Helfer.

Direkter Port von ``docs/design-handoff/project/repair-data.js`` ins
``device``-Schema aus ``webapp/SPEC.md``. Zwei Kontrast-Szenarien:

- TOASTER   — grün, gut selbst machbar (accentPath "gut")
- MIKROWELLE — rot, gefährlich → Profi (accentPath "stop")

Die Strukturen sind reine Python-Dicts und werden bei jedem Zugriff
frisch kopiert, damit Aufrufer sie gefahrlos verändern können.
"""

from __future__ import annotations

import copy

# Ampel-Level (wie repair-data.js: G / M / S)
G = "gut"
M = "mittel"
S = "stop"


TOASTER: dict = {
    "id": "toaster",
    "name": "Toaster",
    "emoji": "🍞",
    "blurb": "Wirft das Brot nicht mehr aus",
    "detail": "2-Scheiben-Toaster · ca. 4 Jahre alt",
    "accentPath": "gut",
    # Schritt 2 — geführte Nachfragen, eine pro Screen
    "triage": [
        {
            "q": "Was genau passiert mit dem Hebel?",
            "hint": "Tipp eine Antwort an — oder beschreib es frei.",
            "options": [
                {"a": "Bleibt gar nicht erst unten", "tag": "Hebel hält nicht"},
                {"a": "Bleibt kurz, springt sofort hoch", "tag": "springt sofort hoch"},
                {"a": "Bleibt unten, wirft nicht aus", "tag": "wirft nicht aus"},
            ],
        },
        {
            "q": "Wird der Toaster überhaupt warm?",
            "hint": "Stecker rein, Hebel runterdrücken und halten.",
            "options": [
                {"a": "Nein, bleibt kalt", "tag": "bleibt kalt"},
                {"a": "Ja, wird warm", "tag": "wird warm"},
                {"a": "Weiß ich nicht", "tag": "Wärme unklar"},
            ],
        },
        {
            "q": "Seit wann ist das so?",
            "hint": "Ist vorher etwas passiert?",
            "options": [
                {"a": "Ganz plötzlich", "tag": "plötzlich"},
                {"a": "Schleichend schlechter", "tag": "schleichend"},
                {"a": "War schon immer so", "tag": "von Anfang an"},
            ],
        },
        {
            "q": "Hast du schon etwas ausprobiert?",
            "hint": "Damit ich nichts doppelt vorschlage.",
            "options": [
                {"a": "Nein, noch nichts", "tag": "nichts probiert"},
                {"a": "Ausgeklopft / gereinigt", "tag": "gereinigt"},
                {"a": "Anderes", "tag": "anderes probiert"},
            ],
        },
    ],
    "lights": [
        {"key": "Sicherheit", "icon": "🛡️", "level": G, "note": "Kein Strom-Risiko, solange der Stecker gezogen ist."},
        {"key": "Aufwand", "icon": "🔧", "level": G, "note": "Schraubendreher genügt, ca. 15 Minuten."},
        {"key": "Kosten", "icon": "💶", "level": G, "note": "Material so gut wie kostenlos: 0–5 €."},
        {"key": "Machbarkeit", "icon": "📦", "level": G, "note": "Kein Ersatzteil nötig — meist nur Reinigung."},
    ],
    "verdictTitle": "Das kannst du wahrscheinlich selbst reparieren.",
    "verdictBody": (
        "Der Auswurf bleibt oft durch Krümel oder eine ausgehängte Feder am Hebel hängen. "
        "Kein gefährliches Bauteil im Spiel. Geschätzte Kosten: 0–5 €."
    ),
    "confidence": {
        "level": "hoch",
        "source": "geprüfte Reparatur-Anleitung",
        "note": "Häufiges, gut dokumentiertes Problem bei diesem Toaster-Typ.",
    },
    "recommend": "self",
    # Schritt 5 — Begleitung
    "steps": [
        {
            "title": "Stecker ziehen",
            "safety": True,
            "danger": False,
            "handoff": False,
            "beginner": "Bevor du irgendetwas öffnest: zieh den Netzstecker komplett aus der Steckdose. Nicht nur ausschalten.",
            "pro": "Netzstecker ziehen.",
            "slot": "Hand zieht Netzstecker",
        },
        {
            "title": "Krümelschublade leeren",
            "safety": False,
            "danger": False,
            "handoff": False,
            "beginner": "Zieh unten die Krümelschublade heraus, kipp sie aus und klopf den Toaster vorsichtig über dem Mülleimer aus. Oft löst das schon das Problem.",
            "pro": "Krümelschublade leeren, Gerät ausklopfen.",
            "slot": "Krümelschublade herausgezogen",
        },
        {
            "title": "Boden öffnen",
            "safety": False,
            "danger": False,
            "handoff": False,
            "beginner": "Dreh den Toaster um. Löse die 2–4 Schrauben am Boden mit einem passenden Schraubendreher und heb die Bodenplatte vorsichtig ab.",
            "pro": "Bodenplatte abschrauben.",
            "slot": "Bodenplatte mit Schrauben",
        },
        {
            "title": "Feder & Magnet prüfen",
            "safety": False,
            "danger": False,
            "handoff": False,
            "beginner": "Innen siehst du den Hebel-Mechanismus. Häng die kleine Zugfeder wieder ein, falls sie lose ist, und wisch Krümel vom Magneten am unteren Anschlag.",
            "pro": "Zugfeder einhängen, Haltemagnet säubern.",
            "slot": "Feder- und Magnetmechanik",
        },
        {
            "title": "Zusammenbauen & testen",
            "safety": False,
            "danger": False,
            "handoff": False,
            "beginner": "Bodenplatte wieder anschrauben, einstecken und den Hebel runterdrücken. Bleibt er jetzt unten? Dann hast du es geschafft.",
            "pro": "Verschrauben, einstecken, Funktion testen.",
            "slot": "Toaster — Funktionstest",
        },
    ],
    "success": {"saved": "≈ 30 €", "co2": "≈ 12 kg CO₂", "line": "Du hast ein Gerät gerettet."},
}


MIKROWELLE: dict = {
    "id": "mikrowelle",
    "name": "Mikrowelle",
    "emoji": "🍲",
    "blurb": "Wird nicht mehr warm, brummt laut",
    "detail": "800-Watt-Gerät · ca. 7 Jahre alt",
    "accentPath": "stop",
    "triage": [
        {
            "q": "Was beobachtest du?",
            "hint": "Was am auffälligsten ist.",
            "options": [
                {"a": "Läuft, aber nichts wird warm", "tag": "keine Wärme"},
                {"a": "Brummt ungewohnt laut", "tag": "lautes Brummen"},
                {"a": "Display bleibt dunkel", "tag": "Display dunkel"},
                {"a": "Funken im Inneren", "tag": "Funkenbildung"},
            ],
        },
        {
            "q": "Dreht sich der Glasteller?",
            "hint": "Mit etwas Wasser kurz testen.",
            "options": [
                {"a": "Ja, dreht sich normal", "tag": "Teller dreht"},
                {"a": "Nein, steht still", "tag": "Teller steht"},
            ],
        },
        {
            "q": "Seit wann ist das so?",
            "hint": "Gab es vorher einen Knall oder Geruch?",
            "options": [
                {"a": "Ganz plötzlich", "tag": "plötzlich"},
                {"a": "Schleichend schlechter", "tag": "schleichend"},
            ],
        },
        {
            "q": "Hast du schon etwas ausprobiert?",
            "hint": "Bitte nichts geöffnet haben.",
            "options": [
                {"a": "Nein, nichts geöffnet", "tag": "nichts geöffnet"},
                {"a": "Andere Steckdose getestet", "tag": "Steckdose getestet"},
            ],
        },
    ],
    "lights": [
        {"key": "Sicherheit", "icon": "🛡️", "level": S, "note": "Im Inneren kann auch nach dem Ausstecken lebensgefährliche Spannung gespeichert sein (Hochspannungs-Kondensator)."},
        {"key": "Aufwand", "icon": "🔧", "level": M, "note": "Fehlersuche an Magnetron/Diode braucht Erfahrung und Messgerät."},
        {"key": "Kosten", "icon": "💶", "level": M, "note": "Ersatzteil + Arbeit oft 60–110 €. Neugerät ab ca. 80 €."},
        {"key": "Machbarkeit", "icon": "📦", "level": M, "note": "Ersatzteile gibt es, aber modellabhängig."},
    ],
    "verdictTitle": "Das solltest du nicht selbst öffnen.",
    "verdictBody": (
        "Die Anzeichen deuten auf das Hochspannungs-Teil hin (Magnetron oder Diode). "
        "Der Kondensator darin kann auch ausgesteckt noch tödliche Ladung halten. "
        "Das ist ein klarer Fall für eine Fachwerkstatt."
    ),
    "confidence": {
        "level": "mittel",
        "source": "teils KI-Einschätzung",
        "note": "Die genaue Ursache ist aus der Ferne nicht sicher — die Gefahreneinschätzung dagegen schon.",
    },
    "recommend": "pro",
    # Vergleich für die ehrliche Abwägung (Konzept D18)
    "compare": {
        "repair": {"geld": "60–110 €", "zeit": "1–2 Wochen", "umwelt": "Gerät bleibt erhalten"},
        "neu": {"geld": "ab ≈ 80 €", "zeit": "sofort", "umwelt": "≈ 35 kg CO₂ + Elektroschrott"},
    },
    # Reparaturpfad ist bewusst kurz und endet im sicheren Abbruch
    "steps": [
        {
            "title": "Stopp — kurz mitlesen",
            "safety": False,
            "danger": True,
            "handoff": False,
            "beginner": "Bevor wir weitermachen: Bei Mikrowellen kann der Kondensator auch nach dem Ausstecken eine lebensgefährliche Ladung halten. Wir machen nur, was von außen sicher ist — und nichts, wofür du das Gehäuse öffnen müsstest.",
            "pro": "Gehäuse bleibt zu. Nur äußere Checks.",
            "slot": "Warnhinweis Hochspannung",
        },
        {
            "title": "Sichere Außen-Checks",
            "safety": False,
            "danger": False,
            "handoff": False,
            "beginner": "Drei Dinge sind ungefährlich zu prüfen: Sitzt der Stecker fest? Schließt die Tür sauber und hörbar? Ist die Steckdose in Ordnung (anderes Gerät testen)? Mehr nicht.",
            "pro": "Stecker, Türkontakt, Steckdose prüfen.",
            "slot": "Tür- und Steckerprüfung",
        },
        {
            "title": "Hier endet der Heimwerker-Teil",
            "safety": False,
            "danger": False,
            "handoff": True,
            "beginner": "Wenn das Gerät danach immer noch nicht warm wird, liegt es fast sicher im Hochspannungs-Teil. Alles Weitere gehört in fachkundige Hände — dein Protokoll nimmst du einfach mit.",
            "pro": "Ab hier zur Werkstatt — Protokoll mitnehmen.",
            "slot": "Übergabe an die Werkstatt",
        },
    ],
    "success": {"saved": "—", "co2": "—", "line": "Sicher eingegrenzt statt riskiert."},
}


_SEED: dict = {
    "toaster": TOASTER,
    "mikrowelle": MIKROWELLE,
}


def seed_devices() -> dict:
    """Liefert alle Seed-Geräte als ``{id: device}`` (tiefe Kopie)."""
    return copy.deepcopy(_SEED)


def get_device(device_id: str) -> dict | None:
    """Liefert ein einzelnes Seed-Gerät (tiefe Kopie) oder ``None``."""
    device = _SEED.get(device_id)
    return copy.deepcopy(device) if device is not None else None
