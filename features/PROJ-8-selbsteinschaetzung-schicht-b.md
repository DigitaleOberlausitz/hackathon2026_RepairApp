# PROJ-8: Selbsteinschätzung & Bestätigung vor riskanter Schicht B

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als minderjähriger oder unerfahrener Nutzer möchte ich vor einer gefährlichen Selbstreparatur ausdrücklich gefragt werden, ob ich volljährig bin und mir den Schritt zutraue, damit ich nicht unbedacht in eine riskante Anleitung gerate.
- Als mündiger Nutzer möchte ich bei einem sicherheitskritischen Schritt eine besonders deutliche Warnung sehen und bewusst bestätigen, damit ich die Verantwortung kenne und trotzdem selbst entscheiden darf — ohne ausgesperrt zu werden.
- Als Nutzer eines harmlosen Reparaturschritts möchte ich nicht durch eine zusätzliche Bestätigung ausgebremst werden, damit der Einstieg niederschwellig bleibt.
- Als Betreiber möchte ich, dass jede Selbsteinschätzung/Bestätigung im Vorgang dokumentiert wird, damit nachvollziehbar bleibt, dass der Nutzer vor dem riskanten Schritt bewusst zugestimmt hat.
- Als Nutzer, der die Bestätigung nicht geben will, möchte ich an dieser Stelle einen sicheren Ausweg (z. B. Fachkraft/Profi) angeboten bekommen, damit ich nicht ohne Alternative dastehe.

## Akzeptanzkriterien

- [ ] Vor einem als sicherheitskritisch markierten Schicht-B-Schritt wird eine Selbsteinschätzungs-/Bestätigungs-Aufforderung eingeblendet, bevor die konkrete Anleitung des Schritts sichtbar wird.
- [ ] Die Aufforderung enthält eine bewusste Selbsteinschätzung mit den Fragen „Bist du volljährig?“ und „Traust du dir das zu?“.
- [ ] Die Aufforderung zeigt eine gegenüber normalen Schritten besonders deutliche Sicherheits-Warnung an.
- [ ] Die Bestätigung erscheint ausschließlich bei sicherheitskritischen Schritten; bei nicht-kritischen Schritten erscheint sie nie und der Schritt ist unmittelbar zugänglich.
- [ ] Es gibt kein hartes Altersgate: Auch wer die Volljährigkeit verneint, wird nicht ausgesperrt, sondern erhält die deutliche Warnung und kann bewusst weiter entscheiden (konsistent mit D15 „warnen statt sperren“).
- [ ] Nach erfolgter Bestätigung wird die Anleitung des sicherheitskritischen Schritts freigegeben/sichtbar.
- [ ] Verweigert der Nutzer die Bestätigung, wird ihm an dieser Stelle ein sicherer Alternativweg (Fachkraft/Profi) angeboten statt eines stillen Abbruchs.
- [ ] Jede gegebene Selbsteinschätzung/Bestätigung (Antwort auf Volljährigkeit, Selbst-Zutrauen, Zeitpunkt, betroffener Schritt) wird im Vorgang/Protokoll dokumentiert.
- [ ] Welche Schritte als sicherheitskritisch gelten, richtet sich nach der Sicherheits-Achse der Warn-Ampel (z. B. erhöhte/„stop“-Sicherheitsstufe), nicht nach einer separaten Schwelle.
- [ ] Die Bestätigung wird pro sicherheitskritischem Schritt höchstens einmal verlangt; einmal bestätigte Schritte fordern bei Rückkehr im selben Vorgang keine erneute Bestätigung.

## Edge Cases

- **Frage:** Was passiert, wenn der Nutzer die Volljährigkeit verneint? **Antwort:** Kein Aussperren — die App zeigt die besonders deutliche Warnung, empfiehlt den sichereren Alternativweg (Fachkraft/Profi), lässt den mündigen Nutzer aber selbst entscheiden (D15/D25).
- **Frage:** Was, wenn alle Schritte einer Anleitung sicherheitskritisch sind? **Antwort:** Die Bestätigung greift vor dem ersten betroffenen Schritt; sind weitere kritische Schritte vorhanden, gilt die einmalige Bestätigung je Schritt, ohne den Nutzer bei jedem Schritt erneut komplett zu unterbrechen.
- **Frage:** Wie verhält sich das Feature bei einer Anleitung ganz ohne sicherheitskritische Schritte (z. B. Toaster 🟢)? **Antwort:** Es wird keinerlei Selbsteinschätzung eingeblendet; der Ablauf bleibt unverändert niederschwellig.
- **Frage:** Was, wenn der Nutzer die Bestätigung gibt, später aber zum kritischen Schritt zurückkehrt? **Antwort:** Die bereits dokumentierte Bestätigung bleibt im Vorgang gültig; der Schritt wird nicht erneut blockiert.
- **Frage:** Wie grenzt sich dies von der allgemeinen Fähigkeits-/Erfahrungsabfrage (D11) ab? **Antwort:** Die D11-Abfrage steuert generell die Anleitungstiefe (verwandt, separates Feature PROJ-3) und ist nicht sicherheitskritisch-gebunden; PROJ-8 ist die verpflichtende Sicherheits-Bestätigung, die nur unmittelbar vor riskanten Schritten erscheint.

## Technische Anforderungen

- Maßgeblich für „sicherheitskritisch“ ist die Sicherheits-Achse der Warn-Ampel des betroffenen Schritts/Geräts; das Feature führt keine eigene Risiko-Einstufung ein.
- Die Bestätigung muss im gemeinsamen Vorgangs-Zustand (`protokoll`) festgehalten werden, damit sie nachvollziehbar und sitzungsweit gültig ist.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
