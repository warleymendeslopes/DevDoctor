import fetch from "node-fetch";
import { getResolvedAiConfig } from "../utils/config.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const AI_REQUEST_TIMEOUT_MS = 15000;

function defaultResponse() {
  return {
    explanation: "Nao foi possivel gerar explicacao detalhada.",
    causes: [],
    solution: "Verifique o erro original e tente novamente.",
    example: ""
  };
}

function buildPrompt(errorText) {
  return `
Voce e um assistente que explica erros de terminal de forma simples.
Responda somente em JSON valido, sem markdown, com este formato:
{
  "explanation": "",
  "causes": [],
  "solution": "",
  "example": ""
}

Erro capturado:
${errorText}
`.trim();
}

function parseJsonFromContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    const isAbort =
      error?.name === "AbortError" || error?.cause?.name === "AbortError";
    if (isAbort) {
      throw new Error("Tempo limite da IA excedido. Tente novamente.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function mapToResult(parsed) {
  if (!parsed) {
    return defaultResponse();
  }
  return {
    explanation: parsed.explanation || defaultResponse().explanation,
    causes: Array.isArray(parsed.causes) ? parsed.causes : [],
    solution: parsed.solution || defaultResponse().solution,
    example: parsed.example || ""
  };
}

async function explainOpenAI(cfg, errorText) {
  if (!cfg.openaiApiKey) {
    throw new Error(
      'OpenAI API key nao encontrada. Defina OPENAI_API_KEY ou rode "devdoctor setup".'
    );
  }

  const response = await fetchWithTimeout(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.openaiApiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: buildPrompt(errorText)
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Falha na API da OpenAI (${response.status}): ${responseText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return mapToResult(parseJsonFromContent(content));
}

async function explainGemini(cfg, errorText) {
  if (!cfg.geminiApiKey) {
    throw new Error(
      'Gemini API key nao encontrada. Defina GEMINI_API_KEY (ou GOOGLE_API_KEY) ou rode "devdoctor setup".'
    );
  }

  const model = cfg.geminiModel;
  const key = encodeURIComponent(cfg.geminiApiKey);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${key}`;

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: buildPrompt(errorText) }]
        }
      ],
      generationConfig: {
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Falha na API do Gemini (${response.status}): ${responseText}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return mapToResult(parseJsonFromContent(content));
}

async function explainOllama(cfg, errorText) {
  const base = cfg.ollamaBaseUrl.replace(/\/$/, "");
  const url = `${base}/api/chat`;

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: cfg.ollamaModel,
      messages: [
        {
          role: "user",
          content: buildPrompt(errorText)
        }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Falha no Ollama (${response.status}): ${responseText}`);
  }

  const data = await response.json();
  const content = data?.message?.content ?? "";
  return mapToResult(parseJsonFromContent(content));
}

export async function explainErrorWithAI(errorText) {
  const cfg = await getResolvedAiConfig();

  if (cfg.provider === "gemini") {
    return explainGemini(cfg, errorText);
  }

  if (cfg.provider === "ollama") {
    return explainOllama(cfg, errorText);
  }

  return explainOpenAI(cfg, errorText);
}
