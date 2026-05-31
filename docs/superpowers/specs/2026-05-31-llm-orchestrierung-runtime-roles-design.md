# Design: LLM-orchestrierte Reparatur-App über `runtime-roles`

**Datum:** 2026-05-31
**Status:** Entwurf zur Review (3 Agenten + Nutzer)
**Konzept-Anker:** `docs/konzept.adoc` — insbesondere D19 (Rollen-Architektur), D1/D15
(warnen statt sperren), D3 (Vertrauens-Indikator), D7 (Protokoll als Vorgangs-Zustand),
D20–D25 (Edge-Cases).

## 1. Ziel & Abgrenzung

Die Web-App soll wie ein **lokales Claude Code** arbeiten: Ein LLM-**Orchestrator**
(`lotse`) steuert den Reparaturvorgang frei über **Function-Calling** und lädt die
spezialisierten Fach-Rollen **progressiv** nach. Das **gesamte fachliche Wissen lebt in
`docs/runtime-roles/*.md`** — nicht im Python-Code. Python liefert nur Daten, das
Schleifen-Gerüst und die Validierung.

**In Scope (erster Schritt):**
- Ausschließlich **OpenAI ChatGPT-API** (definiert den nutzbaren Funktionsumfang).
- Echte Orchestrierung über mehrere Turns mit Progressive Disclosure der Rollen.
- Hybrid-UI: Chat-Verlauf mit eingebetteten strukturierten Karten.
- Per-Rolle dekomponierte Karten-Schemata.

**Out of Scope (später, vgl. `konzept.adoc` Z. 927–932):**
- Automatische Modellauswahl zur Token-Ersparnis.
- Ollama-/Multi-Modell-Anbindung (kann später Einschränkungen bringen — jetzt irrelevant).
- Modell-Auswahl im UI, PDF-Export, Verlaufs-Archiv, Daten-Schwungrad/Wissensbasis-Aufbau.

> **Bewusster Bruch:** Dies ist ein **harter Schnitt**. Der bisherige Single-Shot
> `POST /api/diagnose` + `device`-Monolith-Schema wird durch den orchestrierten Chat-Flow
> **ersetzt**, nicht parallel weitergeführt.

## 2. Leitprinzipien aus dem Konzept (verbindlich)

| Prinzip | Konzept | Konsequenz fürs Design |
|---|---|---|
| **Warnen statt sperren** | D1, D15 | **Keine harten Flow-Schranken.** Der Orchestrator darf jede Rolle in jeder Reihenfolge laden. Sicherheit kommt als **eskalierender Hinweis** aus den Rollen-Inhalten, nicht als Code-Gate. |
| **Vertrauens-Indikator** | D3 | Jede KI-Aussage trägt Konfidenz + Begründung + „KI kann Fehler machen". Quer durch alle Karten-Schemata. |
| **Protokoll als Vorgangs-Zustand** | D7, D19 | Der laufende Vorgang (Verlauf, geladene Rollen, Karten, KI-Entscheidungsprotokoll) ist der gemeinsame Bus, persistiert über `store.py`. |
| **Zwei Schichten** | D6 | Triage (`aufnahme`) immer verfügbar; DIY-Tiefe (`begleitung`) inhaltlich gegated durch Ampel/Wissen — aber **nicht** technisch gesperrt. |
| **Ehrlicher unklar-Pfad** | D20 | Bei nicht eingrenzbarer Diagnose keine Scheinsicherheit; Protokoll bleibt nutzbar, Weiterleitung an Profi/Café. |
| **Edge-Cases** | D21–D25 | Garantie-Hinweis, Rückruf, Datenlöschung vor Fremdabgabe, Mehrfachdefekte, vulnerable Nutzer — als Inhalte/Hinweise in den Rollen-Specs verankert. |

## 3. Architektur-Komponenten

### 3.1 Rollen-Registry (`repair/roles.py`, neu)
- Beim App-Start: alle `docs/runtime-roles/*.md` einlesen, Frontmatter parsen
  (`name`, `description`, `class`).
- **Rollen-Katalog**: kompakte Liste `[{name, description, class}]` → stabiler Prompt-Präfix.
- **Volltext-Cache**: `.md`-Body im Speicher (in-process), Reload bei mtime-Änderung
  (`lru_cache` + mtime-Key). Keine Disk-I/O pro Anfrage.
