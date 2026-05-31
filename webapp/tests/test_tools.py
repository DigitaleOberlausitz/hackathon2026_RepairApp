from repair import tools


def test_tool_specs_enthalten_kern_tools():
    namen = {t["function"]["name"] for t in tools.specs()}
    assert {"lade_rolle", "zeige_karte", "finde_anbieter",
            "suche_ersatzteil", "finde_foerderung", "finde_entsorgung",
            "recherche", "extrahiere_aus_medien"} <= namen


def test_dispatch_extrahiere_aus_medien_unbekannte_medien():
    # PROJ-31 im Chat-Flow: unbekannte/leere Medien → scheitert nie hart,
    # liefert ein Vision-Ergebnis-Objekt mit source-Kennzeichnung ans Modell.
    import json
    res = tools.dispatch("extrahiere_aus_medien",
                         {"medienIds": ["gibtsnicht"]}, vorgang_id="v1")
    assert "content" in res
    daten = json.loads(res["content"])
    assert daten["source"] in ("keine_medien", "no_vision_backend", "vision_error")
    assert "felder" in daten


def test_dispatch_lade_rolle():
    res = tools.dispatch("lade_rolle", {"name": "lotse"}, vorgang_id="v1")
    assert "# Rolle" in res["content"]


def test_dispatch_zeige_karte_valide():
    daten = {"art": "sicherheit", "text": "Stecker ziehen.", "schwere": "warnung"}
    res = tools.dispatch("zeige_karte", {"typ": "hinweis", "daten": daten}, vorgang_id="v1")
    assert res["karte"]["typ"] == "hinweis"


def test_dispatch_zeige_karte_ungueltig_liefert_fehler_statt_exception():
    res = tools.dispatch("zeige_karte", {"typ": "ampel", "daten": {}}, vorgang_id="v1")
    assert res["error"]  # Fehler-Ergebnis ans Modell, keine Exception


def test_dispatch_unbekanntes_tool():
    res = tools.dispatch("gibtsnicht", {}, vorgang_id="v1")
    assert res["error"]
