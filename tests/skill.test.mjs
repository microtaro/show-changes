import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const skill = "skills/show-changes";

test("the skill, its metadata and its script are there", () => {
  for (const path of [`${skill}/SKILL.md`, `${skill}/agents/openai.yaml`, `${skill}/scripts/show-marks.js`]) {
    assert.ok(existsSync(new URL(path, root)), path);
  }
  assert.match(read(`${skill}/SKILL.md`), /^name: show-changes$/m);
  assert.match(read(`${skill}/agents/openai.yaml`), /\$show-changes/);
  assert.match(read("skills.sh.json"), /"show-changes"/);
});

test("the skill says the marks are not part of the app, and what 0 found means", () => {
  const text = read(`${skill}/SKILL.md`);
  assert.match(text, /not part of the app/);
  assert.match(text, /0 means that state is not on the screen/);
  assert.match(text, /`shown` 0 with `found` above 0/);
  assert.match(text, /アプリの一部ではありません/);
});

test("the script defines showMarks and clearMarks and touches nothing until called", () => {
  const window = {};
  const context = vm.createContext({ window, document: {}, innerWidth: 800, innerHeight: 600 });
  vm.runInContext(read(`${skill}/scripts/show-marks.js`), context);
  assert.equal(typeof window.showMarks, "function");
  assert.equal(typeof window.clearMarks, "function");
});
