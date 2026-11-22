'use strict';
// Kritischer Pfad im echten Browser: Seite lädt, alle Tabs öffnen ohne JavaScript Fehler.
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { HTML_PATH, readHtml, panelIds } = require('../lib/portal');

test('alle Tabs öffnen ohne JavaScript Fehler', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route(/^https?:/, (route) => route.abort()); // keine externen Requests
    await page.goto(pathToFileURL(HTML_PATH).href);
    for (const id of panelIds(readHtml())) {
      await page.click(`button[data-panel="${id}"]`);
      assert.ok(await page.isVisible(`#${id}`), `${id} nicht sichtbar`);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
