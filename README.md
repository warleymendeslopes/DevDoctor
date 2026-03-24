# DevDoctor CLI

Ferramenta de linha de comando em Node.js que **executa seus comandos** (build, testes, scripts) e, quando algo dá errado, **explica o erro em linguagem simples** com IA — direto no terminal, sem copiar stack traces para o navegador.

Útil para ganhar contexto rápido em falhas de build local, testes e ferramentas de desenvolvimento.

## Instalação

```bash
npm install
npm link
```

## Uso

Prefixe qualquer comando com `devdoctor`:

```bash
devdoctor npm run dev
```

O programa roda como de costume; a saída original aparece em `stdout` e `stderr`. Se um erro for detectado, o DevDoctor mostra uma explicação no final.

## Configuração do provedor de IA

```bash
devdoctor setup
```

O assistente pergunta qual provedor usar:

1. **OpenAI (GPT)** — chave de API começando com `sk-` (digitação oculta no terminal interativo)
2. **Google Gemini** — chave no [Google AI Studio](https://aistudio.google.com/) (prefixo típico `AIza`) e, opcionalmente, o nome do modelo
3. **Ollama** — servidor local (URL base, ex.: `http://127.0.0.1:11434`) e nome do modelo (ex.: `llama3`)

A configuração fica em `~/.devdoctor/config.json`.

### Variáveis de ambiente (opcional)

Substituem valores do arquivo de configuração para o provedor ativo:

| Provedor | Variáveis |
|----------|-----------|
| OpenAI | `OPENAI_API_KEY` |
| Gemini | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`, opcional `GEMINI_MODEL` |
| Ollama | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` |

### Ollama

Instale o [Ollama](https://ollama.com/), baixe um modelo (`ollama pull llama3`) e mantenha o servidor acessível na URL configurada (padrão `http://127.0.0.1:11434`).

## Migração

Se você já tinha apenas `openaiApiKey` no `config.json` sem `provider`, o DevDoctor assume **OpenAI** automaticamente.
