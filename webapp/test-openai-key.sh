#!/usr/bin/env bash
#
# test-openai-key.sh — prüft, ob der hinterlegte OpenAI-Key funktioniert.
#
# Lädt OPENAI_API_KEY / OPENAI_MODEL aus webapp/.env (oder der aktuellen Umgebung)
# und macht zwei Checks gegen die echte OpenAI-API:
#   1. GET  /v1/models           — ist der Key überhaupt gültig (Authentifizierung)?
#   2. POST /v1/chat/completions — antwortet das konfigurierte Modell (gpt-4o-mini)?
#
# Beendet sich mit Exit-Code 0 bei Erfolg, sonst != 0.
#
# Aufruf:  cd webapp && ./test-openai-key.sh
#
set -euo pipefail

# --- ins Verzeichnis des Scripts wechseln, .env von dort laden -----------------
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [[ -f "${ENV_FILE}" ]]; then
  # nur einfache KEY=WERT-Zeilen aus .env übernehmen, Kommentare/Leerzeilen ignorieren
  while IFS='=' read -r key value; do
    case "${key}" in
      ''|\#*) continue ;;                       # Leerzeile / Kommentar
    esac
    key="${key// /}"                            # Whitespace ums Gleichheitszeichen weg
    value="${value%$'\r'}"                      # evtl. CR (Windows) entfernen
    export "${key}=${value}"
  done < "${ENV_FILE}"
fi

API_KEY="${OPENAI_API_KEY:-}"
MODEL="${OPENAI_MODEL:-gpt-4o-mini}"
BASE_URL="${OPENAI_BASE_URL:-https://api.openai.com}"

# --- Vorbedingungen ------------------------------------------------------------
if ! command -v curl >/dev/null 2>&1; then
  echo "✗ 'curl' ist nicht installiert." >&2
  exit 3
fi

if [[ -z "${API_KEY}" ]]; then
  echo "✗ Kein OPENAI_API_KEY gefunden." >&2
  echo "  → In ${ENV_FILE} eintragen:  OPENAI_API_KEY=sk-..." >&2
  exit 2
fi

echo "→ Key:    ${API_KEY:0:7}…${API_KEY: -4}   (Länge ${#API_KEY})"
echo "→ Modell: ${MODEL}"
echo "→ Host:   ${BASE_URL}"
echo

# --- Check 1: Key gültig? (Modell-Liste) ---------------------------------------
echo "1) Authentifizierung (GET /v1/models) …"
http_code=$(curl -sS -o /tmp/openai_models.json -w '%{http_code}' \
  -H "Authorization: Bearer ${API_KEY}" \
  "${BASE_URL}/v1/models" || true)

if [[ "${http_code}" != "200" ]]; then
  echo "   ✗ Key abgelehnt (HTTP ${http_code})."
  echo "     Antwort: $(head -c 400 /tmp/openai_models.json)"
  exit 1
fi
echo "   ✓ Key ist gültig."

# --- Check 2: Modell antwortet? (kleine Chat-Anfrage) --------------------------
echo "2) Chat-Test (POST /v1/chat/completions, model=${MODEL}) …"
read -r -d '' PAYLOAD <<JSON || true
{
  "model": "${MODEL}",
  "messages": [{"role": "user", "content": "Antworte mit genau dem Wort: OK"}],
  "max_tokens": 5,
  "temperature": 0
}
JSON

http_code=$(curl -sS -o /tmp/openai_chat.json -w '%{http_code}' \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}" \
  "${BASE_URL}/v1/chat/completions" || true)

if [[ "${http_code}" != "200" ]]; then
  echo "   ✗ Modell-Anfrage fehlgeschlagen (HTTP ${http_code})."
  echo "     Antwort: $(head -c 400 /tmp/openai_chat.json)"
  exit 1
fi

# Antworttext extrahieren — bevorzugt jq, sonst grep-Fallback
if command -v jq >/dev/null 2>&1; then
  reply=$(jq -r '.choices[0].message.content // empty' /tmp/openai_chat.json)
else
  reply=$(grep -o '"content"[^,]*' /tmp/openai_chat.json | head -1)
fi

echo "   ✓ Modell antwortet: ${reply}"
echo
echo "✅ Alles in Ordnung — der Key funktioniert mit Modell '${MODEL}'."
