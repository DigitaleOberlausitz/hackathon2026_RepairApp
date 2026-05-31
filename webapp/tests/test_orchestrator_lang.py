from repair import orchestrator


def test_prefix_stabil_pro_sprache():
    assert orchestrator.system_prefix("de") == orchestrator.system_prefix("de")
    assert orchestrator.system_prefix("en") == orchestrator.system_prefix("en")


def test_prefix_unterscheidet_sprachen():
    assert orchestrator.system_prefix("de") != orchestrator.system_prefix("en")
