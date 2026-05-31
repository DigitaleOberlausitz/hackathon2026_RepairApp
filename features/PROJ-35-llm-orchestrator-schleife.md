# PROJ-35: LLM-Orchestrator-Schleife

## Status: Planned

**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31

## Abhängigkeiten

- PROJ-32 (Rollen-Registry) — Katalog für den Prompt-Präfix, `lade_rolle`
- PROJ-33 (Karten-Decomposition) — strukturierte Ausgaben
- PROJ-34 (Daten-Tools) — Werkzeugkasten für die Schleife
- PROJ-9 (Vorgangs-Persistenz) — speichert den fortgeschriebenen Vorgangs-Zustand
- Fachlicher Bezug: PROJ-18 (Rollen-/Agenten-Architektur, D19), PROJ-24 (Mehrsprachigkeit, D17), PROJ-28 (Anfrage-Protokoll)

## Beschreibung

Das Herzstück: eine **Tool-Call-Schleife** gegen die OpenAI-ChatGPT-API. Pro Nutzer-Turn
baut die App einen **stabilen System-Präfix** (Orchestrierungs-Leitlinien + Rollen-Katalog
+ Werkzeug-Hinweis) und reicht den Vorgangs-Verlauf nach. Das Modell ruft Werkzeuge (Rollen
laden, Daten holen, Karten ausgeben); der Server führt sie aus und gibt die Ergebnisse
zurück — bis das Modell eine Text-Antwort ohne weitere Werkzeugaufrufe liefert. Der stabile
Präfix steht am Anfang, damit OpenAIs automatisches Prompt-Caching greift.

## User Stories

- Als Nutzer möchte ich meinen Reparaturfall in einem fortlaufenden Dialog schildern, in dem die KI Rückfragen stellt und Schritt für Schritt hilft, statt einer einmaligen Antwort.
- Als Orchestrator möchte ich pro Turn so lange Werkzeuge aufrufen können, bis ich genug Kontext habe, und dann dem Nutzer antworten, damit ich mehrstufig arbeiten kann.
- Als Betreiber möchte ich, dass der statische Teil des Prompts über Aufrufe stabil bleibt, damit das Prompt-Caching Kosten und Latenz senkt.
- Als Betreiber möchte ich ein Iterations-Limit pro Turn, damit Endlosschleifen und Kostenausreißer technisch verhindert werden (ohne den Vorgang fachlich zu sperren).
- Als Nutzer möchte ich, dass mein Vorgang (Verlauf, Karten, geladene Rollen, Entscheidungsweg) zwischen meinen Nachrichten erhalten bleibt, damit die KI den Faden behält.
- Als Betreiber möchte ich, dass ohne konfiguriertes KI-Backend ein sauberer Fehler statt eines Absturzes kommt, damit die App robust startet.

## Akzeptanzkriterien

- [ ] Ein Turn nimmt eine Nutzer-Nachricht + Vorgang entgegen und liefert `{antwort_text, karten[], abgebrochen}`.
- [ ] Der System-Präfix ist über aufeinanderfolgende Aufrufe (gleiche Sprache) byte-identisch.
- [ ] Der Präfix enthält die Orchestrierungs-Leitlinien (mindestens „warnen statt sperren", Vertrauens-Indikator, ehrlicher Ton) und den vollständigen Rollen-Katalog.
- [ ] Die Schleife verarbeitet mehrere Werkzeugaufrufe pro Modell-Runde korrekt (jeder Aufruf bekommt sein zugeordnetes Tool-Ergebnis zurück, in der von der API erwarteten Struktur).
- [ ] `lade_rolle`-Aufrufe und ausgegebene Karten werden im Vorgangs-Zustand festgehalten (`geladene_rollen`, `karten`).
- [ ] Erreicht die Schleife das Iterations-Limit (`MAX_TOOL_ITERATIONS`), bricht sie sauber ab (`abgebrochen: true`) mit einer freundlichen Zwischenstands-Nachricht — ohne Exception.
- [ ] Der aktualisierte Vorgang wird nach jedem Turn persistiert (PROJ-9) und beim nächsten Turn fortgesetzt.
- [ ] Die KI antwortet in der gewählten Vorgangs-Sprache (DE/EN, D17); je Sprache bleibt der Präfix für sich stabil/cachebar.
- [ ] Ohne konfiguriertes OpenAI-Backend liefert ein Turn ein definiertes Fehlerergebnis (`code: "no_backend"`), kein Absturz.
- [ ] Pro KI-Aufruf wird die Token-Nutzung best-effort erfasst (PROJ-28), ohne den Turn bei Fehlen zu gefährden.
- [ ] Das API-Timeout wird zentral über `config.llm_timeout()` bezogen (kein dupliziertes Default-Literal).

## Edge Cases

- **Modell liefert sofort Text ohne Werkzeugaufruf** — Turn endet nach einer Runde, Antwort wird durchgereicht.
- **Modell ruft endlos Werkzeuge** — Iterations-Limit greift, sauberer Abbruch mit Zwischenstand.
- **Ungültiges JSON in Werkzeug-Argumenten** — Wird als leeres Argument behandelt; die Schleife läuft weiter (Robustheit via PROJ-34).
- **Netzwerk-/API-Fehler mitten im Turn** — Definierter Fehler (`ai_error`), kein Absturz; bereits gesammelte Karten gehen nicht verloren.
- **Sehr langer Vorgang** — Funktioniert weiter; Kontext-Kürzung/Zusammenfassung ist bewusst out of scope (spätere Iteration), Token-Nutzung wird protokolliert.
- **Spracheinstellung wechselt mitten im Vorgang** — Der Präfix wechselt auf die neue Sprache; das ist zulässig (zwei separat stabile Präfixe).

## Technische Anforderungen (optional)

- Neues Modul `webapp/repair/orchestrator.py` (`system_prefix(lang)`, `run_turn(state, text, …)`).
- Backend-Auflösung wird aus `ai.py` (`_resolve_backend`) wiederverwendet — diese liefert ein **2-Tupel** `(client, model)`.
- API: OpenAI **Chat Completions + Tools** (OpenAI-only in dieser Phase); automatisches Prompt-Caching durch stabilen Präfix.
- Neue Konfiguration `MAX_TOOL_ITERATIONS` (Default 12) in `config.py` + `.env.example` (Drift-Guard beachten, PROJ-30).
- Konzept-Anker: D19 (Orchestrierung), D17 (Sprache), D7 (Vorgangs-Zustand).
- Design-Referenz: Spec §3.4, §4.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
