'use strict';
// Speaking Trainer: reine Logik ohne DOM und ohne Uhr (T-0002).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal, toHost } = require('../lib/portal');

const portal = loadPortal();
const fmtClock = portal.get('fmtClock');
const ShuffleBag = portal.get('ShuffleBag');
const buildSpeakingPlan = portal.get('buildSpeakingPlan');
const SpeakingSession = portal.get('SpeakingSession');

const tasks = {
  part1: { id: 'p1', photos: ['A', 'B'], qs: ['q1', 'q2', 'q3'] },
  part2: { id: 'p2', theme: 'Trust', qs: ['a', 'b', 'c'] },
  part3: { id: 'p3', topic: 'T', pro: ['1', '2', '3'], con: ['4', '5', '6'], followUp: 'f' },
};

test('fmtClock formatiert Minuten und Sekunden', () => {
  assert.equal(fmtClock(0), '0:00');
  assert.equal(fmtClock(45), '0:45');
  assert.equal(fmtClock(90), '1:30');
  assert.equal(fmtClock(120), '2:00');
  assert.equal(fmtClock(-3), '0:00');
});

test('ShuffleBag zieht jeden Index genau einmal pro Runde', () => {
  const bag = new ShuffleBag(8);
  for (let round = 0; round < 3; round++) {
    const seen = new Set();
    for (let i = 0; i < 8; i++) seen.add(bag.next());
    assert.equal(seen.size, 8);
  }
});

test('ShuffleBag wiederholt beim Nachfüllen nie den letzten Index', () => {
  for (let s = 0; s < 200; s++) {
    const bag = new ShuffleBag(3);
    let last = -1;
    for (let i = 0; i < 30; i++) {
      const v = bag.next();
      assert.notEqual(v, last);
      last = v;
    }
  }
});

test('Etappenplan der kompletten Prüfung hat die offiziellen Zeiten', () => {
  const plan = toHost(buildSpeakingPlan('full', tasks));
  assert.deepEqual(plan.map((s) => [s.part, s.kind, s.prep, s.speak]), [
    [1, 'photo', 0, 45], [1, 'photo', 0, 45], [1, 'photo', 0, 45],
    [2, 'topic', 60, 120],
    [3, 'present', 60, 90], [3, 'followup', 0, 45],
  ]);
  assert.deepEqual(plan.slice(0, 3).map((s) => s.question), ['q1', 'q2', 'q3']);
  assert.deepEqual(plan.map((s) => !!s.showPhotos), [true, false, false, false, false, false]);
});

test('Etappenplan für einzelne Teile', () => {
  assert.equal(buildSpeakingPlan('part1', tasks).length, 3);
  assert.deepEqual(toHost(buildSpeakingPlan('part2', tasks).map((s) => s.part)), [2]);
  assert.deepEqual(toHost(buildSpeakingPlan('part3', tasks).map((s) => s.kind)), ['present', 'followup']);
  assert.throws(() => buildSpeakingPlan('nope', tasks));
});

function session(mode) {
  const changes = [];
  const s = new SpeakingSession(buildSpeakingPlan(mode, tasks), (x, newStage) => changes.push(x.state + (newStage ? '*' : '')));
  return { s, changes };
}

test('Session: Vorbereitung geht automatisch ins Sprechen, dann in die nächste Etappe', () => {
  const { s } = session('part3');
  assert.equal(s.state, 'idle');
  s.start();
  assert.deepEqual([s.state, s.index, s.remaining], ['prep', 0, 60]);
  s.tick(59);
  assert.deepEqual([s.state, s.remaining], ['prep', 1]);
  s.tick(1);
  assert.deepEqual([s.state, s.remaining], ['speak', 90]);
  s.tick(90);
  assert.deepEqual([s.state, s.index, s.remaining], ['speak', 1, 45]); // Nachfrage ohne Vorbereitung
  s.tick(45);
  assert.equal(s.state, 'done');
  s.tick(10);
  assert.equal(s.state, 'done');
});

test('Session: Weiter überspringt die Vorbereitung bzw. die Etappe', () => {
  const { s } = session('full');
  s.start();
  assert.deepEqual([s.state, s.index], ['speak', 0]);
  s.next(); s.next(); s.next();
  assert.deepEqual([s.state, s.index, s.current.part], ['prep', 3, 2]);
  s.next();
  assert.deepEqual([s.state, s.index], ['speak', 3]);
});

test('Session: Abbrechen geht zurück auf idle, tick ist dort wirkungslos', () => {
  const { s, changes } = session('part2');
  s.start();
  s.abort();
  assert.equal(s.state, 'idle');
  s.tick(5);
  assert.equal(s.state, 'idle');
  assert.deepEqual(changes, ['prep*', 'idle']);
});

test('Session: unerlaubte Übergänge werfen', () => {
  const { s } = session('part2');
  assert.throws(() => s.next(), /idle/);
});
