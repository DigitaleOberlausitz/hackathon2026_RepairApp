# PROJ-38: Responsive Web-Layout statt Handy-Attrappe

## Status: Planned
**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31

## Kontext / Problem

Die App wird aktuell in ein simuliertes Smartphone gerendert: `#phone-root` → `.rk-phone`
mit fester Größe `384 × 812 px` (`.rk-canvas`), schwarzem Geräterahmen (`border: 13px solid`,
46px-Ecken, Schlagschatten), gefälschter Statusleiste (`.rk-statusbar`: Uhrzeit „9:41",
Signalbalken, Akku-Symbol) und iPhone-Home-Indikator (`.rk-home`). Das ist ein 1:1-Port des
Design-Prototyps (`docs/design-handoff/project/`) — ein **Mockup-Bild**, keine echte Website.

Folge: Auf dem Desktop schwebt ein Handy mittig auf grauer Bühne; die Seite skaliert nicht mit
dem Browser. Auf dem echten Handy entsteht ein „Handy-im-Handy"-Effekt mit doppelter Statusleiste.

**Ziel:** eine echte responsive Website, die den Browser füllt und von Mobil bis Desktop
funktioniert — **mobil-first**, auf breiten Bildschirmen als **zentrierte Lese-Spalte**.

## Entscheidungen (mit dem Nutzer abgestimmt, 2026-05-31)

- **Desktop-Layout:** zentrierte Lese-Spalte — Inhalt mobil-first, auf breiten Screens in
  begrenzter Breite mittig, füllt aber den Browser ohne Phone-Rahmen.
- **Mockup-Chrome:** komplett entfernen — Geräterahmen, Statusleiste (Uhrzeit/Signal/Akku)
  und Home-Indikator fallen ersatzlos weg.
- **Umfang:** Hülle responsiv machen **+ Desktop-Feinschliff**. Bestehende Screens/Flows
  bleiben inhaltlich identisch; angepasst werden Container, Skalierung, Abstände und
  Touch→Maus-Verhalten, damit die Screens auf großen Bildschirmen sauber wirken.

## Abhängigkeiten
- Keine harte Feature-Abhängigkeit. **Querschnitts-UI-Änderung:** betrifft die Render-Hülle,
  die alle Screens nutzen (`PhoneFrame()` in `ui.js`, Mount in `app.js`, Layout-Tokens in
  `repair.css`/`index.html`). Keine Backend- oder API-Änderung.

## User Stories
- Als **Handy-Nutzer** möchte ich die App im Vollbild meines Browsers benutzen, damit ich
  keine doppelte Statusleiste und keinen Handy-im-Handy-Effekt sehe.
- Als **Desktop-Nutzer** möchte ich eine lesbare, mittig zentrierte Inhaltsspalte statt eines
  schwebenden Telefonbildes, damit sich die Seite wie eine echte Website anfühlt.
- Als **Nutzer auf einem Tablet / im Querformat** möchte ich, dass sich das Layout flüssig
  anpasst, ohne dass Inhalte abgeschnitten werden oder horizontal scrollen.
- Als **Nutzer** möchte ich Theme- und Sprachumschalter weiterhin gut erreichbar haben, damit
  der Funktionsumfang erhalten bleibt.
- Als **Nutzer mit Tastatur/Maus** möchte ich, dass Klick-/Hover-Ziele auch ohne Touch gut
  bedienbar sind (Hover-Zustände, sichtbarer Fokus).

## Akzeptanzkriterien
- [ ] `.rk-phone`-Geräterahmen (schwarzer Rand, 46px-Ecken, Geräte-Schlagschatten) wird entfernt;
      die App rendert direkt in den Seiteninhalt.
