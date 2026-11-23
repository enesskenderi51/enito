'use strict';
// Integrität der Listening Inhalte (T-0003).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPortal } = require('../lib/portal');
const { nonEmpty, checkChoice } = require('../lib/assertions');

const portal = loadPortal();
const tasks = portal.get('listeningTasks');
const modes = portal.get('LISTENING_MODES');

function checkScript(t) {
  assert.ok(nonEmpty(t.title), `${t.id}: Titel`);
  assert.ok(t.script.length > 0, `${t.id}: Skript leer`);
  for (const seg of t.script) {
    assert.ok(seg.sp === 'f' || seg.sp === 'm', `${t.id}: Sprecher ${seg.sp}`);
    assert.ok(nonEmpty(seg.text), `${t.id}: Text leer`);
  }
}
test('Mindestmengen und eindeutige IDs', () => {
  assert.ok(tasks.part1.length >= 10 && tasks.part2.length >= 6 && tasks.part3.length >= 6);
  const all = [...tasks.part1, ...tasks.part2, ...tasks.part3];
  assert.equal(new Set(all.map((t) => t.id)).size, all.length);
});

test('jeder Modus findet genug Aufgaben', () => {
  for (const counts of Object.values(modes)) for (const [k, n] of Object.entries(counts)) assert.ok(tasks[k].length >= n, k);
});

test('Teil 1: kurze Aufnahme, eine Frage', () => {
  for (const t of tasks.part1) { checkScript(t); checkChoice(t, t.id, { explained: true }); }
});

test('Teil 2: Monolog mit genau einem Sprecher und zwei Fragen', () => {
  for (const t of tasks.part2) {
    checkScript(t);
    assert.equal(new Set(t.script.map((s) => s.sp)).size, 1, `${t.id}: Monolog`);
    assert.equal(t.qs.length, 2, t.id);
    t.qs.forEach((q, i) => checkChoice(q, `${t.id}.qs[${i}]`, { explained: true }));
  }
});

test('Teil 3: Dialog Mann und Frau, vier Aussagen mit gültiger Zuordnung', () => {
  for (const t of tasks.part3) {
    checkScript(t);
    assert.deepEqual(new Set(t.script.map((s) => s.sp)), new Set(['f', 'm']), `${t.id}: beide Sprecher`);
    assert.equal(t.items.length, 4, t.id);
    for (const it of t.items) {
      assert.ok(nonEmpty(it.s) && nonEmpty(it.e), `${t.id}: Aussage oder Erklärung leer`);
      assert.ok([0, 1, 2].includes(it.c), `${t.id}: Zuordnung ${it.c}`);
    }
  }
});

test('Teil 3 nutzt alle drei Zuordnungen, damit Raten nicht hilft', () => {
  const used = new Set(tasks.part3.flatMap((t) => t.items.map((i) => i.c)));
  assert.deepEqual(used, new Set([0, 1, 2]));
});

test('Akzente: gültig, mit Anzeige und mindestens vier verschiedene im Pool', () => {
  const labels = portal.get('ACCENT_LABELS');
  const accentOf = portal.get('taskAccent');
  const all = [...tasks.part1, ...tasks.part2, ...tasks.part3];
  for (const t of all) assert.ok(labels[accentOf(t)], `${t.id}: Akzent ${t.accent}`);
  assert.ok(new Set(all.map(accentOf)).size >= 4);
  assert.ok(tasks.part1.length >= 16 && tasks.part2.length >= 9 && tasks.part3.length >= 9);
});
