/* app.js — Zustandsmaschine + Theme-Switcher + Datenanbindung (Vanilla-JS).
   Port von repair-app.jsx. Führt durch Start → Triage → Ampel → Entscheidung →
   Begleitung → Rückblick | Weg. Eine Phone-Instanz, mittig im Frame.
   Holt Geräte via GET /api/devices, Live-Diagnose via POST /api/diagnose. */
(function () {
  'use strict';

  var h = window.h;
  var PhoneFrame = window.PhoneFrame, Screen = window.Screen, Sheet = window.Sheet;

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
      // Mutig nutzt im Dunkeln kräftigere Ampel-Hintergründe
      '--gut': AMPEL.gut, '--gut-bg': '#143524', '--gut-ink': '#7fe0a6',
      '--mittel': AMPEL.mittel, '--mittel-bg': '#3a2e10', '--mittel-ink': '#f3c969',
      '--stop': '#ff5a47', '--stop-bg': '#3a1a18', '--stop-ink': '#ff9d92',
    }),
  };

  var THEMES = { solide: SOLIDE, werkstatt: WERKSTATT, mutig: MUTIG };
  // Defaults am Phone-Root — Theme-Vars überschreiben pad/gap, font-size/motion bleiben default.
  var DEFAULT_VARS = { '--font-size': '16px', '--motion': '.22s' };

  window.REPAIR_THEMES = THEMES;
  window.REPAIR_AMPEL = AMPEL;

  /* ===================== STATE ===================== */
  function resetUi() {
    return { chooser: false, conf: false, activeLight: null, phase: 'ask', why: false };
  }

  var state = {
    themeId: 'werkstatt',   // Default: Werkstatt
    devices: {},
    device: null,
    stage: 'start',
    ti: 0,
    answers: [],
    ri: 0,
    depth: 'Anfänger',
    path: 'pro',
    proto: false,
    loading: false,
    draft: '',
    ui: resetUi(),
    phoneEl: null,
    appEl: null,
  };

  function setStage(s) { state.stage = s; state.ui = resetUi(); }

  /* ===================== HANDLER (Logik 1:1 aus repair-app.jsx) ===================== */
  function reset() {
    state.device = null; state.ti = 0; state.answers = []; state.ri = 0; state.path = 'pro';
    setStage('start'); render();
  }

  function pick(id) {
    state.device = state.devices[id];
    state.answers = []; state.ti = 0;
    setStage('triage'); render();
  }

  function answer(q, a, tag) {
    state.answers = state.answers.slice(0, state.ti).concat([{ q: q, a: a, tag: tag }]);
    if (state.ti < state.device.triage.length - 1) { state.ti = state.ti + 1; render(); }
    else { setStage('ampel'); render(); }
  }

  function triageBack() {
    if (state.ti > 0) { state.ti = state.ti - 1; state.answers = state.answers.slice(0, -1); render(); }
    else { reset(); }
  }

  function choose(key) {
    if (key === 'self') { state.ri = 0; setStage('repair'); render(); }
    else {
      state.path = key === 'replace' ? 'replace' : key === 'local' ? 'local' : 'pro';
      setStage('path'); render();
    }
  }

  function repairNext() {
    state.ri = Math.min(state.ri + 1, state.device.steps.length - 1);
    render();
  }
  function repairPrev() {
    if (state.ri > 0) { state.ri = state.ri - 1; render(); }
    else { setStage('decision'); render(); }
  }
  function repairFinish() {
    var last = state.device.steps[state.device.steps.length - 1];
    if (last.handoff) { state.path = 'pro'; setStage('path'); }
    else { setStage('result'); }
    render();
  }
  function setDepth(d) { state.depth = d; render(); }

  function goPro() { state.path = 'pro'; setStage('path'); render(); }

  function openProto() { state.proto = true; state.ui.why = false; render(); }
  function closeProto() { state.proto = false; render(); }

  /* Lokale UI-Setter (lösen Re-Render aus, außer dem Freitext-Entwurf) */
  function setChooser(v) { state.ui.chooser = v; render(); }
  function setConf(v) { state.ui.conf = v; render(); }
  function setActiveLight(v) { state.ui.activeLight = v; render(); }
  function setPhase(v) { state.ui.phase = v; render(); }
  function setWhy(v) { state.ui.why = v; render(); }
  function setDraft(v) { state.draft = v; } // kein Re-Render — Eingabefokus erhalten

  /* ===================== DATEN ===================== */
  function loadDevices() {
    fetch('/api/devices')
      .then(function (r) { return r.json(); })
      .then(function (d) { state.devices = d || {}; window.REPAIR_DEVICES = state.devices; render(); })
      .catch(function () { /* App bleibt nutzbar, Liste ggf. leer */ });
  }

  function doDiagnose() {
    var text = (state.draft || '').trim();
    if (!text) return;
    state.loading = true; render();
    fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.loading = false;
        var device = data && data.device;
        if (device) {
          // Bei source:"fallback" trotzdem normal weiterlaufen.
          state.device = device; state.answers = []; state.ti = 0;
          setStage('triage');
        }
        render();
      })
      .catch(function () { state.loading = false; render(); });
  }

  /* ===================== SCREEN-AUSWAHL ===================== */
  function LoadingScreen() {
    return Screen({
      children: [
        h('div', { class: 'rk-result-center' },
          h('div', { class: 'rk-result-emoji' }, '🔧'),
          h('h2', { class: 'rk-result-q' }, 'Einen Moment …'),
          h('p', { class: 'rk-q-hint', style: { textAlign: 'center' } }, 'Ich schaue mir dein Problem an.')
        )
      ]
    });
  }

  function currentScreen() {
    if (state.loading) return LoadingScreen();
    var s = state.stage;
    if (s === 'start') {
      return window.StartScreen({
        devices: state.devices, onPick: pick,
        chooser: state.ui.chooser, setChooser: setChooser,
        draft: state.draft, setDraft: setDraft, onDiagnose: doDiagnose,
      });
    }
    if (s === 'triage') {
      return window.TriageScreen({
        device: state.device, index: state.ti,
        onAnswer: answer, onBack: triageBack, onProtocol: openProto,
      });
    }
    if (s === 'ampel') {
      return window.AmpelScreen({
        device: state.device,
        onContinue: function () { setStage('decision'); render(); },
        onBack: function () { state.ti = state.device.triage.length - 1; setStage('triage'); render(); },
        onProtocol: openProto,
        conf: state.ui.conf, setConf: setConf,
        activeLight: state.ui.activeLight, setActiveLight: setActiveLight,
      });
    }
    if (s === 'decision') {
      return window.DecisionScreen({
        device: state.device, onChoose: choose,
        onBack: function () { setStage('ampel'); render(); },
        onProtocol: openProto,
      });
    }
    if (s === 'repair') {
      return window.RepairScreen({
        device: state.device, index: state.ri, depth: state.depth,
        onNext: repairNext, onPrev: repairPrev,
        onExit: goPro, onDepth: setDepth, onFinish: repairFinish, onProtocol: openProto,
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
      });
    }
    return LoadingScreen();
  }

  /* ===================== RENDER / MOUNT ===================== */
  function render() {
    if (!state.appEl) return;
    var screen = currentScreen();
    var protoBody = state.device
      ? window.ProtocolContent({ device: state.device, answers: state.answers, why: state.ui.why, setWhy: setWhy })
      : h('p', { class: 'rk-sheet-note' }, 'Noch kein Gerät erfasst — wähl auf der Startseite ein Gerät, dann fülle ich den Steckbrief im Hintergrund.');
    var protoSheet = Sheet({ open: state.proto, onClose: closeProto, title: 'Reparatur-Steckbrief', children: protoBody });
    var kids = [screen];
    if (protoSheet) kids.push(protoSheet);
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
      var btns = wrap.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute('data-id') === state.themeId;
        btns[i].className = 'rk-themebtn' + (on ? ' rk-themebtn-on' : '');
        btns[i].setAttribute('aria-selected', on ? 'true' : 'false');
      }
    }
    order.forEach(function (id) {
      var btn = h('button', {
        class: 'rk-themebtn', 'data-id': id, role: 'tab',
        onClick: function () { state.themeId = id; buildPhone(); paint(); },
      }, THEMES[id].label);
      wrap.appendChild(btn);
    });
    paint();
  }

  function init() {
    buildThemeSwitch();
    buildPhone();
    loadDevices();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RepairAppState = state; // Debug-Hook
})();
