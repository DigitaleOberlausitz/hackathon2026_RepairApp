"""Mehrsprachigkeit (PROJ-24) — Backend-seitige i18n-Texte.

Liefert übersetzte Texte für Endpunkt-Hinweise, Export-Labels,
Consent-Text, Recall-Vorgehen via ``t(key, lang)``.
Unterstützte Sprachen: ``de`` (Standard) und ``en``.

Zusätzlich:
  lang_directive(lang)         → Systemdirektive für KI-Antwortsprache
  ist_falsche_sprache(text, lang)  → heuristisch prüfen ob KI-Antwort passt
  NUR_DEUTSCH_FLAG             → True (Flag für rein deutschen Inhalt)
"""

from __future__ import annotations

NUR_DEUTSCH_FLAG = True  # Alle kuratierten Inhalte sind bisher nur auf Deutsch verfügbar

# ─── Übersetzungs-Katalog ─────────────────────────────────────────────────────

_KATALOG: dict[str, dict[str, str]] = {
    # ── Consent (PROJ-22) ──────────────────────────────────────────────────────
    "consent.titel": {
        "de": "Einwilligung zur Datenverarbeitung",
        "en": "Consent to Data Processing",
    },
    "consent.body": {
        "de": (
            "Der Reparatur-Helfer verarbeitet deine Eingaben (Gerätebeschreibung, "
            "Symptome, Antworten), um dir eine Diagnose und Handlungsempfehlung zu geben. "
            "Ohne Einwilligung kannst du die App weiter nutzen — nur KI-gestützte "
            "Analyse und das Wissensbasis-Schwungrad werden dann nicht aktiviert."
        ),
        "en": (
            "The Repair Helper processes your inputs (device description, symptoms, "
            "answers) to provide you with a diagnosis and recommendations. "
            "Without consent, you can still use the app — only AI-assisted analysis "
            "and the knowledge flywheel will not be activated."
        ),
    },
    "consent.trainingshinweis": {
        "de": (
            "Mit deiner Einwilligung kann dein anonymisierter Reparaturfall als Entwurf "
            "in die kuratierte Wissensbasis einfließen (PROJ-23 Schwungrad). "
            "Persönliche Daten werden vorher automatisch entfernt. "
            "Du kannst deine Einwilligung jederzeit widerrufen."
        ),
        "en": (
            "With your consent, your anonymized repair case may be submitted as a draft "
            "to the curated knowledge base (PROJ-23 Flywheel). "
            "Personal data is removed automatically before submission. "
            "You can revoke your consent at any time."
        ),
    },
    "consent.verweis_proj23": {
        "de": "Mehr zum Schwungrad-Mechanismus: Einstellungen → Wissensbasis-Beitrag.",
        "en": "Learn more about the flywheel mechanism: Settings → Knowledge Contribution.",
    },
    "consent.option.erteilen": {
        "de": "Einwilligung erteilen",
        "en": "Grant consent",
    },
    "consent.option.ablehnen": {
        "de": "Ablehnen (App trotzdem nutzen)",
        "en": "Decline (continue using the app)",
    },
    "consent.status.erteilt": {
        "de": "Einwilligung erteilt",
        "en": "Consent granted",
    },
    "consent.status.abgelehnt": {
        "de": "Einwilligung abgelehnt",
        "en": "Consent declined",
    },
    "consent.status.widerrufen": {
        "de": "Einwilligung widerrufen",
        "en": "Consent revoked",
    },
    "consent.status.offen": {
        "de": "Noch keine Entscheidung",
        "en": "No decision yet",
    },
    # ── Rückruf (PROJ-19) ──────────────────────────────────────────────────────
    "recall.titel": {
        "de": "⚠️ Rückruf / Sicherheitsmangel",
        "en": "⚠️ Recall / Safety Notice",
    },
    "recall.titel.rueckruf": {
        "de": "🛑 Offizieller Rückruf",
        "en": "🛑 Official Recall",
    },
    "recall.titel.sicherheitsmangel": {
        "de": "⚠️ Bekannter Sicherheitsmangel",
        "en": "⚠️ Known Safety Defect",
    },
    "recall.kein_treffer": {
        "de": "Kein Rückruf für dieses Gerät bekannt.",
        "en": "No recall found for this device.",
    },
    "recall.modell_unsicher": {
        "de": "Modellbezeichnung unklar — Rückruf-Prüfung nicht eindeutig möglich.",
        "en": "Model identification unclear — recall check inconclusive.",
    },
    "recall.vorgehen_standard": {
        "de": (
            "Nutz das Gerät NICHT weiter. Wende dich an den Hersteller oder Händler "
            "für Erstattung, Reparatur oder Austausch. Alle Details stehen in der Rückruf-Meldung."
        ),
        "en": (
            "Do NOT use the device further. Contact the manufacturer or retailer "
            "for refund, repair, or replacement. Full details are in the recall notice."
        ),
    },
    # ── Export-Labels ──────────────────────────────────────────────────────────
    "export.recall.titel": {
        "de": "RÜCKRUF / SICHERHEITSMANGEL",
        "en": "RECALL / SAFETY NOTICE",
    },
    "export.recall.grund": {
        "de": "Grund",
        "en": "Reason",
    },
    "export.recall.quelle": {
        "de": "Quelle",
        "en": "Source",
    },
    "export.recall.stand": {
        "de": "Stand",
        "en": "As of",
    },
    "export.recall.gueltig_bis": {
        "de": "Gültig bis",
        "en": "Valid until",
    },
    "export.recall.vorgehen": {
        "de": "Vorgehen",
        "en": "Action required",
    },
    "export.datenloeschung.titel": {
        "de": "DATENLÖSCHUNG VOR FREMDABGABE",
        "en": "DATA DELETION BEFORE HANDOVER",
    },
    "export.datenloeschung.backup": {
        "de": "Datensicherung erstellt",
        "en": "Backup created",
    },
    "export.datenloeschung.loeschen": {
        "de": "Daten gelöscht / Gerät zurückgesetzt",
        "en": "Data deleted / device reset",
    },
    "export.datenloeschung.abmelden": {
        "de": "Konten abgemeldet (Cloud, App-Stores…)",
        "en": "Accounts signed out (cloud, app stores…)",
    },
    "export.datenloeschung.bewusst_uebersprungen": {
        "de": "⚠ Schutzschritte bewusst übersprungen",
        "en": "⚠ Protection steps deliberately skipped",
    },
    "export.mehrfachdefekte.titel": {
        "de": "MEHRFACHDEFEKTE / GESAMT-FAZIT",
        "en": "MULTIPLE DEFECTS / OVERALL CONCLUSION",
    },
    "export.mehrfachdefekte.knackpunkt": {
        "de": "Knackpunkt",
        "en": "Critical issue",
    },
    "export.mehrfachdefekte.begruendung": {
        "de": "Begründung",
        "en": "Reasoning",
    },
    "export.mehrfachdefekte.prioritaet": {
        "de": "Priorität",
        "en": "Priority",
    },
    "export.consent.titel": {
        "de": "EINWILLIGUNGSSTATUS",
        "en": "CONSENT STATUS",
    },
    "export.consent.erteilt": {
        "de": "Einwilligung erteilt",
        "en": "Consent granted",
    },
    "export.consent.abgelehnt": {
        "de": "Einwilligung abgelehnt",
        "en": "Consent declined",
    },
    "export.consent.widerrufen": {
        "de": "Einwilligung widerrufen",
        "en": "Consent revoked",
    },
    "export.consent.zeitpunkt": {
        "de": "Zeitpunkt",
        "en": "Timestamp",
    },
    "export.schwungrad.titel": {
        "de": "WISSENSBASIS-BEITRAG (SCHWUNGRAD)",
        "en": "KNOWLEDGE BASE CONTRIBUTION (FLYWHEEL)",
    },
    "export.schwungrad.beitrag_id": {
        "de": "Beitrags-ID",
        "en": "Contribution ID",
    },
    "export.schwungrad.ausgeschlossen": {
        "de": "Ausgeschlossene Inhalte (nicht anonymisierbar)",
        "en": "Excluded content (not anonymizable)",
    },
    "export.medien.titel": {
        "de": "MEDIEN-ANHÄNGE",
        "en": "MEDIA ATTACHMENTS",
    },
    "export.medien.art": {
        "de": "Art",
        "en": "Type",
    },
    "export.medien.referenz": {
        "de": "Referenz",
        "en": "Reference",
    },
    # ── Allgemeine Hinweise ────────────────────────────────────────────────────
    "hinweis.nur_deutsch": {
        "de": "Nur auf Deutsch verfügbar",
        "en": "Available in German only",
    },
    "hinweis.ki_fallback": {
        "de": "KI-Einschätzung — bitte selbst prüfen",
        "en": "AI estimate — please verify yourself",
    },
    "hinweis.transkription_browser": {
        "de": "Bitte Browser-Spracherkennung verwenden",
        "en": "Please use browser speech recognition",
    },
    "hinweis.medium_unbrauchbar": {
        "de": "Medium konnte nicht verarbeitet werden (zu dunkel, zu klein oder ungültiger Typ)",
        "en": "Media could not be processed (too dark, too small, or invalid type)",
    },
    "hinweis.medium_gespeichert": {
        "de": "Medium gespeichert",
        "en": "Media saved",
    },
    # ── Recherche ──────────────────────────────────────────────────────────────
    "recherche.kein_treffer": {
        "de": "Keine gesicherte Einschätzung verfügbar — bitte prüfe aktuelle Quellen.",
        "en": "No verified assessment available — please check current sources.",
    },
    "recherche.widerspruch": {
        "de": "Widersprüchliche Quellen gefunden — Einschätzung mit Vorbehalt.",
        "en": "Contradictory sources found — assessment with reservation.",
    },
    # ── Lotse ──────────────────────────────────────────────────────────────────
    "lotse.steueroption.weiter": {
        "de": "Weiter",
        "en": "Continue",
    },
    "lotse.steueroption.profi": {
        "de": "Profi / Repair-Café",
        "en": "Pro / Repair Café",
    },
    "lotse.steueroption.austausch": {
        "de": "Gerät ersetzen",
        "en": "Replace device",
    },
    "lotse.steueroption.entsorgen": {
        "de": "Entsorgen",
        "en": "Dispose",
    },
    "lotse.steueroption.abbrechen": {
        "de": "Abbrechen",
        "en": "Cancel",
    },
    # ── Datenlöschung ──────────────────────────────────────────────────────────
    "datenloeschung.backup.label": {
        "de": "Datensicherung erstellen",
        "en": "Create data backup",
    },
    "datenloeschung.backup.hinweis": {
        "de": "Sichere alle wichtigen Daten (Fotos, Dokumente, Kontakte) auf einem externen Speicher oder in der Cloud.",
        "en": "Back up all important data (photos, documents, contacts) to external storage or cloud.",
    },
    "datenloeschung.loeschen.label": {
        "de": "Daten löschen / Gerät zurücksetzen",
        "en": "Delete data / factory reset",
    },
    "datenloeschung.loeschen.hinweis": {
        "de": "Führe einen Werksreset durch: Einstellungen → Allgemein → Zurücksetzen. Alle Daten werden unwiderruflich gelöscht.",
        "en": "Perform a factory reset: Settings → General → Reset. All data will be permanently deleted.",
    },
    "datenloeschung.abmelden.label": {
        "de": "Konten abmelden",
        "en": "Sign out of accounts",
    },
    "datenloeschung.abmelden.hinweis": {
        "de": "Melde dich von Apple-ID / Google-Konto, App-Stores und Banking-Apps ab, bevor du das Gerät abgibst.",
        "en": "Sign out of Apple ID / Google account, app stores, and banking apps before handing over the device.",
    },
}

