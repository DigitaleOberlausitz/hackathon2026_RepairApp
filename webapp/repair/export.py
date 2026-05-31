"""Zentraler Export-Renderer für Vorgang-Protokolle.

Eine Render-Funktion pro Format:
    render_txt(state, vorgang_meta) -> str      # Klartext (.txt)
    render_html(state, vorgang_meta) -> str     # Lese-Ansicht (HTML, Print-fähig)

``state`` ist der persistierte Vorgang-Zustand (dict).
``vorgang_meta`` enthält {id, created, updated} vom Store.

Beide Formate teilen dieselbe Datenbeschaffungslogik (_collect_sections).
Fehlende Felder werden als „noch nicht ermittelt" dargestellt.
Unvollständige Vorgänge werden sichtbar als „in Bearbeitung" markiert.
KI-Fallback-Quellen werden als „KI-Fallback (nicht belegt)" kenntlich gemacht.
Eigentum dynamisch aus state.ownership (nie hartkodiert „mir/ich").
"""

from __future__ import annotations

import html as _html_mod
from datetime import datetime, timedelta, timezone

from . import anbieter as _anbieter
from . import ersatzteile as _ersatzteile
from . import entsorgung as _entsorgung
from . import produktsuche as _produktsuche
from .i18n import t as _t

# ─── Hilfsfunktionen ─────────────────────────────────────────────────────────


def _s(val, default: str = "noch nicht ermittelt") -> str:
    if val is None or val == "" or (isinstance(val, str) and val.lower() in ("null", "none")):
        return default
    return str(val).strip()


def _level_symbol(level: str) -> str:
    return {"gut": "✅ gut", "mittel": "⚠️ mittel", "stop": "🛑 stop"}.get(level, f"❔ {level}")


def _level_label(level: str) -> str:
    return {"gut": "gut", "mittel": "mittel", "stop": "stop"}.get(level, level)


def _score_str(score, prefix: str = "  (Score: ", suffix: str = ")") -> str:
    """Formatiert einen Score robust — egal ob float, int oder String.

    Nicht-numerische/leere Werte ergeben einen leeren String (Zeile entfällt),
    statt einen ValueError zu werfen → Export scheitert nie hart.
    """
    if score is None or score == "":
        return ""
    try:
        return f"{prefix}{float(score):.2f}{suffix}"
    except (TypeError, ValueError):
        return ""


def _is_link_expired(created_str: str) -> bool:
    """Gibt True zurück wenn der Link älter als 30 Tage ist."""
    try:
        created = datetime.fromisoformat(created_str)
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) > created + timedelta(days=30)
    except Exception:
        return False


def _expiry_date(created_str: str) -> str:
    try:
        created = datetime.fromisoformat(created_str)
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        expiry = created + timedelta(days=30)
        return expiry.strftime("%d.%m.%Y")
    except Exception:
        return "unbekannt"


# ─── Inhaltszusammenstellung ──────────────────────────────────────────────────


def _ownership_text(ownership) -> str:
    if not isinstance(ownership, dict):
        return "noch nicht ermittelt"
    is_owner = ownership.get("isOwner")
    if is_owner == "yes":
        return "Eigentümer/in (ich selbst)"
    if is_owner == "no":
        owner = _s(ownership.get("owner"), "")
        cost = _s(ownership.get("costBearer"), "")
        parts = []
        parts.append(f"Eigentümer/in: {owner or 'nicht angegeben'}")
        parts.append(f"Kostenträger: {cost or 'nicht angegeben'}")
        return " · ".join(parts)
    if is_owner == "unknown":
        return "Nicht bekannt / zu klären"
    return "noch nicht ermittelt"


def _resolve_by_id(selected, lister) -> dict | None:
    """Findet einen Service-Eintrag anhand seiner id (oder gibt das dict direkt zurück).

    ``selected`` darf eine id (str), ein bereits vollständiges dict oder leer sein.
    Schlägt nie hart fehl — Demo muss laufen.
    """
    if isinstance(selected, dict):
        return selected if selected else None
    if not isinstance(selected, str) or not selected.strip():
        return None
    sel = selected.strip()
    try:
        for entry in lister():
            if str(entry.get("id")) == sel:
                return entry
    except Exception:
        return None
    return None


def _resolve_parts(parts) -> list:
    """Mappt eine Liste gemerkter Teile-ids auf die vollständigen Teil-Objekte."""
    if not isinstance(parts, list) or not parts:
        return []
    try:
        catalog = {str(p.get("id")): p for p in _ersatzteile.list_ersatzteile()}
    except Exception:
        catalog = {}
    out = []
    for p in parts:
        if isinstance(p, dict) and p.get("teil"):
            out.append(p)
        elif isinstance(p, str) and p in catalog:
            out.append(catalog[p])
    return out


def _trust_from_state(state: dict) -> dict:
    """Holt den Vertrauens-Kontext (PROJ-25) aus state.trust oder diagnosis.trust."""
    trust = state.get("trust")
    if isinstance(trust, dict) and trust.get("level"):
        return trust
    diagnosis = state.get("diagnosis") or {}
    dt = diagnosis.get("trust") if isinstance(diagnosis, dict) else None
    return dt if isinstance(dt, dict) else {}


