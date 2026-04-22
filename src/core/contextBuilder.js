import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { join } from "node:path";

const GENERATED_CONTEXT_PATH = ".devdoctor/context.generated.md";
const SECTION_LIMIT = 1200;
const TOTAL_LIMIT = 3600;

function truncateText(text, limit) {
  const clean = (text || "").trim();
  if (!clean) return "";
  return clean.length > limit ? `${clean.slice(0, limit)}\n... [truncado]` : clean;
}

async function readSafe(cwd, relPath) {
  try {
    const raw = await fs.readFile(join(cwd, relPath), "utf-8");
    return raw.trim();
  } catch {
    return "";
  }
}

async function listJsFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function buildInventorySection(folder, files) {
  if (!files.length) return "";
  const lines = files.map((name) => `- ${folder}/${name}`);
  return lines.join("\n");
}

function takeReadmeHighlights(readmeText) {
  if (!readmeText) return "";
  const lines = readmeText
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);
  return lines.slice(0, 70).join("\n");
}

function composeGeneratedContext(parts) {
  const withBudget = parts
    .map((part) => ({ ...part, text: truncateText(part.text, SECTION_LIMIT) }))
    .filter((part) => part.text);
  const body = withBudget.map((part) => `## ${part.title}\n${part.text}`).join("\n\n");
  return truncateText(body, TOTAL_LIMIT);
}

/**
 * @param {string} [cwd=process.cwd()]
 * @returns {Promise<{ outputPath: string, bytes: number, hash: string }>}
 */
export async function buildGeneratedContext(cwd = process.cwd()) {
  const readme = await readSafe(cwd, "README.md");
  const estrutura = await readSafe(cwd, "estrutura.md");
  const commandsFiles = await listJsFiles(join(cwd, "src/commands"));
  const coreFiles = await listJsFiles(join(cwd, "src/core"));

  const generated = composeGeneratedContext([
    { title: "Resumo README", text: takeReadmeHighlights(readme) },
    { title: "Mapa estrutural (estrutura.md)", text: estrutura },
    {
      title: "Inventario de comandos",
      text: buildInventorySection("src/commands", commandsFiles)
    },
    {
      title: "Inventario de modulos core",
      text: buildInventorySection("src/core", coreFiles)
    }
  ]);

  const hash = createHash("sha256").update(generated).digest("hex").slice(0, 12);
  const timestamp = new Date().toISOString();
  const output = [
    "<!-- Arquivo gerado automaticamente por `devdoctor context`. -->",
    `<!-- generatedAt: ${timestamp} -->`,
    `<!-- contentHash: ${hash} -->`,
    "",
    "# Contexto gerado para IA",
    "",
    generated,
    ""
  ].join("\n");

  const absOutput = join(cwd, GENERATED_CONTEXT_PATH);
  await fs.mkdir(join(cwd, ".devdoctor"), { recursive: true });
  await fs.writeFile(absOutput, output, "utf-8");

  return {
    outputPath: absOutput,
    bytes: Buffer.byteLength(output, "utf-8"),
    hash
  };
}
