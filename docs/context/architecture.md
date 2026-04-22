# Arquitetura resumida

Camadas:
- `bin/`: entrada CLI, roteamento de comandos, help/version.
- `src/commands/`: parse de argumentos e fluxo de cada comando.
- `src/core/`: regra principal (runner, parser, assinatura, hints, deduplicacao, contexto, IA, formatter).
- `src/utils/`: config global, confirmacao de envio e versao.

Fluxo principal:
1. `bin/index.js` recebe argumentos.
2. `src/commands/run.js` aplica flags globais e executa comando.
3. `src/core/runner.js` captura stdout/stderr e detecta erro.
4. `src/core/privacy.js` sanitiza o texto.
5. `src/core/context.js` carrega contexto minimo.
6. `src/core/signature.js` gera assinatura estavel.
7. `src/core/analyzer.js` decide entre hints, cache e IA.
8. `src/core/ai.js` chama o provedor e valida retorno quando necessario.
9. `src/core/formatter.js` ou `src/core/output.js` imprime resposta humana ou JSON.

Mapa estrutural oficial:
- manter alinhado com `estrutura.md`.
