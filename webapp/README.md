# Reparatur-Helfer — Web-App

Echte Web-App-Nachbildung des Claude-Design-Prototyps `ReparaturApp.html`.
**Python (Flask)**-Backend + Vanilla-JS-Frontend + Tailwind CSS, mit optionaler
**OpenAI-ChatGPT-Live-Diagnose** aus Freitext.

Verbindlicher Vertrag (Schema, Endpunkte, Dateieigentum): [`SPEC.md`](SPEC.md).

## Schnellstart

```bash
cd webapp

# 1. virtuelle Umgebung anlegen & aktivieren
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. Abhängigkeiten installieren
pip install -r requirements.txt

# 3. Konfiguration anlegen (optional, s. u.)
cp .env.example .env

# 4. starten
python app.py                       # → http://127.0.0.1:5000
# oder:
flask --app app run                 # ggf. --debug für Auto-Reload
```

Die App läuft auf **Port 5000**.

## Diagnose-Backend wählen

Die Live-Diagnose (`POST /api/diagnose` aus Freitext) kennt drei Betriebsarten,
die `ai.py` automatisch in dieser Reihenfolge wählt:

1. **Lokaler Ollama** — sobald `OLLAMA_BASE_URL` gesetzt ist (offline, empfohlen).
2. **OpenAI-Cloud** — wenn nur `OPENAI_API_KEY` gesetzt ist.
3. **Fallback** — ohne beides: passendstes Seed-Gerät (`"source": "fallback"`).

**Ohne jedes Backend läuft die App trotzdem** — es wird nie hart gescheitert
(auch bei Netzwerk-, API- oder JSON-Fehlern fällt der Endpunkt sauber auf ein
Seed-Gerät zurück, `"source": "fallback"`).

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
| `GET  /api/devices`       | `{ "toaster": {device…}, "mikrowelle": {device…} }`            |
| `GET  /api/device/<id>`   | einzelnes `device`-Objekt (404 wenn unbekannt)                 |
| `POST /api/diagnose`      | Body `{"text": "…"}` → `{"device": {device…}, "source": …, "diagnosis": {status, score, reason, trust}}` |

`source` ist `"ai"` (KI-Antwort) oder `"fallback"` (Seed-Gerät).
`diagnosis.trust` (PROJ-25) trägt `{level, source, reason}` — `fallback` ⇒ niedrig/„KI-Fallback".
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

## Logging (PROJ-29)

Die App schreibt zur Laufzeit ein **zentrales Log gleichzeitig in eine Datei und
auf die Konsole**:

- **Speicherort:** `webapp/logs/repair.log` (das `logs/`-Verzeichnis wird beim
  Start automatisch angelegt; es ist gitignored).
- **Rotation & Aufbewahrung:** täglich um Mitternacht; **14** Tage werden
  vorgehalten, ältere Dateien automatisch gelöscht. Rotierte Dateien tragen ein
  Datums-Suffix, z. B. `repair.log.2026-05-30`.
- **Level konfigurieren:** über `LOG_LEVEL` in der `.env`
  (`DEBUG`/`INFO`/`WARNING`/`ERROR`/`CRITICAL`). Default ist **`DEBUG`**;
  ungültige Werte fallen ohne Crash auf `DEBUG` zurück.
- **Inhalt:** jeder API-Request (Methode, Pfad, Status — 4xx/5xx auf
  `WARNING`/`ERROR`), die Werkzeug-Zugriffslogs, Schlüssel-Ereignisse der
  Fach-Module (Diagnose-Quelle `ai`/`fallback` + Modell, Lotse-Routing,
  Vorgangs-CRUD, Wissensbasis-Freigaben, Recherche-Herkunft, Medien-Metadaten)
  sowie jede unbehandelte Exception **mit Stacktrace**.

> ⚠ **Datenschutz-Hinweis (PII):** Auf `DEBUG` können auch
> **Klartext-Nutzereingaben** (Freitext-Symptome, Standort, Medien-Metadaten) im
> Log landen. Diese Tiefe ist **nur für die lokale Dev-Umgebung** gedacht — für
> Produktion `LOG_LEVEL=INFO` (oder höher) setzen.

## Projektstruktur (Backend-Anteil)

```
webapp/
  app.py               Flask-App + Routen
  requirements.txt     Flask, openai, python-dotenv
  .env.example         Vorlage für die Konfiguration
  repair/
    __init__.py
    data.py            Seed-Geräte (Port von repair-data.js): Toaster 🟢, Mikrowelle 🔴
    schema.py          normalize_device() — Validierung/Reparatur eines device-Objekts
    ai.py              diagnose() — KI-Diagnose mit Seed-Fallback + Vertrauens-Indikator (PROJ-25)
    logconf.py         setup_logging() — zentrales Logging (Datei+Konsole, tägl. Rotation, PROJ-29)
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

Backend-Smoke-Test (läuft ohne Key, nutzt Fallback):

```bash
cd webapp
python -c "import app; from repair import data, ai, schema; \
print(len(data.seed_devices())); \
print(ai.diagnose('Mein Toaster wirft nicht mehr aus')['source'])"
# erwartet:
#   2
#   fallback
```

Endpunkte manuell prüfen (Server läuft auf :5000):

```bash
curl -s http://127.0.0.1:5000/api/devices | head -c 200
curl -s http://127.0.0.1:5000/api/device/toaster | head -c 200
curl -s http://127.0.0.1:5000/api/device/unbekannt -o /dev/null -w "%{http_code}\n"   # 404
curl -s -X POST http://127.0.0.1:5000/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"text":"Meine Mikrowelle brummt laut"}'
```

Voller UI-Flow (sobald Frontend von AGENT-B/C vorliegt): siehe `SPEC.md`
„Lauf-/Testkriterien" — Toaster-🟢-Pfad, Mikrowelle-🔴-Pfad, Protokoll-Sheet,
Theme-Switcher, Freitext-Diagnose.
