# PROJ-10: Protokoll-Export & Teilen

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- PROJ-9 (Vorgangs-Persistenz) — der zu exportierende Vorgangszustand muss serverseitig vorliegen

## User Stories

- Als Nutzerin, die ihr Gerät zu einem Repair Café bringt, möchte ich mein Protokoll als PDF mitnehmen, damit die Helfer sofort sehen, welches Symptom vorliegt und was ich bereits getestet habe — ohne alles erneut erklären zu müssen.
- Als Nutzer, der eine Werkstatt um Rat fragt, möchte ich mein Protokoll als kurze Textnachricht teilen (z. B. per Messenger/E-Mail), damit ich die Eckdaten meines Falls schnell weitergeben kann.
- Als Nutzerin, die in einem Community-Forum nachfragt, möchte ich einen teilbaren Link erzeugen, über den andere meinen Vorgang ansehen können, damit ich nicht jedes Detail manuell abtippen muss.
- Als Profi (Werkstatt/Café-Helfer), der einen geteilten Vorgang öffnet, möchte ich die Warn-Ampel mit Begründung sowie Quelle und Konfidenz der KI-Einschätzung sehen, damit ich die bisherige Einschätzung nachvollziehen und ihr angemessen vertrauen kann.
- Als Nutzer, der noch mitten im Vorgang steckt, möchte ich auch ein unvollständiges Protokoll teilen können, damit ich frühzeitig Rat einholen kann — und dabei klar erkennen, dass der Vorgang noch nicht abgeschlossen ist.

## Akzeptanzkriterien

- [ ] Aus dem Protokoll-Screen lässt sich der aktuelle Vorgang als PDF-Dokument exportieren.
- [ ] Aus dem Protokoll-Screen lässt sich der aktuelle Vorgang als Textnachricht (Klartext zum Kopieren/Weitergeben) exportieren.
- [ ] Aus dem Protokoll-Screen lässt sich ein teilbarer Link zum Vorgang erzeugen.
- [ ] Das exportierte Dokument enthält das aufgenommene Symptom (inkl. Bedingungen / „seit wann").
- [ ] Das exportierte Dokument enthält die bereits getesteten/durchgeführten Schritte.
- [ ] Das exportierte Dokument enthält die Warn-Ampel je Achse (Sicherheit, Aufwand, Kosten, Machbarkeit) mit Level und Begründung sowie das Gesamt-Verdict und die Empfehlung.
- [ ] Das exportierte Dokument weist Quelle und Konfidenz der KI-Einschätzung aus (Vertrauens-Indikator D3), inklusive Kennzeichnung „KI-Fallback" wo zutreffend.
- [ ] Das exportierte Dokument enthält den Eigentums-/Kostenträger-Vermerk (D14, z. B. „eigenes Gerät" / „fremdes Gerät / auf Gewährleistung").
- [ ] Ein unvollständiger Vorgang (fehlende Diagnose/Ampel) ist exportierbar und wird im Dokument sichtbar als „in Bearbeitung / unvollständig" gekennzeichnet, statt den Export zu verweigern.
- [ ] Beim Erzeugen eines teilbaren Links wird dem Nutzer angezeigt, dass der Link den Vorgang sichtbar macht, und ein Ablauf-/Gültigkeitshinweis ist erkennbar.
- [ ] Der teilbare Link öffnet eine Lese-Ansicht des Vorgangs (kein Bearbeiten durch den Empfänger).
- [ ] Alle drei Export-Wege (PDF / Nachricht / Link) bilden denselben konsolidierten Vorgangszustand inhaltlich konsistent ab.

## Edge Cases

- **Frage:** Was passiert, wenn der Vorgang noch keine Diagnose oder keine Warn-Ampel hat? **Antwort:** Der Export ist trotzdem möglich; die fehlenden Abschnitte werden als „noch nicht ermittelt" ausgewiesen und der Vorgang als unvollständig markiert, damit der Empfänger den Stand korrekt einordnet.
- **Frage:** Was passiert, wenn der Nutzer einen Link teilt und dieser nach längerer Zeit erneut geöffnet wird? **Antwort:** Der Link trägt einen Gültigkeits-/Ablaufrahmen; nach Ablauf zeigt die Lese-Ansicht einen klaren „nicht mehr verfügbar"-Hinweis statt veralteter Inhalte.
- **Frage:** Was passiert beim Export, wenn die KI-Einschätzung nur aus dem Fallback stammt? **Antwort:** Quelle/Konfidenz weisen dies offen als „KI-Fallback (nicht belegt)" aus, damit der Empfänger die Aussage nicht für kuratiert gesichert hält.
- **Frage:** Was passiert mit personenbezogenen Detail-Daten beim Teilen-per-Link? **Antwort:** Der Link macht den fachlichen Vorgangszustand sichtbar; die feingranulare Datenschutz-/Anonymisierungs-Steuerung (D10) ist bewusst NICHT Teil dieses Features, sondern eigenes Projekt — hier wird lediglich die Sichtbarkeit grundsätzlich transparent gemacht.
- **Frage:** Was passiert, wenn der Export auf einem Gerät ohne native Teilen-Funktion ausgelöst wird? **Antwort:** Es steht mindestens ein universeller Weg bereit (Text zum Kopieren bzw. PDF-Download / Link-Kopie), sodass kein Export-Weg ins Leere läuft.

## Technische Anforderungen

- Stack-konform: Flask-Backend + Vanilla-JS-Frontend (kein Kotlin/Fritz2).
- Quelle der Inhalte ist der serverseitig persistierte Vorgangszustand aus PROJ-9; das Export-Artefakt ist eine Sicht darauf, kein eigener Datenstamm.
- JSON/Text mit echten Umlauten/Emojis (kein ASCII-Escaping), konsistent zur bestehenden SPEC-Konvention.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
