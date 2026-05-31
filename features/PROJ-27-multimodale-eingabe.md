# PROJ-27: Multimodale Eingabe (Foto/Video, Sprache, Barcode/Modell-Scan)

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Nutzer mit einem sichtbaren Defekt möchte ich ein Foto oder kurzes Video meines Geräts (Schaden, Typenschild) aufnehmen oder hochladen, damit ich das Problem zeigen kann, statt es umständlich zu beschreiben.
- Als Nutzer mit schmutzigen oder belegten Händen während der Reparatur möchte ich mein Problem per Sprache diktieren, damit ich nicht tippen muss.
- Als Nutzer, der sein genaues Gerätemodell nicht kennt, möchte ich den Barcode, QR-Code oder das Typenschild scannen, damit Kategorie und Modell eindeutig erfasst werden.
- Als unsicherer Nutzer möchte ich nach jeder multimodalen Eingabe jederzeit auf die Texteingabe ausweichen können, damit mich eine fehlgeschlagene Aufnahme nicht blockiert.
- Als Nutzer möchte ich vor der ersten Foto-/Sprachaufnahme verständlich erfahren, was mit meinen Medien geschieht, damit ich bewusst zustimmen kann.

## Akzeptanzkriterien

- [ ] Der Foto-/Video-Button startet eine echte Aufnahme bzw. einen Datei-Upload und liefert das Medium als Eingang in die Aufnahme/Diagnose (kein Attrappen-Verhalten mehr).
- [ ] Aufgenommene oder hochgeladene Fotos/Videos werden als Medien-Anhang dem Vorgang zugeordnet und in der Problemaufnahme sichtbar.
- [ ] Der Sprach-/Voice-Button nimmt gesprochene Eingabe auf und überführt sie als Text in die Problemschilderung.
- [ ] Der Barcode-/Modell-Scan erkennt Barcode/QR/Typenschild und befüllt damit Gerätekategorie und/oder Modell der Aufnahme.
- [ ] Bei unbrauchbarem Foto (zu dunkel/unscharf) erhält der Nutzer einen verständlichen Hinweis und kann erneut aufnehmen oder zu Text wechseln.
- [ ] Wird Sprache nicht oder unsicher erkannt (z. B. Dialekt), bietet die App eine Korrektur des erkannten Texts und einen Fallback auf manuelle Texteingabe an.
- [ ] Wird ein Barcode nicht erkannt oder das Modell ist unbekannt, führt der Pfad ohne Sackgasse zur manuellen Geräte-/Modellangabe weiter.
- [ ] Aus jeder Modalität führt jederzeit ein sichtbarer Weg zurück zur Texteingabe (Fallback auf Text).
- [ ] Vor der ersten Foto- oder Sprachaufnahme wird auf die Datenschutz-Grundhaltung hingewiesen und eine Einwilligung eingeholt (Detail-Umsetzung referenziert eigenes Projekt, vgl. D10).
- [ ] Die drei Modalitäten (Foto/Video, Sprache, Barcode/Modell-Scan) funktionieren je einzeln und unabhängig voneinander, sodass jede separat ausgeliefert werden kann.

## Edge Cases

- **Foto ist zu dunkel oder unscharf?** Die App meldet die schlechte Bildqualität, bittet um eine neue Aufnahme und bietet alternativ den Wechsel zur Textbeschreibung an — sie verwirft das Medium nicht stillschweigend.
- **Sprache wird nicht verstanden oder ist stark dialektal?** Der erkannte Text wird zur Bestätigung/Korrektur angezeigt; lässt er sich nicht klären, fällt der Nutzer ohne Datenverlust auf manuelle Texteingabe zurück.
- **Barcode/QR nicht lesbar oder Modell unbekannt?** Statt einer Sackgasse erscheint die manuelle Eingabe von Kategorie/Modell; die übrige Aufnahme läuft normal weiter.
- **Nutzer verweigert die Medien-Einwilligung?** Foto/Video und Sprache bleiben gesperrt; die Texteingabe steht weiterhin uneingeschränkt zur Verfügung.
- **Gerät/Browser ohne Kamera oder Mikrofon?** Die betroffene Modalität wird sauber als nicht verfügbar dargestellt; Upload (bei Foto/Video) und Text bleiben als Wege offen.

## Technische Anforderungen

- Multimodale Eingabe ist ein Eingang in `aufnahme`/`diagnose`; reine Text-Freitext-Erfassung ist Gegenstand von PROJ-2 und wird hier nur referenziert.
- Detaillierte Datenschutz-/Consent- und Anonymisierungs-Umsetzung ist ein eigenes Projekt (D10) und wird hier nur referenziert, nicht ausgestaltet.
- Stack-Rahmen: Flask + Vanilla-JS gemäß `webapp/SPEC.md`.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