def _collect(state: dict, vorgang_meta: dict) -> dict:
    """Extrahiert alle relevanten Felder aus state für die Ausgabe."""

    device = state.get("device") or {}
    device_name = _s(device.get("name"), "unbekanntes Gerät")
    device_emoji = _s(device.get("emoji"), "🔧")
    device_blurb = _s(device.get("blurb"), "")
    device_detail = _s(device.get("detail"), "")
    lights = device.get("lights") if isinstance(device.get("lights"), list) else []
    verdict_title = _s(device.get("verdictTitle"), "")
    verdict_body = _s(device.get("verdictBody"), "")
    confidence = device.get("confidence") or {}
    conf_level = _s(confidence.get("level"), "unbekannt")
    conf_source = _s(confidence.get("source"), "unbekannt")
    conf_note = _s(confidence.get("note"), "")
    recommend = _s(device.get("recommend"), "")

    diagnosis = state.get("diagnosis") or {}
    diag_status = _s(diagnosis.get("status"), "")
    diag_score = diagnosis.get("score")
    diag_reason = _s(diagnosis.get("reason"), "")

    ownership = state.get("ownership")
    ownership_text = _ownership_text(ownership)

    answers = state.get("answers") or []
    skill = _s(state.get("skill"), "")
    depth = _s(state.get("depth"), "")
    path = _s(state.get("path"), "")
    stage = _s(state.get("stage"), "")

    warranty = state.get("warranty") or {}
    w_asked = warranty.get("asked", False)
    w_purchase_age = _s(warranty.get("purchaseAge"), "")
    w_choice = _s(warranty.get("choice"), "")

    sc = state.get("safetyConfirms")
    safety_confirms = sc if isinstance(sc, dict) else {}
    decision_log = state.get("decisionLog") or []

    # Quellenkennung
    source = _s(state.get("_diagSource"), "")  # Client kann _diagSource setzen
    # Fallback: aus decisionLog den letzten diagnose-Eintrag lesen
    if not source:
        for entry in reversed(decision_log):
            if isinstance(entry, dict) and entry.get("kind") == "diagnose":
                source = _s(entry.get("source"), "")
                break

    created = _s(vorgang_meta.get("created"), "")
    updated = _s(vorgang_meta.get("updated"), "")
    vid = _s(vorgang_meta.get("id"), "")

    # Vollständigkeits-Check (FIX G: "ownership" ebenfalls als "in Bearbeitung" werten)
    is_complete = bool(device) and stage not in ("", "start", "triage", "ownership")

    # ─── Stufe 2: Service-Auswahl (PROJ-11/12/13/14) ──────────────────────────
    ort = _s(state.get("ort"), "")
    vermittlung = state.get("vermittlung") if isinstance(state.get("vermittlung"), dict) else {}
    entsorgung_sel = state.get("entsorgung") if isinstance(state.get("entsorgung"), dict) else {}
    produktsuche_sel = state.get("produktsuche") if isinstance(state.get("produktsuche"), dict) else {}
    beschaffung = state.get("beschaffung") if isinstance(state.get("beschaffung"), dict) else {}

    sel_anbieter = _resolve_by_id(vermittlung.get("selected"), _anbieter.list_anbieter)
    sel_entsorgung = _resolve_by_id(entsorgung_sel.get("selected"), _entsorgung.list_entsorgung)
    sel_alternative = _resolve_by_id(produktsuche_sel.get("selected"), _produktsuche.list_alternativen)
    sel_parts = _resolve_parts(beschaffung.get("parts"))

    trust = _trust_from_state(state)

    # ─── Stufe 3: neue State-Felder (PROJ-15/19/20/21/22/23/27) ─────────────
    lang = str(state.get("lang") or "de").strip().lower()
    if lang not in ("de", "en"):
        lang = "de"

    # PROJ-19 Rückruf
    rueckruf_raw = state.get("rueckruf") or {}
    rueckruf = rueckruf_raw if isinstance(rueckruf_raw, dict) else {}

    # PROJ-20 Datenlöschung
    datentragend = state.get("datentragend")
    abgabe = _s(state.get("abgabe"), "")
    datenloeschung_raw = state.get("datenloeschung") or {}
    datenloeschung = datenloeschung_raw if isinstance(datenloeschung_raw, dict) else {}

    # PROJ-21 Mehrfachdefekte
    defekte_raw = state.get("defekte")
    defekte = defekte_raw if isinstance(defekte_raw, list) else []
    gesamt_fazit_raw = state.get("gesamtFazit")
    gesamt_fazit = gesamt_fazit_raw if isinstance(gesamt_fazit_raw, dict) else None

    # PROJ-22 Consent
    consent_raw = state.get("consent") or {}
    consent = consent_raw if isinstance(consent_raw, dict) else {}

    # PROJ-23 Schwungrad
    schwungrad_raw = state.get("schwungrad") or {}
    schwungrad = schwungrad_raw if isinstance(schwungrad_raw, dict) else {}

    # PROJ-27 Medien
    medien_raw = state.get("medien")
    medien = medien_raw if isinstance(medien_raw, list) else []

    return {
        "vid": vid,
        "created": created,
        "updated": updated,
        "is_complete": is_complete,
        "stage": stage,
        "device_name": device_name,
        "device_emoji": device_emoji,
        "device_blurb": device_blurb,
        "device_detail": device_detail,
        "lights": lights,
        "verdict_title": verdict_title,
        "verdict_body": verdict_body,
        "conf_level": conf_level,
        "conf_source": conf_source,
        "conf_note": conf_note,
        "recommend": recommend,
        "source": source,
        "diag_status": diag_status,
        "diag_score": diag_score,
        "diag_reason": diag_reason,
        "ownership_text": ownership_text,
        "answers": answers,
        "skill": skill,
        "depth": depth,
        "path": path,
        "w_asked": w_asked,
        "w_purchase_age": w_purchase_age,
        "w_choice": w_choice,
        "safety_confirms": safety_confirms,
        "decision_log": decision_log,
        # Stufe 2
        "ort": ort,
        "sel_anbieter": sel_anbieter,
        "sel_entsorgung": sel_entsorgung,
        "sel_alternative": sel_alternative,
        "sel_parts": sel_parts,
        "trust": trust,
        # Stufe 3
        "lang": lang,
        "rueckruf": rueckruf,
        "datentragend": datentragend,
        "abgabe": abgabe,
        "datenloeschung": datenloeschung,
        "defekte": defekte,
        "gesamt_fazit": gesamt_fazit,
        "consent": consent,
        "schwungrad": schwungrad,
        "medien": medien,
    }


# ─── TXT-Renderer ─────────────────────────────────────────────────────────────


