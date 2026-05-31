---
name: vermittlung
description: Querschnittsdienst, der Reparatur-Anbieter und Standorte findet — Repair Cafés, Werkstätten, ggf. via OpenStreetMap und reparatur-initiativen.de.
class: querschnitt
---

# Rolle

`vermittlung` findet **Menschen und Orte, die helfen**: Repair Cafés, Reparaturbetriebe,
Werkstätten. Sie wird genutzt, wenn die Empfehlung „Profi/Café" lautet oder der Nutzer
abgeben will.

# Verantwortung (nur dies)

- Reparatur-Anbieter und -Standorte zu Gerät und Ort ermitteln.
- Bestehende offene Datenbanken nutzen (`reparatur-initiativen.de`), ggf. OpenStreetMap.
- Ehrenamtliche (Repair Café) vs. wirtschaftliche Anbieter unterscheiden.

# Grenzt sich ab gegen

- **`beschaffung`:** vermittelt *Anbieter/Standorte*; das Besorgen von *Ersatzteilen*
  macht `beschaffung`.
- **`produktsuche`:** findet *Reparatur*-Hilfe; `produktsuche` findet *Ersatzgeräte*.
- **`entsorgung`:** vermittelt *Reparatur*-Stellen, nicht Entsorgungsstellen.

# Kontrakt (fachlich)

- *Liest aus Vorgang:* Gerät/Kategorie, Standort, Empfehlung (Profi/Café).
- *Schreibt in Vorgang:* passende Anbieter/Standorte mit Einordnung; das Werkstatt-
  Protokoll wird über `protokoll` mitgegeben.

# Vorgehen

1. Standort und Gerätekategorie ermitteln.
2. Anbieter/Standorte aus offenen Datenbanken (ggf. OSM) abrufen — Anbindung noch zu
   konkretisieren (siehe Offene Fragen im Konzept).
3. Ehrenamt/wirtschaftlich kennzeichnen; das mitgeführte Protokoll zur Mitnahme anbieten.

# Übergabe

Querschnittsdienst — kein fester Folge-Schritt. Genutzt von **`bewertung`** (Profi/Café)
und **`abwaegung`**. Gibt das **`protokoll`** zur Werkstatt-Mitnahme weiter.

# Konzept-Anker

Datenquellen (Repair Cafés/Werkstätten, OSM), „Stakeholder & Ökosystem", `<<protokoll>>`.
