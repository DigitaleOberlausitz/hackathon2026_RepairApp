# PROJ-29: Zentrales Logging (Datei + Konsole, tägliche Rotation)

## Status: Planned
**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31

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
- [ ] Es gibt eine **zentrale** Initialisierungsstelle (z. B. `repair/logconf.py` mit
      `setup_logging()`), die in `app.py` **einmalig** vor App-Start aufgerufen wird.
- [ ] Das Log-Level wird aus der Umgebungsvariable **`LOG_LEVEL`** gelesen (über `.env`,
      konsistent zum bestehenden `OPENAI_*`-Muster via `python-dotenv`).
- [ ] Ist `LOG_LEVEL` nicht gesetzt, gilt der **Default `DEBUG`**.
- [ ] Ungültige `LOG_LEVEL`-Werte (Tippfehler) führen **nicht** zum Absturz, sondern fallen
      auf `DEBUG` zurück und protokollieren eine Warnung.
- [ ] Es ist **genau ein** Root-Logger konfiguriert; doppelte Handler bei Reload/Reimport
      werden vermieden (idempotentes Setup).

### Ausgabe-Senken (Datei + Konsole)
- [ ] Jede Log-Zeile erscheint **gleichzeitig** in der Datei und auf der Konsole (stdout/stderr).
- [ ] Die Logdatei liegt unter **`webapp/logs/repair.log`**; das Verzeichnis `logs/` wird beim
      Start automatisch angelegt, falls es fehlt.
- [ ] Beide Senken nutzen dasselbe **Format** mit mindestens: Zeitstempel, Level, Logger-/
      Modulname, Nachricht (z. B. `2026-05-31 08:39:01 DEBUG repair.ai: …`).

### Rotation & Aufbewahrung
- [ ] Die Datei rotiert **täglich** (Wechsel um Mitternacht, `when="midnight"`).
- [ ] Es werden **14** rotierte Dateien vorgehalten (`backupCount=14`); ältere werden
      automatisch gelöscht.
- [ ] Rotierte Dateien sind am Datums-Suffix erkennbar (z. B. `repair.log.2026-05-30`).

### Werkzeug-Integration
- [ ] Die HTTP-Zugriffslogs des Werkzeug-Dev-Servers laufen durch **dasselbe** Setup
      (gleiche Datei + gleiches Format), statt separat nur auf der Konsole zu erscheinen.

### Quellcode-Instrumentierung
- [ ] **Jeder API-Request** wird geloggt (Methode, Pfad, Status-Code; bei Fehlern auf
      `WARNING`/`ERROR`). Realisierung zentral (z. B. `after_request`/`errorhandler`), nicht
      pro Route dupliziert.
- [ ] **Schlüssel-Ereignisse der Fach-Module** werden auf passendem Level geloggt, u. a.:
      `repair/ai.py` → Diagnose-Quelle (`ai` vs. `fallback`) und Modellname;
      `repair/lotse.py` → gewähltes Routing;
      `repair/store.py` → Vorgangs-CRUD (Anlegen/Lesen/Aktualisieren mit Vorgangs-ID);
      `repair/wissensbasis.py` → Entwurf/Freigabe/Zurückziehen;
      `repair/recherche.py`, `repair/multimodal.py` → Start/Quelle/Ergebnis.
- [ ] **Jede unbehandelte Exception** wird mit **Stacktrace** (`logger.exception`) geloggt und
      führt weiterhin zu einer sauberen HTTP-Antwort (kein verändertes Fehlerverhalten der API).
- [ ] Bestehendes API-Verhalten bleibt unverändert: `POST /api/diagnose` liefert weiterhin
      immer HTTP 200, JSON weiterhin mit `ensure_ascii=False`.

### Repo-Hygiene & Doku
- [ ] `webapp/logs/` (bzw. `*.log`) wird in `webapp/.gitignore` aufgenommen — keine Logs im Repo.
- [ ] `webapp/.env.example` dokumentiert `LOG_LEVEL` mit Default-Hinweis.
- [ ] `webapp/README.md` (und ggf. `CLAUDE.md`) beschreiben kurz: Speicherort, Rotation,
      Level-Konfiguration **und** den PII-Hinweis (s. u.).

### Datenschutz-Hinweis (PII)
- [ ] Es ist **dokumentiert** (README + Kommentar am Setup), dass auf `DEBUG` auch
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
_Wird von /qa hinzugefügt_

## Deployment
_Wird von /deploy hinzugefügt_
