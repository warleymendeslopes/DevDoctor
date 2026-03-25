/**
 * Sanitiza texto antes de enviar a um provedor de IA.
 * Nao substitui revisao humana em ambientes altamente sensiveis.
 */

const REPLACEMENT = "[REDACTED]";

function redactPattern(text, regex, replace = REPLACEMENT) {
  return text.replace(regex, replace);
}

/**
 * @param {string} text
 * @returns {string}
 */
export function sanitizeForAi(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  let out = text;

  // OpenAI-style keys
  out = redactPattern(out, /\bsk-[a-zA-Z0-9]{20,}\b/g);
  // Google AI Studio
  out = redactPattern(out, /\bAIza[a-zA-Z0-9_-]{30,}\b/g);
  // Bearer / basic tokens em linhas
  out = redactPattern(out, /\bBearer\s+[^\s'"]+/gi);
  out = redactPattern(out, /\bbasic\s+[a-z0-9+/=]{20,}/gi);
  // AWS-style
  out = redactPattern(out, /\bAKIA[0-9A-Z]{16}\b/g);
  // Senhas em URLs ou flags
  out = redactPattern(out, /([?&])(password|passwd|pwd|token|secret|apikey|api_key)=([^&\s]+)/gi, `$1$2=${REPLACEMENT}`);
  // PEM blocks
  out = redactPattern(out, /-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g, `[${REPLACEMENT}]`);
  // Long base64-like chunks (possiveis credenciais)
  out = redactPattern(out, /\b[a-zA-Z0-9+/]{40,}={0,2}\b/g, (m) =>
    m.length >= 48 ? REPLACEMENT : m
  );

  // Caminhos absolutos comuns do usuario (reduz vazamento de estrutura)
  out = redactPattern(out, /\/Users\/[^/\s]+/g, "/Users/[user]");
  out = redactPattern(out, /C:\\Users\\[^\\\s]+/gi, "C:\\Users\\[user]");

  return out;
}

/**
 * Monta payload legivel para --preview (mesmo texto que seguiria para o prompt).
 * @param {string} errorBlock
 * @param {string} projectContext
 */
export function buildPreviewPayload(errorBlock, projectContext = "") {
  const parts = [];
  parts.push("=== Texto do erro (apos sanitizacao) ===\n");
  parts.push(sanitizeForAi(errorBlock));
  if (projectContext?.trim()) {
    parts.push("\n\n=== Contexto do projeto (resumo) ===\n");
    parts.push(projectContext.trim());
  }
  return parts.join("");
}
