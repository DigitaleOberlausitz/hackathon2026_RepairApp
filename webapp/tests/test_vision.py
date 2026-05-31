"""Tests für PROJ-31 — Vision-Diagnose aus Foto & Dokument.

Deckt die Akzeptanzkriterien ab, die ohne echtes LLM-Backend prüfbar sind:

* **Extraktion (Stufe 1):** Normalisierung (Halluzinationen/leere Felder raus),
  Degradation ohne Vision-Backend / ohne Medien, PDF→Seitenbild-Konvertierung
  inkl. Seiten-Kürzungs-Hinweis.
* **Diagnose (Stufe 2):** bestätigte Felder fließen als Kontext ein; der Vermerk
  ``diagnosis.vision`` erscheint NUR bei Bild/Extraktion (Text-only bleibt exakt
  wie zuvor — Schema unverändert). Bild-Evidenz wird als multimodaler Inhalt
  gesendet.
* **Datenschutz:** der Vision-Kontext enthält nur Fachfelder, keinen Rohtext.
* **Konfiguration (PROJ-30):** neue Limits sind Fail-fast-validiert.
* **Endpunkte:** ``/api/extrahieren`` ist immer HTTP 200; ``/api/diagnose`` ohne
  Bild verhält sich unverändert.

Lauffähig ohne pytest:  ``python tests/test_vision.py``
Mit pytest:             ``python -m pytest tests/test_vision.py``
"""

from __future__ import annotations

import io
import json
import os
import sys

WEBAPP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if WEBAPP not in sys.path:
    sys.path.insert(0, WEBAPP)

# Backend-Variablen für deterministische Tests entfernen.
for _k in ("OPENAI_API_KEY", "OLLAMA_BASE_URL"):
    os.environ.pop(_k, None)

import app  # noqa: E402
from repair import ai, config, multimodal, vision  # noqa: E402


# ── Test-PDF-Helfer ───────────────────────────────────────────────────────────
def _make_pdf(seiten: int) -> bytes | None:
    try:
        import fitz
    except Exception:
        return None
    doc = fitz.open()
    for i in range(seiten):
        page = doc.new_page()
        page.insert_text((72, 72), f"Rechnung Seite {i + 1} — Modell XZ-100, Kauf 01.02.2020")
    data = doc.tobytes()
    doc.close()
    return data


# ── Fake-LLM-Backend (für die Stufe-2-Logik ohne echten Call) ─────────────────
_VALID_DEVICE = {
    "name": "Waschmaschine", "emoji": "🧺", "blurb": "Pumpt nicht ab",
    "accentPath": "gut", "recommend": "self",
    "lights": [
        {"key": "Sicherheit", "level": "gut"}, {"key": "Aufwand", "level": "mittel"},
        {"key": "Kosten", "level": "gut"}, {"key": "Machbarkeit", "level": "gut"},
    ],
    "confidence": {"level": "hoch", "source": "Foto", "note": ""},
    "steps": [{"title": "Sieb prüfen", "beginner": "Flusensieb reinigen.", "pro": "Sieb."}],
}


class _FakeMsg:
    def __init__(self, content):
        self.content = content


class _FakeChoice:
    def __init__(self, content):
        self.message = _FakeMsg(content)


class _FakeResponse:
    def __init__(self, content):
        self.choices = [_FakeChoice(content)]
        self.usage = None


class _FakeCompletions:
    def __init__(self, sink):
        self._sink = sink

    def create(self, **kwargs):
        self._sink.append(kwargs)  # gesendete messages mitschneiden
        return _FakeResponse(json.dumps(_VALID_DEVICE, ensure_ascii=False))


class _FakeChat:
    def __init__(self, sink):
        self.completions = _FakeCompletions(sink)


class _FakeClient:
    def __init__(self, sink):
        self.chat = _FakeChat(sink)


