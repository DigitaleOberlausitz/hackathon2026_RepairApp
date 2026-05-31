from repair import orchestrator


class _Msg:
    def __init__(self, content=None, tool_calls=None):
        self.content = content
        self.tool_calls = tool_calls or []


class _ToolCall:
    def __init__(self, cid, name, args):
        self.id = cid
        self.type = "function"
        self.function = type("F", (), {"name": name, "arguments": args})


class _Choice:
    def __init__(self, msg): self.message = msg


class _Resp:
    def __init__(self, msg): self.choices = [_Choice(msg)]


class FakeClient:
    """Gibt erst einen zeige_karte-Tool-Call zurück, dann eine Textantwort."""
    def __init__(self):
        self.calls = 0
        self.chat = type("C", (), {"completions": self})()

    def create(self, **kw):
        self.calls += 1
        if self.calls == 1:
            tc = _ToolCall("t1", "zeige_karte",
                           '{"typ":"hinweis","daten":{"art":"sicherheit","text":"Stecker ziehen."}}')
            return _Resp(_Msg(tool_calls=[tc]))
        return _Resp(_Msg(content="Alles klar, das war's."))


def test_run_turn_sammelt_karte_und_text():
    state = {"messages": [], "karten": [], "geladene_rollen": [],
             "entscheidungsprotokoll": []}
    result = orchestrator.run_turn(
        state, "Mein Toaster geht nicht", client=FakeClient(), model="x")
    assert result["antwort_text"] == "Alles klar, das war's."
    assert any(k["typ"] == "hinweis" for k in result["karten"])
    assert state["messages"]  # Verlauf wurde fortgeschrieben


def test_run_turn_respektiert_iterations_limit():
    class LoopClient(FakeClient):
        def create(self, **kw):
            tc = _ToolCall("t", "finde_foerderung", "{}")
            return _Resp(_Msg(tool_calls=[tc]))  # niemals fertig
    state = {"messages": [], "karten": [], "geladene_rollen": [],
             "entscheidungsprotokoll": []}
    result = orchestrator.run_turn(
        state, "x", client=LoopClient(), model="x", max_iterations=3)
    assert result["abgebrochen"] is True


def test_backstop_haengt_sicherheitshinweis_bei_rot_an():
    # A2: rote Ampel ohne Sicherheits-Hinweis -> Server hängt einen an (nicht-sperrend)
    class AmpelClient(FakeClient):
        def create(self, **kw):
            self.calls += 1
            if self.calls == 1:
                tc = _ToolCall("t1", "zeige_karte",
                    '{"typ":"ampel","daten":{"achsen":{"sicherheit":"rot",'
                    '"komplexitaet":"rot","kosten":"gelb","machbarkeit":"gelb"},'
                    '"gesamt":"rot","begruendung":"Personengefahr.",'
                    '"trust":{"level":"hoch","quelle":"kuratiert","konfidenz":"hoch","hinweis":"KI kann Fehler machen."}}}')
                return _Resp(_Msg(tool_calls=[tc]))
            return _Resp(_Msg(content="Bitte zur Werkstatt."))
    state = {"messages": [], "karten": [], "geladene_rollen": [], "entscheidungsprotokoll": []}
    result = orchestrator.run_turn(state, "Auto bremst schlecht", client=AmpelClient(), model="x")
    assert any(k["typ"] == "hinweis" and k["daten"]["art"] == "sicherheit"
               for k in result["karten"])


def test_backstop_kein_doppelhinweis_wenn_modell_schon_warnt():
    class AmpelUndHinweisClient(FakeClient):
        def create(self, **kw):
            self.calls += 1
            if self.calls == 1:
                tc1 = _ToolCall("t1", "zeige_karte",
                    '{"typ":"ampel","daten":{"achsen":{"sicherheit":"rot",'
                    '"komplexitaet":"rot","kosten":"gelb","machbarkeit":"gelb"},'
                    '"gesamt":"rot","begruendung":"x",'
                    '"trust":{"level":"hoch","quelle":"k","konfidenz":"hoch","hinweis":"h"}}}')
                tc2 = _ToolCall("t2", "zeige_karte",
                    '{"typ":"hinweis","daten":{"art":"sicherheit","text":"Vorsicht!","schwere":"kritisch"}}')
                return _Resp(_Msg(tool_calls=[tc1, tc2]))
            return _Resp(_Msg(content="ok"))
    state = {"messages": [], "karten": [], "geladene_rollen": [], "entscheidungsprotokoll": []}
    result = orchestrator.run_turn(state, "x", client=AmpelUndHinweisClient(), model="x")
    sicherheits_hinweise = [k for k in result["karten"]
                            if k["typ"] == "hinweis" and k["daten"]["art"] == "sicherheit"]
    assert len(sicherheits_hinweise) == 1  # kein vom Server doppelt angehängter
