# PROJ-9: Serverseitige Vorgangs-Persistenz

## Status: Done

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Nutzer möchte ich, dass mein laufender Reparatur-Vorgang einen Browser-Reload oder
  Geräte-/Sitzungswechsel übersteht, damit ich nicht von vorn beginnen muss, wenn ich
  unterbrochen werde.
- Als Nutzer möchte ich einen früher begonnenen Vorgang über einen Link oder eine
  Vorgangs-ID wieder aufnehmen, damit ich an genau der Stelle weiterarbeite, an der ich
  aufgehört habe.
- Als Nutzer ohne Konto möchte ich, dass mein Vorgang trotzdem gespeichert und mir
  zugeordnet wird (anonyme Vorgangs-ID), damit ich die App ohne Login-Hürde nutzen kann.
- Als Nutzer möchte ich, dass das gesamte Protokoll (Symptome, getestete Schritte,
  Ampel-Einschätzung, KI-Entscheidungsweg, Ergebnis) als zusammenhängender Vorgangs-Zustand
  erhalten bleibt, damit es später als Grundlage für Tagebuch, Export und Teilen dient.
- Als wiederkehrender Nutzer möchte ich abgeschlossene Vorgänge zu einem Gerät wiederfinden
  („war schon mal da"), damit ich von früheren Reparaturen profitiere.

## Akzeptanzkriterien

- [ ] Beim Anlegen eines neuen Vorgangs wird serverseitig eine eindeutige, nicht erratbare
  Vorgangs-ID erzeugt und an den Client zurückgegeben.
- [ ] Der vollständige Vorgangs-Zustand (alle bisherigen Protokoll-Beiträge aller Rollen)
  wird serverseitig persistent gespeichert und überlebt einen Neustart des Servers.
- [ ] Nach einem Browser-Reload wird der zuletzt aktive Vorgang anhand seiner Vorgangs-ID
  vollständig wiederhergestellt und der Nutzer landet im zuletzt erreichten Schritt.
- [ ] Der Vorgang wird automatisch nach jedem zustandsändernden Schritt gespeichert
  (kein manuelles „Speichern" nötig), ohne den Ablauf spürbar zu verzögern.
- [ ] Ein bestehender Vorgang lässt sich über seine Vorgangs-ID gezielt wieder aufrufen und
  fortschreiben; dabei gehen keine zuvor gespeicherten Beiträge verloren.
- [ ] Ein Vorgang funktioniert vollständig ohne Login; die anonyme Vorgangs-ID ist die
  alleinige Zuordnung zum Vorgang.
- [ ] Der gespeicherte Vorgang enthält neben den Inhalten auch den KI-Entscheidungsweg
  (Fragen, ermittelte Infos, Entscheidungen inkl. Quelle/Konfidenz), so wie er im Protokoll
  erfasst wurde.
- [ ] Wird eine unbekannte oder abgelaufene Vorgangs-ID aufgerufen, erhält der Nutzer eine
  klare Rückmeldung und kann einen neuen Vorgang starten, statt in einen Fehlerzustand zu
  geraten.
- [ ] Mehrere Vorgänge desselben anonymen Nutzers bleiben getrennt und einzeln adressierbar
  (Grundlage für ein späteres Tagebuch).
- [ ] Der wiederhergestellte Vorgang ist inhaltlich identisch zum Zustand vor dem Reload
  (keine stillen Daten- oder Schritt-Verluste).

## Edge Cases

- **Was passiert bei parallelen Schreibzugriffen auf denselben Vorgang (zwei offene Tabs)?**
  Der Vorgang bleibt konsistent; der zuletzt gespeicherte Zustand gilt, und es entsteht kein
  korrupter oder halb-geschriebener Vorgangs-Zustand.
- **Was passiert, wenn der Client eine Vorgangs-ID schickt, die es serverseitig nicht (mehr)
  gibt?** Es wird kein fremder Vorgang offengelegt und kein harter Fehler ausgelöst; der
  Nutzer wird sauber zum Start eines neuen Vorgangs geführt.
- **Was passiert, wenn der Nutzer mitten in der Triage abbricht und Tage später zurückkehrt?**
  Der unvollständige Vorgang bleibt erhalten und kann an der Abbruchstelle fortgesetzt werden;
  ein unfertiger Vorgang ist ein gültiger gespeicherter Zustand.
- **Was passiert, wenn der Nutzer dasselbe Problem zum selben Gerät erneut meldet?** Frühere
  abgeschlossene Vorgänge zum Gerät bleiben auffindbar und werden nicht überschrieben, sodass
  Wiedererkennung später möglich ist.
- **Wie wird mit personenbezogenen bzw. sensiblen Inhalten im gespeicherten Vorgang
  umgegangen?** Hier wird ausschließlich der Vorgangs-Zustand gespeichert; die detaillierte
  Datenschutz-, Consent- und Anonymisierungs-Umsetzung (D10) ist explizit ein eigenes Projekt
  und nicht Teil dieses Features.

## Technische Anforderungen

- Maßgeblicher fachlicher Bezug: `docs/konzept.adoc` (D7 „Problemaufnahme-Protokoll", Zustands-Bus
  D19), `docs/runtime-roles/protokoll.md`, `docs/funktionsabgleich.md` (§1 `protokoll`, §3
  „Persistenz / Vorgangs-Zustand", §5 Stufe 1 Punkt 5).
- Der Vorgangs-Zustand ist der gemeinsame „Bus", über den laut D19 alle Rollen lesen/schreiben;
  die Persistenz muss diesen vollständigen Zustand abbilden, nicht nur einzelne Felder.
- Dieses Feature liefert die Speicher-Grundlage für PROJ-10 (Export/Teilen), das Reparatur-Tagebuch
  und die Wiedererkennung; diese Folge-Funktionen selbst sind nicht Teil dieses Features.
- Abgrenzung: Datenschutz/Consent/Anonymisierung und Daten-Schwungrad (D10) sind ausdrücklich
  ausgelagert und hier nur insoweit relevant, als der Zustand technisch gespeichert wird.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
