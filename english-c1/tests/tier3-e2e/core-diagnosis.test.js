'use strict';
// Core Diagnose im Plan Tab mit vorbelegtem Speicher (T-0004).
const test = require('node:test');
const assert = require('node:assert/strict');
const { usePortalBrowser } = require('../lib/browser');

const openPortal = usePortalBrowser();

// window.storage wie im Claude Artifact, vorbelegt mit Core Runden und Themenwerten.
function fakeStorage() {
  const data = {
    'aptis-core-history-v1': JSON.stringify([30, 36, 38, 40, 41].map((points) => ({ date: '2026-11-01', mode: 'exam', points }))),
    'aptis-topics-v1': JSON.stringify({ Collocation: { c: 5, seen: 20, streak: 0 } }),
  };
  window.storage = {
    get: async (k) => (k in data ? { value: data[k] } : null),
    set: async (k, v) => { data[k] = v; },
  };
}

test('Prognose, Abstand zu C1 und Hebelliste', async () => {
  const { page, errors } = await openPortal({ initScript: fakeStorage, panel: 'p-plan' });
  await page.waitForFunction(() => document.getElementById('coreDiag').textContent.includes('Prognose'));
  const text = await page.textContent('#coreDiag');
  assert.match(text, /Prognose: 40 von 50/);
  assert.match(text, /fehlen 4 Punkte/);
  assert.match(text, /Verlauf: 30 · 36 · 38 · 40 · 41/);
  assert.equal(await page.locator('#coreDiag [data-corelabel]').count(), 5);
  assert.match(await page.textContent('#coreDiag tr:nth-child(2) td'), /Collocation/);
  assert.match(text, /25 % \(5\/20\)/);
  assert.deepEqual(errors, []);
});

test('ohne Daten: Aufforderung, Hebel startet eine Übung', async () => {
  const { page, errors } = await openPortal({ panel: 'p-plan' });
  assert.match(await page.textContent('#coreDiag'), /Noch keine Core Runde/);
  await page.click('#coreDiag [data-corelabel] >> nth=0');
  assert.ok(await page.isVisible('#p-sim'));
  assert.deepEqual(errors, []);
});