def _patch_backend(monkeypatchish_sink):
    """Ersetzt die Backend-Auflösung durch ein Fake-Backend; gibt eine
    Restore-Funktion zurück. (Kein pytest nötig.)"""
    orig_resolve = ai._resolve_backend
    client = _FakeClient(monkeypatchish_sink)

    def fake_resolve():
        # OpenAI-only: _resolve_backend liefert (client, model) — 2-Tupel.
        return client, "fake-model"

    ai._resolve_backend = fake_resolve
    return lambda: setattr(ai, "_resolve_backend", orig_resolve)


# ── Stufe 1: Normalisierung ───────────────────────────────────────────────────
def test_normalisiere_entfernt_halluzination_und_leere() -> None:
    raw = {
        "kategorie": {"wert": "Waschmaschine", "konfidenz": "hoch", "erkannt": True},
        "modell": {"wert": "", "erkannt": True},          # leer trotz erkannt → erkannt False
        "schaeden": [{"wert": "Riss"}, {"wert": ""}, "lose Schraube"],
        "kaufdatum": {"wert": "01.02.2020", "konfidenz": "quatsch", "erkannt": True},
        "haendler": {"erkannt": False},
        "hinweise": ["Sieb reinigen", ""],
    }
    f = vision.normalisiere_felder(raw)
    assert f["kategorie"]["erkannt"] and f["kategorie"]["wert"] == "Waschmaschine"
    assert f["modell"]["erkannt"] is False and f["modell"]["wert"] == ""
    assert len(f["schaeden"]) == 2                          # leeres rausgefiltert
    assert f["kaufdatum"]["konfidenz"] == "mittel"          # ungültige Konfidenz → mittel
    assert len(f["hinweise"]) == 1


def test_leere_felder_und_nichts_erkannt() -> None:
    f = vision.leere_felder()
    assert vision._nichts_erkannt(f) is True
    f["kategorie"]["wert"] = "Toaster"
    f["kategorie"]["erkannt"] = True
    assert vision._nichts_erkannt(f) is False


# ── Stufe 1: Degradation (scheitert nie hart) ─────────────────────────────────
def test_extrahiere_ohne_medien() -> None:
    r = vision.extrahiere([])
    assert r["source"] == "keine_medien" and r["nichtsErkannt"] is True
    assert r["felder"] == vision.leere_felder()


def test_extrahiere_ohne_vision_backend_aber_mit_bild() -> None:
    pdf = _make_pdf(1)
    if pdf is None:
        print("  (übersprungen: PyMuPDF nicht installiert)")
        return
    res = multimodal.save_medium(pdf, art="dokument", mime="application/pdf")
    r = vision.extrahiere([res])
    assert r["source"] == "no_vision_backend" and r["bildAnzahl"] == 1
    assert r["nichtsErkannt"] is True


# ── Stufe 1: PDF-Konvertierung + Kürzungs-Hinweis ─────────────────────────────
def test_pdf_konvertierung_und_kuerzung() -> None:
    pdf = _make_pdf(3)
    if pdf is None:
        print("  (übersprungen: PyMuPDF nicht installiert)")
        return
    res = multimodal.save_medium(pdf, art="dokument", mime="application/pdf")
    assert res["mime"] == "application/pdf"

    urls, hinweise = vision.bilder_aus_medien([res], max_pdf_seiten=2)
    assert len(urls) == 2 and all(u.startswith("data:image/png;base64,") for u in urls)
    assert any("3 Seiten" in h for h in hinweise)

    urls_all, hin_all = vision.bilder_aus_medien([res], max_pdf_seiten=5)
    assert len(urls_all) == 3 and not hin_all


def test_get_medium_data_url() -> None:
    res = multimodal.save_medium(b"\x89PNG\r\n\x1a\n_fake", art="foto", mime="image/png")
    url = multimodal.get_medium_data_url(res["id"])
    assert url and url.startswith("data:image/png;base64,")
    assert multimodal.get_medium_data_url("gibtsnicht") is None


