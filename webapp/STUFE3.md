# Stufe 3 — Implementierungs-Vertrag (verbindlich für alle 3 Teammates)

> Ergänzt `SPEC.md` + `STUFE1.md` + `STUFE2.md`. Setzt **PROJ-15, 16, 17, 18, 19, 20, 21,
> 22, 23, 24, 27** aus `../features/INDEX.md` (Stufe 3) um.
> **Disjunktes Datei-Eigentum bleibt exakt wie in STUFE1/2:**
> **Backend (AGENT-A)** = `app.py`, `requirements.txt`, `.env.example`, `README.md`, `repair/*`,
>   **`webapp/.gitignore`** (Laufzeit-Artefakte aus `repair/*`). AGENT-A ergänzt dort:
>   `wissensbasis.db`, `media/`.
> **Frontend (AGENT-B)** = `templates/index.html`, `static/js/*`.
> **CSS (AGENT-C)** = `static/css/repair.css`.
> Kein Teammate fasst fremde Dateien an. Heutiges Datum für Datums-Logik: **2026-05-30**.

## 0. Leitprinzipien (aus STUFE1/2 übernommen + Stufe-3-Schärfung)

- **Warnen statt sperren** (D15): Kein Feature blockiert hart. Rückruf, Datenlöschung,
  rotes Gesamt-Fazit, Consent-Ablehnung — alles bleibt fortsetzbar. **Einzige Ausnahme im
  Wortsinn „blockierend":** das Consent-Gate blockiert nur die *erste Datenverarbeitung*
  bis zu einer bewussten Entscheidung (PROJ-22), nicht den Reparaturpfad als solchen.
- **Kuratiert zuerst (D2)**: Wissensanfragen gehen erst an die kuratierte Sammlung
  (PROJ-15), dann gekennzeichneter KI-Fallback, dann optional Online. Reihenfolge
  deterministisch. Herkunft + Konfidenz sind **nie** leer (D3).
- **Entwurf vs. geprüft (D5/D13)**: Nur menschlich freigegebene Einträge gelten als
  `kuratiert`. KI-Entwürfe (auch Schwungrad-Beiträge) bleiben `entwurf` und werden **nie**
  als kuratiert ausgespielt. Freigabe erfordert **menschliche Sicherheits-Bestätigung**.
- **Strikte Rollen-Abgrenzung**: `diagnose` nennt nur Ursachen, `bewertung` stuft die
  Ampel ein, `abwaegung` empfiehlt den Pfad, `lotse` steuert nur prozedural. Kein Baustein
  übernimmt die Aufgabe eines anderen.
- **Demo läuft immer**: Toaster 🟢 / Mikrowelle 🔴 + alle bestehenden Flows bleiben voll
  funktionsfähig, auch ohne OpenAI/Ollama-Key. Jeder neue Endpunkt liefert valides JSON
  (HTTP 200, kuratierter Seed/Fallback), scheitert nie hart (kein 500 im Normalbetrieb).
- **Mehrsprachig (D17)**: Deutsch + Englisch. Sicherheitsrelevante Aussagen sind in beiden
  Sprachen vollständig gleichwertig. Sprachwahl ändert nur die Darstellung, nie die
  fachliche Bewertung.
- JSON immer `ensure_ascii=False`. Echte Umlaute/Emojis.

## 1. State-Erweiterung (gemeinsamer Bus — Frontend hält, Backend speichert opak)

Alle Stufe-1/2-Felder bleiben. **Neu** (alle optional, tolerante Defaults, **keine**
Pflichtfelder, **kein** Login). `PERSIST_KEYS` in `app.js` um die neuen Felder ergänzen.

```jsonc
{
  // PROJ-24 — Sprache (Querschnitt)
  "lang": "de",                 // "de" | "en"; Default aus Browser, vom Nutzer umschaltbar

  // PROJ-17 — kuratierte Diagnose
  "fehlerzustand": {
    "kandidaten": [],           // [{id, ursache, herkunft:"kuratiert|ki-ermittelt", konfidenz:"hoch|mittel|niedrig", quelle}]
    "gewaehlt": "",             // id des eingegrenzten Kandidaten, "" = offen
    "abgrenzung": { "offen": [], "beantwortet": {} },  // offen:[{q,options}], beantwortet:{q->antwort}
    "unklar": false             // true → Übergabe an Unklar-Pfad (PROJ-4)
  },

  // PROJ-21 — Mehrfachdefekte
  "defekte": [],                // [{id, name, lights:[4], recommend, verdictTitle}] — leer/1 Element = Einzelfall wie heute
  "gesamtFazit": null,          // null bei <2 Defekten; sonst {recommend, level, knackpunktId, begruendung, prioritaet:[ids]}

  // PROJ-19 — Rückruf / Sicherheitsmangel
  "rueckruf": { "hit": false, "grund": "", "quelle": "", "stand": "", "gueltigBis": "",
                "vorgehen": "", "modellUnsicher": false, "art": "rueckruf|sicherheitsmangel" },

  // PROJ-20 — Datenlöschung vor Fremdabgabe
  "datentragend": null,         // null = noch nicht ermittelt, true/false
  "abgabe": "",                 // "" | "dritte" (Werkstatt/Profi) | "diy"
  "datenloeschung": { "backup": false, "loeschen": false, "abmelden": false, "bewusstUebersprungen": false },

  // PROJ-22 — Consent-Gate
  "consent": { "status": "offen", "zeitpunkt": "" },  // "offen|erteilt|abgelehnt|widerrufen"

  // PROJ-23 — Schwungrad
  "schwungrad": { "beigetragen": false, "beitragId": "", "ausgeschlossen": [] },

  // PROJ-27 — Multimodale Eingabe
  "medienConsent": false,       // separate Einwilligung vor erster Foto-/Sprachaufnahme
  "medien": []                  // [{id, art:"foto|video|audio", ref, hinweis}]
}
```

