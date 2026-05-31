# PROJ-2: Echte Freitext-Antwort in der Triage erfassen

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Nutzer mit einem defekten Gerät möchte ich zu jeder Triage-Frage ergänzend in eigenen Worten beschreiben, was ich beobachte, damit Details, die kein vorgegebener Antwort-Chip abdeckt, nicht verloren gehen.
- Als Nutzer möchte ich Freitext zusätzlich zu den Antwort-Chips eingeben (nicht statt ihnen), damit die geführte Triage weiterhin schnell bleibt und ich nur bei Bedarf ausführlicher werde.
- Als Nutzer möchte ich meinen eingegebenen Freitext später unverändert im Protokoll wiederfinden, damit ich nachvollziehen kann, was ich angegeben habe, und es bei einer Übergabe an einen Profi mitgeben kann.
- Als Diagnose-Schritt möchte ich den vollständigen Freitext als Kontext erhalten, damit die Ursachen-Einschätzung auf den echten Schilderungen des Nutzers beruht und nicht nur auf einem vordefinierten Tag.
- Als unsicherer Nutzer möchte ich bei leerer oder unbrauchbarer Eingabe eine verständliche Rückmeldung erhalten, damit ich weiß, ob meine Angabe übernommen wurde, ohne dass mich die App blockiert.

## Akzeptanzkriterien

- [ ] In der geführten Triage steht zu jeder Frage zusätzlich zu den Antwort-Chips ein Freitext-Eingabefeld zur Verfügung.
- [ ] Der eingegebene Freitext ersetzt die Antwort-Chips nicht; ausgewählte Chips und Freitext können gemeinsam erfasst und beide gespeichert werden.
- [ ] Eingegebener Freitext wird vollständig und unverändert (inkl. Umlauten/Sonderzeichen) im Vorgangs-Protokoll gespeichert, nicht nur als vordefinierter Fix-Tag.
- [ ] Der gespeicherte Freitext wird im Protokoll-Steckbrief sichtbar dargestellt und ist der jeweiligen Frage zuordenbar.
- [ ] Beim Anstoß der Diagnose wird der erfasste Freitext als Kontext mitgegeben.
- [ ] Eine leere oder ausschließlich aus Leerzeichen bestehende Eingabe wird nicht als Antwort gespeichert und blockiert das Fortfahren nicht.
- [ ] Freitext-Eingaben werden auf eine maximale Länge begrenzt; das Limit ist dem Nutzer erkennbar (z. B. Zeichenzähler oder Hinweis).
- [ ] Überschreitet die Eingabe die maximale Länge, erhält der Nutzer eine verständliche Rückmeldung und kann den Text kürzen, ohne dass Eingaben verloren gehen.
- [ ] Führende und nachfolgende Leerzeichen werden vor dem Speichern entfernt; der inhaltliche Text bleibt erhalten.
- [ ] Die Triage bleibt ohne Freitext-Eingabe vollständig per Antwort-Chips bedienbar (Freitext ist optional).

## Edge Cases

- **Was passiert, wenn der Nutzer das Freitext-Feld leer lässt oder nur Leerzeichen eingibt?** Es wird keine Freitext-Antwort gespeichert; die Triage läuft allein mit den Antwort-Chips weiter, ohne Fehler oder Blockade.
- **Was passiert, wenn der Freitext deutlich zu lang ist?** Die Eingabe wird auf das definierte Maximum begrenzt; der Nutzer wird darauf hingewiesen und kann kürzen, ohne bereits Getipptes zu verlieren.
- **Was passiert, wenn der Freitext inhaltlich irrelevant oder unverständlich ist?** Der Text wird trotzdem unverändert erfasst und ans Protokoll/an die Diagnose übergeben; die App bewertet oder verwirft die Relevanz in diesem Schritt nicht (kein Sperren).
- **Was passiert, wenn der Nutzer sowohl einen Antwort-Chip wählt als auch Freitext eingibt?** Beide Angaben werden gespeichert und der Frage zugeordnet; keine überschreibt die andere.
- **Was passiert, wenn der Nutzer eine Frage erneut bearbeitet und seinen Freitext ändert?** Der zuletzt eingegebene Freitext ersetzt im Protokoll die vorherige Freitext-Antwort zu derselben Frage.

## Technische Anforderungen (optional)

- Stack: Flask-Backend + Vanilla-JS-Frontend gemäß `webapp/SPEC.md`.
- Freitext gehört in den Vorgangs-/Protokoll-Zustand (Schicht A, Rolle `aufnahme`) und muss der jeweiligen Frage zuordenbar sein.
- JSON-Serialisierung mit `ensure_ascii=False`, damit Umlaute/Sonderzeichen erhalten bleiben.
- Prinzip „warnen statt sperren": Validierung (leer, Länge) gibt Hinweise, blockiert den Nutzer aber nicht.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
