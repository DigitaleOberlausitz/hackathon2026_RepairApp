# PROJ-3: Fähigkeits-Rückfrage „Traust du dir das zu?"

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als unerfahrener Nutzer möchte ich zu Beginn einer Reparatur sagen können, wie sicher ich mich fühle, damit ich eine Anleitung in einer Tiefe bekomme, die mich nicht überfordert.
- Als geübter Nutzer möchte ich angeben können, dass ich Erfahrung habe, damit mir die Anleitung nicht jeden Selbstverständlichkeit-Schritt erklärt und ich schneller vorankomme.
- Als unsicherer Nutzer möchte ich vor dem Einstieg in die Selbstreparatur ehrlich gefragt werden „Traust du dir das zu?", damit ich bewusst entscheide und nicht überredet werde.
- Als Nutzer, der seine Einschätzung unterwegs ändert, möchte ich die Anleitungstiefe jederzeit umstellen können, damit ich bei Bedarf mehr Erklärung oder weniger Ballast bekomme.
- Als zögernder Nutzer möchte ich bei der Fähigkeits-Rückfrage ohne Vorwurf zu einer Alternative (Profi, Café) wechseln können, damit „nein, lieber nicht" ein gleichwertiger Ausgang ist.

## Akzeptanzkriterien

- [ ] Vor dem Start der Schritt-für-Schritt-Begleitung wird genau einmal eine Fähigkeits-Rückfrage gestellt, die die Selbsteinschätzung des Nutzers erfragt.
- [ ] Die Rückfrage bietet mindestens die Stufen „Anfänger" und „Geübt" zur Auswahl an.
- [ ] Die gewählte Stufe steuert die Anleitungstiefe: „Anfänger" zeigt mehr Erklärung und mehr Sicherheitshinweise, „Geübt" zeigt knappere Schritte.
- [ ] Die gewählte Stufe wird im Vorgang/Protokoll als „Können des Nutzers" festgehalten und ist für die Begleitung verfügbar.
- [ ] Der Nutzer kann die Anleitungstiefe nach der ersten Wahl während der Begleitung jederzeit umstellen, und die Anzeige passt sich sofort an.
- [ ] Die Rückfrage ermutigt im Ton, ohne Risiken oder Aufwand zu beschönigen (klar benannte schwierige/unsichere Stellen bleiben sichtbar).
- [ ] Die Rückfrage bietet einen vorwurfsfreien Ausgang an, der den Nutzer zu einer Alternative (Profi/Café/Austausch) führt, ohne den bisherigen Vorgang zu verlieren.
- [ ] Wählt der Nutzer keine Stufe aktiv aus, wird eine sichere Vorgabe (Anfänger-Tiefe) verwendet.
- [ ] Die Auswahl der Fähigkeitsstufe verändert keine Risiko-/Ampel-Einstufung — sie steuert ausschließlich die Darstellungstiefe.

## Edge Cases

- **Was, wenn der Nutzer „Geübt" wählt, aber sichtlich an einem Schritt scheitert?** Die Begleitung bleibt erreichbar über das jederzeitige Umstellen auf „Anfänger" (mehr Erklärung); zusätzlich greift der bestehende Misserfolgs-Pfad zur Fachkraft.
- **Was, wenn der Nutzer die Rückfrage überspringt oder wegklickt?** Es wird die sichere Vorgabe (Anfänger-Tiefe) angenommen; der Vorgang läuft weiter, niemand wird ausgesperrt.
- **Was, wenn der Nutzer bei der Rückfrage „nein, traue ich mir nicht zu" wählt?** Er wird vorwurfsfrei zur Alternative (Profi/Café/Austausch) geführt; das bisher erstellte Protokoll bleibt nutzbar.
- **Was, wenn der Nutzer seine Stufe mitten in der Anleitung mehrfach hin- und herwechselt?** Die jeweils zuletzt gewählte Stufe gilt; die Rückfrage wird nicht erneut als Pflicht-Dialog erzwungen.
- **Was, wenn es sich um eine sicherheitskritische Schicht-B-Reparatur handelt?** Diese allgemeine Tiefen-Steuerung deckt das nicht ab; die verpflichtende Selbsteinschätzung/Bestätigung für riskante Fälle bzw. vulnerable Nutzer (D25) ist separat als PROJ-8 spezifiziert (verwandt, hier nicht enthalten).

## Technische Anforderungen

- Die gewählte Fähigkeitsstufe wird Teil des Vorgangs-/Protokoll-Zustands, damit die Begleitung sie lesen kann (Rolle `lotse` schreibt, `begleitung` liest).
- Der ehrliche Ton ist ein Querschnitts-Leitprinzip (D11) und gilt auch in den ermutigenden Formulierungen der Rückfrage.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
