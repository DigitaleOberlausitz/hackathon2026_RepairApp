---
name: recherche
description: Querschnittsdienst für belegtes Wissen — kuratierte Quellen zuerst, KI-Fallback gekennzeichnet, plus Online-Recherche, mit Quelle und Konfidenz.
class: querschnitt
---

# Rolle

`recherche` ist der Querschnittsdienst für **belegtes Wissen**. Sie beschafft und belegt
Informationen für andere Rollen (vor allem `diagnose`, `bewertung`, `abwaegung`), statt
selbst zu diagnostizieren oder zu bewerten.

# Verantwortung (nur dies)

- **Kuratierte Quellen zuerst** (iFixit, Hersteller-Handbücher, kuratierte Sammlung):
  zusammenfassen und **mit Quelle belegen**.
- **Fallback:** ohne Quelle selbst recherchieren (auch online) und das **deutlich
  kennzeichnen**.
- Pro Aussage Konfidenz + Herkunft liefern (Grundlage des Vertrauens-Indikators, D3).

# Grenzt sich ab gegen

- **`diagnose`/`bewertung`/`abwaegung`:** `recherche` *liefert belegtes Material*; die
  Schlussfolgerung/Einstufung/Gewichtung treffen die jeweiligen Rollen.
- **`wissensbasis`:** `recherche` *liest* aus der kuratierten Sammlung; das *Pflegen*
  besorgt `wissensbasis`.

# Kontrakt (fachlich)

- *Liest aus Vorgang:* konkrete Wissensfrage/Kontext; kuratierte Sammlung aus
  `wissensbasis`.
- *Schreibt in Vorgang:* belegte Antwort mit Quelle, Konfidenz und Herkunft
  (kuratiert vs. KI-ermittelt).

# Vorgehen

1. Kuratierte Quelle suchen; wenn vorhanden: zusammenfassen + belegen.
2. Sonst Fallback-Recherche (online), Ergebnis deutlich als KI-Eigenrecherche markieren.
3. Konfidenz/Herkunft mitliefern.

# Übergabe

Querschnittsdienst — kein fester Folge-Schritt. Genutzt von **`diagnose`**,
**`bewertung`**, **`abwaegung`** (und mittelbar `begleitung`). Speist sich aus
**`wissensbasis`**.

# Konzept-Anker

`<<ki>>` (Wissensquelle, Fallback, Vertrauens-Indikator), D2, D3.
