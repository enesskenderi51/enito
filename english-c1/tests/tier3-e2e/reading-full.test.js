'use strict';
// Kompletter Reading Test im Browser (T-0005).
const test = require('node:test');
const assert = require('node:assert/strict');
const { usePortalBrowser } = require('../lib/browser');

const openPortal = usePortalBrowser();

test('kompletter Reading Test startet und zeigt Fragen ohne Fehler', async () => {
  const { page, errors } = await openPortal({ panel: 'p-sim' });
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => startSim('readingfull'));
    const count = await page.evaluate(() => simQs.length);
    assert.ok(count >= 20, `nur ${count} Fragen`);
    const practice = await page.evaluate(() => simQs.some((q) => q.p !== undefined && readingTexts[q.p].practice));
    assert.equal(practice, false);
  }
  assert.ok(await page.isVisible('#simOpts button'));
  assert.deepEqual(errors, []);
});
