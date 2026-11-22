'use strict';
// Lädt den Scriptblock des Lernportals in einen isolierten node:vm Kontext.
// Browser APIs werden durch ein rekursives Null Object ersetzt, damit
// Top Level Code (Event Listener, DOM Zugriffe) ohne jsdom läuft.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const HTML_PATH = path.join(__dirname, '..', '..', 'src', 'aptis-c1-lernportal.html');

function readHtml() {
  return fs.readFileSync(HTML_PATH, 'utf8');
}

function extractScript(html) {
  const blocks = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  if (blocks.length === 0) throw new Error('Kein <script> Block gefunden');
  return blocks[blocks.length - 1][1];
}

// Eine Quelle der Wahrheit: die Tabs werden aus den Navigationsknöpfen gelesen.
function panelIds(html) {
  return [...new Set([...html.matchAll(/data-panel="([^"]+)"/g)].map((m) => m[1]))];
}

function nullObject() {
  const target = function () {};
  const proxy = new Proxy(target, {
    get(_, key) {
      if (key === Symbol.toPrimitive) return () => '';
      if (key === Symbol.iterator) return function* () {};
      if (key === 'length') return 0;
      if (key === 'then') return undefined; // kein Thenable, sonst hängt await
      return proxy;
    },
    set: () => true,
    apply: () => proxy,
    construct: () => proxy,
  });
  return proxy;
}

function createSandbox() {
  const dom = nullObject();
  const store = new Map();
  const noop = () => 0;
  const sandbox = {
    console, document: dom, URL: dom, Blob: function () {},
    setTimeout: noop, setInterval: noop, clearInterval: noop,
    alert: noop, confirm: () => true,
    fetch: async () => { throw new Error('Netzwerk ist in Tests gesperrt'); },
    storage: {
      get: async (k) => (store.has(k) ? { value: store.get(k) } : null),
      set: async (k, v) => { store.set(k, v); },
    },
  };
  sandbox.window = sandbox;
  return sandbox;
}

let cached;
function loadPortal() {
  if (cached) return cached;
  const context = vm.createContext(createSandbox());
  vm.runInContext(extractScript(readHtml()), context, { filename: 'aptis-c1-lernportal.js' });
  cached = { get: (name) => vm.runInContext(name, context) };
  return cached;
}

module.exports = { HTML_PATH, readHtml, extractScript, panelIds, loadPortal };
