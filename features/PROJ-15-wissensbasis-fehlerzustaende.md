# PROJ-15: Kuratierte Fehlerzustand-Sammlung & Experten-Review

## Status: Done

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Back-Office-Pfleger (Rolle `wissensbasis`) möchte ich eine pflegbare Sammlung von Fehlerzuständen je Gerät/Defekt führen — mit Symptom, wahrscheinlicher Ursache, Abgrenzungs-Rückfragen, benötigten Teilen/Werkzeug und Quelle —, damit `diagnose` und `recherche` auf eine eigene, belastbare Datengrundlage zugreifen können statt auf zwei hartcodierte Seed-Geräte.
- Als Back-Office-Pfleger möchte ich Fehlerzustände **KI-gestützt entwerfen** und anschließend menschlich freigeben lassen (D5), damit die Sammlung schnell wächst, aber nichts Ungeprüftes als kuratiert ausgespielt wird.
- Als sicherheitsverantwortlicher Experte möchte ich die **Sicherheits- und Ampel-Einstufung jedes Fehlerzustands selbst kontrollieren und bestätigen** (D5), damit gefährliche Defekte (Hochspannung/Gas/Strom) niemals allein durch die KI als harmlos eingestuft werden.
- Als Konsument der Sammlung (`recherche`/`diagnose`) möchte ich pro Eintrag dessen **Status (Entwurf/geprüft) und Herkunft (kuratiert vs. KI-ermittelt)** sowie einen **Stand/Versionsvermerk** sehen, damit ich nur Freigegebenes als kuratiert behandle und den Vertrauens-Indikator korrekt setzen kann.
- Als Back-Office-Pfleger möchte ich die Sammlung zum Start **ohne externe Datenquellen und ohne regionale Einschränkung** als eigene Datengrundlage aufbauen (D13), damit das MVP unabhängig von Lizenz-/Importfragen lauffähig ist.

## Akzeptanzkriterien

- [ ] Die Fehlerzustand-Sammlung enthält pro Eintrag mindestens: Gerätekategorie (ggf. Modell), Symptom(e), wahrscheinliche Ursache/Defekt, Abgrenzungs-Rückfragen, Sicherheits-Stufe (Ampel), Komplexitäts-Stufe (Ampel), benötigte Teile/Werkzeug und Quelle/Herkunft.
- [ ] Jeder Eintrag trägt einen Freigabe-Status, der mindestens zwischen „Entwurf (KI, ungeprüft)" und „geprüft/freigegeben" unterscheidet.
- [ ] Nur als „geprüft/freigegeben" markierte Einträge werden als **kuratiert** an `diagnose`/`recherche` ausgespielt; Entwürfe werden nicht als kuratiert ausgeliefert.
- [ ] Ein Fehlerzustand kann KI-gestützt als Entwurf erzeugt werden und bleibt bis zur menschlichen Freigabe im Entwurfs-Status.
- [ ] Die Freigabe eines Eintrags erfordert eine **menschliche Bestätigung der Sicherheits-Einstufung**; ohne diese Bestätigung ist keine Freigabe möglich (D5).
- [ ] Die Sicherheits-Einstufung kann durch den menschlichen Review gegenüber dem KI-Vorschlag geändert werden, und die menschlich bestätigte Stufe ist die maßgebliche.
- [ ] Jeder Eintrag führt einen Stand-/Versionsvermerk (z. B. „zuletzt geprüft am / Version"), der bei jeder inhaltlichen Änderung aktualisiert wird.
- [ ] Jeder Eintrag weist seine Herkunft aus (kuratiert vs. KI-ermittelt), sodass nachgelagerte Rollen den Vertrauens-Indikator korrekt setzen können (D2/D3).
- [ ] Die Sammlung enthält zum Start ausschließlich eine eigene Datengrundlage ohne externe Importe und ohne regionale Einschränkung (D13).
- [ ] Die zwei bisherigen Seed-Geräte (Toaster, Mikrowelle) lassen sich als geprüfte Einträge der Sammlung abbilden, sodass der bestehende Durchstich weiter funktioniert.
- [ ] Bestehende Einträge können bearbeitet, neu geprüft und (bei Bedarf) zurückgezogen werden, ohne dass dabei der Freigabe-Status stillschweigend erhalten bleibt.

## Edge Cases

- **Frage:** Was passiert mit einem KI-Entwurf, der noch nicht menschlich geprüft wurde, wenn `diagnose` ihn anfragt? **Antwort:** Er wird nicht als kuratiert ausgespielt; nachgelagerte Rollen behandeln ihn als gekennzeichneten KI-Fallback mit niedriger Konfidenz (D2), nicht als geprüfte Grundlage.
- **Frage:** Was passiert, wenn die KI einen gefährlichen Defekt als „grün/harmlos" vorschlägt? **Antwort:** Die Sicherheits-Einstufung ist erst nach menschlicher Bestätigung wirksam; der Review kann sie hochstufen, und ohne menschliche Sicherheits-Bestätigung erfolgt keine Freigabe (D5).
- **Frage:** Was geschieht, wenn ein bereits freigegebener Eintrag inhaltlich geändert wird? **Antwort:** Der Stand-/Versionsvermerk wird aktualisiert und der Eintrag erfordert eine erneute menschliche (Sicherheits-)Freigabe, bevor die Änderung wieder als kuratiert gilt.
- **Frage:** Was passiert, wenn für ein angefragtes Gerät/Symptom gar kein Eintrag in der Sammlung existiert? **Antwort:** Die `wissensbasis` liefert keinen kuratierten Treffer; die nachgelagerte Logik fällt sauber auf den gekennzeichneten KI-Fallback zurück (das ist kein Fehler der Sammlung).
- **Frage:** Woher kommen Schwungrad-Beiträge aus anonymisierten Protokollen, und gehören sie in dieses Feature? **Antwort:** Nein — die Einarbeitung anonymisierter Beiträge (Daten-Schwungrad) ist als getrenntes Feature PROJ-23 geführt; PROJ-15 stellt nur die kuratierte Sammlung und den Review-Workflow bereit, in die solche Beiträge später einfließen.

## Technische Anforderungen

- Die Sammlung ist eine **eigene, pflegbare Datengrundlage** (kein externer Import zum Start, D13); das Inhaltsmodell folgt dem konzeptionellen Fehlerzustand-Modell aus `docs/konzept.adoc` (Abschnitt „Inhaltsmodell eines Fehlerzustands").
- Der Freigabe-/Review-Zustand (Entwurf vs. geprüft, menschlich bestätigte Sicherheits-Stufe, Stand/Version, Herkunft) ist je Eintrag fachlich abbildbar, damit `diagnose`/`recherche` „kuratiert vs. Fallback" korrekt unterscheiden können.
- Förder- und Quellenlisten-Pflege sowie das Daten-Schwungrad sind **nicht** Teil dieses Features (Förderlisten siehe PROJ-6, Schwungrad siehe PROJ-23); PROJ-15 ist strikt auf die kuratierte Fehlerzustand-Sammlung und ihren Experten-Review begrenzt.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
