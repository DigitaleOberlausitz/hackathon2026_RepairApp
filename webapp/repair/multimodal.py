"""Multimodaler Medien-Store (PROJ-27).

Speichert Fotos, Videos, Audio in webapp/media/ (gitignored).

Öffentliche API:
    save_medium(data, art)      → {id, art, ref, hinweis}
    get_medium(id)              → (bytes, content_type) | None
    transkribiere(audio_bytes)  → {text, source:"whisper|hinweis", hinweis?}

Typ/Größen-Limit: 10 MB. Scheitert nie hart.
"""

from __future__ import annotations

import base64
import os
import secrets

# Medien-Verzeichnis: webapp/media/ (eine Ebene über repair/)
MEDIA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "media"))

MAX_BYTES = 10 * 1024 * 1024  # 10 MB

_MIME_TO_EXT: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
}

_EXT_TO_MIME: dict[str, str] = {v: k for k, v in _MIME_TO_EXT.items()}

_ERLAUBTE_ARTEN = frozenset(["foto", "video", "audio"])


def _ensure_media_dir() -> None:
    os.makedirs(MEDIA_DIR, exist_ok=True)


def save_medium(data: bytes | str | None, art: str = "foto") -> dict:
    """Speichert ein Medium auf Disk und gibt {id, art, ref, hinweis} zurück.

    ``data`` kann Bytes oder Data-URL (base64) sein.
    Scheitert nie hart — bei Fehler kommt ein freundlicher Hinweis.
    """
    try:
        _ensure_media_dir()
    except Exception:
        return {"id": "", "art": art, "ref": "", "hinweis": "Medien-Verzeichnis konnte nicht erstellt werden."}

    art = (art or "foto").strip().lower()
    if art not in _ERLAUBTE_ARTEN:
        art = "foto"

    # Data-URL entpacken
    content_type = "image/jpeg"
    raw_bytes = b""

    if isinstance(data, str) and data.startswith("data:"):
        # data:image/jpeg;base64,...
        try:
            header, b64 = data.split(",", 1)
            mime_part = header.split(";")[0].replace("data:", "").strip()
            if mime_part in _MIME_TO_EXT:
                content_type = mime_part
            raw_bytes = base64.b64decode(b64.strip())
        except Exception:
            return {"id": "", "art": art, "ref": "", "hinweis": "Data-URL konnte nicht dekodiert werden."}
    elif isinstance(data, bytes):
        raw_bytes = data
    else:
        return {"id": "", "art": art, "ref": "", "hinweis": "Kein Medium übergeben."}

    # Größen-Check
    if len(raw_bytes) > MAX_BYTES:
        return {"id": "", "art": art, "ref": "", "hinweis": "Medium zu groß (max. 10 MB)."}

    if not raw_bytes:
        return {"id": "", "art": art, "ref": "", "hinweis": "Medium ist leer."}

    # Datei schreiben
    mid = secrets.token_urlsafe(12)
    ext = _MIME_TO_EXT.get(content_type, ".bin")
    filename = f"{mid}{ext}"
    filepath = os.path.join(MEDIA_DIR, filename)

    try:
        with open(filepath, "wb") as f:
            f.write(raw_bytes)
    except Exception as exc:
        return {"id": "", "art": art, "ref": "", "hinweis": f"Speichern fehlgeschlagen: {exc}"}

    return {
        "id": mid,
        "art": art,
        "ref": f"/media/{mid}",
        "hinweis": "",
    }


def get_medium(mid: str) -> tuple[bytes, str] | None:
    """Lädt ein Medium von Disk.

    Gibt (bytes, content_type) zurück oder None wenn nicht gefunden.
    """
    mid = (mid or "").strip()
    if not mid or "/" in mid or ".." in mid:
        return None

    if not os.path.isdir(MEDIA_DIR):
        return None

    # Datei mit passender Extension suchen
    for filename in os.listdir(MEDIA_DIR):
        stem = os.path.splitext(filename)[0]
        if stem == mid:
            ext = os.path.splitext(filename)[1]
            content_type = _EXT_TO_MIME.get(ext, "application/octet-stream")
            filepath = os.path.join(MEDIA_DIR, filename)
            try:
                with open(filepath, "rb") as f:
                    return f.read(), content_type
            except Exception:
                return None
    return None


def transkribiere(audio_bytes: bytes | None = None) -> dict:
    """Optionale Audio-Transkription via Whisper (falls Key gesetzt).

    Ohne Backend: freundlicher Hinweis, kein harter Fehler.
    """
    if not audio_bytes:
        return {
            "text": "",
            "source": "hinweis",
            "hinweis": "Kein Audio übergeben — bitte Browser-Spracherkennung verwenden.",
        }

    # Whisper-Key prüfen
    whisper_key = (os.environ.get("OPENAI_API_KEY") or "").strip()
    if not whisper_key:
        return {
            "text": "",
            "source": "hinweis",
            "hinweis": "Keine Transkription verfügbar (kein OpenAI-Key). Bitte Browser-Spracherkennung verwenden.",
        }

    # Whisper via OpenAI-API
    try:
        from openai import OpenAI
        import tempfile

        client = OpenAI(api_key=whisper_key, max_retries=0)
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as f:
                result = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=f,
                    language="de",
                )
            return {"text": result.text or "", "source": "whisper"}
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
    except Exception as exc:
        return {
            "text": "",
            "source": "hinweis",
            "hinweis": f"Transkription nicht verfügbar ({exc}). Bitte Text eingeben.",
        }
