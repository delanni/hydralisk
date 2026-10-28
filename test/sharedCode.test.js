import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const bundle = await readFile(new URL("../bundle.min.js", import.meta.url), "utf8");

function bundledModule(id, dependencies, globals) {
  const start = bundle.indexOf("      function (require, module, exports) {", bundle.indexOf(`    ${id}: [`));
  const end = bundle.indexOf("\n      },\n", start);
  const factory = vm.runInNewContext(`(${bundle.slice(start, end + 8)})`, globals);
  const module = { exports: {} };
  factory((name) => dependencies[name], module, module.exports);
  return module.exports;
}

const encode = (code) => btoa(encodeURIComponent(code));
const decode = (code) => decodeURIComponent(atob(code));

function browser(search = "") {
  const window = {
    location: new URL(`https://example.com/hydralisk/${search}#settings`),
    replacements: [],
    addEventListener() {},
  };
  window.history = {
    replaceState(_state, _title, url) {
      window.replacements.push(url);
      window.location = new URL(url);
    },
  };
  return window;
}

test("Gallery: shared code takes precedence over sketch IDs, including empty code", () => {
  for (const code of ["// café + & = #\nosc(10).out()", ""]) {
    const window = browser(`?sketch_id=example&sketchId=other&code=${encodeURIComponent(encode(code))}`);
    const Gallery = bundledModule(258, {
      superagent: { get: () => assert.fail("must not request a sketch") },
      "./examples.json": [{ sketch_id: "example", code: encode("wrong()") }],
    }, { window, URLSearchParams, atob, btoa, hush() {}, render() {}, o0: {} });
    let loaded;
    new Gallery((value, found) => { loaded = { value, found }; });
    assert.deepEqual(loaded, { value: code, found: true });
    assert.equal(window.replacements.length, 0);
  }
});

test("REPL: initial evaluation preserves URL; later evaluations replace the query with shared code", () => {
  const window = browser("?sketchId=old&sketch_id=old&sketch=Old&other=value");
  const original = window.location.href;
  const repl = bundledModule(270, { "./log.js": { log() {} } }, {
    window, URL, URLSearchParams, btoa,
  });
  repl.eval("1 + 1", undefined, { initial: true });
  assert.equal(window.location.href, original);
  assert.equal(window.replacements.length, 0);

  const code = "// café + & = #\n1 + 2";
  repl.eval(code);
  assert.deepEqual([...window.location.searchParams.keys()], ["code"]);
  assert.equal(decode(window.location.searchParams.get("code")), code);
  assert.equal(window.location.hash, "#settings");
  assert.equal(window.location.pathname, "/hydralisk/");

  window.cm = { getValue: () => "// entire sketch\n1 + 3\n2 + 4" };
  repl.eval("2 + 4");
  assert.equal(decode(window.location.searchParams.get("code")), window.cm.getValue());
  assert.equal(window.replacements.length, 2);
});

let library;
globalThis.window = {
  HydraliskPlugins: { register(plugin) { library = plugin; } },
};
await import("../modules/sketchLibrary.js");

function startup(t, search, sketches = []) {
  const window = browser(search);
  window.location.pathname = "/player.html";
  const storage = new Map([["mySketches", JSON.stringify(sketches)]]);
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  };
  const timers = [];
  t.mock.method(globalThis, "setTimeout", (callback, delay) => {
    timers.push({ callback, delay });
    return 0;
  });
  globalThis.window = window;
  globalThis.localStorage = localStorage;
  globalThis.sessionStorage = localStorage;
  globalThis.document = { getElementById: () => null, title: "" };
  let editorText = "untouched";
  const evaluations = [];
  window.evalCode = (code, _cb, options) => evaluations.push({ code, options });
  const handlers = new Map();
  const app = {
    state: { editor: { editor: {
      getValue: () => editorText,
      setValue: (code) => { editorText = code; },
    } } },
    on: (event, handler) => handlers.set(event, handler),
    emit() {},
    expose: (key, value) => { window[key] = value; },
  };
  library.init(app);
  return { app, window, evaluations, handlers, timers, getText: () => editorText };
}

test("startup: shared code loads without a library and is not overwritten by later imports", (t) => {
  const code = "// shared café + & = #\nosc(10).out()";
  const state = startup(t, `?sketchId=wrong&sketch_id=wrong&sketch=Wrong&code=${encodeURIComponent(encode(code))}`);
  const original = state.window.location.href;
  state.timers.find(({ delay }) => delay === 150).callback();
  assert.equal(state.getText(), code);
  assert.deepEqual(state.evaluations, [{ code, options: { initial: true } }]);
  state.handlers.get("gallery:updateLocalSketches")([{ name: "Wrong", code: "wrong()" }]);
  state.app.initStartupSketch();
  assert.equal(state.evaluations.length, 1);
  assert.equal(state.window.location.href, original);
});

test("startup: empty shared code suppresses random loading", (t) => {
  const state = startup(t, "?code=", [{ name: "Wrong", code: "wrong()" }]);
  state.app.initStartupSketch();
  assert.equal(state.getText(), "");
  assert.deepEqual(state.evaluations, [{ code: "", options: { initial: true } }]);
});

test("startup: malformed shared code never falls back to a random sketch", (t) => {
  t.mock.method(console, "error", () => {});
  const state = startup(t, "?code=not-base64!", [{ name: "Wrong", code: "wrong()" }]);
  state.app.initStartupSketch();
  state.app.initStartupSketch();
  assert.equal(state.getText(), "untouched");
  assert.equal(state.evaluations.length, 0);
});

test("startup: named and random library sketches still load as initial evaluations", (t) => {
  const sketches = [{ name: "One", code: "1 + 1" }, { name: "Two", code: "2 + 2" }];
  const named = startup(t, "?sketch=Two", sketches);
  named.app.initStartupSketch();
  assert.match(named.getText(), /2 \+ 2/);
  assert.equal(named.evaluations[0].options.initial, true);

  t.mock.method(Math, "random", () => 0);
  const random = startup(t, "", sketches);
  random.app.initStartupSketch();
  assert.match(random.getText(), /1 \+ 1/);
  assert.equal(random.evaluations[0].options.initial, true);
});

test("sketch loader does not append sketch names after evaluation produces a code URL", async (t) => {
  const { loadSketch } = await import("../modules/sketchLoader.js");
  const state = startup(t, "", []);
  state.window.evalCode = (code) => {
    const url = new URL(state.window.location);
    url.search = new URLSearchParams({ code: encode(code) }).toString();
    state.window.history.replaceState({}, "", url.href);
  };
  const result = loadSketch(state.app, 0, {
    sketches: [{ name: "Selected", code: "1 + 1" }],
  });
  assert.deepEqual([...state.window.location.searchParams.keys()], ["code"]);
  assert.equal(decode(state.window.location.searchParams.get("code")), result.formattedCode);
});
