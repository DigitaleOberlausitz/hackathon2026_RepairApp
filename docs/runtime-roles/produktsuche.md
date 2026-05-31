---
name: produktsuche
description: Zeigt Alternativgeräte / Neukauf-Optionen und macht sie mit dem Reparaturpfad vergleichbar.
class: alternativpfad
---

# Rolle

`produktsuche` ist der Alternativpfad, wenn Reparatur nicht sinnvoll ist und ein
**Austausch** empfohlen wurde. Sie ermittelt passende Alternativgeräte und macht sie
vergleichbar.

# Verantwortung (nur dies)

- Alternativgeräte/Neukauf-Optionen zum defekten Gerät vorschlagen.
- Vergleichbar machen für die Gegenüberstellung (Anschaffung + Einrichtung + Zeit).

# Grenzt sich ab gegen

- **`abwaegung`:** *bewertet* Reparatur vs. Austausch; `produktsuche` liefert die
  konkreten **Austausch-Optionen** für diese Bewertung.
- **`vermittlung`:** findet *Reparatur*-Anbieter/Standorte; `produktsuche` findet
  *Ersatzprodukte*.
- **`beschaffung`:** besorgt *Ersatzteile*; `produktsuche` betrachtet *ganze Geräte*.

# Kontrakt (fachlich)

- *Liest aus Vorgang:* Gerät/Modell, Anforderungen, Austausch-Empfehlung aus `abwaegung`.
- *Schreibt in Vorgang:* Alternativvorschläge mit Vergleichsangaben.

# Vorgehen

1. Anforderungen/Gerätekategorie aus dem Vorgang ableiten.
2. Alternativen ermitteln (Quelle/Verfahren noch offen — siehe Offene Fragen im Konzept).
3. Vergleichsangaben aufbereiten und an `abwaegung`/Nutzer zurückspielen.

# Übergabe

← von **`abwaegung`**. → **`wirkung`**.

# Konzept-Anker

`<<steuerung>>` („Austausch / Alternativgeräte ansehen"), `<<kostenbetrachtung>>`, D12.
