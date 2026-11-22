'use strict';
// KI Anbindung und Zeitformat (T-0006). fetch ist simuliert, es gibt keine Netzwerkaufrufe.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal, readHtml, extractScript } = require('../lib/portal');

const portal = loadPortal();
const askClaude = portal.get('askClaude');
const models = [...portal.get('AI_MODELS')];

// Jeder Test startet ohne gemerktes Modell.
test.beforeEach(() => portal.get('aiWorkingModel = null'));

function fakeFetch(responses) {
  const calls = [];
  const fn = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body);
    const r = responses[body.model];
    if (r instanceof Error) throw r;
    return { ok: r.status === 200, status: r.status, json: async () => r.body };
  };
  return { fn, calls };
}

test('askClaude nutzt zuerst das aktuelle Modell und liefert nur Text', async () => {
  assert.equal(models[0], 'claude-opus-5-5');
  const { fn, calls } = fakeFetch({ [models[0]]: { status: 200, body: { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: 'Hallo' }, { type: 'text', text: 'Welt' }] } } });
  assert.equal(await askClaude('x', { maxTokens: 4000 }, fn), 'Hallo\nWelt');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].max_tokens, 4000);
  assert.deepEqual(Object.keys(calls[0]).sort(), ['max_tokens', 'messages', 'model']);
});

test('askClaude fällt auf das nächste Modell zurück, wenn das erste nicht verfügbar ist', async () => {
  const { fn, calls } = fakeFetch({
    [models[0]]: { status: 400, body: { type: 'error', error: { type: 'invalid_request_error' } } },
    [models[1]]: { status: 200, body: { stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] } },
  });
  assert.equal(await askClaude('x', {}, fn), 'ok');
  assert.deepEqual(calls.map((c) => c.model), models.slice(0, 2));
});

test('askClaude meldet eine Ablehnung, ohne auf ein anderes Modell zu wechseln', async () => {
  const { fn, calls } = fakeFetch({ [models[0]]: { status: 200, body: { stop_reason: 'refusal', content: [] } } });
  await assert.rejects(askClaude('x', {}, fn), (e) => e.refusal === true && /abgelehnt/.test(e.message));
  assert.equal(calls.length, 1);
});

test('askClaude wirft, wenn kein Modell antwortet', async () => {
  const responses = Object.fromEntries(models.map((m) => [m, new Error('offline')]));
  await assert.rejects(askClaude('x', {}, fakeFetch(responses).fn), /nicht erreichbar/);
});

test('kein Timer formatiert m:ss mehr von Hand', () => {
  const js = extractScript(readHtml());
  const manual = js.match(/Math\.floor\(sec\/60\)/g) || [];
  assert.equal(manual.length, 0, 'fmtClock verwenden');
  assert.ok(!/model:'claude-sonnet-4-6'/.test(js), 'Modell nur über AI_MODELS');
});

test('askClaude merkt sich das funktionierende Modell für die nächsten Aufrufe', async () => {
  const { fn, calls } = fakeFetch({
    [models[0]]: { status: 404, body: {} },
    [models[1]]: { status: 200, body: { stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] } },
  });
  await askClaude('a', {}, fn);
  await askClaude('b', {}, fn);
  assert.deepEqual(calls.map((c) => c.model), [models[0], models[1], models[1]]);
});

test('askClaude wiederholt nicht, wenn das Budget nur für Thinking reichte', async () => {
  const { fn, calls } = fakeFetch({ [models[0]]: { status: 200, body: { stop_reason: 'max_tokens', content: [{ type: 'thinking', thinking: '' }] } } });
  await assert.rejects(askClaude('x', {}, fn), /zu lang/);
  assert.equal(calls.length, 1);
});
