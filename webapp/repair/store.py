"""Vorgang-Persistenz via stdlib sqlite3.

Tabelle: vorgaenge(id TEXT PRIMARY KEY, state TEXT/JSON, created TEXT, updated TEXT)
Datei:   webapp/vorgaenge.db  (in .gitignore — nicht einchecken)

Verbindung wird pro Operation geöffnet und sauber geschlossen (thread-safe).
id = secrets.token_urlsafe(12) (nicht erratbar, 96 Bit Entropie).
State als JSON-Text gespeichert (ensure_ascii=False, echte Umlaute/Emojis).
Timestamps ISO 8601 UTC. Last-write-wins.

Öffentliche API:
    create_vorgang(state=None) -> dict       # neuer Vorgang
    get_vorgang(id) -> dict | None           # laden oder None
    save_vorgang(id, state) -> dict | None   # speichern / überschreiben oder None
"""

from __future__ import annotations

import json
import logging
import os
import secrets
import sqlite3
from datetime import datetime, timezone

log = logging.getLogger(__name__)

# vorgaenge.db liegt direkt in webapp/ (eine Ebene über repair/)
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vorgaenge.db"))

_SCHEMA = """
CREATE TABLE IF NOT EXISTS vorgaenge (
    id      TEXT PRIMARY KEY,
    state   TEXT,
    created TEXT NOT NULL,
    updated TEXT NOT NULL
);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    """Öffnet Verbindung, legt Tabelle an (idempotent)."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute(_SCHEMA)
    conn.commit()
    return conn


def _row_to_dict(row: tuple) -> dict:
    state_raw = row[1]
    state = json.loads(state_raw) if state_raw else {}
    return {"id": row[0], "state": state, "created": row[2], "updated": row[3]}


def create_vorgang(state=None) -> dict:
    """Legt einen neuen Vorgang an. Gibt {id, state, created, updated} zurück."""
    vid = secrets.token_urlsafe(12)
    now = _now()
    state_obj = state if isinstance(state, dict) else {}
    state_json = json.dumps(state_obj, ensure_ascii=False)
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO vorgaenge (id, state, created, updated) VALUES (?, ?, ?, ?)",
            (vid, state_json, now, now),
        )
        conn.commit()
    finally:
        conn.close()
    log.info("Vorgang angelegt: id=%s (initial_state=%s)", vid, bool(state))
    return {"id": vid, "state": state_obj, "created": now, "updated": now}


def get_vorgang(vid: str) -> dict | None:
    """Lädt einen Vorgang per id. Gibt None zurück wenn nicht gefunden."""
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT id, state, created, updated FROM vorgaenge WHERE id = ?",
            (vid,),
        ).fetchone()
    finally:
        conn.close()
    if row is None:
        log.debug("Vorgang nicht gefunden: id=%s", vid)
        return None
    log.debug("Vorgang geladen: id=%s", vid)
    return _row_to_dict(row)


def save_vorgang(vid: str, state) -> dict | None:
    """Überschreibt den State eines bestehenden Vorgangs.

    Gibt das aktualisierte {id, state, created, updated} zurück oder None
    wenn der Vorgang nicht existiert (kein upsert — 404-Logik bleibt im Aufrufer).
    """
    now = _now()
    state_obj = state if isinstance(state, dict) else {}
    state_json = json.dumps(state_obj, ensure_ascii=False)
    conn = _connect()
    try:
        cursor = conn.execute(
            "UPDATE vorgaenge SET state = ?, updated = ? WHERE id = ?",
            (state_json, now, vid),
        )
        conn.commit()
        if cursor.rowcount == 0:
            log.debug("Vorgang nicht aktualisiert (unbekannt): id=%s", vid)
            return None
        row = conn.execute(
            "SELECT id, state, created, updated FROM vorgaenge WHERE id = ?",
            (vid,),
        ).fetchone()
    finally:
        conn.close()
    if row is None:
        return None
    log.info("Vorgang aktualisiert: id=%s", vid)
    return _row_to_dict(row)
