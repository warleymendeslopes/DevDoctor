import { explainErrorWithAI } from "./ai.js";
import { getDeterministicHints, buildHintsSummary } from "./hints.js";
import { findLatestFailureBySignature } from "./lastFailure.js";

function buildAiSuggestions(aiResult) {
  const suggestions = [];
  if (aiResult?.solution) {
    suggestions.push(aiResult.solution);
  }
  if (aiResult?.example) {
    suggestions.push(aiResult.example);
  }
  return suggestions.filter(Boolean);
}

export async function inspectFailureRecord(record, options = {}) {
  const { useCache = true } = options;
  const hints = getDeterministicHints(record.errorTextSanitized);
  if (hints.length > 0) {
    return {
      source: "known-hints",
      summary: buildHintsSummary(hints),
      suggestions: hints.flatMap((hint) => hint.suggestions).slice(0, 12),
      aiResult: null,
      deterministicHints: hints,
      reusedFromId: null
    };
  }

  if (useCache && record.signature) {
    const cached = await findLatestFailureBySignature(
      record.signature,
      record.cwd,
      record.id
    );
    if (cached?.analysis) {
      return {
        ...cached.analysis,
        source: "cached",
        reusedFromId: cached.id
      };
    }
  }

  return null;
}

export async function analyzeFailureRecord(record, options = {}) {
  const {
    previewOnly = false,
    noAi = false,
    useCache = true
  } = options;

  const inspected = await inspectFailureRecord(record, { useCache });
  if (inspected) {
    return inspected;
  }

  if (previewOnly || noAi) {
    return {
      source: "none",
      summary: "",
      suggestions: [],
      aiResult: null,
      deterministicHints: null,
      reusedFromId: null
    };
  }

  const aiResult = await explainErrorWithAI(record.errorTextSanitized, {
    projectContext: record.projectContextSnapshot || ""
  });

  return {
    source: "ai",
    summary: aiResult.explanation || "",
    suggestions: buildAiSuggestions(aiResult),
    aiResult,
    deterministicHints: null,
    reusedFromId: null
  };
}
