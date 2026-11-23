'use strict';
// Integrität der Speaking Inhalte (T-0002).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal, toHost } = require('../lib/portal');
const { nonEmpty } = require('../lib/assertions');

const portal = loadPortal();
const tasks = portal.get('speakingTasks');

test('mindestens 8 Aufgaben pro Teil, IDs eindeutig', () => {
  const all = [...tasks.part1, ...tasks.part2, ...tasks.part3];
  for (const p of ['part1', 'part2', 'part3']) assert.ok(tasks[p].length >= 8, p);
  assert.equal(new Set(all.map((t) => t.id)).size, all.length);
});

test('Teil 1: zwei Fotos und drei Fragen', () => {
  for (const t of tasks.part1) {
    assert.equal(t.photos.length, 2, t.id);
    assert.equal(t.qs.length, 3, t.id);
    assert.ok([...t.photos, ...t.qs].every(nonEmpty), t.id);
  }
});

test('Teil 2: Thema und drei Fragen', () => {
  for (const t of tasks.part2) {
    assert.ok(nonEmpty(t.theme), t.id);
    assert.equal(t.qs.length, 3, t.id);
    assert.ok(t.qs.every(nonEmpty), t.id);
  }
});

test('Teil 3: je drei Punkte dafür und dagegen plus Nachfrage', () => {
  for (const t of tasks.part3) {
    assert.ok(nonEmpty(t.topic) && nonEmpty(t.followUp), t.id);
    assert.equal(t.pro.length, 3, t.id);
    assert.equal(t.con.length, 3, t.id);
    assert.ok([...t.pro, ...t.con].every(nonEmpty), t.id);
  }
});

test('Vorlagen für alle drei Teile, Phrasenbank und Kriterien gefüllt', () => {
  assert.deepEqual(toHost(portal.get('speakingTemplates').map((t) => t.part)), [1, 2, 3]);
  const phrases = portal.get('speakingPhrases');
  assert.ok(phrases.length >= 6);
  for (const g of phrases) assert.ok(g.items.length >= 3 && g.items.every(nonEmpty), g.group);
  const criteria = portal.get('speakingCriteria');
  assert.equal(criteria.length, 6);
  for (const c of criteria) assert.ok(c.checks.length >= 2 && c.checks.every(nonEmpty), c.name);
});

test('für jede Aufgabe lässt sich ein vollständiger Prüfungsplan bauen', () => {
  const build = portal.get('buildSpeakingPlan');
  const n = Math.max(tasks.part1.length, tasks.part2.length, tasks.part3.length);
  for (let i = 0; i < n; i++) {
    const picked = { part1: tasks.part1[i % tasks.part1.length], part2: tasks.part2[i % tasks.part2.length], part3: tasks.part3[i % tasks.part3.length] };
    assert.equal(build('full', picked).length, 6);
  }
});

test('Feedback Prompt für jede echte Etappe enthält die vollständige Aufgabe', () => {
  const build = portal.get('buildSpeakingPlan');
  const prompt = portal.get('speakingFeedbackPrompt');
  const n = Math.max(tasks.part1.length, tasks.part2.length, tasks.part3.length);
  for (let i = 0; i < n; i++) {
    const picked = { part1: tasks.part1[i % tasks.part1.length], part2: tasks.part2[i % tasks.part2.length], part3: tasks.part3[i % tasks.part3.length] };
    for (const st of build('full', picked)) {
      const p = prompt(st, 'I think this is a good example answer.', 40);
      const t = st.task;
      const expected = { photo: [...t.photos || [], st.question], topic: [t.theme, ...(t.qs || [])], present: [t.topic, ...(t.pro || []), ...(t.con || [])], followup: [st.question] }[st.kind];
      for (const e of expected) assert.ok(p.includes(e), `${t.id} ${st.kind}: ${e}`);
    }
  }
});
