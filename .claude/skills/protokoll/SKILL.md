---
name: protokoll
description: Verwaltet das Problemaufnahme-Protokoll als gemeinsamen Vorgangs-Zustand — inkl. KI-Entscheidungsprotokoll, Rollen-Übergabe, Tagebuch und Anonymisierung.
class: querschnitt
---

# Rolle

`protokoll` ist der **gemeinsame Vorgangs-Zustand („Bus")**: Es erzeugt und verwaltet das
Problemaufnahme-Protokoll, durch das alle anderen Rollen lesen und schreiben. Es ist eine
tragende Säule der App.

# Verantwortung (nur dies — die sechs D7-Funktionen)

1. **Portables Artefakt / Brücke DIY ↔ Profi:** exportier- und teilbar (Werkstatt,
   Repair Café, Forum, Hotline).
2. **Daten-Schwungrad:** anonymisierte Protokolle (mit Einwilligung) für die kuratierte
   Sammlung bereitstellen.
3. **Übergabe-Dokument zwischen Rollen:** Eigentümer / Nutzer / Diagnostiker / Reparateur
   / Teile-Beschaffer; inkl. **Eigentums-/Kostenträger-Vermerk (D14)**.
4. **Reparatur-Tagebuch / Gerätegedächtnis:** pro Gerät erhalten („war schon mal da").
5. **Selbstwirksamkeit auch ohne Erfolg:** das systematische Eingrenzen festhalten.
6. **KI-Entscheidungsprotokoll:** Ausgangslage, Fragen, Infos, Entscheidungen — *und auf
   welcher Basis* (Quelle/Konfidenz, Vertrauens-Indikator D3).

**Datenschutz-Schutzschritt vor Fremdabgabe (D23):** Bei datentragenden Geräten
(Laptop/Smartphone/Tablet — erkannt an der `kategorie` aus `aufnahme`) vor jeder
Fremdabgabe (Werkstatt/Repair-Café/Versand) den Schutzschritt „Backup + Daten löschen +
Konten abmelden" in den Vorgang aufnehmen und im Export sichtbar machen — Datenlöschung
bleibt damit nachvollziehbar dokumentiert.

# Grenzt sich ab gegen

- **`aufnahme`:** liefert *Inhalte*; `protokoll` *strukturiert/verwaltet/exportiert* sie.
- **`lotse`:** das Consent *einholen* macht `lotse`; das anonymisierte Bereitstellen
  `protokoll`.

# Kontrakt (fachlich)

- *Liest aus Vorgang:* Beiträge aller Rollen (Aufnahme, Diagnose, Ampel, Empfehlung,
  Ergebnis), Consent-Status.
- *Schreibt in Vorgang:* konsolidierter Vorgangs-Zustand; nach außen: Export-Artefakt,
  anonymisierter Schwungrad-Beitrag, Tagebuch-Eintrag.

# Vorgehen

1. Vorgang anlegen/fortschreiben, Beiträge der Rollen aufnehmen.
2. KI-Entscheidungsweg mit Quelle/Konfidenz mitschreiben.
3. Auf Anfrage exportieren/teilen; bei Consent anonymisiert ins Schwungrad geben.
4. Bei datentragenden Geräten vor Fremdabgabe den Schutzschritt „Backup + Daten löschen +
   Konten abmelden" festhalten und im Export sichtbar machen (D23).

# Übergabe

Querschnittsdienst — Zustands-Bus für **alle** Rollen. Speist mit Einwilligung
**`wissensbasis`** (Schwungrad).

# Konzept-Anker

`<<protokoll>>`, D7, D10, D14, D3, D23.
