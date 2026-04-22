import { readFailureById, readLastFailure, saveFailureRecord } from "../core/lastFailure.js";
import { buildPreviewPayload } from "../core/privacy.js";
import { loadProjectContext } from "../core/context.js";
import { confirmSendIfRequired } from "../utils/confirmSend.js";
import { analyzeFailureRecord, inspectFailureRecord } from "../core/analyzer.js";
import { printJson, buildCommandResultPayload } from "../core/output.js";
import {
  printAiExplanation,
  printAiError,
  printCachedAnalysis,
  printDeterministicHints,
  startAiLoading,
  stopAiLoading
} from "../core/formatter.js";

export function parseExplainFlags(argv) {
  const flags = { noAi: false, previewOnly: false, yesFlag: false, json: false };
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
    if (a === "--json") {
      flags.json = true;
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

function isSpecialAlias(value) {
  return value === "last" || value === undefined;
}

function printHumanAnalysis(analysis) {
  if (!analysis || analysis.source === "none") {
    return;
  }

  if (analysis.source === "known-hints") {
    printDeterministicHints(analysis.deterministicHints || []);
    return;
  }

  if (analysis.source === "cached") {
    printCachedAnalysis(analysis.reusedFromId, analysis.summary);
    if (analysis.aiResult) {
      printAiExplanation(analysis.aiResult);
    } else if (analysis.deterministicHints?.length) {
      printDeterministicHints(analysis.deterministicHints);
    }
    return;
  }

  if (analysis.aiResult) {
    printAiExplanation(analysis.aiResult);
  }
}

export async function explainCommand(argv) {
  const { flags, rest } = parseExplainFlags(argv);
  if (rest.length > 1) {
    console.error("Uso: devdoctor explain [last|<id>] [--preview] [--no-ai] [--yes] [--json]");
    process.exit(1);
  }

  const lookup = rest[0];
  const record = isSpecialAlias(lookup)
    ? await readLastFailure()
    : await readFailureById(lookup);

  if (!record) {
    console.error(
      lookup && lookup !== "last"
        ? `Falha ${lookup} nao encontrada no historico.`
        : "Nenhuma falha salva. Rode um comando com devdoctor e reproduza um erro primeiro."
    );
    process.exit(1);
  }

  let projectContext = record.projectContextSnapshot || "";
  if (!projectContext && record.cwd) {
    try {
      projectContext = await loadProjectContext(record.cwd);
      record.projectContextSnapshot = projectContext;
    } catch {
      projectContext = "";
    }
  }

  if (flags.previewOnly) {
    const preview = buildPreviewPayload(record.errorTextSanitized, projectContext);
    if (flags.json) {
      printJson(
        buildCommandResultPayload({
          ok: true,
          mode: "explain",
          command: record.command,
          commandArgs: record.commandArgs,
          exitCode: record.exitCode,
          failure: record,
          analysis: null,
          meta: { preview }
        })
      );
    } else {
      console.log(preview);
      console.log("\n(Modo --preview: nada foi enviado ao provedor de IA.)");
    }
    return 0;
  }

  if (flags.noAi) {
    const localAnalysis = record.analysis?.source !== "none"
      ? record.analysis
      : await inspectFailureRecord(record);
    if (flags.json) {
      printJson(
        buildCommandResultPayload({
          ok: true,
          mode: "explain",
          command: record.command,
          commandArgs: record.commandArgs,
          exitCode: record.exitCode,
          failure: record,
          analysis: localAnalysis
        })
      );
    } else if (localAnalysis) {
      printHumanAnalysis(localAnalysis);
    } else {
      console.log("Explicacao com IA desativada (--no-ai).");
    }
    return 0;
  }

  let analysis = record.analysis?.source !== "none" ? record.analysis : await inspectFailureRecord(record);
  if (!analysis) {
    const ok = await confirmSendIfRequired(flags.yesFlag);
    if (!ok) {
      if (flags.json) {
        printJson(
          buildCommandResultPayload({
            ok: false,
            mode: "explain",
            command: record.command,
            commandArgs: record.commandArgs,
            exitCode: record.exitCode,
            failure: record,
            error: new Error("Envio para IA cancelado.")
          })
        );
      } else {
        console.log("Envio para IA cancelado.");
      }
      return 1;
    }

    startAiLoading();
    try {
      analysis = await analyzeFailureRecord(record, { useCache: true });
    } catch (error) {
      stopAiLoading();
      if (flags.json) {
        printJson(
          buildCommandResultPayload({
            ok: false,
            mode: "explain",
            command: record.command,
            commandArgs: record.commandArgs,
            exitCode: record.exitCode,
            failure: record,
            error
          })
        );
      } else {
        printAiError(error?.message || String(error));
      }
      return 1;
    } finally {
      stopAiLoading();
    }
  }

  record.analysis = analysis;
  await saveFailureRecord(record);

  if (flags.json) {
    printJson(
      buildCommandResultPayload({
        ok: true,
        mode: "explain",
        command: record.command,
        commandArgs: record.commandArgs,
        exitCode: record.exitCode,
        failure: record,
        analysis
      })
    );
  } else {
    printHumanAnalysis(analysis);
  }
  return 0;
}
