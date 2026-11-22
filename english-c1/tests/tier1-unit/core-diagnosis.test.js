'use strict';
// Core Diagnose: Prognose und Hebelliste als reine Funktionen (T-0004).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal, toHost } = require('../lib/portal');

const portal = loadPortal();
const coreScaled = portal.get('coreScaled');
const appendCoreRun = portal.get('appendCoreRun');
const coreForecast = portal.get('coreForecast');
const laplaceAccuracy = portal.get('laplaceAccuracy');
const leverageList = portal.get('leverageList');

test('coreScaled rechnet auf 0 bis 50 um', () => {
  assert.equal(coreScaled(39, 50), 39);
  assert.equal(coreScaled(20, 25), 40);
  assert.equal(coreScaled(0, 0), 0);
});

test('appendCoreRun hängt an, kürzt von vorne und verändert die Eingabe nicht', () => {
  const h = [{ points: 1 }, { points: 2 }, { points: 3 }];
  const out = toHost(appendCoreRun(h, { points: 4 }, 3));
  assert.deepEqual(out.map((r) => r.points), [2, 3, 4]);
  assert.equal(h.length, 3);
});

test('coreForecast: Mittel der letzten drei, Abstand zu 44, Verlauf der letzten fünf', () => {
  assert.equal(coreForecast([]), null);
  const runs = [30, 35, 38, 40, 42, 44].map((points) => ({ points }));
  const f = toHost(coreForecast(runs));
  assert.equal(f.avg, 42);
  assert.equal(f.gap, 2);
  assert.equal(f.n, 3);
  assert.deepEqual(f.recent, [35, 38, 40, 42, 44]);
  assert.equal(toHost(coreForecast([{ points: 46 }])).gap, 0);
});

test('laplaceAccuracy glättet wenige Antworten', () => {
  assert.equal(laplaceAccuracy(undefined), 0.5);
  assert.equal(laplaceAccuracy({ c: 1, seen: 1 }), 2 / 3);
  assert.equal(laplaceAccuracy({ c: 9, seen: 10 }), 10 / 12);
});

test('leverageList sortiert nach möglichem Punktgewinn', () => {
  const shares = { Inversion: 0.05, Zeitformen: 0.1, Collocation: 0.3 };
  const stats = {
    Inversion: { c: 0, seen: 8 },      // schwach, aber kleiner Anteil
    Zeitformen: { c: 18, seen: 18 },   // sitzt
    Collocation: { c: 10, seen: 20 },  // mittel, grosser Anteil
  };
  const list = toHost(leverageList(stats, shares, 2));
  assert.deepEqual(list.map((x) => x.label), ['Collocation', 'Inversion']);
  assert.equal(list[0].gain, Math.round(0.3 * 50 * (1 - 11 / 22) * 10) / 10);
  assert.deepEqual([list[0].c, list[0].seen], [10, 20]);
});

test('recordCoreRun speichert nur Core und Exam Runden', () => {
  const record = portal.get('recordCoreRun');
  const before = portal.get('coreHistory').length;
  record('grammar', 20, 25);
  assert.equal(portal.get('coreHistory').length, before);
  record('exam', 41, 50);
  const h = toHost(portal.get('coreHistory'));
  assert.equal(h.length, before + 1);
  assert.deepEqual([h.at(-1).mode, h.at(-1).points], ['exam', 41]);
});
