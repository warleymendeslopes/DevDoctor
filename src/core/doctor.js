import { promises as fs } from "node:fs";
import { join } from "node:path";
import fetch from "node-fetch";
import { loadNormalizedConfig, getResolvedAiConfig } from "../utils/config.js";
import { testAiConnection } from "./ai.js";

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function buildCheck(checkId, status, message, suggestion = "") {
  return { checkId, status, message, suggestion };
}

async function readPackageJson(cwd) {
  try {
    const raw = await fs.readFile(join(cwd, "package.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function inferPackageManager(lockfiles) {
  if (lockfiles["package-lock.json"]) return "npm";
  if (lockfiles["pnpm-lock.yaml"]) return "pnpm";
  if (lockfiles["yarn.lock"]) return "yarn";
  if (lockfiles["bun.lockb"] || lockfiles["bun.lock"]) return "bun";
  return "unknown";
}

async function checkOllama(baseUrl) {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`);
    if (!response.ok) {
      return buildCheck(
        "ollama",
        "fail",
        `Ollama respondeu com status ${response.status}.`,
        "Confirme se o servidor Ollama esta ativo e se a URL configurada esta correta."
      );
    }
    return buildCheck("ollama", "ok", "Ollama respondeu normalmente.");
  } catch (error) {
    return buildCheck(
      "ollama",
      "fail",
      `Nao foi possivel conectar ao Ollama: ${error.message}`,
      "Suba o Ollama com `ollama serve` ou ajuste a URL no setup."
    );
  }
}

export async function runDoctor(cwd = process.cwd()) {
  const checks = [];
  const pkg = await readPackageJson(cwd);
  const cfg = await loadNormalizedConfig();
  const resolved = await getResolvedAiConfig();

  checks.push(
    buildCheck(
      "node-version",
      Number.parseInt(process.versions.node.split(".")[0], 10) >= 18 ? "ok" : "fail",
      `Node atual: ${process.versions.node}`,
      "Use Node 18+ para executar o DevDoctor."
    )
  );

  if (!pkg) {
    checks.push(
      buildCheck(
        "package-json",
        "warn",
        "package.json nao encontrado no diretorio atual.",
        "Entre na raiz do projeto antes de rodar o doctor para checks mais precisos."
      )
    );
  } else {
    checks.push(buildCheck("package-json", "ok", "package.json encontrado."));

    if (pkg.engines?.node) {
      checks.push(
        buildCheck(
          "engines-node",
          "ok",
          `Projeto declara engines.node=${pkg.engines.node}.`
        )
      );
    } else {
      checks.push(
        buildCheck(
          "engines-node",
          "warn",
          "Projeto nao declara engines.node.",
          "Adicionar engines.node ajuda a reduzir divergencias de ambiente."
        )
      );
    }
  }

  const lockfiles = {
    "package-lock.json": await fileExists(join(cwd, "package-lock.json")),
    "pnpm-lock.yaml": await fileExists(join(cwd, "pnpm-lock.yaml")),
    "yarn.lock": await fileExists(join(cwd, "yarn.lock")),
    "bun.lock": await fileExists(join(cwd, "bun.lock")),
    "bun.lockb": await fileExists(join(cwd, "bun.lockb"))
  };
  const packageManager = inferPackageManager(lockfiles);
  checks.push(
    buildCheck(
      "package-manager",
      packageManager === "unknown" ? "warn" : "ok",
      `Gerenciador inferido: ${packageManager}.`,
      packageManager === "unknown"
        ? "Mantenha um lockfile versionado para builds reprodutiveis."
        : ""
    )
  );

  const hasNodeModules = await fileExists(join(cwd, "node_modules"));
  checks.push(
    buildCheck(
      "node-modules",
      hasNodeModules ? "ok" : "warn",
      hasNodeModules ? "node_modules presente." : "node_modules ausente.",
      "Se o projeto depende de pacotes instalados localmente, rode a instalacao antes de testar."
    )
  );

  const manualContext = await fileExists(join(cwd, ".devdoctor/context.md"));
  const generatedContext = await fileExists(join(cwd, ".devdoctor/context.generated.md"));
  checks.push(
    buildCheck(
      "context-files",
      manualContext || generatedContext ? "ok" : "warn",
      manualContext || generatedContext
        ? "Arquivos de contexto do DevDoctor encontrados."
        : "Nenhum arquivo de contexto do DevDoctor foi encontrado.",
      "Use `devdoctor context` e, se quiser, mantenha `.devdoctor/context.md` com regras do projeto."
    )
  );

  checks.push(
    buildCheck(
      "provider-config",
      resolved.provider ? "ok" : "warn",
      `Provider configurado: ${resolved.provider || cfg.provider || "openai"}.`
    )
  );

  if (resolved.provider === "openai") {
    checks.push(
      buildCheck(
        "provider-credentials",
        resolved.openaiApiKey ? "ok" : "fail",
        resolved.openaiApiKey
          ? "OPENAI_API_KEY/config presente."
          : "OpenAI API key ausente.",
        'Rode `devdoctor setup` ou defina `OPENAI_API_KEY`.'
      )
    );
  } else if (resolved.provider === "gemini") {
    checks.push(
      buildCheck(
        "provider-credentials",
        resolved.geminiApiKey ? "ok" : "fail",
        resolved.geminiApiKey
          ? "Gemini API key/config presente."
          : "Gemini API key ausente.",
        'Rode `devdoctor setup` ou defina `GEMINI_API_KEY`/`GOOGLE_API_KEY`.'
      )
    );
  } else {
    checks.push(
      buildCheck(
        "provider-credentials",
        resolved.ollamaBaseUrl ? "ok" : "warn",
        `Ollama configurado em ${resolved.ollamaBaseUrl}.`
      )
    );
    checks.push(await checkOllama(resolved.ollamaBaseUrl));
  }

  try {
    const connection = await testAiConnection();
    checks.push(
      buildCheck(
        "provider-connection",
        "ok",
        `Conexao com provider ok (${connection.provider}/${connection.model}).`
      )
    );
  } catch (error) {
    checks.push(
      buildCheck(
        "provider-connection",
        "warn",
        `Falha no teste de conectividade: ${error.message}`,
        "Verifique credenciais, rede ou disponibilidade do provider."
      )
    );
  }

  return {
    cwd,
    provider: resolved.provider,
    packageManager,
    checks
  };
}