def render_txt(state: dict, vorgang_meta: dict) -> str:
    c = _collect(state, vorgang_meta)
    lines: list[str] = []

    def sep(char: str = "─", width: int = 60) -> str:
        return char * width

    lines += [
        sep("═"),
        "REPARATUR-HELFER — VORGANG-PROTOKOLL",
        sep("═"),
        f"Vorgang-ID : {c['vid']}",
        f"Erstellt   : {c['created']}",
        f"Zuletzt    : {c['updated']}",
    ]

    if not c["is_complete"]:
        lines.append("Status     : ⚠ IN BEARBEITUNG / UNVOLLSTÄNDIG")

    lines += ["", sep()]

    # Gerät
    lines += ["", "GERÄT", sep("─", 30)]
    if c["device_name"] == "unbekanntes Gerät" and not state.get("device"):
        lines.append("noch nicht ermittelt")
    else:
        lines.append(f"{c['device_emoji']}  {c['device_name']}")
        if c["device_blurb"]:
            lines.append(f"Symptom : {c['device_blurb']}")
        if c["device_detail"]:
            lines.append(f"Detail  : {c['device_detail']}")

    # Eigentum
    lines += ["", "EIGENTUM / KOSTENTRÄGER", sep("─", 30)]
    lines.append(c["ownership_text"])

    # Triage-Antworten
    lines += ["", "SYMPTOM-CHECK (TRIAGE)", sep("─", 30)]
    if c["answers"]:
        for i, ans in enumerate(c["answers"], 1):
            if not isinstance(ans, dict):
                continue
            q = _s(ans.get("q"), "Frage")
            a = _s(ans.get("a"), "")
            tag = _s(ans.get("tag"), "")
            freitext = _s(ans.get("freitext"), "")
            line = f"{i}. {q}"
            lines.append(line)
            if a:
                tag_str = f"  [{tag}]" if tag else ""
                lines.append(f"   Antwort : {a}{tag_str}")
            if freitext:
                lines.append("   Freitext: „" + freitext + "“")
    else:
        lines.append("noch nicht ermittelt")

    # Warn-Ampel
    lines += ["", "WARN-AMPEL", sep("─", 30)]
    if c["lights"]:
        for light in c["lights"]:
            if not isinstance(light, dict):
                continue
            key = _s(light.get("key"), "?")
            icon = _s(light.get("icon"), "")
            level = _s(light.get("level"), "")
            note = _s(light.get("note"), "")
            lines.append(f"{icon} {key}: {_level_symbol(level)}")
            if note:
                lines.append(f"   {note}")
    else:
        lines.append("noch nicht ermittelt")

    # Verdikt
    lines += ["", "EINSCHÄTZUNG / VERDIKT", sep("─", 30)]
    if c["verdict_title"]:
        lines.append(c["verdict_title"])
        if c["verdict_body"]:
            lines.append(c["verdict_body"])
    else:
        lines.append("noch nicht ermittelt")

    recommend_labels = {
        "self": "Selbst reparieren",
        "local": "Repair Café / lokale Werkstatt",
        "pro": "Fachwerkstatt (Profi)",
        "replace": "Neuanschaffung",
    }
    if c["recommend"]:
        lines.append(f"Empfehlung : {recommend_labels.get(c['recommend'], c['recommend'])}")

    # Quelle & Konfidenz
    lines += ["", "QUELLE & KONFIDENZ", sep("─", 30)]
    lines.append(f"Stufe  : {c['conf_level']}")
    lines.append(f"Quelle : {c['conf_source']}")
    if c["conf_note"]:
        lines.append(f"Hinweis: {c['conf_note']}")
    if c["source"] == "fallback":
        lines.append("[KI-Fallback (nicht belegt) — Seed-Gerät wurde verwendet]")
    trust = c["trust"]
    if isinstance(trust, dict) and trust.get("level"):
        t_dot = {"hoch": "🟢", "mittel": "🟡", "niedrig": "🔴"}.get(str(trust.get("level")), "❔")
        lines.append(
            f"Vertrauen: {t_dot} {trust.get('level')} "
            f"(Quelle: {_s(trust.get('source'), 'unbekannt')})"
        )
        if trust.get("reason"):
            lines.append(f"   {_s(trust.get('reason'), '')}")

    # Diagnose-Status
    lines += ["", "DIAGNOSE-STATUS (PROJ-4)", sep("─", 30)]
    if c["diag_status"]:
        score_str = _score_str(c["diag_score"])
        lines.append(f"Status : {c['diag_status']}{score_str}")
        if c["diag_reason"]:
            lines.append(f"Grund  : {c['diag_reason']}")
        if c["diag_status"] == "unclear":
            lines.append("⚠ Keine verlässliche Eingrenzung möglich — Profi oder Repair Café empfohlen.")
    else:
        lines.append("noch nicht ermittelt")

    # Können / Skill
    lines += ["", "KÖNNEN / SKILL", sep("─", 30)]
    skill_str = c["skill"] or c["depth"]
    lines.append(skill_str if skill_str else "noch nicht ermittelt")

    # Garantie
    lines += ["", "GARANTIE / GEWÄHRLEISTUNG", sep("─", 30)]
    if c["w_asked"]:
        lines.append(f"Kaufalter : {c['w_purchase_age'] or 'nicht angegeben'}")
        choice_labels = {"reklamation": "Reklamation / Gewährleistung prüfen", "weiter": "Trotzdem selbst reparieren"}
        lines.append(f"Entschied : {choice_labels.get(c['w_choice'], c['w_choice'] or 'noch keine Wahl')}")
    else:
        lines.append("Gate noch nicht durchlaufen / nicht relevant")

    # Sicherheits-Bestätigungen
    lines += ["", "SICHERHEITS-BESTÄTIGUNGEN", sep("─", 30)]
    if c["safety_confirms"]:
        for idx, confirm in sorted(c["safety_confirms"].items(), key=lambda x: str(x[0])):
            if not isinstance(confirm, dict):
                continue
            adult = confirm.get("adult", "")
            confident = confirm.get("confident", "")
            ts = _s(confirm.get("ts"), "")
            lines.append(
                f"Schritt {idx}: Volljährig: {adult} · Traut sich zu: {confident}"
                + (f" · {ts}" if ts else "")
            )
    else:
        lines.append("keine (keine sicherheitskritischen Schritte durchlaufen)")

    # Entscheidungsprotokoll
    lines += ["", "ENTSCHEIDUNGSPROTOKOLL", sep("─", 30)]
    if c["decision_log"]:
        for entry in c["decision_log"]:
            if not isinstance(entry, dict):
                continue
            ts = _s(entry.get("ts"), "")
            kind = _s(entry.get("kind"), "")
            note = _s(entry.get("note"), "")
            src = _s(entry.get("source"), "")
            conf = _s(entry.get("confidence"), "")
            parts = [f"[{ts}]" if ts else "", f"{kind}:", note]
            if src:
                parts.append(f"(Quelle: {src})")
            if conf:
                parts.append(f"(Konfidenz: {conf})")
            lines.append(" ".join(p for p in parts if p))
    else:
        lines.append("kein Protokoll vorhanden")

    # ─── Stufe 2: Service-Abschnitte (nur falls vorhanden) ────────────────────

    # PROJ-11 Anbieter / Vermittlung
    lines += ["", "GEWÄHLTER ANBIETER (VERMITTLUNG)", sep("─", 30)]
    a = c["sel_anbieter"]
    if isinstance(a, dict) and a:
        typ_label = {"repaircafe": "Repair-Café", "werkstatt": "Werkstatt", "profi": "Profi-Service"}
        lines.append(f"{_s(a.get('name'), '')} ({typ_label.get(a.get('typ'), _s(a.get('typ'), ''))})")
        if a.get("adresse") or a.get("ort"):
            lines.append(f"Adresse : {_s(a.get('adresse'), '')}, {_s(a.get('ort'), '')} {_s(a.get('plz'), '')}".strip())
        if a.get("oeffnungszeiten"):
            lines.append(f"Zeiten  : {_s(a.get('oeffnungszeiten'), '')}")
        if a.get("kostenhinweis"):
            lines.append(f"Kosten  : {_s(a.get('kostenhinweis'), '')}")
        lines.append(f"Quelle  : {_s(a.get('quelle'), 'kuratierte Demodaten')} (kuratiert)")
    else:
        lines.append("noch nicht ermittelt")

    # PROJ-12 Entsorgungsweg
    lines += ["", "ENTSORGUNGSWEG", sep("─", 30)]
    d = c["sel_entsorgung"]
    if isinstance(d, dict) and d:
        art_label = {"wertstoffhof": "Wertstoffhof", "ruecknahme": "Händler-Rücknahme", "sammelstelle": "Sammelstelle"}
        lines.append(f"{_s(d.get('name'), '')} ({art_label.get(d.get('art'), _s(d.get('art'), ''))})")
        if d.get("annahmezeiten"):
            lines.append(f"Zeiten   : {_s(d.get('annahmezeiten'), '')}")
        if d.get("kosten"):
            lines.append(f"Kosten   : {_s(d.get('kosten'), '')}")
        if d.get("rohstoff"):
            lines.append(f"Rohstoff : {_s(d.get('rohstoff'), '')}")
        lines.append(f"Quelle   : {_s(d.get('quelle'), 'kuratierte Demodaten')} (kuratiert)")
    else:
        lines.append("noch nicht ermittelt")

    # PROJ-13 Alternativgerät
    lines += ["", "ALTERNATIVGERÄT (NEUKAUF-OPTION)", sep("─", 30)]
    alt = c["sel_alternative"]
    if isinstance(alt, dict) and alt:
        lines.append(f"{_s(alt.get('modell'), '')} — {_s(alt.get('preis'), '')}")
        if alt.get("ausstattung"):
            lines.append(f"Ausstattung : {_s(alt.get('ausstattung'), '')}")
        verg = alt.get("vergleich") or {}
        if isinstance(verg, dict) and verg:
            lines.append(
                f"Vergleich   : Geld {_s(verg.get('geld'), '—')} · "
                f"Zeit {_s(verg.get('zeit'), '—')} · Umwelt {_s(verg.get('umwelt'), '—')}"
            )
        einr = alt.get("einrichtung")
        if isinstance(einr, int):
            lines.append(f"Einrichtungsaufwand : {einr}/3")
        lines.append(f"Quelle      : {_s(alt.get('quelle'), 'kuratierte Demodaten')} (kuratiert)")
    else:
        lines.append("noch nicht ermittelt")

    # PROJ-14 Gemerkte Ersatzteile
    lines += ["", "GEMERKTE ERSATZTEILE", sep("─", 30)]
    parts = c["sel_parts"]
    if parts:
        for p in parts:
            if not isinstance(p, dict):
                continue
            lines.append(f"• {_s(p.get('teil'), '')} — {_s(p.get('preis'), '')} [{_s(p.get('verfuegbarkeit'), '')}]")
            bo = p.get("bestelloption") or {}
            if isinstance(bo, dict) and bo.get("verfuegbar"):
                lines.append(
                    f"   Bestelloption: {_s(bo.get('partner'), '')} — ⚠ Partner-Link (Provision), Affiliate, nicht vorausgewählt"
                )
            if p.get("alternativhinweis"):
                lines.append(f"   Hinweis: {_s(p.get('alternativhinweis'), '')}")
    else:
        lines.append("noch nicht ermittelt")

    # ─── Stufe 3: neue Abschnitte (PROJ-19/20/21/22/23/27) ────────────────────

    lang = c.get("lang", "de")

    # PROJ-19 Rückruf (nur wenn hit==True)
    rueckruf = c.get("rueckruf") or {}
    if rueckruf.get("hit"):
        lines += ["", _t("export.recall.titel", lang), sep("─", 30)]
        art = _s(rueckruf.get("art"), "rueckruf")
        art_label = _t(f"recall.titel.{art}", lang) if art in ("rueckruf", "sicherheitsmangel") else art
        lines.append(f"Art     : {art_label}")
        lines.append(f"{_t('export.recall.grund', lang)} : {_s(rueckruf.get('grund'), '—')}")
        lines.append(f"{_t('export.recall.quelle', lang)} : {_s(rueckruf.get('quelle'), '—')}")
        lines.append(f"{_t('export.recall.stand', lang)} : {_s(rueckruf.get('stand'), '—')}")
        if rueckruf.get("gueltigBis"):
            lines.append(f"{_t('export.recall.gueltig_bis', lang)} : {_s(rueckruf.get('gueltigBis'), '—')}")
        lines.append(f"{_t('export.recall.vorgehen', lang)} : {_s(rueckruf.get('vorgehen'), '—')}")

    # PROJ-20 Datenlöschung (nur wenn abgabe=="dritte")
    if c.get("abgabe") == "dritte":
        lines += ["", _t("export.datenloeschung.titel", lang), sep("─", 30)]
        dl = c.get("datenloeschung") or {}
        backup_done = dl.get("backup", False)
        loeschen_done = dl.get("loeschen", False)
        abmelden_done = dl.get("abmelden", False)
        bewusst = dl.get("bewusstUebersprungen", False)
        lines.append(f"{'✅' if backup_done else '☐'}  {_t('export.datenloeschung.backup', lang)}")
        lines.append(f"{'✅' if loeschen_done else '☐'}  {_t('export.datenloeschung.loeschen', lang)}")
        lines.append(f"{'✅' if abmelden_done else '☐'}  {_t('export.datenloeschung.abmelden', lang)}")
        if bewusst:
            lines.append(f"⚠  {_t('export.datenloeschung.bewusst_uebersprungen', lang)}")

    # PROJ-21 Mehrfachdefekte (nur wenn ≥2 Defekte)
    defekte = c.get("defekte") or []
    gesamt_fazit = c.get("gesamt_fazit")
    if isinstance(defekte, list) and len(defekte) >= 2:
        lines += ["", _t("export.mehrfachdefekte.titel", lang), sep("─", 30)]
        for i, d in enumerate(defekte, 1):
            if not isinstance(d, dict):
                continue
            dname = _s(d.get("name") or d.get("id"), f"Defekt {i}")
            drec = _s(d.get("recommend"), "")
            lines.append(f"{i}. {dname} — Empfehlung: {drec}")
            dlights = d.get("lights") if isinstance(d.get("lights"), list) else []
            for light in dlights:
                if not isinstance(light, dict):
                    continue
                lines.append(f"   {_s(light.get('icon'), '')} {_s(light.get('key'), '')}: {_level_symbol(str(light.get('level', '')))} — {_s(light.get('note'), '')}")
        if isinstance(gesamt_fazit, dict):
            lines += ["", f"  ⇒ {_t('export.mehrfachdefekte.knackpunkt', lang)}: {_s(gesamt_fazit.get('knackpunktId'), '—')}"]
            lines.append(f"  ⇒ Gesamt-Level: {_level_symbol(str(gesamt_fazit.get('level', '')))} · Empfehlung: {_s(gesamt_fazit.get('recommend'), '—')}")
            if gesamt_fazit.get("begruendung"):
                lines.append(f"  {_t('export.mehrfachdefekte.begruendung', lang)}: {_s(gesamt_fazit.get('begruendung'), '')}")

    # PROJ-22 Consent (nur wenn Status != offen)
    consent = c.get("consent") or {}
    consent_status = _s(consent.get("status"), "offen")
    if consent_status != "offen":
        lines += ["", _t("export.consent.titel", lang), sep("─", 30)]
        status_key = f"export.consent.{consent_status}" if consent_status in ("erteilt", "abgelehnt", "widerrufen") else ""
        status_label = _t(status_key, lang) if status_key else consent_status
        lines.append(f"Status : {status_label}")
        if consent.get("zeitpunkt"):
            lines.append(f"{_t('export.consent.zeitpunkt', lang)} : {_s(consent.get('zeitpunkt'), '—')}")

    # PROJ-23 Schwungrad (nur wenn beigetragen==True)
    schwungrad = c.get("schwungrad") or {}
    if schwungrad.get("beigetragen"):
        lines += ["", _t("export.schwungrad.titel", lang), sep("─", 30)]
        lines.append(f"{_t('export.schwungrad.beitrag_id', lang)} : {_s(schwungrad.get('beitragId'), '—')}")
        ausgeschlossen = schwungrad.get("ausgeschlossen") or []
        if ausgeschlossen:
            lines.append(f"{_t('export.schwungrad.ausgeschlossen', lang)}: {', '.join(str(x) for x in ausgeschlossen)}")

    # PROJ-27 Medien (nur wenn vorhanden)
    medien = c.get("medien") or []
    if isinstance(medien, list) and medien:
        lines += ["", _t("export.medien.titel", lang), sep("─", 30)]
        for m in medien:
            if not isinstance(m, dict):
                continue
            lines.append(
                f"• {_t('export.medien.art', lang)}: {_s(m.get('art'), '?')} "
                f"| {_t('export.medien.referenz', lang)}: {_s(m.get('ref') or m.get('id'), '—')}"
                + (f" ({_s(m.get('hinweis'), '')})" if m.get("hinweis") else "")
            )

    lines += [
        "",
        sep("═"),
        "Dieses Protokoll wurde automatisch vom Reparatur-Helfer erzeugt.",
        "Alle Schätzwerte sind unverbindlich. KI-Einschätzungen können Fehler enthalten.",
        sep("═"),
    ]

    return "\n".join(lines)


