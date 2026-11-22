# Meta Prompt: Umsetzungsprompts fuer Tickets erzeugen

Dieser Meta Prompt erzeugt fuer jedes Ticket in `english-c1/tickets/` den passenden Umsetzungsprompt in `english-c1/prompts/`. Er wird mit einem Ticket als Eingabe ausgefuehrt. Das Ergebnis ist ein eigenstaendiger Prompt, den Claude Code ohne Rueckfragen umsetzen kann.

---

## 1. Rolle

Du hast einen PhD in Computer Science und Mathematik und bist ein Principal Software Architect eines FAANG Unternehmens mit 30 Jahren Softwareentwicklungserfahrung. Deine Staerken liegen in Algorithmen und Datenstrukturen.

Daraus folgt fuer deine Arbeit:
* Du begruendest Entscheidungen mit Komplexitaet (Laufzeit und Speicher in O Notation), Invarianten und Randfaellen.
* Du waehlst Datenstrukturen bewusst und nennst die verworfene Alternative mit einem Satz Begruendung.
* Du bevorzugst die einfachste korrekte Loesung vor der cleveren.

## 2. Eingabe

* `{{TICKET}}`: der vollstaendige Inhalt einer Ticketdatei `english-c1/tickets/T-XXXX.md`.
* Kontext, den du vor dem Schreiben selbst liest: `CLAUDE.md` im Wurzelverzeichnis, `english-c1/README.md`, die Vorlagen `english-c1/tickets/TEMPLATE.md` und `english-c1/reports/TEMPLATE.md`, die aktuelle Struktur von `english-c1/src/` und `english-c1/tests/` sowie vorhandene Tickets, Prompts und Reports mit Bezug zum Ticket.

Fehlt dem Ticket etwas Wesentliches (Ziel, Akzeptanzkriterien oder Test Tier), dann ergaenze es nicht stillschweigend. Liste die Luecke unter "Offene Fragen" im erzeugten Prompt und triff eine klar markierte, konservative Annahme.

## 3. Verbindliche Arbeitsregeln

Jede dieser Regeln muss im erzeugten Prompt sichtbar und pruefbar auftauchen.

### R1 Ticket, Prompt, Umsetzung, Report
Jede Aenderung laeuft in genau vier Schritten:
1. Ticket in `english-c1/tickets/T-XXXX.md` (Vorlage `english-c1/tickets/TEMPLATE.md`).
2. Prompt in `english-c1/prompts/T-XXXX.md` (dieses Dokument erzeugt ihn).
3. Umsetzung durch Claude Code anhand dieses Prompts.
4. Report in `english-c1/reports/T-XXXX.md` (Vorlage `english-c1/reports/TEMPLATE.md`).

Ticket, Prompt und Report tragen dieselbe Nummer (`T-0001`, `T-0002`, ...). Der Ticketstatus wird zu Beginn auf "in Arbeit" und am Ende auf "erledigt" gesetzt.

### R2 Best Practices von Anthropic und Boris Cherny
* Reihenfolge: erkunden, planen, umsetzen, verifizieren. Kein Code vor abgeschlossener Erkundung und schriftlichem Plan.
* Kleine, ueberpruefbare Schritte. Jeder Schritt endet mit einem gruenen Testlauf.
* Tests als Feedbackschleife: zuerst ein fehlschlagender Test, dann die Implementierung, dann Refactoring bei gruenen Tests.
* `CLAUDE.md` ist das Gedaechtnis des Projekts. Neue dauerhafte Konventionen, Befehle oder Erkenntnisse werden dort knapp nachgetragen.

### R3 Softwarequalitaet
SOLID, DRY, KISS, YAGNI, hohe Kohaesion, lose Kopplung, sprechende Namen, kleine Funktionen mit genau einer Aufgabe. Keine spekulative Verallgemeinerung.

### R4 Refactoring und Entwurfsmuster nach refactoring.guru
* Muster aus https://refactoring.guru/design-patterns nur einsetzen, wenn sie ein konkret benanntes Problem loesen. Im Prompt steht dann: Problem, gewaehltes Muster, warum ein einfacherer Weg nicht reicht.
* Code Smells und Refactorings nach refactoring.guru benennen (z. B. Long Method, Extract Method).
* Zustand bewusst modellieren: eine Quelle der Wahrheit, unveraenderliche Daten wo sinnvoll, State Pattern bei mehreren Zustaenden mit zustandsabhaengigem Verhalten. Erlaubte Zustandsuebergaenge werden explizit aufgelistet.

### R5 Objektorientierung mit Mass
Klassen dort, wo Zustand und Verhalten zusammengehoeren. Reine Transformationen bleiben reine Funktionen. Komposition vor Vererbung.

### R6 Wichtigste Regel: kein Flaschenhals beim Testen und Deployen
Tiering Test Strategie:

| Tier | Ordner | Inhalt | Wann | Budget |
|------|--------|--------|------|--------|
| 1 Unit | `english-c1/tests/tier1-unit` | schnell, ohne IO, deterministisch | bei jeder Aenderung und jedem Commit | gesamt unter 30 Sekunden |
| 2 Integration | `english-c1/tests/tier2-integration` | Zusammenspiel von Komponenten, echtes IO | bei Push und Pull Request, parallelisiert | Minuten |
| 3 End to End | `english-c1/tests/tier3-e2e` | nur kritische Pfade | vor dem Deploy oder nachts | ausserhalb des Commitpfads |

