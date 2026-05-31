# Funktionsabgleich — Web-App vs. Konzept & Laufzeit-Rollen

> **Zweck:** Gegenüberstellung des aktuell in `webapp/` implementierten Funktionsumfangs
> mit den fachlichen Anforderungen aus [`docs/konzept.adoc`](konzept.adoc) und den 14
> Laufzeit-Rollen aus [`docs/runtime-roles/`](runtime-roles/). Zeigt, **was schon da ist**
> und **was noch implementiert werden muss**.
>
> **Stand:** 2026-05-30 · Bezug: `webapp/` (Flask + Vanilla-JS + OpenAI), `webapp/SPEC.md`.

## Einordnung in einem Satz

Die Web-App ist ein **vollständiger, klickbarer Happy-Path-Durchstich** der Customer
Journey für **zwei fest verdrahtete Beispielgeräte** (Toaster 🟢, Mikrowelle 🔴) plus eine
**OpenAI-Live-Diagnose aus Freitext**. Sie demonstriert die *Erlebnis-Oberfläche* der
Kernidee (Warn-Ampel, geführte Triage, Schritt-für-Schritt-Begleitung, Protokoll) —
aber **noch nicht** die fachliche Tiefe, die Datengrundlage, die Alternativpfade, die
Edge-Cases und die rollenbasierte Backend-Architektur (D19) des Konzepts.

**Legende:** ✅ vorhanden · 🟡 teilweise / nur UI-Attrappe · ❌ fehlt

---

## 1. Abgleich je Laufzeit-Rolle

