# PROJ-18: Rollen-/Agenten-Architektur mit Orchestrierung durch den Lotsen

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- PROJ-9 (Vorgangs-Persistenz) — das Protokoll ist der gemeinsame Vorgangs-Zustand, über den die Rollen lesen/schreiben

## Kontext

Heute ist die App-KI ein Monolith: Eine einzelne, hartcodierte Happy-Path-Statemachine
im Frontend treibt den Ablauf, und **ein** OpenAI-Prompt erzeugt das gesamte Ergebnis
(Diagnose, Ampel, Empfehlung) auf einmal. Es gibt keine echte Orchestrierung, kein
Routing und keine einzeln prüfbaren Bausteine.

D19 zerlegt diese KI-Funktionalität in spezialisierte **App-Laufzeit-Rollen**, gegliedert
in fünf Klassen (Orchestrierung, Journey-Schritt, Alternativpfad, Querschnittsdienst,
Back-Office). Der `lotse` (Klasse Orchestrierung) steuert den Vorgang zielgerichtet, ruft
die Fach-Rollen in passender Reihenfolge und bietet dem Nutzer jederzeit eine vorzeitige
Empfehlung oder einen Abbruch an. Das Protokoll dient als gemeinsamer Zustands-Bus.

**Strikt Single-Responsibility — Abgrenzung dieses Features:** Dieses Feature liefert
**nur** die Orchestrierungs- und Zerlegungs-Mechanik: den `lotse` als Steuerung, das
Routing/den Handoff-Graphen zwischen Rollen, das Aufrufen einzeln prüfbarer Rollen-
Bausteine und das Lesen/Schreiben über das Protokoll. Die **fachlichen Inhalte** der
einzelnen Rollen (`diagnose`, `bewertung`, `abwaegung`, `vermittlung`, …) sind **je eigene
Features** und werden hier ausschließlich als orchestrierte, austauschbare Bausteine
behandelt — ihr inneres Verhalten ist nicht Gegenstand dieser Spec. Der konkrete Consent-
Flow und die Anonymisierung sind ebenfalls ein eigenes Feature (PROJ-22); hier wird das
Consent-Gate nur als Routing-Station des `lotse` referenziert.

## User Stories

1. **Als Nutzer** möchte ich, dass mich die App zielgerichtet von der Problemaufnahme bis
   zur Wirkung führt und an jedem Punkt selbst entscheiden kann, ob ich weitermache, einen
   anderen Pfad wähle oder abbreche — damit ich nie das Gefühl habe, in einem starren
   Ablauf gefangen zu sein.

2. **Als Nutzer** möchte ich an jedem Punkt eine vorzeitige Empfehlung oder einen sicheren
   Abbruch zur Fachkraft angeboten bekommen — damit ich auch dann gut versorgt bin, wenn
   mein Fall zu heikel oder zu unklar wird.

3. **Als Entwickler** möchte ich jede Fach-Rolle als getrennten, einzeln aufrufbaren und
   prüfbaren Baustein ansprechen können, statt eines alles-auf-einmal-Prompts — damit ich
   einzelne Rollen unabhängig testen, austauschen und verbessern kann.

4. **Als Entwickler** möchte ich, dass der `lotse` das Routing zwischen den Rollen anhand
   des Vorgangsstands entscheidet und alle Rollen ihren Zustand ausschließlich über das
   Protokoll austauschen — damit der Ablauf nachvollziehbar, erweiterbar und vom UI-Code
   entkoppelt ist.

5. **Als Produktverantwortlicher** möchte ich, dass jede vom `lotse` getroffene
   Routing-/Abbruch-/Wechsel-Entscheidung im Protokoll festgehalten wird — damit der
   Vorgangsverlauf transparent und auditierbar bleibt.

## Akzeptanzkriterien

- [ ] Der `lotse` ist der Einstiegspunkt jedes Vorgangs und ermittelt aus dem
      Vorgangsstand die jeweils nächste aufzurufende Fach-Rolle (Routing).
- [ ] Jede Fach-Rolle ist als eigener, einzeln aufrufbarer Baustein ansprechbar; kein
      einzelner Aufruf erzeugt mehr das gesamte Ergebnis (Diagnose + Ampel + Empfehlung) auf
      einmal.
- [ ] Der Handoff-Graph entspricht dem Konzept: `aufnahme` → `diagnose` → `bewertung` →
      `abwaegung`; aus `abwaegung` je nach Empfehlung nach `begleitung`, `produktsuche` oder
      `entsorgung`; alle Pfade enden in `wirkung`.
- [ ] Die Querschnittsdienste (`recherche`, `vermittlung`, `beschaffung`, `protokoll`)
      werden bedarfsgesteuert aufgerufen, ohne den sequenziellen Journey-Handoff zu verlassen.
- [ ] Alle Rollen lesen ihren Eingangszustand aus dem Protokoll und schreiben ihre
      Ergebnisse ins Protokoll zurück; es gibt keinen Rollen-zu-Rollen-Zustand außerhalb des
      Protokolls.
