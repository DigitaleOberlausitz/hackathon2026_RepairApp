# webapp/tests/test_roles.py
from repair import roles

def test_katalog_enthaelt_alle_14_rollen():
    katalog = roles.katalog()
    namen = {r["name"] for r in katalog}
    erwartet = {
        "lotse", "aufnahme", "diagnose", "bewertung", "abwaegung",
        "begleitung", "wirkung", "produktsuche", "entsorgung",
        "recherche", "vermittlung", "beschaffung", "protokoll", "wissensbasis",
    }
    assert erwartet <= namen

def test_katalog_eintrag_hat_name_description_class():
    eintrag = next(r for r in roles.katalog() if r["name"] == "lotse")
    assert eintrag["description"]
    assert eintrag["class"] == "orchestrierung"

def test_lade_rolle_liefert_volltext_ohne_frontmatter():
    body = roles.lade_rolle("lotse")
    assert "# Rolle" in body
    assert not body.lstrip().startswith("---")  # Frontmatter abgetrennt

def test_lade_rolle_unbekannt_wirft():
    import pytest
    with pytest.raises(KeyError):
        roles.lade_rolle("gibtsnicht")
