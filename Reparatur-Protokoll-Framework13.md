# Reparatur-Protokoll

**Gerät:** Framework 13 (Laptop, DIY-Edition – selbst zusammengebaut)
**Vorgang:** „Plötzlich tot – keine Lade-LED"
**Ergebnis:** Misserfolgs-Pfad (DIY) → Verdacht Mainboard-Frühausfall → **RMA in Garantie**
**Durchlaufene Rollen:** Lotse → Aufnahme → Diagnose → Bewertung → Abwägung → Begleitung → Wirkung

---

## 1 · Aufnahme (Triage / Schicht A)

| Feld | Eintrag |
|---|---|
| Gerät | Framework 13, **DIY-Edition** (selbst gebaut) |
| Symptom | Plötzlich im Betrieb ausgegangen → danach **komplett tot** (keine LED, kein Lüfter, kein Display) |
| Stromversorgung | Netzteil eingesteckt, **Ladeleuchte leuchtet NICHT** |
| Seit wann | Gerät neu in Betrieb genommen, lief zunächst einwandfrei |
| Vorgeschichte | **Nichts verändert** vor dem Ausfall (kein Einbau, kein Update, kein Stoß/Hitze/Flüssigkeit) |
| Power-Button | **Keine Reaktion** |
| Eigentum (D14) | Nutzer = Eigentümer |
| Sicherheitslage | Niederspannung/Akku – keine gefährliche Hochspannung, Aufnahme unbedenklich |

---

## 2 · Diagnose (Symptom → Ursache, mit Konfidenz nach D3)

| # | Ursachen-Kandidat | Konfidenz | Herkunft | Status nach Tests |
|---|---|---|---|---|
| 2 | Lockerer RAM-Riegel / Akku-Stecker (DIY) | mittel–hoch | kuratiert | geprüft (Reseat) – erfolglos |
| 1 | Eingerasteter Schutzzustand → Mainboard-Vollreset nötig | mittel | kuratiert | geprüft (Vollreset) – erfolglos |
| 3 | Externer Ladepfad (Netzteil/Port/Kabel) | niedrig | kuratiert | weitgehend ausgeschlossen |
| 4 | **Mainboard-Defekt (z. B. Schutzsicherung)** | niedrig–mittel → **führend** | KI-Eigenrecherche (gekennzeichnet) | **wahrscheinlichste verbleibende Ursache** |

**Kernbefund:** „Plötzlich tot + keine Lade-LED" = Strom-/Power-Pfad-Muster, **kein** Software-Problem.

---

## 3 · Bewertung (Warn-Ampel)

| Achse | Stufe | Begründung |
|---|---|---|
| Sicherheit (Risiko) | 🟢 grün | Reine Niederspannung, kein 230 V im Gerät; Akku-Stecker-Trennen vorgesehen. Hinweise: Netzteil trennen, ESD vermeiden |
| Komplexität (Aufwand) | 🟢 grün | Framework für Reparatur konstruiert; mitgelieferter Schraubendreher, captive Schrauben |
| Kostenaufwand | 🟢 grün | Reseat + Reset = 0 €; Mainboard-Fall über Garantie abgedeckt |
| Machbarkeit | 🟢 grün | Bestes Reparierbarkeits-Rating, Teile einzeln verfügbar |

**Empfehlung:** 🟢 Selbst machen (Reseat + Vollreset); Misserfolg → Garantie/RMA.
**Garantie-Gate:** Öffnen / RAM-Reseat / Akku-Stecker-Trennen heben die Garantie bei Framework **nicht** auf.
**Haftungshinweis (D16):** Hilfestellung, keine Garantie; eigenverantwortliches Handeln.

---

## 4 · Abwägung (Pfadvergleich)

Gerät fabrikneu + bestens reparierbar → **Reparatur klar vor Austausch/Entsorgung**, mit **Garantie/RMA als Auffangnetz**. Austausch/Neukauf/Entsorgung nicht sinnvoll.

---

