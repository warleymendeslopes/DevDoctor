import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".devdoctor");
const LAST_FILE = join(CONFIG_DIR, "last-failure.json");
const HISTORY_FILE = join(CONFIG_DIR, "history.json");
const HISTORY_LIMIT = 100;

/**
 * @typedef {Object} FailureAnalysis
 * @property {"ai"|"known-hints"|"cached"|"none"} source
 * @property {string} summary
 * @property {string[]} suggestions
 * @property {{ explanation: string, causes: string[], solution: string, example: string } | null} [aiResult]
 * @property {{ key: string, title: string, confidence: "high"|"medium", summary: string, suggestions: string[] }[] | null} [deterministicHints]
 * @property {string | null} [reusedFromId]
 */

/**
 * @typedef {Object} LastFailureRecord
 * @property {number} version
 * @property {string} id
 * @property {string} savedAt
 * @property {string} cwd
 * @property {string} command
 * @property {string[]} commandArgs
 * @property {number|null} exitCode
 * @property {string} errorTextSanitized
 * @property {string} [projectContextSnapshot]
 * @property {string} [signature]
 * @property {string} [provider]
 * @property {string} [model]
 * @property {FailureAnalysis} [analysis]
 */

async function ensureDir() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

function truncate(text, max = 12000) {
  if (!text || text.length <= max) return text;
  return text.slice(-max);
}

function truncateAnalysis(analysis) {
  if (!analysis) {
    return {
      source: "none",
      summary: "",
      suggestions: [],
      aiResult: null,
      deterministicHints: null,
      reusedFromId: null
    };
  }

  return {
    source: analysis.source || "none",
    summary: truncate(analysis.summary || "", 3000),
    suggestions: Array.isArray(analysis.suggestions)
      ? analysis.suggestions.slice(0, 12).map((item) => truncate(String(item), 400))
      : [],
    aiResult: analysis.aiResult
      ? {
          explanation: truncate(analysis.aiResult.explanation || "", 3000),
          causes: Array.isArray(analysis.aiResult.causes)
            ? analysis.aiResult.causes.slice(0, 12).map((item) => truncate(String(item), 500))
            : [],
          solution: truncate(analysis.aiResult.solution || "", 3000),
          example: truncate(analysis.aiResult.example || "", 2000)
        }
      : null,
    deterministicHints: Array.isArray(analysis.deterministicHints)
      ? analysis.deterministicHints.slice(0, 8).map((hint) => ({
          key: hint.key,
          title: truncate(hint.title || "", 160),
          confidence: hint.confidence || "medium",
          summary: truncate(hint.summary || "", 800),
          suggestions: Array.isArray(hint.suggestions)
            ? hint.suggestions.slice(0, 8).map((item) => truncate(String(item), 400))
            : []
        }))
      : null,
    reusedFromId: analysis.reusedFromId || null
  };
}

function normalizeRecord(data) {
  if (!data || !data.errorTextSanitized) {
    return null;
  }

  return {
    version: 2,
    id: data.id || buildFailureId(),
    savedAt: data.savedAt || new Date().toISOString(),
    cwd: data.cwd || "",
    command: data.command || "",
    commandArgs: Array.isArray(data.commandArgs) ? data.commandArgs : [],
    exitCode: typeof data.exitCode === "number" ? data.exitCode : null,
    errorTextSanitized: truncate(data.errorTextSanitized),
    projectContextSnapshot: data.projectContextSnapshot
      ? truncate(data.projectContextSnapshot, 8000)
      : undefined,
    signature: data.signature || "",
    provider: data.provider || "",
    model: data.model || "",
    analysis: truncateAnalysis(data.analysis)
  };
}

export function buildFailureId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${rand}`;
}

async function readHistoryFile() {
  try {
    const raw = await fs.readFile(HISTORY_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeRecord).filter(Boolean);
  } catch {
    return [];
  }
}

async function writeHistory(records) {
  await ensureDir();
  await fs.writeFile(
    HISTORY_FILE,
    JSON.stringify(records.slice(0, HISTORY_LIMIT), null, 2),
    "utf-8"
  );
}

export async function saveFailureRecord(data) {
  const record = normalizeRecord(data);
  if (!record) {
    throw new Error("Registro de falha invalido.");
  }

  const history = await readHistoryFile();
  const withoutCurrent = history.filter((item) => item.id !== record.id);
  const next = [record, ...withoutCurrent].slice(0, HISTORY_LIMIT);

  await ensureDir();
  await Promise.all([
    fs.writeFile(LAST_FILE, JSON.stringify(record, null, 2), "utf-8"),
    writeHistory(next)
  ]);

  return record;
}

export async function saveLastFailure(data) {
  return saveFailureRecord(data);
}

function isLegacyRecord(data) {
  return data && data.version === 1 && data.errorTextSanitized;
}

function convertLegacyRecord(data) {
  return normalizeRecord({
    ...data,
    version: 2,
    id: data.id || buildFailureId(),
    analysis: {
      source: "none",
      summary: "",
      suggestions: [],
      aiResult: null,
      deterministicHints: null,
      reusedFromId: null
    }
  });
}

export async function readLastFailure() {
  try {
    const raw = await fs.readFile(LAST_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (isLegacyRecord(data)) {
      return convertLegacyRecord(data);
    }
    return normalizeRecord(data);
  } catch {
    return null;
  }
}

export async function readFailureHistory(limit = 20) {
  const history = await readHistoryFile();
  return history.slice(0, limit);
}

export async function readFailureById(id) {
  if (!id) {
    return null;
  }
  const history = await readHistoryFile();
  return history.find((item) => item.id === id) || null;
}

export async function findLatestFailureBySignature(signature, cwd, excludeId = "") {
  if (!signature) {
    return null;
  }

  const history = await readHistoryFile();
  return (
    history.find(
      (item) =>
        item.id !== excludeId &&
        item.signature === signature &&
        item.cwd === cwd &&
        item.analysis &&
        item.analysis.source !== "none" &&
        (item.analysis.aiResult ||
          (item.analysis.deterministicHints &&
            item.analysis.deterministicHints.length > 0))
    ) || null
  );
}