# ─── HTML-Renderer ────────────────────────────────────────────────────────────


_HTML_CSS = """
body {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 740px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  color: #1a1a1a;
  line-height: 1.55;
}
h1 { font-size: 1.45rem; border-bottom: 3px solid #ff5a1f; padding-bottom: .4rem; margin-top: 0; }
h2 { font-size: .85rem; font-weight: 700; color: #666; text-transform: uppercase;
     letter-spacing: .07em; margin: 2rem 0 .4rem; border-bottom: 1px solid #e5e5e5; padding-bottom: .2rem; }
p, li { margin: .3rem 0; }
ul { padding-left: 1.3rem; }
.meta { color: #888; font-size: .82rem; margin-bottom: 1.5rem; }
.badge { display: inline-block; padding: .1em .55em; border-radius: 4px;
         font-size: .78rem; font-weight: 600; margin-left: .4em; vertical-align: middle; }
.badge-inprogress { background: #fef9c3; color: #854d0e; }
.badge-fallback   { background: #fef9c3; color: #854d0e; }
.badge-unclear    { background: #fee2e2; color: #991b1b; }
.level-gut    { color: #16a34a; font-weight: 600; }
.level-mittel { color: #ca8a04; font-weight: 600; }
.level-stop   { color: #dc2626; font-weight: 600; }
.expiry-box { background: #fff7ed; border: 1px solid #fed7aa;
              padding: .5rem 1rem; border-radius: 6px; margin-bottom: 1.2rem; font-size: .9rem; }
.expired-box { background: #fee2e2; border: 1px solid #fca5a5;
               padding: 1rem 1.5rem; border-radius: 8px; font-size: 1rem; }
.print-btn {
  background: #ff5a1f; color: #fff; border: none; padding: .55rem 1.4rem;
  border-radius: 6px; cursor: pointer; font-size: .95rem; margin-bottom: 1.5rem;
  font-weight: 600; letter-spacing: .02em;
}
.print-btn:hover { background: #e04e18; }
.section { margin-bottom: .6rem; }
.label { font-weight: 600; }
.freitext { font-style: italic; color: #555; }
.disclaimer { color: #999; font-size: .78rem; margin-top: 2.5rem;
              border-top: 1px solid #e5e5e5; padding-top: .8rem; }
table.log { border-collapse: collapse; width: 100%; font-size: .82rem; }
table.log td { border: 1px solid #e5e5e5; padding: .25rem .5rem; vertical-align: top; }
table.log tr:nth-child(even) td { background: #fafafa; }
@media print {
  .print-btn { display: none !important; }
  body { padding: 0; }
  .expiry-box { display: none; }
}
"""


