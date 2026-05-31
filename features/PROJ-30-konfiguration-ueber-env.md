# PROJ-30: Konfiguration ausschließlich über `.env`

## Status: In Progress
**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31

## Kontext
Die Web-App (`webapp/`) lädt ihre Konfiguration heute über `python-dotenv`
(`load_dotenv()` in `app.py:76`) und liest Einzelwerte verstreut per
`os.environ.get(...)`. Das Muster ist etabliert, aber **nicht durchgängig** umgesetzt:
Mehrere betriebs- bzw. verhaltensrelevante Werte stehen **hart im Code**, und in
`.env.example` stehen Variablen, die **nirgends** ausgelesen werden (Drift).

**Bereits korrekt über `.env` gesteuert** (Soll-Muster):
`OLLAMA_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OLLAMA_MODEL`, `DIAGNOSE_MODEL`,
`LLM_TIMEOUT`, `SEARXNG_URL`, `FLASK_DEBUG`.

**Abweichungen, die dieses Feature behebt (Ist-Stand aus Code-Analyse):**
- `app.py:753` — Host/Port hart kodiert: `app.run(host="127.0.0.1", port=5000, …)`.
- `repair/multimodal.py:168` — Whisper-Modell `"whisper-1"` hart kodiert.
- `repair/multimodal.py:22` — Upload-Limit `MAX_BYTES = 10 * 1024 * 1024` hart kodiert.
- `webapp/.env.example` — `VISION_MODEL` und `EMBED_MODEL` sind dokumentiert, werden im
  Code aber **nie** gelesen (Drift in Gegenrichtung).

**Bewusste Ausnahme (kein `.env` nötig, per Entscheidung):** paket-relativ aus dem
Dateilayout abgeleitete Pfade — `DB_PATH` (`store.py:26`, `wissensbasis.py:37`) und
`MEDIA_DIR` (`multimodal.py:20`). Das ist Code-Layout, keine Deployment-Konfiguration,
und bleibt unverändert.

Dieses Feature macht **`.env` zur einzigen Quelle** veränderlicher Konfiguration,
schließt die hart kodierten Lücken, beseitigt den Drift und sichert das Ergebnis mit
einem automatischen Guard gegen Rückfall ab.

## Abhängigkeiten
- Keine harte Abhängigkeit. **Bezug** zu [PROJ-29 Zentrales Logging](PROJ-29-logging.md):
  führt `LOG_LEVEL` via `.env` ein — derselbe Mechanismus; beide müssen kompatibel bleiben.

## User Stories
- Als **Betreiber** möchte ich **jede** veränderliche Einstellung an **einer Stelle**
  (`webapp/.env`) setzen können, damit ich Verhalten und Deployment ändern kann, **ohne
  den Quellcode anzufassen**.
- Als **Betreiber** möchte ich Host und Port der App über `.env` setzen, damit ich die App
  z. B. im Container an `0.0.0.0` binden kann, ohne `app.py` zu editieren.
- Als **Entwickler** möchte ich, dass `webapp/.env.example` **exakt** die Variablen
  auflistet, die der Code auch ausliest, damit die Dokumentation nie lügt (kein Drift).
- Als **Entwickler** möchte ich, dass ein **automatischer Check** anschlägt, sobald jemand
  neue Konfiguration hart im Code ablegt oder eine Variable undokumentiert lässt, damit die
  Regel dauerhaft eingehalten wird.
- Als **Betreiber** möchte ich, dass die App bei einem **syntaktisch ungültigen** Wert
  (z. B. `PORT=abc`) mit einer **klaren Meldung** abbricht, statt mit kryptischem Fehler
  oder falschem Defaultverhalten weiterzulaufen.
- Als **Erstnutzer der App** (ohne `.env`) möchte ich, dass die App mit sinnvollen Defaults
  trotzdem startet, damit ich sie ohne Konfigurationsaufwand ausprobieren kann.

## Akzeptanzkriterien

### Einzige Konfigurationsquelle
- [ ] **Alle** zur Laufzeit/Deployment veränderlichen Werte werden ausschließlich über
      Umgebungsvariablen gelesen, geladen aus `webapp/.env` via `python-dotenv`
      (`load_dotenv()` bleibt die einzige Lade-Stelle).
