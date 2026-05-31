# PROJ-21: Mehrfachdefekte mit Gesamt-Fazit nach schwächstem Glied

## Status: Done

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- PROJ-9 (Vorgangs-Persistenz) — mehrere Ampeln pro Vorgang müssen im Protokoll gehalten werden

## User Stories

- Als Nutzer mit einem Gerät, das mehrere Defekte gleichzeitig hat, möchte ich für jeden erkannten Defekt eine eigene Warn-Ampel sehen, damit ich jeden Einzelfall getrennt einschätzen kann.
- Als Nutzer möchte ich zusätzlich ein einziges Gesamt-Fazit für das ganze Gerät erhalten, damit ich nicht selbst mehrere Ampeln gegeneinander abwägen muss.
- Als Nutzer möchte ich erkennen können, welcher einzelne Defekt das Gesamt-Fazit bestimmt (der Knackpunkt), damit ich verstehe, woran die Empfehlung hängt.
- Als Nutzer mit nur einem einzigen Defekt möchte ich die App unverändert wie bisher erleben, ohne unnötiges Gesamt-Fazit, damit der einfache Fall einfach bleibt.
- Als Nutzer mit sehr vielen Defekten möchte ich eine übersichtliche, priorisierte Darstellung, damit ich nicht in einer langen Ampel-Liste den Überblick verliere.

## Akzeptanzkriterien

- [ ] Bei mehreren erkannten Defekten erhält jeder Defekt eine eigene vollständige Warn-Ampel (Sicherheit, Komplexität, Kostenaufwand, Machbarkeit) mit eigener Handlungsempfehlung im Protokoll.
- [ ] Bei mehr als einem Defekt bildet die App ein zusätzliches Gesamt-Fazit für das gesamte Gerät.
- [ ] Das Gesamt-Fazit folgt dem schwächsten Glied: das höchste Risiko (Sicherheit) bzw. die höchsten Kosten dominieren die Gesamt-Empfehlung.
- [ ] Das Gesamt-Fazit kennzeichnet eindeutig den ausschlaggebenden Defekt (Knackpunkt), der die Empfehlung bestimmt.
- [ ] Bei genau einem erkannten Defekt zeigt die App nur dessen Einzel-Ampel und kein Gesamt-Fazit (Verhalten wie heute).
- [ ] Wenn die Einzel-Empfehlungen einander widersprechen (z. B. „selbst machen" vs. „Profi"), setzt sich im Gesamt-Fazit die restriktivere/sicherere Empfehlung durch.
- [ ] Die Einzel-Ampeln bleiben auch dann sichtbar und nachvollziehbar erhalten, wenn ein Gesamt-Fazit gebildet wurde (das Fazit ersetzt sie nicht).
- [ ] Bei sehr vielen Defekten werden die Einzel-Ampeln nach Kritikalität priorisiert dargestellt, sodass der Knackpunkt und die kritischsten Defekte zuerst sichtbar sind.
- [ ] Das Gesamt-Fazit und der gekennzeichnete Knackpunkt werden im Vorgang persistiert, sodass sie nach Wiederaufruf erhalten bleiben.
- [ ] Die Grundhaltung „warnen statt sperren" bleibt gewahrt: auch ein rotes Gesamt-Fazit rät deutlich ab, sperrt aber keinen Pfad hart.

## Edge Cases

- **Nur ein einziger Defekt erkannt** — Kein Gesamt-Fazit nötig; es wird ausschließlich die eine Einzel-Ampel angezeigt, exakt wie im heutigen Normalfall.
- **Widersprüchliche Einzel-Empfehlungen** — Welche gilt? Im Gesamt-Fazit dominiert nach dem schwächsten Glied die restriktivere/sicherere Empfehlung; abweichende Einzel-Empfehlungen bleiben an ihrer jeweiligen Ampel sichtbar.
- **Sehr viele Defekte** — Wie bleibt es übersichtlich? Die Einzel-Ampeln werden nach Kritikalität priorisiert (kritischste zuerst), der ausschlaggebende Defekt ist hervorgehoben; das Gesamt-Fazit fasst die Lage in einer Empfehlung zusammen.
- **Zwei Defekte gleich kritisch** — Welcher ist der Knackpunkt? Es wird ein eindeutiger ausschlaggebender Defekt bestimmt (deterministische Reihenfolge), das Gesamt-Fazit selbst bleibt korrekt nach dem schwächsten Glied.
- **Defekt nachträglich entfernt/entkräftet** — Das Gesamt-Fazit und der Knackpunkt werden neu abgeleitet; fällt die Defektzahl auf eins, entfällt das Gesamt-Fazit wieder.

## Technische Anforderungen (optional)

- Konzept-Anker: D24 (`docs/konzept.adoc`, Abschnitte „Kernfunktion: die Warn-Ampel" und Edge-Cases) sowie `docs/runtime-roles/bewertung.md`.
- Fachlich getragen von der Laufzeit-Rolle `bewertung` (Warn-Ampel); das Gesamt-Fazit ist eine Aggregation über mehrere Einzel-Ampeln eines Geräts, keine neue Achse.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
