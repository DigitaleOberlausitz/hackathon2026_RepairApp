"""Reparatur-Helfer — Flask-Backend (Stufe 1).

Routen (SPEC.md + STUFE1.md §2):
    GET  /                           → rendert templates/index.html
    GET  /api/devices                → alle Seed-Geräte als {id: device}
    GET  /api/device/<id>            → einzelnes device (404 wenn unbekannt)
    POST /api/diagnose               → {text} → {device, source, diagnosis}

    POST /api/vorgang                → optional {state} → 201 {id, state, created, updated}
    GET  /api/vorgang/<id>           → {id, state, created, updated} | 404
    PUT  /api/vorgang/<id>           → {state} → {id, state, created, updated} | 404
    GET  /api/foerderung             → {items: [...]}
    GET  /api/vorgang/<id>/export.txt → text/plain Protokoll
    GET  /v/<id>                     → Lese-Ansicht HTML (mit Print-Button)

JSON immer mit ensure_ascii=False, damit Emojis & Umlaute erhalten bleiben.
Start: `python app.py` (debug, :5000) oder `flask --app app run`.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, render_template, request

from repair import (
    ai,
    anbieter,
    data,
    entsorgung,
    ersatzteile,
    export,
    foerderung,
    produktsuche,
    store,
    triage,
)

load_dotenv()

app = Flask(__name__)
# Emojis/Umlaute nicht escapen
app.config["JSON_AS_ASCII"] = False
app.json.ensure_ascii = False
# Request-Body-Limit (DoS-Schutz): Vorgangs-State ist klein — 1 MB genügt reichlich.
app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024


# ─── Bestehende Endpunkte ─────────────────────────────────────────────────────


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
    """Einzelnes Seed-Gerät oder 404.

    Seed-Geräte sind kuratiert → backend-seitig mit ``diagnosis.trust``
    (level="hoch", source="kuratiert") versehen (PROJ-25 / DoD-4), damit ein
    direkt gewähltes Seed-Gerät korrekt als hoch/kuratiert markiert ist.
    """
    device = data.get_device(device_id)
    if device is None:
        return jsonify({"error": "unbekanntes Gerät", "id": device_id}), 404
    device["diagnosis"] = ai.seed_diagnosis(device)
    return jsonify(device)


@app.post("/api/diagnose")
def api_diagnose():
    """Freitext → Live-Diagnose (KI) oder Fallback. Scheitert nie hart.

    Antwort: {device, source, diagnosis}  (PROJ-4)
    """
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    result = ai.diagnose(text if isinstance(text, str) else str(text))
    return jsonify(result)


# ─── PROJ-9: Vorgang-Persistenz ───────────────────────────────────────────────


@app.post("/api/vorgang")
def api_vorgang_create():
    """Neuen Vorgang anlegen.

    Body optional: {"state": {...}}
    Antwort 201: {"id": "...", "state": {...}, "created": "...", "updated": "..."}
    """
    payload = request.get_json(silent=True) or {}
    initial_state = payload.get("state") if isinstance(payload.get("state"), dict) else None
    vorgang = store.create_vorgang(initial_state)
    return jsonify(vorgang), 201


@app.get("/api/vorgang/<vid>")
def api_vorgang_get(vid: str):
    """Vorgang laden.

    Antwort: {"id", "state", "created", "updated"} oder 404 {"error"}.
    """
    vorgang = store.get_vorgang(vid)
    if vorgang is None:
        return jsonify({"error": "Vorgang nicht gefunden", "id": vid}), 404
    return jsonify(vorgang)


@app.put("/api/vorgang/<vid>")
def api_vorgang_put(vid: str):
    """Vorgang-State überschreiben (last-write-wins).

    Body: {"state": {...}}
    Antwort: {"id", "state", "created", "updated"} oder 404 {"error"}.
    """
    payload = request.get_json(silent=True) or {}
    new_state = payload.get("state")
    if not isinstance(new_state, dict):
        new_state = {}
    vorgang = store.save_vorgang(vid, new_state)
    if vorgang is None:
        return jsonify({"error": "Vorgang nicht gefunden", "id": vid}), 404
    return jsonify(vorgang)


# ─── PROJ-6: Förderung ────────────────────────────────────────────────────────


@app.get("/api/foerderung")
def api_foerderung():
    """Kuratierte Reparatur-Förderungen mit berechnetem status.

    Antwort: {"items": [{bezeichnung, traeger, region, stand, gueltigBis,
                          quelle, beschreibung, status}, ...]}
    """
    items = foerderung.list_foerderungen()
    return jsonify({"items": items})


# ─── Stufe 2: Service-Endpunkte (PROJ-11/12/13/14/26) ────────────────────────
# Alle liefern HTTP 200 mit kuratiertem Seed, scheitern nie hart.
# Query-Parameter sind optional und filtern nur. Leertreffer → fallback:true.


def _q(name: str) -> str | None:
    """Liest einen optionalen Query-Parameter, "" → None."""
    val = (request.args.get(name) or "").strip()
    return val or None


@app.get("/api/anbieter")
def api_anbieter():
    """PROJ-11 — kuratierte Reparatur-Anbieter (Repair-Café/Werkstatt/Profi).

    Query optional: ?kat=&ort=. Leertreffer → fallback:true + ehrlicher Hinweis.
    """
    kat, ort = _q("kat"), _q("ort")
    items = anbieter.list_anbieter(kat=kat, ort=ort)
    fallback = not items
    hinweis = ""
    if fallback:
        hinweis = (
            "Für deinen Filter sind keine Anbieter in unseren Demodaten hinterlegt. "
            "Versuch es ohne Ort-Filter oder suche bundesweite Initiativen auf reparatur-initiativen.de."
        )
    return jsonify({"items": items, "fallback": fallback, "hinweis": hinweis})


@app.get("/api/entsorgung")
def api_entsorgung():
    """PROJ-12 — kuratierte Entsorgungs-/Recyclingwege mit Rohstoff-Hinweis.

    Query optional: ?kat=&ort=. Leertreffer → fallback:true + ehrlicher Hinweis.
    """
    kat, ort = _q("kat"), _q("ort")
    items = entsorgung.list_entsorgung(kat=kat, ort=ort)
    fallback = not items
    hinweis = ""
    if fallback:
        hinweis = (
            "Für deinen Filter sind keine Entsorgungsstellen hinterlegt. Elektrogeräte gehören "
            "nie in den Hausmüll — jeder kommunale Wertstoffhof und größere Händler (ElektroG) "
            "nehmen Altgeräte kostenlos zurück."
        )
    return jsonify({"items": items, "fallback": fallback, "hinweis": hinweis})


@app.get("/api/alternativen")
def api_alternativen():
    """PROJ-13 — Alternativgeräte/Neukauf mit ehrlichem Break-Even.

    Query optional: ?kat=. Leertreffer → fallback:true + ehrlicher Hinweis.
    """
    kat = _q("kat")
    items = produktsuche.list_alternativen(kat=kat)
    fallback = not items
    hinweis = ""
    if fallback:
        hinweis = (
            "Für diese Kategorie haben wir keine Alternativgeräte hinterlegt. "
            "Prüfe zuerst, ob sich eine Reparatur lohnt — das ist meist die nachhaltigere Wahl."
        )
    return jsonify({
        "items": items,
        "breakEven": produktsuche.breakeven_text(kat),
        "hinweis": hinweis,
        "fallback": fallback,
    })


@app.get("/api/ersatzteile")
def api_ersatzteile():
    """PROJ-14 — Ersatzteile, günstigste zuerst; Bestelloption nachgelagert (D8).

    Query optional: ?device=&defekt=. Leertreffer → fallback:true + Hinweis.
    """
    device, defekt = _q("device"), _q("defekt")
    items = ersatzteile.list_ersatzteile(device=device, defekt=defekt)
    fallback = not items
    hinweis = ""
    if fallback:
        hinweis = (
            "Zu diesem Gerät/Defekt sind keine Ersatzteile in unseren Demodaten hinterlegt. "
            "Frag beim Hersteller-Service nach der genauen Modell-/Ersatzteilnummer."
        )
    return jsonify({
        "items": items,
        "guenstigsteZuerst": True,
        "hinweis": hinweis,
        "fallback": fallback,
    })


@app.get("/api/triage/universal")
def api_triage_universal():
    """PROJ-26 — die 5 systematischen, gerätunabhängigen Triage-Fragen."""
    return jsonify({"fragen": triage.universal_fragen()})


# ─── PROJ-10: Export ─────────────────────────────────────────────────────────


@app.get("/api/vorgang/<vid>/export.txt")
def api_vorgang_export_txt(vid: str):
    """Klartext-Protokoll des Vorgangs (text/plain, UTF-8).

    404 wenn Vorgang unbekannt.
    """
    vorgang = store.get_vorgang(vid)
    if vorgang is None:
        return jsonify({"error": "Vorgang nicht gefunden", "id": vid}), 404

    txt = export.render_txt(vorgang.get("state") or {}, vorgang)
    return Response(txt, content_type="text/plain; charset=utf-8")


@app.get("/v/<vid>")
def vorgang_view(vid: str):
    """Lese-Ansicht eines Vorgangs als standalone HTML.

    Enthält inline Print-CSS + window.print()-Button (→ PDF-Weg).
    Link gültig 30 Tage ab created; danach „nicht mehr verfügbar".
    404-ähnliches Verhalten bei unbekannter id (HTML-Seite mit Hinweis).
    """
    vorgang = store.get_vorgang(vid)
    if vorgang is None:
        # Kein harter 404, sondern freundlicher HTML-Hinweis (Demo läuft immer)
        html = export._expired_html(vid)
        return Response(html, content_type="text/html; charset=utf-8")

    html = export.render_html(vorgang.get("state") or {}, vorgang)
    return Response(html, content_type="text/html; charset=utf-8")


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "1") not in ("0", "false", "False", "")
    app.run(host="127.0.0.1", port=5000, debug=debug)
