import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runDoctor } from "../src/core/doctor.js";

test("runDoctor identifica package manager e package.json", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dd-doctor-"));
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({ name: "demo", engines: { node: ">=18" } }),
    "utf-8"
  );
  await writeFile(join(dir, "package-lock.json"), "{}", "utf-8");

  const result = await runDoctor(dir);
  assert.equal(result.packageManager, "npm");
  assert.equal(
    result.checks.some((item) => item.checkId === "package-json" && item.status === "ok"),
    true
  );
});
