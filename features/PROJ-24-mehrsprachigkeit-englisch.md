# PROJ-24: Mehrsprachigkeit — Englisch zum Start

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als englischsprachiger Nutzer möchte ich die gesamte App-Oberfläche (Menüs, Buttons, Hinweise, Warn-Ampel-Beschriftungen) auf Englisch sehen, damit ich die App ohne Deutschkenntnisse bedienen kann.
- Als Nutzer möchte ich die Sprache jederzeit sichtbar umschalten (Deutsch ↔ Englisch), damit ich nicht an einer automatisch erkannten Sprache festhänge, wenn sie nicht passt.
- Als Nutzer, der seinen Defekt auf Englisch beschreibt, möchte ich die KI-Diagnose und die Begründung der Warn-Ampel ebenfalls auf Englisch erhalten, damit Frage und Antwort in derselben Sprache bleiben.
- Als wiederkehrender Nutzer möchte ich, dass meine zuletzt gewählte Sprache erhalten bleibt, damit ich die Wahl nicht bei jedem Besuch wiederholen muss.
- Als Nutzer möchte ich erkennen, wenn ein Inhalt oder eine Quelle nur auf Deutsch vorliegt, damit ich weiß, dass dieser Teil nicht in meiner Sprache verfügbar ist.

## Akzeptanzkriterien

- [ ] Die App unterstützt genau zwei Sprachen zum Start: Deutsch und Englisch.
- [ ] Alle festen, nutzerseitigen Oberflächentexte (Navigation, Buttons, Labels, Hinweise, Fehlermeldungen, Warn-Ampel-Stufen und ihre Beschriftungen) liegen vollständig in Deutsch und Englisch vor.
- [ ] Die Sprache ist über ein sichtbares Bedienelement jederzeit zwischen Deutsch und Englisch umschaltbar.
- [ ] Beim ersten Aufruf wird eine sinnvolle Startsprache bestimmt (z. B. aus der Browser-Sprachpräferenz), die der Nutzer danach jederzeit ändern kann.
- [ ] Die gewählte Sprache bleibt über die Sitzung hinweg erhalten und gilt für alle Screens ohne erneute Wahl.
- [ ] Bei englisch gewählter Sprache erscheinen die KI-Diagnose und die Begründung der Warn-Ampel auf Englisch.
- [ ] Wählt der Nutzer Englisch, beantwortet die App die Eingabe auch dann auf Englisch, wenn die Eingabe auf Deutsch verfasst war (und umgekehrt) — die gewählte Sprache hat Vorrang.
- [ ] Liefert die KI eine Antwort in der nicht gewählten Sprache, wird dies erkannt und korrigiert (erneut in der gewählten Sprache angefordert oder klar als sprachlich abweichend gekennzeichnet), statt die falsche Sprache unkommentiert anzuzeigen.
- [ ] Inhalte oder Quellen, die nur auf Deutsch vorliegen, werden im englischen Modus sichtbar als „nur auf Deutsch verfügbar" gekennzeichnet, ohne dass die App abbricht.
- [ ] Die sicherheitsrelevanten Aussagen (Gefahrenhinweise, Empfehlung „Profi", Stopp-Ampel) sind in beiden Sprachen inhaltlich gleichwertig und vollständig — keine sicherheitsrelevante Aussage geht in der Übersetzung verloren.
- [ ] Umschalten der Sprache verändert keine fachliche Bewertung (Ampel-Stufe, Empfehlung) — nur die Darstellungssprache ändert sich.
- [ ] Assistive Barrierefreiheit (Screenreader, große Schrift, Kontraste, ARIA) ist nicht Teil dieses Features und wird hier nicht umgesetzt.

## Edge Cases

- **Was passiert bei gemischtsprachiger Eingabe (z. B. deutsche und englische Sätze gemischt)?** Die vom Nutzer gewählte Sprache bestimmt die Antwortsprache; die App antwortet konsistent in dieser einen Sprache, unabhängig vom Sprachmix der Eingabe.
- **Was passiert, wenn die KI trotz Vorgabe in der falschen Sprache antwortet?** Die Abweichung wird erkannt; die Antwort wird in der gewählten Sprache erneut angefordert oder, falls das scheitert, klar als sprachlich abweichend gekennzeichnet — eine kommentarlos falsche Sprache wird nicht angezeigt.
- **Was passiert mit Inhalten/Quellen, die nur auf Deutsch existieren (z. B. kuratierte Quellen, Förderlisten)?** Sie werden im englischen Modus mit einem sichtbaren Hinweis „nur auf Deutsch verfügbar" gezeigt; der Pfad bleibt nutzbar und bricht nicht ab.
- **Was passiert, wenn ein neuer Oberflächentext noch keine englische Übersetzung hat?** Es wird ein klar definierter Rückfall (deutscher Text mit Kennzeichnung) angezeigt statt eines leeren oder defekten Feldes.
- **Was passiert, wenn die automatische Spracherkennung beim Erststart keine eindeutige Präferenz findet?** Es gilt ein definierter Default (Deutsch), den der Nutzer sofort sichtbar umschalten kann.

## Technische Anforderungen

- Sprachumfang strikt auf Deutsch und Englisch begrenzt; keine weiteren Sprachen in diesem Feature.
- Trennung von Oberflächentexten (statische Übersetzungen) und KI-erzeugten Texten (sprachgesteuerte Antwort): beide müssen die gewählte Sprache respektieren.
- Die gewählte Sprache muss als Vorgabe an die KI-Diagnose und die Ampel-Begründung weitergegeben werden.
- Barrierefreiheit (Screenreader, große Schrift, Kontraste, ARIA) ist explizit ausgeklammert und gehört in ein eigenes Vorhaben.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
