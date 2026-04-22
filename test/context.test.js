import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadProjectContext } from "../src/core/context.js";
import { buildGeneratedContext } from "../src/core/contextBuilder.js";

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

test("loadProjectContext combina contexto manual e gerado", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dd-ctx-mix-"));
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({ name: "demo-mix", version: "1.0.0" }),
    "utf-8"
  );
  await mkdir(join(dir, ".devdoctor"), { recursive: true });
  await writeFile(join(dir, ".devdoctor/context.md"), "manual-context", "utf-8");
  await writeFile(
    join(dir, ".devdoctor/context.generated.md"),
    "generated-context",
    "utf-8"
  );

  const ctx = await loadProjectContext(dir);
  assert.ok(ctx.includes("manual-context"));
  assert.ok(ctx.includes("generated-context"));
});

test("buildGeneratedContext cria arquivo com hash e inventario", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dd-ctx-build-"));
  await writeFile(join(dir, "README.md"), "# Projeto\ntexto", "utf-8");
  await writeFile(join(dir, "estrutura.md"), "# Estrutura\nsrc/core", "utf-8");
  await mkdir(join(dir, "src/commands"), { recursive: true });
  await mkdir(join(dir, "src/core"), { recursive: true });
  await writeFile(join(dir, "src/commands/run.js"), "export {};", "utf-8");
  await writeFile(join(dir, "src/core/ai.js"), "export {};", "utf-8");

  const result = await buildGeneratedContext(dir);
  assert.ok(result.hash);

  const generated = await readFile(join(dir, ".devdoctor/context.generated.md"), "utf-8");
  assert.ok(generated.includes("contentHash:"));
  assert.ok(generated.includes("src/commands/run.js"));
  assert.ok(generated.includes("src/core/ai.js"));
});
