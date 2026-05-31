# PROJ-32: Rollen-Registry & Progressive Disclosure

## Status: Planned

**Erstellt:** 2026-05-31
**Zuletzt aktualisiert:** 2026-05-31

## Abhängigkeiten

- Keine (Fundament der Orchestrierungs-Architektur)
- Liefert die Basis für: PROJ-34 (Daten-Tools), PROJ-35 (Orchestrator-Schleife)
- Fachlicher Bezug: PROJ-18 (Rollen-/Agenten-Architektur, D19) — setzt deren Idee technisch um

## Beschreibung

Die 14 Laufzeit-Rollen aus `docs/runtime-roles/*.md` werden zur Laufzeit als ladbare
Bausteine verfügbar gemacht — analog zu „Skills" in Claude Code. Das Modell sieht zuerst
nur einen kompakten **Katalog** (Name + Kurzbeschreibung + Klasse jeder Rolle) und lädt
den **Volltext** einer Rolle erst **on demand** nach (Progressive Disclosure). Das gesamte
fachliche Wissen bleibt in den `.md`-Dateien, nicht im Code.

## User Stories

- Als Orchestrator (KI) möchte ich einen kompakten Katalog aller verfügbaren Rollen sehen, damit ich die passende Rolle auswählen kann, ohne dass alle Volltexte den Kontext fluten.
- Als Orchestrator möchte ich den vollständigen Spezifikationstext einer Rolle gezielt nachladen können, damit ich ihrer Anleitung genau folgen kann, sobald ich sie brauche.
- Als Entwickler möchte ich, dass eine geänderte Rollen-`.md` ohne Neustart wirksam wird, damit ich Rollen-Inhalte iterativ pflegen kann.
- Als Betreiber möchte ich, dass das Nachladen einer Rolle keine wiederholte Disk-I/O pro Anfrage verursacht, damit die App performant bleibt.
- Als Sicherheits-Verantwortlicher möchte ich, dass nur bekannte, im Katalog gelistete Rollen ladbar sind, damit kein beliebiger Dateizugriff über den Rollennamen möglich ist.

## Akzeptanzkriterien

- [ ] Ein Katalog-Abruf liefert für alle 14 Rollen je `name`, `description` und `class` aus dem Frontmatter der jeweiligen `.md`.
- [ ] Der Katalog enthält ausschließlich Rollen aus `docs/runtime-roles/` und schließt `README.md` aus.
- [ ] Das Laden einer Rolle liefert deren vollständigen Body **ohne** das Frontmatter (`---`-Block).
- [ ] Das Laden einer unbekannten Rolle (nicht im Katalog) führt zu einem definierten Fehler und greift auf keine Datei außerhalb von `docs/runtime-roles/` zu (keine Path-Traversal).
- [ ] Die Katalog-Reihenfolge ist deterministisch (stabil sortiert), sodass ein daraus gebauter Prompt-Präfix über Aufrufe byte-identisch bleibt.
- [ ] Wird eine Rollen-`.md` nach dem ersten Laden geändert, liefert der nächste Abruf den aktualisierten Inhalt (Reload anhand der Datei-Änderungszeit), ohne App-Neustart.
- [ ] Wiederholte Abrufe derselben unveränderten Rolle lesen die Datei nicht erneut von der Platte (In-Memory-Cache).
- [ ] Der Pfad zu `docs/runtime-roles/` wird paket-relativ aus dem Dateilayout abgeleitet, nicht über `.env` konfiguriert (konsistent mit `DB_PATH`/`MEDIA_DIR`).

## Edge Cases

- **Rollen-`.md` ohne gültiges Frontmatter** — Es darf nicht hart scheitern; Body wird als Ganzes geliefert, `name` fällt auf den Dateinamen zurück, `description`/`class` bleiben leer.
- **Unbekannter / manipulierter Rollenname** (z. B. `../../etc/passwd`) — Wird abgewiesen (nur Whitelist aus dem Katalog), kein Dateizugriff außerhalb des Rollen-Verzeichnisses.
- **Datei während des Betriebs gelöscht** — Folge-Abruf liefert den definierten „unbekannt"-Fehler statt einer Exception, der Katalog enthält die Rolle nicht mehr.
- **Gleichzeitige Anfragen während eines Reloads** — Der Cache-Zugriff ist thread-sicher; kein halb geladener Zustand wird ausgeliefert.
- **Neue Rolle wird hinzugefügt** — Sie erscheint nach dem nächsten Katalog-Abruf automatisch, ohne Code-Änderung.

## Technische Anforderungen (optional)

- Neues Modul `webapp/repair/roles.py` (Frontmatter-Parser, `katalog()`, `lade_rolle(name)`, mtime-basierter In-Memory-Cache).
- Quelle der Wahrheit: `docs/runtime-roles/*.md`; abgeleitete Kopien `.claude/skills/<rolle>/SKILL.md` bei Inhaltsänderungen nachziehen (Drift-Hinweis, CLAUDE.md).
- Konzept-Anker: D19 (`docs/konzept.adoc`, Rollen-/Agenten-Architektur).
- Design-Referenz: `docs/superpowers/specs/2026-05-31-llm-orchestrierung-runtime-roles-design.md` §3.1.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
