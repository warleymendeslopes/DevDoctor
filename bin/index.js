#!/usr/bin/env node

import { setupCommand } from "../src/commands/setup.js";
import { runCommand } from "../src/commands/run.js";
import { explainCommand } from "../src/commands/explain.js";
import { testCommand } from "../src/commands/test.js";
import { contextCommand } from "../src/commands/context.js";
import { historyCommand } from "../src/commands/history.js";
import { repeatCommand } from "../src/commands/repeat.js";
import { doctorCommand } from "../src/commands/doctor.js";
import { getVersion } from "../src/utils/version.js";

function printUsage() {
  console.log(`DevDoctor — executa comandos e explica erros de terminal com IA.

Uso:
  devdoctor <comando> [args...]
  devdoctor [--preview] [--no-ai] [--yes] -- <comando> [args...]

Comandos:
  devdoctor setup              Configura OpenAI, Gemini ou Ollama
  devdoctor explain [last|id]  Explica uma falha salva
  devdoctor history            Lista falhas recentes
  devdoctor repeat <id>        Reroda o comando salvo no historico
  devdoctor test               Testa conexao com o provedor/modelo configurado
  devdoctor doctor             Diagnostico local do ambiente do projeto
  devdoctor context            Regenera o contexto automatico para IA

Flags globais (antes do comando):
  --preview   Mostra o que seria enviado ao provedor (texto sanitizado) e nao chama a IA
  --no-ai     Nao chama a IA ao detectar erro (ainda salva a falha para \`explain\`)
  --yes, -y   Confirma envio quando DEVDOCTOR_CONFIRM_SEND=1
  --json      Emite saida estruturada para CI/integracoes

Variaveis:
  DEVDOCTOR_CONFIRM_SEND=1   Pede confirmacao antes de enviar ao provedor

Exemplos:
  devdoctor npm run build
  devdoctor --preview npm test
  devdoctor explain

Versao: ${getVersion()}
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  if (args[0] === "--version" || args[0] === "-v") {
    console.log(getVersion());
    return;
  }

  if (args[0] === "--help" || args[0] === "-h") {
    printUsage();
    return;
  }

  if (args[0] === "setup") {
    await setupCommand();
    return;
  }

  if (args[0] === "explain") {
    const code = await explainCommand(args.slice(1));
    process.exit(code);
  }

  if (args[0] === "test") {
    const code = await testCommand(args.slice(1));
    process.exit(code);
  }

  if (args[0] === "history") {
    const code = await historyCommand(args.slice(1));
    process.exit(code);
  }

  if (args[0] === "repeat") {
    const code = await repeatCommand(args.slice(1));
    process.exit(code);
  }

  if (args[0] === "doctor") {
    const code = await doctorCommand(args.slice(1));
    process.exit(code);
  }

  if (args[0] === "context") {
    const code = await contextCommand(args.slice(1));
    process.exit(code);
  }

  const exitCode = await runCommand(args);
  process.exit(exitCode);
}

main().catch((error) => {
  console.error("Erro ao executar DevDoctor:", error.message);
  process.exit(1);
});
