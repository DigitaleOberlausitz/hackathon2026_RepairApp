# PROJ-17: Diagnose auf Basis der kuratierten Fehlerzustand-Sammlung

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- PROJ-15 (Kuratierte Fehlerzustand-Sammlung) — die Datengrundlage, durch die die Diagnose führt
- PROJ-16 (Recherche-Dienst) — liefert kuratiert-zuerst-Antworten mit Quelle/Konfidenz

## User Stories

- Als Nutzer mit einem defekten Gerät möchte ich, dass die App meine beschriebenen Symptome gegen bekannte, gepflegte Fehlerzustände prüft, statt mir eine frei erfundene Diagnose zu liefern, damit ich der Ursachen-Einschätzung vertrauen kann.
- Als Nutzer, dessen Symptom auf mehrere mögliche Ursachen passt, möchte ich gezielte Abgrenzungs-Rückfragen gestellt bekommen, damit die wahrscheinlichste Ursache eingegrenzt wird und ich nicht raten muss.
- Als Nutzer möchte ich zu jeder vorgeschlagenen Ursache sehen, woher die Aussage stammt (kuratiert oder KI-ermittelt) und wie sicher sie ist, damit ich einschätzen kann, wie verlässlich die Diagnose ist.
- Als Nutzer, dessen Symptom zu keinem bekannten Fehlerzustand passt, möchte ich ehrlich darauf hingewiesen und an einen sinnvollen nächsten Schritt übergeben werden, statt eine vorgetäuschte Ursache zu erhalten.
- Als Betreiber möchte ich, dass die Diagnose nichts behauptet, das nicht durch die kuratierte Sammlung oder den Recherche-Dienst belegt ist, damit die App fachlich seriös bleibt und Fehldiagnosen vermieden werden.

## Akzeptanzkriterien

- [ ] Die Diagnose gleicht die aufgenommenen Symptome zuerst gegen die kuratierte Fehlerzustand-Sammlung (PROJ-15) ab, bevor eine freie KI-Ermittlung erwogen wird.
- [ ] Passt mehr als ein Fehlerzustand zum Symptom, gibt die Diagnose mehrere Ursachen-Kandidaten aus, statt sich vorschnell auf einen festzulegen.
- [ ] Bei mehreren Kandidaten stellt die Diagnose mindestens eine echte Abgrenzungs-Rückfrage, deren Beantwortung die Kandidatenliste nachvollziehbar eingrenzt (Diagnose-Schleife statt einmaliger Rateversuch).
- [ ] Die Abgrenzungs-Rückfragen stammen aus dem jeweiligen kuratierten Fehlerzustand und sind nicht frei generiert.
- [ ] Jede vorgeschlagene Ursache trägt eine Herkunfts-Kennzeichnung (kuratiert vs. KI-ermittelt) sowie eine Konfidenz, die aus dem Recherche-Dienst (PROJ-16) stammt und nicht von der Diagnose frei erfunden wird.
- [ ] Liegt zu einem Symptom kein kuratierter Fehlerzustand vor, wird eine KI-ermittelte Ursache deutlich als ungeprüft mit niedriger Konfidenz gekennzeichnet (kein Vortäuschen kuratierter Sicherheit).
- [ ] Passt das Symptom zu keinem Fehlerzustand und lässt sich auch per Recherche nichts Belegtes ermitteln, übergibt die Diagnose an den Unklar-Pfad (PROJ-4), statt eine Ursache zu behaupten.
- [ ] Die Diagnose macht keine Aussage, die nicht durch die kuratierte Sammlung oder eine belegte Recherche-Antwort gestützt ist; unbelegte Behauptungen werden vermieden.
- [ ] Die Ursachen-Kandidaten werden mit Konfidenz, Herkunft und den offenen bzw. beantworteten Abgrenzungsfragen in den Vorgang geschrieben (lesbar für die nachfolgende Bewertung).
- [ ] Die Diagnose stuft selbst keine Sicherheit, Komplexität oder Kosten ein — sie benennt ausschließlich die Ursache(n); die Ampel-Einstufung bleibt Sache der Bewertung.
- [ ] Das Diagnose-Ergebnis (gewählte/verworfene Kandidaten, gestellte Rückfragen, Herkunft, Konfidenz) ist im KI-Entscheidungsprotokoll des Vorgangs nachvollziehbar.

## Edge Cases

- **Frage:** Was passiert, wenn ein Symptom auf mehrere Fehlerzustände passt und die Abgrenzungs-Rückfragen die Kandidaten nicht weiter eingrenzen können? **Antwort:** Die verbleibenden Kandidaten werden gemeinsam mit ihren jeweiligen Konfidenzen ausgegeben; bleibt keiner hinreichend gestützt, greift die Übergabe an den Unklar-Pfad (PROJ-4).
- **Frage:** Was, wenn die kuratierte Sammlung für das Gerät vorhanden ist, aber gerade dieses Symptom nicht enthält? **Antwort:** Es wird nicht der nächstbeste kuratierte Fehlerzustand erzwungen; entweder liefert die belegte Recherche eine gekennzeichnete Ursache oder es geht in den Unklar-Pfad.
- **Frage:** Was, wenn der Recherche-Dienst (PROJ-16) keine Konfidenz/Quelle liefern kann? **Antwort:** Die Diagnose darf keine eigene Konfidenz erfinden; ohne belegte Konfidenz wird die Aussage als ungeprüft mit niedriger Konfidenz behandelt oder unterbleibt.
- **Frage:** Was, wenn die Nutzerantworten auf die Abgrenzungs-Rückfragen sich widersprechen? **Antwort:** Die Diagnose erzwingt keine Ursache, sondern behandelt den Widerspruch als Unklar-Auslöser und übergibt an den Unklar-Pfad (PROJ-4).
- **Frage:** Was, wenn ein kuratierter Fehlerzustand-Kandidat als gefährlich gilt? **Antwort:** Die Diagnose benennt den Kandidaten weiterhin neutral als Ursache; die Sicherheitseinstufung und Warnung erfolgt erst in der nachgelagerten Bewertung (saubere Rollen-Abgrenzung).

## Technische Anforderungen

- Maßgeblich fachlich: Konzept-Anker D4 (Diagnose-Modell: KI führt durch kuratierte Struktur, Inhaltsmodell eines Fehlerzustands), D2 (kuratiert zuerst), D3 (Vertrauens-Indikator) in `docs/konzept.adoc` sowie `docs/runtime-roles/diagnose.md`.
- Stack: Flask-Backend + Vanilla-JS-Frontend; keine frei erfundene Diagnose als Default.
- Strikte Rollen-Abgrenzung: `diagnose` schließt nur auf Ursachen; belegte Quellbeschaffung kommt von `recherche` (PROJ-16), Ampel-Einstufung von `bewertung`, ehrlicher Ausgang vom Unklar-Pfad (PROJ-4, nur referenziert).

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
