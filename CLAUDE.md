# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projektstand

Zwei Stränge im Repo:

1. **Lauffähige Web-App** in `webapp/` — eine echte Nachbildung des Design-Prototyps als
   **Python (Flask)** Backend + **Vanilla-JS**-Statemachine-Frontend + **Tailwind CSS**. Die
   Diagnose läuft **ausschließlich** über die OpenAI-Cloud (ChatGPT) aus Freitext — es gibt
   keine hinterlegten Demo-/Seed-Geräte mehr. Verbindlicher
   Implementierungs-Vertrag: `webapp/SPEC.md`; Setup/Run/Test: `webapp/README.md`.
2. **Doku-Build** — das fachliche Konzept (`docs/konzept.adoc`) + die erlebbare Beschreibung
   (`docs/app-beschreibung.adoc`), via Gradle/Asciidoctor zu PDF gebaut.

> **Stack-Hinweis:** Die App wird in **Python/Flask + Vanilla-JS** umgesetzt, *nicht* im weiter
> unten historisch dokumentierten Kotlin/Fritz2/Ktor-Plan (überholt, siehe „Geplanter Tech-Stack").

## Web-App (`webapp/`)

### Starten & testen

```bash
cd webapp
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                 # OPENAI_API_KEY eintragen (Pflicht, s. u.)
python app.py                                        # → http://127.0.0.1:5000
```

Backend-Smoke-Test (ohne Backend → sauberer Fehler statt Crash):

```bash
cd webapp
python -c "import os; os.environ.pop('OPENAI_API_KEY',None); import app; from repair import ai; print(ai.diagnose('Mein Toaster wirft nicht mehr aus')['code'])"
# erwartet: no_backend
```

**LLM-Backend (Pflicht):** OpenAI (`OPENAI_API_KEY`) in `webapp/.env` (Modell via
`OPENAI_MODEL`, Default `gpt-4o-mini`). **Ohne Key startet der Server zwar**, aber
`POST /api/diagnose` liefert einen sauberen Fehler (`HTTP 503`, `code:"no_backend"`) —
es gibt keine Demo-/Seed-Geräte als Fallback mehr.

### Konfiguration — immer über `.env`

**Verbindlich:** Jede zur Laufzeit/Deployment veränderliche Konfiguration wird ausschließlich
über **Umgebungsvariablen** gesteuert, geladen aus `webapp/.env` (via `python-dotenv`,
`load_dotenv()` in `app.py`). Keine separate Config-Datei, keine hartcodierten Endpunkte,
Keys, Modelle oder Limits im Code.

- Neue Konfigurationswerte: per `os.environ.get("NAME")` (bzw. einen Getter in
  `repair/config.py`) lesen **und** in `webapp/.env.example` (inkl. Default-Hinweis)
  dokumentieren. `.env` selbst ist gitignored — nie einchecken.
- Jeder gelesene Wert braucht einen sinnvollen Default, damit die App ohne `.env` startet.
- `.env.example` und tatsächlich gelesene Variablen synchron halten (kein Drift: nur
  dokumentieren, was der Code auch ausliest). Der **Drift-Guard**
  `webapp/tests/test_config_drift.py` erzwingt das in beide Richtungen und schlägt bei
  verbotenen Hardcode-Mustern an (lokal: `python tests/test_config_drift.py`).
- **Zentral & Fail-fast (PROJ-30):** getypte/validierte Werte bündelt `repair/config.py`;
  `config.validate()` läuft beim Start in `app.py` und bricht bei syntaktisch ungültigen
  Werten (z. B. `PORT=abc`) mit klarer, benennender Meldung ab. Default-Literale für
  Bind-Adresse/Port/Modelle/Limits stehen **nur** dort (bzw. `ai.py` `DEFAULT_*_MODEL`).
- Aktuell ausgewertet: `OPENAI_API_KEY`, `OPENAI_MODEL`, `LLM_TIMEOUT`, `WHISPER_MODEL`,
  `MAX_UPLOAD_BYTES`, `SEARXNG_URL`, `PROTOKOLL_ENABLED`, `LOG_LEVEL`, `FLASK_DEBUG`,
  `HOST`, `PORT`.
- Ausnahme (kein `.env` nötig): paket-relative Pfade, die aus dem Dateilayout abgeleitet
  werden (`store.py`/`wissensbasis.py` → `DB_PATH`, `multimodal.py` → `MEDIA_DIR`) — das ist
  Layout, keine Deployment-Konfiguration.

### Architektur & Dateieigentum

Quelle/Design-of-truth: `docs/design-handoff/project/` (HTML/CSS/JSX-Prototyp, **pixelgenau**
nachbauen). Der `device`-Datenvertrag, die API-Endpunkte, der Klassennamen-Vertrag und die
Theme-Tokens stehen verbindlich in **`webapp/SPEC.md`** — vor Änderungen dort nachsehen.

```
webapp/
  app.py               Flask-App + Routen (GET /, POST /api/diagnose, Stufe-2/3-Dienste)
  repair/
    config.py          zentrale .env-Konfiguration: getypte Getter + Fail-fast-Validierung (PROJ-30)
    schema.py          normalize_device() — Validierung/Reparatur eines device-Objekts
    ai.py              diagnose() — reine LLM-Diagnose; ohne Backend/Fehler → Fehler-Objekt
    logconf.py         setup_logging() — zentrales Logging (Datei+Konsole, tägl. Rotation, PROJ-29)
    protokoll_log.py   protokolliere() — Anfrage-Protokoll als Markdown pro Vorgang (PROJ-28)
    store.py           Vorgang-Persistenz via stdlib sqlite3 (PROJ-9, → vorgaenge.db)
    triage.py          universelle, gerätunabhängige Triage-Fragen (PROJ-26)
    diagnose_kuratiert.py  kuratierte Diagnose-Schleife (PROJ-17)
    bewertung.py       Gesamt-Fazit für Mehrfachdefekte (PROJ-21)
    lotse.py           prozedurales Routing ohne Sicherheits-Entscheidung (PROJ-18)
    recherche.py       kuratiert → KI-Fallback → Online (SearXNG optional) (PROJ-16)
    wissensbasis.py    kuratierte Fehlerzustands-Wissensbasis (PROJ-15) + Rückruf-Daten (PROJ-19, → wissensbasis.db)
    anbieter.py        kuratierte Reparatur-Anbieter (PROJ-11) · entsorgung.py Entsorgungswege (PROJ-12)
    produktsuche.py    Alternativgeräte/Neukauf (PROJ-13) · ersatzteile.py Ersatzteile (PROJ-14)
    foerderung.py      kuratierte dt. Reparatur-Förderungen
    multimodal.py      multimodaler Medien-Store (PROJ-27, → media/)
    consent.py         Einwilligungs-Management (PROJ-22) · anonymisierung.py (PROJ-23)
    datenloeschung.py  Datenlöschung bei Fremdabgabe (PROJ-20) · schwungrad.py Wissens-Beitrag (PROJ-23)
    i18n.py            Backend-i18n-Texte (PROJ-24) · export.py Protokoll-Export-Renderer (PROJ-10)
  templates/index.html SPA-Shell
  static/js/           ui.js · screens.js · app.js (Statemachine, Theme-Switcher)
  static/css/repair.css Komponenten-Styling + 3 Themes (Default: Werkstatt)
```

- JSON immer mit `ensure_ascii=False` (echte Emojis/Umlaute, kein ASCII-Escaping).
- `POST /api/diagnose`: Erfolg → HTTP 200 mit `source:"ai"`. Fehler → `{error, code}` mit Status
  `400` (`empty`), `503` (`no_backend`) oder `502` (`ai_error`). Kein Seed-Fallback, kein Crash.
- Die Stufe-2/3-Dienste (`/api/anbieter`, `/api/foerderung`, `/api/entsorgung`, `/api/ersatzteile`,
  `/api/wissensbasis` …) liefern weiterhin **kuratierte** Daten — das ist kein Demo-Gerät-Seed.
- Gefährliche Geräte (Hochspannung/Gas/Strom) → in der KI-Antwort `accentPath="stop"`,
  `recommend="pro"`, `lights.Sicherheit.level="stop"`.
- **Logging (PROJ-29):** `repair/logconf.py` → `setup_logging()` wird in `app.py` einmalig
  vor App-Start aufgerufen. Schreibt gleichzeitig nach `webapp/logs/repair.log` (täglich
  rotiert, 14 Tage, gitignored) und auf die Konsole. Level über `LOG_LEVEL` (Default `DEBUG`).
  Fach-Module loggen über `logging.getLogger(__name__)` (`repair.<modul>`). ⚠ Auf `DEBUG`
  landen Klartext-Nutzereingaben (PII) — nur lokal/Dev, produktiv mind. `INFO`.

## Konzept-PDF bauen

```bash
./gradlew asciidoctorPdf
```

Erzeugt `build/docs/asciidocPdf/konzept.pdf` (inkl. der Mermaid-Diagramme). Wrapper läuft auf **Gradle 9.3.0**; das Asciidoctor-PDF-Plugin 4.0.4 baut darauf fehlerfrei (die intern genutzte Klasse `CopySpecInternal` ist zur Laufzeit weiterhin im Gradle-Classpath, nur nicht mehr in der `gradle-api`-Compile-Fassade — daher kein Laufzeitfehler). Voraussetzung fürs Diagramm-Rendering: `mmdc` (Mermaid-CLI, via `npm i -g @mermaid-js/mermaid-cli`) auf dem `PATH`. Diagramme werden offline als PNG gerendert (`mermaid-format = png`); die `--no-sandbox`-Flags für Chromium stehen in `docs/.puppeteer-config.json`.

## Ziel der App

Eine KI-gestützte Reparatur-App: Der Anwender bekommt Hilfestellung, wie ein Gerät zu reparieren ist — welche Defekte vorliegen können, welche Reparaturmöglichkeiten es gibt und was er ggf. selbst lösen kann. Maßgeblich fachlich ist `docs/konzept.adoc` (Mindmap-Beschreibung, wächst mit dem Projekt); die erlebbare, nicht-technische Beschreibung steht in `docs/app-beschreibung.adoc`.

## Arbeitsweise (Skill-gestützter Workflow)

Dieses Projekt folgt einem festen, Skill-gesteuerten Feature-Workflow. Vor dem Implementieren den passenden Skill aufrufen statt direkt loszucodieren:

1. `architecture` — High-Level Design eines Features (kein Code)
2. `requirements` — User Stories, Akzeptanzkriterien, Edge Cases
3. `frontend` — UI-Bau
4. `backend` — APIs, Server-Logik
5. `qa` — Test gegen Akzeptanzkriterien + Security-Audit
6. `deploy` — Pre-Release-Checks, finaler Build, Versionierung

`help` zeigt jederzeit die aktuelle Position im Workflow an.

> **Achtung Tech-Mismatch:** Die `frontend`- und `backend`-Skills sind auf **Fritz2** bzw.
> **Ktor/Exposed** zugeschnitten. Da die App in **Flask + Vanilla-JS** gebaut wird, gilt deren
> Default-Tech **nicht** — `webapp/SPEC.md` ist maßgeblich. Die Workflow-*Schritte* bleiben gültig.

### Zwei getrennte Skill-/Rollen-Ebenen

Nicht verwechseln:

- **Entwickler-Workflow-Skills** (oben: `architecture`, `requirements`, …) — steuern das
  *Bauen* der App. Globale Claude-Code-Skills, via Slash-Command aufrufbar.
- **App-Laufzeit-Rollen** (`docs/runtime-roles/`) — spezialisierte KI-Fähigkeiten, die im
  *Produkt* den Endnutzer durch seinen Reparaturfall führen (`lotse`, `aufnahme`,
  `diagnose`, `bewertung`, … — 14 Rollen in 5 Klassen). Das sind **Produkt-Spezifikationen**.
  Architektur im Konzept: `docs/konzept.adoc` → *Rollen-/Agenten-Architektur* (D19); Index:
  `docs/runtime-roles/README.md`.
  - **Fachliche Quelle der Wahrheit bleibt `docs/runtime-roles/*.md`.** Auf Wunsch sind die
    14 Rollen zusätzlich als projekt-lokale Claude-Code-Skills unter `.claude/skills/<rolle>/SKILL.md`
    abgelegt (inhaltsgleiche, abgeleitete Kopien — als Slash-Command aufruf-/testbar). Bei
    Änderungen die Spec in `docs/runtime-roles/` pflegen und die Kopie in `.claude/skills/`
    nachziehen (Drift-Gefahr).

## Geplanter Tech-Stack (HISTORISCH — überholt)

> Der ursprüngliche Plan war **Kotlin Multiplatform** (Fritz2 im `jsMain`-Frontend, Ktor + Exposed
> im JVM-Backend, geteilte DTOs in `commonMain`, Tailwind, Playwright für E2E). **Dieser Plan ist
> verworfen** — die reale Umsetzung ist die Flask/Vanilla-JS-App in `webapp/` (siehe oben). Der
> Abschnitt bleibt nur als Kontext erhalten; nicht als Vorgabe behandeln. Der `fritz2`-Skill ist
> für dieses Repo nicht mehr relevant.
