import { test } from "node:test";
import assert from "node:assert/strict";
import { buildErrorSignature } from "../src/core/signature.js";

test("buildErrorSignature normaliza caminhos e numeros volateis", () => {
  const signature = buildErrorSignature(
    "Error: fail at /Users/john/project/src/app.js:12345\nrequest id 987654321"
  );

  assert.ok(signature.includes("/Users/[user]"));
  assert.ok(!signature.includes("987654321"));
});