`reviveState()`/`resetState()` in `app.js` setzen alle neuen Felder tolerant (Default wie
oben). `state.lang` zusätzlich in `localStorage('rk-lang')` spiegeln (sitzungsübergreifend).

## 2. Neue API-Endpunkte (Backend implementiert, Frontend konsumiert)

Alle: HTTP 200 + valides JSON + `ensure_ascii=False`, scheitern nie hart. Query-Parameter
optional. `lang` (de/en) wird per Query `?lang=` **oder** JSON-Feld übergeben; Default `de`.

| Methode + Pfad | Feature | Antwort (Kurzform) |
|---|---|---|
| `GET  /api/wissensbasis` | PROJ-15 | `?status=geprueft\|entwurf\|alle (default geprueft)&kat=` → `{ items:[fehlerzustand], counts:{geprueft,entwurf} }` |
| `GET  /api/wissensbasis/<id>` | PROJ-15 | einzelner `fehlerzustand` oder 404 |
| `POST /api/wissensbasis/entwurf` | PROJ-15 | Body `{kategorie, symptom, lang}` → KI-Entwurf (oder Heuristik-Fallback) als `status:"entwurf"`, gespeichert; → `{item, source:"ai\|fallback"}` |
| `POST /api/wissensbasis/<id>/freigabe` | PROJ-15 | Body `{sicherheitBestaetigt:true, sicherheit:"gut\|mittel\|stop", komplexitaet?}` → 200 nur wenn `sicherheitBestaetigt`; setzt `status:"geprueft"`, schreibt Version/Stand. Ohne Bestätigung **409** + Hinweis. |
| `POST /api/wissensbasis/<id>/zurueckziehen` | PROJ-15 | → `status:"entwurf"` (zurückgezogen), Version aktualisiert |
| `POST /api/recherche` | PROJ-16 | Body `{frage, kontext?, lang}` → `{aussage, herkunft:"kuratiert\|ki-fallback", quelle, konfidenz:"hoch\|mittel\|niedrig", widerspruch:bool, online:bool, nurDeutsch:bool}` — Felder nie leer |
| `POST /api/diagnose` (**erweitern**) | PROJ-17/24 | Bestehende Antwort `{device, source, diagnosis}` **bleibt**. Body akzeptiert zusätzlich `{kategorie?, answers?, lang?}`. Antwort bekommt **additiv** `diagnosis.kandidaten:[{id,ursache,herkunft,konfidenz,quelle}]`, `diagnosis.abgrenzung:{offen:[],}`, `diagnosis.unklar:bool`. Sprache der KI-Texte folgt `lang`. |
| `GET  /api/rueckruf` | PROJ-19 | `?modell=&kat=` → `{hit, art, grund, quelle, stand, gueltigBis, vorgehen, modellUnsicher}` (hit:false wenn nichts hinterlegt) |
| `POST /api/bewertung/gesamt` | PROJ-21 | Body `{defekte:[{id,name,lights:[4],recommend}]}` → `{einzel:[...unverändert...], gesamtFazit:{recommend,level,knackpunktId,begruendung,prioritaet}}` — bei <2 Defekten `gesamtFazit:null` |
| `GET  /api/consent/text` | PROJ-22 | `?lang=` → `{titel, body, trainingshinweis, verweisPROJ23, optionen:{erteilen,ablehnen}}` |
| `POST /api/vorgang/<vid>/consent` | PROJ-22 | Body `{status:"erteilt\|abgelehnt\|widerrufen"}` → schreibt `state.consent={status,zeitpunkt}` in den Vorgang (Server-Zeitstempel), → aktualisierter Vorgang |
| `GET  /api/schwungrad/grobgate` | PROJ-23 | → dokumentiertes Grob-Gate-Ergebnis `{einwilligung:bool, anonymisierungText:bool, anonymisierungFoto:"teilweise", tragfaehig:bool, begruendung}` |
| `POST /api/schwungrad/beitrag` | PROJ-23 | Body `{vorgangId}` → nur bei `consent.status=="erteilt"`; baut anonymisierten **Entwurf** in die Wissensbasis (PROJ-15), → `{beitragId, ausgeschlossen:[...], ohneEinwilligung:bool}`. Ohne Consent: `ohneEinwilligung:true`, kein Beitrag. |
| `POST /api/anonymisieren` | PROJ-23 | Body `{text}` → `{text, entfernt:["e-mail","telefon",…]}` (Hilfs-Endpunkt + intern genutzt) |
| `POST /api/vorgang/<vid>/medien` | PROJ-27 | multipart `file` (oder Body `{dataUrl, art}`) → speichert Medium, → `{id, art, ref, hinweis}`; prüft Größe/Typ; bei unbrauchbar `{hinweis:"…"}` |
| `GET  /media/<mid>` | PROJ-27 | liefert gespeichertes Medium (richtiger Content-Type) oder 404 |
| `POST /api/transkription` | PROJ-27 | optional: Body audio → `{text, source:"whisper\|hinweis"}`; ohne Backend `{text:"", source:"hinweis", hinweis:"Browser-Spracherkennung nutzen"}` |
| `GET  /api/lotse/route` | PROJ-18 | `?v=<vid>` → ermittelt aus dem persistierten Vorgangsstand `{naechsteRolle, steueroptionen:[…], handoffGraph, abschnitt}`; protokolliert keine Daten (read-only Sicht) |
| `POST /api/lotse/route` | PROJ-18 | Body `{vorgangId, ereignis:"weiter\|wechsel\|abbruch\|rolle-ergebnislos", ziel?}` → trägt eine Routing-/Abbruch-Entscheidung als Eintrag in `state.decisionLog` des Vorgangs ein, → `{naechsteRolle, steueroptionen, vorgang}` |