- Pfad zu `runtime-roles/` ist **paket-relativ abgeleitet** (Layout, kein `.env`-Wert) —
  konsistent mit der bestehenden Ausnahme für `DB_PATH`/`MEDIA_DIR` (CLAUDE.md).

### 3.2 Tool-Layer (was ChatGPT angeboten bekommt)
Drei Tool-Sorten:

1. **`lade_rolle(name)`** → liefert den vollen `.md`-Body als Tool-Ergebnis in den Kontext.
   Progressive Disclosure (Claude-Code-Mechanismus). Nur Rollen aus dem Katalog
   (Whitelist).
2. **Daten-Tools** — dünne Wrapper um bestehende Dienste, liefern Fakten:
   - `finde_anbieter` → `anbieter.list_anbieter(kat, ort)`
   - `suche_ersatzteil` → `ersatzteile.list_ersatzteile(device, defekt)`
   - `finde_foerderung` → `foerderung.list_foerderungen()`
   - `finde_entsorgung` → `entsorgung.list_entsorgung(kat, ort)`
   - `recherche` → `recherche.recherche(frage, kontext, lang)` (kuratiert → online → KI-Fallback, mit Quelle/Konfidenz, D2/D3)
   - `lies_protokoll` / `schreibe_protokoll` → Vorgangs-Zustand lesen/ergänzen
3. **`zeige_karte(typ, daten)`** — **ein** Tool für alle strukturierten Ausgaben
   (bestätigte Entscheidung B). `typ` wählt das Schema; `daten` wird **server-seitig gegen
   das Schema dieses Typs validiert**. Ungültig → Reparatur-Retry (Fehler-Tool-Ergebnis ans
   Modell), nicht anzeigen.

### 3.3 Karten-Typen (Decomposition, Entscheidung i)
Jeder Typ hat ein kleines, eigenes JSON-Schema (`repair/cards.py`, neu):

| `typ` | Rolle (typ. Quelle) | Kern-Felder | Konzept |
|---|---|---|---|
| `aufnahme` | `aufnahme` | symptom, bedingungen, seit_wann, getestet, eigentum{ist_eigentuemer, kostentraeger} | D6, D14 |
| `diagnose` | `diagnose` | kandidaten[], abgrenzungsfragen[], unklar(bool), trust{level,quelle,konfidenz,hinweis} | D4, D20, D3 |
| `ampel` | `bewertung` | achsen{sicherheit,komplexitaet,kosten,machbarkeit}∈{gruen,gelb,rot}, gesamt, begruendung, trust | D1, D24 |
| `vergleich` | `abwaegung` | repair/pro/neu/entsorgung{geld,zeit,umwelt}, empfehlung, begruendung, geschaetzt | D12, D18 |
| `schritte` | `begleitung` | schritte[]{titel, anfaenger, profi, safety, danger, handoff}, garantie_hinweis?, misserfolg_pfad | D11, D15, D16, D21 |
| `hinweis` | jede | art∈{garantie,rueckruf,datenloeschung,sicherheit,eigentum}, text, schwere | D21, D22, D23 |
| `anbieter` | `vermittlung` | eintraege[]{name, art, ort, kontakt} | Datenquellen |
| `ersatzteil` | `beschaffung` | eintraege[], affiliate_hinweis | D8 |
| `erfolg` | `wirkung` | gespart_geld, gespart_co2, mutmach_satz | Drei Werthebel |

