/* repair-app.jsx — Zustandsmaschine: führt durch Start → Triage → Ampel →
   Entscheidung → Begleitung → Rückblick. Eine Instanz pro Richtung/Phone. */
/* StartScreen, PhoneFrame, Sheet … sind globale Funktionen aus den vorigen
   Skripten und hier direkt nutzbar (kein Re-Deklarieren). */

function applyTweaks(baseVars, tweaks) {
  const v = { ...baseVars };
  const densMult = { kompakt: 0.8, normal: 1, luftig: 1.28 }[tweaks.density] ?? 1;
  const cornMult = { weich: 1.35, standard: 1, kantig: 0.42 }[tweaks.corners] ?? 1;
  const px = (s, m) => Math.round(parseFloat(s) * m) + 'px';
  v['--pad'] = px(baseVars['--pad'], densMult);
  v['--gap'] = px(baseVars['--gap'], densMult);
  v['--radius'] = px(baseVars['--radius'], cornMult);
  v['--radius-sm'] = px(baseVars['--radius-sm'], cornMult);
  if (baseVars['--radius-pill'] !== '999px') v['--radius-pill'] = px(baseVars['--radius-pill'], cornMult);
  v['--font-size'] = (tweaks.textScale || 16) + 'px';
  v['--motion'] = tweaks.motion === false ? '0s' : '.22s';
  return v;
}

function RepairApp({ theme, tweaks }) {
  const [stage, setStage] = React.useState('start');
  const [device, setDevice] = React.useState(null);
  const [ti, setTi] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [ri, setRi] = React.useState(0);
  const [depth, setDepth] = React.useState(tweaks.depth || 'Anfänger');
  const [path, setPath] = React.useState('pro');
  const [proto, setProto] = React.useState(false);

  React.useEffect(() => { setDepth(tweaks.depth || 'Anfänger'); }, [tweaks.depth]);

  const reset = () => { setStage('start'); setDevice(null); setTi(0); setAnswers([]); setRi(0); setPath('pro'); };

  const pick = (id) => { setDevice(window.REPAIR_DEVICES[id]); setAnswers([]); setTi(0); setStage('triage'); };
  const answer = (q, a, tag) => {
    setAnswers((prev) => [...prev.slice(0, ti), { q, a, tag }]);
    if (ti < device.triage.length - 1) setTi(ti + 1); else setStage('ampel');
  };
  const triageBack = () => { if (ti > 0) { setTi(ti - 1); setAnswers((p) => p.slice(0, -1)); } else reset(); };
  const choose = (key) => {
    if (key === 'self') { setRi(0); setStage('repair'); }
    else { setPath(key === 'replace' ? 'replace' : key === 'local' ? 'local' : 'pro'); setStage('path'); }
  };
  const repairNext = () => setRi((i) => Math.min(i + 1, device.steps.length - 1));
  const repairPrev = () => { if (ri > 0) setRi(ri - 1); else setStage('decision'); };
  const repairFinish = () => {
    const last = device.steps[device.steps.length - 1];
    if (last.handoff) { setPath('pro'); setStage('path'); } else setStage('result');
  };

  const vars = applyTweaks(theme.vars, tweaks);

  let screen;
  if (stage === 'start') screen = <StartScreen onPick={pick} />;
  else if (stage === 'triage') screen = <TriageScreen device={device} index={ti} onAnswer={answer} onBack={triageBack} onProtocol={() => setProto(true)} />;
  else if (stage === 'ampel') screen = <AmpelScreen device={device} onContinue={() => setStage('decision')} onBack={() => { setTi(device.triage.length - 1); setStage('triage'); }} onProtocol={() => setProto(true)} />;
  else if (stage === 'decision') screen = <DecisionScreen device={device} onChoose={choose} onBack={() => setStage('ampel')} onProtocol={() => setProto(true)} />;
  else if (stage === 'repair') screen = <RepairScreen device={device} index={ri} depth={depth} onNext={repairNext} onPrev={repairPrev} onExit={() => { setPath('pro'); setStage('path'); }} onDepth={setDepth} onFinish={repairFinish} onProtocol={() => setProto(true)} />;
  else if (stage === 'result') screen = <ResultScreen device={device} onRestart={reset} onPro={() => { setPath('pro'); setStage('path'); }} onProtocol={() => setProto(true)} />;
  else if (stage === 'path') screen = <PathScreen device={device} path={path} onRestart={reset} onProtocol={() => setProto(true)} />;

  return (
    <PhoneFrame vars={vars} chrome={theme.flags.chrome}>
      <div className={`rk-app rk-theme-${theme.id} rk-case-${theme.flags.labelCase}`} style={{ fontSize: 'var(--font-size)' }}>
        {screen}
        <Sheet open={proto} onClose={() => setProto(false)} title="Reparatur-Steckbrief">
          {device ? <ProtocolContent device={device} answers={answers} />
            : <p className="rk-sheet-note">Noch kein Gerät erfasst — wähl auf der Startseite ein Gerät, dann fülle ich den Steckbrief im Hintergrund.</p>}
        </Sheet>
      </div>
    </PhoneFrame>
  );
}

window.RepairApp = RepairApp;
