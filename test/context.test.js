import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadProjectContext } from "../src/core/context.js";

test("loadProjectContext le package.json resumido", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dd-ctx-"));
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({
      name: "demo",
      version: "1.0.0",
      scripts: { test: "node --test" }
    }),
    "utf-8"
  );

  const ctx = await loadProjectContext(dir);
  assert.ok(ctx.includes("demo"));
  assert.ok(ctx.includes("test"));
});
