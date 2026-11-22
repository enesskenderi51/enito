'use strict';
// Kritischer Pfad im echten Browser: Seite lädt, alle Tabs öffnen ohne JavaScript Fehler.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readHtml, panelIds } = require('../lib/portal');
const { usePortalBrowser } = require('../lib/browser');

const openPortal = usePortalBrowser();

test('alle Tabs öffnen ohne JavaScript Fehler', async () => {
  const { page, errors } = await openPortal();
  for (const id of panelIds(readHtml())) {
    await page.click(`button[data-panel="${id}"]`);
    assert.ok(await page.isVisible(`#${id}`), `${id} nicht sichtbar`);
  }
  assert.deepEqual(errors, []);
});
