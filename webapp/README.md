# Reparatur-Helfer — Web-App

Echte Web-App-Nachbildung des Claude-Design-Prototyps `ReparaturApp.html`.
**Python (Flask)**-Backend + Vanilla-JS-Frontend + Tailwind CSS. Die Diagnose
läuft **ausschließlich** über die OpenAI-Cloud aus Freitext — es gibt keine
hinterlegten Demo-/Seed-Geräte mehr.

Verbindlicher Vertrag (Schema, Endpunkte): [`SPEC.md`](SPEC.md).

## Schnellstart

```bash
cd webapp

# 1. virtuelle Umgebung anlegen & aktivieren
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. Abhängigkeiten installieren
pip install -r requirements.txt

# 3. Konfiguration anlegen — OpenAI-Key ist Pflicht (s. u.)
cp .env.example .env

# 4. starten
python app.py                       # → http://127.0.0.1:5000
# oder:
flask --app app run                 # ggf. --debug für Auto-Reload
```

Die App läuft auf **Port 5000**.

## Diagnose-Backend (OpenAI)

Die Live-Diagnose (`POST /api/diagnose` aus Freitext) läuft ausschließlich über
die OpenAI-Cloud:

- Key in `.env` eintragen: `OPENAI_API_KEY=sk-...`
- Modell optional über `OPENAI_MODEL`, Default `gpt-4o-mini`.
- Timeout je Antwort über `LLM_TIMEOUT` (Sekunden), Default `180`.

**Ohne gesetzten Key** antwortet `POST /api/diagnose` mit einem sauberen Fehler
(`HTTP 503`, `"code": "no_backend"`) und das Frontend zeigt einen Hinweis auf
dem Startscreen — es wird nie hart gescheitert, aber es gibt auch keinen
Demo-Modus (keine hinterlegten Seed-Geräte).

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

## Konfiguration — ausschließlich über `.env` (PROJ-30)

Jede zur Laufzeit/Deployment veränderliche Einstellung wird **nur** über
Umgebungsvariablen gesteuert, geladen aus `webapp/.env` (`python-dotenv`,
`load_dotenv()` in `app.py`). Es gibt **keine** zweite Konfigurationsquelle und
keine im Code hartkodierten Endpunkte/Keys/Modelle/Limits. Die getypten/
validierten Werte bündelt `repair/config.py`; jeder Wert hat einen Default,
sodass die App auch **ganz ohne** `.env` startet.

| Variable | Default | Zweck |
|---|---|---|
| `OPENAI_API_KEY` | _(leer)_ | OpenAI-Cloud-Key (Pflicht für die Diagnose) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Modell für die Diagnose |
| `LLM_TIMEOUT` | `180` | Timeout (s) je LLM-Antwort — **> 0**, sonst Fail-fast |
| `WHISPER_MODEL` | `whisper-1` | Modell für die Audio-Transkription (PROJ-27) |
| `VISION_MODEL` | _(leer)_ | Vision-Modell für die Bild-/Dokument-Auswertung (PROJ-31); leer → Cloud-Diagnosemodell (`OPENAI_MODEL`, kann Vision) |
| `MAX_UPLOAD_BYTES` | `10485760` | Max. Mediengröße in Bytes — **> 0**, sonst Fail-fast |
| `MAX_MEDIEN_PRO_ANFRAGE` | `6` | Max. Medien je Diagnose-Anfrage (PROJ-31) — **1..100**, sonst Fail-fast |
| `MAX_PDF_SEITEN` | `5` | Max. ausgewertete PDF-Seiten je Dokument (PROJ-31) — **1..50**, sonst Fail-fast |
| `SEARXNG_URL` | _(leer)_ | SearXNG für die Online-Recherche (PROJ-16) |
| `PROTOKOLL_ENABLED` | `1` | Anfrage-Protokoll an/aus (PROJ-28) |
| `LOG_LEVEL` | `DEBUG` | Log-Level (PROJ-29) |
| `FLASK_DEBUG` | `1` | Flask-Debug-Modus (tolerant: `0`/`false`/leer = aus) |
| `HOST` | `127.0.0.1` | Bind-Adresse (z. B. `0.0.0.0` im Container) |
| `PORT` | `5000` | TCP-Port — **1..65535**, sonst Fail-fast |

