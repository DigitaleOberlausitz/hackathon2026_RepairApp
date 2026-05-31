# Reparatur-Helfer — Web-App

Echte Web-App-Nachbildung des Claude-Design-Prototyps `ReparaturApp.html`.
**Python (Flask)**-Backend + Vanilla-JS-Frontend + Tailwind CSS. Die Diagnose
läuft **ausschließlich** über ein echtes LLM-Backend (lokales Ollama oder
OpenAI) aus Freitext — es gibt keine hinterlegten Demo-/Seed-Geräte mehr.

Verbindlicher Vertrag (Schema, Endpunkte, Dateieigentum): [`SPEC.md`](SPEC.md).

## Schnellstart

```bash
cd webapp

# 1. virtuelle Umgebung anlegen & aktivieren
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. Abhängigkeiten installieren
pip install -r requirements.txt

# 3. Konfiguration anlegen — LLM-Backend ist Pflicht (s. u.)
cp .env.example .env

# 4. starten
python app.py                       # → http://127.0.0.1:5000
# oder:
flask --app app run                 # ggf. --debug für Auto-Reload
```

Die App läuft auf **Port 5000**.

## Diagnose-Backend wählen

Die Live-Diagnose (`POST /api/diagnose` aus Freitext) braucht ein echtes
LLM-Backend; `ai.py` wählt automatisch in dieser Reihenfolge:

1. **Lokaler Ollama** — sobald `OLLAMA_BASE_URL` gesetzt ist (offline, empfohlen).
2. **OpenAI-Cloud** — wenn nur `OPENAI_API_KEY` gesetzt ist.

**Ohne ein konfiguriertes Backend** antwortet `POST /api/diagnose` mit einem
sauberen Fehler (`HTTP 503`, `"code": "no_backend"`) und das Frontend zeigt
einen Hinweis auf dem Startscreen — es wird nie hart gescheitert, aber es gibt
auch keinen Demo-Modus mehr (keine hinterlegten Seed-Geräte).

### Variante A — Lokales LLM via Docker (CPU-only)

Voraussetzung: Docker **inkl. Compose-Plugin** (`docker compose version` muss
laufen; ggf. `docker-compose-plugin` bzw. `docker-buildx`/`docker-compose`
nachinstallieren).

```bash
cd webapp
docker compose up -d        # ollama + open-webui + searxng + qdrant
./pull-models.sh            # einmalig: empfohlene Modelle in Ollama laden

# .env: Ollama aktivieren
echo "OLLAMA_BASE_URL=http://localhost:11434/v1" >> .env
echo "DIAGNOSE_MODEL=qwen3:8b" >> .env
```

| Dienst      | Port  | Zweck                                              |
|-------------|-------|----------------------------------------------------|
| ollama      | 11434 | Modell-Server (OpenAI-kompatibel, `/v1`)           |
| open-webui  | 3000  | Chat-UI zum Testen + RAG + Web-Search-Hook         |
| searxng     | 8080  | private Meta-Suche → Online-Recherche-Fallback     |
| qdrant      | 6333  | Vektor-DB für die kuratierte Fehlerzustand-Sammlung|

Empfohlene Modelle (CPU-tauglich, ~30 GiB RAM): `qwen3:8b` (Diagnose-Default),
`qwen3:4b` (schnelle Rollen), `qwen2.5vl:7b` (Vision/OCR), `bge-m3`
(RAG-Embeddings); optional `qwen3:30b-a3b` (MoE, schweres Reasoning, lädt nur
bei Bedarf). Steuerung über `.env` (`DIAGNOSE_MODEL`/`OLLAMA_MODEL`,
`LLM_TIMEOUT`).

### Variante B — OpenAI-Cloud

- Key in `.env` eintragen: `OPENAI_API_KEY=sk-...`
- Modell optional über `OPENAI_MODEL` (oder `DIAGNOSE_MODEL`), Default `gpt-4o-mini`.

## API-Endpunkte

| Methode + Pfad            | Antwort                                                        |
|---------------------------|----------------------------------------------------------------|
| `GET  /`                  | rendert `templates/index.html` (SPA-Shell)                     |
| `POST /api/diagnose`      | Body `{"text": "…"}` → Erfolg `{"device": {device…}, "source": "ai", "diagnosis": {status, score, reason, trust}}` |

