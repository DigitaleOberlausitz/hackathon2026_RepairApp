# PROJ-36: Nicht-sperrender Sicherheits-Backstop

## Status: Planned

**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31

## Abhängigkeiten

- PROJ-35 (Orchestrator-Schleife) — Einhängepunkt nach jedem Turn
- PROJ-33 (Karten-Decomposition) — erzeugt/prüft die angehängten `hinweis`-Karten
- Fachlicher Bezug: PROJ-25 (Vertrauens-Indikator, D3), PROJ-7/8 (Garantie/Selbsteinschätzung), PROJ-20 (Datenlöschung, D23), PROJ-1 (Eigentum, D14)

## Beschreibung

Da ChatGPT frei orchestriert und es **keine harten Schranken** gibt, sichert ein
server-seitiger Backstop nach dem Prinzip **„Erzwingen ≠ Sperren"** ab, dass die im
Konzept garantierten Hinweise tatsächlich **erscheinen** — ohne je einen Pfad zu
blockieren. Der Nutzer kann immer weitermachen; der Server hängt nur fehlende Warnungen an.
Das ersetzt die deterministische Schutzwirkung der alten (entfallenden) `accentPath=stop`-
Mechanik D15-konform.

## User Stories

- Als Nutzer möchte ich bei jeder KI-Antwort den Hinweis „die KI kann Fehler machen" sehen, auch bei reiner Text-Antwort, damit ich Aussagen richtig einordne (D3).
- Als sicherheitsbewusster Nutzer möchte ich bei einer als gefährlich eingestuften Reparatur garantiert einen deutlichen Sicherheitshinweis erhalten, auch wenn das Modell ihn vergisst — ohne dass mir der Weg versperrt wird (D1/D15).
- Als Nutzer eines datentragenden Geräts (Laptop/Smartphone/Tablet) möchte ich vor einer Fremdabgabe an einen Hinweis zu Backup/Datenlöschung erinnert werden (D23).
- Als Mieter (nicht Eigentümer) möchte ich an die Eigentums-/Kostenträger-Frage erinnert werden, bevor ich eingreife (D14).
- Als Produktverantwortlicher möchte ich, dass diese Garantien deterministisch (server-seitig) greifen und nicht vom Modell-Ermessen abhängen, damit sie zuverlässig sind.

## Akzeptanzkriterien

- [ ] An jede Assistenz-Antwort (auch reiner Text ohne Karte) wird ein Vertrauens-Indikator-Hinweis angehängt, der nicht vom Modell-Output abhängt (D3).
- [ ] Enthält ein Turn eine `ampel`-Karte mit `sicherheit = rot` ODER eine `schritte`-Karte mit einem `danger`-Schritt, und gab das Modell **keinen** Sicherheits-/Rückruf-Hinweis aus, hängt der Server automatisch eine `hinweis`-Karte (`art = sicherheit`, schwere `kritisch`) an.
- [ ] Hat das Modell bereits einen passenden Sicherheitshinweis ausgegeben, hängt der Server **keinen** zweiten an (kein Doppelhinweis).
- [ ] Nennt die `aufnahme`-Karte ein datentragendes Gerät, hängt der Server (falls fehlend) eine `hinweis`-Karte `art = datenloeschung` an (D23).
- [ ] Ist in der `aufnahme`-Karte `eigentum.ist_eigentuemer = false`, hängt der Server (falls fehlend) eine `hinweis`-Karte `art = eigentum` an (D14).
- [ ] Der Backstop **sperrt niemals** einen Pfad: keine DIY-Anleitung wird unterdrückt, keine Nutzer-Aktion blockiert — es werden ausschließlich Hinweise **hinzugefügt** (D15).
- [ ] Der Backstop greift sowohl beim normalen Turn-Ende als auch beim Abbruch durch das Iterations-Limit.
- [ ] Angehängte Hinweise werden im Vorgangs-Zustand persistiert (erscheinen nach Wiederaufruf erneut).

## Edge Cases

- **Modell warnt bereits korrekt** — Kein zusätzlicher Server-Hinweis (Deduplizierung anhand Hinweis-Art).
- **Mehrere Trigger gleichzeitig** (rot + datentragend + Mieter) — Jeder fehlende Hinweis wird genau einmal angehängt; keine Dubletten.
- **Gefahr ohne Ampel-Karte** (nur `danger`-Schritt) — Backstop erkennt auch den `danger`-Schritt als Auslöser.
- **Datentragendes Gerät, aber Reparatur bleibt beim Nutzer** (keine Fremdabgabe) — Der Datenlöschungs-Hinweis ist trotzdem zulässig (konservativ, nicht-sperrend) bzw. richtet sich nach der definierten Trigger-Regel; er versperrt nichts.
- **Kein einziger Trigger** (grüner, harmloser Fall) — Nur der unbedingte Vertrauens-Indikator-Footer erscheint, sonst keine Zusatzhinweise.

## Technische Anforderungen (optional)

- Backstop-Logik im Orchestrator (`_sicherheits_backstop(neue_karten, state)`), Footer im Frontend-Renderer (PROJ-37 / Spec §5, Task R3).
- Erzeugte Hinweise nutzen das `hinweis`-Karten-Schema aus PROJ-33.
- Strikt **nicht-sperrend** — Umsetzung von „warnen statt sperren" (D15) als „Erzwingen ≠ Sperren".
- Konzept-Anker: D1, D3, D14, D15, D16, D23 (`docs/konzept.adoc`, „Sicherheit & Haftung", Edge-Cases).
- Design-Referenz: Spec §5; Plan Task 5 (`_sicherheits_backstop`) + Task R3.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