### 2a. Schnittstellen-Präzisierungen (verbindlich — A/B bauen dagegen)

**`POST /api/diagnose` (vollständig):**
```jsonc
// Request-Body
{ "text": "Mein Toaster wirft nicht aus", "kategorie": "", "answers": [], "lang": "de" }
// Response (Stufe-1/2-Felder unverändert; NEU additiv unter diagnosis)
{
  "device": { /* … unverändert … */ },
  "source": "ai|fallback",
  "diagnosis": {
    "status": "ok|low|unclear|tech_error", "score": 0.85, "reason": "…",
    "trust": { "level": "…", "source": "…", "reason": "…" },   // unverändert (Stufe 2)
    "kandidaten": [ { "id":"", "ursache":"", "herkunft":"kuratiert|ki-ermittelt",
                      "konfidenz":"hoch|mittel|niedrig", "quelle":"" } ],  // NEU (PROJ-17)
    "abgrenzung": { "offen": [ { "q":"", "options":[{"a":"","tag":""}] } ] }, // NEU
    "unklar": false                                              // NEU
  }
}
```
Python-Signatur (AGENT-A): `ai.diagnose(text: str, kategorie: str = "", answers: list | None = None, lang: str = "de") -> dict`.
Sprache der KI-Texte folgt `lang`; Spracherkennung/-Retry passiert **intern im Backend** (kein
Signal ans Frontend). Bestehende Aufrufe `ai.diagnose(text)` bleiben gültig (Defaults).

**`defekte`-Element (PROJ-21):** `lights` ist **identisch** mit `device.lights` —
`[{key, icon, level, note}]` (4 Stück, feste Reihenfolge). `gesamt_fazit` wertet `level`.

**`steueroptionen`-Element (PROJ-18):** `{ "label": "Profi/Café", "ereignis": "wechsel",
"ziel": "vermittlung" }`. `ereignis` ∈ `weiter|wechsel|abbruch|rolle-ergebnislos`; die
`rk-steer`-Buttons senden genau dieses `ereignis`+`ziel` an `POST /api/lotse/route`.

**`abschnitt` (PROJ-18 Route-Response):** der aktuelle Knoten im Handoff-Graph, einer von
`aufnahme|diagnose|bewertung|abwaegung|begleitung|produktsuche|entsorgung|wirkung`.

**Consent-Gate-Trigger (autoritativ, PROJ-18/22):** `GET /api/lotse/route` liefert
`naechsteRolle:"consent-gate"`, **solange** `state.consent.status=="offen"` und eine
Datenverarbeitung ansteht. Das Frontend rendert das Gate **ausschließlich** auf dieses
Signal hin (kein eigenständiger Status-Check). Das Gate ruft beim Erscheinen
`ensureVorgang()` auf (legt `state.id` an), sodass `POST /api/vorgang/<vid>/consent`
funktioniert. Das Gate hat **keinen** Schließen/X-Button; ESC und Klick außerhalb sind
inaktiv — einzige Aktionen „Erteilen"/„Ablehnen". Wegklicken ⇒ bleibt `offen`
(= nicht eingewilligt).

**`POST /api/vorgang/<vid>/consent`:** Backend liest den gespeicherten State, merged **nur**
`consent={status,zeitpunkt(Server-Zeit)}` hinein (Read-Modify-Write, übrige Felder
unberührt) und gibt den Vorgang zurück. Das Frontend übernimmt `state.consent` aus der
Antwort; spätere `commit()`s tragen denselben Wert (kein Clobbern).

**Sprach-Priorität (PROJ-24):** Beim frischen Laden gewinnt `localStorage('rk-lang')`
> Browser-Default `de`. Beim Laden eines Vorgangs via `?v=` gewinnt `state.lang` des
Vorgangs, falls gesetzt. `rk-onlyde`-Badge nur rendern, wenn `state.lang=='en'` **und**
das Inhalts-Flag `nurDeutsch==true`.