# ─── Öffentliche API ─────────────────────────────────────────────────────────


def t(key: str, lang: str = "de") -> str:
    """Gibt den übersetzten Text für ``key`` in ``lang`` zurück.

    Fallback-Kette: angefragte Sprache → Deutsch → Key selbst (nie leer).
    """
    lang = (lang or "de").strip().lower()
    if lang not in ("de", "en"):
        lang = "de"
    entry = _KATALOG.get(key, {})
    return entry.get(lang) or entry.get("de") or f"[{key}]"


def lang_directive(lang: str) -> str:
    """Systemdirektive für den KI-Prompt zur Sprachsteuerung."""
    lang = (lang or "de").strip().lower()
    if lang == "en":
        return "IMPORTANT: Answer in English. All device descriptions, notes, and recommendations must be in English."
    return "Antworte auf Deutsch. Alle Geräte-Beschreibungen, Hinweise und Empfehlungen auf Deutsch."


def ist_falsche_sprache(text: str, lang: str) -> bool:
    """Heuristisch prüfen, ob die KI-Antwort in der falschen Sprache ist.

    Gibt True zurück, wenn Verdacht auf falsche Sprache besteht.
    Konservativ: lieber False (kein erneuter Aufruf) als ständiges Retry.
    """
    text = (text or "").strip()
    if not text or len(text) < 30:
        return False
    lang = (lang or "de").strip().lower()

    # Typisch deutsche Wörter/Endungen
    _DE_MARKERS = ("und ", "ist ", "der ", "die ", "das ", "nicht ", "für ", "mit ", "wird ")
    # Typisch englische Wörter
    _EN_MARKERS = ("the ", "and ", "is ", "this ", "with ", "your ", "device ", "repair ")

    low = text.lower()
    if lang == "en":
        # Wenn kaum englische, aber viele deutsche Marker → falsche Sprache
        de_count = sum(1 for m in _DE_MARKERS if m in low)
        en_count = sum(1 for m in _EN_MARKERS if m in low)
        return de_count > 3 and en_count < 2
    # Für Deutsch: sehr grob, nur offensichtliche englische Texte
    en_count = sum(1 for m in _EN_MARKERS if m in low)
    de_count = sum(1 for m in _DE_MARKERS if m in low)
    return en_count > 4 and de_count < 2
