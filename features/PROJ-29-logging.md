# PROJ-29: Zentrales Logging (Datei + Konsole, tägliche Rotation)

## Status: Done
**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31
**Umgesetzt:** 2026-05-31 — `repair/logconf.py` (`setup_logging()`), Verdrahtung in `app.py`
(Setup, zentrales `after_request`-Access-Log, `got_request_exception`-Stacktrace-Logging),
Instrumentierung in `ai.py`, `store.py`, `lotse.py`, `wissensbasis.py`, `recherche.py`,
`multimodal.py`; Doku in `.env.example`, `.gitignore`, `README.md`, `CLAUDE.md`.

## Kontext
Die Web-App (`webapp/`) erzeugt heute **keine** Logdatei. Laufzeit-Ausgaben gibt es nur
flüchtig auf der Konsole über den Werkzeug-Dev-Server (`app.run(..., debug=...)`,
`app.py:753`); im Python-Code existiert kein einziger `logging`-Aufruf. Damit sind Fehler
nach Terminal-Ende verloren und es gibt keine nachvollziehbare Vorgangs-Historie zur Diagnose.

Dieses Feature führt ein **zentrales Logging-Setup** ein und ergänzt den Quellcode der App
um aussagekräftige Log-Ausgaben.

## Abhängigkeiten
- Keine (Querschnitts-Infrastruktur; betrifft `app.py` und alle `repair/*`-Module)

## User Stories
- Als **Entwickler** möchte ich, dass alle Laufzeit-Ereignisse zugleich in eine Datei **und**
  auf die Konsole geschrieben werden, damit ich Fehler auch nach Schließen des Terminals
  nachvollziehen kann.
- Als **Entwickler** möchte ich das Log-Level an **einer zentralen Stelle** über die `.env`
  setzen (`LOG_LEVEL`), damit ich zwischen ausführlichem Debugging und ruhigem Betrieb
  umschalten kann, ohne Code zu ändern.
- Als **Betreiber** möchte ich, dass die Logdatei **täglich rotiert** und nur **14 Tage**
  vorgehalten wird, damit die Platte nicht vollläuft und alte Logs automatisch verschwinden.
- Als **Entwickler** möchte ich beim Lesen des Logs erkennen, **welche API-Route**, **welches
  Fach-Modul** und **welcher Vorgang** ein Ereignis ausgelöst hat, damit ich einen Reparaturfall
  end-to-end verfolgen kann.
- Als **Support/QA** möchte ich, dass jede unbehandelte Exception **mit Stacktrace** im Log
  landet, damit Fehlerberichte reproduzierbar werden.
- Als **Datenschutz-Verantwortlicher** möchte ich, dass dokumentiert ist, dass das DEBUG-Log
  Klartext-Nutzereingaben enthalten kann und daher nur lokal/nicht produktiv genutzt wird,
  damit niemand versehentlich PII exponiert.

## Akzeptanzkriterien

### Logging-Setup
- [x] Es gibt eine **zentrale** Initialisierungsstelle (z. B. `repair/logconf.py` mit
      `setup_logging()`), die in `app.py` **einmalig** vor App-Start aufgerufen wird.
- [x] Das Log-Level wird aus der Umgebungsvariable **`LOG_LEVEL`** gelesen (über `.env`,
      konsistent zum bestehenden `OPENAI_*`-Muster via `python-dotenv`).
- [x] Ist `LOG_LEVEL` nicht gesetzt, gilt der **Default `DEBUG`**.
- [x] Ungültige `LOG_LEVEL`-Werte (Tippfehler) führen **nicht** zum Absturz, sondern fallen
      auf `DEBUG` zurück und protokollieren eine Warnung.
- [x] Es ist **genau ein** Root-Logger konfiguriert; doppelte Handler bei Reload/Reimport
      werden vermieden (idempotentes Setup).