# ── Stufe 2: Vision-Kontext (Datenschutz: nur Fachfelder) ─────────────────────
def test_vision_kontext_nur_fachfelder() -> None:
    felder = vision.leere_felder()
    felder["kategorie"] = {"wert": "Waschmaschine", "konfidenz": "hoch", "erkannt": True}
    felder["kaufdatum"] = {"wert": "01.02.2020", "konfidenz": "mittel", "erkannt": True}
    felder["schaeden"] = [{"wert": "Riss an der Tür", "konfidenz": "mittel"}]
    ctx = vision.baue_vision_kontext({"felder": felder})
    assert "Waschmaschine" in ctx and "01.02.2020" in ctx and "Riss an der Tür" in ctx
    assert "Vorrang" in ctx           # bestätigte Felder sind verbindlich
    # Leere Felder → leerer Kontext (Diagnose verhält sich wie ohne Bild)
    assert vision.baue_vision_kontext(vision.leere_felder()) == ""
    assert vision.baue_vision_kontext({}) == ""


# ── Stufe 2: Vermerk diagnosis.vision nur bei Bild/Extraktion ──────────────────
# Hinweis: Die früheren ai.diagnose-Vision-Tests (Text/Extraktion/Bild) entfielen
# mit dem harten Schnitt (PROJ-37): ai.diagnose existiert nicht mehr. Die Vision-
# Auswertung ist jetzt das Orchestrator-Tool `extrahiere_aus_medien` (PROJ-31 im
# Chat-Flow) und wird in tests/test_tools.py / test_orchestrator_* abgedeckt.


# ── Konfiguration (PROJ-30) ───────────────────────────────────────────────────
def test_neue_config_defaults() -> None:
    assert config.max_medien_pro_anfrage() == 6
    assert config.max_pdf_seiten() == 5
    assert config.vision_model() is None  # ungesetzt → backend-spezifischer Default


def test_config_fail_fast_neue_limits() -> None:
    for name, bad in (("MAX_MEDIEN_PRO_ANFRAGE", "0"), ("MAX_PDF_SEITEN", "abc")):
        old = os.environ.get(name)
        os.environ[name] = bad
        try:
            raised = False
            try:
                config.validate()
            except config.ConfigError as exc:
                raised = name in str(exc)
            assert raised, f"{name}={bad} hätte Fail-fast auslösen müssen"
        finally:
            if old is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = old


# ── Endpunkte ──────────────────────────────────────────────────────────────────
def test_endpoint_extrahieren_immer_200() -> None:
    c = app.app.test_client()
    r = c.post("/api/extrahieren", json={"medienIds": ["unbekannt"]})
    assert r.status_code == 200 and r.get_json()["source"] == "keine_medien"


def test_endpoint_medien_pdf_dokument() -> None:
    pdf = _make_pdf(1)
    if pdf is None:
        print("  (übersprungen: PyMuPDF nicht installiert)")
        return
    c = app.app.test_client()
    vid = c.post("/api/vorgang", json={}).get_json()["vorgang_id"]
    r = c.post(
        f"/api/vorgang/{vid}/medien",
        data={"file": (io.BytesIO(pdf), "rechnung.pdf", "application/pdf"), "art": "dokument"},
        content_type="multipart/form-data",
    )
    j = r.get_json()
    assert j["id"] and j["art"] == "dokument" and j["mime"] == "application/pdf"


# ── Standalone-Runner ──────────────────────────────────────────────────────────
def _run_standalone() -> int:
    tests = [v for k, v in sorted(globals().items())
             if k.startswith("test_") and callable(v)]
    fails = 0
    for t in tests:
        try:
            t()
            print(f"  ok   {t.__name__}")
        except AssertionError as exc:
            fails += 1
            print(f"  FAIL {t.__name__}\n       {exc}")
        except Exception as exc:  # noqa: BLE001
            fails += 1
            print(f"  ERR  {t.__name__}\n       {type(exc).__name__}: {exc}")
    print(f"\n{len(tests) - fails}/{len(tests)} Checks bestanden.")
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(_run_standalone())
