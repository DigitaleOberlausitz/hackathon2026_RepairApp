# Stufe 1 — Implementierungs-Vertrag (verbindlich für alle 3 Teammates)

> Ergänzt `SPEC.md`. Setzt PROJ-1 … PROJ-10 aus `../features/INDEX.md` um.
> Disjunktes Datei-Eigentum bleibt wie in `SPEC.md`: **Backend** = `app.py`,
> `requirements.txt`, `.env.example`, `README.md`, `repair/*`. **Frontend** =
> `templates/index.html`, `static/js/*`. **CSS** = `static/css/repair.css`.
> Kein Teammate fasst fremde Dateien an. Heutiges Datum für Datums-Logik: **2026-05-30**.

## 0. Leitprinzipien (gelten überall)

- **Warnen statt sperren** (D15): Kein Feature blockiert den Nutzer; alles ist überspringbar/fortsetzbar.
- **Datensparsamkeit**: Folgefragen nur wenn nötig; keine Pflicht-Personendaten.
- **Ehrlichkeit** (D3/D18): Schätzwerte/KI-Fallback sichtbar kennzeichnen, nie Sicherheit vortäuschen.
- **Demo läuft immer**: Seed-Flows Toaster 🟢 / Mikrowelle 🔴 bleiben voll funktionsfähig. Nie hart scheitern.
- JSON immer `ensure_ascii=False`. Echte Umlaute/Emojis.

## 1. Der Vorgangs-Zustand (`state`) — gemeinsamer Bus (PROJ-9)

Der Client hält `state` (in `app.js`). **Persistierbarer Teil** (alles außer transientem `ui`,
`devices`, `phoneEl`, `appEl`, `loading`, `draft`) wird serverseitig gespeichert. Schema:

```jsonc
{
  "id": "<vorgang-id|null>",
  "device": { /* device-Objekt, s. SPEC.md + §4 unten */ } | null,
  "stage": "start|triage|ownership|skillask|ampel|decision|repair|result|path|unclear",
  "ti": 0,                       // Triage-Index
  "ri": 0,                       // Repair-Schritt-Index
  "depth": "Anfänger|Geübt",
  "path": "self|local|pro|replace",
  "answers": [                   // PROJ-2: freitext ergänzt
    { "q": "...", "a": "...", "tag": "...", "freitext": "" }
  ],
  "ownership": {                 // PROJ-1
    "isOwner": "yes|no|unknown|null",   // null = noch nicht erfasst
    "owner": "" ,               // Freitext/Auswahl, "" = nicht angegeben
    "costBearer": ""            // "" = nicht angegeben
  },
  "skill": "Anfänger|Geübt|null",       // PROJ-3 (null = noch nicht gefragt)
  "warranty": {                  // PROJ-7
    "asked": false, "technicalDefect": null, "purchaseAge": "", "choice": "" // choice: "reklamation"|"weiter"|""
  },
  "safetyConfirms": { "0": { "adult": "yes|no", "confident": "yes|no", "ts": "<iso>" } }, // PROJ-8 keyed by step-index
  "diagnosis": {                 // PROJ-4
    "status": "ok|unclear|low|tech_error",
    "score": 0.85,              // 0..1
    "reason": ""                // Begründung der Einstufung
  },
  "decisionLog": [               // KI-Entscheidungsprotokoll (PROJ-4/9)
    { "ts": "<iso>", "kind": "diagnose|unclear|gate|confirm|ownership", "note": "...", "source": "", "confidence": "" }
  ],
  "createdAt": "<iso>", "updatedAt": "<iso>"
}
```

Backend behandelt `state` als **opaken Blob** beim Speichern, liest ihn aber für den Export (§3).
Fehlende Felder = Default (Backend/Frontend tolerant). Server setzt/aktualisiert `id`, `createdAt`, `updatedAt`.

## 2. Neue API-Endpunkte (Backend implementiert, Frontend konsumiert)

Persistenz (PROJ-9) — Store: **stdlib `sqlite3`**, Datei `webapp/vorgaenge.db` (in `.gitignore`),
eine Tabelle `vorgaenge(id TEXT PK, state TEXT/JSON, created TEXT, updated TEXT)`. Verbindung pro
Request (thread-safe). `id` = `secrets.token_urlsafe(12)` (nicht erratbar). Last-write-wins.

