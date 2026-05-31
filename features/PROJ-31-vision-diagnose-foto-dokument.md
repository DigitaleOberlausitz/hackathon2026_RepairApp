# PROJ-31: Vision-Diagnose aus Foto & Dokument

## Status: Planned
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
- [ ] Im Aufnahme-/Diagnose-Schritt **fordert die App aktiv** zum Beifügen eines Fotos auf;
      der Hinweis ist **nicht blockierend** — eine reine Text-Anfrage bleibt jederzeit möglich.
- [ ] Pro Anfrage lassen sich **1..n Medien** anhängen (mehrere Fotos **und/oder** Dokumente
      gleichzeitig).
- [ ] Akzeptierte Formate: **Bilder** (`jpg`/`png`/`webp`) **und PDF**; pro Datei gilt ein
      Größenlimit (konsistent zu PROJ-27). Nicht unterstützte Formate werden mit
      verständlichem Hinweis abgelehnt, **ohne den Flow zu blockieren**.
- [ ] Es gibt eine **Obergrenze für die Anzahl Medien pro Anfrage** (konfigurierbar, mit
      Default); bei Überschreitung erscheint ein Hinweis statt eines Fehlers.
- [ ] Angehängte Medien werden dem **Vorgang zugeordnet** (PROJ-27/PROJ-9) und bleiben in der
      Problemaufnahme sichtbar.

### Stufe 1 — Extraktion (sichtbar & korrigierbar)
- [ ] Aus den beigefügten Medien extrahiert die KI **strukturiert**: erkannte
      Gerätekategorie/Modell (Typenschild), Liste **sichtbarer Schäden/Auffälligkeiten**,
      sowie aus Dokumenten **Kaufdatum/Händler** (Rechnung) und **relevante Hinweise**
      (Anleitung). Beliebige weitere Dokumente dienen als **zusätzlicher Kontext** für die KI.
- [ ] Das Extraktions-Ergebnis wird dem Nutzer auf einem **eigenen Bestätigungs-Screen**
      angezeigt, **bevor** die Diagnose läuft.
- [ ] **Jedes erkannte Feld ist editierbar** und einzeln verwerfbar; der Nutzer **bestätigt
      explizit**, bevor es weitergeht (kein stilles Übernehmen).
- [ ] Wird **nichts** zuverlässig erkannt, zeigt der Screen das offen an und bietet
      Neu-Aufnahme **oder** manuelle Eingabe (keine Sackgasse, vgl. PROJ-27).
- [ ] Die **bestätigten/korrigierten** Extraktionsdaten werden am Vorgang gespeichert und
      fließen in **Triage (PROJ-26)**, **Eigentum (PROJ-1)** und **Garantie-Gate (PROJ-7)** ein.

### Stufe 2 — Diagnose
- [ ] Nach der Bestätigung erzeugt die Diagnose ihr Ergebnis aus **Freitext + bestätigten
      Extraktionsdaten + Bild-Evidenz** und liefert weiterhin das bestehende
      `device`-/`diagnosis`-Objekt (**Schema unverändert**, PROJ-17/25).
- [ ] Die Antwort **kennzeichnet, dass Bildmaterial einbezogen wurde** (z. B. zusätzlicher
      Vermerk „vision"); der **Vertrauens-Indikator** (PROJ-25) bleibt gesetzt.
- [ ] Die **Sicherheits-Leitplanke bleibt unverändert**: erkennt die KI ein gefährliches
      Gerät (Hochspannung/Gas/Strom), greift `accentPath="stop"` / `recommend="pro"` /
      `lights.Sicherheit.level="stop"` wie bisher.

### Backend & Datenschutz
- [ ] Die Backend-Wahl folgt der **bestehenden `ai.py`-Reihenfolge**: lokales
      Ollama-Vision-Modell zuerst → OpenAI-Vision, wenn nur ein Key gesetzt ist.
- [ ] **Kein zusätzliches Cloud-Consent** über die Medien-Einwilligung (PROJ-22/PROJ-27)
      hinaus; ist diese erteilt, darf das Bild an das konfigurierte Backend gesendet werden.
- [ ] **Ohne erteilte Medien-Einwilligung** bleibt die Bild-/Dokument-Analyse gesperrt; die
      **Text-Diagnose** bleibt uneingeschränkt verfügbar.
- [ ] Es werden **keine rohen Datei-Bytes geloggt**, nur Metadaten (PROJ-29-konform).

### Degradation (kein hartes Scheitern)
- [ ] Ist **kein Vision-fähiges Backend** verfügbar oder schlägt die Bildauswertung fehl,
      läuft die Anfrage als **Text-Diagnose** weiter (sofern Text vorhanden) und der Nutzer
      erhält einen **verständlichen Hinweis**, dass das Bild nicht ausgewertet wurde.
- [ ] Ohne **jegliches** LLM-Backend gilt das bestehende Verhalten (sauberer
      `no_backend`-Fehler) — **kein Seed-Fallback** (Seed-Geräte existieren nicht mehr).
- [ ] **Ohne beigefügtes Bild** verhält sich `POST /api/diagnose` **exakt wie heute**
      (reine Text-Diagnose, gleiches Schema, gleiches Fehlerverhalten).

### Repo-Hygiene & Konfiguration
- [ ] Neue Konfigurationswerte (Vision-Modell, Limits für Medien-Anzahl / PDF-Seiten) werden
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
_Wird von /architecture hinzugefügt_

## QA Test Results
_Wird von /qa hinzugefügt_

## Deployment
_Wird von /deploy hinzugefügt_