Querschnittsfeld **`trust`** (Vertrauens-Indikator, D3) ist in `diagnose`/`ampel`/
`vergleich`/**`schritte`** Pflicht (Schicht B ist der gefährlichste Output); der Hinweis
„KI kann Fehler machen" erscheint zusätzlich als unbedingter UI-Footer (§5) und skaliert
mit der Kritikalität. `schritte` trägt optional `bestaetigung_noetig` (D25).

### 3.4 Orchestrator-Schleife (`repair/orchestrator.py`, neu)
- Nimmt `vorgang_id` + Nutzer-Nachricht.
- Baut Messages (siehe §4), ruft `client.chat.completions.create(..., tools=[...])`.
- **Tool-Call-Schleife:** Modell ruft Tools → Server führt aus → Ergebnis zurück →
  bis das Modell eine Text-Antwort ohne weitere Tool-Calls liefert oder das
  Iterations-Limit greift.
- Sammelt während des Turns: Text-Deltas, `zeige_karte`-Events, geladene Rollen,
  KI-Entscheidungsprotokoll-Einträge.
- Persistiert den aktualisierten Vorgang via `store.save_vorgang`.

### 3.5 Vorgangs-Zustand (`store.py`, vorhanden — wird erweitert)
- `create_vorgang` / `get_vorgang` / `save_vorgang` existieren bereits.
- `state` (JSON) hält künftig: `messages[]` (Chat-Historie inkl. Tool-Calls/-Ergebnisse),
  `geladene_rollen[]`, `karten[]`, `entscheidungsprotokoll[]` (welche Rolle, welche
  Quelle/Konfidenz, warum — D7), `eigentum`/`kostentraeger` (D14).

## 4. Prompt-Aufbau & Caching

OpenAI **automatisches Prefix-Caching** (>1024 Tokens, 50–90 % günstiger, TTL ~5–10 min):
der statische Teil muss **am Anfang** stehen und über Aufrufe **byte-identisch** sein.

```
[system 1]  Orchestrierungs-Grundhaltung (lotse-Essenz) + Leitlinien:
            warnen statt sperren, Vertrauens-Indikator, ehrlicher Ton,
            Hinweis-Pflichten (Garantie/Rückruf/Datenlöschung)        ← STATISCH
[system 2]  Rollen-Katalog: Name+Description+Klasse aller 14 Rollen     ← STATISCH
[system 3]  Werkzeug-Nutzungshinweis (lade_rolle/Daten-Tools/zeige_karte) ← STATISCH
──────────────────────────────────────────────────────────────── Cache-Grenze
[messages]  dynamisch: Verlauf + via lade_rolle() geladene .md-Bodies
            + Tool-Ergebnisse + aktuelle Nutzer-Nachricht
```

Die `lotse`-Essenz in `[system 1]` ist eine **kompakte, stabile Ableitung** aus
`runtime-roles/lotse.md` (nicht der Volltext — sonst Cache-Drift bei jeder Spec-Änderung;
Volltext lädt das Modell bei Bedarf via `lade_rolle("lotse")`).

## 5. Leitplanken — technische Netze + nicht-sperrender Sicherheits-Backstop

Bewusst **keine** erzwungene Reihenfolge, **kein** Sperren von `begleitung`, **kein**
Geräte-Hard-Stop (D15). Technische Hygiene:
- **Iterations-Limit pro Turn** (`MAX_TOOL_ITERATIONS`, `.env`, Default 12) — gegen
  Endlosschleifen/Kostenausreißer. Bei Erreichen: sauberer Abschluss mit Hinweis.
- **Schema-Validierung** jeder Karte (Rendering-Korrektheit).
- **Tool-/Rollen-Whitelist** (nur bekannte Namen ladbar).
- **Timeout** je API-Call (`config.llm_timeout()`).

### Nicht-sperrender Sicherheits-Backstop (Erzwingen ≠ Sperren)
„Warnen statt sperren" (D15) verbietet das **Blockieren**, nicht das garantierte
**Erscheinen** eines Hinweises. Der Server **hängt Hinweise an** (blockiert nie einen
Pfad) — ersetzt damit die gestrichene deterministische `accentPath=stop`-Mechanik des
alten `ai.py` D15-konform:
- **Vertrauens-Indikator (D3):** „KI kann Fehler machen" als **unbedingter UI-Footer** an
  jeder Antwort — auch reinem Text ohne Karte (nicht modellabhängig).
- **Gefahr-Backstop (A2):** `ampel.sicherheit=rot` oder `schritte`-Schritt mit
  `danger:true` ohne Sicherheits-/Rückruf-Hinweis → Server hängt einen `hinweis`
  (`art=sicherheit`) an. DIY-Pfad bleibt offen.
- **Daten/Eigentum-Trigger:** datentragendes Gerät → `hinweis art=datenloeschung` (D23);
  `eigentum.ist_eigentuemer=false` → `hinweis art=eigentum` (D14).

Darüber hinaus entstehen Warnungen **inhaltlich** über die Rollen-Specs (in denen D20–D25
operationalisiert werden) + `[system 1]`-Leitlinien.

## 6. API & Frontend

### 6.1 Backend (`app.py`)
- **Neu:** `POST /api/chat` → `{vorgang_id, text}` → `{antwort_text, karten[], vorgang_id}`.
  (Streaming optional als spätere Iteration; erst turn-basiert für Zuverlässigkeit.)
- **Neu:** `POST /api/vorgang` → legt Vorgang an, gibt `vorgang_id`.
- **Entfällt:** `POST /api/diagnose` (harter Schnitt). Die kuratierten Stufe-2/3-Endpunkte
  werden zu internen Daten-Tools; eigenständige Routen können bleiben oder entfallen
  (im Plan zu entscheiden).
- Fehlerobjekte wie gehabt: `{error, code}` mit passenden HTTP-Status (`no_backend` 503 etc.).
- Ohne OpenAI-Backend: sauberer `no_backend`-Fehler (kein Crash) — bestehende Vertrag bleibt.

### 6.2 Frontend (`static/js/`)
- `screens.js` wird zum **Chat-Renderer**: Nutzer-/Assistenz-Bubbles + eingebettete Karten.
- `ui.js`: bestehende Karten-Komponenten (Ampel, Vergleich, Schritte …) werden zu
  einbettbaren Bausteinen, die der Renderer pro `karten[]`-Event mountet.
- `app.js`: Statemachine wird zur **Konversations-Statemachine** (Vorgang anlegen,
  Nachrichten senden, Antwort+Karten rendern, Theme-Switcher bleibt).
- `SPEC.md` und der `device`-Vertrag werden auf die neuen Karten-Schemata umgestellt.

## 7. Konfiguration (`.env` / `repair/config.py`)
Neue Werte (mit Default, in `.env.example` dokumentiert, Drift-Guard beachten):
- `MAX_TOOL_ITERATIONS` (Default 12)
- ggf. `ORCHESTRATOR_MODEL` (sonst bestehendes `OPENAI_MODEL`)
Bestehende Werte (`OPENAI_API_KEY`, `OPENAI_MODEL`, `LLM_TIMEOUT`, `SEARXNG_URL`, …) bleiben.

## 8. OpenAI-Features (geprüft, Stand Mai 2026)
- **Function-Calling / Tools** für `lade_rolle`, Daten-Tools, `zeige_karte`.
- **Structured Outputs (JSON-Schema)** für `zeige_karte`-Argumente (strikte Validierung).
- **Automatisches Prompt-Caching** für den stabilen Präfix.
- Bewusst **Chat Completions + Tools** (nicht die Responses-API) — stabil, breit
  erprobt und ausreichend für die Orchestrierung.

## 9. Risiken & Entscheidungen (nach 3-Agenten-Review)
- **Sicherheits-Hinweise ohne Hard-Stop → GELÖST:** Nicht-sperrender Backstop (§5) +
  Operationalisierung von D20–D25 in den Rollen-Specs (Plan Task R1). „Erzwingen ≠
  Sperren": Hinweise erscheinen garantiert, kein Pfad wird blockiert (D15-konform).
- **D17 (DE/EN) → GELÖST:** Sprachwahl im Vorgangs-Zustand, je Sprache ein stabiler,
  separat cachebarer Präfix (Plan Task R2).
- **Vertrauens-Indikator bei Nur-Text (D3) → GELÖST:** unbedingter UI-Footer (Task R3).
- **Token-/Kosten-Budget (OFFEN, akzeptiert):** Progressive Disclosure hält den Präfix
  klein; lange Vorgänge wachsen. Kontext-Kürzung/Zusammenfassung ist eine spätere
  Iteration. Token-Usage wird ab sofort protokolliert (PROJ-28, Task R4).
- **Nicht-Determinismus / Eval (OFFEN, bewusst verschoben):** Die 4 Beispiel-Protokolle
  als Eval-Suite mit echtem Backend sind **bewusst auf später** vertagt (siehe §10).
  Bis dahin sichern Backstop + Footer die Mindest-Garantien deterministisch ab.
- **`unklar`-Pfad (D20) / Mehrfachdefekte (D24):** in den Karten-Schemata abbildbar
  (`diagnose.unklar`, mehrere `ampel`-Karten mit `daten.defekt` + Gesamt-Fazit).

## 10. Nicht-Ziele dieser Iteration
Daten-Schwungrad/Anonymisierung (D10), Modellauswahl/-Routing, PDF-Export, Verlaufs-Archiv,
Voice/Foto-Multimodalität über das Bestehende hinaus, **Eval-Suite aus den 4
Beispiel-Protokollen** (bewusst später, siehe §9), Kontext-Kürzung für lange Vorgänge.
Teilabdeckung D7: Vorgangs-Zustand wird persistiert, aber Export & Tagebuch-Wiedererkennung
sind noch nicht im Scope.
