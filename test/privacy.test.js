import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeForAi, buildPreviewPayload } from "../src/core/privacy.js";

test("sanitizeForAi remove chave OpenAI", () => {
  const out = sanitizeForAi('token sk-123456789012345678901234567890');
  assert.ok(!out.includes("sk-123456789012345678901234567890"));
  assert.ok(out.includes("REDACTED"));
});

test("sanitizeForAi remove chave Gemini", () => {
  const out = sanitizeForAi("key AIza1234567890123456789012345678901");
  assert.ok(!out.includes("AIza1234567890123456789012345678901"));
});

test("buildPreviewPayload inclui blocos", () => {
  const p = buildPreviewPayload("Error: x", '{"name":"demo"}');
  assert.ok(p.includes("Error: x"));
  assert.ok(p.includes("demo"));
});
