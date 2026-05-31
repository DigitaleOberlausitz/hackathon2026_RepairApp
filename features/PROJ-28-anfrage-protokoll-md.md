# PROJ-28: Anfrage-Protokoll als Markdown (Betreiber-/Debug-Log)

## Status: Planned

**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31

## Abhängigkeiten

- PROJ-9 (Vorgangs-Persistenz) — die Vorgangs-`vid` ist der Gruppierungsschlüssel (eine .md pro Vorgang)
- PROJ-17 (Diagnose) / PROJ-16 (Recherche) / PROJ-15 (Wissensbasis-Entwurf) / PROJ-21 (Mehrfachdefekte) / PROJ-18 (Lotse) / PROJ-27 (Transkription) — die protokollierten KI-/Fach-Endpunkte
- Nutzt bestehend: `repair.ai` (OpenAI-Call inkl. `response.usage`), `repair.lotse` (decisionLog) — keine fachliche Änderung an diesen

## Kontext & Abgrenzung

Dies ist ein **Betreiber-/Entwicklungs-Werkzeug** (Beobachtbarkeit, Nachvollziehbarkeit von
KI-Entscheidungen, Token-Kosten-Transparenz) — **kein Endnutzer-Feature**. Es ist bewusst vom
Endnutzer-Protokoll (`protokoll`-Rolle, Export `/v/<id>` & `export.txt`) und vom anonymisierten
Daten-Schwungrad (PROJ-23) getrennt:

- Das **Endnutzer-Protokoll** (PROJ-10) ist anonymisierbar, exportier-/teilbar und für den Nutzer bestimmt.
- Das **Schwungrad** (PROJ-23) speist **anonymisierte** Erkenntnisse zurück in die Wissensbasis.
- **Dieses Anfrage-Protokoll (PROJ-28)** speichert auf ausdrücklichen Betreiber-Wunsch die
  **Rohdaten** jeder KI-/Fach-Anfrage (Request-Payload, KI-Rohantwort, Entscheidung, Rolle,
  Token-Statistik). Es darf **nicht** weitergegeben, exportiert oder ins Schwungrad übernommen werden.

## User Stories

- Als **Betreiber/Entwickler** möchte ich pro KI-/Fach-Anfrage eine Markdown-Datei mit den
  gesendeten und empfangenen Daten, damit ich nachvollziehen kann, was die App an die KI geschickt
  und was sie zurückbekommen hat (Debugging, Reproduktion von Fehldiagnosen).
