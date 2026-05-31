from repair import tools


def test_tool_specs_enthalten_kern_tools():
    namen = {t["function"]["name"] for t in tools.specs()}
    assert {"lade_rolle", "zeige_karte", "finde_anbieter",
            "suche_ersatzteil", "finde_foerderung", "finde_entsorgung",
            "recherche"} <= namen


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
