# Aptis ESOL Advanced (C1) Lernportal

Kontextdatei für Claude Code. Enthält Ziel, Arbeitsweise, Architektur und aktuellen Stand.
Stand: 22.11.2026

## Wer und warum

Enes, Projektleiter FTTH bei Circet Schweiz, bereitet sich auf den Aptis ESOL Advanced vor.
Ziel: C1 gesamt.

**Prüfung August 2026 (bereits absolviert):**

| Komponente | Punkte (0 bis 50) | Niveau |
|---|---|---|
| Writing | 43 | C1 (durch starken Core hochgestuft) |
| Speaking | 41 | B2 |
| Reading | 34 | B2 |
| Listening | 28 | B2 |
| Core (Grammar und Vocabulary) | 39 | kein CEFR-Niveau |
| **Gesamt** | 146 von 200 | **B2** |

**Zweiter Anlauf geplant für Januar 2027 in Milano.** Die Dreimonatssperre für Advanced ist
abgelaufen (Prüfung war August).

**Offizielle Cut Scores Aptis Advanced** (British Council, Aptis Scoring System v2.0, Anhang):

| | B1 ab | B2 ab | C1 ab | C2 ab |
|---|---|---|---|---|
| Listening | 14 | 24 | 38 | 50 |
| Reading | 16 | 28 | 40 | 50 |
| Writing | 22 | 37 | 44 | 50 |
| Speaking | 22 | 37 | 44 | 50 |

Gesamtniveau = gerundeter Durchschnitt der vier Fertigkeitsniveaus. Der Core bekommt kein
eigenes Niveau, hebt aber in der Grauzone knapp unter einer Grenze auf das höhere Niveau.
Nach unten korrigiert er nie.

**Wichtigste Priorität: Speaking von 41 auf 44.** Mit Speaking auf C1 ergäbe
C1, C1, B2, B2 gerundet C1 gesamt. Zweite Priorität: Core von 39 auf 44 plus als
Sicherheitsnetz für die Grauzone.

## Arbeitsweise mit Enes

- Arbeitssprache Deutsch, Übungsinhalte Englisch
- **Kein ß, immer ss. Keine Gedankenstriche.** Umlaute als ü ä ö, nicht ue ae oe
- Direkt und informell, keine KI-typischen Floskeln
- Inhalte müssen dem echten Aptis-Format entsprechen. Wo Buchseiten fehlten und Inhalte
  rekonstruiert wurden, wird das transparent benannt
- Lernt über Sofort-Feedback: falsche Antwort durchgestrichen, richtige hervorgehoben

## Das Produkt

`aptis-c1-lernportal.html`, eine einzige selbstständige HTML-Datei, rund 1,2 MB,
kein Build, kein Server. Design petrol und safran. Neun Tabs:

`p-grammar`, `p-vocab`, `p-reading`, `p-listening`, `p-writing`, `p-speaking`, `p-sim`, `p-plan`, `p-info`

Die Datei liegt unter `src/aptis-c1-lernportal.html`. Persistenz läuft über `window.storage`
(Artifact Speicher von claude.ai). Ausserhalb von Claude speichert das Portal nichts, und die
KI Knöpfe funktionieren nur dort.

### Inhalt (Stand heute, direkt aus der Datei ausgelesen)

| Bereich | Menge |
|---|---|
| Grammar | 648 Fragen, davon 456 Original-Buchfragen aus Tests 1 bis 20 |
| Vocabulary | 1011 Fragen (592 Collocation, 158 Word Pair, 146 Definition, 75 Usage, 40 Word Formation) |
| Reading | 225 Fragen in 36 Tasks, 9 komplette Tests (A bis I) |
| Zuordnungen (Fragen 26 bis 30) | 420 Items in 84 Aufgaben |
| Karteikarten | 187 C1-Wörter plus 56 Reading-Wörter |
| **Gesamt** | **2304 Testfragen** |

### Datenstrukturen im Script

Alles liegt in einem einzigen `<script>`-Block am Dateiende.

- `grammarPool`: `{t:'Grammar', g:<Themenindex>, q, a:[3], c, e}`
- `vocabPool`: `{t:'Word Pair'|'Definition'|'Usage'|'Collocation'|'Word Formation', q, a:[3], c, e}`
- `readingTexts`: `[{title:'Reading-Test X · Task N: Typ · Thema', text, qs:[{q,a,c,e}], sec, start}]`
  Titelformat ist bindend, `buildFullReading()` gruppiert danach
- `matchTasks`: `[{type, theme, items:[{p,a,e}] (5 Stück), dist:[5]}]`
  Wortkasten = 5 Lösungen plus 5 Ablenker, immer genau 10 eindeutige Wörter
- `words`, `readingWords`: Karteikarten `{w,p,d,s,b}`
- `meaningMap`, `bridgeMap`, `collocMap`: Lexika für die Fehlererklärungen
- `topicSimple`, `topicGerman`, `topicMerk`, `grammarDeep`: Erklärtexte pro Grammatikthema

### Lernlogik

- **Adaptives Leitner-System**: `weightOf(q) = max(0.002, 0.65^mastery)`, richtig +1,
  falsch zurück auf maximal 2. Persistiert als `aptis-mastery-v1`
- **Vokabeln härter**: einmal richtig heisst Gewicht 0.02, das Wort kommt praktisch nicht mehr,
  bis alle durch sind. Ein Fehler setzt es auf 1 zurück
- **Wiederholungssperre**: die letzten 160 beantworteten Fragen bekommen Faktor 0.05,
  persistiert als `aptis-recent-v1`