**Export erweitern (PROJ-10 → Stufe 3, `export.py`)** — `render_txt` + `/v/<id>` zeigen
**falls gesetzt** zusätzliche Abschnitte: Rückruf-Stopp (PROJ-19, deutlich abgegrenzt vom
Garantie-Hinweis), Datenlöschung-Checkliste + bewusste Entscheidung (PROJ-20), je-Defekt-
Ampeln + Gesamt-Fazit/Knackpunkt (PROJ-21), Consent-Status mit Zeitpunkt (PROJ-22),
Schwungrad-Beitrag inkl. ausgeschlossener Inhalte (PROJ-23), Medien-Anhänge als Liste
(PROJ-27). Export bleibt für unvollständige Vorgänge nutzbar. Labels folgen `state.lang`
(über `i18n.t(key, lang)`; Beispiel-Keys `export.consent.erteilt`, `export.recall.titel`).

State-Key → Abschnitt (Abschnitt nur rendern, wenn Bedingung erfüllt):

| State-Key | Bedingung | Abschnitt |
|---|---|---|
| `rueckruf` | `rueckruf.hit==true` | Rückruf-Stopp (Grund/Quelle/Stand/Vorgehen) |
| `datenloeschung`, `datentragend`, `abgabe` | `abgabe=="dritte"` | Datenlöschung-Checkliste + bewusste Entscheidung |
| `defekte`, `gesamtFazit` | `defekte.length>=2` | je-Defekt-Ampeln + Gesamt-Fazit/Knackpunkt |
| `consent` | `consent.status!="offen"` | Consent-Status + Zeitpunkt |
| `schwungrad` | `schwungrad.beigetragen==true` | Schwungrad-Beitrag + ausgeschlossene Inhalte |
| `medien` | `medien.length>0` | Medien-Anhang-Liste (Art + Referenz) |

## 3. Neue Backend-Module (`repair/`) — Muster wie `foerderung.py`/`anbieter.py`

Kuratierte statische Seeds, keine Netz-Pflicht (Demo offline). Jeder kuratierte Eintrag
trägt `quelle` + `herkunft`/`kuratiert`. Online-Recherche (SearXNG) nur wenn `SEARXNG_URL`
gesetzt — sonst sauber übersprungen.

- **`repair/wissensbasis.py`** (PROJ-15, +Rückruf-Daten PROJ-19):
  - Datenmodell je Fehlerzustand exakt nach Konzept-Inhaltsmodell:
    `{id, kategorie, modell?, symptome:[tags], ursache, abgrenzungsfragen:[{q,options:[{a,tag}]}],
      sicherheit:"gut|mittel|stop", komplexitaet:"gut|mittel|stop", teile:[], werkzeug:[],
      anleitung?, quelle, herkunft:"kuratiert|ki-ermittelt", status:"geprueft|entwurf",
      version:int, stand:"YYYY-MM-DD", sicherheitBestaetigt:bool, rueckruf?:{art,grund,quelle,stand,gueltigBis,vorgehen}}`
  - **Seed**: Toaster + Mikrowelle als `geprueft`-Einträge abbilden (bestehender Durchstich
    bleibt) **plus** mind. 6–8 weitere kuratierte Fehlerzustände (verschiedene Kategorien)
    und mind. 1–2 Einträge mit hinterlegtem `rueckruf` (z. B. Akku-Brandgefahr) für PROJ-19.
  - **Entwürfe** persistiert in eigener SQLite-DB `webapp/wissensbasis.db` (gitignored,
    Connection-pro-Operation wie `store.py` → thread-safe; **kein** JSON-Read-Modify-Write),
    getrennt vom kuratierten Seed. API: `list_fehlerzustaende(status, kat)`, `get(id)`,
    `find_by_symptom(kat, tags) -> kandidaten` (**liefert ausschließlich `status=="geprueft"`-
    Einträge als kuratierte Kandidaten; Entwürfe nie als kuratiert**), `entwurf_erzeugen(kat,
    symptom, lang)`, `freigeben(id, sicherheit, komplexitaet, sicherheitBestaetigt)`,
    `zurueckziehen(id)`, `invalidiere_entwurf(id)` (für PROJ-23-Widerruf), `find_rueckruf(modell, kat)`.
  - **`freigeben()`**: ohne `sicherheitBestaetigt==true` keine Freigabe (Aufrufer → 409). Die
    im Aufruf übergebene `sicherheit` ist die **menschlich bestätigte** und **überschreibt den
    KI-Vorschlag bindend** — sie ist die maßgebliche Stufe.
  - **Bei jeder inhaltlichen Änderung**: `version`+1, `stand` aktualisieren, `status` fällt
    auf `entwurf` zurück (keine stille Beibehaltung der Freigabe).
- **`repair/recherche.py`** (PROJ-16): `recherche(frage, kontext, lang)` → Reihenfolge
  **kuratiert (wissensbasis) → KI-Fallback (ai-Helfer) → online (SearXNG, falls konfiguriert)**.
  Liefert immer `{aussage, herkunft, quelle, konfidenz, widerspruch, online, nurDeutsch}`.
  Bei widersprüchlichen Online-Treffern: `widerspruch:true` + Konfidenz absenken, keine
  Variante still bevorzugen. **Sobald ein kuratierter Eintrag greift (auch partiell), wird
  kein Online-Pfad betreten** — die kuratierte Quelle dominiert (D2). Trifft **keine**
  Ursachen-Einschätzung, Ampel-Bewertung oder Pfad-Empfehlung — nur belegtes Material.
