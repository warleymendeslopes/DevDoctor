import { test } from "node:test";
import assert from "node:assert/strict";
import { hasError, extractErrorText } from "../src/core/parser.js";

test("hasError detecta TypeError", () => {
  assert.equal(hasError("foo\nTypeError: bar\n"), true);
});

test("hasError ignora saida sem padrao de erro", () => {
  assert.equal(hasError("build ok\nsuccess\n"), false);
});

test("extractErrorText retorna trecho a partir da ultima linha de erro", () => {
  const out = "info\nTypeError: x\n  at foo";
  assert.ok(extractErrorText(out).includes("TypeError"));
});