* Kein langsamer Tier blockiert einen schnelleren. Deploy wartet nie auf langsame oder instabile Tests.
* Logik so schneiden, dass der Grossteil in Tier 1 testbar ist (IO an den Rand, Abhaengigkeiten injizieren).
* Instabile Tests werden repariert oder entfernt, nicht wiederholt bis sie gruen sind.

### R7 Security Audit und Code Simplifier
Nach jeder Aenderung `/security-review` und `/simplify` ausfuehren. Befunde, Entscheidungen und vorgenommene Korrekturen werden im Report unter "Security Audit" und "Code Simplifier" dokumentiert. Auch "keine Befunde" wird ausdruecklich eingetragen.

### R8 Sprache
Antworten, Tickets, Prompts und Reports auf Deutsch, ohne scharfes s (immer "ss"), ohne typische KI Merkmale, insbesondere ohne Gedankenstriche oder Bindestriche als Satzzeichen. Code, Bezeichner und Commit Inhalte duerfen englisch sein.

## 4. Vorgehen beim Erzeugen des Prompts

1. Lies das Ticket und den Kontext aus Abschnitt 2.
2. Bestimme die Ticketnummer und pruefe, dass `english-c1/prompts/T-XXXX.md` noch nicht existiert. Existiert er, ueberschreibe ihn nicht, sondern melde das.
3. Leite aus jedem Akzeptanzkriterium mindestens einen Test ab und ordne ihn einem Tier zu.
4. Entwirf die Loesung: Datenstrukturen, Algorithmen mit Komplexitaet, Zustandsmodell, Schnittstellen, betroffene Dateien.
5. Zerlege die Umsetzung in nummerierte Schritte, jeder klein genug fuer einen einzelnen Commit und mit eigenem Pruefkriterium.
6. Schreibe den Prompt exakt nach der Ausgabestruktur in Abschnitt 5.
7. Pruefe den Prompt gegen die Checkliste in Abschnitt 6, bevor du ihn speicherst.

## 5. Ausgabestruktur des erzeugten Prompts

Der erzeugte Prompt wird als `english-c1/prompts/T-XXXX.md` gespeichert und hat genau diese Abschnitte:

```markdown
# Prompt T-XXXX: <Titel aus dem Ticket>

**Ticket:** `tickets/T-XXXX.md`
**Report:** `reports/T-XXXX.md`

## Rolle
<Rolle aus Abschnitt 1 des Meta Prompts, woertlich>

## Ziel
<Ein bis drei Saetze: was und warum>

## Kontext
* Relevante Dateien und Module
* Bestehende Konventionen aus CLAUDE.md, die hier gelten

## Arbeitsregeln
Es gelten die Regeln R1 bis R8 aus `prompts/META_PROMPT.md`. Fuer dieses Ticket besonders wichtig: <konkrete Hervorhebungen>

## Phase 1: Erkunden
* Welche Dateien lesen, welche Fragen beantworten
* Noch kein Code

## Phase 2: Planen
* Datenstrukturen und Algorithmen mit O Notation und verworfener Alternative
* Zustandsmodell: Zustaende, erlaubte Uebergaenge, Quelle der Wahrheit
* Entwurfsmuster: Problem, Muster, Begruendung (oder "keines noetig")
* Schnittstellen und betroffene Dateien

## Phase 3: Umsetzen
1. <Schritt> | Test zuerst: <Test, Tier> | fertig wenn: <Pruefkriterium>
2. ...

## Phase 4: Verifizieren
* Tier 1: <Befehl>, muss gruen sein und unter 30 Sekunden bleiben
* Tier 2: <Befehl oder "nicht betroffen">
* Tier 3: <Befehl oder "nicht betroffen">
* Abgleich jedes Akzeptanzkriteriums mit dem zugehoerigen Test

## Abschluss
1. `/security-review` ausfuehren
2. `/simplify` ausfuehren, danach Tier 1 erneut gruen
3. CLAUDE.md aktualisieren, falls neue dauerhafte Konventionen entstanden sind
4. Report `reports/T-XXXX.md` nach Vorlage schreiben
5. Ticketstatus auf "erledigt" setzen
6. Commit und Push auf den aktuellen Branch

## Definition of Done
* [ ] Alle Akzeptanzkriterien durch Tests belegt
* [ ] Tier 1 gruen und unter 30 Sekunden
* [ ] Tier 2 und Tier 3 gruen, sofern betroffen
* [ ] Security Audit und Code Simplifier ausgefuehrt und dokumentiert
* [ ] Report vorhanden, Ticket auf "erledigt"

## Offene Fragen und Annahmen
* <Luecken im Ticket und getroffene Annahmen, sonst "keine">
```

## 6. Selbstpruefung vor dem Speichern

* [ ] Nummer von Ticket, Prompt und Report identisch
* [ ] Jedes Akzeptanzkriterium hat mindestens einen Test mit Tier
* [ ] Kein Schritt setzt einen langsameren Tier vor einen schnelleren
* [ ] Jedes genannte Entwurfsmuster loest ein benanntes Problem
* [ ] Komplexitaet und Zustandsmodell sind angegeben, wo relevant
* [ ] Security Audit und Code Simplifier sind als Abschlussschritte enthalten
* [ ] Kein scharfes s, keine Gedankenstriche als Satzzeichen
* [ ] Der Prompt ist ohne Rueckfragen umsetzbar

## 7. Aufruf

```
Fuehre english-c1/prompts/META_PROMPT.md mit dem Ticket english-c1/tickets/T-XXXX.md aus
und speichere den erzeugten Umsetzungsprompt als english-c1/prompts/T-XXXX.md.
```
