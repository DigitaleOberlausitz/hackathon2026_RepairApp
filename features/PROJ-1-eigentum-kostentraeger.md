# PROJ-1: Eigentum & Kostenträger in der Aufnahme erfragen

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Nutzer, der ein fremdes Gerät bedient (z. B. Mieter mit der Waschmaschine des Vermieters), möchte ich in der Aufnahme angeben können, dass ich nicht der Eigentümer bin, damit die App das im Protokoll korrekt vermerkt und mich nicht fälschlich als Eigentümer behandelt.
- Als Nutzer möchte ich angeben, wer die Reparaturkosten trägt (ich selbst, der Eigentümer oder noch ungeklärt), damit die spätere Empfehlung und das geteilte Protokoll die Kostenfrage berücksichtigen.
- Als Eigentümer und gleichzeitig Nutzer meines eigenen Geräts möchte ich nicht mit unnötigen Rückfragen zu Eigentum und Kosten belästigt werden, damit die Triage schlank bleibt (Datensparsamkeit).
- Als Nutzer, der den Eigentümer oder Kostenträger gerade nicht kennt oder nicht nennen möchte, möchte ich diese Angabe überspringen können, damit ich trotzdem mit der Reparaturbewertung fortfahren kann.
- Als Profi/Werkstatt, die ein geteiltes Protokoll erhält, möchte ich darin Eigentums- und Kostenträger-Angaben sehen, damit ich weiß, mit wem Rücksprache zu halten ist und wer die Kosten freigibt.

## Akzeptanzkriterien

- [ ] In der Aufnahme/Triage (Schicht A) gibt es einen Schritt, der zuerst fragt, ob der Nutzer selbst der Eigentümer des Geräts ist (Auswahl „Ja, mein Gerät" / „Nein" / „Weiß ich nicht / keine Angabe").
- [ ] Bei Antwort „Ja, mein Gerät" werden keine weiteren Eigentums- oder Kostenträger-Fragen gestellt (Datensparsamkeit), und das Protokoll vermerkt „Nutzer = Eigentümer".
- [ ] Bei Antwort „Nein" wird zusätzlich erfragt, wer der Eigentümer ist (z. B. Freitext oder Auswahl wie „Vermieter", „andere Person", „Arbeitgeber", „weiß ich nicht").
- [ ] Bei Antwort „Nein" wird zusätzlich erfragt, wer die Reparaturkosten trägt (z. B. „ich selbst", „der Eigentümer", „noch zu klären", „weiß ich nicht").
- [ ] Jede der drei Fragen (Eigentümerschaft, Eigentümer, Kostenträger) lässt sich ohne Eingabe überspringen, ohne dass die Triage abbricht.
- [ ] Wird Eigentümer oder Kostenträger übersprungen bzw. „weiß ich nicht" gewählt, vermerkt das Protokoll dies ausdrücklich als „nicht angegeben / zu klären" statt einer hartkodierten Annahme.
- [ ] Das Ergebnisprotokoll zeigt das Feld „Eigentum" mit dem tatsächlich erfragten Wert (z. B. „Nutzer = Eigentümer" oder „Nutzer ≠ Eigentümer: Eigentümer = Vermieter; Kostenträger = zu klären") statt der bisher fest gesetzten Angabe „mir/ich".
- [ ] Bei „Nutzer ≠ Eigentümer" enthält das Protokoll einen sichtbaren D14-Hinweis, vor einem Eingriff Rücksprache mit dem Eigentümer/Kostenträger zu halten.
- [ ] Die erfragten Angaben sind Teil des teilbaren/exportierbaren Protokolls (Übergabe-Dokument an Profi/Repair Café).
- [ ] Es werden keine personenbezogenen Pflichtangaben erzwungen; freie Eingaben zum Eigentümer sind optional und nicht erforderlich, um fortzufahren.
- [ ] Der Eigentums-Schritt erscheint vor der Übergabe an die Diagnose, sodass der Eigentumsvermerk im gesamten weiteren Verlauf verfügbar ist.

## Edge Cases

- **Was, wenn der Nutzer der Eigentümer ist?** Dann entfallen die Folgefragen zu Eigentümer und Kostenträger vollständig; das Protokoll setzt „Nutzer = Eigentümer", und der Nutzer wird nicht weiter behelligt.
- **Was, wenn der Nutzer nicht weiß, wer Eigentümer oder Kostenträger ist?** Die Angabe darf „weiß ich nicht" lauten oder leer bleiben; das Protokoll vermerkt sie als „nicht angegeben / zu klären", ohne den Ablauf zu blockieren.
- **Was, wenn der Nutzer Eigentümer und Kostenträger trennt (z. B. nutzt fremdes Gerät, zahlt aber selbst)?** Eigentümer und Kostenträger werden getrennt erfasst, sodass auch abweichende Konstellationen (z. B. Mieter zahlt, Vermieter ist Eigentümer) korrekt im Protokoll stehen.
- **Was, wenn der Nutzer angibt, nicht Eigentümer zu sein, aber alle Folgefragen überspringt?** Das Protokoll hält „Nutzer ≠ Eigentümer" fest und markiert Eigentümer und Kostenträger als „zu klären"; der D14-Rücksprache-Hinweis erscheint trotzdem.
- **Was, wenn die Aufnahme abgebrochen oder zurückgesprungen wird, nachdem Eigentum erfasst wurde?** Bereits gemachte Eigentums-/Kostenträger-Angaben bleiben im Vorgang erhalten und werden bei Wiederaufnahme angezeigt, nicht erneut erzwungen.

## Technische Anforderungen (optional)

- Die erfassten Angaben (Eigentümerschaft, Eigentümer, Kostenträger) gehören in den Vorgangs-Zustand (Protokoll-„Bus"), nicht in eine isolierte UI-Variable, damit alle Folgeschritte und der Export darauf zugreifen.
- Die bislang hartkodierte Eigentums-Angabe „mir/ich" im Protokoll ist durch die erfragten Werte zu ersetzen.
- Datensparsamkeit: nur bei „Nutzer ≠ Eigentümer" werden Folgefragen gestellt; keine Pflicht-Personendaten.

## Tech Design (Solution Architect)
_Wird von /architecture hinzugefügt_

## QA Test Results
_Wird von /qa hinzugefügt_

## Deployment
_Wird von /deploy hinzugefügt_
