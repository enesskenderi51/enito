'use strict';
// Writing Tests im Browser: Wechsel, Namen, Musterantworten, Rückfrage bei eigenem Text (T-0007).
const test = require('node:test');
const assert = require('node:assert/strict');
const { usePortalBrowser } = require('../lib/browser');

const openPortal = usePortalBrowser();

test('Testwechsel passt Aufgabe, Namen und Musterantworten an', async () => {
  const { page, errors } = await openPortal({ panel: 'p-writing' });
  assert.match(await page.textContent('#wSetTitle'), /Writing Test 1 von \d+/);
  assert.match(await page.textContent('#wP1'), /Laura/);
  await page.selectOption('#wSetSel', '1');
  assert.match(await page.textContent('#wSetTitle'), /Writing Test 2/);
  const names = await page.$$eval('#p-writing .wname', (els) => els.map((e) => e.textContent));
  assert.deepEqual(names, ['Tom', 'Nadia', 'Ben']);
  await page.click('[data-model="m2"]');
  assert.ok(await page.isVisible('#m2'));
  assert.match(await page.textContent('#m2'), /Musterantwort \(\d+ Wörter\)/);
  assert.deepEqual(errors, []);
});

test('eigener Text: Rückfrage vor dem Wechsel, Abbrechen behält Test und Text', async () => {
  const { page, errors } = await openPortal({ panel: 'p-writing' });
  await page.fill('#w2', 'Dear Sir or Madam, I am writing to complain.');
  page.once('dialog', (d) => d.dismiss());
  await page.click('#wNewSet');
  assert.match(await page.textContent('#wSetTitle'), /Writing Test 1/);
  assert.equal(await page.inputValue('#w2'), 'Dear Sir or Madam, I am writing to complain.');
  page.once('dialog', (d) => d.accept());
  await page.click('#wNewSet');
  assert.doesNotMatch(await page.textContent('#wSetTitle'), /Writing Test 1 /);
  assert.equal(await page.inputValue('#w2'), '');
  assert.equal(await page.textContent('#w2-wc'), '0 Wörter');
  assert.deepEqual(errors, []);
});
