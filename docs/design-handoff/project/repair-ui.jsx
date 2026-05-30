/* repair-ui.jsx — gemeinsame Bausteine (Phone-Frame, Screen-Layout, Buttons,
   Ampel-Atome, Platzhalter). Exportiert nach window für die Screen-Datei. */
const { useState, useRef, useEffect } = React;

/* ---- Neutrales, markenloses Smartphone ---- */
function PhoneFrame({ vars, chrome, children }) {
  const light = chrome !== 'dark';
  const icon = light ? '#16140f' : '#f7f3ee';
  return (
    <div className="rk-phone" style={{ ...vars }}>
      <div className="rk-statusbar" style={{ color: icon }}>
        <span className="rk-time">9:41</span>
        <span className="rk-status-right">
          <span className="rk-bars" aria-hidden="true">
            <i style={{ height: 5 }} /><i style={{ height: 7 }} /><i style={{ height: 9 }} /><i style={{ height: 11 }} />
          </span>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.6c2 0 3.9.8 5.3 2.1M8.5 6.3c1 0 2 .4 2.7 1.1M2.9 4.7A8 8 0 0 1 8.5 2.6M5.7 7.4A4 4 0 0 1 8.5 6.3" stroke={icon} strokeWidth="1.3" strokeLinecap="round" /><circle cx="8.5" cy="9.7" r="1.1" fill={icon} /></svg>
          <span className="rk-batt" style={{ borderColor: icon }}><i style={{ background: icon }} /></span>
        </span>
      </div>
      <div className="rk-screen">{children}</div>
      <div className="rk-home" style={{ background: light ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.4)' }} />
    </div>
  );
}

/* ---- Standard-Screen: Kopfzeile (sticky) · Body (scroll) · Fußleiste (sticky) ---- */
function Screen({ bar, footer, children, pad = true, bg }) {
  return (
    <div className="rk-screenwrap" style={{ background: bg || 'var(--bg)' }}>
      {bar}
      <div className="rk-body" style={{ padding: pad ? 'var(--pad)' : 0 }}>{children}</div>
      {footer ? <div className="rk-footer">{footer}</div> : null}
    </div>
  );
}

function AppBar({ left, title, right }) {
  return (
    <div className="rk-appbar">
      <div className="rk-appbar-side">{left}</div>
      <div className="rk-appbar-title">{title}</div>
      <div className="rk-appbar-side rk-right">{right}</div>
    </div>
  );
}

function IconBtn({ children, onClick, label }) {
  return <button className="rk-iconbtn" onClick={onClick} aria-label={label}>{children}</button>;
}

/* ---- Buttons ---- */
function BigButton({ children, onClick, variant = 'primary', sub, emoji, recommend }) {
  return (
    <button className={`rk-big rk-${variant}`} onClick={onClick}>
      {recommend ? <span className="rk-reco">Empfehlung</span> : null}
      <span className="rk-big-row">
        {emoji ? <span className="rk-big-emoji">{emoji}</span> : null}
        <span className="rk-big-text">
          <span className="rk-big-title">{children}</span>
          {sub ? <span className="rk-big-sub">{sub}</span> : null}
        </span>
        <span className="rk-big-arrow">→</span>
      </span>
    </button>
  );
}

function GhostButton({ children, onClick, full }) {
  return <button className={`rk-ghost ${full ? 'rk-full' : ''}`} onClick={onClick}>{children}</button>;
}

function AnswerChip({ children, onClick, active }) {
  return <button className={`rk-answer ${active ? 'rk-answer-on' : ''}`} onClick={onClick}>{children}</button>;
}

/* ---- Fortschritt ---- */
function ProgressDots({ n, i }) {
  return (
    <div className="rk-dots">
      {Array.from({ length: n }).map((_, k) => (
        <span key={k} className={`rk-dot ${k < i ? 'done' : ''} ${k === i ? 'now' : ''}`} />
      ))}
    </div>
  );
}

/* ---- Ampel-Atome ---- */
function levelMeta(level) {
  if (level === 'gut') return { dot: 'var(--gut)', bg: 'var(--gut-bg)', ink: 'var(--gut-ink)', label: 'grün', face: '🟢' };
  if (level === 'mittel') return { dot: 'var(--mittel)', bg: 'var(--mittel-bg)', ink: 'var(--mittel-ink)', label: 'gelb', face: '🟡' };
  return { dot: 'var(--stop)', bg: 'var(--stop-bg)', ink: 'var(--stop-ink)', label: 'rot', face: '🔴' };
}

function LightRow({ light, onInfo }) {
  const m = levelMeta(light.level);
  return (
    <button className="rk-light" style={{ background: m.bg }} onClick={onInfo}>
      <span className="rk-light-emoji">{light.icon}</span>
      <span className="rk-light-main">
        <span className="rk-light-key">{light.key}</span>
        <span className="rk-light-note" style={{ color: m.ink }}>{light.note}</span>
      </span>
      <span className="rk-light-face" style={{ background: m.dot }} title={m.label} />
    </button>
  );
}

/* ---- Bild-Platzhalter (gestreift, Mono-Beschriftung) ---- */
function Slot({ label, h = 150 }) {
  return (
    <div className="rk-slot" style={{ height: h }}>
      <span className="rk-slot-tag">{label}</span>
    </div>
  );
}

/* ---- Bottom Sheet ---- */
function Sheet({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="rk-sheet-scrim" onClick={onClose}>
      <div className="rk-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="rk-sheet-grip" />
        {title ? <div className="rk-sheet-title">{title}</div> : null}
        <div className="rk-sheet-body">{children}</div>
      </div>
    </div>
  );
}

/* ---- kleines Vertrauens-/Quellen-Badge ---- */
function TrustBadge({ confidence, onClick }) {
  return (
    <button className="rk-trust" onClick={onClick}>
      <span className="rk-trust-dot" />
      <span>Quelle: {confidence.source} · Sicherheit {confidence.level}</span>
      <span className="rk-trust-i">ⓘ</span>
    </button>
  );
}

Object.assign(window, {
  PhoneFrame, Screen, AppBar, IconBtn, BigButton, GhostButton, AnswerChip,
  ProgressDots, levelMeta, LightRow, Slot, Sheet, TrustBadge,
});
