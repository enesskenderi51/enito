'use strict';
// Listening Trainer im echten Browser. Die Sprachausgabe ist eine Attrappe (T-0003).
const test = require('node:test');
const assert = require('node:assert/strict');
const { usePortalBrowser } = require('../lib/browser');

const openPortal = usePortalBrowser();

// Ersetzt speechSynthesis: zwei britische Stimmen, jeder Satz endet nach 10 ms, gesprochene Sätze landen in window.__spoken.
function fakeSpeech() {
  window.__spoken = [];
  const voices = [{ name: 'Google UK English Female', lang: 'en-GB' }, { name: 'Google UK English Male', lang: 'en-GB' }];
  const synth = new EventTarget();
  synth.getVoices = () => voices;
  synth.speak = (u) => { window.__spoken.push([u.text, u.voice && u.voice.name]); setTimeout(() => u.onend && u.onend(), 10); };
  synth.cancel = () => {};
  Object.defineProperty(window, 'speechSynthesis', { value: synth });
  window.SpeechSynthesisUtterance = function (text) { this.text = text; };
}

const openListening = () => openPortal({ initScript: fakeSpeech, panel: 'p-listening' });

test('kompletter Test: abspielen, antworten, Transkript, Auswertung', async () => {
  const { page, errors } = await openListening();
  assert.match(await page.textContent('#lsVoiceInfo'), /Frau = Google UK English Female, Mann = Google UK English Male/);
  await page.click('[data-lsmode="full"]');
  assert.match(await page.textContent('#lsPos'), /Teil 1 · Frage 1 von \d+/);
  const total = Number((await page.textContent('#lsPos')).match(/von (\d+)/)[1]);
  assert.ok(total >= 5 + 6 + 12, `Fragen: ${total}`);
  assert.ok(!(await page.isVisible('#lsTransBox')), 'Transkript erst nach der Antwort');

  await page.click('#lsPlay');
  await page.waitForFunction(() => document.getElementById('lsPlay').textContent.includes('1 übrig'));
  assert.ok((await page.evaluate(() => window.__spoken.length)) > 0);
  await page.click('#lsPlay');
  await page.waitForFunction(() => document.getElementById('lsPlay').textContent === 'Keine Durchgänge mehr');
  assert.ok(await page.isDisabled('#lsPlay'));

  for (let i = 0; i < total; i++) {
    await page.click('#lsOpts button >> nth=0');
    assert.equal(await page.locator('#lsOpts button.correct').count(), 1);
    assert.ok(await page.isVisible('#lsTransBox'));
    await page.click('#lsNext');
  }
  assert.match(await page.textContent('#lsResult'), /Ergebnis: \d+ von \d+/);
  assert.match(await page.textContent('#lsResult'), /Teil 3/);
  assert.deepEqual(errors, []);
});

test('Mann und Frau sprechen mit verschiedenen Stimmen', async () => {
  const { page, errors } = await openListening();
  await page.click('[data-lsmode="part3"]');
  await page.click('#lsPlay');
  await page.waitForFunction(() => document.getElementById('lsPlay').textContent.includes('1 übrig'));
  const voices = new Set(await page.evaluate(() => window.__spoken.map((x) => x[1])));
  assert.deepEqual(voices, new Set(['Google UK English Female', 'Google UK English Male']));
  assert.deepEqual(errors, []);
});
