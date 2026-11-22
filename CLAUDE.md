# Arbeitsregeln für dieses Repository

Diese Regeln gelten für jede Session in diesem Repository.

## Sprache und Stil
* Arbeitssprache Deutsch, Übungsinhalte Englisch.
* Kein ß, immer ss. Umlaute als ü ä ö, nicht ue ae oe.
* Keine Gedankenstriche und keine KI typischen Floskeln. Direkt und informell.

## Workflow: Ticket, Prompt, Umsetzung, Report
Jede Änderung läuft in genau diesen vier Schritten:
1. **Ticket** anlegen in `<projekt>/tickets/` (Vorlage: `english-c1/tickets/TEMPLATE.md`).
2. **Prompt** für die Umsetzung schreiben in `<projekt>/prompts/` (gleiche Nummer wie das Ticket), erzeugt mit `english-c1/prompts/META_PROMPT.md`.
3. **Umsetzung** durch Claude Code anhand des Prompts.
4. **Report** am Schluss in `<projekt>/reports/` (Vorlage: `english-c1/reports/TEMPLATE.md`).

Nummerierung: `T-0001`, `T-0002`, ... Ticket, Prompt und Report tragen dieselbe Nummer.

## Prinzipien
* Best Practices von Anthropic und Boris Cherny (Creator von Claude Code): erst erkunden, dann planen, dann umsetzen, dann verifizieren. Kleine, überprüfbare Schritte. Tests als Feedbackschleife.
* Softwarequalität: SOLID, DRY, KISS, YAGNI, klare Namen, kleine Funktionen, hohe Kohäsion, lose Kopplung.
* Refactoring und Entwurfsmuster nach refactoring.guru (https://refactoring.guru/design-patterns). Muster nur einsetzen, wenn sie ein echtes Problem lösen. Zustand bewusst modellieren (z. B. State Pattern, unveränderliche Daten, eine Quelle der Wahrheit).
* Objektorientierte Programmierung dort anwenden, wo Zustand und Verhalten zusammengehören.
* Nach jeder Änderung: Security Audit (`/security-review`) und Code Simplifier (`/simplify`) ausführen und im Report dokumentieren.

## Tiering Test Strategie (kein Flaschenhals beim Testen und Deployen)
Das Lernportal ist eine einzige HTML Datei ohne Build. Die Tiers bauen auf dem Prüfworkflow aus `english-c1/CLAUDE.md` auf:
* **Tier 1, Sekunden** (`tests/tier1-unit`): `node --check` auf den Scriptblock, div Bilanz, Smoke Test der Pools und reinen Funktionen (z. B. `weightOf`, `classifyTopic`, `varyText`). Läuft nach jeder Änderung.
* **Tier 2, unter einer Minute** (`tests/tier2-integration`): Datenintegrität aller Pools (genau 3 Optionen, gültiger Lösungsindex, Titelformat der Reading Tests, 10 eindeutige Wörter pro Wortkasten) und Simulationsmodi im Headless Lauf. Läuft vor jedem Push.
* **Tier 3, Minuten** (`tests/tier3-e2e`): Playwright mit Chromium, nur kritische Pfade (Tab Wechsel, eine Runde pro Modus, Persistenz in localStorage, PDF Lernblatt). Läuft vor einer Auslieferung.
* Kein Tier blockiert ein schnelleres Tier. Eine Auslieferung wartet nie auf langsame, instabile Tests.

## Projekte
* `english-c1/`: Aptis ESOL Advanced (C1) Lernportal. Fachlicher Kontext, Datenstrukturen und Prüfworkflow stehen in `english-c1/CLAUDE.md`.
* Die Datei `aptis-c1-lernportal.html` gehört nach `english-c1/src/`.