- Als **Betreiber** möchte ich sehen, welche **KI-Entscheidung** getroffen wurde (z. B. `source: ai|fallback`,
  empfohlener Pfad, Ampel-Stufe, Routing-Ereignis), damit ich beurteilen kann, ob die App fachlich
  sinnvoll und sicher (D15 „warnen statt sperren") gehandelt hat.
- Als **Betreiber** möchte ich erkennen, welche **Rolle/Fach-Funktion** eine Anfrage bedient hat
  (z. B. `diagnose`, `recherche`, `lotse`), damit ich die Last und das Verhalten je Rolle nachvollziehen kann.
- Als **Kostenverantwortlicher** möchte ich pro Anfrage und in Summe pro Vorgang die verbrauchten
  **KI-Token** (Prompt/Completion/Total) sehen, damit ich die KI-Kosten einschätzen kann — auch wenn
  ein KI-Kostenmodell selbst Non-Goal der Phase bleibt.
- Als **Betreiber** möchte ich alle Anfragen **eines Vorgangs** in **einer** chronologischen
  Markdown-Datei gebündelt sehen, damit ich den Verlauf eines Reparaturfalls am Stück lesen kann.
- Als **Betreiber** möchte ich die Protokollierung **per Umgebungsvariable** an-/abschalten können
  (default an), damit ich sie für Audits aktiv lassen oder für saubere Testläufe deaktivieren kann.

## Akzeptanzkriterien

- [ ] Für jede Anfrage an die protokollierten **KI-/Fach-Endpunkte** wird ein Markdown-Eintrag
      geschrieben. Protokollierte Endpunkte: `POST /api/diagnose`, `POST /api/recherche`,
      `POST /api/wissensbasis/entwurf`, `POST /api/bewertung/gesamt`, `POST /api/lotse/route`,
      `POST /api/transkription`.
- [ ] Statische/lesende Endpunkte erzeugen **kein** Protokoll (`GET /`, `/api/devices`,
      `/api/device/<id>`, `/media/<id>`, `/api/foerderung`, sämtliche `GET`-Listen-/Sicht-Routen).
- [ ] Jeder Eintrag enthält **gesendete Daten**: HTTP-Methode, Pfad, Zeitstempel (Server-Zeit, ISO),
      sowie den vollständigen Request-Payload (JSON-Body bzw. Beschreibung bei multipart, z. B. Dateiname/MIME/Größe).
- [ ] Jeder Eintrag enthält **empfangene Daten**: die an den Client zurückgegebene Antwort
      (JSON, gekürzt nur bei sehr großen Binär-Refs) inkl. HTTP-Status.
- [ ] Jeder Eintrag enthält die **KI-Entscheidung** in lesbarer Form, mindestens: `source`
      (`ai`/`fallback`/`kuratiert`), und — soweit vorhanden — empfohlener Pfad (`recommend`),
      Ampel-Stufen (`lights`/`accentPath`), Recherche-Herkunft/Konfidenz bzw. Lotse-`ereignis`+Zielrolle.
- [ ] Jeder Eintrag nennt die **verwendete Rolle/Fach-Funktion** über ein festes
      Endpunkt→Rolle-Mapping (z. B. `/api/diagnose` → `diagnose`, `/api/recherche` → `recherche`,
      `/api/lotse/route` → `lotse`).
- [ ] Jeder Eintrag enthält eine **Token-Statistik**: bei echtem KI-Call die `usage`-Werte
      (prompt_tokens, completion_tokens, total_tokens) aus der OpenAI-Antwort; bei Fallback ohne
      KI-Call explizit „kein KI-Call (0 Token)" und das verwendete Modell (`OPENAI_MODEL`) bzw. „—".
- [ ] Alle Anfragen, die zu **derselben** `vid` (Vorgang) gehören, werden an **eine** Markdown-Datei
      pro Vorgang **angehängt** (chronologisch, neuer Abschnitt je Anfrage). Die `vid` wird aus dem
      Request abgeleitet (Body-Feld `vorgangId`/`v`, Pfad-Parameter `<vid>` oder Query `?v=`).
- [ ] Anfragen **ohne** zuordenbaren Vorgang werden an eine **Sammeldatei** (z. B. `_ohne-vorgang.md`)
      angehängt — kein Eintrag geht verloren.
- [ ] Am Kopf jeder Vorgangs-Datei (oder fortlaufend aktualisiert) steht eine **Aggregat-Statistik**:
      Anzahl Anfragen, Summe Total-Token, Anzahl `ai` vs. `fallback`.
- [ ] Die Protokollierung ist über eine **Umgebungsvariable** (z. B. `PROTOKOLL_ENABLED`)
      steuerbar; **default ist „an"**. Bei `PROTOKOLL_ENABLED=0` wird nichts geschrieben.
- [ ] Die Protokollierung ist **nicht-blockierend für die fachliche Antwort**: schlägt das Schreiben
      fehl (z. B. Schreibrechte, Platte voll), liefert der Endpunkt trotzdem seine normale HTTP-200-Antwort
      (Fehler wird nur intern geloggt, nicht an den Client durchgereicht).
- [ ] Die Protokoll-Dateien liegen in einem dedizierten Verzeichnis (z. B. `webapp/protokolle/`),
      das per `.gitignore` von der Versionierung ausgeschlossen ist.
- [ ] Das Schreiben verändert **keine** bestehende fachliche Logik oder API-Antwort (rein additive Beobachtung).

## Edge Cases

- **Frage:** Was passiert, wenn kein OpenAI-Key gesetzt ist (Fallback-Pfad)? **Antwort:** Es wird
  trotzdem protokolliert; die Token-Statistik vermerkt „kein KI-Call (0 Token)" und `source: fallback`.
- **Frage:** Wie wird mit großen Binärdaten umgegangen (Foto/Video/Audio-Upload bei `/api/transkription`)?
  **Antwort:** Es werden **keine** Rohbytes in die .md geschrieben — nur Metadaten (Dateiname, MIME,
  Größe in Bytes) bzw. die Medien-Referenz/ID; die Transkriptions-Antwort (Text) wird protokolliert.
- **Frage:** Was, wenn dieselbe `vid` gleichzeitig mehrere Anfragen erzeugt (z. B. paralleles Speichern)?
  **Antwort:** Anhängen erfolgt im Append-Modus; bei gleichzeitigem Zugriff darf höchstens die
  Reihenfolge der Abschnitte variieren — kein Eintrag geht verloren, keine Datei wird korrupt
  (atomares Append / einfache Serialisierung).
- **Frage:** Was, wenn der Request-Body kein gültiges JSON ist? **Antwort:** Der Rohtext bzw. ein
  Hinweis „nicht-JSON-Body" wird protokolliert; die Protokollierung scheitert nie hart.
- **Frage:** Was, wenn die `vid` einen ungültigen/gefährlichen Dateinamen ergäbe (Path-Traversal)?
  **Antwort:** Die `vid` wird vor Verwendung als Dateiname strikt validiert/bereinigt (nur erlaubte
  Zeichen, z. B. `secrets.token_urlsafe`-Alphabet); andernfalls landet der Eintrag in der Sammeldatei.
- **Frage:** Wächst eine Vorgangs-Datei unbegrenzt? **Antwort:** Für diese Phase akzeptiert
  (Vorgänge sind begrenzt); eine Rotation/Retention ist Non-Goal und kann später ergänzt werden.
- **Frage:** Kollidiert das mit dem Datenschutz-Konzept (D10, PROJ-22/23)? **Antwort:** Ja, bewusst —
  diese Logs enthalten Rohdaten und sind rein betreiber-/entwicklungsseitig. Sie sind gitignored, werden
  nicht exportiert/geteilt und fließen nicht ins Schwungrad. Siehe Technische Anforderungen.

## Technische Anforderungen

- **Rohdaten-Charakter:** Die Protokolle enthalten unmaskierten Request-Payload und KI-Rohantworten
  und können personenbezogene Daten enthalten. Sie sind ausschließlich für Betrieb/Entwicklung gedacht.
  Pflicht: Verzeichnis per `.gitignore` ausschließen; keine Exposition über HTTP-Routen; keine Übernahme
  in Endnutzer-Export oder Schwungrad. (Steht im Spannungsfeld zu D10 — bewusste, dokumentierte Betreiber-Entscheidung.)
- **Implementierung als Querschnitt:** bevorzugt ein zentraler Hook (z. B. Flask `after_request` mit
  Endpunkt-Whitelist) oder ein dünnes `repair/protokoll_log.py`-Modul, das von den betroffenen Routen
  aufgerufen wird — so bleibt die fachliche Routen-Logik unverändert und additiv.
- **Token-Quelle:** `repair.ai` muss die `usage`-Daten der OpenAI-Antwort zugänglich machen (heute
  ungenutzt). Bei Fallback existiert keine `usage` → explizit „0 / kein KI-Call".
- **Performance/Robustheit:** Schreiben ist best-effort und nicht-blockierend für die HTTP-Antwort;
  Fehler beim Schreiben dürfen die fachliche Antwort nicht beeinflussen.
- **Format:** Markdown mit klar getrennten Abschnitten je Anfrage (Überschrift mit Zeitstempel +
  Rolle), Codeblöcke für Request-/Response-JSON, eine Tabelle/Liste für die Token-Statistik.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