- **`repair/diagnose_kuratiert.py`** (PROJ-17): `diagnose(text, kategorie, answers, lang)` →
  Symptome gegen Sammlung abgleichen (`find_by_symptom`), mehrere Kandidaten zulassen,
  Abgrenzungsfragen **aus dem kuratierten Eintrag** (nicht frei erfunden), Konfidenz/Quelle
  je Kandidat aus `recherche`. Liefert `recherche` keine Konfidenz → `konfidenz:"niedrig"`,
  `herkunft:"ki-ermittelt"` (nie leer, nie erfunden). Kein Treffer + nichts Belegtes **oder
  widersprüchliche Nutzerantworten** → `unklar:true`. Stuft selbst **keine** Ampel ein. Wird von `ai.diagnose` (additiv) aufgerufen, um `diagnosis.kandidaten`/
  `abgrenzung`/`unklar` zu füllen — die bestehenden Felder bleiben unverändert.
- **`repair/bewertung.py`** (PROJ-21): `gesamt_fazit(defekte)` — schwächstes Glied:
  Level-Rang `stop>mittel>gut`, Empfehlungs-Rang `replace/pro > local > self` (restriktiver
  gewinnt). `knackpunktId` = Defekt mit höchstem Sicherheits-Level, Tie-Break höchste
  Kosten, dann deterministisch erster nach Eingabereihenfolge. `prioritaet` = Defekt-ids
  nach Kritikalität sortiert. `<2` Defekte → `None`. „warnen statt sperren" bleibt.
- **`repair/lotse.py`** (PROJ-18): `HANDOFF_GRAPH` (explizit, geschlossen):
  `aufnahme → diagnose → bewertung → abwaegung → {begleitung|produktsuche|entsorgung} → wirkung`;
  Querschnitt (`recherche`,`vermittlung`,`beschaffung`,`protokoll`,Consent-Station)
  bedarfsgesteuert ohne den Journey-Handoff zu verlassen. `naechste_rolle(state)`
  (deterministische Vorrang-Regel, bei echter Mehrdeutigkeit → Nutzer fragen via
  Steueroptionen), `steueroptionen(state)` (weiter·profi/café·austausch·entsorgen·abbrechen),
  `routing_log_eintrag(state, ereignis, ziel)`. **Nur prozedural** — keine inhaltliche
  Pfad-/Sicherheits-Entscheidung. Consent-Station wird vor einem Schwungrad-Beitrag
  zwingend angesteuert. Liefert eine Rolle kein Ergebnis → `lotse` schlägt Alternativweg vor.
  **Out of scope** (bereits durch PROJ-3/PROJ-8 abgedeckt): Fähigkeits-Rückfrage (D11) ist
  nicht Teil dieser Lotse-Mechanik. **Reload/Fortsetzung:** nach `?v=<id>` ruft das Frontend
  `GET /api/lotse/route` und springt zur zurückgemeldeten `naechsteRolle`/Stage — keine eigene
  Stage-Heuristik.
- **`repair/consent.py`** (PROJ-22): `consent_text(lang)`; Status-Konstanten; Schreiben in
  Vorgang via `store`. Text benennt **was/wozu/Trainingszweck**, verweist auf PROJ-23, keine
  Vorab-Auswahl.
- **`repair/anonymisierung.py`** (PROJ-23): `anonymisiere_text(text) -> (clean, entfernt)` —
  Regex/Heuristik für E-Mail, Telefon, IBAN, Seriennummern, PLZ+Ort, offensichtliche Namen.
  `pruefe_foto(meta) -> ok:bool` — **Stub liefert immer `False`** (konservativ: Fotos werden
  im Schwungrad-Beitrag ausgeschlossen, bis eine echte Bild-Prüfung existiert).
- **`repair/schwungrad.py`** (PROJ-23): `build_beitrag(vorgang)` prüft `consent.status` **zum
  Zeitpunkt des Aufrufs** (`erteilt` erforderlich; zwischenzeitlicher Widerruf ⇒
  `ohneEinwilligung:true`, kein Beitrag); anonymisiert Freitext, schließt nicht-
  anonymisierbare Fotos aus, legt **Entwurf** in Wissensbasis. `grob_gate()` (dokumentiertes
  Ergebnis). Verändert den Original-Vorgang nicht. Bei `POST …/consent` mit
  `status:"widerrufen"` wird ein bereits erzeugter, noch ungeprüfter Beitrag via
  `wissensbasis.invalidiere_entwurf(beitragId)` entkoppelt (gelangt nicht in die kuratierte Sammlung).
- **`repair/multimodal.py`** (PROJ-27): Medien-Store in `webapp/media/` (gitignored),
  `save_medium(data, art) -> {id,art,ref}`, `get_medium(id)`, optionale `transkribiere(audio)`
  (Whisper falls Key, sonst Hinweis). Typ/Größen-Limit, nie hart scheitern.
