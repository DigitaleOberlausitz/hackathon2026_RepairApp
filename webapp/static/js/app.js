/* app.js — Zustandsmaschine + Theme-Switcher + Datenanbindung (Vanilla-JS).
   Port von repair-app.jsx + Stufe-1/2/3-Erweiterungen (PROJ-1…27).
   Flow: Start → (pick/Diagnose) → Consent-Gate → Eigentum → Triage → [Unklar?] →
         [Diagnose kuratiert] → [Rückruf-Stopp?] → Ampel → [Mehrfachdefekte?] →
         Entscheidung → [self: Können → Garantie-Gate → [Datenlöschung?] → Reparatur(+Sicherheit) → Rückblick]
         | [andere: Weg]. Persistenz via /api/vorgang. Eine Phone-Instanz, mittig. */
(function () {
  'use strict';

  var h = window.h;
  var PhoneFrame = window.PhoneFrame, Screen = window.Screen, Sheet = window.Sheet;
  var toast = window.toast || function () {};

  /* ===================== I18N (PROJ-24) ===================== */
  var I18N = {
    de: {
      // Navigation / Allgemein
      'nav.zurueck': 'Zurück',
      'nav.protokoll': 'Protokoll',
      'nav.weiter': 'Weiter',
      'nav.ueberspringen': 'Überspringen',
      'nav.startseite': 'Zur Startseite',
      'nav.abbrechen': 'Abbrechen',
      // Start
      'start.brand': 'Reparatur-Helfer',
      'start.hero': 'Was ist kaputt?',
      'start.heroSub': 'Erzähl einfach, was los ist — als würdest du es einem Bekannten beschreiben.',
      'start.placeholder': '„Mein Toaster wirft das Brot nicht mehr aus …"',
      'start.methode.tippen': 'Tippen oder einsprechen',
      'start.methode.foto': 'Foto machen',
      'start.methode.etikett': 'Etikett scannen',
      // Loading
      'loading.moment': 'Einen Moment …',
      'loading.schaue': 'Ich schaue mir dein Problem an.',
      // Consent Gate (PROJ-22)
      'consent.titel': 'Einwilligung zur Datenverarbeitung',
      'consent.body': 'Um dir helfen zu können, verarbeitet diese App deine Gerätebeschreibung und Angaben zum Reparaturfall. Deine Daten werden nicht an Dritte verkauft.',
      'consent.trainingshinweis': 'Mit deiner Einwilligung kann dein anonymisierter Fall (ohne persönliche Daten) die Wissensbasis verbessern — du kannst das ablehnen, ohne dass die App weniger funktioniert.',
      'consent.verweis': 'Mehr dazu: Schwungrad-Beitrag (anonymisiert)',
      'consent.erteilen': 'Einverstanden',
      'consent.ablehnen': 'Ablehnen',
      'consent.widerrufen': 'Einwilligung widerrufen',
      'consent.status.erteilt': 'Einwilligung erteilt',
      'consent.status.abgelehnt': 'Einwilligung abgelehnt',
      'consent.status.widerrufen': 'Einwilligung widerrufen',
      'consent.abgelehntHinweis': 'Kein Problem — die App funktioniert weiter. Der Schwungrad-Beitrag entfällt.',
      // Diagnose kuratiert (PROJ-17)
      'diag.titel': 'Mögliche Ursachen',
      'diag.eyebrow': 'Diagnose',
      'diag.unklar': 'Keine verlässliche Eingrenzung möglich — weiter zum Unklar-Pfad.',
      'diag.weiter': 'Mit dieser Einschätzung weiter',
      'diag.abgrenzung': 'Abgrenzungsfrage',
      'diag.herkunft.kuratiert': 'Kuratiert',
      'diag.herkunft.ki': 'KI-Einschätzung',
      'diag.konfidenz.hoch': 'Hohe Konfidenz',
      'diag.konfidenz.mittel': 'Mittlere Konfidenz',
      'diag.konfidenz.niedrig': 'Niedrige Konfidenz',
      // Rückruf (PROJ-19)
      'recall.titel.rueckruf': '⛔ Offizieller Rückruf',
      'recall.titel.sicherheitsmangel': '⚠️ Sicherheitsmangel',
      'recall.unsicher': 'Modell nicht eindeutig identifiziert — kein bestätigter Rückruf.',
      'recall.weiter': 'Trotzdem fortfahren (auf eigene Verantwortung)',
      'recall.grund.label': 'Grund:',
      'recall.quelle.label': 'Quelle:',
      'recall.stand.label': 'Stand / gültig bis:',
      'recall.vorgehen.label': 'Vorgehen:',
      'recall.hinweis': 'Für dieses Gerät liegt ein offizieller Rückruf oder ein bekannter Sicherheitsmangel vor. Bitte zuerst dem angegebenen Vorgehen folgen, bevor eine Selbstreparatur in Betracht gezogen wird.',
      // Mehrfachdefekte (PROJ-21)
      'fazit.titel': 'Gesamt-Einschätzung',
      'fazit.knackpunkt': 'Kritischer Punkt:',
      'fazit.begruendung': 'Begründung:',
      'fazit.prioritaet': 'Priorisierung:',
      // Datenlöschung (PROJ-20)
      'wipe.titel': 'Datenschutz vor Abgabe',
      'wipe.eyebrow': 'Schutzschritt',
      'wipe.hinweis': 'Dieses Gerät speichert persönliche Daten. Bitte die folgenden Schritte vor der Abgabe durchführen.',
      'wipe.backup': 'Backup erstellt',
      'wipe.loeschen': 'Persönliche Daten gelöscht / Gerät zurückgesetzt',
      'wipe.abmelden': 'Von allen Konten abgemeldet',
      'wipe.warn': '⚠️ Nicht gelöscht: deine Daten könnten in fremden Händen landen.',
      'wipe.skip': 'Bewusst überspringen (nicht empfohlen)',
      'wipe.weiter': 'Fertig — weiter zur Abgabe',
      // Multimodal (PROJ-27)
      'media.foto': 'Foto aufnehmen',
      'media.video': 'Video aufnehmen',
      'media.sprache': 'Einsprechen',
      'media.barcode': 'Barcode/Etikett scannen',
      'media.consent.titel': 'Medien-Einwilligung',
      'media.consent.body': 'Für Foto- und Sprachaufnahmen wird kurz deine Kamera bzw. dein Mikrofon genutzt. Du kannst jederzeit zur Texteingabe zurückkehren.',
      'media.consent.ok': 'Einverstanden',
      'media.consent.nein': 'Nein danke',
      'media.unavail': 'Nicht verfügbar in diesem Browser',
      'media.toText': 'Zur Texteingabe',
      'media.qualityWarn': 'Bild zu dunkel oder unscharf — bitte erneut versuchen oder Text nutzen.',
      'media.voiceLive': 'Ich höre zu …',
      'media.voiceCorrect': 'Erkannter Text — bitte prüfen:',
      'media.scanResult': 'Gefundene Gerätedaten:',
      // Lotse (PROJ-18)
      'steer.weiter': 'Weiter',
      'steer.profi': 'Profi / Café',
      'steer.austausch': 'Austausch',
      'steer.entsorgen': 'Entsorgen',
      'steer.abbrechen': 'Abbrechen',
      // Ampel-Stufen
      'level.gut': 'grün',
      'level.mittel': 'gelb',
      'level.stop': 'rot',
      // Nur-Deutsch-Badge
      'onlyde': 'Nur auf Deutsch verfügbar',
      // Empfehlung
      'recommend.self': 'Selbst reparieren',
      'recommend.pro': 'Profi empfohlen',
      'recommend.replace': 'Ersetzen empfohlen',
      'recommend.local': 'Hilfe vor Ort',
      // ===== Bestehende Stufe-1/2-Screens (PROJ-24 Retrofit) =====
      // Allgemein / AppBar
      'common.aufnahme': 'Aufnahme',
      'common.weiter': 'Weiter',
      'common.zurueck': 'Zurück',
      'common.ueberspringen': 'Überspringen',
      'common.ueberspringenArrow': 'Überspringen →',
      'common.startseite': 'Zur Startseite',
      'common.protokoll': 'Protokoll',
      'common.protokollTeilen': '📄 Protokoll ansehen & teilen',
      'common.quelle': 'Quelle',
      'common.nichtAngegeben': 'nicht angegeben',
      'common.aiWarn': 'Die KI kann sich irren — sieh das als Orientierung, nicht als Urteil.',
      'common.aiWarnStrong': '⚠️ Besonders hier gilt: ',
      // Ownership (PROJ-1)
      'owner.q': 'Ist das dein Gerät?',
      'owner.hint': 'Nur wichtig, falls Garantie oder Kosten eine Rolle spielen. Du musst nichts angeben.',
      'owner.yes': 'Ja, gehört mir',
      'owner.no': 'Nein',
      'owner.unknown': 'Weiß nicht',
      'owner.followupHint': 'Optionale Angaben — beide kannst du überspringen.',
      'owner.ownerPlaceholder': 'Wem gehört es? (z. B. Vermieter, Firma)',
      'owner.costPlaceholder': 'Wer trägt die Kosten?',
      // Triage (PROJ-2)
      'triage.eyebrow': 'Nachfragen',
      'triage.foot': 'Frage {i} von {n} · ich frage nur so viel, wie ich brauche',
      'triage.textPlaceholder': 'Optional: in eigenen Worten beschreiben …',
      'triage.frei': 'Nur frei antworten …',
      'triage.freiTag': 'frei beschrieben',
      // Ampel
      'ampel.eyebrow': 'Einschätzung',
      'ampel.title': 'Worauf du dich einlässt',
      'ampel.footer': 'Was möchtest du tun?',
      'ampel.confTitle': 'Woher kommt diese Einschätzung?',
      'ampel.confSource': 'Quelle: ',
      'ampel.confLevel': 'Wie sicher: ',
      'ampel.confFine': 'Die App verbietet dir nichts — je riskanter die Sache, desto deutlicher die Warnung. Die Verantwortung für dein Handeln bleibt bei dir.',
      'ampel.sheetBewertung': 'Bewertung: ',
      // Unclear (PROJ-4)
      'unclear.footer': 'Trotzdem zur Einschätzung →',
      'unclear.title': 'Ehrlich: keine verlässliche Eingrenzung möglich',
      'unclear.body': 'Mit den bisherigen Angaben kann ich die Ursache nicht seriös bestimmen. Ich täusche dir hier lieber keine Sicherheit vor. Dein Protokoll ist gespeichert — du kannst es behalten und weitergeben.',
      'unclear.dangerWarn': '⚠️ Dieses Gerät kann gefährlich sein. Auch wenn die Ursache unklar ist: bitte nicht selbst öffnen — der Profi-Weg hat Vorrang.',
      'unclear.titleShort': 'Unklar',
      'unclear.proT': 'Profi beauftragen',
      'unclear.proS': 'Fachbetrieb schaut sich das Gerät an',
      'unclear.localT': 'Repair Café finden',
      'unclear.localS': 'gemeinsam vor Ort eingrenzen',
      'unclear.communityT': 'Community fragen',
      'unclear.communityS': 'Forum / Gruppe mit deinem Protokoll',
      'unclear.share': ' Protokoll ansehen, exportieren & teilen',
      // Vergleich (PROJ-5)
      'compare.eyebrow': 'Vergleich aller Wege ',
      'compare.geschaetzt': 'geschätzt',
      'compare.repair': 'Selbst reparieren',
      'compare.pro': 'Profi-Reparatur',
      'compare.neu': 'Neu kaufen',
      'compare.entsorgung': 'Entsorgen',
      'compare.reco': '★ Empfehlung',
      'compare.geld': '💶 Geld',
      'compare.zeit': '⏱️ Zeit',
      'compare.umwelt': '🌍 Ökologie',
      'compare.versteckt': 'Versteckte Posten:',
      'compare.trustSource': 'KI-Einschätzung',
      'compare.trustReason': 'Geschätzte Vergleichswerte — keine belegten Preise.',
      // Förderung (PROJ-6)
      'foerder.head': '🎁 Mögliche Förderung & Reparatur-Bonus',
      'foerder.loading': 'Förderprogramme werden geladen …',
      'foerder.empty': 'Aktuell sind hier keine passenden Förderprogramme hinterlegt. Frag im Zweifel bei deiner Kommune oder deinem Bundesland nach.',
      'foerder.statusAktuell': 'aktuell',
      'foerder.statusVeraltet': 'evtl. veraltet',
      'foerder.statusAusgelaufen': 'ausgelaufen',
      'foerder.stand': 'Stand: ',
      'foerder.gueltigBis': ' · gültig bis: ',
      'foerder.unbekannt': 'unbekannt',
      'foerder.unbefristet': 'unbefristet',
      'foerder.quelle': 'Quelle ↗',
      'foerder.disclaimer': 'Unverbindlicher Hinweis — keine Zusage. Bedingungen beim Träger prüfen.',
      // Decision (PROJ-5/6)
      'decision.eyebrow': 'Entscheidung',
      'decision.title': 'Du entscheidest.',
      'decision.hintStop': 'Ehrlich: Selbst öffnen wäre gefährlich. Ich empfehle Hilfe vor Ort — du wägst ab.',
      'decision.hintGo': 'Ich empfehle, es selbst zu probieren. Aber du hast die Wahl.',
      'decision.selfT': "Ich mach's selbst",
      'decision.selfS': 'Schritt für Schritt begleitet',
      'decision.proT': 'Hilfe / Profi finden',
      'decision.proS': 'Repair Café, Werkstatt & Fachbetrieb in der Nähe',
      'decision.neuT': 'Neues Gerät vergleichen',
      'decision.neuS': 'Alternativen, ehrlich gegen die Reparatur gerechnet',
      'decision.entsorgungT': 'Entsorgen / Recycling',
      'decision.entsorgungS': 'fachgerechter Weg + Rohstoffe zurück',
      // Skill (PROJ-3)
      'skill.eyebrow': 'Bevor es losgeht',
      'skill.title': 'Wie sehr traust du dir das zu?',
      'skill.hint': 'Das steuert nur, wie ausführlich ich erkläre — keine Wertung. Du kannst es jederzeit umstellen.',
      'skill.anfaengerT': 'Eher Anfänger',
      'skill.anfaengerS': 'Ich erkläre jeden Schritt ausführlich.',
      'skill.geuebtT': 'Schon geübt',
      'skill.geuebtS': 'Knappe Anweisungen, kein Ballast.',
      'skill.outHint': 'Lieber doch nicht selbst? Völlig in Ordnung:',
      'skill.outPro': '🏪 Profi beauftragen',
      'skill.outLocal': '🤝 Repair Café / Hilfe vor Ort',
      'skill.outReplace': '♻️ Ersetzen / entsorgen',
      // Gate (PROJ-7)
      'gate.eyebrow': 'Kurz vorher',
      'gate.q': 'Wann hast du das Gerät gekauft?',
      'gate.hint': 'Nur eine grobe Zeitspanne — damit du keinen Garantie-Anspruch verschenkst. Überspringen ist okay.',
      'gate.age6m': 'Vor unter 6 Monaten',
      'gate.age624': 'Vor 6 Mon. – 2 Jahren',
      'gate.age2j': 'Vor über 2 Jahren',
      'gate.ageUnknown': 'Weiß nicht',
      'gate.alt': '✅ Älter als 2 Jahre — Gewährleistung greift in der Regel nicht mehr. Du kannst direkt loslegen.',
      'gate.warnLead': '⚠️ Achtung Gewährleistung: ',
      'gate.warnBody': 'Wenn du das Gerät selbst öffnest, kann dein Gewährleistungs-/Garantieanspruch verfallen. Bei einem echten Defekt ist eine Reklamation oft kostenlos.',
      'gate.reklamation': 'Reklamation prüfen',
      'gate.reklamationSub': 'kostenlos bei Hersteller/Händler',
      'gate.proceed': 'Trotzdem selbst reparieren →',
      'gate.skipFoot': 'Du kannst diese Frage überspringen.',
      // Repair (PROJ-8)
      'repair.step': 'Schritt {i}/{n}',
      'repair.dangerLead': '☠️ Dieser Schritt kann gefährlich sein. ',
      'repair.dangerBody': 'Bitte lies erst weiter, wenn du sicher bist. Es gibt jederzeit den Profi-Weg.',
      'repair.confirmQ': 'Zwei kurze Fragen — ehrlich an dich selbst:',
      'repair.confirmAdult': 'Ich bin volljährig.',
      'repair.confirmConfident': 'Ich traue mir diesen Schritt zu.',
      'repair.confirmFine': 'Ein „Nein" sperrt dich nicht — es ist nur ein ehrlicher Hinweis. Du entscheidest.',
      'repair.confirmProceed': 'Verstanden — Schritt anzeigen',
      'repair.confirmAlt': 'Lieber Profi finden',
      'repair.calloutDanger': '☠️ Lebensgefahr möglich — bitte genau lesen.',
      'repair.calloutSafetyPlug': '⚡ Sicherheit zuerst: erst ausstecken!',
      'repair.calloutSafety': '⚡ Sicherheit zuerst: aufpassen.',
      'repair.depthAnfaenger': 'Anfänger',
      'repair.depthGeuebt': 'Geübt',
      'repair.vorlesen': ' Vorlesen',
      'repair.exit': 'Das wird mir zu heikel — Profi finden',
      'repair.navZurueck': 'Zurück',
      'repair.navWeiter': 'Weiter →',
      'repair.navHandoff': 'Zum Profi & Protokoll →',
      'repair.navFinish': 'Fertig — hat’s geklappt?',
      'repair.handoff': '📎 Dein Protokoll wird automatisch mitgegeben — die Werkstatt muss nicht bei null anfangen.',
      'repair.parts': '🧩 Ersatzteile für diese Reparatur finden',
      // Result
      'result.askQ': 'Hat’s geklappt?',
      'result.askHint': 'Ganz ehrlich — beides ist völlig in Ordnung.',
      'result.yes': 'Ja! 🎉',
      'result.no': 'Noch nicht',
      'result.winQ': 'Geschafft!',
      'result.savedLab': 'gespart',
      'result.co2Lab': 'vermieden',
      'result.deviceLab': 'Gerät gerettet',
      'result.winFoot': 'Und ein Stück Selbstvertrauen fürs nächste Mal. Im Reparatur-Tagebuch festgehalten.',
      'result.winShare': ' Protokoll ansehen & teilen',
      'result.noQ': 'Kein Vorwurf.',
      'result.noHint': 'Du hast das Problem systematisch eingegrenzt — das war goldrichtig. Jetzt hilft dir ein Profi schneller, weil die halbe Arbeit schon getan ist.',
      'result.proFinish': 'Profi finden',
      'result.proSub': 'dein Protokoll geht automatisch mit',
      // Path
      'path.localT': 'Hilfe vor Ort',
      'path.localBody': 'In deiner Nähe gibt es Repair Cafés und Werkstätten. Nimm dein Protokoll mit — so versteht jede helfende Person dein Problem sofort.',
      'path.localSlot': 'Karte mit Repair Cafés',
      'path.proT': 'Profi beauftragen',
      'path.proBody': 'Dein Reparatur-Steckbrief geht direkt an die Werkstatt. Der Mechaniker fängt nicht bei null an — das spart Zeit und Geld.',
      'path.proSlot': 'Werkstatt-Anfrage gesendet',
      'path.replaceT': 'Fachgerecht ersetzen',
      'path.replaceBody': 'Wenn ein Neukauf wirklich klüger ist, ist das auch in Ordnung. So entsorgst du das alte Gerät richtig — und nimmst Rohstoffe in den Kreislauf zurück.',
      'path.replaceSlot': 'Wertstoffhof in der Nähe',
      'path.reklamationT': 'Reklamation einleiten',
      'path.reklamationBody': 'Wende dich mit deinem Protokoll an Händler oder Hersteller. Bei einem Defekt innerhalb der Gewährleistung ist die Reparatur oder der Austausch in der Regel kostenlos.',
      'path.reklamationSlot': 'Reklamations-Vorlage',
      'path.communityT': 'Community fragen',
      'path.communityBody': 'Teile dein Protokoll in einem Reparatur-Forum oder einer Gruppe. Mit den gesammelten Angaben können andere dir gezielter helfen.',
      'path.communitySlot': 'Community-Beitrag vorbereitet',
      // UnivTriage (PROJ-26)
      'univ.eyebrow': 'Systematische Aufnahme',
      'univ.loading': 'Die Fragen werden geladen …',
      'univ.foot': 'Frage {i} von {n} · systematische Aufnahme, gerätunabhängig',
      // Service-Screens (PROJ-11/12/13/14)
      'svc.curatedReason': 'Kuratierte Demodaten ({quelle}) — kein echter Anbieter-Nachweis.',
      'svc.curatedDefault': 'kuratierte Demodaten',
      'svc.empty': 'In deiner Region sind hier keine Einträge hinterlegt. Frag im Zweifel bei deiner Kommune nach — oder probier es ohne Ortsangabe.',
      'svc.locLabel': '📍 Ort / PLZ (optional)',
      'svc.locPlaceholder': 'z. B. 50667 oder Köln',
      'svc.suchen': 'Suchen',
      // Vermittlung (PROJ-11)
      'verm.eyebrow': 'Hilfe vor Ort',
      'verm.title': 'Anbieter in deiner Nähe',
      'verm.intro': 'Repair Cafés helfen kostenlos & ehrenamtlich. Werkstätten und Fachbetriebe arbeiten gegen Bezahlung. Du wählst frei.',
      'verm.loading': 'Anbieter werden geladen …',
      'verm.typRepaircafe': '🤝 Repair Café',
      'verm.typWerkstatt': '🔧 Werkstatt',
      'verm.typProfi': '🏪 Fachbetrieb',
      'verm.demo': 'Demo',
      'verm.schwerpunkt': 'Schwerpunkt: ',
      'verm.free': '🆓 ',
      'verm.freeDefault': 'kostenlos / ehrenamtlich',
      'verm.costDefault': 'kostenpflichtig',
      'verm.selected': '✓ Ausgewählt',
      'verm.select': 'Diesen Anbieter merken',
      // Entsorgung (PROJ-12)
      'ents.eyebrow': 'Entsorgung & Recycling',
      'ents.title': 'Fachgerecht entsorgen',
      'ents.intro': 'Elektrogeräte gehören nicht in den Hausmüll. So bringst du die Rohstoffe zurück in den Kreislauf.',
      'ents.loading': 'Entsorgungswege werden geladen …',
      'ents.emptyDefault': 'Kein lokaler Eintrag. Nach ElektroG nehmen Wertstoffhöfe und größere Händler Elektrogeräte kostenlos zurück.',
      'ents.artWertstoffhof': '♻️ Wertstoffhof',
      'ents.artRuecknahme': '🏬 Händler-Rücknahme',
      'ents.artSammelstelle': '📦 Sammelstelle',
      'ents.rohstoffe': '🔁 Rohstoffe: ',
      'ents.kostenDefault': 'meist kostenlos',
      'ents.selected': '✓ Ausgewählt',
      'ents.select': 'Diesen Weg merken',
      // Produktsuche (PROJ-13)
      'prod.eyebrow': 'Neu vs. Reparatur',
      'prod.title': 'Alternativen im Vergleich',
      'prod.intro': 'Gleiche Optik wie die Wege-Tabelle: Geld, Zeit & Ökologie je Gerät — ehrlich gegen die Reparatur gerechnet.',
      'prod.loading': 'Alternativen werden geladen …',
      'prod.emptyDefault': 'Für diese Kategorie sind keine Alternativen hinterlegt.',
      'prod.energieklasse': ' · Energieklasse ',
      'prod.setup': '🔧 Einrichtungsaufwand: ',
      'prod.selected': '✓ Gemerkt',
      'prod.select': 'Diese Alternative merken',
      // Beschaffung (PROJ-14)
      'besch.loading': 'Ersatzteile werden geladen …',
      'besch.emptyDefault': 'Für dieses Gerät sind keine Ersatzteile hinterlegt.',
      'besch.passendFuer': 'Passend für: ',
      'besch.oosDefault': 'Nicht lieferbar',
      'besch.herstellerAnfrage': ' — beim Hersteller anfragen: ',
      'besch.affiliate': '🔗 Partner-Link (Provision)',
      'besch.partnerDefault': 'Partner-Shop',
      'besch.orderDisclaimer': 'Über diesen Link erhalten wir ggf. eine Provision. Die Empfehlung folgt trotzdem nur dem günstigsten/sinnvollsten Bezug.',
      'besch.kept': '✓ Gemerkt',
      'besch.keep': 'Teil merken',
      'besch.head': '🧩 Ersatzteile beschaffen',
      'besch.intro': 'Günstigste Quelle zuerst. Eine Bestellung ist optional und klar als Partner-Link gekennzeichnet — nie vorausgewählt.',
      'besch.backToRepair': '← Zurück zur Reparatur',
      // Protokoll (PROJ-1/2/3/4/7/8/10)
      'proto.title': 'Reparatur-Steckbrief',
      'proto.unclearWarn': '🤔 Diagnose unklar — keine verlässliche Eingrenzung. Bitte einem Profi/Repair Café vorlegen.',
      'proto.symptom': 'Symptom',
      'proto.tested': 'Was schon getestet wurde',
      'proto.nothingYet': 'noch nichts erfasst',
      'proto.ownWords': 'In eigenen Worten',
      'proto.causeAmpel': 'Wahrscheinliche Ursache & Ampel',
      'proto.why': ' Warum schätzt die App das so ein?',
      'proto.whyQuelle': 'Quelle: ',
      'proto.whySicherheit': ' · Sicherheit: ',
      'proto.whyKiIrrt': '. Die KI kann sich irren.',
      'proto.koennenGarantie': 'Können & Garantie',
      'proto.selbsteinschaetzung': 'Selbsteinschätzung: ',
      'proto.gewaehrleistung': 'Gewährleistung: ',
      'proto.kauf': 'Kauf: ',
      'proto.wahl': ' · Wahl: ',
      'proto.wahlReklamation': 'Reklamation',
      'proto.wahlSelbst': 'selbst reparieren',
      'proto.nichtErfasst': 'nicht erfasst',
      'proto.geraetLabel': '👤 Gerät: ',
      'proto.kostenLabel': ' · Kosten: ',
      'proto.fremdWarn': '⚠️ Fremdes Gerät: vor jedem Eingriff Rücksprache mit Eigentümer/Kostenträger halten (D14).',
      'proto.sicherheitsBestaetigungen': 'Sicherheits-Bestätigungen',
      'proto.schritt': 'Schritt ',
      'proto.volljaehrig': ' — volljährig: ',
      'proto.zugetraut': ', zugetraut: ',
      'proto.ja': 'ja',
      'proto.nein': 'nein',
      'proto.vertrauenQuelle': 'Vertrauen & Quelle',
      'proto.wegeBeschaffung': 'Gewählte Wege & Beschaffung',
      'proto.anbieterLabel': '🤝 Anbieter: ',
      'proto.entsorgungLabel': '♻️ Entsorgungsweg: ',
      'proto.altLabel': '🆕 Alternativgerät: ',
      'proto.ersatzteileLabel': '🧩 Gemerkte Ersatzteile: ',
      'proto.affiliateDisclaimer': 'Bestelloptionen sind Partner-Links (Provision) — kennzeichnungspflichtig, nie vorausgewählt.',
      'proto.quelleLabel': ' · Quelle: ',
      'proto.kuratierteDemo': ' (kuratierte Demodaten)',
      'proto.exportText': 'Text',
      'proto.exportPdf': 'PDF',
      'proto.exportLink': 'Link',
      'proto.exportKopieren': 'Kopieren',
      'proto.linkNote': 'Wer den Link hat, kann den Vorgang lesen. Der Link läuft 30 Tage nach Erstellung ab.',
      'proto.emptyDevice': 'Noch kein Gerät erfasst — wähl auf der Startseite ein Gerät, dann fülle ich den Steckbrief im Hintergrund.',
      'proto.ownGehoertMir': 'gehört mir',
      'proto.ownZuKlaeren': 'zu klären',
      'proto.ownGehoertNicht': 'gehört nicht mir ({who})',
      // Protokoll Stufe-3
      'proto.einwilligung': 'Einwilligung',
      'proto.rueckruf': '⛔ Rückruf / Sicherheitsmangel',
      'proto.datenloeschung': 'Datenlöschung vor Abgabe',
      'proto.bewusstUebersprungen': ' · bewusst übersprungen',
      'proto.mehrfachdefekte': 'Mehrfachdefekte ({n})',
      'proto.gesamt': 'Gesamt: ',
      'proto.knackpunkt': ' · Knackpunkt: ',
      'proto.schwungrad': 'Schwungrad-Beitrag',
      'proto.beitragId': 'Beitrag-ID: ',
      'proto.ausgeschlossen': 'Ausgeschlossen: ',
      'proto.medien': 'Medien ({n})',
      // Diag (PROJ-17) KI-Badge
      'diag.kiShort': 'KI',
      // Toast-Meldungen
      'toast.diagnoseFail': 'Diagnose nicht möglich — versuch es nochmal.',
      'toast.copyOk': 'Protokoll in die Zwischenablage kopiert.',
      'toast.copyUnsupported': 'Kopieren wird hier nicht unterstützt — bitte den Link nutzen.',
      'toast.textFail': 'Konnte den Text nicht laden.',
      'toast.linkCopied': 'Link kopiert.',
      'toast.linkManual': 'Bitte den Link manuell markieren und kopieren.',
      'toast.vorgangFail': 'Konnte den Vorgang nicht speichern — bitte erneut versuchen.',
      'toast.vorgangNotFound': 'Vorgang nicht gefunden — neuer Start.',
    },
    en: {
      // Navigation / General
      'nav.zurueck': 'Back',
      'nav.protokoll': 'Report',
      'nav.weiter': 'Continue',
      'nav.ueberspringen': 'Skip',
      'nav.startseite': 'Back to start',
      'nav.abbrechen': 'Cancel',
      // Start
      'start.brand': 'Repair Helper',
      'start.hero': 'What is broken?',
      'start.heroSub': "Just describe what's happening — as if you were telling a friend.",
      'start.placeholder': 'My toaster does not pop the bread up anymore …',
      'start.methode.tippen': 'Type or speak',
      'start.methode.foto': 'Take a photo',
      'start.methode.etikett': 'Scan label',
      // Loading
      'loading.moment': 'Just a moment …',
      'loading.schaue': "I'm looking at your problem.",
      // Consent Gate
      'consent.titel': 'Data processing consent',
      'consent.body': 'To help you, this app processes your device description and repair details. Your data will not be sold to third parties.',
      'consent.trainingshinweis': 'With your consent, your anonymised case (no personal data) can improve the knowledge base — you can decline without the app working any less well.',
      'consent.verweis': 'More info: Flywheel contribution (anonymised)',
      'consent.erteilen': 'I agree',
      'consent.ablehnen': 'Decline',
      'consent.widerrufen': 'Withdraw consent',
      'consent.status.erteilt': 'Consent given',
      'consent.status.abgelehnt': 'Consent declined',
      'consent.status.widerrufen': 'Consent withdrawn',
      'consent.abgelehntHinweis': 'No problem — the app keeps working. The flywheel contribution is skipped.',
      // Diagnose kuratiert
      'diag.titel': 'Possible causes',
      'diag.eyebrow': 'Diagnosis',
      'diag.unklar': 'No reliable narrowing possible — continuing to unclear path.',
      'diag.weiter': 'Continue with this assessment',
      'diag.abgrenzung': 'Clarifying question',
      'diag.herkunft.kuratiert': 'Curated',
      'diag.herkunft.ki': 'AI estimate',
      'diag.konfidenz.hoch': 'High confidence',
      'diag.konfidenz.mittel': 'Medium confidence',
      'diag.konfidenz.niedrig': 'Low confidence',
      // Recall
      'recall.titel.rueckruf': '⛔ Official recall',
      'recall.titel.sicherheitsmangel': '⚠️ Safety defect',
      'recall.unsicher': 'Model not clearly identified — no confirmed recall.',
      'recall.weiter': 'Continue anyway (at your own risk)',
      'recall.grund.label': 'Reason:',
      'recall.quelle.label': 'Source:',
      'recall.stand.label': 'Date / valid until:',
      'recall.vorgehen.label': 'Action:',
      'recall.hinweis': 'An official recall or known safety defect exists for this device. Please follow the stated action before considering self-repair.',
      // Multi-defect
      'fazit.titel': 'Overall assessment',
      'fazit.knackpunkt': 'Critical point:',
      'fazit.begruendung': 'Reasoning:',
      'fazit.prioritaet': 'Priority order:',
      // Data wipe
      'wipe.titel': 'Data protection before handover',
      'wipe.eyebrow': 'Protection step',
      'wipe.hinweis': 'This device stores personal data. Please complete the following steps before handing it over.',
      'wipe.backup': 'Backup created',
      'wipe.loeschen': 'Personal data deleted / device reset',
      'wipe.abmelden': 'Signed out of all accounts',
      'wipe.warn': '⚠️ Not deleted: your data could end up in the wrong hands.',
      'wipe.skip': 'Skip consciously (not recommended)',
      'wipe.weiter': 'Done — continue to handover',
      // Multimodal
      'media.foto': 'Take photo',
      'media.video': 'Take video',
      'media.sprache': 'Speak',
      'media.barcode': 'Scan barcode/label',
      'media.consent.titel': 'Media consent',
      'media.consent.body': 'For photo and voice capture, your camera or microphone will be used briefly. You can always return to text input.',
      'media.consent.ok': 'I agree',
      'media.consent.nein': 'No thanks',
      'media.unavail': 'Not available in this browser',
      'media.toText': 'Back to text input',
      'media.qualityWarn': 'Image too dark or blurry — please try again or use text.',
      'media.voiceLive': 'Listening …',
      'media.voiceCorrect': 'Recognised text — please check:',
      'media.scanResult': 'Found device data:',
      // Lotse
      'steer.weiter': 'Continue',
      'steer.profi': 'Pro / Café',
      'steer.austausch': 'Replace',
      'steer.entsorgen': 'Recycle',
      'steer.abbrechen': 'Cancel',
      // Levels
      'level.gut': 'green',
      'level.mittel': 'yellow',
      'level.stop': 'red',
      // Only-German badge
      'onlyde': 'Available in German only',
      // Recommend
      'recommend.self': 'Self-repair',
      'recommend.pro': 'Pro recommended',
      'recommend.replace': 'Replace recommended',
      'recommend.local': 'Local help',
      // ===== Existing Stufe-1/2 screens (PROJ-24 retrofit) =====
      // General / AppBar
      'common.aufnahme': 'Intake',
      'common.weiter': 'Continue',
      'common.zurueck': 'Back',
      'common.ueberspringen': 'Skip',
      'common.ueberspringenArrow': 'Skip →',
      'common.startseite': 'Back to start',
      'common.protokoll': 'Report',
      'common.protokollTeilen': '📄 View & share report',
      'common.quelle': 'Source',
      'common.nichtAngegeben': 'not specified',
      'common.aiWarn': 'The AI can be wrong — treat this as guidance, not a verdict.',
      'common.aiWarnStrong': '⚠️ Especially here: ',
      // Ownership
      'owner.q': 'Is this your device?',
      'owner.hint': 'Only relevant if warranty or costs matter. You do not have to provide anything.',
      'owner.yes': 'Yes, it is mine',
      'owner.no': 'No',
      'owner.unknown': "Don't know",
      'owner.followupHint': 'Optional details — you can skip both.',
      'owner.ownerPlaceholder': 'Who owns it? (e.g. landlord, company)',
      'owner.costPlaceholder': 'Who bears the costs?',
      // Triage
      'triage.eyebrow': 'Follow-up questions',
      'triage.foot': 'Question {i} of {n} · I only ask as much as I need',
      'triage.textPlaceholder': 'Optional: describe in your own words …',
      'triage.frei': 'Just answer freely …',
      'triage.freiTag': 'described freely',
      // Ampel
      'ampel.eyebrow': 'Assessment',
      'ampel.title': 'What you are getting into',
      'ampel.footer': 'What would you like to do?',
      'ampel.confTitle': 'Where does this assessment come from?',
      'ampel.confSource': 'Source: ',
      'ampel.confLevel': 'How certain: ',
      'ampel.confFine': 'The app forbids nothing — the riskier it is, the clearer the warning. The responsibility for your actions stays with you.',
      'ampel.sheetBewertung': 'Rating: ',
      // Unclear
      'unclear.footer': 'Go to the assessment anyway →',
      'unclear.title': 'Honestly: no reliable narrowing possible',
      'unclear.body': "With the details so far I cannot seriously determine the cause. I would rather not pretend any false certainty. Your report is saved — you can keep it and pass it on.",
      'unclear.dangerWarn': '⚠️ This device can be dangerous. Even if the cause is unclear: please do not open it yourself — the pro path takes priority.',
      'unclear.titleShort': 'Unclear',
      'unclear.proT': 'Hire a pro',
      'unclear.proS': 'A specialist takes a look at the device',
      'unclear.localT': 'Find a Repair Café',
      'unclear.localS': 'narrow it down together on site',
      'unclear.communityT': 'Ask the community',
      'unclear.communityS': 'forum / group with your report',
      'unclear.share': ' View, export & share report',
      // Compare
      'compare.eyebrow': 'Comparison of all paths ',
      'compare.geschaetzt': 'estimated',
      'compare.repair': 'Self-repair',
      'compare.pro': 'Pro repair',
      'compare.neu': 'Buy new',
      'compare.entsorgung': 'Recycle',
      'compare.reco': '★ Recommendation',
      'compare.geld': '💶 Money',
      'compare.zeit': '⏱️ Time',
      'compare.umwelt': '🌍 Ecology',
      'compare.versteckt': 'Hidden items:',
      'compare.trustSource': 'AI estimate',
      'compare.trustReason': 'Estimated comparison values — no verified prices.',
      // Förderung
      'foerder.head': '🎁 Possible funding & repair bonus',
      'foerder.loading': 'Loading funding programmes …',
      'foerder.empty': 'No matching funding programmes are listed here right now. When in doubt, ask your municipality or federal state.',
      'foerder.statusAktuell': 'current',
      'foerder.statusVeraltet': 'possibly outdated',
      'foerder.statusAusgelaufen': 'expired',
      'foerder.stand': 'As of: ',
      'foerder.gueltigBis': ' · valid until: ',
      'foerder.unbekannt': 'unknown',
      'foerder.unbefristet': 'open-ended',
      'foerder.quelle': 'Source ↗',
      'foerder.disclaimer': 'Non-binding note — no guarantee. Check the conditions with the provider.',
      // Decision
      'decision.eyebrow': 'Decision',
      'decision.title': 'You decide.',
      'decision.hintStop': 'Honestly: opening it yourself would be dangerous. I recommend local help — you weigh it up.',
      'decision.hintGo': 'I recommend trying it yourself. But the choice is yours.',
      'decision.selfT': "I'll do it myself",
      'decision.selfS': 'guided step by step',
      'decision.proT': 'Find help / a pro',
      'decision.proS': 'Repair Café, workshop & specialist nearby',
      'decision.neuT': 'Compare a new device',
      'decision.neuS': 'alternatives, honestly weighed against the repair',
      'decision.entsorgungT': 'Dispose / recycle',
      'decision.entsorgungS': 'proper route + raw materials returned',
      // Skill
      'skill.eyebrow': 'Before we start',
      'skill.title': 'How confident are you about this?',
      'skill.hint': 'This only controls how detailed my explanations are — no judgement. You can change it anytime.',
      'skill.anfaengerT': 'Rather a beginner',
      'skill.anfaengerS': 'I explain every step in detail.',
      'skill.geuebtT': 'Already experienced',
      'skill.geuebtS': 'Concise instructions, no ballast.',
      'skill.outHint': 'Rather not do it yourself? Totally fine:',
      'skill.outPro': '🏪 Hire a pro',
      'skill.outLocal': '🤝 Repair Café / local help',
      'skill.outReplace': '♻️ Replace / recycle',
      // Gate
      'gate.eyebrow': 'Just before',
      'gate.q': 'When did you buy the device?',
      'gate.hint': "Just a rough timeframe — so you don't waste a warranty claim. Skipping is fine.",
      'gate.age6m': 'Less than 6 months ago',
      'gate.age624': '6 months – 2 years ago',
      'gate.age2j': 'More than 2 years ago',
      'gate.ageUnknown': "Don't know",
      'gate.alt': '✅ Older than 2 years — the statutory warranty usually no longer applies. You can get started right away.',
      'gate.warnLead': '⚠️ Warranty warning: ',
      'gate.warnBody': 'If you open the device yourself, your statutory/manufacturer warranty claim may be void. For a genuine defect, a warranty claim is often free.',
      'gate.reklamation': 'Check warranty claim',
      'gate.reklamationSub': 'free of charge at manufacturer/retailer',
      'gate.proceed': 'Repair it myself anyway →',
      'gate.skipFoot': 'You can skip this question.',
      // Repair
      'repair.step': 'Step {i}/{n}',
      'repair.dangerLead': '☠️ This step can be dangerous. ',
      'repair.dangerBody': 'Please only read on when you are sure. The pro path is always available.',
      'repair.confirmQ': 'Two short questions — honestly to yourself:',
      'repair.confirmAdult': 'I am of legal age.',
      'repair.confirmConfident': 'I feel confident doing this step.',
      'repair.confirmFine': 'A "no" does not lock you out — it is just an honest hint. You decide.',
      'repair.confirmProceed': 'Understood — show the step',
      'repair.confirmAlt': 'Rather find a pro',
      'repair.calloutDanger': '☠️ Risk to life possible — please read carefully.',
      'repair.calloutSafetyPlug': '⚡ Safety first: unplug it first!',
      'repair.calloutSafety': '⚡ Safety first: be careful.',
      'repair.depthAnfaenger': 'Beginner',
      'repair.depthGeuebt': 'Experienced',
      'repair.vorlesen': ' Read aloud',
      'repair.exit': 'This is getting too risky for me — find a pro',
      'repair.navZurueck': 'Back',
      'repair.navWeiter': 'Continue →',
      'repair.navHandoff': 'To the pro & report →',
      'repair.navFinish': 'Done — did it work?',
      'repair.handoff': '📎 Your report is passed on automatically — the workshop does not have to start from scratch.',
      'repair.parts': '🧩 Find spare parts for this repair',
      // Result
      'result.askQ': 'Did it work?',
      'result.askHint': 'Honestly — either way is perfectly fine.',
      'result.yes': 'Yes! 🎉',
      'result.no': 'Not yet',
      'result.winQ': 'Done!',
      'result.savedLab': 'saved',
      'result.co2Lab': 'avoided',
      'result.deviceLab': 'device rescued',
      'result.winFoot': 'And a bit of confidence for next time. Recorded in the repair diary.',
      'result.winShare': ' View & share report',
      'result.noQ': 'No blame.',
      'result.noHint': 'You narrowed the problem down systematically — that was exactly right. Now a pro can help you faster, because half the work is already done.',
      'result.proFinish': 'Find a pro',
      'result.proSub': 'your report is sent along automatically',
      // Path
      'path.localT': 'Local help',
      'path.localBody': 'There are Repair Cafés and workshops near you. Take your report along — that way every helper understands your problem right away.',
      'path.localSlot': 'Map of Repair Cafés',
      'path.proT': 'Hire a pro',
      'path.proBody': 'Your repair profile goes straight to the workshop. The mechanic does not start from scratch — that saves time and money.',
      'path.proSlot': 'Workshop request sent',
      'path.replaceT': 'Replace properly',
      'path.replaceBody': 'If buying new really is the smarter choice, that is okay too. This way you dispose of the old device correctly — and return raw materials to the cycle.',
      'path.replaceSlot': 'Recycling centre nearby',
      'path.reklamationT': 'Start a warranty claim',
      'path.reklamationBody': 'Contact the retailer or manufacturer with your report. For a defect within the warranty period, repair or replacement is usually free.',
      'path.reklamationSlot': 'Warranty claim template',
      'path.communityT': 'Ask the community',
      'path.communityBody': 'Share your report in a repair forum or group. With the collected details, others can help you more precisely.',
      'path.communitySlot': 'Community post prepared',
      // UnivTriage
      'univ.eyebrow': 'Systematic intake',
      'univ.loading': 'Loading the questions …',
      'univ.foot': 'Question {i} of {n} · systematic intake, device-independent',
      // Service screens
      'svc.curatedReason': 'Curated demo data ({quelle}) — not a real provider record.',
      'svc.curatedDefault': 'curated demo data',
      'svc.empty': 'No entries are listed for your region here. When in doubt, ask your municipality — or try without a location.',
      'svc.locLabel': '📍 Location / postcode (optional)',
      'svc.locPlaceholder': 'e.g. 50667 or Cologne',
      'svc.suchen': 'Search',
      // Vermittlung
      'verm.eyebrow': 'Local help',
      'verm.title': 'Providers near you',
      'verm.intro': 'Repair Cafés help for free & voluntarily. Workshops and specialists work for payment. You choose freely.',
      'verm.loading': 'Loading providers …',
      'verm.typRepaircafe': '🤝 Repair Café',
      'verm.typWerkstatt': '🔧 Workshop',
      'verm.typProfi': '🏪 Specialist',
      'verm.demo': 'Demo',
      'verm.schwerpunkt': 'Focus: ',
      'verm.free': '🆓 ',
      'verm.freeDefault': 'free / voluntary',
      'verm.costDefault': 'chargeable',
      'verm.selected': '✓ Selected',
      'verm.select': 'Remember this provider',
      // Entsorgung
      'ents.eyebrow': 'Disposal & recycling',
      'ents.title': 'Dispose properly',
      'ents.intro': 'Electrical devices do not belong in household waste. This is how you return the raw materials to the cycle.',
      'ents.loading': 'Loading disposal routes …',
      'ents.emptyDefault': 'No local entry. Under the German ElektroG, recycling centres and larger retailers take back electrical devices free of charge.',
      'ents.artWertstoffhof': '♻️ Recycling centre',
      'ents.artRuecknahme': '🏬 Retailer take-back',
      'ents.artSammelstelle': '📦 Collection point',
      'ents.rohstoffe': '🔁 Raw materials: ',
      'ents.kostenDefault': 'usually free',
      'ents.selected': '✓ Selected',
      'ents.select': 'Remember this route',
      // Produktsuche
      'prod.eyebrow': 'New vs. repair',
      'prod.title': 'Alternatives compared',
      'prod.intro': 'Same look as the paths table: money, time & ecology per device — honestly weighed against the repair.',
      'prod.loading': 'Loading alternatives …',
      'prod.emptyDefault': 'No alternatives are listed for this category.',
      'prod.energieklasse': ' · Energy class ',
      'prod.setup': '🔧 Setup effort: ',
      'prod.selected': '✓ Remembered',
      'prod.select': 'Remember this alternative',
      // Beschaffung
      'besch.loading': 'Loading spare parts …',
      'besch.emptyDefault': 'No spare parts are listed for this device.',
      'besch.passendFuer': 'Fits: ',
      'besch.oosDefault': 'Not available',
      'besch.herstellerAnfrage': ' — ask the manufacturer: ',
      'besch.affiliate': '🔗 Partner link (commission)',
      'besch.partnerDefault': 'Partner shop',
      'besch.orderDisclaimer': 'Via this link we may receive a commission. The recommendation still follows only the cheapest/most sensible source.',
      'besch.kept': '✓ Remembered',
      'besch.keep': 'Remember part',
      'besch.head': '🧩 Source spare parts',
      'besch.intro': 'Cheapest source first. An order is optional and clearly marked as a partner link — never preselected.',
      'besch.backToRepair': '← Back to the repair',
      // Protokoll
      'proto.title': 'Repair profile',
      'proto.unclearWarn': '🤔 Diagnosis unclear — no reliable narrowing. Please present it to a pro / Repair Café.',
      'proto.symptom': 'Symptom',
      'proto.tested': 'What has been tested',
      'proto.nothingYet': 'nothing recorded yet',
      'proto.ownWords': 'In your own words',
      'proto.causeAmpel': 'Probable cause & traffic light',
      'proto.why': ' Why does the app assess it this way?',
      'proto.whyQuelle': 'Source: ',
      'proto.whySicherheit': ' · Certainty: ',
      'proto.whyKiIrrt': '. The AI can be wrong.',
      'proto.koennenGarantie': 'Skill & warranty',
      'proto.selbsteinschaetzung': 'Self-assessment: ',
      'proto.gewaehrleistung': 'Warranty: ',
      'proto.kauf': 'Purchase: ',
      'proto.wahl': ' · Choice: ',
      'proto.wahlReklamation': 'Warranty claim',
      'proto.wahlSelbst': 'self-repair',
      'proto.nichtErfasst': 'not recorded',
      'proto.geraetLabel': '👤 Device: ',
      'proto.kostenLabel': ' · Costs: ',
      'proto.fremdWarn': '⚠️ Third-party device: before any intervention, consult the owner/cost bearer (D14).',
      'proto.sicherheitsBestaetigungen': 'Safety confirmations',
      'proto.schritt': 'Step ',
      'proto.volljaehrig': ' — of legal age: ',
      'proto.zugetraut': ', confident: ',
      'proto.ja': 'yes',
      'proto.nein': 'no',
      'proto.vertrauenQuelle': 'Trust & source',
      'proto.wegeBeschaffung': 'Chosen paths & sourcing',
      'proto.anbieterLabel': '🤝 Provider: ',
      'proto.entsorgungLabel': '♻️ Disposal route: ',
      'proto.altLabel': '🆕 Alternative device: ',
      'proto.ersatzteileLabel': '🧩 Remembered spare parts: ',
      'proto.affiliateDisclaimer': 'Order options are partner links (commission) — subject to labelling, never preselected.',
      'proto.quelleLabel': ' · Source: ',
      'proto.kuratierteDemo': ' (curated demo data)',
      'proto.exportText': 'Text',
      'proto.exportPdf': 'PDF',
      'proto.exportLink': 'Link',
      'proto.exportKopieren': 'Copy',
      'proto.linkNote': 'Anyone with the link can read the case. The link expires 30 days after creation.',
      'proto.emptyDevice': 'No device recorded yet — pick a device on the start page, then I fill in the profile in the background.',
      'proto.ownGehoertMir': 'belongs to me',
      'proto.ownZuKlaeren': 'to be clarified',
      'proto.ownGehoertNicht': 'not mine ({who})',
      // Protokoll Stufe-3
      'proto.einwilligung': 'Consent',
      'proto.rueckruf': '⛔ Recall / safety defect',
      'proto.datenloeschung': 'Data deletion before handover',
      'proto.bewusstUebersprungen': ' · consciously skipped',
      'proto.mehrfachdefekte': 'Multiple defects ({n})',
      'proto.gesamt': 'Overall: ',
      'proto.knackpunkt': ' · Critical point: ',
      'proto.schwungrad': 'Flywheel contribution',
      'proto.beitragId': 'Contribution ID: ',
      'proto.ausgeschlossen': 'Excluded: ',
      'proto.medien': 'Media ({n})',
      // Diag AI badge
      'diag.kiShort': 'AI',
      // Toast messages
      'toast.diagnoseFail': 'Diagnosis not possible — please try again.',
      'toast.copyOk': 'Report copied to the clipboard.',
      'toast.copyUnsupported': 'Copying is not supported here — please use the link.',
      'toast.textFail': 'Could not load the text.',
      'toast.linkCopied': 'Link copied.',
      'toast.linkManual': 'Please select and copy the link manually.',
      'toast.vorgangFail': 'Could not save the case — please try again.',
      'toast.vorgangNotFound': 'Case not found — fresh start.',
    }
  };

  function interpolate(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, function (m, k) {
      return (params[k] != null) ? params[k] : m;
    });
  }

  // t(key) oder t(key, params) — params interpolieren {i},{n},{who},{quelle},…
  function t(key, params) {
    var lang = (window.RepairAppState && window.RepairAppState.lang) || state.lang || 'de';
    var cat = I18N[lang] || I18N.de;
    if (cat[key] !== undefined) return interpolate(cat[key], params);
    // Fallback: deutscher Text mit Kennzeichnung
    var de = I18N.de[key];
    if (de !== undefined) return (lang !== 'de' ? '[DE] ' : '') + interpolate(de, params);
    return key;
  }
  window.RKt = t; // für screens.js

  /* ===================== THEME-TOKENS (Port von repair-themes.js) ===================== */
  var AMPEL = {
    gut: '#1f8a4c', gutBg: '#e7f4ec', gutInk: '#0f5a30',
    mittel: '#c98a00', mittelBg: '#fbf1d9', mittelInk: '#7a5400',
    stop: '#cf3a2c', stopBg: '#fbe6e3', stopInk: '#8a2018',
  };
  function ampelVars() {
    return {
      '--gut': AMPEL.gut, '--gut-bg': AMPEL.gutBg, '--gut-ink': AMPEL.gutInk,
      '--mittel': AMPEL.mittel, '--mittel-bg': AMPEL.mittelBg, '--mittel-ink': AMPEL.mittelInk,
      '--stop': AMPEL.stop, '--stop-bg': AMPEL.stopBg, '--stop-ink': AMPEL.stopInk,
    };
  }

  var SOLIDE = {
    id: 'solide', label: 'Solide',
    flags: { labelCase: 'none', chrome: 'light', hero: 'calm', mono: false },
    vars: Object.assign({
      '--bg': '#f6f5f2', '--surface': '#ffffff', '--surface-2': '#f1efea',
      '--ink': '#1b1a18', '--ink-soft': '#6c6862', '--line': '#e6e2db', '--line-strong': '#d8d3ca',
      '--accent': '#4940c9', '--accent-ink': '#ffffff', '--accent-soft': '#ecebfb',
      '--accent2': '#e8612c', '--accent2-soft': '#fdeee5',
      '--radius': '20px', '--radius-sm': '13px', '--radius-pill': '999px',
      '--shadow': '0 1px 2px rgba(20,18,14,.05), 0 8px 24px rgba(20,18,14,.06)',
      '--shadow-sm': '0 1px 2px rgba(20,18,14,.06)',
      '--font-display': "'IBM Plex Sans', system-ui, sans-serif",
      '--font-body': "'IBM Plex Sans', system-ui, sans-serif",
      '--font-mono': "'IBM Plex Mono', ui-monospace, monospace",
      '--display-weight': '600', '--display-tracking': '-0.01em',
      '--pad': '22px', '--gap': '12px',
    }, ampelVars()),
  };

  var WERKSTATT = {
    id: 'werkstatt', label: 'Werkstatt',
    flags: { labelCase: 'upper', chrome: 'light', hero: 'panel', mono: true },
    vars: Object.assign({
      '--bg': '#ecebe6', '--surface': '#ffffff', '--surface-2': '#f3f1ea',
      '--ink': '#16140f', '--ink-soft': '#5f5b52', '--line': '#dcd8cf', '--line-strong': '#16140f',
      '--accent': '#ff5a1f', '--accent-ink': '#16140f', '--accent-soft': '#ffe9dd',
      '--accent2': '#2a2575', '--accent2-soft': '#e6e4f5',
      '--radius': '12px', '--radius-sm': '8px', '--radius-pill': '8px',
      '--shadow': '4px 4px 0 #16140f', '--shadow-sm': '2px 2px 0 #16140f',
      '--font-display': "'Space Grotesk', system-ui, sans-serif",
      '--font-body': "'IBM Plex Sans', system-ui, sans-serif",
      '--font-mono': "'IBM Plex Mono', ui-monospace, monospace",
      '--display-weight': '700', '--display-tracking': '-0.02em',
      '--pad': '20px', '--gap': '11px',
    }, ampelVars()),
  };

  var MUTIG = {
    id: 'mutig', label: 'Mutig',
    flags: { labelCase: 'upper', chrome: 'dark', hero: 'bold', mono: true },
    vars: Object.assign({
      '--bg': '#141118', '--surface': '#211b29', '--surface-2': '#2e2640',
      '--ink': '#f7f3ee', '--ink-soft': '#a89fb5', '--line': '#352c44', '--line-strong': '#4a3f5e',
      '--accent': '#ff6a3d', '--accent-ink': '#1a1015', '--accent-soft': '#3a221c',
      '--accent2': '#9b8bff', '--accent2-soft': '#2a2350',
      '--radius': '22px', '--radius-sm': '14px', '--radius-pill': '999px',
      '--shadow': '0 18px 50px rgba(0,0,0,.5)', '--shadow-sm': '0 6px 18px rgba(0,0,0,.4)',
      '--font-display': "'Space Grotesk', system-ui, sans-serif",
      '--font-body': "'IBM Plex Sans', system-ui, sans-serif",
      '--font-mono': "'IBM Plex Mono', ui-monospace, monospace",
      '--display-weight': '700', '--display-tracking': '-0.03em',
      '--pad': '22px', '--gap': '12px',
      '--gut': AMPEL.gut, '--gut-bg': '#143524', '--gut-ink': '#7fe0a6',
      '--mittel': AMPEL.mittel, '--mittel-bg': '#3a2e10', '--mittel-ink': '#f3c969',
      '--stop': '#ff5a47', '--stop-bg': '#3a1a18', '--stop-ink': '#ff9d92',
    }),
  };

  var THEMES = { solide: SOLIDE, werkstatt: WERKSTATT, mutig: MUTIG };
  var DEFAULT_VARS = { '--font-size': '16px', '--motion': '.22s' };

  window.REPAIR_THEMES = THEMES;
  window.REPAIR_AMPEL = AMPEL;

  /* ===================== LANG-DETECT (PROJ-24) =====================
     Die App ist bewusst Deutsch-only („Nur auf Deutsch verfügbar"). Frühere
     Browser-Sprach-Erkennung schaltete bei englischem Browser ungewollt auf
     'en' und ließ Teile der Oberfläche englisch erscheinen — jetzt immer 'de'. */
  function detectLang() {
    return 'de';
  }

  /* ===================== STATE ===================== */
  function resetUi() {
    return {
      chooser: false, conf: false, activeLight: null, phase: 'ask',
      why: false, confirmAdult: false, confirmConfident: false,
      // Stufe-3 transient
      diagFrage: null,        // aktuelle Abgrenzungsfrage Index
      mediaConsentOpen: false,
      recallChecked: false,
      steerOpen: false,
    };
  }

  var state = {
    themeId: 'werkstatt',
    lang: detectLang(),         // PROJ-24: Sprache
    // — transient —
    loading: false,
    error: null,          // Startscreen-Fehlerhinweis (Diagnose nicht verfügbar)
    draft: '',            // Start-Freitext
    draftFree: {},        // Triage-Freitext-Entwürfe je Index (transient bis "Antwort")
    draftOwner: '',
    draftCostBearer: '',
    foerder: null,        // geladene Förderliste (transient)
    foerderLoading: false,
    linkUrl: null,        // PROJ-10 Link-Anzeige (transient)
    proto: false,
    ui: resetUi(),
    phoneEl: null,
    appEl: null,
    // — transiente Stufe-2-Listen (nicht persistiert; bei Bedarf nachgeladen) —
    univ: null,           // PROJ-26 { fragen: [...] }
    univLoading: false,
    anbieter: null,       // PROJ-11 { items, fallback, hinweis }
    anbieterLoading: false,
    entsorgungList: null, // PROJ-12 { items, fallback, hinweis }
    entsorgungLoading: false,
    alternativen: null,   // PROJ-13 { items, breakEven, hinweis, fallback }
    alternativenLoading: false,
    ersatzteile: null,    // PROJ-14 { items, guenstigsteZuerst, hinweis, fallback }
    ersatzteileLoading: false,
    // — transiente Stufe-3-Daten (nicht persistiert) —
    rueckrufData: null,   // PROJ-19: geladene Rückruf-Daten (transient)
    rueckrufLoading: false,
    lotseOptionen: [],    // PROJ-18: aktuell geladene Steueroptionen
    lotseLoading: false,
    // — persistierbar (Schema STUFE1 §1) —
    id: null,
    device: null,
    diagnosis: null,      // { status, score, reason }
    stage: 'start',
    ti: 0,
    ri: 0,
    depth: 'Anfänger',
    path: 'pro',
    answers: [],          // [{ q, a, tag, freitext? }]
    ownership: { isOwner: null, owner: '', costBearer: '' },
    skill: null,          // 'Anfänger' | 'Geübt' | null
    warranty: { asked: false, technicalDefect: null, purchaseAge: '', choice: '' },
    safetyConfirms: {},   // { index: { adult, confident, ts } }
    decisionLog: [],
    // — persistierbar (Schema STUFE2 §1) —
    kategorie: '',        // abgeleitete Gerätekategorie ("" = unbekannt)
    ort: '',              // optionaler Standort-Freitext
    vermittlung: { viewed: false, selected: '' },   // PROJ-11
    entsorgung: { viewed: false, selected: '' },    // PROJ-12
    produktsuche: { viewed: false, selected: '' },  // PROJ-13
    beschaffung: { viewed: false, parts: [] },      // PROJ-14
    trust: { level: '', source: '', reason: '' },   // PROJ-25
    // — persistierbar (Schema STUFE3 §1) —
    // PROJ-24
    // lang bereits oben
    // PROJ-17
    fehlerzustand: {
      kandidaten: [],
      gewaehlt: '',
      abgrenzung: { offen: [], beantwortet: {} },
      unklar: false,
    },
    // PROJ-21
    defekte: [],
    gesamtFazit: null,
    // PROJ-19
    rueckruf: { hit: false, grund: '', quelle: '', stand: '', gueltigBis: '', vorgehen: '', modellUnsicher: false, art: 'rueckruf' },
    // PROJ-20
    datentragend: null,
    abgabe: '',
    datenloeschung: { backup: false, loeschen: false, abmelden: false, bewusstUebersprungen: false },
    // PROJ-22
    consent: { status: 'offen', zeitpunkt: '' },
    // PROJ-23
    schwungrad: { beigetragen: false, beitragId: '', ausgeschlossen: [] },
    // PROJ-27
    medienConsent: false,
    medien: [],
  };

  function nowIso() { try { return new Date().toISOString(); } catch (e) { return ''; } }
  function setStage(s) { state.stage = s; state.ui = resetUi(); }
  function logDecision(kind, note, source, confidence) {
    state.decisionLog = state.decisionLog.concat([{
      ts: nowIso(), kind: kind, note: note || '', source: source || '', confidence: (confidence == null ? '' : confidence)
    }]);
  }

  /* ===================== PERSISTENZ (PROJ-9) ===================== */
  var PERSIST_KEYS = ['id', 'device', 'diagnosis', 'stage', 'ti', 'ri', 'depth', 'path',
    'answers', 'ownership', 'skill', 'warranty', 'safetyConfirms', 'decisionLog', 'themeId',
    'kategorie', 'ort', 'vermittlung', 'entsorgung', 'produktsuche', 'beschaffung', 'trust',
    // Stufe-3
    'lang', 'fehlerzustand', 'defekte', 'gesamtFazit', 'rueckruf',
    'datentragend', 'abgabe', 'datenloeschung', 'consent', 'schwungrad', 'medienConsent', 'medien',
  ];

  function serialize() {
    var out = { schemaVersion: 1 };
    PERSIST_KEYS.forEach(function (k) { out[k] = state[k]; });
    return out;
  }

  function hydrate(s) {
    if (!s || typeof s !== 'object') return;
    PERSIST_KEYS.forEach(function (k) { if (s[k] !== undefined && s[k] !== null) state[k] = s[k]; });
    if (!state.ownership || typeof state.ownership !== 'object') state.ownership = { isOwner: null, owner: '', costBearer: '' };
    if (!state.warranty || typeof state.warranty !== 'object') state.warranty = { asked: false, technicalDefect: null, purchaseAge: '', choice: '' };
    if (!Array.isArray(state.answers)) state.answers = [];
    if (!state.safetyConfirms || typeof state.safetyConfirms !== 'object') state.safetyConfirms = {};
    if (!Array.isArray(state.decisionLog)) state.decisionLog = [];
    if (!THEMES[state.themeId]) state.themeId = 'werkstatt';
    // Stufe-2-Defaults (tolerant)
    if (typeof state.kategorie !== 'string') state.kategorie = '';
    if (typeof state.ort !== 'string') state.ort = '';
    if (!state.vermittlung || typeof state.vermittlung !== 'object') state.vermittlung = { viewed: false, selected: '' };
    if (!state.entsorgung || typeof state.entsorgung !== 'object') state.entsorgung = { viewed: false, selected: '' };
    if (!state.produktsuche || typeof state.produktsuche !== 'object') state.produktsuche = { viewed: false, selected: '' };
    if (!state.beschaffung || typeof state.beschaffung !== 'object') state.beschaffung = { viewed: false, parts: [] };
    if (!Array.isArray(state.beschaffung.parts)) state.beschaffung.parts = [];
    if (!state.trust || typeof state.trust !== 'object') state.trust = { level: '', source: '', reason: '' };
    // Stufe-3-Defaults (tolerant)
    // Deutsch-only: jeder geladene Sprachwert (auch 'en' aus Alt-Vorgängen) → 'de'.
    state.lang = 'de';
    if (!state.fehlerzustand || typeof state.fehlerzustand !== 'object') {
      state.fehlerzustand = { kandidaten: [], gewaehlt: '', abgrenzung: { offen: [], beantwortet: {} }, unklar: false };
    }
    if (!Array.isArray(state.fehlerzustand.kandidaten)) state.fehlerzustand.kandidaten = [];
    if (!state.fehlerzustand.abgrenzung || typeof state.fehlerzustand.abgrenzung !== 'object') {
      state.fehlerzustand.abgrenzung = { offen: [], beantwortet: {} };
    }
    if (!Array.isArray(state.defekte)) state.defekte = [];
    if (state.gesamtFazit === undefined) state.gesamtFazit = null;
    if (!state.rueckruf || typeof state.rueckruf !== 'object') {
      state.rueckruf = { hit: false, grund: '', quelle: '', stand: '', gueltigBis: '', vorgehen: '', modellUnsicher: false, art: 'rueckruf' };
    }
    if (state.datentragend === undefined) state.datentragend = null;
    if (typeof state.abgabe !== 'string') state.abgabe = '';
    if (!state.datenloeschung || typeof state.datenloeschung !== 'object') {
      state.datenloeschung = { backup: false, loeschen: false, abmelden: false, bewusstUebersprungen: false };
    }
    if (!state.consent || typeof state.consent !== 'object') state.consent = { status: 'offen', zeitpunkt: '' };
    if (!state.schwungrad || typeof state.schwungrad !== 'object') state.schwungrad = { beigetragen: false, beitragId: '', ausgeschlossen: [] };
    if (typeof state.medienConsent !== 'boolean') state.medienConsent = false;
    if (!Array.isArray(state.medien)) state.medien = [];
    // lang in localStorage spiegeln
    try { localStorage.setItem('rk-lang', state.lang); } catch (e) {}
    // transienter UI-State frisch
    state.ui = resetUi();
    state.draftFree = {};
    state.draftOwner = state.ownership.owner || '';
    state.draftCostBearer = state.ownership.costBearer || '';
    state.foerder = null;
    state.linkUrl = null;
    state.proto = false;
    state.univ = null; state.anbieter = null; state.entsorgungList = null;
    state.alternativen = null; state.ersatzteile = null;
    state.rueckrufData = null; state.lotseOptionen = [];
  }

  var _creating = false;
  var _createQueue = [];
  function ensureVorgang(cb) {
    if (state.id) { if (cb) cb(state.id); return; }
    if (cb) _createQueue.push(cb);
    if (_creating) return;            // bereits ein POST unterwegs — nur einmal anlegen
    _creating = true;
    fetch('/api/vorgang', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: serialize() }),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.id) {
          state.id = res.id;
          try { history.replaceState(null, '', '?v=' + encodeURIComponent(res.id)); } catch (e) {}
        }
      })
      .catch(function () { /* Anlage fehlgeschlagen — Demo läuft lokal weiter */ })
      .then(function () {
        _creating = false;
        var q = _createQueue; _createQueue = [];
        q.forEach(function (fn) { try { fn(state.id); } catch (e) {} });
      });
  }

  // PUT nach jedem zustandsändernden Schritt — fire-and-forget, Fehler schlucken.
  function persist() {
    if (!state.id) return;
    fetch('/api/vorgang/' + state.id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: serialize() }),
    }).catch(function () {});
  }

  // erster zustandsändernder Schritt legt den Vorgang an, danach nur noch PUT.
  function commit() { render(); if (state.id) persist(); else ensureVorgang(function () { persist(); }); }

  /* ===================== HEURISTIKEN (PROJ-4 / PROJ-7) ===================== */
  function answersContradict(answers) {
    var tags = (answers || []).map(function (a) { return ((a && a.tag) || '').toLowerCase(); });
    var solid = (answers || []).filter(function (a) { return a && a.tag; });
    // Kein verwertbares Signal: alles "weiß nicht / unklar"
    var unknownish = tags.filter(function (t) {
      return t.indexOf('unklar') >= 0 || t.indexOf('weiß') >= 0 || t.indexOf('weiss') >= 0;
    });
    if (solid.length >= 3 && unknownish.length === solid.length) return true;
    // Explizit gegensätzliche Aussagen
    var opposites = [['bleibt kalt', 'wird warm']];
    for (var i = 0; i < opposites.length; i++) {
      if (tags.indexOf(opposites[i][0]) >= 0 && tags.indexOf(opposites[i][1]) >= 0) return true;
    }
    return false;
  }

  function isUnclear() {
    if (state.diagnosis && state.diagnosis.status === 'unclear') return true;
    if (answersContradict(state.answers)) return true;
    if (state.fehlerzustand && state.fehlerzustand.unklar) return true;
    return false;
  }

  function unclearReason() {
    if (state.diagnosis && state.diagnosis.status === 'unclear') return 'Diagnose-Konfidenz unter Schwelle: ' + (state.diagnosis.reason || '');
    if (answersContradict(state.answers)) return 'Widersprüchliche bzw. nicht verwertbare Triage-Antworten';
    if (state.fehlerzustand && state.fehlerzustand.unklar) return 'Kuratierte Diagnose: kein passender Fehlerzustand gefunden';
    return '';
  }

  // PROJ-8: Sicherheits-Bestätigung nötig?
  function needsSafetyConfirm(step) {
    if (!step) return false;
    if (step.danger === true) return true;
    // Gerät-Sicherheits-Light "stop" für einen als sicherheitskritisch markierten Schritt (Contract §5.6)
    var sich = (state.device && state.device.lights || []).filter(function (l) { return l.key === 'Sicherheit'; })[0];
    if (sich && sich.level === 'stop' && step.safety === true) return true;
    return false;
  }

  // PROJ-7: technischer Defekt? Im Zweifel ja (Diagnose ≠ reiner Anwenderfehler).
  function technicalDefect() {
    return true;
  }
  function shouldShowGate() {
    return technicalDefect() && !state.warranty.asked;
  }

  /* ===================== STUFE-2-HEURISTIKEN (PROJ-11/12/13 + PROJ-25) ===================== */
  // Gerätekategorie aus dem device heuristisch ableiten (Default kleingeraet, nie erfragt).
  function deriveKategorie(device) {
    var s = ((device && ((device.id || '') + ' ' + (device.name || '') + ' ' + (device.detail || ''))) || '').toLowerCase();
    if (/kühl|wasch|spül|trockn|\bherd\b|backofen|geschirr|gefrier|trockner/.test(s)) return 'grossgeraet';
    if (/laptop|notebook|handy|smartphone|tablet|fernseh|\btv\b|monitor|computer|konsole|kamera|kopfhörer|radio|drucker/.test(s)) return 'elektronik';
    if (/fahrrad|e-bike|ebike|pedelec|roller|scooter|\bauto\b/.test(s)) return 'mobilitaet';
    return 'kleingeraet';
  }
  // Vertrauens-Kontext (PROJ-25): aus Diagnose-trust ODER device.confidence ableiten.
  function deriveTrust(device, diagnosis) {
    if (diagnosis && diagnosis.trust && (diagnosis.trust.level || diagnosis.trust.source)) {
      return { level: diagnosis.trust.level || '', source: diagnosis.trust.source || '', reason: diagnosis.trust.reason || '' };
    }
    var c = (device && device.confidence) || {};
    var lvl = window.normTrustLevel ? window.normTrustLevel(c.level) : (c.level || 'mittel');
    return { level: lvl, source: c.source || 'kuratiert', reason: c.note || '' };
  }
  // Stufe-2-Auswahlen zurücksetzen, wenn ein neues Gerät den Flow startet.
  function resetStufe2() {
    state.vermittlung = { viewed: false, selected: '' };
    state.entsorgung = { viewed: false, selected: '' };
    state.produktsuche = { viewed: false, selected: '' };
    state.beschaffung = { viewed: false, parts: [] };
    state.ort = '';
    state.anbieter = null; state.entsorgungList = null;
    state.alternativen = null; state.ersatzteile = null; state.univ = null;
  }
  // Stufe-3-Felder zurücksetzen (neuer Flow)
  function resetStufe3() {
    state.fehlerzustand = { kandidaten: [], gewaehlt: '', abgrenzung: { offen: [], beantwortet: {} }, unklar: false };
    state.defekte = [];
    state.gesamtFazit = null;
    state.rueckruf = { hit: false, grund: '', quelle: '', stand: '', gueltigBis: '', vorgehen: '', modellUnsicher: false, art: 'rueckruf' };
    state.datentragend = null;
    state.abgabe = '';
    state.datenloeschung = { backup: false, loeschen: false, abmelden: false, bewusstUebersprungen: false };
    // Consent bleibt erhalten (einmal gesetzt = gilt weiterhin für den Vorgang)
    state.schwungrad = { beigetragen: false, beitragId: '', ausgeschlossen: [] };
    state.medien = [];
    state.rueckrufData = null;
    state.lotseOptionen = [];
  }

  /* ===================== CONSENT-GATE (PROJ-22) ===================== */
  // Nach Consent-Entscheidung: pendingDiagnose fortsetzen falls nötig
  function _afterConsentDecision() {
    var wasPending = state.ui.pendingDiagnose;
    state.ui.pendingDiagnose = false;
    if (wasPending && state.consent.status === 'erteilt') {
      _doDiagnoseReal();
    } else {
      commit();
    }
  }

  function consentErteilen() {
    ensureVorgang(function (id) {
      if (!id) {
        state.consent = { status: 'erteilt', zeitpunkt: nowIso() };
        logDecision('consent', 'erteilt');
        _afterConsentDecision();
        return;
      }
      fetch('/api/vorgang/' + id + '/consent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'erteilt' }),
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.state && res.state.consent) {
            state.consent = res.state.consent;
          } else {
            state.consent = { status: 'erteilt', zeitpunkt: nowIso() };
          }
          logDecision('consent', 'erteilt');
          _afterConsentDecision();
        })
        .catch(function () {
          state.consent = { status: 'erteilt', zeitpunkt: nowIso() };
          logDecision('consent', 'erteilt');
          _afterConsentDecision();
        });
    });
  }

  function consentAblehnen() {
    ensureVorgang(function (id) {
      if (!id) {
        state.consent = { status: 'abgelehnt', zeitpunkt: nowIso() };
        logDecision('consent', 'abgelehnt');
        commit();
        return;
      }
      fetch('/api/vorgang/' + id + '/consent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'abgelehnt' }),
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.state && res.state.consent) {
            state.consent = res.state.consent;
          } else {
            state.consent = { status: 'abgelehnt', zeitpunkt: nowIso() };
          }
          logDecision('consent', 'abgelehnt');
          commit();
        })
        .catch(function () {
          state.consent = { status: 'abgelehnt', zeitpunkt: nowIso() };
          logDecision('consent', 'abgelehnt');
          commit();
        });
    });
  }

  function consentWiderrufen() {
    if (!state.id) {
      state.consent = { status: 'widerrufen', zeitpunkt: nowIso() };
      logDecision('consent', 'widerrufen');
      commit();
      return;
    }
    fetch('/api/vorgang/' + state.id + '/consent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'widerrufen' }),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.state && res.state.consent) {
          state.consent = res.state.consent;
        } else {
          state.consent = { status: 'widerrufen', zeitpunkt: nowIso() };
        }
        logDecision('consent', 'widerrufen');
        commit();
      })
      .catch(function () {
        state.consent = { status: 'widerrufen', zeitpunkt: nowIso() };
        logDecision('consent', 'widerrufen');
        commit();
      });
  }

  /* ===================== LOTSE (PROJ-18) ===================== */
  function loadLotseOptionen() {
    if (!state.id || state.lotseLoading) return;
    state.lotseLoading = true;
    fetch('/api/lotse/route?v=' + encodeURIComponent(state.id))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        state.lotseLoading = false;
        state.lotseOptionen = (d && d.steueroptionen) || [];
        // Consent-Gate-Trigger (autoritativ): naechsteRolle:"consent-gate"
        if (d && d.naechsteRolle === 'consent-gate' && state.consent.status === 'offen') {
          // bleibt im aktuellen Screen, Gate wird gerendert
        }
        render();
      })
      .catch(function () {
        state.lotseLoading = false;
        state.lotseOptionen = [];
        render();
      });
  }

  function lotseAktion(ereignis, ziel) {
    logDecision('lotse', 'ereignis=' + ereignis + (ziel ? ',ziel=' + ziel : ''));
    if (!state.id) { commit(); return; }
    fetch('/api/lotse/route', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vorgangId: state.id, ereignis: ereignis, ziel: ziel || '' }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.naechsteRolle) {
          var mapping = {
            vermittlung: 'vermittlung', entsorgung: 'entsorgung',
            produktsuche: 'produktsuche', wirkung: 'result',
          };
          if (mapping[d.naechsteRolle]) {
            setStage(mapping[d.naechsteRolle]);
          }
        }
        state.lotseOptionen = (d && d.steueroptionen) || state.lotseOptionen;
        commit();
      })
      .catch(function () { commit(); });
  }

  /* ===================== RÜCKRUF (PROJ-19) ===================== */
  function loadRueckruf() {
    if (state.rueckrufLoading) return;
    var modell = (state.device && (state.device.modell || state.device.name)) || '';
    var kat = state.kategorie || '';
    state.rueckrufLoading = true;
    fetch('/api/rueckruf?modell=' + encodeURIComponent(modell) + '&kat=' + encodeURIComponent(kat))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        state.rueckrufLoading = false;
        state.rueckrufData = d || { hit: false };
        if (d && d.hit) {
          state.rueckruf = {
            hit: true, art: d.art || 'rueckruf',
            grund: d.grund || '', quelle: d.quelle || '',
            stand: d.stand || '', gueltigBis: d.gueltigBis || '',
            vorgehen: d.vorgehen || '', modellUnsicher: !!d.modellUnsicher,
          };
        } else {
          state.rueckruf = Object.assign({}, state.rueckruf, { hit: false });
        }
        state.ui.recallChecked = true;
        commit();
      })
      .catch(function () {
        state.rueckrufLoading = false;
        state.rueckruf = Object.assign({}, state.rueckruf, { hit: false });
        state.ui.recallChecked = true;
        render();
      });
  }

  /* ===================== MEHRFACHDEFEKTE (PROJ-21) ===================== */
  function updateGesamtFazit() {
    if (!state.defekte || state.defekte.length < 2) {
      state.gesamtFazit = null;
      return;
    }
    fetch('/api/bewertung/gesamt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defekte: state.defekte }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        state.gesamtFazit = (d && d.gesamtFazit) || null;
        commit();
      })
      .catch(function () { state.gesamtFazit = null; render(); });
  }

  /* ===================== DATENLÖSCHUNG (PROJ-20) ===================== */
  function needsWipeScreen() {
    return state.datentragend === true && state.abgabe === 'dritte';
  }

  function toggleWipeStep(field) {
    var dl = Object.assign({}, state.datenloeschung);
    dl[field] = !dl[field];
    state.datenloeschung = dl;
    logDecision('wipe', 'step=' + field + ' checked=' + dl[field]);
    commit();
  }

  function wipeSkip() {
    state.datenloeschung = Object.assign({}, state.datenloeschung, { bewusstUebersprungen: true });
    logDecision('wipe', 'bewusstUebersprungen=true');
    afterWipe();
  }

  function wipeContinue() {
    logDecision('wipe', 'abgeschlossen');
    afterWipe();
  }

  function afterWipe() {
    proceedToGateOrRepair();
  }

  /* ===================== MEDIEN-CONSENT (PROJ-27) ===================== */
  function medienConsentErteilen() {
    state.medienConsent = true;
    state.ui.mediaConsentOpen = false;
    logDecision('medienConsent', 'erteilt');
    commit();
  }

  function medienConsentAblehnen() {
    state.medienConsent = false;
    state.ui.mediaConsentOpen = false;
    render();
  }

  /* ===================== MEDIEN-UPLOAD (PROJ-27) ===================== */
  function uploadMedium(data, art, cb) {
    ensureVorgang(function (id) {
      if (!id) { if (cb) cb(null); return; }
      var isDataUrl = typeof data === 'string' && data.indexOf('data:') === 0;
      var url = '/api/vorgang/' + id + '/medien';
      var fetchOpts;
      if (isDataUrl) {
        fetchOpts = {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: data, art: art }),
        };
      } else {
        var fd = new FormData();
        fd.append('file', data);
        fd.append('art', art);
        fetchOpts = { method: 'POST', body: fd };
      }
      fetch(url, fetchOpts)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.id) {
            state.medien = state.medien.concat([d]);
            commit();
          }
          if (cb) cb(d);
        })
        .catch(function () { if (cb) cb(null); });
    });
  }

  function removeMedium(id) {
    state.medien = state.medien.filter(function (m) { return m.id !== id; });
    commit();
  }

  /* ===================== HANDLER ===================== */
  function reset() {
    state.id = null; state.device = null; state.diagnosis = null;
    state.ti = 0; state.ri = 0; state.path = 'pro'; state.depth = 'Anfänger';
    state.answers = []; state.skill = null;
    state.ownership = { isOwner: null, owner: '', costBearer: '' };
    state.warranty = { asked: false, technicalDefect: null, purchaseAge: '', choice: '' };
    state.safetyConfirms = {}; state.decisionLog = [];
    state.draft = ''; state.draftFree = {}; state.draftOwner = ''; state.draftCostBearer = '';
    state.error = null;
    state.foerder = null; state.linkUrl = null;
    state.kategorie = ''; state.trust = { level: '', source: '', reason: '' };
    resetStufe2();
    resetStufe3();
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    setStage('start'); render();
  }

  function doDiagnose() {
    var text = (state.draft || '').trim();
    if (!text) return;
    // Consent-Gate vor erster Verarbeitung prüfen
    if (state.consent.status === 'offen') {
      // Vorgang anlegen, damit POST /consent funktioniert
      ensureVorgang(function () {});
      // zeige Consent-Gate
      state.ui.pendingDiagnose = true;
      render();
      return;
    }
    _doDiagnoseReal();
  }

  function _doDiagnoseReal() {
    var text = (state.draft || '').trim();
    if (!text) return;
    state.loading = true; state.error = null; render();
    fetch('/api/diagnose', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, lang: state.lang }),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (data) {
        state.loading = false;
        var device = data && data.device;
        if (device) {
          state.error = null;
          state.device = device;
          state.diagnosis = (data && data.diagnosis) || null;
          state.answers = []; state.ti = 0; state.draftFree = {};
          state.kategorie = deriveKategorie(device);
          state.trust = deriveTrust(device, state.diagnosis);
          resetStufe2();
          resetStufe3();
          // Stufe-3: kuratierte Diagnose-Felder übernehmen (PROJ-17)
          if (state.diagnosis && state.diagnosis.kandidaten) {
            state.fehlerzustand = Object.assign({}, state.fehlerzustand, {
              kandidaten: state.diagnosis.kandidaten || [],
              abgrenzung: state.diagnosis.abgrenzung || { offen: [], beantwortet: {} },
              unklar: !!state.diagnosis.unklar,
            });
          }
          logDecision('diagnose', (state.diagnosis && state.diagnosis.reason) || '',
            (data && data.source) || '', state.diagnosis && state.diagnosis.score);
          setStage('ownership');
          commit();
          // Rückruf laden (PROJ-19)
          loadRueckruf();
        } else {
          // Kein Gerät → KI nicht verfügbar / Fehler. Hinweis auf dem Startscreen.
          state.error = (data && data.error) || t('toast.diagnoseFail');
          toast(t('toast.diagnoseFail'));
          render();
        }
      })
      .catch(function () {
        state.loading = false;
        state.error = t('toast.diagnoseFail');
        toast(t('toast.diagnoseFail'));
        render();
      });
  }

  /* ---- Eigentum (PROJ-1) ---- */
  function setIsOwner(key) {
    state.ownership = Object.assign({}, state.ownership, { isOwner: key });
    if (key !== 'no') { state.draftOwner = ''; state.draftCostBearer = ''; }
    render();
  }
  function ownershipContinue() {
    var o = Object.assign({}, state.ownership);
    if (o.isOwner === 'no') {
      o.owner = (state.draftOwner || '').trim();
      o.costBearer = (state.draftCostBearer || '').trim();
    } else {
      o.owner = ''; o.costBearer = '';
    }
    state.ownership = o;
    logDecision('ownership', 'isOwner=' + (o.isOwner || 'null') + (o.owner ? ', owner=' + o.owner : ''));
    // Rückruf-Check: wenn bereits ein Treffer vorliegt, Stopp-Screen zeigen
    if (state.rueckruf && state.rueckruf.hit && !state.rueckruf.modellUnsicher) {
      setStage('recall'); commit();
      return;
    }
    // PROJ-26: kein gerätespezifischer Triage-Katalog → universelle Triage
    state.ti = 0; state.draftFree = {};
    if (state.device && state.device.triage && state.device.triage.length) {
      setStage('triage');
      commit();
    } else {
      setStage('univtriage');
      loadUniv();
      commit();
    }
  }

  /* ---- Triage (+ Freitext PROJ-2) ---- */
  function setFreitext(index, v) { state.draftFree[index] = v; } // kein Re-Render — Fokus erhalten
  function setDraftOwner(v) { state.draftOwner = v; }
  function setDraftCostBearer(v) { state.draftCostBearer = v; }

  function afterTriage() {
    if (isUnclear()) {
      logDecision('unclear', unclearReason());
      setStage('unclear');
    } else if (state.fehlerzustand && state.fehlerzustand.kandidaten && state.fehlerzustand.kandidaten.length > 0) {
      // PROJ-17: kuratierte Diagnose-Schleife
      setStage('diag');
    } else {
      setStage('ampel');
    }
    commit();
  }

  function answer(q, a, tag) {
    var entry = { q: q, a: a, tag: tag };
    // Freitext aus dem Entwurf übernehmen; unangetastet lassen, was schon gespeichert war.
    var ft = (state.draftFree[state.ti] != null)
      ? state.draftFree[state.ti].trim()
      : ((state.answers[state.ti] && state.answers[state.ti].freitext) || '');
    if (ft) entry.freitext = ft;
    state.answers = state.answers.slice(0, state.ti).concat([entry]);
    if (state.ti < state.device.triage.length - 1) { state.ti = state.ti + 1; commit(); }
    else { afterTriage(); }
  }

  function triageBack() {
    if (state.ti > 0) {
      state.ti = state.ti - 1;
      state.answers = state.answers.slice(0, -1);
      commit();
    } else {
      setStage('ownership'); commit();
    }
  }

  /* ---- Unklar (PROJ-4) ---- */
  function unclearForward(path) {
    state.path = (path === 'community') ? 'community' : path;
    logDecision('unclear', 'Weiterleitung: ' + state.path);
    setStage('path'); commit();
  }
  function unclearToAmpel() { setStage('ampel'); commit(); }

  /* ---- Kuratierte Diagnose-Schleife (PROJ-17) ---- */
  function diagSelectCandidate(id) {
    state.fehlerzustand = Object.assign({}, state.fehlerzustand, { gewaehlt: id });
    logDecision('diag', 'Kandidat gewählt: ' + id, 'kuratiert');
    commit();
  }

  function diagAbgrenzungAnswer(q, antwort, tag) {
    var beantwortet = Object.assign({}, state.fehlerzustand.abgrenzung.beantwortet);
    beantwortet[q] = antwort;
    state.fehlerzustand = Object.assign({}, state.fehlerzustand, {
      abgrenzung: Object.assign({}, state.fehlerzustand.abgrenzung, { beantwortet: beantwortet }),
    });
    logDecision('diag', 'Abgrenzung: ' + q + ' → ' + antwort, '', tag);
    // Kandidaten durch Abgrenzungsantworten filtern
    var kandidaten = (state.fehlerzustand.kandidaten || []).filter(function (k) {
      // Kandidat ausschließen, wenn seine Tags der Antwort widersprechen
      return true; // vereinfacht: alle behalten, Anzeige gedämpft via rk-diag-cand-out
    });
    commit();
  }

  function diagWeiter() {
    logDecision('diag', 'Diagnose-Schleife abgeschlossen, gewählt: ' + (state.fehlerzustand.gewaehlt || 'offen'));
    if (isUnclear() || !state.fehlerzustand.gewaehlt) {
      setStage('unclear'); commit();
    } else {
      // Mehrfachdefekte: Device-lights zu defekte-Array mappen (PROJ-21)
      if (state.device && state.device.lights && state.device.lights.length) {
        state.defekte = [{
          id: state.fehlerzustand.gewaehlt,
          name: state.fehlerzustand.gewaehlt,
          lights: state.device.lights,
          recommend: state.device.recommend || '',
          verdictTitle: state.device.verdictTitle || '',
        }];
        if (state.defekte.length >= 2) updateGesamtFazit();
      }
      setStage('ampel'); commit();
    }
  }

  function diagUnclear() {
    state.fehlerzustand = Object.assign({}, state.fehlerzustand, { unklar: true });
    logDecision('diag', 'Keine passende Ursache — Unklar-Pfad');
    setStage('unclear'); commit();
  }

  /* ---- Ampel → Entscheidung ---- */
  function ampelContinue() { setStage('decision'); loadFoerder(); commit(); }

  /* ---- Entscheidung (PROJ-5/6) ---- */
  function loadFoerder() {
    if (state.foerder != null || state.foerderLoading) return;
    state.foerderLoading = true;
    fetch('/api/foerderung')
      .then(function (r) { return r.json(); })
      .then(function (d) { state.foerder = (d && d.items) || []; state.foerderLoading = false; render(); })
      .catch(function () { state.foerder = []; state.foerderLoading = false; render(); });
  }

  function choose(key) {
    if (key === 'self') {
      // Datentragend bestimmen (PROJ-20)
      if (state.datentragend === null) {
        state.datentragend = isDatentragendKategorie(state.kategorie);
      }
      // Abgabe als "diy" setzen
      state.abgabe = 'diy';
      // PROJ-3: Können genau einmal vor Reparatur
      if (!state.skill) { setStage('skillask'); commit(); }
      else { proceedToGateOrRepair(); }
    } else if (key === 'pro' || key === 'local') {
      // Datentragend + Abgabe an Dritte (PROJ-20)
      if (state.datentragend === null) {
        state.datentragend = isDatentragendKategorie(state.kategorie);
      }
      state.abgabe = 'dritte';
      // PROJ-11: Anbieter-Vermittlung
      state.path = 'pro';
      state.vermittlung = Object.assign({}, state.vermittlung, { viewed: true });
      logDecision('gate', 'Pfad: Hilfe/Profi (Vermittlung)');
      // Datenlöschung vor Abgabe (PROJ-20)?
      if (needsWipeScreen()) {
        setStage('wipe'); commit();
      } else {
        setStage('vermittlung'); loadAnbieter(); commit();
      }
    } else if (key === 'neu' || key === 'replace') {
      // PROJ-13: Alternativen / Neukauf
      state.path = 'replace';
      state.produktsuche = Object.assign({}, state.produktsuche, { viewed: true });
      logDecision('gate', 'Pfad: Neues Gerät (Produktsuche)');
      setStage('produktsuche'); loadAlternativen(); commit();
    } else if (key === 'entsorgung') {
      // PROJ-12: Entsorgung
      state.path = 'replace';
      state.abgabe = 'dritte';
      state.entsorgung = Object.assign({}, state.entsorgung, { viewed: true });
      logDecision('gate', 'Pfad: Entsorgung');
      setStage('entsorgung'); loadEntsorgung(); commit();
    } else {
      state.path = 'pro';
      setStage('path'); commit();
    }
  }

  // Heuristik: ist die Kategorie datentragend? (PROJ-20)
  function isDatentragendKategorie(kat) {
    if (!kat) return null;
    if (/elektronik|laptop|computer|smartphone|handy|tablet/.test(kat)) return true;
    return false;
  }

  /* ===================== STUFE-2 LOADER (transient, nie hart scheitern) ===================== */
  function loadUniv() {
    if (state.univ != null || state.univLoading) return;
    state.univLoading = true;
    fetch('/api/triage/universal')
      .then(function (r) { return r.json(); })
      .then(function (d) { state.univ = (d && d.fragen) ? d : { fragen: (d && d.fragen) || [] }; state.univLoading = false; render(); })
      .catch(function () { state.univ = { fragen: [] }; state.univLoading = false; render(); });
  }
  function loadAnbieter(force) {
    if (!force && (state.anbieter != null || state.anbieterLoading)) return;
    state.anbieterLoading = true;
    var qs = '?kat=' + encodeURIComponent(state.kategorie || '') + '&ort=' + encodeURIComponent(state.ort || '');
    fetch('/api/anbieter' + qs)
      .then(function (r) { return r.json(); })
      .then(function (d) { state.anbieter = d || { items: [] }; state.anbieterLoading = false; render(); })
      .catch(function () { state.anbieter = { items: [], fallback: true, hinweis: 'Konnte Anbieter nicht laden.' }; state.anbieterLoading = false; render(); });
  }
  function loadEntsorgung(force) {
    if (!force && (state.entsorgungList != null || state.entsorgungLoading)) return;
    state.entsorgungLoading = true;
    var qs = '?kat=' + encodeURIComponent(state.kategorie || '') + '&ort=' + encodeURIComponent(state.ort || '');
    fetch('/api/entsorgung' + qs)
      .then(function (r) { return r.json(); })
      .then(function (d) { state.entsorgungList = d || { items: [] }; state.entsorgungLoading = false; render(); })
      .catch(function () { state.entsorgungList = { items: [], fallback: true, hinweis: 'Konnte Entsorgungswege nicht laden.' }; state.entsorgungLoading = false; render(); });
  }
  function loadAlternativen(force) {
    if (!force && (state.alternativen != null || state.alternativenLoading)) return;
    state.alternativenLoading = true;
    var qs = '?kat=' + encodeURIComponent(state.kategorie || '');
    fetch('/api/alternativen' + qs)
      .then(function (r) { return r.json(); })
      .then(function (d) { state.alternativen = d || { items: [] }; state.alternativenLoading = false; render(); })
      .catch(function () { state.alternativen = { items: [], fallback: true, hinweis: 'Konnte Alternativen nicht laden.' }; state.alternativenLoading = false; render(); });
  }
  function loadErsatzteile(force) {
    if (!force && (state.ersatzteile != null || state.ersatzteileLoading)) return;
    state.ersatzteileLoading = true;
    var did = (state.device && state.device.id) || '';
    var defekt = (state.device && state.device.verdictTitle) || '';
    var qs = '?device=' + encodeURIComponent(did) + '&defekt=' + encodeURIComponent(defekt);
    fetch('/api/ersatzteile' + qs)
      .then(function (r) { return r.json(); })
      .then(function (d) { state.ersatzteile = d || { items: [] }; state.ersatzteileLoading = false; render(); })
      .catch(function () { state.ersatzteile = { items: [], fallback: true, hinweis: 'Konnte Ersatzteile nicht laden.' }; state.ersatzteileLoading = false; render(); });
  }

  /* ===================== STUFE-2 HANDLER (Auswahl = zustandsändernd → commit) ===================== */
  function setOrt(v) { state.ort = v; }   // kein Re-Render — Fokus erhalten; persistiert beim Suchen/Auswählen
  function selectAnbieter(id) {
    var cur = state.vermittlung || {};
    state.vermittlung = { viewed: true, selected: cur.selected === id ? '' : id };
    logDecision('gate', 'Anbieter: ' + (state.vermittlung.selected || 'abgewählt'));
    commit();
  }
  function selectEntsorgung(id) {
    var cur = state.entsorgung || {};
    state.entsorgung = { viewed: true, selected: cur.selected === id ? '' : id };
    logDecision('gate', 'Entsorgungsweg: ' + (state.entsorgung.selected || 'abgewählt'));
    commit();
  }
  function selectAlternative(id) {
    var cur = state.produktsuche || {};
    state.produktsuche = { viewed: true, selected: cur.selected === id ? '' : id };
    logDecision('gate', 'Alternativgerät: ' + (state.produktsuche.selected || 'abgewählt'));
    commit();
  }
  function keepPart(id) {
    var parts = ((state.beschaffung && state.beschaffung.parts) || []).slice();
    var i = parts.indexOf(id);
    if (i >= 0) parts.splice(i, 1); else parts.push(id);
    state.beschaffung = Object.assign({}, state.beschaffung, { viewed: true, parts: parts });
    commit();
  }
  function openParts() {
    state.beschaffung = Object.assign({}, state.beschaffung, { viewed: true });
    setStage('beschaffung'); loadErsatzteile(); commit();
  }
  function univAnswer(q, a, tag) {
    var entry = { q: q, a: a, tag: tag };
    var ft = (state.draftFree[state.ti] != null)
      ? state.draftFree[state.ti].trim()
      : ((state.answers[state.ti] && state.answers[state.ti].freitext) || '');
    if (ft) entry.freitext = ft;
    state.answers = state.answers.slice(0, state.ti).concat([entry]);
    var n = (state.univ && state.univ.fragen && state.univ.fragen.length) || 0;
    if (state.ti < n - 1) { state.ti = state.ti + 1; commit(); }
    else { afterTriage(); }
  }
  function univBack() {
    if (state.ti > 0) {
      state.ti = state.ti - 1;
      state.answers = state.answers.slice(0, -1);
      commit();
    } else { setStage('ownership'); commit(); }
  }

  /* ---- Können (PROJ-3) ---- */
  function pickSkill(level) {
    state.skill = level; state.depth = level;
    proceedToGateOrRepair();
  }
  function skillOut(path) {
    state.path = path; setStage('path'); commit();
  }

  /* ---- Garantie-Gate (PROJ-7) ---- */
  function proceedToGateOrRepair() {
    // PROJ-20: Datenlöschung vor Selbstreparatur (nur bei datentragend + dritte, nicht bei self-repair)
    if (shouldShowGate()) { setStage('gate'); commit(); }
    else { startRepair(); }
  }
  function startRepair() {
    state.ri = 0; setStage('repair'); commit();
  }
  function gateAnswer(age) {
    state.warranty = Object.assign({}, state.warranty, {
      asked: true, technicalDefect: technicalDefect(), purchaseAge: age,
    });
    logDecision('gate', 'Kaufzeitspanne=' + age);
    if (age === '>2J') { startRepair(); }   // außerhalb Gewährleistung → kein Gate
    else { commit(); }                       // Warnung in der GateScreen anzeigen
  }
  function gateProceed() {
    state.warranty = Object.assign({}, state.warranty, { asked: true, choice: 'weiter' });
    logDecision('gate', 'Trotz Hinweis selbst reparieren');
    startRepair();
  }
  function gateReklamation() {
    state.warranty = Object.assign({}, state.warranty, { asked: true, choice: 'reklamation' });
    logDecision('gate', 'Reklamation gewählt');
    state.path = 'reklamation'; setStage('path'); commit();
  }

  /* ---- Reparatur (+ Sicherheit PROJ-8) ---- */
  function setConfirmAdult(v) { state.ui.confirmAdult = v; render(); }
  function setConfirmConfident(v) { state.ui.confirmConfident = v; render(); }
  function confirmSafety(adult, confident) {
    state.safetyConfirms = Object.assign({}, state.safetyConfirms);
    state.safetyConfirms[state.ri] = { adult: adult ? 'yes' : 'no', confident: confident ? 'yes' : 'no', ts: nowIso() };
    logDecision('confirm', 'Schritt ' + state.ri + ' bestätigt (volljährig=' + (adult ? 'ja' : 'nein') + ', zutrauen=' + (confident ? 'ja' : 'nein') + ')');
    state.ui.confirmAdult = false; state.ui.confirmConfident = false;
    commit();
  }
  function repairNext() {
    state.ri = Math.min(state.ri + 1, state.device.steps.length - 1);
    commit();
  }
  function repairPrev() {
    if (state.ri > 0) { state.ri = state.ri - 1; commit(); }
    else { setStage('decision'); loadFoerder(); commit(); }
  }
  function repairFinish() {
    var last = state.device.steps[state.device.steps.length - 1];
    if (last.handoff) { state.path = 'pro'; setStage('path'); }
    else { setStage('result'); }
    commit();
  }
  function setDepth(d) { state.depth = d; state.skill = d; commit(); }
  function goPro() { state.path = 'pro'; setStage('path'); commit(); }

  /* ---- Protokoll / Export (PROJ-10) ---- */
  function openProto() { state.proto = true; state.ui.why = false; render(); }
  function closeProto() { state.proto = false; state.linkUrl = null; render(); }

  function withVorgang(cb) {
    ensureVorgang(function (id) {
      if (id) cb(id);
      else toast(t('toast.vorgangFail'));
    });
  }
  function exportPdf() { withVorgang(function (id) { try { window.open('/v/' + id, '_blank'); } catch (e) {} }); }
  function exportText() {
    withVorgang(function (id) {
      fetch('/api/vorgang/' + id + '/export.txt')
        .then(function (r) { return r.text(); })
        .then(function (txt) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(txt).then(function () { toast(t('toast.copyOk')); });
          }
          toast(t('toast.copyUnsupported'));
        })
        .catch(function () { toast(t('toast.textFail')); });
    });
  }
  function exportLink() {
    withVorgang(function (id) {
      state.linkUrl = location.origin + '/v/' + id;
      render();
    });
  }
  function copyLink() {
    if (!state.linkUrl) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(state.linkUrl).then(function () { toast(t('toast.linkCopied')); }).catch(function () {});
    } else { toast(t('toast.linkManual')); }
  }

  /* ---- Sprach-Switcher (PROJ-24) ---- */
  function setLang(lang) {
    // Deutsch-only: andere Sprachen werden ignoriert.
    if (lang !== 'de') return;
    state.lang = 'de';
    try { localStorage.setItem('rk-lang', 'de'); } catch (e) {}
    if (state.id) persist();
    buildLangSwitch();
    render();
  }

  /* Lokale UI-Setter */
  function setConf(v) { state.ui.conf = v; render(); }
  function setActiveLight(v) { state.ui.activeLight = v; render(); }
  function setPhase(v) { state.ui.phase = v; render(); }
  function setWhy(v) { state.ui.why = v; render(); }
  function setDraft(v) { state.draft = v; } // kein Re-Render

  /* ===================== SCREEN-AUSWAHL ===================== */
  function LoadingScreen() {
    return Screen({
      children: [
        h('div', { class: 'rk-result-center' },
          h('div', { class: 'rk-spinner', 'aria-hidden': 'true' }),
          h('h2', { class: 'rk-result-q' }, t('loading.moment')),
          h('p', { class: 'rk-q-hint', style: { textAlign: 'center' } }, t('loading.schaue')),
          h('div', { class: 'rk-thinking-dots', role: 'status', 'aria-label': t('loading.schaue') },
            h('i', {}), h('i', {}), h('i', {})
          )
        )
      ]
    });
  }

  // Consent-Gate (PROJ-22): wird über Screens gelegt (kein eigenständiger Stage-Check)
  function needsConsentGate() {
    return state.consent.status === 'offen' && (state.stage !== 'start' || state.ui.pendingDiagnose);
  }

  function currentScreen() {
    if (state.loading) return LoadingScreen();
    var s = state.stage;
    if (s === 'start') {
      return window.StartScreen({
        draft: state.draft, setDraft: setDraft, onDiagnose: doDiagnose,
        error: state.error,
        lang: state.lang,
        medienConsent: state.medienConsent,
        setMediaConsentOpen: function (v) { state.ui.mediaConsentOpen = v; render(); },
        uploadMedium: uploadMedium,
        medien: state.medien,
        removeMedium: removeMedium,
        // Consent-Gate-Signal
        showConsentGate: needsConsentGate(),
        onConsentErteilen: consentErteilen,
        onConsentAblehnen: consentAblehnen,
        consent: state.consent,
      });
    }
    if (!state.device) return window.StartScreen({
      draft: state.draft, setDraft: setDraft, onDiagnose: doDiagnose,
      error: state.error,
      lang: state.lang,
      medienConsent: state.medienConsent,
      medien: state.medien,
    });
    if (s === 'recall') {
      return window.RecallScreen({
        device: state.device, rueckruf: state.rueckruf,
        onContinue: function () {
          logDecision('recall', 'Trotzdem fortgefahren');
          // Weiter zur Triage
          state.ti = 0; state.draftFree = {};
          if (state.device && state.device.triage && state.device.triage.length) {
            setStage('triage');
          } else {
            setStage('univtriage');
            loadUniv();
          }
          commit();
        },
        onBack: function () { setStage('ownership'); commit(); },
        onProtocol: openProto,
        lang: state.lang,
      });
    }
    if (s === 'ownership') {
      return window.OwnershipScreen({
        device: state.device, ownership: state.ownership,
        draftOwner: state.draftOwner, draftCostBearer: state.draftCostBearer,
        setIsOwner: setIsOwner, setDraftOwner: setDraftOwner, setDraftCostBearer: setDraftCostBearer,
        onContinue: ownershipContinue, onBack: function () { setStage('start'); render(); }, onProtocol: openProto,
        // Consent-Gate
        showConsentGate: needsConsentGate(),
        onConsentErteilen: consentErteilen,
        onConsentAblehnen: consentAblehnen,
        consent: state.consent,
        onConsentRevoke: consentWiderrufen,
      });
    }
    if (s === 'triage') {
      var ftVal = (state.draftFree[state.ti] != null)
        ? state.draftFree[state.ti]
        : ((state.answers[state.ti] && state.answers[state.ti].freitext) || '');
      return window.TriageScreen({
        device: state.device, index: state.ti, freitext: ftVal,
        onAnswer: answer, setFreitext: setFreitext, onBack: triageBack, onProtocol: openProto,
        showConsentGate: needsConsentGate(),
        onConsentErteilen: consentErteilen, onConsentAblehnen: consentAblehnen,
        consent: state.consent, onConsentRevoke: consentWiderrufen,
        lotseOptionen: state.lotseOptionen, onLotseAktion: lotseAktion,
      });
    }
    if (s === 'unclear') {
      return window.UnclearScreen({
        device: state.device, onForward: unclearForward, onAmpel: unclearToAmpel,
        onBack: function () { state.ti = Math.max(0, (state.device.triage && state.device.triage.length - 1) || 0); setStage('triage'); render(); },
        onProtocol: openProto, onRestart: reset,
        lotseOptionen: state.lotseOptionen, onLotseAktion: lotseAktion,
      });
    }
    if (s === 'diag') {
      return window.DiagScreen({
        device: state.device,
        fehlerzustand: state.fehlerzustand,
        onSelectCandidate: diagSelectCandidate,
        onAbgrenzung: diagAbgrenzungAnswer,
        onWeiter: diagWeiter,
        onUnklar: diagUnclear,
        onBack: function () {
          var n = (state.device && state.device.triage && state.device.triage.length) || 0;
          if (n > 0) { state.ti = n - 1; setStage('triage'); }
          else { state.ti = 0; setStage('univtriage'); }
          commit();
        },
        onProtocol: openProto,
        lang: state.lang,
        lotseOptionen: state.lotseOptionen, onLotseAktion: lotseAktion,
      });
    }
    if (s === 'univtriage') {
      var ftValU = (state.draftFree[state.ti] != null)
        ? state.draftFree[state.ti]
        : ((state.answers[state.ti] && state.answers[state.ti].freitext) || '');
      return window.UnivTriageScreen({
        device: state.device, fragen: (state.univ && state.univ.fragen) || [], index: state.ti,
        freitext: ftValU, onAnswer: univAnswer, setFreitext: setFreitext, onBack: univBack,
        onSkip: function () { afterTriage(); }, onProtocol: openProto,
        showConsentGate: needsConsentGate(),
        onConsentErteilen: consentErteilen, onConsentAblehnen: consentAblehnen,
        consent: state.consent, onConsentRevoke: consentWiderrufen,
        lotseOptionen: state.lotseOptionen, onLotseAktion: lotseAktion,
      });
    }
    if (s === 'ampel') {
      return window.AmpelScreen({
        device: state.device, trust: state.trust,
        defekte: state.defekte, gesamtFazit: state.gesamtFazit,
        onContinue: ampelContinue,
        onBack: function () {
          if (state.fehlerzustand && state.fehlerzustand.kandidaten && state.fehlerzustand.kandidaten.length > 0) {
            setStage('diag');
          } else if (state.device && state.device.triage && state.device.triage.length) {
            state.ti = state.device.triage.length - 1; setStage('triage');
          } else {
            state.ti = 0; setStage('univtriage');
          }
          render();
        },
        onProtocol: openProto,
        conf: state.ui.conf, setConf: setConf,
        activeLight: state.ui.activeLight, setActiveLight: setActiveLight,
        lotseOptionen: state.lotseOptionen, onLotseAktion: lotseAktion,
      });
    }
    if (s === 'decision') {
      return window.DecisionScreen({
        device: state.device, foerder: state.foerder, trust: state.trust, onChoose: choose,
        onBack: function () { setStage('ampel'); render(); },
        onProtocol: openProto,
        lotseOptionen: state.lotseOptionen, onLotseAktion: lotseAktion,
      });
    }
    if (s === 'wipe') {
      return window.WipeScreen({
        device: state.device,
        datenloeschung: state.datenloeschung,
        onToggle: toggleWipeStep,
        onSkip: wipeSkip,
        onWeiter: wipeContinue,
        onBack: function () { setStage('decision'); loadFoerder(); render(); },
        onProtocol: openProto,
        lang: state.lang,
      });
    }
    if (s === 'vermittlung') {
      return window.VermittlungScreen({
        device: state.device, anbieter: state.anbieter, vermittlung: state.vermittlung,
        ort: state.ort, setOrt: setOrt, onSearch: function () { state.ort = (state.ort || ''); loadAnbieter(true); if (state.id) persist(); },
        onSelect: selectAnbieter,
        onBack: function () { setStage('decision'); loadFoerder(); render(); },
        onProtocol: openProto, onRestart: reset,
        lotseOptionen: state.lotseOptionen, onLotseAktion: lotseAktion,
      });
    }
    if (s === 'entsorgung') {
      return window.EntsorgungScreen({
        device: state.device, entsorgung: state.entsorgungList, entsorgungSel: state.entsorgung,
        ort: state.ort, setOrt: setOrt, onSearch: function () { state.ort = (state.ort || ''); loadEntsorgung(true); if (state.id) persist(); },
        onSelect: selectEntsorgung,
        onBack: function () { setStage('decision'); loadFoerder(); render(); },
        onProtocol: openProto, onRestart: reset,
        lotseOptionen: state.lotseOptionen, onLotseAktion: lotseAktion,
      });
    }
    if (s === 'produktsuche') {
      return window.ProduktsucheScreen({
        device: state.device, alternativen: state.alternativen, produktsuche: state.produktsuche,
        onSelect: selectAlternative,
        onBack: function () { setStage('decision'); loadFoerder(); render(); },
        onProtocol: openProto, onRestart: reset,
        lotseOptionen: state.lotseOptionen, onLotseAktion: lotseAktion,
      });
    }
    if (s === 'beschaffung') {
      return window.BeschaffungScreen({
        device: state.device, ersatzteile: state.ersatzteile, beschaffung: state.beschaffung,
        onKeep: keepPart,
        onBack: function () { setStage('repair'); commit(); },
        onProtocol: openProto,
      });
    }
    if (s === 'skillask') {
      return window.SkillAskScreen({
        device: state.device, skill: state.skill,
        onPick: pickSkill, onOut: skillOut,
        onBack: function () { setStage('decision'); loadFoerder(); render(); }, onProtocol: openProto,
      });
    }
    if (s === 'gate') {
      return window.GateScreen({
        device: state.device, warranty: state.warranty,
        onAnswer: gateAnswer, onProceed: gateProceed, onReklamation: gateReklamation,
        onBack: function () { setStage('decision'); loadFoerder(); render(); }, onProtocol: openProto,
      });
    }
    if (s === 'repair') {
      var step = state.device.steps[state.ri];
      var needsConfirm = needsSafetyConfirm(step) && !state.safetyConfirms[state.ri];
      return window.RepairScreen({
        device: state.device, index: state.ri, depth: state.depth,
        needsConfirm: needsConfirm,
        confirmAdult: state.ui.confirmAdult, confirmConfident: state.ui.confirmConfident,
        setConfirmAdult: setConfirmAdult, setConfirmConfident: setConfirmConfident, onConfirm: confirmSafety,
        onNext: repairNext, onPrev: repairPrev,
        onExit: goPro, onDepth: setDepth, onFinish: repairFinish, onProtocol: openProto,
        onParts: openParts,
      });
    }
    if (s === 'result') {
      return window.ResultScreen({
        device: state.device, onRestart: reset, onPro: goPro, onProtocol: openProto,
        phase: state.ui.phase, setPhase: setPhase,
      });
    }
    if (s === 'path') {
      return window.PathScreen({
        device: state.device, path: state.path, onRestart: reset, onProtocol: openProto,
        lotseOptionen: state.lotseOptionen, onLotseAktion: lotseAktion,
      });
    }
    return LoadingScreen();
  }

  /* ===================== RENDER / MOUNT ===================== */
  function render() {
    if (!state.appEl) return;
    var screen = currentScreen();
    var protoBody = state.device
      ? window.ProtocolContent({
        device: state.device, answers: state.answers, why: state.ui.why,
        ownership: state.ownership, skill: state.skill, warranty: state.warranty, diagnosis: state.diagnosis,
        safetyConfirms: state.safetyConfirms,
        setWhy: setWhy,
        onExportPdf: exportPdf, onExportText: exportText, onExportLink: exportLink, onCopyLink: copyLink,
        linkUrl: state.linkUrl,
        // Stufe-2: Auswahlen + Vertrauen + geladene Listen (zur Label-Auflösung)
        trust: state.trust,
        vermittlung: state.vermittlung, entsorgungSel: state.entsorgung,
        produktsuche: state.produktsuche, beschaffung: state.beschaffung,
        anbieter: state.anbieter, entsorgung: state.entsorgungList,
        alternativen: state.alternativen, ersatzteile: state.ersatzteile,
        // Stufe-3
        consent: state.consent, rueckruf: state.rueckruf,
        datenloeschung: state.datenloeschung, abgabe: state.abgabe,
        defekte: state.defekte, gesamtFazit: state.gesamtFazit,
        schwungrad: state.schwungrad, medien: state.medien,
        lang: state.lang,
        onConsentRevoke: consentWiderrufen,
      })
      : h('p', { class: 'rk-sheet-note' }, t('proto.emptyDevice'));
    var protoSheet = Sheet({ open: state.proto, onClose: closeProto, title: t('proto.title'), children: protoBody });
    // Medien-Consent-Sheet (PROJ-27) - modal over everything
    var mediaConsentSheet = null;
    if (state.ui.mediaConsentOpen) {
      mediaConsentSheet = window.MediaConsentSheet({
        onAccept: medienConsentErteilen,
        onDecline: medienConsentAblehnen,
        lang: state.lang,
      });
    }
    var kids = [screen];
    if (protoSheet) kids.push(protoSheet);
    if (mediaConsentSheet) kids.push(mediaConsentSheet);
    state.appEl.replaceChildren.apply(state.appEl, kids);
  }

  function buildPhone() {
    var theme = THEMES[state.themeId];
    var vars = Object.assign({}, DEFAULT_VARS, theme.vars);
    var app = h('div', {
      class: 'rk-app rk-theme-' + theme.id + ' rk-case-' + theme.flags.labelCase,
      style: { fontSize: 'var(--font-size)' },
    });
    state.appEl = app;
    var phone = PhoneFrame({ vars: vars, chrome: theme.flags.chrome, children: app });
    state.phoneEl = phone;
    var canvas = h('div', { class: 'rk-canvas' }, phone);
    var root = document.getElementById('phone-root');
    root.replaceChildren(canvas);
    render();
  }

  function buildThemeSwitch() {
    var wrap = document.getElementById('theme-switch');
    if (!wrap) return;
    var order = ['solide', 'werkstatt', 'mutig'];
    function paint() {
      var btns = wrap.querySelectorAll('button[data-id]');
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute('data-id') === state.themeId;
        btns[i].className = 'rk-themebtn' + (on ? ' rk-themebtn-on' : '');
        btns[i].setAttribute('aria-selected', on ? 'true' : 'false');
      }
    }
    order.forEach(function (id) {
      var btn = h('button', {
        class: 'rk-themebtn', 'data-id': id, role: 'tab',
        onClick: function () { state.themeId = id; buildPhone(); paint(); if (state.id) persist(); },
      }, THEMES[id].label);
      wrap.appendChild(btn);
    });
    paint();
  }

  /* ===================== SPRACH-SWITCHER (PROJ-24) =====================
     Die App ist Deutsch-only — kein Umschalter mehr nötig. Container wird
     ausgeblendet, damit kein versehentliches Wechseln in eine andere Sprache
     möglich ist. */
  function buildLangSwitch() {
    var wrap = document.getElementById('lang-switch');
    if (!wrap) return;
    wrap.innerHTML = '';
    wrap.style.display = 'none';
  }

  /* ===================== INIT (inkl. ?v= Hydrierung PROJ-9) ===================== */
  function init() {
    buildThemeSwitch();
    buildLangSwitch();
    var v = null;
    try { v = new URLSearchParams(location.search).get('v'); } catch (e) { v = null; }
    if (v) {
      state.loading = true;
      buildPhone();
      fetch('/api/vorgang/' + encodeURIComponent(v))
        .then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); })
        .then(function (res) {
          hydrate(res.state || {});
          state.id = (res && res.id) || v;
          state.loading = false;
          buildPhone();
          buildLangSwitch();
          if (state.stage === 'decision' || state.stage === 'skillask' || state.stage === 'gate') loadFoerder();
          // Stufe-2: neue Stages wiederherstellen (Daten nachladen)
          if (state.stage === 'univtriage') loadUniv();
          if (state.stage === 'vermittlung') loadAnbieter();
          if (state.stage === 'entsorgung') loadEntsorgung();
          if (state.stage === 'produktsuche') loadAlternativen();
          if (state.stage === 'beschaffung') loadErsatzteile();
          // Stufe-3: Lotse-Route abrufen (PROJ-18)
          loadLotseOptionen();
          // Rückruf nachladen falls device vorhanden (PROJ-19)
          if (state.device) loadRueckruf();
        })
        .catch(function () {
          state.loading = false;
          try { history.replaceState(null, '', location.pathname); } catch (e) {}
          toast(t('toast.vorgangNotFound'));
          setStage('start');
          buildPhone();
        });
    } else {
      buildPhone();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RepairAppState = state; // Debug-Hook
  window.RKsetLang = setLang;   // für lang-switch
})();
