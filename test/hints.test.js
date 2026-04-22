import { test } from "node:test";
import assert from "node:assert/strict";
import { getDeterministicHints } from "../src/core/hints.js";

test("getDeterministicHints detecta npm ERESOLVE", () => {
  const hints = getDeterministicHints(
    "npm ERR! code ERESOLVE\nnpm ERR! ERESOLVE unable to resolve dependency tree"
  );

  assert.equal(hints.length > 0, true);
  assert.equal(hints[0].key, "npm-eresolve");
});

test("getDeterministicHints detecta TypeScript", () => {
  const hints = getDeterministicHints("error TS2304: Cannot find name 'foo'");
  assert.equal(hints.some((hint) => hint.key === "typescript"), true);
});
