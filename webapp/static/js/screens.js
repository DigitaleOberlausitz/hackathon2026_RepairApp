/* screens.js — die einzelnen Bildschirme der Repair-App als Vanilla-JS-DOM-Fabriken.
   Port von repair-screens.jsx. Liest Bausteine aus window (ui.js).
   Lokaler UI-State (Sheets, Result-Phase, Protokoll-Aufklappen) wird von app.js
   gehalten und über Setter-Callbacks + props hereingereicht. */
(function () {
  'use strict';

  var h = window.h;
  var Screen = window.Screen, AppBar = window.AppBar, IconBtn = window.IconBtn;
  var BigButton = window.BigButton, GhostButton = window.GhostButton, AnswerChip = window.AnswerChip;
  var ProgressDots = window.ProgressDots, levelMeta = window.levelMeta, LightRow = window.LightRow;
  var Slot = window.Slot, Sheet = window.Sheet, TrustBadge = window.TrustBadge;

  /* ---- Icons ---- */
  function BackIcon() {
    return h('svg', { width: '20', height: '20', viewBox: '0 0 20 20', fill: 'none' },
      h('path', { d: 'M12.5 4.5 7 10l5.5 5.5', stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  }
  function DocIcon() {
    return h('svg', { width: '19', height: '19', viewBox: '0 0 20 20', fill: 'none' },
      h('rect', { x: '4.5', y: '2.8', width: '11', height: '14.4', rx: '2', stroke: 'currentColor', 'stroke-width': '1.5' }),
      h('path', { d: 'M7.3 6.6h5.4M7.3 9.6h5.4M7.3 12.6h3.2', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' }));
  }
  function SpeakIcon() {
    return h('svg', { width: '18', height: '18', viewBox: '0 0 20 20', fill: 'none' },
      h('path', { d: 'M4 8v4h2.5L10 15V5L6.5 8H4Z', fill: 'currentColor' }),
      h('path', { d: 'M12.5 7.5a3.4 3.4 0 0 1 0 5M14.4 5.4a6 6 0 0 1 0 9.2', stroke: 'currentColor', 'stroke-width': '1.4', 'stroke-linecap': 'round' }));
  }

  function deviceTitle(device) {
    return h('span', { class: 'rk-bar-device' }, h('span', {}, device.emoji), device.name);
  }

  function deviceRow(d, onClick, sheet) {
    return h('button', { class: 'rk-device' + (sheet ? ' rk-device-sheet' : ''), onClick: onClick },
      h('span', { class: 'rk-device-e' }, d.emoji),
      h('span', { class: 'rk-device-main' },
        h('span', { class: 'rk-device-name' }, d.name),
        h('span', { class: 'rk-device-sub' }, d.blurb)
      ),
      h('span', { class: 'rk-device-go' }, '→')
    );
  }

  /* ===================== START ===================== */
  function StartScreen(props) {
    var devices = props.devices || {};
    var deviceList = Object.keys(devices).map(function (k) { return devices[k]; });
    var methods = [
      { e: '📝', t: 'Tippen oder einsprechen' },
      { e: '📷', t: 'Foto machen' },
      { e: '🔖', t: 'Etikett scannen' },
    ];

    var input = h('button', { class: 'rk-input', onClick: function () { props.setChooser(true); } },
      h('span', { class: 'rk-input-ph' }, '„Mein Toaster wirft das Brot nicht mehr aus …“'),
      h('span', { class: 'rk-input-mic' }, '🎙️')
    );
    // Freitext-Eingabe für die Live-Diagnose (POST /api/diagnose).
    if (props.onDiagnose) {
      input = h('div', { class: 'rk-input' },
        h('input', {
          class: 'rk-input-ph', type: 'text',
          placeholder: '„Mein Toaster wirft das Brot nicht mehr aus …“',
          value: props.draft || '',
          style: { flex: '1', minWidth: '0', border: '0', background: 'transparent', outline: 'none', font: 'inherit', color: 'inherit' },
          onInput: function (e) { props.setDraft(e.target.value); },
          onKeydown: function (e) { if (e.key === 'Enter') { e.preventDefault(); props.onDiagnose(); } }
        }),
        h('span', { class: 'rk-input-mic', onClick: function () { props.onDiagnose(); } }, '🎙️')
      );
    }

    return Screen({
      bar: null,
      children: [
        h('div', { class: 'rk-brand' },
          h('span', { class: 'rk-brand-mark' }, '🔧'),
          h('span', { class: 'rk-brand-name' }, 'Reparatur-Helfer')
        ),
        h('h1', { class: 'rk-hero' }, 'Was ist', h('br', {}), 'kaputt?'),
        h('p', { class: 'rk-hero-sub' }, 'Erzähl einfach, was los ist — als würdest du es einem Bekannten beschreiben.'),
        input,
        h('div', { class: 'rk-methods' }, methods.map(function (m) {
          return h('button', { class: 'rk-method', onClick: function () { props.setChooser(true); } },
            h('span', { class: 'rk-method-e' }, m.e),
            h('span', { class: 'rk-method-t' }, m.t)
          );
        })),
        h('div', { class: 'rk-mine' },
          h('div', { class: 'rk-mine-head' }, 'Meine Geräte'),
          deviceList.map(function (d) { return deviceRow(d, function () { props.onPick(d.id); }, false); })
        ),
        Sheet({
          open: props.chooser, onClose: function () { props.setChooser(false); }, title: 'Beispiel zum Ausprobieren',
          children: [
            h('p', { class: 'rk-sheet-note' }, 'In dieser Demo sind zwei Geräte hinterlegt — eines geht gut aus, eines ist ein klarer Fall fürs Abraten.'),
            deviceList.map(function (d) {
              return deviceRow(d, function () { props.setChooser(false); props.onPick(d.id); }, true);
            })
          ]
        })
      ]
    });
  }

  /* ===================== TRIAGE ===================== */
  function TriageScreen(props) {
    var device = props.device, index = props.index;
    var q = device.triage[index];
    var n = device.triage.length;
    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: IconBtn({ onClick: props.onProtocol, label: 'Protokoll', children: DocIcon() })
      }),
      footer: h('div', { class: 'rk-triage-foot' }, 'Frage ' + (index + 1) + ' von ' + n + ' · ich frage nur so viel, wie ich brauche'),
      children: [
        ProgressDots({ n: n, i: index }),
        h('div', { class: 'rk-eyebrow' }, 'Nachfragen'),
        h('h2', { class: 'rk-q' }, q.q),
        h('p', { class: 'rk-q-hint' }, q.hint),
        h('div', { class: 'rk-answers' }, q.options.map(function (o) {
          return AnswerChip({ onClick: function () { props.onAnswer(q.q, o.a, o.tag); }, children: o.a });
        })),
        h('button', { class: 'rk-freeanswer', onClick: function () { props.onAnswer(q.q, 'frei beschrieben', 'frei beschrieben'); } },
          h('span', {}, 'Frei antworten …'),
          h('span', { class: 'rk-input-mic' }, '🎙️')
        )
      ]
    });
  }

  /* ===================== AMPEL ===================== */
  function AmpelScreen(props) {
    var device = props.device;
    var stop = device.accentPath === 'stop';
    var activeLight = props.activeLight;
    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: IconBtn({ onClick: props.onProtocol, label: 'Protokoll', children: DocIcon() })
      }),
      footer: BigButton({ variant: 'primary', onClick: props.onContinue, children: 'Was möchtest du tun?' }),
      children: [
        h('div', { class: 'rk-eyebrow' }, 'Einschätzung'),
        h('h2', { class: 'rk-q rk-q-tight' }, 'Worauf du dich einlässt'),
        h('div', { class: 'rk-ampelcard' }, device.lights.map(function (l) {
          return LightRow({ light: l, onInfo: function () { props.setActiveLight(l); } });
        })),
        h('div', { class: 'rk-verdict ' + (stop ? 'rk-verdict-stop' : 'rk-verdict-go') },
          h('div', { class: 'rk-verdict-title' }, (stop ? '🔴 ' : '🟢 ') + device.verdictTitle),
          h('p', { class: 'rk-verdict-body' }, device.verdictBody)
        ),
        TrustBadge({ confidence: device.confidence, onClick: function () { props.setConf(true); } }),
        h('div', { class: 'rk-aiwarn ' + (stop ? 'rk-aiwarn-strong' : '') },
          (stop ? '⚠️ Besonders hier gilt: ' : '') + 'Die KI kann sich irren — sieh das als Orientierung, nicht als Urteil.'
        ),
        Sheet({
          open: !!activeLight, onClose: function () { props.setActiveLight(null); },
          title: activeLight ? (activeLight.icon + ' ' + activeLight.key) : '',
          children: activeLight ? [
            h('p', { class: 'rk-sheet-note', style: { color: levelMeta(activeLight.level).ink } }, activeLight.note),
            h('div', { class: 'rk-sheet-level' },
              h('span', { class: 'rk-light-face', style: { background: levelMeta(activeLight.level).dot } }),
              levelMeta(activeLight.level).face + ' Bewertung: ' + levelMeta(activeLight.level).label
            )
          ] : null
        }),
        Sheet({
          open: props.conf, onClose: function () { props.setConf(false); }, title: 'Woher kommt diese Einschätzung?',
          children: [
            h('p', { class: 'rk-sheet-note' }, 'Quelle: ', h('b', {}, device.confidence.source)),
            h('p', { class: 'rk-sheet-note' }, 'Wie sicher: ', h('b', {}, device.confidence.level)),
            h('p', { class: 'rk-sheet-note' }, device.confidence.note),
            h('div', { class: 'rk-sheet-hr' }),
            h('p', { class: 'rk-sheet-fine' }, 'Die App verbietet dir nichts — je riskanter die Sache, desto deutlicher die Warnung. Die Verantwortung für dein Handeln bleibt bei dir.')
          ]
        })
      ]
    });
  }

  /* ===================== ENTSCHEIDUNG ===================== */
  function DecisionScreen(props) {
    var device = props.device;
    var stop = device.accentPath === 'stop';
    var paths = [
      { key: 'self', e: '🛠️', t: "Ich mach's selbst", s: 'Schritt für Schritt begleitet' },
      { key: 'local', e: '🤝', t: 'Hilfe vor Ort finden', s: 'Repair Cafés & Werkstätten in der Nähe' },
      { key: 'pro', e: '🏪', t: 'Profi beauftragen', s: 'mit fertigem Protokoll für die Werkstatt' },
      { key: 'replace', e: '♻️', t: 'Ersetzen / entsorgen', s: 'inkl. fachgerechtem Entsorgungsweg' },
    ];
    var compareRows = stop ? [
      ['💶 Geld', device.compare.repair.geld, device.compare.neu.geld],
      ['⏱️ Zeit', device.compare.repair.zeit, device.compare.neu.zeit],
      ['🌍 Umwelt', device.compare.repair.umwelt, device.compare.neu.umwelt]
    ] : [];
    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: IconBtn({ onClick: props.onProtocol, label: 'Protokoll', children: DocIcon() })
      }),
      children: [
        h('div', { class: 'rk-eyebrow' }, 'Entscheidung'),
        h('h2', { class: 'rk-q rk-q-tight' }, 'Du entscheidest.'),
        h('p', { class: 'rk-q-hint' }, stop
          ? 'Ehrlich: Selbst öffnen wäre gefährlich. Ich empfehle Hilfe vor Ort — du wägst ab.'
          : 'Ich empfehle, es selbst zu probieren. Aber du hast die Wahl.'),
        stop ? h('div', { class: 'rk-compare' },
          h('div', { class: 'rk-compare-head' }, h('span', {}), h('span', {}, 'Reparieren'), h('span', {}, 'Neu kaufen')),
          compareRows.map(function (r) {
            return h('div', { class: 'rk-compare-row' },
              h('span', { class: 'rk-compare-k' }, r[0]),
              h('span', {}, r[1]),
              h('span', {}, r[2])
            );
          })
        ) : null,
        h('div', { class: 'rk-paths' }, paths.map(function (p) {
          return BigButton({
            variant: device.recommend === p.key ? 'primary' : 'soft',
            recommend: device.recommend === p.key,
            emoji: p.e, sub: p.s,
            onClick: function () { props.onChoose(p.key); },
            children: p.t
          });
        }))
      ]
    });
  }

  /* ===================== REPARATUR-BEGLEITUNG ===================== */
  function RepairScreen(props) {
    var device = props.device, index = props.index, depth = props.depth;
    var step = device.steps[index];
    var n = device.steps.length;
    var last = index === n - 1;
    var body = depth === 'Geübt' ? step.pro : step.beginner;

    var callout = null;
    if (step.danger) {
      callout = h('div', { class: 'rk-callout rk-callout-danger' }, '☠️ Lebensgefahr möglich — bitte genau lesen.');
    } else if (step.safety) {
      callout = h('div', { class: 'rk-callout rk-callout-safety' },
        '⚡ Sicherheit zuerst: ' + (step.title === 'Stecker ziehen' ? 'erst ausstecken!' : 'aufpassen.'));
    }

    var navrow = h('div', { class: 'rk-navrow' },
      index > 0 ? h('button', { class: 'rk-nav rk-nav-ghost', onClick: props.onPrev }, 'Zurück') : h('span', {}),
      h('button', { class: 'rk-nav rk-nav-primary', onClick: last ? props.onFinish : props.onNext },
        last ? (step.handoff ? 'Zum Profi & Protokoll →' : 'Fertig — hat’s geklappt?') : 'Weiter →')
    );

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onPrev, label: 'Zurück', children: BackIcon() }),
        title: h('span', { class: 'rk-bar-step' }, 'Schritt ' + (index + 1) + '/' + n),
        right: IconBtn({ onClick: props.onProtocol, label: 'Protokoll', children: DocIcon() })
      }),
      footer: h('div', { class: 'rk-repair-foot' },
        GhostButton({ onClick: props.onExit, children: 'Das wird mir zu heikel — Profi finden' }),
        navrow
      ),
      children: [
        h('div', { class: 'rk-repair-tools' },
          h('div', { class: 'rk-depth' },
            h('button', { class: depth === 'Anfänger' ? 'on' : '', onClick: function () { props.onDepth('Anfänger'); } }, 'Anfänger'),
            h('button', { class: depth === 'Geübt' ? 'on' : '', onClick: function () { props.onDepth('Geübt'); } }, 'Geübt')
          ),
          h('button', { class: 'rk-speak' }, SpeakIcon(), ' Vorlesen')
        ),
        Slot({ label: step.slot, h: 158 }),
        callout,
        h('h2', { class: 'rk-step-title' }, step.title),
        h('p', { class: 'rk-step-body' }, body),
        step.handoff ? h('div', { class: 'rk-handoff' }, '📎 Dein Protokoll wird automatisch mitgegeben — die Werkstatt muss nicht bei null anfangen.') : null
      ]
    });
  }

  /* ===================== RÜCKBLICK (Selbst-Reparatur) ===================== */
  function ResultScreen(props) {
    var device = props.device;
    var phase = props.phase || 'ask';
    if (phase === 'ask') {
      return Screen({
        bar: AppBar({
          left: h('span', {}),
          title: deviceTitle(device),
          right: IconBtn({ onClick: props.onProtocol, label: 'Protokoll', children: DocIcon() })
        }),
        children: [
          h('div', { class: 'rk-result-center' },
            h('div', { class: 'rk-result-emoji' }, '🤞'),
            h('h2', { class: 'rk-result-q' }, 'Hat’s geklappt?'),
            h('p', { class: 'rk-q-hint', style: { textAlign: 'center' } }, 'Ganz ehrlich — beides ist völlig in Ordnung.'),
            h('div', { class: 'rk-result-btns' },
              h('button', { class: 'rk-nav rk-nav-primary rk-big-yes', onClick: function () { props.setPhase('yes'); } }, 'Ja! 🎉'),
              h('button', { class: 'rk-nav rk-nav-ghost rk-big-no', onClick: function () { props.setPhase('no'); } }, 'Noch nicht')
            )
          )
        ]
      });
    }
    if (phase === 'yes') {
      return Screen({
        bar: AppBar({
          left: h('span', {}),
          title: deviceTitle(device),
          right: IconBtn({ onClick: props.onProtocol, label: 'Protokoll', children: DocIcon() })
        }),
        footer: GhostButton({ full: true, onClick: props.onRestart, children: 'Zur Startseite' }),
        children: [
          h('div', { class: 'rk-win' },
            h('div', { class: 'rk-result-emoji' }, '🎉'),
            h('h2', { class: 'rk-result-q' }, 'Geschafft!'),
            h('p', { class: 'rk-q-hint', style: { textAlign: 'center' } }, device.success.line),
            h('div', { class: 'rk-impact' },
              h('div', { class: 'rk-impact-cell' }, h('span', { class: 'rk-impact-num' }, device.success.saved), h('span', { class: 'rk-impact-lab' }, 'gespart')),
              h('div', { class: 'rk-impact-cell' }, h('span', { class: 'rk-impact-num' }, device.success.co2), h('span', { class: 'rk-impact-lab' }, 'vermieden')),
              h('div', { class: 'rk-impact-cell' }, h('span', { class: 'rk-impact-num' }, '1'), h('span', { class: 'rk-impact-lab' }, 'Gerät gerettet'))
            ),
            h('p', { class: 'rk-win-foot' }, 'Und ein Stück Selbstvertrauen fürs nächste Mal. Im Reparatur-Tagebuch festgehalten.')
          )
        ]
      });
    }
    // phase === 'no'
    return Screen({
      bar: AppBar({
        left: h('span', {}),
        title: deviceTitle(device),
        right: IconBtn({ onClick: props.onProtocol, label: 'Protokoll', children: DocIcon() })
      }),
      footer: BigButton({ variant: 'primary', emoji: '🏪', sub: 'dein Protokoll geht automatisch mit', onClick: props.onPro, children: 'Profi finden' }),
      children: [
        h('div', { class: 'rk-win' },
          h('div', { class: 'rk-result-emoji' }, '🧭'),
          h('h2', { class: 'rk-result-q' }, 'Kein Vorwurf.'),
          h('p', { class: 'rk-q-hint', style: { textAlign: 'center' } }, 'Du hast das Problem systematisch eingegrenzt — das war goldrichtig. Jetzt hilft dir ein Profi schneller, weil die halbe Arbeit schon getan ist.')
        )
      ]
    });
  }

  /* ===================== WEG-ERGEBNIS (lokal / profi / ersetzen) ===================== */
  function PathScreen(props) {
    var device = props.device;
    var map = {
      local: { e: '🤝', t: 'Hilfe vor Ort', body: 'In deiner Nähe gibt es Repair Cafés und Werkstätten. Nimm dein Protokoll mit — so versteht jede helfende Person dein Problem sofort.', slot: 'Karte mit Repair Cafés' },
      pro: { e: '🏪', t: 'Profi beauftragen', body: 'Dein Reparatur-Steckbrief geht direkt an die Werkstatt. Der Mechaniker fängt nicht bei null an — das spart Zeit und Geld.', slot: 'Werkstatt-Anfrage gesendet' },
      replace: { e: '♻️', t: 'Fachgerecht ersetzen', body: 'Wenn ein Neukauf wirklich klüger ist, ist das auch in Ordnung. So entsorgst du das alte Gerät richtig — und nimmst Rohstoffe in den Kreislauf zurück.', slot: 'Wertstoffhof in der Nähe' },
    }[props.path];
    return Screen({
      bar: AppBar({
        left: h('span', {}),
        title: deviceTitle(device),
        right: IconBtn({ onClick: props.onProtocol, label: 'Protokoll', children: DocIcon() })
      }),
      footer: GhostButton({ full: true, onClick: props.onRestart, children: 'Zur Startseite' }),
      children: [
        h('div', { class: 'rk-result-emoji', style: { marginTop: '6px' } }, map.e),
        h('h2', { class: 'rk-result-q', style: { textAlign: 'left' } }, map.t),
        h('p', { class: 'rk-q-hint' }, map.body),
        Slot({ label: map.slot, h: 150 }),
        h('button', { class: 'rk-share-line', onClick: props.onProtocol }, DocIcon(), ' Protokoll ansehen & teilen')
      ]
    });
  }

  /* ===================== PROTOKOLL (Steckbrief) ===================== */
  function ProtocolContent(props) {
    var device = props.device, answers = props.answers || [];
    var why = props.why;
    var summary = device.lights.map(function (l) { return l.icon + ' ' + levelMeta(l.level).face; }).join('   ');
    return h('div', { class: 'rk-proto' },
      h('div', { class: 'rk-proto-head' },
        h('span', { class: 'rk-proto-e' }, device.emoji),
        h('div', {},
          h('div', { class: 'rk-proto-name' }, device.name),
          h('div', { class: 'rk-proto-detail' }, device.detail)
        )
      ),
      h('div', { class: 'rk-proto-sec' }, 'Symptom'),
      h('div', { class: 'rk-proto-val' }, device.blurb),
      h('div', { class: 'rk-proto-sec' }, 'Was schon getestet wurde'),
      h('div', { class: 'rk-proto-tags' },
        answers.length
          ? answers.map(function (a) { return h('span', { class: 'rk-proto-tag' }, a.tag); })
          : h('span', { class: 'rk-proto-tag rk-proto-tag-muted' }, 'noch nichts erfasst')
      ),
      h('div', { class: 'rk-proto-sec' }, 'Wahrscheinliche Ursache & Ampel'),
      h('div', { class: 'rk-proto-val' }, device.verdictTitle),
      h('div', { class: 'rk-proto-ampel' }, summary),
      h('button', { class: 'rk-proto-why', onClick: function () { props.setWhy(!why); } },
        (why ? '▾' : '▸') + ' Warum schätzt die App das so ein?'),
      why ? h('div', { class: 'rk-proto-reason' },
        h('p', {}, device.verdictBody),
        h('p', { class: 'rk-sheet-fine' }, 'Quelle: ' + device.confidence.source + ' · Sicherheit: ' + device.confidence.level + '. Die KI kann sich irren.')
      ) : null,
      h('div', { class: 'rk-proto-owner' }, '👤 Gerät gehört: ', h('b', {}, 'mir'), ' · Kosten trägt: ', h('b', {}, 'ich')),
      h('div', { class: 'rk-proto-share' },
        [['💬', 'Nachricht'], ['📄', 'PDF'], ['🔗', 'Link']].map(function (s) {
          return h('button', { class: 'rk-share-btn' }, h('span', {}, s[0]), s[1]);
        })
      )
    );
  }

  Object.assign(window, {
    StartScreen: StartScreen, TriageScreen: TriageScreen, AmpelScreen: AmpelScreen,
    DecisionScreen: DecisionScreen, RepairScreen: RepairScreen, ResultScreen: ResultScreen,
    PathScreen: PathScreen, ProtocolContent: ProtocolContent,
  });
})();
