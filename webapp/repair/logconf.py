"""Zentrales Logging-Setup (PROJ-29).

Eine einzige Initialisierungsstelle (:func:`setup_logging`), die in ``app.py``
**einmalig** vor App-Start aufgerufen wird. Konfiguriert genau einen Root-Logger
mit zwei Senken:

* **Konsole** (``stdout``) — wie bisher der Werkzeug-Dev-Server, nur jetzt im
  einheitlichen Format.
* **Datei** ``webapp/logs/repair.log`` mit täglicher Rotation
  (``TimedRotatingFileHandler`` ``when="midnight"``) und 14 Tagen Aufbewahrung
  (``backupCount=14``). Rotierte Dateien tragen ein Datums-Suffix, z. B.
  ``repair.log.2026-05-30``.

Konfiguration ausschließlich über die Umgebungsvariable **``LOG_LEVEL``**
(geladen aus ``webapp/.env`` via ``python-dotenv``, konsistent zum
``OPENAI_*``-Muster). Default ``DEBUG``. Ungültige Werte führen **nicht** zum
Absturz, sondern fallen auf ``DEBUG`` zurück und protokollieren eine Warnung.

Das ``logs/``-Verzeichnis ist Layout (eine Ebene über ``repair/``), keine
Deployment-Konfiguration — vgl. ``store.py`` ``DB_PATH`` /
``multimodal`` ``MEDIA_DIR``. Es wird beim Start automatisch angelegt; ist es
nicht beschreibbar (read-only FS), fällt das Setup auf reines Konsolen-Logging
zurück und warnt einmalig, statt die App abstürzen zu lassen.

⚠️ **Datenschutz-Hinweis (PII):** Auf ``DEBUG`` landen auch
**Klartext-Nutzereingaben** (Freitext-Symptome, Standort, Medien-Metadaten) im
Log. Dieses Logging in dieser Tiefe ist **nur für die lokale Dev-Umgebung**
gedacht, nicht für den Produktivbetrieb. Für Produktion ``LOG_LEVEL=INFO`` (oder
höher) setzen.
"""

from __future__ import annotations

import logging
import os
import sys
from logging.handlers import TimedRotatingFileHandler

# logs/ liegt direkt in webapp/ (eine Ebene über repair/) — Layout, keine
# Deployment-Konfiguration (vgl. store.py DB_PATH / multimodal MEDIA_DIR).
LOG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "logs"))
LOG_FILE = os.path.join(LOG_DIR, "repair.log")

# Zeitstempel, Level, Logger-/Modulname, Nachricht — z. B.
#   2026-05-31 08:39:01 DEBUG repair.ai: Diagnose-Quelle=fallback …
_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
_DATEFMT = "%Y-%m-%d %H:%M:%S"

DEFAULT_LEVEL = logging.DEBUG
BACKUP_COUNT = 14  # 14 Tage Aufbewahrung (PROJ-29)

# Idempotenz-Flag: mehrfaches Initialisieren (Flask-Reloader, Reimport) darf
# keine doppelten Handler → keine doppelten Log-Zeilen erzeugen.
_configured = False


def _resolve_level() -> tuple[int, str | None]:
    """Liest LOG_LEVEL aus der Umgebung.

    Rückgabe ``(level, ungueltiger_wert)``:
    * leer/ungesetzt → ``(DEBUG, None)``
    * gültiger Name (DEBUG/INFO/WARNING/ERROR/CRITICAL) → ``(level, None)``
    * Tippfehler/ungültig → ``(DEBUG, "<wert>")`` (Aufrufer warnt, kein Crash).
    """
    raw = (os.environ.get("LOG_LEVEL") or "").strip().upper()
    if not raw:
        return DEFAULT_LEVEL, None
    level = logging.getLevelName(raw)  # Name → int, oder "Level X"-String
    if isinstance(level, int):
        return level, None
    return DEFAULT_LEVEL, raw


def setup_logging() -> logging.Logger:
    """Konfiguriert den Root-Logger (idempotent). Gibt den Root-Logger zurück.

    Bei mehrfachem Aufruf passiert ab dem zweiten Mal nichts mehr.
    """
    global _configured
    root = logging.getLogger()
    if _configured:
        return root

    level, ungueltig = _resolve_level()
    formatter = logging.Formatter(_FORMAT, datefmt=_DATEFMT)

    # Konsole (stdout) — immer vorhanden.
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    handlers: list[logging.Handler] = [console]

    # Datei-Senke mit täglicher Rotation; best-effort (read-only FS → nur Konsole).
    file_warn: str | None = None
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        file_handler = TimedRotatingFileHandler(
            LOG_FILE,
            when="midnight",
            backupCount=BACKUP_COUNT,
            encoding="utf-8",
        )
        file_handler.suffix = "%Y-%m-%d"  # → repair.log.2026-05-30
        file_handler.setFormatter(formatter)
        handlers.append(file_handler)
    except Exception as exc:  # noqa: BLE001 — Logging darf die App nie verhindern
        file_warn = (
            f"Logdatei {LOG_FILE} nicht beschreibbar ({exc}) — "
            "Fallback auf reines Konsolen-Logging."
        )

    # Genau ein Root-Logger: bestehende Handler entfernen, neue setzen (idempotent).
    for handler in list(root.handlers):
        root.removeHandler(handler)
    for handler in handlers:
        root.addHandler(handler)
    root.setLevel(level)

    # Werkzeug-Zugriffslogs durch dasselbe Setup laufen lassen: keinen eigenen
    # Handler behalten → propagiert an den Root-Logger (gleiche Datei + Format).
    werkzeug = logging.getLogger("werkzeug")
    for handler in list(werkzeug.handlers):
        werkzeug.removeHandler(handler)
    werkzeug.propagate = True

    _configured = True

    log = logging.getLogger("repair.logconf")
    if ungueltig:
        log.warning("Ungültiges LOG_LEVEL=%r — Fallback auf DEBUG.", ungueltig)
    if file_warn:
        log.warning(file_warn)
    log.info(
        "Logging initialisiert — Level=%s, Datei=%s, Rotation=täglich, Aufbewahrung=%d Tage.",
        logging.getLevelName(level),
        "—" if file_warn else LOG_FILE,
        BACKUP_COUNT,
    )
    if level <= logging.DEBUG:
        log.debug(
            "PII-Hinweis: Auf DEBUG landen Klartext-Nutzereingaben im Log — "
            "nur lokal/Dev nutzen, nicht produktiv (PROJ-29)."
        )
    return root
