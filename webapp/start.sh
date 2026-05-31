#!/usr/bin/env bash
#
# start.sh — startet die Reparatur-Helfer Web-App mit einem Befehl.
#
# Erledigt der Reihe nach die Schritte aus der README:
#   1. virtuelle Umgebung (.venv) anlegen, falls noch nicht vorhanden
#   2. Abhängigkeiten aus requirements.txt installieren
#   3. .env aus .env.example anlegen, falls noch nicht vorhanden (Hinweis auf Key)
#   4. App starten  → http://127.0.0.1:5000  (bzw. HOST/PORT aus .env)
#
# Aufruf:  cd webapp && ./start.sh
#
set -euo pipefail

# --- ins Verzeichnis des Scripts wechseln --------------------------------------
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

VENV_DIR="${SCRIPT_DIR}/.venv"
ENV_FILE="${SCRIPT_DIR}/.env"
ENV_EXAMPLE="${SCRIPT_DIR}/.env.example"

# --- Python finden -------------------------------------------------------------
PYTHON_BIN="${PYTHON_BIN:-python3}"
if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
  echo "✗ '${PYTHON_BIN}' ist nicht installiert." >&2
  exit 3
fi

# --- 1. virtuelle Umgebung anlegen ---------------------------------------------
if [[ ! -d "${VENV_DIR}" ]]; then
  echo "→ Lege virtuelle Umgebung an (.venv) …"
  "${PYTHON_BIN}" -m venv "${VENV_DIR}"
else
  echo "→ Virtuelle Umgebung (.venv) ist vorhanden."
fi

# venv aktivieren
# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"

# --- 2. Abhängigkeiten installieren --------------------------------------------
echo "→ Installiere/aktualisiere Abhängigkeiten (requirements.txt) …"
pip install --quiet --upgrade pip
pip install --quiet -r "${SCRIPT_DIR}/requirements.txt"

# --- 3. .env anlegen, falls nötig ----------------------------------------------
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "→ Keine .env gefunden — lege sie aus .env.example an …"
  cp "${ENV_EXAMPLE}" "${ENV_FILE}"
  echo
  echo "  ⚠ Bitte den OpenAI-Key in ${ENV_FILE} eintragen:"
  echo "      OPENAI_API_KEY=sk-..."
  echo "    Ohne Key startet der Server, aber die Diagnose liefert HTTP 503 (no_backend)."
  echo
fi

# --- 4. App starten ------------------------------------------------------------
echo "→ Starte die App  (Strg+C zum Beenden) …"
echo
exec "${PYTHON_BIN}" "${SCRIPT_DIR}/app.py"
