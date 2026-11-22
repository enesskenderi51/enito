'use strict';
// Datenintegrität aller Pools. Mindestmengen laut CLAUDE.md, Stand 22.11.2026.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal } = require('../lib/portal');
const { checkChoice } = require('../lib/assertions');
const { parseReadingTitle } = require('../lib/reading');

const portal = loadPortal();
const VOCAB_TYPES = new Set(['Word Pair', 'Definition', 'Usage', 'Collocation', 'Word Formation']);
// Optionen pro Reading Tasktyp. Opinion Matching hat vier Personen (A bis D).
const READING_OPTIONS = { 'Opinion Matching': 4 };

test('Mindestmengen laut CLAUDE.md', () => {
  const min = { grammarPool: 648, vocabPool: 1011, readingTexts: 36, matchTasks: 84, words: 187, readingWords: 56 };
  for (const [name, n] of Object.entries(min)) assert.ok(portal.get(name).length >= n, `${name} < ${n}`);
});

test('grammarPool: Format und Themenindex', () => {
  const topics = portal.get('TOPIC_LABELS').length;
  portal.get('grammarPool').forEach((q, i) => {
    checkChoice(q, `grammarPool[${i}]`);
    assert.equal(q.t, 'Grammar');
    assert.ok(Number.isInteger(q.g) && q.g >= 0 && q.g < topics, `grammarPool[${i}]: g ungültig`);
  });
});

test('vocabPool: Format und Typ', () => {
  portal.get('vocabPool').forEach((q, i) => {
    checkChoice(q, `vocabPool[${i}]`);
    assert.ok(VOCAB_TYPES.has(q.t), `vocabPool[${i}]: Typ ${q.t}`);
  });
});

test('readingTexts: bindendes Titelformat und Fragen', () => {
  portal.get('readingTexts').forEach((r, i) => {
    const parsed = parseReadingTitle(r.title);
    assert.ok(parsed, `readingTexts[${i}]: Titelformat ${r.title}`);
    assert.ok(r.text && r.qs.length > 0, `readingTexts[${i}]: Text oder Fragen fehlen`);
    const optionCount = READING_OPTIONS[parsed.type] ?? 3;
    r.qs.forEach((q, j) => checkChoice(q, `readingTexts[${i}].qs[${j}]`, { options: optionCount }));
  });
});

test('matchTasks: 5 Items, Wortkasten aus genau 10 eindeutigen Wörtern', () => {
  portal.get('matchTasks').forEach((m, i) => {
    assert.equal(m.items.length, 5, `matchTasks[${i}]: Items`);
    assert.equal(m.dist.length, 5, `matchTasks[${i}]: Ablenker`);
    const box = [...m.items.map((x) => x.a), ...m.dist].map((w) => String(w).trim().toLowerCase());
    assert.equal(new Set(box).size, 10, `matchTasks[${i}] (${m.theme}): ${JSON.stringify(box)}`);
  });
});

test('Karteikarten vollständig', () => {
  for (const name of ['words', 'readingWords']) {
    portal.get(name).forEach((k, i) => {
      for (const f of ['w', 'd']) assert.ok(k[f] && String(k[f]).trim(), `${name}[${i}].${f} fehlt`);
    });
  }
});
