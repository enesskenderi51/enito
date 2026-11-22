'use strict';
// Gemeinsames Setup für Tier 3: ein Browser pro Testdatei, ein frischer Kontext pro Test.
const { before, after } = require('node:test');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { HTML_PATH } = require('./portal');

function usePortalBrowser() {
  let browser;
  before(async () => { browser = await chromium.launch(); });
  after(async () => { await browser.close(); });

  // Öffnet das Portal offline. errors sammelt alle JavaScript Fehler der Seite.
  return async function openPortal({ fakeClock = false, initScript, panel } = {}) {
    const context = await browser.newContext();
    const page = await context.newPage();
    if (initScript) await page.addInitScript(initScript);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route(/^https?:/, (route) => route.abort());
    if (fakeClock) await page.clock.install();
    await page.goto(pathToFileURL(HTML_PATH).href);
    if (panel) await page.click(`button[data-panel="${panel}"]`);
    return { page, errors };
  };
}

module.exports = { usePortalBrowser };
