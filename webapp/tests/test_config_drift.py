"""Drift- & Hardcode-Guard für die Konfiguration (PROJ-30).

Sichert die Regel „Konfiguration ausschließlich über `.env`" dauerhaft ab:

1. **Drift in beide Richtungen** zwischen `webapp/.env.example` und dem Code:
   - jede vom Code gelesene Umgebungsvariable ist in `.env.example` dokumentiert
     (aktiv *oder* auskommentiert), und
   - jede **aktive** (nicht auskommentierte) Variable in `.env.example` wird vom
     Code auch tatsächlich gelesen. Auskommentierte „noch nicht aktiv"-Platzhalter
     (z. B. VISION_MODEL/EMBED_MODEL) sind bewusst ausgenommen.

2. **Verbotene Hardcode-Muster** in `webapp/` — wörtliche `host=`/`port=`-Literale
   in `app.run(...)`, eingebettete `http(s)://`-Endpunkte und wörtliche Modellnamen
   (`whisper-1`/`gpt-…`/`qwen…`) außerhalb der zentralen `DEFAULT_*`-Konstanten in
   `repair/config.py`. Bewusste Ausnahmen sind explizit allowlisted (s. u.).

3. **Fail-fast**: syntaktisch ungültige Werte (PORT=abc, PORT=99999, LLM_TIMEOUT=xyz,
   MAX_UPLOAD_BYTES=-1) führen beim Start zu einem klaren Abbruch; fehlende Werte
   fallen still auf den Default zurück.

Lauffähig ohne pytest:  ``python tests/test_config_drift.py``
Mit pytest:             ``python -m pytest tests/test_config_drift.py``
"""

from __future__ import annotations

import os
import re
import sys

WEBAPP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if WEBAPP not in sys.path:
    sys.path.insert(0, WEBAPP)

from repair import config  # noqa: E402

ENV_EXAMPLE = os.path.join(WEBAPP, ".env.example")

# Verzeichnisse, die nicht gescannt werden.
_SKIP_DIRS = {".venv", "__pycache__", "tests", ".git", "logs", "media", "protokolle"}

# Kuratierte Demodaten-Module mit bewusst eingebetteten Quellen-/Anbieter-URLs.
_URL_ALLOWLIST = {
    "foerderung.py", "anbieter.py", "entsorgung.py", "ersatzteile.py", "produktsuche.py",
}

# Variablennamen, die der Code über os.environ ODER über die zentralen
# config-Helfer (_raw/_int/_float_pos) liest.
_ENV_READ_RE = re.compile(
    r"""os\.environ\.get\(\s*["']([A-Z][A-Z0-9_]*)["']"""
    r"""|os\.environ\[\s*["']([A-Z][A-Z0-9_]*)["']"""
    r"""|_(?:raw|int|float_pos)\(\s*["']([A-Z][A-Z0-9_]*)["']"""
)

_MODEL_RE = re.compile(r"whisper-\d|gpt-[0-9a-z]|qwen[0-9]", re.IGNORECASE)
_URL_RE = re.compile(r"https?://")
_APP_RUN_HARDCODE_RE = re.compile(r"""\b(?:host|port)\s*=\s*["']?\d|host\s*=\s*["']""")


def _py_files() -> list[str]:
    files = []
    for root, dirs, names in os.walk(WEBAPP):
        dirs[:] = [d for d in dirs if d not in _SKIP_DIRS]
        for n in names:
            if n.endswith(".py"):
                files.append(os.path.join(root, n))
    return files


def _read(path: str) -> str:
    with open(path, encoding="utf-8") as f:
        return f.read()


def _code_only(src: str) -> str:
    """Entfernt Docstrings/Mehrzeilen-Strings und Kommentare, erhält Zeilennummern."""
    def _blank(m: re.Match) -> str:
        return "\n" * m.group(0).count("\n")

    src = re.sub(r'""".*?"""', _blank, src, flags=re.DOTALL)
    src = re.sub(r"'''.*?'''", _blank, src, flags=re.DOTALL)
    lines = [ln.split("#", 1)[0] for ln in src.splitlines()]
    return "\n".join(lines)


def _documented_vars() -> tuple[set[str], set[str]]:
    """(aktiv, auskommentiert) Variablennamen aus .env.example."""
    active, commented = set(), set()
    line_re = re.compile(r"^(#?)\s*([A-Z][A-Z0-9_]*)\s*=")
    for raw in _read(ENV_EXAMPLE).splitlines():
        m = line_re.match(raw.strip())
        if not m:
            continue
        (commented if m.group(1) else active).add(m.group(2))
    return active, commented


