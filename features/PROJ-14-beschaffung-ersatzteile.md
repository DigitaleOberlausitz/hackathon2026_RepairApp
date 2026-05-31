# PROJ-14: Beschaffung von Ersatzteilen mit integrierter Bestellung

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Nutzerin, die einer DIY-Anleitung folgt, möchte ich zu den dort genannten Ersatzteilen passende Bezugsquellen angezeigt bekommen, damit ich nicht selbst nach Teilenummern und Shops suchen muss.
- Als preisbewusster Nutzer möchte ich, dass mir die App weiterhin zuerst die günstigste/sinnvollste Gesamtlösung gemäß Warn-Ampel zeigt und die Bestelloption erst danach, damit ich sicher sein kann, dass mich kein Verkaufsanreiz in eine teurere Entscheidung drängt.
- Als skeptische Nutzerin möchte ich klar erkennen, wenn die App an einer Bestellung mitverdient (Provision/Affiliate), damit ich die Empfehlung richtig einordnen kann.
- Als Nutzer eines älteren Geräts möchte ich erfahren, wenn ein Ersatzteil nicht verfügbar, proprietär oder fest verklebt/verbaut ist, damit ich nicht vergeblich eine Reparatur beginne, die an der Teilebeschaffung scheitert.
- Als sparsame Nutzerin möchte ich auch auf Gebraucht-/Refurbished-Teile als günstigere Alternative hingewiesen werden, damit ich Kosten und Ressourcen sparen kann.

## Akzeptanzkriterien

- [ ] Zu den im Vorgang hinterlegten benötigten Teilen/Werkzeugen (übergeben von `begleitung`) werden passende Bezugsquellen mit Verfügbarkeits- und Preiseinordnung angezeigt.
- [ ] Die angezeigte Handlungsempfehlung folgt immer der Warn-Ampel (günstigste/sinnvollste Lösung zuerst); die Bestelloption erscheint erst nachgelagert, nie vor oder anstelle der Ampel-Empfehlung.
- [ ] Jede Bestelloption, an der die App mitverdient, ist sichtbar als Affiliate/Provision gekennzeichnet (Transparenzhinweis direkt an der Option, nicht versteckt).
- [ ] Ist ein Teil nicht verfügbar, proprietär oder verklebt/nicht zerstörungsfrei ersetzbar, wird dies als Hinweis ausgegeben (Bezug zur Machbarkeits-Achse der Ampel) statt einer Bestelloption.
- [ ] Sofern vorhanden, werden Gebraucht-/Refurbished-Teile als gekennzeichnete günstigere/ressourcenschonendere Alternative neben Neuteilen angeboten.
- [ ] `beschaffung` liefert ausschließlich Teile/Werkzeuge — keine ganzen Ersatzgeräte (Abgrenzung zu `produktsuche`) und keine Anbieter/Standorte (Abgrenzung zu `vermittlung`).
- [ ] Der Dienst ist als Querschnittsdienst sowohl aus `begleitung` (benötigte Teile) als auch aus `abwaegung` (Kosteneinordnung des Reparaturpfads) nutzbar.
- [ ] Liegen keine Bezugsquellen oder keine benötigten Teile vor, wird dies ehrlich kommuniziert; es wird keine Bestelloption fabriziert.
- [ ] Die ermittelten Bezugsquellen, Verfügbarkeit und transparent markierten Bestelloptionen werden in den Vorgang/das Protokoll geschrieben, sodass sie nachvollziehbar bleiben.
- [ ] Preis-/Verfügbarkeitsangaben tragen einen Stand/Quellenhinweis, damit veraltete Angaben erkennbar sind.

## Edge Cases

- **Frage:** Was passiert, wenn für ein benötigtes Teil gar keine Bezugsquelle gefunden wird? **Antwort:** Es wird offen mitgeteilt, dass keine Quelle gefunden wurde; der Vorgang verweist auf Alternativen (z. B. `vermittlung` zu Profi/Café oder bei Nicht-Reparierbarkeit auf `produktsuche`/`entsorgung`) statt eine Pseudo-Bestelloption anzuzeigen.
- **Frage:** Wie geht der Dienst mit proprietären oder fest verklebten/verbauten Teilen um? **Antwort:** Es wird kein Kauf vorgegaukelt; stattdessen ein Machbarkeits-Hinweis (nicht zerstörungsfrei ersetzbar), der die Machbarkeits-Achse der Ampel stützt und ggf. Profi-Reparatur nahelegt.
- **Frage:** Was, wenn die günstigste Bestelloption von einem Affiliate-Partner stammt und dieselbe Empfehlung verzerren könnte? **Antwort:** Die Reihenfolge richtet sich strikt nach Warn-Ampel/Gesamtsinn, nicht nach Provision; die Affiliate-Kennzeichnung bleibt sichtbar, auch wenn die günstigste Option zufällig ein Partner ist.
- **Frage:** Was, wenn nur Gebraucht-/Refurbished-Teile verfügbar sind? **Antwort:** Diese werden als solche klar gekennzeichnet (Zustand, ggf. Garantieeinschränkung) angeboten; der Nutzer entscheidet mündig, es erfolgt keine Sperre.
- **Frage:** Die Partner-/Lizenz-Lage für die Bestellfunktion ist laut Konzept noch offen — wie verhält sich das Feature dann? **Antwort:** Bezugsquellen und Verfügbarkeit werden auch ohne Partneranbindung angezeigt (informativ/verlinkend); die provisionsbehaftete integrierte Bestellung wird erst aktiv, wenn die Partner-/Lizenz-Lage geklärt ist (siehe Annahme).

## Technische Anforderungen

- Annahme: Die Lizenz-/Partner-Lage der integrierten Ersatzteil-Bestellung ist laut `docs/konzept.adoc` (offene Frage zu D8) noch ungeklärt. Bis zur Klärung gilt die Bestellfunktion als konfigurierbarer, transparenzpflichtiger Baustein; rein informative Bezugsquellen sind davon unabhängig nutzbar.
- D8-Leitplanke ist verbindlich: Empfehlung folgt immer der Warn-Ampel; Bestelloption ist nachgelagert und als Affiliate/Provision gekennzeichnet.
- Fachliche Quelle: `docs/runtime-roles/beschaffung.md`; Konzept-Anker: D8 sowie Abschnitt „Finanzierung der App".

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
