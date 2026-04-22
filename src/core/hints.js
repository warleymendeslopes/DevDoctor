function normalizeText(text) {
  return (text || "").toLowerCase();
}

function buildHint(key, title, summary, suggestions, confidence = "high") {
  return {
    key,
    title,
    summary,
    suggestions,
    confidence
  };
}

export function getDeterministicHints(errorText) {
  const text = errorText || "";
  const lower = normalizeText(text);
  const hints = [];

  if (lower.includes("eresolve unable to resolve dependency tree")) {
    hints.push(
      buildHint(
        "npm-eresolve",
        "Conflito de dependencias do npm",
        "O npm encontrou versoes incompativeis entre dependencias ou peerDependencies.",
        [
          "Revise as peerDependencies citadas no erro e alinhe as versoes pedidas.",
          "Rode `npm ls <pacote>` para localizar quem exige a versao conflitante.",
          "Use `npm install` com versoes compativeis; `--legacy-peer-deps` deve ser ultimo recurso."
        ]
      )
    );
  }

  if (lower.includes("tsc") || lower.includes("typescript") || /\bts\d{4}\b/i.test(text)) {
    hints.push(
      buildHint(
        "typescript",
        "Falha de compilacao TypeScript",
        "Ha um erro de tipagem ou configuracao do TypeScript interrompendo a compilacao.",
        [
          "Rode `npx tsc --noEmit` para reproduzir com foco so na tipagem.",
          "Verifique o codigo `TSxxxx` e o arquivo citado no erro.",
          "Confirme `tsconfig.json`, aliases de path e tipos de dependencias."
        ]
      )
    );
  }

  if (lower.includes("jest") || lower.includes("expect(") || lower.includes("toequal")) {
    hints.push(
      buildHint(
        "jest",
        "Falha de teste Jest",
        "O teste falhou por expectativa incorreta, mock quebrado ou ambiente de teste inconsistente.",
        [
          "Rode o teste isolado com `npx jest <arquivo> --runInBand`.",
          "Compare o valor esperado com o recebido e revise snapshots ou mocks.",
          "Se houver setup global, valide variaveis de ambiente e limpeza entre testes."
        ]
      )
    );
  }

  if (lower.includes("eslint") || lower.includes("no-unused-vars") || lower.includes("parsing error")) {
    hints.push(
      buildHint(
        "eslint",
        "Falha de lint",
        "O lint bloqueou o comando por regra de estilo, parser ou configuracao inconsistente.",
        [
          "Rode `npx eslint .` ou o arquivo citado para ver o erro completo.",
          "Revise a regra mencionada e confirme a config do ESLint/TypeScript parser.",
          "Se o projeto usa formatter automatico, tente aplicar o fixador antes do commit."
        ]
      )
    );
  }

  if (lower.includes("vite") || lower.includes("[vite]")) {
    hints.push(
      buildHint(
        "vite",
        "Falha relacionada ao Vite",
        "O erro aponta para import, plugin, alias ou configuracao de build/dev server do Vite.",
        [
          "Valide aliases e caminhos importados; erros de resolucao sao comuns no Vite.",
          "Revise `vite.config.*` e plugins adicionados recentemente.",
          "Teste um build limpo com cache removido se o erro comecou apos upgrade."
        ]
      )
    );
  }

  if (lower.includes("docker") || lower.includes("dockerfile") || lower.includes("failed to solve")) {
    hints.push(
      buildHint(
        "docker",
        "Falha de build ou execucao Docker",
        "O problema parece estar em etapa de build, contexto, rede ou imagem base do Docker.",
        [
          "Reveja a etapa citada no log e teste o comando `docker build` com logs completos.",
          "Confirme caminhos copiados no Dockerfile e arquivos ignorados por `.dockerignore`.",
          "Se a falha for de rede ou pull, valide acesso ao registry e imagem base."
        ]
      )
    );
  }

  if (lower.includes("node-gyp") || lower.includes("gyp err!") || lower.includes("binding.gyp")) {
    hints.push(
      buildHint(
        "node-gyp",
        "Falha de build nativo com node-gyp",
        "Alguma dependencia nativa nao conseguiu compilar por falta de toolchain ou incompatibilidade de runtime.",
        [
          "Confirme versao do Node suportada pelo pacote nativo.",
          "Verifique toolchain local: Python, compilador C/C++ e ferramentas do sistema.",
          "Tente reinstalar dependencias apos alinhar ambiente e limpar cache."
        ]
      )
    );
  }

  return hints;
}

export function buildHintsSummary(hints) {
  if (!hints || hints.length === 0) {
    return "";
  }

  if (hints.length === 1) {
    return hints[0].summary;
  }

  return `Foram encontrados ${hints.length} padroes conhecidos relacionados a esta falha.`;
}
