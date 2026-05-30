/* screens.js — die einzelnen Bildschirme der Repair-App als Vanilla-JS-DOM-Fabriken.
   Port von repair-screens.jsx + Stufe-1-Erweiterungen (PROJ-1…10).
   Liest Bausteine aus window (ui.js). Lokaler UI-State (Sheets, Result-Phase,
   Protokoll-Aufklappen, Drafts) wird von app.js gehalten und über Setter-Callbacks
   + props hereingereicht. */
(function () {
  'use strict';

  var h = window.h;
  var Screen = window.Screen, AppBar = window.AppBar, IconBtn = window.IconBtn;
  var BigButton = window.BigButton, GhostButton = window.GhostButton, AnswerChip = window.AnswerChip;
  var ProgressDots = window.ProgressDots, levelMeta = window.levelMeta, LightRow = window.LightRow;
  var Slot = window.Slot, Sheet = window.Sheet, TrustBadge = window.TrustBadge;
  var normTrustLevel = window.normTrustLevel;

  /* ---- i18n helper (PROJ-24) — delegates to app.js catalog via window.RKt ---- */
  function t(key) {
    return (window.RKt && window.RKt(key)) || key;
  }

  /* ---- Vertrauen aus state.trust ODER device.confidence ableiten (PROJ-25) ---- */
  function deriveTrust(trust, device) {
    var tr = trust || {};
    var conf = (device && device.confidence) || {};
    return {
      level: tr.level || normTrustLevel(conf.level),
      source: tr.source || conf.source || 'kuratiert',
      reason: tr.reason || conf.note || '',
    };
  }

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

  function docBtn(onClick) {
    return IconBtn({ onClick: onClick, label: 'Protokoll', children: DocIcon() });
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
    var lang = props.lang || 'de';

    // PROJ-27: Voice-Ergebnis in Freitext einfügen
    function handleVoiceResult(transcript) {
      if (props.setDraft) props.setDraft(transcript);
      // In das Input-Feld schreiben falls vorhanden
      var inp = document.querySelector('.rk-input-ph[type=”text”]');
      if (inp) { inp.value = transcript; }
    }

    var input = h('button', { class: 'rk-input', onClick: function () { props.setChooser(true); } },
      h('span', { class: 'rk-input-ph' }, '„Mein Toaster wirft das Brot nicht mehr aus …”'),
      h('span', { class: 'rk-input-mic' }, '🎙️')
    );
    if (props.onDiagnose) {
      input = h('div', { class: 'rk-input' },
        h('input', {
          class: 'rk-input-ph', type: 'text',
          placeholder: lang === 'en'
            ? '”My toaster doesn\'t pop the bread up anymore …”'
            : '„Mein Toaster wirft das Brot nicht mehr aus …”',
          value: props.draft || '',
          style: { flex: '1', minWidth: '0', border: '0', background: 'transparent', outline: 'none', font: 'inherit', color: 'inherit' },
          onInput: function (e) { props.setDraft(e.target.value); },
          onKeydown: function (e) { if (e.key === 'Enter') { e.preventDefault(); props.onDiagnose(); } }
        }),
        h('span', { class: 'rk-input-mic', onClick: function () { props.onDiagnose(); } }, '🎙️')
      );
    }

    // PROJ-27: echte Modalitäts-Buttons (MediaPanel)
    var mediaPanel = window.MediaPanel ? window.MediaPanel({
      medienConsent: props.medienConsent,
      medien: props.medien || [],
      lang: lang,
      setMediaConsentOpen: props.setMediaConsentOpen,
      uploadMedium: props.uploadMedium,
      removeMedium: props.removeMedium,
      onVoiceResult: handleVoiceResult,
      onBarcodeResult: function (val) {
        if (props.setDraft) props.setDraft(val);
      },
    }) : null;

    var consentGate = ConsentGateOverlay({
      show: !!props.showConsentGate,
      onErteilen: props.onConsentErteilen,
      onAblehnen: props.onConsentAblehnen,
    });

    var children = [
      consentGate,
      h('div', { class: 'rk-brand' },
        h('span', { class: 'rk-brand-mark' }, '🔧'),
        h('span', { class: 'rk-brand-name' }, lang === 'en' ? 'Repair Helper' : 'Reparatur-Helfer')
      ),
      h('h1', { class: 'rk-hero' }, lang === 'en' ? 'What is' : 'Was ist', h('br', {}), lang === 'en' ? 'broken?' : 'kaputt?'),
      h('p', { class: 'rk-hero-sub' }, lang === 'en'
        ? 'Just describe what\'s happening — as if you were telling a friend.'
        : 'Erzähl einfach, was los ist — als würdest du es einem Bekannten beschreiben.'),
      input,
      mediaPanel,
      h('div', { class: 'rk-mine' },
        h('div', { class: 'rk-mine-head' }, lang === 'en' ? 'My devices' : 'Meine Geräte'),
        deviceList.map(function (d) { return deviceRow(d, function () { props.onPick(d.id); }, false); })
      ),
      Sheet({
        open: props.chooser, onClose: function () { props.setChooser(false); },
        title: lang === 'en' ? 'Example to try' : 'Beispiel zum Ausprobieren',
        children: [
          h('p', { class: 'rk-sheet-note' }, lang === 'en'
            ? 'This demo has two devices — one works out well, the other clearly needs a pro.'
            : 'In dieser Demo sind zwei Geräte hinterlegt — eines geht gut aus, eines ist ein klarer Fall fürs Abraten.'),
          deviceList.map(function (d) {
            return deviceRow(d, function () { props.setChooser(false); props.onPick(d.id); }, true);
          })
        ]
      })
    ];

    return Screen({ bar: null, children: children });
  }

  /* ===================== EIGENTUM (PROJ-1) ===================== */
  function OwnershipScreen(props) {
    var device = props.device;
    var own = props.ownership || {};
    var opts = [
      { key: 'yes', label: 'Ja, gehört mir' },
      { key: 'no', label: 'Nein' },
      { key: 'unknown', label: 'Weiß nicht' },
    ];
    var consentGate = ConsentGateOverlay({
      show: !!props.showConsentGate,
      onErteilen: props.onConsentErteilen,
      onAblehnen: props.onConsentAblehnen,
    });
    var consentStatus = ConsentStatus({ consent: props.consent, onRevoke: props.onConsentRevoke });

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      footer: BigButton({ variant: 'primary', onClick: props.onContinue, children: 'Weiter' }),
      children: [
        consentGate,
        h('div', { class: 'rk-eyebrow' }, 'Aufnahme'),
        h('h2', { class: 'rk-q rk-q-tight rk-owner-q' }, 'Ist das dein Gerät?'),
        h('p', { class: 'rk-q-hint' }, 'Nur wichtig, falls Garantie oder Kosten eine Rolle spielen. Du musst nichts angeben.'),
        h('div', { class: 'rk-owner' },
          h('div', { class: 'rk-answers' }, opts.map(function (o) {
            return AnswerChip({
              active: own.isOwner === o.key,
              onClick: function () { props.setIsOwner(o.key); },
              children: o.label
            });
          })),
          own.isOwner === 'no' ? h('div', { class: 'rk-owner-followup' },
            h('p', { class: 'rk-q-hint' }, 'Optionale Angaben — beide kannst du überspringen.'),
            h('input', {
              class: 'rk-owner-input', type: 'text',
              placeholder: 'Wem gehört es? (z. B. Vermieter, Firma)',
              value: props.draftOwner || '',
              onInput: function (e) { props.setDraftOwner(e.target.value); }
            }),
            h('input', {
              class: 'rk-owner-input', type: 'text',
              placeholder: 'Wer trägt die Kosten?',
              value: props.draftCostBearer || '',
              onInput: function (e) { props.setDraftCostBearer(e.target.value); }
            })
          ) : null
        ),
        consentStatus
      ]
    });
  }

  /* ===================== TRIAGE (+ Freitext PROJ-2) ===================== */
  function TriageScreen(props) {
    var device = props.device, index = props.index;
    var q = device.triage[index];
    var n = device.triage.length;
    var ftVal = props.freitext || '';

    function charcount(v) {
      return h('div', { class: 'rk-charcount' + (v.length >= 500 ? ' rk-charcount-over' : ''), id: 'rk-charcount-' + index },
        v.length + '/500');
    }

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
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
        h('div', { class: 'rk-triage-text-wrap' },
          h('textarea', {
            class: 'rk-triage-text', maxlength: '500', rows: '2',
            placeholder: 'Optional: in eigenen Worten beschreiben …',
            onInput: function (e) {
              var v = e.target.value;
              props.setFreitext(index, v);
              var c = document.getElementById('rk-charcount-' + index);
              if (c) { c.textContent = v.length + '/500'; c.className = 'rk-charcount' + (v.length >= 500 ? ' rk-charcount-over' : ''); }
            }
          }, ftVal),
          charcount(ftVal)
        ),
        h('button', { class: 'rk-freeanswer', onClick: function () { props.onAnswer(q.q, 'frei beschrieben', 'frei beschrieben'); } },
          h('span', {}, 'Nur frei antworten …'),
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
    var defekte = props.defekte || [];
    var gesamtFazit = props.gesamtFazit || null;
    var hasMultiDefekte = defekte.length >= 2;

    var children = [
      h('div', { class: 'rk-eyebrow' }, 'Einschätzung'),
      h('h2', { class: 'rk-q rk-q-tight' }, 'Worauf du dich einlässt'),
    ];

    // Mehrfachdefekte: je-Defekt-Ampeln (PROJ-21) — bleibt permanent sichtbar
    if (hasMultiDefekte && window.GesamtFazitBlock) {
      children.push(window.GesamtFazitBlock({ defekte: defekte, gesamtFazit: gesamtFazit }));
    }

    // Standard-Ampelkarte (Einzelfall oder Fallback)
    children.push(
      h('div', { class: 'rk-ampelcard' }, device.lights.map(function (l) {
        return LightRow({ light: l, onInfo: function () { props.setActiveLight(l); } });
      }))
    );

    children.push(
      h('div', { class: 'rk-verdict ' + (stop ? 'rk-verdict-stop' : 'rk-verdict-go') },
        h('div', { class: 'rk-verdict-title' }, (stop ? '🔴 ' : '🟢 ') + device.verdictTitle),
        h('p', { class: 'rk-verdict-body' }, device.verdictBody)
      ),
      (function () {
        var tr = deriveTrust(props.trust, device);
        return TrustBadge(tr.level, tr.source, tr.reason, { onClick: function () { props.setConf(true); }, strong: stop });
      })(),
      h('div', { class: 'rk-aiwarn ' + (stop ? 'rk-aiwarn-strong' : '') },
        (stop ? '⚠️ Besonders hier gilt: ' : '') + 'Die KI kann sich irren — sieh das als Orientierung, nicht als Urteil.'
      )
    );

    // Lotse-Steuerleiste (PROJ-18)
    if (props.lotseOptionen && props.lotseOptionen.length) {
      children.push(SteerBar({ lotseOptionen: props.lotseOptionen, onLotseAktion: props.onLotseAktion }));
    }

    children.push(
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
    );

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      footer: BigButton({ variant: 'primary', onClick: props.onContinue, children: 'Was möchtest du tun?' }),
      children: children
    });
  }

  /* ===================== UNKLAR-PFAD (PROJ-4) ===================== */
  function UnclearScreen(props) {
    var device = props.device;
    var dangerous = device && device.accentPath === 'stop';
    var paths = [
      { key: 'pro', e: '🏪', t: 'Profi beauftragen', s: 'Fachbetrieb schaut sich das Gerät an' },
      { key: 'local', e: '🤝', t: 'Repair Café finden', s: 'gemeinsam vor Ort eingrenzen' },
      { key: 'community', e: '💬', t: 'Community fragen', s: 'Forum / Gruppe mit deinem Protokoll' },
    ];
    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: device ? deviceTitle(device) : h('span', {}, 'Unklar'),
        right: docBtn(props.onProtocol)
      }),
      footer: GhostButton({ full: true, onClick: props.onAmpel, children: 'Trotzdem zur Einschätzung →' }),
      children: [
        h('div', { class: 'rk-unclear' },
          h('div', { class: 'rk-unclear-emoji' }, '🤔'),
          h('h2', { class: 'rk-unclear-title' }, 'Ehrlich: keine verlässliche Eingrenzung möglich'),
          h('p', { class: 'rk-unclear-body' },
            'Mit den bisherigen Angaben kann ich die Ursache nicht seriös bestimmen. ' +
            'Ich täusche dir hier lieber keine Sicherheit vor. Dein Protokoll ist gespeichert — ' +
            'du kannst es behalten und weitergeben.'),
          dangerous ? h('div', { class: 'rk-aiwarn rk-aiwarn-strong' },
            '⚠️ Dieses Gerät kann gefährlich sein. Auch wenn die Ursache unklar ist: bitte nicht selbst öffnen — der Profi-Weg hat Vorrang.') : null,
          h('div', { class: 'rk-unclear-paths' }, paths.map(function (p) {
            return BigButton({
              variant: (dangerous && p.key === 'pro') ? 'primary' : 'soft',
              recommend: dangerous && p.key === 'pro',
              emoji: p.e, sub: p.s,
              onClick: function () { props.onForward(p.key); },
              children: p.t
            });
          })),
          h('button', { class: 'rk-share-line', onClick: props.onProtocol }, DocIcon(), ' Protokoll ansehen, exportieren & teilen')
        )
      ]
    });
  }

  /* ===================== VERGLEICH (PROJ-5) ===================== */
  function CompareBlock(compare, trust, device) {
    if (!compare) return null;
    var estTag = compare.geschaetzt
      ? h('span', { class: 'rk-est-tag' }, 'geschätzt')
      : null;
    var defs = [
      { key: 'repair', e: '🛠️', t: 'Selbst reparieren', reco: 'repair' },
      { key: 'pro', e: '🏪', t: 'Profi-Reparatur', reco: 'pro' },
      { key: 'neu', e: '🆕', t: 'Neu kaufen', reco: 'neu' },
      { key: 'entsorgung', e: '♻️', t: 'Entsorgen', reco: 'entsorgung' },
    ];
    function cell(label, value) {
      var v = value == null || value === '' ? '—' : value;
      var na = (typeof v === 'string' && v.indexOf('—') === 0);
      return h('div', { class: 'rk-compare-row' + (na ? ' rk-compare-na' : '') },
        h('span', { class: 'rk-compare-k' }, label),
        h('span', {}, v));
    }
    var cols = defs.map(function (d) {
      var p = compare[d.key] || {};
      var isReco = compare.empfehlung === d.reco;
      var children = [
        h('div', { class: 'rk-compare-head' }, h('span', {}, d.e + ' ' + d.t), isReco ? h('span', { class: 'rk-compare-reco' }, '★ Empfehlung') : null),
        cell('💶 Geld', p.geld),
        cell('⏱️ Zeit', p.zeit),
        cell('🌍 Ökologie', p.umwelt),
      ];
      if (d.key === 'neu' && p.versteckt && p.versteckt.length) {
        children.push(
          h('div', { class: 'rk-compare-hidden' },
            h('div', { class: 'rk-compare-k' }, 'Versteckte Posten:'),
            p.versteckt.map(function (x) { return h('div', { class: 'rk-compare-hidden-item' }, '• ' + x); })
          )
        );
      } else if (p.hinweis) {
        children.push(h('div', { class: 'rk-compare-hidden-item' }, p.hinweis));
      }
      return h('div', { class: 'rk-compare-path' + (isReco ? ' rk-compare-reco' : '') }, children);
    });
    var estTrust = compare.geschaetzt
      ? (function () {
        var tr = deriveTrust(trust, device);
        return TrustBadge('mittel', tr.source || 'KI-Einschätzung', tr.reason || 'Geschätzte Vergleichswerte — keine belegten Preise.');
      })()
      : null;
    return h('div', {},
      h('div', { class: 'rk-eyebrow' }, 'Vergleich aller Wege ', estTag),
      h('div', { class: 'rk-compare-4' }, cols),
      estTrust,
      compare.begruendung ? h('div', { class: 'rk-compare-begruendung' }, '💡 ' + compare.begruendung) : null
    );
  }

  /* ===================== FÖRDERUNG (PROJ-6) ===================== */
  function FoerderBlock(foerder) {
    var head = h('div', { class: 'rk-foerder-head' }, '🎁 Mögliche Förderung & Reparatur-Bonus');
    if (foerder == null) {
      return h('div', { class: 'rk-foerder' }, head, h('div', { class: 'rk-foerder-empty' }, 'Förderprogramme werden geladen …'));
    }
    if (!foerder.length) {
      return h('div', { class: 'rk-foerder' }, head,
        h('div', { class: 'rk-foerder-empty' }, 'Aktuell sind hier keine passenden Förderprogramme hinterlegt. Frag im Zweifel bei deiner Kommune oder deinem Bundesland nach.'));
    }
    var items = foerder.map(function (f) {
      var status = f.status || 'aktuell';
      var badgeCls = 'rk-foerder-badge';
      // FIX E: Status-Klasse zusätzlich am Item-Container (Background-Tint)
      var itemCls = 'rk-foerder-item';
      if (status === 'veraltet') { badgeCls += ' rk-foerder-stale'; itemCls += ' rk-foerder-stale'; }
      else if (status === 'ausgelaufen') { badgeCls += ' rk-foerder-expired'; itemCls += ' rk-foerder-expired'; }
      var statusLabel = status === 'ausgelaufen' ? 'ausgelaufen' : status === 'veraltet' ? 'evtl. veraltet' : 'aktuell';
      return h('div', { class: itemCls },
        h('div', { class: 'rk-foerder-name' }, f.bezeichnung, h('span', { class: badgeCls }, statusLabel)),
        h('div', { class: 'rk-foerder-meta' }, (f.region ? f.region + ' · ' : '') + (f.traeger || '')),
        f.beschreibung ? h('p', { class: 'rk-foerder-meta' }, f.beschreibung) : null,
        h('div', { class: 'rk-foerder-meta' }, 'Stand: ' + (f.stand || 'unbekannt') + ' · gültig bis: ' + (f.gueltigBis || 'unbefristet')),
        f.quelle ? h('a', { class: 'rk-foerder-src', href: f.quelle, target: '_blank', rel: 'noopener noreferrer' }, 'Quelle ↗') : null,
        h('div', { class: 'rk-foerder-disclaimer' }, 'Unverbindlicher Hinweis — keine Zusage. Bedingungen beim Träger prüfen.')
      );
    });
    return h('div', { class: 'rk-foerder' }, head, items);
  }

  /* ===================== ENTSCHEIDUNG (PROJ-5 + PROJ-6) ===================== */
  // device.recommend (self|local|pro|replace) → 4-Pfad-Empfehlungsschlüssel (repair|pro|neu|entsorgung)
  function recoKey(device) {
    var c = device.compare || {};
    if (c.empfehlung) return c.empfehlung;
    var r = device.recommend;
    if (r === 'self') return 'repair';
    if (r === 'local' || r === 'pro') return 'pro';
    if (r === 'replace') return 'neu';
    return 'repair';
  }

  function DecisionScreen(props) {
    var device = props.device;
    var stop = device.accentPath === 'stop';
    var reco = recoKey(device);
    // 4 Pfade konsistent zur compare-Optik (repair/pro/neu/entsorgung)
    var paths = [
      { key: 'self', reco: 'repair', e: '🛠️', t: "Ich mach's selbst", s: 'Schritt für Schritt begleitet' },
      { key: 'pro', reco: 'pro', e: '🏪', t: 'Hilfe / Profi finden', s: 'Repair Café, Werkstatt & Fachbetrieb in der Nähe' },
      { key: 'neu', reco: 'neu', e: '🆕', t: 'Neues Gerät vergleichen', s: 'Alternativen, ehrlich gegen die Reparatur gerechnet' },
      { key: 'entsorgung', reco: 'entsorgung', e: '♻️', t: 'Entsorgen / Recycling', s: 'fachgerechter Weg + Rohstoffe zurück' },
    ];
    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      children: [
        h('div', { class: 'rk-eyebrow' }, 'Entscheidung'),
        h('h2', { class: 'rk-q rk-q-tight' }, 'Du entscheidest.'),
        h('p', { class: 'rk-q-hint' }, stop
          ? 'Ehrlich: Selbst öffnen wäre gefährlich. Ich empfehle Hilfe vor Ort — du wägst ab.'
          : 'Ich empfehle, es selbst zu probieren. Aber du hast die Wahl.'),
        CompareBlock(device.compare, props.trust, device),
        FoerderBlock(props.foerder),
        h('div', { class: 'rk-paths' }, paths.map(function (p) {
          return BigButton({
            variant: p.reco === reco ? 'primary' : 'soft',
            recommend: p.reco === reco,
            emoji: p.e, sub: p.s,
            onClick: function () { props.onChoose(p.key); },
            children: p.t
          });
        }))
      ]
    });
  }

  /* ===================== FÄHIGKEITS-RÜCKFRAGE (PROJ-3) ===================== */
  function SkillAskScreen(props) {
    var device = props.device;
    var skill = props.skill;
    var levels = [
      { key: 'Anfänger', e: '🌱', t: 'Eher Anfänger', s: 'Ich erkläre jeden Schritt ausführlich.' },
      { key: 'Geübt', e: '🔧', t: 'Schon geübt', s: 'Knappe Anweisungen, kein Ballast.' },
    ];
    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      children: [
        h('div', { class: 'rk-eyebrow' }, 'Bevor es losgeht'),
        h('h2', { class: 'rk-q rk-q-tight' }, 'Wie sehr traust du dir das zu?'),
        h('p', { class: 'rk-q-hint' }, 'Das steuert nur, wie ausführlich ich erkläre — keine Wertung. Du kannst es jederzeit umstellen.'),
        h('div', { class: 'rk-skillask' }, levels.map(function (l) {
          return BigButton({
            variant: skill === l.key ? 'primary' : 'soft',
            emoji: l.e, sub: l.s,
            onClick: function () { props.onPick(l.key); },
            children: l.t
          });
        })),
        h('div', { class: 'rk-skill-out' },
          h('p', { class: 'rk-q-hint' }, 'Lieber doch nicht selbst? Völlig in Ordnung:'),
          GhostButton({ full: true, onClick: function () { props.onOut('pro'); }, children: '🏪 Profi beauftragen' }),
          GhostButton({ full: true, onClick: function () { props.onOut('local'); }, children: '🤝 Repair Café / Hilfe vor Ort' }),
          GhostButton({ full: true, onClick: function () { props.onOut('replace'); }, children: '♻️ Ersetzen / entsorgen' })
        )
      ]
    });
  }

  /* ===================== GARANTIE-GATE (PROJ-7) ===================== */
  function GateScreen(props) {
    var device = props.device;
    var w = props.warranty || {};
    var age = w.purchaseAge || '';
    var answered = !!w.asked || age !== '';
    var inWarranty = answered && age !== '>2J'; // unbekannt/jung => vorsorglich warnen
    var ages = [
      { key: '<6M', label: 'Vor unter 6 Monaten' },
      { key: '6-24M', label: 'Vor 6 Mon. – 2 Jahren' },
      { key: '>2J', label: 'Vor über 2 Jahren' },
      { key: 'unbekannt', label: 'Weiß nicht' },
    ];
    var children = [
      h('div', { class: 'rk-eyebrow' }, 'Kurz vorher'),
      h('h2', { class: 'rk-q rk-q-tight rk-gate-q' }, 'Wann hast du das Gerät gekauft?'),
      h('p', { class: 'rk-q-hint' }, 'Nur eine grobe Zeitspanne — damit du keinen Garantie-Anspruch verschenkst. Überspringen ist okay.'),
      h('div', { class: 'rk-gate' },
        h('div', { class: 'rk-answers' }, ages.map(function (a) {
          return AnswerChip({ active: age === a.key, onClick: function () { props.onAnswer(a.key); }, children: a.label });
        }))
      )
    ];

    if (answered && age === '>2J') {
      children.push(h('div', { class: 'rk-gate-alt' }, '✅ Älter als 2 Jahre — Gewährleistung greift in der Regel nicht mehr. Du kannst direkt loslegen.'));
    } else if (inWarranty) {
      children.push(
        h('div', { class: 'rk-gate-warn' },
          h('b', {}, '⚠️ Achtung Gewährleistung: '),
          'Wenn du das Gerät selbst öffnest, kann dein Gewährleistungs-/Garantieanspruch verfallen. ' +
          'Bei einem echten Defekt ist eine Reklamation oft kostenlos.'),
        h('div', { class: 'rk-gate-actions' },
          BigButton({ variant: 'primary', emoji: '📮', sub: 'kostenlos bei Hersteller/Händler', onClick: props.onReklamation, children: 'Reklamation prüfen' }),
          h('button', { class: 'rk-ghost rk-full rk-gate-proceed', onClick: props.onProceed }, 'Trotzdem selbst reparieren →')
        )
      );
    }

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      footer: answered ? null : h('div', { class: 'rk-triage-foot' }, 'Du kannst diese Frage überspringen.'),
      children: children.concat(answered ? [] : [
        GhostButton({ full: true, onClick: function () { props.onAnswer('unbekannt'); }, children: 'Überspringen' })
      ])
    });
  }

  /* ===================== REPARATUR-BEGLEITUNG (+ Sicherheit PROJ-8) ===================== */
  function RepairScreen(props) {
    var device = props.device, index = props.index, depth = props.depth;
    var step = device.steps[index];
    var n = device.steps.length;
    var last = index === n - 1;
    var body = depth === 'Geübt' ? step.pro : step.beginner;

    var bar = AppBar({
      left: IconBtn({ onClick: props.onPrev, label: 'Zurück', children: BackIcon() }),
      title: h('span', { class: 'rk-bar-step' }, 'Schritt ' + (index + 1) + '/' + n),
      right: docBtn(props.onProtocol)
    });

    // PROJ-8: Sicherheits-Bestätigung vor dem Schritt (gefährlicher Schritt, noch nicht bestätigt)
    if (props.needsConfirm) {
      return Screen({
        bar: bar,
        children: [
          h('div', { class: 'rk-confirm' },
            h('div', { class: 'rk-confirm-warn' },
              h('b', {}, '☠️ Dieser Schritt kann gefährlich sein. '),
              'Bitte lies erst weiter, wenn du sicher bist. Es gibt jederzeit den Profi-Weg.'),
            h('h2', { class: 'rk-step-title' }, step.title),
            h('div', { class: 'rk-confirm-q' }, 'Zwei kurze Fragen — ehrlich an dich selbst:'),
            h('button', {
              class: 'rk-confirm-row' + (props.confirmAdult ? ' rk-answer-on' : ''),
              onClick: function () { props.setConfirmAdult(!props.confirmAdult); }
            }, (props.confirmAdult ? '☑' : '☐') + ' Ich bin volljährig.'),
            h('button', {
              class: 'rk-confirm-row' + (props.confirmConfident ? ' rk-answer-on' : ''),
              onClick: function () { props.setConfirmConfident(!props.confirmConfident); }
            }, (props.confirmConfident ? '☑' : '☐') + ' Ich traue mir diesen Schritt zu.'),
            h('p', { class: 'rk-sheet-fine' }, 'Ein „Nein" sperrt dich nicht — es ist nur ein ehrlicher Hinweis. Du entscheidest.'),
            h('div', { class: 'rk-confirm-actions' },
              h('button', { class: 'rk-nav rk-nav-primary rk-confirm-proceed', onClick: function () { props.onConfirm(props.confirmAdult, props.confirmConfident); } }, 'Verstanden — Schritt anzeigen'),
              // FIX C: Profi-Alternative trägt rk-confirm-alt (Contract §6)
              h('button', { class: 'rk-ghost rk-full rk-confirm-alt', onClick: props.onExit }, 'Lieber Profi finden')
            )
          )
        ]
      });
    }

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
      bar: bar,
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
        step.handoff ? h('div', { class: 'rk-handoff' }, '📎 Dein Protokoll wird automatisch mitgegeben — die Werkstatt muss nicht bei null anfangen.') : null,
        // PROJ-14: Beschaffungs-Einstieg innerhalb des Repair-Flows (Schicht B)
        props.onParts ? h('button', { class: 'rk-share-line', onClick: props.onParts }, '🧩 Ersatzteile für diese Reparatur finden') : null
      ]
    });
  }

  /* ===================== RÜCKBLICK (Selbst-Reparatur) ===================== */
  function ResultScreen(props) {
    var device = props.device;
    var phase = props.phase || 'ask';
    if (phase === 'ask') {
      return Screen({
        bar: AppBar({ left: h('span', {}), title: deviceTitle(device), right: docBtn(props.onProtocol) }),
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
        bar: AppBar({ left: h('span', {}), title: deviceTitle(device), right: docBtn(props.onProtocol) }),
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
            h('p', { class: 'rk-win-foot' }, 'Und ein Stück Selbstvertrauen fürs nächste Mal. Im Reparatur-Tagebuch festgehalten.'),
            h('button', { class: 'rk-share-line', onClick: props.onProtocol }, DocIcon(), ' Protokoll ansehen & teilen')
          )
        ]
      });
    }
    // phase === 'no'
    return Screen({
      bar: AppBar({ left: h('span', {}), title: deviceTitle(device), right: docBtn(props.onProtocol) }),
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

  /* ===================== WEG-ERGEBNIS (lokal / profi / ersetzen / reklamation / community) ===================== */
  function PathScreen(props) {
    var device = props.device;
    var map = {
      local: { e: '🤝', t: 'Hilfe vor Ort', body: 'In deiner Nähe gibt es Repair Cafés und Werkstätten. Nimm dein Protokoll mit — so versteht jede helfende Person dein Problem sofort.', slot: 'Karte mit Repair Cafés' },
      pro: { e: '🏪', t: 'Profi beauftragen', body: 'Dein Reparatur-Steckbrief geht direkt an die Werkstatt. Der Mechaniker fängt nicht bei null an — das spart Zeit und Geld.', slot: 'Werkstatt-Anfrage gesendet' },
      replace: { e: '♻️', t: 'Fachgerecht ersetzen', body: 'Wenn ein Neukauf wirklich klüger ist, ist das auch in Ordnung. So entsorgst du das alte Gerät richtig — und nimmst Rohstoffe in den Kreislauf zurück.', slot: 'Wertstoffhof in der Nähe' },
      reklamation: { e: '📮', t: 'Reklamation einleiten', body: 'Wende dich mit deinem Protokoll an Händler oder Hersteller. Bei einem Defekt innerhalb der Gewährleistung ist die Reparatur oder der Austausch in der Regel kostenlos.', slot: 'Reklamations-Vorlage' },
      community: { e: '💬', t: 'Community fragen', body: 'Teile dein Protokoll in einem Reparatur-Forum oder einer Gruppe. Mit den gesammelten Angaben können andere dir gezielter helfen.', slot: 'Community-Beitrag vorbereitet' },
    };
    var info = map[props.path] || map.pro;
    return Screen({
      bar: AppBar({ left: h('span', {}), title: device ? deviceTitle(device) : h('span', {}), right: docBtn(props.onProtocol) }),
      footer: GhostButton({ full: true, onClick: props.onRestart, children: 'Zur Startseite' }),
      children: [
        h('div', { class: 'rk-result-emoji', style: { marginTop: '6px' } }, info.e),
        h('h2', { class: 'rk-result-q', style: { textAlign: 'left' } }, info.t),
        h('p', { class: 'rk-q-hint' }, info.body),
        Slot({ label: info.slot, h: 150 }),
        h('button', { class: 'rk-share-line', onClick: props.onProtocol }, DocIcon(), ' Protokoll ansehen & teilen')
      ]
    });
  }

  /* ===================== UNIVERSELLE TRIAGE (PROJ-26) =====================
     5 gerätunabhängige Fragen, gleiche Mechanik + Freitext wie PROJ-2. */
  function UnivTriageScreen(props) {
    var device = props.device;
    var fragen = props.fragen || [];
    var index = props.index;
    var n = fragen.length;
    if (!n) {
      return Screen({
        bar: AppBar({
          left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
          title: device ? deviceTitle(device) : h('span', {}, 'Aufnahme'),
          right: docBtn(props.onProtocol)
        }),
        footer: GhostButton({ full: true, onClick: props.onSkip, children: 'Überspringen →' }),
        children: [
          h('div', { class: 'rk-eyebrow' }, 'Aufnahme'),
          h('p', { class: 'rk-q-hint' }, 'Die Fragen werden geladen …')
        ]
      });
    }
    var q = fragen[index];
    var ftVal = props.freitext || '';
    function charcount(v) {
      return h('div', { class: 'rk-charcount' + (v.length >= 500 ? ' rk-charcount-over' : ''), id: 'rk-univ-charcount-' + index },
        v.length + '/500');
    }
    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: device ? deviceTitle(device) : h('span', {}, 'Aufnahme'),
        right: docBtn(props.onProtocol)
      }),
      footer: h('div', { class: 'rk-triage-foot' }, 'Frage ' + (index + 1) + ' von ' + n + ' · systematische Aufnahme, gerätunabhängig'),
      children: [
        ProgressDots({ n: n, i: index }),
        h('div', { class: 'rk-eyebrow' }, 'Systematische Aufnahme'),
        h('div', { class: 'rk-univ' },
          h('h2', { class: 'rk-q rk-univ-q' }, q.q),
          q.hint ? h('p', { class: 'rk-q-hint' }, q.hint) : null,
          h('div', { class: 'rk-answers' }, (q.options || []).map(function (o) {
            return AnswerChip({ onClick: function () { props.onAnswer(q.q, o.a, o.tag); }, children: o.a });
          })),
          h('div', { class: 'rk-triage-text-wrap' },
            h('textarea', {
              class: 'rk-triage-text', maxlength: '500', rows: '2',
              placeholder: 'Optional: in eigenen Worten beschreiben …',
              onInput: function (e) {
                var v = e.target.value;
                props.setFreitext(index, v);
                var c = document.getElementById('rk-univ-charcount-' + index);
                if (c) { c.textContent = v.length + '/500'; c.className = 'rk-charcount' + (v.length >= 500 ? ' rk-charcount-over' : ''); }
              }
            }, ftVal),
            charcount(ftVal)
          ),
          h('button', { class: 'rk-freeanswer', onClick: function () { props.onAnswer(q.q, 'frei beschrieben', 'frei beschrieben'); } },
            h('span', {}, 'Nur frei antworten …'),
            h('span', { class: 'rk-input-mic' }, '🎙️')
          )
        )
      ]
    });
  }

  /* ---- gemeinsamer Quellen-/Demo-Hinweis für kuratierte Service-Daten ---- */
  function curatedTrust(item) {
    var quelle = (item && item.quelle) || 'kuratierte Demodaten';
    return TrustBadge('mittel', quelle, 'Kuratierte Demodaten (' + quelle + ') — kein echter Anbieter-Nachweis.');
  }
  function svcEmpty(hinweis) {
    return h('div', { class: 'rk-svc-empty' },
      hinweis || 'In deiner Region sind hier keine Einträge hinterlegt. Frag im Zweifel bei deiner Kommune nach — oder probier es ohne Ortsangabe.');
  }
  function locField(props) {
    return h('div', {},
      h('label', { class: 'rk-loc-label', for: 'rk-loc-input' }, '📍 Ort / PLZ (optional)'),
      h('div', { class: 'rk-loc-row', style: { display: 'flex', gap: 'var(--gap)' } },
        h('input', {
          class: 'rk-loc-input', id: 'rk-loc-input', type: 'text',
          placeholder: 'z. B. 50667 oder Köln',
          value: props.ort || '',
          onInput: function (e) { props.setOrt(e.target.value); },
          onKeydown: function (e) { if (e.key === 'Enter') { e.preventDefault(); props.onSearch(); } }
        }),
        h('button', { class: 'rk-svc-select', onClick: props.onSearch }, 'Suchen')
      )
    );
  }

  /* ===================== VERMITTLUNG (PROJ-11) ===================== */
  function VermittlungScreen(props) {
    var device = props.device;
    var data = props.anbieter;
    var selected = (props.vermittlung && props.vermittlung.selected) || '';
    var typLabel = { repaircafe: '🤝 Repair Café', werkstatt: '🔧 Werkstatt', profi: '🏪 Fachbetrieb' };
    var typOrder = ['repaircafe', 'werkstatt', 'profi'];

    var body;
    if (data == null) {
      body = h('p', { class: 'rk-q-hint' }, 'Anbieter werden geladen …');
    } else {
      var items = data.items || [];
      if (!items.length) {
        body = svcEmpty(data.hinweis);
      } else {
        var groups = typOrder.map(function (typ) {
          var inGroup = items.filter(function (it) { return it.typ === typ; });
          if (!inGroup.length) return null;
          return h('div', { class: 'rk-svc' },
            h('div', { class: 'rk-svc-head rk-typ-' + typ }, typLabel[typ] || typ),
            h('div', { class: 'rk-svc-list' }, inGroup.map(function (it) {
              var isFree = it.typ === 'repaircafe';
              var sel = selected === it.id;
              return h('div', { class: 'rk-svc-card rk-typ-' + typ + (sel ? ' rk-svc-card-sel' : '') },
                h('div', { class: 'rk-svc-name' }, it.name,
                  h('span', { class: 'rk-svc-typ rk-typ-' + typ }, typLabel[it.typ] || it.typ),
                  it.kuratiert ? h('span', { class: 'rk-svc-badge' }, 'Demo') : null),
                h('div', { class: 'rk-svc-meta' },
                  (it.adresse ? it.adresse + ', ' : '') + (it.plz ? it.plz + ' ' : '') + (it.ort || '') +
                  (it.entfernung ? ' · ' + it.entfernung : '')),
                it.spezialisierung ? h('div', { class: 'rk-svc-meta' }, 'Schwerpunkt: ' + it.spezialisierung) : null,
                it.oeffnungszeiten ? h('div', { class: 'rk-svc-meta' }, '🕑 ' + it.oeffnungszeiten) : null,
                it.kontakt ? h('div', { class: 'rk-svc-meta' }, '☎ ' + it.kontakt) : null,
                isFree
                  ? h('div', { class: 'rk-svc-cost rk-svc-free' }, '🆓 ' + (it.kostenhinweis || 'kostenlos / ehrenamtlich'))
                  : h('div', { class: 'rk-svc-cost' }, '💶 ' + (it.kostenhinweis || 'kostenpflichtig')),
                h('div', { class: 'rk-svc-src' }, curatedTrust(it)),
                h('button', {
                  class: 'rk-svc-select' + (sel ? ' rk-answer-on' : ''),
                  onClick: function () { props.onSelect(it.id); }
                }, sel ? '✓ Ausgewählt' : 'Diesen Anbieter merken')
              );
            }))
          );
        });
        body = h('div', {}, groups);
      }
    }

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      footer: GhostButton({ full: true, onClick: props.onProtocol, children: '📄 Protokoll ansehen & teilen' }),
      children: [
        h('div', { class: 'rk-eyebrow' }, 'Hilfe vor Ort'),
        h('h2', { class: 'rk-q rk-q-tight' }, 'Anbieter in deiner Nähe'),
        h('p', { class: 'rk-svc-intro' }, 'Repair Cafés helfen kostenlos & ehrenamtlich. Werkstätten und Fachbetriebe arbeiten gegen Bezahlung. Du wählst frei.'),
        locField(props),
        body,
        GhostButton({ full: true, onClick: props.onRestart, children: 'Zur Startseite' })
      ]
    });
  }

  /* ===================== ENTSORGUNG (PROJ-12) ===================== */
  function EntsorgungScreen(props) {
    var device = props.device;
    var data = props.entsorgung;
    var selected = (props.entsorgungSel && props.entsorgungSel.selected) || '';
    var artLabel = { wertstoffhof: '♻️ Wertstoffhof', ruecknahme: '🏬 Händler-Rücknahme', sammelstelle: '📦 Sammelstelle' };

    var body;
    if (data == null) {
      body = h('p', { class: 'rk-q-hint' }, 'Entsorgungswege werden geladen …');
    } else {
      var items = data.items || [];
      if (!items.length) {
        body = svcEmpty(data.hinweis || 'Kein lokaler Eintrag. Nach ElektroG nehmen Wertstoffhöfe und größere Händler Elektrogeräte kostenlos zurück.');
      } else {
        body = h('div', { class: 'rk-svc-list' }, items.map(function (it) {
          var sel = selected === it.id;
          return h('div', { class: 'rk-disp' + (sel ? ' rk-svc-card-sel' : '') },
            h('div', { class: 'rk-svc-name' }, it.name || (artLabel[it.art] || it.art),
              h('span', { class: 'rk-disp-art' }, artLabel[it.art] || it.art)),
            it.adresse ? h('div', { class: 'rk-svc-meta' }, '📍 ' + it.adresse + (it.ort ? ', ' + it.ort : '')) : null,
            it.annahmezeiten ? h('div', { class: 'rk-disp-zeiten' }, '🕑 ' + it.annahmezeiten) : null,
            it.rohstoff ? h('div', { class: 'rk-disp-rohstoff' }, '🔁 Rohstoffe: ' + it.rohstoff) : null,
            it.hinweise ? h('div', { class: 'rk-svc-meta' }, it.hinweise) : null,
            h('div', { class: 'rk-disp-kosten' }, '💶 ' + (it.kosten || 'meist kostenlos')),
            h('div', { class: 'rk-svc-src' }, curatedTrust(it)),
            h('button', {
              class: 'rk-svc-select' + (sel ? ' rk-answer-on' : ''),
              onClick: function () { props.onSelect(it.id); }
            }, sel ? '✓ Ausgewählt' : 'Diesen Weg merken')
          );
        }));
      }
    }

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      footer: GhostButton({ full: true, onClick: props.onProtocol, children: '📄 Protokoll ansehen & teilen' }),
      children: [
        h('div', { class: 'rk-eyebrow' }, 'Entsorgung & Recycling'),
        h('h2', { class: 'rk-q rk-q-tight' }, 'Fachgerecht entsorgen'),
        h('p', { class: 'rk-svc-intro' }, 'Elektrogeräte gehören nicht in den Hausmüll. So bringst du die Rohstoffe zurück in den Kreislauf.'),
        locField(props),
        body,
        GhostButton({ full: true, onClick: props.onRestart, children: 'Zur Startseite' })
      ]
    });
  }

  /* ===================== PRODUKTSUCHE / ALTERNATIVEN (PROJ-13) ===================== */
  function ProduktsucheScreen(props) {
    var device = props.device;
    var data = props.alternativen;
    var selected = (props.produktsuche && props.produktsuche.selected) || '';

    function setupDots(n) {
      n = Math.max(0, Math.min(3, n || 0));
      var s = '';
      for (var i = 0; i < 3; i++) s += i < n ? '●' : '○';
      return s;
    }

    var body;
    if (data == null) {
      body = h('p', { class: 'rk-q-hint' }, 'Alternativen werden geladen …');
    } else {
      var items = data.items || [];
      if (!items.length) {
        body = svcEmpty(data.hinweis || 'Für diese Kategorie sind keine Alternativen hinterlegt.');
      } else {
        body = h('div', { class: 'rk-alt' }, items.map(function (it) {
          var sel = selected === it.id;
          var v = it.vergleich || {};
          return h('div', { class: 'rk-alt-card' + (sel ? ' rk-svc-card-sel' : '') },
            h('div', { class: 'rk-alt-modell' }, it.modell,
              it.preis ? h('span', { class: 'rk-svc-cost' }, '💶 ' + it.preis) : null),
            h('div', { class: 'rk-alt-spec' },
              (it.ausstattung ? it.ausstattung : '') +
              (it.energieklasse ? ' · Energieklasse ' + it.energieklasse : '') +
              (it.lieferzeit ? ' · ' + it.lieferzeit : '')),
            h('div', { class: 'rk-alt-vergleich' },
              h('div', { class: 'rk-compare-row' }, h('span', { class: 'rk-compare-k' }, '💶 Geld'), h('span', {}, v.geld || '—')),
              h('div', { class: 'rk-compare-row' }, h('span', { class: 'rk-compare-k' }, '⏱️ Zeit'), h('span', {}, v.zeit || '—')),
              h('div', { class: 'rk-compare-row' }, h('span', { class: 'rk-compare-k' }, '🌍 Ökologie'), h('span', {}, v.umwelt || '—'))
            ),
            h('div', { class: 'rk-alt-setup' }, '🔧 Einrichtungsaufwand: ' + setupDots(it.einrichtung)),
            h('div', { class: 'rk-svc-src' }, curatedTrust(it)),
            h('button', {
              class: 'rk-svc-select' + (sel ? ' rk-answer-on' : ''),
              onClick: function () { props.onSelect(it.id); }
            }, sel ? '✓ Gemerkt' : 'Diese Alternative merken')
          );
        }));
        if (data.breakEven) {
          body = h('div', {}, body, h('div', { class: 'rk-alt-breakeven' }, '📊 ' + data.breakEven));
        }
      }
    }

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      footer: GhostButton({ full: true, onClick: props.onProtocol, children: '📄 Protokoll ansehen & teilen' }),
      children: [
        h('div', { class: 'rk-eyebrow' }, 'Neu vs. Reparatur'),
        h('h2', { class: 'rk-q rk-q-tight' }, 'Alternativen im Vergleich'),
        h('p', { class: 'rk-svc-intro' }, 'Gleiche Optik wie die Wege-Tabelle: Geld, Zeit & Ökologie je Gerät — ehrlich gegen die Reparatur gerechnet.'),
        body,
        GhostButton({ full: true, onClick: props.onRestart, children: 'Zur Startseite' })
      ]
    });
  }

  /* ===================== BESCHAFFUNG / ERSATZTEILE (PROJ-14, D8) ===================== */
  function BeschaffungScreen(props) {
    var device = props.device;
    var data = props.ersatzteile;
    var kept = (props.beschaffung && props.beschaffung.parts) || [];

    var body;
    if (data == null) {
      body = h('p', { class: 'rk-q-hint' }, 'Ersatzteile werden geladen …');
    } else {
      var items = data.items || [];
      if (!items.length) {
        body = svcEmpty(data.hinweis || 'Für dieses Gerät sind keine Ersatzteile hinterlegt.');
      } else {
        body = h('div', {}, items.map(function (it) {
          var isKept = kept.indexOf(it.id) >= 0;
          var oos = !it.verfuegbarkeit || /nicht lieferbar|nicht verfügbar|ausverkauft/i.test('' + it.verfuegbarkeit);
          var bo = it.bestelloption || {};
          return h('div', { class: 'rk-parts-item' + (isKept ? ' rk-svc-card-sel' : '') },
            h('div', { class: 'rk-svc-name' }, it.teil,
              h('span', { class: 'rk-parts-price' }, '💶 ' + (it.preis || '—'))),
            it.passendFuer ? h('div', { class: 'rk-svc-meta' }, 'Passend für: ' + it.passendFuer) : null,
            oos
              ? h('div', { class: 'rk-parts-oos' }, '⚠️ ' + (it.verfuegbarkeit || 'Nicht lieferbar') +
                (it.alternativHinweis ? ' — ' + it.alternativHinweis : (it.hersteller ? ' — beim Hersteller anfragen: ' + it.hersteller : '')))
              : h('div', { class: 'rk-parts-stock' }, '✅ ' + it.verfuegbarkeit + (it.versand ? ' · ' + it.versand : '')),
            h('div', { class: 'rk-svc-src' }, curatedTrust(it)),
            // Bestelloption NACHGELAGERT, klar als Affiliate gekennzeichnet, nie vorausgewählt (D8)
            (bo.verfuegbar)
              ? h('div', { class: 'rk-order-opt' },
                h('span', { class: 'rk-affiliate' }, '🔗 Partner-Link (Provision)'),
                h('span', { class: 'rk-svc-meta' }, (bo.partner ? bo.partner : 'Partner-Shop')),
                h('div', { class: 'rk-order-disclaimer' }, bo.hinweis || 'Über diesen Link erhalten wir ggf. eine Provision. Die Empfehlung folgt trotzdem nur dem günstigsten/sinnvollsten Bezug.'))
              : null,
            h('button', {
              class: 'rk-parts-keep' + (isKept ? ' rk-answer-on' : ''),
              onClick: function () { props.onKeep(it.id); }
            }, isKept ? '✓ Gemerkt' : 'Teil merken')
          );
        }));
      }
    }

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: 'Zurück', children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      footer: GhostButton({ full: true, onClick: props.onBack, children: '← Zurück zur Reparatur' }),
      children: [
        h('div', { class: 'rk-parts' },
          h('div', { class: 'rk-parts-head' }, '🧩 Ersatzteile beschaffen'),
          h('p', { class: 'rk-svc-intro' }, 'Günstigste Quelle zuerst. Eine Bestellung ist optional und klar als Partner-Link gekennzeichnet — nie vorausgewählt.'),
          body,
          GhostButton({ full: true, onClick: props.onProtocol, children: '📄 Protokoll ansehen & teilen' })
        )
      ]
    });
  }

  /* ===================== PROTOKOLL (Steckbrief + Export PROJ-1/2/3/4/7/8/10) ===================== */
  function ownerText(ownership) {
    if (!ownership || ownership.isOwner == null) return 'nicht angegeben';
    if (ownership.isOwner === 'yes') return 'gehört mir';
    if (ownership.isOwner === 'unknown') return 'zu klären';
    // no
    var who = (ownership.owner && ownership.owner.trim()) ? ownership.owner.trim() : 'nicht angegeben';
    return 'gehört nicht mir (' + who + ')';
  }
  function costText(ownership) {
    if (!ownership) return 'nicht angegeben';
    return (ownership.costBearer && ownership.costBearer.trim()) ? ownership.costBearer.trim() : 'nicht angegeben';
  }

  function ProtocolContent(props) {
    var device = props.device, answers = props.answers || [];
    var why = props.why;
    var ownership = props.ownership || {};
    var skill = props.skill;
    var warranty = props.warranty || {};
    var diagnosis = props.diagnosis || null;
    var safetyConfirms = props.safetyConfirms || {};
    var confirmKeys = Object.keys(safetyConfirms);
    var summary = device.lights.map(function (l) { return l.icon + ' ' + levelMeta(l.level).face; }).join('   ');

    // Stufe-2 Auswahlen (PROJ-11/12/13/14) — falls gesetzt, mit Labels aus den geladenen Listen auflösen
    function resolve(list, id) {
      if (!id || !list || !list.items) return null;
      var hit = list.items.filter(function (x) { return x.id === id; })[0];
      return hit || { id: id };
    }
    var vermittlung = props.vermittlung || {};
    var entsorgungSel = props.entsorgungSel || {};
    var produktsuche = props.produktsuche || {};
    var beschaffung = props.beschaffung || {};
    var trust = props.trust || null;
    var pickedAnbieter = resolve(props.anbieter, vermittlung.selected);
    var pickedEntsorgung = resolve(props.entsorgung, entsorgungSel.selected);
    var pickedAlt = resolve(props.alternativen, produktsuche.selected);
    var keptParts = (beschaffung.parts || []).map(function (pid) {
      return resolve(props.ersatzteile, pid) || { id: pid };
    });
    function svcLine(item, fallbackLabel) {
      if (!item) return null;
      var label = item.name || item.modell || item.teil || fallbackLabel || item.id;
      return h('div', { class: 'rk-proto-val' }, label +
        (item.quelle ? ' · Quelle: ' + item.quelle + (item.kuratiert ? ' (kuratierte Demodaten)' : '') : ''));
    }
    var hasStufe2 = pickedAnbieter || pickedEntsorgung || pickedAlt || keptParts.length;

    var warrantyLine = 'nicht erfasst';
    if (warranty.asked || warranty.purchaseAge) {
      warrantyLine = 'Kauf: ' + (warranty.purchaseAge || 'unbekannt') +
        (warranty.choice ? ' · Wahl: ' + (warranty.choice === 'reklamation' ? 'Reklamation' : 'selbst reparieren') : '');
    }

    return h('div', { class: 'rk-proto' },
      h('div', { class: 'rk-proto-head' },
        h('span', { class: 'rk-proto-e' }, device.emoji),
        h('div', {},
          h('div', { class: 'rk-proto-name' }, device.name),
          h('div', { class: 'rk-proto-detail' }, device.detail)
        )
      ),
      diagnosis && diagnosis.status === 'unclear'
        ? h('div', { class: 'rk-aiwarn rk-aiwarn-strong' }, '🤔 Diagnose unklar — keine verlässliche Eingrenzung. Bitte einem Profi/Repair Café vorlegen.')
        : null,
      h('div', { class: 'rk-proto-sec' }, 'Symptom'),
      h('div', { class: 'rk-proto-val' }, device.blurb),
      h('div', { class: 'rk-proto-sec' }, 'Was schon getestet wurde'),
      h('div', { class: 'rk-proto-tags' },
        answers.length
          ? answers.map(function (a) { return h('span', { class: 'rk-proto-tag' }, a.tag || a.a); })
          : h('span', { class: 'rk-proto-tag rk-proto-tag-muted' }, 'noch nichts erfasst')
      ),
      // PROJ-2: Freitexte je Frage
      answers.filter(function (a) { return a && a.freitext; }).length
        ? h('div', {},
          h('div', { class: 'rk-proto-sec' }, 'In eigenen Worten'),
          answers.map(function (a) {
            return a && a.freitext
              ? h('div', { class: 'rk-proto-val' }, h('b', {}, '„' + a.q + "“ "), '— ' + a.freitext)
              : null;
          })
        ) : null,
      h('div', { class: 'rk-proto-sec' }, 'Wahrscheinliche Ursache & Ampel'),
      h('div', { class: 'rk-proto-val' }, device.verdictTitle),
      h('div', { class: 'rk-proto-ampel' }, summary),
      h('button', { class: 'rk-proto-why', onClick: function () { props.setWhy(!why); } },
        (why ? '▾' : '▸') + ' Warum schätzt die App das so ein?'),
      why ? h('div', { class: 'rk-proto-reason' },
        h('p', {}, device.verdictBody),
        h('p', { class: 'rk-sheet-fine' }, 'Quelle: ' + device.confidence.source + ' · Sicherheit: ' + device.confidence.level + '. Die KI kann sich irren.')
      ) : null,
      // PROJ-3 / PROJ-7
      h('div', { class: 'rk-proto-sec' }, 'Können & Garantie'),
      h('div', { class: 'rk-proto-val' }, 'Selbsteinschätzung: ' + (skill || 'nicht angegeben')),
      h('div', { class: 'rk-proto-val' }, 'Gewährleistung: ' + warrantyLine),
      // PROJ-1: Eigentum dynamisch
      h('div', { class: 'rk-proto-owner' }, '👤 Gerät: ', h('b', {}, ownerText(ownership)), ' · Kosten: ', h('b', {}, costText(ownership))),
      // FIX A — PROJ-1 AC8 (D14): Rücksprache-Hinweis bei fremdem Gerät
      ownership.isOwner === 'no'
        ? h('div', { class: 'rk-aiwarn rk-aiwarn-strong' }, '⚠️ Fremdes Gerät: vor jedem Eingriff Rücksprache mit Eigentümer/Kostenträger halten (D14).')
        : null,
      // FIX D — PROJ-8 AC8: gegebene Sicherheits-Bestätigungen sichtbar machen
      confirmKeys.length
        ? h('div', {},
          h('div', { class: 'rk-proto-sec' }, 'Sicherheits-Bestätigungen'),
          confirmKeys.map(function (k) {
            var c = safetyConfirms[k] || {};
            return h('div', { class: 'rk-proto-val' },
              'Schritt ' + (parseInt(k, 10) + 1) + ' — volljährig: ' + (c.adult === 'yes' ? 'ja' : 'nein') +
              ', zugetraut: ' + (c.confident === 'yes' ? 'ja' : 'nein'));
          })
        ) : null,
      // PROJ-25: durchgängige Vertrauens-/Quellenzeile des Vorgangs
      trust && (trust.level || trust.source)
        ? h('div', {},
          h('div', { class: 'rk-proto-sec' }, 'Vertrauen & Quelle'),
          TrustBadge(trust.level || 'mittel', trust.source || (device.confidence && device.confidence.source) || 'kuratiert', trust.reason || ''))
        : null,
      // PROJ-11/12/13/14: gewählte Service-Wege (nur falls gesetzt)
      hasStufe2
        ? h('div', {},
          h('div', { class: 'rk-proto-sec' }, 'Gewählte Wege & Beschaffung'),
          pickedAnbieter ? h('div', {}, h('div', { class: 'rk-proto-val' }, h('b', {}, '🤝 Anbieter: ')), svcLine(pickedAnbieter)) : null,
          pickedEntsorgung ? h('div', {}, h('div', { class: 'rk-proto-val' }, h('b', {}, '♻️ Entsorgungsweg: ')), svcLine(pickedEntsorgung)) : null,
          pickedAlt ? h('div', {}, h('div', { class: 'rk-proto-val' }, h('b', {}, '🆕 Alternativgerät: ')), svcLine(pickedAlt)) : null,
          keptParts.length
            ? h('div', {},
              h('div', { class: 'rk-proto-val' }, h('b', {}, '🧩 Gemerkte Ersatzteile: ')),
              keptParts.map(function (p) { return svcLine(p); }),
              h('div', { class: 'rk-foerder-disclaimer' }, 'Bestelloptionen sind Partner-Links (Provision) — kennzeichnungspflichtig, nie vorausgewählt.'))
            : null
        ) : null,
      // PROJ-22: Consent-Status
      (props.consent && props.consent.status !== 'offen')
        ? h('div', {},
          h('div', { class: 'rk-proto-sec' }, 'Einwilligung'),
          h('div', { class: 'rk-proto-val' },
            (props.consent.status === 'erteilt' ? '✅ ' : props.consent.status === 'abgelehnt' ? '❌ ' : '↩️ ') +
            (props.consent.status || '') +
            (props.consent.zeitpunkt ? ' · ' + props.consent.zeitpunkt.substring(0, 19).replace('T', ' ') : '')
          ),
          (props.consent.status === 'erteilt' && props.onConsentRevoke)
            ? h('button', { class: 'rk-consent-revoke', onClick: props.onConsentRevoke }, t('consent.widerrufen'))
            : null
        ) : null,
      // PROJ-19: Rückruf
      (props.rueckruf && props.rueckruf.hit)
        ? h('div', {},
          h('div', { class: 'rk-proto-sec' }, '⛔ Rückruf / Sicherheitsmangel'),
          h('div', { class: 'rk-proto-val' }, (props.rueckruf.art || 'rueckruf') + ': ' + (props.rueckruf.grund || '')),
          props.rueckruf.quelle ? h('div', { class: 'rk-proto-val' }, 'Quelle: ' + props.rueckruf.quelle) : null,
          props.rueckruf.stand ? h('div', { class: 'rk-proto-val' }, 'Stand: ' + props.rueckruf.stand) : null
        ) : null,
      // PROJ-20: Datenlöschung
      (props.abgabe === 'dritte')
        ? h('div', {},
          h('div', { class: 'rk-proto-sec' }, 'Datenlöschung vor Abgabe'),
          h('div', { class: 'rk-proto-val' },
            '💾 Backup: ' + ((props.datenloeschung && props.datenloeschung.backup) ? '✓' : '–') +
            ' · 🗑️ Gelöscht: ' + ((props.datenloeschung && props.datenloeschung.loeschen) ? '✓' : '–') +
            ' · 🔓 Abgemeldet: ' + ((props.datenloeschung && props.datenloeschung.abmelden) ? '✓' : '–') +
            ((props.datenloeschung && props.datenloeschung.bewusstUebersprungen) ? ' · bewusst übersprungen' : '')
          )
        ) : null,
      // PROJ-21: Mehrfachdefekte
      (props.defekte && props.defekte.length >= 2)
        ? h('div', {},
          h('div', { class: 'rk-proto-sec' }, 'Mehrfachdefekte (' + props.defekte.length + ')'),
          props.defekte.map(function (d) {
            return h('div', { class: 'rk-proto-val' }, d.name || d.id);
          }),
          props.gesamtFazit
            ? h('div', { class: 'rk-proto-val' },
              'Gesamt: ' + (props.gesamtFazit.recommend || '') +
              (props.gesamtFazit.knackpunktId ? ' · Knackpunkt: ' + props.gesamtFazit.knackpunktId : ''))
            : null
        ) : null,
      // PROJ-23: Schwungrad
      (props.schwungrad && props.schwungrad.beigetragen)
        ? h('div', {},
          h('div', { class: 'rk-proto-sec' }, 'Schwungrad-Beitrag'),
          h('div', { class: 'rk-proto-val' }, 'Beitrag-ID: ' + (props.schwungrad.beitragId || '—')),
          props.schwungrad.ausgeschlossen && props.schwungrad.ausgeschlossen.length
            ? h('div', { class: 'rk-proto-val' }, 'Ausgeschlossen: ' + props.schwungrad.ausgeschlossen.join(', '))
            : null
        ) : null,
      // PROJ-27: Medien-Anhänge
      (props.medien && props.medien.length)
        ? h('div', {},
          h('div', { class: 'rk-proto-sec' }, 'Medien (' + props.medien.length + ')'),
          props.medien.map(function (m) {
            return h('div', { class: 'rk-proto-val' }, (m.art || '?') + ' · ' + (m.ref || m.id || ''));
          })
        ) : null,
      // PROJ-10: echte Export-Buttons
      h('div', { class: 'rk-proto-share' },
        h('button', { class: 'rk-share-btn', onClick: props.onExportText }, h('span', {}, '💬'), 'Text'),
        h('button', { class: 'rk-share-btn', onClick: props.onExportPdf }, h('span', {}, '📄'), 'PDF'),
        h('button', { class: 'rk-share-btn', onClick: props.onExportLink }, h('span', {}, '🔗'), 'Link')
      ),
      props.linkUrl ? h('div', { class: 'rk-link-box' },
        h('div', { class: 'rk-link-url' }, props.linkUrl),
        h('button', { class: 'rk-share-btn', onClick: props.onCopyLink }, h('span', {}, '📋'), 'Kopieren'),
        h('div', { class: 'rk-link-note' }, 'Wer den Link hat, kann den Vorgang lesen. Der Link läuft 30 Tage nach Erstellung ab.')
      ) : null
    );
  }

  /* ===================== STUFE-3 HELPER ===================== */

  /* ---- Steuerleiste (PROJ-18) ---- */
  function SteerBar(props) {
    var opts = props.lotseOptionen || [];
    if (!opts.length && !props.showDefault) return null;
    // Default-Optionen falls keine geladen
    var items = opts.length ? opts : [
      { label: t('steer.profi'), ereignis: 'wechsel', ziel: 'vermittlung' },
      { label: t('steer.entsorgen'), ereignis: 'wechsel', ziel: 'entsorgung' },
      { label: t('steer.abbrechen'), ereignis: 'abbruch', ziel: '' },
    ];
    return h('div', { class: 'rk-steer' }, items.map(function (opt) {
      var isPrimary = opt.ereignis === 'weiter';
      var isAbort = opt.ereignis === 'abbruch';
      return h('button', {
        class: 'rk-steer-btn' + (isPrimary ? ' rk-steer-primary' : isAbort ? ' rk-steer-abort' : ' rk-steer-secondary'),
        onClick: function () { if (props.onLotseAktion) props.onLotseAktion(opt.ereignis, opt.ziel); },
      }, opt.label);
    }));
  }

  /* ---- Consent-Gate-Overlay (PROJ-22) ---- */
  function ConsentGateOverlay(props) {
    if (!props.show) return null;
    return h('div', { class: 'rk-consent' },
      h('div', { class: 'rk-consent-head' }, t('consent.titel')),
      h('div', { class: 'rk-consent-body' }, t('consent.body')),
      h('div', { class: 'rk-consent-train' }, t('consent.trainingshinweis')),
      h('div', { class: 'rk-consent-ref' }, t('consent.verweis')),
      h('div', { class: 'rk-consent-btns' },
        h('button', { class: 'rk-consent-yes', onClick: props.onErteilen }, t('consent.erteilen')),
        h('button', { class: 'rk-consent-no', onClick: props.onAblehnen }, t('consent.ablehnen'))
      )
    );
  }

  /* ---- Consent-Widerruf-Control (PROJ-22) ---- */
  function ConsentStatus(props) {
    var consent = props.consent || {};
    if (!consent.status || consent.status === 'offen') return null;
    var label = t('consent.status.' + consent.status) || consent.status;
    return h('div', { class: 'rk-consent-status' },
      h('span', {}, label + (consent.zeitpunkt ? ' (' + consent.zeitpunkt.substring(0, 10) + ')' : '')),
      (consent.status === 'erteilt')
        ? h('button', { class: 'rk-consent-revoke', onClick: props.onRevoke }, t('consent.widerrufen'))
        : null
    );
  }

  /* ---- Only-DE badge (PROJ-24) ---- */
  function OnlyDeBadge(lang, nurDeutsch) {
    if (lang !== 'en' || !nurDeutsch) return null;
    return h('span', { class: 'rk-onlyde' }, t('onlyde'));
  }

  /* ===================== RECALL SCREEN (PROJ-19) ===================== */
  function RecallScreen(props) {
    var device = props.device;
    var r = props.rueckruf || {};
    var art = r.art || 'rueckruf';
    var artCls = art === 'sicherheitsmangel' ? 'rk-recall-sicherheitsmangel' : 'rk-recall-rueckruf';
    var titel = t('recall.titel.' + art);

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: t('nav.zurueck'), children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      footer: h('div', { class: 'rk-recall-continue' },
        h('button', { class: 'rk-ghost rk-full', onClick: props.onContinue }, t('recall.weiter'))
      ),
      children: [
        h('div', { class: 'rk-recall ' + artCls },
          h('div', { class: 'rk-recall-badge' }, titel),
          h('p', { class: 'rk-recall-grund' },
            h('b', {}, t('recall.grund.label')), ' ', r.grund || ''),
          r.quelle ? h('p', { class: 'rk-recall-quelle' },
            h('b', {}, t('recall.quelle.label')), ' ', r.quelle) : null,
          (r.stand || r.gueltigBis) ? h('p', { class: 'rk-recall-stand' },
            h('b', {}, t('recall.stand.label')), ' ',
            (r.stand || '') + (r.gueltigBis ? ' / ' + r.gueltigBis : '')) : null,
          r.vorgehen ? h('p', { class: 'rk-recall-vorgehen' },
            h('b', {}, t('recall.vorgehen.label')), ' ', r.vorgehen) : null,
          h('div', { class: 'rk-aiwarn rk-aiwarn-strong' }, t('recall.hinweis')),
          // modellUnsicher: kein harter Treffer
          r.modellUnsicher
            ? h('div', { class: 'rk-recall-unsure' }, t('recall.unsicher'))
            : null
        )
      ]
    });
  }

  /* ===================== DIAG SCREEN (PROJ-17 — kuratierte Diagnose-Schleife) ===================== */
  function DiagScreen(props) {
    var device = props.device;
    var fz = props.fehlerzustand || {};
    var kandidaten = fz.kandidaten || [];
    var gewaehlt = fz.gewaehlt || '';
    var abgrenzung = fz.abgrenzung || { offen: [], beantwortet: {} };
    var beantwortet = abgrenzung.beantwortet || {};
    var offeneFragen = abgrenzung.offen || [];

    // Kandidaten nach Konfidenz sortieren
    var sorted = kandidaten.slice().sort(function (a, b) {
      var rank = { hoch: 0, mittel: 1, niedrig: 2 };
      return (rank[a.konfidenz] || 1) - (rank[b.konfidenz] || 1);
    });

    // Kandidat ausgeblendet durch Abgrenzungsantworten?
    function isOut(kand) {
      // einfache Heuristik: wenn ein Kandidat-Tag einer beantworteten Frage widerspricht
      return false; // erweiterbar
    }

    function konfidenzLabel(k) {
      return t('diag.konfidenz.' + (k || 'mittel'));
    }
    function herkunftLabel(h_) {
      if (h_ === 'kuratiert') return t('diag.herkunft.kuratiert');
      return t('diag.herkunft.ki');
    }

    var children = [
      h('div', { class: 'rk-eyebrow' }, t('diag.eyebrow')),
      h('h2', { class: 'rk-q rk-q-tight rk-diag-head' }, t('diag.titel')),
    ];

    // Kandidatenliste
    if (sorted.length) {
      children.push(h('div', { class: 'rk-diag' },
        sorted.map(function (k) {
          var sel = gewaehlt === k.id;
          var out = isOut(k);
          var cls = 'rk-diag-cand' + (sel ? ' rk-diag-cand-sel' : '') + (out ? ' rk-diag-cand-out' : '');
          return h('div', { class: cls,
            onClick: function () { if (!out) props.onSelectCandidate(k.id); }
          },
            h('div', { class: 'rk-diag-cause' }, k.ursache || k.id),
            h('div', { class: 'rk-diag-src' },
              h('span', {}, herkunftLabel(k.herkunft)),
              ' · ',
              h('span', {}, konfidenzLabel(k.konfidenz)),
              k.quelle ? h('span', {}, ' · ' + k.quelle) : null
            ),
            TrustBadge(
              k.konfidenz === 'hoch' ? 'hoch' : k.konfidenz === 'niedrig' ? 'niedrig' : 'mittel',
              k.herkunft === 'kuratiert' ? 'kuratiert' : 'KI',
              k.quelle || ''
            )
          );
        })
      ));
    }

    // Offene Abgrenzungsfragen
    if (offeneFragen.length > 0) {
      var frage = offeneFragen[0]; // jeweils eine Frage
      var beantw = beantwortet[frage.q];
      children.push(
        h('div', { class: 'rk-diag-frage' },
          h('div', { class: 'rk-eyebrow' }, t('diag.abgrenzung')),
          h('p', { class: 'rk-q' }, frage.q),
          h('div', { class: 'rk-answers' }, (frage.options || []).map(function (o) {
            return AnswerChip({
              active: beantw === o.a,
              onClick: function () { props.onAbgrenzung(frage.q, o.a, o.tag); },
              children: h('span', { class: 'rk-diag-opt' }, o.a)
            });
          }))
        )
      );
    }

    // Weiter/Unklar
    children.push(
      h('div', { class: 'rk-diag' },
        BigButton({
          variant: gewaehlt ? 'primary' : 'soft',
          onClick: props.onWeiter,
          children: t('diag.weiter')
        }),
        h('button', { class: 'rk-ghost rk-full rk-diag-unclear', onClick: props.onUnklar },
          t('diag.unklar'))
      )
    );

    if (props.lotseOptionen && props.lotseOptionen.length) {
      children.push(SteerBar({ lotseOptionen: props.lotseOptionen, onLotseAktion: props.onLotseAktion }));
    }

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: t('nav.zurueck'), children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      children: children
    });
  }

  /* ===================== WIPE SCREEN (PROJ-20 — Datenlöschung) ===================== */
  function WipeScreen(props) {
    var device = props.device;
    var dl = props.datenloeschung || {};
    var allDone = dl.backup && dl.loeschen && dl.abmelden;
    var anyDone = dl.backup || dl.loeschen || dl.abmelden;
    var steps = [
      { field: 'backup', label: t('wipe.backup') },
      { field: 'loeschen', label: t('wipe.loeschen') },
      { field: 'abmelden', label: t('wipe.abmelden') },
    ];

    return Screen({
      bar: AppBar({
        left: IconBtn({ onClick: props.onBack, label: t('nav.zurueck'), children: BackIcon() }),
        title: deviceTitle(device),
        right: docBtn(props.onProtocol)
      }),
      footer: h('div', { class: 'rk-wipe-disp' },
        BigButton({ variant: allDone ? 'primary' : 'soft', onClick: props.onWeiter, children: t('wipe.weiter') }),
        !anyDone
          ? h('button', { class: 'rk-ghost rk-full rk-wipe-skip', onClick: props.onSkip }, t('wipe.skip'))
          : null
      ),
      children: [
        h('div', { class: 'rk-eyebrow' }, t('wipe.eyebrow')),
        h('div', { class: 'rk-wipe' },
          h('h2', { class: 'rk-q rk-q-tight' }, t('wipe.titel')),
          h('p', { class: 'rk-q-hint rk-wipe-head' }, t('wipe.hinweis')),
          h('div', {},
            steps.map(function (step) {
              var on = !!dl[step.field];
              return h('button', {
                class: 'rk-wipe-step' + (on ? ' rk-wipe-on' : ''),
                onClick: function () { props.onToggle(step.field); }
              },
                h('span', { class: 'rk-wipe-check' }, on ? '☑' : '☐'),
                h('span', {}, step.label)
              );
            })
          ),
          (!anyDone)
            ? h('div', { class: 'rk-wipe-warn' }, t('wipe.warn'))
            : null
        )
      ]
    });
  }

  /* ===================== MEDIA CONSENT SHEET (PROJ-27) ===================== */
  function MediaConsentSheet(props) {
    var sheet = h('div', { class: 'rk-sheet' },
      h('div', { class: 'rk-sheet-grip' }),
      h('div', { class: 'rk-sheet-title' }, t('media.consent.titel')),
      h('div', { class: 'rk-sheet-body' },
        h('div', { class: 'rk-media-consent' },
          h('p', { class: 'rk-sheet-note' }, t('media.consent.body')),
          h('div', { class: 'rk-consent-btns' },
            h('button', { class: 'rk-consent-yes', onClick: props.onAccept }, t('media.consent.ok')),
            h('button', { class: 'rk-consent-no', onClick: props.onDecline }, t('media.consent.nein'))
          )
        )
      )
    );
    sheet.addEventListener('click', function (e) { e.stopPropagation(); });
    var scrim = h('div', { class: 'rk-sheet-scrim' }, sheet);
    return scrim;
  }

  /* ===================== MEDIA PANEL (PROJ-27, eingebettet in StartScreen) ===================== */
  function MediaPanel(props) {
    var medienConsent = props.medienConsent;
    var medien = props.medien || [];
    var lang = props.lang || 'de';

    // Barcode-Detect-Support
    var hasBarcodeDetector = typeof window.BarcodeDetector !== 'undefined';
    // Speech-Support
    var hasSpeech = typeof window.webkitSpeechRecognition !== 'undefined' || typeof window.SpeechRecognition !== 'undefined';
    // Camera-Support
    var hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    function capturePhoto() {
      if (!medienConsent) { props.setMediaConsentOpen(true); return; }
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = function () {
        var file = input.files && input.files[0];
        if (!file) return;
        props.uploadMedium(file, 'foto', null);
      };
      input.click();
    }

    function captureVoice() {
      if (!medienConsent) { props.setMediaConsentOpen(true); return; }
      var SpeechRec = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!SpeechRec) {
        toast(t('media.unavail'));
        return;
      }
      var rec = new SpeechRec();
      rec.lang = lang === 'en' ? 'en-US' : 'de-DE';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      // Live-Indikator
      var indicator = document.getElementById('rk-voice-indicator');
      if (indicator) indicator.style.display = 'block';

      rec.onresult = function (e) {
        var transcript = e.results[0][0].transcript;
        if (indicator) indicator.style.display = 'none';
        // Erkannten Text zur Korrektur anzeigen
        var corrEl = document.getElementById('rk-voice-correct-el');
        if (corrEl) {
          corrEl.style.display = 'block';
          corrEl.querySelector('.rk-voice-correct-text') && (corrEl.querySelector('.rk-voice-correct-text').textContent = transcript);
        }
        // Text in das Diagnose-Feld einfügen
        if (props.onVoiceResult) props.onVoiceResult(transcript);
      };
      rec.onerror = function () {
        if (indicator) indicator.style.display = 'none';
        toast(t('media.unavail'));
      };
      rec.onend = function () {
        if (indicator) indicator.style.display = 'none';
      };
      rec.start();
    }

    function scanBarcode() {
      if (!medienConsent) { props.setMediaConsentOpen(true); return; }
      if (!hasBarcodeDetector) {
        toast(t('media.unavail'));
        return;
      }
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          var detector = new window.BarcodeDetector();
          detector.detect(img).then(function (barcodes) {
            URL.revokeObjectURL(url);
            if (barcodes && barcodes.length > 0) {
              var val = barcodes[0].rawValue;
              if (props.onBarcodeResult) props.onBarcodeResult(val);
              toast(t('media.scanResult') + ' ' + val);
            } else {
              toast(t('media.unavail'));
            }
          }).catch(function () {
            URL.revokeObjectURL(url);
            toast(t('media.unavail'));
          });
        };
        img.src = url;
      };
      input.click();
    }

    var btns = [
      h('button', {
        class: 'rk-cap-btn rk-cap-photo' + (!hasCamera && !medienConsent ? ' rk-cap-unavail' : ''),
        onClick: capturePhoto,
        title: t('media.foto'),
      }, '📷'),
      h('button', {
        class: 'rk-cap-btn rk-cap-voice' + (!hasSpeech ? ' rk-cap-unavail' : ''),
        onClick: captureVoice,
        title: t('media.sprache'),
      }, '🎙️'),
      h('button', {
        class: 'rk-cap-btn rk-cap-scan' + (!hasBarcodeDetector ? ' rk-cap-unavail' : ''),
        onClick: scanBarcode,
        title: t('media.barcode'),
      }, '🔖'),
    ];

    var voiceIndicator = h('div', {
      id: 'rk-voice-indicator', class: 'rk-voice-live',
      style: { display: 'none' }
    }, t('media.voiceLive'));

    var voiceCorrect = h('div', {
      id: 'rk-voice-correct-el', class: 'rk-voice-correct',
      style: { display: 'none' }
    },
      h('span', {}, t('media.voiceCorrect')),
      h('span', { class: 'rk-voice-correct-text' }, '')
    );

    var scanResult = h('div', { class: 'rk-scan-result', style: { display: 'none' } }, '');
    var qualityWarn = h('div', { class: 'rk-quality-warn', style: { display: 'none' } }, t('media.qualityWarn'));

    var toTextBtn = h('button', {
      class: 'rk-to-text rk-ghost',
      onClick: function () { if (props.onToText) props.onToText(); },
    }, t('media.toText'));

    // Medien-Vorschau
    var grid = medien.length
      ? h('div', { class: 'rk-media-grid' },
        medien.map(function (m) {
          return h('div', { class: 'rk-media-item' },
            m.art === 'foto' || m.art === 'video'
              ? h('div', { class: 'rk-media-thumb' },
                h('span', { class: 'rk-media-art' }, m.art === 'foto' ? '📷' : '🎬'))
              : h('div', { class: 'rk-media-thumb' }, h('span', { class: 'rk-media-art' }, '🎙️')),
            h('button', { class: 'rk-media-remove', onClick: function () { if (props.removeMedium) props.removeMedium(m.id); } }, '✕')
          );
        })
      )
      : null;

    return h('div', { class: 'rk-media' },
      h('div', { class: 'rk-media' }, btns),
      voiceIndicator,
      voiceCorrect,
      scanResult,
      qualityWarn,
      grid,
      toTextBtn
    );
  }

  /* ===================== MEHRFACHDEFEKTE GESAMT-FAZIT BLOCK (PROJ-21) ===================== */
  function GesamtFazitBlock(props) {
    var defekte = props.defekte || [];
    var gesamtFazit = props.gesamtFazit;
    if (!defekte.length) return null;

    // Einzelampeln (immer sichtbar bei >=2)
    var ampelListe = defekte.length >= 2
      ? h('div', { class: 'rk-defekt-list' }, defekte.map(function (d, i) {
        var lights = d.lights || [];
        return h('div', { class: 'rk-defekt-rank', 'data-rank': i + 1 },
          h('div', { class: 'rk-diag-cause' }, d.name || d.id),
          h('div', { class: 'rk-ampelcard' }, lights.map(function (l) {
            return LightRow({ light: l, onInfo: function () {} });
          }))
        );
      }))
      : null;

    // Gesamt-Fazit (nur bei >=2)
    var fazitBlock = (defekte.length >= 2 && gesamtFazit)
      ? h('div', { class: 'rk-fazit' },
        h('div', { class: 'rk-fazit-head' }, t('fazit.titel')),
        h('div', { class: 'rk-fazit-reco' }, gesamtFazit.recommend || ''),
        gesamtFazit.knackpunktId
          ? h('div', { class: 'rk-fazit-knack' },
            h('b', {}, t('fazit.knackpunkt')), ' ', gesamtFazit.knackpunktId)
          : null,
        gesamtFazit.begruendung
          ? h('div', { class: 'rk-fazit-why' },
            h('b', {}, t('fazit.begruendung')), ' ', gesamtFazit.begruendung)
          : null
      )
      : null;

    return h('div', {}, ampelListe, fazitBlock);
  }

  /* ===================== EXPORT — WINDOW-ASSIGNMENT (alle Screens) ===================== */
  Object.assign(window, {
    StartScreen: StartScreen, OwnershipScreen: OwnershipScreen, TriageScreen: TriageScreen,
    AmpelScreen: AmpelScreen, UnclearScreen: UnclearScreen, DecisionScreen: DecisionScreen,
    SkillAskScreen: SkillAskScreen, GateScreen: GateScreen, RepairScreen: RepairScreen,
    ResultScreen: ResultScreen, PathScreen: PathScreen, ProtocolContent: ProtocolContent,
    UnivTriageScreen: UnivTriageScreen, VermittlungScreen: VermittlungScreen,
    EntsorgungScreen: EntsorgungScreen, ProduktsucheScreen: ProduktsucheScreen,
    BeschaffungScreen: BeschaffungScreen,
    // Stufe-3
    RecallScreen: RecallScreen, DiagScreen: DiagScreen, WipeScreen: WipeScreen,
    MediaConsentSheet: MediaConsentSheet, MediaPanel: MediaPanel,
    GesamtFazitBlock: GesamtFazitBlock, SteerBar: SteerBar,
    ConsentGateOverlay: ConsentGateOverlay, ConsentStatus: ConsentStatus,
  });
})();
