# DevDoctor CLI

CLI em Node.js para interceptar comandos de terminal, detectar erros e explicar de forma simples com IA.

## Instalacao

```bash
npm install
npm link
```

## Uso

Execute qualquer comando usando o prefixo `devdoctor`:

```bash
devdoctor npm run dev
```

O comando original roda normalmente, com logs originais em `stdout` e `stderr`.
Se um erro for detectado, o DevDoctor mostra uma explicacao no final.

## Setup do provedor de IA

```bash
devdoctor setup
```

O assistente pergunta qual provedor usar:

1. **OpenAI (GPT)** — API key comecando com `sk-` (digitacao oculta em terminal interativo)
2. **Google Gemini** — API key do [Google AI Studio](https://aistudio.google.com/) (prefixo tipico `AIza`) e opcionalmente o nome do modelo
3. **Ollama** — servidor local (URL base, ex.: `http://127.0.0.1:11434`) e nome do modelo (ex.: `llama3`)

Tudo fica salvo em `~/.devdoctor/config.json`.

### Variaveis de ambiente (opcional)

Sobrescrevem valores do arquivo de config para o provedor ativo:

| Provedor | Variaveis |
|----------|-----------|
| OpenAI | `OPENAI_API_KEY` |
| Gemini | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`, opcional `GEMINI_MODEL` |
| Ollama | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` |

### Ollama

Instale o [Ollama](https://ollama.com/), baixe um modelo (`ollama pull llama3`) e deixe o servidor acessivel na URL configurada (padrao `http://127.0.0.1:11434`).

## Migracao

Se voce ja tinha apenas `openaiApiKey` no `config.json` sem `provider`, o DevDoctor assume **OpenAI** automaticamente.
# DevDoctor
