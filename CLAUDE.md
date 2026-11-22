# Arbeitsregeln fuer dieses Repository

Diese Regeln gelten fuer jede Session in diesem Repository.

## Sprache und Stil
* Antworten auf Deutsch, ohne scharfes s (immer "ss" schreiben).
* Keine typischen KI Merkmale im Text, insbesondere keine Gedankenstriche oder Bindestriche als Satzzeichen.

## Workflow: Ticket, Prompt, Umsetzung, Report
Jede Aenderung laeuft in genau diesen vier Schritten:
1. **Ticket** anlegen in `<projekt>/tickets/` (Vorlage: `english-c1/tickets/TEMPLATE.md`).
2. **Prompt** fuer die Umsetzung schreiben in `<projekt>/prompts/` (gleiche Nummer wie das Ticket).
3. **Umsetzung** durch Claude Code anhand des Prompts.
4. **Report** am Schluss in `<projekt>/reports/` (Vorlage: `english-c1/reports/TEMPLATE.md`).

Nummerierung: `T-0001`, `T-0002`, ... Ticket, Prompt und Report tragen dieselbe Nummer.

## Prinzipien
* Best Practices von Anthropic und Boris Cherny (Creator von Claude Code): erst erkunden, dann planen, dann umsetzen, dann verifizieren. Kleine, ueberpruefbare Schritte. Tests als Feedbackschleife.
* Softwarequalitaet: SOLID, DRY, KISS, YAGNI, klare Namen, kleine Funktionen, hohe Kohaesion, lose Kopplung.
* Refactoring und Entwurfsmuster nach refactoring.guru (https://refactoring.guru/design-patterns). Muster nur einsetzen, wenn sie ein echtes Problem loesen. Zustand bewusst modellieren (z. B. State Pattern, unveraenderliche Daten, eine Quelle der Wahrheit).
* Objektorientierte Programmierung dort anwenden, wo Zustand und Verhalten zusammengehoeren.
* Nach jeder Aenderung: Security Audit (`/security-review`) und Code Simplifier (`/simplify`) ausfuehren und im Report dokumentieren.

## Tiering Test Strategie (kein Flaschenhals beim Testen und Deployen)
* **Tier 1, Unit Tests** (`tests/tier1-unit`): schnell, ohne IO, laufen bei jeder Aenderung und jedem Commit. Ziel unter 30 Sekunden.
* **Tier 2, Integration Tests** (`tests/tier2-integration`): laufen bei jedem Push bzw. Pull Request, parallelisiert.
* **Tier 3, End to End Tests** (`tests/tier3-e2e`): nur kritische Pfade, laufen vor dem Deploy oder nachts.
* Kein Tier blockiert ein schnelleres Tier. Deploy darf nie auf langsamen, instabilen Tests warten.

## Projekte
* `english-c1/`: Englisch C1 Projekt.
