# PROJ-5: Reparatur-vs-Austausch-Vergleich für alle Fälle

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- PROJ-6 (Förderung & Reparatur-Bonus) — die Förderhinweise fließen in den Kostenvergleich ein

## User Stories

- Als Nutzer eines **grünen** Falls (Reparatur klar empfohlen) möchte ich trotzdem sehen, was ein Austausch kosten und bedeuten würde, damit ich die Empfehlung „reparieren" nachvollziehen und mir meiner Entscheidung sicher sein kann.
- Als Nutzer eines **gelben** Falls (unklar) möchte ich die Pfade Reparatur, Profi, Austausch und Entsorgung direkt nebeneinander über Geld, Zeit und Ökologie vergleichen, damit ich begründet abwägen kann, statt zu raten.
- Als Nutzer eines **roten** Falls möchte ich verstehen, *warum* der Austausch hier wirtschaftlicher ist, und welche Folgekosten ein neues Gerät trotzdem mit sich bringt, damit ich nicht vorschnell ein „Neukauf ist immer günstiger" glaube.
- Als kostenbewusster Nutzer möchte ich die **versteckten Austausch-Kosten** (Neueinrichtung, Transport/Logistik, Bedienung neu lernen, Verkabelung, Ausfallzeit) sichtbar im Vergleich haben, damit ich den echten Gesamtaufwand eines Neukaufs sehe und nicht nur den Kaufpreis.
- Als Nutzer mit eigener Wertepriorität möchte ich, dass die App mir die Zielkonflikte (günstig vs. ökologisch vs. schnell) transparent zeigt und eine *begründete* Empfehlung gibt, die finale Gewichtung aber mir überlässt, damit die Entscheidung meine bleibt (D18).

## Akzeptanzkriterien

- [ ] Der Pfadvergleich wird für **jeden** Ampelzustand angezeigt — grün, gelb und rot — und nicht mehr nur bei `stop`/roten Geräten.
- [ ] Der Vergleich stellt die vier Pfade **Reparatur (selbst)**, **Profi-Reparatur**, **Austausch (Neukauf)** und **Entsorgung** gegenüber.
- [ ] Jeder Pfad wird über die drei Dimensionen **Kosten (Geld)**, **Zeit/Aufwand** und **Ökologie (Ressourcen/CO₂)** ausgewiesen.
- [ ] Der Austausch-Pfad weist den **Gesamtaufwand** aus, nicht nur den Kaufpreis: er enthält explizit die versteckten Posten Neueinrichtung, Transport/Logistik, Bedienung neu lernen, Verkabelung und Ausfallzeit.
- [ ] Der Vergleich nennt **genau einen empfohlenen Pfad**, hebt ihn sichtbar hervor und liefert eine **textliche Begründung** der Empfehlung.
- [ ] Die Begründung macht den **Zielkonflikt transparent**, wenn die Dimensionen sich widersprechen (z. B. „Austausch ist günstiger, Reparatur ist ökologischer") (D18).
- [ ] Wenn der **Austausch wirtschaftlicher** ist, wird das ehrlich und ohne Beschönigung so dargestellt — auch wenn die Ampel grün/gelb ist.
- [ ] Die finale Abwägung „was wichtiger ist" bleibt **beim Nutzer**: die App empfiehlt und begründet, trifft aber keine Entscheidung für ihn und sperrt keinen Pfad (D18, „warnen statt sperren").
- [ ] Förderhinweise aus PROJ-6 werden, sofern vorhanden, in den **Kosten** des Reparatur-/Profi-Pfads berücksichtigt und im Vergleich kenntlich gemacht (Referenz auf PROJ-6, nicht in diesem Feature umgesetzt).
- [ ] Der hervorgehobene Pfad ist anschlussfähig: Reparatur führt weiter zur Begleitung, Austausch zur Produktsuche, Entsorgung zur Entsorgung — der Vergleich übernimmt aber **nur die Empfehlung**, nicht das Ausführen.
- [ ] Werte, die geschätzt oder KI-generiert sind, sind als solche erkennbar (Schätzcharakter sichtbar), damit der Nutzer die Grundlage des Vergleichs einordnen kann (D3).
- [ ] Der Vergleich nutzt die vorhandene Ampel-Einstufung als Eingang, **gated aber nicht** — er gewichtet und stellt dar, ohne den Nutzer am Weitergehen zu hindern.

## Edge Cases

- **Was, wenn für ein Gerät keine belastbaren Kosten-/Zeit-/Öko-Werte vorliegen?**
  Der Vergleich wird trotzdem mit klar gekennzeichneter grober Schätzung gezeigt und der niedrige Vertrauensgrad benannt; er wird nie ganz weggelassen, weil der Vergleich für jeden Fall erscheinen soll.

- **Was, wenn der Austausch bei einem grünen Gerät günstiger erscheint als die Reparatur?**
  Der Vergleich sagt das transparent, hebt aber zusätzlich den ökologischen/sozialen Wert der Reparatur hervor und überlässt die Gewichtung dem Nutzer — die grüne Reparatur wird nicht künstlich schöngerechnet.

- **Was, wenn ein Pfad sachlich nicht anwendbar ist (z. B. Selbstreparatur bei verklebtem, proprietärem Gerät)?**
  Der Pfad bleibt in der Tabelle sichtbar, wird aber als „nicht sinnvoll machbar" markiert statt entfernt, damit der Nutzer den vollständigen Vergleich und den Grund für den Ausschluss sieht.

- **Was, wenn der Nutzer nicht der Eigentümer ist oder ein anderer die Kosten trägt (D14)?**
  Der Kostenvergleich bleibt fachlich gleich; die Empfehlung verweist darauf, dass die Abwägung mit dem Kostenträger/Eigentümer zu klären ist, ohne eine Entscheidung vorwegzunehmen.

- **Was, wenn ein Mehrfachdefekt vorliegt und mehrere Reparaturen anfallen?**
  Die Reparaturkosten/-zeit im Vergleich spiegeln den Gesamtaufwand aller bekannten Defekte wider, sodass die Empfehlung nicht auf Basis nur eines Teildefekts verzerrt wird.

## Technische Anforderungen (optional)

- Der Vergleich ist als wiederverwendbare Darstellung gedacht, die unabhängig vom Ampel-Level (grün/gelb/rot) gerendert wird, statt an den `stop`-Sonderfall gekoppelt zu sein.
- Die versteckten Austausch-Posten (Neueinrichtung, Transport/Logistik, Lernen, Verkabelung, Ausfallzeit) sind als eigene, benennbare Bestandteile des Austausch-Gesamtaufwands modelliert.
- Förderwerte werden nicht hier ermittelt, sondern aus PROJ-6 übernommen und im Kostenfeld referenziert.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
