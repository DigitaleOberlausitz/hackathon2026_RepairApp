# PROJ-31: Vision-Diagnose aus Foto & Dokument

## Status: In Review
**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31

> **D-Anker:** D9 (Multimodalität) · **Rolle:** `aufnahme` / `diagnose`

## Kontext

Heute nimmt die App über **PROJ-27** Fotos, Videos und Sprache auf und hängt sie als
Medien an den Vorgang — die eigentliche **KI-Diagnose läuft aber ausschließlich auf
Freitext** (`POST /api/diagnose`). Das beigefügte Bild wird gespeichert und angezeigt,
aber **nicht ausgewertet**. Es gibt zudem **kein Seed-/Demo-Fallback mehr**: ohne echtes
LLM-Backend antwortet die Diagnose mit einem sauberen Fehler (`no_backend`).

Dieses Feature schließt die Lücke: Beigefügte **Fotos und Dokumente werden von einem
Vision-fähigen Modell ausgewertet** und fließen in die Diagnose ein. Für die primäre
Zielgruppe (ängstliche Erstnutzer:innen, vgl. PRD) ist der Ablauf **zweistufig und
transparent**: Erst zeigt die App auf einem eigenen Screen, **was sie erkannt hat**
(Gerät/Modell, sichtbare Schäden, Belege aus Dokumenten) — der Nutzer **bestätigt oder
korrigiert** das —, **danach** läuft die Diagnose auf den geprüften Daten. Das stärkt das
Vertrauen (PROJ-25) und verhindert selbstbewusst-falsche Diagnosen.

## Abhängigkeiten

- **Benötigt: PROJ-27 (Multimodale Eingabe)** — Foto-/Dokument-Aufnahme & -Upload,
  Medien-Anhang am Vorgang, Medien-Einwilligung (Consent-Gate).
- **Benötigt: PROJ-9 (Vorgangs-Persistenz)** — Medien und das bestätigte
  Extraktions-Ergebnis werden am Vorgang gespeichert.
- **Speist (Konsumenten der Extraktion): PROJ-26** (Triage — Kategorie/Modell), **PROJ-7**
  (Garantie-Gate — Kaufdatum/Händler), **PROJ-1** (Eigentum & Kostenträger).
- **Bezug:** PROJ-22 (Consent), PROJ-23 (Anonymisierung — keine PII in teilbare Artefakte),
  PROJ-25 (Vertrauens-Indikator), PROJ-30 (Konfiguration über `.env`), PROJ-29 (Logging —
  nur Medien-Metadaten, keine Rohbytes).
- **Erweitert:** den bestehenden Diagnose-Pfad (`POST /api/diagnose`); das
  `device`-/`diagnosis`-Schema (PROJ-17/25) bleibt unverändert.

## User Stories

- Als **Nutzer mit sichtbarem Defekt** möchte ich beim Stellen meiner Anfrage aktiv
  aufgefordert werden, ein **Foto** des Geräts oder Schadens beizufügen, damit die KI mehr
  als nur meine Worte zur Verfügung hat.
- Als **Nutzer** möchte ich zu jeder Anfrage **ein oder mehrere** Fotos **und** Dokumente
  (Typenschild, Rechnung, Anleitung) hinzufügen, damit die Diagnose alle verfügbaren
  Belege einbezieht.
- Als **ängstliche:r Erstnutzer:in** möchte ich vor der Diagnose **sehen, was die KI
  erkannt hat** (Gerät/Modell, sichtbare Schäden) und es **bestätigen oder korrigieren**,
  damit ich der anschließenden Diagnose vertraue.
- Als **Nutzer, der sein Modell nicht kennt**, möchte ich, dass **Kategorie und Modell aus
  dem fotografierten Typenschild** ausgelesen werden, damit ich nichts abtippen muss.
- Als **Nutzer mit Garantieanspruch** möchte ich, dass **Kaufdatum/Händler aus einer
  beigefügten Rechnung** erkannt werden, damit das Garantie-Gate (PROJ-7) korrekt greift.
