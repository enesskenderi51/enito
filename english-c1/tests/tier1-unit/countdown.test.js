'use strict';
// Countdown mit simuliertem Taktgeber (T-0009).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal, readHtml, extractScript } = require('../lib/portal');

const portal = loadPortal();
const Countdown = portal.get('Countdown');

function fakeScheduler() {
  const s = { fn: null, cleared: 0, set(fn) { s.fn = fn; return 1; }, clear() { s.fn = null; s.cleared++; } };
  return s;
}

test('Countdown zeigt Zeit, warnt vor dem Ende und meldet das Ende einmal', () => {
  const el = { textContent: '', className: '' };
  let done = 0;
  const sched = fakeScheduler();
  const c = new Countdown(el, { base: 'timer-display', warnAt: 2, onDone: () => done++ }, sched);
  c.start(4);
  assert.deepEqual([el.textContent, el.className], ['0:04', 'timer-display']);
  sched.fn(); sched.fn();
  assert.deepEqual([el.textContent, el.className], ['0:02', 'timer-display warn']);
  sched.fn(); sched.fn();
  assert.deepEqual([el.textContent, el.className, done, sched.fn], ['0:00', 'timer-display done', 1, null]);
});

test('Countdown: Neustart setzt zurück, reset hält an und setzt die Anzeige', () => {
  const el = { textContent: '', className: '' };
  const sched = fakeScheduler();
  const c = new Countdown(el, { base: 'sim-timer', warnAt: 60 }, sched);
  c.start(120); sched.fn();
  c.start(90);
  assert.equal(el.textContent, '1:30');
  assert.equal(sched.cleared, 1);
  c.reset('0:00');
  assert.equal(sched.fn, null);
  assert.deepEqual([el.textContent, el.className], ['0:00', 'sim-timer']);
});

test('die drei einfachen Timer nutzen Countdown statt eigener Intervalle', () => {
  const js = extractScript(readHtml());
  for (const v of ['wInt', 'timerInt', 'simInt']) assert.ok(!new RegExp(`\\b${v}\\b`).test(js), `${v} noch vorhanden`);
});
