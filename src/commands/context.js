import { buildGeneratedContext } from "../core/contextBuilder.js";

/**
 * @param {string[]} argv
 * @returns {Promise<number>}
 */
export async function contextCommand(argv) {
  if (argv.length > 0) {
    console.error("Uso: devdoctor context");
    return 1;
  }

  try {
    const result = await buildGeneratedContext(process.cwd());
    console.log(
      `Contexto atualizado em .devdoctor/context.generated.md (${result.bytes} bytes, hash ${result.hash}).`
    );
    return 0;
  } catch (error) {
    console.error(`Falha ao atualizar contexto: ${error.message}`);
    return 1;
  }
}