### Ausgabe-Senken (Datei + Konsole)
- [x] Jede Log-Zeile erscheint **gleichzeitig** in der Datei und auf der Konsole (stdout/stderr).
- [x] Die Logdatei liegt unter **`webapp/logs/repair.log`**; das Verzeichnis `logs/` wird beim
      Start automatisch angelegt, falls es fehlt.
- [x] Beide Senken nutzen dasselbe **Format** mit mindestens: Zeitstempel, Level, Logger-/
      Modulname, Nachricht (z. B. `2026-05-31 08:39:01 DEBUG repair.ai: …`).

### Rotation & Aufbewahrung
- [x] Die Datei rotiert **täglich** (Wechsel um Mitternacht, `when="midnight"`).
- [x] Es werden **14** rotierte Dateien vorgehalten (`backupCount=14`); ältere werden
      automatisch gelöscht.
- [x] Rotierte Dateien sind am Datums-Suffix erkennbar (z. B. `repair.log.2026-05-30`).

### Werkzeug-Integration
- [x] Die HTTP-Zugriffslogs des Werkzeug-Dev-Servers laufen durch **dasselbe** Setup
      (gleiche Datei + gleiches Format), statt separat nur auf der Konsole zu erscheinen.

### Quellcode-Instrumentierung
- [x] **Jeder API-Request** wird geloggt (Methode, Pfad, Status-Code; bei Fehlern auf
      `WARNING`/`ERROR`). Realisierung zentral (z. B. `after_request`/`errorhandler`), nicht
      pro Route dupliziert.
- [x] **Schlüssel-Ereignisse der Fach-Module** werden auf passendem Level geloggt, u. a.:
      `repair/ai.py` → Diagnose-Quelle (`ai` vs. `fallback`) und Modellname;
      `repair/lotse.py` → gewähltes Routing;
      `repair/store.py` → Vorgangs-CRUD (Anlegen/Lesen/Aktualisieren mit Vorgangs-ID);
      `repair/wissensbasis.py` → Entwurf/Freigabe/Zurückziehen;
      `repair/recherche.py`, `repair/multimodal.py` → Start/Quelle/Ergebnis.
- [x] **Jede unbehandelte Exception** wird mit **Stacktrace** (`logger.exception`) geloggt und
      führt weiterhin zu einer sauberen HTTP-Antwort (kein verändertes Fehlerverhalten der API).
- [x] Bestehendes API-Verhalten bleibt unverändert: `POST /api/diagnose` liefert weiterhin
      immer HTTP 200, JSON weiterhin mit `ensure_ascii=False`.

### Repo-Hygiene & Doku
- [x] `webapp/logs/` (bzw. `*.log`) wird in `webapp/.gitignore` aufgenommen — keine Logs im Repo.
- [x] `webapp/.env.example` dokumentiert `LOG_LEVEL` mit Default-Hinweis.
- [x] `webapp/README.md` (und ggf. `CLAUDE.md`) beschreiben kurz: Speicherort, Rotation,
      Level-Konfiguration **und** den PII-Hinweis (s. u.).

### Datenschutz-Hinweis (PII)
- [x] Es ist **dokumentiert** (README + Kommentar am Setup), dass auf `DEBUG` auch
      **Klartext-Nutzereingaben** (Freitext-Symptome, Standort, ggf. Medien-Metadaten) im Log
      landen können und das Logging in dieser Tiefe **nur für die lokale Dev-Umgebung** gedacht
      ist, nicht für Produktion.

## Edge Cases
- **`logs/`-Verzeichnis fehlt oder ist nicht beschreibbar:** Setup legt es an; bei
  Schreibfehler (z. B. read-only FS) darf die App **nicht abstürzen** — Fallback auf reines
  Konsolen-Logging plus eine einmalige Warnung.
- **Ungültiges `LOG_LEVEL`** (z. B. `LOG_LEVEL=verbose`): Fallback auf `DEBUG` + Warnung,
  kein Crash.
- **Mehrfaches Initialisieren** (Flask-Reloader im Debug-Modus startet den Prozess doppelt):
  keine doppelten Handler → keine doppelten Log-Zeilen.
