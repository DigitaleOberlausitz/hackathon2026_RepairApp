/* ui.js — gemeinsame Bausteine (Phone-Frame, Screen-Layout, Buttons, Ampel-Atome,
   Platzhalter) als Vanilla-JS-DOM-Fabriken. Port von repair-ui.jsx.
   Exportiert nach window für screens.js / app.js. */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var SVG_TAGS = { svg: 1, path: 1, circle: 1, rect: 1, line: 1, g: 1, polyline: 1, polygon: 1 };

  /* ---- Hyperscript-Helfer: h(tag, attrs, ...children) -> Element ----
     attrs: { class, onClick, style:{...}, 'aria-label', ... }
     children: Strings (Textknoten), Elemente, Arrays, null/false (übersprungen). */
  function h(tag, attrs) {
    var isSvg = !!SVG_TAGS[tag];
    var el = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    attrs = attrs || {};
    for (var key in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
      var val = attrs[key];
      if (val == null || val === false) continue;
      if (key === 'class' || key === 'className') {
        if (isSvg) el.setAttribute('class', val);
        else el.className = val;
      } else if (key === 'style' && typeof val === 'object') {
        for (var s in val) {
          if (Object.prototype.hasOwnProperty.call(val, s)) el.style.setProperty(cssVarName(s), val[s]);
        }
      } else if (key === 'onClick') {
        el.addEventListener('click', val);
      } else if (key === 'onInput') {
        el.addEventListener('input', val);
      } else if (key === 'onKeydown') {
        el.addEventListener('keydown', val);
      } else if (key === 'html') {
        el.innerHTML = val;
      } else {
        el.setAttribute(key, val === true ? '' : val);
      }
    }
    var children = Array.prototype.slice.call(arguments, 2);
    appendChildren(el, children);
    return el;
  }

  function cssVarName(s) {
    // CSS-Custom-Properties (--x) unverändert lassen, sonst camelCase -> kebab-case.
    if (s.indexOf('--') === 0) return s;
    return s.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
  }

  function appendChildren(el, children) {
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c == null || c === false || c === true) continue;
      if (Array.isArray(c)) { appendChildren(el, c); continue; }
      if (typeof c === 'string' || typeof c === 'number') {
        el.appendChild(document.createTextNode(String(c)));
      } else {
        el.appendChild(c);
      }
    }
  }

  /* ---- Neutrales, markenloses Smartphone ---- */
  function PhoneFrame(opts) {
    opts = opts || {};
    var light = opts.chrome !== 'dark';
    var icon = light ? '#16140f' : '#f7f3ee';

    var statusbar = h('div', { class: 'rk-statusbar', style: { color: icon } },
      h('span', { class: 'rk-time' }, '9:41'),
      h('span', { class: 'rk-status-right' },
        h('span', { class: 'rk-bars', 'aria-hidden': 'true' },
          h('i', { style: { height: '5px' } }),
          h('i', { style: { height: '7px' } }),
          h('i', { style: { height: '9px' } }),
          h('i', { style: { height: '11px' } })
        ),
        h('svg', { width: '17', height: '12', viewBox: '0 0 17 12', fill: 'none' },
          h('path', { d: 'M8.5 2.6c2 0 3.9.8 5.3 2.1M8.5 6.3c1 0 2 .4 2.7 1.1M2.9 4.7A8 8 0 0 1 8.5 2.6M5.7 7.4A4 4 0 0 1 8.5 6.3', stroke: icon, 'stroke-width': '1.3', 'stroke-linecap': 'round' }),
          h('circle', { cx: '8.5', cy: '9.7', r: '1.1', fill: icon })
        ),
        h('span', { class: 'rk-batt', style: { borderColor: icon } }, h('i', { style: { background: icon } }))
      )
    );

    var screen = h('div', { class: 'rk-screen' });
    appendChildren(screen, [opts.children]);

    var home = h('div', { class: 'rk-home', style: { background: light ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.4)' } });

    var phone = h('div', { class: 'rk-phone' }, statusbar, screen, home);
    if (opts.vars) {
      for (var v in opts.vars) {
        if (Object.prototype.hasOwnProperty.call(opts.vars, v)) phone.style.setProperty(v, opts.vars[v]);
      }
    }
    // Referenz auf den Screen-Slot, damit app.js Screens nachladen kann.
    phone._screenSlot = screen;
    return phone;
  }

  /* ---- Standard-Screen: Kopfzeile (sticky) · Body (scroll) · Fußleiste (sticky) ---- */
  function Screen(opts) {
    opts = opts || {};
    var pad = opts.pad !== false;
    var wrap = h('div', { class: 'rk-screenwrap', style: { background: opts.bg || 'var(--bg)' } });
    if (opts.bar) wrap.appendChild(opts.bar);
    var body = h('div', { class: 'rk-body', style: { padding: pad ? 'var(--pad)' : '0' } });
    appendChildren(body, [opts.children]);
    wrap.appendChild(body);
    if (opts.footer) wrap.appendChild(h('div', { class: 'rk-footer' }, opts.footer));
    return wrap;
  }

  function AppBar(opts) {
    opts = opts || {};
    return h('div', { class: 'rk-appbar' },
      h('div', { class: 'rk-appbar-side' }, opts.left || h('span', {})),
      h('div', { class: 'rk-appbar-title' }, opts.title),
      h('div', { class: 'rk-appbar-side rk-right' }, opts.right || h('span', {}))
    );
  }

  function IconBtn(opts) {
    opts = opts || {};
    return h('button', { class: 'rk-iconbtn', onClick: opts.onClick, 'aria-label': opts.label }, opts.children);
  }

  /* ---- Buttons ---- */
  function BigButton(opts) {
    opts = opts || {};
    var variant = opts.variant || 'primary';
    var row = h('span', { class: 'rk-big-row' },
      opts.emoji ? h('span', { class: 'rk-big-emoji' }, opts.emoji) : null,
      h('span', { class: 'rk-big-text' },
        h('span', { class: 'rk-big-title' }, opts.children),
        opts.sub ? h('span', { class: 'rk-big-sub' }, opts.sub) : null
      ),
      h('span', { class: 'rk-big-arrow' }, '→')
    );
    return h('button', { class: 'rk-big rk-' + variant, onClick: opts.onClick },
      opts.recommend ? h('span', { class: 'rk-reco' }, 'Empfehlung') : null,
      row
    );
  }

  function GhostButton(opts) {
    opts = opts || {};
    return h('button', { class: 'rk-ghost ' + (opts.full ? 'rk-full' : ''), onClick: opts.onClick }, opts.children);
  }

  function AnswerChip(opts) {
    opts = opts || {};
    return h('button', { class: 'rk-answer ' + (opts.active ? 'rk-answer-on' : ''), onClick: opts.onClick }, opts.children);
  }

  /* ---- Fortschritt ---- */
  function ProgressDots(opts) {
    opts = opts || {};
    var n = opts.n, i = opts.i;
    var wrap = h('div', { class: 'rk-dots' });
    for (var k = 0; k < n; k++) {
      wrap.appendChild(h('span', { class: 'rk-dot ' + (k < i ? 'done' : '') + ' ' + (k === i ? 'now' : '') }));
    }
    return wrap;
  }

  /* ---- Ampel-Atome ---- */
  function levelMeta(level) {
    if (level === 'gut') return { dot: 'var(--gut)', bg: 'var(--gut-bg)', ink: 'var(--gut-ink)', label: 'grün', face: '🟢' };
    if (level === 'mittel') return { dot: 'var(--mittel)', bg: 'var(--mittel-bg)', ink: 'var(--mittel-ink)', label: 'gelb', face: '🟡' };
    return { dot: 'var(--stop)', bg: 'var(--stop-bg)', ink: 'var(--stop-ink)', label: 'rot', face: '🔴' };
  }

  function LightRow(opts) {
    opts = opts || {};
    var light = opts.light;
    var m = levelMeta(light.level);
    return h('button', { class: 'rk-light', style: { background: m.bg }, onClick: opts.onInfo },
      h('span', { class: 'rk-light-emoji' }, light.icon),
      h('span', { class: 'rk-light-main' },
        h('span', { class: 'rk-light-key' }, light.key),
        h('span', { class: 'rk-light-note', style: { color: m.ink } }, light.note)
      ),
      h('span', { class: 'rk-light-face', style: { background: m.dot }, title: m.label })
    );
  }

  /* ---- Bild-Platzhalter (gestreift, Mono-Beschriftung) ---- */
  function Slot(opts) {
    opts = opts || {};
    var height = (opts.h == null ? 150 : opts.h);
    return h('div', { class: 'rk-slot', style: { height: height + 'px' } },
      h('span', { class: 'rk-slot-tag' }, opts.label)
    );
  }

  /* ---- Bottom Sheet ---- */
  function Sheet(opts) {
    opts = opts || {};
    if (!opts.open) return null;
    var sheet = h('div', { class: 'rk-sheet' },
      h('div', { class: 'rk-sheet-grip' }),
      opts.title ? h('div', { class: 'rk-sheet-title' }, opts.title) : null,
      h('div', { class: 'rk-sheet-body' }, opts.children)
    );
    sheet.addEventListener('click', function (e) { e.stopPropagation(); });
    var scrim = h('div', { class: 'rk-sheet-scrim', onClick: opts.onClose }, sheet);
    return scrim;
  }

  /* ---- Toast (PROJ-9/10): kurze, nicht-blockierende Rückmeldung ---- */
  function toast(msg, ms) {
    try {
      var t = document.createElement('div');
      t.className = 'rk-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      void t.offsetWidth; // reflow erzwingen, damit die Transition greift
      t.className = 'rk-toast rk-toast-show';
      window.setTimeout(function () {
        t.className = 'rk-toast';
        window.setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 350);
      }, ms || 2400);
    } catch (e) { /* Toast ist optional, nie hart scheitern */ }
  }

  /* ---- Vertrauens-/Quellen-Badge (PROJ-25, durchgängig wiederverwendbar) ----
     TrustBadge(level, source, reason [, opts]) — level: 'hoch'|'mittel'|'niedrig'.
     opts: { onClick, strong } (strong = Kritikalität, deutlicherer KI-Hinweis). */
  function trustMeta(level) {
    if (level === 'hoch') return { cls: 'rk-trust-hoch', dot: '🟢' };
    if (level === 'niedrig') return { cls: 'rk-trust-niedrig', dot: '🔴' };
    return { cls: 'rk-trust-mittel', dot: '🟡' };
  }
  // toleranter Mapper: Konfidenz-/Freitext-Level → hoch|mittel|niedrig
  function normTrustLevel(level) {
    var l = ('' + (level || '')).toLowerCase();
    if (l.indexOf('hoch') >= 0 || l === 'high') return 'hoch';
    if (l.indexOf('niedrig') >= 0 || l.indexOf('gering') >= 0 || l === 'low') return 'niedrig';
    return 'mittel';
  }
  function TrustBadge(level, source, reason, opts) {
    opts = opts || {};
    var lvl = normTrustLevel(level);
    var m = trustMeta(lvl);
    var note = (opts.strong ? '⚠️ ' : '') + 'Die KI kann Fehler machen';
    var attrs = { class: 'rk-trust ' + m.cls, title: reason || '' };
    if (opts.onClick) attrs.onClick = opts.onClick;
    return h('button', attrs,
      h('span', { class: 'rk-trust-dot' }, m.dot),
      h('span', { class: 'rk-trust-src' }, 'Quelle: ' + (source || 'unbekannt')),
      h('span', { class: 'rk-trust-note' }, note),
      opts.onClick ? h('span', { class: 'rk-trust-i' }, 'ⓘ') : null
    );
  }

  Object.assign(window, {
    h: h,
    PhoneFrame: PhoneFrame, Screen: Screen, AppBar: AppBar, IconBtn: IconBtn,
    BigButton: BigButton, GhostButton: GhostButton, AnswerChip: AnswerChip,
    ProgressDots: ProgressDots, levelMeta: levelMeta, LightRow: LightRow,
    Slot: Slot, Sheet: Sheet, TrustBadge: TrustBadge, toast: toast,
    trustMeta: trustMeta, normTrustLevel: normTrustLevel,
  });
})();
