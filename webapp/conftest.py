import os
import sys

sys.path.insert(0, os.path.dirname(__file__))  # FIX S4: 'repair'/'app' importierbar

import pytest


@pytest.fixture(autouse=True)
def _tmp_db(monkeypatch, tmp_path):
    """FIX S5: store.DB_PATH auf tmp-DB lenken (keine Nebenwirkung auf vorgaenge.db)."""
    from repair import store
    monkeypatch.setattr(store, "DB_PATH", str(tmp_path / "test_vorgaenge.db"), raising=False)
    yield
