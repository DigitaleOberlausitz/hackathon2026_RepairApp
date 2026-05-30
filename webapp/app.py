"""Reparatur-Helfer — Flask-Backend (Stufe 3).

Routen (SPEC.md + STUFE1.md + STUFE2.md + STUFE3.md §2):
    GET  /                           → rendert templates/index.html
    GET  /api/devices                → alle Seed-Geräte als {id: device}
    GET  /api/device/<id>            → einzelnes device (404 wenn unbekannt)
    POST /api/diagnose               → {text, kategorie?, answers?, lang?} → {device, source, diagnosis}

    POST /api/vorgang                → optional {state} → 201 {id, state, created, updated}
    GET  /api/vorgang/<id>           → {id, state, created, updated} | 404
    PUT  /api/vorgang/<id>           → {state} → {id, state, created, updated} | 404
    GET  /api/foerderung             → {items: [...]}
    GET  /api/vorgang/<id>/export.txt → text/plain Protokoll
    GET  /v/<id>                     → Lese-Ansicht HTML (mit Print-Button)

    Stufe 2:
    GET  /api/anbieter               → PROJ-11
    GET  /api/entsorgung             → PROJ-12
    GET  /api/alternativen           → PROJ-13
    GET  /api/ersatzteile            → PROJ-14
    GET  /api/triage/universal       → PROJ-26

    Stufe 3:
    GET  /api/wissensbasis                       → PROJ-15
    GET  /api/wissensbasis/<id>                  → PROJ-15
    POST /api/wissensbasis/entwurf               → PROJ-15
    POST /api/wissensbasis/<id>/freigabe         → PROJ-15
    POST /api/wissensbasis/<id>/zurueckziehen    → PROJ-15
    POST /api/recherche                          → PROJ-16
    GET  /api/rueckruf                           → PROJ-19
    POST /api/bewertung/gesamt                   → PROJ-21
    GET  /api/consent/text                       → PROJ-22
    POST /api/vorgang/<vid>/consent              → PROJ-22
    GET  /api/schwungrad/grobgate                → PROJ-23
    POST /api/schwungrad/beitrag                 → PROJ-23
    POST /api/anonymisieren                      → PROJ-23
    POST /api/vorgang/<vid>/medien               → PROJ-27
    GET  /media/<mid>                            → PROJ-27
    POST /api/transkription                      → PROJ-27
    GET  /api/lotse/route                        → PROJ-18
    POST /api/lotse/route                        → PROJ-18

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
    anonymisierung,
    bewertung,
    consent,
    data,
    datenloeschung,
    entsorgung,
    ersatzteile,
    export,
    foerderung,
    lotse,
    multimodal,
    produktsuche,
    recherche,
    schwungrad,
    store,
    triage,
    wissensbasis,
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

    Body: {text, kategorie?, answers?, lang?}
    Antwort: {device, source, diagnosis}  (PROJ-4/17/24)
    diagnosis enthält additiv: kandidaten, abgrenzung, unklar (PROJ-17)
    """
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    kategorie = str(payload.get("kategorie") or "")
    answers = payload.get("answers")
    if not isinstance(answers, list):
        answers = None
    lang = str(payload.get("lang") or request.args.get("lang") or "de").strip().lower()
    if lang not in ("de", "en"):
        lang = "de"
    result = ai.diagnose(
        text=text if isinstance(text, str) else str(text),
        kategorie=kategorie,
        answers=answers,
        lang=lang,
    )
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


# ─── Stufe 3: Wissensbasis (PROJ-15) ─────────────────────────────────────────


@app.get("/api/wissensbasis")
def api_wissensbasis_list():
    """PROJ-15 — Fehlerzustände auflisten.

    Query optional: ?status=geprueft|entwurf|alle (default geprueft) &kat=
    """
    status = (_q("status") or "geprueft").lower()
    kat = _q("kat")
    items = wissensbasis.list_fehlerzustaende(status=status, kat=kat)
    cnt = wissensbasis.counts()
    return jsonify({"items": items, "counts": cnt})


@app.get("/api/wissensbasis/<entry_id>")
def api_wissensbasis_get(entry_id: str):
    """PROJ-15 — einzelner Fehlerzustand oder 404."""
    entry = wissensbasis.get(entry_id)
    if entry is None:
        return jsonify({"error": "Eintrag nicht gefunden", "id": entry_id}), 404
    return jsonify(entry)


