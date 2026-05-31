/* repair-screens.jsx — die einzelnen Bildschirme der Repair-App.
   Liest Bausteine aus window (repair-ui.jsx) und exportiert Screens. */
/* PhoneFrame, Screen, AppBar … sind globale Funktionen aus repair-ui.jsx und
   hier direkt verfügbar — kein Re-Deklarieren (würde mit dem Global kollidieren). */
const RReact = React;

const BackIcon = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const DocIcon = () => <svg width="19" height="19" viewBox="0 0 20 20" fill="none"><rect x="4.5" y="2.8" width="11" height="14.4" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M7.3 6.6h5.4M7.3 9.6h5.4M7.3 12.6h3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
const SpeakIcon = () => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 8v4h2.5L10 15V5L6.5 8H4Z" fill="currentColor" /><path d="M12.5 7.5a3.4 3.4 0 0 1 0 5M14.4 5.4a6 6 0 0 1 0 9.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;

/* ===================== START ===================== */
function StartScreen({ onPick }) {
  const [chooser, setChooser] = RReact.useState(false);
  const devices = window.REPAIR_DEVICES;
  const methods = [
    { e: '📝', t: 'Tippen oder einsprechen' },
    { e: '📷', t: 'Foto machen' },
    { e: '🔖', t: 'Etikett scannen' },
  ];
  return (
    <Screen bar={null}>
      <div className="rk-brand">
        <span className="rk-brand-mark">🔧</span>
        <span className="rk-brand-name">Reparatur-Helfer</span>
      </div>
      <h1 className="rk-hero">Was ist<br />kaputt?</h1>
      <p className="rk-hero-sub">Erzähl einfach, was los ist — als würdest du es einem Bekannten beschreiben.</p>

      <button className="rk-input" onClick={() => setChooser(true)}>
        <span className="rk-input-ph">„Mein Toaster wirft das Brot nicht mehr aus …“</span>
        <span className="rk-input-mic">🎙️</span>
      </button>

      <div className="rk-methods">
        {methods.map((m) => (
          <button key={m.t} className="rk-method" onClick={() => setChooser(true)}>
            <span className="rk-method-e">{m.e}</span>
            <span className="rk-method-t">{m.t}</span>
          </button>
        ))}
      </div>

      <div className="rk-mine">
        <div className="rk-mine-head">Meine Geräte</div>
        {Object.values(devices).map((d) => (
          <button key={d.id} className="rk-device" onClick={() => onPick(d.id)}>
            <span className="rk-device-e">{d.emoji}</span>
            <span className="rk-device-main">
              <span className="rk-device-name">{d.name}</span>
              <span className="rk-device-sub">{d.blurb}</span>
            </span>
            <span className="rk-device-go">→</span>
          </button>
        ))}
      </div>

      <Sheet open={chooser} onClose={() => setChooser(false)} title="Beispiel zum Ausprobieren">
        <p className="rk-sheet-note">In dieser Demo sind zwei Geräte hinterlegt — eines geht gut aus, eines ist ein klarer Fall fürs Abraten.</p>
        {Object.values(devices).map((d) => (
          <button key={d.id} className="rk-device rk-device-sheet" onClick={() => { setChooser(false); onPick(d.id); }}>
            <span className="rk-device-e">{d.emoji}</span>
            <span className="rk-device-main">
              <span className="rk-device-name">{d.name}</span>
              <span className="rk-device-sub">{d.blurb}</span>
            </span>
            <span className="rk-device-go">→</span>
          </button>
        ))}
      </Sheet>
    </Screen>
  );
}

