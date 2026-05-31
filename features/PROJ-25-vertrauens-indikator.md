# PROJ-25: Vertrauens-Indikator durchgängig bei jeder KI-Aussage

## Status: Done

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Nutzer möchte ich bei **jeder** KI-Aussage (Diagnose, Triage, Warn-Ampel, Pfad-Abwägung) sehen, wie sicher sich die KI ist und worauf sie ihre Aussage stützt, damit ich der Empfehlung angemessen vertrauen und mündig entscheiden kann.
- Als Nutzer möchte ich erkennen, ob eine Aussage auf einer **kuratierten Quelle** beruht oder ein **frei geratener KI-Fallback** ist, damit ich ungeprüfte Aussagen vorsichtiger behandle.
- Als Nutzer möchte ich, dass der Vertrauenshinweis **deutlicher wird, je kritischer** der Fall ist (Hochspannung, Gas, Strom), damit ich bei gefährlichen Reparaturen besonders aufmerksam bleibe.
- Als sicherheitsbewusster Nutzer möchte ich, dass der Hinweis „die KI kann Fehler machen" **immer** sichtbar ist — auch bei hoher Konfidenz —, damit ich nie den Eindruck einer unfehlbaren Maschine bekomme.
- Als Nutzer möchte ich die Konfidenz-, Quellen- und Begründungsangaben jeder KI-Aussage im **Protokoll** wiederfinden, damit der Vorgang nachvollziehbar und überprüfbar bleibt.

## Akzeptanzkriterien

- [ ] Jede KI-Aussage in `diagnose` trägt einen sichtbaren Vertrauens-Indikator mit Konfidenz, Quelle und kurzer Begründung.
- [ ] Jede KI-Aussage in der KI-gestützten Triage (`aufnahme`-Schritt) trägt einen sichtbaren Vertrauens-Indikator mit Konfidenz, Quelle und kurzer Begründung.
- [ ] Die Pfad-Abwägung (`abwaegung`) führt eine eigene Konfidenz, Quelle und Begründung — nicht nur die der vorgelagerten Schritte.
- [ ] Die bereits vorhandene Warn-Ampel-Umsetzung (`bewertung`: Vertrauens-Badge + Begründungs-Sheet) nutzt dasselbe vereinheitlichte Vertrauens-Indikator-Prinzip; es wird nichts dupliziert.
- [ ] Der Indikator unterscheidet sichtbar zwischen kuratierter Quelle und gekennzeichnetem KI-Fallback (D2).
- [ ] Der Hinweis „die KI kann Fehler machen" erscheint bei jeder KI-Aussage — unabhängig von der Konfidenzhöhe.
- [ ] Deutlichkeit und Begründungstiefe des Hinweises eskalieren mit der Kritikalität des Falls (je gefährlicher, desto deutlicher).
- [ ] Bei sehr niedriger Konfidenz wird die Unsicherheit explizit und unübersehbar ausgewiesen (keine stille Andeutung).
- [ ] Konfidenz, Quelle und Begründung jeder KI-Aussage werden im `protokoll` festgehalten.
- [ ] Die Konfidenz wird in einer für Laien verständlichen Form dargestellt (z. B. hoch/mittel/niedrig statt nackter Prozentzahl).

## Edge Cases

- **Frage:** Was passiert, wenn für die Aussage gar keine kuratierte Quelle existiert? **Antwort:** Die Aussage wird als KI-Fallback gekennzeichnet (D2) und mit entsprechend niedriger Konfidenz sowie deutlichem „ungeprüft"-Hinweis versehen.
- **Frage:** Was passiert bei sehr niedriger Konfidenz in einem unkritischen Fall? **Antwort:** Der Unsicherheits-Hinweis bleibt unübersehbar; die niedrige Konfidenz schlägt die geringe Kritikalität nicht weg, der Nutzer wird klar zur Vorsicht angehalten.
- **Frage:** Wie verhält sich der Indikator, wenn ein an sich gut belegter Fall hochgefährlich ist (z. B. Hochspannung)? **Antwort:** Trotz hoher Konfidenz eskaliert die Deutlichkeit des Hinweises mit der Kritikalität; Quelle und Begründung werden besonders klar dargestellt.
- **Frage:** Was zeigt der Indikator, wenn eine Aussage teils kuratiert, teils KI-ergänzt ist? **Antwort:** Die Mischung wird transparent gemacht; der ungeprüfte KI-Anteil wird gesondert als Fallback gekennzeichnet.
- **Frage:** Was geschieht mit dem Indikator, wenn ein Schritt ohne KI rein aus kuratierten Daten kommt? **Antwort:** Die Quelle wird als kuratiert ausgewiesen; der „KI kann Fehler machen"-Hinweis entfällt nur, wenn an der Aussage tatsächlich keine KI beteiligt war.

## Technische Anforderungen

- Der Vertrauens-Indikator ist ein **querschnittliches, einheitliches Element** über alle KI-tragenden Schritte hinweg — eine gemeinsame fachliche Darstellung statt pro Rolle nachgebauter Einzellösungen.
- Jede KI-Aussage liefert die Felder Konfidenz, Quelle (kuratiert vs. KI-Fallback) und Begründung mit; das `protokoll` ist der gemeinsame Vorgangs-Zustand, der diese Angaben hält.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
