import { promises as fs } from "node:fs";
import { join } from "node:path";

const MAX_CONTEXT_CHARS = 4500;
const CONTEXT_FILENAME = ".devdoctor/context.md";
const GENERATED_CONTEXT_FILENAME = ".devdoctor/context.generated.md";
const BLOCK_LIMIT_CHARS = 1800;

function truncateBlock(text, limit = BLOCK_LIMIT_CHARS) {
  const trimmed = (text || "").trim();
  if (!trimmed) return "";
  return trimmed.length > limit
    ? `${trimmed.slice(0, limit)}\n... [truncado]`
    : trimmed;
}

/**
 * Le package.json e extrai apenas campos seguros e uteis para o prompt.
 * @param {string} cwd
 * @returns {Promise<string>}
 */
async function readPackageJsonSummary(cwd) {
  try {
    const raw = await fs.readFile(join(cwd, "package.json"), "utf-8");
    const pkg = JSON.parse(raw);
    const summary = {
      name: pkg.name,
      version: pkg.version,
      type: pkg.type,
      engines: pkg.engines,
      scripts: pkg.scripts ? Object.keys(pkg.scripts).slice(0, 40) : undefined
    };
    const line = JSON.stringify(summary, null, 2);
    return line.length > MAX_CONTEXT_CHARS
      ? line.slice(0, MAX_CONTEXT_CHARS) + "\n... [truncado]"
      : line;
  } catch {
    return "";
  }
}

/**
 * Conteudo opcional definido pelo time (regras, gerenciador de pacotes, etc.).
 * @param {string} cwd
 * @returns {Promise<string>}
 */
async function readOptionalContextFile(cwd) {
  try {
    const raw = await fs.readFile(join(cwd, CONTEXT_FILENAME), "utf-8");
    return truncateBlock(raw);
  } catch {
    return "";
  }
}

/**
 * Contexto gerado automaticamente por `devdoctor context`.
 * @param {string} cwd
 * @returns {Promise<string>}
 */
async function readGeneratedContextFile(cwd) {
  try {
    const raw = await fs.readFile(join(cwd, GENERATED_CONTEXT_FILENAME), "utf-8");
    return truncateBlock(raw);
  } catch {
    return "";
  }
}

/**
 * Contexto minimo do diretorio atual para enriquecer a explicacao da IA.
 * @param {string} [cwd=process.cwd()]
 * @returns {Promise<string>}
 */
export async function loadProjectContext(cwd = process.cwd()) {
  const chunks = [];
  const pkg = await readPackageJsonSummary(cwd);
  if (pkg) {
    chunks.push("Resumo do package.json:\n" + pkg);
  }
  const extra = await readOptionalContextFile(cwd);
  if (extra) {
    chunks.push("\nArquivo .devdoctor/context.md:\n" + extra);
  }
  const generated = await readGeneratedContextFile(cwd);
  if (generated) {
    chunks.push("\nArquivo .devdoctor/context.generated.md:\n" + generated);
  }

  const combined = chunks.join("\n\n").trim();
  if (!combined) {
    return "";
  }
  return combined.length > MAX_CONTEXT_CHARS
    ? combined.slice(0, MAX_CONTEXT_CHARS) + "\n... [truncado]"
    : combined;
}