/* ===================== TRIAGE ===================== */
function TriageScreen({ device, index, onAnswer, onBack, onProtocol }) {
  const q = device.triage[index];
  const n = device.triage.length;
  return (
    <Screen
      bar={<AppBar
        left={<IconBtn onClick={onBack} label="Zurück"><BackIcon /></IconBtn>}
        title={<span className="rk-bar-device"><span>{device.emoji}</span>{device.name}</span>}
        right={<IconBtn onClick={onProtocol} label="Protokoll"><DocIcon /></IconBtn>}
      />}
      footer={<div className="rk-triage-foot">Frage {index + 1} von {n} · ich frage nur so viel, wie ich brauche</div>}
    >
      <ProgressDots n={n} i={index} />
      <div className="rk-eyebrow">Nachfragen</div>
      <h2 className="rk-q">{q.q}</h2>
      <p className="rk-q-hint">{q.hint}</p>
      <div className="rk-answers">
        {q.options.map((o) => (
          <AnswerChip key={o.a} onClick={() => onAnswer(q.q, o.a, o.tag)}>{o.a}</AnswerChip>
        ))}
      </div>
      <button className="rk-freeanswer" onClick={() => onAnswer(q.q, 'frei beschrieben', 'frei beschrieben')}>
        <span>Frei antworten …</span>
        <span className="rk-input-mic">🎙️</span>
      </button>
    </Screen>
  );
}

/* ===================== AMPEL ===================== */
function AmpelScreen({ device, onContinue, onBack, onProtocol }) {
  const [info, setInfo] = RReact.useState(false);
  const [conf, setConf] = RReact.useState(false);
  const [activeLight, setActiveLight] = RReact.useState(null);
  const stop = device.accentPath === 'stop';
  return (
    <Screen
      bar={<AppBar
        left={<IconBtn onClick={onBack} label="Zurück"><BackIcon /></IconBtn>}
        title={<span className="rk-bar-device"><span>{device.emoji}</span>{device.name}</span>}
        right={<IconBtn onClick={onProtocol} label="Protokoll"><DocIcon /></IconBtn>}
      />}
      footer={<BigButton variant="primary" onClick={onContinue}>Was möchtest du tun?</BigButton>}
    >
      <div className="rk-eyebrow">Einschätzung</div>
      <h2 className="rk-q rk-q-tight">Worauf du dich einlässt</h2>

      <div className="rk-ampelcard">
        {device.lights.map((l) => (
          <LightRow key={l.key} light={l} onInfo={() => setActiveLight(l)} />
        ))}
      </div>

      <div className={`rk-verdict ${stop ? 'rk-verdict-stop' : 'rk-verdict-go'}`}>
        <div className="rk-verdict-title">{stop ? '🔴 ' : '🟢 '}{device.verdictTitle}</div>
        <p className="rk-verdict-body">{device.verdictBody}</p>
      </div>

      <TrustBadge confidence={device.confidence} onClick={() => setConf(true)} />
      <div className={`rk-aiwarn ${stop ? 'rk-aiwarn-strong' : ''}`}>
        {stop ? '⚠️ Besonders hier gilt: ' : ''}Die KI kann sich irren — sieh das als Orientierung, nicht als Urteil.
      </div>

      <Sheet open={!!activeLight} onClose={() => setActiveLight(null)} title={activeLight ? `${activeLight.icon} ${activeLight.key}` : ''}>
        {activeLight ? <p className="rk-sheet-note" style={{ color: levelMeta(activeLight.level).ink }}>{activeLight.note}</p> : null}
        {activeLight ? <div className="rk-sheet-level"><span className="rk-light-face" style={{ background: levelMeta(activeLight.level).dot }} />{levelMeta(activeLight.level).face} Bewertung: {levelMeta(activeLight.level).label}</div> : null}
      </Sheet>

      <Sheet open={conf} onClose={() => setConf(false)} title="Woher kommt diese Einschätzung?">
        <p className="rk-sheet-note">Quelle: <b>{device.confidence.source}</b></p>
        <p className="rk-sheet-note">Wie sicher: <b>{device.confidence.level}</b></p>
        <p className="rk-sheet-note">{device.confidence.note}</p>
        <div className="rk-sheet-hr" />
        <p className="rk-sheet-fine">Die App verbietet dir nichts — je riskanter die Sache, desto deutlicher die Warnung. Die Verantwortung für dein Handeln bleibt bei dir.</p>
      </Sheet>
    </Screen>
  );
}