- [ ] Gefälschte Statusleiste (`.rk-statusbar` inkl. „9:41", Signalbalken, Akku-SVG) ist
      vollständig entfernt — kein DOM-Knoten, keine CSS-Reste.
- [ ] Home-Indikator (`.rk-home`) ist entfernt.
- [ ] Feste Maße `384 × 812 px` (`.rk-canvas`) entfallen; der Inhalt nutzt die Viewport-Breite.
- [ ] Auf schmalen Viewports (≤ ~480px) füllt der Inhalt die volle Breite mit angemessenem
      seitlichem Innenabstand (kein horizontales Scrollen, kein Beschnitt).
- [ ] Auf breiten Viewports wird der Inhalt auf eine **maximale Breite** begrenzt und horizontal
      **zentriert** (Lese-Spalte). Der gewählte max-width-Wert wird im Tech-Design festgelegt.
- [ ] Die Seite nutzt natürliches Seiten-Scrolling; es gibt keinen separaten Innen-Scrollbereich,
      der eine Telefon-Hülle simuliert. Eine ggf. vorhandene App-Bar/Footer bleibt funktional.
- [ ] Theme-Umschalter und Sprach-Umschalter bleiben sichtbar, bedienbar und korrekt
      positioniert (mobil wie Desktop).
- [ ] Theme-Wechsel funktioniert weiterhin: Theme-CSS-Variablen werden weiterhin auf den
      passenden Wurzel-Container gesetzt (vorher `.rk-phone` per inline-style).
- [ ] Alle bestehenden Screens/Flows (Start, Triage, Diagnose, Bewertung, Vergleich, Vermittlung,
      Entsorgung, Ersatzteile, Multimodal/Vision-Bestätigung, Protokoll/Export …) rendern korrekt
      und sind weiterhin vollständig nutzbar — keine inhaltliche Änderung.
- [ ] Touch-Interaktionen funktionieren weiterhin; zusätzlich gibt es sinnvolle Hover- und
      sichtbare Fokus-Zustände für Maus/Tastatur.
- [ ] `viewport`-Meta-Tag bleibt korrekt (`width=device-width, initial-scale=1.0`); kein
      doppeltes Skalieren.
- [ ] Keine toten CSS-Regeln zur Telefon-Hülle bleiben übrig (aufgeräumt, nicht nur überschrieben).

## Edge Cases
- **Sehr breiter Monitor (z.B. ≥ 1440px):** Inhalt bleibt zentriert in max-width, kein
  überdehntes Layout, kein riesiger Leerraum-Bruch.
- **Sehr kleines/schmales Gerät (z.B. 320px):** kein Überlauf, kein abgeschnittener Text,
  Buttons bleiben tippbar (Mindestgröße).
- **Querformat auf dem Handy (niedrige Höhe):** Inhalt scrollt natürlich, App-Bar/Footer
  verdecken keine Inhalte dauerhaft.
- **Theme-Wechsel nach dem Umbau:** Variablen-Vererbung muss auf dem neuen Wurzel-Container
  greifen — keine „farblosen" Screens, weil die Variablen vorher nur an `.rk-phone` hingen.
- **Lange Inhalte (z.B. ausführliche Diagnose/Protokoll):** Seiten-Scroll statt
  Innen-Scroll; Sticky-Elemente (falls vorhanden) dürfen nicht springen.
- **Browser-Zoom / großer System-Font:** Layout bleibt nutzbar, bricht nicht.
- **Bestehende Tests / Selektoren:** Falls Tests oder Skripte auf `.rk-phone`/`.rk-statusbar`
  prüfen, müssen sie angepasst werden (im QA-Schritt verifizieren).

## Technische Anforderungen (optional)
- **Browser-Support:** aktuelle Chrome, Firefox, Safari (inkl. mobile Safari/Chrome).
- **Keine neuen Frontend-Frameworks** — bleibt Vanilla-JS + Tailwind-Scaffold + `repair.css`
  gemäß `webapp/SPEC.md`. Theme-Variablen-Modell bleibt erhalten.
- **Keine Backend-/API-Änderung.**
- **Performance:** keine zusätzlichen blockierenden Ressourcen; reines Layout/CSS + kleine
  JS-Anpassung der Render-Hülle.
- **`webapp/SPEC.md`** (Klassennamen-/Theme-Token-Vertrag) ggf. nachziehen, wenn Hüllen-Klassen
  entfallen — Drift vermeiden.

---
<!-- Folgende Abschnitte werden von nachfolgenden Skills hinzugefügt -->

## Tech Design (Solution Architect)
_Wird von /architecture hinzugefügt_

## QA Test Results
_Wird von /qa hinzugefügt_

## Deployment
_Wird von /deploy hinzugefügt_
