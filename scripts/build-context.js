#!/usr/bin/env node

import { buildGeneratedContext } from "../src/core/contextBuilder.js";

async function main() {
  const result = await buildGeneratedContext(process.cwd());
  console.log(
    `Contexto gerado em ${result.outputPath} (${result.bytes} bytes, hash ${result.hash}).`
  );
}

main().catch((error) => {
  console.error(`Falha ao gerar contexto: ${error.message}`);
  process.exit(1);
});
