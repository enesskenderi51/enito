'use strict';
// Speaking Aufnahme und Feedback: reine Logik mit simulierten Adaptern (T-0008).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal } = require('../lib/portal');

const portal = loadPortal();
const SpeakingCapture = portal.get('SpeakingCapture');
const SpeakingSession = portal.get('SpeakingSession');
const buildSpeakingPlan = portal.get('buildSpeakingPlan');
const wordsPerMinute = portal.get('wordsPerMinute');
const transcriptFromResults = portal.get('transcriptFromResults');
const speakingFeedbackPrompt = portal.get('speakingFeedbackPrompt');

const tasks = {
  part1: { id: 'p1', photos: ['Office', 'Kitchen'], qs: ['Compare them.', 'Your experience?', 'The future?'] },
  part2: { id: 'p2', theme: 'Trust', qs: ['a?', 'b?', 'c?'] },
  part3: { id: 'p3', topic: 'Electric cars', pro: ['cheap'], con: ['range'], followUp: 'What next?' },
};

function fakeAdapters() {
  const log = [];
  let n = 0;
  return {
    log,
    recorder: { start() { log.push('rec+'); }, stop() { log.push('rec-'); return Promise.resolve({ audioUrl: 'blob:' + (++n) }); } },
    transcriber: { start() { log.push('tr+'); }, stop() { log.push('tr-'); return Promise.resolve({ transcript: 'answer ' + n }); } },
  };
}

test('wordsPerMinute und transcriptFromResults', () => {
  assert.equal(wordsPerMinute('one two three four', 30), 8);
  assert.equal(wordsPerMinute('one', 0), 0);
  const results = [[{ transcript: 'I think ' }], [{ transcript: 'that is true' }]];
  results[0].isFinal = true; results[1].isFinal = false;
  assert.equal(transcriptFromResults(results), 'I think');
  results[1].isFinal = true;
  assert.equal(transcriptFromResults(results), 'I think that is true');
});

test('Aufnahme läuft nur in Sprechphasen, eine Aufnahme pro Etappe', async () => {
  const a = fakeAdapters();
  const capture = new SpeakingCapture(a.recorder, a.transcriber);
  const session = new SpeakingSession(buildSpeakingPlan('part3', tasks), (s, n) => capture.onSessionChange(s, n));
  session.start();             // Vorbereitung: noch keine Aufnahme
  assert.deepEqual(a.log, []);
  session.tick(60);            // Sprechen Präsentation
  assert.deepEqual(a.log, ['rec+', 'tr+']);
  session.tick(80);            // 80 von 90 Sekunden gesprochen, dann weiter
  session.next();              // Nachfrage startet sofort
  session.tick(45);            // Ende
  await capture.whenDone();
  assert.equal(session.state, 'done');
  assert.deepEqual(a.log, ['rec+', 'tr+', 'rec-', 'tr-', 'rec+', 'tr+', 'rec-', 'tr-']);
  const takes = capture.takes.map((t) => [t.index, t.stage.kind, t.seconds, t.audioUrl, t.transcript]);
  assert.deepEqual(JSON.parse(JSON.stringify(takes)), [[0, 'present', 80, 'blob:1', 'answer 1'], [1, 'followup', 45, 'blob:2', 'answer 2']]);
});

test('Abbrechen beendet eine laufende Aufnahme', async () => {
  const a = fakeAdapters();
  const capture = new SpeakingCapture(a.recorder, a.transcriber);
  const session = new SpeakingSession(buildSpeakingPlan('part1', tasks), (s, n) => capture.onSessionChange(s, n));
  session.start();
  session.tick(10);
  session.abort();
  await capture.whenDone();
  assert.deepEqual(a.log, ['rec+', 'tr+', 'rec-', 'tr-']);
  assert.equal(capture.takes[0].seconds, 10);
});

test('Feedback Prompt enthält Aufgabe, Transkript, Tempo und die Grenzen der Bewertung', () => {
  const stage = buildSpeakingPlan('part1', tasks)[0];
  const p = speakingFeedbackPrompt(stage, 'Both pictures show people working.', 30);
  for (const part of ['Office', 'Kitchen', 'Compare them.', 'Both pictures show people working.', '5 Wörter', '10 Wörter pro Minute', 'Aussprache']) {
    assert.ok(p.includes(part), `fehlt: ${part}`);
  }
});
