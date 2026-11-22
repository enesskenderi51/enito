'use strict';
// Speaking Trainer im echten Browser, mit simulierter Uhr (T-0002).
const test = require('node:test');
const assert = require('node:assert/strict');
const { usePortalBrowser } = require('../lib/browser');

const openPortal = usePortalBrowser();

async function openSpeaking() {
  const opened = await openPortal({ fakeClock: true });
  await opened.page.click('button[data-panel="p-speaking"]');
  return opened;
}

test('komplette Prüfung bis zur Selbstcheckliste durchklicken', async () => {
  const { page, errors } = await openSpeaking();
  await page.click('[data-spmode="full"]');
  assert.match(await page.textContent('#spPart'), /Teil 1: Fotovergleich · Etappe 1 von 6/);
  assert.match(await page.textContent('#spPrompt'), /Foto A/);
  assert.equal(await page.textContent('#spCount'), '0:45');
  await page.click('#spNext');
  assert.doesNotMatch(await page.textContent('#spPrompt'), /Foto A/);
  // restliche 2 x Teil 1, Teil 2 Vorbereitung und Sprechen, Teil 3 Vorbereitung und Sprechen, Nachfrage
  for (let i = 0; i < 7; i++) await page.click('#spNext');
  assert.ok(await page.isVisible('#spDone'));
  assert.ok((await page.locator('#spCheckDone input[type=checkbox]').count()) >= 12);
  assert.deepEqual(errors, []);
});

test('Teil 2: Vorbereitung läuft ab und geht automatisch ins Sprechen über', async () => {
  const { page, errors } = await openSpeaking();
  await page.click('[data-spmode="part2"]');
  assert.equal(await page.textContent('#spPhase'), 'Vorbereitung');
  assert.equal(await page.textContent('#spCount'), '1:00');
  await page.clock.runFor(60_000);
  assert.equal(await page.textContent('#spPhase'), 'Sprechen');
  assert.equal(await page.textContent('#spCount'), '2:00');
  await page.clock.runFor(120_000);
  assert.ok(await page.isVisible('#spDone'));
  await page.click('#spAbort');
  assert.ok(!(await page.isVisible('#spArea')));
  assert.deepEqual(errors, []);
});
