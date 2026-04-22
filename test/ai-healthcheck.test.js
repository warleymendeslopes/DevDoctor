import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHealthcheckResponse } from "../src/core/ai.js";

test("parseHealthcheckResponse aceita JSON com status ok", () => {
  const result = parseHealthcheckResponse('{"status":"ok"}');
  assert.equal(result.ok, true);
});

test("parseHealthcheckResponse rejeita JSON sem status ok", () => {
  const result = parseHealthcheckResponse('{"status":"fail"}');
  assert.equal(result.ok, false);
});

test("parseHealthcheckResponse extrai JSON de resposta verbosa", () => {
  const result = parseHealthcheckResponse('Resposta:\n{"status":"ok"}\nFim');
  assert.equal(result.ok, true);
});
