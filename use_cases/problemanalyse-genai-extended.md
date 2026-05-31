# Problemanalyse und Lösungsfindung

## 1. Typ der Sache feststellen (Kategorisierung & Exakte Identifikation)

Kategorisierung des betroffenen Gegenstands:
* Möbel
* Elektrisches Gerät
* Fahrrad / Mobilität
* Kleidung / Textilien
* Weitere Produktkategorien

**Exakte Identifikation (Voraussetzung für passgenaue Hilfe):**
* Erfassung des genauen Modells / Herstellers
* *Technische Hilfsmittel:* Barcode-Scanner, Typenschild-Scanner (via OCR-Texterkennung), KI-gestützte Bilderkennung

---

## 2. Wirkung / Zustand feststellen

### Mögliche Zustände
* Physisch kaputt
* Funktion beeinträchtigt oder kaputt
* Verbraucht (Ressourcen wie Batterien, Schmiermittel)
* Höheres Risiko:
  * Security-Risiko (z.B. keine oder seltene/späte Software-Updates)
  * Elektrische / technische Sicherheitsrisiken
  * Risiko körperlicher Schäden oder Verletzungen
* Funktion grundsätzlich in Ordnung, aber im Fehlerzustand

---

## 3. Diagnose / Symptom-Mapping (Troubleshooting) *[NEU]*

Bevor Optionen bewertet werden, muss die Ursache für das Symptom gefunden werden.

* **Symptom-Check:** Was genau passiert (oder passiert nicht)?
* **Entscheidungsbaum durchlaufen:** Eingrenzung der Fehlerquelle (z.B. "Gerät geht nicht an" -> "Kabel defekt?" vs. "Akku tiefenentladen?").
* *Integration:* Nutzung von Fehlerdatenbanken (z.B. iFixit-API für Elektronik, Community-Foren für andere Bereiche), um typische Fehlerbilder dem genauen Modell zuzuordnen.

---

## 4. Handlungsspielraum / Optionen betrachten

### Technische Maßnahmen
1. Reset-Maßnahmen durchführen
2. Wartung durchführen (Kalibrieren, Reinigen, Justieren)
3. Verbrauchsmaterial ersetzen oder austauschen
4. Garantie / Gewährleistung nutzen
5. Workaround anwenden
6. Reparieren (Selbstreparatur)
7. Assistierte Reparatur (Repair Café)
8. Reparieren lassen (Dienstleistung)
9. Entsorgen / Recycling
10. Ersatz beschaffen

---

## 5. Optionen bewerten und auswählen

### Bewertungskriterien
* Kosten / Wirtschaftlichkeit
* Mobilität (Kann das Produkt transportiert werden?)
* Aufwand / Zeit
* Wissen, Fähigkeiten und Expertise
* Ideeller Wert
* **Verfügbarkeit von Ersatzteilen und Werkzeug:** *[ERGÄNZT]* (Ist das Teil lieferbar? Habe ich das Werkzeug?)
* **Sicherheitsbewertung:** *[ERGÄNZT]* (Darf/Sollte das als Laie repariert werden? z.B. 230V-Netzteile, Gasanschlüsse)

---

## 6. Lösung umsetzen (Wissen & Lokale Ressourcen verknüpfen)

Die ausgewählte Option wird durchgeführt. Hier agiert die App als Vermittler zwischen digitalem Wissen und lokalen, physischen Ressourcen.

### A. Wissensvermittlung (Die Anleitung)
* **API-Routing (z.B. iFixit):** Nahtlose Darstellung von detaillierten Reparaturanleitungen (Schritte, Bilder, Werkzeuglisten) direkt in der eigenen UI.
* **Alternative Quellen:** Generische Anleitungen, Verlinkung zu Video-Tutorials oder Community-Guides für Nicht-Elektronik-Bereiche (Möbel, Fahrrad).

### B. Unterstützung und Vermittlung vor Ort (Die OSM-Brücke)
Sollte die Selbstreparatur an Werkzeug, Fähigkeiten oder Ersatzteilen scheitern, bietet die App eine kontextbezogene Vermittlung über eine interaktive Karte (basierend auf OpenStreetMap und Termindatenbanken).

* **Intelligentes Tag-Matching:** Die Karte filtert sich automatisch nach dem erkannten Produkt (Schritt 1) und dem Bedarf (Schritt 4/5).
  * *Beispiel Fahrrad:* OSM-Tags `shop=bicycle`, `amenity=bicycle_repair_station`
  * *Beispiel Elektronik/Haushalt:* OSM-Tags `amenity=repair_cafe`, `leisure=hackspace`
  * *Beispiel Textilien:* OSM-Tags `shop=tailor`
* **Vermittelte Ressourcen:**
  * Wissende Personen (Community-Angebote, Repair Cafés)
  * Werkzeuge erhalten (Maker Spaces, Leihangebote)
  * Produktinformationen finden und zugreifen
  * Kenntnisse und Fähigkeiten aneignen (Workshops)
  * Dienstleister finden (Professionelle Werkstätten)
  * Verkäufer / Anbieter von Ersatzteilen finden

---

## 7. Erfolgskontrolle (Feedback-Loop) *[NEU]*

* **Abfrage nach der Umsetzung:** Hat die Lösung das Problem behoben?
* Wenn Nein: Rücksprung im Flow zu Schritt 3 (Neue Diagnose) oder Schritt 4 (Neue Option wählen, z.B. "Reparieren lassen" statt "Selbstreparatur").

---

## 8. Präventionsmaßnahmen vermitteln

### Wartung und Pflege
* Wartungs- und Pflegeempfehlungen geben
* Regelmäßige Reinigung
* Regelmäßige Kalibrierung

### Alternativen empfehlen
* Bessere Produkte
* Nachhaltigere Produkte
* Geeignetere Produkte für den Einsatzzweck

### Nutzungshinweise vermitteln
* Hinweise zur korrekten Verwendung
* Sicherheitshinweise
* Vermeidung typischer Fehlanwendungen
