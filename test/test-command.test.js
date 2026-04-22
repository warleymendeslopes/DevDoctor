import { test } from "node:test";
import assert from "node:assert/strict";
import { testCommand } from "../src/commands/test.js";

test("testCommand retorna 1 para uso invalido", async () => {
  const code = await testCommand(["extra"]);
  assert.equal(code, 1);
});

test("testCommand aceita flag --json", async () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const code = await testCommand(["--json"]);
    assert.equal(code, 1);
  } finally {
    if (original) {
      process.env.OPENAI_API_KEY = original;
    }
  }
});
