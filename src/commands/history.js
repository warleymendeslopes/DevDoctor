import { readFailureHistory } from "../core/lastFailure.js";
import { printHistory } from "../core/formatter.js";
import { printJson } from "../core/output.js";

export async function historyCommand(argv) {
  const json = argv.includes("--json");
  const rest = argv.filter((arg) => arg !== "--json");
  if (rest.length > 0) {
    console.error("Uso: devdoctor history [--json]");
    return 1;
  }

  const history = await readFailureHistory(20);
  if (json) {
    printJson({
      ok: true,
      mode: "history",
      items: history
    });
  } else {
    printHistory(history);
  }
  return 0;
}
