'use strict';
// Gemeinsame Prüfregeln für Fragen aller Bereiche.
const assert = require('node:assert/strict');

const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

// Prüft eine Multiple Choice Frage {q, a, c, e}.
function checkChoice(q, where, { options = 3, explained = false } = {}) {
  assert.ok(nonEmpty(q.q), `${where}: Frage leer`);
  if (explained) assert.ok(nonEmpty(q.e), `${where}: Erklärung leer`);
  assert.ok(Array.isArray(q.a) && q.a.length === options, `${where}: ${q.a && q.a.length} statt ${options} Optionen`);
  assert.ok(Number.isInteger(q.c) && q.c >= 0 && q.c < q.a.length, `${where}: Lösungsindex ungültig`);
  const norm = q.a.map((x) => String(x).trim().toLowerCase());
  assert.equal(new Set(norm).size, q.a.length, `${where}: doppelte Optionen ${JSON.stringify(q.a)}`);
}

module.exports = { nonEmpty, checkChoice };
