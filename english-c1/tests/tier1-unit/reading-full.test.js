'use strict';
// Kompletter Reading Test nutzt nie Übungsvarianten (T-0005).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal } = require('../lib/portal');
const { parseReadingTitle } = require('../lib/reading');

const portal = loadPortal();
const texts = portal.get('readingTexts');
const build = portal.get('buildFullReading');

test('buildFullReading: nur Prüfungstasks, je ein Task 1 bis 4', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const items = build();
    const parts = [...new Set(items.map((q) => q.p))].map((p) => texts[p]);
    assert.ok(parts.every((t) => !t.practice), 'Übungsvariante im kompletten Test');
    const parsed = parts.map((t) => parseReadingTitle(t.title));
    assert.deepEqual(parsed.map((x) => x.task).sort(), [1, 2, 3, 4]);
    assert.equal(new Set(parsed.map((x) => x.letter)).size, 1, 'Tasks aus verschiedenen Tests');
    seen.add(parsed[0].letter);
  }
  assert.ok(seen.size >= 5, `nur ${seen.size} Tests gezogen`);
});