Bei Erfolg ist `source` immer `"ai"`. Im Fehlerfall liefert der Endpunkt ein
Objekt `{"error": "…", "code": "…"}` mit passendem HTTP-Status: `400` (leerer
Text, `empty`), `503` (kein LLM-Backend, `no_backend`), `502` (KI-/Upstream-Fehler,
`ai_error`). `diagnosis.trust` (PROJ-25) trägt `{level, source, reason}`.
Alle JSON-Antworten sind UTF-8 mit echten Emojis/Umlauten (kein ASCII-Escaping).

### Stufe-2-Service-Endpunkte (PROJ-11/12/13/14/26)

Alle liefern HTTP 200 mit kuratiertem Seed (scheitern nie hart). Query-Parameter
sind optional und filtern nur; ein Leertreffer liefert `fallback: true` + `hinweis`.

| Methode + Pfad                | Query          | Antwort (Kurzform)                                          |
|-------------------------------|----------------|-------------------------------------------------------------|
| `GET /api/anbieter`           | `?kat=&ort=`   | `{items[], fallback, hinweis}` — Repair-Café/Werkstatt/Profi |
| `GET /api/entsorgung`         | `?kat=&ort=`   | `{items[], fallback, hinweis}` — Wertstoffhof/Rücknahme/Sammelstelle (+Rohstoff) |
| `GET /api/alternativen`       | `?kat=`        | `{items[], breakEven, hinweis, fallback}` — Alternativgeräte |
| `GET /api/ersatzteile`        | `?device=&defekt=` | `{items[], guenstigsteZuerst, hinweis, fallback}` — günstigste zuerst, Affiliate-Leitplanke (D8) |
| `GET /api/triage/universal`   | —              | `{fragen[]}` — 5 systematische, gerätunabhängige Fragen      |

Alle Service-Daten sind **kuratierte Demodaten** (jeder Eintrag mit `quelle` +
`kuratiert: true`, keine Netzwerk-/Scraping-Zugriffe).

## Projektstruktur (Backend-Anteil)

```
webapp/
  app.py               Flask-App + Routen
  requirements.txt     Flask, openai, python-dotenv
  .env.example         Vorlage für die Konfiguration
  repair/
    __init__.py
    schema.py          normalize_device() — Validierung/Reparatur eines device-Objekts
    ai.py              diagnose() — reine LLM-Diagnose (ohne Backend/Fehler → Fehler-Objekt) + Vertrauens-Indikator (PROJ-25)
    foerderung.py      kuratierte Reparatur-Förderungen (PROJ-6)
    store.py           Vorgang-Persistenz (sqlite3, PROJ-9)
    export.py          Protokoll-Renderer txt + Lese-Ansicht HTML (PROJ-10, +Stufe-2-Abschnitte)
    anbieter.py        kuratierte Reparatur-Anbieter (PROJ-11)
    entsorgung.py      kuratierte Entsorgungs-/Recyclingwege (PROJ-12)
    produktsuche.py    kuratierte Alternativgeräte + Break-Even (PROJ-13)
    ersatzteile.py     kuratierte Ersatzteile, günstigste zuerst (PROJ-14)
    triage.py          universelle, gerätunabhängige Triage-Fragen (PROJ-26)
  templates/index.html [AGENT-B]   SPA-Shell
  static/js, static/css [AGENT-B/C] Frontend
```

## Tests (Definition of Done aus SPEC.md)

Backend-Smoke-Test (ohne Backend → sauberer Fehler statt Crash):

```bash
cd webapp
python -c "import os; [os.environ.pop(k, None) for k in ('OPENAI_API_KEY','OLLAMA_BASE_URL')]; \
import app; from repair import ai, schema; \
print(ai.diagnose('Mein Toaster wirft nicht mehr aus')['code'])"
# erwartet:
#   no_backend
```

Endpunkte manuell prüfen (Server läuft auf :5000):

```bash
# entfernte Demo-Routen sind jetzt 404
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5000/api/devices            # 404
# Diagnose: 503 ohne Backend, 200 mit Ollama/OpenAI
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:5000/api/diagnose \
  -H "Content-Type: application/json" -d '{"text":"Meine Mikrowelle brummt laut"}'
# Stufe-2/3-Dienste (kuratierte Daten) bleiben verfügbar
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5000/api/anbieter           # 200
```

Voller UI-Flow (mit gesetztem LLM-Backend): siehe `SPEC.md`
„Lauf-/Testkriterien" — Freitext-Diagnose → KI-Gerät durch den Flow,
Protokoll-Sheet, Theme-Switcher.