- **`repair/i18n.py`** (PROJ-24): Backend-seitige Texte (Endpunkt-`hinweis`e, Export-Labels,
  Consent-Text, Recall-Vorgehen) als `de/en`-Katalog + `t(key, lang)`; Sprach-Direktive für
  den KI-System-Prompt (`lang`→Anweisung „antworte auf Deutsch/Englisch"); Erkennung, wenn
  die KI in falscher Sprache antwortet (heuristisch) → erneut anfordern oder kennzeichnen;
  `nur_deutsch`-Flag für rein deutsche kuratierte Inhalte.
- **`repair/datenloeschung.py`** (PROJ-20): `ist_datentragend(kategorie) -> bool|None`
  (Laptop/Smartphone/Tablet/PC… = True; unklar = None → Frontend fragt einmalig),
  `checkliste(lang) -> {backup, loeschen, abmelden}` Texte, Verweis auf PROJ-12.

`ai.py`: `diagnose()` ruft additiv `diagnose_kuratiert` + `i18n`-Sprachdirektive auf, ohne
das bestehende Verhalten/Schema zu brechen. `__init__.py`: alle neuen Module re-exportieren,
sodass der DoD-1-Smoke-Import (§6) durchläuft — exakt diese Namen:
`wissensbasis, recherche, diagnose_kuratiert, bewertung, lotse, consent, anonymisierung,
schwungrad, multimodal, i18n, datenloeschung`.

## 4. Frontend-Flow & neue Stages/Screens (AGENT-B)

Andockung an die bestehende Statemachine (`start→triage→ampel→decision→repair→result|path`
+ Stufe-2-Stages). Neue Stages/Screens werden **additiv** eingehängt; bestehende Flows
(Toaster 🟢 / Mikrowelle 🔴) bleiben unverändert lauffähig.

1. **PROJ-24 i18n (Querschnitt, zuerst)**: Übersetzungs-Katalog `I18N = { de:{…}, en:{…} }`
   in `app.js` (alle festen UI-Texte: Navigation, Buttons, Labels, Hinweise, Fehlermeldungen,
   Ampel-Stufen-Beschriftungen). Helper `t(key)` (Fallback: deutscher Text **mit Kennzeichnung**
   wenn EN fehlt). Sichtbarer **Sprach-Switcher** (oben, neben dem Theme-Switcher) `rk-langswitch`.
   Startsprache aus `navigator.language`, Default `de`, in `state.lang`+`localStorage`. `lang`
   an `/api/diagnose`/`/api/recherche` übergeben. Badge `rk-onlyde` „nur auf Deutsch verfügbar"
   für rein deutsche Inhalte. Sicherheits-Aussagen in beiden Sprachen vollständig.
2. **PROJ-22 Consent-Gate**: vor der **ersten** Datenverarbeitung (erster Diagnose-/
   Recherche-Aufruf bzw. erster Medien-Einsatz) zeigt der `lotse`-Einstieg ein Gate
   (`rk-consent`), blockiert bis zur Entscheidung. „Erteilen" / „Ablehnen" als bewusste
   Aktionen (keine Vorauswahl). Ablehnung → App bleibt nutzbar, transparenter Hinweis, was
   entfällt (Schwungrad-Beitrag). Status → `POST /api/vorgang/<id>/consent`. Widerruf jederzeit
   über ein sichtbares Control. Verweist auf PROJ-23. Gültiger Status → Gate nicht erneut.
3. **PROJ-17 kuratierte Diagnose-Schleife**: zwischen `triage` und `ampel` ein Kandidaten-
   Screen (`rk-diag`): mehrere Ursachen-Kandidaten mit `TrustBadge` (Herkunft/Konfidenz),
   echte Abgrenzungs-Rückfrage(n) aus dem kuratierten Eintrag, die die Kandidatenliste
   nachvollziehbar eingrenzen. Widerspruch / kein Treffer → bestehender Unklar-Pfad (PROJ-4).
   Kandidaten/Rückfragen/Herkunft ins `decisionLog`.
4. **PROJ-19 Rückruf-Stopp**: nach Geräte-Erkennung Aufruf `GET /api/rueckruf`. Bei `hit`
   vor **jeder** Reparaturoption ein prominenter Stopp-Screen (`rk-recall`), **deutlich**
   anders als das Garantie-Gate (PROJ-7): nennt Grund, Quelle, Stand/gültig-bis, Vorgehen
   zur Rückrufteilnahme statt DIY. „warnen statt sperren": Fortfahren möglich, aber Rückruf
   ist klar der bevorzugte Weg. Die Überschrift nennt die Art (`rueckruf` →
   `rk-recall-rueckruf`, `sicherheitsmangel` → `rk-recall-sicherheitsmangel`) und grenzt
   „Sicherheitsmangel ohne offiziellen Rückruf" sprachlich vom formalen Rückruf ab.
   `modellUnsicher` → kein harter Treffer (kein `rk-recall-badge`), Hinweis + normaler Ablauf.
5. **PROJ-21 Mehrfachdefekte**: erkennt der Flow mehr als einen Defekt (`state.defekte.length>1`),
   `POST /api/bewertung/gesamt` und render: je-Defekt-Ampelkarte (`rk-ampelcard`, nach
   Kritikalität priorisiert) **plus** ein Gesamt-Fazit-Block (`rk-fazit`) mit hervorgehobenem
   Knackpunkt (`rk-fazit-knack`). Genau 1 Defekt → exakt wie heute, kein Gesamt-Fazit. Die
   Einzel-Ampeln bleiben bei ≥2 Defekten **dauerhaft sichtbar**; `rk-fazit` ist additiv, nie
   Ersatz. Ändert sich `state.defekte` (Defekt entkräftet/hinzugefügt), ruft das Frontend
   `POST /api/bewertung/gesamt` erneut und überschreibt `state.gesamtFazit` (fällt die Zahl
   auf 1 → `gesamtFazit=null`).
6. **PROJ-20 Datenlöschung**: wenn `state.datentragend` (Kategorie Laptop/Smartphone/… oder
   einmalige Rückfrage) **und** `state.abgabe=="dritte"` → vor Übergabe ein Schutzschritt-Screen
   (`rk-wipe`) mit 3 unabhängig markierbaren Teilschritten (Backup·Daten löschen·Konten
   abmelden). „Nicht löschen" → deutliche Warnung, aber fortsetzbar. Entscheidung ins
   Protokoll. Bei DIY ohne Fremdabgabe **kein** Schritt. Verweis auf Entsorgung (PROJ-12).
7. **PROJ-27 Multimodal**: Startscreen-Buttons werden **echt**:
   - Foto/Video: `<input capture>` + optional `getUserMedia`; Upload via `POST /api/vorgang/<id>/medien`;
     Vorschau in der Aufnahme (`rk-media`). Schlechte Qualität (zu dunkel/unscharf) → Hinweis + neu/Text.
   - Sprache: Web Speech API (`webkitSpeechRecognition`) → Text in die Problemschilderung;
     unsicher/Dialekt → erkannten Text zur Korrektur anzeigen + Text-Fallback.
   - Barcode/Modell: `BarcodeDetector` (falls verfügbar) → Kategorie/Modell; sonst/scheitert →
     manuelle Eingabe, keine Sackgasse.
   - Vor erster Foto-/Sprachaufnahme: separate Medien-Einwilligung (`state.medienConsent`,
     **unabhängig** vom Vorgangs-Consent `consent.status`; auch bei abgelehntem Vorgangs-Consent
     separat erteilbar). Fehlt `medienConsent` → nur Foto/Voice gesperrt, **die Texteingabe
     bleibt jederzeit uneingeschränkt** (kein harter Vorgangs-Block, D15). Kein Gerät/Browser-
     Support → Modalität „nicht verfügbar", Text bleibt.
   - **Jederzeit** sichtbarer Weg zurück zur Texteingabe. Die 3 Modalitäten unabhängig.
8. **PROJ-18 Lotse-Integration (additiv)**: Eine Steueroptionen-Leiste (`rk-steer`) ist an
   jedem Journey-Punkt sichtbar (weiter·Profi/Café·Austausch·Entsorgen·Abbrechen). Stage-
   Wechsel konsultiert `GET /api/lotse/route` (Vorschlag + Optionen) und schreibt jede
   Routing-/Wechsel-/Abbruch-Entscheidung via `POST /api/lotse/route` ins `decisionLog`.
   Die bestehende Frontend-Statemachine **bleibt** treibend, nutzt den Lotsen aber als
   Routing-Berater + Audit-Log. Abbruch/vorzeitige Empfehlung → sichere, ermutigende
   Übergabe an Profi/Café (kein Sackgassen-Gefühl), Vorgang bleibt vollständig nutzbar.
9. **Persistenz-Sync (PROJ-9 weiter)**: jede neue Stage/Auswahl/Entscheidung ist ein
   zustandsändernder Schritt → `commit()`/`persist()` wie gehabt. Reload via `?v=<id>` stellt
   alle neuen Stages/Felder her (PROJ-18 AC: unterbrochener Vorgang an korrekter Stelle fort).

Kein Pfad ist Sackgasse: aus jeder neuen Stage führt ein Weg zu Export/Protokoll und zurück.

## 5. Neue CSS-Klassennamen (Frontend erzeugt **exakt diese**, CSS stylt sie — alle 3 Themes)

Bestehende Klassen weiter nutzen. **Neu** (Frontend & CSS identisch):

```
rk-langswitch rk-langswitch-btn rk-langswitch-on rk-onlyde
rk-consent rk-consent-head rk-consent-body rk-consent-train rk-consent-ref rk-consent-btns
  rk-consent-yes rk-consent-no rk-consent-status rk-consent-revoke
rk-diag rk-diag-head rk-diag-cand rk-diag-cand-sel rk-diag-cand-out rk-diag-cause rk-diag-src
  rk-diag-frage rk-diag-opt rk-diag-unclear
rk-recall rk-recall-rueckruf rk-recall-sicherheitsmangel rk-recall-badge rk-recall-grund
  rk-recall-quelle rk-recall-stand rk-recall-vorgehen rk-recall-continue rk-recall-unsure
rk-fazit rk-fazit-head rk-fazit-reco rk-fazit-knack rk-fazit-why rk-defekt-list rk-defekt-rank
rk-wipe rk-wipe-head rk-wipe-step rk-wipe-check rk-wipe-on rk-wipe-warn rk-wipe-skip rk-wipe-disp
rk-media rk-media-grid rk-media-item rk-media-thumb rk-media-art rk-media-remove
  rk-media-consent rk-cap-btn rk-cap-photo rk-cap-voice rk-cap-scan rk-cap-unavail
  rk-voice-live rk-voice-correct rk-scan-result rk-quality-warn rk-to-text
rk-steer rk-steer-btn rk-steer-primary rk-steer-secondary rk-steer-abort
```

Kontext-Hinweise für AGENT-C:
- `rk-langswitch` liegt **auf Body-Level** neben `.rk-themebar` (außerhalb `.rk-phone`) und
  wird analog zur Theme-Leiste gestylt.
- `rk-ampelcard` bleibt unverändert; Mehrfachdefekt-Layout/Sortierung kommt über den Wrapper
  `rk-defekt-list` (+ `rk-defekt-rank` je Karte) — **keine** Modifikation an `rk-ampelcard` selbst.
- `rk-diag-cand-out` = durch eine Abgrenzungsantwort ausgeschiedener Kandidat (gedämpft).

Die Lese-Ansicht `/v/<id>` bleibt Backend-eigen mit inlinetem Print-CSS.

## 6. Definition of Done (Lead testet integrativ)

1. **Backend-Smoke (ohne Key)**:
   `python -c "import app; from repair import wissensbasis, recherche, diagnose_kuratiert, bewertung, lotse, consent, anonymisierung, schwungrad, multimodal, i18n, datenloeschung; print(i18n.t('consent.titel','de'), i18n.t('consent.titel','en')); print(len(wissensbasis.list_fehlerzustaende('geprueft', None)))"` → zwei verschiedene Sprachtexte + Anzahl > 0.
2. **Wissensbasis (PROJ-15)**: `GET /api/wissensbasis` liefert nur `geprueft`; `?status=entwurf`
   getrennt. Toaster+Mikrowelle als geprüfte Einträge vorhanden. `POST …/entwurf` erzeugt
   `status:"entwurf"`. `POST …/freigabe` **ohne** `sicherheitBestaetigt` → **HTTP 409**; **mit**
   → `geprueft`, übergebene `sicherheit` überschreibt KI-Vorschlag, `version`/`stand` aktualisiert.
   Inhaltliche Änderung eines geprüften Eintrags setzt Status zurück. Mind. ein Seed-Eintrag
   mit `sicherheit:"stop"` (speist PROJ-19).
3. **Recherche (PROJ-16)**: kuratierter Treffer → `herkunft:"kuratiert"` + Quelle; kein Treffer
   → `herkunft:"ki-fallback"` + **niedrigere** Konfidenz + Hinweis. Quelle/Konfidenz nie leer.
   Reihenfolge kuratiert→fallback→online deterministisch.
4. **Diagnose kuratiert (PROJ-17)**: mehrere passende Fehlerzustände → mehrere Kandidaten +
   echte Abgrenzungs-Rückfrage aus dem Eintrag; kein/widersprüchlicher Treffer → Unklar-Pfad.
   Jede Ursache trägt Herkunft+Konfidenz. Bestehende `/api/diagnose`-Felder unverändert.
5. **Lotse (PROJ-18)**: `GET /api/lotse/route?v=<id>` liefert `naechsteRolle` + Steueroptionen
   passend zum Stand; `POST` schreibt einen `decisionLog`-Eintrag. Handoff-Graph geschlossen,
   alle Journey-Pfade enden in `wirkung`. Demo-Flows (Toaster/Mikrowelle) unverändert grün.
6. **Rückruf (PROJ-19)**: Modell mit hinterlegtem Rückruf → prominenter Stopp **vor** DIY,
   abgegrenzt vom Garantie-Gate, mit Quelle/Stand; kein Rückruf → normaler Ablauf; `modellUnsicher`
   → kein falscher Treffer.
7. **Datenlöschung (PROJ-20)**: datentragend + Abgabe an Dritte → Schutzschritt mit 3 Teilschritten,
   ins Protokoll; „nicht löschen" → Warnung, aber fortsetzbar; DIY → kein Schritt.
8. **Mehrfachdefekte (PROJ-21)**: ≥2 Defekte → je-Defekt-Ampel + Gesamt-Fazit nach schwächstem
   Glied + Knackpunkt, persistiert; widersprüchliche Empfehlungen → restriktivere gewinnt;
   genau 1 Defekt → kein Gesamt-Fazit (wie heute).
9. **Consent (PROJ-22)**: Gate vor erster Verarbeitung; erteilen/ablehnen bewusst; Ablehnung
   → App nutzbar; Status im Vorgang mit Zeitpunkt; Widerruf möglich; gültiger Status → kein
   erneutes Gate.
10. **Schwungrad (PROJ-23)**: Beitrag nur mit Consent; Freitext anonymisiert (PII entfernt);
    nicht anonymisierbares Foto ausgeschlossen; Beitrag landet als **Entwurf** in der Wissensbasis;
    `GET /api/schwungrad/grobgate` liefert dokumentiertes Ergebnis; Original-Vorgang unverändert.
11. **Mehrsprachigkeit (PROJ-24)**: Sprach-Switcher DE↔EN; alle festen UI-Texte beidsprachig;
    EN-Diagnose/Ampel-Begründung auf Englisch; nur-deutsche Inhalte gekennzeichnet; Umschalten
    ändert keine Ampel/Empfehlung; Sprache bleibt über Sitzung erhalten.
12. **Multimodal (PROJ-27)**: Foto/Video echte Aufnahme/Upload → Medium am Vorgang sichtbar;
    Sprache → Text; Barcode/Modell → Kategorie/Modell, sonst manuell; jede Modalität hat
    Text-Fallback; Medien-Einwilligung vor erster Aufnahme; fehlender Kamera/Mic-Support sauber.
13. **Alle 3 Themes** rendern alle neuen Komponenten sauber. Reload via `?v=<id>` stellt neue
    Stages her. Export `export.txt` + `/v/<id>` enthalten die neuen Abschnitte falls gesetzt.
    Demo nie hart gescheitert (kein 500 im Normalbetrieb, kein Key nötig).
```
