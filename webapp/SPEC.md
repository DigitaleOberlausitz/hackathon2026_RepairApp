# Reparatur-Helfer — Implementierungs-Vertrag (verbindlich für alle Agenten)

Wir bauen den Claude-Design-Prototyp `ReparaturApp.html` als echte Web-App nach.
Quelle / Design-of-truth: `../docs/design-handoff/project/` (HTML/CSS/JSX-Prototyp).
**Pixelgenau nachbauen** — die `repair.css`-Werte und `repair-themes.js`-Tokens sind maßgeblich.

Stack: **Python (Flask)** Backend + **Vanilla-JS**-Statemachine im Frontend + **Tailwind CSS**.
Zusätzlich: **OpenAI ChatGPT-API** für echte Live-Diagnose aus Freitext.

## Verzeichnis & Dateieigentum (DISJUNKT — kein Agent fasst fremde Dateien an)

```
webapp/
  app.py                 [AGENT-A]  Flask-App, Routen
  requirements.txt       [AGENT-A]
  .env.example           [AGENT-A]
  README.md              [AGENT-A]  Setup/Run/Test-Anleitung
  repair/
    __init__.py          [AGENT-A]
    (data.py entfällt — keine Demo-/Seed-Geräte mehr; Diagnose nur via LLM)
    ai.py                [AGENT-A]  OpenAI-ChatGPT-Diagnose -> device-Objekt
    schema.py            [AGENT-A]  Validierung/Normalisierung eines device-Objekts
  templates/
    index.html           [AGENT-B]  SPA-Shell (enthält den HEAD-BLOCK unten 1:1)
  static/
    js/
      ui.js              [AGENT-B]  Bausteine (PhoneFrame, Screen, AppBar, Buttons, Ampel, Sheet)
      screens.js         [AGENT-B]  Screen-Renderer (Start, Triage, Ampel, Decision, Repair, Result, Path, Protocol)
      app.js             [AGENT-B]  Statemachine + Fetch der Geräte + Live-Diagnose + Theme-Switcher
    css/
      repair.css         [AGENT-C]  Komponenten-Styling + Themes (Port von repair.css + repair-themes.js)
```

Gemeinsame Verträge (Schema, Klassennamen, HEAD-Block) stehen unten — daran halten sich alle.

## Datenvertrag: das `device`-Objekt (Backend liefert, Frontend rendert)

JSON-Schlüssel exakt so (Port von `repair-data.js`):

```json
{
  "id": "toaster",
  "name": "Toaster",
  "emoji": "🍞",
  "blurb": "Wirft das Brot nicht mehr aus",
  "detail": "2-Scheiben-Toaster · ca. 4 Jahre alt",
  "accentPath": "gut",                         // "gut" | "stop" (steuert Ampel-Verdict-Farbe & Decision-Text)
  "triage": [                                   // geführte Nachfragen, eine pro Screen
    { "q": "…?", "hint": "…",
      "options": [ { "a": "Antworttext", "tag": "kurz-tag" } ] }
  ],
  "lights": [                                   // genau 4: Sicherheit, Aufwand, Kosten, Machbarkeit
    { "key": "Sicherheit", "icon": "🛡️", "level": "gut", "note": "…" }
    // level: "gut" | "mittel" | "stop"
  ],
  "verdictTitle": "…",
  "verdictBody": "…",
  "confidence": { "level": "hoch", "source": "geprüfte Reparatur-Anleitung", "note": "…" },
  "recommend": "self",                          // "self" | "local" | "pro" | "replace"
  "compare": {                                  // NUR wenn accentPath=="stop" (Vergleich Reparieren/Neu)
    "repair": { "geld": "…", "zeit": "…", "umwelt": "…" },
    "neu":    { "geld": "…", "zeit": "…", "umwelt": "…" }
  },
  "steps": [
    { "title": "…", "safety": true, "danger": false, "handoff": false,
      "beginner": "lange Erklärung", "pro": "knappe Version", "slot": "Bild-Platzhalter-Text" }
  ],
  "success": { "saved": "≈ 30 €", "co2": "≈ 12 kg CO₂", "line": "Du hast ein Gerät gerettet." }
}
```

Levels: `gut`/`mittel`/`stop` → Ampelpunkt 🟢/🟡/🔴, Farben via CSS-Variablen `--gut|--mittel|--stop` (+ `-bg`,`-ink`).

## API-Endpunkte (AGENT-A implementiert, AGENT-B konsumiert)

