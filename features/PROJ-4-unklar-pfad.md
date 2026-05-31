# PROJ-4: Unklar-Pfad bei Diagnose-Sackgasse

## Status: Done

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- PROJ-9 (Vorgangs-Persistenz) — wünschenswert, damit das gesammelte Protokoll beim Weiterleiten erhalten bleibt

## User Stories

- Als Nutzer mit einem schwer eingrenzbaren Defekt möchte ich, dass die App ehrlich sagt „eine verlässliche Eingrenzung ist nicht möglich", statt mir eine scheinbar sichere Diagnose vorzutäuschen, damit ich der Einschätzung trauen kann.
- Als Nutzer, dessen Symptome widersprüchlich sind oder zu keinem bekannten Fehlerzustand passen, möchte ich trotzdem einen klaren nächsten Schritt angeboten bekommen (Profi, Repair Café oder Community), damit ich nicht in einer Sackgasse stecken bleibe.
- Als Nutzer möchte ich das bis zum Unklar-Punkt gesammelte Protokoll behalten und exportieren können, damit ich es einem Profi oder dem Repair Café vorlegen kann und meine Antworten nicht verloren gehen.
- Als Nutzer mit einem nur unsicher eingegrenzten, aber nicht völlig unklaren Defekt möchte ich ein normales Ergebnis mit niedriger Konfidenz erhalten und nicht vorschnell in den Unklar-Pfad geschoben werden, damit ich weiter selbst entscheiden kann.
- Als Betreiber möchte ich, dass die Entscheidung „unklar" auf einer nachvollziehbaren Konfidenz-Schwelle beruht und im KI-Entscheidungsprotokoll festgehalten wird, damit die Einstufung prüfbar und konsistent bleibt.

## Akzeptanzkriterien

- [ ] Es existiert eine definierte Konfidenz-Schwelle, unterhalb derer eine Diagnose als „unklar" gilt; die Schwelle ist dokumentiert und im Diagnose-Ergebnis als Begründung nachvollziehbar.
- [ ] Liegt die Diagnose-Konfidenz unter der Unklar-Schwelle oder passt das Symptom zu keinem Fehlerzustand, liefert die App statt eines Geräts/einer Ursache einen ehrlichen Unklar-Ausgang ohne vorgetäuschte Sicherheit.
- [ ] Widersprüchliche Nutzerantworten (z. B. einander ausschließende Triage-Angaben) werden als Unklar-Auslöser erkannt und führen in den Unklar-Pfad.
- [ ] Eine Diagnose mit niedriger, aber ausreichender Konfidenz wird weiterhin als normales Ergebnis (mit niedriger-Konfidenz-Hinweis) ausgegeben und NICHT als Unklar behandelt; die Abgrenzung ist im Ergebnis erkennbar.
- [ ] Der Unklar-Ausgang formuliert ausdrücklich, dass keine verlässliche Eingrenzung möglich ist, und stellt keine Reparatur- oder Sicherheitsempfehlung dar, die Sicherheit suggeriert.
- [ ] Das bis zum Unklar-Punkt gesammelte Protokoll (Symptome, getestete Tags, Diagnose-Versuche, Konfidenz/Herkunft) bleibt vollständig erhalten und einsehbar.
- [ ] Aus dem Unklar-Pfad kann der Nutzer das Protokoll exportieren bzw. teilen (für Übergabe an Dritte).
- [ ] Der Unklar-Pfad bietet eine Weiterleitung an mindestens Profi, Repair Café und Community an.
- [ ] Der Nutzer landet nie in einer Sackgasse: aus dem Unklar-Pfad ist immer mindestens ein nächster Schritt wählbar.
- [ ] Die Einstufung „unklar" inkl. auslösendem Grund (niedrige Konfidenz / kein Fehlerzustand / Widerspruch) wird im KI-Entscheidungsprotokoll des Vorgangs vermerkt.

## Edge Cases

- **Frage:** Was passiert, wenn die Konfidenz exakt auf der Schwelle liegt? **Antwort:** Der Grenzwert wird eindeutig einer Seite zugeordnet (inklusiv/exklusiv festgelegt), sodass identische Eingaben reproduzierbar dieselbe Einstufung ergeben.
- **Frage:** Wie wird zwischen „unklar" und „normales Ergebnis mit niedriger Konfidenz" unterschieden, wenn beide niedrige Konfidenz haben? **Antwort:** „Unklar" greift nur, wenn keine Ursache hinreichend gestützt ist oder Antworten sich widersprechen; existiert eine plausible, wenn auch unsichere Ursache, bleibt es ein normales Ergebnis mit Niedrig-Konfidenz-Hinweis.
- **Frage:** Was, wenn die Persistenz (PROJ-9) nicht verfügbar ist und der Nutzer neu lädt? **Antwort:** Der Export bzw. das Teilen muss innerhalb der laufenden Sitzung sofort möglich sein, damit das Protokoll vor einem möglichen Verlust gesichert werden kann.
- **Frage:** Was, wenn die KI/Diagnose technisch nicht erreichbar ist? **Antwort:** Das gilt nicht als „unklar" im fachlichen Sinn; der Nutzer erhält einen verständlichen Hinweis auf das technische Problem und behält Zugriff auf das bisherige Protokoll.
- **Frage:** Was, wenn das Gerät als gefährlich erkennbar ist, die Ursache aber unklar bleibt? **Antwort:** Die ehrliche Unklar-Aussage und die Sicherheits-/Stopp-Warnung schließen sich nicht aus; die Gefahrenwarnung bleibt bestehen und die Weiterleitung priorisiert den Profi-Weg.

## Technische Anforderungen

- Maßgeblich fachlich: Konzept-Anker D20 (Diagnose-Sackgasse / unklar-Pfad), D3 (Vertrauens-Indikator), Edge-Cases-Abschnitt in `docs/konzept.adoc` sowie `docs/runtime-roles/diagnose.md`.
- Stack: Flask-Backend + Vanilla-JS-Frontend (kein vorgetäuschtes Gerät als Pflicht-Rückgabe).
- Die Unklar-Einstufung gehört fachlich zur Rolle `diagnose`; die Abgrenzung der Schwelle ist abgestimmt mit dem Vertrauens-Indikator (D3).

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