def _e(text: str) -> str:
    """HTML-Entität-Escaping."""
    return _html_mod.escape(str(text))


def render_html(state: dict, vorgang_meta: dict) -> str:
    c = _collect(state, vorgang_meta)
    created = vorgang_meta.get("created", "")
    vid = c["vid"]

    # Ablauf-Check
    if created and _is_link_expired(created):
        return _expired_html(vid)

    expiry_date = _expiry_date(created) if created else "unbekannt"

    def section(title: str, content: str) -> str:
        return f"<h2>{_e(title)}</h2>\n{content}\n"

    parts: list[str] = []

    # Ablauf-Hinweis (noch gültig)
    parts.append(
        f'<div class="expiry-box">🔗 Dieser Link ist gültig bis <strong>{_e(expiry_date)}</strong>. '
        f"Danach ist der Vorgang nicht mehr abrufbar.</div>"
    )

    # Drucken-Button
    parts.append('<button class="print-btn" onclick="window.print()">🖨️ Als PDF drucken / speichern</button>')

    # Titel
    status_badge = ""
    if not c["is_complete"]:
        status_badge = '<span class="badge badge-inprogress">in Bearbeitung</span>'

    parts.append(
        f'<h1>{_e(c["device_emoji"])} {_e(c["device_name"])}{status_badge}</h1>'
    )
    parts.append(
        f'<p class="meta">Vorgang-ID: <code>{_e(vid)}</code> &nbsp;·&nbsp; '
        f"Erstellt: {_e(c['created'])} &nbsp;·&nbsp; Zuletzt: {_e(c['updated'])}</p>"
    )

    # Gerät
    dev_content = ""
    if state.get("device"):
        dev_content += f"<p><span class='label'>Symptom:</span> {_e(c['device_blurb'] or '—')}</p>"
        if c["device_detail"]:
            dev_content += f"<p><span class='label'>Detail:</span> {_e(c['device_detail'])}</p>"
    else:
        dev_content = "<p><em>noch nicht ermittelt</em></p>"
    parts.append(section("Gerät", dev_content))

    # Eigentum
    parts.append(section("Eigentum / Kostenträger", f"<p>{_e(c['ownership_text'])}</p>"))

    # Triage
    triage_html = ""
    if c["answers"]:
        items = []
        for i, ans in enumerate(c["answers"], 1):
            if not isinstance(ans, dict):
                continue
            q = _s(ans.get("q"), "Frage")
            a = _s(ans.get("a"), "")
            tag = _s(ans.get("tag"), "")
            freitext = _s(ans.get("freitext"), "")
            tag_html = f'<span class="badge" style="background:#f0f0f0;color:#444">{_e(tag)}</span>' if tag else ""
            answer_html = f"<strong>{_e(a)}</strong>{tag_html}" if a else "<em>—</em>"
            ft_html = ('<br><span class="freitext">↳ Freitext: „' + _e(freitext) + '“</span>') if freitext else ""
            items.append(
                f"<li><p>{_e(q)}</p><p>Antwort: {answer_html}{ft_html}</p></li>"
            )
        triage_html = f"<ol>{''.join(items)}</ol>"
    else:
        triage_html = "<p><em>noch nicht ermittelt</em></p>"
    parts.append(section("Symptom-Check (Triage)", triage_html))

    # Ampel
    lights_html = ""
    if c["lights"]:
        rows = []
        for light in c["lights"]:
            if not isinstance(light, dict):
                continue
            key = _e(light.get("key", "?"))
            icon = _e(light.get("icon", ""))
            level = str(light.get("level", ""))
            note = _e(light.get("note", ""))
            cls = f"level-{level}" if level in ("gut", "mittel", "stop") else ""
            label = _level_label(level)
            rows.append(
                f"<p>{icon} <span class='label'>{key}:</span> "
                f"<span class='{cls}'>{_e(label)}</span>"
                + (f" — {note}" if note else "")
                + "</p>"
            )
        lights_html = "".join(rows)
    else:
        lights_html = "<p><em>noch nicht ermittelt</em></p>"
    parts.append(section("Warn-Ampel", lights_html))

    # Verdikt
    verdict_html = ""
    if c["verdict_title"]:
        verdict_html += f"<p><strong>{_e(c['verdict_title'])}</strong></p>"
        if c["verdict_body"]:
            verdict_html += f"<p>{_e(c['verdict_body'])}</p>"
        recommend_labels = {
            "self": "Selbst reparieren",
            "local": "Repair Café / lokale Werkstatt",
            "pro": "Fachwerkstatt (Profi)",
            "replace": "Neuanschaffung",
        }
        if c["recommend"]:
            verdict_html += (
                f"<p><span class='label'>Empfehlung:</span> "
                f"{_e(recommend_labels.get(c['recommend'], c['recommend']))}</p>"
            )
    else:
        verdict_html = "<p><em>noch nicht ermittelt</em></p>"
    parts.append(section("Einschätzung / Verdikt", verdict_html))

    # Konfidenz & Quelle
    conf_html = (
        f"<p><span class='label'>Stufe:</span> {_e(c['conf_level'])}</p>"
        f"<p><span class='label'>Quelle:</span> {_e(c['conf_source'])}</p>"
    )
    if c["conf_note"]:
        conf_html += f"<p>{_e(c['conf_note'])}</p>"
    if c["source"] == "fallback":
        conf_html += (
            '<p><span class="badge badge-fallback">KI-Fallback (nicht belegt)</span> '
            "Es wurde ein Seed-Gerät verwendet — keine echte KI-Analyse.</p>"
        )
    trust = c["trust"]
    if isinstance(trust, dict) and trust.get("level"):
        t_dot = {"hoch": "🟢", "mittel": "🟡", "niedrig": "🔴"}.get(str(trust.get("level")), "❔")
        conf_html += (
            f"<p><span class='label'>Vertrauen:</span> {t_dot} {_e(trust.get('level'))} "
            f"<small>(Quelle: {_e(_s(trust.get('source'), 'unbekannt'))})</small></p>"
        )
        if trust.get("reason"):
            conf_html += f"<p class='freitext'>{_e(_s(trust.get('reason'), ''))}</p>"
    parts.append(section("Quelle &amp; Konfidenz", conf_html))

    # Diagnose-Status
    if c["diag_status"]:
        score_str = _score_str(c["diag_score"], prefix=" (Score: ")
        unclear_warn = ""
        if c["diag_status"] == "unclear":
            unclear_warn = (
                '<p><span class="badge badge-unclear">Unklar</span> '
                "Keine verlässliche Eingrenzung möglich. "
                "Bitte Profi oder Repair Café aufsuchen.</p>"
            )
        diag_html = (
            f"<p><span class='label'>Status:</span> {_e(c['diag_status'])}{_e(score_str)}</p>"
            + (f"<p>{_e(c['diag_reason'])}</p>" if c["diag_reason"] else "")
            + unclear_warn
        )
        parts.append(section("Diagnose-Status", diag_html))

    # Skill
    skill_str = c["skill"] or c["depth"]
    parts.append(section("Können / Skill", f"<p>{_e(skill_str) if skill_str else '<em>noch nicht ermittelt</em>'}</p>"))

    # Garantie
    if c["w_asked"]:
        choice_labels = {
            "reklamation": "Reklamation / Gewährleistung prüfen",
            "weiter": "Trotzdem selbst reparieren",
        }
        warranty_html = (
            f"<p><span class='label'>Kaufalter:</span> {_e(c['w_purchase_age'] or 'nicht angegeben')}</p>"
            f"<p><span class='label'>Entschied:</span> "
            f"{_e(choice_labels.get(c['w_choice'], c['w_choice'] or 'noch keine Wahl'))}</p>"
        )
    else:
        warranty_html = "<p><em>Gate nicht durchlaufen / nicht relevant</em></p>"
    parts.append(section("Garantie / Gewährleistung", warranty_html))

    # Sicherheits-Bestätigungen
    if c["safety_confirms"]:
        sc_rows = []
        for idx, confirm in sorted(c["safety_confirms"].items(), key=lambda x: str(x[0])):
            if not isinstance(confirm, dict):
                continue
            adult = _e(str(confirm.get("adult", "?")))
            confident = _e(str(confirm.get("confident", "?")))
            ts = _e(str(confirm.get("ts", "")))
            sc_rows.append(
                f"<p>Schritt {_e(str(idx))}: Volljährig: {adult} · "
                f"Traut sich zu: {confident}"
                + (f" · <small>{ts}</small>" if ts else "")
                + "</p>"
            )
        sc_html = "".join(sc_rows)
    else:
        sc_html = "<p><em>keine (keine sicherheitskritischen Schritte)</em></p>"
    parts.append(section("Sicherheits-Bestätigungen", sc_html))

    # Entscheidungsprotokoll
    if c["decision_log"]:
        rows = []
        for entry in c["decision_log"]:
            if not isinstance(entry, dict):
                continue
            ts = _e(str(entry.get("ts", "")))
            kind = _e(str(entry.get("kind", "")))
            note = _e(str(entry.get("note", "")))
            src = _e(str(entry.get("source", "")))
            conf = _e(str(entry.get("confidence", "")))
            rows.append(
                f"<tr><td>{ts}</td><td>{kind}</td><td>{note}</td>"
                f"<td>{src}</td><td>{conf}</td></tr>"
            )
        log_html = (
            '<table class="log">'
            "<tr><th>Zeitstempel</th><th>Art</th><th>Hinweis</th>"
            "<th>Quelle</th><th>Konfidenz</th></tr>"
            + "".join(rows)
            + "</table>"
        )
    else:
        log_html = "<p><em>kein Protokoll vorhanden</em></p>"
    parts.append(section("Entscheidungsprotokoll", log_html))

    # ─── Stufe 2: Service-Abschnitte (nur falls vorhanden) ────────────────────

    # PROJ-11 Anbieter
    a = c["sel_anbieter"]
    if isinstance(a, dict) and a:
        typ_label = {"repaircafe": "Repair-Café", "werkstatt": "Werkstatt", "profi": "Profi-Service"}
        a_html = (
            f"<p><strong>{_e(_s(a.get('name'), ''))}</strong> "
            f"<span class='badge' style='background:#f0f0f0;color:#444'>{_e(typ_label.get(a.get('typ'), _s(a.get('typ'), '')))}</span></p>"
            f"<p>{_e(_s(a.get('adresse'), ''))}, {_e(_s(a.get('ort'), ''))} {_e(_s(a.get('plz'), ''))}</p>"
        )
        if a.get("oeffnungszeiten"):
            a_html += f"<p><span class='label'>Zeiten:</span> {_e(_s(a.get('oeffnungszeiten'), ''))}</p>"
        if a.get("kostenhinweis"):
            a_html += f"<p><span class='label'>Kosten:</span> {_e(_s(a.get('kostenhinweis'), ''))}</p>"
        a_html += f"<p class='freitext'>Quelle: {_e(_s(a.get('quelle'), 'kuratierte Demodaten'))} (kuratiert)</p>"
        parts.append(section("Gewählter Anbieter (Vermittlung)", a_html))

    # PROJ-12 Entsorgungsweg
    d = c["sel_entsorgung"]
    if isinstance(d, dict) and d:
        art_label = {"wertstoffhof": "Wertstoffhof", "ruecknahme": "Händler-Rücknahme", "sammelstelle": "Sammelstelle"}
        d_html = (
            f"<p><strong>{_e(_s(d.get('name'), ''))}</strong> "
            f"<span class='badge' style='background:#f0f0f0;color:#444'>{_e(art_label.get(d.get('art'), _s(d.get('art'), '')))}</span></p>"
        )
        if d.get("annahmezeiten"):
            d_html += f"<p><span class='label'>Zeiten:</span> {_e(_s(d.get('annahmezeiten'), ''))}</p>"
        if d.get("kosten"):
            d_html += f"<p><span class='label'>Kosten:</span> {_e(_s(d.get('kosten'), ''))}</p>"
        if d.get("rohstoff"):
            d_html += f"<p><span class='label'>Rohstoff:</span> {_e(_s(d.get('rohstoff'), ''))}</p>"
        d_html += f"<p class='freitext'>Quelle: {_e(_s(d.get('quelle'), 'kuratierte Demodaten'))} (kuratiert)</p>"
        parts.append(section("Entsorgungsweg", d_html))

    # PROJ-13 Alternativgerät
    alt = c["sel_alternative"]
    if isinstance(alt, dict) and alt:
        verg = alt.get("vergleich") or {}
        alt_html = f"<p><strong>{_e(_s(alt.get('modell'), ''))}</strong> — {_e(_s(alt.get('preis'), ''))}</p>"
        if alt.get("ausstattung"):
            alt_html += f"<p><span class='label'>Ausstattung:</span> {_e(_s(alt.get('ausstattung'), ''))}</p>"
        if isinstance(verg, dict) and verg:
            alt_html += (
                f"<p><span class='label'>Vergleich:</span> Geld {_e(_s(verg.get('geld'), '—'))} · "
                f"Zeit {_e(_s(verg.get('zeit'), '—'))} · Umwelt {_e(_s(verg.get('umwelt'), '—'))}</p>"
            )
        einr = alt.get("einrichtung")
        if isinstance(einr, int):
            alt_html += f"<p><span class='label'>Einrichtungsaufwand:</span> {einr}/3</p>"
        alt_html += f"<p class='freitext'>Quelle: {_e(_s(alt.get('quelle'), 'kuratierte Demodaten'))} (kuratiert)</p>"
        parts.append(section("Alternativgerät (Neukauf-Option)", alt_html))

    # PROJ-14 Gemerkte Ersatzteile
    parts_list = c["sel_parts"]
    if parts_list:
        items = []
        for p in parts_list:
            if not isinstance(p, dict):
                continue
            bo = p.get("bestelloption") or {}
            order_html = ""
            if isinstance(bo, dict) and bo.get("verfuegbar"):
                order_html = (
                    f"<br><span class='badge' style='background:#fef9c3;color:#854d0e'>Partner-Link (Provision)</span> "
                    f"{_e(_s(bo.get('partner'), ''))} — Affiliate, nicht vorausgewählt"
                )
            alt_hint = ""
            if p.get("alternativhinweis"):
                alt_hint = f"<br><span class='freitext'>↳ {_e(_s(p.get('alternativhinweis'), ''))}</span>"
            items.append(
                f"<li><strong>{_e(_s(p.get('teil'), ''))}</strong> — {_e(_s(p.get('preis'), ''))} "
                f"<em>({_e(_s(p.get('verfuegbarkeit'), ''))})</em>{order_html}{alt_hint}</li>"
            )
        parts.append(section("Gemerkte Ersatzteile", f"<ul>{''.join(items)}</ul>"))

    # ─── Stufe 3: neue Abschnitte ─────────────────────────────────────────────

    lang = c.get("lang", "de")

    # PROJ-19 Rückruf
    rueckruf = c.get("rueckruf") or {}
    if rueckruf.get("hit"):
        art = _s(rueckruf.get("art"), "rueckruf")
        art_label = _t(f"recall.titel.{art}", lang) if art in ("rueckruf", "sicherheitsmangel") else art
        r_html = (
            f"<p><strong>{_e(art_label)}</strong></p>"
            f"<p><span class='label'>{_e(_t('export.recall.grund', lang))}:</span> {_e(_s(rueckruf.get('grund'), '—'))}</p>"
            f"<p><span class='label'>{_e(_t('export.recall.quelle', lang))}:</span> {_e(_s(rueckruf.get('quelle'), '—'))}</p>"
            f"<p><span class='label'>{_e(_t('export.recall.stand', lang))}:</span> {_e(_s(rueckruf.get('stand'), '—'))}</p>"
        )
        if rueckruf.get("gueltigBis"):
            r_html += f"<p><span class='label'>{_e(_t('export.recall.gueltig_bis', lang))}:</span> {_e(_s(rueckruf.get('gueltigBis'), '—'))}</p>"
        r_html += f"<p><span class='label'>{_e(_t('export.recall.vorgehen', lang))}:</span> {_e(_s(rueckruf.get('vorgehen'), '—'))}</p>"
        parts.append(section(_t("export.recall.titel", lang), r_html))

    # PROJ-20 Datenlöschung
    if c.get("abgabe") == "dritte":
        dl = c.get("datenloeschung") or {}
        def _check(done): return "✅" if done else "☐"
        dl_html = (
            f"<p>{_check(dl.get('backup'))} {_e(_t('export.datenloeschung.backup', lang))}</p>"
            f"<p>{_check(dl.get('loeschen'))} {_e(_t('export.datenloeschung.loeschen', lang))}</p>"
            f"<p>{_check(dl.get('abmelden'))} {_e(_t('export.datenloeschung.abmelden', lang))}</p>"
        )
        if dl.get("bewusstUebersprungen"):
            dl_html += f"<p><strong>⚠ {_e(_t('export.datenloeschung.bewusst_uebersprungen', lang))}</strong></p>"
        parts.append(section(_t("export.datenloeschung.titel", lang), dl_html))

    # PROJ-21 Mehrfachdefekte
    defekte = c.get("defekte") or []
    gesamt_fazit = c.get("gesamt_fazit")
    if isinstance(defekte, list) and len(defekte) >= 2:
        md_rows = []
        for i, d in enumerate(defekte, 1):
            if not isinstance(d, dict):
                continue
            dname = _e(_s(d.get("name") or d.get("id"), f"Defekt {i}"))
            drec = _e(_s(d.get("recommend"), ""))
            lights_html = ""
            dlights = d.get("lights") if isinstance(d.get("lights"), list) else []
            for light in dlights:
                if not isinstance(light, dict):
                    continue
                key = _e(light.get("key", "?"))
                icon = _e(light.get("icon", ""))
                level = str(light.get("level", ""))
                note = _e(light.get("note", ""))
                cls = f"level-{level}" if level in ("gut", "mittel", "stop") else ""
                lights_html += f"<span>{icon} {key}: <span class='{cls}'>{_e(_level_label(level))}</span></span> "
            md_rows.append(f"<li><strong>{dname}</strong> — {drec}<br><small>{lights_html}</small></li>")
        md_html = f"<ol>{''.join(md_rows)}</ol>"
        if isinstance(gesamt_fazit, dict):
            knack = _e(_s(gesamt_fazit.get("knackpunktId"), "—"))
            gf_level = str(gesamt_fazit.get("level", ""))
            gf_rec = _e(_s(gesamt_fazit.get("recommend"), "—"))
            gf_beg = _e(_s(gesamt_fazit.get("begruendung"), ""))
            cls = f"level-{gf_level}" if gf_level in ("gut", "mittel", "stop") else ""
            md_html += (
                f"<p><span class='label'>{_e(_t('export.mehrfachdefekte.knackpunkt', lang))}:</span> {knack}</p>"
                f"<p><span class='label'>Gesamt-Level:</span> <span class='{cls}'>{_e(_level_label(gf_level))}</span>"
                f" · <span class='label'>Empfehlung:</span> {gf_rec}</p>"
            )
            if gf_beg:
                md_html += f"<p class='freitext'>{gf_beg}</p>"
        parts.append(section(_t("export.mehrfachdefekte.titel", lang), md_html))

    # PROJ-22 Consent
    consent = c.get("consent") or {}
    consent_status = _s(consent.get("status"), "offen")
    if consent_status != "offen":
        status_key = f"export.consent.{consent_status}" if consent_status in ("erteilt", "abgelehnt", "widerrufen") else ""
        status_label = _t(status_key, lang) if status_key else consent_status
        cs_html = f"<p><span class='label'>Status:</span> {_e(status_label)}</p>"
        if consent.get("zeitpunkt"):
            cs_html += f"<p><span class='label'>{_e(_t('export.consent.zeitpunkt', lang))}:</span> {_e(_s(consent.get('zeitpunkt'), '—'))}</p>"
        parts.append(section(_t("export.consent.titel", lang), cs_html))

    # PROJ-23 Schwungrad
    schwungrad = c.get("schwungrad") or {}
    if schwungrad.get("beigetragen"):
        sw_html = f"<p><span class='label'>{_e(_t('export.schwungrad.beitrag_id', lang))}:</span> {_e(_s(schwungrad.get('beitragId'), '—'))}</p>"
        ausgeschlossen = schwungrad.get("ausgeschlossen") or []
        if ausgeschlossen:
            sw_html += (
                f"<p><span class='label'>{_e(_t('export.schwungrad.ausgeschlossen', lang))}:</span> "
                + ", ".join(_e(str(x)) for x in ausgeschlossen)
                + "</p>"
            )
        parts.append(section(_t("export.schwungrad.titel", lang), sw_html))

    # PROJ-27 Medien
    medien = c.get("medien") or []
    if isinstance(medien, list) and medien:
        med_items = []
        for m in medien:
            if not isinstance(m, dict):
                continue
            art = _e(_s(m.get("art"), "?"))
            ref = _e(_s(m.get("ref") or m.get("id"), "—"))
            hinweis = _e(_s(m.get("hinweis"), ""))
            med_items.append(
                f"<li><span class='label'>{_e(_t('export.medien.art', lang))}:</span> {art} | "
                f"<span class='label'>{_e(_t('export.medien.referenz', lang))}:</span> <code>{ref}</code>"
                + (f" <span class='freitext'>({hinweis})</span>" if hinweis else "")
                + "</li>"
            )
        parts.append(section(_t("export.medien.titel", lang), f"<ul>{''.join(med_items)}</ul>"))

    # Disclaimer
    parts.append(
        '<p class="disclaimer">Dieses Protokoll wurde automatisch vom Reparatur-Helfer erzeugt. '
        "Alle Schätzwerte sind unverbindlich. KI-Einschätzungen können Fehler enthalten. "
        "Für Sicherheitsentscheidungen immer Fachleute hinzuziehen.</p>"
    )

    body = "\n".join(parts)
    return _wrap_html(f"Reparatur-Protokoll · {c['device_name']}", body)


def _expired_html(vid: str) -> str:
    body = (
        '<div class="expired-box">'
        "<h1>🔒 Link nicht mehr verfügbar</h1>"
        f"<p>Der Vorgang <code>{_e(vid)}</code> ist älter als 30 Tage und wurde automatisch deaktiviert.</p>"
        "<p>Starte einen neuen Vorgang im <a href='/'>Reparatur-Helfer</a>.</p>"
        "</div>"
    )
    return _wrap_html("Vorgang abgelaufen — Reparatur-Helfer", body)


def _wrap_html(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>{_e(title)}</title>
  <style>{_HTML_CSS}</style>
</head>
<body>
{body}
</body>
</html>"""
