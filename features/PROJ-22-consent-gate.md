# PROJ-22: Consent-Gate (bewusste Einwilligung)

## Status: Planned

**Erstellt:** 2026-05-30
**Zuletzt aktualisiert:** 2026-05-30

## Abhängigkeiten

- Keine

## User Stories

- Als Anwender möchte ich, **bevor** meine Eingaben verarbeitet werden, klar und verständlich erfahren, was verarbeitet wird und wozu, damit ich bewusst entscheiden kann.
- Als Anwender möchte ich erfahren, dass meine Daten zu Trainingszwecken (Daten-Schwungrad) verwendet werden können, damit ich nicht überrascht werde.
- Als Anwender möchte ich die Einwilligung **ablehnen** und die App trotzdem in sinnvollem Umfang nutzen können, damit ich nicht zur Datenfreigabe gedrängt werde.
- Als Anwender möchte ich eine erteilte Einwilligung später **widerrufen** können, damit ich die Kontrolle über meine Daten behalte.
- Als datenschutzbewusster Anwender möchte ich, dass die App ohne meine bewusste Zustimmung keine Verarbeitung startet, damit „warnen statt sperren" auch beim Datenschutz mit echter Wahl beginnt.

## Akzeptanzkriterien

- [ ] Vor der ersten Datenverarbeitung im Vorgang zeigt der `lotse` ein Einwilligungs-Gate an, das den weiteren Ablauf bis zur Entscheidung blockiert.
- [ ] Der Einwilligungstext benennt verständlich, **was** verarbeitet wird, **wozu**, und **dass** Daten zu Trainingszwecken genutzt werden können.
- [ ] Der Anwender kann die Einwilligung mit einer klaren, bewussten Aktion **erteilen** (keine Vorab-Auswahl, kein automatisches Akzeptieren durch Wegklicken).
- [ ] Der Anwender kann die Einwilligung **ablehnen**, ohne den Vorgang abbrechen zu müssen.
- [ ] Bei Ablehnung bleibt die App in sinnvollem Umfang nutzbar; die Konsequenz der Ablehnung wird transparent angezeigt.
- [ ] Der Consent-Status (erteilt / abgelehnt) wird im Vorgang über das Protokoll festgehalten und bei Rollen-Übergaben mitgeführt.
- [ ] Ist bereits ein gültiger Consent-Status gesetzt, wird das Gate nicht erneut angezeigt.
- [ ] Der Anwender kann eine erteilte Einwilligung jederzeit **widerrufen**; der Status wechselt nachvollziehbar auf „abgelehnt/widerrufen".
- [ ] Das Gate verweist erkennbar auf die separate Datenschutz-Umsetzung (PROJ-23), ohne deren Inhalte hier auszuführen.
- [ ] Die Entscheidung des Anwenders (Zustimmung, Ablehnung, Widerruf) wird mit Zeitpunkt protokolliert, sodass sie später belegbar ist.

## Edge Cases

- **Was, wenn der Anwender die Einwilligung ablehnt?** → Der Vorgang läuft in sinnvollem Umfang weiter; die App teilt transparent mit, welche Funktion bzw. welcher Mehrwert (z. B. Beitrag zum Daten-Schwungrad) dadurch entfällt — ohne den Nutzer zu sperren.
- **Was, wenn der Anwender die Einwilligung weder erteilt noch ablehnt (Gate ignoriert/wegklickt)?** → Es gilt als „nicht eingewilligt"; ohne bewusste Entscheidung startet keine über das Nötigste hinausgehende Verarbeitung.
- **Was, wenn der Anwender mitten im Vorgang widerruft?** → Ab dem Widerruf gilt der neue Status; bereits begonnene Schritte bleiben nutzbar, aber kein weiterer Beitrag zum Trainings-/Schwungrad-Zweck erfolgt.
- **Was, wenn unklar ist, ob das Gate dieselbe rechtliche Wirkung wie eine DSGVO-Einwilligung hat?** → Dieses Feature liefert ausschließlich das bewusste Einwilligungs-Gate im Nutzerfluss; die Rechtsgrundlage und die belastbare Ausgestaltung sind Sache von PROJ-23.
- **Was, wenn das Gate den Eindruck erweckt, es regle bereits die Anonymisierung?** → Der Text bleibt auf die bewusste Einwilligung beschränkt und verweist für Anonymisierung/Schwungrad-Verfahren explizit auf PROJ-23.

## Technische Anforderungen

- Das Consent-Gate ist Verantwortung der Rolle `lotse` (Orchestrierung) und wird vor der inhaltlichen Verarbeitung im Nutzerfluss platziert.
- Der Consent-Status wird über das Protokoll als gemeinsamer Vorgangs-Zustand geführt.
- Strikt abgegrenzt: Die tatsächliche Anonymisierung, das Daten-Schwungrad-Verfahren und die Rechtsgrundlage sind **nicht** Teil dieses Features (siehe PROJ-23, nur referenziert).

## Tech Design (Solution Architect)

_Wird von /architecture hinzugefügt_

## QA Test Results

_Wird von /qa hinzugefügt_

## Deployment

_Wird von /deploy hinzugefügt_