- Als **Nutzer mit einer Bedienungs-/Reparaturanleitung** möchte ich, dass relevante
  **Hinweise daraus** in die Begleitung einfließen, damit ich gerätespezifische Hilfe bekomme.
- Als **datenschutzbewusste:r Nutzer:in** möchte ich, dass meine Bilder/Dokumente **nur
  nach erteilter Medien-Einwilligung** verarbeitet und an ein Backend gesendet werden.
- Als **Nutzer ohne Vision-Backend** möchte ich, dass meine Anfrage trotzdem als
  **Text-Diagnose** bearbeitet wird und ich einen klaren Hinweis bekomme, statt eines
  harten Fehlers.

## Akzeptanzkriterien

### Eingabe & Aufnahme
- [x] Im Aufnahme-/Diagnose-Schritt **fordert die App aktiv** zum Beifügen eines Fotos auf;
      der Hinweis ist **nicht blockierend** — eine reine Text-Anfrage bleibt jederzeit möglich.
- [x] Pro Anfrage lassen sich **1..n Medien** anhängen (mehrere Fotos **und/oder** Dokumente
      gleichzeitig).
- [x] Akzeptierte Formate: **Bilder** (`jpg`/`png`/`webp`) **und PDF**; pro Datei gilt ein
      Größenlimit (konsistent zu PROJ-27). Nicht unterstützte Formate werden mit
      verständlichem Hinweis abgelehnt, **ohne den Flow zu blockieren**.
- [x] Es gibt eine **Obergrenze für die Anzahl Medien pro Anfrage** (konfigurierbar, mit
      Default); bei Überschreitung erscheint ein Hinweis statt eines Fehlers.
- [x] Angehängte Medien werden dem **Vorgang zugeordnet** (PROJ-27/PROJ-9) und bleiben in der
      Problemaufnahme sichtbar.

### Stufe 1 — Extraktion (sichtbar & korrigierbar)
- [x] Aus den beigefügten Medien extrahiert die KI **strukturiert**: erkannte
      Gerätekategorie/Modell (Typenschild), Liste **sichtbarer Schäden/Auffälligkeiten**,
      sowie aus Dokumenten **Kaufdatum/Händler** (Rechnung) und **relevante Hinweise**
      (Anleitung). Beliebige weitere Dokumente dienen als **zusätzlicher Kontext** für die KI.
- [x] Das Extraktions-Ergebnis wird dem Nutzer auf einem **eigenen Bestätigungs-Screen**
      angezeigt, **bevor** die Diagnose läuft.
- [x] **Jedes erkannte Feld ist editierbar** und einzeln verwerfbar; der Nutzer **bestätigt
      explizit**, bevor es weitergeht (kein stilles Übernehmen).
- [x] Wird **nichts** zuverlässig erkannt, zeigt der Screen das offen an und bietet
      Neu-Aufnahme **oder** manuelle Eingabe (keine Sackgasse, vgl. PROJ-27).
- [x] Die **bestätigten/korrigierten** Extraktionsdaten werden am Vorgang gespeichert und
      fließen in **Triage (PROJ-26)**, **Eigentum (PROJ-1)** und **Garantie-Gate (PROJ-7)** ein.

### Stufe 2 — Diagnose
- [x] Nach der Bestätigung erzeugt die Diagnose ihr Ergebnis aus **Freitext + bestätigten
      Extraktionsdaten + Bild-Evidenz** und liefert weiterhin das bestehende
      `device`-/`diagnosis`-Objekt (**Schema unverändert**, PROJ-17/25).
