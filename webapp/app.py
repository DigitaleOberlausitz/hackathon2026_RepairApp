"""Reparatur-Helfer — Flask-Backend.

Routen (siehe webapp/SPEC.md):
    GET  /                   → rendert templates/index.html
    GET  /api/devices        → alle Seed-Geräte als {id: device}
    GET  /api/device/<id>    → einzelnes device (404 wenn unbekannt)
    POST /api/diagnose       → {text} → {device, source}

JSON immer mit ensure_ascii=False, damit Emojis & Umlaute erhalten bleiben.
Start: `python app.py` (debug, :5000) oder `flask --app app run`.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

from repair import ai, data

load_dotenv()

app = Flask(__name__)
# Emojis/Umlaute nicht escapen
app.config["JSON_AS_ASCII"] = False
app.json.ensure_ascii = False


@app.get("/")
def index():
    """SPA-Shell ausliefern (Template gehört AGENT-B)."""
    return render_template("index.html")


@app.get("/api/devices")
def api_devices():
    """Alle Seed-Geräte: {"toaster": {...}, "mikrowelle": {...}}."""
    return jsonify(data.seed_devices())


@app.get("/api/device/<device_id>")
def api_device(device_id: str):
    """Einzelnes Seed-Gerät oder 404."""
    device = data.get_device(device_id)
    if device is None:
        return jsonify({"error": "unbekanntes Gerät", "id": device_id}), 404
    return jsonify(device)


@app.post("/api/diagnose")
def api_diagnose():
    """Freitext → Live-Diagnose (KI) oder Fallback. Scheitert nie hart."""
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    result = ai.diagnose(text if isinstance(text, str) else str(text))
    return jsonify(result)


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "1") not in ("0", "false", "False", "")
    app.run(host="127.0.0.1", port=5000, debug=debug)
