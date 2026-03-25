# DevDoctor CLI

[![npm](https://img.shields.io/npm/v/devdoctor-cli.svg)](https://www.npmjs.com/package/devdoctor-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**DevDoctor** is a CLI wrapper that **runs your commands** (build, tests, scripts) and, when something fails, **explains the error in plain language** using AI — without pasting stack traces into a browser.

**In one sentence:** it is **not** a repo-editing agent (like Cursor/Warp agents). It **captures terminal failure**, optionally adds **minimal project context**, and asks your chosen provider (OpenAI, Gemini, or **local Ollama**) for a structured explanation.

**Portuguese:** see [README.md](./README.md).

## Why use it

- **Less mental overhead:** original output stays on `stdout`/`stderr`; analysis appears at the end (or later via `devdoctor explain`).
- **Privacy controls:** basic sanitization before sending, `--preview` to inspect the payload, optional confirmation with `DEVDOCTOR_CONFIRM_SEND=1`.
- **Cost control:** use **Ollama** to avoid the cloud; use hosted APIs when you want stronger models.

## Install

```bash
npm install -g devdoctor-cli
```

From source:

```bash
git clone https://github.com/warleymendeslopes/DevDoctor.git
cd DevDoctor
npm install
npm link
```

Requires **Node.js 18+**.

## Quickstart

```bash
devdoctor setup
devdoctor npm run build
```

Preview what would be sent **without** calling the API:

```bash
devdoctor --preview npm test
```

Skip AI but still **save** the last failure:

```bash
devdoctor --no-ai npm run e2e
devdoctor explain
```

## Commands

- `devdoctor setup` — configure OpenAI, Gemini, or Ollama (`~/.devdoctor/config.json`)
- `devdoctor <command>` — run and analyze on failure
- `devdoctor explain` — explain the **last saved** failure (no rerun)

### Global flags (before the command)

- `--preview` — print sanitized payload; **no** API call
- `--no-ai` — do not call AI; still **persist** failure for `explain`
- `--yes` / `-y` — auto-confirm when `DEVDOCTOR_CONFIRM_SEND=1`

Use `--` to separate flags: `devdoctor --preview -- npm run build`.

### Environment

- `DEVDOCTOR_CONFIRM_SEND=1` — prompt before sending to the provider
- `OPENAI_API_KEY`, `GEMINI_API_KEY` / `GOOGLE_API_KEY`, `GEMINI_MODEL`
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL`

## Project context (optional)

- A short summary of `package.json` is included when present.
- Optional: `.devdoctor/context.md` in the project root (team conventions). Content is truncated.

## Privacy

- Only the analyzed error chunk is sent, after **heuristic sanitization** (API-like strings, Bearer tokens, PEM blocks, very long base64-like chunks).
- **Not a substitute** for human review in regulated environments — use `--preview`, `--no-ai`, or local Ollama.

## Limitations

- Quality depends on the **model** (small local models may be shallow).
- Error detection is **heuristic**; odd tools may not trigger analysis.
- Does not scan the whole repo like an IDE.

## License

MIT — see [LICENSE](./LICENSE).
