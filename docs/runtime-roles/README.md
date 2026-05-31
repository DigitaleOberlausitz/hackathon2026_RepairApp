# App-Laufzeit-Rollen

Dieses Verzeichnis spezifiziert die **App-Laufzeit-Rollen** der Reparatur-App: die
spezialisierten KI-Fähigkeiten, die den **Endnutzer** durch seinen Reparaturfall führen.
Jede Datei beschreibt **eine** eng umrissene Rolle.

> **Abgrenzung — andere Ebene als die Workflow-Skills.** Diese Dateien sind
> *Produkt-Spezifikationen* (Verhalten der App gegenüber dem Endnutzer), **nicht** die
> Entwickler-Workflow-Skills (`requirements`, `architecture`, `frontend`, `backend`, `qa`,
> `deploy`), die nur das *Bauen* der App steuern. Später bilden sie die Grundlage der
> LLM-Orchestrierung im Backend.
>
> **Quelle der Wahrheit = dieses Verzeichnis.** Die Rollen sind zusätzlich als
> projekt-lokale Claude-Code-Skills unter `.claude/skills/<rolle>/SKILL.md` abgelegt
> (inhaltsgleiche, abgeleitete Kopien, per Slash-Command aufruf-/testbar). Maßgeblich für
> Änderungen bleiben die `*.md` hier — die Skill-Kopien danach nachziehen (sonst Drift).

Maßgeblich bleibt `../konzept.adoc` (Abschnitt *Rollen-/Agenten-Architektur*, D19).

## Die fünf Klassen

| Klasse | Rollen |
|---|---|
| **Orchestrierung** | [`lotse`](lotse.md) |
| **Journey-Schritt** | [`aufnahme`](aufnahme.md) → [`diagnose`](diagnose.md) → [`bewertung`](bewertung.md) → [`abwaegung`](abwaegung.md) → [`begleitung`](begleitung.md) → [`wirkung`](wirkung.md) |
| **Alternativpfad** | [`produktsuche`](produktsuche.md), [`entsorgung`](entsorgung.md) |
| **Querschnittsdienst** | [`recherche`](recherche.md), [`vermittlung`](vermittlung.md), [`beschaffung`](beschaffung.md), [`protokoll`](protokoll.md) |
| **Back-Office** | [`wissensbasis`](wissensbasis.md) |

## Querschnitts-Prinzip: Vertrauens-Indikator (D3)

Der **Vertrauens-Indikator** ist *keine Rolle*, sondern ein verbindliches Prinzip: Jede
KI-Aussage (`diagnose`, `bewertung`, `abwaegung`) trägt **Konfidenz + Begründung**,
eskalierend mit der Kritikalität; der Hinweis „die KI kann Fehler machen" erscheint
immer. `protokoll` hält diese Angaben fest.

## Protokoll als gemeinsamer Vorgangs-Zustand

Das [`protokoll`](protokoll.md) ist der **Zustands-Bus** des Vorgangs: Jede Rolle liest
aus dem laufenden Vorgang und schreibt ihre Erkenntnisse zurück. Die `## Kontrakt
(fachlich)`-Abschnitte der Rollen beschreiben — *fachlich, ohne Datenmodell* — was eine
Rolle aus dem Vorgang liest und hineinschreibt.

## Handoff-Graph (geschlossen)

```
lotse ─(Einstieg)→ aufnahme → diagnose → bewertung → abwaegung ┬→ begleitung ─┐
                                                               ├→ produktsuche ┼→ wirkung → (Ende)
                                                               └→ entsorgung ──┘
Querschnitt (genutzt, kein Journey-Handoff):
  recherche   ← diagnose, bewertung, abwaegung
  vermittlung ← bewertung (Profi/Café), abwaegung
  beschaffung ← begleitung, abwaegung
  protokoll   ← alle (liest/schreibt)
  wissensbasis → speist recherche/diagnose (Back-Office)
```

## Dateistruktur je Rolle

`## Rolle` → `## Verantwortung (nur dies)` → `## Grenzt sich ab gegen` →
`## Kontrakt (fachlich)` → `## Vorgehen` → `## Übergabe` → `## Konzept-Anker`.
