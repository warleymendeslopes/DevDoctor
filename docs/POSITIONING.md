# Posicionamento oficial — DevDoctor CLI

## O que é

- **Wrapper de execução** que detecta falha no output do terminal e pede uma **explicação estruturada** a um provedor de IA (OpenAI, Gemini ou Ollama local).
- **Não** é um agente autônomo que navega no repositório, edita arquivos ou executa multi-passos como algumas integrações de IDE/terminal.

## O que não é

- Substituto de linter, formatter ou test runner.
- Substituto de “colar no ChatGPT” sem valor adicionado: o DevDoctor **padroniza captura**, opcionalmente **injeta contexto mínimo do projeto**, oferece **sanitização**, **preview** e **explicação da última falha** sem rerodar comandos.

## Público-alvo

- Desenvolvedores que perdem tempo interpretando mensagens de erro de build, bundlers, test runners e CLIs.
- Times que querem **Ollama** para reduzir envio de dados à nuvem.

## Mensagem principal (elevator pitch)

> “Rode o comando como sempre; se falhar, o DevDoctor explica o erro em português claro, com o provedor de IA que você escolher — inclusive 100% local com Ollama.”

## Diferenciais honestos

1. Mesmo fluxo no terminal (sem copiar/colar).
2. Suporte a **Ollama** para privacidade e custo zero de API.
3. **Última falha** persistida + comando `explain` para adiar a IA.
4. **Sanitização + preview** para ambientes mais sensíveis.

## Riscos a comunicar

- Qualidade depende do modelo.
- Sanitização heurística não cobre todos os segredos; revisão humana continua necessária em cenários críticos.
