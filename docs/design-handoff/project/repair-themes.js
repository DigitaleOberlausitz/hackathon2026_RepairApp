/* repair-themes.js — drei visuelle Richtungen (brav → mutig).
   Gemeinsame Orange/Indigo-Identität, technisch-klare Typo.
   Jede Richtung liefert CSS-Variablen, die das Phone-Root setzt. */
(function () {
  // Ampelfarben — über alle Themes konsistent, leicht angepasst
  const AMPEL = {
    gut: '#1f8a4c', gutBg: '#e7f4ec', gutInk: '#0f5a30',
    mittel: '#c98a00', mittelBg: '#fbf1d9', mittelInk: '#7a5400',
    stop: '#cf3a2c', stopBg: '#fbe6e3', stopInk: '#8a2018',
  };

  const SOLIDE = {
    id: 'solide',
    label: 'A · Solide',
    sub: 'ruhig, viel Luft, vertrauenswürdig',
    flags: { labelCase: 'none', chrome: 'light', hero: 'calm', mono: false },
    vars: {
      '--bg': '#f6f5f2',
      '--surface': '#ffffff',
      '--surface-2': '#f1efea',
      '--ink': '#1b1a18',
      '--ink-soft': '#6c6862',
      '--line': '#e6e2db',
      '--line-strong': '#d8d3ca',
      '--accent': '#4940c9',
      '--accent-ink': '#ffffff',
      '--accent-soft': '#ecebfb',
      '--accent2': '#e8612c',
      '--accent2-soft': '#fdeee5',
      '--radius': '20px',
      '--radius-sm': '13px',
      '--radius-pill': '999px',
      '--shadow': '0 1px 2px rgba(20,18,14,.05), 0 8px 24px rgba(20,18,14,.06)',
      '--shadow-sm': '0 1px 2px rgba(20,18,14,.06)',
      '--font-display': "'IBM Plex Sans', system-ui, sans-serif",
      '--font-body': "'IBM Plex Sans', system-ui, sans-serif",
      '--font-mono': "'IBM Plex Mono', ui-monospace, monospace",
      '--display-weight': '600',
      '--display-tracking': '-0.01em',
      '--pad': '22px',
      '--gap': '12px',
      ...ampelVars(),
    },
  };

  const WERKSTATT = {
    id: 'werkstatt',
    label: 'B · Werkstatt',
    sub: 'kontrastreich, funktional, technisch',
    flags: { labelCase: 'upper', chrome: 'light', hero: 'panel', mono: true },
    vars: {
      '--bg': '#ecebe6',
      '--surface': '#ffffff',
      '--surface-2': '#f3f1ea',
      '--ink': '#16140f',
      '--ink-soft': '#5f5b52',
      '--line': '#dcd8cf',
      '--line-strong': '#16140f',
      '--accent': '#ff5a1f',
      '--accent-ink': '#16140f',
      '--accent-soft': '#ffe9dd',
      '--accent2': '#2a2575',
      '--accent2-soft': '#e6e4f5',
      '--radius': '12px',
      '--radius-sm': '8px',
      '--radius-pill': '8px',
      '--shadow': '4px 4px 0 #16140f',
      '--shadow-sm': '2px 2px 0 #16140f',
      '--font-display': "'Space Grotesk', system-ui, sans-serif",
      '--font-body': "'IBM Plex Sans', system-ui, sans-serif",
      '--font-mono': "'IBM Plex Mono', ui-monospace, monospace",
      '--display-weight': '700',
      '--display-tracking': '-0.02em',
      '--pad': '20px',
      '--gap': '11px',
      ...ampelVars(),
    },
  };

  const MUTIG = {
    id: 'mutig',
    label: 'C · Mutig',
    sub: 'ausdrucksstark, große Typo, Farbflächen',
    flags: { labelCase: 'upper', chrome: 'dark', hero: 'bold', mono: true },
    vars: {
      '--bg': '#141118',
      '--surface': '#211b29',
      '--surface-2': '#2e2640',
      '--ink': '#f7f3ee',
      '--ink-soft': '#a89fb5',
      '--line': '#352c44',
      '--line-strong': '#4a3f5e',
      '--accent': '#ff6a3d',
      '--accent-ink': '#1a1015',
      '--accent-soft': '#3a221c',
      '--accent2': '#9b8bff',
      '--accent2-soft': '#2a2350',
      '--radius': '22px',
      '--radius-sm': '14px',
      '--radius-pill': '999px',
      '--shadow': '0 18px 50px rgba(0,0,0,.5)',
      '--shadow-sm': '0 6px 18px rgba(0,0,0,.4)',
      '--font-display': "'Space Grotesk', system-ui, sans-serif",
      '--font-body': "'IBM Plex Sans', system-ui, sans-serif",
      '--font-mono': "'IBM Plex Mono', ui-monospace, monospace",
      '--display-weight': '700',
      '--display-tracking': '-0.03em',
      '--pad': '22px',
      '--gap': '12px',
      // Mutig nutzt im Dunkeln kräftigere Ampel-Hintergründe
      '--gut': AMPEL.gut, '--gut-bg': '#143524', '--gut-ink': '#7fe0a6',
      '--mittel': AMPEL.mittel, '--mittel-bg': '#3a2e10', '--mittel-ink': '#f3c969',
      '--stop': '#ff5a47', '--stop-bg': '#3a1a18', '--stop-ink': '#ff9d92',
    },
  };

  function ampelVars() {
    return {
      '--gut': AMPEL.gut, '--gut-bg': AMPEL.gutBg, '--gut-ink': AMPEL.gutInk,
      '--mittel': AMPEL.mittel, '--mittel-bg': AMPEL.mittelBg, '--mittel-ink': AMPEL.mittelInk,
      '--stop': AMPEL.stop, '--stop-bg': AMPEL.stopBg, '--stop-ink': AMPEL.stopInk,
    };
  }

  window.REPAIR_THEMES = { solide: SOLIDE, werkstatt: WERKSTATT, mutig: MUTIG };
  window.REPAIR_AMPEL = AMPEL;
})();