## 5 · Begleitung (durchgeführte Schritte, Schicht B)

1. Netzteil getrennt, ESD beachtet, Erweiterungskarten entfernt
2. Bodenschrauben gelöst, Input-Cover abgehoben (Flachbandkabel beachtet)
3. **RAM neu gesetzt** (beide Riegel bis Klick eingerastet)
4. **Mainboard-Vollreset:** Akku-Stecker getrennt, Power-Button 10–30 s gehalten, Akku wieder verbunden
5. Zusammengebaut, Netzteil eingesteckt, getestet

**Bereits vor der Begleitung getestet:** mehrere USB-C-Ports, zweites Netzteil (Apple USB-C), einfacher Power-Reset.

**Ergebnis:** ❌ Weiterhin komplett tot, keine Lade-LED, keine Reaktion.

---

## 6 · Ergebnis & nächster Schritt

- **Befund:** Wahrscheinlicher **Mainboard-Frühausfall** (fabrikneu, nichts verändert, alle kostenlosen Checks erfolglos).
- **Nächster Schritt:** **Framework-Support / RMA** in Garantie (kostenlos), **kein** Eigenkauf eines Mainboards.
- **Kontakt:** support@frame.work · frame.work/support · frame.work/warranty · community.frame.work
- **Symptom-Text fürs Ticket:** „Framework 13 DIY, fabrikneu. Plötzlich im Betrieb ausgegangen, seitdem komplett tot (keine LED, kein Lüfter, kein Display). Getestet: mehrere USB-C-Ports, zweites Netzteil, Power-Reset, RAM neu gesetzt, Akku-Stecker-Vollreset — keine Lade-LED, keine Reaktion. Verdacht: Mainboard-Defekt."
- **Vor Versand:** ggf. SSD entnehmen (Daten unberührt).

---

## 7 · KI-Entscheidungsprotokoll (D3)

| Schritt | Entscheidung | Basis (Quelle / Konfidenz) |
|---|---|---|
| Aufnahme | Strom-/Power-Pfad-Verdacht statt Software | strukturierte Symptomaufnahme |
| Diagnose | 4 Kandidaten priorisiert | kuratierte Sammlung + 1 KI-Eigenrecherche (gekennzeichnet) |
| Nach Nutzer-Tests | Externen Ladepfad herabgestuft, DIY-Reseat heraufgestuft | Nutzerangaben (mehrere Ports, zweites Netzteil, Reset) |
| Bewertung | 🟢-Freigabe für DIY | Framework-Reparatur-Design |
| Begleitung erfolglos | Mainboard-Defekt als führend, RMA-Pfad | Ausschlussdiagnostik |

---

## 8 · Reparatur-Tagebuch

**Eintrag angelegt:** *Framework 13 DIY — „plötzlich tot, keine Lade-LED" → Ladepfad/RAM/Reset erfolglos → Mainboard-Frühausfall → RMA.* Wiedererkennung bei künftigen ähnlichen Fällen aktiviert.

---

## 9 · Selbstwirksamkeit / Wirkung

- **Sozial:** Defekt systematisch eingegrenzt (Ladepfad → RAM → Reset); neues Können: Framework öffnen, RAM setzen, Mainboard-Reset.
- **Finanziell:** Fehlkauf (~150–250 € Ersatz-Mainboard / Neugerät) durch klare Garantie-Einordnung vermieden.
- **Ökologisch:** Kein Neugerät / kein voreiliger E-Schrott — Mainboard-Tausch erhält das restliche Gerät.

---

## 10 · Consent-Status (D10)

**Einwilligung Daten-Schwungrad:** ⏳ **noch offen** — Nutzer um anonymisierten Beitrag (Gerät, Symptom, was geholfen/nicht geholfen hat, ohne Personen-/Bestell-/Seriennummer) gebeten; Antwort ausstehend.

---

*Erstellt durch die Reparatur-App (Rollen-Workflow). Konfidenz- und Haftungshinweise nach D3 / D16.*
