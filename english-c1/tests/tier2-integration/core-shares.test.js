'use strict';
// Anteile am Core über die echten Pools (T-0004).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal } = require('../lib/portal');

const portal = loadPortal();
portal.get('assignTopics')();
const shares = portal.get('coreShares')();

test('Anteile summieren sich zu 1, je die Hälfte Grammatik und Vokabeln', () => {
  const topics = portal.get('TOPIC_LABELS');
  const sum = (keys) => keys.reduce((s, k) => s + (shares[k] || 0), 0);
  assert.ok(Math.abs(sum(Object.keys(shares)) - 1) < 1e-9);
  assert.ok(Math.abs(sum(topics) - 0.5) < 1e-9);
});

test('jeder Vokabeltyp und jedes genutzte Grammatikthema hat einen Anteil', () => {
  for (const t of ['Word Pair', 'Definition', 'Usage', 'Collocation', 'Word Formation']) assert.ok(shares[t] > 0, t);
  const used = new Set(portal.get('grammarPool').map((q) => portal.get('classifyTopic')(q)));
  for (const l of used) assert.ok(shares[l] > 0, l);
});

test('Hebelliste über echte Daten: 5 Einträge, jeder lässt sich starten', () => {
  const list = portal.get('leverageList')({}, shares, 5);
  assert.equal(list.length, 5);
  const topics = new Set(portal.get('TOPIC_LABELS'));
  const vocabKeys = portal.get('vocabPartKey');
  for (const x of list) assert.ok(topics.has(x.label) || vocabKeys[x.label], x.label);
});
