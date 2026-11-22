'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readHtml, extractScript, panelIds } = require('../lib/portal');

const html = readHtml();

function divBalance(id) {
  const start = html.indexOf(`id="${id}"`);
  assert.ok(start >= 0, `Panel ${id} fehlt`);
  const end = html.indexOf('</section>', start);
  assert.ok(end >= 0, `Panel ${id} ohne </section>`);
  const section = html.slice(start, end);
  return { open: (section.match(/<div\b/g) || []).length, close: (section.match(/<\/div>/g) || []).length };
}

test('Scriptblock ist syntaktisch gültig', () => {
  new vm.Script(extractScript(html), { filename: 'aptis-c1-lernportal.js' }); // kompiliert ohne auszuführen
});

for (const id of panelIds(html)) {
  test(`div Bilanz ausgeglichen in ${id}`, () => {
    const { open, close } = divBalance(id);
    assert.equal(open, close);
  });
}
