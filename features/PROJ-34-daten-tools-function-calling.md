# PROJ-34: Daten-Tools für Function-Calling

## Status: Planned

**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31

## Abhängigkeiten

- PROJ-32 (Rollen-Registry) — für das `lade_rolle`-Werkzeug und die Rollen-Whitelist
- PROJ-33 (Karten-Decomposition) — für das `zeige_karte`-Werkzeug und die Validierung
- Nutzt bestehende kuratierte Dienste: PROJ-11 (`vermittlung`), PROJ-12 (`entsorgung`), PROJ-14 (`beschaffung`), PROJ-16 (`recherche`), PROJ-6 (`foerderung`)

## Beschreibung

Der Orchestrator bekommt einen klar definierten Werkzeugkasten, den ChatGPT über
Function-Calling nutzt: das Rollen-Lade-Werkzeug (`lade_rolle`), das Karten-Werkzeug
(`zeige_karte`) und **dünne Wrapper** um die bereits existierenden, kuratierten
Datendienste (Anbieter, Ersatzteile, Förderung, Entsorgung, Recherche). Ein zentraler
Dispatch führt einen Werkzeugaufruf aus und liefert **immer** ein wohldefiniertes Ergebnis
zurück (Inhalt, Karte oder Fehler) — niemals eine Exception.

## User Stories

- Als Orchestrator möchte ich der ChatGPT-API eine maschinenlesbare Liste verfügbarer Werkzeuge anbieten, damit das Modell selbst entscheiden kann, welches es aufruft.
- Als Orchestrator möchte ich kuratierte Daten (Anbieter, Ersatzteile, Förderung, Entsorgung) über Werkzeuge abrufen, damit ich Fakten statt Halluzinationen in die Antwort einfließen lasse.
- Als Orchestrator möchte ich belegtes Wissen über das Recherche-Werkzeug holen (kuratiert → online → Fallback, mit Quelle/Konfidenz), damit der Vertrauens-Indikator gespeist wird (D2/D3).
- Als Entwickler möchte ich, dass ein fehlerhafter Werkzeugaufruf ein Fehlerergebnis an das Modell liefert statt die Schleife abzubrechen, damit der Vorgang robust bleibt.
- Als Sicherheits-Verantwortlicher möchte ich, dass nur Werkzeuge aus einer festen Whitelist ausgeführt werden, damit das Modell keine unbekannten Aktionen auslösen kann.

## Akzeptanzkriterien

- [ ] Die Werkzeug-Spezifikationen enthalten mindestens: `lade_rolle`, `zeige_karte`, `finde_anbieter`, `suche_ersatzteil`, `finde_foerderung`, `finde_entsorgung`, `recherche`.
- [ ] `lade_rolle` ist auf die im Katalog (PROJ-32) gelisteten Rollennamen beschränkt (enum/Whitelist).
- [ ] `zeige_karte` validiert über PROJ-33 und liefert bei Gültigkeit die Karte, bei Ungültigkeit ein Fehlerergebnis (keine Exception).
- [ ] Die Daten-Werkzeuge rufen die bestehenden Dienste mit korrekten Signaturen auf (`list_anbieter(kat, ort)`, `list_ersatzteile(device, defekt)`, `list_foerderungen()`, `list_entsorgung(kat, ort)`, `recherche(frage, kontext, lang)`).
- [ ] Daten-Werkzeuge liefern ihr Ergebnis als JSON mit `ensure_ascii=False` (echte Umlaute).
- [ ] Der zentrale Dispatch gibt für jeden Aufruf ein dict zurück: Inhalt (`content`), Karte (`karte`) **oder** Fehler (`error`) — und wirft nie eine Exception.
- [ ] Ein unbekannter Werkzeugname führt zu einem Fehlerergebnis (`error`), nicht zu einem Absturz.
- [ ] Ein Dienst-Fehler (z. B. Recherche-Online-Timeout) wird als `error`-Ergebnis ans Modell gereicht, ohne den Turn abzubrechen.

## Edge Cases

- **Modell ruft Werkzeug mit fehlenden/falschen Argumenten auf** — Dispatch fängt das ab und liefert ein verständliches Fehlerergebnis, das als Korrektur-Hinweis dient.
- **Datendienst liefert leere Liste** (kein Anbieter im Ort) — Gültiges, leeres Ergebnis; das Modell entscheidet, wie es kommuniziert (kein Fehler).
- **Ungültiges JSON in den Werkzeug-Argumenten** — Wird als leeres Argument-Objekt behandelt bzw. als Fehler gemeldet, kein Absturz.
- **`recherche` ohne Online-Backend** (SearXNG nicht erreichbar) — Fällt auf kuratiert/KI-Fallback zurück (bestehendes Verhalten PROJ-16), gekennzeichnet.
- **Werkzeug außerhalb der Whitelist** — Wird abgewiesen; nur bekannte Werkzeuge sind ausführbar.

## Technische Anforderungen (optional)

- Neues Modul `webapp/repair/tools.py` (`specs()` → OpenAI-Tool-Definitionen, `dispatch(name, args, vorgang_id)`).
- Wrapper rufen ausschließlich vorhandene Dienste auf (kein Neu-Implementieren der Datenlogik).
- Konzept-Anker: D2/D3 (Recherche/Vertrauen), D8 (Beschaffung/Affiliate-Leitplanke).
- Design-Referenz: Spec §3.2.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
