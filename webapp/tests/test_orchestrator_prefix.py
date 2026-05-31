from repair import orchestrator


def test_system_prefix_ist_stabil():
    a = orchestrator.system_prefix()
    b = orchestrator.system_prefix()
    assert a == b  # byte-identisch -> Prefix-Cache greift


def test_system_prefix_enthaelt_katalog_und_leitlinien():
    p = orchestrator.system_prefix()
    text = "\n".join(m["content"] for m in p)
    assert "warnen statt sperren" in text.lower()
    assert "lotse" in text.lower()           # Rollen-Katalog
    assert "diagnose" in text.lower()
    assert "kann fehler machen" in text.lower()  # Vertrauens-Indikator


def test_system_prefix_fordert_einzelne_frage_karten():
    # Rückfragen einzeln als frage-Karte, nicht als nummerierte Liste.
    text = "\n".join(m["content"] for m in orchestrator.system_prefix()).lower()
    assert "frage" in text
    assert "einzeln" in text  # Anweisung: Rückfragen EINZELN stellen