/* ===================== ENTSCHEIDUNG ===================== */
function DecisionScreen({ device, onChoose, onBack, onProtocol }) {
  const stop = device.accentPath === 'stop';
  const paths = [
    { key: 'self', e: '🛠️', t: "Ich mach's selbst", s: 'Schritt für Schritt begleitet' },
    { key: 'local', e: '🤝', t: 'Hilfe vor Ort finden', s: 'Repair Cafés & Werkstätten in der Nähe' },
    { key: 'pro', e: '🏪', t: 'Profi beauftragen', s: 'mit fertigem Protokoll für die Werkstatt' },
    { key: 'replace', e: '♻️', t: 'Ersetzen / entsorgen', s: 'inkl. fachgerechtem Entsorgungsweg' },
  ];
  return (
    <Screen
      bar={<AppBar
        left={<IconBtn onClick={onBack} label="Zurück"><BackIcon /></IconBtn>}
        title={<span className="rk-bar-device"><span>{device.emoji}</span>{device.name}</span>}
        right={<IconBtn onClick={onProtocol} label="Protokoll"><DocIcon /></IconBtn>}
      />}
    >
      <div className="rk-eyebrow">Entscheidung</div>
      <h2 className="rk-q rk-q-tight">Du entscheidest.</h2>
      <p className="rk-q-hint">
        {stop
          ? 'Ehrlich: Selbst öffnen wäre gefährlich. Ich empfehle Hilfe vor Ort — du wägst ab.'
          : 'Ich empfehle, es selbst zu probieren. Aber du hast die Wahl.'}
      </p>

      {stop ? (
        <div className="rk-compare">
          <div className="rk-compare-head">
            <span></span><span>Reparieren</span><span>Neu kaufen</span>
          </div>
          {[['💶 Geld', device.compare.repair.geld, device.compare.neu.geld],
            ['⏱️ Zeit', device.compare.repair.zeit, device.compare.neu.zeit],
            ['🌍 Umwelt', device.compare.repair.umwelt, device.compare.neu.umwelt]].map((r) => (
            <div className="rk-compare-row" key={r[0]}>
              <span className="rk-compare-k">{r[0]}</span>
              <span>{r[1]}</span>
              <span>{r[2]}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rk-paths">
        {paths.map((p) => (
          <BigButton
            key={p.key}
            variant={device.recommend === p.key ? 'primary' : 'soft'}
            recommend={device.recommend === p.key}
            emoji={p.e}
            sub={p.s}
            onClick={() => onChoose(p.key)}
          >{p.t}</BigButton>
        ))}
      </div>
    </Screen>
  );
}

/* ===================== REPARATUR-BEGLEITUNG ===================== */
function RepairScreen({ device, index, depth, onNext, onPrev, onExit, onDepth, onFinish, onProtocol }) {
  const step = device.steps[index];
  const n = device.steps.length;
  const last = index === n - 1;
  const body = depth === 'Geübt' ? step.pro : step.beginner;
  return (
    <Screen
      bar={<AppBar
        left={<IconBtn onClick={onPrev} label="Zurück"><BackIcon /></IconBtn>}
        title={<span className="rk-bar-step">Schritt {index + 1}/{n}</span>}
        right={<IconBtn onClick={onProtocol} label="Protokoll"><DocIcon /></IconBtn>}
      />}
      footer={
        <div className="rk-repair-foot">
          <GhostButton onClick={onExit}>Das wird mir zu heikel — Profi finden</GhostButton>
          <div className="rk-navrow">
            {index > 0 ? <button className="rk-nav rk-nav-ghost" onClick={onPrev}>Zurück</button> : <span />}
            <button className="rk-nav rk-nav-primary" onClick={last ? onFinish : onNext}>
              {last ? (step.handoff ? 'Zum Profi & Protokoll →' : 'Fertig — hat’s geklappt?') : 'Weiter →'}
            </button>
          </div>
        </div>
      }
    >
      <div className="rk-repair-tools">
        <div className="rk-depth">
          <button className={depth === 'Anfänger' ? 'on' : ''} onClick={() => onDepth('Anfänger')}>Anfänger</button>
          <button className={depth === 'Geübt' ? 'on' : ''} onClick={() => onDepth('Geübt')}>Geübt</button>
        </div>
        <button className="rk-speak"><SpeakIcon /> Vorlesen</button>
      </div>

      <Slot label={step.slot} h={158} />

      {step.danger ? <div className="rk-callout rk-callout-danger">☠️ Lebensgefahr möglich — bitte genau lesen.</div>
        : step.safety ? <div className="rk-callout rk-callout-safety">⚡ Sicherheit zuerst: {step.title === 'Stecker ziehen' ? 'erst ausstecken!' : 'aufpassen.'}</div>
        : null}

      <h2 className="rk-step-title">{step.title}</h2>
      <p className="rk-step-body">{body}</p>

      {step.handoff ? <div className="rk-handoff">📎 Dein Protokoll wird automatisch mitgegeben — die Werkstatt muss nicht bei null anfangen.</div> : null}
    </Screen>
  );
}

/* ===================== RÜCKBLICK (Selbst-Reparatur) ===================== */
function ResultScreen({ device, onRestart, onProtocol, onPro }) {
  const [phase, setPhase] = RReact.useState('ask'); // ask | yes | no
  if (phase === 'ask') {
    return (
      <Screen bar={<AppBar left={<span />} title={<span className="rk-bar-device"><span>{device.emoji}</span>{device.name}</span>} right={<IconBtn onClick={onProtocol} label="Protokoll"><DocIcon /></IconBtn>} />}>
        <div className="rk-result-center">
          <div className="rk-result-emoji">🤞</div>
          <h2 className="rk-result-q">Hat’s geklappt?</h2>
          <p className="rk-q-hint" style={{ textAlign: 'center' }}>Ganz ehrlich — beides ist völlig in Ordnung.</p>
          <div className="rk-result-btns">
            <button className="rk-nav rk-nav-primary rk-big-yes" onClick={() => setPhase('yes')}>Ja! 🎉</button>
            <button className="rk-nav rk-nav-ghost rk-big-no" onClick={() => setPhase('no')}>Noch nicht</button>
          </div>
        </div>
      </Screen>
    );
  }
  if (phase === 'yes') {
    return (
      <Screen bar={<AppBar left={<span />} title={<span className="rk-bar-device"><span>{device.emoji}</span>{device.name}</span>} right={<IconBtn onClick={onProtocol} label="Protokoll"><DocIcon /></IconBtn>} />}
        footer={<GhostButton full onClick={onRestart}>Zur Startseite</GhostButton>}>
        <div className="rk-win">
          <div className="rk-result-emoji">🎉</div>
          <h2 className="rk-result-q">Geschafft!</h2>
          <p className="rk-q-hint" style={{ textAlign: 'center' }}>{device.success.line}</p>
          <div className="rk-impact">
            <div className="rk-impact-cell"><span className="rk-impact-num">{device.success.saved}</span><span className="rk-impact-lab">gespart</span></div>
            <div className="rk-impact-cell"><span className="rk-impact-num">{device.success.co2}</span><span className="rk-impact-lab">vermieden</span></div>
            <div className="rk-impact-cell"><span className="rk-impact-num">1</span><span className="rk-impact-lab">Gerät gerettet</span></div>
          </div>
          <p className="rk-win-foot">Und ein Stück Selbstvertrauen fürs nächste Mal. Im Reparatur-Tagebuch festgehalten.</p>
        </div>
      </Screen>
    );
  }
  return (
    <Screen bar={<AppBar left={<span />} title={<span className="rk-bar-device"><span>{device.emoji}</span>{device.name}</span>} right={<IconBtn onClick={onProtocol} label="Protokoll"><DocIcon /></IconBtn>} />}
      footer={<BigButton variant="primary" emoji="🏪" sub="dein Protokoll geht automatisch mit" onClick={onPro}>Profi finden</BigButton>}>
      <div className="rk-win">
        <div className="rk-result-emoji">🧭</div>
        <h2 className="rk-result-q">Kein Vorwurf.</h2>
        <p className="rk-q-hint" style={{ textAlign: 'center' }}>Du hast das Problem systematisch eingegrenzt — das war goldrichtig. Jetzt hilft dir ein Profi schneller, weil die halbe Arbeit schon getan ist.</p>
      </div>
    </Screen>
  );
}

/* ===================== WEG-ERGEBNIS (lokal / profi / ersetzen) ===================== */
function PathScreen({ device, path, onRestart, onProtocol }) {
  const map = {
    local: { e: '🤝', t: 'Hilfe vor Ort', body: 'In deiner Nähe gibt es Repair Cafés und Werkstätten. Nimm dein Protokoll mit — so versteht jede helfende Person dein Problem sofort.', slot: 'Karte mit Repair Cafés' },
    pro: { e: '🏪', t: 'Profi beauftragen', body: 'Dein Reparatur-Steckbrief geht direkt an die Werkstatt. Der Mechaniker fängt nicht bei null an — das spart Zeit und Geld.', slot: 'Werkstatt-Anfrage gesendet' },
    replace: { e: '♻️', t: 'Fachgerecht ersetzen', body: 'Wenn ein Neukauf wirklich klüger ist, ist das auch in Ordnung. So entsorgst du das alte Gerät richtig — und nimmst Rohstoffe in den Kreislauf zurück.', slot: 'Wertstoffhof in der Nähe' },
  }[path];
  return (
    <Screen bar={<AppBar left={<span />} title={<span className="rk-bar-device"><span>{device.emoji}</span>{device.name}</span>} right={<IconBtn onClick={onProtocol} label="Protokoll"><DocIcon /></IconBtn>} />}
      footer={<GhostButton full onClick={onRestart}>Zur Startseite</GhostButton>}>
      <div className="rk-result-emoji" style={{ marginTop: 6 }}>{map.e}</div>
      <h2 className="rk-result-q" style={{ textAlign: 'left' }}>{map.t}</h2>
      <p className="rk-q-hint">{map.body}</p>
      <Slot label={map.slot} h={150} />
      <button className="rk-share-line" onClick={onProtocol}><DocIcon /> Protokoll ansehen & teilen</button>
    </Screen>
  );
}

/* ===================== PROTOKOLL (Steckbrief) ===================== */
function ProtocolContent({ device, answers }) {
  const [why, setWhy] = RReact.useState(false);
  const summary = device.lights.map((l) => `${l.icon} ${levelMeta(l.level).face}`).join('   ');
  return (
    <div className="rk-proto">
      <div className="rk-proto-head">
        <span className="rk-proto-e">{device.emoji}</span>
        <div>
          <div className="rk-proto-name">{device.name}</div>
          <div className="rk-proto-detail">{device.detail}</div>
        </div>
      </div>

      <div className="rk-proto-sec">Symptom</div>
      <div className="rk-proto-val">{device.blurb}</div>

      <div className="rk-proto-sec">Was schon getestet wurde</div>
      <div className="rk-proto-tags">
        {answers.length ? answers.map((a, i) => <span key={i} className="rk-proto-tag">{a.tag}</span>)
          : <span className="rk-proto-tag rk-proto-tag-muted">noch nichts erfasst</span>}
      </div>

      <div className="rk-proto-sec">Wahrscheinliche Ursache & Ampel</div>
      <div className="rk-proto-val">{device.verdictTitle}</div>
      <div className="rk-proto-ampel">{summary}</div>

      <button className="rk-proto-why" onClick={() => setWhy(!why)}>
        {why ? '▾' : '▸'} Warum schätzt die App das so ein?
      </button>
      {why ? (
        <div className="rk-proto-reason">
          <p>{device.verdictBody}</p>
          <p className="rk-sheet-fine">Quelle: {device.confidence.source} · Sicherheit: {device.confidence.level}. Die KI kann sich irren.</p>
        </div>
      ) : null}

      <div className="rk-proto-owner">👤 Gerät gehört: <b>mir</b> · Kosten trägt: <b>ich</b></div>

      <div className="rk-proto-share">
        {[['💬', 'Nachricht'], ['📄', 'PDF'], ['🔗', 'Link']].map((s) => (
          <button key={s[1]} className="rk-share-btn"><span>{s[0]}</span>{s[1]}</button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  StartScreen, TriageScreen, AmpelScreen, DecisionScreen,
  RepairScreen, ResultScreen, PathScreen, ProtocolContent,
});