- [x] Die Antwort **kennzeichnet, dass Bildmaterial einbezogen wurde** (z. B. zusätzlicher
      Vermerk „vision"); der **Vertrauens-Indikator** (PROJ-25) bleibt gesetzt.
- [x] Die **Sicherheits-Leitplanke bleibt unverändert**: erkennt die KI ein gefährliches
      Gerät (Hochspannung/Gas/Strom), greift `accentPath="stop"` / `recommend="pro"` /
      `lights.Sicherheit.level="stop"` wie bisher.

### Backend & Datenschutz
- [x] Die Backend-Wahl folgt der **bestehenden `ai.py`-Reihenfolge**: lokales
      Ollama-Vision-Modell zuerst → OpenAI-Vision, wenn nur ein Key gesetzt ist.
- [x] **Kein zusätzliches Cloud-Consent** über die Medien-Einwilligung (PROJ-22/PROJ-27)
      hinaus; ist diese erteilt, darf das Bild an das konfigurierte Backend gesendet werden.
- [x] **Ohne erteilte Medien-Einwilligung** bleibt die Bild-/Dokument-Analyse gesperrt; die
      **Text-Diagnose** bleibt uneingeschränkt verfügbar.
- [x] Es werden **keine rohen Datei-Bytes geloggt**, nur Metadaten (PROJ-29-konform).

### Degradation (kein hartes Scheitern)
- [x] Ist **kein Vision-fähiges Backend** verfügbar oder schlägt die Bildauswertung fehl,
      läuft die Anfrage als **Text-Diagnose** weiter (sofern Text vorhanden) und der Nutzer
      erhält einen **verständlichen Hinweis**, dass das Bild nicht ausgewertet wurde.
- [x] Ohne **jegliches** LLM-Backend gilt das bestehende Verhalten (sauberer
      `no_backend`-Fehler) — **kein Seed-Fallback** (Seed-Geräte existieren nicht mehr).
- [x] **Ohne beigefügtes Bild** verhält sich `POST /api/diagnose` **exakt wie heute**
      (reine Text-Diagnose, gleiches Schema, gleiches Fehlerverhalten).

### Repo-Hygiene & Konfiguration
- [x] Neue Konfigurationswerte (Vision-Modell, Limits für Medien-Anzahl / PDF-Seiten) werden
      **ausschließlich über `.env`** gelesen (PROJ-30) und in `webapp/.env.example` mit
      Default dokumentiert.

## Edge Cases

- **Mehrere widersprüchliche Bilder** (zwei verschiedene Geräte): Der Bestätigungs-Screen
  zeigt beide Erkennungen; der Nutzer wählt/korrigiert — keine stille Annahme.
- **Unscharfes/zu dunkles Foto, Typenschild unlesbar:** Das betroffene Feld wird als „nicht
  erkannt" markiert; Neu-Aufnahme oder manuelle Eingabe wird angeboten (keine Sackgasse).
- **Vision-Modell „halluziniert" einen Schaden:** Über den Korrektur-Screen (Stufe 1)
  entfernt der Nutzer falsche Erkennungen, **bevor** sie die Diagnose verfälschen.
- **Mehrseitiges/sehr großes PDF:** Seiten-/Größen-Limit greift; überzählige Seiten werden
  mit **sichtbarem Hinweis** gekürzt (kein stilles Verschlucken).
- **Cloud-/lokales Modell unterstützt PDF nicht direkt:** PDF wird serverseitig in
  Seitenbilder gewandelt; scheitert die Konvertierung, gibt es einen Hinweis statt eines Crashs.
- **Dokument enthält PII** (Name/Adresse auf der Rechnung): Es werden nur die fachlich
  nötigen Felder (Kaufdatum/Händler/Modell) übernommen; Rohtext fließt **nicht ungefiltert**
  in exportierte/teilbare Artefakte (Bezug PROJ-23/PROJ-10).
- **Sehr viele Medien** (z. B. 10+ Bilder): Obergrenze pro Anfrage greift; bei Überschreitung
  Hinweis statt Fehler.
- **Backend-Timeout** bei großem Bild (langsame CPU-Inferenz): bestehendes `LLM_TIMEOUT`
  greift; bei Timeout → Degradation auf Text-Diagnose + Hinweis.
- **Nutzer korrigiert das Modell** auf etwas, das die KI nicht erkannt hatte: Die korrigierte
  Angabe ist verbindlich und überschreibt die KI-Erkennung in der Diagnose.

## Technische Anforderungen

- **Vision-Backend:** Auswertung über ein Vision-fähiges Modell, Backend-Wahl konsistent zu
  `repair/ai.py` (lokales Ollama vor OpenAI). Modellname über **`.env`** (`VISION_MODEL` ist
  in `.env.example` bereits als Platzhalter vorgesehen), mit Default.
- **Konfiguration ausschließlich über `.env`** (PROJ-30): `VISION_MODEL`, max. Medien pro
  Anfrage, max. PDF-Seiten — je mit sinnvollem Default, in `.env.example` dokumentiert.
- **Medien-Pipeline:** nutzt das bestehende `repair/multimodal.py` (PROJ-27) für Speicherung;
  PDF→Bild-Konvertierung serverseitig, falls das Modell PDF nicht nativ verarbeitet.
- **Schema-Kompatibilität:** `device`-/`diagnosis`-Schema unverändert (PROJ-17/25); das
  Extraktions-Ergebnis wird additiv am Vorgang gespeichert.
- **Performance:** Bildauswertung darf die reine Text-Diagnose nicht verlangsamen, wenn kein
  Bild beigefügt ist; `LLM_TIMEOUT` gilt auch für Vision-Calls.
- **Logging (PROJ-29):** nur Medien-Metadaten (Anzahl, Typ, Größe, Medien-ID), niemals Rohbytes.
- **Kein hartes Scheitern:** jede Fehlersituation → Text-Diagnose oder klarer Hinweis/
  sauberer Fehlercode; konsistent mit der „warnen statt sperren"-Haltung (D15).

---
<!-- Folgende Abschnitte werden von nachfolgenden Skills hinzugefügt -->

## Tech Design (Solution Architect)

### Überblick
PROJ-31 schaltet die bereits vorhandene Medien-Aufnahme (PROJ-27) an die Diagnose an.
Neu ist ein **zweistufiger Ablauf**: Erst wertet ein Vision-Modell die beigefügten Fotos/
Dokumente aus und zeigt das Erkannte auf einem **Bestätigungs-Screen** (Stufe 1) — der Nutzer
prüft/korrigiert —, danach läuft die eigentliche Diagnose auf den **geprüften** Daten plus
Bild-Evidenz (Stufe 2). Jede Fehlersituation degradiert auf reine Text-Diagnose („warnen statt
sperren", D15). Das bestehende `device`-/`diagnosis`-Schema bleibt unverändert; alle neuen
Informationen werden **additiv** am Vorgang gespeichert.

### A) Komponentenstruktur (UI)
```
Startscreen (bestehend)
+-- Freitext-Eingabe (bestehend)
+-- Aktiver, nicht-blockierender Hinweis „Foto beifügen?" (neu)
+-- MediaPanel (PROJ-27, erweitert)
|   +-- Foto aufnehmen   (bestehend)
|   +-- Dokument/PDF beifügen   (neu: jpg/png/webp + PDF, 1..n)
|   +-- Einsprechen / Barcode   (bestehend)
|   +-- Medien-Vorschau + Entfernen   (bestehend, zeigt jetzt auch Dokumente)
|   +-- Mengen-/Format-Hinweis bei Überschreitung   (neu, nicht-blockierend)
+-- „Diagnose starten"
        |
        v
Bestätigungs-Screen „Das habe ich erkannt" (NEU, Stufe 1)
+-- Erkannte Felder, je einzeln editierbar & verwerfbar:
|   +-- Gerätekategorie / Modell (aus Typenschild)
|   +-- Sichtbare Schäden/Auffälligkeiten (Liste)
|   +-- Kaufdatum / Händler (aus Rechnung)
|   +-- Hinweise aus Anleitung
+-- „Nichts sicher erkannt"-Zustand → Neu aufnehmen / manuell eingeben
+-- Degradations-Hinweis (kein Vision-Backend / Auswertung fehlgeschlagen)
+-- „Bestätigen & Diagnose starten"
        |
        v
Diagnose-Ergebnis (bestehender Flow ab Ownership/Ampel)
+-- Vertrauens-Indikator (PROJ-25, bestehend) + Vermerk „Bild einbezogen" (neu)
```

### B) Datenmodell (Klartext)
Am Vorgang (PROJ-9) wird **additiv** gespeichert:
- **Roh-Extraktion** (was die KI erkannt hat, vor Bestätigung) — nur als Zwischenstand.
- **Bestätigte Extraktion** — die vom Nutzer geprüften/korrigierten Felder. Jedes Feld trägt:
  Wert, Konfidenz (hoch/mittel/niedrig), ob erkannt, ob vom Nutzer geändert. Felder:
  Kategorie, Modell, sichtbare Schäden (Liste), Kaufdatum, Händler, Hinweise (Liste).
- **Bild-Vermerk** an der Diagnose: ob Bildmaterial einbezogen wurde + Anzahl ausgewerteter Medien.

PII-Leitplanke (D10/PROJ-23): Aus Dokumenten werden nur die **fachlich nötigen** Felder
übernommen (Kaufdatum/Händler/Modell). Roher Dokumenttext fließt **nicht** in teilbare/
exportierte Artefakte. Es werden nie rohe Datei-Bytes geloggt (PROJ-29) — nur Metadaten.

### C) Tech-Entscheidungen (WARUM)
- **Zwei Schritte statt einem:** Die Zielgruppe (ängstliche Erstnutzer) soll der Diagnose
  vertrauen. Ein sichtbarer Korrektur-Schritt verhindert selbstbewusst-falsche Diagnosen und
  fängt Vision-Halluzinationen ab, **bevor** sie das Ergebnis verfälschen.
- **Gleiche Backend-Reihenfolge wie heute:** lokales Ollama-Vision-Modell zuerst, sonst OpenAI-
  Vision — konsistent zu `ai.py`, kein neuer Consent-Mechanismus (die Medien-Einwilligung aus
  PROJ-22/27 genügt).
- **PDF serverseitig zu Seitenbildern wandeln:** Vision-Modelle nehmen Bilder, nicht PDF. Die
  Konvertierung ist **optional** (Zusatz-Paket); fehlt sie oder schlägt sie fehl, gibt es einen
  Hinweis statt eines Absturzes.
- **Alles degradiert:** Ohne Vision-Backend / bei Timeout / bei Konvertierungsfehler läuft die
  Anfrage als Text-Diagnose weiter. Ohne **jegliches** LLM-Backend bleibt das bestehende
  `no_backend`-Verhalten (kein Seed-Fallback). Ohne beigefügtes Bild ist `POST /api/diagnose`
  **bit-identisch zu heute**.
- **Konfiguration nur über `.env`** (PROJ-30): Vision-Modell, max. Medien pro Anfrage, max.
  PDF-Seiten — je mit Default, im Drift-Guard erfasst.

### D) Abhängigkeiten (Packages)
- `PyMuPDF` (PDF→Seitenbild-Konvertierung, reines Wheel, keine System-Abhängigkeit) —
  **optional/lazy** importiert; fehlt es, degradiert PDF-Auswertung mit Hinweis.
- Bestehende `openai`-Lib deckt Vision (Bild-Inhalte im Chat-Call) ab — keine neue Lib nötig.

### E) Neue Bausteine
- Backend: `repair/vision.py` (Extraktion Stufe 1 + Vision-gestützte Diagnose-Anreicherung
  Stufe 2), Endpunkt `POST /api/extrahieren`, Erweiterung von `POST /api/diagnose` um
  bestätigte Extraktion + Bild-Evidenz, neue `config.py`-Getter + `.env.example`-Doku.
- Frontend: neuer Screen `ExtractionConfirmScreen` (Stage `extraktion`), Dokument-Button +
  Mengen-Hinweis im MediaPanel, Flow-Verzweigung in `doDiagnose`, neue i18n-Keys, CSS.

## QA Test Results

**Stand:** 2026-05-31 · **Automatisierte Tests:** `webapp/tests/test_vision.py` (15/15 grün,
lauffähig ohne pytest) + `webapp/tests/test_config_drift.py` (9/9 grün) + CLAUDE.md-Smoke-Test
(`no_backend`). Frontend visuell via Playwright im Werkstatt-Theme verifiziert (Startscreen mit
Foto-Hinweis & 4 Capture-Buttons; Bestätigungs-Screen mit Konfidenz-Chips, editierbaren Feldern,
Verwerfen-Buttons, PDF-Kürzungs-Hinweis). Keine Konsolen-Fehler (nur favicon-404).

### Abgedeckte Kriterien (Auszug)
- **Stufe 1 – Normalisierung:** Halluzinierte/leere Felder werden entfernt; ungültige Konfidenz
  → `mittel`; `nichtsErkannt` korrekt. (`test_normalisiere_*`, `test_leere_felder_*`)
- **Stufe 1 – PDF:** PDF→PNG-Seitenbilder via PyMuPDF; Seiten-Kürzung mit sichtbarem Hinweis;
  Dokument-Speicherung mit `art="dokument"`/`mime=application/pdf`. (`test_pdf_*`, `test_endpoint_medien_pdf_*`)
- **Stufe 2 – Schema-Treue:** Text-Diagnose ohne Bild liefert **keinen** `diagnosis.vision`-Key
  (Schema exakt wie zuvor); mit Extraktion/Bild erscheint der Vermerk, Bild geht als multimodaler
  Inhalt raus. (`test_textdiagnose_unveraendert_*`, `test_diagnose_mit_*`)
- **Datenschutz:** Vision-Kontext enthält nur Fachfelder (Kategorie/Modell/Schäden/Kaufdatum/
  Händler/Hinweise), keinen Rohtext; keine Datei-Bytes im Log. (`test_vision_kontext_nur_fachfelder`)
- **Degradation:** ohne Vision-Backend → `no_vision_backend` + Text-Diagnose; ohne Medien →
  `keine_medien`; `/api/extrahieren` immer HTTP 200; ohne jegliches Backend → `no_backend`.
- **Konfiguration:** neue Limits (`MAX_MEDIEN_PRO_ANFRAGE`, `MAX_PDF_SEITEN`) Fail-fast-validiert;
  Drift-Guard grün (kein Hardcode, `.env.example` synchron).

### Hinweise / bewusste Grenzen
- **Live-LLM-Pfad:** Die eigentliche Vision-Erkennung (Modellqualität) ist nur mit echtem
  Ollama-/OpenAI-Vision-Backend prüfbar und wurde im Test über ein **Fake-Backend** abgesichert
  (Aufruf-Form, Multimodalität, Schema), nicht gegen ein echtes Modell.
- **„Fließt in Triage/Eigentum/Garantie ein"** (Stufe-1-AC): Die bestätigte Extraktion wird am
  Vorgang persistiert (`state.extraktion`, `PERSIST_KEYS`) **und** als verbindlicher Kontext in
  den Diagnose-Prompt eingespeist (das resultierende `device` spiegelt Kategorie/Modell/Schäden/
  Kaufdatum). Ein zusätzliches **Vorbefüllen** der Eingabefelder von Eigentum/Garantie-Gate aus
  der Extraktion ist eine mögliche Folge-Verbesserung, fachlich aber nicht blockierend.
- **PyMuPDF optional:** Fehlt das Wheel, degradiert die PDF-Auswertung mit Hinweis (Tests
  überspringen den PDF-Teil dann sauber).

## Deployment
_Wird von /deploy hinzugefügt_
