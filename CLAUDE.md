# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projektstand

Zwei Stränge im Repo:

1. **Lauffähige Web-App** in `webapp/` — eine echte Nachbildung des Design-Prototyps als
   **Python (Flask)** Backend + **Vanilla-JS**-Statemachine-Frontend + **Tailwind CSS**, mit
   optionaler **OpenAI-Live-Diagnose** aus Freitext. Verbindlicher Implementierungs-Vertrag:
   `webapp/SPEC.md`; Setup/Run/Test: `webapp/README.md`.
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
cp .env.example .env                                 # optional, s. u.
python app.py                                        # → http://127.0.0.1:5000
```

Backend-Smoke-Test (läuft ohne Key, nutzt Fallback):

```bash
cd webapp
python -c "import app; from repair import data, ai; print(len(data.seed_devices())); print(ai.diagnose('Mein Toaster wirft nicht mehr aus')['source'])"
# erwartet: 2  /  fallback
```

**OpenAI-Key (optional):** `OPENAI_API_KEY=sk-...` in `webapp/.env` (Modell via `OPENAI_MODEL`,
Default `gpt-4o-mini`). **Ohne Key läuft die App weiter** — `POST /api/diagnose` fällt sauber auf
das passendste Seed-Gerät zurück (`"source": "fallback"`), scheitert nie hart.

### Architektur & Dateieigentum

Quelle/Design-of-truth: `docs/design-handoff/project/` (HTML/CSS/JSX-Prototyp, **pixelgenau**
nachbauen). Der `device`-Datenvertrag, die API-Endpunkte, der Klassennamen-Vertrag und die
Theme-Tokens stehen verbindlich in **`webapp/SPEC.md`** — vor Änderungen dort nachsehen.

```
webapp/
  app.py               Flask-App + Routen (GET /, /api/devices, /api/device/<id>, POST /api/diagnose)
  repair/
    data.py            Seed-Geräte (Port von repair-data.js): Toaster 🟢, Mikrowelle 🔴
    schema.py          normalize_device() — Validierung/Reparatur eines device-Objekts
    ai.py              diagnose() — OpenAI-Diagnose mit Seed-Fallback
  templates/index.html SPA-Shell
  static/js/           ui.js · screens.js · app.js (Statemachine, Theme-Switcher)
  static/css/repair.css Komponenten-Styling + 3 Themes (Default: Werkstatt)
```

- JSON immer mit `ensure_ascii=False` (echte Emojis/Umlaute, kein ASCII-Escaping).
- `POST /api/diagnose` liefert immer HTTP 200 — KI (`source:"ai"`) oder Fallback (`source:"fallback"`).
- Gefährliche Geräte (Hochspannung/Gas/Strom) → in der KI-Antwort `accentPath="stop"`,
  `recommend="pro"`, `lights.Sicherheit.level="stop"`.

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