@app.post("/api/wissensbasis/entwurf")
def api_wissensbasis_entwurf():
    """PROJ-15 — KI-Entwurf anlegen.

    Body: {kategorie, symptom, lang?}
    → {item, source:"ai|fallback"}
    """
    payload = request.get_json(silent=True) or {}
    kat = str(payload.get("kategorie") or "sonstige").strip()
    symptom = str(payload.get("symptom") or "").strip()
    lang = str(payload.get("lang") or "de").strip().lower()
    if lang not in ("de", "en"):
        lang = "de"
    item = wissensbasis.entwurf_erzeugen(kat=kat, symptom=symptom, lang=lang)
    return jsonify({"item": item, "source": "fallback"})


@app.post("/api/wissensbasis/<entry_id>/freigabe")
def api_wissensbasis_freigabe(entry_id: str):
    """PROJ-15 — Entwurf freigeben.

    Body: {sicherheitBestaetigt:true, sicherheit:"gut|mittel|stop", komplexitaet?}
    → 200 wenn freigegeben, 409 wenn sicherheitBestaetigt fehlt/false.
    """
    payload = request.get_json(silent=True) or {}
    bestaetigt = bool(payload.get("sicherheitBestaetigt", False))
    sicherheit = str(payload.get("sicherheit") or "mittel").strip().lower()
    if sicherheit not in ("gut", "mittel", "stop"):
        sicherheit = "mittel"
    komplexitaet = payload.get("komplexitaet")
    if komplexitaet:
        komplexitaet = str(komplexitaet).strip().lower()
        if komplexitaet not in ("gut", "mittel", "stop"):
            komplexitaet = None

    if not bestaetigt:
        return jsonify({
            "error": "Freigabe erfordert sicherheitBestaetigt:true — menschliche Sicherheits-Bestätigung fehlt.",
            "id": entry_id,
        }), 409

    item = wissensbasis.freigeben(
        entry_id=entry_id,
        sicherheit=sicherheit,
        komplexitaet=komplexitaet,
        sicherheitBestaetigt=True,
    )
    if item is None:
        return jsonify({"error": "Eintrag nicht gefunden oder nicht freigebbar", "id": entry_id}), 404
    return jsonify(item)


@app.post("/api/wissensbasis/<entry_id>/zurueckziehen")
def api_wissensbasis_zurueckziehen(entry_id: str):
    """PROJ-15 — Eintrag auf entwurf-Status zurücksetzen."""
    item = wissensbasis.zurueckziehen(entry_id)
    if item is None:
        return jsonify({"error": "Eintrag nicht gefunden", "id": entry_id}), 404
    return jsonify(item)


# ─── Stufe 3: Recherche (PROJ-16) ────────────────────────────────────────────


@app.post("/api/recherche")
def api_recherche():
    """PROJ-16 — Wissensanfrage: kuratiert → KI-Fallback → Online.

    Body: {frage, kontext?, lang?}
    → {aussage, herkunft, quelle, konfidenz, widerspruch, online, nurDeutsch}
    """
    payload = request.get_json(silent=True) or {}
    frage = str(payload.get("frage") or "").strip()
    kontext = payload.get("kontext")
    lang = str(payload.get("lang") or request.args.get("lang") or "de").strip().lower()
    if lang not in ("de", "en"):
        lang = "de"
    if not frage:
        from repair.i18n import t
        return jsonify({
            "aussage": t("recherche.kein_treffer", lang),
            "herkunft": "ki-fallback",
            "quelle": "kein Suchbegriff",
            "konfidenz": "niedrig",
            "widerspruch": False,
            "online": False,
            "nurDeutsch": True,
        })
    result = recherche.recherche(frage=frage, kontext=kontext, lang=lang)
    return jsonify(result)


# ─── Stufe 3: Rückruf (PROJ-19) ──────────────────────────────────────────────


@app.get("/api/rueckruf")
def api_rueckruf():
    """PROJ-19 — Rückruf/Sicherheitsmangel-Check.

    Query optional: ?modell=&kat=
    → {hit, art, grund, quelle, stand, gueltigBis, vorgehen, modellUnsicher}
    """
    modell = _q("modell")
    kat = _q("kat")
    rueckruf_eintrag = wissensbasis.find_rueckruf(modell=modell, kat=kat)
    if rueckruf_eintrag is None:
        return jsonify({
            "hit": False,
            "art": "",
            "grund": "",
            "quelle": "",
            "stand": "",
            "gueltigBis": "",
            "vorgehen": "",
            "modellUnsicher": False,
        })
    return jsonify({
        "hit": True,
        "art": rueckruf_eintrag.get("art", "rueckruf"),
        "grund": rueckruf_eintrag.get("grund", ""),
        "quelle": rueckruf_eintrag.get("quelle", ""),
        "stand": rueckruf_eintrag.get("stand", ""),
        "gueltigBis": rueckruf_eintrag.get("gueltigBis", ""),
        "vorgehen": rueckruf_eintrag.get("vorgehen", ""),
        "modellUnsicher": bool(rueckruf_eintrag.get("modellUnsicher", False)),
    })


