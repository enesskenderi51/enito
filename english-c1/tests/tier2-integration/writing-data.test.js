'use strict';
// Writing Tests: Struktur, Wortlimits und Register der Musterantworten (T-0007).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal } = require('../lib/portal');
const { nonEmpty } = require('../lib/assertions');

const portal = loadPortal();
const tests = portal.get('writingTests');
const countWords = portal.get('countWords');
const LIMITS = portal.get('WRITING_LIMITS');
const CONTRACTION = /\b\w+(n't|'m|'re|'ve|'ll|'d)\b/i;

function inRange(text, part, where) {
  const n = countWords(text);
  const [min, max] = LIMITS[part];
  assert.ok(n >= min && n <= max, `${where}: ${n} Wörter statt ${min} bis ${max}`);
}

test('mindestens 5 Tests mit eindeutigen IDs', () => {
  assert.ok(tests.length >= 5);
  assert.equal(new Set(tests.map((t) => t.id)).size, tests.length);
});

test('Teil 1: drei Nachrichten, informelle Musterantworten im Limit', () => {
  for (const t of tests) {
    assert.equal(t.part1.members.length, 3, t.id);
    for (const m of t.part1.members) {
      assert.ok(nonEmpty(m.name) && nonEmpty(m.msg), `${t.id}: Nachricht`);
      inRange(m.model, '1', `${t.id} an ${m.name}`);
      assert.match(m.model, CONTRACTION, `${t.id} an ${m.name}: keine Kurzform`);
    }
  }
});

test('Teil 2: E-Mail, Notizen, formelle Musterantwort ohne Kurzformen', () => {
  for (const t of tests) {
    const p = t.part2;
    assert.ok(nonEmpty(p.sender) && nonEmpty(p.email) && p.notes.length >= 3, t.id);
    inRange(p.model, '2', `${t.id} E-Mail`);
    assert.match(p.model, /^Dear /, `${t.id}: Anrede`);
    assert.match(p.model, /Yours (faithfully|sincerely),/, `${t.id}: Grussformel`);
    assert.doesNotMatch(p.model, CONTRACTION, `${t.id}: Kurzform in formeller E-Mail`);
  }
});

test('Teil 3: Artikel mit Titel, im Limit, alle Zahlen aus den Notes verarbeitet', () => {
  for (const t of tests) {
    const p = t.part3;
    assert.ok(nonEmpty(p.site) && nonEmpty(p.topic) && nonEmpty(p.title) && p.notes.length >= 4, t.id);
    inRange(p.model, '3', `${t.id} Artikel`);
    const numbers = p.notes.join(' ').match(/\d+(?:\.\d+)?/g) || [];
    assert.ok(numbers.length >= 3, `${t.id}: zu wenig Zahlen in den Notes`);
    for (const n of numbers) assert.ok(p.model.includes(n), `${t.id}: Zahl ${n} fehlt im Artikel`);
  }
});