- **Tageswechsel bei laufender App:** Rotation greift automatisch zur Mitternacht; aktiver
  Schreibvorgang darf nicht verloren gehen.
- **Sehr große Freitext-/Diagnose-Eingaben:** Log bleibt nutzbar; überlange Nutzdaten werden
  gekürzt (z. B. auf eine sinnvolle Maximallänge) statt das Log zu fluten.
- **Binäre Medien-Uploads (PROJ-27):** Es werden **keine** rohen Datei-Bytes geloggt, nur
  Metadaten (Größe, Typ, Medien-ID).
- **Sekunden-/Subsekunden-Genauigkeit bei vielen Requests:** Zeitstempelformat erlaubt
  eindeutige Reihenfolge (mind. Sekunden, idealerweise Millisekunden).

## Technische Anforderungen
- **Stack:** Python `logging` Standardbibliothek; `logging.handlers.TimedRotatingFileHandler`
  (`when="midnight"`, `backupCount=14`) + `StreamHandler` für die Konsole.
- **Konfiguration:** `LOG_LEVEL` via `python-dotenv` (`webapp/.env`), Default `DEBUG`.
- **Performance:** Logging darf den Request-Pfad nicht spürbar verlangsamen (kein
  synchrones Netz-/Plattenflush pro Zeile über das Handler-Default hinaus).
- **Keine neuen Pakete** zwingend nötig (Standardbibliothek genügt).
- **Kompatibilität:** Läuft unverändert **ohne** OpenAI-Key (Fallback-Pfad muss ebenfalls
  korrekt geloggt werden).

---
<!-- Folgende Abschnitte werden von nachfolgenden Skills hinzugefügt -->

## Tech Design (Solution Architect)
_Wird von /architecture hinzugefügt_

## QA Test Results

Smoke-/Edge-Case-Tests gegen die Akzeptanzkriterien (alle ✅):

- **Datei + Konsole gleichzeitig:** `logs/repair.log` wird beim Start angelegt; identische
  Zeilen erscheinen in Datei und auf stdout, Format `YYYY-MM-DD HH:MM:SS LEVEL name: msg`.
- **LOG_LEVEL-Fallback:** `LOG_LEVEL=verbose` → kein Crash, Root-Level bleibt DEBUG, Warnung
  „Ungültiges LOG_LEVEL='VERBOSE' — Fallback auf DEBUG." geloggt.
- **Idempotenz:** zweimaliger `setup_logging()`-Aufruf → Handler-Zahl bleibt 2 (keine Dopplung).
- **Rotation:** Handler-Inspektion → `when=MIDNIGHT`, `backupCount=14`, `suffix=%Y-%m-%d`
  (→ `repair.log.2026-05-30`).
- **Werkzeug-Integration:** Live-Server (`FLASK_DEBUG=0`) → Werkzeug-Access-Zeilen
  (`INFO werkzeug: … "GET … " 200`) landen in derselben Datei.
- **Request-Logging zentral:** `GET /api/devices` → INFO, `GET /api/device/unbekannt` → WARNING
  (404), via `after_request` (nicht pro Route).
- **Unbehandelte Exception:** `/boom` (RuntimeError) → `ERROR repair.app: Unbehandelte Exception
  …` **mit vollständigem Stacktrace**, HTTP-Antwort weiterhin sauberer 500 (`text/html`).
- **API-Verhalten unverändert:** `POST /api/diagnose` → HTTP 200, `source=fallback`,
  JSON mit echten Umlauten (`ensure_ascii=False`).
- **Fach-Instrumentierung:** `repair.ai` loggt Diagnose-Quelle + Modell; `repair.store`,
  `repair.lotse`, `repair.wissensbasis`, `repair.recherche`, `repair.multimodal` (nur
  Metadaten, keine Rohbytes) loggen ihre Schlüssel-Ereignisse.

## Deployment
_Wird von /deploy hinzugefügt_
