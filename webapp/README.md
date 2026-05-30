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

## OpenAI-Key setzen (optional)

Die Live-Diagnose (`POST /api/diagnose` aus Freitext) nutzt die OpenAI-API.

- Key in `.env` eintragen: `OPENAI_API_KEY=sk-...`
- Modell optional über `OPENAI_MODEL` wählen (Default `gpt-4o-mini`).
- Alternativ als Umgebungsvariable: `export OPENAI_API_KEY=sk-...`

**Ohne Key läuft die App trotzdem:** `POST /api/diagnose` liefert dann das
passendste Seed-Gerät als Fallback (`"source": "fallback"`). Die Demo bleibt
jederzeit benutzbar — es wird nie hart gescheitert (auch bei Netzwerk- oder
API-Fehlern fällt der Endpunkt sauber auf ein Seed-Gerät zurück).

## API-Endpunkte

| Methode + Pfad            | Antwort                                                        |
|---------------------------|----------------------------------------------------------------|
| `GET  /`                  | rendert `templates/index.html` (SPA-Shell)                     |
| `GET  /api/devices`       | `{ "toaster": {device…}, "mikrowelle": {device…} }`            |
| `GET  /api/device/<id>`   | einzelnes `device`-Objekt (404 wenn unbekannt)                 |
| `POST /api/diagnose`      | Body `{"text": "…"}` → `{"device": {device…}, "source": …}`    |

`source` ist `"ai"` (KI-Antwort) oder `"fallback"` (Seed-Gerät).
Alle JSON-Antworten sind UTF-8 mit echten Emojis/Umlauten (kein ASCII-Escaping).

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
    ai.py              diagnose() — OpenAI-Diagnose mit Seed-Fallback
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
