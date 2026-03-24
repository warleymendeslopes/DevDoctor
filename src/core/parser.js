// Detecao por linha para evitar falsos positivos de substrings amplas.
// O objetivo e ser simples e util no MVP, nao cobrir 100% dos casos.
const ERROR_LINE_REGEXES = [
  /\b(TypeError|ReferenceError|SyntaxError)\b/,
  /^Error\b.*:.*$/,
  /^Error\s+\[/,
  /^Error\s+\(/,
  /(^|[^A-Za-z0-9_])Error\s+\(/,
  /\bException\b/,
  /\bTraceback\b/
];

function isErrorLine(line) {
  return ERROR_LINE_REGEXES.some((re) => re.test(line));
}

export function hasError(outputText) {
  const lines = outputText.split(/\r?\n/);
  return lines.some((line) => isErrorLine(line));
}

export function extractErrorText(outputText) {
  if (!hasError(outputText)) return "";

  const lines = outputText.split(/\r?\n/);
  let lastIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (isErrorLine(lines[i])) lastIndex = i;
  }

  const errorSlice = lastIndex >= 0 ? lines.slice(lastIndex).join("\n") : "";
  return errorSlice.trim().slice(-6000);
}
