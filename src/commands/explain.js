import { readLastFailure } from "../core/lastFailure.js";
import { explainErrorWithAI } from "../core/ai.js";
import { buildPreviewPayload } from "../core/privacy.js";
import { loadProjectContext } from "../core/context.js";
import { confirmSendIfRequired } from "../utils/confirmSend.js";
import {
  printAiExplanation,
  printAiError,
  startAiLoading,
  stopAiLoading
} from "../core/formatter.js";

/**
 * @param {string[]} argv
 */
export function parseExplainFlags(argv) {
  const flags = { noAi: false, previewOnly: false, yesFlag: false };
  const rest = [];
  for (const a of argv) {
    if (a === "--no-ai") {
      flags.noAi = true;
      continue;
    }
    if (a === "--preview") {
      flags.previewOnly = true;
      continue;
    }
    if (a === "--yes" || a === "-y") {
      flags.yesFlag = true;
      continue;
    }
    if (a.startsWith("-")) {
      console.error(`Flag desconhecida: ${a}`);
      process.exit(1);
    }
    rest.push(a);
  }
  return { flags, rest };
}

/**
 * Explica a ultima falha salva (comando `devdoctor explain`).
 * @param {string[]} argv argumentos apos `explain`
 * @returns {Promise<number>} codigo de saida
 */
export async function explainCommand(argv) {
  const { flags, rest } = parseExplainFlags(argv);
  if (rest.length > 1 || (rest.length === 1 && rest[0] !== "last")) {
    console.error("Uso: devdoctor explain [last] [--preview] [--no-ai] [--yes]");
    process.exit(1);
  }

  const last = await readLastFailure();
  if (!last) {
    console.error(
      "Nenhuma falha salva. Rode um comando com devdoctor e reproduza um erro primeiro."
    );
    process.exit(1);
  }

  const errorSan = last.errorTextSanitized;
  let projectContext = last.projectContextSnapshot || "";
  if (!projectContext && last.cwd) {
    try {
      projectContext = await loadProjectContext(last.cwd);
    } catch {
      projectContext = "";
    }
  }

  if (flags.previewOnly) {
    console.log(buildPreviewPayload(errorSan, projectContext));
    console.log("\n(Modo --preview: nada foi enviado ao provedor de IA.)");
    return 0;
  }

  if (flags.noAi) {
    console.log("Explicacao com IA desativada (--no-ai).");
    return 0;
  }

  const ok = await confirmSendIfRequired(flags.yesFlag);
  if (!ok) {
    console.log("Envio para IA cancelado.");
    return 1;
  }

  startAiLoading();
  try {
    const aiResult = await explainErrorWithAI(errorSan, { projectContext });
    printAiExplanation(aiResult);
  } catch (error) {
    printAiError(error?.message || String(error));
    return 1;
  } finally {
    stopAiLoading();
  }
  return 0;
}