- `GET  /`                      → rendert `index.html`
- `POST /api/diagnose`          → Body `{ "text": "Mein Toaster wirft nicht mehr aus" }`
                                   Erfolg: `{ "device": {device…}, "source": "ai", "diagnosis": {…} }` (HTTP 200).
                                   Nutzt ein echtes LLM-Backend (lokales Ollama oder OpenAI). Es gibt keine
                                   hinterlegten Demo-/Seed-Geräte mehr.
  Fehlerfall (nie hart scheitern): `{ "error": "…", "code": "…" }` mit HTTP-Status —
  `400` (leerer Text, `empty`), `503` (kein Backend, `no_backend`), `502` (KI-/Upstream-Fehler, `ai_error`).

## Konfiguration — ausschließlich über `.env` (verbindlich, PROJ-30)

Jede zur Laufzeit/Deployment veränderliche Einstellung wird **nur** über Umgebungsvariablen
gesteuert (geladen aus `webapp/.env` via `python-dotenv`; `load_dotenv()` in `app.py` ist die
einzige Lade-Stelle). **Keine** zweite Konfigurationsquelle, **keine** hartkodierten Endpunkte,
Keys, Modelle, Limits oder Bind-Adressen im Code. Getypte/validierte Werte bündelt
`repair/config.py`; jeder Wert hat einen sinnvollen Default (App startet auch ohne `.env`).
Ungültige Werte → **Fail-fast** beim Start (`config.validate()`). Neue Konfig: per
`os.environ.get(...)`/`config`-Getter lesen **und** in `.env.example` dokumentieren — der
Drift-Guard `tests/test_config_drift.py` erzwingt beides (lauffähig ohne Server). Ausnahme:
layout-abgeleitete Pfade (`DB_PATH`, `MEDIA_DIR`). Vollständige Variablentabelle: `README.md`.

## ChatGPT-Integration (AGENT-A, `repair/ai.py`)

- Lib: `openai` (>=1.0). Key aus `OPENAI_API_KEY` (via `python-dotenv`). Modell aus `OPENAI_MODEL` (Default `gpt-4o-mini`).
- System-Prompt: deutscher „ruhiger, ehrlicher Reparatur-Freund" (Ton siehe app-beschreibung im Chat-Transkript).
  Muss ein **valides `device`-JSON** nach obigem Schema zurückgeben (Structured Output / `response_format=json_object`).
  Sicherheits-Leitplanke: gefährliche Geräte (Mikrowelle, alles mit Hochspannung/Gas/Strom im Inneren) → `lights.Sicherheit.level="stop"`, `accentPath="stop"`, `recommend="pro"`.
- `schema.py` validiert/normalisiert das KI-JSON (fehlende Felder ergänzen, Level auf gut/mittel/stop zwingen, genau 4 lights); schlägt das fehl, liefert `diagnose` ein Fehler-Objekt (`code:"ai_error"`).

## HEAD-BLOCK (AGENT-B fügt diesen Block 1:1 in `<head>` von index.html ein)

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reparatur-Helfer</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com"></script>
<script>
  // Tailwind nur fürs Layout/Canvas-Scaffold; Komponenten-Look kommt aus repair.css (Theme-Variablen).
  tailwind.config = { corePlugins: { preflight: false } };
