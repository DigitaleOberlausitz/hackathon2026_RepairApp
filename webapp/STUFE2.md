# Stufe 2 — Implementierungs-Vertrag (verbindlich für alle 3 Teammates)

> Ergänzt `SPEC.md` + `STUFE1.md`. Setzt PROJ-11, 12, 13, 14, 25, 26 aus `../features/INDEX.md` um.
> **Disjunktes Datei-Eigentum** bleibt exakt wie in STUFE1.md:
> **Backend (AGENT-A)** = `app.py`, `requirements.txt`, `.env.example`, `README.md`, `repair/*`.
> **Frontend (AGENT-B)** = `templates/index.html`, `static/js/*`.
> **CSS (AGENT-C)** = `static/css/repair.css`.
> Kein Teammate fasst fremde Dateien an. Heutiges Datum für Datums-Logik: **2026-05-30**.

## 0. Leitprinzipien (gelten überall — aus STUFE1 übernommen + Stufe-2-Schärfung)

- **Warnen statt sperren** (D15): Kein Feature blockiert; alles überspringbar/fortsetzbar.
- **Keine erfundenen Anbieter/Teile/Geräte**: Alle Listen sind **kuratierte Demodaten**, im Datenmodul
  als solche gekennzeichnet (`quelle`, `kuratiert: true`, ehrlicher Quellentext). Niemals echte Firmen
  faktisch behaupten ohne Quellen-Disclaimer. Jeder Datensatz trägt einen sichtbaren Quellen-/Demo-Hinweis.
