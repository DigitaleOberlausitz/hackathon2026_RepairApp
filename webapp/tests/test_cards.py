import pytest
from repair import cards

def test_bekannte_typen_vorhanden():
    assert {"aufnahme", "diagnose", "ampel", "vergleich", "schritte",
            "hinweis", "anbieter", "ersatzteil", "erfolg"} <= set(cards.TYPEN)

def test_ampel_valide_karte():
    daten = {
        "achsen": {"sicherheit": "gruen", "komplexitaet": "gelb",
                   "kosten": "gruen", "machbarkeit": "gruen"},
        "gesamt": "gruen",
        "begruendung": "Nur Stecker ziehen nötig.",
        "trust": {"level": "hoch", "quelle": "kuratiert",
                  "konfidenz": "hoch", "hinweis": "KI kann Fehler machen."},
    }
    karte = cards.validate("ampel", daten)
    assert karte["typ"] == "ampel"
    assert karte["daten"]["gesamt"] == "gruen"

def test_ampel_ungueltiger_level_wirft():
    daten = {
        "achsen": {"sicherheit": "blau", "komplexitaet": "gelb",
                   "kosten": "gruen", "machbarkeit": "gruen"},
        "gesamt": "gruen", "begruendung": "x",
        "trust": {"level": "hoch", "quelle": "k", "konfidenz": "hoch", "hinweis": "h"},
    }
    with pytest.raises(cards.CardValidationError):
        cards.validate("ampel", daten)

def test_unbekannter_typ_wirft():
    with pytest.raises(cards.CardValidationError):
        cards.validate("gibtsnicht", {})

def test_diagnose_unklar_pfad():
    # D20: unklar-Pfad muss abbildbar sein
    daten = {"kandidaten": [], "abgrenzungsfragen": [], "unklar": True,
             "trust": {"level": "niedrig", "quelle": "KI-Fallback",
                       "konfidenz": "niedrig", "hinweis": "KI kann Fehler machen."}}
    karte = cards.validate("diagnose", daten)
    assert karte["daten"]["unklar"] is True

def test_frage_typ_vorhanden_und_valide():
    assert "frage" in cards.TYPEN
    daten = {
        "frage": "Leuchtet beim Einschalten eine LED?",
        "feld": "symptom",
        "optionen": ["Ja, grün", "Ja, blinkt rot", "Nein, nichts"],
        "mehrfachauswahl": False,
        "freitext_erlaubt": True,
        "bild_erlaubt": True,
    }
    karte = cards.validate("frage", daten)
    assert karte["typ"] == "frage"
    assert karte["daten"]["optionen"][1] == "Ja, blinkt rot"

def test_frage_braucht_fragetext():
    with pytest.raises(cards.CardValidationError):
        cards.validate("frage", {"optionen": ["a", "b"]})  # 'frage' fehlt → ungültig
