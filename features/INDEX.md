# Feature-Index — Reparatur-App

> Tracking aller Feature-Specs. Quelle der Aufteilung: `docs/funktionsabgleich.md` (§1 Rollen,
> §2 Edge-Cases, §3 Architektur-Lücken, §5 priorisierte Roadmap), fachlich verankert in
> `docs/konzept.adoc` (Decision-Log) und `docs/runtime-roles/`.

**Next Available ID:** PROJ-28

**Status-Legende:** Planned · In Progress · In Review · Done

## Stufe 1 — fachliche Tiefe & ehrliche Pfade (P0)

| ID | Feature | Rolle | D-Anker | Status | Abhängigkeiten |
|---|---|---|---|---|---|
| PROJ-1 | Eigentum & Kostenträger erfragen | `aufnahme` | D14 | Done | — |
| PROJ-2 | Freitext-Antwort in der Triage | `aufnahme` | — | Done | — |
| PROJ-3 | Fähigkeits-Rückfrage „Traust du dir das zu?" | `lotse`/`begleitung` | D11 | Done | — |
| PROJ-4 | Unklar-Pfad (Diagnose-Sackgasse) | `diagnose` | D20 | Done | PROJ-9 (Protokoll-Export wünschenswert) |
| PROJ-5 | Reparatur-vs-Austausch-Vergleichstabelle | `abwaegung` | D12/D18 | Done | PROJ-6 |
| PROJ-6 | Förderung & Reparatur-Bonus-Hinweis | `abwaegung` | — | Done | — |
| PROJ-7 | Garantie-/Gewährleistungs-Gate | `begleitung` | D21 | Done | — |
| PROJ-8 | Selbsteinschätzung vor riskanter Schicht B | `begleitung` | D25 | Done | — |
| PROJ-9 | Serverseitige Vorgangs-Persistenz | `protokoll` | D7 | Done | — |
| PROJ-10 | Protokoll-Export & Teilen | `protokoll` | D7 | Done | PROJ-9 |

## Stufe 2 — Alternativpfade & Querschnittsdienste (P1)

| ID | Feature | Rolle | D-Anker | Status | Abhängigkeiten |
|---|---|---|---|---|---|
| PROJ-11 | Vermittlung von Reparatur-Anbietern | `vermittlung` | — | Done | — |
| PROJ-12 | Entsorgungs-/Recyclingwege | `entsorgung` | — | Done | — |
| PROJ-13 | Produktsuche / Alternativgeräte | `produktsuche` | — | Done | PROJ-5 |
| PROJ-14 | Beschaffung von Ersatzteilen | `beschaffung` | D8 | Done | — |
| PROJ-25 | Vertrauens-Indikator durchgängig | Querschnitt | D3 | Done | — |
| PROJ-26 | Universelle Triage-Fragen | `aufnahme` | D6 | Done | — |

## Stufe 3 — Datengrundlage & Architektur (P2)

| ID | Feature | Rolle | D-Anker | Status | Abhängigkeiten |
|---|---|---|---|---|---|
| PROJ-15 | Kuratierte Fehlerzustand-Sammlung | `wissensbasis` | D13/D5 | Planned | — |
| PROJ-16 | Recherche-Dienst (kuratiert→Fallback→online) | `recherche` | D2 | Planned | PROJ-15 |
| PROJ-17 | Diagnose auf kuratierter Sammlung | `diagnose` | D4 | Planned | PROJ-15, PROJ-16 |
| PROJ-18 | Rollen-/Agenten-Architektur | `lotse` | D19 | Planned | PROJ-9 |
| PROJ-19 | Rückruf / Sicherheitsmangel | Edge-Case | D22 | Planned | PROJ-15 |
| PROJ-20 | Datenlöschung vor Fremdabgabe | Edge-Case | D23 | Planned | PROJ-1, PROJ-10 |
| PROJ-21 | Mehrfachdefekte mit Gesamt-Fazit | `bewertung` | D24 | Planned | PROJ-9 |
| PROJ-22 | Consent-Gate (Einwilligung) | `lotse` | D10 | Planned | — |
| PROJ-23 | Anonymisierung & Daten-Schwungrad | `protokoll`/`wissensbasis` | D10/D7 | Planned | PROJ-9, PROJ-22 |
| PROJ-24 | Mehrsprachigkeit (Englisch) | Querschnitt | D17 | Planned | — |
| PROJ-27 | Multimodale Eingabe (Foto/Voice/Barcode) | `aufnahme` | D9 | Planned | — |

## Empfohlene Build-Reihenfolge

1. **PROJ-9** (Persistenz) zuerst — Fundament für Export, Tagebuch, Schwungrad, Mehrfachdefekte.
2. Restliche **Stufe 1** parallel (PROJ-1, 2, 3, 6→5, 7, 8, 10).
3. **Stufe 2** (PROJ-11–14, 25, 26) — Querschnittsdienste & Vertrauens-Indikator.
4. **Stufe 3** Datengrundlage zuerst: PROJ-15 → 16 → 17, dann Architektur PROJ-18,
   Edge-Cases (19, 20, 21), Datenschutz (22→23), zuletzt Mehrsprachigkeit (24) & Multimodalität (27).
