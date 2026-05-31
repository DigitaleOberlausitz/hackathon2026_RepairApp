# Nutzerflow Reparatur-App
> *Last updated: 31.5.2026, 10:53:09*

**You** *(31.5.2026, 10:51:12)*

Generiere mir einen Nutzerflow für eine Reparatur-App, die mich dabei unterstützt, zu diagnostizieren, was an meinem technischen Geräte kaputt ist, ob sich eine Reparatur lohnt und wo ich kostengünstig entweder Materialien und Anleitung eine Selbstreparatur herbekomme oder auch vielleicht kostengünstig an jemand Freiwilligen delegieren kann.

---

**ChatGPT** *(31.5.2026, 10:51:12)*

**Hinweis:** Ergebnisse dieses GPT sind textbasiert & durch ChatGPT limitiert. Für professionelle Diagramme empfehle ich **[Creately](https://try.creately.com/?aff=hassan)** – dort kannst du Flowcharts, Infografiken, Mindmaps, Diagramme u.v.m. erstellen.

Damit ich einen präzisen Nutzerflow erstellen kann, brauche ich kurz:

1. Mobile App, Web-App oder beides?
2. Welche Geräte? (Smartphones, Laptops, Haushaltsgeräte, Konsolen etc.)
3. Soll KI die Fehlerdiagnose übernehmen?
4. Nur Deutschland oder international?
5. Freiwillige Helfer (Community) oder auch professionelle Reparaturdienste?
6. Soll die App Reparaturkosten mit dem Gerätewert vergleichen?
7. Möchtest du einen High-Level-Flow oder einen detaillierten Screen-by-Screen-Flow?

Bitte kurz beantworten, dann erstelle ich den kompletten Nutzerflow.

---

**You** *(31.5.2026, 10:52:57)*

zu 1.) Web-App. zu 2.) Smartphones, Haushaltgeräte, zu 3.) ja, zu 4.) nur Deutschland,  zu 5.) nur Freiwillige, zu 6.) ja. zu 7.) detailliert

---

**ChatGPT** *(31.5.2026, 10:52:57)*

**Hinweis:** Ergebnisse dieses GPT sind textbasiert & durch ChatGPT limitiert. Für professionelle Diagramme empfehle ich **[Creately](https://try.creately.com/?aff=hassan)** – dort kannst du Flowcharts, Infografiken, Mindmaps, Diagramme u.v.m. erstellen.

# Nutzerflow – Reparatur-App (Web-App)

```text
START
  │
  ▼
Landingpage
  │
  ├─ Anmeldung / Login
  │
  ▼
Dashboard
  │
  ├─ Neues Gerät diagnostizieren
  ├─ Meine Reparaturen
  ├─ Helfer finden
  └─ Reparaturhistorie
  │
  ▼
Gerät erfassen
  │
  ├─ Kategorie wählen
  │    ├ Smartphone
  │    └ Haushaltsgerät
  │
  ├ Hersteller wählen
  ├ Modell auswählen
  ├ Alter des Geräts
  └ Kaufpreis (optional)
  │
  ▼
Problem beschreiben
  │
  ├ Textbeschreibung
  ├ Fehlercode eingeben
  ├ Bilder hochladen
  ├ Video hochladen
  └ Symptome auswählen
  │
  ▼
KI-Diagnose
  │
  ├ Wahrscheinliche Fehlerursachen
  ├ Vertrauensscore
  ├ Geschätzte Reparaturdauer
  └ Reparaturschwierigkeit
  │
  ▼
Reparatur-Wirtschaftlichkeit
  │
  ├ Zeitwert Gerät ermitteln
  ├ Ersatzteilkosten schätzen
  ├ Werkzeugkosten schätzen
  ├ Reparaturaufwand berechnen
  │
  ├ Entscheidung:
  │
  ├ Reparatur lohnt sich
  │        ▼
  │
  └ Reparatur lohnt sich nicht
           ▼
      Recycling /
      Weiterverkauf /
      Ersatzgerät-Empfehlungen
```

# Flow „Reparatur lohnt sich“

```text
Reparatur lohnt sich
  │
  ▼
Reparaturoption wählen
  │
  ├ Selbst reparieren
  └ Freiwilligen Helfer finden
```

## A) Selbstreparatur

```text
Selbst reparieren
  │
  ▼
Anleitung anzeigen
  │
  ├ Schritt-für-Schritt Guide
  ├ Bilder
  ├ Videos
  ├ Sicherheitswarnungen
  └ Werkzeugliste
  │
  ▼
Ersatzteile finden
  │
  ├ Preisvergleich
  ├ Gebrauchtteile
  ├ Refurbished Teile
  └ Lieferzeiten
  │
  ▼
Bestellen
  │
  ▼
Reparatur durchführen
  │
  ▼
Erfolg?
  │
  ├ Ja → Reparatur abgeschlossen
  │
  └ Nein
       ▼
    Helfer suchen
```

## B) Freiwilligen Helfer finden

```text
Freiwilligen Helfer finden
  │
  ▼
Standort eingeben
  │
  ▼
Karte anzeigen
  │
  ├ Repair-Cafés
  ├ Ehrenamtliche Bastler
  ├ Community-Mitglieder
  └ Technik-Vereine
  │
  ▼
Profile ansehen
  │
  ├ Erfahrung
  ├ Bewertungen
  ├ Erfolgsquote
  └ Verfügbarkeit
  │
  ▼
Anfrage senden
  │
  ▼
Chat starten
  │
  ▼
Termin vereinbaren
  │
  ▼
Reparatur durchgeführt
  │
  ▼
Bewertung abgeben
```

# Wichtige Screens

1. Dashboard
2. Geräte-Erfassung
3. Fehlerbeschreibung
4. KI-Diagnose
5. Wirtschaftlichkeitsanalyse
6. DIY-Anleitung
7. Ersatzteil-Marktplatz
8. Helfer-Suche (Karte)
9. Chat & Terminplanung
10. Reparatur-Erfolg & Bewertung

# KI-Features

- Bildanalyse von Schäden
- Fehlercode-Erkennung
- Prognose der Reparaturwahrscheinlichkeit
- Wirtschaftlichkeits-Score (0–100)
- Automatische Ersatzteilsuche
- Matching mit passenden Freiwilligen
- Betrugserkennung bei Community-Profilen
- Lernendes Diagnosemodell basierend auf erfolgreichen Reparaturen

# Zentrale User Journey

```text
Gerät auswählen
→ Problem beschreiben
→ KI-Diagnose
→ Kosten-Nutzen-Bewertung
→ Selbst reparieren ODER Helfer finden
→ Reparatur durchführen
→ Erfolg dokumentieren
→ Community bewerten
```

---