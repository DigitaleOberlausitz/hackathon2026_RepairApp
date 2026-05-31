---
name: aufnahme
description: Universelle, sichere Problemaufnahme (Schicht A / Triage) — nimmt jedes Problem strukturiert und multimodal auf.
class: journey
---

# Rolle

`aufnahme` ist der erste Fall-Schritt: die **universelle Triage (Schicht A)**. Sie nimmt
das Problem für *jedes* Gerät auf — auch sicherheitskritisches — denn strukturierte
Fragen verletzen niemanden. Sie ist immer verfügbar und immer sicher.

# Verantwortung (nur dies)

- Geführte Problemaufnahme: Symptom, Bedingungen, „seit wann / zuletzt verändert", was
  bereits getestet wurde, Vermutung.
- **Multimodale Erfassung** als eigener Aspekt: Text/geführte Fragen (Basis), Foto/Video
  (Gerät, Defekt, Typenschild), Sprache/Voice, Barcode/Modell-Scan.
- **Eigentum klären (D14):** Ist der Nutzer nicht der Eigentümer, Eigentümer und
  Kostenträger erfassen.
- **Gerätekategorie füllen:** `kategorie` in der `aufnahme`-Karte immer setzen — sie ist
  die Weiche für den Datenschutz-Schutzschritt (D23).
- **Datentragende Geräte erkennen (D23):** Bei Laptop/Smartphone/Tablet (und ähnlichen
  datentragenden Geräten) vor einer Fremdabgabe den Schutzschritt „Backup + Daten löschen
  + Konten abmelden" anstoßen — siehe `protokoll`.
- **Tagebuch-Wiedererkennung:** prüfen, ob für dieses Gerät schon ein Vorgang existiert
  („Dieser Fehler war schon mal da").

# Grenzt sich ab gegen

- **`diagnose`:** `aufnahme` *sammelt* die Beobachtungen; sie schließt **nicht** auf die
  Ursache — das tut `diagnose`.
- **`protokoll`:** `aufnahme` *liefert* die Inhalte; das Anlegen/Verwalten des
  Vorgangs-Zustands besorgt `protokoll`.

# Kontrakt (fachlich)

- *Liest aus Vorgang:* freie Erstbeschreibung; ggf. früherer Geräteverlauf (Tagebuch).
- *Schreibt in Vorgang:* strukturierte Symptomaufnahme, Gerätekategorie/Modell,
  Medien-Anhänge, Eigentums-/Kostenträger-Angabe.

# Vorgehen

1. Freie Schilderung aufnehmen; passende Eingabe-Wege anbieten (Foto/Voice/Barcode).
2. Gerät identifizieren (Kategorie/Modell, ggf. via Scan); `kategorie` in der Karte füllen.
   Bei datentragenden Geräten (Laptop/Smartphone/Tablet) den Schutzschritt „Backup + Daten
   löschen + Konten abmelden" vor Fremdabgabe vormerken (D23).
3. Geführte Fragen stellen (Symptom, Bedingungen, Historie, bereits Getestetes).
4. Eigentum/Kostenträger klären, falls Nutzer ≠ Eigentümer (D14).
5. Tagebuch prüfen und Relevantes anbinden.

# Übergabe

→ **`diagnose`** (mit der strukturierten Aufnahme). Schreibt durchgehend über
**`protokoll`**. Einstieg erfolgt durch **`lotse`**.

# Konzept-Anker

Schicht A (`<<protokoll>>`, „Zwei Schichten"), Eingabe-Wege (D9), D6, D14, D23.
