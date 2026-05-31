# PROJ-23: Anonymisierung & Daten-Schwungrad

## Status: Done

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- PROJ-9 (Vorgangs-Persistenz) — gespeicherte Vorgänge sind die Quelle des Schwungrads
- PROJ-22 (Consent-Gate) — nur eingewilligte Daten fließen ins Schwungrad

## User Stories

- Als Betreiber der App möchte ich, dass aus eingewilligten, gespeicherten Vorgängen anonymisierte Erkenntnisse zurück in die Wissensbasis (PROJ-15) fließen (Daten-Schwungrad), damit die App durch Nutzung schlauer wird und das Kaltstart-Problem der Datengrundlage gelöst wird (D7).
- Als Nutzer möchte ich sicher sein, dass mein Vorgang **nur dann** ins Schwungrad einfließt, wenn ich eingewilligt habe — und sonst gar nicht —, damit ich die Kontrolle über die Weiterverwendung meiner Daten behalte (D10).
- Als datenschutzbewusster Nutzer möchte ich, dass Freitext und Fotos vor jeder Weiterverwendung anonymisiert werden (personenbezogene/identifizierende Inhalte entfernt), damit aus meinem Beitrag keine Rückschlüsse auf mich oder Dritte möglich sind (D10).
- Als Back-Office-Pfleger (Rolle `wissensbasis`) möchte ich anonymisierte Schwungrad-Beiträge als **Entwürfe** vorgelegt bekommen, die erst nach menschlicher Prüfung in die kuratierte Sammlung aufgenommen werden, damit die Sicherheits- und Qualitätskontrolle menschlich kontrolliert bleibt (D5, PROJ-15).
- Als Produktverantwortlicher möchte ich vor dem Commitment auf das Schwungrad als tragende Säule ein **Grob-Gate** durchlaufen, das praktikabel klärt, ob Einwilligung und Foto-/Freitext-Anonymisierung tragfähig sind, damit kein Klumpenrisiko fürs Kern-Feature entsteht (D7-Gate, Ausgelagerte Themen).

## Akzeptanzkriterien

- [ ] Ein gespeicherter Vorgang (PROJ-9) wird **nur** dann für das Schwungrad herangezogen, wenn für ihn eine gültige Einwilligung (PROJ-22) vorliegt; ohne Einwilligung fließt der Vorgang nicht ein.
- [ ] Vor der Weiterverwendung wird der Freitext eines Vorgangs anonymisiert: identifizierende Angaben (z. B. Namen, Adressen, Kontaktdaten, Seriennummern) werden entfernt oder maskiert.
- [ ] Vor der Weiterverwendung werden Fotos anonymisiert bzw. auf nicht-anonymisierbaren Inhalt geprüft (z. B. Hintergrund, Personen, Seriennummern); fachlich nicht anonymisierbare Inhalte werden nicht weitergegeben.
- [ ] Der Schwungrad-Beitrag enthält ausschließlich anonymisierte, fachlich relevante Erkenntnisse (z. B. „Symptom X bei Gerät Y war Ursache Z") — keine Roh-Vorgangsdaten und keine direkt identifizierenden Daten.
- [ ] Anonymisierte Beiträge werden der `wissensbasis` als **Entwurf** vorgelegt und gelangen erst nach menschlicher Prüfung in die kuratierte Sammlung (PROJ-15, D5); sie werden nicht automatisch als kuratiert ausgespielt.
- [ ] Kann ein Inhalt (Freitext oder Foto) nicht hinreichend anonymisiert werden, wird genau dieser Inhalt vom Schwungrad-Beitrag ausgeschlossen, ohne den restlichen Beitrag oder den Vorgang zu blockieren.
- [ ] Ein widerrufenes oder fehlendes Consent führt dazu, dass kein Schwungrad-Beitrag aus dem betroffenen Vorgang erzeugt wird; ein bereits erzeugter, noch ungeprüfter Beitrag wird nicht in die kuratierte Sammlung übernommen.
- [ ] Es existiert ein dokumentiertes **Grob-Gate-Ergebnis**, das festhält, ob Einwilligung und Foto-/Freitext-Anonymisierung praktikabel sind — als Voraussetzung dafür, das Schwungrad als tragende Säule zu fixieren.
- [ ] Scheitert das Grob-Gate, funktioniert die App weiter ohne diese Datennutzung (Triage + kuratierte Datengrundlage bleiben unabhängig nutzbar); das Schwungrad wird dann nicht als tragende Säule angenommen.
- [ ] Die Anonymisierung verändert ausschließlich den Schwungrad-Beitrag; der originale gespeicherte Vorgang (PROJ-9) bleibt für den Nutzer unverändert erhalten.

## Edge Cases

- **Frage:** Was passiert mit einem Vorgang ohne Einwilligung? **Antwort:** Er fließt nicht ins Schwungrad ein — es wird kein Beitrag erzeugt; der Vorgang bleibt rein lokal/persistiert nutzbar (D10, PROJ-22).
- **Frage:** Was geschieht, wenn ein Foto nicht zuverlässig anonymisiert werden kann (z. B. erkennbare Person im Hintergrund)? **Antwort:** Dieses Foto wird vom Beitrag ausgeschlossen; der übrige anonymisierte Beitrag kann trotzdem entstehen, und der Vorgang selbst bleibt unberührt.
- **Frage:** Wer entscheidet, ob ein anonymisierter Beitrag in die kuratierte Sammlung aufgenommen wird? **Antwort:** Die menschliche Prüfung in der `wissensbasis` (D5, PROJ-15) — der Beitrag bleibt bis dahin Entwurf und gilt nicht als kuratiert.
- **Frage:** Was, wenn das Grob-Gate ergibt, dass Anonymisierung oder Einwilligung nicht praktikabel sind? **Antwort:** Das Schwungrad wird nicht als tragende Säule fixiert (Klumpenrisiko vermieden); die App läuft ohne diese Datennutzung weiter.
- **Frage:** Was, wenn ein Nutzer seine Einwilligung erst nach Erzeugung eines noch ungeprüften Beitrags widerruft? **Antwort:** Der ungeprüfte Beitrag wird nicht in die kuratierte Sammlung übernommen und entfällt für die Weiterverwendung.

## Technische Anforderungen

- Dieses Feature umfasst das **fachliche Schwungrad-Verhalten** (eingewilligte Vorgänge → anonymisierter Beitrag → menschlich geprüfte Aufnahme in PROJ-15) und ein **praktikables Anonymisierungs-Grob-Gate**. Die **vollständige rechtliche Datenschutz-Umsetzung** (konkrete Rechtsgrundlage, vollständiger Einwilligungs-Flow, abschließende Anonymisierungs-Garantien) ist laut Konzept ein **eigenes Projekt** (Ausgelagerte Themen, D10) und nicht Teil von PROJ-23.
- Das Einholen der Einwilligung selbst ist Sache von PROJ-22 (Consent-Gate); das anonymisierte Bereitstellen ist Sache der Rolle `protokoll`; die kuratierte Aufnahme/Review ist Sache der Rolle `wissensbasis` (PROJ-15). PROJ-23 ist strikt auf das Schwungrad-Verhalten und das Anonymisierungs-Grob-Gate begrenzt.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
