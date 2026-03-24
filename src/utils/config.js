import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".devdoctor");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
export const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
export const DEFAULT_OLLAMA_MODEL = "llama3";

async function ensureConfigDir() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function readConfig() {
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Migracao: configs antigas so com openaiApiKey viram provider openai.
 */
function normalizeProvider(raw) {
  const cfg = { ...raw };
  if (!cfg.provider && cfg.openaiApiKey) {
    cfg.provider = "openai";
  }
  if (!cfg.provider) {
    cfg.provider = "openai";
  }
  return cfg;
}

export async function loadNormalizedConfig() {
  const raw = await readConfig();
  return normalizeProvider(raw);
}

export async function saveConfig(partial) {
  await ensureConfigDir();
  const current = await readConfig();
  const next = normalizeProvider({ ...current, ...partial });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(next, null, 2), "utf-8");
}

/** Compatibilidade com codigo que chamava saveApiKey apenas com OpenAI. */
export async function saveApiKey(apiKey) {
  await saveConfig({ provider: "openai", openaiApiKey: apiKey });
}

/**
 * Config resolvida para chamadas de IA (env tem prioridade sobre arquivo).
 */
export async function getResolvedAiConfig() {
  const cfg = await loadNormalizedConfig();
  const provider = cfg.provider;

  if (provider === "gemini") {
    const geminiApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      cfg.geminiApiKey ||
      "";
    const geminiModel =
      process.env.GEMINI_MODEL || cfg.geminiModel || DEFAULT_GEMINI_MODEL;
    return {
      provider: "gemini",
      geminiApiKey,
      geminiModel
    };
  }

  if (provider === "ollama") {
    const ollamaBaseUrl = (
      process.env.OLLAMA_BASE_URL ||
      cfg.ollamaBaseUrl ||
      DEFAULT_OLLAMA_BASE_URL
    ).replace(/\/$/, "");
    const ollamaModel =
      process.env.OLLAMA_MODEL || cfg.ollamaModel || DEFAULT_OLLAMA_MODEL;
    return {
      provider: "ollama",
      ollamaBaseUrl,
      ollamaModel
    };
  }

  const openaiApiKey =
    process.env.OPENAI_API_KEY || cfg.openaiApiKey || "";
  return {
    provider: "openai",
    openaiApiKey
  };
}

/** @deprecated use getResolvedAiConfig */
export async function getApiKey() {
  const c = await getResolvedAiConfig();
  if (c.provider !== "openai") {
    return "";
  }
  return c.openaiApiKey || "";
}
