'use strict';
// Speaking Aufnahme und KI Feedback im Browser. Mikrofon, Spracherkennung und KI sind simuliert (T-0008).
const test = require('node:test');
const assert = require('node:assert/strict');
const { usePortalBrowser } = require('../lib/browser');

const openPortal = usePortalBrowser();

function fakeMedia() {
  window.__micStopped = 0;
  navigator.mediaDevices.getUserMedia = async () => ({ getTracks: () => [{ stop() { window.__micStopped++; } }] });
  window.MediaRecorder = class {
    constructor() { this.mimeType = 'audio/webm'; }
    start() {}
    stop() { this.ondataavailable({ data: new Blob(['x'], { type: 'audio/webm' }) }); setTimeout(() => this.onstop(), 0); }
  };
  window.SpeechRecognition = class {
    start() { setTimeout(() => { const r = [{ transcript: 'I believe trust is the foundation of every successful team' }]; r.isFinal = true; this.onresult && this.onresult({ results: [r] }); }, 0); }
    stop() { setTimeout(() => this.onend && this.onend(), 0); }
  };
}

async function openWithFakes(page) {
  await page.route('https://api.anthropic.com/v1/messages', (route) => {
    const body = JSON.parse(route.request().postData());
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'FEEDBACK fuer ' + body.model }] }) });
  });
}

test('Teil 2: Aufnahme, Transkript und KI Feedback', async () => {
  const { page, errors } = await openPortal({ initScript: fakeMedia, fakeClock: true, panel: 'p-speaking' });
  await openWithFakes(page);
  assert.match(await page.textContent('#spRecInfo'), /Aufnahme: verfügbar · Transkript: verfügbar/);
  await page.click('[data-spmode="part2"]');
  await page.clock.runFor(60_000);
  await page.clock.runFor(120_000);
  await page.clock.runFor(2_000);
  await page.waitForSelector('#spTakes [data-takefb]');
  assert.match(await page.textContent('#spTakes'), /120 Sek\. gesprochen/);
  assert.equal(await page.locator('#spTakes audio').count(), 1);
  assert.match(await page.inputValue('[data-taketext="0"]'), /trust is the foundation/);
  await page.click('[data-takefb="0"]');
  await page.waitForFunction(() => /FEEDBACK/.test(document.querySelector('[data-takeout="0"]').textContent));
  assert.match(await page.textContent('[data-takeout="0"]'), /FEEDBACK fuer claude-opus-5-5/);
  assert.equal(await page.evaluate(() => window.__micStopped), 1, 'Mikrofon nach der Runde freigegeben');
  assert.deepEqual(errors, []);
});

test('ohne Aufnahme: Transkript selbst einfügen, Feedback funktioniert', async () => {
  const { page, errors } = await openPortal({ fakeClock: true, panel: 'p-speaking' });
  await openWithFakes(page);
  await page.uncheck('#spRecord');
  await page.click('[data-spmode="part3"]');
  await page.click('#spNext'); await page.click('#spNext'); await page.click('#spNext');
  await page.waitForSelector('#spTakes [data-takefb]');
  assert.equal(await page.locator('#spTakes audio').count(), 0);
  assert.equal(await page.inputValue('[data-taketext="0"]'), '');
  await page.click('[data-takefb="0"]');
  assert.match(await page.textContent('[data-takeout="0"]'), /Transkript einfügen/);
  await page.fill('[data-taketext="0"]', 'There is an ongoing debate about electric cars in companies.');
  await page.click('[data-takefb="0"]');
  await page.waitForFunction(() => /FEEDBACK/.test(document.querySelector('[data-takeout="0"]').textContent));
  assert.deepEqual(errors, []);
});
