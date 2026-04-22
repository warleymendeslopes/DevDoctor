import { readFailureById } from "../core/lastFailure.js";
import { runUserCommand } from "../core/runner.js";

function parseRepeatFlags(argv) {
  const flags = { noAi: false, previewOnly: false, yesFlag: false, json: false };
  const rest = [];

  for (const arg of argv) {
    if (arg === "--no-ai") {
      flags.noAi = true;
      continue;
    }
    if (arg === "--preview") {
      flags.previewOnly = true;
      continue;
    }
    if (arg === "--yes" || arg === "-y") {
      flags.yesFlag = true;
      continue;
    }
    if (arg === "--json") {
      flags.json = true;
      continue;
    }
    if (arg.startsWith("-")) {
      console.error(`Flag desconhecida: ${arg}`);
      return null;
    }
    rest.push(arg);
  }

  return { flags, rest };
}

export async function repeatCommand(argv) {
  const parsed = parseRepeatFlags(argv);
  if (!parsed) {
    return 1;
  }

  const { flags, rest } = parsed;
  if (rest.length !== 1) {
    console.error("Uso: devdoctor repeat <id> [--preview] [--no-ai] [--yes] [--json]");
    return 1;
  }

  const record = await readFailureById(rest[0]);
  if (!record) {
    console.error(`Falha ${rest[0]} nao encontrada no historico.`);
    return 1;
  }

  return runUserCommand(record.command, record.commandArgs || [], flags);
}
