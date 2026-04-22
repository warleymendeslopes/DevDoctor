import { testAiConnection } from "../core/ai.js";
import { loadNormalizedConfig } from "../utils/config.js";
import { printJson } from "../core/output.js";
import {
  startAiLoading,
  stopAiLoading,
  printAiError
} from "../core/formatter.js";

function isSetupIssue(message) {
  const lower = message.toLowerCase();
  return (
    lower.includes("api key") ||
    lower.includes("nao encontrada") ||
    lower.includes("devdoctor setup") ||
    lower.includes("(401)") ||
    lower.includes("invalid api key") ||
    lower.includes("(403)")
  );
}

function isNetworkIssue(message) {
  const lower = message.toLowerCase();
  return (
    lower.includes("enotfound") ||
    lower.includes("eaddrinfo") ||
    lower.includes("dns") ||
    lower.includes("failed to fetch") ||
    lower.includes("getaddrinfo") ||
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("connection refused")
  );
}

function isOllamaConnectionIssue(provider, message) {
  const lower = message.toLowerCase();
  return (
    provider === "ollama" &&
    (lower.includes("econnrefused") ||
      lower.includes("connection refused") ||
      lower.includes("fetch failed"))
  );
}

/**
 * @param {string[]} argv
 * @returns {Promise<number>}
 */
export async function testCommand(argv) {
  const json = argv.includes("--json");
  const rest = argv.filter((arg) => arg !== "--json");
  if (rest.length > 0) {
    console.error("Uso: devdoctor test [--json]");
    return 1;
  }

  startAiLoading();
  try {
    const result = await testAiConnection();
    if (json) {
      printJson({
        ok: true,
        mode: "test",
        provider: result.provider,
        model: result.model
      });
    } else {
      console.log("");
      console.log(
        `DevDoctor test: ok, modelo conectado ao projeto (${result.provider}/${result.model}).`
      );
    }
    return 0;
  } catch (error) {
    const message = error?.message || String(error);
    if (json) {
      printJson({
        ok: false,
        mode: "test",
        error: { message }
      });
      return 1;
    }
    printAiError(message);

    const cfg = await loadNormalizedConfig();
    const provider = cfg.provider || "openai";
    if (isOllamaConnectionIssue(provider, message)) {
      console.error(
        "Dica: confira se o Ollama esta rodando (ex.: `ollama serve`) e se a URL em `devdoctor setup` esta correta."
      );
    } else if (isSetupIssue(message)) {
      console.error(
        'Dica: rode "devdoctor setup" para configurar credenciais do provedor de IA.'
      );
    } else if (isNetworkIssue(message)) {
      console.error(
        "Dica: verifique sua conexao com a internet (proxy/firewall) e tente novamente."
      );
    } else {
      console.error("Dica: tente novamente. Se persistir, rode `devdoctor setup`.");
    }
    return 1;
  } finally {
    stopAiLoading();
  }
}
