# PROJ-12: Entsorgungs- & Recyclingwege

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Nutzer, dessen Gerät sich nicht (sinnvoll) reparieren lässt, möchte ich konkrete, fachgerechte Entsorgungs- und Recyclingwege genannt bekommen, damit das ehrliche Abraten nicht in einer Sackgasse endet.
- Als Nutzer möchte ich für mein Gerät den passenden Weg (Wertstoffhof, kommunale Sammelstelle, Handels-/Hersteller-Rücknahme) sehen, damit ich nicht raten muss, wo Elektroschrott oder schadstoffhaltige Geräte hingehören.
- Als Nutzer möchte ich Entsorgungsstellen mit Standortbezug angezeigt bekommen, damit ich eine Stelle in meiner Nähe finde.
- Als umweltbewusster Nutzer möchte ich eine kurze ökologische Einordnung lesen, warum die fachgerechte Entsorgung wichtig ist (Rohstoff-Rückgewinnung, Schadstoffe), damit ich den Mehrwert des richtigen Wegs verstehe.
- Als Nutzer eines datentragenden Geräts möchte ich vor der Abgabe an den Hinweis zur Datenlöschung erinnert werden, damit ich keine persönlichen Daten aus der Hand gebe.

## Akzeptanzkriterien

- [ ] Wenn die `abwaegung` zum Ergebnis „nicht reparierbar / lohnt sich nicht" kommt, bietet die App einen Einstieg in die Entsorgungswege an.
- [ ] Die genannten Entsorgungswege richten sich nach der Gerätekategorie (z. B. Elektroschrott vs. schadstoffhaltiges Gerät) und enthalten den korrekten Weg für diese Kategorie.
- [ ] Es werden mindestens die Wegtypen Wertstoffhof/kommunale Sammelstelle, Handels-Rücknahmesysteme und Hersteller-Rücknahme abgedeckt, soweit für das Gerät zutreffend.
- [ ] Zu jedem genannten Weg wird ein Standortbezug angezeigt (Adresse oder Hinweis zur Stelle in der Nähe), sofern ein Standort vorliegt.
- [ ] Zu jedem Entsorgungsfall wird eine kurze ökologische Einordnung (Rohstoff-Rückgewinnung und/oder Schadstoff-Aspekt) ausgegeben.
- [ ] Bei datentragenden Geräten wird vor der Abgabe ein Hinweis auf die nötige Datenlöschung angezeigt, der auf den separaten Datenlöschungs-Pfad (PROJ-20) verweist.
- [ ] Die genannten Wege/Adressen sind als konkrete Handlungsoption erkennbar (nicht nur als Fließtext-Erwähnung wie bisher).
- [ ] Liegt kein Standort des Nutzers vor, liefert die App weiterhin gerätetyp-korrekte, standortunabhängige Wege und kennzeichnet den fehlenden Standortbezug nachvollziehbar.
- [ ] Die Herkunft der Adress-/Standortdaten wird gegenüber dem Nutzer als solche erkennbar (Quelle/Stand), sofern Adressdaten ausgegeben werden.
- [ ] Nach Anzeige der Entsorgungswege ist die Übergabe an die abschließende Wirkungs-Reflexion (`wirkung`) möglich.

## Edge Cases

- **Frage:** Was passiert, wenn der Standort des Nutzers nicht bekannt ist? **Antwort:** Die App zeigt gerätetyp-korrekte, standortunabhängige Wege (z. B. allgemeine Handels-/Hersteller-Rücknahme) und weist sichtbar darauf hin, dass kein lokaler Standortbezug hergestellt werden konnte.
- **Frage:** Was passiert bei einem datentragenden Gerät (Laptop, Smartphone)? **Antwort:** Vor jeder Abgabeempfehlung wird auf die Datenlöschung hingewiesen und auf den separaten Pfad PROJ-20 verwiesen; dieses Feature spezifiziert die Datenlöschung selbst nicht.
- **Frage:** Was passiert bei einem schadstoffhaltigen Gerät (z. B. mit Akku, Leuchtstoff, Kältemittel)? **Antwort:** Es wird der schadstoffgerechte Weg priorisiert genannt, statt das Gerät pauschal als Elektroschrott zu behandeln.
- **Frage:** Was passiert, wenn für die genannte Gerätekategorie kein eindeutiger Weg ermittelbar ist? **Antwort:** Die App nennt den allgemeinen fachgerechten Weg (z. B. kommunaler Wertstoffhof für Elektroschrott) und vermeidet eine Sackgasse.
- **Frage:** Was passiert, wenn die Datenquelle für Adressen (noch) keine Treffer liefert? **Antwort:** Die App gibt weiterhin die korrekten Wegtypen samt ökologischer Einordnung aus und kennzeichnet, dass keine konkrete Adresse verfügbar ist — sie scheitert nicht hart.

## Technische Anforderungen

- Die Datenquelle für Wertstoffhof-/Rücknahme-Adressen ist laut Konzept (Offene Fragen, `docs/konzept.adoc`) noch offen (kommunale Verzeichnisse, Rücknahmesysteme). **Annahme:** Bis zur Klärung wird der Standortbezug optional behandelt; ohne belastbare Adressquelle werden mindestens gerätetyp-korrekte Wegtypen und die ökologische Einordnung geliefert.
- Eingang: Gerät/Kategorie, Standort und Entsorgungs-Empfehlung aus `abwaegung`. Ausgang: Übergabe an `wirkung`.
- Abgrenzung: Dieses Feature führt den Entsorgungspfad aus (konkrete Wege); die Empfehlung dafür trifft `abwaegung`. Reparatur-Stellen vermittelt `vermittlung`, nicht dieses Feature.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