| Methode + Pfad                       | Body / Antwort |
|--------------------------------------|----------------|
| `POST /api/vorgang`                  | Body optional `{state}` → `201 {id, state}` (neuer Vorgang, id+Timestamps gesetzt) |
| `GET  /api/vorgang/<id>`             | `{id, state}` · **404** `{error}` bei unbekannt/abgelaufen (kein harter Fehler, kein Fremd-Leak) |
| `PUT  /api/vorgang/<id>`             | Body `{state}` → `{id, state}` · 404 wenn unbekannt. Speichert (überschreibt), aktualisiert `updated` |
| `GET  /api/foerderung`               | PROJ-6 → `{ items: [ {bezeichnung, traeger, region, stand, gueltigBis, quelle, beschreibung, status} ] }`, `status` ∈ `aktuell|veraltet|ausgelaufen` (server-berechnet gg. heute) |
| `GET  /api/vorgang/<id>/export.txt`  | PROJ-10 → `text/plain; charset=utf-8`, konsolidierter Klartext-Report |
| `GET  /v/<id>`                       | PROJ-10 → **Lese-Ansicht** (read-only HTML) des Vorgangs, mit Ablauf-Hinweis (Link gültig 30 Tage ab `created`; danach „nicht mehr verfügbar"). Enthält Print-Button (`window.print()`) = der **PDF-Weg** (keine Binär-Dependency). |

**Diagnose erweitern (PROJ-4)** — `POST /api/diagnose` Antwort zusätzlich:
`{"device": …, "source": "ai|fallback", "diagnosis": {"status","score","reason"}}`.
Schwelle (dokumentiert, reproduzierbar): Konfidenz-Score-Mapping `hoch=0.85, mittel=0.6, niedrig=0.35, sonst 0.5`.
**`status="unclear"`** wenn `score < 0.3` **oder** KI liefert keine plausible Ursache/`unclear`-Signal.
`status="low"` wenn `0.3 <= score < 0.55` (normales Ergebnis mit Niedrig-Konfidenz-Hinweis, **nicht** unclear).
Grenzwert inklusiv unten: `score == 0.3` → low (nicht unclear). `tech_error` nur bei technischem Fehler (nicht „unclear" im fachlichen Sinn). Seed-Geräte sind `ok` bzw. nach Mapping `low/ok` — bleiben normal.

## 3. Export-Inhalt (PROJ-10) — Backend rendert, eine zentrale Render-Funktion für txt + Lese-Ansicht

Konsolidierter Report enthält (fehlende Teile als „noch nicht ermittelt", Vorgang ggf. „in Bearbeitung / unvollständig"):
Gerät (Emoji, Name, Detail) · Symptom (`blurb`) · **Eigentum/Kostenträger** (PROJ-1, statt hartkodiert „mir/ich") ·
getestete Tags + **Freitexte** (PROJ-2) · Warn-Ampel je Achse (Level + Begründung) · Verdict + Empfehlung ·
**Quelle + Konfidenz** inkl. „KI-Fallback (nicht belegt)" wo `source=fallback` · Können/Skill (PROJ-3) ·
Garantie-Status + Wahl (PROJ-7) · Sicherheits-Bestätigungen (PROJ-8) · Unklar-Hinweis falls `diagnosis.status=unclear`.

## 4. `device`-Schema-Erweiterung (PROJ-5) — Backend (data/schema/ai), Frontend rendert

`compare` wird für **alle** Ampelzustände gerendert (nicht nur `stop`) und auf **4 Pfade** erweitert.
Schema neu/abwärtskompatibel:

```jsonc
"compare": {
  "repair": { "geld":"…","zeit":"…","umwelt":"…","hinweis":"" },   // Selbst-Reparatur
  "pro":    { "geld":"…","zeit":"…","umwelt":"…","hinweis":"" },   // Profi
  "neu":    { "geld":"…","zeit":"…","umwelt":"…",
              "versteckt": ["Neueinrichtung","Transport/Logistik","Bedienung neu lernen","Verkabelung","Ausfallzeit"] },
  "entsorgung": { "geld":"…","zeit":"…","umwelt":"…","hinweis":"" },
  "empfehlung": "repair|pro|neu|entsorgung",   // genau ein Pfad
  "begruendung": "…",                           // Text, macht Zielkonflikt transparent (D18)
  "geschaetzt": true                            // true → Schätz-/KI-Wert sichtbar markieren (D3)
}
```

`schema.normalize_device`: `compare` immer erzeugen (auch grün), alte 2-Pfad-Form (`repair`/`neu`)
tolerant auf neue Form heben; `empfehlung` defaulten aus `recommend` (`self→repair`, sonst direkt).
Seed-Geräte (`data.py`): Toaster (grün) **und** Mikrowelle (rot) bekommen vollständiges 4-Pfad-`compare`.
Ein Pfad kann `"geld":"— (nicht sinnvoll machbar)"` o. ä. tragen statt zu fehlen.
`ai.py`-Prompt: 4-Pfad-`compare` immer verlangen, `empfehlung`+`begruendung` setzen, `geschaetzt:true`.

## 5. Frontend-Flow & neue Stages (Frontend)

Neue/erweiterte Stages in der Statemachine (`app.js`) + Screens (`screens.js`):

1. **`ownership`** (PROJ-1): nach `pick`/Diagnose, **vor** `triage`. Frage „Ist das dein Gerät?" → `yes`/`nein`/`weiß nicht`.
   Bei `nein`: zwei schlanke Folgefragen (Eigentümer? Kostenträger?), beide überspringbar. Bei `yes`/skip: keine Folgefragen.
   Schreibt `state.ownership`. Bei `nein` → D14-Hinweis im Protokoll. „weiß nicht"/leer → „nicht angegeben / zu klären".
2. **`triage`** + **Freitext** (PROJ-2): pro Frage zusätzlich `<textarea>` (max 500 Zeichen, Zeichenzähler,
   trimmen, leer = nicht speichern, kein Block). Chip **und** Freitext gemeinsam speicherbar in `answers[i].freitext`.
   Re-Edit ersetzt Freitext derselben Frage. Freitext sichtbar im Protokoll, der Frage zugeordnet.
3. **`unclear`** (PROJ-4): wenn `diagnosis.status=='unclear'` (aus `/api/diagnose`) **oder** client-seitig
   erkannter Widerspruch in `answers`. Ehrlicher Text „keine verlässliche Eingrenzung möglich", **keine**
   Reparatur-/Sicherheits-Empfehlung, Weiterleitung **Profi / Repair Café / Community**, Export-Zugang,
   nie Sackgasse. Bei gefährlichem Gerät bleibt Gefahrenwarnung + Profi-Priorität. Trägt `decisionLog`-Eintrag.
4. **`skillask`** (PROJ-3): genau einmal **vor** `repair` (wenn `self` gewählt). Stufen „Anfänger"/„Geübt"
   (+ vorwurfsfreier Ausgang zu Profi/Café/Austausch, Vorgang bleibt). Setzt `state.skill` & `state.depth`.
   Steuert nur Darstellungstiefe, **nicht** die Ampel. Kein aktiver Klick → Default „Anfänger". Depth-Toggle
   im Repair-Screen bleibt und schreibt weiter `state.skill`.
5. **Garantie-Gate** (PROJ-7): genau einmal **vor dem ersten** Repair-Schritt, **nur** wenn technischer Defekt
   (Heuristik: `device.accentPath` o. Diagnose ≠ reiner Anwenderfehler — default: technischer Defekt annehmen
   im Zweifel) **und** Gewährleistung evtl. aktiv. Eine überspringbare Frage „Wann gekauft?" (Zeitspanne:
   `< 6 Mon`, `6 Mon–2 J`, `> 2 J`, `weiß nicht`). `> 2 J` → Gate entfällt. Sonst Warnung + Alternative
   Reklamation **und** sichtbare „Trotzdem selbst reparieren". Antwort/Wahl → `state.warranty`. Einmal
   beantwortet ⇒ im selben Vorgang nicht erneut.
6. **Sicherheits-Bestätigung** (PROJ-8): **vor** einem sicherheitskritischen Schritt (Kriterium:
   `step.danger === true` **oder** Gerät-Sicherheits-Light `level=='stop'` für diesen Schritt) — zeigt
   besonders deutliche Warnung + „Bist du volljährig?" + „Traust du dir das zu?". Kein hartes Altersgate
   (verneinen sperrt nicht, warnt deutlich, bietet Profi-Weg). Nach Bestätigung Schritt sichtbar. Pro Schritt
   max einmal (`state.safetyConfirms[index]`). Harmlose Schritte: nie. Toaster 🟢: nie.
7. **`decision`** (PROJ-5+6): `compare`-Tabelle **immer** (4 Pfade × Geld/Zeit/Ökologie), versteckte
   Austausch-Posten sichtbar, **ein** hervorgehobener Pfad + Begründung (Zielkonflikt transparent),
   Schätz-Markierung wenn `compare.geschaetzt`. **Förderblock** (PROJ-6) aus `/api/foerderung` als eigener,
   klar abgegrenzter Bereich: je Eintrag Stand + gültig-bis + Quelle + Disclaimer „unverbindlicher Hinweis,
   keine Zusage"; `status` veraltet/ausgelaufen sichtbar; keine Treffer → ehrlicher Hinweis (kein leerer Block).
8. **Persistenz-Sync** (PROJ-9): beim ersten zustandsändernden Schritt `POST /api/vorgang` (id holen,
   URL via `history.replaceState` auf `?v=<id>`). Nach **jedem** zustandsändernden Schritt `PUT` (fire-and-forget,
   nicht blockierend). Beim Laden: `?v=<id>` → `GET`; ok → State hydrieren & an gespeicherter Stage rendern;
   404 → Toast „Vorgang nicht gefunden" + frischer Start. Funktioniert ohne Login.
9. **Export/Teilen** (PROJ-10): Protokoll-Sheet-Buttons real verdrahten — „PDF" (öffnet `/v/<id>` →
   Drucken/Als-PDF), „Nachricht/Text" (holt `export.txt`, `navigator.clipboard` + Toast), „Link" (zeigt
   `/v/<id>`-URL, kopierbar, mit Sichtbarkeits-/Ablauf-Hinweis). Unvollständiger Vorgang exportierbar.
   Ohne `state.id` zuerst Vorgang anlegen.

Protokoll-Steckbrief (`ProtocolContent`): Eigentum dynamisch aus `state.ownership` (statt fix „mir/ich"),
Freitexte je Frage, Können/Skill, Garantie-Status, Unklar-Hinweis. (`ProtocolContent` braucht jetzt `state`-Zugriff;
`app.js` reicht die nötigen Felder als Props herein.)

## 6. Neue CSS-Klassennamen (Frontend erzeugt **exakt diese**, CSS stylt sie)

Bestehende Klassen aus `SPEC.md` weiter nutzen. **Neu** (Frontend & CSS müssen identisch sein):

```
rk-owner rk-owner-q rk-owner-followup
rk-triage-text rk-triage-text-wrap rk-charcount rk-charcount-over
rk-skillask rk-skill-opt rk-skill-out
rk-unclear rk-unclear-emoji rk-unclear-title rk-unclear-body rk-unclear-paths
rk-compare-4 rk-compare-path rk-compare-reco rk-compare-hidden rk-compare-hidden-item rk-compare-na rk-est-tag rk-compare-begruendung
rk-foerder rk-foerder-head rk-foerder-item rk-foerder-name rk-foerder-meta rk-foerder-badge rk-foerder-stale rk-foerder-expired rk-foerder-src rk-foerder-disclaimer rk-foerder-empty
rk-gate rk-gate-warn rk-gate-q rk-gate-actions rk-gate-alt rk-gate-proceed
rk-confirm rk-confirm-warn rk-confirm-q rk-confirm-row rk-confirm-actions rk-confirm-proceed rk-confirm-alt
rk-toast rk-toast-show
rk-link-box rk-link-url rk-link-note rk-share-toast
```

Die Lese-Ansicht `/v/<id>` ist Backend-eigen und bringt **eigenes, inlinetes** Print-CSS mit (entkoppelt von `repair.css`).

## 7. Definition of Done (Lead testet integrativ)

1. Backend-Smoke (ohne Key): `python -c "import app; from repair import data, ai; print(len(data.seed_devices())); print(ai.diagnose('Toaster')['source'])"` → `2` / `fallback`.
2. Persistenz: `POST /api/vorgang` → id; `PUT` State; `GET` identisch; Server-Neustart übersteht.
3. Toaster 🟢: Start → ownership → 4 Triage (+Freitext möglich) → ampel → decision (4-Pfad-Vergleich + Förderblock) → skillask → 5 Schritte (kein Gate/Confirm bei harmlos) → Rückblick.
4. Mikrowelle 🔴: ampel rot → decision (Vergleich, Empfehlung Profi) → self-Pfad → Sicherheits-Bestätigung vor `danger`-Schritt → Handoff.
5. Garantie-Gate erscheint genau einmal vor 1. Schritt (techn. Defekt + Gewährleistung), überspringbar, „trotzdem weiter".
6. Export: `export.txt` enthält Eigentum/Freitext/Ampel/Quelle; `/v/<id>` Lese-Ansicht + Print; Link-Ablauf-Hinweis.
7. Reload mit `?v=<id>` stellt Vorgang her. Unbekannte id → sauberer Neustart.
8. Alle 3 Themes rendern alle neuen Komponenten sauber. Demo nie hart gescheitert.
