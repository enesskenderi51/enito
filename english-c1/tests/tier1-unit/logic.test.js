'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal } = require('../lib/portal');

const portal = loadPortal();
const sample = { t: 'Grammar', g: 0, q: 'If I ___ known, I would have come.', a: ['had', 'have', 'would'], c: 0, e: '' };

test('qid ist deterministisch und unterscheidet Fragen', () => {
  const qid = portal.get('qid');
  assert.equal(qid(sample), qid({ ...sample }));
  assert.notEqual(qid(sample), qid({ ...sample, q: sample.q + ' ' }));
});

test('weightOf folgt max(0.002, 0.65^mastery)', () => {
  const qid = portal.get('qid');
  const mastery = portal.get('mastery');
  const weightOf = portal.get('weightOf');
  const id = qid(sample);
  for (const m of [0, 1, 3, 20]) {
    mastery[id] = m;
    assert.equal(weightOf(sample), Math.max(0.002, Math.pow(0.65, m)));
  }
  delete mastery[id];
});

test('varyText verändert nie die Antwortoptionen', () => {
  const varyText = portal.get('varyText');
  for (const q of portal.get('grammarPool')) {
    const before = JSON.stringify(q.a);
    const varied = varyText(q);
    assert.equal(typeof varied, 'string');
    assert.equal(JSON.stringify(q.a), before);
  }
});

test('classifyTopic liefert für jede Grammatikfrage ein bekanntes Thema', () => {
  const labels = new Set(portal.get('TOPIC_LABELS'));
  const classifyTopic = portal.get('classifyTopic');
  for (const q of portal.get('grammarPool')) assert.ok(labels.has(classifyTopic(q)), q.q);
});
