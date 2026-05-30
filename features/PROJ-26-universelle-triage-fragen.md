# PROJ-26: Universelle Triage-Fragen für beliebige Geräte

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Nutzer eines beliebigen, auch ungewöhnlichen Geräts möchte ich die geführte Problemaufnahme (Schicht A) durchlaufen können, ohne dass mein Gerätetyp vorab als fertiger Fragenkatalog hinterlegt sein muss, damit ich sofort Mehrwert bekomme.
- Als Nutzer mit einem sicherheitskritischen Gerät (z. B. Auto, Gastherme) möchte ich die Triage trotzdem vollständig beantworten können, weil strukturierte Fragen niemanden gefährden — auch wenn die konkrete DIY-Anleitung (Schicht B) später gesperrt bleibt.
- Als Nutzer möchte ich pro Bildschirm genau eine verständliche Frage mit auswählbaren Antwort-Vorschlägen und einem sichtbaren Fortschritt sehen, damit ich mich nicht überfordert fühle und weiß, wie weit ich bin.
- Als unsicherer Nutzer möchte ich bei jeder Frage „weiß nicht" antworten oder die Aufnahme abbrechen können, ohne dass der Vorgang wertlos wird, damit ich nicht in einer Sackgasse stecken bleibe.
- Als Produktverantwortlicher möchte ich, dass die Triage-Fragen aus einem generischen, geräteunabhängigen Schema stammen, damit neue Gerätearten ohne neuen hartkodierten Fragenkatalog (`data.py`) abgedeckt sind.

## Akzeptanzkriterien

- [ ] Die geführte Triage lässt sich für ein Gerät starten und abschließen, für das kein gerätespezifischer Fragenkatalog existiert (kein Eintrag in den bisherigen Seed-Geräten).
- [ ] Die Triage-Fragen decken durchgehend dieselben universellen Aspekte ab: Symptom, Bedingungen/Auslöser, „seit wann / zuletzt verändert", „was wurde bereits getestet", Vermutung.
- [ ] Pro Bildschirm wird genau eine Frage angezeigt.
- [ ] Zu jeder Frage werden auswählbare Antwort-Vorschläge (Chips) angeboten; eine Frage ohne sinnvolle Vorschläge bleibt dennoch beantwortbar.
- [ ] Während der Triage ist ein Fortschrittsindikator sichtbar, der den aktuellen Stand innerhalb der Aufnahme anzeigt.
- [ ] Bei einem als sicherheitskritisch eingestuften Gerät läuft die Triage vollständig durch (keine Sperre der Aufnahme); die Sperrung betrifft ausschließlich die spätere Schicht B.
- [ ] Jede Frage bietet eine „weiß nicht"-Option, deren Auswahl die Aufnahme fortsetzt, ohne sie zu blockieren.
- [ ] Die Aufnahme kann jederzeit abgebrochen werden; das bis dahin gesammelte Triage-Ergebnis bleibt für den weiteren Vorgang nutzbar.
- [ ] Das Ergebnis der Triage wird strukturiert (Aspekt → Antwort) für die Übergabe an die Diagnose bereitgestellt.
- [ ] Die angezeigten Fragen stammen aus einem generischen, geräteunabhängigen Schema und nicht aus einem pro Gerät hartkodierten Fragenkatalog.
- [ ] Ist die Gerätekategorie unbekannt oder exotisch, wird dennoch eine sinnvolle, generische Fragefolge angeboten (keine leere oder abgebrochene Aufnahme).

## Edge Cases

- **Unbekanntes/exotisches Gerät ohne hinterlegte Daten** → Die Triage fällt auf die universelle, geräteunabhängige Fragefolge zurück und läuft vollständig durch; es entsteht keine leere Aufnahme.
- **Sicherheitskritisches Gerät (Auto, Gastherme, Hochspannung)** → Die Triage wird vollständig erlaubt und durchlaufen; lediglich der Zugang zu Schicht B bleibt gegated (außerhalb dieses Features).
- **Nutzer wählt durchgehend „weiß nicht"** → Die Aufnahme schließt regulär ab; das Protokoll vermerkt die offenen Punkte und bleibt für Diagnose/Weiterleitung verwertbar.
- **Nutzer bricht mitten in der Triage ab** → Die bereits gegebenen Antworten gehen nicht verloren und stehen dem weiteren Vorgang als Teil-Aufnahme zur Verfügung.
- **Antwort passt in keinen Vorschlags-Chip** → Der Nutzer kann die Frage trotzdem beantworten (über eine generische Auswahl bzw. „weiß nicht"); die echte Freitext-Erfassung wird in PROJ-2 behandelt.

## Technische Anforderungen (optional)

- Universelle Triage-Aspekte als geräteunabhängiges Schema modellieren, statt Fragen pro Gerät in `data.py` hartzukodieren.
- Abgrenzung: Dieses Feature beschränkt sich auf die generische, geführte Frage-Antwort-Triage (Schicht A). **Echte Freitext-Erfassung** der Triage-Antworten ist Gegenstand von **PROJ-2**; **multimodale Eingabe** (Foto/Video, Voice, Barcode) ist Gegenstand von **PROJ-27** — beide hier nur referenziert, nicht umgesetzt.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
