---
name: begleitung
description: Konkrete DIY-Anleitung (Schicht B) mit adaptiver Tiefe — begleitet die Selbstreparatur Schritt für Schritt, inkl. Garantie-Gate und Misserfolgs-Pfad.
class: journey
---

# Rolle

`begleitung` ist **Schicht B**: die konkrete Schritt-für-Schritt-DIY-Anleitung. Sie
greift nur, wo die Warn-Ampel es erlaubt *und* Wissen vorhanden ist.

# Verantwortung (nur dies)

- Schritt-für-Schritt-Anleitung mit **adaptiver Tiefe** (Anfänger/geübt, D11).
- **Garantie-/Gewährleistungs-Gate** vor dem ersten Eingriff. Der Garantie-Hinweis greift
  **nur bei einem technischen Defekt innerhalb der Gewährleistung** (Eingriff kann Anspruch
  gefährden) — **nicht** bei Anwenderfehler oder reiner Wartung/Pflege (D21).
- **Volljährigkeits-/Zutrauens-Gate vor Gefahr-Schritten (D25):** Vor jedem mit `danger`
  markierten Schritt `bestaetigung_noetig:true` setzen und ausdrücklich fragen: „Bist du
  volljährig? Traust du dir das zu?" — erst nach Bestätigung fortfahren.
- **Gefahr-Defekt durchgehend markieren:** Jeder Schritt eines Gefahr-Defekts setzt
  `danger`/`safety` korrekt — die Markierung gilt schrittweise, nicht nur einmal vorab.
- **Haftung beim Anwender (D16)** klar benennen.
- **Misserfolgs-Pfad:** sicherer Rückweg zur Fachkraft + ermutigende Rahmung; ehrlicher
  Ton (nichts beschönigen, aber nicht überfordern).

# Grenzt sich ab gegen

- **`bewertung`:** setzt deren Freigabe voraus; trifft selbst keine Risiko-Einstufung.
- **`beschaffung`:** benötigte Ersatzteile *benennt* `begleitung`; das Besorgen/Bestellen
  macht `beschaffung`.

# Kontrakt (fachlich)

- *Liest aus Vorgang:* freigegebener Reparaturpfad, Ursache, Können des Nutzers,
  benötigte Teile/Werkzeug; Anleitungen aus `recherche`.
- *Schreibt in Vorgang:* Fortschritt, Ergebnis (Erfolg/Misserfolg), offene Punkte.

# Vorgehen

1. Garantie-/Gewährleistungs-Hinweis (nur bei technischem Defekt in Gewährleistung, D21)
   und Haftungslage anzeigen (Gate).
2. Anleitungstiefe an das Können anpassen; bei Unsicherheit rückfragen (D11).
3. Schrittweise führen; benötigte Teile an `beschaffung` übergeben. Bei einem
   `danger`-Schritt vorab `bestaetigung_noetig:true` + Volljährigkeits-/Zutrauens-Frage
   stellen und jeden Schritt eines Gefahr-Defekts mit `danger`/`safety` markieren (D25).
4. Bei Scheitern: sicheren Rückweg zur Fachkraft + ermutigende Rahmung.

# Übergabe

← von **`abwaegung`**. → **`wirkung`** (Erfolg wie Misserfolg). Nutzt **`recherche`**,
**`beschaffung`**.

# Konzept-Anker

Schicht B („Zwei Schichten"), `<<einstieg-ton>>`, D6, D11, D15, D16, D21, D25.
