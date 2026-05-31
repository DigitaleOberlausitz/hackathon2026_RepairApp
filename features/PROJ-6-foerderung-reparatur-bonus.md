# PROJ-6: Förderung & Reparatur-Bonus-Hinweis

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Nutzer möchte ich in der Abwägung zwischen Reparatur und Neukauf sehen, ob es für mein Gerät passende Reparatur-Förderprogramme oder einen Reparatur-Bonus gibt, damit ich die Wirtschaftlichkeit der Reparatur realistischer einschätzen kann.
- Als Nutzer möchte ich zu jedem angezeigten Förderhinweis den Stand der Angabe und ein „gültig-bis"-Datum sehen, damit ich erkennen kann, wie aktuell und verlässlich der Hinweis ist.
- Als Nutzer möchte ich klar erkennen, wenn ein Förderhinweis möglicherweise veraltet oder ausgelaufen ist, damit ich mich nicht auf eine nicht mehr bestehende Förderung verlasse.
- Als Nutzer möchte ich verstehen, dass die App nur einen unverbindlichen Hinweis gibt und keine Förderzusage, damit ich keine falschen Erwartungen an einen Anspruch habe.
- Als Redakteur der Wissensbasis möchte ich Förderprogramme in einer kuratierten Liste mit Stand und Gültigkeit pflegen, damit die in der App gezeigten Hinweise gepflegt und nachvollziehbar bleiben.

## Akzeptanzkriterien

- [ ] In der Abwägung (Reparatur vs. Neukauf) werden passende Förderhinweise aus einer kuratierten, statischen Liste angezeigt, sofern mindestens ein Eintrag zum Fall passt.
- [ ] Jeder angezeigte Förderhinweis trägt sichtbar ein Feld „Stand" (Datum der letzten Prüfung) und ein Feld „gültig-bis".
- [ ] Liegt das „gültig-bis"-Datum eines Eintrags in der Vergangenheit, wird der Hinweis sichtbar als „möglicherweise ausgelaufen / veraltet" gekennzeichnet und nicht als aktuell gültig dargestellt.
- [ ] Liegt das „Stand"-Datum über einer definierten Frist zurück, wird der Hinweis als „Angaben könnten veraltet sein" gekennzeichnet.
- [ ] Jeder Förderhinweis enthält einen deutlich sichtbaren Disclaimer, dass es sich um einen unverbindlichen Hinweis und nicht um eine Anspruchs- oder Förderzusage handelt.
- [ ] Förderhinweise werden ohne regionale Vorfilterung als Default angezeigt (D13); eine regionale Einschränkung ist allenfalls optionale Zusatzinformation, kein Ausschlusskriterium.
- [ ] Trägt ein Eintrag eine regionale Geltung (z. B. Bundesland/Kommune), wird diese als Information ausgewiesen, ohne andere Einträge zu verbergen.
- [ ] Gibt es zum Fall keinen passenden oder keinen aktuell gültigen Förderhinweis, wird dies ehrlich kommuniziert (kein Hinweis erfunden, kein irreführend leerer Bereich).
- [ ] Jeder Förderhinweis verweist auf die zugehörige offizielle Quelle, damit der Nutzer die Angaben selbst prüfen kann.
- [ ] Die Förderhinweise sind als eigenständiger, klar abgegrenzter Block der Abwägung erkennbar und vermischen sich nicht mit der berechneten Kosten-Nutzen-Aussage.

## Edge Cases

- **Frage:** Was passiert, wenn das „gültig-bis"-Datum eines Eintrags bereits überschritten ist?
  **Antwort:** Der Eintrag wird weiterhin angezeigt, aber sichtbar als „möglicherweise ausgelaufen" gekennzeichnet und nicht als aktuell gültige Förderung dargestellt; der Nutzer wird auf die Quelle zur eigenen Prüfung verwiesen.
- **Frage:** Was zeigt die App, wenn es zum Gerät/Fall gar keinen kuratierten Förderhinweis gibt?
  **Antwort:** Es wird ein ehrlicher Hinweis ausgegeben, dass aktuell kein passendes Programm hinterlegt ist; es wird keine Förderung erfunden und der Bereich bleibt nicht stumm leer.
- **Frage:** Was passiert, wenn ein Programm nur regional (z. B. ein Bundesland) gilt, der Standort des Nutzers aber unbekannt ist?
  **Antwort:** Der Hinweis wird trotzdem mit ausgewiesener regionaler Geltung angezeigt (keine regionale Vorfilterung als Default, D13); der Nutzer entscheidet selbst, ob es für ihn zutrifft.
- **Frage:** Was, wenn der Nutzer den Hinweis als verbindliche Zusage missversteht?
  **Antwort:** Jeder Hinweis trägt einen Disclaimer, dass die App nur informiert und keinen Anspruch zusagt; die Prüfung und Beantragung erfolgt beim jeweiligen Förderträger.
- **Frage:** Was, wenn mehrere passende Programme gleichzeitig existieren (z. B. ein Landes- und ein Kommunalprogramm)?
  **Antwort:** Alle passenden Einträge werden als Liste angezeigt, jeweils mit eigenem Stand, gültig-bis und Quelle; keiner wird zugunsten eines anderen unterdrückt.

## Technische Anforderungen

- Datengrundlage ist eine kuratierte, statische Liste (gepflegt durch die Rolle `wissensbasis`); jeder Eintrag trägt mindestens: Bezeichnung, Träger/Region (optional), Stand, gültig-bis, Quelle/Link, kurze Beschreibung.
- Die Aktualitäts- und Gültigkeitsbewertung (veraltet / ausgelaufen) leitet sich aus „Stand" und „gültig-bis" gegen das aktuelle Datum ab.
- Anzeige erfolgt im Kontext der Rolle `abwaegung`; keine regionale Filterung als Default (D13).

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
