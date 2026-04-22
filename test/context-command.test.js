import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { contextCommand } from "../src/commands/context.js";

test("contextCommand retorna 1 para uso invalido", async () => {
  const code = await contextCommand(["extra"]);
  assert.equal(code, 1);
});

test("contextCommand gera contexto automatico", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dd-context-cmd-"));
  await writeFile(join(dir, "README.md"), "# Readme", "utf-8");
  await writeFile(join(dir, "estrutura.md"), "# Estrutura", "utf-8");
  await mkdir(join(dir, "src/commands"), { recursive: true });
  await mkdir(join(dir, "src/core"), { recursive: true });
  await writeFile(join(dir, "src/commands/run.js"), "export {};", "utf-8");
  await writeFile(join(dir, "src/core/ai.js"), "export {};", "utf-8");

  const originalCwd = process.cwd();
  process.chdir(dir);
  try {
    const code = await contextCommand([]);
    assert.equal(code, 0);
  } finally {
    process.chdir(originalCwd);
  }
});