- **Ehrliche Leertreffer (Fallback)**: Wenn eine Liste leer ist → freundlicher, ehrlicher Hinweis
  („in deiner Region keine bekannten Einträge" + Alternativ-Option), **nie** leerer Block, nie Attrappe.
- **Vertrauens-Indikator (D3, PROJ-25)**: Jede inhaltliche Aussage trägt Konfidenz + Quelle, eskaliert
  mit Kritikalität. Nie falsche Gewissheit. Bei `stop`/Gefahr besonders deutlich.
- **Affiliate-Leitplanke (D8, PROJ-14)**: Empfehlung folgt **immer** dem echten Nutzen/der Ampel —
  günstigste/sinnvollste Quelle zuerst. Bestelloption ist **nachgelagert**, klar als „Partner-Link
  (Provision)" gekennzeichnet, **nie** vorausgewählt, kein Dark Pattern.
- **Demo läuft immer**: Toaster 🟢 / Mikrowelle 🔴 bleiben voll funktionsfähig. Nie hart scheitern.
  Alle neuen Endpunkte liefern auch ohne OpenAI-Key valide Daten (kuratierter Seed).
- JSON immer `ensure_ascii=False`. Echte Umlaute/Emojis.

## 1. State-Erweiterung (gemeinsamer Bus, baut auf STUFE1.md §1 auf)

Neue persistierbare Felder im `state` (Frontend hält, Backend speichert opak + liest für Export):

```jsonc
{
  // … alle Stufe-1-Felder bleiben …
  "stage": "… | vermittlung | entsorgung | produktsuche | beschaffung",  // neue Stages ergänzt
  "kategorie": "",          // PROJ-11/12/13: abgeleitete Gerätekategorie (z.B. "kleingeraet","grossgeraet","elektronik","mobilitaet"), "" = unbekannt
  "ort": "",                // PROJ-11/12: optionaler Standort-Freitext (PLZ/Ort), "" = nicht angegeben, nie Pflicht
  "vermittlung": {          // PROJ-11
    "viewed": false,
    "selected": ""          // id des gewählten Anbieters, "" = keiner gewählt
  },
  "entsorgung": { "viewed": false, "selected": "" },   // PROJ-12
  "produktsuche": { "viewed": false, "selected": "" }, // PROJ-13
  "beschaffung": {          // PROJ-14
    "viewed": false,
    "parts": []             // Liste gemerkter Teile-ids (für Protokoll)
  },
  "trust": {                // PROJ-25 — durchgängiger Vertrauens-Kontext (vom Backend/Diagnose gespeist)
    "level": "hoch|mittel|niedrig",   // Gesamtkonfidenz des Vorgangs
    "source": "",                      // dominierende Quelle ("kuratiert" | "KI-Einschätzung" | "KI-Fallback")
    "reason": ""
  }
}
```

`state.kategorie` wird im Frontend aus `device` heuristisch gesetzt (Default `"kleingeraet"`), darf vom
Nutzer nicht erfragt werden müssen. `state.ort` nur optional über ein Eingabefeld in den Service-Screens.
Fehlende Felder = Default (tolerant). **Keine** Pflichtfelder, **kein** Login.

## 2. Neue API-Endpunkte (Backend implementiert, Frontend konsumiert)

Alle liefern HTTP 200 mit kuratiertem Seed (scheitern nie hart). `ensure_ascii=False`.
Query-Parameter sind **optional** und filtern nur (kein Filter ⇒ alle Einträge).

| Methode + Pfad | Query | Antwort |
|---|---|---|
| `GET /api/anbieter`     | `?kat=&ort=` | PROJ-11 → `{ items:[{id,name,typ,adresse,ort,plz,entfernung,kontakt,oeffnungszeiten,spezialisierung,kostenhinweis,quelle,kuratiert}], fallback:bool, hinweis:"" }` · `typ` ∈ `repaircafe\|werkstatt\|profi` |
| `GET /api/entsorgung`   | `?kat=&ort=` | PROJ-12 → `{ items:[{id,art,name,adresse,ort,annahmezeiten,hinweise,kosten,rohstoff,quelle,kuratiert}], fallback:bool, hinweis:"" }` · `art` ∈ `wertstoffhof\|ruecknahme\|sammelstelle` |
| `GET /api/alternativen` | `?kat=`      | PROJ-13 → `{ items:[{id,modell,preis,ausstattung,energieklasse,lieferzeit,einrichtung,vergleich:{geld,zeit,umwelt},quelle,kuratiert}], breakEven:"", hinweis:"", fallback:bool }` |
| `GET /api/ersatzteile`  | `?device=&defekt=` | PROJ-14 → `{ items:[{id,teil,passendFuer,preis,verfuegbarkeit,versand,quelle,kuratiert, bestelloption:{verfuegbar:bool,partner:"",affiliate:true,hinweis:"…Provision…"}}], guenstigsteZuerst:true, hinweis:"", fallback:bool }` |
| `GET /api/triage/universal` | — | PROJ-26 → `{ fragen:[{q,hint,options:[{a,tag}], freitext:true}] }` (5 systematische Fragen, gerätunabhängig) |

**Diagnose erweitern (PROJ-25/D3)** — `POST /api/diagnose` Antwort bekommt zusätzlich pro Aussage
eine Vertrauens-Angabe. Konkret: `diagnosis` behält `{status,score,reason}` (Stufe 1) und erhält
`{ trust: { level:"hoch|mittel|niedrig", source:"kuratiert|KI-Einschätzung|KI-Fallback", reason:"" } }`.
Mapping reproduzierbar: `source=="fallback"` ⇒ `trust.level="niedrig"`, `source="KI-Fallback"`;
KI-Antwort mit `score>=0.8` ⇒ `hoch`; `0.5..0.8` ⇒ `mittel`; sonst `niedrig`. Seed-Geräte (kuratiert)
⇒ `level="hoch"`, `source="kuratiert"`. Bei `stop`/Gefahr Begründung verschärfen.

**Export erweitern (PROJ-10 → Stufe 2)** — `export.py` rendert zusätzliche Abschnitte **falls vorhanden**:
gewählter/angesehener Anbieter (PROJ-11), Entsorgungsweg (PROJ-12), Alternativgerät (PROJ-13),
gemerkte Ersatzteile inkl. Affiliate-Kennzeichnung (PROJ-14), Vertrauens-/Quellen-Zeile je Aussage (PROJ-25).
Fehlende Teile bleiben „noch nicht ermittelt". Export bleibt für unvollständige Vorgänge nutzbar.

## 3. Neue Backend-Module (Backend, in `repair/`) — Muster wie `foerderung.py`

Jeweils kuratierte Liste + `list_*()`-Funktion, jeder Eintrag mit `quelle` + `kuratiert: True`.
Keine Netzwerkzugriffe, kein Scraping — **kuratierter statischer Seed** (Demo läuft offline).

- `repair/anbieter.py`   → `list_anbieter(kat=None, ort=None)` — min. 1 Repair-Café + 1 Werkstatt + 1 Profi; mind. ein Filter-Fall, der **leer** ist → testet Fallback-Hinweis.
- `repair/entsorgung.py` → `list_entsorgung(kat=None, ort=None)` — Wertstoffhof + Rücknahme + Sammelstelle, je mit Rohstoff-Hinweis.
- `repair/produktsuche.py` → `list_alternativen(kat=None)` — 2–3 Alternativgeräte je Kategorie + `breakEven`-Text (ehrlicher Öko-Break-Even), Einrichtungsaufwand 0–3.
- `repair/ersatzteile.py` → `list_ersatzteile(device=None, defekt=None)` — **günstigste zuerst sortiert**, Bestelloption nachgelagert + Affiliate-Disclaimer (D8). Mind. ein „nicht lieferbar"-Eintrag mit Alternativ-/Herstellerhinweis.
- `repair/triage.py`     → `universal_fragen()` — die 5 systematischen Fragen (Symptom, Bedingungen/„immer oder manchmal", Historie/„seit wann", bereits getestet, eigene Vermutung), jeweils mit Optionen + `freitext:true`.

`ai.py`: `diagnose()` ergänzt `diagnosis.trust` (s.o.). Seed/Fallback ⇒ kuratiert/niedrig korrekt setzen.
`__init__.py`: neue Module exportieren, falls dort Re-Exports gepflegt werden.

## 4. Frontend-Flow & neue Stages (Frontend)

Andockung an den 4-Pfad-`decision`-Screen aus Stufe 1 (Pfade repair/pro/neu/entsorgung):

1. **PROJ-26 universelle Triage**: Wenn `device` unbekannt/generisch (kein Seed-Treffer) ODER als
   ergänzender erster Frageblock — die 5 Fragen aus `GET /api/triage/universal` rendern (gleiche
   Triage-Mechanik + Freitext wie PROJ-2). Antworten landen in `state.answers` (gleiches Schema).
   Gerätunabhängig: dieselben Fragen müssen für Toaster wie für „unbekanntes Gerät" sinnvoll sein.
2. **PROJ-25 Vertrauens-Badge (Querschnitt)**: Eine **wiederverwendbare** Badge-Funktion (z.B.
   `TrustBadge(level, source, reason)`) rendert `rk-trust` + Ampel-Punkt (🟢/🟡/🔴) + Quelle, Tooltip/Title
   mit `reason`. Eingesetzt: an der Diagnose-/Verdict-Einschätzung, an jeder `compare`-Schätzung
   (ergänzt `rk-est-tag`), an Anbieter-/Entsorgungs-/Alternativ-/Teile-Karten (Quelle+`kuratiert`),
   sichtbarer Dauer-Hinweis „Die KI kann Fehler machen" skaliert mit Kritikalität (deutlicher bei `stop`).
3. **PROJ-11 `vermittlung`-Stage**: erreichbar wenn `decision`-Pfad `pro`/`local` gewählt **oder** über
   einen „Anbieter in der Nähe finden"-Button (auch aus `unclear`-Pfad/Profi-Empfehlung). Optionales
   Ort-Feld (`rk-loc-input`), Liste aus `GET /api/anbieter`. Karten gruppiert nach `typ`; Repair-Café
   als **kostenlos/ehrenamtlich** kennzeichnen, Werkstatt/Profi als kostenpflichtig. Auswahl → `state.vermittlung`.
   Leertreffer → `rk-svc-empty`-Hinweis. Nie Sackgasse, Export bleibt erreichbar.
4. **PROJ-12 `entsorgung`-Stage**: erreichbar wenn `decision`-Pfad `entsorgung` **oder** Button. Liste aus
   `GET /api/entsorgung`. Je Eintrag Art, Adresse, Annahmezeiten, **Rohstoff-Hinweis**, Kosten. Auswahl →
   `state.entsorgung`. Leertreffer → ehrlicher Bundes-/ElektroG-Fallback-Hinweis.
5. **PROJ-13 `produktsuche`-Stage**: erreichbar wenn `decision`-Pfad `neu`/`replace` **oder** Button.
   Liste aus `GET /api/alternativen`, dargestellt **konsistent zur `compare`-Optik** (Geld/Zeit/Ökologie je
   Karte) + Einrichtungsaufwand-Indikator + **`breakEven`-Hinweis** (ehrlich: „neu lohnt erst, wenn …").
   Auswahl → `state.produktsuche`. Hängt an PROJ-5-Optik.
6. **PROJ-14 `beschaffung`-Block**: innerhalb des Repair-Flows (Schicht B), als eigener Block im
   Repair-/Protokoll-Screen, gespeist aus `GET /api/ersatzteile`. **Günstigste Quelle zuerst**;
   Bestelloption klar separiert + `rk-affiliate`-Label „Partner-Link (Provision)", **nie** vorausgewählt.
   „Merken" → `state.beschaffung.parts`. „Nicht lieferbar" zeigt Alternativ-/Herstellerhinweis.
7. **Persistenz-Sync (PROJ-9 weiter)**: jede neue Stage/Auswahl ist ein zustandsändernder Schritt →
   `PUT` (fire-and-forget) wie in Stufe 1. Reload via `?v=<id>` stellt auch neue Stages her.
8. **Export/Protokoll (PROJ-10 weiter)**: `ProtocolContent` zeigt — falls gesetzt — gewählten Anbieter,
   Entsorgungsweg, Alternativgerät, gemerkte Teile (mit Affiliate-Hinweis) und Vertrauens-/Quellenzeilen.

Kein Pfad ist Sackgasse: aus jeder Service-Stage führt ein Weg zu Export/Protokoll und zurück.

## 5. Neue CSS-Klassennamen (Frontend erzeugt **exakt diese**, CSS stylt sie)

Bestehende Klassen (SPEC.md + STUFE1.md) weiter nutzen. **Neu** (Frontend & CSS identisch):

```
rk-trust rk-trust-hoch rk-trust-mittel rk-trust-niedrig rk-trust-dot rk-trust-src rk-trust-note
rk-svc rk-svc-head rk-svc-intro rk-svc-list rk-svc-card rk-svc-card-sel rk-svc-name rk-svc-typ
rk-svc-meta rk-svc-badge rk-svc-cost rk-svc-free rk-svc-src rk-svc-empty rk-svc-select
rk-loc-input rk-loc-label
rk-typ-repaircafe rk-typ-werkstatt rk-typ-profi
rk-disp rk-disp-art rk-disp-rohstoff rk-disp-zeiten rk-disp-kosten
rk-alt rk-alt-card rk-alt-modell rk-alt-spec rk-alt-vergleich rk-alt-setup rk-alt-breakeven
rk-parts rk-parts-head rk-parts-item rk-parts-price rk-parts-stock rk-parts-oos rk-parts-keep
rk-affiliate rk-order-opt rk-order-disclaimer
rk-univ rk-univ-q
```

Die Lese-Ansicht `/v/<id>` bleibt Backend-eigen mit inlinetem Print-CSS (entkoppelt von `repair.css`).

## 6. Definition of Done (Lead testet integrativ)

1. Backend-Smoke (ohne Key): `python -c "import app; from repair import anbieter, entsorgung, produktsuche, ersatzteile, triage; print(len(anbieter.list_anbieter()), len(entsorgung.list_entsorgung()), len(produktsuche.list_alternativen()), len(ersatzteile.list_ersatzteile()), len(triage.universal_fragen()))"` → alle > 0.
2. Jeder neue Endpunkt liefert 200 + valides JSON, auch mit unbekanntem Filter (dann `fallback:true` + Hinweis), nie 500.
3. `ersatzteile`: Liste ist **günstigste zuerst** sortiert; Bestelloption als Affiliate gekennzeichnet, nicht vorausgewählt (D8 prüfbar).
4. PROJ-25: Diagnose-Antwort trägt `diagnosis.trust`; Seed=kuratiert/hoch, Fallback=KI-Fallback/niedrig. UI zeigt `rk-trust`-Badge mit korrekter Ampelfarbe.
5. Flow Mikrowelle 🔴: decision → Pfad `pro` → `vermittlung` (Anbieter, Repair-Café als kostenlos markiert) → Auswahl landet im Export. Pfad `neu` → `produktsuche` mit breakEven. Pfad `entsorgung` → `entsorgung` mit Rohstoff-Hinweis.
6. Flow Toaster 🟢: self-Pfad → `beschaffung`-Block zeigt Teil + Affiliate-getrennte Bestelloption.
7. PROJ-26: `GET /api/triage/universal` liefert 5 Fragen; UI rendert sie für ein generisches/unbekanntes Gerät mit Freitext.
8. Leertreffer-Fallbacks (Anbieter/Entsorgung/Alternativen) zeigen ehrlichen Hinweis statt leerem Block.
9. Export `export.txt` + `/v/<id>` enthalten die neuen Abschnitte, falls gesetzt; bleiben für unvollständige Vorgänge nutzbar.
10. Alle 3 Themes rendern alle neuen Komponenten sauber. Reload via `?v=<id>` stellt neue Stages her. Demo nie hart gescheitert.
