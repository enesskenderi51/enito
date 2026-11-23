'use strict';
// Writing: Aufgabenbeschreibung für die KI aus den Testdaten (T-0007).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal } = require('../lib/portal');

const portal = loadPortal();
const describe = portal.get('writingTaskDescription');
const countWords = portal.get('countWords');

const sample = {
  id: 'x', title: 'T',
  part1: { members: [{ name: 'Ann', msg: 'Hi?', model: 'a' }, { name: 'Bo', msg: 'Yo?', model: 'b' }, { name: 'Cy', msg: 'Hey?', model: 'c' }] },
  part2: { sender: 'the council', email: 'Road closed.', notes: ['feelings', 'impact'], model: 'Dear', tips: '' },
  part3: { site: 'Site', topic: 'Topic', notes: ['2015: 18 percent'], title: 'T', model: 'm', tips: '' },
};

test('writingTaskDescription enthält Teil, Limits und den Aufgabeninhalt', () => {
  const d1 = describe(sample, '1');
  assert.match(d1, /Teil 1/);
  assert.match(d1, /30 bis 40/);
  for (const m of sample.part1.members) assert.ok(d1.includes(`${m.name}: "${m.msg}"`));
  const d2 = describe(sample, '2');
  assert.match(d2, /120 bis 150/);
  assert.ok(d2.includes('Road closed.') && d2.includes('feelings; impact'));
  const d3 = describe(sample, '3');
  assert.match(d3, /180 bis 220/);
  assert.ok(d3.includes('Topic') && d3.includes('2015: 18 percent'));
  assert.throws(() => describe(sample, '4'));
});

test('countWords zählt Wörter auch über Absätze', () => {
  assert.equal(countWords('One two.\n\nThree'), 3);
  assert.equal(countWords('   '), 0);
});

test('Wortgrenzen haben genau eine Quelle: WRITING_LIMITS', () => {
  const { readHtml } = require('../lib/portal');
  const html = readHtml();
  const limits = portal.get('WRITING_LIMITS');
  const parts = [...html.matchAll(/<textarea id="w\w+" data-part="(\d)"/g)].map((m) => m[1]);
  assert.deepEqual(parts, ['1', '1', '1', '2', '3']);
  for (const p of parts) assert.ok(limits[p], `Teil ${p} ohne Grenzen`);
  assert.ok(!/data-min=|Ziel: \d/.test(html), 'Grenzen fest im HTML');
});

test('ShuffleBag.nextExcept liefert nie den ausgeschlossenen Index', () => {
  const bag = new (portal.get('ShuffleBag'))(5);
  for (let i = 0; i < 200; i++) assert.notEqual(bag.nextExcept(2), 2);
});
