function stripVolatileTokens(text) {
  return text
    .replace(/\/Users\/\[[^\]]+\]/g, "/Users/[user]")
    .replace(/\/Users\/[^/\s]+/g, "/Users/[user]")
    .replace(/C:\\Users\\[^\\\s]+/gi, "C:\\Users\\[user]")
    .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g, "[timestamp]")
    .replace(/\b0x[a-f0-9]+\b/gi, "[hex]")
    .replace(/\b\d{5,}\b/g, "[n]")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildErrorSignature(errorText) {
  if (!errorText) {
    return "";
  }

  const normalized = stripVolatileTokens(errorText)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .join("\n");

  return normalized.slice(0, 1200);
}

export function buildShortSignatureLabel(signature) {
  if (!signature) {
    return "";
  }
  return signature.split("\n")[0].slice(0, 120);
}
