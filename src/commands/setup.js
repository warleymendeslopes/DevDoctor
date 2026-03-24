import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  saveConfig,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL
} from "../utils/config.js";

/**
 * Le uma linha sem ecoar caracteres (TTY). Em stdin nao-TTY, usa readline visivel.
 */
async function readSecretLine(prompt) {
  output.write(prompt);

  if (!input.isTTY) {
    const rl = readline.createInterface({ input, output });
    try {
      return (await rl.question("")).trim();
    } finally {
      rl.close();
    }
  }

  return new Promise((resolve) => {
    let buffer = "";

    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");

    const cleanup = () => {
      input.setRawMode(false);
      input.removeListener("data", onData);
    };

    const onData = (chunk) => {
      for (const ch of chunk) {
        const code = ch.charCodeAt(0);

        if (ch === "\r" || ch === "\n") {
          cleanup();
          output.write("\n");
          resolve(buffer);
          return;
        }

        if (code === 3) {
          cleanup();
          process.exit(130);
        }

        if (code === 127 || code === 8) {
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
          }
          continue;
        }

        if (code >= 32) {
          buffer += ch;
        }
      }
    };

    input.on("data", onData);
  });
}

function parseProviderChoice(raw) {
  const t = raw.trim().toLowerCase();
  if (t === "1" || t === "gpt" || t === "openai") return "openai";
  if (t === "2" || t === "gemini") return "gemini";
  if (t === "3" || t === "ollama") return "ollama";
  return null;
}

export async function setupCommand() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log("");
    console.log("Provedor de IA para explicar erros:");
    console.log("  1) OpenAI (GPT)");
    console.log("  2) Google Gemini");
    console.log("  3) Ollama (local)");
    console.log("");

    const choiceRaw = await rl.question("Escolha (1, 2 ou 3): ");
    const provider = parseProviderChoice(choiceRaw);

    if (!provider) {
      console.error("Opcao invalida.");
      process.exit(1);
    }

    rl.close();

    if (provider === "openai") {
      const apiKey = (await readSecretLine("Digite sua OpenAI API key: ")).trim();
      if (!apiKey.startsWith("sk-")) {
        console.error('API key invalida. Ela deve comecar com "sk-".');
        process.exit(1);
      }
      await saveConfig({
        provider: "openai",
        openaiApiKey: apiKey
      });
      console.log("Config salva em ~/.devdoctor/config.json (OpenAI).");
      return;
    }

    if (provider === "gemini") {
      const apiKey = (await readSecretLine("Digite sua Gemini API key (Google AI Studio): ")).trim();
      if (!apiKey.startsWith("AIza") || apiKey.length < 30) {
        console.error(
          "API key invalida. Chaves do Google AI Studio costumam comecar com AIza e ter tamanho adequado."
        );
        process.exit(1);
      }

      const rl2 = readline.createInterface({ input, output });
      try {
        const modelRaw = await rl2.question(
          `Modelo Gemini [${DEFAULT_GEMINI_MODEL}]: `
        );
        const geminiModel = modelRaw.trim() || DEFAULT_GEMINI_MODEL;
        await saveConfig({
          provider: "gemini",
          geminiApiKey: apiKey,
          geminiModel
        });
        console.log("Config salva em ~/.devdoctor/config.json (Gemini).");
      } finally {
        rl2.close();
      }
      return;
    }

    const rl3 = readline.createInterface({ input, output });
    try {
      const urlRaw = await rl3.question(
        `URL base do Ollama [${DEFAULT_OLLAMA_BASE_URL}]: `
      );
      const ollamaBaseUrl = (urlRaw.trim() || DEFAULT_OLLAMA_BASE_URL).replace(
        /\/$/,
        ""
      );

      const modelRaw = await rl3.question(
        `Nome do modelo Ollama [${DEFAULT_OLLAMA_MODEL}]: `
      );
      const ollamaModel = modelRaw.trim() || DEFAULT_OLLAMA_MODEL;

      await saveConfig({
        provider: "ollama",
        ollamaBaseUrl,
        ollamaModel
      });
      console.log("Config salva em ~/.devdoctor/config.json (Ollama).");
    } finally {
      rl3.close();
    }
  } catch (error) {
    console.error(`Erro no setup: ${error.message}`);
    process.exit(1);
  }
}
