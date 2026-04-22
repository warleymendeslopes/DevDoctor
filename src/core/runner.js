import { spawn } from "node:child_process";
import { hasError, extractErrorText } from "./parser.js";
import { sanitizeForAi, buildPreviewPayload } from "./privacy.js";
import { loadProjectContext } from "./context.js";
import { saveFailureRecord, buildFailureId } from "./lastFailure.js";
import { confirmSendIfRequired } from "../utils/confirmSend.js";
import { getResolvedAiConfig } from "../utils/config.js";
import { analyzeFailureRecord, inspectFailureRecord } from "./analyzer.js";
import { buildErrorSignature } from "./signature.js";
import { printJson, buildCommandResultPayload } from "./output.js";
import {
  printAiExplanation,
  printAiError,
  printCachedAnalysis,
  printDeterministicHints,
  startAiLoading,
  stopAiLoading
} from "./formatter.js";

const MAX_BUFFER_SIZE = 12000;

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

/**
 * @typedef {Object} RunOptions
 * @property {boolean} [noAi]
 * @property {boolean} [previewOnly]
 * @property {boolean} [yesFlag]
 * @property {boolean} [json]
 */

export async function runUserCommand(command, commandArgs = [], runOptions = {}) {
  const noAi = Boolean(runOptions.noAi);
  const previewOnly = Boolean(runOptions.previewOnly);
  const yesFlag = Boolean(runOptions.yesFlag);
  const json = Boolean(runOptions.json);

  return new Promise((resolve) => {
    const child = spawn(command, commandArgs, {
      shell: false,
      env: process.env
    });

    let outputBuffer = "";

    const handleChunk = (text, writer) => {
      outputBuffer += text;
      if (outputBuffer.length > MAX_BUFFER_SIZE) {
        outputBuffer = outputBuffer.slice(-MAX_BUFFER_SIZE);
      }
      if (!json) {
        writer.write(text);
      }
    };

    child.stdout.on("data", (chunk) => {
      handleChunk(chunk.toString(), process.stdout);
    });

    child.stderr.on("data", (chunk) => {
      handleChunk(chunk.toString(), process.stderr);
    });

    child.on("close", async (code) => {
      const exitCode = code ?? 0;
      let failureRecord = null;
      let analysis = null;

      try {
        if (hasError(outputBuffer)) {
          const errorRaw = extractErrorText(outputBuffer);
          const errorSan = sanitizeForAi(errorRaw);
          const projectContext = await loadProjectContext();
          const cfg = await getResolvedAiConfig();

          failureRecord = {
            id: buildFailureId(),
            cwd: process.cwd(),
            command,
            commandArgs,
            exitCode,
            errorTextSanitized: errorSan,
            projectContextSnapshot: projectContext,
            signature: buildErrorSignature(errorSan),
            provider: cfg.provider,
            model:
              cfg.provider === "gemini"
                ? cfg.geminiModel
                : cfg.provider === "ollama"
                  ? cfg.ollamaModel
                  : "gpt-4o-mini"
          };

          if (previewOnly) {
            if (json) {
              printJson(
                buildCommandResultPayload({
                  ok: exitCode === 0,
                  mode: "run",
                  command,
                  commandArgs,
                  exitCode,
                  failure: failureRecord,
                  meta: {
                    preview: buildPreviewPayload(errorSan, projectContext)
                  }
                })
              );
            } else {
              console.log("");
              console.log(buildPreviewPayload(errorSan, projectContext));
              console.log(
                "\n(Modo --preview: nada foi enviado ao provedor de IA. Remova --preview para enviar.)"
              );
            }
            failureRecord.analysis = {
              source: "none",
              summary: "",
              suggestions: [],
              aiResult: null,
              deterministicHints: null,
              reusedFromId: null
            };
            await saveFailureRecord(failureRecord);
            resolve(exitCode);
            return;
          }

          analysis = await inspectFailureRecord(failureRecord);
          if (!analysis && !noAi) {
            const ok = await confirmSendIfRequired(yesFlag);
            if (!ok) {
              if (!json) {
                console.log("\nDevDoctor: envio para IA cancelado.");
              }
              failureRecord.analysis = {
                source: "none",
                summary: "",
                suggestions: [],
                aiResult: null,
                deterministicHints: null,
                reusedFromId: null
              };
              await saveFailureRecord(failureRecord);
              if (json) {
                printJson(
                  buildCommandResultPayload({
                    ok: false,
                    mode: "run",
                    command,
                    commandArgs,
                    exitCode,
                    failure: failureRecord,
                    error: new Error("Envio para IA cancelado.")
                  })
                );
              }
              resolve(exitCode);
              return;
            }

            startAiLoading();
            try {
              analysis = await analyzeFailureRecord(failureRecord, { useCache: true });
            } finally {
              stopAiLoading();
            }
          }

          if (!analysis) {
            analysis = {
              source: "none",
              summary: "",
              suggestions: [],
              aiResult: null,
              deterministicHints: null,
              reusedFromId: null
            };
          }

          failureRecord.analysis = analysis;
          await saveFailureRecord(failureRecord);

          if (json) {
            printJson(
              buildCommandResultPayload({
                ok: exitCode === 0,
                mode: "run",
                command,
                commandArgs,
                exitCode,
                failure: failureRecord,
                analysis
              })
            );
          } else if (noAi && analysis.source === "none") {
            console.log(
              "\nDevDoctor: erro detectado; explicacao com IA desativada (--no-ai). Use `devdoctor explain` para analisar a ultima falha."
            );
          } else {
            printHumanAnalysis(analysis);
          }
        } else if (json) {
          printJson(
            buildCommandResultPayload({
              ok: exitCode === 0,
              mode: "run",
              command,
              commandArgs,
              exitCode
            })
          );
        }
      } catch (error) {
        if (json) {
          printJson(
            buildCommandResultPayload({
              ok: false,
              mode: "run",
              command,
              commandArgs,
              exitCode,
              failure: failureRecord,
              analysis,
              error
            })
          );
        } else {
          printAiError(error?.message || String(error));
        }
      }

      resolve(exitCode);
    });

    child.on("error", (error) => {
      if (json) {
        printJson(
          buildCommandResultPayload({
            ok: false,
            mode: "run",
            command,
            commandArgs,
            exitCode: 1,
            error
          })
        );
      } else {
        console.error(`Falha ao iniciar comando: ${error.message}`);
      }
      resolve(1);
    });
  });
}
