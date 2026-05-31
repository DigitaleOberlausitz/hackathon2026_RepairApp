#!/usr/bin/env bash
# Lädt die für den Reparatur-Helfer empfohlenen Modelle in den laufenden
# Ollama-Container. Einmalig nach `docker compose up -d` ausführen.
#
# Hardware-Annahme: CPU-only (AMD-Laptop, 30 GiB RAM). Auswahl ist auf
# "ausgewogen" abgestimmt: Qwen3-8B als Arbeitspferd, 30B-A3B (MoE) nur
# bei Bedarf, Qwen2.5-VL-7B für Vision/OCR, bge-m3 für RAG-Embeddings.
set -euo pipefail

CONTAINER="${OLLAMA_CONTAINER:-repair-ollama}"

pull() {
  echo "==> ziehe $1"
  docker exec "$CONTAINER" ollama pull "$1"
}

pull qwen3:4b          # klein/schnell: Routing, einfache Rollen
pull qwen3:8b          # Default-Arbeitspferd (Diagnose)
pull qwen2.5vl:7b      # Vision/OCR: Typenschilder, Seriennummern, Defekte
pull bge-m3            # Embeddings für RAG (mehrsprachig, stark auf Deutsch)

echo
echo "Optional (schweres Reasoning, ~18 GB RAM, lädt nur bei Bedarf):"
echo "  docker exec $CONTAINER ollama pull qwen3:30b-a3b"
echo
echo "Fertig. Geladene Modelle:"
docker exec "$CONTAINER" ollama list
