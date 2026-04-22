import { runUserCommand } from "../core/runner.js";

/**
 * @param {string[]} argv
 * @returns {{ flags: { noAi: boolean, previewOnly: boolean, yesFlag: boolean, json: boolean }, rest: string[] }}
 */
export function parseGlobalFlags(argv) {
  const flags = { noAi: false, previewOnly: false, yesFlag: false, json: false };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === "--no-ai") {
      flags.noAi = true;
      i++;
      continue;
    }
    if (a === "--preview") {
      flags.previewOnly = true;
      i++;
      continue;
    }
    if (a === "--yes" || a === "-y") {
      flags.yesFlag = true;
      i++;
      continue;
    }
    if (a === "--json") {
      flags.json = true;
      i++;
      continue;
    }
    if (a === "--") {
      i++;
      break;
    }
    if (a.startsWith("-")) {
      console.error(`Flag desconhecida: ${a}`);
      process.exit(1);
    }
    break;
  }
  return { flags, rest: argv.slice(i) };
}

/**
 * @param {string[]} args
 * @returns {Promise<number>}
 */
export async function runCommand(args) {
  const { flags, rest } = parseGlobalFlags(args);
  if (rest.length === 0) {
    console.error(
      "Informe um comando para executar (ex.: devdoctor npm run build). Flags globais: --preview, --no-ai, --yes, --json"
    );
    process.exit(1);
  }
  const command = rest[0];
  const commandArgs = rest.slice(1);
  return runUserCommand(command, commandArgs, flags);
}
