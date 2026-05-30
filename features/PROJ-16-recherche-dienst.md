# PROJ-16: Recherche-Dienst — kuratiert zuerst, KI-Fallback gekennzeichnet, online

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- PROJ-15 (Kuratierte Fehlerzustand-Sammlung) — liefert die kuratierte Quelle, die zuerst abgefragt wird

## User Stories

- Als `diagnose`-Rolle möchte ich zu einem Symptom belegtes Wissen anfordern, damit ich meine Ursachen-Einschätzung auf eine nachvollziehbare Grundlage statt auf freie KI-Erfindung stütze.
- Als `bewertung`- und `abwaegung`-Rolle möchte ich zu jeder Aussage Quelle und Konfidenz mitgeliefert bekommen, damit der Vertrauens-Indikator (D3) korrekt gespeist wird.
- Als Endnutzer möchte ich erkennen, ob eine Information aus einer kuratierten Quelle stammt oder aus freier KI-Eigenrecherche, damit ich weiß, wie sehr ich ihr vertrauen kann.
- Als Produktverantwortlicher möchte ich, dass kuratierte Quellen immer zuerst gefragt werden und KI-Eigenrecherche nur als deutlich gekennzeichneter Fallback erscheint, damit das Prinzip „kuratiert zuerst" (D2) eingehalten wird.
- Als Endnutzer möchte ich bei einer reinen KI-Fallback-Antwort eine niedrigere Konfidenz und einen klaren Hinweis sehen, damit ich nicht ungeprüftes Wissen für gesichert halte.

## Akzeptanzkriterien

- [ ] Der Dienst nimmt eine konkrete Wissensfrage mit Kontext entgegen und gibt eine Antwort zurück, die immer eine Herkunft (`kuratiert` oder `ki-fallback`) und eine Konfidenz enthält.
- [ ] Liegt eine kuratierte Quelle (PROJ-15 oder externe kuratierte Quelle) vor, wird diese zuerst genutzt; die Antwort wird zusammengefasst und mit Quellenangabe belegt.
- [ ] Liefert die kuratierte Quelle nichts, wechselt der Dienst sauber zur KI-Eigenrecherche und kennzeichnet das Ergebnis deutlich als Fallback.
- [ ] Eine KI-Fallback-Antwort trägt erkennbar niedrigere Konfidenz als eine kuratierte Antwort und enthält den Hinweis, dass es sich um ungeprüfte KI-Eigenrecherche handelt.
- [ ] Die eigene, menschlich geprüfte Datengrundlage (PROJ-15) wird als `kuratiert` behandelt, nicht als Fallback.
- [ ] Quellen- und Konfidenzangabe sind bei jeder Antwort vorhanden und dürfen nie fehlen oder leer sein (Grundlage für D3, vgl. PROJ-25).
- [ ] Optionale Online-Recherche ist als Teil des Fallback-Pfads vorgesehen und liefert ihre Treffer mit Quellen-Referenz zurück.
- [ ] Bei mehreren widersprüchlichen Online-Treffern wird der Widerspruch in der Antwort sichtbar gemacht und die Konfidenz entsprechend abgesenkt, statt eine Variante stillschweigend zu bevorzugen.
- [ ] Der Dienst trifft selbst keine Diagnose, Bewertung oder Pfad-Empfehlung — er liefert ausschließlich belegtes Material an die aufrufenden Rollen `diagnose`, `bewertung` und `abwaegung`.
- [ ] Die Reihenfolge kuratiert → Fallback → online ist deterministisch: Online-Recherche wird erst betreten, wenn keine kuratierte Quelle greift.

## Edge Cases

- **Kuratierte Quelle liefert keinen Treffer:** Wie verhält sich der Dienst? — Er bricht nicht ab, sondern geht sauber in den gekennzeichneten KI-Fallback (ggf. mit Online-Recherche) über; die Herkunft der Antwort ist dann `ki-fallback`.
- **Widersprüchliche Online-Quellen:** Welche Aussage gilt? — Keine wird stillschweigend bevorzugt; der Widerspruch wird benannt und die Konfidenz abgesenkt, damit die aufrufende Rolle den Konflikt sieht.
- **Online-Recherche nicht verfügbar (offline / keine Treffer):** Was passiert? — Der Dienst antwortet trotzdem mit dem bestmöglichen KI-Fallback-Material, kennzeichnet die fehlende Online-Bestätigung und setzt die Konfidenz niedrig; Quelle/Konfidenz bleiben gesetzt.
- **Kuratierte und Online-Information weichen voneinander ab:** Was zählt? — Die kuratierte Quelle bleibt führend (D2); ein abweichender Online-Befund wird höchstens als Zusatzhinweis geführt, ohne die kuratierte Herkunft zu überschreiben.
- **Aufrufende Rolle erwartet Konfidenz/Quelle, der Dienst hätte keine zu liefern:** Darf das Feld leer bleiben? — Nein; eine Antwort ohne Quelle und Konfidenz ist unzulässig — im Zweifel wird die niedrigste Konfidenzstufe mit Herkunftshinweis gesetzt (vgl. D3, PROJ-25).

## Technische Anforderungen (optional)

- Querschnittsdienst hinter den Rollen `diagnose`, `bewertung`, `abwaegung` (und mittelbar `begleitung`); kein eigener Journey-Schritt.
- Liest die kuratierte Sammlung aus PROJ-15 (gepflegt von `wissensbasis`); pflegt selbst keine Daten.
- Jede Antwort transportiert mindestens: zusammengefasste Aussage, Herkunft (`kuratiert` / `ki-fallback`), Quellen-Referenz und Konfidenzstufe — als Speise für den Vertrauens-Indikator (D3, PROJ-25 nur referenziert).
- Konzept-Anker: D2 (Wissensquelle: kuratiert zuerst, gekennzeichneter Fallback), D3 (Vertrauens-Indikator), Abschnitt „Wissensquelle: kuratierte Quellen mit Fallback".

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
