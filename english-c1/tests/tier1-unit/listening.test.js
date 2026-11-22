'use strict';
// Listening: reine Logik und Sprachausgabe mit simulierter speechSynthesis (T-0003).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal, toHost } = require('../lib/portal');

const portal = loadPortal();
const splitSentences = portal.get('splitSentences');
const rankVoices = portal.get('rankVoices');
const pickVoicePair = portal.get('pickVoicePair');
const PlayLimiter = portal.get('PlayLimiter');
const buildListeningRound = portal.get('buildListeningRound');
const scoreListening = portal.get('scoreListening');
const BrowserVoiceEngine = portal.get('BrowserVoiceEngine');
const sameRecording = portal.get('sameRecording');

const V = (name, lang) => ({ name, lang });

test('splitSentences trennt an Satzenden und lässt nichts weg', () => {
  const text = 'It was 9 p.m. sharp. Actually, no! Was it? Yes.';
  const parts = toHost(splitSentences('It costs 3.50 pounds. Actually, no wait! Is it four? Yes.'));
  assert.deepEqual(parts, ['It costs 3.50 pounds.', 'Actually, no wait!', 'Is it four?', 'Yes.']);
  assert.equal(toHost(splitSentences(text)).join(' ').replace(/\s+/g, ' '), text);
  assert.deepEqual(toHost(splitSentences('  ')), []);
});

test('rankVoices bevorzugt Englisch, en-GB und neuronale Stimmen', () => {
  const voices = [V('Anna', 'de-DE'), V('Fred', 'en-US'), V('Microsoft Sonia Online (Natural) - English (United Kingdom)', 'en-GB'), V('Daniel', 'en-GB')];
  const names = toHost(rankVoices(voices, 'f').map((v) => v.name));
  assert.equal(names[0], 'Microsoft Sonia Online (Natural) - English (United Kingdom)');
  assert.ok(!names.includes('Anna'), 'nicht englische Stimmen fallen weg');
  assert.equal(toHost(rankVoices(voices, 'm'))[0].name, 'Daniel');
});

test('pickVoicePair gibt Mann und Frau verschiedene Stimmen', () => {
  const pair = pickVoicePair([V('Google UK English Female', 'en-GB'), V('Google UK English Male', 'en-GB')]);
  assert.equal(pair.f.name, 'Google UK English Female');
  assert.equal(pair.m.name, 'Google UK English Male');
  const single = pickVoicePair([V('Samantha', 'en-US')]);
  assert.equal(single.f.name, 'Samantha');
  assert.equal(single.m.name, 'Samantha'); // nur eine Stimme: Unterschied kommt über die Tonhöhe
  const none = pickVoicePair([]);
  assert.equal(none.f, null);
});

test('PlayLimiter erlaubt genau zwei Durchgänge', () => {
  const p = new PlayLimiter(2);
  assert.equal(p.state, 'ready');
  p.start();
  assert.equal(p.state, 'playing');
  assert.throws(() => p.start(), /läuft/);
  p.finish();
  assert.deepEqual([p.state, p.left], ['ready', 1]);
  p.start(); p.finish();
  assert.deepEqual([p.state, p.left], ['usedUp', 0]);
  assert.throws(() => p.start(), /verbraucht/);
});

const t1 = { id: 'a', script: [{ sp: 'f', text: 'x' }], q: 'Q1', a: ['1', '2', '3'], c: 1, e: 'E' };
const t2 = { id: 'b', script: [{ sp: 'm', text: 'y' }], qs: [{ q: 'Q2', a: ['1', '2', '3'], c: 0, e: '' }, { q: 'Q3', a: ['1', '2', '3'], c: 2, e: '' }] };
const t3 = { id: 'c', script: [{ sp: 'm', text: 'z' }], items: [{ s: 'S1', c: 0 }, { s: 'S2', c: 2 }], e: '' };

test('buildListeningRound macht aus allen Teilen eine flache Fragenliste', () => {
  const round = toHost(buildListeningRound({ part1: [t1], part2: [t2], part3: [t3] }));
  assert.deepEqual(round.map((x) => [x.part, x.task.id, x.q, x.c]), [
    [1, 'a', 'Q1', 1], [2, 'b', 'Q2', 0], [2, 'b', 'Q3', 2], [3, 'c', 'S1', 0], [3, 'c', 'S2', 2],
  ]);
  assert.deepEqual(round[3].a, ['Man', 'Woman', 'Both']);
  const live = buildListeningRound({ part1: [t1], part2: [t2], part3: [t3] });
  assert.deepEqual([1, 2, 3, 4].map((i) => sameRecording(live[i], live[i - 1])), [false, true, false, true]);
  assert.equal(sameRecording(live[0], undefined), false);
});

test('scoreListening zählt pro Teil', () => {
  const round = buildListeningRound({ part1: [t1], part2: [t2], part3: [t3] });
  const s = toHost(scoreListening(round, [1, 0, 0, 0, 2]));
  assert.deepEqual(s, { correct: 4, total: 5, byPart: { 1: [1, 1], 2: [1, 2], 3: [2, 2] } });
});

function fakeSynth() {
  const spoken = [];
  return {
    spoken,
    getVoices: () => [V('Google UK English Female', 'en-GB'), V('Google UK English Male', 'en-GB')],
    speak(u) { spoken.push(u); setImmediate(() => u.onend && u.onend()); },
    cancel() { spoken.push('cancel'); },
  };
}
function FakeUtterance(text) { this.text = text; }

test('BrowserVoiceEngine liest Satz für Satz mit der Stimme des Sprechers', async () => {
  const synth = fakeSynth();
  const engine = new BrowserVoiceEngine(synth, FakeUtterance);
  await engine.speak([{ sp: 'f', text: 'Hello there. How are you?' }, { sp: 'm', text: 'Fine.' }], { rate: 0.9 });
  assert.deepEqual(synth.spoken.map((u) => [u.text, u.voice.name, u.rate, u.lang]), [
    ['Hello there.', 'Google UK English Female', 0.9, 'en-GB'],
    ['How are you?', 'Google UK English Female', 0.9, 'en-GB'],
    ['Fine.', 'Google UK English Male', 0.9, 'en-GB'],
  ]);
});

test('BrowserVoiceEngine.cancel bricht ab und beendet das Promise', async () => {
  const synth = fakeSynth();
  synth.speak = (u) => synth.spoken.push(u); // endet nie von selbst
  const engine = new BrowserVoiceEngine(synth, FakeUtterance);
  const done = engine.speak([{ sp: 'f', text: 'One. Two.' }], {});
  engine.cancel();
  await done;
  assert.equal(synth.spoken.length, 2); // erster Satz plus cancel
  assert.equal(synth.spoken[1], 'cancel');
});