- **Satzvariation**: `varyText()` tauscht bis zu zwei Satzbausteine gegen Synonyme,
  damit Sätze nicht auswendig gelernt werden. Betrifft rund 25 Prozent der Grammatikfragen.
  Fasst nie Antwortoptionen an
- **Themensteuerung**: `classifyTopic()` ordnet jede Grammatikfrage genau einem von 11 Themen zu.
  Vier richtige in Folge heisst "sitzt". Gemeisterte Themen verschwinden nicht, sondern kommen
  mit wachsendem Abstand als Auffrischung zurück (`topicGap`). Schwache Themen dreifach gewichtet.
  `balancedDraw()` sorgt dafür, dass eine 25er-Runde 9 bis 13 verschiedene Themen abdeckt.
  Persistiert als `aptis-topics-v1`
- **Fehlerdiagnose**: `diagnoseError()` mit 13 Mustern (would im if-Teil, Inversion ohne
  Hilfsverb, fehlendes have, Einzahl/Mehrzahl, few/little, mustn't-Falle und so weiter).
  Dazu eine Anfängerbox pro Thema und ein KI-Knopf gegen `api.anthropic.com/v1/messages`
  mit `claude-sonnet-4-6`

### Simulationsmodi

`startSim(mode)` kennt: `grammar`, `vocab`, `mixed`, `topic`, Teilmodi `wp` `def` `usage` `coll`
`wform`, `reading` (ein Task), `readingfull` (kompletter Test, 25 Items, 60 Min.),
`match` (5 Zuordnungen), `matchexam` (10 Zuordnungen, 50 Items, 25 Min.),
`core` (25 Grammatik plus 5 Zuordnungen mit Sofort-Feedback),
`exam` (dasselbe als echte Prüfung ohne Zwischenlösungen), `retry` (nur die eigenen Fehler).

Nach jeder Runde: Auswertung mit Themenanalyse, Prioritätenliste mit Direktstart-Knöpfen,
Knopf "Nur meine Fehler nochmals üben" und Lernblatt als PDF (`buildSeriesReport`,
`downloadSheet`, eigenes Druck-CSS). Lernserien über 3, 5, 10 oder 20 Runden sammeln
alle Fehler und erzeugen am Ende ein gemeinsames Lernblatt.

## Build- und Prüfworkflow

**Keine Buildkette.** Änderungen werden mit einem Python-Splice gemacht, der exakte
String-Anker verwendet und vor dem Schreiben asserted:

```python
old = "<exakter Anker>"
assert old in h, "Anker fehlt"
h = h.replace(old, neu, 1)
```

Escaping-Falle in quoted Heredocs: `\'` einfach schreiben, nie `\\'`.

**Automatisierte Tests (T-0001), im Ordner `english-c1`:**

| Befehl | Tier | Inhalt | Dauer |
|---|---|---|---|
| `npm run test:t1` | 1 | Syntax, div Bilanz aller Tabs, reine Funktionen | unter 1 Sek. |
| `npm run test:t2` | 2 | Datenintegrität aller Pools | unter 1 Sek. |
| `npm run test:t3` | 3 | Playwright, alle Tabs ohne JavaScript Fehler | rund 2 Sek. |
| `npm test` | 1 und 2 | vor jedem Commit | |

Der Loader `tests/lib/portal.js` führt den Scriptblock in `node:vm` aus. Pools und Funktionen
holt man mit `loadPortal().get('grammarPool')`. Keine externen Pakete nötig.

**Manuelle Validierung (ersetzt durch die Tests oben, Reihenfolge bleibt gleich):**

1. Letzten `<script>`-Block per Regex extrahieren, in `check-N.js` schreiben, `node --check`
2. Smoke-Test: Pools mit einem Klammer-Parser aus der Datei greifen und als `var` inlinen,
   nicht `const` oder `let`, sonst Scope-Probleme. Assertions gehören **in** den eval-String
3. div-Bilanz des betroffenen Panels prüfen (`<div` gegen `</div>`)

Reading- und Matching-Arrays werden mit `json.dumps(..., ensure_ascii=False)` erzeugt.

## Bekannte Lücken und nächste Schritte

1. **Speaking ausbauen.** Das ist die Priorität. Aktuell nur Grundlagen im Tab.
   Gebraucht: Aufgaben mit echtem Timer für alle drei Teile (45 Sek., 2 Min. plus
   1 Min. Vorbereitung, 1,5 Min. plus Nachfrage), Aufbauvorlagen, C1-Phrasenbank,
   Selbstcheckliste nach den offiziellen Kriterien, idealerweise Aufnahme und KI-Feedback
2. **Listening** hat Strategien, aber keine eigenen Übungsfragen
3. Reading Teil 3 und 4: Nur Test I nutzt das offizielle Phrasenformat.
   Tests A bis H haben Einzelwort-Optionen, das ist eher Aptis General
4. Rekonstruierte Inhalte (nicht aus dem Buch): Reading-Tests E bis H teilweise,
   Dark Matter, Bilingual Brain, Fast Fashion. Beim Weiterbauen weiter transparent halten

## Offizielle Quellen

- Übungstests und Answer Keys: britishcouncil.org/exam/english/aptis/prepare-advanced
- Scoring und Cut Scores: britishcouncil.org/sites/default/files/aptis_scoring_system_v2.0.pdf
- Anmeldung Milano: britishcouncil.it/en/exam/aptis-esol/book, 140 Euro,
  Via Borgospesso 11, Kontakt esami@britishcouncil.it