# ─── Stufe 3: Mehrfachdefekte (PROJ-21) ──────────────────────────────────────


@app.post("/api/bewertung/gesamt")
def api_bewertung_gesamt():
    """PROJ-21 — Gesamt-Fazit für Mehrfachdefekte.

    Body: {defekte:[{id, name, lights:[4], recommend}]}
    → {einzel:[...], gesamtFazit:{...}} | gesamtFazit:null wenn <2 Defekte
    """
    payload = request.get_json(silent=True) or {}
    defekte = payload.get("defekte")
    if not isinstance(defekte, list):
        defekte = []
    result = bewertung.gesamt_fazit(defekte)
    if result is None:
        return jsonify({"einzel": defekte, "gesamtFazit": None})
    return jsonify(result)


# ─── Stufe 3: Consent (PROJ-22) ──────────────────────────────────────────────


@app.get("/api/consent/text")
def api_consent_text():
    """PROJ-22 — Consent-Gate-Text in gewählter Sprache.

    Query optional: ?lang=de|en
    """
    lang = str(request.args.get("lang") or "de").strip().lower()
    if lang not in ("de", "en"):
        lang = "de"
    return jsonify(consent.consent_text(lang))


@app.post("/api/vorgang/<vid>/consent")
def api_vorgang_consent(vid: str):
    """PROJ-22 — Consent-Status im Vorgang setzen.

    Body: {status:"erteilt|abgelehnt|widerrufen"}
    Mergt nur consent={status,zeitpunkt} (Server-Zeit) — übrige Felder unberührt.
    Bei Widerruf: bereits erzeugten Schwungrad-Beitrag invalidieren.
    """
    payload = request.get_json(silent=True) or {}
    status = str(payload.get("status") or "").strip().lower()

    vorgang = consent.setze_consent(vid, status)
    if vorgang is None:
        return jsonify({"error": "Vorgang nicht gefunden oder ungültiger Status", "id": vid}), 404

    # Widerruf → Schwungrad-Beitrag invalidieren
    if status == "widerrufen":
        state = vorgang.get("state") or {}
        schwungrad_state = state.get("schwungrad") or {}
        beitrag_id = str(schwungrad_state.get("beitragId") or "")
        if beitrag_id:
            wissensbasis.invalidiere_entwurf(beitrag_id)

    return jsonify(vorgang)


# ─── Stufe 3: Schwungrad (PROJ-23) ────────────────────────────────────────────


@app.get("/api/schwungrad/grobgate")
def api_schwungrad_grobgate():
    """PROJ-23 — dokumentiertes Grob-Gate-Ergebnis."""
    return jsonify(schwungrad.grob_gate())


@app.post("/api/schwungrad/beitrag")
def api_schwungrad_beitrag():
    """PROJ-23 — anonymisierten Wissensbasis-Entwurf aus Vorgang erstellen.

    Body: {vorgangId}
    → {beitragId, ausgeschlossen:[...], ohneEinwilligung:bool}
    """
    payload = request.get_json(silent=True) or {}
    vid = str(payload.get("vorgangId") or "").strip()
    if not vid:
        return jsonify({"beitragId": "", "ausgeschlossen": [], "ohneEinwilligung": True})
    vorgang = store.get_vorgang(vid)
    if vorgang is None:
        return jsonify({"beitragId": "", "ausgeschlossen": [], "ohneEinwilligung": True})
    result = schwungrad.build_beitrag(vorgang)
    return jsonify(result)


@app.post("/api/anonymisieren")
def api_anonymisieren():
    """PROJ-23 — Text anonymisieren (Hilfs-Endpunkt).

    Body: {text}
    → {text, entfernt:["e-mail","telefon",…]}
    """
    payload = request.get_json(silent=True) or {}
    text = str(payload.get("text") or "")
    clean, entfernt = anonymisierung.anonymisiere_text(text)
    return jsonify({"text": clean, "entfernt": entfernt})


# ─── Stufe 3: Medien (PROJ-27) ────────────────────────────────────────────────


