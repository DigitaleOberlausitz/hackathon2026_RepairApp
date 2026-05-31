# PROJ-20: Datenlöschung vor Fremdabgabe

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- PROJ-1 (Eigentum & Kostenträger) — relevant bei Abgabe an Dritte/Werkstatt
- PROJ-10 (Protokoll-Export & Teilen) — der Schutzschritt ergänzt das Übergabe-/Werkstatt-Protokoll

## User Stories

- Als Nutzer mit einem defekten Laptop, den ich in eine Werkstatt geben will, möchte ich vor der Abgabe daran erinnert werden, meine persönlichen Daten zu schützen, damit nicht Fremde Zugriff auf meine Dateien, Fotos und Konten bekommen.
- Als Nutzer eines Smartphones möchte ich eine klare, schrittweise Anleitung zum Backup, Löschen der Daten und Abmelden meiner Konten erhalten, damit ich nichts Wichtiges vergesse, bevor das Gerät aus meiner Hand geht.
- Als Nutzer, der sein Gerät selbst repariert (DIY) und nicht aus der Hand gibt, möchte ich nicht mit einem Datenlösch-Schritt belästigt werden, der für mich gar nicht zutrifft.
- Als Nutzer, der seine Daten bewusst auf dem Gerät belassen möchte (z. B. weil die Werkstatt vertrauenswürdig ist oder das Gerät zur Datenrettung geht), möchte ich gewarnt, aber nicht blockiert werden, damit ich trotzdem fortfahren kann.
- Als datenschutzbewusster Nutzer möchte ich, dass der Schutzschritt sichtbar im Übergabe-Protokoll vermerkt ist, damit dokumentiert ist, dass ich vor der Abgabe an die Datensicherheit gedacht habe.

## Akzeptanzkriterien

- [ ] Bei der Aufnahme/Diagnose wird erkannt bzw. erfragt, ob das Gerät datentragend ist (z. B. Laptop, Smartphone, Tablet); das Ergebnis wird im Vorgang vermerkt.
- [ ] Der Schutzschritt erscheint nur, wenn das Gerät datentragend ist **und** an Dritte (Werkstatt/Profi) abgegeben wird.
- [ ] Bei einer reinen DIY-Reparatur ohne Fremdabgabe entfällt der Schutzschritt vollständig.
- [ ] Der Schutzschritt nennt prominent die drei Teilschritte: Backup anlegen, Daten löschen, Konten abmelden.
- [ ] Der Schutzschritt wird sichtbar in das Übergabe-/Werkstatt-Protokoll aufgenommen, bevor das Gerät aus der Hand gegeben wird.
- [ ] Der Nutzer kann jeden der drei Teilschritte als erledigt markieren.
- [ ] Wählt der Nutzer „Daten nicht löschen“, erscheint eine deutliche Warnung mit Hinweis auf die Risiken, aber der Vorgang lässt sich trotzdem fortsetzen (warnen statt sperren).
- [ ] Die Entscheidung des Nutzers (Schritte erledigt / bewusst übersprungen) wird im Protokoll festgehalten.
- [ ] Ist das Gerät nicht datentragend, erscheint weder Schutzschritt noch Datenlösch-Warnung.
- [ ] Der Schutzschritt verweist für den Fall einer Entsorgung statt Reparatur auf den entsprechenden Entsorgungspfad (PROJ-12), ohne dessen Logik zu duplizieren.

## Edge Cases

- **Wie wird erkannt, ob ein Gerät datentragend ist?** Über die Gerätekategorie aus Aufnahme/Diagnose (Laptop, Smartphone, Tablet u. ä.); ist die Kategorie unklar, wird der Nutzer einmalig gefragt, ob persönliche Daten auf dem Gerät sind.
- **Was passiert bei DIY-Reparatur ohne Fremdabgabe?** Der Schutzschritt entfällt komplett, da das Gerät die Hand des Nutzers nicht verlässt.
- **Was, wenn der Nutzer seine Daten nicht löschen will?** Es wird deutlich gewarnt (Fremdzugriff möglich), aber der Vorgang bleibt fortsetzbar; die bewusste Entscheidung wird protokolliert.
- **Wie grenzt sich der Schritt zur Entsorgung ab?** Geht das Gerät nicht in Reparatur, sondern in die Entsorgung, ist der Datenschutz dort ebenfalls relevant — dies wird nur referenziert (PROJ-12), nicht hier umgesetzt.
- **Was, wenn der Nutzer das Backup auslassen, aber löschen will?** Die drei Teilschritte sind unabhängig markier-/überspringbar; eine fehlende Sicherung wird als Hinweis angemerkt, blockiert aber nicht.

## Technische Anforderungen

- Das datentragend-Flag und der Abgabe-Kontext (Dritte vs. DIY) müssen aus dem bestehenden Vorgangs-/Protokoll-Zustand ableitbar sein.
- Der Schutzschritt und seine Teilschritt-Zustände sind Bestandteil des Übergabe-Protokoll-Artefakts (Anschluss an PROJ-10).

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
