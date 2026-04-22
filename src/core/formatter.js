import chalk from "chalk";

const LOADING_FRAMES = ["|", "/", "-", "\\"];
let loadingTimer = null;
let frameIndex = 0;

export function startAiLoading() {
  if (!process.stderr.isTTY || loadingTimer) {
    return;
  }

  frameIndex = 0;
  process.stderr.write(`\n${chalk.cyan("DevDoctor analisando erro com IA...")} ${LOADING_FRAMES[0]}`);

  loadingTimer = setInterval(() => {
    frameIndex = (frameIndex + 1) % LOADING_FRAMES.length;
    process.stderr.write(
      `\r${chalk.cyan("DevDoctor analisando erro com IA...")} ${LOADING_FRAMES[frameIndex]}`
    );
  }, 120);
}

export function stopAiLoading() {
  if (!loadingTimer) {
    return;
  }

  clearInterval(loadingTimer);
  loadingTimer = null;
  process.stderr.write("\r\x1b[K");
}

export function printAiExplanation(result) {
  console.log("");
  console.log(chalk.cyan.bold("=== DevDoctor: Analise de erro ==="));
  console.log("");

  console.log(chalk.yellow.bold("Explicacao"));
  console.log(result.explanation || "Sem explicacao.");
  console.log("");

  console.log(chalk.yellow.bold("Causas"));
  if (!result.causes || result.causes.length === 0) {
    console.log("- Nao foi possivel identificar causas especificas.");
  } else {
    result.causes.forEach((cause) => {
      console.log(`- ${cause}`);
    });
  }
  console.log("");

  console.log(chalk.yellow.bold("Solucao"));
  console.log(result.solution || "Sem sugestao de solucao.");
  console.log("");

  console.log(chalk.yellow.bold("Exemplo"));
  console.log(result.example || "Sem exemplo.");
  console.log("");
}

export function printAiError(message) {
  console.error(chalk.red(`DevDoctor nao conseguiu analisar com IA: ${message}`));
}

export function printDeterministicHints(hints) {
  console.log("");
  console.log(chalk.cyan.bold("=== DevDoctor: Hints conhecidos ==="));
  console.log("");

  for (const hint of hints) {
    console.log(chalk.yellow.bold(hint.title));
    console.log(hint.summary);
    if (hint.suggestions?.length) {
      console.log("");
      hint.suggestions.forEach((suggestion) => {
        console.log(`- ${suggestion}`);
      });
    }
    console.log("");
  }
}

export function printCachedAnalysis(sourceId, summary) {
  console.log("");
  console.log(chalk.cyan.bold("=== DevDoctor: Erro ja visto ==="));
  console.log("");
  console.log(`Reutilizando analise anterior${sourceId ? ` (${sourceId})` : ""}.`);
  if (summary) {
    console.log("");
    console.log(summary);
    console.log("");
  }
}

export function printHistory(records) {
  if (!records.length) {
    console.log("Nenhuma falha registrada.");
    return;
  }

  console.log("");
  console.log(chalk.cyan.bold("=== DevDoctor: Historico ==="));
  console.log("");

  for (const record of records) {
    const firstLine = (record.signature || record.errorTextSanitized || "")
      .split("\n")[0]
      .slice(0, 100);
    console.log(
      `${record.id}  ${record.savedAt}  exit=${record.exitCode ?? "?"}  source=${record.analysis?.source || "none"}`
    );
    console.log(`  ${record.command} ${(record.commandArgs || []).join(" ")}`.trim());
    if (firstLine) {
      console.log(`  ${firstLine}`);
    }
    console.log("");
  }
}

export function printDoctorResults(results) {
  console.log("");
  console.log(chalk.cyan.bold("=== DevDoctor: Doctor ==="));
  console.log("");

  for (const item of results) {
    const color =
      item.status === "ok" ? chalk.green : item.status === "warn" ? chalk.yellow : chalk.red;
    console.log(`${color(item.status.toUpperCase())} ${item.checkId}: ${item.message}`);
    if (item.suggestion) {
      console.log(`  ${item.suggestion}`);
    }
  }
  console.log("");
}
