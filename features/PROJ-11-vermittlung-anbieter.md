# PROJ-11: Vermittlung von Reparatur-Anbietern & Standorten

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Nutzer, dessen Gerät die Empfehlung „Profi" oder „Repair Café" erhalten hat, möchte ich passende Reparatur-Anbieter in meiner Nähe sehen, damit ich weiß, wohin ich mein Gerät bringen kann.
- Als preisbewusster Nutzer möchte ich auf einen Blick erkennen, ob ein Angebot ehrenamtlich (Repair Café) oder wirtschaftlich orientiert (Werkstatt/Betrieb) ist, damit ich Aufwand und Kosten einschätzen kann.
- Als Nutzer möchte ich angeben, wo ich mich befinde (oder es weglassen können), damit die Suche an meinen Standort angepasst wird, ohne dass ich zur Standortfreigabe gezwungen werde.
- Als Nutzer, dessen Gerät zu einer bestimmten Kategorie gehört, möchte ich Anbieter sehen, die zu meinem Gerätetyp passen, damit ich keine ungeeignete Stelle ansteuere.
- Als Nutzer möchte ich erkennen, wie aktuell die angezeigten Anbieter-Daten sind, damit ich einschätzen kann, ob sich eine Kontaktaufnahme lohnt.

## Akzeptanzkriterien

- [ ] Zu Gerätekategorie und Standort liefert die Vermittlung eine Liste passender Reparatur-Anbieter (Repair Cafés und Werkstätten) statt eines statischen Texts oder Karten-Platzhalters.
- [ ] Jeder gelistete Anbieter ist eindeutig als „ehrenamtlich" (Repair Café) oder „wirtschaftlich orientiert" (Werkstatt/Betrieb) gekennzeichnet.
- [ ] Jeder Anbieter wird mit Standortbezug dargestellt (Name, Ort/Adresse und, sofern vorhanden, Entfernung zum angegebenen Standort).
- [ ] Die Ergebnisliste ist nach Standort-Nähe geordnet, wenn ein Standort vorliegt.
- [ ] Wenn kein Standort vorliegt oder die Standortfreigabe verweigert wird, kann der Nutzer den Ort manuell eingeben oder eine standortunabhängige Liste erhalten — die Funktion bleibt nutzbar.
- [ ] Liefert die Suche keine Anbieter in der Nähe, erscheint eine verständliche Meldung mit Hinweis auf alternative Wege (z. B. Radius erweitern, anderen Ort eingeben).
- [ ] Zu jedem Anbieter bzw. zur Ergebnisliste wird der Stand/die Aktualität der zugrunde liegenden Daten ausgewiesen.
- [ ] Die Vermittlung kann aus dem „Profi/Café"-Ergebnis der `bewertung` und aus der `abwaegung` heraus aufgerufen werden.
- [ ] Bei einem Anbieter-Ergebnis wird angeboten, das mitgeführte Vorgangs-/Werkstatt-Protokoll zur Mitnahme zu übergeben.
- [ ] Die Vermittlung ermittelt ausschließlich Reparatur-Stellen und vermischt diese nicht mit Ersatzteil-Bezug (`beschaffung`), Ersatzgeräten (`produktsuche`) oder Entsorgungsstellen (`entsorgung`).

## Edge Cases

- **Frage:** Was passiert, wenn der Nutzer seinen Standort nicht freigibt? **Antwort:** Die Suche bleibt nutzbar — der Nutzer kann einen Ort manuell eingeben oder eine standortunabhängige Liste erhalten; es erfolgt keine Sperre.
- **Frage:** Was, wenn im Umkreis des Standorts keine Anbieter gefunden werden? **Antwort:** Eine verständliche „Keine Anbieter in der Nähe"-Meldung mit Handlungsalternativen (Radius erweitern, anderen Ort eingeben) wird gezeigt; es entsteht keine leere oder irreführende Liste.
- **Frage:** Was, wenn die Anbieter-Daten veraltet oder unvollständig sind? **Antwort:** Der Stand/die Aktualität wird transparent ausgewiesen und es wird empfohlen, vor dem Hinbringen Kontakt aufzunehmen; veraltete Quellen werden nicht als verlässlich dargestellt.
- **Frage:** Was, wenn eine externe Datenquelle (z. B. `reparatur-initiativen.de`) nicht erreichbar ist? **Antwort:** Die Funktion scheitert nicht hart; sie weist die eingeschränkte Verfügbarkeit aus und bietet, soweit möglich, eine reduzierte oder vorhandene Datengrundlage an.
- **Frage:** Was, wenn zur Gerätekategorie keine spezialisierten Anbieter existieren? **Antwort:** Es werden allgemeine Reparatur-Stellen (z. B. Repair Cafés) als Fallback angezeigt, klar als nicht gerätespezifisch gekennzeichnet.

## Technische Anforderungen

- Stack: Flask-Backend + Vanilla-JS-Frontend; „warnen statt sperren" gilt auch hier — fehlender Standort oder fehlende Daten dürfen die Funktion nie blockieren.
- **Annahme / offener Punkt (aus Konzept):** Die OpenStreetMap-Anbindung ist laut `docs/konzept.adoc` (Offene Fragen / OSM-Konkretisierung) noch nicht entschieden. Primäre Zielquelle ist `reparatur-initiativen.de`; OSM ist ergänzend und vor Umsetzung zu konkretisieren. Bis zur Klärung kann gemäß Decision-Log D13 zunächst mit einer eigenen, KI-erstellten Datengrundlage gearbeitet werden.
- Datenstand/Aktualität muss pro Ergebnis bzw. Liste mitgeführt und anzeigbar sein.
- Klare Trennung der Verantwortung gegenüber `beschaffung`, `produktsuche` und `entsorgung` (nur Reparatur-Anbieter/-Standorte).

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
