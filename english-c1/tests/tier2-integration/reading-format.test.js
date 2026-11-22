'use strict';
// Struktur der Reading Tests und Phrasenformat in Task 3 und 4 (T-0005).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal } = require('../lib/portal');
const { parseReadingTitle } = require('../lib/reading');

const portal = loadPortal();
const texts = portal.get('readingTexts');
const exam = texts.filter((t) => !t.practice);
const letter = (t) => parseReadingTitle(t.title).letter;
const task = (t) => parseReadingTitle(t.title).task;

test('jeder Test hat genau einen Prüfungstask 1 bis 4', () => {
  const letters = [...new Set(texts.map(letter))];
  assert.ok(letters.length >= 9);
  for (const L of letters) {
    const tasks = [...exam.filter((t) => letter(t) === L).map(task)].sort(); // Spread: Array aus dem vm Kontext
    assert.deepEqual(tasks, [1, 2, 3, 4], `Test ${L}`);
  }
});

test('Übungsvarianten sind nur alte Task 3 und 4', () => {
  for (const t of texts.filter((x) => x.practice)) assert.ok([3, 4].includes(task(t)), t.title);
});

test('Task 3 und 4 im Prüfungsformat: Phrasen, Lückenzahl, Nummern im Text', () => {
  for (const t of exam.filter((x) => task(x) >= 3)) {
    assert.equal(t.qs.length, task(t) === 3 ? 5 : 6, t.title);
    t.qs.forEach((q, i) => {
      assert.ok(t.text.includes(`(${i + 1}) ___`), `${t.title}: Lücke ${i + 1} fehlt im Text`);
      const multi = q.a.filter((o) => o.trim().split(/\s+/).length >= 2).length;
      assert.ok(multi >= 2, `${t.title} Lücke ${i + 1}: keine Phrasen ${JSON.stringify(q.a)}`);
    });
  }
});

test('Task 3 und 4 jedes Tests verteilen die Lösung auf alle drei Positionen', () => {
  for (const L of new Set(exam.map(letter))) {
    const pos = new Set(exam.filter((t) => letter(t) === L && task(t) >= 3).flatMap((t) => t.qs.map((q) => q.c)));
    assert.equal(pos.size, 3, `Test ${L}: Lösung nur an Position ${[...pos]}`);
  }
});
