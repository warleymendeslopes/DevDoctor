import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/**
 * Quando DEVDOCTOR_CONFIRM_SEND=1, pede confirmacao antes de enviar ao provedor.
 * @param {boolean} yesFlag
 * @returns {Promise<boolean>}
 */
export async function confirmSendIfRequired(yesFlag) {
  if (yesFlag) {
    return true;
  }
  if (process.env.DEVDOCTOR_CONFIRM_SEND !== "1") {
    return true;
  }

  const rl = readline.createInterface({ input, output });
  try {
    const ans = await rl.question(
      "DevDoctor: enviar texto sanitizado para o provedor de IA? [y/N] "
    );
    const t = ans.trim().toLowerCase();
    return t === "y" || t === "yes" || t === "s" || t === "sim";
  } finally {
    rl.close();
  }
}
