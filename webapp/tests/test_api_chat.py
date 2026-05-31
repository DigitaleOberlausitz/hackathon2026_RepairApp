import json
import app as flask_app
from repair import orchestrator


def _client():
    flask_app.app.config["TESTING"] = True
    return flask_app.app.test_client()


def test_vorgang_anlegen():
    res = _client().post("/api/vorgang")
    assert res.status_code == 200
    assert res.get_json()["vorgang_id"]


def test_chat_turn(monkeypatch):
    def fake_run_turn(state, text, **kw):
        return {"antwort_text": "Hallo!", "karten": [], "abgebrochen": False}
    monkeypatch.setattr(orchestrator, "run_turn", fake_run_turn)
    c = _client()
    vid = c.post("/api/vorgang").get_json()["vorgang_id"]
    res = c.post("/api/chat", json={"vorgang_id": vid, "text": "Toaster kaputt"})
    assert res.status_code == 200
    assert res.get_json()["antwort_text"] == "Hallo!"


def test_chat_leerer_text_400():
    c = _client()
    vid = c.post("/api/vorgang").get_json()["vorgang_id"]
    res = c.post("/api/chat", json={"vorgang_id": vid, "text": "  "})
    assert res.status_code == 400
    assert res.get_json()["code"] == "empty"


def test_diagnose_route_entfernt():
    res = _client().post("/api/diagnose", json={"text": "x"})
    assert res.status_code == 404


def test_chat_uebernimmt_medienids_in_state(monkeypatch):
    # PROJ-31 im Chat-Flow: medienIds landen im Vorgangs-State (für extrahiere_aus_medien).
    gesehen = {}

    def fake_run_turn(state, text, **kw):
        gesehen["medien"] = list(state.get("medien") or [])
        return {"antwort_text": "ok", "karten": [], "abgebrochen": False}

    monkeypatch.setattr(orchestrator, "run_turn", fake_run_turn)
    c = _client()
    vid = c.post("/api/vorgang").get_json()["vorgang_id"]
    res = c.post("/api/chat", json={"vorgang_id": vid, "text": "Foto anbei",
                                    "medienIds": ["m1", "m2"]})
    assert res.status_code == 200
    assert gesehen["medien"] == ["m1", "m2"]
