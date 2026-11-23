'use strict';
// Umgestellte Timer im Browser mit simulierter Uhr (T-0009).
const test = require('node:test');
const assert = require('node:assert/strict');
const { usePortalBrowser } = require('../lib/browser');

const openPortal = usePortalBrowser();

test('Writing Timer: läuft, warnt, stoppt', async () => {
  const { page, errors } = await openPortal({ fakeClock: true, panel: 'p-writing' });
  await page.click('#wStart');
  assert.equal(await page.textContent('#wTimer'), '45:00');
  await page.clock.runFor(40 * 60 * 1000 + 1000);
  assert.equal(await page.textContent('#wTimer'), '4:59');
  assert.equal(await page.getAttribute('#wTimer', 'class'), 'timer-display warn');
  await page.click('#wStop');
  assert.equal(await page.textContent('#wTimer'), '45:00');
  assert.deepEqual(errors, []);
});

test('freier Speaking Timer: Ende mit Hinweis', async () => {
  const { page, errors } = await openPortal({ fakeClock: true, panel: 'p-speaking' });
  await page.click('#p-speaking [data-timer="45"]');
  await page.clock.runFor(45_000);
  assert.equal(await page.textContent('#timerDisplay'), '0:00');
  assert.equal(await page.getAttribute('#timerDisplay', 'class'), 'timer-display done');
  assert.equal(await page.textContent('#timerPhase'), 'Zeit abgelaufen!');
  assert.deepEqual(errors, []);
});
