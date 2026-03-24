import { spawn } from "node:child_process";
import { hasError, extractErrorText } from "./parser.js";
import { explainErrorWithAI } from "./ai.js";
import { loadNormalizedConfig } from "../utils/config.js";
import {
  printAiExplanation,
  printAiError,
  startAiLoading,
  stopAiLoading
} from "./formatter.js";

const MAX_BUFFER_SIZE = 12000;
let lastAnalyzedSignature = "";
let isAnalyzing = false;
let currentAnalysis = null;

function buildErrorSignature(errorText) {
  return errorText
    .split("\n")
    .slice(0, 8)
    .join("\n")
    .trim();
}

export async function runUserCommand(command, commandArgs = []) {
  return new Promise((resolve) => {
    const child = spawn(command, commandArgs, {
      shell: false,
      env: process.env
    });

    let outputBuffer = "";

    const tryAnalyzeError = () => {
      if (isAnalyzing) return currentAnalysis;
      if (!hasError(outputBuffer)) return;

      const errorText = extractErrorText(outputBuffer);
      if (!errorText) return;

      const signature = buildErrorSignature(errorText);
      if (!signature || signature === lastAnalyzedSignature) return;

      lastAnalyzedSignature = signature;
      isAnalyzing = true;
      currentAnalysis = (async () => {
        startAiLoading();
        try {
          const aiResult = await explainErrorWithAI(errorText);
          printAiExplanation(aiResult);
        } catch (error) {
          const message = error?.message || String(error);
          printAiError(message);

          const lower = message.toLowerCase();
          const cfg = await loadNormalizedConfig();
          const provider = cfg.provider || "openai";

          const suggestsSetup =
            lower.includes("api key") ||
            lower.includes("nao encontrada") ||
            lower.includes("devdoctor setup") ||
            lower.includes("(401)") ||
            lower.includes(" 401") ||
            lower.includes("invalid api key") ||
            lower.includes("(403)") ||
            lower.includes("permission denied");

          const suggestsNetwork =
            lower.includes("enotfound") ||
            lower.includes("eaddrinfo") ||
            lower.includes("dns") ||
            lower.includes("failed to fetch") ||
            lower.includes("getaddrinfo") ||
            lower.includes("network") ||
            lower.includes("econnrefused") ||
            lower.includes("connection refused");

          const suggestsOllamaLocal =
            provider === "ollama" &&
            (lower.includes("econnrefused") ||
              lower.includes("connection refused") ||
              lower.includes("fetch failed"));

          if (suggestsOllamaLocal) {
            console.error(
              'Dica: confira se o Ollama esta rodando (ex.: `ollama serve`) e se a URL em `devdoctor setup` esta correta.'
            );
          } else if (suggestsSetup) {
            console.error(
              'Dica: rode "devdoctor setup" para configurar credenciais do provedor de IA.'
            );
          } else if (suggestsNetwork) {
            console.error(
              "Dica: verifique sua conexao com a internet (proxy/firewall) e tente novamente."
            );
          } else {
            console.error("Dica: tente novamente. Se persistir, rode `devdoctor setup`.");
          }
        } finally {
          stopAiLoading();
          isAnalyzing = false;
          currentAnalysis = null;
        }
      })();

      return currentAnalysis;
    };

    const handleChunk = (text, writer) => {
      outputBuffer += text;
      if (outputBuffer.length > MAX_BUFFER_SIZE) {
        outputBuffer = outputBuffer.slice(-MAX_BUFFER_SIZE);
      }

      writer.write(text);
      void tryAnalyzeError();
    };

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      handleChunk(text, process.stdout);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      handleChunk(text, process.stderr);
    });

    child.on("close", async (code) => {
      await tryAnalyzeError();
      if (currentAnalysis) {
        await currentAnalysis;
      }
      resolve(code ?? 0);
    });

    child.on("error", (error) => {
      console.error(`Falha ao iniciar comando: ${error.message}`);
      resolve(1);
    });
  });
}