</script>
<link rel="stylesheet" href="{{ url_for('static', filename='css/repair.css') }}" />
```

JS am Body-Ende, in dieser Reihenfolge:
```html
<script src="{{ url_for('static', filename='js/ui.js') }}"></script>
<script src="{{ url_for('static', filename='js/screens.js') }}"></script>
<script src="{{ url_for('static', filename='js/app.js') }}"></script>
```

## Frontend-Verhalten (AGENT-B, Port von repair-app.jsx + repair-screens.jsx + repair-ui.jsx)

- Genau **eine** Phone-Instanz, mittig, 384×812, im Phone-Frame (`.rk-phone`), auf neutralem Body-BG.
- Theme-Switcher (oben, außerhalb des Phones): Solide / Werkstatt / Mutig → setzt CSS-Variablen am `.rk-phone`-Root + Klasse `rk-theme-<id>` und `rk-case-<upper|none>` am `.rk-app`. **Default: Werkstatt.**
- Startscreen-Eingabefeld: Freitext → `POST /api/diagnose` → bei Erfolg (`source:"ai"`) Live-Gerät durch den Flow. Es gibt keine Geräteliste/Beispiele mehr; Freitext (+ Multimodal) ist der einzige Einstieg. Antwortet die API mit einem Fehler-Objekt, zeigt der Startscreen den Hinweistext (`error`) an.
- Statemachine-Stages: `start → triage → ampel → decision → repair → result | path`, Protokoll-Sheet überall via Doc-Icon. Logik exakt wie `repair-app.jsx` (triage back/forward, answers slice, repair next/prev, handoff→pro, depth-Toggle Anfänger/Geübt).
- Klassennamen 1:1 wie in `repair.css` übernehmen (siehe Liste unten) — sonst greift das Styling nicht.

## Klassennamen-Vertrag (JS erzeugt sie, CSS stylt sie — exakt diese Namen)

`rk-phone rk-statusbar rk-time rk-status-right rk-bars rk-batt rk-screen rk-home
rk-app rk-screenwrap rk-body rk-footer rk-appbar rk-appbar-side rk-right rk-appbar-title
rk-bar-device rk-bar-step rk-iconbtn rk-eyebrow rk-q rk-q-tight rk-q-hint
rk-brand rk-brand-mark rk-brand-name rk-hero rk-hero-sub rk-input rk-input-ph rk-input-mic
rk-methods rk-method rk-method-e rk-method-t rk-mine rk-mine-head rk-device rk-device-e
rk-device-main rk-device-name rk-device-sub rk-device-go rk-device-sheet
rk-dots rk-dot done now rk-answers rk-answer rk-answer-on rk-freeanswer rk-triage-foot
rk-ampelcard rk-light rk-light-emoji rk-light-main rk-light-key rk-light-note rk-light-face
rk-verdict rk-verdict-go rk-verdict-stop rk-verdict-title rk-verdict-body
rk-trust rk-trust-dot rk-trust-i rk-aiwarn rk-aiwarn-strong
rk-paths rk-big rk-primary rk-soft rk-big-row rk-big-emoji rk-big-text rk-big-title rk-big-sub rk-big-arrow rk-reco
rk-compare rk-compare-head rk-compare-row rk-compare-k
rk-repair-tools rk-depth rk-speak rk-step-title rk-step-body rk-callout rk-callout-danger rk-callout-safety
rk-handoff rk-repair-foot rk-ghost rk-full rk-navrow rk-nav rk-nav-primary rk-nav-ghost
rk-slot rk-slot-tag rk-result-center rk-result-emoji rk-result-q rk-result-btns rk-big-yes rk-big-no
rk-win rk-impact rk-impact-cell rk-impact-num rk-impact-lab rk-win-foot rk-share-line
rk-proto rk-proto-head rk-proto-e rk-proto-name rk-proto-detail rk-proto-sec rk-proto-val
rk-proto-tags rk-proto-tag rk-proto-tag-muted rk-proto-ampel rk-proto-why rk-proto-reason
rk-proto-owner rk-proto-share rk-share-btn
rk-sheet-scrim rk-sheet rk-sheet-grip rk-sheet-title rk-sheet-note rk-sheet-fine rk-sheet-hr rk-sheet-level
rk-theme-solide rk-theme-werkstatt rk-theme-mutig rk-case-upper rk-case-none`

## Theme-Tokens (AGENT-C, Port von repair-themes.js — alle drei Themes als CSS-Variablen-Sets)

Werte 1:1 aus `../docs/design-handoff/project/repair-themes.js`. Default-Theme **Werkstatt** (Orange `--accent:#ff5a1f`, Indigo `--accent2:#2a2575`, harte Schatten `4px 4px 0 #16140f`, Space Grotesk).
CSS muss ohne Tweaks funktionieren: setze sinnvolle `--font-size:16px`, `--motion:.22s`, `--pad`, `--gap` als Defaults am `.rk-phone`.
Theme-Switch erfolgt per JS (setzt die Variablen am `.rk-phone`-Element) — CSS liefert die drei Token-Sets als JS-lesbare Konstante ODER AGENT-B hält die Token-Tabelle (siehe repair-themes.js) selbst. **Vereinbarung:** AGENT-B portiert die drei Token-Sets nach `app.js` (aus repair-themes.js) und setzt sie aufs Root; AGENT-C liefert die regelbasierte Komponenten-CSS + die `--*`-Defaults + theme-spezifische Overrides (`.rk-theme-werkstatt …`, `.rk-theme-mutig …`).

## Lauf-/Testkriterien (Definition of Done)

1. `pip install -r requirements.txt` && `flask --app app run` (oder `python app.py`) startet auf :5000.
2. `/` zeigt das Phone mit Startscreen im Werkstatt-Theme; Theme-Switcher wechselt live.
3. Freitext im Startfeld + konfiguriertes LLM-Backend (Ollama oder OpenAI) → `/api/diagnose` liefert ein KI-Gerät; Flow Start → Triage → Ampel → Decision → Repair → Result | Path.
4. Bei `accentPath:"stop"` (gefährliches Gerät): rote Ampel → Decision mit Vergleichstabelle + Empfehlung „Profi" → Selbst-Pfad endet im Stopp/Handoff zur Werkstatt.
5. Protokoll-Sheet füllt sich live mit den getippten Antworten.
6. Ohne LLM-Backend (oder bei API-Fehler): `/api/diagnose` antwortet mit Fehler-Objekt (`no_backend`/`ai_error`), der Startscreen zeigt den Hinweis — kein Crash.
