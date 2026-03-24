#!/usr/bin/env node

import { setupCommand } from "../src/commands/setup.js";
import { runCommand } from "../src/commands/run.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Uso: devdoctor <comando>");
    console.log("Exemplos:");
    console.log("  devdoctor setup");
    console.log("  devdoctor npm run dev");
    process.exit(1);
  }

  if (args[0] === "setup") {
    await setupCommand();
    return;
  }

  const exitCode = await runCommand(args);
  process.exit(exitCode);
}

main().catch((error) => {
  console.error("Erro ao executar DevDoctor:", error.message);
  process.exit(1);
});
