# PROJ-37: Chat-Flow — API & Frontend-Umstellung (harter Schnitt)

## Status: Planned

**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31

## Abhängigkeiten

- PROJ-35 (Orchestrator-Schleife) — liefert `antwort_text` + Karten pro Turn
- PROJ-36 (Sicherheits-Backstop) — Vertrauens-Footer + erzwungene Hinweise im Verlauf
- PROJ-9 (Vorgangs-Persistenz) — `/api/vorgang`-Anlage und Wiederaufruf
- Ersetzt: bisheriger Single-Shot `POST /api/diagnose` + `device`-Monolith

## Beschreibung

Die App wird vom Single-Shot-Erlebnis auf einen **Chat-Flow mit eingebetteten Karten**
umgestellt (Hybrid). Neue API-Endpunkte legen einen Vorgang an und verarbeiten je eine
Nutzer-Nachricht über den Orchestrator. Das Frontend wird zum **Chat-Renderer**: Nutzer-
und Assistenz-Bubbles im Verlauf, strukturierte Karten (Ampel, Vergleich, Schritte, …)
genau dort eingebettet, wo die zuständige Rolle ihr Ergebnis liefert. Dies ist ein
**harter Schnitt** — die alte Diagnose-Route und das Monolith-Schema entfallen.

## User Stories

- Als Nutzer möchte ich in einem Chat-Fenster meinen Reparaturfall schildern und fortlaufend Antworten + Karten erhalten, damit sich die App wie ein begleitendes Gespräch anfühlt.
- Als Nutzer möchte ich, dass strukturierte Ergebnisse (Warn-Ampel, Vergleich, Anleitung) als übersichtliche Karten direkt im Verlauf erscheinen, damit ich sie nicht in Fließtext suchen muss.
- Als Nutzer möchte ich, dass mein laufender Vorgang über mehrere Nachrichten erhalten bleibt, damit ich den Faden nicht verliere.
- Als Nutzer möchte ich bei einem Backend-Problem eine verständliche Fehlermeldung statt einer kaputten Seite, damit ich weiß, was los ist.
- Als Entwickler möchte ich, dass der alte `/api/diagnose`-Pfad und das Monolith-`device`-Schema vollständig entfernt sind, damit es keinen toten/parallelen Code-Pfad gibt.

## Akzeptanzkriterien

- [ ] `POST /api/vorgang` legt einen neuen Vorgang an und liefert eine `vorgang_id` (optional mit Sprachwahl DE/EN).
- [ ] `POST /api/chat` nimmt `{vorgang_id, text}`, fährt einen Orchestrator-Turn und liefert `{vorgang_id, antwort_text, karten[], abgebrochen}`.
- [ ] Leerer `text` ergibt HTTP 400 mit `code: "empty"`.
- [ ] Unbekannte `vorgang_id` ergibt HTTP 404 mit definiertem Fehlercode.
- [ ] Fehlt das KI-Backend, liefert `/api/chat` HTTP 503 mit `code: "no_backend"` (kein Absturz).
- [ ] `POST /api/diagnose` existiert nicht mehr (HTTP 404).
- [ ] Es gibt keine zwei konkurrierenden `/api/vorgang`-Routen (keine Flask-Endpoint-Kollision; App startet sauber).
- [ ] Das Frontend rendert den Verlauf als Bubbles und bettet je Karten-`typ` die passende Komponente ein (`ampel`, `vergleich`, `schritte`, `diagnose`, `hinweis`, `anbieter`, `ersatzteil`, `erfolg`, `aufnahme`).
- [ ] Jede Assistenz-Antwort trägt den unbedingten Vertrauens-Indikator-Footer (D3, via PROJ-36).
- [ ] Eine `hinweis`-Karte mit `schwere = kritisch` wird optisch deutlich hervorgehoben (eskalierende Warnung).
- [ ] Alle JSON-Antworten verwenden `ensure_ascii=False` (echte Umlaute/Emojis).
- [ ] `webapp/SPEC.md`, `CLAUDE.md` und `webapp/README.md` sind auf den neuen Flow (Endpunkte, Karten statt `device`) aktualisiert.

## Edge Cases

- **Nutzer sendet sehr schnell mehrere Nachrichten** — Turns werden je Vorgang sauber sequenziell verarbeitet; der Zustand bleibt konsistent.
- **Backend-Timeout mitten im Turn** — Verständliche Fehlermeldung im Chat; bereits empfangene Karten bleiben sichtbar.
- **Unbekannter Karten-`typ` im Frontend** — Wird ignoriert/auskommentiert dargestellt, ohne den Verlauf zu zerstören.
- **Seiten-Reload während eines Vorgangs** — Über `vorgang_id` lässt sich der Vorgang fortsetzen (Zustand serverseitig, PROJ-9).
- **Antwort ganz ohne Karte** (reiner Text) — Wird als Bubble samt Vertrauens-Footer angezeigt.
- **Abgebrochener Turn (Iterations-Limit)** — Zwischenstands-Nachricht wird angezeigt, der Nutzer kann weiterschreiben.

## Technische Anforderungen (optional)

- `webapp/app.py`: neue Routen `/api/vorgang` (bestehende gleichnamige Route **ersetzen**, keine Kollision) und `/api/chat`; `/api/diagnose` entfernen.
- Frontend: `app.js` (Konversations-Statemachine), `screens.js` (Chat-Renderer + Karten-Dispatch + Footer), `ui.js` (Karten-Bausteine an neue Schemata angepasst).
- Doku: `SPEC.md` (Karten-Schemata statt `device`-Vertrag, neue Endpunkte), `CLAUDE.md`, `README.md`.
- Konzept-Anker: D6 (zwei Schichten), D7 (Vorgang), D19 (Orchestrierung).
- Design-Referenz: Spec §6; Plan Phase 5 (Task 6) + Phase 6 (Task 7/8).

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