| Rolle | Klasse | Status | Vorhanden | Lücke / zu implementieren |
|---|---|:--:|---|---|
| `lotse` | Orchestrierung | 🟡 | Fester linearer Ablauf in `app.js` (Start→Triage→Ampel→Entscheidung→Begleitung→Wirkung); Abbruch „zu heikel → Profi" vorhanden. | Keine echte Orchestrierung/Routing-Logik; **Consent-Gate (D10)** fehlt; **Fähigkeits-Rückfrage „Traust du dir das zu?" (D11)** fehlt; vorzeitige Empfehlung nur als statischer Exit-Button. |
| `aufnahme` | Journey (Schicht A) | 🟡 | Geführte Triage, eine Frage pro Screen, Antwort-Chips, Fortschrittspunkte; Symptom/Bedingungen/„seit wann"/„bereits getestet" als Fragen. | Fragen sind **pro Gerät hartcodiert** (`data.py`), nicht universell für *jedes* Gerät; **Multimodalität (D9)** nur Text — Foto/Video, Voice, Barcode sind reine Attrappen-Buttons; **Eigentum/Kostenträger (D14)** wird nie erfragt (Protokoll setzt „mir/ich" hart); **freie Antwort** speichert nur einen Fix-Tag, kein echter Freitext; **Tagebuch-Wiedererkennung** fehlt. |
| `diagnose` | Journey | 🟡 | OpenAI erzeugt aus Freitext ein vollständiges `device` inkl. Ursache; Keyword-Fallback auf 2 Seeds. | **Keine kuratierte Fehlerzustand-Sammlung (D4)** — die KI „erfindet" alles frei; keine echten **Abgrenzungs-Rückfragen** als Diagnose-Schleife; kein Anstoß von `recherche`; Konfidenz/Quelle wird von der KI fabriziert, nicht belegt. |
| `bewertung` | Journey | ✅ | **Kern-USP gut umgesetzt:** Warn-Ampel mit 4 Achsen (Sicherheit/Aufwand/Kosten/Machbarkeit), Level + Begründung je Achse, Verdict, Empfehlung, Vertrauens-Badge, mit Kritikalität skalierende KI-Warnung, Haftungshinweis (D16) im Sheet. | Ampel-Werte sind statisch/KI-generiert, nicht berechnet; **Mehrfachdefekte (D24)** — nur eine Ampel pro Gerät, kein „Gesamt-Fazit nach schwächstem Glied"; `vermittlung` bei Profi/Café-Empfehlung nicht angebunden. |
| `abwaegung` | Journey | 🟡 | Entscheidungs-Screen mit 4 Pfaden; Reparatur-vs-Neukauf-Tabelle (Geld/Zeit/Umwelt) **nur bei `stop`-Geräten**; empfohlener Pfad hervorgehoben. | **Förderung / Reparatur-Bonus** fehlt komplett; Gesamtaufwand Neukauf (Einrichtung/Transport/Lernen) nicht modelliert; keine begründete Gewichtung über das `verdictBody` hinaus; Tabelle fehlt bei grünen/gelben Fällen. |
| `begleitung` | Journey (Schicht B) | 🟡 | Schritt-für-Schritt; **adaptive Tiefe Anfänger/Geübt (D11)**; Gefahr-/Sicherheits-Callouts; Handoff-Schritt; Misserfolgs-Exit „Profi finden". | **Garantie-/Gewährleistungs-Gate (D21)** vor erstem Eingriff fehlt; **Selbsteinschätzung/Bestätigung bei riskanter Schicht B (D25)** fehlt; Übergabe benötigter Teile an `beschaffung` fehlt; „Vorlesen"-Button ohne Funktion. |
| `wirkung` | Journey | ✅ | Erfolg/Misserfolg-Pfade; Impact-Kennzahlen (gespart/CO₂/gerettet); würdigt **Selbstwirksamkeit auch ohne Erfolg**; verweist aufs Reparatur-Tagebuch. | Tagebuch-Verweis ohne Persistenz (s. `protokoll`); Kennzahlen statisch aus dem Seed. |
| `produktsuche` | Alternativpfad | ❌ | „Ersetzen"-Pfad zeigt statischen Text + Bild-Platzhalter. | Keine echten **Alternativgeräte**, kein Vergleich (Anschaffung/Einrichtung/Zeit). |
| `entsorgung` | Alternativpfad | ❌ | „Ersetzen"-Pfad erwähnt Wertstoffhof im Fließtext. | Keine konkreten **Entsorgungs-/Recyclingwege**, keine Standort-/Rücknahme-Adressen, keine Umwelteinordnung. |
| `recherche` | Querschnitt | ❌ | — (implizit durch OpenAI). | Kein eigener Dienst „kuratiert zuerst → KI-Fallback gekennzeichnet → online", keine belegte Quelle/Konfidenz-Pipeline. |
| `vermittlung` | Querschnitt | ❌ | „Hilfe vor Ort"/„Profi"-Pfad zeigt statischen Text + Karten-Platzhalter. | Keine **Repair Cafés/Werkstätten**, keine OSM-/`reparatur-initiativen.de`-Anbindung, keine Standortlogik, keine Ehrenamt-vs-wirtschaftlich-Kennzeichnung. |
| `beschaffung` | Querschnitt | ❌ | — | Keine **Ersatzteile**, keine integrierte Bestellung, keine D8-Affiliate-Leitplanke. |
| `protokoll` | Querschnitt (Zustands-Bus) | 🟡 | Steckbrief rendert **live** aus dem Vorgang (Symptom, getestete Tags aus echten Triage-Antworten, Ampel-Zusammenfassung, „Warum"-Aufklappen, Quelle/Konfidenz). | **Kein Export/Teilen** (Buttons Nachricht/PDF/Link ohne Funktion); **KI-Entscheidungsprotokoll** nur rudimentär; **Eigentums-/Kostenträger (D14)** hartcodiert statt aus `aufnahme`; **keine Persistenz** (In-Memory, Reload = alles weg) → kein Tagebuch; kein **Daten-Schwungrad/Anonymisierung (D10)**. |
| `wissensbasis` | Back-Office | ❌ | 2 hartcodierte Seed-Geräte in `data.py`. | Keine kuratierte **Fehlerzustand-Sammlung**, kein Experten-Review-Workflow (D5), keine **Förder-/Quellenlisten** mit „Stand/gültig-bis", keine Schwungrad-Einarbeitung, keine eigene Datengrundlage (D13). |

### Querschnitts-Prinzip: Vertrauens-Indikator (D3) — 🟡

Vorhanden in der Ampel (Vertrauens-Badge mit Quelle + Sicherheitsstufe, skalierende
„Die KI kann sich irren"-Warnung, Begründungs-Sheet). **Lücke:** Das Prinzip soll *jede*
KI-Aussage begleiten — der Diagnose- bzw. Triage-Schritt selbst trägt noch keinen
sichtbaren Konfidenz-/Begründungshinweis, `abwaegung` führt keine eigene Konfidenz.

---

## 2. Edge-Cases & Sonderfälle (Konzept, D20–D25)

| # | Edge-Case | Status | Anmerkung |
|---|---|:--:|---|
| D20 | **Diagnose-Sackgasse / unklar-Pfad** | ❌ | Die KI liefert immer ein Gerät; es gibt keinen ehrlichen „unklar"-Ausgang, der das Protokoll trotzdem an Profi/Café/Community weiterreicht. |
| D21 | **Aktive Gewährleistung / Garantie** | ❌ | Kein Hinweis auf möglichen Garantieverlust bei technischem Defekt + Reklamationsempfehlung. |
| D22 | **Rückruf / bekannter Sicherheitsmangel** | ❌ | Kein Rückruf-Datenfeld, kein prominenter Hinweis statt DIY-Anleitung. |
| D23 | **Datenlöschung vor Fremdabgabe** | ❌ | Bei datentragenden Geräten fehlt der Schutzschritt „Backup + Daten löschen + Konten abmelden". |
| D24 | **Mehrfachdefekte** | ❌ | Nur ein Defekt/eine Ampel pro Gerät; kein Gesamt-Fazit nach schwächstem Glied. |
| D25 | **Minderjährige / vulnerable Nutzer** | ❌ | Keine Selbsteinschätzung/Bestätigung vor sicherheitskritischer Schicht B. |

---

## 3. Querschnitts- & Architektur-Lücken

| Thema | Status | Lücke |
|---|:--:|---|
| **Rollen-/Agenten-Architektur (D19)** | ❌ | Die App ist eine einzelne, hartcodierte Happy-Path-Statemachine. Der im Konzept zentrale *orchestrierte Verbund* der 14 Rollen im Backend existiert nicht — `diagnose`/`bewertung` etc. sind nicht als getrennte, einzeln prüfbare Bausteine umgesetzt (ein OpenAI-Prompt erzeugt alles auf einmal). |
| **Persistenz / Vorgangs-Zustand** | ❌ | Keine Datenbank, kein gespeicherter Vorgang. Der „Zustands-Bus" (Protokoll) lebt nur im JS-Speicher und ist beim Reload weg → kein Tagebuch, keine Wiedererkennung, keine Übergabe über die Sitzung hinaus. |
| **Eingabe-Wege (D9)** | 🟡 | Nur Text/Freitext funktioniert. Foto/Video, Voice, Barcode/Modell-Scan sind UI-Platzhalter. |
| **Mehrsprachigkeit (D17)** | 🟡 | Nur Deutsch. Englisch zum Start fehlt. (Assistive Barrierefreiheit ist bewusst ausgelagert.) |
| **Datenschutz / Consent (D10)** | ❌ | Kein Einwilligungs-Flow, keine Anonymisierung. (Detail-Umsetzung ist eigenes Projekt — aber das Consent-Gate gehört in `lotse`.) |
| **Datengrundlage (D13)** | ❌ | Statt einer eigenen, KI-erstellten + menschlich geprüften Datengrundlage gibt es 2 Demo-Seeds. |

---

## 4. Was die App heute gut kann (bewusst festhalten)

- **Erlebbarer End-to-End-Durchstich** der Customer Journey — die Story trägt.
- **Warn-Ampel** als Kern-USP (D1) ist überzeugend umgesetzt: 4 Achsen, abgestufte
  Warnung, „warnen statt sperren", Haftungshinweis, Vertrauens-Badge.
- **Ehrlicher Ton & Abraten** (Mikrowelle 🔴 → klarer Profi-Fall mit sicherem Abbruch).
- **Adaptive Anleitungstiefe** (Anfänger/Geübt) und **Misserfolgs-Pfad** ohne Vorwurf.
- **Live-Protokoll** aus echten Triage-Antworten + **OpenAI-Diagnose mit sauberem
  Fallback** (läuft auch ohne API-Key).

---

## 5. Priorisierte Roadmap (Vorschlag)

### Stufe 1 — fachliche Tiefe & ehrliche Pfade (nah am MVP-Ziel „Machbarkeit/Akzeptanz")
1. **`aufnahme` vervollständigen:** Eigentum/Kostenträger (D14) erfragen statt hartcodieren; echte Freitext-Antwort in der Triage; Fähigkeits-Rückfrage (D11).
2. **unklar-Pfad (D20):** ehrlicher „keine sichere Eingrenzung"-Ausgang, Protokoll bleibt nutzbar.
3. **`abwaegung` ausbauen:** Vergleichstabelle für *alle* Fälle; Förderung/Reparatur-Bonus-Hinweis (statische kuratierte Liste mit „Stand/gültig-bis").
4. **`begleitung` absichern:** Garantie-Gate (D21) + Selbsteinschätzung vor riskanter Schicht B (D25).
5. **Persistenz light:** Vorgang/Protokoll serverseitig speichern → echtes Export/Teilen + Tagebuch-Grundlage.

### Stufe 2 — Alternativpfade & Querschnittsdienste real
6. **`vermittlung`:** Repair Cafés/Werkstätten via `reparatur-initiativen.de`/OSM, Standortlogik.
7. **`entsorgung`:** konkrete Wertstoffhof-/Rücknahmewege.
8. **`produktsuche`:** Alternativgeräte vergleichbar machen.
9. **`beschaffung`:** Ersatzteile + Bestelloption (D8-Leitplanke transparent).

### Stufe 3 — Datengrundlage & Architektur
10. **`wissensbasis` + `recherche`:** kuratierte Fehlerzustand-Sammlung (D13/D5), `diagnose` darauf aufsetzen, „kuratiert zuerst → Fallback gekennzeichnet" (D2).
11. **Rollen-Architektur (D19):** OpenAI-Monolith in orchestrierte Einzelrollen zerlegen (`lotse` als Steuerung, je Rolle eigener Prompt/Endpoint).
12. **Restliche Edge-Cases:** Rückruf (D22), Datenlöschung (D23), Mehrfachdefekte (D24).
13. **Datenschutz/Schwungrad (D10):** Consent-Gate + Anonymisierung (eigenes Projekt).
14. **Mehrsprachigkeit (D17):** Englisch.
