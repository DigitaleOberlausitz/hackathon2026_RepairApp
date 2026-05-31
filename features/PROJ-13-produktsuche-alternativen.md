# PROJ-13: Produktsuche & Alternativgeräte vergleichbar machen

## Status: Done

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- PROJ-5 (Reparatur-vs-Austausch-Vergleich) — die Neukauf-Option speist sich in den Pfadvergleich ein

## User Stories

- Als Nutzer, dem ein **Austausch** empfohlen wurde, möchte ich konkrete Alternativ-/Neukauf-Optionen zu meinem defekten Gerät sehen statt nur Fließtext und einen Bild-Platzhalter, damit ich weiß, was ich überhaupt ersetzen könnte.
- Als abwägender Nutzer möchte ich jede Alternative über **Anschaffungskosten, Einrichtungsaufwand und Zeit** beschrieben bekommen, damit ich den Neukauf direkt mit dem Reparaturpfad vergleichen kann.
- Als Nutzer, der eine fundierte Entscheidung will, möchte ich, dass die Neukauf-Seite in denselben Vergleich (PROJ-5) einfließt wie die Reparatur, damit ich beide Pfade auf einer Grundlage gegenüberstellen kann.
- Als kostenbewusster Nutzer möchte ich Hinweise auf **gebrauchte, generalüberholte oder langlebige/reparierbare** Alternativen erhalten, nicht nur den günstigsten Neukauf, damit die Empfehlung zum gemeinnützigen Anspruch der App passt.
- Als Nutzer eines Falls **ohne sinnvolle Alternative** möchte ich das ehrlich gesagt bekommen, statt eine erfundene Option vorgesetzt zu kriegen, damit ich der App vertrauen kann.

## Akzeptanzkriterien

- [ ] Im „Ersetzen"-/Austausch-Pfad werden statt statischem Text und Bild-Platzhalter **konkrete Alternativ-/Neukauf-Optionen** zum defekten Gerät angezeigt.
- [ ] Die Optionen werden aus der Gerätekategorie und den vorliegenden Anforderungen des Vorgangs abgeleitet, nicht aus einem festen, gerät-unabhängigen Text.
- [ ] Jede Alternative weist mindestens **Anschaffungskosten**, **Einrichtungsaufwand** und **Zeit** aus, damit sie mit dem Reparaturpfad vergleichbar ist.
- [ ] Die aufbereiteten Vergleichsangaben sind so strukturiert, dass sie als **Neukauf-Seite** in den Pfadvergleich aus PROJ-5 einfließen können (Referenz auf PROJ-5, dort nicht erneut umgesetzt).
- [ ] Werte, die geschätzt oder KI-generiert sind, sind als solche **erkennbar** (Schätzcharakter/Konfidenz sichtbar), damit der Nutzer die Grundlage einordnen kann (D3).
- [ ] Die Darstellung bleibt **neutral und nicht werblich**: keine reine Kaufanreiz-Werbung, keine drängenden Kaufaufforderungen, kein „jetzt kaufen"-Druck — passend zur gemeinnützigen Ausrichtung.
- [ ] Wo sinnvoll, werden auch **gebrauchte, generalüberholte oder besonders langlebige/reparierbare** Optionen genannt und nicht ausschließlich der teuerste oder neueste Neukauf.
- [ ] Existiert **keine sinnvolle Alternative**, wird das ehrlich kommuniziert (kein erfundenes Gerät), und der Nutzer wird auf anschlussfähige Pfade (z. B. Profi-Reparatur, Entsorgung) verwiesen.
- [ ] Die Produktsuche **sperrt nichts**: sie zeigt und vergleicht, hindert den Nutzer aber nicht daran, dennoch zu reparieren oder einen anderen Pfad zu wählen („warnen statt sperren").
- [ ] Die Herkunft der Alternativen (Datenquelle/Verfahren) ist gegenüber dem Nutzer transparent gemacht, solange die Quelle noch offen/provisorisch ist (D18).

## Edge Cases

- **Was, wenn es kein sinnvolles Alternativgerät gibt (Nischengerät, individuelles/maßgefertigtes Gerät)?**
  Es wird keine Alternative erfunden; die App sagt offen, dass keine passende Ersatzoption gefunden wurde, und verweist auf Profi-Reparatur oder fachgerechte Entsorgung als anschlussfähige Pfade.

- **Was, wenn nur teure Neukäufe verfügbar sind, die die Reparatur klar sinnvoller machen?**
  Die teuren Optionen werden ehrlich mit ihrem Aufwand gezeigt, ohne sie kleinzurechnen; der Vergleich (PROJ-5) darf daraus die Reparatur-Empfehlung ableiten — die Produktsuche beschönigt nicht.

- **Was, wenn die Alternativen werblich oder als Kaufanreiz wirken könnten?**
  Optionen werden neutral und ohne Verkaufsdruck dargestellt; bevorzugt werden langlebige/reparierbare oder gebrauchte Varianten genannt, und es erfolgt keine Bevorzugung kommerzieller Partner als Kaufanreiz.

- **Was, wenn keine belastbaren Werte für Anschaffung/Einrichtung/Zeit vorliegen?**
  Die Option wird trotzdem mit klar gekennzeichneter grober Schätzung und niedrigem Vertrauensgrad gezeigt, statt sie wegzulassen, damit die Neukauf-Seite des Vergleichs nicht leer bleibt.

- **Was, wenn der Nutzer einen grünen Fall hat und trotzdem Alternativen ansehen will?**
  Die Produktsuche ist auch dann aufrufbar; sie zeigt die Optionen neutral, hebt den ökologischen/finanziellen Wert der Reparatur aber nicht künstlich auf und drängt nicht zum Neukauf.

## Technische Anforderungen (optional)

- **Annahme (Datenquelle offen, D18):** Die konkrete Datenquelle bzw. das Verfahren zur Ermittlung von Alternativgeräten ist laut Konzept noch offen. Bis zur Klärung kann ein provisorischer Ansatz (z. B. KI-Vorschlag mit Schätzwerten und sichtbarer Kennzeichnung) genutzt werden; die Werte müssen als geschätzt/provisorisch markiert sein.
- Die Vergleichsangaben (Anschaffung, Einrichtung, Zeit) sind als eigene, benennbare Bestandteile modelliert, damit sie ohne Umrechnung in die Neukauf-Seite des PROJ-5-Vergleichs übernommen werden können.
- Die Affiliate-/Werbefreiheit ist eine fachliche Leitplanke: die Aufbereitung darf keine kaufdrängende Logik enthalten und keine kommerziellen Optionen gegenüber gebrauchten/langlebigen bevorzugen.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