@app.post("/api/vorgang/<vid>/medien")
def api_vorgang_medien(vid: str):
    """PROJ-27 — Medium am Vorgang speichern.

    multipart (file) oder JSON (dataUrl, art).
    → {id, art, ref, hinweis} | {hinweis:"..."} bei Fehler
    """
    vorgang = store.get_vorgang(vid)
    if vorgang is None:
        return jsonify({"error": "Vorgang nicht gefunden", "id": vid}), 404

    art = "foto"
    data = None

    # multipart/form-data
    if request.files:
        f = request.files.get("file")
        if f:
            data = f.read()
            mime = f.content_type or ""
            if "video" in mime:
                art = "video"
            elif "audio" in mime:
                art = "audio"
            else:
                art = "foto"
    else:
        payload = request.get_json(silent=True) or {}
        data = payload.get("dataUrl") or payload.get("data")
        art = str(payload.get("art") or "foto").strip().lower()

    result = multimodal.save_medium(data=data, art=art)
    if not result.get("id"):
        return jsonify(result)  # hinweis enthalten, 200

    # Vorgang aktualisieren: Medium in state.medien eintragen
    state = vorgang.get("state") or {}
    medien = state.get("medien") if isinstance(state.get("medien"), list) else []
    medien.append({
        "id": result["id"],
        "art": result["art"],
        "ref": result["ref"],
        "hinweis": result.get("hinweis", ""),
    })
    state["medien"] = medien
    store.save_vorgang(vid, state)

    return jsonify(result)


@app.get("/media/<mid>")
def api_media_get(mid: str):
    """PROJ-27 — gespeichertes Medium abrufen."""
    result = multimodal.get_medium(mid)
    if result is None:
        return jsonify({"error": "Medium nicht gefunden", "id": mid}), 404
    data_bytes, content_type = result
    return Response(data_bytes, content_type=content_type)


@app.post("/api/transkription")
def api_transkription():
    """PROJ-27 — Audio-Transkription (optional).

    Body: Rohdaten-Audio oder multipart.
    → {text, source:"whisper|hinweis", hinweis?}
    """
    audio_bytes = None
    if request.files:
        f = request.files.get("file") or request.files.get("audio")
        if f:
            audio_bytes = f.read()
    elif request.data:
        audio_bytes = request.data

    result = multimodal.transkribiere(audio_bytes)
    return jsonify(result)


# ─── Stufe 3: Lotse (PROJ-18) ────────────────────────────────────────────────


@app.get("/api/lotse/route")
def api_lotse_route_get():
    """PROJ-18 — nächste Rolle + Steueroptionen aus Vorgangsstand.

    Query: ?v=<vid>
    → {naechsteRolle, steueroptionen:[...], handoffGraph, abschnitt}
    Protokolliert keine Daten (read-only Sicht).
    """
    vid = request.args.get("v") or ""
    state: dict = {}
    if vid:
        vorgang = store.get_vorgang(vid)
        if vorgang:
            state = vorgang.get("state") or {}

    lang = str(state.get("lang") or request.args.get("lang") or "de").strip().lower()
    if lang not in ("de", "en"):
        lang = "de"

    naechste = lotse.naechste_rolle(state)
    optionen = lotse.steueroptionen(state, lang=lang)
    abschnitt = lotse.abschnitt_aus_state(state)

    return jsonify({
        "naechsteRolle": naechste,
        "steueroptionen": optionen,
        "handoffGraph": lotse.HANDOFF_GRAPH,
        "abschnitt": abschnitt,
    })


@app.post("/api/lotse/route")
def api_lotse_route_post():
    """PROJ-18 — Routing-/Abbruch-Entscheidung ins decisionLog eintragen.

    Body: {vorgangId, ereignis:"weiter|wechsel|abbruch|rolle-ergebnislos", ziel?}
    → {naechsteRolle, steueroptionen, vorgang}
    """
    payload = request.get_json(silent=True) or {}
    vid = str(payload.get("vorgangId") or "").strip()
    ereignis = str(payload.get("ereignis") or "weiter").strip().lower()
    ziel = payload.get("ziel")
    if ziel:
        ziel = str(ziel).strip()

    vorgang = None
    state: dict = {}
    if vid:
        vorgang = store.get_vorgang(vid)
        if vorgang:
            state = vorgang.get("state") or {}

    # Log-Eintrag in decisionLog
    log_eintrag = lotse.routing_log_eintrag(state, ereignis, ziel)
    decision_log = state.get("decisionLog") if isinstance(state.get("decisionLog"), list) else []
    decision_log.append(log_eintrag)
    state["decisionLog"] = decision_log

    if vid and vorgang:
        vorgang = store.save_vorgang(vid, state)
        state = (vorgang or {}).get("state") or state

    lang = str(state.get("lang") or "de").strip().lower()
    if lang not in ("de", "en"):
        lang = "de"

    naechste = lotse.naechste_rolle(state)
    optionen = lotse.steueroptionen(state, lang=lang)

    return jsonify({
        "naechsteRolle": naechste,
        "steueroptionen": optionen,
        "vorgang": vorgang,
    })


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
