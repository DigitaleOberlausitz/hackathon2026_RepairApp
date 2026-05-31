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

  /* ---- Standard-Screen: Kopfzeile (sticky) · Body · Fußleiste (sticky) ---- */
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

  /* =====================================================================
     KARTEN-RENDERER (UI-Namespace) — Chat-Flow PROJ-37
     Jede Funktion erhält die `daten` einer Karte (Schema-Vertrag aus
     repair/cards.py) und liefert ein DOM-Element. Reine View-Bausteine,
     keine Statemachine — werden von screens.js (renderKarte) aufgerufen.
     ===================================================================== */

  // Karten-Ampel nutzt gruen/gelb/rot (cards.py) — Mapping auf die vorhandenen
  // Theme-Tokens (gut/mittel/stop) der levelMeta-Atome.
  function cardLevelMeta(level) {
    var l = ('' + (level || '')).toLowerCase();
    if (l === 'gruen' || l === 'grün' || l === 'gut' || l === 'green') {
      return { dot: 'var(--gut)', bg: 'var(--gut-bg)', ink: 'var(--gut-ink)', label: 'grün', face: '🟢' };
    }
    if (l === 'rot' || l === 'stop' || l === 'red') {
      return { dot: 'var(--stop)', bg: 'var(--stop-bg)', ink: 'var(--stop-ink)', label: 'rot', face: '🔴' };
    }
    return { dot: 'var(--mittel)', bg: 'var(--mittel-bg)', ink: 'var(--mittel-ink)', label: 'gelb', face: '🟡' };
  }

  // Trust-Zeile aus dem `trust`-Objekt einer Karte (immer sichtbar, D3/A5).
  function cardTrustRow(trust, strong) {
    trust = trust || {};
    var lvl = normTrustLevel(trust.level || trust.konfidenz);
    var m = trustMeta(lvl);
    var hinweis = trust.hinweis || 'Die KI kann Fehler machen.';
    return h('div', { class: 'rk-trust ' + m.cls + (strong ? ' rk-trust-strong' : ''), title: trust.konfidenz ? ('Konfidenz: ' + trust.konfidenz) : '' },
      h('span', { class: 'rk-trust-dot' }, m.dot),
      trust.quelle ? h('span', { class: 'rk-trust-src' }, 'Quelle: ' + trust.quelle) : null,
      h('span', { class: 'rk-trust-note' }, (strong ? '⚠️ ' : '') + hinweis)
    );
  }

  function cardShell(title, eyebrow, kids) {
    var children = [];
    if (eyebrow) children.push(h('div', { class: 'rk-eyebrow' }, eyebrow));
    if (title) children.push(h('div', { class: 'rk-card-title' }, title));
    return h('div', { class: 'rk-card' }, children.concat(kids || []));
  }

  /* ---- aufnahme: strukturierte Problemaufnahme (Schicht A) ---- */
  function CardAufnahme(d) {
    d = d || {};
    var rows = [];
    function row(label, val) { if (val) rows.push(h('div', { class: 'rk-card-row' }, h('span', { class: 'rk-card-k' }, label), h('span', {}, val))); }
    row('Symptom', d.symptom);
    row('Kategorie', d.kategorie);
    row('Bedingungen', d.bedingungen);
    row('Seit wann', d.seit_wann);
    row('Getestet', d.getestet);
    if (d.eigentum && (d.eigentum.ist_eigentuemer != null || d.eigentum.kostentraeger)) {
      var eig = (d.eigentum.ist_eigentuemer === false ? 'fremdes Gerät' : d.eigentum.ist_eigentuemer === true ? 'eigenes Gerät' : '')
        + (d.eigentum.kostentraeger ? ' · Kosten: ' + d.eigentum.kostentraeger : '');
      row('Eigentum', eig);
    }
    return cardShell('Aufgenommen', 'Aufnahme', rows.length ? rows : [h('p', { class: 'rk-card-empty' }, '—')]);
  }

  /* ---- diagnose: Ursachen-Kandidaten + Unklar-Pfad (D20) ---- */
  function CardDiagnose(d) {
    d = d || {};
    var kandidaten = d.kandidaten || [];
    var fragen = d.abgrenzungsfragen || [];
    var kids = [];
    if (d.unklar) {
      kids.push(h('div', { class: 'rk-card-unklar' },
        h('span', { class: 'rk-card-unklar-e' }, '🤔'),
        h('div', {},
          h('div', { class: 'rk-card-unklar-t' }, 'Keine verlässliche Eingrenzung möglich'),
          h('p', { class: 'rk-card-unklar-b' }, 'Ich täusche hier lieber keine Sicherheit vor. Am besten einer Fachkraft oder einem Repair Café vorlegen.')
        )
      ));
    }
    if (kandidaten.length) {
      kids.push(h('div', { class: 'rk-diag' }, kandidaten.map(function (k) {
        var konf = k.konfidenz || k.konf || '';
        return h('div', { class: 'rk-diag-cand' },
          h('div', { class: 'rk-diag-cause' }, k.ursache || k.name || k.id || '—'),
          (k.herkunft || konf || k.quelle)
            ? h('div', { class: 'rk-diag-src' },
              k.herkunft ? h('span', {}, k.herkunft) : null,
              konf ? h('span', {}, (k.herkunft ? ' · ' : '') + 'Konfidenz: ' + konf) : null,
              k.quelle ? h('span', {}, ' · ' + k.quelle) : null)
            : null,
          k.begruendung ? h('p', { class: 'rk-card-b' }, k.begruendung) : null
        );
      })));
    }
    if (fragen.length) {
      kids.push(h('div', { class: 'rk-card-fragen' },
        h('div', { class: 'rk-eyebrow' }, 'Abgrenzungsfragen'),
        h('ul', { class: 'rk-card-ul' }, fragen.map(function (q) { return h('li', {}, q); }))
      ));
    }
    if (d.trust) kids.push(cardTrustRow(d.trust, !!d.unklar));
    return cardShell('Mögliche Ursachen', 'Diagnose', kids);
  }

  /* ---- ampel: 4 Achsen + Gesamt + trust (immer sichtbar) ---- */
  function CardAmpel(d) {
    d = d || {};
    var achsen = d.achsen || {};
    var defs = [
      { key: 'sicherheit', icon: '⚡', label: 'Sicherheit' },
      { key: 'komplexitaet', icon: '🧩', label: 'Komplexität' },
      { key: 'kosten', icon: '💶', label: 'Kosten' },
      { key: 'machbarkeit', icon: '🛠️', label: 'Machbarkeit' },
    ];
    var stop = ('' + (d.gesamt || '')).toLowerCase() === 'rot';
    var gm = cardLevelMeta(d.gesamt);
    var kids = [];
    if (d.defekt) kids.push(h('div', { class: 'rk-card-defekt' }, '🔧 ' + d.defekt));
    kids.push(h('div', { class: 'rk-ampelcard' }, defs.map(function (def) {
      var m = cardLevelMeta(achsen[def.key]);
      return h('div', { class: 'rk-light', style: { background: m.bg } },
        h('span', { class: 'rk-light-emoji' }, def.icon),
        h('span', { class: 'rk-light-main' },
          h('span', { class: 'rk-light-key' }, def.label),
          h('span', { class: 'rk-light-note', style: { color: m.ink } }, m.label)
        ),
        h('span', { class: 'rk-light-face', style: { background: m.dot }, title: m.label })
      );
    })));
    kids.push(h('div', { class: 'rk-verdict ' + (stop ? 'rk-verdict-stop' : 'rk-verdict-go') },
      h('div', { class: 'rk-verdict-title' }, gm.face + ' Gesamt: ' + gm.label),
      d.begruendung ? h('p', { class: 'rk-verdict-body' }, d.begruendung) : null
    ));
    // trust.hinweis IMMER sichtbar (D3/A5)
    kids.push(cardTrustRow(d.trust, stop));
    return cardShell('Worauf du dich einlässt', 'Einschätzung', kids);
  }

  /* ---- vergleich: Reparatur / Profi / Neu / Entsorgung ---- */
  function CardVergleich(d) {
    d = d || {};
    var defs = [
      { key: 'repair', e: '🛠️', t: 'Selbst reparieren' },
      { key: 'pro', e: '🏪', t: 'Profi-Reparatur' },
      { key: 'neu', e: '🆕', t: 'Neu kaufen' },
      { key: 'entsorgung', e: '♻️', t: 'Entsorgen' },
    ];
    function cell(label, value) {
      var v = (value == null || value === '') ? '—' : value;
      return h('div', { class: 'rk-compare-row' }, h('span', { class: 'rk-compare-k' }, label), h('span', {}, v));
    }
    var cols = defs.filter(function (def) { return d[def.key]; }).map(function (def) {
      var p = d[def.key] || {};
      var isReco = d.empfehlung === def.key;
      return h('div', { class: 'rk-compare-path' + (isReco ? ' rk-compare-reco' : '') },
        h('div', { class: 'rk-compare-head' }, h('span', {}, def.e + ' ' + def.t), isReco ? h('span', { class: 'rk-compare-reco' }, '★ Empfehlung') : null),
        cell('💶 Geld', p.geld),
        cell('⏱️ Zeit', p.zeit),
        cell('🌍 Ökologie', p.umwelt || p.oekologie),
        p.foerderung ? cell('🎁 Förderung', p.foerderung) : null
      );
    });
    var kids = [
      h('div', { class: 'rk-eyebrow' }, 'Vergleich aller Wege' + (d.geschaetzt ? ' (geschätzt)' : '')),
      h('div', { class: 'rk-compare-4' }, cols),
      d.begruendung ? h('div', { class: 'rk-compare-begruendung' }, '💡 ' + d.begruendung) : null,
    ];
    if (d.trust) kids.push(cardTrustRow(d.trust, false));
    return cardShell(null, null, kids);
  }

  /* ---- schritte: DIY-Anleitung (Schicht B) inkl. Gefahr/Garantie ---- */
  function CardSchritte(d) {
    d = d || {};
    var schritte = d.schritte || [];
    var kids = [];
    if (d.garantie_hinweis) {
      kids.push(h('div', { class: 'rk-card-hinweis rk-card-hinweis-warnung' }, '⚠️ ' + d.garantie_hinweis));
    }
    if (d.bestaetigung_noetig) {
      kids.push(h('div', { class: 'rk-card-hinweis rk-card-hinweis-kritisch' },
        '☠️ ' + (d.bestaetigung_text || 'Bist du volljährig? Traust du dir das zu? Im Zweifel: Profi.')));
    }
    kids.push(h('ol', { class: 'rk-steps' }, schritte.map(function (s, i) {
      var cls = 'rk-step' + (s.danger ? ' rk-step-danger' : s.safety ? ' rk-step-safety' : '') + (s.handoff ? ' rk-step-handoff' : '');
      return h('li', { class: cls },
        s.danger ? h('span', { class: 'rk-step-flag' }, '☠️ Gefahr') : (s.safety ? h('span', { class: 'rk-step-flag rk-step-flag-safety' }, '⚡ Sicherheit') : null),
        h('div', { class: 'rk-step-title' }, (i + 1) + '. ' + (s.titel || '')),
        s.anfaenger ? h('p', { class: 'rk-step-body' }, s.anfaenger) : null,
        (s.profi && s.profi !== s.anfaenger) ? h('p', { class: 'rk-step-pro' }, 'Geübt: ' + s.profi) : null,
        s.handoff ? h('div', { class: 'rk-handoff' }, '📎 Hier ggf. an eine Fachkraft übergeben — dein Protokoll geht mit.') : null
      );
    })));
    if (d.misserfolg_pfad) {
      kids.push(h('div', { class: 'rk-card-hinweis rk-card-hinweis-info' }, '↩️ Klappt es nicht? ' + d.misserfolg_pfad));
    }
    if (d.trust) kids.push(cardTrustRow(d.trust, schritte.some(function (s) { return s.danger; })));
    return cardShell('Schritt für Schritt', 'Anleitung', kids);
  }

  /* ---- hinweis: art/schwere -> Farbe (info|warnung|kritisch) ---- */
  function CardHinweis(d) {
    d = d || {};
    var schwere = d.schwere || 'info';
    var artEmoji = {
      garantie: '🧾', rueckruf: '⛔', datenloeschung: '🗑️',
      sicherheit: '⚠️', eigentum: '👤',
    };
    var emoji = artEmoji[d.art] || (schwere === 'kritisch' ? '⛔' : schwere === 'warnung' ? '⚠️' : 'ℹ️');
    return h('div', { class: 'rk-card-hinweis rk-card-hinweis-' + schwere },
      h('span', { class: 'rk-card-hinweis-e' }, emoji),
      h('span', { class: 'rk-card-hinweis-t' }, d.text || '')
    );
  }

  /* ---- anbieter: Repair Cafés / Werkstätten ---- */
  function CardAnbieter(d) {
    d = d || {};
    var eintraege = d.eintraege || [];
    var kids = eintraege.length
      ? eintraege.map(function (it) {
        return h('div', { class: 'rk-svc-card' },
          h('div', { class: 'rk-svc-name' }, it.name || '—', it.typ ? h('span', { class: 'rk-svc-typ' }, it.typ) : null),
          (it.adresse || it.ort) ? h('div', { class: 'rk-svc-meta' }, '📍 ' + [it.adresse, it.plz, it.ort].filter(Boolean).join(' ')) : null,
          it.spezialisierung ? h('div', { class: 'rk-svc-meta' }, 'Schwerpunkt: ' + it.spezialisierung) : null,
          it.kontakt ? h('div', { class: 'rk-svc-meta' }, '☎ ' + it.kontakt) : null,
          it.kostenhinweis ? h('div', { class: 'rk-svc-cost' }, '💶 ' + it.kostenhinweis) : null
        );
      })
      : [h('p', { class: 'rk-card-empty' }, 'Keine Anbieter gefunden.')];
    return cardShell('Hilfe vor Ort', 'Anbieter', kids);
  }

  /* ---- ersatzteil: Teile + Affiliate-Leitplanke ---- */
  function CardErsatzteil(d) {
    d = d || {};
    var eintraege = d.eintraege || [];
    var kids = eintraege.length
      ? eintraege.map(function (it) {
        var bo = it.bestelloption || {};
        return h('div', { class: 'rk-parts-item' },
          h('div', { class: 'rk-svc-name' }, it.teil || it.name || '—', it.preis ? h('span', { class: 'rk-parts-price' }, '💶 ' + it.preis) : null),
          it.passendFuer ? h('div', { class: 'rk-svc-meta' }, 'Passend für: ' + it.passendFuer) : null,
          it.verfuegbarkeit ? h('div', { class: 'rk-svc-meta' }, it.verfuegbarkeit) : null,
          bo.verfuegbar
            ? h('div', { class: 'rk-order-opt' },
              h('span', { class: 'rk-affiliate' }, '🔗 Partner-Link (Provision)'),
              bo.partner ? h('span', { class: 'rk-svc-meta' }, bo.partner) : null)
            : null
        );
      })
      : [h('p', { class: 'rk-card-empty' }, 'Keine Ersatzteile gefunden.')];
    if (d.affiliate_hinweis) {
      kids.push(h('div', { class: 'rk-order-disclaimer' }, d.affiliate_hinweis));
    }
    return cardShell('Ersatzteile', 'Beschaffung', kids);
  }

  /* ---- erfolg: Wirkungs-Rückblick ---- */
  function CardErfolg(d) {
    d = d || {};
    var cells = [];
    if (d.gespart_geld) cells.push(h('div', { class: 'rk-impact-cell' }, h('span', { class: 'rk-impact-num' }, d.gespart_geld), h('span', { class: 'rk-impact-lab' }, 'gespart')));
    if (d.gespart_co2) cells.push(h('div', { class: 'rk-impact-cell' }, h('span', { class: 'rk-impact-num' }, d.gespart_co2), h('span', { class: 'rk-impact-lab' }, 'CO₂ vermieden')));
    cells.push(h('div', { class: 'rk-impact-cell' }, h('span', { class: 'rk-impact-num' }, '1'), h('span', { class: 'rk-impact-lab' }, 'Gerät gerettet')));
    return h('div', { class: 'rk-card rk-card-erfolg' },
      h('div', { class: 'rk-result-emoji' }, '🎉'),
      d.mutmach_satz ? h('p', { class: 'rk-card-mutmach' }, d.mutmach_satz) : null,
      h('div', { class: 'rk-impact' }, cells)
    );
  }

  /* ---- frage: EINE gezielte Rückfrage mit Optionen/Freitext/Bild (Chat) ----
     ctx = { interaktiv, onAntwort(text), onAttach(files), pendingMedien } —
     nur die jüngste frage-Karte ist interaktiv; ältere werden ausgegraut. */
  function CardFrage(d, ctx) {
    d = d || {};
    ctx = ctx || {};
    var interaktiv = !!ctx.interaktiv;
    var optionen = Array.isArray(d.optionen) ? d.optionen : [];
    var mehrfach = !!d.mehrfachauswahl;
    var freitext = (d.freitext_erlaubt !== false); // Default: erlaubt
    var bildErlaubt = !!d.bild_erlaubt;

    var kids = [];
    if (d.feld) kids.push(h('div', { class: 'rk-eyebrow' }, '' + d.feld));
    kids.push(h('div', { class: 'rk-frage-q' }, d.frage || '—'));

    // lokaler Mehrfachauswahl-Zustand (lebt bis zum nächsten render())
    var gewaehlt = [];

    if (optionen.length) {
      var submitBtn = null;
      var chipEls = [];

      function updateSubmit() {
        if (!submitBtn) return;
        var leer = gewaehlt.length === 0;
        submitBtn.disabled = leer ? true : null;
        if (leer) submitBtn.setAttribute('disabled', '');
        else submitBtn.removeAttribute('disabled');
      }

      var chips = h('div', { class: 'rk-frage-opts' }, optionen.map(function (opt) {
        var chip = h('button', {
          class: 'rk-answer' + (interaktiv ? '' : ' rk-answer-ro'),
          disabled: interaktiv ? null : true,
          onClick: function () {
            if (!interaktiv) return;
            if (mehrfach) {
              var i = gewaehlt.indexOf(opt);
              if (i >= 0) { gewaehlt.splice(i, 1); chip.classList.remove('rk-answer-on'); }
              else { gewaehlt.push(opt); chip.classList.add('rk-answer-on'); }
              updateSubmit();
            } else {
              if (ctx.onAntwort) ctx.onAntwort(opt);
            }
          },
        }, opt);
        chipEls.push(chip);
        return chip;
      }));
      kids.push(chips);

      if (mehrfach) {
        submitBtn = h('button', {
          class: 'rk-frage-submit', disabled: true,
          onClick: function () {
            if (!interaktiv || !gewaehlt.length) return;
            if (ctx.onAntwort) ctx.onAntwort(gewaehlt.join(', '));
          },
        }, 'Auswahl absenden');
        kids.push(submitBtn);
      }
    }

    if (freitext && interaktiv) {
      kids.push(h('div', { class: 'rk-frage-frei-hint' }, '… oder eigene Antwort unten eingeben'));
    }

    if (bildErlaubt && interaktiv) {
      var fileInput = h('input', {
        type: 'file', accept: 'image/jpeg,image/png,image/webp,application/pdf',
        multiple: true, style: { display: 'none' },
      });
      fileInput.addEventListener('change', function (e) {
        if (ctx.onAttach) ctx.onAttach(e.target.files);
        e.target.value = '';
      });
      var pend = (ctx.pendingMedien || []).length;
      var attachBtn = h('button', {
        class: 'rk-frage-attach', onClick: function () { fileInput.click(); },
      }, '📎 Foto anhängen' + (pend ? ' (' + pend + ')' : ''));
      kids.push(h('div', { class: 'rk-frage-attachrow' }, fileInput, attachBtn));
    }

    var card = cardShell('Rückfrage', 'Frage', kids);
    if (!interaktiv) card.classList.add('rk-card-frage-ro');
    return card;
  }

  var UI = {
    Aufnahme: CardAufnahme,
    Diagnose: CardDiagnose,
    Ampel: CardAmpel,
    Vergleich: CardVergleich,
    Schritte: CardSchritte,
    Hinweis: CardHinweis,
    Anbieter: CardAnbieter,
    Ersatzteil: CardErsatzteil,
    Erfolg: CardErfolg,
    Frage: CardFrage,
    cardLevelMeta: cardLevelMeta,
    cardTrustRow: cardTrustRow,
  };

  Object.assign(window, {
    h: h,
    Screen: Screen, AppBar: AppBar, IconBtn: IconBtn,
    BigButton: BigButton, GhostButton: GhostButton, AnswerChip: AnswerChip,
    ProgressDots: ProgressDots, levelMeta: levelMeta, LightRow: LightRow,
    Slot: Slot, Sheet: Sheet, TrustBadge: TrustBadge, toast: toast,
    trustMeta: trustMeta, normTrustLevel: normTrustLevel,
    UI: UI,
  });
})();