def _read_vars() -> set[str]:
    found: set[str] = set()
    for path in _py_files():
        for m in _ENV_READ_RE.finditer(_read(path)):
            found.add(next(g for g in m.groups() if g))
    return found


# ── Drift-Checks ──────────────────────────────────────────────────────────────
def test_alle_gelesenen_variablen_sind_dokumentiert() -> None:
    read = _read_vars()
    active, commented = _documented_vars()
    documented = active | commented
    fehlend = sorted(read - documented)
    assert not fehlend, (
        "Diese Variablen werden vom Code gelesen, fehlen aber in .env.example "
        f"(gelesen-aber-nicht-dokumentiert): {fehlend}"
    )


def test_alle_aktiven_variablen_werden_gelesen() -> None:
    read = _read_vars()
    active, _ = _documented_vars()
    ungelesen = sorted(active - read)
    assert not ungelesen, (
        "Diese Variablen stehen AKTIV in .env.example, werden aber nirgends gelesen "
        f"(dokumentiert-aber-nicht-gelesen — auskommentieren oder entfernen): {ungelesen}"
    )


# ── Hardcode-Guard ──────────────────────────────────────────────────────────────
def test_keine_hardcodierten_konfigurationswerte() -> None:
    verstoesse: list[str] = []
    for path in _py_files():
        base = os.path.basename(path)
        code = _code_only(_read(path))
        for lineno, line in enumerate(code.splitlines(), 1):
            if not line.strip():
                continue
            rel = os.path.relpath(path, WEBAPP)
            # 1) host=/port= als Literal in app.run(...)
            if "app.run(" in line and _APP_RUN_HARDCODE_RE.search(line):
                verstoesse.append(f"{rel}:{lineno}: hartkodierte(s) host/port in app.run(): {line.strip()}")
            # 2) eingebettete http(s)://-Endpunkte (außer kuratierte Demodaten)
            if base not in _URL_ALLOWLIST and _URL_RE.search(line):
                verstoesse.append(f"{rel}:{lineno}: eingebettete URL: {line.strip()}")
            # 3) wörtliche Modellnamen außerhalb der zentralen DEFAULT_*-Konstanten
            if _MODEL_RE.search(line) and base != "config.py" and not re.search(r"\bDEFAULT_[A-Z_]*\s*=", line):
                verstoesse.append(f"{rel}:{lineno}: hartkodierter Modellname: {line.strip()}")
    assert not verstoesse, "Verbotene Hardcode-Muster gefunden:\n  " + "\n  ".join(verstoesse)


# ── Fail-fast / Robustheit ─────────────────────────────────────────────────────
def _with_env(name: str, value, fn):
    """Setzt eine Variable temporär und stellt den Vorzustand wieder her."""
    old = os.environ.get(name)
    if value is None:
        os.environ.pop(name, None)
    else:
        os.environ[name] = value
    try:
        return fn()
    finally:
        if old is None:
            os.environ.pop(name, None)
        else:
            os.environ[name] = old


def _expect_config_error(name: str, value: str) -> None:
    def run():
        try:
            config.validate()
        except config.ConfigError as exc:
            assert name in str(exc), f"Meldung benennt die Variable {name} nicht: {exc}"
            return True
        return False
    assert _with_env(name, value, run), f"{name}={value!r} hätte Fail-fast auslösen müssen"


def test_fehlende_variablen_nutzen_defaults() -> None:
    def run():
        config.validate()  # darf NICHT werfen
        return (config.host(), config.port(), config.whisper_model(),
                config.max_upload_bytes(), config.llm_timeout())
    host, port, whisper, maxb, timeout = _with_env("PORT", None, run)
    assert (host, port, whisper, maxb, timeout) == (
        "127.0.0.1", 5000, "whisper-1", 10 * 1024 * 1024, 180.0)


def test_port_nicht_numerisch_failt() -> None:
    _expect_config_error("PORT", "abc")


def test_port_ausserhalb_bereich_failt() -> None:
    _expect_config_error("PORT", "99999")


def test_llm_timeout_ungueltig_failt() -> None:
    _expect_config_error("LLM_TIMEOUT", "xyz")


def test_max_upload_negativ_failt() -> None:
    _expect_config_error("MAX_UPLOAD_BYTES", "-1")


def test_werte_werden_getrimmt_und_entquotet() -> None:
    def run():
        config.validate()
        return config.port()
    assert _with_env("PORT", '" 8080 "', run) == 8080


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
    print(f"\n{len(tests) - fails}/{len(tests)} Checks bestanden.")
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(_run_standalone())
