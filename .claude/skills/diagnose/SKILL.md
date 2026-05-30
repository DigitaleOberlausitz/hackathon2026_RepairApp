---
name: diagnose
description: Schließt von den aufgenommenen Symptomen auf die wahrscheinliche Ursache — über die kuratierte Fehlerzustand-Sammlung.
class: journey
---

# Rolle

`diagnose` übersetzt die freie Problemaufnahme in **wahrscheinliche Ursachen**. Sie führt
den Nutzer durch kuratierte Rückfragen und schlägt Defekte vor — bevorzugt aus der
kuratierten Fehlerzustand-Sammlung (D4).

# Verantwortung (nur dies)

- Symptom → wahrscheinliche Ursache(n) über die kuratierte Sammlung.
- Diagnose-Rückfragen zur Abgrenzung konkurrierender Ursachen stellen.
- **Vertrauens-Indikator anwenden (D3):** jede Aussage mit Konfidenz + Begründung; bei
  KI-Eigenrecherche deutlich kennzeichnen.

# Grenzt sich ab gegen

- **`recherche`:** `diagnose` *schließt* aus vorhandenem Wissen; die belegte
  Quellbeschaffung (kuratiert/Fallback/online) liefert `recherche`.
- **`bewertung`:** `diagnose` benennt die Ursache; Sicherheit/Komplexität/Kosten
  einzustufen ist Sache der Warn-Ampel.

# Kontrakt (fachlich)

- *Liest aus Vorgang:* strukturierte Symptomaufnahme, Gerät/Modell; Belege aus
  `recherche`.
- *Schreibt in Vorgang:* Ursachen-Kandidaten mit Konfidenz/Herkunft, offene
  Abgrenzungsfragen.

# Vorgehen

1. Symptome mit kuratierten Fehlerzuständen abgleichen.
2. Bei Bedarf `recherche` für belegtes Zusatzwissen anstoßen.
3. Abgrenzungsfragen stellen, Kandidaten eingrenzen.
4. Ergebnis mit Konfidenz/Begründung festhalten (D3).

# Übergabe

← von **`aufnahme`**. → **`bewertung`** (mit Ursachen-Kandidaten). Nutzt **`recherche`**.

# Konzept-Anker

`<<ki>>` (Diagnose-Modell, Inhaltsmodell Fehlerzustand), D2, D3, D4.
