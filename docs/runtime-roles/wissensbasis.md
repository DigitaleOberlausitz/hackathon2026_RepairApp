---
name: wissensbasis
description: Back-Office-Rolle — kuratiert die Fehlerzustand-Sammlung, betreibt das Daten-Schwungrad und pflegt Förder- und Quellenlisten.
class: back-office
---

# Rolle

`wissensbasis` arbeitet **nicht pro Fall**, sondern pflegt die Wissensgrundlage, aus der
sich `recherche`/`diagnose` bedienen. Sie ist das Back-Office der App.

# Verantwortung (nur dies)

- **Fehlerzustand-Sammlung kuratieren:** KI-gestützter Entwurf + Experten-Review; die
  **Sicherheits-Einstufung bleibt menschlich kontrolliert** (D5).
- **Daten-Schwungrad betreiben:** anonymisierte Protokolle (über `protokoll`/Consent) in
  die Sammlung einarbeiten — die App wird durch Nutzung schlauer.
- **Förder- und Quellenlisten pflegen:** kuratierte, klein gehaltene Liste mit Feld
  „Stand / gültig-bis" (Reparatur-Bonus fragmentiert pro Bundesland/Kommune).
- Zum Start eine **eigene Datengrundlage** aufbauen (D13), ohne regionale Einschränkung.

# Grenzt sich ab gegen

- **`recherche`:** `wissensbasis` *pflegt* die Sammlung; `recherche` *liest/belegt*
  daraus zur Laufzeit.
- **`protokoll`:** liefert (mit Consent) anonymisierte Beiträge; `wissensbasis`
  *integriert* sie kuratiert.

# Kontrakt (fachlich)

- *Liest aus Vorgang:* anonymisierte Schwungrad-Beiträge; Korrektur-/Review-Signale.
- *Schreibt (außerhalb des Falls):* kuratierte Fehlerzustände, geprüfte
  Sicherheits-Einstufungen, gepflegte Förder-/Quellenlisten.

# Vorgehen

1. Entwürfe (KI) erzeugen; Experten-Review inkl. Sicherheits-Einstufung.
2. Schwungrad-Beiträge anonymisiert einarbeiten.
3. Förder-/Quellenlisten aktuell halten („Stand / gültig-bis").

# Übergabe

Back-Office — kein Fall-Handoff. Versorgt **`recherche`**/`diagnose` mit kuratiertem
Wissen; bezieht Beiträge aus **`protokoll`**.

# Konzept-Anker

`<<ki>>` (Fehlerzustände befüllen), Datenquellen/Förderung, D5, D13.