**Fail-fast:** Fehlende Variablen fallen still auf den Default zurück.
Syntaktisch **ungültige** Werte (`PORT=abc`, `PORT=99999`, `LLM_TIMEOUT=xyz`,
`MAX_UPLOAD_BYTES=-1`) brechen den Start mit einer klaren, die Variable und den
erwarteten Bereich benennenden Meldung ab (`config.validate()` in `app.py`).

`VISION_MODEL` ist seit PROJ-31 aktiv (bleibt mit sinnvollem Default
auskommentiert; Vision läuft über OpenAI). **Ausnahme** (kein `.env`):
layout-abgeleitete Pfade (`DB_PATH`, `MEDIA_DIR`).

**PDF-Auswertung (PROJ-31):** Für die Vision-Auswertung beigefügter **PDFs**
wird `PyMuPDF` benötigt (in `requirements.txt`). Es ist **optional/lazy**
importiert — fehlt es, degradiert die PDF-Auswertung mit Hinweis statt zu
crashen (Bilder funktionieren weiterhin).

**Drift-Guard lokal ausführen** — gleicht `.env.example` ↔ Code in beide
Richtungen ab und schlägt bei verbotenen Hardcode-Mustern an:

```bash
cd webapp
python tests/test_config_drift.py        # standalone (ohne pytest)
# oder, falls pytest installiert:
python -m pytest tests/test_config_drift.py -q
```

## Projektstruktur (Backend-Anteil)

```
webapp/
  app.py               Flask-App + Routen
  requirements.txt     Flask, openai, python-dotenv
  .env.example         Vorlage für die Konfiguration
  repair/
    __init__.py
    config.py          zentrale .env-Konfiguration: getypte Getter + Fail-fast-Validierung (PROJ-30)
    schema.py          normalize_device() — Validierung/Reparatur eines device-Objekts
    ai.py              diagnose() — reine LLM-Diagnose (ohne Backend/Fehler → Fehler-Objekt) + Vertrauens-Indikator (PROJ-25)
    logconf.py         setup_logging() — zentrales Logging (Datei+Konsole, tägl. Rotation, PROJ-29)
    protokoll_log.py   protokolliere() — Anfrage-Protokoll als Markdown pro Vorgang (PROJ-28)
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
python -c "import os; os.environ.pop('OPENAI_API_KEY', None); \
import app; from repair import ai, schema; \
print(ai.diagnose('Mein Toaster wirft nicht mehr aus')['code'])"
# erwartet:
#   no_backend
```

Konfigurations-Drift-Guard (PROJ-30) — prüft `.env.example` ↔ Code und Hardcode-Muster:

```bash
cd webapp
python tests/test_config_drift.py
# erwartet:
#   9/9 Checks bestanden.
```

Endpunkte manuell prüfen (Server läuft auf :5000):

```bash
# entfernte Demo-Routen sind jetzt 404
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5000/api/devices            # 404
# Diagnose: 503 ohne Key, 200 mit gesetztem OPENAI_API_KEY
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:5000/api/diagnose \
  -H "Content-Type: application/json" -d '{"text":"Meine Mikrowelle brummt laut"}'
# Stufe-2/3-Dienste (kuratierte Daten) bleiben verfügbar
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5000/api/anbieter           # 200
```

Voller UI-Flow (mit gesetztem OpenAI-Key): siehe `SPEC.md`
„Lauf-/Testkriterien" — Freitext-Diagnose → KI-Gerät durch den Flow,
Protokoll-Sheet, Theme-Switcher.