- [ ] Es gibt **keine** weitere Konfigurationsquelle (keine zusätzliche `config.py` mit
      veränderlichen Werten, keine `.ini`/`.yaml`/`.json`-Config, keine CLI-Flags als
      Ersatz, keine im Code eingebetteten Endpunkte/Keys/Modelle/Limits).
- [ ] Jeder gelesene Wert hat einen **sinnvollen Default**, sodass die App **ohne** `.env`
      startet (konsistent zum bestehenden „läuft auch ohne API-Key"-Verhalten, PRD-Constraint).

### Hart kodierte Werte migrieren
- [ ] **Host/Port** (`app.py:753`) werden aus `.env` gelesen (z. B. `HOST`, `PORT`),
      Defaults `127.0.0.1` / `5000` — der heutige Wert bleibt das Standardverhalten.
- [ ] **Whisper-Modell** (`multimodal.py:168`) wird aus `.env` gelesen (z. B. `WHISPER_MODEL`),
      Default `whisper-1`.
- [ ] **Upload-Limit** (`multimodal.py:22`, `MAX_BYTES`) wird aus `.env` gelesen
      (z. B. `MAX_UPLOAD_BYTES`), Default `10485760` (10 MB).
- [ ] Nach der Migration enthält der Code **keine** verbliebenen hart kodierten
      Endpunkte, API-Keys, Modellnamen, Timeouts, Limits oder Bind-Adressen.

### Drift beseitigen (`.env.example` ↔ Code)
- [ ] `webapp/.env.example` listet **genau** die Variablen, die der Code tatsächlich
      ausliest — inklusive der neu migrierten und mit Default-Hinweis.
- [ ] `VISION_MODEL` und `EMBED_MODEL` werden entweder **angebunden** (vom Code gelesen)
      oder aus `.env.example` **entfernt**; rein dekorative, ungelesene Einträge sind nicht
      erlaubt. (Geplante, aber noch nicht aktive Variablen dürfen nur als **auskommentierter**
      Block mit „noch nicht aktiv"-Hinweis stehen.)

### Robustheit beim Start (Fail-fast)
- [ ] **Fehlende** optionale Variablen → stiller Rückfall auf den Default (kein Abbruch).
- [ ] **Syntaktisch ungültige** Werte führen zu **Fail-fast**: die App bricht beim Start mit
      einer klaren, benennenden Fehlermeldung ab (z. B. `PORT=abc`, `PORT=99999` außerhalb
      1–65535, `LLM_TIMEOUT=xyz`, `MAX_UPLOAD_BYTES=-1`).
- [ ] Die Validierung benennt **welche** Variable **welchen** ungültigen Wert hat und nennt
      den erwarteten Wertebereich/Typ.
- [ ] Boolesche Flags (`FLASK_DEBUG`) bleiben tolerant (`1/0/true/false/leer`) wie bisher,
      ohne Fail-fast.

### Drift-Schutz (automatischer Guard)
- [ ] Es gibt einen **automatisierten Check** (z. B. Test unter `webapp/`), der
      `webapp/.env.example` gegen die im Code per `os.environ.get(...)` referenzierten
      Variablen abgleicht und bei **Differenz in beide Richtungen** fehlschlägt
      (gelesen-aber-nicht-dokumentiert **und** dokumentiert-aber-nicht-gelesen).
- [ ] Der Check erkennt **verbotene Hardcode-Muster** in `webapp/` (z. B. wörtliche
      `host=`/`port=`-Literale in `app.run(...)`, eingebettete `http(s)://`-Endpunkte
      außerhalb kuratierter Demodaten, wörtliche Modellnamen wie `whisper-1`/`gpt-…`/`qwen…`
      außerhalb der zentralen Default-Konstanten) und schlägt an.
- [ ] Der Check ist **lokal ausführbar** und Teil des Backend-Smoke-Tests/CI-Schritts;
      eine Anleitung steht in `webapp/README.md`.
- [ ] Bekannte, bewusste Ausnahmen (layout-abgeleitete Pfade, kuratierte Demodaten-URLs in
      `repair/foerderung.py`, `anbieter.py`, `entsorgung.py`, `ersatzteile.py`,
      `produktsuche.py`) sind im Guard **explizit allowlisted** und kommentiert.

### Dokumentation
- [ ] **CLAUDE.md** enthält die verbindliche Regel „Konfiguration immer über `.env`" inkl.
      der Ausnahme für layout-abgeleitete Pfade. *(bereits ergänzt — Konsistenz prüfen)*
- [ ] **`webapp/SPEC.md`** verweist auf dieselbe Regel als Teil des Implementierungs-Vertrags.
- [ ] **`webapp/README.md`** listet alle Konfigurationsvariablen mit Default und Zweck und
      beschreibt, wie der Drift-Guard lokal auszuführen ist.

## Edge Cases
- **Keine `.env`-Datei vorhanden:** App startet mit allen Defaults; keine Warnflut, höchstens
  ein einmaliger Hinweis. (Heutiges Verhalten bleibt erhalten.)
- **Variable gesetzt, aber leer** (`OPENAI_API_KEY=`): zählt als „nicht gesetzt" → Default-/
  Fallback-Pfad (konsistent zur bestehenden `.strip()`-Behandlung in `ai.py`/`recherche.py`).
- **`PORT` außerhalb 1–65535 oder belegt:** ungültiger Wertebereich → Fail-fast mit Meldung;
  belegter Port ist ein OS-Fehler beim Bind und bleibt als solcher erkennbar.
- **`MAX_UPLOAD_BYTES` kleiner als eine reale Datei:** Upload wird mit der bestehenden
  „zu groß"-Logik abgelehnt — kein Crash; Limit gilt zur Laufzeit.
- **`WHISPER_MODEL` auf ein nicht existierendes Modell gesetzt:** kein Fail-fast beim Start
  (Wert ist syntaktisch gültig); der Fehler tritt erst beim API-Call auf und fällt sauber auf
  den bestehenden „keine Transkription"-Hinweis zurück.
- **Whitespace/Anführungszeichen in Werten** (`PORT=" 5000 "`): werden vor der Validierung
  getrimmt, damit Copy-&-Paste aus `.env.example` nicht zum Fail-fast führt.
- **Neue Variable wird im Code eingeführt, aber nicht dokumentiert:** Drift-Guard schlägt fehl
  → erzwingt Eintrag in `.env.example`.
- **Doppelte Definition** derselben Variable in `.env`: letzter Wert gewinnt (dotenv-Default);
  Verhalten ist dokumentiert, kein Sonderhandling.
- **Bewusste Demodaten-URLs** (Förder-/Anbieterquellen) dürfen **nicht** vom Hardcode-Guard
  beanstandet werden → Allowlist greift.

## Technische Anforderungen
- **Stack:** Python `os.environ` + `python-dotenv` (bereits vorhanden); keine neuen
  Laufzeit-Pakete zwingend nötig.
- **Zentralisierung empfohlen:** ein schlankes, **einmalig** geladenes Konfig-Modul (z. B.
  `repair/config.py` mit getypten Gettern/Validierung), das die verstreuten
  `os.environ.get(...)`-Aufrufe bündelt — die Fail-fast-Validierung läuft beim Import/Start.
  *(Verbindliches Design klärt `/architecture`.)*
- **Kompatibilität:** Bestehende Variablennamen und Defaults bleiben unverändert; kein
  Bruch des dokumentierten Verhaltens (`POST /api/diagnose` immer HTTP 200, Fallback ohne
  Key, JSON mit `ensure_ascii=False`).
- **Sicherheit:** `.env` bleibt gitignored; Keys erscheinen nie in Logs (vgl. PROJ-29).
- **Testbarkeit:** Validierung und Drift-Guard ohne laufenden Server prüfbar (Unit-/
  Smoke-Test-tauglich, monkeypatchbare Umgebung).

---
<!-- Folgende Abschnitte werden von nachfolgenden Skills hinzugefügt -->

## Tech Design (Solution Architect)
_Wird von /architecture hinzugefügt_

## QA Test Results
_Wird von /qa hinzugefügt_

## Deployment
_Wird von /deploy hinzugefügt_
