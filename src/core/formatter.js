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
