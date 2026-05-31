# PROJ-7: Garantie-/Gewährleistungs-Gate vor dem Eingriff

## Status: Done

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Nutzer mit einem noch jungen Gerät möchte ich vor dem ersten Schraubgriff erfahren, dass eine Eigenreparatur meine Gewährleistung gefährden kann, damit ich keinen kostenlosen Anspruch verschenke.
- Als Nutzer, dessen Problem nur ein Anwenderfehler oder normale Wartung ist, möchte ich nicht mit einem Garantie-Warnhinweis aufgehalten werden, damit ich zügig weiterkomme.
- Als Nutzer, der vom Garantie-Hinweis betroffen ist, möchte ich einen klaren Weg zur Reklamation bei Hersteller oder Händler angeboten bekommen, damit ich die für mich günstigere Option leicht ergreifen kann.
- Als mündiger Nutzer möchte ich trotz Garantie-Hinweis bewusst mit der Eigenreparatur fortfahren dürfen, damit ich selbst über mein Gerät entscheide.
- Als Nutzer möchte ich beim Erfragen meines Kaufdatums nicht ausgefragt oder genervt werden, damit der Hinweis hilfreich statt lästig bleibt.

## Akzeptanzkriterien

- [ ] Das Gate erscheint genau einmal vor dem ersten praktischen Schicht-B-Schritt (DIY-Anleitung), nicht früher und nicht zwischen späteren Schritten.
- [ ] Das Gate erscheint nur, wenn ein echter technischer Defekt vorliegt; bei Anwenderfehler, normaler Wartung oder garantieneutralen Kleinigkeiten läuft DIY ohne Gate weiter.
- [ ] Liegt ein technischer Defekt vor, ermittelt die App den Gewährleistungsstatus aus einer einzigen, leicht überspringbaren Frage nach dem ungefähren Kaufzeitpunkt (z. B. Zeitspanne statt exaktem Datum).
- [ ] Wählt der Nutzer „weiß nicht" oder überspringt die Frage, behandelt die App den Status als unbekannt und zeigt das Gate als vorsorglichen Hinweis, ohne den Nutzer zu blockieren.
- [ ] Ist das Gerät noch in der Gewährleistung, warnt das Gate verständlich, dass eine Eigenreparatur die Gewährleistung gefährden kann.
- [ ] Das Gate bietet eine klare Handlungsalternative: Reklamation bei Hersteller oder Händler.
- [ ] Das Gate bietet eine deutlich sichtbare Option, die Eigenreparatur trotz Hinweis bewusst fortzusetzen (warnen statt sperren).
- [ ] Ist die Gewährleistung erkennbar abgelaufen, erscheint das Gate nicht und die DIY-Begleitung läuft normal weiter.
- [ ] Die Garantie-relevante Antwort des Nutzers (technischer Defekt ja/nein, Kaufzeitspanne, getroffene Wahl) wird im Vorgangs-Protokoll festgehalten.
- [ ] Hat der Nutzer das Gate in einem Vorgang bereits beantwortet, wird er bei Fortsetzung desselben Vorgangs nicht erneut gefragt.

## Edge Cases

- **Frage:** Was passiert, wenn der Nutzer den Kaufzeitpunkt nicht kennt? **Antwort:** Der Status gilt als unbekannt; das Gate erscheint als vorsorglicher Hinweis mit Reklamations- und Fortfahren-Option, ohne zu blockieren.
- **Frage:** Was, wenn das Problem ein Anwenderfehler ist, das Gerät aber noch jung ist? **Antwort:** Kein Gate — ohne technischen Defekt entfällt der Garantiebezug, DIY läuft normal weiter.
- **Frage:** Was, wenn der Nutzer trotz aktiver Gewährleistung fortfahren will? **Antwort:** Die Fortfahren-Option ist immer verfügbar; die Entscheidung und der vorausgegangene Hinweis werden protokolliert, die Begleitung läuft weiter.
- **Frage:** Was, wenn unklar ist, ob es ein technischer Defekt oder ein Anwenderfehler ist? **Antwort:** Im Zweifel behandelt die App es als technischen Defekt und zeigt das Gate, um keinen Anspruch zu gefährden.
- **Frage:** Was, wenn ein Gerät mehrere Defekte hat, von denen nur einer technisch ist? **Antwort:** Schon ein technischer Defekt löst das Gate vor dem ersten Eingriff aus.

## Technische Anforderungen

- Single Responsibility: Dieses Feature entscheidet ausschließlich über Anzeige, Inhalt und Verlauf des Garantie-Gates; es trifft keine Risiko-Einstufung (Warn-Ampel) und ändert keine Diagnose.
- Der Garantiestatus und die Nutzerwahl müssen im Vorgangs-Protokoll persistiert werden.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
