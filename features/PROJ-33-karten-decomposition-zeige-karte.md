# PROJ-33: Karten-Decomposition & `zeige_karte`

## Status: Planned

**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31

## Abhängigkeiten

- Keine (Fundament)
- Liefert die Basis für: PROJ-34 (Daten-Tools), PROJ-35 (Orchestrator), PROJ-36 (Backstop), PROJ-37 (Frontend-Rendering)

## Beschreibung

Strukturierte KI-Ausgaben werden nicht mehr in ein großes Monolith-`device`-Objekt
gepresst, sondern **pro Rolle in ein eigenes kleines Karten-Schema** zerlegt (Ampel,
Vergleich, Schritte, Diagnose, Hinweis, …). Die KI gibt eine Karte über **ein** generisches
Werkzeug `zeige_karte(typ, daten)` aus; der Server **validiert** `daten` gegen das Schema
des jeweiligen `typ`. Ungültige Karten werden nicht angezeigt, sondern als Fehler an das
Modell zur Korrektur zurückgegeben.

## User Stories

- Als Orchestrator möchte ich ein strukturiertes Ergebnis (z. B. eine Warn-Ampel) über ein einziges, klar definiertes Werkzeug ausgeben, damit das Frontend es als Karte rendern kann.
- Als Entwickler möchte ich, dass jede Karte vor der Anzeige gegen ein striktes Schema geprüft wird, damit das Frontend sich auf eine feste Struktur verlassen kann.
- Als Orchestrator möchte ich bei einer fehlerhaften Karte eine verständliche Rückmeldung erhalten, damit ich die Ausgabe korrigieren kann, statt dem Nutzer Müll zu zeigen.
- Als Produktverantwortlicher möchte ich, dass jede fachliche Einschätzung (Diagnose/Ampel/Vergleich/Schritte) einen Vertrauens-Indikator trägt, damit Konfidenz und Quelle immer transparent sind (D3).
- Als Nutzer möchte ich, dass die einzelnen Karten genau dann erscheinen, wenn die zuständige Rolle ihr Ergebnis liefert, damit der Fortschritt im Verlauf nachvollziehbar ist.

## Akzeptanzkriterien

- [ ] Es existieren mindestens die Karten-Typen: `aufnahme`, `diagnose`, `ampel`, `vergleich`, `schritte`, `hinweis`, `anbieter`, `ersatzteil`, `erfolg`.
- [ ] Eine gültige Karte wird gegen das Schema ihres Typs akzeptiert und in der Form `{typ, daten}` zurückgegeben.
- [ ] Eine Karte mit unbekanntem `typ` wird abgelehnt (definierter Validierungsfehler).
- [ ] Eine `ampel`-Karte mit ungültigem Achsen-Wert (nicht `gruen|gelb|rot`) wird abgelehnt.
- [ ] Die Karten-Typen `diagnose`, `ampel`, `vergleich` und `schritte` verlangen ein `trust`-Objekt (level, quelle, konfidenz, hinweis) als Pflichtfeld (D3).
- [ ] Die `diagnose`-Karte kann den unklar-Pfad abbilden (`unklar: true` mit leeren Kandidaten ist gültig, D20).
- [ ] Die `ampel`-Karte kann pro Defekt erzeugt werden (`defekt`-Feld vorhanden, Voraussetzung für Mehrfachdefekte D24).
- [ ] Die `schritte`-Karte unterstützt `safety`/`danger`/`handoff` pro Schritt sowie optional `bestaetigung_noetig` (D25) und `garantie_hinweis` (D21).
- [ ] Der `hinweis`-Typ unterstützt die Arten `garantie`, `rueckruf`, `datenloeschung`, `sicherheit`, `eigentum` (D21–D23, D14).
- [ ] Validierungsfehler enthalten eine verständliche Begründung (welches Feld, welches Problem), die als Korrektur-Hinweis taugt.

## Edge Cases

- **Pflichtfeld fehlt** (z. B. `ampel` ohne `achsen`) — Karte wird abgewiesen, Fehlermeldung benennt das fehlende Feld; nichts wird angezeigt.
- **Zusätzliche, unbekannte Felder im `daten`-Objekt** — Definiertes, dokumentiertes Verhalten (akzeptiert und ignoriert ODER abgewiesen) — konsistent über alle Typen.
- **Leere, aber zulässige Karte** (z. B. `diagnose` mit `unklar:true` ohne Kandidaten) — Gültig, korrekt als unklar-Pfad behandelt.
- **`trust` fehlt bei einer Schicht-B-`schritte`-Karte** — Abgewiesen, weil gerade der gefährlichste Output den Vertrauens-Indikator zwingend braucht (D3/A5).
- **Mehrere Karten desselben Typs in einem Turn** (mehrere Ampeln bei Mehrfachdefekten) — Jede wird einzeln validiert und einzeln zurückgegeben.

## Technische Anforderungen (optional)

- Neues Modul `webapp/repair/cards.py` (Schema je Typ, `validate(typ, daten)`, gemeinsames `_TRUST`-Schema).
- JSON-Schema-Validierung via `jsonschema` (zu `requirements.txt` hinzufügen).
- JSON immer mit `ensure_ascii=False` (echte Umlaute/Emojis).
- Konzept-Anker: D1, D3, D12, D18, D20, D21, D24, D25 (`docs/konzept.adoc`); Rollen `bewertung`/`abwaegung`/`begleitung`/`diagnose`.
- Design-Referenz: Spec §3.3.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
