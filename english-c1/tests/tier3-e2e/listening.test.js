'use strict';
// Listening Trainer im echten Browser. Die Sprachausgabe ist eine Attrappe (T-0003).
const test = require('node:test');
const assert = require('node:assert/strict');
const { usePortalBrowser } = require('../lib/browser');

const openPortal = usePortalBrowser();

// Ersetzt speechSynthesis: zwei britische Stimmen, jeder Satz endet nach 10 ms, gesprochene Sätze landen in window.__spoken.
function fakeSpeech() {
  window.__spoken = [];
  const voices = [{ name: 'Google UK English Female', lang: 'en-GB' }, { name: 'Google UK English Male', lang: 'en-GB' },
    { name: 'Samantha', lang: 'en-US' }, { name: 'Alex', lang: 'en-US' }, { name: 'Karen', lang: 'en-AU' }, { name: 'Gordon', lang: 'en-AU' },
    { name: 'Moira', lang: 'en-IE' }, { name: 'Daniel', lang: 'en-IE' }, { name: 'Rishi', lang: 'en-IN' }, { name: 'Neerja Female', lang: 'en-IN' }];
  const synth = new EventTarget();
  synth.getVoices = () => voices;
  synth.speak = (u) => { window.__spoken.push([u.text, u.voice && u.voice.name, u.voice && u.voice.lang]); setTimeout(() => u.onend && u.onend(), 10); };
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
  assert.equal(voices.size, 2, `Stimmen: ${[...voices]}`);
  assert.deepEqual(errors, []);
});

test('jede Aufnahme spricht mit einer Stimme ihres Akzents und zeigt den Akzent an', async () => {
  const { page, errors } = await openListening();
  await page.click('[data-lsmode="full"]');
  const total = Number((await page.textContent('#lsPos')).match(/von (\d+)/)[1]);
  for (let i = 0; i < total; i++) {
    const info = await page.evaluate(() => ({ accent: taskAccent(lsRound[lsIdx].task), same: lsIdx > 0 && lsRound[lsIdx - 1].task === lsRound[lsIdx].task }));
    assert.match(await page.textContent('#lsTitle'), /Akzent: /);
    if (!info.same) {
      const before = await page.evaluate(() => window.__spoken.length);
      await page.click('#lsPlay');
      await page.waitForFunction(() => /übrig/.test(document.getElementById('lsPlay').textContent) && !/Läuft/.test(document.getElementById('lsPlay').textContent));
      const langs = await page.evaluate((n) => window.__spoken.slice(n).map((x) => x[2]), before);
      assert.ok(langs.length > 0);
      for (const l of langs) assert.equal(l, info.accent, `Akzent ${info.accent}, Stimme ${l}`);
    }
    await page.click('#lsOpts button >> nth=0');
    await page.click('#lsNext');
  }
  assert.deepEqual(errors, []);
});
