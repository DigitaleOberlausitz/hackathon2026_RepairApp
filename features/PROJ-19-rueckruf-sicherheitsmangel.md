# PROJ-19: Rückruf & bekannter Sicherheitsmangel

## Status: Done

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- PROJ-15 (Kuratierte Fehlerzustand-Sammlung) — die Rückruf-/Sicherheitsmangel-Daten zum Modell werden dort kuratiert gepflegt

## User Stories

- Als Nutzer mit einem Gerät, zu dem ein Hersteller-Rückruf läuft (z. B. Akku-Brandgefahr), möchte ich diese Warnung sofort und unübersehbar sehen, damit ich kein gefährliches Gerät selbst öffne oder weiterbetreibe.
- Als Nutzer eines zurückgerufenen Geräts möchte ich direkt erfahren, wie ich am Hersteller-Rückruf teilnehme (was zu tun ist und wohin ich mich wende), statt eine DIY-Reparaturanleitung angeboten zu bekommen.
- Als Nutzer eines Geräts ohne hinterlegten Rückruf möchte ich, dass mein Reparaturablauf ganz normal weiterläuft, damit die Rückrufprüfung mich im Normalfall nicht ausbremst.
- Als Nutzer möchte ich erkennen, woher die Rückruf-Information stammt und wie aktuell sie ist, damit ich der prominenten Warnung vertrauen kann.
- Als Betreiber der App möchte ich Rückruf-/Sicherheitsmangel-Hinweise als klaren Sicherheits-Stopp führen — abgegrenzt vom bloßen Garantiehinweis (PROJ-7) —, damit Nutzer den Unterschied zwischen „Gewährleistung gefährdet" und „akute Gefahr" verstehen.

## Akzeptanzkriterien

- [ ] Ist zum erkannten Modell ein Rückruf oder bekannter Sicherheitsmangel hinterlegt, wird dieser prominent (vor jeder Reparaturoption) angezeigt.
- [ ] Bei einem Treffer wird statt einer DIY-Anleitung (Schicht B) auf den Hersteller-Rückruf bzw. das Vorgehen zur Rückrufteilnahme verwiesen.
- [ ] Der Treffer wird als Sicherheits-Stopp behandelt und ist erkennbar etwas anderes als ein Garantie-/Gewährleistungshinweis (PROJ-7).
- [ ] Ist kein Rückruf zum Modell hinterlegt, läuft der normale Reparaturablauf unverändert und ohne Rückruf-Hinweis weiter.
- [ ] Zur Rückruf-Information werden Quelle und Aktualität („Stand / gültig-bis" bzw. Stand-Datum) angezeigt.
- [ ] Der prominente Hinweis benennt den konkreten Grund des Rückrufs (z. B. Akku-Brandgefahr) in verständlicher Sprache.
- [ ] Der Hinweis warnt deutlich, hindert den Nutzer aber nicht hart daran, fortzufahren („warnen statt sperren") — der bevorzugte Weg ist jedoch klar der Hersteller-Rückruf.
- [ ] Ist das Modell nicht eindeutig identifizierbar, wird kein falscher Rückruf-Treffer behauptet; stattdessen wird auf die Unsicherheit hingewiesen und der normale Ablauf fortgesetzt.

## Edge Cases

- **Frage:** Was passiert, wenn das Modell nur unscharf erkannt wurde und der Rückruf nur eine bestimmte Modellvariante/Charge betrifft? **Antwort:** Es wird kein eindeutiger Treffer gemeldet; die App weist auf den möglichen, modellabhängigen Rückruf hin, empfiehlt die genaue Identifikation (z. B. Typenschild) und setzt den normalen Ablauf fort.
- **Frage:** Was, wenn zum Gerät sowohl ein Rückruf als auch noch aktive Garantie vorliegt? **Antwort:** Der Rückruf-Stopp hat Vorrang und wird zuerst prominent gezeigt; der Garantiehinweis (PROJ-7) bleibt nachrangig sichtbar, ohne den Sicherheits-Stopp zu verwässern.
- **Frage:** Was, wenn die hinterlegte Rückruf-Information veraltet ist oder das „gültig-bis"-Datum überschritten wurde? **Antwort:** Die Aktualität wird transparent ausgewiesen; ist sie nicht mehr gesichert, wird dies kenntlich gemacht und der Nutzer auf die offizielle Hersteller-/Behördenquelle verwiesen.
- **Frage:** Was, wenn ein Sicherheitsmangel bekannt ist, aber (noch) kein offizieller Hersteller-Rückruf existiert? **Antwort:** Der Mangel wird als Sicherheitswarnung gezeigt und vom formalen Rückruf sprachlich abgegrenzt; statt DIY wird zu fachlicher Klärung / Hersteller geraten.

## Technische Anforderungen (optional)

- Die Rückruf-/Sicherheitsmangel-Daten je Modell stammen aus der kuratierten Fehlerzustand-Sammlung (PROJ-15) und tragen mindestens Grund, Quelle und Aktualität („Stand / gültig-bis").
- Die Rückrufprüfung greift, bevor eine Schicht-B-Anleitung angeboten wird, und ist eindeutig vom Garantiepfad (PROJ-7) getrennt.

## Tech Design (Solution Architect)
_Wird von /architecture hinzugefügt_

## QA Test Results
_Wird von /qa hinzugefügt_

## Deployment
_Wird von /deploy hinzugefügt_