- [ ] Der `lotse` bietet an jedem Journey-Punkt Steueroptionen an: weitermachen · Profi/Café
      · Austausch · entsorgen · abbrechen.
- [ ] Der `lotse` kann eine **vorzeitige Empfehlung** aussprechen bzw. den Vorgang
      **abbrechen** und führt den Misserfolgs-/Abbruch-Pfad sicher zur Fachkraft (ermutigende
      Rahmung statt Sackgasse).
- [ ] Jede Routing-Entscheidung, jeder Pfadwechsel und jeder Abbruch des `lotse` wird im
      Protokoll als nachvollziehbarer Eintrag festgehalten.
- [ ] Liefert eine aufgerufene Rolle kein verwertbares Ergebnis, übernimmt der `lotse` die
      Kontrolle zurück und entscheidet über einen Alternativweg (Wiederholung, anderer Pfad
      oder vorzeitige Empfehlung) — der Vorgang bleibt jederzeit handlungsfähig.
- [ ] Das Consent-Gate ist als Routing-Station des `lotse` vorgesehen (Aufruf vor einem
      Schwungrad-Beitrag); die fachliche Umsetzung des Consent-Flows ist an PROJ-22 delegiert
      und hier nur referenziert.
- [ ] Der `lotse` steuert ausschließlich **prozedural** (Reihenfolge, Wechsel, Abbruch) und
      trifft keine inhaltlichen Pfad- oder Sicherheits-Entscheidungen (diese liefern
      `abwaegung` bzw. `bewertung`).
- [ ] Ein bestehender oder unterbrochener Vorgang kann anhand seines im Protokoll
      gespeicherten Stands vom `lotse` an der korrekten Stelle fortgesetzt werden.

## Edge Cases

- **Eine aufgerufene Fach-Rolle liefert kein (verwertbares) Ergebnis — was passiert?**
  Der `lotse` erhält die Kontrolle zurück, vermerkt das ergebnislose Resultat im Protokoll
  und entscheidet prozedural über das weitere Vorgehen (erneuter Versuch, alternative Rolle
  oder vorzeitige Empfehlung zur Fachkraft). Der Vorgang läuft nie ins Leere.

- **Der ermittelte Vorgangsstand erlaubt mehrere mögliche nächste Rollen (Routing-Konflikt)
  — wie wird aufgelöst?** Der `lotse` wendet eine deterministische, dokumentierte
  Vorrang-Regel des Handoff-Graphen an und protokolliert die getroffene Wahl samt Grund;
  bei echter Mehrdeutigkeit fragt er den Nutzer über die Steueroptionen, statt stillschweigend
  zu raten.

- **Der Nutzer fordert mitten in einem Schritt einen vorzeitigen Abbruch oder eine
  Empfehlung — bricht der laufende Rollen-Aufruf alles ab?** Nein. Der `lotse` nimmt den
  Wunsch entgegen, beendet den aktuellen Schritt sauber, hält den Stand im Protokoll fest und
  routet auf den Abbruch-/Empfehlungs-Pfad (Profi/Café) mit ermutigender Rahmung — der bis
  dahin erfasste Vorgang bleibt vollständig nutzbar.

- **Ein Schwungrad-Beitrag steht an, aber das Consent-Gate ist noch nicht passiert — was
  tut der `lotse`?** Er routet zwingend zuerst über die Consent-Station (PROJ-22), bevor
  irgendein anonymisierter Vorgang weitergegeben wird; ohne erteilte Einwilligung unterbleibt
  der Beitrag, der reguläre Reparaturpfad läuft aber ungehindert weiter.

- **Der Nutzer wechselt mitten in der Journey den Pfad (z. B. von `begleitung` zurück zur
  `abwaegung`) — geht der bisherige Stand verloren?** Nein. Der `lotse` behandelt den Wechsel
  als reguläres Routing, der bestehende Vorgangs-Zustand im Protokoll bleibt erhalten, und der
  Pfadwechsel wird als eigener Protokoll-Eintrag festgehalten.

## Technische Anforderungen

- Stack: **Flask (Backend) + Vanilla-JS (Frontend)** — der bisher im Frontend hartcodierte
  Happy-Path weicht einer serverseitig orchestrierten Rollen-Steuerung.
- Der `lotse` und die Fach-Rollen sind als getrennte, einzeln testbare Bausteine zu
  realisieren (je Rolle eigener Aufrufpfad statt eines Sammel-Prompts).
- Das Protokoll (PROJ-9) ist die einzige Quelle des geteilten Vorgangs-Zustands; das
  Routing entscheidet allein anhand dieses Zustands.
- Der Handoff-Graph ist explizit und prüfbar zu hinterlegen (geschlossen, alle Journey-Pfade
  enden in `wirkung`).
- Robustheit: kein Rollen-Aufruf darf den Vorgang in einen nicht handhabbaren Zustand
  führen — der `lotse` bleibt immer letzte steuernde Instanz.

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
