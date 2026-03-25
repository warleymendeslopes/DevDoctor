import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".devdoctor");
const LAST_FILE = join(CONFIG_DIR, "last-failure.json");

/**
 * @typedef {Object} LastFailureRecord
 * @property {number} version
 * @property {string} savedAt
 * @property {string} cwd
 * @property {string} command
 * @property {string[]} commandArgs
 * @property {number|null} exitCode
 * @property {string} errorTextSanitized
 * @property {string} [projectContextSnapshot]
 */

async function ensureDir() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

/**
 * @param {string} text
 * @returns {string}
 */
function truncate(text, max = 12000) {
  if (!text || text.length <= max) return text;
  return text.slice(-max);
}

/**
 * @param {Omit<LastFailureRecord, 'version' | 'savedAt'> & { errorTextSanitized: string, projectContextSnapshot?: string }} data
 */
export async function saveLastFailure(data) {
  await ensureDir();
  /** @type {LastFailureRecord} */
  const record = {
    version: 1,
    savedAt: new Date().toISOString(),
    cwd: data.cwd,
    command: data.command,
    commandArgs: data.commandArgs,
    exitCode: data.exitCode,
    errorTextSanitized: truncate(data.errorTextSanitized),
    projectContextSnapshot: data.projectContextSnapshot
      ? truncate(data.projectContextSnapshot, 8000)
      : undefined
  };
  await fs.writeFile(LAST_FILE, JSON.stringify(record, null, 2), "utf-8");
}

/**
 * @returns {Promise<LastFailureRecord | null>}
 */
export async function readLastFailure() {
  try {
    const raw = await fs.readFile(LAST_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !data.errorTextSanitized) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
