/* app.js — Zustandsmaschine + Theme-Switcher + Datenanbindung (Vanilla-JS).
   Port von repair-app.jsx + Stufe-1-Erweiterungen (PROJ-1…10).
   Flow: Start → (pick/Diagnose) → Eigentum → Triage → [Unklar?] → Ampel →
         Entscheidung → [self: Können → Garantie-Gate → Reparatur(+Sicherheit) → Rückblick]
         | [andere: Weg]. Persistenz via /api/vorgang. Eine Phone-Instanz, mittig. */
(function () {
  'use strict';

  var h = window.h;
  var PhoneFrame = window.PhoneFrame, Screen = window.Screen, Sheet = window.Sheet;
  var toast = window.toast || function () {};

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

  /* ===================== STATE ===================== */
  function resetUi() {
    return { chooser: false, conf: false, activeLight: null, phase: 'ask', why: false, confirmAdult: false, confirmConfident: false };
  }

  var state = {
    themeId: 'werkstatt',
    // — transient —
    devices: {},
    loading: false,
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
    'kategorie', 'ort', 'vermittlung', 'entsorgung', 'produktsuche', 'beschaffung', 'trust'];

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
    return false;
  }

  function unclearReason() {
    if (state.diagnosis && state.diagnosis.status === 'unclear') return 'Diagnose-Konfidenz unter Schwelle: ' + (state.diagnosis.reason || '');
    if (answersContradict(state.answers)) return 'Widersprüchliche bzw. nicht verwertbare Triage-Antworten';
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

  /* ===================== HANDLER ===================== */
  function reset() {
    state.id = null; state.device = null; state.diagnosis = null;
    state.ti = 0; state.ri = 0; state.path = 'pro'; state.depth = 'Anfänger';
    state.answers = []; state.skill = null;
    state.ownership = { isOwner: null, owner: '', costBearer: '' };
    state.warranty = { asked: false, technicalDefect: null, purchaseAge: '', choice: '' };
    state.safetyConfirms = {}; state.decisionLog = [];
    state.draft = ''; state.draftFree = {}; state.draftOwner = ''; state.draftCostBearer = '';
    state.foerder = null; state.linkUrl = null;
    state.kategorie = ''; state.trust = { level: '', source: '', reason: '' };
    resetStufe2();
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    setStage('start'); render();
  }

  function pick(id) {
    state.device = state.devices[id];
    state.diagnosis = null;
    state.answers = []; state.ti = 0; state.draftFree = {};
    state.kategorie = deriveKategorie(state.device);
    state.trust = deriveTrust(state.device, null);
    resetStufe2();
    setStage('ownership');
    commit();
  }

  function doDiagnose() {
    var text = (state.draft || '').trim();
    if (!text) return;
    state.loading = true; render();
    fetch('/api/diagnose', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.loading = false;
        var device = data && data.device;
        if (device) {
          state.device = device;
          state.diagnosis = (data && data.diagnosis) || null;
          state.answers = []; state.ti = 0; state.draftFree = {};
          state.kategorie = deriveKategorie(device);
          state.trust = deriveTrust(device, state.diagnosis);
          resetStufe2();
          logDecision('diagnose', (state.diagnosis && state.diagnosis.reason) || '',
            (data && data.source) || '', state.diagnosis && state.diagnosis.score);
          setStage('ownership');
          commit();
        } else {
          render();
        }
      })
      .catch(function () { state.loading = false; toast('Diagnose nicht möglich — versuch es nochmal.'); render(); });
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
      // PROJ-3: Können genau einmal vor Reparatur
      if (!state.skill) { setStage('skillask'); commit(); }
      else { proceedToGateOrRepair(); }
    } else if (key === 'pro' || key === 'local') {
      // PROJ-11: Anbieter-Vermittlung
      state.path = 'pro';
      state.vermittlung = Object.assign({}, state.vermittlung, { viewed: true });
      logDecision('gate', 'Pfad: Hilfe/Profi (Vermittlung)');
      setStage('vermittlung'); loadAnbieter(); commit();
    } else if (key === 'neu' || key === 'replace') {
      // PROJ-13: Alternativen / Neukauf
      state.path = 'replace';
      state.produktsuche = Object.assign({}, state.produktsuche, { viewed: true });
      logDecision('gate', 'Pfad: Neues Gerät (Produktsuche)');
      setStage('produktsuche'); loadAlternativen(); commit();
    } else if (key === 'entsorgung') {
      // PROJ-12: Entsorgung
      state.path = 'replace';
      state.entsorgung = Object.assign({}, state.entsorgung, { viewed: true });
      logDecision('gate', 'Pfad: Entsorgung');
      setStage('entsorgung'); loadEntsorgung(); commit();
    } else {
      state.path = 'pro';
      setStage('path'); commit();
    }
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
      else toast('Konnte den Vorgang nicht speichern — bitte erneut versuchen.');
    });
  }
  function exportPdf() { withVorgang(function (id) { try { window.open('/v/' + id, '_blank'); } catch (e) {} }); }
  function exportText() {
    withVorgang(function (id) {
      fetch('/api/vorgang/' + id + '/export.txt')
        .then(function (r) { return r.text(); })
        .then(function (t) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(t).then(function () { toast('Protokoll in die Zwischenablage kopiert.'); });
          }
          toast('Kopieren wird hier nicht unterstützt — bitte den Link nutzen.');
        })
        .catch(function () { toast('Konnte den Text nicht laden.'); });
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
      navigator.clipboard.writeText(state.linkUrl).then(function () { toast('Link kopiert.'); }).catch(function () {});
    } else { toast('Bitte den Link manuell markieren und kopieren.'); }
  }

  /* Lokale UI-Setter */
  function setChooser(v) { state.ui.chooser = v; render(); }
  function setConf(v) { state.ui.conf = v; render(); }
  function setActiveLight(v) { state.ui.activeLight = v; render(); }
  function setPhase(v) { state.ui.phase = v; render(); }
  function setWhy(v) { state.ui.why = v; render(); }
  function setDraft(v) { state.draft = v; } // kein Re-Render

  /* ===================== DATEN ===================== */
  function loadDevices() {
    fetch('/api/devices')
      .then(function (r) { return r.json(); })
      .then(function (d) { state.devices = d || {}; window.REPAIR_DEVICES = state.devices; render(); })
      .catch(function () { /* App bleibt nutzbar */ });
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
    if (!state.device) return window.StartScreen({
      devices: state.devices, onPick: pick, chooser: state.ui.chooser, setChooser: setChooser,
      draft: state.draft, setDraft: setDraft, onDiagnose: doDiagnose,
    });
    if (s === 'ownership') {
      return window.OwnershipScreen({
        device: state.device, ownership: state.ownership,
        draftOwner: state.draftOwner, draftCostBearer: state.draftCostBearer,
        setIsOwner: setIsOwner, setDraftOwner: setDraftOwner, setDraftCostBearer: setDraftCostBearer,
        onContinue: ownershipContinue, onBack: function () { setStage('start'); render(); }, onProtocol: openProto,
      });
    }
    if (s === 'triage') {
      var ftVal = (state.draftFree[state.ti] != null)
        ? state.draftFree[state.ti]
        : ((state.answers[state.ti] && state.answers[state.ti].freitext) || '');
      return window.TriageScreen({
        device: state.device, index: state.ti, freitext: ftVal,
        onAnswer: answer, setFreitext: setFreitext, onBack: triageBack, onProtocol: openProto,
      });
    }
    if (s === 'unclear') {
      return window.UnclearScreen({
        device: state.device, onForward: unclearForward, onAmpel: unclearToAmpel,
        onBack: function () { state.ti = Math.max(0, state.device.triage.length - 1); setStage('triage'); render(); },
        onProtocol: openProto, onRestart: reset,
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
      });
    }
    if (s === 'ampel') {
      return window.AmpelScreen({
        device: state.device, trust: state.trust,
        onContinue: ampelContinue,
        onBack: function () { state.ti = state.device.triage.length - 1; setStage('triage'); render(); },
        onProtocol: openProto,
        conf: state.ui.conf, setConf: setConf,
        activeLight: state.ui.activeLight, setActiveLight: setActiveLight,
      });
    }
    if (s === 'decision') {
      return window.DecisionScreen({
        device: state.device, foerder: state.foerder, trust: state.trust, onChoose: choose,
        onBack: function () { setStage('ampel'); render(); },
        onProtocol: openProto,
      });
    }
    if (s === 'vermittlung') {
      return window.VermittlungScreen({
        device: state.device, anbieter: state.anbieter, vermittlung: state.vermittlung,
        ort: state.ort, setOrt: setOrt, onSearch: function () { state.ort = (state.ort || ''); loadAnbieter(true); if (state.id) persist(); },
        onSelect: selectAnbieter,
        onBack: function () { setStage('decision'); loadFoerder(); render(); },
        onProtocol: openProto, onRestart: reset,
      });
    }
    if (s === 'entsorgung') {
      return window.EntsorgungScreen({
        device: state.device, entsorgung: state.entsorgungList, entsorgungSel: state.entsorgung,
        ort: state.ort, setOrt: setOrt, onSearch: function () { state.ort = (state.ort || ''); loadEntsorgung(true); if (state.id) persist(); },
        onSelect: selectEntsorgung,
        onBack: function () { setStage('decision'); loadFoerder(); render(); },
        onProtocol: openProto, onRestart: reset,
      });
    }
    if (s === 'produktsuche') {
      return window.ProduktsucheScreen({
        device: state.device, alternativen: state.alternativen, produktsuche: state.produktsuche,
        onSelect: selectAlternative,
        onBack: function () { setStage('decision'); loadFoerder(); render(); },
        onProtocol: openProto, onRestart: reset,
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
      })
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
        onClick: function () { state.themeId = id; buildPhone(); paint(); if (state.id) persist(); },
      }, THEMES[id].label);
      wrap.appendChild(btn);
    });
    paint();
  }

  /* ===================== INIT (inkl. ?v= Hydrierung PROJ-9) ===================== */
  function init() {
    buildThemeSwitch();
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
          loadDevices();
          if (state.stage === 'decision' || state.stage === 'skillask' || state.stage === 'gate') loadFoerder();
          // Stufe-2: neue Stages wiederherstellen (Daten nachladen)
          if (state.stage === 'univtriage') loadUniv();
          if (state.stage === 'vermittlung') loadAnbieter();
          if (state.stage === 'entsorgung') loadEntsorgung();
          if (state.stage === 'produktsuche') loadAlternativen();
          if (state.stage === 'beschaffung') loadErsatzteile();
        })
        .catch(function () {
          state.loading = false;
          try { history.replaceState(null, '', location.pathname); } catch (e) {}
          toast('Vorgang nicht gefunden — neuer Start.');
          setStage('start');
          buildPhone();
          loadDevices();
        });
    } else {
      buildPhone();
      loadDevices();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RepairAppState = state; // Debug-Hook
})();
